import { ChevronRight, ChevronLeft, ChevronUp, ChevronDown } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import AnimatedAIIcon from "@/components/AnimatedAIIcon";
import { useState, useRef, useEffect, useCallback } from "react";
import { SettingsManager, ControlCenterSettings } from "@/lib/settingsManager";

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
  // Load initial state from SettingsManager
  const loadSettings = useCallback(() => SettingsManager.getControlCenterSettings(), []);
  
  const [restartApp, setRestartApp] = useState(() => loadSettings().restartApp);
  const [selectedHour, setSelectedHour] = useState(12);
  const [selectedMinute, setSelectedMinute] = useState(0);
  const [selectedPeriod, setSelectedPeriod] = useState<"AM" | "PM">("AM");
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [autoLockTimer, setAutoLockTimer] = useState(() => loadSettings().autoLockTimer);
  const [showAutoLockDropdown, setShowAutoLockDropdown] = useState(false);
  const [switchToKDS, setSwitchToKDS] = useState(() => loadSettings().switchToKDS);
  const [debugMode, setDebugMode] = useState(() => loadSettings().debugMode);
  const [lockAfterFailed, setLockAfterFailed] = useState(() => loadSettings().lockAfterFailed);
  const [forceClockIn, setForceClockIn] = useState(() => loadSettings().forceClockIn);
  const [openRegisterWithoutPIN, setOpenRegisterWithoutPIN] = useState(() => loadSettings().openRegisterWithoutPIN);
  const [builtInDisplay, setBuiltInDisplay] = useState(() => loadSettings().builtInDisplay);
  const [hidePerformanceSummary, setHidePerformanceSummary] = useState(() => loadSettings().hidePerformanceSummary);

  // Sync all settings when a settings-updated event is received
  useEffect(() => {
    const handleSettingsUpdate = (event: CustomEvent) => {
      const { type, data } = event.detail || {};
      if (type === 'controlCenter' && data) {
        const settings = data as ControlCenterSettings;
        setRestartApp(settings.restartApp);
        setAutoLockTimer(settings.autoLockTimer);
        setSwitchToKDS(settings.switchToKDS);
        setDebugMode(settings.debugMode);
        setLockAfterFailed(settings.lockAfterFailed);
        setForceClockIn(settings.forceClockIn);
        setOpenRegisterWithoutPIN(settings.openRegisterWithoutPIN);
        setBuiltInDisplay(settings.builtInDisplay);
        setHidePerformanceSummary(settings.hidePerformanceSummary);
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
    setRestartApp(value);
    updateSetting('restartApp', value);
  };

  const handleAutoLockTimerChange = (value: string) => {
    setAutoLockTimer(value);
    updateSetting('autoLockTimer', value);
  };

  const handleSwitchToKDSChange = (value: boolean) => {
    setSwitchToKDS(value);
    updateSetting('switchToKDS', value);
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
    // Also dispatch the legacy event for Account screen
    window.dispatchEvent(new CustomEvent('performanceSummaryVisibilityChanged', { detail: { hidden: value } }));
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

  const formatTime = () => {
    const hour = selectedHour.toString().padStart(2, '0');
    const minute = selectedMinute.toString().padStart(2, '0');
    return `${hour}:${minute} ${selectedPeriod}`;
  };

  const incrementHour = () => {
    setSelectedHour(prev => prev === 12 ? 1 : prev + 1);
  };

  const decrementHour = () => {
    setSelectedHour(prev => prev === 1 ? 12 : prev - 1);
  };

  const incrementMinute = () => {
    setSelectedMinute(prev => prev === 59 ? 0 : prev + 1);
  };

  const decrementMinute = () => {
    setSelectedMinute(prev => prev === 0 ? 59 : prev - 1);
  };

  const togglePeriod = () => {
    setSelectedPeriod(prev => prev === "AM" ? "PM" : "AM");
  };

  return (
    <>
      <div className="h-full overflow-y-auto scrollbar-hide overscroll-contain">
        {/* Header */}
        {showHeader && (
          <div className="flex items-center justify-between py-4 relative overflow-visible px-4">
            {onBack && (
              <button
                onClick={onBack}
                className="w-8 h-8 rounded-full bg-neutral-800/60 flex items-center justify-center active:opacity-70 transition-opacity"
              >
                <ChevronLeft className="w-4 h-4 text-foreground" />
              </button>
            )}
            <h1 className="text-base font-medium text-foreground absolute left-1/2 -translate-x-1/2">Control center</h1>
            <div className="overflow-visible flex items-center justify-center" style={{ width: 32, height: 32 }}>
              <AnimatedAIIcon size={24} onClick={onAIClick || (() => navigate('/settings/ai'))} />
            </div>
          </div>
        )}

        {/* Content */}
        <div className="pt-6 px-6 pb-8">

          {/* App Restart Section */}
          <p className="text-neutral-500 text-base mb-3 px-1">App Restart</p>
          
          <div className={`bg-neutral-800/60 overflow-hidden mb-2 transition-all duration-300 ${restartApp ? 'rounded-2xl' : 'rounded-full'}`}>
            <div className="flex items-center justify-between py-3 px-4">
              <div className="flex items-center gap-4">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: "#F97316" }}
                >
                  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                    <path d="M3 3v5h5" />
                  </svg>
                </div>
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
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: "#6B7280" }}
                    >
                      <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                    </div>
                    <span className="text-foreground text-lg font-medium">Choose Time</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-neutral-400 text-base">{formatTime()}</span>
                    <ChevronRight className="w-5 h-5 text-neutral-500" />
                  </div>
                </button>
              </>
            )}
          </div>
          
          <p className="text-neutral-500 text-sm mb-6 px-1">
            For your convenience, the app will automatically restart two hours after the end-of-day time you set.
          </p>

           {/* Auto Lock Timer Section */}
           <p className="text-neutral-500 text-base mb-3 px-1">Security</p>
           <div className="relative mb-2" ref={autoLockDropdownRef}>
            <div className="bg-neutral-800/60 rounded-full overflow-hidden">
              <button 
                onClick={() => setShowAutoLockDropdown(!showAutoLockDropdown)}
                className="flex items-center justify-between w-full py-3 px-4 active:opacity-70 transition-opacity"
              >
                <div className="flex items-center gap-4">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: "#7C3AED" }}
                  >
                    <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                  </div>
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
             The app will automatically lock after this period of inactivity. Staff will need to enter their PIN to unlock and continue using the POS.
           </p>

          {/* Toggle Options Card */}
           <p className="text-neutral-500 text-base mb-3 px-1">Features</p>
           <div className="bg-neutral-800/60 rounded-2xl overflow-hidden mb-2">
            {/* Switch To KDS - hidden on mobile */}
            {!isMobile && (
              <>
                <div className="flex items-center justify-between py-3.5 px-4">
                  <span className="text-foreground text-lg font-medium">Switch To KDS</span>
                  <Switch checked={switchToKDS} onCheckedChange={handleSwitchToKDSChange} />
                </div>
                <div className="h-px bg-neutral-700/50 mx-4" />
              </>
            )}

            {/* Debug Mode */}
            <div className="flex items-center justify-between py-3.5 px-4">
              <span className="text-foreground text-lg font-medium">Debug Mode</span>
              <Switch checked={debugMode} onCheckedChange={handleDebugModeChange} />
            </div>
            <div className="h-px bg-neutral-700/50 mx-4" />

            {/* Lock After Failed Attempts */}
            <div className="flex items-center justify-between py-3.5 px-4">
              <span className="text-foreground text-lg font-medium">Lock after 5 attempts</span>
              <Switch checked={lockAfterFailed} onCheckedChange={handleLockAfterFailedChange} />
            </div>
            <div className="h-px bg-neutral-700/50 mx-4" />

            {/* Force Clock-In */}
            <div className="flex items-center justify-between py-3.5 px-4">
              <span className="text-foreground text-lg font-medium">Force Clock-In</span>
              <Switch checked={forceClockIn} onCheckedChange={handleForceClockInChange} />
            </div>
            <div className="h-px bg-neutral-700/50 mx-4" />

            {/* Open Register Without PIN */}
            <div className="flex items-center justify-between py-3.5 px-4">
              <span className="text-foreground text-lg font-medium">Open Register Without PIN</span>
              <Switch checked={openRegisterWithoutPIN} onCheckedChange={handleOpenRegisterWithoutPINChange} />
            </div>
            <div className="h-px bg-neutral-700/50 mx-4" />

            {/* Hide Performance Summary */}
            <div className="flex items-center justify-between py-3.5 px-4">
              <span className="text-foreground text-lg font-medium">Hide Performance Summary</span>
              <Switch checked={hidePerformanceSummary} onCheckedChange={handleHidePerformanceSummaryChange} />
            </div>
          </div>
           <p className="text-neutral-500 text-sm mb-6 px-1 leading-relaxed">
             <strong>Switch To KDS:</strong> Transform this device into a Kitchen Display System. <strong>Debug Mode:</strong> Enable detailed logging for troubleshooting. <strong>Lock After Failed Attempts:</strong> Lock the app after multiple incorrect PIN entries. <strong>Force Clock-In:</strong> Require staff to clock in before processing orders. <strong>Open Register Without PIN:</strong> Allow cash drawer access without manager authorization. <strong>Hide Performance Summary:</strong> Hide the employee performance stats from the Account screen.
           </p>

          {/* Customer Facing Display Section */}
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

      {/* iOS-style Time Picker Dialog */}
      {showTimePicker && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 animate-in fade-in duration-200"
          onClick={() => setShowTimePicker(false)}
        >
          <div 
            className="bg-neutral-900 rounded-3xl p-6 w-[300px] shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <h2 className="text-xl font-semibold text-foreground text-center mb-6">Set Restart Time</h2>
            
            {/* Time Picker Wheels */}
            <div className="flex items-center justify-center gap-2 mb-8">
              {/* Hour Picker */}
              <div className="flex flex-col items-center">
                <button 
                  onClick={incrementHour}
                  className="w-16 h-10 flex items-center justify-center text-neutral-500 hover:text-foreground active:opacity-70 transition-all"
                >
                  <ChevronUp className="w-6 h-6" />
                </button>
                <div className="w-16 h-16 bg-neutral-800 rounded-2xl flex items-center justify-center">
                  <span className="text-3xl font-medium text-foreground">
                    {selectedHour.toString().padStart(2, '0')}
                  </span>
                </div>
                <button 
                  onClick={decrementHour}
                  className="w-16 h-10 flex items-center justify-center text-neutral-500 hover:text-foreground active:opacity-70 transition-all"
                >
                  <ChevronDown className="w-6 h-6" />
                </button>
              </div>

              {/* Separator */}
              <span className="text-3xl font-medium text-foreground mb-1">:</span>

              {/* Minute Picker */}
              <div className="flex flex-col items-center">
                <button 
                  onClick={incrementMinute}
                  className="w-16 h-10 flex items-center justify-center text-neutral-500 hover:text-foreground active:opacity-70 transition-all"
                >
                  <ChevronUp className="w-6 h-6" />
                </button>
                <div className="w-16 h-16 bg-neutral-800 rounded-2xl flex items-center justify-center">
                  <span className="text-3xl font-medium text-foreground">
                    {selectedMinute.toString().padStart(2, '0')}
                  </span>
                </div>
                <button 
                  onClick={decrementMinute}
                  className="w-16 h-10 flex items-center justify-center text-neutral-500 hover:text-foreground active:opacity-70 transition-all"
                >
                  <ChevronDown className="w-6 h-6" />
                </button>
              </div>

              {/* AM/PM Picker */}
              <div className="flex flex-col items-center ml-2">
                <button 
                  onClick={togglePeriod}
                  className="w-16 h-10 flex items-center justify-center text-neutral-500 hover:text-foreground active:opacity-70 transition-all"
                >
                  <ChevronUp className="w-6 h-6" />
                </button>
                <div className="w-16 h-16 bg-neutral-800 rounded-2xl flex items-center justify-center">
                  <span className="text-2xl font-medium text-foreground">
                    {selectedPeriod}
                  </span>
                </div>
                <button 
                  onClick={togglePeriod}
                  className="w-16 h-10 flex items-center justify-center text-neutral-500 hover:text-foreground active:opacity-70 transition-all"
                >
                  <ChevronDown className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowTimePicker(false)}
                className="flex-1 py-3.5 bg-neutral-800 rounded-xl text-foreground font-medium active:opacity-70 transition-opacity"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowTimePicker(false)}
                className="flex-1 py-3.5 bg-primary rounded-xl text-primary-foreground font-medium active:opacity-70 transition-opacity"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ControlCenterContent;
