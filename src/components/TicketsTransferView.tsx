import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronDown, Info, Check, Users, Share2, Phone, X } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { formatPrice, formatTableName, getOrderStatusColor } from "@/lib/orderUtils";
import { OrderNotesAutocomplete } from "@/components/OrderNotesAutocomplete";
import SwipeableCartItem from "@/components/SwipeableCartItem";
import { toast } from "sonner";
import OrderLayoutTemplate from "@/components/OrderLayoutTemplate";
import { ticketOrders, ticketToTemplateData, formatTicketPrice, getAvailableTicketOrdersForTransfer } from "@/data/ticketOrders";

// Import icons
import clearIcon from "@/assets/icons/clear-c.png";
import fireIcon from "@/assets/icons/fire.png";
import tableTargetIcon from "@/assets/icons/table-target.png";
import seatIcon from "@/assets/icons/seat-icon.png";
import dineInIcon from "@/assets/icons/dine-in.png";
import runnerIcon from "@/assets/icons/runner.png";
import chairWhiteIcon from "@/assets/icons/chair-white.png";
import saveIcon from "@/assets/icons/save.png";

// Shared types
export interface TransferOrderItem {
  qty: number;
  name: string;
  price: number;
  seats: number[];
  modifiers: string[];
}

export interface TransferGuestOrder {
  id: string;
  name: string;
  phone: string;
  partySize: number;
  time: string;
  timer: string;
  server: string;
  check: string;
  paymentType: string;
  payments?: { method: string; last4?: string; amount: number }[];
  revenueCenter: string;
  status: string;
  notes: string;
  items: TransferOrderItem[];
  subtotal: number;
  discount: number;
  serviceCharge: number;
  tax: number;
  tip: number;
  total: number;
  table: string;
  orderType: string;
}

// Table status configurations
const statusConfig: Record<string, { color: string; bgColor: string; label: string }> = {
  "Available": { color: "text-white", bgColor: "bg-neutral-700", label: "Available" },
  "Ordering": { color: "text-yellow-400", bgColor: "bg-neutral-800", label: "Ordering" },
  "Ordered": { color: "text-orange-500", bgColor: "bg-neutral-800", label: "Ordered" },
  "Reserved": { color: "text-gray-400", bgColor: "bg-neutral-800", label: "Reserved" },
  "Seated": { color: "text-gray-300", bgColor: "bg-neutral-800", label: "Seated" },
  "Running Late": { color: "text-red-400", bgColor: "bg-neutral-800", label: "Late" },
  "1st Course": { color: "text-purple-400", bgColor: "bg-neutral-800", label: "1st Course" },
  "2nd Course": { color: "text-yellow-400", bgColor: "bg-neutral-800", label: "2nd Course" },
  "3rd Course": { color: "text-orange-500", bgColor: "bg-neutral-800", label: "3rd Course" },
  "Dessert": { color: "text-pink-400", bgColor: "bg-neutral-800", label: "Dessert" },
  "Partially Seated": { color: "text-green-400", bgColor: "bg-neutral-800", label: "Partial" },
  "Served": { color: "text-blue-400", bgColor: "bg-neutral-800", label: "Served" },
  "Paid": { color: "text-emerald-400", bgColor: "bg-neutral-800", label: "Paid" },
  "Ready": { color: "text-emerald-400", bgColor: "bg-neutral-800", label: "Ready" },
};

const getSeatDotColor = (status: string): string => {
  switch (status) {
    case "Available": return "bg-green-500";
    case "Ordering": return "bg-red-500";
    case "Ordered": return "bg-orange-500";
    case "Reserved": return "bg-gray-500";
    case "Seated": return "bg-gray-400";
    case "Running Late": return "bg-red-500";
    case "1st Course": return "bg-purple-500";
    case "2nd Course": return "bg-yellow-500";
    case "3rd Course": return "bg-orange-500";
    case "Dessert": return "bg-pink-500";
    case "Partially Seated": return "bg-green-500";
    case "Served": return "bg-blue-500";
    case "Paid": return "bg-emerald-500";
    case "Ready": return "bg-emerald-500";
    default: return "bg-gray-500";
  }
};

type TableType = {
  id: string;
  seats: number;
  status: string;
  time: string;
};

const defaultTables: TableType[] = [
  { id: "T1", seats: 8, status: "Available", time: "" },
  { id: "T2", seats: 5, status: "Ordering", time: "25M" },
  { id: "T3", seats: 4, status: "Ordered", time: "2H 25M" },
  { id: "T4", seats: 3, status: "Reserved", time: "2H 25M" },
  { id: "T5", seats: 4, status: "Seated", time: "25M" },
  { id: "T6", seats: 2, status: "Running Late", time: "45M" },
  { id: "T7", seats: 5, status: "1st Course", time: "12M" },
  { id: "T8", seats: 4, status: "Ready", time: "13M" },
  { id: "T9", seats: 3, status: "3rd Course", time: "14M" },
  { id: "T10", seats: 4, status: "Dessert", time: "16M" },
  { id: "T11", seats: 5, status: "Partially Seated", time: "18M" },
  { id: "T12", seats: 5, status: "Served", time: "36M" },
];

interface TicketsTransferViewProps {
  sourceOrder: TransferGuestOrder;
  isEntireOrderTransfer: boolean;
  onBack: () => void;
  orders: TransferGuestOrder[];
  setOrders: React.Dispatch<React.SetStateAction<TransferGuestOrder[]>>;
  onTransferComplete: () => void;
  embedded?: boolean;
  transferTarget?: 'table' | 'order';
}

const TicketsTransferView = ({ sourceOrder, isEntireOrderTransfer, onBack, orders, setOrders, onTransferComplete, embedded = false, transferTarget = 'table' }: TicketsTransferViewProps) => {
  const navigate = useNavigate();
  const isDirectToOrder = transferTarget === 'order' && isEntireOrderTransfer;

  // Single unified step state for both mobile and desktop
  const getInitialStep = (): "select-items" | "select-table" => {
    if (isDirectToOrder) return "select-items"; // Will auto-open order dialog
    if (isEntireOrderTransfer) return "select-table";
    return "select-items";
  };

  const [currentStep, setCurrentStep] = useState<"select-items" | "select-table">(getInitialStep);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [itemQuantities, setItemQuantities] = useState<Record<number, number>>({});
  const [selectAll, setSelectAll] = useState(isEntireOrderTransfer);
  const [selectedSeats, setSelectedSeats] = useState<number[]>([1, 2, 3, 4]);
  const [orderNotes, setOrderNotes] = useState("");
  const [activeSwipedItemId, setActiveSwipedItemId] = useState<string | null>(null);

  // Table selection state
  const [selectedTargetTable, setSelectedTargetTable] = useState<string | null>(null);
  const [showTableConfirmDialog, setShowTableConfirmDialog] = useState(false);
  const [showTicketSelection, setShowTicketSelection] = useState(false);
  const [selectedTicketOrderId, setSelectedTicketOrderId] = useState<string | null>(null);
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);

  // Transfer to Order state
  const [showTransferToOrder, setShowTransferToOrder] = useState(false);
  const [selectedTransferOrderId, setSelectedTransferOrderId] = useState<string | null>(null);

  // Mobile bottom sheet for target selection
  const [showTargetSheet, setShowTargetSheet] = useState(false);

  const currentOrder = sourceOrder;
  const getStatusColor = getOrderStatusColor;

  // Auto-select all items for entire order transfer
  useEffect(() => {
    if (isEntireOrderTransfer && currentOrder.items.length > 0 && selectedItems.length === 0) {
      const allIndexes = currentOrder.items.map((_, i) => i);
      setSelectedItems(allIndexes);
      const quantities: Record<number, number> = {};
      currentOrder.items.forEach((item, i) => {
        quantities[i] = item.qty;
      });
      setItemQuantities(quantities);
    }
  }, [isEntireOrderTransfer, currentOrder.items]);

  // Auto-open Transfer to Order dialog for direct-to-order flow
  useEffect(() => {
    if (isDirectToOrder) {
      setShowTransferToOrder(true);
    }
  }, [isDirectToOrder]);

  // Get orders on a specific table
  const getOrdersByTable = (tableId: string) => {
    return orders.filter(o => o.table === tableId);
  };

  // Available tables (exclude source table)
  const availableTables = defaultTables.filter(table => table.id !== currentOrder.table);

  // Available orders for Transfer to Order (exclude current, paid, completed)
  const availableTransferOrders = getAvailableTicketOrdersForTransfer(currentOrder.id);

  // Execute Transfer to Order
  const executeTransferToOrder = () => {
    if (!selectedTransferOrderId) return;
    setShowTransferToOrder(false);

    // Handle "Transfer to New Order" - navigate to Orders page (only for partial transfers)
    if (selectedTransferOrderId === '__new__') {
      const transferItems = selectedItems.map(index => {
        const item = currentOrder.items[index];
        const qty = itemQuantities[index] || item.qty;
        return { ...item, qty };
      });

      const itemsData = transferItems.map(item => ({
        name: item.name,
        price: item.price,
        qty: item.qty,
        modifiers: item.modifiers || [],
      }));

      toast.success('Items transferred to new order');

      setTimeout(() => {
        const params = new URLSearchParams({
          mode: 'transferNew',
          transferItems: JSON.stringify(itemsData),
          transferFrom: currentOrder.id,
          transferFromTable: currentOrder.table,
        });
        navigate(`/orders?${params.toString()}`);
      }, 800);
      return;
    }

    // Transfer to existing order - stay on same screen
    const targetOrder = ticketOrders.find(o => o.id === selectedTransferOrderId);
    const isPartialTransfer = !isEntireOrderTransfer;

    toast.success(`${isPartialTransfer ? 'Items' : 'Order'} transferred to Order #${selectedTransferOrderId}`);
    
    // Stay on same screen - just close the transfer view
    onTransferComplete();
  };

  // Item selection handlers
  const handleItemSelect = (index: number) => {
    if (selectedItems.includes(index)) {
      setSelectedItems(selectedItems.filter(i => i !== index));
      const newQuantities = { ...itemQuantities };
      delete newQuantities[index];
      setItemQuantities(newQuantities);
    } else {
      setSelectedItems([...selectedItems, index]);
      setItemQuantities(prev => ({ ...prev, [index]: currentOrder.items[index].qty }));
    }
  };

  const handleQuantityChange = (index: number, qty: number) => {
    setItemQuantities(prev => ({ ...prev, [index]: qty }));
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedItems([]);
      setSelectAll(false);
    } else {
      setSelectedItems(currentOrder.items.map((_, i) => i));
      setSelectAll(true);
    }
  };

  const handleProceedToTargetSelection = () => {
    setCurrentStep("select-table");
  };

  const handleBack = () => {
    if (currentStep === "select-table" && !isEntireOrderTransfer) {
      setCurrentStep("select-items");
      setSelectedTargetTable(null);
    } else {
      onBack();
    }
  };

  const handleTableSelect = (selectedTable: string) => {
    setSelectedTargetTable(selectedTable);
  };

  const handleConfirmTableTransfer = () => {
    if (!selectedTargetTable) return;
    const targetTableOrders = getOrdersByTable(selectedTargetTable).filter(
      o => o.status !== "PAID" && o.status !== "COMPLETED" && o.id !== currentOrder.id
    );
    if (targetTableOrders.length > 0) {
      setShowTicketSelection(true);
      setSelectedTicketOrderId(null);
    } else {
      setShowTableConfirmDialog(true);
    }
  };

  // Execute transfer
  const executeTransfer = (ticketId?: string | null) => {
    if (!selectedTargetTable) return;
    setShowTableConfirmDialog(false);
    setShowTicketSelection(false);

    const isEntire = isEntireOrderTransfer || selectedItems.length === currentOrder.items.length;
    const fromLabel = currentOrder.table !== "--" ? currentOrder.table : `Order #${currentOrder.id}`;

    setOrders(prev => {
      if (isEntire) {
        return prev.map(o => o.id === currentOrder.id ? { ...o, table: selectedTargetTable } : o);
      } else {
        const remainingItems = currentOrder.items.filter((_, i) => !selectedItems.includes(i));
        const transferredItems = selectedItems.map(i => ({
          ...currentOrder.items[i],
          qty: itemQuantities[i] || currentOrder.items[i].qty
        }));
        const newSubtotal = remainingItems.reduce((s, item) => s + item.price * item.qty, 0);
        const ratio = currentOrder.subtotal > 0 ? newSubtotal / currentOrder.subtotal : 0;

        let updated = prev.map(o => {
          if (o.id === currentOrder.id) {
            return {
              ...o,
              items: remainingItems,
              subtotal: +newSubtotal.toFixed(2),
              discount: +(currentOrder.discount * ratio).toFixed(2),
              serviceCharge: +(currentOrder.serviceCharge * ratio).toFixed(2),
              tax: +(currentOrder.tax * ratio).toFixed(2),
              tip: +(currentOrder.tip * ratio).toFixed(2),
              total: +(newSubtotal + (currentOrder.serviceCharge * ratio) + (currentOrder.tax * ratio) - (currentOrder.discount * ratio) + (currentOrder.tip * ratio)).toFixed(2),
            };
          }
          return o;
        });

        const targetId = ticketId || selectedTicketOrderId;
        if (targetId && targetId !== '__new__') {
          updated = updated.map(o => {
            if (o.id === targetId) {
              const newItems = [...o.items, ...transferredItems];
              const newSub = newItems.reduce((s, item) => s + item.price * item.qty, 0);
              return {
                ...o,
                items: newItems,
                subtotal: +newSub.toFixed(2),
                total: +(newSub + o.serviceCharge + o.tax - o.discount + o.tip).toFixed(2),
              };
            }
            return o;
          });
        }
        return updated;
      }
    });

    toast.success(
      `${isEntire ? 'Order' : 'Items'} transferred from ${fromLabel} to ${formatTableName(selectedTargetTable)}`,
      { description: isEntire ? 'Entire order has been moved successfully.' : `${selectedItems.length} item(s) transferred successfully.` }
    );

    setIsSuccessDialogOpen(true);
  };

  // ===== MOBILE SOURCE ORDER CARD =====
  const MobileSourceOrderCard = () => (
    <div className="rounded-xl border border-white/20 overflow-hidden" style={{ backgroundColor: '#1B1C20' }}>
      <div className="flex items-stretch w-full">
        <div className="flex-shrink-0 px-2 py-2 flex items-center md:hidden">
          <div className="relative w-10 h-12 bg-neutral-800 rounded-lg flex flex-col items-center justify-center border border-neutral-600">
            <span className="text-lg font-bold text-white">{currentOrder.id}</span>
            <span className="text-[9px] text-gray-500">000</span>
          </div>
        </div>
        <div className="flex-1 min-w-0 py-2 pr-2 md:hidden">
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-white font-medium text-sm">{currentOrder.name} · {formatTableName(currentOrder.table)} · {currentOrder.revenueCenter}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm" style={{ color: '#B5B6BB' }}>{currentOrder.server}</span>
                <span className={`text-sm font-medium ${getStatusColor(currentOrder.status)}`}>{currentOrder.status}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-xs" style={{ color: '#B5B6BB' }}>
                <img src={dineInIcon} alt="Dine In" className="w-3 h-3 object-contain opacity-60" />
                <span>Party of {currentOrder.partySize}, {currentOrder.time}</span>
                <span className="text-gray-500">|</span>
                <span>{currentOrder.timer}</span>
              </div>
              <span className="text-white font-semibold text-sm">{formatPrice(currentOrder.total)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: '#B5B6BB' }}>Un Paid</span>
              <span className="text-white text-sm">$0.00</span>
            </div>
          </div>
        </div>
        {/* Desktop card layout */}
        <div className="hidden md:flex flex-1 items-stretch gap-3 p-3">
          <div className="flex-shrink-0 flex flex-col items-center justify-center w-14 rounded-lg border border-white/20 py-2 gap-1" style={{ background: '#1A1A1A' }}>
            <span className="text-lg font-bold text-white">{currentOrder.id}</span>
            <span className="text-xs text-white/40">000</span>
          </div>
          <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
            <div className="flex items-center text-xs md:text-sm">
              <div className="w-[45%] text-left">
                <span className="text-white font-medium truncate">{currentOrder.name} · {formatTableName(currentOrder.table)}</span>
              </div>
              <div className="w-[35%] text-left pl-4">
                <span className="text-white/60 truncate">{currentOrder.server}</span>
              </div>
              <div className="w-[20%] text-right">
                <span className={`font-semibold uppercase ${getStatusColor(currentOrder.status)}`}>{currentOrder.status}</span>
              </div>
            </div>
            <div className="flex items-center text-xs md:text-sm">
              <div className="w-[45%] text-left flex items-center gap-1 text-white/60 whitespace-nowrap">
                <img src={dineInIcon} alt="Dine In" className="w-3 h-3 md:w-4 md:h-4 object-contain opacity-60" />
                <span>Party of {currentOrder.partySize}, {currentOrder.time}</span>
                <span className="text-white/40">|</span>
                <span>{currentOrder.timer}</span>
              </div>
              <div className="w-[35%]"></div>
              <div className="w-[20%] text-right">
                <span className="text-white font-semibold">{formatPrice(currentOrder.total)}</span>
              </div>
            </div>
            <div className="flex items-center text-xs md:text-sm">
              <div className="w-[45%] text-left">
                <span className="text-white/60 truncate">{currentOrder.revenueCenter}</span>
              </div>
              <div className="w-[35%] text-left pl-4">
                <span className="text-white/60 truncate">Un Paid</span>
              </div>
              <div className="w-[20%] text-right">
                <span className="text-white">$0.00</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // ===== DESKTOP CURRENT ORDER CARD =====
  const DesktopCurrentOrderCard = () => (
    <div className="rounded-xl border border-white overflow-hidden" style={{ backgroundColor: '#1B1C20' }}>
      <div className="flex items-stretch w-full">
        <div className="flex-1 flex items-stretch gap-2 md:gap-3 p-2 md:p-3">
          <div className="flex-shrink-0 flex flex-col items-center justify-center w-12 md:w-14 rounded-lg border border-white/20 py-1.5 md:py-2 gap-0.5 md:gap-1" style={{ background: '#1A1A1A' }}>
            <span className="text-base md:text-lg font-bold text-white">{currentOrder.id}</span>
            <span className="text-[10px] md:text-xs text-white/40">000</span>
          </div>
          <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5 md:py-1">
            <div className="flex items-center text-xs md:text-sm">
              <div className="flex items-center gap-1 md:gap-2 w-[170px] md:w-[220px] flex-shrink-0">
                <span className="text-white font-medium truncate">{currentOrder.name}</span>
                <span className="text-white/60">·</span>
                <span className="text-white font-medium">{formatTableName(currentOrder.table)}</span>
              </div>
              <div className="flex-1">
                <span className="text-white/60 truncate">{currentOrder.server}</span>
              </div>
              <span className={`font-semibold uppercase flex-shrink-0 ${getStatusColor(currentOrder.status)}`}>{currentOrder.status}</span>
            </div>
            <div className="flex items-center text-xs md:text-sm">
              <div className="flex items-center gap-1 text-white/60 w-[170px] md:w-[220px] flex-shrink-0">
                <img src={dineInIcon} alt="Dine In" className="w-3 h-3 md:w-4 md:h-4 object-contain opacity-60" />
                <span className="truncate">Party of {currentOrder.partySize}, {currentOrder.time}</span>
                <span className="text-white/40">|</span>
                <span>{currentOrder.timer}</span>
              </div>
              <div className="flex-1"></div>
              <span className="text-white font-semibold flex-shrink-0">{formatPrice(currentOrder.total)}</span>
            </div>
            <div className="flex items-center text-xs md:text-sm">
              <span className="text-white font-medium w-[170px] md:w-[220px] flex-shrink-0 truncate">{currentOrder.revenueCenter}</span>
              <div className="flex-1">
                <span className="text-white/60 truncate">Un Paid</span>
              </div>
              <span className="text-white flex-shrink-0">$0.00</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // ===== ORDER DETAILS PANEL (Right side - Desktop) =====
  const OrderDetailsPanel = () => (
    <div className="w-[345px] flex flex-col mb-2 mr-2">
      {/* Guest Header */}
      <div className="px-2 py-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-white font-medium">{currentOrder.name}</span>
          <div className="flex items-center gap-3 text-white/50 text-sm">
            <div className="flex items-center gap-1">
              <Phone className="w-3 h-3" />
              <span>{currentOrder.phone || "(415) 123-4567"}</span>
            </div>
            <div className="flex items-center gap-1">
              <span>⚡</span>
              <span>{currentOrder.time}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-1.5 bg-neutral-700 text-white text-xs rounded-full hover:bg-neutral-600 transition-colors">Add Item</button>
          <button className="px-3 py-1.5 bg-neutral-700 text-white text-xs rounded-full hover:bg-neutral-600 transition-colors">Discount</button>
          <button className="px-3 py-1.5 bg-neutral-700 text-white text-xs rounded-full hover:bg-neutral-600 transition-colors">Receipt</button>
          <button className="px-3 py-1.5 bg-neutral-700 text-white text-xs rounded-full hover:bg-neutral-600 transition-colors">Cash Register</button>
        </div>
      </div>

      {/* Main Panel Box */}
      <div className="flex-1 flex flex-col rounded-[10px] overflow-hidden" style={{ background: "#7575754D", boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)" }}>
        {/* Table Order Header - Row 1 */}
        <div className="flex items-center justify-between px-2 py-2 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <span className="bg-neutral-700 border border-neutral-600 px-2 py-1 rounded text-xs font-medium text-white">
              {formatTableName(currentOrder.table).toUpperCase()}
            </span>
            <Users className="w-4 h-4 text-neutral-400" />
            <span className="text-neutral-400 text-xs">{currentOrder.items.length}</span>
            <span className="font-bold text-white text-sm">{currentOrder.id}</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <img src={runnerIcon} alt="Server" className="w-4 h-4 opacity-80" />
            <span className="text-neutral-400">{currentOrder.server}</span>
          </div>
        </div>

        {/* Table Order Header - Row 2: Seat buttons */}
        <div className="flex items-center gap-1.5 px-2 py-1.5 border-b border-sidebar-border">
          <button className="p-1 bg-neutral-700 rounded hover:bg-neutral-600 transition-colors">
            <img src={chairWhiteIcon} alt="Chair" className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setSelectedSeats([1, 2, 3, 4])}
            className={`p-1 rounded transition-colors ${selectedSeats.length === 4 ? 'bg-white' : 'bg-neutral-700 hover:bg-neutral-600'}`}
          >
            <Share2 className={`w-3.5 h-3.5 ${selectedSeats.length === 4 ? 'text-black' : 'text-white'}`} />
          </button>
          {[1, 2, 3, 4].map(seat => (
            <button
              key={seat}
              onClick={() => setSelectedSeats(prev => prev.includes(seat) ? prev.filter(s => s !== seat) : [...prev, seat])}
              className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold transition-colors ${selectedSeats.includes(seat) ? 'bg-white text-black' : 'bg-neutral-600 text-white hover:bg-neutral-500'}`}
            >
              {seat}
            </button>
          ))}
        </div>

        {/* Order Notes */}
        <div className="px-2 py-1.5 border-b border-sidebar-border flex-shrink-0">
          <OrderNotesAutocomplete value={orderNotes} onChange={setOrderNotes} placeholder="Order notes and Allergies" />
        </div>

        {/* Transfer info banner */}
        {selectedTargetTable && currentStep === 'select-table' && (
          <div className="px-3 py-1.5 border-b border-sidebar-border flex-shrink-0 flex items-center gap-2">
            <img src={tableTargetIcon} alt="Transfer" className="w-4 h-4 opacity-70" />
            <span className="text-xs font-medium" style={{ color: '#8AC4FF' }}>
              Transferring to {formatTableName(selectedTargetTable)}
            </span>
          </div>
        )}

        {/* Order Items */}
        <ScrollArea className="flex-1 min-h-0 px-2">
          <div className="py-1 space-y-1">
            {currentOrder.items.map((item, index) => {
              const isSelectedForTransfer = selectedItems.includes(index) && currentStep === 'select-table';
              return (
                <SwipeableCartItem
                  key={`${currentOrder.id}-${index}`}
                  onDelete={() => {}}
                  itemOrderType="Dine In"
                  onOrderTypeChange={() => {}}
                  isOpen={activeSwipedItemId === `${currentOrder.id}-${index}`}
                  onSwipeStart={() => setActiveSwipedItemId(`${currentOrder.id}-${index}`)}
                >
                  <div
                    className={`p-2 border rounded-md cursor-pointer ${isSelectedForTransfer ? 'border-[#3B6A9E]' : 'border-sidebar-border'}`}
                    style={{
                      background: isSelectedForTransfer
                        ? 'linear-gradient(180deg, #1E3A5F 0%, #2A4A6F 100%)'
                        : 'linear-gradient(180deg, #4D4D4D 0%, #616161 100%)'
                    }}
                  >
                    <div className="flex flex-col">
                      <div className="flex items-start gap-2">
                        <span className={`w-6 h-6 rounded border text-white text-xs font-medium flex items-center justify-center flex-shrink-0 ${isSelectedForTransfer ? 'bg-[#3B6A9E] border-[#5A8ABF]' : 'bg-neutral-700 border-neutral-600'}`}>
                          {item.qty}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-foreground">{item.name}</span>
                            <span className="text-sm font-medium text-foreground">{formatPrice(item.price * item.qty)}</span>
                          </div>
                          {item.modifiers.length > 0 && (
                            <div className="mt-1 relative">
                              {item.modifiers.map((mod, idx) => {
                                const isAddOn = mod.startsWith("W/") || mod.startsWith("Add");
                                const isRemoval = mod.startsWith("No ") || mod.startsWith("-");
                                const isLastItem = idx === item.modifiers.length - 1;
                                return (
                                  <div key={idx} className="relative flex items-center text-xs py-[3px]">
                                    {!isLastItem && <div className="absolute left-0 top-1/2 w-px bg-white" style={{ height: 'calc(100% + 3px)' }} />}
                                    <div className="absolute left-0 top-0 h-1/2 w-px bg-white" />
                                    <div className="absolute left-0 top-1/2 w-3 h-px bg-white" />
                                    <div className="flex items-center gap-2 ml-5">
                                      <span className="text-white">{isAddOn ? '+' : isRemoval ? '-' : '•'}</span>
                                      <span className={`text-white ${isRemoval ? 'line-through' : ''}`}>{mod}</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          {item.seats.length > 0 && (
                            <div className="mt-1.5 flex items-center gap-1.5">
                              <img src={chairWhiteIcon} alt="Seats" className="w-4 h-4 opacity-70" />
                              {item.seats.length === 4 ? (
                                <span className="w-5 h-5 rounded bg-neutral-700 text-white flex items-center justify-center">
                                  <Share2 className="w-3 h-3" />
                                </span>
                              ) : (
                                item.seats.map(seat => (
                                  <span key={seat} className="w-5 h-5 rounded bg-neutral-700 text-white text-[10px] font-medium flex items-center justify-center">{seat}</span>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </SwipeableCartItem>
              );
            })}
          </div>
          <ScrollBar orientation="vertical" />
        </ScrollArea>

        {/* Order Summary */}
        <div className="p-2 border-t border-sidebar-border flex-shrink-0">
          <div className="text-xs rounded px-2 py-1.5 space-y-0.5" style={{ background: '#7575754D', boxShadow: 'inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)' }}>
            <div className="flex justify-between gap-3">
              <span className="text-foreground">Sub Total: <span className="font-medium">{formatPrice(currentOrder.subtotal)}</span></span>
              <span className="text-white">Discount: <span className="font-medium">{formatPrice(currentOrder.discount)}</span></span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-foreground">Service Charge: <span className="font-medium text-primary">+{formatPrice(currentOrder.serviceCharge)}</span></span>
              <span className="text-foreground">Tax: <span className="font-medium">{formatPrice(currentOrder.tax)}</span></span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="px-2 py-2 flex items-center gap-3 flex-shrink-0">
            <button className="w-8 h-8 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center flex-shrink-0">
              <img src={clearIcon} alt="Clear" className="w-3 h-3" />
            </button>
            <button className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#C9C9C9' }}>
              <img src={saveIcon} alt="Save" className="w-4 h-4" />
            </button>
            <button className="flex-1 h-8 rounded-full flex items-center justify-center gap-1.5" style={{ background: 'linear-gradient(180deg, #FF9E65 0%, #FF5E00 100%)' }}>
              <img src={fireIcon} alt="Fire" className="w-4 h-4" />
              <span className="text-white font-semibold text-sm">FIRE</span>
            </button>
            <button className="flex-1 h-8 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)' }}>
              <span className="text-black font-semibold text-xs">CHARGE {formatPrice(currentOrder.total)}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // ===== TABLE GRID COMPONENT =====
  const TableGrid = () => (
    <ScrollArea className="flex-1 px-3">
      <div className="grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 pb-3 pt-2">
        {availableTables.map((table) => {
          const config = statusConfig[table.status] || statusConfig["Available"];
          const dotColor = getSeatDotColor(table.status);
          const isSelected = selectedTargetTable === table.id;
          const isCurrentTable = table.id === currentOrder.table;

          return (
            <div
              key={table.id}
              onClick={() => !isCurrentTable && handleTableSelect(table.id)}
              className={`bg-neutral-900 rounded-xl p-3 flex flex-col items-center cursor-pointer transition-all border-2 ${
                isCurrentTable
                  ? "opacity-40 cursor-not-allowed border-neutral-800"
                  : isSelected
                    ? "border-orange-500 ring-2 ring-orange-500/30"
                    : "border-neutral-800 hover:bg-neutral-800"
              }`}
            >
              <span className="text-2xl font-bold text-white mb-1">{table.id}</span>
              <span className="text-gray-400 text-sm mb-2">{table.seats} Seats</span>
              <div className="flex gap-1 mb-2">
                {Array.from({ length: Math.min(table.seats, 6) }).map((_, i) => (
                  <div key={i} className={`w-2 h-2 flex-shrink-0 rounded-full ${dotColor}`} />
                ))}
                {table.seats > 6 && <span className="text-xs text-gray-500">+{table.seats - 6}</span>}
              </div>
              <div className="mt-auto w-full">
                <div className="flex justify-end mb-1 min-h-[1rem] px-1">
                  {table.time && <span className="text-gray-500 text-xs">{table.time}</span>}
                </div>
                <div className={`w-full text-center py-1 rounded-md border border-neutral-600 ${config.bgColor}`}>
                  <span className={`text-xs font-medium ${config.color}`}>
                    {isCurrentTable ? "Current" : table.status}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <ScrollBar orientation="vertical" />
    </ScrollArea>
  );

  // ===== DESKTOP LAYOUT =====
  const DesktopLayout = () => (
    <div className="flex h-full w-full">
      {/* Left Panel */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="relative flex items-center p-2 border-b border-neutral-700/50">
          <div className="flex items-center gap-3">
            <button onClick={() => {
              if (currentStep === "select-table" && !isEntireOrderTransfer) {
                setCurrentStep("select-items");
                setSelectedTargetTable(null);
              } else {
                onBack();
              }
            }} className="p-2 rounded-full hover:opacity-80 transition-opacity" style={{
              background: "#7575754D",
              boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)"
            }}>
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <h1 className="text-white text-lg font-semibold">
              {isDirectToOrder ? "Transfer to Order" : currentStep === "select-items" ? "Transfer Check" : "Select Table"}
            </h1>
          </div>
        </div>

        {/* Step 1: Select Items */}
        {currentStep === "select-items" && (
          <>
            <div className="px-3 py-3">
              <DesktopCurrentOrderCard />
            </div>

            <div className="px-3 pb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <p className="text-white/80 text-sm font-medium">Select Items</p>
                <div className="flex items-center gap-1 text-white/40 text-xs">
                  <Info className="w-3 h-3" />
                  <span>Item notes are included</span>
                </div>
              </div>
              <button onClick={handleSelectAll} className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${selectAll ? "bg-white text-black" : "bg-white/10 text-white"}`}>
                {selectAll ? "Deselect All" : "Select All"}
              </button>
            </div>

            <ScrollArea className="flex-1 px-3">
              <div className="space-y-2 pb-3">
                {currentOrder.items.map((item, index) => {
                  const isSelected = selectedItems.includes(index);
                  const selectedQty = itemQuantities[index] || item.qty;
                  return (
                    <div
                      key={index}
                      className={`p-3 rounded-xl border transition-all cursor-pointer ${isSelected ? "border-orange-500 bg-orange-500/10" : "border-white/10 bg-white/5"}`}
                      onClick={() => handleItemSelect(index)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${isSelected ? "border-orange-500 bg-orange-500" : "border-white/40"}`}>
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 bg-white rounded flex items-center justify-center text-black text-xs font-bold">{item.qty}</span>
                              <span className="text-white text-sm font-medium">{item.name}</span>
                            </div>
                            <span className="text-white text-sm font-medium">${(item.price * item.qty).toFixed(2)}</span>
                          </div>
                          {item.modifiers.length > 0 && (
                            <div className="mt-1 ml-8 text-white/50 text-xs space-y-0.5">
                              {item.modifiers.map((mod, i) => <div key={i}>{mod}</div>)}
                            </div>
                          )}
                          {isSelected && (
                            <div className="flex items-center justify-between mt-2 ml-8">
                              <div className="flex items-center gap-1 text-white/50 text-xs">
                                <img src={seatIcon} alt="Seat" className="w-3 h-3 opacity-50" />
                                <span>{item.seats.length > 0 ? item.seats.join(', ') : '-'}</span>
                              </div>
                              <select
                                value={selectedQty}
                                onChange={e => { e.stopPropagation(); handleQuantityChange(index, parseInt(e.target.value)); }}
                                onClick={e => e.stopPropagation()}
                                className="bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-white text-sm min-w-[70px] focus:outline-none focus:border-orange-500"
                              >
                                {Array.from({ length: item.qty }, (_, i) => i + 1).map(num => (
                                  <option key={num} value={num} className="bg-gray-800 text-white">{num}</option>
                                ))}
                              </select>
                            </div>
                          )}
                          {!isSelected && (
                            <div className="flex items-center gap-2 mt-2 ml-8">
                              {item.seats.length > 0 && (
                                <div className="flex items-center gap-1">
                                  <img src={seatIcon} alt="Seat" className="w-3 h-3 opacity-50" />
                                  {item.seats.map(seat => (
                                    <span key={seat} className="w-5 h-5 bg-white/10 rounded text-white text-xs flex items-center justify-center">{seat}</span>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <ScrollBar orientation="vertical" />
            </ScrollArea>

            {selectedItems.length > 0 && (
              <div className="p-3 border-t border-white/10 flex gap-3">
                <button onClick={() => { setSelectedTransferOrderId(null); setShowTransferToOrder(true); }} className="flex-1 py-2 rounded-full text-white font-medium text-sm bg-neutral-800">TRANSFER TO ORDER</button>
                <button onClick={() => setCurrentStep("select-table")} className="flex-1 py-2 rounded-full text-black font-medium text-sm" style={{ background: "linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)" }}>
                  TRANSFER TO TABLE
                </button>
              </div>
            )}
          </>
        )}

        {/* Step 2: Select Table */}
        {currentStep === "select-table" && (
          <>
            <div className="px-3 py-3">
              <div className="px-3 py-2 rounded-lg bg-neutral-800 border border-white/10">
                <p className="text-white/60 text-xs mb-1">Transferring from</p>
                <div className="flex items-center justify-between">
                  <span className="text-white font-medium">Order #{currentOrder.id} · {formatTableName(currentOrder.table)}</span>
                  <span className="text-white/60 text-sm">{isEntireOrderTransfer ? currentOrder.items.length : selectedItems.length} item{(isEntireOrderTransfer ? currentOrder.items.length : selectedItems.length) > 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>

            <TableGrid />

            <div className="p-3 border-t border-white/10 flex gap-3">
              <button onClick={() => { setSelectedTransferOrderId(null); setShowTransferToOrder(true); }} className="flex-1 py-2 rounded-full text-white font-medium text-sm bg-neutral-800">TRANSFER TO ORDER</button>
              <button
                onClick={handleConfirmTableTransfer}
                disabled={!selectedTargetTable}
                className={`flex-1 py-2 rounded-full font-medium text-sm ${selectedTargetTable ? "text-black" : "text-white/40 bg-white/10"}`}
                style={selectedTargetTable ? { background: "linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)" } : undefined}
              >
                CONFIRM TRANSFER TO {selectedTargetTable ? formatTableName(selectedTargetTable).toUpperCase() : 'TABLE'}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Right Panel - only when not embedded */}
      {!embedded && <OrderDetailsPanel />}
    </div>
  );

  // ===== MOBILE SELECT ITEMS VIEW =====
  const MobileSelectItemsView = () => (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      <div className="relative flex items-center justify-between p-4">
        <button onClick={onBack} className="w-10 h-10 rounded-full flex items-center justify-center z-10" style={{ background: "#7575754D", boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)" }}>
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        <h1 className="absolute left-1/2 -translate-x-1/2 text-white text-xl font-medium">Transfer Check</h1>
        <div className="w-10" />
      </div>

      <div className="px-4 pb-3">
        <MobileSourceOrderCard />
      </div>

      <div className="px-4 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-white/80 text-sm font-medium">Select Items</p>
          <Info className="w-3.5 h-3.5 text-white/40" />
        </div>
        <button onClick={handleSelectAll} className="text-white/60 text-sm font-medium hover:text-white transition-colors">
          {selectAll ? "Deselect All" : "Select All"}
        </button>
      </div>

      {currentOrder.notes && (
        <div className="mx-4 mb-3 px-3 py-2 rounded-lg bg-neutral-800/80 border border-white/10">
          <div className="flex items-start gap-2">
            <span className="text-white/60 text-sm">📋</span>
            <span className="text-white/70 text-sm">{currentOrder.notes}</span>
          </div>
        </div>
      )}

      <ScrollArea className="flex-1 px-4">
        <div className="space-y-2 pb-24">
          {currentOrder.items.map((item, index) => {
            const isSelected = selectedItems.includes(index);
            const selectedQty = itemQuantities[index] || item.qty;
            return (
              <div
                key={index}
                className={`rounded-xl border transition-all cursor-pointer overflow-hidden ${isSelected ? "border-orange-500 bg-orange-500/5" : "border-white/10 bg-white/[0.02]"}`}
                onClick={() => handleItemSelect(index)}
              >
                <div className="p-3">
                  <div className="flex items-start gap-3">
                    <div className={`w-7 h-7 rounded-md flex items-center justify-center text-sm font-bold ${isSelected ? "bg-orange-500 text-white" : "bg-neutral-700 text-white"}`}>
                      {isSelected ? selectedQty : item.qty}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-white text-sm font-medium flex-1">{item.name}</span>
                        <div className="flex items-center gap-2">
                          {isSelected && item.qty > 1 && (
                            <div className="relative" onClick={e => e.stopPropagation()}>
                              <select
                                value={selectedQty}
                                onChange={e => { e.stopPropagation(); handleQuantityChange(index, parseInt(e.target.value)); }}
                                className="appearance-none bg-neutral-600 text-white text-sm font-medium rounded-full px-3 py-1 pr-6 cursor-pointer focus:outline-none"
                              >
                                {Array.from({ length: item.qty }, (_, i) => i + 1).map(qty => (
                                  <option key={qty} value={qty}>{qty}</option>
                                ))}
                              </select>
                              <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white pointer-events-none" />
                            </div>
                          )}
                          <span className="text-white text-sm font-medium">${(item.price * item.qty).toFixed(2)}</span>
                        </div>
                      </div>
                      {item.modifiers.length > 0 && (
                        <div className="mt-2 ml-0 space-y-0.5">
                          {item.modifiers.map((mod, i) => (
                            <div key={i} className="flex items-center justify-between text-xs">
                              <span className="text-white/50">· {mod}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        {item.seats.length > 0 && (
                          <div className="flex items-center gap-1">
                            <img src={seatIcon} alt="Seat" className="w-3.5 h-3.5 opacity-50" />
                            <span className="text-white/50 text-xs">{item.seats.join(', ')}</span>
                          </div>
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
    </div>
  );

  // ===== MOBILE TABLE SELECTION VIEW =====
  const MobileTableSelectionView = () => (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      <div className="relative flex items-center justify-between p-4">
        <button onClick={handleBack} className="w-10 h-10 rounded-full flex items-center justify-center z-10" style={{ background: "#7575754D", boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)" }}>
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        <h1 className="absolute left-1/2 -translate-x-1/2 text-white text-xl font-medium">Select Table</h1>
        <div className="w-10" />
      </div>

      <div className="px-4 pb-3">
        <MobileSourceOrderCard />
      </div>

      <TableGrid />
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-black">
      {/* Desktop Layout - show at md when embedded */}
      <div className={`hidden ${embedded ? 'md:flex' : 'lg:flex'} h-full w-full`}>
        <DesktopLayout />
      </div>

      {/* Mobile/Tablet Layout */}
      <div className={`flex flex-col flex-1 min-h-0 ${embedded ? 'md:hidden' : 'lg:hidden'} overflow-hidden`}>
        {currentStep === "select-items" && <MobileSelectItemsView />}
        {currentStep === "select-table" && <MobileTableSelectionView />}
      </div>

      {/* Select Check Button - Fixed above bottom nav (Mobile) */}
      {currentStep === "select-items" && selectedItems.length > 0 && (
        <div className="fixed bottom-14 left-0 right-0 px-4 py-2 bg-black lg:hidden flex gap-3">
          <button onClick={() => { setSelectedTransferOrderId(null); setShowTransferToOrder(true); }} className="flex-1 py-2 rounded-full text-white font-medium text-sm bg-neutral-800">TRANSFER TO ORDER</button>
          <button onClick={handleProceedToTargetSelection} className="flex-1 py-2 rounded-full text-black font-medium text-sm" style={{ background: "linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)" }}>
            TRANSFER TO TABLE
          </button>
        </div>
      )}

      {/* Table Selection CTAs - Fixed above bottom nav (Mobile) */}
      {currentStep === "select-table" && (
        <div className="fixed bottom-14 left-0 right-0 px-4 py-2 bg-black lg:hidden flex gap-3">
          <button onClick={() => { setSelectedTransferOrderId(null); setShowTransferToOrder(true); }} className="flex-1 py-2 rounded-full text-white font-medium text-sm bg-neutral-800">TRANSFER TO ORDER</button>
          <button
            onClick={handleConfirmTableTransfer}
            disabled={!selectedTargetTable}
            className={`flex-1 py-2 rounded-full font-medium text-sm ${selectedTargetTable ? "text-black" : "text-white/40 bg-white/10"}`}
            style={selectedTargetTable ? { background: "linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)" } : undefined}
          >
            TRANSFER TO TABLE
          </button>
        </div>
      )}

      {/* Table Transfer Confirmation Dialog */}
      <AlertDialog open={showTableConfirmDialog} onOpenChange={setShowTableConfirmDialog}>
        <AlertDialogContent className="bg-neutral-900 border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              {isEntireOrderTransfer ? 'Transfer Entire Order?' : 'Transfer Items?'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              {isEntireOrderTransfer
                ? <>Are you sure you want to transfer this entire order to {formatTableName(selectedTargetTable || '')}?<br /><br />All items, modifiers, notes, discounts, and charges will be moved together.</>
                : <>Are you sure you want to transfer {selectedItems.length} item{selectedItems.length > 1 ? 's' : ''} to {formatTableName(selectedTargetTable || '')}?</>
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-neutral-800 text-white border-none hover:bg-neutral-700">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => executeTransfer()} className="text-black" style={{ background: "linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)" }}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Ticket Selection Dialog - for occupied tables */}
      <Dialog open={showTicketSelection} onOpenChange={setShowTicketSelection}>
        <DialogContent className="bg-neutral-900 border-white/10 p-0 max-w-lg overflow-hidden">
          <div className="p-4 border-b border-white/10">
            <h2 className="text-white text-lg font-semibold">Transfer to {formatTableName(selectedTargetTable || '')}</h2>
            <p className="text-white/50 text-sm mt-1">Select an active ticket or create a new order</p>
          </div>

          <ScrollArea className="max-h-[60vh]">
            <div className="p-4 space-y-3">
              {/* Transfer to New Order - first */}
              <button
                onClick={() => setSelectedTicketOrderId('__new__')}
                className={`w-full rounded-xl border overflow-hidden text-left transition-all ${selectedTicketOrderId === '__new__' ? 'border-white ring-1 ring-white/30' : 'border-white/[0.25] hover:border-white/40'}`}
                style={{ backgroundColor: '#1B1C20' }}
              >
                <div className="flex items-center gap-3 p-4">
                  <div className="flex-shrink-0 w-12 h-14 rounded-lg flex items-center justify-center border border-dashed border-white/30" style={{ background: '#1A1A1A' }}>
                    <span className="text-2xl text-white/60">+</span>
                  </div>
                  <div className="flex-1">
                    <span className="text-white font-medium text-sm">Transfer to New Order</span>
                    <p className="text-white/40 text-xs mt-0.5">Start a new ticket with transferred items</p>
                  </div>
                </div>
              </button>

              {/* Active tickets on the target table */}
              {selectedTargetTable && getOrdersByTable(selectedTargetTable)
                .filter(o => o.status !== "PAID" && o.status !== "COMPLETED" && o.id !== currentOrder.id)
                .map((order) => {
                  const isSelected = selectedTicketOrderId === order.id;
                  return (
                    <button
                      key={order.id}
                      onClick={() => setSelectedTicketOrderId(order.id)}
                      className={`w-full rounded-xl border overflow-hidden text-left transition-all ${isSelected ? 'border-white ring-1 ring-white/30' : 'border-white/[0.25] hover:border-white/40'}`}
                      style={{ backgroundColor: '#1B1C20' }}
                    >
                      <div className="p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-white font-medium text-sm">#{order.id} · {order.name}</span>
                          <span className="text-white font-bold text-sm">{formatPrice(order.total)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-white/50 text-xs mb-2">
                          <span>{order.orderType}</span>
                          <span>·</span>
                          <span>{order.items.length} items</span>
                        </div>
                        <div className="space-y-1">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between py-1">
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <span className="w-5 h-5 rounded bg-neutral-700 text-white text-[10px] font-medium flex items-center justify-center flex-shrink-0">{item.qty}</span>
                                <span className="text-white text-xs truncate">{item.name}</span>
                              </div>
                              <span className="text-white/70 text-xs font-medium flex-shrink-0 ml-2">{formatPrice(item.price * item.qty)}</span>
                            </div>
                          ))}
                        </div>
                        <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between">
                          <span className="text-white/50 text-xs">{order.items.length} items</span>
                          <span className="text-white font-semibold text-sm">{formatPrice(order.total)}</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
            </div>
          </ScrollArea>

          <div className="p-4 border-t border-white/10 flex gap-3">
            <button onClick={() => setShowTicketSelection(false)} className="flex-1 py-2.5 rounded-full font-medium text-sm bg-neutral-800 text-white hover:bg-neutral-700">Cancel</button>
            <button
              onClick={() => {
                if (selectedTicketOrderId === '__new__') {
                  // Navigate to new order with transferred items
                  setShowTicketSelection(false);
                  const transferItems = isEntireOrderTransfer
                    ? currentOrder.items
                    : selectedItems.map(index => {
                        const item = currentOrder.items[index];
                        const qty = itemQuantities[index] || item.qty;
                        return { ...item, qty };
                      });
                  const itemsData = transferItems.map(item => ({
                    name: item.name,
                    price: item.price,
                    qty: item.qty,
                    modifiers: item.modifiers || [],
                  }));
                  toast.success('Items transferred to new order');
                  setTimeout(() => {
                    const params = new URLSearchParams({
                      mode: 'transferNew',
                      transferItems: JSON.stringify(itemsData),
                      transferFrom: currentOrder.id,
                      transferFromTable: currentOrder.table,
                    });
                    navigate(`/orders?${params.toString()}`);
                  }, 800);
                } else if (selectedTicketOrderId) {
                  executeTransfer(selectedTicketOrderId);
                }
              }}
              disabled={!selectedTicketOrderId}
              className={`flex-1 py-2.5 rounded-full font-medium text-sm ${selectedTicketOrderId ? 'text-black' : 'text-black/50 opacity-50'}`}
              style={selectedTicketOrderId ? { background: "linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)" } : { background: '#555' }}
            >
              Confirm Transfer
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Transfer to Order Dialog */}
      <Dialog open={showTransferToOrder} onOpenChange={setShowTransferToOrder}>
        <DialogContent className="bg-neutral-900 border-white/10 p-0 max-w-lg overflow-hidden" aria-describedby={undefined}>
          <div className="p-4 border-b border-white/10">
            <h2 className="text-white text-lg font-semibold">Transfer to Order</h2>
            <p className="text-white/50 text-sm mt-1">{isEntireOrderTransfer ? 'Select an active order to transfer' : 'Select an active order or create a new one'}</p>
          </div>

          <ScrollArea className="max-h-[60vh]">
            <div className="p-4 space-y-3">
              {/* Transfer to New Order - only for partial/item transfers */}
              {!isEntireOrderTransfer && (
                <button
                  onClick={() => setSelectedTransferOrderId('__new__')}
                  className={`w-full rounded-xl border overflow-hidden text-left transition-all ${selectedTransferOrderId === '__new__' ? 'border-white ring-1 ring-white/30' : 'border-white/[0.25] hover:border-white/40'}`}
                  style={{ backgroundColor: '#1B1C20' }}
                >
                  <div className="flex items-center gap-3 p-4">
                    <div className="flex-shrink-0 w-12 h-14 rounded-lg flex items-center justify-center border border-dashed border-white/30" style={{ background: '#1A1A1A' }}>
                      <span className="text-2xl text-white/60">+</span>
                    </div>
                    <div className="flex-1">
                      <span className="text-white font-medium text-sm">Transfer to New Order</span>
                      <p className="text-white/40 text-xs mt-0.5">Start a new ticket with transferred items</p>
                    </div>
                  </div>
                </button>
              )}
              {/* Active orders */}
              {availableTransferOrders.map((order) => {
                const isSelected = selectedTransferOrderId === order.id;
                return (
                  <button
                    key={order.id}
                    onClick={() => setSelectedTransferOrderId(order.id)}
                    className={`w-full rounded-xl border overflow-hidden text-left transition-all ${isSelected ? 'border-white ring-1 ring-white/30' : 'border-white/[0.25] hover:border-white/40'}`}
                    style={{ backgroundColor: '#1B1C20' }}
                  >
                    <div className="p-3">
                      <OrderLayoutTemplate order={ticketToTemplateData(order)} showBorder={false} />
                      <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between py-1">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <span className="w-7 h-7 rounded-md border border-white/20 text-white text-xs font-medium flex items-center justify-center flex-shrink-0">{item.qty}</span>
                              <span className="text-white text-sm truncate">{item.name}</span>
                            </div>
                            <span className="text-white/70 text-sm font-medium flex-shrink-0 ml-2">{formatPrice(item.price * item.qty)}</span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
                        <span className="text-white/50 text-sm">{order.items.length} items</span>
                        <span className="text-white font-semibold text-sm">{formatPrice(order.items.reduce((s, i) => s + i.price * i.qty, 0))}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </ScrollArea>

          <div className="p-4 border-t border-white/10 flex gap-3">
            <button onClick={() => setShowTransferToOrder(false)} className="flex-1 py-2.5 rounded-full font-medium text-sm bg-neutral-800 text-white hover:bg-neutral-700">Cancel</button>
            <button
              onClick={() => {
                if (selectedTransferOrderId) {
                  executeTransferToOrder();
                }
              }}
              disabled={!selectedTransferOrderId}
              className={`flex-1 py-2.5 rounded-full font-medium text-sm ${selectedTransferOrderId ? 'text-black' : 'text-black/50 opacity-50'}`}
              style={selectedTransferOrderId ? { background: "linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)" } : { background: '#555' }}
            >
              Confirm Transfer
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isSuccessDialogOpen} onOpenChange={(open) => {
        if (!open) {
          onTransferComplete();
        }
        setIsSuccessDialogOpen(open);
      }}>
        <DialogContent className="bg-neutral-900 border-white/10 p-0 max-w-sm rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <h2 className="text-white text-lg font-semibold">Items Transferred</h2>
            <button
              onClick={() => {
                setIsSuccessDialogOpen(false);
                onTransferComplete();
              }}
              className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>

          <div className="px-4 pb-4">
            <p className="text-white/60 text-sm mb-3">
              From <span className="text-amber-400">Order #{currentOrder.id}</span> to <span className="text-emerald-400">{formatTableName(selectedTargetTable || '')}</span>
            </p>

            <div className="bg-white/5 rounded-xl p-3 space-y-2">
              {selectedItems.map((itemIndex) => {
                const item = currentOrder.items[itemIndex];
                if (!item) return null;
                return (
                  <div key={itemIndex} className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-white/40 text-sm">{item.qty}x</span>
                      <span className="text-white text-sm">{item.name}</span>
                    </div>
                    <span className="text-white/60 text-sm">${(item.price * item.qty).toFixed(2)}</span>
                  </div>
                );
              })}
            </div>

            <p className="text-white/40 text-xs mt-3 text-center">
              {selectedItems.length} item{selectedItems.length > 1 ? 's' : ''} transferred successfully
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TicketsTransferView;
