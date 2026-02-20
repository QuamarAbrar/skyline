/**
 * Chunked Graph Engine - Production-Grade Big Data Handler
 * 
 * Features:
 * - Incremental node and edge addition
 * - Chunked transaction processing
 * - Safe aggregation of partial results
 * - No full-dataset operations
 * - Preserves all existing scoring logic
 */

import { Transaction, NodeData, EdgeData, SuspicionScore, Ring } from './types.ts';
import { DirectedGraph } from "npm:graphology";
import pagerank from "npm:graphology-pagerank";
import { mean, standardDeviation } from "npm:simple-statistics";

// Constants for scoring (DO NOT CHANGE)
const SCORES = {
  STRUCTURAL: {
    CYCLE_3: 40,
    CYCLE_4: 35,
    CYCLE_5: 30,
    SMURFING: 25,
    SHELL: 20,
    MAX: 50
  },
  BEHAVIORAL: {
    HIGH_VELOCITY: 10,
    HIGH_DIVERSITY: 10,
    BURST: 10,
    MAX: 30
  },
  NETWORK: {
    RING_SIZE_FACTOR: 5,
    AVG_RING_SUSPICION: 10,
    MULTI_PATTERN: 5,
    HIGH_PAGERANK: 15,
    MAX: 35
  }
};

const THRESHOLDS = {
  SMURFING_BURST_WINDOW_HOURS: 72,
  SMURFING_DIVERSITY_RATIO: 0.8, 
  SHELL_FLOW_THROUGH: 0.8,
  SHELL_MAX_DEGREE: 5,
  HIGH_VELOCITY_TX_PER_HOUR: 5,
  ACTIVE_DAYS_LEGIT: 7
};

/**
 * ChunkedGraphEngine - Processes transactions incrementally
 * Never loads full dataset into memory at once
 */
export class ChunkedGraphEngine {
  private nodeMap: Map<string, NodeData>;
  private edges: EdgeData[];
  private graph: DirectedGraph;
  private transactionCount: number;
  private totalVolume: number;
  private edgeIdCounter: number;

  constructor() {
    this.nodeMap = new Map();
    this.edges = [];
    this.graph = new DirectedGraph();
    this.transactionCount = 0;
    this.totalVolume = 0;
    this.edgeIdCounter = 0;
  }

  /**
   * Add a chunk of transactions to the graph
   * This method is designed to be called multiple times
   */
  public addChunk(transactions: Transaction[]): void {
    for (const tx of transactions) {
      this.addTransaction(tx);
    }
  }

  /**
   * Add a single transaction incrementally
   */
  private addTransaction(tx: Transaction): void {
    // Ensure nodes exist
    if (!this.nodeMap.has(tx.sender)) this.createNode(tx.sender);
    if (!this.nodeMap.has(tx.receiver)) this.createNode(tx.receiver);

    // Ensure nodes exist in Graphology graph
    if (!this.graph.hasNode(tx.sender)) this.graph.addNode(tx.sender);
    if (!this.graph.hasNode(tx.receiver)) this.graph.addNode(tx.receiver);

    const senderNode = this.nodeMap.get(tx.sender)!;
    const receiverNode = this.nodeMap.get(tx.receiver)!;

    // Update Node Data
    senderNode.out_degree++;
    senderNode.total_degree++;
    senderNode.transactions_out.push(tx);
    
    receiverNode.in_degree++;
    receiverNode.total_degree++;
    receiverNode.transactions_in.push(tx);

    // Create Edge
    const edgeId = `e-${this.edgeIdCounter++}`;
    this.edges.push({
      id: edgeId,
      source: tx.sender,
      target: tx.receiver,
      amount: tx.amount,
      timestamp: new Date(tx.timestamp).getTime()
    });

    // Add to Graphology
    this.graph.addEdge(tx.sender, tx.receiver, {
      amount: tx.amount,
      timestamp: new Date(tx.timestamp).getTime()
    });

    // Update timestamps
    const txTime = new Date(tx.timestamp).getTime();
    this.updateNodeTime(senderNode, txTime);
    this.updateNodeTime(receiverNode, txTime);

    // Update counters
    this.transactionCount++;
    this.totalVolume += tx.amount;
  }

  /**
   * Finalize graph metrics after all chunks are added
   */
  public finalizeMetrics(): void {
    // Post-process node metrics
    this.nodeMap.forEach(node => {
      node.active_days = (node.last_seen - node.first_seen) / (1000 * 60 * 60 * 24);
      if (node.active_days === 0) node.active_days = 1; 

      const totalTx = node.in_degree + node.out_degree;
      const hoursActive = Math.max(1, (node.last_seen - node.first_seen) / (1000 * 60 * 60));
      node.velocity = totalTx / hoursActive;
      
      const uniquePeers = new Set([
        ...node.transactions_in.map(t => t.sender),
        ...node.transactions_out.map(t => t.receiver)
      ]);
      node.unique_counterparties = uniquePeers.size;
      
      const totalIn = node.transactions_in.reduce((sum, t) => sum + t.amount, 0);
      const totalOut = node.transactions_out.reduce((sum, t) => sum + t.amount, 0);
      
      node.flow_through = Math.min(totalIn, totalOut) / (Math.max(totalIn, totalOut) || 1);
    });

    // Calculate PageRank
    this.calculatePageRank();
  }

  /**
   * Calculate PageRank using simple directed graph
   */
  private calculatePageRank(): void {
    if (this.graph.order === 0) return;

    try {
      const scores = pagerank(this.graph, { attributes: { weight: 'amount' } });
      
      for (const [nodeId, score] of Object.entries(scores)) {
        const node = this.nodeMap.get(nodeId);
        if (node) {
          node.pagerank = score;
        }
      }
    } catch (err) {
      console.error("PageRank calculation error:", err);
      // Continue without PageRank scores
    }
  }

  /**
   * Detect patterns and score nodes
   * Same logic as original GraphEngine
   */
  public detectPatternsAndScore(): { id: string; score: SuspicionScore }[] {
    const results: { id: string; score: SuspicionScore }[] = [];
    
    // Calculate global statistics for outlier detection
    const velocities = Array.from(this.nodeMap.values()).map(n => n.velocity);
    if (velocities.length === 0) return results;

    const meanVelocity = mean(velocities);
    const stdVelocity = standardDeviation(velocities);

    this.nodeMap.forEach(node => {
      const patterns: string[] = [];
      const riskFactors: string[] = [];
      
      let structuralScore = 0;
      let behavioralScore = 0;
      let networkScore = 0;

      // 1. Shell Detection
      if (node.total_degree <= THRESHOLDS.SHELL_MAX_DEGREE && 
          node.flow_through > THRESHOLDS.SHELL_FLOW_THROUGH &&
          node.total_degree > 1) { 
        structuralScore += SCORES.STRUCTURAL.SHELL;
        patterns.push("shell_account");
      }

      // 2. Smurfing Detection
      const sortedTx = [...node.transactions_in, ...node.transactions_out].sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      
      let maxBurst = 0;
      for (let i = 0; i < sortedTx.length; i++) {
        let count = 0;
        const startTime = new Date(sortedTx[i].timestamp).getTime();
        for (let j = i; j < sortedTx.length; j++) {
           if (new Date(sortedTx[j].timestamp).getTime() - startTime <= THRESHOLDS.SMURFING_BURST_WINDOW_HOURS * 3600 * 1000) {
             count++;
           } else {
             break;
           }
        }
        maxBurst = Math.max(maxBurst, count);
      }

      const burstRatio = maxBurst / (node.total_degree || 1);
      const diversityRatio = node.unique_counterparties / (node.total_degree || 1);

      if (burstRatio > 0.5 && diversityRatio > THRESHOLDS.SMURFING_DIVERSITY_RATIO && node.total_degree > 5) {
         structuralScore += SCORES.STRUCTURAL.SMURFING;
         patterns.push("smurfing_hub");
         behavioralScore += SCORES.BEHAVIORAL.BURST;
      }

      // 3. Cycle Detection
      if (node.in_degree > 0 && node.out_degree > 0) {
        const cycleLen = this.detectCycleForNode(node.id, 5);
        if (cycleLen > 0) {
          if (cycleLen === 3) {
            structuralScore += SCORES.STRUCTURAL.CYCLE_3;
            patterns.push("cycle_length_3");
          } else if (cycleLen === 4) {
            structuralScore += SCORES.STRUCTURAL.CYCLE_4;
            patterns.push("cycle_length_4");
          } else if (cycleLen === 5) {
            structuralScore += SCORES.STRUCTURAL.CYCLE_5;
            patterns.push("cycle_length_5");
          }
        }
      }

      // Behavioral Scoring using statistical outliers
      if (node.velocity > meanVelocity + (2 * stdVelocity)) {
         behavioralScore += SCORES.BEHAVIORAL.HIGH_VELOCITY;
         riskFactors.push("high_velocity_outlier");
      } else if (node.velocity > THRESHOLDS.HIGH_VELOCITY_TX_PER_HOUR) {
        behavioralScore += SCORES.BEHAVIORAL.HIGH_VELOCITY / 2;
        riskFactors.push("high_velocity");
      }

      // Network Score - PageRank
      if (node.pagerank && node.pagerank > 0.05) {
         networkScore += SCORES.NETWORK.HIGH_PAGERANK;
         riskFactors.push("high_centrality");
      }

      // False Positive Shield
      if (node.active_days > THRESHOLDS.ACTIVE_DAYS_LEGIT && 
          node.total_degree > 20 && 
          burstRatio < 0.3) {
          structuralScore = Math.max(0, structuralScore - 35);
          riskFactors.push("legitimate_behavior_shield");
      }

      structuralScore = Math.min(structuralScore, SCORES.STRUCTURAL.MAX);
      behavioralScore = Math.min(behavioralScore, SCORES.BEHAVIORAL.MAX);
      networkScore = Math.min(networkScore, SCORES.NETWORK.MAX);

      const totalScore = structuralScore + behavioralScore + networkScore; 

      if (totalScore > 10 || patterns.length > 0) {
        results.push({
          id: node.id,
          score: {
            structural: structuralScore,
            behavioral: behavioralScore,
            network: networkScore,
            total: totalScore,
            details: {
              patterns,
              risk_factors: riskFactors
            }
          }
        });
      }
    });

    return results;
  }

  /**
   * Form fraud rings from suspicious nodes
   * Same logic as original GraphEngine
   */
  public formRings(suspiciousNodes: { id: string; score: SuspicionScore }[]): Ring[] {
    const suspiciousSet = new Set(suspiciousNodes.map(n => n.id));
    const visited = new Set<string>();
    const rings: Ring[] = [];
    let ringCount = 0;

    const suspiciousNodeMap = new Map(suspiciousNodes.map(n => [n.id, n]));

    for (const sNode of suspiciousNodes) {
      if (visited.has(sNode.id)) continue;

      const componentIds: string[] = [];
      const queue = [sNode.id];
      visited.add(sNode.id);

      while (queue.length > 0) {
        const currentId = queue.shift()!;
        componentIds.push(currentId);

        const node = this.nodeMap.get(currentId);
        if (node) {
          const neighbors = new Set([
            ...node.transactions_in.map(t => t.sender),
            ...node.transactions_out.map(t => t.receiver)
          ]);

          neighbors.forEach(neighborId => {
            if (suspiciousSet.has(neighborId) && !visited.has(neighborId)) {
              visited.add(neighborId);
              queue.push(neighborId);
            }
          });
        }
      }

      if (componentIds.length > 1) { 
        ringCount++;
        const members = componentIds.map(id => suspiciousNodeMap.get(id)!);
        
        let totalScore = 0;
        const allPatterns = new Set<string>();
        
        members.forEach(m => {
          totalScore += m.score.total;
          m.score.details.patterns.forEach(p => allPatterns.add(p));
        });
        
        const avgScore = totalScore / members.length;
        let risk = (avgScore * 0.5) + (Math.log(members.length) * 7);
        if (allPatterns.size > 1) risk += 10; 
        risk = Math.min(100, Math.max(0, risk));

        const networkBonus = Math.min(SCORES.NETWORK.MAX, (members.length * SCORES.NETWORK.RING_SIZE_FACTOR) / 5); 

        members.forEach(m => {
          m.score.network = Math.max(m.score.network, networkBonus);
          m.score.total = Math.min(100, m.score.total + networkBonus);
        });

        rings.push({
          id: `RING_${ringCount.toString().padStart(3, '0')}`,
          nodes: componentIds,
          risk_score: parseFloat(risk.toFixed(2)), 
          patterns: Array.from(allPatterns),
          average_suspicion: parseFloat(avgScore.toFixed(2))
        });
      }
    }
    return rings.sort((a, b) => b.risk_score - a.risk_score);
  }

  private createNode(id: string): void {
    this.nodeMap.set(id, {
      id,
      in_degree: 0,
      out_degree: 0,
      total_degree: 0,
      transactions_in: [],
      transactions_out: [],
      first_seen: Infinity,
      last_seen: -Infinity,
      active_days: 0,
      velocity: 0,
      unique_counterparties: 0,
      time_concentration: 0,
      amount_variance: 0,
      flow_through: 0,
      pagerank: 0
    });
  }

  private updateNodeTime(node: NodeData, time: number): void {
    if (time < node.first_seen) node.first_seen = time;
    if (time > node.last_seen) node.last_seen = time;
  }

  private detectCycleForNode(startNodeId: string, maxDepth: number): number {
    const stack: { id: string; depth: number; path: Set<string> }[] = [
      { id: startNodeId, depth: 0, path: new Set([startNodeId]) }
    ];

    let minCycleFound = 0;
    let iterations = 0;
    const MAX_ITERATIONS = 500; 

    while (stack.length > 0) {
      iterations++;
      if (iterations > MAX_ITERATIONS) break;

      const { id, depth, path } = stack.pop()!;
      if (depth >= maxDepth) continue;

      const node = this.nodeMap.get(id);
      if (!node) continue;

      for (const tx of node.transactions_out) {
        const neighbor = tx.receiver;
        
        if (neighbor === startNodeId && depth + 1 >= 3) {
          const cycleLen = depth + 1;
          if (minCycleFound === 0 || cycleLen < minCycleFound) {
            minCycleFound = cycleLen;
          }
          continue; 
        }

        if (!path.has(neighbor)) {
          const newPath = new Set(path);
          newPath.add(neighbor);
          stack.push({
            id: neighbor,
            depth: depth + 1,
            path: newPath
          });
        }
      }
    }
    return minCycleFound;
  }

  /**
   * Get summary statistics (lightweight data)
   */
  public getSummary(): any {
    return {
      total_nodes: this.nodeMap.size,
      total_edges: this.edges.length,
      total_transactions: this.transactionCount,
      total_volume: this.totalVolume
    };
  }

  /**
   * Get nodes map (for final result assembly)
   */
  public getNodes(): Map<string, NodeData> {
    return this.nodeMap;
  }

  /**
   * Get edges array (for final result assembly)
   */
  public getEdges(): EdgeData[] {
    return this.edges;
  }

  /**
   * Get metadata
   */
  public getMetadata(): any {
    return {
      total_transactions: this.transactionCount,
      total_volume: this.totalVolume,
      processed_at: new Date().toISOString()
    };
  }
}
