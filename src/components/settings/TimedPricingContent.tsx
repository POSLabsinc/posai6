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
              <h1 className="text-base font-medium text-foreground">Timed Pricing</h1>
            </div>
            <div className="overflow-visible flex items-center justify-center" style={{ width: 32, height: 32 }}>
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
