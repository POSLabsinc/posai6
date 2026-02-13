import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Search, SlidersHorizontal, Phone, ShoppingBag, Truck, Wine, Users, ReceiptText, ArrowRightLeft, ChevronRight, DollarSign, CalendarDays, UsersRound, ClipboardList, CircleDollarSign, Wallet, X } from "lucide-react";

// Import icons
import runnerIcon from "@/assets/icons/runner.png";
import clearIcon from "@/assets/icons/clear-c.png";
import fireIcon from "@/assets/icons/fire.png";
import tableTargetIcon from "@/assets/icons/table-target.png";
import arrowRightIcon from "@/assets/icons/arrow-right.png";
import shareOrderIcon from "@/assets/icons/share-order.png";
import shareSeatsIcon from "@/assets/icons/share-seats.png";
import seatIcon from "@/assets/icons/seat-icon.png";
import splitIcon from "@/assets/icons/split-icon.png";
import mergeIcon from "@/assets/icons/merge-icon.png";
import dineInIcon from "@/assets/icons/dine-in.png";
import cashRegisterIcon from "@/assets/icons/cash-register.png";
import printIcon from "@/assets/icons/print-icon.svg";
import cashRegisterSvgIcon from "@/assets/icons/cash-register-icon.svg";

// New order type icons
import dineInSvg from "@/assets/icons/dine-in-2.svg";
import takeOutSvg from "@/assets/icons/take-out-2.svg";
import deliverySvg from "@/assets/icons/delivery-2.svg";
import driveThruSvg from "@/assets/icons/drive-thru-2.svg";
import phoneInSvg from "@/assets/icons/phone-in-2.svg";
import scheduledSvg from "@/assets/icons/scheduled-2.svg";
import banquetSvg from "@/assets/icons/banquet-2.svg";
import curbSideSvg from "@/assets/icons/curb-side-2.svg";
import customSvg from "@/assets/icons/custom-2.svg";
import tableOrderSvg from "@/assets/icons/table-order-2.svg";

// Order type icon component
const OrderTypeIcon = ({ type, size = "default" }: { type: string; size?: "small" | "default" }) => {
  const iconSize = size === "small" ? "w-3.5 h-3.5" : "w-4 h-4";
  
  const iconMap: Record<string, string> = {
    "Dine-In": dineInSvg,
    "Takeout": takeOutSvg,
    "Take Out": takeOutSvg,
    "Delivery": deliverySvg,
    "Drive Thru": driveThruSvg,
    "Phone-In": phoneInSvg,
    "Scheduled": scheduledSvg,
    "Banquet": banquetSvg,
    "Curb Side": curbSideSvg,
    "Custom": customSvg,
    "Table Order": tableOrderSvg,
    "Bar": dineInSvg,
  };

  const src = iconMap[type] || tableOrderSvg;
  return <img src={src} alt={type} className={`${iconSize} object-contain`} />;
};

// Order item interface
interface OrderItem {
  qty: number;
  name: string;
  price: number;
  seats: number[];
  modifiers: string[];
}

interface PaymentEntry {
  method: string; // "Visa", "Amex", "Cash", "Mastercard", etc.
  last4?: string; // last 4 digits for cards
  amount: number;
}

// Guest order interface with linked items
interface GuestOrder {
  id: string;
  name: string;
  phone: string;
  partySize: number;
  time: string;
  timer: string;
  server: string;
  check: string;
  paymentType: string;
  payments?: PaymentEntry[];
  revenueCenter: string;
  status: string;
  notes: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  serviceCharge: number;
  tax: number;
  tip: number;
  total: number;
  table: string;
  orderType: string;
}

// Mock all orders data
const allOrders: GuestOrder[] = [
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
    orderType: "Bar",
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
  // Drive Thru ticket
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
  // Phone-In ticket
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
  // Scheduled ticket
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
  // Banquet ticket
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
  // Curb Side ticket
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
  // Custom Order ticket
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
  // Another Table Order ticket
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

// Helper function to format price
const formatPrice = (price: number) => `$${price.toFixed(2)}`;

// Helper function to get order items for display
const getOrderItems = (order: GuestOrder) => order.items.map(item => ({
  ...item,
  price: formatPrice(item.price * item.qty)
}));

// Format duration from timer string
const formatDuration = (timer: string): string => {
  if (timer.includes("Hrs")) return timer.replace("Hrs", "Hrs").trim();
  // Parse MM:SS format
  const parts = timer.split(":");
  if (parts.length === 2) {
    const mins = parseInt(parts[0]);
    const secs = parseInt(parts[1]);
    const totalMins = mins * 60 + secs; // This is actually mins:secs
    if (totalMins === 0) return "01:26 Min";
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')} Min`;
  }
  return timer;
};

// Format payment display
const formatPaymentDisplay = (guest: GuestOrder): string => {
  if (guest.payments && guest.payments.length > 0) {
    const first = guest.payments[0];
    const label = first.last4 ? `${first.method} •••• ${first.last4}` : first.method;
    return label;
  }
  if (guest.paymentType === "--" || guest.paymentType === "") return "Un Paid";
  if (guest.paymentType === "Cash") return "Cash";
  if (guest.paymentType === "Credit Card") return "Visa •••• 1234";
  return guest.paymentType;
};

// Get payment badge color
const getPaymentBadgeColor = (method: string): string => {
  switch (method.toLowerCase()) {
    case "visa": return "#1A1F71";
    case "amex": return "#006FCF";
    case "mastercard": return "#EB001B";
    case "cash": return "#22C55E";
    default: return "#555";
  }
};

// Payment method badge icon text
const getPaymentBadgeText = (method: string): string => {
  switch (method.toLowerCase()) {
    case "visa": return "VISA";
    case "amex": return "AMEX";
    case "mastercard": return "MC";
    case "cash": return "$";
    default: return method.charAt(0).toUpperCase();
  }
};

// Get paid amount (secondary line)
const getPaidAmount = (guest: GuestOrder): number => {
  if (guest.status === "PAID" && guest.tip > 0) return guest.tip;
  if (guest.status === "PAID") return guest.total * 0.1; // partial display
  return 0;
};

// Status badge colors
const getStatusBadgeStyle = (status: string): { color: string; bg: string } => {
  switch (status) {
    case "ORDERING": return { color: '#F97316', bg: 'rgba(249, 115, 22, 0.15)' };
    case "PAID": return { color: '#22C55E', bg: 'rgba(34, 197, 94, 0.15)' };
    case "UNPAID": return { color: '#EF4444', bg: 'rgba(239, 68, 68, 0.15)' };
    case "COMPLETED": return { color: '#22C55E', bg: 'rgba(34, 197, 94, 0.15)' };
    default: return { color: '#fff', bg: 'rgba(255,255,255,0.1)' };
  }
};

const filters = ["All", "Open", "Completed", "Paid", "Unpaid"];

const Tickets = () => {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState("All");
  const [selectedGuest, setSelectedGuest] = useState(allOrders[0]);
  const [selectedSeats, setSelectedSeats] = useState<number[]>([1, 2, 3, 4]);
  const [showMobileOrderPanel, setShowMobileOrderPanel] = useState(false);
  const [showFilterIcons, setShowFilterIcons] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Swipe state for mobile cards
  const [swipeStates, setSwipeStates] = useState<Record<string, number>>({});
  const swipeStatesRef = useRef<Record<string, number>>({});
  const isDraggingRef = useRef(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const startOffsetX = useRef(0);
  const currentCardId = useRef<string | null>(null);
  const currentGuest = useRef<GuestOrder | null>(null);
  const hasMoved = useRef(false);
  const suppressNextClickRef = useRef(false);
  const swipeWidth = -120;
  const MOVE_THRESHOLD = 10;

  const isInteractiveElement = (target: EventTarget | null) => 
    target instanceof Element && !!target.closest("button,a,input,textarea,select,[role='button']");

  const setCardSwipeX = (cardId: string, x: number) => {
    setSwipeStates(prev => {
      const next = { ...prev, [cardId]: x };
      swipeStatesRef.current = next;
      return next;
    });
  };

  const handleSwipeStart = (e: React.TouchEvent | React.MouseEvent, guest: GuestOrder) => {
    if (isInteractiveElement(e.target)) {
      isDraggingRef.current = false;
      currentCardId.current = null;
      currentGuest.current = null;
      hasMoved.current = false;
      return;
    }
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    startX.current = clientX;
    startY.current = clientY;
    currentCardId.current = guest.id;
    currentGuest.current = guest;
    hasMoved.current = false;
    isDraggingRef.current = true;
    startOffsetX.current = swipeStatesRef.current[guest.id] ?? swipeStates[guest.id] ?? 0;
  };

  const handleSwipeMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDraggingRef.current || !currentCardId.current) return;
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    const diffX = clientX - startX.current;
    const diffY = clientY - startY.current;
    const absX = Math.abs(diffX);
    const absY = Math.abs(diffY);

    if (absX > MOVE_THRESHOLD || absY > MOVE_THRESHOLD) hasMoved.current = true;
    const isHorizontalGesture = absX > absY;
    if (!isHorizontalGesture) return;

    if ("touches" in e && absX > MOVE_THRESHOLD) {
      e.preventDefault();
    }
    const rawX = startOffsetX.current + diffX;
    const newX = Math.max(swipeWidth, Math.min(rawX, 0));
    setCardSwipeX(currentCardId.current, newX);
  };

  const handleSwipeEnd = (triggerTap: boolean, e?: React.TouchEvent | React.MouseEvent, guestOverride?: GuestOrder) => {
    const guest = guestOverride ?? currentGuest.current;
    const cardId = currentCardId.current ?? guest?.id ?? null;
    const isInteractive = isInteractiveElement(e?.target ?? null);
    const wasSwipedOpen = cardId ? (swipeStatesRef.current[cardId] ?? 0) < -20 : false;
    const didSwipe = hasMoved.current;

    if (cardId && !isInteractive) {
      const currentX = swipeStatesRef.current[cardId] ?? 0;
      const snapTo = currentX < swipeWidth / 2 ? swipeWidth : 0;
      setCardSwipeX(cardId, snapTo);
    }
    isDraggingRef.current = false;
    currentCardId.current = null;
    currentGuest.current = null;

    if (triggerTap && !didSwipe && guest && !isInteractive && !wasSwipedOpen) {
      suppressNextClickRef.current = true;
      handleMobileOrderClick(guest);
    } else {
      suppressNextClickRef.current = true;
    }
    hasMoved.current = false;
  };

  const handleCardClick = (guest: GuestOrder) => {
    if (suppressNextClickRef.current) {
      suppressNextClickRef.current = false;
      return;
    }
    handleMobileOrderClick(guest);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ORDERING": return "text-orange-400";
      case "PAID": return "text-green-500";
      case "UNPAID": return "text-red-400";
      case "COMPLETED": return "text-green-500";
      default: return "text-white";
    }
  };

  const getFilterCount = (filter: string) => {
    if (filter === "All") return allOrders.length;
    if (filter === "Open") return allOrders.filter(g => g.status === "ORDERING").length;
    if (filter === "Completed") return allOrders.filter(g => g.status === "COMPLETED").length;
    if (filter === "Paid") return allOrders.filter(g => g.status === "PAID" || g.paymentType !== "--").length;
    if (filter === "Unpaid") return allOrders.filter(g => g.status === "UNPAID" || g.paymentType === "--").length;
    return 0;
  };

  const filteredOrders = (() => {
    let orders = activeFilter === "All" ? allOrders : allOrders.filter(guest => {
      switch (activeFilter) {
        case "Open": return guest.status === "ORDERING";
        case "Completed": return guest.status === "COMPLETED";
        case "Paid": return guest.status === "PAID" || guest.paymentType !== "--";
        case "Unpaid": return guest.status === "UNPAID" || guest.paymentType === "--";
        default: return true;
      }
    });
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      orders = orders.filter(g =>
        g.name.toLowerCase().includes(q) ||
        g.id.includes(q) ||
        g.check.includes(q) ||
        g.table.toLowerCase().includes(q) ||
        g.server.toLowerCase().includes(q)
      );
    }
    return orders;
  })();

  const toggleSeat = (seat: number) => {
    setSelectedSeats(prev => prev.includes(seat) ? prev.filter(s => s !== seat) : [...prev, seat]);
  };

  const handleMobileOrderClick = (guest: GuestOrder) => {
    // Navigate to TableOrderDetails for Table Order type tickets
    if (guest.orderType === "Table Order" && guest.table !== "--") {
      navigate(`/tableorder/${guest.table}`);
      return;
    }
    setSelectedGuest(guest);
    setShowMobileOrderPanel(true);
  };

  // Desktop click handler that navigates for Table Orders
  const handleDesktopOrderClick = (guest: GuestOrder) => {
    if (guest.orderType === "Table Order" && guest.table !== "--") {
      navigate(`/tableorder/${guest.table}`);
      return;
    }
    setSelectedGuest(guest);
  };

  // ===== TICKET CARD COMPONENT =====
  const TicketCard = ({ 
    guest, 
    isSelected, 
    onSelect, 
    compact = false, 
    showActions = true,
    showSwipe = false
  }: { 
    guest: GuestOrder; 
    isSelected: boolean; 
    onSelect: () => void; 
    compact?: boolean;
    showActions?: boolean;
    showSwipe?: boolean;
  }) => {
    const statusStyle = getStatusBadgeStyle(guest.status);
    const checkId = guest.check !== "--" ? guest.check.slice(-3) : "000";
    // Table display handled inline per order type
    const duration = formatDuration(guest.timer);
    const paymentDisplay = formatPaymentDisplay(guest);
    const paidAmount = getPaidAmount(guest);

    const cardContent = (
      <div className={`flex items-stretch w-full ${compact ? 'gap-1.5' : 'gap-0'}`}>
        {/* LEFT BADGE: Ticket Number + ID */}
        <div className={`flex-shrink-0 flex items-center ${compact ? 'px-1.5 py-1.5' : 'px-2.5 py-2'}`}>
          <div className={`flex flex-col items-center justify-center rounded-lg border border-neutral-600 bg-neutral-800/80 ${compact ? 'w-10 h-12 gap-0' : 'w-12 h-14 gap-0.5'}`}>
            <span className={`font-bold text-white ${compact ? 'text-base' : 'text-lg'}`}>{guest.id}</span>
            <span className="text-[10px] text-neutral-400 font-medium">{checkId}</span>
          </div>
        </div>

        {/* MIDDLE CONTENT */}
        <div className={`flex-1 min-w-0 ${compact ? 'py-1.5' : 'py-2'} flex flex-col justify-center`}>
          {/* Row 1: Name (+ Table for Table Orders) */}
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className={`text-white font-semibold truncate ${compact ? 'text-xs' : 'text-sm'}`}>{guest.name}</span>
            {guest.orderType === "Table Order" && guest.table !== "--" && (
              <>
                <span className="text-neutral-500 text-xs">·</span>
                <span className={`text-white/70 truncate ${compact ? 'text-xs' : 'text-sm'}`}>{guest.table}</span>
              </>
            )}
          </div>

          {/* Row 2: Differs by order type */}
          <div className="flex items-center gap-1.5 text-neutral-400 mb-0.5">
            <OrderTypeIcon type={guest.orderType} size="small" />
            {guest.orderType === "Table Order" ? (
              <span className={`${compact ? 'text-[10px]' : 'text-xs'}`}>
                {guest.partySize > 1 ? `Party of ${guest.partySize}, ` : ''}{guest.time} | {duration}
              </span>
            ) : (
              <span className={`${compact ? 'text-[10px]' : 'text-xs'}`}>
                {guest.orderType}, {guest.time} | {duration}
              </span>
            )}
          </div>

          {/* Row 3: Revenue Center */}
          <span className={`text-neutral-500 ${compact ? 'text-[10px]' : 'text-xs'}`}>{guest.revenueCenter}</span>
        </div>

        {/* SERVER & PAYMENT INFO */}
        <div className={`flex-shrink-0 ${compact ? 'w-[100px] py-1.5' : 'w-[140px] py-2'} flex flex-col justify-center text-right pr-2`}>
          <span className={`text-white font-medium truncate ${compact ? 'text-[11px]' : 'text-xs'}`}>{guest.server}</span>
          {guest.payments && guest.payments.length > 1 ? (
            <Popover>
              <PopoverTrigger asChild>
                <button 
                  className={`flex items-center justify-end gap-1 ${compact ? 'text-[10px]' : 'text-[11px]'} text-neutral-400 hover:text-neutral-200 transition-colors`}
                  onClick={e => e.stopPropagation()}
                >
                  <span 
                    className="inline-flex items-center justify-center rounded px-1 py-px text-[8px] font-bold text-white leading-none"
                    style={{ backgroundColor: getPaymentBadgeColor(guest.payments[0].method) }}
                  >
                    {getPaymentBadgeText(guest.payments[0].method)}
                  </span>
                  <span className="truncate">{paymentDisplay}</span>
                  <span className="text-blue-400 font-medium whitespace-nowrap">+{guest.payments.length - 1} more</span>
                </button>
              </PopoverTrigger>
              <PopoverContent 
                align="end" 
                className="w-[260px] p-0 border border-neutral-700 rounded-xl shadow-xl"
                style={{ backgroundColor: '#2A2A2E' }}
                onClick={e => e.stopPropagation()}
              >
                <div className="px-3 py-2 border-b border-neutral-700">
                  <span className="text-white/80 text-xs font-semibold">Payment Methods</span>
                </div>
                <div className="flex flex-col py-1">
                  {guest.payments.map((p, i) => (
                    <div key={i} className="flex items-center gap-2.5 px-3 py-1.5">
                      <span 
                        className="inline-flex items-center justify-center rounded px-1.5 py-0.5 text-[9px] font-bold text-white leading-none min-w-[32px]"
                        style={{ backgroundColor: getPaymentBadgeColor(p.method) }}
                      >
                        {getPaymentBadgeText(p.method)}
                      </span>
                      <span className="text-white text-sm flex-1">
                        {p.last4 ? `${p.method}  ••••  ${p.last4}` : p.method}
                      </span>
                      <span className="text-white text-sm font-medium">{formatPrice(p.amount)}</span>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          ) : (
            <span className={`text-neutral-400 truncate ${compact ? 'text-[10px]' : 'text-[11px]'}`}>{paymentDisplay}</span>
          )}
        </div>

        {/* RIGHT: Status + Amount */}
        <div className={`flex-shrink-0 flex flex-col items-end justify-center ${compact ? 'pr-1.5 py-1.5 w-[85px]' : 'pr-2 py-2 w-[100px]'}`}>
          <span 
            className={`font-bold uppercase tracking-wide ${compact ? 'text-[10px] mb-0.5' : 'text-xs mb-1'}`}
            style={{ color: statusStyle.color }}
          >
            {guest.status}
          </span>
          <span className={`text-white font-bold ${compact ? 'text-sm' : 'text-base'}`}>
            {formatPrice(guest.total)}
          </span>
          <span className={`text-neutral-500 ${compact ? 'text-[10px]' : 'text-xs'}`}>
            {formatPrice(paidAmount)}
          </span>
        </div>

        {/* FAR RIGHT: Action Strip - Status dependent */}
        {showActions && (
          <div className="flex-shrink-0 flex flex-col rounded-r-xl overflow-hidden border-l border-neutral-700/50">
            {guest.status === "PAID" || guest.status === "COMPLETED" ? (
              <>
                {/* Print icon */}
                <button 
                  className="flex-1 px-2.5 flex items-center justify-center hover:bg-neutral-500/50 transition-colors"
                  style={{ background: 'linear-gradient(180deg, #5A5A5A 0%, #3A3A3A 100%)' }}
                  onClick={e => { e.stopPropagation(); }}
                >
                  <img src={printIcon} alt="Print" className="w-4 h-4 object-contain" />
                </button>
                {/* Cash Register icon */}
                <button 
                  className="flex-1 px-2.5 flex items-center justify-center hover:bg-neutral-500/50 transition-colors border-t border-neutral-600/50"
                  style={{ background: 'linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)' }}
                  onClick={e => { e.stopPropagation(); }}
                >
                  <img src={cashRegisterSvgIcon} alt="Register" className="w-4 h-4 object-contain" />
                </button>
              </>
            ) : (
              <>
                {/* Merge icon (orange) */}
                <button 
                  className="flex-1 px-2.5 flex items-center justify-center hover:bg-neutral-600/50 transition-colors"
                  style={{ background: 'linear-gradient(180deg, #FF9E65 0%, #FF5E00 100%)' }}
                  onClick={e => { e.stopPropagation(); }}
                >
                  <img src={mergeIcon} alt="Merge" className="w-4 h-4 object-contain" />
                </button>
                {/* Transfer icon */}
                <button 
                  className="flex-1 px-2.5 flex items-center justify-center hover:bg-neutral-500/50 transition-colors border-t border-neutral-600/50"
                  style={{ background: 'linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)' }}
                  onClick={e => { e.stopPropagation(); }}
                >
                  <img src={shareOrderIcon} alt="Transfer" className="w-4 h-4 object-contain brightness-0" />
                </button>
              </>
            )}
          </div>
        )}
      </div>
    );

    if (showSwipe) {
      return (
        <div className="relative rounded-xl cursor-pointer transition-all overflow-hidden bg-black">
          {/* Swipe Action Buttons */}
          <div className={`absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2 md:hidden transition-opacity duration-200 ${(swipeStates[guest.id] || 0) < -20 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <button className="w-10 h-10 flex items-center justify-center rounded-full transition-colors" style={{ backgroundColor: '#666666' }}>
              <img src={mergeIcon} alt="Merge" className="w-5 h-5 object-contain" />
            </button>
            <button className="w-10 h-10 flex items-center justify-center rounded-full transition-colors" style={{ background: 'linear-gradient(180deg, #FF9E65 0%, #FF5E00 100%)' }}>
              <img src={shareOrderIcon} alt="Transfer" className="w-5 h-5 object-contain" />
            </button>
          </div>

          {/* Swipeable card content */}
          <div 
            className="relative transition-transform duration-200 ease-out md:transform-none bg-black rounded-xl select-none" 
            style={{ transform: `translateX(${swipeStates[guest.id] || 0}px)`, transition: isDraggingRef.current && currentCardId.current === guest.id ? "none" : "transform 0.2s ease-out" }} 
            onTouchStart={e => handleSwipeStart(e, guest)} 
            onTouchMove={handleSwipeMove} 
            onTouchEnd={e => handleSwipeEnd(true, e, guest)} 
            onTouchCancel={e => handleSwipeEnd(false, e, guest)} 
            onMouseDown={e => handleSwipeStart(e, guest)} 
            onMouseMove={handleSwipeMove} 
            onMouseUp={e => handleSwipeEnd(true, e, guest)} 
            onMouseLeave={e => handleSwipeEnd(false, e, guest)} 
            onClick={() => handleCardClick(guest)}
          >
            <div className={`border rounded-xl overflow-hidden transition-all ${isSelected ? 'border-white/40' : 'border-neutral-700/60 hover:border-neutral-500/60'}`} style={{ backgroundColor: '#1B1C20' }}>
              {cardContent}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div 
        onClick={onSelect}
        className={`rounded-xl border cursor-pointer transition-all overflow-hidden hover:shadow-lg hover:shadow-black/20 ${isSelected ? "border-white/40 shadow-md shadow-black/30" : "border-neutral-700/60 hover:border-neutral-500/60"}`} 
        style={{ backgroundColor: '#1B1C20' }}
      >
        {cardContent}
      </div>
    );
  };

  // Mobile Order Panel Component
  const MobileOrderPanel = () => (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-neutral-700/50">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowMobileOrderPanel(false)} 
            className="p-1.5 rounded-full hover:opacity-80 transition-opacity" 
            style={{ background: "#7575754D", boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)" }}
          >
            <span className="text-white text-lg">←</span>
          </button>
          <span className="text-white font-medium">{selectedGuest.name}</span>
        </div>
        <div className="flex items-center gap-3 text-white/50 text-sm">
          <div className="flex items-center gap-1">
            <Phone className="w-3 h-3" />
            <span>{selectedGuest.phone || "N/A"}</span>
          </div>
          <div className="flex items-center gap-1">
            <span>⚡</span>
            <span>{selectedGuest.time}</span>
          </div>
        </div>
      </div>

      {/* Table Order Info */}
      <div className="px-3 py-2 border-b border-neutral-700/50">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 bg-white/10 text-white text-xs rounded">TABLE ORDER</span>
            <span className="text-white font-bold">{selectedGuest.id}</span>
          </div>
          <div className="flex items-center gap-2">
            <img src={runnerIcon} alt="Runner" className="w-4 h-4 opacity-60" />
            <span className="text-white/50 text-sm">{selectedGuest.server}</span>
          </div>
        </div>
        
        {/* Seat Buttons */}
        <div className="flex items-center gap-2">
          <button className="p-1.5 bg-white/10 rounded hover:bg-white/20 transition-colors">
            <img src={seatIcon} alt="Seat" className="w-4 h-4" />
          </button>
          {[1, 2, 3, 4].map(seat => (
            <button 
              key={seat} 
              onClick={() => toggleSeat(seat)} 
              className={`w-7 h-7 rounded text-sm font-medium transition-colors ${selectedSeats.includes(seat) ? "bg-white text-black" : "bg-white/10 text-white hover:bg-white/20"}`}
            >
              {seat}
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div className="px-3 py-2 border-b border-neutral-700/50">
        <div className="flex items-center gap-2 text-white/50 text-sm bg-white/10 p-2 rounded-lg">
          <span>📝</span>
          <span>{selectedGuest.notes || "No notes"}</span>
        </div>
      </div>

      {/* Order Items */}
      <ScrollArea className="flex-1 px-3">
        <div className="py-2 space-y-2">
          {getOrderItems(selectedGuest).map((item, index) => (
            <div key={index} className="p-3 bg-white/5 rounded-xl border border-white/10">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-2">
                  <span className="w-6 h-6 bg-white rounded flex items-center justify-center text-black text-sm font-bold">
                    {item.qty}
                  </span>
                  <div>
                    <span className="text-white font-medium text-sm">{item.name}</span>
                    {item.modifiers.length > 0 && (
                      <div className="mt-1 text-white/50 text-xs space-y-0.5">
                        {item.modifiers.map((mod, i) => <div key={i}>{mod}</div>)}
                      </div>
                    )}
                  </div>
                </div>
                <span className="text-white font-medium text-sm">{item.price}</span>
              </div>
              {item.seats.length > 0 && (
                <div className="flex items-center gap-1 mt-2">
                  <img src={seatIcon} alt="Seat" className="w-4 h-4 opacity-50" />
                  {item.seats.map(seat => (
                    <span key={seat} className="w-5 h-5 bg-white/10 rounded text-white text-xs flex items-center justify-center">
                      {seat}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        <ScrollBar orientation="vertical" />
      </ScrollArea>

      {/* Bottom Actions */}
      <div className="px-3 py-3 border-t border-neutral-700/50 flex items-center gap-2">
        <button className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center hover:bg-red-500 transition-colors">
          <img src={clearIcon} alt="Clear" className="w-4 h-4 brightness-0 invert" />
        </button>
        <button 
          className="px-4 py-2.5 rounded-full flex items-center gap-1 text-white text-sm font-medium" 
          style={{ background: "linear-gradient(180deg, #FF9E65 0%, #FF5E00 100%)" }}
        >
          <img src={fireIcon} alt="Fire" className="w-4 h-4 brightness-0 invert" />
          <span>FIRE</span>
        </button>
        <button 
          className="flex-1 py-2.5 rounded-full text-black text-sm font-bold" 
          style={{ background: "linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)" }}
        >
          CHARGE {formatPrice(selectedGuest.total)}
        </button>
      </div>
    </div>
  );

  // ===== FILTER TABS COMPONENT =====
  const FilterTabs = ({ style = "default" }: { style?: "default" | "glass" }) => (
    <div className="flex items-center gap-2 p-3 overflow-x-auto scrollbar-hide">
      {filters.map(filter => {
        const count = getFilterCount(filter);
        return (
          <button 
            key={filter} 
            onClick={() => setActiveFilter(filter)} 
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-all ${activeFilter === filter ? "text-black" : "text-white"}`} 
            style={activeFilter === filter 
              ? { background: "linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)" } 
              : style === "glass" 
                ? { background: "#7575754D", boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)" }
                : { background: "#1B1C20" }
            }
          >
            <span>{filter}</span>
            {count > 0 && (
              <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${activeFilter === filter ? "bg-black text-white" : "bg-neutral-800"}`}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );

  // Filter icon bar items
  const filterIconItems = [
    { icon: DollarSign, label: "Amount" },
    { icon: CalendarDays, label: "Date" },
    { icon: UsersRound, label: "Party" },
    { icon: ClipboardList, label: "Order Type" },
    { icon: CircleDollarSign, label: "Price" },
    { icon: Wallet, label: "Payment" },
  ];

  // ===== HEADER COMPONENT =====
  const TicketHeader = () => (
    <div className="relative flex items-center justify-between p-2 border-b border-neutral-700/50">
      {showSearch ? (
        <>
          <div className="flex items-center gap-2 flex-1 mr-2">
            <Search className="w-4 h-4 text-neutral-400 flex-shrink-0" />
            <input
              autoFocus
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by name, order ID, or check..."
              className="bg-transparent text-white text-sm placeholder:text-neutral-500 outline-none w-full"
            />
          </div>
          <button 
            className="p-2 rounded-full hover:opacity-80 transition-opacity flex-shrink-0"
            style={{ background: "#7575754D", boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)" }}
            onClick={() => { setShowSearch(false); setSearchQuery(""); }}
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </>
      ) : (
        <>
          <span className="text-white font-semibold text-lg pl-2">Tickets</span>
          <div className="flex items-center gap-1.5 z-10">
            {showFilterIcons && (
              <>
                {filterIconItems.map(item => (
                  <button 
                    key={item.label}
                    className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-neutral-600 transition-colors border border-neutral-600/50"
                    style={{ backgroundColor: '#2A2A2E' }}
                    title={item.label}
                  >
                    <item.icon className="w-4 h-4 text-white/80" />
                  </button>
                ))}
                <button 
                  className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-neutral-600 transition-colors"
                  style={{ backgroundColor: '#2A2A2E' }}
                  onClick={() => setShowFilterIcons(false)}
                >
                  <X className="w-4 h-4 text-white/80" />
                </button>
              </>
            )}
            {!showFilterIcons && (
              <button 
                className="p-2 rounded-full hover:opacity-80 transition-opacity"
                style={{ background: "#7575754D", boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)" }}
                onClick={() => setShowFilterIcons(true)}
              >
                <SlidersHorizontal className="w-4 h-4 text-white" />
              </button>
            )}
            <button 
              className="p-2 rounded-full hover:opacity-80 transition-opacity" 
              style={{ background: "#7575754D", boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)" }}
              onClick={() => setShowSearch(true)}
            >
              <Search className="w-4 h-4 text-white" />
            </button>
          </div>
        </>
      )}
    </div>
  );

  // ===== RIGHT PANEL (shared between desktop & tablet) =====
  const RightPanel = ({ width, isTablet = false }: { width: string; isTablet?: boolean }) => (
    <div className={`${width} flex flex-col m-2 ml-0`}>
      {/* Guest Header */}
      <div className={`px-2 ${isTablet ? 'py-2' : 'py-3'}`}>
        <div className="flex items-center justify-between mb-2">
          <span className={`text-white font-medium ${isTablet ? 'text-sm' : ''}`}>{selectedGuest.name}</span>
          <div className={`flex items-center gap-${isTablet ? '2' : '3'} text-white/50 ${isTablet ? 'text-xs' : 'text-sm'}`}>
            {!isTablet && (
              <div className="flex items-center gap-1">
                <Phone className="w-3 h-3" />
                <span>{selectedGuest.phone || "N/A"}</span>
              </div>
            )}
            {isTablet && <Phone className="w-3 h-3" />}
            <div className="flex items-center gap-1">
              <span>⚡</span>
              <span>{selectedGuest.time}</span>
            </div>
          </div>
        </div>
        <div className={`flex gap-${isTablet ? '1' : '2'} ${isTablet ? 'flex-wrap' : ''}`}>
          {["Add Item", "Discount", "Receipt", ...(isTablet ? [] : ["No Tax", "Register"])].map(label => (
            <button key={label} className={`${isTablet ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-xs'} bg-neutral-700 text-white rounded-full hover:bg-neutral-600 transition-colors`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Panel Box */}
      <div className="flex-1 flex flex-col rounded-[10px] overflow-hidden" style={{ background: "#7575754D", boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)" }}>
        {/* Table Order Info */}
        <div className={`${isTablet ? 'px-3 py-2' : 'px-4 py-3'} border-b border-white/10`}>
          <div className={`flex items-center justify-between ${isTablet ? 'mb-1' : 'mb-2'}`}>
            <div className="flex items-center gap-2">
              <span className={`${isTablet ? 'px-1.5 py-0.5' : 'px-2 py-1'} bg-white/10 text-white text-xs rounded`}>{isTablet ? 'ORDER' : 'TABLE ORDER'}</span>
              <span className={`text-white font-bold ${isTablet ? 'text-sm' : ''}`}>{selectedGuest.id}</span>
            </div>
            <div className="flex items-center gap-2">
              {!isTablet && <img src={shareSeatsIcon} alt="Seats" className="w-4 h-4 opacity-60" />}
              <span className={`text-white/50 ${isTablet ? 'text-xs' : 'text-sm'}`}>{selectedGuest.server}</span>
            </div>
          </div>
          
          {/* Seat Buttons */}
          <div className={`flex items-center gap-${isTablet ? '1' : '2'}`}>
            <button className={`${isTablet ? 'p-1' : 'p-1.5'} bg-white/10 rounded hover:bg-white/20 transition-colors`}>
              <img src={seatIcon} alt="Seat" className={`${isTablet ? 'w-3 h-3' : 'w-4 h-4'}`} />
            </button>
            {!isTablet && (
              <button className="p-1.5 bg-white/10 rounded hover:bg-white/20 transition-colors">
                <img src={splitIcon} alt="Split" className="w-4 h-4" />
              </button>
            )}
            {[1, 2, 3, 4].map(seat => (
              <button 
                key={seat} 
                onClick={() => toggleSeat(seat)} 
                className={`${isTablet ? 'w-6 h-6 text-xs' : 'w-7 h-7 text-sm'} rounded font-medium transition-colors ${selectedSeats.includes(seat) ? "bg-white text-black" : "bg-white/10 text-white hover:bg-white/20"}`}
              >
                {seat}
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        {(isTablet ? selectedGuest.notes : true) && (
          <div className={`${isTablet ? 'px-3 py-2' : 'px-4 py-3'} border-b border-white/10`}>
            <div className={`flex items-center gap-2 text-white/50 ${isTablet ? 'text-xs' : 'text-sm'} bg-white/10 ${isTablet ? 'p-1.5' : 'p-2'} rounded-lg`}>
              <span>📝</span>
              <span className={isTablet ? 'truncate' : ''}>{selectedGuest.notes || "No notes"}</span>
            </div>
          </div>
        )}

        {/* Order Items */}
        <ScrollArea className={`flex-1 ${isTablet ? 'px-3' : 'px-4'}`}>
          <div className={`py-2 space-y-${isTablet ? '1.5' : '2'}`}>
            {getOrderItems(selectedGuest).map((item, index) => (
              <div key={index} className={`${isTablet ? 'p-2 rounded-lg' : 'p-3 rounded-xl'} bg-white/5 border border-white/10`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-2">
                    <span className={`${isTablet ? 'w-5 h-5 text-xs' : 'w-6 h-6 text-sm'} bg-white rounded flex items-center justify-center text-black font-bold`}>
                      {item.qty}
                    </span>
                    <div>
                      <span className={`text-white font-medium ${isTablet ? 'text-sm' : ''}`}>{item.name}</span>
                      {item.modifiers.length > 0 && (
                        <div className={`mt-${isTablet ? '0.5' : '1'} text-white/50 ${isTablet ? 'text-xs' : 'text-sm'} space-y-0.5`}>
                          {(isTablet ? item.modifiers.slice(0, 2) : item.modifiers).map((mod, i) => <div key={i}>{mod}</div>)}
                          {isTablet && item.modifiers.length > 2 && <div>+{item.modifiers.length - 2} more</div>}
                        </div>
                      )}
                    </div>
                  </div>
                  <span className={`text-white font-medium ${isTablet ? 'text-sm' : ''}`}>{item.price}</span>
                </div>
                {!isTablet && item.seats.length > 0 && (
                  <div className="flex items-center gap-1 mt-2">
                    <img src={seatIcon} alt="Seat" className="w-4 h-4 opacity-50" />
                    {item.seats.map(seat => (
                      <span key={seat} className="w-5 h-5 bg-white/10 rounded text-white text-xs flex items-center justify-center">
                        {seat}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          <ScrollBar orientation="vertical" />
        </ScrollArea>

        {/* Order Summary */}
        <div className="p-2 border-t border-white/10 flex-shrink-0">
          <div className={`text-xs rounded px-2 ${isTablet ? 'py-1' : 'py-1.5'} space-y-0.5`} style={{ background: '#7575754D', ...(isTablet ? {} : { boxShadow: 'inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)' }) }}>
            <div className="flex justify-between gap-3">
              <span className="text-white">Sub Total: <span className="font-medium">{formatPrice(selectedGuest.subtotal)}</span></span>
              <span className="text-white">Discount: <span className="font-medium">{formatPrice(selectedGuest.discount)}</span></span>
            </div>
            {!isTablet && (
              <div className="flex justify-between gap-3">
                <span className="text-white">Service Charge: <span className="font-medium">{formatPrice(selectedGuest.serviceCharge)}</span></span>
                <span className="text-white">Tax: <span className="font-medium">{formatPrice(selectedGuest.tax)}</span></span>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Actions */}
        <div className={`${isTablet ? 'px-3 py-2' : 'px-4 py-3'} border-t border-white/10 flex items-center gap-2`}>
          <button className={`${isTablet ? 'w-7 h-7' : 'w-8 h-8'} rounded-full bg-red-600 flex items-center justify-center hover:bg-red-500 transition-colors`}>
            <img src={clearIcon} alt="Clear" className={`${isTablet ? 'w-3 h-3' : 'w-4 h-4'} brightness-0 invert`} />
          </button>
          <button 
            className={`${isTablet ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'} rounded-full flex items-center gap-1 text-white font-medium`}
            style={{ background: "linear-gradient(180deg, #FF9E65 0%, #FF5E00 100%)" }}
          >
            <img src={fireIcon} alt="Fire" className={`${isTablet ? 'w-3 h-3' : 'w-4 h-4'} brightness-0 invert`} />
            <span>FIRE</span>
          </button>
          <button 
            className={`flex-1 ${isTablet ? 'py-1.5 text-xs' : 'py-2 text-sm'} rounded-full text-black font-bold`}
            style={{ background: "linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)" }}
          >
            CHARGE {formatPrice(selectedGuest.total)}
          </button>
        </div>
      </div>
    </div>
  );

  // Mobile Layout
  const MobileLayout = () => (
    <div className="flex flex-col h-full bg-black">
      <TicketHeader />
      <FilterTabs />

      {/* Guest Orders List */}
      <ScrollArea className="flex-1 px-3">
        <div className="space-y-2 pb-3">
          {filteredOrders.map(guest => (
            <TicketCard 
              key={guest.id}
              guest={guest} 
              isSelected={selectedGuest.id === guest.id} 
              onSelect={() => handleMobileOrderClick(guest)}
              compact
              showActions={false}
              showSwipe
            />
          ))}
        </div>
        <ScrollBar orientation="vertical" />
      </ScrollArea>

      {showMobileOrderPanel && <MobileOrderPanel />}
    </div>
  );

  // Desktop Layout
  const DesktopLayout = () => (
    <div className="flex h-full bg-black">
      {/* Left Panel - Order List */}
      <div className="flex flex-col flex-1 m-2 rounded-[20px] overflow-hidden">
        <TicketHeader />
        <FilterTabs style="glass" />

        <ScrollArea className="flex-1 px-3">
          <div className="space-y-2 pb-3">
            {filteredOrders.map(guest => (
              <TicketCard 
                key={guest.id}
                guest={guest} 
                isSelected={selectedGuest.id === guest.id} 
                onSelect={() => handleDesktopOrderClick(guest)}
                showActions
              />
            ))}
          </div>
          <ScrollBar orientation="vertical" />
        </ScrollArea>
      </div>

      <RightPanel width="w-[345px]" />
    </div>
  );

  // Tablet Layout
  const TabletLayout = () => (
    <div className="flex h-full bg-black">
      {/* Left Panel - Order List */}
      <div className="flex flex-col flex-1 m-2 rounded-[20px] overflow-hidden">
        <TicketHeader />
        <FilterTabs />

        <ScrollArea className="flex-1 px-3">
          <div className="space-y-2 pb-3">
            {filteredOrders.map(guest => (
              <TicketCard 
                key={guest.id}
                guest={guest} 
                isSelected={selectedGuest.id === guest.id} 
                onSelect={() => handleDesktopOrderClick(guest)}
                compact
                showActions
              />
            ))}
          </div>
          <ScrollBar orientation="vertical" />
        </ScrollArea>
      </div>

      <RightPanel width="w-[280px]" isTablet />
    </div>
  );

  // Responsive rendering
  return (
    <>
      {/* Mobile */}
      <div className="md:hidden h-full">
        <MobileLayout />
      </div>
      
      {/* Tablet */}
      <div className="hidden md:block lg:hidden h-full">
        <TabletLayout />
      </div>
      
      {/* Desktop */}
      <div className="hidden lg:block h-full">
        <DesktopLayout />
      </div>
    </>
  );
};

export default Tickets;
