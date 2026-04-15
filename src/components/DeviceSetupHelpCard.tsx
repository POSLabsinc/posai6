import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, ChevronLeft, QrCode, Smartphone, Mail, CheckCircle2 } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  onSwitchToEmailPhone?: () => void;
  onSwitchToBrowser?: () => void;
  onSwitchToOtp?: () => void;
}

interface WalkthroughStep {
  id: string;
  title: string;
  subtitle: string;
  instructions: { text: string; detail?: string }[];
  helperNote?: string;
  tourTarget: string;
  icon: React.ReactNode;
}

const DeviceSetupHelpCard = ({ open, onClose }: Props) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  const steps: WalkthroughStep[] = [
    {
      id: "qr-scan",
      title: "Scan QR Code",
      subtitle: "Use your mobile device to get started",
      instructions: [
        { text: "Open the camera app on your phone or tablet", detail: "Most modern devices support QR scanning natively." },
        { text: "Point the camera at the QR code on this screen", detail: "A notification or link will appear on your device." },
        { text: "Tap the link to open the activation page", detail: "You'll be directed to enter your details on your mobile." },
      ],
      helperNote: "The QR code links directly to the activation page where you can enter your email or phone number from your mobile device.",
      tourTarget: "qr-code",
      icon: <QrCode className="w-5 h-5" />,
    },
    {
      id: "enter-contact",
      title: "Enter Your Details",
      subtitle: "Email or phone on your mobile device",
      instructions: [
        { text: "On your mobile device, enter your email address or phone number", detail: "Use the email or phone number associated with your account." },
        { text: "Tap 'Send Code' to receive a verification code", detail: "A 6-digit code will be sent to you via email or SMS." },
        { text: "Enter the verification code when prompted", detail: "The code verifies your identity and links this device." },
      ],
      helperNote: "If you don't receive the code, check your spam folder or request a new one after 30 seconds.",
      tourTarget: "qr-code",
      icon: <Smartphone className="w-5 h-5" />,
    },
    {
      id: "complete-activation",
      title: "Complete Activation",
      subtitle: "Follow on-screen instructions",
      instructions: [
        { text: "Follow the remaining steps shown on your mobile device", detail: "The activation process will guide you through the final setup." },
        { text: "Once verified, this device will activate automatically", detail: "You'll see a confirmation on both your mobile and this screen." },
        { text: "You're all set! Sign in and start using the Point of Sale", detail: "Your device is now paired and ready for use." },
      ],
      tourTarget: "qr-code",
      icon: <CheckCircle2 className="w-5 h-5" />,
    },
  ];

  const step = steps[currentStep];

  // Responsive check
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Measure target element
  const measureTarget = useCallback(() => {
    if (!step || !open) return;
    const el = document.querySelector(`[data-tour="${step.tourTarget}"]`);
    if (el) {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setHighlightRect(rect);
      }
    }
  }, [step, open]);

  useEffect(() => {
    if (!open) return;
    let attempts = 0;
    const tryMeasure = () => {
      const el = document.querySelector(`[data-tour="${steps[currentStep]?.tourTarget}"]`);
      if (el) {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          setHighlightRect(rect);
          return;
        }
      }
      attempts++;
      if (attempts < 15) setTimeout(tryMeasure, 100);
    };
    const timer = setTimeout(tryMeasure, 150);
    return () => clearTimeout(timer);
  }, [currentStep, open]);

  useEffect(() => {
    if (!open) return;
    const onResize = () => measureTarget();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
    };
  }, [open, measureTarget]);

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
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  if (!step || !open) return null;

  const padding = 14;
  const spotlightStyle: React.CSSProperties = highlightRect
    ? {
        top: highlightRect.top - padding,
        left: highlightRect.left - padding,
        width: highlightRect.width + padding * 2,
        height: highlightRect.height + padding * 2,
      }
    : { top: "30%", left: "30%", width: "40%", height: "40%" };

  // Card positioning: right of QR on desktop, below on mobile
  const getCardStyle = (): React.CSSProperties => {
    if (!highlightRect) return { position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)" };

    const cardW = isMobile ? Math.min(340, window.innerWidth - 32) : 400;
    const gap = isMobile ? 20 : 36;

    if (isMobile) {
      // Stack below QR on mobile
      const topPos = highlightRect.bottom + gap;
      return {
        position: "fixed",
        top: Math.min(topPos, window.innerHeight - 320),
        left: "50%",
        transform: "translateX(-50%)",
        width: cardW,
      };
    }

    // Right of QR on desktop/tablet
    const centerY = highlightRect.top + highlightRect.height / 2 - 220;
    const clampedY = Math.max(20, Math.min(centerY, window.innerHeight - 480));
    const leftPos = highlightRect.right + gap;
    
    // If not enough room on right, go left
    if (leftPos + cardW + 20 > window.innerWidth) {
      return {
        position: "fixed",
        top: clampedY,
        right: `calc(100vw - ${highlightRect.left - gap}px)`,
        width: cardW,
        maxWidth: `${highlightRect.left - gap - 20}px`,
      };
    }

    return {
      position: "fixed",
      top: clampedY,
      left: leftPos,
      width: cardW,
      maxWidth: `calc(100vw - ${leftPos + 20}px)`,
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
          {/* Spotlight cutout on QR code */}
          <motion.div
            key={`spotlight-${currentStep}`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35 }}
            className="fixed"
            style={{
              ...spotlightStyle,
              boxShadow: "0 0 0 9999px rgba(0,0,0,0.82)",
              border: "3px solid #F59E0B",
              borderRadius: "16px",
              pointerEvents: "none",
            }}
          />

          {/* Instruction Card */}
          {highlightRect && (
            <motion.div
              key={`card-${currentStep}`}
              initial={{ opacity: 0, y: isMobile ? 20 : 0, x: isMobile ? 0 : 20 }}
              animate={{ opacity: 1, y: 0, x: 0 }}
              transition={{ delay: 0.1, duration: 0.3 }}
              className="z-30"
              style={getCardStyle()}
            >
              <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="px-5 pt-5 pb-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                      {step.icon}
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-amber-500 uppercase tracking-wider">
                        Step {currentStep + 1} of {steps.length}
                      </p>
                      <h3 className="text-[15px] font-bold text-gray-900 leading-tight">{step.title}</h3>
                      <p className="text-xs text-gray-500">{step.subtitle}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleClose}
                    className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Steps */}
                <div className="px-5 pb-4 flex flex-col gap-3">
                  {step.instructions.map((instr, i) => (
                    <div key={i} className="flex gap-3 items-start">
                      <div className="w-6 h-6 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-gray-800 leading-snug">{instr.text}</p>
                        {instr.detail && (
                          <p className="text-[11px] text-gray-500 leading-relaxed mt-0.5">{instr.detail}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Helper note */}
                {step.helperNote && (
                  <div className="mx-5 mb-4 p-3 rounded-xl bg-amber-50 border border-amber-100">
                    <p className="text-xs text-amber-700 leading-relaxed">{step.helperNote}</p>
                  </div>
                )}

                {/* Footer */}
                <div className="px-5 pb-5 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {steps.map((_, i) => (
                      <div
                        key={i}
                        className={`rounded-full transition-all duration-300 ${
                          i === currentStep
                            ? "w-5 h-2 bg-amber-500"
                            : i < currentStep
                            ? "w-2 h-2 bg-amber-500/40"
                            : "w-2 h-2 bg-gray-200"
                        }`}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    {currentStep > 0 && (
                      <button
                        onClick={handlePrev}
                        className="flex items-center gap-1 px-3 py-2 rounded-xl text-gray-500 text-sm font-medium hover:bg-gray-100 transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Back
                      </button>
                    )}
                    <button
                      onClick={handleNext}
                      className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition-colors"
                    >
                      {currentStep === steps.length - 1 ? "Got it" : "Next"}
                      {currentStep < steps.length - 1 && <ChevronRight className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Bottom skip */}
          <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-30">
            <button
              onClick={handleClose}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/10 text-white/70 text-sm hover:bg-white/20 transition-colors backdrop-blur-sm"
            >
              <X className="w-3.5 h-3.5" />
              Close Guide
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DeviceSetupHelpCard;
