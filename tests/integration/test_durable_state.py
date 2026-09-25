import os
import uuid
import pytest

os.environ["DATABASE_URL"] = "sqlite:///:memory:"
os.environ["FRONTEND_ORIGIN"] = "http://localhost:3000"

from backend.main import seed_initial_data
from backend.database import Base, engine, SessionLocal
from backend.models import Workflow, Approval
from agents.orchestrator import Orchestrator
from backend.workflow_state import load_workflow_state

def setup_module(module):
    Base.metadata.create_all(bind=engine)
    session = SessionLocal()
    seed_initial_data(session)
    session.close()

def teardown_module(module):
    Base.metadata.drop_all(bind=engine)

def test_durable_state_resume():
    db = SessionLocal()
    wf_id = str(uuid.uuid4())
    goal = "Process INV-1004"
    wf = Workflow(id=wf_id, objective=goal)
    db.add(wf)
    db.commit()

    orch1 = Orchestrator()
    orch1.run_workflow(wf_id, goal)

    state = load_workflow_state(wf_id)
    assert state is not None, "Execution state should be saved to database"
    
    # We don't care if it paused or completed, just that it's persisted
    original_status = state.status

    # Simulate crash and manual db update
    state.status = "WAITING_FOR_APPROVAL"
    from backend.workflow_state import save_workflow_state
    save_workflow_state(wf_id, state)

    # Need to simulate approval to satisfy resume_workflow expectations
    # if it checks db, but resume_workflow just sets state.status = APPROVED
    # and continues streaming.
    del orch1
    orch2 = Orchestrator()

    # Resume the workflow in the new process
    orch2.resume_workflow(wf_id)

    # Validate the resumed workflow completed
    final_state = load_workflow_state(wf_id)
    assert final_state is not None
    assert final_state.status == "COMPLETED"

    db.close()
