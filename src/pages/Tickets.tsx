import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Search, SlidersHorizontal, Phone, X, Check, Info, Briefcase, Heart, GraduationCap, Shield, Star, Clock, Cake, MapPin, BadgeDollarSign, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import AccessRestrictedModal from "@/components/AccessRestrictedModal";
import ReceiptDialog from "@/components/ReceiptDialog";
import TipDialog from "@/components/TipDialog";
import RefundDialog from "@/components/RefundDialog";
import TicketsFilterBar from "@/components/TicketsFilterBar";
import MobileFilterBottomSheet from "@/components/MobileFilterBottomSheet";
import TicketsTransferView from "@/components/TicketsTransferView";
import SwipeableTicketItem from "@/components/SwipeableTicketItem";
import SwipeableRefundItem from "@/components/SwipeableRefundItem";
import ItemRefundDialog from "@/components/ItemRefundDialog";
import { TransferCheckDialog } from "@/components/TransferCheckDialog";
import transferCheckIcon from "@/assets/icons/transfer-check.svg";
import customItemIcon from "@/assets/icons/custom-item.svg";
import discountBtnIcon from "@/assets/icons/discount-icon.svg";
import noTaxBtnIcon from "@/assets/icons/no-tax.svg";
import registerBtnIcon from "@/assets/icons/register.svg";

// Import icons
import runnerIcon from "@/assets/icons/runner.png";
import clearIcon from "@/assets/icons/clear-c.png";
import fireIcon from "@/assets/icons/fire.png";
import shareOrderIcon from "@/assets/icons/share-order.png";
import shareSeatsIcon from "@/assets/icons/share-seats.png";
import seatIcon from "@/assets/icons/seat-icon.png";
import splitIcon from "@/assets/icons/split-icon.png";
import mergeIcon from "@/assets/icons/merge-icon.png";
import dineInIcon from "@/assets/icons/dine-in.png";
import cashRegisterIcon from "@/assets/icons/cash-register.png";
import printIcon from "@/assets/icons/print-icon.svg";
import cashRegisterSvgIcon from "@/assets/icons/cash-register-icon.svg";
import transferItemIcon from "@/assets/icons/transfer-item.svg";
import transferEntireOrderIcon from "@/assets/icons/transfer-entire-order.svg";
import transferToTableIcon from "@/assets/icons/transfer-to-table.svg";
import transferToOrderIcon from "@/assets/icons/transfer-to-order.svg";
import transferIcon from "@/assets/icons/transfer-icon.png";

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

// Re-export ticket data types
import { TicketOrder as GuestOrder, TicketOrderItem as OrderItem, TicketPaymentEntry as PaymentEntry } from "@/data/ticketOrders";
import { useUnifiedOrders } from "@/contexts/UnifiedOrderContext";
export type { GuestOrder, OrderItem, PaymentEntry };

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
    case "PARTIALLY REFUNDED": return { color: '#F97316', bg: 'rgba(249, 115, 22, 0.15)' };
    default: return { color: '#fff', bg: 'rgba(255,255,255,0.1)' };
  }
};

// Discount types - same as TableOrderDetails
interface DiscountType {
  id: string;
  name: string;
  description: string;
  percentage?: number;
  fixedAmount?: number;
  icon: string;
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

const getDiscountIcon = (iconName: string) => {
  const icons: Record<string, React.ComponentType<{ className?: string }>> = {
    briefcase: Briefcase, heart: Heart, graduation: GraduationCap, shield: Shield,
    star: Star, clock: Clock, cake: Cake, mappin: MapPin, dollar: BadgeDollarSign, tag: Tag
  };
  return icons[iconName] || Tag;
};

const filters = ["All", "Open", "Completed", "Paid", "Unpaid"];

const Tickets = ({ isClosedTicketsMode }: { isClosedTicketsMode?: boolean }) => {
  const navigate = useNavigate();
  const { orders: unifiedOrders, updateOrders, removeOrder: removeUnifiedOrder } = useUnifiedOrders();
  const [activeFilter, setActiveFilter] = useState("All");
  const orders = unifiedOrders;
  const [selectedGuest, setSelectedGuest] = useState(unifiedOrders[0]);
  const [selectedSeats, setSelectedSeats] = useState<number[]>([1, 2, 3, 4]);
  const [showMobileOrderPanel, setShowMobileOrderPanel] = useState(false);
  const [showFilterIcons, setShowFilterIcons] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showMobileFilterSheet, setShowMobileFilterSheet] = useState(false);

  // Advanced filter state
  const [advFilterRevenueCenter, setAdvFilterRevenueCenter] = useState<string | null>(null);
  const [advFilterDate, setAdvFilterDate] = useState<Date | undefined>(undefined);
  const [advFilterEmployee, setAdvFilterEmployee] = useState<string | null>(null);
  const [advFilterOrderType, setAdvFilterOrderType] = useState<string | null>(null);
  const [advFilterOrderStatus, setAdvFilterOrderStatus] = useState<string | null>(null);
  const [advFilterPaymentType, setAdvFilterPaymentType] = useState<string | null>(null);

  // Per-product swipe state for ticket detail view
  const [activeSwipedProductIndex, setActiveSwipedProductIndex] = useState<number | null>(null);

  // Transfer Check dialog state
  const [showTransferCheckDialog, setShowTransferCheckDialog] = useState(false);

  // Discount state - same as TableOrderDetails
  const [showDiscountDialog, setShowDiscountDialog] = useState(false);
  const [discountDialogView, setDiscountDialogView] = useState<'mpin' | 'discounts'>('mpin');
  const [selectedDiscountId, setSelectedDiscountId] = useState<string | null>(null);

  // No Tax state - matches New Order exactly
  const [showNoTaxDialog, setShowNoTaxDialog] = useState(false);
  const [isTaxExempt, setIsTaxExempt] = useState(false);

  // Receipt dialog state
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);

  // Tip dialog state - reuses TipDialog component from Table Order
  const [showTipDialog, setShowTipDialog] = useState(false);

  // Refund state - matches Table Order flow
  const [showRefundMode, setShowRefundMode] = useState(false);
  const [showRefundDialog, setShowRefundDialog] = useState(false);

  // Item-level refund state
  const [refundedItems, setRefundedItems] = useState<Record<string, Record<string, boolean>>>({});
  // key: orderId, value: { "item-0": true, "mod-0-1": true } for refunded products/modifiers
  const [itemRefundTarget, setItemRefundTarget] = useState<{
    itemName: string;
    itemPrice: number;
    itemIndex: number;
    modifierIndex?: number;
    orderId: string;
  } | null>(null);
  const [showItemRefundDialog, setShowItemRefundDialog] = useState(false);

  // Calculate applied discount
  const appliedDiscount = useMemo(() => {
    if (!selectedDiscountId || !selectedGuest) return 0;
    const discountType = discountTypes.find(d => d.id === selectedDiscountId);
    if (!discountType) return 0;
    const subtotal = selectedGuest.items.filter(it => !it.isCancelled).reduce((sum, it) => sum + it.price * it.qty, 0);
    return discountType.fixedAmount || (subtotal * ((discountType.percentage || 0) / 100));
  }, [selectedDiscountId, selectedGuest]);

  // Check if current ticket allows swipe actions (only unpaid/ordering)
  const isTicketEditable = (status: string) =>
    status === "ORDERING" || status === "UNPAID";

  // Recalculate ticket totals from its current items (excluding cancelled ones)
  const recalcTotals = (items: GuestOrder['items'], existingOrder: GuestOrder) => {
    const TAX_RATE = 0.0735;
    const SERVICE_CHARGE_RATE = 0.05;
    const DISCOUNT_THRESHOLD = 50;
    const DISCOUNT_AMOUNT = 5.00;

    const activeItems = items.filter(it => !it.isCancelled);
    const subtotal = activeItems.reduce((sum, it) => sum + it.price * it.qty, 0);
    const discount = subtotal > DISCOUNT_THRESHOLD ? DISCOUNT_AMOUNT : 0;
    const serviceCharge = subtotal * SERVICE_CHARGE_RATE;
    // Respect per-item noTax flags AND order-level isTaxExempt
    const taxableSubtotal = activeItems.filter(it => !it.noTax).reduce((sum, it) => sum + it.price * it.qty, 0);
    const tax = isTaxExempt ? 0 : Math.max(0, taxableSubtotal - discount) * TAX_RATE;
    const total = subtotal - discount + serviceCharge + tax + (existingOrder.tip ?? 0);

    return { subtotal, discount, serviceCharge, tax, total };
  };

  // Helper: check if item or modifier is refunded
  const isItemRefunded = (orderId: string, itemIndex: number) => 
    !!refundedItems[orderId]?.[`item-${itemIndex}`];
  
  const isModifierRefunded = (orderId: string, itemIndex: number, modIndex: number) =>
    !!refundedItems[orderId]?.[`mod-${itemIndex}-${modIndex}`];

  // Check if order has any refunded items
  const hasAnyRefundedItems = (orderId: string) =>
    Object.keys(refundedItems[orderId] || {}).length > 0;

  // Initiate item-level refund swipe action
  const handleItemRefundSwipe = (item: OrderItem, itemIndex: number) => {
    setItemRefundTarget({
      itemName: item.name,
      itemPrice: item.price * item.qty,
      itemIndex,
      orderId: selectedGuest.id,
    });
    setShowItemRefundDialog(true);
  };

  // Initiate modifier-level refund swipe action
  const handleModifierRefundSwipe = (modText: string, modPrice: number, itemIndex: number, modIndex: number) => {
    setItemRefundTarget({
      itemName: modText,
      itemPrice: modPrice,
      itemIndex,
      modifierIndex: modIndex,
      orderId: selectedGuest.id,
    });
    setShowItemRefundDialog(true);
  };

  // Complete item-level refund
  const handleItemRefundComplete = (amount: number, reason: string) => {
    if (!itemRefundTarget) return;
    const { orderId, itemIndex, modifierIndex } = itemRefundTarget;
    const key = modifierIndex !== undefined ? `mod-${itemIndex}-${modifierIndex}` : `item-${itemIndex}`;
    
    setRefundedItems(prev => ({
      ...prev,
      [orderId]: { ...(prev[orderId] || {}), [key]: true }
    }));

    // Update order status to PARTIALLY REFUNDED
    if (selectedGuest) {
      const updatedGuest = { ...selectedGuest, status: 'PARTIALLY REFUNDED' };
      setSelectedGuest(updatedGuest);
      updateOrders(prev => prev.map(o => o.id === orderId ? updatedGuest : o));
    }
    
    toast.success(`Refund of $${amount.toFixed(2)} processed for ${itemRefundTarget.itemName}`);
  };

  // Calculate total refunded amount for display
  const getRefundedTotal = (orderId: string) => {
    const refunded = refundedItems[orderId] || {};
    let total = 0;
    const order = orders.find(o => o.id === orderId);
    if (!order) return 0;
    Object.keys(refunded).forEach(key => {
      if (key.startsWith('item-')) {
        const idx = parseInt(key.split('-')[1]);
        const item = order.items[idx];
        if (item) total += item.price * item.qty;
      }
      // Modifier refunds would need price lookup - simplified here
    });
    return total;
  };

  // Toggle No Tax for a product in the selected ticket
  const handleProductNoTax = (itemIndex: number) => {
    const newItems = selectedGuest.items.map((it, idx) =>
      idx === itemIndex ? { ...it, noTax: !it.noTax } : it
    );
    const totals = recalcTotals(newItems, selectedGuest);
    const updated = { ...selectedGuest, items: newItems, ...totals };

    updateOrders(prev => prev.map(o => o.id === selectedGuest.id ? updated : o));
    setSelectedGuest(updated);
    setActiveSwipedProductIndex(null);
    toast.success("No Tax toggled for product");
  };

  // Cancel (mark as cancelled) a product in the selected ticket and recalculate totals
  const handleProductCancel = (itemIndex: number) => {
    const newItems = selectedGuest.items.map((it, idx) =>
      idx === itemIndex ? { ...it, isCancelled: !it.isCancelled } : it
    );
    const totals = recalcTotals(newItems, selectedGuest);
    const updated = { ...selectedGuest, items: newItems, ...totals };

    updateOrders(prev => prev.map(o => o.id === selectedGuest.id ? updated : o));
    setSelectedGuest(updated);
    setActiveSwipedProductIndex(null);
    const wasCancelled = selectedGuest.items[itemIndex]?.isCancelled;
    toast.success(wasCancelled ? "Product restored" : "Product cancelled");
  };

  // Merge state
  const [showMergeDialog, setShowMergeDialog] = useState(false);
  const [mergeSource, setMergeSource] = useState<GuestOrder | null>(null);
  const [mergeTarget, setMergeTarget] = useState<GuestOrder | null>(null);

  // Inline Transfer flow state
  const [transferSource, setTransferSource] = useState<GuestOrder | null>(null);
  const [transferStep, setTransferStep] = useState<'intent' | 'active' | null>(null);
  const [transferType, setTransferType] = useState<'items' | 'entire' | 'entireToOrder' | null>(null);

  // Reset refund mode when selected guest changes
  useEffect(() => {
    setShowRefundMode(false);
  }, [selectedGuest?.id]);


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
    if (filter === "All") return orders.length;
    if (filter === "Open") return orders.filter(g => g.status === "ORDERING").length;
    if (filter === "Completed") return orders.filter(g => g.status === "COMPLETED").length;
    if (filter === "Paid") return orders.filter(g => g.status === "PAID" || g.status === "PARTIALLY REFUNDED" || g.paymentType !== "--").length;
    if (filter === "Unpaid") return orders.filter(g => g.status === "UNPAID" || g.paymentType === "--").length;
    return 0;
  };

  const filteredOrders = (() => {
    let filtered = activeFilter === "All" ? orders : orders.filter(guest => {
      switch (activeFilter) {
        case "Open": return guest.status === "ORDERING";
        case "Completed": return guest.status === "COMPLETED";
        case "Paid": return guest.status === "PAID" || guest.status === "PARTIALLY REFUNDED" || guest.paymentType !== "--";
        case "Unpaid": return guest.status === "UNPAID" || guest.paymentType === "--";
        default: return true;
      }
    });
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(g =>
        g.name.toLowerCase().includes(q) ||
        g.id.includes(q) ||
        g.check.includes(q) ||
        g.table.toLowerCase().includes(q) ||
        g.server.toLowerCase().includes(q)
      );
    }
    // Advanced filters
    if (advFilterRevenueCenter) {
      filtered = filtered.filter(g => g.revenueCenter === advFilterRevenueCenter);
    }
    if (advFilterDate) {
      const filterDateStr = advFilterDate.toISOString().split('T')[0]; // "YYYY-MM-DD"
      filtered = filtered.filter(g => g.date === filterDateStr);
    }
    if (advFilterEmployee) {
      filtered = filtered.filter(g => g.server === advFilterEmployee);
    }
    if (advFilterOrderType) {
      filtered = filtered.filter(g => {
        const type = advFilterOrderType.toLowerCase();
        if (type === "table") return g.orderType === "Table Order" || g.orderType === "Dine-In";
        if (type === "takeaway") return g.orderType === "Takeout" || g.orderType === "Take Out" || g.orderType === "Takeaway";
        if (type === "drive-thru") return g.orderType === "Drive Thru" || g.orderType === "Drive-thru";
        return g.orderType.toLowerCase().includes(type);
      });
    }
    if (advFilterOrderStatus) {
      filtered = filtered.filter(g => g.status === advFilterOrderStatus);
    }
    if (advFilterPaymentType) {
      filtered = filtered.filter(g => {
        const pt = advFilterPaymentType.toLowerCase();
        if (pt === "cash") return g.paymentType === "Cash";
        if (pt === "split payment") return (g.payments && g.payments.length > 1);
        if (pt === "unpaid") return g.paymentType === "--" || g.paymentType === "";
        return true;
      });
    }
    return filtered;
  })();

  const toggleSeat = (seat: number) => {
    setSelectedSeats(prev => prev.includes(seat) ? prev.filter(s => s !== seat) : [...prev, seat]);
  };

  const handleMobileOrderClick = (guest: GuestOrder) => {
    setSelectedGuest(guest);
    setShowMobileOrderPanel(true);
  };

  // Desktop click handler - always show details in right panel
  const handleDesktopOrderClick = (guest: GuestOrder) => {
    setSelectedGuest(guest);
  };

  // ===== MERGE HANDLERS =====
  const handleMergeClick = (guest: GuestOrder, e: React.MouseEvent) => {
    e.stopPropagation();
    setMergeSource(guest);
    setMergeTarget(null);
    setShowMergeDialog(true);
  };

  const getMergeableTickets = (source: GuestOrder) => {
    return orders.filter(o => 
      o.id !== source.id && 
      o.status !== "PAID" && 
      o.status !== "COMPLETED"
    );
  };

  const confirmMerge = () => {
    if (!mergeSource || !mergeTarget) return;
    
    const mergedItems = [...mergeSource.items, ...mergeTarget.items];
    const updatedSource: GuestOrder = {
      ...mergeSource,
      items: mergedItems,
      subtotal: mergeSource.subtotal + mergeTarget.subtotal,
      discount: mergeSource.discount + mergeTarget.discount,
      serviceCharge: mergeSource.serviceCharge + mergeTarget.serviceCharge,
      tax: mergeSource.tax + mergeTarget.tax,
      tip: mergeSource.tip + mergeTarget.tip,
      total: mergeSource.total + mergeTarget.total,
      partySize: mergeSource.partySize + mergeTarget.partySize,
      notes: [mergeSource.notes, mergeTarget.notes].filter(Boolean).join("; "),
    };

    updateOrders(prev => prev.filter(o => o.id !== mergeTarget.id).map(o => o.id === mergeSource.id ? updatedSource : o));
    setSelectedGuest(updatedSource);
    setShowMergeDialog(false);
    setMergeSource(null);
    setMergeTarget(null);

    toast.success(`Order #${mergeTarget.id} merged into Order #${mergeSource.id}`, {
      description: `Items, balances, and order history have been combined.`,
    });
  };

  // ===== MERGE DIALOG =====
  const MergeDialog = () => {
    if (!showMergeDialog || !mergeSource) return null;
    const mergeable = getMergeableTickets(mergeSource);

    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70" onClick={() => setShowMergeDialog(false)}>
        <div className="w-[460px] max-h-[80vh] rounded-2xl overflow-hidden flex flex-col" style={{ backgroundColor: '#1B1C20', border: '1px solid rgba(255,255,255,0.1)' }} onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <img src={mergeIcon} alt="Merge" className="w-5 h-5" />
              <span className="text-white font-semibold text-lg">Merge Tickets</span>
            </div>
            <button onClick={() => setShowMergeDialog(false)} className="p-1.5 rounded-full hover:bg-white/10 transition-colors">
              <X className="w-4 h-4 text-white/60" />
            </button>
          </div>

          <div className="px-5 py-3 border-b border-white/10" style={{ backgroundColor: 'rgba(255, 158, 101, 0.1)' }}>
            <span className="text-white/60 text-xs uppercase tracking-wider">Merging from</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-white font-medium">#{mergeSource.id} · {mergeSource.name}</span>
              <span className="text-white font-bold">{formatPrice(mergeSource.total)}</span>
            </div>
            {mergeSource.table !== "--" && <span className="text-white/50 text-sm">{mergeSource.table} · {mergeSource.items.length} items</span>}
          </div>

          <div className="px-5 py-3">
            <span className="text-white/60 text-xs uppercase tracking-wider">Select target ticket to merge into</span>
          </div>

          <ScrollArea className="flex-1 px-5 max-h-[300px]">
            <div className="space-y-2 pb-4">
              {mergeable.length === 0 ? (
                <div className="text-center py-8 text-white/40 text-sm">No eligible tickets to merge with</div>
              ) : (
                mergeable.map(ticket => (
                  <div 
                    key={ticket.id}
                    onClick={() => setMergeTarget(ticket)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${mergeTarget?.id === ticket.id ? 'border-orange-400/60 bg-orange-400/10' : 'border-white/10 hover:border-white/20 bg-white/5'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {mergeTarget?.id === ticket.id && <Check className="w-4 h-4 text-orange-400" />}
                        <span className="text-white font-medium">#{ticket.id} · {ticket.name}</span>
                      </div>
                      <span className="text-white font-bold text-sm">{formatPrice(ticket.total)}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-white/50 text-xs">
                      <OrderTypeIcon type={ticket.orderType} size="small" />
                      <span>{ticket.orderType}</span>
                      {ticket.table !== "--" && <><span>·</span><span>{ticket.table}</span></>}
                      <span>·</span>
                      <span>{ticket.items.length} items</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          <div className="px-5 py-4 border-t border-white/10 flex items-center gap-3">
            <button onClick={() => setShowMergeDialog(false)} className="flex-1 py-2.5 rounded-full text-white text-sm font-medium border border-white/20 hover:bg-white/10 transition-colors">Cancel</button>
            <button 
              onClick={confirmMerge} 
              disabled={!mergeTarget}
              className="flex-1 py-2.5 rounded-full text-white text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: mergeTarget ? 'linear-gradient(180deg, #FF9E65 0%, #FF5E00 100%)' : '#555' }}
            >Confirm Merge</button>
          </div>
        </div>
      </div>
    );
  };

  // ===== TRANSFER HANDLERS =====
  const handleTransferClick = (guest: GuestOrder, e: React.MouseEvent) => {
    e.stopPropagation();
    setTransferSource(guest);
    setTransferStep('intent');
    setTransferType(null);
  };

  const closeTransferFlow = () => {
    setTransferStep(null);
    setTransferType(null);
    setTransferSource(null);
  };

  // ===== TRANSFER INTENT DIALOG =====
  const TransferIntentDialog = () => {
    if (transferStep !== 'intent' || !transferSource) return null;

    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center">
        <div className="absolute inset-0 bg-black/80" onClick={closeTransferFlow} />
        <div className="relative bg-neutral-900 border border-white/10 rounded-2xl w-[380px] max-w-[90vw] overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <h2 className="text-white text-lg font-semibold">Transfer Order</h2>
            <button onClick={closeTransferFlow} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
          <div className="p-4">
            <p className="text-white/60 text-sm mb-3">What would you like to transfer?</p>
            <div className="space-y-2">
              <button 
                onClick={() => {
                  setTransferType('items');
                  setTransferStep('active');
                }}
                className="w-full p-3.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors text-left"
              >
                <div className="flex items-center gap-3 mb-0.5">
                  <img src={transferItemIcon} alt="Transfer Products" className="w-5 h-5 object-contain opacity-80" />
                  <span className="text-white font-medium">Transfer Products</span>
                </div>
                <p className="text-white/50 text-xs ml-8">Move selected products to another table or order.</p>
              </button>

              {/* Transfer Entire Order Section Title */}
              <div className="pt-0.5 -mb-1">
                <div className="flex items-center gap-2">
                  <img src={transferEntireOrderIcon} alt="Transfer Entire Order" className="w-4 h-4 object-contain opacity-50" />
                  <p className="text-white/50 text-xs font-semibold uppercase tracking-wider">Transfer Entire Order</p>
                </div>
              </div>

              {/* Transfer to Table */}
              <button 
                onClick={() => {
                  setTransferType('entire');
                  setTransferStep('active');
                }}
                className="w-full p-3.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors text-left"
              >
                <div className="flex items-center gap-3 mb-0.5">
                  <img src={transferToTableIcon} alt="Transfer to Table" className="w-5 h-5 object-contain opacity-80" />
                  <span className="text-white font-medium">Transfer to Table</span>
                </div>
                <p className="text-white/50 text-xs ml-8">Move this full order to another or new table.</p>
              </button>

              {/* Transfer to Order */}
              <button 
                onClick={() => {
                  setTransferType('entireToOrder');
                  setTransferStep('active');
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

    // Mobile card content (matches Table Module ticket layout exactly)
    const mobileCardContent = (
      <div className="flex items-stretch w-full">
        {/* Column 1: Order Number - Mobile compact style */}
        <div className="flex-shrink-0 px-2 py-2 flex items-center">
          <div className="relative w-10 h-12 bg-neutral-800 rounded-lg flex flex-col items-center justify-center border border-neutral-600">
            <span className="text-lg font-bold text-white">{guest.id}</span>
            <span className="text-[9px] text-gray-500">{checkId}</span>
          </div>
        </div>

        {/* Column 2: Guest Info - 3-row layout matching Table Module */}
        <div className="flex-1 min-w-0 py-2 pr-2">
          <div className="flex flex-col gap-1">
            {/* Row 1: Name + Table, Server, Status */}
            <div className="flex items-center justify-between">
              <span className="text-white font-medium text-sm truncate">
                {guest.name}
                {guest.orderType === "Table Order" && guest.table !== "--" && ` · ${guest.table}`}
              </span>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-sm" style={{ color: '#B5B6BB' }}>{guest.server}</span>
                <span className={`text-sm font-medium`} style={{ color: statusStyle.color }}>
                  {guest.status === 'Completed' || guest.status === 'COMPLETED' ? 'PAID' : guest.status}
                </span>
              </div>
            </div>

            {/* Row 2: Party info / Order type, Timer, Total */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-xs" style={{ color: '#B5B6BB' }}>
                <OrderTypeIcon type={guest.orderType} size="small" />
                {guest.orderType === "Table Order" ? (
                  <span>{guest.partySize > 1 ? `Party of ${guest.partySize}, ` : ''}{guest.time} | {duration}</span>
                ) : (
                  <span>{guest.orderType}, {guest.time} | {duration}</span>
                )}
              </div>
              <span className="text-white font-semibold text-sm">{formatPrice(guest.total)}</span>
            </div>

            {/* Row 3: Revenue Center, Payment status, Tip/Amount */}
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: '#B5B6BB' }}>{guest.revenueCenter}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm" style={{ color: paidAmount > 0 ? '#4ade80' : '#B5B6BB' }}>
                  {paidAmount > 0 ? 'Paid' : 'Un Paid'}
                </span>
                <span className="text-white text-sm">{formatPrice(paidAmount)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );

    // Desktop/Tablet card content (original horizontal layout)
    const cardContent = (
      <div className={`flex items-stretch w-full ${compact ? 'gap-1.5' : 'gap-0'}`}>
        {/* LEFT BADGE: Ticket Number + ID */}
        <div className={`flex-shrink-0 flex items-center ${compact ? 'px-2 py-2' : 'px-3 py-3'}`}>
          <div className={`flex flex-col items-center justify-center rounded-lg border border-neutral-600 bg-neutral-800/80 ${compact ? 'w-12 h-14 gap-0' : 'w-14 h-16 gap-0.5'}`}>
            <span className={`font-bold text-white ${compact ? 'text-lg' : 'text-xl'}`}>{guest.id}</span>
            <span className="text-[11px] text-neutral-400 font-medium">{checkId}</span>
          </div>
        </div>

        {/* MIDDLE CONTENT */}
        <div className={`flex-1 min-w-0 ${compact ? 'py-2' : 'py-3'} flex flex-col justify-center`}>
          {/* Row 1: Name (+ Table for Table Orders) */}
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className={`text-white font-semibold truncate ${compact ? 'text-sm' : 'text-base'}`}>{guest.name}</span>
            {guest.orderType === "Table Order" && guest.table !== "--" && (
              <>
                <span className="text-neutral-500 text-sm">·</span>
                <span className={`text-white/70 truncate ${compact ? 'text-sm' : 'text-base'}`}>{guest.table}</span>
              </>
            )}
          </div>

          {/* Row 2: Differs by order type */}
          <div className="flex items-center gap-1.5 text-neutral-400 mb-0.5">
            <OrderTypeIcon type={guest.orderType} size="small" />
            {guest.orderType === "Table Order" ? (
              <span className={`${compact ? 'text-xs' : 'text-sm'}`}>
                {guest.partySize > 1 ? `Party of ${guest.partySize}, ` : ''}{guest.time} | {duration}
              </span>
            ) : (
              <span className={`${compact ? 'text-xs' : 'text-sm'}`}>
                {guest.orderType}, {guest.time} | {duration}
              </span>
            )}
          </div>

          {/* Row 3: Revenue Center */}
          <span className={`text-neutral-500 ${compact ? 'text-xs' : 'text-sm'}`}>{guest.revenueCenter}</span>

        </div>

        {/* SERVER & PAYMENT INFO */}
        <div className={`flex-shrink-0 ${compact ? 'w-[110px] py-2' : 'w-[150px] py-3'} flex flex-col justify-center text-right pr-2`}>
          <span className={`text-white font-medium truncate ${compact ? 'text-xs' : 'text-sm'}`}>{guest.server}</span>
          {guest.payments && guest.payments.length > 1 ? (
            <Popover>
              <PopoverTrigger asChild>
                <button 
                  className={`flex items-center justify-end gap-1 ${compact ? 'text-[11px]' : 'text-xs'} text-neutral-400 hover:text-neutral-200 transition-colors`}
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
            <span className={`text-neutral-400 truncate ${compact ? 'text-[11px]' : 'text-xs'}`}>{paymentDisplay}</span>
          )}
        </div>

        {/* RIGHT: Status + Amount */}
        <div className={`flex-shrink-0 flex flex-col items-end justify-center ${compact ? 'pr-2 py-2 w-[90px]' : 'pr-3 py-3 w-[110px]'}`}>
          <span 
            className={`font-bold uppercase tracking-wide ${compact ? 'text-[11px] mb-0.5' : 'text-sm mb-1'}`}
            style={{ color: statusStyle.color }}
          >
            {guest.status}
          </span>
          <span className={`text-white font-bold ${compact ? 'text-base' : 'text-lg'}`}>
            {formatPrice(guest.total)}
          </span>
          <span className={`text-neutral-500 ${compact ? 'text-[10px]' : 'text-xs'}`}>
            {formatPrice(paidAmount)}
          </span>
        </div>

        {/* FAR RIGHT: Action Strip - Status dependent */}
        {showActions && (
          <div className="flex-shrink-0 flex flex-col rounded-r-xl overflow-hidden border-l border-neutral-700/50">
            {guest.status === "PAID" || guest.status === "COMPLETED" || guest.status === "PARTIALLY REFUNDED" ? (
              <>
                {/* Print icon */}
                <button 
                  className="flex-1 px-2.5 flex items-center justify-center hover:bg-neutral-500/50 transition-colors"
                  style={{ background: 'linear-gradient(180deg, #5A5A5A 0%, #3A3A3A 100%)' }}
                  onClick={e => { e.stopPropagation(); setSelectedGuest(guest); setShowReceiptDialog(true); }}
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
                  onClick={e => handleMergeClick(guest, e)}
                >
                  <img src={mergeIcon} alt="Merge" className="w-4 h-4 object-contain" />
                </button>
                {/* Transfer icon */}
                <button 
                  className="flex-1 px-2.5 flex items-center justify-center hover:bg-neutral-500/50 transition-colors border-t border-neutral-600/50"
                  style={{ background: 'linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)' }}
                  onClick={e => handleTransferClick(guest, e)}
                >
                  <img src={shareOrderIcon} alt="Transfer" className="w-4 h-4 object-contain brightness-0" />
                </button>
              </>
            )}
          </div>
        )}
      </div>
    );

    const hasTransferBanner = !!guest.transferInfo;
    
    const transferBanner = hasTransferBanner ? (
      <div className="px-2 py-0.5 rounded-t-xl bg-[#1E3A5F]">
        <span className={`${compact ? 'text-[10px]' : 'text-xs'} font-medium`}>
          {guest.transferInfo!.type === 'sent' ? (
            <>
              <span style={{ color: '#8AC4FF' }}>
                {guest.transferInfo!.transferType === 'full' ? 'Order fully transferred to' : `Transferred ${guest.transferInfo!.itemCount} item${(guest.transferInfo!.itemCount || 0) > 1 ? 's' : ''} to`}
              </span>{" "}
              <span className="text-white">Order #{guest.transferInfo!.targetOrderId}{guest.transferInfo!.targetOrderName ? ` · ${guest.transferInfo!.targetOrderName}` : ''}</span>
            </>
          ) : (
            <>
              <span style={{ color: '#8AC4FF' }}>
                {guest.transferInfo!.transferType === 'full' ? 'Order fully transferred from' : `${guest.transferInfo!.itemCount} item${(guest.transferInfo!.itemCount || 0) > 1 ? 's' : ''} transferred from`}
              </span>{" "}
              <span className="text-white">{guest.transferInfo!.sourceTable && guest.transferInfo!.sourceTable !== '--' ? `${guest.transferInfo!.sourceTable} · ` : ''}Order #{guest.transferInfo!.sourceOrderId}</span>
            </>
          )}
        </span>
      </div>
    ) : null;

    if (showSwipe) {
      return (
        <div className="relative cursor-pointer transition-all overflow-hidden bg-black">
          {transferBanner}
          {/* Swipe Action Buttons */}
          <div className={`absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2 md:hidden transition-opacity duration-200 ${(swipeStates[guest.id] || 0) < -20 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <button className="w-10 h-10 flex items-center justify-center rounded-full transition-colors" style={{ backgroundColor: '#666666' }} onClick={e => { e.stopPropagation(); handleMergeClick(guest, e); }}>
              <img src={mergeIcon} alt="Merge" className="w-5 h-5 object-contain" />
            </button>
            <button className="w-10 h-10 flex items-center justify-center rounded-full transition-colors" style={{ background: 'linear-gradient(180deg, #FF9E65 0%, #FF5E00 100%)' }} onClick={e => { e.stopPropagation(); handleTransferClick(guest, e); }}>
              <img src={shareOrderIcon} alt="Transfer" className="w-5 h-5 object-contain" />
            </button>
          </div>

          {/* Swipeable card content */}
          <div 
            className="relative transition-transform duration-200 ease-out md:transform-none bg-black select-none" 
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
            <div className={`border ${hasTransferBanner ? 'rounded-b-xl' : 'rounded-xl'} overflow-hidden transition-all ${isSelected ? 'border-white' : 'border-white/10'}`} style={{ backgroundColor: '#1B1C20' }}>
              {mobileCardContent}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div>
        {transferBanner}
        <div 
          onClick={onSelect}
          className={`${hasTransferBanner ? 'rounded-b-xl' : 'rounded-xl'} border cursor-pointer transition-all overflow-hidden hover:shadow-lg hover:shadow-black/20 ${isSelected ? "border-white/40 shadow-md shadow-black/30" : "border-neutral-700/60 hover:border-neutral-500/60"}`} 
          style={{ backgroundColor: '#1B1C20' }}
        >
          {cardContent}
        </div>
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

      {/* Order Products */}
      <ScrollArea className="flex-1 px-3">
        <div className="py-2 space-y-1.5">
          {selectedGuest.items.map((item, index) => {
            const canSwipe = isTicketEditable(selectedGuest.status);
            const isPaidTicket = selectedGuest.status === "PAID" || selectedGuest.status === "COMPLETED" || selectedGuest.status === "PARTIALLY REFUNDED";
            const itemRefunded = isItemRefunded(selectedGuest.id, index);

            // Helper to render modifier list
            const renderModifiers = () => {
              if (item.modifiers.length === 0) return null;
              return (
                <div className="mt-1.5 ml-1">
                  {item.modifiers.map((mod, i) => {
                    const modRefunded = isModifierRefunded(selectedGuest.id, index, i);
                    const priceMatch = mod.match(/\$(\d+\.?\d*)/);
                    const modPrice = priceMatch ? parseFloat(priceMatch[1]) : 0;
                    const modName = mod.replace(/\s*\$\d+\.?\d*/, '').trim();
                    const isLast = i === item.modifiers.length - 1;
                    
                    let prefix = '•';
                    if (mod.startsWith('-') || mod.startsWith('No ')) prefix = '-';
                    else if (mod.startsWith('+') || mod.startsWith('Add ') || mod.startsWith('W/') || mod.startsWith('Extra')) prefix = '+';
                    else if (mod.startsWith('Side:')) prefix = '•';

                    const modContent = (
                      <div className={`flex items-center text-xs h-5 ${modRefunded ? 'opacity-50' : ''}`}>
                        <div className="relative w-4 h-full flex-shrink-0">
                          <div className="absolute left-0 w-px bg-white/30" style={{ top: i === 0 ? '0' : '-2px', height: isLast ? '50%' : 'calc(100% + 2px)' }} />
                          <div className="absolute left-0 top-1/2 w-2.5 h-px bg-white/30" />
                        </div>
                        <div className="flex items-center flex-1 min-w-0">
                          <span className="mr-1.5 text-white/40 w-2 text-center flex-shrink-0">{prefix}</span>
                          <span className={`truncate ${modRefunded ? 'line-through text-red-400' : itemRefunded ? 'line-through text-red-400' : prefix === '-' ? 'text-white/40' : 'text-white/50'}`}>
                            {modName || mod}
                          </span>
                          {modPrice > 0 && (
                            <span className={`ml-auto pl-2 flex-shrink-0 ${modRefunded ? 'line-through text-red-400' : 'text-white/60'}`}>${modPrice.toFixed(2)}</span>
                          )}
                          {modPrice === 0 && !mod.match(/\$/) && (
                            <span className="ml-auto pl-2 flex-shrink-0 text-white/30">$0.00</span>
                          )}
                          {modRefunded && (
                            <span className="ml-1.5 text-[9px] bg-red-500/20 text-red-400 border border-red-500/40 px-1 py-0.5 rounded font-semibold flex-shrink-0">REFUNDED</span>
                          )}
                        </div>
                      </div>
                    );

                    if (isPaidTicket && modPrice > 0 && !modRefunded && !itemRefunded) {
                      return (
                        <SwipeableRefundItem
                          key={i}
                          onRefund={() => handleModifierRefundSwipe(modName, modPrice, index, i)}
                          label={modName}
                          isModifier={true}
                        >
                          {modContent}
                        </SwipeableRefundItem>
                      );
                    }
                    return <div key={i}>{modContent}</div>;
                  })}
                </div>
              );
            };

            const productContent = (
              <div className={`p-3 rounded-xl border transition-all ${
                itemRefunded ? 'opacity-60 border-red-500/30 bg-red-500/5' :
                item.isCancelled ? 'opacity-50 border-red-500/30 bg-red-500/5' : 
                item.noTax ? 'border-orange-500/40 bg-orange-500/5' : 'bg-white/5 border-white/10'
              }`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-2">
                    <span className={`w-6 h-6 rounded flex items-center justify-center text-sm font-bold ${
                      itemRefunded ? 'bg-red-500/20 text-red-400' :
                      item.isCancelled ? 'bg-red-500/20 text-red-400' : 'bg-white text-black'
                    }`}>
                      {item.qty}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`font-medium text-sm ${
                          itemRefunded ? 'text-red-400 line-through' :
                          item.isCancelled ? 'text-white/40 line-through' : 'text-white'
                        }`}>{item.name}</span>
                        {itemRefunded && (
                          <span className="text-[10px] bg-red-500/20 text-red-400 border border-red-500/40 px-1.5 py-0.5 rounded font-semibold">REFUNDED</span>
                        )}
                      </div>
                      {/* For non-paid tickets, render modifiers inside the card */}
                      {!isPaidTicket && renderModifiers()}
                      {(item.noTax || item.isCancelled) && !itemRefunded && (
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          {item.noTax && !item.isCancelled && (
                            <span className="text-[10px] bg-orange-500/20 text-orange-400 border border-orange-500/40 px-1.5 py-0.5 rounded font-medium">No Tax</span>
                          )}
                          {item.isCancelled && (
                            <span className="text-[10px] bg-red-500/20 text-red-400 border border-red-500/40 px-1.5 py-0.5 rounded font-medium">Cancelled</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <span className={`font-medium text-sm ${
                    itemRefunded ? 'text-red-400 line-through' :
                    item.isCancelled ? 'text-white/30 line-through' : 'text-white'
                  }`}>{formatPrice(item.price * item.qty)}</span>
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
            );

            // For paid tickets: wrap with SwipeableRefundItem, modifiers rendered OUTSIDE
            if (isPaidTicket && !itemRefunded && !item.isCancelled) {
              return (
                <div key={index}>
                  <SwipeableRefundItem
                    onRefund={() => handleItemRefundSwipe(item, index)}
                    label={item.name}
                  >
                    {productContent}
                  </SwipeableRefundItem>
                  {/* Modifiers rendered outside product swipeable for independent swiping */}
                  <div className="ml-8">
                    {renderModifiers()}
                  </div>
                </div>
              );
            }

            // For active tickets: wrap with SwipeableTicketItem (no-tax/cancel)
            if (canSwipe) {
              return (
                <SwipeableTicketItem
                  key={index}
                  isNoTax={item.noTax}
                  isCancelled={item.isCancelled}
                  disabled={false}
                  isOpen={activeSwipedProductIndex === index}
                  onSwipeStart={() => setActiveSwipedProductIndex(index)}
                  onNoTax={() => handleProductNoTax(index)}
                  onCancel={() => handleProductCancel(index)}
                >
                  {productContent}
                </SwipeableTicketItem>
              );
            }

            // Fallback: just render the content
            return <div key={index}>{productContent}</div>;
          })}
        </div>
        <ScrollBar orientation="vertical" />
      </ScrollArea>

      {/* Order Summary - mobile */}
      <div className="px-3 py-1.5 border-t border-neutral-700/50">
        <div className="text-xs rounded px-2 py-1.5 space-y-0.5" style={{ background: '#7575754D' }}>
          <div className="flex justify-between gap-3">
            <span className="text-white"><span className="font-medium">Sub Total</span> <span className="font-bold">{formatPrice(selectedGuest.subtotal)}</span></span>
            {selectedGuest.discount > 0 && (
              <span className="text-red-400"><span className="font-medium">Discount</span> <span className="font-bold">-{formatPrice(selectedGuest.discount)}</span></span>
            )}
          </div>
          <div className="flex justify-between gap-3">
            {selectedGuest.serviceCharge > 0 && (
              <span className="text-white"><span className="font-medium">Service Charge</span> <span className="font-bold">+{formatPrice(selectedGuest.serviceCharge)}</span></span>
            )}
            {isTaxExempt ? (
              <span className="text-[9px] bg-orange-500/20 text-orange-400 border border-orange-500/40 px-1.5 py-0.5 rounded font-medium">No Tax</span>
            ) : (
              <span className="text-white"><span className="font-medium">Tax</span> <span className="font-bold">{formatPrice(selectedGuest.tax)}</span></span>
            )}
          </div>
        </div>
        {/* Total + Tip line */}
        <div className="flex items-center justify-between mt-1 px-1 text-sm">
          <span className="text-white font-medium">Total <span className="font-bold">{formatPrice(selectedGuest.total)}</span> {selectedGuest.tip > 0 && <span className="text-white/60">+ Tip <span className="font-bold">{formatPrice(selectedGuest.tip)}</span></span>}</span>
        </div>
        {/* Refunded summary */}
        {hasAnyRefundedItems(selectedGuest.id) && (
          <div className="flex items-center justify-between mt-1 px-1">
            <div className="flex items-center gap-1.5">
              <span className="text-red-400 text-xs">↺</span>
              <span className="text-red-400 text-xs font-medium">Refunded <span className="font-bold">{formatPrice(getRefundedTotal(selectedGuest.id))}</span></span>
            </div>
            <span className="text-[10px] bg-orange-500/20 text-orange-400 border border-orange-500/40 px-2 py-0.5 rounded font-semibold">PARTIALLY REFUNDED</span>
          </div>
        )}
      </div>

      {/* Action Buttons - mobile */}
      {selectedGuest.status === "PAID" || selectedGuest.status === "COMPLETED" || selectedGuest.status === "PARTIALLY REFUNDED" ? (
        <div className="px-3 py-2 border-t border-neutral-700/50">
          <Button 
            variant="secondary"
            size="sm"
            onClick={() => setShowTransferCheckDialog(true)}
            className="text-xs rounded-[10px] bg-[#666666] hover:bg-[#666666] border border-sidebar-border h-7 px-3 whitespace-nowrap flex items-center gap-1.5"
          >
            <img src={transferCheckIcon} alt="" className="w-3.5 h-3.5" />
            Transfer Check
          </Button>
        </div>
      ) : (
        <div className="px-3 py-2 border-t border-neutral-700/50">
          <ScrollArea className="w-full">
            <div className="flex gap-2">
              {[
                { label: "Add Product", icon: customItemIcon, action: () => navigate(`/orders?orderId=${selectedGuest.id}&tableId=${selectedGuest.table}&mode=addItem`) },
                { label: "Discount", icon: discountBtnIcon, action: () => { setDiscountDialogView('mpin'); setShowDiscountDialog(true); }, highlight: !!selectedDiscountId },
                { label: "No Tax", icon: noTaxBtnIcon, action: () => isTaxExempt ? setIsTaxExempt(false) : setShowNoTaxDialog(true), highlight: isTaxExempt },
                { label: "Receipt", icon: printIcon, action: () => setShowReceiptDialog(true) },
                { label: "Transfer Check", icon: transferCheckIcon, action: () => setShowTransferCheckDialog(true) },
              ].map(({ label, icon, action, highlight }: any) => (
                <Button key={label} variant="secondary" size="sm" onClick={action} className={`text-xs rounded-[10px] ${highlight ? 'bg-orange-500/20 border-orange-500' : 'bg-[#666666] border-sidebar-border'} hover:bg-[#555555] border h-7 px-3 whitespace-nowrap flex items-center gap-1.5`}>
                  <img src={icon} alt="" className="w-4 h-4" />
                  {label}
                </Button>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      )}

      {/* Bottom Actions */}
      <div className="px-3 py-3 border-t border-neutral-700/50 flex items-center gap-2">
        {(selectedGuest.status === "PAID" || selectedGuest.status === "COMPLETED" || selectedGuest.status === "PARTIALLY REFUNDED") ? (
          showRefundMode ? (
            <button 
              onClick={() => setShowRefundDialog(true)}
              className="flex-1 py-2.5 rounded-full text-white text-sm font-bold"
              style={{ background: 'linear-gradient(180deg, #DC2626 0%, #991B1B 100%)' }}
            >
              REFUND
            </button>
          ) : (
            <>
              <button 
                onClick={() => setShowTipDialog(true)}
                className="flex-1 py-2.5 rounded-full text-white text-sm font-bold border border-white/20"
                style={{ background: '#1B1C20' }}
              >
                ADD TIP
              </button>
              <button 
                onClick={() => setShowRefundMode(true)}
                className="flex-1 py-2.5 rounded-full text-black text-sm font-bold"
                style={{ background: 'linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)' }}
              >
                CLOSE
              </button>
            </>
          )
        ) : (
          <>
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
              {(() => {
                const mobileTotal = isTaxExempt 
                  ? selectedGuest.subtotal - selectedGuest.discount + selectedGuest.serviceCharge + (selectedGuest.tip ?? 0)
                  : selectedGuest.total;
                return `CHARGE ${formatPrice(mobileTotal)}`;
              })()}
            </button>
          </>
        )}
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



  const handleMobileFilterApply = useCallback((filters: {
    revenueCenter: string | null;
    date: Date | undefined;
    employee: string | null;
    orderType: string | null;
    orderStatus: string | null;
    paymentType: string | null;
  }) => {
    setAdvFilterRevenueCenter(filters.revenueCenter);
    setAdvFilterDate(filters.date);
    setAdvFilterEmployee(filters.employee);
    setAdvFilterOrderType(filters.orderType);
    setAdvFilterOrderStatus(filters.orderStatus);
    setAdvFilterPaymentType(filters.paymentType);
  }, []);

  const hasAnyAdvancedFilter = !!(advFilterRevenueCenter || advFilterDate || advFilterEmployee || advFilterOrderType || advFilterOrderStatus || advFilterPaymentType);

  const resetAllAdvancedFilters = useCallback(() => {
    setAdvFilterRevenueCenter(null);
    setAdvFilterDate(undefined);
    setAdvFilterEmployee(null);
    setAdvFilterOrderType(null);
    setAdvFilterOrderStatus(null);
    setAdvFilterPaymentType(null);
  }, []);

  const handleSearchQueryChange = useCallback((q: string) => setSearchQuery(q), []);
  const handleShowSearchChange = useCallback((v: boolean) => setShowSearch(v), []);
  const handleShowFilterIconsChange = useCallback((v: boolean) => setShowFilterIcons(v), []);
  const handleAdvFilterRevenueCenterChange = useCallback((v: string | null) => setAdvFilterRevenueCenter(v), []);
  const handleAdvFilterDateChange = useCallback((v: Date | undefined) => setAdvFilterDate(v), []);
  const handleAdvFilterEmployeeChange = useCallback((v: string | null) => setAdvFilterEmployee(v), []);
  const handleAdvFilterOrderTypeChange = useCallback((v: string | null) => setAdvFilterOrderType(v), []);
  const handleAdvFilterOrderStatusChange = useCallback((v: string | null) => setAdvFilterOrderStatus(v), []);
  const handleAdvFilterPaymentTypeChange = useCallback((v: string | null) => setAdvFilterPaymentType(v), []);

  // ===== RIGHT PANEL (shared between desktop & tablet) =====
  const RightPanel = ({ width, isTablet = false }: { width: string; isTablet?: boolean }) => (
    <div className={`${width} flex flex-col m-2 ml-0 min-w-0`}>
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
        {selectedGuest.status === "PAID" || selectedGuest.status === "COMPLETED" || selectedGuest.status === "PARTIALLY REFUNDED" ? (
          <div className="flex gap-2">
            <Button 
              variant="secondary"
              size="sm"
              onClick={() => setShowTransferCheckDialog(true)}
              className="text-xs rounded-[10px] bg-[#666666] hover:bg-[#666666] border border-sidebar-border h-7 px-3 whitespace-nowrap flex items-center gap-1.5"
            >
              <img src={transferCheckIcon} alt="" className="w-3.5 h-3.5" />
              Transfer Check
            </Button>
          </div>
        ) : (
          <div className={`flex gap-2 overflow-x-auto scrollbar-hide ${isTablet ? 'flex-wrap' : ''}`}>
            {[
              { label: "Add Product", icon: customItemIcon, action: () => navigate(`/orders?orderId=${selectedGuest.id}&tableId=${selectedGuest.table}&mode=addItem`) },
              { label: "Discount", icon: discountBtnIcon, action: () => { setDiscountDialogView('mpin'); setShowDiscountDialog(true); }, highlight: !!selectedDiscountId },
              { label: "Receipt", icon: printIcon, action: () => setShowReceiptDialog(true) },
              ...(!isTablet ? [
                { label: "No Tax", icon: noTaxBtnIcon, action: () => isTaxExempt ? setIsTaxExempt(false) : setShowNoTaxDialog(true), highlight: isTaxExempt },
                { label: "Register", icon: registerBtnIcon },
              ] : []),
              { label: "Transfer Check", icon: transferCheckIcon, action: () => setShowTransferCheckDialog(true) },
            ].map(({ label, icon, action, highlight }: any) => (
              <Button key={label} variant="secondary" size="sm" onClick={action} className={`text-xs rounded-[10px] ${highlight ? 'bg-orange-500/20 border-orange-500' : 'bg-[#666666] border-sidebar-border'} hover:bg-[#555555] border h-7 px-3 whitespace-nowrap flex items-center gap-1.5`}>
                <img src={icon} alt="" className="w-4 h-4" />
                {label}
              </Button>
            ))}
          </div>
        )}
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

        {/* Transfer Info - matching Table Order right panel style */}
        {selectedGuest.transferInfo && (
          <div className={`${isTablet ? 'px-3 py-1.5' : 'px-3 py-1.5'} border-b border-white/10 flex-shrink-0`}>
            <div className="flex items-center gap-2">
              <img src={transferIcon} alt="Transfer" className={`${isTablet ? 'w-3 h-3' : 'w-4 h-4'} flex-shrink-0`} style={{ filter: 'brightness(0) saturate(100%) invert(68%) sepia(53%) saturate(456%) hue-rotate(182deg) brightness(103%) contrast(101%)' }} />
              <span className="text-xs font-medium" style={{ color: '#8AC4FF' }}>
                {selectedGuest.transferInfo.type === 'sent' ? (
                  selectedGuest.transferInfo.transferType === 'full'
                    ? `Fully Transferred to ${selectedGuest.transferInfo.targetOrderName ? selectedGuest.transferInfo.targetOrderName + ' · ' : ''}Order #${selectedGuest.transferInfo.targetOrderId}`
                    : `Transferred (${selectedGuest.transferInfo.itemCount}) item${(selectedGuest.transferInfo.itemCount || 0) > 1 ? 's' : ''} to Order #${selectedGuest.transferInfo.targetOrderId}`
                ) : (
                  selectedGuest.transferInfo.transferType === 'full'
                    ? `Fully Transferred from ${selectedGuest.transferInfo.sourceTable && selectedGuest.transferInfo.sourceTable !== '--' ? selectedGuest.transferInfo.sourceTable + ' · ' : ''}Order #${selectedGuest.transferInfo.sourceOrderId}`
                    : `${selectedGuest.transferInfo.itemCount} item${(selectedGuest.transferInfo.itemCount || 0) > 1 ? 's' : ''} transferred from Order #${selectedGuest.transferInfo.sourceOrderId}`
                )}
              </span>
            </div>
          </div>
        )}

        {/* Order Items */}
        <ScrollArea className={`flex-1 ${isTablet ? 'px-3' : 'px-4'}`}>
          <div className={`py-2 space-y-${isTablet ? '1.5' : '2'}`}>
            {/* For SENT orders: show original items with strikethrough */}
            {selectedGuest.transferInfo?.type === 'sent' && selectedGuest.transferInfo.transferredItems && selectedGuest.transferInfo.transferredItems.map((item, index) => (
              <div key={`sent-${index}`} className={`${isTablet ? 'p-2 rounded-lg' : 'p-3 rounded-xl'} bg-white/5 border border-white/10 opacity-50`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-2">
                    <span className={`${isTablet ? 'w-5 h-5 text-xs' : 'w-6 h-6 text-sm'} bg-white rounded flex items-center justify-center text-black font-bold`}>
                      {item.qty}
                    </span>
                    <div>
                      <span className={`text-white font-medium line-through ${isTablet ? 'text-sm' : ''}`}>{item.name}</span>
                      <div className="flex items-center gap-1 mt-0.5">
                        <img src={transferIcon} alt="Transfer" className="w-3 h-3" style={{ filter: 'brightness(0) saturate(100%) invert(68%) sepia(53%) saturate(456%) hue-rotate(182deg) brightness(103%) contrast(101%)' }} />
                        <span className="text-[10px] text-[#8AC4FF]">Transferred to {selectedGuest.transferInfo!.targetOrderName || `Order #${selectedGuest.transferInfo!.targetOrderId}`}</span>
                      </div>
                    </div>
                  </div>
                  <span className={`text-white font-medium line-through ${isTablet ? 'text-sm' : ''}`}>{formatPrice(item.price * item.qty)}</span>
                </div>
              </div>
            ))}

            {/* For RECEIVED orders: show transferred items in blue shade */}
            {selectedGuest.transferInfo?.type === 'received' && selectedGuest.transferInfo.transferredItems && (
              <div className="mb-2 pb-2 border-b border-white/10">
                {selectedGuest.transferInfo.transferredItems.map((item, index) => (
                  <div key={`received-${index}`} className={`${isTablet ? 'p-2 rounded-lg mb-1' : 'p-3 rounded-xl mb-1.5'} border border-[#3B6A9E]`} style={{ background: 'linear-gradient(180deg, #1E3A5F 0%, #2A4A6F 100%)' }}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-2">
                        <span className={`${isTablet ? 'w-5 h-5 text-xs' : 'w-6 h-6 text-sm'} bg-[#3B6A9E] rounded flex items-center justify-center text-white font-bold`}>
                          {item.qty}
                        </span>
                        <span className={`text-white font-medium ${isTablet ? 'text-sm' : ''}`}>{item.name}</span>
                      </div>
                      <span className={`text-white/80 font-medium ${isTablet ? 'text-sm' : ''}`}>{formatPrice(item.price * item.qty)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Regular items (for non-transferred orders OR remaining items on received orders) */}
            {selectedGuest.items.map((item, index) => {
              const canSwipe = isTicketEditable(selectedGuest.status);
              const isPaidTicket = selectedGuest.status === "PAID" || selectedGuest.status === "COMPLETED" || selectedGuest.status === "PARTIALLY REFUNDED";
              const itemRefunded = isItemRefunded(selectedGuest.id, index);

              // Helper to render modifier list (mobile/tablet)
              const renderModifiers = () => {
                if (item.modifiers.length === 0) return null;
                return (
                  <div className="mt-1.5 ml-1">
                    {item.modifiers.map((mod, i) => {
                      const modRefunded = isModifierRefunded(selectedGuest.id, index, i);
                      const priceMatch = mod.match(/\$(\d+\.?\d*)/);
                      const modPrice = priceMatch ? parseFloat(priceMatch[1]) : 0;
                      const modName = mod.replace(/\s*\$\d+\.?\d*/, '').trim();
                      const isLast = i === item.modifiers.length - 1;
                      
                      let prefix = '•';
                      if (mod.startsWith('-') || mod.startsWith('No ')) prefix = '-';
                      else if (mod.startsWith('+') || mod.startsWith('Add ') || mod.startsWith('W/') || mod.startsWith('Extra')) prefix = '+';
                      else if (mod.startsWith('Side:')) prefix = '•';

                      const modContent = (
                        <div className={`flex items-center ${isTablet ? 'text-xs' : 'text-sm'} h-5 ${modRefunded ? 'opacity-50' : ''}`}>
                          <div className="relative w-4 h-full flex-shrink-0">
                            <div className="absolute left-0 w-px bg-white/30" style={{ top: i === 0 ? '0' : '-2px', height: isLast ? '50%' : 'calc(100% + 2px)' }} />
                            <div className="absolute left-0 top-1/2 w-2.5 h-px bg-white/30" />
                          </div>
                          <div className="flex items-center flex-1 min-w-0">
                            <span className="mr-1.5 text-white/40 w-2 text-center flex-shrink-0">{prefix}</span>
                            <span className={`truncate ${modRefunded ? 'line-through text-red-400' : itemRefunded ? 'line-through text-red-400' : prefix === '-' ? 'text-white/40' : 'text-white/50'}`}>
                              {modName || mod}
                            </span>
                            {modPrice > 0 && (
                              <span className={`ml-auto pl-2 flex-shrink-0 ${modRefunded ? 'line-through text-red-400' : 'text-white/60'}`}>${modPrice.toFixed(2)}</span>
                            )}
                            {modPrice === 0 && !mod.match(/\$/) && (
                              <span className="ml-auto pl-2 flex-shrink-0 text-white/30">$0.00</span>
                            )}
                            {modRefunded && (
                              <span className="ml-1.5 text-[9px] bg-red-500/20 text-red-400 border border-red-500/40 px-1 py-0.5 rounded font-semibold flex-shrink-0">REFUNDED</span>
                            )}
                          </div>
                        </div>
                      );

                      if (isPaidTicket && modPrice > 0 && !modRefunded && !itemRefunded) {
                        return (
                          <SwipeableRefundItem
                            key={i}
                            onRefund={() => handleModifierRefundSwipe(modName, modPrice, index, i)}
                            label={modName}
                            isModifier={true}
                          >
                            {modContent}
                          </SwipeableRefundItem>
                        );
                      }
                      return <div key={i}>{modContent}</div>;
                    })}
                  </div>
                );
              };

              const productContent = (
                <div className={`${isTablet ? 'p-2 rounded-lg' : 'p-3 rounded-xl'} border transition-all ${
                  itemRefunded ? 'opacity-60 border-red-500/30 bg-red-500/5' :
                  item.isCancelled ? 'opacity-50 border-red-500/30 bg-red-500/5' : 
                  item.noTax ? 'border-orange-500/40 bg-orange-500/5' : 'bg-white/5 border-white/10'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2">
                      <span className={`${isTablet ? 'w-5 h-5 text-xs' : 'w-6 h-6 text-sm'} rounded flex items-center justify-center font-bold ${
                        itemRefunded ? 'bg-red-500/20 text-red-400' :
                        item.isCancelled ? 'bg-red-500/20 text-red-400' : 'bg-white text-black'
                      }`}>
                        {item.qty}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`font-medium ${isTablet ? 'text-sm' : ''} ${
                            itemRefunded ? 'text-red-400 line-through' :
                            item.isCancelled ? 'text-white/40 line-through' : 'text-white'
                          }`}>{item.name}</span>
                          {itemRefunded && (
                            <span className="text-[10px] bg-red-500/20 text-red-400 border border-red-500/40 px-1.5 py-0.5 rounded font-semibold">REFUNDED</span>
                          )}
                        </div>
                        {/* For non-paid tickets, render modifiers inside the card */}
                        {!isPaidTicket && renderModifiers()}
                        {(item.noTax || item.isCancelled) && !itemRefunded && (
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            {item.noTax && !item.isCancelled && (
                              <span className="text-[10px] bg-orange-500/20 text-orange-400 border border-orange-500/40 px-1.5 py-0.5 rounded font-medium">No Tax</span>
                            )}
                            {item.isCancelled && (
                              <span className="text-[10px] bg-red-500/20 text-red-400 border border-red-500/40 px-1.5 py-0.5 rounded font-medium">Cancelled</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <span className={`font-medium ${isTablet ? 'text-sm' : ''} ${
                      itemRefunded ? 'text-red-400 line-through' :
                      item.isCancelled ? 'text-white/30 line-through' : 'text-white'
                    }`}>{formatPrice(item.price * item.qty)}</span>
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
              );

              // For paid tickets: wrap with SwipeableRefundItem, modifiers rendered OUTSIDE
              if (isPaidTicket && !itemRefunded && !item.isCancelled) {
                return (
                  <div key={index}>
                    <SwipeableRefundItem
                      onRefund={() => handleItemRefundSwipe(item, index)}
                      label={item.name}
                    >
                      {productContent}
                    </SwipeableRefundItem>
                    {/* Modifiers rendered outside product swipeable for independent swiping */}
                    <div className="ml-8">
                      {renderModifiers()}
                    </div>
                  </div>
                );
              }

              // For active tickets: wrap with SwipeableTicketItem
              if (canSwipe) {
                return (
                  <SwipeableTicketItem
                    key={index}
                    isNoTax={item.noTax}
                    isCancelled={item.isCancelled}
                    disabled={false}
                    isOpen={activeSwipedProductIndex === index}
                    onSwipeStart={() => setActiveSwipedProductIndex(index)}
                    onNoTax={() => handleProductNoTax(index)}
                    onCancel={() => handleProductCancel(index)}
                  >
                    {productContent}
                  </SwipeableTicketItem>
                );
              }

              return <div key={index}>{productContent}</div>;
            })}
          </div>
          <ScrollBar orientation="vertical" />
        </ScrollArea>

        {/* Order Summary */}
        <div className="p-2 border-t border-white/10 flex-shrink-0">
          {(() => {
            const totalDiscount = selectedGuest.discount + appliedDiscount;
            const adjustedTax = isTaxExempt ? 0 : Math.max(0, selectedGuest.tax - appliedDiscount * 0.0735);
            const chargeTotal = Math.max(0, selectedGuest.subtotal - totalDiscount + selectedGuest.serviceCharge + adjustedTax + (selectedGuest.tip ?? 0));
            const discountName = selectedDiscountId ? discountTypes.find(d => d.id === selectedDiscountId)?.name : null;
            
            return (
              <>
                <div className={`text-xs rounded px-2 ${isTablet ? 'py-1' : 'py-1.5'} space-y-0.5`} style={{ background: '#7575754D', ...(isTablet ? {} : { boxShadow: 'inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)' }) }}>
                  <div className="flex justify-between gap-3">
                    <span className="text-white"><span className="font-medium">Sub Total</span> <span className="font-bold">{formatPrice(selectedGuest.subtotal)}</span></span>
                    {totalDiscount > 0 && (
                      <span className="text-red-400 flex items-center gap-1">
                        <span className="font-medium" title={discountName || undefined}>Discount</span> 
                        <span className="font-bold">-{formatPrice(totalDiscount)}</span>
                        {appliedDiscount > 0 && (
                          <button 
                            onClick={() => setSelectedDiscountId(null)}
                            className="w-4 h-4 rounded-full bg-red-500/20 hover:bg-red-500/40 flex items-center justify-center transition-colors ml-0.5"
                          >
                            <X className="w-2.5 h-2.5 text-red-400" />
                          </button>
                        )}
                      </span>
                    )}
                  </div>
                  {!isTablet && (
                    <div className="flex justify-between gap-3">
                      {selectedGuest.serviceCharge > 0 && (
                        <span className="text-white"><span className="font-medium">Service Charge</span> <span className="font-bold">+{formatPrice(selectedGuest.serviceCharge)}</span></span>
                      )}
                      {isTaxExempt ? (
                        <span className="text-[9px] bg-orange-500/20 text-orange-400 border border-orange-500/40 px-1.5 py-0.5 rounded font-medium">No Tax</span>
                      ) : (
                        <span className="text-white"><span className="font-medium">Tax</span> <span className="font-bold">{formatPrice(adjustedTax)}</span></span>
                      )}
                    </div>
                  )}
                </div>

                {/* Total + Tip line */}
                <div className="flex items-center justify-between px-2 mt-0.5 text-xs">
                  <span className="text-white font-medium">Total <span className="font-bold">{formatPrice(chargeTotal)}</span> {selectedGuest.tip > 0 && <span className="text-white/60">+ Tip <span className="font-bold">{formatPrice(selectedGuest.tip)}</span></span>}</span>
                </div>
                {/* Refunded summary */}
                {hasAnyRefundedItems(selectedGuest.id) && (
                  <div className="flex items-center justify-between px-2 mt-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-red-400 text-xs">↺</span>
                      <span className="text-red-400 text-xs font-medium">Refunded <span className="font-bold">{formatPrice(getRefundedTotal(selectedGuest.id))}</span></span>
                    </div>
                    <span className="text-[10px] bg-orange-500/20 text-orange-400 border border-orange-500/40 px-2 py-0.5 rounded font-semibold">PARTIALLY REFUNDED</span>
                  </div>
                )}

                {/* Bottom Actions */}
                <div className={`${isTablet ? 'px-0 py-2' : 'px-2 py-3'} flex items-center gap-2`}>
                  {(selectedGuest.status === "PAID" || selectedGuest.status === "COMPLETED" || selectedGuest.status === "PARTIALLY REFUNDED") ? (
                    showRefundMode ? (
                      <button 
                        onClick={() => setShowRefundDialog(true)}
                        className={`flex-1 ${isTablet ? 'py-1.5 text-xs' : 'py-2 text-sm'} rounded-full text-white font-bold`}
                        style={{ background: 'linear-gradient(180deg, #DC2626 0%, #991B1B 100%)' }}
                      >
                        REFUND
                      </button>
                    ) : (
                      <>
                        <button 
                          onClick={() => setShowTipDialog(true)}
                          className={`flex-1 ${isTablet ? 'py-1.5 text-xs' : 'py-2 text-sm'} rounded-full text-white font-bold border border-white/20`}
                          style={{ background: '#1B1C20' }}
                        >
                          ADD TIP
                        </button>
                        <button 
                          onClick={() => setShowRefundMode(true)}
                          className={`flex-1 ${isTablet ? 'py-1.5 text-xs' : 'py-2 text-sm'} rounded-full text-black font-bold`}
                          style={{ background: 'linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)' }}
                        >
                          CLOSE
                        </button>
                      </>
                    )
                  ) : (
                    <>
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
                        CHARGE {formatPrice(chargeTotal)}
                      </button>
                    </>
                  )}
                </div>
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );

  // Mobile Layout
  const MobileLayout = () => (
    <div className="flex flex-col h-full bg-black">
      {/* Mobile Header with filter icon opening bottom sheet */}
      {showSearch ? (
        <div className="relative flex items-center justify-between p-2 border-b border-neutral-700/50">
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
            className="p-2 rounded-full hover:opacity-80"
            style={{ background: "#7575754D", boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)" }}
            onClick={() => { setShowSearch(false); setSearchQuery(""); }}
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
      ) : (
        <div className="relative flex items-center justify-between p-2 border-b border-neutral-700/50">
          <span className="text-white font-semibold text-lg pl-2">Tickets</span>
          <div className="flex items-center gap-1.5">
            <button
              className="p-2 rounded-full hover:opacity-80 relative"
              style={hasAnyAdvancedFilter
                ? { background: "linear-gradient(180deg, #FF9E65 0%, #FF5E00 100%)" }
                : { background: "#7575754D", boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)" }
              }
              onClick={() => setShowMobileFilterSheet(true)}
            >
              <SlidersHorizontal className="w-4 h-4 text-white" />
              {hasAnyAdvancedFilter && (
                <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-amber-500 text-[8px] text-white font-bold flex items-center justify-center">!</span>
              )}
            </button>
            <button
              className="p-2 rounded-full hover:opacity-80"
              style={{ background: "#7575754D", boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)" }}
              onClick={() => setShowSearch(true)}
            >
              <Search className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      )}
      <FilterTabs />

      {/* Guest Orders List */}
      <ScrollArea className="flex-1 px-4">
        <div className="space-y-3 pb-4">
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

      <MobileFilterBottomSheet
        isOpen={showMobileFilterSheet}
        onClose={() => setShowMobileFilterSheet(false)}
        advFilterRevenueCenter={advFilterRevenueCenter}
        advFilterDate={advFilterDate}
        advFilterEmployee={advFilterEmployee}
        advFilterOrderType={advFilterOrderType}
        advFilterOrderStatus={advFilterOrderStatus}
        advFilterPaymentType={advFilterPaymentType}
        onApply={handleMobileFilterApply}
      />
    </div>
  );

  // Transfer Left Panel - embedded in layout
  const TransferLeftPanel = ({ isTablet = false }: { isTablet?: boolean }) => (
    <div className="flex flex-col flex-1 m-2 rounded-[20px] overflow-hidden">
      <TicketsTransferView
        key={`${transferSource?.id}-${transferType}`}
        sourceOrder={transferSource as any}
        isEntireOrderTransfer={transferType === 'entire' || transferType === 'entireToOrder'}
        transferTarget={transferType === 'entireToOrder' ? 'order' : 'table'}
        onBack={closeTransferFlow}
        orders={orders as any}
        setOrders={updateOrders as any}
        onTransferComplete={() => {
          closeTransferFlow();
          // Use setTimeout to read latest state after the setOrders update has been applied
          setTimeout(() => {
            const latestOrders = JSON.parse(localStorage.getItem('pos-unified-orders') || '[]');
            const updated = latestOrders.find((o: any) => o.id === transferSource!.id);
            if (updated) setSelectedGuest(updated);
          }, 50);
        }}
        embedded
      />
    </div>
  );

  // Desktop Layout
  const DesktopLayout = () => {
    const isTransferActive = transferStep === 'active' && transferSource && transferType;
    return (
      <div className="flex h-full bg-black overflow-hidden">
        {isTransferActive ? (
          <TransferLeftPanel />
        ) : (
          <div className="flex flex-col flex-1 m-2 rounded-[20px] overflow-hidden">
             <TicketsFilterBar showSearch={showSearch} searchQuery={searchQuery} showFilterIcons={showFilterIcons} advFilterRevenueCenter={advFilterRevenueCenter} advFilterDate={advFilterDate} advFilterEmployee={advFilterEmployee} advFilterOrderType={advFilterOrderType} advFilterOrderStatus={advFilterOrderStatus} advFilterPaymentType={advFilterPaymentType} onSearchQueryChange={handleSearchQueryChange} onShowSearchChange={handleShowSearchChange} onShowFilterIconsChange={handleShowFilterIconsChange} onAdvFilterRevenueCenterChange={handleAdvFilterRevenueCenterChange} onAdvFilterDateChange={handleAdvFilterDateChange} onAdvFilterEmployeeChange={handleAdvFilterEmployeeChange} onAdvFilterOrderTypeChange={handleAdvFilterOrderTypeChange} onAdvFilterOrderStatusChange={handleAdvFilterOrderStatusChange} onAdvFilterPaymentTypeChange={handleAdvFilterPaymentTypeChange} onResetAllAdvancedFilters={resetAllAdvancedFilters} hasAnyAdvancedFilter={hasAnyAdvancedFilter} />
            <FilterTabs style="glass" />
            <ScrollArea className="flex-1 px-1.5">
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
        )}
        <RightPanel width="w-[345px]" />
      </div>
    );
  };

  // Tablet Layout
  const TabletLayout = () => {
    const isTransferActive = transferStep === 'active' && transferSource && transferType;
    return (
      <div className="flex h-full bg-black overflow-hidden">
        {isTransferActive ? (
          <TransferLeftPanel isTablet />
        ) : (
          <div className="flex flex-col flex-1 m-2 rounded-[20px] overflow-hidden">
            <TicketsFilterBar showSearch={showSearch} searchQuery={searchQuery} showFilterIcons={showFilterIcons} advFilterRevenueCenter={advFilterRevenueCenter} advFilterDate={advFilterDate} advFilterEmployee={advFilterEmployee} advFilterOrderType={advFilterOrderType} advFilterOrderStatus={advFilterOrderStatus} advFilterPaymentType={advFilterPaymentType} onSearchQueryChange={handleSearchQueryChange} onShowSearchChange={handleShowSearchChange} onShowFilterIconsChange={handleShowFilterIconsChange} onAdvFilterRevenueCenterChange={handleAdvFilterRevenueCenterChange} onAdvFilterDateChange={handleAdvFilterDateChange} onAdvFilterEmployeeChange={handleAdvFilterEmployeeChange} onAdvFilterOrderTypeChange={handleAdvFilterOrderTypeChange} onAdvFilterOrderStatusChange={handleAdvFilterOrderStatusChange} onAdvFilterPaymentTypeChange={handleAdvFilterPaymentTypeChange} onResetAllAdvancedFilters={resetAllAdvancedFilters} hasAnyAdvancedFilter={hasAnyAdvancedFilter} />
            <FilterTabs />
            <ScrollArea className="flex-1 px-1.5">
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
        )}
        <RightPanel width="w-[280px]" isTablet />
      </div>
    );
  };

  // Responsive rendering
  return (
    <div className="w-full max-w-full overflow-x-hidden h-full">
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

      {/* Merge & Transfer Dialogs */}
      <MergeDialog />
      <TransferIntentDialog />

      {/* Mobile Transfer View - still full screen on mobile */}
      {transferStep === 'active' && transferSource && transferType && (
        <div className="fixed inset-0 z-[60] bg-black md:hidden">
          <TicketsTransferView
            sourceOrder={transferSource as any}
            isEntireOrderTransfer={transferType === 'entire' || transferType === 'entireToOrder'}
            transferTarget={transferType === 'entireToOrder' ? 'order' : 'table'}
            onBack={closeTransferFlow}
            orders={orders as any}
            setOrders={updateOrders as any}
            onTransferComplete={() => {
              closeTransferFlow();
              setTimeout(() => {
                const latestOrders = JSON.parse(localStorage.getItem('pos-unified-orders') || '[]');
                const updated = latestOrders.find((o: any) => o.id === transferSource.id);
                if (updated) setSelectedGuest(updated);
              }, 50);
            }}
          />
        </div>
      )}
      {/* Discount Dialog with integrated MPIN - same as TableOrderDetails */}
      {showDiscountDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-neutral-900 rounded-xl border border-neutral-700 w-[90%] max-w-md mx-4 overflow-hidden animate-scale-in">
            {discountDialogView === 'mpin' ? (
              <AccessRestrictedModal
                subtitle="Manager approval required to apply discount."
                onBack={() => { setShowDiscountDialog(false); setDiscountDialogView('mpin'); }}
                onSuccess={() => setDiscountDialogView('discounts')}
              />
            ) : (
              <>
                <div className="flex items-center justify-between p-4 border-b border-neutral-700">
                  <h2 className="text-white text-lg font-semibold">Select Discount</h2>
                  <button onClick={() => setShowDiscountDialog(false)} className="w-8 h-8 rounded-full hover:bg-neutral-700 flex items-center justify-center transition-colors">
                    <X className="w-5 h-5 text-neutral-400" />
                  </button>
                </div>

                <div className="p-2 max-h-[400px] overflow-y-auto space-y-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                  {discountTypes.map((discountType) => {
                    const subtotal = selectedGuest?.items.filter(it => !it.isCancelled).reduce((sum, it) => sum + it.price * it.qty, 0) || 0;
                    const discountAmount = discountType.fixedAmount || (subtotal * ((discountType.percentage || 0) / 100));
                    const isSelected = selectedDiscountId === discountType.id;
                    const IconComponent = getDiscountIcon(discountType.icon);
                    
                    return (
                      <button key={discountType.id} onClick={() => setSelectedDiscountId(isSelected ? null : discountType.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                          isSelected ? 'bg-orange-500/20 border border-orange-500' : 'bg-neutral-800 border border-transparent hover:bg-neutral-700'
                        }`}>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isSelected ? 'bg-orange-500/30' : 'bg-neutral-700'}`}>
                          <IconComponent className="w-4 h-4 text-neutral-400" />
                        </div>
                        <div className="flex-1 text-left">
                          <div className="text-white text-sm font-medium">{discountType.name}</div>
                          <div className="text-neutral-400 text-xs">{discountType.description}</div>
                        </div>
                        <div className="text-white text-sm font-medium">-${discountAmount.toFixed(2)}</div>
                      </button>
                    );
                  })}
                </div>

                <div className="p-3 border-t border-neutral-700">
                  <button onClick={() => { setShowDiscountDialog(false); toast.success('Discount applied'); }} className="w-full py-2.5 bg-white hover:bg-neutral-100 text-black font-semibold rounded-lg transition-colors text-sm">
                    Apply
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      {/* Transfer Check Dialog */}
      <TransferCheckDialog
        isOpen={showTransferCheckDialog}
        onClose={() => setShowTransferCheckDialog(false)}
        currentServer={selectedGuest?.server || ""}
        onTransfer={(newServerName) => {
          if (selectedGuest) {
            const updatedGuest = { ...selectedGuest, server: newServerName };
            setSelectedGuest(updatedGuest);
            updateOrders(prev => prev.map(o => o.id === selectedGuest.id ? updatedGuest : o));
            toast.success(`Check transferred to ${newServerName}`);
          }
          setShowTransferCheckDialog(false);
        }}
      />

      {/* Receipt Dialog - same as TableOrderDetails */}
      <ReceiptDialog
        open={showReceiptDialog}
        onOpenChange={setShowReceiptDialog}
        orderTotal={selectedGuest?.total || 0}
        orderId={selectedGuest?.id}
        mergedOrderIds={(selectedGuest as any)?.mergedFrom ? [selectedGuest!.id, ...(selectedGuest as any).mergedFrom.map((m: any) => m.orderId)] : undefined}
        guestName={selectedGuest?.name}
        items={selectedGuest?.items?.map(item => ({
          name: item.name,
          price: item.price * item.qty,
          qty: item.qty
        }))}
      />

      {/* No Tax Confirmation Dialog - matches New Order exactly */}
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
                onClick={() => {
                  setIsTaxExempt(true);
                  setShowNoTaxDialog(false);
                }}
                className="flex-1 py-3 text-orange-500 font-medium hover:bg-neutral-800 transition-colors"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tip Dialog - reuses same component as Table Order */}
      <TipDialog
        open={showTipDialog}
        onOpenChange={setShowTipDialog}
        orderTotal={selectedGuest?.total || 0}
        existingTip={selectedGuest?.tip || 0}
        onTipSelected={(tip) => {
          if (selectedGuest) {
            const updatedGuest = { ...selectedGuest, tip: tip };
            const totals = recalcTotals(updatedGuest.items, updatedGuest);
            const finalGuest = { ...updatedGuest, ...totals };
            setSelectedGuest(finalGuest);
            updateOrders(prev => prev.map(o => o.id === selectedGuest.id ? finalGuest : o));
            toast.success(`Tip of ${formatPrice(tip)} added`);
          }
        }}
      />

      {/* Refund Dialog - reuses same component as Table Order */}
      <RefundDialog
        open={showRefundDialog}
        onOpenChange={setShowRefundDialog}
        orderTotal={selectedGuest?.subtotal || 0}
        tipAmount={selectedGuest?.tip || 0}
        orderId={selectedGuest?.id}
        guestName={selectedGuest?.name}
        orderItems={selectedGuest?.items?.map(item => ({
          name: item.name,
          price: item.price,
          qty: item.qty,
          modifiers: item.modifiers?.map((mod, idx) => ({
            name: mod,
            price: idx % 2 === 1 ? (idx + 1) * 1.5 : 0
          }))
        }))}
        onRefundComplete={(amount, reason) => {
          console.log("Refund completed:", amount, reason);
          setShowRefundMode(false);
        }}
      />

      {/* Item-Level Refund Dialog */}
      <ItemRefundDialog
        open={showItemRefundDialog}
        onOpenChange={setShowItemRefundDialog}
        itemName={itemRefundTarget?.itemName || ''}
        itemPrice={itemRefundTarget?.itemPrice || 0}
        orderId={selectedGuest?.id}
        guestName={selectedGuest?.name}
        paymentMethod={selectedGuest?.paymentType === 'Cash' ? 'Cash' : selectedGuest?.paymentType || 'Cash'}
        orderTotal={selectedGuest?.total || 0}
        tipAmount={selectedGuest?.tip || 0}
        isModifier={itemRefundTarget?.modifierIndex !== undefined}
        onRefundComplete={handleItemRefundComplete}
      />
    </div>
  );
};

export default Tickets;
