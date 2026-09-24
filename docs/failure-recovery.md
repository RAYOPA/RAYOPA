# FlowPilot AI — Adaptive Failure Recovery

## 1. Overview
In enterprise workflows, failures are inevitable: emails bounce, external APIs fail, and databases return missing records. While traditional scripts crash or hang, FlowPilot features an **adaptive self-healing architecture** that captures errors, reasons about failure causes, and executes alternative recovery plans autonomously.

---

## 2. Adaptive Recovery Lifecycle

```text
               +-----------------------------+
               |     Primary Tool Action     |
               +-----------------------------+
                              |
                              v
               +-----------------------------+
               |  Execution Error / Failure  |
               +-----------------------------+
                              |
                              v
               +-----------------------------+
               |  Failure Appended to State  |
               |       (state.failures)      |
               +-----------------------------+
                              |
                              v
               +-----------------------------+
               | Graph Routes to REPLAN Node |
               +-----------------------------+
                              |
                              v
               +-----------------------------+
               |  LLM Receives Failure Trace |
               |     & Generates Fallback    |
               +-----------------------------+
                              |
                              v
               +-----------------------------+
               |   Execute Corrective Step   |
               | (e.g. getCustomerContacts)  |
               +-----------------------------+
                              |
                              v
               +-----------------------------+
               |   Verify Corrective Action  |
               | (e.g. send to alt contact)  |
               +-----------------------------+
                              |
                              v
               +-----------------------------+
               |     Workflow RECOVERED      |
               +-----------------------------+
```

---

## 3. Canonical Case Study: `INV-1004` (Delta Logistics)

### Step 1: Initial Failure
- Target Invoice: `INV-1004` (₹80,000.00, Delta Logistics).
- Initial Contact Email on File: `invalid@acme.com`.
- Execution Attempt: The executor invokes `sendEmail(recipient="invalid@acme.com", ...)` in sandbox mode.
- Result: The email gateway detects the invalid domain and returns:
  ```json
  {
    "status": "FAILED",
    "error": "Invalid email address (SIMULATED)"
  }
  ```

### Step 2: Error Ingestion
The executor does NOT terminate the workflow. Instead:
1. It records `ToolExecution` with `status="FAILED"`.
2. It appends the failure to `state.failures`:
   ```python
   state.failures.append({
       "tool": "sendEmail",
       "error": "Invalid email address (SIMULATED)"
   })
   ```
3. It sets `state.status = "REPLAN"`.

### Step 3: Cognitive Replanning
The LangGraph state machine routes back to `planner_node` in `replan` mode:
- The TypeScript AI runtime (`DynamicPlanner`) receives the prompt:
  ```text
  [REPLAN MODE] A tool execution failed. Recover from this failure.
  Failures: [{"tool": "sendEmail", "error": "Invalid email address (SIMULATED)"}]
  Context: {"cases": [{"inv": "INV-1004", "cust": "Delta Logistics", ...}]}
  ```
- The LLM identifies that the email bounced and reasons:
  *"An alternate contact method must be retrieved for Delta Logistics."*
- It generates a targeted 3-step recovery plan:
  ```json
  {
    "steps": [
      { "tool": "getCustomerContacts", "arguments": { "customer_id": "Delta Logistics" } },
      { "tool": "prepareEmail", "arguments": {} },
      { "tool": "sendEmail", "arguments": {} }
    ]
  }
  ```

### Step 4: Fallback Execution & Resolution
1. **`getCustomerContacts`**: Queries `customers` table for Delta Logistics and discovers the alternative phone/email: `valid@deltalogistics.com`.
2. **`prepareEmail` & `sendEmail`**: Re-drafts and dispatches the notice to `valid@deltalogistics.com`.
3. **Recovery Verification**: Email delivery succeeds with `message_id="sim-..."`.
4. State is cleared, failure marked as **RECOVERED**, and workflow completes with **0 unresolved errors**.
