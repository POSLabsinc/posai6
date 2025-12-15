import { useState } from "react";
import { ChevronLeft, Search, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

import clearIcon from "@/assets/icons/clear-c.png";
import fireIcon from "@/assets/icons/fire.png";

interface TableDetailViewProps {
  tableId: string;
  onBack: () => void;
}

// Mock order data for the table
const mockOrders = [
  {
    id: 1,
    guestName: "Martin Alex",
    partySize: 4,
    time: "8:00 PM",
    amount: 59.00,
    tip: 0,
    timer: "00:00",
    check: "--",
    paymentType: "--",
    server: "Dustin H",
    revenueCenter: "FF Balcony",
    status: "ORDERING",
  },
  {
    id: 2,
    guestName: "Carol Alex",
    partySize: 3,
    time: "7:30 PM",
    amount: 40.00,
    tip: 2.00,
    timer: "1:16 Hrs",
    check: "123423",
    paymentType: "Cash",
    server: "Dustin H",
    revenueCenter: "FF Balcony",
    status: "COMPLETED",
  },
  {
    id: 3,
    guestName: "Rick Grimes",
    partySize: 2,
    time: "7:15 PM",
    amount: 36.00,
    tip: 5.00,
    timer: "1:16 Hrs",
    check: "123443",
    paymentType: "Cash",
    server: "Dustin H",
    revenueCenter: "FF Balcony",
    status: "COMPLETED",
  },
];

// Mock order items for right panel
const mockOrderItems = [
  { id: 1, name: "Classic Crispy Burger", price: 12.00, qty: 2, seats: [1, 2], modifiers: [] },
  { id: 2, name: "Meatballs", price: 16.00, qty: 4, seats: [], modifiers: [] },
  { id: 3, name: "Rigatoni Pasta", price: 8.00, qty: 2, seats: [3, 4], modifiers: [] },
  { 
    id: 4, 
    name: "Almond crusted salmon", 
    price: 20.00, 
    qty: 4, 
    seats: [], 
    modifiers: ["Salad", "Balsamic Vinaigrette", "Medium Rare", "+ W/ Potato Wedges", "large", "+ W/ Extra Cheese"] 
  },
];

const filters = ["All", "Open", "Completed", "Paid", "Unpaid", "Ordering"];

const TableDetailView = ({ tableId, onBack }: TableDetailViewProps) => {
  const [activeFilter, setActiveFilter] = useState("All");
  const [selectedOrder, setSelectedOrder] = useState(mockOrders[0]);

  const filteredOrders = activeFilter === "All" 
    ? mockOrders 
    : mockOrders.filter(o => o.status.toLowerCase() === activeFilter.toLowerCase());

  const subtotal = mockOrderItems.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const discount = 1.00;
  const serviceCharge = 1.00;
  const tax = 1.00;
  const total = subtotal - discount + serviceCharge + tax;

  return (
    <div className="flex h-full bg-black gap-2 p-2">
      {/* Left Panel - Orders List */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <button 
              onClick={onBack}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-neutral-800 hover:bg-neutral-700 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <span className="text-xl font-semibold text-white">Table {tableId.replace('T', '')}</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center justify-center w-8 h-8 rounded-full bg-neutral-800 hover:bg-neutral-700 transition-colors">
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 21v-7m0 0V5a2 2 0 012-2h12a2 2 0 012 2v9M4 14h16m0 0v7" />
              </svg>
            </button>
            <button className="flex items-center justify-center w-8 h-8 rounded-full bg-neutral-800 hover:bg-neutral-700 transition-colors">
              <Search className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 mb-3">
          {filters.map((filter) => {
            const count = filter === "All" ? mockOrders.length : 
              filter === "Completed" ? mockOrders.filter(o => o.status === "COMPLETED").length :
              filter === "Ordering" ? mockOrders.filter(o => o.status === "ORDERING").length : 0;
            
            return (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-all ${
                  activeFilter === filter
                    ? "bg-white text-black"
                    : "bg-neutral-800 text-white hover:bg-neutral-700"
                }`}
              >
                <span>{filter}</span>
                {count > 0 && (
                  <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${
                    activeFilter === filter ? "bg-black text-white" : "bg-neutral-700"
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Orders List */}
        <ScrollArea className="flex-1">
          <div className="space-y-2">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                onClick={() => setSelectedOrder(order)}
                className={`bg-neutral-900 rounded-xl p-3 cursor-pointer hover:bg-neutral-800 transition-colors border-l-4 ${
                  selectedOrder?.id === order.id ? "border-orange-500" : "border-transparent"
                }`}
              >
                <div className="flex items-start justify-between">
                  {/* Left Section - Order Number & Guest Info */}
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-neutral-800 text-white font-bold text-lg">
                      {order.id}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-white font-medium">{order.guestName}</span>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <span>Party Of {order.partySize},</span>
                        <span>🏃 {order.time}</span>
                        <span className={`font-medium ${
                          order.status === "COMPLETED" ? "text-green-500" : "text-yellow-500"
                        }`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Center Section - Amount & Details */}
                  <div className="flex items-start gap-6 text-sm">
                    <div className="text-right">
                      <div className="text-white font-semibold">${order.amount.toFixed(2)}</div>
                      {order.tip > 0 && (
                        <div className="text-gray-400 text-xs">+ Tip ${order.tip.toFixed(2)}</div>
                      )}
                    </div>
                    <div className="text-center">
                      <div className="text-white">{order.timer}</div>
                      <div className="text-gray-500 text-xs">Timer</div>
                    </div>
                    <div className="text-center">
                      <div className="text-white">{order.check}</div>
                      <div className="text-gray-500 text-xs">Check</div>
                    </div>
                    <div className="text-center">
                      <div className="text-white">{order.paymentType}</div>
                      <div className="text-gray-500 text-xs">Payment Type</div>
                    </div>
                  </div>

                  {/* Right Section - Server & Actions */}
                  <div className="flex items-start gap-4">
                    <div className="text-right text-sm">
                      <div className="text-white">{order.server}</div>
                      <div className="text-gray-500 text-xs">Server</div>
                      <div className="text-white mt-1">{order.revenueCenter}</div>
                      <div className="text-gray-500 text-xs">Revenue Center</div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <button className="w-7 h-7 rounded-full bg-neutral-700 flex items-center justify-center hover:bg-neutral-600">
                        <ArrowUpRight className="w-4 h-4 text-white" />
                      </button>
                      <button className="w-7 h-7 rounded-full bg-orange-500 flex items-center justify-center hover:bg-orange-600">
                        <ArrowDownRight className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <ScrollBar orientation="vertical" />
        </ScrollArea>

        {/* Add Order Button */}
        <button 
          className="mt-3 w-full py-3 rounded-full text-white font-semibold text-center transition-colors"
          style={{ 
            background: "#7575754D",
            boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)"
          }}
        >
          ADD ORDER TO TABLE
        </button>
      </div>

      {/* Right Panel - Order Details */}
      <div 
        className="w-[345px] flex flex-col rounded-[20px] p-3"
        style={{ 
          background: "#7575754D",
          boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)"
        }}
      >
        {/* Guest Info */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-white font-medium">{selectedOrder.guestName}</span>
            <span className="text-gray-400 text-sm">📞 (415) 123-4567</span>
          </div>
          <span className="text-gray-400 text-sm">🏃 {selectedOrder.time}</span>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mb-3">
          {["Add Item", "Discount", "Receipt", "Cash Register"].map((btn) => (
            <button
              key={btn}
              className="px-3 py-1.5 rounded-lg bg-neutral-800 text-white text-xs hover:bg-neutral-700 transition-colors"
            >
              {btn}
            </button>
          ))}
        </div>

        {/* Table Order Info */}
        <div 
          className="rounded-lg p-2 mb-2"
          style={{ 
            background: "#7575754D",
            boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)"
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-white font-medium">TABLE ORDER</span>
              <span className="px-2 py-0.5 bg-neutral-700 rounded text-white text-sm">{selectedOrder.id}</span>
            </div>
            <div className="flex items-center gap-1 text-gray-400 text-sm">
              <span>👤</span>
              <span>DUSTIN H</span>
            </div>
          </div>
        </div>

        {/* Seat Selection */}
        <div className="flex items-center gap-2 mb-2">
          <button className="w-8 h-8 rounded-lg bg-neutral-700 flex items-center justify-center text-white">
            ↔
          </button>
          {[1, 2, 3, 4].map((seat) => (
            <button
              key={seat}
              className="w-8 h-8 rounded-lg bg-neutral-800 border border-neutral-600 text-white text-sm hover:bg-neutral-700 transition-colors"
            >
              {seat}
            </button>
          ))}
        </div>

        {/* Allergy Note */}
        <div className="flex items-center gap-2 px-2 py-1.5 bg-neutral-800 rounded-lg mb-2 text-sm text-gray-300">
          <span>⚠️</span>
          <span>Allergic to almonds, Don't add onion</span>
        </div>

        {/* Order Items */}
        <ScrollArea className="flex-1 mb-2">
          <div className="space-y-2">
            {mockOrderItems.map((item) => (
              <div
                key={item.id}
                className="bg-neutral-900 rounded-lg p-2 border border-neutral-700"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-2">
                    <span className="w-6 h-6 rounded bg-red-500 text-white text-xs flex items-center justify-center font-bold">
                      {item.qty}
                    </span>
                    <div className="flex flex-col">
                      <span className="text-white font-medium">{item.name}</span>
                      {item.modifiers.length > 0 && (
                        <div className="text-gray-400 text-xs mt-1">
                          {item.modifiers.map((mod, i) => (
                            <div key={i} className={mod.startsWith("+") ? "text-green-400" : ""}>
                              - {mod}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <span className="text-white font-semibold">$ {item.price.toFixed(2)}</span>
                </div>
                {item.seats.length > 0 && (
                  <div className="flex gap-1 mt-2">
                    {item.seats.map((seat) => (
                      <span key={seat} className="w-5 h-5 rounded border border-neutral-600 text-white text-xs flex items-center justify-center">
                        {seat}
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex gap-2 mt-2">
                  <button className="text-gray-400 text-xs">🖨️</button>
                  <button className="text-gray-400 text-xs">↗️</button>
                </div>
              </div>
            ))}
          </div>
          <ScrollBar orientation="vertical" />
        </ScrollArea>

        {/* Order Summary */}
        <div className="border-t border-neutral-700 pt-2 mb-2 space-y-1 text-sm">
          <div className="flex justify-between text-white">
            <span>Sub Total</span>
            <span>$ {subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-red-400">
            <span>Discount</span>
            <span>$ {discount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-white">
            <span>Service Charge</span>
            <span>$ {serviceCharge.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-white">
            <span>Tax</span>
            <span>$ {tax.toFixed(2)}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center hover:bg-red-600 transition-colors">
            <img src={clearIcon} alt="Clear" className="w-5 h-5" />
          </button>
          <button 
            className="w-16 h-10 rounded-full flex items-center justify-center hover:opacity-90 transition-opacity"
            style={{ background: "linear-gradient(180deg, #FF9E65 0%, #FF5E00 100%)" }}
          >
            <img src={fireIcon} alt="Fire" className="w-5 h-5" />
            <span className="text-white text-xs ml-1">FIRE</span>
          </button>
          <button 
            className="flex-1 h-10 rounded-full flex items-center justify-center hover:opacity-90 transition-opacity"
            style={{ background: "linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)" }}
          >
            <span className="text-black font-semibold">CHARGE $ {total.toFixed(2)}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TableDetailView;
