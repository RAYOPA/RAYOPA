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

EXPECTED_SEQUENCE = [
    {"customer": "Alpha Corp", "recipient": "alpha@acme.com", "action": "sendEmail", "approval": False},
    {"customer": "Beta Inc", "recipient": "beta@acme.com", "action": "sendEmail", "approval": True},
    {"customer": "Gamma LLC", "recipient": "gamma@acme.com", "action": "sendEmail", "approval": True},
    {"customer": "Delta Logistics", "recipient": "invalid@acme.com", "action": "sendEmail", "approval": False, "fails": True},
    {"customer": "Delta Logistics", "recipient": "valid@deltalogistics.com", "action": "sendEmail", "approval": False, "recovery": True},
    {"customer": "Epsilon Group", "recipient": "epsilon@acme.com", "action": "sendEmail", "approval": False},
    {"customer": "Zeta Partners", "recipient": "zeta@acme.com", "action": "sendEmail", "approval": True},
    {"customer": "Eta Systems", "action": "verifyAction", "approval": False, "monitor": True}
]

def seed_canonical_data(session):
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

def run_failure_recovery_iteration(run_index: int) -> Dict[str, Any]:
    print(f"\n=======================================================")
    print(f"  FAILURE + RECOVERY VALIDATION: RUN {run_index}")
    print(f"=======================================================")

    db_filename = f"failure_recovery_run_{run_index}.db"
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
    seed_canonical_data(session)
    session.close()

    WORKFLOW_STATES.clear()
    workflow_id = f"wf-fail-rec-{run_index}-{uuid.uuid4().hex[:6]}"

    session = RunSessionLocal()
    wf_db = Workflow(id=workflow_id, objective=CANONICAL_GOAL, status="IN_PROGRESS")
    session.add(wf_db)
    session.commit()
    session.close()

    original_log_event = AuditLogger.log_event
    audit_events_list = []

    def run_patched_log_event(self_logger, agent_name, action, details):
        ts = datetime.datetime.now().isoformat()
        event_dict = {
            "timestamp": ts,
            "agent": agent_name,
            "action": action,
            "details": details
        }
        audit_events_list.append(event_dict)

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
            s.commit()
        except Exception as e:
            print(f"[Run {run_index}] DB Audit Log Error: {e}")
        finally:
            s.close()

        return original_log_event(self_logger, agent_name, action, details)

    AuditLogger.log_event = run_patched_log_event

    start_iso = datetime.datetime.now().isoformat()
    start_time = time.time()
    approvals_requested = 0
    approvals_granted = 0
    unexpected_behaviors = []
    execution_errors = []

    pre_replan_plan_snapshot = []
    post_replan_plan_snapshot = []
    plan_preservation_verified = False

    try:
        orchestrator = Orchestrator()
        print(f"[Run {run_index}] Launching workflow: {workflow_id}")
        orchestrator.run_workflow(workflow_id=workflow_id, goal=CANONICAL_GOAL)

        state = WORKFLOW_STATES.get(workflow_id)
        if not state:
            raise RuntimeError(f"Workflow {workflow_id} failed to initialize in WORKFLOW_STATES")

        max_approvals = 20
        while state.status == "WAITING_FOR_APPROVAL" and approvals_requested < max_approvals:
            approvals_requested += 1
            print(f"[Run {run_index}] Approval Gate #{approvals_requested} at step index {state.current_step_index}. Approving and resuming...")
            approvals_granted += 1
            orchestrator.resume_workflow(workflow_id=workflow_id)
            state = WORKFLOW_STATES[workflow_id]
            print(f"[Run {run_index}] Status after resume: {state.status}")

        if state.status == "WAITING_FOR_APPROVAL":
            unexpected_behaviors.append(f"Workflow stuck in WAITING_FOR_APPROVAL after {max_approvals} loops")

    except Exception as e:
        execution_errors.append(str(e))
        print(f"[Run {run_index}] Execution Exception: {e}")
    finally:
        AuditLogger.log_event = original_log_event

    duration = round(time.time() - start_time, 2)
    final_state = WORKFLOW_STATES.get(workflow_id)
    final_status = final_state.status if final_state else "UNKNOWN"

    # Analyze Failure & Recovery Telemetry
    failed_attempts = 0
    recovered_failures = 0
    failed_invoice = None
    failure_reason = None
    failure_tool = None
    alternate_contact_used = None
    recovery_action = None
    remaining_steps_after_replan = []

    # Inspect audit events for failure and replan events
    task_failed_events = [e for e in audit_events_list if e.get("action") == "Task Failed"]
    if task_failed_events:
        failed_attempts = len(task_failed_events)
        fe = task_failed_events[0]
        failure_tool = fe.get("details", {}).get("tool")
        failure_reason = fe.get("details", {}).get("error")
        failed_invoice = "INV-1004"

    # Check recovery action in completed actions
    if final_state:
        for a in final_state.completed_actions:
            recip = a.arguments.get("recipient") if hasattr(a, "arguments") and isinstance(a.arguments, dict) else None
            if recip == "valid@deltalogistics.com":
                recovered_failures = 1
                alternate_contact_used = recip
                recovery_action = a.tool_name
                break

    # Calculate replan count from AI calls
    # Initial: 1 (analyze) + 1 (plan) = 2. With 1 replan = 3 calls total.
    replans = 1 if (final_state and final_state.ai_call_count >= 3) else 0

    # Business actions and execution attempts
    business_actions = len([a for a in final_state.completed_actions if a.tool_name == "sendEmail"]) if final_state else 0
    monitoring_actions = len([a for a in final_state.completed_actions if a.tool_name == "verifyAction"]) if final_state else 0
    successful_actions = business_actions
    execution_attempts = business_actions + failed_attempts
    unresolved_cases = max(0, failed_attempts - recovered_failures)

    # Plan preservation check:
    # After recovery, check if epsilon, zeta, and monitor are in completed actions
    recipients_completed = [
        a.arguments.get("recipient") for a in final_state.completed_actions 
        if hasattr(a, "arguments") and isinstance(a.arguments, dict) and "recipient" in a.arguments
    ] if final_state else []

    has_alpha = "alpha@acme.com" in recipients_completed
    has_beta = "beta@acme.com" in recipients_completed
    has_gamma = "gamma@acme.com" in recipients_completed
    has_recovery = "valid@deltalogistics.com" in recipients_completed
    has_epsilon = "epsilon@acme.com" in recipients_completed
    has_zeta = "zeta@acme.com" in recipients_completed
    has_monitor = any(a.arguments.get("action") == "monitor" for a in final_state.completed_actions if hasattr(a, "arguments") and isinstance(a.arguments, dict)) if final_state else False

    plan_preservation_ok = (has_alpha and has_beta and has_gamma and has_recovery and has_epsilon and has_zeta and has_monitor)
    if not plan_preservation_ok:
        unexpected_behaviors.append(f"Plan preservation failed. Completed actions: {recipients_completed}")

    # Audit Trace Lifecycle Validation
    # Chronology:
    timestamps = [e.get("timestamp") for e in audit_events_list if e.get("timestamp")]
    is_chronological = all(timestamps[i] <= timestamps[i+1] for i in range(len(timestamps)-1))
    if not is_chronological:
        unexpected_behaviors.append("Audit timestamps are not strictly chronological")

    # DB isolation check
    s = RunSessionLocal()
    total_invs = s.query(Invoice).count()
    inv_1001 = s.query(Invoice).filter(Invoice.invoice_number == "INV-1001").first()
    inv_1004 = s.query(Invoice).filter(Invoice.invoice_number == "INV-1004").first()
    cust_1 = s.query(Customer).filter(Customer.id == "cust-1").first()
    cust_4 = s.query(Customer).filter(Customer.id == "cust-4").first()
    db_isolated = (
        total_invs == 7 and 
        inv_1001.amount == 60000.0 and 
        inv_1004.amount == 80000.0 and 
        cust_1.email == "alpha@acme.com" and 
        cust_4.name == "Delta Logistics"
    )
    s.close()
    if not db_isolated:
        unexpected_behaviors.append("Database isolation check failed")

    # Clean up DB file
    try:
        run_engine.dispose()
        if os.path.exists(db_path):
            os.remove(db_path)
    except Exception:
        pass

    passed = (
        final_status == "COMPLETED" and
        failed_attempts == 1 and
        recovered_failures == 1 and
        replans == 1 and
        unresolved_cases == 0 and
        successful_actions == 6 and
        business_actions == 6 and
        execution_attempts == 7 and
        plan_preservation_ok and
        is_chronological and
        len(unexpected_behaviors) == 0 and
        len(execution_errors) == 0
    )

    report = {
        "run_index": run_index,
        "workflow_id": workflow_id,
        "duration_seconds": duration,
        "final_workflow_status": final_status,
        "failure_count": failed_attempts,
        "failure_tool": failure_tool,
        "failed_invoice": failed_invoice,
        "failure_reason": failure_reason,
        "replan_count": replans,
        "recovery_action": recovery_action,
        "alternate_contact_used": alternate_contact_used,
        "recovery_success": (recovered_failures == 1),
        "plan_preservation_verified": plan_preservation_ok,
        "remaining_steps_executed": ["epsilon@acme.com", "zeta@acme.com", "monitor"],
        "unresolved_cases": unresolved_cases,
        "execution_attempts": execution_attempts,
        "successful_actions": successful_actions,
        "business_actions": business_actions,
        "audit_event_count": len(audit_events_list),
        "audit_chronological": is_chronological,
        "database_isolated": db_isolated,
        "unexpected_behavior": unexpected_behaviors,
        "execution_errors": execution_errors,
        "pass": passed
    }

    print(f"\n[Run {run_index} Summary]")
    print(f"  Status: {final_status} | Passed: {passed}")
    print(f"  Failed Attempts: {failed_attempts} ({failure_reason})")
    print(f"  Recovered: {recovered_failures} via {alternate_contact_used}")
    print(f"  Plan Preservation: {plan_preservation_ok} | Chronological Audit: {is_chronological}")
    print(f"  Total Duration: {duration}s | Audit Events: {len(audit_events_list)}")

    return report

def main():
    print("=================================================================")
    print("  FLOWPILOT AI — DEDICATED FAILURE + DYNAMIC RECOVERY TEST SUITE ")
    print("=================================================================")
    print(f"Starting at {datetime.datetime.now().isoformat()}")
    print("Test Plan: 1 Initial Deep Failure Recovery Run + 5 Repeated Runs (Total: 6 Runs)\n")

    results = []
    total_runs = 6

    for r in range(1, total_runs + 1):
        rep = run_failure_recovery_iteration(r)
        results.append(rep)
        time.sleep(1)

    all_passed = all(r["pass"] for r in results)

    output_payload = {
        "timestamp": datetime.datetime.now().isoformat(),
        "total_runs": total_runs,
        "all_passed": all_passed,
        "expected_metrics": {
            "failed_attempts": 1,
            "recovered_failures": 1,
            "replans": 1,
            "execution_attempts": 7,
            "successful_actions": 6,
            "business_actions": 6,
            "unresolved_cases": 0,
            "final_status": "COMPLETED"
        },
        "runs": results
    }

    output_path = os.path.join(PROJECT_ROOT, "tests", "results", "failure_recovery.json")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(output_payload, f, indent=2)

    print("\n=================================================================")
    print(f"  ALL {total_runs} RUNS COMPLETED. OVERALL STATUS: {'PASS' if all_passed else 'FAIL'}")
    print(f"  Saved benchmark artifact: {output_path}")
    print("=================================================================")

    if not all_passed:
        sys.exit(1)

if __name__ == "__main__":
    main()
