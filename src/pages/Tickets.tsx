import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Search, SlidersHorizontal, Phone, ShoppingBag, Truck, Wine } from "lucide-react";

// Import icons
import runnerIcon from "@/assets/icons/runner.png";
import clearIcon from "@/assets/icons/clear-c.png";
import fireIcon from "@/assets/icons/fire.png";
import tableTargetIcon from "@/assets/icons/table-target.png";
import arrowRightIcon from "@/assets/icons/arrow-right.png";
import shareOrderIcon from "@/assets/icons/share-order.png";
import shareSeatsIcon from "@/assets/icons/share-seats.png";
import seatIcon from "@/assets/icons/seat-icon.png";
import splitIcon from "@/assets/icons/split-icon.png";
import mergeIcon from "@/assets/icons/merge-icon.png";
import dineInIcon from "@/assets/icons/dine-in.png";

// Order type icon component
const OrderTypeIcon = ({ type, size = "default" }: { type: string; size?: "small" | "default" }) => {
  const iconSize = size === "small" ? "w-4 h-4" : "w-5 h-5";
  const lucideSize = size === "small" ? 16 : 20;
  
  switch (type) {
    case "Dine-In":
      return <img src={dineInIcon} alt="Dine-In" className={`${iconSize} object-contain`} />;
    case "Takeout":
      return <ShoppingBag className={iconSize} style={{ color: '#4ADE80' }} />;
    case "Delivery":
      return <Truck className={iconSize} style={{ color: '#60A5FA' }} />;
    case "Bar":
      return <Wine className={iconSize} style={{ color: '#F472B6' }} />;
    default:
      return <img src={tableTargetIcon} alt="Order" className={`${iconSize} object-cover`} />;
  }
};

// Order item interface
interface OrderItem {
  qty: number;
  name: string;
  price: number;
  seats: number[];
  modifiers: string[];
}

// Guest order interface with linked items
interface GuestOrder {
  id: string;
  name: string;
  phone: string;
  partySize: number;
  time: string;
  timer: string;
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
}

// Mock all orders data
const allOrders: GuestOrder[] = [
  {
    id: "3",
    name: "Martin Alex",
    phone: "(415) 555-0123",
    partySize: 4,
    time: "8:00 PM",
    timer: "00:00",
    server: "Mia Jone",
    check: "--",
    paymentType: "--",
    revenueCenter: "FF Balcony",
    status: "ORDERING",
    notes: "Allergic to almonds, Don't add onion",
    table: "T2",
    orderType: "Dine-In",
    items: [
      { qty: 2, name: "Classic Crispy Burger", price: 12.00, seats: [1, 2], modifiers: [] },
      { qty: 4, name: "Meatballs", price: 4.00, seats: [], modifiers: ["Extra Sauce"] },
      { qty: 2, name: "Rigatoni Pasta", price: 8.00, seats: [3, 4], modifiers: [] },
      { qty: 1, name: "Almond Crusted Salmon", price: 20.00, seats: [], modifiers: ["- Salad", "- Balsamic Vinaigrette"] }
    ],
    subtotal: 68.00,
    discount: 5.00,
    serviceCharge: 3.40,
    tax: 4.56,
    tip: 0,
    total: 70.96
  },
  {
    id: "2",
    name: "Mike Wheelers",
    phone: "(415) 555-0456",
    partySize: 3,
    time: "7:30 PM",
    timer: "1:16 Hrs",
    server: "Dustin H",
    check: "123423",
    paymentType: "Cash",
    revenueCenter: "FF Balcony",
    status: "PAID",
    notes: "Birthday celebration - bring candle",
    table: "T2",
    orderType: "Takeout",
    items: [
      { qty: 1, name: "New York Strip Steak", price: 28.00, seats: [1], modifiers: ["Medium Rare"] },
      { qty: 1, name: "Grilled Salmon", price: 24.00, seats: [2], modifiers: ["No Lemon"] },
      { qty: 1, name: "Caesar Salad", price: 12.00, seats: [3], modifiers: ["Extra Croutons"] }
    ],
    subtotal: 101.00,
    discount: 0,
    serviceCharge: 5.05,
    tax: 7.42,
    tip: 15.00,
    total: 128.47
  },
  {
    id: "1",
    name: "Sarah Johnson",
    phone: "(415) 555-0789",
    partySize: 2,
    time: "7:15 PM",
    timer: "1:45 Hrs",
    server: "Dustin H",
    check: "123443",
    paymentType: "--",
    revenueCenter: "FF Balcony",
    status: "UNPAID",
    notes: "Gluten-free options requested",
    table: "T1",
    orderType: "Delivery",
    items: [
      { qty: 2, name: "Margherita Pizza", price: 16.00, seats: [1, 2], modifiers: ["Gluten-Free Crust"] },
      { qty: 1, name: "Caprese Salad", price: 14.00, seats: [], modifiers: ["No Basil"] }
    ],
    subtotal: 72.00,
    discount: 10.00,
    serviceCharge: 3.10,
    tax: 4.34,
    tip: 0,
    total: 69.44
  },
  {
    id: "4",
    name: "David Chen",
    phone: "(415) 555-1234",
    partySize: 6,
    time: "6:45 PM",
    timer: "2:30 Hrs",
    server: "Mia Jone",
    check: "123456",
    paymentType: "Credit Card",
    revenueCenter: "Main Dining",
    status: "PAID",
    notes: "Corporate dinner - split bill 3 ways",
    table: "T5",
    orderType: "Dine-In",
    items: [
      { qty: 2, name: "Lobster Tail", price: 45.00, seats: [1, 2], modifiers: ["Extra Butter"] },
      { qty: 2, name: "Filet Mignon", price: 42.00, seats: [3, 4], modifiers: ["Medium"] }
    ],
    subtotal: 428.00,
    discount: 20.00,
    serviceCharge: 20.40,
    tax: 28.59,
    tip: 64.20,
    total: 521.19
  },
  {
    id: "5",
    name: "Guest",
    phone: "",
    partySize: 1,
    time: "8:30 PM",
    timer: "00:15",
    server: "Mia Jone",
    check: "--",
    paymentType: "--",
    revenueCenter: "Bar",
    status: "ORDERING",
    notes: "",
    table: "Bar",
    orderType: "Bar",
    items: [
      { qty: 1, name: "Classic Burger", price: 15.00, seats: [1], modifiers: ["No Pickles", "+ Bacon"] },
      { qty: 1, name: "Craft IPA", price: 8.00, seats: [], modifiers: [] }
    ],
    subtotal: 23.00,
    discount: 0,
    serviceCharge: 1.15,
    tax: 1.69,
    tip: 0,
    total: 25.84
  },
  {
    id: "6",
    name: "Emily Davis",
    phone: "(415) 555-7890",
    partySize: 2,
    time: "9:00 PM",
    timer: "00:05",
    server: "Mia Jone",
    check: "--",
    paymentType: "--",
    revenueCenter: "Patio",
    status: "ORDERING",
    notes: "Anniversary dinner",
    table: "T7",
    orderType: "Dine-In",
    items: [
      { qty: 2, name: "Champagne", price: 25.00, seats: [], modifiers: [] }
    ],
    subtotal: 50.00,
    discount: 0,
    serviceCharge: 2.50,
    tax: 3.68,
    tip: 0,
    total: 56.18
  },
  {
    id: "7",
    name: "James Wilson",
    phone: "(415) 555-3456",
    partySize: 1,
    time: "8:45 PM",
    timer: "00:10",
    server: "Dustin H",
    check: "--",
    paymentType: "--",
    revenueCenter: "Online",
    status: "ORDERING",
    notes: "Leave at door",
    table: "--",
    orderType: "Delivery",
    items: [
      { qty: 2, name: "Pepperoni Pizza", price: 18.00, seats: [], modifiers: [] },
      { qty: 1, name: "Garlic Bread", price: 6.00, seats: [], modifiers: [] }
    ],
    subtotal: 42.00,
    discount: 0,
    serviceCharge: 2.10,
    tax: 3.09,
    tip: 0,
    total: 47.19
  },
  {
    id: "8",
    name: "Lisa Park",
    phone: "(415) 555-9012",
    partySize: 2,
    time: "7:50 PM",
    timer: "0:30 Hrs",
    server: "Mia Jone",
    check: "123478",
    paymentType: "--",
    revenueCenter: "Counter",
    status: "ORDERING",
    notes: "Picking up in 15 mins",
    table: "--",
    orderType: "Takeout",
    items: [
      { qty: 2, name: "Fish Tacos", price: 14.00, seats: [], modifiers: ["Extra Lime"] },
      { qty: 2, name: "Churros", price: 7.00, seats: [], modifiers: [] }
    ],
    subtotal: 42.00,
    discount: 0,
    serviceCharge: 2.10,
    tax: 3.09,
    tip: 0,
    total: 47.19
  }
];

// Helper function to format price
const formatPrice = (price: number) => `$${price.toFixed(2)}`;

// Helper function to get order items for display
const getOrderItems = (order: GuestOrder) => order.items.map(item => ({
  ...item,
  price: formatPrice(item.price * item.qty)
}));

const filters = ["All", "Open", "Completed", "Paid", "Unpaid"];

const Tickets = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const highlightOrderId = searchParams.get('highlight');
  
  const [activeFilter, setActiveFilter] = useState("All");
  const [selectedGuest, setSelectedGuest] = useState(allOrders[0]);
  const [selectedSeats, setSelectedSeats] = useState<number[]>([1, 2, 3, 4]);
  const [showMobileOrderPanel, setShowMobileOrderPanel] = useState(false);
  const [highlightedOrderId, setHighlightedOrderId] = useState<string | null>(null);

  // Handle highlight parameter from URL (when order is fired)
  useEffect(() => {
    if (highlightOrderId) {
      const order = allOrders.find(o => o.id === highlightOrderId);
      if (order) {
        setSelectedGuest(order);
        setHighlightedOrderId(highlightOrderId);
        // Remove highlight after 3 seconds
        setTimeout(() => setHighlightedOrderId(null), 3000);
      }
    }
  }, [highlightOrderId]);

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
    if (cardId && !isInteractive) {
      const currentX = swipeStatesRef.current[cardId] ?? 0;
      const snapTo = currentX < swipeWidth / 2 ? swipeWidth : 0;
      setCardSwipeX(cardId, snapTo);
    }
    isDraggingRef.current = false;
    currentCardId.current = null;
    currentGuest.current = null;

    if (triggerTap && !hasMoved.current && guest && !isInteractive) {
      suppressNextClickRef.current = true;
      handleMobileOrderClick(guest);
    }
    hasMoved.current = false;
  };

  const handleCardClick = (guest: GuestOrder) => {
    if (suppressNextClickRef.current) {
      suppressNextClickRef.current = false;
      return;
    }
    if (!hasMoved.current) {
      handleMobileOrderClick(guest);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ORDERING": return "text-[#F87171]";
      case "FIRED": return "text-orange-500";
      case "PAID": return "text-green-500";
      case "UNPAID": return "text-red-400";
      case "COMPLETED": return "text-green-500";
      default: return "text-white";
    }
  };

  const getFilterCount = (filter: string) => {
    if (filter === "All") return allOrders.length;
    if (filter === "Open") return allOrders.filter(g => g.status === "ORDERING").length;
    if (filter === "Completed") return allOrders.filter(g => g.status === "COMPLETED").length;
    if (filter === "Paid") return allOrders.filter(g => g.status === "PAID" || g.paymentType !== "--").length;
    if (filter === "Unpaid") return allOrders.filter(g => g.status === "UNPAID" || g.paymentType === "--").length;
    return 0;
  };

  const filteredOrders = activeFilter === "All" ? allOrders : allOrders.filter(guest => {
    switch (activeFilter) {
      case "Open": return guest.status === "ORDERING";
      case "Completed": return guest.status === "COMPLETED";
      case "Paid": return guest.status === "PAID" || guest.paymentType !== "--";
      case "Unpaid": return guest.status === "UNPAID" || guest.paymentType === "--";
      default: return true;
    }
  });

  const toggleSeat = (seat: number) => {
    setSelectedSeats(prev => prev.includes(seat) ? prev.filter(s => s !== seat) : [...prev, seat]);
  };

  const handleMobileOrderClick = (guest: GuestOrder) => {
    setSelectedGuest(guest);
    setShowMobileOrderPanel(true);
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

  // Mobile Layout
  const MobileLayout = () => (
    <div className="flex flex-col h-full bg-black">
      {/* Header - No back icon */}
      <div className="relative flex items-center justify-between p-2 border-b border-neutral-700/50">
        <span className="text-white font-semibold text-lg pl-2">Tickets</span>
        
        <div className="flex items-center gap-2 z-10">
          <button className="p-2 rounded-full hover:opacity-80 transition-opacity" style={{ background: "#7575754D", boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)" }}>
            <SlidersHorizontal className="w-4 h-4 text-white" />
          </button>
          <button className="p-2 rounded-full hover:opacity-80 transition-opacity" style={{ background: "#7575754D", boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)" }}>
            <Search className="w-4 h-4 text-white" />
          </button>
        </div>
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

      {/* Guest Orders List */}
      <ScrollArea className="flex-1 px-3">
        <div className="space-y-2 pb-3">
          {filteredOrders.map(guest => (
            <div key={guest.id} className="space-y-0">
              <div className="relative rounded-xl cursor-pointer transition-all overflow-hidden bg-black">
                {/* Swipe Action Buttons */}
                <div className={`absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2 md:hidden transition-opacity duration-200 ${(swipeStates[guest.id] || 0) < -20 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                  <button className="w-10 h-10 flex items-center justify-center rounded-full transition-colors" style={{ backgroundColor: '#666666' }}>
                    <img src={mergeIcon} alt="Merge" className="w-5 h-5 object-contain" />
                  </button>
                  <button className="w-10 h-10 flex items-center justify-center rounded-full transition-colors" style={{ background: 'linear-gradient(180deg, #FF9E65 0%, #FF5E00 100%)' }}>
                    <img src={shareOrderIcon} alt="Transfer" className="w-5 h-5 object-contain" />
                  </button>
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
                  <div className={`flex items-stretch w-full gap-2 border rounded-xl bg-neutral-900 ${selectedGuest.id === guest.id ? 'border-white' : 'border-white/10'} ${highlightedOrderId === guest.id ? 'ring-2 ring-orange-500 animate-pulse' : ''}`}>
                    {/* Column 1: Order Number */}
                    <div className="w-[15%] flex-shrink-0 px-2 py-2 flex items-center">
                      <div className="relative w-10 h-14 bg-neutral-800 rounded-lg flex flex-col items-center justify-center gap-1 border border-neutral-600">
                        <span className="text-base font-bold text-white">{guest.id}</span>
                        <OrderTypeIcon type={guest.orderType} size="small" />
                      </div>
                    </div>

                    {/* Column 2: Guest Info */}
                    <div className="flex-1 min-w-0 py-2 pr-2 md:pr-0">
                      <div className="flex flex-col">
                        <div className="flex items-start justify-between">
                          <span className="text-white font-medium text-sm">{guest.name}</span>
                          <div className="flex flex-col items-end">
                            <span className="text-white font-semibold text-sm">{formatPrice(guest.total)}</span>
                            {guest.tip > 0 && <span className="text-gray-400 text-xs">+ Tip {formatPrice(guest.tip)}</span>}
                          </div>
                        </div>
                        <div className="h-px bg-neutral-600 my-1.5"></div>
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1 text-gray-400">
                            <span>{guest.table},</span>
                            <span>Party Of {guest.partySize},</span>
                            <span>⚡ {guest.time}</span>
                          </div>
                          <span className={getStatusColor(guest.status)}>{guest.status}</span>
                        </div>
                      </div>
                    </div>

                    {/* Column 3: Action Button */}
                    <div className="hidden md:flex flex-shrink-0">
                      <div className="flex flex-col bg-neutral-700 rounded-r-xl overflow-hidden">
                        <button className="flex-1 px-3 py-3 flex items-center justify-center hover:bg-neutral-600 transition-colors">
                          <img src={arrowRightIcon} alt="Arrow" className="w-4 h-4 object-contain" />
                        </button>
                      </div>
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

      {/* Mobile Order Panel */}
      {showMobileOrderPanel && <MobileOrderPanel />}
    </div>
  );

  // Desktop Layout
  const DesktopLayout = () => (
    <div className="flex h-full bg-black">
      {/* Left Panel - Order List */}
      <div className="flex flex-col flex-1 m-2 rounded-[20px] overflow-hidden">
        {/* Header - No back icon */}
        <div className="flex items-center justify-between p-2 border-b border-neutral-700/50">
          <span className="text-white font-semibold text-lg pl-2">Tickets</span>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-full hover:opacity-80 transition-opacity" style={{ background: "#7575754D", boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)" }}>
              <SlidersHorizontal className="w-4 h-4 text-white" />
            </button>
            <button className="p-2 rounded-full hover:opacity-80 transition-opacity" style={{ background: "#7575754D", boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)" }}>
              <Search className="w-4 h-4 text-white" />
            </button>
          </div>
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
            {filteredOrders.map(guest => (
              <div key={guest.id} className="space-y-0">
                <div 
                  onClick={() => setSelectedGuest(guest)} 
                  className={`rounded-xl border cursor-pointer transition-all overflow-hidden ${selectedGuest.id === guest.id ? "border-white" : "border-neutral-700 hover:border-neutral-600"} ${highlightedOrderId === guest.id ? 'ring-2 ring-orange-500 animate-pulse' : ''}`} 
                  style={{ backgroundColor: '#1B1C20' }}
                >
                  <div className="flex items-stretch w-full gap-4">
                    {/* Column 1: Order Number - 8% */}
                    <div className="w-[8%] flex-shrink-0 px-3 py-2 flex items-center">
                      <div className="relative w-12 h-16 bg-neutral-800 rounded-lg flex flex-col items-center justify-center gap-2 border border-neutral-600">
                        <span className="text-lg font-bold text-white">{guest.id}</span>
                        <OrderTypeIcon type={guest.orderType} />
                      </div>
                    </div>

                    {/* Column 2: Guest Info - flex-1 */}
                    <div className="flex-1 min-w-0 py-2">
                      <div className="flex flex-col">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-1">
                            <span className="text-white font-medium text-sm">{guest.name}</span>
                            <span className="text-white/60">·</span>
                            <span className="text-white/60 text-sm truncate">{guest.revenueCenter}</span>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className="text-white font-semibold text-sm">{formatPrice(guest.total)}</span>
                            {guest.tip > 0 && <span className="text-gray-400 text-xs">+ Tip {formatPrice(guest.tip)}</span>}
                          </div>
                        </div>
                        <div className="h-px bg-neutral-600 my-1.5"></div>
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1 text-gray-400">
                            <span>{guest.table},</span>
                            <span>Party Of {guest.partySize},</span>
                            <span>⚡ {guest.time}</span>
                          </div>
                          <span className={getStatusColor(guest.status)}>{guest.status}</span>
                        </div>
                      </div>
                    </div>

                    {/* Column 3: Timer & Server - 12% */}
                    <div className="w-[12%] flex-shrink-0 py-2">
                      <div className="flex flex-col text-xs gap-1">
                        <div className="text-left">
                          <div className="text-white font-medium">{guest.timer}</div>
                          <div className="text-gray-500">Timer</div>
                        </div>
                        <div className="text-left">
                          <div className="text-white">{guest.server}</div>
                          <div className="text-gray-500">Server</div>
                        </div>
                      </div>
                    </div>

                    {/* Column 4: Check - 12% */}
                    <div className="w-[12%] flex-shrink-0 py-2">
                      <div className="flex flex-col text-xs gap-1">
                        <div className="text-left">
                          <div className="text-white font-medium">{guest.check}</div>
                          <div className="text-gray-500">Check</div>
                        </div>
                        <div className="text-left">
                          <div className="text-white">{guest.paymentType === '--' ? 'Un Paid' : 'Paid'}</div>
                          <div className="text-gray-500">Payment</div>
                        </div>
                      </div>
                    </div>

                    {/* Column 5: Payment Type - 12% */}
                    <div className="w-[12%] flex-shrink-0 self-start py-2">
                      <div className="flex flex-col text-xs">
                        <div className="text-left">
                          <div className="text-white font-medium">{guest.paymentType}</div>
                          <div className="text-gray-500">Payment Type</div>
                        </div>
                      </div>
                    </div>

                    {/* Column 6: Action Buttons */}
                    <div className="flex-shrink-0 flex">
                      <div className="flex flex-col rounded-r-xl overflow-hidden">
                        <button 
                          className="flex-1 px-3 flex items-center justify-center hover:opacity-80 transition-opacity border-b border-neutral-600" 
                          style={{ background: 'linear-gradient(180deg, #FF9E65 0%, #FF5E00 100%)' }}
                          onClick={e => {
                            e.stopPropagation();
                            navigate(`/tableorder/${guest.table.replace('T', '')}/merge?orderId=${guest.id}`);
                          }}
                        >
                          <img src={arrowRightIcon} alt="Merge" className="w-4 h-4 object-contain" />
                        </button>
                        <button 
                          className="flex-1 px-3 flex items-center justify-center hover:opacity-80 transition-opacity" 
                          style={{ background: 'linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)' }} 
                          onClick={e => {
                            e.stopPropagation();
                            navigate(`/tableorder/${guest.table.replace('T', '')}/transfer?orderId=${guest.id}`);
                          }}
                        >
                          <img src={shareOrderIcon} alt="Transfer" className="w-4 h-4 object-contain brightness-0" />
                        </button>
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

      {/* Right Panel - Order Details */}
      <div className="w-[345px] flex flex-col m-2 ml-0">
        {/* Guest Header */}
        <div className="px-2 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white font-medium">{selectedGuest.name}</span>
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
          <div className="flex gap-2">
            <button className="px-3 py-1.5 bg-neutral-700 text-white text-xs rounded-full hover:bg-neutral-600 transition-colors">Add Item</button>
            <button className="px-3 py-1.5 bg-neutral-700 text-white text-xs rounded-full hover:bg-neutral-600 transition-colors">Discount</button>
            <button className="px-3 py-1.5 bg-neutral-700 text-white text-xs rounded-full hover:bg-neutral-600 transition-colors">Receipt</button>
            <button className="px-3 py-1.5 bg-neutral-700 text-white text-xs rounded-full hover:bg-neutral-600 transition-colors">Cash Register</button>
          </div>
        </div>

        {/* Main Panel Box */}
        <div className="flex-1 flex flex-col rounded-[10px] overflow-hidden" style={{ background: "#7575754D", boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)" }}>
          {/* Table Order Info */}
          <div className="px-4 py-3 border-b border-white/10">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-white/10 text-white text-xs rounded">TABLE ORDER</span>
                <span className="text-white font-bold">{selectedGuest.id}</span>
              </div>
              <div className="flex items-center gap-2">
                <img src={shareSeatsIcon} alt="Seats" className="w-4 h-4 opacity-60" />
                <span className="text-white/50 text-sm">{selectedGuest.server}</span>
              </div>
            </div>
            
            {/* Seat Buttons */}
            <div className="flex items-center gap-2">
              <button className="p-1.5 bg-white/10 rounded hover:bg-white/20 transition-colors">
                <img src={seatIcon} alt="Seat" className="w-4 h-4" />
              </button>
              <button className="p-1.5 bg-white/10 rounded hover:bg-white/20 transition-colors">
                <img src={splitIcon} alt="Split" className="w-4 h-4" />
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
          <div className="px-4 py-3 border-b border-white/10">
            <div className="flex items-center gap-2 text-white/50 text-sm bg-white/10 p-2 rounded-lg">
              <span>📝</span>
              <span>{selectedGuest.notes || "No notes"}</span>
            </div>
          </div>

          {/* Order Items */}
          <ScrollArea className="flex-1 px-4">
            <div className="py-2 space-y-2">
              {getOrderItems(selectedGuest).map((item, index) => (
                <div key={index} className="p-3 bg-white/5 rounded-xl border border-white/10">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2">
                      <span className="w-6 h-6 bg-white rounded flex items-center justify-center text-black text-sm font-bold">
                        {item.qty}
                      </span>
                      <div>
                        <span className="text-white font-medium">{item.name}</span>
                        {item.modifiers.length > 0 && (
                          <div className="mt-1 text-white/50 text-sm space-y-0.5">
                            {item.modifiers.map((mod, i) => <div key={i}>{mod}</div>)}
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="text-white font-medium">{item.price}</span>
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

          {/* Order Summary */}
          <div className="p-2 border-t border-white/10 flex-shrink-0">
            <div className="text-xs rounded px-2 py-1.5 space-y-0.5" style={{ background: '#7575754D', boxShadow: 'inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)' }}>
              <div className="flex justify-between gap-3">
                <span className="text-white">Sub Total: <span className="font-medium">{formatPrice(selectedGuest.subtotal)}</span></span>
                <span className="text-white">Discount: <span className="font-medium">{formatPrice(selectedGuest.discount)}</span></span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-white">Service Charge: <span className="font-medium">{formatPrice(selectedGuest.serviceCharge)}</span></span>
                <span className="text-white">Tax: <span className="font-medium">{formatPrice(selectedGuest.tax)}</span></span>
              </div>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="px-4 py-3 border-t border-white/10 flex items-center gap-2">
            <button className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center hover:bg-red-500 transition-colors">
              <img src={clearIcon} alt="Clear" className="w-4 h-4 brightness-0 invert" />
            </button>
            <button disabled className="px-4 py-2 rounded-full flex items-center gap-1 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed" style={{ background: "linear-gradient(180deg, #FF9E65 0%, #FF5E00 100%)" }}>
              <img src={fireIcon} alt="Fire" className="w-4 h-4 brightness-0 invert" />
              <span>FIRE</span>
            </button>
            <button className="flex-1 py-2 rounded-full text-black text-sm font-bold" style={{ background: "linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)" }}>
              CHARGE {formatPrice(selectedGuest.total)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Tablet Layout
  const TabletLayout = () => (
    <div className="flex h-full bg-black">
      {/* Left Panel - Order List */}
      <div className="flex flex-col flex-1 m-2 rounded-[20px] overflow-hidden">
        {/* Header - No back icon */}
        <div className="relative flex items-center justify-between p-2 border-b border-neutral-700/50">
          <span className="text-white font-semibold text-lg pl-2">Tickets</span>
          
          <div className="flex items-center gap-2 z-10">
            <button className="p-2 rounded-full hover:opacity-80 transition-opacity" style={{ background: "#7575754D", boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)" }}>
              <SlidersHorizontal className="w-4 h-4 text-white" />
            </button>
            <button className="p-2 rounded-full hover:opacity-80 transition-opacity" style={{ background: "#7575754D", boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)" }}>
              <Search className="w-4 h-4 text-white" />
            </button>
          </div>
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
            {filteredOrders.map(guest => (
              <div key={guest.id} className="space-y-0">
                <div onClick={() => setSelectedGuest(guest)} className={`rounded-xl border cursor-pointer transition-all overflow-hidden ${selectedGuest.id === guest.id ? "border-white" : "border-neutral-700 hover:border-neutral-600"} ${highlightedOrderId === guest.id ? 'ring-2 ring-orange-500 animate-pulse' : ''}`} style={{ backgroundColor: '#1B1C20' }}>
                  <div className="flex items-stretch w-full gap-2">
                    {/* Column 1: Order Number */}
                    <div className="w-[15%] flex-shrink-0 px-2 py-2 flex items-center">
                      <div className="relative w-10 h-14 bg-neutral-800 rounded-lg flex flex-col items-center justify-center gap-1 border border-neutral-600">
                        <span className="text-base font-bold text-white">{guest.id}</span>
                        <OrderTypeIcon type={guest.orderType} size="small" />
                      </div>
                    </div>

                    {/* Column 2: Guest Info */}
                    <div className="flex-1 min-w-0 py-2 pr-2">
                      <div className="flex flex-col">
                        <div className="flex items-start justify-between">
                          <span className="text-white font-medium text-sm">{guest.name}</span>
                          <div className="flex flex-col items-end">
                            <span className="text-white font-semibold text-sm">{formatPrice(guest.total)}</span>
                            {guest.tip > 0 && <span className="text-gray-400 text-xs">+ Tip {formatPrice(guest.tip)}</span>}
                          </div>
                        </div>
                        <div className="h-px bg-neutral-600 my-1.5"></div>
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1 text-gray-400">
                            <span>{guest.table},</span>
                            <span>Party Of {guest.partySize},</span>
                            <span>⚡ {guest.time}</span>
                          </div>
                          <span className={getStatusColor(guest.status)}>{guest.status}</span>
                        </div>
                      </div>
                    </div>

                    {/* Column 3: Action Button */}
                    <div className="flex-shrink-0">
                      <div className="flex flex-col bg-neutral-700 rounded-r-xl overflow-hidden h-full">
                        <button className="flex-1 px-3 py-3 flex items-center justify-center hover:bg-neutral-600 transition-colors">
                          <img src={arrowRightIcon} alt="Arrow" className="w-4 h-4 object-contain" />
                        </button>
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
      <div className="w-[280px] flex flex-col m-2 ml-0">
        {/* Guest Header */}
        <div className="px-2 py-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white font-medium text-sm">{selectedGuest.name}</span>
            <div className="flex items-center gap-2 text-white/50 text-xs">
              <Phone className="w-3 h-3" />
              <span>⚡ {selectedGuest.time}</span>
            </div>
          </div>
          <div className="flex gap-1 flex-wrap">
            <button className="px-2 py-1 bg-neutral-700 text-white text-xs rounded-full hover:bg-neutral-600 transition-colors">Add Item</button>
            <button className="px-2 py-1 bg-neutral-700 text-white text-xs rounded-full hover:bg-neutral-600 transition-colors">Discount</button>
            <button className="px-2 py-1 bg-neutral-700 text-white text-xs rounded-full hover:bg-neutral-600 transition-colors">Receipt</button>
          </div>
        </div>

        {/* Main Panel Box */}
        <div className="flex-1 flex flex-col rounded-[10px] overflow-hidden" style={{ background: "#7575754D", boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)" }}>
          {/* Table Order Info */}
          <div className="px-3 py-2 border-b border-white/10">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 bg-white/10 text-white text-xs rounded">ORDER</span>
                <span className="text-white font-bold text-sm">{selectedGuest.id}</span>
              </div>
              <span className="text-white/50 text-xs">{selectedGuest.server}</span>
            </div>
            
            {/* Seat Buttons */}
            <div className="flex items-center gap-1">
              <button className="p-1 bg-white/10 rounded hover:bg-white/20 transition-colors">
                <img src={seatIcon} alt="Seat" className="w-3 h-3" />
              </button>
              {[1, 2, 3, 4].map(seat => (
                <button 
                  key={seat} 
                  onClick={() => toggleSeat(seat)} 
                  className={`w-6 h-6 rounded text-xs font-medium transition-colors ${selectedSeats.includes(seat) ? "bg-white text-black" : "bg-white/10 text-white hover:bg-white/20"}`}
                >
                  {seat}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          {selectedGuest.notes && (
            <div className="px-3 py-2 border-b border-white/10">
              <div className="flex items-center gap-2 text-white/50 text-xs bg-white/10 p-1.5 rounded-lg">
                <span>📝</span>
                <span className="truncate">{selectedGuest.notes}</span>
              </div>
            </div>
          )}

          {/* Order Items */}
          <ScrollArea className="flex-1 px-3">
            <div className="py-2 space-y-1.5">
              {getOrderItems(selectedGuest).map((item, index) => (
                <div key={index} className="p-2 bg-white/5 rounded-lg border border-white/10">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2">
                      <span className="w-5 h-5 bg-white rounded flex items-center justify-center text-black text-xs font-bold">
                        {item.qty}
                      </span>
                      <div>
                        <span className="text-white font-medium text-sm">{item.name}</span>
                        {item.modifiers.length > 0 && (
                          <div className="mt-0.5 text-white/50 text-xs space-y-0.5">
                            {item.modifiers.slice(0, 2).map((mod, i) => <div key={i}>{mod}</div>)}
                            {item.modifiers.length > 2 && <div>+{item.modifiers.length - 2} more</div>}
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="text-white font-medium text-sm">{item.price}</span>
                  </div>
                </div>
              ))}
            </div>
            <ScrollBar orientation="vertical" />
          </ScrollArea>

          {/* Order Summary */}
          <div className="p-2 border-t border-white/10 flex-shrink-0">
            <div className="text-xs rounded px-2 py-1 space-y-0.5" style={{ background: '#7575754D' }}>
              <div className="flex justify-between">
                <span className="text-white">Sub Total: {formatPrice(selectedGuest.subtotal)}</span>
                <span className="text-white">Discount: {formatPrice(selectedGuest.discount)}</span>
              </div>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="px-3 py-2 border-t border-white/10 flex items-center gap-2">
            <button className="w-7 h-7 rounded-full bg-red-600 flex items-center justify-center hover:bg-red-500 transition-colors">
              <img src={clearIcon} alt="Clear" className="w-3 h-3 brightness-0 invert" />
            </button>
            <button className="px-3 py-1.5 rounded-full flex items-center gap-1 text-white text-xs font-medium" style={{ background: "linear-gradient(180deg, #FF9E65 0%, #FF5E00 100%)" }}>
              <img src={fireIcon} alt="Fire" className="w-3 h-3 brightness-0 invert" />
              <span>FIRE</span>
            </button>
            <button className="flex-1 py-1.5 rounded-full text-black text-xs font-bold" style={{ background: "linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)" }}>
              CHARGE {formatPrice(selectedGuest.total)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

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
    </>
  );
};

export default Tickets;
