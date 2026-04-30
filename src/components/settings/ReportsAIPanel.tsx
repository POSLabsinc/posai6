import { useEffect, useMemo, useState } from "react";
import { Sparkles, Send, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { KPIs, HourlyPoint, DailyPoint, TopItem, PaymentTypeSummary, CategorySummary } from "@/hooks/useReportsData";

interface Props {
  kpis: KPIs;
  salesByHour: HourlyPoint[];
  salesByDay: DailyPoint[];
  topItems: TopItem[];
  paymentTypes: PaymentTypeSummary[];
  categories: CategorySummary[];
}

const SUGGESTIONS = [
  "Why are sales low today?",
  "Which products should I promote?",
  "When should I add staff?",
  "What can I bundle for upsell?",
];

const ReportsAIPanel = ({ kpis, salesByHour, salesByDay, topItems, paymentTypes, categories }: Props) => {
  const [insights, setInsights] = useState<string[]>([]);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string>("");
  const [loadingAnswer, setLoadingAnswer] = useState(false);

  const context = useMemo(
    () => ({ kpis, salesByHour, salesByDay, topItems, paymentTypes, categories }),
    [kpis, salesByHour, salesByDay, topItems, paymentTypes, categories]
  );

  // Auto-generate insights when context changes (debounced via key)
  useEffect(() => {
    if (kpis.orderCount === 0) {
      setInsights([]);
      return;
    }
    let cancelled = false;
    setLoadingInsights(true);
    setInsights([]);
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("reports-ai", {
          body: { mode: "insights", context },
        });
        if (cancelled) return;
        if (error) throw error;
        const arr = Array.isArray(data?.insights) ? data.insights : [];
        setInsights(arr.slice(0, 4));
      } catch (e) {
        if (!cancelled) setInsights([]);
      } finally {
        if (!cancelled) setLoadingInsights(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // re-run when KPIs or top items meaningfully change
  }, [kpis.totalSales, kpis.orderCount, topItems.length]);

  const ask = async (q: string) => {
    if (!q.trim()) return;
    setLoadingAnswer(true);
    setAnswer("");
    try {
      const { data, error } = await supabase.functions.invoke("reports-ai", {
        body: { mode: "ask", question: q, context },
      });
      if (error) throw error;
      setAnswer(typeof data?.answer === "string" ? data.answer : "No answer.");
    } catch {
      setAnswer("Sorry, I couldn't generate an answer right now.");
    } finally {
      setLoadingAnswer(false);
    }
  };

  return (
    <div className="bg-card rounded-2xl p-4 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-xl bg-violet-500/15 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-violet-400" />
        </div>
        <div>
          <h4 className="text-foreground text-sm font-semibold">AI Insights</h4>
          <p className="text-muted-foreground text-xs">Live analysis of the sales data above.</p>
        </div>
      </div>

      {/* Auto insights */}
      <div className="space-y-2 mb-4">
        {loadingInsights && (
          <div className="flex items-center gap-2 text-muted-foreground text-xs">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Analyzing data...
          </div>
        )}
        {!loadingInsights && insights.length === 0 && (
          <p className="text-muted-foreground text-xs">
            {kpis.orderCount === 0 ? "No sales in this range. Try a wider date filter." : "No insights available."}
          </p>
        )}
        {insights.map((line, i) => (
          <div key={i} className="flex gap-2 text-sm text-foreground">
            <span className="text-violet-400 mt-0.5">•</span>
            <span className="leading-relaxed">{line}</span>
          </div>
        ))}
      </div>

      {/* Suggestion chips */}
      <div className="flex flex-wrap gap-2 mb-3">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => { setQuestion(s); ask(s); }}
            className="text-xs px-3 py-1.5 rounded-full bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors"
          >
            {s}
          </button>
        ))}
      </div>

      {/* Ask AI */}
      <form
        className="flex items-center gap-2"
        onSubmit={(e) => { e.preventDefault(); ask(question); }}
      >
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask a question about your sales..."
          className="flex-1 bg-surface text-foreground text-sm placeholder:text-muted-foreground rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary/40"
        />
        <button
          type="submit"
          disabled={loadingAnswer || !question.trim()}
          className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-50"
        >
          {loadingAnswer ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </form>

      {answer && (
        <div className="mt-3 bg-surface rounded-xl p-3">
          <p className="text-foreground text-sm whitespace-pre-wrap leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  );
};

export default ReportsAIPanel;
