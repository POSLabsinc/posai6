import { useState } from "react";
import { ChevronLeft, ChevronRight, ClipboardList, DoorOpen, Users, Wallet, AlertTriangle } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";
import AnimatedAIIcon from "@/components/AnimatedAIIcon";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import ManagerPinScreen from "@/components/ManagerPinScreen";
import BottomNavigation from "@/components/BottomNavigation";
import endOfDayIcon from "@/assets/icons/end-of-day.png";
import { AppleWheelTimePicker } from "@/components/ui/apple-wheel-time-picker";
import { MultiSelectSheet } from "@/components/ui/multi-select-sheet";

const DEVICES = ["POS 1.1", "POS 1.2", "POS 2.1", "POS 2.2", "POS 3.1"];
const EMPLOYEES = ["John Smith", "Jane Doe", "Mike Johnson", "Sarah Williams", "David Brown", "Emily Davis", "Chris Wilson", "Amanda Taylor"];

interface EndOfDayContentProps {
  showHeader?: boolean;
  onBack?: () => void;
  onAIClick?: () => void;
}

const SUMMARY_STATS = [
  { label: "Total Number of Labor Hours", value: "00 hrs : 05 mins" },
  { label: "Total Number of Orders Today", value: "48" },
  { label: "Today's Sales", value: "£303.77" },
];

const THINGS_TO_DO = [
  { icon: ClipboardList, label: "Unpaid Checks", count: 8 },
  { icon: DoorOpen, label: "Open Checks", count: 37 },
  { icon: Users, label: "Clocked In Employees", count: 1 },
  { icon: Wallet, label: "Cash Drawer Activity", count: 0 },
];

const EndOfDayContent = ({ showHeader = true, onBack, onAIClick }: EndOfDayContentProps) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { toast } = useToast();
  const unpaidChecksCount = THINGS_TO_DO.find(item => item.label === "Unpaid Checks")?.count ?? 0;
  const hasUnpaidChecks = unpaidChecksCount > 0;

  const handleCloseRestaurant = () => {
    if (hasUnpaidChecks) {
      toast({
        title: "Cannot Close Restaurant",
        description: `There are ${unpaidChecksCount} unpaid checks. All checks must be fully paid before closing.`,
        variant: "destructive",
      });
      return;
    }
    // Proceed with closing
  };
  const [authenticated, setAuthenticated] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [endOfDayReminder, setEndOfDayReminder] = useState(false);
  const [runEndOfDay, setRunEndOfDay] = useState(false);
  const [clockOutEmployees, setClockOutEmployees] = useState(false);
  const [closeCashDrawer, setCloseCashDrawer] = useState(false);
  const [closePaidOrders, setClosePaidOrders] = useState(false);
  const [cancelUnpaidTickets, setCancelUnpaidTickets] = useState(false);
  const [printReport, setPrintReport] = useState(false);
  const [includeEmployeeData, setIncludeEmployeeData] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState("POS 1.2");
  const [showDevicePicker, setShowDevicePicker] = useState(false);
  const [autoEndOfDayTime, setAutoEndOfDayTime] = useState("11:00 PM");
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [autoRunTime, setAutoRunTime] = useState("11:00 PM");
  const [showAutoRunTimePicker, setShowAutoRunTimePicker] = useState(false);
  const [showEmployeePicker, setShowEmployeePicker] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);

  if (showSummary) {
    return (
      <div className="relative flex flex-col h-full bg-background">
        <div className="flex-1 overflow-y-auto pt-6 px-6 pb-28">
          {/* Back button */}
          <button
            onClick={() => setShowSummary(false)}
            className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-6"
          >
            <ChevronLeft size={20} className="text-foreground" />
          </button>

          {/* Header */}
          <div className="bg-card rounded-2xl p-6 mb-6 flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3" style={{ backgroundColor: "#7300FF" }}>
              <img src={endOfDayIcon} alt="End of Day" className="w-8 h-8" />
            </div>
            <h2 className="text-foreground text-lg font-semibold">End of Day Summary</h2>
            <p className="text-muted-foreground text-sm text-center mt-1">
              Review the summary below before closing the restaurant.
            </p>
          </div>

          {/* Stats cards */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {SUMMARY_STATS.map((stat) => (
              <div
                key={stat.label}
                className="bg-card rounded-2xl p-4 flex flex-col items-center text-center"
              >
                <span className="text-muted-foreground text-xs font-medium mb-2 leading-tight">{stat.label}</span>
                <span className="text-foreground text-base font-semibold">{stat.value}</span>
              </div>
            ))}
          </div>

          {/* Things to do */}
          <p className="text-muted-foreground text-sm mb-3 px-2">Things to do</p>
          <div className="bg-card rounded-2xl overflow-hidden mb-6">
            {THINGS_TO_DO.map((item, index) => (
              <div key={item.label}>
                <button className="w-full flex items-center justify-between py-3.5 px-4">
                  <div className="flex items-center gap-3">
                    <item.icon size={18} className="text-muted-foreground" />
                    <span className="text-foreground text-base">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground text-sm">{item.count}</span>
                    <ChevronRight size={18} className="text-muted-foreground" />
                  </div>
                </button>
                {index < THINGS_TO_DO.length - 1 && <div className="h-px bg-border mx-4" />}
              </div>
            ))}
          </div>

          {/* Close Restaurant button */}
          {hasUnpaidChecks && (
            <div className="flex items-center gap-2 bg-red-500/10 rounded-full py-3 px-4 mb-3">
              <AlertTriangle size={16} className="text-red-400 shrink-0" />
              <span className="text-red-400 text-sm">All unpaid checks must be settled before closing.</span>
            </div>
          )}
          <button
            onClick={handleCloseRestaurant}
            className={`w-full rounded-full py-3.5 px-4 text-base font-semibold transition-all ${
              hasUnpaidChecks
                ? "border border-border bg-muted text-muted-foreground cursor-not-allowed"
                : "border border-border bg-foreground text-background active:opacity-80"
            }`}
          >
            CLOSE RESTAURANT
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col h-full bg-background">
      <div className="flex-1 overflow-y-auto pt-6 px-6 pb-28">
        {/* Header card */}
        <div className={`bg-card rounded-2xl p-6 mb-4 flex flex-col ${isMobile ? 'items-start' : 'items-center'}`}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3" style={{ backgroundColor: "#7300FF" }}>
            <img src={endOfDayIcon} alt="End of Day" className="w-8 h-8" />
          </div>
          <h2 className="text-foreground text-lg font-semibold">End of Day</h2>
          <p className={`text-muted-foreground text-sm ${isMobile ? '' : 'text-center'} mt-1`}>
            Easily manage your end-of-day tasks with automated tools. Close orders, clock out employees, settle the cash drawer, and generate detailed reports in one seamless process.
          </p>
        </div>

        {/* AI Assistant Icon - hidden on mobile (shown in page wrapper) */}
        <div className="hidden md:flex justify-end mb-3 overflow-visible">
          <AnimatedAIIcon size={24} onClick={onAIClick || (() => navigate('/settings/ai'))} />
        </div>

        {/* Start End Of Day button */}
        <button
          onClick={() => setShowSummary(true)}
          className="w-full border border-border bg-transparent rounded-full py-3.5 px-4 text-foreground text-base font-medium mb-6 active:bg-accent transition-colors"
        >
          Start End Of Day
        </button>

        {/* End Of Day Device */}
        <button
          onClick={() => setShowDevicePicker(true)}
          className="w-full bg-card rounded-full py-3.5 px-4 flex items-center justify-between mb-6"
        >
          <span className="text-foreground text-base">End Of Day Device</span>
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground text-sm">{selectedDevice}</span>
            <ChevronRight size={18} className="text-muted-foreground" />
          </div>
        </button>

        {/* Schedule & Reminders */}
        <p className="text-muted-foreground text-sm mb-3 px-2">Schedule & Reminders</p>
        <div className={`bg-card ${endOfDayReminder ? 'rounded-2xl' : 'rounded-full'} overflow-hidden mb-1`}>
          <div className="py-3.5 px-4 flex items-center justify-between">
            <span className="text-foreground text-base">End Of Day Reminder</span>
            <Switch checked={endOfDayReminder} onCheckedChange={setEndOfDayReminder} />
          </div>
          {endOfDayReminder && (
            <>
              <div className="h-px bg-border mx-4" />
              <button
                onClick={() => setShowTimePicker(true)}
                className="w-full flex items-center justify-between py-3.5 px-4"
              >
                <span className="text-foreground text-base">Auto End of Day Time</span>
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground text-sm">{autoEndOfDayTime}</span>
                  <ChevronRight size={18} className="text-muted-foreground" />
                </div>
              </button>
            </>
          )}
        </div>
        <p className="text-muted-foreground text-xs px-4 mb-6">Set up reminders to notify you when it's time to run your end-of-day process.</p>

        {/* Automatic Actions */}
        {/* Run End Of Day - separate section */}
        <p className="text-muted-foreground text-sm mb-3 px-2">Automatic Actions</p>
        <div className={`bg-card ${runEndOfDay ? 'rounded-2xl' : 'rounded-full'} overflow-hidden mb-1`}>
          <div className="py-3.5 px-4 flex items-center justify-between">
            <span className="text-foreground text-base">Run End Of Day</span>
            <Switch checked={runEndOfDay} onCheckedChange={setRunEndOfDay} />
          </div>
          {runEndOfDay && (
            <>
              <div className="h-px bg-border mx-4" />
              <button
                onClick={() => setShowAutoRunTimePicker(true)}
                className="w-full flex items-center justify-between py-3.5 px-4"
              >
                <span className="text-foreground text-base">Auto Run End of Day</span>
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground text-sm">{autoRunTime}</span>
                  <ChevronRight size={18} className="text-muted-foreground" />
                </div>
              </button>
            </>
          )}
        </div>
        <p className="text-muted-foreground text-xs px-4 mt-1.5 mb-6">
          Automatically run the end-of-day process, including closing reports and daily summaries. This helps finalise sales and prepare the system for the next business day.
        </p>

        {/* Other Automatic Actions */}
        <div className="bg-card rounded-2xl overflow-hidden mb-6">
          {[
            { label: "Clock Out Employees", value: clockOutEmployees, setter: setClockOutEmployees },
            { label: "Close Cash Drawer", value: closeCashDrawer, setter: setCloseCashDrawer },
            { label: "Close Paid Orders", value: closePaidOrders, setter: setClosePaidOrders },
            { label: "Cancel Unpaid Tickets", value: cancelUnpaidTickets, setter: setCancelUnpaidTickets },
          ].map((item, index, arr) => (
            <div key={item.label}>
              <div className="flex items-center justify-between py-3.5 px-4">
                <span className="text-foreground text-base">{item.label}</span>
                <Switch checked={item.value} onCheckedChange={item.setter} />
              </div>
              {index < arr.length - 1 && <div className="h-px bg-border mx-4" />}
            </div>
          ))}
        </div>

        {/* Reports & Printing */}
        <p className="text-muted-foreground text-sm mb-3 px-2">Reports & Printing</p>
        <div className="bg-card rounded-2xl overflow-hidden mb-6">
          <div className="flex items-center justify-between py-3.5 px-4">
            <span className="text-foreground text-base">Print End Of Day Report</span>
            <Switch checked={printReport} onCheckedChange={setPrintReport} />
          </div>
           <div className="h-px bg-border mx-4" />
          <div className="flex items-center justify-between py-3.5 px-4">
            <span className="text-foreground text-base">Include Employee Data</span>
            <Switch checked={includeEmployeeData} onCheckedChange={setIncludeEmployeeData} />
          </div>
          <div className="h-px bg-border mx-4" />
          <button onClick={() => setShowEmployeePicker(true)} className="w-full flex items-center justify-between py-3.5 px-4">
            <span className="text-foreground text-base">Send Daily Reports</span>
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground text-sm">{selectedEmployees.length > 0 ? `${selectedEmployees.length} Selected` : "Select"}</span>
              <ChevronRight size={18} className="text-muted-foreground" />
            </div>
        </button>
        </div>
        <p className="text-muted-foreground text-xs px-4 mb-6">Automatically generate and distribute end-of-day reports to selected recipients.</p>
      </div>

      {/* PIN overlay */}
      {!authenticated && (
        <div className="fixed md:absolute inset-0 bg-background/70 dark:bg-black/70 md:bg-background/70 md:dark:bg-black/70 md:backdrop-blur-sm z-50 flex flex-col md:items-center md:justify-center md:rounded-2xl">
          {/* Mobile back arrow */}
          <div className="md:hidden flex items-center px-4 py-3 shrink-0">
            <button
              onClick={() => navigate('/settings')}
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
      )}

      {/* Device Picker Dialog */}
      <MultiSelectSheet
        isOpen={showDevicePicker}
        onClose={(items) => {
          if (items.length > 0) setSelectedDevice(items[0]);
          setShowDevicePicker(false);
        }}
        initialSelected={[selectedDevice]}
        options={DEVICES}
        title="Select Device"
        singleSelect
      />

      {/* Time Picker */}
      <AppleWheelTimePicker
        isOpen={showTimePicker}
        onClose={() => setShowTimePicker(false)}
        onConfirm={(time) => {
          setAutoEndOfDayTime(time);
          setShowTimePicker(false);
        }}
        selectedTime={autoEndOfDayTime}
      />
      {/* Auto Run End of Day Time Picker */}
      <AppleWheelTimePicker
        isOpen={showAutoRunTimePicker}
        onClose={() => setShowAutoRunTimePicker(false)}
        onConfirm={(time) => {
          setAutoRunTime(time);
          setShowAutoRunTimePicker(false);
        }}
        selectedTime={autoRunTime}
      />
      <MultiSelectSheet
        isOpen={showEmployeePicker}
        onClose={(items) => {
          setSelectedEmployees(items);
          setShowEmployeePicker(false);
        }}
        initialSelected={selectedEmployees}
        options={EMPLOYEES}
        title="Send Daily Reports To"
      />
    </div>
  );
};

export default EndOfDayContent;
