import { useEffect, useMemo, useRef, useState } from "react";
import { Send, Sparkles, TrendingDown, AlertTriangle, Lightbulb, Loader2 } from "lucide-react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceArea,
  ReferenceDot,
  CartesianGrid,
} from "recharts";
import { useReportsData } from "@/hooks/useReportsData";
import { supabase } from "@/integrations/supabase/client";
import type { NotificationItem } from "@/hooks/useNotifications";

interface ChatMsg { role: "user" | "assistant"; content: string }

const CHIPS = [
  "Why are sales low today?",
  "Which products should I promote?",
  "When is our slowest hour?",
  "How can we boost the next 2 hours?",
];

export const SalesInsightDetailView = ({ notification }: { notification: NotificationItem }) => {
  // Today's range
  const { start, end } = useMemo(() => {
    const s = new Date(); s.setHours(0, 0, 0, 0);
    const e = new Date(); e.setHours(23, 59, 59, 999);
    return { start: s, end: e };
  }, []);
  const data = useReportsData(start, end, "00:00", "23:59");

  // Build chart series with a 4-week-style baseline (mocked from peak smoothing)
  const chartData = useMemo(() => {
    const peak = Math.max(1, ...data.salesByHour.map((h) => h.sales));
    return data.salesByHour.map((h, i, arr) => {
      const around = [arr[i - 1], arr[i], arr[i + 1]].filter(Boolean);
      const smooth = around.reduce((s, x: any) => s + x.sales, 0) / around.length;
      // baseline = slightly above smoothed value to highlight underperformance dips
      const baseline = Math.max(smooth * 1.18, peak * 0.25);
      return { ...h, baseline: Math.round(baseline) };
    });
  }, [data.salesByHour]);

  // Identify the worst dip vs baseline
  const worstDip = useMemo(() => {
    let worst: { hour: string; deficit: number; sales: number; baseline: number } | null = null;
    for (const p of chartData) {
      const deficit = p.baseline - p.sales;
      if (!worst || deficit > worst.deficit) worst = { hour: p.hour, deficit, sales: p.sales, baseline: p.baseline };
    }
    return worst;
  }, [chartData]);

  // Lowest-performing categories (bottom 3 with sales)
  const weakCategories = useMemo(() =>
    [...data.categories].filter((c) => c.sales >= 0).sort((a, b) => a.sales - b.sales).slice(0, 3),
  [data.categories]);

  const topItems = useMemo(() => data.topItems.slice(0, 4), [data.topItems]);

  // Static-ish reasons & suggestions derived from data
  const reasons = useMemo(() => {
    const r: string[] = [];
    if (worstDip && worstDip.deficit > 0) {
      r.push(`${worstDip.hour} underperformed: £${worstDip.sales} vs target £${worstDip.baseline}.`);
    }
    if (data.kpis.orderCount > 0 && data.kpis.averageOrderValue > 0) {
      r.push(`Average order value at £${data.kpis.averageOrderValue.toFixed(2)} suggests limited add-on attach.`);
    }
    if (weakCategories.length) {
      r.push(`Slow categories: ${weakCategories.map((c) => c.name).join(", ")}.`);
    }
    if (!r.length) r.push("Hourly throughput is below the rolling baseline for several windows.");
    return r;
  }, [worstDip, data.kpis, weakCategories]);

  const suggestions = useMemo(() => {
    const s: string[] = [];
    if (topItems[0]) s.push(`Promote "${topItems[0].name}" as a featured upsell on every ticket.`);
    if (worstDip) s.push(`Run a 15% off happy-hour promo around ${worstDip.hour} to lift footfall.`);
    s.push("Brief servers to suggest one add-on (drink or side) on every order.");
    if (weakCategories[0]) s.push(`Bundle a "${weakCategories[0].name}" product with a top seller for combo pricing.`);
    s.push("Increase floor coverage during the next forecast peak window.");
    return s.slice(0, 5);
  }, [topItems, worstDip, weakCategories]);

  // ===== Chat =====
  const [messages, setMessages] = useState<ChatMsg[]>([
    { role: "assistant", content: "Ask me anything about today's sales. I only use the data shown on this screen." },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  const ask = async (q: string) => {
    const question = q.trim();
    if (!question || busy) return;
    setMessages((m) => [...m, { role: "user", content: question }]);
    setInput("");
    setBusy(true);
    try {
      const context = {
        kpis: data.kpis,
        topItems: data.topItems,
        categories: data.categories,
        paymentTypes: data.paymentTypes,
        salesByHour: data.salesByHour,
        salesByDay: data.salesByDay,
      };
      const { data: resp, error } = await supabase.functions.invoke("reports-ai", {
        body: { mode: "ask", question, context },
      });
      if (error) throw error;
      const answer = (resp as any)?.answer || "I couldn't generate an answer from the visible data.";
      setMessages((m) => [...m, { role: "assistant", content: answer }]);
    } catch (e) {
      setMessages((m) => [...m, { role: "assistant", content: "Sorry, I couldn't reach the analytics service right now." }]);
    } finally {
      setBusy(false);
    }
  };

  const card = "rounded-2xl p-5";
  const cardStyle = { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" } as const;

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

      {/* Full-width content */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 flex flex-col gap-4 min-h-0 overflow-y-auto scrollbar-hide pr-1">
          {/* Chart */}
          <div className={card} style={cardStyle}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Hourly sales vs baseline</h3>
                <p className="text-[11px] text-muted-foreground/70">Dip area highlights underperforming hours</p>
              </div>
              {worstDip && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20">
                  <TrendingDown className="w-3 h-3 text-red-400" />
                  <span className="text-[11px] font-semibold text-red-400">-£{Math.round(worstDip.deficit)} @ {worstDip.hour}</span>
                </div>
              )}
            </div>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id="salesBar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.85} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="hour" tick={{ fontSize: 10, fill: "rgba(255,255,255,0.5)" }} interval={1} />
                  <YAxis tick={{ fontSize: 10, fill: "rgba(255,255,255,0.5)" }} />
                  <Tooltip
                    contentStyle={{ background: "#1c1c1e", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, fontSize: 12 }}
                    formatter={(v: any, n: any) => [`£${v}`, n === "sales" ? "Sales" : "Baseline"]}
                  />
                  {worstDip && (
                    <ReferenceArea
                      x1={worstDip.hour}
                      x2={worstDip.hour}
                      strokeOpacity={0}
                      fill="rgb(239 68 68)"
                      fillOpacity={0.12}
                    />
                  )}
                  <Bar dataKey="sales" fill="url(#salesBar)" radius={[6, 6, 0, 0]} maxBarSize={18} />
                  <Line type="monotone" dataKey="baseline" stroke="rgba(244,114,182,0.9)" strokeWidth={2} strokeDasharray="4 4" dot={false} />
                  {worstDip && (
                    <ReferenceDot
                      x={worstDip.hour}
                      y={worstDip.sales}
                      r={5}
                      fill="rgb(239 68 68)"
                      stroke="white"
                      strokeWidth={1.5}
                      label={{ value: "Low footfall", position: "top", fill: "rgb(248 113 113)", fontSize: 10, fontWeight: 600 }}
                    />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            {/* Mini KPI strip */}
            <div className="grid grid-cols-4 gap-2 mt-3">
              {[
                { label: "Sales", val: `£${data.kpis.totalSales.toFixed(0)}` },
                { label: "Orders", val: data.kpis.orderCount },
                { label: "Avg Order", val: `£${data.kpis.averageOrderValue.toFixed(2)}` },
                { label: "Units", val: data.kpis.unitsSold },
              ].map((k) => (
                <div key={k.label} className="rounded-xl px-3 py-2" style={{ background: "rgba(255,255,255,0.04)" }}>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70">{k.label}</p>
                  <p className="text-sm font-semibold text-foreground mt-0.5">{k.val}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Reasons */}
          <div className={card} style={cardStyle}>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-semibold text-foreground">Why sales are slow</h3>
            </div>
            <ul className="space-y-2.5">
              {reasons.map((r, i) => (
                <li key={i} className="flex gap-2.5 text-[13px] text-foreground/85 leading-relaxed">
                  <span className="text-amber-400/80 mt-1 text-[10px]">●</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Suggestions */}
          <div className={card} style={cardStyle}>
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-semibold text-foreground">Actionable suggestions</h3>
            </div>
            <ul className="space-y-2.5">
              {suggestions.map((s, i) => (
                <li key={i} className="flex gap-2.5 text-[13px] text-foreground/85 leading-relaxed">
                  <span className="text-emerald-400/80 mt-1 text-[10px]">▸</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Weak categories + Top items quick view */}
          <div className="grid grid-cols-2 gap-4">
            <div className={card} style={cardStyle}>
              <h4 className="text-xs font-semibold text-muted-foreground/80 uppercase tracking-wider mb-2">Weak categories</h4>
              <div className="space-y-1.5">
                {weakCategories.length ? weakCategories.map((c) => (
                  <div key={c.name} className="flex items-center justify-between text-[12px]">
                    <span className="text-foreground/85 truncate">{c.name}</span>
                    <span className="text-red-400 font-semibold">£{c.sales.toFixed(0)}</span>
                  </div>
                )) : <p className="text-[12px] text-muted-foreground/60">No category data.</p>}
              </div>
            </div>
            <div className={card} style={cardStyle}>
              <h4 className="text-xs font-semibold text-muted-foreground/80 uppercase tracking-wider mb-2">Top performers</h4>
              <div className="space-y-1.5">
                {topItems.length ? topItems.map((t) => (
                  <div key={t.name} className="flex items-center justify-between text-[12px]">
                    <span className="text-foreground/85 truncate">{t.name}</span>
                    <span className="text-emerald-400 font-semibold">£{t.revenue.toFixed(0)}</span>
                  </div>
                )) : <p className="text-[12px] text-muted-foreground/60">No product data.</p>}
              </div>
            </div>
          </div>
        </div>

          {/* Inline conversation (only after user interacts) */}
          {messages.length > 1 && (
            <div className={card} style={cardStyle}>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-violet-400" />
                <h3 className="text-sm font-semibold text-foreground">Conversation</h3>
              </div>
              <div className="space-y-3">
                {messages.slice(1).map((m, i) => (
                  <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed whitespace-pre-wrap ${
                        m.role === "user"
                          ? "bg-primary/90 text-primary-foreground"
                          : "bg-white/[0.04] text-foreground/90 border border-white/5"
                      }`}
                    >
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
                <div ref={scrollRef} />
              </div>
            </div>
          )}
        </div>

        {/* Full-width composer pinned below content */}
        <div className="shrink-0 pt-4 space-y-2.5">
          {/* Suggestion chips */}
          <div className="flex flex-wrap gap-1.5">
            {CHIPS.map((c) => (
              <button
                key={c}
                onClick={() => ask(c)}
                disabled={busy}
                className="text-[11px] px-3 py-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/5 text-foreground/80 transition-colors disabled:opacity-50"
              >
                {c}
              </button>
            ))}
          </div>

          {/* Full-width input with embedded send */}
          <form
            onSubmit={(e) => { e.preventDefault(); ask(input); }}
            className="relative w-full"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about today's sales..."
              className="w-full bg-white/[0.04] border border-white/5 rounded-full pl-5 pr-14 py-3 text-[13px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/50"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 active:scale-95 transition-transform"
              aria-label="Send"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SalesInsightDetailView;
