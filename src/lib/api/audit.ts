import { apiFetch } from './client';
import { AuditEvent } from './types';

export async function getAllAuditEvents(workflowId?: string): Promise<AuditEvent[]> {
  const query = workflowId ? `?workflow_id=${encodeURIComponent(workflowId)}` : '';
  return apiFetch<AuditEvent[]>(`/api/audit${query}`);
}
