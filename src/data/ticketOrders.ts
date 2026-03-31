// Shared ticket orders data - single source of truth for Tickets module and Transfer to Order dialogs

export interface TicketOrderItem {
  qty: number;
  name: string;
  price: number;
  seats: number[];
  modifiers: string[];
}

export interface TicketPaymentEntry {
  method: string;
  last4?: string;
  amount: number;
}

export interface TicketTransferInfo {
  type: 'sent' | 'received';
  transferType: 'full' | 'partial';
  targetOrderId?: string;
  targetOrderName?: string;
  sourceOrderId?: string;
  sourceOrderName?: string;
  sourceTable?: string;
  itemCount?: number;
  transferredItems?: TicketOrderItem[];
}

export interface TicketOrder {
  id: string;
  orderNumber?: number;
  name: string;
  phone: string;
  partySize: number;
  time: string;
  timer: string;
  server: string;
  check: string;
  paymentType: string;
  payments?: TicketPaymentEntry[];
  revenueCenter: string;
  status: string;
  notes: string;
  items: TicketOrderItem[];
  subtotal: number;
  discount: number;
  serviceCharge: number;
  tax: number;
  tip: number;
  total: number;
  table: string;
  orderType: string;
  transferInfo?: TicketTransferInfo;
}

export const ticketOrders: TicketOrder[] = [
  // 5 Quick Orders - all ORDERING
  {
    id: "a0000001-0000-0000-0000-000000000001",
    orderNumber: 1,
    name: "Kevin Hart",
    phone: "(415) 555-1001",
    partySize: 1,
    time: "8:00 PM",
    timer: "00:10",
    server: "Mia Jone",
    check: "--",
    paymentType: "--",
    revenueCenter: "Counter",
    status: "ORDERING",
    notes: "Extra napkins please",
    table: "--",
    orderType: "Take Out",
    items: [
      { qty: 2, name: "Fish Tacos", price: 14.00, seats: [], modifiers: ["Extra Lime"] },
      { qty: 1, name: "Churros", price: 7.00, seats: [], modifiers: [] }
    ],
    subtotal: 28.00,
    discount: 0,
    serviceCharge: 1.40,
    tax: 2.06,
    tip: 0,
    total: 31.46
  },
  {
    id: "a0000001-0000-0000-0000-000000000002",
    orderNumber: 2,
    name: "Sophia Turner",
    phone: "(415) 555-1002",
    partySize: 1,
    time: "8:15 PM",
    timer: "00:05",
    server: "Dustin H",
    check: "--",
    paymentType: "--",
    revenueCenter: "Online",
    status: "ORDERING",
    notes: "Leave at door",
    table: "--",
    orderType: "Delivery",
    items: [
      { qty: 2, name: "Pepperoni Pizza", price: 18.00, seats: [], modifiers: ["Extra Cheese"] },
      { qty: 1, name: "Garlic Bread", price: 6.00, seats: [], modifiers: [] }
    ],
    subtotal: 36.00,
    discount: 0,
    serviceCharge: 1.80,
    tax: 2.65,
    tip: 0,
    total: 40.45
  },
  {
    id: "a0000001-0000-0000-0000-000000000003",
    orderNumber: 3,
    name: "Marcus Lee",
    phone: "(415) 555-1003",
    partySize: 1,
    time: "8:20 PM",
    timer: "00:08",
    server: "Alex M",
    check: "--",
    paymentType: "--",
    revenueCenter: "Drive Thru",
    status: "ORDERING",
    notes: "No onions on burger",
    table: "--",
    orderType: "Drive Thru",
    items: [
      { qty: 1, name: "Classic Burger", price: 15.00, seats: [], modifiers: ["No Pickles", "+ Bacon"] },
      { qty: 1, name: "Large Fries", price: 5.00, seats: [], modifiers: [] },
      { qty: 1, name: "Soda", price: 3.00, seats: [], modifiers: [] }
    ],
    subtotal: 22.00,
    discount: 0,
    serviceCharge: 1.10,
    tax: 1.62,
    tip: 0,
    total: 24.72
  },
  {
    id: "a0000001-0000-0000-0000-000000000004",
    orderNumber: 4,
    name: "Rachel Kim",
    phone: "(415) 555-1004",
    partySize: 1,
    time: "8:25 PM",
    timer: "00:12",
    server: "Mia Jone",
    check: "--",
    paymentType: "--",
    revenueCenter: "Curbside",
    status: "ORDERING",
    notes: "Red Toyota - Spot 5",
    table: "--",
    orderType: "Curb Side",
    items: [
      { qty: 1, name: "Grilled Chicken Wrap", price: 13.00, seats: [], modifiers: ["No Tomato"] },
      { qty: 1, name: "Sweet Potato Fries", price: 6.50, seats: [], modifiers: [] }
    ],
    subtotal: 19.50,
    discount: 0,
    serviceCharge: 0.98,
    tax: 1.44,
    tip: 0,
    total: 21.92
  },
  {
    id: "a0000001-0000-0000-0000-000000000005",
    orderNumber: 5,
    name: "Daniel Brooks",
    phone: "(415) 555-1005",
    partySize: 2,
    time: "7:50 PM",
    timer: "0:20 Hrs",
    server: "Dustin H",
    check: "--",
    paymentType: "--",
    revenueCenter: "Phone Orders",
    status: "ORDERING",
    notes: "Call when ready",
    table: "--",
    orderType: "Phone-In",
    items: [
      { qty: 1, name: "Family Pasta Bowl", price: 32.00, seats: [], modifiers: ["Alfredo Sauce"] },
      { qty: 1, name: "Tiramisu", price: 10.00, seats: [], modifiers: [] }
    ],
    subtotal: 42.00,
    discount: 0,
    serviceCharge: 2.10,
    tax: 3.09,
    tip: 0,
    total: 47.19
  },
  // 3 Table 2 Orders - 1 ORDERING, 2 PAID
  {
    id: "a0000001-0000-0000-0000-000000000006",
    orderNumber: 6,
    name: "Emma Watson",
    phone: "(415) 555-2001",
    partySize: 4,
    time: "7:30 PM",
    timer: "0:30 Hrs",
    server: "Mia Jone",
    check: "--",
    paymentType: "--",
    revenueCenter: "Main Dining",
    status: "ORDERING",
    notes: "Window seat requested",
    table: "T2",
    orderType: "Table Order",
    items: [
      { qty: 2, name: "Classic Crispy Burger", price: 12.00, seats: [1, 2], modifiers: [] },
      { qty: 2, name: "Rigatoni Pasta", price: 8.00, seats: [3, 4], modifiers: ["Extra Sauce"] },
      { qty: 4, name: "Meatballs", price: 4.00, seats: [], modifiers: [] }
    ],
    subtotal: 86.00,
    discount: 5.00,
    serviceCharge: 4.05,
    tax: 5.96,
    tip: 0,
    total: 91.01
  },
  {
    id: "a0000001-0000-0000-0000-000000000007",
    orderNumber: 7,
    name: "James Miller",
    phone: "(415) 555-2002",
    partySize: 3,
    time: "6:45 PM",
    timer: "1:30 Hrs",
    server: "Dustin H",
    check: "100201",
    paymentType: "Credit Card",
    payments: [
      { method: "Visa", last4: "4532", amount: 78.65 }
    ],
    revenueCenter: "Main Dining",
    status: "PAID",
    notes: "Birthday celebration",
    table: "T2",
    orderType: "Table Order",
    items: [
      { qty: 1, name: "New York Strip Steak", price: 28.00, seats: [1], modifiers: ["Medium Rare"] },
      { qty: 1, name: "Grilled Salmon", price: 24.00, seats: [2], modifiers: ["No Lemon"] },
      { qty: 1, name: "Caesar Salad", price: 12.00, seats: [3], modifiers: ["Extra Croutons"] }
    ],
    subtotal: 64.00,
    discount: 0,
    serviceCharge: 3.20,
    tax: 4.70,
    tip: 6.75,
    total: 78.65
  },
  {
    id: "a0000001-0000-0000-0000-000000000008",
    orderNumber: 8,
    name: "Olivia Chen",
    phone: "(415) 555-2003",
    partySize: 2,
    time: "6:15 PM",
    timer: "2:00 Hrs",
    server: "Alex M",
    check: "100202",
    paymentType: "Cash",
    payments: [
      { method: "Cash", amount: 52.38 }
    ],
    revenueCenter: "Main Dining",
    status: "PAID",
    notes: "Anniversary dinner",
    table: "T2",
    orderType: "Table Order",
    items: [
      { qty: 2, name: "Margherita Pizza", price: 16.00, seats: [1, 2], modifiers: ["Gluten-Free Crust"] },
      { qty: 1, name: "Caprese Salad", price: 14.00, seats: [], modifiers: ["No Basil"] }
    ],
    subtotal: 46.00,
    discount: 0,
    serviceCharge: 2.30,
    tax: 2.68,
    tip: 1.40,
    total: 52.38
  },
  // 2 Table 3 Orders - 1 ORDERING, 1 PAID
  {
    id: "a0000001-0000-0000-0000-000000000009",
    orderNumber: 9,
    name: "Liam Parker",
    phone: "(415) 555-3001",
    partySize: 3,
    time: "7:45 PM",
    timer: "0:25 Hrs",
    server: "Mia Jone",
    check: "--",
    paymentType: "--",
    revenueCenter: "FF Balcony",
    status: "ORDERING",
    notes: "Allergic to shellfish",
    table: "T3",
    orderType: "Table Order",
    items: [
      { qty: 2, name: "Shrimp Scampi", price: 22.00, seats: [1, 2], modifiers: ["Extra Garlic"] },
      { qty: 1, name: "Mushroom Risotto", price: 18.00, seats: [3], modifiers: [] },
      { qty: 1, name: "Bruschetta", price: 10.00, seats: [], modifiers: [] }
    ],
    subtotal: 72.00,
    discount: 0,
    serviceCharge: 3.60,
    tax: 5.30,
    tip: 0,
    total: 80.90
  },
  {
    id: "a0000001-0000-0000-0000-000000000010",
    orderNumber: 10,
    name: "Ava Rodriguez",
    phone: "(415) 555-3002",
    partySize: 2,
    time: "6:30 PM",
    timer: "1:45 Hrs",
    server: "Dustin H",
    check: "100301",
    paymentType: "Credit Card",
    payments: [
      { method: "Amex", last4: "8821", amount: 68.94 }
    ],
    revenueCenter: "FF Balcony",
    status: "PAID",
    notes: "Enjoyed the steak",
    table: "T3",
    orderType: "Table Order",
    items: [
      { qty: 1, name: "Lamb Chops", price: 34.00, seats: [1], modifiers: ["Medium Rare"] },
      { qty: 1, name: "Grilled Salmon", price: 24.00, seats: [2], modifiers: ["Extra Butter"] }
    ],
    subtotal: 58.00,
    discount: 0,
    serviceCharge: 2.90,
    tax: 4.27,
    tip: 3.77,
    total: 68.94
  }
];

// Helper to convert TicketOrder to OrderLayoutTemplate-compatible format
export const ticketToTemplateData = (order: TicketOrder) => ({
  id: Number(order.id),
  name: order.name,
  table: order.table,
  amount: `$${order.total.toFixed(2)}`,
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

// Get available ticket orders for transfer (exclude source, paid, completed)
export const getAvailableTicketOrdersForTransfer = (sourceOrderId: string) => {
  return ticketOrders.filter(o => {
    if (o.id === sourceOrderId) return false;
    if (o.status === "PAID" || o.status === "Completed") return false;
    return true;
  });
};

// Format price helper
export const formatTicketPrice = (price: number) => `$${price.toFixed(2)}`;
