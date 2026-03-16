import { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronDown, ArrowUpDown, ArrowDown, ArrowRightLeft, SlidersHorizontal, Search, Phone, Info, Check, Users, Share2, X } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import OrderLayoutTemplate from "@/components/OrderLayoutTemplate";
import OrderSummary from "@/components/OrderSummary";
import { getOrderStatusColor, formatPrice, formatTableName } from "@/lib/orderUtils";
import { Order, allOrders, getOrderById, getOrdersByTable, getAvailableOrdersForTransfer, calculateOrderTotals, getOrderAmount, toOrderTemplateData } from "@/data/orders";
import { OrderNotesAutocomplete } from "@/components/OrderNotesAutocomplete";
import SwipeableCartItem from "@/components/SwipeableCartItem";
import { toast } from "sonner";
import { useUnifiedOrders } from "@/contexts/UnifiedOrderContext";
import { useRestaurantTables } from "@/hooks/use-restaurant-tables";

// Import icons
import clearIcon from "@/assets/icons/clear-c.png";
import fireIcon from "@/assets/icons/fire.png";
import tableTargetIcon from "@/assets/icons/table-target.png";
import shareSeatsIcon from "@/assets/icons/share-seats.png";
import seatIcon from "@/assets/icons/seat-icon.png";
import splitIcon from "@/assets/icons/split-icon.png";
import dineInIcon from "@/assets/icons/dine-in.png";
import runnerIcon from "@/assets/icons/runner.png";
import chairWhiteIcon from "@/assets/icons/chair-white.png";
import saveIcon from "@/assets/icons/save.png";

// Table status configurations (reusing from TableOrder)
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

// Seat dot colors based on status
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

// Table type for grid display
type TableType = {
  id: string;
  seats: number;
  status: string;
  time: string;
};

// defaultTables removed - now fetched from DB via useRestaurantTables hook

const transferFilters = ["All", "Ordering", "Ordered", "Preparing"];
type TransferStep = "select-items" | "select-target" | "confirm-direction" | "select-table";
const TransferOrders = () => {
  const navigate = useNavigate();
  const { updateOrders: updateUnifiedOrders } = useUnifiedOrders();
  const {
    tableId
  } = useParams();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId");
  const transferType = searchParams.get("transferType"); // 'entire' for full order transfer
  const targetMode = searchParams.get("targetMode"); // 'order' to go directly to order selection
  const isEntireOrderTransfer = transferType === "entire";
  
  // For entire order transfer, start with table selection step
  const [step, setStep] = useState<TransferStep>(isEntireOrderTransfer ? "select-table" : "select-items");
  const [activeFilter, setActiveFilter] = useState("All");
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [itemQuantities, setItemQuantities] = useState<Record<number, number>>({});
  const [itemSeats, setItemSeats] = useState<Record<number, number[]>>({});
  const [selectAll, setSelectAll] = useState(isEntireOrderTransfer);
  const [targetOrder, setTargetOrder] = useState<Order | null>(null);
  const [fromOrder, setFromOrder] = useState<Order | null>(null);
  const [toOrder, setToOrder] = useState<Order | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<number[]>([1, 2, 3, 4]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [showTargetSheet, setShowTargetSheet] = useState(false);
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
  const [displayedOrder, setDisplayedOrder] = useState<Order | null>(null);
  const [desktopStep, setDesktopStep] = useState<"select-items" | "select-table">(isEntireOrderTransfer ? "select-table" : "select-items");
  const [orderNotes, setOrderNotes] = useState("");
  const [activeSwipedItemId, setActiveSwipedItemId] = useState<string | null>(null);
  const [isEntireOrderConfirmOpen, setIsEntireOrderConfirmOpen] = useState(false);
  
  // New state for table selection
  const [selectedTargetTable, setSelectedTargetTable] = useState<string | null>(null);
  const [showTableConfirmDialog, setShowTableConfirmDialog] = useState(false);
  const [showTicketSelection, setShowTicketSelection] = useState(false);
  const [selectedTicketOrderId, setSelectedTicketOrderId] = useState<string | null>(null);
  const [showTransferToOrder, setShowTransferToOrder] = useState(targetMode === 'order');
  const [selectedTransferOrderId, setSelectedTransferOrderId] = useState<string | null>(null);

  // Get the current order being transferred from
  const currentOrder = allOrders.find(o => o.id === orderId) || allOrders[0];
  const panelOrder = displayedOrder || currentOrder;

  // Auto-select all items for entire order transfer
  useEffect(() => {
    if (isEntireOrderTransfer && currentOrder.items.length > 0 && selectedItems.length === 0) {
      const allIndexes = currentOrder.items.map((_, i) => i);
      setSelectedItems(allIndexes);
      // Set quantities for all items
      const quantities: Record<number, number> = {};
      currentOrder.items.forEach((item, i) => {
        quantities[i] = item.qty;
      });
      setItemQuantities(quantities);
    }
  }, [isEntireOrderTransfer, currentOrder.items]);

  // Get all active orders from all tables (excluding current order, completed/paid orders, and same table for entire order)
  const availableOrders = allOrders.filter(o => {
    if (o.id === currentOrder.id) return false;
    if (o.status === "PAID" || o.status === "Completed") return false;
    // For entire order transfer, exclude orders on the same table
    if (isEntireOrderTransfer && o.table === currentOrder.table) return false;
    return true;
  });
  const filteredOrders = activeFilter === "All" ? availableOrders : availableOrders.filter(o => o.status === activeFilter.toUpperCase());
  const getStatusColor = getOrderStatusColor;
  const getFilterCount = (filter: string) => {
    if (filter === "All") return availableOrders.length;
    return availableOrders.filter(o => o.status === filter.toUpperCase()).length;
  };
  const handleItemSelect = (index: number) => {
    if (selectedItems.includes(index)) {
      setSelectedItems(selectedItems.filter(i => i !== index));
      // Remove quantity when deselecting
      const newQuantities = {
        ...itemQuantities
      };
      delete newQuantities[index];
      setItemQuantities(newQuantities);
    } else {
      setSelectedItems([...selectedItems, index]);
      // Set default quantity to item's full quantity when selecting
      setItemQuantities(prev => ({
        ...prev,
        [index]: currentOrder.items[index].qty
      }));
    }
  };
  const handleQuantityChange = (index: number, qty: number) => {
    setItemQuantities(prev => ({
      ...prev,
      [index]: qty
    }));
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
    setStep("select-table");
  };
  const handleTargetSelect = (order: Order) => {
    setTargetOrder(order);
    setShowTargetSheet(false);
    setFromOrder(currentOrder);
    setToOrder(order);
    // For entire order transfer, show special confirmation dialog
    if (isEntireOrderTransfer) {
      setIsEntireOrderConfirmOpen(true);
    } else {
      setStep("confirm-direction");
    }
  };
  const handleSwapDirection = () => {
    const temp = fromOrder;
    setFromOrder(toOrder);
    setToOrder(temp);
  };
  const handleFinalConfirm = () => {
    setIsConfirmDialogOpen(false);
    setIsSuccessDialogOpen(true);
  };
  const handleBack = () => {
    if (step === "confirm-direction") {
      if (isEntireOrderTransfer) {
        // For entire order, go back to table selection
        setStep("select-table");
        setSelectedTargetTable(null);
      } else {
        setStep("select-items");
      }
      setTargetOrder(null);
    } else if (step === "select-table") {
      navigate(`/tableorder/${tableId}`);
    } else {
      navigate(`/tableorder/${tableId}`);
    }
  };
  
  const handleEntireOrderConfirm = () => {
    setIsEntireOrderConfirmOpen(false);
    setIsSuccessDialogOpen(true);
  };

  // Handle table selection for entire order transfer
  const handleTableSelect = (selectedTable: string) => {
    setSelectedTargetTable(selectedTable);
  };

  // Handle confirm transfer to table
  const handleConfirmTableTransfer = () => {
    if (!selectedTargetTable) return;
    
    // Check if the target table has active orders
    const targetTableOrders = getOrdersByTable(selectedTargetTable).filter(
      o => o.status !== "PAID" && o.status !== "Completed"
    );
    
    if (targetTableOrders.length > 0) {
      // Show ticket selection for occupied tables
      setShowTicketSelection(true);
      setSelectedTicketOrderId(null);
    } else {
      // Available table - show direct confirmation
      setShowTableConfirmDialog(true);
    }
  };

  // Execute transfer to a specific existing order on the target table
  const executeTransferToTicket = () => {
    if (!selectedTargetTable) return;
    
    setShowTicketSelection(false);
    
    // Handle "Transfer to New Order" from ticket selection
    if (selectedTicketOrderId === '__new__') {
      const itemNames = isEntireOrderTransfer
        ? currentOrder.items.map(item => item.name).join(',')
        : selectedItems.map(index => currentOrder.items[index].name).join(',');
      const isFullTransfer = isEntireOrderTransfer || selectedItems.length === currentOrder.items.length;
      
      const transferredItems = isEntireOrderTransfer
        ? currentOrder.items
        : selectedItems.map(index => currentOrder.items[index]);
      persistTransferData(selectedTargetTable, {
        sourceOrderId: currentOrder.id,
        sourceTable: currentOrder.table,
        transferType: isFullTransfer ? 'full' : 'partial',
        items: transferredItems.map(item => ({ name: item.name, qty: item.qty, price: item.price, modifiers: item.modifiers, seats: item.seats })),
        sourceOrderName: currentOrder.name,
        sourceServer: currentOrder.server,
        sourcePhone: currentOrder.phone,
        sourcePartySize: currentOrder.partySize,
        sourceRevenueCenter: currentOrder.revenueCenter,
        sourceOrderType: currentOrder.orderType,
        sourceNotes: currentOrder.notes || '',
      });
      
      toast.success(`${isFullTransfer ? 'Order' : 'Items'} transferred to new order on ${formatTableName(selectedTargetTable)}`);
      
      setTimeout(() => {
        const transferParams = new URLSearchParams({
          transferred: currentOrder.id,
          transferFrom: currentOrder.table,
          transferDest: 'new',
          items: itemNames,
          transferSource: currentOrder.id,
          transferType: isFullTransfer ? 'full' : 'partial',
          transferredTo: 'new',
          transferToTable: selectedTargetTable.replace('T', '')
        });
        navigate(`/tableorder/${tableId}?${transferParams.toString()}`);
      }, 1500);
      return;
    }
    
    const isPartialTransfer = !isEntireOrderTransfer;
    const itemNames = isPartialTransfer 
      ? selectedItems.map(index => currentOrder.items[index].name).join(',')
      : currentOrder.items.map(item => item.name).join(',');
    const isFullTransfer = isEntireOrderTransfer || selectedItems.length === currentOrder.items.length;
    
    const transferredItems = isPartialTransfer
      ? selectedItems.map(index => currentOrder.items[index])
      : currentOrder.items;
    persistTransferData(selectedTargetTable, {
      sourceOrderId: currentOrder.id,
      sourceTable: currentOrder.table,
      transferType: isFullTransfer ? 'full' : 'partial',
      items: transferredItems.map(item => ({ name: item.name, qty: item.qty, price: item.price, modifiers: item.modifiers, seats: item.seats })),
      sourceOrderName: currentOrder.name,
      sourceServer: currentOrder.server,
      sourcePhone: currentOrder.phone,
      sourcePartySize: currentOrder.partySize,
      sourceRevenueCenter: currentOrder.revenueCenter,
      sourceOrderType: currentOrder.orderType,
      sourceNotes: currentOrder.notes || '',
      targetOrderId: selectedTicketOrderId || undefined,
    });
    
    toast.success(`${isPartialTransfer ? 'Items' : 'Order'} transferred successfully to ${formatTableName(selectedTargetTable)}`);
    
    setTimeout(() => {
      const transferParams = new URLSearchParams({
        transferred: currentOrder.id,
        transferFrom: currentOrder.table,
        transferDest: selectedTicketOrderId || currentOrder.id,
        items: itemNames,
        transferSource: currentOrder.id,
        transferType: isFullTransfer ? 'full' : 'partial',
        transferredTo: selectedTicketOrderId || currentOrder.id,
        transferToTable: selectedTargetTable.replace('T', '')
      });
      // Navigate back to the SOURCE table to maintain context
      navigate(`/tableorder/${tableId}?${transferParams.toString()}`);
    }, 1500);
  };

  // Persist transfer data to localStorage for target table
  const persistTransferData = (targetTable: string, transferData: {
    sourceOrderId: string;
    sourceTable: string;
    transferType: 'full' | 'partial';
    items: { name: string; qty: number; price: number; modifiers?: string[]; seats: number[] }[];
    sourceOrderName: string;
    sourceServer: string;
    sourcePhone: string;
    sourcePartySize: number;
    sourceRevenueCenter: string;
    sourceOrderType: string;
    sourceNotes: string;
    targetOrderId?: string;
  }) => {
    const TRANSFER_STORAGE_KEY = 'pos-table-transfers';
    try {
      const existing = JSON.parse(localStorage.getItem(TRANSFER_STORAGE_KEY) || '{}');
      // Remove any previous transfer from the same source order from ALL tables to avoid duplicates
      for (const table of Object.keys(existing)) {
        if (Array.isArray(existing[table])) {
          existing[table] = existing[table].filter(
            (t: any) => t.sourceOrderId !== transferData.sourceOrderId
          );
          // Clean up empty arrays
          if (existing[table].length === 0) delete existing[table];
        }
      }
      if (!existing[targetTable]) existing[targetTable] = [];
      existing[targetTable].push(transferData);
      localStorage.setItem(TRANSFER_STORAGE_KEY, JSON.stringify(existing));
      sessionStorage.setItem('pos-transfer-just-happened', 'true');
      window.dispatchEvent(new Event('pos-transfer-updated'));
    } catch { /* ignore */ }
  };

  // Execute the actual transfer to table
  const executeTableTransfer = () => {
    if (!selectedTargetTable) return;
    
    setShowTableConfirmDialog(false);
    
    const isPartialTransfer = !isEntireOrderTransfer;
    const itemNames = isPartialTransfer 
      ? selectedItems.map(index => currentOrder.items[index].name).join(',')
      : currentOrder.items.map(item => item.name).join(',');
    const isFullTransfer = isEntireOrderTransfer || selectedItems.length === currentOrder.items.length;
    
    // Persist transfer data for the target table
    const transferredItems = isPartialTransfer
      ? selectedItems.map(index => currentOrder.items[index])
      : currentOrder.items;
    // Look up existing active orders on the target table to merge into
    const targetTableOrders = allOrders.filter(o => o.table === selectedTargetTable && o.status !== 'Paid' && o.status !== 'PAID' && o.status !== 'Completed');
    const targetOrderId = targetTableOrders.length > 0 ? targetTableOrders[0].id : undefined;

    persistTransferData(selectedTargetTable, {
      sourceOrderId: currentOrder.id,
      sourceTable: currentOrder.table,
      transferType: isFullTransfer ? 'full' : 'partial',
      items: transferredItems.map(item => ({ name: item.name, qty: item.qty, price: item.price, modifiers: item.modifiers, seats: item.seats })),
      sourceOrderName: currentOrder.name,
      sourceServer: currentOrder.server,
      sourcePhone: currentOrder.phone,
      sourcePartySize: currentOrder.partySize,
      sourceRevenueCenter: currentOrder.revenueCenter,
      sourceOrderType: currentOrder.orderType,
      sourceNotes: currentOrder.notes || '',
      targetOrderId,
    });
    
    // Show success toast
    toast.success(`${isPartialTransfer ? 'Items' : 'Order'} transferred successfully to ${formatTableName(selectedTargetTable)}`);
    
    // Navigate to destination table after a short delay
    setTimeout(() => {
      const transferParams = new URLSearchParams({
        transferred: currentOrder.id,
        transferFrom: currentOrder.table,
        transferDest: currentOrder.id,
        items: itemNames,
        transferSource: currentOrder.id,
        transferType: isFullTransfer ? 'full' : 'partial',
        transferredTo: currentOrder.id,
        transferToTable: selectedTargetTable.replace('T', '')
      });
      // Navigate back to the SOURCE table to maintain context
      navigate(`/tableorder/${tableId}?${transferParams.toString()}`);
    }, 1500);
  };

  // Execute transfer to a specific order (Transfer to Order flow)
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
    
    const targetOrder = allOrders.find(o => o.id === selectedTransferOrderId);
    const targetTable = targetOrder?.table || currentOrder.table;
    
    const isPartialTransfer = !isEntireOrderTransfer;
    const itemNames = isPartialTransfer 
      ? selectedItems.map(index => currentOrder.items[index].name).join(',')
      : currentOrder.items.map(item => item.name).join(',');
    const isFullTransfer = isEntireOrderTransfer || selectedItems.length === currentOrder.items.length;
    const transferredItemCount = isFullTransfer ? currentOrder.items.length : selectedItems.length;
    const targetName = targetOrder ? targetOrder.name : `Order #${selectedTransferOrderId}`;

    // Update unified context so Tickets module reflects the transfer
    updateUnifiedOrders(prev => {
      const matchSource = (o: any) => o.name === currentOrder.name && o.table === currentOrder.table;
      const matchTarget = (o: any) => o.id === selectedTransferOrderId || (o.name === targetOrder?.name && o.name !== 'Guest');

      if (isFullTransfer) {
        return prev.map(o => {
          if (matchSource(o)) {
            return {
              ...o,
              items: [],
              subtotal: 0, discount: 0, serviceCharge: 0, tax: 0, tip: 0, total: 0,
              transferInfo: {
                type: 'sent' as const,
                transferType: 'full' as const,
                targetOrderId: selectedTransferOrderId!,
                targetOrderName: targetName,
                itemCount: transferredItemCount,
              },
            };
          }
          if (matchTarget(o)) {
            const sourceInPrev = prev.find(matchSource);
            const sourceItems = sourceInPrev ? sourceInPrev.items : [];
            const newItems = [...o.items, ...sourceItems];
            const newSub = newItems.reduce((s: number, item: any) => s + item.price * item.qty, 0);
            return {
              ...o,
              items: newItems,
              subtotal: +newSub.toFixed(2),
              tax: +(newSub * 0.0735).toFixed(2),
              serviceCharge: +(newSub * 0.05).toFixed(2),
              total: +(newSub + newSub * 0.05 + newSub * 0.0735 - o.discount).toFixed(2),
              transferInfo: {
                type: 'received' as const,
                transferType: 'full' as const,
                sourceOrderId: currentOrder.id,
                sourceOrderName: currentOrder.name,
                sourceTable: currentOrder.table,
                itemCount: transferredItemCount,
              },
            };
          }
          return o;
        });
      } else {
        // Partial transfer
        const transferredItems = selectedItems.map(index => ({
          name: currentOrder.items[index].name,
          qty: itemQuantities[index] || currentOrder.items[index].qty,
          price: currentOrder.items[index].price,
          modifiers: currentOrder.items[index].modifiers || [],
          seats: currentOrder.items[index].seats || [],
        }));
        const transferredItemNames = transferredItems.map(i => i.name);

        return prev.map(o => {
          if (matchSource(o)) {
            const remainingItems = o.items.filter((item: any) => !transferredItemNames.includes(item.name));
            const newSub = remainingItems.reduce((s: number, item: any) => s + item.price * item.qty, 0);
            const ratio = o.subtotal > 0 ? newSub / o.subtotal : 0;
            return {
              ...o,
              items: remainingItems,
              subtotal: +newSub.toFixed(2),
              discount: +(o.discount * ratio).toFixed(2),
              serviceCharge: +(o.serviceCharge * ratio).toFixed(2),
              tax: +(o.tax * ratio).toFixed(2),
              total: +(newSub + (o.serviceCharge * ratio) + (o.tax * ratio) - (o.discount * ratio)).toFixed(2),
              transferInfo: {
                type: 'sent' as const,
                transferType: 'partial' as const,
                targetOrderId: selectedTransferOrderId!,
                targetOrderName: targetName,
                itemCount: transferredItemCount,
              },
            };
          }
          if (matchTarget(o)) {
            const newItems = [...o.items, ...transferredItems];
            const newSub = newItems.reduce((s: number, item: any) => s + item.price * item.qty, 0);
            return {
              ...o,
              items: newItems,
              subtotal: +newSub.toFixed(2),
              total: +(newSub + o.serviceCharge + o.tax - o.discount + o.tip).toFixed(2),
              transferInfo: {
                type: 'received' as const,
                transferType: 'partial' as const,
                sourceOrderId: currentOrder.id,
                sourceOrderName: currentOrder.name,
                sourceTable: currentOrder.table,
                itemCount: transferredItemCount,
              },
            };
          }
          return o;
        });
      }
    });

    toast.success(`${isPartialTransfer ? 'Items' : 'Order'} transferred successfully to Order #${selectedTransferOrderId}`);
    
    setTimeout(() => {
      const transferParams = new URLSearchParams({
        transferred: currentOrder.id,
        transferFrom: currentOrder.table,
        transferDest: selectedTransferOrderId,
        items: itemNames,
        transferSource: currentOrder.id,
        transferType: isFullTransfer ? 'full' : 'partial',
        transferredTo: selectedTransferOrderId,
        transferToTable: targetTable.replace('T', '')
      });
      // Navigate back to the SOURCE table to maintain context
      navigate(`/tableorder/${tableId}?${transferParams.toString()}`);
    }, 1500);
  };

  const getAvailableTables = () => {
    return defaultTables.filter(table => table.id !== tableId);
  };

  // Calculate order totals using centralized function
  const getOrderTotals = (order: Order) => {
    return calculateOrderTotals(order.items, order.tipAmount || 0);
  };

  // Mobile order card for source order display
  const MobileSourceOrderCard = ({
    order
  }: {
    order: Order;
  }) => <div className="rounded-xl border border-white/20 overflow-hidden" style={{
    backgroundColor: '#1B1C20'
  }}>
      <div className="flex items-stretch w-full">
        {/* Order Number - Mobile compact style */}
        <div className="flex-shrink-0 px-2 py-2 flex items-center md:hidden">
          <div className="relative w-10 h-12 bg-neutral-800 rounded-lg flex flex-col items-center justify-center border border-neutral-600">
            <span className="text-lg font-bold text-white">{order.id}</span>
            <span className="text-[9px] text-gray-500">000</span>
          </div>
        </div>

        {/* Guest Info - Mobile compact layout */}
        <div className="flex-1 min-w-0 py-2 pr-2 md:hidden">
          <div className="flex flex-col gap-1">
            {/* Row 1: Name + Table + Revenue Center, Server, Status */}
            <div className="flex items-center justify-between">
              <span className="text-white font-medium text-sm">{order.name} · {formatTableName(order.table)} · {order.revenueCenter}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm" style={{
                color: '#B5B6BB'
              }}>{order.server}</span>
                <span className={`text-sm font-medium ${getStatusColor(order.status)}`}>{order.status}</span>
              </div>
            </div>
            
            {/* Row 2: Party info, Timer, Total */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-xs" style={{
              color: '#B5B6BB'
            }}>
                <img src={dineInIcon} alt="Dine In" className="w-3 h-3 object-contain opacity-60" />
                <span>Party of {order.partySize}, {order.time}</span>
                <span className="text-gray-500">|</span>
                <span>{order.timer}</span>
              </div>
              <span className="text-white font-semibold text-sm">{getOrderAmount(order)}</span>
            </div>
            
            {/* Row 3: Payment status */}
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{
                color: '#B5B6BB'
              }}>{order.paymentStatus || 'Un Paid'}</span>
              <span className="text-white text-sm">{order.paidAmount || '$0.00'}</span>
            </div>
          </div>
        </div>

        {/* Tablet/Desktop layout - 45% | 35% | 20% matching TableOrderDetails */}
        <div className="hidden md:flex flex-1 items-stretch gap-3 p-3">
          {/* Order Number Box */}
          <div className="flex-shrink-0 flex flex-col items-center justify-center w-14 rounded-lg border border-white/20 py-2 gap-1" style={{
          background: '#1A1A1A'
        }}>
            <span className="text-lg font-bold text-white">{order.id}</span>
            <span className="text-xs text-white/40">000</span>
          </div>

          {/* Main Content - 45% | 35% | 20% */}
          <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
            {/* Row 1: Name + Table | Server | Status - 45% | 35% | 20% */}
            <div className="flex items-center text-xs md:text-sm">
              <div className="w-[45%] text-left">
                <span className="text-white font-medium truncate">{order.name} · {formatTableName(order.table)}</span>
              </div>
              <div className="w-[35%] text-left pl-4">
                <span className="text-white/60 truncate">{order.server}</span>
              </div>
              <div className="w-[20%] text-right">
                <span className={`font-semibold uppercase ${getStatusColor(order.status)}`}>
                  {order.status}
                </span>
              </div>
            </div>
            
            {/* Row 2: Party info + Timer | empty | Total - 45% | 35% | 20% */}
            <div className="flex items-center text-xs md:text-sm">
              <div className="w-[45%] text-left flex items-center gap-1 text-white/60 whitespace-nowrap">
                <img src={dineInIcon} alt="Dine In" className="w-3 h-3 md:w-4 md:h-4 object-contain opacity-60" />
                <span>Party of {order.partySize}, {order.time}</span>
                <span className="text-white/40">|</span>
                <span>{order.timer}</span>
              </div>
              <div className="w-[35%]"></div>
              <div className="w-[20%] text-right">
                <span className="text-white font-semibold">{getOrderAmount(order)}</span>
              </div>
            </div>
            
            {/* Row 3: Revenue Center | Payment Status | Tip - 45% | 35% | 20% */}
            <div className="flex items-center text-xs md:text-sm">
              <div className="w-[45%] text-left">
                <span className="text-white/60 truncate">{order.revenueCenter}</span>
              </div>
              <div className="w-[35%] text-left pl-4">
                <span className="text-white/60 truncate">{order.status === 'Paid' || order.status === 'Completed' ? 'Paid' : 'Pending Payment'}</span>
              </div>
              <div className="w-[20%] text-right">
                <span className="text-white">$0.00</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>;

  // Target order card for selection
  const TargetOrderCard = ({
    order,
    onClick
  }: {
    order: Order;
    onClick: () => void;
  }) => <div className="rounded-xl border border-white/10 overflow-hidden cursor-pointer hover:border-orange-500 transition-all" style={{
    backgroundColor: '#1B1C20'
  }} onClick={onClick}>
      <div className="flex items-stretch w-full">
        {/* Order Number - Mobile compact style */}
        <div className="flex-shrink-0 px-2 py-2 flex items-center md:hidden">
          <div className="relative w-10 h-12 bg-neutral-800 rounded-lg flex flex-col items-center justify-center border border-neutral-600">
            <span className="text-lg font-bold text-white">{order.id}</span>
            <span className="text-[9px] text-gray-500">000</span>
          </div>
        </div>

        {/* Guest Info - Mobile compact layout */}
        <div className="flex-1 min-w-0 py-2 pr-2 md:hidden">
          <div className="flex flex-col gap-1">
            {/* Row 1: Name + Table + Revenue Center, Server, Status */}
            <div className="flex items-center justify-between">
              <span className="text-white font-medium text-sm">{order.name} · {formatTableName(order.table)} · {order.revenueCenter}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm" style={{
                color: '#B5B6BB'
              }}>{order.server}</span>
                <span className={`text-sm font-medium ${getStatusColor(order.status)}`}>{order.status}</span>
              </div>
            </div>
            
            {/* Row 2: Party info, Timer, Total */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-xs" style={{
              color: '#B5B6BB'
            }}>
                <img src={dineInIcon} alt="Dine In" className="w-3 h-3 object-contain opacity-60" />
                <span>Party of {order.partySize}, {order.time}</span>
                <span className="text-gray-500">|</span>
                <span>{order.timer}</span>
              </div>
              <span className="text-white font-semibold text-sm">{getOrderAmount(order)}</span>
            </div>
            
            {/* Row 3: Payment status */}
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{
                color: '#B5B6BB'
              }}>{order.paymentStatus || 'Un Paid'}</span>
              <span className="text-white text-sm">{order.paidAmount || '$0.00'}</span>
            </div>
          </div>
        </div>

        {/* Tablet/Desktop layout - 45% | 35% | 20% matching TableOrderDetails */}
        <div className="hidden md:flex flex-1 items-stretch gap-3 p-3">
          {/* Order Number Box */}
          <div className="flex-shrink-0 flex flex-col items-center justify-center w-14 rounded-lg border border-white/20 py-2 gap-1" style={{
          background: '#1A1A1A'
        }}>
            <span className="text-lg font-bold text-white">{order.id}</span>
            <span className="text-xs text-white/40">000</span>
          </div>

          {/* Main Content - 45% | 35% | 20% */}
          <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
            {/* Row 1: Name + Table | Server | Status - 45% | 35% | 20% */}
            <div className="flex items-center text-xs md:text-sm">
              <div className="w-[45%] text-left">
                <span className="text-white font-medium truncate">{order.name} · {formatTableName(order.table)}</span>
              </div>
              <div className="w-[35%] text-left pl-4">
                <span className="text-white/60 truncate">{order.server}</span>
              </div>
              <div className="w-[20%] text-right">
                <span className={`font-semibold uppercase ${getStatusColor(order.status)}`}>
                  {order.status}
                </span>
              </div>
            </div>
            
            {/* Row 2: Party info + Timer | empty | Total - 45% | 35% | 20% */}
            <div className="flex items-center text-xs md:text-sm">
              <div className="w-[45%] text-left flex items-center gap-1 text-white/60 whitespace-nowrap">
                <img src={dineInIcon} alt="Dine In" className="w-3 h-3 md:w-4 md:h-4 object-contain opacity-60" />
                <span>Party of {order.partySize}, {order.time}</span>
                <span className="text-white/40">|</span>
                <span>{order.timer}</span>
              </div>
              <div className="w-[35%]"></div>
              <div className="w-[20%] text-right">
                <span className="text-white font-semibold">{getOrderAmount(order)}</span>
              </div>
            </div>
            
            {/* Row 3: Revenue Center | Payment Status | Tip - 45% | 35% | 20% */}
            <div className="flex items-center text-xs md:text-sm">
              <div className="w-[45%] text-left">
                <span className="text-white/60 truncate">{order.revenueCenter}</span>
              </div>
              <div className="w-[35%] text-left pl-4">
                <span className="text-white/60 truncate">{order.status === 'Paid' || order.status === 'Completed' ? 'Paid' : 'Pending Payment'}</span>
              </div>
              <div className="w-[20%] text-right">
                <span className="text-white">$0.00</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>;

  // Mobile Step 1: Select items to transfer
  const MobileSelectItemsView = () => <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      {/* Header */}
      <div className="relative flex items-center justify-between p-4">
        <button onClick={handleBack} className="w-10 h-10 rounded-full flex items-center justify-center z-10" style={{
        background: "#7575754D",
        boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)"
      }}>
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        
        <h1 className="absolute left-1/2 -translate-x-1/2 text-white text-xl font-medium">Transfer Check</h1>
        
        <div className="w-10" /> {/* Spacer for alignment */}
      </div>

      {/* Source Order Card */}
      <div className="px-4 pb-3">
        <MobileSourceOrderCard order={currentOrder} />
      </div>

      {/* Select Items Label with Info */}
      <div className="px-4 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-white/80 text-sm font-medium">Select Items</p>
          <Info className="w-3.5 h-3.5 text-white/40" />
        </div>
        <button onClick={handleSelectAll} className="text-white/60 text-sm font-medium hover:text-white transition-colors">
          {selectAll ? "Deselect All" : "Select All"}
        </button>
      </div>

      {/* Notes Section - Above items */}
      {currentOrder.notes && <div className="mx-4 mb-3 px-3 py-2 rounded-lg bg-neutral-800/80 border border-white/10">
          <div className="flex items-start gap-2">
            <span className="text-white/60 text-sm">📋</span>
            <span className="text-white/70 text-sm">{currentOrder.notes}</span>
          </div>
        </div>}

      {/* Items List */}
      <ScrollArea className="flex-1 px-4">
        <div className="space-y-2 pb-24">
          {currentOrder.items.map((item, index) => {
          const isSelected = selectedItems.includes(index);
          const selectedQty = itemQuantities[index] || item.qty;

          // Parse modifiers to identify add-ons with prices
          const parseModifier = (mod: string) => {
            const isAddOn = mod.startsWith('+');
            const isRemoval = mod.startsWith('-');
            const priceMatch = mod.match(/\$[\d.]+/);
            const price = priceMatch ? priceMatch[0] : null;
            const text = mod.replace(/\$[\d.]+/, '').trim();
            return {
              text,
              price,
              isAddOn,
              isRemoval
            };
          };
          return <div key={index} className={`rounded-xl border transition-all cursor-pointer overflow-hidden ${isSelected ? "border-orange-500 bg-orange-500/5" : "border-white/10 bg-white/[0.02]"}`} onClick={() => handleItemSelect(index)}>
                {/* Main Item Row */}
                <div className="p-3">
                  <div className="flex items-start gap-3">
                    {/* Quantity Badge */}
                    <div className="flex-shrink-0">
                      <div className={`w-7 h-7 rounded-md flex items-center justify-center text-sm font-bold ${isSelected ? "bg-orange-500 text-white" : "bg-neutral-700 text-white"}`}>
                        {isSelected ? selectedQty : item.qty}
                      </div>
                    </div>

                    {/* Item Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-white text-sm font-medium flex-1">{item.name}</span>
                        <div className="flex items-center gap-2">
                          {/* Quantity Selector - Compact dropdown style */}
                          {isSelected && item.qty > 1 && <div className="relative" onClick={e => e.stopPropagation()}>
                              <select value={selectedQty} onChange={e => {
                          e.stopPropagation();
                          handleQuantityChange(index, parseInt(e.target.value));
                        }} className="appearance-none bg-neutral-600 text-white text-sm font-medium rounded-full px-3 py-1 pr-6 cursor-pointer focus:outline-none">
                                {Array.from({
                            length: item.qty
                          }, (_, i) => i + 1).map(qty => <option key={qty} value={qty}>{qty}</option>)}
                              </select>
                              <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white pointer-events-none" />
                            </div>}
                          <span className="text-white text-sm font-medium">${(item.price * item.qty).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Modifiers */}
                  {item.modifiers.length > 0 && <div className="mt-2 ml-10 space-y-0.5">
                      {item.modifiers.map((mod, i) => {
                  const {
                    text,
                    price,
                    isAddOn,
                    isRemoval
                  } = parseModifier(mod);
                  return <div key={i} className="flex items-center justify-between text-xs">
                            <span className="text-white/50">
                              {isAddOn ? '+' : isRemoval ? '−' : '·'} {text.replace(/^[+-]\s*/, '').replace(/^W\/\s*/i, '')}
                            </span>
                            {price && <span className="text-white/50">{price}</span>}
                          </div>;
                })}
                    </div>}

                  {/* Seat badges */}
                  <div className="flex items-center gap-2 mt-2 ml-10">
                    {item.seats.length > 0 && <div className="flex items-center gap-1">
                        <img src={seatIcon} alt="Seat" className="w-3.5 h-3.5 opacity-50" />
                        <span className="text-white/50 text-xs">{item.seats.join(', ')}</span>
                      </div>}
                    {item.isShared && <div className="flex items-center gap-1">
                        <img src={seatIcon} alt="Shared" className="w-3.5 h-3.5 opacity-50" />
                        <span className="text-white/50 text-xs">Shared</span>
                      </div>}
                  </div>
                </div>
              </div>;
        })}
        </div>
        <ScrollBar orientation="vertical" />
      </ScrollArea>


      {/* Target Selection Bottom Sheet */}
      <Sheet open={showTargetSheet} onOpenChange={setShowTargetSheet}>
        <SheetContent side="bottom" className="bg-neutral-900 border-t border-white/10 rounded-t-3xl p-0 h-[70vh]">
          {/* Grabber */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-10 h-1 bg-white/30 rounded-full" />
          </div>
          
          <div className="px-4 pb-2">
            <h2 className="text-white text-lg font-medium">Select target check</h2>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide" style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}>
            {transferFilters.map(filter => {
            const count = getFilterCount(filter);
            const isActive = activeFilter === filter;
            return <button key={filter} onClick={() => setActiveFilter(filter)} className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${isActive ? "text-black" : "text-white"}`} style={isActive ? {
              background: "linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)"
            } : {
              background: "#7575754D"
            }}>
                  {filter}
                  <span className="font-bold">{count}</span>
                </button>;
          })}
          </div>

          {/* Orders List */}
          <ScrollArea className="flex-1 px-4" style={{
          height: 'calc(70vh - 130px)'
        }}>
            <div className="space-y-2 pb-4">
              {filteredOrders.map(order => <TargetOrderCard key={order.id} order={order} onClick={() => handleTargetSelect(order)} />)}
            </div>
            <ScrollBar orientation="vertical" />
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>;

  // Compact order card for confirm direction view
  const CompactOrderCard = ({
    order,
    transferredTo
  }: {
    order: Order;
    transferredTo?: string;
  }) => <div className="rounded-xl border border-white/10 overflow-hidden" style={{
    backgroundColor: '#1B1C20'
  }}>
      {/* Transferred Banner */}
      {transferredTo && <div className="px-3 py-1.5 text-sm font-medium flex items-center gap-2" style={{
      backgroundColor: '#1E3A5F'
    }}>
          <ArrowRightLeft className="w-4 h-4 text-[#8AC4FF]" />
          <span style={{ color: '#8AC4FF' }}>Transferred to {transferredTo}</span>
        </div>}
      <div className="flex items-stretch w-full gap-3 p-3">
        {/* Order Number Column */}
        <div className="flex-shrink-0 flex flex-col items-center justify-center w-8">
          <span className="text-base font-bold text-white">{order.id}</span>
          <span className="text-[10px] text-white/40">000</span>
        </div>

        {/* Info Columns */}
        <div className="flex-1 min-w-0 grid grid-cols-3 gap-x-4">
          {/* Column 1: Name, Party info, Revenue center */}
          <div className="flex flex-col gap-0.5">
            <span className="text-white font-medium text-sm">{order.name}</span>
            <span className="text-gray-400 text-xs">Party of {order.partySize},{order.time} | {order.timer}</span>
            <span className="text-gray-400 text-xs">{order.revenueCenter}</span>
          </div>
          
          {/* Column 2: Server, empty, Payment Status */}
          <div className="flex flex-col gap-0.5">
            <span className="text-white/80 text-sm">{order.server}</span>
            <span className="text-white font-semibold text-xs">{getOrderAmount(order)}</span>
            <span className="text-gray-400 text-xs">{order.paymentStatus || "Un Paid"}</span>
          </div>
          
          {/* Column 3: Status, Amount, Paid Amount */}
          <div className="flex flex-col gap-0.5 items-end">
            <span className={`text-sm font-medium ${getStatusColor(order.status)}`}>{order.status}</span>
            <span className="text-xs text-transparent">-</span>
            <span className="text-gray-400 text-xs">{order.paidAmount || "$0.00"}</span>
          </div>
        </div>
      </div>
    </div>;

  // Mobile Confirm Direction View
  const ConfirmDirectionView = () => <div className="flex flex-col h-full">
      {/* Header */}
      <div className="relative flex items-center justify-between p-4">
        <button onClick={handleBack} className="w-10 h-10 rounded-full flex items-center justify-center z-10" style={{
        background: "#7575754D",
        boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)"
      }}>
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        
        <h1 className="absolute left-1/2 -translate-x-1/2 text-white text-xl font-medium">Transfer Check</h1>
        
        <div className="w-10" />
      </div>

      {/* From Order */}
      <div className="px-4 pb-3">
        <p className="text-white/60 text-sm mb-2">Transfer Check From</p>
        {fromOrder && <CompactOrderCard order={{
        ...fromOrder,
        status: 'TRANSFERRED'
      }} transferredTo={toOrder ? formatTableName(toOrder.table || '') : undefined} />}
      </div>

      {/* Swap Button */}
      <div className="flex justify-center py-2">
        <button onClick={handleSwapDirection} className="w-10 h-10 rounded-full flex items-center justify-center bg-neutral-800 border border-white/20">
          <ArrowUpDown className="w-4 h-4 text-white" />
        </button>
      </div>

      {/* To Order */}
      <div className="px-4 pb-4">
        <p className="text-white/60 text-sm mb-2">Transfer Check To</p>
        {toOrder && <CompactOrderCard order={toOrder} />}
      </div>

      {/* Spacer */}
      <div className="flex-1" />
    </div>;

  // Mobile Table Selection View for entire order transfer
  const MobileTableSelectionView = () => {
    const availableTables = getAvailableTables();
    
    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="relative flex items-center justify-between p-4">
          <button onClick={handleBack} className="w-10 h-10 rounded-full flex items-center justify-center z-10" style={{
            background: "#7575754D",
            boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)"
          }}>
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          
          <h1 className="absolute left-1/2 -translate-x-1/2 text-white text-xl font-medium">Transfer to Table</h1>
          
          <div className="w-10" />
        </div>

        {/* Current Order Summary */}
        <div className="px-4 pb-3">
          <div className="px-3 py-2 rounded-lg bg-neutral-800 border border-white/10">
            <p className="text-white/60 text-xs mb-1">Transferring from</p>
            <div className="flex items-center justify-between">
              <span className="text-white font-medium">Order #{currentOrder.id} · {formatTableName(currentOrder.table)}</span>
              <span className="text-white/60 text-sm">{isEntireOrderTransfer ? currentOrder.items.length : selectedItems.length} item{(isEntireOrderTransfer ? currentOrder.items.length : selectedItems.length) > 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>

        {/* Table Grid */}
        <ScrollArea className="flex-1 px-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pb-24 pt-2">
            {availableTables.map((table) => {
              const config = statusConfig[table.status] || statusConfig["Available"];
              const dotColor = getSeatDotColor(table.status);
              const isSelected = selectedTargetTable === table.id;
              const isCurrentTable = table.id === tableId;
              
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
                  {/* Table Number */}
                  <span className="text-3xl font-bold text-white mb-1">{table.id}</span>
                  
                  {/* Seats */}
                  <span className="text-gray-400 text-sm mb-2">{table.seats} Seats</span>
                  
                  {/* Seat Dots */}
                  <div className="flex gap-1 mb-2">
                    {Array.from({ length: Math.min(table.seats, 6) }).map((_, i) => (
                      <div key={i} className={`w-2 h-2 flex-shrink-0 rounded-full ${dotColor}`} />
                    ))}
                    {table.seats > 6 && <span className="text-xs text-gray-500">+{table.seats - 6}</span>}
                  </div>
                  
                  <div className="mt-auto w-full">
                    {/* Time */}
                    <div className="flex justify-end mb-1 min-h-[1rem] px-1">
                      {table.time && (
                        <span className="text-gray-500 text-xs">{table.time}</span>
                      )}
                    </div>
                    
                    {/* Status Label */}
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
      </div>
    );
  };

  // Right panel - Order details (Desktop)
  const OrderDetailsPanel = () => <div className="w-[345px] flex flex-col mb-2 mr-2">
      {/* Guest Header - Outside the box */}
      <div className="px-2 py-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-white font-medium">{panelOrder.name}</span>
          <div className="flex items-center gap-3 text-white/50 text-sm">
            <div className="flex items-center gap-1">
              <Phone className="w-3 h-3" />
              <span>{panelOrder.phone || "(415) 123-4567"}</span>
            </div>
            <div className="flex items-center gap-1">
              <span>⚡</span>
              <span>{panelOrder.time}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-1.5 bg-neutral-700 text-white text-xs rounded-full hover:bg-neutral-600 transition-colors">
            Add Item
          </button>
          <button className="px-3 py-1.5 bg-neutral-700 text-white text-xs rounded-full hover:bg-neutral-600 transition-colors">
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
        {/* Table Order Header - Row 1 */}
        <div className="flex items-center justify-between px-2 py-2 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <span className="bg-neutral-700 border border-neutral-600 px-2 py-1 rounded text-xs font-medium text-white">
              {formatTableName(panelOrder.table).toUpperCase()}
            </span>
            <Users className="w-4 h-4 text-neutral-400" />
            <span className="text-neutral-400 text-xs">{panelOrder.items.length}</span>
            <span className="font-bold text-white text-sm">{panelOrder.id}</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <img src={runnerIcon} alt="Server" className="w-4 h-4 opacity-80" />
            <span className="text-neutral-400">{panelOrder.server}</span>
          </div>
        </div>
        
        {/* Table Order Header - Row 2: Seat buttons */}
        <div className="flex items-center gap-1.5 px-2 py-1.5 border-b border-sidebar-border">
          <button className="p-1 bg-neutral-700 rounded hover:bg-neutral-600 transition-colors">
            <img src={chairWhiteIcon} alt="Chair" className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setSelectedSeats([1, 2, 3, 4])} className={`p-1 rounded transition-colors ${selectedSeats.length === 4 ? 'bg-white' : 'bg-neutral-700 hover:bg-neutral-600'}`}>
            <Share2 className={`w-3.5 h-3.5 ${selectedSeats.length === 4 ? 'text-black' : 'text-white'}`} />
          </button>
          {[1, 2, 3, 4].map(seat => <button key={seat} onClick={() => setSelectedSeats(prev => prev.includes(seat) ? prev.filter(s => s !== seat) : [...prev, seat])} className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold transition-colors ${selectedSeats.includes(seat) ? 'bg-white text-black' : 'bg-neutral-600 text-white hover:bg-neutral-500'}`}>
              {seat}
            </button>)}
        </div>

        {/* Order Notes */}
        <div className="px-2 py-1.5 border-b border-sidebar-border flex-shrink-0">
          <OrderNotesAutocomplete value={orderNotes} onChange={setOrderNotes} placeholder="Order notes and Allergies" />
        </div>

        {/* Transfer info banner */}
        {selectedTargetTable && (step === 'select-table' || desktopStep === 'select-table') && (
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
            {panelOrder.items.map((item, index) => {
              const isSelectedForTransfer = selectedItems.includes(index) && (step === 'select-table' || desktopStep === 'select-table');
              return <SwipeableCartItem key={`${panelOrder.id}-${index}`} onDelete={() => {}} itemOrderType="Dine In" onOrderTypeChange={() => {}} isOpen={activeSwipedItemId === `${panelOrder.id}-${index}`} onSwipeStart={() => setActiveSwipedItemId(`${panelOrder.id}-${index}`)}>
                <div className={`p-2 border rounded-md cursor-pointer ${isSelectedForTransfer ? 'border-[#3B6A9E]' : 'border-sidebar-border'}`} style={{
              background: isSelectedForTransfer 
                ? 'linear-gradient(180deg, #1E3A5F 0%, #2A4A6F 100%)' 
                : 'linear-gradient(180deg, #4D4D4D 0%, #616161 100%)'
            }}>
                  <div className="flex flex-col">
                    {/* Item header row */}
                    <div className="flex items-start gap-2">
                      <span className={`w-6 h-6 rounded border text-white text-xs font-medium flex items-center justify-center flex-shrink-0 ${isSelectedForTransfer ? 'bg-[#3B6A9E] border-[#5A8ABF]' : 'bg-neutral-700 border-neutral-600'}`}>
                        {item.qty}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-foreground">{item.name}</span>
                          <span className="text-sm font-medium text-foreground">
                            {formatPrice(item.price * item.qty)}
                          </span>
                        </div>
                        
                        {/* Modifiers with tree hierarchy */}
                        {item.modifiers.length > 0 && <div className="mt-1 relative">
                            {item.modifiers.map((mod, idx) => {
                        const isAddOn = mod.startsWith("W/") || mod.startsWith("Add");
                        const isRemoval = mod.startsWith("No ") || mod.startsWith("-");
                        const isLastItem = idx === item.modifiers.length - 1;
                        return <div key={idx} className="relative flex items-center text-xs py-[3px]">
                                  {/* Vertical line - only show if not last item */}
                                  {!isLastItem && <div className="absolute left-0 top-1/2 w-px bg-white" style={{
                            height: 'calc(100% + 3px)'
                          }} />}
                                  {/* Vertical line segment to connect to horizontal */}
                                  <div className="absolute left-0 top-0 h-1/2 w-px bg-white" />
                                  {/* Horizontal connector */}
                                  <div className="absolute left-0 top-1/2 w-3 h-px bg-white" />
                                  {/* Content */}
                                  <div className="flex items-center gap-2 ml-5">
                                    <span className="text-white">
                                      {isAddOn ? '+' : isRemoval ? '-' : '•'}
                                    </span>
                                    <span className={`text-white ${isRemoval ? 'line-through' : ''}`}>
                                      {mod}
                                    </span>
                                  </div>
                                </div>;
                      })}
                          </div>}
                        
                        {/* Seat Assignment Display */}
                        {item.seats.length > 0 && <div className="mt-1.5 flex items-center gap-1.5">
                            <img src={chairWhiteIcon} alt="Seats" className="w-4 h-4 opacity-70" />
                            {item.seats.length === 4 ? <span className="w-5 h-5 rounded bg-neutral-700 text-white flex items-center justify-center">
                                <Share2 className="w-3 h-3" />
                              </span> : item.seats.map(seat => <span key={seat} className="w-5 h-5 rounded bg-neutral-700 text-white text-[10px] font-medium flex items-center justify-center">
                                  {seat}
                                </span>)}
                          </div>}
                      </div>
                    </div>
                  </div>
                </div>
              </SwipeableCartItem>})}
          </div>
          <ScrollBar orientation="vertical" />
        </ScrollArea>

        {/* Order Summary */}
        {(() => {
        const totals = getOrderTotals(panelOrder);
        return <div className="p-2 border-t border-sidebar-border flex-shrink-0">
              <div className="text-xs rounded px-2 py-1.5 space-y-0.5" style={{
            background: '#7575754D',
            boxShadow: 'inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)'
          }}>
                <div className="flex justify-between gap-3">
                  <span className="text-foreground">Sub Total: <span className="font-medium">{formatPrice(totals.subtotal)}</span></span>
                  <span className="text-white">Discount: <span className="font-medium">{formatPrice(totals.discount)}</span></span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-foreground">Service Charge: <span className="font-medium text-primary">+{formatPrice(totals.serviceCharge)}</span></span>
                  <span className="text-foreground">Tax: <span className="font-medium">{formatPrice(totals.tax)}</span></span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="px-2 py-2 flex items-center gap-3 flex-shrink-0">
                <button className="w-8 h-8 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center flex-shrink-0">
                  <img src={clearIcon} alt="Clear" className="w-3 h-3" />
                </button>
                <button className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{
              backgroundColor: '#C9C9C9'
            }}>
                  <img src={saveIcon} alt="Save" className="w-4 h-4" />
                </button>
                <button className="flex-1 h-8 rounded-full flex items-center justify-center gap-1.5" style={{
              background: 'linear-gradient(180deg, #FF9E65 0%, #FF5E00 100%)'
            }}>
                  <img src={fireIcon} alt="Fire" className="w-4 h-4" />
                  <span className="text-white font-semibold text-sm">FIRE</span>
                </button>
                <button className="flex-1 h-8 rounded-full flex items-center justify-center" style={{
              background: 'linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)'
            }}>
                  <span className="text-black font-semibold text-xs">
                    CHARGE {formatPrice(totals.total)}
                  </span>
                </button>
              </div>
            </div>;
      })()}
      </div>
    </div>;

  // Desktop current order card with extended info - matching MergeOrders 3-row layout
  const DesktopCurrentOrderCard = ({
    order
  }: {
    order: Order;
  }) => <div className="rounded-xl border border-white overflow-hidden" style={{
    backgroundColor: '#1B1C20'
  }}>
      <div className="flex items-stretch w-full">
        {/* Left Content with padding */}
        <div className="flex-1 flex items-stretch gap-2 md:gap-3 p-2 md:p-3">
          {/* Order Number Box */}
          <div className="flex-shrink-0 flex flex-col items-center justify-center w-12 md:w-14 rounded-lg border border-white/20 py-1.5 md:py-2 gap-0.5 md:gap-1" style={{
          background: '#1A1A1A'
        }}>
            <span className="text-base md:text-lg font-bold text-white">{order.id}</span>
            <span className="text-[10px] md:text-xs text-white/40">000</span>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5 md:py-1">
            {/* Row 1: Name + Table | Server (center) | Status */}
            <div className="flex items-center text-xs md:text-sm">
              <div className="flex items-center gap-1 md:gap-2 w-[170px] md:w-[220px] flex-shrink-0">
                <span className="text-white font-medium truncate">{order.name}</span>
                <span className="text-white/60">·</span>
                <span className="text-white font-medium">{formatTableName(order.table)}</span>
              </div>
              <div className="flex-1">
                <span className="text-white/60 truncate">{order.server}</span>
              </div>
              <span className={`font-semibold uppercase flex-shrink-0 ${getStatusColor(order.status)}`}>
                {order.status}
              </span>
            </div>
            
            {/* Row 2: Party info | Timer | Total */}
            <div className="flex items-center text-xs md:text-sm">
              <div className="flex items-center gap-1 text-white/60 w-[170px] md:w-[220px] flex-shrink-0">
                <img src={dineInIcon} alt="Dine In" className="w-3 h-3 md:w-4 md:h-4 object-contain opacity-60" />
                <span className="truncate">Party of {order.partySize}, {order.time}</span>
                <span className="text-white/40">|</span>
                <span>{order.timer}</span>
              </div>
              <div className="flex-1"></div>
              <span className="text-white font-semibold flex-shrink-0">{getOrderAmount(order)}</span>
            </div>
            
            {/* Row 3: Revenue Center | Payment Status (center) | Tip */}
            <div className="flex items-center text-xs md:text-sm">
              <span className="text-white font-medium w-[170px] md:w-[220px] flex-shrink-0 truncate">{order.revenueCenter}</span>
              <div className="flex-1">
                <span className="text-white/60 truncate">{order.status === 'Paid' || order.status === 'Completed' ? 'Paid' : 'Un Paid'}</span>
              </div>
              <span className="text-white flex-shrink-0">$0.00</span>
            </div>
          </div>
        </div>
      </div>
    </div>;

  // Desktop order list card for target selection - matching MergeOrders 3-row layout
  const DesktopOrderListCard = ({
    order,
    isSelected,
    onClick
  }: {
    order: Order;
    isSelected: boolean;
    onClick?: () => void;
  }) => <div className={`rounded-xl border cursor-pointer transition-all overflow-hidden ${isSelected ? "border-orange-500" : "border-neutral-700 hover:border-neutral-600"}`} style={{
    backgroundColor: '#1B1C20'
  }} onClick={onClick}>
      <div className="flex items-stretch w-full">
        {/* Left Content with padding */}
        <div className="flex-1 flex items-stretch gap-2 md:gap-3 p-2 md:p-3">
          {/* Order Number Box */}
          <div className="flex-shrink-0 flex flex-col items-center justify-center w-12 md:w-14 rounded-lg border border-white/20 py-1.5 md:py-2 gap-0.5 md:gap-1" style={{
          background: '#1A1A1A'
        }}>
            <span className="text-base md:text-lg font-bold text-white">{order.id}</span>
            <span className="text-[10px] md:text-xs text-white/40">000</span>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5 md:py-1">
            {/* Row 1: Name + Table | Server (center) | Status */}
            <div className="flex items-center text-xs md:text-sm">
              <div className="flex items-center gap-1 md:gap-2 w-[170px] md:w-[220px] flex-shrink-0">
                <span className="text-white font-medium truncate">{order.name}</span>
                <span className="text-white/60">·</span>
                <span className="text-white font-medium">{formatTableName(order.table)}</span>
              </div>
              <div className="flex-1">
                <span className="text-white/60 truncate">{order.server}</span>
              </div>
              <span className={`font-semibold uppercase flex-shrink-0 ${getStatusColor(order.status)}`}>
                {order.status}
              </span>
            </div>
            
            {/* Row 2: Party info | Timer | Total */}
            <div className="flex items-center text-xs md:text-sm">
              <div className="flex items-center gap-1 text-white/60 w-[170px] md:w-[220px] flex-shrink-0">
                <img src={dineInIcon} alt="Dine In" className="w-3 h-3 md:w-4 md:h-4 object-contain opacity-60" />
                <span className="truncate">Party of {order.partySize}, {order.time}</span>
                <span className="text-white/40">|</span>
                <span>{order.timer}</span>
              </div>
              <div className="flex-1"></div>
              <span className="text-white font-semibold flex-shrink-0">{getOrderAmount(order)}</span>
            </div>
            
            {/* Row 3: Revenue Center | Payment Status (center) | Tip */}
            <div className="flex items-center text-xs md:text-sm">
              <span className="text-white font-medium w-[170px] md:w-[220px] flex-shrink-0 truncate">{order.revenueCenter}</span>
              <div className="flex-1">
                <span className="text-white/60 truncate">{order.status === 'Paid' || order.status === 'Completed' ? 'Paid' : 'Un Paid'}</span>
              </div>
              <span className="text-white flex-shrink-0">$0.00</span>
            </div>
          </div>
        </div>
      </div>
    </div>;

  // Desktop layout
  const DesktopLayout = () => {
    const availableTables = getAvailableTables();
    
    return (
      <div className="h-full w-full flex bg-black">
        {/* Left Panel */}
        <div className="flex-1 flex flex-col mx-2 mb-2 rounded-[20px] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-2 border-b border-neutral-700/50">
            <div className="flex items-center gap-3">
              <button onClick={() => {
              if (desktopStep === "select-table") {
                  if (!isEntireOrderTransfer) {
                    setDesktopStep("select-items");
                    setSelectedTargetTable(null);
                  } else {
                    handleBack();
                  }
                } else {
                  handleBack();
                }
              }} className="p-2 rounded-full hover:opacity-80 transition-opacity" style={{
                background: "#7575754D",
                boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)"
              }}>
                <ChevronLeft className="w-5 h-5 text-white" />
              </button>
              <h1 className="text-white text-lg font-semibold">
                {desktopStep === "select-items" ? "Transfer Check" : "Transfer to Table"}
              </h1>
            </div>
          </div>

        {/* Step 1: Select Items */}
        {desktopStep === "select-items" && <>
            {/* Current Order - Extended Card */}
            <div className="px-3 py-3">
              <DesktopCurrentOrderCard order={currentOrder} />
            </div>

            {/* Select Items Section */}
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

            {/* Items List */}
            <ScrollArea className="flex-1 px-3">
              <div className="space-y-2 pb-3">
                {currentOrder.items.map((item, index) => {
              const isSelected = selectedItems.includes(index);
              const selectedQty = itemQuantities[index] || item.qty;
              return <div key={index} className={`p-3 rounded-xl border transition-all cursor-pointer ${isSelected ? "border-orange-500 bg-orange-500/10" : "border-white/10 bg-white/5"}`} onClick={() => handleItemSelect(index)}>
                      <div className="flex items-start gap-3">
                        {/* Checkbox */}
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${isSelected ? "border-orange-500 bg-orange-500" : "border-white/40"}`}>
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </div>

                        {/* Item Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 bg-white rounded flex items-center justify-center text-black text-xs font-bold">
                                {item.qty}
                              </span>
                              <span className="text-white text-sm font-medium">{item.name}</span>
                            </div>
                            <span className="text-white text-sm font-medium">${(item.price * item.qty).toFixed(2)}</span>
                          </div>

                          {/* Modifiers */}
                          {item.modifiers.length > 0 && <div className="mt-1 ml-8 text-white/50 text-xs space-y-0.5">
                              {item.modifiers.map((mod, i) => <div key={i}>{mod}</div>)}
                            </div>}

                          {/* Quantity Selector - Only shown when selected */}
                          {isSelected && <div className="flex items-center justify-between mt-2 ml-8">
                              <div className="flex items-center gap-1 text-white/50 text-xs">
                                <img src={seatIcon} alt="Seat" className="w-3 h-3 opacity-50" />
                                <span>{item.seats.length > 0 ? item.seats.join(', ') : '-'}</span>
                              </div>
                              <select value={selectedQty} onChange={e => {
                        e.stopPropagation();
                        handleQuantityChange(index, parseInt(e.target.value));
                      }} onClick={e => e.stopPropagation()} className="bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-white text-sm min-w-[70px] focus:outline-none focus:border-orange-500">
                                {Array.from({
                          length: item.qty
                        }, (_, i) => i + 1).map(num => <option key={num} value={num} className="bg-gray-800 text-white">
                                    {num}
                                  </option>)}
                              </select>
                            </div>}

                          {/* Seat & Shared badges - Only when NOT selected */}
                          {!isSelected && <div className="flex items-center gap-2 mt-2 ml-8">
                              {item.seats.length > 0 && <div className="flex items-center gap-1">
                                  <img src={seatIcon} alt="Seat" className="w-3 h-3 opacity-50" />
                                  {item.seats.map(seat => <span key={seat} className="w-5 h-5 bg-white/10 rounded text-white text-xs flex items-center justify-center">
                                      {seat}
                                    </span>)}
                                </div>}
                              {item.isShared && <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-full">
                                  Shared
                                </span>}
                            </div>}
                        </div>
                      </div>
                    </div>;
            })}
              </div>
              <ScrollBar orientation="vertical" />
            </ScrollArea>

            {/* Bottom Button - Select Check */}
            {selectedItems.length > 0 && <div className="p-3 border-t border-white/10 flex gap-3">
                <button onClick={() => { setSelectedTransferOrderId(null); setShowTransferToOrder(true); }} className="flex-1 py-2 rounded-full text-white font-medium text-sm bg-neutral-800">
                  TRANSFER TO ORDER
                </button>
                <button onClick={() => setDesktopStep("select-table")} className="flex-1 py-2 rounded-full text-black font-medium text-sm" style={{
            background: "linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)"
          }}>
                  TRANSFER TO TABLE
                </button>
              </div>}
          </>}



        {/* Step 3: Select Table (for entire order transfer) */}
        {desktopStep === "select-table" && <>
            {/* Current Order Summary */}
            <div className="px-3 py-3">
              <div className="px-3 py-2 rounded-lg bg-neutral-800 border border-white/10">
                <p className="text-white/60 text-xs mb-1">Transferring from</p>
                <div className="flex items-center justify-between">
                  <span className="text-white font-medium">Order #{currentOrder.id} · {formatTableName(currentOrder.table)}</span>
                  <span className="text-white/60 text-sm">{isEntireOrderTransfer ? currentOrder.items.length : selectedItems.length} item{(isEntireOrderTransfer ? currentOrder.items.length : selectedItems.length) > 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>

            {/* Table Grid */}
            <ScrollArea className="flex-1 px-3">
              <div className="grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 pb-3 pt-2">
                {availableTables.map((table) => {
                  const config = statusConfig[table.status] || statusConfig["Available"];
                  const dotColor = getSeatDotColor(table.status);
                  const isSelected = selectedTargetTable === table.id;
                  const isCurrentTable = table.id === tableId;
                  
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
                      {/* Table Number */}
                      <span className="text-2xl font-bold text-white mb-1">{table.id}</span>
                      
                      {/* Seats */}
                      <span className="text-gray-400 text-sm mb-2">{table.seats} Seats</span>
                      
                      {/* Seat Dots */}
                      <div className="flex gap-1 mb-2">
                        {Array.from({ length: Math.min(table.seats, 6) }).map((_, i) => (
                          <div key={i} className={`w-2 h-2 flex-shrink-0 rounded-full ${dotColor}`} />
                        ))}
                        {table.seats > 6 && <span className="text-xs text-gray-500">+{table.seats - 6}</span>}
                      </div>
                      
                      <div className="mt-auto w-full">
                        {/* Time */}
                        <div className="flex justify-end mb-1 min-h-[1rem] px-1">
                          {table.time && (
                            <span className="text-gray-500 text-xs">{table.time}</span>
                          )}
                        </div>
                        
                        {/* Status Label */}
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

            {/* Confirm Button */}
            <div className="p-3 border-t border-white/10 flex gap-3">
              <button onClick={() => { setSelectedTransferOrderId(null); setShowTransferToOrder(true); }} className="flex-1 py-2 rounded-full text-white font-medium text-sm bg-neutral-800">
                TRANSFER TO ORDER
              </button>
              <button 
                onClick={handleConfirmTableTransfer} 
                disabled={!selectedTargetTable}
                className={`flex-1 py-2 rounded-full font-medium text-sm ${
                  selectedTargetTable 
                    ? "text-black" 
                    : "text-white/40 bg-white/10"
                }`} 
                style={selectedTargetTable ? {
                  background: "linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)"
                } : undefined}
              >
                CONFIRM TRANSFER TO {selectedTargetTable ? formatTableName(selectedTargetTable).toUpperCase() : 'TABLE'}
              </button>
            </div>
          </>}
      </div>

      {/* Right Panel - Order Details */}
      <OrderDetailsPanel />
    </div>
  );
  };
  
  return <div className="h-full flex flex-col bg-black">
      {/* Desktop Layout */}
      <div className="hidden lg:flex h-full w-full">
        <DesktopLayout />
      </div>

      {/* Mobile/Tablet Layout */}
      <div className="flex flex-col flex-1 min-h-0 lg:hidden overflow-hidden">
      {step === "select-items" && <MobileSelectItemsView />}
        {step === "select-table" && <MobileTableSelectionView />}
      </div>

      {/* Select Check Button - Fixed above bottom nav (Mobile) */}
      {step === "select-items" && selectedItems.length > 0 && !showTargetSheet && <div className="fixed bottom-14 left-0 right-0 px-4 py-2 bg-black lg:hidden flex gap-3">
          <button onClick={() => { setSelectedTransferOrderId(null); setShowTransferToOrder(true); }} className="flex-1 py-2 rounded-full text-white font-medium text-sm bg-neutral-800">
            TRANSFER TO ORDER
          </button>
          <button onClick={handleProceedToTargetSelection} className="flex-1 py-2 rounded-full text-black font-medium text-sm" style={{
        background: "linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)"
      }}>
             TRANSFER TO TABLE
           </button>
         </div>}

      {/* Table Selection CTAs - Fixed above bottom nav (Mobile) */}
      {step === "select-table" && <div className="fixed bottom-14 left-0 right-0 px-4 py-2 bg-black lg:hidden flex gap-3">
          <button onClick={() => { setSelectedTransferOrderId(null); setShowTransferToOrder(true); }} className="flex-1 py-2 rounded-full text-white font-medium text-sm bg-neutral-800">
            TRANSFER TO ORDER
          </button>
          <button 
            onClick={handleConfirmTableTransfer} 
            disabled={!selectedTargetTable}
            className={`flex-1 py-2 rounded-full font-medium text-sm ${
              selectedTargetTable 
                ? "text-black" 
                : "text-white/40 bg-white/10"
            }`} 
            style={selectedTargetTable ? {
              background: "linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)"
            } : undefined}
          >
            CONFIRM TRANSFER
          </button>
        </div>}

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
            <AlertDialogCancel className="bg-neutral-800 text-white border-none hover:bg-neutral-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={executeTableTransfer}
              className="text-black"
              style={{ background: "linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)" }}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Ticket Selection Dialog - for occupied tables */}
      <Dialog open={showTicketSelection} onOpenChange={setShowTicketSelection}>
        <DialogContent className="bg-neutral-900 border-white/10 p-0 max-w-lg overflow-hidden">
          <div className="p-4 border-b border-white/10">
            <h2 className="text-white text-lg font-semibold">
              Transfer to {formatTableName(selectedTargetTable || '')}
            </h2>
            <p className="text-white/50 text-sm mt-1">
              Select an active ticket or create a new order
            </p>
          </div>
          
          <ScrollArea className="max-h-[60vh]">
            <div className="p-4 space-y-3">
              {/* Transfer to New Order option - shown first */}
              <button
                onClick={() => setSelectedTicketOrderId('__new__')}
                className={`w-full rounded-xl border overflow-hidden text-left transition-all ${
                  selectedTicketOrderId === '__new__' ? 'border-white ring-1 ring-white/30' : 'border-white/[0.25] hover:border-white/40'
                }`}
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
                .filter(o => o.status !== "PAID" && o.status !== "Completed")
                .map((order) => {
                  const totals = calculateOrderTotals(order.items, order.tipAmount || 0);
                  const isSelected = selectedTicketOrderId === order.id;
                  return (
                    <button
                      key={order.id}
                      onClick={() => setSelectedTicketOrderId(order.id)}
                      className={`w-full rounded-xl border overflow-hidden text-left transition-all ${
                        isSelected ? 'border-white ring-1 ring-white/30' : 'border-white/[0.25] hover:border-white/40'
                      }`}
                      style={{ backgroundColor: '#1B1C20' }}
                    >
                      {/* Order header via OrderLayoutTemplate */}
                      <div className="border-b border-white/10">
                        <OrderLayoutTemplate order={toOrderTemplateData(order)} showBorder={false} />
                      </div>
                      
                      {/* Full item list */}
                      <div className="px-3 py-2 space-y-1">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between py-1">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <span className="w-5 h-5 rounded bg-neutral-700 text-white text-[10px] font-medium flex items-center justify-center flex-shrink-0">
                                {item.qty}
                              </span>
                              <span className="text-white text-xs truncate">{item.name}</span>
                            </div>
                            <span className="text-white/70 text-xs font-medium flex-shrink-0 ml-2">
                              {formatPrice(item.price * item.qty)}
                            </span>
                          </div>
                        ))}
                      </div>
                      
                      {/* Order total */}
                      <div className="px-3 py-2 border-t border-white/10 flex items-center justify-between">
                        <span className="text-white/50 text-xs">{order.items.length} items</span>
                        <span className="text-white font-semibold text-sm">{formatPrice(totals.total)}</span>
                      </div>
                    </button>
                  );
                })}
            </div>
          </ScrollArea>
          
          {/* Footer buttons */}
          <div className="p-4 border-t border-white/10 flex gap-3">
            <button 
              onClick={() => setShowTicketSelection(false)}
              className="flex-1 py-2.5 rounded-full font-medium text-sm bg-neutral-800 text-white hover:bg-neutral-700"
            >
              Cancel
            </button>
            <button 
              onClick={() => {
                if (selectedTicketOrderId) {
                  executeTransferToTicket();
                }
              }}
              disabled={!selectedTicketOrderId}
              className={`flex-1 py-2.5 rounded-full font-medium text-sm ${
                selectedTicketOrderId ? 'text-black' : 'text-black/50 opacity-50'
              }`}
              style={selectedTicketOrderId ? { background: "linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)" } : { background: '#555' }}
            >
              Confirm Transfer
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Transfer to Order Dialog - shows all active orders */}
      <Dialog open={showTransferToOrder} onOpenChange={(open) => { if (!open && targetMode === 'order') { navigate(`/tableorder/${tableId}`); } setShowTransferToOrder(open); }}>
        <DialogContent className="bg-neutral-900 border-white/10 p-0 max-w-lg overflow-hidden">
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
                  className={`w-full rounded-xl border overflow-hidden text-left transition-all ${
                    selectedTransferOrderId === '__new__' ? 'border-white ring-1 ring-white/30' : 'border-white/[0.25] hover:border-white/40'
                  }`}
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
              {/* All active orders (excluding current, paid, completed) */}
              {availableOrders.map((order) => {
                const totals = calculateOrderTotals(order.items, order.tipAmount || 0);
                const isSelected = selectedTransferOrderId === order.id;
                return (
                  <button
                    key={order.id}
                    onClick={() => setSelectedTransferOrderId(order.id)}
                    className={`w-full rounded-xl border overflow-hidden text-left transition-all ${
                      isSelected ? 'border-white ring-1 ring-white/30' : 'border-white/[0.25] hover:border-white/40'
                    }`}
                    style={{ backgroundColor: '#1B1C20' }}
                  >
                    {/* Order header */}
                    <div className="border-b border-white/10">
                      <OrderLayoutTemplate order={toOrderTemplateData(order)} showBorder={false} />
                    </div>
                    
                    {/* Item list */}
                    <div className="px-3 py-2 space-y-1">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between py-1">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span className="w-5 h-5 rounded bg-neutral-700 text-white text-[10px] font-medium flex items-center justify-center flex-shrink-0">
                              {item.qty}
                            </span>
                            <span className="text-white text-xs truncate">{item.name}</span>
                          </div>
                          <span className="text-white/70 text-xs font-medium flex-shrink-0 ml-2">
                            {formatPrice(item.price * item.qty)}
                          </span>
                        </div>
                      ))}
                    </div>
                    
                    {/* Order total */}
                    <div className="px-3 py-2 border-t border-white/10 flex items-center justify-between">
                      <span className="text-white/50 text-xs">{order.items.length} items</span>
                      <span className="text-white font-semibold text-sm">{formatPrice(totals.total)}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
          
          {/* Footer buttons */}
          <div className="p-4 border-t border-white/10 flex gap-3">
            <button 
              onClick={() => { if (targetMode === 'order') { navigate(`/tableorder/${tableId}`); } setShowTransferToOrder(false); }}
              className="flex-1 py-2.5 rounded-full font-medium text-sm bg-neutral-800 text-white hover:bg-neutral-700"
            >
              Cancel
            </button>
            <button 
              onClick={() => {
                if (selectedTransferOrderId) {
                  executeTransferToOrder();
                }
              }}
              disabled={!selectedTransferOrderId}
              className={`flex-1 py-2.5 rounded-full font-medium text-sm ${
                selectedTransferOrderId ? 'text-black' : 'text-black/50 opacity-50'
              }`}
              style={selectedTransferOrderId ? { background: "linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)" } : { background: '#555' }}
            >
              Confirm Transfer
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent className="bg-neutral-900 border-white/10 p-0 max-w-2xl overflow-hidden">
          {/* Title */}
          <h2 className="text-white text-xl font-semibold text-center pt-4 pb-4">Transfer Items</h2>

          {/* From Order with Items Being Transferred */}
          <div className="px-6 pb-4">
            <p className="text-amber-400 text-lg font-medium mb-2">From</p>
            <div className="rounded-xl border border-white overflow-hidden" style={{
            backgroundColor: '#1B1C20'
          }}>
              {fromOrder && <div className="border-b border-white/10">
                  <OrderLayoutTemplate order={toOrderTemplateData(fromOrder)} showBorder={false} />
                </div>}
              {/* Items Being Transferred - Inside the order card */}
              <div className="px-2 py-1.5 bg-neutral-800/30">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-orange-400 text-[10px] font-medium uppercase tracking-wide">Items Transferring</p>
                  <span className="text-orange-400 font-medium text-xs">
                    {selectedItems.length} items · ${selectedItems.reduce((sum, index) => {
                    const item = currentOrder.items[index];
                    const qty = itemQuantities[index] || item.qty;
                    return sum + item.price * qty;
                  }, 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {selectedItems.map(index => {
                  const item = currentOrder.items[index];
                  const qty = itemQuantities[index] || item.qty;
                  return <div key={index} className="flex items-center gap-1 bg-neutral-700/50 rounded px-1.5 py-0.5">
                        <span className="w-4 h-4 bg-orange-500 rounded text-white text-[9px] font-bold flex items-center justify-center">
                          {qty}
                        </span>
                        <span className="text-white text-[11px]">{item.name}</span>
                      </div>;
                })}
                </div>
              </div>
            </div>
          </div>

          {/* Transfer Direction Indicator */}
          <div className="flex justify-center py-2">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-neutral-800 border border-white/20">
              <ArrowDown className="w-4 h-4 text-white" />
            </div>
          </div>

          {/* To Order */}
          <div className="px-6 pb-6">
            <p className="text-emerald-400 text-lg font-medium mb-2">To</p>
            {toOrder && <OrderLayoutTemplate order={toOrderTemplateData(toOrder)} />}
          </div>

          {/* Bottom Buttons */}
          <div className="px-6 pb-6 flex gap-3">
            <button onClick={() => setIsConfirmDialogOpen(false)} className="px-6 py-2 rounded-full text-white font-medium text-sm bg-neutral-800">
              CANCEL
            </button>
            <button onClick={handleFinalConfirm} className="flex-1 py-2 rounded-full text-black font-medium text-sm" style={{
            background: "linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)"
          }}>
              CONFIRM TRANSFER
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={isSuccessDialogOpen} onOpenChange={(open) => {
        if (!open) {
          // When closing, navigate to destination table order details
          const itemNames = selectedItems.map(index => currentOrder.items[index].name).join(',');
          const isFullTransfer = selectedItems.length === currentOrder.items.length;
          const transferParams = new URLSearchParams({
            // Destination params (receiving items)
            transferred: currentOrder.id,
            transferFrom: currentOrder.table,
            transferDest: toOrder?.id || '',
            items: itemNames,
            // Source params (sending items out)
            transferSource: currentOrder.id,
            transferType: isFullTransfer ? 'full' : 'partial',
            transferredTo: toOrder?.id || '',
            transferToTable: toOrder?.table?.replace('T', '') || ''
          });
          navigate(`/tableorder/${toOrder?.table}?${transferParams.toString()}`);
        }
        setIsSuccessDialogOpen(open);
      }}>
        <DialogContent className="bg-neutral-900 border-white/10 p-0 max-w-sm rounded-2xl overflow-hidden">
          {/* Header with close button */}
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <h2 className="text-white text-lg font-semibold">Items Transferred</h2>
            <button 
              onClick={() => {
                const itemNames = selectedItems.map(index => currentOrder.items[index].name).join(',');
                const isFullTransfer = selectedItems.length === currentOrder.items.length;
                const transferParams = new URLSearchParams({
                  // Destination params (receiving items)
                  transferred: currentOrder.id,
                  transferFrom: currentOrder.table,
                  transferDest: toOrder?.id || '',
                  items: itemNames,
                  // Source params (sending items out)
                  transferSource: currentOrder.id,
                  transferType: isFullTransfer ? 'full' : 'partial',
                  transferredTo: toOrder?.id || '',
                  transferToTable: toOrder?.table?.replace('T', '') || ''
                });
                navigate(`/tableorder/${toOrder?.table}?${transferParams.toString()}`);
                setIsSuccessDialogOpen(false);
              }}
              className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
          
          {/* Transfer Summary */}
          <div className="px-4 pb-4">
            <p className="text-white/60 text-sm mb-3">
              From <span className="text-amber-400">Order #{currentOrder.id}</span> to <span className="text-emerald-400">Order #{toOrder?.id} on {formatTableName(toOrder?.table || '')}</span>
            </p>
            
            {/* Transferred Items List */}
            <div className="bg-white/5 rounded-xl p-3 space-y-2">
              {selectedItems.map((itemIndex) => {
                const item = currentOrder.items[itemIndex];
                return (
                  <div key={itemIndex} className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-white/40 text-sm">{item.qty}x</span>
                      <span className="text-white text-sm">{item.name}</span>
                    </div>
                    <span className="text-white/60 text-sm">{item.price}</span>
                  </div>
                );
              })}
            </div>
            
            {/* Total Items Count */}
            <p className="text-white/40 text-xs mt-3 text-center">
              {selectedItems.length} item{selectedItems.length > 1 ? 's' : ''} transferred successfully
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Entire Order Transfer Confirmation Dialog */}
      <Dialog open={isEntireOrderConfirmOpen} onOpenChange={setIsEntireOrderConfirmOpen}>
        <DialogContent className="bg-neutral-900 border-white/10 p-0 max-w-md overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <h2 className="text-white text-lg font-semibold">Transfer Entire Order</h2>
            <button 
              onClick={() => setIsEntireOrderConfirmOpen(false)}
              className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
          
          {/* Content */}
          <div className="px-4 pb-4">
            {/* From/To Summary */}
            <div className="mb-4">
              <p className="text-white/60 text-sm">
                From <span className="text-amber-400">Order #{currentOrder.id} · {formatTableName(currentOrder.table)}</span>
              </p>
              <p className="text-white/60 text-sm mt-1">
                To <span className="text-emerald-400">Order #{toOrder?.id} · {formatTableName(toOrder?.table || '')}</span>
              </p>
            </div>
            
            {/* Warning/Info */}
            <div className="bg-white/5 rounded-xl p-3 mb-4">
              <p className="text-white/80 text-sm leading-relaxed">
                All items, modifiers, notes, discounts, and charges will be transferred together.
              </p>
            </div>
            
            {/* Items Preview */}
            <div className="bg-white/5 rounded-xl p-3 mb-4 max-h-[120px] overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
              <p className="text-white/50 text-xs mb-2">{currentOrder.items.length} items</p>
              <div className="space-y-1">
                {currentOrder.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-white/40">{item.qty}x</span>
                      <span className="text-white truncate">{item.name}</span>
                    </div>
                    <span className="text-white/60">${(item.price * item.qty).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Bottom Buttons */}
          <div className="px-4 pb-4 flex gap-3">
            <button 
              onClick={() => setIsEntireOrderConfirmOpen(false)} 
              className="px-6 py-2.5 rounded-full text-white font-medium text-sm bg-neutral-800 hover:bg-neutral-700 transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleEntireOrderConfirm} 
              className="flex-1 py-2.5 rounded-full text-black font-medium text-sm" 
              style={{ background: "linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)" }}
            >
              Confirm Transfer
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>;
};
export default TransferOrders;