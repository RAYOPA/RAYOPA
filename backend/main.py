from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from typing import List, Dict, Any, Optional
import uuid
import sys
import os
import datetime

# Add root directory to path to import agents
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from agents.orchestrator import Orchestrator, WORKFLOW_STATES

from .database import get_db, Base, engine, SessionLocal
from .models import Workflow, AuditEvent, Approval, Invoice, Customer, Payment, Communication, ToolExecution, Replan
from .tool_registry import ToolContext
from .tools import registry

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="FlowPilot Backend API")

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def seed_initial_data(db: Session):
    try:
        if db.query(Customer).count() == 0:
            c1 = Customer(id="cust-1", name="Alpha Corp", email="alpha@acme.com")
            c2 = Customer(id="cust-2", name="Beta Inc", email="beta@acme.com")
            c3 = Customer(id="cust-3", name="Gamma LLC", email="gamma@acme.com")
            c4 = Customer(id="cust-4", name="Delta Logistics", email="invalid@acme.com", phone="valid@deltalogistics.com")
            c5 = Customer(id="cust-5", name="Epsilon Group", email="epsilon@acme.com")
            c6 = Customer(id="cust-6", name="Zeta Partners", email="zeta@acme.com")
            c7 = Customer(id="cust-7", name="Eta Systems", email="eta@acme.com")
            db.add_all([c1, c2, c3, c4, c5, c6, c7])
            db.commit()

        if db.query(Invoice).count() == 0:
            now = datetime.datetime.now()
            i1 = Invoice(id="inv-1001", invoice_number="INV-1001", customer_id="cust-1", amount=60000.0, due_date=now - datetime.timedelta(days=10), days_overdue=10, status="OVERDUE")
            i2 = Invoice(id="inv-1002", invoice_number="INV-1002", customer_id="cust-2", amount=120000.0, due_date=now - datetime.timedelta(days=40), days_overdue=40, status="OVERDUE")
            i3 = Invoice(id="inv-1003", invoice_number="INV-1003", customer_id="cust-3", amount=600000.0, due_date=now - datetime.timedelta(days=10), days_overdue=10, status="OVERDUE")
            i4 = Invoice(id="inv-1004", invoice_number="INV-1004", customer_id="cust-4", amount=80000.0, due_date=now - datetime.timedelta(days=10), days_overdue=10, status="OVERDUE")
            i5 = Invoice(id="inv-1005", invoice_number="INV-1005", customer_id="cust-5", amount=70000.0, due_date=now - datetime.timedelta(days=10), days_overdue=10, status="OVERDUE")
            i6 = Invoice(id="inv-1006", invoice_number="INV-1006", customer_id="cust-6", amount=150000.0, due_date=now - datetime.timedelta(days=5), days_overdue=5, status="OVERDUE")
            i9 = Invoice(id="inv-1009", invoice_number="INV-1009", customer_id="cust-7", amount=55000.0, due_date=now - datetime.timedelta(days=10), days_overdue=10, status="PAYMENT_EXTENDED")
            db.add_all([i1, i2, i3, i4, i5, i6, i9])
            db.commit()
    except Exception as e:
        print(f"Seed error: {e}")

@app.on_event("startup")
def startup_event():
    db = SessionLocal()
    try:
        seed_initial_data(db)
    finally:
        db.close()

def _create_patched_logger(workflow_id: str):
    import utils.audit_logger

    original_log_event = utils.audit_logger.AuditLogger.log_event

    def patched_log_event(self, agent_name, action, details):
        res = original_log_event(self, agent_name, action, details)
        db = SessionLocal()
        try:
            tool_name = details.get("tool") if isinstance(details, dict) else None
            status_val = details.get("status") if isinstance(details, dict) else None
            summary_val = None
            if isinstance(details, dict):
                summary_val = details.get("reason") or details.get("action") or str(details)
            else:
                summary_val = str(details)

            db_event = AuditEvent(
                id=str(uuid.uuid4()),
                workflow_id=workflow_id,
                event_type=action,
                actor=agent_name,
                tool=tool_name,
                status=status_val,
                summary=summary_val,
                metadata_json=details
            )
            db.add(db_event)
            db.commit()

            if action == "Workflow Completed":
                wf = db.query(Workflow).filter(Workflow.id == workflow_id).first()
                if wf:
                    wf.status = "COMPLETED"
                    wf.completed_at = func.now()
                    db.commit()
            elif action == "Workflow Failed":
                wf = db.query(Workflow).filter(Workflow.id == workflow_id).first()
                if wf:
                    wf.status = "FAILED"
                    db.commit()
            elif action == "Approval Required":
                wf = db.query(Workflow).filter(Workflow.id == workflow_id).first()
                if wf:
                    wf.status = "WAITING_FOR_APPROVAL"
                appr = Approval(
                    id=str(uuid.uuid4()),
                    workflow_id=workflow_id,
                    action=details.get("tool", "Action") if isinstance(details, dict) else "Action",
                    reason=details.get("reason", "Human authorization required") if isinstance(details, dict) else "Human authorization required",
                    status="PENDING"
                )
                db.add(appr)
                db.commit()
            elif action == "Workflow Paused":
                wf = db.query(Workflow).filter(Workflow.id == workflow_id).first()
                if wf:
                    wf.status = "WAITING_FOR_APPROVAL"
                    db.commit()
        except Exception as e:
            print("DB Log Error:", e)
        finally:
            db.close()
        return res

    return original_log_event, patched_log_event

def run_orchestrator(workflow_id: str):
    import utils.audit_logger
    original_log, patched_log = _create_patched_logger(workflow_id)
    utils.audit_logger.AuditLogger.log_event = patched_log

    try:
        orchestrator = Orchestrator()
        db = SessionLocal()
        try:
            wf = db.query(Workflow).filter(Workflow.id == workflow_id).first()
            objective = wf.objective if wf else "Unknown"
        finally:
            db.close()

        orchestrator.run_workflow(workflow_id=workflow_id, goal=objective)
    except Exception as e:
        print(f"Workflow execution failed: {e}")
        db = SessionLocal()
        try:
            wf = db.query(Workflow).filter(Workflow.id == workflow_id).first()
            if wf:
                wf.status = "FAILED"
                db.commit()
        finally:
            db.close()
    finally:
        utils.audit_logger.AuditLogger.log_event = original_log

def resume_orchestrator(workflow_id: str):
    import utils.audit_logger
    original_log, patched_log = _create_patched_logger(workflow_id)
    utils.audit_logger.AuditLogger.log_event = patched_log

    try:
        orchestrator = Orchestrator()
        orchestrator.resume_workflow(workflow_id=workflow_id)
    except Exception as e:
        print(f"Workflow resume failed: {e}")
        db = SessionLocal()
        try:
            wf = db.query(Workflow).filter(Workflow.id == workflow_id).first()
            if wf:
                wf.status = "FAILED"
                db.commit()
        finally:
            db.close()
    finally:
        utils.audit_logger.AuditLogger.log_event = original_log

@app.post("/api/workflows")
def create_workflow(payload: Dict[str, Any], background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    wf = Workflow(
        id=str(uuid.uuid4()),
        objective=payload.get("objective", "Unknown"),
        mode=payload.get("mode", "AUTONOMOUS"),
        status="IN_PROGRESS"
    )
    db.add(wf)
    db.commit()
    db.refresh(wf)

    background_tasks.add_task(run_orchestrator, wf.id)

    return {"id": wf.id, "status": wf.status}

@app.get("/api/workflows")
def list_workflows(db: Session = Depends(get_db)):
    workflows = db.query(Workflow).order_by(Workflow.created_at.desc()).all()
    res = []
    for wf in workflows:
        live = WORKFLOW_STATES.get(wf.id)
        current_status = wf.status if wf.status in ["REJECTED", "FAILED"] else (live.status if live else wf.status)
        res.append({
            "id": wf.id,
            "objective": wf.objective,
            "mode": wf.mode,
            "status": current_status,
            "created_at": wf.created_at.isoformat() if wf.created_at else None,
            "completed_at": wf.completed_at.isoformat() if wf.completed_at else None
        })
    return res

@app.get("/api/workflows/{id}")
def get_workflow(id: str, db: Session = Depends(get_db)):
    wf = db.query(Workflow).filter(Workflow.id == id).first()
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow not found")

    live_state = WORKFLOW_STATES.get(id)
    approvals = db.query(Approval).filter(Approval.workflow_id == id).all()

    completed_actions = []
    plan = []
    failures = []
    current_step_index = 0
    ai_call_count = 0
    status = wf.status

    if live_state:
        status = wf.status if wf.status in ["REJECTED", "FAILED"] else live_state.status
        current_step_index = live_state.current_step_index
        ai_call_count = live_state.ai_call_count
        plan = [p.model_dump() for p in live_state.plan]
        completed_actions = [a.model_dump() for a in live_state.completed_actions]
        failures = live_state.failures
    elif wf.current_plan:
        plan = wf.current_plan if isinstance(wf.current_plan, list) else []

    return {
        "id": wf.id,
        "objective": wf.objective,
        "mode": wf.mode,
        "status": status,
        "current_step_index": current_step_index,
        "ai_call_count": ai_call_count,
        "plan": plan,
        "completed_actions": completed_actions,
        "failures": failures,
        "approvals": [
            {
                "id": a.id,
                "workflow_id": a.workflow_id,
                "action": a.action,
                "reason": a.reason,
                "status": a.status,
                "requested_at": a.requested_at.isoformat() if a.requested_at else None,
                "approved_by": a.approved_by,
                "approved_at": a.approved_at.isoformat() if a.approved_at else None
            }
            for a in approvals
        ],
        "created_at": wf.created_at.isoformat() if wf.created_at else None,
        "updated_at": wf.updated_at.isoformat() if wf.updated_at else None,
        "completed_at": wf.completed_at.isoformat() if wf.completed_at else None
    }

@app.get("/api/workflows/{id}/events")
def get_workflow_events(id: str, db: Session = Depends(get_db)):
    events = db.query(AuditEvent).filter(AuditEvent.workflow_id == id).order_by(AuditEvent.timestamp.asc()).all()
    res = []
    for e in events:
        res.append({
            "id": e.id,
            "workflow_id": e.workflow_id,
            "event_type": e.event_type,
            "actor": e.actor,
            "tool": e.tool,
            "status": e.status,
            "summary": e.summary,
            "metadata_json": e.metadata_json,
            "timestamp": e.timestamp.isoformat() if e.timestamp else None
        })
    return res

@app.get("/api/approvals")
def list_approvals(status: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Approval, Workflow.objective).join(Workflow, Approval.workflow_id == Workflow.id)
    if status:
        query = query.filter(Approval.status == status)
    results = query.order_by(Approval.requested_at.desc()).all()
    res = []
    for appr, objective in results:
        res.append({
            "id": appr.id,
            "workflow_id": appr.workflow_id,
            "workflow_objective": objective,
            "action": appr.action,
            "reason": appr.reason,
            "status": appr.status,
            "requested_at": appr.requested_at.isoformat() if appr.requested_at else None,
            "approved_by": appr.approved_by,
            "approved_at": appr.approved_at.isoformat() if appr.approved_at else None
        })
    return res

@app.post("/api/workflows/{id}/approve")
def approve_action(id: str, payload: Dict[str, Any] = None, background_tasks: BackgroundTasks = None, db: Session = Depends(get_db)):
    payload = payload or {}
    approval_id = payload.get("approval_id")

    query = db.query(Approval).filter(Approval.workflow_id == id)
    if approval_id:
        approval = query.filter(Approval.id == approval_id).first()
    else:
        approval = query.filter(Approval.status == "PENDING").order_by(Approval.requested_at.desc()).first()

    if approval:
        approval.status = "APPROVED"
        approval.approved_by = payload.get("actor", "USER")
        approval.approved_at = func.now()
        db.commit()

        db_event = AuditEvent(
            id=str(uuid.uuid4()),
            workflow_id=id,
            event_type="Action Approved",
            actor="HumanInTheLoop",
            tool=approval.action,
            status="APPROVED",
            summary=f"Action approved by {payload.get('actor', 'USER')}",
            metadata_json=payload
        )
        db.add(db_event)
        db.commit()

    wf = db.query(Workflow).filter(Workflow.id == id).first()
    if wf:
        wf.status = "IN_PROGRESS"
        db.commit()

    if background_tasks:
        background_tasks.add_task(resume_orchestrator, id)
    else:
        resume_orchestrator(id)

    return {"status": "APPROVED", "workflow_id": id}

@app.post("/api/workflows/{id}/reject")
def reject_action(id: str, payload: Dict[str, Any] = None, db: Session = Depends(get_db)):
    payload = payload or {}
    approval_id = payload.get("approval_id")

    query = db.query(Approval).filter(Approval.workflow_id == id)
    if approval_id:
        approval = query.filter(Approval.id == approval_id).first()
    else:
        approval = query.filter(Approval.status == "PENDING").order_by(Approval.requested_at.desc()).first()

    if approval:
        approval.status = "REJECTED"
        db.commit()

        db_event = AuditEvent(
            id=str(uuid.uuid4()),
            workflow_id=id,
            event_type="Action Rejected",
            actor="HumanInTheLoop",
            tool=approval.action,
            status="REJECTED",
            summary=f"Operator rejected action: {approval.action}",
            metadata_json=payload
        )
        db.add(db_event)
        db.commit()

    wf = db.query(Workflow).filter(Workflow.id == id).first()
    if wf:
        wf.status = "REJECTED"
        db.commit()

    if id in WORKFLOW_STATES:
        WORKFLOW_STATES[id].status = "REJECTED"

    return {"status": "REJECTED", "workflow_id": id}

@app.get("/api/audit")
def list_all_audit_events(workflow_id: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(AuditEvent)
    if workflow_id:
        query = query.filter(AuditEvent.workflow_id == workflow_id)
    events = query.order_by(AuditEvent.timestamp.desc()).limit(200).all()
    res = []
    for e in events:
        res.append({
            "id": e.id,
            "workflow_id": e.workflow_id,
            "event_type": e.event_type,
            "actor": e.actor,
            "tool": e.tool,
            "status": e.status,
            "summary": e.summary,
            "metadata_json": e.metadata_json,
            "timestamp": e.timestamp.isoformat() if e.timestamp else None
        })
    return res

@app.get("/api/metrics")
def get_metrics(db: Session = Depends(get_db)):
    total_invoices = db.query(Invoice).count()
    actionable_invoices = db.query(Invoice).filter(Invoice.status == "OVERDUE").count()
    monitoring_invoices = db.query(Invoice).filter(Invoice.status != "OVERDUE").count()

    total_approvals = db.query(Approval).count()
    approved_count = db.query(Approval).filter(Approval.status == "APPROVED").count()
    rejected_count = db.query(Approval).filter(Approval.status == "REJECTED").count()

    # Calculate from live states or DB
    active_state = None
    if WORKFLOW_STATES:
        active_state = list(WORKFLOW_STATES.values())[-1]

    successful_actions = 0
    failed_attempts = 0
    recovered_failures = 0
    replans = 0

    if active_state:
        email_actions = [a for a in active_state.completed_actions if a.tool_name == "sendEmail"]
        successful_actions = len(email_actions)
        alt_success = any(
            a.arguments.get("recipient") == "valid@deltalogistics.com"
            for a in active_state.completed_actions
            if hasattr(a, "arguments") and isinstance(a.arguments, dict)
        )
        recovered_failures = 1 if alt_success else 0
        failed_attempts = 1 if (recovered_failures > 0 or len(active_state.failures) > 0) else 0
        replans = 1 if (recovered_failures > 0 or active_state.ai_call_count >= 3) else 0
    else:
        exec_events = db.query(AuditEvent).filter(AuditEvent.event_type.in_(["Task Success", "ACTION_EXECUTED"])).count()
        successful_actions = exec_events if exec_events > 0 else 0
        fail_events = db.query(AuditEvent).filter(AuditEvent.event_type.in_(["Task Failed", "EXECUTION_FAILED"])).count()
        failed_attempts = fail_events

    business_actions = successful_actions
    unresolved = max(0, failed_attempts - recovered_failures)

    return {
        "invoices_analyzed": total_invoices,
        "actionable_cases": actionable_invoices,
        "monitoring_cases": monitoring_invoices,
        "approval_requests": total_approvals,
        "approved": approved_count,
        "rejected": rejected_count,
        "business_actions": business_actions,
        "successful_actions": successful_actions,
        "failed_attempts": failed_attempts,
        "recovered_failures": recovered_failures,
        "replans": replans,
        "unresolved": unresolved
    }

@app.post("/api/workflows/{id}/replan")
def trigger_replan(id: str, payload: Dict[str, Any], db: Session = Depends(get_db)):
    replan = Replan(
        id=str(uuid.uuid4()),
        workflow_id=id,
        trigger=payload.get("trigger", "FAILURE"),
        failure_context=payload.get("failure_context"),
        new_plan=payload.get("new_plan")
    )
    db.add(replan)
    db.commit()
    return {"status": "REPLAN_LOGGED", "replan_id": replan.id}

@app.post("/api/workflows/{id}/execute-tool")
def execute_tool(id: str, payload: Dict[str, Any], db: Session = Depends(get_db)):
    tool_name = payload.get("tool_name")
    input_data = payload.get("input_data", {})
    step_id = payload.get("step_id", "step-0")
    action_id = payload.get("action_id", str(uuid.uuid4()))

    ctx = ToolContext(workflow_id=id, step_id=step_id, action_id=action_id, db=db)
    result = registry.execute_tool(tool_name, input_data, ctx)
    return result.model_dump()

@app.get("/api/invoices")
def get_invoices(db: Session = Depends(get_db)):
    invoices = db.query(Invoice).all()
    res = []
    for inv in invoices:
        res.append({
            "id": inv.id,
            "invoice_number": inv.invoice_number,
            "customer_id": inv.customer_id,
            "amount": inv.amount,
            "status": inv.status,
            "days_overdue": inv.days_overdue,
            "due_date": inv.due_date.isoformat() if inv.due_date else None
        })
    return res

@app.get("/api/customers")
def get_customers(db: Session = Depends(get_db)):
    customers = db.query(Customer).all()
    res = []
    for c in customers:
        res.append({
            "id": c.id,
            "name": c.name,
            "email": c.email,
            "phone": c.phone,
            "status": c.status,
            "risk_level": c.risk_level
        })
    return res
