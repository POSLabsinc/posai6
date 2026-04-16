import { useState, useEffect, useMemo, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ClipboardList, Heart, ArrowUpDown, TrendingUp, TrendingDown, MoreHorizontal, Calendar, ChevronDown, ChevronUp, Filter } from "lucide-react";
import OrderTypeIcon from "@/components/OrderTypeIcon";
import { format } from "date-fns";

interface OrderItemDetail {
  item_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface OrderWithItems {
  id: string;
  order_number: number;
  order_type: string;
  payment_type: string;
  employee_name: string | null;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  tip_amount: number;
  total: number;
  status: string;
  created_at: string;
  order_items: OrderItemDetail[];
}

interface OrderHistoryTabContentProps {
  guest: { id: string; name: string };
}

type SortField = "date" | "spent" | "tips" | "items" | "order_type";
type SortDir = "asc" | "desc";

const OrderHistoryTabContent = ({ guest }: OrderHistoryTabContentProps) => {
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [filterType, setFilterType] = useState<string>("All");
  const [showFilter, setShowFilter] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      const { data } = await (supabase as any)
        .from("orders")
        .select("id, order_number, order_type, payment_type, employee_name, subtotal, discount_amount, tax_amount, tip_amount, total, status, created_at, order_items(item_name, quantity, unit_price, total_price)")
        .eq("guest_id", guest.id)
        .order("created_at", { ascending: false });
      setOrders((data as OrderWithItems[]) || []);
      setLoading(false);
    };
    fetchOrders();
  }, [guest.id]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  // Unique order types for filter
  const orderTypes = useMemo(() => {
    const types = [...new Set(orders.map(o => o.order_type))];
    return ["All", ...types.sort()];
  }, [orders]);

  const filtered = useMemo(() => {
    if (filterType === "All") return orders;
    return orders.filter(o => o.order_type === filterType);
  }, [orders, filterType]);

  const sorted = useMemo(() => {
    const copy = [...filtered];
    copy.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "date": cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime(); break;
        case "spent": cmp = Number(a.total) - Number(b.total); break;
        case "tips": cmp = Number(a.tip_amount) - Number(b.tip_amount); break;
        case "items": cmp = a.order_items.length - b.order_items.length; break;
        case "order_type": cmp = a.order_type.localeCompare(b.order_type); break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [orders, sortField, sortDir]);

  // Summary calculations
  const totalSpent = orders.reduce((s, o) => s + Number(o.total), 0);
  const totalTips = orders.reduce((s, o) => s + Number(o.tip_amount), 0);
  const recentSpent = orders.length > 0 ? Number(orders[0]?.subtotal) : 0;
  const recentTips = orders.length > 0 ? Number(orders[0]?.tip_amount) : 0;

  // Most ordered item
  const itemCounts: Record<string, number> = {};
  orders.forEach(o => o.order_items.forEach(i => {
    itemCounts[i.item_name] = (itemCounts[i.item_name] || 0) + i.quantity;
  }));
  const mostOrdered = Object.entries(itemCounts).sort((a, b) => b[1] - a[1])[0];

  const formatDay = (d: string) => { try { return format(new Date(d), "dd"); } catch { return "--"; } };
  const formatMonth = (d: string) => { try { return format(new Date(d), "MMM").toUpperCase(); } catch { return "--"; } };
  const formatTime = (d: string) => { try { return format(new Date(d), "hh:mm a"); } catch { return "--"; } };

  const getDishLabel = (items: OrderItemDetail[]) => {
    if (items.length === 0) return "—";
    const names = items.map(i => i.item_name);
    if (names.length <= 3) return names.join(", ");
    return `${names[0]}, +${String(names.length - 1).padStart(2, "0")} more`;
  };


  const tipPercentage = (tip: number, subtotal: number) => {
    if (subtotal <= 0) return 0;
    return Math.round((tip / subtotal) * 100);
  };

  if (loading) {
    return (
      <div className="rounded-2xl p-8 flex items-center justify-center bg-neutral-800/40">
        <div className="w-6 h-6 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="rounded-2xl p-8 flex flex-col items-center justify-center text-center bg-neutral-800/40">
        <ClipboardList className="w-10 h-10 text-neutral-500 mb-1" />
        <p className="text-neutral-400 text-sm">No order history available yet.</p>
      </div>
    );
  }

  const summaryCards = [
    { value: `$${recentSpent.toFixed(2)}`, label: "Recent Spent", icon: <ClipboardList className="w-5 h-5 text-neutral-400" />, trend: "up" as const },
    { value: `$${recentTips.toFixed(2)}`, label: "Recent Tips", icon: <Calendar className="w-5 h-5 text-neutral-400" />, trend: "down" as const },
    { value: `$${totalSpent.toFixed(2)}`, label: "Total Spent", icon: <ClipboardList className="w-5 h-5 text-neutral-400" />, trend: null },
    { value: `$${totalTips.toFixed(2)}`, label: "Total Tips", icon: <Calendar className="w-5 h-5 text-neutral-400" />, trend: null },
    { value: mostOrdered ? mostOrdered[0] : "—", label: "Most Ordered Items", icon: <Heart className="w-5 h-5 text-neutral-400" />, trend: null, hasMore: true },
  ];

  const SortHeader = ({ label, field, className = "" }: { label: string; field: SortField; className?: string }) => (
    <button
      onClick={() => toggleSort(field)}
      className={`flex items-center gap-1 text-xs text-neutral-400 font-medium uppercase tracking-wider hover:text-neutral-200 transition-colors ${className}`}
    >
      {label}
      <ArrowUpDown className="w-3 h-3" />
    </button>
  );

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-neutral-400 tracking-wider">Summary</p>
          <div className="relative" ref={filterRef}>
            <button
              onClick={() => setShowFilter(v => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filterType !== "All"
                  ? "bg-foreground text-background"
                  : "bg-neutral-700/40 text-neutral-400 hover:text-foreground"
              }`}
            >
              <Filter className="w-3 h-3" />
              {filterType === "All" ? "Filter" : filterType}
              <ChevronDown className="w-3 h-3" />
            </button>
            {showFilter && (
              <div className="absolute right-0 top-9 z-50 bg-neutral-800 border border-neutral-700/60 rounded-xl py-2 shadow-xl min-w-[160px]">
                {orderTypes.map((type) => (
                  <button
                    key={type}
                    onClick={() => { setFilterType(type); setShowFilter(false); }}
                    className={`w-full text-left px-4 py-2 text-xs transition-colors ${
                      filterType === type
                        ? "text-foreground bg-neutral-700/40 font-medium"
                        : "text-neutral-400 hover:text-foreground hover:bg-neutral-700/30"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {summaryCards.map((card, idx) => (
            <div key={idx} className="bg-neutral-800/40 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-neutral-700/40 flex items-center justify-center flex-shrink-0">
                {card.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-lg font-bold text-foreground truncate">{card.value}</span>
                  {card.trend === "up" && <TrendingUp className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />}
                  {card.trend === "down" && <TrendingDown className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />}
                </div>
                <p className="text-[10px] text-neutral-500">{card.label}</p>
              </div>
              {card.hasMore && <MoreHorizontal className="w-4 h-4 text-neutral-500 flex-shrink-0" />}
            </div>
          ))}
        </div>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-[80px_1fr_100px_80px_60px_80px] gap-2 px-4 py-2 items-center">
        <SortHeader label="Date" field="date" />
        <span className="text-xs text-neutral-400 font-medium uppercase tracking-wider">Dish Name</span>
        <SortHeader label="Spent" field="spent" />
        <SortHeader label="Tips" field="tips" />
        <SortHeader label="Items" field="items" />
        <SortHeader label="Type" field="order_type" className="justify-end" />
      </div>

      {/* Order Rows */}
      <div className="space-y-2">
        {sorted.map((order) => {
          const isExpanded = expandedId === order.id;
          const itemCount = order.order_items.reduce((s, i) => s + Number(i.quantity), 0);
          const itemsSubtotal = order.order_items.reduce((s, i) => s + Number(i.total_price), 0);

          const orderTypeLower = order.order_type.toLowerCase();
          const borderColor = orderTypeLower.includes("dine") || orderTypeLower.includes("table") || orderTypeLower.includes("restaurant")
            ? "border-blue-500"
            : orderTypeLower.includes("take") || orderTypeLower.includes("takeaway")
            ? "border-green-500"
            : orderTypeLower.includes("delivery")
            ? "border-orange-500"
            : orderTypeLower.includes("drive")
            ? "border-red-500"
            : orderTypeLower.includes("banquet")
            ? "border-purple-500"
            : orderTypeLower.includes("online") || orderTypeLower.includes("phone") || orderTypeLower.includes("scheduled")
            ? "border-yellow-400"
            : "border-neutral-500";

          return (
            <div
              key={order.id}
              className={`bg-neutral-800/40 rounded-2xl overflow-hidden transition-colors border-l-[3px] ${borderColor}`}
            >
              {/* Row header - clickable */}
              <button
                onClick={() => setExpandedId(isExpanded ? null : order.id)}
                className="w-full grid grid-cols-[80px_1fr_100px_80px_60px_80px] gap-2 px-4 py-3.5 items-center hover:bg-neutral-700/30 transition-colors text-left"
              >
                {/* Date */}
                <div className="flex flex-col items-center w-12">
                  <span className="text-lg font-bold text-foreground leading-tight">{formatDay(order.created_at)}</span>
                  <span className="text-[10px] text-neutral-400 uppercase">{formatMonth(order.created_at)}</span>
                </div>

                {/* Dish Name */}
                <span className="text-sm text-foreground font-medium truncate">
                  {getDishLabel(order.order_items)}
                </span>

                {/* Spent */}
                <div className="flex items-center">
                  <div className="w-px h-6 bg-neutral-700/50 mr-3" />
                  <span className="text-sm text-foreground">${Number(order.total).toFixed(2)}</span>
                </div>

                {/* Tips */}
                <div className="flex items-center">
                  <div className="w-px h-6 bg-neutral-700/50 mr-3" />
                  <span className="text-sm text-foreground">${Number(order.tip_amount).toFixed(2)}</span>
                </div>

                {/* Items */}
                <div className="flex items-center">
                  <div className="w-px h-6 bg-neutral-700/50 mr-3" />
                  <span className="text-sm text-foreground">{String(itemCount || order.order_items.length).padStart(2, "0")}</span>
                </div>

                {/* Order Type + expand icon */}
                <div className="flex items-center gap-2 justify-end">
                  <OrderTypeIcon type={order.order_type} size="small" />
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-neutral-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-neutral-500" />
                  )}
                </div>
              </button>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="border-t border-neutral-700/50 px-4 py-5">
                  <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_1.2fr] gap-5">
                    {/* Left Column: Visit Details */}
                    <div>
                      <p className="text-sm font-bold text-foreground mb-3">Order #{order.order_number}</p>
                      <div className="space-y-2.5">
                        <div className="flex justify-between">
                          <span className="text-xs text-neutral-500">Order Type</span>
                          <span className="text-xs text-foreground font-medium">{order.order_type}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-neutral-500">Time</span>
                          <span className="text-xs text-foreground font-medium">{formatTime(order.created_at)}</span>
                        </div>
                        {order.employee_name && (
                          <div className="flex justify-between">
                            <span className="text-xs text-neutral-500">Server</span>
                            <span className="text-xs text-foreground font-medium">{order.employee_name}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-xs text-neutral-500">Status</span>
                          <span className={`text-xs font-medium ${
                            order.status === "completed" ? "text-green-400" : 
                            order.status === "refunded" ? "text-red-400" : "text-yellow-400"
                          }`}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Center Column: Bill Summary */}
                    <div className="border-l border-neutral-700/50 pl-5">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-bold text-foreground">Bill Summary</p>
                        <span className="text-xs text-neutral-400">Total Amount : <span className="text-foreground font-semibold">${Number(order.total).toFixed(2)}</span></span>
                      </div>
                      <div className="space-y-2.5">
                        <div className="flex justify-between">
                          <span className="text-xs text-neutral-500">Confirmation No.</span>
                          <span className="text-xs text-foreground font-medium">{order.order_number}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-neutral-500">Payment Mode</span>
                          <span className="text-xs text-foreground font-medium">{order.payment_type}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-neutral-500">Time</span>
                          <span className="text-xs text-foreground font-medium">{formatTime(order.created_at)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-neutral-500">Payment</span>
                          <span className="text-xs text-green-400 font-medium">
                            {order.status === "completed" ? "Paid" : order.status === "refunded" ? "Refunded" : "Pending"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Items Table */}
                    <div className="border-l border-neutral-700/50 pl-5">
                      {/* Items Header */}
                      <div className="grid grid-cols-[1fr_50px_100px] gap-2 mb-2">
                        <span className="text-xs text-neutral-400 font-medium uppercase tracking-wider">Dish Name</span>
                        <span className="text-xs text-neutral-400 font-medium uppercase tracking-wider text-center">Qty</span>
                        <span className="text-xs text-neutral-400 font-medium uppercase tracking-wider text-right">Price</span>
                      </div>

                      {/* Items List */}
                      <div className="space-y-0">
                        {order.order_items.map((item, idx) => (
                          <div key={idx} className="grid grid-cols-[1fr_50px_100px] gap-2 py-2 border-t border-neutral-700/30">
                            <span className="text-xs text-foreground font-medium">{item.item_name}</span>
                            <span className="text-xs text-foreground text-center">{Number(item.quantity)}</span>
                            <span className="text-xs text-foreground text-right">${Number(item.unit_price).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>

                      {/* Totals */}
                      <div className="border-t border-neutral-700/50 pt-2 mt-1 space-y-1.5">
                        <div className="grid grid-cols-[1fr_50px_100px] gap-2">
                          <span className="text-xs text-neutral-500">Item Total</span>
                          <span className="text-xs text-foreground text-center">{itemCount} x</span>
                          <span className="text-xs text-foreground text-right">${itemsSubtotal.toFixed(2)}</span>
                        </div>
                        {Number(order.tip_amount) > 0 && (
                          <div className="grid grid-cols-[1fr_50px_100px] gap-2">
                            <span className="text-xs text-neutral-500">Tip</span>
                            <span className="text-xs text-neutral-400 text-center">{tipPercentage(Number(order.tip_amount), Number(order.subtotal))}%</span>
                            <span className="text-xs text-foreground text-right">${Number(order.tip_amount).toFixed(2)}</span>
                          </div>
                        )}
                        <div className="grid grid-cols-[1fr_50px_100px] gap-2 border-t border-neutral-700/50 pt-2">
                          <span className="text-xs text-neutral-400 font-semibold">Total Amount</span>
                          <span />
                          <span className="text-xs text-foreground font-bold text-right">${Number(order.total).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OrderHistoryTabContent;
