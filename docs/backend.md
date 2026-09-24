# FlowPilot AI — Backend Documentation

## 1. Overview
FlowPilot's backend is built with **FastAPI** and **SQLAlchemy** to deliver a reliable, transactional, and stateful workflow execution engine. It coordinates agent orchestration, deterministic tool execution, policy-governed approval gates, and persistent audit logging.

---

## 2. Architecture & Frameworks
- **Web Framework**: FastAPI (high-performance Python asynchronous REST API)
- **Database ORM**: SQLAlchemy 2.0
- **Database Engine**: PostgreSQL (Production) / SQLite (Local testing and development)
- **Orchestration**: LangGraph StateGraph engine (`agents/graph.py`)
- **Language**: Python 3.11+

---

## 3. Database Models (`backend/models.py`)
The backend persistence layer consists of 10 core relational models:

1. **`Customer`** (`customers` table):
   - `id`: Primary key string (e.g. `cust-1`).
   - `name`: Customer company / individual name.
   - `email`: Primary contact email address.
   - `phone`: Primary or secondary contact phone / alternative contact info.
   - `status`: Customer account status (`ACTIVE`, `SUSPENDED`).
   - `risk_level`: Credit risk tier (`LOW`, `MEDIUM`, `HIGH`).
   - `created_at`, `updated_at`: Timestamps.

2. **`Invoice`** (`invoices` table):
   - `id`: Primary key string.
   - `invoice_number`: Unique invoice identifier (e.g. `INV-1001`).
   - `customer_id`: Foreign key to `customers.id`.
   - `amount`: Float invoice amount (e.g. `60000.0`).
   - `due_date`: Date when payment was due.
   - `status`: Invoice lifecycle status (`OVERDUE`, `PENDING`, `PAID`, `PAYMENT_EXTENDED`).
   - `days_overdue`: Integer days overdue.

3. **`Payment`** (`payments` table):
   - `id`: Primary key string.
   - `invoice_id`: Foreign key to `invoices.id`.
   - `amount`: Payment amount recorded.
   - `payment_date`: Date and time of payment.
   - `status`: Payment status (`COMPLETED`, `PENDING`).
   - `reference`: Bank / transaction reference string.

4. **`Communication`** (`communications` table):
   - `id`: Primary key string.
   - `customer_id`: Foreign key to `customers.id`.
   - `invoice_id`: Optional foreign key to `invoices.id`.
   - `channel`: Communication channel (`EMAIL`, `SMS`, `PHONE`).
   - `recipient`: Target email address or phone number.
   - `subject`: Message subject line.
   - `message`: Message body content.
   - `status`: Transmission status (`SENT`, `FAILED`, `PENDING`).
   - `timestamp`: Event timestamp.

5. **`Workflow`** (`workflows` table):
   - `id`: Primary key string (e.g. `wf-day4-abcdef`).
   - `objective`: Natural-language goal string submitted by the user.
   - `mode`: Execution autonomy mode (`AUTONOMOUS`, `COPILOT`).
   - `status`: Current workflow state (`IN_PROGRESS`, `WAITING_FOR_APPROVAL`, `APPROVED`, `COMPLETED`, `FAILED`).
   - `current_step`: Active step indicator.
   - `current_plan`: JSON serialized execution plan.
   - `created_at`, `updated_at`, `completed_at`: Workflow lifecycle timestamps.

6. **`WorkflowStep`** (`workflow_steps` table):
   - `id`: Primary key string.
   - `workflow_id`: Foreign key to `workflows.id`.
   - `step_id`: Unique identifier within the plan (`step-0`, `step-1`).
   - `description`: Human-readable summary of step intent.
   - `status`: `PENDING`, `RUNNING`, `COMPLETED`, `FAILED`.
   - `input`, `output`: JSON structured payloads.
   - `started_at`, `completed_at`: Step execution timestamps.

7. **`ToolExecution`** (`tool_executions` table):
   - `id`: Primary key UUID.
   - `workflow_id`: Foreign key to `workflows.id`.
   - `tool_name`: Exact registered tool name (e.g. `getOverdueInvoices`, `sendEmail`).
   - `input`, `output`: JSON data sent to and received from the tool.
   - `status`: `RUNNING`, `SUCCESS`, `FAILED`.
   - `error`: Error string if failure occurred.
   - `attempt`: Retry / attempt counter.
   - `started_at`, `completed_at`: Timestamps.

8. **`AuditEvent`** (`audit_events` table):
   - `id`: Primary key UUID.
   - `workflow_id`: Foreign key to `workflows.id`.
   - `event_type`: Categorical event type (`TOOL_STARTED`, `TOOL_COMPLETED`, `TOOL_FAILED`, `WORKFLOW_PAUSED`, etc.).
   - `actor`: Operating entity (`SYSTEM`, `LLM_PLANNER`, `HUMAN_OPERATOR`).
   - `tool`: Optional tool name associated with event.
   - `status`: `RUNNING`, `SUCCESS`, `FAILED`.
   - `summary`: One-line human-readable summary.
   - `metadata_json`: Full JSON context payload.
   - `timestamp`: Event timestamp.

9. **`Approval`** (`approvals` table):
   - `id`: Primary key UUID.
   - `workflow_id`: Foreign key to `workflows.id`.
   - `action`: Name of tool / action requiring authorization (e.g. `sendEmail`).
   - `reason`: Explanation of why approval is required (e.g. policy threshold).
   - `status`: `PENDING`, `APPROVED`, `REJECTED`.
   - `requested_by`, `approved_by`: Actors responsible.
   - `requested_at`, `approved_at`: Timestamps.
   - `modified_action`: Optional JSON adjustments made by the human reviewer.

10. **`Replan`** (`replans` table):
    - `id`: Primary key UUID.
    - `workflow_id`: Foreign key to `workflows.id`.
    - `trigger`: Event triggering replanning (`FAILURE`, `REJECTION`).
    - `previous_plan`: JSON of plan before failure.
    - `failure_context`: JSON of the failure encountered.
    - `new_plan`: JSON of the revised plan generated by the LLM planner.
    - `status`: `COMPLETED`, `PENDING`.
    - `created_at`: Timestamp.

---

## 4. API Endpoints (`backend/main.py`)

| Method | Endpoint | Description | Request Payload | Response |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/workflows` | Creates a new workflow and launches orchestrator in background | `{"objective": str, "mode": str}` | `{"id": str, "status": str}` |
| `GET` | `/api/workflows/{id}` | Fetches full workflow details and status | None | `Workflow` object JSON |
| `GET` | `/api/workflows/{id}/events` | Retrieves all audit events for a workflow | None | `List[AuditEvent]` |
| `POST` | `/api/workflows/{id}/approve` | Submits human approval and resumes orchestrator execution | `{"approval_id": str, "actor": str}` | `{"status": "APPROVED"}` |
| `POST` | `/api/workflows/{id}/reject` | Records human rejection for a pending step | `{"approval_id": str, "actor": str}` | `{"status": "REJECTED"}` |
| `POST` | `/api/workflows/{id}/replan` | Manually logs or triggers replanning | `{"trigger": str, "failure_context": dict, "new_plan": dict}` | `{"status": "REPLAN_LOGGED", "replan_id": str}` |
| `POST` | `/api/workflows/{id}/execute-tool` | Directly executes a single registered tool within a workflow context | `{"tool_name": str, "input_data": dict, "step_id": str}` | `ToolResult` JSON |
| `GET` | `/api/invoices` | Lists all invoices in the system | None | `List[Invoice]` |
| `GET` | `/api/customers` | Lists all customers in the system | None | `List[Customer]` |

---

## 5. Tool Registry & Execution Lifecycle
- Tools are authoritatively registered in `backend/tools/__init__.py` using `ToolDefinition`.
- Each execution is wrapped inside a transactional boundary:
  1. Checks idempotency against existing `ToolExecution` records.
  2. Creates a `ToolExecution` record in `RUNNING` status.
  3. Records a `TOOL_STARTED` audit event.
  4. Calls the tool's Python execution handler with `ToolContext` (providing access to database and action metadata).
  5. Updates `ToolExecution` status (`SUCCESS` or `FAILED`) and output/error fields.
  6. Records a `TOOL_COMPLETED` or `TOOL_FAILED` audit event.

---

## 6. Policy & Approval Boundaries
- Tools with `requiresApproval = True` (such as `sendEmail`) or actions flagged by policy evaluation cause the executor to transition workflow status to `WAITING_FOR_APPROVAL`.
- LangGraph pauses execution when status is `WAITING_FOR_APPROVAL` without dropping state.
- Resuming occurs when `/api/workflows/{id}/approve` updates approval records and triggers `Orchestrator.resume_workflow()`.

---

## 7. Failure Handling & Replanning
- When a tool encounters an error (e.g. invalid recipient email, missing data), the failure enters `state.failures`.
- The graph transitions to `status = "REPLAN"` and invokes the planner node with `mode: "replan"`.
- The planner inspects the failure context and generates alternative corrective actions (e.g., calling `getCustomerContacts` to locate an alternate email).
