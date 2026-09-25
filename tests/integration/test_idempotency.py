import os
import uuid
import datetime
import datetime

os.environ["DATABASE_URL"] = "sqlite:///:memory:"
os.environ["FRONTEND_ORIGIN"] = "http://localhost:3000"

from backend.main import app, seed_initial_data
from backend.database import Base, engine, get_db, SessionLocal
from backend.models import Workflow, Approval, AuditEvent, User, ToolExecution
from backend.tool_registry import ToolContext
from backend.tools import registry

def setup_module(module):
    Base.metadata.create_all(bind=engine)
    session = SessionLocal()
    seed_initial_data(session)
    session.close()

def teardown_module(module):
    Base.metadata.drop_all(bind=engine)

def test_idempotency():
    db = SessionLocal()
    wf_id = str(uuid.uuid4())
    wf = Workflow(id=wf_id, objective="Test Idempotency")
    db.add(wf)
    db.commit()

    action_id = str(uuid.uuid4())
    ctx = ToolContext(workflow_id=wf_id, step_id="step-1", action_id=action_id, db=db)

    # First execution
    res1 = registry.execute_tool("sendEmail", {"recipient": "test@acme.com"}, ctx)
    assert res1.status == "SUCCESS"
    assert res1.verificationMode != "IDEMPOTENT"

    # Second execution (same action_id) - A & B
    res2 = registry.execute_tool("sendEmail", {"recipient": "test@acme.com"}, ctx)
    assert res2.status == "SUCCESS"
    assert res2.verificationMode == "IDEMPOTENT"
    assert res1.data == res2.data

    # Check side effects / executions count
    executions = db.query(ToolExecution).filter_by(idempotency_key=f"{wf_id}_{action_id}").all()
    assert len(executions) == 1
    
    audits = db.query(AuditEvent).filter_by(event_type="IDEMPOTENT_REPLAY").all()
    assert len(audits) == 1
    assert audits[0].metadata_json["idempotency_key"] == f"{wf_id}_{action_id}"

    # C. Failed action -> retry allowed
    fail_action_id = str(uuid.uuid4())
    ctx_fail = ToolContext(workflow_id=wf_id, step_id="step-2", action_id=fail_action_id, db=db)
    
    res_fail = registry.execute_tool("sendEmail", {"recipient": "invalid@acme.com"}, ctx_fail)
    assert res_fail.status == "FAILED"
    
    # Retry (D)
    res_retry = registry.execute_tool("sendEmail", {"recipient": "valid@acme.com"}, ctx_fail)
    assert res_retry.status == "SUCCESS"
    
    # Later replay does not execute again
    res_replay = registry.execute_tool("sendEmail", {"recipient": "valid@acme.com"}, ctx_fail)
    assert res_replay.status == "SUCCESS"
    assert res_replay.verificationMode == "IDEMPOTENT"
    
    # E. Two concurrent identical requests (simulate by inserting a RUNNING record)
    conc_action_id = str(uuid.uuid4())
    conc_key = f"{wf_id}_{conc_action_id}"
    conc_exec = ToolExecution(id=str(uuid.uuid4()), workflow_id=wf_id, idempotency_key=conc_key, tool_name="sendEmail", status="RUNNING")
    db.add(conc_exec)
    db.commit()
    
    ctx_conc = ToolContext(workflow_id=wf_id, step_id="step-3", action_id=conc_action_id, db=db)
    res_conc = registry.execute_tool("sendEmail", {"recipient": "test2@acme.com"}, ctx_conc)
    assert res_conc.status == "FAILED"
    assert "Concurrent" in res_conc.error
    
    # F. Different action IDs with identical inputs
    action_id_3 = str(uuid.uuid4())
    ctx_3 = ToolContext(workflow_id=wf_id, step_id="step-4", action_id=action_id_3, db=db)
    res_3 = registry.execute_tool("sendEmail", {"recipient": "test@acme.com"}, ctx_3)
    assert res_3.status == "SUCCESS"
    assert res_3.verificationMode != "IDEMPOTENT"

    db.close()
