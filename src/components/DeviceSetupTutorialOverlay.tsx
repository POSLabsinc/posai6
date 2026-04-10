import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, ChevronLeft, QrCode, Globe, KeyRound, MessageSquare, Smartphone } from "lucide-react";

interface TutorialStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  highlightArea: { top: string; left: string; width: string; height: string };
  arrowDirection: "left" | "right" | "down" | "up";
}

const newUserSteps: TutorialStep[] = [
  {
    title: "Scan the QR Code",
    description: "Point your phone camera at this QR code. A link will appear on your device to begin the activation process. Simply tap it and follow the on-screen instructions.",
    icon: <QrCode className="w-6 h-6" />,
    highlightArea: { top: "26%", left: "10%", width: "32%", height: "52%" },
    arrowDirection: "right",
  },
  {
    title: "Follow Mobile Instructions",
    description: "After scanning, a link will appear on your phone. Tap it and follow the guided steps to complete your device activation.",
    icon: <Smartphone className="w-6 h-6" />,
    highlightArea: { top: "71%", left: "10%", width: "32%", height: "8%" },
    arrowDirection: "right",
  },
  {
    title: "Or Use a Browser",
    description: "If you prefer, open any browser on your computer or phone. Visit the URL shown here and enter the pairing code displayed on screen.",
    icon: <Globe className="w-6 h-6" />,
    highlightArea: { top: "26%", left: "50%", width: "38%", height: "42%" },
    arrowDirection: "left",
  },
  {
    title: "Try Another Way",
    description: "Prefer email or phone verification? Tap this button to switch to an OTP-based activation method instead.",
    icon: <KeyRound className="w-6 h-6" />,
    highlightArea: { top: "80%", left: "35%", width: "30%", height: "6%" },
    arrowDirection: "down",
  },
  {
    title: "Still Need Help?",
    description: "If you are still having trouble, contact your manager or system administrator. They can provide an activation code from the Admin Portal.",
    icon: <MessageSquare className="w-6 h-6" />,
    highlightArea: { top: "87%", left: "38%", width: "24%", height: "4%" },
    arrowDirection: "down",
  },
];

const existingUserSteps: TutorialStep[] = [
  {
    title: "Scan to Sign In",
    description: "Point your phone camera at the QR code for quick, secure sign-in. A verification link will appear on your mobile device.",
    icon: <QrCode className="w-6 h-6" />,
    highlightArea: { top: "26%", left: "10%", width: "32%", height: "52%" },
    arrowDirection: "right",
  },
  {
    title: "Or Use a Browser",
    description: "Open any browser and visit the URL shown. Enter the pairing code to sign in to your device.",
    icon: <Globe className="w-6 h-6" />,
    highlightArea: { top: "26%", left: "50%", width: "38%", height: "42%" },
    arrowDirection: "left",
  },
  {
    title: "Other Sign-In Options",
    description: "Tap here for additional sign-in methods including activation code entry or demo mode access.",
    icon: <KeyRound className="w-6 h-6" />,
    highlightArea: { top: "80%", left: "35%", width: "30%", height: "6%" },
    arrowDirection: "down",
  },
  {
    title: "Get Support",
    description: "Need help signing in? Tap here to reach your administrator for assistance with your account.",
    icon: <MessageSquare className="w-6 h-6" />,
    highlightArea: { top: "87%", left: "38%", width: "24%", height: "4%" },
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

  // Position text + button near the highlight
  const getTextPosition = (): React.CSSProperties => {
    const dir = step.arrowDirection;
    if (dir === "right") {
      return {
        top: h.top,
        left: `calc(${h.left} + ${h.width} + 40px)`,
        maxWidth: "380px",
      };
    }
    if (dir === "left") {
      return {
        top: h.top,
        right: `calc(100% - ${h.left} + 40px)`,
        maxWidth: "380px",
      };
    }
    if (dir === "down") {
      return {
        bottom: `calc(100% - ${h.top} + 24px)`,
        left: `calc(${h.left} + ${h.width} / 2)`,
        transform: "translateX(-50%)",
        maxWidth: "400px",
      };
    }
    // up
    return {
      top: `calc(${h.top} + ${h.height} + 24px)`,
      left: `calc(${h.left} + ${h.width} / 2)`,
      transform: "translateX(-50%)",
      maxWidth: "400px",
    };
  };

  // Arrow positioning
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
          {/* Highlight cutout with sharp border, no blur */}
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
              boxShadow: `0 0 0 9999px rgba(0,0,0,0.8)`,
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

          {/* Text + Next button, no card background */}
          <motion.div
            key={`text-${currentStep}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.3 }}
            className="absolute z-20"
            style={getTextPosition()}
          >
            <div className="flex items-center gap-2.5 mb-3 text-primary">
              {step.icon}
              <h3 className="text-lg font-bold text-foreground">{step.title}</h3>
            </div>
            <p className="text-sm text-foreground/60 leading-relaxed mb-5">
              {step.description}
            </p>
            <div className="flex items-center gap-4">
              <button
                onClick={handleNext}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
              >
                {currentStep === steps.length - 1 ? "Done" : "Next"}
                {currentStep < steps.length - 1 && <ChevronRight className="w-4 h-4" />}
              </button>
              <span className="text-xs text-foreground/30">{currentStep + 1} / {steps.length}</span>
            </div>
          </motion.div>

          {/* Minimal bottom controls */}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3">
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full flex items-center justify-center text-foreground/40 hover:text-foreground/70 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            {currentStep > 0 && (
              <button
                onClick={handlePrev}
                className="w-9 h-9 rounded-full flex items-center justify-center text-foreground/40 hover:text-foreground/70 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
            <div className="flex items-center gap-1.5">
              {steps.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentStep(i)}
                  className={`rounded-full transition-all duration-300 ${
                    i === currentStep
                      ? "w-5 h-2 bg-primary"
                      : i < currentStep
                      ? "w-2 h-2 bg-primary/40"
                      : "w-2 h-2 bg-foreground/15"
                  }`}
                />
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DeviceSetupTutorialOverlay;
