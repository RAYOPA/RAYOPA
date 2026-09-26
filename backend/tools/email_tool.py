import os
import uuid
from datetime import datetime, timezone
from typing import Dict, Any
from ..tool_registry import ToolResult, ToolContext
from ..models import AuditEvent, Communication
from .email_providers import get_email_provider

def get_email_mode() -> str:
    """Returns the configured email mode/provider (defaults to 'sandbox')."""
    return (os.getenv("EMAIL_PROVIDER") or os.getenv("EMAIL_MODE", "sandbox")).lower().strip()

def prepare_email_execute(input_data: Dict[str, Any], context: ToolContext) -> ToolResult:
    """
    Produces a validated, structured email draft.
    Does not execute email sending. Enforces that email sending requires separate authorization.
    """
    recipient = input_data.get("recipient") or input_data.get("to") or "customer@acme.com"
    subject = input_data.get("subject", "Follow-up on Overdue Invoice")
    body = input_data.get("body", "Please settle the outstanding balance.")
    invoice_id = input_data.get("invoice_id")
    customer_id = input_data.get("customer_id")

    draft_data = {
        "to": recipient,
        "recipient": recipient,
        "subject": subject,
        "body": body,
        "invoice_id": invoice_id,
        "customer_id": customer_id,
        "prepared": True,
        "requires_approval": True,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

    # Audit event: EMAIL_PREPARED
    if context and context.db:
        try:
            audit_prepared = AuditEvent(
                id=str(uuid.uuid4()),
                workflow_id=context.workflow_id,
                event_type="EMAIL_PREPARED",
                actor="SYSTEM",
                tool="prepareEmail",
                status="SUCCESS",
                summary=f"Prepared email draft for recipient '{recipient}' with subject '{subject}'",
                metadata_json={
                    "recipient": recipient,
                    "subject": subject,
                    "invoice_id": invoice_id,
                    "customer_id": customer_id
                }
            )
            context.db.add(audit_prepared)
            context.db.commit()
        except Exception as e:
            if context.db:
                context.db.rollback()

    return ToolResult(
        status="SUCCESS",
        data=draft_data,
        verificationMode="PREPARED"
    )

def send_email_execute(input_data: Dict[str, Any], context: ToolContext) -> ToolResult:
    """
    Executes email sending through the configured EmailProvider (Sandbox or SMTP).
    Audits the full lifecycle: EMAIL_SEND_STARTED, EMAIL_SEND_SUCCEEDED, EMAIL_SEND_FAILED.
    Persists communication record and RFC 5322 Message-ID upon delivery acceptance.
    """
    recipient = input_data.get("recipient") or input_data.get("to")
    if not recipient:
        return ToolResult(status="FAILED", error="Missing recipient for email sending")

    subject = input_data.get("subject", "Follow-up on Overdue Invoice")
    body = input_data.get("body", "Please settle the outstanding balance.")
    invoice_id = input_data.get("invoice_id")
    customer_id = input_data.get("customer_id")
    action_id = context.action_id if context else str(uuid.uuid4().hex[:8])

    provider = get_email_provider()
    provider_name = provider.provider_name

    # Audit event: EMAIL_SEND_STARTED
    if context and context.db:
        try:
            audit_start = AuditEvent(
                id=str(uuid.uuid4()),
                workflow_id=context.workflow_id,
                event_type="EMAIL_SEND_STARTED",
                actor="SYSTEM",
                tool="sendEmail",
                status="RUNNING",
                summary=f"Initiating email send via {provider_name} to '{recipient}'",
                metadata_json={
                    "recipient": recipient,
                    "subject": subject,
                    "provider": provider_name,
                    "action_id": action_id
                }
            )
            context.db.add(audit_start)
            context.db.commit()
        except Exception:
            if context.db:
                context.db.rollback()

    # Execute provider send
    send_res = provider.send_email(
        recipient=recipient,
        subject=subject,
        body=body,
        action_id=action_id,
        extra={"invoice_id": invoice_id, "customer_id": customer_id}
    )

    if not send_res.success:
        # Audit event: EMAIL_SEND_FAILED
        if context and context.db:
            try:
                audit_fail = AuditEvent(
                    id=str(uuid.uuid4()),
                    workflow_id=context.workflow_id,
                    event_type="EMAIL_SEND_FAILED",
                    actor="SYSTEM",
                    tool="sendEmail",
                    status="FAILED",
                    summary=f"Email send failed via {send_res.provider} to '{recipient}': {send_res.error}",
                    metadata_json={
                        "error": send_res.error,
                        "recipient": recipient,
                        "provider": send_res.provider,
                        "action_id": action_id
                    }
                )
                context.db.add(audit_fail)
                context.db.commit()
            except Exception:
                if context.db:
                    context.db.rollback()

        return ToolResult(
            status="FAILED",
            error=send_res.error,
            verificationMode=send_res.verificationMode
        )

    # Success / Acceptance
    output_data = send_res.to_dict()

    if context and context.db:
        try:
            # Audit event: EMAIL_SEND_SUCCEEDED
            audit_success = AuditEvent(
                id=str(uuid.uuid4()),
                workflow_id=context.workflow_id,
                event_type="EMAIL_SEND_SUCCEEDED",
                actor="SYSTEM",
                tool="sendEmail",
                status=send_res.status,
                summary=f"Email send accepted ({send_res.status}) via {send_res.provider} for '{recipient}'",
                metadata_json=output_data
            )
            context.db.add(audit_success)

            # Persist Communication record with Message-ID
            comm = Communication(
                id=str(uuid.uuid4()),
                customer_id=customer_id if customer_id else (f"cust-{action_id}" if action_id else "cust-unknown"),
                invoice_id=invoice_id,
                channel="email",
                recipient=recipient,
                subject=subject,
                message=body,
                message_id=send_res.message_id,
                status=send_res.status, # e.g. "SMTP_ACCEPTED" or "SENT" / "SUCCESS"
                timestamp=datetime.now(timezone.utc)
            )
            context.db.add(comm)
            context.db.commit()
        except Exception as e:
            if context.db:
                context.db.rollback()

    return ToolResult(
        status="SUCCESS",
        data=output_data,
        verificationMode=send_res.verificationMode or send_res.status
    )

def verify_delivery_execute(input_data: Dict[str, Any], context: ToolContext) -> ToolResult:
    """
    Verifies email delivery in a technically honest way.
    For SMTP: reports SMTP_ACCEPTED relay status without making false inbox delivery claims.
    For Sandbox: returns simulated delivery verification.
    """
    message_id = input_data.get("message_id")
    if not message_id:
        return ToolResult(status="FAILED", error="Missing message_id for delivery verification")

    provider = get_email_provider()
    verif_res = provider.verify_delivery(message_id)

    # Audit event: EMAIL_VERIFICATION
    if context and context.db:
        try:
            audit_verify = AuditEvent(
                id=str(uuid.uuid4()),
                workflow_id=context.workflow_id,
                event_type="EMAIL_VERIFICATION",
                actor="SYSTEM",
                tool="verifyDelivery",
                status="SUCCESS",
                summary=f"Delivery verification executed for Message-ID: {message_id}",
                metadata_json=verif_res
            )
            context.db.add(audit_verify)
            context.db.commit()
        except Exception:
            if context.db:
                context.db.rollback()

    return ToolResult(
        status="SUCCESS",
        data=verif_res,
        verificationMode=verif_res.get("verificationMode", "VERIFIED")
    )
