import { apiFetch } from './client';
import { Approval } from './types';

export async function getApprovals(status?: 'PENDING' | 'APPROVED' | 'REJECTED'): Promise<Approval[]> {
  const query = status ? `?status=${encodeURIComponent(status)}` : '';
  return apiFetch<Approval[]>(`/api/approvals${query}`);
}

export async function approveWorkflow(
  workflowId: string,
  approvalId?: string,
  actor: string = 'USER'
): Promise<{ status: string; workflow_id: string }> {
  return apiFetch<{ status: string; workflow_id: string }>(`/api/workflows/${workflowId}/approve`, {
    method: 'POST',
    body: JSON.stringify({ approval_id: approvalId, actor }),
  });
}

export async function rejectWorkflow(
  workflowId: string,
  approvalId?: string,
  reason?: string
): Promise<{ status: string; workflow_id: string }> {
  return apiFetch<{ status: string; workflow_id: string }>(`/api/workflows/${workflowId}/reject`, {
    method: 'POST',
    body: JSON.stringify({ approval_id: approvalId, reason }),
  });
}
