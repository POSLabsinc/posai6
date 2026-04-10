import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar as CalendarIcon, ChevronLeft, Clock, Loader2 } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { format } from "date-fns";
import ManagerPinScreen from "@/components/ManagerPinScreen";
import BottomNavigation from "@/components/BottomNavigation";
import settingsReportsIcon from "@/assets/icons/settings-reports.png";
import { InlineDatePicker } from "@/components/ui/inline-date-picker";
import { InlineTimePicker } from "@/components/ui/inline-time-picker";
import { cn } from "@/lib/utils";
import { useAppearance } from "@/contexts/AppearanceContext";
import { useReportsData } from "@/hooks/useReportsData";

interface ReportsContentProps {
  showHeader?: boolean;
  onBack?: () => void;
  onAIClick?: () => void;
}

const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const hour = Math.floor(i / 2);
  const minute = i % 2 === 0 ? "00" : "30";
  const ampm = hour < 12 ? "AM" : "PM";
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return { label: `${displayHour}:${minute} ${ampm}`, value: `${String(hour).padStart(2, "0")}:${minute}` };
});

const ChevronRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
);

const ReportsContent = ({ showHeader = true, onBack, onAIClick }: ReportsContentProps) => {
  const [authenticated, setAuthenticated] = useState(false);
  const isMobile = useIsMobile();
  const { getIconBgColor } = useAppearance();
  const navigate = useNavigate();
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [startTime, setStartTime] = useState("12:00 AM");
  const [endTime, setEndTime] = useState("11:30 PM");
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  const startDateRef = useRef<HTMLButtonElement>(null);
  const endDateRef = useRef<HTMLButtonElement>(null);
  const startTimeRef = useRef<HTMLButtonElement>(null);
  const endTimeRef = useRef<HTMLButtonElement>(null);

  const getPickerPosition = (ref: React.RefObject<HTMLButtonElement>) => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      return { top: rect.bottom + 4, right: window.innerWidth - rect.right };
    }
    return { top: 0, right: 0 };
  };

  const fmtCurrency = (val: number) => `£${val.toFixed(2)}`;

  // Convert 12h time format to 24h for the hook
  const to24h = (time12: string) => {
    const match = time12.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!match) return "00:00";
    let h = parseInt(match[1]);
    const m = match[2];
    const period = match[3].toUpperCase();
    if (period === "AM" && h === 12) h = 0;
    else if (period === "PM" && h !== 12) h += 12;
    return `${String(h).padStart(2, "0")}:${m}`;
  };

  const { orderSummary: data, paymentTypes, categories, loading, error } = useReportsData(startDate, endDate, to24h(startTime), to24h(endTime));

  if (!authenticated) {
    return (
      <div className="relative h-full w-full">
        <div className="fixed md:absolute inset-0 bg-background/90 dark:bg-black/90 z-50 flex flex-col md:items-center md:justify-center">
          <div className="md:hidden flex items-center px-4 py-3 shrink-0">
            <button
              onClick={() => { if (onBack) onBack(); else navigate('/settings'); }}
              className="w-10 h-10 rounded-full bg-muted flex items-center justify-center active:opacity-70 transition-opacity"
            >
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <ManagerPinScreen onSuccess={() => setAuthenticated(true)} />
          </div>
          <div className="md:hidden shrink-0">
            <BottomNavigation />
          </div>
        </div>
      </div>
    );
  }

  const handleBack = () => {
    if (onBack) onBack();
    else navigate('/settings');
  };


  const orderSummary = [
    { label: "Number of Order", value: String(data.numberOfOrders) },
    { label: "Number of Refund", value: String(data.numberOfRefunds) },
    { label: "Refund", value: fmtCurrency(data.refundAmount) },
    { label: "Net Sales", value: fmtCurrency(data.netSales) },
    { label: "Discounts", value: fmtCurrency(data.discounts) },
    { label: "Tips", value: fmtCurrency(data.tips) },
    { label: "Tax", value: fmtCurrency(data.tax) },
    { label: "Total", value: fmtCurrency(data.total) },
  ];

  const fieldRow = (label: string, icon: React.ReactNode, display: string, onClick: () => void, ref: React.RefObject<HTMLButtonElement>) => (
    <button
      ref={ref}
      className="w-full flex items-center justify-between py-3.5 px-4 bg-surface"
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        {icon}
        <span className="text-foreground text-sm font-medium">{label}</span>
      </div>
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <span className="text-sm">{display}</span>
        <ChevronRight />
      </div>
    </button>
  );

  const calIcon = <CalendarIcon size={16} className="text-muted-foreground" />;
  const clockIcon = <Clock size={16} className="text-muted-foreground" />;
  const divider = <div className="h-px bg-border mx-4" />;

  return (
    <div className="relative h-full">
      <div className={`${showHeader ? 'pt-0' : 'pt-0'} px-6 pb-28`}>
        {/* Header card with background */}
        <div className="bg-card rounded-2xl flex flex-col items-start py-8 px-6 mb-6">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-3" style={{ backgroundColor: getIconBgColor('#606060') }}>
            <img src={settingsReportsIcon} alt="Reports" className="w-7 h-7 object-contain" />
          </div>
          <h2 className="text-foreground text-lg font-semibold">Reports & Analytics</h2>
          <p className="text-muted-foreground text-sm mt-1 w-full">Concise overview of key sales metrics, including revenue, units sold, and trends over a specified period.</p>
        </div>


        {/* Date & Time Filters */}
        <div className="mb-6">
          <h3 className="text-xs font-medium text-muted-foreground tracking-wider mb-3">Date & Time Range</h3>
          <div className="bg-card rounded-2xl overflow-hidden">
            {fieldRow("Start Date", calIcon, format(startDate, "dd/MM/yyyy"), () => setShowStartDatePicker(true), startDateRef)}
            {divider}
            {fieldRow("End Date", calIcon, format(endDate, "dd/MM/yyyy"), () => setShowEndDatePicker(true), endDateRef)}
            {divider}
            {fieldRow("Start Time", clockIcon, startTime, () => setShowStartTimePicker(true), startTimeRef)}
            {divider}
            {fieldRow("End Time", clockIcon, endTime, () => setShowEndTimePicker(true), endTimeRef)}
          </div>
        </div>

        {/* Inline Pickers */}
        <InlineDatePicker
          isOpen={showStartDatePicker}
          onClose={() => setShowStartDatePicker(false)}
          selectedDate={startDate}
          onDateChange={setStartDate}
          position={getPickerPosition(startDateRef)}
        />
        <InlineDatePicker
          isOpen={showEndDatePicker}
          onClose={() => setShowEndDatePicker(false)}
          selectedDate={endDate}
          onDateChange={setEndDate}
          position={getPickerPosition(endDateRef)}
        />
        <InlineTimePicker
          isOpen={showStartTimePicker}
          onClose={() => setShowStartTimePicker(false)}
          selectedTime={startTime}
          onTimeChange={setStartTime}
          position={getPickerPosition(startTimeRef)}
        />
        <InlineTimePicker
          isOpen={showEndTimePicker}
          onClose={() => setShowEndTimePicker(false)}
          selectedTime={endTime}
          onTimeChange={setEndTime}
          position={getPickerPosition(endTimeRef)}
        />

        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground text-sm">Loading reports...</span>
          </div>
        )}

        {error && (
          <div className="bg-destructive/10 rounded-2xl p-4 mb-6">
            <p className="text-destructive text-sm">Error loading reports: {error}</p>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Order Summary */}
            <div className="mb-6">
              <h3 className="text-xs font-medium text-muted-foreground tracking-wider mb-3">Order Summary</h3>
              <div className="bg-card rounded-2xl overflow-hidden">
                {orderSummary.map((item, i) => (
                  <div key={item.label}>
                    {i > 0 && <div className="h-px bg-border mx-4" />}
                    <div className="flex items-center justify-between py-3.5 px-4 bg-surface">
                      <span className="text-muted-foreground text-sm">{item.label}</span>
                      <span className={cn("text-sm font-medium", item.label === "Total" ? "text-foreground" : "text-muted-foreground")}>{item.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sales by Payment Type */}
            <div className="mb-6">
              <h3 className="text-xs font-medium text-muted-foreground tracking-wider mb-3">Sales By Payment Type</h3>
              <div className="bg-card rounded-2xl overflow-hidden">
                <div className="flex items-center py-3 px-4 border-b border-border">
                  <span className="flex-1 text-xs font-semibold text-foreground">Payment Type</span>
                  <span className="w-32 text-center text-xs font-semibold text-foreground">Transactions</span>
                  <span className="w-28 text-right text-xs font-semibold text-foreground">Total Amount</span>
                </div>
                {paymentTypes.length === 0 && (
                  <div className="py-4 px-4 text-center text-muted-foreground text-sm">No transactions found</div>
                )}
                {paymentTypes.map((item, i) => (
                  <div key={item.type}>
                    {i > 0 && <div className="h-px bg-border mx-4" />}
                    <div className="flex items-center py-3.5 px-4 bg-surface">
                      <span className="flex-1 text-sm text-muted-foreground">{item.type}</span>
                      <span className="w-32 text-center text-sm text-muted-foreground">{item.transactions}</span>
                      <span className="w-28 text-right text-sm font-medium text-muted-foreground">{fmtCurrency(item.amount)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sales by Category */}
            <div className="mb-6">
              <h3 className="text-xs font-medium text-muted-foreground tracking-wider mb-3">Sales By Category</h3>
              <div className="bg-card rounded-2xl overflow-hidden">
                <div className="flex items-center py-3 px-4 border-b border-border">
                  <span className="flex-1 text-xs font-semibold text-foreground">Category</span>
                  <span className="w-32 text-center text-xs font-semibold text-foreground">Products</span>
                  <span className="w-28 text-right text-xs font-semibold text-foreground">Net Sales</span>
                </div>
                {categories.length === 0 && (
                  <div className="py-4 px-4 text-center text-muted-foreground text-sm">No categories found</div>
                )}
                {categories.map((item, i) => (
                  <div key={item.name}>
                    {i > 0 && <div className="h-px bg-border mx-4" />}
                    <div className="flex items-center py-3.5 px-4 bg-surface">
                      <span className="flex-1 text-sm text-muted-foreground">{item.name}</span>
                      <span className="w-32 text-center text-sm text-muted-foreground">{item.products}</span>
                      <span className="w-28 text-right text-sm font-medium text-muted-foreground">{fmtCurrency(item.sales)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ReportsContent;
