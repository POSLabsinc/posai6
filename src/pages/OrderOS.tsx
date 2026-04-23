import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useApp } from "@/contexts/AppContext";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Search, SlidersHorizontal, X, Phone, Clock, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, GripVertical, Printer, ArrowDownUp, Check, Package, Plus, CalendarDays, Info, Timer } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";

// Expand arrows icon
import expandArrowsIcon from "@/assets/icons/expand-arrows.svg";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { useIsMobile } from "@/hooks/use-mobile";
import OrderTypeIcon from "@/components/OrderTypeIcon";
import { SimpleModifierTree } from "@/components/ModifierWithConnector";
import { useToast } from "@/hooks/use-toast";
import AppleAlertDialog from "@/components/AppleAlertDialog";
import { ReportExceptionDialog, ReportedItem } from "@/components/ReportExceptionDialog";
import { EightySixSheet, EightySixedItem } from "@/components/EightySixSheet";
import { PrepTimeWheelPicker } from "@/components/PrepTimeWheelPicker";
import { AppleWheelTimePicker } from "@/components/ui/apple-wheel-time-picker";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  useDroppable,
  useDraggable,
} from "@dnd-kit/core";

// Import icons
import phoneIcon from "@/assets/icons/phone-icon.png";
import timeIcon from "@/assets/icons/time-icon.png";

// Platform icons
import uberEatsIcon from "@/assets/icons/platforms/ubereats-full.svg";
import grubhubIcon from "@/assets/icons/platforms/grubhub-full.svg";
import doordashIcon from "@/assets/icons/platforms/doordash-full.svg";
import directIcon from "@/assets/icons/platforms/direct-full.svg";
import deliveryOsIcon from "@/assets/icons/platforms/deliveryos-full.svg";
import orderOsLogo from "@/assets/icons/order-os.svg";
import PaymentDialog from "@/components/PaymentDialog";

// Types
interface ModifierItem {
  text: string;
  type: 'add' | 'remove' | 'default' | 'side';
  price?: number;
}

interface OrderItem {
  qty: number;
  name: string;
  price: number;
  modifiers: string[];
  richModifiers?: ModifierItem[];
  notes?: string;
}

interface OnlineOrder {
  id: string;
  orderNumber: number;
  customerName: string;
  phone: string;
  platform: 'ubereats' | 'grubhub' | 'doordash' | 'direct';
  orderType: 'DELIVERY' | 'PICK UP' | 'DINE IN';
  status: 'NEW' | 'PREPARING' | 'READY' | 'OUT_FOR_DELIVERY' | 'COMPLETED' | 'CANCELLED';
  orderedAt: string;
  orderedAtTimestamp: number; // Unix timestamp for dynamic timer calculation
  estimateReady: string;
  scheduledFor?: string;
  deliverBy?: string;
  countdown: string;
  isOverdue?: boolean; // Track if order has exceeded target time
  isWaiting?: boolean; // True if scheduled order is waiting for scheduled time window
  tableNumber?: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  deliveryFee: number;
  tax: number;
  tip: number;
  total: number;
  isPaid: boolean;
  addUtensils: boolean;
  itemCount: number;
  isScheduled?: boolean;
  orderNotes?: string;
}

// Helper to format time from Date object
const formatTimeFromDate = (date: Date): string => {
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

// Helper to get date label (Today, Tomorrow, or actual date)
const getDateLabel = (date: Date): string => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  if (dateOnly.getTime() === today.getTime()) return 'Today';
  if (dateOnly.getTime() === tomorrow.getTime()) return 'Tomorrow';
  return format(date, 'MMM d');
};

// Parse scheduled time string like "Today 6:00 PM", "Tomorrow 1:00 PM", "Yesterday 7:00 PM", or just time "10:30 AM"
const parseScheduledTime = (scheduledStr: string): Date => {
  const now = new Date();
  const parts = scheduledStr.split(' ');
  
  let dateOffset = 0;
  let timeStr: string;
  let periodStr: string;
  
  if (parts[0] === 'Today' || parts[0] === 'Tomorrow' || parts[0] === 'Yesterday') {
    if (parts[0] === 'Tomorrow') dateOffset = 1;
    if (parts[0] === 'Yesterday') dateOffset = -1;
    timeStr = parts[1];
    periodStr = parts[2];
  } else if (parts.length === 2) {
    // Just time like "10:30 AM"
    timeStr = parts[0];
    periodStr = parts[1];
  } else {
    // Handle "MMM d" format like "Jan 15 2:00 PM"
    // For simplicity, treat unrecognized formats as today
    timeStr = parts[parts.length - 2];
    periodStr = parts[parts.length - 1];
  }
  
  const [hours, minutes] = timeStr.split(':').map(Number);
  let hour24 = hours;
  if (periodStr === 'PM' && hours !== 12) hour24 += 12;
  if (periodStr === 'AM' && hours === 12) hour24 = 0;
  
  const targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + dateOffset, hour24, minutes, 0);
  return targetDate;
};

// Helper to parse simple time string (e.g., "10:30 AM") to today's Date object
const parseTimeToDate = (timeStr: string): Date => {
  // Check if it's a full scheduled time format
  if (timeStr.includes('Today') || timeStr.includes('Tomorrow') || timeStr.includes('Yesterday')) {
    return parseScheduledTime(timeStr);
  }
  
  const now = new Date();
  const [time, period] = timeStr.split(' ');
  const [hours, minutes] = time.split(':').map(Number);
  let hour24 = hours;
  if (period === 'PM' && hours !== 12) hour24 += 12;
  if (period === 'AM' && hours === 12) hour24 = 0;
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour24, minutes, 0);
};

// Helper to generate dynamic order times relative to now
// offsetMinutes: how many minutes ago the order was placed
// readyMinutes: how many minutes from order time until ready
// deliveryMinutes: how many minutes from order time until delivery (optional, for delivery orders)
const generateOrderTimes = (offsetMinutes: number, readyMinutes: number, deliveryMinutes?: number) => {
  const now = Date.now();
  const orderedAtTimestamp = now - (offsetMinutes * 60 * 1000);
  const orderedAt = formatTimeFromDate(new Date(orderedAtTimestamp));
  const estimateReady = formatTimeFromDate(new Date(orderedAtTimestamp + readyMinutes * 60 * 1000));
  const deliverBy = deliveryMinutes 
    ? formatTimeFromDate(new Date(orderedAtTimestamp + deliveryMinutes * 60 * 1000))
    : undefined;
  
  return { orderedAt, orderedAtTimestamp, estimateReady, deliverBy };
};

// Generate scheduled order times - scheduled time must be in the future
const generateScheduledOrderTimes = (
  scheduledOffsetMinutes: number, // How many minutes from now the scheduled time is
  readyDurationMinutes: number, // How many minutes before scheduled time to start preparing
  deliveryOffsetMinutes?: number // How many minutes after scheduled time for delivery
): { 
  orderedAtTimestamp: number; 
  orderedAt: string; 
  scheduledTimestamp: number;
  scheduledFor: string; 
  estimateReady: string; 
  deliverBy?: string;
} => {
  const now = Date.now();
  // Order placed some time ago (random 1-4 hours ago for realism)
  const orderedAtTimestamp = now - (Math.floor(Math.random() * 180) + 60) * 60 * 1000;
  const orderedAt = formatTimeFromDate(new Date(orderedAtTimestamp));
  
  // Scheduled time in the future
  const scheduledTimestamp = now + scheduledOffsetMinutes * 60 * 1000;
  const scheduledDate = new Date(scheduledTimestamp);
  const scheduledFor = `${getDateLabel(scheduledDate)} ${formatTimeFromDate(scheduledDate)}`;
  
  // Estimate ready = scheduled time (or slightly before)
  const estimateReady = formatTimeFromDate(scheduledDate);
  
  // Delivery time = scheduled time + delivery offset
  const deliverBy = deliveryOffsetMinutes 
    ? formatTimeFromDate(new Date(scheduledTimestamp + deliveryOffsetMinutes * 60 * 1000))
    : undefined;
  
  return { orderedAtTimestamp, orderedAt, scheduledTimestamp, scheduledFor, estimateReady, deliverBy };
};

// Calculate countdown for orders
// For scheduled orders: count down to scheduled time first, then to ready/delivery time
// For regular orders: count down to ready/delivery time
interface CountdownResult {
  display: string;
  isOverdue: boolean;
  isWaiting: boolean; // True if scheduled order is waiting for scheduled time window
}

const calculateCountdown = (
  order: {
    isScheduled?: boolean;
    scheduledFor?: string;
    orderType: string;
    deliverBy?: string;
    estimateReady: string;
  },
  prepTimeMinutes: number = 10 // Default prep time in minutes
): CountdownResult => {
  const now = Date.now();
  
  if (order.isScheduled && order.scheduledFor) {
    const scheduledDate = parseScheduledTime(order.scheduledFor);
    const scheduledTimestamp = scheduledDate.getTime();
    
    // Calculate the start time (prep time before scheduled time)
    // e.g., if scheduled at 8:20 PM and prep time is 10 min, start at 8:10 PM
    const prepTimeMs = prepTimeMinutes * 60 * 1000;
    const startTimestamp = scheduledTimestamp - prepTimeMs;
    
    // If start time hasn't arrived yet, count down to start time
    if (now < startTimestamp) {
      const remainingMs = startTimestamp - now;
      return {
        display: formatDuration(remainingMs),
        isOverdue: false,
        isWaiting: true
      };
    }
    
    // Start time has passed (prep window has begun), order should transition to active
    // Now count to delivery/ready time
    const targetTime = order.orderType === 'DELIVERY' && order.deliverBy 
      ? order.deliverBy 
      : order.estimateReady;
    const targetDate = parseTimeToDate(targetTime);
    
    // If target is on a different day (scheduled), we need to handle it properly
    // The target should be relative to the scheduled day
    const remainingMs = targetDate.getTime() - now;
    
    return {
      display: formatDuration(Math.abs(remainingMs)),
      isOverdue: remainingMs < 0,
      isWaiting: false
    };
  }
  
  // Regular (non-scheduled) order
  const targetTime = order.orderType === 'DELIVERY' && order.deliverBy 
    ? order.deliverBy 
    : order.estimateReady;
  const targetDate = parseTimeToDate(targetTime);
  const remainingMs = targetDate.getTime() - now;
  
  return {
    display: formatDuration(Math.abs(remainingMs)),
    isOverdue: remainingMs < 0,
    isWaiting: false
  };
};

// Format duration in ms to HH:MM:SS or MM:SS
const formatDuration = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

// Type for mock data without timestamp (will be added at runtime)
type MockOrderData = Omit<OnlineOrder, 'orderedAtTimestamp'>;

// Mock data (timestamps will be added at runtime)
const mockOrdersData: MockOrderData[] = [
  {
    id: "1",
    orderNumber: 1023,
    customerName: "Ralph Edwards",
    phone: "(629) 555-0129",
    platform: "ubereats",
    orderType: "DELIVERY",
    status: "NEW",
    orderedAt: "09:32 AM",
    estimateReady: "10:02 AM",
    deliverBy: "10:15 AM",
    countdown: "30:00",
    items: [
      { qty: 2, name: "Grilled Salmon", price: 24.00, modifiers: [], richModifiers: [
        { text: "Lemon Butter Sauce", type: "default" },
        { text: "No Parsley", type: "remove" },
        { text: "Extra Asparagus", type: "add", price: 3.00 }
      ], notes: "Cook medium-well, no seasoning on top"},
      { qty: 1, name: "Caesar Salad", price: 12.00, modifiers: ["No Croutons"] },
      { qty: 2, name: "Sparkling Water", price: 4.00, modifiers: [], notes: "No ice please" }
    ],
    orderNotes: "Please leave at door - dog is friendly but loud",
    subtotal: 68.00,
    discount: 0,
    deliveryFee: 5.99,
    tax: 5.44,
    tip: 10.00,
    total: 89.43,
    isPaid: true,
    addUtensils: true,
    itemCount: 5
  },
  {
    id: "2",
    orderNumber: 1024,
    customerName: "Jenny Wilson",
    phone: "(229) 555-0109",
    platform: "grubhub",
    orderType: "PICK UP",
    status: "NEW",
    orderedAt: "09:35 AM",
    estimateReady: "10:05 AM",
    countdown: "30:00",
    items: [
      { qty: 1, name: "Chicken Parmesan", price: 18.00, modifiers: ["Extra Cheese"], notes: "Allergy: No nuts in vicinity" },
      { qty: 1, name: "Garlic Bread", price: 6.00, modifiers: [] }
    ],
    orderNotes: "Picking up in 15 minutes, call when ready",
    subtotal: 24.00,
    discount: 0,
    deliveryFee: 0,
    tax: 1.92,
    tip: 5.00,
    total: 30.92,
    isPaid: true,
    addUtensils: false,
    itemCount: 2
  },
  {
    id: "3",
    orderNumber: 1025,
    customerName: "Wade Warren",
    phone: "(319) 555-0115",
    platform: "doordash",
    orderType: "DELIVERY",
    status: "PREPARING",
    orderedAt: "09:20 AM",
    estimateReady: "09:50 AM",
    deliverBy: "10:05 AM",
    countdown: "15:00",
    items: [
      { qty: 3, name: "Margherita Pizza", price: 16.00, modifiers: [], richModifiers: [
        { text: "Extra Cheese", type: "add", price: 2.00 },
        { text: "Thin Crust", type: "default" },
        { text: "Fresh Basil", type: "add" },
        { text: "No Oregano", type: "remove" }
      ], notes: "Cut into squares, not triangles" },
      { qty: 2, name: "Buffalo Wings", price: 14.00, modifiers: [], richModifiers: [
        { text: "Extra Hot Sauce", type: "add", price: 1.50 },
        { text: "Blue Cheese Dip", type: "default" },
        { text: "Celery Sticks", type: "add" }
      ] }
    ],
    orderNotes: "Apartment 4B - ring doorbell twice",
    subtotal: 76.00,
    discount: 5.00,
    deliveryFee: 4.99,
    tax: 6.08,
    tip: 12.00,
    total: 94.07,
    isPaid: true,
    addUtensils: true,
    itemCount: 5
  },
  {
    id: "4",
    orderNumber: 1026,
    customerName: "Albert Flores",
    phone: "(505) 555-0125",
    platform: "direct",
    orderType: "PICK UP",
    status: "PREPARING",
    orderedAt: "09:25 AM",
    estimateReady: "09:55 AM",
    countdown: "20:00",
    items: [
      { qty: 2, name: "Steak Frites", price: 28.00, modifiers: ["Medium Rare"] }
    ],
    subtotal: 56.00,
    discount: 0,
    deliveryFee: 0,
    tax: 4.48,
    tip: 8.00,
    total: 68.48,
    isPaid: true,
    addUtensils: false,
    itemCount: 2
  },
  {
    id: "5",
    orderNumber: 1027,
    customerName: "Kristin Watson",
    phone: "(219) 555-0114",
    platform: "ubereats",
    orderType: "DELIVERY",
    status: "READY",
    orderedAt: "09:00 AM",
    estimateReady: "09:30 AM",
    deliverBy: "09:45 AM",
    countdown: "00:00",
    items: [
      { qty: 1, name: "Lobster Roll", price: 32.00, modifiers: [], richModifiers: [
        { text: "Brioche Bun", type: "default" },
        { text: "Extra Mayo", type: "add" },
        { text: "No Chives", type: "remove" },
        { text: "Side of Fries", type: "add", price: 4.00 }
      ], notes: "Allergy: Shellfish allergy for companion - keep separate" },
      { qty: 1, name: "Clam Chowder", price: 10.00, modifiers: [], richModifiers: [
        { text: "Large Size", type: "add", price: 3.00 },
        { text: "Extra Crackers", type: "add" }
      ] }
    ],
    orderNotes: "Handle with care - customer has food allergies",
    subtotal: 42.00,
    discount: 0,
    deliveryFee: 5.99,
    tax: 3.36,
    tip: 7.00,
    total: 58.35,
    isPaid: true,
    addUtensils: true,
    itemCount: 2
  },
  {
    id: "6",
    orderNumber: 1028,
    customerName: "Brooklyn Simmons",
    phone: "(316) 555-0116",
    platform: "doordash",
    orderType: "DELIVERY",
    status: "OUT_FOR_DELIVERY",
    orderedAt: "08:45 AM",
    estimateReady: "09:15 AM",
    deliverBy: "09:30 AM",
    countdown: "10:00",
    items: [
      { qty: 4, name: "Tacos Al Pastor", price: 4.50, modifiers: [] },
      { qty: 2, name: "Churros", price: 6.00, modifiers: [] }
    ],
    subtotal: 30.00,
    discount: 3.00,
    deliveryFee: 3.99,
    tax: 2.40,
    tip: 5.00,
    total: 38.39,
    isPaid: true,
    addUtensils: false,
    itemCount: 6
  },
  {
    id: "7",
    orderNumber: 1029,
    customerName: "Jacob Jones",
    phone: "(704) 555-0127",
    platform: "grubhub",
    orderType: "PICK UP",
    status: "COMPLETED",
    orderedAt: "08:30 AM",
    estimateReady: "09:00 AM",
    countdown: "00:00",
    items: [
      { qty: 2, name: "Pad Thai", price: 15.00, modifiers: ["Extra Peanuts"] }
    ],
    subtotal: 30.00,
    discount: 0,
    deliveryFee: 0,
    tax: 2.40,
    tip: 6.00,
    total: 38.40,
    isPaid: true,
    addUtensils: true,
    itemCount: 2
  },
  // DINE IN Orders
  {
    id: "8",
    orderNumber: 1030,
    customerName: "Sarah Miller",
    phone: "(415) 555-0198",
    platform: "direct",
    orderType: "DINE IN",
    status: "NEW",
    orderedAt: "09:40 AM",
    estimateReady: "10:00 AM",
    countdown: "20:00",
    tableNumber: "T-12",
    items: [
      { qty: 1, name: "Ribeye Steak", price: 38.00, modifiers: [], richModifiers: [
        { text: "Medium Well", type: "default" },
        { text: "Garlic Butter", type: "add", price: 2.00 },
        { text: "Peppercorn Sauce", type: "add", price: 3.00 },
        { text: "No Salt", type: "remove" }
      ], notes: "Birthday dinner - can we add a candle?" },
      { qty: 1, name: "Mashed Potatoes", price: 8.00, modifiers: [], richModifiers: [
        { text: "Extra Gravy", type: "add" },
        { text: "Chives on Side", type: "default" }
      ] },
      { qty: 2, name: "House Salad", price: 9.00, modifiers: [], richModifiers: [
        { text: "Ranch Dressing", type: "default" },
        { text: "No Onions", type: "remove" },
        { text: "Extra Croutons", type: "add" }
      ] }
    ],
    orderNotes: "VIP guest - anniversary celebration, please seat near window",
    subtotal: 64.00,
    discount: 0,
    deliveryFee: 0,
    tax: 5.12,
    tip: 12.00,
    total: 81.12,
    isPaid: false,
    addUtensils: true,
    itemCount: 4
  },
  {
    id: "9",
    orderNumber: 1031,
    customerName: "Michael Chen",
    phone: "(628) 555-0145",
    platform: "direct",
    orderType: "DINE IN",
    status: "NEW",
    orderedAt: "09:45 AM",
    estimateReady: "10:05 AM",
    countdown: "25:00",
    tableNumber: "T-05",
    items: [
      { qty: 2, name: "Spaghetti Carbonara", price: 16.00, modifiers: [], richModifiers: [
        { text: "Extra Bacon", type: "add", price: 3.00 },
        { text: "Parmesan on Side", type: "default" },
        { text: "No Black Pepper", type: "remove" },
        { text: "Gluten-Free Pasta", type: "add", price: 2.50 }
      ], notes: "One plate gluten-free, one regular" },
      { qty: 1, name: "Tiramisu", price: 10.00, modifiers: [], richModifiers: [
        { text: "Extra Espresso", type: "add" },
        { text: "No Cocoa Powder", type: "remove" }
      ] },
      { qty: 2, name: "Glass of Wine", price: 12.00, modifiers: [], richModifiers: [
        { text: "Pinot Grigio", type: "default" },
        { text: "Chilled", type: "default" }
      ], notes: "One glass red, one white" }
    ],
    orderNotes: "Business meeting - need quiet table, check back in 30 min",
    subtotal: 54.00,
    discount: 0,
    deliveryFee: 0,
    tax: 4.32,
    tip: 10.00,
    total: 68.32,
    isPaid: false,
    addUtensils: true,
    itemCount: 5
  },
  {
    id: "10",
    orderNumber: 1032,
    customerName: "Emily Rodriguez",
    phone: "(310) 555-0167",
    platform: "direct",
    orderType: "DINE IN",
    status: "PREPARING",
    orderedAt: "09:30 AM",
    estimateReady: "09:50 AM",
    countdown: "10:00",
    tableNumber: "T-08",
    items: [
      { qty: 3, name: "Fish Tacos", price: 14.00, modifiers: ["Extra Lime"] },
      { qty: 1, name: "Guacamole", price: 8.00, modifiers: [] },
      { qty: 3, name: "Margarita", price: 11.00, modifiers: [] }
    ],
    subtotal: 83.00,
    discount: 5.00,
    deliveryFee: 0,
    tax: 6.64,
    tip: 15.00,
    total: 99.64,
    isPaid: false,
    addUtensils: true,
    itemCount: 7
  },
  {
    id: "11",
    orderNumber: 1033,
    customerName: "David Kim",
    phone: "(213) 555-0189",
    platform: "direct",
    orderType: "DINE IN",
    status: "PREPARING",
    orderedAt: "09:25 AM",
    estimateReady: "09:45 AM",
    countdown: "05:00",
    tableNumber: "T-03",
    items: [
      { qty: 1, name: "Lamb Chops", price: 34.00, modifiers: ["Medium Rare"] },
      { qty: 1, name: "Roasted Vegetables", price: 10.00, modifiers: [] }
    ],
    subtotal: 44.00,
    discount: 0,
    deliveryFee: 0,
    tax: 3.52,
    tip: 8.00,
    total: 55.52,
    isPaid: false,
    addUtensils: true,
    itemCount: 2
  },
  {
    id: "12",
    orderNumber: 1034,
    customerName: "Jessica Taylor",
    phone: "(858) 555-0134",
    platform: "direct",
    orderType: "DINE IN",
    status: "READY",
    orderedAt: "09:10 AM",
    estimateReady: "09:30 AM",
    countdown: "00:00",
    tableNumber: "T-15",
    items: [
      { qty: 2, name: "Grilled Chicken", price: 18.00, modifiers: [] },
      { qty: 2, name: "Caesar Salad", price: 12.00, modifiers: ["No Anchovies"] },
      { qty: 2, name: "Iced Tea", price: 4.00, modifiers: [] }
    ],
    subtotal: 68.00,
    discount: 0,
    deliveryFee: 0,
    tax: 5.44,
    tip: 12.00,
    total: 85.44,
    isPaid: true,
    addUtensils: true,
    itemCount: 6
  },
  {
    id: "13",
    orderNumber: 1035,
    customerName: "Robert Martinez",
    phone: "(619) 555-0156",
    platform: "direct",
    orderType: "DINE IN",
    status: "COMPLETED",
    orderedAt: "08:45 AM",
    estimateReady: "09:15 AM",
    countdown: "00:00",
    tableNumber: "T-10",
    items: [
      { qty: 4, name: "Breakfast Burrito", price: 12.00, modifiers: [] },
      { qty: 4, name: "Orange Juice", price: 5.00, modifiers: [] }
    ],
    subtotal: 68.00,
    discount: 10.00,
    deliveryFee: 0,
    tax: 5.44,
    tip: 14.00,
    total: 77.44,
    isPaid: true,
    addUtensils: false,
    itemCount: 8
  },
  {
    id: "14",
    orderNumber: 1036,
    customerName: "Amanda White",
    phone: "(949) 555-0178",
    platform: "direct",
    orderType: "DINE IN",
    status: "NEW",
    orderedAt: "09:50 AM",
    estimateReady: "10:10 AM",
    countdown: "30:00",
    tableNumber: "T-02",
    items: [
      { qty: 1, name: "Eggs Benedict", price: 16.00, modifiers: [] },
      { qty: 1, name: "Fresh Fruit Bowl", price: 8.00, modifiers: [] },
      { qty: 1, name: "Cappuccino", price: 5.00, modifiers: [] }
    ],
    subtotal: 29.00,
    discount: 0,
    deliveryFee: 0,
    tax: 2.32,
    tip: 6.00,
    total: 37.32,
    isPaid: false,
    addUtensils: true,
    itemCount: 3
  },
  // SCHEDULED Orders
  {
    id: "15",
    orderNumber: 1037,
    customerName: "Marcus Chen",
    phone: "(415) 555-0188",
    platform: "direct",
    orderType: "DINE IN",
    isScheduled: true,
    status: "NEW",
    orderedAt: "08:15 AM",
    estimateReady: "06:00 PM",
    scheduledFor: "Today 6:00 PM",
    countdown: "8:45:00",
    tableNumber: "T-20",
    items: [
      { qty: 4, name: "Ribeye Steak", price: 38.00, modifiers: ["Medium Well"] },
      { qty: 4, name: "Caesar Salad", price: 12.00, modifiers: [] },
      { qty: 2, name: "Garlic Mashed Potatoes", price: 8.00, modifiers: [] },
      { qty: 2, name: "Red Wine Bottle", price: 45.00, modifiers: [] }
    ],
    subtotal: 306.00,
    discount: 0,
    deliveryFee: 0,
    tax: 24.48,
    tip: 50.00,
    total: 380.48,
    isPaid: true,
    addUtensils: true,
    itemCount: 12
  },
  {
    id: "16",
    orderNumber: 1038,
    customerName: "Emily Watson",
    phone: "(628) 555-0199",
    platform: "doordash",
    orderType: "DELIVERY",
    isScheduled: true,
    status: "NEW",
    orderedAt: "07:30 AM",
    estimateReady: "12:30 PM",
    scheduledFor: "Today 12:30 PM",
    deliverBy: "12:45 PM",
    countdown: "3:15:00",
    items: [
      { qty: 10, name: "Sandwich Platter", price: 12.00, modifiers: [] },
      { qty: 10, name: "Side Salad", price: 6.00, modifiers: [] },
      { qty: 10, name: "Bottled Water", price: 2.00, modifiers: [] }
    ],
    subtotal: 200.00,
    discount: 20.00,
    deliveryFee: 8.99,
    tax: 16.00,
    tip: 30.00,
    total: 234.99,
    isPaid: true,
    addUtensils: true,
    itemCount: 30
  },
  {
    id: "17",
    orderNumber: 1039,
    customerName: "David Park",
    phone: "(510) 555-0177",
    platform: "grubhub",
    orderType: "PICK UP",
    isScheduled: true,
    status: "PREPARING",
    orderedAt: "Yesterday",
    estimateReady: "11:00 AM",
    scheduledFor: "Today 11:00 AM",
    countdown: "1:45:00",
    items: [
      { qty: 6, name: "Breakfast Burrito", price: 14.00, modifiers: [] },
      { qty: 6, name: "Hash Browns", price: 5.00, modifiers: [] },
      { qty: 6, name: "Orange Juice", price: 4.00, modifiers: [] }
    ],
    subtotal: 138.00,
    discount: 0,
    deliveryFee: 5.99,
    tax: 11.04,
    tip: 20.00,
    total: 175.03,
    isPaid: true,
    addUtensils: false,
    itemCount: 18
  },
  {
    id: "18",
    orderNumber: 1040,
    customerName: "Sarah Miller",
    phone: "(925) 555-0166",
    platform: "ubereats",
    orderType: "DELIVERY",
    isScheduled: true,
    status: "READY",
    orderedAt: "Yesterday",
    estimateReady: "09:30 AM",
    scheduledFor: "Today 9:30 AM",
    deliverBy: "9:45 AM",
    countdown: "00:00",
    items: [
      { qty: 2, name: "Birthday Cake", price: 55.00, modifiers: ["Chocolate"] },
      { qty: 24, name: "Cupcakes", price: 3.50, modifiers: [] }
    ],
    subtotal: 194.00,
    discount: 0,
    deliveryFee: 4.99,
    tax: 15.52,
    tip: 25.00,
    total: 239.51,
    isPaid: true,
    addUtensils: false,
    itemCount: 26
  },
  {
    id: "19",
    orderNumber: 1041,
    customerName: "Tom Garcia",
    phone: "(707) 555-0155",
    platform: "direct",
    orderType: "DINE IN",
    isScheduled: true,
    status: "COMPLETED",
    orderedAt: "2 days ago",
    estimateReady: "Yesterday",
    scheduledFor: "Yesterday 7:00 PM",
    countdown: "00:00",
    tableNumber: "T-VIP",
    items: [
      { qty: 8, name: "Prime Rib", price: 42.00, modifiers: [] },
      { qty: 8, name: "Lobster Tail", price: 35.00, modifiers: [] },
      { qty: 4, name: "Champagne Bottle", price: 65.00, modifiers: [] }
    ],
    subtotal: 876.00,
    discount: 50.00,
    deliveryFee: 0,
    tax: 70.08,
    tip: 150.00,
    total: 1046.08,
    isPaid: true,
    addUtensils: true,
    itemCount: 20
  },
  {
    id: "20",
    orderNumber: 1042,
    customerName: "Jessica Lee",
    phone: "(408) 555-0144",
    platform: "ubereats",
    orderType: "DELIVERY",
    isScheduled: true,
    status: "NEW",
    orderedAt: "06:00 AM",
    estimateReady: "07:00 PM",
    scheduledFor: "Today 7:00 PM",
    deliverBy: "7:30 PM",
    countdown: "9:45:00",
    items: [
      { qty: 2, name: "Filet Mignon", price: 45.00, modifiers: ["Medium Rare"] },
      { qty: 2, name: "Truffle Fries", price: 12.00, modifiers: [] },
      { qty: 1, name: "Chocolate Lava Cake", price: 14.00, modifiers: [] }
    ],
    subtotal: 128.00,
    discount: 0,
    deliveryFee: 6.99,
    tax: 10.24,
    tip: 25.00,
    total: 170.23,
    isPaid: true,
    addUtensils: true,
    itemCount: 5
  },
  {
    id: "21",
    orderNumber: 1043,
    customerName: "Robert Kim",
    phone: "(650) 555-0133",
    platform: "grubhub",
    orderType: "PICK UP",
    isScheduled: true,
    status: "NEW",
    orderedAt: "Yesterday",
    estimateReady: "01:00 PM",
    scheduledFor: "Tomorrow 1:00 PM",
    countdown: "25:45:00",
    items: [
      { qty: 15, name: "BBQ Pulled Pork Sandwich", price: 14.00, modifiers: [] },
      { qty: 15, name: "Coleslaw", price: 4.00, modifiers: [] },
      { qty: 15, name: "Lemonade", price: 3.00, modifiers: [] }
    ],
    subtotal: 315.00,
    discount: 30.00,
    deliveryFee: 0,
    tax: 25.20,
    tip: 50.00,
    total: 360.20,
    isPaid: true,
    addUtensils: true,
    itemCount: 45
  },
  {
    id: "22",
    orderNumber: 1044,
    customerName: "Amanda Torres",
    phone: "(831) 555-0122",
    platform: "doordash",
    orderType: "DELIVERY",
    isScheduled: true,
    status: "PREPARING",
    orderedAt: "Yesterday",
    estimateReady: "10:30 AM",
    scheduledFor: "Today 10:30 AM",
    deliverBy: "11:00 AM",
    countdown: "1:15:00",
    items: [
      { qty: 8, name: "Avocado Toast", price: 12.00, modifiers: [] },
      { qty: 8, name: "Fruit Parfait", price: 8.00, modifiers: [] },
      { qty: 8, name: "Cold Brew Coffee", price: 5.00, modifiers: [] }
    ],
    subtotal: 200.00,
    discount: 0,
    deliveryFee: 7.99,
    tax: 16.00,
    tip: 35.00,
    total: 258.99,
    isPaid: true,
    addUtensils: false,
    itemCount: 24
  },
  {
    id: "23",
    orderNumber: 1045,
    customerName: "Michael Brown",
    phone: "(510) 555-0111",
    platform: "direct",
    orderType: "PICK UP",
    isScheduled: true,
    status: "NEW",
    orderedAt: "05:30 AM",
    estimateReady: "05:30 PM",
    scheduledFor: "Today 5:30 PM",
    countdown: "8:15:00",
    items: [
      { qty: 6, name: "Sushi Platter", price: 65.00, modifiers: [] },
      { qty: 3, name: "Miso Soup", price: 6.00, modifiers: [] },
      { qty: 6, name: "Edamame", price: 7.00, modifiers: [] }
    ],
    subtotal: 450.00,
    discount: 0,
    deliveryFee: 0,
    tax: 36.00,
    tip: 75.00,
    total: 561.00,
    isPaid: true,
    addUtensils: true,
    itemCount: 15
  },
  {
    id: "24",
    orderNumber: 1046,
    customerName: "Nicole Adams",
    phone: "(925) 555-0100",
    platform: "ubereats",
    orderType: "DELIVERY",
    isScheduled: true,
    status: "READY",
    orderedAt: "Yesterday",
    estimateReady: "09:00 AM",
    scheduledFor: "Today 9:00 AM",
    deliverBy: "9:30 AM",
    countdown: "00:00",
    items: [
      { qty: 20, name: "Bagel with Cream Cheese", price: 5.00, modifiers: [] },
      { qty: 10, name: "Fresh Fruit Cup", price: 6.00, modifiers: [] },
      { qty: 20, name: "Coffee", price: 3.00, modifiers: [] }
    ],
    subtotal: 220.00,
    discount: 20.00,
    deliveryFee: 5.99,
    tax: 17.60,
    tip: 40.00,
    total: 263.59,
    isPaid: true,
    addUtensils: false,
    itemCount: 50
  },
  {
    id: "25",
    orderNumber: 1047,
    customerName: "Chris Martinez",
    phone: "(408) 555-0199",
    platform: "grubhub",
    orderType: "PICK UP",
    isScheduled: true,
    status: "COMPLETED",
    orderedAt: "3 days ago",
    estimateReady: "Yesterday",
    scheduledFor: "Yesterday 12:00 PM",
    countdown: "00:00",
    items: [
      { qty: 12, name: "Taco Platter", price: 15.00, modifiers: [] },
      { qty: 12, name: "Chips & Guacamole", price: 8.00, modifiers: [] },
      { qty: 6, name: "Margarita Pitcher", price: 28.00, modifiers: [] }
    ],
    subtotal: 444.00,
    discount: 40.00,
    deliveryFee: 0,
    tax: 35.52,
    tip: 80.00,
    total: 519.52,
    isPaid: true,
    addUtensils: true,
    itemCount: 30
  }
];

// Generate scheduled time for a specific day-part (for demo purposes)
const generateDayPartScheduledTime = (dayPartId: string): { scheduledFor: string; scheduledTimestamp: number } => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  // Day-part time mappings (middle of each period)
  const dayPartTimes: Record<string, { hour: number; minute: number }> = {
    'BREAKFAST': { hour: 8, minute: 0 },    // 8:00 AM
    'BRUNCH': { hour: 11, minute: 15 },     // 11:15 AM
    'LUNCH': { hour: 13, minute: 30 },      // 1:30 PM
    'EVENING_SNACKS': { hour: 16, minute: 30 }, // 4:30 PM
    'DINNER': { hour: 19, minute: 30 },     // 7:30 PM
    'LATE_NIGHT': { hour: 23, minute: 0 },  // 11:00 PM
  };
  
  const time = dayPartTimes[dayPartId] || { hour: 12, minute: 0 };
  let scheduledDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), time.hour, time.minute);
  
  // If the time has already passed today, schedule for tomorrow
  if (scheduledDate.getTime() < now.getTime()) {
    scheduledDate = new Date(scheduledDate.getTime() + 24 * 60 * 60 * 1000);
  }
  
  const dateLabel = getDateLabel(scheduledDate);
  const timeLabel = formatTimeFromDate(scheduledDate);
  
  return {
    scheduledFor: `${dateLabel} ${timeLabel}`,
    scheduledTimestamp: scheduledDate.getTime()
  };
};

// Initialize mock orders with dynamic timestamps relative to current time
// Regular orders get times that make sense (placed recently, ready in the future)
// Scheduled orders get proper future scheduled times across ALL day-parts
const mockOrders: OnlineOrder[] = mockOrdersData.map((order, index) => {
  // Handle scheduled orders separately
  if (order.isScheduled) {
    // Assign each scheduled order to a specific day-part for demo purposes
    // This ensures orders are spread across all day-parts
    const dayPartAssignments = [
      'BREAKFAST', 'BRUNCH', 'LUNCH', 'EVENING_SNACKS', 'DINNER', 'LATE_NIGHT',
      'BREAKFAST', 'LUNCH', 'DINNER', 'EVENING_SNACKS', 'BRUNCH'
    ];
    const scheduledOrderIndex = mockOrdersData.filter((o, i) => o.isScheduled && i <= index).length - 1;
    const assignedDayPart = dayPartAssignments[scheduledOrderIndex % dayPartAssignments.length];
    
    const dayPartTime = generateDayPartScheduledTime(assignedDayPart);
    const orderedAtTimestamp = Date.now() - (Math.floor(Math.random() * 180) + 60) * 60 * 1000;
    const orderedAt = formatTimeFromDate(new Date(orderedAtTimestamp));
    const estimateReady = formatTimeFromDate(new Date(dayPartTime.scheduledTimestamp));
    const deliverBy = order.orderType === 'DELIVERY' 
      ? formatTimeFromDate(new Date(dayPartTime.scheduledTimestamp + 15 * 60 * 1000))
      : undefined;
    
    return {
      ...order,
      orderedAt,
      orderedAtTimestamp,
      scheduledFor: dayPartTime.scheduledFor,
      estimateReady,
      deliverBy: deliverBy || order.deliverBy,
      isOverdue: false,
      isWaiting: true
    };
  }
  
  // Regular orders: stagger placement times
  const offsetMinutes = 2 + (index * 3);
  const readyMinutes = 20 + (index % 5) * 5;
  const deliveryMinutes = order.orderType === 'DELIVERY' ? readyMinutes + 15 : undefined;
  
  const times = generateOrderTimes(offsetMinutes, readyMinutes, deliveryMinutes);
  
  return {
    ...order,
    orderedAt: times.orderedAt,
    orderedAtTimestamp: times.orderedAtTimestamp,
    estimateReady: times.estimateReady,
    deliverBy: times.deliverBy || order.deliverBy,
    isOverdue: false,
    isWaiting: false
  };
});

// Helper functions
const formatPrice = (price: number) => `$${price.toFixed(2)}`;

const getPlatformIcon = (platform: OnlineOrder['platform'], orderId?: string) => {
  switch (platform) {
    case 'ubereats': return uberEatsIcon;
    case 'grubhub': return grubhubIcon;
    case 'doordash': return doordashIcon;
    case 'direct': 
      // Alternate between DeliveryOS and OrderOS logos based on order ID
      if (orderId) {
        // Use a simple hash based on character codes for stable alternation
        const hash = orderId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return hash % 2 === 0 ? deliveryOsIcon : orderOsLogo;
      }
      return directIcon;
  }
};

const getStatusColor = (status: OnlineOrder['status']) => {
  switch (status) {
    case 'NEW': return 'bg-[#FF6B6B]';
    case 'PREPARING': return 'bg-[#FFB347]';
    case 'READY': return 'bg-[#9B59B6]';
    case 'OUT_FOR_DELIVERY': return 'bg-[#F1C40F]';
    case 'COMPLETED': return 'bg-[#E91E8C]';
    case 'CANCELLED': return 'bg-neutral-600';
  }
};

const getStatusLabel = (status: OnlineOrder['status']) => {
  switch (status) {
    case 'NEW': return 'NEW ORDER';
    case 'PREPARING': return 'PREPARING';
    case 'READY': return 'READY';
    case 'OUT_FOR_DELIVERY': return 'OUT FOR DELIVERY';
    case 'COMPLETED': return 'COMPLETED';
    case 'CANCELLED': return 'CANCELLED';
  }
};

const getOrderTypeColor = (type: OnlineOrder['orderType']) => {
  switch (type) {
    case 'DELIVERY': return 'text-[#FF6B6B]';
    case 'PICK UP': return 'text-[#9B59B6]';
    case 'DINE IN': return 'text-[#F1C40F]';
  }
};

// Column configuration for ONLINE mode
const onlineColumns = [
  { id: 'NEW', label: 'New Order', emptyText: 'No new orders currently', emptyIcon: '📥' },
  { id: 'PREPARING', label: 'Preparing', emptyText: 'No orders in preparation', emptyIcon: '👨‍🍳' },
  { id: 'READY', label: 'Ready', emptyText: 'No orders ready', emptyIcon: '✅' },
  { id: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', emptyText: 'No orders out for delivery', emptyIcon: '🚗' },
  { id: 'COMPLETED', label: 'Completed', emptyText: 'No completed orders', emptyIcon: '🎉' },
  { id: 'CANCELLED', label: 'Cancelled', emptyText: 'No cancelled orders', emptyIcon: '❌' },
];

// Column configuration for DINE IN mode
const dineInColumns = [
  { id: 'NEW', label: 'New Order', emptyText: 'No new orders currently', emptyIcon: '📥' },
  { id: 'PREPARING', label: 'Preparing', emptyText: 'No orders in preparation', emptyIcon: '👨‍🍳' },
  { id: 'READY', label: 'Ready', emptyText: 'No orders ready', emptyIcon: '✅' },
  { id: 'COMPLETED', label: 'Completed', emptyText: 'No completed orders', emptyIcon: '🎉' },
  { id: 'CANCELLED', label: 'Cancelled', emptyText: 'No cancelled orders', emptyIcon: '❌' },
];

// Day Part configuration - configurable service hours for restaurant
// Time format: 24-hour (0-23)
interface DayPart {
  id: string;
  label: string;
  startHour: number; // 0-23
  startMinute: number; // 0-59
  endHour: number; // 0-23
  endMinute: number; // 0-59
  icon: string;
  emptyText: string;
  priority: number; // Lower = more urgent (affects visual styling)
}

// Default configurable day parts - restaurant admins can modify these
const defaultDayParts: DayPart[] = [
  { id: 'BREAKFAST', label: 'Breakfast', startHour: 6, startMinute: 0, endHour: 10, endMinute: 30, icon: '🍳', emptyText: 'No breakfast orders', priority: 1 },
  { id: 'BRUNCH', label: 'Brunch', startHour: 10, startMinute: 30, endHour: 12, endMinute: 0, icon: '🥂', emptyText: 'No brunch orders', priority: 2 },
  { id: 'LUNCH', label: 'Lunch', startHour: 12, startMinute: 0, endHour: 15, endMinute: 0, icon: '🥗', emptyText: 'No lunch orders', priority: 3 },
  { id: 'EVENING_SNACKS', label: 'Evening', startHour: 15, startMinute: 0, endHour: 18, endMinute: 0, icon: '🍿', emptyText: 'No evening orders', priority: 4 },
  { id: 'DINNER', label: 'Dinner', startHour: 18, startMinute: 0, endHour: 22, endMinute: 0, icon: '🍽️', emptyText: 'No dinner orders', priority: 5 },
  { id: 'LATE_NIGHT', label: 'Late Night', startHour: 22, startMinute: 0, endHour: 6, endMinute: 0, icon: '🌙', emptyText: 'No late night orders', priority: 6 },
];

// Convert hour:minute to minutes since midnight for easy comparison
const toMinutesSinceMidnight = (hour: number, minute: number): number => hour * 60 + minute;

// Check if a time falls within a day part (handles overnight ranges like 22:00-06:00)
const isTimeInDayPart = (timeMinutes: number, dayPart: DayPart): boolean => {
  const startMinutes = toMinutesSinceMidnight(dayPart.startHour, dayPart.startMinute);
  const endMinutes = toMinutesSinceMidnight(dayPart.endHour, dayPart.endMinute);
  
  // Handle overnight ranges (e.g., 22:00-06:00)
  if (startMinutes > endMinutes) {
    return timeMinutes >= startMinutes || timeMinutes < endMinutes;
  }
  
  return timeMinutes >= startMinutes && timeMinutes < endMinutes;
};

// Get the day part for a scheduled order based on its scheduled time
const getScheduledDayPart = (order: OnlineOrder, dayParts: DayPart[]): string => {
  if (!order.scheduledFor) return dayParts[dayParts.length - 1]?.id || 'LATE_NIGHT';
  
  const scheduledDate = parseScheduledTime(order.scheduledFor);
  const scheduledMinutes = toMinutesSinceMidnight(scheduledDate.getHours(), scheduledDate.getMinutes());
  
  for (const dayPart of dayParts) {
    if (isTimeInDayPart(scheduledMinutes, dayPart)) {
      return dayPart.id;
    }
  }
  
  // Fallback to last day part if no match
  return dayParts[dayParts.length - 1]?.id || 'LATE_NIGHT';
};

// Get day parts that have orders or are within operational context
// Only show columns for day parts that have scheduled orders or are currently active
const getActiveDayParts = (orders: OnlineOrder[], dayParts: DayPart[]): DayPart[] => {
  const now = new Date();
  const currentMinutes = toMinutesSinceMidnight(now.getHours(), now.getMinutes());
  
  // Find which day parts have orders
  const dayPartsWithOrders = new Set<string>();
  orders.forEach(order => {
    const dayPartId = getScheduledDayPart(order, dayParts);
    dayPartsWithOrders.add(dayPartId);
  });
  
  // Always show day parts that have orders, and optionally the current service
  return dayParts.filter(dp => {
    if (dayPartsWithOrders.has(dp.id)) return true;
    // Optionally include current service even if empty
    if (isTimeInDayPart(currentMinutes, dp)) return true;
    return false;
  });
};

// Check if a day part is the current service (for highlighting)
const isCurrentService = (dayPart: DayPart): boolean => {
  const now = new Date();
  const currentMinutes = toMinutesSinceMidnight(now.getHours(), now.getMinutes());
  return isTimeInDayPart(currentMinutes, dayPart);
};

// Check if a day part is coming up next (for visual indication)
const isNextService = (dayPart: DayPart, dayParts: DayPart[]): boolean => {
  const now = new Date();
  const currentMinutes = toMinutesSinceMidnight(now.getHours(), now.getMinutes());
  
  // Find the current service index
  const currentIndex = dayParts.findIndex(dp => isTimeInDayPart(currentMinutes, dp));
  if (currentIndex === -1) return false;
  
  // Next service is the one after current
  const nextIndex = (currentIndex + 1) % dayParts.length;
  return dayParts[nextIndex]?.id === dayPart.id;
};

// Column configuration for SCHEDULED mode - Day Part based layout
const scheduledColumns = defaultDayParts.map(dp => ({
  id: dp.id,
  label: dp.label,
  emptyText: dp.emptyText,
  emptyIcon: dp.icon,
  dayPart: dp
}));

const OrderOS = () => {
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const { setNewOrdersCount } = useApp();
  
  // State
  const [activeMode, setActiveMode] = useState<'DINE IN' | 'ONLINE' | 'SCHEDULED'>('ONLINE');
  const [mobileChipIndex, setMobileChipIndex] = useState(1); // 0=DINE IN, 1=ONLINE, 2=SCHEDULED
  const [orders, setOrders] = useState<OnlineOrder[]>(mockOrders);
  const [selectedOrder, setSelectedOrder] = useState<OnlineOrder | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentOrder, setPaymentOrder] = useState<OnlineOrder | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Ref-based countdown storage to avoid re-renders on every tick
  // This stores the current countdown display values without triggering state updates
  const countdownValuesRef = useRef<Map<string, { display: string; isOverdue: boolean; isWaiting: boolean }>>(new Map());
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  
  // Dynamic search placeholders
  const searchPlaceholders = [
    "Search by order #...",
    "Search by guest name...",
    "Search by platform...",
    "Search last 4 digits..."
  ];
  
  // Rotate placeholder text
  useEffect(() => {
    if (!showSearchInput) return;
    const interval = setInterval(() => {
      setPlaceholderIndex(prev => (prev + 1) % searchPlaceholders.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [showSearchInput]);
  const [filterDate, setFilterDate] = useState<Date | undefined>();
  const [autoAccept, setAutoAccept] = useState(true);
  const [showAutoAcceptNote, setShowAutoAcceptNote] = useState(false);
  const [pauseOrders, setPauseOrders] = useState(false);
  const [prepTime, setPrepTime] = useState(10);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<OnlineOrder | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [customCancelReason, setCustomCancelReason] = useState('');
  const [columnSortOptions, setColumnSortOptions] = useState<Record<string, 'time' | 'order' | 'total'>>({});
  
  // Report Issue state
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [orderToReport, setOrderToReport] = useState<OnlineOrder | null>(null);
  const [reportedItems, setReportedItems] = useState<Map<string, ReportedItem[]>>(new Map());
  
  // Track orders that have been notified of timeout (to prevent duplicate toasts)
  const notifiedTimeoutsRef = useRef<Set<string>>(new Set());
  // Track orders with extended wait time (+5 minutes)
  const [extendedWaitOrders, setExtendedWaitOrders] = useState<Map<string, number>>(new Map());
  
  // 86 Items state
  const [eightySixSheetOpen, setEightySixSheetOpen] = useState(false);
  const [eightySixedItems, setEightySixedItems] = useState<EightySixedItem[]>([]);
  
  // Prep Time Picker state
  const [prepTimePickerOpen, setPrepTimePickerOpen] = useState(false);
  const [prepTimeInputMode, setPrepTimeInputMode] = useState(false);
  const [prepTimeInputValue, setPrepTimeInputValue] = useState("");
  const prepTimeTriggerRef = useRef<HTMLDivElement>(null);
  const prepTimeInputRef = useRef<HTMLInputElement>(null);

  // Ready Time Picker state (for adjusting Est. Ready By)
  const [readyTimePickerOpen, setReadyTimePickerOpen] = useState(false);

  // Animation state for accepted/cancelled orders
  const [acceptedOrderId, setAcceptedOrderId] = useState<string | null>(null);
  const [cancelledOrderId, setCancelledOrderId] = useState<string | null>(null);

  // Update new orders count in context for sidebar badge
  useEffect(() => {
    const newOrdersCount = orders.filter(o => o.status === 'NEW').length;
    setNewOrdersCount(newOrdersCount);
  }, [orders, setNewOrdersCount]);

  // Real-time countdown timer - uses DOM manipulation for countdown display to avoid re-renders
  // Only triggers state update when order transitions happen (e.g., scheduled -> active)
  useEffect(() => {
    const interval = setInterval(() => {
      let needsStateUpdate = false;
      const transitionedOrderIds: string[] = [];
      
      // Update countdown values in ref and DOM directly
      orders.forEach(order => {
        // Skip timer update for completed or cancelled orders
        if (order.status === 'COMPLETED' || order.status === 'CANCELLED') {
          return;
        }
        
        // Calculate new countdown
        const { display, isOverdue, isWaiting } = calculateCountdown(order, prepTime);
        
        // Store in ref
        countdownValuesRef.current.set(order.id, { display, isOverdue, isWaiting });
        
        // Update DOM directly for countdown elements
        const countdownElement = document.querySelector(`[data-countdown-id="${order.id}"]`);
        if (countdownElement) {
          const prefix = isOverdue ? 'OVERDUE ' : (order.isScheduled && isWaiting ? 'STARTS IN ' : '');
          countdownElement.textContent = `${prefix}${display}`;
          
          // Update parent element classes for overdue pulse
          const parent = countdownElement.parentElement;
          if (parent) {
            if (isOverdue) {
              parent.classList.add('animate-pulse');
            } else {
              parent.classList.remove('animate-pulse');
            }
          }
        }
        
        // Check if order needs a state transition (scheduled -> active)
        const wasWaiting = order.isWaiting;
        const shouldTransition = order.isScheduled && wasWaiting && !isWaiting;
        
        if (shouldTransition) {
          needsStateUpdate = true;
          transitionedOrderIds.push(order.id);
        }
        
        // Check if overdue status changed
        if (order.isOverdue !== isOverdue) {
          needsStateUpdate = true;
        }
      });
      
      // Only update state when transitions or important status changes happen
      if (needsStateUpdate) {
        setOrders(prevOrders => 
          prevOrders.map(order => {
            const countdownData = countdownValuesRef.current.get(order.id);
            if (!countdownData) return order;
            
            const shouldTransition = transitionedOrderIds.includes(order.id);
            
            if (shouldTransition) {
              return {
                ...order,
                countdown: countdownData.display,
                isOverdue: countdownData.isOverdue,
                isWaiting: false,
                isScheduled: false,
              };
            }
            
            // Only update if overdue status changed
            if (order.isOverdue !== countdownData.isOverdue) {
              return {
                ...order,
                countdown: countdownData.display,
                isOverdue: countdownData.isOverdue,
                isWaiting: countdownData.isWaiting,
              };
            }
            
            return order;
          })
        );
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [orders, prepTime]);

  // Order status change handler
  const updateOrderStatus = useCallback((orderId: string, newStatus: OnlineOrder['status'], toastMessage: string) => {
    setOrders(prevOrders => 
      prevOrders.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      )
    );
    
    // Update selected order if it's the one being changed
    setSelectedOrder(prev => 
      prev?.id === orderId ? { ...prev, status: newStatus } : prev
    );
    
    toast({
      title: toastMessage,
      description: `Order #${orders.find(o => o.id === orderId)?.orderNumber} has been updated.`,
    });
  }, [orders, toast]);

  // Handler to update estimated ready time for an order
  const updateEstimatedReadyTime = useCallback((orderId: string, newTime: string) => {
    setOrders(prevOrders =>
      prevOrders.map(order =>
        order.id === orderId ? { ...order, estimateReady: newTime } : order
      )
    );
    setSelectedOrder(prev =>
      prev?.id === orderId ? { ...prev, estimateReady: newTime } : prev
    );
    toast({
      title: "Ready time updated",
      description: `Estimated ready time changed to ${newTime}.`,
    });
  }, [toast]);

  // Sound feedback for accept order
  const playAcceptSound = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create a pleasant "ding" sound
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Use a pleasant frequency (C5 note)
      oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime);
      oscillator.type = 'sine';
      
      // Quick fade in and out for a soft ding
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (e) {
      // Audio not supported or blocked, fail silently
      console.log('Audio feedback not available');
    }
  }, []);

  // Sound feedback for new order notification (two-tone chime)
  const playNewOrderSound = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // First tone (lower)
      const osc1 = audioContext.createOscillator();
      const gain1 = audioContext.createGain();
      osc1.connect(gain1);
      gain1.connect(audioContext.destination);
      osc1.frequency.setValueAtTime(587.33, audioContext.currentTime); // D5
      osc1.type = 'sine';
      gain1.gain.setValueAtTime(0, audioContext.currentTime);
      gain1.gain.linearRampToValueAtTime(0.4, audioContext.currentTime + 0.02);
      gain1.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
      osc1.start(audioContext.currentTime);
      osc1.stop(audioContext.currentTime + 0.2);
      
      // Second tone (higher) - delayed
      const osc2 = audioContext.createOscillator();
      const gain2 = audioContext.createGain();
      osc2.connect(gain2);
      gain2.connect(audioContext.destination);
      osc2.frequency.setValueAtTime(880, audioContext.currentTime + 0.15); // A5
      osc2.type = 'sine';
      gain2.gain.setValueAtTime(0, audioContext.currentTime + 0.15);
      gain2.gain.linearRampToValueAtTime(0.4, audioContext.currentTime + 0.17);
      gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      osc2.start(audioContext.currentTime + 0.15);
      osc2.stop(audioContext.currentTime + 0.5);
      
      // Third tone (highest) - delayed more
      const osc3 = audioContext.createOscillator();
      const gain3 = audioContext.createGain();
      osc3.connect(gain3);
      gain3.connect(audioContext.destination);
      osc3.frequency.setValueAtTime(1046.5, audioContext.currentTime + 0.3); // C6
      osc3.type = 'sine';
      gain3.gain.setValueAtTime(0, audioContext.currentTime + 0.3);
      gain3.gain.linearRampToValueAtTime(0.35, audioContext.currentTime + 0.32);
      gain3.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.7);
      osc3.start(audioContext.currentTime + 0.3);
      osc3.stop(audioContext.currentTime + 0.7);
    } catch (e) {
      console.log('Audio feedback not available');
    }
  }, []);

  // Simulate new order arriving (for demo purposes)
  const simulateNewOrder = useCallback(() => {
    if (pauseOrders) return;
    
    const newOrderNumber = Math.floor(1030 + Math.random() * 100);
    const platforms: OnlineOrder['platform'][] = ['ubereats', 'grubhub', 'doordash', 'direct'];
    const orderTypes: OnlineOrder['orderType'][] = ['DELIVERY', 'PICK UP'];
    const names = ['Alex Johnson', 'Sam Wilson', 'Chris Davis', 'Jordan Lee', 'Taylor Brown'];
    
    const newOrder: OnlineOrder = {
      id: `order-${Date.now()}`,
      orderNumber: newOrderNumber,
      customerName: names[Math.floor(Math.random() * names.length)],
      phone: `(${Math.floor(Math.random() * 900) + 100}) 555-${Math.floor(Math.random() * 9000) + 1000}`,
      platform: platforms[Math.floor(Math.random() * platforms.length)],
      orderType: orderTypes[Math.floor(Math.random() * orderTypes.length)],
      status: 'NEW',
      orderedAt: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      orderedAtTimestamp: Date.now(), // Start timer from now
      estimateReady: new Date(Date.now() + 20 * 60000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      deliverBy: new Date(Date.now() + 45 * 60000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      countdown: '00:00', // Will be updated by timer
      items: [
        { name: 'House Special', qty: 1, price: 18.99, modifiers: [] },
        { name: 'Side Salad', qty: 1, price: 6.99, modifiers: [] }
      ],
      itemCount: 2,
      subtotal: 25.98,
      tax: 2.34,
      tip: 5.00,
      deliveryFee: 4.99,
      discount: 0,
      total: 38.31,
      isPaid: false,
      addUtensils: true
    };
    
    setOrders(prev => [newOrder, ...prev]);
    playNewOrderSound();
    
    toast({
      title: 'New Order Received!',
      description: `Order #${newOrderNumber} from ${newOrder.customerName}`,
    });
  }, [pauseOrders, playNewOrderSound, toast]);

  // Action handlers
  const handleAcceptOrder = useCallback((orderId: string) => {
    // Trigger animation and sound
    setAcceptedOrderId(orderId);
    playAcceptSound();
    
    // Update status after brief delay for visual feedback
    setTimeout(() => {
      updateOrderStatus(orderId, 'PREPARING', 'Order Accepted');
      // Clear animation state after transition
      setTimeout(() => setAcceptedOrderId(null), 300);
    }, 400);
  }, [updateOrderStatus, playAcceptSound]);

  const handleMakeReady = useCallback((orderId: string) => {
    updateOrderStatus(orderId, 'READY', 'Order Ready');
  }, [updateOrderStatus]);

  const handleReadyForPickup = useCallback((orderId: string, orderType: OnlineOrder['orderType']) => {
    if (orderType === 'DELIVERY') {
      updateOrderStatus(orderId, 'OUT_FOR_DELIVERY', 'Order Out for Delivery');
    } else {
      updateOrderStatus(orderId, 'COMPLETED', 'Order Completed');
    }
  }, [updateOrderStatus]);

  const handleMarkDelivered = useCallback((orderId: string) => {
    updateOrderStatus(orderId, 'COMPLETED', 'Order Delivered');
  }, [updateOrderStatus]);

  const handleCancelOrder = useCallback((orderId: string) => {
    // Trigger animation
    setCancelledOrderId(orderId);
    
    // Update status after brief delay for visual feedback
    setTimeout(() => {
      updateOrderStatus(orderId, 'CANCELLED', 'Order Cancelled');
      // Clear animation state after transition
      setTimeout(() => setCancelledOrderId(null), 300);
    }, 400);
  }, [updateOrderStatus]);

  // Open cancel confirmation dialog
  const openCancelDialog = useCallback((order: OnlineOrder) => {
    setOrderToCancel(order);
    setCancelReason('');
    setCustomCancelReason('');
    setCancelDialogOpen(true);
  }, []);

  const confirmCancelOrder = useCallback(() => {
    if (orderToCancel) {
      const reason = cancelReason === '__custom__' ? customCancelReason.trim() : cancelReason;
      console.log('[CancelOrder] Order:', orderToCancel.orderNumber, 'Reason:', reason);
      handleCancelOrder(orderToCancel.id);
      setCancelDialogOpen(false);
      setOrderToCancel(null);
      setCancelReason('');
      setCustomCancelReason('');
    }
  }, [orderToCancel, handleCancelOrder, cancelReason, customCancelReason]);

  // Report Exception handlers
  const openReportDialog = useCallback((order: OnlineOrder) => {
    setOrderToReport(order);
    setReportDialogOpen(true);
  }, []);

  const handleReportItems = useCallback((items: ReportedItem[], auditData?: { reportedBy: string; reportedByRole: string; approvedBy?: string; timestamp: string; device: string; orderStatus: string; customerNotified: boolean; platform: string }) => {
    if (orderToReport) {
      setReportedItems(prev => {
        const next = new Map(prev);
        const existingReports = prev.get(orderToReport.id) || [];
        
        // Merge new reports with existing ones
        const mergedReports = [...existingReports];
        const now = Date.now();
        items.forEach(newItem => {
          const existingIndex = mergedReports.findIndex(r => r.itemIndex === newItem.itemIndex);
          if (existingIndex >= 0) {
            // Add quantities together for the same item
            mergedReports[existingIndex] = {
              ...mergedReports[existingIndex],
              unavailableQty: mergedReports[existingIndex].unavailableQty + newItem.unavailableQty,
              priceImpact: mergedReports[existingIndex].priceImpact + newItem.priceImpact,
              originalPrice: mergedReports[existingIndex].originalPrice + newItem.originalPrice,
              // Update reportedAt for on hold tracking
              reportedAt: newItem.reportedAt || mergedReports[existingIndex].reportedAt,
            };
          } else {
            mergedReports.push({
              ...newItem,
              reportedAt: newItem.reportedAt || now,
            });
          }
        });
        
        next.set(orderToReport.id, mergedReports);
        return next;
      });
      
      // All exceptions now put order on hold while awaiting aggregator response
      const statusText = 'Order placed on hold – awaiting aggregator response';
      
      toast({
        title: "Exception Reported",
        description: `${items.length} item(s) reported for Order #${orderToReport.orderNumber}. ${statusText}`,
      });
    }
  }, [orderToReport, toast]);

  // Handler to remove reported items from an order (after timeout or user action)
  const handleRemoveReportedItems = useCallback((orderId: string) => {
    const orderReports = reportedItems.get(orderId) || [];
    const order = orders.find(o => o.id === orderId);
    
    if (order && orderReports.length > 0) {
      // Remove the reported items from the order
      const reportedItemNames = orderReports.map(r => r.itemName).join(', ');
      
      // Clear the reported items for this order
      setReportedItems(prev => {
        const next = new Map(prev);
        next.delete(orderId);
        return next;
      });
      
      // Clear extended wait and notified status
      setExtendedWaitOrders(prev => {
        const next = new Map(prev);
        next.delete(orderId);
        return next;
      });
      notifiedTimeoutsRef.current.delete(orderId);
      
      toast({
        title: "Items Removed",
        description: `${reportedItemNames} removed from Order #${order.orderNumber}. Aggregator will handle refund.`,
      });
    }
  }, [reportedItems, orders, toast]);

  // Handler to extend wait time by 5 more minutes
  const handleExtendWaitTime = useCallback((orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    
    if (order) {
      // Set extended wait timestamp
      setExtendedWaitOrders(prev => {
        const next = new Map(prev);
        next.set(orderId, Date.now());
        return next;
      });
      
      // Clear the notified status so we can notify again after extension expires
      notifiedTimeoutsRef.current.delete(orderId);
      
      toast({
        title: "Wait Extended",
        description: `Order #${order.orderNumber} will wait 5 more minutes for aggregator response.`,
      });
    }
  }, [orders, toast]);

  // 86 Items handlers
  const handleEightySixItem = useCallback((item: { name: string; category: string; snoozeDuration: string }) => {
    const durations: Record<string, number | null> = {
      '15min': 15 * 60 * 1000,
      '1hr': 60 * 60 * 1000,
      'end_of_shift': 8 * 60 * 60 * 1000,
      'indefinite': null,
    };
    
    const ms = durations[item.snoozeDuration];
    const newItem: EightySixedItem = {
      id: Date.now().toString(),
      name: item.name,
      category: item.category,
      reason: 'Out of Stock',
      snoozedAt: new Date(),
      snoozeEndTime: ms ? new Date(Date.now() + ms) : null,
    };
    
    setEightySixedItems(prev => [...prev, newItem]);
    toast({
      title: "Item 86'd",
      description: `${item.name} marked as unavailable`,
    });
  }, [toast]);

  const handleRestoreItem = useCallback((itemId: string) => {
    setEightySixedItems(prev => prev.filter(item => item.id !== itemId));
    toast({
      title: "Item Restored",
      description: "Item is now available again",
    });
  }, [toast]);

  const handleScheduleRestore = useCallback((itemId: string, restoreTime: Date) => {
    setEightySixedItems(prev => prev.map(item => 
      item.id === itemId 
        ? { ...item, scheduledRestoreTime: restoreTime }
        : item
    ));
    toast({
      title: "Restore Scheduled",
      description: `Item will be restored at ${restoreTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`,
    });
  }, [toast]);

  // Auto-restore items when their scheduled restore time is reached
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setEightySixedItems(prev => {
        const itemsToRestore = prev.filter(item => 
          item.scheduledRestoreTime && item.scheduledRestoreTime <= now
        );
        if (itemsToRestore.length > 0) {
          itemsToRestore.forEach(item => {
            toast({
              title: "Item Auto-Restored",
              description: `${item.name} is now available again`,
            });
          });
          return prev.filter(item => 
            !item.scheduledRestoreTime || item.scheduledRestoreTime > now
          );
        }
        return prev;
      });
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [toast]);

  // Helper to highlight matching text in search results
  const highlightMatch = useCallback((text: string, isMatch: boolean = true) => {
    if (!searchQuery || !isMatch) return text;
    const query = searchQuery.toLowerCase();
    const lowerText = text.toLowerCase();
    const startIndex = lowerText.indexOf(query);
    
    if (startIndex === -1) return text;
    
    const endIndex = startIndex + query.length;
    return (
      <>
        {text.slice(0, startIndex)}
        <span className="bg-[#FFD60A]/40 text-[#FFD60A] rounded px-0.5">{text.slice(startIndex, endIndex)}</span>
        {text.slice(endIndex)}
      </>
    );
  }, [searchQuery]);

  // Current time display
  const currentTime = format(new Date(), 'h:mm');
  const currentPeriod = format(new Date(), 'a').toUpperCase();
  
  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // Filter by mode: 
      // - DINE IN shows DINE IN orders (excluding scheduled orders that are still waiting)
      // - ONLINE shows DELIVERY and PICK UP (excluding scheduled orders that are still waiting)
      // - SCHEDULED shows only waiting scheduled orders
      if (activeMode === 'DINE IN') {
        if (order.orderType !== 'DINE IN') {
          return false;
        }
        // Exclude DeliveryOS orders - they should only appear in Online section
        // DeliveryOS orders are 'direct' platform with even hash
        if (order.platform === 'direct') {
          const hash = order.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
          if (hash % 2 === 0) {
            return false; // This is a DeliveryOS order
          }
        }
        // Exclude scheduled orders that are still waiting - they belong in SCHEDULED view only
        if (order.isScheduled && order.isWaiting) {
          return false;
        }
      }
      if (activeMode === 'ONLINE') {
        if (order.orderType === 'DINE IN') {
          return false;
        }
        // Exclude scheduled orders that are still waiting - they belong in SCHEDULED view only
        if (order.isScheduled && order.isWaiting) {
          return false;
        }
      }
      if (activeMode === 'SCHEDULED') {
        // Only show scheduled orders that are still waiting for their time window
        if (!order.isScheduled || !order.isWaiting) {
          return false;
        }
      }
      
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const orderNumStr = order.orderNumber.toString();
        
        // Match order number (full or partial - last 3-4 digits)
        const matchesOrderNumber = orderNumStr.includes(query) || 
          orderNumStr.endsWith(query);
        
        // Match customer/guest name (partial)
        const matchesCustomerName = order.customerName.toLowerCase().includes(query);
        
        // Match platform/order source
        const matchesPlatform = order.platform.toLowerCase().includes(query);
        
        if (!matchesOrderNumber && !matchesCustomerName && !matchesPlatform) {
          return false;
        }
      }
      return true;
    });
  }, [orders, searchQuery, activeMode]);

  // Sort function for orders
  const sortOrders = useCallback((orders: OnlineOrder[], sortBy: 'time' | 'order' | 'total') => {
    return [...orders].sort((a, b) => {
      switch (sortBy) {
        case 'time':
          // Sort by ordered time (earliest first)
          return a.orderedAt.localeCompare(b.orderedAt);
        case 'order':
          // Sort by order number (lowest first)
          return a.orderNumber - b.orderNumber;
        case 'total':
          // Sort by total amount (highest first)
          return b.total - a.total;
        default:
          return 0;
      }
    });
  }, []);

  // Day parts configuration state (can be updated by restaurant admins)
  const [dayParts] = useState<DayPart[]>(defaultDayParts);

  // Group orders by status (for SCHEDULED mode, use day-part categorization)
  // CRITICAL: Scheduled orders that are still waiting must NOT appear in operational columns
  const ordersByStatus = useMemo(() => {
    const grouped: Record<string, OnlineOrder[]> = {};
    filteredOrders.forEach(order => {
      // For SCHEDULED mode, group by day-part (Breakfast, Brunch, Lunch, etc.)
      if (activeMode === 'SCHEDULED') {
        const dayPartId = getScheduledDayPart(order, dayParts);
        if (!grouped[dayPartId]) {
          grouped[dayPartId] = [];
        }
        grouped[dayPartId].push(order);
      } else {
        // For ONLINE and DINE IN modes:
        // If order is scheduled AND still waiting, put in 'SCHEDULED' bucket (won't show in regular columns)
        // This prevents scheduled orders from appearing in NEW/PREPARING/READY columns prematurely
        if (order.isScheduled && order.isWaiting) {
          // Skip adding to operational columns - these orders should only show in the scheduled display area
          // They'll be visible via the special "Scheduled" indicator on their cards
          const statusKey = 'SCHEDULED_WAITING';
          if (!grouped[statusKey]) {
            grouped[statusKey] = [];
          }
          grouped[statusKey].push(order);
        } else {
          // Regular orders OR scheduled orders whose time has arrived
          const statusKey = order.status;
          if (!grouped[statusKey]) {
            grouped[statusKey] = [];
          }
          grouped[statusKey].push(order);
        }
      }
    });
    
    // Apply sorting per column - for scheduled mode, default sort by scheduled time within day-part
    Object.keys(grouped).forEach(status => {
      const sortOption = columnSortOptions[status];
      if (sortOption) {
        grouped[status] = sortOrders(grouped[status], sortOption);
      } else if (activeMode === 'SCHEDULED') {
        // Default: sort scheduled orders by scheduled time (soonest first within day-part)
        grouped[status] = [...grouped[status]].sort((a, b) => {
          const aTime = a.scheduledFor ? parseScheduledTime(a.scheduledFor).getTime() : Infinity;
          const bTime = b.scheduledFor ? parseScheduledTime(b.scheduledFor).getTime() : Infinity;
          return aTime - bTime;
        });
      }
    });
    
    return grouped;
  }, [filteredOrders, columnSortOptions, sortOrders, activeMode, dayParts]);

  // Dynamic scheduled columns based on day parts with orders
  const activeScheduledColumns = useMemo(() => {
    const scheduledOrders = filteredOrders.filter(o => o.isScheduled && o.isWaiting);
    const activeParts = getActiveDayParts(scheduledOrders, dayParts);
    return activeParts.map(dp => ({
      id: dp.id,
      label: dp.label,
      emptyText: dp.emptyText,
      emptyIcon: dp.icon,
      dayPart: dp
    }));
  }, [filteredOrders, dayParts]);

  // Get columns based on mode - use dynamic day-part columns for SCHEDULED mode
  const columns = activeMode === 'ONLINE' ? onlineColumns : activeMode === 'SCHEDULED' ? activeScheduledColumns : dineInColumns;

  // Count orders per mode
  // - DINE IN: all dine-in orders EXCEPT scheduled orders that are still waiting
  // - ONLINE: all online orders (delivery/pickup) EXCEPT scheduled orders that are still waiting
  // - SCHEDULED: only scheduled orders that are still waiting
  const dineInCount = orders.filter(o => o.orderType === 'DINE IN' && !(o.isScheduled && o.isWaiting)).length;
  const onlineCount = orders.filter(o => o.orderType !== 'DINE IN' && !(o.isScheduled && o.isWaiting)).length;
  const scheduledCount = orders.filter(o => o.isScheduled && o.isWaiting).length;

  // Mode chip navigation for mobile
  const modeOptions: Array<{ id: 'DINE IN' | 'ONLINE' | 'SCHEDULED'; label: string; count: number }> = [
    { id: 'DINE IN', label: 'DINE IN', count: dineInCount },
    { id: 'ONLINE', label: 'ONLINE', count: onlineCount },
    { id: 'SCHEDULED', label: 'SCHEDULED', count: scheduledCount },
  ];

  const handleMobileChipNav = (direction: 'up' | 'down') => {
    if (direction === 'up') {
      const newIndex = mobileChipIndex === 0 ? modeOptions.length - 1 : mobileChipIndex - 1;
      setMobileChipIndex(newIndex);
      setActiveMode(modeOptions[newIndex].id);
    } else {
      const newIndex = mobileChipIndex === modeOptions.length - 1 ? 0 : mobileChipIndex + 1;
      setMobileChipIndex(newIndex);
      setActiveMode(modeOptions[newIndex].id);
    }
  };

  // Memoize platform icons per order to prevent flickering during re-renders
  // Only recalculate when order IDs or platforms change (not on countdown updates)
  // For Dine In mode, always show OrderOS logo
  const platformIconsMap = useMemo(() => {
    const map = new Map<string, string>();
    orders.forEach(order => {
      // For Dine In orders, always use OrderOS logo
      if (order.orderType === 'DINE IN') {
        map.set(order.id, orderOsLogo);
      } else {
        map.set(order.id, getPlatformIcon(order.platform, order.id));
      }
    });
    return map;
  }, [orders.map(o => `${o.id}-${o.platform}-${o.orderType}`).join(',')]);

  // Drag and drop state
  const [activeId, setActiveId] = useState<string | null>(null);
  const activeOrder = useMemo(() => orders.find(o => o.id === activeId), [orders, activeId]);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  // Get status label for toast
  const getStatusToastMessage = (status: OnlineOrder['status']) => {
    switch (status) {
      case 'NEW': return 'Moved to New Orders';
      case 'PREPARING': return 'Order Now Preparing';
      case 'READY': return 'Order Ready';
      case 'OUT_FOR_DELIVERY': return 'Order Out for Delivery';
      case 'COMPLETED': return 'Order Completed';
      case 'CANCELLED': return 'Order Cancelled';
    }
  };

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const newStatus = over.id as OnlineOrder['status'];
      const orderId = active.id as string;
      const order = orders.find(o => o.id === orderId);
      
      if (order && order.status !== newStatus) {
        updateOrderStatus(orderId, newStatus, getStatusToastMessage(newStatus));
      }
    }
  };

  // Toggle expanded card
  const toggleCardExpand = (orderId: string) => {
    setExpandedCards(prev => {
      const next = new Set(prev);
      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
      }
      return next;
    });
  };

  // Draggable Order Card Component
  const DraggableOrderCard = ({ order, isExpanded, onToggleExpand }: { order: OnlineOrder; isExpanded: boolean; onToggleExpand: () => void }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
      id: order.id,
    });

    const style = transform ? {
      transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    } : undefined;

    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`${isDragging ? 'opacity-50 z-50' : ''}`}
      >
        <OrderCard 
          order={order} 
          isExpanded={isExpanded} 
          onToggleExpand={onToggleExpand}
          dragHandleProps={{ ...attributes, ...listeners }}
        />
      </div>
    );
  };

  // Order Card Component
  const OrderCard = ({ order, isExpanded, onToggleExpand, dragHandleProps }: { 
    order: OnlineOrder; 
    isExpanded: boolean; 
    onToggleExpand: () => void;
    dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
  }) => {
    const isSelected = selectedOrder?.id === order.id;
    const orderReports = reportedItems.get(order.id) || [];
    const onHoldReport = orderReports.find(report => report.reportedAt);
    const isOnHold = !!onHoldReport;
    const extendedWaitTimestamp = extendedWaitOrders.get(order.id);
    const isExtendedWait = !!extendedWaitTimestamp;
    
    // Calculate countdown for on hold orders (10 minute timeout, or 5 min extension)
    const [holdCountdown, setHoldCountdown] = useState<string>('');
    const [hasExpired, setHasExpired] = useState(false);
    
    useEffect(() => {
      if (!isOnHold || !onHoldReport?.reportedAt) return;
      
      const BASE_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes
      const EXTENSION_MS = 5 * 60 * 1000; // 5 minutes extension
      
      const updateCountdown = () => {
        const now = Date.now();
        
        // If in extended wait mode, calculate from extension timestamp
        if (isExtendedWait && extendedWaitTimestamp) {
          const extensionElapsed = now - extendedWaitTimestamp;
          const extensionRemaining = EXTENSION_MS - extensionElapsed;
          
          if (extensionRemaining <= 0) {
            setHoldCountdown('Expired');
            setHasExpired(true);
            
            // Auto-remove items after extended wait expires
            if (!notifiedTimeoutsRef.current.has(`${order.id}_extended`)) {
              notifiedTimeoutsRef.current.add(`${order.id}_extended`);
              // Auto-remove the reported items
              handleRemoveReportedItems(order.id);
            }
            return;
          }
          
          const mins = Math.floor(extensionRemaining / 60000);
          const secs = Math.floor((extensionRemaining % 60000) / 1000);
          setHoldCountdown(`${mins}:${secs.toString().padStart(2, '0')}`);
          setHasExpired(false);
          return;
        }
        
        // Normal 10-minute countdown
        const elapsed = now - onHoldReport.reportedAt!;
        const remaining = BASE_TIMEOUT_MS - elapsed;
        
        if (remaining <= 0) {
          setHoldCountdown('Expired');
          setHasExpired(true);
          
          // Show toast notification when timer expires (only once per order)
          if (!notifiedTimeoutsRef.current.has(order.id)) {
            notifiedTimeoutsRef.current.add(order.id);
            const itemNames = orderReports.map(r => r.itemName).join(', ');
            toast({
              title: `Order #${order.orderNumber}`,
              description: `${itemNames} — 10 minutes reached. No response received.`,
              duration: 60000, // Keep visible for 60 seconds
              action: (
                <div className="flex flex-col gap-2 mt-2">
                  <button
                    onClick={() => handleRemoveReportedItems(order.id)}
                    className="px-3 py-1.5 bg-red-500 text-white text-xs font-bold rounded-lg hover:bg-red-600 transition-colors"
                  >
                    Remove Item
                  </button>
                  <button
                    onClick={() => handleExtendWaitTime(order.id)}
                    className="px-3 py-1.5 bg-amber-500 text-black text-xs font-bold rounded-lg hover:bg-amber-600 transition-colors"
                  >
                    Wait 5 More Minutes
                  </button>
                </div>
              ),
            });
          }
          return;
        }
        
        setHasExpired(false);
        const mins = Math.floor(remaining / 60000);
        const secs = Math.floor((remaining % 60000) / 1000);
        setHoldCountdown(`${mins}:${secs.toString().padStart(2, '0')}`);
      };
      
      updateCountdown();
      const interval = setInterval(updateCountdown, 1000);
      return () => clearInterval(interval);
    }, [isOnHold, onHoldReport?.reportedAt, isExtendedWait, extendedWaitTimestamp, order.id, order.orderNumber, orderReports]);
    
    const getItemReport = (itemIndex: number) => {
      return orderReports.find(r => r.itemIndex === itemIndex);
    };
    
    const handleCardAction = (e: React.MouseEvent, action: () => void) => {
      e.stopPropagation();
      action();
    };
    
    const isAccepting = order.id === acceptedOrderId;
    const isCancelling = order.id === cancelledOrderId;
    
    return (
      <div 
        onClick={() => setSelectedOrder(order)}
        className={`rounded-xl border cursor-pointer transition-all overflow-hidden bg-surface-elevated ${isSelected ? "border-primary" : "border-border hover:border-muted-foreground/40"} ${isAccepting ? "animate-accept-order" : ""} ${isCancelling ? "animate-cancel-order" : ""}`}
      >
        {/* On Hold Banner - Full width light yellow bar at top */}
        {isOnHold && (
          <div className={`flex items-center justify-between px-3 py-2 bg-amber-500/20 ${holdCountdown === 'Expired' ? 'animate-pulse' : ''}`}>
            <div className="flex items-center gap-1.5">
              <span className="text-amber-500 text-xs font-bold uppercase">On Hold</span>
              <Popover>
                <PopoverTrigger asChild>
                  <button 
                    className="p-0.5 hover:bg-amber-500/20 rounded-full transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Info className="w-3.5 h-3.5 text-amber-500" />
                  </button>
                </PopoverTrigger>
                <PopoverContent 
                  side="bottom" 
                  className="w-auto px-3 py-2 bg-surface border-border text-amber-500 text-xs font-medium"
                  onClick={(e) => e.stopPropagation()}
                >
                  Awaiting Customer Response
                </PopoverContent>
              </Popover>
            </div>
            {holdCountdown && (
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span className={`text-sm font-bold ${holdCountdown === 'Expired' ? 'text-red-500' : 'text-amber-500'}`}>
                  {holdCountdown}
                </span>
              </div>
            )}
          </div>
        )}
        
        {/* Card Header with Drag Handle */}
        <div className="p-3">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-start gap-2">
              {dragHandleProps && (
                <div 
                  {...dragHandleProps}
                  className="cursor-grab active:cursor-grabbing p-1 -ml-1 hover:bg-white/10 rounded transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <GripVertical className="w-4 h-4 text-muted-foreground" />
                </div>
              )}
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className={`text-xs font-bold uppercase ${getOrderTypeColor(order.orderType)}`}>
                    {order.orderType}{order.orderType === 'DINE IN' && order.tableNumber && ` • ${order.tableNumber}`}
                  </span>
                </div>
                <span className="text-muted-foreground text-xs">{order.itemCount} items</span>
              </div>
            </div>
            <span className="text-2xl font-bold text-foreground">#{searchQuery ? highlightMatch(order.orderNumber.toString()) : order.orderNumber}</span>
          </div>
          
          <div className="flex items-center justify-between mb-2">
            <span className="text-foreground font-medium">{searchQuery ? highlightMatch(order.customerName) : order.customerName}</span>
            <div className="flex items-center gap-2">
              {searchQuery && order.platform.toLowerCase().includes(searchQuery.toLowerCase()) && (
                <span className="bg-[#FFD60A]/40 text-[#FFD60A] text-xs rounded px-1.5 py-0.5 font-medium capitalize">{order.platform}</span>
              )}
              <img src={platformIconsMap.get(order.id) || getPlatformIcon(order.platform, order.id)} alt={order.platform} className="w-20 h-5 object-contain" />
            </div>
          </div>
          
          {/* Scheduled Time Banner - Prominent display for scheduled orders */}
          {order.isScheduled && order.scheduledFor && (
            <div className="flex items-center gap-2 bg-[#E91E8C]/20 border border-[#E91E8C]/40 rounded-lg px-3 py-2 mb-3">
              <CalendarDays className="w-4 h-4 text-[#E91E8C]" />
              <span className="text-[#E91E8C] text-sm font-medium">Scheduled</span>
              <span className="text-[#E91E8C] text-sm font-bold">{order.scheduledFor}</span>
            </div>
          )}
          
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
            <span>Ordered at {order.orderedAt}</span>
            {/* For scheduled orders waiting, hide delivery/ready time until window starts */}
            {!(order.isScheduled && order.isWaiting) && (
              <>
                <span>|</span>
                {order.orderType === 'DELIVERY' && order.deliverBy ? (
                  <span className="text-[#FF6B6B]">Deliver by {order.deliverBy}</span>
                ) : (
                  <span>Est. Ready {order.estimateReady}</span>
                )}
              </>
            )}
          </div>
          
          {/* Status Bar - For scheduled waiting orders, always show NEW ORDER */}
          <div className={`${order.isScheduled && order.isWaiting ? getStatusColor('NEW') : getStatusColor(order.status)} rounded-lg px-3 py-2 flex items-center justify-between`}>
            <span className="text-white text-xs font-bold">
              {order.isScheduled && order.isWaiting ? 'NEW ORDER' : getStatusLabel(order.status)}
            </span>
            {order.status !== 'COMPLETED' && order.status !== 'CANCELLED' && (
              <div className={`flex items-center gap-1 ${order.isOverdue ? 'animate-pulse' : ''}`}>
                {order.isScheduled && order.isWaiting ? (
                  <CalendarDays className="w-3 h-3 text-white" />
                ) : (
                  <Clock className="w-3 h-3 text-white" />
                )}
                <span 
                  data-countdown-id={order.id}
                  className="text-xs font-bold text-white"
                >
                  {order.isOverdue 
                    ? `OVERDUE ${order.countdown}` 
                    : order.isScheduled && order.isWaiting 
                      ? `STARTS IN ${order.countdown}` 
                      : order.countdown}
                </span>
              </div>
            )}
          </div>
          
          {/* CTA Buttons - For scheduled waiting orders, always show Cancel/Accept regardless of internal status */}
          {!isExpanded && order.isScheduled && order.isWaiting && (
            <div className="flex items-center gap-2 mt-3">
              <button 
                onClick={(e) => handleCardAction(e, () => openCancelDialog(order))}
                className="flex-1 py-2 rounded-full text-[#FF6B6B] text-sm font-bold border border-[#FF6B6B] hover:bg-[#FF6B6B]/10 transition-colors"
              >
                Cancel Order
              </button>
              <button 
                onClick={(e) => handleCardAction(e, () => handleAcceptOrder(order.id))}
                className="flex-1 py-2 rounded-full text-black text-sm font-bold transition-all hover:scale-[1.02]" 
                style={{ background: "linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)" }}
              >
                Accept Order
              </button>
            </div>
          )}
          {/* Regular order CTA buttons - only show when NOT a scheduled waiting order */}
          {!isExpanded && !(order.isScheduled && order.isWaiting) && order.status === 'NEW' && (
            <div className="flex items-center gap-2 mt-3">
              <button 
                onClick={(e) => handleCardAction(e, () => openCancelDialog(order))}
                className="flex-1 py-2 rounded-full text-[#FF6B6B] text-sm font-bold border border-[#FF6B6B] hover:bg-[#FF6B6B]/10 transition-colors"
              >
                Cancel Order
              </button>
              <button 
                onClick={(e) => handleCardAction(e, () => handleAcceptOrder(order.id))}
                className="flex-1 py-2 rounded-full text-black text-sm font-bold transition-all hover:scale-[1.02]" 
                style={{ background: "linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)" }}
              >
                Accept Order
              </button>
            </div>
          )}
          {!isExpanded && !(order.isScheduled && order.isWaiting) && order.status === 'PREPARING' && (
            <div className="flex items-center gap-2 mt-3">
              <button 
                onClick={(e) => handleCardAction(e, () => handleMakeReady(order.id))}
                className="flex-1 py-2 rounded-full text-black text-sm font-bold transition-all hover:scale-[1.02]" 
                style={{ background: "linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)" }}
              >
                Make Ready
              </button>
            </div>
          )}
          {!isExpanded && !(order.isScheduled && order.isWaiting) && order.status === 'READY' && (
            <div className="flex items-center gap-2 mt-3">
              <button 
                onClick={(e) => handleCardAction(e, () => handleReadyForPickup(order.id, order.orderType))}
                className="flex-1 py-2 rounded-full text-black text-sm font-bold transition-all hover:scale-[1.02]" 
                style={{ background: "linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)" }}
              >
                {order.orderType === 'DINE IN' ? 'Completed' : 'Dispatch'}
              </button>
            </div>
          )}
          {!isExpanded && !(order.isScheduled && order.isWaiting) && order.status === 'OUT_FOR_DELIVERY' && (
            <div className="flex items-center gap-2 mt-3">
              <button 
                onClick={(e) => handleCardAction(e, () => handleMarkDelivered(order.id))}
                className="flex-1 py-2 rounded-full text-black text-sm font-bold transition-all hover:scale-[1.02]" 
                style={{ background: "linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)" }}
              >
                Delivered
              </button>
            </div>
          )}
        </div>
        
        {/* Expanded Content */}
        {isExpanded && (
          <div className="px-3 pb-3 border-t border-border pt-3">
            {/* Order Items */}
            <div className="space-y-2 mb-3">
              {order.items.map((item, idx) => {
                const itemReport = getItemReport(idx);
                const isReported = !!itemReport;
                
                return (
                  <div key={idx} className={isReported ? 'eighty-six-row -mx-1' : ''}>
                    <div className={`flex items-start justify-between text-sm ${isReported ? 'py-1' : ''}`}>
                      <div className="flex items-start gap-2">
                        <span className={`w-5 h-5 rounded flex items-center justify-center text-xs font-bold flex-shrink-0 ${isReported ? 'eighty-six-icon' : 'bg-white text-black'}`}>
                          {isReported ? <X size={12} strokeWidth={3} className="text-white" /> : item.qty}
                        </span>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={isReported ? 'eighty-six-text' : 'text-foreground'}>{item.name}</span>
                            {isReported && (
                              <span className="eighty-six-badge eighty-six-badge-sm">
                                <X size={8} strokeWidth={3} />
                                {itemReport.reasonLabel}
                              </span>
                            )}
                          </div>
                          {/* Rich Modifiers with tree connector */}
                          {!isReported && item.richModifiers && item.richModifiers.length > 0 ? (
                            <div className="mt-1 ml-1">
                              {item.richModifiers.map((mod, i) => {
                                let prefix = '•';
                                if (mod.type === 'remove') prefix = '-';
                                else if (mod.type === 'add') prefix = '+';
                                const isRemove = mod.type === 'remove';
                                
                                return (
                                  <div key={i} className="flex items-center text-xs h-5">
                                    <div className="relative w-4 h-full flex-shrink-0">
                                      <div 
                                        className="absolute left-0 w-px bg-white/30"
                                        style={{ 
                                          top: i === 0 ? '0' : '-2px',
                                          height: i === item.richModifiers!.length - 1 ? '50%' : 'calc(100% + 2px)'
                                        }}
                                      />
                                      <div className="absolute left-0 top-1/2 w-2.5 h-px bg-white/30" />
                                    </div>
                                    <div className="flex items-center flex-1 min-w-0">
                                       <span className={`mr-1.5 w-2 text-center flex-shrink-0 ${isRemove ? 'text-[#FF6B6B]' : 'text-muted-foreground'}`}>
                                         {prefix}
                                       </span>
                                       <span className={`truncate ${isRemove ? 'text-[#FF6B6B]' : 'text-muted-foreground'}`}>
                                        {mod.text}
                                      </span>
                                      {mod.price && mod.price > 0 && (
                                         <span className="ml-auto pl-2 text-muted-foreground flex-shrink-0">{formatPrice(mod.price)}</span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : item.modifiers.length > 0 && !isReported && (
                            <SimpleModifierTree modifiers={item.modifiers} size="sm" />
                          )}
                          {/* Item Notes */}
                          {item.notes && !isReported && (
                            <div className="mt-1 flex items-start gap-1.5">
                              <div className="relative w-4 h-4 flex-shrink-0">
                                <div className="absolute left-0 w-px bg-white/30 h-2" />
                                <div className="absolute left-0 top-2 w-2.5 h-px bg-white/30" />
                              </div>
                              <span className="text-[#FFD60A] text-xs italic leading-tight">"{item.notes}"</span>
                            </div>
                          )}
                        </div>
                      </div>
                       <span className={isReported ? 'eighty-six-text' : 'text-foreground'}>
                        {formatPrice(item.price * item.qty)}
                      </span>
                    </div>
                    
                    {/* On Hold indicator for reported items */}
                    {isReported && (
                      <div className="flex items-center gap-2 text-sm mt-1 ml-7 pl-2 border-l-2 border-amber-500/30">
                        <span className="text-amber-400 text-xs">On Hold – Awaiting aggregator response</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            {/* Order Notes */}
            {order.orderNotes && (
              <div className="mb-3 p-2 bg-[#FFD60A]/10 border border-[#FFD60A]/30 rounded-lg">
                <span className="text-[#FFD60A] text-xs font-medium">Order Notes: </span>
                <span className="text-[#FFD60A] text-xs italic">"{order.orderNotes}"</span>
              </div>
            )}
            
            {/* Payment Summary - Horizontal inline format with grid alignment */}
             <div className="border-t border-border pt-2 text-xs">
               <div className="grid grid-cols-3 gap-y-1">
                 {/* Row 1: Sub, Del, Tax */}
                 <span className="text-muted-foreground">Sub <span className="text-foreground">{formatPrice(order.subtotal)}</span></span>
                 <span className="text-muted-foreground">{order.deliveryFee > 0 ? <>Del <span className="text-foreground">{formatPrice(order.deliveryFee)}</span></> : ''}</span>
                 <span className="text-muted-foreground">Tax <span className="text-foreground">{formatPrice(order.tax)}</span></span>
                {/* Row 2: Tip, Discount */}
                 <span className="text-muted-foreground">Tip <span className="text-foreground">{formatPrice(order.tip)}</span></span>
                 {order.discount > 0 ? (
                   <span className="text-muted-foreground">Disc <span className="text-[#FF6B6B]">-{formatPrice(order.discount)}</span></span>
                 ) : <span></span>}
               </div>
               <div className="flex justify-between text-foreground font-bold pt-2 mt-2 border-t border-border">
                 <span>Total</span>
                 <span>{formatPrice(order.total)}</span>
               </div>
            </div>
            
            {/* Print Buttons Row */}
            <div className="flex items-center gap-2 mt-3">
              <button 
                onClick={(e) => handleCardAction(e, () => toast({ title: `Receipt printed for Order #${order.orderNumber}` }))}
                 className="flex-1 py-2 rounded-full text-muted-foreground text-sm font-medium border border-border hover:bg-muted transition-colors flex items-center justify-center gap-2"
               >
                 <Printer className="w-4 h-4" />
                 Receipt
               </button>
               <button 
                 onClick={(e) => handleCardAction(e, () => toast({ title: `KOT printed for Order #${order.orderNumber}` }))}
                 className="flex-1 py-2 rounded-full text-muted-foreground text-sm font-medium border border-border hover:bg-muted transition-colors flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" />
                KOT
              </button>
            </div>
            
            {/* CTA Buttons - Show below Total when expanded */}
            {order.status === 'NEW' && (
              <div className="flex items-center gap-2 mt-3">
                <button 
                  onClick={(e) => handleCardAction(e, () => openCancelDialog(order))}
                  className="flex-1 py-2 rounded-full text-[#FF6B6B] text-sm font-bold border border-[#FF6B6B] hover:bg-[#FF6B6B]/10 transition-colors"
                >
                  Cancel Order
                </button>
                <button 
                  onClick={(e) => handleCardAction(e, () => handleAcceptOrder(order.id))}
                  className="flex-1 py-2 rounded-full text-black text-sm font-bold transition-all hover:scale-[1.02]" 
                  style={{ background: "linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)" }}
                >
                  Accept Order
                </button>
              </div>
            )}
            {order.status === 'PREPARING' && (
              <div className="flex items-center gap-2 mt-3">
                <button 
                  onClick={(e) => handleCardAction(e, () => handleMakeReady(order.id))}
                  className="flex-1 py-2 rounded-full text-black text-sm font-bold transition-all hover:scale-[1.02]" 
                  style={{ background: "linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)" }}
                >
                  Make Ready
                </button>
              </div>
            )}
            {order.status === 'READY' && (
              <div className="flex items-center gap-2 mt-3">
                <button 
                  onClick={(e) => handleCardAction(e, () => handleReadyForPickup(order.id, order.orderType))}
                  className="flex-1 py-2 rounded-full text-black text-sm font-bold transition-all hover:scale-[1.02]" 
                  style={{ background: "linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)" }}
                >
                  {order.orderType === 'DINE IN' ? 'Completed' : 'Dispatch'}
                </button>
              </div>
            )}
            {order.status === 'OUT_FOR_DELIVERY' && (
              <div className="flex items-center gap-2 mt-3">
                <button 
                  onClick={(e) => handleCardAction(e, () => handleMarkDelivered(order.id))}
                  className="flex-1 py-2 rounded-full text-black text-sm font-bold transition-all hover:scale-[1.02]" 
                  style={{ background: "linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)" }}
                >
                  Mark Delivered
                </button>
              </div>
            )}
          </div>
        )}
        
        {/* Expand/Collapse Toggle */}
        <button 
          onClick={(e) => { e.stopPropagation(); onToggleExpand(); }}
           className="w-full py-1.5 flex items-center justify-center hover:bg-muted transition-colors border-t border-border"
         >
           {isExpanded ? (
             <ChevronUp className="w-4 h-4 text-muted-foreground" />
           ) : (
             <ChevronDown className="w-4 h-4 text-muted-foreground" />
           )}
        </button>
      </div>
    );
  };

  // Stable refs for scroll containers to preserve scroll positions
  const columnScrollRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const mobileScrollRef = useRef<HTMLDivElement | null>(null);
  
  // Droppable Kanban Column Component - uses stable ref to preserve scroll
  const KanbanColumn = useCallback(({ column }: { column: { id: string; label: string; emptyText: string; emptyIcon: string; description?: string; dayPart?: DayPart } }) => {
    const columnOrders = ordersByStatus[column.id] || [];
    const { isOver, setNodeRef } = useDroppable({
      id: column.id,
    });
    
    // Day-part based header styles for scheduled columns
    const getDayPartHeaderStyles = (columnId: string, dayPart?: DayPart) => {
      if (!dayPart) return null;
      
      const isCurrent = isCurrentService(dayPart);
      const isNext = isNextService(dayPart, dayParts);
      const hasOrders = columnOrders.length > 0;
      
      // Color palette for day parts - warm tones indicating time of day
      const dayPartColors: Record<string, { primary: string; secondary: string; rgba: string }> = {
        'BREAKFAST': { primary: '#FFB347', secondary: '#FF8C42', rgba: '255, 179, 71' }, // Warm orange - morning sun
        'BRUNCH': { primary: '#FFCC80', secondary: '#FFB347', rgba: '255, 204, 128' }, // Light orange - mid-morning
        'LUNCH': { primary: '#FFD54F', secondary: '#FFAB40', rgba: '255, 213, 79' }, // Golden yellow - midday
        'EVENING_SNACKS': { primary: '#FFAB91', secondary: '#FF8A65', rgba: '255, 171, 145' }, // Coral - evening glow
        'DINNER': { primary: '#FF8A80', secondary: '#FF5252', rgba: '255, 138, 128' }, // Warm red - dinner time
        'LATE_NIGHT': { primary: '#CE93D8', secondary: '#AB47BC', rgba: '206, 147, 216' }, // Purple - night
      };
      
      const colors = dayPartColors[columnId] || { primary: '#FFFFFF', secondary: '#E0E0E0', rgba: '255, 255, 255' };
      
      // Current service gets a pulsing highlight effect
      if (isCurrent && hasOrders) {
        return {
          background: `linear-gradient(135deg, rgba(${colors.rgba}, 0.5) 0%, rgba(${colors.rgba}, 0.3) 100%)`,
          border: `2px solid ${colors.primary}`,
          textColor: colors.primary,
          countBg: `bg-[${colors.primary}]`,
          countText: 'text-black',
          isPulsing: true,
          isCurrent: true,
          isNext: false,
          colors
        };
      }
      
      // Current service without orders - subtle highlight
      if (isCurrent) {
        return {
          background: `linear-gradient(135deg, rgba(${colors.rgba}, 0.25) 0%, rgba(${colors.rgba}, 0.15) 100%)`,
          border: `1px solid rgba(${colors.rgba}, 0.5)`,
          textColor: colors.primary,
          countBg: `bg-[${colors.primary}]/50`,
          countText: 'text-white',
          isPulsing: false,
          isCurrent: true,
          isNext: false,
          colors
        };
      }
      
      // Next service with orders - moderate highlight
      if (isNext && hasOrders) {
        return {
          background: `linear-gradient(135deg, rgba(${colors.rgba}, 0.3) 0%, rgba(${colors.rgba}, 0.15) 100%)`,
          border: `1px solid rgba(${colors.rgba}, 0.4)`,
          textColor: colors.primary,
          countBg: `bg-[${colors.primary}]/80`,
          countText: 'text-black',
          isPulsing: false,
          isCurrent: false,
          isNext: true,
          colors
        };
      }
      
      // Next service without orders
      if (isNext) {
        return {
          background: `rgba(${colors.rgba}, 0.15)`,
          border: `1px solid rgba(${colors.rgba}, 0.3)`,
          textColor: colors.primary,
          countBg: 'bg-white/20',
          countText: 'text-white',
          isPulsing: false,
          isCurrent: false,
          isNext: true,
          colors
        };
      }
      
      // Default: visible but subtle styling
      return {
        background: `rgba(${colors.rgba}, 0.12)`,
        border: `1px solid rgba(${colors.rgba}, 0.25)`,
        textColor: `rgba(${colors.rgba.split(',').map((v, i) => i < 3 ? v : '0.7').join(',')})`,
        countBg: 'bg-white/20',
        countText: 'text-white',
        isPulsing: false,
        isCurrent: false,
        isNext: false,
        colors
      };
    };
    
    const headerStyles = activeMode === 'SCHEDULED' ? getDayPartHeaderStyles(column.id, column.dayPart) : null;
    // Check if current service has orders (for pulsing animation)
    const shouldPulse = headerStyles?.isPulsing;
    
    // Enhanced header styling for scheduled mode - better kitchen visibility
    const isScheduledMode = activeMode === 'SCHEDULED';
    const hasOrdersInColumn = columnOrders.length > 0;
    
    return (
      <div 
        ref={setNodeRef}
        className={`flex-1 min-w-[280px] flex flex-col transition-all ${isOver ? 'bg-white/5 rounded-xl' : ''}`}
      >
        {/* Column Header - Enhanced for kitchen visibility */}
        <div 
          className={`flex items-center justify-between px-4 py-3 mb-3 rounded-xl mx-1 ${shouldPulse ? 'animate-pulse' : ''} ${isScheduledMode ? 'shadow-lg' : ''}`}
          style={headerStyles ? { 
            background: headerStyles.background, 
            border: headerStyles.border,
            boxShadow: headerStyles.isCurrent ? `0 4px 20px ${headerStyles.colors?.primary || '#FFB347'}40` : 
                       headerStyles.isNext ? `0 2px 12px ${headerStyles.colors?.primary || '#FFB347'}20` : 'none'
          } : {}}
        >
          <div className="flex items-center gap-3">
            {/* Day-part icon - Larger for visibility */}
            {column.emptyIcon && isScheduledMode && (
              <span className="text-2xl flex-shrink-0">{column.emptyIcon}</span>
            )}
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2.5">
                {/* Time-slot label - Larger, bolder typography */}
                <span 
                  className={`font-bold tracking-tight ${isScheduledMode ? 'text-base' : 'text-sm font-semibold'}`}
                  style={headerStyles ? { color: headerStyles.textColor } : { color: 'white' }}
                >
                  {column.label}
                </span>
                {/* NOW Badge - Current Service Indicator - More prominent */}
                {headerStyles?.isCurrent && (
                  <span 
                    className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1"
                    style={{ 
                      background: `linear-gradient(135deg, ${headerStyles.colors?.primary || '#FFB347'} 0%, ${headerStyles.colors?.secondary || '#FF8C42'} 100%)`,
                      color: '#000',
                      boxShadow: `0 0 16px ${headerStyles.colors?.primary || '#FFB347'}90, inset 0 1px 0 rgba(255,255,255,0.3)`
                    }}
                  >
                    <Timer className="w-3 h-3" />
                    Now
                  </span>
                )}
                {/* UP NEXT Badge - Next Service Indicator - Clearly secondary but visible */}
                {headerStyles?.isNext && (
                  <span 
                    className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border-2"
                    style={{ 
                      borderColor: headerStyles.colors?.primary || '#FFB347',
                      color: headerStyles.colors?.primary || '#FFB347',
                      background: 'rgba(0,0,0,0.4)',
                      boxShadow: `0 0 8px ${headerStyles.colors?.primary || '#FFB347'}30`
                    }}
                  >
                    Up Next
                  </span>
                )}
              </div>
              {/* Time range display - Improved contrast */}
              {column.dayPart && isScheduledMode && (
                <span 
                  className="text-xs font-medium"
                  style={{ 
                    color: headerStyles?.isCurrent ? 'rgba(255,255,255,0.8)' : 
                           headerStyles?.isNext ? 'rgba(255,255,255,0.6)' : 
                           'rgba(255,255,255,0.45)'
                  }}
                >
                  {`${column.dayPart.startHour.toString().padStart(2, '0')}:${column.dayPart.startMinute.toString().padStart(2, '0')} – ${column.dayPart.endHour.toString().padStart(2, '0')}:${column.dayPart.endMinute.toString().padStart(2, '0')}`}
                </span>
              )}
              {column.description && !column.dayPart && (
                <span className="text-white/40 text-[10px]">{column.description}</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Order count badge - Larger, more prominent */}
            <span 
              className={`min-w-[28px] h-7 flex items-center justify-center rounded-lg text-sm font-bold ${headerStyles ? '' : 'bg-white/20 text-white'}`}
              style={headerStyles ? {
                background: headerStyles.isCurrent ? headerStyles.colors?.primary : 
                           headerStyles.isNext ? `${headerStyles.colors?.primary}60` : 
                           'rgba(255,255,255,0.15)',
                color: headerStyles.isCurrent ? '#000' : 
                       headerStyles.isNext ? headerStyles.colors?.primary : 
                       'rgba(255,255,255,0.7)',
                boxShadow: hasOrdersInColumn && headerStyles.isCurrent ? `0 2px 8px ${headerStyles.colors?.primary}50` : 'none'
              } : {}}
            >
              {columnOrders.length}
            </span>
            <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={`p-1.5 rounded-lg hover:bg-white/10 transition-colors ${columnSortOptions[column.id] ? 'bg-white/10' : ''}`}>
                <ArrowDownUp className={`w-4 h-4 ${columnSortOptions[column.id] ? 'text-white' : 'text-white/60'}`} />
              </button>
            </DropdownMenuTrigger>
             <DropdownMenuContent align="end" className="bg-surface-elevated border-border min-w-[140px] z-50">
               <DropdownMenuItem 
                 onClick={() => setColumnSortOptions(prev => ({ ...prev, [column.id]: 'time' }))}
                 className="text-foreground hover:bg-muted cursor-pointer flex items-center justify-between"
               >
                 <span>By Time</span>
                 {columnSortOptions[column.id] === 'time' && <Check className="w-4 h-4 text-foreground" />}
               </DropdownMenuItem>
               <DropdownMenuItem 
                 onClick={() => setColumnSortOptions(prev => ({ ...prev, [column.id]: 'order' }))}
                 className="text-foreground hover:bg-muted cursor-pointer flex items-center justify-between"
               >
                 <span>By Order #</span>
                 {columnSortOptions[column.id] === 'order' && <Check className="w-4 h-4 text-foreground" />}
               </DropdownMenuItem>
               <DropdownMenuItem 
                 onClick={() => setColumnSortOptions(prev => ({ ...prev, [column.id]: 'total' }))}
                 className="text-foreground hover:bg-muted cursor-pointer flex items-center justify-between"
               >
                 <span>By Total</span>
                 {columnSortOptions[column.id] === 'total' && <Check className="w-4 h-4 text-foreground" />}
               </DropdownMenuItem>
               {columnSortOptions[column.id] && (
                 <DropdownMenuItem 
                   onClick={() => setColumnSortOptions(prev => {
                     const next = { ...prev };
                     delete next[column.id];
                     return next;
                   })}
                   className="text-muted-foreground hover:bg-muted cursor-pointer border-t border-border mt-1 pt-1"
                 >
                   <span>Clear Sort</span>
                 </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          </div>
        </div>
        
        {/* Column Content - Using stable ref to preserve scroll position */}
        <div 
          ref={(el) => { columnScrollRefs.current[column.id] = el; }}
          className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-500 scrollbar-track-transparent"
        >
          <div className={`space-y-2 px-2 pb-4 min-h-[200px] ${isOver ? 'ring-2 ring-white/20 ring-inset rounded-lg' : ''}`}>
            {columnOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <span className="text-4xl mb-3">{column.emptyIcon}</span>
                <p className="text-muted-foreground text-sm">{column.emptyText}</p>
              </div>
            ) : (
              columnOrders.map(order => (
                <DraggableOrderCard 
                  key={order.id} 
                  order={order} 
                  isExpanded={expandedCards.has(order.id)}
                  onToggleExpand={() => toggleCardExpand(order.id)}
                />
              ))
            )}
          </div>
        </div>
      </div>
    );
  }, [ordersByStatus, columnSortOptions, expandedCards, toggleCardExpand, activeMode, dayParts]);

  // Order Detail Panel - uses ref to preserve scroll position
  const detailScrollRef = useRef<HTMLDivElement>(null);
  
  // Get live order data from orders array for countdown display
  const liveSelectedOrder = useMemo(() => {
    if (!selectedOrder) return null;
    return orders.find(o => o.id === selectedOrder.id) || selectedOrder;
  }, [orders, selectedOrder]);
  
  const OrderDetailPanel = () => {
    if (!selectedOrder || !liveSelectedOrder) return null;
    
    const orderReports = reportedItems.get(selectedOrder.id) || [];
    const getItemReport = (itemIndex: number) => orderReports.find(r => r.itemIndex === itemIndex);
    
    // Calculate adjusted total
    const adjustedTotal = orderReports.reduce((total, report) => total + report.priceImpact, selectedOrder.total);
    const hasAdjustments = orderReports.length > 0;
    
    return (
      <div className="flex flex-col h-full">
        {/* Panel Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
               <h2 className="text-foreground text-base font-bold">{selectedOrder.customerName}</h2>
               <div className="flex items-center gap-1 text-muted-foreground text-sm">
                <img src={phoneIcon} alt="Phone" className="w-3 h-3" />
                <span>{selectedOrder.phone}</span>
              </div>
            </div>
            <button 
              onClick={() => { setSelectedOrder(null); setReadyTimePickerOpen(false); }}
               className="p-2 rounded-full hover:bg-muted transition-colors"
             >
               <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
          
          {/* Info Boxes */}
          <div className="flex items-center gap-2">
             <div className="flex-1 p-2 bg-muted rounded-lg">
               <div className="text-muted-foreground text-xs">Order #</div>
               <div className="text-foreground font-bold">{selectedOrder.orderNumber}</div>
             </div>
             <div className="flex-1 p-2 bg-muted rounded-lg">
               <div className="text-muted-foreground text-xs">Items</div>
               <div className="text-foreground font-bold">{selectedOrder.itemCount}</div>
             </div>
             <button
               onClick={() => {
                 if (selectedOrder.status !== 'COMPLETED' && selectedOrder.status !== 'CANCELLED') {
                   setReadyTimePickerOpen(true);
                 }
               }}
               className={`flex-1 p-2 bg-muted rounded-lg text-left transition-colors ${selectedOrder.status !== 'COMPLETED' && selectedOrder.status !== 'CANCELLED' ? 'hover:bg-muted/80 cursor-pointer active:scale-[0.97]' : ''}`}
             >
                <div className="text-muted-foreground text-xs flex items-center gap-1">
                  {selectedOrder.status === 'NEW' ? 'Est. Ready By' : 'Ready At'}
                  {selectedOrder.status !== 'COMPLETED' && selectedOrder.status !== 'CANCELLED' && (
                    <Clock className="w-3 h-3 text-muted-foreground/60" />
                  )}
                </div>
                <div className={`font-bold ${selectedOrder.status === 'NEW' ? 'text-[#FF6B6B]' : 'text-foreground'}`}>
                  {selectedOrder.estimateReady}
                </div>
             </button>
          </div>
        </div>
        
        {/* Order Summary Label */}
         <div className="px-4 py-3 border-b border-border">
           <div className="flex items-center justify-between">
             <span className="text-muted-foreground text-xs uppercase tracking-wide">Order Summary</span>
             <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <input 
                type="checkbox" 
                checked={selectedOrder.addUtensils}
                className="rounded border-border"
                readOnly
              />
              Add utensils, straws, napkins, etc.
            </label>
          </div>
        </div>
        
        {/* Order Items - Using ref to preserve scroll position */}
        <div 
          ref={detailScrollRef}
          className="flex-1 overflow-y-auto px-4 scrollbar-thin scrollbar-thumb-neutral-500 scrollbar-track-transparent"
        >
          <div className="py-3 space-y-3">
            {selectedOrder.items.map((item, idx) => {
              const itemReport = getItemReport(idx);
              const isReported = !!itemReport;
              const unavailableQty = itemReport?.unavailableQty || 0;
              const remainingQty = item.qty - unavailableQty;
              const isFullyReported = isReported && remainingQty <= 0;
              const isPartiallyReported = isReported && remainingQty > 0;
              
              return (
                <div key={idx} className="space-y-2">
                  {/* Remaining available items (if partial report) */}
                  {isPartiallyReported && (
                    <div className="p-3 bg-surface-elevated rounded-xl border border-border">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-2">
                          <span className="w-6 h-6 rounded flex items-center justify-center text-sm font-bold flex-shrink-0 bg-white text-black">
                            {remainingQty}
                          </span>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-foreground">
                                {item.name}
                              </span>
                            </div>
                            {item.richModifiers && item.richModifiers.length > 0 ? (
                              <div className="mt-1.5 ml-1">
                                {item.richModifiers.map((mod, i) => {
                                  let prefix = '•';
                                  if (mod.type === 'remove') prefix = '-';
                                  else if (mod.type === 'add') prefix = '+';
                                  const isAllergy = mod.type === 'remove';
                                  
                                  return (
                                    <div key={i} className="flex items-center text-xs h-5">
                                      <div className="relative w-4 h-full flex-shrink-0">
                                        <div 
                                          className="absolute left-0 w-px bg-white/30"
                                          style={{ 
                                            top: i === 0 ? '0' : '-2px',
                                            height: i === item.richModifiers!.length - 1 ? '50%' : 'calc(100% + 2px)'
                                          }}
                                        />
                                        <div className="absolute left-0 top-1/2 w-2.5 h-px bg-white/30" />
                                      </div>
                                      <div className="flex items-center flex-1 min-w-0">
                                         <span className={`mr-1.5 w-2 text-center flex-shrink-0 ${isAllergy ? 'text-[#FF6B6B]' : 'text-muted-foreground'}`}>
                                           {prefix}
                                         </span>
                                         <span className={`truncate ${isAllergy ? 'text-[#FF6B6B]' : 'text-muted-foreground'}`}>
                                          {mod.text}
                                        </span>
                                        {mod.price && mod.price > 0 && (
                                           <span className="ml-auto pl-2 text-muted-foreground flex-shrink-0">{formatPrice(mod.price)}</span>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : item.modifiers.length > 0 && (
                              <SimpleModifierTree modifiers={item.modifiers} size="sm" />
                            )}
                            {item.notes && (
                              <div className="mt-1.5 flex items-start gap-1.5">
                                <div className="relative w-4 h-4 flex-shrink-0">
                                  <div className="absolute left-0 w-px bg-white/30 h-2" />
                                  <div className="absolute left-0 top-2 w-2.5 h-px bg-white/30" />
                                </div>
                                <span className="text-[#FFD60A] text-xs italic leading-tight">"{item.notes}"</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <span className="font-medium flex-shrink-0 text-foreground">
                          {formatPrice(item.price * remainingQty)}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {/* Reported/unavailable items OR non-reported items */}
                  {(!isPartiallyReported || isReported) && (
                    <div className={`p-3 rounded-xl border ${isReported ? 'eighty-six-card !p-3' : 'bg-surface-elevated border-border'}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-2">
                          <span className={`w-6 h-6 rounded flex items-center justify-center text-sm font-bold flex-shrink-0 ${isReported ? 'eighty-six-icon !w-6 !h-6' : 'bg-white text-black'}`}>
                            {isReported ? <X size={14} strokeWidth={3} className="text-white" /> : item.qty}
                          </span>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`font-medium ${isReported ? 'eighty-six-text' : 'text-foreground'}`}>
                                {item.name}
                              </span>
                              {isReported && (
                                <span className="eighty-six-badge eighty-six-badge-sm">
                                  <X size={8} strokeWidth={3} />
                                  {itemReport.reasonLabel}
                                </span>
                              )}
                            </div>
                            {/* Show modifiers/notes only for non-reported items */}
                            {!isReported && item.richModifiers && item.richModifiers.length > 0 ? (
                              <div className="mt-1.5 ml-1">
                                {item.richModifiers.map((mod, i) => {
                                  let prefix = '•';
                                  if (mod.type === 'remove') prefix = '-';
                                  else if (mod.type === 'add') prefix = '+';
                                  const isAllergy = mod.type === 'remove';
                                  
                                  return (
                                    <div key={i} className="flex items-center text-xs h-5">
                                      <div className="relative w-4 h-full flex-shrink-0">
                                        <div 
                                          className="absolute left-0 w-px bg-white/30"
                                          style={{ 
                                            top: i === 0 ? '0' : '-2px',
                                            height: i === item.richModifiers!.length - 1 ? '50%' : 'calc(100% + 2px)'
                                          }}
                                        />
                                        <div className="absolute left-0 top-1/2 w-2.5 h-px bg-white/30" />
                                      </div>
                                      <div className="flex items-center flex-1 min-w-0">
                                         <span className={`mr-1.5 w-2 text-center flex-shrink-0 ${isAllergy ? 'text-[#FF6B6B]' : 'text-muted-foreground'}`}>
                                           {prefix}
                                         </span>
                                         <span className={`truncate ${isAllergy ? 'text-[#FF6B6B]' : 'text-muted-foreground'}`}>
                                          {mod.text}
                                        </span>
                                        {mod.price && mod.price > 0 && (
                                          <span className="ml-auto pl-2 text-muted-foreground flex-shrink-0">{formatPrice(mod.price)}</span>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : !isReported && item.modifiers.length > 0 && (
                              <SimpleModifierTree modifiers={item.modifiers} size="sm" />
                            )}
                            {item.notes && !isReported && (
                              <div className="mt-1.5 flex items-start gap-1.5">
                                <div className="relative w-4 h-4 flex-shrink-0">
                                  <div className="absolute left-0 w-px bg-white/30 h-2" />
                                  <div className="absolute left-0 top-2 w-2.5 h-px bg-white/30" />
                                </div>
                                <span className="text-[#FFD60A] text-xs italic leading-tight">"{item.notes}"</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <span className={`font-medium flex-shrink-0 ${isReported ? 'eighty-six-text' : 'text-foreground'}`}>
                          {formatPrice(item.price * (isReported ? unavailableQty : item.qty))}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {/* On Hold indicator */}
                  {isReported && (
                    <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/30 ml-4">
                      <div className="flex items-center gap-2">
                        <Timer className="w-4 h-4 text-amber-500" />
                        <span className="text-amber-400 text-sm">On Hold – Awaiting aggregator response</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Order Notes Section */}
        {selectedOrder.orderNotes && (
          <div className="mx-4 mb-3 p-3 bg-[#FFD60A]/10 border border-[#FFD60A]/30 rounded-lg">
            <span className="text-[#FFD60A] text-xs font-medium">Order Notes: </span>
            <span className="text-[#FFD60A] text-xs italic">"{selectedOrder.orderNotes}"</span>
          </div>
        )}
        
        {/* Payment Summary - Horizontal grid format */}
         <div className="px-4 py-3 border-t border-border text-sm">
           <div className="grid grid-cols-3 gap-y-1">
             {/* Row 1: Sub, Del, Tax */}
             <span className="text-muted-foreground">Sub <span className="text-foreground">{formatPrice(selectedOrder.subtotal)}</span></span>
             <span className="text-muted-foreground">{selectedOrder.deliveryFee > 0 ? <>Del <span className="text-foreground">{formatPrice(selectedOrder.deliveryFee)}</span></> : ''}</span>
             <span className="text-muted-foreground">Tax <span className="text-foreground">{formatPrice(selectedOrder.tax)}</span></span>
             {/* Row 2: Tip, Discount */}
             <span className="text-muted-foreground">Tip <span className="text-foreground">{formatPrice(selectedOrder.tip)}</span></span>
             {selectedOrder.discount > 0 ? (
               <span className="text-muted-foreground">Disc <span className="text-[#FF6B6B]">-{formatPrice(selectedOrder.discount)}</span></span>
             ) : <span></span>}
           </div>
           
           {/* Show adjustment if items were reported */}
           {hasAdjustments && (
             <div className="flex justify-between text-sm pt-2 mt-2 border-t border-border">
               <span className="text-muted-foreground">Original Total</span>
               <span className="text-muted-foreground line-through">{formatPrice(selectedOrder.total)}</span>
             </div>
           )}
           {hasAdjustments && (
             <div className="flex justify-between text-sm">
               <span className="text-[#FF6B6B]">Adjustment</span>
               <span className="text-[#FF6B6B]">
                 {orderReports.reduce((sum, r) => sum + r.priceImpact, 0) > 0 ? '+' : ''}
                 {formatPrice(orderReports.reduce((sum, r) => sum + r.priceImpact, 0))}
               </span>
             </div>
           )}
           
           <div className={`flex justify-between text-base font-bold ${hasAdjustments ? 'pt-1' : 'pt-2 mt-2 border-t border-border'}`}>
             <span className="text-foreground">Total Due</span>
             <span className="text-foreground">{formatPrice(hasAdjustments ? adjustedTotal : selectedOrder.total)}</span>
           </div>
         </div>
        
        {/* Action Buttons */}
        <div className="px-4 py-3 border-t border-border">
          {/* Scheduled orders always show Accept/Cancel/Report regardless of status */}
          {selectedOrder.isScheduled && selectedOrder.isWaiting ? (
            <div className="flex items-center gap-2">
              <button 
                onClick={() => handleAcceptOrder(selectedOrder.id)}
                className="flex-1 py-3 rounded-full text-black text-sm font-bold transition-all hover:scale-[1.02] whitespace-nowrap" 
                style={{ background: "linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)" }}
              >
                Accept Order
              </button>
              <button 
                onClick={() => openCancelDialog(selectedOrder)}
                className="py-3 px-4 rounded-full text-[#FF6B6B] text-sm font-bold border border-[#FF6B6B] hover:bg-[#FF6B6B]/10 transition-colors whitespace-nowrap"
              >
                Cancel Order
              </button>
              <button 
                onClick={() => openReportDialog(selectedOrder)}
                className="py-3 px-4 rounded-full text-amber-500 text-sm font-bold border border-amber-500/50 hover:bg-amber-500/10 transition-colors whitespace-nowrap"
              >
                Report
              </button>
            </div>
          ) : (
            <>
              {selectedOrder.status === 'NEW' && (
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleAcceptOrder(selectedOrder.id)}
                    className="flex-1 py-3 rounded-full text-black text-sm font-bold transition-all hover:scale-[1.02] whitespace-nowrap" 
                    style={{ background: "linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)" }}
                  >
                    Accept Order
                  </button>
                  <button 
                    onClick={() => openCancelDialog(selectedOrder)}
                    className="py-3 px-4 rounded-full text-[#FF6B6B] text-sm font-bold border border-[#FF6B6B] hover:bg-[#FF6B6B]/10 transition-colors whitespace-nowrap"
                  >
                    Cancel Order
                  </button>
                  <button 
                    onClick={() => openReportDialog(selectedOrder)}
                    className="py-3 px-4 rounded-full text-amber-500 text-sm font-bold border border-amber-500/50 hover:bg-amber-500/10 transition-colors whitespace-nowrap"
                  >
                    Report
                  </button>
                </div>
              )}
              {selectedOrder.status === 'PREPARING' && (
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleMakeReady(selectedOrder.id)}
                    className={`${selectedOrder.orderType === 'DINE IN' ? 'flex-1 basis-0' : 'flex-1'} py-3 rounded-full text-black text-sm font-bold transition-all hover:scale-[1.02]`}
                    style={{ background: "linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)" }}
                  >
                    Make Ready
                  </button>
                  {selectedOrder.orderType === 'DINE IN' && (
                    <button 
                      onClick={() => {
                        setPaymentOrder(selectedOrder);
                        setShowPaymentDialog(true);
                      }}
                      className="flex-1 basis-0 py-3 rounded-full text-white text-sm font-bold transition-all hover:scale-[1.02]" 
                      style={{ background: "linear-gradient(180deg, #5A5A5A 0%, #3A3A3A 100%)", border: "1px solid rgba(255,255,255,0.2)" }}
                    >
                      Charge ${selectedOrder.total.toFixed(2)}
                    </button>
                  )}
                </div>
              )}
              {selectedOrder.status === 'READY' && (
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleReadyForPickup(selectedOrder.id, selectedOrder.orderType)}
                    className={`${selectedOrder.orderType === 'DINE IN' ? 'flex-1 basis-0' : 'flex-1'} py-3 rounded-full text-black text-sm font-bold transition-all hover:scale-[1.02]`}
                    style={{ background: "linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)" }}
                  >
                    {selectedOrder.orderType === 'DELIVERY' ? 'Dispatch' : selectedOrder.orderType === 'DINE IN' ? 'Completed' : 'Ready for Pick Up'}
                  </button>
                  {selectedOrder.orderType === 'DINE IN' && (
                    <button 
                      onClick={() => {
                        setPaymentOrder(selectedOrder);
                        setShowPaymentDialog(true);
                      }}
                      className="flex-1 basis-0 py-3 rounded-full text-white text-sm font-bold transition-all hover:scale-[1.02]" 
                      style={{ background: "linear-gradient(180deg, #5A5A5A 0%, #3A3A3A 100%)", border: "1px solid rgba(255,255,255,0.2)" }}
                    >
                      Charge ${selectedOrder.total.toFixed(2)}
                    </button>
                  )}
                </div>
              )}
              {selectedOrder.status === 'OUT_FOR_DELIVERY' && (
                <button 
                  onClick={() => handleMarkDelivered(selectedOrder.id)}
                  className="w-full py-3 rounded-full text-black text-sm font-bold transition-all hover:scale-[1.02]" 
                  style={{ background: "linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)" }}
                >
                  Mark as Delivered
                </button>
              )}
              {(selectedOrder.status === 'COMPLETED' || selectedOrder.status === 'CANCELLED') && (
                <button className="w-full py-3 rounded-full text-foreground text-sm font-bold border border-border hover:bg-muted transition-colors">
                  Connect Printer
                </button>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  // Desktop Layout
  const desktopLayout = (
    <div className="flex h-full bg-background gap-2 py-2">
      {/* Left Section - Kanban Board */}
      <div className="flex-1 flex flex-col rounded-[20px] overflow-hidden bg-surface border border-border">
        {/* Header - Horizontally scrollable on smaller screens */}
        <div className="overflow-x-auto scrollbar-hide border-b border-border">
          <div className="flex items-center justify-between p-3 min-w-max gap-3">
            {/* Mode Toggle */}
            <div className="flex items-center rounded-full p-1 shrink-0" style={{ background: "#7575754D", boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)" }}>
              {modeOptions.map((mode) => (
                <button 
                  key={mode.id}
                  onClick={() => {
                    setActiveMode(mode.id);
                    setMobileChipIndex(modeOptions.findIndex(m => m.id === mode.id));
                  }}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${activeMode === mode.id ? 'text-black' : 'text-white'}`}
                  style={activeMode === mode.id ? { background: "linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)" } : {}}
                >
                  {mode.label}
                  <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${activeMode === mode.id ? 'bg-black text-white' : 'bg-surface-elevated'}`}>
                    {mode.count}
                  </span>
                </button>
              ))}
            </div>
            {/* Right Controls */}
            <div className="flex items-center gap-3 shrink-0">
              {/* Time Display */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl shrink-0" style={{ background: "rgba(100, 100, 100, 0.4)" }}>
                <span className="text-white font-bold text-lg leading-none flex items-center">
                  {currentTime}
                  <span className="flex flex-col text-[0.45em] font-bold leading-[1] ml-0.5">
                    <span>{currentPeriod.charAt(0)}</span>
                    <span>{currentPeriod.charAt(1)}</span>
                  </span>
                </span>
              </div>
              
              {/* Prep Time */}
              <div ref={prepTimeTriggerRef} className="shrink-0">
                <div className="flex flex-col items-center justify-center px-3 py-1 rounded-xl h-[36px]" style={{ background: "rgba(100, 100, 100, 0.4)" }}>
                  <span className="text-white/50 text-[10px] leading-tight whitespace-nowrap">+ Prep Time</span>
                  <div className="flex items-center">
                    {prepTimeInputMode ? (
                      <input
                        ref={prepTimeInputRef}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={prepTimeInputValue}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "");
                          if (val === "") {
                            setPrepTimeInputValue("");
                            return;
                          }
                          const numVal = Math.min(parseInt(val, 10), 120);
                          setPrepTimeInputValue(numVal.toString());
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            const numVal = prepTimeInputValue === "" ? 0 : parseInt(prepTimeInputValue, 10);
                            const clampedVal = Math.max(0, Math.min(numVal, 120));
                            setPrepTime(clampedVal);
                            setPrepTimeInputMode(false);
                            setPrepTimePickerOpen(false);
                          } else if (e.key === "Escape") {
                            setPrepTimeInputMode(false);
                            setPrepTimePickerOpen(false);
                            setPrepTimeInputValue(prepTime.toString());
                          }
                        }}
                        onBlur={() => {
                          const numVal = prepTimeInputValue === "" ? 0 : parseInt(prepTimeInputValue, 10);
                          const clampedVal = Math.max(0, Math.min(numVal, 120));
                          setPrepTime(clampedVal);
                          setPrepTimeInputMode(false);
                        }}
                        className="bg-transparent text-white font-bold text-center outline-none w-[60px] text-sm leading-tight"
                        autoFocus
                      />
                    ) : (
                      <button 
                        onClick={() => {
                          setPrepTimeInputValue(prepTime.toString());
                          setPrepTimeInputMode(true);
                          setPrepTimePickerOpen(true);
                          setTimeout(() => prepTimeInputRef.current?.focus(), 50);
                        }}
                        className="text-white font-bold text-sm leading-tight whitespace-nowrap hover:bg-white/10 rounded px-1 transition-colors"
                      >
                        {prepTime}:00 MIN
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <PrepTimeWheelPicker
                isOpen={prepTimePickerOpen}
                onClose={() => {
                  setPrepTimePickerOpen(false);
                  setPrepTimeInputMode(false);
                }}
                value={prepTime}
                onConfirm={(val) => {
                  setPrepTime(val);
                  setPrepTimeInputValue(val.toString());
                }}
                triggerRef={prepTimeTriggerRef}
                externalInputValue={prepTimeInputValue === "" ? undefined : parseInt(prepTimeInputValue, 10)}
               />

               {/* Ready Time Picker for adjusting Est. Ready By */}
               {selectedOrder && (
                 <AppleWheelTimePicker
                   isOpen={readyTimePickerOpen}
                   onClose={() => setReadyTimePickerOpen(false)}
                   selectedTime={selectedOrder.estimateReady}
                   onConfirm={(newTime) => {
                     updateEstimatedReadyTime(selectedOrder.id, newTime);
                     setReadyTimePickerOpen(false);
                   }}
                 />
               )}
               
              {/* Auto Accept Toggle */}
              <div className="flex items-center gap-2 px-3 py-1 rounded-xl shrink-0 h-[36px]" style={{ background: "rgba(100, 100, 100, 0.4)" }}>
                <div className="flex flex-col items-center leading-tight">
                  <span className="text-white/50 text-[10px]">Auto</span>
                  <span className="text-white/50 text-[10px]">Accept</span>
                </div>
                <Switch checked={autoAccept} onCheckedChange={(checked) => {
                  if (checked) {
                    setShowAutoAcceptNote(true);
                  } else {
                    setAutoAccept(false);
                  }
                }} />
              </div>
              
              {/* Pause Orders Toggle */}
              <div className="flex items-center gap-2 px-3 py-1 rounded-xl shrink-0 h-[36px]" style={{ background: pauseOrders ? "rgba(239, 68, 68, 0.4)" : "rgba(100, 100, 100, 0.4)" }}>
                <div className="flex flex-col items-center leading-tight">
                  <span className={`text-[10px] ${pauseOrders ? 'text-[#FF6B6B]' : 'text-white/50'}`}>Pause</span>
                  <span className={`text-[10px] ${pauseOrders ? 'text-[#FF6B6B]' : 'text-white/50'}`}>Orders</span>
                </div>
                <Switch checked={pauseOrders} onCheckedChange={setPauseOrders} />
              </div>
              
              {/* 86 Items Button */}
              <button 
                onClick={() => setEightySixSheetOpen(true)}
                className="flex items-center gap-2 px-3 py-1 rounded-xl hover:opacity-80 transition-opacity shrink-0 h-[36px]" 
                style={{ background: eightySixedItems.length > 0 ? "rgba(239, 68, 68, 0.4)" : "rgba(100, 100, 100, 0.4)" }}
              >
                <div className="flex flex-col items-center leading-tight">
                  <span className={`text-[10px] ${eightySixedItems.length > 0 ? 'text-[#FF6B6B]' : 'text-white/50'}`}>86</span>
                  <span className={`text-[10px] ${eightySixedItems.length > 0 ? 'text-[#FF6B6B]' : 'text-white/50'}`}>Items</span>
                </div>
                <Package className={`w-4 h-4 ${eightySixedItems.length > 0 ? 'text-[#FF6B6B]' : 'text-white/50'}`} />
                {eightySixedItems.length > 0 && (
                  <span className="text-[#FF6B6B] text-sm font-bold">({eightySixedItems.length})</span>
                )}
              </button>
              
              {/* Search */}
              {showSearchInput ? (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full shrink-0" style={{ background: "#7575754D" }}>
                  <Search className="w-4 h-4 text-white/60" />
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={searchPlaceholders[placeholderIndex]}
                    className="bg-transparent text-white text-sm placeholder:text-white/40 outline-none w-44 transition-all"
                    autoFocus
                  />
                  <button onClick={() => { setShowSearchInput(false); setSearchQuery(""); }}>
                    <X className="w-4 h-4 text-white/60" />
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => setShowSearchInput(true)}
                  className="p-2 rounded-full hover:opacity-80 transition-opacity shrink-0" 
                  style={{ background: "#7575754D", boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)" }}
                >
                  <Search className="w-4 h-4 text-white" />
                </button>
              )}
            </div>
          </div>
        </div>
        
        {/* Kanban Columns with Drag and Drop */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex-1 flex overflow-x-auto p-2">
            {columns.map(column => (
              <KanbanColumn key={column.id} column={column} />
            ))}
          </div>
          
          {/* Drag Overlay */}
          <DragOverlay>
            {activeOrder ? (
              <div className="opacity-90 rotate-2 scale-105">
                <OrderCard 
                  order={activeOrder} 
                  isExpanded={false} 
                  onToggleExpand={() => {}}
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
      
      {/* Right Section - Order Detail Panel */}
      {selectedOrder && (
        <div className="w-[380px] flex flex-col rounded-[20px] overflow-hidden animate-slide-in-right bg-surface border border-border">
          <OrderDetailPanel />
        </div>
      )}
    </div>
  );

  // Mobile Layout
  const mobileLayout = (
     <div className="flex flex-col h-full bg-background py-2">
       {/* Header */}
       <div className="flex items-center justify-between p-3 border-b border-border">
        {/* Vertical Mode Selector with Arrow Navigation */}
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-full p-0.5" style={{ background: "#7575754D" }}>
            <button 
              onClick={() => {
                setActiveMode(modeOptions[mobileChipIndex].id);
              }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all text-black"
              style={{ background: "linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)" }}
            >
              {modeOptions[mobileChipIndex].label}
              <span className="px-1 py-0.5 rounded text-[10px] font-bold bg-black text-white">
                {modeOptions[mobileChipIndex].count}
              </span>
            </button>
          </div>
          {/* Arrow Navigation Button */}
          <button 
            onClick={() => handleMobileChipNav('down')}
            className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
            style={{ background: "#7575754D" }}
          >
            <img src={expandArrowsIcon} alt="Switch mode" className="w-4 h-4 invert" />
          </button>
        </div>
        
        <button 
          onClick={() => setShowSearchInput(true)}
          className="p-2 rounded-full" 
          style={{ background: "#7575754D" }}
        >
          <Search className="w-4 h-4 text-white" />
        </button>
      </div>
      
      {/* Status Filter Tabs - Horizontal Scroll */}
      <div className="flex items-center gap-2 p-3 overflow-x-auto">
        {columns.map(column => {
          const count = (ordersByStatus[column.id] || []).length;
          return (
            <button 
              key={column.id}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm whitespace-nowrap text-white"
              style={{ background: "#7575754D" }}
            >
              <span>{column.label}</span>
              <span className="px-1.5 py-0.5 rounded text-xs font-bold bg-surface-elevated">
                {count}
              </span>
            </button>
          );
        })}
      </div>
      
      {/* Orders List - Using stable ref to preserve scroll position */}
      <div 
        ref={mobileScrollRef}
        className="flex-1 overflow-y-auto px-3 scrollbar-thin scrollbar-thumb-neutral-500 scrollbar-track-transparent"
      >
        <div className="space-y-2 pb-3">
          {filteredOrders.map(order => (
            <OrderCard 
              key={order.id} 
              order={order}
              isExpanded={expandedCards.has(order.id)}
              onToggleExpand={() => toggleCardExpand(order.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );

  // Render based on device
  if (isMobile) {
    return (
      <>
        {mobileLayout}
        {cancelDialogOpen && (() => {
          const commonReasons = ['Customer changed mind', 'Out of stock', 'Wrong order placed', 'Customer left', 'Duplicate order', 'Kitchen issue'];
          const selectedReason = cancelReason === '__custom__' ? customCancelReason.trim() : cancelReason;
          const canConfirm = selectedReason.length > 0;
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
              <div className="bg-neutral-900 rounded-xl border border-neutral-700 w-[90%] max-w-sm mx-4 p-5 space-y-4 animate-scale-in">
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mx-auto">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                  </div>
                  <h3 className="text-white font-semibold text-lg">Cancel Order #{orderToCancel?.orderNumber}?</h3>
                  <p className="text-white/60 text-sm">Please select a reason for cancellation.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {commonReasons.map((reason) => (
                    <button key={reason} onClick={() => { setCancelReason(reason); setCustomCancelReason(''); }}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${cancelReason === reason ? 'bg-red-500 text-white' : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'}`}>
                      {reason}
                    </button>
                  ))}
                  <button onClick={() => setCancelReason('__custom__')}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${cancelReason === '__custom__' ? 'bg-red-500 text-white' : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'}`}>
                    Other
                  </button>
                </div>
                {cancelReason === '__custom__' && (
                  <textarea value={customCancelReason} onChange={(e) => setCustomCancelReason(e.target.value)}
                    placeholder="Enter cancel reason..." autoFocus rows={2}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-red-500 resize-none" />
                )}
                <div className="flex gap-3">
                  <button onClick={() => setCancelDialogOpen(false)}
                    className="flex-1 h-10 rounded-full border border-neutral-600 text-white text-sm font-medium hover:bg-neutral-800 transition-colors">
                    Keep Order
                  </button>
                  <button disabled={!canConfirm} onClick={confirmCancelOrder}
                    className={`flex-1 h-10 rounded-full text-white text-sm font-medium transition-colors ${canConfirm ? 'bg-red-500 hover:bg-red-600' : 'bg-neutral-700 cursor-not-allowed opacity-50'}`}>
                    Cancel Order
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
        <ReportExceptionDialog
          open={reportDialogOpen}
          onOpenChange={setReportDialogOpen}
          order={orderToReport}
          onReportItems={handleReportItems}
          userRole="manager"
          userName="Demo User"
          existingReports={orderToReport ? reportedItems.get(orderToReport.id) || [] : []}
        />
        <EightySixSheet
          open={eightySixSheetOpen}
          onOpenChange={setEightySixSheetOpen}
          eightySixedItems={eightySixedItems}
          onRestoreItem={handleRestoreItem}
          onScheduleRestore={handleScheduleRestore}
          onEightySixItem={handleEightySixItem}
        />
      </>
    );
  }
  
  return (
    <>
      {desktopLayout}
      {cancelDialogOpen && (() => {
          const commonReasons = ['Customer changed mind', 'Out of stock', 'Wrong order placed', 'Customer left', 'Duplicate order', 'Kitchen issue'];
          const selectedReason = cancelReason === '__custom__' ? customCancelReason.trim() : cancelReason;
          const canConfirm = selectedReason.length > 0;
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
              <div className="bg-neutral-900 rounded-xl border border-neutral-700 w-[90%] max-w-sm mx-4 p-5 space-y-4 animate-scale-in">
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mx-auto">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                  </div>
                  <h3 className="text-white font-semibold text-lg">Cancel Order #{orderToCancel?.orderNumber}?</h3>
                  <p className="text-white/60 text-sm">Please select a reason for cancellation.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {commonReasons.map((reason) => (
                    <button key={reason} onClick={() => { setCancelReason(reason); setCustomCancelReason(''); }}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${cancelReason === reason ? 'bg-red-500 text-white' : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'}`}>
                      {reason}
                    </button>
                  ))}
                  <button onClick={() => setCancelReason('__custom__')}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${cancelReason === '__custom__' ? 'bg-red-500 text-white' : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'}`}>
                    Other
                  </button>
                </div>
                {cancelReason === '__custom__' && (
                  <textarea value={customCancelReason} onChange={(e) => setCustomCancelReason(e.target.value)}
                    placeholder="Enter cancel reason..." autoFocus rows={2}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-red-500 resize-none" />
                )}
                <div className="flex gap-3">
                  <button onClick={() => setCancelDialogOpen(false)}
                    className="flex-1 h-10 rounded-full border border-neutral-600 text-white text-sm font-medium hover:bg-neutral-800 transition-colors">
                    Keep Order
                  </button>
                  <button disabled={!canConfirm} onClick={confirmCancelOrder}
                    className={`flex-1 h-10 rounded-full text-white text-sm font-medium transition-colors ${canConfirm ? 'bg-red-500 hover:bg-red-600' : 'bg-neutral-700 cursor-not-allowed opacity-50'}`}>
                    Cancel Order
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
      <ReportExceptionDialog
        open={reportDialogOpen}
        onOpenChange={setReportDialogOpen}
        order={orderToReport}
        onReportItems={handleReportItems}
        userRole="manager"
        userName="Demo User"
        existingReports={orderToReport ? reportedItems.get(orderToReport.id) || [] : []}
      />
      <EightySixSheet
        open={eightySixSheetOpen}
        onOpenChange={setEightySixSheetOpen}
        eightySixedItems={eightySixedItems}
        onRestoreItem={handleRestoreItem}
        onScheduleRestore={handleScheduleRestore}
        onEightySixItem={handleEightySixItem}
      />

      {/* Auto Accept Important Note Dialog */}
      <Dialog open={showAutoAcceptNote} onOpenChange={setShowAutoAcceptNote}>
        <DialogContent hideCloseButton className="max-w-[340px] rounded-2xl p-0 border-0 bg-[#2C2C2E]/95 backdrop-blur-xl shadow-2xl overflow-hidden">
          <DialogHeader className="pt-6 pb-3 px-6 space-y-2">
            <DialogTitle className="text-[17px] font-bold text-white text-center tracking-[-0.4px]">
              Important Note!
            </DialogTitle>
            <DialogDescription className="text-[13px] text-[#EBEBF599] text-center leading-[18px] tracking-[-0.08px]">
              During Auto Accept mode, the options to report issues and cancel orders will be temporarily disabled. Would you like to enable these features now?
            </DialogDescription>
          </DialogHeader>
          <div className="flex border-t border-[#545458]/50">
            <button
              onClick={() => {
                setAutoAccept(true);
                setShowAutoAcceptNote(false);
              }}
              className="flex-1 h-12 text-[16px] font-medium text-white/70 hover:bg-[#545458]/30 transition-colors border-r border-[#545458]/50"
            >
              Yes
            </button>
            <button
              onClick={() => {
                setShowAutoAcceptNote(false);
              }}
              className="flex-1 h-12 text-[16px] font-medium text-white/70 hover:bg-[#545458]/30 transition-colors"
            >
              No
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog - same flow as new order screen */}
      {paymentOrder && (
        <PaymentDialog
          open={showPaymentDialog}
          onOpenChange={(open) => {
            setShowPaymentDialog(open);
            if (!open) setPaymentOrder(null);
          }}
          orderDetails={{
            guest: paymentOrder.customerName,
            phone: paymentOrder.phone,
            table: paymentOrder.tableNumber,
            check: paymentOrder.orderNumber,
            orderType: paymentOrder.orderType,
            orderNumber: paymentOrder.orderNumber,
            orderTime: paymentOrder.orderedAt,
            items: paymentOrder.items.map((it, idx) => ({
              id: idx,
              qty: it.qty,
              name: it.name,
              price: it.price,
            })),
          }}
          subtotal={paymentOrder.subtotal}
          tax={paymentOrder.tax}
          total={paymentOrder.total}
          onPaymentComplete={() => {
            setOrders(prev => prev.map(o => o.id === paymentOrder.id ? { ...o, isPaid: true } : o));
            setShowPaymentDialog(false);
            setPaymentOrder(null);
            toast({ title: "Payment completed", description: `Order #${paymentOrder.orderNumber} has been paid.` });
          }}
        />
      )}
    </>
  );
};

export default OrderOS;
