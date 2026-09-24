# FlowPilot AI — Human Approval Architecture

## 1. Overview
FlowPilot is designed with a **strict Human-in-the-Loop (HITL) boundary**. High-impact operations—such as sending communications to external clients or initiating financial transactions—cannot proceed autonomously without explicit human authorization.

---

## 2. When Is Approval Required?
Approval is triggered dynamically based on two complementary layers:

### A. Authoritative Tool Definition
Certain tools are hardcoded with `requiresApproval = True` in `ToolDefinition` (e.g. `sendEmail`). Regardless of prompt text or LLM decisions, the Python execution engine overrides and enforces approval on these tools.

### B. Business Policy Rules
The Policy Engine evaluates context thresholds:
1. **Invoice Amount >= ₹100,000 AND Overdue > 30 Days**: Requires **Manager Approval**.
2. **Invoice Amount > ₹500,000**: Requires **Finance Director Approval**.
3. **External Communications**: Any customer outreach requires human verification.

---

## 3. How Execution Pauses (`WAITING_FOR_APPROVAL`)
When the `executor_node` encounters a step requiring approval:
1. It creates an `Approval` record in `status="PENDING"`.
2. It logs an `AuditEvent` with `event_type="Approval Required"`.
3. It sets `state.status = "WAITING_FOR_APPROVAL"`.
4. The LangGraph routing function returns `END`, terminating the active background streaming loop while **preserving full workflow state** in memory and in the database.

---

## 4. How Approvals Are Reviewed & Resumed

### The Approval UI (`/approvals`)
The manager reviews pending tickets in the UI showing:
- Action to be executed (e.g. `sendEmail`).
- Target recipient, subject, and prepared message draft.
- Rationale (e.g. *"Policy requirement: Invoice INV-1002 exceeds ₹100,000 and 30 days overdue"*).

### Resuming via API
When the manager clicks **Approve**:
1. Frontend calls `POST /api/workflows/{id}/approve` with `{"approval_id": "...", "actor": "manager@acme.com"}`.
2. The endpoint updates `Approval.status = "APPROVED"` and `Approval.approved_by = "manager@acme.com"`.
3. The endpoint calls `Orchestrator.resume_workflow(workflow_id)`.
4. `resume_workflow` sets `state.status = "APPROVED"` and resumes LangGraph streaming from the exact step that was paused.

---

## 5. What Happens on Rejection?
When the manager clicks **Reject**:
1. Frontend calls `POST /api/workflows/{id}/reject`.
2. The endpoint updates `Approval.status = "REJECTED"`.
3. The rejected action is skipped or the workflow transitions to `REPLAN` to seek an alternative strategy.
4. An immutable audit record is created documenting the rejection reason and reviewer identity.

---

## 6. Audit Trail for Approvals
Every human touchpoint is recorded:
- `APPROVAL_REQUESTED`: Timestamp, action name, policy reason.
- `APPROVAL_GRANTED`: Timestamp, approving user ID, modifications made.
- `APPROVAL_REJECTED`: Timestamp, rejecting user ID, notes.
