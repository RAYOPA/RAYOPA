import { apiFetch } from './client';
import { Invoice, Customer } from './types';

export async function getInvoices(): Promise<Invoice[]> {
  return apiFetch<Invoice[]>('/api/invoices');
}

export async function getCustomers(): Promise<Customer[]> {
  return apiFetch<Customer[]>('/api/customers');
}

export async function getBenchmark(): Promise<any> {
  return apiFetch<any>('/api/benchmark');
}

export async function createCustomer(data: { name: string; email: string; phone?: string; status?: string; risk_level?: string; id?: string }): Promise<Customer> {
  return apiFetch<Customer>('/api/customers', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function createInvoice(data: { customer_id: string; amount: number; days_overdue?: number; status?: string }): Promise<Invoice> {
  return apiFetch<Invoice>('/api/invoices', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
