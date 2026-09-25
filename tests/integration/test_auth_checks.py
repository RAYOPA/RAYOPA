import os
import uuid
from fastapi.testclient import TestClient

os.environ["DATABASE_URL"] = "sqlite:///:memory:"
os.environ["FRONTEND_ORIGIN"] = "http://localhost:3000"

from backend.main import app, seed_initial_data
from backend.database import Base, engine, get_db, SessionLocal
from backend.models import Workflow, Approval, AuditEvent, User

client = TestClient(app)

def setup_module(module):
    Base.metadata.create_all(bind=engine)
    session = SessionLocal()
    seed_initial_data(session)
    session.close()

def teardown_module(module):
    Base.metadata.drop_all(bind=engine)

def get_token(username, password):
    res = client.post("/api/auth/login", data={"username": username, "password": password})
    return res.json().get("access_token")

def test_no_jwt():
    res = client.post("/api/workflows/wf-1/approve", json={})
    assert res.status_code == 401

def test_invalid_jwt():
    res = client.post("/api/workflows/wf-1/approve", headers={"Authorization": "Bearer invalid_token"}, json={})
    assert res.status_code == 401

def test_viewer_jwt_403():
    token = get_token("viewer", "viewer123")
    headers = {"Authorization": f"Bearer {token}"}
    assert client.post("/api/workflows/wf-1/approve", headers=headers, json={}).status_code == 403
    assert client.post("/api/workflows/wf-1/reject", headers=headers, json={}).status_code == 403
    assert client.post("/api/workflows/wf-1/execute-tool", headers=headers, json={"tool_name": "test"}).status_code == 403
    assert client.post("/api/workflows/wf-1/replan", headers=headers, json={"trigger": "test"}).status_code == 403

def test_operator_admin_jwt_success():
    session = SessionLocal()
    wf_id = str(uuid.uuid4())
    wf = Workflow(id=wf_id, objective="Test Operator")
    session.add(wf)
    appr_id = str(uuid.uuid4())
    appr = Approval(id=appr_id, workflow_id=wf_id, action="test", status="PENDING")
    session.add(appr)
    session.commit()
    session.close()

    op_token = get_token("operator", "operator123")
    res = client.post(f"/api/workflows/{wf_id}/approve", headers={"Authorization": f"Bearer {op_token}"}, json={"approval_id": appr_id})
    assert res.status_code == 200

    session = SessionLocal()
    appr_db = session.query(Approval).filter(Approval.id == appr_id).first()
    assert appr_db.approved_by == "operator"
    
    audit_db = session.query(AuditEvent).filter(AuditEvent.workflow_id == wf_id, AuditEvent.event_type == "Action Approved").first()
    assert audit_db.actor == "operator"
    session.close()

    # Reject path with admin
    session = SessionLocal()
    wf_id2 = str(uuid.uuid4())
    wf2 = Workflow(id=wf_id2, objective="Test Admin")
    session.add(wf2)
    appr2_id = str(uuid.uuid4())
    appr2 = Approval(id=appr2_id, workflow_id=wf_id2, action="test2", status="PENDING")
    session.add(appr2)
    session.commit()
    session.close()

    admin_token = get_token("admin", "admin123")
    res = client.post(f"/api/workflows/{wf_id2}/reject", headers={"Authorization": f"Bearer {admin_token}"}, json={"approval_id": appr2_id})
    assert res.status_code == 200

    session = SessionLocal()
    appr2_db = session.query(Approval).filter(Approval.id == appr2_id).first()
    assert appr2_db.status == "REJECTED"
    
    audit2_db = session.query(AuditEvent).filter(AuditEvent.workflow_id == wf_id2, AuditEvent.event_type == "Action Rejected").first()
    assert audit2_db.actor == "admin"
    session.close()

def test_cors():
    # OPTIONS request to test CORS
    res = client.options(
        "/api/workflows/test/approve",
        headers={
            "Origin": "http://evil.com",
            "Access-Control-Request-Method": "POST"
        }
    )
    # The preflight response shouldn't allow evil.com
    allowed = res.headers.get("access-control-allow-origin")
    assert allowed != "http://evil.com"
