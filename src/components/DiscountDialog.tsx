import { useState, useEffect, useRef, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
} from "@/components/ui/drawer";
import { Check, Briefcase, Heart, GraduationCap, Shield, Star, Clock, Cake, Sparkles, DollarSign, BadgeDollarSign, Wallet, Tag, LucideIcon, AlertCircle, Zap, ChevronLeft, PackageOpen } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

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
  portalContainer?: HTMLElement | null;
}

const REASON_OPTIONS = [
  { emoji: "😤", label: "Guest complaint", isAI: true },
  { emoji: "❌", label: "Wrong item", isAI: true },
  { emoji: "🥶", label: "Food cold", isAI: true },
  { emoji: "⏳", label: "Long wait", isAI: true },
  { emoji: "👔", label: "Manager comp", isAI: false },
  { emoji: "🎂", label: "Birthday", isAI: false },
  { emoji: "🍽️", label: "Employee meal", isAI: false },
  { emoji: "📝", label: "Other", isAI: false },
];

const REASON_TO_CATEGORY: Record<string, string> = {
  "Guest complaint": "Service Issue",
  "Wrong item": "Order Error",
  "Food cold": "Food Quality",
  "Long wait": "Service Issue",
  "Manager comp": "Promotion / Internal",
  "Birthday": "Promotion / Internal",
  "Employee meal": "Promotion / Internal",
  "Other": "Other",
};

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
  { id: "birthday", name: "Birthday Special", type: "percentage", value: 100, icon: Cake, reasonRequired: true },
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

const isReasonRequired = (discount: Discount) =>
  discount.reasonRequired || (discount.type === "percentage" && discount.value === 100);

export function DiscountDialog({
  open,
  onOpenChange,
  onApplyDiscounts,
  currentDiscounts,
  subtotal,
  portalContainer,
}: DiscountDialogProps) {
  const [dynamicDiscounts, setDynamicDiscounts] = useState<Discount[]>(fallbackDiscounts);
  const [selectedDiscount, setSelectedDiscount] = useState<Discount | null>(null);
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [view, setView] = useState<'list' | 'reason'>('list');
  const isMobile = useIsMobile();

  const prevOpenRef = useRef(false);
  useEffect(() => {
    if (open && !prevOpenRef.current) {
      fetchDiscountsFromDB().then(setDynamicDiscounts);
      setSelectedDiscount(currentDiscounts.length > 0 ? currentDiscounts[0] : null);
      setSelectedReason(null);
      setView('list');
    }
    prevOpenRef.current = open;
  }, [open, currentDiscounts]);

  const needsReason = selectedDiscount ? isReasonRequired(selectedDiscount) : false;

  const handleSelectDiscount = (discount: Discount) => {
    if (selectedDiscount?.id === discount.id) {
      setSelectedDiscount(null);
      setSelectedReason(null);
    } else {
      setSelectedDiscount(discount);
      setSelectedReason(null);
    }
  };

  const handleApply = () => {
    if (!selectedDiscount) return;
    if (needsReason && !selectedReason) return;
    const payload: AppliedDiscountPayload = {
      discount: selectedDiscount,
      reason: selectedReason,
      notes: null,
    };
    onApplyDiscounts([selectedDiscount], [payload]);
    onOpenChange(false);
  };

  const calculateDiscountAmount = (discount: Discount) => {
    if (discount.type === "percentage") return (subtotal * discount.value) / 100;
    return discount.value;
  };

  const totalSavings = selectedDiscount ? calculateDiscountAmount(selectedDiscount) : 0;

  const canApply = selectedDiscount && (!needsReason || !!selectedReason);

  // -- Discount list column --
  const discountList = (
    <div className="flex flex-col h-full" style={{ width: isMobile ? '100%' : needsReason ? '44%' : '100%' }}>
      <div className="px-4 pt-4 pb-3">
        <h3 className="text-[15px] font-medium text-white">Discounts</h3>
        <p className="text-[11px] text-[#888] mt-0.5">Select a discount below</p>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-hide px-3 pb-3">
        <div className="grid grid-cols-2 gap-2">
          {dynamicDiscounts.map((discount) => {
            const isSelected = selectedDiscount?.id === discount.id;
            const reqReason = isReasonRequired(discount);
            const Icon = discount.icon;
            return (
              <button
                key={discount.id}
                onClick={() => handleSelectDiscount(discount)}
                className="w-full flex items-center gap-2 px-2.5 py-2.5 rounded-[10px] transition-all"
                style={{
                  background: isSelected ? 'rgba(124,110,224,0.12)' : 'rgba(255,255,255,0.03)',
                  border: isSelected ? '1px solid #7c6ee0' : '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div className="w-6 h-6 rounded-md flex-shrink-0 flex items-center justify-center" style={{ background: isSelected ? 'rgba(124,110,224,0.25)' : 'rgba(255,255,255,0.06)' }}>
                  <Icon className="w-3 h-3" style={{ color: isSelected ? '#7c6ee0' : '#888' }} />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] font-medium text-white truncate">{discount.name}</span>
                    {reqReason && (
                      <span className="text-[8px] font-medium px-1 py-0.5 rounded flex-shrink-0 whitespace-nowrap" style={{ background: 'rgba(245,166,35,0.15)', color: '#f5a623' }}>
                        Reason required
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-[10px] font-medium whitespace-nowrap" style={{ color: '#aaa' }}>
                  {discount.type === "percentage" ? `${discount.value}%` : `$${discount.value.toFixed(2)}`}
                </span>
                <div
                  className="w-4.5 h-4.5 rounded-md flex-shrink-0 flex items-center justify-center transition-colors"
                  style={{
                    width: '18px', height: '18px',
                    background: isSelected ? '#7c6ee0' : 'transparent',
                    border: isSelected ? '1.5px solid #7c6ee0' : '1.5px solid #555',
                  }}
                >
                  {isSelected && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  // -- Reason column --
  const reasonColumn = (
    <div className="flex flex-col h-full" style={{ width: isMobile ? '100%' : '56%', borderLeft: isMobile ? 'none' : '0.5px solid rgba(255,255,255,0.08)' }}>
      <div className="px-4 pt-4 pb-3">
        <h3 className="text-[15px] font-medium text-white">Reason</h3>
        <p className="text-[11px] text-[#888] mt-0.5">Select a reason for the comp</p>
      </div>
      {needsReason ? (
        <div className="flex-1 overflow-y-auto scrollbar-hide px-4 pb-3">
          {/* AI suggested pill */}
          <div className="flex items-center gap-1.5 mb-3">
            <span className="text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1" style={{ background: 'rgba(245,166,35,0.12)', color: '#f5a623' }}>
              <Zap className="w-3 h-3" /> AI suggested
            </span>
          </div>
          {/* 4-column reason grid */}
          <div className="grid grid-cols-4 gap-2">
            {REASON_OPTIONS.map((r) => {
              const isSelected = selectedReason === r.label;
              return (
                <button
                  key={r.label}
                  onClick={() => setSelectedReason(isSelected ? null : r.label)}
                  className="flex flex-col items-center gap-1.5 py-3 px-1 rounded-[10px] transition-all"
                  style={{
                    background: isSelected ? 'rgba(124,110,224,0.12)' : 'rgba(255,255,255,0.03)',
                    border: isSelected
                      ? '1.5px solid #7c6ee0'
                      : r.isAI
                        ? '1px solid rgba(245,166,35,0.2)'
                        : '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <span className="text-xl leading-none">{r.emoji}</span>
                  <span className="text-[10px] font-medium text-center leading-tight" style={{ color: isSelected ? '#c4bcf0' : '#aaa' }}>
                    {r.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center px-4 pb-4">
          <PackageOpen className="w-10 h-10 mb-2" style={{ color: '#444' }} />
          <p className="text-[12px] text-center" style={{ color: '#555' }}>No reason required for this discount</p>
        </div>
      )}
    </div>
  );

  // -- Footer --
  const footer = (
    <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: '0.5px solid rgba(255,255,255,0.08)' }}>
      <div>
        <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: '#666' }}>Total savings</p>
        <p className="text-[16px] font-medium" style={{ color: '#7c6ee0' }}>-${totalSavings.toFixed(2)}</p>
      </div>
      <button
        onClick={handleApply}
        disabled={!canApply}
        className="px-8 py-2.5 rounded-[10px] text-sm font-medium transition-all"
        style={{
          background: canApply ? '#fff' : 'rgba(255,255,255,0.1)',
          color: canApply ? '#1e1e32' : '#555',
          opacity: canApply ? 1 : 0.6,
          cursor: canApply ? 'pointer' : 'not-allowed',
        }}
      >
        Apply{selectedDiscount ? ' (1)' : ''}
      </button>
    </div>
  );

  // -- Mobile: two-step flow --
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="p-0 gap-0 border-0" style={{ background: '#1e1e32' }}>
          {view === 'reason' ? (
            <>
              <div className="flex items-center px-3 pt-3 pb-1">
                <button onClick={() => setView('list')} className="p-1 rounded-lg" style={{ color: '#888' }}>
                  <ChevronLeft className="w-5 h-5" />
                </button>
              </div>
              {reasonColumn}
            </>
          ) : (
            <>
              {discountList}
              {needsReason && selectedDiscount && (
                <div className="px-4 pb-2">
                  <button
                    onClick={() => setView('reason')}
                    className="w-full py-2 rounded-lg text-xs font-medium"
                    style={{ background: 'rgba(245,166,35,0.12)', color: '#f5a623' }}
                  >
                    Select reason for {selectedDiscount.name}
                  </button>
                </div>
              )}
            </>
          )}
          {footer}
        </DrawerContent>
      </Drawer>
    );
  }

  // -- Desktop: side-by-side, reason panel only when needed --
  const dialogContent = (
    <div className="flex flex-col transition-all duration-200" style={{ background: '#1e1e32', borderRadius: '12px', overflow: 'hidden', maxHeight: '80vh' }}>
      <div className="flex flex-1 min-h-0" style={{ minHeight: '340px' }}>
        {discountList}
        {needsReason && reasonColumn}
      </div>
      {footer}
    </div>
  );

  if (portalContainer) {
    if (!open) return null;
    return dialogContent;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="p-0 gap-0 border-0 overflow-hidden sm:max-w-[640px]"
        style={{ background: '#1e1e32', borderRadius: '12px' }}
        hideCloseButton
      >
        {dialogContent}
      </DialogContent>
    </Dialog>
  );
}

export type { Discount, AppliedDiscountPayload };
