import { useState, useMemo } from "react";
import { Check, ChevronDown, Clock, Calendar, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Drawer, DrawerContent, DrawerClose } from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import fireIcon from "@/assets/icons/fire.png";
import itemNotesIcon from "@/assets/icons/item-notes.png";
import phoneIcon from "@/assets/icons/phone-icon.png";
import timeIcon from "@/assets/icons/time-icon.png";
import arrowRightIcon from "@/assets/icons/arrow-right.png";
import shareOrderIcon from "@/assets/icons/share-order.png";
import dineInIcon from "@/assets/icons/dine-in.png";

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

// Order filter labels
const orderFilterLabels = ["All", "In Progress", "Unpaid", "Open", "Paid", "Closed"];

// Mock orders with filter categories
const mockOrders = [
  {
    id: 10,
    status: "Ordering",
    statusColor: "#4ADE80",
    filterCategory: "In Progress",
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
    isPaid: false,
  },
  {
    id: 11,
    status: "Ordered",
    statusColor: "#F97316",
    filterCategory: "In Progress",
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
    isPaid: false,
  },
  {
    id: 12,
    status: "Ready",
    statusColor: "#3B82F6",
    filterCategory: "Open",
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
    isPaid: false,
  },
  {
    id: 13,
    status: "Completed",
    statusColor: "#22C55E",
    filterCategory: "Paid",
    guest: "Sarah Wilson",
    orderNo: "Order No 11",
    seats: 3,
    date: "Thu, 22 Jun 2024",
    arrivedAt: "12:00:00 PM",
    timer: "01:30",
    type: "Dine In",
    check: 15,
    revenueCenter: "Main Hall",
    tip: "$8.00",
    paymentType: "Card",
    isPaid: true,
  },
  {
    id: 14,
    status: "Completed",
    statusColor: "#22C55E",
    filterCategory: "Paid",
    guest: "Tom Brown",
    orderNo: "Order No 12",
    seats: 2,
    date: "Thu, 22 Jun 2024",
    arrivedAt: "11:30:00 AM",
    timer: "02:00",
    type: "Take Out",
    check: 10,
    revenueCenter: "FF Balcony",
    tip: "$3.00",
    paymentType: "Cash",
    isPaid: true,
  },
  {
    id: 15,
    status: "Pending Payment",
    statusColor: "#EAB308",
    filterCategory: "Unpaid",
    guest: "Emma Davis",
    orderNo: "Order No 13",
    seats: 5,
    date: "Thu, 22 Jun 2024",
    arrivedAt: "1:00:00 PM",
    timer: "00:45",
    type: "Dine In",
    check: 20,
    revenueCenter: "Main Hall",
    tip: "$0.00",
    paymentType: "Pending",
    isPaid: false,
  },
  {
    id: 16,
    status: "Pending Payment",
    statusColor: "#EAB308",
    filterCategory: "Unpaid",
    guest: "James Lee",
    orderNo: "Order No 14",
    seats: 4,
    date: "Thu, 22 Jun 2024",
    arrivedAt: "2:30:00 PM",
    timer: "00:20",
    type: "Dine In",
    check: 18,
    revenueCenter: "FF Balcony",
    tip: "$0.00",
    paymentType: "Pending",
    isPaid: false,
  },
  {
    id: 17,
    status: "Closed",
    statusColor: "#6B7280",
    filterCategory: "Closed",
    guest: "Lisa Chen",
    orderNo: "Order No 15",
    seats: 2,
    date: "Thu, 22 Jun 2024",
    arrivedAt: "10:00:00 AM",
    timer: "03:00",
    type: "Dine In",
    check: 12,
    revenueCenter: "Main Hall",
    tip: "$5.00",
    paymentType: "Card",
    isPaid: true,
  },
  {
    id: 18,
    status: "Closed",
    statusColor: "#6B7280",
    filterCategory: "Closed",
    guest: "Robert Kim",
    orderNo: "Order No 16",
    seats: 6,
    date: "Thu, 22 Jun 2024",
    arrivedAt: "9:30:00 AM",
    timer: "04:00",
    type: "Dine In",
    check: 25,
    revenueCenter: "FF Balcony",
    tip: "$10.00",
    paymentType: "Card",
    isPaid: true,
  },
  {
    id: 19,
    status: "New Order",
    statusColor: "#3B82F6",
    filterCategory: "Open",
    guest: "Amy White",
    orderNo: "Order No 17",
    seats: 3,
    date: "Thu, 22 Jun 2024",
    arrivedAt: "2:45:00 PM",
    timer: "00:05",
    type: "Take Out",
    check: 9,
    revenueCenter: "Main Hall",
    tip: "$0.00",
    paymentType: "Pending",
    isPaid: false,
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

  // Filter orders based on active filter
  const filteredOrders = useMemo(() => {
    if (activeFilter === "All") return mockOrders;
    return mockOrders.filter(order => order.filterCategory === activeFilter);
  }, [activeFilter]);

  // Calculate counts for each filter
  const orderFilters = useMemo(() => {
    return orderFilterLabels.map(label => ({
      label,
      count: label === "All" 
        ? mockOrders.length 
        : mockOrders.filter(order => order.filterCategory === label).length
    }));
  }, []);

  const handleOrderClick = (order: typeof mockOrders[0]) => {
    setSelectedOrder(order);
    if (isMobile) {
      setIsDrawerOpen(true);
    }
  };

  return (
    <div className="h-full flex flex-col bg-black text-white overflow-hidden p-3 gap-3">
      {/* ROW 1: Date Filters (Vertical) + Stats/Insights */}
      <div className="flex gap-3 flex-shrink-0 items-stretch">
        {/* Date Filters - Vertical */}
        <div 
          className="flex flex-col gap-2 p-3 rounded-xl items-center justify-center"
          style={{ background: "#7575754D", boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)" }}
        >
          <Calendar className="w-4 h-4 text-white/60" />
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger 
              className="h-7 px-2 border-0 text-xs text-white w-[90px]"
              style={{ background: "#5555554D" }}
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
          <span className="text-white/40 text-xs">vs</span>
          <Select value={compareDate} onValueChange={setCompareDate}>
            <SelectTrigger 
              className="h-7 px-2 border-0 text-xs text-white w-[90px]"
              style={{ background: "#5555554D" }}
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

        {/* Stats/Insights Row */}
        <div className="flex-1 flex gap-2 overflow-x-auto scrollbar-hide">
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

      {/* ROW 2: Orders + Order Panel - Two columns */}
      <div className="flex-1 flex gap-3 min-h-0 overflow-hidden">
        {/* Left Column: Order Tabs + Orders List + Table Status */}
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
          <ScrollArea className="flex-1 min-h-0">
            <div className="space-y-2 pr-2">
              {filteredOrders.map((order) => (
                <div
                  key={order.id}
                  onClick={() => handleOrderClick(order)}
                  className={`rounded-xl cursor-pointer transition-all overflow-hidden ${
                    selectedOrder?.id === order.id ? "border border-white" : "border border-white/10"
                  }`}
                  style={{ background: "#2A2A2A" }}
                >
                {/* Mobile Layout */}
                <div className="flex items-stretch w-full md:hidden p-3">
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
                <div className="hidden md:flex items-stretch">
                    {/* Left Content with padding */}
                    <div className="flex-1 flex items-stretch gap-3 p-3">
                      {/* Order Number Box */}
                      <div className="flex-shrink-0 flex flex-col items-center justify-center w-14 rounded-lg border border-white/20 py-2 gap-1" style={{ background: '#1A1A1A' }}>
                        <span className="text-lg font-bold text-white">{order.id}</span>
                        <span className="text-xs text-white/40">000</span>
                      </div>

                      {/* Main Content */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                        {/* Row 1: Name + Table | Server | Status */}
                        <div className="flex items-center text-xs lg:text-sm">
                          <div className="flex items-center gap-1 lg:gap-2 w-[180px] lg:w-[220px] flex-shrink-0">
                            <span className="text-white font-medium truncate">{order.guest}</span>
                            <span className="text-white/60">·</span>
                            <span className="text-white font-medium">T{order.seats}</span>
                          </div>
                          <span className="text-white/60 flex-1 truncate px-1 lg:px-2">Mia Jone</span>
                          <span 
                            className="font-semibold uppercase flex-shrink-0"
                            style={{ color: order.statusColor }}
                          >
                            {order.status}
                          </span>
                        </div>
                        
                        {/* Row 2: Party info | Timer | Total */}
                        <div className="flex items-center text-xs lg:text-sm">
                          <div className="flex items-center gap-1 text-white/60 w-[180px] lg:w-[220px] flex-shrink-0">
                            <img src={dineInIcon} alt="Dine In" className="w-3 h-3 lg:w-4 lg:h-4 object-contain" />
                            <span className="truncate">Party of {order.seats}, {order.arrivedAt}</span>
                            <span className="text-white/40">|</span>
                            <span>{order.timer}</span>
                          </div>
                          <div className="flex-1"></div>
                          <span className="text-white font-semibold flex-shrink-0">$70.96</span>
                        </div>
                        
                        {/* Row 3: Revenue Center | Payment Status | Amount */}
                        <div className="flex items-center text-xs lg:text-sm">
                          <span className="text-white font-medium w-[180px] lg:w-[220px] flex-shrink-0 truncate">{order.revenueCenter}</span>
                          <span className="text-white/60 flex-1 truncate px-1 lg:px-2">Un Paid</span>
                          <span className="text-white flex-shrink-0">$0.00</span>
                        </div>
                      </div>
                    </div>

                    {/* Right Action Buttons - Edge to edge (hidden for completed/paid orders) */}
                    {order.status !== "Completed" && !order.isPaid && (
                      <div className="flex-shrink-0 flex flex-col w-10">
                        <button 
                          className="flex-1 flex items-center justify-center hover:opacity-80 transition-opacity"
                          style={{ background: 'linear-gradient(180deg, #FF9E65 0%, #FF5E00 100%)' }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <img src={arrowRightIcon} alt="Merge" className="w-4 h-4 object-contain" />
                        </button>
                        <button 
                          className="flex-1 flex items-center justify-center hover:opacity-80 transition-opacity"
                          style={{ background: 'linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)' }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <img src={shareOrderIcon} alt="Transfer" className="w-4 h-4 object-contain brightness-0" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Table Status - Below Orders */}
          <div className="flex-shrink-0 mt-2 pt-2 border-t border-white/10">
            <div className="flex items-center gap-2 mb-1">
              <button
                className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded"
                style={{ background: "#7575754D" }}
              >
                First Floor <ChevronDown className="w-2.5 h-2.5" />
              </button>
              <h3 className="text-xs font-medium text-white/60">Table Status</h3>
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

        {/* Right Column: Order Panel - Full height */}
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
      <Drawer direction="top" open={isDrawerOpen && isMobile} onOpenChange={setIsDrawerOpen}>
        <DrawerContent className="bg-neutral-900 border-none !h-[100dvh] !top-0 !bottom-0 !rounded-none !max-h-none">
          <DrawerClose className="absolute right-4 top-2 z-10 rounded-full p-1 bg-white/10 hover:bg-white/20">
            <X className="w-4 h-4 text-white" />
          </DrawerClose>
          <div className="flex flex-col h-full overflow-hidden">
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
    </div>
  );
};

export default Dashboard;
