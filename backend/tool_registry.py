import uuid
import datetime
from typing import Callable, Any, Dict, List, Optional
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from .models import ToolExecution, AuditEvent

class ToolResult(BaseModel):
    status: str
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    verificationMode: Optional[str] = None

class ToolContext(BaseModel):
    workflow_id: str
    step_id: str
    action_id: str
    db: Any

class ToolDefinition(BaseModel):
    name: str
    description: str
    inputSchema: Any
    outputSchema: Any
    requiresApproval: bool
    execute: Callable[[Any, ToolContext], ToolResult]

class ToolRegistry:
    def __init__(self):
        self._tools: Dict[str, ToolDefinition] = {}
        
    def register_tool(self, tool: ToolDefinition):
        self._tools[tool.name] = tool
        
    def list_tools(self) -> List[ToolDefinition]:
        return list(self._tools.values())
        
    def get_tool(self, name: str) -> Optional[ToolDefinition]:
        return self._tools.get(name)
        
    def execute_tool(self, tool_name: str, input_data: Any, context: ToolContext) -> ToolResult:
        tool = self.get_tool(tool_name)
        if not tool:
            return ToolResult(status="FAILED", error=f"Tool {tool_name} not found in registry")
            
        db: Session = context.db
        
        # Check idempotency
        idempotency_key = f"{context.workflow_id}_{context.action_id}"
        
        # Check if already successfully executed
        existing_success = db.query(ToolExecution).filter_by(
            idempotency_key=idempotency_key,
            status="SUCCESS"
        ).first()
        
        if existing_success:
            audit_event = AuditEvent(
                id=str(uuid.uuid4()),
                workflow_id=context.workflow_id,
                event_type="IDEMPOTENT_REPLAY",
                actor="SYSTEM",
                tool=tool_name,
                status="SUCCESS",
                summary=f"Idempotent replay for tool {tool_name}",
                metadata_json={"execution_id": existing_success.id, "idempotency_key": idempotency_key}
            )
            db.add(audit_event)
            db.commit()
            return ToolResult(status="SUCCESS", data=existing_success.output, verificationMode="IDEMPOTENT")
            
        try:
            # Create execution record
            execution_id = str(uuid.uuid4())
            execution = ToolExecution(
                id=execution_id,
                workflow_id=context.workflow_id,
                idempotency_key=idempotency_key,
                tool_name=tool_name,
                input=input_data,
                status="RUNNING"
            )
            db.add(execution)
            
            audit_event_start = AuditEvent(
                id=str(uuid.uuid4()),
                workflow_id=context.workflow_id,
                event_type="TOOL_STARTED",
                actor="SYSTEM",
                tool=tool_name,
                status="RUNNING",
                summary=f"Started executing tool {tool_name}",
                metadata_json={"execution_id": execution_id}
            )
            db.add(audit_event_start)
            db.commit()
        except IntegrityError:
            db.rollback()
            # If we hit IntegrityError, a SUCCESS or RUNNING record already exists
            existing = db.query(ToolExecution).filter(
                ToolExecution.idempotency_key == idempotency_key,
                ToolExecution.status.in_(["SUCCESS", "RUNNING"])
            ).first()
            if existing and existing.status == "SUCCESS":
                return ToolResult(status="SUCCESS", data=existing.output, verificationMode="IDEMPOTENT")
            return ToolResult(status="FAILED", error="Concurrent execution detected")
        

        # Execute tool
        try:
            result = tool.execute(input_data, context)
            execution.status = result.status
            if result.status == "SUCCESS":
                execution.output = result.data
            else:
                execution.error = result.error
                
            execution.completed_at = datetime.datetime.now(datetime.timezone.utc)
            
            audit_event_end = AuditEvent(
                id=str(uuid.uuid4()),
                workflow_id=context.workflow_id,
                event_type="TOOL_COMPLETED" if result.status == "SUCCESS" else "TOOL_FAILED",
                actor="SYSTEM",
                tool=tool_name,
                status=result.status,
                summary=f"Tool {tool_name} finished with status {result.status}",
                metadata_json={"execution_id": execution_id, "result": result.model_dump()}
            )
            db.add(audit_event_end)
            db.commit()
            
            return result
        except Exception as e:
            execution.status = "FAILED"
            execution.error = str(e)
            execution.completed_at = datetime.datetime.now(datetime.timezone.utc)
            
            audit_event_fail = AuditEvent(
                id=str(uuid.uuid4()),
                workflow_id=context.workflow_id,
                event_type="TOOL_FAILED",
                actor="SYSTEM",
                tool=tool_name,
                status="FAILED",
                summary=f"Tool {tool_name} raised an exception",
                metadata_json={"execution_id": execution_id, "error": str(e)}
            )
            db.add(audit_event_fail)
            db.commit()
            
            return ToolResult(status="FAILED", error=str(e))
