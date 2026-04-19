import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-toastify';
import {
  useInvoices,
  useCreateInvoice,
  useDeleteInvoice,
} from '../../hooks/useInvoices';
import { useCustomers } from '../../hooks/useCustomers';
import { useProducts } from '../../hooks/useProducts';
import { Table } from '../../components/common/Table';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Badge } from '../../components/common/Badge';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import type { Invoice, CreateInvoiceRequest, InvoiceItem, InvoiceStatus } from '../../types';

const invoiceSchema = z.object({
  customerId: z.coerce.number().min(1, 'Customer is required'),
  invoiceDate: z.string().min(1, 'Invoice date is required'),
  dueDate: z.string().optional(),
  billingAddress: z.string().optional(),
  shippingAddress: z.string().optional(),
  paymentTerms: z.string().optional(),
  notes: z.string().optional(),
});

type InvoiceFormData = z.infer<typeof invoiceSchema>;

const statusBadgeVariant = (status: InvoiceStatus) => {
  const map: Record<InvoiceStatus, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
    PAID: 'success',
    PENDING: 'warning',
    SENT: 'info',
    DRAFT: 'default',
    OVERDUE: 'danger',
    CANCELLED: 'default',
  };
  return map[status];
};

const PAGE_SIZE = 10;

export const InvoicesPage: React.FC = () => {
  const [page, setPage] = useState(0);
  const { data: invoicePage, isLoading } = useInvoices(page, PAGE_SIZE);
  const { data: customers } = useCustomers();
  const { data: products } = useProducts();
  const { mutate: createInvoice, isLoading: creating } = useCreateInvoice();
  const { mutate: deleteInvoice } = useDeleteInvoice();
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<number | ''>('');
  const [itemQuantity, setItemQuantity] = useState(1);
  const [itemUnitPrice, setItemUnitPrice] = useState<number>(0);

  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Invoice | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
  });

  const customerOptions = (customers ?? []).map((customer) => ({
    value: customer.id,
    label: customer.name ?? `${customer.firstName} ${customer.lastName}`.trim(),
  }));

  const productOptions = (products ?? []).map((product) => ({
    value: product.id,
    label: `${product.name} ($${product.price.toFixed(2)})`,
  }));

  const selectedProduct = products?.find((product) => product.id === selectedProductId);

  const openCreate = () => {
    reset({ invoiceDate: new Date().toISOString().split('T')[0], paymentTerms: 'Net 15' });
    setInvoiceItems([]);
    setSelectedProductId('');
    setItemQuantity(1);
    setItemUnitPrice(0);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setInvoiceItems([]);
    setSelectedProductId('');
    setItemQuantity(1);
    setItemUnitPrice(0);
    reset({});
  };

  const handleCustomerChange = (customerId: number) => {
    const customer = customers?.find((entry) => entry.id === customerId);
    if (!customer) {
      return;
    }
    setValue('billingAddress', customer.address ?? '');
    setValue('shippingAddress', customer.address ?? '');
  };

  const addInvoiceItem = () => {
    if (!selectedProduct || itemQuantity <= 0 || itemUnitPrice < 0) {
      toast.error('Select a product and enter a valid quantity and price');
      return;
    }

    setInvoiceItems((current) => [
      ...current,
      {
        productId: selectedProduct.id,
        description: selectedProduct.name,
        quantity: itemQuantity,
        unitPrice: itemUnitPrice,
        totalPrice: itemQuantity * itemUnitPrice,
      },
    ]);
    setSelectedProductId('');
    setItemQuantity(1);
    setItemUnitPrice(0);
  };

  const removeInvoiceItem = (index: number) => {
    setInvoiceItems((current) => current.filter((_, currentIndex) => currentIndex !== index));
  };

  const onSubmit = (data: InvoiceFormData) => {
    if (invoiceItems.length === 0) {
      toast.error('Add at least one invoice item');
      return;
    }

    createInvoice(
      {
        ...data,
        status: 'DRAFT',
        items: invoiceItems,
      } as CreateInvoiceRequest,
      { onSuccess: closeModal },
    );
  };

  const invoices = invoicePage?.content ?? [];
  const totalPages = invoicePage?.totalPages ?? 1;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Invoices</h2>
          <p className="text-sm text-gray-500">{invoicePage?.totalElements ?? 0} total records</p>
        </div>
        <Button onClick={openCreate} leftIcon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>}>
          Create Invoice
        </Button>
      </div>

      <Table<Invoice>
        isLoading={isLoading}
        data={invoices}
        keyExtractor={(i) => i.id}
        columns={[
          { key: 'invoiceNumber', header: 'Invoice #', render: (i) => <span className="font-mono font-medium text-gray-800">{i.invoiceNumber ?? `INV-${i.id}`}</span> },
          { key: 'customerName', header: 'Customer', render: (i) => i.customerName || '—' },
          { key: 'invoiceDate', header: 'Date', render: (i) => new Date(i.invoiceDate).toLocaleDateString() },
          { key: 'dueDate', header: 'Due Date', render: (i) => i.dueDate ? new Date(i.dueDate).toLocaleDateString() : '—' },
          { key: 'totalAmount', header: 'Amount', render: (i) => <span className="font-semibold">${(i.totalAmount ?? 0).toLocaleString()}</span> },
          { key: 'status', header: 'Status', render: (i) => <Badge label={i.status} variant={statusBadgeVariant(i.status)} /> },
          {
            key: 'actions', header: 'Actions',
            render: (i) => (
              <Button size="sm" variant="danger" onClick={() => setDeleteTarget(i)}>Delete</Button>
            ),
          },
        ]}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <Button size="sm" variant="secondary" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>← Prev</Button>
          <span className="text-sm text-gray-600">Page {page + 1} of {totalPages}</span>
          <Button size="sm" variant="secondary" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>Next →</Button>
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={closeModal} title="Create Invoice" size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Customer"
            placeholder="Select a customer"
            options={customerOptions}
            required
            error={errors.customerId?.message}
            {...register('customerId', {
              onChange: (event) => handleCustomerChange(Number(event.target.value)),
            })}
          />
          <Input label="Invoice Date" type="date" required error={errors.invoiceDate?.message} {...register('invoiceDate')} />
          <Input label="Due Date" type="date" {...register('dueDate')} />
          <Input label="Billing Address" {...register('billingAddress')} />
          <Input label="Shipping Address" {...register('shippingAddress')} />
          <Input label="Payment Terms" placeholder="Net 30..." {...register('paymentTerms')} />
          <div className="sm:col-span-2 rounded-lg border border-gray-200 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-800">Invoice Items</h3>
                <p className="text-xs text-gray-500">Select products already available in the system.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[2fr,1fr,1fr,auto]">
              <Select
                label="Product"
                placeholder="Choose a product"
                options={productOptions}
                value={selectedProductId}
                onChange={(event) => {
                  const productId = Number(event.target.value);
                  setSelectedProductId(productId);
                  const product = products?.find((entry) => entry.id === productId);
                  setItemUnitPrice(product?.price ?? 0);
                }}
              />
              <Input
                label="Quantity"
                type="number"
                min="1"
                value={itemQuantity}
                onChange={(event) => setItemQuantity(Number(event.target.value))}
              />
              <Input
                label="Unit Price"
                type="number"
                min="0"
                step="0.01"
                value={itemUnitPrice}
                onChange={(event) => setItemUnitPrice(Number(event.target.value))}
              />
              <div className="flex items-end">
                <Button type="button" onClick={addInvoiceItem}>Add Item</Button>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {invoiceItems.length === 0 ? (
                <p className="text-sm text-gray-500">No items added yet.</p>
              ) : (
                invoiceItems.map((item, index) => (
                  <div key={`${item.productId}-${index}`} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{item.description}</p>
                      <p className="text-xs text-gray-500">
                        Qty {item.quantity} x ${item.unitPrice.toFixed(2)} = ${(item.totalPrice ?? 0).toFixed(2)}
                      </p>
                    </div>
                    <Button type="button" size="sm" variant="danger" onClick={() => removeInvoiceItem(index)}>
                      Remove
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm font-medium text-gray-700">Notes</label>
            <textarea
              {...register('notes')}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>
          <div className="sm:col-span-2 flex justify-end gap-3 mt-2">
            <Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button>
            <Button type="submit" isLoading={creating}>Create Invoice</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Invoice"
        message={`Are you sure you want to delete invoice "${deleteTarget?.invoiceNumber ?? `INV-${deleteTarget?.id}`}"?`}
        confirmLabel="Delete"
        onConfirm={() => { deleteInvoice(deleteTarget!.id); setDeleteTarget(null); }}
        onCancel={() => setDeleteTarget(null)}
        isDangerous
      />
    </div>
  );
};

