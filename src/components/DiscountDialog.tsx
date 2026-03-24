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
import { Check, Briefcase, Heart, GraduationCap, Shield, Star, Clock, Cake, Sparkles, DollarSign, BadgeDollarSign, Wallet, Tag, LucideIcon, AlertCircle, Zap, ChevronLeft, PackageOpen, UserX, XCircle, Thermometer, Timer, UserCog, UtensilsCrossed, FileText, Users, Percent, Gift, CalendarDays, Megaphone, Truck, Search } from "lucide-react";
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

const REASON_OPTIONS: { icon: LucideIcon; label: string; isAI: boolean }[] = [
  { icon: UserX, label: "Guest complaint", isAI: true },
  { icon: XCircle, label: "Wrong item", isAI: true },
  { icon: Thermometer, label: "Food cold", isAI: true },
  { icon: Timer, label: "Long wait", isAI: true },
  { icon: UserCog, label: "Manager comp", isAI: false },
  { icon: Cake, label: "Birthday", isAI: false },
  { icon: UtensilsCrossed, label: "Employee meal", isAI: false },
  { icon: AlertCircle, label: "Food allergy", isAI: true },
  { icon: Users, label: "VIP guest", isAI: false },
  { icon: Heart, label: "Bereavement", isAI: false },
  { icon: Star, label: "Influencer", isAI: false },
  { icon: FileText, label: "Other", isAI: false },
];

const REASON_TO_CATEGORY: Record<string, string> = {
  "Guest complaint": "Service Issue",
  "Wrong item": "Order Error",
  "Food cold": "Food Quality",
  "Long wait": "Service Issue",
  "Manager comp": "Promotion / Internal",
  "Birthday": "Promotion / Internal",
  "Employee meal": "Promotion / Internal",
  "Food allergy": "Food Quality",
  "VIP guest": "Promotion / Internal",
  "Bereavement": "Promotion / Internal",
  "Influencer": "Promotion / Internal",
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

const GROUP_KEYWORDS: Record<string, string[]> = {
  "Staff": ["employee", "military", "senior", "student"],
  "Promo": ["promo", "happy", "early", "seasonal", "first", "referral", "loyalty", "group", "takeaway", "flat"],
  "Manager": ["manager", "comp", "birthday", "full"],
};

const getGroup = (name: string): string => {
  const lower = name.toLowerCase();
  for (const [group, keywords] of Object.entries(GROUP_KEYWORDS)) {
    if (keywords.some(k => lower.includes(k))) return group;
  }
  return "Other";
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
  { id: "promo-code", name: "Promo Code", type: "percentage", value: 20, icon: Tag },
  { id: "group-dining", name: "Group Dining", type: "percentage", value: 10, icon: Users },
  { id: "early-bird", name: "Early Bird", type: "percentage", value: 15, icon: CalendarDays },
  { id: "seasonal", name: "Seasonal Offer", type: "percentage", value: 12, icon: Megaphone },
  { id: "takeaway", name: "Takeaway Discount", type: "percentage", value: 8, icon: Truck },
  { id: "referral", name: "Referral Reward", type: "percentage", value: 10, icon: Gift },
  { id: "flat-20", name: "Flat $20 Off", type: "amount", value: 20, icon: Percent },
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
  const seen = new Set<string>();
  const unique = discounts.filter(d => {
    const key = `${d.name.toLowerCase()}-${d.value}-${d.type}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const has100 = unique.some(d => d.value === 100 && d.type === "percentage");
  return has100 ? unique : [...unique, FULL_COMP_DEFAULT];
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

const FILTER_TABS = ["All", "Staff", "Promo", "Manager", "Other"] as const;

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
  const [commentText, setCommentText] = useState("");
  const [view, setView] = useState<'list' | 'reason'>('list');
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("All");
  const isMobile = useIsMobile();

  const prevOpenRef = useRef(false);
  useEffect(() => {
    if (open && !prevOpenRef.current) {
      fetchDiscountsFromDB().then(setDynamicDiscounts);
      setSelectedDiscount(currentDiscounts.length > 0 ? currentDiscounts[0] : null);
      setSelectedReason(null);
      setCommentText("");
      setView('list');
      setSearchQuery("");
      setActiveFilter("All");
    }
    prevOpenRef.current = open;
  }, [open, currentDiscounts]);

  const filteredDiscounts = useMemo(() => {
    let list = dynamicDiscounts;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(d => d.name.toLowerCase().includes(q));
    }
    if (activeFilter !== "All") {
      list = list.filter(d => getGroup(d.name) === activeFilter);
    }
    return list;
  }, [dynamicDiscounts, searchQuery, activeFilter]);

  const needsReason = selectedDiscount ? isReasonRequired(selectedDiscount) : false;

  const handleSelectDiscount = (discount: Discount) => {
    if (selectedDiscount?.id === discount.id) {
      setSelectedDiscount(null);
      setSelectedReason(null);
      setCommentText("");
    } else {
      setSelectedDiscount(discount);
      setSelectedReason(null);
      setCommentText("");
    }
  };

  const handleApply = () => {
    if (!selectedDiscount) return;
    if (needsReason && !selectedReason) return;
    const payload: AppliedDiscountPayload = {
      discount: selectedDiscount,
      reason: selectedReason,
      notes: commentText.trim() || null,
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

  // -- Header --
  const header = (
    <div>
      <div className="px-5 pt-5 pb-3">
        <h3 className="text-lg font-semibold text-white">Discounts</h3>
        <p className="text-xs mt-0.5" style={{ color: '#777' }}>Select a discount below</p>
      </div>
      <div className="mx-3 mb-2" style={{ height: '0.5px', background: 'rgba(255,255,255,0.08)' }} />
    </div>
  );

  // -- Search + filter bar --
  const searchAndFilter = (
    <div className="px-5 pt-2 pb-2">
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#666' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search discounts..."
            className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm text-white placeholder:text-neutral-600 focus:outline-none"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
          />
        </div>
        <div className="flex items-center gap-1">
          {FILTER_TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveFilter(tab)}
              className="px-3 py-2 rounded-lg text-xs font-medium transition-all"
              style={{
                background: activeFilter === tab ? 'rgba(255,255,255,0.12)' : 'transparent',
                color: activeFilter === tab ? '#fff' : '#666',
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  // -- Discount grid (no scroll) --
  const discountGrid = (
    <div className="flex flex-col" style={{ width: isMobile ? '100%' : '740px', minWidth: isMobile ? undefined : '740px' }}>
      {header}
      {searchAndFilter}
      
      <div className="px-4 pb-4">
        <div className={`grid gap-2.5 ${isMobile ? 'grid-cols-3' : 'grid-cols-4'}`}>
          {filteredDiscounts.map((discount) => {
            const isSelected = selectedDiscount?.id === discount.id;
            return (
              <button
                key={discount.id}
                onClick={() => handleSelectDiscount(discount)}
                className="flex flex-col items-center justify-center px-2 py-4 rounded-xl transition-all text-center"
                style={{
                  background: isSelected ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.025)',
                  border: isSelected ? '1.5px solid rgba(255,255,255,0.5)' : '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <span className="text-[13px] font-medium text-white leading-snug" style={{ wordBreak: 'break-word' }}>
                  {discount.name}
                </span>
                <span className="text-xs font-semibold mt-1" style={{ color: isSelected ? '#fff' : '#999' }}>
                  {discount.type === "percentage" ? `${discount.value}%` : `$${discount.value.toFixed(2)}`}
                </span>
              </button>
            );
          })}
          {filteredDiscounts.length === 0 && (
            <div className="col-span-full py-8 text-center">
              <p className="text-sm" style={{ color: '#555' }}>No discounts found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // -- Reason column --
  const reasonColumn = (
    <div className="flex flex-col" style={{ width: isMobile ? '100%' : '300px', minWidth: isMobile ? undefined : '300px', borderLeft: isMobile ? 'none' : '0.5px solid rgba(255,255,255,0.08)', background: '#1a1a1e' }}>
      <div className="px-5 pt-5 pb-3">
        <h3 className="text-lg font-semibold text-white">Reason</h3>
        <p className="text-xs mt-0.5" style={{ color: '#777' }}>Select a reason for the comp</p>
      </div>
      <div className="mx-3 mb-2" style={{ height: '0.5px', background: 'rgba(255,255,255,0.08)' }} />
      {needsReason ? (
        <div className="flex flex-col px-3 pb-3">
          <div className="flex items-center gap-1.5 mb-2.5 px-1">
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1" style={{ background: 'rgba(245,166,35,0.12)', color: '#f5a623' }}>
              <Zap className="w-2.5 h-2.5" /> AI suggested
            </span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {REASON_OPTIONS.map((r) => {
              const isSelected = selectedReason === r.label;
              return (
                <button
                  key={r.label}
                  onClick={() => setSelectedReason(isSelected ? null : r.label)}
                  className="flex flex-col items-center justify-center gap-1 px-1.5 py-2.5 rounded-lg transition-all relative"
                  style={{
                    background: isSelected ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.02)',
                    border: isSelected
                      ? '1px solid rgba(255,255,255,0.25)'
                      : r.isAI
                        ? '1px solid rgba(245,166,35,0.15)'
                        : '1px solid rgba(255,255,255,0.04)',
                  }}
                >
                  {isSelected && (
                    <Check className="w-2.5 h-2.5 absolute top-1 right-1" style={{ color: '#fff' }} />
                  )}
                  {r.isAI && !isSelected && (
                    <Zap className="w-2 h-2 absolute top-1 right-1" style={{ color: 'rgba(245,166,35,0.4)' }} />
                  )}
                  <r.icon className="w-5 h-5" style={{ color: isSelected ? '#fff' : '#888' }} />
                  <span className="text-[11px] font-medium text-center leading-tight" style={{ color: isSelected ? '#fff' : '#aaa' }}>
                    {r.label}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="mt-2 px-1">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value.slice(0, 100))}
              placeholder="Add a comment (optional)"
              className="w-full px-3 py-2 rounded-lg text-[11px] text-white placeholder:text-neutral-600 resize-none focus:outline-none transition-colors"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                height: '60px',
              }}
              onFocus={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.25)'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.06)'}
            />
            <p className="text-[9px] text-right mt-0.5" style={{ color: '#555' }}>{commentText.length}/100</p>
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
    <div className="flex items-center justify-between px-5 py-3.5" style={{ borderTop: '0.5px solid rgba(255,255,255,0.08)' }}>
      <div>
        <p className="text-[11px] font-medium uppercase tracking-wider" style={{ color: '#666' }}>Total savings</p>
        <p className="text-lg font-semibold text-white">-${totalSavings.toFixed(2)}</p>
      </div>
      <button
        onClick={handleApply}
        disabled={!canApply}
        className="px-10 py-2.5 rounded-xl text-sm font-semibold transition-all"
        style={{
          background: canApply ? '#fff' : 'rgba(255,255,255,0.1)',
          color: canApply ? '#1a1a1e' : '#555',
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
        <DrawerContent className="p-0 gap-0 border-0" style={{ background: '#1a1a1e', maxHeight: '85vh' }}>
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
              {discountGrid}
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

  // -- Desktop: wide, side-by-side, no scroll --
  const dialogContent = (
    <div className="flex flex-col" style={{ background: '#1a1a1e', borderRadius: '16px', overflow: 'hidden' }}>
      <div className="flex min-h-0">
        {discountGrid}
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
        className={`p-0 gap-0 border-0 overflow-hidden transition-all duration-300 ${needsReason ? 'sm:max-w-[1040px]' : 'sm:max-w-[740px]'}`}
        style={{ background: '#1a1a1e', borderRadius: '16px' }}
        hideCloseButton
      >
        {dialogContent}
      </DialogContent>
    </Dialog>
  );
}

export type { Discount, AppliedDiscountPayload };
