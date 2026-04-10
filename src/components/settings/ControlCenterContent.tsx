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
            <h1 className="text-base font-medium text-foreground absolute left-1/2 -translate-x-1/2">Control center</h1>
            <div className="overflow-visible flex items-center justify-center" style={{ width: 32, height: 32 }}>
          </div>
        </div>
      )}
    </>
  );
};

export default ControlCenterContent;
