# FlowPilot AI — Hackathon Demonstration Guide

## 1. Demo Narrative Overview
This guide provides a structured, high-impact demonstration sequence designed for hackathon judges and evaluators. The demo illustrates how FlowPilot takes a natural-language goal, reasons over business data, pauses for human authorization, autonomously recovers from a simulated delivery failure, and produces an immutable audit trail in under 60 seconds.

---

## 2. Step-by-Step Presentation Script

### Step 1: The Business Problem (0:00 - 0:15)
- **Presenter**: *"Small businesses lose countless hours chasing overdue invoices, cross-referencing customer emails, and dealing with bounced notices. Traditional automation is too rigid and chatbots can't reliably execute tasks. Meet FlowPilot—an adaptive, stateful, policy-governed business workflow orchestrator."*

### Step 2: Entering the Objective (0:15 - 0:30)
- **Action**: Navigate to `http://localhost:3000/workflows/new`.
- **Input Prompt**:
  > *"Find all overdue invoices above ₹50,000, analyze the customers, prioritize the cases, prepare follow-up emails, and ask me for approval before sending."*
- **Click**: `Run Autonomous Workflow`.

### Step 3: Objective Understanding & Dynamic Planning (0:30 - 0:45)
- **Action**: Show the parsed structured objective and the visual execution graph:
  - **Conditions Extracted**: `amount > 50000`, `status == OVERDUE`.
  - **Plan Generated**: In under 10 seconds, local `Qwen3 8B` generates the verified high-level execution plan without hallucinations.
  - **Explain**: *"Notice that the LLM is restricted to our authoritative tool registry. It cannot invent tools or execute unverified commands."*

### Step 4: Policy Enforcement & Human Approval Gate (0:45 - 1:15)
- **Action**: The workflow reaches `sendEmail` and automatically transitions to `WAITING_FOR_APPROVAL`.
- **Navigate to**: `http://localhost:3000/approvals`.
- **Show**: 3 approval cards generated for high-value and escalated invoices (`INV-1002`, `INV-1003`, `INV-1006`).
- **Explain**: *"High-value communications require manager sign-off. FlowPilot pauses safely without losing state."*
- **Action**: Click **Approve** on the pending requests.

### Step 5: Autonomous Failure & Self-Healing Replan (1:15 - 1:45)
- **Action**: Watch the execution DAG on `http://localhost:3000/workflows/[id]`:
  - `INV-1001`, `INV-1002`, `INV-1003` succeed.
  - On `INV-1004` (Delta Logistics), the initial transmission to `invalid@acme.com` bounces!
  - **The Magic Moment**: FlowPilot does NOT crash. The node turns amber (`REPLAN`).
  - Within 3.9 seconds, FlowPilot queries customer contact records (`getCustomerContacts`), finds the alternate address `valid@deltalogistics.com`, re-drafts the notice, and successfully delivers it!
  - The node turns green (`RECOVERED`).

### Step 6: Immutable Audit Trail & Final Metrics (1:45 - 2:00)
- **Action**: Navigate to `http://localhost:3000/audit`.
- **Show**: The tamper-evident event stream showing every single tool start, human approval signature, error trace, and recovery action.
- **Show Final KPIs**:
  - 7 Invoices Ingested
  - 6 Actionable (1 Monitored)
  - 6 Successful Business Actions
  - 1 Recovered Failure (0 Unresolved)
  - 100% Policy Compliance

---

## 3. Quick Presenter Cheat Sheet
- **Model**: Local Qwen3 8B on NVIDIA RTX 4050 (Zero cloud API costs or data leakage).
- **Planner Latency**: ~9.7 seconds (Canonical), ~2.5 seconds (Single-step).
- **Core Value Proposition**: *Not just an AI that talks—an AI that works, obeys company policy, asks for permission when needed, and fixes its own mistakes.*
