import { useState, useEffect, useMemo, useCallback } from "react";
import { X, Printer, CreditCard, Banknote, Receipt, ChevronLeft, ChevronDown, Calendar, Clock, Filter } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";

interface ShiftSummaryModalProps {
  open: boolean;
  onClose: () => void;
  employeeName: string;
  employeeRole: string;
  clockInTime: string;
  clockInDate: string;
  totalHours: string;
}

interface OrderRow {
  id: string;
  order_number: number;
  order_type: string;
  payment_type: string;
  employee_name: string | null;
  customer_name: string | null;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  tip_amount: number;
  total: number;
  status: string;
  created_at: string;
}

interface OrderItemRow {
  id: string;
  order_id: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  category: string;
}

const getInitials = (name: string) =>
  name.split(" ").map(p => p[0]).join("").toUpperCase().substring(0, 2);

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const formatDate = (d: Date) =>
  d.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });

const toDateInputVal = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export default function ShiftSummaryModal({
  open, onClose, employeeName, employeeRole, clockInTime, clockInDate, totalHours
}: ShiftSummaryModalProps) {
  // Filters
  const today = new Date();
  const [filterDateFrom, setFilterDateFrom] = useState(toDateInputVal(today));
  const [filterDateTo, setFilterDateTo] = useState(toDateInputVal(today));
  const [filterEmployee, setFilterEmployee] = useState(employeeName);
  const [filterTimeFrom, setFilterTimeFrom] = useState("00:00");
  const [filterTimeTo, setFilterTimeTo] = useState("23:59");
  const [filterRevenueCenter, setFilterRevenueCenter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  // Data
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [employees, setEmployees] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Check detail
  const [selectedOrder, setSelectedOrder] = useState<OrderRow | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItemRow[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  // Fetch employee list once
  useEffect(() => {
    if (!open) return;
    (async () => {
      const { data } = await (supabase as any)
        .from("orders")
        .select("employee_name")
        .not("employee_name", "is", null);
      if (data) {
        const unique = [...new Set(data.map((r: any) => r.employee_name))] as string[];
        setEmployees(unique.sort());
      }
    })();
  }, [open]);

  // Build date range
  const startISO = useMemo(() => {
    const d = new Date(filterDateFrom + "T00:00:00");
    const [h, m] = filterTimeFrom.split(":").map(Number);
    d.setHours(h, m, 0, 0);
    return d.toISOString();
  }, [filterDateFrom, filterTimeFrom]);

  const endISO = useMemo(() => {
    const d = new Date(filterDateTo + "T00:00:00");
    const [h, m] = filterTimeTo.split(":").map(Number);
    d.setHours(h, m, 59, 999);
    return d.toISOString();
  }, [filterDateTo, filterTimeTo]);

  // Fetch orders
  const fetchOrders = useCallback(async () => {
    if (!open) return;
    setLoading(true);
    let query = (supabase as any)
      .from("orders")
      .select("*")
      .gte("created_at", startISO)
      .lte("created_at", endISO)
      .order("created_at", { ascending: false });

    if (filterEmployee && filterEmployee !== "all") {
      query = query.eq("employee_name", filterEmployee);
    }
    if (filterRevenueCenter !== "all") {
      query = query.eq("order_type", filterRevenueCenter);
    }

    const { data } = await query;
    setOrders(data || []);
    setLoading(false);
  }, [open, startISO, endISO, filterEmployee, filterRevenueCenter]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // Realtime subscription
  useEffect(() => {
    if (!open) return;
    const channel = supabase
      .channel("shift-summary-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        fetchOrders();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [open, fetchOrders]);

  // Computed metrics
  const completed = useMemo(() => orders.filter(o => o.status === "completed" || o.status === "paid"), [orders]);
  const pending = useMemo(() => orders.filter(o => o.status !== "completed" && o.status !== "paid" && o.status !== "refunded" && o.status !== "cancelled"), [orders]);

  const totalCardSales = useMemo(() => completed.filter(o => o.payment_type?.toLowerCase() === "card" || o.payment_type?.toLowerCase() === "credit").reduce((s, o) => s + Number(o.total), 0), [completed]);
  const totalCashSales = useMemo(() => completed.filter(o => o.payment_type?.toLowerCase() === "cash").reduce((s, o) => s + Number(o.total), 0), [completed]);
  const totalTips = useMemo(() => completed.reduce((s, o) => s + Number(o.tip_amount), 0), [completed]);
  const overallTotal = useMemo(() => completed.reduce((s, o) => s + Number(o.total) + Number(o.tip_amount), 0), [completed]);
  const totalCashDrop = totalCashSales;

  const initials = getInitials(employeeName);

  // Fetch order items for check detail
  const openCheckDetail = async (order: OrderRow) => {
    setSelectedOrder(order);
    setLoadingItems(true);
    const { data } = await (supabase as any)
      .from("order_items")
      .select("*")
      .eq("order_id", order.id);
    setOrderItems(data || []);
    setLoadingItems(false);
  };

  if (!open) return null;

  // Check detail view
  if (selectedOrder) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center">
        <div className="absolute inset-0 bg-black/70" onClick={() => setSelectedOrder(null)} />
        <div className="relative z-10 w-[520px] max-h-[80vh] bg-[#1C1C1E] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0">
            <div className="flex items-center gap-3">
              <button onClick={() => setSelectedOrder(null)} className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/15 transition-colors">
                <ChevronLeft className="w-4 h-4 text-neutral-300" />
              </button>
              <div>
                <h2 className="text-sm font-bold text-white">Check #{selectedOrder.order_number}</h2>
                <p className="text-[11px] text-neutral-500">{new Date(selectedOrder.created_at).toLocaleString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium uppercase ${
                selectedOrder.status === "completed" || selectedOrder.status === "paid"
                  ? "bg-emerald-500/15 text-emerald-300"
                  : selectedOrder.status === "refunded"
                  ? "bg-red-500/15 text-red-300"
                  : "bg-amber-500/15 text-amber-300"
              }`}>
                {selectedOrder.status}
              </span>
              <button onClick={() => setSelectedOrder(null)} className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                <X className="w-4 h-4 text-neutral-400" />
              </button>
            </div>
          </div>

          {/* Order info */}
          <div className="grid grid-cols-3 gap-3 px-5 py-4 border-b border-white/10 shrink-0">
            <div>
              <p className="text-[10px] text-neutral-500 uppercase">Type</p>
              <p className="text-sm text-white font-medium">{selectedOrder.order_type}</p>
            </div>
            <div>
              <p className="text-[10px] text-neutral-500 uppercase">Payment</p>
              <p className="text-sm text-white font-medium flex items-center gap-1">
                {selectedOrder.payment_type?.toLowerCase() === "cash" ? <Banknote className="w-3.5 h-3.5 text-amber-400" /> : <CreditCard className="w-3.5 h-3.5 text-emerald-400" />}
                {selectedOrder.payment_type}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-neutral-500 uppercase">Guest</p>
              <p className="text-sm text-white font-medium">{selectedOrder.customer_name || "Guest"}</p>
            </div>
          </div>

          {/* Items */}
          <div className="flex-1 overflow-auto px-5 py-3">
            <p className="text-xs font-semibold text-neutral-400 uppercase mb-2">Products</p>
            {loadingItems ? (
              <p className="text-xs text-neutral-500 py-4 text-center">Loading...</p>
            ) : orderItems.length === 0 ? (
              <p className="text-xs text-neutral-500 py-4 text-center">No products found</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-left">
                    <th className="py-2 text-[10px] font-semibold text-neutral-500 uppercase">Product</th>
                    <th className="py-2 text-[10px] font-semibold text-neutral-500 uppercase">Category</th>
                    <th className="py-2 text-[10px] font-semibold text-neutral-500 uppercase text-right">Qty</th>
                    <th className="py-2 text-[10px] font-semibold text-neutral-500 uppercase text-right">Price</th>
                    <th className="py-2 text-[10px] font-semibold text-neutral-500 uppercase text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {orderItems.map(item => (
                    <tr key={item.id} className="border-b border-white/5">
                      <td className="py-2 text-xs text-white">{item.item_name}</td>
                      <td className="py-2 text-xs text-neutral-400">{item.category}</td>
                      <td className="py-2 text-xs text-neutral-300 text-right">{item.quantity}</td>
                      <td className="py-2 text-xs text-neutral-300 text-right">$ {Number(item.unit_price).toFixed(2)}</td>
                      <td className="py-2 text-xs text-white font-medium text-right">$ {Number(item.total_price).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Totals */}
          <div className="px-5 py-4 border-t border-white/10 shrink-0 space-y-1.5">
            <div className="flex justify-between text-xs text-neutral-400">
              <span>Subtotal</span>
              <span>$ {Number(selectedOrder.subtotal).toFixed(2)}</span>
            </div>
            {Number(selectedOrder.discount_amount) > 0 && (
              <div className="flex justify-between text-xs text-red-400">
                <span>Discount</span>
                <span>-$ {Number(selectedOrder.discount_amount).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-xs text-neutral-400">
              <span>Tax</span>
              <span>$ {Number(selectedOrder.tax_amount).toFixed(2)}</span>
            </div>
            {Number(selectedOrder.tip_amount) > 0 && (
              <div className="flex justify-between text-xs text-emerald-400">
                <span>Tip</span>
                <span>$ {Number(selectedOrder.tip_amount).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold text-white pt-1 border-t border-white/10">
              <span>Total</span>
              <span>$ {Number(selectedOrder.total).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative z-10 w-[780px] max-h-[88vh] bg-[#1C1C1E] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10 border border-white/20">
              <AvatarFallback className="text-sm font-semibold bg-neutral-700 text-white">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-base font-bold text-white">SHIFT SUMMARY</h2>
              <p className="text-xs text-neutral-400">{employeeName} - {employeeRole}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(v => !v)}
              className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${showFilters ? "bg-white/20" : "bg-white/10 hover:bg-white/15"}`}
            >
              <Filter className="w-4 h-4 text-neutral-300" />
            </button>
            <button className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/15 transition-colors">
              <Printer className="w-4 h-4 text-neutral-300" />
            </button>
            <button onClick={onClose} className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
              <X className="w-4 h-4 text-neutral-400" />
            </button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="px-6 py-3 border-b border-white/10 shrink-0 bg-white/[0.02]">
            <div className="flex items-end gap-3 flex-wrap">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-neutral-500 uppercase">From</label>
                <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)}
                  className="bg-white/10 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-white/30 w-[130px]" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-neutral-500 uppercase">To</label>
                <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)}
                  className="bg-white/10 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-white/30 w-[130px]" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-neutral-500 uppercase">Start Time</label>
                <input type="time" value={filterTimeFrom} onChange={e => setFilterTimeFrom(e.target.value)}
                  className="bg-white/10 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-white/30 w-[110px]" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-neutral-500 uppercase">End Time</label>
                <input type="time" value={filterTimeTo} onChange={e => setFilterTimeTo(e.target.value)}
                  className="bg-white/10 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-white/30 w-[110px]" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-neutral-500 uppercase">Employee</label>
                <select value={filterEmployee} onChange={e => setFilterEmployee(e.target.value)}
                  className="bg-white/10 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-white/30 w-[140px] appearance-none">
                  <option value="all" className="bg-neutral-800">All Employees</option>
                  {employees.map(e => <option key={e} value={e} className="bg-neutral-800">{e}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-neutral-500 uppercase">Revenue Center</label>
                <select value={filterRevenueCenter} onChange={e => setFilterRevenueCenter(e.target.value)}
                  className="bg-white/10 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-white/30 w-[130px] appearance-none">
                  <option value="all" className="bg-neutral-800">All</option>
                  <option value="Dine-In" className="bg-neutral-800">Dine-In</option>
                  <option value="Take Out" className="bg-neutral-800">Take Out</option>
                  <option value="Delivery" className="bg-neutral-800">Delivery</option>
                  <option value="Drive Thru" className="bg-neutral-800">Drive Thru</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Shift info bar */}
        <div className="flex items-center gap-4 px-6 py-2.5 bg-white/[0.03] border-b border-white/10 shrink-0 text-xs text-neutral-400">
          <span>{clockInDate}</span>
          <span>{clockInTime} - now</span>
          <span>Total: {totalHours}h</span>
        </div>

        {/* Key metrics */}
        <div className="grid grid-cols-3 gap-3 px-6 py-4 shrink-0">
          <div className="flex items-center gap-3 bg-white/5 rounded-xl p-4">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/15 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-[10px] text-neutral-500 uppercase tracking-wide">Total Card Sales</p>
              <p className="text-xl font-bold text-white">$ {totalCardSales.toFixed(2)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-white/5 rounded-xl p-4">
            <div className="w-10 h-10 rounded-lg bg-amber-500/15 flex items-center justify-center">
              <Banknote className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-[10px] text-neutral-500 uppercase tracking-wide">Total Cash Sales</p>
              <p className="text-xl font-bold text-white">$ {totalCashSales.toFixed(2)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-white/5 rounded-xl p-4">
            <div className="w-10 h-10 rounded-lg bg-purple-500/15 flex items-center justify-center">
              <Receipt className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-[10px] text-neutral-500 uppercase tracking-wide">Total Tips</p>
              <p className="text-xl font-bold text-white">$ {totalTips.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Bottom summary row */}
        <div className="flex items-center justify-between px-6 pb-3 shrink-0">
          <div className="flex items-center gap-6">
            <div>
              <p className="text-[10px] text-neutral-500 uppercase">Total</p>
              <p className="text-2xl font-bold text-white">$ {overallTotal.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-[10px] text-neutral-500 uppercase">Cash Drop</p>
              <p className="text-2xl font-bold text-white">$ {totalCashDrop.toFixed(2)}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/15 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-xs text-emerald-300 font-medium">{completed.length} Closed Checks</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/15 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-xs text-amber-300 font-medium">{pending.length} Pending</span>
            </div>
          </div>
        </div>

        {/* Transaction table */}
        <div className="flex-1 overflow-auto px-6 pb-4">
          {loading ? (
            <p className="text-xs text-neutral-500 py-8 text-center">Loading transactions...</p>
          ) : completed.length === 0 && pending.length === 0 ? (
            <p className="text-xs text-neutral-500 py-8 text-center">No transactions found for the selected filters</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-[#1C1C1E]">
                <tr className="border-b border-white/10 text-left">
                  <th className="py-2 text-xs font-semibold text-neutral-400 uppercase">Type</th>
                  <th className="py-2 text-xs font-semibold text-neutral-400 uppercase">Time</th>
                  <th className="py-2 text-xs font-semibold text-neutral-400 uppercase">Check #</th>
                  <th className="py-2 text-xs font-semibold text-neutral-400 uppercase text-right">Qty</th>
                  <th className="py-2 text-xs font-semibold text-neutral-400 uppercase text-right">Amount</th>
                  <th className="py-2 text-xs font-semibold text-neutral-400 uppercase text-right">Tip</th>
                </tr>
              </thead>
              <tbody>
                {[...completed, ...pending].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()).map(tx => {
                  const isCash = tx.payment_type?.toLowerCase() === "cash";
                  const isPending = tx.status !== "completed" && tx.status !== "paid";
                  return (
                    <tr
                      key={tx.id}
                      onClick={() => openCheckDetail(tx)}
                      className="border-b border-white/5 hover:bg-white/[0.05] transition-colors cursor-pointer"
                    >
                      <td className="py-2.5">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${isCash ? "text-amber-300" : "text-emerald-300"}`}>
                          {isCash ? <Banknote className="w-3.5 h-3.5" /> : <CreditCard className="w-3.5 h-3.5" />}
                          {tx.payment_type || "N/A"}
                        </span>
                      </td>
                      <td className="py-2.5 text-xs text-neutral-400">{formatTime(tx.created_at)}</td>
                      <td className="py-2.5">
                        <span className={`text-xs font-medium ${isPending ? "text-amber-300" : "text-white"}`}>
                          {tx.order_number}
                          {isPending && <span className="ml-1.5 text-[10px] text-amber-400">(pending)</span>}
                        </span>
                      </td>
                      <td className="py-2.5 text-xs text-neutral-300 text-right">-</td>
                      <td className="py-2.5 text-xs text-white font-medium text-right">$ {Number(tx.total).toFixed(2)}</td>
                      <td className="py-2.5 text-xs text-neutral-300 text-right">$ {Number(tx.tip_amount).toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
