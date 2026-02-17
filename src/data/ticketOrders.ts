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

export interface TicketOrder {
  id: string;
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
}

export const ticketOrders: TicketOrder[] = [
  {
    id: "3",
    name: "Martin Alex",
    phone: "(415) 555-0123",
    partySize: 4,
    time: "8:00 PM",
    timer: "00:00",
    server: "Mia Jone",
    check: "--",
    paymentType: "--",
    revenueCenter: "FF Balcony",
    status: "ORDERING",
    notes: "Allergic to almonds, Don't add onion",
    table: "T2",
    orderType: "Table Order",
    items: [
      { qty: 2, name: "Classic Crispy Burger", price: 12.00, seats: [1, 2], modifiers: [] },
      { qty: 4, name: "Meatballs", price: 4.00, seats: [], modifiers: ["Extra Sauce"] },
      { qty: 2, name: "Rigatoni Pasta", price: 8.00, seats: [3, 4], modifiers: [] },
      { qty: 1, name: "Almond Crusted Salmon", price: 20.00, seats: [], modifiers: ["- Salad", "- Balsamic Vinaigrette"] }
    ],
    subtotal: 68.00,
    discount: 5.00,
    serviceCharge: 3.40,
    tax: 4.56,
    tip: 0,
    total: 70.96
  },
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
    orderType: "Take Out",
    items: [
      { qty: 1, name: "New York Strip Steak", price: 28.00, seats: [1], modifiers: ["Medium Rare"] },
      { qty: 1, name: "Grilled Salmon", price: 24.00, seats: [2], modifiers: ["No Lemon"] },
      { qty: 1, name: "Caesar Salad", price: 12.00, seats: [3], modifiers: ["Extra Croutons"] }
    ],
    subtotal: 101.00,
    discount: 0,
    serviceCharge: 5.05,
    tax: 7.42,
    tip: 15.00,
    total: 128.47
  },
  {
    id: "1",
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
    table: "T1",
    orderType: "Delivery",
    items: [
      { qty: 2, name: "Margherita Pizza", price: 16.00, seats: [1, 2], modifiers: ["Gluten-Free Crust"] },
      { qty: 1, name: "Caprese Salad", price: 14.00, seats: [], modifiers: ["No Basil"] }
    ],
    subtotal: 72.00,
    discount: 10.00,
    serviceCharge: 3.10,
    tax: 4.34,
    tip: 0,
    total: 69.44
  },
  {
    id: "4",
    name: "David Chen",
    phone: "(415) 555-1234",
    partySize: 6,
    time: "6:45 PM",
    timer: "2:30 Hrs",
    server: "Mia Jone",
    check: "123456",
    paymentType: "Credit Card",
    payments: [
      { method: "Visa", last4: "1234", amount: 300.00 },
      { method: "Amex", last4: "9876", amount: 150.00 },
      { method: "Cash", amount: 71.19 },
    ],
    revenueCenter: "Main Dining",
    status: "PAID",
    notes: "Corporate dinner - split bill 3 ways",
    table: "T5",
    orderType: "Dine-In",
    items: [
      { qty: 2, name: "Lobster Tail", price: 45.00, seats: [1, 2], modifiers: ["Extra Butter"] },
      { qty: 2, name: "Filet Mignon", price: 42.00, seats: [3, 4], modifiers: ["Medium"] }
    ],
    subtotal: 428.00,
    discount: 20.00,
    serviceCharge: 20.40,
    tax: 28.59,
    tip: 64.20,
    total: 521.19
  },
  {
    id: "5",
    name: "Guest",
    phone: "",
    partySize: 1,
    time: "8:30 PM",
    timer: "00:15",
    server: "Mia Jone",
    check: "--",
    paymentType: "--",
    revenueCenter: "Bar",
    status: "ORDERING",
    notes: "",
    table: "Bar",
    orderType: "Dine-In",
    items: [
      { qty: 1, name: "Classic Burger", price: 15.00, seats: [1], modifiers: ["No Pickles", "+ Bacon"] },
      { qty: 1, name: "Craft IPA", price: 8.00, seats: [], modifiers: [] }
    ],
    subtotal: 23.00,
    discount: 0,
    serviceCharge: 1.15,
    tax: 1.69,
    tip: 0,
    total: 25.84
  },
  {
    id: "6",
    name: "Emily Davis",
    phone: "(415) 555-7890",
    partySize: 2,
    time: "9:00 PM",
    timer: "00:05",
    server: "Mia Jone",
    check: "--",
    paymentType: "--",
    revenueCenter: "Patio",
    status: "ORDERING",
    notes: "Anniversary dinner",
    table: "T7",
    orderType: "Table Order",
    items: [
      { qty: 2, name: "Champagne", price: 25.00, seats: [], modifiers: [] }
    ],
    subtotal: 50.00,
    discount: 0,
    serviceCharge: 2.50,
    tax: 3.68,
    tip: 0,
    total: 56.18
  },
  {
    id: "7",
    name: "James Wilson",
    phone: "(415) 555-3456",
    partySize: 1,
    time: "8:45 PM",
    timer: "00:10",
    server: "Dustin H",
    check: "--",
    paymentType: "--",
    revenueCenter: "Online",
    status: "ORDERING",
    notes: "Leave at door",
    table: "--",
    orderType: "Delivery",
    items: [
      { qty: 2, name: "Pepperoni Pizza", price: 18.00, seats: [], modifiers: [] },
      { qty: 1, name: "Garlic Bread", price: 6.00, seats: [], modifiers: [] }
    ],
    subtotal: 42.00,
    discount: 0,
    serviceCharge: 2.10,
    tax: 3.09,
    tip: 0,
    total: 47.19
  },
  {
    id: "8",
    name: "Lisa Park",
    phone: "(415) 555-9012",
    partySize: 2,
    time: "7:50 PM",
    timer: "0:30 Hrs",
    server: "Mia Jone",
    check: "123478",
    paymentType: "--",
    revenueCenter: "Counter",
    status: "ORDERING",
    notes: "Picking up in 15 mins",
    table: "--",
    orderType: "Take Out",
    items: [
      { qty: 2, name: "Fish Tacos", price: 14.00, seats: [], modifiers: ["Extra Lime"] },
      { qty: 2, name: "Churros", price: 7.00, seats: [], modifiers: [] }
    ],
    subtotal: 42.00,
    discount: 0,
    serviceCharge: 2.10,
    tax: 3.09,
    tip: 0,
    total: 47.19
  },
  {
    id: "9",
    name: "Carlos Martinez",
    phone: "(415) 555-4321",
    partySize: 1,
    time: "8:10 PM",
    timer: "00:08",
    server: "Alex M",
    check: "--",
    paymentType: "--",
    revenueCenter: "Drive Thru",
    status: "ORDERING",
    notes: "Extra napkins",
    table: "--",
    orderType: "Drive Thru",
    items: [
      { qty: 2, name: "Cheeseburger Combo", price: 11.00, seats: [], modifiers: ["No Onions"] },
      { qty: 1, name: "Large Fries", price: 5.00, seats: [], modifiers: [] },
      { qty: 2, name: "Soda", price: 3.00, seats: [], modifiers: [] }
    ],
    subtotal: 33.00,
    discount: 0,
    serviceCharge: 1.65,
    tax: 2.43,
    tip: 0,
    total: 37.08
  },
  {
    id: "10",
    name: "Rebecca Stone",
    phone: "(415) 555-8765",
    partySize: 3,
    time: "7:20 PM",
    timer: "0:40 Hrs",
    server: "Dustin H",
    check: "123500",
    paymentType: "--",
    revenueCenter: "Phone Orders",
    status: "UNPAID",
    notes: "Call when ready for pickup",
    table: "--",
    orderType: "Phone-In",
    items: [
      { qty: 1, name: "Family Pasta Bowl", price: 32.00, seats: [], modifiers: ["Alfredo Sauce"] },
      { qty: 1, name: "Garlic Breadsticks", price: 8.00, seats: [], modifiers: [] },
      { qty: 1, name: "Tiramisu", price: 10.00, seats: [], modifiers: [] }
    ],
    subtotal: 50.00,
    discount: 0,
    serviceCharge: 2.50,
    tax: 3.68,
    tip: 0,
    total: 56.18
  },
  {
    id: "11",
    name: "Amanda Lee",
    phone: "(415) 555-6543",
    partySize: 4,
    time: "9:30 PM",
    timer: "00:00",
    server: "Mia Jone",
    check: "--",
    paymentType: "--",
    revenueCenter: "Scheduled",
    status: "ORDERING",
    notes: "Scheduled for tomorrow 6 PM",
    table: "--",
    orderType: "Scheduled",
    items: [
      { qty: 4, name: "BBQ Ribs Half Rack", price: 18.00, seats: [], modifiers: [] },
      { qty: 4, name: "Coleslaw", price: 5.00, seats: [], modifiers: [] }
    ],
    subtotal: 92.00,
    discount: 0,
    serviceCharge: 4.60,
    tax: 6.78,
    tip: 0,
    total: 103.38
  },
  {
    id: "12",
    name: "Thompson Wedding",
    phone: "(415) 555-1111",
    partySize: 50,
    time: "6:00 PM",
    timer: "3:00 Hrs",
    server: "Alex M",
    check: "BQ-001",
    paymentType: "Credit Card",
    revenueCenter: "Banquet Hall",
    status: "PAID",
    notes: "Wedding reception - pre-paid package",
    table: "BQ1",
    orderType: "Banquet",
    items: [
      { qty: 50, name: "Prix Fixe Dinner", price: 65.00, seats: [], modifiers: ["Chicken or Fish"] },
      { qty: 10, name: "Bottle of Wine", price: 45.00, seats: [], modifiers: [] }
    ],
    subtotal: 3700.00,
    discount: 200.00,
    serviceCharge: 175.00,
    tax: 257.25,
    tip: 370.00,
    total: 4302.25
  },
  {
    id: "13",
    name: "Tom Rodriguez",
    phone: "(415) 555-2222",
    partySize: 1,
    time: "8:25 PM",
    timer: "00:12",
    server: "Dustin H",
    check: "--",
    paymentType: "--",
    revenueCenter: "Curbside",
    status: "ORDERING",
    notes: "Blue Honda Civic - Spot 3",
    table: "--",
    orderType: "Curb Side",
    items: [
      { qty: 1, name: "Grilled Chicken Wrap", price: 13.00, seats: [], modifiers: ["No Tomato"] },
      { qty: 1, name: "Sweet Potato Fries", price: 6.00, seats: [], modifiers: [] },
      { qty: 1, name: "Iced Tea", price: 3.50, seats: [], modifiers: [] }
    ],
    subtotal: 22.50,
    discount: 0,
    serviceCharge: 1.13,
    tax: 1.66,
    tip: 0,
    total: 25.29
  },
  {
    id: "14",
    name: "Chef's Special",
    phone: "",
    partySize: 2,
    time: "7:00 PM",
    timer: "1:00 Hrs",
    server: "Mia Jone",
    check: "CUST-01",
    paymentType: "--",
    revenueCenter: "Kitchen",
    status: "UNPAID",
    notes: "Custom tasting menu - VIP guest",
    table: "T10",
    orderType: "Custom",
    items: [
      { qty: 1, name: "Tasting Menu 7-Course", price: 120.00, seats: [1], modifiers: ["Wine Pairing"] },
      { qty: 1, name: "Cheese Board", price: 28.00, seats: [2], modifiers: ["No Blue Cheese"] }
    ],
    subtotal: 148.00,
    discount: 0,
    serviceCharge: 7.40,
    tax: 10.90,
    tip: 0,
    total: 166.30
  },
  {
    id: "15",
    name: "Rachel Green",
    phone: "(415) 555-3333",
    partySize: 4,
    time: "7:40 PM",
    timer: "0:50 Hrs",
    server: "Alex M",
    check: "123510",
    paymentType: "--",
    revenueCenter: "Main Dining",
    status: "ORDERING",
    notes: "Window seat requested",
    table: "T3",
    orderType: "Table Order",
    items: [
      { qty: 2, name: "Shrimp Scampi", price: 22.00, seats: [1, 2], modifiers: ["Extra Garlic"] },
      { qty: 1, name: "Bruschetta", price: 10.00, seats: [], modifiers: [] },
      { qty: 1, name: "Mushroom Risotto", price: 18.00, seats: [3], modifiers: [] },
      { qty: 1, name: "Lamb Chops", price: 34.00, seats: [4], modifiers: ["Medium Rare"] }
    ],
    subtotal: 128.00,
    discount: 5.00,
    serviceCharge: 6.15,
    tax: 9.06,
    tip: 0,
    total: 138.21
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
