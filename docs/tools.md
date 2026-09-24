# FlowPilot AI — Authoritative Tool Registry

## 1. Overview
FlowPilot enforces a **hard tool allowlist boundary**. The LLM planner has no native execution capabilities; it can only select tools registered in the authoritative `ToolRegistry` (`backend/tools/__init__.py` and `src/ai/tools/registry.ts`). Every tool executes in Python with strict argument schemas, database logging, and error boundaries.

---

## 2. Complete Tool Specifications

### 1. `getOverdueInvoices`
- **Purpose**: Fetches all open invoices currently marked as overdue.
- **Inputs**: None (`{}`).
- **Outputs**: `{"invoices": List[Dict]}` containing invoice details (id, number, customer_id, amount, days_overdue, status).
- **Requires Approval**: `False`
- **Failure Behavior**: Returns `status="SUCCESS", data={"invoices": []}` if none found.
- **Database Effect**: Read-only query against `invoices` table.

### 2. `getCustomer`
- **Purpose**: Retrieves profile, email, phone, and risk tier for a given customer.
- **Inputs**: `{"customer_id": string}` (supports customer ID or customer name).
- **Outputs**: `{"id": str, "name": str, "email": str, "phone": str, "status": str, "risk_level": str}`.
- **Requires Approval**: `False`
- **Failure Behavior**: Returns `status="FAILED", error="Customer not found"` if ID/name does not match.
- **Database Effect**: Read-only query against `customers` table.

### 3. `getCustomerContacts`
- **Purpose**: Retrieves all primary and alternative contact methods for a customer. Used for fallback recovery.
- **Inputs**: `{"customer_id": string}`.
- **Outputs**: `{"contacts": [{"type": "primary", "email": str, "phone": str}, {"type": "billing", "email": str}]}`.
- **Requires Approval**: `False`
- **Failure Behavior**: Returns `status="FAILED", error="Customer not found"`.
- **Database Effect**: Read-only query against `customers` table.

### 4. `getInvoice`
- **Purpose**: Retrieves granular details of a specific invoice.
- **Inputs**: `{"invoice_id": string}`.
- **Outputs**: `{"id": str, "invoice_number": str, "amount": float, "due_date": str, "status": str}`.
- **Requires Approval**: `False`
- **Failure Behavior**: Returns `status="FAILED", error="Invoice not found"`.
- **Database Effect**: Read-only query against `invoices` table.

### 5. `prepareEmail`
- **Purpose**: Formulates an email subject and body draft for a follow-up action.
- **Inputs**: `{"recipient": string, "subject": string, "body": string}` (defaults to contextual invoice details if omitted).
- **Outputs**: `{"recipient": str, "subject": str, "body": str, "prepared": True}`.
- **Requires Approval**: `False`
- **Failure Behavior**: Reverts to safe fallback defaults if inputs are missing.
- **Database Effect**: None (in-memory preparation).

### 6. `sendEmail`
- **Purpose**: Transmits an email notification to an external recipient.
- **Inputs**: `{"recipient": string, "subject": string, "body": string}`.
- **Outputs**: `{"message_id": string}` on success.
- **Requires Approval**: **`True` (Strict Human-in-the-Loop Gateway)**.
- **Failure Behavior**: Returns `status="FAILED", error="Invalid email address (SIMULATED)"` if recipient contains `invalid`.
- **Database Effect**: Inserts record into `communications` table upon successful dispatch.

### 7. `verifyDelivery`
- **Purpose**: Confirms that an outbound message was received and delivered by the mail provider.
- **Inputs**: `{"message_id": string}`.
- **Outputs**: `{"delivered": True, "opened": False}`.
- **Requires Approval**: `False`
- **Failure Behavior**: Returns `status="FAILED"` if message ID is unrecognized.
- **Database Effect**: Read-only check against communication records.

### 8. `getPaymentHistory`
- **Purpose**: Retrieves past completed payments for a customer to assess payment reliability.
- **Inputs**: `{"customer_id": string}`.
- **Outputs**: `{"payments": List[Dict]}`.
- **Requires Approval**: `False`
- **Failure Behavior**: Returns empty payment list if none found.
- **Database Effect**: Read-only query on `payments` table.

### 9. `getPaymentStatus`
- **Purpose**: Checks whether a specific invoice has pending or completed payments.
- **Inputs**: `{"invoice_id": string}`.
- **Outputs**: `{"paid": bool, "amount_paid": float, "balance_remaining": float}`.
- **Requires Approval**: `False`
- **Failure Behavior**: Returns error if invoice does not exist.
- **Database Effect**: Read-only query on `payments` and `invoices` tables.

### 10. `getCommunicationHistory`
- **Purpose**: Returns the log of past emails and calls with a customer to avoid excessive outreach.
- **Inputs**: `{"customer_id": string}`.
- **Outputs**: `{"communications": List[Dict]}`.
- **Requires Approval**: `False`
- **Failure Behavior**: Returns empty list if no prior contact.
- **Database Effect**: Read-only query on `communications` table.

### 11. `getLastContact`
- **Purpose**: Fetches the most recent interaction date with a customer.
- **Inputs**: `{"customer_id": string}`.
- **Outputs**: `{"last_contact_date": str, "channel": str}`.
- **Requires Approval**: `False`
- **Failure Behavior**: Returns None if never contacted.
- **Database Effect**: Read-only query on `communications` table.

### 12. `getPolicy`
- **Purpose**: Retrieves active escalation policies for a given domain (e.g. overdue collection).
- **Inputs**: `{"policy_type": string}`.
- **Outputs**: `{"policy_text": string, "rules": List[str]}`.
- **Requires Approval**: `False`
- **Failure Behavior**: Returns default company policy if specific type is missing.
- **Database Effect**: Read-only policy lookup.

### 13. `verifyAction`
- **Purpose**: Validates completion of an abstract analytical step (e.g. `analyze`, `prioritize`, `find`).
- **Inputs**: `{"action": string}`.
- **Outputs**: `{"action": str, "verified": True}`.
- **Requires Approval**: `False`
- **Failure Behavior**: None.
- **Database Effect**: None.
