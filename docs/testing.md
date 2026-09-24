# FlowPilot AI — Verification & Testing Suite

## 1. Overview
FlowPilot's testing suite verifies the entire system stack: TypeScript type safety, Zod schema validation, PlanVerifier tool allowlisting, local Ollama latency benchmarks, LangGraph pause/resume mechanics, and full end-to-end canonical business workflow execution.

---

## 2. Test Catalog

### A. TypeScript Type Check
- **Command**: `npx tsc --noEmit`
- **Scope**: Validates all TypeScript files across `src/ai/`, `src/app/`, `src/components/`, `src/hooks/`, and root test scripts.
- **Current Status**: **PASS (0 errors)**.

### B. Minimal Structured Request Test
- **Location**: `tests/ai/test_minimal.ts` & `tests/ai/test_stage1.ts`
- **Scope**: Tests minimal structured output generation with local Ollama (`qwen3:8b`, `think: false`), validating Zod parse compatibility.
- **Current Status**: **PASS** (~1.2s latency).

### C. Simple Planning & PlanVerifier Test
- **Location**: `tests/ai/test_planning.ts` (and root `test_planning.ts`)
- **Scope**: Tests `ObjectiveAnalyzer` and `DynamicPlanner` on simple business input (*"Find overdue invoices above ₹50,000"*). Verifies that the plan contains only registered tools and passes `PlanVerifier.verify()`.
- **Current Status**: **PASS** (45 tokens generated, ~2.55s total duration).

### D. Canonical Planner Benchmark
- **Location**: `tests/ai/benchmark_ollama.ts` (and root `benchmark_ollama.ts`)
- **Scope**: Evaluates generation duration, token count, and memory loading for the full canonical invoice prompt under `Qwen3 8B`.
- **Current Status**: **PASS** (123–173 tokens generated in 7.0–9.7s; total duration < 10s, comfortably under the 15s hard acceptance limit).

### E. End-to-End Canonical Workflow Test
- **Location**: `tests/integration/test_canonical.py` (and root `test_canonical.py`)
- **Scope**: Sets up an isolated test database with 7 invoices, executes the LangGraph orchestrator, handles the `WAITING_FOR_APPROVAL` boundary, simulates approval resumption, triggers email failure on `INV-1004`, verifies autonomous replan, checks alternate contact retrieval, and validates the complete audit log.
- **Current Status**: **PASS (Status: COMPLETED)**.

---

## 3. Latest Canonical Execution Metrics

```text
Target Model: Qwen3 8B (Ollama, think: false, GPU RTX 4050)
Status: COMPLETED
Workflow Latency: 21.58s (Total end-to-end execution)
AI Calls Used: 2

=== Invoices & Action Breakdown ===
Total Invoices Ingested:       7
Actionable Invoices:           6
Monitoring-Only Invoices:      1  (INV-1009, PAYMENT_EXTENDED)
Approval Requests:             3  (INV-1002, INV-1003, INV-1006)
Distinct Business Actions:     6
Total Execution Attempts:      7
Successful Business Actions:   6
Failed Attempts:               1  (INV-1004 initial email)
Recovered Failures:            1  (INV-1004 fallback to alt contact)
Autonomous Replans:            1
Unresolved Errors:             0
```

### Clarification: 6 Business Actions vs. 7 Execution Attempts
The metric reports **6 successful business actions** across **7 execution attempts** because:
1. `INV-1001` — Succeeded (Attempt 1)
2. `INV-1002` — Succeeded after approval (Attempt 2)
3. `INV-1003` — Succeeded after approval (Attempt 3)
4. `INV-1004` — **Initial attempt to invalid@acme.com failed** (Attempt 4)
5. `INV-1005` — Succeeded (Attempt 5)
6. `INV-1006` — Succeeded after approval (Attempt 6)
7. `INV-1004` — **Recovered attempt to valid@deltalogistics.com succeeded** (Attempt 7)

Net result: 7 execution attempts, 1 transient failure, 1 autonomous replan, 6 successful business actions achieved, 0 unresolved failures.

---

## 4. How to Run the Tests

```bash
# 1. TypeScript Verification
npx tsc --noEmit

# 2. Simple Planning Test
npx tsx tests/ai/test_planning.ts

# 3. Dynamic Planner Benchmark
npx tsx tests/ai/benchmark_ollama.ts

# 4. Canonical Python Workflow
python test_canonical.py
```
