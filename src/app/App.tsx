/**
 * MULESHIELD - FINANCIAL FORENSICS ENGINE
 * 
 * SEMANTIC CORRECTNESS GUARANTEES:
 * 
 * 1. RISK SCORES ARE NUMERIC (0-100):
 *    - All risk values are numeric scores
 *    - Risk levels (Low/Medium/High) are DERIVED labels
 *    - Single source of truth: forensics-semantics.ts
 * 
 * 2. RING RISK USES PATTERN-SPECIFIC FORMULAS:
 *    - Each pattern type (cycle, fan-in, fan-out, shell) has its own formula
 *    - Combines member scores + pattern bonuses + logarithmic scaling
 *    - Computed ONCE during detection using each ring's member set
 *    - NEVER recomputed on selection/filtering
 * 
 * 3. ACCOUNT IDENTITY vs INFERENCE:
 *    - Account IDs are immutable identifiers
 *    - Roles (mule, hub, etc.) are inferred classifications
 *    - Always displayed separately
 * 
 * 4. PATTERN TOGGLES ARE REAL VISIBILITY FILTERS:
 *    - Filter nodes/edges based on precomputed pattern flags
 *    - Do NOT trigger recomputation or alter scores
 *    - Use AND logic when multiple patterns selected
 *    - Synchronize across graph, rings, and alerts
 * 
 * 5. THRESHOLD SLIDER FILTERS ENTITIES:
 *    - Does NOT modify scores
 *    - Same count across thresholds is valid behavior
 * 
 * 6. LARGE-DATA SAFETY:
 *    - Chunked ingestion (2K tx/chunk)
 *    - Limited rendering (1.5K nodes max)
 *    - Per-node transaction cap (50 tx for display)
 * 
 * 7. CONSISTENCY ENFORCEMENT:
 *    - Single source of truth for all risk data
 *    - No duplicated logic
 *    - Validated by forensics-semantics.ts
 */

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { FileUpload } from './components/FileUpload';
import { GraphView } from './components/GraphView';
import { StatsPanel } from './components/StatsPanel';
import { RingList } from './components/RingList';
import { LoginModal } from './components/LoginModal';
import { HistoryView } from './components/HistoryView';
import { PricingView } from './components/PricingView';
import { SettingsView } from './components/SettingsView';
import { TransactionIntelligence } from './components/TransactionIntelligence';
import { AlertsPanel } from './components/AlertsPanel';
import { GraphControls } from './components/GraphControls';
import { RiskThresholdControl } from './components/RiskThresholdControl';
import { PatternFilters } from './components/PatternFilters';
import { EvidenceActions } from './components/EvidenceActions';
import { FraudRingSelector } from './components/FraudRingSelector';
import { GraphSizeController } from './components/GraphSizeController';
import { AnalysisProgress, ProgressState } from './components/AnalysisProgress';
import { GraphAnalysisResult, Transaction } from './lib/types';
import { uploadAndAnalyze, serializeAnalysisResult } from './lib/chunked-uploader';
import { getCurrentUser, logout, CurrentUser } from './lib/local-auth';
import { addHistoryEntry, migrateLegacyHistory } from './lib/local-history';
import { GroundTruthPanel } from './components/GroundTruthPanel';
import { 
  Download, 
  Activity, 
  ArrowLeft, 
  Shield, 
  Menu, 
  X,
  LayoutDashboard,
  History,
  CreditCard,
  Settings,
  LogOut,
  Clock,
  Cpu,
  User as UserIcon,
  Filter
} from 'lucide-react';



function App() {
  const [status, setStatus] = useState<'IDLE' | 'PROCESSING' | 'ANALYZED'>('IDLE');
  const [view, setView] = useState<'DASHBOARD' | 'HISTORY' | 'PRICING' | 'SETTINGS'>('DASHBOARD');
  const [data, setData] = useState<GraphAnalysisResult | null>(null);
  const [executionTime, setExecutionTime] = useState<number>(0);
  const [selectedRingId, setSelectedRingId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [currentFilename, setCurrentFilename] = useState<string>('');
  
  // New investigation controls state
  const [riskThreshold, setRiskThreshold] = useState(50);
  const [timeWindow, setTimeWindow] = useState<'24h' | '7d' | '30d' | 'custom'>('7d');
  const [enabledPatterns, setEnabledPatterns] = useState({
    circular: true,
    fanPattern: true,
    rapidPassThrough: true
  });
  const [showLabels, setShowLabels] = useState(true);
  const [showDirectionArrows, setShowDirectionArrows] = useState(true);
  const [highlightMoneyFlow, setHighlightMoneyFlow] = useState(false);
  const [isIntelligencePanelOpen, setIsIntelligencePanelOpen] = useState(false);
  
  // Chunked processing state
  const [progressState, setProgressState] = useState<ProgressState | null>(null);
  const [graphDisplayMode, setGraphDisplayMode] = useState<'top-risk' | 'selected-ring' | 'filtered' | 'all'>('top-risk');

  // No cyRef needed — GraphView manages its own Cytoscape instance internally

  // Theme state
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('theme');
      if (stored) return stored === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // Auth State - Load from localStorage on mount
  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
    // Migrate any oversized legacy history keys left from the old storage format
    if (currentUser) {
      try { migrateLegacyHistory(currentUser.id); } catch { /* non-fatal */ }
    }
  }, []);

  const saveAnalysisToHistory = useCallback((result: GraphAnalysisResult, filename: string) => {
    if (!user) return;
    try {
      addHistoryEntry(user.id, filename, result);
    } catch (err) {
      // History save failure is non-fatal — analysis results are still shown
      console.warn('History save skipped (storage full or unavailable):', err);
    }
  }, [user]);

  const handleDataLoaded = useCallback(async (transactions: Transaction[], filename?: string) => {
    setStatus('PROCESSING');
    setView('DASHBOARD');
    setCurrentFilename(filename || 'unknown-file.csv');
    
    // Initialize progress tracking
    setProgressState({
      status: 'uploading',
      percent: 0,
      message: 'Preparing to upload...'
    });
    
    setTimeout(async () => {
      try {
        const startTime = performance.now();
        
        // Use chunked uploader with progress tracking
        const result = await uploadAndAnalyze(transactions, (progress) => {
          setProgressState(progress);
        });

        const endTime = performance.now();
        const time = endTime - startTime;
        
        setExecutionTime(time);
        setData(result);
        setStatus('ANALYZED');

        // Auto-save if logged in — use the local filename parameter (not stale state)
        if (user && filename) {
            saveAnalysisToHistory(result, filename);
        }
      } catch (error: any) {
        console.error("Processing failed", error);
        setProgressState({
          status: 'failed',
          percent: 0,
          message: error.message || "Processing failed. Please try again."
        });
        
        // Allow user to retry
        setTimeout(() => {
          setStatus('IDLE');
          setProgressState(null);
        }, 5000);
      }
    }, 100);
  }, [user]);

  const handleHistorySelect = useCallback((historyData: GraphAnalysisResult, filename: string) => {
    setData(historyData);
    setCurrentFilename(filename);
    setExecutionTime(0);
    setStatus('ANALYZED');
    setView('DASHBOARD');
    setIsSidebarOpen(false);
  }, []);

  const handleLogout = useCallback(() => {
    logout();
    setUser(null);
    setView('DASHBOARD');
    setData(null);
    setStatus('IDLE');
    setCurrentFilename('');
    setIsSidebarOpen(false);
  }, []);

  const handleDownloadJSON = useCallback(() => {
    if (!data) return;
    const output = {
      metadata: {
        timestamp: new Date().toISOString(),
        execution_time_ms: executionTime,
        total_transactions: data.metadata.total_transactions,
        total_volume: data.metadata.total_volume,
        algorithm_version: '1.0.0',
      },
      suspicious_entities: data.suspicious_nodes.sort((a, b) => b.score.total - a.score.total).map(n => ({
        account_id: n.id,
        suspicion_score: parseFloat(n.score.total.toFixed(2)),
        score_breakdown: { structural: n.score.structural, behavioral: n.score.behavioral, network: n.score.network },
        risk_factors: n.score.details?.risk_factors || [],
        patterns: n.score.details?.patterns || [],
      })),
      fraud_rings: data.rings.map(r => ({
        ring_id: r.id,
        risk_score: parseFloat(r.risk_score.toFixed(2)),
        member_count: r.nodes.length,
        members: r.nodes,
        patterns: r.patterns,
      })),
    };
    const blob = new Blob([JSON.stringify(output, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(currentFilename || 'analysis').replace(/\.[^/.]+$/, '')}-results-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [data, executionTime, currentFilename]);

  const handleNodeSelect = useCallback((nodeId: string | null) => {
    setSelectedNodeId(nodeId);
    setIsIntelligencePanelOpen(!!nodeId);
    if (nodeId && data) {
      const ring = data.rings.find(r => r.nodes.includes(nodeId));
      setSelectedRingId(ring ? ring.id : null);
    }
  }, [data]);

  const handlePatternToggle = useCallback((pattern: 'circular' | 'fanPattern' | 'rapidPassThrough') => {
    setEnabledPatterns(prev => ({ ...prev, [pattern]: !prev[pattern] }));
  }, []);

  // GraphView manages its own zoom internally; these are no-ops kept for API compat
  const handleZoomIn    = useCallback(() => {}, []);
  const handleZoomOut   = useCallback(() => {}, []);
  const handleResetView = useCallback(() => {}, []);

  const handleToggleLabels         = useCallback(() => setShowLabels(v => !v),          []);
  const handleToggleDirectionArrows = useCallback(() => setShowDirectionArrows(v => !v), []);
  const handleToggleMoneyFlow      = useCallback(() => setHighlightMoneyFlow(v => !v),   []);

  // Stable callback for AlertsPanel node clicks
  const handleAlertNodeClick = useCallback((nodeId: string) => {
    handleNodeSelect(nodeId);
    setIsIntelligencePanelOpen(true);
  }, [handleNodeSelect]);

  const handleMarkInvestigated = useCallback(() => {
    console.log('Marked as investigated:', selectedNodeId);
  }, [selectedNodeId]);

  const handleFlagCompliance = useCallback(() => {
    console.log('Flagged for compliance:', selectedNodeId);
  }, [selectedNodeId]);

  const handleExportEvidence = useCallback(() => {
    if (!data || !selectedNodeId) return;
    const node = data.nodes.get(selectedNodeId);
    const susp = data.suspicious_nodes.find(n => n.id === selectedNodeId);
    const evidenceBundle = {
      metadata: { timestamp: new Date().toISOString(), entity_id: selectedNodeId, analyst: user?.email || 'Unknown', case_id: `CASE_${Date.now()}` },
      entity_profile: node ? {
        id: node.id,
        total_inbound:  node.transactions_in.reduce((s, t) => s + t.amount, 0),
        total_outbound: node.transactions_out.reduce((s, t) => s + t.amount, 0),
        velocity: node.velocity,
        active_days: node.active_days,
      } : null,
      risk_assessment: susp ? {
        total_score: susp.score.total, structural: susp.score.structural,
        behavioral: susp.score.behavioral, network: susp.score.network,
        patterns: susp.score.details?.patterns || [], risk_factors: susp.score.details?.risk_factors || [],
      } : null,
      transactions: node ? [...node.transactions_in, ...node.transactions_out] : [],
    };
    const blob = new Blob([JSON.stringify(evidenceBundle, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `evidence-bundle-${selectedNodeId}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [data, selectedNodeId, user]);

  // ────────────────────────────────────────────────────────────────────────────
  // PATTERN FILTERING LOGIC (Source of Truth)
  // ────────────────────────────────────────────────────────────────────────────
  
  /**
   * Applies pattern filters to suspicious nodes.
   * Returns only nodes matching ALL enabled patterns (AND logic).
   * If no patterns enabled, returns all nodes.
   */
  const filteredData = useMemo(() => {
    if (!data) return null;

    // Determine which patterns are active
    const hasActivePatterns = enabledPatterns.circular || enabledPatterns.fanPattern || enabledPatterns.rapidPassThrough;
    
    if (!hasActivePatterns) {
      // No filters active — return original data
      return data;
    }

    // Filter suspicious nodes based on pattern membership
    const filteredSuspiciousNodes = data.suspicious_nodes.filter(suspNode => {
      const node = data.nodes.get(suspNode.id);
      if (!node) return false;

      const patterns = suspNode.score.details?.patterns || [];
      
      let matches = true;

      // Circular Transfers: must have 'cycle' pattern
      if (enabledPatterns.circular) {
        matches = matches && patterns.includes('cycle');
      }

      // Fan-in / Fan-out: must have 'fan_in' OR 'fan_out' pattern
      if (enabledPatterns.fanPattern) {
        matches = matches && (patterns.includes('fan_in') || patterns.includes('fan_out'));
      }

      // Rapid Pass-through: must have 'shell' pattern (high flow-through ratio)
      if (enabledPatterns.rapidPassThrough) {
        matches = matches && patterns.includes('shell');
      }

      return matches;
    });

    // Create set of visible node IDs
    const visibleNodeIds = new Set(filteredSuspiciousNodes.map(n => n.id));

    // Filter rings: only rings where at least one member node is visible
    const filteredRings = data.rings.filter(ring => 
      ring.nodes.some(nodeId => visibleNodeIds.has(nodeId))
    );

    // Filter edges: only edges where both source and target are visible
    const filteredEdges = data.edges.filter(edge =>
      visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target)
    );

    // Return filtered data structure
    return {
      ...data,
      suspicious_nodes: filteredSuspiciousNodes,
      rings: filteredRings,
      edges: filteredEdges,
    };
  }, [data, enabledPatterns]);

  // O(N) filter — memoised so it only re-runs when filtered data or threshold actually change
  const flaggedCount = useMemo(
    () => filteredData ? filteredData.suspicious_nodes.filter(n => n.score.total >= riskThreshold).length : 0,
    [filteredData, riskThreshold],
  );

  // Clear ring selection if the selected ring gets filtered out
  useEffect(() => {
    if (selectedRingId && filteredData) {
      const ringExists = filteredData.rings.some(r => r.id === selectedRingId);
      if (!ringExists) {
        setSelectedRingId(null);
      }
    }
  }, [selectedRingId, filteredData]);

  const handleRingSelect = useCallback((ringId: string) => {
    setSelectedRingId(ringId);
  }, []);

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-black font-sans text-[#101828] dark:text-white transition-colors duration-300 flex flex-col relative overflow-hidden">
      
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
        onLoginSuccess={(u) => setUser(u)}
      />

      {/* Transaction Intelligence Panel */}
      {isIntelligencePanelOpen && data && selectedNodeId && (
        <TransactionIntelligence 
          selectedNodeId={selectedNodeId}
          data={data} 
          onClose={() => {
            setIsIntelligencePanelOpen(false);
            setSelectedNodeId(null);
          }}
        />
      )}

      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 transition-opacity backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Drawer */}
      <div className={`fixed inset-y-0 left-0 z-[60] w-[280px] bg-white dark:bg-[#111] border-r border-[#e5e7eb] dark:border-[#262626] transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col`}>
         <div className="h-[65px] flex items-center justify-between px-6 border-b border-[#e5e7eb] dark:border-[#262626]">
            <span className="font-semibold text-lg dark:text-white">Menu</span>
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="p-2 hover:bg-slate-100 dark:hover:bg-[#262626] rounded-lg transition-colors text-slate-500 dark:text-[#a1a1a1]"
            >
              <X className="w-5 h-5" />
            </button>
         </div>

         {/* User Profile Section */}
         {user && (
           <div className="px-4 py-3 border-b border-[#e5e7eb] dark:border-[#262626]">
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-200 flex items-center justify-center text-sm font-semibold">
                 {user.email?.[0].toUpperCase()}
               </div>
               <div className="flex-1 min-w-0">
                 <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">{user.name}</div>
                 <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</div>
               </div>
             </div>
           </div>
         )}
         
         <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
            <button 
                onClick={() => { setView('DASHBOARD'); setIsSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${view === 'DASHBOARD' ? 'bg-[#e0e7ff] dark:bg-[#1e40af]/20 text-[#1e40af] dark:text-[#60a5fa]' : 'text-slate-600 dark:text-[#a1a1a1] hover:bg-slate-50 dark:hover:bg-[#171717]'}`}
            >
               <LayoutDashboard className="w-5 h-5" />
               Dashboard
            </button>
            <button 
                onClick={() => { 
                    if (!user) {
                        setIsLoginModalOpen(true);
                    } else {
                        setView('HISTORY'); 
                        setIsSidebarOpen(false); 
                    }
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${view === 'HISTORY' ? 'bg-[#e0e7ff] dark:bg-[#1e40af]/20 text-[#1e40af] dark:text-[#60a5fa]' : 'text-slate-600 dark:text-[#a1a1a1] hover:bg-slate-50 dark:hover:bg-[#171717]'}`}
            >
               <History className="w-5 h-5" />
               History
            </button>
            <button 
                onClick={() => { setView('PRICING'); setIsSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${view === 'PRICING' ? 'bg-[#e0e7ff] dark:bg-[#1e40af]/20 text-[#1e40af] dark:text-[#60a5fa]' : 'text-slate-600 dark:text-[#a1a1a1] hover:bg-slate-50 dark:hover:bg-[#171717]'}`}
            >
               <CreditCard className="w-5 h-5" />
               Pricing
            </button>
            <button 
                onClick={() => { setView('SETTINGS'); setIsSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${view === 'SETTINGS' ? 'bg-[#e0e7ff] dark:bg-[#1e40af]/20 text-[#1e40af] dark:text-[#60a5fa]' : 'text-slate-600 dark:text-[#a1a1a1] hover:bg-slate-50 dark:hover:bg-[#171717]'}`}
            >
               <Settings className="w-5 h-5" />
               Settings
            </button>
         </div>

         <div className="p-4 border-t border-[#e5e7eb] dark:border-[#262626]">
             {user ? (
                 <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg font-medium transition-colors"
                 >
                   <LogOut className="w-5 h-5" />
                   Log out
                </button>
             ) : (
                <button 
                    onClick={() => { setIsLoginModalOpen(true); setIsSidebarOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-[#1e40af] dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10 rounded-lg font-medium transition-colors"
                 >
                   <UserIcon className="w-5 h-5" />
                   Log In
                </button>
             )}
         </div>
      </div>

      {/* Header */}
      <header className="bg-white dark:bg-black border-b border-[#e5e7eb] dark:border-[#262626] sticky top-0 z-40 h-[65px] transition-colors duration-300">
        <div className="max-w-[1161px] mx-auto h-full px-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <button 
                  onClick={() => setIsSidebarOpen(true)}
                  className="p-2 -ml-2 rounded-lg hover:bg-slate-100 dark:hover:bg-[#171717] text-slate-600 dark:text-[#a1a1a1] transition-colors"
                >
                  <Menu className="w-6 h-6" />
                </button>
                <div className="w-[40px] h-[40px] bg-[#1e40af] rounded-[10px] flex items-center justify-center text-white shrink-0">
                    <Shield className="w-6 h-6" />
                </div>
                <span className="font-semibold text-[20px] tracking-[-0.45px] text-slate-900 dark:text-white">MuleGuard</span>
            </div>

            <div className="flex items-center gap-4">
              
              {status === 'ANALYZED' && view === 'DASHBOARD' ? (
                  <div className="flex items-center gap-3">
                      <button 
                        onClick={() => { setStatus('IDLE'); setData(null); }}
                        className="hidden md:flex items-center gap-2 px-4 py-2 text-[#4a5565] dark:text-[#d4d4d4] border border-[#d1d5dc] dark:border-[#262626] rounded-[10px] hover:bg-slate-50 dark:hover:bg-[#171717] text-[16px] transition-colors"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        <span>New Scan</span>
                      </button>
                      <button 
                        onClick={handleDownloadJSON}
                        className="flex items-center gap-2 px-4 py-2 bg-[#1e40af] text-white rounded-[10px] hover:bg-[#1a3a9e] text-[16px] font-medium transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        <span className="hidden md:inline">Export</span>
                      </button>
                  </div>
              ) : (
                  !user && (
                    <button 
                        onClick={() => setIsLoginModalOpen(true)}
                        className="hidden md:block px-4 py-2 border border-[#d1d5dc] dark:border-[#262626] rounded-[10px] text-[#364153] dark:text-[#d4d4d4] hover:bg-slate-50 dark:hover:bg-[#171717] transition-colors"
                    >
                        Log in
                    </button>
                  )
              )}
              
              {user && (
                 <div className="flex items-center gap-2">
                   <span className="hidden md:inline text-sm text-slate-700 dark:text-slate-300">{user.name}</span>
                   <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-200 flex items-center justify-center text-sm font-semibold" title={user.email}>
                      {user.email?.[0].toUpperCase()}
                   </div>
                 </div>
              )}
            </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1161px] mx-auto px-8 py-12 flex-1 w-full">
        
        {view === 'PRICING' ? (
            <PricingView />
        ) : view === 'SETTINGS' ? (
            <SettingsView />
        ) : view === 'HISTORY' ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-[#101828] dark:text-white mb-2">Scan History</h1>
                    <p className="text-[#4a5565] dark:text-[#a1a1a1]">View and manage your past transaction analyses.</p>
                </div>
                <HistoryView user={user} onSelectHistory={handleHistorySelect} />
            </div>
        ) : (
            <>
                {status === 'IDLE' && (
                <div className="max-w-[896px] mx-auto pt-8 flex flex-col gap-12">
                    <div className="text-center space-y-4">
                        <h1 className="text-[48px] font-bold text-[#101828] dark:text-white leading-[1.2] tracking-[-0.6px]">
                            Detect Money Laundering
                        </h1>
                        <p className="text-[20px] text-[#4a5565] dark:text-[#a1a1a1] leading-[1.4] max-w-2xl mx-auto tracking-[-0.45px]">
                            Upload your transaction logs. Our graph algorithms detect smurfing, circular routing, and mule rings in seconds.
                        </p>
                    </div>

                    {/* Upload Card */}
                    <div className="bg-white dark:bg-[#171717] rounded-[16px] shadow-[0px_10px_15px_0px_rgba(0,0,0,0.1),0px_4px_6px_0px_rgba(0,0,0,0.1)] dark:shadow-none p-6 transition-colors border border-[#e5e7eb] dark:border-[#262626] h-auto dark:h-[162px] flex flex-col justify-center">
                        <FileUpload onDataLoaded={handleDataLoaded} />
                    </div>

                    {/* Feature Pills */}
                    <div className="flex flex-wrap justify-center gap-3">
                        <div className="bg-[#f3f4f6] dark:bg-[#171717] px-4 py-2 rounded-full text-[#364153] dark:text-[#d4d4d4] text-sm font-medium transition-colors border border-transparent dark:border-[#262626]">
                            Identify Smurfing Patterns
                        </div>
                        <div className="bg-[#f3f4f6] dark:bg-[#171717] px-4 py-2 rounded-full text-[#364153] dark:text-[#d4d4d4] text-sm font-medium transition-colors border border-transparent dark:border-[#262626]">
                            Detect Circular Routing
                        </div>
                        <div className="bg-[#f3f4f6] dark:bg-[#171717] px-4 py-2 rounded-full text-[#364153] dark:text-[#d4d4d4] text-sm font-medium transition-colors border border-transparent dark:border-[#262626]">
                            Analyze Risk Scores
                        </div>
                        <div className="bg-[#f3f4f6] dark:bg-[#171717] px-4 py-2 rounded-full text-[#364153] dark:text-[#d4d4d4] text-sm font-medium transition-colors border border-transparent dark:border-[#262626]">
                            PaySim-Calibrated Detection
                        </div>
                    </div>
                </div>
                )}

                {status === 'PROCESSING' && progressState && (
                    <AnalysisProgress progress={progressState} />
                )}

                {status === 'ANALYZED' && data && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="mb-8">
                            {/* 
                              CRITICAL: StatsPanel MUST receive full detection output (data), NOT filteredData.
                              Global metrics (Avg Ring Risk, Total Rings, Suspicious Entities) must be independent 
                              of view-layer filters. See /AVG_RING_RISK_FIX.md for details.
                            */}
                            <StatsPanel data={data} />
                        </div>

                        {/* Warning: Detection found no suspicious entities (rare but valid) */}
                        {data.suspicious_nodes.length === 0 && data.metadata.total_transactions > 0 && (
                            <div className="mb-6 bg-blue-900/20 border border-blue-500/30 rounded-xl p-4 flex items-start gap-3">
                                <div className="text-blue-400 mt-0.5">
                                    <Activity className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-blue-300 font-semibold text-sm mb-1">Clean Dataset Detected</h4>
                                    <p className="text-slate-300 text-xs">
                                        Detection successfully analyzed {data.metadata.total_transactions.toLocaleString()} transactions 
                                        but found no suspicious patterns. This dataset appears to contain legitimate transactions only, 
                                        or the fraud patterns may be too subtle for the current detection thresholds.
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
                            {/* Risk Threshold */}
                            <div className="lg:col-span-2">
                                <RiskThresholdControl 
                                    threshold={riskThreshold}
                                    onThresholdChange={setRiskThreshold}
                                    flaggedCount={flaggedCount}
                                />
                            </div>
                            
                            {/* Pattern Filters */}
                            <div className="lg:col-span-2">
                                <PatternFilters 
                                    timeWindow={timeWindow}
                                    onTimeWindowChange={setTimeWindow}
                                    enabledPatterns={enabledPatterns}
                                    onPatternToggle={handlePatternToggle}
                                    matchingCount={filteredData ? filteredData.suspicious_nodes.length : data.suspicious_nodes.length}
                                    totalCount={data.suspicious_nodes.length}
                                />
                            </div>
                        </div>

                        {/* Empty State when no matches */}
                        {filteredData && filteredData.suspicious_nodes.length === 0 && (enabledPatterns.circular || enabledPatterns.fanPattern || enabledPatterns.rapidPassThrough) && (
                            <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-xl p-8 text-center">
                                <div className="text-slate-400 mb-2">
                                    <Filter className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                    <h3 className="text-lg font-semibold text-slate-300 mb-2">No Matching Entities</h3>
                                    <p className="text-sm">No entities match all selected pattern filters.</p>
                                    <p className="text-xs text-slate-500 mt-2">
                                        Detection analyzed {data.metadata.total_transactions.toLocaleString()} transactions and found {data.suspicious_nodes.length} suspicious entities, 
                                        but none match the current filter combination. Try disabling some pattern filters.
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                            {/* Left Sidebar - Investigation Tools */}
                            <div className="space-y-6">
                                <FraudRingSelector 
                                    rings={filteredData ? filteredData.rings : data.rings}
                                    selectedRingId={selectedRingId}
                                    onSelectRing={setSelectedRingId}
                                />
                                
                                <EvidenceActions 
                                    selectedNodeId={selectedNodeId}
                                    onMarkInvestigated={handleMarkInvestigated}
                                    onFlagCompliance={handleFlagCompliance}
                                    onExportEvidence={handleExportEvidence}
                                />
                            </div>

                            {/* Main Graph Card */}
                            <div className="lg:col-span-2 space-y-6">
                                <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-xl shadow-sm p-6 transition-colors relative">
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="text-lg font-semibold text-slate-200">Network Visualization</h3>
                                        <div className="flex items-center gap-2 text-sm text-slate-400 bg-[#0f0f0f] px-3 py-1 rounded-full border border-[#262626]">
                                            <Activity className="w-4 h-4" />
                                            {data.nodes.size} Nodes • {data.edges.length} Edges
                                        </div>
                                    </div>
                                    <div className="rounded-xl overflow-hidden border border-[#262626] bg-black relative">
                                        <GraphControls 
                                            onZoomIn={handleZoomIn}
                                            onZoomOut={handleZoomOut}
                                            onResetView={handleResetView}
                                            showLabels={showLabels}
                                            onToggleLabels={handleToggleLabels}
                                            showDirectionArrows={showDirectionArrows}
                                            onToggleDirectionArrows={handleToggleDirectionArrows}
                                            highlightMoneyFlow={highlightMoneyFlow}
                                            onToggleMoneyFlow={handleToggleMoneyFlow}
                                        />
                                        <GraphView 
                                            data={filteredData || data} 
                                            onNodeSelect={handleNodeSelect} 
                                            selectedRingId={selectedRingId} 
                                            isDarkMode={true}
                                            riskThreshold={riskThreshold}
                                            showLabels={showLabels}
                                            showDirectionArrows={showDirectionArrows}
                                            highlightMoneyFlow={highlightMoneyFlow}
                                            onZoomIn={handleZoomIn}
                                            onZoomOut={handleZoomOut}
                                            onResetView={handleResetView}
                                            timeWindow={timeWindow}
                                        />
                                    </div>
                                </div>
                                
                                <AlertsPanel 
                                    data={filteredData || data}
                                    onNodeClick={handleAlertNodeClick}
                                />

                                {/* Ground Truth Validation Panel — shown when isFraud labels are present */}
                                {data.ground_truth?.available && (
                                    <GroundTruthPanel groundTruth={data.ground_truth} />
                                )}

                                {/* Analysis Details & Methodology */}
                                <div className="bg-white dark:bg-[#171717] rounded-[16px] shadow-sm border border-[#e5e7eb] dark:border-[#262626] p-6 transition-colors">
                                    <h3 className="text-lg font-semibold text-[#101828] dark:text-white mb-4 flex items-center gap-2">
                                        <Cpu className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                        Analysis Performance & Methodology
                                    </h3>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <div className="flex items-center gap-3 mb-4 p-3 bg-slate-50 dark:bg-black/40 rounded-lg border border-slate-100 dark:border-[#262626]">
                                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-600 dark:text-blue-400">
                                                    <Clock className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <div className="text-sm text-slate-500 dark:text-[#a1a1a1]">Processing Time</div>
                                                    <div className="font-mono text-xl font-bold text-slate-900 dark:text-white">
                                                        {executionTime.toFixed(2)} ms
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <h4 className="font-medium text-slate-900 dark:text-white mb-2 text-sm">Algorithms Executed</h4>
                                            <ul className="space-y-2 text-sm text-slate-600 dark:text-[#a1a1a1]">
                                                <li className="flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                                                    <span><strong>Cycle Detection:</strong> Tarjan's DFS (Depth-Limited)</span>
                                                </li>
                                                <li className="flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                                                    <span><strong>Smurfing:</strong> Time-Window Burst Analysis (72h)</span>
                                                </li>
                                                <li className="flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                                                    <span><strong>Shell Account:</strong> Flow-Through Ratio & Degree Analysis</span>
                                                </li>
                                                {data.ground_truth?.available && (
                                                    <>
                                                    <li className="flex items-center gap-2">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-500"></div>
                                                        <span><strong>Balance Anomaly:</strong> PaySim balance discrepancy detection</span>
                                                    </li>
                                                    <li className="flex items-center gap-2">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-500"></div>
                                                        <span><strong>Account Draining:</strong> Zero-balance post-transfer flagging</span>
                                                    </li>
                                                    <li className="flex items-center gap-2">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-500"></div>
                                                        <span><strong>Tx-Type Weighting:</strong> TRANSFER/CASH_OUT risk boost</span>
                                                    </li>
                                                    </>
                                                )}
                                            </ul>
                                        </div>
                                        
                                        <div className="border-t md:border-t-0 md:border-l border-slate-200 dark:border-[#262626] pt-4 md:pt-0 md:pl-6">
                                            <h4 className="font-medium text-slate-900 dark:text-white mb-3 text-sm">Risk Scoring Model</h4>
                                            <div className="space-y-4">
                                                <div>
                                                    <div className="flex justify-between text-xs mb-1">
                                                        <span className="text-slate-600 dark:text-[#a1a1a1]">Structural Risk (Max 50)</span>
                                                        <span className="text-slate-400 dark:text-[#666]">Topological patterns</span>
                                                    </div>
                                                    <div className="h-1.5 w-full bg-slate-100 dark:bg-[#262626] rounded-full overflow-hidden">
                                                        <div className="h-full bg-blue-500 w-[50%]"></div>
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="flex justify-between text-xs mb-1">
                                                        <span className="text-slate-600 dark:text-[#a1a1a1]">Behavioral Risk (Max 30)</span>
                                                        <span className="text-slate-400 dark:text-[#666]">Velocity & Bursts</span>
                                                    </div>
                                                    <div className="h-1.5 w-full bg-slate-100 dark:bg-[#262626] rounded-full overflow-hidden">
                                                        <div className="h-full bg-purple-500 w-[30%]"></div>
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="flex justify-between text-xs mb-1">
                                                        <span className="text-slate-600 dark:text-[#a1a1a1]">Network Risk (Max 20)</span>
                                                        <span className="text-slate-400 dark:text-[#666]">Association & Rings</span>
                                                    </div>
                                                    <div className="h-1.5 w-full bg-slate-100 dark:bg-[#262626] rounded-full overflow-hidden">
                                                        <div className="h-full bg-orange-500 w-[20%]"></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Sidebar - Rings List */}
                            <div className="space-y-6">
                                <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-xl shadow-sm flex flex-col h-[600px] transition-colors">
                                    <div className="p-6 border-b border-[#1f1f1f]">
                                        <h3 className="font-semibold text-slate-200">Detected Fraud Rings</h3>
                                        <p className="text-sm text-slate-400 mt-1">Groups of accounts acting in concert</p>
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <RingList 
                                            rings={filteredData ? filteredData.rings : data.rings} 
                                            selectedRingId={selectedRingId} 
                                            onSelectRing={handleRingSelect} 
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </>
        )}
      </main>

      {/* Footer - Figma Style */}
      <footer className="bg-white dark:bg-[#171717] border-t border-[#e5e7eb] dark:border-[#262626] py-8 mt-12 transition-colors">
         <div className="max-w-[1161px] mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
               <div className="w-8 h-8 bg-[#1e40af] rounded-[8px] flex items-center justify-center text-white">
                    <Shield className="w-4 h-4" />
               </div>
               <span className="font-semibold text-[#101828] dark:text-white">MuleGuard</span>
            </div>
            
            <div className="flex items-center gap-8 text-sm text-[#4a5565] dark:text-[#a1a1a1]">
               <a href="#" className="hover:text-[#1e40af] dark:hover:text-[#51a2ff]">Privacy Policy</a>
               <a href="#" className="hover:text-[#1e40af] dark:hover:text-[#51a2ff]">Terms of Service</a>
            </div>
            
            <div className="text-sm text-[#4a5565] dark:text-[#a1a1a1]">
               © 2026 MuleGuard. All rights reserved.
            </div>
         </div>
      </footer>
    </div>
  );
}

export default App;