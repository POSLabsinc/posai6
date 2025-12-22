import { useState } from "react";
import { Check, ChevronDown, Clock, Calendar, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Drawer, DrawerContent, DrawerClose } from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import fireIcon from "@/assets/icons/fire.png";
import itemNotesIcon from "@/assets/icons/item-notes.png";
import phoneIcon from "@/assets/icons/phone-icon.png";
import timeIcon from "@/assets/icons/time-icon.png";

// Stats data
const stats = [
  { label: "Total Sale", value: "$ 1,400.00", change: "2.2%", isUp: true, icon: "💵" },
  { label: "Total Tip", value: "$ 285.00", change: "2.2%", isUp: true, icon: "💵" },
  { label: "Total Hours", value: "6h 28min", change: "0.5%", isUp: false, icon: "clock" },
  { label: "Ordering", value: "12", change: "2.5%", isUp: true, icon: "clock" },
  { label: "Ready to Served", value: "5", change: "1%", isUp: false, hasCheckbox: true },
  { label: "Ready to Served", value: "8", change: "1%", isUp: false, hasCheckbox: true },
];

// Date filter options
const dateFilters = ["Today", "Yesterday", "This Week", "Last Week", "This Month", "Last Month", "Custom"];

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
  { id: "T1", seats: 6, status: "Ordering", statusColor: "#4ADE80" },
  { id: "T2", seats: 4, status: "Payment", statusColor: "#F59E0B" },
  { id: "T3", seats: 6, status: "Ordered", statusColor: "#F97316" },
  { id: "T4", seats: 10, status: "Available", statusColor: "#6B7280" },
  { id: "T5", seats: 10, status: "Available", statusColor: "#6B7280" },
  { id: "T6", seats: 8, status: "Available", statusColor: "#6B7280" },
  { id: "T7", seats: 6, status: "Ordering", statusColor: "#4ADE80" },
  { id: "T8", seats: 4, status: "Available", statusColor: "#6B7280" },
  { id: "T9", seats: 2, status: "Ordered", statusColor: "#F97316" },
  { id: "T10", seats: 6, status: "Payment", statusColor: "#F59E0B" },
  { id: "T11", seats: 4, status: "Available", statusColor: "#6B7280" },
  { id: "T12", seats: 8, status: "Ordering", statusColor: "#4ADE80" },
  { id: "T13", seats: 6, status: "Available", statusColor: "#6B7280" },
  { id: "T14", seats: 4, status: "Ordered", statusColor: "#F97316" },
  { id: "T15", seats: 2, status: "Available", statusColor: "#6B7280" },
];

// Order Panel Content Component
interface OrderPanelContentProps {
  selectedOrder: typeof mockOrders[0] | null;
  orderItems: typeof orderItems;
  subtotal: number;
  total: number;
  phoneIcon: string;
  timeIcon: string;
  itemNotesIcon: string;
  fireIcon: string;
}

const OrderPanelContent = ({ selectedOrder, orderItems, subtotal, total, phoneIcon, timeIcon, itemNotesIcon, fireIcon }: OrderPanelContentProps) => (
  <>
    {/* Guest Header */}
    <div className="px-3 py-2 border-b border-white/10">
      <div className="flex items-center justify-between flex-wrap gap-2">
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
      <div 
        className="flex items-center gap-2 rounded-lg px-3 py-2"
        style={{ background: "#7575754D", boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)" }}
      >
        <img src={itemNotesIcon} alt="notes" className="w-4 h-4 opacity-60" />
        <span className="text-xs text-amber-400">No Onions, Extra Tomato Sauce</span>
      </div>
    </div>

    {/* Order Items */}
    <ScrollArea className="flex-1 px-3 py-2 max-h-[300px] md:max-h-none">
      <div className="space-y-2">
        {orderItems.map((item, index) => (
          <div
            key={index}
            className="p-2 border border-white/10 rounded-lg"
            style={{ background: "linear-gradient(180deg, #4D4D4D 0%, #616161 100%)" }}
          >
            <div className="flex items-center gap-3">
              <span className="w-5 h-5 rounded-full bg-orange-500 text-white text-xs font-medium flex items-center justify-center flex-shrink-0">
                {item.qty}
              </span>
              <span className="flex-1 text-sm font-medium">{item.name}</span>
              <span className="text-sm font-medium">$ {item.price.toFixed(2)}</span>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>

    {/* Order Summary */}
    <div className="px-3 py-2 border-t border-white/10">
      <div 
        className="text-xs rounded-lg px-3 py-2 space-y-1"
        style={{ background: "#7575754D", boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)" }}
      >
        <div className="flex justify-between">
          <span className="text-white/50">Sub Total</span>
          <span>$ {subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/50">Tax (2%)</span>
          <span>$ {(subtotal * 0.02).toFixed(2)}</span>
        </div>
      </div>
    </div>

    {/* Action Buttons */}
    <div className="px-3 py-2 flex items-center gap-2">
      <button
        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ background: "linear-gradient(180deg, #FF9E65 0%, #FF5E00 100%)" }}
      >
        <img src={fireIcon} alt="fire" className="w-4 h-4" />
      </button>
      <button
        className="flex-1 h-8 rounded-full text-sm font-medium text-black flex items-center justify-center"
        style={{ background: "linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)" }}
      >
        CHARGE $ {total.toFixed(2)}
      </button>
    </div>
  </>
);


const Dashboard = () => {
  const [activeFilter, setActiveFilter] = useState("All");
  const [selectedOrder, setSelectedOrder] = useState<typeof mockOrders[0] | null>(mockOrders[0]);
  const [dateFilter, setDateFilter] = useState("Today");
  const [compareDate, setCompareDate] = useState("Yesterday");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const isMobile = useIsMobile();

  const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.qty, 0);
  const total = subtotal;

  const handleOrderClick = (order: typeof mockOrders[0]) => {
    setSelectedOrder(order);
    if (isMobile) {
      setIsDrawerOpen(true);
    }
  };

  return (
    <div className="h-full flex flex-col bg-black text-white overflow-hidden p-3 gap-3">
      {/* ROW 1: Date Filters + Stats/Insights */}
      <div className="flex flex-col gap-2 flex-shrink-0">
        {/* Date Filters */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-white/60" />
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger 
                className="h-8 px-3 border-0 text-sm text-white"
                style={{ background: "#7575754D", boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)" }}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-neutral-800 border-neutral-700">
                {dateFilters.map((filter) => (
                  <SelectItem key={filter} value={filter} className="text-white hover:bg-neutral-700">
                    {filter}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <span className="text-white/40 text-sm">vs</span>
          <div className="flex items-center gap-2">
            <Select value={compareDate} onValueChange={setCompareDate}>
              <SelectTrigger 
                className="h-8 px-3 border-0 text-sm text-white"
                style={{ background: "#7575754D", boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)" }}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-neutral-800 border-neutral-700">
                {dateFilters.map((filter) => (
                  <SelectItem key={filter} value={filter} className="text-white hover:bg-neutral-700">
                    {filter}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Stats/Insights Row */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="flex-shrink-0 rounded-xl px-4 py-3 min-w-[160px] flex-1"
              style={{ background: "#7575754D", boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)" }}
            >
              <div className="flex items-center gap-2 text-xs text-white/60 mb-2">
                {stat.hasCheckbox ? (
                  <div className="w-4 h-4 rounded border border-white/40 flex items-center justify-center">
                    <Check className="w-3 h-3" />
                  </div>
                ) : stat.icon === "clock" ? (
                  <Clock className="w-4 h-4 text-white/60" />
                ) : (
                  <span className="text-sm">{stat.icon}</span>
                )}
                <span>{stat.label}</span>
              </div>
              <div className="text-xl font-semibold mb-1">{stat.value}</div>
              <div className={`text-xs flex items-center gap-1 ${stat.isUp ? "text-green-400" : "text-red-400"}`}>
                <span>{stat.isUp ? "↗" : "↘"}</span>
                <span>{stat.change}</span>
                <span className="text-white/40">from {compareDate.toLowerCase()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ROW 2: Orders + Order Panel */}
      <div className="flex-1 flex gap-3 min-h-0 overflow-hidden">
        {/* Left: Orders List with Scroll */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Order Filters */}
          <div className="flex gap-1.5 mb-2 overflow-x-auto scrollbar-hide flex-shrink-0">
            {orderFilters.map((filter) => (
              <button
                key={filter.label}
                onClick={() => setActiveFilter(filter.label)}
                className={`flex-shrink-0 px-2 py-1 rounded-full text-xs font-medium transition-all ${
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
                {filter.label} <span className="font-bold ml-0.5">{filter.count}</span>
              </button>
            ))}
          </div>

          {/* Orders List with Scroll */}
          <ScrollArea className="flex-1">
            <div className="space-y-2 pr-2">
              {mockOrders.map((order) => (
                <div
                  key={order.id}
                  onClick={() => handleOrderClick(order)}
                  className={`rounded-xl p-3 cursor-pointer transition-all ${
                    selectedOrder?.id === order.id ? "border border-white" : "border border-white/10"
                  }`}
                  style={{ background: "#2A2A2A" }}
                >
                {/* Mobile Layout */}
                <div className="flex items-stretch w-full md:hidden">
                  {/* Order Number - Mobile compact style */}
                  <div className="flex-shrink-0 px-2 py-2 flex items-center">
                    <div className="relative w-10 h-12 bg-neutral-800 rounded-lg flex flex-col items-center justify-center border border-neutral-600">
                      <span className="text-sm font-bold text-white">{order.id}</span>
                      <span className="text-sm text-gray-500">000</span>
                    </div>
                  </div>

                  {/* Guest Info - Mobile compact layout */}
                  <div className="flex-1 min-w-0 py-2 pr-2">
                    <div className="flex flex-col gap-1">
                      {/* Row 1: Name + Table, Server, Status */}
                      <div className="flex items-center justify-between">
                        <span className="text-white font-medium text-sm">{order.guest} - T{order.seats}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm" style={{ color: '#B5B6BB' }}>Server</span>
                          <span className="text-sm font-medium" style={{ color: order.statusColor }}>{order.status}</span>
                        </div>
                      </div>
                      
                      {/* Row 2: Party info, Timer, Total */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-xs" style={{ color: '#B5B6BB' }}>
                          <span>Party of {order.seats}, {order.arrivedAt}</span>
                          <span className="text-gray-500">|</span>
                          <span>{order.timer}</span>
                        </div>
                        <span className="text-white font-semibold text-sm">$0.00</span>
                      </div>
                      
                      {/* Row 3: Revenue center, Payment status */}
                      <div className="flex items-center justify-between">
                        <span className="text-white font-medium text-sm">{order.revenueCenter}</span>
                        <div className="flex items-center gap-2 text-sm">
                          <span style={{ color: '#B5B6BB' }}>Un Paid</span>
                          <span className="text-white">$0.00</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tablet/Desktop Layout */}
                <div className="hidden md:flex items-center gap-3 md:gap-6">
                    {/* Order Number & Dine In Icon */}
                    <div className="flex flex-col items-center justify-center w-10 md:w-12 rounded-lg border border-white/20 flex-shrink-0 py-1.5 gap-0.5">
                      <span className="text-base md:text-lg font-bold">{order.id}</span>
                      <img src="/src/assets/icons/dine-in.png" alt="Dine In" className="w-4 h-4 md:w-5 md:h-5 opacity-80" />
                    </div>

                    {/* Status & Guest Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1 pb-1 border-b border-white/10">
                        <span
                          className="text-sm font-medium italic"
                          style={{ color: order.statusColor }}
                        >
                          {order.status}
                        </span>
                        <span className="text-sm text-white truncate ml-2">{order.guest}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-white/50">
                        <span>{order.orderNo}</span>
                        <span>{order.date}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-white/50">
                        <span>Seats {order.seats}</span>
                        <span>Arrived At {order.arrivedAt}</span>
                      </div>
                    </div>

                    {/* Timer & Type - Hidden on mobile */}
                    <div className="hidden md:flex lg:flex flex-col gap-1 min-w-[80px]">
                      <div>
                        <div className="text-sm text-white">{order.timer}</div>
                        <div className="text-xs text-white/50">Timer</div>
                      </div>
                      <div>
                        <div className="text-sm text-white">{order.type}</div>
                        <div className="text-xs text-white/50">Type</div>
                      </div>
                    </div>

                    {/* Check & Revenue Center - Hidden on mobile/tablet */}
                    <div className="hidden lg:flex flex-col gap-1 min-w-[100px]">
                      <div>
                        <div className="text-sm text-white">{order.check}</div>
                        <div className="text-xs text-white/50">Check</div>
                      </div>
                      <div>
                        <div className="text-sm text-white">{order.revenueCenter}</div>
                        <div className="text-xs text-white/50">Revenue Center</div>
                      </div>
                    </div>

                    {/* Tip & Payment Type - Hidden on mobile/tablet */}
                    <div className="hidden lg:flex flex-col gap-1 min-w-[80px]">
                      <div>
                        <div className="text-sm text-white">{order.tip}</div>
                        <div className="text-xs text-white/50">Tip</div>
                      </div>
                      <div>
                        <div className="text-sm text-white">{order.paymentType}</div>
                        <div className="text-xs text-white/50">Payment Type</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Right: Order Panel - Hidden on mobile, shown as drawer */}
        <div
          className="hidden md:flex w-[240px] lg:w-[345px] flex-shrink-0 rounded-xl flex-col"
          style={{ background: "#7575754D", boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)" }}
        >
          <OrderPanelContent
            selectedOrder={selectedOrder}
            orderItems={orderItems}
            subtotal={subtotal}
            total={total}
            phoneIcon={phoneIcon}
            timeIcon={timeIcon}
            itemNotesIcon={itemNotesIcon}
            fireIcon={fireIcon}
          />
        </div>
      </div>

      {/* Mobile Drawer for Order Panel */}
      <Drawer open={isDrawerOpen && isMobile} onOpenChange={setIsDrawerOpen}>
        <DrawerContent className="bg-neutral-900 border-t border-white/10 max-h-[85vh]">
          <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-white/20 mt-2 mb-2" />
          <DrawerClose className="absolute right-4 top-4 rounded-full p-1 bg-white/10 hover:bg-white/20">
            <X className="w-4 h-4 text-white" />
          </DrawerClose>
          <div className="flex flex-col max-h-[80vh]">
            <OrderPanelContent
              selectedOrder={selectedOrder}
              orderItems={orderItems}
              subtotal={subtotal}
              total={total}
              phoneIcon={phoneIcon}
              timeIcon={timeIcon}
              itemNotesIcon={itemNotesIcon}
              fireIcon={fireIcon}
            />
          </div>
        </DrawerContent>
      </Drawer>

      {/* ROW 3: Table Status - Compact */}
      <div className="flex-shrink-0">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-xs font-medium text-white/60">Table Status</h3>
          <button
            className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded"
            style={{ background: "#7575754D" }}
          >
            First Floor <ChevronDown className="w-2.5 h-2.5" />
          </button>
        </div>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {mockTables.map((table, index) => (
            <div
              key={index}
              className="flex-shrink-0 rounded-xl p-2.5 w-[90px] flex flex-col gap-1.5"
              style={{ background: "#7575754D", boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)" }}
            >
              <div className="flex items-center justify-between">
                <span className="text-base font-bold">{table.id}</span>
                <span className="text-[10px] text-white/50">{table.seats}S</span>
              </div>
              <div
                className="text-[10px] font-medium py-1 rounded-md text-center w-full"
                style={{ 
                  backgroundColor: table.statusColor,
                  color: table.status === "Available" ? "#fff" : "#000"
                }}
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
