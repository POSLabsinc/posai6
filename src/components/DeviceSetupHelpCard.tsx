import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, ChevronLeft, QrCode, Globe, KeyRound, Link2, ShieldCheck, Mail, Phone } from "lucide-react";

interface WalkthroughStep {
  id: string;
  title: string;
  subtitle: string;
  instructions: string[];
  helperNote?: string;
  highlightArea: { top: string; left: string; width: string; height: string };
  cardPosition: "right" | "left" | "bottom";
  arrowDirection: "right" | "left" | "down";
  icon: React.ReactNode;
}

// All walkthrough steps in sequence: QR → Code → Link → Code again → Email/Phone button → Email → Phone
const walkthroughSteps: WalkthroughStep[] = [
  // Step 1: QR Code
  {
    id: "qr-highlight",
    title: "Step 1: Scan QR Code",
    subtitle: "Use your phone to scan",
    instructions: [
      "Open the camera app on your phone or tablet",
      "Point it at the QR code displayed on this screen",
      "A link will appear on your mobile device, tap it to proceed",
      "Follow the on-screen instructions to complete activation",
    ],
    helperNote: "Most modern phones support QR scanning natively through the camera app. No extra app needed.",
    highlightArea: { top: "25%", left: "8%", width: "34%", height: "55%" },
    cardPosition: "right",
    arrowDirection: "right",
    icon: <QrCode className="w-5 h-5" />,
  },
  // Step 2: Activation Code
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
    highlightArea: { top: "58%", left: "52%", width: "42%", height: "14%" },
    cardPosition: "left",
    arrowDirection: "left",
    icon: <KeyRound className="w-5 h-5" />,
  },
  // Step 3: Activation Link
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
    highlightArea: { top: "38%", left: "52%", width: "42%", height: "12%" },
    cardPosition: "left",
    arrowDirection: "left",
    icon: <Link2 className="w-5 h-5" />,
  },
  // Step 4: Code reconfirmation
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
    helperNote: "If the code expires, a new one will be generated automatically. Just use the latest code shown on screen.",
    highlightArea: { top: "58%", left: "52%", width: "42%", height: "14%" },
    cardPosition: "left",
    arrowDirection: "left",
    icon: <ShieldCheck className="w-5 h-5" />,
  },
  // Step 5: Email / Phone button
  {
    id: "email-phone-button",
    title: "Step 5: Activate via Email or Phone",
    subtitle: "Alternative activation method",
    instructions: [
      "Tap this button to switch to email or phone activation",
      "You can verify your identity using a code sent to your email",
      "Or receive a verification code via SMS to your phone",
    ],
    highlightArea: { top: "78%", left: "30%", width: "40%", height: "7%" },
    cardPosition: "bottom",
    arrowDirection: "down",
    icon: <Mail className="w-5 h-5" />,
  },
  // Step 6: Email activation
  {
    id: "email-activate",
    title: "Step 6: Email Verification",
    subtitle: "Activate using your email",
    instructions: [
      "Enter your registered email address in the input field",
      "Tap 'Send Code' to receive a 6-digit verification code",
      "Check your inbox (and spam folder) for the code",
      "Enter the code on this device to complete activation",
    ],
    helperNote: "If you don't receive the code, you can resend it after a few seconds.",
    highlightArea: { top: "78%", left: "30%", width: "40%", height: "7%" },
    cardPosition: "bottom",
    arrowDirection: "down",
    icon: <Mail className="w-5 h-5" />,
  },
  // Step 7: Phone activation
  {
    id: "phone-activate",
    title: "Step 7: Phone Verification",
    subtitle: "Activate using your phone number",
    instructions: [
      "Select the phone tab and enter your mobile number with country code",
      "Tap 'Send Code' to receive a verification SMS",
      "Enter the 6-digit code from the SMS on this device",
      "Your device will activate automatically once verified",
    ],
    helperNote: "Make sure your phone has signal and can receive SMS messages.",
    highlightArea: { top: "78%", left: "30%", width: "40%", height: "7%" },
    cardPosition: "bottom",
    arrowDirection: "down",
    icon: <Phone className="w-5 h-5" />,
  },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

const DeviceSetupHelpCard = ({ open, onClose }: Props) => {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (open) setCurrentStep(0);
  }, [open]);

  const handleClose = () => {
    setCurrentStep(0);
    onClose();
  };

  const steps = walkthroughSteps;
  const step = steps[currentStep];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
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

  // Calculate card position based on step config
  const getCardStyle = (): React.CSSProperties => {
    if (!step) return {};
    const h = step.highlightArea;

    if (step.cardPosition === "right") {
      return {
        position: "absolute",
        top: h.top,
        left: `calc(${h.left} + ${h.width} + 48px)`,
        maxWidth: "380px",
        width: "380px",
      };
    }
    if (step.cardPosition === "left") {
      return {
        position: "absolute",
        top: h.top,
        right: `calc(100% - ${h.left} + 48px)`,
        maxWidth: "380px",
        width: "380px",
      };
    }
    // bottom
    return {
      position: "absolute",
      bottom: `calc(100% - ${h.top} + 24px)`,
      left: `calc(${h.left} + ${h.width} / 2)`,
      transform: "translateX(-50%)",
      maxWidth: "400px",
      width: "400px",
    };
  };

  // Arrow position and direction
  const getArrowStyle = (): React.CSSProperties => {
    if (!step) return {};
    const h = step.highlightArea;
    const base: React.CSSProperties = { position: "absolute", zIndex: 20 };

    if (step.arrowDirection === "right") {
      return { ...base, top: `calc(${h.top} + ${h.height} / 2 - 16px)`, left: `calc(${h.left} + ${h.width} + 8px)` };
    }
    if (step.arrowDirection === "left") {
      return { ...base, top: `calc(${h.top} + ${h.height} / 2 - 16px)`, left: `calc(${h.left} - 40px)` };
    }
    // down
    return { ...base, top: `calc(${h.top} - 40px)`, left: `calc(${h.left} + ${h.width} / 2 - 16px)` };
  };

  const arrowPaths: Record<string, string> = {
    right: "M6 16L26 16M26 16L18 8M26 16L18 24",
    left: "M26 16L6 16M6 16L14 8M6 16L14 24",
    down: "M16 6L16 26M16 26L8 18M16 26L24 18",
  };

  const motionDir = !step ? {} :
    step.arrowDirection === "left" ? { x: [0, -6, 0] } :
    step.arrowDirection === "right" ? { x: [0, 6, 0] } :
    { y: [0, 6, 0] };

  if (!step) return null;

  const h = step.highlightArea;

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
            className="absolute"
            style={{
              top: h.top,
              left: h.left,
              width: h.width,
              height: h.height,
              boxShadow: "0 0 0 9999px rgba(0,0,0,0.82)",
              border: "3px solid #F59E0B",
              borderRadius: "16px",
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
                <path d={arrowPaths[step.arrowDirection]} stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </motion.div>
          </motion.div>

          {/* Instruction Card */}
          <motion.div
            key={`card-${currentStep}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.3 }}
            className="z-30"
            style={getCardStyle()}
          >
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
              {/* Card header */}
              <div className="px-5 pt-5 pb-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                  {step.icon}
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-gray-900">{step.title}</h3>
                  <p className="text-xs text-gray-500">{step.subtitle}</p>
                </div>
              </div>

              {/* Instructions */}
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

              {/* Helper note */}
              {step.helperNote && (
                <div className="mx-5 mb-4 p-3 rounded-xl bg-amber-50 border border-amber-100">
                  <p className="text-xs text-amber-700 leading-relaxed">{step.helperNote}</p>
                </div>
              )}

              {/* Footer with navigation */}
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
                <button
                  onClick={handleNext}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition-colors"
                >
                  {currentStep === steps.length - 1 ? "Got it" : "Next"}
                  {currentStep < steps.length - 1 && <ChevronRight className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </motion.div>

          {/* Bottom controls */}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3">
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
