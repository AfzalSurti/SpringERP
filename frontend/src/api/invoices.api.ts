import apiClient from './client';
import type { Invoice, CreateInvoiceRequest, InvoiceStatus, PageResponse } from '../types';

function toDateTimeString(value?: string) {
  if (!value) {
    return undefined;
  }
  return value.includes('T') ? value : `${value}T00:00:00`;
}

function mapInvoice(invoice: any): Invoice {
  return {
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    customerId: invoice.customerId,
    customerName: invoice.customerName,
    invoiceDate: invoice.invoiceDate,
    dueDate: invoice.dueDate,
    status: invoice.status,
    subtotal: invoice.subtotal,
    taxAmount: invoice.taxAmount,
    totalAmount: invoice.totalAmount,
    billingAddress: invoice.billingAddress,
    shippingAddress: invoice.shippingAddress,
    paymentTerms: invoice.paymentTerms,
    notes: invoice.notes,
    items: (invoice.items ?? []).map((item: any) => ({
      id: item.id,
      productId: item.productId,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
    })),
    createdAt: invoice.createdAt,
    updatedAt: invoice.updatedAt,
  };
}

function toInvoicePayload(data: CreateInvoiceRequest | Partial<CreateInvoiceRequest>) {
  return {
    customerId: data.customerId,
    invoiceDate: toDateTimeString(data.invoiceDate),
    dueDate: toDateTimeString(data.dueDate),
    status: data.status,
    billingAddress: data.billingAddress,
    shippingAddress: data.shippingAddress,
    paymentTerms: data.paymentTerms,
    notes: data.notes,
    items: data.items?.map((item) => ({
      productId: item.productId,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
    })),
  };
}

export const invoicesApi = {
  getAll: (page = 0, size = 10, sortBy = 'id') =>
    apiClient
      .get<PageResponse<any>>('/invoices', { params: { page, size, sortBy } })
      .then((r) => ({ ...r.data, content: r.data.content.map(mapInvoice) })),

  getById: (id: number) =>
    apiClient.get<any>(`/invoices/${id}`).then((r) => mapInvoice(r.data)),

  getByStatus: (status: InvoiceStatus) =>
    apiClient.get<any[]>(`/invoices/status/${status}`).then((r) => r.data.map(mapInvoice)),

  create: (data: CreateInvoiceRequest) =>
    apiClient.post<any>('/invoices', toInvoicePayload(data)).then((r) => mapInvoice(r.data)),

  update: (id: number, data: Partial<CreateInvoiceRequest>) =>
    apiClient.put<any>(`/invoices/${id}`, toInvoicePayload(data)).then((r) => mapInvoice(r.data)),

  delete: (id: number) =>
    apiClient.delete(`/invoices/${id}`).then((r) => r.data),
};

