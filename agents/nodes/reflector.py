import json
from agents.state import State
from agents.nodes.planner import run_cli
from backend.execution_memory import memory_layer

def post_execution_reflection(state: State):
    """
    Runs after workflow completion or failure to convert outcomes into structured lessons.
    This does NOT execute tools or bypass policy; it is advisory only.
    """
    if state.status not in ["COMPLETED", "FAILED"]:
        return None

    # Gather data for reflection
    tools_selected = list(set([step.tool for step in state.plan]))
    successful_actions = [a.tool_name for a in state.completed_actions]
    failed_actions = [f.get("error", "") for f in state.failures]
    
    payload = {
        "objective": state.objective,
        "status": state.status,
        "tools_selected": tools_selected,
        "successful_actions": successful_actions,
        "failed_actions": failed_actions,
        "failures": state.failures
    }

    # Call AI Reflector
    res = run_cli(payload, "reflect")
    
    if res.get("status") == "SUCCESS" and "reflection" in res:
        reflection = res["reflection"]
        # Save to ExecutionMemory
        memory_layer.save_reflection(state, reflection)
        return reflection
    else:
        print(f"Reflection failed: {res}")
        return None
