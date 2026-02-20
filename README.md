# Money Muling Detection Engine

A graph-based financial forensics engine that detects money-muling networks using transaction flow analysis.

---

## Overview

Money muling is a key mechanism in financial crime, where illicit funds are routed through networks of accounts to obscure their origin. Traditional rule-based or relational database approaches struggle to detect such coordinated, multi-hop behaviors.

This project implements a **graph-based detection engine** that analyzes transaction networks to uncover money-muling rings using deterministic, explainable patterns such as cycles, smurfing, and layered shell networks.

The system is built as a **live web application** with CSV upload, interactive graph visualization, and downloadable forensic outputs.

---

## Key Features

- Directed transaction graph construction
- Detection of money-muling patterns:
  - Circular fund routing (cycles of length 3–5)
  - Smurfing (fan-in / fan-out within a 72-hour window)
  - Layered shell account chains
- Suspicion scoring (0–100) based on cumulative risk signals
- Interactive graph visualization with highlighted fraud rings
- Fraud ring summary table
- Exact-spec JSON output for downstream analysis

---

## Tech Stack

- Frontend: Web-based UI for visualization and interaction
- Backend: Rule-based graph analysis engine
- Graph Analysis: Directed graph traversal (DFS / BFS)
- Data Handling: CSV parsing and structured JSON output

---

## System Architecture

1. CSV file upload (transaction data)
2. Directed graph construction (accounts as nodes, transactions as edges)
3. Pattern detection using graph traversal and degree analysis
4. Suspicion score computation and ring assignment
5. Visualization + downloadable forensic JSON output

---

## Detection Approach

### Circular Fund Routing (Cycles)
Detects directed cycles of length 3–5, where funds return to the originating account through intermediate nodes. All nodes in a cycle are grouped into the same fraud ring.

### Smurfing (Fan-in / Fan-out)
Identifies aggregation and dispersion patterns where:
- ≥10 senders transfer to one receiver (fan-in), or
- One sender transfers to ≥10 receivers (fan-out),
within a 72-hour window.

### Layered Shell Networks
Detects chains of 3+ hops where intermediate accounts have minimal transaction activity, indicating pass-through behavior.

---

## Suspicion Scoring

Each suspicious account is assigned a normalized score between 0 and 100 based on:
- Number and severity of detected patterns
- Transaction velocity
- Network position within detected rings

Scores represent **risk**, not certainty of fraud.

---

## False Positive Control

To reduce false positives, the system avoids flagging:
- Legitimate high-volume merchants
- Payroll-style accounts with consistent long-term activity

---

## Input Format

The application accepts CSV files with the following **exact schema**:

- `transaction_id` (String)
- `sender_id` (String)
- `receiver_id` (String)
- `amount` (Float)
- `timestamp` (YYYY-MM-DD HH:MM:SS)

---

## Output

- Interactive graph visualization
- Fraud ring summary table
- Downloadable JSON file containing:
  - Suspicious accounts
  - Detected fraud rings
  - Processing summary

All outputs strictly follow the challenge specification.

---

## Setup & Usage

1. Clone the repository
2. Install dependencies (frontend and backend)
3. Run the application locally or deploy to a public hosting platform
4. Upload a CSV file on the homepage to analyze transactions

---

## Known Limitations

- Detection is rule-based and does not use supervised ML models
- Performance tuned for datasets up to 10,000 transactions
- Thresholds are fixed as per challenge requirements

---

## Team

- **Skyline**

---

**Note:**  
The detection engine is fully deterministic and designed to pass exact test-case validation as required by the challenge.
