import os
import uuid
import smtplib
from unittest.mock import MagicMock, patch
import pytest

# Ensure safe test environment defaults
os.environ["DATABASE_URL"] = "sqlite:///:memory:"
os.environ["EMAIL_PROVIDER"] = "sandbox"
os.environ["EMAIL_MODE"] = "sandbox"

from backend.database import Base, engine, SessionLocal
from backend.models import Workflow, Approval, AuditEvent, Communication, ToolExecution
from backend.tool_registry import ToolContext
from backend.tools import registry
from backend.tools.email_providers import (
    SandboxEmailProvider,
    SMTPEmailProvider,
    get_email_provider,
    EmailSendResult
)

@pytest.fixture(autouse=True)
def init_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

# ============================================================================
# 1. SMTP Provider Configuration Validation
# ============================================================================
def test_smtp_provider_configuration_validation():
    # Empty config should flag missing required variables by NAME ONLY
    provider = SMTPEmailProvider(host="", port=587, from_addr="", username="", password="")
    config = provider.validate_configuration()
    assert config["valid"] is False
    assert "SMTP_HOST" in config["missing"]
    assert "SMTP_FROM" in config["missing"]
    # Password should never be exposed in the config output
    assert "password" not in config

    # Valid config
    valid_provider = SMTPEmailProvider(
        host="smtp.example.com",
        port=587,
        from_addr="billing@example.com",
        username="billing@example.com",
        password="test-secret-password-123"
    )
    valid_config = valid_provider.validate_configuration()
    assert valid_config["valid"] is True
    assert len(valid_config["missing"]) == 0
    assert valid_config["host_configured"] is True
    assert valid_config["tls_enabled"] is True
    # Password value must NEVER be present anywhere in the returned dictionary
    assert "test-secret-password-123" not in str(valid_config)

# ============================================================================
# 2. Successful SMTP Send with Mocked SMTP Server
# ============================================================================
def test_successful_smtp_send_mocked():
    provider = SMTPEmailProvider(
        host="smtp.example.com",
        port=587,
        from_addr="billing@flowpilot.ai",
        username="billing@flowpilot.ai",
        password="secret-password"
    )

    with patch("smtplib.SMTP") as mock_smtp_class:
        mock_server = MagicMock()
        mock_server.__enter__.return_value = mock_server
        mock_smtp_class.return_value = mock_server

        res = provider.send_email(
            recipient="customer@acme.com",
            subject="Invoice Reminder INV-1001",
            body="Your invoice is overdue by 10 days.",
            action_id="act-123"
        )

        assert res.success is True
        # Must return SMTP_ACCEPTED (not claiming delivered to inbox)
        assert res.status == "SMTP_ACCEPTED"
        assert res.provider == "smtp"
        assert res.recipient == "customer@acme.com"
        assert res.message_id is not None
        assert "@" in res.message_id
        assert mock_server.ehlo.called
        assert mock_server.starttls.called
        assert mock_server.login.called
        assert mock_server.send_message.called
        
        # Verify message sent has correct headers
        sent_msg = mock_server.send_message.call_args[0][0]
        assert sent_msg["To"] == "customer@acme.com"
        assert sent_msg["From"] == "billing@flowpilot.ai"
        assert "Invoice Reminder INV-1001" in sent_msg["Subject"]
        assert sent_msg["Message-ID"] == res.message_id

# ============================================================================
# 3. SMTP Authentication Failure Handling
# ============================================================================
def test_smtp_auth_failure_handling():
    provider = SMTPEmailProvider(
        host="smtp.example.com",
        port=587,
        from_addr="billing@flowpilot.ai",
        username="user",
        password="secret-password"
    )

    with patch("smtplib.SMTP") as mock_smtp_class:
        mock_server = MagicMock()
        mock_server.__enter__.return_value = mock_server
        mock_smtp_class.return_value = mock_server
        mock_server.login.side_effect = smtplib.SMTPAuthenticationError(535, b"Authentication failed")

        res = provider.send_email(
            recipient="customer@acme.com",
            subject="Invoice Reminder",
            body="Overdue",
            action_id="act-123"
        )

        assert res.success is False
        assert res.status == "FAILED"
        assert "Authentication failed" in res.error
        # Password must NEVER appear in the error message
        assert "secret-password" not in (res.error or "")

# ============================================================================
# 4. SMTP Connection Failure Handling
# ============================================================================
def test_smtp_connection_failure_handling():
    provider = SMTPEmailProvider(
        host="unreachable.host.local",
        port=587,
        from_addr="billing@flowpilot.ai"
    )

    with patch("smtplib.SMTP") as mock_smtp_class:
        mock_smtp_class.side_effect = smtplib.SMTPConnectError(421, b"Connection refused")

        res = provider.send_email(
            recipient="customer@acme.com",
            subject="Invoice Reminder",
            body="Overdue",
            action_id="act-123"
        )

        assert res.success is False
        assert res.status == "FAILED"
        assert "Connection failure" in res.error

# ============================================================================
# 5. Invalid Recipient Handling & Header Injection Protection
# ============================================================================
def test_invalid_recipient_handling():
    provider = SMTPEmailProvider(
        host="smtp.example.com",
        port=587,
        from_addr="billing@flowpilot.ai"
    )

    # Missing recipient
    res1 = provider.send_email(recipient="", subject="Sub", body="Body")
    assert res1.success is False
    assert "Missing" in res1.error

    # Malformed email
    res2 = provider.send_email(recipient="not-an-email", subject="Sub", body="Body")
    assert res2.success is False
    assert "Invalid recipient" in res2.error

    # Header injection attempt with CRLF
    res3 = provider.send_email(recipient="victim@acme.com\r\nBcc: evil@hacker.com", subject="Sub", body="Body")
    assert res3.success is False
    assert "illegal newline" in res3.error

# ============================================================================
# 6. Sandbox Provider Deterministic Behavior Preserved
# ============================================================================
def test_sandbox_provider_preserves_behavior():
    sandbox = SandboxEmailProvider()
    
    # Valid simulated send
    res = sandbox.send_email(
        recipient="alpha@acme.com",
        subject="Test Sandbox",
        body="Hello world",
        action_id="action-sandbox-1"
    )
    assert res.success is True
    assert res.status == "SUCCESS"
    assert res.verificationMode == "SIMULATED"
    assert res.message_id == "sim-action-sandbox-1"

    # Simulated failure trigger on 'invalid' recipient
    fail_res = sandbox.send_email(
        recipient="invalid@acme.com",
        subject="Test Sandbox",
        body="Hello",
        action_id="action-sandbox-2"
    )
    assert fail_res.success is False
    assert fail_res.status == "FAILED"
    assert "SIMULATED" in fail_res.error
    assert fail_res.verificationMode == "SIMULATED"

    # Sandbox verify delivery
    verif = sandbox.verify_delivery("sim-123")
    assert verif["delivered"] is True
    assert verif["verificationMode"] == "SIMULATED"

# ============================================================================
# 7. PrepareEmail Tool Produces Valid Draft and Logs EMAIL_PREPARED
# ============================================================================
def test_prepare_email_tool_and_audit():
    db = SessionLocal()
    wf_id = str(uuid.uuid4())
    wf = Workflow(id=wf_id, objective="Prepare Email Test")
    db.add(wf)
    db.commit()

    ctx = ToolContext(workflow_id=wf_id, step_id="step-1", action_id=str(uuid.uuid4()), db=db)
    
    result = registry.execute_tool(
        "prepareEmail",
        {
            "recipient": "cust@example.com",
            "subject": "Payment Due",
            "body": "Invoice INV-202 is overdue.",
            "invoice_id": "inv-202",
            "customer_id": "cust-202"
        },
        ctx
    )

    assert result.status == "SUCCESS"
    assert result.data["prepared"] is True
    assert result.data["to"] == "cust@example.com"
    assert result.data["invoice_id"] == "inv-202"
    assert result.data["customer_id"] == "cust-202"

    # Check AuditEvent
    audit = db.query(AuditEvent).filter_by(workflow_id=wf_id, event_type="EMAIL_PREPARED").first()
    assert audit is not None
    assert audit.status == "SUCCESS"
    assert audit.metadata_json["recipient"] == "cust@example.com"
    db.close()

# ============================================================================
# 8. SendEmail Tool with Real SMTP Mode, Communication Persistence & Audit
# ============================================================================
def test_send_email_smtp_mode_and_communication_persistence(monkeypatch):
    monkeypatch.setenv("EMAIL_PROVIDER", "smtp")
    monkeypatch.setenv("SMTP_HOST", "smtp.flowpilot.test")
    monkeypatch.setenv("SMTP_PORT", "587")
    monkeypatch.setenv("SMTP_USERNAME", "mailer@flowpilot.test")
    monkeypatch.setenv("SMTP_PASSWORD", "test-pass")
    monkeypatch.setenv("SMTP_FROM", "mailer@flowpilot.test")

    db = SessionLocal()
    wf_id = str(uuid.uuid4())
    wf = Workflow(id=wf_id, objective="Real SMTP Send Test")
    db.add(wf)
    db.commit()

    action_id = str(uuid.uuid4())
    ctx = ToolContext(workflow_id=wf_id, step_id="step-2", action_id=action_id, db=db)

    with patch("smtplib.SMTP") as mock_smtp_class:
        mock_server = MagicMock()
        mock_server.__enter__.return_value = mock_server
        mock_smtp_class.return_value = mock_server

        result = registry.execute_tool(
            "sendEmail",
            {
                "recipient": "finance@clientcorp.com",
                "subject": "Urgent: Overdue Notice",
                "body": "Please remit payment immediately.",
                "invoice_id": "inv-999",
                "customer_id": "cust-999"
            },
            ctx
        )

        assert result.status == "SUCCESS"
        assert result.data["status"] == "SMTP_ACCEPTED"
        assert result.data["provider"] == "smtp"
        assert result.data["recipient"] == "finance@clientcorp.com"
        assert result.data["message_id"] is not None

        # Check Communication record was persisted to database
        comm = db.query(Communication).filter_by(recipient="finance@clientcorp.com").first()
        assert comm is not None
        assert comm.channel == "email"
        assert comm.status == "SMTP_ACCEPTED"
        assert comm.invoice_id == "inv-999"
        assert comm.customer_id == "cust-999"
        assert comm.subject == "Urgent: Overdue Notice"
        assert comm.message_id == result.data["message_id"]

        # Check AuditEvents: EMAIL_SEND_STARTED and EMAIL_SEND_SUCCEEDED
        start_event = db.query(AuditEvent).filter_by(workflow_id=wf_id, event_type="EMAIL_SEND_STARTED").first()
        assert start_event is not None
        assert start_event.metadata_json["provider"] == "smtp"

        success_event = db.query(AuditEvent).filter_by(workflow_id=wf_id, event_type="EMAIL_SEND_SUCCEEDED").first()
        assert success_event is not None
        assert success_event.metadata_json["status"] == "SMTP_ACCEPTED"

    db.close()


def test_email_provider_precedence_and_audit_metadata(monkeypatch):
    """EMAIL_PROVIDER takes precedence over EMAIL_MODE for sending and audit."""
    monkeypatch.setenv("EMAIL_PROVIDER", "sandbox")
    monkeypatch.setenv("EMAIL_MODE", "smtp")

    db = SessionLocal()
    wf_id = str(uuid.uuid4())
    db.add(Workflow(id=wf_id, objective="Provider precedence test"))
    db.commit()
    ctx = ToolContext(workflow_id=wf_id, step_id="step-provider", action_id="provider-precedence", db=db)

    result = registry.execute_tool(
        "sendEmail",
        {"recipient": "recipient@example.test", "subject": "Provider precedence"},
        ctx,
    )

    assert result.status == "SUCCESS"
    assert result.data["provider"] == "sandbox"
    start_event = db.query(AuditEvent).filter_by(
        workflow_id=wf_id, event_type="EMAIL_SEND_STARTED"
    ).one()
    assert start_event.metadata_json["provider"] == "sandbox"
    assert registry.get_tool("sendEmail").requiresApproval is True
    db.close()

# ============================================================================
# 9. Idempotency: Duplicate Send Returns Cached Result Without Second SMTP Call
# ============================================================================
def test_send_email_idempotent_replay(monkeypatch):
    monkeypatch.setenv("EMAIL_PROVIDER", "smtp")
    monkeypatch.setenv("SMTP_HOST", "smtp.flowpilot.test")
    monkeypatch.setenv("SMTP_PORT", "587")
    monkeypatch.setenv("SMTP_FROM", "mailer@flowpilot.test")

    db = SessionLocal()
    wf_id = str(uuid.uuid4())
    wf = Workflow(id=wf_id, objective="Idempotency Test")
    db.add(wf)
    db.commit()

    action_id = str(uuid.uuid4())
    ctx = ToolContext(workflow_id=wf_id, step_id="step-1", action_id=action_id, db=db)

    with patch("smtplib.SMTP") as mock_smtp_class:
        mock_server = MagicMock()
        mock_server.__enter__.return_value = mock_server
        mock_smtp_class.return_value = mock_server

        # First call
        res1 = registry.execute_tool("sendEmail", {"recipient": "client@acme.com", "subject": "Reminder"}, ctx)
        assert res1.status == "SUCCESS"
        assert res1.verificationMode != "IDEMPOTENT"
        assert mock_server.send_message.call_count == 1

        # Second call (identical action_id) -> MUST be intercepted by idempotency
        res2 = registry.execute_tool("sendEmail", {"recipient": "client@acme.com", "subject": "Reminder"}, ctx)
        assert res2.status == "SUCCESS"
        assert res2.verificationMode == "IDEMPOTENT"
        # SMTP send_message MUST NOT be called again!
        assert mock_server.send_message.call_count == 1

        # IDEMPOTENT_REPLAY audit event must be generated
        replay_event = db.query(AuditEvent).filter_by(workflow_id=wf_id, event_type="IDEMPOTENT_REPLAY").first()
        assert replay_event is not None
        assert replay_event.metadata_json["idempotency_key"] == f"{wf_id}_{action_id}"

    db.close()

# ============================================================================
# 10. Failed Send Allows Retry Under Existing Policy
# ============================================================================
def test_failed_send_allows_retry(monkeypatch):
    monkeypatch.setenv("EMAIL_PROVIDER", "smtp")
    monkeypatch.setenv("SMTP_HOST", "smtp.flowpilot.test")
    monkeypatch.setenv("SMTP_PORT", "587")
    monkeypatch.setenv("SMTP_FROM", "mailer@flowpilot.test")

    db = SessionLocal()
    wf_id = str(uuid.uuid4())
    wf = Workflow(id=wf_id, objective="Failure and Retry Test")
    db.add(wf)
    db.commit()

    action_id = str(uuid.uuid4())
    ctx = ToolContext(workflow_id=wf_id, step_id="step-fail", action_id=action_id, db=db)

    with patch("smtplib.SMTP") as mock_smtp_class:
        # First attempt: connection error
        mock_smtp_class.side_effect = ConnectionRefusedError("Connection refused by SMTP server")
        res_fail = registry.execute_tool("sendEmail", {"recipient": "client@acme.com"}, ctx)
        assert res_fail.status == "FAILED"

        # Check EMAIL_SEND_FAILED audit event
        fail_audit = db.query(AuditEvent).filter_by(workflow_id=wf_id, event_type="EMAIL_SEND_FAILED").first()
        assert fail_audit is not None
        assert "Connection failure" in fail_audit.metadata_json["error"]

        # Retry with fixed connection
        mock_server = MagicMock()
        mock_server.__enter__.return_value = mock_server
        mock_smtp_class.side_effect = None
        mock_smtp_class.return_value = mock_server

        res_retry = registry.execute_tool("sendEmail", {"recipient": "client@acme.com"}, ctx)
        assert res_retry.status == "SUCCESS"
        assert res_retry.data["status"] == "SMTP_ACCEPTED"

    db.close()

# ============================================================================
# 11. Approval Gate Enforces Human Confirmation Before sendEmail
# ============================================================================
def test_approval_gate_enforcement():
    tool = registry.get_tool("sendEmail")
    assert tool is not None
    # sendEmail MUST strictly have requiresApproval = True
    assert tool.requiresApproval is True

    # prepareEmail does not require approval (safe draft operation)
    prepare_tool = registry.get_tool("prepareEmail")
    assert prepare_tool is not None
    assert prepare_tool.requiresApproval is False

# ============================================================================
# 12. Technical Honesty in verifyDelivery
# ============================================================================
def test_verify_delivery_technical_honesty(monkeypatch):
    monkeypatch.setenv("EMAIL_PROVIDER", "smtp")
    db = SessionLocal()
    wf_id = str(uuid.uuid4())
    wf = Workflow(id=wf_id, objective="Verification Test")
    db.add(wf)
    db.commit()

    ctx = ToolContext(workflow_id=wf_id, step_id="step-verif", action_id=str(uuid.uuid4()), db=db)
    
    result = registry.execute_tool("verifyDelivery", {"message_id": "<test-msg-id@flowpilot.ai>"}, ctx)
    assert result.status == "SUCCESS"
    assert result.data["status"] == "SMTP_ACCEPTED"
    # Technically honest: standard SMTP does not guarantee inbox receipt
    assert result.data["delivered"] is None
    assert "SMTP relay" in result.data["detail"]

    # Check EMAIL_VERIFICATION audit event
    audit = db.query(AuditEvent).filter_by(workflow_id=wf_id, event_type="EMAIL_VERIFICATION").first()
    assert audit is not None
    assert audit.status == "SUCCESS"
    db.close()
