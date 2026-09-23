from typing import Dict, Any
from ..tool_registry import ToolResult, ToolContext
from ..models import Invoice

def get_invoice_execute(input_data: Dict[str, Any], context: ToolContext) -> ToolResult:
    invoice_id = input_data.get("invoice_id")
    if not invoice_id:
        return ToolResult(status="FAILED", error="Missing invoice_id")
        
    db = context.db
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    
    if not invoice:
        return ToolResult(status="FAILED", error="Invoice not found")
        
    return ToolResult(status="SUCCESS", data={
        "id": invoice.id,
        "invoice_number": invoice.invoice_number,
        "customer_id": invoice.customer_id,
        "amount": invoice.amount,
        "due_date": invoice.due_date.isoformat() if invoice.due_date else None,
        "status": invoice.status,
        "days_overdue": invoice.days_overdue
    })

def get_overdue_invoices_execute(input_data: Dict[str, Any], context: ToolContext) -> ToolResult:
    db = context.db
    invoices = db.query(Invoice).filter(Invoice.days_overdue > 0).all()
    
    results = []
    for inv in invoices:
        results.append({
            "id": inv.id,
            "invoice_number": inv.invoice_number,
            "customer_id": inv.customer_id,
            "amount": inv.amount,
            "status": inv.status,
            "days_overdue": inv.days_overdue
        })
        
    return ToolResult(status="SUCCESS", data={"invoices": results, "count": len(results)})
