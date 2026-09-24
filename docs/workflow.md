# FlowPilot AI — The Canonical Invoice Workflow

## 1. Workflow Input & Objective
FlowPilot's canonical business demonstration executes an automated accounts receivable collection process based on the following natural-language objective:

> *"Find all overdue invoices above ₹50,000, analyze the customers, prioritize the cases, prepare follow-up emails, and ask me for approval before sending."*

---

## 2. Expected Operational Outcome Summary
- **Total Invoices Evaluated**: 7
- **Actionable Invoices**: 6
- **Monitoring-Only Invoices**: 1 (status `PAYMENT_EXTENDED`)
- **Approval Requests Generated**: 3 (high-value / policy escalation thresholds)
- **Distinct Business Actions**: 6
- **Execution Attempts**: 7 (including 1 initial failed attempt on `INV-1004`)
- **Successful Business Actions**: 6
- **Recovered Failures**: 1 (automated alternate contact fallback)
- **Unresolved Failures**: 0

---

## 3. Case-by-Case Breakdown of the 7 Invoices

### 1. `INV-1001` — Alpha Corp
- **Amount**: ₹60,000.00
- **Overdue Duration**: 10 Days
- **Status**: `OVERDUE`
- **Customer Email**: `alpha@acme.com`
- **Policy Classification**: Standard Overdue (< ₹100,000).
- **Execution**: Prepares polite reminder email, dispatches reminder upon autonomous policy verification.

### 2. `INV-1002` — Beta Inc
- **Amount**: ₹120,000.00
- **Overdue Duration**: 40 Days
- **Status**: `OVERDUE`
- **Customer Email**: `beta@acme.com`
- **Policy Classification**: High-Risk Overdue (> ₹100,000 AND > 30 Days Overdue).
- **Approval Required**: **Manager Approval Required** (Escalation Policy).
- **Execution**: Workflow pauses. Once approved by manager via `/api/workflows/{id}/approve`, dispatches formal escalation notice.

### 3. `INV-1003` — Gamma LLC
- **Amount**: ₹600,000.00
- **Overdue Duration**: 10 Days
- **Status**: `OVERDUE`
- **Customer Email**: `gamma@acme.com`
- **Policy Classification**: Critical Value (> ₹500,000 threshold).
- **Approval Required**: **Finance Director Approval Required**.
- **Execution**: Workflow pauses for executive review. Upon authorization, dispatches high-priority settlement request.

### 4. `INV-1004` — Delta Logistics (The Self-Healing Scenario)
- **Amount**: ₹80,000.00
- **Overdue Duration**: 10 Days
- **Status**: `OVERDUE`
- **Initial Email**: `invalid@acme.com` (Simulated broken / bounced email address)
- **Alternative Contact**: `valid@deltalogistics.com` (Stored in customer contact records)
- **Failure Lifecycle**:
  1. Primary execution attempts delivery to `invalid@acme.com`.
  2. Email delivery fails with `Invalid email address (SIMULATED)`.
  3. Failure is recorded in `state.failures`.
  4. LangGraph triggers `planner_node` in `replan` mode.
  5. The LLM planner analyzes the failure and emits a corrective plan invoking `getCustomerContacts(customer_id="Delta Logistics")`.
  6. The alternative contact `valid@deltalogistics.com` is discovered.
  7. Follow-up email is prepared and successfully sent to the verified alternative contact.
  8. Failure marked **RECOVERED**.

### 5. `INV-1005` — Epsilon Group
- **Amount**: ₹70,000.00
- **Overdue Duration**: 10 Days
- **Status**: `OVERDUE`
- **Customer Email**: `epsilon@acme.com`
- **Policy Classification**: Standard Overdue (< ₹100,000).
- **Execution**: Polite follow-up email prepared and sent.

### 6. `INV-1006` — Zeta Partners
- **Amount**: ₹150,000.00
- **Overdue Duration**: 5 Days
- **Status**: `OVERDUE`
- **Customer Email**: `zeta@acme.com`
- **Policy Classification**: Large Balance (> ₹100,000 threshold).
- **Approval Required**: **Manager Approval Required**.
- **Execution**: Pauses for approval gate, resumes upon authorization.

### 7. `INV-1009` — Eta Systems (The Exclusion Case)
- **Amount**: ₹55,000.00
- **Overdue Duration**: 10 Days
- **Status**: `PAYMENT_EXTENDED`
- **Customer Email**: `eta@acme.com`
- **Policy Classification**: **Monitoring Only**.
- **Execution**: Explicitly protected by policy rule: `status == PAYMENT_EXTENDED -> monitoring only`. No external collection emails are generated or sent. Logged in audit trail as monitored.

---

## 4. Why 6 Business Actions != 7 Execution Attempts
A common verification question is why the metric logs **6 business actions** but **7 execution attempts**:
- **Attempt 1**: `INV-1001` sent successfully.
- **Attempt 2**: `INV-1002` sent successfully (after approval).
- **Attempt 3**: `INV-1003` sent successfully (after approval).
- **Attempt 4**: `INV-1004` initial transmission to `invalid@acme.com` **FAILS**.
- **Attempt 5**: `INV-1005` sent successfully.
- **Attempt 6**: `INV-1006` sent successfully (after approval).
- **Attempt 7**: `INV-1004` re-transmission to `valid@deltalogistics.com` **SUCCEEDS**.

Total attempts: 7. Successful business goals achieved: 6. Monitored without outbound action: 1.
