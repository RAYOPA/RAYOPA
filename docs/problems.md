# FlowPilot AI — The Problem Space

## 1. Problem Statement
Modern Small and Medium-sized Businesses (SMBs) spend over 40% of their operational time manually moving data across disparate tools, following up on customer payments, resolving process errors, and reconciling invoices. Existing software forces businesses to choose between rigid, brittle automation scripts and unassisted manual effort.

---

## 2. The Fragmented SMB Workflow
SMB operations are characterized by disconnected systems that do not talk to each other:
- **Financial Records**: Enterprise Resource Planning (ERP) databases, accounting tools, or spreadsheets.
- **Communications**: Corporate email inboxes, SMS gateways, and messaging platforms.
- **Document Stores**: PDF invoices, customer agreements, and delivery receipts.
- **Human Decisions**: Approvals trapped in informal chat threads or managers' memory.

When an operational process spans these boundaries—such as overdue invoice collection—staff must manually cross-reference payment records, check escalation rules, draft emails, obtain manager sign-off, verify delivery, and log notes.

---

## 3. Why Traditional Automation Fails
Traditional rule-based workflow tools (e.g. Zapier, Make, cron jobs, or legacy RPA) fall short because they are inherently **static and brittle**:
1. **Zero Context Awareness**: A rule saying *"If invoice > 30 days overdue, send email"* cannot differentiate between a strategic enterprise client with an agreed payment extension versus a delinquent account.
2. **Brittle Exception Handling**: If an email address bounces or an API returns a 404, the automation stops entirely and requires manual human intervention.
3. **No Dynamic Decision Making**: Traditional tools cannot formulate a new sequence of actions when unexpected roadblocks arise.
4. **Weak Governance**: Static webhooks often send messages or modify databases without contextual approval thresholds.

---

## 4. The Dynamic Workflow Challenge
Real-world business processes are non-linear, dynamic, and unpredictable:
- **Missing Information**: A customer contact email might be invalid or outdated, requiring looking up alternative contacts in phone records or billing notes.
- **Variable Policy Rules**: Invoices over ₹100,000 may require manager approval, while invoices over ₹500,000 require finance director approval.
- **Partial Execution**: Some actions succeed while others fail mid-way, requiring stateful resumption rather than running the entire workflow from scratch.
- **Compliance Requirements**: Every business action, email transmission, and policy evaluation must be permanently traceable for financial auditing.

---

## 5. Concrete Scenario: Overdue Invoice Collection
Consider a typical SMB with 7 overdue invoices:
- **Normal Collection**: Invoices overdue by 10 days should receive polite email reminders.
- **Escalated Collection**: Invoices overdue by >30 days with amounts >₹100,000 require manager approval before sending formal notices.
- **Monitoring Only**: An invoice marked `PAYMENT_EXTENDED` must NOT receive an aggressive collection email; it must only be monitored.
- **Delivery Failure**: An email sent to an invalid contact address (e.g. `invalid@acme.com`) will bounce. A human operator would look up the alternate contact (`valid@deltalogistics.com`) and re-send. Static scripts simply crash; an intelligent orchestrator must automatically recover.

---

## 6. Technical Challenges Addressed by FlowPilot
1. **Dynamic Cognitive Planning**: Translating ambiguous business goals into deterministic tool calls.
2. **Stateful Graph Execution**: Maintaining transactional checkpoints throughout long-running operations.
3. **Safe Human-in-the-Loop Integration**: Pausing autonomous execution for review without losing in-flight state.
4. **Autonomous Adaptive Replanning**: Detecting execution errors and computing compensatory fallback steps.
5. **Auditable Enterprise Governance**: Enforcing non-negotiable policy boundaries and recording immutable logs.
