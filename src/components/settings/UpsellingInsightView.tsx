import { useEffect, useRef, useState } from "react";
import { Send, TrendingUp, Lightbulb, Loader2, Sparkles, Clock, Layers, Tag, Flame } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";
import AnimatedAIIcon from "@/components/AnimatedAIIcon";
import aiColorfulIcon from "@/assets/icons/ai-colorful.png";
import { supabase } from "@/integrations/supabase/client";
import type { NotificationItem } from "@/hooks/useNotifications";

interface ChatMsg { role: "user" | "assistant"; content: string }

const TOP_SELLERS = [
  { name: "Cheeseburger", units: 142, margin: 62 },
  { name: "Margherita Pizza", units: 118, margin: 71 },
  { name: "Caesar Salad", units: 96, margin: 68 },
  { name: "Chicken Wings", units: 87, margin: 58 },
  { name: "Fish & Chips", units: 74, margin: 52 },
];

const COMBOS = [
  { combo: "Cheeseburger + Fries + Soft Drink", lift: "+£3.20 avg ticket", attach: "78% co-purchase" },
  { combo: "Pizza + Garlic Bread", lift: "+£4.50 avg ticket", attach: "61% co-purchase" },
  { combo: "Wings + Beer", lift: "+£5.00 avg ticket", attach: "54% co-purchase" },
  { combo: "Caesar Salad + Soup of the Day", lift: "+£3.80 avg ticket", attach: "42% co-purchase" },
];

const HIGH_MARGIN = [
  { name: "Iced Latte", margin: 78, suggestion: "Promote as add-on at checkout" },
  { name: "Tiramisu", margin: 74, suggestion: "Suggest as dessert pairing on dine-in" },
  { name: "Truffle Fries (upgrade)", margin: 72, suggestion: "Offer as fries upgrade for +£2" },
];

const TIPS = [
  { icon: Layers, color: "text-violet-400", bg: "bg-violet-500/10", text: "Bundle Cheeseburger + Fries + Soft Drink at £11.95 to lift ticket avg by ~£3.20." },
  { icon: Flame, color: "text-orange-400", bg: "bg-orange-500/10", text: "Promote Truffle Fries upgrade during 12-2pm lunch rush, 72% margin." },
  { icon: Tag, color: "text-emerald-400", bg: "bg-emerald-500/10", text: "Offer 15% off Fish & Chips after 8pm, slowest-selling main right now." },
  { icon: Clock, color: "text-sky-400", bg: "bg-sky-500/10", text: "Push Wings + Beer combo on Thursday/Friday between 6-9pm peak." },
];

const REASONING = [
  "Cheeseburger has the highest unit volume (142) and 62% margin — perfect anchor for combos.",
  "Customers buying Pizza add Garlic Bread 61% of the time — server prompt boosts attach.",
  "Iced Latte has the highest margin (78%) but low attach rate — capture at checkout.",
  "Fish & Chips sales drop sharply after 8pm — discount clears prep stock.",
];

const TIMING = [
  { window: "Lunch rush (12-2pm)", action: "Upsell fries upgrade, side salad, soft drinks" },
  { window: "Dinner peak (6-9pm)", action: "Push combo bundles + dessert pairings" },
  { window: "Late night (8-10pm)", action: "Discount slow-movers, promote shareables" },
];

const CHIPS = [
  "Which product should I upsell today?",
  "What combo works best?",
  "What should I promote during dinner rush?",
  "Which slow-movers should I discount?",
];

export const UpsellingInsightView = ({ notification }: { notification: NotificationItem }) => {
  const [messages, setMessages] = useState<ChatMsg[]>([
    { role: "assistant", content: "Ask me anything about today's upselling and promotion strategy. I only use the data shown on this screen." },
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
        topSellers: TOP_SELLERS,
        combos: COMBOS,
        highMargin: HIGH_MARGIN,
        tips: TIPS.map((t) => t.text),
        reasoning: REASONING,
        timing: TIMING,
      };
      const { data: resp, error } = await supabase.functions.invoke("reports-ai", {
        body: { mode: "upsell", question, context },
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
          {/* Top sellers chart */}
          <div className={card} style={cardStyle}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  Top sellers today
                </h3>
                <p className="text-[11px] text-muted-foreground/70">Units sold, ranked by volume</p>
              </div>
            </div>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={TOP_SELLERS} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: "rgba(255,255,255,0.5)" }} interval={0} />
                  <YAxis tick={{ fontSize: 10, fill: "rgba(255,255,255,0.5)" }} />
                  <Tooltip
                    contentStyle={{ background: "#1c1c1e", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, fontSize: 12 }}
                    formatter={(v: any, n: any) => [v, n === "units" ? "Units" : "Margin %"]}
                  />
                  <Bar dataKey="units" radius={[6, 6, 0, 0]} maxBarSize={36}>
                    {TOP_SELLERS.map((_, i) => (
                      <Cell key={i} fill={i === 0 ? "rgb(16 185 129)" : i === 1 ? "rgb(59 130 246)" : "hsl(var(--primary))"} fillOpacity={0.85} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Combos */}
          <div className={card} style={cardStyle}>
            <div className="flex items-center gap-2 mb-3">
              <Layers className="w-4 h-4 text-violet-400" />
              <h3 className="text-sm font-semibold text-foreground">Frequently bought together</h3>
            </div>
            <div className="space-y-2.5">
              {COMBOS.map((c, i) => (
                <div key={i} className="rounded-xl px-3.5 py-3 flex items-center justify-between gap-3" style={{ background: "rgba(255,255,255,0.04)" }}>
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-foreground truncate">{c.combo}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{c.attach}</p>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-400 shrink-0">{c.lift}</span>
                </div>
              ))}
            </div>
          </div>

          {/* High margin */}
          <div className={card} style={cardStyle}>
            <div className="flex items-center gap-2 mb-3">
              <Flame className="w-4 h-4 text-orange-400" />
              <h3 className="text-sm font-semibold text-foreground">High-margin products to promote</h3>
            </div>
            <div className="space-y-2.5">
              {HIGH_MARGIN.map((p, i) => (
                <div key={i} className="rounded-xl px-3.5 py-3" style={{ background: "rgba(255,255,255,0.04)" }}>
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <p className="text-[13px] font-medium text-foreground">{p.name}</p>
                    <span className="text-[11px] font-semibold text-orange-400">{p.margin}% margin</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">{p.suggestion}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Actionable tips */}
          <div className="rounded-2xl p-5" style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.10), rgba(59,130,246,0.06))", border: "1px solid rgba(139,92,246,0.25)" }}>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-violet-400" />
              <h3 className="text-sm font-semibold text-foreground">Actionable upsell tips</h3>
            </div>
            <ul className="space-y-2.5">
              {TIPS.map((t, i) => {
                const Icon = t.icon;
                return (
                  <li key={i} className="flex items-start gap-3 text-[13px] text-foreground/90 leading-relaxed">
                    <div className={`w-7 h-7 rounded-lg ${t.bg} flex items-center justify-center shrink-0`}>
                      <Icon className={`w-3.5 h-3.5 ${t.color}`} />
                    </div>
                    <span className="pt-1">{t.text}</span>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Reasoning */}
          <div className={card} style={cardStyle}>
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-semibold text-foreground">Why these suggestions</h3>
            </div>
            <ul className="space-y-2.5">
              {REASONING.map((r, i) => (
                <li key={i} className="flex gap-2.5 text-[13px] text-foreground/85 leading-relaxed">
                  <span className="text-amber-400/80 mt-1 text-[10px]">▸</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Timing */}
          <div className={card} style={cardStyle}>
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-sky-400" />
              <h3 className="text-sm font-semibold text-foreground">Best timing for upsells</h3>
            </div>
            <div className="space-y-2">
              {TIMING.map((t, i) => (
                <div key={i} className="flex items-start gap-3 text-[13px]">
                  <span className="font-semibold text-sky-400 shrink-0 min-w-[140px]">{t.window}</span>
                  <span className="text-foreground/80">{t.action}</span>
                </div>
              ))}
            </div>
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
          <form onSubmit={(e) => { e.preventDefault(); ask(input); }} className="relative w-full">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about upselling and promotions..."
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

export default UpsellingInsightView;
