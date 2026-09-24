# FlowPilot AI

> **Adaptive, stateful, policy-aware business workflow orchestration.**

FlowPilot AI bridges natural-language business intent with deterministic enterprise execution. Unlike simple chatbots or brittle automation scripts, FlowPilot dynamically formulates multi-step plans, obeys corporate policies, pauses for human authorizations, recovers from runtime failures autonomously, and maintains an immutable audit trail.

---

## The Problem
Modern businesses lose countless hours manually coordinating disconnected tools (spreadsheets, emails, ERPs, accounting systems). Traditional automation (e.g. Zapier, Make) is static and brittle—unable to handle missing data, failing APIs, or nuanced policy exceptions. Chatbots, on the other hand, produce text without reliable, stateful execution or safety governance.

## The Solution
FlowPilot operates through a closed-loop cognitive lifecycle:
**Understand → Plan → Gather Context → Reason & Apply Policy → Human Approval → Execute → Verify → Replan on Failure → Complete → Audit.**

---

## Key Capabilities
- **Natural-Language Objective Understanding**: Translates plain-English business goals into typed conditions, entities, and actions.
- **Dynamic Planning**: Synthesizes verified multi-step tool execution sequences using local LLMs without hallucinations.
- **Stateful Execution**: Powered by LangGraph and SQLAlchemy checkpoints, preserving in-flight state across long-running tasks.
- **Human-in-the-Loop Approval**: Hard gates requiring manager authorization for sensitive financial or customer-facing operations.
- **Adaptive Failure Recovery**: Intercepts tool errors (e.g. bouncing emails) and autonomously replans fallback actions.
- **Strict Policy Enforcement**: Deterministically applies business rules and threshold limits outside LLM influence.
- **Tamper-Evident Auditability**: Logs every action, decision, payload, and approval into append-only relational records.

---

## System Architecture
FlowPilot combines a TypeScript cognitive planning engine with a Python LangGraph orchestration backend and a Next.js 16 frontend:

```text
User Objective ➔ Next.js ➔ FastAPI ➔ LangGraph ➔ Dynamic Planner (Qwen3 8B)
➔ PlanVerifier ➔ Policy Engine ➔ Human Approval Gate ➔ Tool Execution
➔ Failure Detection ➔ Re-Planner ➔ Immutable Audit Trail
```

Detailed architectural diagrams and interop specifications are available in **[docs/architecture.md](docs/architecture.md)**.

---

## Technology Stack
- **Frontend**: Next.js 16 (App Router), React 19, TailwindCSS v4, Recharts, Lucide React
- **Backend**: FastAPI, SQLAlchemy 2.0, PostgreSQL / SQLite
- **Workflow Engine**: LangGraph, LangChain
- **AI Model**: Qwen3 8B running locally via Ollama (`think: false` on NVIDIA RTX 4050 GPU)
- **Validation**: Zod runtime schema validation and custom `PlanVerifier`
- **Languages**: Python 3.11+ and TypeScript 5.0+

Detailed layer matrix and architectural justifications are available in **[docs/tech-stack.md](docs/tech-stack.md)**.

---

## Canonical Demonstration Workflow
FlowPilot's flagship demonstration autonomously reconciles overdue accounts receivable:
> *"Find all overdue invoices above ₹50,000, analyze the customers, prioritize the cases, prepare follow-up emails, and ask me for approval before sending."*

- **7 Invoices Evaluated**: 6 actionable, 1 placed on monitoring-only (`INV-1009`, `PAYMENT_EXTENDED`).
- **3 Human Approvals Triggered**: High-value and policy escalation thresholds (`INV-1002`, `INV-1003`, `INV-1006`).
- **Autonomous Failure Recovery**: `INV-1004` (Delta Logistics) initially fails due to an invalid email address. FlowPilot intercepts the error, queries alternate contact records, retrieves a valid address, and successfully delivers the reminder notice.
- **Result**: 6 successful business actions, 1 recovered failure, 0 unresolved errors.

Complete breakdown available in **[docs/workflow.md](docs/workflow.md)**.

---

## Current Verified Status
The current repository represents a fully verified, working implementation:
- **TypeScript**: Passing (`npx tsc --noEmit` - 0 errors).
- **AI Planner Latency**: ~9.7s canonical plan generation, ~2.5s single-step generation (173 tokens / 45 tokens).
- **Execution Safety**: Full `LLM → Zod → PlanVerifier → ToolRegistry → Policy → Approval → Execution` pipeline active.
- **Local GPU Inference**: Zero cloud API dependencies for local execution.

---

## Documentation Index
Comprehensive technical documentation is organized in the `docs/` directory:
- **[Documentation Index](docs/README.md)**
- **[System Architecture](docs/architecture.md)**
- **[Technology Stack](docs/tech-stack.md)**
- **[Frontend Guide](docs/frontend.md)**
- **[Backend Services](docs/backend.md)**
- **[LLM Runtime](docs/llm.md)**
- **[Database Schema](docs/database.md)**
- **[Authoritative Tools](docs/tools.md)**
- **[Human Approvals](docs/approvals.md)**
- **[Failure Recovery](docs/failure-recovery.md)**
- **[Audit Trail](docs/audit.md)**
- **[Testing & Benchmarks](docs/testing.md)**
- **[Security & Governance](docs/security.md)**
- **[Hackathon Demo Script](docs/demo.md)**
- **[Future Roadmap](docs/future.md)**

---

## Quick Start

### 1. Prerequisites
- Node.js 20+
- Python 3.11+
- Ollama with `qwen3:8b` installed (`ollama pull qwen3:8b`)

### 2. Environment Setup
```bash
# Clone repository
git clone https://github.com/Mayank-Kamdi/Palloti_Hackethon.git
cd Palloti_Hackethon

# Install Node dependencies
npm install

# Setup Python environment
python -m venv .venv
source .venv/bin/activate  # Or on Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
```

### 3. Run Tests & Workflows
```bash
# Verify TypeScript
npx tsc --noEmit

# Run local Ollama planner benchmark
npx tsx tests/ai/benchmark_ollama.ts

# Run canonical workflow test
python test_canonical.py

# Start Next.js development server
npm run dev
```