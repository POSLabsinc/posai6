// Centralized order data store with unified interfaces

// Import icons for order types
import dineInIcon from "@/assets/icons/dine-in.png";

// Re-export utilities from orderUtils for backward compatibility
export { 
  TAX_RATE, 
  SERVICE_CHARGE_RATE, 
  DISCOUNT_THRESHOLD, 
  DISCOUNT_AMOUNT,
  formatPrice,
  formatPriceWithSign,
  formatTableName,
  getOrderStatusColor,
  calculateOrderTotals as calculateItemsTotals,
  isActiveOrderStatus,
  doCustomerDetailsMatch,
  validateNewOrderForTable,
  normalizePhone,
  normalizeName
} from "@/lib/orderUtils";

import type { ActiveOrderInfo, TableOrderValidation } from "@/lib/orderUtils";
export type { ActiveOrderInfo, TableOrderValidation };

import { 
  TAX_RATE, 
  SERVICE_CHARGE_RATE, 
  DISCOUNT_THRESHOLD, 
  DISCOUNT_AMOUNT,
  formatTableName,
  isActiveOrderStatus
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

// 15 Complete orders with realistic food data covering T1-T12 + online orders
export const allOrders: Order[] = [
  // ============================================
  // TABLE T1 - Marcus Thompson - Business Lunch
  // ============================================
  {
    id: "1",
    name: "Marcus Thompson",
    phone: "(415) 555-1001",
    partySize: 6,
    time: "12:30 PM",
    timer: "00:25",
    server: "Mia Jones",
    check: "--",
    paymentType: "--",
    revenueCenter: "Main Dining",
    status: "ORDERING",
    notes: "Business lunch - need separate checks",
    table: "T1",
    orderType: "Dine-In",
    paidAmount: "$0.00",
    paymentStatus: "Un Paid",
    tipAmount: 0,
    items: [
      { qty: 3, name: "Grilled Chicken Salad", price: 16.00, seats: [1, 2, 3], modifiers: ["Dressing on Side"] },
      { qty: 2, name: "New York Strip Steak", price: 32.00, seats: [4, 5], modifiers: ["Medium Rare", "+ Mushroom Sauce"] },
      { qty: 1, name: "Lobster Bisque", price: 14.00, seats: [6], modifiers: [] },
      { qty: 6, name: "Sparkling Water", price: 4.00, seats: [], modifiers: [], isShared: true }
    ]
  },

  // ============================================
  // TABLE T2 - Jessica Rivera - Anniversary (Same Party Demo)
  // ============================================
  // Order 2 - Jessica Rivera (T2) - UNPAID - First Course Complete
  {
    id: "2",
    name: "Jessica Rivera",
    phone: "(415) 555-1002",
    partySize: 2,
    time: "7:00 PM",
    timer: "1:45 Hrs",
    server: "Alex Martinez",
    check: "100234",
    paymentType: "--",
    revenueCenter: "FF Balcony",
    status: "UNPAID",
    notes: "Anniversary dinner - complimentary dessert",
    table: "T2",
    orderType: "Dine-In",
    paidAmount: "$0.00",
    paymentStatus: "Un Paid",
    tipAmount: 22.00,
    items: [
      { qty: 1, name: "Filet Mignon", price: 45.00, seats: [1], modifiers: ["Medium", "Béarnaise Sauce"] },
      { qty: 1, name: "Pan-Seared Salmon", price: 34.00, seats: [2], modifiers: ["Extra Lemon"] },
      { qty: 1, name: "Truffle Fries", price: 12.00, seats: [], modifiers: [], isShared: true },
      { qty: 2, name: "Glass of Champagne", price: 18.00, seats: [], modifiers: [] }
    ]
  },
  
  // Order 3 - Jessica Rivera (T2) - ORDERING - Second Round (Same Party)
  {
    id: "3",
    name: "Jessica Rivera",
    phone: "(415) 555-1002",
    partySize: 2,
    time: "8:30 PM",
    timer: "00:12",
    server: "Alex Martinez",
    check: "--",
    paymentType: "--",
    revenueCenter: "FF Balcony",
    status: "ORDERING",
    notes: "Second round - desserts and coffee",
    table: "T2",
    orderType: "Dine-In",
    paidAmount: "$0.00",
    paymentStatus: "Un Paid",
    tipAmount: 0,
    items: [
      { qty: 2, name: "Chocolate Lava Cake", price: 12.00, seats: [1, 2], modifiers: ["+ Extra Ice Cream"] },
      { qty: 2, name: "Espresso", price: 5.00, seats: [], modifiers: [] }
    ]
  },

  // ============================================
  // TABLE T3 - Kevin Chen - ORDERED
  // ============================================
  {
    id: "4",
    name: "Kevin Chen",
    phone: "(415) 555-1003",
    partySize: 4,
    time: "6:45 PM",
    timer: "00:35",
    server: "Sarah Wilson",
    check: "100235",
    paymentType: "--",
    revenueCenter: "Main Dining",
    status: "ORDERED",
    notes: "Window seat requested - celebrating promotion",
    table: "T3",
    orderType: "Dine-In",
    paidAmount: "$0.00",
    paymentStatus: "Un Paid",
    tipAmount: 0,
    items: [
      { qty: 1, name: "Ribeye Steak", price: 38.00, seats: [1], modifiers: ["Medium Well", "+ Peppercorn Sauce"] },
      { qty: 1, name: "Chicken Parmesan", price: 26.00, seats: [2], modifiers: [] },
      { qty: 1, name: "Grilled Salmon", price: 32.00, seats: [3], modifiers: ["No Butter"] },
      { qty: 1, name: "Pasta Primavera", price: 22.00, seats: [4], modifiers: ["Extra Vegetables"] },
      { qty: 2, name: "House Salad", price: 10.00, seats: [], modifiers: [], isShared: true },
      { qty: 1, name: "Bottle of Cabernet", price: 65.00, seats: [], modifiers: [], isShared: true }
    ]
  },

  // ============================================
  // TABLE T4 - Rachel Green - PREPARING
  // ============================================
  {
    id: "5",
    name: "Rachel Green",
    phone: "(415) 555-1004",
    partySize: 3,
    time: "7:30 PM",
    timer: "00:20",
    server: "David Kim",
    check: "100236",
    paymentType: "--",
    revenueCenter: "Patio",
    status: "PREPARING",
    notes: "Vegetarian options - nut allergy for seat 2",
    table: "T4",
    orderType: "Dine-In",
    paidAmount: "$0.00",
    paymentStatus: "Un Paid",
    tipAmount: 0,
    items: [
      { qty: 1, name: "Mushroom Risotto", price: 24.00, seats: [1], modifiers: ["Extra Parmesan"] },
      { qty: 1, name: "Eggplant Parmesan", price: 22.00, seats: [2], modifiers: ["No Pine Nuts - ALLERGY"] },
      { qty: 1, name: "Mediterranean Salad", price: 16.00, seats: [3], modifiers: ["Add Feta"] },
      { qty: 3, name: "Iced Tea", price: 4.00, seats: [], modifiers: [] }
    ]
  },

  // ============================================
  // TABLE T5 - Daniel Martinez - 1ST COURSE
  // ============================================
  {
    id: "6",
    name: "Daniel Martinez",
    phone: "(415) 555-1005",
    partySize: 4,
    time: "6:00 PM",
    timer: "1:15 Hrs",
    server: "Emily Chen",
    check: "100237",
    paymentType: "--",
    revenueCenter: "Private Room",
    status: "1ST COURSE",
    notes: "Birthday celebration - bring cake at 8pm",
    table: "T5",
    orderType: "Dine-In",
    paidAmount: "$0.00",
    paymentStatus: "Un Paid",
    tipAmount: 0,
    items: [
      { qty: 4, name: "French Onion Soup", price: 12.00, seats: [1, 2, 3, 4], modifiers: [] },
      { qty: 2, name: "Shrimp Cocktail", price: 18.00, seats: [], modifiers: [], isShared: true },
      { qty: 1, name: "Prime Rib", price: 48.00, seats: [1], modifiers: ["Medium Rare", "Extra Au Jus"] },
      { qty: 1, name: "Lobster Tail", price: 55.00, seats: [2], modifiers: ["Garlic Butter"] },
      { qty: 1, name: "Surf & Turf", price: 62.00, seats: [3], modifiers: ["Filet Medium"] },
      { qty: 1, name: "Duck Confit", price: 36.00, seats: [4], modifiers: [] },
      { qty: 2, name: "Bottle of Pinot Noir", price: 58.00, seats: [], modifiers: [], isShared: true }
    ]
  },

  // ============================================
  // TABLE T6 - Guest - ORDERING (Bar Walk-in)
  // ============================================
  {
    id: "7",
    name: "Guest",
    phone: "",
    partySize: 1,
    time: "8:45 PM",
    timer: "00:08",
    server: "Jake Porter",
    check: "--",
    paymentType: "--",
    revenueCenter: "Bar",
    status: "ORDERING",
    notes: "",
    table: "T6",
    orderType: "Bar",
    paidAmount: "$0.00",
    paymentStatus: "Un Paid",
    tipAmount: 0,
    items: [
      { qty: 1, name: "Craft Beer Flight", price: 16.00, seats: [1], modifiers: [] },
      { qty: 1, name: "Loaded Nachos", price: 14.00, seats: [1], modifiers: ["Extra Jalapeños"] }
    ]
  },

  // ============================================
  // TABLE T7 - Samantha Brooks - PAID (Takeout Complete)
  // ============================================
  {
    id: "8",
    name: "Samantha Brooks",
    phone: "(415) 555-1006",
    partySize: 1,
    time: "5:30 PM",
    timer: "2:30 Hrs",
    server: "Counter",
    check: "100238",
    paymentType: "Corporate Card",
    revenueCenter: "Takeout",
    status: "PAID",
    notes: "Corporate catering order - receipt emailed",
    table: "T7",
    orderType: "Takeout",
    paidAmount: "$284.00",
    paymentStatus: "Paid",
    tipAmount: 42.00,
    items: [
      { qty: 10, name: "Assorted Sandwich Platter", price: 15.00, seats: [], modifiers: [] },
      { qty: 5, name: "Caesar Salad (Large)", price: 18.00, seats: [], modifiers: ["Dressing on Side"] },
      { qty: 2, name: "Fruit Platter", price: 22.00, seats: [], modifiers: [] }
    ]
  },

  // ============================================
  // TABLE T8 - Michael Foster - ORDERED (Delivery)
  // ============================================
  {
    id: "9",
    name: "Michael Foster",
    phone: "(415) 555-1007",
    partySize: 2,
    time: "7:15 PM",
    timer: "00:40",
    server: "Online",
    check: "100239",
    paymentType: "Credit Card",
    revenueCenter: "Online",
    status: "ORDERED",
    notes: "Delivery - 456 Oak Street, Apt 12B - Ring doorbell",
    table: "T8",
    orderType: "Delivery",
    paidAmount: "$0.00",
    paymentStatus: "Un Paid",
    tipAmount: 8.00,
    items: [
      { qty: 2, name: "Margherita Pizza", price: 18.00, seats: [], modifiers: ["Well Done"] },
      { qty: 1, name: "Garlic Knots", price: 8.00, seats: [], modifiers: [] },
      { qty: 2, name: "Tiramisu", price: 10.00, seats: [], modifiers: [] },
      { qty: 2, name: "Soda", price: 3.00, seats: [], modifiers: [] }
    ]
  },

  // ============================================
  // TABLE T9 - Amanda Collins - UNPAID (Late Night)
  // ============================================
  {
    id: "10",
    name: "Amanda Collins",
    phone: "(415) 555-1008",
    partySize: 3,
    time: "9:00 PM",
    timer: "00:45",
    server: "Mia Jones",
    check: "100240",
    paymentType: "--",
    revenueCenter: "Main Dining",
    status: "UNPAID",
    notes: "Late-night dessert and drinks",
    table: "T9",
    orderType: "Dine-In",
    paidAmount: "$0.00",
    paymentStatus: "Un Paid",
    tipAmount: 0,
    items: [
      { qty: 1, name: "Crème Brûlée", price: 11.00, seats: [1], modifiers: [] },
      { qty: 1, name: "New York Cheesecake", price: 10.00, seats: [2], modifiers: ["+ Berry Compote"] },
      { qty: 1, name: "Affogato", price: 9.00, seats: [3], modifiers: [] },
      { qty: 3, name: "Espresso Martini", price: 14.00, seats: [], modifiers: [] }
    ]
  },

  // ============================================
  // TABLE T10 - Tyler Washington - COMPLETED
  // ============================================
  {
    id: "11",
    name: "Tyler Washington",
    phone: "(415) 555-1009",
    partySize: 4,
    time: "5:00 PM",
    timer: "3:00 Hrs",
    server: "Sarah Wilson",
    check: "100241",
    paymentType: "Visa",
    revenueCenter: "Main Dining",
    status: "COMPLETED",
    notes: "Early dinner - table cleared",
    table: "T10",
    orderType: "Dine-In",
    paidAmount: "$186.00",
    paymentStatus: "Paid",
    tipAmount: 35.00,
    items: [
      { qty: 2, name: "Spaghetti Carbonara", price: 24.00, seats: [1, 2], modifiers: [] },
      { qty: 1, name: "Veal Piccata", price: 32.00, seats: [3], modifiers: [] },
      { qty: 1, name: "Grilled Lamb Chops", price: 42.00, seats: [4], modifiers: ["Medium"] },
      { qty: 4, name: "House Wine", price: 12.00, seats: [], modifiers: [] }
    ]
  },

  // ============================================
  // TABLE T11 - Nicole Adams - PREPARING (Large Group)
  // ============================================
  {
    id: "12",
    name: "Nicole Adams",
    phone: "(415) 555-1010",
    partySize: 5,
    time: "7:00 PM",
    timer: "00:30",
    server: "David Kim",
    check: "100242",
    paymentType: "--",
    revenueCenter: "Main Dining",
    status: "PREPARING",
    notes: "Family gathering - kids menu for 2 seats",
    table: "T11",
    orderType: "Dine-In",
    paidAmount: "$0.00",
    paymentStatus: "Un Paid",
    tipAmount: 0,
    items: [
      { qty: 1, name: "Grilled Salmon", price: 32.00, seats: [1], modifiers: ["Lemon Butter"] },
      { qty: 1, name: "Chicken Marsala", price: 28.00, seats: [2], modifiers: [] },
      { qty: 1, name: "Pork Tenderloin", price: 30.00, seats: [3], modifiers: ["Apple Chutney"] },
      { qty: 1, name: "Kids Chicken Tenders", price: 12.00, seats: [4], modifiers: ["+ Fries"] },
      { qty: 1, name: "Kids Mac & Cheese", price: 10.00, seats: [5], modifiers: [] },
      { qty: 3, name: "Lemonade", price: 4.00, seats: [], modifiers: [] },
      { qty: 2, name: "Chocolate Milk", price: 4.00, seats: [], modifiers: [] }
    ]
  },

  // ============================================
  // TABLE T12 - Chris Martinez - ORDERING (First Visit)
  // ============================================
  {
    id: "13",
    name: "Chris Martinez",
    phone: "(415) 555-1011",
    partySize: 5,
    time: "8:00 PM",
    timer: "00:15",
    server: "Emily Chen",
    check: "--",
    paymentType: "--",
    revenueCenter: "Main Dining",
    status: "ORDERING",
    notes: "First-time visitors - recommend house specials",
    table: "T12",
    orderType: "Dine-In",
    paidAmount: "$0.00",
    paymentStatus: "Un Paid",
    tipAmount: 0,
    items: [
      { qty: 5, name: "Bread Basket", price: 0.00, seats: [], modifiers: [], isShared: true },
      { qty: 2, name: "Bruschetta", price: 12.00, seats: [], modifiers: [], isShared: true },
      { qty: 1, name: "Calamari", price: 16.00, seats: [], modifiers: [], isShared: true }
    ]
  },

  // ============================================
  // NO TABLE - Online Takeout Order
  // ============================================
  {
    id: "14",
    name: "Online Customer",
    phone: "(415) 555-1012",
    partySize: 1,
    time: "7:45 PM",
    timer: "00:20",
    server: "Counter",
    check: "100243",
    paymentType: "Apple Pay",
    revenueCenter: "Online",
    status: "ORDERED",
    notes: "Counter pickup - Name: Jason",
    table: "",
    orderType: "Takeout",
    paidAmount: "$42.00",
    paymentStatus: "Paid",
    tipAmount: 5.00,
    items: [
      { qty: 1, name: "BBQ Bacon Burger", price: 18.00, seats: [], modifiers: ["No Onions", "Extra Pickles"] },
      { qty: 1, name: "Sweet Potato Fries", price: 7.00, seats: [], modifiers: [] },
      { qty: 1, name: "Chocolate Shake", price: 8.00, seats: [], modifiers: [] },
      { qty: 1, name: "Brownie Sundae", price: 9.00, seats: [], modifiers: [] }
    ]
  },

  // ============================================
  // NO TABLE - Third-Party Delivery
  // ============================================
  {
    id: "15",
    name: "DoorDash Order",
    phone: "(415) 555-1013",
    partySize: 1,
    time: "8:15 PM",
    timer: "00:12",
    server: "Delivery App",
    check: "DD-78234",
    paymentType: "DoorDash",
    revenueCenter: "Third Party",
    status: "PREPARING",
    notes: "Driver arriving in 10 mins",
    table: "",
    orderType: "Delivery",
    paidAmount: "$38.00",
    paymentStatus: "Paid",
    tipAmount: 0,
    items: [
      { qty: 2, name: "Chicken Burrito Bowl", price: 14.00, seats: [], modifiers: ["Extra Guac"] },
      { qty: 1, name: "Chips & Salsa", price: 6.00, seats: [], modifiers: [] },
      { qty: 2, name: "Churros", price: 5.00, seats: [], modifiers: [] }
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

// Get active (unpaid/incomplete) orders for a table
export const getActiveOrdersForTable = (tableId: string): import("@/lib/orderUtils").ActiveOrderInfo[] => {
  const tableIdNormalized = tableId.replace(/^T/i, '');
  return allOrders
    .filter(order => {
      const orderTableNormalized = order.table.replace(/^T/i, '');
      return orderTableNormalized === tableIdNormalized && isActiveOrderStatus(order.status);
    })
    .map(order => ({
      id: order.id,
      name: order.name,
      phone: order.phone,
      table: order.table,
      status: order.status,
      partySize: order.partySize
    }));
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
});

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
