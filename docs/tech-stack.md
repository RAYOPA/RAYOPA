# FlowPilot AI — Technology Stack

## 1. Core Technology Matrix

| Layer | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | Next.js (App Router) | `16.3.5` | React-based server and client web application shell |
| **UI Runtime** | React | `19.2.8` | Component rendering and interactive client state |
| **Styling** | TailwindCSS | `^4.0.0` | Utility-first responsive design and modern styling |
| **Data Visualization** | Recharts | `^3.10.1` | Dashboard metrics, bar charts, and timeline visuals |
| **Icons** | Lucide React | `^1.47.0` | Vector icon system across navigation and status displays |
| **Backend API** | FastAPI | `0.110+` | Asynchronous REST API serving workflows, approvals, and logs |
| **Database** | PostgreSQL / SQLite | Postgres 15+ / SQLite 3 | Relational transactional persistence for workflows and audit |
| **Database ORM** | SQLAlchemy | `2.0+` | Type-safe declarative database models and query execution |
| **Agent Orchestration** | LangGraph / LangChain | Python 0.2+ | Stateful graph workflow management and pause/resume cycles |
| **AI Model** | Qwen3 8B | `8B` | Local reasoning, objective analysis, dynamic planning |
| **AI Inference Runtime** | Ollama | `0.32+` | Local GPU inference on NVIDIA RTX 4050 (`think: false`) |
| **AI Schema Validation** | Zod | `^4.6.5` | Strict runtime typing and JSON schema enforcement |
| **Language (AI & UI)** | TypeScript | `^5.0.0` | Strongly typed cognitive runtime and Next.js frontend |
| **Language (Backend)** | Python | `3.11+` | Enterprise backend, tool registry, and LangGraph engine |
| **Version Control** | Git / GitHub | Git 2.40+ | Distributed source control, branch management, collaboration |

---

## 2. Architectural Justification: Why These Technologies

### Next.js & React 19
- **Why**: Next.js App Router provides high-performance server-side rendering, instant route transitions, and strong type safety. React 19's hooks and state model allow effortless real-time updates as workflows progress through execution stages.

### FastAPI & Python
- **Why**: FastAPI provides high throughput, automatic OpenAPI documentation, and native async support. Python is the industry standard for AI orchestration and data processing, seamlessly hosting the LangGraph state machine.

### LangGraph StateGraph Engine
- **Why**: Traditional LLM chains cannot reliably pause for human approval, recover from step failures, or maintain state over multi-step operations. LangGraph provides first-class state checkpoints, cyclical looping, and persistent pause/resume primitives.

### Qwen3 8B via Ollama (`think: false`)
- **Why**: Local inference eliminates data privacy concerns for sensitive financial invoices and eliminates API rate limits. Disabling reasoning (`think: false`) enables sub-3-second generation latency on consumer GPU hardware (NVIDIA RTX 4050 6GB VRAM) while strictly obeying Zod schemas.

### Zod & TypeScript for AI Runtime
- **Why**: LLM outputs can be unpredictable. Zod provides guaranteed runtime type safety. By piping LLM output directly into Zod schemas before tool execution, malformed plans are immediately rejected at the compiler boundary.

### SQLAlchemy & PostgreSQL
- **Why**: Mission-critical business operations demand ACID guarantees. SQLAlchemy's relational models provide strict referential integrity between customers, invoices, tool executions, and audit records.
