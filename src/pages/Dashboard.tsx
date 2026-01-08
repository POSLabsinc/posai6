import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Check, ChevronDown, Clock, Calendar as CalendarIcon, X, Users, Share2 } from "lucide-react";
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
import chairWhiteIcon from "@/assets/icons/chair-white.png";
import saveIcon from "@/assets/icons/save.png";
import runnerIcon from "@/assets/icons/runner.png";
import { OrderNotesAutocomplete } from "@/components/OrderNotesAutocomplete";
import SwipeableCartItem from "@/components/SwipeableCartItem";

// Stats data by date filter
const statsData: Record<string, Array<{ label: string; value: string; change: string; isUp: boolean; icon?: string; hasCheckbox?: boolean }>> = {
  "Today": [
    { label: "Total Sale", value: "$ 1,400.00", change: "2.2%", isUp: true, icon: "💵" },
    { label: "Total Tip", value: "$ 285.00", change: "2.2%", isUp: true, icon: "💵" },
    { label: "Total Hours", value: "6h 28min", change: "0.5%", isUp: false, icon: "clock" },
    { label: "Ordering", value: "12", change: "2.5%", isUp: true, icon: "clock" },
    { label: "Ready to Served", value: "5", change: "1%", isUp: false, hasCheckbox: true },
    { label: "Ready to Served", value: "8", change: "1%", isUp: false, hasCheckbox: true },
  ],
  "Yesterday": [
    { label: "Total Sale", value: "$ 1,250.00", change: "1.8%", isUp: false, icon: "💵" },
    { label: "Total Tip", value: "$ 210.00", change: "1.5%", isUp: false, icon: "💵" },
    { label: "Total Hours", value: "5h 45min", change: "1.2%", isUp: true, icon: "clock" },
    { label: "Ordering", value: "9", change: "1.0%", isUp: false, icon: "clock" },
    { label: "Ready to Served", value: "3", change: "2%", isUp: true, hasCheckbox: true },
    { label: "Ready to Served", value: "6", change: "0.5%", isUp: true, hasCheckbox: true },
  ],
  "This Week": [
    { label: "Total Sale", value: "$ 8,750.00", change: "5.5%", isUp: true, icon: "💵" },
    { label: "Total Tip", value: "$ 1,420.00", change: "4.2%", isUp: true, icon: "💵" },
    { label: "Total Hours", value: "42h 15min", change: "2.1%", isUp: true, icon: "clock" },
    { label: "Ordering", value: "78", change: "3.8%", isUp: true, icon: "clock" },
    { label: "Ready to Served", value: "28", change: "1.5%", isUp: true, hasCheckbox: true },
    { label: "Ready to Served", value: "45", change: "2.2%", isUp: true, hasCheckbox: true },
  ],
  "Last Week": [
    { label: "Total Sale", value: "$ 7,920.00", change: "3.2%", isUp: false, icon: "💵" },
    { label: "Total Tip", value: "$ 1,180.00", change: "2.8%", isUp: false, icon: "💵" },
    { label: "Total Hours", value: "38h 30min", change: "1.5%", isUp: false, icon: "clock" },
    { label: "Ordering", value: "65", change: "2.1%", isUp: false, icon: "clock" },
    { label: "Ready to Served", value: "22", change: "0.8%", isUp: false, hasCheckbox: true },
    { label: "Ready to Served", value: "38", change: "1.2%", isUp: false, hasCheckbox: true },
  ],
  "This Month": [
    { label: "Total Sale", value: "$ 32,500.00", change: "8.5%", isUp: true, icon: "💵" },
    { label: "Total Tip", value: "$ 5,200.00", change: "6.2%", isUp: true, icon: "💵" },
    { label: "Total Hours", value: "168h 45min", change: "4.5%", isUp: true, icon: "clock" },
    { label: "Ordering", value: "312", change: "5.8%", isUp: true, icon: "clock" },
    { label: "Ready to Served", value: "120", change: "3.2%", isUp: true, hasCheckbox: true },
    { label: "Ready to Served", value: "185", change: "4.1%", isUp: true, hasCheckbox: true },
  ],
  "Last Month": [
    { label: "Total Sale", value: "$ 28,400.00", change: "4.2%", isUp: false, icon: "💵" },
    { label: "Total Tip", value: "$ 4,580.00", change: "3.5%", isUp: false, icon: "💵" },
    { label: "Total Hours", value: "155h 20min", change: "2.8%", isUp: false, icon: "clock" },
    { label: "Ordering", value: "275", change: "3.2%", isUp: false, icon: "clock" },
    { label: "Ready to Served", value: "98", change: "1.8%", isUp: false, hasCheckbox: true },
    { label: "Ready to Served", value: "162", change: "2.5%", isUp: false, hasCheckbox: true },
  ],
};

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
const initialOrderItems = [
  { id: 1, qty: 1, name: "Classic Crispy Burger", price: 12.00, seats: [1], noTax: false, itemOrderType: "Dine In", isFired: false },
  { id: 2, qty: 1, name: "Meatballs", price: 16.00, seats: [2], noTax: false, itemOrderType: "Dine In", isFired: false },
  { id: 3, qty: 2, name: "Rigatoni Pasta", price: 8.00, seats: [1, 2], noTax: false, itemOrderType: "Dine In", isFired: false },
  { id: 4, qty: 1, name: "Caesar Salad", price: 9.50, seats: [3], noTax: false, itemOrderType: "Dine In", isFired: false },
  { id: 5, qty: 1, name: "Grilled Salmon", price: 22.00, seats: [4], noTax: false, itemOrderType: "Dine In", isFired: false },
  { id: 6, qty: 1, name: "Garlic Bread", price: 5.00, seats: [1, 2, 3, 4], noTax: false, itemOrderType: "Dine In", isFired: false },
];

// Table status configurations (matching /tableorder screen)
const tableStatusConfig: Record<string, { textColor: string; bgColor: string }> = {
  "Available": { textColor: "#FFFFFF", bgColor: "#22C55E" },
  "Ordering": { textColor: "#000000", bgColor: "#FACC15" },
  "Ordered": { textColor: "#000000", bgColor: "#F97316" },
  "Reserved": { textColor: "#FFFFFF", bgColor: "#6B7280" },
  "Seated": { textColor: "#FFFFFF", bgColor: "#9CA3AF" },
  "Running Late": { textColor: "#FFFFFF", bgColor: "#EF4444" },
  "1st Course": { textColor: "#FFFFFF", bgColor: "#A855F7" },
  "2nd Course": { textColor: "#000000", bgColor: "#FACC15" },
  "3rd Course": { textColor: "#000000", bgColor: "#F97316" },
  "Dessert": { textColor: "#FFFFFF", bgColor: "#EC4899" },
  "Partially Seated": { textColor: "#000000", bgColor: "#4ADE80" },
  "Served": { textColor: "#FFFFFF", bgColor: "#3B82F6" },
  "Paid": { textColor: "#000000", bgColor: "#34D399" },
};

// Mock table data (matching /tableorder screen)
const mockTables = [
  { id: "T1", seats: 6, status: "Available" },
  { id: "T2", seats: 4, status: "Ordering" },
  { id: "T3", seats: 6, status: "Ordered" },
  { id: "T4", seats: 10, status: "Reserved" },
  { id: "T5", seats: 10, status: "Seated" },
  { id: "T6", seats: 8, status: "Running Late" },
  { id: "T7", seats: 6, status: "1st Course" },
  { id: "T8", seats: 4, status: "2nd Course" },
  { id: "T9", seats: 2, status: "3rd Course" },
  { id: "T10", seats: 6, status: "Dessert" },
  { id: "T11", seats: 4, status: "Partially Seated" },
  { id: "T12", seats: 8, status: "Served" },
  { id: "T13", seats: 6, status: "Available" },
  { id: "T14", seats: 4, status: "Paid" },
  { id: "T15", seats: 2, status: "Ordering" },
];

// Import additional icons for order panel
import clearIcon from "@/assets/icons/clear-c.png";

// Order Panel Content Component
interface OrderPanelContentProps {
  selectedOrder: typeof mockOrders[0] | null;
  orderItems: typeof initialOrderItems;
  subtotal: number;
  total: number;
  phoneIcon: string;
  timeIcon: string;
  itemNotesIcon: string;
  fireIcon: string;
  seatFilter: (number | 'all')[];
  toggleSeatFilter: (seat: number | 'all') => void;
  orderNotes: string;
  setOrderNotes: (notes: string) => void;
  activeSwipedItemId: string | null;
  setActiveSwipedItemId: (id: string | null) => void;
  onToggleNoTax: (itemId: number) => void;
  onOrderTypeChange: (itemId: number, orderType: string) => void;
  onDeleteItem: (itemId: number) => void;
  onFireItem: (itemId: number) => void;
}

const OrderPanelContent = ({ 
  selectedOrder, 
  orderItems, 
  subtotal, 
  total, 
  phoneIcon, 
  timeIcon, 
  itemNotesIcon, 
  fireIcon, 
  seatFilter, 
  toggleSeatFilter,
  orderNotes,
  setOrderNotes,
  activeSwipedItemId,
  setActiveSwipedItemId,
  onToggleNoTax,
  onOrderTypeChange,
  onDeleteItem,
  onFireItem
}: OrderPanelContentProps) => {
  const tax = subtotal * 0.02;
  const serviceCharge = subtotal * 0.1;
  const discount = 0;
  const finalTotal = subtotal + tax + serviceCharge - discount;
  const guestCount = selectedOrder?.seats || 4;

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
        {/* Table Order Info - Row 1 */}
        <div className="px-3 py-2 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-neutral-700 text-white text-xs rounded border border-white/20">
                TABLE T{selectedOrder?.seats || 2}
              </span>
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3 text-white/60" />
                <span className="text-white/60 text-xs">{guestCount}</span>
              </div>
              <span className="text-white font-bold text-sm">{selectedOrder?.id || "—"}</span>
            </div>
            <div className="flex items-center gap-1">
              <img src={runnerIcon} alt="Server" className="w-4 h-4" />
              <span className="text-white/70 text-xs">DUSTIN H</span>
            </div>
          </div>
        </div>
          
        {/* Seat Buttons - Row 2 */}
        <div className="px-3 py-2 border-b border-white/10">
          <div className="flex items-center gap-1.5">
            <button className="w-6 h-6 bg-neutral-600 rounded flex items-center justify-center hover:bg-neutral-500 transition-colors">
              <img src={chairWhiteIcon} alt="Chair" className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={() => toggleSeatFilter('all')}
              className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${
                seatFilter.includes('all') ? 'bg-white' : 'bg-neutral-600 hover:bg-neutral-500'
              }`}
            >
              <Share2 className={`w-3.5 h-3.5 ${seatFilter.includes('all') ? 'text-black' : 'text-white'}`} />
            </button>
            {Array.from({ length: guestCount }, (_, i) => i + 1).map(seat => (
              <button 
                key={seat} 
                onClick={() => toggleSeatFilter(seat)} 
                className={`w-6 h-6 rounded text-xs font-medium transition-colors ${
                  seatFilter.includes(seat) ? "bg-white text-black" : "bg-neutral-600 text-white hover:bg-neutral-500"
                }`}
              >
                {seat}
              </button>
            ))}
          </div>
        </div>

        {/* Notes - with Autocomplete */}
        <div className="px-3 py-2 border-b border-white/10">
          <OrderNotesAutocomplete
            value={orderNotes}
            onChange={setOrderNotes}
            placeholder="Order notes and Allergies"
            storageKey="dashboard-order-notes"
          />
        </div>

        {/* Order Items */}
        <ScrollArea className="flex-1 px-3 max-h-[300px] md:max-h-none">
          <div className="py-2 space-y-1.5">
            {orderItems
              .filter(item => {
                // If 'all' is selected, show all items
                if (seatFilter.includes('all')) return true;
                // If no filter selected, show all items
                if (seatFilter.length === 0) return true;
                // Show item if any of its seats match the filter
                return item.seats.some(seat => seatFilter.includes(seat));
              })
              .map((item, index) => {
              const itemId = `item-${index}`;
              const itemSeats = item.seats;
              const isAllSeats = itemSeats.length === guestCount;
              
              return (
                <SwipeableCartItem
                  key={item.id}
                  onDelete={() => onDeleteItem(item.id)}
                  onFire={() => onFireItem(item.id)}
                  onNoTax={() => onToggleNoTax(item.id)}
                  isNoTax={item.noTax}
                  isFired={item.isFired}
                  itemOrderType={item.itemOrderType}
                  onOrderTypeChange={(type) => onOrderTypeChange(item.id, type)}
                  isOpen={activeSwipedItemId === itemId}
                  onSwipeStart={() => setActiveSwipedItemId(itemId)}
                >
                  <div 
                    className="p-2 border border-sidebar-border rounded-lg cursor-pointer"
                    style={{ background: 'linear-gradient(180deg, #4D4D4D 0%, #616161 100%)' }}
                  >
                    <div className="flex flex-col">
                      {/* Item header row */}
                      <div className="flex items-start gap-2">
                        <span className="w-6 h-6 rounded bg-neutral-700 border border-neutral-600 text-white text-xs font-medium flex items-center justify-center flex-shrink-0">
                          {item.qty}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-foreground">{item.name}</span>
                            <span className="text-sm font-medium text-foreground ml-2">
                              ${item.price.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Seat indicators */}
                      <div className="flex items-center gap-1 mt-1 ml-8">
                        <img src={chairWhiteIcon} alt="Seat" className="w-3 h-3 opacity-60" />
                        {isAllSeats ? (
                          <Share2 className="w-3 h-3 text-white/60" />
                        ) : (
                          itemSeats.map(seat => (
                            <span key={seat} className="text-white/60 text-xs">{seat}</span>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </SwipeableCartItem>
              );
            })}
          </div>
        </ScrollArea>

        {/* Order Summary - Compact Single Row */}
        <div className="px-3 py-2 border-t border-white/10 flex-shrink-0">
          <div className="text-xs flex items-center justify-between gap-2">
            <span className="text-white">Sub: <span className="font-medium">${subtotal.toFixed(2)}</span></span>
            <span className="text-red-500">Disc: <span className="font-medium">${discount.toFixed(2)}</span></span>
            <span className="text-white">Svc: <span className="font-medium">${serviceCharge.toFixed(2)}</span></span>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="px-3 py-2 border-t border-white/10 flex items-center gap-2">
          <button className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center hover:bg-red-500 transition-colors flex-shrink-0">
            <img src={clearIcon} alt="Clear" className="w-4 h-4 brightness-0 invert" />
          </button>
          <button className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#C9C9C9' }}>
            <img src={saveIcon} alt="Save" className="w-4 h-4 brightness-0" />
          </button>
          <button className="flex-1 h-8 rounded-full flex items-center justify-center gap-1 text-white text-sm font-medium" style={{
            background: "linear-gradient(180deg, #FF9E65 0%, #FF5E00 100%)"
          }}>
            <img src={fireIcon} alt="Fire" className="w-4 h-4 brightness-0 invert" />
            <span>FIRE</span>
          </button>
          <button className="flex-1 h-8 rounded-full text-black text-sm font-bold" style={{
            background: "linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)"
          }}>
            CHARGE ${finalTotal.toFixed(2)}
          </button>
        </div>
      </div>
    </>
  );
};


// Table filter labels (matching /tableorder screen)
const tableFilterLabels = ["All", "Available", "Ordering", "Ordered", "Reserved", "Seated", "Served", "Paid"];

const Dashboard = () => {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState("All");
  const [activeTableFilter, setActiveTableFilter] = useState("All");
  const [selectedOrder, setSelectedOrder] = useState<typeof mockOrders[0] | null>(mockOrders[0]);
  const [dateFilter, setDateFilter] = useState("Today");
  const [compareDate, setCompareDate] = useState("Yesterday");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [seatFilter, setSeatFilter] = useState<(number | 'all')[]>([]);
  const [orderNotes, setOrderNotes] = useState('');
  const [activeSwipedItemId, setActiveSwipedItemId] = useState<string | null>(null);
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>();
  const [isCustomCalendarOpen, setIsCustomCalendarOpen] = useState(false);
  const [compareCustomDateRange, setCompareCustomDateRange] = useState<DateRange | undefined>();
  const [isCompareCustomCalendarOpen, setIsCompareCustomCalendarOpen] = useState(false);
  const [orderItems, setOrderItems] = useState(initialOrderItems);
  const isMobile = useIsMobile();

  // Toggle no tax for an item
  const handleToggleNoTax = (itemId: number) => {
    setOrderItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, noTax: !item.noTax } : item
    ));
  };

  // Update order type for an item
  const handleOrderTypeChange = (itemId: number, orderType: string) => {
    setOrderItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, itemOrderType: orderType } : item
    ));
  };

  // Delete an item from the order
  const handleDeleteItem = (itemId: number) => {
    setOrderItems(prev => prev.filter(item => item.id !== itemId));
  };

  // Toggle fire status for an item
  const handleFireItem = (itemId: number) => {
    setOrderItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, isFired: !item.isFired } : item
    ));
  };

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

  // Get stats based on selected date filter
  const stats = useMemo(() => {
    return statsData[dateFilter] || statsData["Today"];
  }, [dateFilter]);

  const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.qty, 0);
  const total = subtotal;

  const toggleSeatFilter = (seat: number | 'all') => {
    setSeatFilter(prev => prev.includes(seat) ? prev.filter(s => s !== seat) : [...prev, seat]);
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

  // Filter tables based on active table filter
  const filteredTables = useMemo(() => {
    if (activeTableFilter === "All") return mockTables;
    return mockTables.filter(table => table.status === activeTableFilter);
  }, [activeTableFilter]);

  // Calculate counts for each table filter
  const tableFilters = useMemo(() => {
    return tableFilterLabels.map(label => ({
      label,
      count: label === "All" 
        ? mockTables.length 
        : mockTables.filter(table => table.status === label).length
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
            {/* Table Filters */}
            <div className="flex gap-1.5 mb-2 overflow-x-auto scrollbar-hide">
              <button
                className="flex-shrink-0 px-2 py-1 rounded-full text-xs font-medium text-white"
                style={{ background: "#7575754D", boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)" }}
              >
                First Floor <ChevronDown className="w-2.5 h-2.5 inline ml-0.5" />
              </button>
              {tableFilters.map((filter) => (
                <button
                  key={filter.label}
                  onClick={() => setActiveTableFilter(filter.label)}
                  className={`flex-shrink-0 px-2 py-1 rounded-full text-xs font-medium transition-all ${
                    activeTableFilter === filter.label
                      ? "text-black"
                      : "text-white"
                  }`}
                  style={
                    activeTableFilter === filter.label
                      ? { background: "linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)" }
                      : { background: "#7575754D", boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)" }
                  }
                >
                  {filter.label} <span className="font-bold ml-0.5">{filter.count}</span>
                </button>
              ))}
            </div>

            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              {filteredTables.map((table, index) => {
                const statusStyle = tableStatusConfig[table.status] || tableStatusConfig["Available"];
                return (
                  <div
                    key={index}
                    onClick={() => {
                      if (table.status === "Available") {
                        navigate(`/tableorder/${table.id}`);
                      } else {
                        navigate(`/tableorder/${table.id}/details`);
                      }
                    }}
                    className="flex-shrink-0 rounded-xl p-2.5 w-[90px] flex flex-col gap-1.5 cursor-pointer hover:bg-neutral-800 transition-all bg-neutral-900"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-base font-bold">{table.id}</span>
                      <span className="text-[10px] text-white/50">{table.seats}S</span>
                    </div>
                    <div
                      className="text-[10px] font-medium py-1 rounded-md text-center w-full"
                      style={{ 
                        backgroundColor: statusStyle.bgColor,
                        color: statusStyle.textColor
                      }}
                    >
                      {table.status}
                    </div>
                  </div>
                );
              })}
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
            seatFilter={seatFilter}
            toggleSeatFilter={toggleSeatFilter}
            orderNotes={orderNotes}
            setOrderNotes={setOrderNotes}
            activeSwipedItemId={activeSwipedItemId}
            setActiveSwipedItemId={setActiveSwipedItemId}
            onToggleNoTax={handleToggleNoTax}
            onOrderTypeChange={handleOrderTypeChange}
            onDeleteItem={handleDeleteItem}
            onFireItem={handleFireItem}
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
              seatFilter={seatFilter}
              toggleSeatFilter={toggleSeatFilter}
              orderNotes={orderNotes}
              setOrderNotes={setOrderNotes}
              activeSwipedItemId={activeSwipedItemId}
              setActiveSwipedItemId={setActiveSwipedItemId}
              onToggleNoTax={handleToggleNoTax}
              onOrderTypeChange={handleOrderTypeChange}
              onDeleteItem={handleDeleteItem}
              onFireItem={handleFireItem}
            />
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default Dashboard;
