import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { QrCode, Link2, ShieldCheck, Sparkles, X } from "lucide-react";

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

// Each step is a standalone popup tied to a specific option/button on the screen.
const newUserSteps: TutorialStep[] = [
  {
    title: "Option 1: Scan QR code",
    subtitle: "Use your phone to scan",
    icon: <QrCode className="w-5 h-5 text-primary" />,
    iconBg: "bg-primary/15",
    instructions: [
      "Open the camera app on your phone or tablet and point it at the QR code displayed on this screen.",
    ],
    highlightArea: { top: "26%", left: "10%", width: "32%", height: "52%" },
    arrowDirection: "right",
  },
  {
    title: "Option 2: Use a browser",
    subtitle: "Open this URL in a browser",
    icon: <Link2 className="w-5 h-5 text-primary" />,
    iconBg: "bg-primary/15",
    instructions: [
      "Open a browser on your phone or computer and enter the URL shown on this screen (https://www.posai.com/pair) into the address bar.",
      "You can also tap the copy icon to quickly copy the link.",
    ],
    highlightArea: { top: "26%", left: "38%", width: "26%", height: "52%" },
    arrowDirection: "left",
  },
  {
    title: "Option 3: Activate with Code",
    subtitle: "Use email or phone number",
    icon: <ShieldCheck className="w-5 h-5 text-primary" />,
    iconBg: "bg-primary/15",
    instructions: [
      "Enter your registered email address or phone number.",
      "Tap 'Send Code' to receive a 6-digit verification code.",
    ],
    highlightArea: { top: "26%", left: "65%", width: "28%", height: "52%" },
    arrowDirection: "left",
  },
  {
    title: "Activate with AI",
    subtitle: "Let AI guide your activation",
    icon: <Sparkles className="w-5 h-5 text-primary" />,
    iconBg: "bg-primary/15",
    instructions: [
      "Tap 'Activate with AI' to start a guided conversation.",
      "The AI assistant will walk you through activating this device step by step, no QR code or manual input needed.",
    ],
    highlightArea: { top: "84%", left: "42%", width: "16%", height: "7%" },
    arrowDirection: "down",
  },
];

const existingUserSteps: TutorialStep[] = newUserSteps;

interface Props {
  open: boolean;
  onClose: () => void;
  variant: "new" | "existing";
  initialStep?: number;
}

const DeviceSetupTutorialOverlay = ({ open, onClose, variant, initialStep = 0 }: Props) => {
  const steps = variant === "new" ? newUserSteps : existingUserSteps;
  const [currentStep, setCurrentStep] = useState(initialStep);

  useEffect(() => {
    if (open) setCurrentStep(Math.min(initialStep, steps.length - 1));
  }, [open, initialStep, steps.length]);

  const step = steps[currentStep];
  const h = step.highlightArea;

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

  const getCardPosition = (): React.CSSProperties => {
    const dir = step.arrowDirection;
    if (dir === "right") {
      return { top: "50%", left: `calc(${h.left} + ${h.width} + 60px)`, transform: "translateY(-50%)" };
    }
    if (dir === "left") {
      return { top: "50%", right: `calc(100% - ${h.left} + 60px)`, transform: "translateY(-50%)" };
    }
    if (dir === "down") {
      return { bottom: `calc(100% - ${h.top} + 50px)`, left: `calc(${h.left} + ${h.width} / 2)`, transform: "translateX(-50%)" };
    }
    return { top: `calc(${h.top} + ${h.height} + 50px)`, left: `calc(${h.left} + ${h.width} / 2)`, transform: "translateX(-50%)" };
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
          onClick={onClose}
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
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative rounded-2xl bg-[#1E1E22] border border-white/10 shadow-2xl p-5">
              {/* Close (X) at top-right */}
              <button
                onClick={onClose}
                aria-label="Close"
                className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Header */}
              <div className="flex items-center gap-3 mb-4 pr-8">
                <div className={`w-10 h-10 rounded-xl ${step.iconBg} flex items-center justify-center`}>
                  {step.icon}
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-white">{step.title}</h3>
                  <p className="text-xs text-white/50">{step.subtitle}</p>
                </div>
              </div>

              {/* Instructions */}
              <div className="space-y-3">
                {step.instructions.map((instruction, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                    <p className="text-sm text-white/80 leading-relaxed">{instruction}</p>
                  </div>
                ))}
              </div>

              {/* Callout */}
              {step.callout && (
                <div className="mt-4 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3.5 py-2.5">
                  <p className="text-xs text-amber-400/90 leading-relaxed">{step.callout}</p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DeviceSetupTutorialOverlay;
