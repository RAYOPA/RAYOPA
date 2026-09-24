import os
import datetime
from dotenv import load_dotenv
import uuid
import json

load_dotenv()
os.environ["DATABASE_URL"] = "sqlite:///./data/flowpilot_day3.db"

from backend.database import Base, get_db, engine, SessionLocal
from backend.models import Customer, Invoice, Workflow
from agents.state import State
from backend.tools import registry
import agents.nodes.planner as planner_node_module

def measure():
    db = SessionLocal()
    # Mock what planner_node does deterministically
    state = State(workflow_id="wf-measure-1", objective="Find all overdue invoices above ₹50,000, analyze the customers, prioritize the cases, prepare follow-up emails, and ask me for approval before sending.", current_step_index=0)
    
    tools_dict = planner_node_module.get_tools_dictionary()
    tool_schema_size = len(json.dumps(tools_dict))
    
    # Analyze Payload Mock
    structured_obj = {
        "objective": state.objective,
        "entities": ["invoice", "customer"],
        "conditions": [{"field": "status", "operator": "==", "value": "OVERDUE"}, {"field": "amount", "operator": ">=", "value": 50000}],
        "requiredActions": ["analyze", "prioritize", "prepareEmail", "askApproval"],
        "approvalRequired": True
    }
    
    from backend.tool_registry import ToolContext
    ctx = ToolContext(workflow_id=state.workflow_id, step_id="gather", action_id=str(uuid.uuid4()), db=db)
    
    inv_res = registry.execute_tool("getOverdueInvoices", {}, ctx)
    invoices = inv_res.data.get("invoices", []) if inv_res.status == "SUCCESS" else []
    
    gathered_cases = []
    for inv in invoices:
        if inv["amount"] >= 50000: # filter locally for matching
            cust_res = registry.execute_tool("getCustomer", {"customer_id": inv["customer_id"]}, ctx)
            contact_res = registry.execute_tool("getCustomerContacts", {"customer_id": inv["customer_id"]}, ctx)
            
            gathered_cases.append({
                "invoice": inv,
                "customer": cust_res.data if cust_res.status == "SUCCESS" else None,
                "contacts": contact_res.data if contact_res.status == "SUCCESS" else None
            })
            
    pol_res = registry.execute_tool("getPolicy", {"policy_type": "overdue"}, ctx)
    policy = pol_res.data.get("content") if pol_res.status == "SUCCESS" else ""
    
    context_data = {
        "cases": gathered_cases,
        "policy": policy
    }
    
    serialized_context_size = len(json.dumps(context_data))
    
    # Build what CLI builds
    context_str = json.dumps(context_data, indent=2)
    user_prompt = f"""Generate a dynamic execution plan for the following objective:

Objective Summary: [BATCH MODE]
Original Objective: {structured_obj['objective']}

Context Data for all cases:
{context_str}
Entities: {", ".join(structured_obj['entities'])}
Conditions: {json.dumps(structured_obj['conditions'])}
Required Actions: {", ".join(structured_obj['requiredActions'])}
Overall Approval Required: {structured_obj['approvalRequired']}

Plan the steps carefully using only the available tools."""

    tools_formatted = "\\n\\n".join([f"- **{t['name']}**: {t['description']}\\n  Inputs: {json.dumps(t['inputSchema'])}" for t in tools_dict.values()])

    system_prompt = f"""You are the Dynamic Planner for FlowPilot AI.
Your job is to translate a structured business objective into a sequential execution plan.
You have access to a specific set of tools. You MUST ONLY use the tools provided in the tool registry.
If a requested capability does not exist in the tools list (e.g., booking a flight), do NOT invent a tool. You must still generate a step, but use a tool name like "unknown_tool" so the verifier can catch it, or attempt to use the closest tool.

Available Tools:
{tools_formatted}

Rules:
1. Each step must have a unique stepId (e.g., step_1).
2. 'dependsOn' must contain an array of stepIds that must execute before this step.
3. 'tool' must be the exact name from the registry.
4. Set 'requiresApproval' to true for steps that actually perform sensitive actions, based on the objective's requirement.

You must output a JSON object with this exact structure:
{{
  "objective": "The overall objective this plan achieves",
  "steps": [
    {{
      "stepId": "unique string identifier",
      "action": "human readable description of the step",
      "tool": "exact tool name from the registry",
      "arguments": {{ "key": "value" }},
      "dependsOn": ["array of stepIds"],
      "requiresApproval": boolean
    }}
  ]
}}"""

    print("--- METRICS ---")
    print(f"Number of invoices included: {len(invoices)}")
    print(f"Number of cases matching amount filter: {len(gathered_cases)}")
    print(f"Number of customer records included: {len(gathered_cases)}")
    
    # Calculate comm history size: Currently we do not fetch comm history in planner_node.
    comm_history_size = 0
    print(f"Communication history size: {comm_history_size}")
    print(f"Policy context size: {len(policy)}")
    print(f"Available tool schema size (chars): {tool_schema_size}")
    print(f"Completed actions size: 2 (empty array)")
    print(f"Failure context size: 2 (empty array)")
    
    print(f"Serialized context size (chars): {serialized_context_size}")
    print(f"System prompt size (chars): {len(system_prompt)}")
    print(f"User prompt size (chars): {len(user_prompt)}")
    
    total_chars = len(system_prompt) + len(user_prompt)
    print(f"Total approximate characters: {total_chars}")
    print(f"Total approximate tokens (chars / 4): {total_chars // 4}")

    db.close()

if __name__ == "__main__":
    measure()
