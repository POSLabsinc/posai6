import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { X, Printer, CreditCard, Banknote, Receipt, ChevronLeft, ChevronDown, Calendar, Clock, Filter, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { InlineDatePicker } from "@/components/ui/inline-date-picker";

interface ShiftSummaryModalProps {
  open: boolean;
  onClose: () => void;
  employeeName: string;
  employeeRole: string;
  clockInTime: string;
  clockInDate: string;
  totalHours: string;
}

interface TicketOrder {
  id: string;
  order_number: number;
  order_type: string;
  payment_type: string;
  server: string | null;
  name: string | null;
  subtotal: number;
  discount: number;
  tax: number;
  tip: number;
  total: number;
  status: string;
  payment_status: string | null;
  created_at: string;
}

interface CashTx {
  id: string;
  type: string;
  amount: number;
  employee_name: string | null;
  reason: string;
  note: string | null;
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

type UnifiedRow = {
  id: string;
  kind: "order" | "pay_in" | "pay_out";
  paymentType: string;
  time: string;
  checkNumber: number | string;
  amount: number;
  tip: number;
  status: string;
  raw?: TicketOrder;
};

const getInitials = (name: string) =>
  name.split(" ").map(p => p[0]).join("").toUpperCase().substring(0, 2);

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const formatDateDisplay = (d: Date) =>
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
  const today = new Date();
  const [filterDateFrom, setFilterDateFrom] = useState(today);
  const [filterDateTo, setFilterDateTo] = useState(today);
  const [filterEmployee, setFilterEmployee] = useState("all");
  const [filterTimeFrom, setFilterTimeFrom] = useState("00:00");
  const [filterTimeTo, setFilterTimeTo] = useState("23:59");
  const [filterRevenueCenter, setFilterRevenueCenter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  // Date picker state
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const fromBtnRef = useRef<HTMLButtonElement>(null);
  const toBtnRef = useRef<HTMLButtonElement>(null);

  const [ticketOrders, setTicketOrders] = useState<TicketOrder[]>([]);
  const [cashTxs, setCashTxs] = useState<CashTx[]>([]);
  const [employees, setEmployees] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedOrder, setSelectedOrder] = useState<TicketOrder | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItemRow[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  // Fetch employee list
  useEffect(() => {
    if (!open) return;
    (async () => {
      const { data } = await supabase.from("employees").select("full_name").eq("is_archived", false);
      if (data) {
        const names = data.map((r: any) => r.full_name).filter(Boolean).sort();
        setEmployees([...new Set(names)] as string[]);
      }
    })();
  }, [open]);

  // Build ISO range
  const startISO = useMemo(() => {
    const d = new Date(filterDateFrom);
    const [h, m] = filterTimeFrom.split(":").map(Number);
    d.setHours(h, m, 0, 0);
    return d.toISOString();
  }, [filterDateFrom, filterTimeFrom]);

  const endISO = useMemo(() => {
    const d = new Date(filterDateTo);
    const [h, m] = filterTimeTo.split(":").map(Number);
    d.setHours(h, m, 59, 999);
    return d.toISOString();
  }, [filterDateTo, filterTimeTo]);

  // Fetch ticket_orders
  const fetchData = useCallback(async () => {
    if (!open) return;
    setLoading(true);

    // Ticket orders
    let orderQuery = supabase
      .from("ticket_orders" as any)
      .select("id,order_number,order_type,payment_type,server,name,subtotal,discount,tax,tip,total,status,payment_status,created_at")
      .gte("created_at", startISO)
      .lte("created_at", endISO)
      .order("created_at", { ascending: false });

    if (filterEmployee !== "all") {
      orderQuery = orderQuery.eq("server", filterEmployee);
    }
    if (filterRevenueCenter !== "all") {
      orderQuery = orderQuery.ilike("order_type", filterRevenueCenter);
    }

    // Cash transactions
    let cashQuery = supabase
      .from("cash_transactions")
      .select("id,type,amount,employee_name,reason,note,created_at")
      .gte("created_at", startISO)
      .lte("created_at", endISO)
      .order("created_at", { ascending: false });

    if (filterEmployee !== "all") {
      cashQuery = cashQuery.eq("employee_name", filterEmployee);
    }

    const [ordersRes, cashRes] = await Promise.all([orderQuery, cashQuery]);
    setTicketOrders((ordersRes.data as any) || []);
    setCashTxs((cashRes.data as any) || []);
    setLoading(false);
  }, [open, startISO, endISO, filterEmployee, filterRevenueCenter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Realtime subscriptions
  useEffect(() => {
    if (!open) return;
    const ch1 = supabase
      .channel("shift-ticket-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "ticket_orders" }, () => fetchData())
      .subscribe();
    const ch2 = supabase
      .channel("shift-cash-txs")
      .on("postgres_changes", { event: "*", schema: "public", table: "cash_transactions" }, () => fetchData())
      .subscribe();
    return () => {
      supabase.removeChannel(ch1);
      supabase.removeChannel(ch2);
    };
  }, [open, fetchData]);

  // Unified rows
  const unifiedRows = useMemo<UnifiedRow[]>(() => {
    const orderRows: UnifiedRow[] = ticketOrders.map(o => ({
      id: o.id,
      kind: "order",
      paymentType: o.payment_type || "N/A",
      time: o.created_at,
      checkNumber: o.order_number,
      amount: Number(o.total),
      tip: Number(o.tip),
      status: o.status,
      raw: o,
    }));
    const cashRows: UnifiedRow[] = cashTxs.map(c => ({
      id: c.id,
      kind: c.type === "pay_in" ? "pay_in" : "pay_out",
      paymentType: c.type === "pay_in" ? "Pay In" : "Pay Out",
      time: c.created_at,
      checkNumber: c.reason,
      amount: Number(c.amount),
      tip: 0,
      status: c.type,
    }));
    return [...orderRows, ...cashRows].sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
  }, [ticketOrders, cashTxs]);

  // Metrics
  const paidOrders = useMemo(() => ticketOrders.filter(o => o.status === "PAID" || o.payment_status === "completed"), [ticketOrders]);
  const pendingOrders = useMemo(() => ticketOrders.filter(o => o.status !== "PAID" && o.status !== "CANCELLED" && o.payment_status !== "completed"), [ticketOrders]);

  const totalCardSales = useMemo(() => paidOrders.filter(o => {
    const pt = (o.payment_type || "").toLowerCase();
    return pt === "card" || pt === "credit";
  }).reduce((s, o) => s + Number(o.total), 0), [paidOrders]);

  const totalCashSales = useMemo(() => paidOrders.filter(o => (o.payment_type || "").toLowerCase() === "cash").reduce((s, o) => s + Number(o.total), 0), [paidOrders]);
  const totalTips = useMemo(() => paidOrders.reduce((s, o) => s + Number(o.tip), 0), [paidOrders]);
  const overallTotal = useMemo(() => paidOrders.reduce((s, o) => s + Number(o.total) + Number(o.tip), 0), [paidOrders]);

  const totalPayIn = useMemo(() => cashTxs.filter(c => c.type === "pay_in").reduce((s, c) => s + Number(c.amount), 0), [cashTxs]);
  const totalPayOut = useMemo(() => cashTxs.filter(c => c.type === "pay_out").reduce((s, c) => s + Number(c.amount), 0), [cashTxs]);
  const totalCashDrop = totalCashSales + totalPayIn - totalPayOut;

  const initials = getInitials(employeeName);

  // Fetch order items for check detail
  const openCheckDetail = async (order: TicketOrder) => {
    setSelectedOrder(order);
    setLoadingItems(true);
    const { data } = await supabase.from("order_items").select("*").eq("order_id", order.id);
    // Also try ticket_order_items
    const { data: ticketItems } = await (supabase as any).from("ticket_order_items").select("*").eq("order_id", order.id);
    const items = (data && data.length > 0) ? data : (ticketItems || []);
    setOrderItems(items.map((i: any) => ({
      id: i.id,
      order_id: i.order_id,
      item_name: i.item_name || i.name || "Product",
      quantity: i.quantity || 1,
      unit_price: i.unit_price || i.price || 0,
      total_price: i.total_price || (i.price * (i.quantity || 1)) || 0,
      category: i.category || "",
    })));
    setLoadingItems(false);
  };

  // Date picker position helper
  const getPickerPosition = (ref: React.RefObject<HTMLButtonElement>) => {
    if (!ref.current) return { top: 200, right: 200 };
    const rect = ref.current.getBoundingClientRect();
    return { top: rect.bottom + 4, right: window.innerWidth - rect.right };
  };

  if (!open) return null;

  // Check detail view
  if (selectedOrder) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center">
        <div className="absolute inset-0 bg-black/70" onClick={() => setSelectedOrder(null)} />
        <div className="relative z-10 w-[520px] max-h-[80vh] bg-[#1C1C1E] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
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
                selectedOrder.status === "PAID" ? "bg-emerald-500/15 text-emerald-300"
                  : selectedOrder.status === "CANCELLED" ? "bg-red-500/15 text-red-300"
                  : "bg-amber-500/15 text-amber-300"
              }`}>
                {selectedOrder.status}
              </span>
              <button onClick={() => setSelectedOrder(null)} className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                <X className="w-4 h-4 text-neutral-400" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 px-5 py-4 border-b border-white/10 shrink-0">
            <div>
              <p className="text-[10px] text-neutral-500 uppercase">Type</p>
              <p className="text-sm text-white font-medium">{selectedOrder.order_type}</p>
            </div>
            <div>
              <p className="text-[10px] text-neutral-500 uppercase">Payment</p>
              <p className="text-sm text-white font-medium flex items-center gap-1">
                {(selectedOrder.payment_type || "").toLowerCase() === "cash" ? <Banknote className="w-3.5 h-3.5 text-amber-400" /> : <CreditCard className="w-3.5 h-3.5 text-emerald-400" />}
                {selectedOrder.payment_type || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-neutral-500 uppercase">Guest</p>
              <p className="text-sm text-white font-medium">{selectedOrder.name || "Guest"}</p>
            </div>
          </div>

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

          <div className="px-5 py-4 border-t border-white/10 shrink-0 space-y-1.5">
            <div className="flex justify-between text-xs text-neutral-400">
              <span>Subtotal</span><span>$ {Number(selectedOrder.subtotal).toFixed(2)}</span>
            </div>
            {Number(selectedOrder.discount) > 0 && (
              <div className="flex justify-between text-xs text-red-400">
                <span>Discount</span><span>-$ {Number(selectedOrder.discount).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-xs text-neutral-400">
              <span>Tax</span><span>$ {Number(selectedOrder.tax).toFixed(2)}</span>
            </div>
            {Number(selectedOrder.tip) > 0 && (
              <div className="flex justify-between text-xs text-emerald-400">
                <span>Tip</span><span>$ {Number(selectedOrder.tip).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold text-white pt-1 border-t border-white/10">
              <span>Total</span><span>$ {Number(selectedOrder.total).toFixed(2)}</span>
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
            <button onClick={onClose} className="w-8 h-8 rounded-sm flex items-center justify-center opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
              <X className="h-4 w-4 text-neutral-300" />
            </button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="px-6 py-3 border-b border-white/10 shrink-0 bg-white/[0.02]">
            <div className="flex items-end gap-3 flex-wrap">
              {/* From Date - iOS picker */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-neutral-500 uppercase">From</label>
                <button
                  ref={fromBtnRef}
                  onClick={() => setShowFromPicker(true)}
                  className="bg-white/10 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white outline-none hover:border-white/30 w-[140px] text-left flex items-center gap-2"
                >
                  <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                  {formatDateDisplay(filterDateFrom)}
                </button>
              </div>
              {/* To Date - iOS picker */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-neutral-500 uppercase">To</label>
                <button
                  ref={toBtnRef}
                  onClick={() => setShowToPicker(true)}
                  className="bg-white/10 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white outline-none hover:border-white/30 w-[140px] text-left flex items-center gap-2"
                >
                  <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                  {formatDateDisplay(filterDateTo)}
                </button>
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
        <div className="flex items-center px-6 py-3 shrink-0 gap-8 border-b border-white/10">
          <div>
            <p className="text-[11px] text-neutral-500 uppercase tracking-wider font-medium">Total</p>
            <p className="text-2xl font-bold text-white mt-0.5">$ {overallTotal.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-[11px] text-neutral-500 uppercase tracking-wider font-medium">Cash Drop</p>
            <p className="text-2xl font-bold text-white mt-0.5">$ {totalCashDrop.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-[11px] text-neutral-500 uppercase tracking-wider font-medium">Pay In</p>
            <p className="text-xl font-bold text-emerald-400 mt-0.5">$ {totalPayIn.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-[11px] text-neutral-500 uppercase tracking-wider font-medium">Pay Out</p>
            <p className="text-xl font-bold text-red-400 mt-0.5">$ {totalPayOut.toFixed(2)}</p>
          </div>
        </div>

        {/* Transaction table */}
        <div className="flex-1 overflow-auto px-6 py-3">
          {loading ? (
            <p className="text-xs text-neutral-500 py-8 text-center">Loading transactions...</p>
          ) : unifiedRows.length === 0 ? (
            <p className="text-xs text-neutral-500 py-8 text-center">No transactions found for the selected filters</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-[#1C1C1E] z-10">
                <tr className="border-b border-white/10 text-left">
                  <th className="py-3 pr-4 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">Type</th>
                  <th className="py-3 pr-4 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">Time</th>
                  <th className="py-3 pr-4 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">Check / Reason</th>
                  <th className="py-3 pl-4 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider text-right">Amount</th>
                  <th className="py-3 pl-4 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider text-right">Tip</th>
                </tr>
              </thead>
              <tbody>
                {unifiedRows.map(row => {
                  const isCash = row.paymentType.toLowerCase() === "cash";
                  const isPayIn = row.kind === "pay_in";
                  const isPayOut = row.kind === "pay_out";
                  const isOrder = row.kind === "order";
                  const isPending = isOrder && row.status !== "PAID" && row.status !== "CANCELLED";

                  return (
                    <tr
                      key={row.id}
                      onClick={() => isOrder && row.raw && openCheckDetail(row.raw)}
                      className={`border-b border-white/5 transition-colors ${isOrder ? "hover:bg-white/[0.05] cursor-pointer" : ""}`}
                    >
                      <td className="py-3 pr-4">
                        <span className={`inline-flex items-center gap-2 text-xs font-medium ${
                          isPayIn ? "text-emerald-300" : isPayOut ? "text-red-300" : isCash ? "text-amber-300" : "text-emerald-300"
                        }`}>
                          {isPayIn ? <ArrowDownLeft className="w-3.5 h-3.5" /> : isPayOut ? <ArrowUpRight className="w-3.5 h-3.5" /> : isCash ? <Banknote className="w-3.5 h-3.5" /> : <CreditCard className="w-3.5 h-3.5" />}
                          {row.paymentType}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-xs text-neutral-400">{formatTime(row.time)}</td>
                      <td className="py-3 pr-4">
                        <span className={`text-xs font-medium ${isPending ? "text-amber-300" : isPayIn || isPayOut ? "text-neutral-400" : "text-white"}`}>
                          {row.checkNumber}
                          {isPending && <span className="ml-1.5 text-[10px] text-amber-400">(pending)</span>}
                        </span>
                      </td>
                      <td className={`py-3 pl-4 text-xs font-medium text-right ${isPayIn ? "text-emerald-300" : isPayOut ? "text-red-300" : "text-white"}`}>
                        {isPayOut ? "-" : ""}$ {row.amount.toFixed(2)}
                      </td>
                      <td className="py-3 pl-4 text-xs text-neutral-300 text-right">
                        {isOrder ? `$ ${row.tip.toFixed(2)}` : "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* iOS-style date pickers */}
      <InlineDatePicker
        isOpen={showFromPicker}
        onClose={() => setShowFromPicker(false)}
        selectedDate={filterDateFrom}
        onDateChange={setFilterDateFrom}
        position={getPickerPosition(fromBtnRef)}
      />
      <InlineDatePicker
        isOpen={showToPicker}
        onClose={() => setShowToPicker(false)}
        selectedDate={filterDateTo}
        onDateChange={setFilterDateTo}
        position={getPickerPosition(toBtnRef)}
      />
    </div>
  );
}
