import os
import uuid
import json
import time

db_path = "./data/flowpilot_canonical_test.db"
if os.path.exists(db_path):
    try:
        os.remove(db_path)
    except Exception:
        pass

os.environ["DATABASE_URL"] = f"sqlite:///{db_path}"

from fastapi.testclient import TestClient
from backend.main import app, seed_initial_data
from backend.database import SessionLocal
from backend.models import AuditEvent, ToolExecution, Approval, Workflow

client = TestClient(app)

def run_workflow_via_api(goal: str, approve: bool):
    wf_id = f"wf-{uuid.uuid4().hex[:6]}"
    
    # Start workflow
    res = client.post("/api/workflows", json={"objective": goal})
    if res.status_code != 200:
        print("Failed to start workflow:", res.text)
        return {"error": res.text}
        
    wf_id = res.json()["id"]
    
    # Wait for approval
    time.sleep(1)
    for _ in range(30):
        db = SessionLocal()
        wf = db.query(Workflow).filter_by(id=wf_id).first()
        if wf and wf.status in ["WAITING_FOR_APPROVAL", "COMPLETED", "FAILED"]:
            db.close()
            break
        db.close()
        time.sleep(1)
        
    db = SessionLocal()
    wf = db.query(Workflow).filter_by(id=wf_id).first()
    
    if wf and wf.status == "WAITING_FOR_APPROVAL":
        # Login to get JWT
        login_res = client.post("/api/auth/login", data={"username": "admin", "password": "admin123"})
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        if approve:
            client.post(f"/api/workflows/{wf_id}/approve", headers=headers)
        else:
            client.post(f"/api/workflows/{wf_id}/reject", headers=headers)
            
        time.sleep(1)
        for _ in range(15):
            db.expire_all()
            wf = db.query(Workflow).filter_by(id=wf_id).first()
            if wf and wf.status in ["COMPLETED", "FAILED"]:
                break
            time.sleep(1)
            
    db.expire_all()
    events = db.query(AuditEvent).filter_by(workflow_id=wf_id).order_by(AuditEvent.timestamp).all()
    executions = db.query(ToolExecution).filter_by(workflow_id=wf_id).order_by(ToolExecution.started_at).all()
    approvals = db.query(Approval).filter_by(workflow_id=wf_id).all()
    wf_record = db.query(Workflow).filter_by(id=wf_id).first()
    
    reconciliation = {
        "workflow_id": wf_id,
        "final_status": wf_record.status if wf_record else None,
        "approved": approve,
        "chronology": []
    }
    
    for e in events:
        reconciliation["chronology"].append({
            "type": "AuditEvent",
            "event": e.event_type,
            "summary": e.summary,
            "tool": e.tool,
            "status": e.status,
            "timestamp": e.timestamp.isoformat() if e.timestamp else None
        })
        
    for ex in executions:
        reconciliation["chronology"].append({
            "type": "ToolExecution",
            "tool": ex.tool_name,
            "status": ex.status,
            "error": ex.error,
            "timestamp": ex.started_at.isoformat() if ex.started_at else None
        })
        
    for ap in approvals:
        reconciliation["chronology"].append({
            "type": "Approval",
            "action": ap.action,
            "status": ap.status,
            "timestamp": ap.requested_at.isoformat() if ap.requested_at else None
        })
        
    reconciliation["chronology"].sort(key=lambda x: x.get("timestamp", ""))
    db.close()
    
    return reconciliation

if __name__ == "__main__":
    os.makedirs("tests/results", exist_ok=True)
    results = {}
    
    db = SessionLocal()
    seed_initial_data(db)
    db.close()
    
    print("Running approved path...")
    res1 = run_workflow_via_api("Process INV-1002 and explicitly ask for approval.", True)
    results["approved_path"] = res1
    
    print("Running rejected path...")
    res2 = run_workflow_via_api("Process INV-1002 and explicitly ask for approval.", False)
    results["rejected_path"] = res2
    
    with open("tests/results/audit_reconciliation.json", "w") as f:
        json.dump(results, f, indent=2)
    
    print("Reconciliation complete. Results saved.")
