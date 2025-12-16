import { useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { ChevronLeft, ChevronDown, Search, SlidersHorizontal, Phone } from "lucide-react";

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
import searchIcon from "@/assets/icons/search.png";

// Mock guest orders data
const guestOrders = [{
  id: "3",
  name: "Martin Alex",
  amount: "$37.31",
  tip: "",
  partySize: 4,
  time: "8:00 PM",
  timer: "00:00",
  server: "Mia Jone",
  check: "--",
  paymentType: "--",
  revenueCenter: "FF Balcony",
  status: "ORDERING"
}, {
  id: "2",
  name: "Mike Wheelers",
  amount: "$40.00",
  tip: "",
  partySize: 3,
  time: "7:30 PM",
  timer: "1:16 Hrs",
  server: "Dustin H",
  check: "123423",
  paymentType: "Cash",
  revenueCenter: "FF Balcony",
  status: "PAID"
}, {
  id: "1",
  name: "Guest",
  amount: "45.31",
  tip: "",
  partySize: 2,
  time: "7:15 PM",
  timer: "1:16 Hrs",
  server: "Dustin H",
  check: "123443",
  paymentType: "--",
  revenueCenter: "FF Balcony",
  status: "UNPAID"
}];

// Mock order items for right panel
const orderItems = [{
  qty: 2,
  name: "Classic Crispy Burger",
  price: "$12.00",
  seats: [1, 2],
  modifiers: []
}, {
  qty: 4,
  name: "Meatballs",
  price: "$16.00",
  seats: [],
  modifiers: []
}, {
  qty: 2,
  name: "Rigatoni Pasta",
  price: "$8.00",
  seats: [3, 4],
  modifiers: []
}, {
  qty: 4,
  name: "Alomd crusted salmon",
  price: "$20.00",
  seats: [],
  modifiers: ["- Salad", "- Balsamic Vinaigrette", "- Medium Rare", "+ W/ Potato Wedges", "- large", "+ W/ Extra Cheese"]
}];

const filters = ["All", "Open", "Completed", "Paid", "Unpaid"];

const TableOrderDetails = () => {
  const navigate = useNavigate();
  const { tableId } = useParams();
  const [activeFilter, setActiveFilter] = useState("All");
  const [selectedGuest, setSelectedGuest] = useState(guestOrders[0]);
  const [selectedSeats, setSelectedSeats] = useState<number[]>([1, 2, 3, 4]);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [showMobileOrderPanel, setShowMobileOrderPanel] = useState(false);
  
  // Swipe state for mobile cards
  const [swipeStates, setSwipeStates] = useState<Record<string, number>>({});
  const swipeStatesRef = useRef<Record<string, number>>({});
  const isDraggingRef = useRef(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const startOffsetX = useRef(0);
  const currentCardId = useRef<string | null>(null);
  const currentGuest = useRef<(typeof guestOrders)[0] | null>(null);
  const hasMoved = useRef(false);
  const suppressNextClickRef = useRef(false);

  const swipeWidth = -120; // Reveal width for action buttons
  const MOVE_THRESHOLD = 10;

  const isInteractiveElement = (target: EventTarget | null) =>
    target instanceof Element &&
    !!target.closest("button,a,input,textarea,select,[role='button']");

  const setCardSwipeX = (cardId: string, x: number) => {
    setSwipeStates((prev) => {
      const next = { ...prev, [cardId]: x };
      swipeStatesRef.current = next;
      return next;
    });
  };

  const handleSwipeStart = (
    e: React.TouchEvent | React.MouseEvent,
    guest: (typeof guestOrders)[0]
  ) => {
    // Allow taps on interactive elements (dropdown buttons etc.) to work normally.
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
    startOffsetX.current =
      swipeStatesRef.current[guest.id] ?? swipeStates[guest.id] ?? 0;
  };

  const handleSwipeMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDraggingRef.current || !currentCardId.current) return;

    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    const diffX = clientX - startX.current;
    const diffY = clientY - startY.current;

    const absX = Math.abs(diffX);
    const absY = Math.abs(diffY);

    // Only treat it as a "moved" gesture after a reasonable threshold.
    // This prevents tiny finger jitter from breaking taps.
    if (absX > MOVE_THRESHOLD || absY > MOVE_THRESHOLD) hasMoved.current = true;

    const isHorizontalGesture = absX > absY;

    // If it’s mostly vertical, let the ScrollArea do its job (no card swipe).
    if (!isHorizontalGesture) return;

    // Prevent vertical scroll stealing a real horizontal swipe (but only after threshold).
    if ("touches" in e && absX > MOVE_THRESHOLD) {
      e.preventDefault();
    }

    const rawX = startOffsetX.current + diffX;
    const newX = Math.max(swipeWidth, Math.min(rawX, 0));
    setCardSwipeX(currentCardId.current, newX);
  };

  const handleSwipeEnd = (
    triggerTap: boolean,
    e?: React.TouchEvent | React.MouseEvent,
    guestOverride?: (typeof guestOrders)[0]
  ) => {
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

    // On mobile, onClick can be cancelled; open on touch-end when it was really a tap.
    if (triggerTap && !hasMoved.current && guest && !isInteractive) {
      suppressNextClickRef.current = true;
      handleMobileOrderClick(guest);
    }

    hasMoved.current = false;
  };

  const handleCardClick = (guest: typeof guestOrders[0]) => {
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
      case "ORDERING":
        return "text-yellow-400";
      case "PAID":
        return "text-green-500";
      case "UNPAID":
        return "text-red-400";
      case "COMPLETED":
        return "text-green-500";
      default:
        return "text-white";
    }
  };

  const getFilterCount = (filter: string) => {
    if (filter === "All") return guestOrders.length;
    if (filter === "Open") return guestOrders.filter(g => g.status === "ORDERING").length;
    if (filter === "Completed") return guestOrders.filter(g => g.status === "COMPLETED").length;
    if (filter === "Paid") return guestOrders.filter(g => g.status === "PAID" || g.paymentType !== "--").length;
    if (filter === "Unpaid") return guestOrders.filter(g => g.status === "UNPAID" || g.paymentType === "--").length;
    if (filter === "Ordering") return guestOrders.filter(g => g.status === "ORDERING").length;
    return 0;
  };

  const filteredGuestOrders = activeFilter === "All" ? guestOrders : guestOrders.filter(guest => {
    switch (activeFilter) {
      case "Open":
        return guest.status === "ORDERING";
      case "Completed":
        return guest.status === "COMPLETED";
      case "Paid":
        return guest.status === "PAID" || guest.paymentType !== "--";
      case "Unpaid":
        return guest.status === "UNPAID" || guest.paymentType === "--";
      case "Ordering":
        return guest.status === "ORDERING";
      default:
        return true;
    }
  });

  const toggleSeat = (seat: number) => {
    setSelectedSeats(prev => prev.includes(seat) ? prev.filter(s => s !== seat) : [...prev, seat]);
  };

  const toggleOrderExpand = (orderId: string) => {
    setExpandedOrderId(prev => prev === orderId ? null : orderId);
  };

  const handleMobileOrderClick = (guest: typeof guestOrders[0]) => {
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
            style={{
              background: "#7575754D",
              boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)"
            }}
          >
            <ChevronLeft className="w-4 h-4 text-white" />
          </button>
          <span className="text-white font-medium">{selectedGuest.name}</span>
        </div>
        <div className="flex items-center gap-3 text-white/50 text-sm">
          <div className="flex items-center gap-1">
            <Phone className="w-3 h-3" />
            <span>(415) 123-4567</span>
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
            <button
              onClick={() => setShowMobileOrderPanel(false)}
              className="ml-2 w-6 h-6 flex items-center justify-center text-white/50 hover:text-white"
            >
              ⋮
            </button>
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
              className={`w-7 h-7 rounded text-sm font-medium transition-colors ${
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
      <div className="px-3 py-2 border-b border-neutral-700/50">
        <div className="flex items-center gap-2 text-white/50 text-sm bg-white/10 p-2 rounded-lg">
          <span>📝</span>
          <span>Allergic to almonds, Don't add onion</span>
        </div>
      </div>

      {/* Order Items */}
      <ScrollArea className="flex-1 px-3">
        <div className="py-2 space-y-2">
          {orderItems.map((item, index) => (
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
                        {item.modifiers.map((mod, i) => (
                          <div key={i}>{mod}</div>
                        ))}
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
          CHARGE $26.00
        </button>
      </div>
    </div>
  );

  // Mobile Layout
  const MobileLayout = () => (
    <div className="flex flex-col h-full bg-black">
      {/* Header */}
      <div className="flex items-center justify-between p-2 border-b border-neutral-700/50">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate("/tableorder")} 
            className="p-2 rounded-full hover:opacity-80 transition-opacity"
            style={{
              background: "#7575754D",
              boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)"
            }}
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <span className="text-white font-semibold text-lg">Table {tableId?.replace("T", "")}</span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            className="p-2 rounded-full hover:opacity-80 transition-opacity"
            style={{
              background: "#7575754D",
              boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)"
            }}
          >
            <SlidersHorizontal className="w-4 h-4 text-white" />
          </button>
          <button 
            className="p-2 rounded-full hover:opacity-80 transition-opacity"
            style={{
              background: "#7575754D",
              boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)"
            }}
          >
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
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-all ${
                activeFilter === filter ? "text-black" : "text-white"
              }`}
              style={activeFilter === filter 
                ? { background: "linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)" }
                : { background: "#7575754D", boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)" }
              }
            >
              <span>{filter}</span>
              {count > 0 && (
                <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${
                  activeFilter === filter ? "bg-black text-white" : "bg-neutral-800"
                }`}>
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
          {filteredGuestOrders.map(guest => (
            <div 
              key={guest.id} 
              className={`relative rounded-xl cursor-pointer transition-all overflow-hidden ${
                selectedGuest.id === guest.id 
                  ? "bg-neutral-800/50" 
                  : "bg-neutral-900/50"
              }`}
            >
              {/* Swipe Action Buttons (revealed on swipe left) */}
              <div className={`absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2 md:hidden transition-opacity duration-200 ${(swipeStates[guest.id] || 0) < -20 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                {/* Merge button - gray */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('Merge', guest.id);
                  }}
                  className="w-10 h-10 flex items-center justify-center rounded-full transition-colors"
                  style={{ backgroundColor: '#666666' }}
                >
                  <img src={splitIcon} alt="Merge" className="w-5 h-5 object-contain" />
                </button>
                
                {/* Transfer button - orange */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('Transfer', guest.id);
                  }}
                  className="w-10 h-10 flex items-center justify-center rounded-full transition-colors"
                  style={{ background: 'linear-gradient(180deg, #FF9E65 0%, #FF5E00 100%)' }}
                >
                  <img src={shareOrderIcon} alt="Transfer" className="w-5 h-5 object-contain" />
                </button>
              </div>

              {/* Swipeable card content - everything inside moves together */}
              <div
                className="relative transition-transform duration-200 ease-out md:transform-none bg-neutral-900 rounded-xl select-none"
                style={{
                  transform: `translateX(${swipeStates[guest.id] || 0}px)`,
                  transition:
                    isDraggingRef.current && currentCardId.current === guest.id
                      ? "none"
                      : "transform 0.2s ease-out",
                }}
                onTouchStart={(e) => handleSwipeStart(e, guest)}
                onTouchMove={handleSwipeMove}
                onTouchEnd={(e) => handleSwipeEnd(true, e, guest)}
                onTouchCancel={(e) => handleSwipeEnd(false, e, guest)}
                onMouseDown={(e) => handleSwipeStart(e, guest)}
                onMouseMove={handleSwipeMove}
                onMouseUp={(e) => handleSwipeEnd(false, e, guest)}
                onMouseLeave={(e) => handleSwipeEnd(false, e, guest)}
                onClick={() => handleCardClick(guest)}
              >
                <div className={`flex items-stretch w-full gap-2 border rounded-xl bg-neutral-900 ${selectedGuest.id === guest.id ? 'border-white' : 'border-white/10'}`}>
                  {/* Column 1: Order Number */}
                  <div className="w-[15%] flex-shrink-0 px-2 py-2 flex items-center">
                    <div className="relative w-10 h-14 bg-neutral-800 rounded-lg flex flex-col items-center justify-center gap-1 border border-neutral-600">
                      <span className="text-base font-bold text-white">{guest.id}</span>
                      <img src={tableTargetIcon} alt="Table" className="w-4 h-4 object-cover" />
                    </div>
                  </div>

                  {/* Column 2: Guest Info */}
                  <div className="flex-1 min-w-0 py-2 pr-2 md:pr-0">
                    <div className="flex flex-col">
                      <div className="flex items-start justify-between">
                        <span className="text-white font-medium text-sm">{guest.name}</span>
                        <div className="flex flex-col items-end">
                          <span className="text-white font-semibold text-sm">{guest.amount}</span>
                          {guest.tip && <span className="text-gray-400 text-xs">{guest.tip}</span>}
                        </div>
                      </div>
                      <div className="h-px bg-neutral-600 my-1.5"></div>
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1 text-gray-400">
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
                      <button 
                        className="flex-1 px-3 py-3 flex items-center justify-center hover:bg-neutral-600 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <img src={arrowRightIcon} alt="Arrow" className="w-4 h-4 object-contain" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Centered Arrow to Expand Details - inside swipeable wrapper */}
                <div className="px-[10%]">
                  <button
                    className="w-full flex items-center justify-center hover:bg-white/5 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleOrderExpand(guest.id);
                    }}
                  >
                    <span className="w-4 h-4" />
                  </button>
                </div>

                {/* Expanded Details - inside swipeable wrapper */}
                {expandedOrderId === guest.id && (
                  <div className="px-3 pb-3 border-t border-neutral-700">
                    {/* Order Details Grid */}
                    <div className="grid grid-cols-3 gap-3 py-3">
                      <div>
                        <div className="text-white text-sm font-medium">{guest.timer}</div>
                        <div className="text-gray-500 text-xs">Timer</div>
                      </div>
                      <div>
                        <div className="text-white text-sm font-medium">{guest.check}</div>
                        <div className="text-gray-500 text-xs">Check</div>
                      </div>
                      <div>
                        <div className="text-white text-sm font-medium">{guest.server}</div>
                        <div className="text-gray-500 text-xs">Server</div>
                      </div>
                      <div>
                        <div className="text-white text-sm">{guest.revenueCenter}</div>
                        <div className="text-gray-500 text-xs">Revenue Center</div>
                      </div>
                      <div>
                        <div className="text-white text-sm font-medium">{guest.paymentType}</div>
                        <div className="text-gray-500 text-xs">Payment Type</div>
                      </div>
                      <div>
                        <div className="text-white text-sm">--</div>
                        <div className="text-gray-500 text-xs">Tip</div>
                      </div>
                    </div>

                    {/* Action Buttons - hidden on mobile since swipe reveals them */}
                    <div className="hidden md:flex gap-2 mt-2">
                      <button className="flex-1 py-2 bg-neutral-700 text-white text-sm font-medium rounded-lg hover:bg-neutral-600 transition-colors">
                        MERGE
                      </button>
                      <button className="flex-1 py-2 bg-neutral-700 text-white text-sm font-medium rounded-lg hover:bg-neutral-600 transition-colors">
                        TRANSFER
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        <ScrollBar orientation="vertical" />
      </ScrollArea>

      {/* Add Order Button */}
      <div className="px-3 py-2">
        <button 
          className="w-full py-2 text-black text-sm font-medium rounded-full hover:opacity-90 transition-opacity"
          style={{ background: "linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)" }}
        >
          ADD ORDER TO TABLE
        </button>
      </div>

      {/* Mobile Order Panel */}
      {showMobileOrderPanel && <MobileOrderPanel />}
    </div>
  );

  // Desktop Layout (existing)
  const DesktopLayout = () => (
    <div className="flex h-full bg-black">
      {/* Left Panel - Order List */}
      <div className="flex flex-col flex-1 m-2 rounded-[20px] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-2 border-b border-neutral-700/50">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/tableorder")} className="p-2 rounded-full hover:opacity-80 transition-opacity" style={{
            background: "#7575754D",
            boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)"
          }}>
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <span className="text-white font-semibold text-lg">Table {tableId?.replace("T", "")}</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-full hover:opacity-80 transition-opacity" style={{
            background: "#7575754D",
            boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)"
          }}>
              <SlidersHorizontal className="w-4 h-4 text-white" />
            </button>
            <button className="p-2 rounded-full hover:opacity-80 transition-opacity" style={{
            background: "#7575754D",
            boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)"
          }}>
              <Search className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 p-3 overflow-x-auto">
          {filters.map(filter => {
          const count = getFilterCount(filter);
          return <button key={filter} onClick={() => setActiveFilter(filter)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-all ${activeFilter === filter ? "text-black" : "text-white"}`} style={activeFilter === filter ? {
            background: "linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)"
          } : {
            background: "#7575754D",
            boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)"
          }}>
                <span>{filter}</span>
                {count > 0 && <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${activeFilter === filter ? "bg-black text-white" : "bg-neutral-800"}`}>
                    {count}
                  </span>}
              </button>;
        })}
        </div>

        {/* Guest Orders List */}
        <ScrollArea className="flex-1 px-3">
          <div className="space-y-2 pb-3">
            {filteredGuestOrders.map(guest => <div key={guest.id} onClick={() => setSelectedGuest(guest)} className={`rounded-xl border cursor-pointer transition-all overflow-hidden ${selectedGuest.id === guest.id ? "border-white bg-neutral-800/50" : "border-neutral-700 bg-neutral-900/50 hover:border-neutral-600"}`}>
                <div className="flex items-stretch w-full gap-4">
                  {/* Column 1: Order Number - 8% */}
                  <div className="w-[8%] flex-shrink-0 px-3 py-2 flex items-center">
                    <div className="relative w-12 h-16 bg-neutral-800 rounded-lg flex flex-col items-center justify-center gap-2 border border-neutral-600">
                      <span className="text-lg font-bold text-white">{guest.id}</span>
                      <img src={tableTargetIcon} alt="Table" className="w-5 h-5 object-cover" />
                    </div>
                  </div>

                  {/* Column 2: Guest Info - flex-1 */}
                  <div className="flex-1 min-w-0 py-2">
                    <div className="flex flex-col">
                      <div className="flex items-start justify-between">
                        <span className="text-white font-medium text-sm">{guest.name}</span>
                        <div className="flex flex-col items-end">
                          <span className="text-white font-semibold text-sm">{guest.amount}</span>
                          {guest.tip && <span className="text-gray-400 text-xs">{guest.tip}</span>}
                        </div>
                      </div>
                      <div className="h-px bg-neutral-600 my-1.5"></div>
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1 text-gray-400">
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

                  {/* Column 4: Check & Revenue Center - 12% */}
                  <div className="w-[12%] flex-shrink-0 py-2">
                    <div className="flex flex-col text-xs gap-1">
                      <div className="text-left">
                        <div className="text-white font-medium">{guest.check}</div>
                        <div className="text-gray-500">Check</div>
                      </div>
                      <div className="text-left">
                        <div className="text-white">{guest.revenueCenter}</div>
                        <div className="text-gray-500">Revenue Center</div>
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
                    <div className="flex flex-col bg-neutral-700 rounded-r-xl overflow-hidden">
                      <button className="flex-1 px-3 flex items-center justify-center hover:bg-neutral-600 transition-colors border-b border-neutral-600">
                        <img src={arrowRightIcon} alt="Arrow" className="w-4 h-4 object-contain" />
                      </button>
                      <button className="flex-1 px-3 flex items-center justify-center hover:bg-neutral-600 transition-colors">
                        <img src={shareOrderIcon} alt="Share" className="w-4 h-4 object-contain" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>)}
          </div>
          <ScrollBar orientation="vertical" />
        </ScrollArea>

        {/* Add Order Button */}
        <div className="p-3 border-t border-neutral-700/50">
          <button className="w-full py-3 text-black font-medium rounded-full hover:opacity-90 transition-opacity" style={{
          background: "linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)"
        }}>
            ADD ORDER TO TABLE
          </button>
        </div>
      </div>

      {/* Right Panel - Order Details */}
      <div className="w-[345px] flex flex-col m-2 ml-0">
        {/* Guest Header - Outside the box */}
        <div className="px-2 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white font-medium">{selectedGuest.name}</span>
            <div className="flex items-center gap-3 text-white/50 text-sm">
              <div className="flex items-center gap-1">
                <Phone className="w-3 h-3" />
                <span>(415) 123-4567</span>
              </div>
              <div className="flex items-center gap-1">
                <span>⚡</span>
                <span>{selectedGuest.time}</span>
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
              <span className="text-white/50 text-sm">DUSTIN H</span>
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
            {[1, 2, 3, 4].map(seat => <button key={seat} onClick={() => toggleSeat(seat)} className={`w-7 h-7 rounded text-sm font-medium transition-colors ${selectedSeats.includes(seat) ? "bg-white text-black" : "bg-white/10 text-white hover:bg-white/20"}`}>
                {seat}
              </button>)}
          </div>
        </div>

        {/* Notes */}
        <div className="px-4 py-3 border-b border-white/10">
          <div className="flex items-center gap-2 text-white/50 text-sm bg-white/10 p-2 rounded-lg">
            <span>📝</span>
            <span>Allergic to almonds, Don't add onion</span>
          </div>
        </div>

        {/* Order Items */}
        <ScrollArea className="flex-1 px-4">
          <div className="py-2 space-y-2">
            {orderItems.map((item, index) => <div key={index} className="p-3 bg-white/5 rounded-xl border border-white/10">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-2">
                    <span className="w-6 h-6 bg-white rounded flex items-center justify-center text-black text-sm font-bold">
                      {item.qty}
                    </span>
                    <div>
                      <span className="text-white font-medium">{item.name}</span>
                      {item.modifiers.length > 0 && <div className="mt-1 text-white/50 text-sm space-y-0.5">
                          {item.modifiers.map((mod, i) => <div key={i}>{mod}</div>)}
                        </div>}
                    </div>
                  </div>
                  <span className="text-white font-medium">{item.price}</span>
                </div>
                {item.seats.length > 0 && <div className="flex items-center gap-1 mt-2">
                    <img src={seatIcon} alt="Seat" className="w-4 h-4 opacity-50" />
                    {item.seats.map(seat => <span key={seat} className="w-5 h-5 bg-white/10 rounded text-white text-xs flex items-center justify-center">
                        {seat}
                      </span>)}
                  </div>}
              </div>)}
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
            <span className="text-red-500">Discount</span>
            <span className="text-red-500">$1.00</span>
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

        {/* Bottom Actions */}
        <div className="px-4 py-3 border-t border-white/10 flex items-center gap-2">
          <button className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center hover:bg-red-500 transition-colors">
            <img src={clearIcon} alt="Clear" className="w-4 h-4 brightness-0 invert" />
          </button>
          <button disabled className="px-4 py-2 rounded-full flex items-center gap-1 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed" style={{
          background: "linear-gradient(180deg, #FF9E65 0%, #FF5E00 100%)"
        }}>
            <img src={fireIcon} alt="Fire" className="w-4 h-4 brightness-0 invert" />
            <span>FIRE</span>
          </button>
          <button className="flex-1 py-2 rounded-full text-black text-sm font-bold" style={{
          background: "linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)"
        }}>
            CHARGE $ 59.00
          </button>
        </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Layout */}
      <div className="md:hidden h-full">
        <MobileLayout />
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:block h-full">
        <DesktopLayout />
      </div>
    </>
  );
};

export default TableOrderDetails;
