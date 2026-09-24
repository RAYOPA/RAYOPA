import os
import json
from dotenv import load_dotenv

load_dotenv()
os.environ["DATABASE_URL"] = "sqlite:///./data/flowpilot_day3.db"

from backend.database import Base, get_db, engine, SessionLocal
from backend.models import Customer, Invoice, Workflow
from agents.state import State
from agents.nodes.planner import planner_node, run_cli, get_tools_dictionary

def run_test():
    tools_dict = get_tools_dictionary()
    
    # 1. Analyze
    obj = "Find overdue invoices above ₹50,000."
    analyze_payload = {"objective": obj, "tools": tools_dict, "ai_call_count": 1}
    print("Running Analyze...")
    analyze_res = run_cli(analyze_payload, "analyze")
    
    if analyze_res.get("status") != "SUCCESS":
        print("Analyze failed:", analyze_res)
        return
        
    structured_obj = analyze_res.get("structured_objective", {})
    print("Structured Objective:", json.dumps(structured_obj, indent=2))
    
    # 2. Plan
    plan_payload = {
        "structured_objective": structured_obj,
        "context": {"cases": []},
        "completed_actions": [],
        "tools": tools_dict,
        "ai_call_count": 2
    }
    print("\nRunning Plan...")
    plan_res = run_cli(plan_payload, "plan")
    
    print("\nPlan Result:", json.dumps(plan_res, indent=2))
    if plan_res.get("status") == "SUCCESS":
        print("\nStep 5 Planning Succeeded and Verified.")
    else:
        print("\nStep 5 Planning Failed.")

run_test()
