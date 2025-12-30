import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Check, ChevronDown, Clock, Calendar as CalendarIcon, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Drawer, DrawerContent, DrawerClose } from "@/components/ui/drawer";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useIsMobile } from "@/hooks/use-mobile";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
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

// Import additional icons for order panel
import seatIcon from "@/assets/icons/seat-icon.png";
import splitIcon from "@/assets/icons/split-icon.png";
import clearIcon from "@/assets/icons/clear-c.png";

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
  selectedSeats: number[];
  toggleSeat: (seat: number) => void;
}

const OrderPanelContent = ({ selectedOrder, orderItems, subtotal, total, phoneIcon, timeIcon, itemNotesIcon, fireIcon, selectedSeats, toggleSeat }: OrderPanelContentProps) => {
  const tax = subtotal * 0.02;
  const serviceCharge = subtotal * 0.1;
  const discount = 0;
  const finalTotal = subtotal + tax + serviceCharge - discount;

  return (
    <>
      {/* Guest Header - Outside the box */}
      <div className="px-2 py-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-white font-medium flex-1">{selectedOrder?.guest || "GUEST NAME"}</span>
          <div className="flex items-center gap-1 text-white/50 text-[10px] flex-1 justify-center whitespace-nowrap">
            <img src={phoneIcon} alt="phone" className="w-3 h-3 opacity-60" />
            <span>(XXX) XXX-XXXX</span>
          </div>
          <div className="flex items-center gap-1 text-white/50 text-[10px] flex-1 justify-end whitespace-nowrap">
            <span>⚡</span>
            <span>{selectedOrder?.arrivedAt || "12:30 PM"}</span>
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
      <div className="flex-1 flex flex-col rounded-[10px] overflow-hidden" style={{
        background: "#7575754D",
        boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)"
      }}>
        {/* Table Order Info */}
        <div className="px-4 py-3 border-b border-white/10">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-white/10 text-white text-xs rounded">TABLE ORDER</span>
              <span className="text-white font-bold">{selectedOrder?.id || "—"}</span>
            </div>
            <div className="flex items-center gap-2">
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
            {[1, 2, 3, 4].map(seat => (
              <button 
                key={seat} 
                onClick={() => toggleSeat(seat)} 
                className={`w-7 h-7 rounded text-sm font-medium transition-colors ${
                  selectedSeats.includes(seat) ? "bg-white text-black" : "bg-white/10 text-white hover:bg-white/20"
                }`}
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
            <span className="text-amber-400">No Onions, Extra Tomato Sauce</span>
          </div>
        </div>

        {/* Order Items */}
        <ScrollArea className="flex-1 px-4 max-h-[300px] md:max-h-none">
          <div className="py-2 space-y-2">
            {orderItems.map((item, index) => (
              <div key={index} className="p-3 bg-white/5 rounded-xl border border-white/10">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-2">
                    <span className="w-6 h-6 bg-white rounded flex items-center justify-center text-black text-sm font-bold">
                      {item.qty}
                    </span>
                    <div>
                      <span className="text-white font-medium">{item.name}</span>
                    </div>
                  </div>
                  <span className="text-white font-medium">$ {item.price.toFixed(2)}</span>
                </div>
                {/* Seat indicators */}
                <div className="flex items-center gap-1 mt-2">
                  <img src={seatIcon} alt="Seat" className="w-4 h-4 opacity-50" />
                  {[1, 2].map(seat => (
                    <span key={seat} className="w-5 h-5 bg-white/10 rounded text-white text-xs flex items-center justify-center">
                      {seat}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Order Summary - Compact Mode */}
        <div className="p-2 border-t border-white/10 flex-shrink-0">
          <div className="text-xs rounded px-2 py-1.5 space-y-0.5" style={{
            background: '#7575754D',
            boxShadow: 'inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)'
          }}>
            <div className="flex justify-between gap-3">
              <span className="text-white">Sub Total: <span className="font-medium">$ {subtotal.toFixed(2)}</span></span>
              <span className="text-red-500">Discount: <span className="font-medium">$ {discount.toFixed(2)}</span></span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-white">Service Charge: <span className="font-medium">$ {serviceCharge.toFixed(2)}</span></span>
              <span className="text-white">Tax: <span className="font-medium">$ {tax.toFixed(2)}</span></span>
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="px-4 py-3 border-t border-white/10 flex items-center gap-2">
          <button className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center hover:bg-red-500 transition-colors">
            <img src={clearIcon} alt="Clear" className="w-4 h-4 brightness-0 invert" />
          </button>
          <button className="px-4 py-2 rounded-full flex items-center gap-1 text-white text-sm font-medium" style={{
            background: "linear-gradient(180deg, #FF9E65 0%, #FF5E00 100%)"
          }}>
            <img src={fireIcon} alt="Fire" className="w-4 h-4 brightness-0 invert" />
            <span>FIRE</span>
          </button>
          <button className="flex-1 py-2 rounded-full text-black text-sm font-bold" style={{
            background: "linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)"
          }}>
            CHARGE $ {finalTotal.toFixed(2)}
          </button>
        </div>
      </div>
    </>
  );
};


const Dashboard = () => {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState("All");
  const [selectedOrder, setSelectedOrder] = useState<typeof mockOrders[0] | null>(mockOrders[0]);
  const [dateFilter, setDateFilter] = useState("Today");
  const [compareDate, setCompareDate] = useState("Yesterday");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedSeats, setSelectedSeats] = useState<number[]>([1, 2, 3, 4]);
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>();
  const [isCustomCalendarOpen, setIsCustomCalendarOpen] = useState(false);
  const [compareCustomDateRange, setCompareCustomDateRange] = useState<DateRange | undefined>();
  const [isCompareCustomCalendarOpen, setIsCompareCustomCalendarOpen] = useState(false);
  const isMobile = useIsMobile();

  const handleDateFilterChange = (value: string) => {
    setDateFilter(value);
    if (value === "Custom") {
      setIsCustomCalendarOpen(true);
    }
  };

  const handleCompareDateChange = (value: string) => {
    setCompareDate(value);
    if (value === "Custom") {
      setIsCompareCustomCalendarOpen(true);
    }
  };

  const getDateFilterDisplay = () => {
    if (dateFilter === "Custom" && customDateRange?.from) {
      if (customDateRange.to) {
        return `${format(customDateRange.from, "MMM d")} - ${format(customDateRange.to, "MMM d")}`;
      }
      return format(customDateRange.from, "MMM d, yyyy");
    }
    return dateFilter;
  };

  const getCompareDateDisplay = () => {
    if (compareDate === "Custom" && compareCustomDateRange?.from) {
      if (compareCustomDateRange.to) {
        return `${format(compareCustomDateRange.from, "MMM d")} - ${format(compareCustomDateRange.to, "MMM d")}`;
      }
      return format(compareCustomDateRange.from, "MMM d, yyyy");
    }
    return compareDate;
  };

  const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.qty, 0);
  const total = subtotal;

  const toggleSeat = (seat: number) => {
    setSelectedSeats(prev => prev.includes(seat) ? prev.filter(s => s !== seat) : [...prev, seat]);
  };

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
    <div className="h-full flex flex-col bg-black text-white overflow-hidden px-3 pb-3 gap-3">
      {/* ROW 1: Date Filters (Vertical) + Stats/Insights */}
      <div className="flex gap-3 flex-shrink-0 items-stretch">
        {/* Date Filters - Vertical */}
        <div 
          className="flex flex-col gap-2 p-3 rounded-xl items-center justify-center"
          style={{ background: "#7575754D", boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)" }}
        >
          {/* Main Date Filter */}
          {dateFilter === "Custom" ? (
            <Popover open={isCustomCalendarOpen} onOpenChange={setIsCustomCalendarOpen}>
              <PopoverTrigger asChild>
                <button 
                  className="h-7 px-2 border-0 text-xs text-white w-[90px] rounded-md flex items-center justify-between gap-1"
                  style={{ background: "#5555554D" }}
                >
                  <CalendarIcon className="w-3 h-3" />
                  <span className="truncate">{getDateFilterDisplay()}</span>
                  <X 
                    className="w-3 h-3 hover:text-red-400" 
                    onClick={(e) => {
                      e.stopPropagation();
                      setDateFilter("Today");
                      setCustomDateRange(undefined);
                    }}
                  />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-neutral-800 border-neutral-700" align="start">
                <Calendar
                  mode="range"
                  selected={customDateRange}
                  onSelect={(range) => {
                    setCustomDateRange(range);
                    if (range?.to) {
                      setIsCustomCalendarOpen(false);
                    }
                  }}
                  initialFocus
                  className="p-3 pointer-events-auto text-white"
                />
              </PopoverContent>
            </Popover>
          ) : (
            <Select value={dateFilter} onValueChange={handleDateFilterChange}>
              <SelectTrigger 
                className="h-7 px-2 border-0 text-xs text-white w-[90px]"
                style={{ background: "#5555554D" }}
              >
                <SelectValue>{dateFilter}</SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-neutral-800 border-neutral-700">
                {dateFilters.map((filter) => (
                  <SelectItem key={filter} value={filter} className="text-white hover:bg-neutral-700">
                    {filter}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <span className="text-white/40 text-xs">vs</span>
          {/* Compare Date Filter */}
          {compareDate === "Custom" ? (
            <Popover open={isCompareCustomCalendarOpen} onOpenChange={setIsCompareCustomCalendarOpen}>
              <PopoverTrigger asChild>
                <button 
                  className="h-7 px-2 border-0 text-xs text-white w-[90px] rounded-md flex items-center justify-between gap-1"
                  style={{ background: "#5555554D" }}
                >
                  <CalendarIcon className="w-3 h-3" />
                  <span className="truncate">{getCompareDateDisplay()}</span>
                  <X 
                    className="w-3 h-3 hover:text-red-400" 
                    onClick={(e) => {
                      e.stopPropagation();
                      setCompareDate("Yesterday");
                      setCompareCustomDateRange(undefined);
                    }}
                  />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-neutral-800 border-neutral-700" align="start">
                <Calendar
                  mode="range"
                  selected={compareCustomDateRange}
                  onSelect={(range) => {
                    setCompareCustomDateRange(range);
                    if (range?.to) {
                      setIsCompareCustomCalendarOpen(false);
                    }
                  }}
                  initialFocus
                  className="p-3 pointer-events-auto text-white"
                />
              </PopoverContent>
            </Popover>
          ) : (
            <Select value={compareDate} onValueChange={handleCompareDateChange}>
              <SelectTrigger 
                className="h-7 px-2 border-0 text-xs text-white w-[90px]"
                style={{ background: "#5555554D" }}
              >
                <SelectValue>{compareDate}</SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-neutral-800 border-neutral-700">
                {dateFilters.map((filter) => (
                  <SelectItem key={filter} value={filter} className="text-white hover:bg-neutral-700">
                    {filter}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
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
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/tableorder/T${order.seats}/merge?orderId=${order.id}`);
                          }}
                        >
                          <img src={arrowRightIcon} alt="Merge" className="w-4 h-4 object-contain" />
                        </button>
                        <button 
                          className="flex-1 flex items-center justify-center hover:opacity-80 transition-opacity"
                          style={{ background: 'linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/tableorder/T${order.seats}/transfer?orderId=${order.id}`);
                          }}
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
            selectedSeats={selectedSeats}
            toggleSeat={toggleSeat}
          />
        </div>
      </div>

      {/* Mobile Drawer for Order Panel */}
      <Drawer open={isDrawerOpen && isMobile} onOpenChange={setIsDrawerOpen}>
        <DrawerContent 
          hideHandle
          className="bg-neutral-900 border-none !inset-0 !h-[100dvh] !rounded-none !max-h-none !mt-0"
        >
          <div className="flex items-center justify-end px-4 pt-2">
            <DrawerClose className="rounded-full p-1 bg-white/10 hover:bg-white/20">
              <X className="w-4 h-4 text-white" />
            </DrawerClose>
          </div>
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
              selectedSeats={selectedSeats}
              toggleSeat={toggleSeat}
            />
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default Dashboard;
