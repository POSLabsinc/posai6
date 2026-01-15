import { useState } from "react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Phone, MoreVertical, Pencil } from "lucide-react";

// Import icons
import seatIcon from "@/assets/icons/seat-icon.png";
import splitIcon from "@/assets/icons/split-icon.png";
import shareSeatsIcon from "@/assets/icons/share-seats.png";
import clearIcon from "@/assets/icons/clear-c.png";
import fireIcon from "@/assets/icons/fire.png";

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
}

const MergedOrderPanel = ({
  guestName,
  phone,
  time,
  server,
  tableId,
  mergedOrderIds,
  orders,
  width = "w-[345px]"
}: MergedOrderPanelProps) => {
  const [selectedSeats, setSelectedSeats] = useState<number[]>([1, 2, 3]);

  const toggleSeat = (seat: number) => {
    setSelectedSeats(prev =>
      prev.includes(seat)
        ? prev.filter(s => s !== seat)
        : [...prev, seat]
    );
  };

  // Calculate totals
  const subtotal = orders.reduce((acc, order) => {
    return acc + order.items.reduce((itemAcc, item) => {
      const price = parseFloat(item.price.replace("$", ""));
      return itemAcc + price;
    }, 0);
  }, 0);

  const serviceCharge = 2.00;
  const discount = 4.00;
  const tax = 2.00;
  const total = subtotal + serviceCharge - discount + tax;

  // Get max seats across all orders
  const maxSeats = Math.max(...orders.map(o => o.partySize), 3);

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
      </div>

      {/* Main Panel Box */}
      <div className="flex-1 flex flex-col rounded-[10px] overflow-hidden" style={{ background: "#7575754D", boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)" }}>
        
        {/* Table Order Info - Merged Orders Header */}
        <div className="px-4 py-3 border-b border-white/10">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-white/10 text-white text-xs rounded">TABLE {tableId.replace("T", "")}</span>
              <span className="text-white font-bold">Order {mergedOrderIds.join(", ")}</span>
            </div>
            <div className="flex items-center gap-2">
              <img src={shareSeatsIcon} alt="Seats" className="w-4 h-4 opacity-60" />
              <span className="text-white/50 text-sm">{server}</span>
              <button className="p-1 hover:bg-white/10 rounded transition-colors">
                <MoreVertical className="w-4 h-4 text-white/60" />
              </button>
            </div>
          </div>
          
          {/* Seat Buttons */}
          <div className="flex items-center gap-1.5">
            <button className="w-6 h-6 bg-neutral-600 rounded flex items-center justify-center hover:bg-neutral-500 transition-colors">
              <Pencil className="w-3.5 h-3.5 text-white" />
            </button>
            {Array.from({ length: maxSeats }, (_, i) => i + 1).map(seat => (
              <button
                key={seat}
                onClick={() => toggleSeat(seat)}
                className={`w-6 h-6 rounded flex items-center justify-center text-xs font-medium transition-colors ${
                  selectedSeats.includes(seat)
                    ? "bg-white text-black"
                    : "bg-neutral-600 text-white hover:bg-neutral-500"
                }`}
              >
                {seat}
              </button>
            ))}
          </div>
        </div>

        {/* Order Items - Grouped by Order */}
        <ScrollArea className="flex-1">
          <div className="px-4 py-2 space-y-3">
            {orders.map((order, orderIndex) => (
              <div key={order.id} className="space-y-2">
                {/* Order Section Header */}
                <div className="flex items-center justify-between text-xs text-white/60 pt-2">
                  <div className="flex items-center gap-2">
                    <span>Table {order.table.replace("T", "")}</span>
                    <span>·</span>
                    <span>Order {order.id}, Party of {order.partySize}</span>
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
                  <div key={itemIndex} className="p-3 bg-white/5 rounded-xl border border-white/10">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-2 flex-1">
                        <span className="w-6 h-6 bg-white rounded flex items-center justify-center text-black text-sm font-bold flex-shrink-0">
                          {item.qty}
                        </span>
                        <div className="flex-1">
                          <span className="text-white font-medium">{item.name}</span>
                          {item.modifiers.length > 0 && (
                            <div className="mt-1 text-white/50 text-sm space-y-0.5">
                              {item.modifiers.map((mod, i) => (
                                <div key={i} className="flex items-center gap-1">
                                  <span className="text-white/30">—</span>
                                  <span>{mod}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <span className="text-white font-medium">{item.price}</span>
                    </div>
                    
                    {/* Seat assignments and share icons */}
                    <div className="flex items-center justify-between mt-2">
                      {item.seats.length > 0 && (
                        <div className="flex items-center gap-1">
                          <img src={seatIcon} alt="Seat" className="w-4 h-4 opacity-50" />
                          {item.seats.map(seat => (
                            <span
                              key={seat}
                              className="w-5 h-5 bg-white/10 border border-white/20 rounded text-white text-xs flex items-center justify-center"
                            >
                              {seat}
                            </span>
                          ))}
                        </div>
                      )}
                      {item.seats.length === 0 && <div />}
                      <div className="flex items-center gap-1">
                        <button className="p-1 hover:bg-white/10 rounded transition-colors">
                          <img src={seatIcon} alt="Seat" className="w-3 h-3 opacity-50" />
                        </button>
                        <button className="p-1 hover:bg-white/10 rounded transition-colors">
                          <img src={splitIcon} alt="Share" className="w-3 h-3 opacity-50" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <ScrollBar orientation="vertical" />
        </ScrollArea>

        {/* Order Summary - Compact */}
        <div className="px-4 py-3 border-t border-white/10">
          <div className="flex items-center justify-between text-xs text-white/60">
            <span>Sub Total <span className="text-white">${subtotal.toFixed(2)}</span></span>
            <span>Svc <span className="text-white">${serviceCharge.toFixed(2)}</span></span>
            <span className="text-red-500">Disc <span>${discount.toFixed(2)}</span></span>
            <span>Tax <span className="text-white">${tax.toFixed(2)}</span></span>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="px-4 py-3 border-t border-white/10">
          <button 
            className="w-full py-3 rounded-full text-black text-sm font-bold"
            style={{ background: "linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)" }}
          >
            CHARGE ${total.toFixed(2)}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MergedOrderPanel;
