import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, QrCode, Search, Link2, ShieldCheck, Mail, MessageSquare, Phone } from "lucide-react";

interface TutorialStep {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  iconBg: string;
  instructions: string[];
  callout?: string;
  highlightArea: { top: string; left: string; width: string; height: string };
  arrowDirection: "left" | "right" | "down" | "up";
}

const newUserSteps: TutorialStep[] = [
  {
    title: "Step 1: Scan QR Code",
    subtitle: "Use your phone to scan",
    icon: <QrCode className="w-5 h-5 text-primary" />,
    iconBg: "bg-primary/15",
    instructions: [
      "Open the camera app on your phone or tablet",
      "Point it at the QR code displayed on this screen",
      "A link will appear on your device, tap it to proceed",
      "Follow the on-screen instructions to complete activation",
    ],
    callout: "Most modern phones support QR scanning natively through the camera app.",
    highlightArea: { top: "26%", left: "10%", width: "32%", height: "52%" },
    arrowDirection: "right",
  },
  {
    title: "Step 2: Activation Code",
    subtitle: "Your unique pairing code",
    icon: <Search className="w-5 h-5 text-primary" />,
    iconBg: "bg-primary/15",
    instructions: [
      "This is your unique activation code for this device",
      "You will need this code during the activation process",
      "Enter it when prompted on your mobile device or browser",
      "The code refreshes periodically for security",
    ],
    highlightArea: { top: "55%", left: "50%", width: "38%", height: "12%" },
    arrowDirection: "left",
  },
  {
    title: "Step 3: Activation Link",
    subtitle: "Open this URL in a browser",
    icon: <Link2 className="w-5 h-5 text-primary" />,
    iconBg: "bg-primary/15",
    instructions: [
      "If QR scanning is not available, use this link instead",
      "Open any browser on your phone or computer",
      "Type the URL shown here into the address bar",
      "You will be prompted to enter the activation code",
    ],
    highlightArea: { top: "37%", left: "50%", width: "38%", height: "8%" },
    arrowDirection: "left",
  },
  {
    title: "Step 4: Enter the Code",
    subtitle: "Complete the activation",
    icon: <ShieldCheck className="w-5 h-5 text-primary" />,
    iconBg: "bg-primary/15",
    instructions: [
      "After opening the link, you will see a code entry screen",
      "Enter the activation code shown on this device",
      "Make sure to enter the code exactly as displayed",
      "Once verified, your device will be activated automatically",
    ],
    callout: "If the code expires, a new one will be generated automatically.",
    highlightArea: { top: "55%", left: "50%", width: "38%", height: "12%" },
    arrowDirection: "left",
  },
  {
    title: "Step 5: Alternative Activation",
    subtitle: "Use email or phone instead",
    icon: <Mail className="w-5 h-5 text-primary" />,
    iconBg: "bg-primary/15",
    instructions: [
      "Tap this button to switch to email or phone activation",
      "You can verify your identity using a code sent to your email",
      "Or receive a verification code via SMS to your phone",
    ],
    highlightArea: { top: "80%", left: "35%", width: "30%", height: "6%" },
    arrowDirection: "down",
  },
  {
    title: "Step 6: Enter Contact Info",
    subtitle: "Email or phone number",
    icon: <MessageSquare className="w-5 h-5 text-primary" />,
    iconBg: "bg-primary/15",
    instructions: [
      "Enter your registered email address or phone number",
      "Tap 'Send Code' to receive a 6-digit verification code",
      "Check your inbox or messages for the code",
    ],
    callout: "If you don't receive the code, you can resend it after a few seconds.",
    highlightArea: { top: "26%", left: "50%", width: "38%", height: "30%" },
    arrowDirection: "left",
  },
  {
    title: "Step 7: Enter Verification Code",
    subtitle: "Complete activation",
    icon: <Phone className="w-5 h-5 text-primary" />,
    iconBg: "bg-primary/15",
    instructions: [
      "Enter the 6-digit code received on your email or phone",
      "Each digit goes in a separate box",
      "Your device will activate automatically once verified",
    ],
    highlightArea: { top: "40%", left: "50%", width: "38%", height: "15%" },
    arrowDirection: "left",
  },
];

const existingUserSteps: TutorialStep[] = [
  {
    title: "Step 1: Scan QR Code",
    subtitle: "Use your phone to scan",
    icon: <QrCode className="w-5 h-5 text-primary" />,
    iconBg: "bg-primary/15",
    instructions: [
      "Open the camera app on your phone or tablet",
      "Point it at the QR code displayed on this screen",
      "A link will appear on your device, tap it to proceed",
      "Follow the on-screen instructions to sign in",
    ],
    callout: "Most modern phones support QR scanning natively through the camera app.",
    highlightArea: { top: "26%", left: "10%", width: "32%", height: "52%" },
    arrowDirection: "right",
  },
  {
    title: "Step 2: Activation Code",
    subtitle: "Your unique pairing code",
    icon: <Search className="w-5 h-5 text-primary" />,
    iconBg: "bg-primary/15",
    instructions: [
      "This is your unique sign-in code for this device",
      "You will need this code during the sign-in process",
      "Enter it when prompted on your mobile device or browser",
      "The code refreshes periodically for security",
    ],
    highlightArea: { top: "55%", left: "50%", width: "38%", height: "12%" },
    arrowDirection: "left",
  },
  {
    title: "Step 3: Activation Link",
    subtitle: "Open this URL in a browser",
    icon: <Link2 className="w-5 h-5 text-primary" />,
    iconBg: "bg-primary/15",
    instructions: [
      "If QR scanning is not available, use this link instead",
      "Open any browser on your phone or computer",
      "Type the URL shown here into the address bar",
      "You will be prompted to enter the sign-in code",
    ],
    highlightArea: { top: "37%", left: "50%", width: "38%", height: "8%" },
    arrowDirection: "left",
  },
  {
    title: "Step 4: Enter the Code",
    subtitle: "Complete sign-in",
    icon: <ShieldCheck className="w-5 h-5 text-primary" />,
    iconBg: "bg-primary/15",
    instructions: [
      "After opening the link, you will see a code entry screen",
      "Enter the sign-in code shown on this device",
      "Make sure to enter the code exactly as displayed",
      "Once verified, you will be signed in automatically",
    ],
    callout: "If the code expires, a new one will be generated automatically.",
    highlightArea: { top: "55%", left: "50%", width: "38%", height: "12%" },
    arrowDirection: "left",
  },
  {
    title: "Step 5: Other Sign-In Options",
    subtitle: "Additional methods available",
    icon: <Mail className="w-5 h-5 text-primary" />,
    iconBg: "bg-primary/15",
    instructions: [
      "Tap here for additional sign-in methods",
      "Options include activation code entry",
      "Or access demo mode to explore the system",
    ],
    highlightArea: { top: "80%", left: "35%", width: "30%", height: "6%" },
    arrowDirection: "down",
  },
];

interface Props {
  open: boolean;
  onClose: () => void;
  variant: "new" | "existing";
}

const DeviceSetupTutorialOverlay = ({ open, onClose, variant }: Props) => {
  const [currentStep, setCurrentStep] = useState(0);
  const steps = variant === "new" ? newUserSteps : existingUserSteps;

  useEffect(() => {
    if (open) setCurrentStep(0);
  }, [open]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const step = steps[currentStep];
  const h = step.highlightArea;

  // Arrow SVG pointing from card to highlighted area
  const arrowPaths: Record<string, string> = {
    right: "M6 16L26 16M26 16L18 8M26 16L18 24",
    left: "M26 16L6 16M6 16L14 8M6 16L14 24",
    down: "M16 6L16 26M16 26L8 18M16 26L24 18",
    up: "M16 26L16 6M16 6L8 14M16 6L24 14",
  };

  const motionDir = step.arrowDirection === "left" ? { x: [0, -6, 0] }
    : step.arrowDirection === "right" ? { x: [0, 6, 0] }
    : step.arrowDirection === "down" ? { y: [0, 6, 0] }
    : { y: [0, -6, 0] };

  const getArrowStyle = (): React.CSSProperties => {
    const arrowSize = 32;
    const dir = step.arrowDirection;
    const base: React.CSSProperties = { position: "absolute", zIndex: 20 };
    if (dir === "right") {
      return { ...base, top: `calc(${h.top} + ${h.height} / 2 - ${arrowSize / 2}px)`, left: `calc(${h.left} + ${h.width} + 6px)` };
    }
    if (dir === "left") {
      return { ...base, top: `calc(${h.top} + ${h.height} / 2 - ${arrowSize / 2}px)`, left: `calc(${h.left} - ${arrowSize + 6}px)` };
    }
    if (dir === "down") {
      return { ...base, top: `calc(${h.top} - ${arrowSize + 6}px)`, left: `calc(${h.left} + ${h.width} / 2 - ${arrowSize / 2}px)` };
    }
    return { ...base, top: `calc(${h.top} + ${h.height} + 6px)`, left: `calc(${h.left} + ${h.width} / 2 - ${arrowSize / 2}px)` };
  };

  // Card position near highlighted area
  const getCardPosition = (): React.CSSProperties => {
    const dir = step.arrowDirection;
    if (dir === "right") {
      return {
        top: "50%",
        left: `calc(${h.left} + ${h.width} + 60px)`,
        transform: "translateY(-50%)",
      };
    }
    if (dir === "left") {
      return {
        top: "50%",
        right: `calc(100% - ${h.left} + 60px)`,
        transform: "translateY(-50%)",
      };
    }
    if (dir === "down") {
      return {
        bottom: `calc(100% - ${h.top} + 50px)`,
        left: `calc(${h.left} + ${h.width} / 2)`,
        transform: "translateX(-50%)",
      };
    }
    return {
      top: `calc(${h.top} + ${h.height} + 50px)`,
      left: `calc(${h.left} + ${h.width} / 2)`,
      transform: "translateX(-50%)",
    };
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[10000] pointer-events-auto"
        >
          {/* Highlight cutout */}
          <motion.div
            key={currentStep}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="absolute rounded-xl"
            style={{
              top: h.top,
              left: h.left,
              width: h.width,
              height: h.height,
              boxShadow: "0 0 0 9999px rgba(0,0,0,0.82)",
              border: "2px solid hsl(var(--primary) / 0.6)",
            }}
          />

          {/* Animated arrow */}
          <motion.div
            key={`arrow-${currentStep}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.25 }}
            style={getArrowStyle()}
          >
            <motion.div
              animate={motionDir}
              transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
            >
              <svg width={32} height={32} viewBox="0 0 32 32" fill="none">
                <path d={arrowPaths[step.arrowDirection]} stroke="hsl(var(--primary))" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </motion.div>
          </motion.div>

          {/* Dark themed card */}
          <motion.div
            key={`card-${currentStep}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.3 }}
            className="absolute z-30 w-[420px]"
            style={getCardPosition()}
          >
            <div className="rounded-2xl bg-[#1E1E22] border border-white/10 shadow-2xl p-5">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${step.iconBg} flex items-center justify-center`}>
                    {step.icon}
                  </div>
                  <div>
                    <h3 className="text-[15px] font-bold text-white">{step.title}</h3>
                    <p className="text-xs text-white/50">{step.subtitle}</p>
                  </div>
                </div>
                <span className="text-xs text-white/40 font-medium">{currentStep + 1}/{steps.length}</span>
              </div>

              {/* Instructions */}
              <div className="space-y-3 mb-4">
                {step.instructions.map((instruction, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="text-primary font-bold text-sm min-w-[16px]">{i + 1}</span>
                    <p className="text-sm text-white/80 leading-relaxed">{instruction}</p>
                  </div>
                ))}
              </div>

              {/* Callout */}
              {step.callout && (
                <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 px-3.5 py-2.5 mb-4">
                  <p className="text-xs text-amber-400/90 leading-relaxed">{step.callout}</p>
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {currentStep > 0 && (
                    <button
                      onClick={handlePrev}
                      className="flex items-center gap-1 text-sm text-white/50 hover:text-white/80 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    className="text-sm text-white/50 hover:text-white/80 transition-colors"
                  >
                    Skip
                  </button>
                </div>
                <button
                  onClick={handleNext}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
                >
                  {currentStep === steps.length - 1 ? "Got it" : "Next"}
                  {currentStep < steps.length - 1 && <ChevronRight className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DeviceSetupTutorialOverlay;
