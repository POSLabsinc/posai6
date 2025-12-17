import { useState } from "react";
import { Search, Filter, Clock, ChefHat, Truck, CheckCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

const categories = ["All Orders", "Dine-in", "Takeaway", "Delivery"];

const orders = [
  { id: "#4521", customer: "Sarah Mitchell", items: ["Margherita Pizza", "Caesar Salad"], total: "$67.50", time: "2 min ago", status: "preparing", table: "T-12" },
  { id: "#4520", customer: "John Davidson", items: ["Grilled Salmon", "Sparkling Water"], total: "$34.20", time: "5 min ago", status: "ready", table: null },
  { id: "#4519", customer: "Emily Roberts", items: ["Pasta Carbonara", "Tiramisu", "Red Wine"], total: "$89.00", time: "8 min ago", status: "delivered", table: null },
  { id: "#4518", customer: "Michael Kim", items: ["Beef Burger", "Fries", "Coke"], total: "$45.75", time: "12 min ago", status: "new", table: "T-5" },
  { id: "#4517", customer: "Lisa Parker", items: ["Sushi Platter", "Miso Soup", "Green Tea"], total: "$123.00", time: "15 min ago", status: "preparing", table: null },
  { id: "#4516", customer: "David Chen", items: ["Chicken Wings", "Beer"], total: "$28.50", time: "18 min ago", status: "ready", table: "T-8" },
];

const statusConfig = {
  new: { icon: Clock, color: "bg-info/20 text-info border-info/30", label: "New" },
  preparing: { icon: ChefHat, color: "bg-warning/20 text-warning border-warning/30", label: "Preparing" },
  ready: { icon: CheckCircle, color: "bg-success/20 text-success border-success/30", label: "Ready" },
  delivered: { icon: Truck, color: "bg-purple-500/20 text-purple-400 border-purple-500/30", label: "Delivered" },
};

export default function LiquidGlassOrders() {
  const [activeCategory, setActiveCategory] = useState("All Orders");
  const [selectedOrder, setSelectedOrder] = useState(orders[0]);

  return (
    <div className="min-h-screen bg-background gradient-mesh">
      <div className="h-screen flex">
        {/* Main Content */}
        <div className="flex-1 p-6 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-light text-foreground tracking-tight">Orders</h1>
            
            {/* Search */}
            <div className="glass rounded-2xl px-4 py-3 flex items-center gap-3 w-80">
              <Search className="w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search orders..."
                className="bg-transparent border-none outline-none text-foreground placeholder-muted-foreground flex-1"
              />
            </div>
          </div>

          {/* Category Pills */}
          <div className="flex gap-3 mb-6">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-5 py-2.5 rounded-2xl text-sm font-medium transition-all duration-300 ${
                  activeCategory === cat
                    ? "bg-primary text-primary-foreground shadow-lg"
                    : "glass text-muted-foreground hover:bg-accent"
                }`}
              >
                {cat}
              </button>
            ))}
            <button className="glass rounded-2xl px-4 py-2.5 flex items-center gap-2 text-muted-foreground hover:bg-accent transition-colors ml-auto">
              <Filter className="w-4 h-4" />
              <span className="text-sm">Filter</span>
            </button>
          </div>

          {/* Orders Grid */}
          <ScrollArea className="flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-4">
              {orders.map((order) => {
                const status = statusConfig[order.status as keyof typeof statusConfig];
                const StatusIcon = status.icon;
                
                return (
                  <div
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className={`glass-vibrant rounded-3xl p-5 cursor-pointer transition-all duration-300 hover:scale-[1.02] ${
                      selectedOrder.id === order.id ? "ring-2 ring-primary/50 glass-glow" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-foreground font-semibold">{order.id}</span>
                          {order.table && (
                            <span className="glass px-2 py-0.5 rounded-lg text-xs text-primary">
                              {order.table}
                            </span>
                          )}
                        </div>
                        <p className="text-muted-foreground text-sm mt-1">{order.customer}</p>
                      </div>
                      <div className={`px-3 py-1.5 rounded-xl text-xs font-medium border ${status.color} flex items-center gap-1.5`}>
                        <StatusIcon className="w-3.5 h-3.5" />
                        {status.label}
                      </div>
                    </div>

                    <div className="space-y-1 mb-4">
                      {order.items.map((item, idx) => (
                        <p key={idx} className="text-muted-foreground text-sm">• {item}</p>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-border">
                      <span className="text-muted-foreground text-xs">{order.time}</span>
                      <span className="text-foreground font-semibold">{order.total}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        {/* Order Detail Panel */}
        <div className="w-96 glass-dark border-l border-border p-6 flex flex-col">
          <h2 className="text-xl font-medium text-foreground mb-6">Order Details</h2>
          
          {selectedOrder && (
            <>
              {/* Customer Info */}
              <div className="glass rounded-2xl p-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
                    <span className="text-primary-foreground font-semibold">{selectedOrder.customer.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="text-foreground font-medium">{selectedOrder.customer}</p>
                    <p className="text-muted-foreground text-sm">{selectedOrder.id}</p>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div className="glass rounded-2xl p-4 mb-4 flex-1">
                <p className="text-muted-foreground text-sm mb-3">Items</p>
                <div className="space-y-3">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <span className="text-foreground">{item}</span>
                      <span className="text-muted-foreground">1x</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="glass-vibrant rounded-2xl p-4 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Total</span>
                  <span className="text-2xl font-semibold text-foreground">{selectedOrder.total}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-3">
                <button className="glass rounded-xl py-3 text-foreground font-medium hover:bg-accent transition-colors">
                  Print
                </button>
                <button className="bg-primary rounded-xl py-3 text-primary-foreground font-medium hover:opacity-90 transition-opacity">
                  Update Status
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
