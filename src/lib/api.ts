// API Client for Cloudflare Pages Functions
// This provides typed access to the backend API

const API_BASE = '/api';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  count?: number;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
}

// Generic fetch wrapper with error handling
async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const { method = 'GET', body, headers = {} } = options;

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `HTTP ${response.status}`,
      };
    }

    return data;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

// ============================================
// ORDERS API
// ============================================

export interface Order {
  id: string;
  customer: string;
  items: OrderItem[];
  total: number;
  status: 'new' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  table?: string;
  createdAt: string;
}

export interface OrderItem {
  name: string;
  price: number;
  quantity: number;
  modifiers?: string[];
}

export const ordersApi = {
  // Get all orders
  list: () => apiRequest<Order[]>('/orders'),

  // Get a single order
  get: (id: string) => apiRequest<Order>(`/orders/${id}`),

  // Create a new order
  create: (order: Omit<Order, 'id' | 'createdAt' | 'status'>) =>
    apiRequest<Order>('/orders', { method: 'POST', body: order }),

  // Update order status
  updateStatus: (id: string, status: Order['status']) =>
    apiRequest<Order>(`/orders/${id}`, { method: 'PATCH', body: { status } }),

  // Delete/cancel an order
  delete: (id: string) =>
    apiRequest<void>(`/orders/${id}`, { method: 'DELETE' }),
};

// ============================================
// TABLES API
// ============================================

export interface Table {
  id: string;
  seats: number;
  status: string;
  time?: string;
  guests?: number;
}

export const tablesApi = {
  // Get all tables
  list: () => apiRequest<Table[]>('/tables'),

  // Update table status
  updateStatus: (tableId: string, status: string, guests?: number) =>
    apiRequest<Table>('/tables', {
      method: 'POST',
      body: { tableId, status, guests },
    }),
};

// ============================================
// HEALTH CHECK
// ============================================

export const healthApi = {
  check: () =>
    apiRequest<{ status: string; timestamp: string }>('/health'),
};

// ============================================
// USAGE EXAMPLES
// ============================================

/*
// In a React component:

import { ordersApi, tablesApi } from '@/lib/api';

// Fetch orders
const { data: orders, error } = await ordersApi.list();

// Create an order
const { data: newOrder } = await ordersApi.create({
  customer: 'John Doe',
  items: [{ name: 'Pizza', price: 15.99, quantity: 1 }],
  total: 15.99,
  table: 'T-5',
});

// Update order status
await ordersApi.updateStatus('4521', 'ready');

// Update table
await tablesApi.updateStatus('T-5', 'Ordering', 4);
*/
