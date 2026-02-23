import React, { memo, useCallback } from "react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Search, SlidersHorizontal, DollarSign, CalendarDays,
  UsersRound, ClipboardList, CircleDollarSign, CreditCard, X, RotateCcw,
} from "lucide-react";

import tableOrderSvg from "@/assets/icons/table-order-2.svg";
import takeOutSvg from "@/assets/icons/take-out-2.svg";
import driveThruSvg from "@/assets/icons/drive-thru-2.svg";

// ── static data (module-level, never recreated) ──
const REVENUE_CENTER_OPTIONS = ["FF Balcony", "Main Dining", "Bar", "Patio", "Online", "Counter"] as const;
const EMPLOYEE_OPTIONS = ["Mia Jone", "Dustin H"] as const;
const ORDER_TYPE_OPTIONS = [
  { label: "Table", icon: tableOrderSvg },
  { label: "Takeaway", icon: takeOutSvg },
  { label: "Drive-thru", icon: driveThruSvg },
] as const;
const ORDER_STATUS_OPTIONS = ["ORDERING", "PAID", "UNPAID"] as const;
const PAYMENT_TYPE_OPTIONS = ["Cash", "Split Payment", "Unpaid"] as const;

const ICON_BTN_CLASS = "p-2 rounded-full hover:opacity-80";
const ICON_BTN_STYLE: React.CSSProperties = {
  background: "#7575754D",
  boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)",
};
const ACTIVE_ICON_BTN_STYLE: React.CSSProperties = {
  background: "linear-gradient(180deg, #FF9E65 0%, #FF5E00 100%)",
};
const DROPDOWN_STYLE: React.CSSProperties = {
  backgroundColor: "#2A2A2E",
  border: "1px solid rgba(255,255,255,0.12)",
};
const DROPDOWN_ITEM_CLASS = "hover:bg-white/10 cursor-pointer";

// ── small sub-components (stable, never re-created) ──
const FilterDropdownWrapper = memo(({ label, children }: { label: string; children: React.ReactNode }) => (
  <PopoverContent
    align="start"
    sideOffset={8}
    className="w-auto min-w-[180px] p-0 rounded-xl border-0 shadow-xl z-[100]"
    style={DROPDOWN_STYLE}
  >
    <div className="px-4 py-2.5 border-b border-white/10">
      <span className="text-white/50 text-xs font-medium">{label}</span>
    </div>
    <div className="py-1">{children}</div>
  </PopoverContent>
));
FilterDropdownWrapper.displayName = "FilterDropdownWrapper";

// ── props ──
export interface TicketsFilterBarProps {
  showSearch: boolean;
  searchQuery: string;
  showFilterIcons: boolean;
  advFilterRevenueCenter: string | null;
  advFilterDate: Date | undefined;
  advFilterEmployee: string | null;
  advFilterOrderType: string | null;
  advFilterOrderStatus: string | null;
  advFilterPaymentType: string | null;
  onSearchQueryChange: (q: string) => void;
  onShowSearchChange: (v: boolean) => void;
  onShowFilterIconsChange: (v: boolean) => void;
  onAdvFilterRevenueCenterChange: (v: string | null) => void;
  onAdvFilterDateChange: (v: Date | undefined) => void;
  onAdvFilterEmployeeChange: (v: string | null) => void;
  onAdvFilterOrderTypeChange: (v: string | null) => void;
  onAdvFilterOrderStatusChange: (v: string | null) => void;
  onAdvFilterPaymentTypeChange: (v: string | null) => void;
  onResetAllAdvancedFilters: () => void;
  hasAnyAdvancedFilter: boolean;
}

const TicketsFilterBar = memo<TicketsFilterBarProps>(({
  showSearch,
  searchQuery,
  showFilterIcons,
  advFilterRevenueCenter,
  advFilterDate,
  advFilterEmployee,
  advFilterOrderType,
  advFilterOrderStatus,
  advFilterPaymentType,
  onSearchQueryChange,
  onShowSearchChange,
  onShowFilterIconsChange,
  onAdvFilterRevenueCenterChange,
  onAdvFilterDateChange,
  onAdvFilterEmployeeChange,
  onAdvFilterOrderTypeChange,
  onAdvFilterOrderStatusChange,
  onAdvFilterPaymentTypeChange,
  onResetAllAdvancedFilters,
  hasAnyAdvancedFilter,
}) => {
  // Toggle helpers — stable via useCallback
  const toggleRevenueCenter = useCallback(
    (opt: string) => onAdvFilterRevenueCenterChange(advFilterRevenueCenter === opt ? null : opt),
    [advFilterRevenueCenter, onAdvFilterRevenueCenterChange]
  );
  const toggleEmployee = useCallback(
    (opt: string) => onAdvFilterEmployeeChange(advFilterEmployee === opt ? null : opt),
    [advFilterEmployee, onAdvFilterEmployeeChange]
  );
  const toggleOrderType = useCallback(
    (opt: string) => onAdvFilterOrderTypeChange(advFilterOrderType === opt ? null : opt),
    [advFilterOrderType, onAdvFilterOrderTypeChange]
  );
  const toggleOrderStatus = useCallback(
    (opt: string) => onAdvFilterOrderStatusChange(advFilterOrderStatus === opt ? null : opt),
    [advFilterOrderStatus, onAdvFilterOrderStatusChange]
  );
  const togglePaymentType = useCallback(
    (opt: string) => onAdvFilterPaymentTypeChange(advFilterPaymentType === opt ? null : opt),
    [advFilterPaymentType, onAdvFilterPaymentTypeChange]
  );

  if (showSearch) {
    return (
      <div className="relative flex items-center justify-between p-2 border-b border-neutral-700/50">
        <div className="flex items-center gap-2 flex-1 mr-2">
          <Search className="w-4 h-4 text-neutral-400 flex-shrink-0" />
          <input
            autoFocus
            type="text"
            value={searchQuery}
            onChange={e => onSearchQueryChange(e.target.value)}
            placeholder="Search by name, order ID, or check..."
            className="bg-transparent text-white text-sm placeholder:text-neutral-500 outline-none w-full"
          />
        </div>
        <button
          className={ICON_BTN_CLASS}
          style={ICON_BTN_STYLE}
          onClick={() => { onShowSearchChange(false); onSearchQueryChange(""); }}
        >
          <X className="w-4 h-4 text-white" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative flex items-center justify-between p-2 border-b border-neutral-700/50">
      <span className="text-white font-semibold text-lg pl-2">Tickets</span>
      <div className="flex items-center gap-1.5 z-10">
        {showFilterIcons && (
          <>
            {/* Revenue Center */}
            <Popover>
              <PopoverTrigger asChild>
                <button className={ICON_BTN_CLASS} style={advFilterRevenueCenter ? ACTIVE_ICON_BTN_STYLE : ICON_BTN_STYLE} title="Revenue Center">
                  <DollarSign className="w-4 h-4 text-white" />
                </button>
              </PopoverTrigger>
              <FilterDropdownWrapper label="Revenue Center">
                {REVENUE_CENTER_OPTIONS.map(opt => (
                  <button key={opt} onClick={() => toggleRevenueCenter(opt)} className={`w-full text-left px-4 py-2 text-sm ${advFilterRevenueCenter === opt ? 'text-orange-400' : 'text-white'} ${DROPDOWN_ITEM_CLASS}`}>
                    {opt}
                  </button>
                ))}
              </FilterDropdownWrapper>
            </Popover>

            {/* Date */}
            <Popover>
              <PopoverTrigger asChild>
                <button className={ICON_BTN_CLASS} style={advFilterDate ? ACTIVE_ICON_BTN_STYLE : ICON_BTN_STYLE} title="Date">
                  <CalendarDays className="w-4 h-4 text-white" />
                </button>
              </PopoverTrigger>
              <PopoverContent align="start" sideOffset={8} className="w-auto p-0 rounded-xl border-0 shadow-xl z-[100]" style={DROPDOWN_STYLE}>
                <Calendar
                  mode="single"
                  selected={advFilterDate}
                  onSelect={onAdvFilterDateChange}
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>

            {/* Employee */}
            <Popover>
              <PopoverTrigger asChild>
                <button className={ICON_BTN_CLASS} style={advFilterEmployee ? ACTIVE_ICON_BTN_STYLE : ICON_BTN_STYLE} title="Employee">
                  <UsersRound className="w-4 h-4 text-white" />
                </button>
              </PopoverTrigger>
              <FilterDropdownWrapper label="Employee">
                {EMPLOYEE_OPTIONS.map(opt => (
                  <button key={opt} onClick={() => toggleEmployee(opt)} className={`w-full text-left px-4 py-2 text-sm ${advFilterEmployee === opt ? 'text-orange-400' : 'text-white'} ${DROPDOWN_ITEM_CLASS}`}>
                    {opt}
                  </button>
                ))}
              </FilterDropdownWrapper>
            </Popover>

            {/* Order Type */}
            <Popover>
              <PopoverTrigger asChild>
                <button className={ICON_BTN_CLASS} style={advFilterOrderType ? ACTIVE_ICON_BTN_STYLE : ICON_BTN_STYLE} title="Order Type">
                  <ClipboardList className="w-4 h-4 text-white" />
                </button>
              </PopoverTrigger>
              <FilterDropdownWrapper label="Order Type">
                {ORDER_TYPE_OPTIONS.map(opt => (
                  <button key={opt.label} onClick={() => toggleOrderType(opt.label)} className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2.5 ${advFilterOrderType === opt.label ? 'text-orange-400' : 'text-white'} ${DROPDOWN_ITEM_CLASS}`}>
                    <img src={opt.icon} alt={opt.label} className="w-4 h-4 object-contain" />
                    {opt.label}
                  </button>
                ))}
              </FilterDropdownWrapper>
            </Popover>

            {/* Order Status */}
            <Popover>
              <PopoverTrigger asChild>
                <button className={ICON_BTN_CLASS} style={advFilterOrderStatus ? ACTIVE_ICON_BTN_STYLE : ICON_BTN_STYLE} title="Order Status">
                  <CircleDollarSign className="w-4 h-4 text-white" />
                </button>
              </PopoverTrigger>
              <FilterDropdownWrapper label="Order Status">
                {ORDER_STATUS_OPTIONS.map(opt => (
                  <button key={opt} onClick={() => toggleOrderStatus(opt)} className={`w-full text-left px-4 py-2 text-sm font-medium ${advFilterOrderStatus === opt ? 'text-orange-400' : 'text-white'} ${DROPDOWN_ITEM_CLASS}`}>
                    {opt}
                  </button>
                ))}
              </FilterDropdownWrapper>
            </Popover>

            {/* Payment Type */}
            <Popover>
              <PopoverTrigger asChild>
                <button className={ICON_BTN_CLASS} style={advFilterPaymentType ? ACTIVE_ICON_BTN_STYLE : ICON_BTN_STYLE} title="Payment Type">
                  <CreditCard className="w-4 h-4 text-white" />
                </button>
              </PopoverTrigger>
              <FilterDropdownWrapper label="Payment Type">
                {PAYMENT_TYPE_OPTIONS.map(opt => (
                  <button key={opt} onClick={() => togglePaymentType(opt)} className={`w-full text-left px-4 py-2 text-sm ${advFilterPaymentType === opt ? 'text-orange-400' : 'text-white'} ${DROPDOWN_ITEM_CLASS}`}>
                    {opt}
                  </button>
                ))}
              </FilterDropdownWrapper>
            </Popover>

            {/* Close / Reset */}
            {hasAnyAdvancedFilter ? (
              <button
                className={ICON_BTN_CLASS}
                style={{ background: "rgba(239, 68, 68, 0.25)", boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)" }}
                onClick={onResetAllAdvancedFilters}
                title="Reset Filters"
              >
                <RotateCcw className="w-4 h-4 text-red-400" />
              </button>
            ) : (
              <button
                className={ICON_BTN_CLASS}
                style={ICON_BTN_STYLE}
                onClick={() => onShowFilterIconsChange(false)}
              >
                <X className="w-4 h-4 text-white" />
              </button>
            )}
          </>
        )}
        {!showFilterIcons && (
          <button
            className={`${ICON_BTN_CLASS} relative`}
            style={ICON_BTN_STYLE}
            onClick={() => onShowFilterIconsChange(true)}
          >
            <SlidersHorizontal className="w-4 h-4 text-white" />
            {hasAnyAdvancedFilter && (
              <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-amber-500 text-[8px] text-white font-bold flex items-center justify-center">!</span>
            )}
          </button>
        )}
        <button
          className={ICON_BTN_CLASS}
          style={ICON_BTN_STYLE}
          onClick={() => onShowSearchChange(true)}
        >
          <Search className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>
  );
});

TicketsFilterBar.displayName = "TicketsFilterBar";
export default TicketsFilterBar;
