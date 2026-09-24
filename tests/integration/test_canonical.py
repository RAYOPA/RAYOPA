import os
import datetime
from dotenv import load_dotenv
import uuid
import time

load_dotenv()
os.environ["DATABASE_URL"] = "sqlite:///./data/flowpilot_canonical_test.db"
os.environ["EMAIL_MODE"] = "sandbox"

os.makedirs("./data", exist_ok=True)
if os.path.exists("./data/flowpilot_canonical_test.db"):
    try: os.remove("./data/flowpilot_canonical_test.db")
    except Exception: pass

from backend.database import Base, get_db, engine, SessionLocal
from backend.models import Customer, Invoice, Workflow
from agents.orchestrator import Orchestrator
import agents.orchestrator as orch_module
from utils.audit_logger import AuditLogger
import json

def setup_db():
    Base.metadata.create_all(bind=engine)
    session = SessionLocal()
    c1 = Customer(id="cust-1", name="Alpha Corp", email="alpha@acme.com")
    c2 = Customer(id="cust-2", name="Beta Inc", email="beta@acme.com")
    c3 = Customer(id="cust-3", name="Gamma LLC", email="gamma@acme.com")
    c4 = Customer(id="cust-4", name="Delta Logistics", email="invalid@acme.com") 
    c5 = Customer(id="cust-5", name="Epsilon Group", email="epsilon@acme.com")
    c6 = Customer(id="cust-6", name="Zeta Partners", email="zeta@acme.com")
    c7 = Customer(id="cust-7", name="Eta Systems", email="eta@acme.com")
    c4.phone = "valid@deltalogistics.com" 
    session.add_all([c1, c2, c3, c4, c5, c6, c7])
    
    now = datetime.datetime.now()
    i1 = Invoice(id="inv-1001", invoice_number="INV-1001", customer_id="cust-1", amount=60000.0, due_date=now - datetime.timedelta(days=10), days_overdue=10, status="OVERDUE")
    i2 = Invoice(id="inv-1002", invoice_number="INV-1002", customer_id="cust-2", amount=120000.0, due_date=now - datetime.timedelta(days=40), days_overdue=40, status="OVERDUE")
    i3 = Invoice(id="inv-1003", invoice_number="INV-1003", customer_id="cust-3", amount=600000.0, due_date=now - datetime.timedelta(days=10), days_overdue=10, status="OVERDUE")
    i4 = Invoice(id="inv-1004", invoice_number="INV-1004", customer_id="cust-4", amount=80000.0, due_date=now - datetime.timedelta(days=10), days_overdue=10, status="OVERDUE")
    i5 = Invoice(id="inv-1005", invoice_number="INV-1005", customer_id="cust-5", amount=70000.0, due_date=now - datetime.timedelta(days=10), days_overdue=10, status="OVERDUE")
    i6 = Invoice(id="inv-1006", invoice_number="INV-1006", customer_id="cust-6", amount=150000.0, due_date=now - datetime.timedelta(days=5), days_overdue=5, status="OVERDUE")
    i9 = Invoice(id="inv-1009", invoice_number="INV-1009", customer_id="cust-7", amount=55000.0, due_date=now - datetime.timedelta(days=10), days_overdue=10, status="PAYMENT_EXTENDED") 
    session.add_all([i1, i2, i3, i4, i5, i6, i9])
    session.commit()
    session.close()

def run_canonical():
    setup_db()
    orchestrator = Orchestrator()
    goal = "Find all overdue invoices above ₹50,000, analyze the customers, prioritize the cases, prepare follow-up emails, and ask me for approval before sending."
    workflow_id = f"wf-day4-{uuid.uuid4().hex[:6]}"
    session = SessionLocal()
    wf = Workflow(id=workflow_id, objective=goal)
    session.add(wf)
    session.commit()
    session.close()
    
    start_time = time.time()
    print("Running initial workflow...")
    orchestrator.run_workflow(workflow_id=workflow_id, goal=goal)
    
    state = orch_module.WORKFLOW_STATES.get(workflow_id)
    print("Initial Run Status:", state.status)
    
    # Explicitly approve
    loop_count = 0
    while state.status == "WAITING_FOR_APPROVAL" and loop_count < 15:
        print(f"\n[MANUAL APPROVAL SIMULATION] Approving step {state.current_step_index}...")
        orchestrator.resume_workflow(workflow_id=workflow_id)
        state = orch_module.WORKFLOW_STATES[workflow_id]
        loop_count += 1
        print("Status after resume:", state.status)

    end_time = time.time()
    
    print("\n--- FINAL DAY 4 REPORT DATA ---")
    print("Final Status:", state.status)
    print("AI Calls Used:", state.ai_call_count)
    print("Latency:", round(end_time - start_time, 2), "s")
    
    print("\nCompleted Actions:")
    for a in state.completed_actions:
        print(f"- {a.tool_name}: {a.arguments}")
        
    print("\nFailures:")
    for f in state.failures:
        print(f"- {f.get('tool_name', 'unknown')} failed: {f.get('error', 'unknown error')}")
        
    print("\nPlan Steps generated:")
    for p in state.plan:
        print(f"- {p.tool}: {p.arguments} (Approval: {p.requires_approval})")

if __name__ == "__main__":
    run_canonical()
