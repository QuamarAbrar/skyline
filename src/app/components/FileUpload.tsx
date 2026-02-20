import React, { useState, useRef, useCallback } from 'react';
import Papa from 'papaparse';
import JSZip from 'jszip';
import { AlertCircle, Plus, Mic, Send, Info } from 'lucide-react';
import { cn } from './ui/utils';
import { Transaction } from '../lib/types';

interface FileUploadProps {
  onDataLoaded: (data: Transaction[], filename?: string) => void;
}

const MAX_TRANSACTIONS = 300_000;

// Helper: detect column keys from a row object
function detectKeys(row: Record<string, string>) {
  const keys = Object.keys(row);
  const findKey = (candidates: string[]) =>
    keys.find(k => candidates.includes(k.toLowerCase())) ||
    keys.find(k => candidates.some(c => k.toLowerCase().includes(c))) ||
    '';

  return {
    senderKey:    findKey(['sender', 'nameorig', 'source', 'from', 'origin', 'customer', 'payer', 'account']),
    receiverKey:  findKey(['receiver', 'namedest', 'target', 'to', 'destination', 'merchant', 'payee', 'beneficiary']),
    amountKey:    findKey(['amount', 'value', 'amt']),
    timestampKey: findKey(['timestamp', 'date', 'datetime', 'time', 'step']),
    // PaySim-specific column detection
    typeKey:           findKey(['type']),
    isFraudKey:        findKey(['isfraud', 'is_fraud', 'fraud']),
    isFlaggedFraudKey: findKey(['isflaggedfraud', 'is_flagged_fraud', 'flaggedfraud']),
    oldBalanceOrigKey: findKey(['oldbalanceorg', 'oldbalanceorig', 'old_balance_org', 'balance_orig']),
    newBalanceOrigKey: findKey(['newbalanceorig', 'newbalanceorg', 'new_balance_orig']),
    oldBalanceDestKey: findKey(['oldbalancedest', 'old_balance_dest', 'balance_dest']),
    newBalanceDestKey: findKey(['newbalancedest', 'new_balance_dest']),
  };
}

// Parse a single row into a Transaction, returns null if invalid
function parseRow(
  row: Record<string, string>,
  senderKey: string,
  receiverKey: string,
  amountKey: string,
  timestampKey: string,
  now: Date,
  paySimKeys?: {
    typeKey?: string;
    isFraudKey?: string;
    isFlaggedFraudKey?: string;
    oldBalanceOrigKey?: string;
    newBalanceOrigKey?: string;
    oldBalanceDestKey?: string;
    newBalanceDestKey?: string;
  }
): Transaction | null {
  const amount = parseFloat(row[amountKey]);
  if (isNaN(amount)) return null;

  const sender   = String(row[senderKey]   || '').trim();
  const receiver = String(row[receiverKey] || '').trim();
  if (!sender || !receiver) return null;

  let timestamp = new Date().toISOString();
  if (timestampKey && row[timestampKey]) {
    const val = row[timestampKey];
    if (!isNaN(Number(val)) && String(val).trim().length < 10) {
      // Numeric step column (e.g. PaySim "step")
      const step = Number(val);
      timestamp = new Date(
        now.getTime() - 30 * 24 * 3600 * 1000 + step * 3600 * 1000
      ).toISOString();
    } else {
      const d = new Date(val);
      if (!isNaN(d.getTime())) timestamp = d.toISOString();
    }
  }

  const tx: Transaction = { sender, receiver, amount, timestamp };

  // Attach PaySim-specific fields when columns are present
  if (paySimKeys) {
    if (paySimKeys.typeKey && row[paySimKeys.typeKey]) {
      tx.txType = String(row[paySimKeys.typeKey]).trim().toUpperCase();
    }
    if (paySimKeys.isFraudKey && row[paySimKeys.isFraudKey] !== undefined) {
      const v = String(row[paySimKeys.isFraudKey]).trim();
      tx.isFraud = v === '1' || v.toLowerCase() === 'true';
    }
    if (paySimKeys.isFlaggedFraudKey && row[paySimKeys.isFlaggedFraudKey] !== undefined) {
      const v = String(row[paySimKeys.isFlaggedFraudKey]).trim();
      tx.isFlaggedFraud = v === '1' || v.toLowerCase() === 'true';
    }
    const parseOpt = (key: string | undefined) => {
      if (!key || !row[key]) return undefined;
      const n = parseFloat(row[key]);
      return isNaN(n) ? undefined : n;
    };
    tx.oldBalanceOrig = parseOpt(paySimKeys.oldBalanceOrigKey);
    tx.newBalanceOrig = parseOpt(paySimKeys.newBalanceOrigKey);
    tx.oldBalanceDest = parseOpt(paySimKeys.oldBalanceDestKey);
    tx.newBalanceDest = parseOpt(paySimKeys.newBalanceDestKey);
  }

  return tx;
}

// Stream-parse a CSV source (File, Blob, or string) with Papa.
// Calls onRow for each parsed row; returning false aborts parsing.
// Returns { processed, hitLimit }
function streamParseCsv(
  source: File | Blob,
  onRow: (row: Record<string, string>) => boolean
): Promise<void> {
  return new Promise(resolve => {
    Papa.parse<Record<string, string>>(source as File, {
      header: true,
      skipEmptyLines: true,
      step(results, parser) {
        const keepGoing = onRow(results.data);
        if (!keepGoing) {
          parser.abort();
          resolve();
        }
      },
      complete: () => resolve(),
      error:    () => resolve(),
    });
  });
}

export function FileUpload({ onDataLoaded }: FileUploadProps) {
  const [isDragging,    setIsDragging]    = useState(false);
  const [error,         setError]         = useState<string | null>(null);
  const [isLoading,     setIsLoading]     = useState(false);
  const [inputText,     setInputText]     = useState('');
  const [sampleWarning, setSampleWarning] = useState<string | null>(null);
  const [isListening,   setIsListening]   = useState(false);
  const fileInputRef    = useRef<HTMLInputElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef  = useRef<any>(null);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  const startListening = useCallback(() => {
    // Detect SpeechRecognition across browsers
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setError('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }
    const recognition = new SR();
    recognition.lang = 'en-US';
    recognition.interimResults = false; // only fire on final result
    recognition.maxAlternatives = 1;
    recognition.continuous = false;     // auto-stop after speech pause

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results as SpeechRecognitionResultList)
        .map((result: SpeechRecognitionResult) => result[0].transcript)
        .join(' ');
      setInputText(prev => (prev ? prev + ' ' + transcript : transcript).trimStart());
      setError(null);
    };

    recognition.onerror = (event: any) => {
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        setError(`Microphone error: ${event.error}. Please check browser permissions.`);
      }
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      setError(null);
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  const handleDragOver  = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };

  const processFile = async (file: File) => {
    setIsLoading(true);
    setError(null);
    setSampleWarning(null);

    try {
      const allTransactions: Transaction[] = [];
      let hitLimit = false;
      const now = new Date();

      // ── ZIP ──────────────────────────────────────────────────────────────
      if (
        file.name.endsWith('.zip') ||
        file.type === 'application/zip' ||
        file.type === 'application/x-zip-compressed'
      ) {
        const zip = await JSZip.loadAsync(file);
        let processedAny = false;

        for (const filename of Object.keys(zip.files)) {
          if (hitLimit || allTransactions.length >= MAX_TRANSACTIONS) {
            hitLimit = true;
            break;
          }

          const entry = zip.files[filename];
          if (entry.dir || filename.startsWith('__MACOSX') || filename.startsWith('.')) continue;

          if (filename.endsWith('.csv') || filename.endsWith('.tsv')) {
            // Use blob → streaming Papa to avoid loading 2+ GB strings into the JS heap
            const blob = await entry.async('blob');

            let senderKey = '', receiverKey = '', amountKey = '', timestampKey = '';
            let headersDetected = false;
            let zipPaySimKeys: Parameters<typeof parseRow>[6] = undefined;

            await streamParseCsv(blob, (row) => {
              if (!headersDetected) {
                const keys = detectKeys(row);
                senderKey    = keys.senderKey;
                receiverKey  = keys.receiverKey;
                amountKey    = keys.amountKey;
                timestampKey = keys.timestampKey;

                if (!senderKey || !receiverKey || !amountKey) {
                  return false; // abort this file
                }
                // Build PaySim keys when extra columns are present
                if (keys.isFraudKey || keys.typeKey || keys.oldBalanceOrigKey) {
                  zipPaySimKeys = {
                    typeKey:           keys.typeKey || undefined,
                    isFraudKey:        keys.isFraudKey || undefined,
                    isFlaggedFraudKey: keys.isFlaggedFraudKey || undefined,
                    oldBalanceOrigKey: keys.oldBalanceOrigKey || undefined,
                    newBalanceOrigKey: keys.newBalanceOrigKey || undefined,
                    oldBalanceDestKey: keys.oldBalanceDestKey || undefined,
                    newBalanceDestKey: keys.newBalanceDestKey || undefined,
                  };
                }
                headersDetected = true;
                processedAny = true;
              }

              if (allTransactions.length >= MAX_TRANSACTIONS) {
                hitLimit = true;
                return false; // abort
              }

              const tx = parseRow(row, senderKey, receiverKey, amountKey, timestampKey, now, zipPaySimKeys);
              if (tx) allTransactions.push(tx);
              return true;
            });

          } else if (filename.endsWith('.json')) {
            const content = await entry.async('string');
            try {
              const jsonData = JSON.parse(content);
              if (Array.isArray(jsonData)) {
                for (const item of jsonData) {
                  if (allTransactions.length >= MAX_TRANSACTIONS) { hitLimit = true; break; }
                  const { senderKey, receiverKey, amountKey, timestampKey } = detectKeys(item);
                  if (!senderKey || !receiverKey || !amountKey) break;
                  const tx = parseRow(item, senderKey, receiverKey, amountKey, timestampKey, now);
                  if (tx) allTransactions.push(tx);
                }
                processedAny = true;
              }
            } catch { /* skip bad JSON */ }
          }
        }

        if (!processedAny && allTransactions.length === 0) {
          throw new Error('No valid CSV or JSON files found in the ZIP archive.');
        }

      // ── JSON file ────────────────────────────────────────────────────────
      } else if (file.name.endsWith('.json') || file.type === 'application/json') {
        const content = await file.text();
        let jsonData: any[];
        try { jsonData = JSON.parse(content); } catch { throw new Error('Invalid JSON format'); }
        if (!Array.isArray(jsonData)) throw new Error('JSON file must contain an array of transactions');

        const slice = jsonData.length > MAX_TRANSACTIONS
          ? (hitLimit = true, jsonData.slice(0, MAX_TRANSACTIONS))
          : jsonData;

        for (const item of slice) {
          const { senderKey, receiverKey, amountKey, timestampKey } = detectKeys(item);
          if (!senderKey || !receiverKey || !amountKey) continue;
          const tx = parseRow(item, senderKey, receiverKey, amountKey, timestampKey, now);
          if (tx) allTransactions.push(tx);
        }

      // ── CSV file (direct) ────────────────────────────────────────────────
      } else {
        let senderKey = '', receiverKey = '', amountKey = '', timestampKey = '';
        let headersDetected = false;
        let hasValidHeaders = true;
        let paySimKeys: Parameters<typeof parseRow>[6] = undefined;

        await streamParseCsv(file, (row) => {
          if (!headersDetected) {
            const keys = detectKeys(row);
            senderKey    = keys.senderKey;
            receiverKey  = keys.receiverKey;
            amountKey    = keys.amountKey;
            timestampKey = keys.timestampKey;

            if (!senderKey || !receiverKey || !amountKey) {
              hasValidHeaders = false;
              return false;
            }
            // Build PaySim keys when extra columns are present
            if (keys.isFraudKey || keys.typeKey || keys.oldBalanceOrigKey) {
              paySimKeys = {
                typeKey:           keys.typeKey || undefined,
                isFraudKey:        keys.isFraudKey || undefined,
                isFlaggedFraudKey: keys.isFlaggedFraudKey || undefined,
                oldBalanceOrigKey: keys.oldBalanceOrigKey || undefined,
                newBalanceOrigKey: keys.newBalanceOrigKey || undefined,
                oldBalanceDestKey: keys.oldBalanceDestKey || undefined,
                newBalanceDestKey: keys.newBalanceDestKey || undefined,
              };
            }
            headersDetected = true;
          }

          if (allTransactions.length >= MAX_TRANSACTIONS) {
            hitLimit = true;
            return false;
          }

          const tx = parseRow(row, senderKey, receiverKey, amountKey, timestampKey, now, paySimKeys);
          if (tx) allTransactions.push(tx);
          return true;
        });

        if (!hasValidHeaders) {
          throw new Error('Missing required fields: sender (or nameOrig), receiver (or nameDest), amount');
        }
      }

      if (allTransactions.length === 0) {
        throw new Error('No valid transactions extracted from the file.');
      }

      // Warn user if we hit the cap
      if (hitLimit) {
        setSampleWarning(
          `Large dataset: loaded the first ${allTransactions.length.toLocaleString()} transactions ` +
          `(cap: ${MAX_TRANSACTIONS.toLocaleString()}). Analysis will run on this sample.`
        );
      }

      // Assign IDs
      const finalData = allTransactions.map((tx, idx) => ({
        ...tx,
        id: tx.id || `tx-${Date.now()}-${idx}`,
      }));

      onDataLoaded(finalData, file.name);

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to process file');
    } finally {
      setIsLoading(false);
    }
  };

  const processTextData = async (text: string) => {
    setIsLoading(true);
    setError(null);
    setSampleWarning(null);
    try {
      const trimmed = text.trim();
      if (!trimmed) {
        setError('Please paste transaction data or upload a file.');
        setIsLoading(false);
        return;
      }

      const allTransactions: Transaction[] = [];
      const now = new Date();

      if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
        const jsonData = JSON.parse(trimmed);
        const arr: any[] = Array.isArray(jsonData) ? jsonData : [jsonData];

        for (const item of arr.slice(0, MAX_TRANSACTIONS)) {
          const keys = detectKeys(item);
          if (!keys.senderKey || !keys.receiverKey || !keys.amountKey) continue;
          const psKeys = (keys.isFraudKey || keys.typeKey || keys.oldBalanceOrigKey) ? {
            typeKey: keys.typeKey || undefined,
            isFraudKey: keys.isFraudKey || undefined,
            isFlaggedFraudKey: keys.isFlaggedFraudKey || undefined,
            oldBalanceOrigKey: keys.oldBalanceOrigKey || undefined,
            newBalanceOrigKey: keys.newBalanceOrigKey || undefined,
            oldBalanceDestKey: keys.oldBalanceDestKey || undefined,
            newBalanceDestKey: keys.newBalanceDestKey || undefined,
          } : undefined;
          const tx = parseRow(item, keys.senderKey, keys.receiverKey, keys.amountKey, keys.timestampKey, now, psKeys);
          if (tx) allTransactions.push(tx);
        }
      } else {
        const results = Papa.parse<Record<string, string>>(trimmed, { header: true, skipEmptyLines: true });
        if (results.errors.length > 0) throw new Error('Could not parse data as CSV or JSON.');

        let pastedPaySimKeys: Parameters<typeof parseRow>[6] = undefined;
        let pastedHeadersDetected = false;

        for (const row of results.data.slice(0, MAX_TRANSACTIONS)) {
          if (!pastedHeadersDetected) {
            const keys = detectKeys(row);
            if (!keys.senderKey || !keys.receiverKey || !keys.amountKey) continue;
            if (keys.isFraudKey || keys.typeKey || keys.oldBalanceOrigKey) {
              pastedPaySimKeys = {
                typeKey: keys.typeKey || undefined,
                isFraudKey: keys.isFraudKey || undefined,
                isFlaggedFraudKey: keys.isFlaggedFraudKey || undefined,
                oldBalanceOrigKey: keys.oldBalanceOrigKey || undefined,
                newBalanceOrigKey: keys.newBalanceOrigKey || undefined,
                oldBalanceDestKey: keys.oldBalanceDestKey || undefined,
                newBalanceDestKey: keys.newBalanceDestKey || undefined,
              };
            }
            pastedHeadersDetected = true;
          }
          const { senderKey, receiverKey, amountKey, timestampKey } = detectKeys(row);
          if (!senderKey || !receiverKey || !amountKey) continue;
          const tx = parseRow(row, senderKey, receiverKey, amountKey, timestampKey, now, pastedPaySimKeys);
          if (tx) allTransactions.push(tx);
        }
      }

      if (allTransactions.length === 0) throw new Error('No valid transactions found in pasted data.');

      const finalData = allTransactions.map((tx, idx) => ({
        ...tx,
        id: tx.id || `tx-${Date.now()}-${idx}`,
      }));
      onDataLoaded(finalData, 'pasted-data.txt');

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to process text input');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) processFile(e.dataTransfer.files[0]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) processFile(e.target.files[0]);
  };

  const handleDemoLoad = () => {
    const dummy: Transaction[] = [];
    const now = Date.now();
    dummy.push({ sender: 'A', receiver: 'B', amount: 1000, timestamp: new Date(now).toISOString() });
    dummy.push({ sender: 'B', receiver: 'C', amount:  950, timestamp: new Date(now + 3_600_000).toISOString() });
    dummy.push({ sender: 'C', receiver: 'A', amount:  900, timestamp: new Date(now + 7_200_000).toISOString() });
    dummy.push({ sender: 'Mule', receiver: 'Placement1', amount: 5000, timestamp: new Date(now).toISOString() });
    for (let i = 0; i < 10; i++) {
      dummy.push({ sender: `Source_${i}`, receiver: 'Mule', amount: 500, timestamp: new Date(now - 3_600_000 * (i + 1)).toISOString() });
    }
    onDataLoaded(dummy.map((t, i) => ({ ...t, id: `demo-${i}` })), 'demo-dataset.csv');
  };

  return (
    <div className="w-full">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'relative flex items-center w-full h-[64px] transition-all duration-200 ease-in-out group',
          isLoading && 'opacity-50 pointer-events-none'
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.json,.zip,application/json,text/csv,application/zip,application/x-zip-compressed"
          className="hidden"
          onChange={handleFileChange}
          disabled={isLoading}
        />


        <div className={cn(
          'flex items-center w-full h-full rounded-full transition-colors relative',
          'bg-[#f0f4f9] dark:bg-[#1e1f20]',
          'hover:bg-[#e2e7eb] dark:hover:bg-[#2a2b2d]',
          isDragging && 'ring-2 ring-blue-400 dark:ring-blue-600 bg-blue-50 dark:bg-blue-900/20'
        )}>
          <div className="pl-4 pr-2 z-10">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-slate-500 dark:text-[#a1a1a1]"
              title="Upload file"
            >
              <Plus className="w-6 h-6" strokeWidth={2} />
            </button>
          </div>

          <div className="flex-1 h-full z-10 relative">
            <input
              type="text"
              value={inputText}
              onChange={e => { setInputText(e.target.value); setError(null); }}
              onFocus={() => setError(null)}
              onKeyDown={e => e.key === 'Enter' && processTextData(inputText)}
              className="w-full h-full bg-transparent border-none outline-none text-slate-700 dark:text-[#d4d4d4] font-inter text-[16px] placeholder:text-slate-500 dark:placeholder:text-[#a1a1a1]/70 focus:ring-0"
              placeholder={isDragging ? 'Drop file here…' : 'Paste transaction data (JSON/CSV) or drop file…'}
            />
          </div>

          <div className="pr-3 flex items-center gap-2 z-10">
            <div className="hidden sm:flex gap-1">

              <button
                type="button"
                onClick={toggleListening}
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200',
                  isListening
                    ? 'bg-red-100 dark:bg-red-900/40 text-red-500 dark:text-red-400 ring-2 ring-red-400 dark:ring-red-600 animate-pulse'
                    : 'hover:bg-black/5 dark:hover:bg-white/10 text-slate-500 dark:text-[#a1a1a1]'
                )}
                title={isListening ? 'Stop listening' : 'Voice input — click and speak'}
              >
                <Mic className="w-5 h-5" strokeWidth={1.5} />
              </button>
            </div>

            {isLoading ? (
              <div className="w-10 h-10 rounded-full bg-transparent flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-slate-400 border-t-blue-600 rounded-full animate-spin" />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => processTextData(inputText)}
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center text-white transition-all duration-200',
                  inputText.length > 0
                    ? 'bg-blue-600 hover:bg-blue-700 dark:bg-[#2b7fff] dark:hover:bg-[#1a6eff]'
                    : 'bg-[#d3d3d3] dark:bg-[#3c4043] cursor-pointer'
                )}
                title={inputText.length > 0 ? 'Analyze text' : 'Analyze'}
              >
                <Send className="w-5 h-5" strokeWidth={2} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Sample / truncation warning */}
      {sampleWarning && (
        <div className="mt-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 flex items-start gap-2 text-sm border border-amber-200 dark:border-amber-700">
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{sampleWarning}</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-4 p-4 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center gap-2 text-sm border border-red-100 dark:border-red-800">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="mt-6 text-center">
        <button
          onClick={handleDemoLoad}
          className="text-[#1e40af] text-sm hover:underline font-medium dark:text-[#51a2ff]"
        >
          Don't have data? Load Demo Dataset
        </button>
      </div>
    </div>
  );
}