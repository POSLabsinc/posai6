import { useEffect, useMemo, useRef, useState } from "react";
import { Send, Sparkles, BarChart3, ChevronDown, ChevronLeft, Check, Clock, Loader2 } from "lucide-react";
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
import { SettingsManager } from "@/lib/settingsManager";

interface ChatMsg { role: "user" | "assistant"; content: string }

type RecCategory = "Staffing" | "Menu" | "Labor" | "Finance" | "Promo";
interface Recommendation {
  id: string;
  text: string;
  category: RecCategory;
  when: string;
  dotColor: string;
}

const CATEGORY_STYLES: Record<RecCategory, string> = {
  Staffing: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  Menu: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  Labor: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  Finance: "bg-red-500/15 text-red-400 border-red-500/30",
  Promo: "bg-amber-500/15 text-amber-400 border-amber-500/30",
};

// TODO: replace with real /recommendations endpoint
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

// Dashboard-home parity metrics (matches statsData["Today"] in src/pages/Dashboard.tsx)
const DASHBOARD_METRICS = [
  { label: "Total Sale", value: "$ 1,400.00", change: "2.2%", isUp: true, icon: "$" as const },
  { label: "Total Tip", value: "$ 285.00", change: "2.2%", isUp: true, icon: "$" as const },
  { label: "Total Hours", value: "6h 28min", change: "0.5%", isUp: false, icon: "clock" as const },
  { label: "Ordering", value: "12", change: "2.5%", isUp: true, icon: "clock" as const },
  { label: "Ready to Served", value: "5", change: "1%", isUp: false, icon: "check" as const },
  { label: "Completed", value: "8", change: "1%", isUp: false, icon: "check2" as const },
];

export const SalesInsightDetailView = ({ notification }: { notification: NotificationItem }) => {
  // Today's range
  const { start, end } = useMemo(() => {
    const s = new Date(); s.setHours(0, 0, 0, 0);
    const e = new Date(); e.setHours(23, 59, 59, 999);
    return { start: s, end: e };
  }, []);
  const data = useReportsData(start, end, "00:00", "23:59");

  const todayTotal = data.kpis.totalSales || 0;
  // TODO: wire to real yesterday range; using deterministic offset for now
  const yesterdayTotal = useMemo(() => Math.max(0, Math.round(todayTotal * 0.94)), [todayTotal]);

  const chartData = useMemo(
    () => data.salesByHour.map((h) => ({
      hour: h.hour,
      today: h.sales,
      yesterday: Math.round(h.sales * (0.85 + ((h.hour.charCodeAt(0) % 5) * 0.04))),
    })),
    [data.salesByHour]
  );

  // Visible metrics (respects Control Center toggles)
  const visibleMetrics = useMemo(() => {
    const settings = SettingsManager.getControlCenterSettings().dashboardMetrics;
    const labelToKey: Record<string, keyof typeof settings> = {
      "Total Sale": "totalSale",
      "Total Tip": "totalTip",
      "Total Hours": "totalHours",
      "Ordering": "ordering",
      "Ready to Served": "readyToServed",
      "Completed": "completed",
    };
    return DASHBOARD_METRICS.filter((m) => {
      const k = labelToKey[m.label];
      return k ? settings[k] !== false : true;
    });
  }, []);

  // ===== Right panel state =====
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
      const context = {
        kpis: data.kpis,
        topItems: data.topItems,
        categories: data.categories,
        salesByHour: data.salesByHour,
        recommendations: MOCK_RECS,
      };
      const { data: resp, error } = await supabase.functions.invoke("reports-ai", {
        body: { mode: "ask", question, context },
      });
      if (error) throw error;
      const answer = (resp as any)?.answer || "I couldn't generate an answer from the visible data.";
      setMessages((m) => [...m, { role: "assistant", content: answer }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "Sorry, I couldn't reach the analytics service right now." }]);
    } finally {
      setBusy(false);
    }
  };

  const openChatWithRec = (rec: Recommendation) => {
    setRightView("chat");
    ask(`Tell me more about: ${rec.text}`);
  };

  const openChatAll = () => {
    setRightView("chat");
  };

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

      {/* Two-column layout */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* LEFT: chart + metrics */}
        <div className="flex-1 flex flex-col gap-4 min-w-0 overflow-y-auto scrollbar-hide pr-1">
          {/* Today chart card */}
          <div className="rounded-2xl p-5" style={cardStyle}>
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
              <div className="flex flex-col">
                <button className="flex items-center gap-1 text-xs text-muted-foreground/70 mb-1.5 hover:text-foreground transition-colors">
                  Net Sales <ChevronDown className="w-3 h-3" />
                </button>
                <span className="text-3xl font-bold text-foreground tabular-nums">${todayTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <span className="text-sm text-muted-foreground/60 pb-1.5">vs</span>
              <div className="flex flex-col">
                <button className="flex items-center gap-1 text-xs text-muted-foreground/70 mb-1.5 hover:text-foreground transition-colors">
                  Yesterday <ChevronDown className="w-3 h-3" />
                </button>
                <span className="text-3xl font-bold text-muted-foreground/60 tabular-nums">${yesterdayTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis dataKey="hour" tick={{ fontSize: 10, fill: "rgba(255,255,255,0.5)" }} interval={2} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "rgba(255,255,255,0.5)" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: "#1c1c1e", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, fontSize: 12 }}
                    formatter={(v: any, n: any) => [`$${v}`, n === "today" ? "Today" : "Yesterday"]}
                  />
                  <Bar dataKey="today" fill="#ef4444" radius={[3, 3, 0, 0]} maxBarSize={14} />
                  <Bar dataKey="yesterday" fill="#7f1d1d" radius={[3, 3, 0, 0]} maxBarSize={14} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Dashboard-parity metrics row */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {visibleMetrics.map((stat) => (
              <div
                key={stat.label}
                className="flex-shrink-0 rounded-xl px-4 py-3 min-w-[160px] flex-1"
                style={{ background: "#7575754D", boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)" }}
              >
                <div className="flex items-center gap-2 text-xs text-white/60 mb-2">
                  {stat.icon === "clock" ? (
                    <Clock className="w-4 h-4 text-white/60" />
                  ) : stat.icon === "check" ? (
                    <div className="w-4 h-4 rounded border border-white/40 flex items-center justify-center">
                      <Check className="w-3 h-3" />
                    </div>
                  ) : stat.icon === "check2" ? (
                    <Check className="w-4 h-4 text-white/60" />
                  ) : (
                    <span className="text-sm">{stat.icon}</span>
                  )}
                  <span>{stat.label}</span>
                </div>
                <div className="text-xl font-semibold mb-1 text-foreground">{stat.value}</div>
                <div className={`text-xs flex items-center gap-1 ${stat.isUp ? "text-green-400" : "text-red-400"}`}>
                  <span>{stat.isUp ? "↗" : "↘"}</span>
                  <span>{stat.change}</span>
                  <span className="text-white/40">from yesterday</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: Recommendations OR Ask Maya chat */}
        <div className="w-[380px] shrink-0 rounded-2xl flex flex-col min-h-0" style={cardStyle}>
          {rightView === "recs" ? (
            <>
              <div className="flex items-center gap-2 px-5 pt-5 pb-3 shrink-0">
                <h3 className="text-base font-bold text-foreground flex-1">Recommendations</h3>
                <div className="w-7 h-7 rounded-full bg-violet-500/15 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-violet-400" />
                </div>
                <span className="text-sm font-semibold text-foreground tabular-nums">{MOCK_RECS.length}</span>
              </div>

              <div className="flex-1 overflow-y-auto scrollbar-hide px-5 pb-2 space-y-4">
                {MOCK_RECS.slice(0, 3).map((rec) => (
                  <button
                    key={rec.id}
                    onClick={() => openChatWithRec(rec)}
                    className="w-full text-left group min-h-[44px]"
                  >
                    <div className="flex gap-2.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${rec.dotColor} mt-2 shrink-0`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] text-foreground/90 leading-relaxed mb-2 group-hover:text-foreground transition-colors">{rec.text}</p>
                        <div className="flex items-center justify-between">
                          <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${CATEGORY_STYLES[rec.category]}`}>
                            {rec.category}
                          </span>
                          <span className="text-[11px] text-muted-foreground/70">{rec.when}</span>
                        </div>
                      </div>
                    </div>
                    <div className="h-px bg-white/[0.06] mt-4" />
                  </button>
                ))}
              </div>

              <div className="px-5 pb-5 pt-2 shrink-0">
                <button
                  onClick={openChatAll}
                  className="w-full min-h-[44px] flex items-center justify-between text-[13px] font-medium text-foreground/80 hover:text-foreground transition-colors"
                >
                  <span>View all {MOCK_RECS.length} recommendations</span>
                  <span aria-hidden>→</span>
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Chat header */}
              <div className="flex items-center gap-3 px-5 pt-5 pb-3 shrink-0 border-b border-white/[0.06]">
                <button
                  onClick={() => setRightView("recs")}
                  className="w-9 h-9 -ml-2 rounded-full hover:bg-white/[0.06] flex items-center justify-center transition-colors"
                  aria-label="Back to recommendations"
                >
                  <ChevronLeft className="w-5 h-5 text-foreground" />
                </button>
                <h3 className="text-base font-bold text-foreground flex-1">Ask Maya</h3>
                <div className="w-7 h-7 rounded-full bg-violet-500/15 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-violet-400" />
                </div>
              </div>

              {/* Chat body */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-hide px-4 py-4 space-y-3">
                {/* Recommendations as tappable chat cards */}
                <div className="space-y-2">
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground/60 px-1">All recommendations</p>
                  {MOCK_RECS.map((rec) => (
                    <button
                      key={rec.id}
                      onClick={() => ask(`Tell me more about: ${rec.text}`)}
                      disabled={busy}
                      className="w-full text-left rounded-xl p-3 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.05] transition-colors disabled:opacity-50 min-h-[44px]"
                    >
                      <div className="flex gap-2.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${rec.dotColor} mt-1.5 shrink-0`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-[12.5px] text-foreground/90 leading-relaxed mb-1.5">{rec.text}</p>
                          <span className={`inline-block text-[10.5px] font-semibold px-2 py-0.5 rounded-full border ${CATEGORY_STYLES[rec.category]}`}>
                            {rec.category}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Conversation */}
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
              </div>

              {/* Composer */}
              <form
                onSubmit={(e) => { e.preventDefault(); ask(input); }}
                className="relative shrink-0 p-3 border-t border-white/[0.06]"
              >
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask Maya..."
                  className="w-full bg-white/[0.04] border border-white/5 rounded-full pl-4 pr-12 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/50"
                />
                <button
                  type="submit"
                  disabled={busy || !input.trim()}
                  className="absolute right-5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 active:scale-95 transition-transform"
                  aria-label="Send"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SalesInsightDetailView;
