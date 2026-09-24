import { apiFetch } from './client';
import { Invoice, Customer } from './types';

export async function getInvoices(): Promise<Invoice[]> {
  return apiFetch<Invoice[]>('/api/invoices');
}

export async function getCustomers(): Promise<Customer[]> {
  return apiFetch<Customer[]>('/api/customers');
}
