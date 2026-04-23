import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Plus, Search, Mic, Clock, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { SortableHeader, useSortableData } from "./SortableHeader";

type TimedPricingSortKey = "name" | "startTime" | "endTime" | "days";

interface TimedPricingRule {
  id: string;
  name: string;
  type: "happy_hour" | "peak_time" | "late_night" | "custom";
  startTime: string;
  endTime: string;
  adjustment: number;
  days: string[];
  enabled: boolean;
}

interface TimedPricingContentProps {
  showHeader?: boolean;
  onBack?: () => void;
  onAIClick?: () => void;
}

const typeLabels: Record<TimedPricingRule["type"], string> = {
  happy_hour: "Happy Hour",
  peak_time: "Peak Time",
  late_night: "Late Night",
  custom: "Custom",
};

const typeColors: Record<TimedPricingRule["type"], string> = {
  happy_hour: "#34C759",
  peak_time: "#FF9500",
  late_night: "#AF52DE",
  custom: "#0088FF",
};

const TimedPricingContent = ({ showHeader = true, onBack, onAIClick }: TimedPricingContentProps) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  const [rules, setRules] = useState<TimedPricingRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [ruleToDelete, setRuleToDelete] = useState<TimedPricingRule | null>(null);

  const fetchRules = async () => {
    const { data, error } = await (supabase as any)
      .from("timed_pricing_rules")
      .select("*")
      .order("created_at");
    if (data) {
      setRules(data.map((r: any) => ({
        id: r.id,
        name: r.name,
        type: r.type as TimedPricingRule["type"],
        startTime: r.start_time,
        endTime: r.end_time,
        adjustment: Number(r.adjustment),
        days: r.days || [],
        enabled: r.enabled,
      })));
    }
    if (error) console.error("Failed to fetch timed pricing rules", error);
    setLoading(false);
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleToggle = async (id: string, enabled: boolean) => {
    const { error } = await (supabase as any).from("timed_pricing_rules").update({ enabled }).eq("id", id);
    if (!error) {
      setRules(rules.map((r) => (r.id === id ? { ...r, enabled } : r)));
    }
  };

  const confirmDelete = async () => {
    if (ruleToDelete) {
      const { error } = await (supabase as any).from("timed_pricing_rules").delete().eq("id", ruleToDelete.id);
      if (!error) await fetchRules();
      setRuleToDelete(null);
    }
  };

  const filteredRules = rules.filter((r) =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const { sortedItems: sortedRules, sort: ruleSort, requestSort: sortRules } =
    useSortableData<TimedPricingRule, TimedPricingSortKey>(filteredRules, (item, key) => {
      if (key === "startTime") return item.startTime;
      if (key === "endTime") return item.endTime;
      if (key === "days") return item.days.join(",");
      return item.name;
    });

  if (loading) {
    return <div className="h-full flex items-center justify-center text-muted-foreground">Loading...</div>;
  }

  // Desktop / Tablet
  if (!isMobile) {
    return (
      <div className="h-full flex flex-col overflow-hidden bg-background">
        {showHeader && (
          <div className="flex items-center justify-between pt-0 pb-2 relative overflow-visible px-4">
            {onBack && (
              <button onClick={onBack} className="w-10 h-10 rounded-full bg-neutral-800/60 flex items-center justify-center active:opacity-70 transition-opacity" aria-label="Back">
                <ChevronLeft className="w-5 h-5 text-foreground" />
              </button>
            )}
            {!onBack && <div className="w-8 h-8" />}
            <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1.5">
              <h1 className="text-xl font-semibold text-foreground">Timed Pricing</h1>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto scrollbar-hide px-6 pb-6">
          <div className="mt-4 mb-4 px-1">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Configure time-based pricing rules to automatically adjust product prices during happy hours, peak times, late night specials, or any custom schedule you define.
            </p>
          </div>

          <section className="mt-6 flex items-center gap-2 lg:gap-4">
            <div className="flex-1 min-w-0 rounded-full bg-neutral-800/60 px-5 py-3 flex items-center gap-3">
              <Search className="h-5 w-5 flex-shrink-0 text-[hsl(var(--text-subtle))]" />
              <input type="text" placeholder="Search rules" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="flex-1 min-w-0 bg-transparent text-foreground placeholder:text-[hsl(var(--text-subtle))] outline-none text-[15px]" />
              <Mic className="h-5 w-5 flex-shrink-0 text-[hsl(var(--text-subtle))]" />
            </div>
            <button onClick={() => navigate('/settings/menu/timed-pricing/add')} className="h-12 rounded-full px-5 lg:px-10 flex-shrink-0 flex items-center justify-center gap-2 bg-neutral-800/60 text-foreground active:opacity-70 transition-opacity">
              <Plus className="h-5 w-5" />
              <span className="text-[15px] font-semibold">Add</span>
            </button>
          </section>

          <section className="mt-6 rounded-2xl bg-neutral-800/60 overflow-hidden">
            <div className="grid grid-cols-[1.5fr_1fr_1fr_1.2fr_32px] items-center px-8 py-4 border-b border-neutral-700/50">
              <span className="text-sm font-medium text-muted-foreground">Timed Pricing Name</span>
              <span className="text-sm font-medium text-muted-foreground">Start Date</span>
              <span className="text-sm font-medium text-muted-foreground">End Date</span>
              <span className="text-sm font-medium text-muted-foreground text-right">Days</span>
              <span />
            </div>

            {filteredRules.length > 0 ? (
              filteredRules.map((rule, index) => (
                <div key={rule.id}>
                  {index > 0 && <div className="h-px bg-neutral-700/30" />}
                  <button onClick={() => navigate(`/settings/menu/timed-pricing/edit/${rule.id}`)} className="grid grid-cols-[1.5fr_1fr_1fr_1.2fr_32px] items-center px-8 py-5 w-full hover:bg-neutral-700/20 transition-colors cursor-pointer">
                    <span className="text-[15px] text-foreground text-left">{rule.name}</span>
                    <span className="text-[15px] text-muted-foreground">{rule.startTime}</span>
                    <span className="text-[15px] text-muted-foreground">{rule.endTime}</span>
                    <span className="text-[15px] text-muted-foreground text-right">{rule.days.length === 7 ? "Mon, Tue, Wed, Thu, Fri, Sat, Sun" : rule.days.join(", ")}</span>
                    <ChevronRight className="w-5 h-5 text-muted-foreground justify-self-end" />
                  </button>
                </div>
              ))
            ) : (
              <div className="px-8 py-10 text-center text-[hsl(var(--text-subtle))]">No pricing rules found</div>
            )}
          </section>

        </div>

        <DeleteDialog rule={ruleToDelete} onCancel={() => setRuleToDelete(null)} onConfirm={confirmDelete} />
      </div>
    );
  }

  // Mobile
  return (
    <div className="h-full flex flex-col overflow-hidden bg-background">
      {showHeader && (
        <div className="flex items-center justify-center py-4 px-4 relative">
          {onBack && (
            <button onClick={onBack} className="absolute left-4 w-10 h-10 rounded-full bg-neutral-800/60 flex items-center justify-center active:opacity-70 transition-opacity">
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>
          )}
          <h1 className="text-xl font-semibold text-foreground">Timed Pricing</h1>
        </div>
      )}

      <div className="flex-1 overflow-y-auto scrollbar-hide px-4 pb-4">
        <div className="flex gap-3 mb-4">
          <button onClick={() => navigate('/settings/menu/timed-pricing/add')} className="flex-1 py-4 bg-neutral-800 rounded-full flex items-center justify-center gap-2 active:opacity-70 transition-opacity">
            <Plus className="w-5 h-5 text-foreground" />
            <span className="text-foreground font-medium text-base">Add Rule</span>
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-neutral-800/60 rounded-2xl p-4 text-center">
            <p className="text-xl font-semibold text-foreground">{rules.filter((r) => r.type === "happy_hour" && r.enabled).length}</p>
            <p className="text-xs text-muted-foreground mt-1">Happy Hours</p>
          </div>
          <div className="bg-neutral-800/60 rounded-2xl p-4 text-center">
            <p className="text-xl font-semibold text-foreground">{rules.filter((r) => r.type === "peak_time" && r.enabled).length}</p>
            <p className="text-xs text-muted-foreground mt-1">Peak Times</p>
          </div>
          <div className="bg-neutral-800/60 rounded-2xl p-4 text-center">
            <p className="text-xl font-semibold text-foreground">{rules.filter((r) => r.enabled).length}/{rules.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Active</p>
          </div>
        </div>

        <div className="bg-neutral-800/60 rounded-2xl overflow-hidden">
          {filteredRules.length > 0 ? (
            filteredRules.map((rule, index) => (
              <div key={rule.id}>
                {index > 0 && <div className="h-px bg-neutral-700/50 mx-4" />}
                <button onClick={() => navigate(`/settings/menu/timed-pricing/edit/${rule.id}`)} className="flex items-center justify-between py-4 px-4 w-full active:opacity-70 transition-opacity">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: typeColors[rule.type] + "22" }}>
                      <Clock className="w-5 h-5" style={{ color: typeColors[rule.type] }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-foreground text-base font-medium truncate">{rule.name}</p>
                      <p className="text-muted-foreground text-xs">{rule.startTime} – {rule.endTime} · {rule.days.length === 7 ? "Every day" : rule.days.join(", ")}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-sm font-medium" style={{ color: rule.adjustment < 0 ? "#34C759" : "#FF9500" }}>
                      {rule.adjustment > 0 ? "+" : ""}{rule.adjustment}%
                    </span>
                    <Switch checked={rule.enabled} onCheckedChange={(checked) => handleToggle(rule.id, checked)} />
                  </div>
                </button>
              </div>
            ))
          ) : (
            <div className="py-8 text-center text-muted-foreground">No pricing rules found</div>
          )}
        </div>
      </div>

      <div className="px-4 pb-6 pt-2">
        <div className="bg-neutral-800/60 rounded-full flex items-center px-4 py-3">
          <Search className="w-5 h-5 text-neutral-500 mr-3" />
          <input type="text" placeholder="Search" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="flex-1 bg-transparent text-foreground placeholder:text-neutral-500 outline-none text-base" />
          <Mic className="w-5 h-5 text-neutral-500 mr-2" />
        </div>
      </div>

      <DeleteDialog rule={ruleToDelete} onCancel={() => setRuleToDelete(null)} onConfirm={confirmDelete} />
    </div>
  );
};

function DeleteDialog({ rule, onCancel, onConfirm }: { rule: TimedPricingRule | null; onCancel: () => void; onConfirm: () => void }) {
  return (
    <AlertDialog open={!!rule} onOpenChange={onCancel}>
      <AlertDialogContent className="bg-neutral-800 border-neutral-700">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-foreground">Delete Rule</AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground">Are you sure you want to delete "{rule?.name}"? This action cannot be undone.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="bg-neutral-700 text-foreground border-neutral-600 hover:bg-neutral-600">Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default TimedPricingContent;
