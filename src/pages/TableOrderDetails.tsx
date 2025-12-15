import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { ChevronLeft, Search, SlidersHorizontal, Phone, Share2 } from "lucide-react";

// Import icons
import runnerIcon from "@/assets/icons/runner.png";
import clearIcon from "@/assets/icons/clear-c.png";
import fireIcon from "@/assets/icons/fire.png";
import tableTargetIcon from "@/assets/icons/table-target.png";

// Mock guest orders data
const guestOrders = [{
  id: "3",
  name: "Martin Alex",
  amount: "$59.00",
  tip: "",
  partySize: 4,
  time: "8:00 PM",
  timer: "00:00",
  server: "Dustin H",
  check: "--",
  paymentType: "--",
  revenueCenter: "FF Balcony",
  status: "ORDERING"
}, {
  id: "2",
  name: "Carol Alex",
  amount: "$40.00",
  tip: "+ Tip $2.00",
  partySize: 3,
  time: "7:30 PM",
  timer: "1:16 Hrs",
  server: "Dustin H",
  check: "123423",
  paymentType: "Cash",
  revenueCenter: "FF Balcony",
  status: "COMPLETED"
}, {
  id: "1",
  name: "Rick Grimes",
  amount: "$36.00",
  tip: "+ Tip $5.00",
  partySize: 2,
  time: "7:15 PM",
  timer: "1:16 Hrs",
  server: "Dustin H",
  check: "123443",
  paymentType: "Cash",
  revenueCenter: "FF Balcony",
  status: "COMPLETED"
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
const filters = ["All", "Open", "Completed", "Paid", "Unpaid", "Ordering"];
const TableOrderDetails = () => {
  const navigate = useNavigate();
  const {
    tableId
  } = useParams();
  const [activeFilter, setActiveFilter] = useState("All");
  const [selectedGuest, setSelectedGuest] = useState(guestOrders[0]);
  const [selectedSeats, setSelectedSeats] = useState<number[]>([1, 2, 3, 4]);
  const getStatusColor = (status: string) => {
    switch (status) {
      case "ORDERING":
        return "text-yellow-400";
      case "COMPLETED":
        return "text-green-500";
      default:
        return "text-white";
    }
  };
  const getFilterCount = (filter: string) => {
    if (filter === "All") return guestOrders.length;
    if (filter === "Completed") return guestOrders.filter(g => g.status === "COMPLETED").length;
    if (filter === "Paid") return guestOrders.filter(g => g.status === "COMPLETED").length;
    if (filter === "Ordering") return guestOrders.filter(g => g.status === "ORDERING").length;
    return 0;
  };
  const toggleSeat = (seat: number) => {
    setSelectedSeats(prev => prev.includes(seat) ? prev.filter(s => s !== seat) : [...prev, seat]);
  };
  return <div className="flex h-full bg-black">
      {/* Left Panel - Order List */}
      <div className="flex flex-col flex-1 m-2 rounded-[20px] overflow-hidden" style={{
      background: "#7575754D",
      boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)"
    }}>
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-neutral-700/50">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/tableorder")} className="p-1 hover:bg-neutral-700/50 rounded-full transition-colors">
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <span className="text-white font-semibold text-lg">Table {tableId?.replace("T", "")}</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-neutral-700/50 rounded-full transition-colors">
              <SlidersHorizontal className="w-4 h-4 text-white" />
            </button>
            <button className="p-2 hover:bg-neutral-700/50 rounded-full transition-colors">
              <Search className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 p-3 overflow-x-auto">
          {filters.map(filter => {
          const count = getFilterCount(filter);
          return <button key={filter} onClick={() => setActiveFilter(filter)} className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-all ${activeFilter === filter ? "bg-white text-black" : "bg-neutral-800 text-white hover:bg-neutral-700"}`}>
                <span>{filter}</span>
                {count > 0 && <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${activeFilter === filter ? "bg-black text-white" : "bg-neutral-700"}`}>
                    {count}
                  </span>}
              </button>;
        })}
        </div>

        {/* Guest Orders List */}
        <ScrollArea className="flex-1 px-3">
          <div className="space-y-2 pb-3">
            {guestOrders.map(guest => <div key={guest.id} onClick={() => setSelectedGuest(guest)} className={`px-3 py-2 rounded-xl border cursor-pointer transition-all ${selectedGuest.id === guest.id ? "border-white bg-neutral-800/50" : "border-neutral-700 bg-neutral-900/50 hover:border-neutral-600"}`}>
                <div className="flex items-center w-full gap-4">
                  {/* Column 1: Order Number - 8% */}
                  <div className="w-[8%] flex-shrink-0">
                    <div className="relative w-12 h-16 bg-neutral-800 rounded-lg flex flex-col items-center justify-center gap-2 border border-neutral-600">
                      <span className="text-lg font-bold text-white">{guest.id}</span>
                      <img src={tableTargetIcon} alt="Table" className="w-5 h-5 object-cover" />
                    </div>
                  </div>

                  {/* Column 2: Guest Info - flex-1 */}
                  <div className="flex-1 min-w-0">
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
                  <div className="w-[12%] flex-shrink-0">
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
                  <div className="w-[12%] flex-shrink-0">
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
                  <div className="w-[12%] flex-shrink-0 self-start">
                    <div className="flex flex-col text-xs">
                      <div className="text-left">
                        <div className="text-white font-medium">{guest.paymentType}</div>
                        <div className="text-gray-500">Payment Type</div>
                      </div>
                    </div>
                  </div>

                  {/* Column 6: Action Buttons */}
                  <div className="flex-shrink-0 flex justify-end">
                    <div className="flex flex-col gap-1">
                      <button className="p-1.5 bg-neutral-700 rounded hover:bg-neutral-600 transition-colors">
                        <ChevronLeft className="w-4 h-4 text-white rotate-180" />
                      </button>
                      <button className="p-1.5 bg-neutral-700 rounded hover:bg-neutral-600 transition-colors">
                        <Share2 className="w-4 h-4 text-orange-500" />
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
          <button className="w-full py-3 bg-neutral-800 text-white font-medium rounded-full hover:bg-neutral-700 transition-colors">
            ADD ORDER TO TABLE
          </button>
        </div>
      </div>

      {/* Right Panel - Order Details */}
      <div className="w-[345px] flex flex-col m-2 ml-0 rounded-[20px] overflow-hidden" style={{
      background: "#7575754D",
      boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)"
    }}>
        {/* Guest Header */}
        <div className="p-3 border-b border-neutral-700/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white font-medium">{selectedGuest.name}</span>
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <Phone className="w-3 h-3" />
              <span>(415) 123-4567</span>
              <span>⚡ {selectedGuest.time}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="px-3 py-1 bg-neutral-700 text-white text-xs rounded-full hover:bg-neutral-600 transition-colors">
              Add Item
            </button>
            <button className="px-3 py-1 bg-neutral-700 text-white text-xs rounded-full hover:bg-neutral-600 transition-colors">
              Discount
            </button>
            <button className="px-3 py-1 bg-neutral-700 text-white text-xs rounded-full hover:bg-neutral-600 transition-colors">
              Receipt
            </button>
            <button className="px-3 py-1 bg-neutral-700 text-white text-xs rounded-full hover:bg-neutral-600 transition-colors">
              Cash Register
            </button>
          </div>
        </div>

        {/* Table Order Info */}
        <div className="p-3 border-b border-neutral-700/50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-neutral-800 text-white text-xs rounded">TABLE ORDER</span>
              <span className="text-white font-bold">{selectedGuest.id}</span>
            </div>
            <div className="flex items-center gap-2">
              <img src={runnerIcon} alt="Server" className="w-4 h-4 invert opacity-60" />
              <span className="text-gray-400 text-sm">DUSTIN H</span>
            </div>
          </div>
          
          {/* Seat Buttons */}
          <div className="flex items-center gap-2">
            <button className="p-1.5 bg-neutral-700 rounded hover:bg-neutral-600 transition-colors">
              <Share2 className="w-4 h-4 text-white" />
            </button>
            {[1, 2, 3, 4].map(seat => <button key={seat} onClick={() => toggleSeat(seat)} className={`w-7 h-7 rounded text-sm font-medium transition-colors ${selectedSeats.includes(seat) ? "bg-white text-black" : "bg-neutral-700 text-white hover:bg-neutral-600"}`}>
                {seat}
              </button>)}
          </div>
        </div>

        {/* Notes */}
        <div className="p-3 border-b border-neutral-700/50">
          <div className="flex items-center gap-2 text-gray-400 text-sm bg-neutral-800 p-2 rounded-lg">
            <span>📝</span>
            <span>Allergic to almonds, Don't add onion</span>
          </div>
        </div>

        {/* Order Items */}
        <ScrollArea className="flex-1 p-3">
          <div className="space-y-2">
            {orderItems.map((item, index) => <div key={index} className="p-3 bg-neutral-900/50 rounded-xl border border-neutral-700">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-2">
                    <span className="w-6 h-6 bg-orange-500 rounded flex items-center justify-center text-white text-sm font-bold">
                      {item.qty}
                    </span>
                    <div>
                      <span className="text-white font-medium">{item.name}</span>
                      {item.modifiers.length > 0 && <div className="mt-1 text-gray-400 text-sm space-y-0.5">
                          {item.modifiers.map((mod, i) => <div key={i}>{mod}</div>)}
                        </div>}
                    </div>
                  </div>
                  <span className="text-white font-medium">{item.price}</span>
                </div>
                {item.seats.length > 0 && <div className="flex items-center gap-1 mt-2">
                    <span className="text-gray-500">🪑</span>
                    {item.seats.map(seat => <span key={seat} className="w-5 h-5 bg-neutral-700 rounded text-white text-xs flex items-center justify-center">
                        {seat}
                      </span>)}
                  </div>}
                <div className="flex items-center gap-2 mt-2">
                  <button className="p-1 bg-neutral-700 rounded hover:bg-neutral-600 transition-colors">
                    <span className="text-gray-400 text-xs">🪑</span>
                  </button>
                  <button className="p-1 bg-neutral-700 rounded hover:bg-neutral-600 transition-colors">
                    <Share2 className="w-3 h-3 text-gray-400" />
                  </button>
                </div>
              </div>)}
          </div>
          <ScrollBar orientation="vertical" />
        </ScrollArea>

        {/* Order Summary */}
        <div className="p-3 border-t border-neutral-700/50 space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Sub Total</span>
            <span className="text-white">$ 56.00</span>
          </div>
          <div className="flex justify-between">
            <span className="text-red-500">Discount</span>
            <span className="text-red-500">$1.00</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Service Charge</span>
            <span className="text-white">$ 1.00</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Tax</span>
            <span className="text-white">$ 1.00</span>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="p-3 border-t border-neutral-700/50 flex items-center gap-2">
          <button className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center hover:bg-red-500 transition-colors">
            <img src={clearIcon} alt="Clear" className="w-4 h-4 invert" />
          </button>
          <button className="px-4 py-2 rounded-full flex items-center gap-1 text-white text-sm font-medium" style={{
          background: "linear-gradient(180deg, #FF9E65 0%, #FF5E00 100%)"
        }}>
            <img src={fireIcon} alt="Fire" className="w-4 h-4 invert" />
            <span>FIRE</span>
          </button>
          <button className="flex-1 py-2 rounded-full text-black text-sm font-bold" style={{
          background: "linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)"
        }}>
            CHARGE $ 59.00
          </button>
        </div>
      </div>
    </div>;
};
export default TableOrderDetails;