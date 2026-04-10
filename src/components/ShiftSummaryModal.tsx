import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { X, Printer, CreditCard, Banknote, Receipt, ChevronLeft, ChevronDown, Calendar, Clock, Filter, ArrowUpRight, ArrowDownLeft, Timer, Share2, Sparkles, FileText, Mail, MessageSquare, Download, Users } from "lucide-react";
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

type DatePreset = "today" | "yesterday" | "last7" | "thisMonth" | "thisYear" | "custom";

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

const DATE_PRESETS: { key: DatePreset; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "last7", label: "Last 7 Days" },
  { key: "thisMonth", label: "This Month" },
  { key: "thisYear", label: "This Year" },
  { key: "custom", label: "Custom" },
];

function applyDatePreset(preset: DatePreset): { from: Date; to: Date } {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  switch (preset) {
    case "today":
      return { from: startOfToday, to: startOfToday };
    case "yesterday": {
      const y = new Date(startOfToday);
      y.setDate(y.getDate() - 1);
      return { from: y, to: y };
    }
    case "last7": {
      const s = new Date(startOfToday);
      s.setDate(s.getDate() - 6);
      return { from: s, to: startOfToday };
    }
    case "thisMonth":
      return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: startOfToday };
    case "thisYear":
      return { from: new Date(now.getFullYear(), 0, 1), to: startOfToday };
    case "custom":
    default:
      return { from: startOfToday, to: startOfToday };
  }
}

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
  const [activePreset, setActivePreset] = useState<DatePreset>("today");

  // Share dropdown
  const [showShareMenu, setShowShareMenu] = useState(false);
  const shareRef = useRef<HTMLButtonElement>(null);

  // Employee dropdown
  const [showEmployeeMenu, setShowEmployeeMenu] = useState(false);
  const employeeMenuRef = useRef<HTMLButtonElement>(null);

  // Date preset dropdown
  const [showDatePresetMenu, setShowDatePresetMenu] = useState(false);
  const datePresetRef = useRef<HTMLButtonElement>(null);

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
    return orderRows.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
  }, [ticketOrders]);

  // Metrics
  const paidOrders = useMemo(() => ticketOrders.filter(o => o.status === "PAID" || o.payment_status === "completed"), [ticketOrders]);

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

  // Handle date preset selection
  const handlePresetSelect = (preset: DatePreset) => {
    setActivePreset(preset);
    if (preset === "custom") {
      setShowDatePresetMenu(false);
      setShowFilters(true);
      return;
    }
    const { from, to } = applyDatePreset(preset);
    setFilterDateFrom(from);
    setFilterDateTo(to);
    setShowDatePresetMenu(false);
  };

  // Handle share actions
  const handleShare = (action: string) => {
    setShowShareMenu(false);
    const reportText = `Shift Summary - ${employeeName}\nTotal: $${overallTotal.toFixed(2)}\nCard Sales: $${totalCardSales.toFixed(2)}\nCash Sales: $${totalCashSales.toFixed(2)}\nTips: $${totalTips.toFixed(2)}\nCash Drop: $${totalCashDrop.toFixed(2)}`;

    switch (action) {
      case "pdf": {
        const printWindow = window.open("", "_blank");
        if (printWindow) {
          printWindow.document.write(`
            <html><head><title>Shift Summary</title>
            <style>
              body { font-family: 'Montserrat', sans-serif; padding: 40px; color: #333; }
              h1 { font-size: 20px; margin-bottom: 4px; }
              h2 { font-size: 14px; color: #666; margin-bottom: 24px; }
              .metrics { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
              .metric { border: 1px solid #eee; border-radius: 8px; padding: 16px; }
              .metric-label { font-size: 11px; color: #999; text-transform: uppercase; }
              .metric-value { font-size: 22px; font-weight: 700; margin-top: 4px; }
              table { width: 100%; border-collapse: collapse; font-size: 13px; }
              th { text-align: left; border-bottom: 2px solid #eee; padding: 8px 4px; color: #999; font-size: 11px; text-transform: uppercase; }
              td { padding: 8px 4px; border-bottom: 1px solid #f5f5f5; }
              .text-right { text-align: right; }
            </style></head><body>
            <h1>Shift Summary</h1>
            <h2>${employeeName} - ${employeeRole} | ${formatDateDisplay(filterDateFrom)} to ${formatDateDisplay(filterDateTo)}</h2>
            <div class="metrics">
              <div class="metric"><div class="metric-label">Total Card Sales</div><div class="metric-value">$${totalCardSales.toFixed(2)}</div></div>
              <div class="metric"><div class="metric-label">Total Cash Sales</div><div class="metric-value">$${totalCashSales.toFixed(2)}</div></div>
              <div class="metric"><div class="metric-label">Total Tips</div><div class="metric-value">$${totalTips.toFixed(2)}</div></div>
              <div class="metric"><div class="metric-label">Total</div><div class="metric-value">$${overallTotal.toFixed(2)}</div></div>
            </div>
            <table>
              <thead><tr><th>Type</th><th>Time</th><th>Check</th><th class="text-right">Amount</th><th class="text-right">Tip</th></tr></thead>
              <tbody>${unifiedRows.map(r => `<tr><td>${r.paymentType}</td><td>${formatTime(r.time)}</td><td>${r.checkNumber}</td><td class="text-right">$${r.amount.toFixed(2)}</td><td class="text-right">$${r.tip.toFixed(2)}</td></tr>`).join("")}</tbody>
            </table>
            </body></html>
          `);
          printWindow.document.close();
          printWindow.print();
        }
        break;
      }
      case "email": {
        const subject = encodeURIComponent(`Shift Summary - ${employeeName}`);
        const body = encodeURIComponent(reportText);
        window.open(`mailto:?subject=${subject}&body=${body}`);
        break;
      }
      case "text": {
        if (navigator.share) {
          navigator.share({ title: "Shift Summary", text: reportText }).catch(() => {});
        } else {
          navigator.clipboard.writeText(reportText);
        }
        break;
      }
      case "download": {
        const csvRows = [
          ["Type", "Time", "Check/Reason", "Amount", "Tip"],
          ...unifiedRows.map(r => [r.paymentType, formatTime(r.time), String(r.checkNumber), r.amount.toFixed(2), r.tip.toFixed(2)])
        ];
        const csvContent = csvRows.map(r => r.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `shift-summary-${toDateInputVal(filterDateFrom)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        break;
      }
    }
  };

  // Fetch order items for check detail
  const openCheckDetail = async (order: TicketOrder) => {
    setSelectedOrder(order);
    setLoadingItems(true);
    const { data } = await supabase.from("order_items").select("*").eq("order_id", order.id);
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
          <div className="flex items-center gap-1.5">
            {/* Date Preset */}
            <div className="relative">
              <button
                ref={datePresetRef}
                onClick={() => { setShowDatePresetMenu(v => !v); setShowShareMenu(false); setShowEmployeeMenu(false); }}
                className={`h-9 rounded-lg flex items-center gap-1.5 px-3 transition-colors text-xs font-medium ${showDatePresetMenu ? "bg-white/20 text-white" : "bg-white/10 hover:bg-white/15 text-neutral-300"}`}
              >
                <Calendar className="w-3.5 h-3.5" />
                {DATE_PRESETS.find(p => p.key === activePreset)?.label || "Today"}
                <ChevronDown className="w-3 h-3 opacity-50" />
              </button>
              {showDatePresetMenu && (
                <>
                  <div className="fixed inset-0 z-[100]" onClick={() => setShowDatePresetMenu(false)} />
                  <div className="absolute right-0 top-full mt-1 z-[101] w-[160px] bg-neutral-800 border border-white/10 rounded-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
                    {DATE_PRESETS.map(p => (
                      <button
                        key={p.key}
                        onClick={() => handlePresetSelect(p.key)}
                        className={`w-full text-left px-4 py-2.5 text-xs transition-colors ${activePreset === p.key ? "text-white bg-white/10 font-medium" : "text-neutral-400 hover:bg-white/5 hover:text-white"}`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Employee Filter */}
            <div className="relative">
              <button
                ref={employeeMenuRef}
                onClick={() => { setShowEmployeeMenu(v => !v); setShowShareMenu(false); setShowDatePresetMenu(false); }}
                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${showEmployeeMenu || filterEmployee !== "all" ? "bg-white/20" : "bg-white/10 hover:bg-white/15"}`}
                title="Employee Filter"
              >
                <Users className="w-4 h-4 text-neutral-300" />
              </button>
              {showEmployeeMenu && (
                <>
                  <div className="fixed inset-0 z-[100]" onClick={() => setShowEmployeeMenu(false)} />
                  <div className="absolute right-0 top-full mt-1 z-[101] w-[180px] bg-neutral-800 border border-white/10 rounded-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150 max-h-[280px] overflow-y-auto scrollbar-hide">
                    <button
                      onClick={() => { setFilterEmployee("all"); setShowEmployeeMenu(false); }}
                      className={`w-full text-left px-4 py-2.5 text-xs transition-colors ${filterEmployee === "all" ? "text-white bg-white/10 font-medium" : "text-neutral-400 hover:bg-white/5 hover:text-white"}`}
                    >
                      All Employees
                    </button>
                    {employees.map(e => (
                      <button
                        key={e}
                        onClick={() => { setFilterEmployee(e); setShowEmployeeMenu(false); }}
                        className={`w-full text-left px-4 py-2.5 text-xs transition-colors ${filterEmployee === e ? "text-white bg-white/10 font-medium" : "text-neutral-400 hover:bg-white/5 hover:text-white"}`}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Filter toggle */}
            <button
              onClick={() => setShowFilters(v => !v)}
              className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${showFilters ? "bg-white/20" : "bg-white/10 hover:bg-white/15"}`}
              title="Advanced Filters"
            >
              <Filter className="w-4 h-4 text-neutral-300" />
            </button>

            {/* AI Icon */}
            <button
              className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/15 transition-colors"
              title="AI Insights"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
            </button>

            {/* Share */}
            <div className="relative">
              <button
                ref={shareRef}
                onClick={() => { setShowShareMenu(v => !v); setShowDatePresetMenu(false); setShowEmployeeMenu(false); }}
                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${showShareMenu ? "bg-white/20" : "bg-white/10 hover:bg-white/15"}`}
                title="Share"
              >
                <Share2 className="w-4 h-4 text-neutral-300" />
              </button>
              {showShareMenu && (
                <>
                  <div className="fixed inset-0 z-[100]" onClick={() => setShowShareMenu(false)} />
                  <div className="absolute right-0 top-full mt-1 z-[101] w-[180px] bg-neutral-800 border border-white/10 rounded-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
                    <button onClick={() => handleShare("pdf")} className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-neutral-300 hover:bg-white/5 hover:text-white transition-colors">
                      <FileText className="w-3.5 h-3.5" /> Export as PDF
                    </button>
                    <button onClick={() => handleShare("email")} className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-neutral-300 hover:bg-white/5 hover:text-white transition-colors">
                      <Mail className="w-3.5 h-3.5" /> Send via Email
                    </button>
                    <button onClick={() => handleShare("text")} className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-neutral-300 hover:bg-white/5 hover:text-white transition-colors">
                      <MessageSquare className="w-3.5 h-3.5" /> Share via Text
                    </button>
                    <button onClick={() => handleShare("download")} className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-neutral-300 hover:bg-white/5 hover:text-white transition-colors">
                      <Download className="w-3.5 h-3.5" /> Download CSV
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Print */}
            <button
              onClick={() => handleShare("pdf")}
              className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/15 transition-colors"
              title="Print"
            >
              <Printer className="w-4 h-4 text-neutral-300" />
            </button>

            {/* Close */}
            <button onClick={onClose} className="w-8 h-8 rounded-sm flex items-center justify-center opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
              <X className="h-4 w-4 text-neutral-300" />
            </button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="px-6 py-3 border-b border-white/10 shrink-0 bg-white/[0.02]">
            <div className="flex items-end gap-3 flex-wrap">
              {/* From Date */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-neutral-500 uppercase">From</label>
                <button
                  ref={fromBtnRef}
                  onClick={() => { setShowFromPicker(true); setActivePreset("custom"); }}
                  className="bg-white/10 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white outline-none hover:border-white/30 w-[140px] text-left flex items-center gap-2"
                >
                  <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                  {formatDateDisplay(filterDateFrom)}
                </button>
              </div>
              {/* To Date */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-neutral-500 uppercase">To</label>
                <button
                  ref={toBtnRef}
                  onClick={() => { setShowToPicker(true); setActivePreset("custom"); }}
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
          <span>{clockInTime || new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - now</span>
          <span>Total: {totalHours || "0.0"}h</span>
        </div>

        {/* Key metrics - 4 cards */}
        <div className="grid grid-cols-4 gap-3 px-6 py-4 shrink-0">
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
          <div className="flex items-center gap-3 bg-white/5 rounded-xl p-4">
            <div className="w-10 h-10 rounded-lg bg-blue-500/15 flex items-center justify-center">
              <Timer className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-[10px] text-neutral-500 uppercase tracking-wide">Total Cash Time</p>
              <p className="text-xl font-bold text-white">{totalHours || "0.0"}h</p>
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
                  const isPending = row.status !== "PAID" && row.status !== "CANCELLED";

                  return (
                    <tr
                      key={row.id}
                      onClick={() => row.raw && openCheckDetail(row.raw)}
                      className="border-b border-white/5 transition-colors hover:bg-white/[0.05] cursor-pointer"
                    >
                      <td className="py-3 pr-4">
                        <span className={`inline-flex items-center gap-2 text-xs font-medium ${isCash ? "text-amber-300" : "text-emerald-300"}`}>
                          {isCash ? <Banknote className="w-3.5 h-3.5" /> : <CreditCard className="w-3.5 h-3.5" />}
                          {row.paymentType}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-xs text-neutral-400">{formatTime(row.time)}</td>
                      <td className="py-3 pr-4">
                        <span className={`text-xs font-medium ${isPending ? "text-amber-300" : "text-white"}`}>
                          {row.checkNumber}
                          {isPending && <span className="ml-1.5 text-[10px] text-amber-400">(pending)</span>}
                        </span>
                      </td>
                      <td className="py-3 pl-4 text-xs font-medium text-right text-white">
                        $ {row.amount.toFixed(2)}
                      </td>
                      <td className="py-3 pl-4 text-xs text-neutral-300 text-right">
                        $ {row.tip.toFixed(2)}
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
