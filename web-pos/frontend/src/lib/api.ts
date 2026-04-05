/**
 * API client for the Spring Boot backend.
 * JWT token is automatically read from useAuthStore and injected into every request.
 */

import type {
  Category,
  MenuItem,
  Table,
  TableArea,
  TableStatus,
  Order,
  OrderItem,
  ClockRecord,
  DailyReport,
  UserProfile,
  Payment,
  PaymentMethod,
  SelectedMod,
} from './types'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'
const API = `${BASE_URL}/api/v1`

// ---------------------------------------------------------------------------
// Core fetch wrapper
// ---------------------------------------------------------------------------

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public body?: unknown,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/** Read JWT token from the Zustand store without creating a hook dependency. */
function getToken(): string | null {
  // Dynamic require avoids circular-import issues at module init time.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { useAuthStore } = require('@/store/useAuthStore') as {
    useAuthStore: { getState: () => { token: string | null } }
  }
  return useAuthStore.getState().token
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  skipAuth = false,
): Promise<T> {
  const token = skipAuth ? null : getToken()

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${API}${path}`, { ...options, headers })

  if (!res.ok) {
    let message = `HTTP ${res.status}`
    let body: unknown
    try {
      body = await res.json()
      message = (body as { message?: string })?.message ?? message
    } catch {
      // body is not JSON
    }
    throw new ApiError(message, res.status, body)
  }

  if (res.status === 204) return undefined as unknown as T

  return res.json() as Promise<T>
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
  refreshToken?: string
  user: UserProfile
}

export const authApi = {
  login: (email: string, password: string) =>
    apiFetch<LoginResponse>(
      '/auth/login',
      { method: 'POST', body: JSON.stringify({ email, password } satisfies LoginRequest) },
      true,
    ),

  logout: () => apiFetch<void>('/auth/logout', { method: 'POST' }),

  refreshToken: (refreshToken: string) =>
    apiFetch<LoginResponse>(
      '/auth/refresh',
      { method: 'POST', body: JSON.stringify({ refreshToken }) },
      true,
    ),

  me: () => apiFetch<UserProfile>('/auth/me'),
}

// ---------------------------------------------------------------------------
// Menu
// ---------------------------------------------------------------------------

export interface CategoryRequest {
  name: string
  sortOrder?: number
  isVisible?: boolean
}

export interface MenuItemRequest {
  categoryId: string
  name: string
  description?: string
  price: number
  cost?: number
  imageUrl?: string
  status?: string
  sortOrder?: number
}

export const menuApi = {
  getCategories: () => apiFetch<Category[]>('/menu/categories'),

  createCategory: (data: CategoryRequest) =>
    apiFetch<Category>('/menu/categories', { method: 'POST', body: JSON.stringify(data) }),

  updateCategory: (id: string, data: Partial<CategoryRequest>) =>
    apiFetch<Category>(`/menu/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  deleteCategory: (id: string) =>
    apiFetch<void>(`/menu/categories/${id}`, { method: 'DELETE' }),

  getItems: (categoryId?: string) => {
    const qs = categoryId ? `?categoryId=${categoryId}` : ''
    return apiFetch<MenuItem[]>(`/menu/items${qs}`)
  },

  getItem: (id: string) => apiFetch<MenuItem>(`/menu/items/${id}`),

  createItem: (data: MenuItemRequest) =>
    apiFetch<MenuItem>('/menu/items', { method: 'POST', body: JSON.stringify(data) }),

  updateItem: (id: string, data: Partial<MenuItemRequest>) =>
    apiFetch<MenuItem>(`/menu/items/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  deleteItem: (id: string) => apiFetch<void>(`/menu/items/${id}`, { method: 'DELETE' }),
}

// ---------------------------------------------------------------------------
// Tables
// ---------------------------------------------------------------------------

export interface TableAreaRequest {
  name: string
  sortOrder?: number
}

export interface TableRequest {
  areaId: string
  name: string
  capacity: number
}

export const tableApi = {
  getAreas: () => apiFetch<TableArea[]>('/tables/areas'),

  createArea: (data: TableAreaRequest) =>
    apiFetch<TableArea>('/tables/areas', { method: 'POST', body: JSON.stringify(data) }),

  updateArea: (id: string, data: Partial<TableAreaRequest>) =>
    apiFetch<TableArea>(`/tables/areas/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  deleteArea: (id: string) => apiFetch<void>(`/tables/areas/${id}`, { method: 'DELETE' }),

  getTables: (areaId?: string) => {
    const qs = areaId ? `?areaId=${areaId}` : ''
    return apiFetch<Table[]>(`/tables${qs}`)
  },

  createTable: (data: TableRequest) =>
    apiFetch<Table>('/tables', { method: 'POST', body: JSON.stringify(data) }),

  updateTable: (id: string, data: Partial<TableRequest>) =>
    apiFetch<Table>(`/tables/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  updateTableStatus: (id: string, status: TableStatus) =>
    apiFetch<Table>(`/tables/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  deleteTable: (id: string) => apiFetch<void>(`/tables/${id}`, { method: 'DELETE' }),
}

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

export interface CreateOrderRequest {
  tableId: string
  guestCount: number
  items: {
    menuItemId: string
    quantity: number
    note?: string
    mods: SelectedMod[]
  }[]
}

export interface AddOrderItemRequest {
  menuItemId: string
  quantity: number
  note?: string
  mods: SelectedMod[]
}

export interface CheckoutRequest {
  paymentMethod: PaymentMethod
  amountPaid: number
  discountAmount?: number
  discountPercent?: number
  referenceNo?: string
}

export const orderApi = {
  getActive: () => apiFetch<Order[]>('/orders/active'),

  getKitchenQueue: () => apiFetch<Order[]>('/orders/kitchen'),

  getOrder: (id: string) => apiFetch<Order>(`/orders/${id}`),

  createOrder: (data: CreateOrderRequest) =>
    apiFetch<Order>('/orders', { method: 'POST', body: JSON.stringify(data) }),

  addItem: (orderId: string, data: AddOrderItemRequest) =>
    apiFetch<OrderItem>(`/orders/${orderId}/items`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  removeItem: (orderId: string, itemId: string) =>
    apiFetch<void>(`/orders/${orderId}/items/${itemId}`, { method: 'DELETE' }),

  updateItemQuantity: (orderId: string, itemId: string, quantity: number) =>
    apiFetch<OrderItem>(`/orders/${orderId}/items/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify({ quantity }),
    }),

  checkout: (orderId: string, data: CheckoutRequest) =>
    apiFetch<Payment>(`/orders/${orderId}/checkout`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  markItemComplete: (orderId: string, itemId: string) =>
    apiFetch<void>(`/orders/${orderId}/items/${itemId}/complete`, { method: 'PATCH' }),

  cancelOrder: (orderId: string) =>
    apiFetch<void>(`/orders/${orderId}/cancel`, { method: 'POST' }),
}

// ---------------------------------------------------------------------------
// Staff
// ---------------------------------------------------------------------------

export interface StaffRequest {
  email: string
  name: string
  role: string
  pin?: string
  hourlyWage?: number
  phone?: string
  employeeId?: string
  hireDate?: string
  password?: string
}

export const staffApi = {
  getAll: () => apiFetch<UserProfile[]>('/staff'),

  create: (data: StaffRequest) =>
    apiFetch<UserProfile>('/staff', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: string, data: Partial<StaffRequest>) =>
    apiFetch<UserProfile>(`/staff/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  disable: (id: string) => apiFetch<void>(`/staff/${id}/disable`, { method: 'PATCH' }),
}

// ---------------------------------------------------------------------------
// Clock
// ---------------------------------------------------------------------------

export interface ClockPinRequest {
  staffId?: string
  pin: string
}

export interface ClockRecordFilters {
  staffId?: string
  startDate?: string
  endDate?: string
}

export interface UpdateClockRecordRequest {
  clockIn?: string
  clockOut?: string
  note?: string
}

export const clockApi = {
  clockIn: (staffId: string, pin: string) =>
    apiFetch<ClockRecord>('/clock/in', {
      method: 'POST',
      body: JSON.stringify({ staffId, pin }),
    }),

  clockOut: (staffId: string, pin: string) =>
    apiFetch<ClockRecord>('/clock/out', {
      method: 'POST',
      body: JSON.stringify({ staffId, pin }),
    }),

  lookupByPin: (pin: string) =>
    apiFetch<UserProfile>('/clock/lookup', {
      method: 'POST',
      body: JSON.stringify({ pin }),
    }),

  getRecords: (filters: ClockRecordFilters = {}) => {
    const params = new URLSearchParams()
    if (filters.staffId) params.set('staffId', filters.staffId)
    if (filters.startDate) params.set('startDate', filters.startDate)
    if (filters.endDate) params.set('endDate', filters.endDate)
    const qs = params.toString() ? `?${params}` : ''
    return apiFetch<ClockRecord[]>(`/clock/records${qs}`)
  },

  updateRecord: (id: string, data: UpdateClockRecordRequest) =>
    apiFetch<ClockRecord>(`/clock/records/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  getCurrentStatus: () =>
    apiFetch<{ isClockedIn: boolean; record?: ClockRecord }>('/clock/status'),
}

// ---------------------------------------------------------------------------
// Reports
// ---------------------------------------------------------------------------

export interface ItemSalesReport {
  menuItemId: string
  name: string
  quantitySold: number
  totalRevenue: number
}

export interface StaffReportEntry {
  userId: string
  name: string
  totalHours: number
  totalWage: number
  records: ClockRecord[]
}

export const reportApi = {
  getDaily: (date: string) => apiFetch<DailyReport>(`/reports/daily?date=${date}`),

  getItemSales: (startDate: string, endDate: string) =>
    apiFetch<ItemSalesReport[]>(`/reports/items?startDate=${startDate}&endDate=${endDate}`),

  getStaffReport: (staffId: string, startDate: string, endDate: string) =>
    apiFetch<StaffReportEntry>(
      `/reports/staff/${staffId}?startDate=${startDate}&endDate=${endDate}`,
    ),

  settle: (date: string) =>
    apiFetch<DailyReport>('/reports/daily/settle', {
      method: 'POST',
      body: JSON.stringify({ date }),
    }),

  exportCsv: async (date: string): Promise<Blob> => {
    const token = getToken()
    const res = await fetch(`${API}/reports/export?date=${date}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    if (!res.ok) throw new ApiError(`HTTP ${res.status}`, res.status)
    return res.blob()
  },
}
