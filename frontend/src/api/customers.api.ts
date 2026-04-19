import apiClient from './client';
import type { Customer, CreateCustomerRequest } from '../types';

function splitName(fullName?: string) {
  const parts = (fullName ?? '').trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] ?? '',
    lastName: parts.slice(1).join(' '),
  };
}

function mapCustomer(customer: any): Customer {
  const { firstName, lastName } = splitName(customer.name);
  return {
    id: customer.id,
    name: customer.name,
    firstName,
    lastName,
    email: customer.email,
    phone: customer.phone,
    address: customer.address,
    stage: customer.crmStage ?? 'Lead',
    lastContact: customer.lastContactAt,
    value: customer.dealValue != null ? Number(customer.dealValue) : 0,
    companyId: customer.company?.id,
    companyName: customer.company?.companyName ?? customer.company?.name,
    createdAt: customer.createdAt,
    updatedAt: customer.updatedAt,
  };
}

function toCustomerPayload(data: CreateCustomerRequest) {
  return {
    name: `${data.firstName} ${data.lastName}`.trim(),
    email: data.email,
    phone: data.phone,
    address: data.address,
    crmStage: data.stage ?? 'Lead',
    dealValue: data.value ?? 0,
    lastContactAt: data.lastContact ? (data.lastContact.includes('T') ? data.lastContact : `${data.lastContact}T00:00:00`) : undefined,
    company: { id: data.companyId ?? 1 },
  };
}

export const customersApi = {
  getAll: () =>
    apiClient.get<any[]>('/customers').then((r) => r.data.map(mapCustomer)),

  getById: (id: number) =>
    apiClient.get<any>(`/customers/${id}`).then((r) => mapCustomer(r.data)),

  search: (query: string) =>
    apiClient.get<any[]>('/customers/search', { params: { query } }).then((r) => r.data.map(mapCustomer)),

  create: (data: CreateCustomerRequest) =>
    apiClient.post<any>('/customers', toCustomerPayload(data)).then((r) => mapCustomer(r.data)),

  update: (id: number, data: Partial<CreateCustomerRequest>) =>
    apiClient.put<any>(`/customers/${id}`, toCustomerPayload(data as CreateCustomerRequest)).then((r) => mapCustomer(r.data)),

  delete: (id: number) =>
    apiClient.delete(`/customers/${id}`).then((r) => r.data),
};

