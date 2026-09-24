import os
import datetime
from dotenv import load_dotenv
import uuid

load_dotenv()

# We will use SQLite for testing but treat it as the real DB for Day 3 local testing since Postgres is missing.
os.environ["DATABASE_URL"] = "sqlite:///./data/flowpilot_day3.db"
os.environ["EMAIL_MODE"] = "sandbox"

# Ensure data dir exists
os.makedirs("./data", exist_ok=True)
if os.path.exists("./data/flowpilot_day3.db"):
    os.remove("./data/flowpilot_day3.db")

from backend.database import Base, get_db, engine, SessionLocal
from backend.models import Customer, Invoice, Workflow
from agents.orchestrator import Orchestrator
from agents.state import State
import agents.orchestrator as orch_module

def setup_db():
    Base.metadata.create_all(bind=engine)
    session = SessionLocal()
    
    # Seed canonical data
    # "7 matching invoices, 6 actionable cases, 1 monitoring-only case, 3 approval-required actions, 6 intended business actions, 7 execution attempts, 6 successful business actions, 1 failed execution attempt, 1 recovered failure, 1 replan, 0 unresolved cases"
    
    # Customers
    c1 = Customer(id="cust-1", name="Alpha Corp", email="alpha@acme.com")
    c2 = Customer(id="cust-2", name="Beta Inc", email="beta@acme.com")
    c3 = Customer(id="cust-3", name="Gamma LLC", email="gamma@acme.com")
    c4 = Customer(id="cust-4", name="Delta Logistics", email="invalid@acme.com") # the failure case
    c5 = Customer(id="cust-5", name="Epsilon Group", email="epsilon@acme.com")
    c6 = Customer(id="cust-6", name="Zeta Partners", email="zeta@acme.com")
    c7 = Customer(id="cust-7", name="Eta Systems", email="eta@acme.com")
    
    # Add an alternate contact for Delta Logistics to enable replan success
    c4.phone = "valid@deltalogistics.com" 

    session.add_all([c1, c2, c3, c4, c5, c6, c7])
    
    # Invoices overdue > 50000
    now = datetime.datetime.now()
    
    i1 = Invoice(id="inv-1001", invoice_number="INV-1001", customer_id="cust-1", amount=60000.0, due_date=now - datetime.timedelta(days=10), days_overdue=10, status="OVERDUE")
    i2 = Invoice(id="inv-1002", invoice_number="INV-1002", customer_id="cust-2", amount=120000.0, due_date=now - datetime.timedelta(days=40), days_overdue=40, status="OVERDUE") # > 100k, >30 days -> manager approval
    i3 = Invoice(id="inv-1003", invoice_number="INV-1003", customer_id="cust-3", amount=600000.0, due_date=now - datetime.timedelta(days=10), days_overdue=10, status="OVERDUE") # > 500k -> finance manager approval
    i4 = Invoice(id="inv-1004", invoice_number="INV-1004", customer_id="cust-4", amount=80000.0, due_date=now - datetime.timedelta(days=10), days_overdue=10, status="OVERDUE") # Fails email to invalid@acme.com
    i5 = Invoice(id="inv-1005", invoice_number="INV-1005", customer_id="cust-5", amount=70000.0, due_date=now - datetime.timedelta(days=10), days_overdue=10, status="OVERDUE")
    i6 = Invoice(id="inv-1006", invoice_number="INV-1006", customer_id="cust-6", amount=150000.0, due_date=now - datetime.timedelta(days=5), days_overdue=5, status="OVERDUE") # another high value
    i9 = Invoice(id="inv-1009", invoice_number="INV-1009", customer_id="cust-7", amount=55000.0, due_date=now - datetime.timedelta(days=10), days_overdue=10, status="OVERDUE") # Monitoring only, but its status is just OVERDUE because the policy handles the logic. Wait, no, the prompt says "recent payment extension -> no immediate escalation". Let me set its status to PAYMENT_EXTENDED or something? But getOverdueInvoices filters by status == "OVERDUE". Let's change getOverdueInvoices instead to filter by due_date < now or days_overdue > 0, or just leave it as OVERDUE and it will be fetched.
    i9 = Invoice(id="inv-1009", invoice_number="INV-1009", customer_id="cust-7", amount=55000.0, due_date=now - datetime.timedelta(days=10), days_overdue=10, status="PAYMENT_EXTENDED") 

    session.add_all([i1, i2, i3, i4, i5, i6, i9])
    session.commit()
    session.close()

def mock_run_cli(payload: dict, mode: str) -> dict:
    if mode == "analyze":
        return {
            "status": "SUCCESS",
            "structured_objective": {
                "objective": payload["objective"],
                "entities": ["invoices", "customers"],
                "conditions": [{"field": "days_overdue", "operator": ">", "value": 0}, {"field": "amount", "operator": ">", "value": 50000}],
                "requiredActions": ["sendEmail", "escalate"],
                "approvalRequired": True
            }
        }
    elif mode == "plan":
        # Return a batch of actions
        steps = []
        completed = payload.get("completed_actions", [])
        completed_invs = []
        for c in completed:
            if c["tool_name"] in ["sendEmail", "createCase"]:
                # The arguments might not have customer_id for sendEmail, we should extract it if we included it, or use recipient
                recip = c["arguments"].get("recipient", "")
                completed_invs.append(recip)
            elif c["tool_name"] == "verifyAction":
                completed_invs.append(c["arguments"].get("action", ""))
                
        for i, case in enumerate(payload.get("context", {}).get("cases", [])):
            inv = case["invoice"]
            cust_email = case["customer"].get("email") if case["customer"] else "test@acme.com"
            
            # Check if this invoice's actions were already completed
            # To avoid infinite loop for inv-1004, if valid@deltalogistics.com is in completed, skip inv-1004
            is_completed = cust_email in completed_invs
            if inv["invoice_number"] == "INV-1004" and "valid@deltalogistics.com" in completed_invs:
                is_completed = True
            if inv["invoice_number"] == "INV-1009" and "monitor_action" in completed_invs:
                is_completed = True
                
            if is_completed:
                continue
                
            if inv["invoice_number"] == "INV-1004": # The failure case
                steps.append({"tool": "sendEmail", "arguments": {"recipient": "invalid@acme.com", "subject": "Overdue", "body": "Pay us"}, "reason": "Send overdue email", "requiresApproval": False})
            elif inv["invoice_number"] == "INV-1009": # The monitoring case
                steps.append({"tool": "verifyAction", "arguments": {"action": "monitor_action"}, "reason": "Monitor case", "requiresApproval": False})
            else:
                steps.append({"tool": "sendEmail", "arguments": {"recipient": cust_email, "subject": "Overdue", "body": "Pay us"}, "reason": "Send overdue email", "requiresApproval": False})
                
        return {
            "status": "SUCCESS",
            "steps": steps
        }
    elif mode == "replan":
        # Recovery for INV-1004
        return {
            "status": "SUCCESS",
            "steps": [
                {"tool": "sendEmail", "arguments": {"recipient": "valid@deltalogistics.com", "subject": "Overdue", "body": "Pay us"}, "reason": "Retry with valid email", "requiresApproval": False}
            ]
        }
    return {"status": "FAILED", "message": "Mock not implemented"}

def run_tests(deterministic: bool = False):
    setup_db()
    
    if deterministic:
        import agents.nodes.planner as planner_module
        planner_module.run_cli = mock_run_cli
        print("--- RUNNING DAY 3 DETERMINISTIC TESTS (NON-LLM) ---")
    else:
        print("--- RUNNING DAY 3 CANONICAL WORKFLOW (REAL GEMINI) ---")
        
    orchestrator = Orchestrator()
    
    goal = "Find all overdue invoices above ₹50,000, analyze the customers, prioritize the cases, prepare follow-up emails, and ask me for approval before sending."
    
    workflow_id = f"wf-day3-{uuid.uuid4().hex[:6]}"
    session = SessionLocal()
    wf = Workflow(id=workflow_id, objective=goal)
    session.add(wf)
    session.commit()
    session.close()
    
    orchestrator.run_workflow(workflow_id=workflow_id, goal=goal)
    
    state = orch_module.WORKFLOW_STATES.get(workflow_id)
    if not state:
        print("Workflow state not found.")
        return
        
    loop_count = 0
    # Auto-approve any WAITING_FOR_APPROVAL states but log them explicitly to demonstrate approval test (Step 7)
    while state.status == "WAITING_FOR_APPROVAL" and loop_count < 15:
        print(f"\n[APPROVAL BOUNDARY DETECTED] Auto-approving step {state.current_step_index}...")
        orchestrator.resume_workflow(workflow_id=workflow_id)
        state = orch_module.WORKFLOW_STATES[workflow_id]
        loop_count += 1

    state = orch_module.WORKFLOW_STATES[workflow_id]
    
    print("\n--- FINAL DAY 3 REPORT DATA ---")
    print("Final Status:", state.status)
    print("AI Calls Used:", state.ai_call_count)
    print("\nCompleted Actions:")
    for a in state.completed_actions:
        print(f"- {a.tool_name}: {a.arguments}")
        
    print("\nFailures:")
    for f in state.failures:
        print(f"- {f.get('tool_name', 'unknown')} failed: {f.get('error', 'unknown error')}")

if __name__ == "__main__":
    import sys
    deterministic = "--deterministic" in sys.argv
    run_tests(deterministic=deterministic)
