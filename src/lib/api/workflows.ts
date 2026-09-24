import { apiFetch } from './client';
import { Workflow, WorkflowListItem, AuditEvent, DashboardMetrics } from './types';

export interface CreateWorkflowParams {
  objective: string;
  mode?: string;
}

export async function createWorkflow(params: CreateWorkflowParams): Promise<{ id: string; status: string }> {
  return apiFetch<{ id: string; status: string }>('/api/workflows', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function getWorkflow(id: string): Promise<Workflow> {
  return apiFetch<Workflow>(`/api/workflows/${id}`);
}

export async function getWorkflows(): Promise<WorkflowListItem[]> {
  return apiFetch<WorkflowListItem[]>('/api/workflows');
}

export async function getWorkflowEvents(id: string): Promise<AuditEvent[]> {
  return apiFetch<AuditEvent[]>(`/api/workflows/${id}/events`);
}

export async function getMetrics(): Promise<DashboardMetrics> {
  return apiFetch<DashboardMetrics>('/api/metrics');
}
