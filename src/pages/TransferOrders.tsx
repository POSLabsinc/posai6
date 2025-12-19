import { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronDown, ArrowUpDown, SlidersHorizontal, Search, Phone, Info, Check } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import OrderLayoutTemplate from "@/components/OrderLayoutTemplate";

// Import icons
import clearIcon from "@/assets/icons/clear-c.png";
import fireIcon from "@/assets/icons/fire.png";
import tableTargetIcon from "@/assets/icons/table-target.png";
import shareSeatsIcon from "@/assets/icons/share-seats.png";
import seatIcon from "@/assets/icons/seat-icon.png";
import splitIcon from "@/assets/icons/split-icon.png";

// Order item interface
interface OrderItem {
  qty: number;
  name: string;
  price: number;
  seats: number[];
  modifiers: string[];
  isShared?: boolean;
}

// Order interface
interface Order {
  id: string;
  name: string;
  table: string;
  amount: string;
  partySize: number;
  time: string;
  status: string;
  timer: string;
  server: string;
  check: string;
  paymentType: string;
  revenueCenter: string;
  phone: string;
  notes: string;
  items: OrderItem[];
}

// Mock all orders data from different tables
const allOrders: Order[] = [
  // T2 orders
  { 
    id: "1", name: "Sarah Kim", table: "T2", amount: "$72.00", partySize: 3, time: "7:30 PM", 
    status: "ORDERING", timer: "00:20", server: "Dustin H", check: "--", paymentType: "--", 
    revenueCenter: "FF Balcony", phone: "(415) 555-1234", notes: "No nuts",
    items: [
      { qty: 2, name: "Margherita Pizza", price: 16.00, seats: [1, 2], modifiers: [] },
      { qty: 1, name: "Caesar Salad", price: 14.00, seats: [], modifiers: [] },
      { qty: 2, name: "Tiramisu", price: 9.00, seats: [3], modifiers: [] },
    ]
  },
  { 
    id: "2", name: "Guest", table: "T2", amount: "$45.00", partySize: 2, time: "7:45 PM", 
    status: "ORDERING", timer: "00:15", server: "Dustin H", check: "--", paymentType: "--", 
    revenueCenter: "FF Balcony", phone: "(415) 999-8888", notes: "",
    items: [
      { qty: 1, name: "Grilled Salmon", price: 24.00, seats: [1], modifiers: ["No Lemon"] },
      { qty: 1, name: "House Salad", price: 8.00, seats: [], modifiers: [] },
    ]
  },
  { 
    id: "3", name: "Martin Alex", table: "T2", amount: "$24.00", partySize: 4, time: "10:00 PM", 
    status: "ORDERING", timer: "00:00", server: "Dustin H", check: "--", paymentType: "--", 
    revenueCenter: "FF Balcony", phone: "(415) 123-4567", notes: "Allergic to almonds, Don't add onion",
    items: [
      { qty: 2, name: "Meaty Cheese Burger", price: 3.00, seats: [1, 2], modifiers: [] },
      { qty: 4, name: "Classic Cheese Burger - Medium", price: 2.25, seats: [], modifiers: ["- American Cheese", "- Bacon", "- No Onions", "- No Pickles", "+ Add Avocado $1.00", "· Side: Fries", "· Side: Chipotle Mayo"], isShared: true },
      { qty: 2, name: "Pepperoni Pizza (12\")", price: 4.00, seats: [3, 4], modifiers: [] },
    ]
  },
  { 
    id: "9", name: "Davis", table: "T2", amount: "$32.50", partySize: 3, time: "8:15 PM", 
    status: "ORDERED", timer: "00:30", server: "Dustin H", check: "1240", paymentType: "--", 
    revenueCenter: "FF Balcony", phone: "", notes: "",
    items: [
      { qty: 1, name: "Steak Frites", price: 22.00, seats: [1], modifiers: ["Medium Rare"] },
      { qty: 1, name: "Garlic Bread", price: 6.00, seats: [], modifiers: [] },
    ]
  },
  // T3 orders
  { 
    id: "8", name: "Guest", table: "T3", amount: "$16.00", partySize: 2, time: "10:00 PM", 
    status: "ORDERING", timer: "00:00", server: "Mia J", check: "--", paymentType: "--", 
    revenueCenter: "Main", phone: "", notes: "",
    items: [
      { qty: 2, name: "Meaty Cheese Burger", price: 8.00, seats: [1, 2], modifiers: [] },
    ]
  },
  { 
    id: "10", name: "Taylor", table: "T3", amount: "$28.00", partySize: 2, time: "9:30 PM", 
    status: "PREPARING", timer: "00:45", server: "Mia J", check: "1241", paymentType: "--", 
    revenueCenter: "Main", phone: "", notes: "",
    items: [
      { qty: 1, name: "Fish & Chips", price: 18.00, seats: [1], modifiers: [] },
      { qty: 1, name: "Onion Rings", price: 10.00, seats: [], modifiers: [] },
    ]
  },
  // Other tables
  { 
    id: "7", name: "Smith", table: "T4", amount: "$85.00", partySize: 3, time: "8:30 PM", 
    status: "ORDERING", timer: "1:30 Hrs", server: "Dustin H", check: "1234", paymentType: "--", 
    revenueCenter: "FF Balcony", phone: "", notes: "",
    items: [
      { qty: 2, name: "Lobster Tail", price: 42.00, seats: [1, 2], modifiers: [] },
    ]
  },
  { 
    id: "6", name: "Johnson", table: "T1", amount: "$20.00", partySize: 1, time: "7:35 PM", 
    status: "PREPARING", timer: "2:00 Hrs", server: "Alex M", check: "1235", paymentType: "Cash", 
    revenueCenter: "Bar", phone: "", notes: "",
    items: [
      { qty: 1, name: "Burger Deluxe", price: 20.00, seats: [1], modifiers: [] },
    ]
  },
];

const transferFilters = ["All", "Ordering", "Ordered", "Preparing"];

type TransferStep = "select-items" | "select-target" | "confirm-direction";

const TransferOrders = () => {
  const navigate = useNavigate();
  const { tableId } = useParams();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId");
  
  const [step, setStep] = useState<TransferStep>("select-items");
  const [activeFilter, setActiveFilter] = useState("All");
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [itemQuantities, setItemQuantities] = useState<Record<number, number>>({});
  const [itemSeats, setItemSeats] = useState<Record<number, number[]>>({});
  const [selectAll, setSelectAll] = useState(false);
  const [targetOrder, setTargetOrder] = useState<Order | null>(null);
  const [fromOrder, setFromOrder] = useState<Order | null>(null);
  const [toOrder, setToOrder] = useState<Order | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<number[]>([1, 2, 3, 4]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [showTargetSheet, setShowTargetSheet] = useState(false);
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
  const [displayedOrder, setDisplayedOrder] = useState<Order | null>(null);

  // Get the current order being transferred from
  const currentOrder = allOrders.find(o => o.id === orderId) || allOrders[0];
  const panelOrder = displayedOrder || currentOrder;

  // Filter orders from OTHER tables (not the same table)
  const availableOrders = allOrders.filter(o => o.table !== currentOrder.table);

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

  const getFilterCount = (filter: string) => {
    if (filter === "All") return availableOrders.length;
    return availableOrders.filter(o => o.status === filter.toUpperCase()).length;
  };

  const handleItemSelect = (index: number) => {
    if (selectedItems.includes(index)) {
      setSelectedItems(selectedItems.filter(i => i !== index));
      // Remove quantity when deselecting
      const newQuantities = { ...itemQuantities };
      delete newQuantities[index];
      setItemQuantities(newQuantities);
    } else {
      setSelectedItems([...selectedItems, index]);
      // Set default quantity to item's full quantity when selecting
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
    setShowTargetSheet(true);
  };

  const handleTargetSelect = (order: Order) => {
    setTargetOrder(order);
    setShowTargetSheet(false);
    setFromOrder(currentOrder);
    setToOrder(order);
    setStep("confirm-direction");
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
      setStep("select-items");
      setTargetOrder(null);
    } else {
      navigate(`/tableorder/${tableId}`);
    }
  };

  // Calculate order totals
  const calculateOrderTotals = (order: Order) => {
    const subtotal = order.items.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const discount = subtotal > 50 ? 5.00 : 0;
    const serviceCharge = subtotal * 0.05;
    const tax = (subtotal - discount) * 0.08;
    const total = subtotal - discount + serviceCharge + tax;
    return { subtotal, discount, serviceCharge, tax, total };
  };

  // Helper to convert order to OrderLayoutTemplate format
  const toOrderTemplateData = (order: Order) => ({
    id: Number(order.id),
    name: order.name,
    table: order.table,
    amount: order.amount,
    partySize: order.partySize,
    time: order.time,
    status: order.status,
    timer: order.timer || "00:00",
    server: order.server,
    check: order.check || "--",
    revenueCenter: order.revenueCenter,
    paymentType: order.paymentType || "--",
    phone: order.phone,
  });

  // Mobile order card for source order display
  const MobileSourceOrderCard = ({ order }: { order: Order }) => (
    <div 
      className="rounded-xl border border-white/20 overflow-hidden"
      style={{ backgroundColor: '#1B1C20' }}
    >
      <div className="flex items-stretch w-full gap-3 p-3">
        {/* Order Number */}
        <div className="flex-shrink-0 flex items-center">
          <div className="relative w-8 h-8 bg-neutral-800 rounded-lg flex items-center justify-center border border-neutral-600">
            <span className="text-base font-bold text-white">{order.id}</span>
          </div>
        </div>

        {/* Guest Info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-white font-medium text-sm">{order.name}</span>
                <span className="text-white/60 text-sm">· {order.table}</span>
                <span className="text-white/50 text-sm">{order.server}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium ${getStatusColor(order.status)}`}>{order.status}</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/50">Party of {order.partySize}, {order.time}</span>
              <span className="text-white font-semibold text-sm">{order.amount}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Target order card for selection
  const TargetOrderCard = ({ order, onClick }: { order: Order; onClick: () => void }) => (
    <div 
      className="rounded-xl border border-white/10 overflow-hidden cursor-pointer hover:border-orange-500 transition-all"
      style={{ backgroundColor: '#1B1C20' }}
      onClick={onClick}
    >
      <div className="flex items-stretch w-full gap-2 p-2">
        {/* Order Number */}
        <div className="flex-shrink-0 flex items-center">
          <div className="relative w-10 h-14 bg-neutral-800 rounded-lg flex flex-col items-center justify-center gap-1 border border-neutral-600">
            <span className="text-base font-bold text-white">{order.id}</span>
            <img src={tableTargetIcon} alt="Table" className="w-4 h-4 object-contain" />
          </div>
        </div>

        {/* Guest Info */}
        <div className="flex-1 min-w-0">
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
    </div>
  );

  // Mobile Step 1: Select items to transfer
  const MobileSelectItemsView = () => (
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
        <button 
          onClick={handleSelectAll}
          className="text-white/60 text-sm font-medium hover:text-white transition-colors"
        >
          {selectAll ? "Deselect All" : "Select All"}
        </button>
      </div>

      {/* Notes Section - Above items */}
      {currentOrder.notes && (
        <div className="mx-4 mb-3 px-3 py-2 rounded-lg bg-neutral-800/80 border border-white/10">
          <div className="flex items-start gap-2">
            <span className="text-white/60 text-sm">📋</span>
            <span className="text-white/70 text-sm">{currentOrder.notes}</span>
          </div>
        </div>
      )}

      {/* Items List */}
      <ScrollArea className="flex-1 px-4">
        <div className="space-y-2 pb-4">
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
              return { text, price, isAddOn, isRemoval };
            };
            
            return (
              <div 
                key={index}
                className={`rounded-xl border transition-all cursor-pointer overflow-hidden ${
                  isSelected 
                    ? "border-orange-500 bg-orange-500/5" 
                    : "border-white/10 bg-white/[0.02]"
                }`}
                onClick={() => handleItemSelect(index)}
              >
                {/* Main Item Row */}
                <div className="p-3">
                  <div className="flex items-start gap-3">
                    {/* Quantity Badge */}
                    <div className="flex-shrink-0">
                      <div className={`w-7 h-7 rounded-md flex items-center justify-center text-sm font-bold ${
                        isSelected ? "bg-orange-500 text-white" : "bg-neutral-700 text-white"
                      }`}>
                        {isSelected ? selectedQty : item.qty}
                      </div>
                    </div>

                    {/* Item Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <span className="text-white text-sm font-medium">{item.name}</span>
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-white text-sm font-medium">${(item.price * item.qty).toFixed(2)}</span>
                          {/* Quantity Selector - Compact dropdown style */}
                          {isSelected && item.qty > 1 && (
                            <div className="relative" onClick={(e) => e.stopPropagation()}>
                              <select
                                value={selectedQty}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  handleQuantityChange(index, parseInt(e.target.value));
                                }}
                                className="appearance-none bg-neutral-600 text-white text-xs font-medium rounded px-2 py-0.5 pr-5 cursor-pointer focus:outline-none"
                              >
                                {Array.from({ length: item.qty }, (_, i) => i + 1).map(qty => (
                                  <option key={qty} value={qty}>{qty}</option>
                                ))}
                              </select>
                              <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 w-3 h-3 text-white pointer-events-none" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Modifiers */}
                  {item.modifiers.length > 0 && (
                    <div className="mt-2 ml-10 space-y-0.5">
                      {item.modifiers.map((mod, i) => {
                        const { text, price, isAddOn, isRemoval } = parseModifier(mod);
                        return (
                          <div key={i} className="flex items-center justify-between text-xs">
                            <span className="text-white/50">
                              {isAddOn ? '+' : isRemoval ? '−' : '·'} {text.replace(/^[+-]\s*/, '').replace(/^W\/\s*/i, '')}
                            </span>
                            {price && <span className="text-white/50">{price}</span>}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Seat badges */}
                  <div className="flex items-center gap-2 mt-2 ml-10">
                    {item.seats.length > 0 && (
                      <div className="flex items-center gap-1">
                        <img src={seatIcon} alt="Seat" className="w-3.5 h-3.5 opacity-50" />
                        <span className="text-white/50 text-xs">{item.seats.join(', ')}</span>
                      </div>
                    )}
                    {item.isShared && (
                      <div className="flex items-center gap-1">
                        <img src={seatIcon} alt="Shared" className="w-3.5 h-3.5 opacity-50" />
                        <span className="text-white/50 text-xs">Shared</span>
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
          <div className="flex items-center gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {transferFilters.map(filter => {
              const count = getFilterCount(filter);
              const isActive = activeFilter === filter;
              return (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                    isActive ? "text-black" : "text-white"
                  }`}
                  style={isActive ? {
                    background: "linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)"
                  } : {
                    background: "#7575754D"
                  }}
                >
                  {filter}
                  <span className="font-bold">{count}</span>
                </button>
              );
            })}
          </div>

          {/* Orders List */}
          <ScrollArea className="flex-1 px-4" style={{ height: 'calc(70vh - 130px)' }}>
            <div className="space-y-2 pb-4">
              {filteredOrders.map(order => (
                <TargetOrderCard 
                  key={order.id}
                  order={order}
                  onClick={() => handleTargetSelect(order)}
                />
              ))}
            </div>
            <ScrollBar orientation="vertical" />
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  );

  // Mobile Confirm Direction View
  const ConfirmDirectionView = () => (
    <div className="flex flex-col h-full">
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
        
        <h1 className="absolute left-1/2 -translate-x-1/2 text-white text-xl font-medium">Transfer Check</h1>
        
        <div className="w-10" />
      </div>

      {/* From Order */}
      <div className="px-4 pb-4">
        <p className="text-white/60 text-sm mb-2">Transfer Check From</p>
        {fromOrder && <OrderLayoutTemplate order={toOrderTemplateData(fromOrder)} />}
      </div>

      {/* Swap Button */}
      <div className="flex justify-center py-2">
        <button 
          onClick={handleSwapDirection}
          className="w-10 h-10 rounded-full flex items-center justify-center bg-neutral-800 border border-white/20"
        >
          <ArrowUpDown className="w-4 h-4 text-white" />
        </button>
      </div>

      {/* To Order */}
      <div className="px-4 pb-4">
        <p className="text-white/60 text-sm mb-2">Transfer Check To</p>
        {toOrder && <OrderLayoutTemplate order={toOrderTemplateData(toOrder)} />}
      </div>

      {/* Spacer */}
      <div className="flex-1" />
    </div>
  );

  // Right panel - Order details (Desktop)
  const OrderDetailsPanel = () => (
    <div className="w-[345px] flex flex-col my-2 mr-2">
      {/* Guest Header - Outside the box */}
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
          <button className="px-2 py-1 bg-neutral-700 text-white text-[10px] rounded-full hover:bg-neutral-600 transition-colors">
            Add Item
          </button>
          <button className="px-2 py-1 bg-neutral-700 text-white text-[10px] rounded-full hover:bg-neutral-600 transition-colors">
            Discount
          </button>
          <button className="px-2 py-1 bg-neutral-700 text-white text-[10px] rounded-full hover:bg-neutral-600 transition-colors">
            Receipt
          </button>
          <button className="px-2 py-1 bg-neutral-700 text-white text-[10px] rounded-full hover:bg-neutral-600 transition-colors">
            Cash Register
          </button>
        </div>
      </div>

      {/* Main Panel Box */}
      <div 
        className="flex-1 flex flex-col rounded-[10px] overflow-hidden"
        style={{ 
          background: "#7575754D",
          boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)"
        }}
      >
        {/* Table Order Info */}
        <div className="px-3 py-2 border-b border-white/10">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 bg-white/10 text-white text-[10px] rounded">TABLE {panelOrder.table}</span>
              <span className="text-white text-sm font-bold">{panelOrder.id}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <img src={shareSeatsIcon} alt="Seats" className="w-3 h-3 opacity-60" />
              <span className="text-white/50 text-xs">{panelOrder.server}</span>
            </div>
          </div>
          
          {/* Seat Buttons */}
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
                onClick={() => setSelectedSeats(prev => 
                  prev.includes(seat) ? prev.filter(s => s !== seat) : [...prev, seat]
                )}
                className={`w-6 h-6 rounded text-xs font-medium transition-colors ${
                  selectedSeats.includes(seat) 
                    ? "bg-white text-black" 
                    : "bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                {seat}
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        {panelOrder.notes && (
          <div className="px-3 py-2 border-b border-white/10">
            <div className="flex items-center gap-2 text-white/50 text-xs bg-white/10 px-2 py-1.5 rounded">
              <span>⚠️</span>
              <span>{panelOrder.notes}</span>
            </div>
          </div>
        )}

        {/* Order Items */}
        <ScrollArea className="flex-1 px-3">
          <div className="py-2 space-y-1.5">
            {panelOrder.items.map((item, index) => (
              <div key={index} className="p-2 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 bg-white rounded flex items-center justify-center text-black text-xs font-bold">
                      {item.qty}
                    </span>
                    <div>
                      <span className="text-white text-sm">{item.name}</span>
                      {item.modifiers.length > 0 && (
                        <div className="mt-0.5 text-white/50 text-xs space-y-0">
                          {item.modifiers.map((mod, i) => (
                            <div key={i}>{mod}</div>
                          ))}
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
                      <span key={seat} className="w-4 h-4 bg-white/10 rounded text-white text-[10px] flex items-center justify-center">
                        {seat}
                      </span>
                    ))}
                    <span className="text-white/40 ml-1 text-xs">📤</span>
                  </div>
                )}
              </div>
            ))}
          </div>
          <ScrollBar orientation="vertical" />
        </ScrollArea>

        {/* Order Summary */}
        {(() => {
          const totals = calculateOrderTotals(panelOrder);
          return (
            <div className="px-3 py-2 border-t border-white/10 space-y-0.5 text-xs">
              <div className="flex justify-between">
                <span className="text-white/60">Sub Total</span>
                <span className="text-white">${totals.subtotal.toFixed(2)}</span>
              </div>
              {totals.discount > 0 && (
                <div className="flex justify-between">
                  <span className="text-red-500">Discount</span>
                  <span className="text-red-500">-${totals.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-white/60">Service Charge</span>
                <span className="text-white">${totals.serviceCharge.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Tax</span>
                <span className="text-white">${totals.tax.toFixed(2)}</span>
              </div>
            </div>
          );
        })()}

        {/* Bottom Actions */}
        {(() => {
          const totals = calculateOrderTotals(panelOrder);
          return (
            <div className="px-3 py-2 border-t border-white/10 flex items-center gap-2">
              <button className="w-7 h-7 rounded-full bg-red-600 flex items-center justify-center hover:bg-red-500 transition-colors">
                <img src={clearIcon} alt="Clear" className="w-3 h-3 brightness-0 invert" />
              </button>
              <button 
                disabled 
                className="px-3 py-1.5 rounded-full flex items-center gap-1 text-white text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed" 
                style={{ background: "linear-gradient(180deg, #FF9E65 0%, #FF5E00 100%)" }}
              >
                <img src={fireIcon} alt="Fire" className="w-3 h-3 brightness-0 invert" />
                <span>FIRE</span>
              </button>
              <button 
                className="flex-1 py-1.5 rounded-full text-black text-xs font-bold"
                style={{ background: "linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)" }}
              >
                CHARGE ${totals.total.toFixed(2)}
              </button>
            </div>
          );
        })()}
      </div>
    </div>
  );

  // Desktop current order card with extended info
  const DesktopCurrentOrderCard = ({ order }: { order: Order }) => (
    <div 
      className="rounded-xl border border-white overflow-hidden"
      style={{ backgroundColor: '#1B1C20' }}
    >
      <div className="flex items-stretch w-full gap-4">
        {/* Column 1: Order Number - 8% */}
        <div className="w-[8%] flex-shrink-0 px-3 py-2 flex items-center">
          <div className="relative w-12 h-16 bg-neutral-800 rounded-lg flex flex-col items-center justify-center gap-2 border border-neutral-600">
            <span className="text-lg font-bold text-white">{order.id}</span>
            <img src={tableTargetIcon} alt="Table" className="w-5 h-5 object-cover" />
          </div>
        </div>

        {/* Column 2: Guest Info - flex-1 */}
        <div className="flex-1 min-w-0 py-2">
          <div className="flex flex-col">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className="text-white font-medium text-sm">{order.name}</span>
                <span className="text-white/40">·</span>
                <span className="text-white font-medium text-sm">{order.table}</span>
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

        {/* Column 3: Timer & Server - 12% */}
        <div className="w-[12%] flex-shrink-0 py-2">
          <div className="flex flex-col text-xs gap-1">
            <div className="text-left">
              <div className="text-white font-medium">{order.timer}</div>
              <div className="text-gray-500">Timer</div>
            </div>
            <div className="text-left">
              <div className="text-white">{order.server}</div>
              <div className="text-gray-500">Server</div>
            </div>
          </div>
        </div>

        {/* Column 4: Check & Revenue Center - 12% */}
        <div className="w-[12%] flex-shrink-0 py-2">
          <div className="flex flex-col text-xs gap-1">
            <div className="text-left">
              <div className="text-white font-medium">{order.check}</div>
              <div className="text-gray-500">Check</div>
            </div>
            <div className="text-left">
              <div className="text-white">{order.revenueCenter}</div>
              <div className="text-gray-500">Revenue Center</div>
            </div>
          </div>
        </div>

        {/* Column 5: Payment Type - 12% */}
        <div className="w-[12%] flex-shrink-0 self-start py-2">
          <div className="flex flex-col text-xs">
            <div className="text-left">
              <div className="text-white font-medium">{order.paymentType}</div>
              <div className="text-gray-500">Payment Type</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Desktop order list card for target selection
  const DesktopOrderListCard = ({ order, isSelected, onClick }: { 
    order: Order; 
    isSelected: boolean; 
    onClick?: () => void;
  }) => (
    <div 
      className={`rounded-xl border cursor-pointer transition-all overflow-hidden ${
        isSelected ? "border-orange-500" : "border-neutral-700 hover:border-neutral-600"
      }`}
      style={{ backgroundColor: '#1B1C20' }}
      onClick={onClick}
    >
      <div className="flex items-stretch w-full gap-4">
        {/* Column 1: Order Number - 8% */}
        <div className="w-[8%] flex-shrink-0 px-3 py-2 flex items-center">
          <div className="relative w-12 h-16 bg-neutral-800 rounded-lg flex flex-col items-center justify-center gap-2 border border-neutral-600">
            <span className="text-lg font-bold text-white">{order.id}</span>
            <img src={tableTargetIcon} alt="Table" className="w-5 h-5 object-cover" />
          </div>
        </div>

        {/* Column 2: Guest Info - flex-1 */}
        <div className="flex-1 min-w-0 py-2">
          <div className="flex flex-col">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className="text-white font-medium text-sm">{order.name}</span>
                <span className="text-white/40">·</span>
                <span className="text-white font-medium text-sm">{order.table}</span>
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

        {/* Column 3: Timer & Server - 12% */}
        <div className="w-[12%] flex-shrink-0 py-2">
          <div className="flex flex-col text-xs gap-1">
            <div className="text-left">
              <div className="text-white font-medium">{order.timer}</div>
              <div className="text-gray-500">Timer</div>
            </div>
            <div className="text-left">
              <div className="text-white">{order.server}</div>
              <div className="text-gray-500">Server</div>
            </div>
          </div>
        </div>

        {/* Column 4: Check & Revenue Center - 12% */}
        <div className="w-[12%] flex-shrink-0 py-2">
          <div className="flex flex-col text-xs gap-1">
            <div className="text-left">
              <div className="text-white font-medium">{order.check}</div>
              <div className="text-gray-500">Check</div>
            </div>
            <div className="text-left">
              <div className="text-white">{order.revenueCenter}</div>
              <div className="text-gray-500">Revenue Center</div>
            </div>
          </div>
        </div>

        {/* Column 5: Payment Type - 12% */}
        <div className="w-[12%] flex-shrink-0 self-start py-2">
          <div className="flex flex-col text-xs">
            <div className="text-left">
              <div className="text-white font-medium">{order.paymentType}</div>
              <div className="text-gray-500">Payment Type</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Desktop layout
  const DesktopLayout = () => (
    <div className="h-full w-full flex bg-black">
      {/* Left Panel - Order Selection */}
      <div className="flex-1 flex flex-col m-2 rounded-[20px] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-2 border-b border-neutral-700/50">
          <div className="flex items-center gap-3">
            <button 
              onClick={handleBack}
              className="p-2 rounded-full hover:opacity-80 transition-opacity"
              style={{ 
                background: "#7575754D",
                boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)"
              }}
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <h1 className="text-white text-lg font-semibold">Transfer Check</h1>
          </div>
        </div>

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
          <button 
            onClick={handleSelectAll}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              selectAll ? "bg-white text-black" : "bg-white/10 text-white"
            }`}
          >
            {selectAll ? "Deselect All" : "Select All"}
          </button>
        </div>

        {/* Items List */}
        <ScrollArea className="flex-1 px-3">
          <div className="space-y-2 pb-3">
            {currentOrder.items.map((item, index) => {
              const isSelected = selectedItems.includes(index);
              const selectedQty = itemQuantities[index] || item.qty;
              
              return (
                <div 
                  key={index}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    isSelected 
                      ? "border-orange-500 bg-orange-500/10" 
                      : "border-white/10 bg-white/5"
                  }`}
                  onClick={() => handleItemSelect(index)}
                >
                  <div className="flex items-start gap-3">
                    {/* Checkbox */}
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      isSelected 
                        ? "border-orange-500 bg-orange-500" 
                        : "border-white/40"
                    }`}>
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
                      {item.modifiers.length > 0 && (
                        <div className="mt-1 ml-8 text-white/50 text-xs space-y-0.5">
                          {item.modifiers.map((mod, i) => (
                            <div key={i}>{mod}</div>
                          ))}
                        </div>
                      )}

                      {/* Quantity Selector - Only shown when selected */}
                      {isSelected && (
                        <div className="flex items-center justify-between mt-2 ml-8">
                          <div className="flex items-center gap-1 text-white/50 text-xs">
                            <img src={seatIcon} alt="Seat" className="w-3 h-3 opacity-50" />
                            <span>{item.seats.length > 0 ? item.seats.join(', ') : '-'}</span>
                          </div>
                          <select
                            value={selectedQty}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleQuantityChange(index, parseInt(e.target.value));
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-white text-sm min-w-[70px] focus:outline-none focus:border-orange-500"
                          >
                            {Array.from({ length: item.qty }, (_, i) => i + 1).map(num => (
                              <option key={num} value={num} className="bg-gray-800 text-white">
                                {num}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Seat & Shared badges - Only when NOT selected */}
                      {!isSelected && (
                        <div className="flex items-center gap-2 mt-2 ml-8">
                          {item.seats.length > 0 && (
                            <div className="flex items-center gap-1">
                              <img src={seatIcon} alt="Seat" className="w-3 h-3 opacity-50" />
                              {item.seats.map(seat => (
                                <span key={seat} className="w-5 h-5 bg-white/10 rounded text-white text-xs flex items-center justify-center">
                                  {seat}
                                </span>
                              ))}
                            </div>
                          )}
                          {item.isShared && (
                            <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-full">
                              Shared
                            </span>
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

        {/* Choose Target Label */}
        {selectedItems.length > 0 && (
          <>
            <div className="px-3 py-2 border-t border-white/10">
              <p className="text-white/80 text-sm">Select target check to transfer {selectedItems.length} item(s)</p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 px-3 pb-3 overflow-x-auto">
              {transferFilters.map(filter => {
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
                    <span className="font-bold">{count}</span>
                  </button>
                );
              })}
            </div>

            {/* Target Orders List */}
            <ScrollArea className="flex-1 px-3">
              <div className="space-y-2 pb-3">
                {filteredOrders.map(order => (
                  <DesktopOrderListCard 
                    key={order.id}
                    order={order} 
                    isSelected={targetOrder?.id === order.id}
                    onClick={() => {
                      setDisplayedOrder(order);
                      setTargetOrder(order);
                    }}
                  />
                ))}
              </div>
              <ScrollBar orientation="vertical" />
            </ScrollArea>

            {/* Transfer Button */}
            {targetOrder && (
              <div className="p-3">
                <button
                  onClick={() => {
                    setFromOrder(currentOrder);
                    setToOrder(targetOrder);
                    setIsConfirmDialogOpen(true);
                  }}
                  className="w-full py-2 rounded-full text-black font-medium text-sm"
                  style={{ background: "linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)" }}
                >
                  TRANSFER TO {targetOrder.table}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Right Panel - Order Details */}
      <OrderDetailsPanel />
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-black">
      {/* Desktop Layout */}
      <div className="hidden lg:flex h-full w-full">
        <DesktopLayout />
      </div>

      {/* Mobile/Tablet Layout */}
      <div className="flex flex-col flex-1 min-h-0 lg:hidden overflow-hidden">
        {step === "select-items" && <MobileSelectItemsView />}
        {step === "confirm-direction" && <ConfirmDirectionView />}
      </div>

      {/* Select Check Button - Fixed above bottom nav (Mobile) */}
      {step === "select-items" && selectedItems.length > 0 && !showTargetSheet && (
        <div className="fixed bottom-14 left-0 right-0 px-4 py-2 bg-black lg:hidden flex gap-3">
          <button
            onClick={handleBack}
            className="px-6 py-2 rounded-full text-white font-medium text-sm bg-neutral-800"
          >
            CANCEL
          </button>
          <button
            onClick={handleProceedToTargetSelection}
            className="flex-1 py-2 rounded-full text-black font-medium text-sm"
            style={{ background: "linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)" }}
          >
            SELECT CHECK
          </button>
        </div>
      )}

      {/* Confirm Button - Fixed above bottom nav (Mobile) */}
      {step === "confirm-direction" && (
        <div className="fixed bottom-14 left-0 right-0 px-4 py-2 bg-black lg:hidden flex gap-3">
          <button
            onClick={() => setStep("select-items")}
            className="px-6 py-2 rounded-full text-white font-medium text-sm bg-neutral-800"
          >
            CANCEL
          </button>
          <button
            onClick={handleFinalConfirm}
            className="flex-1 py-2 rounded-full text-black font-medium text-sm"
            style={{ background: "linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)" }}
          >
            CONFIRM TRANSFER
          </button>
        </div>
      )}

      {/* Desktop Confirmation Dialog */}
      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent className="bg-neutral-900 border-white/10 p-0 max-w-2xl overflow-hidden">
          {/* Grabber */}
          <div className="flex justify-center pt-3 pb-4">
            <div className="w-10 h-1 bg-white/30 rounded-full" />
          </div>

          {/* From Order */}
          <div className="px-6 pb-4">
            <p className="text-white/60 text-sm mb-2">Transfer Check From</p>
            {fromOrder && <OrderLayoutTemplate order={toOrderTemplateData(fromOrder)} />}
          </div>

          {/* Swap Button */}
          <div className="flex justify-center py-2">
            <button 
              onClick={handleSwapDirection}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-neutral-800 border border-white/20"
            >
              <ArrowUpDown className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* To Order */}
          <div className="px-6 pb-6">
            <p className="text-white/60 text-sm mb-2">Transfer Check To</p>
            {toOrder && <OrderLayoutTemplate order={toOrderTemplateData(toOrder)} />}
          </div>

          {/* Bottom Buttons */}
          <div className="px-6 pb-6 flex gap-3">
            <button
              onClick={() => setIsConfirmDialogOpen(false)}
              className="px-6 py-2 rounded-full text-white font-medium text-sm bg-neutral-800"
            >
              CANCEL
            </button>
            <button
              onClick={handleFinalConfirm}
              className="flex-1 py-2 rounded-full text-black font-medium text-sm"
              style={{ background: "linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)" }}
            >
              CONFIRM TRANSFER
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={isSuccessDialogOpen} onOpenChange={setIsSuccessDialogOpen}>
        <DialogContent className="bg-neutral-900 border-white/10 p-6 max-w-sm text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
            <Check className="w-8 h-8 text-green-500" />
          </div>
          <h2 className="text-white text-xl font-medium mb-2">Check Transferred</h2>
          <p className="text-white/60 text-sm mb-6">
            Check {currentOrder.id} was moved to {toOrder?.table}
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setIsSuccessDialogOpen(false);
                navigate(`/tableorder/${tableId}`);
              }}
              className="flex-1 py-2 rounded-full text-white font-medium text-sm bg-neutral-800"
            >
              Close
            </button>
            <button
              onClick={() => {
                setIsSuccessDialogOpen(false);
                navigate(`/tableorder/${toOrder?.table}`);
              }}
              className="flex-1 py-2 rounded-full text-black font-medium text-sm"
              style={{ background: "linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)" }}
            >
              Go to {toOrder?.table}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TransferOrders;
