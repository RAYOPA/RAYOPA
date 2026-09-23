from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class ToolExecutionResult(BaseModel):
    tool_name: str
    arguments: Dict[str, Any]
    result: Dict[str, Any]
    status: str

class PlanStep(BaseModel):
    tool: str = Field(..., description="The name of the tool to execute")
    arguments: Dict[str, Any] = Field(default_factory=dict, description="The arguments for the tool")
    reason: str = Field(..., description="Reason for executing this tool")
    requires_approval: bool = Field(default=False, description="Whether this step requires human approval")

class State(BaseModel):
    workflow_id: str
    objective: str
    plan: List[PlanStep] = Field(default_factory=list)
    current_step_index: int = Field(default=0)
    completed_actions: List[ToolExecutionResult] = Field(default_factory=list)
    failures: List[Dict[str, Any]] = Field(default_factory=list)
    status: str = Field(default="PLAN")
    context: Dict[str, Any] = Field(default_factory=dict)
    ai_call_count: int = Field(default=0)
