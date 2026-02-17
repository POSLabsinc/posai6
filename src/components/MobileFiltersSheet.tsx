import { useState } from "react";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar } from "@/components/ui/calendar";
import { ChevronRight, ChevronLeft, Check, Search, X } from "lucide-react";
import { format } from "date-fns";
import OrderTypeIcon from "@/components/OrderTypeIcon";

type FilterScreen = 'main' | 'revenue-center' | 'date' | 'employee' | 'order-type' | 'order-status' | 'payment-type';

type DatePreset = 'today' | 'yesterday' | 'this-week' | 'this-month' | 'last-7-days' | 'custom';

interface MobileFiltersState {
  revenueCenter: string | null;
  datePreset: DatePreset;
  customDateStart: Date | undefined;
  customDateEnd: Date | undefined;
  employee: string | null;
  orderType: string | null;
  orderStatus: string | null;
  paymentType: string | null;
}

interface MobileFiltersSheetProps {
  isOpen: boolean;
  onClose: () => void;
  filters: MobileFiltersState;
  onApplyFilters: (filters: MobileFiltersState) => void;
  options: {
    revenueCenters: string[];
    employees: string[];
    orderTypes: string[];
    orderStatuses: string[];
    paymentTypes: string[];
  };
}

const datePresets: { value: DatePreset; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'this-week', label: 'This Week' },
  { value: 'this-month', label: 'This Month' },
  { value: 'last-7-days', label: 'Last 7 Days' },
  { value: 'custom', label: 'Custom' },
];

const MobileFiltersSheet = ({ isOpen, onClose, filters, onApplyFilters, options }: MobileFiltersSheetProps) => {
  const [currentScreen, setCurrentScreen] = useState<FilterScreen>('main');
  const [tempFilters, setTempFilters] = useState<MobileFiltersState>(filters);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCustomDatePicker, setShowCustomDatePicker] = useState<'start' | 'end' | null>(null);

  // Reset temp filters when sheet opens
  const handleOpenChange = (open: boolean) => {
    if (open) {
      setTempFilters(filters);
      setCurrentScreen('main');
      setSearchQuery("");
      setShowCustomDatePicker(null);
    } else {
      onClose();
    }
  };

  const handleApply = () => {
    onApplyFilters(tempFilters);
    onClose();
  };

  const handleClearAll = () => {
    const defaultFilters: MobileFiltersState = {
      revenueCenter: null,
      datePreset: 'today',
      customDateStart: undefined,
      customDateEnd: undefined,
      employee: null,
      orderType: null,
      orderStatus: null,
      paymentType: null,
    };
    setTempFilters(defaultFilters);
  };

  const hasActiveFilters = 
    tempFilters.revenueCenter !== null ||
    tempFilters.datePreset !== 'today' ||
    tempFilters.employee !== null ||
    tempFilters.orderType !== null ||
    tempFilters.orderStatus !== null ||
    tempFilters.paymentType !== null;

  const getDateDisplayValue = () => {
    if (tempFilters.datePreset === 'custom') {
      if (tempFilters.customDateStart && tempFilters.customDateEnd) {
        return `${format(tempFilters.customDateStart, 'MM/dd')} - ${format(tempFilters.customDateEnd, 'MM/dd')}`;
      }
      return 'Custom';
    }
    return datePresets.find(p => p.value === tempFilters.datePreset)?.label || 'Today';
  };

  // iOS-style filter row component
  const FilterRow = ({ 
    label, 
    value, 
    onPress,
    isLast = false
  }: { 
    label: string; 
    value: string | null; 
    onPress: () => void;
    isLast?: boolean;
  }) => (
    <button
      onClick={onPress}
      className={`w-full flex items-center justify-between py-[11px] px-4 active:bg-white/[0.08] transition-colors duration-100 ${!isLast ? 'border-b border-white/[0.08]' : ''}`}
    >
      <span className="text-white text-[17px] leading-[22px]">{label}</span>
      <div className="flex items-center gap-1">
        <span className="text-white/60 text-[17px] leading-[22px]">{value || 'All'}</span>
        <ChevronRight className="w-[18px] h-[18px] text-white/30" strokeWidth={2.5} />
      </div>
    </button>
  );

  // iOS-style selection list with checkmark
  const SelectionList = ({
    items,
    selectedValue,
    onSelect,
    allLabel,
    searchable = false,
    showIcons = false,
  }: {
    items: string[];
    selectedValue: string | null;
    onSelect: (value: string | null) => void;
    allLabel: string;
    searchable?: boolean;
    showIcons?: boolean;
  }) => {
    const filteredItems = searchable && searchQuery
      ? items.filter(item => item.toLowerCase().includes(searchQuery.toLowerCase()))
      : items;

    return (
      <div className="flex flex-col h-full animate-in slide-in-from-right-4 duration-200">
        {searchable && (
          <div className="px-4 py-2">
            <div className="flex items-center gap-2 px-3 py-2 rounded-[10px] bg-white/[0.08]">
              <Search className="w-[17px] h-[17px] text-white/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search"
                className="flex-1 bg-transparent text-white text-[17px] outline-none placeholder:text-white/40"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")} 
                  className="p-0.5 rounded-full bg-white/20 active:bg-white/30"
                >
                  <X className="w-3.5 h-3.5 text-white/80" />
                </button>
              )}
            </div>
          </div>
        )}
        <ScrollArea className="flex-1">
          <div className="px-4">
            <div className="rounded-[10px] bg-white/[0.06] overflow-hidden">
              {/* "All" option */}
              <button
                onClick={() => {
                  onSelect(null);
                  setCurrentScreen('main');
                  setSearchQuery("");
                }}
                className="w-full flex items-center justify-between py-[11px] px-4 active:bg-white/[0.08] transition-colors duration-100 border-b border-white/[0.08]"
              >
                <span className="text-white text-[17px] leading-[22px]">{allLabel}</span>
                {selectedValue === null && (
                  <Check className="w-5 h-5 text-white" strokeWidth={2.5} />
                )}
              </button>
              {/* Items */}
              {filteredItems.map((item, index) => (
                <button
                  key={item}
                  onClick={() => {
                    onSelect(item);
                    setCurrentScreen('main');
                    setSearchQuery("");
                  }}
                  className={`w-full flex items-center justify-between py-[11px] px-4 active:bg-white/[0.08] transition-colors duration-100 ${index < filteredItems.length - 1 ? 'border-b border-white/[0.08]' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    {showIcons && <OrderTypeIcon type={item} size="small" />}
                    <span className="text-white text-[17px] leading-[22px]">{item}</span>
                  </div>
                  {selectedValue === item && (
                    <Check className="w-5 h-5 text-white" strokeWidth={2.5} />
                  )}
                </button>
              ))}
            </div>
          </div>
        </ScrollArea>
      </div>
    );
  };

  // Date selection screen
  const DateSelectionScreen = () => {
    if (showCustomDatePicker === 'start') {
      return (
        <div className="flex flex-col h-full animate-in slide-in-from-right-4 duration-200">
          <div className="px-4 py-2">
            <p className="text-white/50 text-[13px] text-center uppercase tracking-wide">Select Start Date</p>
          </div>
          <div className="flex-1 flex items-center justify-center p-4">
            <Calendar
              mode="single"
              selected={tempFilters.customDateStart}
              onSelect={(date) => {
                setTempFilters(prev => ({ ...prev, customDateStart: date }));
                setShowCustomDatePicker('end');
              }}
              className="pointer-events-auto bg-transparent [&_.rdp-day]:w-10 [&_.rdp-day]:h-10 [&_.rdp-cell]:text-center"
            />
          </div>
        </div>
      );
    }

    if (showCustomDatePicker === 'end') {
      return (
        <div className="flex flex-col h-full animate-in slide-in-from-right-4 duration-200">
          <div className="px-4 py-2">
            <p className="text-white/50 text-[13px] text-center uppercase tracking-wide">Select End Date</p>
          </div>
          <div className="flex-1 flex items-center justify-center p-4">
            <Calendar
              mode="single"
              selected={tempFilters.customDateEnd}
              onSelect={(date) => {
                setTempFilters(prev => ({ ...prev, customDateEnd: date }));
                setShowCustomDatePicker(null);
                setCurrentScreen('main');
              }}
              disabled={(date) => tempFilters.customDateStart ? date < tempFilters.customDateStart : false}
              className="pointer-events-auto bg-transparent [&_.rdp-day]:w-10 [&_.rdp-day]:h-10 [&_.rdp-cell]:text-center"
            />
          </div>
        </div>
      );
    }

    return (
      <ScrollArea className="flex-1 animate-in slide-in-from-right-4 duration-200">
        <div className="px-4">
          <div className="rounded-[10px] bg-white/[0.06] overflow-hidden">
            {datePresets.map((preset, index) => (
              <button
                key={preset.value}
                onClick={() => {
                  if (preset.value === 'custom') {
                    setTempFilters(prev => ({ ...prev, datePreset: 'custom' }));
                    setShowCustomDatePicker('start');
                  } else {
                    setTempFilters(prev => ({ 
                      ...prev, 
                      datePreset: preset.value,
                      customDateStart: undefined,
                      customDateEnd: undefined 
                    }));
                    setCurrentScreen('main');
                  }
                }}
                className={`w-full flex items-center justify-between py-[11px] px-4 active:bg-white/[0.08] transition-colors duration-100 ${index < datePresets.length - 1 ? 'border-b border-white/[0.08]' : ''}`}
              >
                <span className="text-white text-[17px] leading-[22px]">{preset.label}</span>
                {tempFilters.datePreset === preset.value && (
                  <Check className="w-5 h-5 text-white" strokeWidth={2.5} />
                )}
              </button>
            ))}
          </div>
        </div>
      </ScrollArea>
    );
  };

  const getScreenTitle = () => {
    switch (currentScreen) {
      case 'revenue-center': return 'Revenue Center';
      case 'date': return showCustomDatePicker === 'start' ? 'Start Date' : showCustomDatePicker === 'end' ? 'End Date' : 'Date';
      case 'employee': return 'Employee';
      case 'order-type': return 'Order Type';
      case 'order-status': return 'Order Status';
      case 'payment-type': return 'Payment Type';
      default: return 'Filters';
    }
  };

  const handleBackPress = () => {
    if (showCustomDatePicker === 'end') {
      setShowCustomDatePicker('start');
    } else if (showCustomDatePicker === 'start') {
      setShowCustomDatePicker(null);
    } else {
      setCurrentScreen('main');
      setSearchQuery("");
    }
  };

  const isSubScreen = currentScreen !== 'main' || showCustomDatePicker;

  return (
    <Drawer open={isOpen} onOpenChange={handleOpenChange}>
      <DrawerContent 
        className="border-0 max-h-[85vh] rounded-t-[14px]"
        style={{ 
          background: 'rgba(28, 28, 30, 0.85)',
          backdropFilter: 'blur(40px)',
          WebkitBackdropFilter: 'blur(40px)'
        }}
      >
        {/* iOS-style Header */}
        <div className="relative flex items-center justify-center h-[44px] border-b border-white/[0.08]">
          {/* Left action - only show Back button on sub screens */}
          <div className="absolute left-0 top-0 h-full flex items-center pl-4">
            {isSubScreen && (
              <button 
                onClick={handleBackPress}
                className="flex items-center text-white active:opacity-50 transition-opacity duration-100"
              >
                <ChevronLeft className="w-[22px] h-[22px] -ml-1" strokeWidth={2} />
                <span className="text-[17px]">Back</span>
              </button>
            )}
          </div>
          
          {/* Center title */}
          <span className="text-white text-[17px] font-semibold">
            {getScreenTitle()}
          </span>
          
          {/* Right spacer */}
          <div className="absolute right-0 top-0 h-full flex items-center pr-4 w-16" />
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-hidden" style={{ maxHeight: 'calc(85vh - 160px)' }}>
          {currentScreen === 'main' && !showCustomDatePicker && (
            <ScrollArea className="h-full">
              <div className="px-4 pt-3 pb-2">
                <div className="rounded-[10px] bg-white/[0.06] overflow-hidden">
                  <FilterRow
                    label="Revenue Center"
                    value={tempFilters.revenueCenter}
                    onPress={() => setCurrentScreen('revenue-center')}
                  />
                  <FilterRow
                    label="Date"
                    value={getDateDisplayValue()}
                    onPress={() => setCurrentScreen('date')}
                  />
                  <FilterRow
                    label="Employee"
                    value={tempFilters.employee}
                    onPress={() => setCurrentScreen('employee')}
                  />
                  <FilterRow
                    label="Order Type"
                    value={tempFilters.orderType}
                    onPress={() => setCurrentScreen('order-type')}
                  />
                  <FilterRow
                    label="Order Status"
                    value={tempFilters.orderStatus}
                    onPress={() => setCurrentScreen('order-status')}
                  />
                  <FilterRow
                    label="Payment Type"
                    value={tempFilters.paymentType}
                    onPress={() => setCurrentScreen('payment-type')}
                    isLast
                  />
                </div>
              </div>
            </ScrollArea>
          )}

          {currentScreen === 'revenue-center' && (
            <SelectionList
              items={options.revenueCenters}
              selectedValue={tempFilters.revenueCenter}
              onSelect={(value) => setTempFilters(prev => ({ ...prev, revenueCenter: value }))}
              allLabel="All Revenue Centers"
              searchable
            />
          )}

          {currentScreen === 'date' && <DateSelectionScreen />}

          {currentScreen === 'employee' && (
            <SelectionList
              items={options.employees}
              selectedValue={tempFilters.employee}
              onSelect={(value) => setTempFilters(prev => ({ ...prev, employee: value }))}
              allLabel="All Employees"
              searchable
            />
          )}

          {currentScreen === 'order-type' && (
            <SelectionList
              items={options.orderTypes}
              selectedValue={tempFilters.orderType}
              onSelect={(value) => setTempFilters(prev => ({ ...prev, orderType: value }))}
              allLabel="All Order Types"
              showIcons
            />
          )}

          {currentScreen === 'order-status' && (
            <SelectionList
              items={options.orderStatuses}
              selectedValue={tempFilters.orderStatus}
              onSelect={(value) => setTempFilters(prev => ({ ...prev, orderStatus: value }))}
              allLabel="All Statuses"
            />
          )}

          {currentScreen === 'payment-type' && (
            <SelectionList
              items={options.paymentTypes}
              selectedValue={tempFilters.paymentType}
              onSelect={(value) => setTempFilters(prev => ({ ...prev, paymentType: value }))}
              allLabel="All Payment Types"
            />
          )}
        </div>

        {/* iOS-style Footer - only show on main screen */}
        {currentScreen === 'main' && !showCustomDatePicker && (
          <div className="px-4 pt-2 pb-8 space-y-3">
            {/* Apply button - primary action */}
            <button
              onClick={handleApply}
              className="w-full h-[50px] rounded-[12px] text-black text-[17px] font-semibold active:scale-[0.98] active:opacity-90 transition-all duration-100"
              style={{ background: 'linear-gradient(180deg, #FFFFFF 0%, #E5E5E5 100%)' }}
            >
              Apply
            </button>
            
            {/* Clear All - text-only secondary action */}
            {hasActiveFilters && (
              <button
                onClick={handleClearAll}
                className="w-full h-[44px] text-white/60 text-[17px] active:text-white/40 transition-colors duration-100"
              >
                Clear All
              </button>
            )}
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
};

export default MobileFiltersSheet;
export type { MobileFiltersState };
