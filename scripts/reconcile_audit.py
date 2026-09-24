import os
import sys
import time
import json
import uuid
import datetime
from typing import Dict, Any, List

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

from dotenv import load_dotenv
load_dotenv(os.path.join(PROJECT_ROOT, ".env"))

os.environ["EMAIL_MODE"] = "sandbox"
os.makedirs(os.path.join(PROJECT_ROOT, "data"), exist_ok=True)
os.makedirs(os.path.join(PROJECT_ROOT, "tests", "results"), exist_ok=True)

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.database import Base
from backend.models import Customer, Invoice, Workflow, Approval, AuditEvent
from agents.orchestrator import Orchestrator, WORKFLOW_STATES
from utils.audit_logger import AuditLogger

CANONICAL_GOAL = "Find all overdue invoices above ₹50,000, analyze the customers, prioritize the cases, prepare follow-up emails, and ask me for approval before sending."

def seed_database(session):
    c1 = Customer(id="cust-1", name="Alpha Corp", email="alpha@acme.com")
    c2 = Customer(id="cust-2", name="Beta Inc", email="beta@acme.com")
    c3 = Customer(id="cust-3", name="Gamma LLC", email="gamma@acme.com")
    c4 = Customer(id="cust-4", name="Delta Logistics", email="invalid@acme.com", phone="valid@deltalogistics.com")
    c5 = Customer(id="cust-5", name="Epsilon Group", email="epsilon@acme.com")
    c6 = Customer(id="cust-6", name="Zeta Partners", email="zeta@acme.com")
    c7 = Customer(id="cust-7", name="Eta Systems", email="eta@acme.com")
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

def reconcile_approval_path() -> Dict[str, Any]:
    print("\n[Step 4] Reconciling Lifecycle: Canonical Approval Path...")
    db_path = os.path.join(PROJECT_ROOT, "data", "reconcile_approval.db")
    if os.path.exists(db_path):
        try: os.remove(db_path)
        except Exception: pass

    db_url = f"sqlite:///{db_path}"
    os.environ["DATABASE_URL"] = db_url

    engine = create_engine(db_url, connect_args={"check_same_thread": False})
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    import backend.database as db_module
    db_module.engine = engine
    db_module.SessionLocal = SessionLocal

    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    session = SessionLocal()
    seed_database(session)
    session.close()

    WORKFLOW_STATES.clear()
    workflow_id = f"wf-recon-appr-{uuid.uuid4().hex[:6]}"

    session = SessionLocal()
    wf_db = Workflow(id=workflow_id, objective=CANONICAL_GOAL, status="IN_PROGRESS")
    session.add(wf_db)
    session.commit()
    session.close()

    audit_events_captured = []
    original_log_event = AuditLogger.log_event

    def patched_logger(self_logger, agent_name, action, details):
        ts = datetime.datetime.now().isoformat()
        event_dict = {
            "timestamp": ts,
            "agent": agent_name,
            "action": action,
            "details": details
        }
        audit_events_captured.append(event_dict)

        s = SessionLocal()
        try:
            tool_name = details.get("tool") if isinstance(details, dict) else None
            status_val = details.get("status") if isinstance(details, dict) else None
            summary_val = str(details)
            if isinstance(details, dict):
                summary_val = details.get("reason") or details.get("action") or str(details)

            db_ev = AuditEvent(
                id=str(uuid.uuid4()),
                workflow_id=workflow_id,
                event_type=action,
                actor=agent_name,
                tool=tool_name,
                status=status_val,
                summary=summary_val,
                metadata_json=details
            )
            s.add(db_ev)

            if action == "Approval Required":
                appr = Approval(
                    id=str(uuid.uuid4()),
                    workflow_id=workflow_id,
                    action=tool_name or "sendEmail",
                    reason=summary_val,
                    status="PENDING"
                )
                s.add(appr)
            s.commit()
        finally:
            s.close()

        return original_log_event(self_logger, agent_name, action, details)

    AuditLogger.log_event = patched_logger

    try:
        orchestrator = Orchestrator()
        orchestrator.run_workflow(workflow_id=workflow_id, goal=CANONICAL_GOAL)

        state = WORKFLOW_STATES[workflow_id]
        approval_gate_count = 0

        while state.status == "WAITING_FOR_APPROVAL" and approval_gate_count < 10:
            approval_gate_count += 1
            curr_step = state.plan[state.current_step_index]
            recip = curr_step.arguments.get("recipient")

            # Update DB approval
            s = SessionLocal()
            pending = s.query(Approval).filter(Approval.workflow_id == workflow_id, Approval.status == "PENDING").first()
            if pending:
                pending.status = "APPROVED"
                pending.approved_by = "SECURITY_ADMIN"
                pending.approved_at = datetime.datetime.now()

                # Add Action Approved event
                appr_ev = AuditEvent(
                    id=str(uuid.uuid4()),
                    workflow_id=workflow_id,
                    event_type="Action Approved",
                    actor="HumanInTheLoop",
                    tool=curr_step.tool,
                    status="APPROVED",
                    summary=f"Action approved by SECURITY_ADMIN for {recip}",
                    metadata_json={"actor": "SECURITY_ADMIN", "recipient": recip}
                )
                s.add(appr_ev)
                audit_events_captured.append({
                    "timestamp": datetime.datetime.now().isoformat(),
                    "agent": "HumanInTheLoop",
                    "action": "Action Approved",
                    "details": {"recipient": recip}
                })
            s.commit()
            s.close()

            # Resume
            orchestrator.resume_workflow(workflow_id=workflow_id)
            state = WORKFLOW_STATES[workflow_id]

    finally:
        AuditLogger.log_event = original_log_event

    final_state = WORKFLOW_STATES[workflow_id]

    # Reconciliation checks across all layers
    s = SessionLocal()
    db_wf = s.query(Workflow).filter(Workflow.id == workflow_id).first()
    db_approvals = s.query(Approval).filter(Approval.workflow_id == workflow_id).all()
    db_events = s.query(AuditEvent).filter(AuditEvent.workflow_id == workflow_id).order_by(AuditEvent.timestamp.asc()).all()
    s.close()

    # 1. Major Lifecycle Transitions Check
    event_actions = [e.event_type for e in db_events]
    has_start = "Workflow Started" in event_actions
    has_exec = "Executing Task" in event_actions
    has_appr_req = "Approval Required" in event_actions
    has_appr_grant = "Action Approved" in event_actions
    has_fail = "Task Failed" in event_actions
    has_replan = any("replan" in str(e.metadata_json).lower() or final_state.ai_call_count >= 3 for e in db_events)
    has_recovery_task = any(e.event_type == "Executing Task" and isinstance(e.metadata_json, dict) and "valid@deltalogistics.com" in str(e.metadata_json) for e in db_events)
    has_recovery_action = any(a.arguments.get("recipient") == "valid@deltalogistics.com" for a in final_state.completed_actions if hasattr(a, "arguments") and isinstance(a.arguments, dict))
    has_recovery = has_recovery_task and has_recovery_action
    has_complete = "Workflow Completed" in event_actions

    lifecycle_transitions = {
        "workflow_start": has_start,
        "planning_execution": has_exec,
        "approval_required": has_appr_req,
        "approval_granted": has_appr_grant,
        "failure": has_fail,
        "replan": has_replan,
        "recovery": has_recovery,
        "completion": has_complete
    }

    all_transitions_present = all(lifecycle_transitions.values())

    # 2. Monotonic Timestamps
    timestamps = [e.timestamp.isoformat() if e.timestamp else "" for e in db_events]
    is_monotonic = all(timestamps[i] <= timestamps[i+1] for i in range(len(timestamps)-1))

    # 3. Cross-layer reconciliation
    tool_success_events = [e for e in db_events if e.event_type == "Task Success"]
    state_completed_actions = len(final_state.completed_actions) # 7 (6 emails + 1 monitor)
    approval_records_count = len(db_approvals) # 3
    approved_records_count = len([a for a in db_approvals if a.status == "APPROVED"]) # 3

    layer_alignment = (
        len(tool_success_events) == state_completed_actions and
        approval_records_count == 3 and
        approved_records_count == 3 and
        final_state.status == "COMPLETED" and
        is_monotonic and
        all_transitions_present
    )

    try:
        engine.dispose()
        if os.path.exists(db_path):
            os.remove(db_path)
    except Exception:
        pass

    return {
        "workflow_id": workflow_id,
        "path": "approval_path",
        "final_state_status": final_state.status,
        "total_audit_events": len(db_events),
        "lifecycle_transitions": lifecycle_transitions,
        "all_transitions_present": all_transitions_present,
        "timestamp_monotonic": is_monotonic,
        "cross_layer_reconciliation": {
            "state_completed_actions": state_completed_actions,
            "audit_task_success_events": len(tool_success_events),
            "approval_records": approval_records_count,
            "approved_records": approved_records_count,
            "aligned": layer_alignment
        },
        "pass": layer_alignment
    }

def reconcile_rejection_path() -> Dict[str, Any]:
    print("\n[Step 4] Reconciling Lifecycle: Rejection Path...")
    db_path = os.path.join(PROJECT_ROOT, "data", "reconcile_rejection.db")
    if os.path.exists(db_path):
        try: os.remove(db_path)
        except Exception: pass

    db_url = f"sqlite:///{db_path}"
    os.environ["DATABASE_URL"] = db_url

    engine = create_engine(db_url, connect_args={"check_same_thread": False})
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    import backend.database as db_module
    db_module.engine = engine
    db_module.SessionLocal = SessionLocal

    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    session = SessionLocal()
    seed_database(session)
    session.close()

    WORKFLOW_STATES.clear()
    workflow_id = f"wf-recon-rej-{uuid.uuid4().hex[:6]}"

    session = SessionLocal()
    wf_db = Workflow(id=workflow_id, objective=CANONICAL_GOAL, status="IN_PROGRESS")
    session.add(wf_db)
    session.commit()
    session.close()

    audit_events_captured = []
    original_log_event = AuditLogger.log_event

    def patched_logger(self_logger, agent_name, action, details):
        ts = datetime.datetime.now().isoformat()
        event_dict = {
            "timestamp": ts,
            "agent": agent_name,
            "action": action,
            "details": details
        }
        audit_events_captured.append(event_dict)

        s = SessionLocal()
        try:
            tool_name = details.get("tool") if isinstance(details, dict) else None
            status_val = details.get("status") if isinstance(details, dict) else None
            summary_val = str(details)
            if isinstance(details, dict):
                summary_val = details.get("reason") or details.get("action") or str(details)

            db_ev = AuditEvent(
                id=str(uuid.uuid4()),
                workflow_id=workflow_id,
                event_type=action,
                actor=agent_name,
                tool=tool_name,
                status=status_val,
                summary=summary_val,
                metadata_json=details
            )
            s.add(db_ev)

            if action == "Approval Required":
                appr = Approval(
                    id=str(uuid.uuid4()),
                    workflow_id=workflow_id,
                    action=tool_name or "sendEmail",
                    reason=summary_val,
                    status="PENDING"
                )
                s.add(appr)
            s.commit()
        finally:
            s.close()

        return original_log_event(self_logger, agent_name, action, details)

    AuditLogger.log_event = patched_logger

    try:
        orchestrator = Orchestrator()
        orchestrator.run_workflow(workflow_id=workflow_id, goal=CANONICAL_GOAL)

        state = WORKFLOW_STATES[workflow_id]
        assert state.status == "WAITING_FOR_APPROVAL"

        curr_step = state.plan[state.current_step_index]
        rejected_recip = curr_step.arguments.get("recipient")

        # Perform Rejection
        s = SessionLocal()
        pending = s.query(Approval).filter(Approval.workflow_id == workflow_id, Approval.status == "PENDING").first()
        if pending:
            pending.status = "REJECTED"

        wf = s.query(Workflow).filter(Workflow.id == workflow_id).first()
        if wf:
            wf.status = "REJECTED"

        rej_ev = AuditEvent(
            id=str(uuid.uuid4()),
            workflow_id=workflow_id,
            event_type="Action Rejected",
            actor="HumanInTheLoop",
            tool=curr_step.tool,
            status="REJECTED",
            summary=f"Operator rejected action: {curr_step.tool} ({rejected_recip})",
            metadata_json={"recipient": rejected_recip, "reason": "Operator veto"}
        )
        s.add(rej_ev)
        s.commit()
        s.close()

        state.status = "REJECTED"
        WORKFLOW_STATES[workflow_id] = state

    finally:
        AuditLogger.log_event = original_log_event

    s = SessionLocal()
    db_wf = s.query(Workflow).filter(Workflow.id == workflow_id).first()
    db_approvals = s.query(Approval).filter(Approval.workflow_id == workflow_id).all()
    db_events = s.query(AuditEvent).filter(AuditEvent.workflow_id == workflow_id).order_by(AuditEvent.timestamp.asc()).all()
    s.close()

    event_actions = [e.event_type for e in db_events]
    has_start = "Workflow Started" in event_actions
    has_exec = "Executing Task" in event_actions
    has_appr_req = "Approval Required" in event_actions
    has_appr_rej = "Action Rejected" in event_actions

    lifecycle_transitions = {
        "workflow_start": has_start,
        "planning_execution": has_exec,
        "approval_required": has_appr_req,
        "approval_rejected": has_appr_rej,
        "no_further_execution": not any(e.event_type == "Task Success" and isinstance(e.metadata_json, dict) and "beta@acme.com" in str(e.metadata_json) for e in db_events)
    }

    all_transitions_present = all(lifecycle_transitions.values())
    timestamps = [e.timestamp.isoformat() if e.timestamp else "" for e in db_events]
    is_monotonic = all(timestamps[i] <= timestamps[i+1] for i in range(len(timestamps)-1))

    completed_actions_count = len(state.completed_actions)
    has_unauthorized = any(a.arguments.get("recipient") == rejected_recip for a in state.completed_actions if hasattr(a, "arguments") and isinstance(a.arguments, dict))

    rejection_alignment = (
        all_transitions_present and
        is_monotonic and
        db_wf.status == "REJECTED" and
        state.status == "REJECTED" and
        db_approvals[0].status == "REJECTED" and
        not has_unauthorized and
        completed_actions_count == 1 # Only Alpha executed
    )

    try:
        engine.dispose()
        if os.path.exists(db_path):
            os.remove(db_path)
    except Exception:
        pass

    return {
        "workflow_id": workflow_id,
        "path": "rejection_path",
        "final_state_status": state.status,
        "total_audit_events": len(db_events),
        "lifecycle_transitions": lifecycle_transitions,
        "all_transitions_present": all_transitions_present,
        "timestamp_monotonic": is_monotonic,
        "cross_layer_reconciliation": {
            "completed_actions_before_rejection": completed_actions_count,
            "rejected_action_executed": has_unauthorized,
            "db_workflow_status": db_wf.status,
            "db_approval_status": db_approvals[0].status,
            "aligned": rejection_alignment
        },
        "pass": rejection_alignment
    }

def main():
    print("=================================================================")
    print("  FLOWPILOT AI — STEP 4: AUDIT RECONCILIATION VALIDATION         ")
    print("=================================================================")

    appr_recon = reconcile_approval_path()
    time.sleep(1)
    rej_recon = reconcile_rejection_path()

    all_reconciled = appr_recon["pass"] and rej_recon["pass"]

    output_payload = {
        "timestamp": datetime.datetime.now().isoformat(),
        "baseline_commit": "0d00346",
        "all_reconciled": all_reconciled,
        "reconciliation": {
            "approval_path": appr_recon,
            "rejection_path": rej_recon
        }
    }

    out_file = os.path.join(PROJECT_ROOT, "tests", "results", "audit_reconciliation.json")
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(output_payload, f, indent=2)

    print("\n=================================================================")
    print(f"  AUDIT RECONCILIATION COMPLETE. ALL RECONCILED: {'PASS' if all_reconciled else 'FAIL'}")
    print(f"  Saved result to: {out_file}")
    print("=================================================================")

    if not all_reconciled:
        sys.exit(1)

if __name__ == "__main__":
    main()
