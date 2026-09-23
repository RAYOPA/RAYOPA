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
    cli_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "src", "ai", "cli.js")
    import tempfile
    try:
        with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.json') as temp_file:
            temp_file.write(payload_str)
            temp_file_path = temp_file.name

        print(f"Calling TS AI Orchestrator via CLI (Mode: {mode})")
        result = subprocess.run(
            ["node", cli_path, temp_file_path, mode],
            text=True, capture_output=True, check=True, shell=True
        )
        
        try: os.remove(temp_file_path)
        except OSError: pass
            
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
    
    # Mode: REPLAN (if failures exist)
    if state.failures:
        state.ai_call_count += 1
        payload = {
            "failures": state.failures,
            "context": state.context,
            "tools": tools_dict
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
            
            state.plan = new_plan
            state.current_step_index = 0
            state.status = "EXECUTE" if new_plan else "COMPLETED"
            state.failures = []
        else:
            state.status = "FAILED"
            state.failures.append({"error": res.get("message", "Unknown"), "code": res.get("error")})
        return state

    # Mode: PLAN (Batch Architecture)
    # 1. Analyze
    state.ai_call_count += 1
    analyze_payload = {"objective": state.objective, "tools": tools_dict}
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
    ctx = ToolContext(workflow_id=state.workflow_id, step_id="gather", action_id=str(uuid.uuid4()), db=db)
    
    # We fetch overdue invoices (which was standard behavior based on conditions)
    inv_res = registry.execute_tool("getOverdueInvoices", {}, ctx)
    invoices = inv_res.data.get("invoices", []) if inv_res.status == "SUCCESS" else []
    
    # Enrich with customers and payment history
    gathered_cases = []
    for inv in invoices:
        cust_res = registry.execute_tool("getCustomer", {"customer_id": inv["customer_id"]}, ctx)
        contact_res = registry.execute_tool("getCustomerContacts", {"customer_id": inv["customer_id"]}, ctx)
        
        gathered_cases.append({
            "invoice": inv,
            "customer": cust_res.data if cust_res.status == "SUCCESS" else None,
            "contacts": contact_res.data if contact_res.status == "SUCCESS" else None
        })
        
    # Get Policy
    pol_res = registry.execute_tool("getPolicy", {"policy_type": "overdue"}, ctx)
    policy = pol_res.data.get("content") if pol_res.status == "SUCCESS" else ""
    
    db.close()
    
    context_data = {
        "cases": gathered_cases,
        "policy": policy
    }
    state.context = context_data
    
    # 3. Plan (Batch AI)
    state.ai_call_count += 1
    completed_actions = [a.model_dump() for a in state.completed_actions]
    
    plan_payload = {
        "structured_objective": structured_obj,
        "context": context_data,
        "completed_actions": completed_actions,
        "tools": tools_dict
    }
    plan_res = run_cli(plan_payload, "plan")
    
    if plan_res.get("status") == "SUCCESS":
        steps_data = plan_res.get("steps", [])
        new_plan = []
        for s in steps_data:
            reason_str = s.get("action") or s.get("reason", "")
            step = PlanStep(tool=s.get("tool"), arguments=s.get("arguments", {}), reason=reason_str, requires_approval=s.get("requiresApproval", False))
            
            # 4. Deterministic Policy Boundary (Approval Override)
            tool_def = registry.get_tool(step.tool)
            if tool_def and tool_def.requiresApproval: 
                step.requires_approval = True
                
            new_plan.append(step)
            
        state.plan = new_plan
        state.current_step_index = 0
        state.status = "EXECUTE" if new_plan else "COMPLETED"
    else:
        state.status = "FAILED"
        state.failures.append({"error": plan_res.get("message"), "code": plan_res.get("error")})
        
    return state
