from typing import Dict, Any
from ..tool_registry import ToolResult, ToolContext

def get_policy_execute(input_data: Dict[str, Any], context: ToolContext) -> ToolResult:
    policy_type = input_data.get("policy_type")
    if not policy_type:
        return ToolResult(status="FAILED", error="Missing policy_type")
        
    # Mocking database/storage retrieval
    if policy_type == "payment_terms":
        return ToolResult(status="SUCCESS", data={
            "content": "Standard payment terms are Net 30. Overdue accounts after 60 days require collection notice."
        })
    elif policy_type == "communication":
        return ToolResult(status="SUCCESS", data={
            "content": "Emails must be professional and include standard legal disclaimers. Attempt primary contact first, then alternate billing contacts."
        })
    elif policy_type == "overdue":
        return ToolResult(status="SUCCESS", data={
            "content": "Policies for overdue invoices: 1) >= 50,000 requires priority evaluation. 2) > 100,000 AND > 30 days overdue requires manager approval before escalation. 3) > 500,000 requires finance-manager approval. 4) If recent payment extension (PAYMENT_EXTENDED status), no immediate escalation is needed. 5) If email fails, search for alternative verified contact. 6) All external communication requires approval where required."
        })
        
    return ToolResult(status="FAILED", error=f"Policy {policy_type} not found")
