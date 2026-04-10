import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, ChevronLeft, QrCode, Globe, KeyRound, MessageSquare, Smartphone } from "lucide-react";

interface TutorialStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  highlightArea: { top: string; left: string; width: string; height: string };
  tooltipPosition: "top" | "bottom" | "left" | "right";
  tooltipOffset?: { x?: string; y?: string };
  arrowDirection: "left" | "right" | "down" | "up";
}

const newUserSteps: TutorialStep[] = [
  {
    title: "Scan the QR Code",
    description: "Point your phone camera at this QR code. A link will appear on your device to begin activation.",
    icon: <QrCode className="w-5 h-5" />,
    highlightArea: { top: "25%", left: "10%", width: "34%", height: "45%" },
    tooltipPosition: "right",
    arrowDirection: "right",
  },
  {
    title: "Follow Mobile Instructions",
    description: "After scanning, tap the link on your phone and follow the guided steps to complete activation.",
    icon: <Smartphone className="w-5 h-5" />,
    highlightArea: { top: "72%", left: "10%", width: "34%", height: "10%" },
    tooltipPosition: "top",
    arrowDirection: "down",
  },
  {
    title: "Or Use a Browser",
    description: "Visit the URL shown here on any device and enter the pairing code to connect.",
    icon: <Globe className="w-5 h-5" />,
    highlightArea: { top: "25%", left: "56%", width: "34%", height: "45%" },
    tooltipPosition: "left",
    arrowDirection: "left",
  },
  {
    title: "Try Another Way",
    description: "Prefer email or phone verification? Tap here to activate using an OTP code instead.",
    icon: <KeyRound className="w-5 h-5" />,
    highlightArea: { top: "85%", left: "32%", width: "36%", height: "6%" },
    tooltipPosition: "top",
    arrowDirection: "down",
  },
  {
    title: "Still Need Help?",
    description: "Contact your manager or admin for an activation code from the Admin Portal.",
    icon: <MessageSquare className="w-5 h-5" />,
    highlightArea: { top: "92%", left: "38%", width: "24%", height: "5%" },
    tooltipPosition: "top",
    arrowDirection: "down",
  },
];

const existingUserSteps: TutorialStep[] = [
  {
    title: "Scan to Sign In",
    description: "Point your phone camera at the QR code for quick, secure sign-in.",
    icon: <QrCode className="w-5 h-5" />,
    highlightArea: { top: "20%", left: "25%", width: "50%", height: "40%" },
    tooltipPosition: "bottom",
    arrowDirection: "up",
  },
  {
    title: "Other Sign-In Options",
    description: "Tap here for additional methods like activation code or demo mode.",
    icon: <KeyRound className="w-5 h-5" />,
    highlightArea: { top: "72%", left: "28%", width: "44%", height: "7%" },
    tooltipPosition: "top",
    arrowDirection: "down",
  },
  {
    title: "Get Support",
    description: "Need help signing in? Tap here to contact your administrator.",
    icon: <MessageSquare className="w-5 h-5" />,
    highlightArea: { top: "82%", left: "35%", width: "30%", height: "5%" },
    tooltipPosition: "top",
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

  // Calculate tooltip card position based on highlight and direction
  const getTooltipStyle = (): React.CSSProperties => {
    const h = step.highlightArea;
    switch (step.tooltipPosition) {
      case "right":
        return {
          top: h.top,
          left: `calc(${h.left} + ${h.width} + 24px)`,
          maxWidth: "320px",
        };
      case "left":
        return {
          top: h.top,
          right: `calc(100% - ${h.left} + 24px)`,
          maxWidth: "320px",
        };
      case "top":
        return {
          bottom: `calc(100% - ${h.top} + 16px)`,
          left: `calc(${h.left} + ${h.width} / 2)`,
          transform: "translateX(-50%)",
          maxWidth: "340px",
        };
      case "bottom":
        return {
          top: `calc(${h.top} + ${h.height} + 16px)`,
          left: `calc(${h.left} + ${h.width} / 2)`,
          transform: "translateX(-50%)",
          maxWidth: "340px",
        };
      default:
        return {};
    }
  };

  // Arrow SVG pointing from tooltip toward highlighted area
  const renderArrow = () => {
    const h = step.highlightArea;
    const dir = step.arrowDirection;

    const arrowSize = 28;
    let style: React.CSSProperties = { position: "absolute" as const, zIndex: 20 };

    if (dir === "right") {
      // Arrow on the right edge of highlight pointing left (toward highlight)
      style = {
        ...style,
        top: `calc(${h.top} + ${h.height} / 2 - ${arrowSize / 2}px)`,
        left: `calc(${h.left} + ${h.width} + 4px)`,
      };
    } else if (dir === "left") {
      style = {
        ...style,
        top: `calc(${h.top} + ${h.height} / 2 - ${arrowSize / 2}px)`,
        left: `calc(${h.left} - ${arrowSize + 4}px)`,
      };
    } else if (dir === "down") {
      style = {
        ...style,
        top: `calc(${h.top} - ${arrowSize + 4}px)`,
        left: `calc(${h.left} + ${h.width} / 2 - ${arrowSize / 2}px)`,
      };
    } else {
      style = {
        ...style,
        top: `calc(${h.top} + ${h.height} + 4px)`,
        left: `calc(${h.left} + ${h.width} / 2 - ${arrowSize / 2}px)`,
      };
    }

    const paths: Record<string, string> = {
      right: "M4 14L20 14M20 14L14 8M20 14L14 20",
      left: "M24 14L8 14M8 14L14 8M8 14L14 20",
      down: "M14 4L14 20M14 20L8 14M14 20L20 14",
      up: "M14 24L14 8M14 8L8 14M14 8L20 14",
    };

    return (
      <motion.div
        key={`arrow-${currentStep}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35, duration: 0.3 }}
        style={style}
      >
        <motion.div
          animate={
            dir === "left" ? { x: [0, -6, 0] }
            : dir === "right" ? { x: [0, 6, 0] }
            : dir === "down" ? { y: [0, 6, 0] }
            : { y: [0, -6, 0] }
          }
          transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
        >
          <svg width={arrowSize} height={arrowSize} viewBox="0 0 28 28" fill="none">
            <path d={paths[dir]} stroke="hsl(var(--primary))" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.div>
      </motion.div>
    );
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
          {/* Full dim overlay */}
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" />

          {/* Cutout highlight */}
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="absolute rounded-xl"
            style={{
              top: step.highlightArea.top,
              left: step.highlightArea.left,
              width: step.highlightArea.width,
              height: step.highlightArea.height,
              boxShadow: `0 0 0 9999px rgba(0,0,0,0.75)`,
              border: "2px solid hsl(var(--primary) / 0.5)",
            }}
          >
            {/* Pulse ring */}
            <motion.div
              className="absolute inset-0 rounded-xl border border-primary/30"
              animate={{ scale: [1, 1.03, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            />
          </motion.div>

          {/* Arrow */}
          {renderArrow()}

          {/* Tooltip card near the highlight */}
          <motion.div
            key={`tooltip-${currentStep}`}
            initial={{ opacity: 0, y: step.tooltipPosition === "top" ? 12 : step.tooltipPosition === "bottom" ? -12 : 0, x: step.tooltipPosition === "left" ? 12 : step.tooltipPosition === "right" ? -12 : 0 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            transition={{ delay: 0.15, duration: 0.3, ease: "easeOut" }}
            className="absolute z-20"
            style={getTooltipStyle()}
          >
            <div className="bg-card/95 backdrop-blur-xl border border-foreground/10 rounded-2xl p-5 shadow-2xl">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 text-primary">
                  {step.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-foreground mb-1">
                    {step.title}
                  </h3>
                  <p className="text-xs text-foreground/55 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Bottom navigation bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30"
          >
            <div className="flex items-center gap-3 bg-card/90 backdrop-blur-xl border border-foreground/10 rounded-full px-2 py-2 shadow-2xl">
              {/* Close */}
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full flex items-center justify-center text-foreground/40 hover:text-foreground/70 hover:bg-foreground/5 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Previous */}
              <button
                onClick={handlePrev}
                disabled={currentStep === 0}
                className="w-9 h-9 rounded-full flex items-center justify-center text-foreground/40 hover:text-foreground/70 hover:bg-foreground/5 transition-colors disabled:opacity-0 disabled:pointer-events-none"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Step dots */}
              <div className="flex items-center gap-1.5 px-2">
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

              {/* Next / Done */}
              <button
                onClick={handleNext}
                className="flex items-center gap-1 px-4 py-2 rounded-full bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
              >
                {currentStep === steps.length - 1 ? "Done" : "Next"}
                {currentStep < steps.length - 1 && <ChevronRight className="w-3.5 h-3.5" />}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DeviceSetupTutorialOverlay;
