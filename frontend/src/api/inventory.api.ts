import apiClient from './client';
import type { PageResponse } from '../types';

export interface InventoryItem {
  id: number;
  sku: string;
  productId?: number;
  productName?: string;
  warehouseId?: number;
  warehouseName?: string;
  quantityOnHand: number;
  quantityReserved: number;
  quantityAvailable: number;
  reorderLevel: number;
  reorderQuantity: number;
  unitCost?: number;
  location?: string;
  isActive?: boolean;
  lastMovementDate?: string;
}

export interface StockMovement {
  id: number;
  inventoryItemId: number;
  sku?: string;
  movementType: 'PURCHASE' | 'SALE' | 'ADJUSTMENT' | 'TRANSFER' | 'RETURN' | 'DAMAGE';
  quantityMoved: number;
  reason?: string;
  notes?: string;
  status: 'PENDING' | 'APPROVED' | 'POSTED' | 'REJECTED';
  movementDate?: string;
  approvedBy?: number;
}

export interface Warehouse {
  id: number;
  warehouseCode: string;
  warehouseName: string;
  address?: string;
  city?: string;
  isActive?: boolean;
}

function mapInventoryItem(item: any): InventoryItem {
  return {
    id: item.id,
    sku: item.sku,
    productId: item.product?.id,
    productName: item.product?.name,
    warehouseId: item.warehouseId,
    quantityOnHand: item.quantityOnHand ?? 0,
    quantityReserved: item.quantityReserved ?? 0,
    quantityAvailable: item.quantityAvailable ?? 0,
    reorderLevel: item.reorderLevel ?? 0,
    reorderQuantity: item.reorderQuantity ?? 0,
    unitCost: item.unitCost != null ? Number(item.unitCost) : undefined,
    location: item.location,
    isActive: item.isActive,
    lastMovementDate: item.lastMovementDate,
  };
}

function toInventoryPayload(data: Partial<InventoryItem>) {
  return {
    sku: data.sku,
    product: data.productId ? { id: data.productId } : undefined,
    warehouseId: data.warehouseId,
    quantityOnHand: data.quantityOnHand ?? 0,
    quantityReserved: data.quantityReserved ?? 0,
    reorderLevel: data.reorderLevel ?? 10,
    reorderQuantity: data.reorderQuantity ?? 50,
    unitCost: data.unitCost,
    location: data.location,
  };
}

function mapWarehouse(warehouse: any): Warehouse {
  return {
    id: warehouse.id,
    warehouseCode: warehouse.warehouseCode,
    warehouseName: warehouse.warehouseName,
    address: warehouse.address,
    city: warehouse.city,
    isActive: warehouse.isActive,
  };
}

export const inventoryApi = {
  // Inventory Items
  getItems: (page = 0, size = 20) =>
    apiClient.get<PageResponse<any>>('/inventory/items', { params: { page, size } }).then((r) => ({
      ...r.data,
      content: r.data.content.map(mapInventoryItem),
    })),

  getItemById: (id: number) =>
    apiClient.get<any>(`/inventory/items/${id}`).then((r) => mapInventoryItem(r.data)),

  getItemBySku: (sku: string) =>
    apiClient.get<any>(`/inventory/items/sku/${sku}`).then((r) => mapInventoryItem(r.data)),

  getLowStockItems: () =>
    apiClient.get<any[]>('/inventory/items/low-stock').then((r) => r.data.map(mapInventoryItem)),

  getCriticalStockItems: () =>
    apiClient.get<any[]>('/inventory/items/critical-stock').then((r) => r.data.map(mapInventoryItem)),

  createItem: (data: Partial<InventoryItem>) =>
    apiClient.post<any>('/inventory/items', toInventoryPayload(data)).then((r) => mapInventoryItem(r.data)),

  updateItem: (id: number, data: Partial<InventoryItem>) =>
    apiClient.put<any>(`/inventory/items/${id}`, toInventoryPayload(data)).then((r) => mapInventoryItem(r.data)),

  deleteItem: (id: number) =>
    apiClient.delete(`/inventory/items/${id}`).then((r) => r.data),

  // Stock Movements
  getMovements: (page = 0, size = 20) =>
    apiClient.get<PageResponse<StockMovement>>('/inventory/movements', { params: { page, size } }).then((r) => r.data),

  recordMovement: (data: Partial<StockMovement>) =>
    apiClient.post<StockMovement>('/inventory/movements', data).then((r) => r.data),

  approveMovement: (id: number, approverId: number) =>
    apiClient.put<StockMovement>(`/inventory/movements/${id}/approve`, null, { params: { approverId } }).then((r) => r.data),

  rejectMovement: (id: number, reason: string) =>
    apiClient.put<StockMovement>(`/inventory/movements/${id}/reject`, null, { params: { reason } }).then((r) => r.data),

  adjustStock: (inventoryItemId: number, quantityChange: number, reason: string) =>
    apiClient.post<StockMovement>(`/inventory/items/${inventoryItemId}/adjust`, null, {
      params: { quantityChange, reason },
    }).then((r) => r.data),

  // Warehouses
  getWarehouses: (page = 0, size = 20) =>
    apiClient.get<PageResponse<any>>('/inventory/warehouses', { params: { page, size } }).then((r) => ({
      ...r.data,
      content: r.data.content.map(mapWarehouse),
    })),

  createWarehouse: (data: Partial<Warehouse>) =>
    apiClient.post<Warehouse>('/inventory/warehouses', data).then((r) => r.data),

  // Stock Levels
  getAvailableStock: (inventoryItemId: number) =>
    apiClient.get<number>(`/inventory/items/${inventoryItemId}/available`).then((r) => r.data),
};

