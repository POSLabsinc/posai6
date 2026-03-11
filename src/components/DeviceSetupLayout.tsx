import { motion } from "framer-motion";
import { Monitor, Clock, ShieldCheck, CheckCircle2 } from "lucide-react";
import eatosLogo from "@/assets/icons/eatos-logo.svg";
import restaurantLogo from "@/assets/icons/restaurant-logo.png";
import { useIsMobile } from "@/hooks/use-mobile";
import { ReactNode } from "react";

interface DeviceSetupLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  variant?: "setup" | "demo" | "activation" | "admin";
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

export function DeviceSetupLayout({ children, title, subtitle, variant = "setup" }: DeviceSetupLayoutProps) {
  const isMobile = useIsMobile();
  const currentTime = new Date();
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

  // Get variant-specific content
  const getVariantContent = () => {
    switch (variant) {
      case "demo":
        return {
          icon: <Monitor className="w-6 h-6 text-amber-500" />,
          title: "Demo Experience",
          description: "Explore eatOS with sample data. Perfect for training or evaluation — no real data will be affected.",
          features: [
            "Sample menu items and categories",
            "Mock orders and transactions",
            "Full feature exploration"
          ]
        };
      case "activation":
        return {
          icon: <ShieldCheck className="w-6 h-6 text-primary" />,
          title: "Secure Activation",
          description: "Your device activation is protected with industry-standard security measures.",
          features: [
            "Time-limited activation codes",
            "Secure email verification",
            "Device trust establishment"
          ]
        };
      case "admin":
        return {
          icon: <ShieldCheck className="w-6 h-6 text-primary" />,
          title: "Admin Access",
          description: "Sign in with your administrator credentials to activate and manage this device.",
          features: [
            "Full device management",
            "Configure business settings",
            "Assign staff permissions"
          ]
        };
      default:
        return {
          icon: <Monitor className="w-6 h-6 text-primary" />,
          title: "Device Setup",
          description: "Connect this device to your business to start taking orders and managing your restaurant.",
          features: [
            "Quick 2-minute setup",
            "Secure device pairing",
            "Automatic sync with your account"
          ]
        };
    }
  };

  const variantContent = getVariantContent();

  // Mobile: Single column layout
  if (isMobile) {
    return (
      <div className="fixed inset-0 login-bg flex flex-col items-center justify-center overflow-hidden px-5 pb-16">
        <div className="absolute inset-0 gradient-mesh opacity-30" />
        {children}
      </div>
    );
  }

  // Tablet/Web: Two-column layout
  return (
    <div className="fixed inset-0 login-bg flex overflow-hidden">
      <div className="absolute inset-0 gradient-mesh opacity-30" />
      
      {/* Left Panel - Context & Visual Content */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 hidden md:flex w-[42%] lg:w-[38%] min-w-[360px] max-w-[520px] h-full flex-col bg-foreground/[0.015] border-r border-foreground/[0.06]"
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

          {/* Variant Content Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-6 rounded-2xl bg-foreground/[0.03] border border-foreground/[0.06] mb-8"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                {variantContent.icon}
              </div>
              <h3 className="text-base font-semibold text-foreground">
                {variantContent.title}
              </h3>
            </div>
            <p className="text-sm text-foreground/50 leading-relaxed mb-5">
              {variantContent.description}
            </p>
            <div className="space-y-2.5">
              {variantContent.features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-primary/60" />
                  <span className="text-sm text-foreground/60">{feature}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Restaurant Info (subtle) */}
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

      {/* Right Panel - Action Content */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-6 md:px-10 lg:px-16 h-full">
        <div className="w-full max-w-md h-full flex items-center justify-center">
          {children}
        </div>
      </div>
    </div>
  );
}
