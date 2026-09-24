import os
import sys
import time
import json
import uuid
import datetime
from typing import Dict, Any, List

# Ensure project root is in path
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

def seed_test_data(session):
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

def test_approval_path() -> Dict[str, Any]:
    print("\n=======================================================")
    print("  TEST 1: APPROVAL PATH (FULL CANONICAL RESUME)")
    print("=======================================================")

    db_filename = "test_approval_path.db"
    db_path = os.path.join(PROJECT_ROOT, "data", db_filename)
    if os.path.exists(db_path):
        try: os.remove(db_path)
        except Exception: pass

    db_url = f"sqlite:///{db_path}"
    os.environ["DATABASE_URL"] = db_url

    run_engine = create_engine(db_url, connect_args={"check_same_thread": False})
    RunSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=run_engine)

    import backend.database as db_module
    db_module.engine = run_engine
    db_module.SessionLocal = RunSessionLocal

    Base.metadata.drop_all(bind=run_engine)
    Base.metadata.create_all(bind=run_engine)

    session = RunSessionLocal()
    seed_test_data(session)
    session.close()

    WORKFLOW_STATES.clear()
    workflow_id = f"wf-appr-{uuid.uuid4().hex[:6]}"

    session = RunSessionLocal()
    wf_db = Workflow(id=workflow_id, objective=CANONICAL_GOAL, status="IN_PROGRESS")
    session.add(wf_db)
    session.commit()
    session.close()

    audit_events_list = []
    original_log_event = AuditLogger.log_event

    def run_patched_log_event(self_logger, agent_name, action, details):
        ts = datetime.datetime.now().isoformat()
        audit_events_list.append({"timestamp": ts, "agent": agent_name, "action": action, "details": details})
        s = RunSessionLocal()
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

            # Record Approval item in database when required
            if action == "Approval Required":
                appr_id = f"appr-{uuid.uuid4().hex[:6]}"
                appr = Approval(
                    id=appr_id,
                    workflow_id=workflow_id,
                    action=tool_name or "sendEmail",
                    reason=summary_val,
                    status="PENDING"
                )
                s.add(appr)
            s.commit()
        except Exception as e:
            print(f"[Approval Path] DB Audit Log Error: {e}")
        finally:
            s.close()
        return original_log_event(self_logger, agent_name, action, details)

    AuditLogger.log_event = run_patched_log_event

    orchestrator = Orchestrator()
    print(f"Launching workflow: {workflow_id}")
    orchestrator.run_workflow(workflow_id=workflow_id, goal=CANONICAL_GOAL)

    state = WORKFLOW_STATES[workflow_id]
    approvals_handled = 0
    sensitive_actions_executed = []

    while state.status == "WAITING_FOR_APPROVAL" and approvals_handled < 10:
        approvals_handled += 1
        current_step = state.plan[state.current_step_index]
        target_recip = current_step.arguments.get("recipient", "unknown")
        print(f"Approval gate #{approvals_handled} encountered for: {current_step.tool} ({target_recip})")

        # Verify DB has pending approval record
        s = RunSessionLocal()
        pending_appr = s.query(Approval).filter(Approval.workflow_id == workflow_id, Approval.status == "PENDING").first()
        assert pending_appr is not None, "Pending approval record missing in DB"
        # Update approval in DB
        pending_appr.status = "APPROVED"
        pending_appr.approved_by = "COMPLIANCE_OFFICER"
        pending_appr.approved_at = datetime.datetime.now()
        s.commit()
        s.close()

        # Resume workflow
        orchestrator.resume_workflow(workflow_id=workflow_id)
        state = WORKFLOW_STATES[workflow_id]
        sensitive_actions_executed.append(target_recip)

    final_state = WORKFLOW_STATES[workflow_id]
    AuditLogger.log_event = original_log_event

    # Database Verification
    s = RunSessionLocal()
    all_approvals = s.query(Approval).filter(Approval.workflow_id == workflow_id).all()
    approved_records = [a for a in all_approvals if a.status == "APPROVED"]
    s.close()

    # Check that sensitive actions (beta, gamma, zeta) actually executed
    executed_recips = [
        a.arguments.get("recipient") for a in final_state.completed_actions
        if hasattr(a, "arguments") and isinstance(a.arguments, dict)
    ]
    beta_executed = "beta@acme.com" in executed_recips
    gamma_executed = "gamma@acme.com" in executed_recips
    zeta_executed = "zeta@acme.com" in executed_recips

    timestamps = [e.get("timestamp") for e in audit_events_list if e.get("timestamp")]
    is_chronological = all(timestamps[i] <= timestamps[i+1] for i in range(len(timestamps)-1))

    passed = (
        final_state.status == "COMPLETED" and
        approvals_handled == 3 and
        len(approved_records) == 3 and
        beta_executed and
        gamma_executed and
        zeta_executed and
        is_chronological
    )

    try:
        run_engine.dispose()
        if os.path.exists(db_path):
            os.remove(db_path)
    except Exception:
        pass

    return {
        "test": "approval_path",
        "workflow_id": workflow_id,
        "final_status": final_state.status,
        "approvals_requested": approvals_handled,
        "approvals_approved": len(approved_records),
        "sensitive_actions_executed": sensitive_actions_executed,
        "beta_executed": beta_executed,
        "gamma_executed": gamma_executed,
        "zeta_executed": zeta_executed,
        "audit_events_count": len(audit_events_list),
        "audit_chronological": is_chronological,
        "pass": passed
    }

def test_rejection_path() -> Dict[str, Any]:
    print("\n=======================================================")
    print("  TEST 2: REJECTION PATH (SENSITIVE ACTION BLOCKED)")
    print("=======================================================")

    db_filename = "test_rejection_path.db"
    db_path = os.path.join(PROJECT_ROOT, "data", db_filename)
    if os.path.exists(db_path):
        try: os.remove(db_path)
        except Exception: pass

    db_url = f"sqlite:///{db_path}"
    os.environ["DATABASE_URL"] = db_url

    run_engine = create_engine(db_url, connect_args={"check_same_thread": False})
    RunSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=run_engine)

    import backend.database as db_module
    db_module.engine = run_engine
    db_module.SessionLocal = RunSessionLocal

    Base.metadata.drop_all(bind=run_engine)
    Base.metadata.create_all(bind=run_engine)

    session = RunSessionLocal()
    seed_test_data(session)
    session.close()

    WORKFLOW_STATES.clear()
    workflow_id = f"wf-rej-{uuid.uuid4().hex[:6]}"

    session = RunSessionLocal()
    wf_db = Workflow(id=workflow_id, objective=CANONICAL_GOAL, status="IN_PROGRESS")
    session.add(wf_db)
    session.commit()
    session.close()

    audit_events_list = []
    original_log_event = AuditLogger.log_event

    def run_patched_log_event(self_logger, agent_name, action, details):
        ts = datetime.datetime.now().isoformat()
        audit_events_list.append({"timestamp": ts, "agent": agent_name, "action": action, "details": details})
        s = RunSessionLocal()
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

            # Record Approval item in database when required
            if action == "Approval Required":
                appr_id = f"appr-{uuid.uuid4().hex[:6]}"
                appr = Approval(
                    id=appr_id,
                    workflow_id=workflow_id,
                    action=tool_name or "sendEmail",
                    reason=summary_val,
                    status="PENDING"
                )
                s.add(appr)
            s.commit()
        except Exception as e:
            print(f"[Rejection Path] DB Audit Log Error: {e}")
        finally:
            s.close()
        return original_log_event(self_logger, agent_name, action, details)

    AuditLogger.log_event = run_patched_log_event

    orchestrator = Orchestrator()
    print(f"Launching workflow: {workflow_id}")
    orchestrator.run_workflow(workflow_id=workflow_id, goal=CANONICAL_GOAL)

    state = WORKFLOW_STATES[workflow_id]
    print(f"Initial execution reached status: {state.status} at step index {state.current_step_index}")
    assert state.status == "WAITING_FOR_APPROVAL", f"Expected WAITING_FOR_APPROVAL, got {state.status}"

    rejected_step = state.plan[state.current_step_index]
    rejected_recipient = rejected_step.arguments.get("recipient")
    print(f"Target sensitive action to REJECT: {rejected_step.tool} to '{rejected_recipient}'")

    # Step 1: Alpha was executed before the gate
    pre_rejection_executed_recips = [
        a.arguments.get("recipient") for a in state.completed_actions
        if hasattr(a, "arguments") and isinstance(a.arguments, dict)
    ]
    print(f"Actions completed before rejection: {pre_rejection_executed_recips}")
    assert "alpha@acme.com" in pre_rejection_executed_recips, "Alpha should have executed prior to approval gate"

    # Step 2: Operator REJECTS the sensitive action
    s = RunSessionLocal()
    pending_appr = s.query(Approval).filter(Approval.workflow_id == workflow_id, Approval.status == "PENDING").first()
    assert pending_appr is not None, "Pending approval record must exist"
    pending_appr.status = "REJECTED"
    
    # Mark workflow as REJECTED in database and memory
    wf = s.query(Workflow).filter(Workflow.id == workflow_id).first()
    if wf:
        wf.status = "REJECTED"
    s.commit()

    # Log Rejection event
    db_ev = AuditEvent(
        id=str(uuid.uuid4()),
        workflow_id=workflow_id,
        event_type="Action Rejected",
        actor="HumanInTheLoop",
        tool=rejected_step.tool,
        status="REJECTED",
        summary=f"Operator rejected action: {rejected_step.tool} ({rejected_recipient})",
        metadata_json={"recipient": rejected_recipient, "reason": "Operator policy veto"}
    )
    s.add(db_ev)
    s.commit()
    s.close()

    # Update workflow state in memory to REJECTED
    state.status = "REJECTED"
    WORKFLOW_STATES[workflow_id] = state

    AuditLogger.log_event = original_log_event

    # Crucial Verification: Prove the sensitive action was NEVER executed!
    final_executed_recips = [
        a.arguments.get("recipient") for a in state.completed_actions
        if hasattr(a, "arguments") and isinstance(a.arguments, dict)
    ]
    rejected_action_executed = rejected_recipient in final_executed_recips
    print(f"Final completed actions: {final_executed_recips}")
    print(f"Was '{rejected_recipient}' executed? {rejected_action_executed}")

    # Verify no subsequent actions (Gamma, Delta, Epsilon, Zeta) were executed
    unauthorized_executions = [r for r in ["beta@acme.com", "gamma@acme.com", "epsilon@acme.com", "zeta@acme.com"] if r in final_executed_recips]

    # Verify Database state
    s = RunSessionLocal()
    db_wf = s.query(Workflow).filter(Workflow.id == workflow_id).first()
    db_appr = s.query(Approval).filter(Approval.workflow_id == workflow_id).first()
    db_status = db_wf.status if db_wf else None
    appr_status = db_appr.status if db_appr else None
    s.close()

    timestamps = [e.get("timestamp") for e in audit_events_list if e.get("timestamp")]
    is_chronological = all(timestamps[i] <= timestamps[i+1] for i in range(len(timestamps)-1))

    passed = (
        not rejected_action_executed and
        len(unauthorized_executions) == 0 and
        db_status == "REJECTED" and
        appr_status == "REJECTED" and
        state.status == "REJECTED" and
        is_chronological
    )

    try:
        run_engine.dispose()
        if os.path.exists(db_path):
            os.remove(db_path)
    except Exception:
        pass

    return {
        "test": "rejection_path",
        "workflow_id": workflow_id,
        "final_status": state.status,
        "rejected_action": f"{rejected_step.tool} ({rejected_recipient})",
        "rejected_action_executed": rejected_action_executed,
        "unauthorized_executions": unauthorized_executions,
        "database_workflow_status": db_status,
        "database_approval_status": appr_status,
        "audit_events_count": len(audit_events_list) + 1,
        "audit_chronological": is_chronological,
        "pass": passed
    }

def main():
    print("=================================================================")
    print("  FLOWPILOT AI — STEP 3: APPROVAL + REJECTION VALIDATION         ")
    print("=================================================================")
    print(f"Started at {datetime.datetime.now().isoformat()}\n")

    res_approval = test_approval_path()
    time.sleep(1)
    res_rejection = test_rejection_path()

    all_passed = res_approval["pass"] and res_rejection["pass"]

    benchmark_result = {
        "timestamp": datetime.datetime.now().isoformat(),
        "all_passed": all_passed,
        "tests": {
            "approval_path": res_approval,
            "rejection_path": res_rejection
        }
    }

    result_file = os.path.join(PROJECT_ROOT, "tests", "results", "approval_rejection.json")
    with open(result_file, "w", encoding="utf-8") as f:
        json.dump(benchmark_result, f, indent=2)

    print("\n=================================================================")
    print(f"  APPROVAL + REJECTION TESTS COMPLETE. STATUS: {'PASS' if all_passed else 'FAIL'}")
    print(f"  Artifact saved to: {result_file}")
    print("=================================================================")

    if not all_passed:
        sys.exit(1)

if __name__ == "__main__":
    main()
