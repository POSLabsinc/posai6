import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Search, SlidersHorizontal, Phone, ShoppingBag, Truck, Wine, Users, ReceiptText, ArrowRightLeft, ChevronRight, DollarSign, CalendarDays, UsersRound, ClipboardList, CircleDollarSign, Wallet, X, Check, Info } from "lucide-react";
import { toast } from "sonner";
import TicketsTransferView from "@/components/TicketsTransferView";

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
    default: return { color: '#fff', bg: 'rgba(255,255,255,0.1)' };
  }
};

const filters = ["All", "Open", "Completed", "Paid", "Unpaid"];

const Tickets = () => {
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

  // Merge state
  const [showMergeDialog, setShowMergeDialog] = useState(false);
  const [mergeSource, setMergeSource] = useState<GuestOrder | null>(null);
  const [mergeTarget, setMergeTarget] = useState<GuestOrder | null>(null);

  // Inline Transfer flow state
  const [transferSource, setTransferSource] = useState<GuestOrder | null>(null);
  const [transferStep, setTransferStep] = useState<'intent' | 'active' | null>(null);
  const [transferType, setTransferType] = useState<'items' | 'entire' | 'entireToOrder' | null>(null);



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
    if (filter === "Paid") return orders.filter(g => g.status === "PAID" || g.paymentType !== "--").length;
    if (filter === "Unpaid") return orders.filter(g => g.status === "UNPAID" || g.paymentType === "--").length;
    return 0;
  };

  const filteredOrders = (() => {
    let filtered = activeFilter === "All" ? orders : orders.filter(guest => {
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
      filtered = filtered.filter(g =>
        g.name.toLowerCase().includes(q) ||
        g.id.includes(q) ||
        g.check.includes(q) ||
        g.table.toLowerCase().includes(q) ||
        g.server.toLowerCase().includes(q)
      );
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
                  <img src={transferItemIcon} alt="Transfer Items" className="w-5 h-5 object-contain opacity-80" />
                  <span className="text-white font-medium">Transfer Items</span>
                </div>
                <p className="text-white/50 text-xs ml-8">Move selected items to another table or order.</p>
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
            <div className={`border ${hasTransferBanner ? 'rounded-b-xl' : 'rounded-xl'} overflow-hidden transition-all ${isSelected ? 'border-white/40' : 'border-neutral-700/60 hover:border-neutral-500/60'}`} style={{ backgroundColor: '#1B1C20' }}>
              {cardContent}
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

        {/* Transfer Info Banner */}
        {selectedGuest.transferInfo && (
          <div className={`${isTablet ? 'mx-3 mb-1' : 'mx-4 mb-1'} ${isTablet ? 'px-2 py-1.5' : 'px-3 py-2'} rounded-lg border`}
            style={{ backgroundColor: '#1E3A5F', borderColor: '#3B6A9E' }}>
            <div className={`flex items-center gap-2 ${isTablet ? 'text-xs' : 'text-sm'}`}>
              <Info className={`${isTablet ? 'w-3 h-3' : 'w-4 h-4'} text-[#8AC4FF] flex-shrink-0`} />
              <span className="text-[#8AC4FF] font-medium">
                {selectedGuest.transferInfo.type === 'sent' ? (
                  selectedGuest.transferInfo.transferType === 'full'
                    ? `Order fully transferred to Order #${selectedGuest.transferInfo.targetOrderId}`
                    : `${selectedGuest.transferInfo.itemCount} item${(selectedGuest.transferInfo.itemCount || 0) > 1 ? 's' : ''} transferred to Order #${selectedGuest.transferInfo.targetOrderId}`
                ) : (
                  selectedGuest.transferInfo.transferType === 'full'
                    ? `Order fully transferred from ${selectedGuest.transferInfo.sourceTable !== '--' ? selectedGuest.transferInfo.sourceTable + ' · ' : ''}Order #${selectedGuest.transferInfo.sourceOrderId}`
                    : `${selectedGuest.transferInfo.itemCount} item${(selectedGuest.transferInfo.itemCount || 0) > 1 ? 's' : ''} transferred from Order #${selectedGuest.transferInfo.sourceOrderId}`
                )}
              </span>
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
      <ScrollArea className="flex-1 px-1.5">
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
      <div className="flex h-full bg-black">
        {isTransferActive ? (
          <TransferLeftPanel />
        ) : (
          <div className="flex flex-col flex-1 m-2 rounded-[20px] overflow-hidden">
            <TicketHeader />
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
      <div className="flex h-full bg-black">
        {isTransferActive ? (
          <TransferLeftPanel isTablet />
        ) : (
          <div className="flex flex-col flex-1 m-2 rounded-[20px] overflow-hidden">
            <TicketHeader />
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
    </>
  );
};

export default Tickets;
