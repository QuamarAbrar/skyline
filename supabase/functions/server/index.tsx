import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";
import * as kv from "./kv_store.tsx";
import { GraphEngine } from "./graph_engine.ts";
import { ChunkedGraphEngine } from "./chunked_graph_engine.ts";
import { Transaction, AnalysisJob, AnalysisJobResult } from "./types.ts";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-f4878170/health", (c) => {
  return c.json({ status: "ok" });
});

// Signup Route (Server-side to auto-confirm email)
app.post("/make-server-f4878170/signup", async (c) => {
  try {
    const { email, password, name } = await c.req.json();

    if (!email || !password) {
      return c.json({ error: "Email and password are required" }, 400);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
    );

    const { data, error } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      user_metadata: { name: name || 'User' },
      email_confirm: true // Auto-confirm for hackathon/demo
    });

    if (error) {
      console.error("Signup error:", error);
      return c.json({ error: error.message }, 400);
    }

    return c.json({ user: data.user, session: data.session }); // Session is null for admin create usually, user has to login
  } catch (err: any) {
    console.error("Signup exception:", err);
    return c.json({ error: err.message || "Internal Server Error" }, 500);
  }
});

// Advanced Graph Analysis Endpoint - CHUNKED & ASYNC
app.post("/make-server-f4878170/analyze", async (c) => {
  try {
    const body = await c.req.json();
    const transactions = body.transactions as Transaction[];
    const chunkSize = body.chunkSize || 1000; // Default chunk size
    const useAsync = body.async !== false; // Default to async mode

    if (!transactions || !Array.isArray(transactions)) {
       return c.json({ error: "Invalid transactions data" }, 400);
    }

    // HARD LIMIT: Prevent absurdly large datasets
    const MAX_TRANSACTIONS = 1_000_000;
    if (transactions.length > MAX_TRANSACTIONS) {
      return c.json({ 
        error: `Dataset too large. Maximum ${MAX_TRANSACTIONS} transactions allowed.`,
        received: transactions.length 
      }, 413);
    }

    // If dataset is small, process synchronously for speed
    if (transactions.length < 5000 && !useAsync) {
      console.log(`[SYNC] Processing ${transactions.length} transactions synchronously`);
      
      try {
        const engine = new GraphEngine(transactions);
        const result = engine.process();
        return c.json(result);
      } catch (err: any) {
        // Graceful degradation: if sync fails, don't crash
        console.error("Sync processing failed:", err);
        return c.json({ 
          error: "Processing failed. Dataset may be too large for sync mode.",
          suggestion: "Try async mode by setting async=true"
        }, 500);
      }
    }

    // ASYNC MODE: Large datasets
    console.log(`[ASYNC] Queuing ${transactions.length} transactions for chunked processing`);
    
    // Create job ID
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    // Initialize job status
    const job: AnalysisJob = {
      jobId,
      status: 'queued',
      progress: {
        chunksProcessed: 0,
        totalChunks: Math.ceil(transactions.length / chunkSize),
        percentComplete: 0
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Store job status in KV
    await kv.set(`job:${jobId}`, job);

    // Process asynchronously (don't await)
    processJobAsync(jobId, transactions, chunkSize).catch(err => {
      console.error(`Job ${jobId} failed:`, err);
    });

    // Return immediately (async boundary)
    return c.json({ 
      jobId,
      status: 'queued',
      message: `Analysis queued. Poll /analyze/status/${jobId} for progress.`,
      totalChunks: job.progress.totalChunks
    });

  } catch (err: any) {
    console.error("Analysis error:", err);
    return c.json({ error: err.message }, 500);
  }
});

// Job Status Endpoint
app.get("/make-server-f4878170/analyze/status/:jobId", async (c) => {
  try {
    const jobId = c.req.param('jobId');
    const job = await kv.get(`job:${jobId}`) as AnalysisJob | null;

    if (!job) {
      return c.json({ error: "Job not found" }, 404);
    }

    return c.json(job);
  } catch (err: any) {
    console.error("Status check error:", err);
    return c.json({ error: err.message }, 500);
  }
});

// Job Result Endpoint - Returns precomputed summary
app.get("/make-server-f4878170/analyze/result/:jobId", async (c) => {
  try {
    const jobId = c.req.param('jobId');
    const mode = c.req.query('mode') || 'summary'; // 'summary' or 'full'
    
    const job = await kv.get(`job:${jobId}`) as AnalysisJobResult | null;

    if (!job) {
      return c.json({ error: "Job not found" }, 404);
    }

    if (job.status !== 'completed') {
      return c.json({ 
        error: "Job not completed yet",
        status: job.status,
        progress: job.progress
      }, 202); // Accepted but not ready
    }

    if (!job.result) {
      return c.json({ error: "No result available" }, 404);
    }

    // SUMMARY MODE: Return only high-level stats
    if (mode === 'summary') {
      return c.json({
        metadata: job.result.metadata,
        summary: {
          total_nodes: Object.keys(job.result.nodes).length,
          total_edges: job.result.edges.length,
          total_suspicious: job.result.suspicious_nodes.length,
          total_rings: job.result.rings.length,
          top_risks: job.result.suspicious_nodes
            .sort((a, b) => b.score.total - a.score.total)
            .slice(0, 20) // Top 20 only
            .map(n => ({ id: n.id, score: n.score.total }))
        },
        rings: job.result.rings
      });
    }

    // FULL MODE: Return everything (use with caution)
    return c.json(job.result);

  } catch (err: any) {
    console.error("Result fetch error:", err);
    return c.json({ error: err.message }, 500);
  }
});

/**
 * Async job processor - runs in background
 * Processes transactions in chunks to avoid memory spikes
 */
async function processJobAsync(
  jobId: string, 
  transactions: Transaction[], 
  chunkSize: number
): Promise<void> {
  const updateProgress = async (chunksProcessed: number, totalChunks: number, status: 'processing' | 'completed' | 'failed', errorMessage?: string) => {
    const job: AnalysisJob = {
      jobId,
      status,
      progress: {
        chunksProcessed,
        totalChunks,
        percentComplete: Math.round((chunksProcessed / totalChunks) * 100)
      },
      createdAt: (await kv.get(`job:${jobId}`) as AnalysisJob)?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      errorMessage
    };
    await kv.set(`job:${jobId}`, job);
  };

  try {
    const totalChunks = Math.ceil(transactions.length / chunkSize);
    console.log(`[JOB ${jobId}] Starting: ${transactions.length} transactions in ${totalChunks} chunks`);

    await updateProgress(0, totalChunks, 'processing');

    // Initialize chunked engine
    const engine = new ChunkedGraphEngine();

    // Process chunks incrementally
    for (let i = 0; i < transactions.length; i += chunkSize) {
      const chunk = transactions.slice(i, i + chunkSize);
      engine.addChunk(chunk);

      const chunksProcessed = Math.floor(i / chunkSize) + 1;
      await updateProgress(chunksProcessed, totalChunks, 'processing');

      console.log(`[JOB ${jobId}] Processed chunk ${chunksProcessed}/${totalChunks}`);

      // Yield to event loop every chunk to prevent blocking
      await new Promise(resolve => setTimeout(resolve, 0));
    }

    // Finalize metrics
    console.log(`[JOB ${jobId}] Finalizing metrics...`);
    engine.finalizeMetrics();

    // Detect patterns and score
    console.log(`[JOB ${jobId}] Detecting patterns...`);
    const suspiciousNodes = engine.detectPatternsAndScore();

    // Form rings
    console.log(`[JOB ${jobId}] Forming rings...`);
    const rings = engine.formRings(suspiciousNodes);

    // Build final result
    const nodesRecord: Record<string, any> = {};
    engine.getNodes().forEach((val, key) => {
      nodesRecord[key] = val;
    });

    const result = {
      nodes: nodesRecord,
      edges: engine.getEdges(),
      rings,
      suspicious_nodes: suspiciousNodes,
      metadata: engine.getMetadata()
    };

    // Store result
    const jobResult: AnalysisJobResult = {
      jobId,
      status: 'completed',
      progress: {
        chunksProcessed: totalChunks,
        totalChunks,
        percentComplete: 100
      },
      createdAt: (await kv.get(`job:${jobId}`) as AnalysisJob)?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      result
    };

    await kv.set(`job:${jobId}`, jobResult);
    console.log(`[JOB ${jobId}] Completed successfully`);

  } catch (err: any) {
    console.error(`[JOB ${jobId}] Failed:`, err);
    const totalChunks = Math.ceil(transactions.length / chunkSize);
    await updateProgress(0, totalChunks, 'failed', err.message);
  }
}

// Save Analysis Result
app.post("/make-server-f4878170/history", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) return c.json({ error: "Unauthorized" }, 401);

    const accessToken = authHeader.split(' ')[1];
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_ANON_KEY') || '',
    );
    
    // Validate Token
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) return c.json({ error: "Unauthorized" }, 401);

    const body = await c.req.json();
    const { id, ...analysisData } = body;
    
    // Create a key for this analysis
    const timestamp = new Date().toISOString();
    // Use the provided ID or generate a new one, ensure uniqueness
    const recordId = id || `scan_${Date.now()}`;
    const key = `history:${user.id}:${recordId}`;

    // Add metadata for easier listing later if needed, though getByPrefix works on keys
    const record = {
      id: recordId,
      userId: user.id,
      timestamp,
      ...analysisData
    };

    // Store in KV
    // Note: KV store is simple. We can't query by fields, only keys.
    // So getByPrefix(`history:${user.id}:`) is the way to list.
    await kv.set(key, record);

    return c.json({ success: true, id: recordId });
  } catch (err: any) {
    console.error("Save history error:", err);
    return c.json({ error: err.message }, 500);
  }
});

// Get Analysis History
app.get("/make-server-f4878170/history", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) return c.json({ error: "Unauthorized" }, 401);

    const accessToken = authHeader.split(' ')[1];
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_ANON_KEY') || '',
    );
    
    // Validate Token
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) return c.json({ error: "Unauthorized" }, 401);

    // Fetch all keys starting with history:{userId}:
    const prefix = `history:${user.id}:`;
    
    // Note: getByPrefix returns values directly in current implementation of kv_store.tsx
    // "return data?.map((d) => d.value) ?? []"
    const history = await kv.getByPrefix(prefix);

    // Sort by timestamp desc (client side sort is fine, but server side is nice)
    // Since KV store doesn't sort, we do it in memory here
    history.sort((a: any, b: any) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return c.json({ history });
  } catch (err: any) {
    console.error("Get history error:", err);
    return c.json({ error: err.message }, 500);
  }
});

// Delete Analysis Result
app.delete("/make-server-f4878170/history/:id", async (c) => {
    try {
      const authHeader = c.req.header('Authorization');
      if (!authHeader) return c.json({ error: "Unauthorized" }, 401);
  
      const accessToken = authHeader.split(' ')[1];
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') || '',
        Deno.env.get('SUPABASE_ANON_KEY') || '',
      );
      
      const { data: { user }, error } = await supabase.auth.getUser(accessToken);
      if (error || !user) return c.json({ error: "Unauthorized" }, 401);
  
      const id = c.req.param('id');
      const key = `history:${user.id}:${id}`;
      
      await kv.del(key);
  
      return c.json({ success: true });
    } catch (err: any) {
      console.error("Delete history error:", err);
      return c.json({ error: err.message }, 500);
    }
  });

Deno.serve(app.fetch);
