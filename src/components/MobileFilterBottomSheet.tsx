import React, { memo, useState, useCallback } from "react";
import { Calendar } from "@/components/ui/calendar";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  DollarSign, CalendarDays, UsersRound, ClipboardList,
  CircleDollarSign, CreditCard, ChevronDown, ChevronUp, Check, X,
} from "lucide-react";

import tableOrderSvg from "@/assets/icons/table-order-2.svg";
import takeOutSvg from "@/assets/icons/take-out-2.svg";
import driveThruSvg from "@/assets/icons/drive-thru-2.svg";

// ── static data ──
const REVENUE_CENTER_OPTIONS = ["FF Balcony", "Main Dining", "Bar", "Patio", "Online", "Counter"];
const EMPLOYEE_OPTIONS = ["Mia Jone", "Dustin H"];
const ORDER_TYPE_OPTIONS = [
  { label: "Table", icon: tableOrderSvg },
  { label: "Takeaway", icon: takeOutSvg },
  { label: "Drive-thru", icon: driveThruSvg },
];
const ORDER_STATUS_OPTIONS = ["ORDERING", "PAID", "UNPAID"];
const PAYMENT_TYPE_OPTIONS = ["Cash", "Split Payment", "Unpaid"];

export interface MobileFilterBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  // Current applied values
  advFilterRevenueCenter: string | null;
  advFilterDate: Date | undefined;
  advFilterEmployee: string | null;
  advFilterOrderType: string | null;
  advFilterOrderStatus: string | null;
  advFilterPaymentType: string | null;
  // Apply callback
  onApply: (filters: {
    revenueCenter: string | null;
    date: Date | undefined;
    employee: string | null;
    orderType: string | null;
    orderStatus: string | null;
    paymentType: string | null;
  }) => void;
}

// ── Expandable Section ──
const FilterSection = memo(({
  title,
  icon: Icon,
  isExpanded,
  onToggle,
  children,
}: {
  title: string;
  icon: React.ElementType;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) => (
  <div className="border-b border-white/10">
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between px-4 py-3"
    >
      <div className="flex items-center gap-2.5">
        <Icon className="w-4 h-4 text-white/60" />
        <span className="text-white text-sm font-medium">{title}</span>
      </div>
      {isExpanded ? (
        <ChevronUp className="w-4 h-4 text-white/40" />
      ) : (
        <ChevronDown className="w-4 h-4 text-white/40" />
      )}
    </button>
    {isExpanded && (
      <div className="px-4 pb-3">
        {children}
      </div>
    )}
  </div>
));
FilterSection.displayName = "FilterSection";

// ── Option Chip ──
const FilterOption = memo(({
  label,
  isSelected,
  onToggle,
  icon,
}: {
  label: string;
  isSelected: boolean;
  onToggle: () => void;
  icon?: string;
}) => (
  <button
    onClick={onToggle}
    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
      isSelected
        ? "bg-orange-500/20 text-orange-400 border border-orange-500/40"
        : "bg-white/5 text-white/80 border border-white/10 hover:bg-white/10"
    }`}
  >
    {icon && <img src={icon} alt={label} className="w-4 h-4 object-contain" />}
    <span>{label}</span>
    {isSelected && <Check className="w-3.5 h-3.5 ml-auto" />}
  </button>
));
FilterOption.displayName = "FilterOption";

const MobileFilterBottomSheet = memo<MobileFilterBottomSheetProps>(({
  isOpen,
  onClose,
  advFilterRevenueCenter,
  advFilterDate,
  advFilterEmployee,
  advFilterOrderType,
  advFilterOrderStatus,
  advFilterPaymentType,
  onApply,
}) => {
  // Local temp state — initialized from current applied filters when sheet opens
  const [tempRevenueCenter, setTempRevenueCenter] = useState<string | null>(advFilterRevenueCenter);
  const [tempDate, setTempDate] = useState<Date | undefined>(advFilterDate);
  const [tempEmployee, setTempEmployee] = useState<string | null>(advFilterEmployee);
  const [tempOrderType, setTempOrderType] = useState<string | null>(advFilterOrderType);
  const [tempOrderStatus, setTempOrderStatus] = useState<string | null>(advFilterOrderStatus);
  const [tempPaymentType, setTempPaymentType] = useState<string | null>(advFilterPaymentType);

  // Expanded sections
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    revenueCenter: true,
  });

  // Sync temp state when sheet opens with new prop values
  React.useEffect(() => {
    if (isOpen) {
      setTempRevenueCenter(advFilterRevenueCenter);
      setTempDate(advFilterDate);
      setTempEmployee(advFilterEmployee);
      setTempOrderType(advFilterOrderType);
      setTempOrderStatus(advFilterOrderStatus);
      setTempPaymentType(advFilterPaymentType);
    }
  }, [isOpen, advFilterRevenueCenter, advFilterDate, advFilterEmployee, advFilterOrderType, advFilterOrderStatus, advFilterPaymentType]);

  const toggleSection = useCallback((key: string) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const hasAnyTempFilter = !!(tempRevenueCenter || tempDate || tempEmployee || tempOrderType || tempOrderStatus || tempPaymentType);

  const handleClearAll = useCallback(() => {
    setTempRevenueCenter(null);
    setTempDate(undefined);
    setTempEmployee(null);
    setTempOrderType(null);
    setTempOrderStatus(null);
    setTempPaymentType(null);
  }, []);

  const handleApply = useCallback(() => {
    onApply({
      revenueCenter: tempRevenueCenter,
      date: tempDate,
      employee: tempEmployee,
      orderType: tempOrderType,
      orderStatus: tempOrderStatus,
      paymentType: tempPaymentType,
    });
    onClose();
  }, [tempRevenueCenter, tempDate, tempEmployee, tempOrderType, tempOrderStatus, tempPaymentType, onApply, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex flex-col justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <div
        className="relative flex flex-col rounded-t-2xl overflow-hidden animate-slide-up"
        style={{
          backgroundColor: "#1B1C20",
          maxHeight: "85vh",
        }}
      >
        {/* Drag indicator */}
        <div className="flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <span className="text-white font-semibold text-base">Filters</span>
          <div className="flex items-center gap-3">
            {hasAnyTempFilter && (
              <button
                onClick={handleClearAll}
                className="text-red-400 text-sm font-medium"
              >
                Reset
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-white/10"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        {/* Filter Sections */}
        <ScrollArea className="flex-1" style={{ maxHeight: "calc(85vh - 140px)" }}>
          <div>
            {/* Revenue Center */}
            <FilterSection
              title="Revenue Center"
              icon={DollarSign}
              isExpanded={!!expandedSections.revenueCenter}
              onToggle={() => toggleSection("revenueCenter")}
            >
              <div className="flex flex-wrap gap-2">
                {REVENUE_CENTER_OPTIONS.map(opt => (
                  <FilterOption
                    key={opt}
                    label={opt}
                    isSelected={tempRevenueCenter === opt}
                    onToggle={() => setTempRevenueCenter(tempRevenueCenter === opt ? null : opt)}
                  />
                ))}
              </div>
            </FilterSection>

            {/* Date */}
            <FilterSection
              title="Date"
              icon={CalendarDays}
              isExpanded={!!expandedSections.date}
              onToggle={() => toggleSection("date")}
            >
              <Calendar
                mode="single"
                selected={tempDate}
                onSelect={setTempDate}
                className="p-0 pointer-events-auto"
              />
            </FilterSection>

            {/* Employee */}
            <FilterSection
              title="Employee"
              icon={UsersRound}
              isExpanded={!!expandedSections.employee}
              onToggle={() => toggleSection("employee")}
            >
              <div className="flex flex-wrap gap-2">
                {EMPLOYEE_OPTIONS.map(opt => (
                  <FilterOption
                    key={opt}
                    label={opt}
                    isSelected={tempEmployee === opt}
                    onToggle={() => setTempEmployee(tempEmployee === opt ? null : opt)}
                  />
                ))}
              </div>
            </FilterSection>

            {/* Order Type */}
            <FilterSection
              title="Order Type"
              icon={ClipboardList}
              isExpanded={!!expandedSections.orderType}
              onToggle={() => toggleSection("orderType")}
            >
              <div className="flex flex-wrap gap-2">
                {ORDER_TYPE_OPTIONS.map(opt => (
                  <FilterOption
                    key={opt.label}
                    label={opt.label}
                    isSelected={tempOrderType === opt.label}
                    onToggle={() => setTempOrderType(tempOrderType === opt.label ? null : opt.label)}
                    icon={opt.icon}
                  />
                ))}
              </div>
            </FilterSection>

            {/* Order Status */}
            <FilterSection
              title="Order Status"
              icon={CircleDollarSign}
              isExpanded={!!expandedSections.orderStatus}
              onToggle={() => toggleSection("orderStatus")}
            >
              <div className="flex flex-wrap gap-2">
                {ORDER_STATUS_OPTIONS.map(opt => (
                  <FilterOption
                    key={opt}
                    label={opt}
                    isSelected={tempOrderStatus === opt}
                    onToggle={() => setTempOrderStatus(tempOrderStatus === opt ? null : opt)}
                  />
                ))}
              </div>
            </FilterSection>

            {/* Payment Type */}
            <FilterSection
              title="Payment Type"
              icon={CreditCard}
              isExpanded={!!expandedSections.paymentType}
              onToggle={() => toggleSection("paymentType")}
            >
              <div className="flex flex-wrap gap-2">
                {PAYMENT_TYPE_OPTIONS.map(opt => (
                  <FilterOption
                    key={opt}
                    label={opt}
                    isSelected={tempPaymentType === opt}
                    onToggle={() => setTempPaymentType(tempPaymentType === opt ? null : opt)}
                  />
                ))}
              </div>
            </FilterSection>
          </div>
          <ScrollBar orientation="vertical" />
        </ScrollArea>

        {/* Bottom Action Bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-t border-white/10">
          <button
            onClick={() => { handleClearAll(); }}
            className="flex-1 py-2.5 rounded-full text-white text-sm font-medium border border-white/20 hover:bg-white/10 transition-colors"
          >
            Clear All
          </button>
          <button
            onClick={handleApply}
            className="flex-1 py-2.5 rounded-full text-white text-sm font-bold transition-all"
            style={{ background: "linear-gradient(180deg, #FF9E65 0%, #FF5E00 100%)" }}
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
});

MobileFilterBottomSheet.displayName = "MobileFilterBottomSheet";
export default MobileFilterBottomSheet;
