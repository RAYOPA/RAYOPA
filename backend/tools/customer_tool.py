from typing import Dict, Any
from ..tool_registry import ToolResult, ToolContext
from ..models import Customer

def get_customer_execute(input_data: Dict[str, Any], context: ToolContext) -> ToolResult:
    customer_id = input_data.get("customer_id")
    if not customer_id:
        return ToolResult(status="FAILED", error="Missing customer_id")
        
    db = context.db
    customer = db.query(Customer).filter((Customer.id == customer_id) | (Customer.name == customer_id)).first()
    
    if not customer:
        return ToolResult(status="FAILED", error="Customer not found")
        
    return ToolResult(status="SUCCESS", data={
        "id": customer.id,
        "name": customer.name,
        "email": customer.email,
        "phone": customer.phone,
        "status": customer.status,
        "risk_level": customer.risk_level
    })

def get_customer_contacts_execute(input_data: Dict[str, Any], context: ToolContext) -> ToolResult:
    customer_id = input_data.get("customer_id")
    if not customer_id:
        return ToolResult(status="FAILED", error="Missing customer_id")
        
    db = context.db
    customer = db.query(Customer).filter((Customer.id == customer_id) | (Customer.name == customer_id)).first()
    
    if not customer:
        return ToolResult(status="FAILED", error="Customer not found")
        
    # In a real app, you might have a separate Contacts table. 
    # For now, we return primary and a mocked alternate for recovery scenarios
    contacts = [
        {"type": "primary", "email": customer.email, "phone": customer.phone}
    ]
    
    # Adding a generic alternate contact logic based on data presence
    if customer.email and not customer.email.endswith("invalid.com"):
        contacts.append({
            "type": "billing", 
            "email": f"billing@{customer.email.split('@')[-1]}" if "@" in customer.email else "billing@alternate.com"
        })
        
    return ToolResult(status="SUCCESS", data={"contacts": contacts})
