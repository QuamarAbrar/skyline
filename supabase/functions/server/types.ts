
export interface Transaction {
  sender: string;
  receiver: string;
  amount: number;
  timestamp: string; // ISO string
  id?: string;
}

export interface NodeMetrics {
  in_degree: number;
  out_degree: number;
  total_degree: number;
  first_seen: number; // timestamp
  last_seen: number; // timestamp
  active_days: number;
  velocity: number; // tx/hour
  unique_counterparties: number;
  time_concentration: number; // ratio
  amount_variance: number;
  flow_through: number; // ratio
}

export interface NodeData extends NodeMetrics {
  id: string;
  transactions_in: Transaction[];
  transactions_out: Transaction[];
  // Graphology/NetworkX metrics
  pagerank?: number;
  betweenness?: number;
}

export interface EdgeData {
  id: string;
  source: string;
  target: string;
  amount: number;
  timestamp: number;
}

export interface SuspicionScore {
  structural: number;
  behavioral: number;
  network: number;
  total: number;
  details: {
    patterns: string[];
    risk_factors: string[];
  };
}

export interface Ring {
  id: string;
  nodes: string[];
  risk_score: number;
  patterns: string[];
  average_suspicion: number;
}

export interface GraphAnalysisResult {
  nodes: Record<string, NodeData>;
  edges: EdgeData[];
  rings: Ring[];
  suspicious_nodes: { id: string; score: SuspicionScore }[];
  metadata: {
    total_transactions: number;
    total_volume: number;
    processed_at: string;
  };
}

// Async Job Types
export interface AnalysisJob {
  jobId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: {
    chunksProcessed: number;
    totalChunks: number;
    percentComplete: number;
  };
  createdAt: string;
  updatedAt: string;
  errorMessage?: string;
}

export interface AnalysisJobResult extends AnalysisJob {
  result?: GraphAnalysisResult;
}
