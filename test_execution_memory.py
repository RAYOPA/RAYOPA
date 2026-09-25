import os
import time
from backend.database import SessionLocal, Base, engine
from agents.orchestrator import Orchestrator
from backend.execution_memory import memory_layer

def test_memory():
    print("Testing Execution Memory...")
    Base.metadata.create_all(bind=engine)
    
    # We will simulate the state saving by directly pushing a mock state to memory_layer
    # to emulate a failed-then-recovered run.
    
    class MockState:
        def __init__(self, obj, plan, completed, fails, status):
            self.objective = obj
            self.plan = plan
            self.completed_actions = completed
            self.failures = fails
            self.status = status
            
    class MockAction:
        def __init__(self, tool):
            self.tool_name = tool
            self.tool = tool
            
    # Run 1: Failure occurs -> replan succeeds
    mock_run_1_state = MockState(
        obj="Send overdue email to customer Alpha",
        plan=[MockAction("sendEmail")],
        completed=[MockAction("prepareEmail"), MockAction("sendEmail")],
        fails=[{"error": "Email missing, used CRM fallback"}],
        status="COMPLETED"
    )
    
    memory_layer.save_memory(mock_run_1_state)
    print("Run 1 (Simulated): Failure occurred and recovered.")
    
    # Run 2: Similar objective
    objective_2 = "Send overdue email to customer Beta"
    experiences = memory_layer.retrieve_relevant_experience(objective_2, top_k=2)
    
    assert len(experiences) > 0
    exp = experiences[0]
    
    print("\nRun 2: Retrieved Experience:")
    print("- Objective:", exp["objective"])
    print("- Successful actions:", exp["successful_actions"])
    print("- Failure patterns:", exp["failure_patterns"])
    print("- Recovery strategy:", exp["recovery_strategy"])
    
    assert "sendEmail" in exp["successful_actions"]
    assert len(exp["failure_patterns"]) > 0
    assert "Recovered after failure" in exp["recovery_strategy"]
    
    print("\nPlanner will consider this experience context (verified in planner_node).")
    print("Execution memory tests passed!\n")

if __name__ == "__main__":
    test_memory()
