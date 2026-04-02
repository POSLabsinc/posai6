import { useState, useRef, useMemo, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useWriteOffProcessor } from "@/hooks/useWriteOffProcessor";
import { PaymentDialog } from "@/components/PaymentDialog";
import { SettingsManager } from "@/lib/settingsManager";
import { getActiveTaxRate } from "@/lib/orderUtils";

interface TicketsProps {
  isClosedTicketsMode?: boolean;
}

import { motion, AnimatePresence } from "framer-motion";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Search, SlidersHorizontal, Phone, ShoppingBag, Truck, Wine, X, ChevronLeft, DollarSign, RotateCcw, Percent, FileText, Check, Calendar, Users, Wallet, ClipboardList, CircleDollarSign, Delete, ListFilter, MoreVertical, Share2, Clock, MessageSquare, Mail, Printer, SendHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Switch } from "@/components/ui/switch";
import { format } from "date-fns";
import { useIsMobile } from "@/hooks/use-mobile";
// Import icons
import runnerIcon from "@/assets/icons/runner.png";
import clearIcon from "@/assets/icons/clear-c.png";
import fireIcon from "@/assets/icons/fire.png";
import saveIcon from "@/assets/icons/save.png";
import phoneIcon from "@/assets/icons/phone-icon.png";
import timeIcon from "@/assets/icons/time-icon.png";
import tableTargetIcon from "@/assets/icons/table-target.png";
import arrowRightIcon from "@/assets/icons/arrow-right.png";
import shareOrderIcon from "@/assets/icons/share-order.png";
import shareSeatsIcon from "@/assets/icons/share-seats.png";
import seatIcon from "@/assets/icons/seat-icon.png";
import splitIcon from "@/assets/icons/split-icon.png";
import mergeIcon from "@/assets/icons/merge-icon.png";
import dineInIcon from "@/assets/icons/dine-in.png";
import transferItemIcon from "@/assets/icons/transfer-item.svg";
import transferEntireOrderIcon from "@/assets/icons/transfer-entire-order.svg";
import transferToTableIcon from "@/assets/icons/transfer-to-table.svg";
import transferToOrderIcon from "@/assets/icons/transfer-to-order.svg";
import OrderLayoutTemplate from "@/components/OrderLayoutTemplate";
import { ticketToTemplateData, formatTicketPrice } from "@/data/ticketOrders";
import { useTicketOrders, UnifiedTicketOrder } from "@/hooks/use-ticket-orders";
import { formatTableName } from "@/lib/orderUtils";
import { useUnifiedOrders } from "@/contexts/UnifiedOrderContext";
import registerIcon from "@/assets/icons/register.svg";
import customItemIcon from "@/assets/icons/custom-item.svg";
import discountIcon from "@/assets/icons/discount-new.svg";
import receiptIcon from "@/assets/icons/receipt.svg";
import noTaxIcon from "@/assets/icons/no-tax-new.svg";
import successTick from "@/assets/icons/success-tick.svg";
import MobileTicketCard from "@/components/MobileTicketCard";
import TipBottomSheet from "@/components/TipBottomSheet";
import ReceiptOptionsDialog from "@/components/ReceiptOptionsDialog";
import SwipeableRefundItem, { SwipeableModifier } from "@/components/SwipeableRefundItem";
import SwipeableCartItem from "@/components/SwipeableCartItem";
import MobileFiltersSheet, { MobileFiltersState } from "@/components/MobileFiltersSheet";
import OrderTypeIcon from "@/components/OrderTypeIcon";
import { SimpleModifierTree } from "@/components/ModifierWithConnector";
import AnimatedAIIcon from "@/components/AnimatedAIIcon";
import OrderAIChatPanel from "@/components/OrderAIChatPanel";
import { DiscountDialog, availableDiscounts, type Discount } from "@/components/DiscountDialog";
import AccessRestrictedModal from "@/components/AccessRestrictedModal";
import NoteSuggestions from "@/components/NoteSuggestions";
import { OrderNotesAutocomplete } from "@/components/OrderNotesAutocomplete";
import AppleAlertDialog from "@/components/AppleAlertDialog";
import RefundModalLayout from "@/components/RefundModalLayout";
import RefundBottomSheet from "@/components/RefundBottomSheet";
import TicketsTransferView, { TransferGuestOrder } from "@/components/TicketsTransferView";

// Refund flow types
type RefundStep = 'closed' | 'type-selection' | 'full-refund' | 'partial-refund' | 'tip-refund' | 'custom-refund' | 'item-refund' | 'confirmation' | 'success';
type RefundReason = 'customer-dissatisfaction' | 'order-error' | 'quality-issue' | 'wrong-order' | 'other';

// Payment method interface for split payments
interface PaymentMethod {
  id: string;
  type: 'credit_card' | 'cash' | 'gift_card' | 'debit_card';
  label: string; // e.g., "Visa •••• 1234"
  amount: number;
  tipAmount?: number; // Tip allocated to this payment method
}

// Refund allocation per payment method
interface RefundAllocation {
  paymentMethodId: string;
  refundAmount: number;
  tipRefundAmount: number;
}

// Selected refund item interface
interface RefundItem {
  index: number;
  qty: number;
  maxQty: number;
  name: string;
  unitPrice: number;
}

// Persisted refund record for tracking refunded quantities
interface RefundedItemRecord {
  orderId: string;
  itemIndex: number;
  refundedQty: number;
  maxQty: number;
  itemName: string;
}

// Persisted modifier refund record
interface RefundedModifierRecord {
  orderId: string;
  itemIndex: number;
  modifierIndex: number;
  modifierName: string;
}

// Persisted tip refund record
interface RefundedTipRecord {
  orderId: string;
  refundedAmount: number;
  originalTip: number;
}

// Individual refund transaction record
interface RefundTransactionRecord {
  id: string;
  orderId: string;
  amount: number;
  paymentMethod: string; // e.g., "Visa •••• 1234", "Cash", etc.
  paymentType: 'credit_card' | 'cash' | 'gift_card' | 'debit_card';
  timestamp: Date;
}

// Selected refund modifier interface
interface RefundModifier {
  itemIndex: number;
  modifierIndex: number;
  name: string;
  price: number;
}

// Swipe refund item interface (for individual item/modifier refunds)
interface SwipeRefundTarget {
  id: string; // Unique identifier for tracking refunded state
  type: 'item' | 'modifier';
  name: string;
  price: number;
}

// Using imported OrderTypeIcon component from @/components/OrderTypeIcon

// Modifier interface for rich modifier data
import { ModifierTree, SwipeableModifierTreeDesktop, SwipeableModifierTree, ModifierItem, formatPrice } from "@/components/tickets/TicketModifierTree";

// Order item interface
interface OrderItem {
  qty: number;
  name: string;
  price: number;
  seats: number[];
  modifiers: string[];
  richModifiers?: ModifierItem[];
  notes?: string[];
}

// Guest order interface with linked items
interface GuestOrder {
  id: string;
  orderNumber: number;
  name: string;
  phone: string;
  partySize: number;
  time: string;
  createdAt: Date; // Timestamp for dynamic timer
  server: string;
  check: string;
  paymentType: string;
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
  paid?: boolean;
  paidAt?: string;
  paymentMethods?: PaymentMethod[]; // Split payment support
  timer?: string;
}

const FALLBACK_SELECTED_GUEST_ID = "__fallback-ticket__";
const FALLBACK_SELECTED_GUEST: GuestOrder = {
  id: FALLBACK_SELECTED_GUEST_ID,
  orderNumber: 0,
  name: "",
  phone: "",
  partySize: 1,
  time: "",
  createdAt: new Date(),
  server: "",
  check: "--",
  paymentType: "--",
  revenueCenter: "",
  status: "ORDERING",
  notes: "",
  items: [],
  subtotal: 0,
  discount: 0,
  serviceCharge: 0,
  tax: 0,
  tip: 0,
  total: 0,
  table: "",
  orderType: "",
  paid: false,
  paymentMethods: [],
  timer: "00:00",
};

// Helper function to format elapsed time dynamically
// Under 1 hour: MM:SS Min (e.g., 02:35 Min)
// Over 1 hour: HH:MM:SS Hrs (e.g., 01:16:23 Hrs)
const formatElapsedTime = (createdAt: Date, now: Date): string => {
  const diffMs = now.getTime() - createdAt.getTime();
  const totalSeconds = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  if (hours >= 1) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')} Hrs`;
  }
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')} Min`;
};

// Helper to create a Date object from a time string like "8:00 PM"
const parseTimeToDate = (timeStr: string, minutesAgo: number = 0): Date => {
  const now = new Date();
  // For demo purposes, set createdAt to be minutesAgo before now
  return new Date(now.getTime() - minutesAgo * 60000);
};

// allOrders is now provided by the useTicketOrders hook inside the component below
// Helper function to format price

// Helper function to get order items for display
const getOrderItems = (order: GuestOrder) => order.items.map(item => ({
  ...item,
  displayPrice: formatPrice(item.price * item.qty)
}));

const filters = ["All", "Open", "Paid", "Unpaid"];

const Tickets = ({ isClosedTicketsMode = false }: TicketsProps) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  // Fetch all orders from database
  const { orders: dbTicketOrders, isLoading: isLoadingOrders, updateOrder: updateTicketOrder } = useTicketOrders();
  const { processCancelledItems } = useWriteOffProcessor();

  // Convert DB orders to GuestOrder shape for this component (exclude cancelled)
  const allOrders: GuestOrder[] = dbTicketOrders.filter(o => o.status !== 'CANCELLED').map(o => ({
    id: o.id,
    orderNumber: o.orderNumber || 0,
    name: o.name,
    phone: o.phone,
    partySize: o.partySize,
    time: o.time,
    createdAt: o.createdAtDate || new Date(),
    server: o.server,
    check: o.check,
    paymentType: o.paymentType,
    revenueCenter: o.revenueCenter,
    status: o.status,
    notes: o.notes,
    table: o.table,
    orderType: o.orderType === "Table Order" ? "Table" : o.orderType,
    items: o.items.map(item => ({
      qty: item.qty,
      name: item.name,
      price: item.price,
      seats: item.seats || [],
      modifiers: item.modifiers || [],
    })),
    subtotal: o.subtotal,
    discount: o.discount,
    serviceCharge: o.serviceCharge,
    tax: o.tax,
    tip: o.tip,
    total: o.total,
    paid: o.paid,
    paidAt: o.paidAt,
    paymentMethods: o.paymentMethods as any,
    timer: o.timer || '00:00',
  }));

  // Helper: get available ticket orders for transfer (exclude source, paid, completed)
  const getAvailableTicketOrdersForTransfer = (sourceOrderId: string) => {
    return allOrders.filter(o => {
      if (o.id === sourceOrderId) return false;
      if (o.status === "PAID" || o.status === "Completed") return false;
      return true;
    });
  };

  const handleAddProduct = () => {
    if (!selectedGuest) return;
    
    // Store full ticket context for the Orders screen to consume
    const ticketContext = {
      guest: selectedGuest,
      discounts: ticketDiscounts[selectedGuest.id] || [],
      serviceCharge: selectedGuest.serviceCharge,
      taxExempt: taxExemptTickets.has(selectedGuest.id),
    };
    localStorage.setItem('pos-add-product-context', JSON.stringify(ticketContext));
    
    navigate(`/orders?orderId=${selectedGuest.id}&tableId=${selectedGuest.table}&mode=addItem`);
  };
  const { updateOrders: updateUnifiedOrders, updateOrder } = useUnifiedOrders();
  const [activeFilter, setActiveFilter] = useState("All");
  const [selectedGuest, setSelectedGuest] = useState<GuestOrder>(() => allOrders[0] ?? FALLBACK_SELECTED_GUEST);
  
  // Keep selected ticket in sync when orders load or change
  useEffect(() => {
    if (allOrders.length === 0) return;

    const hasValidSelection =
      selectedGuest.id !== FALLBACK_SELECTED_GUEST_ID &&
      allOrders.some((order) => order.id === selectedGuest.id);

    if (!hasValidSelection) {
      setSelectedGuest(allOrders[0]);
    }
  }, [allOrders, selectedGuest.id]);
  
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  
  // Sync selectedSeats when selectedGuest changes
  useEffect(() => {
    const size = selectedGuest.partySize || 4;
    setSelectedSeats(Array.from({ length: size }, (_, i) => i + 1));
  }, [selectedGuest.id, selectedGuest.partySize]);

  // Extract kitchen notes from order notes (DB-synced via realtime)
  const extractKitchenNotes = useCallback((notes: string | undefined): string[] => {
    if (!notes) return [];
    return notes.split(' | ').map(n => n.replace(/^🔥\s*/, ''));
  }, []);

  const kitchenNotes = useMemo(() => extractKitchenNotes(selectedGuest.notes), [selectedGuest.notes, extractKitchenNotes]);

  const [showMobileOrderPanel, setShowMobileOrderPanel] = useState(false);
  const [isTipSheetOpen, setIsTipSheetOpen] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  
  // Transfer & Merge state (matching TableOrderDetails flow)
  const [showTransferIntentDialog, setShowTransferIntentDialog] = useState(false);
  const [transferIntentOrderId, setTransferIntentOrderId] = useState<string | null>(null);
  const [showTransferToOrderDialog, setShowTransferToOrderDialog] = useState(false);
  const [selectedTransferOrderId, setSelectedTransferOrderId] = useState<string | null>(null);
  const [transferToOrderSourceId, setTransferToOrderSourceId] = useState<string | null>(null);
  const [showInlineTransferView, setShowInlineTransferView] = useState(false);
  const [inlineTransferOrderId, setInlineTransferOrderId] = useState<string | null>(null);
  const [inlineTransferIsEntire, setInlineTransferIsEntire] = useState(false);
  const [inlineTransferTarget, setInlineTransferTarget] = useState<'table' | 'order'>('table');
  
  // Dynamic timer state - updates every second
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Update current time every second for dynamic timers
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  
  // Refund flow state
  const [refundStep, setRefundStep] = useState<RefundStep | null>(null);
  const [refundReason, setRefundReason] = useState<RefundReason>('customer-dissatisfaction');
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [selectedRefundItems, setSelectedRefundItems] = useState<RefundItem[]>([]);
  const [selectedRefundModifiers, setSelectedRefundModifiers] = useState<RefundModifier[]>([]);
  const [expandedRefundItems, setExpandedRefundItems] = useState<Set<number>>(new Set());
  const [customRefundAmount, setCustomRefundAmount] = useState("");
  const [tipRefundAmount, setTipRefundAmount] = useState("");
  const [includeRefundTip, setIncludeRefundTip] = useState(true); // Toggle for including tip in refund
  const [swipeRefundTarget, setSwipeRefundTarget] = useState<SwipeRefundTarget | null>(null);
  const [refundedItems, setRefundedItems] = useState<Set<string>>(new Set()); // Track refunded items/modifiers (for swipe refunds)
  
  // Split payment refund state
  const [refundAllocations, setRefundAllocations] = useState<RefundAllocation[]>([]);
  const [useCustomAllocation, setUseCustomAllocation] = useState(false); // Toggle for custom vs proportional allocation
  const [originalRefundType, setOriginalRefundType] = useState<RefundStep | null>(null); // Track original refund type before confirmation
  
  // Persisted refund records for visual indicators
  const [refundedItemRecords, setRefundedItemRecords] = useState<RefundedItemRecord[]>([]);
  const [refundedModifierRecords, setRefundedModifierRecords] = useState<RefundedModifierRecord[]>([]);
  const [refundedTipRecords, setRefundedTipRecords] = useState<RefundedTipRecord[]>([]);
  const [refundTransactionRecords, setRefundTransactionRecords] = useState<RefundTransactionRecord[]>([]);
  
  // State for expanded refund transactions list
  const [expandedRefundTransactions, setExpandedRefundTransactions] = useState<Set<string>>(new Set());
  
  // Helper to get refund transactions for an order
  const getRefundTransactionsForOrder = (orderId: string): RefundTransactionRecord[] => {
    return refundTransactionRecords.filter(r => r.orderId === orderId);
  };
  
  // Helper to toggle refund transactions expansion
  const toggleRefundTransactionsExpanded = (orderId: string) => {
    setExpandedRefundTransactions(prev => {
      const next = new Set(prev);
      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
      }
      return next;
    });
  };
  
  // Helper to get refunded quantity for an item in an order
  const getRefundedQtyForItem = (orderId: string, itemIndex: number): number => {
    const record = refundedItemRecords.find(r => r.orderId === orderId && r.itemIndex === itemIndex);
    const result = record?.refundedQty || 0;
    return result;
  };
  
  // Helper to check if a modifier is refunded
  const isModifierRefunded = (orderId: string, itemIndex: number, modifierIndex: number): boolean => {
    return refundedModifierRecords.some(r => 
      r.orderId === orderId && r.itemIndex === itemIndex && r.modifierIndex === modifierIndex
    );
  };
  
  // Helper to get refunded tip amount for an order
  const getRefundedTipAmount = (orderId: string): number => {
    const record = refundedTipRecords.find(r => r.orderId === orderId);
    return record?.refundedAmount || 0;
  };

  // Sync orderNotes from DB when switching orders
  useEffect(() => {
    if (selectedGuest.id && selectedGuest.id !== FALLBACK_SELECTED_GUEST_ID) {
      setOrderNotes(prev => {
        if (prev[selectedGuest.id] === undefined && selectedGuest.notes) {
          return { ...prev, [selectedGuest.id]: selectedGuest.notes };
        }
        return prev;
      });
    }
  }, [selectedGuest.id, selectedGuest.notes]);

  // Helper to calculate remaining refundable amount for an order
  const getRemainingRefundableAmount = (guest: GuestOrder): number => {
    const orderId = guest.id;
    
    // Check if all items are fully refunded
    let allItemsFullyRefunded = true;
    guest.items.forEach((item, index) => {
      const refundedQty = getRefundedQtyForItem(orderId, index);
      if (refundedQty < item.qty) {
        allItemsFullyRefunded = false;
      }
    });
    
    // Check if all priced modifiers are refunded
    let allModifiersRefunded = true;
    guest.items.forEach((item, itemIndex) => {
      if (item.richModifiers) {
        item.richModifiers.forEach((mod, modIndex) => {
          if (mod.price && mod.price > 0 && !isModifierRefunded(orderId, itemIndex, modIndex)) {
            allModifiersRefunded = false;
          }
        });
      }
    });
    
    // Get refunded tip
    const refundedTip = getRefundedTipAmount(orderId);
    const tipFullyRefunded = guest.tip <= 0 || refundedTip >= guest.tip;
    
    // If all items, modifiers, and tip are refunded, remaining is 0
    if (allItemsFullyRefunded && allModifiersRefunded && tipFullyRefunded) {
      return 0;
    }
    
    // If all items and modifiers are refunded but tip is not, only tip remains
    if (allItemsFullyRefunded && allModifiersRefunded && !tipFullyRefunded) {
      return guest.tip - refundedTip;
    }
    
    // Total original amount (including tip)
    const totalOriginal = guest.total + guest.tip;
    
    // Calculate refunded items amount
    let refundedItemsAmount = 0;
    guest.items.forEach((item, index) => {
      const refundedQty = getRefundedQtyForItem(orderId, index);
      refundedItemsAmount += item.price * refundedQty;
    });
    
    // Calculate refunded modifiers amount
    let refundedModifiersAmount = 0;
    guest.items.forEach((item, itemIndex) => {
      if (item.richModifiers) {
        item.richModifiers.forEach((mod, modIndex) => {
          if (mod.price && isModifierRefunded(orderId, itemIndex, modIndex)) {
            refundedModifiersAmount += mod.price;
          }
        });
      }
    });
    
    // Calculate proportional tax and service charge for refunded items
    const refundedSubtotal = refundedItemsAmount + refundedModifiersAmount;
    const originalSubtotal = guest.subtotal;
    const refundProportion = originalSubtotal > 0 ? refundedSubtotal / originalSubtotal : 0;
    const proportionalTax = guest.tax * refundProportion;
    const proportionalServiceCharge = guest.serviceCharge * refundProportion;
    
    // Total refunded (with proportional tax and service charge)
    const totalRefunded = refundedItemsAmount + refundedModifiersAmount + proportionalTax + proportionalServiceCharge + refundedTip;
    
    return Math.max(0, totalOriginal - totalRefunded);
  };
  
  // Helper to calculate total refunded amount for an order (including proportional tax and service charge)
  const getTotalRefundedAmount = (guest: GuestOrder): number => {
    const orderId = guest.id;
    
    // First, check if there are transaction records - use their sum as the source of truth
    const transactions = getRefundTransactionsForOrder(orderId);
    if (transactions.length > 0) {
      return transactions.reduce((sum, txn) => sum + txn.amount, 0);
    }
    
    // Fallback to item-based calculation if no transaction records exist
    // Calculate total refunded items amount (base prices)
    let refundedItemsAmount = 0;
    guest.items.forEach((item, index) => {
      const refundedQty = getRefundedQtyForItem(orderId, index);
      refundedItemsAmount += item.price * refundedQty;
    });
    
    // Calculate total refunded modifiers amount
    let refundedModifiersAmount = 0;
    guest.items.forEach((item, itemIndex) => {
      if (item.richModifiers) {
        item.richModifiers.forEach((mod, modIndex) => {
          if (mod.price && isModifierRefunded(orderId, itemIndex, modIndex)) {
            refundedModifiersAmount += mod.price;
          }
        });
      }
    });
    
    // Calculate proportional tax and service charge for refunded items
    const refundedSubtotal = refundedItemsAmount + refundedModifiersAmount;
    const originalSubtotal = guest.subtotal; // This is before discount
    
    // Calculate the proportion of subtotal that was refunded
    const refundProportion = originalSubtotal > 0 ? refundedSubtotal / originalSubtotal : 0;
    
    // Apply same proportion to tax and service charge
    const proportionalTax = guest.tax * refundProportion;
    const proportionalServiceCharge = guest.serviceCharge * refundProportion;
    
    // Get refunded tip
    const refundedTip = getRefundedTipAmount(orderId);
    
    // Total refunded includes items, modifiers, proportional tax, proportional service charge, and tip
    return refundedItemsAmount + refundedModifiersAmount + proportionalTax + proportionalServiceCharge + refundedTip;
  };
  
  // Check if order is fully refunded (full amount + tip)
  const isFullyRefundedOrder = (guest: GuestOrder): boolean => {
    return getRemainingRefundableAmount(guest) <= 0 && getTotalRefundedAmount(guest) > 0;
  };
  
  // Check if order is partially refunded (any refund but not full)
  const isPartiallyRefundedOrder = (guest: GuestOrder): boolean => {
    const totalRefunded = getTotalRefundedAmount(guest);
    const remaining = getRemainingRefundableAmount(guest);
    return totalRefunded > 0 && remaining > 0;
  };
  
  // Get the refund status label for display
  const getRefundStatusLabel = (guest: GuestOrder): 'FULLY REFUNDED' | 'PARTIALLY REFUNDED' | null => {
    if (isFullyRefundedOrder(guest)) return 'FULLY REFUNDED';
    if (isPartiallyRefundedOrder(guest)) return 'PARTIALLY REFUNDED';
    return null;
  };
  
  // Check if full refund is still available (order total not yet refunded)
  const isFullRefundAvailable = (guest: GuestOrder): boolean => {
    const orderId = guest.id;
    // Calculate how much of the order (excluding tip) has been refunded
    let refundedItemsAmount = 0;
    guest.items.forEach((item, index) => {
      const refundedQty = getRefundedQtyForItem(orderId, index);
      refundedItemsAmount += item.price * refundedQty;
    });
    
    let refundedModifiersAmount = 0;
    guest.items.forEach((item, itemIndex) => {
      if (item.richModifiers) {
        item.richModifiers.forEach((mod, modIndex) => {
          if (mod.price && isModifierRefunded(orderId, itemIndex, modIndex)) {
            refundedModifiersAmount += mod.price;
          }
        });
      }
    });
    
    const orderOnlyRefunded = refundedItemsAmount + refundedModifiersAmount;
    // Full refund available if less than total has been refunded
    return orderOnlyRefunded < guest.total;
  };
  
  // Check if tip refund is still available
  const isTipRefundAvailable = (guest: GuestOrder): boolean => {
    if (guest.tip <= 0) return false;
    const refundedTip = getRefundedTipAmount(guest.id);
    return refundedTip < guest.tip;
  };
  
  // Get remaining tip amount that can be refunded
  const getRemainingTipAmount = (guest: GuestOrder): number => {
    const refundedTip = getRefundedTipAmount(guest.id);
    return Math.max(0, guest.tip - refundedTip);
  };
  
  // Check if partial/custom refund is available (any remaining amount)
  const isPartialRefundAvailable = (guest: GuestOrder): boolean => {
    return getRemainingRefundableAmount(guest) > 0;
  };
  
  // Check if order has split payments
  const hasSplitPayments = (guest: GuestOrder): boolean => {
    return !!guest.paymentMethods && guest.paymentMethods.length > 1;
  };
  
  // Get payment method icon based on type
  const getPaymentMethodIcon = (type: PaymentMethod['type']): string => {
    switch (type) {
      case 'credit_card': return '💳';
      case 'debit_card': return '💳';
      case 'cash': return '💵';
      case 'gift_card': return '🎁';
      default: return '💳';
    }
  };
  
  // Format payment methods display for split payments
  const formatPaymentMethodsDisplay = (guest: GuestOrder, compact: boolean = false): { primary: string; secondary?: string; full: string[] } => {
    // If no payment methods array or single/no payment, use paymentType
    if (!guest.paymentMethods || guest.paymentMethods.length === 0) {
      return { primary: guest.paymentType, full: [guest.paymentType] };
    }
    
    // Single payment method
    if (guest.paymentMethods.length === 1) {
      return { primary: guest.paymentMethods[0].label, full: [guest.paymentMethods[0].label] };
    }
    
    // Multiple payment methods
    const labels = guest.paymentMethods.map(pm => pm.label);
    
    if (compact) {
      // For compact display: "Visa •••• 1234 + 2 more"
      const remaining = labels.length - 1;
      return {
        primary: labels[0],
        secondary: `+${remaining} more`,
        full: labels
      };
    }
    
    // For full display: "Visa •••• 1234 + Amex •••• 9876"
    if (labels.length === 2) {
      return {
        primary: `${labels[0]} + ${labels[1]}`,
        full: labels
      };
    }
    
    // For 3+ methods: "Visa •••• 1234 + Amex •••• 9876 + 1 more"
    return {
      primary: `${labels[0]} + ${labels[1]}`,
      secondary: `+${labels.length - 2} more`,
      full: labels
    };
  };
  
  // Get display payment type (either formatted split or single paymentType)
  const getDisplayPaymentType = (guest: GuestOrder): string => {
    if (hasSplitPayments(guest)) {
      const formatted = formatPaymentMethodsDisplay(guest, false);
      return formatted.secondary ? `${formatted.primary} ${formatted.secondary}` : formatted.primary;
    }
    return guest.paymentType;
  };
  
  // Calculate proportional refund allocation across payment methods
  const calculateProportionalRefundAllocation = (
    guest: GuestOrder, 
    refundAmount: number, 
    tipRefundAmount: number = 0
  ): RefundAllocation[] => {
    if (!guest.paymentMethods || guest.paymentMethods.length === 0) {
      return [];
    }
    
    // Calculate total paid (excluding tips from payment amounts since tips are tracked separately)
    const totalPaid = guest.paymentMethods.reduce((sum, pm) => sum + pm.amount, 0);
    const totalTip = guest.paymentMethods.reduce((sum, pm) => sum + (pm.tipAmount || 0), 0);
    
    return guest.paymentMethods.map(pm => {
      // Calculate proportion for this payment method
      const paymentProportion = pm.amount / totalPaid;
      const tipProportion = totalTip > 0 ? (pm.tipAmount || 0) / totalTip : 0;
      
      return {
        paymentMethodId: pm.id,
        refundAmount: Math.round(refundAmount * paymentProportion * 100) / 100,
        tipRefundAmount: Math.round(tipRefundAmount * tipProportion * 100) / 100
      };
    });
  };
  
  // Initialize refund allocations when refund flow starts
  const initializeRefundAllocations = (guest: GuestOrder, refundAmount: number, tipRefundAmount: number = 0) => {
    const allocations = calculateProportionalRefundAllocation(guest, refundAmount, tipRefundAmount);
    setRefundAllocations(allocations);
    setUseCustomAllocation(false);
  };
  
  // Update a specific payment method's refund allocation
  const updateRefundAllocation = (paymentMethodId: string, field: 'refundAmount' | 'tipRefundAmount', value: number) => {
    setRefundAllocations(prev => 
      prev.map(a => 
        a.paymentMethodId === paymentMethodId 
          ? { ...a, [field]: value }
          : a
      )
    );
    setUseCustomAllocation(true);
  };
  
  // Get total allocated refund amount
  const getTotalAllocatedRefund = (): number => {
    return refundAllocations.reduce((sum, a) => sum + a.refundAmount + a.tipRefundAmount, 0);
  };
  
  // Validate refund allocations don't exceed payment amounts
  const validateRefundAllocations = (guest: GuestOrder): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (!guest.paymentMethods) {
      return { valid: true, errors: [] };
    }
    
    refundAllocations.forEach(allocation => {
      const pm = guest.paymentMethods!.find(p => p.id === allocation.paymentMethodId);
      if (pm) {
        if (allocation.refundAmount > pm.amount) {
          errors.push(`Refund of ${formatPrice(allocation.refundAmount)} exceeds ${pm.label} payment of ${formatPrice(pm.amount)}`);
        }
        if (allocation.tipRefundAmount > (pm.tipAmount || 0)) {
          errors.push(`Tip refund of ${formatPrice(allocation.tipRefundAmount)} exceeds ${pm.label} tip of ${formatPrice(pm.tipAmount || 0)}`);
        }
      }
    });
    
    return { valid: errors.length === 0, errors };
  };
  
  // Get refund summary for display
  const getRefundSummary = () => {
    const totalRefund = getTotalAllocatedRefund();
    const itemsTotal = getPartialRefundTotal(false);
    const tipTotal = includeRefundTip ? getRemainingTipAmount(selectedGuest) : 0;
    
    return {
      itemsTotal,
      tipTotal,
      totalRefund: itemsTotal + tipTotal,
      reason: refundReasons.find(r => r.value === refundReason)?.label || 'Unknown'
    };
  };
  
  const [shakeCustomAmount, setShakeCustomAmount] = useState(false); // Shake animation for custom refund
  const [shakeTipAmount, setShakeTipAmount] = useState(false); // Shake animation for tip refund
  const [showFilterPanel, setShowFilterPanel] = useState(false); // Filter panel visibility (desktop/tablet)
  const [showSearchInput, setShowSearchInput] = useState(false); // Search input visibility
  const [searchQuery, setSearchQuery] = useState(""); // Search query
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false); // Mobile filters bottom sheet
  const [isReceiptDialogOpen, setIsReceiptDialogOpen] = useState(false); // Receipt options dialog
  const [isAIChatOpen, setIsAIChatOpen] = useState(false); // AI chat panel visibility
  const [isDiscountDialogOpen, setIsDiscountDialogOpen] = useState(false); // Discount dialog
  const [showDiscountMpin, setShowDiscountMpin] = useState(false); // MPIN gate for discount
  const [showRefundConfirmation, setShowRefundConfirmation] = useState(false); // Refund confirmation dialog
  const [appliedDiscounts, setAppliedDiscounts] = useState<Discount[]>([]); // Applied discounts
  // Seed ticketDiscounts from mock data on mount — reverse-map raw discount values to Discount objects
  const [ticketDiscounts, setTicketDiscounts] = useState<Record<string, Discount[]>>(() => {
    const seeded: Record<string, Discount[]> = {};
    for (const order of allOrders) {
      if (order.discount > 0) {
        // Try to match by exact amount
        const matchByAmount = availableDiscounts.find(d => d.type === 'amount' && d.value === order.discount);
        if (matchByAmount) {
          seeded[order.id] = [matchByAmount];
          continue;
        }
        // Try to match by percentage
        const matchByPercent = availableDiscounts.find(d => d.type === 'percentage' && Math.abs((order.subtotal * d.value / 100) - order.discount) < 0.01);
        if (matchByPercent) {
          seeded[order.id] = [matchByPercent];
          continue;
        }
        // No match — create synthetic custom discount
        seeded[order.id] = [{ id: `custom-${order.id}`, name: 'Custom Discount', type: 'amount', value: order.discount, icon: DollarSign } as Discount];
      }
    }
    return seeded;
  });

  // Get effective discounts for the currently selected ticket
  const EMPTY_DISCOUNTS: Discount[] = useMemo(() => [], []);
  const getTicketDiscounts = (ticketId: string): Discount[] => ticketDiscounts[ticketId] || EMPTY_DISCOUNTS;
  const currentTicketDiscounts = useMemo(() => selectedGuest ? (ticketDiscounts[selectedGuest.id] || EMPTY_DISCOUNTS) : EMPTY_DISCOUNTS, [ticketDiscounts, selectedGuest?.id, EMPTY_DISCOUNTS]);

  // Calculate discount amount from applied discounts for a ticket
  const getAppliedDiscountAmount = (ticketId: string, subtotal: number): number => {
    const discounts = getTicketDiscounts(ticketId);
    return discounts.reduce((sum, d) => {
      if (d.type === "percentage") return sum + (subtotal * d.value) / 100;
      return sum + d.value;
    }, 0);
  };

  // Effective discount: if ticketDiscounts has entries for this ticket, use only those (single source of truth)
  // Otherwise fall back to raw selectedGuest.discount
  const effectiveDiscount = selectedGuest
    ? (ticketDiscounts[selectedGuest.id]
      ? getAppliedDiscountAmount(selectedGuest.id, selectedGuest.subtotal)
      : selectedGuest.discount)
    : 0;

  // Handle applying discounts to current ticket
  const handleApplyTicketDiscounts = (discounts: Discount[]) => {
    setTicketDiscounts(prev => ({
      ...prev,
      [selectedGuest.id]: discounts,
    }));
    setAppliedDiscounts(discounts);
  };

  // Check if discount is allowed (only for UNPAID / ORDERING)
  const isDiscountAllowed = selectedGuest ? !(selectedGuest.status === "PAID" || selectedGuest.paid || selectedGuest.status === "COMPLETED") : false;

  // Handle discount button click - goes through MPIN gate
  const handleDiscountClick = () => {
    if (!isDiscountAllowed) return;
    setShowDiscountMpin(true);
  };
  const [noTaxItems, setNoTaxItems] = useState<Set<string>>(new Set()); // Items with no tax applied
  const [removedItems, setRemovedItems] = useState<Set<string>>(new Set()); // Items removed from order
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false); // Clear order confirmation dialog
  const [cancelReason, setCancelReason] = useState('');
  const [customCancelReason, setCustomCancelReason] = useState('');
  const [cancelWriteOffChoice, setCancelWriteOffChoice] = useState<'write_off' | 'without' | null>(null);
  const [taxExemptTickets, setTaxExemptTickets] = useState<Set<string>>(new Set()); // Whole-ticket tax exemption
  const [showNoTaxDialog, setShowNoTaxDialog] = useState(false); // No Tax confirmation dialog
  
  const isCurrentTicketTaxExempt = selectedGuest ? taxExemptTickets.has(selectedGuest.id) : false;
  
  const handleNoTaxClick = () => {
    if (isCurrentTicketTaxExempt) {
      // Toggle off
      setTaxExemptTickets(prev => {
        const next = new Set(prev);
        next.delete(selectedGuest.id);
        return next;
      });
    } else {
      setShowNoTaxDialog(true);
    }
  };
  
  const handleConfirmNoTax = () => {
    setTaxExemptTickets(prev => new Set(prev).add(selectedGuest.id));
    setShowNoTaxDialog(false);
  };
  
  // Calculate adjusted totals based on no-tax and removed items
  const calculateAdjustedTotals = (guest: GuestOrder) => {
    const TAX_RATE = guest.tax / (guest.subtotal - guest.discount); // Calculate effective tax rate
    let noTaxSubtotal = 0;
    let removedSubtotal = 0;
    
    const isTicketTaxExempt = taxExemptTickets.has(guest.id);
    
    guest.items.forEach((item, index) => {
      const itemKey = `${guest.id}-${index}-${item.name}`;
      const itemTotal = item.price * item.qty;
      
      if (removedItems.has(itemKey)) {
        removedSubtotal += itemTotal;
      } else if (noTaxItems.has(itemKey)) {
        noTaxSubtotal += itemTotal;
      }
    });
    
    const adjustedSubtotal = guest.subtotal - removedSubtotal;
    const taxableAmount = adjustedSubtotal - guest.discount - noTaxSubtotal;
    const adjustedTax = isTicketTaxExempt ? 0 : Math.max(0, taxableAmount * TAX_RATE);
    const taxSavings = guest.tax - adjustedTax;
    const adjustedTotal = guest.total - taxSavings - removedSubtotal;
    
    return {
      originalTax: guest.tax,
      adjustedTax,
      taxSavings,
      originalTotal: guest.total,
      adjustedTotal,
      adjustedSubtotal,
      removedSubtotal,
      hasNoTaxItems: noTaxSubtotal > 0 || isTicketTaxExempt,
      hasRemovedItems: removedSubtotal > 0,
      isTicketTaxExempt
    };
  };
  
  // Handle clearing/voiding the current order
  const handleClearOrder = () => {
    const reason = cancelReason === '__custom__' ? customCancelReason.trim() : cancelReason;
    const writeOff = cancelWriteOffChoice === 'write_off';
    console.log('[Tickets CancelOrder] order:', selectedGuest.id, 'reason:', reason, 'writeOff:', writeOff);
    
    // Process write-off or inventory restoration for cancelled items
    const cancelItems = selectedGuest.items || [];
    if (cancelItems.length > 0) {
      processCancelledItems(
        cancelItems.map((item: any) => ({ name: item.name, price: item.price, quantity: item.quantity || 1, isFired: !!item.isFired })),
        selectedGuest.id,
        reason || 'Order cancelled',
        writeOff
      );
    }
    
    // Persist cancellation to database
    if (selectedGuest.id) {
      updateTicketOrder(selectedGuest.id, { status: 'CANCELLED' })?.catch?.(console.error);
      try { updateOrder(selectedGuest.id, { status: 'CANCELLED' as any }); } catch(e) { console.error(e); }
    }
    
    // Mark all items as removed for the current order
    const newRemovedItems = new Set(removedItems);
    selectedGuest.items.forEach((item, index) => {
      const itemKey = `${selectedGuest.id}-${index}-${item.name}`;
      newRemovedItems.add(itemKey);
    });
    setRemovedItems(newRemovedItems);
    // Clear any no-tax items for this order
    const newNoTaxItems = new Set(noTaxItems);
    selectedGuest.items.forEach((item, index) => {
      const itemKey = `${selectedGuest.id}-${index}-${item.name}`;
      newNoTaxItems.delete(itemKey);
    });
    setNoTaxItems(newNoTaxItems);
    
    // Reset selected guest to next available order
    const remainingOrders = allOrders.filter(o => o.id !== selectedGuest.id);
    setSelectedGuest(remainingOrders[0] ?? FALLBACK_SELECTED_GUEST);
    
    setIsClearDialogOpen(false);
    toast.success('Order cancelled');
  };
  
  const handleClearOrderAttempt = () => {
    setCancelReason('');
    setCustomCancelReason('');
    setCancelWriteOffChoice(null);
    setIsClearDialogOpen(true);
  };
  
  // Order notes state - stores updated notes by order ID
  const [orderNotes, setOrderNotes] = useState<{ [orderId: string]: string }>({});
  
  // Guest info state - stores updated name/phone by order ID
  const [guestInfo, setGuestInfo] = useState<{ [orderId: string]: { name: string; phone: string } }>({});
  
  // Format phone number for display
  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length === 0) return '';
    if (digits.length <= 3) return `(${digits}`;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  };
  
  // Get current guest info (use updated info if available, otherwise original)
  const getCurrentGuestName = (orderId: string, originalName: string) => {
    return guestInfo[orderId]?.name !== undefined ? guestInfo[orderId].name : originalName;
  };
  
  const getCurrentGuestPhone = (orderId: string, originalPhone: string) => {
    return guestInfo[orderId]?.phone !== undefined ? guestInfo[orderId].phone : originalPhone.replace(/\D/g, '');
  };
  
  // Handle guest name change
  const handleGuestNameChange = (orderId: string, newName: string) => {
    setGuestInfo(prev => ({
      ...prev,
      [orderId]: {
        ...prev[orderId],
        name: newName,
        phone: prev[orderId]?.phone ?? ''
      }
    }));
  };
  
  // Handle guest phone change
  const handleGuestPhoneChange = (orderId: string, newPhone: string) => {
    setGuestInfo(prev => ({
      ...prev,
      [orderId]: {
        ...prev[orderId],
        name: prev[orderId]?.name ?? '',
        phone: newPhone.replace(/\D/g, '')
      }
    }));
  };
  
  // Get current notes for selected guest (use updated notes if available, otherwise original)
  // Strip any legacy fire emoji prefixes from notes
  const getCurrentNotes = (orderId: string, originalNotes: string) => {
    const raw = orderNotes[orderId] !== undefined ? orderNotes[orderId] : originalNotes;
    return raw ? raw.replace(/🔥\s*/g, '').trim() : raw;
  };
  
   // Check if order can have notes edited (all statuses except PAID and COMPLETED)
   const canEditNotes = (status: string) => {
     return status !== "PAID" && status !== "COMPLETED";
   };
  
  // Handle notes change - update immediately
  const handleNotesChange = (orderId: string, newNotes: string) => {
    setOrderNotes(prev => ({
      ...prev,
      [orderId]: newNotes
    }));
  };
  
  // Notes suggestion state
  const [notesFocused, setNotesFocused] = useState(false);
  const [notesSearchTerm, setNotesSearchTerm] = useState("");
  
  // Get recent notes from all orders (excluding current order)
  const recentNotes = useMemo(() => {
    return allOrders
      .filter(order => order.notes && order.notes.trim().length > 0)
      .map(order => order.notes);
  }, []);
  
  // Handle note suggestion selection - replace the current search term with the suggestion
  const handleNoteSuggestionSelect = (orderId: string, _currentNotes: string, suggestion: string) => {
    // Read latest notes from state to avoid stale closure
    const latestNotes = orderNotes[orderId] || "";
    // Replace the current search term with the suggestion and add trailing comma to commit as chip
    if (notesSearchTerm && latestNotes.endsWith(notesSearchTerm)) {
      const baseNotes = latestNotes.slice(0, latestNotes.length - notesSearchTerm.length).replace(/[,\s]+$/, '');
      const newNotes = baseNotes ? `${baseNotes}, ${suggestion},` : `${suggestion},`;
      handleNotesChange(orderId, newNotes);
    } else if (latestNotes) {
      // Strip any trailing comma/space before appending
      const cleanBase = latestNotes.replace(/[,\s]+$/, '');
      const newNotes = cleanBase ? `${cleanBase}, ${suggestion},` : `${suggestion},`;
      handleNotesChange(orderId, newNotes);
    } else {
      handleNotesChange(orderId, `${suggestion},`);
    }
    setNotesSearchTerm("");
  };
  
  // Handle notes input change with search term tracking
  const handleNotesInputChange = (orderId: string, value: string, originalNotes: string) => {
    handleNotesChange(orderId, value);
    // Track the last word being typed for suggestions
    const words = value.split(/[,\s]+/);
    const lastWord = words[words.length - 1] || "";
    setNotesSearchTerm(lastWord);
  };

  // Remove a specific note chip from saved order notes
  const removeOrderNoteChip = useCallback(async (orderId: string, noteToRemove: string) => {
    const currentNotes = selectedGuest.notes || "";
    const notesList = currentNotes.split(/,\s*/).filter(n => n.trim()).filter(n => n.trim() !== noteToRemove.trim());
    const updatedNotes = notesList.join(', ');
    await updateTicketOrder(orderId, { notes: updatedNotes });
    setSelectedGuest(prev => prev.id === orderId ? { ...prev, notes: updatedNotes } : prev);
  }, [selectedGuest, updateTicketOrder]);

  // Remove a typed (unsent) note chip
  const removeTypedNoteChip = useCallback((orderId: string, noteToRemove: string) => {
    const current = orderNotes[orderId] || "";
    const notesList = current.split(/,\s*/).filter(n => n.trim()).filter(n => n.trim() !== noteToRemove.trim());
    handleNotesChange(orderId, notesList.join(', '));
  }, [orderNotes, handleNotesChange]);

  const [instructionSentOrders, setInstructionSentOrders] = useState<Set<string>>(new Set());
  const [instructionDirtyOrders, setInstructionDirtyOrders] = useState<Set<string>>(new Set());

  // Send kitchen instruction to KDS via kds_messages table
  const sendKitchenInstruction = useCallback(async (orderId: string, instructionText: string, orderNumber: number) => {
    if (!instructionText.trim()) return;
    // Clean trailing commas from chip format
    const cleanedText = instructionText.replace(/,\s*$/, '').trim();
    if (!cleanedText) return;
    try {
      await (supabase as any).from('kds_messages').insert({
        message_id: `kitchen-instr-${orderId}-${Date.now()}`,
        message_text: cleanedText,
        store_id: 'default',
        terminal_id: 'tickets-module',
        terminal_name: 'Tickets',
        employee_id: 'system',
        employee_name: selectedGuest.server || 'Staff',
        employee_role: null,
        table_id: selectedGuest.table || null,
        table_number: selectedGuest.table || null,
        linked_order_id: orderId,
        linked_order_number: orderNumber,
        linked_order_ids: [orderId],
        link_type: 'order',
        status: 'pending',
      });
      // Also persist instruction to order notes in DB
      const combinedNotes = (() => {
        const existing = allOrders.find(o => o.id === orderId)?.notes || "";
        const existingTrimmed = existing.trim();
        if (existingTrimmed) return `${cleanedText}, ${existingTrimmed}`;
        return cleanedText;
      })();
      await updateTicketOrder(orderId, { notes: combinedNotes });
      // Clear the input field after sending
      setOrderNotes(prev => ({ ...prev, [orderId]: "" }));
      // Update selectedGuest notes so the read-only block shows updated notes
      setSelectedGuest(prev => prev.id === orderId ? { ...prev, notes: combinedNotes } : prev);
      setInstructionSentOrders(prev => new Set(prev).add(orderId));
      setInstructionDirtyOrders(prev => {
        const next = new Set(prev);
        next.delete(orderId);
        return next;
      });
      return true;
    } catch (err) {
      console.error('Failed to send kitchen instruction:', err);
      return false;
    }
  }, [selectedGuest, updateTicketOrder]);

  // Check if an order has been fired (status beyond ORDERING)
  const isOrderFired = useCallback((status: string) => {
    return status !== 'ORDERING';
  }, []);

  // Handle notes change with dirty tracking for post-fire edits
  const handleKitchenInstructionChange = useCallback((orderId: string, value: string, originalNotes: string, orderStatus: string) => {
    handleNotesChange(orderId, value);
    const words = value.split(/[,\s]+/);
    const lastWord = words[words.length - 1] || "";
    setNotesSearchTerm(lastWord);
    if (isOrderFired(orderStatus)) {
      setInstructionDirtyOrders(prev => new Set(prev).add(orderId));
    }
  }, [handleNotesChange, isOrderFired]);


  const [mobileFilters, setMobileFilters] = useState<MobileFiltersState>({
    revenueCenter: null,
    datePreset: 'today',
    customDateStart: undefined,
    customDateEnd: undefined,
    employee: null,
    orderType: null,
    orderStatus: null,
    paymentType: null,
  });
  
  // Advanced filter states (for desktop/tablet)
  const [activeFilterPopover, setActiveFilterPopover] = useState<string | null>(null);
  const [filterRevenueCenter, setFilterRevenueCenter] = useState<string | null>(null);
  const [filterDate, setFilterDate] = useState<Date | undefined>(undefined);
  const [filterEmployee, setFilterEmployee] = useState<string | null>(null);
  const [filterOrderType, setFilterOrderType] = useState<string | null>(null);
  const [filterOrderStatus, setFilterOrderStatus] = useState<string | null>(null);
  const [filterPaymentType, setFilterPaymentType] = useState<string | null>(null);
  
  // Get unique values for filter options
  const filterOptions = useMemo(() => ({
    revenueCenters: [...new Set(allOrders.map(o => o.revenueCenter))],
    employees: [...new Set(allOrders.map(o => o.server))],
    orderTypes: [...new Set(allOrders.map(o => o.orderType))],
    orderStatuses: [...new Set(allOrders.map(o => o.status))],
    paymentTypes: [...new Set(allOrders.filter(o => o.paymentType !== "--").map(o => o.paymentType)), "Unpaid"],
  }), []);
  
  // Check if any advanced filter is active (desktop/tablet)
  const hasActiveFilters = filterRevenueCenter || filterDate || filterEmployee || filterOrderType || filterOrderStatus || filterPaymentType;
  
  // Check if any mobile filter is active
  const hasMobileActiveFilters = 
    mobileFilters.revenueCenter !== null ||
    mobileFilters.datePreset !== 'today' ||
    mobileFilters.employee !== null ||
    mobileFilters.orderType !== null ||
    mobileFilters.orderStatus !== null ||
    mobileFilters.paymentType !== null;
  
  // Clear all advanced filters (desktop/tablet)
  const clearAllFilters = () => {
    setFilterRevenueCenter(null);
    setFilterDate(undefined);
    setFilterEmployee(null);
    setFilterOrderType(null);
    setFilterOrderStatus(null);
    setFilterPaymentType(null);
  };
  
  // Handle mobile filters apply
  const handleMobileFiltersApply = (filters: MobileFiltersState) => {
    setMobileFilters(filters);
  };

  const handleTipSelect = async (tipAmount: number) => {
    // tipAmount is the ADDITIONAL tip to add (additive model)
    if (tipAmount > 0) {
      const existingTip = selectedGuest.tip;
      const newTotalTip = existingTip + tipAmount;
      const newTotal = selectedGuest.total + tipAmount;
      
      // Persist to database
      try {
        await updateTicketOrder(selectedGuest.id, { tip: newTotalTip, total: newTotal });
      } catch (err) {
        console.error('Failed to persist tip:', err);
      }
      
      // Update local state
      setSelectedGuest(prev => ({ ...prev, tip: newTotalTip, total: newTotal }));
    }
    // If tipAmount is 0 (No Tip selected), keep existing tip unchanged

    // Send kitchen instruction to KDS when FIRE is tapped
    const currentInstruction = getCurrentNotes(selectedGuest.id, selectedGuest.notes);
    if (currentInstruction && currentInstruction.trim()) {
      await sendKitchenInstruction(selectedGuest.id, currentInstruction, selectedGuest.orderNumber);
    }
  };

  // Refund flow handlers
  const handleCloseTicket = () => {
    setRefundStep('closed');
  };

  const handleOpenRefundModal = () => {
    setIsRefundModalOpen(true);
    setRefundStep('type-selection');
  };

  const handleSelectRefundType = (type: 'full' | 'partial' | 'tip' | 'custom') => {
    if (type === 'full') {
      // Initialize allocations for split payments
      const refundAmount = selectedGuest.total;
      const tipAmount = includeRefundTip ? selectedGuest.tip : 0;
      if (hasSplitPayments(selectedGuest)) {
        initializeRefundAllocations(selectedGuest, refundAmount, tipAmount);
      }
      setRefundStep('full-refund');
    } else if (type === 'partial') {
      setSelectedRefundItems([]);
      setSelectedRefundModifiers([]);
      setExpandedRefundItems(new Set());
      setRefundAllocations([]);
      setRefundStep('partial-refund');
    } else if (type === 'tip') {
      // Initialize with full tip amount
      setTipRefundAmount(getRemainingTipAmount(selectedGuest).toFixed(2));
      if (hasSplitPayments(selectedGuest)) {
        initializeRefundAllocations(selectedGuest, 0, getRemainingTipAmount(selectedGuest));
      }
      setRefundStep('tip-refund');
    } else if (type === 'custom') {
      setCustomRefundAmount("");
      setRefundAllocations([]);
      setRefundStep('custom-refund');
    }
  };

  const handleKeypadInput = (key: string) => {
    if (key === 'backspace') {
      setCustomRefundAmount(prev => prev.slice(0, -1));
    } else if (key === 'clear') {
      setCustomRefundAmount("");
    } else if (key === '.') {
      // Only allow one decimal point
      if (!customRefundAmount.includes('.')) {
        setCustomRefundAmount(prev => prev + '.');
      }
    } else {
      // Limit to 2 decimal places
      const parts = customRefundAmount.split('.');
      if (parts[1] && parts[1].length >= 2) return;
      // Limit total length
      if (customRefundAmount.length >= 8) return;
      // Don't allow exceeding max refund amount
      const newValue = customRefundAmount + key;
      if (parseFloat(newValue) > selectedGuest.total) {
        setShakeCustomAmount(true);
        setTimeout(() => setShakeCustomAmount(false), 400);
        return;
      }
      setCustomRefundAmount(newValue);
    }
  };

  const getCustomRefundValue = () => {
    const value = parseFloat(customRefundAmount) || 0;
    return Math.min(value, selectedGuest.total);
  };

  const isCustomAmountValid = () => {
    const value = getCustomRefundValue();
    return value > 0 && value <= selectedGuest.total;
  };

  // Tip refund helpers
  const handleTipKeypadInput = (key: string) => {
    if (key === 'backspace') {
      setTipRefundAmount(prev => prev.slice(0, -1));
    } else if (key === 'clear') {
      setTipRefundAmount("");
    } else if (key === '.') {
      if (!tipRefundAmount.includes('.')) {
        setTipRefundAmount(prev => prev + '.');
      }
    } else {
      const parts = tipRefundAmount.split('.');
      if (parts[1] && parts[1].length >= 2) return;
      if (tipRefundAmount.length >= 8) return;
      // Don't allow exceeding max tip amount
      const newValue = tipRefundAmount + key;
      if (parseFloat(newValue) > selectedGuest.tip) {
        setShakeTipAmount(true);
        setTimeout(() => setShakeTipAmount(false), 400);
        return;
      }
      setTipRefundAmount(newValue);
    }
  };

  const getTipRefundValue = () => {
    const value = parseFloat(tipRefundAmount) || 0;
    return Math.min(value, selectedGuest.tip);
  };

  const isTipAmountValid = () => {
    const value = getTipRefundValue();
    return value > 0 && value <= selectedGuest.tip;
  };

  const toggleRefundItem = (index: number, item: OrderItem) => {
    // Calculate remaining refundable quantity
    const refundedQty = getRefundedQtyForItem(selectedGuest.id, index);
    const remainingQty = item.qty - refundedQty;
    
    // Don't allow selecting fully refunded items
    if (remainingQty <= 0) return;
    
    setSelectedRefundItems(prev => {
      const existing = prev.find(r => r.index === index);
      if (existing) {
        // Remove item
        return prev.filter(r => r.index !== index);
      } else {
        // Add item with remaining refundable quantity
        return [...prev, {
          index,
          qty: remainingQty,
          maxQty: remainingQty,
          name: item.name,
          unitPrice: item.price
        }];
      }
    });
  };

  const updateRefundItemQty = (index: number, newQty: number) => {
    setSelectedRefundItems(prev => 
      prev.map(item => 
        item.index === index 
          ? { ...item, qty: Math.max(1, Math.min(newQty, item.maxQty)) }
          : item
      )
    );
  };

  const getPartialRefundTotal = (includeTip: boolean = false) => {
    const itemsTotal = selectedRefundItems.reduce((sum, item) => sum + (item.unitPrice * item.qty), 0);
    const modifiersTotal = selectedRefundModifiers.reduce((sum, mod) => sum + mod.price, 0);
    // Use remaining tip amount instead of full tip
    const tipAmount = includeTip && selectedGuest ? getRemainingTipAmount(selectedGuest) : 0;
    return itemsTotal + modifiersTotal + tipAmount;
  };

  // Toggle expansion of item to show modifiers
  const toggleItemExpansion = (index: number) => {
    setExpandedRefundItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  // Toggle modifier selection for refund
  const toggleRefundModifier = (itemIndex: number, modifierIndex: number, modifier: ModifierItem) => {
    if (!modifier.price || modifier.price <= 0) return; // Can't refund free modifiers
    
    // Don't allow selecting already-refunded modifiers
    if (isModifierRefunded(selectedGuest.id, itemIndex, modifierIndex)) return;
    
    setSelectedRefundModifiers(prev => {
      const existing = prev.find(m => m.itemIndex === itemIndex && m.modifierIndex === modifierIndex);
      if (existing) {
        return prev.filter(m => !(m.itemIndex === itemIndex && m.modifierIndex === modifierIndex));
      } else {
        return [...prev, {
          itemIndex,
          modifierIndex,
          name: modifier.text,
          price: modifier.price
        }];
      }
    });
  };

  // Check if modifier is selected for refund
  const isModifierSelectedForRefund = (itemIndex: number, modifierIndex: number) => {
    return selectedRefundModifiers.some(m => m.itemIndex === itemIndex && m.modifierIndex === modifierIndex);
  };

  // Get count of selected modifiers for an item
  const getSelectedModifiersCount = (itemIndex: number) => {
    return selectedRefundModifiers.filter(m => m.itemIndex === itemIndex).length;
  };

  // Get total selections count (items + modifiers)
  const getTotalRefundSelectionsCount = () => {
    return selectedRefundItems.length + selectedRefundModifiers.length;
  };

  const handleProceedRefund = () => {
    // Save the original refund type before changing to confirmation
    setOriginalRefundType(refundStep);
    
    // For split payments, initialize allocations and go to confirmation
    if (hasSplitPayments(selectedGuest)) {
      let refundAmount = 0;
      let tipAmount = 0;
      
      if (refundStep === 'full-refund') {
        refundAmount = selectedGuest.total;
        tipAmount = includeRefundTip ? selectedGuest.tip : 0;
      } else if (refundStep === 'partial-refund') {
        refundAmount = getPartialRefundTotal(false);
        tipAmount = includeRefundTip ? getRemainingTipAmount(selectedGuest) : 0;
      } else if (refundStep === 'tip-refund') {
        refundAmount = 0;
        tipAmount = getTipRefundValue();
      } else if (refundStep === 'custom-refund') {
        refundAmount = getCustomRefundValue();
        tipAmount = 0;
      } else if (refundStep === 'item-refund' && swipeRefundTarget) {
        refundAmount = swipeRefundTarget.price;
        tipAmount = 0;
      }
      
      // Only reinitialize if allocations are empty (first time)
      if (refundAllocations.length === 0) {
        initializeRefundAllocations(selectedGuest, refundAmount, tipAmount);
      }
      
      setRefundStep('confirmation');
    } else {
      // For single payment orders, also go to confirmation step (not AppleAlertDialog)
      setRefundStep('confirmation');
    }
  };

  const handleConfirmRefund = async () => {
    setShowRefundConfirmation(false);
    const orderId = selectedGuest.id;
    
    // Handle item-refund (swipe refund) case
    if (swipeRefundTarget) {
      setRefundedItems(prev => new Set([...prev, swipeRefundTarget.id]));
      
      // Also persist as a record if it's an item (for proper visual indicator)
      if (swipeRefundTarget.type === 'item') {
        // Parse the item index from the id format: item-{index}-{name}
        const match = swipeRefundTarget.id.match(/^item-(\d+)-/);
        if (match) {
          const itemIndex = parseInt(match[1], 10);
          const item = selectedGuest.items[itemIndex];
          if (item) {
            setRefundedItemRecords(prev => {
              const existing = prev.find(r => r.orderId === orderId && r.itemIndex === itemIndex);
              if (existing) {
                // Full refund - set to max qty
                return prev.map(r => 
                  r.orderId === orderId && r.itemIndex === itemIndex
                    ? { ...r, refundedQty: r.maxQty }
                    : r
                );
              } else {
                return [...prev, {
                  orderId,
                  itemIndex,
                  refundedQty: item.qty,
                  maxQty: item.qty,
                  itemName: item.name
                }];
              }
            });
          }
        }
      } else if (swipeRefundTarget.type === 'modifier') {
        // Parse modifier info from id format: mod-{itemIndex}-{modIndex}-{name}
        const match = swipeRefundTarget.id.match(/^mod-(\d+)-(\d+)-/);
        if (match) {
          const itemIndex = parseInt(match[1], 10);
          const modifierIndex = parseInt(match[2], 10);
          setRefundedModifierRecords(prev => {
            const exists = prev.some(r => 
              r.orderId === orderId && r.itemIndex === itemIndex && r.modifierIndex === modifierIndex
            );
            if (!exists) {
              return [...prev, {
                orderId,
                itemIndex,
                modifierIndex,
                modifierName: swipeRefundTarget.name
              }];
            }
            return prev;
          });
        }
      }
    }
    
    // Handle partial refund - persist selected items with quantities
    if (selectedRefundItems.length > 0) {
      selectedRefundItems.forEach(refundItem => {
        setRefundedItemRecords(prev => {
          const existing = prev.find(r => r.orderId === orderId && r.itemIndex === refundItem.index);
          if (existing) {
            // Add to existing refunded qty
            const newQty = Math.min(existing.refundedQty + refundItem.qty, refundItem.maxQty);
            return prev.map(r => 
              r.orderId === orderId && r.itemIndex === refundItem.index
                ? { ...r, refundedQty: newQty }
                : r
            );
          } else {
            return [...prev, {
              orderId,
              itemIndex: refundItem.index,
              refundedQty: refundItem.qty,
              maxQty: refundItem.maxQty,
              itemName: refundItem.name
            }];
          }
        });
      });
    }
    
    // Handle partial refund - persist selected modifiers
    if (selectedRefundModifiers.length > 0) {
      selectedRefundModifiers.forEach(refundMod => {
        setRefundedModifierRecords(prev => {
          const exists = prev.some(r => 
            r.orderId === orderId && r.itemIndex === refundMod.itemIndex && r.modifierIndex === refundMod.modifierIndex
          );
          if (!exists) {
            return [...prev, {
              orderId,
              itemIndex: refundMod.itemIndex,
              modifierIndex: refundMod.modifierIndex,
              modifierName: refundMod.name
            }];
          }
          return prev;
        });
      });
    }
    
    // Handle tip refund
    if (tipRefundAmount && parseFloat(tipRefundAmount) > 0) {
      const tipAmount = getTipRefundValue();
      setRefundedTipRecords(prev => {
        const existing = prev.find(r => r.orderId === orderId);
        if (existing) {
          // Add to existing refunded tip
          const newAmount = Math.min(existing.refundedAmount + tipAmount, existing.originalTip);
          return prev.map(r => 
            r.orderId === orderId
              ? { ...r, refundedAmount: newAmount }
              : r
          );
        } else {
          return [...prev, {
            orderId,
            refundedAmount: tipAmount,
            originalTip: selectedGuest.tip
          }];
        }
      });
    }
    
    // Use originalRefundType since refundStep will be 'confirmation' at this point
    const effectiveRefundType = originalRefundType || refundStep;
    
    // Handle full refund - mark all items as fully refunded in a single state update
    if (effectiveRefundType === 'full-refund') {
      // Update all item records in a single state update to avoid React batching issues
      setRefundedItemRecords(prev => {
        const newRecords = [...prev];
        selectedGuest.items.forEach((item, index) => {
          const existingIdx = newRecords.findIndex(
            r => r.orderId === orderId && r.itemIndex === index
          );
          if (existingIdx === -1) {
            newRecords.push({
              orderId,
              itemIndex: index,
              refundedQty: item.qty,
              maxQty: item.qty,
              itemName: item.name
            });
          } else {
            newRecords[existingIdx] = {
              ...newRecords[existingIdx],
              refundedQty: newRecords[existingIdx].maxQty
            };
          }
        });
        return newRecords;
      });

      // Update all modifier records in a single state update
      setRefundedModifierRecords(prev => {
        const newRecords = [...prev];
        selectedGuest.items.forEach((item, index) => {
          if (item.richModifiers) {
            item.richModifiers.forEach((mod, modIndex) => {
              const exists = newRecords.some(
                r => r.orderId === orderId && r.itemIndex === index && r.modifierIndex === modIndex
              );
              if (!exists) {
                newRecords.push({
                  orderId,
                  itemIndex: index,
                  modifierIndex: modIndex,
                  modifierName: mod.text
                });
              }
            });
          }
        });
        return newRecords;
      });
      
      // Refund tip if toggle is enabled - single state update
      if (selectedGuest.tip > 0 && includeRefundTip) {
        setRefundedTipRecords(prev => {
          const existingIdx = prev.findIndex(r => r.orderId === orderId);
          if (existingIdx === -1) {
            return [...prev, {
              orderId,
              refundedAmount: selectedGuest.tip,
              originalTip: selectedGuest.tip
            }];
          } else {
            const newRecords = [...prev];
            newRecords[existingIdx] = {
              ...newRecords[existingIdx],
              refundedAmount: newRecords[existingIdx].originalTip
            };
            return newRecords;
          }
        });
      }
    }
    
    // Handle partial refund tip if toggle is enabled and tip is available
    if (effectiveRefundType === 'partial-refund' && includeRefundTip && isTipRefundAvailable(selectedGuest)) {
      const remainingTip = getRemainingTipAmount(selectedGuest);
      setRefundedTipRecords(prev => {
        const existing = prev.find(r => r.orderId === orderId);
        if (!existing) {
          return [...prev, {
            orderId,
            refundedAmount: remainingTip,
            originalTip: selectedGuest.tip
          }];
        } else {
          // Add remaining tip to existing refunded amount
          const newAmount = Math.min(existing.refundedAmount + remainingTip, existing.originalTip);
          return prev.map(r => 
            r.orderId === orderId
              ? { ...r, refundedAmount: newAmount }
              : r
          );
        }
      });
    }
    
    // Record the refund transaction(s)
    if (hasSplitPayments(selectedGuest) && refundAllocations.length > 0) {
      // For split payments, record a transaction for each payment method that has a refund
      const newTransactions: RefundTransactionRecord[] = [];
      refundAllocations.forEach(allocation => {
        const totalRefund = allocation.refundAmount + allocation.tipRefundAmount;
        if (totalRefund > 0) {
          const pm = selectedGuest.paymentMethods?.find(p => p.id === allocation.paymentMethodId);
          if (pm) {
            newTransactions.push({
              id: `refund-${orderId}-${pm.id}-${Date.now()}`,
              orderId,
              amount: totalRefund,
              paymentMethod: pm.label,
              paymentType: pm.type,
              timestamp: new Date()
            });
          }
        }
      });
      if (newTransactions.length > 0) {
        setRefundTransactionRecords(prev => [...prev, ...newTransactions]);
      }
    } else {
      // For single payment orders, record a single transaction
      const refundAmount = getRefundDisplayAmount();
      const pm = selectedGuest.paymentMethods?.[0];
      const paymentMethod = pm?.label || selectedGuest.paymentType;
      const paymentType = pm?.type || 'credit_card';
      
      setRefundTransactionRecords(prev => [...prev, {
        id: `refund-${orderId}-${Date.now()}`,
        orderId,
        amount: refundAmount,
        paymentMethod: paymentMethod === 'Split Payment' ? 'Credit Card' : paymentMethod,
        paymentType: paymentType as 'credit_card' | 'cash' | 'gift_card' | 'debit_card',
        timestamp: new Date()
      }]);
    }
    
    // Persist refund data to database
    try {
      const refundAmount = getRefundDisplayAmount();
      const dbOrder = dbTicketOrders.find(o => o.id === orderId);
      const existingRefundAmount = dbOrder?.refundAmount || 0;
      const existingTransactions = dbOrder?.refundTransactions || [];
      const reasonLabel = refundReason?.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Other';
      
      const newTransaction = {
        id: `refund-${orderId}-${Date.now()}`,
        amount: refundAmount,
        reason: reasonLabel,
        type: originalRefundType === 'full-refund' ? 'full' : originalRefundType === 'tip-refund' ? 'tip' : originalRefundType === 'custom-refund' ? 'custom' : 'partial',
        paymentMethod: selectedGuest.paymentMethods?.[0]?.label || selectedGuest.paymentType || 'Credit Card',
        paymentType: selectedGuest.paymentMethods?.[0]?.type || 'credit_card',
        timestamp: new Date().toISOString(),
      };
      
      await updateTicketOrder(orderId, {
        refundAmount: existingRefundAmount + refundAmount,
        refundReason: reasonLabel,
        refundTransactions: [...existingTransactions, newTransaction],
      });
    } catch (err) {
      console.error('Failed to persist refund to database:', err);
    }
    
    // Reset originalRefundType after processing
    setOriginalRefundType(null);
    
    setRefundStep('success');
    // User will manually close the success screen
  };

  const getRefundDisplayAmount = () => {
    if (tipRefundAmount && parseFloat(tipRefundAmount) > 0) {
      return getTipRefundValue();
    }
    if (customRefundAmount && parseFloat(customRefundAmount) > 0) {
      return getCustomRefundValue();
    }
    if (selectedRefundItems.length > 0 || selectedRefundModifiers.length > 0) {
      return getPartialRefundTotal(includeRefundTip);
    }
    return selectedGuest.total;
  };

  const handleCancelRefund = () => {
    setIsRefundModalOpen(false);
    // Reset to 'closed' if viewing a paid ticket so swipe refund remains available for other items
    const isPaidTicket = selectedGuest && (selectedGuest.status === "PAID" || selectedGuest.paid);
    setRefundStep(isPaidTicket ? 'closed' : null);
    setRefundReason('customer-dissatisfaction');
    setSelectedRefundItems([]);
    setSelectedRefundModifiers([]);
    setExpandedRefundItems(new Set());
    setCustomRefundAmount("");
    setTipRefundAmount("");
    setIncludeRefundTip(true);
    setSwipeRefundTarget(null);
    setRefundAllocations([]);
    setUseCustomAllocation(false);
  };

  // Handler for swipe-initiated item/modifier refund
  const handleSwipeRefund = (target: SwipeRefundTarget) => {
    setSwipeRefundTarget(target);
    setRefundReason('customer-dissatisfaction');
    setIsRefundModalOpen(true);
    setRefundStep('item-refund');
  };

  const refundReasons = [
    { value: 'customer-dissatisfaction', label: 'Customer Dissatisfaction' },
    { value: 'order-error', label: 'Order Error' },
    { value: 'quality-issue', label: 'Quality Issue' },
    { value: 'wrong-order', label: 'Wrong Order Delivered' },
    { value: 'other', label: 'Other' },
  ] as const;

  const tipRefundReasons = [
    { value: 'wrong-tip-amount', label: 'Wrongly Given High Tip Amount' },
    { value: 'accidental-tip', label: 'Accidental Tip Entry' },
    { value: 'customer-requested', label: 'Customer Requested Tip Refund' },
    { value: 'tip-adjustment', label: 'Tip Adjustment Required' },
    { value: 'other', label: 'Other' },
  ] as const;

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
    const didMove = hasMoved.current;
    
    if (cardId && !isInteractive) {
      const currentX = swipeStatesRef.current[cardId] ?? 0;
      const snapTo = currentX < swipeWidth / 2 ? swipeWidth : 0;
      setCardSwipeX(cardId, snapTo);
    }
    isDraggingRef.current = false;
    currentCardId.current = null;
    currentGuest.current = null;
    hasMoved.current = false;

    // Only open panel if it was a tap (no movement) and not on interactive element
    if (triggerTap && !didMove && guest && !isInteractive) {
      suppressNextClickRef.current = true;
      handleMobileOrderClick(guest);
    } else if (didMove) {
      // If user swiped, suppress the next click to prevent panel from opening
      suppressNextClickRef.current = true;
    }
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
      case "ORDERING": return "text-[#F87171]";
      case "PAID": return "text-amber-500";
      case "UNPAID": return "text-red-400";
      case "COMPLETED": return "text-amber-500";
      case "FULLY REFUNDED": return "text-red-400";
      case "PARTIALLY REFUNDED": return "text-orange-400";
      default: return "text-white";
    }
  };
  
  // Get display status for a guest order (accounts for refund state)
  const getDisplayStatus = (guest: GuestOrder): string => {
    const refundStatus = getRefundStatusLabel(guest);
    if (refundStatus) return refundStatus;
    return guest.status;
  };

  const getFilterCount = (filter: string) => {
    if (filter === "All") return allOrders.length;
    if (filter === "Open") return allOrders.filter(g => g.status === "ORDERING").length;
    if (filter === "Paid") return allOrders.filter(g => g.status === "PAID" || g.status === "COMPLETED" || g.status === "Closed" || g.paymentType !== "--").length;
    if (filter === "Unpaid") return allOrders.filter(g => g.status === "UNPAID" || g.paymentType === "--").length;
    return 0;
  };

  // Filter orders by status, search query, and advanced filters (desktop/tablet)
  const filteredOrders = allOrders.filter(guest => {
    let matchesStatus = true;
    switch (activeFilter) {
      case "Open": matchesStatus = guest.status === "ORDERING"; break;
      case "Paid": matchesStatus = guest.status === "PAID" || guest.status === "COMPLETED" || guest.status === "Closed" || guest.paymentType !== "--"; break;
      case "Paid": matchesStatus = guest.status === "PAID" || guest.paymentType !== "--"; break;
      case "Unpaid": matchesStatus = guest.status === "UNPAID" || guest.paymentType === "--"; break;
      default: matchesStatus = true;
    }
    if (!matchesStatus) return false;
    if (filterRevenueCenter && guest.revenueCenter !== filterRevenueCenter) return false;
    if (filterEmployee && guest.server !== filterEmployee) return false;
    if (filterOrderType && guest.orderType !== filterOrderType) return false;
    if (filterOrderStatus && guest.status !== filterOrderStatus) return false;
    if (filterPaymentType) {
      if (filterPaymentType === "Unpaid" && guest.paymentType !== "--") return false;
      if (filterPaymentType !== "Unpaid" && guest.paymentType !== filterPaymentType) return false;
    }
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase().trim();
    return guest.name.toLowerCase().includes(query) || guest.id.toLowerCase().includes(query) || (guest.check !== "--" && guest.check.toLowerCase().includes(query));
  });

  // Mobile filtered orders (uses mobileFilters state)
  const mobileFilteredOrders = allOrders.filter(guest => {
    let matchesStatus = true;
    switch (activeFilter) {
      case "Open": matchesStatus = guest.status === "ORDERING"; break;
      case "Paid": matchesStatus = guest.status === "PAID" || guest.status === "COMPLETED" || guest.status === "Closed" || guest.paymentType !== "--"; break;
      case "Paid": matchesStatus = guest.status === "PAID" || guest.paymentType !== "--"; break;
      case "Unpaid": matchesStatus = guest.status === "UNPAID" || guest.paymentType === "--"; break;
      default: matchesStatus = true;
    }
    if (!matchesStatus) return false;
    if (mobileFilters.revenueCenter && guest.revenueCenter !== mobileFilters.revenueCenter) return false;
    if (mobileFilters.employee && guest.server !== mobileFilters.employee) return false;
    if (mobileFilters.orderType && guest.orderType !== mobileFilters.orderType) return false;
    if (mobileFilters.orderStatus && guest.status !== mobileFilters.orderStatus) return false;
    if (mobileFilters.paymentType) {
      if (mobileFilters.paymentType === "Unpaid" && guest.paymentType !== "--") return false;
      if (mobileFilters.paymentType !== "Unpaid" && guest.paymentType !== mobileFilters.paymentType) return false;
    }
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase().trim();
    return guest.name.toLowerCase().includes(query) || guest.id.toLowerCase().includes(query) || (guest.check !== "--" && guest.check.toLowerCase().includes(query));
  });
  
  // Clear mobile filters
  const clearMobileFilters = () => {
    setMobileFilters({
      revenueCenter: null,
      datePreset: 'today',
      customDateStart: undefined,
      customDateEnd: undefined,
      employee: null,
      orderType: null,
      orderStatus: null,
      paymentType: null,
    });
  };

  const toggleSeat = (seat: number) => {
    setSelectedSeats(prev => prev.includes(seat) ? prev.filter(s => s !== seat) : [...prev, seat]);
  };

  // Filter order items based on selected seats for table orders
  const getFilteredOrderItems = (order: GuestOrder) => {
    const items = getOrderItems(order);
    
    // Only filter if it's a table order and not all seats are selected
    if (order.orderType !== "Table" || selectedSeats.length === (order.partySize || 4)) {
      return items;
    }
    
    // If no seats are selected, show all items
    if (selectedSeats.length === 0) {
      return items;
    }
    
    // Filter items that have at least one selected seat OR have no seat assignment
    return items.filter(item => {
      // Items with no seat assignment are always shown
      if (item.seats.length === 0) {
        return true;
      }
      // Show items that have at least one of the selected seats
      return item.seats.some(seat => selectedSeats.includes(seat));
    });
  };

  const handleMobileOrderClick = (guest: GuestOrder) => {
    setSelectedGuest(guest);
    setAppliedDiscounts(ticketDiscounts[guest.id] || []);
    setShowMobileOrderPanel(true);
  };

  // Mobile Order Panel Component
  const MobileOrderPanel = () => (
    <div className="fixed inset-0 z-50 bg-neutral-900 flex flex-col">
      {/* Header - Back Button */}
      <div className="flex items-center p-3">
        <button 
          onClick={() => setShowMobileOrderPanel(false)} 
          className="p-1.5 rounded-full hover:opacity-80 transition-opacity" 
          style={{ background: "#7575754D", boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)" }}
        >
          <span className="text-white text-lg">←</span>
        </button>
      </div>

      {/* Customer Info */}
      <div className="flex items-center justify-between text-xs px-3 pb-3 border-b border-neutral-700/50 gap-2">
        <input 
          type="text" 
          value={getCurrentGuestName(selectedGuest.id, selectedGuest.name)} 
          onChange={e => handleGuestNameChange(selectedGuest.id, e.target.value)} 
          placeholder="GUEST NAME" 
          className="bg-transparent outline-none placeholder:text-[#808080] w-24 min-w-0 font-medium text-[#808080]" 
        />
        <div className="flex items-center gap-0.5">
          <img src={phoneIcon} alt="Phone" className="w-4 h-4" />
          <input 
            type="tel" 
            inputMode="tel" 
            value={formatPhoneNumber(getCurrentGuestPhone(selectedGuest.id, selectedGuest.phone))} 
            onChange={e => handleGuestPhoneChange(selectedGuest.id, e.target.value)} 
            placeholder="(XXX) XXX-XXXX" 
            className="bg-transparent outline-none placeholder:text-[#808080] w-28 min-w-0 text-[#808080]" 
          />
        </div>
        <div className="flex items-center gap-1 whitespace-nowrap flex-shrink-0">
          <img src={timeIcon} alt="Time" className="w-4 h-4" />
          <span className="text-white">{selectedGuest.time}</span>
        </div>
      </div>

      {/* Order Info */}
      <div className="px-3 py-2 border-b border-neutral-700/50">
        <div className={`flex items-center justify-between ${selectedGuest.orderType === "Table" ? "mb-2" : ""}`}>
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 bg-white/10 text-white text-xs rounded uppercase">
              {selectedGuest.orderType === "Table" ? `TABLE ${selectedGuest.table}` : selectedGuest.orderType}
            </span>
            {selectedGuest.orderType === "Table" && (
              <span className="flex items-center gap-1 text-white/60 text-xs">
                <Users className="w-3 h-3" />
                {selectedGuest.partySize}
              </span>
            )}
            <span className="text-white font-bold">{String(selectedGuest.orderNumber || 0)}</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <img src={runnerIcon} alt="Runner" className="w-4 h-4" />
            <span className="text-white/80">{selectedGuest.server}</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-5 h-5 bg-white rounded-full flex items-center justify-center ml-2">
                  <MoreVertical className="w-3 h-3 text-black" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-neutral-800 border-neutral-700 min-w-[160px] p-1 z-50">
                {!(selectedGuest.status === "PAID" || selectedGuest.paid) && (
                  <>
                    <DropdownMenuItem 
                      className="text-white hover:bg-neutral-700 cursor-pointer text-xs py-2 px-3 flex items-center gap-2"
                      onClick={handleAddProduct}
                    >
                      <img src={customItemIcon} alt="" className="w-3.5 h-3.5" />
                      Add Item
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className={`text-white hover:bg-neutral-700 cursor-pointer text-xs py-2 px-3 flex items-center gap-2 ${currentTicketDiscounts.length > 0 ? 'bg-primary/20' : ''}`}
                      onClick={handleDiscountClick}
                    >
                      <img src={discountIcon} alt="" className="w-3.5 h-3.5" />
                      {currentTicketDiscounts.length > 0 ? `${currentTicketDiscounts.length} Discount${currentTicketDiscounts.length > 1 ? 's' : ''}` : 'Discount'}
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className={`${isCurrentTicketTaxExempt ? 'text-orange-500' : 'text-white'} hover:bg-neutral-700 cursor-pointer text-xs py-2 px-3 flex items-center gap-2`}
                      onClick={handleNoTaxClick}
                    >
                      <img src={noTaxIcon} alt="" className="w-3.5 h-3.5" />
                      {isCurrentTicketTaxExempt ? 'Tax Exempt ✓' : 'No Tax'}
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-white hover:bg-neutral-700 cursor-pointer text-xs py-2 px-3 flex items-center gap-2"
                      onClick={() => {
                        setTransferIntentOrderId(selectedGuest.id);
                        setShowTransferIntentDialog(true);
                      }}
                    >
                      <img src={shareOrderIcon} alt="" className="w-3.5 h-3.5" />
                      Transfer
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-white hover:bg-neutral-700 cursor-pointer text-xs py-2 px-3 flex items-center gap-2"
                      onClick={() => {
                        const table = selectedGuest.table || 'T1';
                        navigate(`/tableorder/${table}/merge?orderId=${selectedGuest.id}`);
                      }}
                    >
                      <img src={mergeIcon} alt="" className="w-3.5 h-3.5" />
                      Merge
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuItem 
                  className="text-white hover:bg-neutral-700 cursor-pointer text-xs py-2 px-3 flex items-center gap-2"
                  onClick={() => setIsReceiptDialogOpen(true)}
                >
                  <img src={receiptIcon} alt="" className="w-3.5 h-3.5" />
                  Receipt
                </DropdownMenuItem>
                {(selectedGuest.status === "PAID" || selectedGuest.paid) && (
                  <DropdownMenuItem 
                    className="text-white hover:bg-neutral-700 cursor-pointer text-xs py-2 px-3 flex items-center gap-2"
                  >
                    <img src={registerIcon} alt="" className="w-3.5 h-3.5 brightness-0 invert" />
                    No Sale
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {/* Seat Buttons - Only for Table Orders */}
        {selectedGuest.orderType === "Table" && (
          <div className="flex items-center gap-2">
            <button className="p-1.5 bg-white/10 rounded hover:bg-white/20 transition-colors">
              <img src={seatIcon} alt="Seat" className="w-4 h-4" />
            </button>
            {Array.from({ length: selectedGuest.partySize || 4 }, (_, i) => i + 1).map(seat => (
              <button 
                key={seat} 
                onClick={() => toggleSeat(seat)} 
                className={`w-7 h-7 rounded text-sm font-medium transition-colors ${selectedSeats.includes(seat) ? "bg-white text-black" : "bg-white/10 text-white hover:bg-white/20"}`}
              >
                {seat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Notes */}
      <div className="px-3 py-2 border-b border-neutral-700/50">
        <OrderNotesAutocomplete 
          value={orderNotes[selectedGuest.id] || selectedGuest.notes || ""} 
          onChange={(val) => handleNotesChange(selectedGuest.id, val)} 
          placeholder="Order notes and Allergies" 
          storageKey="tickets-order-notes" 
        />
      </div>
      {/* Order Items */}
      <ScrollArea className="flex-1 px-3">
        <div className="py-2 space-y-2">
          {getFilteredOrderItems(selectedGuest).map((item, index) => {
            const itemId = `item-${index}-${item.name}`;
            const isItemSwipeRefunded = refundedItems.has(itemId);
            
            // Get refunded quantity from persisted records
            const refundedQty = getRefundedQtyForItem(selectedGuest.id, index);
            const orderFullyRefunded = isFullyRefundedOrder(selectedGuest);
            const isFullyRefunded = refundedQty >= item.qty || isItemSwipeRefunded || orderFullyRefunded;
            const isPartiallyRefunded = !orderFullyRefunded && refundedQty > 0 && refundedQty < item.qty && !isItemSwipeRefunded;
            const remainingQty = item.qty - refundedQty;
            
            const handleItemRefund = () => {
              // Don't allow refund on already fully refunded items
              if (isFullyRefunded) return;
              handleSwipeRefund({
                id: itemId,
                type: 'item',
                name: item.name,
                price: item.price * (remainingQty > 0 ? remainingQty : item.qty)
              });
            };
            
            const handleModifierRefund = (modifier: ModifierItem, modIndex: number) => {
              const modifierId = `mod-${index}-${modIndex}-${modifier.text}`;
              // Don't allow refund on already refunded modifiers
              if (isModifierRefunded(selectedGuest.id, index, modIndex)) return;
              handleSwipeRefund({
                id: modifierId,
                type: 'modifier',
                name: modifier.text,
                price: modifier.price || 0
              });
            };
            
            // Wrap in swipeable container for paid tickets
            const itemContent = (
              <div className={`p-3 bg-neutral-800 rounded-xl border ${isFullyRefunded ? 'border-red-500/30' : 'border-neutral-700'} ${isFullyRefunded ? 'opacity-60' : ''}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-2">
                    {/* Quantity badge with refund indicator */}
                    <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
                      {isPartiallyRefunded ? (
                        <>
                          <span className="w-6 h-6 bg-red-500 rounded flex items-center justify-center text-white text-sm font-bold line-through">
                            {refundedQty}
                          </span>
                          <span className="w-6 h-6 bg-white rounded flex items-center justify-center text-black text-sm font-bold">
                            {remainingQty}
                          </span>
                        </>
                      ) : (
                        <span className={`w-6 h-6 rounded flex items-center justify-center text-sm font-bold flex-shrink-0 ${isFullyRefunded ? 'bg-red-500 text-white line-through' : 'bg-white text-black'}`}>
                          {item.qty}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className={`font-medium text-sm ${isFullyRefunded ? 'line-through text-red-400' : 'text-white'}`}>
                          {item.name}
                        </span>
                        {isFullyRefunded && (
                          <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 text-[9px] font-medium rounded">
                            REFUNDED
                          </span>
                        )}
                        {isPartiallyRefunded && (
                          <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 text-[9px] font-medium rounded">
                            {refundedQty} REFUNDED
                          </span>
                        )}
                      </div>
                      {/* Rich modifiers with refund indicators */}
                      {item.richModifiers && item.richModifiers.length > 0 ? (
                        refundStep === 'closed' && !isFullyRefunded ? (
                          <SwipeableModifierTree 
                            modifiers={item.richModifiers} 
                            onModifierRefund={handleModifierRefund}
                            refundedItems={refundedItems}
                            itemIndex={index}
                          />
                        ) : (
                          <div className="mt-1.5">
                            {item.richModifiers.map((mod, modIdx) => {
                              const isModRefunded = isModifierRefunded(selectedGuest.id, index, modIdx) || isFullyRefunded;
                              let prefix = '•';
                              if (mod.type === 'remove') prefix = '-';
                              else if (mod.type === 'add') prefix = '+';
                              
                              return (
                                <div key={modIdx} className="flex items-center text-xs h-5">
                                  <div className="relative w-4 h-full flex-shrink-0">
                                    <div 
                                      className={`absolute left-0 w-px ${isModRefunded ? 'bg-red-500/30' : 'bg-white/30'}`}
                                      style={{ 
                                        top: modIdx === 0 ? '0' : '-2px',
                                        height: modIdx === item.richModifiers!.length - 1 ? '50%' : 'calc(100% + 2px)'
                                      }}
                                    />
                                    <div className={`absolute left-0 top-1/2 w-2.5 h-px ${isModRefunded ? 'bg-red-500/30' : 'bg-white/30'}`} />
                                  </div>
                                  <div className="flex items-center flex-1 min-w-0">
                                    <span className={`mr-1.5 w-2 text-center flex-shrink-0 ${isModRefunded ? 'text-red-400/40' : 'text-white/40'}`}>{prefix}</span>
                                    <span className={`truncate ${isModRefunded ? 'line-through text-red-400' : mod.type === 'remove' ? 'text-white/40' : 'text-white/50'}`}>
                                      {mod.text}
                                    </span>
                                    {mod.price && mod.price > 0 && (
                                      <span className={`ml-auto pl-2 flex-shrink-0 ${isModRefunded ? 'line-through text-red-400' : 'text-white/60'}`}>{formatPrice(mod.price)}</span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )
                      ) : item.modifiers.length > 0 && (
                        <SimpleModifierTree modifiers={item.modifiers} size="xs" />
                      )}
                      {/* Item Notes - Flat inline list */}
                      {item.notes && item.notes.length > 0 && (
                        <div className="mt-1.5 flex items-center text-xs">
                          <span className="text-white/40 mr-1.5">📝</span>
                          <span className="text-white/50 italic">{item.notes.join(', ')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    {isFullyRefunded ? (
                      <span className="text-red-400 font-medium text-sm flex-shrink-0 line-through">
                        {item.displayPrice}
                      </span>
                    ) : isPartiallyRefunded ? (
                      <>
                        <span className="text-red-400 font-medium flex-shrink-0 line-through text-xs">
                          {formatPrice(item.price * refundedQty)}
                        </span>
                        <span className="text-white font-medium text-sm flex-shrink-0">
                          {formatPrice(item.price * remainingQty)}
                        </span>
                      </>
                    ) : (
                      <span className="text-white font-medium text-sm flex-shrink-0">
                        {item.displayPrice}
                      </span>
                    )}
                  </div>
                </div>
                {selectedGuest.orderType === "Table" && (
                  <div className="flex items-center gap-1 mt-2">
                    <img src={seatIcon} alt="Seat" className="w-4 h-4 opacity-50" />
                    {item.seats.length === 0 || item.seats.length === (selectedGuest.partySize || 4) ? (
                      <span className="w-5 h-5 bg-white/10 rounded flex items-center justify-center">
                        <Share2 className="w-3 h-3 text-white opacity-70" />
                      </span>
                    ) : (
                      item.seats.map(seat => (
                        <span key={seat} className="w-5 h-5 bg-white/10 rounded text-white text-xs flex items-center justify-center">
                          {seat}
                        </span>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
            
            const isPaidTicket = selectedGuest.status === "PAID" || selectedGuest.paid;
            const noTaxKey = `${selectedGuest.id}-${index}-${item.name}`;
            
            // For paid/closed tickets, wrap in swipeable container for refund (only if not fully refunded)
            // For ordering/unpaid tickets, wrap in SwipeableCartItem for C and No Tax options
            if (refundStep === 'closed' && isPaidTicket && !isFullyRefunded) {
              return (
                <SwipeableRefundItem
                  key={index}
                  onRefund={handleItemRefund}
                  label={item.name}
                  disabled={isFullyRefunded}
                >
                  {itemContent}
                </SwipeableRefundItem>
              );
            } else if (!isPaidTicket) {
              return (
                <SwipeableCartItem
                  key={index}
                  onDelete={() => {
                    // Remove item from order
                    setRemovedItems(prev => {
                      const newSet = new Set(prev);
                      newSet.add(noTaxKey);
                      return newSet;
                    });
                    // Also remove from noTaxItems if it was there
                    setNoTaxItems(prev => {
                      const newSet = new Set(prev);
                      newSet.delete(noTaxKey);
                      return newSet;
                    });
                  }}
                  onNoTax={() => {
                    // Toggle no tax for item
                    setNoTaxItems(prev => {
                      const newSet = new Set(prev);
                      if (newSet.has(noTaxKey)) {
                        newSet.delete(noTaxKey);
                      } else {
                        newSet.add(noTaxKey);
                      }
                      return newSet;
                    });
                  }}
                  showFire={false}
                  showOrderType={false}
                >
                  {itemContent}
                </SwipeableCartItem>
              );
            } else {
              return <div key={index}>{itemContent}</div>;
            }
          })}
        </div>
        <ScrollBar orientation="vertical" />
      </ScrollArea>

      {/* Order Summary with Tip Refund Indicator */}
      {(() => {
        const refundedTip = getRefundedTipAmount(selectedGuest.id);
        const hasRefundedTip = refundedTip > 0;
        const remainingTip = selectedGuest.tip - refundedTip;
        const isFullTipRefunded = refundedTip >= selectedGuest.tip;
        const totalRefunded = getTotalRefundedAmount(selectedGuest);
        const isFullyRefunded = isFullyRefundedOrder(selectedGuest);
        
        return (
          <div className="px-3 py-2 border-t border-neutral-700/50">
            <div className="text-xs flex flex-wrap items-center gap-x-4 gap-y-1">
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">Sub Total</span>
                <span className="text-foreground font-semibold">{formatPrice(selectedGuest.subtotal)}</span>
              </div>
              <div className="flex items-center gap-1 group relative">
                <span className="text-muted-foreground">Discount</span>
                <span className="text-foreground font-semibold">{formatPrice(effectiveDiscount)}</span>
                {currentTicketDiscounts.length > 0 && (
                  <>
                    <button onClick={() => handleApplyTicketDiscounts([])} className="text-white hover:text-white/80 text-xs font-bold ml-0.5">×</button>
                    <span className="absolute left-0 -top-7 bg-black/90 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                      {currentTicketDiscounts.map(d => d.name).join(', ')}
                    </span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">Service Charge</span>
                <span className="text-foreground font-semibold">{formatPrice(selectedGuest.serviceCharge)}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">Tax</span>
                <span className="text-foreground font-semibold">{formatPrice(selectedGuest.tax)}</span>
              </div>
            </div>
            {/* Total + Tip row - only for Paid or Completed tickets */}
            {(selectedGuest.status === "PAID" || selectedGuest.status === "COMPLETED" || selectedGuest.paid) && (
              <div className="text-sm flex items-center gap-2 mt-2 pt-2 border-t border-white/10">
                <span className="text-muted-foreground font-medium">Total</span>
                <span className={`font-bold ${isFullyRefunded ? 'text-red-400 line-through' : 'text-foreground'}`}>{formatPrice(selectedGuest.total)}</span>
                {selectedGuest.tip > 0 && (
                  <>
                    <span className="text-muted-foreground font-medium">+</span>
                    <span className="text-muted-foreground font-medium">Tip</span>
                    {hasRefundedTip ? (
                      <div className="flex items-center gap-1">
                        <span className="text-red-400 line-through text-xs">{formatPrice(refundedTip)}</span>
                        {!isFullTipRefunded && (
                          <span className="text-foreground font-bold">{formatPrice(remainingTip)}</span>
                        )}
                        {isFullTipRefunded && (
                          <span className="px-1 py-0.5 bg-red-500/20 text-red-400 text-[9px] font-medium rounded">REFUNDED</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-foreground font-bold">{formatPrice(selectedGuest.tip)}</span>
                    )}
                  </>
                )}
              </div>
            )}
            {/* Refunded amount row - show when there's any refund */}
            {totalRefunded > 0 && refundStep === 'closed' && (
              <div className="mt-2 pt-2 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <RotateCcw className="w-3 h-3 text-red-400" />
                    <span className="text-xs text-muted-foreground">Refunded</span>
                    <span className="text-sm text-red-400 font-bold">{formatPrice(totalRefunded)}</span>
                  </div>
                  {isFullyRefunded ? (
                    <span className="px-2 py-1 bg-red-500/20 text-red-400 text-[10px] font-semibold rounded-full flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      FULLY REFUNDED
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-orange-500/20 text-orange-400 text-[10px] font-semibold rounded-full flex items-center gap-1">
                      PARTIALLY REFUNDED
                    </span>
                  )}
                </div>
                {/* Refund transactions as horizontal chips */}
                {(() => {
                  const transactions = getRefundTransactionsForOrder(selectedGuest.id);
                  if (transactions.length > 0) {
                    const isExpanded = expandedRefundTransactions.has(selectedGuest.id);
                    const displayedTransactions = isExpanded ? transactions : transactions.slice(0, 3);
                    const hiddenCount = transactions.length - 3;
                    
                    return (
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        {displayedTransactions.map((txn) => (
                          <span key={txn.id} className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/5 rounded-full text-[10px] text-white/60">
                            {getPaymentMethodIcon(txn.paymentType)}
                            <span className="truncate max-w-[80px]">{txn.paymentMethod}</span>
                            <span className="text-red-400 font-medium">{formatPrice(txn.amount)}</span>
                          </span>
                        ))}
                        {transactions.length > 3 && (
                          <button 
                            onClick={() => toggleRefundTransactionsExpanded(selectedGuest.id)}
                            className="text-[10px] text-orange-400 hover:text-orange-300 transition-colors"
                          >
                            {isExpanded ? 'Show less' : `+${hiddenCount} more`}
                          </button>
                        )}
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            )}
          </div>
        );
      })()}

      {/* Bottom Actions */}
      <div className="px-3 py-3 border-t border-neutral-700/50 flex items-center gap-2">
        {selectedGuest.paid ? (
          // Check if closed OR if there are any refunds on this ticket
          (refundStep === 'closed' || getTotalRefundedAmount(selectedGuest) > 0) ? (
            // Only show refund button if there's remaining amount to refund
            getRemainingRefundableAmount(selectedGuest) > 0 ? (
              <button 
                onClick={handleOpenRefundModal}
                className="flex-1 py-2.5 rounded-full text-white text-sm font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{ background: "linear-gradient(180deg, #EF4444 0%, #B91C1C 100%)" }}
              >
                <span className="flex items-center justify-center gap-2">
                  <RotateCcw className="w-4 h-4" />
                  REFUND
                </span>
              </button>
            ) : (
              <button 
                disabled
                className="flex-1 py-2.5 rounded-full text-white/60 text-sm font-bold cursor-not-allowed opacity-60"
                style={{ background: "linear-gradient(180deg, #EF4444 0%, #B91C1C 100%)" }}
              >
                <span className="flex items-center justify-center gap-2">
                  <Check className="w-4 h-4" />
                  FULLY REFUNDED
                </span>
              </button>
            )
          ) : (
            <>
              <button 
                onClick={() => setIsTipSheetOpen(true)}
                className="flex-1 py-2.5 rounded-full text-white text-sm font-bold transition-colors hover:bg-neutral-700"
                style={{ background: "#1B1C20" }}
              >
                ADD TIP
              </button>
              <button 
                onClick={handleCloseTicket}
                className="flex-1 py-2.5 rounded-full text-black text-sm font-bold transition-all hover:scale-[1.02] active:scale-[0.98]" 
                style={{ background: "linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)" }}
              >
                CLOSE
              </button>
            </>
          )
        ) : (
          (() => {
            const showSaveButton = SettingsManager.getCheckoutOptionsSettings().showSaveButton;
            return (
              <>
                <button 
                  onClick={handleClearOrderAttempt}
                  className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center hover:bg-red-500 transition-colors flex-shrink-0"
                >
                  <img src={clearIcon} alt="Clear" className="w-4 h-4 brightness-0 invert" />
                </button>
                {showSaveButton && (
                  <button 
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" 
                    style={{ background: '#C9C9C9' }}
                  >
                    <img src={saveIcon} alt="Save" className="w-4 h-4 brightness-0" />
                  </button>
                )}
                <button 
                  className="flex-1 h-10 rounded-full flex items-center justify-center gap-1 text-white text-sm font-medium" 
                  style={{ background: "linear-gradient(180deg, #FF9E65 0%, #FF5E00 100%)" }}
                >
                  <img src={fireIcon} alt="Fire" className="w-4 h-4 brightness-0 invert" />
                  <span>FIRE</span>
                </button>
                <button 
                  onClick={() => setShowPaymentDialog(true)}
                  className="flex-1 h-10 rounded-full text-black text-sm font-bold" 
                  style={{ background: "linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)" }}
                >
                  CHARGE {formatPrice(selectedGuest.total)}
                </button>
              </>
            );
          })()
        )}
      </div>
    </div>
  );

  // Mobile Layout
  const mobileLayout = (
    <div className="flex flex-col h-full bg-black">
      {/* Header */}
      <div className="relative flex items-center justify-between px-3 py-2.5 border-b border-neutral-700/50">
        {showSearchInput ? (
          <>
            <div className="flex-1 flex items-center gap-2 px-2">
              <Search className="w-4 h-4 text-white/50 flex-shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, order ID..."
                className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-white/40"
                autoFocus
              />
            </div>
            <button 
              onClick={() => { setShowSearchInput(false); setSearchQuery(""); }}
              className="p-2 rounded-full hover:opacity-80 transition-opacity ml-2" 
              style={{ background: "rgba(255, 255, 255, 0.2)", boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)" }}
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </>
        ) : (
          <>
            <span className="text-white font-semibold text-lg pl-2">Tickets</span>
            <div className="flex items-center gap-2 z-10">
              <button 
                onClick={() => setIsMobileFiltersOpen(true)}
                className="relative p-2 rounded-full hover:opacity-80 transition-opacity active:scale-95" 
                style={{ background: "#7575754D", boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)" }}
              >
                <ListFilter className="w-4 h-4 text-white" />
                {hasMobileActiveFilters && (
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-white rounded-full" />
                )}
              </button>
              <button 
                onClick={() => setShowSearchInput(true)}
                className="p-2 rounded-full hover:opacity-80 transition-opacity active:scale-95" 
                style={{ background: "#7575754D", boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)" }}
              >
                <Search className="w-4 h-4 text-white" />
              </button>
              <div className="overflow-visible flex items-center justify-center">
                <AnimatedAIIcon size={16} onClick={() => setIsAIChatOpen(prev => !prev)} />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Active Filters Chips */}
      {hasMobileActiveFilters && (
        <div className="flex items-center gap-2 px-3 py-2 overflow-x-auto scrollbar-hide border-b border-white/5">
          {mobileFilters.revenueCenter && (
            <button
              onClick={() => setMobileFilters(prev => ({ ...prev, revenueCenter: null }))}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs text-white whitespace-nowrap active:scale-95 transition-transform"
              style={{ background: 'rgba(255, 255, 255, 0.15)' }}
            >
              <span>{mobileFilters.revenueCenter}</span>
              <X className="w-3 h-3" />
            </button>
          )}
          {mobileFilters.datePreset !== 'today' && (
            <button
              onClick={() => setMobileFilters(prev => ({ ...prev, datePreset: 'today', customDateStart: undefined, customDateEnd: undefined }))}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs text-white whitespace-nowrap active:scale-95 transition-transform"
              style={{ background: 'rgba(255, 255, 255, 0.15)' }}
            >
              <span>
                {mobileFilters.datePreset === 'custom' && mobileFilters.customDateStart && mobileFilters.customDateEnd
                  ? `${format(mobileFilters.customDateStart, 'MM/dd')} - ${format(mobileFilters.customDateEnd, 'MM/dd')}`
                  : mobileFilters.datePreset === 'yesterday' ? 'Yesterday'
                  : mobileFilters.datePreset === 'this-week' ? 'This Week'
                  : mobileFilters.datePreset === 'this-month' ? 'This Month'
                  : mobileFilters.datePreset === 'last-7-days' ? 'Last 7 Days'
                  : 'Custom'}
              </span>
              <X className="w-3 h-3" />
            </button>
          )}
          {mobileFilters.employee && (
            <button
              onClick={() => setMobileFilters(prev => ({ ...prev, employee: null }))}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs text-white whitespace-nowrap active:scale-95 transition-transform"
              style={{ background: 'rgba(255, 255, 255, 0.15)' }}
            >
              <span>{mobileFilters.employee}</span>
              <X className="w-3 h-3" />
            </button>
          )}
          {mobileFilters.orderType && (
            <button
              onClick={() => setMobileFilters(prev => ({ ...prev, orderType: null }))}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs text-white whitespace-nowrap active:scale-95 transition-transform"
              style={{ background: 'rgba(255, 255, 255, 0.15)' }}
            >
              <span>{mobileFilters.orderType}</span>
              <X className="w-3 h-3" />
            </button>
          )}
          {mobileFilters.orderStatus && (
            <button
              onClick={() => setMobileFilters(prev => ({ ...prev, orderStatus: null }))}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs text-white whitespace-nowrap active:scale-95 transition-transform"
              style={{ background: 'rgba(255, 255, 255, 0.15)' }}
            >
              <span>{mobileFilters.orderStatus}</span>
              <X className="w-3 h-3" />
            </button>
          )}
          {mobileFilters.paymentType && (
            <button
              onClick={() => setMobileFilters(prev => ({ ...prev, paymentType: null }))}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs text-white whitespace-nowrap active:scale-95 transition-transform"
              style={{ background: 'rgba(255, 255, 255, 0.15)' }}
            >
              <span>{mobileFilters.paymentType}</span>
              <X className="w-3 h-3" />
            </button>
          )}
          {/* Clear All */}
          <button
            onClick={clearMobileFilters}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs text-white/70 whitespace-nowrap active:scale-95 transition-transform"
            style={{ background: 'rgba(239, 68, 68, 0.3)' }}
          >
            <span>Clear All</span>
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 p-3 overflow-x-auto scrollbar-hide">
        {filters.map(filter => {
          const count = getFilterCount(filter);
          return (
            <button 
              key={filter} 
              onClick={() => setActiveFilter(filter)} 
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-all ${activeFilter === filter ? "text-black" : "text-white"}`} 
              style={activeFilter === filter ? { background: "linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)" } : { background: "#1B1C20" }}
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

      {/* Guest Orders List */}
      <ScrollArea className="flex-1 px-3">
        <div className="space-y-2 pb-3">
          {mobileFilteredOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Search className="w-10 h-10 text-white/20 mb-3" />
              <p className="text-white/60 text-base font-medium">No results found</p>
              <p className="text-white/40 text-xs mt-1">
                {searchQuery ? `No tickets match "${searchQuery}"` : "No tickets match the selected filters"}
              </p>
              {(searchQuery || hasMobileActiveFilters) && (
                <button 
                  onClick={() => { setSearchQuery(""); clearMobileFilters(); }}
                  className="mt-3 px-3 py-1.5 rounded-full text-xs text-white active:bg-white/20 transition-colors"
                  style={{ background: "#7575754D" }}
                >
                  Clear all filters
                </button>
              )}
            </div>
          ) : mobileFilteredOrders.map(guest => (
            <div key={guest.id} className="space-y-0">
              <div className="relative rounded-xl cursor-pointer transition-all overflow-hidden bg-black">
                {/* Swipe Action Buttons */}
                <div className={`absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2 md:hidden transition-opacity duration-200 ${(swipeStates[guest.id] || 0) < -20 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                  {guest.status === "PAID" || guest.paid ? (
                    <>
                      <button 
                        className="w-10 h-10 flex items-center justify-center rounded-full transition-colors btn-receipt-gradient"
                        onClick={(e) => { e.stopPropagation(); setIsReceiptDialogOpen(true); }}
                      >
                        <img src={receiptIcon} alt="" className="w-5 h-5 brightness-0 invert" />
                      </button>
                      <button className="w-10 h-10 flex items-center justify-center rounded-full transition-colors btn-register-gradient">
                        <img src={registerIcon} alt="No Sale" className="w-5 h-5 object-contain brightness-0 invert" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button 
                        className="w-10 h-10 flex items-center justify-center rounded-full transition-colors btn-transfer-gradient"
                        onClick={(e) => { e.stopPropagation(); navigate(`/tableorder/${guest.table || 'T1'}/merge?orderId=${guest.id}`); }}
                      >
                        <img src={mergeIcon} alt="Merge" className="w-5 h-5 object-contain brightness-0" />
                      </button>
                      <button 
                        className="w-10 h-10 flex items-center justify-center rounded-full transition-colors btn-action-gradient"
                        onClick={(e) => { e.stopPropagation(); setTransferIntentOrderId(guest.id); setShowTransferIntentDialog(true); }}
                      >
                        <img src={shareOrderIcon} alt="Transfer" className="w-5 h-5 object-contain" />
                      </button>
                    </>
                  )}
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
                  <MobileTicketCard
                    orderId={String(guest.orderNumber || 0)}
                    checkId={"000"}
                    guestName={guest.name}
                    tableNumber={guest.table}
                    partySize={guest.partySize}
                    orderType={(guest.orderType as "Table" | "DineIn" | "Takeaway" | "Drive-thru") || "Table"}
                    arrivedTime={guest.time}
                    timer={formatElapsedTime(guest.createdAt, currentTime)}
                    revenueCenter={guest.revenueCenter}
                    serverName={guest.server}
                    orderStatus={getDisplayStatus(guest)}
                    totalAmount={guest.total}
                    paymentStatus={guest.paymentType === "--" ? "Un Paid" : getDisplayPaymentType(guest)}
                    gratuity={guest.tip}
                    isSelected={selectedGuest.id === guest.id}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
        <ScrollBar orientation="vertical" />
      </ScrollArea>

      {/* No CTA button */}

      {/* Mobile Order Panel */}
      {showMobileOrderPanel && <MobileOrderPanel />}
    </div>
  );

  // Desktop Layout
  const desktopLayout = (
    <div className="flex h-full bg-black gap-2">
      {/* Left Panel - Order List */}
      <div className="flex flex-col w-[55%] rounded-r-[20px] overflow-hidden">
        {/* Header - Inline filter options */}
        <div className="flex items-center justify-between py-2 pr-2 border-b border-neutral-700/50">
          {showSearchInput ? (
            <>
              <div className="flex-1 flex items-center gap-2 pl-3 pr-2">
                <Search className="w-4 h-4 text-white/50 flex-shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, order ID, or check..."
                  className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-white/40"
                  autoFocus
                />
              </div>
              <button 
                onClick={() => { setShowSearchInput(false); setSearchQuery(""); }}
                className="p-2 rounded-full hover:opacity-80 transition-opacity ml-2" 
                style={{ background: "rgba(255, 255, 255, 0.2)", boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)" }}
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </>
          ) : (
            <>
              <span className="text-white font-semibold text-lg pl-3">Tickets</span>
              <div className="flex items-center gap-1">
                {showFilterPanel && (
                  <>
                    {/* Revenue Center Filter */}
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className={`p-2 rounded-xl hover:bg-white/10 transition-colors ${filterRevenueCenter ? 'ring-2 ring-white/50' : ''}`} style={{ background: "rgba(100, 100, 100, 0.4)" }}>
                          <DollarSign className="w-4 h-4 text-white" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-48 p-2 bg-neutral-800 border-neutral-700 pointer-events-auto z-[100]" align="start">
                        <div className="text-xs text-white/50 mb-2 px-2">Revenue Center</div>
                        {filterOptions.revenueCenters.map(rc => (
                          <button key={rc} onClick={() => setFilterRevenueCenter(filterRevenueCenter === rc ? null : rc)} className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${filterRevenueCenter === rc ? 'bg-white text-black' : 'text-white hover:bg-white/10'}`}>{rc}</button>
                        ))}
                      </PopoverContent>
                    </Popover>
                    
                    {/* Date Filter */}
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className={`p-2 rounded-xl hover:bg-white/10 transition-colors ${filterDate ? 'ring-2 ring-white/50' : ''}`} style={{ background: "rgba(100, 100, 100, 0.4)" }}>
                          <Calendar className="w-4 h-4 text-white" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-neutral-800 border-neutral-700 pointer-events-auto z-[100]" align="start">
                        <CalendarComponent mode="single" selected={filterDate} onSelect={setFilterDate} className="pointer-events-auto bg-neutral-800 text-white" />
                      </PopoverContent>
                    </Popover>
                    
                    {/* Employee Filter */}
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className={`p-2 rounded-xl hover:bg-white/10 transition-colors ${filterEmployee ? 'ring-2 ring-white/50' : ''}`} style={{ background: "rgba(100, 100, 100, 0.4)" }}>
                          <Users className="w-4 h-4 text-white" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-48 p-2 bg-neutral-800 border-neutral-700 pointer-events-auto z-[100]" align="start">
                        <div className="text-xs text-white/50 mb-2 px-2">Employee</div>
                        {filterOptions.employees.map(emp => (
                          <button key={emp} onClick={() => setFilterEmployee(filterEmployee === emp ? null : emp)} className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${filterEmployee === emp ? 'bg-white text-black' : 'text-white hover:bg-white/10'}`}>{emp}</button>
                        ))}
                      </PopoverContent>
                    </Popover>
                    
                    {/* Order Type Filter */}
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className={`p-2 rounded-xl hover:bg-white/10 transition-colors ${filterOrderType ? 'ring-2 ring-white/50' : ''}`} style={{ background: "rgba(100, 100, 100, 0.4)" }}>
                          <ClipboardList className="w-4 h-4 text-white" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-48 p-2 bg-neutral-800 border-neutral-700 pointer-events-auto z-[100]" align="start">
                        <div className="text-xs text-white/50 mb-2 px-2">Order Type</div>
                        {filterOptions.orderTypes.map(type => (
                          <button key={type} onClick={() => setFilterOrderType(filterOrderType === type ? null : type)} className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${filterOrderType === type ? 'bg-white text-black' : 'text-white hover:bg-white/10'}`}>
                            <OrderTypeIcon type={type} size="small" />
                            {type}
                          </button>
                        ))}
                      </PopoverContent>
                    </Popover>
                    
                    {/* Order Status Filter */}
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className={`p-2 rounded-xl hover:bg-white/10 transition-colors ${filterOrderStatus ? 'ring-2 ring-white/50' : ''}`} style={{ background: "rgba(100, 100, 100, 0.4)" }}>
                          <CircleDollarSign className="w-4 h-4 text-white" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-48 p-2 bg-neutral-800 border-neutral-700 pointer-events-auto z-[100]" align="start">
                        <div className="text-xs text-white/50 mb-2 px-2">Order Status</div>
                        {filterOptions.orderStatuses.map(status => (
                          <button key={status} onClick={() => setFilterOrderStatus(filterOrderStatus === status ? null : status)} className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${filterOrderStatus === status ? 'bg-white text-black' : 'text-white hover:bg-white/10'}`}>{status}</button>
                        ))}
                      </PopoverContent>
                    </Popover>
                    
                    {/* Payment Type Filter */}
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className={`p-2 rounded-xl hover:bg-white/10 transition-colors ${filterPaymentType ? 'ring-2 ring-white/50' : ''}`} style={{ background: "rgba(100, 100, 100, 0.4)" }}>
                          <Wallet className="w-4 h-4 text-white" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-48 p-2 bg-neutral-800 border-neutral-700 pointer-events-auto z-[100]" align="start">
                        <div className="text-xs text-white/50 mb-2 px-2">Payment Type</div>
                        {filterOptions.paymentTypes.map(pt => (
                          <button key={pt} onClick={() => setFilterPaymentType(filterPaymentType === pt ? null : pt)} className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${filterPaymentType === pt ? 'bg-white text-black' : 'text-white hover:bg-white/10'}`}>{pt}</button>
                        ))}
                      </PopoverContent>
                    </Popover>
                    
                    {/* Clear Filters Button - only show if filters are active */}
                    {hasActiveFilters && (
                      <button onClick={clearAllFilters} className="p-2 rounded-xl hover:bg-white/10 transition-colors" style={{ background: "rgba(239, 68, 68, 0.4)" }}>
                        <RotateCcw className="w-4 h-4 text-white" />
                      </button>
                    )}
                  </>
                )}
                <button 
                  onClick={() => setShowFilterPanel(!showFilterPanel)}
                  className="p-2 rounded-full hover:opacity-80 transition-opacity ml-1" 
                  style={{ background: showFilterPanel ? "rgba(255, 255, 255, 0.2)" : "#7575754D", boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)" }}
                >
                  {showFilterPanel ? <X className="w-4 h-4 text-white" /> : <SlidersHorizontal className="w-4 h-4 text-white" />}
                </button>
                <button 
                  onClick={() => setShowSearchInput(true)}
                  className="p-2 rounded-full hover:opacity-80 transition-opacity" 
                  style={{ background: "#7575754D", boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)" }}
                >
                  <Search className="w-4 h-4 text-white" />
                </button>
                <div className="overflow-visible flex items-center justify-center">
                  <AnimatedAIIcon size={20} onClick={() => setIsAIChatOpen(prev => !prev)} />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 p-3 overflow-x-auto">
          {filters.map(filter => {
            const count = getFilterCount(filter);
            return (
              <button 
                key={filter} 
                onClick={() => setActiveFilter(filter)} 
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-all ${activeFilter === filter ? "text-black" : "text-white"}`} 
                style={activeFilter === filter ? { background: "linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)" } : { background: "#7575754D", boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)" }}
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

        {/* Guest Orders List */}
        <ScrollArea className="flex-1 px-3">
          <div className="space-y-2 pb-3">
            {filteredOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Search className="w-12 h-12 text-white/20 mb-4" />
                <p className="text-white/60 text-lg font-medium">No results found</p>
                <p className="text-white/40 text-sm mt-1">
                  {searchQuery ? `No tickets match "${searchQuery}"` : "No tickets match the selected filters"}
                </p>
                {(searchQuery || hasActiveFilters) && (
                  <button 
                    onClick={() => { setSearchQuery(""); clearAllFilters(); }}
                    className="mt-4 px-4 py-2 rounded-full text-sm text-white hover:bg-white/10 transition-colors"
                    style={{ background: "#7575754D" }}
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            ) : filteredOrders.map(originalGuest => {
              // Use selectedGuest for the selected item to reflect updated tip
              const guest = originalGuest.id === selectedGuest.id ? selectedGuest : originalGuest;
              return (
              <div key={guest.id} className="space-y-0">
                <div 
                  onClick={() => { setSelectedGuest(guest); setAppliedDiscounts(ticketDiscounts[guest.id] || []); }} 
                  className={`rounded-xl border cursor-pointer transition-all overflow-hidden ${selectedGuest.id === guest.id ? "border-white" : "border-neutral-700 hover:border-neutral-600"}`} 
                  style={{ backgroundColor: '#1B1C20' }}
                >
                  <div className="flex items-stretch w-full">
                    {/* Column 1: Order Number Box */}
                    <div className="flex-shrink-0 px-2 py-1.5 flex items-center">
                      <div className="relative w-12 h-[58px] bg-neutral-800 rounded-lg flex flex-col items-center justify-center border border-neutral-600">
                        <span className="text-lg font-bold text-white truncate max-w-full px-0.5">{String(guest.orderNumber || 0)}</span>
                        <span className="text-[10px] text-gray-400 truncate max-w-full px-0.5">000</span>
                      </div>
                    </div>

                    {/* Column 2: Main Info - Horizontal Layout */}
                    <div className="flex-1 min-w-0 py-1.5 pr-2 flex items-center">
                      {/* Left Group: Name, Order Details, Revenue Center */}
                      <div className="flex flex-col min-w-[180px]">
                        {/* Row 1: Name · Table */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-white font-semibold text-sm">{guest.name}</span>
                          {guest.orderType === "Table" && (
                            <>
                              <span className="text-gray-400">·</span>
                              <span className="text-white font-semibold text-sm">{guest.table}</span>
                            </>
                          )}
                        </div>
                        {/* Row 2: Party/OrderType, Time, Timer */}
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <OrderTypeIcon type={guest.orderType} size="small" />
                          {guest.orderType === "Table" ? (
                            <span>Party of {guest.partySize},</span>
                          ) : (
                            <span>{guest.orderType},</span>
                          )}
                          <span>{guest.time}</span>
                          <span className="text-gray-500">|</span>
                          <span>{formatElapsedTime(guest.createdAt, currentTime)}</span>
                        </div>
                        {/* Row 3: Revenue Center */}
                        <span className="text-white font-medium text-xs">{guest.revenueCenter}</span>
                      </div>

                      {/* Center Group: Server + Payment */}
                      <div className="flex-1 flex flex-col items-center justify-center">
                        <span className="text-gray-400 text-xs">{guest.server}</span>
                        {hasSplitPayments(guest) ? (
                          <Popover>
                            <PopoverTrigger asChild>
                              <button className="text-xs text-white hover:text-white/80 transition-colors flex items-center gap-1">
                                <span className="truncate max-w-[100px]">{formatPaymentMethodsDisplay(guest, true).primary}</span>
                                {formatPaymentMethodsDisplay(guest, true).secondary && (
                                  <span className="text-white/60">{formatPaymentMethodsDisplay(guest, true).secondary}</span>
                                )}
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-2 bg-neutral-800 border-neutral-700" align="center" onClick={(e) => e.stopPropagation()}>
                              <div className="text-xs text-white/50 mb-1.5">Payment Methods</div>
                              <div className="space-y-1">
                                {guest.paymentMethods?.map(pm => (
                                  <div key={pm.id} className="flex items-center justify-between gap-4 text-xs">
                                    <span className="text-white flex items-center gap-1.5">
                                      <span>{getPaymentMethodIcon(pm.type)}</span>
                                      {pm.label}
                                    </span>
                                    <span className="text-white/70">{formatPrice(pm.amount)}</span>
                                  </div>
                                ))}
                              </div>
                            </PopoverContent>
                          </Popover>
                        ) : (
                          <span className={`text-xs ${guest.paymentType === "--" ? "text-gray-400" : "text-white"}`}>
                            {guest.paymentType === "--" ? "Un Paid" : guest.paymentType}
                          </span>
                        )}
                      </div>

                      {/* Right Group: Status, Amount, Tip */}
                      <div className="flex flex-col items-end min-w-[80px]">
                        {/* Row 1: Status */}
                        <span className={`font-semibold text-xs ${getStatusColor(getDisplayStatus(guest))}`}>{getDisplayStatus(guest)}</span>
                        {/* Row 2: Amount */}
                        <span className="text-white font-semibold text-sm">{formatPrice(guest.total)}</span>
                        {/* Row 3: Tip */}
                        <span className="text-gray-400 text-xs">{formatPrice(guest.tip)}</span>
                      </div>
                    </div>

                    {/* Column 3: Action Buttons */}
                    <div className="flex-shrink-0 flex">
                      <div className="flex flex-col rounded-r-xl overflow-hidden">
                        {guest.status === "PAID" || guest.paid ? (
                          <>
                          <button 
                              className="flex-1 px-3 flex items-center justify-center hover:opacity-80 transition-opacity border-b border-neutral-600 btn-receipt-gradient"
                              onClick={(e) => { e.stopPropagation(); setIsReceiptDialogOpen(true); }}
                            >
                              <img src={receiptIcon} alt="" className="w-3.5 h-3.5 brightness-0 invert" />
                            </button>
                            <button className="flex-1 px-3 flex items-center justify-center hover:opacity-80 transition-opacity btn-register-gradient" onClick={e => e.stopPropagation()}>
                              <img src={registerIcon} alt="No Sale" className="w-3.5 h-3.5 object-contain brightness-0 invert" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button 
                              className="flex-1 px-3 flex items-center justify-center hover:opacity-80 transition-opacity border-b border-neutral-600 btn-action-gradient"
                              onClick={e => { e.stopPropagation(); navigate(`/tableorder/${guest.table || 'T1'}/merge?orderId=${guest.id}`); }}
                            >
                              <img src={arrowRightIcon} alt="Merge" className="w-3.5 h-3.5 object-contain" />
                            </button>
                            <button 
                              className="flex-1 px-3 flex items-center justify-center hover:opacity-80 transition-opacity btn-transfer-gradient" 
                              onClick={e => { e.stopPropagation(); setTransferIntentOrderId(guest.id); setShowTransferIntentDialog(true); }}
                            >
                              <img src={shareOrderIcon} alt="Share" className="w-3.5 h-3.5 object-contain brightness-0" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              );
            })}
          </div>
          <ScrollBar orientation="vertical" />
        </ScrollArea>

        {/* No CTA button */}
      </div>

      {/* Right Panel - Order Details */}
      <div className="flex-1 flex flex-col">
        {/* Guest Header */}
        <div className="px-1 pt-2 pb-2">
          <div className="flex items-center justify-between text-xs mb-2 gap-2">
            <input 
              type="text" 
              value={getCurrentGuestName(selectedGuest.id, selectedGuest.name)} 
              onChange={e => handleGuestNameChange(selectedGuest.id, e.target.value)} 
              placeholder="GUEST NAME" 
              className="bg-transparent outline-none placeholder:text-[#808080] w-24 min-w-0 font-medium text-white text-xs" 
            />
            <div className="flex items-center gap-0.5">
              <img src={phoneIcon} alt="Phone" className="w-3 h-3" />
              <input 
                type="tel" 
                inputMode="tel" 
                value={formatPhoneNumber(getCurrentGuestPhone(selectedGuest.id, selectedGuest.phone))} 
                onChange={e => handleGuestPhoneChange(selectedGuest.id, e.target.value)} 
                placeholder="(XXX) XXX-XXXX" 
                className="bg-transparent outline-none placeholder:text-[#808080] w-28 min-w-0 text-white text-xs" 
              />
            </div>
            <div className="flex items-center gap-0.5 whitespace-nowrap flex-shrink-0">
              <img src={timeIcon} alt="Time" className="w-3 h-3" />
              <span className="text-white text-xs">{selectedGuest.time}</span>
            </div>
          </div>
          <div className="flex gap-2 items-center">
            {!(selectedGuest.status === "PAID" || selectedGuest.paid) && (
              <>
                <button onClick={handleAddProduct} className="h-6 px-2 bg-[#666666] hover:bg-[#555555] text-white text-[10px] rounded-[10px] border border-sidebar-border transition-colors flex items-center gap-1">
                  <img src={customItemIcon} alt="" className="w-3 h-3" />
                  Add Item
                </button>
                <button 
                  className={`h-6 px-2 hover:bg-[#555555] text-white text-[10px] rounded-[10px] border transition-colors flex items-center gap-1 ${currentTicketDiscounts.length > 0 ? 'bg-primary/30 border-primary' : 'bg-[#666666] border-sidebar-border'}`}
                  onClick={handleDiscountClick}
                >
                  <img src={discountIcon} alt="" className="w-3 h-3" />
                  Discount {currentTicketDiscounts.length > 0 && `(${currentTicketDiscounts.length})`}
                </button>
              </>
            )}
            <button 
              className="h-6 px-2 bg-[#666666] hover:bg-[#555555] text-white text-[10px] rounded-[10px] border border-sidebar-border transition-colors flex items-center gap-1"
              onClick={() => setIsReceiptDialogOpen(true)}
            >
              <img src={receiptIcon} alt="" className="w-3 h-3" />
              Receipt
            </button>
            <button 
              className="h-6 px-2 bg-[#666666] hover:bg-[#555555] text-white text-[10px] rounded-[10px] border border-sidebar-border transition-colors flex items-center gap-1"
            >
              <img src={registerIcon} alt="" className="w-3 h-3" />
              No Sale
            </button>
          </div>
        </div>

        {/* Main Panel Box */}
        <div className="flex-1 flex flex-col rounded-[10px] overflow-hidden" style={{ background: "#7575754D", boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)" }}>
          {/* Table Order Info */}
          <div className="px-4 py-3 border-b border-white/10">
            <div className={`flex items-center justify-between ${selectedGuest.orderType === "Table" ? "mb-2" : ""}`}>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-white/10 text-white text-xs rounded uppercase">
                  {selectedGuest.orderType === "Table" ? `TABLE ${selectedGuest.table}` : selectedGuest.orderType}
                </span>
                {selectedGuest.orderType === "Table" && (
                  <span className="flex items-center gap-1 text-white/60 text-xs">
                    <Users className="w-3 h-3" />
                    {selectedGuest.partySize}
                  </span>
                )}
                <span className="text-white font-bold">{String(selectedGuest.orderNumber || 0)}</span>
              </div>
              <div className="flex items-center gap-2">
                <img src={shareSeatsIcon} alt="Seats" className="w-4 h-4 opacity-60" />
                <span className="text-white/50 text-sm">{selectedGuest.server}</span>
              </div>
            </div>
            
            {/* Seat Buttons - Only for Table Orders */}
            {selectedGuest.orderType === "Table" && (
              <div className="flex items-center gap-2">
                <button className="p-1.5 bg-white/10 rounded hover:bg-white/20 transition-colors">
                  <img src={seatIcon} alt="Seat" className="w-4 h-4" />
                </button>
                <button className="p-1.5 bg-white/10 rounded hover:bg-white/20 transition-colors">
                  <img src={splitIcon} alt="Split" className="w-4 h-4" />
                </button>
                {Array.from({ length: selectedGuest.partySize || 4 }, (_, i) => i + 1).map(seat => (
                  <button 
                    key={seat} 
                    onClick={() => toggleSeat(seat)} 
                    className={`w-7 h-7 rounded text-sm font-medium transition-colors ${selectedSeats.includes(seat) ? "bg-white text-black" : "bg-white/10 text-white hover:bg-white/20"}`}
                  >
                    {seat}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="px-4 py-3 border-b border-neutral-700/50">
            <OrderNotesAutocomplete 
              value={orderNotes[selectedGuest.id] || selectedGuest.notes || ""} 
              onChange={(val) => handleNotesChange(selectedGuest.id, val)} 
              placeholder="Order notes and Allergies" 
              storageKey="tickets-order-notes" 
            />
          </div>
          {/* Order Items */}
          <ScrollArea className="flex-1 px-4">
            <div className="py-2 space-y-2">
              {getFilteredOrderItems(selectedGuest).map((item, index) => {
                const itemId = `item-${index}-${item.name}`;
                const isItemSwipeRefunded = refundedItems.has(itemId);
                
                // Get refunded quantity from persisted records
                const refundedQty = getRefundedQtyForItem(selectedGuest.id, index);
                const orderFullyRefunded = isFullyRefundedOrder(selectedGuest);
                const isFullyRefunded = refundedQty >= item.qty || isItemSwipeRefunded || orderFullyRefunded;
                const isPartiallyRefunded = !orderFullyRefunded && refundedQty > 0 && refundedQty < item.qty && !isItemSwipeRefunded;
                const remainingQty = item.qty - refundedQty;
                
                const handleItemRefund = () => {
                  // Don't allow refund on already fully refunded items
                  if (isFullyRefunded) return;
                  handleSwipeRefund({
                    id: itemId,
                    type: 'item',
                    name: item.name,
                    price: item.price * (remainingQty > 0 ? remainingQty : item.qty)
                  });
                };
                
                const handleModifierRefund = (modifier: ModifierItem, modIndex: number) => {
                  const modifierId = `mod-${index}-${modIndex}-${modifier.text}`;
                  // Don't allow refund on already refunded modifiers
                  if (isModifierRefunded(selectedGuest.id, index, modIndex)) return;
                  handleSwipeRefund({
                    id: modifierId,
                    type: 'modifier',
                    name: modifier.text,
                    price: modifier.price || 0
                  });
                };
                
                const noTaxKey = `${selectedGuest.id}-${index}-${item.name}`;
                const hasNoTax = noTaxItems.has(noTaxKey);
                const isRemoved = removedItems.has(noTaxKey);
                
                // Skip removed items in display
                if (isRemoved) {
                  return null;
                }
                
                const itemContent = (
                  <div className={`p-3 bg-neutral-800 rounded-xl border ${hasNoTax ? 'border-amber-500/50' : isFullyRefunded ? 'border-red-500/30' : 'border-neutral-700'} ${isFullyRefunded ? 'opacity-60' : ''}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-2">
                        {/* Quantity badge with refund indicator */}
                        <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
                          {isPartiallyRefunded ? (
                            <>
                              <span className="w-6 h-6 bg-red-500 rounded flex items-center justify-center text-white text-sm font-bold line-through">
                                {refundedQty}
                              </span>
                              <span className="w-6 h-6 bg-white rounded flex items-center justify-center text-black text-sm font-bold">
                                {remainingQty}
                              </span>
                            </>
                          ) : (
                            <span className={`w-6 h-6 rounded flex items-center justify-center text-sm font-bold flex-shrink-0 ${isFullyRefunded ? 'bg-red-500 text-white line-through' : 'bg-white text-black'}`}>
                              {item.qty}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`font-medium ${isFullyRefunded ? 'line-through text-red-400' : 'text-white'}`}>
                              {item.name}
                            </span>
                            {hasNoTax && (
                              <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-400 text-[9px] font-medium rounded">
                                NO TAX
                              </span>
                            )}
                            {isFullyRefunded && (
                              <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 text-[9px] font-medium rounded">
                                REFUNDED
                              </span>
                            )}
                            {isPartiallyRefunded && (
                              <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 text-[9px] font-medium rounded">
                                {refundedQty} REFUNDED
                              </span>
                            )}
                          </div>
                          {/* Rich modifiers with refund indicators */}
                          {item.richModifiers && item.richModifiers.length > 0 ? (
                            refundStep === 'closed' && !isFullyRefunded ? (
                              <SwipeableModifierTreeDesktop 
                                modifiers={item.richModifiers} 
                                onModifierRefund={handleModifierRefund}
                                refundedItems={refundedItems}
                                itemIndex={index}
                              />
                            ) : (
                              <div className="mt-1.5 ml-1">
                                {item.richModifiers.map((mod, modIdx) => {
                                  const isModRefunded = isModifierRefunded(selectedGuest.id, index, modIdx) || isFullyRefunded;
                                  let prefix = '•';
                                  if (mod.type === 'remove') prefix = '-';
                                  else if (mod.type === 'add') prefix = '+';
                                  
                                  return (
                                    <div key={modIdx} className="flex items-center text-xs h-5">
                                      <div className="relative w-4 h-full flex-shrink-0">
                                        <div 
                                          className={`absolute left-0 w-px ${isModRefunded ? 'bg-red-500/30' : 'bg-white/30'}`}
                                          style={{ 
                                            top: modIdx === 0 ? '0' : '-2px',
                                            height: modIdx === item.richModifiers!.length - 1 ? '50%' : 'calc(100% + 2px)'
                                          }}
                                        />
                                        <div className={`absolute left-0 top-1/2 w-2.5 h-px ${isModRefunded ? 'bg-red-500/30' : 'bg-white/30'}`} />
                                      </div>
                                      <div className="flex items-center flex-1 min-w-0">
                                        <span className={`mr-1.5 w-2 text-center flex-shrink-0 ${isModRefunded ? 'text-red-400/40' : 'text-white/40'}`}>{prefix}</span>
                                        <span className={`truncate ${isModRefunded ? 'line-through text-red-400' : mod.type === 'remove' ? 'text-white/40' : 'text-white/50'}`}>
                                          {mod.text}
                                        </span>
                                        {mod.price && mod.price > 0 && (
                                          <span className={`ml-auto pl-2 flex-shrink-0 ${isModRefunded ? 'line-through text-red-400' : 'text-white/60'}`}>{formatPrice(mod.price)}</span>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )
                          ) : item.modifiers.length > 0 && (
                            <SimpleModifierTree modifiers={item.modifiers} size="sm" />
                          )}
                          {/* Item Notes - Flat inline list */}
                          {item.notes && item.notes.length > 0 && (
                            <div className="mt-1.5 flex items-center text-xs">
                              <span className="text-white/40 mr-1.5">📝</span>
                              <span className="text-white/50 italic">{item.notes.join(', ')}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        {isFullyRefunded ? (
                          <span className="text-red-400 font-medium flex-shrink-0 line-through">
                            {item.displayPrice}
                          </span>
                        ) : isPartiallyRefunded ? (
                          <>
                            <span className="text-red-400 font-medium flex-shrink-0 line-through text-xs">
                              {formatPrice(item.price * refundedQty)}
                            </span>
                            <span className="text-white font-medium flex-shrink-0">
                              {formatPrice(item.price * remainingQty)}
                            </span>
                          </>
                        ) : (
                          <span className="text-white font-medium flex-shrink-0">
                            {item.displayPrice}
                          </span>
                        )}
                      </div>
                    </div>
                    {selectedGuest.orderType === "Table" && (
                      <div className="flex items-center gap-1 mt-2">
                        <img src={seatIcon} alt="Seat" className="w-4 h-4 opacity-50" />
                        {item.seats.length === 0 || item.seats.length === (selectedGuest.partySize || 4) ? (
                          <span className="w-5 h-5 bg-white/10 rounded flex items-center justify-center">
                            <Share2 className="w-3 h-3 text-white opacity-70" />
                          </span>
                        ) : (
                          item.seats.map(seat => (
                            <span key={seat} className="w-5 h-5 bg-white/10 rounded text-white text-xs flex items-center justify-center">
                              {seat}
                            </span>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                );
                
                const isPaidTicket = selectedGuest.status === "PAID" || selectedGuest.paid;
                
                // For paid/closed tickets, wrap in swipeable container for refund (only if not fully refunded)
                // For ordering/unpaid tickets, wrap in SwipeableCartItem for C and No Tax options
                if (refundStep === 'closed' && isPaidTicket && !isFullyRefunded) {
                  return (
                    <SwipeableRefundItem
                      key={index}
                      onRefund={handleItemRefund}
                      label={item.name}
                      disabled={isFullyRefunded}
                    >
                      {itemContent}
                    </SwipeableRefundItem>
                  );
                } else if (!isPaidTicket) {
                  return (
                    <SwipeableCartItem
                      key={index}
                      onDelete={() => {
                        // Remove item from order
                        setRemovedItems(prev => {
                          const newSet = new Set(prev);
                          newSet.add(noTaxKey);
                          return newSet;
                        });
                        // Also remove from noTaxItems if it was there
                        setNoTaxItems(prev => {
                          const newSet = new Set(prev);
                          newSet.delete(noTaxKey);
                          return newSet;
                        });
                      }}
                      onNoTax={() => {
                        // Toggle no tax for item
                        setNoTaxItems(prev => {
                          const newSet = new Set(prev);
                          if (newSet.has(noTaxKey)) {
                            newSet.delete(noTaxKey);
                          } else {
                            newSet.add(noTaxKey);
                          }
                          return newSet;
                        });
                      }}
                      showFire={false}
                      showOrderType={false}
                    >
                      {itemContent}
                    </SwipeableCartItem>
                  );
                } else {
                  return <div key={index}>{itemContent}</div>;
                }
              })}
            </div>
            <ScrollBar orientation="vertical" />
          </ScrollArea>

          {/* Order Summary with Tip Refund Indicator */}
          {(() => {
            const totals = calculateAdjustedTotals(selectedGuest);
            const refundedTip = getRefundedTipAmount(selectedGuest.id);
            const hasRefundedTip = refundedTip > 0;
            const remainingTip = selectedGuest.tip - refundedTip;
            const isFullTipRefunded = refundedTip >= selectedGuest.tip;
            const totalRefunded = getTotalRefundedAmount(selectedGuest);
            const isFullyRefunded = isFullyRefundedOrder(selectedGuest);
            
            return (
              <div className="p-2 border-t border-white/10 flex-shrink-0">
                <div className="text-xs flex flex-wrap items-center gap-x-4 gap-y-1">
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">Sub Total</span>
                    {totals.hasRemovedItems ? (
                      <div className="flex items-center gap-1">
                        <span className="text-white/40 line-through text-[10px]">{formatPrice(selectedGuest.subtotal)}</span>
                        <span className="text-red-400 font-semibold">{formatPrice(totals.adjustedSubtotal)}</span>
                      </div>
                    ) : (
                      <span className="text-foreground font-semibold">{formatPrice(selectedGuest.subtotal)}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 group relative">
                    <span className="text-muted-foreground">Discount</span>
                    <span className="text-foreground font-semibold">{formatPrice(effectiveDiscount)}</span>
                    {currentTicketDiscounts.length > 0 && (
                      <>
                        <button onClick={() => handleApplyTicketDiscounts([])} className="text-white hover:text-white/80 text-xs font-bold ml-0.5">×</button>
                        <span className="absolute left-0 -top-7 bg-black/90 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                          {currentTicketDiscounts.map(d => d.name).join(', ')}
                        </span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">Service Charge</span>
                    <span className="text-foreground font-semibold">{formatPrice(selectedGuest.serviceCharge)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">Tax</span>
                    {totals.hasNoTaxItems || totals.hasRemovedItems ? (
                      <div className="flex items-center gap-1">
                        <span className="text-white/40 line-through text-[10px]">{formatPrice(totals.originalTax)}</span>
                        <span className={`font-semibold ${totals.hasNoTaxItems ? 'text-amber-400' : 'text-red-400'}`}>{formatPrice(totals.adjustedTax)}</span>
                      </div>
                    ) : (
                      <span className="text-foreground font-semibold">{formatPrice(selectedGuest.tax)}</span>
                    )}
                  </div>
                </div>
                {/* Total + Tip row - only for Paid or Completed tickets */}
                {(selectedGuest.status === "PAID" || selectedGuest.status === "COMPLETED" || selectedGuest.paid) && (
                  <div className="text-sm flex items-center gap-2 mt-2 pt-2 border-t border-white/10">
                    <span className="text-muted-foreground font-medium">Total</span>
                    <span className={`font-bold ${isFullyRefunded ? 'text-red-400 line-through' : 'text-foreground'}`}>{formatPrice(selectedGuest.total)}</span>
                    {selectedGuest.tip > 0 && (
                      <>
                        <span className="text-muted-foreground font-medium">+</span>
                        <span className="text-muted-foreground font-medium">Tip</span>
                        {hasRefundedTip ? (
                          <div className="flex items-center gap-1">
                            <span className="text-red-400 line-through text-xs">{formatPrice(refundedTip)}</span>
                            {!isFullTipRefunded && (
                              <span className="text-foreground font-bold">{formatPrice(remainingTip)}</span>
                            )}
                            {isFullTipRefunded && (
                              <span className="px-1 py-0.5 bg-red-500/20 text-red-400 text-[9px] font-medium rounded">REFUNDED</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-foreground font-bold">{formatPrice(selectedGuest.tip)}</span>
                        )}
                      </>
                    )}
                  </div>
                )}
                {/* Refunded amount row - show when there's any refund */}
                {totalRefunded > 0 && refundStep === 'closed' && (
                  <div className="mt-2 pt-2 border-t border-white/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <RotateCcw className="w-3 h-3 text-red-400" />
                        <span className="text-xs text-muted-foreground">Refunded</span>
                        <span className="text-sm text-red-400 font-bold">{formatPrice(totalRefunded)}</span>
                      </div>
                      {isFullyRefunded ? (
                        <span className="px-2 py-1 bg-red-500/20 text-red-400 text-[10px] font-semibold rounded-full flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          FULLY REFUNDED
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-orange-500/20 text-orange-400 text-[10px] font-semibold rounded-full flex items-center gap-1">
                          PARTIALLY REFUNDED
                        </span>
                      )}
                    </div>
                    {/* Refund transactions as horizontal chips */}
                    {(() => {
                      const transactions = getRefundTransactionsForOrder(selectedGuest.id);
                      if (transactions.length > 0) {
                        const isExpanded = expandedRefundTransactions.has(selectedGuest.id);
                        const displayedTransactions = isExpanded ? transactions : transactions.slice(0, 3);
                        const hiddenCount = transactions.length - 3;
                        
                        return (
                          <div className="mt-2 flex flex-wrap items-center gap-1.5">
                            {displayedTransactions.map((txn) => (
                              <span key={txn.id} className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/5 rounded-full text-[10px] text-white/60">
                                {getPaymentMethodIcon(txn.paymentType)}
                                <span className="truncate max-w-[80px]">{txn.paymentMethod}</span>
                                <span className="text-red-400 font-medium">{formatPrice(txn.amount)}</span>
                              </span>
                            ))}
                            {transactions.length > 3 && (
                              <button 
                                onClick={() => toggleRefundTransactionsExpanded(selectedGuest.id)}
                                className="text-[10px] text-orange-400 hover:text-orange-300 transition-colors"
                              >
                                {isExpanded ? 'Show less' : `+${hiddenCount} more`}
                              </button>
                            )}
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                )}
              </div>
            );
          })()}

          {/* Bottom Actions */}
          <div className="px-4 py-3 border-t border-white/10 flex items-center gap-2">
            {(refundStep === 'closed' || getTotalRefundedAmount(selectedGuest) > 0) && selectedGuest.paid ? (
              // Only show refund button if there's remaining amount to refund
              getRemainingRefundableAmount(selectedGuest) > 0 ? (
                <button 
                  onClick={handleOpenRefundModal}
                  className="flex-1 py-2 rounded-full text-white text-sm font-bold transition-all hover:scale-[1.02]"
                  style={{ background: "linear-gradient(180deg, #EF4444 0%, #B91C1C 100%)" }}
                >
                  <span className="flex items-center justify-center gap-2">
                    <RotateCcw className="w-4 h-4" />
                    REFUND
                  </span>
                </button>
              ) : (
                <button 
                  disabled
                  className="flex-1 py-2 rounded-full text-white/60 text-sm font-bold cursor-not-allowed opacity-60"
                  style={{ background: "linear-gradient(180deg, #EF4444 0%, #B91C1C 100%)" }}
                >
                  <span className="flex items-center justify-center gap-2">
                    <Check className="w-4 h-4" />
                    FULLY REFUNDED
                  </span>
                </button>
              )
            ) : selectedGuest.paid ? (
              <>
                <button 
                  onClick={() => setIsTipSheetOpen(true)}
                  className="flex-1 py-2 rounded-full text-white text-sm font-bold transition-colors hover:bg-neutral-700"
                  style={{ background: "#1B1C20" }}
                >
                  ADD TIP
                </button>
                <button 
                  onClick={handleCloseTicket}
                  className="flex-1 py-2 rounded-full text-black text-sm font-bold transition-all hover:scale-[1.02]" 
                  style={{ background: "linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)" }}
                >
                  CLOSE
                </button>
              </>
            ) : (
              (() => {
                const totals = calculateAdjustedTotals(selectedGuest);
                const showSaveButton = SettingsManager.getCheckoutOptionsSettings().showSaveButton;
                return (
                  <>
                    <button 
                      onClick={handleClearOrderAttempt}
                      className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center hover:bg-red-500 transition-colors flex-shrink-0"
                    >
                      <img src={clearIcon} alt="Clear" className="w-4 h-4 brightness-0 invert" />
                    </button>
                    {showSaveButton && (
                      <button 
                        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" 
                        style={{ background: '#C9C9C9' }}
                      >
                        <img src={saveIcon} alt="Save" className="w-4 h-4 brightness-0" />
                      </button>
                    )}
                    <button 
                      className="flex-1 h-8 rounded-full flex items-center justify-center gap-1 text-white text-sm font-medium" 
                      style={{ background: "linear-gradient(180deg, #FF9E65 0%, #FF5E00 100%)" }}
                    >
                      <img src={fireIcon} alt="Fire" className="w-4 h-4 brightness-0 invert" />
                      <span>FIRE</span>
                    </button>
                    <button 
                      onClick={() => setShowPaymentDialog(true)}
                      className="flex-1 h-8 rounded-full text-black text-sm font-bold" 
                      style={{ background: "linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)" }}
                    >
                      CHARGE {formatPrice(totals.hasNoTaxItems ? totals.adjustedTotal : selectedGuest.total)}
                    </button>
                  </>
                );
              })()
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // Tablet Layout
  const tabletLayout = (
    <div className="flex h-full bg-black gap-2">
      {/* Left Panel - Order List */}
      <div className="flex flex-col flex-1 rounded-r-[20px] overflow-hidden">
        {/* Header - Inline filter options */}
        <div className="flex items-center justify-between py-2 pr-2 border-b border-neutral-700/50">
          {showSearchInput ? (
            <>
              <div className="flex-1 flex items-center gap-2 pl-3 pr-2">
                <Search className="w-4 h-4 text-white/50 flex-shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, order ID, or check..."
                  className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-white/40"
                  autoFocus
                />
              </div>
              <button 
                onClick={() => { setShowSearchInput(false); setSearchQuery(""); }}
                className="p-2 rounded-full hover:opacity-80 transition-opacity ml-2" 
                style={{ background: "rgba(255, 255, 255, 0.2)", boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)" }}
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </>
          ) : (
            <>
              <span className="text-white font-semibold text-lg pl-3">Tickets</span>
              <div className="flex items-center gap-1">
                {showFilterPanel && (
                  <>
                    {/* Revenue Center Filter */}
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className={`p-2 rounded-xl hover:bg-white/10 transition-colors ${filterRevenueCenter ? 'ring-2 ring-white/50' : ''}`} style={{ background: "rgba(100, 100, 100, 0.4)" }}>
                          <DollarSign className="w-4 h-4 text-white" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-48 p-2 bg-neutral-800 border-neutral-700 pointer-events-auto z-[100]" align="start">
                        <div className="text-xs text-white/50 mb-2 px-2">Revenue Center</div>
                        {filterOptions.revenueCenters.map(rc => (
                          <button key={rc} onClick={() => setFilterRevenueCenter(filterRevenueCenter === rc ? null : rc)} className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${filterRevenueCenter === rc ? 'bg-white text-black' : 'text-white hover:bg-white/10'}`}>{rc}</button>
                        ))}
                      </PopoverContent>
                    </Popover>
                    
                    {/* Date Filter */}
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className={`p-2 rounded-xl hover:bg-white/10 transition-colors ${filterDate ? 'ring-2 ring-white/50' : ''}`} style={{ background: "rgba(100, 100, 100, 0.4)" }}>
                          <Calendar className="w-4 h-4 text-white" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-neutral-800 border-neutral-700 pointer-events-auto z-[100]" align="start">
                        <CalendarComponent mode="single" selected={filterDate} onSelect={setFilterDate} className="pointer-events-auto bg-neutral-800 text-white" />
                      </PopoverContent>
                    </Popover>
                    
                    {/* Employee Filter */}
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className={`p-2 rounded-xl hover:bg-white/10 transition-colors ${filterEmployee ? 'ring-2 ring-white/50' : ''}`} style={{ background: "rgba(100, 100, 100, 0.4)" }}>
                          <Users className="w-4 h-4 text-white" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-48 p-2 bg-neutral-800 border-neutral-700 pointer-events-auto z-[100]" align="start">
                        <div className="text-xs text-white/50 mb-2 px-2">Employee</div>
                        {filterOptions.employees.map(emp => (
                          <button key={emp} onClick={() => setFilterEmployee(filterEmployee === emp ? null : emp)} className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${filterEmployee === emp ? 'bg-white text-black' : 'text-white hover:bg-white/10'}`}>{emp}</button>
                        ))}
                      </PopoverContent>
                    </Popover>
                    
                    {/* Order Type Filter */}
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className={`p-2 rounded-xl hover:bg-white/10 transition-colors ${filterOrderType ? 'ring-2 ring-white/50' : ''}`} style={{ background: "rgba(100, 100, 100, 0.4)" }}>
                          <ClipboardList className="w-4 h-4 text-white" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-48 p-2 bg-neutral-800 border-neutral-700 pointer-events-auto z-[100]" align="start">
                        <div className="text-xs text-white/50 mb-2 px-2">Order Type</div>
                        {filterOptions.orderTypes.map(type => (
                          <button key={type} onClick={() => setFilterOrderType(filterOrderType === type ? null : type)} className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${filterOrderType === type ? 'bg-white text-black' : 'text-white hover:bg-white/10'}`}>
                            <OrderTypeIcon type={type} size="small" />
                            {type}
                          </button>
                        ))}
                      </PopoverContent>
                    </Popover>
                    
                    {/* Order Status Filter */}
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className={`p-2 rounded-xl hover:bg-white/10 transition-colors ${filterOrderStatus ? 'ring-2 ring-white/50' : ''}`} style={{ background: "rgba(100, 100, 100, 0.4)" }}>
                          <CircleDollarSign className="w-4 h-4 text-white" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-48 p-2 bg-neutral-800 border-neutral-700 pointer-events-auto z-[100]" align="start">
                        <div className="text-xs text-white/50 mb-2 px-2">Order Status</div>
                        {filterOptions.orderStatuses.map(status => (
                          <button key={status} onClick={() => setFilterOrderStatus(filterOrderStatus === status ? null : status)} className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${filterOrderStatus === status ? 'bg-white text-black' : 'text-white hover:bg-white/10'}`}>{status}</button>
                        ))}
                      </PopoverContent>
                    </Popover>
                    
                    {/* Payment Type Filter */}
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className={`p-2 rounded-xl hover:bg-white/10 transition-colors ${filterPaymentType ? 'ring-2 ring-white/50' : ''}`} style={{ background: "rgba(100, 100, 100, 0.4)" }}>
                          <Wallet className="w-4 h-4 text-white" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-48 p-2 bg-neutral-800 border-neutral-700 pointer-events-auto z-[100]" align="start">
                        <div className="text-xs text-white/50 mb-2 px-2">Payment Type</div>
                        {filterOptions.paymentTypes.map(pt => (
                          <button key={pt} onClick={() => setFilterPaymentType(filterPaymentType === pt ? null : pt)} className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${filterPaymentType === pt ? 'bg-white text-black' : 'text-white hover:bg-white/10'}`}>{pt}</button>
                        ))}
                      </PopoverContent>
                    </Popover>
                    
                    {/* Clear Filters Button - only show if filters are active */}
                    {hasActiveFilters && (
                      <button onClick={clearAllFilters} className="p-2 rounded-xl hover:bg-white/10 transition-colors" style={{ background: "rgba(239, 68, 68, 0.4)" }}>
                        <RotateCcw className="w-4 h-4 text-white" />
                      </button>
                    )}
                  </>
                )}
                <button 
                  onClick={() => setShowFilterPanel(!showFilterPanel)}
                  className="p-2 rounded-full hover:opacity-80 transition-opacity ml-1" 
                  style={{ background: showFilterPanel ? "rgba(255, 255, 255, 0.2)" : "#7575754D", boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)" }}
                >
                  {showFilterPanel ? <X className="w-4 h-4 text-white" /> : <SlidersHorizontal className="w-4 h-4 text-white" />}
                </button>
                <button 
                  onClick={() => setShowSearchInput(true)}
                  className="p-2 rounded-full hover:opacity-80 transition-opacity" 
                  style={{ background: "#7575754D", boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)" }}
                >
                  <Search className="w-4 h-4 text-white" />
                </button>
                <div className="overflow-visible flex items-center justify-center">
                  <AnimatedAIIcon size={20} onClick={() => setIsAIChatOpen(prev => !prev)} />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 p-3 overflow-x-auto scrollbar-hide">
          {filters.map(filter => {
            const count = getFilterCount(filter);
            return (
              <button 
                key={filter} 
                onClick={() => setActiveFilter(filter)} 
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-all ${activeFilter === filter ? "text-black" : "text-white"}`} 
                style={activeFilter === filter ? { background: "linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)" } : { background: "#1B1C20" }}
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

        {/* Guest Orders List - Mobile style cards */}
        <ScrollArea className="flex-1 px-3">
          <div className="space-y-2 pb-3">
            {filteredOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Search className="w-10 h-10 text-white/20 mb-3" />
                <p className="text-white/60 text-base font-medium">No results found</p>
                <p className="text-white/40 text-xs mt-1">
                  {searchQuery ? `No tickets match "${searchQuery}"` : "No tickets match the selected filters"}
                </p>
                {(searchQuery || hasActiveFilters) && (
                  <button 
                    onClick={() => { setSearchQuery(""); clearAllFilters(); }}
                    className="mt-3 px-3 py-1.5 rounded-full text-xs text-white hover:bg-white/10 transition-colors"
                    style={{ background: "#7575754D" }}
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            ) : filteredOrders.map(guest => (
              <div key={guest.id} className="space-y-0">
                <div onClick={() => { setSelectedGuest(guest); setAppliedDiscounts(ticketDiscounts[guest.id] || []); }} className={`rounded-xl border cursor-pointer transition-all overflow-hidden ${selectedGuest.id === guest.id ? "border-white" : "border-neutral-700 hover:border-neutral-600"}`} style={{ backgroundColor: '#1B1C20' }}>
                  <div className="flex items-stretch w-full">
                    {/* Column 1: Order Number Box */}
                    <div className="flex-shrink-0 px-2 py-2 flex items-center">
                      <div className="relative w-12 h-[60px] bg-neutral-800 rounded-lg flex flex-col items-center justify-center border border-neutral-600">
                        <span className="text-lg font-bold text-white truncate max-w-full px-0.5">{String(guest.orderNumber || 0)}</span>
                        <span className="text-xs text-gray-400 truncate max-w-full px-0.5">000</span>
                      </div>
                    </div>

                    {/* Column 2: Left Info */}
                    <div className="flex-1 min-w-0 py-2 pr-2">
                      {/* Row 1: Name · Table */}
                      <div className="flex items-center gap-1 text-sm">
                        <span className="text-white font-semibold">{guest.name}</span>
                        {guest.orderType === "Table" && (
                          <>
                            <span className="text-gray-400">·</span>
                            <span className="text-white font-semibold">{guest.table}</span>
                          </>
                        )}
                      </div>
                      
                      {/* Row 2: Order Type with Icon, Time */}
                      <div className="flex items-center gap-1 mt-0.5 text-xs text-gray-400">
                        <OrderTypeIcon type={guest.orderType} size="small" />
                        {guest.orderType === "Table" ? (
                          <span>Party of {guest.partySize},</span>
                        ) : (
                          <span>{guest.orderType},</span>
                        )}
                        <span>{guest.time}</span>
                        <span className="text-gray-500">|</span>
                        <span>{formatElapsedTime(guest.createdAt, currentTime)}</span>
                      </div>
                      
                      {/* Row 3: Revenue Center */}
                      <div className="mt-0.5 text-xs">
                        <span className="text-white">{guest.revenueCenter}</span>
                      </div>
                    </div>

                    {/* Column 3: Center Info - Employee & Payment */}
                    <div className="flex flex-col items-center justify-center px-4 min-w-[100px]">
                      <span className="text-gray-400 text-xs">{guest.server}</span>
                      <span className={`text-xs mt-1 ${guest.paymentType === "--" ? "text-gray-400" : "text-white"}`}>
                        {guest.paymentType === "--" ? "Un Paid" : guest.paymentType}
                      </span>
                    </div>

                    {/* Column 4: Right Info - Status, Amount, Tip */}
                    <div className="flex flex-col items-end justify-center pr-3 min-w-[80px]">
                      <span className={`text-xs font-semibold ${getStatusColor(getDisplayStatus(guest))}`}>{getDisplayStatus(guest)}</span>
                      <span className="text-white font-semibold text-sm mt-0.5">{formatPrice(guest.total)}</span>
                      <span className="text-gray-400 text-xs">{formatPrice(guest.tip)}</span>
                    </div>

                    {/* Column 5: Action Buttons */}
                    <div className="flex-shrink-0">
                      <div className="flex flex-col rounded-r-xl overflow-hidden h-full">
                        {guest.status === "PAID" || guest.paid ? (
                          <>
                            <button 
                              className="flex-1 px-3 flex items-center justify-center hover:opacity-80 transition-opacity border-b border-neutral-600 btn-receipt-gradient"
                              onClick={(e) => { e.stopPropagation(); setIsReceiptDialogOpen(true); }}
                            >
                              <img src={receiptIcon} alt="" className="w-4 h-4 brightness-0 invert" />
                            </button>
                            <button className="flex-1 px-3 flex items-center justify-center hover:opacity-80 transition-opacity btn-register-gradient" onClick={e => e.stopPropagation()}>
                              <img src={registerIcon} alt="No Sale" className="w-4 h-4 object-contain brightness-0 invert" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button 
                              className="flex-1 px-3 flex items-center justify-center hover:opacity-80 transition-opacity border-b border-neutral-600 btn-action-gradient"
                              onClick={e => { e.stopPropagation(); navigate(`/tableorder/${guest.table || 'T1'}/merge?orderId=${guest.id}`); }}
                            >
                              <img src={arrowRightIcon} alt="Arrow" className="w-4 h-4 object-contain" />
                            </button>
                            <button 
                              className="flex-1 px-3 flex items-center justify-center hover:opacity-80 transition-opacity btn-transfer-gradient" 
                              onClick={e => { e.stopPropagation(); setTransferIntentOrderId(guest.id); setShowTransferIntentDialog(true); }}
                            >
                              <img src={shareOrderIcon} alt="Share" className="w-4 h-4 object-contain brightness-0" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <ScrollBar orientation="vertical" />
        </ScrollArea>

        {/* No CTA button */}
      </div>

      {/* Right Panel - Order Details (condensed) */}
      <div className="w-[280px] flex flex-col">
        {/* Guest Header */}
        <div className="px-1 pt-2 pb-2">
          <div className="flex items-center justify-between text-xs mb-2 gap-2">
            <input 
              type="text" 
              value={getCurrentGuestName(selectedGuest.id, selectedGuest.name)} 
              onChange={e => handleGuestNameChange(selectedGuest.id, e.target.value)} 
              placeholder="GUEST NAME" 
              className="bg-transparent outline-none placeholder:text-[#808080] w-20 min-w-0 font-medium text-white text-xs" 
            />
            <div className="flex items-center gap-0.5">
              <img src={phoneIcon} alt="Phone" className="w-3 h-3" />
              <input 
                type="tel" 
                inputMode="tel" 
                value={formatPhoneNumber(getCurrentGuestPhone(selectedGuest.id, selectedGuest.phone))} 
                onChange={e => handleGuestPhoneChange(selectedGuest.id, e.target.value)} 
                placeholder="(XXX) XXX-XXXX" 
                className="bg-transparent outline-none placeholder:text-[#808080] w-24 min-w-0 text-white text-xs" 
              />
            </div>
            <div className="flex items-center gap-0.5 whitespace-nowrap flex-shrink-0">
              <img src={timeIcon} alt="Time" className="w-3 h-3" />
              <span className="text-white text-xs">{selectedGuest.time}</span>
            </div>
          </div>
          <div className="flex gap-1 items-center flex-wrap">
            {!(selectedGuest.status === "PAID" || selectedGuest.paid) && (
              <>
                <button onClick={handleAddProduct} className="h-6 px-2 bg-[#666666] hover:bg-[#555555] text-white text-[10px] rounded-[10px] border border-sidebar-border transition-colors flex items-center gap-1">
                  <img src={customItemIcon} alt="" className="w-3 h-3" />
                  Add Item
                </button>
                <button 
                  className={`h-6 px-2 hover:bg-[#555555] text-white text-[10px] rounded-[10px] border transition-colors flex items-center gap-1 ${currentTicketDiscounts.length > 0 ? 'bg-primary/30 border-primary' : 'bg-[#666666] border-sidebar-border'}`}
                  onClick={handleDiscountClick}
                >
                  <img src={discountIcon} alt="" className="w-3 h-3" />
                  Discount {currentTicketDiscounts.length > 0 && `(${currentTicketDiscounts.length})`}
                </button>
              </>
            )}
            <button 
              className="h-6 px-2 bg-[#666666] hover:bg-[#555555] text-white text-[10px] rounded-[10px] border border-sidebar-border transition-colors flex items-center gap-1"
              onClick={() => setIsReceiptDialogOpen(true)}
            >
              <img src={receiptIcon} alt="" className="w-3 h-3" />
              Receipt
            </button>
            <button 
              className="h-6 px-2 bg-[#666666] hover:bg-[#555555] text-white text-[10px] rounded-[10px] border border-sidebar-border transition-colors flex items-center gap-1"
            >
              <img src={registerIcon} alt="" className="w-3 h-3" />
              No Sale
            </button>
          </div>
        </div>

        {/* Main Panel Box */}
        <div className="flex-1 flex flex-col rounded-[10px] overflow-hidden" style={{ background: "#7575754D", boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)" }}>
          {/* Table Order Info */}
          <div className="px-3 py-2 border-b border-white/10">
            <div className={`flex items-center justify-between ${selectedGuest.orderType === "Table" ? "mb-1" : ""}`}>
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 bg-white/10 text-white text-xs rounded uppercase">
                  {selectedGuest.orderType === "Table" ? `TABLE ${selectedGuest.table}` : selectedGuest.orderType}
                </span>
                {selectedGuest.orderType === "Table" && (
                  <span className="flex items-center gap-1 text-white/60 text-[10px]">
                    <Users className="w-2.5 h-2.5" />
                    {selectedGuest.partySize}
                  </span>
                )}
                <span className="text-white font-bold text-sm">{String(selectedGuest.orderNumber || 0)}</span>
              </div>
              <span className="text-white/50 text-xs">{selectedGuest.server}</span>
            </div>
            
            {/* Seat Buttons - Only for Table Orders */}
            {selectedGuest.orderType === "Table" && (
              <div className="flex items-center gap-1">
                <button className="p-1 bg-white/10 rounded hover:bg-white/20 transition-colors">
                  <img src={seatIcon} alt="Seat" className="w-3 h-3" />
                </button>
                {Array.from({ length: selectedGuest.partySize || 4 }, (_, i) => i + 1).map(seat => (
                  <button 
                    key={seat} 
                    onClick={() => toggleSeat(seat)}
                    className={`w-6 h-6 rounded text-xs font-medium transition-colors ${selectedSeats.includes(seat) ? "bg-white text-black" : "bg-white/10 text-white hover:bg-white/20"}`}
                  >
                    {seat}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="px-3 py-2 border-b border-neutral-700/50">
            <OrderNotesAutocomplete 
              value={orderNotes[selectedGuest.id] || selectedGuest.notes || ""} 
              onChange={(val) => handleNotesChange(selectedGuest.id, val)} 
              placeholder="Order notes and Allergies" 
              storageKey="tickets-order-notes" 
            />
          </div>
          {/* Order Items */}
          <ScrollArea className="flex-1 px-3">
            <div className="py-2 space-y-1.5">
              {getFilteredOrderItems(selectedGuest).map((item, index) => {
                const itemId = `item-${index}-${item.name}`;
                const isItemSwipeRefunded = refundedItems.has(itemId);
                
                // Get refunded quantity from persisted records
                const refundedQty = getRefundedQtyForItem(selectedGuest.id, index);
                const orderFullyRefunded = isFullyRefundedOrder(selectedGuest);
                const isFullyRefunded = refundedQty >= item.qty || isItemSwipeRefunded || orderFullyRefunded;
                const isPartiallyRefunded = !orderFullyRefunded && refundedQty > 0 && refundedQty < item.qty && !isItemSwipeRefunded;
                const remainingQty = item.qty - refundedQty;
                
                const handleItemRefund = () => {
                  if (isFullyRefunded) return;
                  handleSwipeRefund({
                    id: itemId,
                    type: 'item',
                    name: item.name,
                    price: item.price * (remainingQty > 0 ? remainingQty : item.qty)
                  });
                };
                
                const handleModifierRefund = (modifier: ModifierItem, modIndex: number) => {
                  const modifierId = `mod-${index}-${modIndex}-${modifier.text}`;
                  if (isModifierRefunded(selectedGuest.id, index, modIndex)) return;
                  handleSwipeRefund({
                    id: modifierId,
                    type: 'modifier',
                    name: modifier.text,
                    price: modifier.price || 0
                  });
                };
                
                const itemContent = (
                  <div className={`p-2 bg-neutral-800 rounded-lg border ${isFullyRefunded ? 'border-red-500/30' : 'border-neutral-700'} ${isFullyRefunded ? 'opacity-60' : ''}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-2">
                        {/* Quantity badge with refund indicator */}
                        <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
                          {isPartiallyRefunded ? (
                            <>
                              <span className="w-5 h-5 bg-red-500 rounded flex items-center justify-center text-white text-xs font-bold line-through">
                                {refundedQty}
                              </span>
                              <span className="w-5 h-5 bg-white rounded flex items-center justify-center text-black text-xs font-bold">
                                {remainingQty}
                              </span>
                            </>
                          ) : (
                            <span className={`w-5 h-5 rounded flex items-center justify-center text-xs font-bold flex-shrink-0 ${isFullyRefunded ? 'bg-red-500 text-white line-through' : 'bg-white text-black'}`}>
                              {item.qty}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1 flex-wrap">
                            <span className={`font-medium text-sm ${isFullyRefunded ? 'line-through text-red-400' : 'text-white'}`}>
                              {item.name}
                            </span>
                            {isFullyRefunded && (
                              <span className="px-1 py-0.5 bg-red-500/20 text-red-400 text-[8px] font-medium rounded">
                                REFUNDED
                              </span>
                            )}
                          </div>
                          {/* Rich modifiers with refund indicators */}
                          {item.richModifiers && item.richModifiers.length > 0 ? (
                            refundStep === 'closed' && !isFullyRefunded ? (
                              <SwipeableModifierTreeDesktop 
                                modifiers={item.richModifiers} 
                                onModifierRefund={handleModifierRefund}
                                refundedItems={refundedItems}
                                itemIndex={index}
                              />
                            ) : (
                              <div className="mt-1">
                                {item.richModifiers.map((mod, modIdx) => {
                                  const isModRefunded = isModifierRefunded(selectedGuest.id, index, modIdx) || isFullyRefunded;
                                  let prefix = '•';
                                  if (mod.type === 'remove') prefix = '-';
                                  else if (mod.type === 'add') prefix = '+';
                                  
                                  return (
                                    <div key={modIdx} className="flex items-center text-[10px] h-4">
                                      <div className="relative w-3 h-full flex-shrink-0">
                                        <div 
                                          className={`absolute left-0 w-px ${isModRefunded ? 'bg-red-500/30' : 'bg-white/30'}`}
                                          style={{ 
                                            top: modIdx === 0 ? '0' : '-2px',
                                            height: modIdx === item.richModifiers!.length - 1 ? '50%' : 'calc(100% + 2px)'
                                          }}
                                        />
                                        <div className={`absolute left-0 top-1/2 w-2 h-px ${isModRefunded ? 'bg-red-500/30' : 'bg-white/30'}`} />
                                      </div>
                                      <div className="flex items-center flex-1 min-w-0">
                                        <span className={`mr-1 w-2 text-center flex-shrink-0 ${isModRefunded ? 'text-red-400/40' : 'text-white/40'}`}>{prefix}</span>
                                        <span className={`truncate ${isModRefunded ? 'line-through text-red-400' : mod.type === 'remove' ? 'text-white/40' : 'text-white/50'}`}>
                                          {mod.text}
                                        </span>
                                        {mod.price && mod.price > 0 && (
                                          <span className={`ml-auto pl-1 flex-shrink-0 ${isModRefunded ? 'line-through text-red-400' : 'text-white/60'}`}>{formatPrice(mod.price)}</span>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )
                          ) : item.modifiers.length > 0 && (
                            <SimpleModifierTree modifiers={item.modifiers} size="xs" />
                          )}
                          {/* Item Notes - Flat inline list */}
                          {item.notes && item.notes.length > 0 && (
                            <div className="mt-1 flex items-center text-[10px]">
                              <span className="text-white/40 mr-1">📝</span>
                              <span className="text-white/50 italic">{item.notes.join(', ')}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        {isFullyRefunded ? (
                          <span className="text-red-400 font-medium text-sm flex-shrink-0 line-through">
                            {item.displayPrice}
                          </span>
                        ) : isPartiallyRefunded ? (
                          <>
                            <span className="text-red-400 font-medium flex-shrink-0 line-through text-[10px]">
                              {formatPrice(item.price * refundedQty)}
                            </span>
                            <span className="text-white font-medium text-sm flex-shrink-0">
                              {formatPrice(item.price * remainingQty)}
                            </span>
                          </>
                        ) : (
                          <span className="text-white font-medium text-sm flex-shrink-0">
                            {item.displayPrice}
                          </span>
                        )}
                      </div>
                    </div>
                    {selectedGuest.orderType === "Table" && (
                      <div className="flex items-center gap-1 mt-2">
                        <img src={seatIcon} alt="Seat" className="w-3 h-3 opacity-50" />
                        {item.seats.length === 0 || item.seats.length === (selectedGuest.partySize || 4) ? (
                          <span className="w-4 h-4 bg-white/10 rounded flex items-center justify-center">
                            <Share2 className="w-2.5 h-2.5 text-white opacity-70" />
                          </span>
                        ) : (
                          item.seats.map(seat => (
                            <span key={seat} className="w-4 h-4 bg-white/10 rounded text-white text-[10px] flex items-center justify-center">
                              {seat}
                            </span>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                );
                
                const isPaidTicket = selectedGuest.status === "PAID" || selectedGuest.paid;
                const noTaxKey = `${selectedGuest.id}-${index}-${item.name}`;
                
                // For paid/closed tickets, wrap in swipeable container for refund (only if not fully refunded)
                if (refundStep === 'closed' && isPaidTicket && !isFullyRefunded) {
                  return (
                    <SwipeableRefundItem
                      key={index}
                      onRefund={handleItemRefund}
                      label={item.name}
                      disabled={isFullyRefunded}
                    >
                      {itemContent}
                    </SwipeableRefundItem>
                  );
                } else if (!isPaidTicket) {
                  return (
                    <SwipeableCartItem
                      key={index}
                      onDelete={() => {
                        setRemovedItems(prev => {
                          const newSet = new Set(prev);
                          newSet.add(noTaxKey);
                          return newSet;
                        });
                        setNoTaxItems(prev => {
                          const newSet = new Set(prev);
                          newSet.delete(noTaxKey);
                          return newSet;
                        });
                      }}
                      onNoTax={() => {
                        setNoTaxItems(prev => {
                          const newSet = new Set(prev);
                          if (newSet.has(noTaxKey)) {
                            newSet.delete(noTaxKey);
                          } else {
                            newSet.add(noTaxKey);
                          }
                          return newSet;
                        });
                      }}
                      showFire={false}
                      showOrderType={false}
                    >
                      {itemContent}
                    </SwipeableCartItem>
                  );
                } else {
                  return <div key={index}>{itemContent}</div>;
                }
              })}
            </div>
            <ScrollBar orientation="vertical" />
          </ScrollArea>

          {/* Order Summary with Tip Refund Indicator */}
          {(() => {
            const refundedTip = getRefundedTipAmount(selectedGuest.id);
            const hasRefundedTip = refundedTip > 0;
            const remainingTip = selectedGuest.tip - refundedTip;
            const isFullTipRefunded = refundedTip >= selectedGuest.tip;
            const totalRefunded = getTotalRefundedAmount(selectedGuest);
            const isFullyRefunded = isFullyRefundedOrder(selectedGuest);
            
            return (
              <div className="p-2 border-t border-white/10 flex-shrink-0">
                <div className="text-xs flex flex-wrap items-center gap-x-4 gap-y-1">
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">Sub Total</span>
                    <span className="text-foreground font-semibold">{formatPrice(selectedGuest.subtotal)}</span>
                  </div>
                  <div className="flex items-center gap-1 group relative">
                    <span className="text-muted-foreground">Discount</span>
                    <span className="text-foreground font-semibold">{formatPrice(effectiveDiscount)}</span>
                    {currentTicketDiscounts.length > 0 && (
                      <>
                        <button onClick={() => handleApplyTicketDiscounts([])} className="text-white hover:text-white/80 text-xs font-bold ml-0.5">×</button>
                        <span className="absolute left-0 -top-7 bg-black/90 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                          {currentTicketDiscounts.map(d => d.name).join(', ')}
                        </span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">Service Charge</span>
                    <span className="text-foreground font-semibold">{formatPrice(selectedGuest.serviceCharge)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">Tax</span>
                    <span className="text-foreground font-semibold">{formatPrice(selectedGuest.tax)}</span>
                  </div>
                </div>
                {/* Total + Tip row - only for Paid or Completed tickets */}
                {(selectedGuest.status === "PAID" || selectedGuest.status === "COMPLETED" || selectedGuest.paid) && (
                  <div className="text-sm flex items-center gap-2 mt-2 pt-2 border-t border-white/10">
                    <span className="text-muted-foreground font-medium">Total</span>
                    <span className={`font-bold ${isFullyRefunded ? 'text-red-400 line-through' : 'text-foreground'}`}>{formatPrice(selectedGuest.total)}</span>
                    {selectedGuest.tip > 0 && (
                      <>
                        <span className="text-muted-foreground font-medium">+</span>
                        <span className="text-muted-foreground font-medium">Tip</span>
                        {hasRefundedTip ? (
                          <div className="flex items-center gap-1">
                            <span className="text-red-400 line-through text-xs">{formatPrice(refundedTip)}</span>
                            {!isFullTipRefunded && (
                              <span className="text-foreground font-bold">{formatPrice(remainingTip)}</span>
                            )}
                            {isFullTipRefunded && (
                              <span className="px-1 py-0.5 bg-red-500/20 text-red-400 text-[8px] font-medium rounded">REFUNDED</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-foreground font-bold">{formatPrice(selectedGuest.tip)}</span>
                        )}
                      </>
                    )}
                  </div>
                )}
                {/* Refunded amount row - show when there's any refund */}
                {totalRefunded > 0 && refundStep === 'closed' && (
                  <div className="mt-2 pt-2 border-t border-white/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <RotateCcw className="w-3 h-3 text-red-400" />
                        <span className="text-[10px] text-muted-foreground">Refunded</span>
                        <span className="text-xs text-red-400 font-bold">{formatPrice(totalRefunded)}</span>
                      </div>
                      {isFullyRefunded ? (
                        <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 text-[8px] font-semibold rounded-full flex items-center gap-1">
                          <Check className="w-2.5 h-2.5" />
                          FULLY REFUNDED
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 bg-orange-500/20 text-orange-400 text-[8px] font-semibold rounded-full flex items-center gap-1">
                          PARTIALLY REFUNDED
                        </span>
                      )}
                    </div>
                    {/* Refund transactions as horizontal chips */}
                    {(() => {
                      const transactions = getRefundTransactionsForOrder(selectedGuest.id);
                      if (transactions.length > 0) {
                        const isExpanded = expandedRefundTransactions.has(selectedGuest.id);
                        const displayedTransactions = isExpanded ? transactions : transactions.slice(0, 3);
                        const hiddenCount = transactions.length - 3;
                        
                        return (
                          <div className="mt-1.5 flex flex-wrap items-center gap-1">
                            {displayedTransactions.map((txn) => (
                              <span key={txn.id} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-white/5 rounded-full text-[9px] text-white/60">
                                {getPaymentMethodIcon(txn.paymentType)}
                                <span className="truncate max-w-[60px]">{txn.paymentMethod}</span>
                                <span className="text-red-400 font-medium">{formatPrice(txn.amount)}</span>
                              </span>
                            ))}
                            {transactions.length > 3 && (
                              <button 
                                onClick={() => toggleRefundTransactionsExpanded(selectedGuest.id)}
                                className="text-[9px] text-orange-400 hover:text-orange-300 transition-colors"
                              >
                                {isExpanded ? 'Show less' : `+${hiddenCount} more`}
                              </button>
                            )}
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                )}
              </div>
            );
          })()}

          {/* Bottom Actions */}
          <div className="px-3 py-2 border-t border-white/10 flex items-center gap-2">
            {(refundStep === 'closed' || getTotalRefundedAmount(selectedGuest) > 0) && selectedGuest.paid ? (
              // Only show refund button if there's remaining amount to refund
              getRemainingRefundableAmount(selectedGuest) > 0 ? (
                <button 
                  onClick={handleOpenRefundModal}
                  className="flex-1 py-1.5 rounded-full text-white text-xs font-bold transition-all hover:scale-[1.02]"
                  style={{ background: "linear-gradient(180deg, #EF4444 0%, #B91C1C 100%)" }}
                >
                  <span className="flex items-center justify-center gap-2">
                    <RotateCcw className="w-3 h-3" />
                    REFUND
                  </span>
                </button>
              ) : (
                <button 
                  disabled
                  className="flex-1 py-1.5 rounded-full text-white/60 text-xs font-bold cursor-not-allowed opacity-60"
                  style={{ background: "linear-gradient(180deg, #EF4444 0%, #B91C1C 100%)" }}
                >
                  <span className="flex items-center justify-center gap-2">
                    <Check className="w-3 h-3" />
                    FULLY REFUNDED
                  </span>
                </button>
              )
            ) : selectedGuest.paid ? (
              <>
                <button 
                  onClick={() => setIsTipSheetOpen(true)}
                  className="flex-1 py-1.5 rounded-full text-white text-xs font-bold transition-colors hover:bg-neutral-700"
                  style={{ background: "#1B1C20" }}
                >
                  ADD TIP
                </button>
                <button 
                  onClick={handleCloseTicket}
                  className="flex-1 py-1.5 rounded-full text-black text-xs font-bold transition-all hover:scale-[1.02]" 
                  style={{ background: "linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)" }}
                >
                  CLOSE
                </button>
              </>
            ) : (
              (() => {
                const showSaveButton = SettingsManager.getCheckoutOptionsSettings().showSaveButton;
                return (
                  <>
                    <button 
                      onClick={handleClearOrderAttempt}
                      className="w-7 h-7 rounded-full bg-red-600 flex items-center justify-center hover:bg-red-500 transition-colors flex-shrink-0"
                    >
                      <img src={clearIcon} alt="Clear" className="w-3 h-3 brightness-0 invert" />
                    </button>
                    {showSaveButton && (
                      <button 
                        className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" 
                        style={{ background: '#C9C9C9' }}
                      >
                        <img src={saveIcon} alt="Save" className="w-3 h-3 brightness-0" />
                      </button>
                    )}
                    <button 
                      className="flex-1 h-7 rounded-full flex items-center justify-center gap-1 text-white text-xs font-medium" 
                      style={{ background: "linear-gradient(180deg, #FF9E65 0%, #FF5E00 100%)" }}
                    >
                      <img src={fireIcon} alt="Fire" className="w-3 h-3 brightness-0 invert" />
                      <span>FIRE</span>
                    </button>
                    <button 
                      onClick={() => setShowPaymentDialog(true)}
                      className="flex-1 h-7 rounded-full text-black text-xs font-bold" 
                      style={{ background: "linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)" }}
                    >
                      CHARGE {formatPrice(selectedGuest.total)}
                    </button>
                  </>
                );
              })()
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // Refund Modal Component - Responsive (Bottom Sheet on mobile, Dialog on desktop)
  const refundModal = useMemo(() => {
    // Get current step configuration
    const getStepConfig = () => {
      switch (refundStep) {
        case 'type-selection':
          return { title: 'Select Refund Type', onBack: undefined };
        case 'full-refund':
          return { title: 'Full Refund', onBack: () => setRefundStep('type-selection') };
        case 'partial-refund':
          return { title: 'Partial Refund', onBack: () => setRefundStep('type-selection') };
        case 'custom-refund':
          return { title: 'Custom Refund', onBack: () => setRefundStep('type-selection') };
        case 'tip-refund':
          return { title: 'Tip Refund', onBack: () => setRefundStep('type-selection') };
        case 'item-refund':
          return {
            title: swipeRefundTarget?.type === 'item' ? 'Item Refund' : 'Modifier Refund',
            onBack: () => {
              setRefundStep('closed');
              setIsRefundModalOpen(false);
              setSwipeRefundTarget(null);
            }
          };
        case 'confirmation':
          return { title: 'Confirm Refund', onBack: () => setRefundStep('type-selection') };
        case 'success':
          return { title: 'Refund Successful', onBack: undefined };
        default:
          return { title: 'Refund', onBack: undefined };
      }
    };

    const stepConfig = getStepConfig();

    const getStepFooter = () => {
      switch (refundStep) {
        case 'full-refund':
          return (
            <div className="p-4">
              <button
                onClick={handleProceedRefund}
                className="w-full py-3 rounded-full text-white font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{ background: "linear-gradient(180deg, #EF4444 0%, #B91C1C 100%)" }}
              >
                PROCEED REFUND
              </button>
            </div>
          );
        case 'partial-refund':
          return (
            <div className="p-4">
              <button
                onClick={handleProceedRefund}
                disabled={getTotalRefundSelectionsCount() === 0}
                className={`w-full py-3 rounded-full font-bold text-sm transition-all ${
                  getTotalRefundSelectionsCount() > 0
                    ? 'text-white hover:scale-[1.02] active:scale-[0.98]'
                    : 'text-white/50 cursor-not-allowed'
                }`}
                style={{
                  background: getTotalRefundSelectionsCount() > 0
                    ? "linear-gradient(180deg, #F97316 0%, #C2410C 100%)"
                    : "linear-gradient(180deg, #525252 0%, #404040 100%)"
                }}
              >
                PROCEED REFUND {getTotalRefundSelectionsCount() > 0 && `(${formatPrice(getPartialRefundTotal(includeRefundTip))})`}
              </button>
            </div>
          );
        case 'custom-refund':
          return (
            <div className="p-4">
              <button
                onClick={handleProceedRefund}
                disabled={!isCustomAmountValid()}
                className={`w-full py-3 rounded-full font-bold text-sm transition-all ${
                  isCustomAmountValid()
                    ? 'text-white hover:scale-[1.02] active:scale-[0.98]'
                    : 'text-white/50 cursor-not-allowed'
                }`}
                style={{
                  background: isCustomAmountValid()
                    ? "linear-gradient(180deg, #A78BFA 0%, #7C3AED 100%)"
                    : "linear-gradient(180deg, #525252 0%, #404040 100%)"
                }}
              >
                PROCEED REFUND {isCustomAmountValid() && `(${formatPrice(getCustomRefundValue())})`}
              </button>
            </div>
          );
        case 'tip-refund':
          return (
            <div className="p-4">
              <button
                onClick={handleProceedRefund}
                disabled={!isTipAmountValid()}
                className={`w-full py-3 rounded-full font-bold text-sm transition-all ${
                  isTipAmountValid()
                    ? 'text-white hover:scale-[1.02] active:scale-[0.98]'
                    : 'text-white/50 cursor-not-allowed'
                }`}
                style={{
                  background: isTipAmountValid()
                    ? "linear-gradient(180deg, #FCD34D 0%, #F59E0B 100%)"
                    : "linear-gradient(180deg, #525252 0%, #404040 100%)"
                }}
              >
                PROCEED REFUND {isTipAmountValid() && `(${formatPrice(getTipRefundValue())})`}
              </button>
            </div>
          );
        case 'item-refund':
          return (
            <div className="p-4">
              <button
                onClick={handleProceedRefund}
                className="w-full py-3 rounded-full text-white font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{ background: "linear-gradient(180deg, #EF4444 0%, #B91C1C 100%)" }}
              >
                PROCEED REFUND
              </button>
            </div>
          );
        case 'confirmation':
          if (hasSplitPayments(selectedGuest)) {
            return (
              <div className="p-4">
                <button
                  onClick={() => {
                    const validation = validateRefundAllocations(selectedGuest);
                    if (validation.valid) {
                      handleConfirmRefund();
                    }
                  }}
                  disabled={!validateRefundAllocations(selectedGuest).valid}
                  className={`w-full py-3 rounded-full font-bold text-sm transition-all ${
                    validateRefundAllocations(selectedGuest).valid
                      ? 'text-white hover:scale-[1.02] active:scale-[0.98]'
                      : 'text-white/50 cursor-not-allowed'
                  }`}
                  style={{
                    background: validateRefundAllocations(selectedGuest).valid
                      ? "linear-gradient(180deg, #EF4444 0%, #B91C1C 100%)"
                      : "linear-gradient(180deg, #525252 0%, #404040 100%)"
                  }}
                >
                  CONFIRM REFUND ({formatPrice(getTotalAllocatedRefund())})
                </button>
              </div>
            );
          }
          return (
            <div className="p-4">
              <button
                onClick={handleConfirmRefund}
                className="w-full py-3 rounded-full text-white font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{ background: "linear-gradient(180deg, #EF4444 0%, #B91C1C 100%)" }}
              >
                CONFIRM REFUND ({formatPrice(getRefundDisplayAmount())})
              </button>
            </div>
          );
        case 'success':
          return (
            <div className="p-4">
              <button
                onClick={handleCancelRefund}
                className="w-full py-3 rounded-full text-white font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{ background: "linear-gradient(180deg, #F59E0B 0%, #D97706 100%)" }}
              >
                DONE
              </button>
            </div>
          );
        default:
          return null;
      }
    };

    const renderStepContent = () => {
      return (
        <>
// ... keep existing code
        </>
      );
    };

    if (isMobile) {
      return (
        <RefundBottomSheet
          open={isRefundModalOpen}
          onOpenChange={setIsRefundModalOpen}
          title={stepConfig.title}
          onBack={stepConfig.onBack}
          onClose={handleCancelRefund}
          footer={getStepFooter()}
          preventDismiss={refundStep !== 'type-selection' && refundStep !== 'success'}
        >
          {renderStepContent()}
        </RefundBottomSheet>
      );
    }

    return (
      <Dialog open={isRefundModalOpen} onOpenChange={setIsRefundModalOpen}>
        <DialogContent hideCloseButton className="sm:max-w-md bg-neutral-900 border-neutral-700 p-0 max-h-[90vh] flex flex-col overflow-hidden">
          <RefundModalLayout
            title={stepConfig.title}
            onBack={stepConfig.onBack}
            onClose={handleCancelRefund}
            footer={getStepFooter()}
          >
            {renderStepContent()}
          </RefundModalLayout>
        </DialogContent>
      </Dialog>
    );
  }, [
    refundStep,
    swipeRefundTarget,
    isMobile,
    isRefundModalOpen,
    selectedGuest,
    includeRefundTip,
    refundReason,
    selectedRefundItems,
    selectedRefundModifiers,
    expandedRefundItems,
    customRefundAmount,
    tipRefundAmount,
    refundAllocations,
    originalRefundType,
    refundedItemRecords,
    refundedModifierRecords,
    refundedTipRecords,
    expandedRefundTransactions,
    showRefundConfirmation,
    isReceiptDialogOpen,
    useCustomAllocation,
  ]);

  // Responsive rendering
  return (
    <>
      {/* Mobile */}
      <div className="md:hidden h-full">
        {mobileLayout}
      </div>
      
      {/* Tablet */}
      <div className="hidden md:block lg:hidden h-full">
        {tabletLayout}
      </div>
      
      {/* Desktop */}
      <div className="hidden lg:block h-full">
        {desktopLayout}
      </div>

      {/* Tip Bottom Sheet */}
      <TipBottomSheet
        isOpen={isTipSheetOpen}
        onClose={() => setIsTipSheetOpen(false)}
        totalAmount={selectedGuest.total}
        onSelectTip={handleTipSelect}
        existingTip={selectedGuest.tip || 0}
        skipReceiptMode={isClosedTicketsMode && selectedGuest.paid}
        orderItems={selectedGuest.items.map(item => ({ name: item.name, price: item.price, qty: item.qty }))}
      />

      {/* Refund Modal */}
      {RefundModal()}

      {/* Mobile Filters Bottom Sheet */}
      <MobileFiltersSheet
        isOpen={isMobileFiltersOpen}
        onClose={() => setIsMobileFiltersOpen(false)}
        filters={mobileFilters}
        onApplyFilters={handleMobileFiltersApply}
        options={filterOptions}
      />

      {/* Receipt Options Dialog */}
      <ReceiptOptionsDialog
        open={isReceiptDialogOpen}
        onOpenChange={setIsReceiptDialogOpen}
        onPrint={() => console.log('Print receipt')}
        onText={() => console.log('Text receipt')}
        onEmail={() => console.log('Email receipt')}
        onNoReceipt={() => console.log('No receipt')}
      />

      {/* Manager PIN Authorization for Discount */}
      {showDiscountMpin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-neutral-900 rounded-xl border border-neutral-700 w-[90%] max-w-md mx-4 overflow-hidden animate-scale-in">
            <AccessRestrictedModal
              subtitle="Manager approval required to apply discount."
              onBack={() => setShowDiscountMpin(false)}
              onSuccess={() => {
                setShowDiscountMpin(false);
                setIsDiscountDialogOpen(true);
              }}
            />
          </div>
        </div>
      )}

      {/* Discount Dialog */}
      <DiscountDialog
        open={isDiscountDialogOpen}
        onOpenChange={setIsDiscountDialogOpen}
        onApplyDiscounts={handleApplyTicketDiscounts}
        currentDiscounts={currentTicketDiscounts}
        subtotal={selectedGuest.subtotal}
      />

      {isClearDialogOpen && (() => {
        const writeOffEnabled = SettingsManager.getControlCenterSettings().enableWriteOff;
        const hasFired = writeOffEnabled && (selectedGuest?.items?.some((i: any) => i.isFired) || false);
        const commonReasons = [
          'Customer changed mind',
          'Out of stock',
          'Wrong order placed',
          'Customer left',
          'Duplicate order',
          'Kitchen issue',
        ];
        const selectedReason = cancelReason === '__custom__' ? customCancelReason.trim() : cancelReason;
        const canConfirm = selectedReason.length > 0;
        const canFinalConfirm = canConfirm && (!hasFired || cancelWriteOffChoice !== null);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-neutral-900 rounded-xl border border-neutral-700 w-[90%] max-w-sm mx-4 p-5 space-y-4 animate-scale-in">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mx-auto">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/>
                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                </div>
                <h3 className="text-white font-semibold text-lg">
                  {hasFired ? 'Cancel Fired Order?' : 'Cancel Order?'}
                </h3>
                <p className="text-white/60 text-sm">
                  {hasFired
                    ? 'This order has been fired to the kitchen. Please select a reason for cancellation.'
                    : 'Please select a reason for cancellation.'}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {commonReasons.map((reason) => (
                  <button
                    key={reason}
                    onClick={() => { setCancelReason(reason); setCustomCancelReason(''); setCancelWriteOffChoice(null); }}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      cancelReason === reason ? 'bg-red-500 text-white' : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                    }`}
                  >
                    {reason}
                  </button>
                ))}
                <button
                  onClick={() => { setCancelReason('__custom__'); setCancelWriteOffChoice(null); }}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    cancelReason === '__custom__' ? 'bg-red-500 text-white' : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                  }`}
                >
                  Other
                </button>
              </div>
              {cancelReason === '__custom__' && (
                <textarea
                  value={customCancelReason}
                  onChange={(e) => setCustomCancelReason(e.target.value)}
                  placeholder="Enter cancel reason..."
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-red-500 resize-none"
                  rows={2}
                  autoFocus
                />
              )}

              {/* Write-Off choice for fired items */}
              {hasFired && canConfirm && (
                <div className="space-y-2">
                  <p className="text-neutral-400 text-xs font-medium">Inventory handling for fired products:</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCancelWriteOffChoice('write_off')}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-colors border ${
                        cancelWriteOffChoice === 'write_off'
                          ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                          : 'bg-neutral-800 border-neutral-700 text-neutral-300 hover:bg-neutral-700'
                      }`}
                    >
                      Write-Off
                      <span className="block text-[10px] mt-0.5 opacity-70">Deduct as waste</span>
                    </button>
                    <button
                      onClick={() => setCancelWriteOffChoice('without')}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-colors border ${
                        cancelWriteOffChoice === 'without'
                          ? 'bg-green-500/20 border-green-500 text-green-400'
                          : 'bg-neutral-800 border-neutral-700 text-neutral-300 hover:bg-neutral-700'
                      }`}
                    >
                      Without Write-Off
                      <span className="block text-[10px] mt-0.5 opacity-70">Return to stock</span>
                    </button>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={() => { setIsClearDialogOpen(false); setCancelWriteOffChoice(null); }} className="flex-1 h-10 rounded-full border border-neutral-600 text-white text-sm font-medium hover:bg-neutral-800 transition-colors">
                  Go Back
                </button>
                <button
                  disabled={!canFinalConfirm}
                  onClick={handleClearOrder}
                  className={`flex-1 h-10 rounded-full text-white text-sm font-medium transition-colors ${
                    canFinalConfirm ? 'bg-red-500 hover:bg-red-600' : 'bg-neutral-700 cursor-not-allowed opacity-50'
                  }`}
                >
                  Cancel Order
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Refund Confirmation Dialog */}
      <AppleAlertDialog
        open={showRefundConfirmation}
        onOpenChange={setShowRefundConfirmation}
        onConfirm={handleConfirmRefund}
        title="Refund Order"
        description="Are you sure you want to refund this order?"
        cancelText="Cancel"
        confirmText="Confirm Refund"
      />

      {/* No Tax Confirmation Dialog */}
      {showNoTaxDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-neutral-900 rounded-xl border border-neutral-700 w-[90%] max-w-[300px] mx-4 overflow-hidden animate-scale-in">
            <div className="p-6 text-center">
              <h2 className="text-white text-lg font-semibold mb-2">Disable Tax?</h2>
              <p className="text-neutral-400 text-sm">Are you sure you want to remove tax from this order?</p>
            </div>
            <div className="flex border-t border-neutral-700">
              <button
                onClick={() => setShowNoTaxDialog(false)}
                className="flex-1 py-3 text-white font-medium hover:bg-neutral-800 transition-colors border-r border-neutral-700"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmNoTax}
                className="flex-1 py-3 text-orange-500 font-medium hover:bg-neutral-800 transition-colors"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Payment Dialog - Reusing shared component from New Order module */}
      {selectedGuest && (
        <PaymentDialog
          open={showPaymentDialog}
          onOpenChange={setShowPaymentDialog}
          orderDetails={{
            guest: selectedGuest.name || "Guest",
            phone: selectedGuest.phone || undefined,
            table: selectedGuest.table || undefined,
            check: selectedGuest.check || selectedGuest.id,
            orderType: selectedGuest.orderType,
            orderNumber: selectedGuest.check || selectedGuest.id,
            serverName: selectedGuest.server,
            orderTime: selectedGuest.time,
            items: selectedGuest.items.map((item, idx) => ({
              id: idx + 1,
              qty: item.qty,
              name: item.name,
              price: item.price
            }))
          }}
          subtotal={selectedGuest.subtotal - selectedGuest.discount}
          tax={selectedGuest.tax}
          total={selectedGuest.total}
          onPaymentComplete={(paymentHistory) => {
            console.log("Ticket payment completed:", paymentHistory);
            setShowPaymentDialog(false);
            
            const totalPaid = paymentHistory.reduce((sum, p) => sum + p.amount, 0);
            const primaryMethod = paymentHistory.length > 0 ? paymentHistory[0].methodLabel : "Card";
            const paymentsArray = paymentHistory.map(p => ({
              method: p.methodLabel,
              amount: p.amount,
            }));
            
            // Persist payment data to database
            if (selectedGuest?.id) {
              updateOrder(selectedGuest.id, {
                status: "PAID",
                paymentType: primaryMethod,
                payments: paymentsArray,
                paidAmount: totalPaid.toFixed(2),
                paymentStatus: "completed",
              } as any);
            }
            
            // Mark the ticket as paid so CTA switches to "Add Tip" + "Close"
            setSelectedGuest(prev => prev ? {
              ...prev,
              paid: true,
              status: "PAID",
              paymentType: primaryMethod,
              paidAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            } : prev);
            
            const checkoutSettings = SettingsManager.getCheckoutOptionsSettings();
            if (checkoutSettings.printReceipt) {
              toast.success("Receipt sent to printer");
            }
            if (checkoutSettings.emailReceipt) {
              toast.success("Receipt sent via email");
            }
            if (checkoutSettings.smsReceipt) {
              toast.success("Receipt sent via SMS");
            }
            if (checkoutSettings.autoCloseTicket) {
              toast.success("Ticket closed automatically");
              navigate('/');
            }
          }}
        />
      )}

      {/* Transfer Intent Dialog - context-aware based on ticket type */}
      {showTransferIntentDialog && (() => {
        const intentOrder = allOrders.find(o => o.id === transferIntentOrderId);
        const isTableOrder = intentOrder?.table && intentOrder.table !== '--' && intentOrder.table !== '';
        
        return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/80" onClick={() => setShowTransferIntentDialog(false)} />
          <div className="relative bg-neutral-900 border border-white/10 rounded-2xl w-[380px] max-w-[90vw] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h2 className="text-white text-lg font-semibold">Transfer Order</h2>
              <button 
                onClick={() => setShowTransferIntentDialog(false)}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
            <div className="p-4">
              <p className="text-white/60 text-sm mb-3">What would you like to transfer?</p>
              <div className="space-y-2">
                {/* Transfer Products */}
                <button 
                  onClick={() => {
                    setShowTransferIntentDialog(false);
                    if (isTableOrder) {
                      // Table order ticket: navigate to Table module transfer flow
                      navigate(`/tableorder/${intentOrder.table}/transfer?orderId=${transferIntentOrderId}`);
                    } else {
                      // Non-table ticket: show inline TicketsTransferView
                      setInlineTransferOrderId(transferIntentOrderId);
                      setInlineTransferIsEntire(false);
                      setInlineTransferTarget('table');
                      setShowInlineTransferView(true);
                    }
                  }}
                  className="w-full p-3.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors text-left"
                >
                  <div className="flex items-center gap-3 mb-0.5">
                    <img src={transferItemIcon} alt="Transfer Products" className="w-5 h-5 object-contain opacity-80" />
                    <span className="text-white font-medium">Transfer Products</span>
                  </div>
                  <p className="text-white/50 text-xs ml-8">Move selected products to another table or order.</p>
                </button>
                <div className="pt-0.5 -mb-1">
                  <div className="flex items-center gap-2">
                    <img src={transferEntireOrderIcon} alt="Transfer Entire Order" className="w-4 h-4 object-contain opacity-50" />
                    <p className="text-white/50 text-xs font-semibold uppercase tracking-wider">Transfer Entire Order</p>
                  </div>
                </div>
                {/* Transfer to Table - only for table order tickets */}
                {isTableOrder && (
                <button 
                  onClick={() => {
                    setShowTransferIntentDialog(false);
                    navigate(`/tableorder/${intentOrder.table}/transfer?orderId=${transferIntentOrderId}&transferType=entire`);
                  }}
                  className="w-full p-3.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors text-left"
                >
                  <div className="flex items-center gap-3 mb-0.5">
                    <img src={transferToTableIcon} alt="Transfer to Table" className="w-5 h-5 object-contain opacity-80" />
                    <span className="text-white font-medium">Transfer to Table</span>
                  </div>
                  <p className="text-white/50 text-xs ml-8">Move this full order to another or new table.</p>
                </button>
                )}
                {/* Transfer to Order - always available */}
                <button 
                  onClick={() => {
                    setShowTransferIntentDialog(false);
                    setSelectedTransferOrderId(null);
                    setTransferToOrderSourceId(transferIntentOrderId);
                    setShowTransferToOrderDialog(true);
                  }}
                  className="w-full p-3.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors text-left"
                >
                  <div className="flex items-center gap-3 mb-0.5">
                    <img src={transferToOrderIcon} alt="Transfer to Order" className="w-5 h-5 object-contain opacity-80" />
                    <span className="text-white font-medium">Transfer to Order</span>
                  </div>
                  <p className="text-white/50 text-xs ml-8">Move this full order to another order.</p>
                </button>
              </div>
            </div>
          </div>
        </div>
        );
      })()}

      {/* Transfer to Order Dialog - matching TableOrderDetails */}
      {showTransferToOrderDialog && (() => {
        const sourceOrder = allOrders.find(o => o.id === transferToOrderSourceId);
        const availableTransferOrders = getAvailableTicketOrdersForTransfer(transferToOrderSourceId || '');
        const executeTransfer = () => {
          if (!selectedTransferOrderId || !sourceOrder) return;
          setShowTransferToOrderDialog(false);
          const targetOrder = allOrders.find(o => o.id === selectedTransferOrderId);
          const targetTable = targetOrder?.table || sourceOrder.table;
          const destinationLabel = targetTable && targetTable !== '--' && targetTable !== sourceOrder.table
            ? `${formatTableName(targetTable)} (Order #${selectedTransferOrderId})`
            : `Order #${selectedTransferOrderId}`;
          updateUnifiedOrders(prev => {
            const matchSource = (o: any) => o.name === sourceOrder.name && o.table === sourceOrder.table;
            const matchTarget = (o: any) => o.id === selectedTransferOrderId;
            const targetName = targetOrder ? targetOrder.name : `Order #${selectedTransferOrderId}`;
            return prev.map(o => {
              if (matchSource(o)) {
                return { ...o, items: [], subtotal: 0, discount: 0, serviceCharge: 0, tax: 0, tip: 0, total: 0,
                  transferInfo: { type: 'sent' as const, transferType: 'full' as const, targetOrderId: selectedTransferOrderId!, targetOrderName: targetName, itemCount: sourceOrder.items.length, transferredItems: [...sourceOrder.items] } };
              }
              if (matchTarget(o)) {
                const srcInPrev = prev.find(matchSource);
                const srcItems = srcInPrev ? srcInPrev.items : [];
                const newItems = [...o.items, ...srcItems];
                const newSub = newItems.reduce((s: number, item: any) => s + item.price * item.qty, 0);
                return { ...o, items: newItems, subtotal: +newSub.toFixed(2), tax: +(newSub * 0.0735).toFixed(2), serviceCharge: +(newSub * 0.05).toFixed(2), total: +(newSub + newSub * 0.05 + newSub * 0.0735 - o.discount).toFixed(2),
                  transferInfo: { type: 'received' as const, transferType: 'full' as const, sourceOrderId: sourceOrder.id, sourceOrderName: sourceOrder.name, sourceTable: sourceOrder.table, itemCount: sourceOrder.items.length, transferredItems: [...sourceOrder.items] } };
              }
              return o;
            });
          });
          setSelectedGuest(prev => prev ? { ...prev, items: [], subtotal: 0, discount: 0, serviceCharge: 0, tax: 0, tip: 0, total: 0, status: "ORDERING", notes: `Transferred to ${destinationLabel}` } : prev);
          toast.success(`Order transferred successfully to ${destinationLabel}`);
        };
        return (
          <Dialog open={showTransferToOrderDialog} onOpenChange={setShowTransferToOrderDialog}>
            <DialogContent className="bg-neutral-900 border-white/10 p-0 max-w-lg overflow-hidden" aria-describedby={undefined}>
              <div className="p-4 border-b border-white/10">
                <h2 className="text-white text-lg font-semibold">Transfer to Order</h2>
                <p className="text-white/50 text-sm mt-1">Select an active order to transfer</p>
              </div>
              <ScrollArea className="max-h-[60vh]">
                <div className="p-4 space-y-3">
                  {availableTransferOrders.map((order) => {
                    const isSelected = selectedTransferOrderId === order.id;
                    return (
                      <button key={order.id} onClick={() => setSelectedTransferOrderId(order.id)}
                        className={`w-full rounded-xl border overflow-hidden text-left transition-all ${isSelected ? 'border-white ring-1 ring-white/30' : 'border-white/[0.25] hover:border-white/40'}`}
                        style={{ backgroundColor: '#1B1C20' }}>
                        <div className="p-3">
                          <OrderLayoutTemplate order={{ ...ticketToTemplateData({ ...order, timer: order.timer || '00:00' } as any) }} showBorder={false} />
                          <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
                            {order.items.map((item, idx) => (
                              <div key={idx} className="flex items-center justify-between py-1">
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                  <span className="w-7 h-7 rounded-md border border-white/20 text-white text-xs font-medium flex items-center justify-center flex-shrink-0">{item.qty}</span>
                                  <span className="text-white text-sm truncate">{item.name}</span>
                                </div>
                                <span className="text-white/70 text-sm font-medium flex-shrink-0 ml-2">{formatTicketPrice(item.price * item.qty)}</span>
                              </div>
                            ))}
                          </div>
                          <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
                            <span className="text-white/50 text-sm">{order.items.length} products</span>
                            <span className="text-white font-semibold text-sm">{formatTicketPrice(order.items.reduce((s, i) => s + i.price * i.qty, 0))}</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
              <div className="p-4 border-t border-white/10 flex gap-3">
                <button onClick={() => setShowTransferToOrderDialog(false)} className="flex-1 py-2.5 rounded-full font-medium text-sm bg-neutral-800 text-white hover:bg-neutral-700">Cancel</button>
                <button onClick={executeTransfer} disabled={!selectedTransferOrderId}
                  className={`flex-1 py-2.5 rounded-full font-medium text-sm ${selectedTransferOrderId ? 'text-black' : 'text-black/50 opacity-50'}`}
                  style={selectedTransferOrderId ? { background: "linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)" } : { background: '#555' }}>
                  Confirm Transfer
                </button>
              </div>
            </DialogContent>
          </Dialog>
        );
      })()}

      {/* Inline Transfer View for non-table tickets */}
      {showInlineTransferView && inlineTransferOrderId && (() => {
        const sourceOrderData = allOrders.find(o => o.id === inlineTransferOrderId);
        if (!sourceOrderData) return null;
        const transferSource: TransferGuestOrder = {
          id: sourceOrderData.id,
          name: sourceOrderData.name,
          phone: sourceOrderData.phone || '',
          partySize: sourceOrderData.partySize || 1,
          time: sourceOrderData.time || '',
          timer: (sourceOrderData as any).timer || sourceOrderData.time || '',
          server: sourceOrderData.server || '',
          check: sourceOrderData.check || '--',
          paymentType: sourceOrderData.paymentType || '',
          revenueCenter: sourceOrderData.revenueCenter || '',
          status: sourceOrderData.status || 'ORDERING',
          notes: sourceOrderData.notes || '',
          items: (sourceOrderData.items || []).map((item: any) => ({
            qty: item.qty,
            name: item.name,
            price: item.price,
            seats: item.seats || [],
            modifiers: item.modifiers || [],
          })),
          subtotal: sourceOrderData.subtotal || 0,
          discount: sourceOrderData.discount || 0,
          serviceCharge: sourceOrderData.serviceCharge || 0,
          tax: sourceOrderData.tax || 0,
          tip: sourceOrderData.tip || 0,
          total: sourceOrderData.total || 0,
          table: sourceOrderData.table || '--',
          orderType: sourceOrderData.orderType || '',
        };
        const transferOrders: TransferGuestOrder[] = allOrders
          .filter(o => o.id !== inlineTransferOrderId && (o.status === 'ORDERING' || o.status === 'UNPAID') && !o.paid)
          .map((o: any) => ({
            id: o.id, name: o.name, phone: o.phone || '', partySize: o.partySize || 1,
            time: o.time || '', timer: o.timer || '', server: o.server || '', check: o.check || '--',
            paymentType: o.paymentType || '', revenueCenter: o.revenueCenter || '',
            status: o.status || 'ORDERING', notes: o.notes || '',
            items: (o.items || []).map((item: any) => ({ qty: item.qty, name: item.name, price: item.price, seats: item.seats || [], modifiers: item.modifiers || [] })),
            subtotal: o.subtotal || 0, discount: o.discount || 0, serviceCharge: o.serviceCharge || 0,
            tax: o.tax || 0, tip: o.tip || 0, total: o.total || 0,
            table: o.table || '--', orderType: o.orderType || '',
          }));
        return (
          <div className="fixed inset-0 z-50 bg-black">
            <TicketsTransferView
              sourceOrder={transferSource}
              isEntireOrderTransfer={inlineTransferIsEntire}
              onBack={() => setShowInlineTransferView(false)}
              orders={transferOrders}
              setOrders={() => {}}
              onTransferComplete={() => {
                setShowInlineTransferView(false);
                setInlineTransferOrderId(null);
              }}
              embedded={false}
              transferTarget={inlineTransferTarget}
            />
          </div>
        );
      })()}
      {/* AI Chat Panel - Simple Overlay */}
      {isAIChatOpen && (
        <div className="fixed inset-0 z-[60] flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setIsAIChatOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-[85%] md:w-[380px] bg-black">
            <OrderAIChatPanel
              onClose={() => setIsAIChatOpen(false)}
              orderContext={{
                orderType: selectedGuest?.orderType || "",
                guestName: selectedGuest?.name || "",
                orderItems: [],
                orderNotes: "",
                availableProducts: [],
              }}
            />
          </div>
        </div>
      )}

    </>
  );
};

export default Tickets;
