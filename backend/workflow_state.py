from agents.state import State
from backend.database import SessionLocal
from backend.models import Workflow

def save_workflow_state(workflow_id: str, state: State):
    db = SessionLocal()
    try:
        wf = db.query(Workflow).filter(Workflow.id == workflow_id).first()
        if wf:
            wf.execution_state = state.model_dump()
            db.commit()
    finally:
        db.close()

def load_workflow_state(workflow_id: str) -> State:
    db = SessionLocal()
    try:
        wf = db.query(Workflow).filter(Workflow.id == workflow_id).first()
        if wf and wf.execution_state:
            return State(**wf.execution_state)
    finally:
        db.close()
    return None
