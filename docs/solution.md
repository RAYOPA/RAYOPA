# FlowPilot AI — The Solution

## 1. Overview
FlowPilot bridges the gap between static automation and unassisted human labor. It acts as an **autonomous operational co-pilot** that accepts plain-English business goals, reasons over live system state, formulates execution plans, interacts with enterprise tools, pauses for human sign-off, and self-heals when errors occur.

---

## 2. The 10-Stage Autonomous Execution Cycle

FlowPilot operates through an iterative, closed-loop execution lifecycle:

```text
Natural-Language Objective
          ↓
     1. UNDERSTAND
          ↓
       2. PLAN
          ↓
      3. GATHER
          ↓
      4. REASON
          ↓
      5. APPROVE
          ↓
      6. EXECUTE
          ↓
      7. VERIFY
          ↓
      8. REPLAN (if error)
          ↓
     9. COMPLETE
          ↓
      10. AUDIT
```

### Stage 1: Understand (Objective Analysis)
- **What Happens**: The user submits an operational instruction in natural language.
- **Action**: The `ObjectiveAnalyzer` uses the local LLM runtime (`Qwen3 8B`) to extract structured parameters: target entities (e.g. `invoices`, `customers`), filtering conditions (e.g. `amount > 50000`, `status == OVERDUE`), and required actions (`analyze`, `prepare_email`, `request_approval`).

### Stage 2: Plan (Dynamic Planning)
- **What Happens**: The `DynamicPlanner` examines the available tools registered in the authoritative system registry.
- **Action**: Generates a compact, typed sequence of tools required to accomplish the goal. Outputs pass immediately through Zod schema validation and the `PlanVerifier`.

### Stage 3: Gather (Deterministic Context Ingestion)
- **What Happens**: The system queries internal business records to gather live situational context.
- **Action**: Executes data-fetching tools (e.g. `getOverdueInvoices`, `getCustomer`) to assemble current customer balances, overdue durations, and contact records.

### Stage 4: Reason (Policy Evaluation)
- **What Happens**: Business rules and compliance policies are evaluated against live context.
- **Action**: Evaluates thresholds (e.g. invoice balance > ₹100,000, days overdue > 30, payment status `PAYMENT_EXTENDED`). Identifies which cases require escalation and which should be placed on monitoring-only status.

### Stage 5: Approve (Human-in-the-Loop Gate)
- **What Happens**: When an action involves external communication or sensitive financial operations, autonomous execution pauses.
- **Action**: The workflow transitions to `WAITING_FOR_APPROVAL` and presents the exact proposed action (recipient, subject, body, rationale) in the manager's Approval Queue. Execution halts until authorized.

### Stage 6: Execute (Deterministic Tool Invocation)
- **What Happens**: Approved and policy-compliant actions are executed by the Python executor agent.
- **Action**: Calls audited tool functions (e.g. `sendEmail`, `recordPayment`) with transactional idempotency checks.

### Stage 7: Verify (Execution Verification)
- **What Happens**: Confirms that executed tools delivered the expected operational outcome.
- **Action**: Validates API response codes, message delivery receipts (`verifyDelivery`), and database updates.

### Stage 8: Replan (Autonomous Adaptive Recovery)
- **What Happens**: If any step encounters an unexpected runtime failure (e.g. bouncing email, customer not found).
- **Action**: Rather than crashing the pipeline, the error is recorded into the state graph. The `Replan` engine analyzes the failure trace and generates a compensatory plan (e.g. lookup alternate customer contacts).

### Stage 9: Complete (Terminal Verification)
- **What Happens**: All plan steps are validated as completed and remaining failures are resolved.
- **Action**: Final state transitions to `COMPLETED`, notifying the user and updating dashboard KPIs.

### Stage 10: Audit (Immutable Traceability)
- **What Happens**: Continuous, tamper-evident logging of every action.
- **Action**: Every objective parsed, plan generated, policy evaluated, human approval signed, tool invoked, and error recovered is saved to the `audit_events` and `tool_executions` tables.
