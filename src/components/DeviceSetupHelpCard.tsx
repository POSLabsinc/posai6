import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, ChevronLeft, QrCode, KeyRound, Link2, ShieldCheck, Mail, Phone, MessageSquare, Send, Lock } from "lucide-react";

interface WalkthroughStep {
  id: string;
  title: string;
  subtitle: string;
  instructions: string[];
  helperNote?: string;
  tourTarget: string;
  cardPosition: "right" | "left" | "bottom" | "top";
  icon: React.ReactNode;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onStepChange?: (step: number) => void;
}

const STEPS: Omit<WalkthroughStep, 'icon'>[] = [
  {
    id: "qr-highlight",
    title: "Step 1: Scan QR Code",
    subtitle: "Use your phone to scan",
    instructions: [
      "Open the camera app on your phone or tablet",
      "Point it at the QR code displayed on this screen",
      "A link will appear on your device, tap it to proceed",
      "Follow the on-screen instructions to complete activation",
    ],
    helperNote: "Most modern phones support QR scanning natively through the camera app.",
    tourTarget: "qr-code",
    cardPosition: "right",
  },
  {
    id: "code-highlight",
    title: "Step 2: Activation Code",
    subtitle: "Your unique pairing code",
    instructions: [
      "This is your unique activation code for this device",
      "You will need this code during the activation process",
      "Enter it when prompted on your mobile device or browser",
      "The code refreshes periodically for security",
    ],
    tourTarget: "activation-code",
    cardPosition: "left",
  },
  {
    id: "link-highlight",
    title: "Step 3: Activation Link",
    subtitle: "Open this URL in a browser",
    instructions: [
      "If QR scanning is not available, use this link instead",
      "Open any browser on your phone or computer",
      "Type the URL shown here into the address bar",
      "You will be prompted to enter the activation code",
    ],
    tourTarget: "activation-link",
    cardPosition: "left",
  },
  {
    id: "code-reconfirm",
    title: "Step 4: Enter the Code",
    subtitle: "Complete the activation",
    instructions: [
      "After opening the link, you will see a code entry screen",
      "Enter the activation code shown on this device",
      "Make sure to enter the code exactly as displayed",
      "Once verified, your device will be activated automatically",
    ],
    helperNote: "If the code expires, a new one will be generated automatically.",
    tourTarget: "activation-code",
    cardPosition: "left",
  },
  {
    id: "email-phone-button",
    title: "Step 5: Alternative Activation",
    subtitle: "Use email or phone instead",
    instructions: [
      "Tap this button to switch to email or phone activation",
      "You can verify your identity using a code sent to your email",
      "Or receive a verification code via SMS to your phone",
    ],
    tourTarget: "email-phone-button",
    cardPosition: "top",
  },
  {
    id: "email-input",
    title: "Step 6: Enter Your Email",
    subtitle: "Example: john.doe@example.com",
    instructions: [
      "Enter your registered email address in this field",
      "For example: john.doe@example.com",
      "Make sure the email matches your account on file",
      "A 6-digit verification code will be sent to this address",
    ],
    helperNote: "You can also enter a phone number like +1 (555) 234-5678 in this same field.",
    tourTarget: "email-input-field",
    cardPosition: "left",
  },
  {
    id: "send-code",
    title: "Step 7: Send Verification Code",
    subtitle: "Tap to receive your code",
    instructions: [
      "After entering your email or phone number, tap this button",
      "A 6-digit verification code will be sent instantly",
      "Check your email inbox or phone messages for the code",
      "If you do not receive it, wait a few seconds and resend",
    ],
    tourTarget: "send-code-button",
    cardPosition: "left",
  },
  {
    id: "otp-entry",
    title: "Step 8: Enter Verification Code",
    subtitle: "Complete activation",
    instructions: [
      "Enter the 6-digit code received on your email or phone",
      "Each digit goes in a separate box as shown",
      "The code auto-verifies once all 6 digits are entered",
      "Your device will activate automatically after verification",
    ],
    helperNote: "If the code expires, use 'Change contact' to go back and resend.",
    tourTarget: "otp-code-area",
    cardPosition: "left",
  },
];

const STEP_ICONS = [
  <QrCode className="w-5 h-5" />,
  <KeyRound className="w-5 h-5" />,
  <Link2 className="w-5 h-5" />,
  <ShieldCheck className="w-5 h-5" />,
  <Mail className="w-5 h-5" />,
  <Mail className="w-5 h-5" />,
  <Send className="w-5 h-5" />,
  <Lock className="w-5 h-5" />,
];

const DeviceSetupHelpCard = ({ open, onClose, onStepChange }: Props) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);

  const step = STEPS[currentStep];

  // Notify parent of step changes
  useEffect(() => {
    if (open) {
      onStepChange?.(currentStep);
    }
  }, [currentStep, open, onStepChange]);

  // Find and measure the target element with retries
  useEffect(() => {
    if (!open || !step) return;
    setHighlightRect(null);

    let attempts = 0;
    let timerId: ReturnType<typeof setTimeout>;
    const tryMeasure = () => {
      const el = document.querySelector(`[data-tour="${step.tourTarget}"]`);
      if (el) {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          setHighlightRect(rect);
          return;
        }
      }
      attempts++;
      if (attempts < 50) {
        timerId = setTimeout(tryMeasure, 100);
      }
    };
    const timer = setTimeout(tryMeasure, 200);
    return () => { clearTimeout(timer); clearTimeout(timerId); };
  }, [currentStep, open, step]);

  // Keep measuring on resize/scroll
  useEffect(() => {
    if (!open || !step) return;
    const onResize = () => {
      const el = document.querySelector(`[data-tour="${step.tourTarget}"]`);
      if (el) {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) setHighlightRect(rect);
      }
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
    };
  }, [open, step]);

  useEffect(() => {
    if (open) {
      setCurrentStep(0);
      setHighlightRect(null);
    }
  }, [open]);

  const handleClose = () => {
    setCurrentStep(0);
    onClose();
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (!step || !open) return null;

  const padding = 12;
  const spotlightStyle: React.CSSProperties = highlightRect ? {
    top: highlightRect.top - padding,
    left: highlightRect.left - padding,
    width: highlightRect.width + padding * 2,
    height: highlightRect.height + padding * 2,
  } : { top: "40%", left: "40%", width: "20%", height: "20%" };

  const getCardStyle = (): React.CSSProperties => {
    if (!highlightRect) return { position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
    const cardW = 380;
    const cardEstH = 420;
    const gap = 32;
    const centerY = highlightRect.top + highlightRect.height / 2 - cardEstH / 2;
    const clampedY = Math.max(20, Math.min(centerY, window.innerHeight - cardEstH - 60));

    if (step.cardPosition === "right") {
      return { position: "fixed", top: clampedY, left: highlightRect.right + gap, width: cardW, maxWidth: `calc(100vw - ${highlightRect.right + gap + 20}px)` };
    }
    if (step.cardPosition === "left") {
      return { position: "fixed", top: clampedY, right: `calc(100vw - ${highlightRect.left - gap}px)`, width: cardW, maxWidth: `${highlightRect.left - gap - 20}px` };
    }
    if (step.cardPosition === "top") {
      return { position: "fixed", bottom: `calc(100vh - ${highlightRect.top - gap}px)`, left: Math.max(20, highlightRect.left + highlightRect.width / 2 - cardW / 2), width: cardW };
    }
    return { position: "fixed", top: highlightRect.bottom + gap, left: Math.max(20, highlightRect.left + highlightRect.width / 2 - cardW / 2), width: cardW };
  };

  const getArrowInfo = (): { pos: React.CSSProperties; dir: string } => {
    if (!highlightRect) return { pos: { position: "fixed", top: 0, left: 0 }, dir: "right" };
    const gap = 4;
    if (step.cardPosition === "right") return { pos: { position: "fixed", top: highlightRect.top + highlightRect.height / 2 - 16, left: highlightRect.right + gap }, dir: "right" };
    if (step.cardPosition === "left") return { pos: { position: "fixed", top: highlightRect.top + highlightRect.height / 2 - 16, left: highlightRect.left - gap - 32 }, dir: "left" };
    if (step.cardPosition === "top") return { pos: { position: "fixed", top: highlightRect.top - gap - 32, left: highlightRect.left + highlightRect.width / 2 - 16 }, dir: "up" };
    return { pos: { position: "fixed", top: highlightRect.bottom + gap, left: highlightRect.left + highlightRect.width / 2 - 16 }, dir: "down" };
  };

  const arrowPaths: Record<string, string> = {
    right: "M6 16L26 16M26 16L18 8M26 16L18 24",
    left: "M26 16L6 16M6 16L14 8M6 16L14 24",
    down: "M16 6L16 26M16 26L8 18M16 26L24 18",
    up: "M16 26L16 6M16 6L8 14M16 6L24 14",
  };

  const arrowData = getArrowInfo();
  const motionDir = arrowData.dir === "left" ? { x: [0, -6, 0] } :
    arrowData.dir === "right" ? { x: [0, 6, 0] } :
    arrowData.dir === "up" ? { y: [0, -6, 0] } : { y: [0, 6, 0] };

  const stepIcon = STEP_ICONS[currentStep];

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
          {/* Spotlight cutout */}
          <motion.div
            key={`spotlight-${currentStep}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="fixed"
            style={{
              ...spotlightStyle,
              boxShadow: "0 0 0 9999px rgba(0,0,0,0.82)",
              border: "3px solid #F59E0B",
              borderRadius: "16px",
              pointerEvents: "none",
            }}
          />

          {/* Animated arrow */}
          {highlightRect && (
            <motion.div
              key={`arrow-${currentStep}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.25 }}
              style={{ ...arrowData.pos, zIndex: 20 }}
            >
              <motion.div
                animate={motionDir}
                transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
              >
                <svg width={32} height={32} viewBox="0 0 32 32" fill="none">
                  <path d={arrowPaths[arrowData.dir] || arrowPaths.right} stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </motion.div>
            </motion.div>
          )}

          {/* Instruction Card */}
          {highlightRect && (
            <motion.div
              key={`card-${currentStep}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.3 }}
              className="z-30"
              style={getCardStyle()}
            >
              <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                <div className="px-5 pt-5 pb-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                    {stepIcon}
                  </div>
                  <div>
                    <h3 className="text-[15px] font-bold text-gray-900">{step.title}</h3>
                    <p className="text-xs text-gray-500">{step.subtitle}</p>
                  </div>
                </div>

                <div className="px-5 pb-4 flex flex-col gap-2.5">
                  {step.instructions.map((instruction, i) => (
                    <div key={i} className="flex gap-3 items-start">
                      <div className="w-6 h-6 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                        {i + 1}
                      </div>
                      <p className="text-[13px] text-gray-700 leading-relaxed pt-0.5">{instruction}</p>
                    </div>
                  ))}
                </div>

                {step.helperNote && (
                  <div className="mx-5 mb-4 p-3 rounded-xl bg-amber-50 border border-amber-100">
                    <p className="text-xs text-amber-700 leading-relaxed">{step.helperNote}</p>
                  </div>
                )}

                <div className="px-5 pb-5 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {STEPS.map((_, i) => (
                      <div
                        key={i}
                        className={`rounded-full transition-all duration-300 ${
                          i === currentStep ? "w-5 h-2 bg-amber-500" : i < currentStep ? "w-2 h-2 bg-amber-500/40" : "w-2 h-2 bg-gray-200"
                        }`}
                      />
                    ))}
                  </div>
                  <button
                    onClick={handleNext}
                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition-colors"
                  >
                    {currentStep === STEPS.length - 1 ? "Got it" : "Next"}
                    {currentStep < STEPS.length - 1 && <ChevronRight className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Bottom controls */}
          <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3">
            {currentStep > 0 && (
              <button
                onClick={handlePrev}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/10 text-white/70 text-sm hover:bg-white/20 transition-colors backdrop-blur-sm"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
            )}
            <button
              onClick={handleClose}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/10 text-white/70 text-sm hover:bg-white/20 transition-colors backdrop-blur-sm"
            >
              <X className="w-3.5 h-3.5" />
              Skip
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DeviceSetupHelpCard;
