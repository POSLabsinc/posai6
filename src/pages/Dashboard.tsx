import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import fireIcon from "@/assets/icons/fire.png";
import itemNotesIcon from "@/assets/icons/item-notes.png";
import phoneIcon from "@/assets/icons/phone-icon.png";
import timeIcon from "@/assets/icons/time-icon.png";

// Stats data
const stats = [
  { label: "Total Sale", value: "$ 1,400.00", change: "2.2%", isUp: true, icon: "💰" },
  { label: "Total Tip", value: "$ 285.00", change: "2.2%", isUp: true, icon: "💵" },
  { label: "Total Hours", value: "6h 28min", change: "0.5%", isUp: false, icon: "⏱" },
  { label: "Ordering", value: "12", change: "2.5%", isUp: true, icon: "📋" },
  { label: "Ready to Served", value: "5", change: "1%", isUp: false, icon: "check", hasCheckbox: true },
  { label: "Ready to Served", value: "8", change: "1%", isUp: false, icon: "check", hasCheckbox: true },
];

// Order filters
const orderFilters = [
  { label: "All", count: 10 },
  { label: "In Progress", count: 2 },
  { label: "Unpaid", count: 2 },
  { label: "Open", count: 2 },
  { label: "Paid", count: 2 },
  { label: "Closed", count: 2 },
];

// Mock orders
const mockOrders = [
  {
    id: 10,
    status: "Being Prepared",
    statusColor: "#4ADE80",
    guest: "John Doe",
    orderNo: "Order No 8",
    seats: 4,
    date: "Thu, 22 Jun 2024",
    arrivedAt: "1:35:00 PM",
    timer: "00:00",
    type: "Dine In",
    check: 12,
    revenueCenter: "FF Balcony",
    tip: "$0.00",
    paymentType: "Cash",
  },
  {
    id: 11,
    status: "Ordered",
    statusColor: "#F97316",
    guest: "Carol",
    orderNo: "Order No 9",
    seats: 4,
    date: "Thu, 22 Jun 2024",
    arrivedAt: "1:35:00 PM",
    timer: "00:00",
    type: "Dine In",
    check: 12,
    revenueCenter: "FF Balcony",
    tip: "$0.00",
    paymentType: "Cash",
  },
  {
    id: 12,
    status: "Ready",
    statusColor: "#3B82F6",
    guest: "Mike Smith",
    orderNo: "Order No 10",
    seats: 2,
    date: "Thu, 22 Jun 2024",
    arrivedAt: "2:15:00 PM",
    timer: "00:15",
    type: "Take Out",
    check: 8,
    revenueCenter: "Main Hall",
    tip: "$5.00",
    paymentType: "Card",
  },
];

// Mock order items for right panel
const orderItems = [
  { qty: 1, name: "Classic Crispy Burger", price: 12.00 },
  { qty: 1, name: "Meatballs", price: 16.00 },
  { qty: 2, name: "Rigatoni Pasta", price: 8.00 },
];

// Mock table data
const mockTables = [
  { id: "T1", seats: 6, time: "25 Min", status: "Ordering", statusColor: "#4ADE80" },
  { id: "T4", seats: 4, time: "25 Min", status: "Waiting For Payment", statusColor: "#F59E0B" },
  { id: "T6", seats: 6, time: "25 Min", status: "Ordered", statusColor: "#F97316" },
  { id: "T3", seats: 10, time: null, status: "Available", statusColor: "#6B7280" },
  { id: "T2", seats: 10, time: null, status: "Available", statusColor: "#6B7280" },
  { id: "T5", seats: 8, time: null, status: "Available", statusColor: "#6B7280" },
  { id: "T7", seats: 6, time: "15 Min", status: "Ordering", statusColor: "#4ADE80" },
  { id: "T8", seats: 4, time: null, status: "Available", statusColor: "#6B7280" },
];

const Dashboard = () => {
  const [activeFilter, setActiveFilter] = useState("All");
  const [selectedOrder, setSelectedOrder] = useState(mockOrders[0]);

  const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.qty, 0);
  const total = subtotal;

  return (
    <div className="h-full flex flex-col bg-black text-white overflow-hidden p-3 gap-3">
      {/* ROW 1: Stats/Insights */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide flex-shrink-0">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="flex-shrink-0 rounded-xl px-3 py-2 min-w-[140px]"
            style={{ background: "#7575754D", boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)" }}
          >
            <div className="flex items-center gap-2 text-xs text-white/60 mb-1">
              {stat.hasCheckbox ? (
                <div className="w-4 h-4 rounded border border-white/40 flex items-center justify-center">
                  <Check className="w-3 h-3" />
                </div>
              ) : (
                <span>{stat.icon}</span>
              )}
              <span>{stat.label}</span>
            </div>
            <div className="text-lg font-semibold">{stat.value}</div>
            <div className={`text-xs ${stat.isUp ? "text-green-400" : "text-red-400"}`}>
              {stat.isUp ? "↗" : "↘"} {stat.change} from yesterday
            </div>
          </div>
        ))}
      </div>

      {/* ROW 2: Orders + Order Panel */}
      <div className="flex-1 flex gap-3 min-h-0 overflow-hidden">
        {/* Left: Orders List with Scroll */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Order Filters */}
          <div className="flex gap-2 mb-2 overflow-x-auto scrollbar-hide py-1 flex-shrink-0">
            {orderFilters.map((filter) => (
              <button
                key={filter.label}
                onClick={() => setActiveFilter(filter.label)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  activeFilter === filter.label
                    ? "text-black"
                    : "text-white"
                }`}
                style={
                  activeFilter === filter.label
                    ? { background: "linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)" }
                    : { background: "#7575754D", boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)" }
                }
              >
                {filter.label} <span className="font-bold ml-1">{filter.count}</span>
              </button>
            ))}
          </div>

          {/* Orders List with Scroll */}
          <ScrollArea className="flex-1">
            <div className="space-y-2 pr-2">
              {mockOrders.map((order) => (
                <div
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  className={`rounded-xl p-3 cursor-pointer transition-all ${
                    selectedOrder?.id === order.id ? "border border-white" : "border border-white/10"
                  }`}
                  style={{ background: "#7575754D", boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)" }}
                >
                  <div className="flex items-start gap-4">
                    {/* Order Number & Status */}
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-2xl font-bold">{order.id}</span>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: order.statusColor, color: "#000" }}
                      >
                        {order.status}
                      </span>
                    </div>

                    {/* Guest Info */}
                    <div className="flex-1">
                      <div className="font-medium">{order.guest}</div>
                      <div className="text-xs text-white/60">{order.orderNo}</div>
                      <div className="text-xs text-white/60">Seats {order.seats}</div>
                    </div>

                    {/* Date/Time */}
                    <div className="text-xs text-white/60">
                      <div>{order.date}</div>
                      <div>Arrived At {order.arrivedAt}</div>
                    </div>

                    {/* Timer */}
                    <div className="text-center">
                      <div className="text-sm">{order.timer}</div>
                      <div className="text-xs text-white/60">Timer</div>
                      <div className="text-sm mt-1">{order.type}</div>
                      <div className="text-xs text-white/60">Type</div>
                    </div>

                    {/* Check */}
                    <div className="text-center">
                      <div className="text-sm">{order.check}</div>
                      <div className="text-xs text-white/60">Check</div>
                      <div className="text-sm mt-1">{order.revenueCenter}</div>
                      <div className="text-xs text-white/60">Revenue Center</div>
                    </div>

                    {/* Payment */}
                    <div className="text-center">
                      <div className="text-sm">{order.tip}</div>
                      <div className="text-xs text-white/60">Tip</div>
                      <div className="text-sm mt-1">{order.paymentType}</div>
                      <div className="text-xs text-white/60">Payment Type</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Right: Order Panel */}
        <div
          className="w-[280px] lg:w-[345px] flex-shrink-0 rounded-xl flex flex-col"
          style={{ background: "#7575754D", boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)" }}
        >
          {/* Guest Header */}
          <div className="px-3 py-2 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{selectedOrder?.guest || "GUEST NAME"}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-white/60">
                <div className="flex items-center gap-1">
                  <img src={phoneIcon} alt="phone" className="w-3 h-3 opacity-60" />
                  <span>(XXX) XXX-XXXX</span>
                </div>
                <div className="flex items-center gap-1">
                  <img src={timeIcon} alt="time" className="w-3 h-3 opacity-60" />
                  <span>12:30 PM</span>
                </div>
              </div>
            </div>
          </div>

          {/* Order Notes */}
          <div className="px-3 py-2 border-b border-white/10">
            <div className="flex items-center gap-2 text-xs text-amber-400">
              <img src={itemNotesIcon} alt="notes" className="w-4 h-4" />
              <span>No Onions, Extra Tomato Sauce</span>
            </div>
          </div>

          {/* Order Items */}
          <ScrollArea className="flex-1 px-3 py-2">
            <div className="space-y-2">
              {orderItems.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-2 rounded-lg"
                  style={{ background: "#2A2A2A" }}
                >
                  <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center text-xs font-bold text-black">
                    {item.qty}
                  </div>
                  <span className="flex-1 text-sm">{item.name}</span>
                  <span className="text-sm font-medium">$ {item.price.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Action Buttons */}
          <div className="px-3 py-2 border-t border-white/10">
            <div className="flex items-center gap-2">
              <button
                className="flex items-center justify-center w-12 h-10 rounded-lg"
                style={{ background: "#666666" }}
              >
                <img src={fireIcon} alt="fire" className="w-5 h-5" />
              </button>
              <span className="text-sm text-white/60">FIRE</span>
              <button
                className="flex-1 h-10 rounded-lg text-sm font-medium text-black"
                style={{ background: "linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)" }}
              >
                CHARGE $ {total.toFixed(2)}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ROW 3: Table Status */}
      <div className="flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium">Table Status</h3>
          <button
            className="flex items-center gap-1 text-xs px-2 py-1 rounded"
            style={{ background: "#7575754D" }}
          >
            First Floor <ChevronDown className="w-3 h-3" />
          </button>
        </div>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {mockTables.map((table, index) => (
            <div
              key={index}
              className="flex-shrink-0 rounded-xl p-2 text-center min-w-[100px]"
              style={{ background: "#7575754D", boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)" }}
            >
              <div className="text-xl font-bold">{table.id}</div>
              <div className="text-xs text-white/60">{table.seats} Seats</div>
              <div className="flex justify-center gap-0.5 my-1">
                {Array.from({ length: Math.min(table.seats, 6) }).map((_, i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: table.statusColor }}
                  />
                ))}
              </div>
              {table.time && <div className="text-xs text-white/60 mb-1">{table.time}</div>}
              <div
                className="text-xs px-2 py-1 rounded-lg mt-1 truncate"
                style={{ backgroundColor: table.statusColor, color: table.status === "Available" ? "#fff" : "#000" }}
              >
                {table.status}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
