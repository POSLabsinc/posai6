import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Check, ChevronDown, Clock, Calendar as CalendarIcon, X, Users, Share2, Briefcase, Heart, GraduationCap, Shield, Star, Cake, MapPin, BadgeDollarSign, Tag, CreditCard, User, Gift, Link, QrCode, Banknote, Truck, ShoppingBag, Clipboard, ExternalLink, Utensils, UtensilsCrossed, Zap } from "lucide-react";
import ReceiptDialog from "@/components/ReceiptDialog";
import TipDialog from "@/components/TipDialog";
import RefundDialog from "@/components/RefundDialog";
import { PaymentDialog, PaymentDialogOrderDetails, PaymentHistoryItem } from "@/components/PaymentDialog";
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
import runnerIcon from "@/assets/icons/runner.png";
import clearIcon from "@/assets/icons/clear-c.png";
import saveIcon from "@/assets/icons/save.png";
import { OrderNotesAutocomplete } from "@/components/OrderNotesAutocomplete";
import SwipeableCartItem from "@/components/SwipeableCartItem";
import { getDashboardOrders, DashboardOrder, DashboardOrderItem, PaymentMethod, formatTableName } from "@/data/orders";
import receiptIcon from "@/assets/icons/receipt-icon.svg";
import registerIcon from "@/assets/icons/register-icon.svg";

// Helper component for multi-payment display (matching TableOrderDetails)
const MultiPaymentDisplay = ({ paymentMethods, paymentType }: { paymentMethods?: PaymentMethod[], paymentType: string }) => {
  if (!paymentMethods || paymentMethods.length <= 1) {
    return <span className="text-white/60 truncate">{paymentType && paymentType !== '--' ? paymentType : 'Paid'}</span>;
  }

  const primaryMethod = paymentMethods[0];
  const additionalCount = paymentMethods.length - 1;

  const getCardIcon = (type: string) => {
    switch (type) {
      case 'Visa': return <span className="w-5 h-3 rounded-sm bg-white flex items-center justify-center"><span className="text-[8px] font-bold text-blue-600">VISA</span></span>;
      case 'Amex': return <span className="w-5 h-3 rounded-sm bg-blue-500 flex items-center justify-center"><span className="text-[6px] font-bold text-white">AMEX</span></span>;
      case 'Mastercard': return <span className="w-5 h-3 rounded-sm bg-gradient-to-r from-red-500 to-yellow-500 flex items-center justify-center"><span className="text-[6px] font-bold text-white">MC</span></span>;
      case 'Discover': return <span className="w-5 h-3 rounded-sm bg-orange-500 flex items-center justify-center"><span className="text-[6px] font-bold text-white">DISC</span></span>;
      case 'Cash': return <span className="w-5 h-3 rounded-sm bg-green-600 flex items-center justify-center"><span className="text-[6px] font-bold text-white">$</span></span>;
      case 'Gift Card': return <span className="w-5 h-3 rounded-sm bg-purple-500 flex items-center justify-center"><span className="text-[6px] font-bold text-white">GC</span></span>;
      default: return <span className="w-5 h-3 rounded-sm bg-gray-500 flex items-center justify-center"><span className="text-[6px] font-bold text-white">CC</span></span>;
    }
  };

  const formatPrice = (amount: number) => `$${amount.toFixed(2)}`;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button 
          className="flex items-center gap-1 text-white/60 hover:text-white transition-colors cursor-pointer"
          onClick={(e) => e.stopPropagation()}
        >
          <span>{getCardIcon(primaryMethod.type)}</span>
          <span>{primaryMethod.type}</span>
          {primaryMethod.lastFour && <span>•••• {primaryMethod.lastFour}</span>}
          <span className="text-[#8AC4FF]">+{additionalCount} more</span>
        </button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-56 p-3 bg-neutral-800 border border-neutral-700 shadow-xl z-[9999]" 
        side="bottom" 
        align="start"
        sideOffset={8}
      >
        <div className="space-y-1">
          <h4 className="text-white/80 text-xs font-medium mb-2">Payment Methods</h4>
          {paymentMethods.map((method, index) => (
            <div key={index} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span>{getCardIcon(method.type)}</span>
                <span className="text-white">{method.type}</span>
                {method.lastFour && <span className="text-white/60">•••• {method.lastFour}</span>}
              </div>
              <span className="text-white font-medium">{formatPrice(method.amount)}</span>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

// Stats data by date filter
const statsData: Record<string, Array<{
  label: string;
  value: string;
  change: string;
  isUp: boolean;
  icon?: string;
  hasCheckbox?: boolean;
}>> = {
  "Today": [{
    label: "Total Sale",
    value: "$ 1,400.00",
    change: "2.2%",
    isUp: true,
    icon: "$"
  }, {
    label: "Total Tip",
    value: "$ 285.00",
    change: "2.2%",
    isUp: true,
    icon: "$"
  }, {
    label: "Total Hours",
    value: "6h 28min",
    change: "0.5%",
    isUp: false,
    icon: "clock"
  }, {
    label: "Ordering",
    value: "12",
    change: "2.5%",
    isUp: true,
    icon: "clock"
  }, {
    label: "Ready to Served",
    value: "5",
    change: "1%",
    isUp: false,
    hasCheckbox: true
  }, {
    label: "Completed",
    value: "8",
    change: "1%",
    isUp: false,
    icon: "Check"
  }],
  "Yesterday": [{
    label: "Total Sale",
    value: "$ 1,250.00",
    change: "1.8%",
    isUp: false,
    icon: "$"
  }, {
    label: "Total Tip",
    value: "$ 210.00",
    change: "1.5%",
    isUp: false,
    icon: "$"
  }, {
    label: "Total Hours",
    value: "5h 45min",
    change: "1.2%",
    isUp: true,
    icon: "clock"
  }, {
    label: "Ordering",
    value: "9",
    change: "1.0%",
    isUp: false,
    icon: "clock"
  }, {
    label: "Ready to Served",
    value: "3",
    change: "2%",
    isUp: true,
    hasCheckbox: true
  }, {
    label: "Completed",
    value: "6",
    change: "0.5%",
    isUp: true,
    icon: "Check"
  }],
  "This Week": [{
    label: "Total Sale",
    value: "$ 8,750.00",
    change: "5.5%",
    isUp: true,
    icon: "$"
  }, {
    label: "Total Tip",
    value: "$ 1,420.00",
    change: "4.2%",
    isUp: true,
    icon: "$"
  }, {
    label: "Total Hours",
    value: "42h 15min",
    change: "2.1%",
    isUp: true,
    icon: "clock"
  }, {
    label: "Ordering",
    value: "78",
    change: "3.8%",
    isUp: true,
    icon: "clock"
  }, {
    label: "Ready to Served",
    value: "28",
    change: "1.5%",
    isUp: true,
    hasCheckbox: true
  }, {
    label: "Completed",
    value: "45",
    change: "2.2%",
    isUp: true,
    icon: "Check"
  }],
  "Last Week": [{
    label: "Total Sale",
    value: "$ 7,920.00",
    change: "3.2%",
    isUp: false,
    icon: "$"
  }, {
    label: "Total Tip",
    value: "$ 1,180.00",
    change: "2.8%",
    isUp: false,
    icon: "$"
  }, {
    label: "Total Hours",
    value: "38h 30min",
    change: "1.5%",
    isUp: false,
    icon: "clock"
  }, {
    label: "Ordering",
    value: "65",
    change: "2.1%",
    isUp: false,
    icon: "clock"
  }, {
    label: "Ready to Served",
    value: "22",
    change: "0.8%",
    isUp: false,
    hasCheckbox: true
  }, {
    label: "Completed",
    value: "38",
    change: "1.2%",
    isUp: false,
    icon: "Check"
  }],
  "This Month": [{
    label: "Total Sale",
    value: "$ 32,500.00",
    change: "8.5%",
    isUp: true,
    icon: "$"
  }, {
    label: "Total Tip",
    value: "$ 5,200.00",
    change: "6.2%",
    isUp: true,
    icon: "$"
  }, {
    label: "Total Hours",
    value: "168h 45min",
    change: "4.5%",
    isUp: true,
    icon: "clock"
  }, {
    label: "Ordering",
    value: "312",
    change: "5.8%",
    isUp: true,
    icon: "clock"
  }, {
    label: "Ready to Served",
    value: "120",
    change: "3.2%",
    isUp: true,
    hasCheckbox: true
  }, {
    label: "Completed",
    value: "185",
    change: "4.1%",
    isUp: true,
    icon: "Check"
  }],
  "Last Month": [{
    label: "Total Sale",
    value: "$ 28,400.00",
    change: "4.2%",
    isUp: false,
    icon: "$"
  }, {
    label: "Total Tip",
    value: "$ 4,580.00",
    change: "3.5%",
    isUp: false,
    icon: "$"
  }, {
    label: "Total Hours",
    value: "155h 20min",
    change: "2.8%",
    isUp: false,
    icon: "clock"
  }, {
    label: "Ordering",
    value: "275",
    change: "3.2%",
    isUp: false,
    icon: "clock"
  }, {
    label: "Ready to Served",
    value: "98",
    change: "1.8%",
    isUp: false,
    hasCheckbox: true
  }, {
    label: "Completed",
    value: "162",
    change: "2.5%",
    isUp: false,
    icon: "Check"
  }]
};

// Date filter options
const dateFilters = ["Today", "Yesterday", "This Week", "Last Week", "This Month", "Last Month", "Custom"];

// Order filter labels
const orderFilterLabels = ["All", "In Progress", "Unpaid", "Open", "Paid", "Closed"];

// Order item interface - alias for DashboardOrderItem
type OrderItemType = DashboardOrderItem;

// Helper function to calculate order total from items (subtotal + 2% tax + 10% service)
const calculateOrderTotal = (items: OrderItemType[]): number => {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const tax = subtotal * 0.02;
  const serviceCharge = subtotal * 0.1;
  return subtotal + tax + serviceCharge;
};

// Get orders from centralized data store
const mockOrders: DashboardOrder[] = getDashboardOrders();

// Default order items (used as fallback)
const defaultOrderItems: OrderItemType[] = mockOrders[0]?.items || [];

// Table status configurations (matching /tableorder screen)
const tableStatusConfig: Record<string, {
  textColor: string;
  bgColor: string;
}> = {
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
  "Paid": { textColor: "#000000", bgColor: "#34D399" }
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
  { id: "T15", seats: 2, status: "Ordering" }
];

// Discount types data
interface DiscountType {
  id: string;
  name: string;
  description: string;
  percentage?: number;
  fixedAmount?: number;
  icon: 'briefcase' | 'heart' | 'graduation' | 'shield' | 'star' | 'clock' | 'cake' | 'mappin' | 'dollar' | 'tag';
}

const discountTypes: DiscountType[] = [
  { id: 'employee', name: 'Employee Discount', description: '20% off', percentage: 20, icon: 'briefcase' },
  { id: 'senior', name: 'Senior Citizen', description: '15% off', percentage: 15, icon: 'heart' },
  { id: 'student', name: 'Student Discount', description: '10% off', percentage: 10, icon: 'graduation' },
  { id: 'military', name: 'Military Discount', description: '15% off', percentage: 15, icon: 'shield' },
  { id: 'loyalty', name: 'Loyalty Member', description: '5% off', percentage: 5, icon: 'star' },
  { id: 'happy', name: 'Happy Hour', description: '25% off', percentage: 25, icon: 'clock' },
  { id: 'birthday', name: 'Birthday Special', description: '30% off', percentage: 30, icon: 'cake' },
  { id: 'first', name: 'First Visit', description: '10% off', percentage: 10, icon: 'mappin' },
  { id: 'comp5', name: 'Manager Comp $5', description: '$5.00 off', fixedAmount: 5, icon: 'dollar' },
  { id: 'comp10', name: 'Manager Comp $10', description: '$10.00 off', fixedAmount: 10, icon: 'dollar' },
  { id: 'comp15', name: 'Manager Comp $15', description: '$15.00 off', fixedAmount: 15, icon: 'dollar' },
  { id: 'promo', name: 'Promo Code Discount', description: '20% off', percentage: 20, icon: 'tag' }
];

// Simplified Order Panel Content Component Props (payment handled by PaymentDialog)
interface OrderPanelContentProps {
  selectedOrder: typeof mockOrders[0] | null;
  orderItems: OrderItemType[];
  subtotal: number;
  total: number;
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
  showDiscountDialog: boolean;
  setShowDiscountDialog: (show: boolean) => void;
  selectedDiscountId: string | null;
  setSelectedDiscountId: (id: string | null) => void;
  onChargeClick: () => void;
  // Tip and Refund props for paid orders
  showTipDialog: boolean;
  setShowTipDialog: (show: boolean) => void;
  showRefundMode: boolean;
  setShowRefundMode: (show: boolean) => void;
  showRefundDialog: boolean;
  setShowRefundDialog: (show: boolean) => void;
}

const OrderPanelContent = ({
  selectedOrder,
  orderItems,
  subtotal,
  total,
  seatFilter,
  toggleSeatFilter,
  orderNotes,
  setOrderNotes,
  activeSwipedItemId,
  setActiveSwipedItemId,
  onToggleNoTax,
  onOrderTypeChange,
  onDeleteItem,
  onFireItem,
  showDiscountDialog,
  setShowDiscountDialog,
  selectedDiscountId,
  setSelectedDiscountId,
  onChargeClick,
  showTipDialog,
  setShowTipDialog,
  showRefundMode,
  setShowRefundMode,
  showRefundDialog,
  setShowRefundDialog
}: OrderPanelContentProps) => {
  const selectedDiscount = discountTypes.find(d => d.id === selectedDiscountId);
  const discount = selectedDiscount ? selectedDiscount.fixedAmount || subtotal * ((selectedDiscount.percentage || 0) / 100) : 0;
  const tax = subtotal * 0.02;
  const serviceCharge = subtotal * 0.1;
  const tip = selectedOrder?.tip ? parseFloat(selectedOrder.tip.replace('$', '')) || 0 : 0;
  const finalTotal = subtotal - discount + tax + serviceCharge + tip;
  const guestCount = selectedOrder?.seats || 4;
  const isOrderDisabled = selectedOrder && ['Completed', 'Paid', 'Closed'].includes(selectedOrder.status);

  return (
    <>
      {/* Guest Header - Outside the box */}
      <div className="px-2 py-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-white font-medium flex-1">{selectedOrder?.guest || "GUEST NAME"}</span>
          <div className="flex items-center gap-1 text-white/50 text-[10px] flex-1 justify-center whitespace-nowrap">
            <img src={phoneIcon} alt="phone" className="w-3 h-3 opacity-60" />
            <span>{selectedOrder?.phone || "(XXX) XXX-XXXX"}</span>
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
          {!isOrderDisabled && (
            <button 
              className="px-3 py-1.5 text-xs rounded-full transition-colors bg-neutral-700 text-white hover:bg-neutral-600" 
              onClick={() => setShowDiscountDialog(true)}
            >
              Discount
            </button>
          )}
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
                TABLE {selectedOrder?.table || "T1"}
              </span>
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3 text-white/60" />
                <span className="text-white/60 text-xs">{guestCount}</span>
              </div>
              <span className="text-white font-bold text-sm">{selectedOrder?.id || "—"}</span>
            </div>
            <div className="flex items-center gap-1">
              <img src={runnerIcon} alt="Server" className="w-4 h-4" />
              <span className="text-white/70 text-xs">{selectedOrder?.server?.toUpperCase() || "SERVER"}</span>
            </div>
          </div>
        </div>
          
        {/* Seat Buttons - Row 2 */}
        <div className="px-3 py-2 border-b border-white/10">
          <div className="flex gap-1.5">
            <button className="w-6 h-6 bg-neutral-600 rounded flex items-center justify-center hover:bg-neutral-500 transition-colors">
              <img src={chairWhiteIcon} alt="Chair" className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={() => toggleSeatFilter('all')} 
              className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${seatFilter.includes('all') ? 'bg-white' : 'bg-neutral-600 hover:bg-neutral-500'}`}
            >
              <Share2 className={`w-3.5 h-3.5 ${seatFilter.includes('all') ? 'text-black' : 'text-white'}`} />
            </button>
            {Array.from({ length: guestCount }, (_, i) => i + 1).map(seat => (
              <button 
                key={seat} 
                onClick={() => toggleSeatFilter(seat)} 
                className={`w-6 h-6 rounded text-xs font-medium transition-colors ${seatFilter.includes(seat) ? "bg-white text-black" : "bg-neutral-600 text-white hover:bg-neutral-500"}`}
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
            {orderItems.filter(item => {
              if (seatFilter.includes('all')) return true;
              if (seatFilter.length === 0) return true;
              return item.seats.some(seat => seatFilter.includes(seat));
            }).map((item, index) => {
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
                  onOrderTypeChange={type => onOrderTypeChange(item.id, type)} 
                  isOpen={activeSwipedItemId === itemId} 
                  onSwipeStart={() => setActiveSwipedItemId(itemId)}
                >
                  <div 
                    className="p-2 border border-sidebar-border rounded-lg cursor-pointer" 
                    style={{ background: 'linear-gradient(180deg, #4D4D4D 0%, #616161 100%)' }}
                  >
                    <div className="flex flex-col">
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
                      <div className="flex items-center gap-1.5 mt-1.5 ml-8">
                        <img src={chairWhiteIcon} alt="Seat" className="w-4 h-4 opacity-70" />
                        {isAllSeats ? (
                          <span className="w-5 h-5 rounded bg-neutral-700 text-white flex items-center justify-center">
                            <Share2 className="w-3 h-3" />
                          </span>
                        ) : (
                          itemSeats.map(seat => (
                            <span key={seat} className="w-5 h-5 rounded bg-neutral-700 text-white text-[10px] font-medium flex items-center justify-center">
                              {seat}
                            </span>
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

        {/* Order Summary - Glass Effect */}
        <div className="p-2 border-t border-white/10 flex-shrink-0">
          <div 
            className="text-xs rounded px-2 py-1.5 space-y-0.5" 
            style={{
              background: '#7575754D',
              boxShadow: 'inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)'
            }}
          >
            <div className="flex justify-between gap-3">
              <span className="text-foreground">Sub Total: <span className="font-medium">${subtotal.toFixed(2)}</span></span>
              <span className="text-white">Discount: <span className="font-medium">${discount.toFixed(2)}</span></span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-foreground">Service Charge: <span className="font-medium text-primary">+${serviceCharge.toFixed(2)}</span></span>
              <span className="text-foreground">Tax: <span className="font-medium">${tax.toFixed(2)}</span></span>
            </div>
          </div>
        </div>

        {/* Bottom Actions - Conditional based on order status */}
        <div className="px-3 py-2 border-t border-white/10 flex items-center gap-2">
          {selectedOrder?.isPaid || selectedOrder?.status === "Completed" ? (
            <>
              {showRefundMode ? (
                <button 
                  onClick={() => setShowRefundDialog(true)}
                  className="flex-1 h-10 rounded-full flex items-center justify-center" 
                  style={{ background: 'linear-gradient(180deg, #DC2626 0%, #991B1B 100%)' }}
                >
                  <span className="text-white font-semibold text-sm">REFUND</span>
                </button>
              ) : (
                <>
                  <button 
                    onClick={() => setShowTipDialog(true)}
                    className="flex-1 h-10 rounded-full flex items-center justify-center border border-white/20"
                    style={{ background: '#1B1C20' }}
                  >
                    <span className="text-white font-semibold text-sm">ADD TIP</span>
                  </button>
                  <button 
                    onClick={() => setShowRefundMode(true)}
                    className="flex-1 h-10 rounded-full flex items-center justify-center" 
                    style={{ background: 'linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)' }}
                  >
                    <span className="text-black font-semibold text-sm">CLOSE</span>
                  </button>
                </>
              )}
            </>
          ) : (
            <>
              <button className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center hover:bg-red-500 transition-colors flex-shrink-0">
                <img src={clearIcon} alt="Clear" className="w-4 h-4 brightness-0 invert" />
              </button>
              <button 
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" 
                style={{ background: '#C9C9C9' }}
              >
                <img src={saveIcon} alt="Save" className="w-4 h-4 brightness-0" />
              </button>
              <button 
                className="flex-1 h-8 rounded-full flex items-center justify-center gap-1 text-white text-sm font-medium" 
                style={{ background: "linear-gradient(180deg, #FF9E65 0%, #FF5E00 100%)" }}
              >
                <img src={fireIcon} alt="Fire" className="w-4 h-4 brightness-0 invert" />
                <span>FIRE</span>
              </button>
              <button 
                onClick={onChargeClick}
                className="flex-1 h-8 rounded-full text-black text-sm font-bold" 
                style={{ background: "linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)" }}
              >
                CHARGE ${finalTotal.toFixed(2)}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Discount Dialog */}
      {showDiscountDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-neutral-900 rounded-xl border border-neutral-700 w-[90%] max-w-md mx-4 overflow-hidden animate-scale-in">
            <div className="flex items-center justify-between p-4 border-b border-neutral-700">
              <h2 className="text-white text-lg font-semibold">Select Discount</h2>
              <button 
                onClick={() => setShowDiscountDialog(false)} 
                className="w-8 h-8 rounded-full hover:bg-neutral-700 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-neutral-400" />
              </button>
            </div>
            <div className="p-2 max-h-[400px] overflow-y-auto scrollbar-hide space-y-1">
              {discountTypes.map(discountType => {
                const discountValue = discountType.fixedAmount || subtotal * ((discountType.percentage || 0) / 100);
                const isSelected = selectedDiscountId === discountType.id;
                const IconComponent = {
                  briefcase: Briefcase,
                  heart: Heart,
                  graduation: GraduationCap,
                  shield: Shield,
                  star: Star,
                  clock: Clock,
                  cake: Cake,
                  mappin: MapPin,
                  dollar: BadgeDollarSign,
                  tag: Tag
                }[discountType.icon];
                return (
                  <button 
                    key={discountType.id} 
                    onClick={() => setSelectedDiscountId(isSelected ? null : discountType.id)} 
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${isSelected ? 'bg-orange-500/20 border border-orange-500' : 'bg-neutral-800 border border-transparent hover:bg-neutral-700'}`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isSelected ? 'bg-orange-500/30' : 'bg-neutral-700'}`}>
                      {IconComponent && <IconComponent className="w-4 h-4 text-neutral-400" />}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="text-white text-sm font-medium">{discountType.name}</div>
                      <div className="text-neutral-400 text-xs">{discountType.description}</div>
                    </div>
                    <div className="text-red-400 text-sm font-medium">
                      -${discountValue.toFixed(2)}
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="p-3 border-t border-neutral-700">
              <button 
                onClick={() => setShowDiscountDialog(false)} 
                className="w-full py-2.5 bg-white hover:bg-neutral-100 text-black font-semibold rounded-lg transition-colors text-sm"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Table filter labels (matching /tableorder screen)
const tableFilterLabels = ["All", "Available", "Ordering", "Ordered", "Reserved", "Seated", "Served", "Paid"];

const Dashboard = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  // Core state
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
  const [orderItems, setOrderItems] = useState<OrderItemType[]>(mockOrders[0]?.items || []);
  const [selectedFloor, setSelectedFloor] = useState("first");
  const [showDiscountDialog, setShowDiscountDialog] = useState(false);
  const [selectedDiscountId, setSelectedDiscountId] = useState<string | null>(null);
  
  // Payment Dialog state (using shared component)
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  
  // Table card selection state
  const [selectedTableCard, setSelectedTableCard] = useState<string | null>(null);
  const [guestDropdownTableCard, setGuestDropdownTableCard] = useState<string | null>(null);
  
  // Receipt dialog state
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  const [receiptOrder, setReceiptOrder] = useState<DashboardOrder | null>(null);
  
  // Tip and Refund state for paid orders
  const [showTipDialog, setShowTipDialog] = useState(false);
  const [showRefundMode, setShowRefundMode] = useState(false);
  const [showRefundDialog, setShowRefundDialog] = useState(false);

  // Reset refund mode when selected order changes
  useEffect(() => {
    setShowRefundMode(false);
  }, [selectedOrder?.id]);

  // Order item handlers
  const handleToggleNoTax = (itemId: number) => {
    setOrderItems(prev => prev.map(item => item.id === itemId ? { ...item, noTax: !item.noTax } : item));
  };

  const handleOrderTypeChange = (itemId: number, orderType: string) => {
    setOrderItems(prev => prev.map(item => item.id === itemId ? { ...item, itemOrderType: orderType } : item));
  };

  const handleDeleteItem = (itemId: number) => {
    setOrderItems(prev => prev.filter(item => item.id !== itemId));
  };

  const handleFireItem = (itemId: number) => {
    setOrderItems(prev => prev.map(item => item.id === itemId ? { ...item, isFired: !item.isFired } : item));
  };

  // Table card click handler
  const handleTableCardClick = (table: typeof mockTables[0]) => {
    if (table.status === "Available") {
      setGuestDropdownTableCard(guestDropdownTableCard === table.id ? null : table.id);
    } else {
      navigate(`/tableorder/${table.id}`);
    }
  };

  // Guest selection handler for table cards
  const handleGuestSelectCard = (tableId: string, seats: number, guestCount: number) => {
    setGuestDropdownTableCard(null);
    setSelectedTableCard(tableId);
    navigate(`/orders?tableId=${tableId}&seats=${seats}&guests=${guestCount}`);
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
      count: label === "All" ? mockOrders.length : mockOrders.filter(order => order.filterCategory === label).length
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
      count: label === "All" ? mockTables.length : mockTables.filter(table => table.status === label).length
    }));
  }, []);

  const handleOrderClick = (order: typeof mockOrders[0]) => {
    setSelectedOrder(order);
    setOrderItems(order.items || []);
    setOrderNotes(order.notes || '');
    setSeatFilter([]);
    if (isMobile) {
      setIsDrawerOpen(true);
    }
  };

  // Prepare order details for PaymentDialog
  const selectedDiscount = discountTypes.find(d => d.id === selectedDiscountId);
  const discount = selectedDiscount ? selectedDiscount.fixedAmount || subtotal * ((selectedDiscount.percentage || 0) / 100) : 0;
  const tax = subtotal * 0.02;
  const serviceCharge = subtotal * 0.1;
  const tip = selectedOrder?.tip ? parseFloat(selectedOrder.tip.replace('$', '')) || 0 : 0;
  const finalTotal = subtotal - discount + tax + serviceCharge + tip;

  const paymentOrderDetails: PaymentDialogOrderDetails = {
    guest: selectedOrder?.guest || "Guest",
    phone: selectedOrder?.phone,
    table: selectedOrder?.table,
    check: selectedOrder?.check || selectedOrder?.id,
    partySize: selectedOrder?.seats || 4,
    orderType: "DINE IN",
    orderNumber: selectedOrder?.id,
    serverName: selectedOrder?.server,
    orderTime: selectedOrder?.arrivedAt,
    items: orderItems.map(item => ({
      id: item.id,
      name: item.name,
      price: item.price,
      qty: item.qty,
      assignedSeats: item.seats,
      isShared: item.seats.length === (selectedOrder?.seats || 4),
    })),
  };

  return (
    <div className="h-full flex flex-col bg-black text-white overflow-hidden px-3 pt-2 pb-3 gap-3">
      {/* ROW 1: Date Filters (Vertical) + Stats/Insights */}
      <div className="flex gap-3 flex-shrink-0 items-stretch">
        {/* Date Filters - Vertical */}
        <div className="flex flex-col gap-2 p-3 rounded-xl items-center justify-center" style={{
          background: "#7575754D",
          boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)"
        }}>
          {/* Main Date Filter */}
          {dateFilter === "Custom" ? (
            <Popover open={isCustomCalendarOpen} onOpenChange={setIsCustomCalendarOpen}>
              <PopoverTrigger asChild>
                <button className="h-7 px-2 border-0 text-xs text-white w-[90px] rounded-md flex items-center justify-between gap-1" style={{ background: "#5555554D" }}>
                  <CalendarIcon className="w-3 h-3" />
                  <span className="truncate">{getDateFilterDisplay()}</span>
                  <X className="w-3 h-3 hover:text-red-400" onClick={e => {
                    e.stopPropagation();
                    setDateFilter("Today");
                    setCustomDateRange(undefined);
                  }} />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-neutral-800 border-neutral-700" align="start">
                <Calendar 
                  mode="range" 
                  selected={customDateRange} 
                  onSelect={range => {
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
              <SelectTrigger className="h-7 px-2 border-0 text-xs text-white w-[90px]" style={{ background: "#5555554D" }}>
                <SelectValue>{dateFilter}</SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-neutral-800 border-neutral-700">
                {dateFilters.map(filter => (
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
                <button className="h-7 px-2 border-0 text-xs text-white w-[90px] rounded-md flex items-center justify-between gap-1" style={{ background: "#5555554D" }}>
                  <CalendarIcon className="w-3 h-3" />
                  <span className="truncate">{getCompareDateDisplay()}</span>
                  <X className="w-3 h-3 hover:text-red-400" onClick={e => {
                    e.stopPropagation();
                    setCompareDate("Yesterday");
                    setCompareCustomDateRange(undefined);
                  }} />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-neutral-800 border-neutral-700" align="start">
                <Calendar 
                  mode="range" 
                  selected={compareCustomDateRange} 
                  onSelect={range => {
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
              <SelectTrigger className="h-7 px-2 border-0 text-xs text-white w-[90px]" style={{ background: "#5555554D" }}>
                <SelectValue>{compareDate}</SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-neutral-800 border-neutral-700">
                {dateFilters.map(filter => (
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
              style={{
                background: "#7575754D",
                boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)"
              }}
            >
              <div className="flex items-center gap-2 text-xs text-white/60 mb-2">
                {stat.hasCheckbox ? (
                  <div className="w-4 h-4 rounded border border-white/40 flex items-center justify-center">
                    <Check className="w-3 h-3" />
                  </div>
                ) : stat.icon === "clock" ? (
                  <Clock className="w-4 h-4 text-white/60" />
                ) : stat.icon === "Check" ? (
                  <Check className="w-4 h-4 text-white/60" />
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
            {orderFilters.map(filter => (
              <button 
                key={filter.label} 
                onClick={() => setActiveFilter(filter.label)} 
                className={`flex-shrink-0 px-2 py-1 rounded-full text-xs font-medium transition-all ${activeFilter === filter.label ? "text-black" : "text-white"}`} 
                style={activeFilter === filter.label ? {
                  background: "linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)"
                } : {
                  background: "#7575754D",
                  boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)"
                }}
              >
                {filter.label} <span className="font-bold ml-0.5">{filter.count}</span>
              </button>
            ))}
          </div>

          {/* Orders List with Scroll */}
          <ScrollArea className="flex-1 min-h-0">
            <div className="space-y-2 pr-2">
              {filteredOrders.map(order => (
                <div 
                  key={order.id} 
                  onClick={() => handleOrderClick(order)} 
                  className={`rounded-xl cursor-pointer transition-all overflow-hidden border ${selectedOrder?.id === order.id ? "border-white" : "border-neutral-700 hover:border-neutral-600"}`} 
                  style={{ backgroundColor: "#1B1C20" }}
                >
                  {/* Mobile Layout */}
                  <div className="flex items-stretch w-full md:hidden p-3">
                    <div className="flex-shrink-0 px-2 py-2 flex items-center">
                      <div className="relative w-10 h-12 bg-neutral-800 rounded-lg flex flex-col items-center justify-center border border-neutral-600">
                        <span className="text-lg font-bold text-white">{order.id}</span>
                        <span className="text-[9px] text-gray-500">000</span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 py-2 pr-2">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <span className="text-white font-medium text-sm">{order.guest} · {formatTableName(order.table)}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm" style={{ color: '#B5B6BB' }}>{order.server}</span>
                            <span className="text-sm font-medium" style={{ color: order.statusColor }}>
                              {order.status === 'Completed' ? 'PAID' : order.status}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 text-xs" style={{ color: '#B5B6BB' }}>
                            <img src={dineInIcon} alt="Dine In" className="w-3 h-3 object-contain opacity-60" />
                            <span>Party of {order.seats}, {order.arrivedAt}</span>
                            <span className="text-gray-500">|</span>
                            <span>{order.timer}</span>
                          </div>
                          <span className="text-white font-semibold text-sm">${calculateOrderTotal(order.items).toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm" style={{ color: '#B5B6BB' }}>{order.revenueCenter}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm" style={{ color: '#B5B6BB' }}>
                              {order.isPaid ? "Paid" : "Pending Payment"}
                            </span>
                            <span className="text-white text-sm">{order.tip}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tablet/Desktop Layout */}
                  <div className="hidden md:flex items-stretch">
                    <div className="flex-1 flex items-stretch gap-3 p-3">
                      <div className="flex-shrink-0 flex flex-col items-center justify-center w-14 rounded-lg border border-white/20 py-2 gap-1" style={{ background: '#1A1A1A' }}>
                        <span className="text-lg font-bold text-white">{order.id}</span>
                        <span className="text-xs text-white/40">000</span>
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                        <div className="flex items-center text-xs lg:text-sm">
                          <div className="w-[45%] text-left">
                            <span className="text-white font-medium truncate">{order.guest} · {formatTableName(order.table)}</span>
                          </div>
                          <div className="w-[35%] text-left pl-4">
                            <span className="text-white/60 truncate">{order.server}</span>
                          </div>
                          <div className="w-[20%] text-right">
                            <span className="font-semibold uppercase" style={{ color: order.statusColor }}>
                              {order.status === 'Completed' ? 'PAID' : order.status}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center text-xs lg:text-sm">
                          <div className="w-[45%] text-left flex items-center gap-1 text-white/60 whitespace-nowrap">
                            <img src={dineInIcon} alt="Dine In" className="w-4 h-4 object-contain opacity-60" />
                            <span className="truncate">Party of {order.seats}, {order.arrivedAt}</span>
                            <span className="text-white/40 mx-1">|</span>
                            <span>{order.timer}</span>
                          </div>
                          <div className="w-[35%] text-left pl-4">
                            <span className="text-white font-semibold">${calculateOrderTotal(order.items).toFixed(2)}</span>
                          </div>
                          <div className="w-[20%] text-right">
                            <span className="text-white">{order.tip}</span>
                          </div>
                        </div>
                        <div className="flex items-center text-xs lg:text-sm">
                          <div className="w-[45%] text-left">
                            <span className="text-white/60">{order.revenueCenter}</span>
                          </div>
                          <div className="w-[35%] text-left pl-4">
                            {order.isPaid || order.status === "Completed" ? (
                              <MultiPaymentDisplay paymentMethods={order.paymentMethods} paymentType={order.paymentType} />
                            ) : (
                              <span className="text-white/60">Pending Payment</span>
                            )}
                          </div>
                          <div className="w-[20%] text-right">
                            <span className="text-white">{order.tip}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    {order.isPaid || order.status === "Completed" ? (
                      <div className="flex-shrink-0 flex flex-col w-10 rounded-r-xl overflow-hidden">
                        <button 
                          className="flex-1 flex items-center justify-center hover:opacity-80 transition-opacity bg-neutral-700 hover:bg-neutral-600 rounded-tr-xl"
                          onClick={(e) => {
                            e.stopPropagation();
                            setReceiptOrder(order);
                            setShowReceiptDialog(true);
                          }}
                        >
                          <img src={receiptIcon} alt="Receipt" className="w-4 h-4 object-contain" />
                        </button>
                        <button 
                          className="flex-1 flex items-center justify-center hover:opacity-80 transition-opacity bg-neutral-600 hover:bg-neutral-500 rounded-br-xl"
                          onClick={(e) => { e.stopPropagation(); }}
                        >
                          <img src={registerIcon} alt="Register" className="w-4 h-4 object-contain" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex-shrink-0 flex flex-col w-10 rounded-r-xl overflow-hidden">
                        <button 
                          className="flex-1 flex items-center justify-center hover:opacity-80 transition-opacity rounded-tr-xl"
                          style={{ background: 'linear-gradient(180deg, #FF9E65 0%, #FF5E00 100%)' }}
                          onClick={e => {
                            e.stopPropagation();
                            navigate(`/tableorder/${order.table}/merge?orderId=${order.id}`);
                          }}
                        >
                          <img src={arrowRightIcon} alt="Merge" className="w-4 h-4 object-contain" />
                        </button>
                        <button 
                          className="flex-1 flex items-center justify-center hover:opacity-80 transition-opacity rounded-br-xl"
                          style={{ background: 'linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)' }}
                          onClick={e => {
                            e.stopPropagation();
                            navigate(`/tableorder/${order.table}/transfer?orderId=${order.id}`);
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
            <div className="flex gap-1.5 mb-2 overflow-x-auto scrollbar-hide">
              <Select value={selectedFloor} onValueChange={setSelectedFloor}>
                <SelectTrigger className="flex-shrink-0 h-auto px-2 py-1 rounded-full text-xs font-medium text-white border-0 w-auto gap-1" style={{
                  background: "#7575754D",
                  boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)"
                }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-neutral-800 border-white/10">
                  <SelectItem value="first" className="text-white text-xs hover:bg-white/10 focus:bg-white/10 focus:text-white">First Floor</SelectItem>
                  <SelectItem value="second" className="text-white text-xs hover:bg-white/10 focus:bg-white/10 focus:text-white">Second Floor</SelectItem>
                  <SelectItem value="outdoor" className="text-white text-xs hover:bg-white/10 focus:bg-white/10 focus:text-white">Outdoor Patio</SelectItem>
                  <SelectItem value="rooftop" className="text-white text-xs hover:bg-white/10 focus:bg-white/10 focus:text-white">Rooftop Bar</SelectItem>
                </SelectContent>
              </Select>
              {tableFilters.map(filter => (
                <button 
                  key={filter.label} 
                  onClick={() => setActiveTableFilter(filter.label)} 
                  className={`flex-shrink-0 px-2 py-1 rounded-full text-xs font-medium transition-all ${activeTableFilter === filter.label ? "text-black" : "text-white"}`} 
                  style={activeTableFilter === filter.label ? {
                    background: "linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)"
                  } : {
                    background: "#7575754D",
                    boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)"
                  }}
                >
                  {filter.label} <span className="font-bold ml-0.5">{filter.count}</span>
                </button>
              ))}
            </div>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              {filteredTables.map((table, index) => {
                const statusStyle = tableStatusConfig[table.status] || tableStatusConfig["Available"];
                const isGuestDropdownOpen = guestDropdownTableCard === table.id && table.status === "Available";
                return (
                  <div 
                    key={index} 
                    onClick={() => handleTableCardClick(table)} 
                    className={`flex-shrink-0 rounded-xl p-2.5 w-[90px] flex flex-col gap-1.5 cursor-pointer hover:bg-neutral-800 transition-all bg-neutral-900 border-2 ${selectedTableCard === table.id ? "border-orange-500" : "border-transparent"}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-base font-bold">{table.id}</span>
                      <span className="text-[10px] text-white/50">{table.seats}S</span>
                    </div>
                    {isGuestDropdownOpen ? (
                      <div className="flex gap-1 overflow-x-auto scrollbar-hide">
                        {Array.from({ length: table.seats }).map((_, i) => (
                          <button 
                            key={i} 
                            onClick={e => {
                              e.stopPropagation();
                              handleGuestSelectCard(table.id, table.seats, i + 1);
                            }} 
                            className="w-5 h-5 flex-shrink-0 flex items-center justify-center text-xs font-bold text-white bg-neutral-600 rounded hover:bg-orange-500 transition-colors"
                          >
                            {i + 1}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div 
                        className="text-[10px] font-medium py-1 rounded-md text-center w-full" 
                        style={{
                          backgroundColor: statusStyle.bgColor,
                          color: statusStyle.textColor
                        }}
                      >
                        {table.status}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Order Panel - Full height */}
        <div className="hidden md:flex w-[240px] lg:w-[345px] flex-shrink-0 rounded-xl flex-col" style={{
          background: "#7575754D",
          boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)"
        }}>
          <OrderPanelContent 
            selectedOrder={selectedOrder} 
            orderItems={orderItems} 
            subtotal={subtotal} 
            total={total} 
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
            showDiscountDialog={showDiscountDialog} 
            setShowDiscountDialog={setShowDiscountDialog} 
            selectedDiscountId={selectedDiscountId} 
            setSelectedDiscountId={setSelectedDiscountId}
            onChargeClick={() => setShowPaymentDialog(true)}
            showTipDialog={showTipDialog} 
            setShowTipDialog={setShowTipDialog} 
            showRefundMode={showRefundMode} 
            setShowRefundMode={setShowRefundMode} 
            showRefundDialog={showRefundDialog} 
            setShowRefundDialog={setShowRefundDialog} 
          />
        </div>
      </div>

      {/* Mobile Drawer for Order Panel */}
      <Drawer open={isDrawerOpen && isMobile} onOpenChange={setIsDrawerOpen}>
        <DrawerContent hideHandle className="bg-neutral-900 border-none !inset-0 !h-[100dvh] !rounded-none !max-h-none !mt-0">
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
              showDiscountDialog={showDiscountDialog} 
              setShowDiscountDialog={setShowDiscountDialog} 
              selectedDiscountId={selectedDiscountId} 
              setSelectedDiscountId={setSelectedDiscountId}
              onChargeClick={() => setShowPaymentDialog(true)}
              showTipDialog={showTipDialog} 
              setShowTipDialog={setShowTipDialog} 
              showRefundMode={showRefundMode} 
              setShowRefundMode={setShowRefundMode} 
              showRefundDialog={showRefundDialog} 
              setShowRefundDialog={setShowRefundDialog} 
            />
          </div>
        </DrawerContent>
      </Drawer>

      {/* Payment Dialog - Using shared component */}
      <PaymentDialog
        open={showPaymentDialog}
        onOpenChange={setShowPaymentDialog}
        orderDetails={paymentOrderDetails}
        subtotal={subtotal - discount}
        tax={tax + serviceCharge}
        total={finalTotal}
        onPaymentComplete={(paymentHistory) => {
          console.log("Payment completed:", paymentHistory);
          setShowPaymentDialog(false);
        }}
        onSaveSplit={(config) => {
          console.log("Split saved:", config);
        }}
      />

      {/* Receipt Dialog */}
      <ReceiptDialog
        open={showReceiptDialog}
        onOpenChange={setShowReceiptDialog}
        orderTotal={receiptOrder?.total || 0}
        orderId={receiptOrder?.id?.toString()}
      />

      {/* Tip Dialog */}
      <TipDialog
        open={showTipDialog}
        onOpenChange={setShowTipDialog}
        orderTotal={selectedOrder?.total || 0}
        onTipSelected={(tip) => {
          console.log("Tip selected:", tip);
        }}
      />

      {/* Refund Dialog */}
      <RefundDialog
        open={showRefundDialog}
        onOpenChange={setShowRefundDialog}
        orderTotal={selectedOrder?.total || 0}
        tipAmount={selectedOrder?.tip ? parseFloat(selectedOrder.tip.replace('$', '')) : 0}
        orderId={selectedOrder?.id?.toString()}
        guestName={selectedOrder?.guest}
        orderItems={selectedOrder?.items?.map(item => ({
          name: item.name,
          price: item.price,
          qty: item.qty,
          modifiers: []
        }))}
        onRefundComplete={(amount, reason) => {
          console.log("Refund completed:", amount, reason);
        }}
      />
    </div>
  );
};

export default Dashboard;
