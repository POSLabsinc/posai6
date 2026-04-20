import { useState, useEffect, useMemo, useCallback } from "react";
import { X, Printer, CreditCard, Banknote, Receipt, ChevronLeft, Calendar, DollarSign, Users, Share2, FileText, Mail, MessageSquare, Download, RotateCcw, Clock, Send, Phone, SlidersHorizontal, ChevronRight, ArrowDownToLine } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { OverlayTimePicker } from "@/components/ui/overlay-time-picker";
import AnimatedAIIcon from "@/components/AnimatedAIIcon";
import ShiftAIChatPanel from "@/components/ShiftAIChatPanel";
import { useIsMobile } from "@/hooks/use-mobile";

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
  kind: "order";
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

const REVENUE_CENTERS = ["Dine-In", "Take Out", "Delivery", "Drive Thru"];

export default function ShiftSummaryModal({
  open, onClose, employeeName, employeeRole, clockInTime, clockInDate, totalHours
}: ShiftSummaryModalProps) {
  const isMobile = useIsMobile();
  const today = new Date();
  const [filterDateFrom, setFilterDateFrom] = useState(today);
  const [filterDateTo, setFilterDateTo] = useState(today);
  const [filterEmployee, setFilterEmployee] = useState<string | null>(null);
  const [filterTimeFrom, setFilterTimeFrom] = useState("00:00");
  const [filterTimeTo, setFilterTimeTo] = useState("23:59");
  const [filterRevenueCenter, setFilterRevenueCenter] = useState<string | null>(null);
  const [activePreset, setActivePreset] = useState<DatePreset>("today");

  const [showTimeFromPicker, setShowTimeFromPicker] = useState(false);
  const [showTimeToPicker, setShowTimeToPicker] = useState(false);

  const [ticketOrders, setTicketOrders] = useState<TicketOrder[]>([]);
  const [cashTxs, setCashTxs] = useState<CashTx[]>([]);
  const [employees, setEmployees] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedOrder, setSelectedOrder] = useState<TicketOrder | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItemRow[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  // Share popup state
  const [sharePopup, setSharePopup] = useState<"email" | "text" | null>(null);
  const [shareInput, setShareInput] = useState("");
  const [shareSending, setShareSending] = useState(false);

  // AI Chat state
  const [showAIChat, setShowAIChat] = useState(false);
  const [aiExpanded, setAiExpanded] = useState(false);

  // Cash Drop popup state
  const [showCashDropPopup, setShowCashDropPopup] = useState(false);
  const [cashDropAmount, setCashDropAmount] = useState("");
  const [cashDropReason, setCashDropReason] = useState("");
  const [cashDropMismatch, setCashDropMismatch] = useState(false);
  const [cashDropSettled, setCashDropSettled] = useState(false);
  const [cashDropSettledAmount, setCashDropSettledAmount] = useState(0);

  // Mobile filter bottom sheet state
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [filterSheetView, setFilterSheetView] = useState<"main" | "revenue" | "date" | "time" | "employee">("main");

  const hasActiveFilters = filterEmployee || filterRevenueCenter || activePreset !== "today" || filterTimeFrom !== "00:00" || filterTimeTo !== "23:59";

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

  const startISO = useMemo(() => {
    try {
      const d = filterDateFrom instanceof Date && !isNaN(filterDateFrom.getTime())
        ? new Date(filterDateFrom.getTime())
        : new Date();
      const parts = (filterTimeFrom || "00:00").split(":").map(Number);
      d.setHours(parts[0] || 0, parts[1] || 0, 0, 0);
      return d.toISOString();
    } catch {
      return new Date().toISOString();
    }
  }, [filterDateFrom, filterTimeFrom]);

  const endISO = useMemo(() => {
    try {
      const d = filterDateTo instanceof Date && !isNaN(filterDateTo.getTime())
        ? new Date(filterDateTo.getTime())
        : new Date();
      const parts = (filterTimeTo || "23:59").split(":").map(Number);
      d.setHours(parts[0] || 23, parts[1] || 59, 59, 999);
      return d.toISOString();
    } catch {
      return new Date().toISOString();
    }
  }, [filterDateTo, filterTimeTo]);

  const fetchData = useCallback(async () => {
    if (!open) return;
    setLoading(true);

    let orderQuery = supabase
      .from("ticket_orders" as any)
      .select("id,order_number,order_type,payment_type,server,name,subtotal,discount,tax,tip,total,status,payment_status,created_at")
      .gte("created_at", startISO)
      .lte("created_at", endISO)
      .order("created_at", { ascending: false });

    if (filterEmployee) orderQuery = orderQuery.eq("server", filterEmployee);
    if (filterRevenueCenter) orderQuery = orderQuery.ilike("order_type", filterRevenueCenter);

    let cashQuery = supabase
      .from("cash_transactions")
      .select("id,type,amount,employee_name,reason,note,created_at")
      .gte("created_at", startISO)
      .lte("created_at", endISO)
      .order("created_at", { ascending: false });

    if (filterEmployee) cashQuery = cashQuery.eq("employee_name", filterEmployee);

    const [ordersRes, cashRes] = await Promise.all([orderQuery, cashQuery]);
    setTicketOrders((ordersRes.data as any) || []);
    setCashTxs((cashRes.data as any) || []);
    setLoading(false);
  }, [open, startISO, endISO, filterEmployee, filterRevenueCenter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (!open) return;
    const ch1 = supabase.channel("shift-ticket-orders").on("postgres_changes", { event: "*", schema: "public", table: "ticket_orders" }, () => fetchData()).subscribe();
    const ch2 = supabase.channel("shift-cash-txs").on("postgres_changes", { event: "*", schema: "public", table: "cash_transactions" }, () => fetchData()).subscribe();
    return () => { supabase.removeChannel(ch1); supabase.removeChannel(ch2); };
  }, [open, fetchData]);

  const unifiedRows = useMemo<UnifiedRow[]>(() => {
    return ticketOrders.map(o => ({
      id: o.id,
      kind: "order" as const,
      paymentType: o.payment_type || "N/A",
      time: o.created_at,
      checkNumber: o.order_number,
      amount: Number(o.total),
      tip: Number(o.tip),
      status: o.status,
      raw: o,
    })).sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
  }, [ticketOrders]);

  // Metrics
  const paidOrders = useMemo(() => ticketOrders.filter(o => o.status === "PAID" || o.payment_status === "completed"), [ticketOrders]);
  const hasRealData = paidOrders.length > 0;
  const totalCardSales = useMemo(() => hasRealData ? paidOrders.filter(o => { const pt = (o.payment_type || "").toLowerCase(); return pt !== "cash"; }).reduce((s, o) => s + Number(o.total), 0) : 250.00, [paidOrders, hasRealData]);
  const totalCashSales = useMemo(() => hasRealData ? paidOrders.filter(o => (o.payment_type || "").toLowerCase() === "cash").reduce((s, o) => s + Number(o.total), 0) : 120.00, [paidOrders, hasRealData]);
  const totalTips = useMemo(() => hasRealData ? paidOrders.reduce((s, o) => s + Number(o.tip), 0) : 40.00, [paidOrders, hasRealData]);
  const totalCashTips = useMemo(() => hasRealData ? paidOrders.filter(o => (o.payment_type || "").toLowerCase() === "cash").reduce((s, o) => s + Number(o.tip), 0) : 20.00, [paidOrders, hasRealData]);
  const tipsPayable = totalTips - totalCashTips;

  const overallTotal = useMemo(() => hasRealData ? paidOrders.reduce((s, o) => s + Number(o.total), 0) : 370.00, [paidOrders, hasRealData]);
  const totalPayIn = useMemo(() => cashTxs.filter(c => c.type === "pay_in").reduce((s, c) => s + Number(c.amount), 0), [cashTxs]);
  const totalPayOut = useMemo(() => cashTxs.filter(c => c.type === "pay_out").reduce((s, c) => s + Number(c.amount), 0), [cashTxs]);
  
  // Card tips = tips from non-cash (card) orders
  const cardTips = useMemo(() => hasRealData 
    ? paidOrders.filter(o => (o.payment_type || "").toLowerCase() !== "cash").reduce((s, o) => s + Number(o.tip), 0) 
    : 20.00, [paidOrders, hasRealData]);
  // Cash in Hand = total cash sales (includes cash tips collected physically)
  const cashInHand = totalCashSales;
  // Cash Drop = Cash in Hand - Card Tips (card tips are digital, not in drawer)
  // If card tips > cash in hand, cash drop = 0
  const totalCashDrop = Math.max(0, cashInHand - cardTips);

  const initials = getInitials(employeeName);

  // Aggregate by payment type
  const paymentTypeSummary = useMemo(() => {
    const map = new Map<string, { qty: number; amount: number; tips: number; totalTips: number }>();
    paidOrders.forEach(o => {
      const pt = o.payment_type || "N/A";
      const existing = map.get(pt) || { qty: 0, amount: 0, tips: 0, totalTips: 0 };
      map.set(pt, {
        qty: existing.qty + 1,
        amount: existing.amount + Number(o.total),
        tips: existing.tips + Number(o.tip),
        totalTips: existing.totalTips + Number(o.tip),
      });
    });
    const result = Array.from(map.entries()).map(([type, data]) => ({ type, ...data }));
    // Default example rows when no transactions exist
    if (result.length === 0) {
      return [
        { type: "Cash", qty: 2, amount: 120.00, tips: 20.00, totalTips: 20.00 },
        { type: "Card", qty: 3, amount: 250.00, tips: 20.00, totalTips: 20.00 },
        { type: "Mobile Pay", qty: 2, amount: 95.50, tips: 12.00, totalTips: 12.00 },
        { type: "Gift Card", qty: 1, amount: 45.00, tips: 5.00, totalTips: 5.00 },
        { type: "Online Order", qty: 4, amount: 180.75, tips: 22.50, totalTips: 22.50 },
      ];
    }
    return result;
  }, [paidOrders]);

  const handlePresetSelect = (preset: DatePreset) => {
    setActivePreset(preset);
    if (preset === "custom") return;
    const { from, to } = applyDatePreset(preset);
    setFilterDateFrom(from);
    setFilterDateTo(to);
  };

  const clearAllFilters = () => {
    setFilterEmployee(null);
    setFilterRevenueCenter(null);
    setActivePreset("today");
    setFilterTimeFrom("00:00");
    setFilterTimeTo("23:59");
    const { from, to } = applyDatePreset("today");
    setFilterDateFrom(from);
    setFilterDateTo(to);
  };

  const buildReportText = () => {
    return `Shift Summary - ${employeeName}\nDate: ${formatDateDisplay(filterDateFrom)}\nTotal: $${overallTotal.toFixed(2)}\nCard Sales: $${totalCardSales.toFixed(2)}\nCash Sales: $${totalCashSales.toFixed(2)}\nTips: $${totalTips.toFixed(2)}\nTips Payable: $${tipsPayable.toFixed(2)}\n\nBreakdown:\n${paymentTypeSummary.map(r => `${r.type}: ${r.qty} orders, $${r.amount.toFixed(2)}, Tips: $${r.totalTips.toFixed(2)}`).join("\n")}`;
  };

  const handleShare = (action: string) => {
    switch (action) {
      case "pdf": {
        const printWindow = window.open("", "_blank");
        if (printWindow) {
          printWindow.document.write(`
            <html><head><title>Shift Summary</title>
            <style>
              body { font-family: 'Montserrat', sans-serif; padding: 40px; color: #333; }
              h1 { font-size: 22px; margin-bottom: 4px; }
              h2 { font-size: 15px; color: #666; margin-bottom: 24px; }
              .metrics { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
              .metric { border: 1px solid #eee; border-radius: 8px; padding: 16px; }
              .metric-label { font-size: 12px; color: #999; text-transform: uppercase; }
              .metric-value { font-size: 24px; font-weight: 700; margin-top: 4px; }
              table { width: 100%; border-collapse: collapse; font-size: 14px; }
              th { text-align: left; border-bottom: 2px solid #eee; padding: 10px 4px; color: #999; font-size: 12px; text-transform: uppercase; }
              td { padding: 10px 4px; border-bottom: 1px solid #f5f5f5; }
              .text-right { text-align: right; }
            </style></head><body>
            <h1>Shift Summary</h1>
            <h2>${employeeName} - ${employeeRole} | ${formatDateDisplay(filterDateFrom)}</h2>
            <div class="metrics">
              <div class="metric"><div class="metric-label">Total Card Sales</div><div class="metric-value">$${totalCardSales.toFixed(2)}</div></div>
              <div class="metric"><div class="metric-label">Total Cash Sales</div><div class="metric-value">$${totalCashSales.toFixed(2)}</div></div>
              <div class="metric"><div class="metric-label">Total Tips</div><div class="metric-value">$${totalTips.toFixed(2)}</div></div>
              <div class="metric"><div class="metric-label">Tips Payable</div><div class="metric-value">$${tipsPayable.toFixed(2)}</div></div>
            </div>
            <table>
              <thead><tr><th>Type</th><th>Qty</th><th class="text-right">Amount</th><th class="text-right">Tip</th><th class="text-right">Total Tips</th></tr></thead>
              <tbody>${paymentTypeSummary.map(r => `<tr><td>${r.type}</td><td>${r.qty}</td><td class="text-right">$${r.amount.toFixed(2)}</td><td class="text-right">$${r.tips.toFixed(2)}</td><td class="text-right">$${r.totalTips.toFixed(2)}</td></tr>`).join("")}</tbody>
            </table>
            </body></html>
          `);
          printWindow.document.close();
          printWindow.print();
        }
        break;
      }
      case "email":
        setSharePopup("email");
        setShareInput("");
        break;
      case "text":
        setSharePopup("text");
        setShareInput("");
        break;
      case "download": {
        const csvRows = [
          ["Type", "Quantity", "Amount", "Tips", "Total Tips"],
          ...paymentTypeSummary.map(r => [r.type, String(r.qty), r.amount.toFixed(2), r.tips.toFixed(2), r.totalTips.toFixed(2)])
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

  const handleSendShare = () => {
    if (!shareInput.trim()) return;
    const reportText = buildReportText();
    setShareSending(true);

    if (sharePopup === "email") {
      const subject = encodeURIComponent(`Shift Summary - ${employeeName}`);
      const body = encodeURIComponent(reportText);
      window.open(`mailto:${encodeURIComponent(shareInput)}?subject=${subject}&body=${body}`);
    } else if (sharePopup === "text") {
      const smsBody = encodeURIComponent(reportText);
      window.open(`sms:${shareInput}?body=${smsBody}`);
    }

    setTimeout(() => {
      setShareSending(false);
      setSharePopup(null);
      setShareInput("");
    }, 500);
  };

  // AI Chat context
  const shiftContextForAI = useMemo(() => ({
    employeeName,
    employeeRole,
    totalHours,
    totalCardSales,
    totalCashSales,
    totalTips,
    totalCashTips,
    cardTips,
    cashInHand,
    tipsPayable,
    overallTotal,
    totalCashDrop,
    orderCount: paidOrders.length,
    paymentBreakdown: paymentTypeSummary,
    dateRange: `${formatDateDisplay(filterDateFrom)} to ${formatDateDisplay(filterDateTo)}`,
  }), [employeeName, employeeRole, totalHours, totalCardSales, totalCashSales, totalTips, totalCashTips, cardTips, cashInHand, tipsPayable, overallTotal, totalCashDrop, paidOrders.length, paymentTypeSummary, filterDateFrom, filterDateTo]);

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

  if (!open) return null;

  // Share email/text popup
  if (sharePopup) {
    const isEmail = sharePopup === "email";
    return (
      <div className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center">
        <div className="absolute inset-0 bg-black/70" onClick={() => setSharePopup(null)} />
        <div className="relative z-10 w-full rounded-t-2xl md:w-[440px] md:rounded-2xl bg-[#1C1C1E] shadow-2xl overflow-hidden">
          <div className="flex justify-center pt-2 pb-1 md:hidden">
            <div className="w-10 h-1 rounded-full bg-white/20" />
          </div>
          <div className="flex items-center justify-between px-5 md:px-6 py-4 md:py-5 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                {isEmail ? <Mail className="w-5 h-5 text-white" /> : <Phone className="w-5 h-5 text-white" />}
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">{isEmail ? "Send via Email" : "Send via Text"}</h2>
                <p className="text-sm text-neutral-400">Share shift summary</p>
              </div>
            </div>
            <button onClick={() => setSharePopup(null)} className="w-9 h-9 rounded-sm flex items-center justify-center opacity-70 hover:opacity-100 transition-opacity">
              <X className="h-5 w-5 text-neutral-300" />
            </button>
          </div>

          <div className="px-6 py-6">
            <label className="text-sm font-medium text-neutral-300 mb-2 block">
              {isEmail ? "Email Address" : "Phone Number"}
            </label>
            <div className="flex gap-3">
              <input
                type={isEmail ? "email" : "tel"}
                value={shareInput}
                onChange={e => setShareInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSendShare()}
                placeholder={isEmail ? "Enter email address" : "Enter phone number"}
                className="flex-1 px-4 py-3 bg-neutral-800 border border-white/10 rounded-xl text-base text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-white/20"
                autoFocus
              />
              <button
                onClick={handleSendShare}
                disabled={!shareInput.trim() || shareSending}
                className="px-5 py-3 bg-white text-black font-semibold rounded-xl hover:bg-neutral-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 text-base"
              >
                <Send className="w-4 h-4" />
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // AI Chat view - mobile: full modal, desktop: side panel overlay
  if (showAIChat && isMobile) {
    return (
      <div className="fixed inset-0 z-[9999] flex flex-col bg-[#1C1C1E]">
        <ShiftAIChatPanel
          onClose={() => setShowAIChat(false)}
          shiftContext={shiftContextForAI}
          shiftActions={{
            exportPDF: () => { setShowAIChat(false); setTimeout(() => handleShare("pdf"), 100); },
            sendEmail: () => { setShowAIChat(false); setTimeout(() => handleShare("email"), 100); },
            sendText: () => { setShowAIChat(false); setTimeout(() => handleShare("text"), 100); },
            downloadCSV: () => { setShowAIChat(false); setTimeout(() => handleShare("download"), 100); },
          }}
        />
      </div>
    );
  }

  // Check detail view
  if (selectedOrder) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center">
        <div className="absolute inset-0 bg-black/70" onClick={() => setSelectedOrder(null)} />
        <div className="relative z-10 w-full max-h-[90vh] rounded-t-2xl md:w-[580px] md:max-h-[85vh] md:rounded-2xl bg-[#1C1C1E] shadow-2xl overflow-hidden flex flex-col">
          <div className="flex justify-center pt-2 pb-1 md:hidden">
            <div className="w-10 h-1 rounded-full bg-white/20" />
          </div>
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 shrink-0">
            <div className="flex items-center gap-3">
              <button onClick={() => setSelectedOrder(null)} className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/15 transition-colors">
                <ChevronLeft className="w-5 h-5 text-neutral-300" />
              </button>
              <div>
                <h2 className="text-base font-bold text-white">Check #{selectedOrder.order_number}</h2>
                <p className="text-xs text-neutral-500">{new Date(selectedOrder.created_at).toLocaleString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium uppercase ${
                selectedOrder.status === "PAID" ? "bg-emerald-500/15 text-emerald-300"
                  : selectedOrder.status === "CANCELLED" ? "bg-red-500/15 text-red-300"
                  : "bg-amber-500/15 text-amber-300"
              }`}>
                {selectedOrder.status}
              </span>
              <button onClick={() => setSelectedOrder(null)} className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                <X className="w-5 h-5 text-neutral-400" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 px-6 py-4 border-b border-white/10 shrink-0">
            <div>
              <p className="text-xs text-neutral-500 uppercase">Type</p>
              <p className="text-sm text-white font-medium">{selectedOrder.order_type}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-500 uppercase">Payment</p>
              <p className="text-sm text-white font-medium flex items-center gap-1">
                {(selectedOrder.payment_type || "").toLowerCase() === "cash" ? <Banknote className="w-4 h-4 text-amber-400" /> : <CreditCard className="w-4 h-4 text-emerald-400" />}
                {selectedOrder.payment_type || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-xs text-neutral-500 uppercase">Guest</p>
              <p className="text-sm text-white font-medium">{selectedOrder.name || "Guest"}</p>
            </div>
          </div>

          <div className="flex-1 overflow-auto px-6 py-4">
            <p className="text-xs font-semibold text-neutral-400 uppercase mb-3">Products</p>
            {loadingItems ? (
              <p className="text-sm text-neutral-500 py-4 text-center">Loading...</p>
            ) : orderItems.length === 0 ? (
              <p className="text-sm text-neutral-500 py-4 text-center">No products found</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-left">
                    <th className="py-2.5 text-xs font-semibold text-neutral-500 uppercase">Product</th>
                    <th className="py-2.5 text-xs font-semibold text-neutral-500 uppercase">Category</th>
                    <th className="py-2.5 text-xs font-semibold text-neutral-500 uppercase text-right">Qty</th>
                    <th className="py-2.5 text-xs font-semibold text-neutral-500 uppercase text-right">Price</th>
                    <th className="py-2.5 text-xs font-semibold text-neutral-500 uppercase text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {orderItems.map(item => (
                    <tr key={item.id} className="border-b border-white/5">
                      <td className="py-2.5 text-sm text-white">{item.item_name}</td>
                      <td className="py-2.5 text-sm text-neutral-400">{item.category}</td>
                      <td className="py-2.5 text-sm text-neutral-300 text-right">{item.quantity}</td>
                      <td className="py-2.5 text-sm text-neutral-300 text-right">$ {Number(item.unit_price).toFixed(2)}</td>
                      <td className="py-2.5 text-sm text-white font-medium text-right">$ {Number(item.total_price).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="px-6 py-4 border-t border-white/10 shrink-0 space-y-2">
            <div className="flex justify-between text-sm text-neutral-400">
              <span>Subtotal</span><span>$ {Number(selectedOrder.subtotal).toFixed(2)}</span>
            </div>
            {Number(selectedOrder.discount) > 0 && (
              <div className="flex justify-between text-sm text-red-400">
                <span>Discount</span><span>-$ {Number(selectedOrder.discount).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm text-neutral-400">
              <span>Tax</span><span>$ {Number(selectedOrder.tax).toFixed(2)}</span>
            </div>
            {Number(selectedOrder.tip) > 0 && (
              <div className="flex justify-between text-sm text-emerald-400">
                <span>Tip</span><span>$ {Number(selectedOrder.tip).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold text-white pt-2 border-t border-white/10">
              <span>Total</span><span>$ {Number(selectedOrder.total).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Mobile filter bottom sheet
  const renderFilterSheet = () => {
    if (!showFilterSheet) return null;
    return (
      <div className="fixed inset-0 z-[10001] flex items-end justify-center">
        <div className="absolute inset-0 bg-black/60" onClick={() => { setShowFilterSheet(false); setFilterSheetView("main"); }} />
        <div className="relative z-10 w-full rounded-t-2xl bg-[#1C1C1E] shadow-2xl overflow-hidden max-h-[70vh] flex flex-col">
          <div className="flex justify-center pt-2 pb-1 shrink-0">
            <div className="w-10 h-1 rounded-full bg-white/20" />
          </div>

          {filterSheetView === "main" ? (
            <>
              <div className="px-5 py-4 border-b border-white/10 shrink-0">
                <h3 className="text-lg font-bold text-white text-center">Filters</h3>
              </div>
              <div className="flex-1 overflow-auto">
                <button onClick={() => setFilterSheetView("revenue")} className="w-full flex items-center justify-between px-5 py-4 border-b border-white/5 active:bg-white/5">
                  <span className="text-[15px] text-white">Revenue Center</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[15px] text-neutral-400">{filterRevenueCenter || "All"}</span>
                    <ChevronRight className="w-4 h-4 text-neutral-500" />
                  </div>
                </button>
                <button onClick={() => setFilterSheetView("date")} className="w-full flex items-center justify-between px-5 py-4 border-b border-white/5 active:bg-white/5">
                  <span className="text-[15px] text-white">Date</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[15px] text-neutral-400">{activePreset === "today" ? "Today" : activePreset === "yesterday" ? "Yesterday" : activePreset === "custom" ? formatDateDisplay(filterDateFrom) : activePreset}</span>
                    <ChevronRight className="w-4 h-4 text-neutral-500" />
                  </div>
                </button>
                <button onClick={() => setFilterSheetView("employee")} className="w-full flex items-center justify-between px-5 py-4 border-b border-white/5 active:bg-white/5">
                  <span className="text-[15px] text-white">Employee</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[15px] text-neutral-400">{filterEmployee || "All"}</span>
                    <ChevronRight className="w-4 h-4 text-neutral-500" />
                  </div>
                </button>
                <button onClick={() => setFilterSheetView("time")} className="w-full flex items-center justify-between px-5 py-4 border-b border-white/5 active:bg-white/5">
                  <span className="text-[15px] text-white">Time Range</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[15px] text-neutral-400">{filterTimeFrom} - {filterTimeTo}</span>
                    <ChevronRight className="w-4 h-4 text-neutral-500" />
                  </div>
                </button>
              </div>
            </>
          ) : filterSheetView === "revenue" ? (
            <>
              <div className="flex items-center px-5 py-4 border-b border-white/10 shrink-0">
                <button onClick={() => setFilterSheetView("main")} className="mr-3"><ChevronLeft className="w-5 h-5 text-white" /></button>
                <h3 className="text-lg font-bold text-white">Revenue Center</h3>
              </div>
              <div className="flex-1 overflow-auto px-3 py-2">
                <button onClick={() => setFilterRevenueCenter(null)} className={`w-full text-left px-4 py-3 rounded-xl text-[15px] mb-1 ${!filterRevenueCenter ? 'bg-white text-black font-semibold' : 'text-white active:bg-white/10'}`}>All</button>
                {REVENUE_CENTERS.map(rc => (
                  <button key={rc} onClick={() => setFilterRevenueCenter(rc)} className={`w-full text-left px-4 py-3 rounded-xl text-[15px] mb-1 ${filterRevenueCenter === rc ? 'bg-white text-black font-semibold' : 'text-white active:bg-white/10'}`}>{rc}</button>
                ))}
              </div>
            </>
          ) : filterSheetView === "date" ? (
            <>
              <div className="flex items-center px-5 py-4 border-b border-white/10 shrink-0">
                <button onClick={() => setFilterSheetView("main")} className="mr-3"><ChevronLeft className="w-5 h-5 text-white" /></button>
                <h3 className="text-lg font-bold text-white">Date</h3>
              </div>
              <div className="flex-1 overflow-auto px-3 py-2">
                {DATE_PRESETS.map(p => (
                  <button key={p.key} onClick={() => { handlePresetSelect(p.key); if (p.key !== "custom") setFilterSheetView("main"); }} className={`w-full text-left px-4 py-3 rounded-xl text-[15px] mb-1 ${activePreset === p.key ? 'bg-white text-black font-semibold' : 'text-white active:bg-white/10'}`}>{p.label}</button>
                ))}
                {activePreset === "custom" && (
                  <div className="mt-2">
                    <CalendarComponent mode="single" selected={filterDateFrom} onSelect={(d) => { if (d) { setFilterDateFrom(d); setFilterDateTo(d); } }} className="pointer-events-auto bg-neutral-800 text-white rounded-xl" />
                  </div>
                )}
              </div>
            </>
          ) : filterSheetView === "employee" ? (
            <>
              <div className="flex items-center px-5 py-4 border-b border-white/10 shrink-0">
                <button onClick={() => setFilterSheetView("main")} className="mr-3"><ChevronLeft className="w-5 h-5 text-white" /></button>
                <h3 className="text-lg font-bold text-white">Employee</h3>
              </div>
              <div className="flex-1 overflow-auto px-3 py-2">
                <button onClick={() => { setFilterEmployee(null); setFilterSheetView("main"); }} className={`w-full text-left px-4 py-3 rounded-xl text-[15px] mb-1 ${!filterEmployee ? 'bg-white text-black font-semibold' : 'text-white active:bg-white/10'}`}>All Employees</button>
                {employees.map(e => (
                  <button key={e} onClick={() => { setFilterEmployee(e); setFilterSheetView("main"); }} className={`w-full text-left px-4 py-3 rounded-xl text-[15px] mb-1 ${filterEmployee === e ? 'bg-white text-black font-semibold' : 'text-white active:bg-white/10'}`}>{e}</button>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center px-5 py-4 border-b border-white/10 shrink-0">
                <button onClick={() => setFilterSheetView("main")} className="mr-3"><ChevronLeft className="w-5 h-5 text-white" /></button>
                <h3 className="text-lg font-bold text-white">Time Range</h3>
              </div>
              <div className="flex-1 overflow-auto px-5 py-4 space-y-4">
                <div className="relative">
                  <label className="text-sm text-neutral-400 mb-2 block">From</label>
                  <button onClick={() => { setShowTimeFromPicker(!showTimeFromPicker); setShowTimeToPicker(false); }} className="w-full text-left px-4 py-3 bg-neutral-800 rounded-xl text-[15px] text-white">{filterTimeFrom}</button>
                  <OverlayTimePicker isOpen={showTimeFromPicker} onClose={() => setShowTimeFromPicker(false)} selectedTime={filterTimeFrom} onTimeChange={(t) => { setFilterTimeFrom(t); setShowTimeFromPicker(false); }} />
                </div>
                <div className="relative">
                  <label className="text-sm text-neutral-400 mb-2 block">To</label>
                  <button onClick={() => { setShowTimeToPicker(!showTimeToPicker); setShowTimeFromPicker(false); }} className="w-full text-left px-4 py-3 bg-neutral-800 rounded-xl text-[15px] text-white">{filterTimeTo}</button>
                  <OverlayTimePicker isOpen={showTimeToPicker} onClose={() => setShowTimeToPicker(false)} selectedTime={filterTimeTo} onTimeChange={(t) => { setFilterTimeTo(t); setShowTimeToPicker(false); }} />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className={`relative z-10 bg-[#1C1C1E] shadow-2xl overflow-hidden flex flex-col
        w-full h-full md:h-auto
        md:w-[95vw] md:max-w-[1400px] md:max-h-[92vh] md:rounded-2xl`}
      >
        {/* Modal size increased */}
        <div className="flex items-center justify-between px-5 md:px-8 py-4 md:py-5 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
            <Avatar className="w-10 h-10 md:w-11 md:h-11 border border-white/20 shrink-0">
              <AvatarFallback className="text-xs md:text-sm font-semibold bg-neutral-700 text-white">{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                <h2 className="text-lg md:text-xl font-bold text-white tracking-wide whitespace-nowrap">SHIFT SUMMARY</h2>
              </div>
              <p className="text-sm md:text-base text-neutral-400 truncate">{employeeName} - {employeeRole}</p>
            </div>
          </div>

          {/* Cash Drop button + Action buttons */}
          <div className="flex items-center gap-1 md:gap-1.5 shrink-0 ml-2">
            {/* Cash Drop - prominent pill button */}
            <button
              onClick={() => {
                setCashDropAmount("");
                setCashDropReason("");
                setCashDropMismatch(false);
                setShowCashDropPopup(true);
              }}
              className={`flex items-center gap-1.5 px-4 py-2 md:px-5 md:py-2.5 rounded-full font-semibold text-xs md:text-sm transition-colors mr-1 ${
                cashDropSettled
                  ? "bg-emerald-500/20 hover:bg-emerald-500/25 text-emerald-300 ring-1 ring-emerald-400/40"
                  : "bg-white/10 hover:bg-white/15 text-white"
              }`}
            >
              <ArrowDownToLine className="w-3.5 h-3.5 md:w-4 md:h-4" />
              {cashDropSettled ? `Settled · $${cashDropSettledAmount.toFixed(2)}` : "Cash Drop"}
            </button>
            {/* Mobile: single filter icon */}
            {isMobile && (
              <button
                onClick={() => { setShowFilterSheet(true); setFilterSheetView("main"); }}
                className={`p-2 rounded-xl hover:bg-white/10 transition-colors shrink-0 ${hasActiveFilters ? 'ring-2 ring-white/50' : ''}`}
                style={{ background: "rgba(100, 100, 100, 0.4)" }}
              >
                <SlidersHorizontal className="w-4 h-4 text-white" />
              </button>
            )}

            {/* Desktop: individual filter icons */}
            {!isMobile && (
              <>
                {/* Revenue Center */}
                <Popover>
                  <PopoverTrigger asChild>
                    <button className={`p-2.5 rounded-xl hover:bg-white/10 transition-colors shrink-0 ${filterRevenueCenter ? 'ring-2 ring-white/50' : ''}`} style={{ background: "rgba(100, 100, 100, 0.4)" }}>
                      <DollarSign className="w-[18px] h-[18px] text-white" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-48 p-2 bg-neutral-800 border-neutral-700 pointer-events-auto z-[10000]" align="end">
                    <div className="text-xs text-white/50 mb-2 px-2">Revenue Center</div>
                    {REVENUE_CENTERS.map(rc => (
                      <button key={rc} onClick={() => setFilterRevenueCenter(filterRevenueCenter === rc ? null : rc)} className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${filterRevenueCenter === rc ? 'bg-white text-black' : 'text-white hover:bg-white/10'}`}>{rc}</button>
                    ))}
                  </PopoverContent>
                </Popover>

                {/* Date/Calendar */}
                <Popover>
                  <PopoverTrigger asChild>
                    <button className={`p-2.5 rounded-xl hover:bg-white/10 transition-colors shrink-0 ${activePreset !== "today" ? 'ring-2 ring-white/50' : ''}`} style={{ background: "rgba(100, 100, 100, 0.4)" }}>
                      <Calendar className="w-[18px] h-[18px] text-white" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-neutral-800 border-neutral-700 pointer-events-auto z-[10000]" align="end">
                    <div className="p-2 border-b border-white/10">
                      <div className="grid grid-cols-3 gap-1">
                        {DATE_PRESETS.map(p => (
                          <button key={p.key} onClick={() => handlePresetSelect(p.key)} className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${activePreset === p.key ? "bg-white text-black" : "text-white hover:bg-white/10"}`}>{p.label}</button>
                        ))}
                      </div>
                    </div>
                    {activePreset === "custom" && (
                      <CalendarComponent mode="single" selected={filterDateFrom} onSelect={(d) => { if (d) { setFilterDateFrom(d); setFilterDateTo(d); } }} className="pointer-events-auto bg-neutral-800 text-white" />
                    )}
                  </PopoverContent>
                </Popover>

                {/* Time Filter */}
                <Popover>
                  <PopoverTrigger asChild>
                    <button className={`p-2.5 rounded-xl hover:bg-white/10 transition-colors shrink-0 ${(filterTimeFrom !== "00:00" || filterTimeTo !== "23:59") ? 'ring-2 ring-white/50' : ''}`} style={{ background: "rgba(100, 100, 100, 0.4)" }}>
                      <Clock className="w-[18px] h-[18px] text-white" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56 p-3 bg-neutral-800 border-neutral-700 pointer-events-auto z-[10000]" align="end">
                    <div className="text-xs text-white/50 mb-3 px-1">Time Range</div>
                    <div className="space-y-3">
                      <div className="relative">
                        <label className="text-xs text-neutral-400 mb-1 block">From</label>
                        <button onClick={() => { setShowTimeFromPicker(!showTimeFromPicker); setShowTimeToPicker(false); }} className="w-full text-left px-3 py-2 bg-neutral-700 rounded-lg text-sm text-white hover:bg-neutral-600 transition-colors">{filterTimeFrom}</button>
                        <OverlayTimePicker isOpen={showTimeFromPicker} onClose={() => setShowTimeFromPicker(false)} selectedTime={filterTimeFrom} onTimeChange={(t) => { setFilterTimeFrom(t); setShowTimeFromPicker(false); }} />
                      </div>
                      <div className="relative">
                        <label className="text-xs text-neutral-400 mb-1 block">To</label>
                        <button onClick={() => { setShowTimeToPicker(!showTimeToPicker); setShowTimeFromPicker(false); }} className="w-full text-left px-3 py-2 bg-neutral-700 rounded-lg text-sm text-white hover:bg-neutral-600 transition-colors">{filterTimeTo}</button>
                        <OverlayTimePicker isOpen={showTimeToPicker} onClose={() => setShowTimeToPicker(false)} selectedTime={filterTimeTo} onTimeChange={(t) => { setFilterTimeTo(t); setShowTimeToPicker(false); }} />
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Employee */}
                <Popover>
                  <PopoverTrigger asChild>
                    <button className={`p-2.5 rounded-xl hover:bg-white/10 transition-colors shrink-0 ${filterEmployee ? 'ring-2 ring-white/50' : ''}`} style={{ background: "rgba(100, 100, 100, 0.4)" }}>
                      <Users className="w-[18px] h-[18px] text-white" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-48 p-2 bg-neutral-800 border-neutral-700 pointer-events-auto z-[10000] max-h-[280px] overflow-y-auto" align="end">
                    <div className="text-xs text-white/50 mb-2 px-2">Employee</div>
                    <button onClick={() => setFilterEmployee(null)} className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${!filterEmployee ? 'bg-white text-black' : 'text-white hover:bg-white/10'}`}>All Employees</button>
                    {employees.map(e => (
                      <button key={e} onClick={() => setFilterEmployee(filterEmployee === e ? null : e)} className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${filterEmployee === e ? 'bg-white text-black' : 'text-white hover:bg-white/10'}`}>{e}</button>
                    ))}
                  </PopoverContent>
                </Popover>
              </>
            )}

            {/* Share */}
            <Popover>
              <PopoverTrigger asChild>
                <button className="p-2 md:p-2.5 rounded-xl hover:bg-white/10 transition-colors shrink-0" style={{ background: "rgba(100, 100, 100, 0.4)" }}>
                  <Share2 className="w-4 h-4 md:w-[18px] md:h-[18px] text-white" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-[180px] p-2 bg-neutral-800 border-neutral-700 pointer-events-auto z-[10000]" align="end">
                <button onClick={() => handleShare("pdf")} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-neutral-300 hover:bg-white/5 hover:text-white transition-colors rounded-lg"><FileText className="w-4 h-4" /> Export as PDF</button>
                <button onClick={() => handleShare("email")} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-neutral-300 hover:bg-white/5 hover:text-white transition-colors rounded-lg"><Mail className="w-4 h-4" /> Send via Email</button>
                <button onClick={() => handleShare("text")} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-neutral-300 hover:bg-white/5 hover:text-white transition-colors rounded-lg"><MessageSquare className="w-4 h-4" /> Share via Text</button>
                <button onClick={() => handleShare("download")} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-neutral-300 hover:bg-white/5 hover:text-white transition-colors rounded-lg"><Download className="w-4 h-4" /> Download CSV</button>
              </PopoverContent>
            </Popover>

            {/* Print - hidden on mobile */}
            <button onClick={() => handleShare("pdf")} className="hidden md:flex p-2.5 rounded-xl hover:bg-white/10 transition-colors shrink-0" style={{ background: "rgba(100, 100, 100, 0.4)" }} title="Print">
              <Printer className="w-[18px] h-[18px] text-white" />
            </button>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <button onClick={clearAllFilters} className="p-2 md:p-2.5 rounded-xl hover:bg-white/10 transition-colors shrink-0" style={{ background: "rgba(239, 68, 68, 0.4)" }}>
                <RotateCcw className="w-3.5 h-3.5 md:w-4 md:h-4 text-white" />
              </button>
            )}

            {/* AI Icon */}
            <button
              onClick={() => setShowAIChat(true)}
              className="flex items-center justify-center rounded-xl hover:bg-white/15 transition-colors shrink-0 w-8 h-8 md:w-10 md:h-10"
              style={{ background: "rgba(100, 100, 100, 0.4)" }}
              title="AI Assistant"
            >
              <AnimatedAIIcon size={isMobile ? 16 : 18} />
            </button>

            {/* Close */}
            <button onClick={onClose} className="w-8 h-8 md:w-9 md:h-9 rounded-sm flex items-center justify-center opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none shrink-0">
              <X className="h-4 w-4 md:h-5 md:w-5 text-neutral-300" />
            </button>
          </div>
        </div>

        {/* Key metrics - 2 cols on mobile, 6 cols on desktop (single row) */}
        <div className={`grid grid-cols-2 md:grid-cols-6 gap-2 md:gap-3 px-5 md:px-8 py-4 md:py-5 shrink-0 transition-all duration-300 ${showAIChat && !aiExpanded && !isMobile ? 'md:mr-[440px]' : ''}`}>
          <div className="flex items-center gap-2 md:gap-3 bg-white/5 rounded-xl p-3 md:p-4">
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg bg-emerald-500/15 flex items-center justify-center shrink-0">
              <CreditCard className="w-4 h-4 md:w-5 md:h-5 text-emerald-400" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] md:text-[11px] text-white uppercase tracking-wide font-semibold truncate">Card Sales</p>
              <p className="text-base md:text-2xl font-bold text-white">$ {totalCardSales.toFixed(2)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-3 bg-white/5 rounded-xl p-3 md:p-4">
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg bg-amber-500/15 flex items-center justify-center shrink-0">
              <Banknote className="w-4 h-4 md:w-5 md:h-5 text-amber-400" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] md:text-[11px] text-white uppercase tracking-wide font-semibold truncate">Cash Sales</p>
              <p className="text-base md:text-2xl font-bold text-white">$ {totalCashSales.toFixed(2)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-3 bg-white/5 rounded-xl p-3 md:p-4">
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg bg-purple-500/15 flex items-center justify-center shrink-0">
              <Receipt className="w-4 h-4 md:w-5 md:h-5 text-purple-400" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] md:text-[11px] text-white uppercase tracking-wide font-semibold truncate">Total Tips</p>
              <p className="text-base md:text-2xl font-bold text-white">$ {totalTips.toFixed(2)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-3 bg-white/5 rounded-xl p-3 md:p-4">
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg bg-blue-500/15 flex items-center justify-center shrink-0">
              <Banknote className="w-4 h-4 md:w-5 md:h-5 text-blue-400" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] md:text-[11px] text-white uppercase tracking-wide font-semibold truncate">Tips Payable</p>
              <p className="text-base md:text-2xl font-bold text-white">$ {tipsPayable.toFixed(2)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-3 bg-white/5 rounded-xl p-3 md:p-4">
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg bg-cyan-500/15 flex items-center justify-center shrink-0">
              <DollarSign className="w-4 h-4 md:w-5 md:h-5 text-cyan-400" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] md:text-[11px] text-white uppercase tracking-wide font-semibold truncate">Total</p>
              <p className="text-base md:text-2xl font-bold text-white">$ {overallTotal.toFixed(2)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-3 bg-white/5 rounded-xl p-3 md:p-4">
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg bg-orange-500/15 flex items-center justify-center shrink-0">
              <ArrowDownToLine className="w-4 h-4 md:w-5 md:h-5 text-orange-400" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] md:text-[11px] text-white uppercase tracking-wide font-semibold truncate">Cash Drop</p>
              <p className="text-base md:text-2xl font-bold text-white">$ {totalCashDrop.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Data table + AI side panel or AI full area */}
        {aiExpanded && !isMobile ? (
          <div className="flex-1 overflow-hidden flex flex-col">
            <ShiftAIChatPanel
              onClose={() => { setShowAIChat(false); setAiExpanded(false); }}
              shiftContext={shiftContextForAI}
              shiftActions={{
                exportPDF: () => { setShowAIChat(false); setAiExpanded(false); setTimeout(() => handleShare("pdf"), 100); },
                sendEmail: () => { setShowAIChat(false); setAiExpanded(false); setTimeout(() => handleShare("email"), 100); },
                sendText: () => { setShowAIChat(false); setAiExpanded(false); setTimeout(() => handleShare("text"), 100); },
                downloadCSV: () => { setShowAIChat(false); setAiExpanded(false); setTimeout(() => handleShare("download"), 100); },
              }}
              onUserInteraction={() => {}}
            />
          </div>
        ) : (
          <>
            <div className={`flex-1 overflow-auto px-5 md:px-8 py-4 transition-all duration-300 ${showAIChat && !isMobile ? 'md:mr-[440px]' : ''}`}>
              {loading ? (
                <p className="text-base text-neutral-500 py-8 text-center">Loading transactions...</p>
              ) : (
                <table className="w-full text-sm md:text-base">
                  <thead className="sticky top-0 bg-[#1C1C1E] z-10">
                    <tr className="border-b-2 border-white/10 text-left">
                      <th className="py-3 md:py-4 pr-4 text-xs md:text-sm font-bold text-white uppercase tracking-wider">Type</th>
                      <th className="py-3 md:py-4 pr-4 text-xs md:text-sm font-bold text-white uppercase tracking-wider text-right">Qty</th>
                      <th className="py-3 md:py-4 pr-4 text-xs md:text-sm font-bold text-white uppercase tracking-wider text-right">Amount</th>
                      <th className="py-3 md:py-4 pr-4 text-xs md:text-sm font-bold text-white uppercase tracking-wider text-right">Tip</th>
                      <th className="py-3 md:py-4 pr-4 text-xs md:text-sm font-bold text-white uppercase tracking-wider text-right">Total Tips</th>
                      <th className="py-3 md:py-4 pl-4 text-xs md:text-sm font-bold text-white uppercase tracking-wider text-right">Cash Drop</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentTypeSummary.map(row => {
                      const isCash = row.type.toLowerCase() === "cash";
                      // Cash Drop per row: Cash rows = amount (cash in hand), Card rows = 0 (digital)
                      // But card tips need to be deducted from cash drop
                      const cashDropForRow = isCash ? Math.max(0, row.amount - cardTips) : 0;
                      return (
                        <tr key={row.type} className="border-b border-white/5 transition-colors hover:bg-white/[0.05]">
                          <td className="py-4 md:py-5 pr-4 text-base md:text-[17px] font-semibold text-white">{row.type}</td>
                          <td className="py-4 md:py-5 pr-4 text-base md:text-[17px] text-white text-right">{row.qty}</td>
                          <td className="py-4 md:py-5 pr-4 text-base md:text-[17px] font-semibold text-white text-right">$ {row.amount.toFixed(2)}</td>
                          <td className="py-4 md:py-5 pr-4 text-base md:text-[17px] text-white text-right">$ {row.tips.toFixed(2)}</td>
                          <td className="py-4 md:py-5 pr-4 text-base md:text-[17px] font-semibold text-white text-right">$ {row.totalTips.toFixed(2)}</td>
                          <td className="py-4 md:py-5 pl-4 text-base md:text-[17px] font-semibold text-white text-right">$ {cashDropForRow.toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-neutral-800/50">
                      <td className="py-4 md:py-5 pr-4 text-base md:text-[17px] font-bold text-white">Total</td>
                      <td className="py-4 md:py-5 pr-4 text-base md:text-[17px] font-bold text-white text-right">{paidOrders.length}</td>
                      <td className="py-4 md:py-5 pr-4 text-base md:text-[17px] font-bold text-white text-right">$ {paymentTypeSummary.reduce((s, r) => s + r.amount, 0).toFixed(2)}</td>
                      <td className="py-4 md:py-5 pr-4 text-base md:text-[17px] font-bold text-white text-right">$ {paymentTypeSummary.reduce((s, r) => s + r.tips, 0).toFixed(2)}</td>
                      <td className="py-4 md:py-5 pr-4 text-base md:text-[17px] font-bold text-white text-right">$ {paymentTypeSummary.reduce((s, r) => s + r.totalTips, 0).toFixed(2)}</td>
                      <td className="py-4 md:py-5 pl-4 text-base md:text-[17px] font-bold text-white text-right">$ {totalCashDrop.toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>

            {/* Right-side AI panel (not expanded yet) */}
            {showAIChat && !isMobile && (
              <div className="absolute right-0 top-0 bottom-0 w-[440px] z-[20] flex flex-col bg-[#1C1C1E] border-l border-white/10 shadow-2xl rounded-r-2xl overflow-hidden">
                <ShiftAIChatPanel
                  onClose={() => { setShowAIChat(false); setAiExpanded(false); }}
                  shiftContext={shiftContextForAI}
                  shiftActions={{
                    exportPDF: () => { setShowAIChat(false); setAiExpanded(false); setTimeout(() => handleShare("pdf"), 100); },
                    sendEmail: () => { setShowAIChat(false); setAiExpanded(false); setTimeout(() => handleShare("email"), 100); },
                    sendText: () => { setShowAIChat(false); setAiExpanded(false); setTimeout(() => handleShare("text"), 100); },
                    downloadCSV: () => { setShowAIChat(false); setAiExpanded(false); setTimeout(() => handleShare("download"), 100); },
                  }}
                  onUserInteraction={() => setAiExpanded(true)}
                />
              </div>
            )}
          </>
        )}

        {/* Cash Drop Popup */}
        {showCashDropPopup && (
          <div className="absolute inset-0 z-[30] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowCashDropPopup(false)} />
            <div className="relative z-10 bg-[#252525] rounded-2xl p-6 w-[400px] max-w-[90%] shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-white">Cash Drop</h3>
                <button onClick={() => setShowCashDropPopup(false)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors">
                  <X className="w-4 h-4 text-neutral-400" />
                </button>
              </div>

              {/* Cash in Hand */}
              <div className="mb-3 p-3 bg-white/5 rounded-xl">
                <p className="text-xs text-neutral-500 uppercase tracking-wide mb-1">Cash in Hand</p>
                <p className="text-xl font-bold text-white">$ {cashInHand.toFixed(2)}</p>
              </div>

              {/* Card Tips (excluded) */}
              <div className="mb-3 p-3 bg-white/5 rounded-xl">
                <p className="text-xs text-neutral-500 uppercase tracking-wide mb-1">Card Tips (excluded)</p>
                <p className="text-xl font-bold text-red-400">- $ {cardTips.toFixed(2)}</p>
              </div>

              {/* Cash Drop Amount (auto-calculated, read-only) */}
              <div className="mb-3 p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                <p className="text-xs text-neutral-500 uppercase tracking-wide mb-1">Cash Drop Amount</p>
                {totalCashDrop > 0 ? (
                  <p className="text-2xl font-bold text-emerald-400">$ {totalCashDrop.toFixed(2)}</p>
                ) : (
                  <p className="text-lg font-bold text-amber-400">$ 0.00</p>
                )}
              </div>

              {totalCashDrop === 0 && (
                <div className="mb-3 flex items-center gap-2 px-1">
                  <div className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                  <p className="text-sm text-amber-400">No cash available to drop</p>
                </div>
              )}

              <p className="text-xs text-neutral-500 mb-4 px-1">Card tips are excluded as they are processed digitally.</p>

              {/* Enter actual drop amount */}
              <div className="mb-4">
                <label className="text-sm text-neutral-400 mb-2 block">Enter Cash Drop Amount</label>
                <input
                  type="number"
                  value={cashDropAmount}
                  onChange={(e) => {
                    setCashDropAmount(e.target.value);
                    const val = parseFloat(e.target.value);
                    if (!isNaN(val) && Math.abs(val - totalCashDrop) > 0.01) {
                      setCashDropMismatch(true);
                    } else {
                      setCashDropMismatch(false);
                      setCashDropReason("");
                    }
                  }}
                  placeholder="0.00"
                  className="w-full px-4 py-3 bg-neutral-700 rounded-xl text-white text-lg font-medium outline-none focus:ring-2 focus:ring-white/30 transition-all"
                  step="0.01"
                />
              </div>

              {cashDropMismatch && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-amber-400" />
                    <p className="text-sm text-amber-400 font-medium">Amount doesn't match expected total</p>
                  </div>
                  <label className="text-sm text-neutral-400 mb-2 block">Reason (required)</label>
                  <textarea
                    value={cashDropReason}
                    onChange={(e) => setCashDropReason(e.target.value)}
                    placeholder="Explain the difference..."
                    className="w-full px-4 py-3 bg-neutral-700 rounded-xl text-white text-sm outline-none focus:ring-2 focus:ring-white/30 transition-all resize-none h-20"
                  />
                </div>
              )}

              <button
                onClick={() => {
                  if (cashDropMismatch && !cashDropReason.trim()) return;
                  setShowCashDropPopup(false);
                }}
                disabled={!cashDropAmount || (cashDropMismatch && !cashDropReason.trim())}
                className="w-full py-3.5 bg-white text-black font-semibold rounded-xl text-base hover:bg-white/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Confirm Cash Drop
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile filter bottom sheet */}
      {isMobile && renderFilterSheet()}
    </div>
  );
}
