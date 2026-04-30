import { useEffect, useMemo, useRef, useState } from "react";
import { Send, TrendingUp, TrendingDown, AlertTriangle, Lightbulb, Loader2, CloudRain, Truck, Package, ShoppingBasket, Fuel, Sun } from "lucide-react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceDot,
} from "recharts";
import AnimatedAIIcon from "@/components/AnimatedAIIcon";
import aiColorfulIcon from "@/assets/icons/ai-colorful.png";
import { supabase } from "@/integrations/supabase/client";
import type { NotificationItem } from "@/hooks/useNotifications";
import { type CommodityData } from "./commodityData";

interface ChatMsg { role: "user" | "assistant"; content: string }

const ICONS: Record<string, { Icon: any; color: string; bg: string }> = {
  rain: { Icon: CloudRain, color: "text-sky-400", bg: "bg-sky-500/10" },
  truck: { Icon: Truck, color: "text-amber-400", bg: "bg-amber-500/10" },
  package: { Icon: Package, color: "text-violet-400", bg: "bg-violet-500/10" },
  demand: { Icon: ShoppingBasket, color: "text-emerald-400", bg: "bg-emerald-500/10" },
  fuel: { Icon: Fuel, color: "text-orange-400", bg: "bg-orange-500/10" },
  season: { Icon: Sun, color: "text-yellow-400", bg: "bg-yellow-500/10" },
};

interface Props {
  notification: NotificationItem;
  data: CommodityData;
}

export const CommodityPriceInsightView = ({ notification, data }: Props) => {
  const peakDay = useMemo(() => data.forecast.reduce((p, c) => (c.price > p.price ? c : p), data.forecast[0]), [data]);
  const lowestDay = useMemo(() => data.forecast.reduce((p, c) => (c.price < p.price ? c : p), data.forecast[0]), [data]);

  const [messages, setMessages] = useState<ChatMsg[]>([
    { role: "assistant", content: `Ask me anything about ${data.product.toLowerCase()} pricing. I only use the data shown on this screen.` },
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
        product: data.product,
        unit: data.unit,
        today: data.today,
        yesterday: data.yesterday,
        lastWeekAverage: data.lastWeekAvg,
        weekChangePct: data.weekChangePct,
        forecast: data.forecast,
        peakDay,
        lowestDay,
        reasons: data.reasons.map((r) => r.text),
        suggestions: data.suggestions,
        decision: data.decision,
      };
      const { data: resp, error } = await supabase.functions.invoke("reports-ai", {
        body: { mode: "onion", question, context },
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

  const card = "rounded-2xl p-5";
  const cardStyle = { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" } as const;
  const isUp = data.weekChangePct >= 0;

  // Compute a sensible Y axis domain
  const prices = data.forecast.map((f) => f.price);
  const yMin = Math.max(0, Math.min(...prices) - 0.1);
  const yMax = Math.max(...prices) + 0.1;

  return (
    <div className="h-full w-full flex flex-col px-6 pt-6 pb-6 overflow-hidden">
      {/* Header */}
      <div className="flex items-start gap-3 mb-5 shrink-0">
        <div className="shrink-0 -ml-2 -mt-2">
          <AnimatedAIIcon size={32} />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-[1.15rem] font-bold text-foreground leading-snug tracking-tight">
            {notification.headline || notification.title}
          </h1>
          <p className="text-xs text-muted-foreground/70 mt-1 font-medium">
            {notification.version_date} · {notification.time}
          </p>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 flex flex-col gap-4 min-h-0 overflow-y-auto scrollbar-hide pr-1">
          {/* Today's price card */}
          <div className={card} style={cardStyle}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground/70 font-semibold">
                  Today's {data.product.toLowerCase()} price
                </p>
                <div className="flex items-baseline gap-2 mt-1">
                  {data.emoji && <span className="text-2xl">{data.emoji}</span>}
                  <span className="text-3xl font-bold text-foreground">£{data.today.toFixed(2)}</span>
                  <span className="text-sm text-muted-foreground">{data.unit.replace("£", "")}</span>
                </div>
              </div>
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${isUp ? "bg-red-500/10 border border-red-500/20" : "bg-emerald-500/10 border border-emerald-500/20"}`}>
                {isUp ? <TrendingUp className="w-3.5 h-3.5 text-red-400" /> : <TrendingDown className="w-3.5 h-3.5 text-emerald-400" />}
                <span className={`text-xs font-semibold ${isUp ? "text-red-400" : "text-emerald-400"}`}>
                  {isUp ? "+" : ""}{data.weekChangePct}% WoW
                </span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Yesterday", val: `£${data.yesterday.toFixed(2)}` },
                { label: "Last week avg", val: `£${data.lastWeekAvg.toFixed(2)}` },
                { label: "Peak forecast", val: `£${peakDay.price.toFixed(2)} (${peakDay.day})` },
              ].map((k) => (
                <div key={k.label} className="rounded-xl px-3 py-2" style={{ background: "rgba(255,255,255,0.04)" }}>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70">{k.label}</p>
                  <p className="text-sm font-semibold text-foreground mt-0.5">{k.val}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Forecast chart */}
          <div className={card} style={cardStyle}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-foreground">7-day price forecast</h3>
                <p className="text-[11px] text-muted-foreground/70">Wholesale {data.unit}, peaks {peakDay.day} then eases</p>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <TrendingDown className="w-3 h-3 text-emerald-400" />
                <span className="text-[11px] font-semibold text-emerald-400">Low £{lowestDay.price.toFixed(2)} ({lowestDay.day})</span>
              </div>
            </div>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data.forecast} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id={`bar-${data.product}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.85} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: "rgba(255,255,255,0.5)" }} />
                  <YAxis tick={{ fontSize: 10, fill: "rgba(255,255,255,0.5)" }} domain={[yMin, yMax]} />
                  <Tooltip
                    contentStyle={{ background: "#1c1c1e", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, fontSize: 12 }}
                    formatter={(v: any) => [`£${Number(v).toFixed(2)}`, "Price"]}
                  />
                  <Bar dataKey="price" fill={`url(#bar-${data.product})`} radius={[6, 6, 0, 0]} maxBarSize={28} />
                  <Line type="monotone" dataKey="price" stroke="rgba(244,114,182,0.9)" strokeWidth={2} dot={{ r: 3, fill: "rgba(244,114,182,1)" }} />
                  <ReferenceDot
                    x={peakDay.day}
                    y={peakDay.price}
                    r={6}
                    fill="rgb(239 68 68)"
                    stroke="white"
                    strokeWidth={1.5}
                    label={{ value: "Peak", position: "top", fill: "rgb(248 113 113)", fontSize: 10, fontWeight: 600 }}
                  />
                  <ReferenceDot
                    x={lowestDay.day}
                    y={lowestDay.price}
                    r={5}
                    fill="rgb(16 185 129)"
                    stroke="white"
                    strokeWidth={1.5}
                    label={{ value: "Low", position: "top", fill: "rgb(52 211 153)", fontSize: 10, fontWeight: 600 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Reasons */}
          <div className={card} style={cardStyle}>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-semibold text-foreground">Why prices are {isUp ? "up" : "down"}</h3>
            </div>
            <ul className="space-y-2.5">
              {data.reasons.map((r, i) => {
                const cfg = ICONS[r.iconKey] || ICONS.package;
                const Icon = cfg.Icon;
                return (
                  <li key={i} className="flex items-start gap-3 text-[13px] text-foreground/85 leading-relaxed">
                    <div className={`w-7 h-7 rounded-lg ${cfg.bg} flex items-center justify-center shrink-0`}>
                      <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                    </div>
                    <span className="pt-1">{r.text}</span>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Decision */}
          <div className="rounded-2xl p-5" style={{ background: "linear-gradient(135deg, rgba(245,158,11,0.10), rgba(239,68,68,0.06))", border: "1px solid rgba(245,158,11,0.25)" }}>
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-semibold text-foreground">Recommendation</h3>
            </div>
            <p className="text-[13px] text-foreground/90 leading-relaxed">{data.decision}</p>
          </div>

          {/* Suggestions */}
          <div className={card} style={cardStyle}>
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-semibold text-foreground">Actionable suggestions</h3>
            </div>
            <ul className="space-y-2.5">
              {data.suggestions.map((s, i) => (
                <li key={i} className="flex gap-2.5 text-[13px] text-foreground/85 leading-relaxed">
                  <span className="text-emerald-400/80 mt-1 text-[10px]">▸</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Conversation */}
          {messages.length > 1 && (
            <div className={card} style={cardStyle}>
              <div className="flex items-center gap-2 mb-3">
                <img src={aiColorfulIcon} alt="AI" className="w-4 h-4" />
                <h3 className="text-sm font-semibold text-foreground">Conversation</h3>
              </div>
              <div className="space-y-3">
                {messages.slice(1).map((m, i) => (
                  <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} gap-2 items-end`}>
                    {m.role === "assistant" && (
                      <img src={aiColorfulIcon} alt="AI" className="w-6 h-6 shrink-0 mb-0.5" />
                    )}
                    <div
                      className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed whitespace-pre-wrap ${
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
                  <div className="flex justify-start gap-2 items-end">
                    <img src={aiColorfulIcon} alt="AI" className="w-6 h-6 shrink-0 mb-0.5" />
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

        {/* Composer */}
        <div className="shrink-0 pt-4 space-y-2.5">
          <div className="flex flex-wrap gap-1.5">
            {data.chips.map((c) => (
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
          <form onSubmit={(e) => { e.preventDefault(); ask(input); }} className="relative w-full">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Ask about ${data.product.toLowerCase()} prices...`}
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

export default CommodityPriceInsightView;
