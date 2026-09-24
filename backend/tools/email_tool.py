import os
from typing import Dict, Any
from ..tool_registry import ToolResult, ToolContext

def get_email_mode() -> str:
    return os.getenv("EMAIL_MODE", "sandbox").lower()

def prepare_email_execute(input_data: Dict[str, Any], context: ToolContext) -> ToolResult:
    subject = input_data.get("subject", "Follow-up on Overdue Invoice")
    body = input_data.get("body", "Please settle the outstanding balance.")
    recipient = input_data.get("recipient", "customer@acme.com")
        
    return ToolResult(status="SUCCESS", data={"subject": subject, "body": body, "recipient": recipient, "prepared": True})

def send_email_execute(input_data: Dict[str, Any], context: ToolContext) -> ToolResult:
    recipient = input_data.get("recipient")
    if not recipient:
        return ToolResult(status="FAILED", error="Missing recipient for email sending")
    subject = input_data.get("subject", "Follow-up on Overdue Invoice")
    body = input_data.get("body", "Please settle the outstanding balance.")
        
    mode = get_email_mode()
    
    if mode == "sandbox":
        # Check for simulated failures (for generic failure recovery)
        if "invalid" in recipient:
            return ToolResult(status="FAILED", error="Invalid email address (SIMULATED)", verificationMode="SIMULATED")
            
        return ToolResult(
            status="SUCCESS",
            data={"message_id": f"sim-{context.action_id}"},
            verificationMode="SIMULATED"
        )
    else:
        # Real provider logic would go here
        provider = os.getenv("EMAIL_PROVIDER")
        return ToolResult(status="FAILED", error=f"Real email provider {provider} not configured")

def verify_delivery_execute(input_data: Dict[str, Any], context: ToolContext) -> ToolResult:
    message_id = input_data.get("message_id")
    mode = get_email_mode()
    
    if mode == "sandbox":
        return ToolResult(
            status="SUCCESS", 
            data={"delivered": True, "opened": False},
            verificationMode="SIMULATED"
        )
    
    return ToolResult(status="FAILED", error="Real verification not implemented")
