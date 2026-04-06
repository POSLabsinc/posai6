import { useState, useEffect, useCallback, useRef } from "react";
import { format, differenceInMinutes } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sun, Fingerprint, ScanFace, ChevronDown, Check, Clock,
  MapPin, Briefcase, X, Timer, LogOut, Coffee, ArrowLeft
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────
interface StandaloneClockInScreenProps {
  isOpen: boolean;
  onClose: () => void;
  onEnterPOS: () => void;
  onLogout?: () => void;
}

interface DemoEmployee {
  id: string;
  name: string;
  role: string;
  jobTypes: string[];
  avatar: string;
}

type ScreenView = "pin" | "actions" | "clockin-summary" | "clockout-summary" | "break-summary";

// ── Demo Data ──────────────────────────────────────────────────────────────
const DEMO_EMPLOYEES: Record<string, DemoEmployee> = {
  "1234": { id: "1", name: "Sarah Johnson", role: "Server", jobTypes: ["Server", "Bartender"], avatar: "SJ" },
  "5678": { id: "2", name: "Mike Chen", role: "Manager", jobTypes: ["Manager"], avatar: "MC" },
  "0000": { id: "3", name: "Alex Rivera", role: "Host", jobTypes: ["Host"], avatar: "AR" },
};

// Get device PIN set during onboarding (if any)
function getDevicePinEmployee(): { pin: string; pinLength: number; employee: DemoEmployee } | null {
  try {
    const savedPin = localStorage.getItem("pos_device_pin");
    const savedLen = localStorage.getItem("pos_device_pin_length");
    if (savedPin) {
      return {
        pin: savedPin,
        pinLength: parseInt(savedLen || "4", 10),
        employee: { id: "guest-device", name: "Guest", role: "Guest", jobTypes: ["Guest"], avatar: "G" },
      };
    }
  } catch {}
  return null;
}

const REVENUE_CENTERS = ["Dine-In", "Bar", "Patio", "Takeout", "Drive-Thru"];

// ── CSS (injected once) ────────────────────────────────────────────────────
const STYLE_ID = "standalone-clockin-styles";
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800&display=swap');

.sci-root { font-family: 'Montserrat', sans-serif; }

/* 3D Keypad buttons */
.sci-key {
  position: relative;
  border-radius: 14px;
  font-family: 'Montserrat', sans-serif;
  font-weight: 600;
  cursor: pointer;
  user-select: none;
  transition: transform 0.1s, box-shadow 0.1s;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  outline: none;
}
.sci-key:active { transform: scale(0.94) translateY(2px); }

.sci-key-num {
  background: linear-gradient(145deg, #3a3a3a, #2a2a2a);
  box-shadow: 0 4px 0 #1a1a1a, 0 6px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08);
  color: #e0e0e0;
  font-size: 22px;
}
.sci-key-num:active {
  box-shadow: 0 1px 0 #1a1a1a, 0 2px 4px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05);
}

.sci-key-enter {
  background: linear-gradient(145deg, #4a4a4a, #3a3a3a);
  box-shadow: 0 4px 0 #252525, 0 6px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1);
  color: #ccc;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 1.5px;
}

.sci-key-clockin {
  background: linear-gradient(145deg, #ffffff, #e5e5e5);
  box-shadow: 0 4px 0 #d4d4d4, 0 6px 12px rgba(255,255,255,0.2), inset 0 1px 0 rgba(255,255,255,0.5);
  color: #000000;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.5px;
}
.sci-key-clockin:active {
  box-shadow: 0 1px 0 #d4d4d4, 0 2px 4px rgba(255,255,255,0.1);
}

.sci-key-clockout {
  background: linear-gradient(145deg, #ef4444, #dc2626);
  box-shadow: 0 4px 0 #b91c1c, 0 6px 12px rgba(239,68,68,0.3), inset 0 1px 0 rgba(255,255,255,0.15);
  color: white;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.sci-key-break {
  background: linear-gradient(145deg, #525252, #404040);
  box-shadow: 0 4px 0 #333, 0 6px 12px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.08);
  color: #d4d4d4;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.sci-key-dark {
  background: linear-gradient(145deg, #2a2a2a, #1e1e1e);
  box-shadow: 0 4px 0 #141414, 0 6px 12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05);
  color: #999;
}

.sci-key-revenue {
  background: linear-gradient(145deg, #333, #282828);
  box-shadow: 0 3px 0 #1a1a1a, 0 5px 10px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06);
  color: #bbb;
  font-size: 12px;
  font-weight: 600;
}

.sci-key-logout {
  background: linear-gradient(145deg, #333, #282828);
  box-shadow: 0 3px 0 #1a1a1a, 0 5px 10px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06);
  color: #ef4444;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1px;
}

@keyframes sci-bounce {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.08); }
}
.sci-bounce { animation: sci-bounce 0.3s ease; }

@keyframes sci-pulse-green {
  0%, 100% { box-shadow: 0 0 0 0 rgba(255,255,255,0.3); }
  50% { box-shadow: 0 0 20px 6px rgba(255,255,255,0.15); }
}
.sci-pulse-green { animation: sci-pulse-green 2s infinite; }
`;

// ── Component ──────────────────────────────────────────────────────────────
export const StandaloneClockInScreen = ({
  isOpen, onClose, onEnterPOS, onLogout
}: StandaloneClockInScreenProps) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [employee, setEmployee] = useState<DemoEmployee | null>(null);
  const [view, setView] = useState<ScreenView>("pin");
  const [revenueCenter, setRevenueCenter] = useState("Dine-In");
  const [rcOpen, setRcOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [clockInTime] = useState(new Date());
  const [isClockedIn, setIsClockedIn] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Inject CSS
  useEffect(() => {
    if (!document.getElementById(STYLE_ID)) {
      const s = document.createElement("style");
      s.id = STYLE_ID;
      s.textContent = CSS;
      document.head.appendChild(s);
    }
  }, []);

  // Clock tick
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Responsive
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Keyboard input
  useEffect(() => {
    if (!isOpen || view !== "pin") return;
    const handler = (e: KeyboardEvent) => {
      if (e.key >= "0" && e.key <= "9") handleDigit(e.key);
      else if (e.key === "Backspace") handleClear();
      else if (e.key === "Enter") handleEnter();
      else if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, view, pin]);

  const devicePinInfo = getDevicePinEmployee();
  const maxPinLength = devicePinInfo?.pinLength || 4;

  const handleDigit = useCallback((d: string) => {
    if (pin.length >= maxPinLength || error) return;
    setPin(p => p + d);
  }, [pin, error, maxPinLength]);

  const handleClear = useCallback(() => {
    if (error) { setError(false); setErrorMsg(""); }
    setPin(p => p.slice(0, -1));
  }, [error]);

  const handleClearAll = useCallback(() => {
    setPin("");
    setError(false);
    setErrorMsg("");
  }, []);

  const handleEnter = useCallback(() => {
    // Check device PIN first (supports 4 or 6 digit)
    if (devicePinInfo && pin.length === devicePinInfo.pinLength && pin === devicePinInfo.pin) {
      setEmployee(devicePinInfo.employee);
      setSelectedJob(devicePinInfo.employee.jobTypes[0]);
      setError(false);
      setErrorMsg("");
      setView("actions");
      return;
    }
    // Then check demo employees (4-digit)
    if (pin.length === 4) {
      const emp = DEMO_EMPLOYEES[pin];
      if (emp) {
        setEmployee(emp);
        setSelectedJob(emp.jobTypes[0]);
        setError(false);
        setErrorMsg("");
        setView("actions");
        return;
      }
    }
    // Invalid
    if (pin.length >= 4) {
      setError(true);
      setErrorMsg("Invalid PIN");
      setTimeout(() => { setPin(""); setError(false); setErrorMsg(""); }, 1500);
    }
  }, [pin, devicePinInfo]);
  

  const handleClockIn = () => {
    setIsClockedIn(true);
    setView("clockin-summary");
  };

  const handleClockOut = () => {
    setIsClockedIn(false);
    setView("clockout-summary");
  };

  const handleBreak = () => {
    setView("break-summary");
  };

  const resetToPin = () => {
    setPin("");
    setEmployee(null);
    setView("pin");
    setError(false);
    setErrorMsg("");
  };

  if (!isOpen) return null;

  const timeStr = format(currentTime, "hh:mm");
  const ampm = format(currentTime, "a");
  const dateStr = format(currentTime, "EEEE, MMMM d, yyyy");
  const hrs = format(currentTime, "HH");
  const isDay = parseInt(hrs) >= 6 && parseInt(hrs) < 18;

  // ── PIN Dots ──
  const renderPinDots = () => (
    <div className="flex items-center justify-center gap-3 mb-1">
      {Array.from({ length: maxPinLength }).map((_, i) => (
        <div key={i} className="relative">
          <div className={`w-4 h-4 rounded-full transition-all duration-200 ${
            error ? (i < pin.length ? "bg-red-500 scale-110" : "bg-white/10")
            : i < pin.length ? "bg-white scale-110" : "bg-white/10"
          }`} />
        </div>
      ))}
    </div>
  );

  // ── Keypad ──
  const renderKeypad = () => (
    <div className="w-full max-w-[320px] mx-auto">
      <div className="grid grid-cols-3 gap-2.5 mb-2.5">
        {[1,2,3,4,5,6,7,8,9].map(n => (
          <button key={n} onClick={() => handleDigit(String(n))}
            className="sci-key sci-key-num h-[62px]">{n}</button>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2.5">
        <button onClick={handleClearAll}
          className="sci-key sci-key-num h-[62px] text-[16px]">C</button>
        <button onClick={() => handleDigit("0")}
          className="sci-key sci-key-num h-[62px]">0</button>
        <button onClick={handleEnter}
          className="sci-key sci-key-enter h-[62px]">ENTER</button>
      </div>
    </div>
  );

  // ── Action Buttons ──
  const renderActions = () => (
    <div className="flex flex-col items-center gap-4 w-full max-w-[320px] mx-auto">
      <div className="text-center mb-2">
        <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center text-white text-xl font-bold mx-auto mb-3">
          {employee?.avatar}
        </div>
        <p className="text-white text-lg font-semibold">{employee?.name}</p>
        <p className="text-white/50 text-sm">{employee?.role}</p>
      </div>

      {/* Job Type selector */}
      {employee && employee.jobTypes.length > 1 && (
        <div className="flex gap-2 flex-wrap justify-center">
          {employee.jobTypes.map(j => (
            <button key={j} onClick={() => setSelectedJob(j)}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                selectedJob === j ? "bg-white text-black" : "bg-white/10 text-white/70 hover:bg-white/15"
              }`}>{j}</button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 w-full mt-2">
        {isClockedIn ? (
          <>
            <button onClick={handleClockOut}
              className="sci-key sci-key-clockout h-[56px] w-full flex items-center justify-center gap-2">
              <Timer className="w-4 h-4" /> CLOCK OUT
            </button>
            <button onClick={handleBreak}
              className="sci-key sci-key-break h-[56px] w-full flex items-center justify-center gap-2">
              <Coffee className="w-4 h-4" /> BREAK
            </button>
          </>
        ) : (
          <button onClick={handleClockIn}
            className="sci-key sci-key-clockin h-[56px] w-full flex items-center justify-center gap-2 sci-pulse-green">
            <Clock className="w-4 h-4" /> CLOCK IN
          </button>
        )}
      </div>

      <button onClick={resetToPin} className="text-white/40 text-xs mt-2 flex items-center gap-1 hover:text-white/60 transition-colors">
        <ArrowLeft className="w-3 h-3" /> Back
      </button>
    </div>
  );

  // ── Summary Card ──
  const SummaryCard = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
    <div className="flex items-center gap-3 bg-white/[0.06] rounded-2xl px-4 py-3 backdrop-blur-sm border border-white/[0.06]">
      <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">{icon}</div>
      <div>
        <p className="text-white/40 text-[10px] uppercase tracking-wider font-medium">{label}</p>
        <p className="text-white text-sm font-semibold">{value}</p>
      </div>
    </div>
  );

  // ── Clock In Summary ──
  const renderClockInSummary = () => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center gap-4 w-full max-w-[340px] mx-auto px-4">
      <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-1">
        <Check className="w-8 h-8 text-green-400" />
      </div>
      <p className="text-white text-xl font-bold">Clocked In</p>
      <p className="text-white/50 text-sm">{employee?.name}</p>

      <div className="flex flex-col gap-2.5 w-full mt-2">
        <SummaryCard icon={<Clock className="w-4 h-4 text-blue-400" />} label="Time" value={format(currentTime, "hh:mm a")} />
        <SummaryCard icon={<MapPin className="w-4 h-4 text-orange-400" />} label="Revenue Center" value={revenueCenter} />
        <SummaryCard icon={<Briefcase className="w-4 h-4 text-purple-400" />} label="Job Type" value={selectedJob} />
      </div>

      <button onClick={onEnterPOS}
        className="sci-key sci-key-clockin h-[52px] w-full mt-3 text-sm font-bold">
        Enter Point of Sale
      </button>
      <button onClick={resetToPin} className="text-white/40 text-xs flex items-center gap-1 hover:text-white/60">
        <ArrowLeft className="w-3 h-3" /> Switch User
      </button>
    </motion.div>
  );

  // ── Clock Out Summary ──
  const renderClockOutSummary = () => {
    const mins = differenceInMinutes(currentTime, clockInTime);
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center gap-4 w-full max-w-[340px] mx-auto px-4">
        <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-1">
          <Timer className="w-8 h-8 text-red-400" />
        </div>
        <p className="text-white text-xl font-bold">Clocked Out</p>
        <p className="text-white/50 text-sm">{employee?.name}</p>

        <div className="flex flex-col gap-2.5 w-full mt-2">
          <SummaryCard icon={<Clock className="w-4 h-4 text-blue-400" />} label="Total Hours" value={`${h}h ${m}m`} />
          <SummaryCard icon={<Coffee className="w-4 h-4 text-amber-400" />} label="Break" value="0m" />
          <SummaryCard icon={<MapPin className="w-4 h-4 text-orange-400" />} label="Revenue Center" value={revenueCenter} />
        </div>

        <button onClick={resetToPin}
          className="sci-key sci-key-enter h-[52px] w-full mt-3 text-sm font-bold">
          Done
        </button>
      </motion.div>
    );
  };

  // ── Break Summary ──
  const renderBreakSummary = () => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center gap-4 w-full max-w-[340px] mx-auto px-4">
      <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mb-1">
        <Coffee className="w-8 h-8 text-amber-400" />
      </div>
      <p className="text-white text-xl font-bold">On Break</p>
      <p className="text-white/50 text-sm">{employee?.name}</p>

      <div className="flex flex-col gap-2.5 w-full mt-2">
        <SummaryCard icon={<Clock className="w-4 h-4 text-blue-400" />} label="Break Started" value={format(currentTime, "hh:mm a")} />
      </div>

      <button onClick={() => setView("actions")}
        className="sci-key sci-key-break h-[52px] w-full mt-3 text-sm font-bold flex items-center justify-center gap-2">
        End Break
      </button>
    </motion.div>
  );

  // ── Bottom Bar (PIN view) ──
  const renderBottomBar = () => (
    <div className="grid grid-cols-4 gap-2 w-full max-w-[320px] mx-auto mt-3">
      <button onClick={() => alert("Fingerprint auth not available in standalone mode")}
        className="sci-key sci-key-dark h-[48px]">
        <Fingerprint className="w-5 h-5" />
      </button>
      <button onClick={() => setRcOpen(!rcOpen)}
        className="sci-key sci-key-revenue h-[48px] col-span-1 relative flex items-center justify-center gap-1">
        <span className="truncate text-[11px]">{revenueCenter}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${rcOpen ? "rotate-180" : ""}`} />
      </button>
      <button onClick={() => alert("Face ID not available in standalone mode")}
        className="sci-key sci-key-dark h-[48px]">
        <ScanFace className="w-5 h-5" />
      </button>
      <button onClick={onLogout || onClose}
        className="sci-key sci-key-logout h-[48px] flex items-center justify-center gap-1">
        <LogOut className="w-3.5 h-3.5" /> <span>LOG OUT</span>
      </button>
    </div>
  );

  // ── Revenue Center Dropdown ──
  const renderRCDropdown = () => rcOpen && (
    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
      className="absolute bottom-[60px] left-1/2 -translate-x-1/2 bg-[#2a2a2a] rounded-xl border border-white/10 overflow-hidden shadow-2xl z-50 w-[200px]">
      {REVENUE_CENTERS.map(rc => (
        <button key={rc} onClick={() => { setRevenueCenter(rc); setRcOpen(false); }}
          className={`w-full px-4 py-3 text-left text-sm font-medium transition-colors ${
            rc === revenueCenter ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5 hover:text-white"
          }`}>{rc}</button>
      ))}
    </motion.div>
  );

  // ── Left Panel (Desktop) ──
  const renderLeftPanel = () => (
    <div className="flex flex-col items-center justify-center flex-1 px-8">
      <div className="flex items-center gap-2 text-white/40 text-sm mb-6">
        <Sun className="w-4 h-4 text-yellow-400" />
        <span>{isDay ? "72\u00b0F Sunny" : "58\u00b0F Clear"}</span>
      </div>

      <p className="text-white/50 text-sm font-medium tracking-wide mb-4">{dateStr}</p>

      <div className="flex items-baseline gap-1 mb-6">
        <span className="text-white text-[96px] font-extralight leading-none tracking-tight">{timeStr}</span>
        <span className="text-white/40 text-2xl font-light">{ampm}</span>
      </div>

      <div className="flex items-center gap-1.5 text-white/30 text-xs">
        <MapPin className="w-3 h-3" />
        <span>Main Street Location</span>
      </div>
    </div>
  );

  // ── Right Panel ──
  const renderRightPanel = () => (
    <div className="flex flex-col items-center justify-center flex-1 px-4 py-6 relative">
      {/* Close button */}
      <button onClick={onClose}
        className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white/70 hover:bg-white/10 transition-all">
        <X className="w-4 h-4" />
      </button>

      <AnimatePresence mode="wait">
        {view === "pin" && (
          <motion.div key="pin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center w-full">
            <p className="text-white/60 text-sm font-medium mb-6 tracking-wide">Enter your PIN</p>
            {renderPinDots()}
            {errorMsg && (
              <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                className="text-red-400 text-xs mt-2 mb-2">{errorMsg}</motion.p>
            )}
            <div className="mt-5 w-full flex flex-col items-center">
              {renderKeypad()}
              <div className="relative w-full max-w-[320px]">
                {renderBottomBar()}
                <AnimatePresence>{renderRCDropdown()}</AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
        {view === "actions" && (
          <motion.div key="actions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="w-full flex justify-center">
            {renderActions()}
          </motion.div>
        )}
        {view === "clockin-summary" && <motion.div key="cis">{renderClockInSummary()}</motion.div>}
        {view === "clockout-summary" && <motion.div key="cos">{renderClockOutSummary()}</motion.div>}
        {view === "break-summary" && <motion.div key="bs">{renderBreakSummary()}</motion.div>}
      </AnimatePresence>
    </div>
  );

  // ── Mobile Layout ──
  if (isMobile) {
    return (
      <AnimatePresence>
        {isOpen && (
          <motion.div ref={containerRef}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="sci-root fixed inset-0 z-[9999] bg-[#0a0a0a] flex flex-col">
            {/* Top bar */}
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
              <div className="flex items-center gap-2">
                <Sun className="w-3.5 h-3.5 text-yellow-400" />
                <span className="text-white/40 text-xs">{isDay ? "72\u00b0F" : "58\u00b0F"}</span>
              </div>
              <p className="text-white/50 text-xs">{format(currentTime, "EEE, MMM d")}</p>
              <div className="flex items-baseline gap-0.5">
                <span className="text-white text-sm font-medium">{timeStr}</span>
                <span className="text-white/40 text-[10px]">{ampm}</span>
              </div>
            </div>
            <div className="flex-1 flex items-center justify-center overflow-y-auto">
              {renderRightPanel()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  // ── Desktop Layout ──
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div ref={containerRef}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="sci-root fixed inset-0 z-[9999] bg-[#0a0a0a]/95 backdrop-blur-xl flex">
          {renderLeftPanel()}
          <div className="w-px bg-white/[0.06]" />
          {renderRightPanel()}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default StandaloneClockInScreen;
