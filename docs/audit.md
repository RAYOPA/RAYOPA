# FlowPilot AI — Immutable Audit Trail

## 1. Overview
In regulated enterprise domains (finance, healthcare, legal, procurement), autonomous AI actions are unusable unless every single step, decision, and payload is **100% transparent and auditable**. FlowPilot provides comprehensive traceability by persisting every action into relational database tables and JSON log streams.

---

## 2. Core Audit Entities

### 1. `AuditEvent`
The central append-only event record for the system:
- `id`: Unique UUID.
- `workflow_id`: Workflow identifier.
- `event_type`: Standard event classification (`TOOL_STARTED`, `TOOL_COMPLETED`, `TOOL_FAILED`, `WORKFLOW_STARTED`, `WORKFLOW_PAUSED`, `WORKFLOW_COMPLETED`).
- `actor`: Operating entity (`SYSTEM`, `LLM_PLANNER`, `HUMAN_OPERATOR`).
- `tool`: Associated tool name (e.g. `sendEmail`, `getOverdueInvoices`).
- `status`: Execution status (`RUNNING`, `SUCCESS`, `FAILED`).
- `summary`: One-line plain English summary for display in the audit timeline.
- `metadata_json`: Full, untruncated JSON parameters and response bodies.
- `timestamp`: UTC ISO-8601 timestamp.

### 2. `ToolExecution`
Granular record of deterministic tool executions:
- Tracks idempotency keys to prevent duplicate actions.
- Captures exact input arguments, output payloads, execution duration, and exception stack traces.

### 3. `WorkflowStep`
Tracks plan progression:
- Records each step proposed by the AI planner.
- Documents start time, completion time, and input/output states.

### 4. `Approval`
Captures human oversight decisions:
- Documents which user approved or rejected an action.
- Records timestamp of review and any human adjustments made to the proposed action.

### 5. `Replan`
Documents autonomous self-healing:
- Records the original failed plan, the error trigger, and the new corrective plan synthesized by the AI.

---

## 3. Dual-Layer Logging Architecture
FlowPilot writes audit data across two independent channels:
1. **Relational Database (`audit_events` table)**: Fast, queryable storage for the Next.js frontend UI (`/audit` route).
2. **File-Based JSON Log (`audit_log.json`)**: Append-only file-based audit log designed for external ingestion into enterprise SIEM tools (e.g. Datadog, Splunk, AWS CloudWatch).

---

## 4. Example Audit Event Record
```json
{
  "id": "ae-9481b7e4-2391-4c91-9a72-192a8371bd10",
  "workflow_id": "wf-day4-a7b2c1",
  "event_type": "TOOL_COMPLETED",
  "actor": "ExecutorAgent",
  "tool": "sendEmail",
  "status": "SUCCESS",
  "summary": "Tool sendEmail finished with status SUCCESS",
  "metadata_json": {
    "execution_id": "exec-4421",
    "recipient": "valid@deltalogistics.com",
    "subject": "Follow-up on Overdue Invoice INV-1004",
    "result": { "message_id": "sim-8831" }
  },
  "timestamp": "2026-09-24T16:23:45.102Z"
}
```
