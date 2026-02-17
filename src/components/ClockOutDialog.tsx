import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Briefcase, MapPin, Clock, CheckCircle2, Delete, Loader2, ArrowLeft, Fingerprint, ScanFace, Monitor, Sun, Moon, Sunrise, Sunset } from "lucide-react";
import { Button } from "@/components/ui/button";
import eatosLogo from "@/assets/icons/eatos-logo.svg";
import restaurantLogo from "@/assets/icons/restaurant-logo.png";

interface SessionData {
  employeeId: string;
  employeeName: string;
  employeeRole: string;
  employeeAvatar?: string;
  revenueCenter?: string;
  loginTime: string;
}

interface ClockOutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClockOut: () => void;
}

const PIN_LENGTH = 4;

const formatDuration = (startTime: Date, endTime: Date): string => {
  const diffMs = endTime.getTime() - startTime.getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours === 0) {
    return `${minutes}m`;
  }
  return `${hours}h ${minutes}m`;
};

// Helper to get time of day info (icon and label)
const getTimeOfDayInfo = (date: Date) => {
  const hour = date.getHours();
  
  if (hour >= 5 && hour < 12) {
    return { 
      icon: Sunrise, 
      label: "Morning",
      iconClass: "text-amber-400"
    };
  } else if (hour >= 12 && hour < 17) {
    return { 
      icon: Sun, 
      label: "Afternoon",
      iconClass: "text-yellow-400"
    };
  } else if (hour >= 17 && hour < 20) {
    return { 
      icon: Sunset, 
      label: "Evening",
      iconClass: "text-orange-400"
    };
  } else {
    return { 
      icon: Moon, 
      label: "Night",
      iconClass: "text-slate-300"
    };
  }
};

type Step = "pin" | "verifying" | "confirm" | "success";

export const ClockOutDialog = ({ open, onOpenChange, onClockOut }: ClockOutDialogProps) => {
  const [session, setSession] = useState<SessionData | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [step, setStep] = useState<Step>("pin");
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");

  useEffect(() => {
    if (open) {
      const savedSession = localStorage.getItem("pos_session");
      if (savedSession) {
        try {
          setSession(JSON.parse(savedSession));
        } catch {
          setSession(null);
        }
      }
      setCurrentTime(new Date());
      setStep("pin");
      setPin("");
      setPinError("");
    }
  }, [open]);

  // Update clock every minute
  useEffect(() => {
    if (!open) return;
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, [open]);

  const handlePinComplete = useCallback((enteredPin: string) => {
    setStep("verifying");
    
    setTimeout(() => {
      if (enteredPin === "1111") {
        setStep("confirm");
      } else {
        setStep("pin");
        setPinError("Incorrect PIN");
        setPin("");
      }
    }, 800);
  }, []);

  const handleNumberPress = useCallback((num: string) => {
    if (pin.length < PIN_LENGTH) {
      const newPin = pin + num;
      setPin(newPin);
      setPinError("");
      if (newPin.length === PIN_LENGTH) {
        handlePinComplete(newPin);
      }
    }
  }, [pin, handlePinComplete]);

  const handleDelete = useCallback(() => {
    setPin(prev => prev.slice(0, -1));
    setPinError("");
  }, []);

  const handleConfirmClockOut = () => {
    setStep("success");
    
    setTimeout(() => {
      localStorage.removeItem("pos_session");
      onClockOut();
    }, 1500);
  };

  if (!open || !session) return null;

  const loginTime = new Date(session.loginTime);
  const duration = formatDuration(loginTime, currentTime);
  const formattedClockOut = currentTime.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
  const formattedDate = currentTime.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });

  // Context panel info
  const formattedDateDisplay = currentTime.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
  const formattedTimeDisplay = currentTime.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
  
  const timeOfDayInfo = getTimeOfDayInfo(currentTime);
  const TimeOfDayIcon = timeOfDayInfo.icon;

  const deviceInfo = {
    restaurantName: "The Rustic Table",
    location: "Downtown - Main Street",
    deviceName: "POS Terminal 01",
    temperature: 72,
  };

  return (
    <div className="fixed inset-0 z-50 login-bg flex overflow-hidden">
      <div className="absolute inset-0 gradient-mesh opacity-30" />

      <AnimatePresence mode="wait">
        {/* PIN Entry Screen - Full Layout */}
        {step === "pin" && (
          <motion.div
            key="pin-layout"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative z-10 w-full h-full flex"
          >
            {/* Left Panel - Context Info (Hidden on mobile) */}
            <div className="hidden md:flex w-80 lg:w-96 flex-shrink-0 flex-col h-full border-r border-foreground/[0.06]">
              {/* Logo and title area */}
              <div className="p-8 flex-shrink-0">
                <motion.img
                  src={eatosLogo}
                  alt="eatOS"
                  className="w-14 h-auto mb-8"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4 }}
                />
              </div>

              {/* Context Information */}
              <div className="flex-1 px-8 py-4">
                <div className="space-y-6">
                  {/* Restaurant Logo */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="w-16 h-16 rounded-2xl overflow-hidden"
                  >
                    <img 
                      src={restaurantLogo} 
                      alt="The Rustic Table" 
                      className="w-full h-full object-cover"
                    />
                  </motion.div>

                  {/* Restaurant Name */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="space-y-1"
                  >
                    <p className="text-xs text-foreground/40 uppercase tracking-wider font-medium">Restaurant</p>
                    <p className="text-base font-medium text-foreground">{deviceInfo.restaurantName}</p>
                  </motion.div>

                  {/* Location */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                    className="space-y-1"
                  >
                    <p className="text-xs text-foreground/40 uppercase tracking-wider font-medium">Location</p>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-foreground/40" />
                      <p className="text-base text-foreground/80">{deviceInfo.location}</p>
                    </div>
                  </motion.div>

                  {/* Device Name */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="space-y-1"
                  >
                    <p className="text-xs text-foreground/40 uppercase tracking-wider font-medium">Device</p>
                    <div className="flex items-center gap-2">
                      <Monitor className="w-4 h-4 text-foreground/40" />
                      <p className="text-base text-foreground/80">{deviceInfo.deviceName}</p>
                    </div>
                  </motion.div>

                  {/* Date & Time */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45 }}
                    className="space-y-1"
                  >
                    <p className="text-xs text-foreground/40 uppercase tracking-wider font-medium">Date & Time</p>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-foreground/40" />
                      <p className="text-base text-foreground/80">{formattedTimeDisplay} | {formattedDateDisplay}</p>
                    </div>
                    {/* Weather info inline below */}
                    <div className="flex items-center gap-2 pt-2">
                      <TimeOfDayIcon className={`w-4 h-4 ${timeOfDayInfo.iconClass}`} strokeWidth={1.5} />
                      <p className="text-sm text-foreground/50">{deviceInfo.temperature}°F · {timeOfDayInfo.label}</p>
                    </div>
                  </motion.div>
                </div>
              </div>

              {/* Version info at bottom */}
              <div className="p-8 flex-shrink-0">
                <p className="text-xs text-foreground/20">eatOS POSAI 6 v2.4.1</p>
              </div>
            </div>

            {/* Right Panel - PIN Entry */}
            <div className="flex-1 flex items-center justify-center p-8 relative">
              {/* Back Button */}
              <motion.button
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => onOpenChange(false)}
                className="absolute top-8 left-8 flex items-center gap-2 text-sm text-foreground/50 hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </motion.button>

              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="w-full max-w-sm flex flex-col items-center"
              >
                {/* Employee Avatar & Name - Horizontal Layout */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-4 mb-8"
                >
                  <div className="w-16 h-16 rounded-full bg-foreground/[0.08] flex items-center justify-center border border-foreground/[0.06] overflow-hidden flex-shrink-0">
                    {session.employeeAvatar ? (
                      <img 
                        src={session.employeeAvatar} 
                        alt={session.employeeName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-8 h-8 text-foreground/40" />
                    )}
                  </div>
                  <div className="flex flex-col">
                    <h1 className="text-xl font-semibold text-primary">{session.employeeName}</h1>
                    <span className="text-base text-primary/80">{session.employeeRole}</span>
                  </div>
                </motion.div>

                {/* PIN Dots */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="flex gap-4 mb-4"
                >
                  {Array.from({ length: PIN_LENGTH }).map((_, i) => (
                    <motion.div
                      key={i}
                      animate={pinError ? { x: [0, -4, 4, -4, 4, 0] } : {}}
                      transition={{ duration: 0.4 }}
                      className={`w-4 h-4 rounded-full transition-all duration-200 ${
                        pinError
                          ? "bg-destructive"
                          : i < pin.length 
                            ? "bg-primary scale-110" 
                            : "bg-foreground/[0.12] border border-foreground/[0.08]"
                      }`}
                    />
                  ))}
                </motion.div>

                {/* Error/Hint Message */}
                <div className="h-8 flex items-center justify-center">
                  <AnimatePresence mode="wait">
                    {pinError ? (
                      <motion.div
                        key="error"
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-destructive/10"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-destructive" />
                        <span className="text-sm font-medium text-destructive">{pinError}</span>
                      </motion.div>
                    ) : (
                      <motion.p
                        key="hint"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-sm text-foreground/40"
                      >
                        Enter your PIN
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                {/* Keypad Container */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex flex-col gap-3 w-full max-w-[280px]"
                >
                  {/* Numeric Keypad 1-9 */}
                  <div className="grid grid-cols-3 gap-3">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                      <button
                        key={num}
                        onClick={() => handleNumberPress(num.toString())}
                        className="aspect-square rounded-2xl bg-foreground/[0.04] hover:bg-foreground/[0.08] border border-foreground/[0.06] hover:border-foreground/[0.12] text-2xl font-medium text-foreground transition-all duration-150 active:scale-95"
                      >
                        {num}
                      </button>
                    ))}
                  </div>

                  {/* Last row: 0 and Delete - 2 column layout */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleNumberPress("0")}
                      className="h-[70px] rounded-2xl bg-foreground/[0.04] hover:bg-foreground/[0.08] border border-foreground/[0.06] hover:border-foreground/[0.12] text-2xl font-medium text-foreground transition-all duration-150 active:scale-95"
                    >
                      0
                    </button>
                    <button
                      onClick={handleDelete}
                      className="h-[70px] rounded-2xl bg-foreground/[0.04] hover:bg-foreground/[0.08] border border-foreground/[0.06] hover:border-foreground/[0.12] flex items-center justify-center text-foreground/60 transition-all duration-150 active:scale-95"
                    >
                      <Delete className="w-6 h-6" />
                    </button>
                  </div>

                  {/* Biometric Options - 2 column layout */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      className="h-12 rounded-2xl bg-foreground/[0.04] hover:bg-foreground/[0.08] border border-foreground/[0.06] hover:border-foreground/[0.12] flex items-center justify-center gap-2 group transition-all duration-150 active:scale-95 hover:border-primary/30"
                    >
                      <Fingerprint className="w-5 h-5 text-foreground/60 group-hover:text-primary transition-colors" />
                      <span className="text-sm text-foreground/40 group-hover:text-foreground/60 transition-colors">Touch ID</span>
                    </button>
                    
                    <button
                      className="h-12 rounded-2xl bg-foreground/[0.04] hover:bg-foreground/[0.08] border border-foreground/[0.06] hover:border-foreground/[0.12] flex items-center justify-center gap-2 group transition-all duration-150 active:scale-95 hover:border-primary/30"
                    >
                      <ScanFace className="w-5 h-5 text-foreground/60 group-hover:text-primary transition-colors" />
                      <span className="text-sm text-foreground/40 group-hover:text-foreground/60 transition-colors">Face ID</span>
                    </button>
                  </div>
                </motion.div>

                {/* Forgot PIN */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-xs text-foreground/30 mt-6"
                >
                  Forgot PIN? Contact your manager
                </motion.p>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* Verifying Screen */}
        {step === "verifying" && (
          <motion.div
            key="verifying"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="relative z-10 w-full h-full flex items-center justify-center"
          >
            <div className="flex flex-col items-center">
              <Loader2 className="w-10 h-10 text-foreground/40 animate-spin mb-4" />
              <p className="text-sm text-foreground/50">Verifying identity…</p>
            </div>
          </motion.div>
        )}

        {/* Confirmation Screen */}
        {step === "confirm" && (
          <motion.div
            key="confirm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="relative z-10 w-full h-full flex items-center justify-center"
          >
            <div className="w-full max-w-sm px-6 flex flex-col items-center">
              {/* Employee Info - Centered with avatar */}
              <div className="w-20 h-20 rounded-full bg-foreground/[0.08] flex items-center justify-center mb-4 border border-foreground/[0.06] overflow-hidden">
                {session.employeeAvatar ? (
                  <img 
                    src={session.employeeAvatar} 
                    alt={session.employeeName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-10 h-10 text-foreground/40" />
                )}
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-1">{session.employeeName}</h2>
              <p className="text-sm text-foreground/50 mb-8">Confirm your shift details</p>

              {/* Shift Details */}
              <div className="w-full space-y-3 mb-6">
                {/* Role */}
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-foreground/[0.03] border border-foreground/[0.06]">
                  <div className="w-10 h-10 rounded-full bg-foreground/[0.06] flex items-center justify-center flex-shrink-0">
                    <Briefcase className="w-5 h-5 text-foreground/50" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-foreground/40 uppercase tracking-wider mb-0.5">Role</p>
                    <p className="text-[15px] font-medium text-foreground">{session.employeeRole}</p>
                  </div>
                </div>

                {/* Revenue Center */}
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-foreground/[0.03] border border-foreground/[0.06]">
                  <div className="w-10 h-10 rounded-full bg-foreground/[0.06] flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-foreground/50" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-foreground/40 uppercase tracking-wider mb-0.5">Revenue Center</p>
                    <p className="text-[15px] font-medium text-foreground">{session.revenueCenter || "Main Dining"}</p>
                  </div>
                </div>

                {/* End Time */}
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-foreground/[0.03] border border-foreground/[0.06]">
                  <div className="w-10 h-10 rounded-full bg-foreground/[0.06] flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-foreground/50" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-foreground/40 uppercase tracking-wider mb-0.5">End Time</p>
                    <p className="text-[15px] font-medium text-foreground">{formattedClockOut}</p>
                    <p className="text-xs text-foreground/40">{formattedDate}</p>
                  </div>
                </div>
              </div>

              {/* Confirm Button */}
              <Button 
                onClick={handleConfirmClockOut}
                className="w-full h-14 text-base font-medium rounded-2xl"
                size="lg"
              >
                Confirm Clock Out
              </Button>

              {/* Back link */}
              <button
                onClick={() => onOpenChange(false)}
                className="mt-4 text-sm text-foreground/40 hover:text-foreground/60 transition-colors"
              >
                Not you? Go back
              </button>
            </div>
          </motion.div>
        )}

        {/* Success Screen */}
        {step === "success" && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="relative z-10 w-full h-full flex items-center justify-center"
          >
            <div className="flex flex-col items-center px-6 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.1, stiffness: 200 }}
                className="w-24 h-24 rounded-full bg-emerald-500/15 flex items-center justify-center mb-8 relative"
              >
                <motion.div
                  className="absolute inset-0 rounded-full bg-emerald-500/10"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
                <CheckCircle2 className="w-12 h-12 text-emerald-500" />
              </motion.div>
              
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-2xl font-semibold text-foreground mb-2"
              >
                You are now clocked out
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-base text-foreground/60 mb-1"
              >
                {session.employeeName}
              </motion.p>
              
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-sm text-foreground/40"
              >
                {formattedClockOut}
              </motion.p>

              {/* Redirecting indicator */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mt-10 flex items-center gap-2 text-xs text-foreground/30"
              >
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Redirecting...</span>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ClockOutDialog;