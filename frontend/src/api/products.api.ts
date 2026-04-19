import apiClient from './client';
import type { Product, CreateProductRequest } from '../types';

function mapProduct(product: any): Product {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    price: product.price,
    stock: product.stock,
    stockQuantity: product.stock,
    category: product.category,
    categoryName: product.category?.name,
  };
}

function toProductPayload(data: Partial<CreateProductRequest>) {
  return {
    name: data.name,
    description: data.description && data.description.trim().length >= 5 ? data.description : 'General product',
    price: data.price,
    stock: data.stock ?? data.stockQuantity ?? 0,
    category: { id: data.categoryId ?? 1 },
  };
}

export const productsApi = {
  getAll: () =>
    apiClient.get<any[]>('/products').then((r) => r.data.map(mapProduct)),

  getById: (id: number) =>
    apiClient.get<any>(`/products/${id}`).then((r) => mapProduct(r.data)),

  create: (data: CreateProductRequest) =>
    apiClient.post<any>('/products', toProductPayload(data)).then((r) => mapProduct(r.data)),

  update: (id: number, data: Partial<CreateProductRequest>) =>
    apiClient.put<any>(`/products/${id}`, toProductPayload(data)).then((r) => mapProduct(r.data)),

  delete: (id: number) =>
    apiClient.delete(`/products/${id}`).then((r) => r.data),
};

