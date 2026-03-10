// Centralized order data store with unified interfaces

// Import icons for order types
import dineInIcon from "@/assets/icons/dine-in.png";

// Re-export utilities from orderUtils for backward compatibility
export { 
  TAX_RATE,
  getActiveTaxRate,
  SERVICE_CHARGE_RATE, 
  DISCOUNT_THRESHOLD, 
  DISCOUNT_AMOUNT,
  formatPrice,
  formatPriceWithSign,
  formatTableName,
  getOrderStatusColor,
  calculateOrderTotals as calculateItemsTotals
} from "@/lib/orderUtils";

import { 
  TAX_RATE, 
  getActiveTaxRate,
  SERVICE_CHARGE_RATE, 
  DISCOUNT_THRESHOLD, 
  DISCOUNT_AMOUNT,
  formatTableName
} from "@/lib/orderUtils";

// Order item interface
export interface OrderItem {
  qty: number;
  name: string;
  price: number;
  seats: number[];
  modifiers: string[];
  isShared?: boolean;
}

// Merged order source info
export interface MergedOrderSource {
  orderId: string;
  orderName: string;
  table: string;
  items: OrderItem[];
}

// Payment method interface for multi-payment orders
export interface PaymentMethod {
  type: 'Visa' | 'Amex' | 'Mastercard' | 'Discover' | 'Cash' | 'Gift Card' | 'Other';
  lastFour?: string;
  amount: number;
}

// Order interface with all fields
export interface Order {
  id: string;
  name: string;
  phone: string;
  partySize: number;
  time: string;
  timer: string;
  server: string;
  check: string;
  paymentType: string;
  revenueCenter: string;
  status: string;
  notes: string;
  table: string;
  orderType: "Dine-In" | "Takeout" | "Delivery" | "Bar";
  items: OrderItem[];
  paidAmount?: string;
  paymentStatus?: string;
  tipAmount?: number;
  // Track merged orders for separate display
  mergedFrom?: MergedOrderSource[];
  // Track transferred orders for separate display
  transferredFrom?: MergedOrderSource[];
  // Multiple payment methods
  paymentMethods?: PaymentMethod[];
}

// 10 Complete orders with realistic food data
export const allOrders: Order[] = [
  // Order 1 - Martin Alex (T2) - ORDERING - Dine-In
  {
    id: "1",
    name: "Martin Alex",
    phone: "(415) 555-0123",
    partySize: 4,
    time: "8:00 PM",
    timer: "00:00",
    server: "Mia Jones",
    check: "--",
    paymentType: "--",
    revenueCenter: "FF Balcony",
    status: "ORDERING",
    notes: "Allergic to almonds, Don't add onion",
    table: "T2",
    orderType: "Dine-In",
    tipAmount: 8.50,
    items: [
      { qty: 2, name: "Classic Crispy Burger", price: 12.00, seats: [1, 2], modifiers: [] },
      { qty: 4, name: "Meatballs", price: 4.00, seats: [], modifiers: ["Extra Sauce"], isShared: true },
      { qty: 2, name: "Rigatoni Pasta", price: 8.00, seats: [3, 4], modifiers: [] },
      { qty: 1, name: "Almond Crusted Salmon", price: 20.00, seats: [], modifiers: ["- Salad", "- Balsamic Vinaigrette", "- Medium Rare", "+ W/ Potato Wedges"], isShared: true }
    ]
  },
  
  // Order 2 - Mike Wheelers (T2) - PAID - Takeout
  {
    id: "2",
    name: "Mike Wheelers",
    phone: "(415) 555-0456",
    partySize: 3,
    time: "7:30 PM",
    timer: "1:16 Hrs",
    server: "Dustin H",
    check: "123423",
    paymentType: "Cash",
    revenueCenter: "FF Balcony",
    status: "PAID",
    notes: "Birthday celebration - bring candle",
    table: "T2",
    orderType: "Takeout",
    paidAmount: "$128.47",
    paymentStatus: "Paid",
    tipAmount: 25.69,
    items: [
      { qty: 1, name: "New York Strip Steak", price: 28.00, seats: [1], modifiers: ["Medium Rare", "+ Garlic Butter"] },
      { qty: 1, name: "Grilled Salmon", price: 24.00, seats: [2], modifiers: ["No Lemon"] },
      { qty: 1, name: "Caesar Salad", price: 12.00, seats: [3], modifiers: ["Extra Croutons", "Dressing on Side"] },
      { qty: 3, name: "Glass of Red Wine", price: 9.00, seats: [], modifiers: [], isShared: true },
      { qty: 1, name: "Chocolate Lava Cake", price: 10.00, seats: [], modifiers: ["+ Extra Ice Cream"], isShared: true }
    ]
  },
  
  // Order 3 - Sarah Johnson (T6) - UNPAID - Dine-In
  {
    id: "3",
    name: "Sarah Johnson",
    phone: "(415) 555-0789",
    partySize: 2,
    time: "7:15 PM",
    timer: "1:45 Hrs",
    server: "Dustin H",
    check: "123443",
    paymentType: "--",
    revenueCenter: "FF Balcony",
    status: "UNPAID",
    notes: "Gluten-free options requested",
    table: "T6",
    orderType: "Dine-In",
    paidAmount: "$0.00",
    paymentStatus: "Un Paid",
    tipAmount: 15.00,
    items: [
      { qty: 2, name: "Margherita Pizza", price: 16.00, seats: [1, 2], modifiers: ["Gluten-Free Crust"] },
      { qty: 1, name: "Caprese Salad", price: 14.00, seats: [], modifiers: ["No Basil"], isShared: true },
      { qty: 2, name: "Tiramisu", price: 9.00, seats: [], modifiers: [], isShared: true },
      { qty: 2, name: "Espresso", price: 4.00, seats: [], modifiers: [], isShared: true }
    ]
  },
  
  // Order 4 - David Chen (T2) - COMPLETED - Dine-In - Multi-payment
  {
    id: "4",
    name: "David Chen",
    phone: "(415) 555-1234",
    partySize: 6,
    time: "6:45 PM",
    timer: "2:30 Hrs",
    server: "Mia Jones",
    check: "123456",
    paymentType: "Credit Card",
    revenueCenter: "Main Dining",
    status: "Completed",
    notes: "Corporate dinner - split bill 3 ways",
    table: "T2",
    orderType: "Dine-In",
    paidAmount: "$521.19",
    paymentStatus: "Paid",
    tipAmount: 104.24,
    paymentMethods: [
      { type: 'Visa', lastFour: '1234', amount: 300.00 },
      { type: 'Amex', lastFour: '9876', amount: 150.00 },
      { type: 'Cash', amount: 71.19 }
    ],
    items: [
      { qty: 2, name: "Lobster Tail", price: 45.00, seats: [1, 2], modifiers: ["Extra Butter"] },
      { qty: 2, name: "Filet Mignon", price: 42.00, seats: [3, 4], modifiers: ["Medium", "Peppercorn Sauce"] },
      { qty: 2, name: "Vegetable Risotto", price: 22.00, seats: [5, 6], modifiers: ["Extra Parmesan"] },
      { qty: 6, name: "House Salad", price: 8.00, seats: [], modifiers: [], isShared: true },
      { qty: 2, name: "Bottle of Champagne", price: 85.00, seats: [], modifiers: [], isShared: true },
      { qty: 6, name: "Cheesecake", price: 11.00, seats: [], modifiers: [], isShared: true }
    ]
  },
  
  // Order 5 - Guest (T7) - ORDERING - Bar
  {
    id: "5",
    name: "Guest",
    phone: "",
    partySize: 1,
    time: "8:30 PM",
    timer: "00:15",
    server: "Mia Jones",
    check: "--",
    paymentType: "--",
    revenueCenter: "Bar",
    status: "ORDERING",
    notes: "",
    table: "T7",
    orderType: "Bar",
    paidAmount: "$0.00",
    paymentStatus: "Un Paid",
    tipAmount: 5.00,
    items: [
      { qty: 1, name: "Classic Burger", price: 15.00, seats: [1], modifiers: ["No Pickles", "+ Bacon"] },
      { qty: 1, name: "Craft IPA", price: 8.00, seats: [], modifiers: [], isShared: true }
    ]
  },
  
  // Order 6 - Emily Wilson (T3) - ORDERING - Dine-In
  {
    id: "6",
    name: "Emily Wilson",
    phone: "(415) 555-2345",
    partySize: 2,
    time: "8:15 PM",
    timer: "00:20",
    server: "Alex M",
    check: "--",
    paymentType: "--",
    revenueCenter: "Patio",
    status: "ORDERING",
    notes: "Anniversary dinner - window seat",
    table: "T3",
    orderType: "Dine-In",
    paidAmount: "$0.00",
    paymentStatus: "Un Paid",
    tipAmount: 10.00,
    items: [
      { qty: 2, name: "Shrimp Scampi", price: 22.00, seats: [1, 2], modifiers: ["Extra Garlic"] },
      { qty: 1, name: "Bruschetta", price: 10.00, seats: [], modifiers: [], isShared: true }
    ]
  },
  
  // Order 7 - Emily Wilson (T3) - ORDERED - Dine-In (Same Party as Order 6)
  {
    id: "7",
    name: "Emily Wilson",
    phone: "(415) 555-2345",
    partySize: 2,
    time: "7:45 PM",
    timer: "0:45 Hrs",
    server: "Alex M",
    check: "123489",
    paymentType: "--",
    revenueCenter: "Patio",
    status: "ORDERED",
    notes: "Anniversary dinner - second round of drinks",
    table: "T3",
    orderType: "Dine-In",
    paidAmount: "$0.00",
    paymentStatus: "Un Paid",
    tipAmount: 12.00,
    items: [
      { qty: 2, name: "Champagne Glass", price: 15.00, seats: [1, 2], modifiers: [] },
      { qty: 1, name: "Chocolate Soufflé", price: 14.00, seats: [], modifiers: ["Extra Cream"], isShared: true }
    ]
  },
  
  // Order 8 - Lisa Garcia (T4) - PREPARING - Dine-In
  {
    id: "8",
    name: "Lisa Garcia",
    phone: "(415) 555-4567",
    partySize: 3,
    time: "7:50 PM",
    timer: "0:35 Hrs",
    server: "Mia Jones",
    check: "123490",
    paymentType: "--",
    revenueCenter: "Main Dining",
    status: "PREPARING",
    notes: "Nut allergy - kitchen aware",
    table: "T4",
    orderType: "Dine-In",
    paidAmount: "$0.00",
    paymentStatus: "Un Paid",
    tipAmount: 12.50,
    items: [
      { qty: 1, name: "Chicken Parmesan", price: 24.00, seats: [1], modifiers: ["No Nuts"] },
      { qty: 1, name: "Fettuccine Alfredo", price: 18.00, seats: [2], modifiers: ["Add Chicken $4"] },
      { qty: 1, name: "Minestrone Soup", price: 8.00, seats: [3], modifiers: [] }
    ]
  },
  
  // Order 9 - Robert Taylor (T5) - ORDERING - Takeout
  {
    id: "9",
    name: "Robert Taylor",
    phone: "(415) 555-5678",
    partySize: 4,
    time: "8:20 PM",
    timer: "00:10",
    server: "Alex M",
    check: "--",
    paymentType: "--",
    revenueCenter: "Counter",
    status: "ORDERING",
    notes: "Picking up in 20 mins",
    table: "T9",
    orderType: "Takeout",
    paidAmount: "$0.00",
    paymentStatus: "Un Paid",
    tipAmount: 18.00,
    items: [
      { qty: 2, name: "BBQ Ribs (Full)", price: 26.00, seats: [], modifiers: ["Extra BBQ Sauce"], isShared: true },
      { qty: 2, name: "Coleslaw", price: 5.00, seats: [], modifiers: [], isShared: true },
      { qty: 2, name: "Mac & Cheese", price: 8.00, seats: [], modifiers: [], isShared: true },
      { qty: 4, name: "Cornbread", price: 3.00, seats: [], modifiers: [], isShared: true }
    ]
  },
  
  // Order 10 - Amanda White (T1) - UNPAID - Dine-In
  {
    id: "10",
    name: "Amanda White",
    phone: "(415) 555-6789",
    partySize: 5,
    time: "7:00 PM",
    timer: "1:30 Hrs",
    server: "Dustin H",
    check: "123491",
    paymentType: "--",
    revenueCenter: "Private Room",
    status: "UNPAID",
    notes: "Business meeting - quiet area preferred",
    table: "T6",
    orderType: "Dine-In",
    paidAmount: "$0.00",
    paymentStatus: "Un Paid",
    tipAmount: 35.00,
    items: [
      { qty: 3, name: "Grilled Chicken Breast", price: 22.00, seats: [1, 2, 3], modifiers: ["Lemon Herb"] },
      { qty: 2, name: "Pan-Seared Duck", price: 32.00, seats: [4, 5], modifiers: ["Orange Glaze"] },
      { qty: 1, name: "Asparagus Bundle", price: 12.00, seats: [], modifiers: [], isShared: true },
      { qty: 5, name: "Sparkling Water", price: 4.00, seats: [], modifiers: [], isShared: true },
      { qty: 2, name: "Crème Brûlée", price: 10.00, seats: [], modifiers: [], isShared: true }
    ]
  },
  
  // Order 11 - James Rodriguez (T8) - READY - Dine-In (KDS marked ready)
  {
    id: "11",
    name: "James Rodriguez",
    phone: "(415) 555-7890",
    partySize: 4,
    time: "7:25 PM",
    timer: "0:50 Hrs",
    server: "Mia Jones",
    check: "123500",
    paymentType: "--",
    revenueCenter: "Main Dining",
    status: "READY",
    notes: "Food ready for delivery - KDS marked complete",
    table: "T9",
    orderType: "Dine-In",
    paidAmount: "$0.00",
    paymentStatus: "Un Paid",
    tipAmount: 20.00,
    items: [
      { qty: 2, name: "Herb Crusted Salmon", price: 26.00, seats: [1, 2], modifiers: ["Lemon Butter"] },
      { qty: 1, name: "Grilled Ribeye Steak", price: 34.00, seats: [3], modifiers: ["Medium", "Mushroom Sauce"] },
      { qty: 1, name: "Chicken Marsala", price: 22.00, seats: [4], modifiers: ["Extra Sauce"] },
      { qty: 1, name: "Garlic Mashed Potatoes", price: 8.00, seats: [], modifiers: [], isShared: true },
      { qty: 1, name: "Sauteed Vegetables", price: 7.00, seats: [], modifiers: [], isShared: true },
      { qty: 4, name: "House Lemonade", price: 4.00, seats: [], modifiers: [], isShared: true }
    ]
  }
];

// Calculate totals for an order based on its items
// Uses centralized constants from orderUtils
export const calculateOrderTotals = (items: OrderItem[], tipAmount: number = 0) => {
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

// Get calculated totals for a specific order
export const getOrderWithTotals = (order: Order) => {
  const totals = calculateOrderTotals(order.items, order.tipAmount || 0);
  return {
    ...order,
    subtotal: totals.subtotal,
    discount: totals.discount,
    serviceCharge: totals.serviceCharge,
    tax: totals.tax,
    tip: totals.tip,
    total: totals.total
  };
};

// Get formatted amount string for display
export const getOrderAmount = (order: Order) => {
  const totals = calculateOrderTotals(order.items, order.tipAmount || 0);
  return `$${totals.total.toFixed(2)}`;
};

// Get orders by table ID
export const getOrdersByTable = (tableId: string) => {
  return allOrders.filter(order => order.table === tableId);
};

// Get order by ID
export const getOrderById = (orderId: string) => {
  return allOrders.find(order => order.id === orderId);
};

// Get available orders for merge (same table, excluding current order, excluding Paid/Completed)
export const getAvailableOrdersForMerge = (currentOrderId: string, tableId: string) => {
  return allOrders.filter(order => 
    order.id !== currentOrderId && 
    order.table === tableId &&
    order.status !== "PAID" &&
    order.status !== "Completed"
  );
};

// Get available orders for transfer (different tables, excluding Paid/Completed)
export const getAvailableOrdersForTransfer = (currentOrderId: string, currentTable: string) => {
  return allOrders.filter(order => 
    order.id !== currentOrderId && 
    order.table !== currentTable &&
    order.status !== "PAID" &&
    order.status !== "Completed"
  );
};

// Get status color class (uses centralized utility)
import { getOrderStatusColor } from "@/lib/orderUtils";
export const getStatusColor = getOrderStatusColor;

// Get merged order data structure for display
export const getMergedOrderDisplay = (order: Order) => {
  const sections: { label: string; orderId: string; table: string; items: OrderItem[]; isOriginal: boolean }[] = [];
  
  // Add original order items
  sections.push({
    label: `Order #${order.id} Items`,
    orderId: order.id,
    table: order.table,
    items: order.items,
    isOriginal: true
  });
  
  // Add merged order items if any
  if (order.mergedFrom && order.mergedFrom.length > 0) {
    order.mergedFrom.forEach(merged => {
      sections.push({
        label: `Merged from Order #${merged.orderId} (${formatTableName(merged.table)})`,
        orderId: merged.orderId,
        table: merged.table,
        items: merged.items,
        isOriginal: false
      });
    });
  }
  
  // Add transferred order items if any
  if (order.transferredFrom && order.transferredFrom.length > 0) {
    order.transferredFrom.forEach(transferred => {
      sections.push({
        label: `Transferred from Order #${transferred.orderId} (${formatTableName(transferred.table)})`,
        orderId: transferred.orderId,
        table: transferred.table,
        items: transferred.items,
        isOriginal: false
      });
    });
  }
  
  return sections;
};

// Calculate combined totals for order including merged/transferred items
export const calculateCombinedTotals = (order: Order) => {
  let allItems = [...order.items];
  
  if (order.mergedFrom) {
    order.mergedFrom.forEach(merged => {
      allItems = [...allItems, ...merged.items];
    });
  }
  
  if (order.transferredFrom) {
    order.transferredFrom.forEach(transferred => {
      allItems = [...allItems, ...transferred.items];
    });
  }
  
  return calculateOrderTotals(allItems);
};

// Check if order has merged or transferred items
export const hasMergedOrTransferredItems = (order: Order) => {
  return (order.mergedFrom && order.mergedFrom.length > 0) || 
         (order.transferredFrom && order.transferredFrom.length > 0);
};

// Convert order to format for OrderLayoutTemplate
export const toOrderTemplateData = (order: Order) => ({
  id: Number(order.id),
  name: order.name,
  table: order.table,
  amount: getOrderAmount(order),
  partySize: order.partySize,
  time: order.time,
  status: order.status,
  timer: order.timer || "00:00",
  server: order.server,
  check: order.check || "--",
  revenueCenter: order.revenueCenter,
  paymentType: order.paymentType || "--",
  phone: order.phone,
  orderType: order.orderType,
});

// Import SplitConfiguration type for Dashboard orders
import { SplitConfiguration } from '@/contexts/SessionOrderContext';

// Dashboard-specific types and helpers

// Dashboard order item interface
export interface DashboardOrderItem {
  id: number;
  qty: number;
  name: string;
  price: number;
  seats: number[];
  noTax: boolean;
  itemOrderType: string;
  isFired: boolean;
}

// Dashboard order interface
export interface DashboardOrder {
  id: number;
  status: string;
  statusColor: string;
  filterCategory: string;
  guest: string;
  orderNo: string;
  seats: number;
  date: string;
  arrivedAt: string;
  timer: string;
  type: string;
  check: number | string;
  revenueCenter: string;
  tip: string;
  paymentType: string;
  isPaid: boolean;
  server: string;
  total: number;
  phone: string;
  table: string;
  notes: string;
  items: DashboardOrderItem[];
  paymentMethods?: PaymentMethod[];
  splitConfiguration?: SplitConfiguration;
}

// Get filter category from order status
export const getFilterCategory = (status: string): string => {
  const normalizedStatus = status.toUpperCase();
  if (['ORDERING', 'ORDERED', 'PREPARING'].includes(normalizedStatus)) return 'In Progress';
  if (['UNPAID', 'PENDING PAYMENT'].includes(normalizedStatus)) return 'Unpaid';
  if (['NEW ORDER', 'READY'].includes(normalizedStatus)) return 'Open';
  if (['PAID', 'COMPLETED'].includes(normalizedStatus)) return 'Paid';
  if (['CLOSED'].includes(normalizedStatus)) return 'Closed';
  return 'Open';
};

// Get status color hex from order status
export const getStatusColorHex = (status: string): string => {
  const normalizedStatus = status.toUpperCase();
  switch (normalizedStatus) {
    case 'ORDERING': return '#FACC15';
    case 'ORDERED': return '#F97316';
    case 'PREPARING': return '#3B82F6';
    case 'READY': return '#3B82F6';
    case 'PAID':
    case 'COMPLETED': return '#22C55E';
    case 'UNPAID':
    case 'PENDING PAYMENT': return '#EAB308';
    case 'CLOSED': return '#6B7280';
    case 'NEW ORDER': return '#3B82F6';
    default: return '#FFFFFF';
  }
};

// Map order type to dashboard display format
const mapOrderType = (orderType: string): string => {
  switch (orderType) {
    case 'Dine-In': return 'Dine In';
    case 'Takeout': return 'Take Out';
    case 'Delivery': return 'Delivery';
    case 'Bar': return 'Bar';
    default: return orderType;
  }
};

// Convert centralized order to Dashboard format
export const toDashboardOrder = (order: Order): DashboardOrder => {
  const totals = calculateOrderTotals(order.items, order.tipAmount || 0);
  const displayType = mapOrderType(order.orderType);
  
  return {
    id: Number(order.id),
    status: order.status,
    statusColor: getStatusColorHex(order.status),
    filterCategory: getFilterCategory(order.status),
    guest: order.name,
    orderNo: `Order No ${order.id}`,
    seats: order.partySize,
    date: "Thu, 22 Jun 2024", // Static for demo
    arrivedAt: order.time,
    timer: order.timer || "00:00",
    type: displayType,
    check: order.check !== "--" ? Number(order.check) || order.check : "--",
    revenueCenter: order.revenueCenter,
    tip: order.tipAmount ? `$${order.tipAmount.toFixed(2)}` : "$0.00",
    paymentType: order.paymentType,
    isPaid: order.status.toUpperCase() === 'PAID' || order.status.toUpperCase() === 'COMPLETED',
    server: order.server,
    total: totals.total,
    phone: order.phone || "(555) 000-0000",
    table: order.table,
    notes: order.notes || "",
    items: order.items.map((item, idx) => ({
      id: idx + 1,
      qty: item.qty,
      name: item.name,
      price: item.price,
      seats: item.seats,
      noTax: false,
      itemOrderType: displayType,
      isFired: false
    })),
    paymentMethods: order.paymentMethods
  };
};

// Get all orders in Dashboard format
export const getDashboardOrders = (): DashboardOrder[] => {
  return allOrders.map(toDashboardOrder);
};
