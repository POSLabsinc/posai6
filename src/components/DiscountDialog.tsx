import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";

import { Check, Briefcase, Heart, GraduationCap, Shield, Star, Clock, Cake, Sparkles, DollarSign, BadgeDollarSign, Wallet, Tag, LucideIcon, AlertCircle, Zap, MessageSquare, ChevronLeft } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { motion, AnimatePresence } from "framer-motion";

interface Discount {
  id: string;
  name: string;
  type: "percentage" | "amount";
  value: number;
  icon: LucideIcon;
  reasonRequired?: boolean;
}

interface DiscountReasonData {
  reason: string | null;
  reasonCategory: string | null;
  notes: string | null;
}

interface AppliedDiscountPayload {
  discount: Discount;
  reason: string | null;
  notes: string | null;
}

interface DiscountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApplyDiscounts: (discounts: Discount[], payloads?: AppliedDiscountPayload[]) => void;
  currentDiscounts: Discount[];
  subtotal: number;
}

// High-frequency flat reason chips (dynamically orderable in production)
const QUICK_REASONS = [
  "Food Cold",
  "Prepared Incorrectly",
  "Wrong Item",
  "Guest Complaint",
  "Long Wait Time",
  "Out of Stock",
  "Manager Comp",
  "Birthday Comp",
  "Employee Meal",
];

// AI-suggested reasons (top 3 contextual)
const AI_SUGGESTED_REASONS = ["Guest Complaint", "Wrong Item", "Food Cold"];

// Category mapping for analytics (reason → category)
const REASON_TO_CATEGORY: Record<string, string> = {
  "Food Cold": "Food Quality",
  "Prepared Incorrectly": "Food Quality",
  "Wrong Item": "Order Error",
  "Guest Complaint": "Service Issue",
  "Long Wait Time": "Service Issue",
  "Out of Stock": "Inventory",
  "Manager Comp": "Promotion / Internal",
  "Birthday Comp": "Promotion / Internal",
  "Employee Meal": "Promotion / Internal",
  "Other": "Other",
};

// Smart comment suggestions based on typing
const COMMENT_SUGGESTIONS: Record<string, string[]> = {
  "wrong": ["Wrong item served", "Incorrect modifier applied", "Wrong table order", "Wrong size/portion"],
  "cold": ["Food served cold", "Dish delayed before serving", "Refire requested"],
  "wait": ["Long wait time (15+ min)", "Kitchen backed up", "Understaffed"],
  "comp": ["Manager approved comp", "Regular guest accommodation", "Service recovery"],
  "allerg": ["Allergen present in dish", "Cross-contamination concern", "Guest allergy not noted"],
  "under": ["Undercooked protein", "Raw center", "Not heated through"],
  "over": ["Overcooked/burnt", "Dried out", "Charred"],
  "duplic": ["Duplicate order sent", "Double-fired by kitchen", "POS entry error"],
  "stock": ["Item 86'd mid-service", "Ingredient unavailable", "Substitution refused"],
};

// Icon mapping for dynamic discounts
const ICON_MAP: Record<string, LucideIcon> = {
  "employee": Briefcase,
  "senior": Heart,
  "student": GraduationCap,
  "military": Shield,
  "loyalty": Star,
  "happy": Clock,
  "birthday": Cake,
  "first": Sparkles,
  "manager": DollarSign,
  "promo": Tag,
  "comp": BadgeDollarSign,
  "voucher": Wallet,
};

const getIconForDiscount = (name: string): LucideIcon => {
  const lower = name.toLowerCase();
  for (const [key, icon] of Object.entries(ICON_MAP)) {
    if (lower.includes(key)) return icon;
  }
  return Tag;
};

const fallbackDiscounts: Discount[] = [
  { id: "employee", name: "Employee Discount", type: "percentage", value: 20, icon: Briefcase },
  { id: "senior", name: "Senior Citizen", type: "percentage", value: 15, icon: Heart },
  { id: "student", name: "Student Discount", type: "percentage", value: 10, icon: GraduationCap },
  { id: "military", name: "Military Discount", type: "percentage", value: 15, icon: Shield },
  { id: "loyalty", name: "Loyalty Member", type: "percentage", value: 5, icon: Star },
  { id: "happy-hour", name: "Happy Hour", type: "percentage", value: 25, icon: Clock },
  { id: "birthday", name: "Birthday Special", type: "percentage", value: 100, icon: Cake },
  { id: "first-visit", name: "First Visit", type: "percentage", value: 10, icon: Sparkles },
  { id: "manager-5", name: "Manager Comp $5", type: "amount", value: 5, icon: DollarSign },
  { id: "manager-10", name: "Manager Comp $10", type: "amount", value: 10, icon: BadgeDollarSign },
  { id: "manager-15", name: "Manager Comp $15", type: "amount", value: 15, icon: Wallet },
  { id: "promo-code", name: "Promo Code Discount", type: "percentage", value: 20, icon: Tag },
];

const FULL_COMP_DEFAULT: Discount = {
  id: "full-comp-default",
  name: "Full Comp",
  type: "percentage",
  value: 100,
  icon: Cake,
  reasonRequired: true,
};

const ensureFullComp = (discounts: Discount[]): Discount[] => {
  const has100 = discounts.some(d => d.value === 100 && d.type === "percentage");
  return has100 ? discounts : [...discounts, FULL_COMP_DEFAULT];
};

const getDiscountsFromSettings = (): Discount[] => {
  try {
    const raw = localStorage.getItem("discounts-settings");
    if (!raw) return fallbackDiscounts;
    const settings: { id: string; name: string; amount: number; type: string; archived: boolean }[] = JSON.parse(raw);
    const active = settings.filter(d => !d.archived);
    if (active.length === 0) return fallbackDiscounts;
    const mapped = active.map(d => ({
      id: d.id,
      name: d.name,
      type: d.type === "Fixed" ? "amount" as const : "percentage" as const,
      value: d.amount,
      icon: getIconForDiscount(d.name),
      reasonRequired: d.type === "Percentage" && d.amount === 100,
    }));
    return ensureFullComp(mapped);
  } catch {
    return fallbackDiscounts;
  }
};

const fetchDiscountsFromDB = async (): Promise<Discount[]> => {
  try {
    const { data, error } = await supabase
      .from('discounts')
      .select('id, name, amount, type')
      .eq('archived', false)
      .order('sort_order');
    if (error || !data || data.length === 0) return getDiscountsFromSettings();
    const mapped = data.map(d => ({
      id: d.id,
      name: d.name,
      type: d.type === "Fixed" ? "amount" as const : "percentage" as const,
      value: Number(d.amount),
      icon: getIconForDiscount(d.name),
      reasonRequired: d.type === "Percentage" && Number(d.amount) === 100,
    }));
    return ensureFullComp(mapped);
  } catch {
    return getDiscountsFromSettings();
  }
};

export { getDiscountsFromSettings as getAvailableDiscounts };
export const availableDiscounts = fallbackDiscounts;

// Auto-derive: 100% discounts always require a reason
const isReasonRequired = (discount: Discount) =>
  discount.reasonRequired || (discount.type === "percentage" && discount.value === 100);

export function DiscountDialog({
  open,
  onOpenChange,
  onApplyDiscounts,
  currentDiscounts,
  subtotal,
}: DiscountDialogProps) {
  const [dynamicDiscounts, setDynamicDiscounts] = useState<Discount[]>(fallbackDiscounts);
  const [selectedDiscounts, setSelectedDiscounts] = useState<Discount[]>(currentDiscounts);
  const [expandedDiscountId, setExpandedDiscountId] = useState<string | null>(null);
  const [view, setView] = useState<'list' | 'reason'>('list');
  const [reasonDataMap, setReasonDataMap] = useState<Record<string, DiscountReasonData>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  const [commentText, setCommentText] = useState<Record<string, string>>({});
  const isMobile = useIsMobile();
  const notesRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Only initialize selection state when dialog opens, not on every currentDiscounts reference change
  const prevOpenRef = useRef(false);
  useEffect(() => {
    if (open && !prevOpenRef.current) {
      // Reload discounts from database each time dialog opens
      fetchDiscountsFromDB().then(setDynamicDiscounts);
      // Dialog just opened: initialize from currently applied discounts
      setSelectedDiscounts(currentDiscounts);
      setExpandedDiscountId(null);
      setReasonDataMap({});
      setValidationErrors({});
      setCommentText({});
      setView('list');
    }
    prevOpenRef.current = open;
  }, [open, currentDiscounts]);

  const handleApply = () => {
    // Validate all reason-required discounts
    const errors: Record<string, string> = {};
    for (const d of selectedDiscounts) {
      if (isReasonRequired(d) && !reasonDataMap[d.id]?.reason) {
        errors[d.id] = "Please select a reason.";
        setExpandedDiscountId(d.id);
      }
    }
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    const payloads: AppliedDiscountPayload[] = selectedDiscounts.map(d => ({
      discount: d,
      reason: reasonDataMap[d.id]?.reason || null,
      notes: reasonDataMap[d.id]?.notes || null,
    }));
    onApplyDiscounts(selectedDiscounts, payloads);
    onOpenChange(false);
  };

  const toggleDiscount = (discount: Discount) => {
    setSelectedDiscounts(prev => {
      const isSelected = prev.some(d => d.id === discount.id);
      if (isSelected) {
        // Deselect: clear reason data and collapse
        setReasonDataMap(m => {
          const next = { ...m };
          delete next[discount.id];
          return next;
        });
        setValidationErrors(e => {
          const next = { ...e };
          delete next[discount.id];
          return next;
        });
        if (expandedDiscountId === discount.id) setExpandedDiscountId(null);
        return prev.filter(d => d.id !== discount.id);
      } else {
        // Select: don't expand inline for 100% discounts (use two-step flow instead)
        if (!isReasonRequired(discount)) {
          // Non-100% discounts don't need reason, no expansion needed
        }
        return [...prev, discount];
      }
    });
  };

  const handleReasonSelect = (discountId: string, reason: string) => {
    const current = reasonDataMap[discountId];
    if (current?.reason === reason) {
      setReasonDataMap(m => ({
        ...m,
        [discountId]: { reason: null, reasonCategory: null, notes: null },
      }));
      return;
    }
    const category = REASON_TO_CATEGORY[reason] || "Other";
    setReasonDataMap(m => ({
      ...m,
      [discountId]: { ...m[discountId], reason, reasonCategory: category, notes: m[discountId]?.notes || null },
    }));
    setValidationErrors(e => {
      const next = { ...e };
      delete next[discountId];
      return next;
    });
  };

  const handleNotesChange = (discountId: string, notes: string) => {
    setReasonDataMap(m => ({
      ...m,
      [discountId]: { ...m[discountId], reason: m[discountId]?.reason || null, reasonCategory: m[discountId]?.reasonCategory || null, notes: notes || null },
    }));
  };

  // Smart comment suggestions based on what user is typing
  const getSmartSuggestions = (text: string): string[] => {
    if (!text || text.length < 3) return [];
    const lower = text.toLowerCase();
    for (const [key, suggestions] of Object.entries(COMMENT_SUGGESTIONS)) {
      if (lower.includes(key)) return suggestions;
    }
    return [];
  };

  const calculateDiscountAmount = (discount: Discount) => {
    if (discount.type === "percentage") {
      return (subtotal * discount.value) / 100;
    }
    return discount.value;
  };

  const calculateTotalSavings = () => {
    return selectedDiscounts.reduce((total, discount) => {
      return total + calculateDiscountAmount(discount);
    }, 0);
  };

  const totalSavings = calculateTotalSavings();

  const hasValidationIssues = selectedDiscounts.some(
    d => isReasonRequired(d) && !reasonDataMap[d.id]?.reason
  );


  const renderReasonSection = (discount: Discount) => {
    const data = reasonDataMap[discount.id] || { reason: null, reasonCategory: null, notes: null };
    const error = validationErrors[discount.id];
    const isRequired = isReasonRequired(discount);
    const currentComment = commentText[discount.id] || "";
    const smartSuggestions = getSmartSuggestions(currentComment);

    return (
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: "auto", opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        className="overflow-hidden"
      >
        <div className="px-3 pb-3 pt-2 space-y-3">
          {/* AI Suggested Reasons */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <label className="text-xs font-semibold text-amber-400">AI Suggested</label>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {AI_SUGGESTED_REASONS.map((reason) => (
                <button
                  key={reason}
                  onClick={() => handleReasonSelect(discount.id, reason)}
                  className={`px-3.5 py-2.5 rounded-full text-xs font-medium transition-all ${
                    data.reason === reason
                      ? "bg-foreground text-background ring-2 ring-foreground/30"
                      : "bg-accent/60 text-foreground hover:bg-accent border border-border/50"
                  }`}
                >
                  
                  {reason}
                </button>
              ))}
            </div>
          </div>

          {/* Flat reason chips */}
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-2">
              Reason {isRequired && <span className="text-destructive">*</span>}
            </label>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_REASONS.filter(r => !AI_SUGGESTED_REASONS.includes(r)).map((reason) => (
                <button
                  key={reason}
                  onClick={() => handleReasonSelect(discount.id, reason)}
                  className={`px-3.5 py-2.5 rounded-full text-xs font-medium transition-all ${
                    data.reason === reason
                      ? "bg-foreground text-background ring-2 ring-foreground/30"
                      : "bg-accent/60 text-foreground hover:bg-accent border border-border/50"
                  }`}
                >
                  
                  {reason}
                </button>
              ))}
              {/* Other chip */}
              <button
                onClick={() => handleReasonSelect(discount.id, "Other")}
                className={`px-3.5 py-2.5 rounded-full text-xs font-medium transition-all ${
                  data.reason === "Other"
                    ? "bg-foreground text-background ring-2 ring-foreground/30"
                    : "bg-accent/60 text-foreground hover:bg-accent border border-border/50"
                }`}
              >
                
                Other
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-1">
              <AlertCircle className="w-3 h-3 text-destructive" />
              <p className="text-xs text-destructive">{error}</p>
            </div>
          )}

          {/* Comment field — shown when ANY reason is selected */}
          {data.reason && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center gap-1.5 mb-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
                <label className="text-xs font-medium text-muted-foreground">
                  Comment {data.reason === "Other" ? <span className="text-destructive">*</span> : "(optional)"}
                </label>
              </div>
              <textarea
                ref={notesRef}
                value={currentComment}
                onChange={(e) => {
                  const val = e.target.value;
                  setCommentText(prev => ({ ...prev, [discount.id]: val }));
                  handleNotesChange(discount.id, val);
                }}
                placeholder={data.reason === "Other" ? "Describe the reason..." : "Add details..."}
                maxLength={200}
                rows={2}
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-card/50 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:border-primary/50 transition-colors"
                onFocus={() => {
                  setTimeout(() => {
                    notesRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
                  }, 150);
                }}
              />
              <p className="text-[10px] text-muted-foreground text-right mt-0.5">
                {currentComment.length}/200
              </p>

              {/* Smart suggestions while typing */}
              {smartSuggestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-1.5"
                >
                  <p className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1">
                    <Zap className="w-2.5 h-2.5 text-amber-400" /> Suggestions
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {smartSuggestions.map((s) => (
                      <button
                        key={s}
                        onClick={() => {
                          setCommentText(prev => ({ ...prev, [discount.id]: s }));
                          handleNotesChange(discount.id, s);
                        }}
                        className="px-2 py-1 rounded-md text-[11px] bg-amber-400/10 text-amber-300 hover:bg-amber-400/20 border border-amber-400/20 transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </div>
      </motion.div>
    );
  };

  const listContent = (
    <div ref={scrollRef} className="max-h-[50vh] overflow-y-auto scrollbar-hide">
      <div className="p-3 space-y-2">
        {dynamicDiscounts.map((discount) => {
          const isSelected = selectedDiscounts.some(d => d.id === discount.id);

          return (
            <div key={discount.id} className="relative">
              <button
                onClick={() => toggleDiscount(discount)}
                className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                  isSelected
                    ? "bg-primary/20 border border-primary"
                    : "bg-neutral-800 hover:bg-neutral-700 border border-transparent"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      isSelected ? "bg-primary" : "bg-neutral-700"
                    }`}
                  >
                    {isSelected ? (
                      <Check className="w-4 h-4 text-primary-foreground" />
                    ) : (
                      <discount.icon className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    {discount.name}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {isSelected && isReasonRequired(discount) && !reasonDataMap[discount.id]?.reason && (
                    <span className="text-[10px] text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded">Reason required</span>
                  )}
                  <span className="text-xs text-muted-foreground bg-neutral-700/60 px-2.5 py-1 rounded-full">
                    {discount.type === "percentage"
                      ? `${discount.value}% off`
                      : `$${discount.value.toFixed(2)} off`}
                  </span>
                </div>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );

  // Find the selected 100% discount for the reason view
  const selected100Discount = selectedDiscounts.find(d => isReasonRequired(d));
  const is100Selected = !!selected100Discount;
  const has100Reason = is100Selected && !!reasonDataMap[selected100Discount!.id]?.reason;

  const reasonViewContent = selected100Discount ? (
    <div className="max-h-[50vh] overflow-y-auto scrollbar-hide">
      {renderReasonSection(selected100Discount)}
    </div>
  ) : null;

  // CTA logic
  const needsReasonStep = is100Selected && !has100Reason && view === 'list';
  const ctaLabel = needsReasonStep
    ? "Select Reason"
    : selectedDiscounts.length > 0
      ? `Apply (${selectedDiscounts.length})`
      : "Apply";

  const handleCTAClick = () => {
    if (needsReasonStep) {
      setView('reason');
    } else {
      handleApply();
    }
  };

  const summaryAndApply = (
    <>
      {selectedDiscounts.length > 0 && view === 'list' && (
        <div className="px-4 py-3 bg-primary/10 border-t border-primary/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">
                {selectedDiscounts.length} discount{selectedDiscounts.length > 1 ? 's' : ''} selected
              </p>
              <p className="text-xs text-muted-foreground">
                {selectedDiscounts.map(d => d.name).join(', ')}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Total Savings</p>
              <p className="text-lg font-bold text-primary">-${totalSavings.toFixed(2)}</p>
            </div>
          </div>
        </div>
      )}
      <div className="p-4 pt-2 border-t border-sidebar-border">
        <Button
          onClick={handleCTAClick}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
          disabled={selectedDiscounts.length === 0}
        >
          {ctaLabel}
        </Button>
      </div>
    </>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="bg-neutral-900 border-sidebar-border">
          <DrawerHeader className="border-b border-sidebar-border pb-2">
            <div className="flex items-center justify-center relative">
              {view === 'reason' && (
                <button onClick={() => setView('list')} className="absolute left-0 text-muted-foreground hover:text-foreground transition-colors">
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}
              <DrawerTitle className="text-foreground text-lg font-semibold text-center">
                {view === 'reason' ? 'Select Reason' : 'Select Discounts'}
              </DrawerTitle>
            </div>
          </DrawerHeader>
          {view === 'reason' && reasonViewContent ? reasonViewContent : listContent}
          {summaryAndApply}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] bg-neutral-900 border-sidebar-border p-0 gap-0">
        <DialogHeader className="p-4 pb-2 border-b border-sidebar-border relative">
          {view === 'reason' && (
            <button onClick={() => setView('list')} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          <DialogTitle className={`text-foreground text-lg font-semibold ${view === 'reason' ? 'pl-8' : ''}`}>
            {view === 'reason' ? 'Select Reason' : 'Select Discounts'}
          </DialogTitle>
        </DialogHeader>
        {view === 'reason' && reasonViewContent ? reasonViewContent : listContent}
        {summaryAndApply}
      </DialogContent>
    </Dialog>
  );
}

export type { Discount, AppliedDiscountPayload };
