import uuid
import re
from backend.database import SessionLocal
from backend.models import ExecutionMemory
from typing import List, Dict, Any

class ExecutionMemoryLayer:
    def __init__(self):
        pass
        
    def save_memory(self, state):
        db = SessionLocal()
        try:
            # Extract info
            tools_selected = list(set([step.tool for step in state.plan]))
            successful_actions = [a.tool_name for a in state.completed_actions]
            failed_actions = [f.get("error", "") for f in state.failures]
            
            # Very basic extraction of strategy from replan
            recovery_strategy = []
            if len(state.failures) > 0 and state.status == "COMPLETED":
                recovery_strategy = ["Recovered after failure"]
                
            mem = ExecutionMemory(
                id=str(uuid.uuid4()),
                objective=state.objective,
                domain="general",
                tools_selected=tools_selected,
                successful_actions=successful_actions,
                failed_actions=failed_actions,
                failure_reasons=[f.get("error") for f in state.failures],
                recovery_strategy=recovery_strategy,
                final_status=state.status,
                approval_outcomes=[],
                useful_recovery_facts=[]
            )
            db.add(mem)
            db.commit()
        finally:
            db.close()

    def save_reflection(self, state, reflection: Dict[str, Any]):
        db = SessionLocal()
        try:
            tools_selected = list(set([step.tool for step in state.plan]))
            
            mem = ExecutionMemory(
                id=str(uuid.uuid4()),
                workflow_id=state.workflow_id,
                objective=state.objective,
                domain=reflection.get("workflow_domain", "general"),
                tools_selected=tools_selected,
                successful_actions=reflection.get("successful_strategy", []),
                failed_actions=reflection.get("failure_patterns", []),
                failure_reasons=[f.get("error") for f in state.failures],
                recovery_strategy=reflection.get("recovery_strategy", []),
                applications_used=reflection.get("applications_involved", []),
                lessons=reflection.get("lessons", []),
                avoid_actions=reflection.get("avoid_actions", []),
                summary=reflection.get("summary", ""),
                final_status=state.status,
                approval_outcomes=[],
                useful_recovery_facts=[]
            )
            db.add(mem)
            db.commit()
        finally:
            db.close()

    def retrieve_relevant_experience(self, objective: str, top_k: int = 3) -> List[Dict[str, Any]]:
        if not objective:
            return []
            
        db = SessionLocal()
        try:
            memories = db.query(ExecutionMemory).all()
            
            words = set(re.findall(r'\w+', objective.lower()))
            scores = []
            for mem in memories:
                score = 0
                mem_words = set(re.findall(r'\w+', mem.objective.lower()))
                intersection = words.intersection(mem_words)
                score = len(intersection)
                
                if score > 0:
                    scores.append((score, mem))
                    
            scores.sort(key=lambda x: x[0], reverse=True)
            
            results = []
            for score, mem in scores[:top_k]:
                results.append({
                    "objective": mem.objective,
                    "tools_selected": mem.tools_selected,
                    "successful_actions": mem.successful_actions,
                    "failure_patterns": mem.failed_actions,
                    "recovery_strategy": mem.recovery_strategy,
                    "final_status": mem.final_status
                })
            return results
        finally:
            db.close()

memory_layer = ExecutionMemoryLayer()
