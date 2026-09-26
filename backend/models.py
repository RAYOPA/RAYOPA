from sqlalchemy import Column, String, Integer, Float, DateTime, Boolean, ForeignKey, JSON, Index, text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from .database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, nullable=False) # admin, operator, viewer
    created_at = Column(DateTime, server_default=func.now())

class Customer(Base):
    __tablename__ = "customers"
    
    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    phone = Column(String)
    status = Column(String, default="ACTIVE")
    risk_level = Column(String, default="LOW")
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now(), server_default=func.now())
    
    invoices = relationship("Invoice", back_populates="customer")
    communications = relationship("Communication", back_populates="customer")

class Invoice(Base):
    __tablename__ = "invoices"
    
    id = Column(String, primary_key=True, index=True)
    invoice_number = Column(String, unique=True, index=True)
    customer_id = Column(String, ForeignKey("customers.id"))
    amount = Column(Float, nullable=False)
    due_date = Column(DateTime, nullable=False)
    status = Column(String, default="PENDING")
    days_overdue = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now(), server_default=func.now())
    
    customer = relationship("Customer", back_populates="invoices")
    payments = relationship("Payment", back_populates="invoice")

class Payment(Base):
    __tablename__ = "payments"
    
    id = Column(String, primary_key=True, index=True)
    invoice_id = Column(String, ForeignKey("invoices.id"))
    amount = Column(Float, nullable=False)
    payment_date = Column(DateTime, nullable=False)
    status = Column(String, default="COMPLETED")
    reference = Column(String)
    
    invoice = relationship("Invoice", back_populates="payments")

class Communication(Base):
    __tablename__ = "communications"
    
    id = Column(String, primary_key=True, index=True)
    customer_id = Column(String, ForeignKey("customers.id"))
    invoice_id = Column(String, ForeignKey("invoices.id"), nullable=True)
    channel = Column(String, nullable=False)
    recipient = Column(String, nullable=False)
    subject = Column(String)
    message = Column(String, nullable=False)
    message_id = Column(String, nullable=True, index=True)
    status = Column(String, default="SENT")
    timestamp = Column(DateTime, server_default=func.now())
    
    customer = relationship("Customer", back_populates="communications")

class Workflow(Base):
    __tablename__ = "workflows"
    
    id = Column(String, primary_key=True, index=True)
    objective = Column(String, nullable=False)
    mode = Column(String, default="AUTONOMOUS")
    status = Column(String, default="IN_PROGRESS")
    current_step = Column(String)
    current_plan = Column(JSON)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now(), server_default=func.now())
    completed_at = Column(DateTime, nullable=True)
    execution_state = Column(JSON, nullable=True)
    
    steps = relationship("WorkflowStep", back_populates="workflow")
    tool_executions = relationship("ToolExecution", back_populates="workflow")
    audit_events = relationship("AuditEvent", back_populates="workflow")
    approvals = relationship("Approval", back_populates="workflow")
    replans = relationship("Replan", back_populates="workflow")

class WorkflowStep(Base):
    __tablename__ = "workflow_steps"
    
    id = Column(String, primary_key=True, index=True)
    workflow_id = Column(String, ForeignKey("workflows.id"))
    step_id = Column(String, nullable=False)
    description = Column(String)
    status = Column(String, default="PENDING")
    input = Column(JSON)
    output = Column(JSON)
    started_at = Column(DateTime, server_default=func.now())
    completed_at = Column(DateTime, nullable=True)
    
    workflow = relationship("Workflow", back_populates="steps")

class ToolExecution(Base):
    __tablename__ = "tool_executions"
    
    id = Column(String, primary_key=True, index=True)
    workflow_id = Column(String, ForeignKey("workflows.id"))
    idempotency_key = Column(String, index=True, nullable=True)
    tool_name = Column(String, nullable=False)
    input = Column(JSON)
    output = Column(JSON)
    status = Column(String, default="PENDING")
    error = Column(String)
    attempt = Column(Integer, default=1)
    started_at = Column(DateTime, server_default=func.now())
    completed_at = Column(DateTime, nullable=True)
    
    workflow = relationship("Workflow", back_populates="tool_executions")
    
    __table_args__ = (
        Index(
            "uix_tool_exec_idemp_active",
            "idempotency_key",
            unique=True,
            postgresql_where=text("status IN ('SUCCESS', 'RUNNING')"),
            sqlite_where=text("status IN ('SUCCESS', 'RUNNING')")
        ),
    )

class AuditEvent(Base):
    __tablename__ = "audit_events"
    
    id = Column(String, primary_key=True, index=True)
    workflow_id = Column(String, ForeignKey("workflows.id"))
    event_type = Column(String, nullable=False)
    actor = Column(String, nullable=False)
    tool = Column(String)
    status = Column(String)
    summary = Column(String)
    metadata_json = Column(JSON)
    timestamp = Column(DateTime, server_default=func.now())
    
    workflow = relationship("Workflow", back_populates="audit_events")

class Approval(Base):
    __tablename__ = "approvals"
    
    id = Column(String, primary_key=True, index=True)
    workflow_id = Column(String, ForeignKey("workflows.id"))
    action = Column(String, nullable=False)
    reason = Column(String)
    requested_at = Column(DateTime, server_default=func.now())
    requested_by = Column(String)
    status = Column(String, default="PENDING")
    approved_by = Column(String)
    approved_at = Column(DateTime, nullable=True)
    modified_action = Column(JSON)
    
    workflow = relationship("Workflow", back_populates="approvals")

class Replan(Base):
    __tablename__ = "replans"
    
    id = Column(String, primary_key=True, index=True)
    workflow_id = Column(String, ForeignKey("workflows.id"))
    trigger = Column(String, nullable=False)
    previous_plan = Column(JSON)
    failure_context = Column(JSON)
    new_plan = Column(JSON)
    status = Column(String, default="COMPLETED")
    created_at = Column(DateTime, server_default=func.now())
    
    workflow = relationship("Workflow", back_populates="replans")

class ExecutionMemory(Base):
    __tablename__ = "execution_memory"
    
    id = Column(String, primary_key=True, index=True)
    workflow_id = Column(String, index=True)
    objective = Column(String, nullable=False)
    domain = Column(String)
    tools_selected = Column(JSON)
    successful_actions = Column(JSON)
    failed_actions = Column(JSON)
    failure_reasons = Column(JSON)
    recovery_strategy = Column(JSON)
    applications_used = Column(JSON)
    lessons = Column(JSON)
    avoid_actions = Column(JSON)
    summary = Column(String)
    final_status = Column(String)
    approval_outcomes = Column(JSON)
    useful_recovery_facts = Column(JSON)
    timestamp = Column(DateTime, server_default=func.now())

