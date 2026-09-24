# FlowPilot AI — Future Development Roadmap

> [!IMPORTANT]
> **ROADMAP SPECIFICATION ONLY**: This document specifies future enhancements and architectural evolutions. None of the capabilities described herein should be implemented during current hardening phases.

---

## 1. Executive Summary & Vision
FlowPilot AI has established a proven, working foundation for adaptive business workflow orchestration:
```text
Objective → Analyze → Dynamic Plan → PlanVerifier → LangGraph → Tool Execution → Approval → Failure Recovery → Audit
```
The roadmap for upcoming development cycles is organized into three prioritized horizons:
- **P0 — Immediate Hardening**: Production-readiness, deterministic synchronization, and performance optimization.
- **P1 — Intelligence Expansion**: Retrieval-Augmented Generation (RAG), document understanding, and cross-workflow memory.
- **P2 — Ecosystem Expansion**: Enterprise connectors, spreadsheet integration, and multi-tenant security.

---

## 2. Priority 0 (P0) — Immediate Hardening

### 1. Frontend / Backend Synchronization
- **Problem**: The frontend currently relies on intermittent polling of `/api/workflows/{id}`. During rapid multi-step executions or approval pauses, UI updates can experience latency.
- **Proposed Implementation**: Implement a Server-Sent Events (SSE) or WebSocket streaming channel in FastAPI (`/api/workflows/{id}/stream`), broadcasting state transitions directly from the LangGraph event generator to the Next.js client.
- **Expected Benefit**: Sub-50ms reactive UI updates with zero wasted polling HTTP requests.

### 2. Full Approval & Rejection Matrix Testing
- **Problem**: While approval has been verified on the canonical invoice workflow, rejection branch flows and partial action modifications need comprehensive automated regression tests.
- **Proposed Implementation**: Build automated integration tests covering human modification of email text prior to sending, immediate rejection of actions, and automated replanning triggered by rejections.
- **Expected Benefit**: Guarantees zero workflow deadlocks when managers reject proposed AI actions.

### 3. Comprehensive Database Audit Verification
- **Problem**: Audit events are stored in both SQLite/Postgres and `audit_log.json`, but lack an automated integrity verification script.
- **Proposed Implementation**: Add an audit integrity checker script that verifies cryptographic hash chaining across sequential `AuditEvent` records.
- **Expected Benefit**: Tamper-evident proof of audit authenticity for strict SOC-2 and financial regulatory compliance.

### 4. Generation Performance Optimization
- **Problem**: Even though planning time dropped from 22.2s to ~9.7s, multi-step workflows could benefit from prompt caching and pre-warmed KV caches in Ollama.
- **Proposed Implementation**: Implement prompt prefix caching and evaluate INT4/Q4_K_M quantization profiles for `Qwen3 8B`.
- **Expected Benefit**: Sub-5-second planning latency across all prompt sizes.

---

## 3. Priority 1 (P1) — Intelligence Expansion

### 1. Contextual RAG & Knowledge Base Ingestion
- **Problem**: Business escalation policies are currently summarized in short strings. Real enterprises have 50-page PDF credit policy handbooks.
- **Proposed Implementation**: Embed enterprise documents into a local vector store (ChromaDB / pgvector) using dense embeddings (e.g. `nomic-embed-text`). Dynamically retrieve only relevant policy clauses based on invoice characteristics.
- **Expected Benefit**: Operators can upload company SOPs and policy manuals without modifying prompt source code.

### 2. Document Ingestion (OCR & PDF Extraction)
- **Problem**: Invoices often arrive as scanned PDFs or paper receipts rather than pre-structured database rows.
- **Proposed Implementation**: Integrate multimodal document parsing (e.g. Docling or local vision models) to ingest PDF invoices directly into the database.
- **Expected Benefit**: Enables autonomous end-to-end processing of unstructured incoming invoice files.

### 3. Persistent Workflow Memory & Case History
- **Problem**: When a workflow completes, the agent retains no episodic memory of how difficult or cooperative a given client was.
- **Proposed Implementation**: Store customer communication profiles and dispute resolutions in a persistent episodic graph store.
- **Expected Benefit**: The planner adapts tone and payment terms based on historical client behavior.

---

## 4. Priority 2 (P2) — Ecosystem Expansion

### 1. Dynamic Tool Discovery & Registration
- **Problem**: Adding new tools currently requires manual code updates in both TypeScript and Python.
- **Proposed Implementation**: Implement an OpenAPI / JSON-RPC tool plugin protocol where backend microservices can dynamically announce their capabilities to FlowPilot at startup.
- **Expected Benefit**: Zero-code integration of third-party internal enterprise tools.

### 2. Native Google Sheets & Excel Integration
- **Problem**: SMB finance teams frequently operate directly out of live spreadsheets.
- **Proposed Implementation**: Provide certified two-way synchronization tools for Google Sheets and Microsoft Excel (`read_sheet_range`, `append_sheet_row`, `update_cell_status`).
- **Expected Benefit**: Non-technical finance managers can use FlowPilot without migrating away from existing spreadsheets.

### 3. Real Email & Communication Gateway Connectors
- **Problem**: Current email tools operate in sandbox simulation mode.
- **Proposed Implementation**: Add production SMTP, SendGrid, and AWS SES adapters, paired with inbound email webhook listeners to process customer replies.
- **Expected Benefit**: True automated two-way customer communication and dispute negotiation.

### 4. Advanced Multi-Tenant Role-Based Access Control (RBAC)
- **Problem**: In multi-department organizations, junior operators should not be permitted to approve high-value invoices.
- **Proposed Implementation**: Enforce JWT-based RBAC on the FastAPI backend, restricting `/api/workflows/{id}/approve` endpoints to verified manager roles.
- **Expected Benefit**: Enterprise-grade access control preventing unauthorized financial disbursements.
