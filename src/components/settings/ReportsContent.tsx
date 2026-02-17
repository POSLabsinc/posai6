import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar as CalendarIcon, ChevronLeft, Clock } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { format } from "date-fns";
import ManagerPinScreen from "@/components/ManagerPinScreen";
import BottomNavigation from "@/components/BottomNavigation";
import settingsReportsIcon from "@/assets/icons/settings-reports.png";
import AnimatedAIIcon from "@/components/AnimatedAIIcon";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

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
  const navigate = useNavigate();
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [startTime, setStartTime] = useState("00:00");
  const [endTime, setEndTime] = useState("23:30");
  const [openPicker, setOpenPicker] = useState<string | null>(null);

  if (!authenticated) {
    return (
      <div className="relative h-full w-full">
        <div className="fixed md:absolute inset-0 bg-background/90 dark:bg-black/70 z-50 flex flex-col md:items-center md:justify-center">
          {/* Mobile back arrow */}
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
          {/* Mobile bottom navigation */}
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

  const fmtTime = (v: string) => TIME_OPTIONS.find((t) => t.value === v)?.label ?? v;

  const orderSummary = [
    { label: "Number of Order", value: "6" },
    { label: "Number of Refund", value: "0" },
    { label: "Refund", value: "£0.0" },
    { label: "Net Sales", value: "£77.79" },
    { label: "Discounts", value: "£0.0" },
    { label: "Tips", value: "£0.00" },
    { label: "Tax", value: "£0.0" },
    { label: "Total", value: "£77.79" },
  ];

  const paymentTypes = [{ type: "Cash", transactions: "6.0", amount: "£77.79" }];
  const categories = [
    { name: "Café", products: "30.5", sales: "£136.66" },
    { name: "Azuque Frio", products: "2.0", sales: "£13.09" },
  ];

  const dateRow = (label: string, icon: React.ReactNode, display: string, pickerKey: string) => (
    <Popover open={openPicker === pickerKey} onOpenChange={(o) => setOpenPicker(o ? pickerKey : null)}>
      <PopoverTrigger asChild>
        <button className="w-full flex items-center justify-between py-3.5 px-4">
          <div className="flex items-center gap-3">
            {icon}
            <span className="text-foreground text-sm font-medium">{label}</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <span className="text-sm">{display}</span>
            <ChevronRight />
          </div>
        </button>
      </PopoverTrigger>
      {pickerKey === "startDate" && (
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar mode="single" selected={startDate} onSelect={(d) => { if (d) setStartDate(d); setOpenPicker(null); }} initialFocus className={cn("p-3 pointer-events-auto")} />
        </PopoverContent>
      )}
      {pickerKey === "endDate" && (
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar mode="single" selected={endDate} onSelect={(d) => { if (d) setEndDate(d); setOpenPicker(null); }} initialFocus className={cn("p-3 pointer-events-auto")} />
        </PopoverContent>
      )}
      {(pickerKey === "startTime" || pickerKey === "endTime") && (
        <PopoverContent className="w-48 p-0 max-h-60 overflow-y-auto" align="end">
          {TIME_OPTIONS.map((t) => (
            <button
              key={t.value}
              onClick={() => {
                if (pickerKey === "startTime") setStartTime(t.value);
                else setEndTime(t.value);
                setOpenPicker(null);
              }}
              className={cn(
                "w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-accent",
                (pickerKey === "startTime" ? startTime : endTime) === t.value
                  ? "bg-accent text-accent-foreground font-medium"
                  : "text-foreground"
              )}
            >
              {t.label}
            </button>
          ))}
        </PopoverContent>
      )}
    </Popover>
  );

  const calIcon = <CalendarIcon size={16} className="text-muted-foreground" />;
  const clockIcon = <Clock size={16} className="text-muted-foreground" />;
  const divider = <div className="h-px bg-border mx-4" />;

  return (
    <div className="relative h-full">
      <div className="pt-6 px-6 pb-28">
        {/* Header card with background */}
        <div className={`bg-card rounded-2xl flex flex-col ${isMobile ? 'items-start' : 'items-center text-center'} py-8 px-6 mb-6`}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-3" style={{ backgroundColor: '#606060' }}>
            <img src={settingsReportsIcon} alt="Reports" className="w-7 h-7 object-contain" />
          </div>
          <h2 className="text-foreground text-lg font-semibold">Reports & Analytics</h2>
          <p className="text-muted-foreground text-sm mt-1 max-w-md">Concise overview of key sales metrics, including revenue, units sold, and trends over a specified period.</p>
        </div>

        {/* AI Assistant Icon */}
        <div className="flex justify-end mb-3 overflow-visible">
          <AnimatedAIIcon size={24} onClick={onAIClick || (() => navigate('/settings/ai'))} />
        </div>

        {/* Date & Time Filters */}
        <div className="mb-6">
          <h3 className="text-xs font-medium text-muted-foreground tracking-wider uppercase mb-3">DATE & TIME RANGE</h3>
          <div className="bg-card rounded-2xl overflow-hidden">
            {dateRow("Start Date", calIcon, format(startDate, "dd/MM/yyyy"), "startDate")}
            {divider}
            {dateRow("End Date", calIcon, format(endDate, "dd/MM/yyyy"), "endDate")}
            {divider}
            {dateRow("Start Time", clockIcon, fmtTime(startTime), "startTime")}
            {divider}
            {dateRow("End Time", clockIcon, fmtTime(endTime), "endTime")}
          </div>
        </div>

        {/* Order Summary */}
        <div className="mb-6">
          <h3 className="text-xs font-medium text-muted-foreground tracking-wider uppercase mb-3">ORDER SUMMARY</h3>
          <div className="bg-card rounded-2xl overflow-hidden">
            {orderSummary.map((item, i) => (
              <div key={item.label}>
                {i > 0 && <div className="h-px bg-border mx-4" />}
                <div className="flex items-center justify-between py-3.5 px-4">
                  <span className="text-muted-foreground text-sm">{item.label}</span>
                  <span className={cn("text-sm font-medium", item.label === "Total" ? "text-foreground" : "text-muted-foreground")}>{item.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sales by Payment Type */}
        <div className="mb-6">
          <h3 className="text-xs font-medium text-muted-foreground tracking-wider uppercase mb-3">SALES BY PAYMENT TYPE</h3>
          <div className="bg-card rounded-2xl overflow-hidden">
            <div className="flex items-center py-3 px-4 border-b border-border">
              <span className="flex-1 text-xs font-semibold text-foreground">Payment Type</span>
              <span className="w-32 text-center text-xs font-semibold text-foreground">Transactions</span>
              <span className="w-28 text-right text-xs font-semibold text-foreground">Total Amount</span>
            </div>
            {paymentTypes.map((item, i) => (
              <div key={item.type}>
                {i > 0 && <div className="h-px bg-border mx-4" />}
                <div className="flex items-center py-3.5 px-4">
                  <span className="flex-1 text-sm text-muted-foreground">{item.type}</span>
                  <span className="w-32 text-center text-sm text-muted-foreground">{item.transactions}</span>
                  <span className="w-28 text-right text-sm font-medium text-muted-foreground">{item.amount}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sales by Category */}
        <div className="mb-6">
          <h3 className="text-xs font-medium text-muted-foreground tracking-wider uppercase mb-3">SALES BY CATEGORY</h3>
          <div className="bg-card rounded-2xl overflow-hidden">
            <div className="flex items-center py-3 px-4 border-b border-border">
              <span className="flex-1 text-xs font-semibold text-foreground">Category</span>
              <span className="w-32 text-center text-xs font-semibold text-foreground">Products</span>
              <span className="w-28 text-right text-xs font-semibold text-foreground">Net Sales</span>
            </div>
            {categories.map((item, i) => (
              <div key={item.name}>
                {i > 0 && <div className="h-px bg-border mx-4" />}
                <div className="flex items-center py-3.5 px-4">
                  <span className="flex-1 text-sm text-muted-foreground">{item.name}</span>
                  <span className="w-32 text-center text-sm text-muted-foreground">{item.products}</span>
                  <span className="w-28 text-right text-sm font-medium text-muted-foreground">{item.sales}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
};

export default ReportsContent;
