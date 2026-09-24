# FlowPilot AI — LLM Runtime Documentation

## 1. Role of the LLM in FlowPilot
FlowPilot employs Large Language Models strictly as **deterministic cognitive planners and reasoning agents**, NOT as unchecked execution environments.

### What the LLM Is Responsible For:
1. **Objective Understanding**: Parsing ambiguous, natural-language business requests into typed conditions, entities, and required actions.
2. **High-Level Workflow Planning**: Devising minimal, efficient sequences of tools to fulfill business requirements.
3. **Contextual Reasoning**: Evaluating situational data (e.g. overdue amounts, customer communication status).
4. **Adaptive Failure Recovery**: Analyzing execution failure traces and generating compensatory actions.

### What the LLM Is Strictly Forbidden From Doing:
- Executing arbitrary code or shell commands.
- Bypassing safety policies or regulatory rules.
- Skipping human approval boundaries.
- Inventing or hallucinating nonexistent tool names.
- Directly reading or writing database tables via raw SQL.
- Granting itself elevated permissions.

---

## 2. Current Model Configuration
- **Active Model**: `Qwen3 8B` (running locally via Ollama)
- **Local Inference Environment**: NVIDIA GeForce RTX 4050 Laptop GPU (6 GB VRAM)
- **Reasoning Mode**: `think: false`
- **Output Safety Ceiling**: `num_predict: 260`
- **Temperature**: `0.2`

### Why `think: false` Is Enforced
In default reasoning mode, Qwen3 generates extended internal monologue tokens ("chain of thought"), inflating structured JSON generation latency to 22–35+ seconds per plan step. By disabling `think: false`, the model directly outputs minimal, execution-ready JSON in **~2.5 to 7.0 seconds** (evaluating at ~18 tokens/sec), reducing generation token count by >60% without compromising structural correctness or Zod validation.

---

## 3. Provider Architecture (`src/ai/providers/`)
FlowPilot implements a resilient, multi-tiered AI provider abstraction:

```text
               ProviderRouter (Active)
              /           |           \
             /            |            \
    Local Ollama     OpenRouter       Gemini
    (Primary Active)  (Fallback/Test)  (Tested)
```

1. **`OllamaProvider` (Primary Local Runtime)**:
   - Base URL: `http://127.0.0.1:11434`
   - Model: `qwen3:8b`
   - Features: Fast zero-cloud local inference, raw telemetry duration logging, length truncation detection (`done_reason === 'length'`), 30-second abort signal timeout.
2. **`ProviderRouter`**:
   - Manages graceful degradation and failover between configured providers.
   - Enforces global AI budget limits (e.g. max 10 AI calls per workflow) to prevent infinite loops.
3. **`GeminiProvider` / `OpenRouterProvider`**:
   - Tested and supported interfaces for cloud fallback when local GPU inference is unavailable or keys are provided in `.env`.

---

## 4. Objective Analyzer (`src/ai/prompts/objective-analyzer.ts`)
Converts raw user strings into a typed `Objective` schema:
```text
User Input: "Find all overdue invoices above ₹50,000, analyze customers, prioritize, and prepare follow-up emails."
      ↓
{
  "objective": "Identify and handle overdue invoices above ₹50,000",
  "entities": ["invoices", "customers", "emails"],
  "conditions": [
    { "field": "amount", "operator": ">", "value": "50000" },
    { "field": "status", "operator": "equal", "value": "overdue" }
  ],
  "requiredActions": ["analyze", "prioritize", "prepare_email", "request_approval"],
  "approvalRequired": true
}
```

---

## 5. Dynamic Planner (`src/ai/prompts/planner.ts`)
Synthesizes the structured objective, authoritative tool descriptions, business data, and prior completed actions into a minimal execution plan:
```json
{
  "steps": [
    { "tool": "getOverdueInvoices", "arguments": { "min_amount": 50000 } },
    { "tool": "verifyAction", "arguments": { "action": "analyze" } },
    { "tool": "prepareEmail", "arguments": {} },
    { "tool": "sendEmail", "arguments": {} }
  ]
}
```

### Prompt Constraints
1. **Authoritative Tools Only**: The model receives the live tool definitions from `ToolRegistry` and is explicitly forbidden from inventing placeholder tools (`unknown_tool`).
2. **Minimal High-Level Steps**: Prohibits unrolling per-item loops (the execution engine deterministically unrolls matching items).
3. **Zero Argument Prose**: Prevents LLM from writing paragraphs or email body drafts in planner output.

---

## 6. Plan Verification & Output Constraints
Before any plan can be executed, it must pass a 2-stage verification barrier:

1. **Zod Validation (`PlanSchema`)**:
   - Validates that the JSON structure conforms strictly to `{ steps: [{ tool: string, arguments: record }] }`.
2. **PlanVerifier (`PlanVerifier.verify()`)**:
   - Validates that every tool in the plan exists in the authoritative `ToolRegistry`.
   - Validates step dependency DAG integrity.
   - If an unauthorized or unknown tool is present, PlanVerifier immediately throws `CapabilityUnavailableError` and halts execution.

---

## 7. AI Safety Pipeline
FlowPilot guarantees that an LLM can never directly trigger side effects or access databases without governance:

```text
    Natural Language Objective
                ↓
        Objective Analyzer
                ↓
         Dynamic Planner
                ↓
      Zod Schema Validation
                ↓
           PlanVerifier
                ↓
       Authoritative Tools
                ↓
          Policy Engine
                ↓
     Human-in-the-Loop Gate
   (Approval Pauses Execution)
                ↓
    Deterministic Tool Execution
```
