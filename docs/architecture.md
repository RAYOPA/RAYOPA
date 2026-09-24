# FlowPilot AI — System Architecture

## 1. System Overview
FlowPilot is an **adaptive, stateful, policy-aware business workflow orchestration system**. Unlike simple conversational chatbots or linear automation scripts (e.g. Zapier), FlowPilot observes real-world business context, formulates structured multi-step plans, pauses for required human authorizations, handles runtime failures autonomously, and maintains an immutable audit trail.

---

## 2. End-to-End Architectural Pipeline

```text
                  +-----------------------------------+
                  |      User Business Objective      |
                  +-----------------------------------+
                                    |
                                    v
                  +-----------------------------------+
                  |         Next.js Frontend          |
                  +-----------------------------------+
                                    |
                            (REST / JSON API)
                                    v
                  +-----------------------------------+
                  |          FastAPI Backend          |
                  +-----------------------------------+
                                    |
                            (LangGraph Graph)
                                    v
                  +-----------------------------------+
                  |     LangGraph Orchestrator        |
                  +-----------------------------------+
                                    |
                     (CLI Subprocess Bridge: analyze)
                                    v
                  +-----------------------------------+
                  |        Objective Analyzer         |
                  |     (TypeScript / Qwen3 8B)       |
                  +-----------------------------------+
                                    |
                       (Structured Objective JSON)
                                    v
                  +-----------------------------------+
                  |         Dynamic Planner           |
                  |     (TypeScript / Qwen3 8B)       |
                  +-----------------------------------+
                                    |
                                    v
                  +-----------------------------------+
                  |   Zod Schema & Plan Verifier      |
                  |    (Rejects unauthorized tools)   |
                  +-----------------------------------+
                                    |
                               (Valid Plan)
                                    v
                  +-----------------------------------+
                  |     Python Executor Agent         |
                  +-----------------------------------+
                                    |
                                    v
                  +-----------------------------------+
                  |          Policy Engine            |
                  |    (Checks thresholds & rules)    |
                  +-----------------------------------+
                                    |
                  +-----------------+-----------------+
                  |                                   |
         (Requires Approval)                   (Auto-Approved)
                  v                                   v
    +---------------------------+                     |
    |   Human Approval Gate     |                     |
    | (Status: WAITING_APPROVAL)|                     |
    |  - Manager Reviews Action |                     |
    |  - Submits /api/approve   |                     |
    +---------------------------+                     |
                  |                                   |
                  +-----------------+-----------------+
                                    |
                                    v
                  +-----------------------------------+
                  |       Deterministic Tools         |
                  |  (getOverdueInvoices, sendEmail)  |
                  +-----------------------------------+
                                    |
                        (Tool Execution Result)
                                    v
                  +-----------------------------------+
                  |       Execution Verifier          |
                  +-----------------------------------+
                                    |
                     +--------------+--------------+
                     |                             |
                 (SUCCESS)                      (FAILURE)
                     |                             |
                     |                             v
                     |              +-----------------------------+
                     |              |     Adaptive Re-Planner     |
                     |              |    - Inspects error trace   |
                     |              |    - Finds alternate contact|
                     |              |    - Emits corrective plan  |
                     |              +-----------------------------+
                     |                             |
                     +--------------+--------------+
                                    |
                                    v
                  +-----------------------------------+
                  |     Immutable Audit Trail         |
                  |   (PostgreSQL / SQLite Events)    |
                  +-----------------------------------+
                                    |
                                    v
                  +-----------------------------------+
                  |    Frontend Real-Time Updates     |
                  |  (Dashboard, Execution DAG, Audit)|
                  +-----------------------------------+
```

---

## 3. The Node/TypeScript ↔ Python Interop Bridge
FlowPilot separates cognitive reasoning from systemic execution:
1. **Python Domain (`agents/` & `backend/`)**:
   - Manages relational database persistence, FastAPI routes, and the LangGraph state machine.
   - When cognitive planning or analysis is required, Python gathers available tool definitions and active workflow state into a temporary JSON manifest.
2. **Subprocess Bridge (`agents/nodes/planner.py`)**:
   - Executes `npx tsx src/ai/cli.ts <temp_file_path> <mode>` (`mode`: `analyze`, `plan`, or `replan`).
3. **TypeScript Cognitive Engine (`src/ai/`)**:
   - Runs `ProviderRouter`, connects to local Ollama (`qwen3:8b`), verifies Zod schemas, validates tools with `PlanVerifier`, and emits clean structured JSON over standard output.
4. **Resumption in Python**:
   - The Python executor parses the verified plan and steps through each action using authoritative tools registered in Python.

---

## 4. Why FlowPilot Is NOT Simply a Chatbot
| Capability | Conversational Chatbot | FlowPilot AI |
| :--- | :--- | :--- |
| **Output Style** | Conversational text paragraphs | Strict typed JSON execution plans |
| **Execution** | Hallucinates actions without executing | Deterministic tool execution via audited functions |
| **Statefulness** | Ephemeral chat window context | Relational database checkpointing and persistence |
| **Safety** | Unchecked advice | Hard policy gates and human approval queues |
| **Failure Handling** | Apologizes and repeats identical text | Structured failure detection and automated replanning |
| **Compliance** | Zero record | Cryptographic/immutable audit trail of every tool call |
