import os
import uuid
import smtplib
import socket
import re
from abc import ABC, abstractmethod
from datetime import datetime, timezone
from email.message import EmailMessage
import email.utils
from typing import Dict, Any, Optional, List
from pydantic import BaseModel, Field

class EmailSendResult(BaseModel):
    success: bool
    status: str
    provider: str
    recipient: str
    timestamp: str
    message_id: Optional[str] = None
    subject: Optional[str] = None
    error: Optional[str] = None
    verificationMode: Optional[str] = None
    data: Optional[Dict[str, Any]] = None

    def to_dict(self) -> Dict[str, Any]:
        res = {
            "status": self.status,
            "provider": self.provider,
            "recipient": self.recipient,
            "timestamp": self.timestamp,
        }
        if self.message_id:
            res["message_id"] = self.message_id
        if self.subject:
            res["subject"] = self.subject
        if self.verificationMode:
            res["verificationMode"] = self.verificationMode
        if self.error:
            res["error"] = self.error
        if self.data:
            res["data"] = self.data
        return res

class EmailProvider(ABC):
    """Abstract base class for FlowPilot email providers."""

    @abstractmethod
    def send_email(
        self,
        recipient: str,
        subject: str,
        body: str,
        action_id: str = "",
        extra: Optional[Dict[str, Any]] = None
    ) -> EmailSendResult:
        """Send an email to a recipient."""
        pass

    @abstractmethod
    def verify_delivery(self, message_id: str) -> Dict[str, Any]:
        """Verify delivery status of an email."""
        pass

    @abstractmethod
    def validate_configuration(self) -> Dict[str, Any]:
        """Validate whether provider settings and environment variables are properly set."""
        pass

class SandboxEmailProvider(EmailProvider):
    """
    Deterministic simulated email provider for testing, mock environments,
    and workflow verification without dispatching real network emails.
    """
    provider_name = "sandbox"

    def validate_configuration(self) -> Dict[str, Any]:
        return {"valid": True, "provider": "sandbox", "missing": []}

    def send_email(
        self,
        recipient: str,
        subject: str,
        body: str,
        action_id: str = "",
        extra: Optional[Dict[str, Any]] = None
    ) -> EmailSendResult:
        now_ts = datetime.now(timezone.utc).isoformat()
        
        # Check for simulated failures (preserves existing sandbox failure tests)
        if not recipient or "invalid" in recipient.lower():
            return EmailSendResult(
                success=False,
                status="FAILED",
                provider="sandbox",
                recipient=recipient or "",
                subject=subject,
                error="Invalid email address (SIMULATED)",
                verificationMode="SIMULATED",
                timestamp=now_ts
            )

        sim_msg_id = f"sim-{action_id}" if action_id else f"sim-{uuid.uuid4().hex[:8]}"
        return EmailSendResult(
            success=True,
            status="SUCCESS",
            provider="sandbox",
            message_id=sim_msg_id,
            recipient=recipient,
            subject=subject,
            verificationMode="SIMULATED",
            timestamp=now_ts,
            data={"message_id": sim_msg_id}
        )

    def verify_delivery(self, message_id: str) -> Dict[str, Any]:
        return {
            "status": "SUCCESS",
            "delivered": True,
            "opened": False,
            "message_id": message_id,
            "verificationMode": "SIMULATED"
        }

class SMTPEmailProvider(EmailProvider):
    """
    Production-grade SMTP email provider using Python's standard library smtplib.
    Supports TLS, SSL, authenticated relay, and RFC 5322 compliance.
    Guarantees no credentials ever leak in logs, outputs, or error reports.
    """
    provider_name = "smtp"

    EMAIL_REGEX = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

    def __init__(
        self,
        host: Optional[str] = None,
        port: Optional[int] = None,
        username: Optional[str] = None,
        password: Optional[str] = None,
        from_addr: Optional[str] = None,
        use_tls: Optional[bool] = None,
        timeout: Optional[int] = None
    ):
        self.host = (host if host is not None else os.getenv("SMTP_HOST", "")).strip()
        port_val = port if port is not None else os.getenv("SMTP_PORT", "587")
        try:
            self.port = int(str(port_val).strip())
        except (ValueError, TypeError):
            self.port = 587

        self.username = (username if username is not None else os.getenv("SMTP_USERNAME", "")).strip()
        self.password = password if password is not None else os.getenv("SMTP_PASSWORD", "")
        
        env_from = os.getenv("SMTP_FROM", "").strip()
        if from_addr is not None:
            self.from_addr = from_addr.strip()
        elif env_from:
            self.from_addr = env_from
        else:
            self.from_addr = self.username

        if use_tls is not None:
            self.use_tls = use_tls
        else:
            tls_env = os.getenv("SMTP_USE_TLS", "true").strip().lower()
            self.use_tls = tls_env in ("true", "1", "yes")

        timeout_val = timeout if timeout is not None else os.getenv("SMTP_TIMEOUT", "15")
        try:
            self.timeout = int(str(timeout_val).strip())
        except (ValueError, TypeError):
            self.timeout = 15

    def _sanitize_error(self, message: str) -> str:
        """Strip password or sensitive credentials from error strings."""
        if not message:
            return ""
        sanitized = message
        if self.password and len(self.password) > 0:
            sanitized = sanitized.replace(self.password, "******")
        return sanitized

    def validate_configuration(self) -> Dict[str, Any]:
        """
        Validate configuration without exposing any secret values.
        Reports missing parameter names only.
        """
        missing = []
        if not self.host:
            missing.append("SMTP_HOST")
        if not self.port:
            missing.append("SMTP_PORT")
        if not self.from_addr:
            missing.append("SMTP_FROM")
        
        # If username is provided, password must also be provided
        if self.username and not self.password:
            missing.append("SMTP_PASSWORD")

        return {
            "valid": len(missing) == 0,
            "provider": "smtp",
            "host_configured": bool(self.host),
            "port": self.port,
            "tls_enabled": self.use_tls,
            "has_credentials": bool(self.username and self.password),
            "missing": missing
        }

    def send_email(
        self,
        recipient: str,
        subject: str,
        body: str,
        action_id: str = "",
        extra: Optional[Dict[str, Any]] = None
    ) -> EmailSendResult:
        now_ts = datetime.now(timezone.utc).isoformat()

        # 1. Validate configuration
        config_check = self.validate_configuration()
        if not config_check["valid"]:
            missing_names = ", ".join(config_check["missing"])
            return EmailSendResult(
                success=False,
                status="FAILED",
                provider="smtp",
                recipient=recipient or "",
                subject=subject,
                error=f"SMTP provider misconfigured: missing required variables [{missing_names}]",
                timestamp=now_ts
            )

        # 2. Validate recipient
        if not recipient or not isinstance(recipient, str):
            return EmailSendResult(
                success=False,
                status="FAILED",
                provider="smtp",
                recipient="",
                subject=subject,
                error="Missing or empty recipient email address",
                timestamp=now_ts
            )

        clean_recipient = recipient.strip()
        # Header injection guard: reject CR or LF in recipient or subject
        if "\r" in clean_recipient or "\n" in clean_recipient:
            return EmailSendResult(
                success=False,
                status="FAILED",
                provider="smtp",
                recipient=clean_recipient,
                subject=subject,
                error="Invalid recipient: contains illegal newline characters",
                timestamp=now_ts
            )

        if not self.EMAIL_REGEX.match(clean_recipient):
            return EmailSendResult(
                success=False,
                status="FAILED",
                provider="smtp",
                recipient=clean_recipient,
                subject=subject,
                error=f"Invalid recipient email format: '{clean_recipient}'",
                timestamp=now_ts
            )

        # 3. Sanitize subject
        clean_subject = (subject or "FlowPilot Notification").replace("\r", "").replace("\n", " ").strip()

        # 4. Construct RFC 5322 Email
        msg = EmailMessage()
        msg["Subject"] = clean_subject
        msg["From"] = self.from_addr
        msg["To"] = clean_recipient
        msg["Date"] = email.utils.formatdate(localtime=True)
        
        # Determine domain for Message-ID
        domain = "flowpilot.ai"
        if "@" in self.from_addr:
            domain = self.from_addr.split("@")[-1]
        msg_id = email.utils.make_msgid(domain=domain)
        msg["Message-ID"] = msg_id

        msg.set_content(body or "")

        # 5. Connect and send via smtplib
        try:
            # Use SSL if port 465, otherwise standard SMTP with optional STARTTLS
            if self.port == 465:
                server = smtplib.SMTP_SSL(self.host, self.port, timeout=self.timeout)
            else:
                server = smtplib.SMTP(self.host, self.port, timeout=self.timeout)

            with server as s:
                s.ehlo()
                if self.use_tls and self.port != 465:
                    s.starttls()
                    s.ehlo()

                if self.username and self.password:
                    s.login(self.username, self.password)

                s.send_message(msg)

            # Important: Use SMTP_ACCEPTED to accurately reflect relay acceptance
            return EmailSendResult(
                success=True,
                status="SMTP_ACCEPTED",
                provider="smtp",
                message_id=msg_id,
                recipient=clean_recipient,
                subject=clean_subject,
                timestamp=now_ts,
                data={
                    "status": "SMTP_ACCEPTED",
                    "provider": "smtp",
                    "message_id": msg_id,
                    "recipient": clean_recipient,
                    "timestamp": now_ts
                }
            )

        except smtplib.SMTPAuthenticationError:
            return EmailSendResult(
                success=False,
                status="FAILED",
                provider="smtp",
                recipient=clean_recipient,
                subject=clean_subject,
                error="SMTP Authentication failed (credentials rejected by relay)",
                timestamp=now_ts
            )
        except (smtplib.SMTPConnectError, socket.gaierror, ConnectionRefusedError, TimeoutError, socket.timeout) as e:
            return EmailSendResult(
                success=False,
                status="FAILED",
                provider="smtp",
                recipient=clean_recipient,
                subject=clean_subject,
                error=f"SMTP Connection failure: Unable to connect to host '{self.host}:{self.port}' ({self._sanitize_error(str(e))})",
                timestamp=now_ts
            )
        except smtplib.SMTPRecipientsRefused as e:
            return EmailSendResult(
                success=False,
                status="FAILED",
                provider="smtp",
                recipient=clean_recipient,
                subject=clean_subject,
                error=f"SMTP Recipient refused: '{clean_recipient}'",
                timestamp=now_ts
            )
        except smtplib.SMTPSenderRefused:
            return EmailSendResult(
                success=False,
                status="FAILED",
                provider="smtp",
                recipient=clean_recipient,
                subject=clean_subject,
                error=f"SMTP Sender refused: '{self.from_addr}'",
                timestamp=now_ts
            )
        except smtplib.SMTPDataError as e:
            return EmailSendResult(
                success=False,
                status="FAILED",
                provider="smtp",
                recipient=clean_recipient,
                subject=clean_subject,
                error=f"SMTP Data error: {self._sanitize_error(str(e))}",
                timestamp=now_ts
            )
        except Exception as e:
            clean_err = self._sanitize_error(str(e))
            return EmailSendResult(
                success=False,
                status="FAILED",
                provider="smtp",
                recipient=clean_recipient,
                subject=clean_subject,
                error=f"SMTP send failed: {clean_err}",
                timestamp=now_ts
            )

    def verify_delivery(self, message_id: str) -> Dict[str, Any]:
        """
        Technically honest delivery verification for SMTP.
        Standard SMTP acceptance at relay does not imply confirmed inbox delivery
        without downstream delivery status notifications (DSN) or incoming webhook receipts.
        """
        return {
            "status": "SMTP_ACCEPTED",
            "provider": "smtp",
            "message_id": message_id,
            "delivered": None,
            "detail": "Message was accepted by the SMTP relay. End-to-end inbox delivery is unconfirmed without downstream DSN receipts.",
            "verificationMode": "SMTP_ACCEPTED"
        }

def get_email_provider() -> EmailProvider:
    """Factory function returning the configured EmailProvider instance."""
    configured_provider = os.getenv("EMAIL_PROVIDER") or os.getenv("EMAIL_MODE", "sandbox")
    if configured_provider.lower().strip() == "smtp":
        return SMTPEmailProvider()
    return SandboxEmailProvider()
