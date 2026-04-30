import { useEffect, useMemo, useRef, useState } from "react";
import {
  Send, Loader2, Cloud, CloudRain, Sun, CloudSnow, CloudLightning, CloudFog, CloudDrizzle,
  Wind, Droplets, Thermometer, Eye, Sunrise, Lightbulb, TrendingUp, AlertTriangle,
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import AnimatedAIIcon from "@/components/AnimatedAIIcon";
import aiColorfulIcon from "@/assets/icons/ai-colorful.png";
import { supabase } from "@/integrations/supabase/client";
import type { NotificationItem } from "@/hooks/useNotifications";

interface ChatMsg { role: "user" | "assistant"; content: string }

const CHIPS = [
  "Will weather affect sales?",
  "Should I prepare for rush?",
  "Will it affect dinner sales?",
  "Should I increase staff today?",
];

// Pull a numeric value from a labeled bullet like "72°F" or "8 mph"
function pickNumber(text: string | undefined, fallback: number): number {
  if (!text) return fallback;
  const m = text.match(/-?\d+(\.\d+)?/);
  return m ? Number(m[0]) : fallback;
}

function pickText(bullets: any[] | undefined, label: string): string | undefined {
  return bullets?.find((b) => (b.label || "").toLowerCase() === label.toLowerCase())?.text;
}

// Map a condition phrase to an icon
function iconFor(condition: string) {
  const c = condition.toLowerCase();
  if (c.includes("thunder")) return CloudLightning;
  if (c.includes("snow")) return CloudSnow;
  if (c.includes("drizzle")) return CloudDrizzle;
  if (c.includes("rain") || c.includes("shower")) return CloudRain;
  if (c.includes("fog")) return CloudFog;
  if (c.includes("cloud") || c.includes("overcast")) return Cloud;
  return Sun;
}

export const WeatherInsightView = ({ notification }: { notification: NotificationItem }) => {
  // ---- Parse weather context from the notification ----
  const bullets = notification.bullets || [];
  const tempStr = pickText(bullets, "Temp") || "72°F";
  const conditionsStr = pickText(bullets, "Conditions") || "partly cloudy";
  const windStr = pickText(bullets, "Wind") || "8 mph";
  const impactStr =
    pickText(bullets, "Impact") ||
    "Steady foot traffic expected.";

  const currentTemp = pickNumber(tempStr, 72);
  const windSpeed = pickNumber(windStr, 8);
  const feelsLike = currentTemp - 1;
  const humidity = 58;
  const precipChance = /rain|shower|drizzle|thunder/i.test(conditionsStr) ? 70 : 10;
  const visibility = 10; // miles
  const ConditionIcon = iconFor(conditionsStr);

  // Location parsed from title "🌤️ Weather, New York"
  const location = useMemo(() => {
    const m = notification.title.match(/Weather,\s*(.+)$/i);
    return m ? m[1].trim() : "your area";
  }, [notification.title]);

  // ---- Build hourly forecast (next 12 hours) with mild variation ----
  const hourly = useMemo(() => {
    const hours: { time: string; temp: number; precip: number }[] = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getTime() + i * 60 * 60 * 1000);
      const hr = d.getHours();
      const label = i === 0 ? "Now" : d.toLocaleTimeString("en-US", { hour: "numeric", hour12: true });
      // Sinusoidal day curve around current temp
      const variance = Math.sin((hr / 24) * Math.PI * 2) * 4;
      const temp = Math.round(currentTemp + variance + (i === 0 ? 0 : (Math.random() * 2 - 1)));
      const precip = i >= 4 && i <= 7 && precipChance > 50 ? Math.min(90, precipChance + i * 2) : Math.max(0, precipChance - i * 3);
      hours.push({ time: label, temp, precip: Math.round(precip) });
    }
    return hours;
  }, [currentTemp, precipChance]);

  // ---- 7-day forecast ----
  const weekly = useMemo(() => {
    const days = ["Today", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const conds = [conditionsStr, "partly cloudy", "sunny", "light rain", "cloudy", "sunny", "partly cloudy"];
    return days.map((d, i) => ({
      day: d,
      high: Math.round(currentTemp + (i === 0 ? 0 : Math.sin(i) * 6 + 2)),
      low: Math.round(currentTemp - 10 + Math.cos(i) * 4),
      condition: conds[i] || "partly cloudy",
    }));
  }, [currentTemp, conditionsStr]);

  // ---- Business insights & suggestions derived from condition ----
  const insights = useMemo(() => {
    const isRain = /rain|shower|drizzle|thunder/i.test(conditionsStr);
    const isHot = currentTemp >= 85;
    const isCold = currentTemp <= 40;
    const isPleasant = !isRain && currentTemp >= 60 && currentTemp <= 80;

    if (isRain) return {
      reasoning: "Rain typically reduces walk-in traffic by 15-25% and boosts delivery orders by 30-40%, especially during lunch and dinner peaks.",
      suggestions: [
        "Prepare for delivery surge — staff up the kitchen between 6-8 PM",
        "Promote hot beverages and comfort food bundles",
        "Reduce outdoor seating staff and reassign to delivery prep",
        "Push a 'Rainy Day' promo via SMS to past delivery customers",
      ],
      tone: "warning" as const,
    };
    if (isHot) return {
      reasoning: "High temperatures slow lunch dine-in but spike cold beverage and patio bar sales in the evening.",
      suggestions: [
        "Promote iced drinks, salads, and lighter mains",
        "Stock extra ice and cold-brew inventory",
        "Add a happy-hour patio special after 5 PM",
      ],
      tone: "alert" as const,
    };
    if (isCold) return {
      reasoning: "Cold weather drives soup, hot drink and comfort food sales while reducing patio occupancy.",
      suggestions: [
        "Push hot soups and seasonal comfort dishes",
        "Pre-batch hot beverages for faster service",
        "Close patio early and reassign servers indoors",
      ],
      tone: "info" as const,
    };
    if (isPleasant) return {
      reasoning: "Clear, mild weather typically lifts dine-in covers by 10-15%, with strong patio and walk-in demand.",
      suggestions: [
        "Open all patio sections and stage extra seating",
        "Schedule one additional server for the dinner rush",
        "Run a 'Patio Pints' promo on social",
      ],
      tone: "good" as const,
    };
    return {
      reasoning: impactStr,
      suggestions: [
        "Maintain standard staffing for the shift",
        "Keep an eye on POS pace mid-shift and adjust as needed",
      ],
      tone: "info" as const,
    };
  }, [conditionsStr, currentTemp, impactStr]);

  // ===== Chat =====
  const [messages, setMessages] = useState<ChatMsg[]>([
    { role: "assistant", content: `Ask me anything about today's weather in ${location} and how it affects your sales. I only use the data shown on this screen.` },
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
        location,
        currentTemp,
        condition: conditionsStr,
        feelsLike,
        windSpeed,
        humidity,
        precipChance,
        visibility,
        hourly,
        weekly,
        impact: impactStr,
        reasoning: insights.reasoning,
        suggestions: insights.suggestions,
      };
      const { data: resp, error } = await supabase.functions.invoke("reports-ai", {
        body: { mode: "weather", question, context },
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

  const toneClasses = {
    good: { bg: "linear-gradient(135deg, rgba(16,185,129,0.10), rgba(34,197,94,0.06))", border: "1px solid rgba(16,185,129,0.25)", icon: "text-emerald-400" },
    warning: { bg: "linear-gradient(135deg, rgba(56,189,248,0.10), rgba(99,102,241,0.06))", border: "1px solid rgba(56,189,248,0.25)", icon: "text-sky-400" },
    alert: { bg: "linear-gradient(135deg, rgba(245,158,11,0.10), rgba(239,68,68,0.06))", border: "1px solid rgba(245,158,11,0.25)", icon: "text-amber-400" },
    info: { bg: "linear-gradient(135deg, rgba(148,163,184,0.10), rgba(100,116,139,0.06))", border: "1px solid rgba(148,163,184,0.25)", icon: "text-slate-300" },
  }[insights.tone];

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
          {/* Current weather summary */}
          <div className="rounded-2xl p-6" style={{ background: "linear-gradient(135deg, rgba(56,189,248,0.12), rgba(99,102,241,0.08))", border: "1px solid rgba(56,189,248,0.20)" }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground/80 font-semibold">{location}</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-5xl font-bold text-foreground">{currentTemp}°</span>
                  <span className="text-sm text-muted-foreground">F</span>
                </div>
                <p className="text-sm text-foreground/80 mt-1 capitalize">{conditionsStr}</p>
                <p className="text-xs text-muted-foreground/70 mt-0.5">Feels like {feelsLike}°</p>
              </div>
              <div className="w-20 h-20 rounded-2xl bg-white/[0.05] flex items-center justify-center">
                <ConditionIcon className="w-12 h-12 text-sky-300" />
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2 mt-5">
              {[
                { Icon: Droplets, label: "Rain", val: `${precipChance}%` },
                { Icon: Wind, label: "Wind", val: `${windSpeed} mph` },
                { Icon: Thermometer, label: "Humidity", val: `${humidity}%` },
                { Icon: Eye, label: "Visibility", val: `${visibility} mi` },
              ].map(({ Icon, label, val }) => (
                <div key={label} className="rounded-xl px-3 py-2.5" style={{ background: "rgba(255,255,255,0.05)" }}>
                  <Icon className="w-3.5 h-3.5 text-sky-300/80 mb-1" />
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70">{label}</p>
                  <p className="text-sm font-semibold text-foreground mt-0.5">{val}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Hourly forecast */}
          <div className={card} style={cardStyle}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground">Next 12 hours</h3>
              <span className="text-[11px] text-muted-foreground/70">Temperature & rain chance</span>
            </div>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={hourly} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgb(56 189 248)" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="rgb(56 189 248)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="precipGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgb(99 102 241)" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="rgb(99 102 241)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="time" tick={{ fontSize: 10, fill: "rgba(255,255,255,0.5)" }} interval={1} />
                  <YAxis yAxisId="t" tick={{ fontSize: 10, fill: "rgba(255,255,255,0.5)" }} />
                  <Tooltip
                    contentStyle={{ background: "#1c1c1e", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, fontSize: 12 }}
                    formatter={(v: any, n: any) => n === "temp" ? [`${v}°F`, "Temp"] : [`${v}%`, "Rain"]}
                  />
                  <Area yAxisId="t" type="monotone" dataKey="temp" stroke="rgb(56 189 248)" strokeWidth={2} fill="url(#tempGrad)" />
                  <Area yAxisId="t" type="monotone" dataKey="precip" stroke="rgb(99 102 241)" strokeWidth={1.5} fill="url(#precipGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 7-day forecast */}
          <div className={card} style={cardStyle}>
            <h3 className="text-sm font-semibold text-foreground mb-3">7-day forecast</h3>
            <div className="space-y-1.5">
              {weekly.map((d) => {
                const Ic = iconFor(d.condition);
                const range = Math.max(1, d.high - d.low);
                return (
                  <div key={d.day} className="grid grid-cols-[60px_28px_1fr_44px] items-center gap-3 py-1.5">
                    <span className="text-[13px] text-foreground/85 font-medium">{d.day}</span>
                    <Ic className="w-4 h-4 text-sky-300/80" />
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-muted-foreground w-7 text-right">{d.low}°</span>
                      <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] relative overflow-hidden">
                        <div
                          className="absolute h-full rounded-full"
                          style={{
                            left: `${Math.max(0, ((d.low - 30) / 70) * 100)}%`,
                            width: `${Math.min(100, (range / 70) * 100)}%`,
                            background: "linear-gradient(90deg, rgb(56 189 248), rgb(245 158 11))",
                          }}
                        />
                      </div>
                      <span className="text-[11px] text-foreground/80 w-7">{d.high}°</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground/70 capitalize text-right truncate">{d.condition}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Business impact reasoning */}
          <div className="rounded-2xl p-5" style={{ background: toneClasses.bg, border: toneClasses.border }}>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className={`w-4 h-4 ${toneClasses.icon}`} />
              <h3 className="text-sm font-semibold text-foreground">How this affects your sales</h3>
            </div>
            <p className="text-[13px] text-foreground/90 leading-relaxed">{insights.reasoning}</p>
          </div>

          {/* Actionable suggestions */}
          <div className={card} style={cardStyle}>
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-semibold text-foreground">Recommended actions</h3>
            </div>
            <ul className="space-y-2.5">
              {insights.suggestions.map((s, i) => (
                <li key={i} className="flex gap-2.5 text-[13px] text-foreground/85 leading-relaxed">
                  <span className="text-emerald-400/80 mt-1 text-[10px]">▸</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Inline conversation */}
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
              placeholder="Ask about today's weather and sales..."
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

export default WeatherInsightView;
