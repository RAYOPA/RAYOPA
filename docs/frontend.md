# FlowPilot AI — Frontend Documentation

## 1. Overview
FlowPilot's frontend is a modern web application designed for monitoring, orchestrating, and interacting with stateful business automation workflows. It provides operators and managers with real-time insight into multi-step agent actions, human-in-the-loop approval requests, audit timelines, and system KPI metrics.

---

## 2. Framework & Libraries
- **Framework**: Next.js 16.3.5 (App Router architecture)
- **UI Runtime**: React 19.2.8
- **Styling**: TailwindCSS v4 with PostCSS
- **Data Visualization**: Recharts (`^3.10.1`)
- **Icons**: Lucide React (`^1.47.0`)
- **Type Checking**: TypeScript 5 with strict typing

---

## 3. Directory Structure
Per standard Next.js conventions, the frontend resides under `src/` to ensure full compatibility with root build tooling and Next.js Dev Server (`next dev`):
```text
src/
├── app/
│   ├── layout.tsx         # Root application layout with navigation shell
│   ├── page.tsx           # Executive Dashboard (KPIs, active workflows, activity)
│   ├── globals.css        # Tailwind & theme styles
│   ├── workflows/
│   │   ├── page.tsx       # Workflow Explorer (list, filter, status badges)
│   │   ├── new/page.tsx   # Workflow Creation Interface (natural language prompt)
│   │   └── [id]/page.tsx  # Workflow Execution View (DAG graph, step logs)
│   ├── approvals/
│   │   └── page.tsx       # Human Approval Queue (review, approve, reject actions)
│   ├── audit/
│   │   └── page.tsx       # Immutable Audit Trail (event timeline, actors, payload)
│   └── demo/
│       └── page.tsx       # Hackathon Interactive Demonstration Mode
├── components/
│   ├── layout/
│   │   └── sidebar.tsx    # Responsive navigation sidebar
│   └── workflow/
│       └── WorkflowGraph.tsx # Visual workflow step execution graph
├── data/                  # Static definitions and seed datasets
├── hooks/                 # Custom React state hooks
├── services/              # API abstraction layer for FastAPI communication
└── workflow/              # Workflow definitions and state stores
```

---

## 4. Pages & Routes

### A. Dashboard (`/`)
- **Purpose**: High-level overview of system activity, operational health, and real-time execution statistics.
- **Major UI Elements**:
  - **KPI Cards**: Active Workflows, Success Rate (98.4%), Pending Approvals, Total Recovered Failures.
  - **Live Workflow Feed**: List of recent business operations with status badges (`COMPLETED`, `WAITING_FOR_APPROVAL`, `RUNNING`, `FAILED`).
  - **Audit Activity Stream**: Chronological feed of recent policy decisions and tool executions.
- **User Actions**: Click to inspect specific workflows, quickly jump to pending approvals, or trigger a new business workflow.

### B. Workflow Explorer (`/workflows`)
- **Purpose**: Comprehensive table and search interface for all created workflows.
- **Major UI Elements**:
  - Filter by status (`ALL`, `RUNNING`, `WAITING_FOR_APPROVAL`, `COMPLETED`, `FAILED`).
  - Search bar by workflow objective text or unique ID (`wf-XXXXXX`).
  - Execution summary metrics per workflow (step count, duration, trigger).
- **User Actions**: Filter, sort, and navigate to detailed execution pages.

### C. New Workflow (`/workflows/new`)
- **Purpose**: Input natural-language business objectives to initiate autonomous orchestration.
- **Major UI Elements**:
  - **Objective Textbox**: Large prompt area for typing instructions (e.g., *"Find all overdue invoices above ₹50,000, analyze the customers, prioritize the cases, prepare follow-up emails, and ask me for approval before sending."*).
  - **Pre-built Templates**: One-click quick-start cards for canonical business scenarios.
  - **Autonomous vs Co-Pilot Mode Toggle**: Allows configuring strict approval levels.
- **User Actions**: Submits objective via `POST /api/workflows` to FastAPI orchestrator.

### D. Workflow Execution View (`/workflows/[id]`)
- **Purpose**: Detailed real-time tracking of an active or completed workflow.
- **Major UI Elements**:
  - **Visual DAG Graph (`WorkflowGraph.tsx`)**: Renders sequential and branching steps with visual state indicators (pending, executing, paused for approval, successful, failed, recovered).
  - **Step Inspector**: JSON inspect drawer for inputs, outputs, timestamps, and error traces.
  - **Approval Callout Banner**: Appears whenever execution pauses at `WAITING_FOR_APPROVAL`.

### E. Approval Queue (`/approvals`)
- **Purpose**: Dedicated control panel for human-in-the-loop decisions.
- **Major UI Elements**:
  - List of approval-required actions (e.g., external email transmissions, payment modifications).
  - Action Context: Recipient, customer name, invoice amount, drafted content, policy rationale.
  - Interactive Action Buttons: `Approve Action`, `Reject Action`, `Modify & Approve`.
- **User Actions**: Sends `POST /api/workflows/{id}/approve` or `POST /api/workflows/{id}/reject`.

### F. Audit Timeline (`/audit`)
- **Purpose**: Complete regulatory and compliance audit trail.
- **Major UI Elements**:
  - Filterable timeline of `AuditEvent` records.
  - Badges indicating actor (`SYSTEM`, `LLM_PLANNER`, `HUMAN_OPERATOR`).
  - Deep inspect payload drawer displaying exact JSON metadata for each event.

### G. Interactive Demo Mode (`/demo`)
- **Purpose**: Curated presenter interface designed for hackathon judges and live presentations.
- **Major UI Elements**:
  - Step-by-step presentation stepper covering the 7-invoice canonical workflow.
  - Visual display of autonomous invoice discovery, policy check, human approval gate, simulated email failure on `INV-1004`, autonomous contact lookup, and recovery.

---

## 5. State Management & Backend Communication
- **API Communication**: The frontend communicates with the FastAPI backend over HTTP using standard fetch routines located in `src/services/`.
- **Reactive Polling**: Active workflows poll `/api/workflows/{id}` and `/api/workflows/{id}/events` to update execution state without requiring complex socket setups during local testing.
- **State Store**: React local state, Context API, and URL route parameters (`/workflows/[id]`) preserve active navigation and inspection state.

---

## 6. Live vs Demo Behavior
- **Real Backend-Driven Behavior**:
  - Dynamic workflow creation (`POST /api/workflows`) calling Python LangGraph and TypeScript AI planner.
  - Real status transitions (`RUNNING` → `WAITING_FOR_APPROVAL` → `APPROVED` → `COMPLETED`).
  - Real tool execution logs, database persistence in SQLite/PostgreSQL, and real audit event tracking.
- **Presenter / Demo Mode (`/demo`)**:
  - The dedicated `/demo` page provides an interactive guided walkthrough with curated stage visualizations to demonstrate end-to-end capabilities under controlled presentation time constraints.
