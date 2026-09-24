import os
import datetime
from dotenv import load_dotenv

load_dotenv()
os.environ["DATABASE_URL"] = "sqlite:///:memory:"
os.environ["EMAIL_MODE"] = "sandbox"

from backend.database import Base, get_db, engine, SessionLocal
from backend.models import Customer, Invoice, Workflow
from agents.orchestrator import Orchestrator
import agents.orchestrator as orch_module

Base.metadata.create_all(bind=engine)
session = SessionLocal()
c = Customer(id="cust-1", name="Acme Corp", email="contact@acme.com")
i = Invoice(id="inv-1", invoice_number="INV-1004", customer_id="cust-1", amount=100.0, due_date=datetime.datetime(2023, 1, 1))
session.add(c)
session.add(i)
session.commit()
session.close()

orchestrator = Orchestrator()
goal = "Send a payment reminder email to Acme Corp (cust-1) for invoice INV-1004. Note: use invalid@acme.com first to trigger a failure, then find their real email and try again."

session = SessionLocal()
wf = Workflow(id="wf-test-2", objective=goal)
session.add(wf)
session.commit()
session.close()

print("Running workflow...")
orchestrator.run_workflow(workflow_id="wf-test-2", goal=goal)

state = orch_module.WORKFLOW_STATES["wf-test-2"]
print("Final Status:", state.status)
print("Plan:")
for p in state.plan:
    print(f"- {p.tool}: {p.arguments} (requires_approval: {p.requires_approval})")
print("Failures:", state.failures)
print("Completed Actions:")
for a in state.completed_actions:
    print(f"- {a.tool_name}: {a.arguments} -> {a.result}")
