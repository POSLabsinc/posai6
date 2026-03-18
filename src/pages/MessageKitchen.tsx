import { useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChevronLeft, Loader2, Phone } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import OrderSummary from "@/components/OrderSummary";
import { getOrderStatusColor, formatTableName, formatPrice, calculateOrderTotals } from "@/lib/orderUtils";
import { useTicketOrders, UnifiedTicketOrder } from "@/hooks/use-ticket-orders";
import { toast } from "sonner";

// Import icons (same as MergeOrders)
import clearIcon from "@/assets/icons/clear-c.png";
import fireIcon from "@/assets/icons/fire.png";
import tableTargetIcon from "@/assets/icons/table-target.png";
import shareSeatsIcon from "@/assets/icons/share-seats.png";
import seatIcon from "@/assets/icons/seat-icon.png";
import splitIcon from "@/assets/icons/split-icon.png";
import dineInIcon from "@/assets/icons/dine-in.png";

const MAX_LENGTH = 300;
const WARN_THRESHOLD = 270;
const DANGER_THRESHOLD = 295;

const messageKitchenFilters = ["All", "Ordering", "Ordered", "Preparing"];

const normalizeTableNumber = (raw: string | null | undefined): string => {
  if (!raw) return "";
  return raw.replace(/^Table\s*/i, "").replace(/^T\.?\s*/i, "").trim().toUpperCase();
};

const getOrderAmount = (order: UnifiedTicketOrder) => formatPrice(order.total);

const getOrderTotals = (order: UnifiedTicketOrder) => {
  return calculateOrderTotals(
    order.items.map(i => ({ qty: i.qty, price: i.price })),
    order.tip || 0
  );
};

const displayOrderNum = (order: UnifiedTicketOrder) => order.orderNumber || 0;

const getStatusColor = (status: string) => {
  switch (status) {
    case "ORDERING": return "text-red-500";
    case "ORDERED": return "text-orange-500";
    case "PREPARING": return "text-yellow-500";
    case "COMPLETED": return "text-green-500";
    default: return "text-white/60";
  }
};

const MessageKitchen = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const serverName = searchParams.get("server") || "Staff";
  const returnPath = searchParams.get("return") || "/orders";

  const { orders: allOrders, isLoading } = useTicketOrders();

  const [message, setMessage] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [displayedOrder, setDisplayedOrder] = useState<UnifiedTicketOrder | null>(null);
  const [sending, setSending] = useState(false);
  const [selectedSeats, setSelectedSeats] = useState<number[]>([1, 2, 3, 4]);

  const trimmedMessage = message.trim();
  const charCount = message.length;
  const canSend = trimmedMessage.length > 0 && !sending;

  const counterColorClass = useMemo(() => {
    if (charCount >= DANGER_THRESHOLD) return "text-destructive";
    if (charCount >= WARN_THRESHOLD) return "text-orange-400";
    return "text-neutral-500";
  }, [charCount]);

  // Filter active orders only (no Paid/Completed/Unpaid)
  const availableOrders = useMemo(() =>
    allOrders.filter(o => {
      const s = o.status.toUpperCase();
      return s !== "PAID" && s !== "COMPLETED" && s !== "UNPAID";
    }),
    [allOrders]
  );

  const filteredOrders = useMemo(() =>
    activeFilter === "All" ? availableOrders : availableOrders.filter(o => o.status.toUpperCase() === activeFilter.toUpperCase()),
    [availableOrders, activeFilter]
  );

  const getFilterCount = (filter: string) => {
    if (filter === "All") return availableOrders.length;
    return availableOrders.filter(o => o.status.toUpperCase() === filter.toUpperCase()).length;
  };

  const panelOrder = displayedOrder;

  const handleOrderSelect = (order: UnifiedTicketOrder) => {
    if (selectedOrderId === order.id) {
      setSelectedOrderId(null);
      setDisplayedOrder(null);
    } else {
      setSelectedOrderId(order.id);
      setDisplayedOrder(order);
    }
  };

  const handleBack = () => {
    navigate(returnPath);
  };

  const handleSend = async () => {
    if (trimmedMessage.length === 0 || !canSend) return;
    setSending(true);

    const selectedOrder = selectedOrderId ? allOrders.find(o => o.id === selectedOrderId) : null;
    const messageId = crypto.randomUUID();

    let linkedTableNumber: string | null = null;
    let linkedOrderNumber: number | null = null;

    if (selectedOrder) {
      linkedOrderNumber = selectedOrder.orderNumber || null;
      if (selectedOrder.table) {
        const norm = normalizeTableNumber(selectedOrder.table);
        linkedTableNumber = norm ? `Table ${norm}` : null;
      }
    }

    const payload = {
      message_id: messageId,
      message_text: trimmedMessage,
      store_id: "default",
      terminal_id: "default",
      employee_id: "default",
      employee_name: serverName,
      table_id: linkedTableNumber ? normalizeTableNumber(selectedOrder?.table || null) : null,
      table_number: linkedTableNumber,
      linked_order_id: selectedOrder?.id || null,
      linked_order_number: linkedOrderNumber,
      timestamp: new Date().toISOString(),
      status: "pending" as const,
    };

    try {
      const queue = JSON.parse(localStorage.getItem("kds_message_queue") || "[]");
      queue.push(payload);
      localStorage.setItem("kds_message_queue", JSON.stringify(queue));

      navigate(returnPath);
      toast.success("Message sent to kitchen \u2713", { duration: 3000 });
    } catch {
      toast.error("Failed to send message. Please try again.");
      setSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-black">
        <span className="text-white/60">Loading orders...</span>
      </div>
    );
  }

  // Message compose card (replaces source ticket card) - same dimensions/styling
  const MessageComposeCard = () => (
    <div className="rounded-xl border border-white overflow-hidden" style={{ backgroundColor: '#1B1C20' }}>
      <div className="p-3">
        <label className="text-sm text-white font-medium">
          Message <span className="text-destructive">*</span>
        </label>
        <Textarea
          value={message}
          onChange={(e) => {
            if (e.target.value.length <= MAX_LENGTH) {
              setMessage(e.target.value);
            }
          }}
          placeholder="Type your message for the kitchen..."
          className="mt-1.5 bg-neutral-800 border-neutral-600 text-white placeholder:text-neutral-500 min-h-[80px] resize-none focus-visible:ring-orange-500"
          maxLength={MAX_LENGTH}
          autoFocus
          disabled={sending}
        />
        <div className={`text-xs text-right mt-1 ${counterColorClass}`}>
          {charCount}/{MAX_LENGTH}
        </div>
      </div>
    </div>
  );

  // Desktop order list card (same as MergeOrders DesktopOrderListCard)
  const DesktopOrderListCard = ({
    order,
    isSelected,
    onClick
  }: {
    order: UnifiedTicketOrder;
    isSelected: boolean;
    onClick?: () => void;
  }) => (
    <div
      className={`rounded-xl border cursor-pointer transition-all overflow-hidden ${isSelected ? "border-orange-500" : "border-neutral-700 hover:border-neutral-600"}`}
      style={{ backgroundColor: '#1B1C20' }}
      onClick={onClick}
    >
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
                <span className="text-white/60 truncate">Pending Payment</span>
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

  // Mobile order card (same as MergeOrders OrderCard, without checkbox)
  const MobileOrderCard = ({
    order,
    isSelected,
    onClick
  }: {
    order: UnifiedTicketOrder;
    isSelected: boolean;
    onClick?: () => void;
  }) => (
    <div className="rounded-xl overflow-hidden">
      <div
        className={`flex items-stretch w-full gap-2 border rounded-xl bg-neutral-900 cursor-pointer transition-colors ${isSelected ? "border-orange-500" : "border-white/10"}`}
        onClick={onClick}
      >
        <div className="flex-shrink-0 px-2 py-2 flex items-center md:hidden">
          <div className="relative w-10 h-12 bg-neutral-800 rounded-lg flex flex-col items-center justify-center border border-neutral-600">
            <span className="text-lg font-bold text-white">{displayOrderNum(order)}</span>
            <span className="text-[9px] text-gray-500">{order.check || '000'}</span>
          </div>
        </div>
        <div className="hidden md:flex flex-shrink-0 px-2 py-2 items-center">
          <div className="relative w-10 h-14 bg-neutral-800 rounded-lg flex flex-col items-center justify-center gap-1 border border-neutral-600">
            <span className="text-base font-bold text-white">{displayOrderNum(order)}</span>
            <img src={tableTargetIcon} alt="Table" className="w-4 h-4 object-contain" />
          </div>
        </div>
        <div className="flex-1 min-w-0 py-2 pr-2 md:hidden">
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-white font-medium text-sm">{order.name} · {formatTableName(order.table)}</span>
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
              <span className="text-sm" style={{ color: '#B5B6BB' }}>Pending Payment</span>
              <span className="text-white text-sm">$0.00</span>
            </div>
          </div>
        </div>
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
              <span className="text-white/60 truncate">Pending Payment</span>
            </div>
            <div className="w-[20%] text-right">
              <span className="text-white">$0.00</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Right panel - Order details (same as MergeOrders OrderDetailsPanel)
  const OrderDetailsPanel = () => {
    if (!panelOrder) {
      return (
        <div className="w-[345px] flex flex-col my-2 mr-2 items-center justify-center">
          <span className="text-white/40 text-sm">Select an order to preview its details</span>
        </div>
      );
    }
    return (
      <div className="w-[345px] flex flex-col my-2 mr-2">
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
                <span>\u26A1</span>
                <span>{panelOrder.time}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            <button className="px-2 py-1 bg-neutral-700 text-white text-[10px] rounded-full hover:bg-neutral-600 transition-colors">Add Item</button>
            <button className="px-2 py-1 bg-neutral-700 text-white text-[10px] rounded-full hover:bg-neutral-600 transition-colors">Discount</button>
            <button className="px-2 py-1 bg-neutral-700 text-white text-[10px] rounded-full hover:bg-neutral-600 transition-colors">Receipt</button>
            <button className="px-2 py-1 bg-neutral-700 text-white text-[10px] rounded-full hover:bg-neutral-600 transition-colors">Cash Register</button>
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
              {[1, 2, 3, 4].map(seat => (
                <button
                  key={seat}
                  onClick={() => setSelectedSeats(prev => prev.includes(seat) ? prev.filter(s => s !== seat) : [...prev, seat])}
                  className={`w-6 h-6 rounded text-xs font-medium transition-colors ${selectedSeats.includes(seat) ? "bg-white text-black" : "bg-white/10 text-white hover:bg-white/20"}`}
                >
                  {seat}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="px-3 py-2 border-b border-white/10">
            <div className="flex items-center gap-2 text-white/50 text-xs bg-white/10 px-2 py-1.5 rounded">
              <span>\u26A0\uFE0F</span>
              <span>{panelOrder.notes || "No notes"}</span>
            </div>
          </div>

          {/* Order Items */}
          <ScrollArea className="flex-1 px-3">
            <div className="py-2 space-y-1.5">
              {panelOrder.items.map((item, index) => (
                <div key={index} className="p-2 bg-white/5 rounded-lg border border-white/10">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2">
                      <span className="w-5 h-5 bg-white rounded flex items-center justify-center text-black text-xs font-bold">{item.qty}</span>
                      <div>
                        <span className="text-white text-sm">{item.name}</span>
                        {item.modifiers.length > 0 && (
                          <div className="mt-0.5 text-white/50 text-xs space-y-0">
                            {item.modifiers.map((mod, i) => <div key={i}>{mod}</div>)}
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="text-white text-sm">${(item.price * item.qty).toFixed(2)}</span>
                  </div>
                  {item.seats.length > 0 && (
                    <div className="flex items-center gap-1 mt-1">
                      <img src={seatIcon} alt="Seat" className="w-3 h-3 opacity-50" />
                      {item.seats.map(seat => (
                        <span key={seat} className="w-4 h-4 bg-white/10 rounded text-white text-[10px] flex items-center justify-center">{seat}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <ScrollBar orientation="vertical" />
          </ScrollArea>

          {/* Order Summary */}
          {(() => {
            const totals = getOrderTotals(panelOrder);
            return (
              <div className="px-3 py-2 border-t border-white/10">
                <OrderSummary totals={totals} variant="detailed" />
              </div>
            );
          })()}

          {/* Bottom Actions */}
          {(() => {
            const totals = getOrderTotals(panelOrder);
            return (
              <div className="px-3 py-2 border-t border-white/10 flex items-center gap-2">
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
              </div>
            );
          })()}
        </div>
      </div>
    );
  };

  const selectedOrder = selectedOrderId ? allOrders.find(o => o.id === selectedOrderId) : null;
  const ctaLabel = selectedOrder
    ? `SEND MESSAGE TO ORDER #${displayOrderNum(selectedOrder)}`
    : "SEND MESSAGE";

  // Mobile layout
  const MobileLayout = () => (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      <div className="relative flex items-center justify-between p-4">
        <button onClick={handleBack} className="w-10 h-10 rounded-full flex items-center justify-center z-10" style={{ background: "#7575754D", boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)" }}>
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        <h1 className="absolute left-1/2 -translate-x-1/2 text-white text-xl font-medium">Message Kitchen</h1>
        <div className="w-10" />
      </div>

      <div className="px-4 pb-2">
        <MessageComposeCard />
      </div>

      <div className="px-4 py-2">
        <p className="text-white/80 text-sm">Choose an order to link this message with (Optional)</p>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide px-4 overscroll-contain touch-pan-y">
        <div className="flex flex-col gap-2 pb-24">
          {filteredOrders.length === 0 ? (
            <p className="text-white/40 text-sm text-center py-6">No active orders at the moment</p>
          ) : (
            filteredOrders.map(order => (
              <MobileOrderCard
                key={order.id}
                order={order}
                isSelected={selectedOrderId === order.id}
                onClick={() => handleOrderSelect(order)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );

  // Desktop layout
  const DesktopLayout = () => (
    <div className="h-full w-full flex bg-black">
      <div className="flex-1 flex flex-col m-2 rounded-[20px] overflow-hidden">
        <div className="flex items-center justify-between p-2 border-b border-neutral-700/50">
          <div className="flex items-center gap-3">
            <button onClick={handleBack} className="p-2 rounded-full hover:opacity-80 transition-opacity" style={{ background: "#7575754D", boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)" }}>
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <h1 className="text-white text-lg font-semibold">Message Kitchen</h1>
          </div>
        </div>

        <div className="px-3 py-3">
          <MessageComposeCard />
        </div>

        <div className="px-3 pb-2">
          <p className="text-white/80 text-sm">Choose an order to link this message with (Optional)</p>
        </div>

        <div className="flex items-center gap-2 px-3 pb-3 overflow-x-auto">
          {messageKitchenFilters.map(filter => {
            const count = getFilterCount(filter);
            const isActive = activeFilter === filter;
            return (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5 ${isActive ? "text-black" : "text-white"}`}
                style={isActive ? { background: "linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)" } : { background: "#7575754D", boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)" }}
              >
                {filter}
                <span className={`font-bold ${isActive ? "text-black" : "text-white"}`}>{count}</span>
              </button>
            );
          })}
        </div>

        <ScrollArea className="flex-1 px-3">
          <div className="space-y-2 pb-3">
            {filteredOrders.length === 0 ? (
              <p className="text-white/40 text-sm text-center py-6">No active orders at the moment</p>
            ) : (
              filteredOrders.map(order => (
                <DesktopOrderListCard
                  key={order.id}
                  order={order}
                  isSelected={selectedOrderId === order.id}
                  onClick={() => handleOrderSelect(order)}
                />
              ))
            )}
          </div>
          <ScrollBar orientation="vertical" />
        </ScrollArea>

        {/* Bottom CTA */}
        <div className="pt-4 px-3 pb-3">
          <button
            onClick={handleSend}
            disabled={!canSend}
            className="w-full py-2 rounded-full font-medium text-sm transition-colors disabled:opacity-40"
            style={canSend ? { background: "linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)", color: "black" } : { background: "#7575754D", color: "white" }}
          >
            {sending ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                SENDING...
              </span>
            ) : ctaLabel}
          </button>
        </div>
      </div>

      <OrderDetailsPanel />
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-black">
      <div className="hidden lg:flex h-full w-full">
        <DesktopLayout />
      </div>

      <div className="flex flex-col flex-1 min-h-0 lg:hidden overflow-hidden">
        <MobileLayout />
      </div>

      {/* Mobile bottom CTA */}
      <div className="fixed bottom-14 left-0 right-0 px-4 py-2 bg-black lg:hidden">
        <button
          onClick={handleSend}
          disabled={!canSend}
          className="w-full py-2 rounded-full font-medium text-sm transition-colors disabled:opacity-40"
          style={canSend ? { background: "linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)", color: "black" } : { background: "#7575754D", color: "white" }}
        >
          {sending ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              SENDING...
            </span>
          ) : ctaLabel}
        </button>
      </div>
    </div>
  );
};

export default MessageKitchen;
