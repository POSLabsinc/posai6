import { useState, useEffect, useRef } from "react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, Briefcase, Heart, GraduationCap, Shield, Star, Clock, Cake, Sparkles, DollarSign, BadgeDollarSign, Wallet, Tag, LucideIcon, AlertCircle } from "lucide-react";
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

const DISCOUNT_REASONS = [
  "QSA",
  "Food Cold",
  "Too Much Salt",
  "Undercooked",
  "OverCooked",
  "Prepared Incorrectly",
  "Food Allergy",
  "Foreign Object in Food",
  "Wrong Menu Product",
  "Out of Stock",
  "Other",
];

const availableDiscounts: Discount[] = [
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
  const [selectedDiscounts, setSelectedDiscounts] = useState<Discount[]>(currentDiscounts);
  const [expandedDiscountId, setExpandedDiscountId] = useState<string | null>(null);
  const [reasonDataMap, setReasonDataMap] = useState<Record<string, DiscountReasonData>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const isMobile = useIsMobile();
  const notesRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) {
      setSelectedDiscounts(currentDiscounts);
      setExpandedDiscountId(null);
      setReasonDataMap({});
      setValidationErrors({});
    }
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
        // Select: only expand if reason is required (100% discounts)
        if (isReasonRequired(discount)) {
          setExpandedDiscountId(discount.id);
        }
        return [...prev, discount];
      }
    });
  };

  const handleReasonSelect = (discountId: string, reason: string) => {
    setReasonDataMap(m => ({
      ...m,
      [discountId]: { ...m[discountId], reason, notes: m[discountId]?.notes || null },
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
      [discountId]: { ...m[discountId], reason: m[discountId]?.reason || null, notes: notes || null },
    }));
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

  const ReasonSection = ({ discount }: { discount: Discount }) => {
    const data = reasonDataMap[discount.id] || { reason: null, notes: null };
    const error = validationErrors[discount.id];
    const isRequired = isReasonRequired(discount);

    return (
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: "auto", opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        className="overflow-hidden"
      >
        <div className="px-3 pb-3 pt-2 space-y-2">
          {/* Reason Label */}
          <label className="text-xs font-medium text-muted-foreground block">
            Reason {isRequired && <span className="text-red-400">*</span>}
          </label>

          {/* Inline reason list */}
          <div className="max-h-[200px] overflow-y-auto rounded-lg border border-border bg-neutral-800/50">
            {DISCOUNT_REASONS.map((reason) => (
              <button
                key={reason}
                onClick={() => handleReasonSelect(discount.id, reason)}
                className={`w-full text-left px-3 py-2.5 text-sm transition-colors border-b border-border/30 last:border-b-0 flex items-center justify-between ${
                  data.reason === reason
                    ? "bg-primary/15 text-primary font-medium"
                    : "text-foreground hover:bg-neutral-700/50"
                }`}
              >
                <span>{reason}</span>
                {data.reason === reason && <Check className="w-3.5 h-3.5 text-primary" />}
              </button>
            ))}
          </div>

          {error && (
            <div className="flex items-center gap-1">
              <AlertCircle className="w-3 h-3 text-red-400" />
              <p className="text-xs text-red-400">{error}</p>
            </div>
          )}

          {/* Notes Field - only shown when "Other" is selected */}
          {data.reason === "Other" && (
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Notes (optional)
              </label>
              <textarea
                ref={notesRef}
                value={data.notes || ""}
                onChange={(e) => handleNotesChange(discount.id, e.target.value)}
                placeholder="Please specify."
                maxLength={200}
                rows={3}
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-neutral-800/50 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:border-primary/50 transition-colors"
                onFocus={() => {
                  setTimeout(() => {
                    notesRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
                  }, 150);
                }}
              />
              <p className="text-[10px] text-muted-foreground text-right mt-0.5">
                {(data.notes || "").length}/200
              </p>
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  const DiscountRow = ({ discount, isMobileView }: { discount: Discount; isMobileView?: boolean }) => {
    const discountAmount = calculateDiscountAmount(discount);
    const isSelected = selectedDiscounts.some(d => d.id === discount.id);
    const isExpanded = isSelected && expandedDiscountId === discount.id;

    return (
      <div key={discount.id} className="relative">
        <button
          onClick={() => {
            toggleDiscount(discount);
          }}
          className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
            isSelected
              ? `bg-primary/20 border border-primary ${isExpanded ? "rounded-b-none" : ""}`
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

        {/* Inline Reason Expansion */}
        <AnimatePresence>
          {isExpanded && (
            <div className={`border border-t-0 border-primary rounded-b-lg bg-primary/10`}>
              <ReasonSection discount={discount} />
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const DiscountList = ({ isMobileView = false }: { isMobileView?: boolean }) => (
    <>
      {isMobileView ? (
        <div className="max-h-[50vh] overflow-y-auto">
          <div className="p-3 space-y-2">
            {availableDiscounts.map((discount) => (
              <DiscountRow key={discount.id} discount={discount} isMobileView />
            ))}
          </div>
        </div>
      ) : (
        <ScrollArea className="max-h-[50vh]">
          <div className="p-3 space-y-2">
            {availableDiscounts.map((discount) => (
              <DiscountRow key={discount.id} discount={discount} />
            ))}
          </div>
        </ScrollArea>
      )}
      {selectedDiscounts.length > 0 && (
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
          onClick={handleApply}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          Apply {selectedDiscounts.length > 0 ? `(${selectedDiscounts.length})` : ''}
        </Button>
      </div>
    </>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="bg-neutral-900 border-sidebar-border">
          <DrawerHeader className="border-b border-sidebar-border pb-2">
            <DrawerTitle className="text-foreground text-lg font-semibold text-center">
              Select Discounts
            </DrawerTitle>
          </DrawerHeader>
          <DiscountList isMobileView={true} />
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] bg-neutral-900 border-sidebar-border p-0 gap-0">
        <DialogHeader className="p-4 pb-2 border-b border-sidebar-border">
          <DialogTitle className="text-foreground text-lg font-semibold">
            Select Discounts
          </DialogTitle>
        </DialogHeader>
        <DiscountList />
      </DialogContent>
    </Dialog>
  );
}

export type { Discount, AppliedDiscountPayload };
