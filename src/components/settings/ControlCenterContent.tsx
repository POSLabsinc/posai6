import { ChevronRight, ChevronLeft, Lock } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { SettingsManager, ControlCenterSettings, DashboardMetricsVisibility } from "@/lib/settingsManager";
import { useAppearance, iconContainerSizeMap } from "@/contexts/AppearanceContext";
import SettingsIcon from "@/components/settings/SettingsIcon";
import { AppleWheelTimePicker } from "@/components/ui/apple-wheel-time-picker";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import AccessRestrictedModal from "@/components/AccessRestrictedModal";

// Import custom icons
import controlCenterIcon from "@/assets/icons/control-center.png";

interface ControlCenterContentProps {
  showHeader?: boolean;
  onNavigate?: (path: string) => void;
  onBack?: () => void;
  onAIClick?: () => void;
}

const autoLockOptions = [
  { value: "1", label: "1 Minute" },
  { value: "2", label: "2 Minutes" },
  { value: "5", label: "5 Minutes" },
  { value: "10", label: "10 Minutes" },
  { value: "15", label: "15 Minutes" },
  { value: "30", label: "30 Minutes" },
  { value: "never", label: "Never" },
];

const ControlCenterContent = ({ showHeader = true, onNavigate, onBack, onAIClick }: ControlCenterContentProps) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { getIconBgColor } = useAppearance();
  // Load initial state from SettingsManager
  const loadSettings = useCallback(() => SettingsManager.getControlCenterSettings(), []);
  
  const [restartApp, setRestartApp] = useState(() => loadSettings().restartApp);
  const [restartTime, setRestartTime] = useState(() => {
    const saved = loadSettings().restartTime;
    // Convert stored 12h format to 24h for internal use
    const match = saved?.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (match) {
      let h = parseInt(match[1]);
      const m = parseInt(match[2]);
      const p = match[3].toUpperCase();
      if (p === "AM" && h === 12) h = 0;
      else if (p === "PM" && h !== 12) h += 12;
      return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
    }
    return "00:00";
  });
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);
  const [pendingRestartValue, setPendingRestartValue] = useState(false);
  const timeRef = useRef<HTMLSpanElement>(null);
  const [timePickerPos, setTimePickerPos] = useState<{ top: number; left: number } | null>(null);
  const [autoLockTimer, setAutoLockTimer] = useState(() => loadSettings().autoLockTimer);
  const [showAutoLockDropdown, setShowAutoLockDropdown] = useState(false);
  const [switchToKDS, setSwitchToKDS] = useState(() => loadSettings().switchToKDS);
  const [kdsNotification, setKdsNotification] = useState(() => loadSettings().kdsNotification);
  const [debugMode, setDebugMode] = useState(() => loadSettings().debugMode);
  const [lockAfterFailed, setLockAfterFailed] = useState(() => loadSettings().lockAfterFailed);
  const [forceClockIn, setForceClockIn] = useState(() => loadSettings().forceClockIn);
  const [openRegisterWithoutPIN, setOpenRegisterWithoutPIN] = useState(() => loadSettings().openRegisterWithoutPIN);
  const [builtInDisplay, setBuiltInDisplay] = useState(() => loadSettings().builtInDisplay);
  const [hidePerformanceSummary, setHidePerformanceSummary] = useState(() => loadSettings().hidePerformanceSummary);
  const [hideBreakButton, setHideBreakButton] = useState(() => loadSettings().hideBreakButton);
  const [hideEmployeeFeedback, setHideEmployeeFeedback] = useState(() => loadSettings().hideEmployeeFeedback);
  const [hideSeatSelector, setHideSeatSelector] = useState(() => loadSettings().hideSeatSelector);
  const [resetTablesDaily, setResetTablesDaily] = useState(() => loadSettings().resetTablesDaily);
  const [enableWriteOff, setEnableWriteOff] = useState(() => loadSettings().enableWriteOff);
  const [dashboardMetrics, setDashboardMetrics] = useState<DashboardMetricsVisibility>(() => loadSettings().dashboardMetrics);
  const [showMetricsPinModal, setShowMetricsPinModal] = useState(false);
  const [pendingMetricToggle, setPendingMetricToggle] = useState<{ key: keyof DashboardMetricsVisibility; value: boolean } | null>(null);
  const [metricsUnlocked, setMetricsUnlocked] = useState(false);

  // Sync all settings when a settings-updated event is received
  useEffect(() => {
    const handleSettingsUpdate = (event: CustomEvent) => {
      const { type, data } = event.detail || {};
      if (type === 'controlCenter' && data) {
        const settings = data as ControlCenterSettings;
        setRestartApp(settings.restartApp);
        setAutoLockTimer(settings.autoLockTimer);
        setSwitchToKDS(settings.switchToKDS);
        setKdsNotification(settings.kdsNotification);
        setDebugMode(settings.debugMode);
        setLockAfterFailed(settings.lockAfterFailed);
        setForceClockIn(settings.forceClockIn);
        setOpenRegisterWithoutPIN(settings.openRegisterWithoutPIN);
        setBuiltInDisplay(settings.builtInDisplay);
        setHidePerformanceSummary(settings.hidePerformanceSummary);
        setHideBreakButton(settings.hideBreakButton);
        setHideEmployeeFeedback(settings.hideEmployeeFeedback);
        setHideSeatSelector(settings.hideSeatSelector);
        setResetTablesDaily(settings.resetTablesDaily);
        setEnableWriteOff(settings.enableWriteOff);
        setDashboardMetrics(settings.dashboardMetrics);
      }
    };

    window.addEventListener('settings-updated', handleSettingsUpdate as EventListener);
    return () => {
      window.removeEventListener('settings-updated', handleSettingsUpdate as EventListener);
    };
  }, []);

  // Persist settings changes to SettingsManager
  const updateSetting = useCallback((key: keyof ControlCenterSettings, value: any) => {
    SettingsManager.updateControlCenterSettings({ [key]: value });
  }, []);

  // Handler wrappers that persist changes
  const handleRestartAppChange = (value: boolean) => {
    if (value) {
      setPendingRestartValue(true);
      setShowRestartConfirm(true);
    } else {
      setRestartApp(false);
      updateSetting('restartApp', false);
    }
  };

  const confirmRestartEnable = () => {
    setRestartApp(true);
    updateSetting('restartApp', true);
    setShowRestartConfirm(false);
  };

  const handleAutoLockTimerChange = (value: string) => {
    setAutoLockTimer(value);
    updateSetting('autoLockTimer', value);
  };

  const handleSwitchToKDSChange = (value: boolean) => {
    setSwitchToKDS(value);
    updateSetting('switchToKDS', value);
  };

  const handleKdsNotificationChange = (value: boolean) => {
    setKdsNotification(value);
    updateSetting('kdsNotification', value);
  };

  const handleDebugModeChange = (value: boolean) => {
    setDebugMode(value);
    updateSetting('debugMode', value);
  };

  const handleLockAfterFailedChange = (value: boolean) => {
    setLockAfterFailed(value);
    updateSetting('lockAfterFailed', value);
  };

  const handleForceClockInChange = (value: boolean) => {
    setForceClockIn(value);
    updateSetting('forceClockIn', value);
  };

  const handleOpenRegisterWithoutPINChange = (value: boolean) => {
    setOpenRegisterWithoutPIN(value);
    updateSetting('openRegisterWithoutPIN', value);
  };

  const handleBuiltInDisplayChange = (value: boolean) => {
    setBuiltInDisplay(value);
    updateSetting('builtInDisplay', value);
  };

  const handleHidePerformanceSummaryChange = (value: boolean) => {
    setHidePerformanceSummary(value);
    updateSetting('hidePerformanceSummary', value);
    window.dispatchEvent(new CustomEvent('performanceSummaryVisibilityChanged', { detail: { hidden: value } }));
  };

  const handleHideBreakButtonChange = (value: boolean) => {
    setHideBreakButton(value);
    updateSetting('hideBreakButton', value);
  };

  const handleHideEmployeeFeedbackChange = (value: boolean) => {
    setHideEmployeeFeedback(value);
    updateSetting('hideEmployeeFeedback', value);
  };

  const handleHideSeatSelectorChange = (value: boolean) => {
    setHideSeatSelector(value);
    updateSetting('hideSeatSelector', value);
  };

  const handleResetTablesDailyChange = (value: boolean) => {
    setResetTablesDaily(value);
    updateSetting('resetTablesDaily', value);
  };

  const handleEnableWriteOffChange = (value: boolean) => {
    setEnableWriteOff(value);
    updateSetting('enableWriteOff', value);
  };

  const handleDashboardMetricToggle = (metric: keyof DashboardMetricsVisibility, value: boolean) => {
    if (metricsUnlocked) {
      const updated = { ...dashboardMetrics, [metric]: value };
      setDashboardMetrics(updated);
      updateSetting('dashboardMetrics', updated);
    } else {
      setPendingMetricToggle({ key: metric, value });
      setShowMetricsPinModal(true);
    }
  };

  const handleMetricsPinSuccess = () => {
    setShowMetricsPinModal(false);
    setMetricsUnlocked(true);
    if (pendingMetricToggle) {
      const updated = { ...dashboardMetrics, [pendingMetricToggle.key]: pendingMetricToggle.value };
      setDashboardMetrics(updated);
      updateSetting('dashboardMetrics', updated);
      setPendingMetricToggle(null);
    }
  };

  const autoLockDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (autoLockDropdownRef.current && !autoLockDropdownRef.current.contains(event.target as Node)) {
        setShowAutoLockDropdown(false);
      }
    };

    if (showAutoLockDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAutoLockDropdown]);

  const getAutoLockLabel = () => {
    const option = autoLockOptions.find(opt => opt.value === autoLockTimer);
    return option?.label || "30 Minutes";
  };

  const formatTime12 = (time24: string): string => {
    const [h, m] = time24.split(":").map(Number);
    const period = h >= 12 ? "PM" : "AM";
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${h12}:${m.toString().padStart(2, "0")} ${period}`;
  };

  const parse12to24 = (time12: string): string => {
    const match = time12.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!match) return "00:00";
    let h = parseInt(match[1]);
    const m = parseInt(match[2]);
    const period = match[3].toUpperCase();
    if (period === "AM" && h === 12) h = 0;
    else if (period === "PM" && h !== 12) h += 12;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  };

  // Position time picker dropdown below the time text
  useEffect(() => {
    if (!isMobile && showTimePicker && timeRef.current) {
      const rect = timeRef.current.getBoundingClientRect();
      setTimePickerPos({
        top: rect.bottom + 4,
        left: rect.right - 240,
      });
    } else if (isMobile || !showTimePicker) {
      setTimePickerPos(null);
    }
  }, [showTimePicker, isMobile]);

  const handleTimeConfirm = (time12: string) => {
    const time24 = parse12to24(time12);
    setRestartTime(time24);
    updateSetting('restartTime', time12);
    setShowTimePicker(false);
  };

  // Compute next restart display
  const getNextRestartDisplay = (): string | null => {
    if (!restartApp) return null;
    return formatTime12(restartTime);
  };

  const getLastRestartDisplay = (): string | null => {
    const settings = loadSettings();
    if (!settings.lastRestartTime) return null;
    const d = new Date(settings.lastRestartTime);
    return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  };
  return (
    <>
      <div className="h-full overflow-y-auto scrollbar-hide overscroll-contain">
        {/* Header */}
        {showHeader && (
          <div className="flex items-center justify-between pt-0 pb-2 relative overflow-visible px-4">
            {onBack && (
              <button
                onClick={onBack}
                className="w-10 h-10 rounded-full bg-neutral-800/60 flex items-center justify-center active:opacity-70 transition-opacity"
              >
                <ChevronLeft className="w-5 h-5 text-foreground" />
              </button>
            )}
            <h1 className="text-xl font-semibold text-foreground absolute left-1/2 -translate-x-1/2">Control center</h1>
          </div>
        )}

        {/* Content */}
        <div className={`${showHeader ? 'pt-2' : 'pt-0'} px-6 pb-8`}>

          {/* App Restart Section */}
          <p className="text-neutral-500 text-base font-medium mb-0.5 px-1">App Restart</p>
          
          <div className={`bg-neutral-800/60 overflow-hidden mb-2 transition-all duration-300 ${restartApp ? 'rounded-2xl' : 'rounded-full'}`}>
            <div className="flex items-center justify-between py-3 px-4">
              <div className="flex items-center gap-4">
                <SettingsIcon bgColor="#F97316">
                  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                    <path d="M3 3v5h5" />
                  </svg>
                </SettingsIcon>
                <span className="text-foreground text-lg font-medium">Restart App</span>
              </div>
              <Switch checked={restartApp} onCheckedChange={handleRestartAppChange} />
            </div>
            
            {/* Choose Time - only visible when Restart App is ON */}
            {restartApp && (
              <>
                <div className="h-px bg-neutral-700/50 mx-4" />
                <button 
                  onClick={() => setShowTimePicker(true)}
                  className="flex items-center justify-between w-full py-3 px-4 active:opacity-70 transition-opacity"
                >
                  <div className="flex items-center gap-4">
                    <SettingsIcon bgColor="#6B7280">
                      <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                    </SettingsIcon>
                    <span className="text-foreground text-lg font-medium">Choose Time</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span ref={timeRef} className="text-base font-medium text-primary">{formatTime12(restartTime)}</span>
                    <ChevronRight className="w-5 h-5 text-neutral-500" />
                  </div>
                </button>
              </>
            )}
          </div>
          
          <p className="text-neutral-500 text-sm mb-1 px-1">
            For your convenience, the app will automatically restart at the scheduled time daily.
          </p>
          {restartApp && (
            <div className="text-neutral-500 text-xs mb-1 px-1 space-y-0.5">
              {getNextRestartDisplay() && <p>Next restart: <span className="text-foreground font-medium">{getNextRestartDisplay()}</span></p>}
              {getLastRestartDisplay() && <p>Last restart: <span className="text-foreground font-medium">{getLastRestartDisplay()}</span></p>}
            </div>
          )}
          <p className="text-neutral-500 text-[11px] mb-6 px-1">
            Active payments or checkouts will not be interrupted. Restart will be deferred until completion.
          </p>

           {/* Auto Lock Timer Section */}
           <p className="text-neutral-500 text-base font-medium mb-0.5 px-1">Security</p>
           <div className="relative mb-2" ref={autoLockDropdownRef}>
            <div className="bg-neutral-800/60 rounded-full overflow-hidden">
              <button 
                onClick={() => setShowAutoLockDropdown(!showAutoLockDropdown)}
                className="flex items-center justify-between w-full py-3 px-4 active:opacity-70 transition-opacity"
              >
                <div className="flex items-center gap-4">
                  <SettingsIcon bgColor="#7C3AED">
                    <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                  </SettingsIcon>
                  <span className="text-foreground text-lg font-medium">Auto Lock Timer</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-neutral-400 text-base">{getAutoLockLabel()}</span>
                  <ChevronRight className="w-5 h-5 text-neutral-500" />
                </div>
              </button>
            </div>
            
            {/* Dropdown Menu */}
            {showAutoLockDropdown && (
              <div className="absolute right-0 top-full mt-2 z-50 w-48 bg-neutral-800 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {autoLockOptions.map((option, index) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      handleAutoLockTimerChange(option.value);
                      setShowAutoLockDropdown(false);
                    }}
                    className={`w-full text-left py-3 px-4 text-base transition-colors ${
                      autoLockTimer === option.value 
                        ? 'text-primary bg-neutral-700/50' 
                        : 'text-foreground hover:bg-neutral-700/30'
                    } ${index !== autoLockOptions.length - 1 ? 'border-b border-neutral-700/50' : ''}`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
           <p className="text-neutral-500 text-sm mb-6 px-1">
             The app will automatically lock after this period of inactivity. Staff will need to enter their PIN to unlock and continue using the Point of Sale.
           </p>

          {/* Toggle Options Card */}
           <p className="text-neutral-500 text-base font-medium mb-0.5 px-1">Features</p>
           <div className="bg-neutral-800/60 rounded-2xl overflow-hidden mb-6">
            {/* Switch To Kitchen Display System - hidden on mobile */}
            {!isMobile && (
              <>
                <div className="py-3.5 px-4">
                  <div className="flex items-center justify-between">
                    <span className="text-foreground text-lg font-medium">Switch To Kitchen Display System</span>
                    <Switch checked={switchToKDS} onCheckedChange={handleSwitchToKDSChange} />
                  </div>
                  <p className="text-neutral-500 text-sm mt-1">Transform this device into a Kitchen Display System.</p>
                </div>
                <div className="h-px bg-neutral-700/50 mx-4" />

                {/* KDS Notification */}
                <div className="py-3.5 px-4">
                  <div className="flex items-center justify-between">
                    <span className="text-foreground text-lg font-medium">Kitchen Display System Notification</span>
                    <Switch checked={kdsNotification} onCheckedChange={handleKdsNotificationChange} />
                  </div>
                  <p className="text-neutral-500 text-sm mt-1">Enable notification sounds and alerts when new orders arrive on the Kitchen Display System.</p>
                </div>
                <div className="h-px bg-neutral-700/50 mx-4" />
              </>
            )}

            {/* Debug Mode */}
            <div className="py-3.5 px-4">
              <div className="flex items-center justify-between">
                <span className="text-foreground text-lg font-medium">Debug Mode</span>
                <Switch checked={debugMode} onCheckedChange={handleDebugModeChange} />
              </div>
              <p className="text-neutral-500 text-sm mt-1">Enable detailed logging for troubleshooting.</p>
            </div>
            <div className="h-px bg-neutral-700/50 mx-4" />

            {/* Lock After Failed Attempts */}
            <div className="py-3.5 px-4">
              <div className="flex items-center justify-between">
                <span className="text-foreground text-lg font-medium">Lock after 10 attempts</span>
                <Switch checked={lockAfterFailed} onCheckedChange={handleLockAfterFailedChange} />
              </div>
              <p className="text-neutral-500 text-sm mt-1">Lock the app after multiple incorrect PIN entries.</p>
            </div>
            <div className="h-px bg-neutral-700/50 mx-4" />

            {/* Force Clock-In */}
            <div className="py-3.5 px-4">
              <div className="flex items-center justify-between">
                <span className="text-foreground text-lg font-medium">Force Clock-In</span>
                <Switch checked={forceClockIn} onCheckedChange={handleForceClockInChange} />
              </div>
              <p className="text-neutral-500 text-sm mt-1">Require staff to clock in before processing orders.</p>
            </div>
            <div className="h-px bg-neutral-700/50 mx-4" />

            {/* Open Register Without PIN */}
            <div className="py-3.5 px-4">
              <div className="flex items-center justify-between">
                <span className="text-foreground text-lg font-medium">Open Register Without PIN</span>
                <Switch checked={openRegisterWithoutPIN} onCheckedChange={handleOpenRegisterWithoutPINChange} />
              </div>
              <p className="text-neutral-500 text-sm mt-1">Allow cash drawer access without manager authorization.</p>
            </div>
            <div className="h-px bg-neutral-700/50 mx-4" />

            {/* Hide Performance Summary */}
            <div className="py-3.5 px-4">
              <div className="flex items-center justify-between">
                <span className="text-foreground text-lg font-medium">Hide Performance Summary</span>
                <Switch checked={hidePerformanceSummary} onCheckedChange={handleHidePerformanceSummaryChange} />
              </div>
              <p className="text-neutral-500 text-sm mt-1">Hide the employee performance stats from the Account screen.</p>
            </div>
            <div className="h-px bg-neutral-700/50 mx-4" />

            {/* Hide Break Button */}
            <div className="py-3.5 px-4">
              <div className="flex items-center justify-between">
                <span className="text-foreground text-lg font-medium">Hide Break Button</span>
                <Switch checked={hideBreakButton} onCheckedChange={handleHideBreakButtonChange} />
              </div>
              <p className="text-neutral-500 text-sm mt-1">Hide the break button from the PIN screen.</p>
            </div>
            <div className="h-px bg-neutral-700/50 mx-4" />

            {/* Hide Employee Feedback */}
            <div className="py-3.5 px-4">
              <div className="flex items-center justify-between">
                <span className="text-foreground text-lg font-medium">Hide Employee Feedback</span>
                <Switch checked={hideEmployeeFeedback} onCheckedChange={handleHideEmployeeFeedbackChange} />
              </div>
              <p className="text-neutral-500 text-sm mt-1">Hide employee feedback options.</p>
            </div>
          </div>

          {/* Table Section */}
           <p className="text-neutral-500 text-base font-medium mb-0.5 px-1">Table</p>
           <div className="bg-neutral-800/60 rounded-2xl overflow-hidden mb-6">
            <div className="py-3.5 px-4">
              <div className="flex items-center justify-between">
                <span className="text-foreground text-lg font-medium">Hide Seat Selector</span>
                <Switch checked={hideSeatSelector} onCheckedChange={handleHideSeatSelectorChange} />
              </div>
              <p className="text-neutral-500 text-sm mt-1">Hide the seat selection option when assigning tables.</p>
            </div>
            <div className="h-px bg-neutral-700/50 mx-4" />
            <div className="py-3.5 px-4">
              <div className="flex items-center justify-between">
                <span className="text-foreground text-lg font-medium">Reset Tables Daily</span>
                <Switch checked={resetTablesDaily} onCheckedChange={handleResetTablesDailyChange} />
              </div>
              <p className="text-neutral-500 text-sm mt-1">Automatically clear all table assignments at the start of each day.</p>
            </div>
          </div>

          {/* Dashboard Metrics Section */}
          <div className="flex items-center gap-2 mb-3 px-1">
            <p className="text-neutral-500 text-base">Dashboard</p>
            {!metricsUnlocked && <Lock className="w-3.5 h-3.5 text-neutral-500" />}
          </div>
          <div className="bg-neutral-800/60 rounded-2xl overflow-hidden mb-2">
            {([
              { key: 'totalSale' as const, label: 'Total Sale' },
              { key: 'totalTip' as const, label: 'Total Tip' },
              { key: 'totalHours' as const, label: 'Total Hours' },
              { key: 'ordering' as const, label: 'Ordering' },
              { key: 'readyToServed' as const, label: 'Ready to Served' },
              { key: 'completed' as const, label: 'Completed' },
            ]).map((metric, idx, arr) => (
              <div key={metric.key}>
                <div className="py-3.5 px-4">
                  <div className="flex items-center justify-between">
                    <span className="text-foreground text-lg font-medium">{metric.label}</span>
                    <Switch checked={dashboardMetrics[metric.key]} onCheckedChange={(v) => handleDashboardMetricToggle(metric.key, v)} />
                  </div>
                </div>
                {idx < arr.length - 1 && <div className="h-px bg-neutral-700/50 mx-4" />}
              </div>
            ))}
          </div>
          <p className="text-neutral-500 text-sm mb-6 px-1">
            Choose which metric cards are visible on the dashboard summary bar. Manager PIN required.
          </p>


           <div className="bg-neutral-800/60 rounded-full overflow-hidden mb-2">
            <div className="flex items-center justify-between py-3 px-4">
               <div>
                 <span className="text-foreground text-lg font-medium block">Built-In Display</span>
                 <span className="text-neutral-500 text-sm">Customer Facing Display</span>
               </div>
              <Switch checked={builtInDisplay} onCheckedChange={handleBuiltInDisplayChange} />
            </div>
          </div>
           <p className="text-neutral-500 text-sm px-1">
             Show order details, totals, and payment prompts on a secondary customer-facing screen during checkout.
           </p>
        </div>
      </div>

      {/* Mobile full-screen picker */}
      {isMobile && (
        <AppleWheelTimePicker
          isOpen={showTimePicker}
          onClose={() => setShowTimePicker(false)}
          onConfirm={handleTimeConfirm}
          selectedTime={formatTime12(restartTime)}
        />
      )}

      {/* Desktop dropdown via portal */}
      {!isMobile && showTimePicker && timePickerPos && createPortal(
        <>
          <div className="fixed inset-0 z-[9998]" onClick={() => setShowTimePicker(false)} />
          <div
            className="fixed z-[9999]"
            style={{ top: timePickerPos.top, left: timePickerPos.left }}
            onClick={(e) => e.stopPropagation()}
          >
            <AppleWheelTimePicker
              isOpen
              onClose={() => setShowTimePicker(false)}
              onConfirm={handleTimeConfirm}
              selectedTime={formatTime12(restartTime)}
              compact
            />
          </div>
        </>,
        document.body
      )}

      {/* Confirmation Dialog for enabling auto-restart */}
      <AlertDialog open={showRestartConfirm} onOpenChange={setShowRestartConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Enable Auto-Restart?</AlertDialogTitle>
            <AlertDialogDescription>
              The app will automatically restart daily at the scheduled time ({formatTime12(restartTime)}). Active payments will not be interrupted — restarts are deferred until checkout completes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRestartEnable}>Enable</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Manager PIN Modal for Dashboard Metrics */}
      {showMetricsPinModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50">
          <div className="bg-neutral-900 rounded-xl border border-neutral-700 w-[90%] max-w-md mx-4 overflow-hidden animate-scale-in">
            <AccessRestrictedModal
              subtitle="Manager PIN required to change dashboard metrics."
              onBack={() => {
                setShowMetricsPinModal(false);
                setPendingMetricToggle(null);
              }}
              onSuccess={handleMetricsPinSuccess}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default ControlCenterContent;
