// Centralized order utilities and constants
// Single source of truth for order calculations, formatting, and styling

// ============= CONSTANTS =============
export const TAX_RATE = 0.0735; // 7.35%
export const SERVICE_CHARGE_RATE = 0.05; // 5%
export const DISCOUNT_THRESHOLD = 50; // $50 minimum for discount
export const DISCOUNT_AMOUNT = 5.00; // $5 discount

// ============= FORMATTING =============
export const formatPrice = (price: number): string => `$${price.toFixed(2)}`;

// Format table ID (T2 -> Table 2, or just "2" -> "Table 2")
export const formatTableName = (tableId: string): string => {
  if (!tableId) return tableId;
  // If it starts with T, replace T with "Table "
  if (/^T/i.test(tableId)) {
    return tableId.replace(/^T/i, 'Table ');
  }
  // If it's just a number, prepend "Table "
  if (/^\d+$/.test(tableId)) {
    return `Table ${tableId}`;
  }
  return tableId;
};

export const formatPriceWithSign = (price: number, showPositive = false): string => {
  if (price === 0) return '$0.00';
  if (price < 0) return `-$${Math.abs(price).toFixed(2)}`;
  return showPositive ? `+$${price.toFixed(2)}` : `$${price.toFixed(2)}`;
};

// ============= STATUS COLORS =============
export const getOrderStatusColor = (status: string): string => {
  switch (status.toUpperCase()) {
    case 'ORDERING': return 'text-red-500';
    case 'ORDERED': return 'text-orange-500';
    case 'PREPARING': return 'text-yellow-500';
    case 'COMPLETED': return 'text-green-500';
    case 'PAID': return 'text-green-500';
    case 'UNPAID': return 'text-red-400';
    default: return 'text-white/60';
  }
};

// ============= CALCULATIONS =============
export interface OrderTotals {
  subtotal: number;
  discount: number;
  serviceCharge: number;
  tax: number;
  tip: number;
  total: number;
}

export interface CalculableItem {
  qty: number;
  price: number;
}

export const calculateOrderTotals = (
  items: CalculableItem[], 
  tipAmount: number = 0
): OrderTotals => {
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const discount = subtotal > DISCOUNT_THRESHOLD ? DISCOUNT_AMOUNT : 0;
  const serviceCharge = subtotal * SERVICE_CHARGE_RATE;
  const tax = (subtotal - discount) * TAX_RATE;
  const total = subtotal - discount + serviceCharge + tax + tipAmount;
  
  return { 
    subtotal, 
    discount, 
    serviceCharge, 
    tax, 
    tip: tipAmount,
    total 
  };
};

// Calculate totals from price strings (for backward compatibility)
export const calculateTotalsFromPriceStrings = (
  items: { qty: number; price: string }[],
  tipAmount: number = 0
): OrderTotals => {
  const convertedItems = items.map(item => ({
    qty: item.qty,
    price: parseFloat(item.price.replace('$', '')) / item.qty
  }));
  return calculateOrderTotals(convertedItems, tipAmount);
};

// ============= TABLE ORDER VALIDATION =============

// Active order statuses (non-paid, non-completed)
const ACTIVE_STATUSES = ['ORDERING', 'ORDERED', 'PREPARING', 'UNPAID', 'SEATED', '1ST COURSE', '2ND COURSE', '3RD COURSE', 'DESSERT', 'SERVED'];

export interface ActiveOrderInfo {
  id: string;
  name: string;
  phone: string;
  table: string;
  status: string;
  partySize: number;
}

// Check if an order status is considered "active" (not paid/completed)
export const isActiveOrderStatus = (status: string): boolean => {
  const normalizedStatus = status.toUpperCase().replace(/\s+/g, ' ').trim();
  return ACTIVE_STATUSES.includes(normalizedStatus) || 
         (!['PAID', 'COMPLETED', 'MERGED'].includes(normalizedStatus));
};

// Normalize phone number for comparison (remove all non-digits)
export const normalizePhone = (phone: string): string => {
  return phone.replace(/\D/g, '');
};

// Normalize name for comparison (lowercase, trim)
export const normalizeName = (name: string): string => {
  return name.toLowerCase().trim();
};

// Check if customer details match between two records
export const doCustomerDetailsMatch = (
  order: { name: string; phone: string }, 
  customer: { name: string; phone: string }
): boolean => {
  // If both have phone numbers, compare them
  const orderPhone = normalizePhone(order.phone);
  const customerPhone = normalizePhone(customer.phone);
  
  if (orderPhone && customerPhone) {
    return orderPhone === customerPhone;
  }
  
  // If no phone numbers, compare names
  return normalizeName(order.name) === normalizeName(customer.name);
};

// Validation result for creating new orders on a table
export interface TableOrderValidation {
  allowed: boolean;
  existingOrder?: ActiveOrderInfo;
  reason?: string;
}

// Validate if a new order can be created for a table
// This function needs the orders array passed in to avoid circular dependency
export const validateNewOrderForTable = (
  tableId: string,
  customerName: string,
  customerPhone: string,
  activeOrders: ActiveOrderInfo[]
): TableOrderValidation => {
  // Filter active orders for this table
  const tableActiveOrders = activeOrders.filter(order => {
    const orderTableId = order.table.replace(/^T/i, '');
    const targetTableId = tableId.replace(/^T/i, '');
    return orderTableId === targetTableId;
  });
  
  if (tableActiveOrders.length === 0) {
    return { allowed: true };
  }
  
  // Check if customer matches existing active orders
  const matchesExisting = tableActiveOrders.some(order => 
    doCustomerDetailsMatch(order, { name: customerName, phone: customerPhone })
  );
  
  if (matchesExisting) {
    return { allowed: true };
  }
  
  // Return the first active order as reference
  const existingOrder = tableActiveOrders[0];
  return {
    allowed: false,
    existingOrder,
    reason: `Table ${formatTableName(tableId)} already has an active order for ${existingOrder.name}. Use the same customer details or complete the existing order first.`
  };
};
