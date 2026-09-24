import os
import datetime
from dotenv import load_dotenv

load_dotenv()

# Ensure we use an in-memory DB for tests
os.environ["DATABASE_URL"] = "sqlite:///:memory:"
os.environ["EMAIL_MODE"] = "sandbox"

from backend.database import Base, get_db, engine, SessionLocal
from backend.models import Customer, Invoice, Workflow
from agents.orchestrator import Orchestrator
from agents.state import State
import agents.orchestrator as orch_module

def setup_db():
    Base.metadata.create_all(bind=engine)
    session = SessionLocal()
    
    # Seed data
    c = Customer(id="cust-1", name="Acme Corp", email="contact@acme.com")
    i = Invoice(id="inv-1", invoice_number="INV-1004", customer_id="cust-1", amount=100.0, due_date=datetime.datetime(2023, 1, 1))
    session.add(c)
    session.add(i)
    session.commit()
    session.close()

def run_tests():
    setup_db()
    orchestrator = Orchestrator()
    
    # TEST B: Failure Recovery
    print("--- RUNNING TEST B: Failure Recovery ---")
    goal = "Send a payment reminder email to Acme Corp (cust-1) for invoice INV-1004. Note: use invalid@acme.com first to trigger a failure, then find their real email and try again."
    
    session = SessionLocal()
    wf = Workflow(id="wf-test-2", objective=goal)
    session.add(wf)
    session.commit()
    session.close()
    
    orchestrator.run_workflow(workflow_id="wf-test-2", goal=goal)
    
    # Auto-approve any WAITING_FOR_APPROVAL states to allow the workflow to hit the failure case and replan
    state = orch_module.WORKFLOW_STATES["wf-test-2"]
    loop_count = 0
    while state.status == "WAITING_FOR_APPROVAL" and loop_count < 10:
        print(f"Auto-approving step {state.current_step_index}...")
        orchestrator.resume_workflow(workflow_id="wf-test-2")
        state = orch_module.WORKFLOW_STATES["wf-test-2"]
        loop_count += 1

    state = orch_module.WORKFLOW_STATES["wf-test-2"]
    print("TEST B Final Status:", state.status)
    print("TEST B Completed Actions:")
    for a in state.completed_actions:
        print(f"- {a.tool_name}: {a.arguments}")
        
    print("\n--- RUNNING TEST C: Unseen Objective ---")
    goal = "Find the customer with ID cust-1 and get their communication history."
    wf3 = Workflow(id="wf-test-3", objective=goal)
    session = SessionLocal()
    session.add(wf3)
    session.commit()
    session.close()
    
    orchestrator.run_workflow(workflow_id="wf-test-3", goal=goal)
    
    state = orch_module.WORKFLOW_STATES["wf-test-3"]
    print("TEST C Final Status:", state.status)
    print("TEST C Completed Actions:")
    for a in state.completed_actions:
        print(f"- {a.tool_name}: {a.arguments}")

if __name__ == "__main__":
    run_tests()
