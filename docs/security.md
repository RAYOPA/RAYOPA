# FlowPilot AI — Security, Governance & Compliance

## 1. Security Overview
FlowPilot is designed for enterprise and SMB environments handling sensitive financial records, customer personal data (PII), and mission-critical communications. Security and governance are architectural invariants enforced by compilation and runtime boundaries.

---

## 2. Secrets Management & Environment Isolation
- **Zero Committed Secrets**: `.env` and `.env.local` files are strictly excluded from source control via `.gitignore`.
- **Sanitized Logging**: The logger and telemetry probes explicitly sanitize and redact API keys, database connection strings, and authorization tokens before writing to `audit_log.json` or console output.
- **Example Template**: Developers configure environments via `.env.example`, which contains empty placeholder keys without sensitive values.

---

## 3. LLM Safety & Sandboxing Boundaries

FlowPilot prevents common LLM vulnerabilities (Prompt Injection, Insecure Output Handling, Arbitrary Execution):

### A. Strict Tool Allowlisting
- The LLM does NOT possess execution privileges.
- All tool calls must match an entry in `ToolRegistry` (`backend/tools/__init__.py`).
- If an LLM suggests an unknown or invented tool, `PlanVerifier` immediately raises `CapabilityUnavailableError` and terminates the plan before any execution can occur.

### B. No Arbitrary Code or SQL Generation
- The model is NEVER asked to write Python code, JavaScript, or raw SQL queries.
- Database access is strictly encapsulated within pre-compiled, parameter-checked SQLAlchemy queries.

### C. Zod Runtime Schema Validation
- Model outputs must conform to rigid Zod schemas (`src/ai/schemas/plan.ts`). Any malformed, hallucinated, or injected fields trigger `ValidationError` and are discarded.

---

## 4. Human-in-the-Loop Approval Governance
- Actions with significant external impact (e.g. sending emails to clients, changing financial statuses) are hardcoded with `requiresApproval = True`.
- No LLM instruction or user prompt can bypass this check. The execution engine deterministically halts at `WAITING_FOR_APPROVAL` until a verified human operator signs off via the authenticated `/api/workflows/{id}/approve` endpoint.

---

## 5. Defense Against Truncated or Hallucinated Plans
- When generation hits the `num_predict` ceiling, Ollama reports `done_reason === 'length'`.
- `OllamaProvider` catches this flag and rejects the incomplete payload, preventing the execution of half-formed plans.

---

## 6. Audit Trail Immutability
- Every event is recorded to the append-only `audit_events` table and `audit_log.json`.
- Event records store actor identity (`SYSTEM`, `LLM_PLANNER`, `HUMAN_OPERATOR`), exact parameters, timestamps, and execution outcomes, guaranteeing complete forensic accountability.
