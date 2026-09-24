# FlowPilot AI — Documentation Index

Welcome to the comprehensive technical and operational documentation suite for **FlowPilot AI**.

---

## Architecture & System Overview
- **[System Architecture](architecture.md)**: End-to-end processing pipeline, LangGraph state machine, and the Node.js/TypeScript ↔ Python interop bridge.
- **[Technology Stack](tech-stack.md)**: Matrix of technologies, versions, layers, and architectural justifications.
- **[Problem Statement](problems.md)**: Disconnected SMB workflows, limitations of rigid automation, and dynamic orchestration challenges.
- **[The Solution](solution.md)**: The 10-stage autonomous cognitive execution lifecycle.

---

## Technical Specifications
- **[Frontend Application](frontend.md)**: Next.js 16 / React 19 architecture, App Router pages, components, and real-time dashboard UI.
- **[Backend Services](backend.md)**: FastAPI REST endpoints, SQLAlchemy ORM, transactional boundaries, and background orchestrator execution.
- **[LLM Runtime & Cognitive Engine](llm.md)**: Local Qwen3 8B configuration, Ollama inference, prompt structures, and safety firewalls.
- **[Database Schema & Models](database.md)**: Entity Relationship Diagram (ERD), table definitions, relational constraints, and audit logging schemas.
- **[Authoritative Tool Registry](tools.md)**: Complete specifications, schemas, input/output contracts, and database effects for all registered tools.

---

## Governance, Safety & Execution
- **[Human-in-the-Loop Approvals](approvals.md)**: Escalation policies, execution pause/resume mechanics, and review workflows.
- **[Adaptive Failure Recovery](failure-recovery.md)**: Self-healing error detection, contextual replanning, and case study of `INV-1004`.
- **[Immutable Audit Trail](audit.md)**: Forensic traceability, `AuditEvent` models, SIEM integration, and regulatory compliance.
- **[Security & Governance](security.md)**: Secrets isolation, tool allowlisting, prompt injection defense, and arbitrary code prevention.

---

## Verification, Testing & Demonstration
- **[Verification & Testing Suite](testing.md)**: TypeScript checks, unit benchmarks, end-to-end canonical test execution, and metrics.
- **[Canonical Workflow Guide](workflow.md)**: Detailed breakdown of the 7-invoice accounts receivable recovery scenario.
- **[Hackathon Demonstration Script](demo.md)**: Step-by-step judge demonstration sequence and timed presenter script.

---

## Future Horizons
- **[Future Development Roadmap](future.md)**: Prioritized specifications for P0 (Immediate Hardening), P1 (Intelligence Expansion), and P2 (Ecosystem Expansion).
