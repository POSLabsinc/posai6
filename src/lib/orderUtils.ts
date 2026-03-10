// Centralized order utilities and constants
// Single source of truth for order calculations, formatting, and styling

// ============= CONSTANTS =============
export const TAX_RATE = 0.0735; // 7.35% - default fallback
export const SERVICE_CHARGE_RATE = 0.05; // 5%
export const DISCOUNT_THRESHOLD = 50; // $50 minimum for discount
export const DISCOUNT_AMOUNT = 5.00; // $5 discount

// ============= DYNAMIC TAX RATE =============
// Reads active (non-archived) exclusive taxes from Settings > Taxes
// and sums their rates. Falls back to TAX_RATE if none configured.
export const getActiveTaxRate = (): number => {
  try {
    const raw = localStorage.getItem('taxes-settings');
    if (!raw) return TAX_RATE;
    const taxes: { amount: number; type: string; archived: boolean }[] = JSON.parse(raw);
    const activeTaxes = taxes.filter(t => !t.archived);
    if (activeTaxes.length === 0) return TAX_RATE;
    // Sum all active tax percentages and convert to decimal
    return activeTaxes.reduce((sum, t) => sum + (t.amount / 100), 0);
  } catch {
    return TAX_RATE;
  }
};

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
