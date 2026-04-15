import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronLeft, QrCode, KeyRound, Link2, ShieldCheck, Mail, Phone, MessageSquare } from "lucide-react";

interface WalkthroughStep {
  id: string;
  title: string;
  subtitle: string;
  instructions: string[];
  helperNote?: string;
  tourTarget: string;
  desktopCardPosition: "right" | "left" | "bottom" | "top";
  icon: React.ReactNode;
  beforeShow?: () => void;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSwitchToEmailPhone?: () => void;
  onSwitchToBrowser?: () => void;
  onSwitchToOtp?: () => void;
}

const DeviceSetupHelpCard = ({ open, onClose, onSwitchToEmailPhone, onSwitchToBrowser, onSwitchToOtp }: Props) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const steps: WalkthroughStep[] = [
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
      desktopCardPosition: "right",
      icon: <QrCode className="w-5 h-5" />,
      beforeShow: onSwitchToBrowser,
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
      desktopCardPosition: "left",
      icon: <KeyRound className="w-5 h-5" />,
      beforeShow: onSwitchToBrowser,
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
      desktopCardPosition: "left",
      icon: <Link2 className="w-5 h-5" />,
      beforeShow: onSwitchToBrowser,
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
      desktopCardPosition: "left",
      icon: <ShieldCheck className="w-5 h-5" />,
      beforeShow: onSwitchToBrowser,
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
      desktopCardPosition: "top",
      icon: <Mail className="w-5 h-5" />,
      beforeShow: onSwitchToBrowser,
    },
    {
      id: "email-input",
      title: "Step 6: Enter Contact Info",
      subtitle: "Email or phone number",
      instructions: [
        "Enter your registered email address or phone number",
        "Tap 'Send Code' to receive a 6-digit verification code",
        "Check your inbox or messages for the code",
      ],
      helperNote: "If you don't receive the code, you can resend it after a few seconds.",
      tourTarget: "email-input-area",
      desktopCardPosition: "left",
      icon: <MessageSquare className="w-5 h-5" />,
      beforeShow: onSwitchToEmailPhone,
    },
    {
      id: "otp-entry",
      title: "Step 7: Enter Verification Code",
      subtitle: "Complete activation",
      instructions: [
        "Enter the 6-digit code received on your email or phone",
        "Each digit goes in a separate box",
        "Your device will activate automatically once verified",
      ],
      tourTarget: "otp-code-area",
      desktopCardPosition: "left",
      icon: <Phone className="w-5 h-5" />,
      beforeShow: onSwitchToOtp,
    },
  ];

  const step = steps[currentStep];

  const measureTarget = useCallback(() => {
    if (!step || !open) return;
    const el = document.querySelector(`[data-tour="${step.tourTarget}"]`);
    if (el) {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) setHighlightRect(rect);
    }
  }, [step, open]);

  // Run beforeShow and then measure after DOM updates
  useEffect(() => {
    if (!open) return;
    const s = steps[currentStep];
    if (s?.beforeShow) s.beforeShow();
    let attempts = 0;
    const tryMeasure = () => {
      const el = document.querySelector(`[data-tour="${s?.tourTarget}"]`);
      if (el) {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) { setHighlightRect(rect); return; }
      }
      attempts++;
      if (attempts < 20) setTimeout(tryMeasure, 100);
    };
    const timer = setTimeout(tryMeasure, 150);
    return () => clearTimeout(timer);
  }, [currentStep, open]);

  useEffect(() => {
    if (!open) return;
    const onResize = () => measureTarget();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);
    return () => { window.removeEventListener("resize", onResize); window.removeEventListener("scroll", onResize, true); };
  }, [open, measureTarget]);

  useEffect(() => {
    if (open) { setCurrentStep(0); setHighlightRect(null); }
  }, [open]);

  const handleClose = () => { setCurrentStep(0); onSwitchToBrowser?.(); onClose(); };
  const handleNext = () => { if (currentStep < steps.length - 1) setCurrentStep(currentStep + 1); else handleClose(); };
  const handlePrev = () => { if (currentStep > 0) setCurrentStep(currentStep - 1); };

  if (!step || !open) return null;

  const padding = isMobile ? 8 : 12;
  const spotlightStyle: React.CSSProperties = highlightRect ? {
    top: highlightRect.top - padding,
    left: highlightRect.left - padding,
    width: highlightRect.width + padding * 2,
    height: highlightRect.height + padding * 2,
  } : { top: "40%", left: "40%", width: "20%", height: "20%" };

  // Desktop: position card relative to highlight
  const getDesktopCardStyle = (): React.CSSProperties => {
    if (!highlightRect) return { position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
    const cardW = 380;
    const cardEstH = 420;
    const gap = 32;
    const centerY = highlightRect.top + highlightRect.height / 2 - cardEstH / 2;
    const clampedY = Math.max(20, Math.min(centerY, window.innerHeight - cardEstH - 60));

    if (step.desktopCardPosition === "right") {
      return { position: "fixed", top: clampedY, left: highlightRect.right + gap, width: cardW, maxWidth: `calc(100vw - ${highlightRect.right + gap + 20}px)` };
    }
    if (step.desktopCardPosition === "left") {
      return { position: "fixed", top: clampedY, right: `calc(100vw - ${highlightRect.left - gap}px)`, width: cardW, maxWidth: `${highlightRect.left - gap - 20}px` };
    }
    if (step.desktopCardPosition === "top") {
      return { position: "fixed", bottom: `calc(100vh - ${highlightRect.top - gap}px)`, left: Math.max(20, highlightRect.left + highlightRect.width / 2 - cardW / 2), width: cardW };
    }
    return { position: "fixed", top: highlightRect.bottom + gap, left: Math.max(20, highlightRect.left + highlightRect.width / 2 - cardW / 2), width: cardW };
  };

  // Arrow info for desktop only
  const getArrowInfo = (): { pos: React.CSSProperties; dir: string } | null => {
    if (!highlightRect || isMobile) return null;
    const gap = 4;
    if (step.desktopCardPosition === "right") return { pos: { position: "fixed", top: highlightRect.top + highlightRect.height / 2 - 16, left: highlightRect.right + gap }, dir: "right" };
    if (step.desktopCardPosition === "left") return { pos: { position: "fixed", top: highlightRect.top + highlightRect.height / 2 - 16, left: highlightRect.left - gap - 32 }, dir: "left" };
    if (step.desktopCardPosition === "top") return { pos: { position: "fixed", top: highlightRect.top - gap - 32, left: highlightRect.left + highlightRect.width / 2 - 16 }, dir: "up" };
    return { pos: { position: "fixed", top: highlightRect.bottom + gap, left: highlightRect.left + highlightRect.width / 2 - 16 }, dir: "down" };
  };

  const arrowPaths: Record<string, string> = {
    right: "M6 16L26 16M26 16L18 8M26 16L18 24",
    left: "M26 16L6 16M6 16L14 8M6 16L14 24",
    down: "M16 6L16 26M16 26L8 18M16 26L24 18",
    up: "M16 26L16 6M16 6L8 14M16 6L24 14",
  };

  const arrowData = getArrowInfo();

  // Instruction card content (shared between mobile and desktop)
  const renderCardContent = () => (
    <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
      {/* Card header */}
      <div className="px-4 md:px-5 pt-4 md:pt-5 pb-2 md:pb-3 flex items-center gap-3">
        <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
          {step.icon}
        </div>
        <div className="min-w-0">
          <h3 className="text-sm md:text-[15px] font-bold text-gray-900 truncate">{step.title}</h3>
          <p className="text-xs text-gray-500">{step.subtitle}</p>
        </div>
        <span className="ml-auto text-xs text-gray-400 shrink-0">{currentStep + 1}/{steps.length}</span>
      </div>

      {/* Instructions */}
      <div className="px-4 md:px-5 pb-3 md:pb-4 flex flex-col gap-2">
        {step.instructions.map((instruction, i) => (
          <div key={i} className="flex gap-2.5 items-start">
            <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center text-[11px] md:text-xs font-bold shrink-0 mt-0.5">
              {i + 1}
            </div>
            <p className="text-xs md:text-[13px] text-gray-700 leading-relaxed pt-0.5">{instruction}</p>
          </div>
        ))}
      </div>

      {/* Helper note */}
      {step.helperNote && (
        <div className="mx-4 md:mx-5 mb-3 md:mb-4 p-2.5 md:p-3 rounded-xl bg-amber-50 border border-amber-100">
          <p className="text-[11px] md:text-xs text-amber-700 leading-relaxed">{step.helperNote}</p>
        </div>
      )}

      {/* Footer with navigation */}
      <div className="px-4 md:px-5 pb-4 md:pb-5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 md:gap-2">
          {currentStep > 0 && (
            <button
              onClick={handlePrev}
              className="flex items-center gap-1 px-3 md:px-4 py-2 md:py-2.5 rounded-xl bg-gray-100 text-gray-600 text-xs md:text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5 md:w-4 md:h-4" />
              Back
            </button>
          )}
          <button
            onClick={handleClose}
            className="flex items-center gap-1 px-3 md:px-4 py-2 md:py-2.5 rounded-xl bg-gray-100 text-gray-600 text-xs md:text-sm font-medium hover:bg-gray-200 transition-colors"
          >
            Skip
          </button>
        </div>
        <button
          onClick={handleNext}
          className="flex items-center gap-1 px-4 md:px-5 py-2 md:py-2.5 rounded-xl bg-amber-500 text-white text-xs md:text-sm font-semibold hover:bg-amber-600 transition-colors"
        >
          {currentStep === steps.length - 1 ? "Got it" : "Next"}
          {currentStep < steps.length - 1 && <ChevronRight className="w-3.5 h-3.5 md:w-4 md:h-4" />}
        </button>
      </div>
    </div>
  );

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
              border: isMobile ? "2px solid #F59E0B" : "3px solid #F59E0B",
              borderRadius: isMobile ? "12px" : "16px",
              pointerEvents: "none",
              zIndex: 10001,
            }}
          />

          {/* Desktop: Animated arrow */}
          {arrowData && highlightRect && (
            <motion.div
              key={`arrow-${currentStep}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.25 }}
              style={{ ...arrowData.pos, zIndex: 20 }}
            >
              <motion.div
                animate={
                  arrowData.dir === "left" ? { x: [0, -6, 0] } :
                  arrowData.dir === "right" ? { x: [0, 6, 0] } :
                  arrowData.dir === "up" ? { y: [0, -6, 0] } :
                  { y: [0, 6, 0] }
                }
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
              initial={{ opacity: 0, y: isMobile ? 20 : 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.3 }}
              style={{ zIndex: 10002, ...(
                isMobile
                  ? {
                      position: "fixed" as const,
                      bottom: 16,
                      left: 12,
                      right: 12,
                    }
                  : getDesktopCardStyle()
              )}}
            >
              {renderCardContent()}
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DeviceSetupHelpCard;
