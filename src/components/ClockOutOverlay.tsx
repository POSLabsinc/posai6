import { useState, useEffect, useCallback } from "react";
import { format, differenceInMinutes } from "date-fns";
import { Sun, Fingerprint, ScanFace, Check, Clock, MapPin, Briefcase, Timer, Coffee, ArrowLeft, EyeOff, LogOut, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import AppleAlertDialog from "@/components/AppleAlertDialog";
import FingerprintAuthModal, { FingerprintInlineAuth } from "@/components/FingerprintAuthModal";
import { FaceIDInlineAuth } from "@/components/FaceIDAuthModal";
import { ClockOutValidationModal } from "@/components/ClockOutValidationModal";
import { ClockOutValidationMobile } from "@/components/ClockOutValidationMobile";
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
import { REVENUE_CENTERS, RevenueCenterIcon } from "@/components/RevenueCenterIcon";

interface ClockOutOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onClockOut: () => void;
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

interface ClockInSummary {
  clockInTime: Date;
  revenueCenter: string;
  jobType: string;
  employeeName: string;
}

// Employee interface with assigned job types
interface Employee {
  id: string;
  name: string;
  assignedJobTypes: string[];
  revenueCenter: string;
  avatar?: string;
}

// Mock employee data (would come from API in production)
const EMPLOYEES: Record<string, Employee> = {
  "1234": {
    id: "emp_001",
    name: "John Smith",
    assignedJobTypes: ["Server", "Host", "Bartender", "Manager", "Barista", "Runner"],
    revenueCenter: "Dine Center",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face"
  },
  "5678": {
    id: "emp_002",
    name: "Sarah Kim",
    assignedJobTypes: ["Bartender", "Manager", "Server", "Host", "Barista", "Runner"],
    revenueCenter: "Bar Area",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face"
  },
  "9999": {
    id: "emp_003",
    name: "Mike Johnson",
    assignedJobTypes: ["Manager", "Server", "Host", "Bartender", "Barista", "Runner"],
    revenueCenter: "Main Hall",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"
  }
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

const ENABLE_MOOD_CHECKIN = true;
const PIN_LENGTH = 4;
const revenueCenters = REVENUE_CENTERS;

export const ClockOutOverlay = ({
  isOpen,
  onClose,
  onClockOut
}: ClockOutOverlayProps) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [selectedRevenueCenter, setSelectedRevenueCenter] = useState("Dine Center");
  const [showRevenueCenterSelector, setShowRevenueCenterSelector] = useState(false);
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [clockOutSummary, setClockOutSummary] = useState<ClockOutSummary | null>(null);
  const [clockInSummary, setClockInSummary] = useState<ClockInSummary | null>(null);

  // Two-step clock-in state
  const [validatedEmployee, setValidatedEmployee] = useState<Employee | null>(null);
  const [showJobSelection, setShowJobSelection] = useState(false);
  const [selectedJobType, setSelectedJobType] = useState("Server");

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
  
  // Clock out validation modal state
  const [showClockOutValidation, setShowClockOutValidation] = useState(false);
  const [validatedClockOutEmployee, setValidatedClockOutEmployee] = useState<{
    name: string;
    avatar?: string;
    clockInTime: Date;
  } | null>(null);
  
  // Track whether checks have been resolved in this session
  const [checksResolved, setChecksResolved] = useState(false);
  
  // Mock function to check if employee has open/unpaid checks
  const hasOpenOrUnpaidChecks = (): boolean => {
    // If checks were already resolved in this session, skip validation
    if (checksResolved) return false;
    // In production, this would check the actual database
    // For demo, return true to show the validation modal
    return true;
  };
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    document.body.dataset.clockScreenOpen = isOpen ? "true" : "false";
    window.dispatchEvent(
      new CustomEvent("clock-screen-visibility-change", {
        detail: { isOpen },
      })
    );

    return () => {
      document.body.dataset.clockScreenOpen = "false";
      window.dispatchEvent(
        new CustomEvent("clock-screen-visibility-change", {
          detail: { isOpen: false },
        })
      );
    };
  }, [isOpen]);

  // Check if user is clocked in and reset state when overlay opens
  useEffect(() => {
    if (isOpen) {
      setPin("");
      setError("");
      setIsVerifying(false);
      setClockOutSummary(null);
      setClockInSummary(null);
      setShowMoodCheckIn(false);
      setSelectedEmotion(null);
      setSelectedTags([]);
      setIsAnonymous(false);
      setValidatedEmployee(null);
      setShowJobSelection(false);
      setShowClockOutValidation(false);
      setValidatedClockOutEmployee(null);
      setChecksResolved(false);
      const sessionData = localStorage.getItem("pos_session");
      setIsClockedIn(!!sessionData);
    }
  }, [isOpen]);

  // Handle keyboard input
  useEffect(() => {
    if (!isOpen || clockOutSummary || clockInSummary || showMoodCheckIn || showJobSelection) return;
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
  }, [isOpen, pin, isVerifying, clockOutSummary, clockInSummary, showMoodCheckIn, showJobSelection]);

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

  const handleEnter = useCallback(() => {
    if (pin.length !== PIN_LENGTH) {
      setError("Please enter a 4-digit PIN");
      return;
    }
    setIsVerifying(true);
    setTimeout(() => {
      if (pin === "1234" || pin === "1111") {
        onClose();
      } else {
        setError("Invalid PIN. Please try again.");
        setPin("");
      }
      setIsVerifying(false);
    }, 500);
  }, [pin, onClose]);

  const handleClockIn = () => {
    if (pin.length !== PIN_LENGTH) {
      setError("Please enter your PIN first");
      return;
    }
    setIsVerifying(true);
    setTimeout(() => {
      const employee = EMPLOYEES[pin];
      
      if (employee) {
        // PIN valid - store employee and check job types
        setValidatedEmployee(employee);
        setSelectedRevenueCenter(employee.revenueCenter);
        
        // If only one job type, auto-select and complete clock-in
        if (employee.assignedJobTypes.length === 1) {
          completeClockIn(employee, employee.assignedJobTypes[0]);
        } else {
          // Multiple job types - show selection screen
          setShowJobSelection(true);
        }
      } else {
        setError("Invalid PIN. Please try again.");
        setPin("");
      }
      setIsVerifying(false);
    }, 500);
  };

  const handleJobSelection = (job: string) => {
    if (validatedEmployee) {
      setSelectedJobType(job);
      completeClockIn(validatedEmployee, job);
    }
  };

  const completeClockIn = (employee: Employee, jobType: string) => {
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

  const handleClockOut = () => {
    if (pin.length !== PIN_LENGTH) {
      setError("Please enter your PIN first");
      return;
    }
    setIsVerifying(true);
    setTimeout(() => {
      if (pin === "1234") {
        const sessionData = localStorage.getItem("pos_session");
        
        // Check if employee has open or unpaid checks
        if (hasOpenOrUnpaidChecks()) {
          // Show validation modal instead of proceeding with clock out
          const session = sessionData ? JSON.parse(sessionData) : null;
          setValidatedClockOutEmployee({
            name: session?.employeeName || "John Smith",
            avatar: EMPLOYEES["1234"]?.avatar,
            clockInTime: session ? new Date(session.clockInTime) : new Date(Date.now() - 8 * 60 * 60 * 1000)
          });
          setShowClockOutValidation(true);
          setIsVerifying(false);
          return;
        }
        
        // No open checks - proceed with normal clock out
        proceedWithClockOut();
      } else {
        setError("Invalid PIN. Please try again.");
        setPin("");
      }
      setIsVerifying(false);
    }, 500);
  };

  // Extracted clock out logic for reuse
  const proceedWithClockOut = () => {
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
        jobType: session.jobType || "Server",
        employeeName: session.employeeName || "John Smith",
        totalMinutes: Math.max(0, totalMinutes),
        breakMinutes
      });
    } else {
      // Fallback if no session data
      const clockInTime = new Date(clockOutTime.getTime() - 8 * 60 * 60 * 1000);
      setClockOutSummary({
        clockInTime,
        clockOutTime,
        revenueCenter: selectedRevenueCenter,
        jobType: "Server",
        employeeName: "John Smith",
        totalMinutes: 8 * 60 - 30,
        breakMinutes: 30
      });
    }
    setIsClockedIn(false);
    setShowClockOutValidation(false);
    setValidatedClockOutEmployee(null);
  };

  const handleBreak = () => {
    if (pin.length !== PIN_LENGTH) {
      setError("Please enter your PIN first");
      return;
    }
    setIsVerifying(true);
    setTimeout(() => {
      if (pin === "1234") {
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
      } else {
        setError("Invalid PIN. Please try again.");
        setPin("");
      }
      setIsVerifying(false);
    }, 500);
  };

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const handleLogoutConfirm = () => {
    setShowLogoutConfirm(false);
    localStorage.removeItem("pos_device_session");
    localStorage.removeItem("pos_session");
    onClose();
    navigate("/login");
  };

  const handleDoneFromSummary = () => {
    if (ENABLE_MOOD_CHECKIN && !SettingsManager.getControlCenterSettings().hideEmployeeFeedback && (clockOutSummary || clockInSummary) && !showMoodCheckIn) {
      setShowMoodCheckIn(true);
      return;
    }
    const wasClockOut = !!clockOutSummary;
    // Reset and close overlay so ClockInOverlay appears
    setClockOutSummary(null);
    setClockInSummary(null);
    setShowMoodCheckIn(false);
    setSelectedEmotion(null);
    setSelectedTags([]);
    setIsAnonymous(false);
    setPin("");
    if (wasClockOut) {
      // Ensure session is cleared before closing
      localStorage.removeItem("pos_session");
    }
    onClose();
    if (wasClockOut) {
      // Notify Layout to show the Clock In PIN pad overlay
      window.dispatchEvent(new Event("pos_session_changed"));
      requestAnimationFrame(() => {
        window.dispatchEvent(new Event("pos_session_changed"));
      });
    }
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
      employeeId: isAnonymous ? null : session.employeeId || 'emp_001',
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
      setClockOutSummary(null);
      setPin("");
      localStorage.removeItem("pos_session");
      onClose();
      requestAnimationFrame(() => {
        window.dispatchEvent(new Event("pos_session_changed"));
      });
    } else {
      // After Clock In, close overlay
      setClockInSummary(null);
      onClose();
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
      employeeId: session.employeeId || 'emp_001',
      context: isClockOut ? 'clock_out' : 'clock_in'
    };
    console.log('Mood Check-in Skip Event:', skipEvent);

    // Reset mood check-in state
    setShowMoodCheckIn(false);
    setSelectedEmotion(null);
    setSelectedTags([]);
    setIsAnonymous(false);
    if (isClockOut) {
      setClockOutSummary(null);
      setPin("");
      localStorage.removeItem("pos_session");
      onClose();
      requestAnimationFrame(() => {
        window.dispatchEvent(new Event("pos_session_changed"));
      });
    } else {
      // After Clock In, close overlay
      setClockInSummary(null);
      onClose();
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
    
    // Get session data
    const sessionData = localStorage.getItem("pos_session");
    const session = sessionData ? JSON.parse(sessionData) : null;
    
    // Check if employee has open or unpaid checks
    if (hasOpenOrUnpaidChecks()) {
      setValidatedClockOutEmployee({
        name: session?.employeeName || employee.name,
        avatar: employee.avatar,
        clockInTime: session ? new Date(session.clockInTime) : new Date(Date.now() - 8 * 60 * 60 * 1000)
      });
      setShowClockOutValidation(true);
      return;
    }
    
    // No open checks - proceed with clock out
    proceedWithClockOut();
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
    
    // Get session data
    const sessionData = localStorage.getItem("pos_session");
    const session = sessionData ? JSON.parse(sessionData) : null;
    
    // Check if employee has open or unpaid checks
    if (hasOpenOrUnpaidChecks()) {
      setValidatedClockOutEmployee({
        name: session?.employeeName || employee.name,
        avatar: employee.avatar,
        clockInTime: session ? new Date(session.clockInTime) : new Date(Date.now() - 8 * 60 * 60 * 1000)
      });
      setShowClockOutValidation(true);
      return;
    }
    
    // No open checks - proceed with clock out
    proceedWithClockOut();
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

  // Render mood check-in for desktop/landscape
  const renderMoodCheckIn = () => (
    <motion.div
      key="mood-checkin-module"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col h-full"
    >
      {/* Back button - shown at top for both emoji and chip selection on desktop/landscape */}
      {!isMobile && (
        <div className="self-start mb-3 flex-shrink-0">
          <button
            onClick={handleMoodBack}
            className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
        </div>
      )}

      {/* Desktop: Header for mood check-in context - Hide on tag selection screen with animation */}
      {!isMobile && (
        <AnimatePresence mode="wait">
          {!selectedEmotion && (
            <motion.div
              key="clock-header-in-mood"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.15 }}
              className="text-center mb-4 flex-shrink-0 overflow-hidden"
            >
              {clockOutSummary ? (
                <>
                  <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-2">
                    <LogOut className="w-6 h-6 text-white" strokeWidth={2.5} />
                  </div>
                  <h2 className="text-white text-xl font-bold mb-0.5">
                    Clocked Out!
                  </h2>
                  <p className="text-white/60 text-sm">
                    Great shift, {clockOutSummary?.employeeName || "Team Member"}
                  </p>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Check className="w-6 h-6 text-white" strokeWidth={2.5} />
                  </div>
                  <h2 className="text-white text-xl font-bold mb-0.5">
                    Clocked In!
                  </h2>
                  <p className="text-white/60 text-sm">
                    Welcome, {clockInSummary?.employeeName || "Team Member"}
                  </p>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      )}

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
          {!selectedEmotion ? (
            <motion.div
              key="emotion-grid"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-3"
            >
              {EMOTIONS.map(emotion => (
                <button
                  key={emotion.key}
                  onClick={() => handleEmotionSelect(emotion)}
                  className="bg-white/10 hover:bg-white/20 active:bg-white/30 backdrop-blur-sm rounded-xl p-4 md:p-4 flex flex-col items-center gap-2 md:gap-2 transition-all min-h-[100px] md:min-h-[80px]"
                >
                  <img src={emotion.icon} alt={emotion.label} className="w-14 h-14 md:w-12 md:h-12" />
                  <span className="text-white text-base md:text-sm font-medium">{emotion.label}</span>
                </button>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="tags-selection"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col"
            >
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
                {EMOTION_TAGS[selectedEmotion.key].map(tag => (
                  <button
                    key={tag}
                    onClick={() => handleTagToggle(tag)}
                    className={`px-3 py-2 rounded-full text-xs md:text-sm font-medium transition-all min-h-[36px] ${
                      selectedTags.includes(tag)
                        ? 'bg-emerald-500 text-white'
                        : 'bg-white/10 text-white/80 hover:bg-white/20'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>

              <div className="bg-white/5 rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <EyeOff className="w-4 h-4 text-white/60" />
                  <span className="text-white/80 text-sm">Share anonymously</span>
                </div>
                <button
                  onClick={() => setIsAnonymous(!isAnonymous)}
                  className={`w-12 h-7 rounded-full transition-colors relative ${
                    isAnonymous ? 'bg-[hsl(24_94%_53%)]' : 'bg-white/20'
                  }`}
                >
                  <span
                    className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${
                      isAnonymous ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="space-y-2 pt-4 mt-auto">
        <button
          onClick={handleMoodSubmit}
          disabled={!selectedEmotion}
          className="w-full h-12 md:h-14 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 disabled:bg-emerald-500/50 disabled:cursor-not-allowed rounded-xl text-white text-base md:text-lg font-bold transition-colors"
        >
          Submit & Done
        </button>
        <button
          onClick={handleMoodSkip}
          className="w-full h-10 bg-transparent hover:bg-white/5 rounded-lg text-white/60 hover:text-white/80 text-sm font-medium transition-colors"
        >
          Skip
        </button>
      </div>
    </motion.div>
  );

  // Helper to safely format dates
  const safeFormatTime = (date: Date | undefined | null): string => {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      return "--:--";
    }
    return format(date, "h:mm a");
  };

  // Render clock out summary
  const renderClockOutSummary = () => {
    if (!clockOutSummary) return null;

    return (
      <motion.div
        key="clockout-summary-cards"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.2 }}
        className="flex flex-col h-full"
      >
        <div className="flex-shrink-0 mb-4">
          <div className="w-14 h-14 md:w-16 md:h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <Check className="w-7 h-7 md:w-8 md:h-8 text-emerald-400" />
          </div>
          <h2 className="text-white text-xl md:text-2xl font-bold text-center mb-1">
            Clocked Out
          </h2>
          <p className="text-white/60 text-sm text-center">
            {clockOutSummary.employeeName}
          </p>
        </div>

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
                  {formatDuration(clockOutSummary.totalMinutes)}
                </p>
              </div>
            </div>

            {/* Break Duration */}
            {clockOutSummary.breakMinutes > 0 && (
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 md:p-4 flex items-center gap-3 md:gap-4">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-orange-500/30 rounded-xl flex items-center justify-center">
                  <Coffee className="w-5 h-5 md:w-6 md:h-6 text-orange-300" />
                </div>
                <div className="flex-1">
                  <p className="text-white/60 text-xs font-medium mb-0.5">Break Time</p>
                  <p className="text-white text-lg md:text-xl font-bold">
                    {formatDuration(clockOutSummary.breakMinutes)}
                  </p>
                </div>
              </div>
            )}

            {/* Shift Duration */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 md:p-4 flex items-center gap-3 md:gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Clock className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-white/60 text-xs font-medium mb-0.5">Shift Duration</p>
                <p className="text-white text-base md:text-lg font-semibold">
                  {safeFormatTime(clockOutSummary.clockInTime)} — {safeFormatTime(clockOutSummary.clockOutTime)}
                </p>
              </div>
            </div>

            {/* Revenue Center */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 md:p-4 flex items-center gap-3 md:gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <RevenueCenterIcon center={clockOutSummary.revenueCenter} className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <div className="flex-1">
                <p className="text-white/60 text-xs font-medium mb-0.5">Revenue Center</p>
                <p className="text-white text-lg md:text-xl font-bold">
                  {clockOutSummary.revenueCenter}
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
                  {clockOutSummary.jobType}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 mt-auto">
          <button
            onClick={handleDoneFromSummary}
            className="w-full h-12 md:h-14 bg-neutral-700 hover:bg-neutral-600 active:bg-neutral-500 rounded-xl text-white text-base md:text-lg font-bold transition-colors"
          >
            Done
          </button>
        </div>
      </motion.div>
    );
  };

  // Job selection screen for clock-in
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
      <div className="self-start mb-3 flex-shrink-0">
        <button
          onClick={handleJobSelectionBack}
          className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Header with employee avatar */}
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
        <h2 className="text-white text-xl font-bold">
          {validatedEmployee?.name}
        </h2>
        <p className="text-white/60 text-sm mt-1">
          Select your job type
        </p>
      </div>

      {/* Job type grid */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {validatedEmployee?.assignedJobTypes.map(job => (
            <button
              key={job}
              onClick={() => handleJobSelection(job)}
              className="bg-white/10 hover:bg-white/20 active:bg-white/30 backdrop-blur-sm rounded-xl p-4 flex flex-col items-center gap-2 transition-all min-h-[100px]"
            >
              {JOB_TYPE_ICONS[job] ? (
                <img 
                  src={JOB_TYPE_ICONS[job]!} 
                  alt={job} 
                  className="w-12 h-12" 
                  style={{ filter: 'invert(1) brightness(2)' }} 
                />
              ) : (
                <Briefcase className="w-12 h-12 text-white" />
              )}
              <span className="text-white text-sm font-medium">{job}</span>
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );

  // Clock-in summary screen
  const renderClockInSummary = () => {
    if (!clockInSummary) return null;
    
    const safeFormatTime = (date: Date) => {
      try {
        return format(date, "h:mm a");
      } catch {
        return "--:--";
      }
    };
    
    return (
      <motion.div
        key="clock-in-summary"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="flex flex-col h-full"
      >
        {/* Success Header */}
        <div className="text-center mb-4 flex-shrink-0">
          <div className="w-14 h-14 md:w-16 md:h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-3">
            <Check className="w-7 h-7 md:w-8 md:h-8 text-white" strokeWidth={3} />
          </div>
          <h2 className="text-white text-xl md:text-2xl font-bold text-center mb-1">
            Clocked In
          </h2>
          <p className="text-white/60 text-sm text-center">
            {clockInSummary.employeeName}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="space-y-2 md:space-y-3">
            {/* Clock In Time */}
            <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3 md:p-4 flex items-center gap-3 md:gap-4 border border-white/20">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-emerald-500/30 rounded-xl flex items-center justify-center">
                <Clock className="w-5 h-5 md:w-6 md:h-6 text-emerald-300" />
              </div>
              <div className="flex-1">
                <p className="text-white/60 text-xs font-medium mb-0.5">Clock In Time</p>
                <p className="text-white text-xl md:text-2xl font-bold">
                  {safeFormatTime(clockInSummary.clockInTime)}
                </p>
              </div>
            </div>

            {/* Revenue Center */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 md:p-4 flex items-center gap-3 md:gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <RevenueCenterIcon center={clockInSummary.revenueCenter} className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <div className="flex-1">
                <p className="text-white/60 text-xs font-medium mb-0.5">Revenue Center</p>
                <p className="text-white text-lg md:text-xl font-bold">
                  {clockInSummary.revenueCenter}
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
                  {clockInSummary.jobType}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 mt-auto">
          <button
            onClick={handleEnterPOSFromSummary}
            className="w-full h-12 md:h-14 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 rounded-xl text-white text-base md:text-lg font-bold transition-colors"
          >
            Continue
          </button>
        </div>
      </motion.div>
    );
  };

  // Shared keypad component for both layouts
  const renderKeypad = () => (
    <>
      {/* PIN Label */}
      <div className="text-center mb-2">
        <p className="text-white/60 text-sm">
          {isClockedIn ? "Enter PIN to Clock Out" : "Enter PIN to Clock In"}
        </p>
      </div>

      {/* PIN Display */}
      <div className="p-4 pb-3 pt-0 flex justify-center gap-4 md:gap-6">
        {Array.from({ length: PIN_LENGTH }).map((_, i) => (
          <div key={i} className="w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 flex items-center justify-center">
            {i < pin.length ? (
              <img
                src={pinIndicatorFilledIcon}
                alt="PIN digit entered"
                className={`w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 ${error ? "opacity-50" : ""}`}
              />
            ) : (
              <img
                src={pinIndicatorIcon}
                alt="PIN digit placeholder"
                className="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12"
              />
            )}
          </div>
        ))}
      </div>

      {/* Error Message */}
      {error && <p className="text-red-500 text-center text-sm mb-2 px-4">{error}</p>}

      {/* Numeric Keypad */}
      <div className="flex-1 px-4 pb-2 relative">
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <button
              key={num}
              onClick={() => handleKeyPress(num.toString())}
              disabled={isVerifying}
              className="h-14 md:h-16 lg:h-[72px] keypad-btn-3d rounded-lg text-black text-xl md:text-2xl font-semibold disabled:opacity-50"
            >
              {num}
            </button>
          ))}
          {/* C (Clear) Button */}
          <button
            onClick={handleClear}
            disabled={isVerifying}
            className="h-14 md:h-16 lg:h-[72px] keypad-btn-3d rounded-lg text-red-500 text-xl md:text-2xl font-bold disabled:opacity-50"
          >
            C
          </button>
          {/* 0 Button */}
          <button
            onClick={() => handleKeyPress("0")}
            disabled={isVerifying}
            className="h-14 md:h-16 lg:h-[72px] keypad-btn-3d rounded-lg text-black text-xl md:text-2xl font-semibold disabled:opacity-50"
          >
            0
          </button>
          {/* ENTER Button */}
          <button
            onClick={handleEnter}
            disabled={isVerifying || pin.length !== PIN_LENGTH}
            className="h-14 md:h-16 lg:h-[72px] keypad-btn-3d-enter rounded-lg text-black text-base md:text-lg font-bold disabled:opacity-50"
          >
            ENTER
          </button>
        </div>

        {/* Action Buttons Row */}
        <div className={`grid ${SettingsManager.getControlCenterSettings().hideBreakButton ? 'grid-cols-2' : 'grid-cols-3'} gap-2 mt-2`}>
          <button
            onClick={handleClockOut}
            disabled={isVerifying || pin.length !== PIN_LENGTH || !isClockedIn}
            className="h-12 md:h-14 lg:h-16 keypad-btn-3d-clockout rounded-lg text-white text-xs md:text-sm lg:text-base font-bold disabled:cursor-not-allowed"
          >
            Clock Out
          </button>
          {!SettingsManager.getControlCenterSettings().hideBreakButton && (
            <button
              onClick={handleBreak}
              disabled={isVerifying || pin.length !== PIN_LENGTH || !isClockedIn}
              className="h-12 md:h-14 lg:h-16 keypad-btn-3d-break rounded-lg text-black text-xs md:text-sm lg:text-base font-bold disabled:cursor-not-allowed"
            >
              Break
            </button>
          )}
          <button
            onClick={handleClockIn}
            disabled={isVerifying || pin.length !== PIN_LENGTH || isClockedIn}
            className="h-12 md:h-14 lg:h-16 keypad-btn-3d-clockin rounded-lg text-white text-xs md:text-sm lg:text-base font-bold disabled:cursor-not-allowed"
          >
            Clock In
          </button>
        </div>

        <div className="relative grid grid-cols-3 gap-2 mt-2">
          {/* Fingerprint */}
          <button 
            onClick={handleFingerprintPress}
            className="h-12 md:h-14 lg:h-16 keypad-btn-3d-dark rounded-lg flex items-center justify-center"
          >
            <Fingerprint className="w-6 h-6 md:w-7 md:h-7 text-white" />
          </button>

          {/* Revenue Center Selector */}
          <div className="relative">
            <button
              onClick={() => setShowRevenueCenterSelector(!showRevenueCenterSelector)}
              className="w-full h-12 md:h-14 lg:h-16 keypad-btn-3d-revenue rounded-lg flex flex-col items-center justify-center px-2"
            >
              <span className="text-neutral-500 text-[10px] font-medium uppercase tracking-wide">Revenue Center</span>
              <span className="text-black text-xs md:text-sm font-semibold truncate max-w-full flex items-center gap-1">
                {selectedRevenueCenter}
                <ChevronDown className="w-3 h-3" />
              </span>
            </button>

            {/* Revenue Center Dropdown - positioned above button */}
            <AnimatePresence>
              {showRevenueCenterSelector && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.15 }}
                  className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-xl shadow-2xl border-2 border-red-400 z-50 max-h-[280px] md:max-h-[280px] lg:max-h-[312px] flex flex-col"
                >
                  <div className="overflow-y-auto overscroll-contain flex-1">
                    {revenueCenters.map(center => (
                      <button 
                        key={center} 
                        onClick={() => {
                          setSelectedRevenueCenter(center);
                          setShowRevenueCenterSelector(false);
                        }} 
                        className={`w-full px-4 py-3.5 text-left text-sm hover:bg-neutral-100 flex items-center justify-between ${selectedRevenueCenter === center ? "bg-neutral-100" : ""}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center">
                            <RevenueCenterIcon center={center} className="w-4 h-4" />
                          </div>
                          <span className="text-black font-medium">{center}</span>
                        </div>
                        {selectedRevenueCenter === center && <Check className="w-4 h-4 text-emerald-500" />}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Face ID */}
          <button 
            onClick={handleFaceIDPress}
            className="h-12 md:h-14 lg:h-16 keypad-btn-3d-dark rounded-lg flex items-center justify-center"
          >
            <ScanFace className="w-6 h-6 md:w-7 md:h-7 text-white" />
          </button>
        </div>

        {/* LOGOUT Button Row */}
        <button
          onClick={handleLogoutClick}
          className="w-full h-12 md:h-14 mt-2 keypad-btn-3d-outlined rounded-lg text-white text-base md:text-lg font-bold"
        >
          LOGOUT
        </button>
      </div>
    </>
  );

  // Determine what content to show
  const renderContent = () => {
    if (showMoodCheckIn) {
      return renderMoodCheckIn();
    }
    if (showFingerprintScan) {
      return (
        <div className="relative h-[450px]">
          <FingerprintInlineAuth
            onCancel={handleFingerprintCancel}
            onSuccess={handleFingerprintSuccess}
            authType={isClockedIn ? 'clock_out' : 'clock_in'}
          />
        </div>
      );
    }
    if (showFaceIDScan) {
      return (
        <div className="relative h-[450px]">
          <FaceIDInlineAuth
            onCancel={handleFaceIDCancel}
            onSuccess={handleFaceIDSuccess}
            authType={isClockedIn ? 'clock_out' : 'clock_in'}
          />
        </div>
      );
    }
    if (showJobSelection && validatedEmployee) {
      return renderJobSelection();
    }
    if (clockInSummary) {
      return renderClockInSummary();
    }
    if (clockOutSummary) {
      return renderClockOutSummary();
    }
    return renderKeypad();
  };

  // Mobile fullscreen tag selection layout - maintains existing dark theme
  const renderMobileTagSelection = () => (
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
              isAnonymous ? 'bg-[hsl(24_94%_53%)]' : 'bg-white/20'
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
          Submit & Done
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

  // Mobile layout - single centered card
  const renderMobileLayout = () => {
    // Fullscreen tag selection when emotion is selected
    if (showMoodCheckIn && selectedEmotion) {
      return renderMobileTagSelection();
    }

    // Use centered layout when showing summary or job selection, top-aligned for keypad
    const showCenteredLayout = clockOutSummary || clockInSummary || showJobSelection;
    
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className={`relative z-10 flex justify-center w-full h-full p-4 ${showCenteredLayout ? 'items-center' : 'items-start pt-8'}`}
      >
        <div className="w-full max-w-[620px] bg-black/60 backdrop-blur-xl rounded-2xl p-4 flex flex-col max-h-[calc(100vh-32px)] overflow-y-auto">
          {/* Compact date/time header for mobile - show when on keypad */}
          {!showMoodCheckIn && !clockOutSummary && !clockInSummary && !showJobSelection && (
            <div className="text-center mb-3 flex-shrink-0">
              <p className="text-white/60 text-sm">
                {format(currentTime, "EEEE, MMMM d, yyyy")}
              </p>
              <p className="text-white text-3xl font-bold">
                {format(currentTime, "h:mm")}
                <span className="text-white/60 text-xl ml-1">{format(currentTime, "a")}</span>
              </p>
            </div>
          )}

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

          {/* Compact header for mood check-in - shows context (clock-in or clock-out) */}
          <AnimatePresence mode="wait">
            {showMoodCheckIn && !selectedEmotion && (
              <motion.div
                key="clock-header-mobile-compact"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.15 }}
                className="text-center mb-2 flex-shrink-0 overflow-hidden"
              >
                {clockOutSummary ? (
                  <>
                    <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-1">
                      <LogOut className="w-5 h-5 text-white" strokeWidth={2.5} />
                    </div>
                    <h2 className="text-white text-base font-bold mb-0">
                      Clocked Out!
                    </h2>
                    <p className="text-white/60 text-xs">
                      Great shift, {clockOutSummary?.employeeName || "Team Member"}
                    </p>
                  </>
                ) : (
                  <>
                    <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-1">
                      <Check className="w-5 h-5 text-white" strokeWidth={2.5} />
                    </div>
                    <h2 className="text-white text-base font-bold mb-0">
                      Clocked In!
                    </h2>
                    <p className="text-white/60 text-xs">
                      Welcome, {clockInSummary?.employeeName || "Team Member"}
                    </p>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Content */}
          <div className="flex-1 min-h-0">
            <AnimatePresence mode="wait">
              {renderContent()}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    );
  };

  // Desktop layout - two-column grid
  const renderDesktopLayout = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="relative z-10 grid grid-cols-12 w-full h-full"
    >
      {/* Left Info Panel - 4 columns */}
      <div className="col-span-5 flex flex-col justify-center items-start pl-20 lg:pl-28 xl:pl-36 pr-10 bg-gradient-to-br from-black/30 to-transparent">
        {/* Date - Large */}
        <p className="text-white text-xl lg:text-2xl font-semibold mb-4 tracking-wide">
          {format(currentTime, "EEEE, MMMM d, yyyy")}
        </p>

        {/* MASSIVE Time Display */}
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

        {/* Weather & Location - Bold Row */}
        <div className="flex items-center gap-4 mb-4">
          <span className="text-white text-5xl lg:text-6xl xl:text-7xl font-light">27°</span>
          <Sun className="w-12 h-12 lg:w-16 lg:h-16 text-amber-300" strokeWidth={1.5} />
        </div>

        <p className="text-white text-2xl lg:text-3xl xl:text-4xl font-bold tracking-wide">
          Bengaluru, Karnataka
        </p>
      </div>

      {/* Right Keypad Panel - 8 columns */}
      <div className="col-span-7 flex flex-col items-center justify-center p-6 py-8 overflow-y-auto">
        <div className={`w-full flex flex-col max-h-full ${clockOutSummary || clockInSummary || showMoodCheckIn || showJobSelection ? 'max-w-[620px]' : 'max-w-[400px]'}`}>
          <AnimatePresence mode="wait">
            {renderContent()}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="pos-clock-overlay fixed inset-0 z-[9999] flex"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0
          }}
        >
          {/* Dimmed Background — force dark backdrop on both themes for PIN pad consistency */}
          <div className="absolute inset-0 backdrop-blur-md" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }} />

          {/* Conditionally render mobile OR desktop layout */}
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

      {/* Clock Out Validation - Mobile uses full screen, Desktop uses modal */}
      {validatedClockOutEmployee && (
        isMobile ? (
          <ClockOutValidationMobile
            isOpen={showClockOutValidation}
            onClose={() => {
              setShowClockOutValidation(false);
              setValidatedClockOutEmployee(null);
              setChecksResolved(true);
              setPin("");
            }}
            onProceedClockOut={proceedWithClockOut}
            employeeName={validatedClockOutEmployee.name}
            employeeAvatar={validatedClockOutEmployee.avatar}
            shiftStartTime={validatedClockOutEmployee.clockInTime}
            shiftEndTime={new Date()}
          />
        ) : (
          <ClockOutValidationModal
            isOpen={showClockOutValidation}
            onClose={() => {
              setShowClockOutValidation(false);
              setValidatedClockOutEmployee(null);
              setChecksResolved(true);
              setPin("");
            }}
            onProceedClockOut={proceedWithClockOut}
            employeeName={validatedClockOutEmployee.name}
            employeeAvatar={validatedClockOutEmployee.avatar}
            shiftStartTime={validatedClockOutEmployee.clockInTime}
            shiftEndTime={new Date()}
          />
        )
      )}
    </>
  );
};

export default ClockOutOverlay;
