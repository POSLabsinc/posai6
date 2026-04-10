import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, ChevronLeft, QrCode, Globe, KeyRound, MessageSquare } from "lucide-react";

interface TutorialStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  highlightArea: { top: string; left: string; width: string; height: string };
  arrowFrom: { x: string; y: string };
  arrowTo: { x: string; y: string };
  arrowDirection: "left" | "right" | "down" | "up";
}

const newUserSteps: TutorialStep[] = [
  {
    title: "Scan the QR Code",
    description: "Use your phone or tablet camera to scan the QR code displayed on the left side of the screen.",
    icon: <QrCode className="w-6 h-6" />,
    highlightArea: { top: "22%", left: "8%", width: "38%", height: "52%" },
    arrowFrom: { x: "52%", y: "48%" },
    arrowTo: { x: "46%", y: "48%" },
    arrowDirection: "left",
  },
  {
    title: "Follow the Link",
    description: "After scanning, tap the link that appears on your mobile device. You will be guided through the activation steps.",
    icon: <Globe className="w-6 h-6" />,
    highlightArea: { top: "55%", left: "8%", width: "38%", height: "12%" },
    arrowFrom: { x: "52%", y: "62%" },
    arrowTo: { x: "46%", y: "62%" },
    arrowDirection: "left",
  },
  {
    title: "Or Use a Browser",
    description: "Alternatively, visit the displayed URL on any browser and enter the pairing code shown on the right side.",
    icon: <Globe className="w-6 h-6" />,
    highlightArea: { top: "22%", left: "54%", width: "38%", height: "52%" },
    arrowFrom: { x: "48%", y: "48%" },
    arrowTo: { x: "54%", y: "48%" },
    arrowDirection: "right",
  },
  {
    title: "Try Another Way",
    description: "If QR or browser pairing is not available, tap 'Try another way' at the bottom to activate using an email or phone code.",
    icon: <KeyRound className="w-6 h-6" />,
    highlightArea: { top: "78%", left: "30%", width: "40%", height: "8%" },
    arrowFrom: { x: "50%", y: "73%" },
    arrowTo: { x: "50%", y: "78%" },
    arrowDirection: "down",
  },
  {
    title: "Need More Help?",
    description: "If you are still stuck, contact your manager or admin. They can generate an activation code from the Admin Portal.",
    icon: <MessageSquare className="w-6 h-6" />,
    highlightArea: { top: "86%", left: "35%", width: "30%", height: "6%" },
    arrowFrom: { x: "50%", y: "82%" },
    arrowTo: { x: "50%", y: "86%" },
    arrowDirection: "down",
  },
];

const existingUserSteps: TutorialStep[] = [
  {
    title: "Scan the QR Code",
    description: "Point your phone or tablet camera at the QR code to sign in quickly.",
    icon: <QrCode className="w-6 h-6" />,
    highlightArea: { top: "18%", left: "25%", width: "50%", height: "40%" },
    arrowFrom: { x: "50%", y: "62%" },
    arrowTo: { x: "50%", y: "58%" },
    arrowDirection: "up",
  },
  {
    title: "Try Another Way",
    description: "Tap 'Try another way' to see additional sign-in options like activation code or demo mode.",
    icon: <KeyRound className="w-6 h-6" />,
    highlightArea: { top: "72%", left: "25%", width: "50%", height: "8%" },
    arrowFrom: { x: "50%", y: "68%" },
    arrowTo: { x: "50%", y: "72%" },
    arrowDirection: "down",
  },
  {
    title: "Contact Support",
    description: "If you cannot sign in, tap 'Need Help?' to get assistance from your administrator.",
    icon: <MessageSquare className="w-6 h-6" />,
    highlightArea: { top: "82%", left: "25%", width: "50%", height: "6%" },
    arrowFrom: { x: "50%", y: "78%" },
    arrowTo: { x: "50%", y: "82%" },
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
          {/* Dimmed background with cutout highlight */}
          <div className="absolute inset-0">
            {/* Full dim overlay */}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px]" />
            
            {/* Highlighted cutout area */}
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="absolute rounded-2xl border-2 border-primary/60 shadow-[0_0_0_4px_rgba(var(--primary-rgb,59,130,246),0.15),0_0_30px_rgba(var(--primary-rgb,59,130,246),0.2)]"
              style={{
                top: step.highlightArea.top,
                left: step.highlightArea.left,
                width: step.highlightArea.width,
                height: step.highlightArea.height,
                boxShadow: `0 0 0 9999px rgba(0,0,0,0.7), 0 0 30px rgba(59,130,246,0.3)`,
              }}
            />
          </div>

          {/* Arrow indicator */}
          <motion.div
            key={`arrow-${currentStep}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.3 }}
            className="absolute z-10"
            style={{ left: step.arrowFrom.x, top: step.arrowFrom.y }}
          >
            <motion.div
              animate={
                step.arrowDirection === "left"
                  ? { x: [0, -8, 0] }
                  : step.arrowDirection === "right"
                  ? { x: [0, 8, 0] }
                  : step.arrowDirection === "down"
                  ? { y: [0, 8, 0] }
                  : { y: [0, -8, 0] }
              }
              transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
            >
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                {step.arrowDirection === "left" && (
                  <path d="M30 20H10M10 20L18 12M10 20L18 28" stroke="hsl(var(--primary))" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                )}
                {step.arrowDirection === "right" && (
                  <path d="M10 20H30M30 20L22 12M30 20L22 28" stroke="hsl(var(--primary))" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                )}
                {step.arrowDirection === "down" && (
                  <path d="M20 10V30M20 30L12 22M20 30L28 22" stroke="hsl(var(--primary))" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                )}
                {step.arrowDirection === "up" && (
                  <path d="M20 30V10M20 10L12 18M20 10L28 18" stroke="hsl(var(--primary))" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                )}
              </svg>
            </motion.div>
          </motion.div>

          {/* Instruction card - positioned at bottom center */}
          <motion.div
            key={`card-${currentStep}`}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.35 }}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-lg px-4"
          >
            <div className="bg-card/95 backdrop-blur-xl border border-foreground/10 rounded-2xl p-6 shadow-2xl">
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-foreground/40 hover:text-foreground/70 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Step indicator dots */}
              <div className="flex items-center justify-center gap-1.5 mb-4">
                {steps.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentStep(i)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === currentStep
                        ? "w-6 bg-primary"
                        : i < currentStep
                        ? "w-1.5 bg-primary/40"
                        : "w-1.5 bg-foreground/15"
                    }`}
                  />
                ))}
              </div>

              {/* Icon + content */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 text-primary">
                  {step.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-foreground mb-1">
                    {step.title}
                  </h3>
                  <p className="text-sm text-foreground/60 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between mt-5 pt-4 border-t border-foreground/[0.06]">
                <button
                  onClick={handlePrev}
                  disabled={currentStep === 0}
                  className="flex items-center gap-1.5 text-sm text-foreground/40 hover:text-foreground/70 transition-colors disabled:opacity-0 disabled:pointer-events-none"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>

                <span className="text-xs text-foreground/30 font-medium">
                  {currentStep + 1} of {steps.length}
                </span>

                <button
                  onClick={handleNext}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  {currentStep === steps.length - 1 ? "Done" : "Next"}
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
