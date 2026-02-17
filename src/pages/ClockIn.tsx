import { useCallback, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Delete, Loader2, Clock, MapPin, Monitor, User, 
  Briefcase, CheckCircle2, Fingerprint, ScanFace,
  Sun, Moon, Sunrise, Sunset, LogOut, ArrowLeft
} from "lucide-react";
import eatosLogo from "@/assets/icons/eatos-logo.svg";
import restaurantLogo from "@/assets/icons/restaurant-logo.png";
import { useDeviceAuth } from "@/hooks/useDeviceAuth";
import { Button } from "@/components/ui/button";

// Revenue centers assigned to employees - in production this would come from API
const revenueCenters: Record<string, string> = {
  "1": "Main Dining",
  "2": "Patio",
  "3": "Bar Area",
  "4": "Bar Area",
  "5": "Host Stand",
  "6": "Main Dining",
  "7": "Kitchen",
  "8": "Patio"
};

// PIN to employee mapping for company device flow
// In production, PINs would be validated server-side without exposing mappings
const employeePinMapping: Record<string, string> = {
  "1111": "1", // Mia Jones (Manager)
  "2222": "2", // Dustin Henderson (Server)
  "3333": "3", // Lucas Miller (Server)
  "4444": "4", // Sarah Kim (Bartender)
  "5555": "5", // James Wilson (Host)
  "6666": "6", // Emily Rodriguez (Server)
  "7777": "7", // Michael Chen (Line Cook)
  "8888": "8", // Olivia Brown (Server)
};

// Mock employees assigned to this location - in production this would come from API
const locationEmployees = [{
  id: "1",
  name: "Mia Jones",
  role: "Manager",
  avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face"
}, {
  id: "2",
  name: "Dustin Henderson",
  role: "Server",
  avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face"
}, {
  id: "3",
  name: "Lucas Miller",
  role: "Server",
  avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face"
}, {
  id: "4",
  name: "Sarah Kim",
  role: "Bartender",
  avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face"
}, {
  id: "5",
  name: "James Wilson",
  role: "Host",
  avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face"
}, {
  id: "6",
  name: "Emily Rodriguez",
  role: "Server",
  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face"
}, {
  id: "7",
  name: "Michael Chen",
  role: "Line Cook",
  avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop&crop=face"
}, {
  id: "8",
  name: "Olivia Brown",
  role: "Server",
  avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop&crop=face"
}];

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

const PIN_LENGTH = 4;

const ClockIn = () => {
  const navigate = useNavigate();
  const { clockIn, logout, isDeviceTrusted, isLoading: authLoading } = useDeviceAuth();
  
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [showClockIn, setShowClockIn] = useState(false);
  const [clockInTime, setClockInTime] = useState<Date | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<typeof locationEmployees[0] | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Redirect to login if device is not trusted
  useEffect(() => {
    if (!authLoading && !isDeviceTrusted) {
      navigate("/login", { replace: true });
    }
  }, [authLoading, isDeviceTrusted, navigate]);

  // Update clock every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    
    return () => clearInterval(timer);
  }, []);
  const handlePinComplete = useCallback((enteredPin: string) => {
    setIsVerifying(true);
    
    // Simulate verification delay
    setTimeout(() => {
      // Look up employee by PIN
      const employeeId = employeePinMapping[enteredPin];
      
      if (employeeId) {
        const employee = locationEmployees.find(e => e.id === employeeId);
        if (employee) {
          setSelectedEmployee(employee);
          setIsVerifying(false);
          setClockInTime(new Date());
          setShowClockIn(true);
        } else {
          setIsVerifying(false);
          setPinError("Invalid PIN");
          setPin("");
        }
      } else {
        setIsVerifying(false);
        setPinError("Invalid PIN");
        setPin("");
      }
    }, 800);
  }, []);

  const handleConfirmClockIn = useCallback(() => {
    if (!selectedEmployee || !clockInTime) return;
    
    // Save clock-in session
    clockIn({
      employeeId: selectedEmployee.id,
      employeeName: selectedEmployee.name,
      employeeRole: selectedEmployee.role,
      employeeAvatar: selectedEmployee.avatar,
      revenueCenter: revenueCenters[selectedEmployee.id] || "Main Dining",
      deviceType: "company",
      loginTime: clockInTime.toISOString(),
    });
    
    setShowClockIn(false);
    setShowSuccess(true);
    
    // Navigate to dashboard after success
    setTimeout(() => {
      navigate("/");
    }, 1500);
  }, [selectedEmployee, clockInTime, clockIn, navigate]);

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

  const handleLogout = useCallback(() => {
    logout();
    navigate("/login", { replace: true });
  }, [logout, navigate]);

  // Keyboard support for PIN entry
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture keys if showing success or clock-in confirmation
      if (showSuccess || showClockIn || isVerifying) return;
      
      // Handle number keys (0-9)
      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        if (pin.length < PIN_LENGTH) {
          const newPin = pin + e.key;
          setPin(newPin);
          setPinError("");
          if (newPin.length === PIN_LENGTH) {
            handlePinComplete(newPin);
          }
        }
      }
      
      // Handle backspace/delete
      if (e.key === "Backspace" || e.key === "Delete") {
        e.preventDefault();
        setPin(prev => prev.slice(0, -1));
        setPinError("");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pin, showSuccess, showClockIn, isVerifying, handlePinComplete]);

  if (authLoading) {
    return (
      <div className="fixed inset-0 login-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Success Screen
  if (showSuccess && selectedEmployee && clockInTime) {
    const formattedTime = clockInTime.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });

    return (
      <div className="fixed inset-0 login-bg flex flex-col items-center justify-center overflow-hidden">
        <div className="absolute inset-0 gradient-mesh opacity-30" />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="relative z-10 flex flex-col items-center px-6 text-center"
        >
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
            You are now clocked in
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-base text-foreground/60 mb-1"
          >
            {selectedEmployee.name}
          </motion.p>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-sm text-foreground/40"
          >
            {formattedTime}
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-10 flex items-center gap-2 text-xs text-foreground/30"
          >
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Redirecting to home...</span>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // Clock-In Confirmation Screen
  if (showClockIn && selectedEmployee && clockInTime) {
    const formattedTime = clockInTime.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
    const formattedDate = clockInTime.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'long', 
      day: 'numeric' 
    });

    return (
      <div className="fixed inset-0 login-bg flex flex-col items-center justify-center overflow-hidden">
        <div className="absolute inset-0 gradient-mesh opacity-30" />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 w-full max-w-sm px-6 flex flex-col items-center"
        >
          <div className="w-20 h-20 rounded-full bg-foreground/[0.08] flex items-center justify-center mb-4 border border-foreground/[0.06]">
            <User className="w-10 h-10 text-foreground/40" />
          </div>
          <h1 className="text-xl font-semibold text-foreground mb-1">{selectedEmployee.name}</h1>
          <p className="text-sm text-foreground/50 mb-8">Confirm your shift details</p>

          <div className="w-full space-y-3 mb-8">
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-foreground/[0.03] border border-foreground/[0.06]">
              <div className="w-10 h-10 rounded-full bg-foreground/[0.06] flex items-center justify-center flex-shrink-0">
                <Briefcase className="w-5 h-5 text-foreground/50" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-foreground/40 uppercase tracking-wider mb-0.5">Role</p>
                <p className="text-[15px] font-medium text-foreground">{selectedEmployee.role}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-2xl bg-foreground/[0.03] border border-foreground/[0.06]">
              <div className="w-10 h-10 rounded-full bg-foreground/[0.06] flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-foreground/50" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-foreground/40 uppercase tracking-wider mb-0.5">Revenue Center</p>
                <p className="text-[15px] font-medium text-foreground">{revenueCenters[selectedEmployee.id] || "Main Dining"}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-2xl bg-foreground/[0.03] border border-foreground/[0.06]">
              <div className="w-10 h-10 rounded-full bg-foreground/[0.06] flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-foreground/50" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-foreground/40 uppercase tracking-wider mb-0.5">Start Time</p>
                <p className="text-[15px] font-medium text-foreground">{formattedTime}</p>
                <p className="text-xs text-foreground/40">{formattedDate}</p>
              </div>
            </div>
          </div>

          <Button 
            onClick={handleConfirmClockIn}
            className="w-full h-14 text-base font-medium rounded-2xl"
            size="lg"
          >
            Confirm Clock In
          </Button>

          <button
            onClick={() => {
              setShowClockIn(false);
              setSelectedEmployee(null);
              setClockInTime(null);
              setPin("");
            }}
            className="mt-4 text-sm text-foreground/40 hover:text-foreground/60 transition-colors"
          >
            Not you? Go back
          </button>
        </motion.div>
      </div>
    );
  }

  // Mock device/location info for context panel
  const deviceInfo = {
    restaurantName: "The Rustic Table",
    location: "Downtown - Main Street",
    deviceName: "POS Terminal 01",
    temperature: 72,
  };

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

  // PIN Entry Screen
  return (
    <div className="fixed inset-0 login-bg flex overflow-hidden">
      <div className="absolute inset-0 gradient-mesh opacity-30" />
      
      {/* Mobile Layout */}
      <div className="relative z-10 w-full flex flex-col md:hidden h-full items-center justify-center px-6">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-full max-w-sm flex flex-col items-center"
        >
          {/* Logout Button */}
          <motion.button
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={handleLogout}
            className="absolute top-8 left-6 flex items-center gap-2 text-sm text-foreground/50 hover:text-foreground transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </motion.button>

          <motion.img
            src={eatosLogo}
            alt="eatOS"
            className="w-20 h-auto mb-4"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          />

          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-xl font-semibold text-foreground mb-2"
          >
            Clock In
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="text-sm text-foreground/50 mb-8 text-center"
          >
            Enter your PIN to start your shift
          </motion.p>

          {/* PIN Dots */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
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
          <div className="h-8 flex items-center justify-center mb-4">
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
              ) : isVerifying ? (
                <motion.div
                  key="verifying"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2"
                >
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <span className="text-sm text-foreground/50">Verifying...</span>
                </motion.div>
              ) : (
                <motion.p
                  key="hint"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-sm text-foreground/40"
                >
                  Enter 4-digit PIN
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Keypad */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="flex flex-col gap-3 w-full max-w-[280px]"
          >
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  onClick={() => handleNumberPress(num.toString())}
                  disabled={isVerifying}
                  className="aspect-square rounded-2xl bg-foreground/[0.04] hover:bg-foreground/[0.08] border border-foreground/[0.06] hover:border-foreground/[0.12] text-2xl font-medium text-foreground transition-all duration-150 active:scale-95 disabled:opacity-50"
                >
                  {num}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleNumberPress("0")}
                disabled={isVerifying}
                className="h-[70px] rounded-2xl bg-foreground/[0.04] hover:bg-foreground/[0.08] border border-foreground/[0.06] hover:border-foreground/[0.12] text-2xl font-medium text-foreground transition-all duration-150 active:scale-95 disabled:opacity-50"
              >
                0
              </button>
              <button
                onClick={handleDelete}
                disabled={isVerifying}
                className="h-[70px] rounded-2xl bg-foreground/[0.04] hover:bg-foreground/[0.08] border border-foreground/[0.06] hover:border-foreground/[0.12] flex items-center justify-center text-foreground/60 transition-all duration-150 active:scale-95 disabled:opacity-50"
              >
                <Delete className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button className="h-12 rounded-2xl bg-foreground/[0.04] hover:bg-foreground/[0.08] border border-foreground/[0.06] hover:border-foreground/[0.12] flex items-center justify-center gap-2 group transition-all duration-150 active:scale-95 hover:border-primary/30">
                <Fingerprint className="w-5 h-5 text-foreground/60 group-hover:text-primary transition-colors" />
                <span className="text-sm text-foreground/40 group-hover:text-foreground/60 transition-colors">Touch ID</span>
              </button>
              
              <button className="h-12 rounded-2xl bg-foreground/[0.04] hover:bg-foreground/[0.08] border border-foreground/[0.06] hover:border-foreground/[0.12] flex items-center justify-center gap-2 group transition-all duration-150 active:scale-95 hover:border-primary/30">
                <ScanFace className="w-5 h-5 text-foreground/60 group-hover:text-primary transition-colors" />
                <span className="text-sm text-foreground/40 group-hover:text-foreground/60 transition-colors">Face ID</span>
              </button>
            </div>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-xs text-foreground/30 mt-8"
          >
            Forgot PIN? Contact your manager
          </motion.p>
        </motion.div>
      </div>

      {/* Tablet/Desktop Layout */}
      <div className="relative z-10 hidden md:flex w-full h-full">
        {/* Left Panel - Bold Context Display (Production Style) */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-[50%] lg:w-[45%] h-full flex flex-col bg-black/40 overflow-hidden"
        >
          {/* Top - Logo with minimal weight */}
          <div className="px-10 pt-8">
            <motion.img
              src={eatosLogo}
              alt="eatOS"
              className="w-14 h-auto opacity-30"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              transition={{ delay: 0.2 }}
            />
          </div>

          {/* Center - Time & Context as primary focus */}
          <div className="flex-1 flex flex-col justify-center px-10">
            {/* Full Date - Above Time */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl lg:text-2xl font-normal text-foreground/70 mb-3"
            >
              {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </motion.p>

            {/* Massive Time Display - Primary Element */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="mb-8"
            >
              <p className="text-[120px] lg:text-[160px] xl:text-[180px] font-bold text-foreground tracking-tighter leading-[0.85]">
                {currentTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).split(' ')[0]}
              </p>
              <p className="text-4xl lg:text-5xl font-semibold text-foreground/60 mt-2 tracking-wide">
                {currentTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).split(' ')[1]}
              </p>
            </motion.div>

            {/* Weather & Location Row */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="flex items-center gap-4 mb-6"
            >
              {/* Temperature */}
              <div className="flex items-center gap-2">
                <span className="text-4xl lg:text-5xl font-light text-foreground/80">{deviceInfo.temperature}°</span>
                <TimeOfDayIcon className={`w-8 h-8 ${timeOfDayInfo.iconClass}`} strokeWidth={1.5} />
              </div>
            </motion.div>

            {/* Location - Large & Bold */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-2xl lg:text-3xl font-bold text-foreground mb-6"
            >
              {deviceInfo.location}
            </motion.p>

            {/* Restaurant & Device - Subtle */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="space-y-2"
            >
              <p className="text-base text-foreground/50">{deviceInfo.restaurantName}</p>
              <div className="flex items-center gap-2">
                <Monitor className="w-4 h-4 text-foreground/40" />
                <p className="text-base text-foreground/40">{deviceInfo.deviceName}</p>
              </div>
            </motion.div>
          </div>

          {/* Bottom - Version */}
          <div className="px-10 pb-6">
            <p className="text-xs text-foreground/20">eatOS POSAI 6 v2.4.1</p>
          </div>
        </motion.div>

        {/* Right Panel - PIN Entry */}
        <div className="flex-1 h-full flex flex-col items-center justify-center p-8">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full max-w-sm flex flex-col items-center"
          >
            {/* Back Button - Self-aligned at top left */}
            <motion.button
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={handleLogout}
              className="self-start mb-4 flex items-center gap-2 text-sm text-foreground/50 hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </motion.button>
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-2xl font-semibold text-foreground mb-2"
            >
              Clock In
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25 }}
              className="text-sm text-foreground/50 mb-10"
            >
              Enter your PIN to start your shift
            </motion.p>

            {/* PIN Dots */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
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
            <div className="h-8 flex items-center justify-center mb-6">
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
                ) : isVerifying ? (
                  <motion.div
                    key="verifying"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2"
                  >
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span className="text-sm text-foreground/50">Verifying...</span>
                  </motion.div>
                ) : (
                  <motion.p
                    key="hint"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-sm text-foreground/40"
                  >
                    Enter 4-digit PIN
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Keypad */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="flex flex-col gap-3 w-full max-w-[280px]"
            >
              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <button
                    key={num}
                    onClick={() => handleNumberPress(num.toString())}
                    disabled={isVerifying}
                    className="aspect-square rounded-2xl bg-foreground/[0.04] hover:bg-foreground/[0.08] border border-foreground/[0.06] hover:border-foreground/[0.12] text-2xl font-medium text-foreground transition-all duration-150 active:scale-95 disabled:opacity-50"
                  >
                    {num}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleNumberPress("0")}
                  disabled={isVerifying}
                  className="h-[70px] rounded-2xl bg-foreground/[0.04] hover:bg-foreground/[0.08] border border-foreground/[0.06] hover:border-foreground/[0.12] text-2xl font-medium text-foreground transition-all duration-150 active:scale-95 disabled:opacity-50"
                >
                  0
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isVerifying}
                  className="h-[70px] rounded-2xl bg-foreground/[0.04] hover:bg-foreground/[0.08] border border-foreground/[0.06] hover:border-foreground/[0.12] flex items-center justify-center text-foreground/60 transition-all duration-150 active:scale-95 disabled:opacity-50"
                >
                  <Delete className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button className="h-12 rounded-2xl bg-foreground/[0.04] hover:bg-foreground/[0.08] border border-foreground/[0.06] hover:border-foreground/[0.12] flex items-center justify-center gap-2 group transition-all duration-150 active:scale-95 hover:border-primary/30">
                  <Fingerprint className="w-5 h-5 text-foreground/60 group-hover:text-primary transition-colors" />
                  <span className="text-sm text-foreground/40 group-hover:text-foreground/60 transition-colors">Touch ID</span>
                </button>
                
                <button className="h-12 rounded-2xl bg-foreground/[0.04] hover:bg-foreground/[0.08] border border-foreground/[0.06] hover:border-foreground/[0.12] flex items-center justify-center gap-2 group transition-all duration-150 active:scale-95 hover:border-primary/30">
                  <ScanFace className="w-5 h-5 text-foreground/60 group-hover:text-primary transition-colors" />
                  <span className="text-sm text-foreground/40 group-hover:text-foreground/60 transition-colors">Face ID</span>
                </button>
              </div>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-xs text-foreground/30 mt-8"
            >
              Forgot PIN? Contact your manager
            </motion.p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ClockIn;
