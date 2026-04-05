// ─── Enums ────────────────────────────────────────────────────────────────────

export enum UserRole {
  OWNER   = 'OWNER',
  MANAGER = 'MANAGER',
  STAFF   = 'STAFF',
  KITCHEN = 'KITCHEN',
}

export enum TableStatus {
  EMPTY    = 'EMPTY',
  OCCUPIED = 'OCCUPIED',
  CLEANING = 'CLEANING',
}

export enum MenuItemStatus {
  ACTIVE   = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SOLD_OUT = 'SOLD_OUT',
}

export enum OrderStatus {
  OPEN      = 'OPEN',
  CLOSED    = 'CLOSED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentMethod {
  CASH        = 'CASH',
  CREDIT_CARD = 'CREDIT_CARD',
  LINE_PAY    = 'LINE_PAY',
  JKOPAY      = 'JKOPAY',
  OTHER       = 'OTHER',
}

// ─── Core Entities ────────────────────────────────────────────────────────────

export interface Store {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  currency: string;       // e.g. "TWD"
  timezone: string;       // e.g. "Asia/Taipei"
  taxRate: number;        // decimal, e.g. 0.05 for 5%
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: string;             // matches Supabase auth.users.id
  storeId: string;
  email: string;
  name: string;
  role: UserRole;
  pin?: string;           // 4-6 digit PIN for clock in/out
  hourlyWage?: number;    // in store currency units
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  storeId: string;
  name: string;
  sortOrder: number;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MenuItem {
  id: string;
  storeId: string;
  categoryId: string;
  category?: Category;
  name: string;
  description?: string;
  price: number;          // in cents / smallest currency unit
  imageUrl?: string;
  status: MenuItemStatus;
  sortOrder: number;
  modifiers?: Modifier[];
  createdAt: string;
  updatedAt: string;
}

export interface Modifier {
  id: string;
  menuItemId: string;
  name: string;           // e.g. "Temperature", "Size"
  required: boolean;
  isRequired?: boolean;   // alias
  multiSelect: boolean;
  isMultiple?: boolean;   // alias
  sortOrder: number;
  options?: ModifierOption[];
  createdAt: string;
  updatedAt: string;
}

export interface ModifierOption {
  id: string;
  modifierId: string;
  name: string;           // e.g. "Hot", "Iced", "Large"
  priceAdjustment: number; // in cents, can be negative
  additionalPrice?: number; // alias
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TableArea {
  id: string;
  storeId: string;
  name: string;           // e.g. "室內", "戶外"
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Table {
  id: string;
  storeId: string;
  areaId: string;
  area?: TableArea;
  name: string;           // e.g. "A1", "B3"
  capacity: number;
  status: TableStatus;
  currentOrderId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: string;
  storeId: string;
  tableId: string;
  tableNumber?: string;   // denormalized for display
  table?: Table;
  staffId: string;
  staff?: UserProfile;
  status: OrderStatus;
  guestCount: number;
  paxCount?: number;      // alias used by some API responses
  subtotal: number;       // in cents
  taxAmount: number;      // in cents
  discountAmount: number; // in cents
  total: number;          // in cents
  totalAmount?: number;   // alias used by some API responses
  note?: string;
  items?: OrderItem[];
  payment?: Payment;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  menuItemId: string;
  menuItem?: MenuItem;
  name: string;           // snapshot of item name at time of order
  menuItemName?: string;  // alias used by some API responses
  price: number;          // snapshot of item price at time of order (cents)
  unitPrice?: number;     // alias used by some API responses
  quantity: number;
  note?: string;
  mods: OrderItemMod[];
  subtotal: number;       // (price + mod adjustments) * quantity, in cents
  isCompleted?: boolean;  // used by kitchen display
  createdAt: string;
}

export interface OrderItemMod {
  id: string;
  orderItemId: string;
  modifierId: string;
  modifierName: string;   // snapshot
  optionId: string;
  optionName: string;     // snapshot
  priceAdjustment: number; // snapshot, in cents
}

export interface Payment {
  id: string;
  orderId: string;
  method: PaymentMethod;
  amount: number;         // actual amount paid, in cents
  change: number;         // cash change, in cents (0 for non-cash)
  referenceNo?: string;   // card/e-wallet transaction reference
  processedAt: string;
  processedById: string;
}

export interface ClockRecord {
  id: string;
  storeId: string;
  userId: string;
  user?: UserProfile;
  clockIn: string;        // ISO datetime
  clockOut?: string;      // ISO datetime, null if still clocked in
  hoursWorked?: number;   // calculated on clock out
  wageEarned?: number;    // calculated on clock out, in cents
  date: string;           // YYYY-MM-DD, for easy querying
  createdAt: string;
  updatedAt: string;
}

export interface DailyReport {
  id: string;
  storeId: string;
  date: string;           // YYYY-MM-DD
  totalOrders: number;
  totalRevenue: number;   // in cents
  totalTax: number;       // in cents
  totalDiscount: number;  // in cents
  cashRevenue: number;    // in cents
  cardRevenue: number;    // in cents
  otherRevenue: number;   // in cents
  averageOrderValue: number; // in cents
  generatedAt: string;
  generatedById: string;
}

// ─── API / UI Helpers ─────────────────────────────────────────────────────────

/** Lightweight cart item used in the POS order store */
export interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  selectedMods: SelectedMod[];
  note?: string;
  subtotal: number;
}

export interface SelectedMod {
  modifierId: string;
  modifierName: string;
  optionId: string;
  optionName: string;
  priceAdjustment: number;
}

/** Shape of the JWT payload decoded from Supabase/backend token */
export interface JwtPayload {
  sub: string;            // user id
  email: string;
  role: UserRole;
  storeId: string;
  exp: number;
}

/** Generic paginated response wrapper */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

/** API error shape */
export interface ApiError {
  message: string;
  statusCode: number;
  errors?: Record<string, string[]>;
}
