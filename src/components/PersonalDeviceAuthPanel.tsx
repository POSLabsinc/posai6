import { motion, AnimatePresence } from "framer-motion";
import { MapPin, User, ShieldCheck, Lock, CheckCircle2, Send, Clock } from "lucide-react";
import eatosLogo from "@/assets/icons/eatos-logo.svg";
import restaurantLogo from "@/assets/icons/restaurant-logo.png";
import { useState, useEffect } from "react";

export type PersonalDeviceScreen = 
  | "link-device" 
  | "sign-in" 
  | "2fa-selection" 
  | "verification-code";

interface PersonalDeviceAuthPanelProps {
  currentScreen: PersonalDeviceScreen;
  invitedUser?: {
    name: string;
    email: string;
    role: string;
  } | null;
}

// Get time-based greeting and info
const getTimeOfDayInfo = (date: Date) => {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) {
    return { greeting: "Good morning", period: "Morning" };
  } else if (hour >= 12 && hour < 17) {
    return { greeting: "Good afternoon", period: "Afternoon" };
  } else if (hour >= 17 && hour < 21) {
    return { greeting: "Good evening", period: "Evening" };
  } else {
    return { greeting: "Welcome", period: "Night" };
  }
};

export const PersonalDeviceAuthPanel = ({ currentScreen, invitedUser }: PersonalDeviceAuthPanelProps) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const timeInfo = getTimeOfDayInfo(currentTime);
  
  const formattedDate = currentTime.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });
  
  const formattedTime = currentTime.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  const getScreenConfig = () => {
    switch (currentScreen) {
      case "link-device":
        return {
          icon: <User className="w-6 h-6 text-primary" />,
          title: "Personal Device Access",
          description: "You're signing in using your own device"
        };
      case "sign-in":
        return {
          icon: <ShieldCheck className="w-6 h-6 text-primary" />,
          title: "Identity Verification",
          description: "Confirm your credentials to continue"
        };
      case "2fa-selection":
        return {
          icon: <Lock className="w-6 h-6 text-amber-500" />,
          title: "Extra Security Check",
          description: "Organization requires 2-step verification"
        };
      case "verification-code":
        return {
          icon: <Send className="w-6 h-6 text-primary" />,
          title: "Confirm It's You",
          description: "Enter the code sent to your device"
        };
      default:
        return {
          icon: <User className="w-6 h-6 text-primary" />,
          title: "Personal Device Access",
          description: "Securely link your device"
        };
    }
  };

  const renderScreenFeatures = () => {
    switch (currentScreen) {
      case "link-device":
        return (
          <>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-primary/60" />
              <span className="text-sm text-foreground/60">Securely linking this device to the restaurant POS</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-primary/60" />
              <span className="text-sm text-foreground/60">Requires a one-time code or QR from your manager</span>
            </div>
          </>
        );
      case "sign-in":
        return (
          <>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-primary/60" />
              <span className="text-sm text-foreground/60">Confirms you're an approved staff member</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-primary/60" />
              <span className="text-sm text-foreground/60">Prevents unauthorized POS access</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-primary/60" />
              <span className="text-sm text-foreground/60">Credentials verified against organization policy</span>
            </div>
          </>
        );
      case "2fa-selection":
        return (
          <>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-primary/60" />
              <span className="text-sm text-foreground/60">Choose how you'd like to receive your code</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-primary/60" />
              <span className="text-sm text-foreground/60">Protects restaurant and customer data</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-primary/60" />
              <span className="text-sm text-foreground/60">Required for personal devices</span>
            </div>
          </>
        );
      case "verification-code":
        return (
          <>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-primary/60" />
              <span className="text-sm text-foreground/60">One-time code sent to your selected method</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-primary/60" />
              <span className="text-sm text-foreground/60">Code expires automatically</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-primary/60" />
              <span className="text-sm text-foreground/60">Device access will be temporarily trusted</span>
            </div>
          </>
        );
      default:
        return null;
    }
  };

  const screenConfig = getScreenConfig();

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="w-[42%] lg:w-[38%] min-w-[360px] max-w-[520px] h-full flex flex-col bg-foreground/[0.015] border-r border-foreground/[0.06] overflow-hidden"
    >
      <div className="flex-1 flex flex-col justify-center px-10 lg:px-14 py-10">
        {/* Logo */}
        <motion.img
          src={eatosLogo}
          alt="eatOS"
          className="w-24 h-auto mb-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        />

        {/* Greeting */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mb-8"
        >
          <p className="text-lg text-foreground/60 mb-1">{timeInfo.greeting}</p>
          <p className="text-sm text-foreground/40">{formattedDate}</p>
        </motion.div>

        {/* Content Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentScreen}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="p-6 rounded-2xl bg-foreground/[0.03] border border-foreground/[0.06] mb-8"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                {screenConfig.icon}
              </div>
              <h3 className="text-base font-semibold text-foreground">
                {screenConfig.title}
              </h3>
            </div>
            <p className="text-sm text-foreground/50 leading-relaxed mb-5">
              {screenConfig.description}
            </p>
            <div className="space-y-2.5">
              {renderScreenFeatures()}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Restaurant Info */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden">
              <img 
                src={restaurantLogo} 
                alt="Restaurant" 
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground/80">The Rustic Table</p>
              <p className="text-xs text-foreground/40">Downtown - Main Street</p>
            </div>
          </div>

          {/* Invited By - only show on link-device screen */}
          {currentScreen === "link-device" && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <User className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground/80">Invited by Mia Jones</p>
                <p className="text-xs text-foreground/40">Manager</p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Current Time */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-auto pt-8 flex items-center gap-2 text-foreground/30"
        >
          <Clock className="w-4 h-4" />
          <span className="text-sm">{formattedTime}</span>
        </motion.div>
      </div>
    </motion.div>
  );
};