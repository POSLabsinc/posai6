import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Search, Mic, Clock, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AnimatedAIIcon from "@/components/AnimatedAIIcon";
import { useIsMobile } from "@/hooks/use-mobile";
import { Switch } from "@/components/ui/switch";
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
import timedPricingIcon from "@/assets/icons/menu-timed-pricing.png";

interface TimedPricingRule {
  id: string;
  name: string;
  type: "happy_hour" | "peak_time" | "late_night" | "custom";
  startTime: string;
  endTime: string;
  adjustment: number; // percentage: negative = discount, positive = surcharge
  days: string[];
  enabled: boolean;
}

interface TimedPricingContentProps {
  showHeader?: boolean;
  onBack?: () => void;
  onAIClick?: () => void;
}

const STORAGE_KEY = "timed-pricing-rules";

const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

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

const defaultRules: TimedPricingRule[] = [
  {
    id: "1",
    name: "Happy Hour",
    type: "happy_hour",
    startTime: "4:00 PM",
    endTime: "6:00 PM",
    adjustment: -20,
    days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    enabled: true,
  },
  {
    id: "2",
    name: "Weekend Peak",
    type: "peak_time",
    startTime: "6:00 PM",
    endTime: "9:00 PM",
    adjustment: 15,
    days: ["Fri", "Sat"],
    enabled: true,
  },
  {
    id: "3",
    name: "Late Night Special",
    type: "late_night",
    startTime: "10:00 PM",
    endTime: "12:00 AM",
    adjustment: -30,
    days: ["Thu", "Fri", "Sat"],
    enabled: false,
  },
  {
    id: "4",
    name: "Brunch Surge",
    type: "peak_time",
    startTime: "10:00 AM",
    endTime: "1:00 PM",
    adjustment: 10,
    days: ["Sat", "Sun"],
    enabled: true,
  },
];

const TimedPricingContent = ({ showHeader = true, onBack, onAIClick }: TimedPricingContentProps) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  const [rules, setRules] = useState<TimedPricingRule[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
    }
    return defaultRules;
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [ruleToDelete, setRuleToDelete] = useState<TimedPricingRule | null>(null);

  const saveRules = (newRules: TimedPricingRule[]) => {
    setRules(newRules);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newRules));
  };

  const handleToggle = (id: string, enabled: boolean) => {
    saveRules(rules.map((r) => (r.id === id ? { ...r, enabled } : r)));
  };

  const confirmDelete = () => {
    if (ruleToDelete) {
      saveRules(rules.filter((r) => r.id !== ruleToDelete.id));
      setRuleToDelete(null);
    }
  };

  const filteredRules = rules.filter((r) =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Desktop / Tablet
  if (!isMobile) {
    return (
      <div className="h-full flex flex-col overflow-hidden bg-background">
        {showHeader && (
          <div className="flex items-center justify-between pt-0 pb-2 relative overflow-visible px-4">
            {onBack && (
              <button
                onClick={onBack}
                className="w-10 h-10 rounded-full bg-neutral-800/60 flex items-center justify-center active:opacity-70 transition-opacity"
                aria-label="Back"
              >
                <ChevronLeft className="w-5 h-5 text-foreground" />
              </button>
            )}
            {!onBack && <div className="w-8 h-8" />}
            <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1.5">
              <h1 className="text-base font-medium text-foreground">Timed Pricing</h1>
            </div>
            <div className="overflow-visible flex items-center justify-center" style={{ width: 32, height: 32 }}>
              <AnimatedAIIcon size={24} onClick={onAIClick || (() => navigate("/settings/ai", { state: { context: "menu" } }))} />
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto scrollbar-hide px-6 pb-6">
          {/* Description */}
          <div className="mt-4 mb-4 px-1">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Configure time-based pricing rules to automatically adjust product prices during happy hours, peak times, late night specials, or any custom schedule you define.
            </p>
          </div>

          {/* Search + Add */}
          <section className="mt-6 flex items-center gap-2 lg:gap-4">
            <div className="flex-1 min-w-0 rounded-full bg-neutral-800/60 px-5 py-3 flex items-center gap-3">
              <Search className="h-5 w-5 flex-shrink-0 text-[hsl(var(--text-subtle))]" />
              <input
                type="text"
                placeholder="Search rules"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 min-w-0 bg-transparent text-foreground placeholder:text-[hsl(var(--text-subtle))] outline-none text-[15px]"
              />
              <Mic className="h-5 w-5 flex-shrink-0 text-[hsl(var(--text-subtle))]" />
            </div>

            <button
              className="h-12 rounded-full px-5 lg:px-10 flex-shrink-0 flex items-center justify-center gap-2 bg-neutral-800/60 text-foreground active:opacity-70 transition-opacity"
            >
              <Plus className="h-5 w-5" />
              <span className="text-[15px] font-semibold">Add Rule</span>
            </button>
          </section>

          {/* Table */}
          <section className="mt-6 rounded-2xl bg-neutral-800/60 overflow-hidden">
            <div className="grid grid-cols-[1.2fr_110px_140px_100px_80px_60px] items-center px-8 py-5 border-b border-neutral-700/50">
              <span className="text-[15px] font-semibold text-foreground">Rule Name</span>
              <span className="text-[15px] font-semibold text-foreground text-center">Type</span>
              <span className="text-[15px] font-semibold text-foreground text-center">Schedule</span>
              <span className="text-[15px] font-semibold text-foreground text-center">Days</span>
              <span className="text-[15px] font-semibold text-foreground text-right">Adjust</span>
              <span className="text-[15px] font-semibold text-foreground text-right">Active</span>
            </div>

            {filteredRules.length > 0 ? (
              filteredRules.map((rule, index) => (
                <div key={rule.id}>
                  {index > 0 && <div className="h-px bg-neutral-700/50" />}
                  <div className="grid grid-cols-[1.2fr_110px_140px_100px_80px_60px] items-center px-8 py-5 w-full hover:bg-neutral-700/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: typeColors[rule.type] }}
                      />
                      <span className="text-[15px] text-foreground">{rule.name}</span>
                    </div>
                    <span className="text-[15px] text-foreground text-center">{typeLabels[rule.type]}</span>
                    <span className="text-[15px] text-muted-foreground text-center">
                      {rule.startTime} – {rule.endTime}
                    </span>
                    <span className="text-[15px] text-muted-foreground text-center">
                      {rule.days.length === 7 ? "Every day" : rule.days.join(", ")}
                    </span>
                    <span
                      className="text-[15px] font-medium text-right"
                      style={{ color: rule.adjustment < 0 ? "#34C759" : "#FF9500" }}
                    >
                      {rule.adjustment > 0 ? "+" : ""}
                      {rule.adjustment}%
                    </span>
                    <div className="flex justify-end">
                      <Switch
                        checked={rule.enabled}
                        onCheckedChange={(checked) => handleToggle(rule.id, checked)}
                      />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-8 py-10 text-center text-[hsl(var(--text-subtle))]">
                No pricing rules found
              </div>
            )}
          </section>

          {/* Summary Cards */}
          <section className="mt-6 grid grid-cols-3 gap-4">
            <div className="bg-neutral-800/60 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#34C759" }} />
                <span className="text-sm font-medium text-foreground">Happy Hours</span>
              </div>
              <p className="text-2xl font-semibold text-foreground">
                {rules.filter((r) => r.type === "happy_hour" && r.enabled).length}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Active discounts</p>
            </div>
            <div className="bg-neutral-800/60 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#FF9500" }} />
                <span className="text-sm font-medium text-foreground">Peak Times</span>
              </div>
              <p className="text-2xl font-semibold text-foreground">
                {rules.filter((r) => r.type === "peak_time" && r.enabled).length}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Active surcharges</p>
            </div>
            <div className="bg-neutral-800/60 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-3 h-3 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Total Rules</span>
              </div>
              <p className="text-2xl font-semibold text-foreground">{rules.length}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {rules.filter((r) => r.enabled).length} active
              </p>
            </div>
          </section>
        </div>

        <DeleteDialog
          rule={ruleToDelete}
          onCancel={() => setRuleToDelete(null)}
          onConfirm={confirmDelete}
        />
      </div>
    );
  }

  // Mobile
  return (
    <div className="h-full flex flex-col overflow-hidden bg-background">
      {showHeader && (
        <div className="flex items-center justify-center py-4 px-4 relative">
          {onBack && (
            <button
              onClick={onBack}
              className="absolute left-4 w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center active:opacity-70 transition-opacity"
            >
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>
          )}
          <h1 className="text-lg font-semibold text-foreground">Timed Pricing</h1>
        </div>
      )}

      <div className="flex-1 overflow-y-auto scrollbar-hide px-4 pb-4">
        {/* Add button */}
        <div className="flex gap-3 mb-4">
          <button className="flex-1 py-4 bg-neutral-800 rounded-full flex items-center justify-center gap-2 active:opacity-70 transition-opacity">
            <Plus className="w-5 h-5 text-foreground" />
            <span className="text-foreground font-medium text-base">Add Rule</span>
          </button>
        </div>

        {/* Summary row */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-neutral-800/60 rounded-2xl p-4 text-center">
            <p className="text-xl font-semibold text-foreground">
              {rules.filter((r) => r.type === "happy_hour" && r.enabled).length}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Happy Hours</p>
          </div>
          <div className="bg-neutral-800/60 rounded-2xl p-4 text-center">
            <p className="text-xl font-semibold text-foreground">
              {rules.filter((r) => r.type === "peak_time" && r.enabled).length}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Peak Times</p>
          </div>
          <div className="bg-neutral-800/60 rounded-2xl p-4 text-center">
            <p className="text-xl font-semibold text-foreground">
              {rules.filter((r) => r.enabled).length}/{rules.length}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Active</p>
          </div>
        </div>

        {/* Rules List */}
        <div className="bg-neutral-800/60 rounded-2xl overflow-hidden">
          {filteredRules.length > 0 ? (
            filteredRules.map((rule, index) => (
              <div key={rule.id}>
                {index > 0 && <div className="h-px bg-neutral-700/50 mx-4" />}
                <div className="flex items-center justify-between py-4 px-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: typeColors[rule.type] + "22" }}
                    >
                      <Clock className="w-5 h-5" style={{ color: typeColors[rule.type] }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-foreground text-base font-medium truncate">{rule.name}</p>
                      <p className="text-muted-foreground text-xs">
                        {rule.startTime} – {rule.endTime} · {rule.days.length === 7 ? "Every day" : rule.days.join(", ")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span
                      className="text-sm font-medium"
                      style={{ color: rule.adjustment < 0 ? "#34C759" : "#FF9500" }}
                    >
                      {rule.adjustment > 0 ? "+" : ""}
                      {rule.adjustment}%
                    </span>
                    <Switch
                      checked={rule.enabled}
                      onCheckedChange={(checked) => handleToggle(rule.id, checked)}
                    />
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-8 text-center text-muted-foreground">No pricing rules found</div>
          )}
        </div>
      </div>

      {/* Bottom Search Bar */}
      <div className="px-4 pb-6 pt-2">
        <div className="bg-neutral-800/60 rounded-full flex items-center px-4 py-3">
          <Search className="w-5 h-5 text-neutral-500 mr-3" />
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-foreground placeholder:text-neutral-500 outline-none text-base"
          />
          <Mic className="w-5 h-5 text-neutral-500 mr-2" />
          <AnimatedAIIcon size={20} onClick={onAIClick || (() => navigate("/settings/ai", { state: { context: "menu" } }))} />
        </div>
      </div>

      <DeleteDialog
        rule={ruleToDelete}
        onCancel={() => setRuleToDelete(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
};

function DeleteDialog({
  rule,
  onCancel,
  onConfirm,
}: {
  rule: TimedPricingRule | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog open={!!rule} onOpenChange={onCancel}>
      <AlertDialogContent className="bg-neutral-800 border-neutral-700">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-foreground">Delete Rule</AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground">
            Are you sure you want to delete "{rule?.name}"? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="bg-neutral-700 text-foreground border-neutral-600 hover:bg-neutral-600">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default TimedPricingContent;
