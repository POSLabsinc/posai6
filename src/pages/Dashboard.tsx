import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Check, ChevronDown, Clock, Calendar as CalendarIcon, X, Users, Share2, Briefcase, Heart, GraduationCap, Shield, Star, Cake, MapPin, BadgeDollarSign, Tag, CreditCard, User, Gift, Link, QrCode, ArrowRightCircle, Banknote, Grid3X3, Delete, Printer, MessageSquare, Mail, CheckCircle, Truck, ShoppingBag, Clipboard, ExternalLink, Utensils, UtensilsCrossed, ArrowLeft, UserPlus, Search, Phone, AlertTriangle, RefreshCw, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Drawer, DrawerContent, DrawerClose } from "@/components/ui/drawer";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useIsMobile } from "@/hooks/use-mobile";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import fireIcon from "@/assets/icons/fire.png";
import itemNotesIcon from "@/assets/icons/item-notes.png";
import phoneIcon from "@/assets/icons/phone-icon.png";
import timeIcon from "@/assets/icons/time-icon.png";
import arrowRightIcon from "@/assets/icons/arrow-right.png";
import shareOrderIcon from "@/assets/icons/share-order.png";
import dineInIcon from "@/assets/icons/dine-in.png";
import chairWhiteIcon from "@/assets/icons/chair-white.png";
import saveIcon from "@/assets/icons/save.png";
import runnerIcon from "@/assets/icons/runner.png";
import { OrderNotesAutocomplete } from "@/components/OrderNotesAutocomplete";
import SwipeableCartItem from "@/components/SwipeableCartItem";

// Stats data by date filter
const statsData: Record<string, Array<{ label: string; value: string; change: string; isUp: boolean; icon?: string; hasCheckbox?: boolean }>> = {
  "Today": [
    { label: "Total Sale", value: "$ 1,400.00", change: "2.2%", isUp: true, icon: "💵" },
    { label: "Total Tip", value: "$ 285.00", change: "2.2%", isUp: true, icon: "💵" },
    { label: "Total Hours", value: "6h 28min", change: "0.5%", isUp: false, icon: "clock" },
    { label: "Ordering", value: "12", change: "2.5%", isUp: true, icon: "clock" },
    { label: "Ready to Served", value: "5", change: "1%", isUp: false, hasCheckbox: true },
    { label: "Ready to Served", value: "8", change: "1%", isUp: false, hasCheckbox: true },
  ],
  "Yesterday": [
    { label: "Total Sale", value: "$ 1,250.00", change: "1.8%", isUp: false, icon: "💵" },
    { label: "Total Tip", value: "$ 210.00", change: "1.5%", isUp: false, icon: "💵" },
    { label: "Total Hours", value: "5h 45min", change: "1.2%", isUp: true, icon: "clock" },
    { label: "Ordering", value: "9", change: "1.0%", isUp: false, icon: "clock" },
    { label: "Ready to Served", value: "3", change: "2%", isUp: true, hasCheckbox: true },
    { label: "Ready to Served", value: "6", change: "0.5%", isUp: true, hasCheckbox: true },
  ],
  "This Week": [
    { label: "Total Sale", value: "$ 8,750.00", change: "5.5%", isUp: true, icon: "💵" },
    { label: "Total Tip", value: "$ 1,420.00", change: "4.2%", isUp: true, icon: "💵" },
    { label: "Total Hours", value: "42h 15min", change: "2.1%", isUp: true, icon: "clock" },
    { label: "Ordering", value: "78", change: "3.8%", isUp: true, icon: "clock" },
    { label: "Ready to Served", value: "28", change: "1.5%", isUp: true, hasCheckbox: true },
    { label: "Ready to Served", value: "45", change: "2.2%", isUp: true, hasCheckbox: true },
  ],
  "Last Week": [
    { label: "Total Sale", value: "$ 7,920.00", change: "3.2%", isUp: false, icon: "💵" },
    { label: "Total Tip", value: "$ 1,180.00", change: "2.8%", isUp: false, icon: "💵" },
    { label: "Total Hours", value: "38h 30min", change: "1.5%", isUp: false, icon: "clock" },
    { label: "Ordering", value: "65", change: "2.1%", isUp: false, icon: "clock" },
    { label: "Ready to Served", value: "22", change: "0.8%", isUp: false, hasCheckbox: true },
    { label: "Ready to Served", value: "38", change: "1.2%", isUp: false, hasCheckbox: true },
  ],
  "This Month": [
    { label: "Total Sale", value: "$ 32,500.00", change: "8.5%", isUp: true, icon: "💵" },
    { label: "Total Tip", value: "$ 5,200.00", change: "6.2%", isUp: true, icon: "💵" },
    { label: "Total Hours", value: "168h 45min", change: "4.5%", isUp: true, icon: "clock" },
    { label: "Ordering", value: "312", change: "5.8%", isUp: true, icon: "clock" },
    { label: "Ready to Served", value: "120", change: "3.2%", isUp: true, hasCheckbox: true },
    { label: "Ready to Served", value: "185", change: "4.1%", isUp: true, hasCheckbox: true },
  ],
  "Last Month": [
    { label: "Total Sale", value: "$ 28,400.00", change: "4.2%", isUp: false, icon: "💵" },
    { label: "Total Tip", value: "$ 4,580.00", change: "3.5%", isUp: false, icon: "💵" },
    { label: "Total Hours", value: "155h 20min", change: "2.8%", isUp: false, icon: "clock" },
    { label: "Ordering", value: "275", change: "3.2%", isUp: false, icon: "clock" },
    { label: "Ready to Served", value: "98", change: "1.8%", isUp: false, hasCheckbox: true },
    { label: "Ready to Served", value: "162", change: "2.5%", isUp: false, hasCheckbox: true },
  ],
};

// Date filter options
const dateFilters = ["Today", "Yesterday", "This Week", "Last Week", "This Month", "Last Month", "Custom"];

// Order filter labels
const orderFilterLabels = ["All", "In Progress", "Unpaid", "Open", "Paid", "Closed"];

// Order item interface
interface OrderItemType {
  id: number;
  qty: number;
  name: string;
  price: number;
  seats: number[];
  noTax: boolean;
  itemOrderType: string;
  isFired: boolean;
}

// Helper function to calculate order total from items (subtotal + 2% tax + 10% service)
const calculateOrderTotal = (items: OrderItemType[]): number => {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const tax = subtotal * 0.02;
  const serviceCharge = subtotal * 0.1;
  return subtotal + tax + serviceCharge;
};

// Mock orders with filter categories
const mockOrders = [
  {
    id: 10,
    status: "Ordering",
    statusColor: "#4ADE80",
    filterCategory: "In Progress",
    guest: "John Doe",
    orderNo: "Order No 8",
    seats: 4,
    date: "Thu, 22 Jun 2024",
    arrivedAt: "1:35:00 PM",
    timer: "00:00",
    type: "Dine In",
    check: 12,
    revenueCenter: "FF Balcony",
    tip: "$8.50",
    paymentType: "Cash",
    isPaid: false,
    server: "Mia Jones",
    total: 70.96,
    phone: "(555) 123-4567",
    table: "T2",
    notes: "No onions please",
    items: [
      { id: 1, qty: 1, name: "Classic Crispy Burger", price: 12.00, seats: [1], noTax: false, itemOrderType: "Dine In", isFired: false },
      { id: 2, qty: 1, name: "Meatballs", price: 16.00, seats: [2], noTax: false, itemOrderType: "Dine In", isFired: false },
      { id: 3, qty: 2, name: "Rigatoni Pasta", price: 8.00, seats: [1, 2], noTax: false, itemOrderType: "Dine In", isFired: false },
      { id: 4, qty: 1, name: "Caesar Salad", price: 9.50, seats: [3], noTax: false, itemOrderType: "Dine In", isFired: false },
      { id: 5, qty: 1, name: "Grilled Salmon", price: 22.00, seats: [4], noTax: false, itemOrderType: "Dine In", isFired: false },
    ],
  },
  {
    id: 11,
    status: "Ordered",
    statusColor: "#F97316",
    filterCategory: "In Progress",
    guest: "Carol",
    orderNo: "Order No 9",
    seats: 4,
    date: "Thu, 22 Jun 2024",
    arrivedAt: "1:35:00 PM",
    timer: "00:00",
    type: "Dine In",
    check: 12,
    revenueCenter: "FF Balcony",
    tip: "$12.00",
    paymentType: "Cash",
    isPaid: false,
    server: "John Smith",
    total: 85.50,
    phone: "(555) 234-5678",
    table: "T3",
    notes: "Allergic to shellfish",
    items: [
      { id: 1, qty: 1, name: "Caesar Salad", price: 9.50, seats: [1], noTax: false, itemOrderType: "Dine In", isFired: true },
      { id: 2, qty: 1, name: "Grilled Salmon", price: 22.00, seats: [2], noTax: false, itemOrderType: "Dine In", isFired: true },
      { id: 3, qty: 2, name: "Garlic Bread", price: 5.00, seats: [1, 2, 3, 4], noTax: false, itemOrderType: "Dine In", isFired: true },
      { id: 4, qty: 1, name: "Tiramisu", price: 8.00, seats: [3], noTax: false, itemOrderType: "Dine In", isFired: false },
    ],
  },
  {
    id: 12,
    status: "Ready",
    statusColor: "#3B82F6",
    filterCategory: "Open",
    guest: "Mike Smith",
    orderNo: "Order No 10",
    seats: 2,
    date: "Thu, 22 Jun 2024",
    arrivedAt: "2:15:00 PM",
    timer: "00:15",
    type: "Take Out",
    check: 8,
    revenueCenter: "Main Hall",
    tip: "$5.00",
    paymentType: "Card",
    isPaid: false,
    server: "Sarah Lee",
    total: 42.00,
    phone: "(555) 345-6789",
    table: "T4",
    notes: "Extra napkins please",
    items: [
      { id: 1, qty: 1, name: "Mac & Cheese", price: 14.00, seats: [1], noTax: false, itemOrderType: "Take Out", isFired: true },
      { id: 2, qty: 1, name: "French Fries", price: 6.00, seats: [1], noTax: false, itemOrderType: "Take Out", isFired: true },
      { id: 3, qty: 1, name: "Chicken Wings", price: 12.00, seats: [2], noTax: false, itemOrderType: "Take Out", isFired: true },
    ],
  },
  {
    id: 13,
    status: "Completed",
    statusColor: "#22C55E",
    filterCategory: "Paid",
    guest: "Sarah Wilson",
    orderNo: "Order No 11",
    seats: 3,
    date: "Thu, 22 Jun 2024",
    arrivedAt: "12:00:00 PM",
    timer: "01:30",
    type: "Dine In",
    check: 15,
    revenueCenter: "Main Hall",
    tip: "$8.00",
    paymentType: "Card",
    isPaid: true,
    server: "Mia Jones",
    total: 125.00,
    phone: "(555) 456-7890",
    table: "T5",
    notes: "Birthday celebration - bring candle",
    items: [
      { id: 1, qty: 1, name: "Ribeye Steak", price: 38.00, seats: [1], noTax: false, itemOrderType: "Dine In", isFired: true },
      { id: 2, qty: 1, name: "Lobster Tail", price: 45.00, seats: [2], noTax: false, itemOrderType: "Dine In", isFired: true },
      { id: 3, qty: 1, name: "Chocolate Cake", price: 12.00, seats: [3], noTax: false, itemOrderType: "Dine In", isFired: true },
      { id: 4, qty: 2, name: "Glass of Wine", price: 15.00, seats: [1, 2], noTax: false, itemOrderType: "Dine In", isFired: true },
    ],
  },
  {
    id: 14,
    status: "Completed",
    statusColor: "#22C55E",
    filterCategory: "Paid",
    guest: "Tom Brown",
    orderNo: "Order No 12",
    seats: 2,
    date: "Thu, 22 Jun 2024",
    arrivedAt: "11:30:00 AM",
    timer: "02:00",
    type: "Take Out",
    check: 10,
    revenueCenter: "FF Balcony",
    tip: "$3.00",
    paymentType: "Cash",
    isPaid: true,
    server: "John Smith",
    total: 55.00,
    phone: "(555) 567-8901",
    table: "T1",
    notes: "Takeout ready by 2pm",
    items: [
      { id: 1, qty: 1, name: "Chicken Sandwich", price: 14.00, seats: [1], noTax: false, itemOrderType: "Take Out", isFired: true },
      { id: 2, qty: 1, name: "Tomato Soup", price: 8.00, seats: [1], noTax: false, itemOrderType: "Take Out", isFired: true },
      { id: 3, qty: 1, name: "Club Sandwich", price: 13.00, seats: [2], noTax: false, itemOrderType: "Take Out", isFired: true },
    ],
  },
  {
    id: 15,
    status: "Pending Payment",
    statusColor: "#EAB308",
    filterCategory: "Unpaid",
    guest: "Emma Davis",
    orderNo: "Order No 13",
    seats: 5,
    date: "Thu, 22 Jun 2024",
    arrivedAt: "1:00:00 PM",
    timer: "00:45",
    type: "Dine In",
    check: 20,
    revenueCenter: "Main Hall",
    tip: "$15.00",
    paymentType: "Pending",
    isPaid: false,
    server: "Sarah Lee",
    total: 98.75,
    phone: "(555) 678-9012",
    table: "T6",
    notes: "VIP customer - priority service",
    items: [
      { id: 1, qty: 1, name: "Lobster Bisque", price: 16.00, seats: [1], noTax: false, itemOrderType: "Dine In", isFired: true },
      { id: 2, qty: 1, name: "Filet Mignon", price: 42.00, seats: [2], noTax: false, itemOrderType: "Dine In", isFired: true },
      { id: 3, qty: 1, name: "Champagne", price: 25.00, seats: [1, 2], noTax: false, itemOrderType: "Dine In", isFired: true },
    ],
  },
  {
    id: 16,
    status: "Pending Payment",
    statusColor: "#EAB308",
    filterCategory: "Unpaid",
    guest: "James Lee",
    orderNo: "Order No 14",
    seats: 4,
    date: "Thu, 22 Jun 2024",
    arrivedAt: "2:30:00 PM",
    timer: "00:20",
    type: "Dine In",
    check: 18,
    revenueCenter: "FF Balcony",
    tip: "$18.50",
    paymentType: "Pending",
    isPaid: false,
    server: "Mia Jones",
    total: 115.50,
    phone: "(555) 789-0123",
    table: "T7",
    notes: "Kids meal needed - no spicy",
    items: [
      { id: 1, qty: 1, name: "Spaghetti Bolognese", price: 16.00, seats: [1], noTax: false, itemOrderType: "Dine In", isFired: true },
      { id: 2, qty: 1, name: "Kids Pizza", price: 9.00, seats: [2], noTax: false, itemOrderType: "Dine In", isFired: true },
      { id: 3, qty: 1, name: "Chicken Parmesan", price: 22.00, seats: [3], noTax: false, itemOrderType: "Dine In", isFired: false },
      { id: 4, qty: 2, name: "Soda", price: 4.00, seats: [1, 2, 3, 4], noTax: false, itemOrderType: "Dine In", isFired: true },
    ],
  },
  {
    id: 17,
    status: "Closed",
    statusColor: "#6B7280",
    filterCategory: "Closed",
    guest: "Lisa Chen",
    orderNo: "Order No 15",
    seats: 2,
    date: "Thu, 22 Jun 2024",
    arrivedAt: "10:00:00 AM",
    timer: "03:00",
    type: "Dine In",
    check: 12,
    revenueCenter: "Main Hall",
    tip: "$5.00",
    paymentType: "Card",
    isPaid: true,
    server: "John Smith",
    total: 65.00,
    phone: "(555) 890-1234",
    table: "T8",
    notes: "Gluten-free options only",
    items: [
      { id: 1, qty: 1, name: "GF Pasta Primavera", price: 18.00, seats: [1], noTax: false, itemOrderType: "Dine In", isFired: true },
      { id: 2, qty: 1, name: "Garden Salad", price: 10.00, seats: [2], noTax: false, itemOrderType: "Dine In", isFired: true },
      { id: 3, qty: 1, name: "GF Brownie", price: 7.00, seats: [1, 2], noTax: false, itemOrderType: "Dine In", isFired: true },
    ],
  },
  {
    id: 18,
    status: "Closed",
    statusColor: "#6B7280",
    filterCategory: "Closed",
    guest: "Robert Kim",
    orderNo: "Order No 16",
    seats: 6,
    date: "Thu, 22 Jun 2024",
    arrivedAt: "9:30:00 AM",
    timer: "04:00",
    type: "Dine In",
    check: 25,
    revenueCenter: "FF Balcony",
    tip: "$10.00",
    paymentType: "Card",
    isPaid: true,
    server: "Sarah Lee",
    total: 180.00,
    phone: "(555) 901-2345",
    table: "T9",
    notes: "Large party - split checks requested",
    items: [
      { id: 1, qty: 2, name: "Ribeye Steak", price: 38.00, seats: [1, 2], noTax: false, itemOrderType: "Dine In", isFired: true },
      { id: 2, qty: 2, name: "Grilled Salmon", price: 22.00, seats: [3, 4], noTax: false, itemOrderType: "Dine In", isFired: true },
      { id: 3, qty: 2, name: "Pasta Carbonara", price: 18.00, seats: [5, 6], noTax: false, itemOrderType: "Dine In", isFired: true },
      { id: 4, qty: 6, name: "Garlic Bread", price: 5.00, seats: [1, 2, 3, 4, 5, 6], noTax: false, itemOrderType: "Dine In", isFired: true },
    ],
  },
  {
    id: 19,
    status: "New Order",
    statusColor: "#3B82F6",
    filterCategory: "Open",
    guest: "Amy White",
    orderNo: "Order No 17",
    seats: 3,
    date: "Thu, 22 Jun 2024",
    arrivedAt: "2:45:00 PM",
    timer: "00:05",
    type: "Take Out",
    check: 9,
    revenueCenter: "Main Hall",
    tip: "$6.00",
    paymentType: "Pending",
    isPaid: false,
    server: "Mia Jones",
    total: 35.25,
    phone: "(555) 012-3456",
    table: "T10",
    notes: "First time customer - welcome gift",
    items: [
      { id: 1, qty: 1, name: "Appetizer Sampler", price: 18.00, seats: [1, 2, 3], noTax: false, itemOrderType: "Take Out", isFired: false },
      { id: 2, qty: 1, name: "House Salad", price: 8.00, seats: [1], noTax: false, itemOrderType: "Take Out", isFired: false },
    ],
  },
];

// Default order items (used as fallback)
const defaultOrderItems: OrderItemType[] = mockOrders[0]?.items || [];

// Table status configurations (matching /tableorder screen)
const tableStatusConfig: Record<string, { textColor: string; bgColor: string }> = {
  "Available": { textColor: "#FFFFFF", bgColor: "#22C55E" },
  "Ordering": { textColor: "#000000", bgColor: "#FACC15" },
  "Ordered": { textColor: "#000000", bgColor: "#F97316" },
  "Reserved": { textColor: "#FFFFFF", bgColor: "#6B7280" },
  "Seated": { textColor: "#FFFFFF", bgColor: "#9CA3AF" },
  "Running Late": { textColor: "#FFFFFF", bgColor: "#EF4444" },
  "1st Course": { textColor: "#FFFFFF", bgColor: "#A855F7" },
  "2nd Course": { textColor: "#000000", bgColor: "#FACC15" },
  "3rd Course": { textColor: "#000000", bgColor: "#F97316" },
  "Dessert": { textColor: "#FFFFFF", bgColor: "#EC4899" },
  "Partially Seated": { textColor: "#000000", bgColor: "#4ADE80" },
  "Served": { textColor: "#FFFFFF", bgColor: "#3B82F6" },
  "Paid": { textColor: "#000000", bgColor: "#34D399" },
};

// Mock table data (matching /tableorder screen)
const mockTables = [
  { id: "T1", seats: 6, status: "Available" },
  { id: "T2", seats: 4, status: "Ordering" },
  { id: "T3", seats: 6, status: "Ordered" },
  { id: "T4", seats: 10, status: "Reserved" },
  { id: "T5", seats: 10, status: "Seated" },
  { id: "T6", seats: 8, status: "Running Late" },
  { id: "T7", seats: 6, status: "1st Course" },
  { id: "T8", seats: 4, status: "2nd Course" },
  { id: "T9", seats: 2, status: "3rd Course" },
  { id: "T10", seats: 6, status: "Dessert" },
  { id: "T11", seats: 4, status: "Partially Seated" },
  { id: "T12", seats: 8, status: "Served" },
  { id: "T13", seats: 6, status: "Available" },
  { id: "T14", seats: 4, status: "Paid" },
  { id: "T15", seats: 2, status: "Ordering" },
];

// Import additional icons for order panel
import clearIcon from "@/assets/icons/clear-c.png";

// Discount types data
interface DiscountType {
  id: string;
  name: string;
  description: string;
  percentage?: number;
  fixedAmount?: number;
  icon: 'briefcase' | 'heart' | 'graduation' | 'shield' | 'star' | 'clock' | 'cake' | 'mappin' | 'dollar' | 'tag';
}

const discountTypes: DiscountType[] = [
  { id: 'employee', name: 'Employee Discount', description: '20% off', percentage: 20, icon: 'briefcase' },
  { id: 'senior', name: 'Senior Citizen', description: '15% off', percentage: 15, icon: 'heart' },
  { id: 'student', name: 'Student Discount', description: '10% off', percentage: 10, icon: 'graduation' },
  { id: 'military', name: 'Military Discount', description: '15% off', percentage: 15, icon: 'shield' },
  { id: 'loyalty', name: 'Loyalty Member', description: '5% off', percentage: 5, icon: 'star' },
  { id: 'happy', name: 'Happy Hour', description: '25% off', percentage: 25, icon: 'clock' },
  { id: 'birthday', name: 'Birthday Special', description: '30% off', percentage: 30, icon: 'cake' },
  { id: 'first', name: 'First Visit', description: '10% off', percentage: 10, icon: 'mappin' },
  { id: 'comp5', name: 'Manager Comp $5', description: '$5.00 off', fixedAmount: 5, icon: 'dollar' },
  { id: 'comp10', name: 'Manager Comp $10', description: '$10.00 off', fixedAmount: 10, icon: 'dollar' },
  { id: 'comp15', name: 'Manager Comp $15', description: '$15.00 off', fixedAmount: 15, icon: 'dollar' },
  { id: 'promo', name: 'Promo Code Discount', description: '20% off', percentage: 20, icon: 'tag' },
];

// Initial payment methods data (visible)
const initialPaymentMethods = [
  { id: 'loyalty', name: 'Loyalty', icon: Tag },
  { id: 'account', name: 'Account', icon: User },
  { id: 'card', name: 'Card', icon: CreditCard },
  { id: 'cash', name: 'Cash', icon: Banknote },
  { id: 'gift-card', name: 'Gift Card', icon: Gift },
  { id: 'pay-link', name: 'Pay by Link', icon: Link },
];

// Initial other payment methods (in dropdown)
const initialOtherPaymentMethods = [
  { id: 'qr-code', name: 'QR Code', icon: QrCode },
  { id: 'account2', name: 'Account', icon: User },
  { id: 'manual-cc', name: 'Manual CC', icon: CreditCard },
  { id: 'external-cc', name: 'External CC', icon: ExternalLink },
  { id: 'manual-card', name: 'Manual card', icon: Clipboard },
  { id: 'blizzful', name: 'Blizzful', icon: Utensils },
  { id: 'ubereats', name: 'UberEats', icon: ShoppingBag },
  { id: 'doordash', name: 'DoorDash', icon: Truck },
  { id: 'grubhub', name: 'Grubhub', icon: UtensilsCrossed },
];

// Payment method type
type PaymentMethodType = { id: string; name: string; icon: React.ComponentType<{ className?: string }> };

// Quick amount values
const quickAmounts = [1, 2, 5, 10, 20, 50, 100];

// Mock guests data for Pay by Link and Loyalty
interface GuestType {
  name: string;
  phone: string;
  email: string;
  avatar: string;
  loyaltyPoints?: number;
}

const mockGuests: GuestType[] = [
  { name: "Ayden Veum", phone: "(346) 346-3636", email: "cow@user.com", avatar: "AV", loyaltyPoints: 850 },
  { name: "Arjun Gerhold", phone: "(574) 747-3634", email: "cow@user.com", avatar: "AG", loyaltyPoints: 1250 },
  { name: "Bergnaum", phone: "(643) 636-4377", email: "abc@gmail.com", avatar: "B", loyaltyPoints: 320 },
  { name: "Cleora Hills", phone: "(100) 000-0000", email: "cleorahills@gmail.com", avatar: "CH", loyaltyPoints: 1580 },
  { name: "Eden Kautzer", phone: "(353) 253-2523", email: "dog@Test.com", avatar: "EK", loyaltyPoints: 920 },
  { name: "Wunderlich", phone: "(234) 235-2323", email: "alaskanm@dog.com", avatar: "W", loyaltyPoints: 450 },
  { name: "Simeon Wilderman", phone: "(643) 634-6334", email: "dominate@user.com", avatar: "SW", loyaltyPoints: 2100 },
  { name: "Gino Yost", phone: "(234) 254-3235", email: "dominate@user.com", avatar: "GY", loyaltyPoints: 680 },
  { name: "Miss Estrella", phone: "(643) 634-6352", email: "guest@synd.com", avatar: "ME", loyaltyPoints: 1100 },
  { name: "Teresa Barton", phone: "(325) 235-2324", email: "Rem@user.com", avatar: "TB", loyaltyPoints: 780 },
];

// Order Panel Content Component
interface OrderPanelContentProps {
  selectedOrder: typeof mockOrders[0] | null;
  orderItems: OrderItemType[];
  subtotal: number;
  total: number;
  phoneIcon: string;
  timeIcon: string;
  itemNotesIcon: string;
  fireIcon: string;
  seatFilter: (number | 'all')[];
  toggleSeatFilter: (seat: number | 'all') => void;
  orderNotes: string;
  setOrderNotes: (notes: string) => void;
  activeSwipedItemId: string | null;
  setActiveSwipedItemId: (id: string | null) => void;
  onToggleNoTax: (itemId: number) => void;
  onOrderTypeChange: (itemId: number, orderType: string) => void;
  onDeleteItem: (itemId: number) => void;
  onFireItem: (itemId: number) => void;
  showDiscountDialog: boolean;
  setShowDiscountDialog: (show: boolean) => void;
  selectedDiscountId: string | null;
  setSelectedDiscountId: (id: string | null) => void;
  showPaymentDialog: boolean;
  setShowPaymentDialog: (show: boolean) => void;
  selectedPaymentMethod: string;
  setSelectedPaymentMethod: (method: string) => void;
  paymentAmount: string;
  setPaymentAmount: (amount: string) => void;
  showKeypad: boolean;
  setShowKeypad: (show: boolean) => void;
  handleKeypadPress: (key: string) => void;
  amountQuantities: Record<number, number>;
  setAmountQuantities: React.Dispatch<React.SetStateAction<Record<number, number>>>;
  handleAddAmount: (amount: number) => void;
  handleRemoveAmount: (amount: number) => void;
  paymentProcessed: boolean;
  setPaymentProcessed: (processed: boolean) => void;
  paidAmount: number;
  setPaidAmount: (amount: number) => void;
  showOtherPayments: boolean;
  setShowOtherPayments: (show: boolean) => void;
  giftCardStep: 'amount' | 'enter-card' | 'processing';
  setGiftCardStep: (step: 'amount' | 'enter-card' | 'processing') => void;
  giftCardNumber: string;
  setGiftCardNumber: (number: string) => void;
  handleGiftCardKeypadPress: (key: string) => void;
  // Pay by Link props
  payByLinkStep: 'amount' | 'select-guest' | 'guest-confirmed' | 'pending' | 'expired' | 'complete';
  setPayByLinkStep: (step: 'amount' | 'select-guest' | 'guest-confirmed' | 'pending' | 'expired' | 'complete') => void;
  selectedGuest: GuestType | null;
  setSelectedGuest: (guest: GuestType | null) => void;
  guestSearchQuery: string;
  setGuestSearchQuery: (query: string) => void;
  hoveredGuestIndex: number | null;
  setHoveredGuestIndex: (index: number | null) => void;
  sendLinkMethod: 'text' | 'email';
  setSendLinkMethod: (method: 'text' | 'email') => void;
  // QR Code props
  qrCodeStep: 'amount' | 'qr-display' | 'pending' | 'complete';
  setQrCodeStep: (step: 'amount' | 'qr-display' | 'pending' | 'complete') => void;
  qrPhoneNumber: string;
  setQrPhoneNumber: (phone: string) => void;
  showQrPhoneInput: boolean;
  setShowQrPhoneInput: (show: boolean) => void;
  // Loyalty props
  loyaltyStep: 'guest-list' | 'guest-selected' | 'points-input' | 'otp' | 'complete';
  setLoyaltyStep: (step: 'guest-list' | 'guest-selected' | 'points-input' | 'otp' | 'complete') => void;
  loyaltySelectedGuest: GuestType | null;
  setLoyaltySelectedGuest: (guest: GuestType | null) => void;
  loyaltyPointsToRedeem: string;
  setLoyaltyPointsToRedeem: (points: string) => void;
  showLoyaltyAddGuest: boolean;
  setShowLoyaltyAddGuest: (show: boolean) => void;
  loyaltyNewGuest: { name: string; phone: string; email: string };
  setLoyaltyNewGuest: (guest: { name: string; phone: string; email: string }) => void;
  loyaltyOtp: string[];
  setLoyaltyOtp: (otp: string[]) => void;
  loyaltySearchQuery: string;
  setLoyaltySearchQuery: (query: string) => void;
  showLoyaltyKeypad: boolean;
  setShowLoyaltyKeypad: (show: boolean) => void;
  // Dynamic payment methods
  visiblePaymentMethods: PaymentMethodType[];
  dropdownPaymentMethods: PaymentMethodType[];
  handleSelectFromDropdown: (method: PaymentMethodType) => void;
}

const OrderPanelContent = ({ 
  selectedOrder, 
  orderItems, 
  subtotal, 
  total, 
  phoneIcon, 
  timeIcon, 
  itemNotesIcon, 
  fireIcon, 
  seatFilter, 
  toggleSeatFilter,
  orderNotes,
  setOrderNotes,
  activeSwipedItemId,
  setActiveSwipedItemId,
  onToggleNoTax,
  onOrderTypeChange,
  onDeleteItem,
  onFireItem,
  showDiscountDialog,
  setShowDiscountDialog,
  selectedDiscountId,
  setSelectedDiscountId,
  showPaymentDialog,
  setShowPaymentDialog,
  selectedPaymentMethod,
  setSelectedPaymentMethod,
  paymentAmount,
  setPaymentAmount,
  showKeypad,
  setShowKeypad,
  handleKeypadPress,
  amountQuantities,
  setAmountQuantities,
  handleAddAmount,
  handleRemoveAmount,
  paymentProcessed,
  setPaymentProcessed,
  paidAmount,
  setPaidAmount,
  showOtherPayments,
  setShowOtherPayments,
  giftCardStep,
  setGiftCardStep,
  giftCardNumber,
  setGiftCardNumber,
  handleGiftCardKeypadPress,
  // Pay by Link
  payByLinkStep,
  setPayByLinkStep,
  selectedGuest,
  setSelectedGuest,
  guestSearchQuery,
  setGuestSearchQuery,
  hoveredGuestIndex,
  setHoveredGuestIndex,
  sendLinkMethod,
  setSendLinkMethod,
  // QR Code
  qrCodeStep,
  setQrCodeStep,
  qrPhoneNumber,
  setQrPhoneNumber,
  showQrPhoneInput,
  setShowQrPhoneInput,
  // Loyalty
  loyaltyStep,
  setLoyaltyStep,
  loyaltySelectedGuest,
  setLoyaltySelectedGuest,
  loyaltyPointsToRedeem,
  setLoyaltyPointsToRedeem,
  showLoyaltyAddGuest,
  setShowLoyaltyAddGuest,
  loyaltyNewGuest,
  setLoyaltyNewGuest,
  loyaltyOtp,
  setLoyaltyOtp,
  loyaltySearchQuery,
  setLoyaltySearchQuery,
  showLoyaltyKeypad,
  setShowLoyaltyKeypad,
  // Dynamic payment methods
  visiblePaymentMethods,
  dropdownPaymentMethods,
  handleSelectFromDropdown
}: OrderPanelContentProps) => {
  const selectedDiscount = discountTypes.find(d => d.id === selectedDiscountId);
  const discount = selectedDiscount 
    ? (selectedDiscount.fixedAmount || (subtotal * ((selectedDiscount.percentage || 0) / 100)))
    : 0;
  const tax = subtotal * 0.02;
  const serviceCharge = subtotal * 0.1;
  const tip = selectedOrder?.tip ? parseFloat(selectedOrder.tip.replace('$', '')) || 0 : 0;
  const finalTotal = subtotal - discount + tax + serviceCharge + tip;
  const guestCount = selectedOrder?.seats || 4;
  const isOrderDisabled = selectedOrder && ['Completed', 'Paid', 'Closed'].includes(selectedOrder.status);

  return (
    <>
      {/* Guest Header - Outside the box */}
      <div className="px-2 py-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-white font-medium flex-1">{selectedOrder?.guest || "GUEST NAME"}</span>
          <div className="flex items-center gap-1 text-white/50 text-[10px] flex-1 justify-center whitespace-nowrap">
            <img src={phoneIcon} alt="phone" className="w-3 h-3 opacity-60" />
            <span>{selectedOrder?.phone || "(XXX) XXX-XXXX"}</span>
          </div>
          <div className="flex items-center gap-1 text-white/50 text-[10px] flex-1 justify-end whitespace-nowrap">
            <span>⚡</span>
            <span>{selectedOrder?.arrivedAt || "12:30 PM"}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-1.5 bg-neutral-700 text-white text-xs rounded-full hover:bg-neutral-600 transition-colors">
            Add Item
          </button>
          <button 
            className={`px-3 py-1.5 text-xs rounded-full transition-colors ${
              isOrderDisabled
                ? 'bg-neutral-800 text-white/40 cursor-not-allowed'
                : 'bg-neutral-700 text-white hover:bg-neutral-600'
            }`}
            disabled={!!isOrderDisabled}
            onClick={() => !isOrderDisabled && setShowDiscountDialog(true)}
          >
            Discount
          </button>
          <button className="px-3 py-1.5 bg-neutral-700 text-white text-xs rounded-full hover:bg-neutral-600 transition-colors">
            Receipt
          </button>
          <button className="px-3 py-1.5 bg-neutral-700 text-white text-xs rounded-full hover:bg-neutral-600 transition-colors">
            Cash Register
          </button>
        </div>
      </div>

      {/* Main Panel Box */}
      <div className="flex-1 flex flex-col rounded-[10px] overflow-hidden" style={{
        background: "#7575754D",
        boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)"
      }}>
        {/* Table Order Info - Row 1 */}
        <div className="px-3 py-2 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-neutral-700 text-white text-xs rounded border border-white/20">
                TABLE {selectedOrder?.table || "T1"}
              </span>
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3 text-white/60" />
                <span className="text-white/60 text-xs">{guestCount}</span>
              </div>
              <span className="text-white font-bold text-sm">{selectedOrder?.id || "—"}</span>
            </div>
            <div className="flex items-center gap-1">
              <img src={runnerIcon} alt="Server" className="w-4 h-4" />
              <span className="text-white/70 text-xs">{selectedOrder?.server?.toUpperCase() || "SERVER"}</span>
            </div>
          </div>
        </div>
          
        {/* Seat Buttons - Row 2 */}
        <div className="px-3 py-2 border-b border-white/10">
          <div className="flex items-center gap-1.5">
            <button className="w-6 h-6 bg-neutral-600 rounded flex items-center justify-center hover:bg-neutral-500 transition-colors">
              <img src={chairWhiteIcon} alt="Chair" className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={() => toggleSeatFilter('all')}
              className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${
                seatFilter.includes('all') ? 'bg-white' : 'bg-neutral-600 hover:bg-neutral-500'
              }`}
            >
              <Share2 className={`w-3.5 h-3.5 ${seatFilter.includes('all') ? 'text-black' : 'text-white'}`} />
            </button>
            {Array.from({ length: guestCount }, (_, i) => i + 1).map(seat => (
              <button 
                key={seat} 
                onClick={() => toggleSeatFilter(seat)} 
                className={`w-6 h-6 rounded text-xs font-medium transition-colors ${
                  seatFilter.includes(seat) ? "bg-white text-black" : "bg-neutral-600 text-white hover:bg-neutral-500"
                }`}
              >
                {seat}
              </button>
            ))}
          </div>
        </div>

        {/* Notes - with Autocomplete */}
        <div className="px-3 py-2 border-b border-white/10">
          <OrderNotesAutocomplete
            value={orderNotes}
            onChange={setOrderNotes}
            placeholder="Order notes and Allergies"
            storageKey="dashboard-order-notes"
          />
        </div>

        {/* Order Items */}
        <ScrollArea className="flex-1 px-3 max-h-[300px] md:max-h-none">
          <div className="py-2 space-y-1.5">
            {orderItems
              .filter(item => {
                // If 'all' is selected, show all items
                if (seatFilter.includes('all')) return true;
                // If no filter selected, show all items
                if (seatFilter.length === 0) return true;
                // Show item if any of its seats match the filter
                return item.seats.some(seat => seatFilter.includes(seat));
              })
              .map((item, index) => {
              const itemId = `item-${index}`;
              const itemSeats = item.seats;
              const isAllSeats = itemSeats.length === guestCount;
              
              return (
                <SwipeableCartItem
                  key={item.id}
                  onDelete={() => onDeleteItem(item.id)}
                  onFire={() => onFireItem(item.id)}
                  onNoTax={() => onToggleNoTax(item.id)}
                  isNoTax={item.noTax}
                  isFired={item.isFired}
                  itemOrderType={item.itemOrderType}
                  onOrderTypeChange={(type) => onOrderTypeChange(item.id, type)}
                  isOpen={activeSwipedItemId === itemId}
                  onSwipeStart={() => setActiveSwipedItemId(itemId)}
                >
                  <div 
                    className="p-2 border border-sidebar-border rounded-lg cursor-pointer"
                    style={{ background: 'linear-gradient(180deg, #4D4D4D 0%, #616161 100%)' }}
                  >
                    <div className="flex flex-col">
                      {/* Item header row */}
                      <div className="flex items-start gap-2">
                        <span className="w-6 h-6 rounded bg-neutral-700 border border-neutral-600 text-white text-xs font-medium flex items-center justify-center flex-shrink-0">
                          {item.qty}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-foreground">{item.name}</span>
                            <span className="text-sm font-medium text-foreground ml-2">
                              ${item.price.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Seat indicators */}
                      <div className="flex items-center gap-1.5 mt-1.5 ml-8">
                        <img src={chairWhiteIcon} alt="Seat" className="w-4 h-4 opacity-70" />
                        {isAllSeats ? (
                          <span className="w-5 h-5 rounded bg-neutral-700 text-white flex items-center justify-center">
                            <Share2 className="w-3 h-3" />
                          </span>
                        ) : (
                          itemSeats.map(seat => (
                            <span 
                              key={seat} 
                              className="w-5 h-5 rounded bg-neutral-700 text-white text-[10px] font-medium flex items-center justify-center"
                            >
                              {seat}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </SwipeableCartItem>
              );
            })}
          </div>
        </ScrollArea>

        {/* Order Summary - Compact Single Row */}
        <div className="px-3 py-2 border-t border-white/10 flex-shrink-0">
          <div className="text-xs flex items-center justify-between gap-2">
            <span className="text-white">Sub: <span className="font-medium">${subtotal.toFixed(2)}</span></span>
            <span className="text-red-500">Disc: <span className="font-medium">${discount.toFixed(2)}</span></span>
            <span className="text-white">Svc: <span className="font-medium">${serviceCharge.toFixed(2)}</span></span>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="px-3 py-2 border-t border-white/10 flex items-center gap-2">
          <button className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center hover:bg-red-500 transition-colors flex-shrink-0">
            <img src={clearIcon} alt="Clear" className="w-4 h-4 brightness-0 invert" />
          </button>
          <button className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#C9C9C9' }}>
            <img src={saveIcon} alt="Save" className="w-4 h-4 brightness-0" />
          </button>
          <button className="flex-1 h-8 rounded-full flex items-center justify-center gap-1 text-white text-sm font-medium" style={{
            background: "linear-gradient(180deg, #FF9E65 0%, #FF5E00 100%)"
          }}>
            <img src={fireIcon} alt="Fire" className="w-4 h-4 brightness-0 invert" />
            <span>FIRE</span>
          </button>
          <button 
            onClick={() => {
              // Reset payment states for new order
              setAmountQuantities({});
              setPaymentProcessed(false);
              setShowKeypad(false);
              setShowOtherPayments(false);
              setPaymentAmount(finalTotal.toFixed(2));
              // Reset gift card state for new payment
              setGiftCardStep('amount');
              setGiftCardNumber('');
              // Reset pay by link state for new payment
              setPayByLinkStep('amount');
              setSelectedGuest(null);
              setGuestSearchQuery('');
              // Reset QR code state for new payment
              setQrCodeStep('amount');
              setQrPhoneNumber('');
              setShowQrPhoneInput(false);
              // Reset loyalty state for new payment
              setLoyaltyStep('guest-list');
              setLoyaltySelectedGuest(null);
              setLoyaltyPointsToRedeem('');
              setShowLoyaltyAddGuest(false);
              setLoyaltyNewGuest({ name: '', phone: '', email: '' });
              setLoyaltyOtp(['', '', '', '']);
              setLoyaltySearchQuery('');
              setShowLoyaltyKeypad(false);
              setShowPaymentDialog(true);
            }}
            className="flex-1 h-8 rounded-full text-black text-sm font-bold" 
            style={{
              background: "linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)"
            }}
          >
            CHARGE ${finalTotal.toFixed(2)}
          </button>
        </div>
      </div>

      {/* Discount Dialog */}
      {showDiscountDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-neutral-900 rounded-xl border border-neutral-700 w-[90%] max-w-md mx-4 overflow-hidden animate-scale-in">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-neutral-700">
              <h2 className="text-white text-lg font-semibold">Select Discount</h2>
              <button 
                onClick={() => setShowDiscountDialog(false)}
                className="w-8 h-8 rounded-full hover:bg-neutral-700 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-neutral-400" />
              </button>
            </div>

            {/* Discount Options */}
            <div className="p-2 max-h-[400px] overflow-y-auto scrollbar-hide space-y-1">
              {discountTypes.map((discountType) => {
                const discountValue = discountType.fixedAmount || (subtotal * ((discountType.percentage || 0) / 100));
                const isSelected = selectedDiscountId === discountType.id;
                
                const IconComponent = {
                  briefcase: Briefcase,
                  heart: Heart,
                  graduation: GraduationCap,
                  shield: Shield,
                  star: Star,
                  clock: Clock,
                  cake: Cake,
                  mappin: MapPin,
                  dollar: BadgeDollarSign,
                  tag: Tag
                }[discountType.icon];
                
                return (
                  <button
                    key={discountType.id}
                    onClick={() => setSelectedDiscountId(isSelected ? null : discountType.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                      isSelected 
                        ? 'bg-orange-500/20 border border-orange-500' 
                        : 'bg-neutral-800 border border-transparent hover:bg-neutral-700'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      isSelected ? 'bg-orange-500/30' : 'bg-neutral-700'
                    }`}>
                      {IconComponent && <IconComponent className="w-4 h-4 text-neutral-400" />}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="text-white text-sm font-medium">{discountType.name}</div>
                      <div className="text-neutral-400 text-xs">{discountType.description}</div>
                    </div>
                    <div className="text-red-400 text-sm font-medium">
                      -${discountValue.toFixed(2)}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Apply Button */}
            <div className="p-3 border-t border-neutral-700">
              <button
                onClick={() => setShowDiscountDialog(false)}
                className="w-full py-2.5 bg-white hover:bg-neutral-100 text-black font-semibold rounded-lg transition-colors text-sm"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Dialog */}
      {showPaymentDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-neutral-900 rounded-xl border border-neutral-700 flex overflow-hidden mx-4 animate-scale-in max-h-[90vh]">
            {/* Payment Options Panel OR Receipt View */}
            <div className="w-[480px] flex flex-col bg-neutral-900 max-h-[90vh] overflow-hidden">
              {paymentProcessed ? (
                /* Receipt View */
                <>
                  {/* Success Header */}
                  <div className="flex flex-col items-center py-8 px-6">
                    <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                      <CheckCircle className="w-10 h-10 text-green-500" />
                    </div>
                    <p className="text-neutral-300 text-sm">
                      <span className="text-green-500 font-medium">${paidAmount.toFixed(2)}</span> has been successfully processed
                    </p>
                  </div>

                  {/* Change Due / Due Amount Box */}
                  {paidAmount >= finalTotal ? (
                    <div className="mx-6 mb-6 border-2 border-green-500 rounded-lg p-4 bg-green-500/10">
                      <p className="text-green-500 text-sm text-center mb-1">Change Due</p>
                      <p className="text-green-500 text-3xl font-bold text-center">
                        ${(paidAmount - finalTotal).toFixed(2)}
                      </p>
                    </div>
                  ) : (
                    <div className="mx-6 mb-6 border-2 border-red-500 rounded-lg p-4 bg-red-500/10">
                      <p className="text-red-500 text-sm text-center mb-1">Due Amount</p>
                      <p className="text-red-500 text-3xl font-bold text-center">
                        ${(finalTotal - paidAmount).toFixed(2)}
                      </p>
                    </div>
                  )}

                  {/* Receipt Section */}
                  <div className="px-6 pb-6">
                    <h3 className="text-white font-semibold text-center mb-4">Receipt</h3>
                    <div className="flex gap-4 justify-center mb-4">
                      <button className="flex-1 flex flex-col items-center gap-2 py-4 px-6 border border-neutral-600 rounded-lg hover:bg-neutral-800 transition-colors">
                        <Printer className="w-6 h-6 text-neutral-400" />
                        <span className="text-neutral-400 text-sm">Print</span>
                      </button>
                      <button className="flex-1 flex flex-col items-center gap-2 py-4 px-6 border border-neutral-600 rounded-lg hover:bg-neutral-800 transition-colors">
                        <MessageSquare className="w-6 h-6 text-neutral-400" />
                        <span className="text-neutral-400 text-sm">Text</span>
                      </button>
                      <button className="flex-1 flex flex-col items-center gap-2 py-4 px-6 border border-neutral-600 rounded-lg hover:bg-neutral-800 transition-colors">
                        <Mail className="w-6 h-6 text-neutral-400" />
                        <span className="text-neutral-400 text-sm">Email</span>
                      </button>
                    </div>
                    <button 
                      onClick={() => {
                        setPaymentProcessed(false);
                        setShowPaymentDialog(false);
                      }}
                      className="w-full py-4 border border-neutral-600 text-neutral-300 font-medium rounded-lg hover:bg-neutral-800 transition-colors"
                    >
                      NO RECEIPT
                    </button>
                  </div>
                </>
              ) : selectedPaymentMethod === 'pay-link' && payByLinkStep !== 'amount' ? (
                /* Pay by Link Screens */
                <>
                  {/* Header with Back Button */}
                  <div className="flex items-center justify-between p-4 border-b border-neutral-700">
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => {
                          if (payByLinkStep === 'select-guest') {
                            setPayByLinkStep('amount');
                          } else if (payByLinkStep === 'guest-confirmed') {
                            setPayByLinkStep('select-guest');
                            setSelectedGuest(null);
                          } else if (payByLinkStep === 'pending' || payByLinkStep === 'expired') {
                            setPayByLinkStep('guest-confirmed');
                          } else if (payByLinkStep === 'complete') {
                            setPayByLinkStep('amount');
                            setSelectedGuest(null);
                          }
                        }}
                        className="w-8 h-8 rounded-full hover:bg-neutral-700 flex items-center justify-center transition-colors"
                      >
                        <ArrowLeft className="w-5 h-5 text-neutral-300" />
                      </button>
                      <span className="text-white text-lg font-medium">Pay by Link</span>
                    </div>
                    <span className="text-red-500 text-lg font-bold">${paymentAmount}</span>
                  </div>

                  {/* Guest Selection Screen */}
                  {payByLinkStep === 'select-guest' && (
                    <div className="flex-1 flex flex-col overflow-hidden min-h-0">
                      {/* Info Text */}
                      <div className="px-4 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-neutral-400 text-sm">
                          <div className="w-5 h-5 rounded-full border border-neutral-400 flex items-center justify-center">
                            <span className="text-xs">i</span>
                          </div>
                          <span>Search for the guest to share the link or add guest details.</span>
                        </div>
                        <button className="flex items-center gap-2 px-3 py-1.5 bg-neutral-700 rounded-lg hover:bg-neutral-600 transition-colors">
                          <UserPlus className="w-4 h-4 text-white" />
                          <span className="text-white text-sm">Add Guest</span>
                        </button>
                      </div>

                      {/* Send Link Toggle Buttons */}
                      <div className="px-4 pb-3 flex gap-2">
                        <button 
                          onClick={() => setSendLinkMethod('text')}
                          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                            sendLinkMethod === 'text' 
                              ? 'bg-white text-black' 
                              : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'
                          }`}
                        >
                          Send Link by Text
                        </button>
                        <button 
                          onClick={() => setSendLinkMethod('email')}
                          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                            sendLinkMethod === 'email' 
                              ? 'bg-white text-black' 
                              : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'
                          }`}
                        >
                          Send Link by Email
                        </button>
                      </div>

                      {/* Search Input */}
                      <div className="px-4 pb-3">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                          <Input
                            type="text"
                            placeholder="Search Guest"
                            value={guestSearchQuery}
                            onChange={(e) => setGuestSearchQuery(e.target.value)}
                            className="w-full pl-10 py-2 bg-neutral-800 border-neutral-600 text-white placeholder:text-neutral-500 rounded-lg"
                          />
                        </div>
                      </div>

                      {/* Guest List Table */}
                      <div className="flex-1 overflow-auto px-4 min-h-0 pb-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                        {/* Table Header */}
                        <div className="grid grid-cols-3 gap-4 py-2 text-xs text-neutral-400 border-b border-neutral-700">
                          <span>Name</span>
                          <span>Phone Number</span>
                          <span>Email</span>
                        </div>
                        {/* Guest Rows */}
                        {mockGuests
                          .filter(guest => 
                            guestSearchQuery === '' || 
                            guest.name.toLowerCase().includes(guestSearchQuery.toLowerCase()) ||
                            guest.phone.includes(guestSearchQuery) ||
                            guest.email.toLowerCase().includes(guestSearchQuery.toLowerCase())
                          )
                          .map((guest, index) => (
                          <div 
                            key={index}
                            onClick={() => {
                              setSelectedGuest(guest);
                              setPayByLinkStep('guest-confirmed');
                            }}
                            onMouseEnter={() => setHoveredGuestIndex(index)}
                            onMouseLeave={() => setHoveredGuestIndex(null)}
                            className="grid grid-cols-3 gap-4 py-3 border-b border-neutral-700/50 hover:bg-neutral-800 cursor-pointer transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-neutral-700 flex items-center justify-center text-xs text-white font-medium">
                                {guest.avatar}
                              </div>
                              {hoveredGuestIndex === index ? (
                                <div className="flex items-center gap-2">
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedGuest(guest);
                                      setSendLinkMethod('text');
                                      setPayByLinkStep('pending');
                                    }}
                                    className="w-7 h-7 rounded-full bg-green-600 flex items-center justify-center hover:bg-green-500 transition-colors"
                                  >
                                    <MessageSquare className="w-3.5 h-3.5 text-white" />
                                  </button>
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedGuest(guest);
                                      setSendLinkMethod('text');
                                      setPayByLinkStep('pending');
                                    }}
                                    className="w-7 h-7 rounded-full bg-green-500 flex items-center justify-center hover:bg-green-400 transition-colors"
                                  >
                                    <Phone className="w-3.5 h-3.5 text-white" />
                                  </button>
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedGuest(guest);
                                      setSendLinkMethod('email');
                                      setPayByLinkStep('pending');
                                    }}
                                    className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center hover:bg-blue-400 transition-colors"
                                  >
                                    <Mail className="w-3.5 h-3.5 text-white" />
                                  </button>
                                </div>
                              ) : (
                                <span className="text-white text-sm">{guest.name}</span>
                              )}
                            </div>
                            <span className="text-neutral-300 text-sm flex items-center">{guest.phone}</span>
                            <span className="text-neutral-300 text-sm flex items-center">{guest.email}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Guest Confirmed Screen */}
                  {payByLinkStep === 'guest-confirmed' && selectedGuest && (
                    <div className="flex-1 flex flex-col overflow-hidden min-h-0">
                      {/* Selected Guest Card */}
                      <div className="p-4">
                        <div className="bg-neutral-800 rounded-xl p-4">
                          <div className="flex items-start gap-4">
                            <div className="w-14 h-14 rounded-full bg-neutral-600 flex items-center justify-center text-lg text-white font-medium">
                              {selectedGuest.avatar}
                            </div>
                            <div className="flex-1">
                              <h3 className="text-white font-semibold text-lg">{selectedGuest.name}</h3>
                              <div className="flex items-center gap-2 mt-1 text-neutral-400 text-sm">
                                <Phone className="w-4 h-4" />
                                <span>{selectedGuest.phone}</span>
                              </div>
                              <div className="flex items-center gap-2 mt-1 text-neutral-400 text-sm">
                                <Mail className="w-4 h-4" />
                                <span>{selectedGuest.email}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => {
                                  setSendLinkMethod('text');
                                  setPayByLinkStep('pending');
                                }}
                                className="w-9 h-9 rounded-full bg-green-600 flex items-center justify-center hover:bg-green-500 transition-colors"
                              >
                                <MessageSquare className="w-4 h-4 text-white" />
                              </button>
                              <button 
                                onClick={() => {
                                  setSendLinkMethod('text');
                                  setPayByLinkStep('pending');
                                }}
                                className="w-9 h-9 rounded-full bg-green-500 flex items-center justify-center hover:bg-green-400 transition-colors"
                              >
                                <Phone className="w-4 h-4 text-white" />
                              </button>
                              <button 
                                onClick={() => {
                                  setSendLinkMethod('email');
                                  setPayByLinkStep('pending');
                                }}
                                className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center hover:bg-blue-400 transition-colors"
                              >
                                <Mail className="w-4 h-4 text-white" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Send Link Buttons */}
                      <div className="px-4 pb-4 flex gap-3">
                        <button 
                          onClick={() => {
                            setSendLinkMethod('text');
                            setPayByLinkStep('pending');
                          }}
                          className="flex-1 py-3 bg-white text-black font-medium rounded-lg hover:bg-neutral-200 transition-colors"
                        >
                          Send Link by Text
                        </button>
                        <button 
                          onClick={() => {
                            setSendLinkMethod('email');
                            setPayByLinkStep('pending');
                          }}
                          className="flex-1 py-3 bg-white text-black font-medium rounded-lg hover:bg-neutral-200 transition-colors"
                        >
                          Send Link by Email
                        </button>
                      </div>

                      {/* Remaining Guest List */}
                      <div className="flex-1 overflow-auto px-4 min-h-0 pb-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                        <div className="grid grid-cols-3 gap-4 py-2 text-xs text-neutral-400 border-b border-neutral-700">
                          <span>Name</span>
                          <span>Phone Number</span>
                          <span>Email</span>
                        </div>
                        {mockGuests.filter(g => g.name !== selectedGuest.name).map((guest, index) => (
                          <div 
                            key={index}
                            onClick={() => setSelectedGuest(guest)}
                            className="grid grid-cols-3 gap-4 py-3 border-b border-neutral-700/50 hover:bg-neutral-800 cursor-pointer transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-neutral-700 flex items-center justify-center text-xs text-white font-medium">
                                {guest.avatar}
                              </div>
                              <span className="text-white text-sm">{guest.name}</span>
                            </div>
                            <span className="text-neutral-300 text-sm flex items-center">{guest.phone}</span>
                            <span className="text-neutral-300 text-sm flex items-center">{guest.email}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Payment Pending Screen */}
                  {payByLinkStep === 'pending' && selectedGuest && (
                    <div className="flex-1 flex flex-col items-center justify-center px-6 py-6">
                      <div className="w-20 h-20 rounded-full bg-orange-500/20 flex items-center justify-center mb-6">
                        <Clock className="w-10 h-10 text-orange-500" />
                      </div>
                      <h2 className="text-white text-2xl font-semibold mb-2">Payment Pending</h2>
                      <p className="text-neutral-400 text-sm mb-8">Waiting for customer to complete payment</p>
                      
                      <div className="w-full space-y-3 mb-8">
                        <div className="flex items-center justify-between py-2 border-b border-neutral-700">
                          <span className="text-neutral-400 text-sm">Amount Requested</span>
                          <span className="text-white font-medium">${paymentAmount}</span>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-neutral-700">
                          <span className="text-neutral-400 text-sm">Recipient</span>
                          <span className="text-white font-medium">{selectedGuest.phone}</span>
                        </div>
                      </div>

                      <button 
                        onClick={() => {
                          // Simulate: randomly go to expired or complete
                          const random = Math.random();
                          if (random < 0.5) {
                            setPayByLinkStep('expired');
                          } else {
                            setPaidAmount(parseFloat(paymentAmount) || 0);
                            setPayByLinkStep('complete');
                          }
                        }}
                        className="w-full py-3 border border-neutral-600 text-neutral-300 font-medium rounded-lg hover:bg-neutral-800 transition-colors"
                      >
                        REFRESH STATUS
                      </button>
                    </div>
                  )}

                  {/* Payment Expired Screen */}
                  {payByLinkStep === 'expired' && selectedGuest && (
                    <div className="flex-1 flex flex-col items-center justify-center px-6 py-6">
                      <div className="w-20 h-20 rounded-full bg-orange-500/20 flex items-center justify-center mb-6">
                        <AlertTriangle className="w-10 h-10 text-orange-500" />
                      </div>
                      <h2 className="text-white text-2xl font-semibold mb-2">Payment Link Expired</h2>
                      <p className="text-neutral-400 text-sm mb-8">The payment link has expired</p>
                      
                      <div className="w-full space-y-3 mb-8">
                        <div className="flex items-center justify-between py-2 border-b border-neutral-700">
                          <span className="text-neutral-400 text-sm">Amount Requested</span>
                          <span className="text-white font-medium">${paymentAmount}</span>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-neutral-700">
                          <span className="text-neutral-400 text-sm">Recipient</span>
                          <span className="text-white font-medium">{selectedGuest.phone}</span>
                        </div>
                      </div>

                      <button 
                        onClick={() => setPayByLinkStep('pending')}
                        className="w-full py-3 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-400 transition-colors"
                      >
                        RESEND LINK
                      </button>
                    </div>
                  )}

                  {/* Payment Complete Screen */}
                  {payByLinkStep === 'complete' && selectedGuest && (
                    <div className="flex-1 flex flex-col items-center justify-center px-6 py-6">
                      <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mb-6">
                        <CheckCircle className="w-10 h-10 text-green-500" />
                      </div>
                      <h2 className="text-white text-2xl font-semibold mb-2">Payment Complete</h2>
                      <p className="text-neutral-400 text-sm mb-8">The guest has complete their payment</p>
                      
                      <div className="w-full space-y-3 mb-8">
                        <div className="flex items-center justify-between py-2 border-b border-neutral-700">
                          <span className="text-neutral-400 text-sm">Amount Requested</span>
                          <span className="text-white font-medium">${paymentAmount}</span>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-neutral-700">
                          <span className="text-neutral-400 text-sm">Amount Paid</span>
                          <span className="text-green-500 font-medium">${paidAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-neutral-700">
                          <span className="text-neutral-400 text-sm">Recipient</span>
                          <span className="text-white font-medium">{selectedGuest.phone}</span>
                        </div>
                      </div>

                      <button 
                        onClick={() => setPaymentProcessed(true)}
                        className="w-full py-3 bg-white text-black font-medium rounded-lg hover:bg-neutral-200 transition-colors"
                      >
                        CONTINUE
                      </button>
                    </div>
                  )}
                </>
              ) : selectedPaymentMethod === 'qr-code' && qrCodeStep !== 'amount' ? (
                /* QR Code Payment Screens */
                <>
                  {/* Header with Back Button */}
                  <div className="flex items-center justify-between p-4 border-b border-neutral-700">
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => {
                          if (qrCodeStep === 'qr-display') {
                            setQrCodeStep('amount');
                            setShowQrPhoneInput(false);
                            setQrPhoneNumber('');
                          } else if (qrCodeStep === 'pending') {
                            setQrCodeStep('qr-display');
                          } else if (qrCodeStep === 'complete') {
                            setQrCodeStep('amount');
                            setShowQrPhoneInput(false);
                            setQrPhoneNumber('');
                          }
                        }}
                        className="w-8 h-8 rounded-full hover:bg-neutral-700 flex items-center justify-center transition-colors"
                      >
                        <ArrowLeft className="w-5 h-5 text-neutral-300" />
                      </button>
                      <span className="text-white text-lg font-medium">Pay by QR</span>
                    </div>
                    <span className="text-red-500 text-lg font-bold">${paymentAmount}</span>
                  </div>

                  {/* QR Display Screen */}
                  {qrCodeStep === 'qr-display' && (
                    <div className="flex-1 flex flex-col overflow-hidden min-h-0">
                      {/* Scan to Pay */}
                      <div className="flex-1 flex flex-col items-center justify-center px-6 py-4">
                        <p className="text-neutral-400 text-sm mb-2">Scan to Pay</p>
                        <p className="text-white text-3xl font-bold mb-6">${paymentAmount}</p>
                        
                        {/* QR Code Placeholder */}
                        <div className="w-48 h-48 bg-white rounded-xl p-3 mb-6 relative">
                          {/* QR Pattern placeholder */}
                          <div className="w-full h-full bg-white relative overflow-hidden">
                            {/* Create a grid pattern to simulate QR code */}
                            <div className="absolute inset-0 grid grid-cols-8 grid-rows-8 gap-0.5">
                              {Array.from({ length: 64 }).map((_, i) => (
                                <div 
                                  key={i} 
                                  className={`${
                                    // Corner patterns
                                    (i < 3 || (i >= 8 && i < 11) || (i >= 16 && i < 19) ||
                                     (i >= 5 && i < 8) || (i >= 13 && i < 16) || (i >= 21 && i < 24) ||
                                     (i >= 40 && i < 43) || (i >= 48 && i < 51) || (i >= 56 && i < 59) ||
                                     Math.random() > 0.6) ? 'bg-black' : 'bg-white'
                                  }`}
                                />
                              ))}
                            </div>
                            {/* Center logo */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full flex items-center justify-center border-2 border-neutral-200">
                              <QrCode className="w-5 h-5 text-neutral-700" />
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3 w-full max-w-xs">
                          <button 
                            onClick={() => {
                              // Simulate share QR
                            }}
                            className="flex-1 py-3 border border-neutral-600 text-neutral-300 font-medium rounded-lg hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2"
                          >
                            <ExternalLink className="w-4 h-4" />
                            SHARE QR
                          </button>
                          <button 
                            onClick={() => setShowQrPhoneInput(!showQrPhoneInput)}
                            className={`flex-1 py-3 font-medium rounded-lg transition-colors flex items-center justify-center gap-2 ${
                              showQrPhoneInput 
                                ? 'bg-neutral-700 text-white border border-neutral-600' 
                                : 'bg-neutral-800 text-white hover:bg-neutral-700'
                            }`}
                          >
                            <MessageSquare className="w-4 h-4" />
                            SHARE VIA TEXT
                          </button>
                        </div>

                        {/* Phone Input */}
                        {showQrPhoneInput && (
                          <div className="flex gap-2 w-full max-w-xs mt-4">
                            <div className="flex items-center gap-2 bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2">
                              <span className="text-lg">🇺🇸</span>
                              <ChevronDown className="w-4 h-4 text-neutral-400" />
                            </div>
                            <div className="flex-1 relative">
                              <input
                                type="tel"
                                value={qrPhoneNumber}
                                onChange={(e) => setQrPhoneNumber(e.target.value)}
                                placeholder="Phone Number*"
                                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500"
                              />
                            </div>
                            <button 
                              onClick={() => {
                                if (qrPhoneNumber.length >= 10) {
                                  setQrCodeStep('pending');
                                }
                              }}
                              disabled={qrPhoneNumber.length < 10}
                              className={`px-4 py-2 font-medium rounded-lg transition-colors ${
                                qrPhoneNumber.length >= 10
                                  ? 'bg-orange-500 text-white hover:bg-orange-400'
                                  : 'bg-neutral-700 text-neutral-500 cursor-not-allowed'
                              }`}
                            >
                              <Send className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Payment Pending Screen */}
                  {qrCodeStep === 'pending' && (
                    <div className="flex-1 flex flex-col items-center justify-center px-6 py-6">
                      <div className="w-20 h-20 rounded-full bg-orange-500/20 flex items-center justify-center mb-6">
                        <Clock className="w-10 h-10 text-orange-500" />
                      </div>
                      <h2 className="text-white text-2xl font-semibold mb-2">Payment Pending</h2>
                      <p className="text-neutral-400 text-sm mb-8">Waiting for customer to complete payment</p>
                      
                      <div className="w-full space-y-3 mb-8">
                        <div className="flex items-center justify-between py-2 border-b border-neutral-700">
                          <span className="text-neutral-400 text-sm">Amount Requested</span>
                          <span className="text-white font-medium">${paymentAmount}</span>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-neutral-700">
                          <span className="text-neutral-400 text-sm">Recipient</span>
                          <span className="text-white font-medium">{qrPhoneNumber || 'QR Scan'}</span>
                        </div>
                      </div>

                      <button 
                        onClick={() => {
                          // Simulate: complete the payment
                          const paid = parseFloat(paymentAmount) || 0;
                          setPaidAmount(paid);
                          setQrCodeStep('complete');
                        }}
                        className="w-full py-3 border border-neutral-600 text-neutral-300 font-medium rounded-lg hover:bg-neutral-800 transition-colors"
                      >
                        REFRESH STATUS
                      </button>
                    </div>
                  )}

                  {/* Payment Complete Screen */}
                  {qrCodeStep === 'complete' && (
                    <div className="flex-1 flex flex-col items-center justify-center px-6 py-6">
                      <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mb-6">
                        <CheckCircle className="w-10 h-10 text-green-500" />
                      </div>
                      <h2 className="text-white text-2xl font-semibold mb-2">Payment Complete</h2>
                      <p className="text-neutral-400 text-sm mb-8">The guest has completed their payment</p>
                      
                      <div className="w-full space-y-3 mb-8">
                        <div className="flex items-center justify-between py-2 border-b border-neutral-700">
                          <span className="text-neutral-400 text-sm">Amount Requested</span>
                          <span className="text-white font-medium">${paymentAmount}</span>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-neutral-700">
                          <span className="text-neutral-400 text-sm">Amount Paid</span>
                          <span className="text-green-500 font-medium">${paidAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-neutral-700">
                          <span className="text-neutral-400 text-sm">Recipient</span>
                          <span className="text-white font-medium">{qrPhoneNumber || 'QR Scan'}</span>
                        </div>
                      </div>

                      <button 
                        onClick={() => setPaymentProcessed(true)}
                        className="w-full py-3 bg-white text-black font-medium rounded-lg hover:bg-neutral-200 transition-colors"
                      >
                        CONTINUE
                      </button>
                    </div>
                  )}
                </>
              ) : selectedPaymentMethod === 'loyalty' && loyaltyStep !== 'guest-list' ? (
                /* Loyalty Screens - After Guest Selection */
                <>
                  {/* Header with Back Button */}
                  <div className="flex items-center justify-between p-4 border-b border-neutral-700">
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => {
                          if (loyaltyStep === 'guest-selected') {
                            setLoyaltyStep('guest-list');
                            setLoyaltySelectedGuest(null);
                          } else if (loyaltyStep === 'points-input') {
                            setLoyaltyStep('guest-selected');
                            setLoyaltyPointsToRedeem('');
                            setShowLoyaltyKeypad(false);
                          } else if (loyaltyStep === 'otp') {
                            setLoyaltyStep('points-input');
                            setLoyaltyOtp(['', '', '', '']);
                          } else if (loyaltyStep === 'complete') {
                            setLoyaltyStep('guest-list');
                            setLoyaltySelectedGuest(null);
                            setLoyaltyPointsToRedeem('');
                          }
                        }}
                        className="w-8 h-8 rounded-full hover:bg-neutral-700 flex items-center justify-center transition-colors"
                      >
                        <ArrowLeft className="w-5 h-5 text-neutral-300" />
                      </button>
                      <span className="text-white text-lg font-medium">Pay by Loyalty</span>
                    </div>
                  </div>

                  {/* Guest Selected with Points Screen */}
                  {loyaltyStep === 'guest-selected' && loyaltySelectedGuest && (
                    <div className="flex-1 flex flex-col overflow-hidden min-h-0">
                      {/* Selected Guest Card with Points */}
                      <div className="p-4">
                        <div className="flex items-start gap-4">
                          <div className="w-14 h-14 rounded-full bg-neutral-600 flex items-center justify-center text-lg text-white font-medium overflow-hidden">
                            {loyaltySelectedGuest.avatar}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-4">
                              <h3 className="text-white font-semibold text-lg">{loyaltySelectedGuest.name}</h3>
                              <div className="flex items-center gap-2 text-neutral-400 text-sm">
                                <Phone className="w-4 h-4" />
                                <span>{loyaltySelectedGuest.phone}</span>
                              </div>
                              <div className="flex items-center gap-2 text-neutral-400 text-sm">
                                <Mail className="w-4 h-4" />
                                <span>{loyaltySelectedGuest.email}</span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between mt-2">
                              <div className="flex items-center gap-2">
                                <Tag className="w-4 h-4 text-neutral-400" />
                                <span className="text-white font-medium">{(loyaltySelectedGuest.loyaltyPoints || 1250).toLocaleString()} Points</span>
                              </div>
                              <span className="text-green-500 text-sm">Equivalent Value £{((loyaltySelectedGuest.loyaltyPoints || 1250)).toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* REDEEM Button */}
                      <div className="px-4 pb-4">
                        <button 
                          onClick={() => {
                            const suggestedPoints = Math.ceil(parseFloat(paymentAmount));
                            setLoyaltyPointsToRedeem(suggestedPoints.toString());
                            setLoyaltyStep('points-input');
                          }}
                          className="w-full py-3 bg-neutral-800 text-white font-medium rounded-lg hover:bg-neutral-700 transition-colors flex items-center justify-center gap-2"
                        >
                          <Tag className="w-4 h-4" />
                          REDEEM
                        </button>
                      </div>

                      {/* Remaining Guest List */}
                      <div className="flex-1 overflow-auto px-4 min-h-0 pb-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                        {/* Search Input */}
                        <div className="mb-3">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                            <Input
                              type="text"
                              placeholder="Search Guest"
                              value={loyaltySearchQuery}
                              onChange={(e) => setLoyaltySearchQuery(e.target.value)}
                              className="w-full pl-10 py-2 bg-neutral-800 border-neutral-600 text-white placeholder:text-neutral-500 rounded-lg"
                            />
                          </div>
                        </div>
                        {/* Table Header */}
                        <div className="grid grid-cols-3 gap-4 py-2 text-xs text-neutral-400 border-b border-neutral-700">
                          <span>Name</span>
                          <span>Phone Number</span>
                          <span>Email</span>
                        </div>
                        {/* Guest Rows */}
                        {mockGuests
                          .filter(g => g.name !== loyaltySelectedGuest.name)
                          .filter(guest => 
                            loyaltySearchQuery === '' || 
                            guest.name.toLowerCase().includes(loyaltySearchQuery.toLowerCase()) ||
                            guest.phone.includes(loyaltySearchQuery) ||
                            guest.email.toLowerCase().includes(loyaltySearchQuery.toLowerCase())
                          )
                          .map((guest, index) => (
                          <div 
                            key={index}
                            onClick={() => setLoyaltySelectedGuest(guest)}
                            className="grid grid-cols-3 gap-4 py-3 border-b border-neutral-700/50 hover:bg-neutral-800 cursor-pointer transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-neutral-700 flex items-center justify-center text-xs text-white font-medium">
                                {guest.avatar}
                              </div>
                              <span className="text-white text-sm">{guest.name}</span>
                            </div>
                            <span className="text-neutral-300 text-sm flex items-center">{guest.phone}</span>
                            <span className="text-neutral-300 text-sm flex items-center">{guest.email}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Points Input Screen */}
                  {loyaltyStep === 'points-input' && loyaltySelectedGuest && (
                    <div className="flex-1 flex flex-col overflow-hidden min-h-0">
                      {/* Selected Guest Card */}
                      <div className="p-4 border-b border-neutral-700">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-full bg-neutral-600 flex items-center justify-center text-sm text-white font-medium overflow-hidden">
                            {loyaltySelectedGuest.avatar}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-4">
                              <h3 className="text-white font-semibold">{loyaltySelectedGuest.name}</h3>
                              <div className="flex items-center gap-1 text-neutral-400 text-xs">
                                <Phone className="w-3 h-3" />
                                <span>{loyaltySelectedGuest.phone}</span>
                              </div>
                              <div className="flex items-center gap-1 text-neutral-400 text-xs">
                                <Mail className="w-3 h-3" />
                                <span>{loyaltySelectedGuest.email}</span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between mt-1">
                              <div className="flex items-center gap-1">
                                <Tag className="w-3 h-3 text-neutral-400" />
                                <span className="text-white text-sm">{(loyaltySelectedGuest.loyaltyPoints || 1250).toLocaleString()} Points</span>
                              </div>
                              <span className="text-green-500 text-xs">Equivalent Value £{((loyaltySelectedGuest.loyaltyPoints || 1250)).toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Points to Redeem */}
                      <div className="p-4 flex-1 flex flex-col">
                        <div className="mb-2">
                          <h4 className="text-white font-semibold">Points to Redeem</h4>
                          <p className="text-neutral-400 text-sm">Total due: £{paymentAmount} (Suggested: {Math.ceil(parseFloat(paymentAmount))} points)</p>
                        </div>

                        {/* Points Input Box */}
                        <div 
                          onClick={() => setShowLoyaltyKeypad(!showLoyaltyKeypad)}
                          className="w-full py-4 px-4 bg-neutral-800 border border-neutral-600 rounded-lg text-center text-2xl text-white font-medium cursor-pointer mb-2"
                        >
                          {loyaltyPointsToRedeem || '0'}
                        </div>
                        <p className="text-neutral-400 text-xs mb-4">Maximum: {(loyaltySelectedGuest.loyaltyPoints || 1250).toLocaleString()} points</p>

                        {/* Keypad */}
                        {showLoyaltyKeypad && (
                          <div className="grid grid-cols-3 gap-2 mb-4">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                              <button
                                key={num}
                                onClick={() => setLoyaltyPointsToRedeem((loyaltyPointsToRedeem + num.toString()).slice(0, 6))}
                                className="py-3 rounded-lg text-lg font-medium bg-neutral-800 text-white border border-neutral-600 hover:bg-neutral-700 transition-colors"
                              >
                                {num}
                              </button>
                            ))}
                            <button
                              onClick={() => setLoyaltyPointsToRedeem(loyaltyPointsToRedeem + '.')}
                              className="py-3 rounded-lg text-lg font-medium bg-neutral-800 text-white border border-neutral-600 hover:bg-neutral-700 transition-colors"
                            >
                              .
                            </button>
                            <button
                              onClick={() => setLoyaltyPointsToRedeem((loyaltyPointsToRedeem + '0').slice(0, 6))}
                              className="py-3 rounded-lg text-lg font-medium bg-neutral-800 text-white border border-neutral-600 hover:bg-neutral-700 transition-colors"
                            >
                              0
                            </button>
                            <button
                              onClick={() => setLoyaltyPointsToRedeem('')}
                              className="py-3 rounded-lg text-lg font-medium bg-neutral-800 text-red-400 border border-neutral-600 hover:bg-neutral-700 transition-colors"
                            >
                              C
                            </button>
                          </div>
                        )}

                        {/* REDEEM Button */}
                        <button 
                          onClick={() => {
                            const points = parseInt(loyaltyPointsToRedeem) || 0;
                            if (points > 0 && points <= (loyaltySelectedGuest.loyaltyPoints || 1250)) {
                              setLoyaltyStep('otp');
                            }
                          }}
                          disabled={!loyaltyPointsToRedeem || parseInt(loyaltyPointsToRedeem) <= 0 || parseInt(loyaltyPointsToRedeem) > (loyaltySelectedGuest.loyaltyPoints || 1250)}
                          className={`w-full py-3 font-medium rounded-lg transition-colors flex items-center justify-center gap-2 mt-auto ${
                            loyaltyPointsToRedeem && parseInt(loyaltyPointsToRedeem) > 0 && parseInt(loyaltyPointsToRedeem) <= (loyaltySelectedGuest.loyaltyPoints || 1250)
                              ? 'bg-neutral-800 text-white hover:bg-neutral-700'
                              : 'bg-neutral-700 text-neutral-500 cursor-not-allowed'
                          }`}
                        >
                          <Tag className="w-4 h-4" />
                          REDEEM
                        </button>
                      </div>
                    </div>
                  )}

                  {/* OTP Verification Screen */}
                  {loyaltyStep === 'otp' && loyaltySelectedGuest && (
                    <div className="flex-1 flex flex-col overflow-hidden min-h-0 p-4">
                      {/* Points Summary */}
                      <div className="flex items-center justify-between py-3 border-b border-neutral-700 mb-6">
                        <div className="flex items-center gap-2">
                          <Tag className="w-4 h-4 text-neutral-400" />
                          <span className="text-white">{((loyaltySelectedGuest.loyaltyPoints || 1250) - parseInt(loyaltyPointsToRedeem || '0')).toLocaleString()} Points Available</span>
                        </div>
                        <span className="text-white">Point to be Deducted <span className="font-bold">{loyaltyPointsToRedeem}</span></span>
                      </div>

                      {/* Instructions */}
                      <p className="text-neutral-400 text-sm text-center mb-6">
                        Please scan the qr code below or enter the otp you received via the registered mobile number {loyaltySelectedGuest.phone}.
                      </p>

                      {/* QR Code */}
                      <div className="flex justify-center mb-6">
                        <div className="w-40 h-40 bg-white rounded-xl p-2 relative">
                          <div className="w-full h-full bg-white relative overflow-hidden">
                            <div className="absolute inset-0 grid grid-cols-8 grid-rows-8 gap-0.5">
                              {Array.from({ length: 64 }).map((_, i) => (
                                <div 
                                  key={i} 
                                  className={`${
                                    (i < 3 || (i >= 8 && i < 11) || (i >= 16 && i < 19) ||
                                     (i >= 5 && i < 8) || (i >= 13 && i < 16) || (i >= 21 && i < 24) ||
                                     (i >= 40 && i < 43) || (i >= 48 && i < 51) || (i >= 56 && i < 59) ||
                                     Math.random() > 0.6) ? 'bg-black' : 'bg-white'
                                  }`}
                                />
                              ))}
                            </div>
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full flex items-center justify-center border-2 border-neutral-200">
                              <span className="text-black font-bold text-xs">e</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* OTP Label */}
                      <p className="text-white text-center font-medium mb-4">OTP</p>

                      {/* OTP Input Boxes */}
                      <div className="flex justify-center gap-3 mb-8">
                        {[0, 1, 2, 3].map((index) => (
                          <input
                            key={index}
                            type="text"
                            maxLength={1}
                            value={loyaltyOtp[index]}
                            onChange={(e) => {
                              const newOtp = [...loyaltyOtp];
                              newOtp[index] = e.target.value;
                              setLoyaltyOtp(newOtp);
                              // Auto-focus next input
                              if (e.target.value && index < 3) {
                                const nextInput = e.target.parentElement?.children[index + 1] as HTMLInputElement;
                                nextInput?.focus();
                              }
                            }}
                            className="w-12 h-12 bg-neutral-800 border border-neutral-600 rounded-lg text-center text-white text-xl font-medium focus:outline-none focus:border-white"
                          />
                        ))}
                      </div>

                      {/* REDEEM Button */}
                      <button 
                        onClick={() => {
                          // Simulate OTP verification and complete payment
                          const points = parseInt(loyaltyPointsToRedeem) || 0;
                          setPaidAmount(points);
                          setLoyaltyStep('complete');
                        }}
                        className="w-full py-3 bg-neutral-800 text-white font-medium rounded-lg hover:bg-neutral-700 transition-colors flex items-center justify-center gap-2 mt-auto"
                      >
                        <Tag className="w-4 h-4" />
                        REDEEM
                      </button>
                    </div>
                  )}

                  {/* Payment Complete Screen */}
                  {loyaltyStep === 'complete' && loyaltySelectedGuest && (
                    <div className="flex-1 flex flex-col items-center justify-center px-6 py-6">
                      <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mb-6">
                        <CheckCircle className="w-10 h-10 text-green-500" />
                      </div>
                      <h2 className="text-white text-2xl font-semibold mb-2">Payment Complete</h2>
                      <p className="text-neutral-400 text-sm mb-8">Your Payment has been Processed Successfully</p>
                      
                      <div className="w-full space-y-3 mb-8">
                        <div className="flex items-center justify-between py-2 border-b border-neutral-700">
                          <span className="text-neutral-400 text-sm">Point Used</span>
                          <span className="text-red-500 font-medium">-{loyaltyPointsToRedeem} points</span>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-neutral-700">
                          <span className="text-neutral-400 text-sm">Available point balance</span>
                          <span className="text-green-500 font-medium">{((loyaltySelectedGuest.loyaltyPoints || 1250) - parseInt(loyaltyPointsToRedeem || '0')).toLocaleString()} points</span>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-neutral-700">
                          <span className="text-neutral-400 text-sm">Equivalent Value</span>
                          <span className="text-white font-medium">£{((loyaltySelectedGuest.loyaltyPoints || 1250) - parseInt(loyaltyPointsToRedeem || '0')).toFixed(2)}</span>
                        </div>
                      </div>

                      <button 
                        onClick={() => setPaymentProcessed(true)}
                        className="w-full py-3 bg-white text-black font-medium rounded-lg hover:bg-neutral-200 transition-colors"
                      >
                        CONTINUE
                      </button>
                    </div>
                  )}
                </>
              ) : selectedPaymentMethod === 'loyalty' && loyaltyStep === 'guest-list' ? (
                /* Loyalty Guest List Screen */
                <>
                  {/* Header with Back Button */}
                  <div className="flex items-center justify-between p-4 border-b border-neutral-700">
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => {
                          setSelectedPaymentMethod('cash');
                          setLoyaltyStep('guest-list');
                        }}
                        className="w-8 h-8 rounded-full hover:bg-neutral-700 flex items-center justify-center transition-colors"
                      >
                        <ArrowLeft className="w-5 h-5 text-neutral-300" />
                      </button>
                      <span className="text-white text-lg font-medium">Pay by Loyalty</span>
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col overflow-hidden min-h-0">
                    {/* Info Text */}
                    <div className="px-4 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-neutral-400 text-sm">
                        <div className="w-5 h-5 rounded-full border border-neutral-400 flex items-center justify-center">
                          <span className="text-xs">i</span>
                        </div>
                        <span>Search for the guest to redeem loyalty points or add guest details.</span>
                      </div>
                      <button 
                        onClick={() => setShowLoyaltyAddGuest(true)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-neutral-700 rounded-lg hover:bg-neutral-600 transition-colors"
                      >
                        <UserPlus className="w-4 h-4 text-white" />
                        <span className="text-white text-sm">Add Guest</span>
                      </button>
                    </div>

                    {/* Search Input */}
                    <div className="px-4 pb-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                        <Input
                          type="text"
                          placeholder="Search Guest"
                          value={loyaltySearchQuery}
                          onChange={(e) => setLoyaltySearchQuery(e.target.value)}
                          className="w-full pl-10 py-2 bg-neutral-800 border-neutral-600 text-white placeholder:text-neutral-500 rounded-lg"
                        />
                      </div>
                    </div>

                    {/* Guest List Table */}
                    <div className="flex-1 overflow-auto px-4 min-h-0 pb-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                      {/* Table Header */}
                      <div className="grid grid-cols-3 gap-4 py-2 text-xs text-neutral-400 border-b border-neutral-700">
                        <span>Name</span>
                        <span>Phone Number</span>
                        <span>Email</span>
                      </div>
                      {/* Guest Rows */}
                      {mockGuests
                        .filter(guest => 
                          loyaltySearchQuery === '' || 
                          guest.name.toLowerCase().includes(loyaltySearchQuery.toLowerCase()) ||
                          guest.phone.includes(loyaltySearchQuery) ||
                          guest.email.toLowerCase().includes(loyaltySearchQuery.toLowerCase())
                        )
                        .map((guest, index) => (
                        <div 
                          key={index}
                          onClick={() => {
                            setLoyaltySelectedGuest(guest);
                            setLoyaltyStep('guest-selected');
                          }}
                          className="grid grid-cols-3 gap-4 py-3 border-b border-neutral-700/50 hover:bg-neutral-800 cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-neutral-700 flex items-center justify-center text-xs text-white font-medium">
                              {guest.avatar}
                            </div>
                            <span className="text-white text-sm">{guest.name}</span>
                          </div>
                          <span className="text-neutral-300 text-sm flex items-center">{guest.phone}</span>
                          <span className="text-neutral-300 text-sm flex items-center">{guest.email}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Add Guest Modal */}
                  {showLoyaltyAddGuest && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50">
                      <div className="bg-white rounded-xl w-[400px] overflow-hidden">
                        {/* Modal Header */}
                        <div className="relative p-4 pb-2">
                          <button 
                            onClick={() => setShowLoyaltyAddGuest(false)}
                            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center hover:bg-neutral-700 transition-colors"
                          >
                            <X className="w-4 h-4 text-white" />
                          </button>
                          <h3 className="text-black text-xl font-semibold text-center">Add Guest</h3>
                          <p className="text-neutral-500 text-sm text-center mt-1">Search for existing or add new guest information to continue with the order</p>
                        </div>

                        {/* Form Fields */}
                        <div className="p-4 space-y-3">
                          <input
                            type="text"
                            placeholder="Guest Name*"
                            value={loyaltyNewGuest.name}
                            onChange={(e) => setLoyaltyNewGuest({ ...loyaltyNewGuest, name: e.target.value })}
                            className="w-full px-4 py-3 bg-white border border-neutral-300 rounded-lg text-black placeholder-neutral-400 focus:outline-none focus:border-neutral-500"
                          />
                          <div className="flex gap-2">
                            <div className="flex items-center gap-2 bg-white border border-neutral-300 rounded-lg px-3 py-2">
                              <span className="text-lg">🇺🇸</span>
                              <span className="text-black text-sm">+1</span>
                              <ChevronDown className="w-4 h-4 text-neutral-400" />
                            </div>
                            <input
                              type="tel"
                              placeholder="Phone Number*"
                              value={loyaltyNewGuest.phone}
                              onChange={(e) => setLoyaltyNewGuest({ ...loyaltyNewGuest, phone: e.target.value })}
                              className="flex-1 px-4 py-3 bg-white border border-neutral-300 rounded-lg text-black placeholder-neutral-400 focus:outline-none focus:border-neutral-500"
                            />
                          </div>
                          <input
                            type="email"
                            placeholder="name@example.com"
                            value={loyaltyNewGuest.email}
                            onChange={(e) => setLoyaltyNewGuest({ ...loyaltyNewGuest, email: e.target.value })}
                            className="w-full px-4 py-3 bg-white border border-neutral-300 rounded-lg text-black placeholder-neutral-400 focus:outline-none focus:border-neutral-500"
                          />
                        </div>

                        {/* ADD Button */}
                        <div className="p-4 pt-2">
                          <button 
                            onClick={() => {
                              if (loyaltyNewGuest.name && loyaltyNewGuest.phone) {
                                const newGuest: GuestType = {
                                  name: loyaltyNewGuest.name,
                                  phone: loyaltyNewGuest.phone,
                                  email: loyaltyNewGuest.email || 'guest@example.com',
                                  avatar: loyaltyNewGuest.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
                                  loyaltyPoints: 1250
                                };
                                setLoyaltySelectedGuest(newGuest);
                                setShowLoyaltyAddGuest(false);
                                setLoyaltyStep('guest-selected');
                                setLoyaltyNewGuest({ name: '', phone: '', email: '' });
                              }
                            }}
                            disabled={!loyaltyNewGuest.name || !loyaltyNewGuest.phone}
                            className={`w-full py-3 font-medium rounded-lg transition-colors ${
                              loyaltyNewGuest.name && loyaltyNewGuest.phone
                                ? 'bg-neutral-900 text-white hover:bg-neutral-800'
                                : 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
                            }`}
                          >
                            ADD
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                /* Payment Entry View */
                <>
                  {/* Header */}
                  <div className="flex items-center justify-center py-6 border-b border-neutral-700">
                    <span className="text-white text-lg font-medium">Total Due</span>
                    <span className="text-red-500 text-lg font-bold ml-2">${finalTotal.toFixed(2)}</span>
                  </div>

                  {/* Payment Methods */}
                  <div className="p-6 border-b border-neutral-700">
                    <div className="flex justify-center gap-4">
                      {/* Visible payment methods */}
                      {visiblePaymentMethods.map((method) => {
                        const IconComponent = method.icon;
                        const isSelected = selectedPaymentMethod === method.id;
                        
                        return (
                          <button
                            key={method.id}
                            onClick={() => {
                              setSelectedPaymentMethod(method.id);
                              setShowOtherPayments(false);
                              // Auto-show keypad for Card, Gift Card, and Pay by Link payment
                              if (method.id === 'card' || method.id === 'gift-card' || method.id === 'pay-link') {
                                setShowKeypad(true);
                              }
                              // Reset gift card step when selecting gift card
                              if (method.id === 'gift-card') {
                                setGiftCardStep('amount');
                                setGiftCardNumber('');
                              }
                              // Reset pay by link step when selecting pay by link
                              if (method.id === 'pay-link') {
                                setPayByLinkStep('amount');
                                setSelectedGuest(null);
                                setGuestSearchQuery('');
                              }
                            }}
                            className="flex flex-col items-center gap-1.5"
                          >
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors border ${
                              isSelected 
                                ? 'bg-white border-white' 
                                : 'bg-neutral-800 border-neutral-600 hover:border-neutral-500'
                            }`}>
                              <IconComponent className={`w-5 h-5 ${isSelected ? 'text-neutral-900' : 'text-neutral-300'}`} />
                            </div>
                            <span className={`text-[11px] ${isSelected ? 'text-white font-medium' : 'text-neutral-400'}`}>
                              {method.name}
                            </span>
                          </button>
                        );
                      })}
                      
                      {/* "Other" button - always at the end */}
                      <div className="relative">
                        <button
                          onClick={() => setShowOtherPayments(!showOtherPayments)}
                          className="flex flex-col items-center gap-1.5"
                        >
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors border ${
                            showOtherPayments 
                              ? 'bg-white border-white' 
                              : 'bg-neutral-800 border-neutral-600 hover:border-neutral-500'
                          }`}>
                            <ArrowRightCircle className={`w-5 h-5 ${showOtherPayments ? 'text-neutral-900' : 'text-neutral-300'}`} />
                          </div>
                          <span className={`text-[11px] ${showOtherPayments ? 'text-white font-medium' : 'text-neutral-400'}`}>
                            Other
                          </span>
                        </button>
                        
                        {/* Other Payment Methods Dropdown */}
                        {showOtherPayments && (
                          <>
                            {/* Backdrop to close dropdown when clicking outside */}
                            <div 
                              className="fixed inset-0 z-[100]" 
                              onClick={() => setShowOtherPayments(false)}
                            />
                            
                            {/* Dropdown Panel - right edge aligned with button */}
                            <div className="absolute top-full right-0 mt-2 z-[101] bg-neutral-800 rounded-lg border border-neutral-600 p-4 shadow-xl min-w-[420px]">
                              {/* Header */}
                              <div className="flex items-center justify-between mb-4">
                                <span className="text-white font-medium">Other Payment Methods</span>
                                <button 
                                  onClick={() => setShowOtherPayments(false)}
                                  className="w-6 h-6 rounded-full hover:bg-neutral-700 flex items-center justify-center transition-colors"
                                >
                                  <X className="w-4 h-4 text-neutral-400" />
                                </button>
                              </div>
                              
                              {/* Payment Options Grid - First Row (6 items) */}
                              <div className="grid grid-cols-6 gap-3 mb-3">
                                {dropdownPaymentMethods.slice(0, 6).map((otherMethod) => {
                                  const OtherIcon = otherMethod.icon;
                                  return (
                                    <button 
                                      key={otherMethod.id}
                                      onClick={() => handleSelectFromDropdown(otherMethod)}
                                      className="flex flex-col items-center gap-1"
                                    >
                                      <div className="w-12 h-12 rounded-full bg-neutral-700 border border-neutral-600 hover:border-neutral-500 flex items-center justify-center transition-colors">
                                        <OtherIcon className="w-5 h-5 text-neutral-300" />
                                      </div>
                                      <span className="text-[10px] text-neutral-400 text-center leading-tight">{otherMethod.name}</span>
                                    </button>
                                  );
                                })}
                              </div>
                              
                              {/* Second Row (remaining items) - Centered */}
                              {dropdownPaymentMethods.length > 6 && (
                                <div className="flex justify-center gap-3">
                                  {dropdownPaymentMethods.slice(6).map((otherMethod) => {
                                    const OtherIcon = otherMethod.icon;
                                    return (
                                      <button 
                                        key={otherMethod.id}
                                        onClick={() => handleSelectFromDropdown(otherMethod)}
                                        className="flex flex-col items-center gap-1"
                                      >
                                        <div className="w-12 h-12 rounded-full bg-neutral-700 border border-neutral-600 hover:border-neutral-500 flex items-center justify-center transition-colors">
                                          <OtherIcon className="w-5 h-5 text-neutral-300" />
                                        </div>
                                        <span className="text-[10px] text-neutral-400 text-center leading-tight">{otherMethod.name}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Amount Display / Gift Card Number Display */}
                  <div className="px-6 py-4 border-b border-neutral-700">
                    {selectedPaymentMethod === 'gift-card' && giftCardStep === 'enter-card' ? (
                      /* Gift Card Number Entry */
                      <div className="flex flex-col items-center">
                        <span className="text-neutral-400 text-xs mb-2">Gift Card Number</span>
                        <div className="flex items-center justify-center gap-2 bg-neutral-800 rounded-lg px-4 py-4 w-full">
                          <span className="text-white text-2xl font-bold tracking-widest text-center">
                            {giftCardNumber.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim() || 'XXXX XXXX XXXX XXXX'}
                          </span>
                        </div>
                      </div>
                    ) : (
                      /* Regular Amount Display */
                      <div className="flex items-center justify-center gap-2 bg-neutral-800 rounded-lg px-4 py-4">
                        <span className="flex-1 text-green-500 text-2xl font-bold text-center">${paymentAmount}</span>
                        {/* Hide keypad toggle for Card, Gift Card, and Pay by Link payment - they always show keypad */}
                        {selectedPaymentMethod !== 'card' && selectedPaymentMethod !== 'gift-card' && selectedPaymentMethod !== 'pay-link' && (
                          <button 
                            onClick={() => setShowKeypad(!showKeypad)}
                            className={`w-10 h-10 rounded-lg border flex items-center justify-center transition-colors ${
                              showKeypad 
                                ? 'bg-white border-white' 
                                : 'bg-neutral-700 border-neutral-600 hover:bg-neutral-600'
                            }`}
                          >
                            <Grid3X3 className={`w-5 h-5 ${showKeypad ? 'text-neutral-900' : 'text-neutral-300'}`} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Quick Amount Buttons OR Keypad */}
                  <div className="p-4 space-y-2 flex-1">
                    {(showKeypad || selectedPaymentMethod === 'card' || selectedPaymentMethod === 'gift-card' || selectedPaymentMethod === 'pay-link') ? (
                      /* Numeric Keypad - Compact */
                      <div className="flex flex-col gap-2">
                        {[['7', '8', '9'], ['4', '5', '6'], ['1', '2', '3']].map((row, rowIndex) => (
                          <div key={rowIndex} className="flex gap-2">
                            {row.map((key) => (
                              <button
                                key={key}
                                onClick={() => {
                                  if (selectedPaymentMethod === 'gift-card' && giftCardStep === 'enter-card') {
                                    handleGiftCardKeypadPress(key);
                                  } else {
                                    handleKeypadPress(key);
                                  }
                                }}
                                className="flex-1 py-3 rounded-lg text-base font-medium bg-neutral-800 text-neutral-300 border border-neutral-600 hover:bg-neutral-700 transition-colors"
                              >
                                {key}
                              </button>
                            ))}
                          </div>
                        ))}
                        <div className="flex gap-2">
                          {selectedPaymentMethod === 'gift-card' && giftCardStep === 'enter-card' ? (
                            /* Gift Card keypad last row: 0, 00, C */
                            <>
                              <button
                                onClick={() => handleGiftCardKeypadPress('0')}
                                className="flex-1 py-3 rounded-lg text-base font-medium bg-neutral-800 text-neutral-300 border border-neutral-600 hover:bg-neutral-700 transition-colors"
                              >
                                0
                              </button>
                              <button
                                onClick={() => handleGiftCardKeypadPress('00')}
                                className="flex-1 py-3 rounded-lg text-base font-medium bg-neutral-800 text-neutral-300 border border-neutral-600 hover:bg-neutral-700 transition-colors"
                              >
                                00
                              </button>
                              <button
                                onClick={() => handleGiftCardKeypadPress('C')}
                                className="flex-1 py-3 rounded-lg text-base font-medium bg-neutral-800 text-neutral-300 border border-neutral-600 hover:bg-neutral-700 transition-colors"
                              >
                                C
                              </button>
                            </>
                          ) : (
                            /* Regular keypad last row: ., 0, backspace */
                            <>
                              <button
                                onClick={() => handleKeypadPress('.')}
                                className="flex-1 py-3 rounded-lg text-base font-medium bg-neutral-800 text-neutral-300 border border-neutral-600 hover:bg-neutral-700 transition-colors"
                              >
                                .
                              </button>
                              <button
                                onClick={() => handleKeypadPress('0')}
                                className="flex-1 py-3 rounded-lg text-base font-medium bg-neutral-800 text-neutral-300 border border-neutral-600 hover:bg-neutral-700 transition-colors"
                              >
                                0
                              </button>
                              <button
                                onClick={() => handleKeypadPress('backspace')}
                                className="flex-1 py-3 rounded-lg text-base font-medium bg-neutral-800 text-neutral-300 border border-neutral-600 hover:bg-neutral-700 transition-colors flex items-center justify-center"
                              >
                                <Delete className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ) : (
                      /* Quick Amount Buttons with quantity tracking */
                      <>
                        <div className="flex gap-4 px-2">
                          <div className="flex-1 relative py-1">
                            <button
                              onClick={() => {
                                setAmountQuantities({});
                                setPaymentAmount(finalTotal.toFixed(2));
                              }}
                              className={`w-full py-3 rounded-lg text-sm font-medium transition-colors ${
                                paymentAmount === finalTotal.toFixed(2) && Object.keys(amountQuantities).length === 0
                                  ? 'bg-neutral-900 text-white border border-neutral-600'
                                  : 'bg-neutral-800 text-neutral-300 border border-neutral-600 hover:border-neutral-500'
                              }`}
                            >
                              ${finalTotal.toFixed(2)}
                            </button>
                          </div>
                          {quickAmounts.slice(0, 3).map((amount) => {
                            const qty = amountQuantities[amount] || 0;
                            return (
                              <div key={amount} className="flex-1 relative py-1">
                                <button
                                  onClick={() => handleAddAmount(amount)}
                                  className={`w-full py-3 rounded-lg text-sm font-medium transition-colors ${
                                    qty > 0
                                      ? 'bg-neutral-900 text-white border border-neutral-600'
                                      : 'bg-neutral-800 text-neutral-300 border border-neutral-600 hover:border-neutral-500'
                                  }`}
                                >
                                  ${amount}
                                </button>
                                {qty > 0 && (
                                  <>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemoveAmount(amount);
                                      }}
                                      className="absolute -top-0.5 -left-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center leading-none text-xs hover:bg-red-600 transition-colors z-10"
                                    >
                                      ×
                                    </button>
                                    <span className="absolute -top-0.5 -right-1.5 w-5 h-5 rounded-full bg-green-500 text-white flex items-center justify-center text-[10px] font-medium z-10">
                                      x{qty}
                                    </span>
                                  </>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        <div className="flex gap-4 px-2">
                          {quickAmounts.slice(3).map((amount) => {
                            const qty = amountQuantities[amount] || 0;
                            return (
                              <div key={amount} className="flex-1 relative py-1">
                                <button
                                  onClick={() => handleAddAmount(amount)}
                                  className={`w-full py-3 rounded-lg text-sm font-medium transition-colors ${
                                    qty > 0
                                      ? 'bg-neutral-900 text-white border border-neutral-600'
                                      : 'bg-neutral-800 text-neutral-300 border border-neutral-600 hover:border-neutral-500'
                                  }`}
                                >
                                  ${amount}
                                </button>
                                {qty > 0 && (
                                  <>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemoveAmount(amount);
                                      }}
                                      className="absolute -top-0.5 -left-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-xs hover:bg-red-600 transition-colors z-10"
                                    >
                                      ×
                                    </button>
                                    <span className="absolute -top-0.5 -right-1.5 w-5 h-5 rounded-full bg-green-500 text-white flex items-center justify-center text-[10px] font-medium z-10">
                                      x{qty}
                                    </span>
                                  </>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Charge Button / Continue Button */}
                  <div className="p-6 pt-0">
                    {selectedPaymentMethod === 'gift-card' && giftCardStep === 'enter-card' ? (
                      /* Continue button for gift card entry */
                      <button
                        onClick={() => {
                          const digits = giftCardNumber.replace(/\s/g, '');
                          if (digits.length === 16) {
                            const paid = parseFloat(paymentAmount) || 0;
                            setPaidAmount(paid);
                            setPaymentProcessed(true);
                          }
                        }}
                        disabled={giftCardNumber.replace(/\s/g, '').length !== 16}
                        className={`w-full py-4 font-bold rounded-xl transition-colors text-sm ${
                          giftCardNumber.replace(/\s/g, '').length === 16
                            ? 'bg-neutral-800 hover:bg-neutral-700 text-white'
                            : 'bg-neutral-700 text-neutral-500 cursor-not-allowed'
                        }`}
                      >
                        Continue
                      </button>
                    ) : (
                      /* Regular CHARGE button */
                      <button
                        onClick={() => {
                          if (selectedPaymentMethod === 'gift-card' && giftCardStep === 'amount') {
                            setGiftCardStep('enter-card');
                            return;
                          }
                          if (selectedPaymentMethod === 'pay-link' && payByLinkStep === 'amount') {
                            setPayByLinkStep('select-guest');
                            return;
                          }
                          if (selectedPaymentMethod === 'qr-code' && qrCodeStep === 'amount') {
                            setQrCodeStep('qr-display');
                            return;
                          }
                          const paid = parseFloat(paymentAmount) || 0;
                          setPaidAmount(paid);
                          setPaymentProcessed(true);
                        }}
                        className="w-full py-4 bg-neutral-800 hover:bg-neutral-700 text-white font-bold rounded-xl transition-colors text-sm"
                      >
                        CHARGE ${paymentAmount}
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Order Details Panel */}
            <div className="w-[280px] border-l border-neutral-700 flex flex-col">
              {/* Guest Info Header - Matching Order Panel Style */}
              <div className="p-3 border-b border-neutral-700" style={{ background: 'linear-gradient(180deg, #4D4D4D 0%, #616161 100%)' }}>
                <div className="flex items-center justify-between">
                  <h3 className="text-white font-semibold text-sm">{selectedOrder?.guest || "John Doe"}</h3>
                  <button 
                    onClick={() => {
                      setPaymentProcessed(false);
                      setShowPaymentDialog(false);
                    }}
                    className="w-6 h-6 rounded-full hover:bg-neutral-600 flex items-center justify-center transition-colors"
                  >
                    <X className="w-4 h-4 text-neutral-300" />
                  </button>
                </div>
                <p className="text-neutral-300 text-xs mt-0.5">Order At {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}</p>
                
                {/* Order Info Row */}
                <div className="flex items-center justify-between mt-2">
                  <span className="text-neutral-400 text-[10px]">ORDER# {selectedOrder?.orderNo || "105"}</span>
                  <span className="text-neutral-400 text-[10px]">TABLE# {selectedOrder?.table || "14"}</span>
                  <span className="text-red-400 text-[10px] font-medium">{selectedOrder?.type?.toUpperCase() || "DINE IN"}</span>
                </div>
              </div>

              {/* Check Info with PAID stamp when processed */}
              <div className="mx-3 mt-3 bg-neutral-800 rounded-lg p-3 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-white font-medium text-sm">Check {selectedOrder?.check || "62"} a</span>
                  <span className="text-white font-bold">${finalTotal.toFixed(2)}</span>
                </div>
                {paymentProcessed && paidAmount >= finalTotal && (
                  <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-green-500/30 text-4xl font-bold rotate-[-15deg] pointer-events-none">
                    PAID
                  </span>
                )}
                {paymentProcessed && paidAmount < finalTotal && (
                  <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-yellow-500/30 text-4xl font-bold rotate-[-15deg] pointer-events-none">
                    PARTIAL
                  </span>
                )}
                <div className="flex items-center justify-between mt-1">
                  <span className="text-neutral-400 text-xs">Seat</span>
                  <span className="text-white text-xs">1</span>
                </div>
              </div>

              {/* Order Items - Without seat indicators */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {orderItems.map((item) => (
                  <div 
                    key={item.id}
                    className="p-2 border border-sidebar-border rounded-lg"
                    style={{ background: 'linear-gradient(180deg, #4D4D4D 0%, #616161 100%)' }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded bg-neutral-700 border border-neutral-600 text-white text-[10px] font-medium flex items-center justify-center flex-shrink-0">
                        {item.qty}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-foreground">{item.name}</span>
                          <span className="text-xs font-medium text-foreground ml-2">
                            ${item.price.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Payment History - Only show when processed */}
              {paymentProcessed && (
                <div className="p-3 border-t border-neutral-700">
                  <h4 className="text-white text-sm font-medium mb-2">Payment History</h4>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {selectedPaymentMethod === 'qr-code' ? (
                        <QrCode className="w-4 h-4 text-neutral-400" />
                      ) : selectedPaymentMethod === 'pay-link' ? (
                        <Link className="w-4 h-4 text-neutral-400" />
                      ) : selectedPaymentMethod === 'gift-card' ? (
                        <Gift className="w-4 h-4 text-neutral-400" />
                      ) : selectedPaymentMethod === 'card' ? (
                        <CreditCard className="w-4 h-4 text-neutral-400" />
                      ) : (
                        <span className="text-neutral-400 text-xs">$</span>
                      )}
                      <span className="text-neutral-300 text-xs">
                        {selectedPaymentMethod === 'qr-code' ? 'Pay by QR' :
                         selectedPaymentMethod === 'pay-link' ? 'Pay By Link' :
                         selectedPaymentMethod === 'gift-card' ? 'Gift Card' : 
                         selectedPaymentMethod === 'card' ? 'Card' : 'Cash'}
                      </span>
                    </div>
                    <span className="text-green-500 text-xs font-medium">${paidAmount.toFixed(2)}</span>
                  </div>
                  {paidAmount < finalTotal && (
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-neutral-600">
                      <span className="text-neutral-400 text-xs">Remaining Due</span>
                      <span className="text-red-500 text-xs font-medium">${(finalTotal - paidAmount).toFixed(2)}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Order Summary - Hide when processed */}
              {!paymentProcessed && (
                <div className="p-3 border-t border-neutral-700 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-400">Sub Total</span>
                    <span className="text-white">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-400">Tax</span>
                    <span className="text-white">${tax.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm font-medium pt-1">
                    <span className="text-white">Total Due</span>
                    <span className="text-red-500 font-bold">${finalTotal.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};


// Table filter labels (matching /tableorder screen)
const tableFilterLabels = ["All", "Available", "Ordering", "Ordered", "Reserved", "Seated", "Served", "Paid"];

const Dashboard = () => {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState("All");
  const [activeTableFilter, setActiveTableFilter] = useState("All");
  const [selectedOrder, setSelectedOrder] = useState<typeof mockOrders[0] | null>(mockOrders[0]);
  const [dateFilter, setDateFilter] = useState("Today");
  const [compareDate, setCompareDate] = useState("Yesterday");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [seatFilter, setSeatFilter] = useState<(number | 'all')[]>([]);
  const [orderNotes, setOrderNotes] = useState('');
  const [activeSwipedItemId, setActiveSwipedItemId] = useState<string | null>(null);
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>();
  const [isCustomCalendarOpen, setIsCustomCalendarOpen] = useState(false);
  const [compareCustomDateRange, setCompareCustomDateRange] = useState<DateRange | undefined>();
  const [isCompareCustomCalendarOpen, setIsCompareCustomCalendarOpen] = useState(false);
  const [orderItems, setOrderItems] = useState<OrderItemType[]>(mockOrders[0]?.items || []);
  const [selectedFloor, setSelectedFloor] = useState("first");
  const [showDiscountDialog, setShowDiscountDialog] = useState(false);
  const [selectedDiscountId, setSelectedDiscountId] = useState<string | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('cash');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [showKeypad, setShowKeypad] = useState(false);
  const [amountQuantities, setAmountQuantities] = useState<Record<number, number>>({});
  const [paymentProcessed, setPaymentProcessed] = useState(false);
  const [paidAmount, setPaidAmount] = useState(0);
  const [showOtherPayments, setShowOtherPayments] = useState(false);
  const [giftCardStep, setGiftCardStep] = useState<'amount' | 'enter-card' | 'processing'>('amount');
  const [giftCardNumber, setGiftCardNumber] = useState('');
  // Pay by Link state
  const [payByLinkStep, setPayByLinkStep] = useState<'amount' | 'select-guest' | 'guest-confirmed' | 'pending' | 'expired' | 'complete'>('amount');
  const [selectedGuest, setSelectedGuest] = useState<GuestType | null>(null);
  const [guestSearchQuery, setGuestSearchQuery] = useState('');
  const [hoveredGuestIndex, setHoveredGuestIndex] = useState<number | null>(null);
  const [sendLinkMethod, setSendLinkMethod] = useState<'text' | 'email'>('text');
  // QR Code state
  const [qrCodeStep, setQrCodeStep] = useState<'amount' | 'qr-display' | 'pending' | 'complete'>('amount');
  const [qrPhoneNumber, setQrPhoneNumber] = useState('');
  const [showQrPhoneInput, setShowQrPhoneInput] = useState(false);
  // Loyalty state
  const [loyaltyStep, setLoyaltyStep] = useState<'guest-list' | 'guest-selected' | 'points-input' | 'otp' | 'complete'>('guest-list');
  const [loyaltySelectedGuest, setLoyaltySelectedGuest] = useState<GuestType | null>(null);
  const [loyaltyPointsToRedeem, setLoyaltyPointsToRedeem] = useState('');
  const [showLoyaltyAddGuest, setShowLoyaltyAddGuest] = useState(false);
  const [loyaltyNewGuest, setLoyaltyNewGuest] = useState({ name: '', phone: '', email: '' });
  const [loyaltyOtp, setLoyaltyOtp] = useState<string[]>(['', '', '', '']);
  const [loyaltySearchQuery, setLoyaltySearchQuery] = useState('');
  const [showLoyaltyKeypad, setShowLoyaltyKeypad] = useState(false);
  // Dynamic payment methods state
  const [visiblePaymentMethods, setVisiblePaymentMethods] = useState<PaymentMethodType[]>(initialPaymentMethods);
  const [dropdownPaymentMethods, setDropdownPaymentMethods] = useState<PaymentMethodType[]>(initialOtherPaymentMethods);

  // Handle selecting a payment method from the dropdown - swap with last visible method
  const handleSelectFromDropdown = (selectedMethod: PaymentMethodType) => {
    // Get the last visible method
    const lastVisibleMethod = visiblePaymentMethods[visiblePaymentMethods.length - 1];
    
    // Remove selected method from dropdown
    const newDropdownMethods = dropdownPaymentMethods.filter(m => m.id !== selectedMethod.id);
    
    // Add the last visible method to the beginning of dropdown
    newDropdownMethods.unshift(lastVisibleMethod);
    
    // Remove last visible method and add selected method at first position
    const newVisibleMethods = [
      selectedMethod,
      ...visiblePaymentMethods.slice(0, -1)
    ];
    
    // Update states
    setVisiblePaymentMethods(newVisibleMethods);
    setDropdownPaymentMethods(newDropdownMethods);
    setSelectedPaymentMethod(selectedMethod.id);
    setShowOtherPayments(false);
  };

  // Calculate payment amount from quantities
  useEffect(() => {
    const total = Object.entries(amountQuantities).reduce((sum, [amount, qty]) => {
      return sum + (parseFloat(amount) * qty);
    }, 0);
    if (total > 0) {
      setPaymentAmount(total.toFixed(2));
    }
  }, [amountQuantities]);

  // Handle adding an amount (increases quantity)
  const handleAddAmount = (amount: number) => {
    setAmountQuantities(prev => ({
      ...prev,
      [amount]: (prev[amount] || 0) + 1
    }));
  };

  // Handle removing an amount (decreases quantity)
  const handleRemoveAmount = (amount: number) => {
    setAmountQuantities(prev => {
      const current = prev[amount] || 0;
      if (current <= 1) {
        const { [amount]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [amount]: current - 1 };
    });
  };

  // Keypad handler functions
  const handleKeypadPress = (key: string) => {
    // Reset quantities when using keypad
    setAmountQuantities({});
    if (key === 'backspace') {
      setPaymentAmount(prev => prev.slice(0, -1) || '0.00');
    } else if (key === '.') {
      if (!paymentAmount.includes('.')) {
        setPaymentAmount(prev => prev + '.');
      }
    } else {
      setPaymentAmount(prev => {
        if (prev === '0.00' || prev === '') return key;
        return prev + key;
      });
    }
  };

  // Gift card keypad handler
  const handleGiftCardKeypadPress = (key: string) => {
    if (key === 'C') {
      setGiftCardNumber('');
    } else if (giftCardNumber.replace(/\s/g, '').length < 16) {
      setGiftCardNumber(prev => prev.replace(/\s/g, '') + key);
    }
  };

  const isMobile = useIsMobile();

  // Toggle no tax for an item
  const handleToggleNoTax = (itemId: number) => {
    setOrderItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, noTax: !item.noTax } : item
    ));
  };

  // Update order type for an item
  const handleOrderTypeChange = (itemId: number, orderType: string) => {
    setOrderItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, itemOrderType: orderType } : item
    ));
  };

  // Delete an item from the order
  const handleDeleteItem = (itemId: number) => {
    setOrderItems(prev => prev.filter(item => item.id !== itemId));
  };

  // Toggle fire status for an item
  const handleFireItem = (itemId: number) => {
    setOrderItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, isFired: !item.isFired } : item
    ));
  };

  const handleDateFilterChange = (value: string) => {
    setDateFilter(value);
    if (value === "Custom") {
      setIsCustomCalendarOpen(true);
    }
  };

  const handleCompareDateChange = (value: string) => {
    setCompareDate(value);
    if (value === "Custom") {
      setIsCompareCustomCalendarOpen(true);
    }
  };

  const getDateFilterDisplay = () => {
    if (dateFilter === "Custom" && customDateRange?.from) {
      if (customDateRange.to) {
        return `${format(customDateRange.from, "MMM d")} - ${format(customDateRange.to, "MMM d")}`;
      }
      return format(customDateRange.from, "MMM d, yyyy");
    }
    return dateFilter;
  };

  const getCompareDateDisplay = () => {
    if (compareDate === "Custom" && compareCustomDateRange?.from) {
      if (compareCustomDateRange.to) {
        return `${format(compareCustomDateRange.from, "MMM d")} - ${format(compareCustomDateRange.to, "MMM d")}`;
      }
      return format(compareCustomDateRange.from, "MMM d, yyyy");
    }
    return compareDate;
  };

  // Get stats based on selected date filter
  const stats = useMemo(() => {
    return statsData[dateFilter] || statsData["Today"];
  }, [dateFilter]);

  const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.qty, 0);
  const total = subtotal;

  const toggleSeatFilter = (seat: number | 'all') => {
    setSeatFilter(prev => prev.includes(seat) ? prev.filter(s => s !== seat) : [...prev, seat]);
  };

  // Filter orders based on active filter
  const filteredOrders = useMemo(() => {
    if (activeFilter === "All") return mockOrders;
    return mockOrders.filter(order => order.filterCategory === activeFilter);
  }, [activeFilter]);

  // Calculate counts for each filter
  const orderFilters = useMemo(() => {
    return orderFilterLabels.map(label => ({
      label,
      count: label === "All" 
        ? mockOrders.length 
        : mockOrders.filter(order => order.filterCategory === label).length
    }));
  }, []);

  // Filter tables based on active table filter
  const filteredTables = useMemo(() => {
    if (activeTableFilter === "All") return mockTables;
    return mockTables.filter(table => table.status === activeTableFilter);
  }, [activeTableFilter]);

  // Calculate counts for each table filter
  const tableFilters = useMemo(() => {
    return tableFilterLabels.map(label => ({
      label,
      count: label === "All" 
        ? mockTables.length 
        : mockTables.filter(table => table.status === label).length
    }));
  }, []);

  const handleOrderClick = (order: typeof mockOrders[0]) => {
    setSelectedOrder(order);
    setOrderItems(order.items || []);
    setOrderNotes(order.notes || '');
    setSeatFilter([]);
    if (isMobile) {
      setIsDrawerOpen(true);
    }
  };

  return (
    <div className="h-full flex flex-col bg-black text-white overflow-hidden px-3 pb-3 gap-3">
      {/* ROW 1: Date Filters (Vertical) + Stats/Insights */}
      <div className="flex gap-3 flex-shrink-0 items-stretch">
        {/* Date Filters - Vertical */}
        <div 
          className="flex flex-col gap-2 p-3 rounded-xl items-center justify-center"
          style={{ background: "#7575754D", boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)" }}
        >
          {/* Main Date Filter */}
          {dateFilter === "Custom" ? (
            <Popover open={isCustomCalendarOpen} onOpenChange={setIsCustomCalendarOpen}>
              <PopoverTrigger asChild>
                <button 
                  className="h-7 px-2 border-0 text-xs text-white w-[90px] rounded-md flex items-center justify-between gap-1"
                  style={{ background: "#5555554D" }}
                >
                  <CalendarIcon className="w-3 h-3" />
                  <span className="truncate">{getDateFilterDisplay()}</span>
                  <X 
                    className="w-3 h-3 hover:text-red-400" 
                    onClick={(e) => {
                      e.stopPropagation();
                      setDateFilter("Today");
                      setCustomDateRange(undefined);
                    }}
                  />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-neutral-800 border-neutral-700" align="start">
                <Calendar
                  mode="range"
                  selected={customDateRange}
                  onSelect={(range) => {
                    setCustomDateRange(range);
                    if (range?.to) {
                      setIsCustomCalendarOpen(false);
                    }
                  }}
                  initialFocus
                  className="p-3 pointer-events-auto text-white"
                />
              </PopoverContent>
            </Popover>
          ) : (
            <Select value={dateFilter} onValueChange={handleDateFilterChange}>
              <SelectTrigger 
                className="h-7 px-2 border-0 text-xs text-white w-[90px]"
                style={{ background: "#5555554D" }}
              >
                <SelectValue>{dateFilter}</SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-neutral-800 border-neutral-700">
                {dateFilters.map((filter) => (
                  <SelectItem key={filter} value={filter} className="text-white hover:bg-neutral-700">
                    {filter}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <span className="text-white/40 text-xs">vs</span>
          {/* Compare Date Filter */}
          {compareDate === "Custom" ? (
            <Popover open={isCompareCustomCalendarOpen} onOpenChange={setIsCompareCustomCalendarOpen}>
              <PopoverTrigger asChild>
                <button 
                  className="h-7 px-2 border-0 text-xs text-white w-[90px] rounded-md flex items-center justify-between gap-1"
                  style={{ background: "#5555554D" }}
                >
                  <CalendarIcon className="w-3 h-3" />
                  <span className="truncate">{getCompareDateDisplay()}</span>
                  <X 
                    className="w-3 h-3 hover:text-red-400" 
                    onClick={(e) => {
                      e.stopPropagation();
                      setCompareDate("Yesterday");
                      setCompareCustomDateRange(undefined);
                    }}
                  />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-neutral-800 border-neutral-700" align="start">
                <Calendar
                  mode="range"
                  selected={compareCustomDateRange}
                  onSelect={(range) => {
                    setCompareCustomDateRange(range);
                    if (range?.to) {
                      setIsCompareCustomCalendarOpen(false);
                    }
                  }}
                  initialFocus
                  className="p-3 pointer-events-auto text-white"
                />
              </PopoverContent>
            </Popover>
          ) : (
            <Select value={compareDate} onValueChange={handleCompareDateChange}>
              <SelectTrigger 
                className="h-7 px-2 border-0 text-xs text-white w-[90px]"
                style={{ background: "#5555554D" }}
              >
                <SelectValue>{compareDate}</SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-neutral-800 border-neutral-700">
                {dateFilters.map((filter) => (
                  <SelectItem key={filter} value={filter} className="text-white hover:bg-neutral-700">
                    {filter}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Stats/Insights Row */}
        <div className="flex-1 flex gap-2 overflow-x-auto scrollbar-hide">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="flex-shrink-0 rounded-xl px-4 py-3 min-w-[160px] flex-1"
              style={{ background: "#7575754D", boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)" }}
            >
              <div className="flex items-center gap-2 text-xs text-white/60 mb-2">
                {stat.hasCheckbox ? (
                  <div className="w-4 h-4 rounded border border-white/40 flex items-center justify-center">
                    <Check className="w-3 h-3" />
                  </div>
                ) : stat.icon === "clock" ? (
                  <Clock className="w-4 h-4 text-white/60" />
                ) : (
                  <span className="text-sm">{stat.icon}</span>
                )}
                <span>{stat.label}</span>
              </div>
              <div className="text-xl font-semibold mb-1">{stat.value}</div>
              <div className={`text-xs flex items-center gap-1 ${stat.isUp ? "text-green-400" : "text-red-400"}`}>
                <span>{stat.isUp ? "↗" : "↘"}</span>
                <span>{stat.change}</span>
                <span className="text-white/40">from {compareDate.toLowerCase()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ROW 2: Orders + Order Panel - Two columns */}
      <div className="flex-1 flex gap-3 min-h-0 overflow-hidden">
        {/* Left Column: Order Tabs + Orders List + Table Status */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Order Filters */}
          <div className="flex gap-1.5 mb-2 overflow-x-auto scrollbar-hide flex-shrink-0">
            {orderFilters.map((filter) => (
              <button
                key={filter.label}
                onClick={() => setActiveFilter(filter.label)}
                className={`flex-shrink-0 px-2 py-1 rounded-full text-xs font-medium transition-all ${
                  activeFilter === filter.label
                    ? "text-black"
                    : "text-white"
                }`}
                style={
                  activeFilter === filter.label
                    ? { background: "linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)" }
                    : { background: "#7575754D", boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)" }
                }
              >
                {filter.label} <span className="font-bold ml-0.5">{filter.count}</span>
              </button>
            ))}
          </div>

          {/* Orders List with Scroll */}
          <ScrollArea className="flex-1 min-h-0">
            <div className="space-y-2 pr-2">
              {filteredOrders.map((order) => (
                <div
                  key={order.id}
                  onClick={() => handleOrderClick(order)}
                  className={`rounded-xl cursor-pointer transition-all overflow-hidden ${
                    selectedOrder?.id === order.id ? "border border-white" : "border border-white/10"
                  }`}
                  style={{ background: "#2A2A2A" }}
                >
                {/* Mobile Layout */}
                <div className="flex items-stretch w-full md:hidden p-3">
                  {/* Order Number - Mobile compact style */}
                  <div className="flex-shrink-0 px-2 py-2 flex items-center">
                    <div className="relative w-10 h-12 bg-neutral-800 rounded-lg flex flex-col items-center justify-center border border-neutral-600">
                      <span className="text-sm font-bold text-white">{order.id}</span>
                      <span className="text-sm text-gray-500">000</span>
                    </div>
                  </div>

                  {/* Guest Info - Mobile compact layout */}
                  <div className="flex-1 min-w-0 py-2 pr-2">
                    <div className="flex flex-col gap-1">
                      {/* Row 1: Name + Table, Server, Status */}
                      <div className="flex items-center justify-between">
                        <span className="text-white font-medium text-sm">{order.guest} - {order.table}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm" style={{ color: '#B5B6BB' }}>{order.server}</span>
                          <span className="text-sm font-medium" style={{ color: order.statusColor }}>{order.status}</span>
                        </div>
                      </div>
                      
                      {/* Row 2: Party info, Timer, Total */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-xs" style={{ color: '#B5B6BB' }}>
                          <span>Party of {order.seats}, {order.arrivedAt}</span>
                          <span className="text-gray-500">|</span>
                          <span>{order.timer}</span>
                        </div>
                        <span className="text-white font-semibold text-sm">${calculateOrderTotal(order.items).toFixed(2)}</span>
                      </div>
                      
                      {/* Row 3: Revenue center, Payment status */}
                      <div className="flex items-center justify-between">
                        <span className="text-white font-medium text-sm">{order.revenueCenter}</span>
                        <div className="flex items-center gap-2 text-sm">
                          <span style={{ color: '#B5B6BB' }}>{order.isPaid ? "Paid" : "Un Paid"}</span>
                          <span className="text-white">{order.tip}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tablet/Desktop Layout */}
                <div className="hidden md:flex items-stretch">
                    {/* Left Content with padding */}
                    <div className="flex-1 flex items-stretch gap-3 p-3">
                      {/* Order Number Box */}
                      <div className="flex-shrink-0 flex flex-col items-center justify-center w-14 rounded-lg border border-white/20 py-2 gap-1" style={{ background: '#1A1A1A' }}>
                        <span className="text-lg font-bold text-white">{order.id}</span>
                        <span className="text-xs text-white/40">{String(order.check).padStart(3, '0')}</span>
                      </div>

                      {/* Main Content */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                        {/* Row 1: Name + Table | Server | Status */}
                        <div className="flex items-center text-xs lg:text-sm">
                          <div className="flex items-center gap-1 lg:gap-2 w-[180px] lg:w-[220px] flex-shrink-0">
                            <span className="text-white font-medium truncate">{order.guest}</span>
                            <span className="text-white/60">·</span>
                            <span className="text-white font-medium">{order.table}</span>
                          </div>
                          <span className="text-white/60 flex-1 truncate px-1 lg:px-2">{order.server}</span>
                          <span 
                            className="font-semibold uppercase flex-shrink-0"
                            style={{ color: order.statusColor }}
                          >
                            {order.status}
                          </span>
                        </div>
                        
                        {/* Row 2: Party info | Timer | Total */}
                        <div className="flex items-center text-xs lg:text-sm">
                          <div className="flex items-center gap-1 text-white/60 w-[180px] lg:w-[220px] flex-shrink-0">
                            <img src={dineInIcon} alt="Dine In" className="w-3 h-3 lg:w-4 lg:h-4 object-contain" />
                            <span className="truncate">Party of {order.seats}, {order.arrivedAt}</span>
                            <span className="text-white/40">|</span>
                            <span>{order.timer}</span>
                          </div>
                          <div className="flex-1"></div>
                          <span className="text-white font-semibold flex-shrink-0">${calculateOrderTotal(order.items).toFixed(2)}</span>
                        </div>
                        
                        {/* Row 3: Revenue Center | Payment Status | Amount */}
                        <div className="flex items-center text-xs lg:text-sm">
                          <span className="text-white font-medium w-[180px] lg:w-[220px] flex-shrink-0 truncate">{order.revenueCenter}</span>
                          <span className="text-white/60 flex-1 truncate px-1 lg:px-2">{order.isPaid ? "Paid" : "Un Paid"}</span>
                          <span className="text-white flex-shrink-0">{order.tip}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right Action Buttons - Edge to edge (hidden for completed/paid orders) */}
                    {order.status !== "Completed" && !order.isPaid && (
                      <div className="flex-shrink-0 flex flex-col w-10">
                        <button 
                          className="flex-1 flex items-center justify-center hover:opacity-80 transition-opacity"
                          style={{ background: 'linear-gradient(180deg, #FF9E65 0%, #FF5E00 100%)' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/tableorder/T${order.seats}/merge?orderId=${order.id}`);
                          }}
                        >
                          <img src={arrowRightIcon} alt="Merge" className="w-4 h-4 object-contain" />
                        </button>
                        <button 
                          className="flex-1 flex items-center justify-center hover:opacity-80 transition-opacity"
                          style={{ background: 'linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/tableorder/T${order.seats}/transfer?orderId=${order.id}`);
                          }}
                        >
                          <img src={shareOrderIcon} alt="Transfer" className="w-4 h-4 object-contain brightness-0" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Table Status - Below Orders */}
          <div className="flex-shrink-0 mt-2 pt-2 border-t border-white/10">
            {/* Table Filters */}
            <div className="flex gap-1.5 mb-2 overflow-x-auto scrollbar-hide">
              <Select value={selectedFloor} onValueChange={setSelectedFloor}>
                <SelectTrigger 
                  className="flex-shrink-0 h-auto px-2 py-1 rounded-full text-xs font-medium text-white border-0 w-auto gap-1"
                  style={{ background: "#7575754D", boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)" }}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-neutral-800 border-white/10">
                  <SelectItem value="first" className="text-white text-xs hover:bg-white/10 focus:bg-white/10 focus:text-white">First Floor</SelectItem>
                  <SelectItem value="second" className="text-white text-xs hover:bg-white/10 focus:bg-white/10 focus:text-white">Second Floor</SelectItem>
                  <SelectItem value="outdoor" className="text-white text-xs hover:bg-white/10 focus:bg-white/10 focus:text-white">Outdoor Patio</SelectItem>
                  <SelectItem value="rooftop" className="text-white text-xs hover:bg-white/10 focus:bg-white/10 focus:text-white">Rooftop Bar</SelectItem>
                </SelectContent>
              </Select>
              {tableFilters.map((filter) => (
                <button
                  key={filter.label}
                  onClick={() => setActiveTableFilter(filter.label)}
                  className={`flex-shrink-0 px-2 py-1 rounded-full text-xs font-medium transition-all ${
                    activeTableFilter === filter.label
                      ? "text-black"
                      : "text-white"
                  }`}
                  style={
                    activeTableFilter === filter.label
                      ? { background: "linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)" }
                      : { background: "#7575754D", boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)" }
                  }
                >
                  {filter.label} <span className="font-bold ml-0.5">{filter.count}</span>
                </button>
              ))}
            </div>

            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              {filteredTables.map((table, index) => {
                const statusStyle = tableStatusConfig[table.status] || tableStatusConfig["Available"];
                return (
                  <div
                    key={index}
                    onClick={() => {
                      if (table.status === "Available") {
                        navigate(`/tableorder/${table.id}`);
                      } else {
                        navigate(`/tableorder/${table.id}/details`);
                      }
                    }}
                    className="flex-shrink-0 rounded-xl p-2.5 w-[90px] flex flex-col gap-1.5 cursor-pointer hover:bg-neutral-800 transition-all bg-neutral-900"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-base font-bold">{table.id}</span>
                      <span className="text-[10px] text-white/50">{table.seats}S</span>
                    </div>
                    <div
                      className="text-[10px] font-medium py-1 rounded-md text-center w-full"
                      style={{ 
                        backgroundColor: statusStyle.bgColor,
                        color: statusStyle.textColor
                      }}
                    >
                      {table.status}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Order Panel - Full height */}
        <div
          className="hidden md:flex w-[240px] lg:w-[345px] flex-shrink-0 rounded-xl flex-col"
          style={{ background: "#7575754D", boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)" }}
        >
          <OrderPanelContent
            selectedOrder={selectedOrder}
            orderItems={orderItems}
            subtotal={subtotal}
            total={total}
            phoneIcon={phoneIcon}
            timeIcon={timeIcon}
            itemNotesIcon={itemNotesIcon}
            fireIcon={fireIcon}
            seatFilter={seatFilter}
            toggleSeatFilter={toggleSeatFilter}
            orderNotes={orderNotes}
            setOrderNotes={setOrderNotes}
            activeSwipedItemId={activeSwipedItemId}
            setActiveSwipedItemId={setActiveSwipedItemId}
            onToggleNoTax={handleToggleNoTax}
            onOrderTypeChange={handleOrderTypeChange}
            onDeleteItem={handleDeleteItem}
            onFireItem={handleFireItem}
            showDiscountDialog={showDiscountDialog}
            setShowDiscountDialog={setShowDiscountDialog}
            selectedDiscountId={selectedDiscountId}
            setSelectedDiscountId={setSelectedDiscountId}
            showPaymentDialog={showPaymentDialog}
            setShowPaymentDialog={setShowPaymentDialog}
            selectedPaymentMethod={selectedPaymentMethod}
            setSelectedPaymentMethod={setSelectedPaymentMethod}
            paymentAmount={paymentAmount}
            setPaymentAmount={setPaymentAmount}
            showKeypad={showKeypad}
            setShowKeypad={setShowKeypad}
            handleKeypadPress={handleKeypadPress}
            amountQuantities={amountQuantities}
            setAmountQuantities={setAmountQuantities}
            handleAddAmount={handleAddAmount}
            handleRemoveAmount={handleRemoveAmount}
            paymentProcessed={paymentProcessed}
            setPaymentProcessed={setPaymentProcessed}
            paidAmount={paidAmount}
            setPaidAmount={setPaidAmount}
            showOtherPayments={showOtherPayments}
            setShowOtherPayments={setShowOtherPayments}
            giftCardStep={giftCardStep}
            setGiftCardStep={setGiftCardStep}
            giftCardNumber={giftCardNumber}
            setGiftCardNumber={setGiftCardNumber}
            handleGiftCardKeypadPress={handleGiftCardKeypadPress}
            payByLinkStep={payByLinkStep}
            setPayByLinkStep={setPayByLinkStep}
            selectedGuest={selectedGuest}
            setSelectedGuest={setSelectedGuest}
            guestSearchQuery={guestSearchQuery}
            setGuestSearchQuery={setGuestSearchQuery}
            hoveredGuestIndex={hoveredGuestIndex}
            setHoveredGuestIndex={setHoveredGuestIndex}
            sendLinkMethod={sendLinkMethod}
            setSendLinkMethod={setSendLinkMethod}
            qrCodeStep={qrCodeStep}
            setQrCodeStep={setQrCodeStep}
            qrPhoneNumber={qrPhoneNumber}
            setQrPhoneNumber={setQrPhoneNumber}
            showQrPhoneInput={showQrPhoneInput}
            setShowQrPhoneInput={setShowQrPhoneInput}
            loyaltyStep={loyaltyStep}
            setLoyaltyStep={setLoyaltyStep}
            loyaltySelectedGuest={loyaltySelectedGuest}
            setLoyaltySelectedGuest={setLoyaltySelectedGuest}
            loyaltyPointsToRedeem={loyaltyPointsToRedeem}
            setLoyaltyPointsToRedeem={setLoyaltyPointsToRedeem}
            showLoyaltyAddGuest={showLoyaltyAddGuest}
            setShowLoyaltyAddGuest={setShowLoyaltyAddGuest}
            loyaltyNewGuest={loyaltyNewGuest}
            setLoyaltyNewGuest={setLoyaltyNewGuest}
            loyaltyOtp={loyaltyOtp}
            setLoyaltyOtp={setLoyaltyOtp}
            loyaltySearchQuery={loyaltySearchQuery}
            setLoyaltySearchQuery={setLoyaltySearchQuery}
            showLoyaltyKeypad={showLoyaltyKeypad}
            setShowLoyaltyKeypad={setShowLoyaltyKeypad}
            visiblePaymentMethods={visiblePaymentMethods}
            dropdownPaymentMethods={dropdownPaymentMethods}
            handleSelectFromDropdown={handleSelectFromDropdown}
          />
        </div>
      </div>

      {/* Mobile Drawer for Order Panel */}
      <Drawer open={isDrawerOpen && isMobile} onOpenChange={setIsDrawerOpen}>
        <DrawerContent 
          hideHandle
          className="bg-neutral-900 border-none !inset-0 !h-[100dvh] !rounded-none !max-h-none !mt-0"
        >
          <div className="flex items-center justify-end px-4 pt-2">
            <DrawerClose className="rounded-full p-1 bg-white/10 hover:bg-white/20">
              <X className="w-4 h-4 text-white" />
            </DrawerClose>
          </div>
          <div className="flex flex-col h-full overflow-hidden">
            <OrderPanelContent
              selectedOrder={selectedOrder}
              orderItems={orderItems}
              subtotal={subtotal}
              total={total}
              phoneIcon={phoneIcon}
              timeIcon={timeIcon}
              itemNotesIcon={itemNotesIcon}
              fireIcon={fireIcon}
              seatFilter={seatFilter}
              toggleSeatFilter={toggleSeatFilter}
              orderNotes={orderNotes}
              setOrderNotes={setOrderNotes}
              activeSwipedItemId={activeSwipedItemId}
              setActiveSwipedItemId={setActiveSwipedItemId}
              onToggleNoTax={handleToggleNoTax}
              onOrderTypeChange={handleOrderTypeChange}
              onDeleteItem={handleDeleteItem}
              onFireItem={handleFireItem}
            showDiscountDialog={showDiscountDialog}
            setShowDiscountDialog={setShowDiscountDialog}
            selectedDiscountId={selectedDiscountId}
            setSelectedDiscountId={setSelectedDiscountId}
            showPaymentDialog={showPaymentDialog}
            setShowPaymentDialog={setShowPaymentDialog}
            selectedPaymentMethod={selectedPaymentMethod}
            setSelectedPaymentMethod={setSelectedPaymentMethod}
            paymentAmount={paymentAmount}
            setPaymentAmount={setPaymentAmount}
            showKeypad={showKeypad}
            setShowKeypad={setShowKeypad}
            handleKeypadPress={handleKeypadPress}
            amountQuantities={amountQuantities}
            setAmountQuantities={setAmountQuantities}
            handleAddAmount={handleAddAmount}
            handleRemoveAmount={handleRemoveAmount}
            paymentProcessed={paymentProcessed}
            setPaymentProcessed={setPaymentProcessed}
            paidAmount={paidAmount}
            setPaidAmount={setPaidAmount}
            showOtherPayments={showOtherPayments}
            setShowOtherPayments={setShowOtherPayments}
            giftCardStep={giftCardStep}
            setGiftCardStep={setGiftCardStep}
            giftCardNumber={giftCardNumber}
            setGiftCardNumber={setGiftCardNumber}
            handleGiftCardKeypadPress={handleGiftCardKeypadPress}
            payByLinkStep={payByLinkStep}
            setPayByLinkStep={setPayByLinkStep}
            selectedGuest={selectedGuest}
            setSelectedGuest={setSelectedGuest}
            guestSearchQuery={guestSearchQuery}
            setGuestSearchQuery={setGuestSearchQuery}
            hoveredGuestIndex={hoveredGuestIndex}
            setHoveredGuestIndex={setHoveredGuestIndex}
            sendLinkMethod={sendLinkMethod}
            setSendLinkMethod={setSendLinkMethod}
            qrCodeStep={qrCodeStep}
            setQrCodeStep={setQrCodeStep}
            qrPhoneNumber={qrPhoneNumber}
            setQrPhoneNumber={setQrPhoneNumber}
            showQrPhoneInput={showQrPhoneInput}
            setShowQrPhoneInput={setShowQrPhoneInput}
            loyaltyStep={loyaltyStep}
            setLoyaltyStep={setLoyaltyStep}
            loyaltySelectedGuest={loyaltySelectedGuest}
            setLoyaltySelectedGuest={setLoyaltySelectedGuest}
            loyaltyPointsToRedeem={loyaltyPointsToRedeem}
            setLoyaltyPointsToRedeem={setLoyaltyPointsToRedeem}
            showLoyaltyAddGuest={showLoyaltyAddGuest}
            setShowLoyaltyAddGuest={setShowLoyaltyAddGuest}
            loyaltyNewGuest={loyaltyNewGuest}
            setLoyaltyNewGuest={setLoyaltyNewGuest}
            loyaltyOtp={loyaltyOtp}
            setLoyaltyOtp={setLoyaltyOtp}
            loyaltySearchQuery={loyaltySearchQuery}
            setLoyaltySearchQuery={setLoyaltySearchQuery}
            showLoyaltyKeypad={showLoyaltyKeypad}
            setShowLoyaltyKeypad={setShowLoyaltyKeypad}
            visiblePaymentMethods={visiblePaymentMethods}
            dropdownPaymentMethods={dropdownPaymentMethods}
            handleSelectFromDropdown={handleSelectFromDropdown}
          />
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default Dashboard;
