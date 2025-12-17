import { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ChevronLeft, ArrowUpDown, SlidersHorizontal, Search } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// Import icons
import clearIcon from "@/assets/icons/clear-c.png";
import fireIcon from "@/assets/icons/fire.png";
import tableTargetIcon from "@/assets/icons/table-target.png";

// Mock all orders data from different tables with extended info
const allOrders = [
  // T2 orders
  { id: "1", name: "Sarah Kim", table: "T2", amount: "$72.00", partySize: 3, time: "7:30 PM", status: "ORDERING", timer: "00:20", server: "Dustin H", check: "--", paymentType: "--", revenueCenter: "FF Balcony", phone: "(415) 555-1234" },
  { id: "2", name: "Guest", table: "T2", amount: "$45.00", partySize: 2, time: "7:45 PM", status: "ORDERING", timer: "00:15", server: "Dustin H", check: "--", paymentType: "--", revenueCenter: "FF Balcony", phone: "(415) 999-8888" },
  { id: "3", name: "Martin Alex", table: "T2", amount: "$59.00", partySize: 4, time: "8:00 PM", status: "ORDERING", timer: "00:00", server: "Dustin H", check: "--", paymentType: "--", revenueCenter: "FF Balcony", phone: "(415) 123-4567" },
  { id: "9", name: "Davis", table: "T2", amount: "$32.50", partySize: 3, time: "8:15 PM", status: "ORDERED", timer: "00:30", server: "Dustin H", check: "1240", paymentType: "--", revenueCenter: "FF Balcony", phone: "" },
  // T3 orders
  { id: "8", name: "Guest", table: "T3", amount: "$16.00", partySize: 2, time: "10:00 PM", status: "ORDERING", timer: "00:00", server: "Mia J", check: "--", paymentType: "--", revenueCenter: "Main", phone: "" },
  { id: "10", name: "Taylor", table: "T3", amount: "$28.00", partySize: 2, time: "9:30 PM", status: "PREPARING", timer: "00:45", server: "Mia J", check: "1241", paymentType: "--", revenueCenter: "Main", phone: "" },
  // Other tables
  { id: "7", name: "Smith", table: "T4", amount: "$85.00", partySize: 3, time: "8:30 PM", status: "ORDERING", timer: "1:30 Hrs", server: "Dustin H", check: "1234", paymentType: "--", revenueCenter: "FF Balcony", phone: "" },
  { id: "6", name: "Johnson", table: "T1", amount: "$20.00", partySize: 1, time: "7:35 PM", status: "PREPARING", timer: "2:00 Hrs", server: "Alex M", check: "1235", paymentType: "Cash", revenueCenter: "Bar", phone: "" },
  { id: "5", name: "Williams", table: "T5", amount: "$120.75", partySize: 4, time: "7:30 PM", status: "ORDERED", timer: "2:10 Hrs", server: "Dustin H", check: "1236", paymentType: "--", revenueCenter: "Patio", phone: "" },
  { id: "4", name: "Brown", table: "T6", amount: "$65.50", partySize: 2, time: "7:15 PM", status: "PREPARING", timer: "2:30 Hrs", server: "Mia J", check: "1237", paymentType: "Card", revenueCenter: "Main", phone: "" },
];

// Mock order items for right panel
const orderItems = [
  { qty: 2, name: "Classic Crispy Burger", price: "$12.00", seats: [1, 2], modifiers: [] },
  { qty: 4, name: "Meatballs", price: "$16.00", seats: [], modifiers: [] },
  { qty: 2, name: "Rigatoni Pasta", price: "$8.00", seats: [3, 4], modifiers: [] },
  { qty: 4, name: "Alomd crusted salmon", price: "$20.00", seats: [], modifiers: ["- Salad", "- Balsamic Vinaigrette", "- Medium Rare", "+ W/ Potato Wedges", "- large", "+ W/ Extra Cheese"] },
];

const mergeFilters = ["All", "Ordering", "Ordered", "Preparing", "Unpaid"];

type MergeStep = "select" | "confirm-direction";

const MergeOrders = () => {
  const navigate = useNavigate();
  const { tableId } = useParams();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId");
  
  const [step, setStep] = useState<MergeStep>("select");
  const [activeFilter, setActiveFilter] = useState("All");
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [fromOrder, setFromOrder] = useState<typeof allOrders[0] | null>(null);
  const [toOrder, setToOrder] = useState<typeof allOrders[0] | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<number[]>([1, 2, 3, 4]);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const toggleOrderExpand = (orderId: string) => {
    setExpandedOrderId(prev => prev === orderId ? null : orderId);
  };

  // Get the current order being merged (from the table we came from)
  const currentOrder = allOrders.find(o => o.id === orderId) || allOrders[0];

  // Filter orders from the same table, excluding the current order
  const availableOrders = allOrders.filter(o => o.id !== orderId && o.table === tableId);

  const filteredOrders = activeFilter === "All" 
    ? availableOrders 
    : availableOrders.filter(o => o.status === activeFilter.toUpperCase());

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ORDERING": return "text-red-500";
      case "ORDERED": return "text-orange-500";
      case "PREPARING": return "text-yellow-500";
      case "COMPLETED": return "text-green-500";
      default: return "text-white/60";
    }
  };

  const handleOrderSelect = (order: typeof allOrders[0]) => {
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

  const handleFinalConfirm = () => {
    // Navigate with merged order ID, source table, and destination order ID
    const fromTable = fromOrder?.table?.replace("T", "") || "";
    navigate(`/tableorder/${tableId}?merged=${fromOrder?.id}&from=${fromTable}&dest=${toOrder?.id}`);
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

  // Render order card for mobile - matching TableOrderDetails styling
  const OrderCard = ({ order, isSelected, onClick, showCheckbox = true, showExpand = true }: { 
    order: typeof allOrders[0]; 
    isSelected: boolean; 
    onClick?: () => void;
    showCheckbox?: boolean;
    showExpand?: boolean;
  }) => (
    <div className="rounded-xl overflow-hidden">
      <div 
        className={`flex items-stretch w-full gap-2 border rounded-t-xl ${showExpand && expandedOrderId === order.id ? '' : 'rounded-b-xl'} bg-neutral-900 cursor-pointer transition-colors ${
          isSelected ? "border-white" : "border-white/10"
        }`}
        onClick={onClick}
      >
        {/* Checkbox Column */}
        {showCheckbox && (
          <div className="flex-shrink-0 px-2 flex items-center">
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
              isSelected ? "border-orange-500 bg-orange-500" : "border-white/40"
            }`}>
              {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
            </div>
          </div>
        )}

        {/* Order Number Column */}
        <div className={`w-[15%] flex-shrink-0 ${showCheckbox ? '' : 'px-2'} py-2 flex items-center`}>
          <div className="relative w-10 h-14 bg-neutral-800 rounded-lg flex flex-col items-center justify-center gap-1 border border-neutral-600">
            <span className="text-base font-bold text-white">{order.id}</span>
            <img src={tableTargetIcon} alt="Table" className="w-4 h-4 object-contain" />
          </div>
        </div>

        {/* Guest Info Column */}
        <div className="flex-1 min-w-0 py-2 pr-3">
          <div className="flex flex-col">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className="text-white font-medium text-sm">{order.name}</span>
                <span className="text-white/60 text-xs">· {order.table}</span>
              </div>
              <span className="text-white font-semibold text-sm">{order.amount}</span>
            </div>
            <div className="h-px bg-neutral-600 my-1.5"></div>
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1 text-gray-400">
                <span>Party Of {order.partySize},</span>
                <span>⚡ {order.time}</span>
              </div>
              <span className={getStatusColor(order.status)}>{order.status}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Expand/Collapse Button */}
      {showExpand && (
        <div className="px-2">
          <button
            className={`w-full h-3 flex items-center justify-center transition-colors ${expandedOrderId === order.id ? '' : 'rounded-b-lg'}`}
            style={{ background: "#7575754D" }}
            onClick={(e) => {
              e.stopPropagation();
              toggleOrderExpand(order.id);
            }}
          />
        </div>
      )}

      {/* Expanded Details */}
      {showExpand && expandedOrderId === order.id && (
        <div className="mx-2 px-3 pb-3 rounded-b-lg" style={{ background: "#7575754D" }}>
          {/* Order Details Grid */}
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
        </div>
      )}
    </div>
  );

  // Desktop current order card with extended info
  const DesktopCurrentOrderCard = ({ order }: { order: typeof allOrders[0] }) => (
    <div className="bg-neutral-800 rounded-xl p-4 border border-white">
      <div className="flex items-start gap-4">
        {/* Order number with icon */}
        <div className="relative w-12 h-16 bg-neutral-700 rounded-lg flex flex-col items-center justify-center gap-1 border border-neutral-600 flex-shrink-0">
          <span className="text-lg font-bold text-white">{order.id}</span>
          <img src={tableTargetIcon} alt="Table" className="w-4 h-4 object-contain" />
        </div>
        
        {/* Name and amount */}
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <span className="text-white font-medium">{order.name}</span>
            <span className="text-white font-semibold">{order.amount}</span>
          </div>
          <div className="flex items-center gap-2 mt-1 text-xs">
            <span className="text-white/60">Party Of {order.partySize},</span>
            <span className="text-white/60">⚡ {order.time}</span>
            <span className={`ml-2 ${getStatusColor(order.status)}`}>{order.status}</span>
          </div>
        </div>

        {/* Timer & Check */}
        <div className="flex flex-col gap-1 text-xs">
          <div>
            <div className="text-white font-medium">{order.timer}</div>
            <div className="text-gray-500">Timer</div>
          </div>
          <div>
            <div className="text-white">{order.check}</div>
            <div className="text-gray-500">Check</div>
          </div>
        </div>

        {/* Server & Revenue Center */}
        <div className="flex flex-col gap-1 text-xs">
          <div>
            <div className="text-white">{order.server}</div>
            <div className="text-gray-500">Server</div>
          </div>
          <div>
            <div className="text-white">{order.revenueCenter}</div>
            <div className="text-gray-500">Revenue Center</div>
          </div>
        </div>

        {/* Payment Type */}
        <div className="flex flex-col text-xs">
          <div>
            <div className="text-white font-medium">{order.paymentType}</div>
            <div className="text-gray-500">Payment Type</div>
          </div>
        </div>
      </div>
    </div>
  );

  // Desktop order list card
  const DesktopOrderListCard = ({ order, isSelected, onClick }: { 
    order: typeof allOrders[0]; 
    isSelected: boolean; 
    onClick?: () => void;
  }) => (
    <div 
      className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors ${
        isSelected ? "bg-neutral-700 border border-orange-500" : "bg-neutral-800 border border-transparent hover:bg-neutral-700"
      }`}
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <span className="text-white/60 text-sm w-4">{order.id}</span>
        <span className="text-white font-medium">{order.name}</span>
        <span className="text-white/60">·</span>
        <span className="text-white/80">{order.table}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-white font-medium">{order.amount}</span>
        <span className={`text-xs font-medium w-20 text-right ${getStatusColor(order.status)}`}>{order.status}</span>
      </div>
    </div>
  );

  // Right panel - Order details
  const OrderDetailsPanel = () => (
    <div className="w-[345px] flex flex-col m-2 ml-0">
      {/* Guest Header */}
      <div className="px-2 py-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-white font-medium">{currentOrder.name}</span>
          <div className="flex items-center gap-3 text-white/50 text-sm">
            <span>📞 {currentOrder.phone || "(415) 123-4567"}</span>
            <span>⚡ {currentOrder.time}</span>
          </div>
        </div>
        <div className="flex gap-2">
          {["Add Item", "Discount", "Receipt", "Cash Register"].map((btn, i) => (
            <button
              key={btn}
              className="px-3 py-1.5 rounded-lg text-xs text-white/80 bg-neutral-700 hover:bg-neutral-600 transition-colors"
            >
              {btn}
            </button>
          ))}
        </div>
      </div>

      {/* Main Panel Box */}
      <div 
        className="flex-1 flex flex-col rounded-[20px] border border-white/10 overflow-hidden"
        style={{ 
          background: "#7575754D",
          boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)"
        }}
      >
        {/* Table Order Info */}
        <div className="px-4 py-3 border-b border-white/10">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-white/60 text-sm">TABLE {tableId?.replace("T", "")}</span>
              <span className="text-white font-medium">{currentOrder.id}</span>
            </div>
            <div className="flex items-center gap-1 text-white/60 text-xs">
              <span>👤</span>
              <span>{currentOrder.server}</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-white/40">🪑</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4].map(seat => (
                <button
                  key={seat}
                  onClick={() => setSelectedSeats(prev => 
                    prev.includes(seat) ? prev.filter(s => s !== seat) : [...prev, seat]
                  )}
                  className={`w-6 h-6 rounded text-xs font-medium transition-colors ${
                    selectedSeats.includes(seat) 
                      ? "bg-white text-black" 
                      : "bg-neutral-700 text-white/60"
                  }`}
                >
                  {seat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Allergies */}
        <div className="px-4 py-2 border-b border-white/10">
          <div className="flex items-center gap-2 text-white/60 text-xs">
            <span>⚠️</span>
            <span>Allergic to almonds, Don't add onion</span>
          </div>
        </div>

        {/* Order Items */}
        <ScrollArea className="flex-1 px-4">
          <div className="py-3 space-y-3">
            {orderItems.map((item, index) => (
              <div key={index} className="border-b border-white/10 pb-3 last:border-0">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-2">
                    <span className="bg-neutral-700 text-white text-xs px-1.5 py-0.5 rounded">{item.qty}</span>
                    <div>
                      <span className="text-white text-sm">{item.name}</span>
                      {item.seats.length > 0 && (
                        <div className="flex items-center gap-1 mt-1">
                          <span className="text-white/40">🪑</span>
                          {item.seats.map(s => (
                            <span key={s} className="bg-neutral-700 text-white/60 text-xs px-1 rounded">{s}</span>
                          ))}
                        </div>
                      )}
                      {item.modifiers.length > 0 && (
                        <div className="mt-1 space-y-0.5">
                          {item.modifiers.map((mod, i) => (
                            <div key={i} className="text-white/50 text-xs">{mod}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <span className="text-white text-sm">{item.price}</span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-white/40">🪑</span>
                  <span className="text-white/40">📤</span>
                </div>
              </div>
            ))}
          </div>
          <ScrollBar orientation="vertical" />
        </ScrollArea>

        {/* Order Summary */}
        <div className="px-4 py-3 border-t border-white/10 space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-white/60">Sub Total</span>
            <span className="text-white">$ 56.00</span>
          </div>
          <div className="flex justify-between">
            <span className="text-red-400">Discount</span>
            <span className="text-red-400">$ 1.00</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/60">Service Charge</span>
            <span className="text-white">$ 1.00</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/60">Tax</span>
            <span className="text-white">$ 1.00</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-4 py-3 border-t border-white/10 flex items-center gap-2">
          <button className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center">
            <img src={clearIcon} alt="Clear" className="w-4 h-4 object-contain" />
          </button>
          <button 
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: "linear-gradient(180deg, #FF9E65 0%, #FF5E00 100%)" }}
          >
            <img src={fireIcon} alt="Fire" className="w-4 h-4 object-contain" />
          </button>
          <button 
            className="flex-1 py-2 rounded-full text-black font-medium text-sm"
            style={{ background: "linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)" }}
          >
            CHARGE $ 59.00
          </button>
        </div>
      </div>
    </div>
  );

  // Mobile Step 1: Select orders to merge
  const MobileSelectOrdersView = () => (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      {/* Header */}
      <div className="relative flex items-center justify-between p-4">
        <button 
          onClick={handleBack}
          className="w-10 h-10 rounded-full flex items-center justify-center z-10"
          style={{ 
            background: "#7575754D",
            boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)"
          }}
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        
        <h1 className="absolute left-1/2 -translate-x-1/2 text-white text-xl font-medium">Merge</h1>
        
        <div className="flex items-center gap-2 z-10">
          <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <PopoverTrigger asChild>
              <button 
                className="p-2 rounded-full hover:opacity-80 transition-opacity"
                style={{
                  background: "#7575754D",
                  boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)"
                }}
              >
                <SlidersHorizontal className="w-5 h-5 text-white" />
              </button>
            </PopoverTrigger>
            <PopoverContent 
              className="w-48 p-2 bg-neutral-900 border border-white/10 rounded-xl"
              align="end"
            >
              <div className="flex flex-col gap-1">
                {mergeFilters.map(filter => {
                  const count = getFilterCount(filter);
                  const isActive = activeFilter === filter;
                  return (
                    <button
                      key={filter}
                      onClick={() => {
                        setActiveFilter(filter);
                        setIsFilterOpen(false);
                      }}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                        isActive ? "bg-white text-black" : "text-white hover:bg-neutral-800"
                      }`}
                    >
                      <span>{filter}</span>
                      <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${
                        isActive ? "bg-black text-white" : "bg-neutral-700"
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </PopoverContent>
          </Popover>
          <button 
            className="p-2 rounded-full hover:opacity-80 transition-opacity"
            style={{
              background: "#7575754D",
              boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)"
            }}
          >
            <Search className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Current Order */}
      <div className="px-4 pb-2">
        <OrderCard order={currentOrder} isSelected={true} showCheckbox={false} showExpand={true} />
      </div>

      {/* Choose Orders Label */}
      <div className="px-4 py-2">
        <p className="text-white/80 text-sm">Choose Orders to Merge with Order {orderId}</p>
      </div>

      {/* Orders List */}
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide px-4 overscroll-contain touch-pan-y">
        <div className="flex flex-col gap-2 pb-24">
          {filteredOrders.map(order => (
            <OrderCard 
              key={order.id}
              order={order} 
              isSelected={selectedOrders.includes(order.id)}
              onClick={() => handleOrderSelect(order)}
              showCheckbox={false}
            />
          ))}
        </div>
      </div>
    </div>
  );

  // Desktop layout
  const DesktopLayout = () => (
    <div className="h-full flex bg-black">
      {/* Left Panel - Order Selection */}
      <div className="flex-1 flex flex-col p-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <button 
            onClick={handleBack}
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ 
              background: "#7575754D",
              boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)"
            }}
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-white text-xl font-medium">Merge</h1>
        </div>

        {/* Current Order - Extended Card */}
        <div className="mb-4">
          <DesktopCurrentOrderCard order={currentOrder} />
        </div>

        {/* Choose Orders Label */}
        <div className="mb-3">
          <p className="text-white/80 text-sm">Choose Orders to Merge with Order {orderId}</p>
        </div>

        {/* Filter Tabs */}
        <div className="mb-4">
          <div className="flex gap-2 flex-wrap">
            {mergeFilters.map(filter => {
              const count = getFilterCount(filter);
              const isActive = activeFilter === filter;
              return (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    isActive ? "text-black" : "text-white"
                  }`}
                  style={isActive ? {
                    background: "linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)"
                  } : {
                    background: "#7575754D",
                    boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)"
                  }}
                >
                  {filter}
                  <span className={`font-bold ${isActive ? "text-black" : "text-white"}`}>{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Orders List */}
        <ScrollArea className="flex-1">
          <div className="flex flex-col gap-2 pr-4">
            {filteredOrders.map(order => (
              <DesktopOrderListCard 
                key={order.id}
                order={order} 
                isSelected={selectedOrders.includes(order.id)}
                onClick={() => handleOrderSelect(order)}
              />
            ))}
          </div>
          <ScrollBar orientation="vertical" />
        </ScrollArea>

        {/* Merge Button */}
        {selectedOrders.length > 0 && (
          <div className="pt-4">
            <button
              onClick={handleProceedToDirection}
              className="w-full py-2 rounded-full text-black font-medium text-sm"
              style={{ background: "linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)" }}
            >
              MERGE ORDER {orderId}, {selectedOrders.join(", ")}
            </button>
          </div>
        )}
      </div>

      {/* Right Panel - Order Details */}
      <OrderDetailsPanel />
    </div>
  );

  // Mobile Step 2: Confirm direction (From/To) - matches screenshot design
  const ConfirmDirectionView = () => (
    <div className="flex flex-col h-full">
      {/* Grabber */}
      <div className="flex justify-center pt-2 pb-4">
        <div className="w-10 h-1 bg-white/30 rounded-full" />
      </div>

      {/* From Order */}
      <div className="px-4 pb-4">
        <p className="text-white/60 text-sm mb-2">From</p>
        {fromOrder && (
          <OrderCard order={fromOrder} isSelected={false} showCheckbox={false} showExpand={false} />
        )}
      </div>

      {/* Swap Button */}
      <div className="flex justify-center py-4">
        <button 
          onClick={handleSwapDirection}
          className="w-12 h-12 rounded-full flex items-center justify-center bg-neutral-800 border border-white/20"
        >
          <ArrowUpDown className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* To Order */}
      <div className="px-4 pb-4">
        <p className="text-white/60 text-sm mb-2">To</p>
        {toOrder && (
          <OrderCard order={toOrder} isSelected={false} showCheckbox={false} showExpand={false} />
        )}
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-black">
      {/* Desktop Layout */}
      <div className="hidden lg:flex h-full">
        <DesktopLayout />
      </div>

      {/* Mobile/Tablet Layout */}
      <div className="flex flex-col flex-1 min-h-0 lg:hidden overflow-hidden">
        {step === "select" && <MobileSelectOrdersView />}
        {step === "confirm-direction" && <ConfirmDirectionView />}
      </div>

      {/* Merge Button - Fixed above bottom nav */}
      {step === "select" && selectedOrders.length > 0 && (
        <div className="fixed bottom-14 left-0 right-0 px-4 py-2 bg-black lg:hidden">
          <button
            onClick={handleProceedToDirection}
            className="w-full py-2 rounded-full text-black font-medium text-sm"
            style={{ background: "linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)" }}
          >
            MERGE ORDER {orderId}, {selectedOrders.join(", ")}
          </button>
        </div>
      )}

      {/* Confirm Button - Fixed above bottom nav */}
      {step === "confirm-direction" && (
        <div className="fixed bottom-14 left-0 right-0 px-4 py-2 bg-black lg:hidden">
          <button
            onClick={handleFinalConfirm}
            className="w-full py-2 rounded-full text-black font-medium text-sm"
            style={{ background: "linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)" }}
          >
            CONFIRM
          </button>
        </div>
      )}
    </div>
  );
};

export default MergeOrders;
