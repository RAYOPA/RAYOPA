import os
import json
import subprocess
from typing import List, Dict, Any
from agents.state import State, PlanStep
from backend.tools import registry

def get_tools_dictionary() -> Dict[str, Any]:
    tools_dict = {}
    for tool_name, tool_def in registry._tools.items():
        tools_dict[tool_name] = {
            "name": tool_name,
            "description": tool_def.description,
            "inputSchema": tool_def.inputSchema,
            "requiresApproval": tool_def.requiresApproval
        }
    return tools_dict

def run_cli(payload: dict, mode: str) -> dict:
    payload_str = json.dumps(payload)
    cli_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "src", "ai", "cli.ts")
    import tempfile
    try:
        with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.json') as temp_file:
            temp_file.write(payload_str)
            temp_file_path = temp_file.name

        print(f"Calling TS AI Orchestrator via CLI (Mode: {mode})")
        result = subprocess.run(
            ["npx", "tsx", cli_path, temp_file_path, mode],
            text=True, capture_output=True, check=True, shell=True
        )
        
        try: os.remove(temp_file_path)
        except OSError: pass
            
        if result.stderr:
            print(f"TS CLI stderr: {result.stderr}")
            
        stdout_str = result.stdout
        if "{" in stdout_str:
            json_str = stdout_str[stdout_str.find("{"):]
            return json.loads(json_str)
        else:
            raise ValueError(f"No JSON found in stdout: {stdout_str}")
    except subprocess.CalledProcessError as e:
        print(f"TS CLI failed: {e.stderr}")
        try:
            return json.loads(e.stdout)
        except:
            return {"status": "FAILED", "error": "UNKNOWN", "message": e.stderr or str(e)}

def planner_node(state: State) -> State:
    if state.status in ["EXECUTE", "APPROVED"] and not state.failures:
        return state
        
    tools_dict = get_tools_dictionary()
    
    if state.failures:
        state.ai_call_count += 1
        payload = {
            "failures": state.failures,
            "context": state.context,
            "tools": tools_dict,
            "ai_call_count": state.ai_call_count
        }
        res = run_cli(payload, "replan")
        if res.get("status") == "SUCCESS":
            steps_data = res.get("steps", [])
            new_plan = []
            for s in steps_data:
                reason_str = s.get("action") or s.get("reason", "")
                step = PlanStep(tool=s.get("tool"), arguments=s.get("arguments", {}), reason=reason_str, requires_approval=s.get("requiresApproval", False))
                # Deterministic policy override
                tool_def = registry.get_tool(step.tool)
                if tool_def and tool_def.requiresApproval: step.requires_approval = True
                new_plan.append(step)
            
            # Splice corrective recovery step(s) into plan at current_step_index, preserving remaining pending steps
            remaining_steps = state.plan[state.current_step_index + 1:] if (state.current_step_index + 1 < len(state.plan)) else []
            state.plan = state.plan[:state.current_step_index] + new_plan + remaining_steps
            # current_step_index stays at the newly spliced recovery step
            state.status = "EXECUTE" if new_plan else "COMPLETED"
            state.failures = []
        else:
            state.status = "FAILED"
            state.failures.append({"error": res.get("message", "Unknown"), "code": res.get("error")})
        return state

    # Mode: PLAN (Batch Architecture)
    # 1. Analyze
    state.ai_call_count += 1
    analyze_payload = {"objective": state.objective, "tools": tools_dict, "ai_call_count": state.ai_call_count}
    analyze_res = run_cli(analyze_payload, "analyze")
    
    if analyze_res.get("status") != "SUCCESS":
        state.status = "FAILED"
        state.failures.append({"error": analyze_res.get("message"), "code": analyze_res.get("error")})
        return state
        
    structured_obj = analyze_res.get("structured_objective", {})
    
    # 2. Deterministic Context Gathering
    from backend.database import SessionLocal
    from backend.tool_registry import ToolContext
    import uuid
    
    db = SessionLocal()
    ctx = ToolContext(workflow_id=state.workflow_id, step_id="gather", action_id="gather_invoices", db=db)
    
    # We fetch overdue invoices (which was standard behavior based on conditions)
    inv_res = registry.execute_tool("getOverdueInvoices", {}, ctx)
    invoices = inv_res.data.get("invoices", []) if inv_res.status == "SUCCESS" else []
    
    # Enrich with customers and payment history
    gathered_cases = []
    # Evaluate basic conditions if they exist
    required_amount = 0
    for cond in structured_obj.get("conditions", []):
        if cond.get("field") == "amount" and cond.get("operator") in [">", ">="]:
            required_amount = float(cond.get("value"))

    for inv in invoices:
        if float(inv.get("amount", 0)) >= required_amount:
            cust_ctx = ToolContext(workflow_id=state.workflow_id, step_id="gather", action_id=f"gather_cust_{inv['customer_id']}", db=db)
            cust_res = registry.execute_tool("getCustomer", {"customer_id": inv["customer_id"]}, cust_ctx)
            c_data = cust_res.data if (cust_res.status == "SUCCESS" and cust_res.data) else {}
            
            compact_case = {
                "inv": inv.get("invoice_number") or inv.get("id"),
                "cust": c_data.get("name") or inv.get("customer_id"),
                "email": c_data.get("email"),
                "amt": float(inv.get("amount", 0)),
                "days_overdue": inv.get("days_overdue", 0),
                "status": inv.get("status", "OVERDUE")
            }
            if c_data.get("phone"):
                compact_case["alt_contact"] = c_data.get("phone")
                
            gathered_cases.append(compact_case)
        
    compact_policy = (
        "POLICY: amt>=100k & overdue>30d -> mgr approval; amt>500k -> fin-mgr approval; "
        "status==PAYMENT_EXTENDED -> monitoring only; failed email -> find alt contact; "
        "ext comms -> approval required"
    )
    
    db.close()
    
    context_data = {
        "cases": gathered_cases,
        "policy": compact_policy
    }
    state.context = context_data
    
    # Omit alt_contact in initial plan context so primary email is evaluated first
    initial_cases = [{k: v for k, v in c.items() if k != "alt_contact"} for c in gathered_cases]
    initial_context = {
        "cases": initial_cases,
        "policy": compact_policy
    }

    # 3. Plan (Batch AI)
    state.ai_call_count += 1
    completed_actions = [a.model_dump() for a in state.completed_actions]
    
    plan_payload = {
        "structured_objective": structured_obj,
        "context": initial_context,
        "completed_actions": completed_actions,
        "tools": tools_dict,
        "ai_call_count": state.ai_call_count
    }
    plan_res = run_cli(plan_payload, "plan")
    
    if plan_res.get("status") == "SUCCESS":
        steps_data = plan_res.get("steps", [])
        new_plan = []
        for s in steps_data:
            reason_str = s.get("action") or s.get("reason", "")
            req_appr = s.get("requiresApproval", False)
            
            # 4. Deterministic Policy Boundary (Approval Override)
            recip = s.get("arguments", {}).get("recipient")
            if recip:
                for c in gathered_cases:
                    if c.get("email") == recip or c.get("alt_contact") == recip:
                        req_appr = (float(c.get("amt", 0)) >= 100000)
                        break
            
            tool_def = registry.get_tool(s.get("tool"))
            if tool_def and tool_def.requiresApproval:
                req_appr = True
                
            step = PlanStep(tool=s.get("tool"), arguments=s.get("arguments", {}), reason=reason_str, requires_approval=req_appr)
            new_plan.append(step)
            
        state.plan = new_plan
        state.current_step_index = 0
        state.status = "EXECUTE" if new_plan else "COMPLETED"
    else:
        state.status = "FAILED"
        state.failures.append({"error": plan_res.get("message"), "code": plan_res.get("error")})
        
    return state
