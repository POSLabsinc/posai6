import { useState, useMemo, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ChevronLeft, ArrowUpDown, SlidersHorizontal, Search, Phone } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import OrderLayoutTemplate from "@/components/OrderLayoutTemplate";
import OrderSummary from "@/components/OrderSummary";
import { getOrderStatusColor, formatTableName, formatPrice, calculateOrderTotals } from "@/lib/orderUtils";
import { useTicketOrders, UnifiedTicketOrder } from "@/hooks/use-ticket-orders";
import { useToast } from "@/hooks/use-toast";

// Import icons
import clearIcon from "@/assets/icons/clear-c.png";
import fireIcon from "@/assets/icons/fire.png";
import tableTargetIcon from "@/assets/icons/table-target.png";
import shareSeatsIcon from "@/assets/icons/share-seats.png";
import seatIcon from "@/assets/icons/seat-icon.png";
import splitIcon from "@/assets/icons/split-icon.png";
import dineInIcon from "@/assets/icons/dine-in.png";

// Helper: convert DB order to OrderLayoutTemplate format
const toOrderTemplateData = (order: UnifiedTicketOrder) => ({
  id: order.orderNumber || 0,
  name: order.name,
  table: order.table,
  amount: formatPrice(order.total),
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

// Helper to get order totals
const getOrderTotals = (order: UnifiedTicketOrder) => {
  return calculateOrderTotals(
    order.items.map(i => ({ qty: i.qty, price: i.price })),
    order.tip || 0
  );
};

const getOrderAmount = (order: UnifiedTicketOrder) => formatPrice(order.total);

const mergeFilters = ["All", "Ordering", "Ordered", "Preparing", "Unpaid"];
type MergeStep = "select" | "confirm-direction";

const MergeOrders = () => {
  const navigate = useNavigate();
  const { tableId } = useParams();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId");
  const { toast } = useToast();

  const { orders: allOrders, updateOrder, updateOrderItems, removeOrder, isLoading } = useTicketOrders();

  const [step, setStep] = useState<MergeStep>("select");
  const [activeFilter, setActiveFilter] = useState("All");
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [fromOrder, setFromOrder] = useState<UnifiedTicketOrder | null>(null);
  const [toOrder, setToOrder] = useState<UnifiedTicketOrder | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [displayedOrder, setDisplayedOrder] = useState<UnifiedTicketOrder | null>(null);
  const [isMerging, setIsMerging] = useState(false);

  const toggleOrderExpand = (orderId: string) => {
    setExpandedOrderId(prev => prev === orderId ? null : orderId);
  };

  // Get the current order being merged (from the table we came from)
  const currentOrder = useMemo(() =>
    allOrders.find(o => o.id === orderId),
    [allOrders, orderId]
  );

  // Dynamic seats based on current panel order's party size
  const panelPartySize = (displayedOrder || currentOrder)?.partySize || 4;
  const allSeats = useMemo(() => Array.from({ length: panelPartySize }, (_, i) => i + 1), [panelPartySize]);
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);

  // Auto-select all seats when panel order changes
  useMemo(() => {
    setSelectedSeats(allSeats);
  }, [allSeats]);

  // Order to show in right panel
  const panelOrder = displayedOrder || currentOrder;

  // Filter only active orders (non-PAID/COMPLETED) excluding the current order
  // Only show orders that have a table assigned (table orders) for merging
  const availableOrders = useMemo(() =>
    allOrders.filter(o => 
      o.id !== orderId && 
      o.status !== "PAID" && 
      o.status.toUpperCase() !== "COMPLETED" &&
      o.table && o.table !== '--' && o.table !== ''
    ),
    [allOrders, orderId]
  );

  const filteredOrders = useMemo(() =>
    activeFilter === "All" ? availableOrders : availableOrders.filter(o => o.status === activeFilter.toUpperCase()),
    [availableOrders, activeFilter]
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ORDERING": return "text-red-500";
      case "ORDERED": return "text-orange-500";
      case "PREPARING": return "text-yellow-500";
      case "COMPLETED": return "text-green-500";
      default: return "text-white/60";
    }
  };

  const handleOrderSelect = (order: UnifiedTicketOrder) => {
    setDisplayedOrder(order);
    if (selectedOrders.includes(order.id)) {
      setSelectedOrders(selectedOrders.filter(id => id !== order.id));
    } else {
      setSelectedOrders([...selectedOrders, order.id]);
    }
  };

  const handleProceedToDirection = () => {
    if (selectedOrders.length > 0) {
      const selectedOrder = allOrders.find(o => o.id === selectedOrders[0]);
      if (selectedOrder) {
        setFromOrder(selectedOrder);
        setToOrder(currentOrder);
        setStep("confirm-direction");
      }
    }
  };

  const handleSwapDirection = () => {
    const temp = fromOrder;
    setFromOrder(toOrder);
    setToOrder(temp);
  };

  const handleFinalConfirm = async () => {
    if (!fromOrder || !toOrder || isMerging) return;
    setIsMerging(true);
    try {
      // Combine items: destination items + source items
      const combinedItems = [...toOrder.items, ...fromOrder.items];

      // Update destination order with combined items
      await updateOrderItems(toOrder.id, combinedItems);

      // Recalculate totals for combined items
      const totals = calculateOrderTotals(
        combinedItems.map(i => ({ qty: i.qty, price: i.price })),
        toOrder.tip || 0
      );

      // Update destination order with new totals and merge metadata
      await updateOrder(toOrder.id, {
        subtotal: totals.subtotal,
        discount: totals.discount,
        serviceCharge: totals.serviceCharge,
        tax: totals.tax,
        total: totals.total,
        mergedFrom: {
          orderId: fromOrder.id,
          orderNumber: fromOrder.orderNumber,
          name: fromOrder.name,
          table: fromOrder.table,
          mergedAt: new Date().toISOString(),
        },
      });

      // Remove source order
      await removeOrder(fromOrder.id);

      toast({
        title: "Orders Merged",
        description: `Order #${fromOrder.orderNumber} merged into Order #${toOrder.orderNumber}`,
      });

      setIsConfirmDialogOpen(false);
      navigate(`/tableorder/${tableId}`);
    } catch (err) {
      console.error("Merge failed:", err);
      toast({
        title: "Merge Failed",
        description: "Could not merge orders. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsMerging(false);
    }
  };

  const handleBack = () => {
    if (step === "confirm-direction") {
      setStep("select");
    } else {
      navigate(`/tableorder/${tableId}`);
    }
  };

  const getFilterCount = (filter: string) => {
    if (filter === "All") return availableOrders.length;
    return availableOrders.filter(o => o.status === filter.toUpperCase()).length;
  };

  // Display order number (sequential) or fallback
  const displayOrderNum = (order: UnifiedTicketOrder) => order.orderNumber || 0;

  if (isLoading || !currentOrder) {
    return (
      <div className="h-full flex items-center justify-center bg-black">
        <span className="text-white/60">Loading orders...</span>
      </div>
    );
  }

  // Render order card for mobile
  const OrderCard = ({
    order,
    isSelected,
    onClick,
    showCheckbox = true,
    showExpand = true
  }: {
    order: UnifiedTicketOrder;
    isSelected: boolean;
    onClick?: () => void;
    showCheckbox?: boolean;
    showExpand?: boolean;
  }) => <div className="rounded-xl overflow-hidden">
      <div className={`flex items-stretch w-full gap-2 border rounded-t-xl ${showExpand && expandedOrderId === order.id ? '' : 'rounded-b-xl'} bg-neutral-900 cursor-pointer transition-colors ${isSelected ? "border-white" : "border-white/10"}`} onClick={onClick}>
        {showCheckbox && <div className="flex-shrink-0 px-2 flex items-center">
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected ? "border-orange-500 bg-orange-500" : "border-white/40"}`}>
              {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
            </div>
          </div>}

        {/* Order Number Column - Mobile */}
        <div className={`flex-shrink-0 ${showCheckbox ? '' : 'px-2'} py-2 flex items-center md:hidden`}>
          <div className="relative w-10 h-12 bg-neutral-800 rounded-lg flex flex-col items-center justify-center border border-neutral-600">
            <span className="text-lg font-bold text-white">{displayOrderNum(order)}</span>
            <span className="text-[9px] text-gray-500">{order.check || '000'}</span>
          </div>
        </div>
        
        {/* Order Number Column - Desktop */}
        <div className={`hidden md:flex flex-shrink-0 ${showCheckbox ? '' : 'px-2'} py-2 items-center`}>
          <div className="relative w-10 h-14 bg-neutral-800 rounded-lg flex flex-col items-center justify-center gap-1 border border-neutral-600">
            <span className="text-base font-bold text-white">{displayOrderNum(order)}</span>
            <img src={tableTargetIcon} alt="Table" className="w-4 h-4 object-contain" />
          </div>
        </div>

        {/* Guest Info - Mobile */}
        <div className="flex-1 min-w-0 py-2 pr-2 md:hidden">
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-white font-medium text-sm">{order.name} · {formatTableName(order.table)} · {order.revenueCenter || 'FF Balcony'}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm" style={{ color: '#B5B6BB' }}>{order.server || 'Server'}</span>
                <span className={`text-sm font-medium ${getStatusColor(order.status)}`}>{order.status}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-xs" style={{ color: '#B5B6BB' }}>
                <img src={dineInIcon} alt="Dine In" className="w-3 h-3 object-contain opacity-60" />
                <span>Party of {order.partySize}, {order.time}</span>
                <span className="text-gray-500">|</span>
                <span>{order.timer}</span>
              </div>
              <span className="text-white font-semibold text-sm">{getOrderAmount(order)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: '#B5B6BB' }}>Un Paid</span>
              <span className="text-white text-sm">$0.00</span>
            </div>
          </div>
        </div>

        {/* Guest Info - Desktop */}
        <div className="hidden md:flex flex-1 min-w-0 flex-col justify-between py-1 pr-3">
          <div className="flex items-center text-xs md:text-sm">
            <div className="w-[45%] text-left">
              <span className="text-white font-medium truncate">{order.name} · {formatTableName(order.table)}</span>
            </div>
            <div className="w-[35%] text-left pl-4">
              <span className="text-white/60 truncate">{order.server}</span>
            </div>
            <div className="w-[20%] text-right">
              <span className={`font-semibold uppercase ${getStatusColor(order.status)}`}>{order.status}</span>
            </div>
          </div>
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

      {/* Expanded Details */}
      {showExpand && expandedOrderId === order.id && <div className="mx-2 px-3 pb-3 rounded-b-lg" style={{ background: "#7575754D" }}>
          <div className="grid grid-cols-3 gap-3 py-3">
            <div>
              <div className="text-white text-sm font-medium">{order.timer}</div>
              <div className="text-gray-500 text-xs">Timer</div>
            </div>
            <div>
              <div className="text-white text-sm font-medium">{order.check}</div>
              <div className="text-gray-500 text-xs">Check</div>
            </div>
            <div>
              <div className="text-white text-sm font-medium">{order.server}</div>
              <div className="text-gray-500 text-xs">Server</div>
            </div>
            <div>
              <div className="text-white text-sm">{order.revenueCenter}</div>
              <div className="text-gray-500 text-xs">Revenue Center</div>
            </div>
            <div>
              <div className="text-white text-sm font-medium">{order.paymentType}</div>
              <div className="text-gray-500 text-xs">Payment Type</div>
            </div>
            <div>
              <div className="text-white text-sm">--</div>
              <div className="text-gray-500 text-xs">Tip</div>
            </div>
          </div>
          {(() => {
            const totals = getOrderTotals(order);
            return <OrderSummary totals={totals} variant="compact" />;
          })()}
        </div>}
    </div>;

  // Desktop current order card
  const DesktopCurrentOrderCard = ({ order }: { order: UnifiedTicketOrder }) => <div className="rounded-xl border border-white overflow-hidden" style={{ backgroundColor: '#1B1C20' }}>
      <div className="flex items-stretch w-full">
        <div className="flex-1 flex items-stretch gap-2 md:gap-3 p-2 md:p-3">
          <div className="flex-shrink-0 flex flex-col items-center justify-center w-12 md:w-14 rounded-lg border border-white/20 py-1.5 md:py-2 gap-0.5 md:gap-1" style={{ background: '#1A1A1A' }}>
            <span className="text-base md:text-lg font-bold text-white">{displayOrderNum(order)}</span>
            <span className="text-[10px] md:text-xs text-white/40">{order.check || '000'}</span>
          </div>
          <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5 md:py-1">
            <div className="flex items-center text-xs md:text-sm">
              <div className="w-[45%] text-left">
                <span className="text-white font-medium truncate">{order.name} · {formatTableName(order.table)}</span>
              </div>
              <div className="w-[35%] text-left pl-4">
                <span className="text-white/60 truncate">{order.server}</span>
              </div>
              <div className="w-[20%] text-right">
                <span className={`font-semibold uppercase ${getStatusColor(order.status)}`}>{order.status}</span>
              </div>
            </div>
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

  // Desktop order list card
  const DesktopOrderListCard = ({
    order,
    isSelected,
    onClick
  }: {
    order: UnifiedTicketOrder;
    isSelected: boolean;
    onClick?: () => void;
  }) => <div className={`rounded-xl border cursor-pointer transition-all overflow-hidden ${isSelected ? "border-orange-500" : "border-neutral-700 hover:border-neutral-600"}`} style={{ backgroundColor: '#1B1C20' }} onClick={onClick}>
      <div className="flex items-stretch w-full">
        <div className="flex-1 flex items-stretch gap-2 md:gap-3 p-2 md:p-3">
          <div className="flex-shrink-0 flex flex-col items-center justify-center w-12 md:w-14 rounded-lg border border-white/20 py-1.5 md:py-2 gap-0.5 md:gap-1" style={{ background: '#1A1A1A' }}>
            <span className="text-base md:text-lg font-bold text-white">{displayOrderNum(order)}</span>
            <span className="text-[10px] md:text-xs text-white/40">{order.check || '000'}</span>
          </div>
          <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5 md:py-1">
            <div className="flex items-center text-xs md:text-sm">
              <div className="w-[45%] text-left">
                <span className="text-white font-medium truncate">{order.name} · {formatTableName(order.table)}</span>
              </div>
              <div className="w-[35%] text-left pl-4">
                <span className="text-white/60 truncate">{order.server}</span>
              </div>
              <div className="w-[20%] text-right">
                <span className={`font-semibold uppercase ${getStatusColor(order.status)}`}>{order.status}</span>
              </div>
            </div>
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

  // Right panel - Order details
  const OrderDetailsPanel = () => {
    if (!panelOrder) return null;
    return <div className="w-[345px] flex flex-col my-2 mr-2">
      {/* Guest Header */}
      <div className="px-2 py-2">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-white text-sm font-medium">{panelOrder.name}</span>
          <div className="flex items-center gap-2 text-white/50 text-xs">
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
        <div className="flex gap-1.5 flex-wrap">
          <button className="px-2 py-1 bg-neutral-700 text-white text-[10px] rounded-full hover:bg-neutral-600 transition-colors">Add Item</button>
          <button className="px-2 py-1 bg-neutral-700 text-white text-[10px] rounded-full hover:bg-neutral-600 transition-colors">Discount</button>
          <button className="px-2 py-1 bg-neutral-700 text-white text-[10px] rounded-full hover:bg-neutral-600 transition-colors">Receipt</button>
          <button className="px-2 py-1 bg-neutral-700 text-white text-[10px] rounded-full hover:bg-neutral-600 transition-colors">No Sale</button>
        </div>
      </div>

      {/* Main Panel Box */}
      <div className="flex-1 flex flex-col rounded-[10px] overflow-hidden" style={{ background: "#7575754D", boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)" }}>
        {/* Table Order Info */}
        <div className="px-3 py-2 border-b border-white/10">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 bg-white/10 text-white text-[10px] rounded">{formatTableName(panelOrder.table).toUpperCase()}</span>
              <span className="text-white text-sm font-bold">{displayOrderNum(panelOrder)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <img src={shareSeatsIcon} alt="Seats" className="w-3 h-3 opacity-60" />
              <span className="text-white/50 text-xs">{panelOrder.server}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button className="p-1 bg-white/10 rounded hover:bg-white/20 transition-colors">
              <img src={seatIcon} alt="Seat" className="w-3 h-3" />
            </button>
            <button className="p-1 bg-white/10 rounded hover:bg-white/20 transition-colors">
              <img src={splitIcon} alt="Split" className="w-3 h-3" />
            </button>
            {[1, 2, 3, 4].map(seat => <button key={seat} onClick={() => setSelectedSeats(prev => prev.includes(seat) ? prev.filter(s => s !== seat) : [...prev, seat])} className={`w-6 h-6 rounded text-xs font-medium transition-colors ${selectedSeats.includes(seat) ? "bg-white text-black" : "bg-white/10 text-white hover:bg-white/20"}`}>
                {seat}
              </button>)}
          </div>
        </div>

        {/* Notes */}
        <div className="px-3 py-2 border-b border-white/10">
          <div className="flex items-center gap-2 text-white/50 text-xs bg-white/10 px-2 py-1.5 rounded">
            <span>⚠️</span>
            <span>{panelOrder.notes || "No notes"}</span>
          </div>
        </div>

        {/* Order Items */}
        <ScrollArea className="flex-1 px-3">
          <div className="py-2 space-y-1.5">
            {panelOrder.items.map((item, index) => <div key={index} className="p-2 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 bg-white rounded flex items-center justify-center text-black text-xs font-bold">{item.qty}</span>
                    <div>
                      <span className="text-white text-sm">{item.name}</span>
                      {item.modifiers.length > 0 && <div className="mt-0.5 text-white/50 text-xs space-y-0">
                          {item.modifiers.map((mod, i) => <div key={i}>{mod}</div>)}
                        </div>}
                    </div>
                  </div>
                  <span className="text-white text-sm">${(item.price * item.qty).toFixed(2)}</span>
                </div>
                {item.seats.length > 0 && <div className="flex items-center gap-1 mt-1">
                    <img src={seatIcon} alt="Seat" className="w-3 h-3 opacity-50" />
                    {item.seats.map(seat => <span key={seat} className="w-4 h-4 bg-white/10 rounded text-white text-[10px] flex items-center justify-center">{seat}</span>)}
                  </div>}
              </div>)}
          </div>
          <ScrollBar orientation="vertical" />
        </ScrollArea>

        {/* Order Summary */}
        {(() => {
          const totals = getOrderTotals(panelOrder);
          return <div className="px-3 py-2 border-t border-white/10">
              <OrderSummary totals={totals} variant="detailed" />
            </div>;
        })()}

        {/* Bottom Actions */}
        {(() => {
          const totals = getOrderTotals(panelOrder);
          return <div className="px-3 py-2 border-t border-white/10 flex items-center gap-2">
              <button className="w-7 h-7 rounded-full bg-red-600 flex items-center justify-center hover:bg-red-500 transition-colors">
                <img src={clearIcon} alt="Clear" className="w-3 h-3 brightness-0 invert" />
              </button>
              <button disabled className="px-3 py-1.5 rounded-full flex items-center gap-1 text-white text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed" style={{ background: "linear-gradient(180deg, #FF9E65 0%, #FF5E00 100%)" }}>
                <img src={fireIcon} alt="Fire" className="w-3 h-3 brightness-0 invert" />
                <span>FIRE</span>
              </button>
              <button className="flex-1 py-1.5 rounded-full text-black text-xs font-bold" style={{ background: "linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)" }}>
                CHARGE ${totals.total.toFixed(2)}
              </button>
            </div>;
        })()}
      </div>
    </div>;
  };

  // Mobile Step 1: Select orders
  const MobileSelectOrdersView = () => <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      <div className="relative flex items-center justify-between p-4">
        <button onClick={handleBack} className="w-10 h-10 rounded-full flex items-center justify-center z-10" style={{ background: "#7575754D", boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)" }}>
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        <h1 className="absolute left-1/2 -translate-x-1/2 text-white text-xl font-medium">Merge</h1>
        <div className="flex items-center gap-2 z-10">
          <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <PopoverTrigger asChild>
              <button className="p-2 rounded-full hover:opacity-80 transition-opacity" style={{ background: "#7575754D", boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)" }}>
                <SlidersHorizontal className="w-5 h-5 text-white" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-2 bg-neutral-900 border border-white/10 rounded-xl" align="end">
              <div className="flex flex-col gap-1">
                {mergeFilters.map(filter => {
                  const count = getFilterCount(filter);
                  const isActive = activeFilter === filter;
                  return <button key={filter} onClick={() => { setActiveFilter(filter); setIsFilterOpen(false); }} className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${isActive ? "bg-white text-black" : "text-white hover:bg-neutral-800"}`}>
                    <span>{filter}</span>
                    <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${isActive ? "bg-black text-white" : "bg-neutral-700"}`}>{count}</span>
                  </button>;
                })}
              </div>
            </PopoverContent>
          </Popover>
          <button className="p-2 rounded-full hover:opacity-80 transition-opacity" style={{ background: "#7575754D", boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)" }}>
            <Search className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      <div className="px-4 pb-2">
        <OrderCard order={currentOrder} isSelected={true} showCheckbox={false} showExpand={true} />
      </div>

      <div className="px-4 py-2">
        <p className="text-white/80 text-sm">Choose Orders to Merge with Order {displayOrderNum(currentOrder)}</p>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide px-4 overscroll-contain touch-pan-y">
        <div className="flex flex-col gap-2 pb-24">
          {filteredOrders.map(order => <OrderCard key={order.id} order={order} isSelected={selectedOrders.includes(order.id)} onClick={() => handleOrderSelect(order)} showCheckbox={false} />)}
        </div>
      </div>
    </div>;

  // Desktop layout
  const DesktopLayout = () => <div className="h-full w-full flex bg-black">
      <div className="flex-1 flex flex-col m-2 rounded-[20px] overflow-hidden">
        <div className="flex items-center justify-between p-2 border-b border-neutral-700/50">
          <div className="flex items-center gap-3">
            <button onClick={handleBack} className="p-2 rounded-full hover:opacity-80 transition-opacity" style={{ background: "#7575754D", boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)" }}>
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <h1 className="text-white text-lg font-semibold">Merge</h1>
          </div>
        </div>

        <div className="px-3 py-3">
          <DesktopCurrentOrderCard order={currentOrder} />
        </div>

        <div className="px-3 pb-2">
          <p className="text-white/80 text-sm">Choose Orders to Merge with Order {displayOrderNum(currentOrder)}</p>
        </div>

        <div className="flex items-center gap-2 px-3 pb-3 overflow-x-auto">
          {mergeFilters.map(filter => {
            const count = getFilterCount(filter);
            const isActive = activeFilter === filter;
            return <button key={filter} onClick={() => setActiveFilter(filter)} className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5 ${isActive ? "text-black" : "text-white"}`} style={isActive ? { background: "linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)" } : { background: "#7575754D", boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)" }}>
              {filter}
              <span className={`font-bold ${isActive ? "text-black" : "text-white"}`}>{count}</span>
            </button>;
          })}
        </div>

        <ScrollArea className="flex-1 px-3">
          <div className="space-y-2 pb-3">
            {filteredOrders.map(order => <DesktopOrderListCard key={order.id} order={order} isSelected={selectedOrders.includes(order.id)} onClick={() => handleOrderSelect(order)} />)}
          </div>
          <ScrollBar orientation="vertical" />
        </ScrollArea>

        {selectedOrders.length > 0 && <div className="pt-4">
            <button onClick={() => {
              const selectedOrder = allOrders.find(o => o.id === selectedOrders[0]);
              if (selectedOrder) {
                setFromOrder(selectedOrder);
                setToOrder(currentOrder);
                setIsConfirmDialogOpen(true);
              }
            }} className="w-full py-2 rounded-full text-black font-medium text-sm" style={{ background: "linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)" }}>
              MERGE ORDER {displayOrderNum(currentOrder)}, {selectedOrders.map(id => { const o = allOrders.find(x => x.id === id); return o ? displayOrderNum(o) : id; }).join(", ")}
            </button>
          </div>}
      </div>

      <OrderDetailsPanel />
    </div>;

  // Mobile Step 2: Confirm direction
  const ConfirmDirectionView = () => <div className="flex flex-col h-full">
      <div className="flex justify-center pt-2 pb-2">
        <div className="w-10 h-1 bg-white/30 rounded-full" />
      </div>
      <h2 className="text-white text-xl font-semibold text-center pb-4">Merge</h2>
      <div className="px-4 pb-4">
        <p className="text-amber-400 text-sm font-medium mb-2">Merge</p>
        {fromOrder && <OrderLayoutTemplate order={toOrderTemplateData(fromOrder)} />}
      </div>
      <div className="flex justify-center py-2">
        <button onClick={handleSwapDirection} className="w-10 h-10 rounded-full flex items-center justify-center bg-neutral-800 border border-white/20">
          <ArrowUpDown className="w-4 h-4 text-white" />
        </button>
      </div>
      <div className="px-4 pb-4">
        <p className="text-emerald-400 text-sm font-medium mb-2">To</p>
        {toOrder && <OrderLayoutTemplate order={toOrderTemplateData(toOrder)} />}
      </div>
      <div className="flex-1" />
    </div>;

  return <div className="h-full flex flex-col bg-black">
      <div className="hidden lg:flex h-full w-full">
        <DesktopLayout />
      </div>

      <div className="flex flex-col flex-1 min-h-0 lg:hidden overflow-hidden">
        {step === "select" && <MobileSelectOrdersView />}
        {step === "confirm-direction" && <ConfirmDirectionView />}
      </div>

      {step === "select" && selectedOrders.length > 0 && <div className="fixed bottom-14 left-0 right-0 px-4 py-2 bg-black lg:hidden">
          <button onClick={handleProceedToDirection} className="w-full py-2 rounded-full text-black font-medium text-sm" style={{ background: "linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)" }}>
            MERGE ORDER {displayOrderNum(currentOrder)}, {selectedOrders.map(id => { const o = allOrders.find(x => x.id === id); return o ? displayOrderNum(o) : id; }).join(", ")}
          </button>
        </div>}

      {step === "confirm-direction" && <div className="fixed bottom-14 left-0 right-0 px-4 py-2 bg-black lg:hidden flex gap-3">
          <button onClick={() => setStep("select")} className="px-6 py-2 rounded-full text-white font-medium text-sm bg-neutral-800">CANCEL</button>
          <button onClick={handleFinalConfirm} disabled={isMerging} className="flex-1 py-2 rounded-full text-black font-medium text-sm disabled:opacity-50" style={{ background: "linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)" }}>
            {isMerging ? "MERGING..." : "CONFIRM MERGE"}
          </button>
        </div>}

      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent className="bg-neutral-900 border-white/10 p-0 max-w-2xl overflow-hidden">
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-10 h-1 bg-white/30 rounded-full" />
          </div>
          <h2 className="text-white text-xl font-semibold text-center pb-4">Merge Order</h2>
          <div className="px-6 pb-4">
            <p className="text-amber-400 text-lg font-medium mb-2">From</p>
            {fromOrder && <OrderLayoutTemplate order={toOrderTemplateData(fromOrder)} />}
          </div>
          <div className="flex justify-center py-2">
            <button onClick={handleSwapDirection} className="w-10 h-10 rounded-full flex items-center justify-center bg-neutral-800 border border-white/20">
              <ArrowUpDown className="w-4 h-4 text-white" />
            </button>
          </div>
          <div className="px-6 pb-6">
            <p className="text-emerald-400 text-lg font-medium mb-2">To</p>
            {toOrder && <OrderLayoutTemplate order={toOrderTemplateData(toOrder)} />}
          </div>
          <div className="px-6 pb-6 flex gap-3">
            <button onClick={() => setIsConfirmDialogOpen(false)} className="px-6 py-2 rounded-full text-white font-medium text-sm bg-neutral-800">CANCEL</button>
            <button onClick={() => { setIsConfirmDialogOpen(false); handleFinalConfirm(); }} disabled={isMerging} className="flex-1 py-2 rounded-full text-black font-medium text-sm disabled:opacity-50" style={{ background: "linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)" }}>
              {isMerging ? "MERGING..." : "CONFIRM MERGE"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>;
};
export default MergeOrders;
