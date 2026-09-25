import uuid
from backend.tool_registry import ToolDefinition, ToolContext, ToolResult

def crm_lookup_execute(input_data: dict, context: ToolContext) -> ToolResult:
    return ToolResult(status="SUCCESS", data={"crm_id": "crm-123", "status": "ACTIVE"})

def spreadsheet_update_execute(input_data: dict, context: ToolContext) -> ToolResult:
    sheet = input_data.get("sheet", "")
    if sheet == "Collections":
        return ToolResult(status="FAILED", error="Sheet is locked. Use 'CollectionsV2'.")
    return ToolResult(status="SUCCESS", data={"row_updated": True, "sheet": sheet})

def get_expense_report_execute(input_data: dict, context: ToolContext) -> ToolResult:
    return ToolResult(status="SUCCESS", data={"expense_id": input_data.get("expense_id"), "amount": 500, "category": "Travel"})

def approve_expense_execute(input_data: dict, context: ToolContext) -> ToolResult:
    expense_id = input_data.get("expense_id")
    if expense_id == "EXP_FAIL":
        return ToolResult(status="FAILED", error="Expense violates policy. Requires VP approval.", data={"requires_replan": True})
    return ToolResult(status="SUCCESS", data={"approved": True})

def provision_account_execute(input_data: dict, context: ToolContext) -> ToolResult:
    customer_id = input_data.get("customer_id")
    if customer_id == "FAIL_ONBOARDING":
        return ToolResult(status="FAILED", error="Customer record incomplete. Need manual KYC.", data={"requires_replan": True})
    return ToolResult(status="SUCCESS", data={"account_id": "acc-999", "status": "PROVISIONED"})

cross_app_tools = [
    ToolDefinition(
        name="crmLookupCustomer",
        description="Lookup customer in CRM",
        inputSchema={"type": "object", "properties": {"email": {"type": "string"}}},
        outputSchema={}, requiresApproval=False,
        execute=crm_lookup_execute,
        domain="crm", capabilities=["read", "lookup"], supported_entities=["customer"],
        application="CRM"
    ),
    ToolDefinition(
        name="spreadsheetUpdateRow",
        description="Update row in spreadsheet",
        inputSchema={"type": "object", "properties": {"sheet": {"type": "string"}, "data": {"type": "object"}}},
        outputSchema={}, requiresApproval=False,
        execute=spreadsheet_update_execute,
        domain="spreadsheet", capabilities=["write", "update"], supported_entities=["row", "sheet"],
        application="Spreadsheet"
    ),
    ToolDefinition(
        name="getExpenseReport",
        description="Get expense report details",
        inputSchema={"type": "object", "properties": {"expense_id": {"type": "string"}}},
        outputSchema={}, requiresApproval=False,
        execute=get_expense_report_execute,
        domain="finance", capabilities=["read", "expense"], supported_entities=["expense"],
        application="Finance"
    ),
    ToolDefinition(
        name="approveExpense",
        description="Approve an expense report",
        inputSchema={"type": "object", "properties": {"expense_id": {"type": "string"}}},
        outputSchema={}, requiresApproval=True,
        execute=approve_expense_execute,
        domain="finance", capabilities=["write", "approve"], supported_entities=["expense"],
        application="Finance"
    ),
    ToolDefinition(
        name="provisionAccount",
        description="Provision a new customer account",
        inputSchema={"type": "object", "properties": {"customer_id": {"type": "string"}}},
        outputSchema={}, requiresApproval=True,
        execute=provision_account_execute,
        domain="onboarding", capabilities=["write", "provision"], supported_entities=["account"],
        application="Onboarding"
    )
]
