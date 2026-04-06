import React, { useState, useEffect, useCallback } from "react";
import { format, differenceInMinutes, differenceInHours } from "date-fns";
import { Sun, Fingerprint, ScanFace, ChevronDown, Check, Clock, MapPin, Briefcase, X, Timer, LogOut, Coffee, ArrowLeft, EyeOff, Lock, ShieldAlert, UtensilsCrossed, TreePine, Wine, ShoppingBag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import AppleAlertDialog from "@/components/AppleAlertDialog";
import FingerprintAuthModal, { FingerprintInlineAuth } from "@/components/FingerprintAuthModal";
import { FaceIDInlineAuth } from "@/components/FaceIDAuthModal";
import { recordFailedAttempt, resetFailedAttempts, isLockedOut, getFailedCount } from "@/lib/pinAttemptTracker";
import { lookupEmployeeByPin } from "@/lib/employeePinLookup";
import { SettingsManager } from "@/lib/settingsManager";
import pinIndicatorIcon from "@/assets/icons/pin-indicator.svg";
import pinIndicatorFilledIcon from "@/assets/icons/pin-indicator-filled.svg";
import happyIcon from "@/assets/icons/emotions/happy.svg";
import energizedIcon from "@/assets/icons/emotions/energized.svg";
import motivatedIcon from "@/assets/icons/emotions/motivated.svg";
import emotionalIcon from "@/assets/icons/emotions/emotional.svg";
import okayIcon from "@/assets/icons/emotions/okay.svg";
import thankfulIcon from "@/assets/icons/emotions/thankful.svg";
import serverIcon from "@/assets/icons/jobs/server.svg";
import bartenderIcon from "@/assets/icons/jobs/bartender.svg";
import hostIcon from "@/assets/icons/jobs/host.svg";
import managerIcon from "@/assets/icons/jobs/manager.svg";
import baristaIcon from "@/assets/icons/jobs/barista.svg";
import runnerIcon from "@/assets/icons/jobs/runner.svg";
interface ClockInOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onEnterPOS: () => void;
}
interface ClockInSummary {
  clockInTime: Date;
  revenueCenter: string;
  jobType: string;
  employeeName: string;
}
interface ClockOutSummary {
  clockInTime: Date;
  clockOutTime: Date;
  revenueCenter: string;
  jobType: string;
  employeeName: string;
  totalMinutes: number;
  breakMinutes: number;
}

// Employee interface with assigned job types
interface Employee {
  id: string;
  name: string;
  assignedJobTypes: string[];
  revenueCenter: string;
  avatar?: string;
}

// Employee data is now fetched from the database via lookupEmployeeByPin

// Emotion options with custom icons
type EmotionKey = 'happy' | 'energized' | 'motivated' | 'emotional' | 'okay' | 'thankful';
interface EmotionOption {
  key: EmotionKey;
  icon: string;
  label: string;
}
const EMOTIONS: EmotionOption[] = [{
  key: 'happy',
  icon: happyIcon,
  label: 'Happy'
}, {
  key: 'energized',
  icon: energizedIcon,
  label: 'Energized'
}, {
  key: 'motivated',
  icon: motivatedIcon,
  label: 'Motivated'
}, {
  key: 'emotional',
  icon: emotionalIcon,
  label: 'Emotional'
}, {
  key: 'okay',
  icon: okayIcon,
  label: 'Okay'
}, {
  key: 'thankful',
  icon: thankfulIcon,
  label: 'Thankful'
}];
const EMOTION_TAGS: Record<EmotionKey, string[]> = {
  happy: ['JOYFUL', 'CHEERFUL', 'DELIGHTED', 'SATISFIED', 'ECSTATIC', 'BLISSFUL', 'RADIANT', 'ELATED', 'GLEEFUL', 'AMUSED', 'JUBILANT', 'EXUBERANT', 'OVERJOYED', 'THRILLED', 'PLEASED'],
  energized: ['EXCITED', 'INVIGORATED', 'ALERT', 'ENTHUSIASTIC', 'VIBRANT', 'RADIANT', 'REVITALIZED', 'LIVELY', 'ELECTRIC', 'EAGER', 'PUMPED', 'DYNAMIC', 'ANIMATED', 'CHARGED', 'SPIRITED'],
  motivated: ['DRIVEN', 'DETERMINED', 'INSPIRED', 'AMBITIOUS', 'FOCUSED', 'COMMITTED', 'READY', 'PASSIONATE', 'PURPOSEFUL', 'RESOLVED', 'GOAL-ORIENTED', 'ENGAGED', 'RESOLUTE', 'ACTIVATED', 'INTENT'],
  emotional: ['DOWN', 'THOUGHTFUL', 'LOST IN THOUGHT', 'NOSTALGIC', 'WORRIED', 'SENTIMENTAL', 'GENTLE', 'MOVED', 'STIRRED', 'CARING', 'UNDERSTANDING', 'DISTRACTED', 'SENSITIVE', 'TIRED', 'REFLECTIVE'],
  okay: ['CALM', 'CONTENT', 'STEADY', 'COMPOSED', 'PEACEFUL', 'EASY GOING', 'SETTLED', 'NEUTRAL', 'BALANCED', 'BEEN BETTER', 'TRANQUIL', 'CHILL', 'RELAXED', 'MILD', 'STABLE', 'MANAGEABLE'],
  thankful: ['GRATEFUL', 'APPRECIATE', 'BLESSED', 'RELIEVED', 'HONEST', 'HAPPY', 'SEEN', 'PLEASED', 'MOVED', 'FULFILLED', 'PROUD', 'VALUED', 'OBLIGED', 'SATISFIED']
};

// Merchant config flag (would come from settings in production)
const ENABLE_MOOD_CHECKIN = true;
const PIN_LENGTH = 4;
const revenueCenters = ["Dine Center", "Main Hall", "Outdoor Patio", "Private Dining", "Bar Area", "Takeout Counter"];

// Revenue center icons mapping
const REVENUE_CENTER_ICONS: Record<string, React.ComponentType<any>> = {
  "Dine Center": UtensilsCrossed,
  "Main Hall": MapPin,
  "Outdoor Patio": TreePine,
  "Private Dining": Lock,
  "Bar Area": Wine,
  "Takeout Counter": ShoppingBag,
};

// Job type icons mapping
const JOB_TYPE_ICONS: Record<string, string | null> = {
  "Server": serverIcon,
  "Bartender": bartenderIcon,
  "Host": hostIcon,
  "Manager": managerIcon,
  "Barista": baristaIcon,
  "Runner": runnerIcon
};
export const ClockInOverlay = ({
  isOpen,
  onClose,
  onEnterPOS
}: ClockInOverlayProps) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [selectedRevenueCenter, setSelectedRevenueCenter] = useState("Dine Center");
  const [showRevenueCenterSelector, setShowRevenueCenterSelector] = useState(false);
  const [selectedJobType, setSelectedJobType] = useState("Server");
  const [showJobTypeSelector, setShowJobTypeSelector] = useState(false);
  const [clockInSummary, setClockInSummary] = useState<ClockInSummary | null>(null);
  const [showSummaryRevenueCenterDropdown, setShowSummaryRevenueCenterDropdown] = useState(false);
  const [showSummaryJobTypeDropdown, setShowSummaryJobTypeDropdown] = useState(false);
  const [summaryAvailableJobTypes, setSummaryAvailableJobTypes] = useState<string[]>([]);
  const [clockOutSummary, setClockOutSummary] = useState<ClockOutSummary | null>(null);
  const [isClockedIn, setIsClockedIn] = useState(false);

  // Two-step clock-in state
  const [validatedEmployee, setValidatedEmployee] = useState<Employee | null>(null);
  const [showJobSelection, setShowJobSelection] = useState(false);

  // Mood check-in state
  const [showMoodCheckIn, setShowMoodCheckIn] = useState(false);
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionOption | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isAnonymous, setIsAnonymous] = useState(false);
  
  // Logout confirmation dialog state
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  
  // Fingerprint auth state - inline mode (replaces keypad)
  const [showFingerprintScan, setShowFingerprintScan] = useState(false);
  
  // Face ID auth state - inline mode (replaces keypad)
  const [showFaceIDScan, setShowFaceIDScan] = useState(false);

  // PIN lockout state - after 10 failed attempts, require manager PIN
  const [pinLockedOut, setPinLockedOut] = useState(() => isLockedOut());
  const [managerPin, setManagerPin] = useState("");
  const [managerPinError, setManagerPinError] = useState(false);
  const failedCountDisplay = getFailedCount();
  const [warning, setWarning] = useState("");

  // Helper: handle failed PIN attempt result
  const handleFailedResult = () => {
    const locked = recordFailedAttempt();
    if (locked) {
      setPinLockedOut(true);
      setPin("");
      setError("");
      setWarning("");
    } else {
      const count = getFailedCount();
      if (count >= 7) {
        setWarning(`⚠️ Warning: ${10 - count} attempt${10 - count === 1 ? '' : 's'} remaining before device locks!`);
        setError(`Invalid PIN. (${count}/10)`);
      } else {
        setWarning("");
        setError(`Invalid PIN. Please try again. (${count}/10)`);
      }
      setPin("");
    }
  };

  // Check if user is clocked in on mount and when overlay opens
  useEffect(() => {
    if (isOpen) {
      const sessionData = localStorage.getItem("pos_session");
      setIsClockedIn(!!sessionData);
    }
  }, [isOpen]);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Handle keyboard input
  useEffect(() => {
    if (!isOpen || clockInSummary || clockOutSummary || showJobSelection) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isVerifying) return;
      if (e.key >= "0" && e.key <= "9") {
        if (pin.length < PIN_LENGTH) {
          setPin(prev => prev + e.key);
          setError("");
        }
      } else if (e.key === "Backspace" || e.key === "Delete") {
        setPin(prev => prev.slice(0, -1));
        setError("");
      } else if (e.key === "Enter" && pin.length === PIN_LENGTH) {
        handleEnter();
      } else if (e.key === "Escape") {
        handleClear();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, pin, isVerifying, clockInSummary, showJobSelection]);
  const handleKeyPress = (key: string) => {
    if (pin.length < PIN_LENGTH && !isVerifying) {
      setPin(prev => prev + key);
      setError("");
    }
  };
  const handleClear = () => {
    setPin("");
    setError("");
  };
  const handleEnter = useCallback(async () => {
    if (pin.length !== PIN_LENGTH) {
      setError("Please enter a 4-digit PIN");
      return;
    }
    setIsVerifying(true);
    try {
      const employee = await lookupEmployeeByPin(pin);
      if (employee) {
        resetFailedAttempts();
        setPinLockedOut(false);
        onClose();
        onEnterPOS();
      } else {
        handleFailedResult();
      }
    } catch {
      setError("Connection error. Please try again.");
    }
    setIsVerifying(false);
  }, [pin, onClose, onEnterPOS]);
  const handleClockIn = async () => {
    if (pin.length !== PIN_LENGTH) {
      setError("Please enter your PIN first");
      return;
    }
    setIsVerifying(true);
    try {
      const dbEmployee = await lookupEmployeeByPin(pin);
      
      if (dbEmployee) {
        resetFailedAttempts();
        setPinLockedOut(false);
        const employee: Employee = {
          id: dbEmployee.id,
          name: dbEmployee.full_name,
          assignedJobTypes: dbEmployee.assigned_job_types || ["Server"],
          revenueCenter: dbEmployee.revenue_center || "Dine Center",
          avatar: dbEmployee.avatar_url || undefined,
        };
        setValidatedEmployee(employee);
        setSelectedRevenueCenter(employee.revenueCenter);
        
        if (employee.assignedJobTypes.length === 1) {
          completeClockIn(employee, employee.assignedJobTypes[0]);
        } else {
          setShowJobSelection(true);
        }
      } else {
        handleFailedResult();
      }
    } catch {
      setError("Connection error. Please try again.");
    }
    setIsVerifying(false);
  };

  const handleJobSelection = (job: string) => {
    if (validatedEmployee) {
      setSelectedJobType(job);
      completeClockIn(validatedEmployee, job);
    }
  };

  const completeClockIn = (employee: Employee, jobType: string) => {
    setSummaryAvailableJobTypes(employee.assignedJobTypes || [jobType]);
    setClockInSummary({
      clockInTime: new Date(),
      revenueCenter: employee.revenueCenter,
      jobType: jobType,
      employeeName: employee.name
    });
    
    localStorage.setItem("pos_session", JSON.stringify({
      employeeId: employee.id,
      employeeName: employee.name,
      clockInTime: new Date().toISOString(),
      revenueCenter: employee.revenueCenter,
      jobType: jobType,
      breaks: [],
      onBreak: false,
      currentBreakStart: null
    }));
    
    setIsClockedIn(true);
    setShowJobSelection(false);
    setValidatedEmployee(null);
    setPin("");
  };

  const handleJobSelectionBack = () => {
    setShowJobSelection(false);
    setValidatedEmployee(null);
    setPin("");
    setError("");
  };
  const handleClockOut = async () => {
    if (pin.length !== PIN_LENGTH) {
      setError("Please enter your PIN first");
      return;
    }
    setIsVerifying(true);
    try {
      const employee = await lookupEmployeeByPin(pin);
      if (employee) {
        resetFailedAttempts();
        setPinLockedOut(false);
        const sessionData = localStorage.getItem("pos_session");
        const clockOutTime = new Date();
        if (sessionData) {
          const session = JSON.parse(sessionData);
          const clockInTime = new Date(session.clockInTime);
          let breakMinutes = 0;
          if (session.breaks && session.breaks.length > 0) {
            breakMinutes = session.breaks.reduce((total: number, brk: {
              start: string;
              end: string;
            }) => {
              const breakStart = new Date(brk.start);
              const breakEnd = new Date(brk.end);
              return total + differenceInMinutes(breakEnd, breakStart);
            }, 0);
          }
          if (session.onBreak && session.currentBreakStart) {
            breakMinutes += differenceInMinutes(clockOutTime, new Date(session.currentBreakStart));
          }
          const totalMinutes = differenceInMinutes(clockOutTime, clockInTime) - breakMinutes;
          setClockOutSummary({
            clockInTime,
            clockOutTime,
            revenueCenter: session.revenueCenter || selectedRevenueCenter,
            jobType: session.jobType || selectedJobType,
            employeeName: session.employeeName || employee.full_name,
            totalMinutes: Math.max(0, totalMinutes),
            breakMinutes
          });
        } else {
          const clockInTime = new Date(clockOutTime.getTime() - 8 * 60 * 60 * 1000);
          setClockOutSummary({
            clockInTime,
            clockOutTime,
            revenueCenter: selectedRevenueCenter,
            jobType: selectedJobType,
            employeeName: employee.full_name,
            totalMinutes: 8 * 60 - 30,
            breakMinutes: 30
          });
        }
        localStorage.removeItem("pos_session");
        setIsClockedIn(false);
      } else {
        handleFailedResult();
      }
    } catch {
      setError("Connection error. Please try again.");
    }
    setIsVerifying(false);
  };
  const handleBreak = async () => {
    if (pin.length !== PIN_LENGTH) {
      setError("Please enter your PIN first");
      return;
    }
    setIsVerifying(true);
    try {
      const employee = await lookupEmployeeByPin(pin);
      if (employee) {
        resetFailedAttempts();
        setPinLockedOut(false);
        const sessionData = localStorage.getItem("pos_session");
        if (sessionData) {
          const session = JSON.parse(sessionData);
          if (session.onBreak) {
            const breakEnd = new Date().toISOString();
            const breaks = session.breaks || [];
            breaks.push({
              start: session.currentBreakStart,
              end: breakEnd
            });
            localStorage.setItem("pos_session", JSON.stringify({
              ...session,
              breaks,
              onBreak: false,
              currentBreakStart: null
            }));
          } else {
            localStorage.setItem("pos_session", JSON.stringify({
              ...session,
              onBreak: true,
              currentBreakStart: new Date().toISOString()
            }));
          }
        }
        onClose();
        onEnterPOS();
      } else {
        handleFailedResult();
      }
    } catch {
      setError("Connection error. Please try again.");
    }
    setIsVerifying(false);
  };
  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };
  
  const handleLogoutConfirm = () => {
    setShowLogoutConfirm(false);
    localStorage.removeItem("pos_device_session");
    localStorage.removeItem("pos_session");
    navigate("/login");
  };
  const handleEnterPOSWithoutClockIn = () => {
    onClose();
    onEnterPOS();
  };
  const handleEnterPOSFromSummary = () => {
    // If mood check-in is enabled and we're on clock-in OR clock-out summary, show mood check-in
    if (ENABLE_MOOD_CHECKIN && !SettingsManager.getControlCenterSettings().hideEmployeeFeedback && (clockInSummary || clockOutSummary) && !showMoodCheckIn) {
      setShowMoodCheckIn(true);
      return;
    }
    setClockInSummary(null);
    setClockOutSummary(null);
    setShowMoodCheckIn(false);
    setSelectedEmotion(null);
    setSelectedTags([]);
    setIsAnonymous(false);
    onClose();
    onEnterPOS();
  };
  const handleEmotionSelect = (emotion: EmotionOption) => {
    setSelectedEmotion(emotion);
    setSelectedTags([]);
  };
  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };
  const handleMoodSubmit = () => {
    const sessionData = localStorage.getItem("pos_session");
    const session = sessionData ? JSON.parse(sessionData) : {};
    const isClockOut = !!clockOutSummary;
    const moodEvent = {
      type: 'employee_mood_checkin_submitted',
      timestamp: new Date().toISOString(),
      storeId: 'store_001',
      deviceId: 'device_001',
      revenueCenterId: clockInSummary?.revenueCenter || clockOutSummary?.revenueCenter,
      employeeId: isAnonymous ? null : session.employeeId,
      emotion: selectedEmotion?.key,
      tags: selectedTags,
      anonymous: isAnonymous,
      context: isClockOut ? 'clock_out' : 'clock_in'
    };
    console.log('Mood Check-in Event:', moodEvent);

    // Reset mood check-in state
    setShowMoodCheckIn(false);
    setSelectedEmotion(null);
    setSelectedTags([]);
    setIsAnonymous(false);
    if (isClockOut) {
      // After Clock Out, reset to initial state (keypad visible)
      setClockOutSummary(null);
      setPin("");
    } else {
      // After Clock In, proceed to POS
      setClockInSummary(null);
      onClose();
      onEnterPOS();
    }
  };
  const handleMoodSkip = () => {
    const sessionData = localStorage.getItem("pos_session");
    const session = sessionData ? JSON.parse(sessionData) : {};
    const isClockOut = !!clockOutSummary;
    const skipEvent = {
      type: 'employee_mood_checkin_skipped',
      timestamp: new Date().toISOString(),
      storeId: 'store_001',
      deviceId: 'device_001',
      employeeId: session.employeeId,
      context: isClockOut ? 'clock_out' : 'clock_in'
    };
    console.log('Mood Check-in Skip Event:', skipEvent);

    // Reset mood check-in state
    setShowMoodCheckIn(false);
    setSelectedEmotion(null);
    setSelectedTags([]);
    setIsAnonymous(false);
    if (isClockOut) {
      // After Clock Out, reset to initial state (keypad visible)
      setClockOutSummary(null);
      setPin("");
    } else {
      // After Clock In, proceed to POS
      setClockInSummary(null);
      onClose();
      onEnterPOS();
    }
  };
  const handleMoodBack = () => {
    if (selectedEmotion) {
      setSelectedEmotion(null);
      setSelectedTags([]);
    } else {
      setShowMoodCheckIn(false);
    }
  };

  // Fingerprint authentication handlers (inline mode)
  const handleFingerprintPress = () => {
    setShowFingerprintScan(true);
  };

  const handleFingerprintSuccess = (employee: { id: string; name: string; jobTypes: string[]; revenueCenter: string; avatar?: string }) => {
    setShowFingerprintScan(false);
    
    // Convert fingerprint employee format to our Employee format
    const mappedEmployee: Employee = {
      id: employee.id,
      name: employee.name,
      assignedJobTypes: employee.jobTypes,
      revenueCenter: employee.revenueCenter,
      avatar: employee.avatar
    };
    
    // If only one job type, auto-complete clock in
    if (mappedEmployee.assignedJobTypes.length === 1) {
      completeClockIn(mappedEmployee, mappedEmployee.assignedJobTypes[0]);
    } else {
      // Multiple job types - show selection screen
      setValidatedEmployee(mappedEmployee);
      setSelectedRevenueCenter(mappedEmployee.revenueCenter);
      setShowJobSelection(true);
    }
  };

  const handleFingerprintCancel = () => {
    setShowFingerprintScan(false);
  };

  // Face ID authentication handlers (inline mode)
  const handleFaceIDPress = () => {
    setShowFaceIDScan(true);
  };

  const handleFaceIDSuccess = (employee: { id: string; name: string; jobTypes: string[]; revenueCenter: string; avatar?: string }) => {
    setShowFaceIDScan(false);
    
    // Convert Face ID employee format to our Employee format
    const mappedEmployee: Employee = {
      id: employee.id,
      name: employee.name,
      assignedJobTypes: employee.jobTypes,
      revenueCenter: employee.revenueCenter,
      avatar: employee.avatar
    };
    
    // If only one job type, auto-complete clock in
    if (mappedEmployee.assignedJobTypes.length === 1) {
      completeClockIn(mappedEmployee, mappedEmployee.assignedJobTypes[0]);
    } else {
      // Multiple job types - show selection screen
      setValidatedEmployee(mappedEmployee);
      setSelectedRevenueCenter(mappedEmployee.revenueCenter);
      setShowJobSelection(true);
    }
  };

  const handleFaceIDCancel = () => {
    setShowFaceIDScan(false);
  };

  const formatDuration = (totalMinutes: number) => {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours === 0) {
      return `${minutes}m`;
    }
    return `${hours}h ${minutes}m`;
  };
  if (!isOpen) return null;

  // Shared components for mood check-in
  const renderMoodCheckIn = (isClockOut: boolean) => <motion.div key="mood-checkin-module" initial={{
    opacity: 0,
    x: 20
  }} animate={{
    opacity: 1,
    x: 0
  }} exit={{
    opacity: 0,
    x: -20
  }} transition={{
    duration: 0.2
  }} className="flex flex-col h-full">
      {/* Title - shown only on emotion selection, not on tag selection */}
      <AnimatePresence mode="wait">
        {!selectedEmotion && (
          <motion.h3
            key="mood-title"
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: "auto", marginBottom: 16 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            transition={{ duration: 0.15 }}
            className="text-white text-lg md:text-xl font-semibold text-center overflow-hidden"
          >
            How are you feeling today?
          </motion.h3>
        )}
      </AnimatePresence>

      <div className="flex-1 overflow-y-auto min-h-0">
        <AnimatePresence mode="wait">
          {!selectedEmotion ? <motion.div key="emotion-grid" initial={{
          opacity: 0,
          y: 10
        }} animate={{
          opacity: 1,
          y: 0
        }} exit={{
          opacity: 0,
          y: -10
        }} transition={{
          duration: 0.2
        }} className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-3">
              {EMOTIONS.map(emotion => <button key={emotion.key} onClick={() => handleEmotionSelect(emotion)} className="bg-white/10 hover:bg-white/20 active:bg-white/30 backdrop-blur-sm rounded-xl p-4 md:p-4 flex flex-col items-center gap-2 md:gap-2 transition-all min-h-[100px] md:min-h-[80px]">
                  <img src={emotion.icon} alt={emotion.label} className="w-14 h-14 md:w-12 md:h-12" />
                  <span className="text-white text-base md:text-sm font-medium">{emotion.label}</span>
                </button>)}
            </motion.div> : <motion.div key="tags-selection" initial={{
          opacity: 0,
          y: 10
        }} animate={{
          opacity: 1,
          y: 0
        }} exit={{
          opacity: 0,
          y: -10
        }} transition={{
          duration: 0.2
        }} className="flex flex-col">
              {/* Large emoji at top - matching mobile layout */}
              <div className="flex flex-col items-center mb-4">
                <img
                  src={selectedEmotion.icon}
                  alt={selectedEmotion.label}
                  className="w-20 h-20 mb-2"
                />
                <h2 className="text-white text-xl font-bold">
                  {selectedEmotion.label}
                </h2>
              </div>

              <div className="flex flex-wrap gap-2 mb-4 max-h-[140px] md:max-h-[180px] overflow-y-auto pr-1 justify-center">
                {EMOTION_TAGS[selectedEmotion.key].map(tag => <button key={tag} onClick={() => handleTagToggle(tag)} className={`px-3 py-2 rounded-full text-xs md:text-sm font-medium transition-all min-h-[36px] ${selectedTags.includes(tag) ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white/80 hover:bg-white/20'}`}>
                    {tag}
                  </button>)}
              </div>

              <div className="bg-white/5 rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <EyeOff className="w-4 h-4 text-white/60" />
                  <span className="text-white/80 text-sm">Share anonymously</span>
                </div>
                <button onClick={() => setIsAnonymous(!isAnonymous)} className={`w-12 h-7 rounded-full transition-colors relative ${isAnonymous ? 'bg-emerald-500' : 'bg-white/20'}`}>
                  <span className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${isAnonymous ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            </motion.div>}
        </AnimatePresence>
      </div>

      <div className="space-y-2 pt-4 mt-auto">
        <button onClick={handleMoodSubmit} disabled={!selectedEmotion} className="w-full h-12 md:h-14 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 disabled:bg-emerald-500/50 disabled:cursor-not-allowed rounded-xl text-white text-base md:text-lg font-bold transition-colors">
{isClockOut ? "Submit & Done" : "Submit & Enter Point of Sale"}
        </button>
        <button onClick={handleMoodSkip} className="w-full h-10 bg-transparent hover:bg-white/5 rounded-lg text-white/60 hover:text-white/80 text-sm font-medium transition-colors">
          Skip
        </button>
      </div>
    </motion.div>;

  // Render summary cards for clock in
  const renderClockInSummaryCards = () => <motion.div key="summary-cards" initial={{
    opacity: 0,
    x: 20
  }} animate={{
    opacity: 1,
    x: 0
  }} exit={{
    opacity: 0,
    x: -20
  }} transition={{
    duration: 0.2
  }} className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="space-y-2 md:space-y-3">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 md:p-4 flex items-center gap-3 md:gap-4">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-white/60 text-xs font-medium mb-0.5">Clocked In At</p>
              <p className="text-white text-lg md:text-xl font-bold">
                {format(clockInSummary!.clockInTime, "h:mm a")}
              </p>
            </div>
          </div>

          <div className="relative">
            <button
              onClick={() => { setShowSummaryRevenueCenterDropdown(!showSummaryRevenueCenterDropdown); setShowSummaryJobTypeDropdown(false); }}
              className="w-full bg-white/10 backdrop-blur-sm rounded-xl p-3 md:p-4 flex items-center gap-3 md:gap-4 transition-colors hover:bg-white/15"
            >
              <div className="w-10 h-10 md:w-12 md:h-12 bg-white/20 rounded-xl flex items-center justify-center">
                {(() => { const Icon = REVENUE_CENTER_ICONS[clockInSummary!.revenueCenter] || MapPin; return <Icon className="w-5 h-5 md:w-6 md:h-6 text-white" />; })()}
              </div>
              <div className="flex-1 text-left">
                <p className="text-white/60 text-xs font-medium mb-0.5">Revenue Center</p>
                <p className="text-white text-lg md:text-xl font-bold">
                  {clockInSummary!.revenueCenter}
                </p>
              </div>
              <ChevronDown className={`w-5 h-5 text-white/60 transition-transform ${showSummaryRevenueCenterDropdown ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {showSummaryRevenueCenterDropdown && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.15 }}
                  className="mt-2 overflow-hidden"
                >
                  <div className="grid grid-cols-3 gap-2">
                    {revenueCenters.map(center => {
                      const Icon = REVENUE_CENTER_ICONS[center] || MapPin;
                      const isSelected = clockInSummary!.revenueCenter === center;
                      return (
                        <button
                          key={center}
                          onClick={() => {
                            setClockInSummary(prev => prev ? { ...prev, revenueCenter: center } : prev);
                            setShowSummaryRevenueCenterDropdown(false);
                          }}
                          className={`rounded-xl p-3 flex flex-col items-center gap-2 transition-all min-h-[80px] ${
                            isSelected
                              ? 'bg-white/20 border border-white/40'
                              : 'bg-white/10 hover:bg-white/20 active:bg-white/30'
                          }`}
                        >
                          <Icon className="w-7 h-7 text-white" />
                          <span className="text-[11px] font-medium text-center text-white">{center}</span>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="relative">
            <button
              onClick={() => { setShowSummaryJobTypeDropdown(!showSummaryJobTypeDropdown); setShowSummaryRevenueCenterDropdown(false); }}
              className="w-full bg-white/10 backdrop-blur-sm rounded-xl p-3 md:p-4 flex items-center gap-3 md:gap-4 transition-colors hover:bg-white/15"
            >
              <div className="w-10 h-10 md:w-12 md:h-12 bg-white/20 rounded-xl flex items-center justify-center">
                {JOB_TYPE_ICONS[clockInSummary!.jobType] ? (
                  <img src={JOB_TYPE_ICONS[clockInSummary!.jobType]!} alt={clockInSummary!.jobType} className="w-5 h-5 md:w-6 md:h-6" style={{ filter: 'invert(1) brightness(2)' }} />
                ) : (
                  <Briefcase className="w-5 h-5 md:w-6 md:h-6 text-white" />
                )}
              </div>
              <div className="flex-1 text-left">
                <p className="text-white/60 text-xs font-medium mb-0.5">Job Type</p>
                <p className="text-white text-lg md:text-xl font-bold">
                  {clockInSummary!.jobType}
                </p>
              </div>
              <ChevronDown className={`w-5 h-5 text-white/60 transition-transform ${showSummaryJobTypeDropdown ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {showSummaryJobTypeDropdown && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.15 }}
                  className="mt-2 overflow-hidden"
                >
                  <div className="grid grid-cols-3 gap-2">
                    {summaryAvailableJobTypes.map(job => {
                      const isSelected = clockInSummary!.jobType === job;
                      return (
                        <button
                          key={job}
                          onClick={() => {
                            setClockInSummary(prev => prev ? { ...prev, jobType: job } : prev);
                            setShowSummaryJobTypeDropdown(false);
                          }}
                          className={`rounded-xl p-3 flex flex-col items-center gap-2 transition-all min-h-[80px] ${
                            isSelected
                              ? 'bg-white/20 border border-white/40'
                              : 'bg-white/10 hover:bg-white/20 active:bg-white/30'
                          }`}
                        >
                          {JOB_TYPE_ICONS[job] ? (
                            <img src={JOB_TYPE_ICONS[job]!} alt={job} className="w-7 h-7" style={{ filter: 'invert(1) brightness(2)' }} />
                          ) : (
                            <Briefcase className="w-7 h-7 text-white" />
                          )}
                          <span className="text-[11px] font-medium text-center text-white">{job}</span>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="pt-4 mt-auto">
        <button onClick={handleEnterPOSFromSummary} className="w-full h-12 md:h-14 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 rounded-xl text-white text-base md:text-lg font-bold transition-colors">
          Enter Point of Sale
        </button>
      </div>
    </motion.div>;

  // Render summary cards for clock out
  const renderClockOutSummaryCards = () => <motion.div key="clockout-summary-cards" initial={{
    opacity: 0,
    x: 20
  }} animate={{
    opacity: 1,
    x: 0
  }} exit={{
    opacity: 0,
    x: -20
  }} transition={{
    duration: 0.2
  }} className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="space-y-2 md:space-y-3">
          {/* Total Hours Worked */}
          <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3 md:p-4 flex items-center gap-3 md:gap-4 border border-white/20">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-amber-500/30 rounded-xl flex items-center justify-center">
              <Timer className="w-5 h-5 md:w-6 md:h-6 text-amber-300" />
            </div>
            <div className="flex-1">
              <p className="text-white/60 text-xs font-medium mb-0.5">Total Hours Worked</p>
              <p className="text-white text-xl md:text-2xl font-bold">
                {formatDuration(clockOutSummary!.totalMinutes)}
              </p>
            </div>
          </div>

          {/* Break Duration */}
          {clockOutSummary!.breakMinutes > 0 && <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 md:p-4 flex items-center gap-3 md:gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-orange-500/30 rounded-xl flex items-center justify-center">
                <Coffee className="w-5 h-5 md:w-6 md:h-6 text-orange-300" />
              </div>
              <div className="flex-1">
                <p className="text-white/60 text-xs font-medium mb-0.5">Break Time</p>
                <p className="text-white text-lg md:text-xl font-bold">
                  {formatDuration(clockOutSummary!.breakMinutes)}
                </p>
              </div>
            </div>}

          {/* Shift Duration */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 md:p-4 flex items-center gap-3 md:gap-4">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-white/60 text-xs font-medium mb-0.5">Shift Duration</p>
              <p className="text-white text-base md:text-lg font-semibold">
                {format(clockOutSummary!.clockInTime, "h:mm a")} — {format(clockOutSummary!.clockOutTime, "h:mm a")}
              </p>
            </div>
          </div>

          {/* Revenue Center */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 md:p-4 flex items-center gap-3 md:gap-4">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <MapPin className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-white/60 text-xs font-medium mb-0.5">Revenue Center</p>
              <p className="text-white text-lg md:text-xl font-bold">
                {clockOutSummary!.revenueCenter}
              </p>
            </div>
          </div>

          {/* Job Type */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 md:p-4 flex items-center gap-3 md:gap-4">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Briefcase className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-white/60 text-xs font-medium mb-0.5">Job Type</p>
              <p className="text-white text-lg md:text-xl font-bold">
                {clockOutSummary!.jobType}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-4 mt-auto">
        <button onClick={handleEnterPOSFromSummary} className="w-full h-12 md:h-14 bg-neutral-700 hover:bg-neutral-600 active:bg-neutral-500 rounded-xl text-white text-base md:text-lg font-bold transition-colors">
          Done
        </button>
      </div>
    </motion.div>;

  // Handle manager PIN digit press
  const handleManagerPinDigit = async (digit: string) => {
    if (managerPin.length >= 4 || managerPinError) return;
    const newPin = managerPin + digit;
    setManagerPin(newPin);

    if (newPin.length === 4) {
      const employee = await lookupEmployeeByPin(newPin);
      if (employee) {
        // PIN matched an employee in the database - unlock
        resetFailedAttempts();
        setPinLockedOut(false);
        setManagerPin("");
        setManagerPinError(false);
        setPin("");
        setError("");
      } else {
        setManagerPinError(true);
        setTimeout(() => {
          setManagerPin("");
          setManagerPinError(false);
        }, 800);
      }
    }
  };

  const handleManagerPinDelete = () => {
    if (managerPinError) return;
    setManagerPin((prev) => prev.slice(0, -1));
  };

  const handleManagerPinClear = () => {
    setManagerPin("");
    setManagerPinError(false);
  };

  // Render manager PIN lockout screen
  const renderManagerPinLockout = () => (
    <motion.div
      key="manager-pin-lockout"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col items-center h-full"
    >
      {/* Lock icon */}
      <div className="w-16 h-16 rounded-full bg-destructive/15 flex items-center justify-center mb-3">
        <ShieldAlert className="w-8 h-8 text-destructive" />
      </div>

      <h3 className="text-foreground text-lg font-bold mb-1 text-center">Device Locked</h3>
      <p className="text-muted-foreground text-sm text-center mb-4">
        Too many incorrect PIN attempts. Enter Manager PIN to unlock.
      </p>

      {/* Manager PIN dots */}
      <div className="flex items-center justify-center gap-3 mb-4">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={`text-3xl font-bold select-none transition-colors duration-200 ${
              managerPinError
                ? i < managerPin.length ? "text-destructive" : "text-muted-foreground/30"
                : i < managerPin.length ? "text-foreground" : "text-muted-foreground/30"
            }`}
          >
            ✱
          </span>
        ))}
      </div>

      {managerPinError && (
        <p className="text-destructive text-sm mb-2 text-center">Incorrect Manager PIN</p>
      )}

      {/* Numeric keypad */}
      <div className="grid grid-cols-3 gap-2 w-full max-w-[280px]">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
          <button
            key={digit}
            onClick={() => handleManagerPinDigit(digit)}
            className="h-14 keypad-btn-3d rounded-lg text-black text-xl font-semibold"
          >
            {digit}
          </button>
        ))}
        <button
          onClick={handleManagerPinClear}
          className="h-14 keypad-btn-3d rounded-lg text-red-500 text-xl font-bold"
        >
          C
        </button>
        <button
          onClick={() => handleManagerPinDigit("0")}
          className="h-14 keypad-btn-3d rounded-lg text-black text-xl font-semibold"
        >
          0
        </button>
        <button
          onClick={handleManagerPinDelete}
          className="h-14 keypad-btn-3d rounded-lg text-black text-base font-bold"
        >
          ⌫
        </button>
      </div>
    </motion.div>
  );

  // Render keypad
  const renderKeypad = () => <motion.div key="keypad" initial={{
    opacity: 0,
    y: -20
  }} animate={{
    opacity: 1,
    y: 0
  }} exit={{
    opacity: 0,
    y: 20
  }} transition={{
    duration: 0.3
  }} className="flex flex-col h-full">
      {/* Mobile: Show compact date/time header - visible only on small screens */}
      <div className="text-center mb-3 md:hidden">
        <p className="text-white/60 text-sm">{format(currentTime, "EEEE, MMMM d, yyyy")}</p>
        <p className="text-white text-2xl font-bold">
          {format(currentTime, "h:mm")}
          <span className="text-white/60 text-lg ml-1">{format(currentTime, "a")}</span>
        </p>
      </div>

      <div className="text-center mb-2">
        <p className="text-white/60 text-sm">
          {isClockedIn ? "Enter PIN to Clock Out" : "Enter PIN to Clock In"}
        </p>
      </div>

      <div className="flex justify-center gap-4 md:gap-6 mb-3">
        {Array.from({
        length: PIN_LENGTH
      }).map((_, i) => <div key={i} className="w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 flex items-center justify-center">
            {i < pin.length ? <img src={pinIndicatorFilledIcon} alt="PIN digit entered" className={`w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 ${error ? "opacity-50" : ""}`} /> : <img src={pinIndicatorIcon} alt="PIN digit placeholder" className="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12" />}
          </div>)}
      </div>

      {error && <p className="text-red-500 text-center text-sm mb-1">{error}</p>}
      {warning && (
        <div className="bg-amber-500/15 border border-amber-500/30 rounded-lg px-3 py-2 mb-2 mx-2">
          <p className="text-amber-400 text-center text-xs font-medium">{warning}</p>
        </div>
      )}

      <div className="flex-1 overflow-y-auto min-h-0 relative">
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => <button key={num} onClick={() => handleKeyPress(num.toString())} disabled={isVerifying} className="h-14 md:h-16 lg:h-[72px] keypad-btn-3d rounded-lg text-black text-xl md:text-2xl font-semibold disabled:opacity-50">
              {num}
            </button>)}
          <button onClick={handleClear} disabled={isVerifying} className="h-14 md:h-16 lg:h-[72px] keypad-btn-3d rounded-lg text-red-500 text-xl md:text-2xl font-bold disabled:opacity-50">
            C
          </button>
          <button onClick={() => handleKeyPress("0")} disabled={isVerifying} className="h-14 md:h-16 lg:h-[72px] keypad-btn-3d rounded-lg text-black text-xl md:text-2xl font-semibold disabled:opacity-50">
            0
          </button>
          <button onClick={handleEnter} disabled={isVerifying || pin.length !== PIN_LENGTH} className="h-14 md:h-16 lg:h-[72px] keypad-btn-3d-enter rounded-lg text-black text-base md:text-lg font-bold disabled:opacity-50">
            ENTER
          </button>
        </div>

        <div className={`grid ${SettingsManager.getControlCenterSettings().hideBreakButton ? 'grid-cols-2' : 'grid-cols-3'} gap-2 mt-2`}>
          <button onClick={handleClockOut} disabled={isVerifying || pin.length !== PIN_LENGTH || !isClockedIn} className="h-12 md:h-14 lg:h-16 keypad-btn-3d-clockout rounded-lg text-white text-xs md:text-sm lg:text-base font-bold disabled:cursor-not-allowed">
            Clock Out
          </button>
          {!SettingsManager.getControlCenterSettings().hideBreakButton && (
            <button onClick={handleBreak} disabled={isVerifying || pin.length !== PIN_LENGTH || !isClockedIn} className="h-12 md:h-14 lg:h-16 keypad-btn-3d-break rounded-lg text-black text-xs md:text-sm lg:text-base font-bold disabled:cursor-not-allowed">
              Break
            </button>
          )}
          <button onClick={handleClockIn} disabled={isVerifying || pin.length !== PIN_LENGTH || isClockedIn} className="h-12 md:h-14 lg:h-16 keypad-btn-3d-clockin rounded-lg text-white text-xs md:text-sm lg:text-base font-bold disabled:cursor-not-allowed">
            Clock In
          </button>
        </div>

        <div className="relative grid grid-cols-3 gap-2 mt-2">
          <button 
            onClick={handleFingerprintPress}
            className="h-12 md:h-14 lg:h-16 keypad-btn-3d-dark rounded-lg flex items-center justify-center"
          >
            <Fingerprint className="w-6 h-6 md:w-7 md:h-7 text-white" />
          </button>
          
          <div className="relative">
            <button onClick={() => {
              setShowRevenueCenterSelector(!showRevenueCenterSelector);
            }} className="w-full h-12 md:h-14 lg:h-16 keypad-btn-3d-revenue rounded-lg flex flex-col items-center justify-center px-2">
              <span className="text-neutral-500 text-[10px] font-medium uppercase tracking-wide">Revenue Center</span>
              <span className="text-black text-xs md:text-sm font-semibold truncate max-w-full flex items-center gap-1">
                {selectedRevenueCenter}
                <ChevronDown className="w-3 h-3" />
              </span>
            </button>
            
            {/* Revenue Center Grid - positioned above button */}
            <AnimatePresence>
              {showRevenueCenterSelector && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.15 }}
                  className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-[280px] md:w-[320px] bg-[#1a1a1e] rounded-xl shadow-2xl border border-white/10 z-50 p-3"
                >
                  <p className="text-white/60 text-xs font-medium mb-2 text-center">Select Revenue Center</p>
                  <div className="grid grid-cols-3 gap-2">
                    {revenueCenters.map(center => {
                      const Icon = REVENUE_CENTER_ICONS[center] || MapPin;
                      const isSelected = selectedRevenueCenter === center;
                      return (
                        <button 
                          key={center} 
                          onClick={() => {
                            setSelectedRevenueCenter(center);
                            setShowRevenueCenterSelector(false);
                          }} 
                          className={`rounded-xl p-2.5 flex flex-col items-center gap-1.5 transition-all min-h-[60px] ${
                            isSelected
                              ? 'bg-white/20 border border-white/40'
                              : 'bg-white/10 hover:bg-white/20 active:bg-white/30'
                          }`}
                        >
                          <Icon className="w-5 h-5 text-white" />
                          <span className="text-[10px] font-medium text-center leading-tight text-white">{center}</span>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <button 
            onClick={handleFaceIDPress}
            className="h-12 md:h-14 lg:h-16 keypad-btn-3d-dark rounded-lg flex items-center justify-center"
          >
            <ScanFace className="w-6 h-6 md:w-7 md:h-7 text-white" />
          </button>
        </div>

        <button onClick={handleLogoutClick} className="w-full h-12 md:h-14 mt-2 keypad-btn-3d-outlined rounded-lg text-white text-base md:text-lg font-bold">
          LOGOUT
        </button>
      </div>
    </motion.div>;

  // Render job selection screen (after PIN validation)
  const renderJobSelection = () => (
    <motion.div
      key="job-selection"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col h-full"
    >
      {/* Back button */}
      <div className="self-start mb-3">
        <button
          onClick={handleJobSelectionBack}
          className="w-10 h-10 min-h-[44px] min-w-[44px] bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Welcome header with profile image */}
      <div className="text-center mb-4 flex-shrink-0">
        <div className="w-16 h-16 rounded-full mx-auto mb-2 overflow-hidden border-2 border-white/20">
          {validatedEmployee?.avatar ? (
            <img 
              src={validatedEmployee.avatar} 
              alt={validatedEmployee.name} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-emerald-500/20 flex items-center justify-center">
              <span className="text-2xl font-bold text-white">
                {validatedEmployee?.name?.charAt(0) || "?"}
              </span>
            </div>
          )}
        </div>
        <h2 className="text-white text-xl font-bold mb-1">
          Welcome, {validatedEmployee?.name}
        </h2>
        <p className="text-white/60 text-sm">
          Select your role for this shift
        </p>
      </div>

      {/* Job type grid - matching emotion selection style */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="grid grid-cols-2 gap-3">
          {validatedEmployee?.assignedJobTypes.map(job => (
            <button
              key={job}
              onClick={() => handleJobSelection(job)}
              className="bg-white/10 hover:bg-white/20 active:bg-white/30 backdrop-blur-sm rounded-xl p-4 flex flex-col items-center gap-2 transition-all min-h-[100px]"
            >
              {JOB_TYPE_ICONS[job] ? (
                <img src={JOB_TYPE_ICONS[job]!} alt={job} className="w-12 h-12 invert brightness-0 filter" style={{ filter: 'invert(1) brightness(2)' }} />
              ) : (
                <Briefcase className="w-12 h-12 text-white" />
              )}
              <span className="text-white text-base font-medium">{job}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Cancel button */}
      <div className="pt-4 mt-auto">
        <button
          onClick={handleJobSelectionBack}
          className="w-full h-10 bg-transparent hover:bg-white/5 rounded-lg text-white/60 hover:text-white/80 text-sm font-medium transition-colors"
        >
          Cancel
        </button>
      </div>
    </motion.div>
  );

  // Mobile fullscreen tag selection layout - maintains existing dark theme
  const renderMobileTagSelection = (isClockOut: boolean) => (
    <motion.div
      key="mobile-tag-selection"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
      className="relative z-10 flex flex-col w-full h-full p-4"
    >
      {/* Back button - top left */}
      <div className="flex-shrink-0 mb-4">
        <button
          onClick={handleMoodBack}
          className="w-10 h-10 min-h-[44px] min-w-[44px] bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Large emoji and label at top */}
      <div className="flex-shrink-0 flex flex-col items-center mb-6">
        <img
          src={selectedEmotion!.icon}
          alt={selectedEmotion!.label}
          className="w-28 h-28 mb-3"
        />
        <h2 className="text-white text-2xl font-bold">
          {selectedEmotion!.label}
        </h2>
      </div>

      {/* Tag chips in the middle - scrollable */}
      <div className="flex-1 overflow-y-auto min-h-0 mb-4">
        <div className="flex flex-wrap gap-2 justify-center">
          {EMOTION_TAGS[selectedEmotion!.key].map(tag => (
            <button
              key={tag}
              onClick={() => handleTagToggle(tag)}
              className={`px-4 py-2.5 rounded-full text-sm font-medium transition-all min-h-[44px] ${
                selectedTags.includes(tag)
                  ? 'bg-emerald-500 text-white'
                  : 'bg-white/10 text-white/80 hover:bg-white/20'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Bottom section - Share anonymously toggle and Submit button */}
      <div className="flex-shrink-0 space-y-3">
        {/* Share anonymously row */}
        <div className="bg-white/5 rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <EyeOff className="w-4 h-4 text-white/60" />
            <span className="text-white/80 text-sm">Share anonymously</span>
          </div>
          <button
            onClick={() => setIsAnonymous(!isAnonymous)}
            className={`w-12 h-7 rounded-full transition-colors relative ${
              isAnonymous ? 'bg-emerald-500' : 'bg-white/20'
            }`}
          >
            <span
              className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${
                isAnonymous ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Submit button */}
        <button
          onClick={handleMoodSubmit}
          className="w-full h-14 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 rounded-xl text-white text-lg font-bold transition-colors"
        >
          {isClockOut ? "Submit & Done" : "Submit & Enter Point of Sale"}
        </button>
        
        {/* Skip button */}
        <button
          onClick={handleMoodSkip}
          className="w-full h-10 bg-transparent hover:bg-white/5 rounded-lg text-white/60 hover:text-white/80 text-sm font-medium transition-colors"
        >
          Skip
        </button>
      </div>
    </motion.div>
  );

  // Render mobile layout
  const renderMobileLayout = () => {
    // Fullscreen tag selection when emotion is selected
    if (showMoodCheckIn && selectedEmotion) {
      const isClockOut = !!clockOutSummary;
      return renderMobileTagSelection(isClockOut);
    }

    // Use centered layout when showing summary (clock in or clock out), top-aligned for keypad
    const showCenteredLayout = clockInSummary || clockOutSummary;
    
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className={`relative z-10 flex justify-center w-full h-full p-4 pb-6 overflow-y-auto ${showCenteredLayout ? 'items-center' : 'items-start pt-8'}`}
      >
        <div className="w-full max-w-[560px] bg-black/60 backdrop-blur-xl rounded-2xl p-5 flex flex-col max-h-[calc(100vh-56px)]">
          <AnimatePresence mode="wait">
            {clockInSummary ? (
              <motion.div
                key={showMoodCheckIn ? "mood-checkin" : "clock-in-summary"}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.25 }}
                className="flex flex-col flex-1 min-h-0"
              >
                {/* Back button - shown above header when mood check-in is active */}
                {showMoodCheckIn && (
                  <div className="self-start mb-3">
                    <button
                      onClick={handleMoodBack}
                      className="w-10 h-10 min-h-[44px] min-w-[44px] bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
                    >
                      <ArrowLeft className="w-5 h-5 text-white" />
                    </button>
                  </div>
                )}

                {/* Success Header - Hide on tag selection screen with animation */}
                <AnimatePresence mode="wait">
                  {!(showMoodCheckIn && selectedEmotion) && (
                    <motion.div
                      key="clock-in-header"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.15 }}
                      className={`text-center flex-shrink-0 overflow-hidden ${showMoodCheckIn ? 'mb-2' : 'mb-4'}`}
                    >
                      <div
                        className={`bg-emerald-500 rounded-full flex items-center justify-center mx-auto ${showMoodCheckIn ? 'w-10 h-10 mb-1' : 'w-14 h-14 mb-2'}`}
                      >
                        <Check className={`text-white ${showMoodCheckIn ? 'w-5 h-5' : 'w-7 h-7'}`} strokeWidth={3} />
                      </div>
                      <h2 className={`text-white font-bold ${showMoodCheckIn ? 'text-base mb-0' : 'text-xl mb-0.5'}`}>
                        Clocked In!
                      </h2>
                      <p className={`text-white/60 ${showMoodCheckIn ? 'text-xs' : 'text-sm'}`}>
                        Welcome back, {clockInSummary.employeeName}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex-1 min-h-0">
                  <AnimatePresence mode="wait">
                    {!showMoodCheckIn ? renderClockInSummaryCards() : renderMoodCheckIn(false)}
                  </AnimatePresence>
                </div>
              </motion.div>
            ) : clockOutSummary ? (
              <motion.div
                key={showMoodCheckIn ? "mood-checkin-out" : "clock-out-summary"}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.25 }}
                className="flex flex-col flex-1 min-h-0"
              >
                {/* Back button - shown above header when mood check-in is active */}
                {showMoodCheckIn && (
                  <div className="self-start mb-3">
                    <button
                      onClick={handleMoodBack}
                      className="w-10 h-10 min-h-[44px] min-w-[44px] bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
                    >
                      <ArrowLeft className="w-5 h-5 text-white" />
                    </button>
                  </div>
                )}

                {/* Clock Out Header - Hide on tag selection screen with animation */}
                <AnimatePresence mode="wait">
                  {!(showMoodCheckIn && selectedEmotion) && (
                    <motion.div
                      key="clock-out-header-mobile"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.15 }}
                      className={`text-center flex-shrink-0 overflow-hidden ${showMoodCheckIn ? 'mb-2' : 'mb-4'}`}
                    >
                      <div
                        className={`bg-red-500 rounded-full flex items-center justify-center mx-auto ${showMoodCheckIn ? 'w-10 h-10 mb-1' : 'w-14 h-14 mb-2'}`}
                      >
                        <LogOut className={`text-white ${showMoodCheckIn ? 'w-5 h-5' : 'w-7 h-7'}`} strokeWidth={2.5} />
                      </div>
                      <h2 className={`text-white font-bold ${showMoodCheckIn ? 'text-base mb-0' : 'text-xl mb-0.5'}`}>
                        Clocked Out!
                      </h2>
                      <p className={`text-white/60 ${showMoodCheckIn ? 'text-xs' : 'text-sm'}`}>
                        Great shift, {clockOutSummary.employeeName}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex-1 min-h-0">
                  <AnimatePresence mode="wait">
                    {!showMoodCheckIn ? renderClockOutSummaryCards() : renderMoodCheckIn(true)}
                  </AnimatePresence>
                </div>
              </motion.div>
            ) : showJobSelection && validatedEmployee ? (
              renderJobSelection()
            ) : showFingerprintScan ? (
              <FingerprintInlineAuth
                onCancel={handleFingerprintCancel}
                onSuccess={handleFingerprintSuccess}
                authType={isClockedIn ? 'clock_out' : 'clock_in'}
              />
            ) : showFaceIDScan ? (
              <FaceIDInlineAuth
                onCancel={handleFaceIDCancel}
                onSuccess={handleFaceIDSuccess}
                authType={isClockedIn ? 'clock_out' : 'clock_in'}
              />
            ) : (
              pinLockedOut ? renderManagerPinLockout() : renderKeypad()
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    );
  };

  // Render desktop/tablet layout
  const renderDesktopLayout = () => <motion.div initial={{
    opacity: 0,
    scale: 0.98
  }} animate={{
    opacity: 1,
    scale: 1
  }} exit={{
    opacity: 0,
    scale: 0.98
  }} transition={{
    duration: 0.25,
    ease: "easeOut"
  }} className="relative z-10 grid grid-cols-12 w-full h-full">
      {/* Left Info Panel */}
      <div className="col-span-4 flex flex-col justify-center items-start px-10 lg:px-16 bg-gradient-to-br from-black/30 to-transparent">
        <p className="text-white text-xl lg:text-2xl font-semibold mb-4 tracking-wide">
          {format(currentTime, "EEEE, MMMM d, yyyy")}
        </p>

        <div className="mb-8 flex items-baseline">
          <h1 className="text-white text-[80px] lg:text-[120px] xl:text-[160px] font-black leading-[0.85] tracking-tighter flex items-baseline">
            <span>{format(currentTime, "h")}</span>
            <span className="animate-pulse mx-1">:</span>
            <span>{format(currentTime, "mm")}</span>
          </h1>
          <span className="text-white/60 text-[32px] lg:text-[48px] xl:text-[64px] font-bold tracking-tight ml-3">
            {format(currentTime, "a")}
          </span>
        </div>

        <div className="flex items-center gap-4 mb-4">
          <span className="text-white text-5xl lg:text-6xl xl:text-7xl font-light">27°</span>
          <Sun className="w-12 h-12 lg:w-16 lg:h-16 text-amber-300" strokeWidth={1.5} />
        </div>

        <p className="text-white text-2xl lg:text-3xl xl:text-4xl font-bold tracking-wide">
          Bengaluru, Karnataka
        </p>
      </div>

      {/* Right Panel */}
      <div className="col-span-8 flex flex-col items-center justify-center p-6 py-8 overflow-y-auto">
        <AnimatePresence mode="wait">
          {clockInSummary ? <motion.div key={showMoodCheckIn ? "mood-checkin" : "clock-in-summary"} initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} exit={{
          opacity: 0,
          y: -20
        }} transition={{
          duration: 0.25
        }} className="w-full max-w-[540px] flex flex-col max-h-full">
              {/* Back button - shown above header when mood check-in is active */}
              {showMoodCheckIn && (
                <div className="self-start mb-3">
                  <button
                    onClick={handleMoodBack}
                    className="w-10 h-10 min-h-[44px] min-w-[44px] bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5 text-white" />
                  </button>
                </div>
              )}

              {/* Success Header - Hide on tag selection screen with animation */}
              <AnimatePresence mode="wait">
                {!(showMoodCheckIn && selectedEmotion) && (
                  <motion.div
                    key="clock-in-header-desktop"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.15 }}
                    className="text-center mb-4 flex-shrink-0 overflow-hidden"
                  >
                    <div className="w-14 h-14 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Check className="w-7 h-7 text-white" strokeWidth={3} />
                    </div>
                    <h2 className="text-white text-xl lg:text-2xl font-bold mb-0.5">
                      Clocked In!
                    </h2>
                    <p className="text-white/60 text-sm">
                      Welcome back, {clockInSummary.employeeName}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex-1 min-h-0">
                <AnimatePresence mode="wait">
                  {!showMoodCheckIn ? renderClockInSummaryCards() : renderMoodCheckIn(false)}
                </AnimatePresence>
              </div>
            </motion.div> : clockOutSummary ? <motion.div key={showMoodCheckIn ? "mood-checkin-out" : "clock-out-summary"} initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} exit={{
          opacity: 0,
          y: -20
        }} transition={{
          duration: 0.25
        }} className="w-full max-w-[540px] flex flex-col max-h-full">
              {/* Back button - shown above header when mood check-in is active */}
              {showMoodCheckIn && (
                <div className="self-start mb-3">
                  <button
                    onClick={handleMoodBack}
                    className="w-10 h-10 min-h-[44px] min-w-[44px] bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5 text-white" />
                  </button>
                </div>
              )}

              {/* Clock Out Header - Hide on tag selection screen with animation */}
              <AnimatePresence mode="wait">
                {!(showMoodCheckIn && selectedEmotion) && (
                  <motion.div
                    key="clock-out-header-desktop"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.15 }}
                    className="text-center mb-4 flex-shrink-0 overflow-hidden"
                  >
                    <div className="w-14 h-14 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-2">
                      <LogOut className="w-7 h-7 text-white" strokeWidth={2.5} />
                    </div>
                    <h2 className="text-white text-xl lg:text-2xl font-bold mb-0.5">
                      Clocked Out!
                    </h2>
                    <p className="text-white/60 text-sm">
                      Great shift, {clockOutSummary.employeeName}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex-1 min-h-0">
                <AnimatePresence mode="wait">
                  {!showMoodCheckIn ? renderClockOutSummaryCards() : renderMoodCheckIn(true)}
                </AnimatePresence>
              </div>
            </motion.div> : showJobSelection && validatedEmployee ? (
              <div className="w-full max-w-[540px]">
                {renderJobSelection()}
              </div>
            ) : showFingerprintScan ? (
              <div className="w-full max-w-[400px] relative h-[500px]">
                <FingerprintInlineAuth
                  onCancel={handleFingerprintCancel}
                  onSuccess={handleFingerprintSuccess}
                  authType={isClockedIn ? 'clock_out' : 'clock_in'}
                />
              </div>
            ) : showFaceIDScan ? (
              <div className="w-full max-w-[400px] relative h-[500px]">
                <FaceIDInlineAuth
                  onCancel={handleFaceIDCancel}
                  onSuccess={handleFaceIDSuccess}
                  authType={isClockedIn ? 'clock_out' : 'clock_in'}
                />
              </div>
            ) : (
              <div className="w-full max-w-[400px]">
                {pinLockedOut ? renderManagerPinLockout() : renderKeypad()}
              </div>
            )}
        </AnimatePresence>
      </div>
    </motion.div>;
  return (
    <>
      <AnimatePresence>
        <motion.div initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} exit={{
        opacity: 0
      }} className="fixed inset-0 z-[9999] flex" style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0
      }}>
          {/* Background */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />

          {/* Conditionally render mobile OR desktop layout based on JS detection */}
          {isMobile ? renderMobileLayout() : renderDesktopLayout()}
        </motion.div>
      </AnimatePresence>

      {/* Logout Confirmation Dialog */}
      <AppleAlertDialog
        open={showLogoutConfirm}
        onOpenChange={setShowLogoutConfirm}
        onConfirm={handleLogoutConfirm}
        title="Log Out Device"
        description="This will end the device session and return to the device selection screen. Are you sure?"
        cancelText="Cancel"
        confirmText="Log Out"
      />
    </>
  );
};
export default ClockInOverlay;