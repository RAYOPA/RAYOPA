export interface PlanStep {
  tool: string;
  arguments: Record<string, unknown>;
  reason: string;
  requires_approval: boolean;
}

export interface ToolExecutionResult {
  tool_name: string;
  arguments: Record<string, unknown>;
  result: Record<string, unknown>;
  status: string;
}

export interface Approval {
  id: string;
  workflow_id: string;
  workflow_objective?: string;
  action: string;
  reason?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requested_at: string;
  approved_by?: string;
  approved_at?: string;
}

export interface FailureInfo {
  tool_name?: string;
  arguments?: Record<string, unknown>;
  error?: string;
}

export interface Workflow {
  id: string;
  objective: string;
  mode: string;
  status: 'PLAN' | 'IN_PROGRESS' | 'WAITING_FOR_APPROVAL' | 'APPROVED' | 'COMPLETED' | 'FAILED' | 'REJECTED';
  current_step_index: number;
  ai_call_count: number;
  plan: PlanStep[];
  completed_actions: ToolExecutionResult[];
  failures: FailureInfo[];
  approvals: Approval[];
  created_at: string;
  updated_at?: string;
  completed_at?: string;
}

export interface WorkflowListItem {
  id: string;
  objective: string;
  mode: string;
  status: string;
  created_at: string;
  completed_at?: string;
}

export interface AuditEvent {
  id: string;
  workflow_id: string;
  event_type: string;
  actor: string;
  tool?: string;
  status?: string;
  summary?: string;
  metadata_json?: Record<string, unknown>;
  timestamp: string;
}

export interface DashboardMetrics {
  invoices_analyzed: number;
  actionable_cases: number;
  monitoring_cases: number;
  approval_requests: number;
  approved: number;
  rejected: number;
  business_actions: number;
  successful_actions: number;
  failed_attempts: number;
  recovered_failures: number;
  replans: number;
  unresolved: number;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  customer_id: string;
  amount: number;
  status: string;
  days_overdue: number;
  due_date: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: string;
  risk_level: string;
}
