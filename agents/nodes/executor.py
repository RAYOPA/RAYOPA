from typing import Any
import uuid
from backend.database import SessionLocal
from backend.tool_registry import ToolContext
from backend.tools import registry
from agents.state import State, ToolExecutionResult
from utils.audit_logger import AuditLogger

logger = AuditLogger()

def executor_node(state: State) -> State:
    if state.current_step_index >= len(state.plan):
        if not state.failures:
            state.status = "COMPLETED"
        else:
            state.status = "REPLAN"
        return state
        
    step = state.plan[state.current_step_index]
    
    # If the step requires approval and we haven't got it yet, we pause
    if step.requires_approval and state.status != "APPROVED":
        logger.log_event("ExecutorAgent", "Approval Required", {"tool": step.tool, "reason": step.reason})
        state.status = "WAITING_FOR_APPROVAL"
        return state
        
    # We execute the step
    logger.log_event("ExecutorAgent", "Executing Task", {"tool": step.tool, "arguments": step.arguments})
    
    db = SessionLocal()
    try:
        ctx = ToolContext(
            workflow_id=state.workflow_id,
            step_id=f"step-{state.current_step_index}",
            action_id=step.id,
            db=db
        )
        
        result = registry.execute_tool(step.tool, step.arguments, ctx)
        
        exec_result = ToolExecutionResult(
            tool_name=step.tool,
            arguments=step.arguments,
            result=result.data if result.data else {"error": result.error},
            status=result.status
        )
        
        if result.status == "FAILED":
            logger.log_event("ExecutorAgent", "Task Failed", {"tool": step.tool, "error": result.error})
            state.failures.append({
                "tool": step.tool,
                "arguments": step.arguments,
                "error": result.error
            })
            state.status = "REPLAN"
        else:
            logger.log_event("ExecutorAgent", "Task Success", {"tool": step.tool, "result": result.data})
            state.completed_actions.append(exec_result)
            state.current_step_index += 1
            # Reset status to execute to proceed to next step
            state.status = "EXECUTE"
            
    except Exception as e:
        logger.log_event("ExecutorAgent", "Task Exception", {"tool": step.tool, "error": str(e)})
        state.failures.append({
            "tool": step.tool,
            "error": str(e)
        })
        state.status = "REPLAN"
    finally:
        db.close()
        
    return state
