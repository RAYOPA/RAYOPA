from ..tool_registry import ToolRegistry, ToolDefinition
from .email_tool import prepare_email_execute, send_email_execute, verify_delivery_execute
from .customer_tool import get_customer_execute, get_customer_contacts_execute
from .invoice_tool import get_invoice_execute, get_overdue_invoices_execute
from .payment_tool import get_payment_status_execute, get_payment_history_execute
from .communication_tool import get_communication_history_execute, get_last_contact_execute
from .policy_tool import get_policy_execute
from .verification_tool import verify_action_execute

registry = ToolRegistry()

registry.register_tool(ToolDefinition(
    name="prepareEmail",
    description="Prepares an email draft",
    inputSchema={"type": "object", "properties": {"recipient": {"type": "string", "description": "Email address of the recipient"}, "subject": {"type": "string", "description": "Subject of the email"}, "body": {"type": "string", "description": "Body of the email"}}, "required": ["recipient", "subject", "body"]},
    outputSchema={}, requiresApproval=False,
    execute=prepare_email_execute,
    domain="communication",
    capabilities=["email", "messaging", "draft"],
    supported_entities=["customer", "invoice"],
    application="Email"
))
registry.register_tool(ToolDefinition(
    name="sendEmail",
    description="Sends an email",
    inputSchema={"type": "object", "properties": {"recipient": {"type": "string", "description": "Email address of the recipient"}, "subject": {"type": "string", "description": "Subject of the email"}, "body": {"type": "string", "description": "Body of the email"}}, "required": ["recipient", "subject", "body"]},
    outputSchema={}, requiresApproval=True,
    execute=send_email_execute,
    domain="communication",
    capabilities=["email", "messaging", "send"],
    supported_entities=["customer", "invoice"],
    application="Email"
))
registry.register_tool(ToolDefinition(
    name="verifyDelivery",
    description="Verifies email delivery",
    inputSchema={"type": "object", "properties": {"message_id": {"type": "string", "description": "ID of the sent message"}}, "required": ["message_id"]},
    outputSchema={}, requiresApproval=False,
    execute=verify_delivery_execute,
    domain="communication",
    capabilities=["email", "verify", "delivery"],
    supported_entities=["message"],
    application="Email"
))

registry.register_tool(ToolDefinition(
    name="getCustomer",
    description="Gets customer details",
    inputSchema={"type": "object", "properties": {"customer_id": {"type": "string", "description": "ID of the customer"}}, "required": ["customer_id"]},
    outputSchema={}, requiresApproval=False,
    execute=get_customer_execute,
    domain="crm",
    capabilities=["read", "customer_data"],
    supported_entities=["customer"],
    application="CRM"
))
registry.register_tool(ToolDefinition(
    name="getCustomerContacts",
    description="Gets contacts for a customer",
    inputSchema={"type": "object", "properties": {"customer_id": {"type": "string", "description": "ID of the customer"}}, "required": ["customer_id"]},
    outputSchema={}, requiresApproval=False,
    execute=get_customer_contacts_execute,
    domain="crm",
    capabilities=["read", "contact_data", "customer_data"],
    supported_entities=["customer", "contact"],
    application="CRM"
))

registry.register_tool(ToolDefinition(
    name="getInvoice",
    description="Gets invoice details",
    inputSchema={"type": "object", "properties": {"invoice_id": {"type": "string", "description": "ID of the invoice"}}, "required": ["invoice_id"]},
    outputSchema={}, requiresApproval=False,
    execute=get_invoice_execute,
    domain="finance",
    capabilities=["read", "financial_data", "invoice"],
    supported_entities=["invoice"]
))
registry.register_tool(ToolDefinition(
    name="getOverdueInvoices",
    description="Gets overdue invoices",
    inputSchema={"type": "object", "properties": {}, "required": []},
    outputSchema={}, requiresApproval=False,
    execute=get_overdue_invoices_execute,
    domain="finance",
    capabilities=["read", "financial_data", "invoice", "overdue"],
    supported_entities=["invoice", "customer"]
))

registry.register_tool(ToolDefinition(
    name="getPaymentStatus",
    description="Gets payment status",
    inputSchema={"type": "object", "properties": {"invoice_id": {"type": "string", "description": "ID of the invoice"}}, "required": ["invoice_id"]},
    outputSchema={}, requiresApproval=False,
    execute=get_payment_status_execute,
    domain="finance",
    capabilities=["read", "financial_data", "payment"],
    supported_entities=["payment", "invoice"]
))
registry.register_tool(ToolDefinition(
    name="getPaymentHistory",
    description="Gets payment history",
    inputSchema={"type": "object", "properties": {"customer_id": {"type": "string", "description": "ID of the customer"}}, "required": ["customer_id"]},
    outputSchema={}, requiresApproval=False,
    execute=get_payment_history_execute,
    domain="finance",
    capabilities=["read", "financial_data", "payment", "history"],
    supported_entities=["payment", "customer"]
))

registry.register_tool(ToolDefinition(
    name="getCommunicationHistory",
    description="Gets communication history",
    inputSchema={"type": "object", "properties": {"customer_id": {"type": "string", "description": "ID of the customer"}}, "required": ["customer_id"]},
    outputSchema={}, requiresApproval=False,
    execute=get_communication_history_execute,
    domain="crm",
    capabilities=["read", "history", "communication"],
    supported_entities=["customer", "communication"]
))
registry.register_tool(ToolDefinition(
    name="getLastContact",
    description="Gets last contact",
    inputSchema={"type": "object", "properties": {"customer_id": {"type": "string", "description": "ID of the customer"}}, "required": ["customer_id"]},
    outputSchema={}, requiresApproval=False,
    execute=get_last_contact_execute,
    domain="crm",
    capabilities=["read", "contact", "communication"],
    supported_entities=["customer"]
))

registry.register_tool(ToolDefinition(
    name="getPolicy",
    description="Gets policy info",
    inputSchema={"type": "object", "properties": {"policy_type": {"type": "string", "description": "Type of policy to retrieve (e.g. overdue)"}}, "required": ["policy_type"]},
    outputSchema={}, requiresApproval=False,
    execute=get_policy_execute,
    domain="compliance",
    capabilities=["read", "policy", "rules"],
    supported_entities=["policy"]
))

registry.register_tool(ToolDefinition(
    name="verifyAction",
    description="Verifies an action",
    inputSchema={"type": "object", "properties": {"action": {"type": "string", "description": "Action to verify"}}, "required": ["action"]},
    outputSchema={}, requiresApproval=False,
    execute=verify_action_execute,
    domain="security",
    capabilities=["verify", "action"],
    supported_entities=["action"]
))

from .cross_app_tools import cross_app_tools
for t in cross_app_tools:
    registry.register_tool(t)
