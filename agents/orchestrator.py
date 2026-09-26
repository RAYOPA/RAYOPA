from agents.graph import create_workflow_graph
from agents.state import State
from utils.audit_logger import AuditLogger

logger = AuditLogger()

from backend.workflow_state import save_workflow_state, load_workflow_state
from backend.execution_memory import memory_layer

# In-memory store removed: WORKFLOW_STATES = {}
class Orchestrator:
    def __init__(self):
        self.graph = create_workflow_graph()
        
    def run_workflow(self, workflow_id: str, goal: str):
        logger.log_event("Orchestrator", "Workflow Started", {"goal": goal})
        
        state = State(workflow_id=workflow_id, objective=goal)
        
        try:
            # We run the graph manually step by step so it persists if it stops
            for event in self.graph.stream(state):
                # Save state
                for k, v in event.items():
                    if isinstance(v, dict):
                        v = State(**v)
                    # Persist state
                    save_workflow_state(workflow_id, v)
            
            final_state = load_workflow_state(workflow_id) or state
            
            if isinstance(final_state, dict):
                final_state = State(**final_state)
            
            if final_state.status == "COMPLETED":
                logger.log_event("Orchestrator", "Workflow Completed", {"items_processed": len(final_state.completed_actions)})
                memory_layer.save_memory(final_state)
            elif final_state.status == "WAITING_FOR_APPROVAL":
                logger.log_event("Orchestrator", "Workflow Paused", {"status": "WAITING_FOR_APPROVAL"})
            elif final_state.status == "FAILED":
                logger.log_event("Orchestrator", "Workflow Failed", {"failures": final_state.failures})
                memory_layer.save_memory(final_state)
                
            return []
        except Exception as e:
            logger.log_event("Orchestrator", "Workflow Failed", {"error": str(e)})
            raise e
            
    def resume_workflow(self, workflow_id: str):
        state = load_workflow_state(workflow_id)
        if state is None:
            raise ValueError("Workflow not found in database")
            
        print("RESUME_WORKFLOW starting. state.status:", state.status)
        if state.status == "WAITING_FOR_APPROVAL":
            state.status = "APPROVED"
            save_workflow_state(workflow_id, state)
            
        logger.log_event("Orchestrator", "Workflow Resumed", {"workflow_id": workflow_id})
        
        try:
            print("RESUME_WORKFLOW before stream")
            for event in self.graph.stream(state):
                print("RESUME_WORKFLOW event:", list(event.keys()))
                for k, v in event.items():
                    if isinstance(v, dict):
                        v = State(**v)
                    print("RESUME_WORKFLOW saving state from node:", k, "status:", v.status)
                    save_workflow_state(workflow_id, v)
                    
            final_state = load_workflow_state(workflow_id) or state
            print("RESUME_WORKFLOW stream finished. final_state.status:", final_state.status)
            
            if isinstance(final_state, dict):
                final_state = State(**final_state)
                
            if final_state.status == "COMPLETED":
                logger.log_event("Orchestrator", "Workflow Completed", {"items_processed": len(final_state.completed_actions)})
                memory_layer.save_memory(final_state)
            elif final_state.status == "WAITING_FOR_APPROVAL":
                logger.log_event("Orchestrator", "Workflow Paused", {"status": "WAITING_FOR_APPROVAL"})
            elif final_state.status == "FAILED":
                logger.log_event("Orchestrator", "Workflow Failed", {"failures": final_state.failures})
                memory_layer.save_memory(final_state)
        except Exception as e:
            print("RESUME_WORKFLOW exception:", str(e))
            logger.log_event("Orchestrator", "Workflow Failed", {"error": str(e)})
            raise e
