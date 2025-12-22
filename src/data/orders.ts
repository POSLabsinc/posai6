// Centralized order data store with unified interfaces

// Import icons for order types
import dineInIcon from "@/assets/icons/dine-in.png";

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
  // Track merged orders for separate display
  mergedFrom?: MergedOrderSource[];
  // Track transferred orders for separate display
  transferredFrom?: MergedOrderSource[];
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
    items: [
      { qty: 2, name: "Classic Crispy Burger", price: 12.00, seats: [1, 2], modifiers: [] },
      { qty: 4, name: "Meatballs", price: 4.00, seats: [], modifiers: ["Extra Sauce"], isShared: true },
      { qty: 2, name: "Rigatoni Pasta", price: 8.00, seats: [3, 4], modifiers: [] },
      { qty: 1, name: "Almond Crusted Salmon", price: 20.00, seats: [], modifiers: ["- Salad", "- Balsamic Vinaigrette", "- Medium Rare", "+ W/ Potato Wedges"] }
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
    items: [
      { qty: 1, name: "New York Strip Steak", price: 28.00, seats: [1], modifiers: ["Medium Rare", "+ Garlic Butter"] },
      { qty: 1, name: "Grilled Salmon", price: 24.00, seats: [2], modifiers: ["No Lemon"] },
      { qty: 1, name: "Caesar Salad", price: 12.00, seats: [3], modifiers: ["Extra Croutons", "Dressing on Side"] },
      { qty: 3, name: "Glass of Red Wine", price: 9.00, seats: [], modifiers: [] },
      { qty: 1, name: "Chocolate Lava Cake", price: 10.00, seats: [], modifiers: ["+ Extra Ice Cream"] }
    ]
  },
  
  // Order 3 - Sarah Johnson (T2) - UNPAID - Dine-In
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
    table: "T2",
    orderType: "Dine-In",
    paidAmount: "$0.00",
    paymentStatus: "Un Paid",
    items: [
      { qty: 2, name: "Margherita Pizza", price: 16.00, seats: [1, 2], modifiers: ["Gluten-Free Crust"] },
      { qty: 1, name: "Caprese Salad", price: 14.00, seats: [], modifiers: ["No Basil"] },
      { qty: 2, name: "Tiramisu", price: 9.00, seats: [], modifiers: [] },
      { qty: 2, name: "Espresso", price: 4.00, seats: [], modifiers: [] }
    ]
  },
  
  // Order 4 - David Chen (T2) - COMPLETED - Dine-In
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
    items: [
      { qty: 2, name: "Lobster Tail", price: 45.00, seats: [1, 2], modifiers: ["Extra Butter"] },
      { qty: 2, name: "Filet Mignon", price: 42.00, seats: [3, 4], modifiers: ["Medium", "Peppercorn Sauce"] },
      { qty: 2, name: "Vegetable Risotto", price: 22.00, seats: [5, 6], modifiers: ["Extra Parmesan"] },
      { qty: 6, name: "House Salad", price: 8.00, seats: [], modifiers: [], isShared: true },
      { qty: 2, name: "Bottle of Champagne", price: 85.00, seats: [], modifiers: [] },
      { qty: 6, name: "Cheesecake", price: 11.00, seats: [], modifiers: [] }
    ]
  },
  
  // Order 5 - Guest (T2) - ORDERING - Bar
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
    table: "T2",
    orderType: "Bar",
    paidAmount: "$0.00",
    paymentStatus: "Un Paid",
    items: [
      { qty: 1, name: "Classic Burger", price: 15.00, seats: [1], modifiers: ["No Pickles", "+ Bacon"] },
      { qty: 1, name: "Craft IPA", price: 8.00, seats: [], modifiers: [] }
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
    items: [
      { qty: 2, name: "Shrimp Scampi", price: 22.00, seats: [1, 2], modifiers: ["Extra Garlic"] },
      { qty: 1, name: "Bruschetta", price: 10.00, seats: [], modifiers: [], isShared: true }
    ]
  },
  
  // Order 7 - James Brown (T3) - ORDERED - Delivery
  {
    id: "7",
    name: "James Brown",
    phone: "(415) 555-3456",
    partySize: 4,
    time: "7:45 PM",
    timer: "0:45 Hrs",
    server: "Dustin H",
    check: "123489",
    paymentType: "--",
    revenueCenter: "Online",
    status: "ORDERED",
    notes: "Leave at door - apartment 4B",
    table: "T3",
    orderType: "Delivery",
    paidAmount: "$0.00",
    paymentStatus: "Un Paid",
    items: [
      { qty: 2, name: "Pepperoni Pizza (12\")", price: 18.00, seats: [], modifiers: ["Extra Cheese"] },
      { qty: 1, name: "Garlic Knots", price: 6.00, seats: [], modifiers: [] },
      { qty: 1, name: "Buffalo Wings (10pc)", price: 14.00, seats: [], modifiers: ["Extra Hot", "Ranch on Side"] },
      { qty: 2, name: "Soda", price: 3.00, seats: [], modifiers: [] }
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
    table: "T5",
    orderType: "Takeout",
    paidAmount: "$0.00",
    paymentStatus: "Un Paid",
    items: [
      { qty: 2, name: "BBQ Ribs (Full)", price: 26.00, seats: [], modifiers: ["Extra BBQ Sauce"] },
      { qty: 2, name: "Coleslaw", price: 5.00, seats: [], modifiers: [] },
      { qty: 2, name: "Mac & Cheese", price: 8.00, seats: [], modifiers: [] },
      { qty: 4, name: "Cornbread", price: 3.00, seats: [], modifiers: [] }
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
    table: "T1",
    orderType: "Dine-In",
    paidAmount: "$0.00",
    paymentStatus: "Un Paid",
    items: [
      { qty: 3, name: "Grilled Chicken Breast", price: 22.00, seats: [1, 2, 3], modifiers: ["Lemon Herb"] },
      { qty: 2, name: "Pan-Seared Duck", price: 32.00, seats: [4, 5], modifiers: ["Orange Glaze"] },
      { qty: 1, name: "Asparagus Bundle", price: 12.00, seats: [], modifiers: [], isShared: true },
      { qty: 5, name: "Sparkling Water", price: 4.00, seats: [], modifiers: [] },
      { qty: 2, name: "Crème Brûlée", price: 10.00, seats: [], modifiers: [] }
    ]
  }
];

// Calculate totals for an order based on its items
export const calculateOrderTotals = (items: OrderItem[]) => {
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const discount = subtotal > 50 ? 5.00 : 0;
  const serviceCharge = subtotal * 0.05;
  const tax = (subtotal - discount) * 0.0735;
  const total = subtotal - discount + serviceCharge + tax;
  return { 
    subtotal, 
    discount, 
    serviceCharge, 
    tax, 
    tip: 0,
    total 
  };
};

// Get calculated totals for a specific order
export const getOrderWithTotals = (order: Order) => {
  const totals = calculateOrderTotals(order.items);
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
  const totals = calculateOrderTotals(order.items);
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

// Format price helper
export const formatPrice = (price: number) => `$${price.toFixed(2)}`;

// Get status color class
export const getStatusColor = (status: string) => {
  switch (status.toUpperCase()) {
    case "ORDERING": return "text-red-500";
    case "ORDERED": return "text-orange-500";
    case "PREPARING": return "text-yellow-500";
    case "COMPLETED": return "text-green-500";
    case "PAID": return "text-green-500";
    case "UNPAID": return "text-red-400";
    default: return "text-white/60";
  }
};

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
        label: `Merged from Order #${merged.orderId} (${merged.table})`,
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
        label: `Transferred from Order #${transferred.orderId} (${transferred.table})`,
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
