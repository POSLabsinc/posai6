import { useEffect, useMemo, useRef, useState } from "react";
import { Send, Sparkles, BarChart3, ChevronDown, ChevronLeft, Loader2, Calendar as CalendarIcon } from "lucide-react";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { useReportsData } from "@/hooks/useReportsData";
import { supabase } from "@/integrations/supabase/client";
import type { NotificationItem } from "@/hooks/useNotifications";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface ChatMsg { role: "user" | "assistant"; content: string }

type RecCategory = "Staffing" | "Menu" | "Labor" | "Finance" | "Promo";
interface Recommendation { id: string; text: string; category: RecCategory; when: string; dotColor: string }

const CATEGORY_STYLES: Record<RecCategory, string> = {
  Staffing: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  Menu: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  Labor: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  Finance: "bg-red-500/15 text-red-400 border-red-500/30",
  Promo: "bg-amber-500/15 text-amber-400 border-amber-500/30",
};

const MOCK_RECS: Recommendation[] = [
  { id: "r1", text: "Peak hour approaching at 6 PM. Consider adding 2 staff to Front of House.", category: "Staffing", when: "Today", dotColor: "bg-amber-400" },
  { id: "r2", text: "Tacos are trending 23% above average. Feature on the specials board.", category: "Menu", when: "Today", dotColor: "bg-emerald-400" },
  { id: "r3", text: "Labor cost at 28% approaching 30% threshold. Monitor closely.", category: "Labor", when: "Tomorrow", dotColor: "bg-blue-400" },
  { id: "r4", text: "Voids spiked 40% in the last hour. Review POS activity immediately.", category: "Finance", when: "Urgent", dotColor: "bg-red-400" },
  { id: "r5", text: "Happy Hour promo underperforming. Boost via SMS to repeat guests.", category: "Promo", when: "In 3 hours", dotColor: "bg-amber-400" },
  { id: "r6", text: "Wine inventory low on Cabernet. Reorder before weekend rush.", category: "Menu", when: "Today", dotColor: "bg-emerald-400" },
  { id: "r7", text: "Server Alex closing 18% faster than average. Consider as trainer.", category: "Staffing", when: "This week", dotColor: "bg-amber-400" },
  { id: "r8", text: "Dessert attach rate down 12%. Brief staff on suggestive selling.", category: "Menu", when: "Today", dotColor: "bg-emerald-400" },
];

type MetricKey = "netSales" | "grossSales" | "totalOrders" | "totalTransactions" | "totalRefunds" | "totalDiscounts";
const METRIC_OPTIONS: { key: MetricKey; label: string; isCurrency: boolean }[] = [
  { key: "netSales", label: "Net Sales", isCurrency: true },
  { key: "grossSales", label: "Gross Sales", isCurrency: true },
  { key: "totalOrders", label: "Total Orders", isCurrency: false },
  { key: "totalTransactions", label: "Total Transactions", isCurrency: false },
  { key: "totalRefunds", label: "Total Refunds", isCurrency: true },
  { key: "totalDiscounts", label: "Total Discounts", isCurrency: true },
];

const fmtCur = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtNum = (n: number) => n.toLocaleString();

export const SalesInsightDetailView = ({ notification }: { notification: NotificationItem }) => {
  // Today's range
  const { start, end } = useMemo(() => {
    const s = new Date(); s.setHours(0, 0, 0, 0);
    const e = new Date(); e.setHours(23, 59, 59, 999);
    return { start: s, end: e };
  }, []);
  const data = useReportsData(start, end, "00:00", "23:59");

  // Comparison date (default: yesterday)
  const [compareDate, setCompareDate] = useState<Date>(() => {
    const d = new Date(); d.setDate(d.getDate() - 1); d.setHours(0, 0, 0, 0); return d;
  });
  const compareEnd = useMemo(() => { const e = new Date(compareDate); e.setHours(23, 59, 59, 999); return e; }, [compareDate]);
  const compareData = useReportsData(compareDate, compareEnd, "00:00", "23:59");
  const [calOpen, setCalOpen] = useState(false);

  // Selected metric
  const [metric, setMetric] = useState<MetricKey>("netSales");
  const selectedMetric = METRIC_OPTIONS.find((m) => m.key === metric)!;

  const getMetricValue = (d: typeof data): number => {
    switch (metric) {
      case "netSales": return d.orderSummary.netSales;
      case "grossSales": return d.orderSummary.netSales + d.orderSummary.discounts;
      case "totalOrders": return d.orderSummary.numberOfOrders;
      case "totalTransactions": return d.paymentTypes.reduce((s, p) => s + p.transactions, 0);
      case "totalRefunds": return d.orderSummary.refundAmount;
      case "totalDiscounts": return d.orderSummary.discounts;
    }
  };
  const getHourlyValue = (h: typeof data.salesByHour[number]): number => {
    switch (metric) {
      case "netSales":
      case "grossSales": return h.sales;
      case "totalOrders":
      case "totalTransactions": return h.orders;
      case "totalRefunds":
      case "totalDiscounts": return 0;
    }
  };

  const todayValue = getMetricValue(data);
  const compareValue = getMetricValue(compareData);

  const chartData = useMemo(() => {
    return data.salesByHour.map((h, i) => ({
      hour: h.hour.slice(0, 2) + (Number(h.hour.slice(0, 2)) < 12 ? "AM" : "PM").replace(/^/, ""),
      hourLabel: (() => { const n = Number(h.hour.slice(0, 2)); const suf = n < 12 ? "AM" : "PM"; const h12 = n % 12 === 0 ? 12 : n % 12; return `${h12}${suf}`; })(),
      today: getHourlyValue(h),
      compare: getHourlyValue(compareData.salesByHour[i] || { hour: h.hour, sales: 0, orders: 0 }),
    }));
  }, [data.salesByHour, compareData.salesByHour, metric]);

  // Dashboard metrics
  const dashboardMetrics = useMemo(() => {
    const grossSales = data.orderSummary.netSales + data.orderSummary.discounts;
    const customerCount = data.orderSummary.numberOfOrders;
    return [
      { label: "Gross Sales", value: fmtCur(grossSales) },
      { label: "Net Sales", value: fmtCur(data.orderSummary.netSales) },
      { label: "Average Order Value", value: fmtCur(data.kpis.averageOrderValue) },
      { label: "Sales per Sq Ft", value: fmtCur(grossSales / 1200) },
      { label: "Revenue per Available Seat Hour", value: fmtCur(grossSales / Math.max(1, 60 * 12)) },
      { label: "Customer Count", value: fmtNum(customerCount) },
    ];
  }, [data]);

  // Breakdown report (hourly)
  const [bdPage, setBdPage] = useState(0);
  const breakdownRows = useMemo(() => {
    return data.salesByHour.map((h) => {
      const n = Number(h.hour.slice(0, 2));
      const suf = n < 12 ? "AM" : "PM";
      const h12 = n % 12 === 0 ? 12 : n % 12;
      const labour = 0;
      return {
        time: `${h12}:00 ${suf}`,
        netSales: h.sales,
        labour,
        labourPct: h.sales > 0 ? (labour / h.sales) * 100 : null,
      };
    });
  }, [data.salesByHour]);
  const PAGE_SIZE = 8;
  const totalPages = Math.ceil(breakdownRows.length / PAGE_SIZE);
  const pagedRows = breakdownRows.slice(bdPage * PAGE_SIZE, bdPage * PAGE_SIZE + PAGE_SIZE);

  // Right panel chat state
  const [rightView, setRightView] = useState<"recs" | "chat">("recs");
  const [messages, setMessages] = useState<ChatMsg[]>([
    { role: "assistant", content: "Ask me anything about today's recommendations." },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy, rightView]);

  const ask = async (q: string) => {
    const question = q.trim();
    if (!question || busy) return;
    setMessages((m) => [...m, { role: "user", content: question }]);
    setInput("");
    setBusy(true);
    try {
      const context = { kpis: data.kpis, topItems: data.topItems, categories: data.categories, salesByHour: data.salesByHour, recommendations: MOCK_RECS };
      const { data: resp, error } = await supabase.functions.invoke("reports-ai", { body: { mode: "ask", question, context } });
      if (error) throw error;
      const answer = (resp as any)?.answer || "I couldn't generate an answer from the visible data.";
      setMessages((m) => [...m, { role: "assistant", content: answer }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "Sorry, I couldn't reach the analytics service right now." }]);
    } finally {
      setBusy(false);
    }
  };

  const cardStyle = { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" } as const;

  const compareLabel = useMemo(() => {
    const y = new Date(); y.setDate(y.getDate() - 1); y.setHours(0, 0, 0, 0);
    if (compareDate.toDateString() === y.toDateString()) return "Yesterday";
    return format(compareDate, "MMM d, yyyy");
  }, [compareDate]);

  const formatMetricValue = (v: number) => selectedMetric.isCurrency ? fmtCur(v) : fmtNum(v);

  return (
    <div className="h-full w-full flex flex-col px-6 pt-6 pb-6 overflow-hidden">
      {/* Header */}
      <div className="flex items-start gap-4 mb-5 shrink-0">
        <div className="w-11 h-11 rounded-full bg-violet-500/15 flex items-center justify-center shrink-0">
          <Sparkles className="w-6 h-6 text-violet-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-[1.15rem] font-bold text-foreground leading-snug tracking-tight">{notification.headline || notification.title}</h1>
          <p className="text-xs text-muted-foreground/70 mt-1 font-medium">{notification.version_date} · {notification.time}</p>
        </div>
      </div>

      {/* Scrollable main area */}
      <div className="flex-1 overflow-y-auto scrollbar-hide pr-1 space-y-4">
        {/* Row 1: chart + recommendations side-by-side, equal height */}
        <div className="flex gap-4 items-stretch">
          {/* LEFT: chart card */}
          <div className="flex-1 min-w-0 rounded-2xl p-5" style={cardStyle}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-foreground">Today</h3>
              <button
                className="w-9 h-9 rounded-full bg-white/[0.06] hover:bg-white/[0.1] flex items-center justify-center transition-colors"
                aria-label="View chart options"
              >
                <BarChart3 className="w-4 h-4 text-foreground" />
              </button>
            </div>

            <div className="flex items-end gap-6 mb-4">
              {/* Metric dropdown */}
              <div className="flex flex-col">
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex items-center gap-1 text-xs text-muted-foreground/70 mb-1.5 hover:text-foreground transition-colors outline-none">
                    {selectedMetric.label} <ChevronDown className="w-3 h-3" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="bg-[#1c1c1e] border-white/10">
                    {METRIC_OPTIONS.map((opt) => (
                      <DropdownMenuItem
                        key={opt.key}
                        onClick={() => setMetric(opt.key)}
                        className={cn("text-foreground/90 focus:bg-white/[0.06]", metric === opt.key && "text-primary")}
                      >
                        {opt.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <span className="text-3xl font-bold text-foreground tabular-nums">{formatMetricValue(todayValue)}</span>
              </div>
              <span className="text-sm text-muted-foreground/60 pb-1.5">vs</span>
              {/* Compare date dropdown -> opens calendar */}
              <div className="flex flex-col">
                <Popover open={calOpen} onOpenChange={setCalOpen}>
                  <PopoverTrigger className="flex items-center gap-1 text-xs text-muted-foreground/70 mb-1.5 hover:text-foreground transition-colors outline-none">
                    {compareLabel} <ChevronDown className="w-3 h-3" />
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-auto p-0 bg-[#1c1c1e] border-white/10">
                    <Calendar
                      mode="single"
                      selected={compareDate}
                      onSelect={(d) => { if (d) { const nd = new Date(d); nd.setHours(0, 0, 0, 0); setCompareDate(nd); setCalOpen(false); } }}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
                <span className="text-3xl font-bold text-muted-foreground/60 tabular-nums">{formatMetricValue(compareValue)}</span>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis dataKey="hourLabel" tick={{ fontSize: 10, fill: "rgba(255,255,255,0.5)" }} interval={2} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "rgba(255,255,255,0.5)" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: "#1c1c1e", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, fontSize: 12 }}
                    formatter={(v: any, n: any) => [selectedMetric.isCurrency ? fmtCur(Number(v)) : fmtNum(Number(v)), n === "today" ? "Today" : compareLabel]}
                  />
                  <Bar dataKey="today" fill="#ef4444" radius={[3, 3, 0, 0]} maxBarSize={14} />
                  <Bar dataKey="compare" fill="#7f1d1d" radius={[3, 3, 0, 0]} maxBarSize={14} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* RIGHT: recommendations panel, height matches chart */}
          <div className="w-[380px] shrink-0 rounded-2xl flex flex-col" style={cardStyle}>
            {rightView === "recs" ? (
              <>
                <div className="flex items-center gap-2 px-5 pt-5 pb-3 shrink-0">
                  <h3 className="text-base font-bold text-foreground flex-1">Recommendations</h3>
                  <div className="w-7 h-7 rounded-full bg-violet-500/15 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-violet-400" />
                  </div>
                  <span className="text-sm font-semibold text-foreground tabular-nums">{MOCK_RECS.length}</span>
                </div>

                <div className="flex-1 overflow-y-auto scrollbar-hide px-5 pb-2 space-y-3 min-h-0">
                  {MOCK_RECS.slice(0, 3).map((rec) => (
                    <button
                      key={rec.id}
                      onClick={() => { setRightView("chat"); ask(`Tell me more about: ${rec.text}`); }}
                      className="w-full text-left group"
                    >
                      <div className="flex gap-2.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${rec.dotColor} mt-2 shrink-0`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] text-foreground/90 leading-relaxed mb-2 group-hover:text-foreground transition-colors">{rec.text}</p>
                          <div className="flex items-center justify-between">
                            <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${CATEGORY_STYLES[rec.category]}`}>{rec.category}</span>
                            <span className="text-[11px] text-muted-foreground/70">{rec.when}</span>
                          </div>
                        </div>
                      </div>
                      <div className="h-px bg-white/[0.06] mt-3" />
                    </button>
                  ))}
                </div>

                <div className="px-5 pb-4 pt-1 shrink-0">
                  <button onClick={() => setRightView("chat")} className="w-full flex items-center justify-between text-[13px] font-medium text-foreground/80 hover:text-foreground transition-colors">
                    <span>View all {MOCK_RECS.length} recommendations</span>
                    <span aria-hidden>→</span>
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 px-5 pt-5 pb-3 shrink-0 border-b border-white/[0.06]">
                  <button onClick={() => setRightView("recs")} className="w-9 h-9 -ml-2 rounded-full hover:bg-white/[0.06] flex items-center justify-center transition-colors" aria-label="Back to recommendations">
                    <ChevronLeft className="w-5 h-5 text-foreground" />
                  </button>
                  <h3 className="text-base font-bold text-foreground flex-1">Ask Maya</h3>
                  <div className="w-7 h-7 rounded-full bg-violet-500/15 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-violet-400" />
                  </div>
                </div>

                <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-hide px-4 py-4 space-y-3 min-h-0">
                  <div className="space-y-2">
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground/60 px-1">All recommendations</p>
                    {MOCK_RECS.map((rec) => (
                      <button key={rec.id} onClick={() => ask(`Tell me more about: ${rec.text}`)} disabled={busy}
                        className="w-full text-left rounded-xl p-3 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.05] transition-colors disabled:opacity-50">
                        <div className="flex gap-2.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${rec.dotColor} mt-1.5 shrink-0`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-[12.5px] text-foreground/90 leading-relaxed mb-1.5">{rec.text}</p>
                            <span className={`inline-block text-[10.5px] font-semibold px-2 py-0.5 rounded-full border ${CATEGORY_STYLES[rec.category]}`}>{rec.category}</span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>

                  {messages.slice(1).map((m, i) => (
                    <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed whitespace-pre-wrap ${m.role === "user" ? "bg-primary/90 text-primary-foreground" : "bg-white/[0.04] text-foreground/90 border border-white/5"}`}>
                        {m.content}
                      </div>
                    </div>
                  ))}
                  {busy && (
                    <div className="flex justify-start">
                      <div className="bg-white/[0.04] border border-white/5 rounded-2xl px-3.5 py-2.5">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
                      </div>
                    </div>
                  )}
                </div>

                <form onSubmit={(e) => { e.preventDefault(); ask(input); }} className="relative shrink-0 p-3 border-t border-white/[0.06]">
                  <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask Maya..."
                    className="w-full bg-white/[0.04] border border-white/5 rounded-full pl-4 pr-12 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/50" />
                  <button type="submit" disabled={busy || !input.trim()} aria-label="Send"
                    className="absolute right-5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 active:scale-95 transition-transform">
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </>
            )}
          </div>
        </div>

        {/* Row 2: 6 metric cards */}
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
          {dashboardMetrics.map((m) => (
            <div key={m.label} className="rounded-xl px-4 py-3"
              style={{ background: "#7575754D", boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)" }}>
              <div className="text-[11px] text-white/60 mb-2 leading-tight min-h-[28px]">{m.label}</div>
              <div className="text-lg font-semibold text-foreground tabular-nums">{m.value}</div>
            </div>
          ))}
        </div>

        {/* Row 3: Breakdown Report */}
        <div className="rounded-2xl p-5" style={cardStyle}>
          <h3 className="text-xl font-bold text-foreground">Breakdown Report</h3>
          <p className="text-xs text-muted-foreground/70 mt-1 mb-4">Detailed breakdown of key metrics with visual comparison charts</p>

          <div className="flex items-center gap-2 mb-4">
            <button className="flex items-center gap-2 text-xs text-foreground bg-white/[0.04] border border-white/10 rounded-full px-3 py-1.5">
              <CalendarIcon className="w-3.5 h-3.5" />
              {format(start, "MMM d, yyyy")}
              <ChevronDown className="w-3 h-3" />
            </button>
            <span className="text-xs text-muted-foreground">vs</span>
            <button className="flex items-center gap-2 text-xs text-foreground bg-white/[0.04] border border-white/10 rounded-full px-3 py-1.5">
              <CalendarIcon className="w-3.5 h-3.5" />
              {format(compareDate, "MMM d, yyyy")}
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>

          <div className="overflow-hidden rounded-xl border border-white/[0.06]">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground/80">
                  <th className="px-5 py-3 font-medium">Time</th>
                  <th className="px-5 py-3 font-medium text-right">Net Sales</th>
                  <th className="px-5 py-3 font-medium text-right">Labour Cost</th>
                  <th className="px-5 py-3 font-medium text-right">Labour %</th>
                </tr>
              </thead>
              <tbody>
                {pagedRows.map((r, i) => (
                  <tr key={i} className="border-t border-white/[0.04]">
                    <td className="px-5 py-3.5 text-foreground/90">{r.time}</td>
                    <td className="px-5 py-3.5 text-right text-foreground/90 tabular-nums">{fmtCur(r.netSales)}</td>
                    <td className="px-5 py-3.5 text-right text-foreground/90 tabular-nums">{fmtCur(r.labour)}</td>
                    <td className="px-5 py-3.5 text-right text-foreground/90 tabular-nums">{r.labourPct === null ? "-" : r.labourPct.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1 mt-4">
              <button onClick={() => setBdPage(Math.max(0, bdPage - 1))} disabled={bdPage === 0}
                className="w-8 h-8 rounded-md text-foreground/70 hover:bg-white/[0.06] disabled:opacity-30">«</button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button key={i} onClick={() => setBdPage(i)}
                  className={cn("w-8 h-8 rounded-md text-sm", bdPage === i ? "bg-white text-black" : "text-foreground/70 hover:bg-white/[0.06]")}>
                  {i + 1}
                </button>
              ))}
              <button onClick={() => setBdPage(Math.min(totalPages - 1, bdPage + 1))} disabled={bdPage === totalPages - 1}
                className="w-8 h-8 rounded-md text-foreground/70 hover:bg-white/[0.06] disabled:opacity-30">»</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SalesInsightDetailView;
