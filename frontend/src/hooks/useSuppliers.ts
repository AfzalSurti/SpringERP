import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { suppliersApi } from '../api/suppliers.api';
import type { CreateSupplierRequest } from '../types';
import { getApiErrorMessage } from '../utils/apiError';

export const SUPPLIERS_KEY = 'suppliers';

export function useSuppliers() {
  return useQuery({ queryKey: [SUPPLIERS_KEY], queryFn: suppliersApi.getAll });
}

export function useSupplier(id: number) {
  return useQuery({
    queryKey: [SUPPLIERS_KEY, id],
    queryFn: () => suppliersApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSupplierRequest) => suppliersApi.create(data),
    onSuccess: (createdSupplier) => {
      qc.setQueryData([SUPPLIERS_KEY], (current: any) =>
        Array.isArray(current) ? [createdSupplier, ...current] : [createdSupplier]
      );
      qc.invalidateQueries({ queryKey: [SUPPLIERS_KEY] });
      toast.success('Supplier created successfully');
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Failed to create supplier')),
  });
}

export function useUpdateSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateSupplierRequest> }) =>
      suppliersApi.update(id, data),
    onSuccess: (updatedSupplier) => {
      qc.setQueryData([SUPPLIERS_KEY], (current: any) =>
        Array.isArray(current)
          ? current.map((supplier) => (supplier.id === updatedSupplier.id ? updatedSupplier : supplier))
          : current
      );
      qc.invalidateQueries({ queryKey: [SUPPLIERS_KEY] });
      toast.success('Supplier updated successfully');
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Failed to update supplier')),
  });
}

export function useDeleteSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => suppliersApi.delete(id),
    onSuccess: (_, deletedId) => {
      qc.setQueryData([SUPPLIERS_KEY], (current: any) =>
        Array.isArray(current) ? current.filter((supplier) => supplier.id !== deletedId) : current
      );
      qc.invalidateQueries({ queryKey: [SUPPLIERS_KEY] });
      toast.success('Supplier deleted successfully');
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Failed to delete supplier')),
  });
}

