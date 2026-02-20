import { useState } from "react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Phone, Users, Share2 } from "lucide-react";
import { OrderNotesAutocomplete } from "@/components/OrderNotesAutocomplete";
import OrderSummary from "@/components/OrderSummary";
import { calculateTotalsFromPriceStrings, formatPrice } from "@/lib/orderUtils";

// Import icons
import seatIcon from "@/assets/icons/seat-icon.png";
import splitIcon from "@/assets/icons/split-icon.png";
import shareSeatsIcon from "@/assets/icons/share-seats.png";
import clearIcon from "@/assets/icons/clear-c.png";
import fireIcon from "@/assets/icons/fire.png";
import runnerIcon from "@/assets/icons/runner.png";
import chairWhiteIcon from "@/assets/icons/chair-white.png";
import saveIcon from "@/assets/icons/save.png";
import linkMergeIcon from "@/assets/icons/link-merge.png";

interface OrderItem {
  qty: number;
  name: string;
  price: string;
  seats: number[];
  modifiers: string[];
}

interface MergedOrder {
  id: string;
  table: string;
  partySize: number;
  time: string;
  notes: string;
  items: OrderItem[];
}

interface MergedOrderPanelProps {
  guestName: string;
  phone: string;
  time: string;
  server: string;
  tableId: string;
  mergedOrderIds: string[];
  orders: MergedOrder[];
  width?: string;
  onReceiptClick?: () => void;
  onRegisterClick?: () => void;
}

const MergedOrderPanel = ({
  guestName,
  phone,
  time,
  server,
  tableId,
  mergedOrderIds,
  orders,
  width = "w-[345px]",
  onReceiptClick,
  onRegisterClick
}: MergedOrderPanelProps) => {
  const [selectedSeats, setSelectedSeats] = useState<number[]>([1, 2, 3, 4]);
  const [seatFilter, setSeatFilter] = useState<(number | 'all')[]>(['all']);
  const [orderNotes, setOrderNotes] = useState("");
  const [orderFilter, setOrderFilter] = useState<string | 'all'>('all');

  const toggleOrderFilter = (orderId: string | 'all') => {
    setOrderFilter(orderId);
  };

  const toggleSeatFilter = (seat: number | 'all') => {
    if (seat === 'all') {
      setSeatFilter(['all']);
    } else {
      setSeatFilter(prev => {
        const withoutAll = prev.filter(s => s !== 'all');
        if (withoutAll.includes(seat)) {
          const newFilter = withoutAll.filter(s => s !== seat);
          return newFilter.length === 0 ? ['all'] : newFilter;
        }
        return [...withoutAll, seat];
      });
    }
  };

  // Filter orders based on orderFilter
  const filteredOrders = orderFilter === 'all' 
    ? orders 
    : orders.filter(order => order.id === orderFilter);

  // Calculate totals based on filtered orders using centralized logic
  const allItems = filteredOrders.flatMap(order => order.items);
  const totals = calculateTotalsFromPriceStrings(allItems);

  // Get max seats across all orders
  const maxSeats = Math.max(...orders.map(o => o.partySize), 4);
  
  // Get total item count
  const totalItems = orders.reduce((acc, order) => acc + order.items.length, 0);

  return (
    <div className={`${width} flex flex-col m-2 ml-0`}>
      {/* Guest Header - Outside the box */}
      <div className="px-2 py-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-white font-medium">{guestName}</span>
          <div className="flex items-center gap-3 text-white/50 text-sm">
            <div className="flex items-center gap-1">
              <Phone className="w-3 h-3" />
              <span>{phone}</span>
            </div>
            <div className="flex items-center gap-1">
              <span>⚡</span>
              <span>{time}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-1.5 bg-neutral-700 text-white text-xs rounded-full hover:bg-neutral-600 transition-colors">
            Add Product
          </button>
          <button className="px-3 py-1.5 bg-neutral-700 text-white text-xs rounded-full hover:bg-neutral-600 transition-colors">
            Discount
          </button>
          <button 
            className="px-3 py-1.5 bg-neutral-700 text-white text-xs rounded-full hover:bg-neutral-600 transition-colors"
            onClick={onReceiptClick}
          >
            Receipt
          </button>
          <button 
            className="px-3 py-1.5 bg-neutral-700 text-white text-xs rounded-full hover:bg-neutral-600 transition-colors"
            onClick={onRegisterClick}
          >
            Cash Register
          </button>
        </div>
      </div>

      {/* Main Panel Box */}
      <div className="flex-1 flex flex-col rounded-[10px] overflow-hidden" style={{ background: "#7575754D", boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)" }}>
        
        {/* Table Order Header - Row 1 */}
        <div className="flex items-center justify-between px-2 py-2 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <span className="bg-neutral-700 border border-neutral-600 px-2 py-1 rounded text-xs font-medium text-white">
              TABLE {tableId.replace("T", "")}
            </span>
            <span className="font-bold text-white text-sm">Order {mergedOrderIds.join(", ")}</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <img src={runnerIcon} alt="Server" className="w-4 h-4 opacity-80" />
            <span className="text-neutral-400">{server}</span>
          </div>
        </div>

        {/* Table Order Header - Row 2: Merged Orders Display */}
        <div className="flex items-center justify-between px-2 py-1.5 border-b border-sidebar-border">
          <div className="flex items-center gap-1.5">
            <button 
              onClick={() => toggleOrderFilter('all')}
              className={`w-6 h-6 rounded flex items-center justify-center transition-colors cursor-pointer ${
                orderFilter === 'all' 
                  ? 'bg-white border border-white' 
                  : 'bg-neutral-700 border border-neutral-600 hover:bg-neutral-600'
              }`}
            >
              <img 
                src={linkMergeIcon} 
                alt="Merged" 
                className={`w-4 h-4 ${orderFilter === 'all' ? 'invert' : ''}`} 
              />
            </button>
            {mergedOrderIds.map((orderId) => (
              <button
                key={orderId}
                onClick={() => toggleOrderFilter(orderId)}
                className={`w-6 h-6 rounded text-xs font-medium flex items-center justify-center transition-colors cursor-pointer ${
                  orderFilter === orderId 
                    ? 'bg-white border border-white text-black' 
                    : 'bg-neutral-700 border border-neutral-600 text-white hover:bg-neutral-600'
                }`}
              >
                {orderId}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 text-xs text-neutral-400">
            <span>Table {tableId.replace("T", "")}</span>
            <span>•</span>
            <span>Order {mergedOrderIds[0]}, Party of {orders[0]?.partySize || 4}</span>
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              <span>{orders[0]?.time || time}</span>
            </div>
          </div>
        </div>
        
        {/* Table Order Header - Row 2: Seat buttons */}
        <div className="flex items-center gap-1.5 px-2 py-1.5 border-b border-sidebar-border">
          <button className="p-1 bg-neutral-700 rounded hover:bg-neutral-600 transition-colors">
            <img src={chairWhiteIcon} alt="Chair" className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={() => toggleSeatFilter('all')}
            className={`p-1 rounded transition-colors ${
              seatFilter.includes('all') 
                ? 'bg-white' 
                : 'bg-neutral-700 hover:bg-neutral-600'
            }`}
          >
            <Share2 className={`w-3.5 h-3.5 ${seatFilter.includes('all') ? 'text-black' : 'text-white'}`} />
          </button>
          {Array.from({ length: maxSeats }, (_, i) => i + 1).map((seat) => (
            <button
              key={seat}
              onClick={() => toggleSeatFilter(seat)}
              className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold transition-colors ${
                seatFilter.includes(seat) 
                  ? 'bg-white text-black' 
                  : 'bg-neutral-600 text-white hover:bg-neutral-500'
              }`}
            >
              {seat}
            </button>
          ))}
        </div>

        {/* Order Notes */}
        <div className="px-2 py-1.5 border-b border-sidebar-border flex-shrink-0">
          <OrderNotesAutocomplete
            value={orderNotes}
            onChange={setOrderNotes}
            placeholder="Order notes and Allergies"
          />
        </div>

        {/* Order Items - Grouped by Order */}
        <ScrollArea className="flex-1 min-h-0 px-2">
          <div className="py-1 space-y-2">
            {filteredOrders.map((order, orderIndex) => (
              <div key={order.id} className="space-y-1">
                {/* Order Section Header */}
                <div className="flex items-center justify-between text-xs text-white/60 pt-2">
                  <div className="flex items-center gap-2">
                    <span className="bg-neutral-700 border border-neutral-600 px-1.5 py-0.5 rounded text-[10px] font-medium text-white">
                      T{order.table.replace("T", "")}
                    </span>
                    <span>Order {order.id}</span>
                    <span className="text-white/40">·</span>
                    <span>Party of {order.partySize}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>⚡</span>
                    <span>{order.time}</span>
                  </div>
                </div>

                {/* Order Notes */}
                {order.notes && (
                  <div className="flex items-center gap-2 text-white/50 text-xs bg-white/10 p-2 rounded-lg">
                    <span>📝</span>
                    <span>{order.notes}</span>
                  </div>
                )}

                {/* Order Items */}
                {order.items.map((item, itemIndex) => (
                  <div 
                    key={itemIndex} 
                    className="p-2 border border-sidebar-border rounded-md cursor-pointer" 
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
                            <span className="text-sm font-medium text-foreground">{item.price}</span>
                          </div>
                          
                          {/* Modifiers with tree hierarchy */}
                          {item.modifiers.length > 0 && (
                            <div className="mt-1 relative">
                              {item.modifiers.map((mod, idx) => {
                                const isAddOn = mod.startsWith("W/") || mod.startsWith("Add");
                                const isRemoval = mod.startsWith("No ") || mod.startsWith("-");
                                const isLastItem = idx === item.modifiers.length - 1;
                                
                                return (
                                  <div key={idx} className="relative flex items-center text-xs py-[3px]">
                                    {/* Vertical line - only show if not last item */}
                                    {!isLastItem && (
                                      <div className="absolute left-0 top-1/2 w-px bg-white" style={{ height: 'calc(100% + 3px)' }} />
                                    )}
                                    {/* Vertical line segment to connect to horizontal */}
                                    <div className="absolute left-0 top-0 h-1/2 w-px bg-white" />
                                    {/* Horizontal connector */}
                                    <div className="absolute left-0 top-1/2 w-3 h-px bg-white" />
                                    {/* Content */}
                                    <div className="flex items-center gap-2 ml-5">
                                      <span className="text-white">
                                        {isAddOn ? '+' : isRemoval ? '-' : '•'}
                                      </span>
                                      <span className={`text-white ${isRemoval ? 'line-through' : ''}`}>
                                        {mod}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          
                          {/* Seat Assignment Display */}
                          {item.seats.length > 0 && (
                            <div className="mt-1.5 flex items-center gap-1.5">
                              <img src={chairWhiteIcon} alt="Seats" className="w-4 h-4 opacity-70" />
                              {item.seats.length === maxSeats ? (
                                <span className="w-5 h-5 rounded bg-neutral-700 text-white flex items-center justify-center">
                                  <Share2 className="w-3 h-3" />
                                </span>
                              ) : (
                                item.seats.map(seat => (
                                  <span 
                                    key={seat}
                                    className="w-5 h-5 rounded bg-neutral-700 text-white text-[10px] font-medium flex items-center justify-center"
                                  >
                                    {seat}
                                  </span>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <ScrollBar orientation="vertical" />
        </ScrollArea>

        {/* Order Summary */}
        <div className="p-2 border-t border-sidebar-border flex-shrink-0">
          <OrderSummary totals={totals} variant="detailed" />

          {/* Action Buttons */}
          <div className="px-2 py-2 flex items-center gap-3 flex-shrink-0">
            <button className="w-8 h-8 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center flex-shrink-0">
              <img src={clearIcon} alt="Clear" className="w-3 h-3" />
            </button>
            <button className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{
              backgroundColor: '#C9C9C9'
            }}>
              <img src={saveIcon} alt="Save" className="w-4 h-4" />
            </button>
            <button className="flex-1 h-8 rounded-full flex items-center justify-center gap-1.5" style={{
              background: 'linear-gradient(180deg, #FF9E65 0%, #FF5E00 100%)'
            }}>
              <img src={fireIcon} alt="Fire" className="w-4 h-4" />
              <span className="text-white font-semibold text-sm">FIRE</span>
            </button>
            <button className="flex-1 h-8 rounded-full flex items-center justify-center" style={{
              background: 'linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)'
            }}>
              <span className="text-black font-semibold text-xs">
                CHARGE {formatPrice(totals.total)}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MergedOrderPanel;