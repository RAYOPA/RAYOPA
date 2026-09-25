import os
import json
from dotenv import load_dotenv

load_dotenv()
os.environ["DATABASE_URL"] = "sqlite:///./data/flowpilot_day3.db"

from backend.database import Base, get_db, engine, SessionLocal
from backend.models import Customer, Invoice, Workflow, ExecutionMemory
from agents.state import State, PlanStep, ToolExecutionResult
from agents.nodes.planner import planner_node, run_cli, get_tools_dictionary
from agents.nodes.reflector import post_execution_reflection
from backend.execution_memory import memory_layer

def test_reflection_and_experience_retrieval():
    Base.metadata.create_all(bind=engine)
    
    # RUN 1: Collections spreadsheet failure -> replan -> recovery
    print("=== RUN 1: Causing failure and doing Reflection ===")
    
    # Mocking state for a workflow that failed and was recovered
    run1_state = State(
        workflow_id="wf-reflection-test-1",
        objective="Update Collections spreadsheet",
        status="COMPLETED",
        plan=[
            PlanStep(tool="updateCollectionsSpreadsheet", arguments={"sheet": "v1"}, reason=""),
            PlanStep(tool="updateCollectionsSpreadsheetV2", arguments={"sheet": "v2"}, reason="")
        ],
        completed_actions=[
            ToolExecutionResult(tool_name="updateCollectionsSpreadsheetV2", arguments={"sheet": "v2"}, result={"status": "SUCCESS"}, status="SUCCESS")
        ],
        failures=[
            {"error": "Collections spreadsheet may be unavailable", "code": "SHEET_LOCKED"}
        ]
    )
    
    # 1. Run Reflector
    reflection = post_execution_reflection(run1_state)
    assert reflection is not None, "Reflection should be generated"
    print("Reflection Output:", json.dumps(reflection, indent=2))
    
    # Verify Schema and Storage
    db = SessionLocal()
    saved_mem = db.query(ExecutionMemory).filter(ExecutionMemory.objective == "Update Collections spreadsheet").first()
    assert saved_mem is not None, "Memory should be persisted"
    assert len(saved_mem.failed_actions) > 0, "Should persist failure pattern"
    assert len(saved_mem.recovery_strategy) > 0, "Should persist recovery strategy"
    assert len(saved_mem.lessons) > 0, "Should persist lesson"
    print("Run 1 Reflection Persisted Successfully.")
    db.close()
    
    # RUN 2: Similar objective, retrieves experience
    print("\n=== RUN 2: Experience-Informed Planning ===")
    
    tools_dict = get_tools_dictionary()
    objective_run2 = "Update Collections spreadsheet for new month"
    
    # Planner node inherently calls retrieve_relevant_experience
    run2_state = State(
        workflow_id="wf-reflection-test-2",
        objective=objective_run2,
        status="PLANNING"
    )
    
    # Analyze
    analyze_payload = {"objective": objective_run2, "tools": tools_dict, "ai_call_count": 1}
    analyze_res = run_cli(analyze_payload, "analyze")
    structured_obj = analyze_res.get("structured_objective", {})
    
    # Plan (Planner node will inject experience)
    run2_state.objective = objective_run2
    run2_state.status = "PLANNING"
    
    # We call the planner_node directly
    new_state = planner_node(run2_state)
    
    print("\nRun 2 Context Retrieval Metrics:", new_state.retrieval_metrics)
    print("Run 2 Plan Generated:", [step.tool for step in new_state.plan])
    
    # We expect historical_experiences_retrieved > 0
    assert new_state.retrieval_metrics.get("historical_experiences_retrieved", 0) > 0, "Should retrieve experience"
    
    # Verify AI call topology is preserved (Analyze + Plan = 2 calls so far)
    print("Run 2 AI Call Count:", new_state.ai_call_count)
    assert new_state.ai_call_count == 2, "Canonical AI topology should be maintained"

    print("\n[SUCCESS] Reflection and Experience Retrieval Tests Passed!")

if __name__ == "__main__":
    test_reflection_and_experience_retrieval()
