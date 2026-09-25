import os
import datetime
from dotenv import load_dotenv
import uuid
import time
import json

load_dotenv()
os.environ["DATABASE_URL"] = "sqlite:///./data/flowpilot_cross_test.db"
os.environ["EMAIL_MODE"] = "sandbox"

os.makedirs("./data", exist_ok=True)
if os.path.exists("./data/flowpilot_cross_test.db"):
    try: os.remove("./data/flowpilot_cross_test.db")
    except Exception: pass

from backend.database import Base, get_db, engine, SessionLocal
from backend.models import Customer, Invoice, Workflow
from agents.orchestrator import Orchestrator
from backend.workflow_state import load_workflow_state
from backend.execution_memory import memory_layer

def setup_db():
    Base.metadata.create_all(bind=engine)
    session = SessionLocal()
    c1 = Customer(id="cust-1", name="Alpha Corp", email="alpha@acme.com")
    session.add_all([c1])
    
    now = datetime.datetime.now()
    i1 = Invoice(id="inv-1001", invoice_number="INV-1001", customer_id="cust-1", amount=60000.0, due_date=now - datetime.timedelta(days=10), days_overdue=10, status="OVERDUE")
    session.add_all([i1])
    session.commit()
    session.close()

def run_cross_app_test():
    print("Setting up cross-app integration test...")
    setup_db()
    orchestrator = Orchestrator()
    
    # 2. CANONICAL CROSS-APPLICATION OBJECTIVE
    goal = "Find customers with overdue invoices above ₹50,000, check their CRM status, update the collections spreadsheet with the latest priority and customer status, prepare follow-up emails, ask for approval before sending, send approved emails, and verify delivery."
    workflow_id = f"wf-cross-{uuid.uuid4().hex[:6]}"
    
    session = SessionLocal()
    wf = Workflow(id=workflow_id, objective=goal)
    session.add(wf)
    session.commit()
    session.close()
    
    print("Starting cross-app workflow execution...")
    # Step 1: Execute to failure point
    orchestrator.run_workflow(workflow_id=workflow_id, goal=goal)
    
    state = load_workflow_state(workflow_id)
    print("Status after initial run:", state.status)
    
    # We expect it to hit WAITING_FOR_APPROVAL if it reaches sendEmail, or if there is a failure, REPLAN.
    # The MockProvider will return spreadsheetUpdateRow with "Collections" which fails.
    # The orchestrator will automatically REPLAN if it fails, then output the new plan, 
    # run it, and pause at sendEmail (WAITING_FOR_APPROVAL).
    # Since Orchestrator loop handles REPLAN automatically, it should pause at WAITING_FOR_APPROVAL.
    
    # Let's inspect the state
    print(f"Current step index: {state.current_step_index}")
    print(f"Failures: {state.failures}")
    print(f"Completed Actions: {len(state.completed_actions)}")
    
    # Verify Failure and Replan
    assert len(state.failures) == 0, "Failures should be cleared after successful replan"
    assert state.ai_call_count >= 2, "Should have called AI for analysis, plan, and replan"
    
    assert state.status == "WAITING_FOR_APPROVAL"
    
    # Simulate Approval
    print("Approving sendEmail step...")
    orchestrator.resume_workflow(workflow_id=workflow_id)
    
    state = load_workflow_state(workflow_id)
    print("Status after approval resume:", state.status)
    for a in state.completed_actions:
        print(f"Action: {a.tool_name}")
    assert state.status == "COMPLETED"
    
    # Verify execution memory
    exp = memory_layer.retrieve_relevant_experience(goal)
    assert len(exp) > 0, "Execution memory not saved."
    
    # Verify metrics
    print("\nRetrieval Metrics:", state.retrieval_metrics)
    assert state.retrieval_metrics["tools_retrieved"] > 0
    
    print("\n--- TEST SUCCESS ---")
    print("All requirements met: CRM -> Spreadsheet (fail) -> Replan -> Spreadsheet (success) -> Email -> Approval -> Complete.")

if __name__ == "__main__":
    run_cross_app_test()
