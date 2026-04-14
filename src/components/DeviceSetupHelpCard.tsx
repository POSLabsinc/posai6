import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, ChevronLeft, QrCode, Globe, Mail, Phone, KeyRound, Link2, ShieldCheck } from "lucide-react";

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

// Flow 1: QR Code activation walkthrough
const qrFlowSteps: WalkthroughStep[] = [
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
  {
    id: "link-highlight",
    title: "Step 3: Activation Link",
    subtitle: "Alternative browser method",
    instructions: [
      "If QR scanning is not available, use this link instead",
      "Open any browser on your phone or computer",
      "Type the URL shown here into the address bar",
      "You will be prompted to enter the activation code from Step 2",
    ],
    highlightArea: { top: "38%", left: "52%", width: "42%", height: "12%" },
    cardPosition: "left",
    arrowDirection: "left",
    icon: <Link2 className="w-5 h-5" />,
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
    helperNote: "If the code expires, a new one will be generated automatically. Just use the latest code shown on screen.",
    highlightArea: { top: "58%", left: "52%", width: "42%", height: "14%" },
    cardPosition: "left",
    arrowDirection: "left",
    icon: <ShieldCheck className="w-5 h-5" />,
  },
];

// Flow 2: Email activation walkthrough
const emailFlowSteps: WalkthroughStep[] = [
  {
    id: "email-button",
    title: "Step 1: Select Email Activation",
    subtitle: "Choose email verification",
    instructions: [
      "Look for the 'Activate via email / phone' button below",
      "Tap or click on it to switch to email activation mode",
      "You will be prompted to enter your email address",
    ],
    highlightArea: { top: "80%", left: "35%", width: "30%", height: "6%" },
    cardPosition: "left",
    arrowDirection: "down",
    icon: <Mail className="w-5 h-5" />,
  },
  {
    id: "email-enter",
    title: "Step 2: Enter Your Email",
    subtitle: "Provide your registered email",
    instructions: [
      "Enter the email address associated with your account",
      "Make sure to use the email registered with your organization",
      "Tap 'Send Code' to receive a verification code",
    ],
    highlightArea: { top: "40%", left: "30%", width: "40%", height: "10%" },
    cardPosition: "right",
    arrowDirection: "right",
    icon: <Mail className="w-5 h-5" />,
  },
  {
    id: "email-otp",
    title: "Step 3: Enter Verification Code",
    subtitle: "Check your inbox",
    instructions: [
      "Open your email inbox and find the verification email",
      "Copy the 6-digit code from the email",
      "Enter the code in the verification boxes on screen",
      "The device will activate automatically once verified",
    ],
    helperNote: "If you don't receive the code, check your spam folder or tap 'Resend Code' after a few seconds.",
    highlightArea: { top: "45%", left: "25%", width: "50%", height: "15%" },
    cardPosition: "right",
    arrowDirection: "right",
    icon: <ShieldCheck className="w-5 h-5" />,
  },
];

// Flow 3: Phone activation walkthrough
const phoneFlowSteps: WalkthroughStep[] = [
  {
    id: "phone-button",
    title: "Step 1: Select Phone Activation",
    subtitle: "Choose phone verification",
    instructions: [
      "Look for the 'Activate via email / phone' button below",
      "Tap or click on it to switch to phone activation mode",
      "Select the phone tab to enter your mobile number",
    ],
    highlightArea: { top: "80%", left: "35%", width: "30%", height: "6%" },
    cardPosition: "left",
    arrowDirection: "down",
    icon: <Phone className="w-5 h-5" />,
  },
  {
    id: "phone-enter",
    title: "Step 2: Enter Phone Number",
    subtitle: "Provide your mobile number",
    instructions: [
      "Enter your mobile phone number with country code",
      "Make sure the number can receive SMS messages",
      "Tap 'Send Code' to receive a verification SMS",
    ],
    highlightArea: { top: "40%", left: "30%", width: "40%", height: "10%" },
    cardPosition: "right",
    arrowDirection: "right",
    icon: <Phone className="w-5 h-5" />,
  },
  {
    id: "phone-otp",
    title: "Step 3: Enter Verification Code",
    subtitle: "Check your messages",
    instructions: [
      "Open your text messages and find the verification SMS",
      "Copy the 6-digit code from the message",
      "Enter the code in the verification boxes on screen",
      "The device will activate automatically once verified",
    ],
    helperNote: "If you don't receive the SMS, ensure your phone has signal and tap 'Resend Code' after a few seconds.",
    highlightArea: { top: "45%", left: "25%", width: "50%", height: "15%" },
    cardPosition: "right",
    arrowDirection: "right",
    icon: <ShieldCheck className="w-5 h-5" />,
  },
];

type FlowType = "main" | "qr" | "email" | "phone";

interface Props {
  open: boolean;
  onClose: () => void;
}

const DeviceSetupHelpCard = ({ open, onClose }: Props) => {
  const [flow, setFlow] = useState<FlowType>("main");
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (open) {
      setFlow("main");
      setCurrentStep(0);
    }
  }, [open]);

  const handleClose = () => {
    setFlow("main");
    setCurrentStep(0);
    onClose();
  };

  const getSteps = (): WalkthroughStep[] => {
    switch (flow) {
      case "qr": return qrFlowSteps;
      case "email": return emailFlowSteps;
      case "phone": return phoneFlowSteps;
      default: return [];
    }
  };

  const steps = getSteps();
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
    } else {
      setFlow("main");
    }
  };

  const startFlow = (f: FlowType) => {
    setFlow(f);
    setCurrentStep(0);
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
      top: `calc(${h.top} + ${h.height} + 32px)`,
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

  // Main menu screen
  if (flow === "main") {
    return (
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={handleClose} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.25 }}
              className="relative z-10 w-full max-w-md bg-[#1C1C1E] border border-foreground/[0.08] rounded-2xl shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-start justify-between px-6 pt-6 pb-2">
                <div>
                  <span className="text-[10px] font-medium text-foreground/30 uppercase tracking-wider">Help Guide</span>
                  <h2 className="text-xl font-bold text-foreground mt-1">How would you like to activate?</h2>
                  <p className="text-sm text-foreground/40 mt-1">Choose a method below to see step-by-step instructions</p>
                </div>
                <button onClick={handleClose} className="w-9 h-9 rounded-xl flex items-center justify-center text-foreground/40 hover:text-foreground/70 hover:bg-foreground/[0.06] transition-colors shrink-0 ml-2">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Flow options */}
              <div className="px-6 py-5 flex flex-col gap-3">
                <button
                  onClick={() => startFlow("qr")}
                  className="flex items-center gap-4 p-4 rounded-xl bg-foreground/[0.04] border border-foreground/[0.08] hover:bg-foreground/[0.08] hover:border-primary/30 transition-all group"
                >
                  <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">QR Code / Browser Activation</h3>
                    <p className="text-xs text-foreground/40 mt-0.5">Scan QR or use a link with activation code</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-foreground/20 group-hover:text-primary transition-colors" />
                </button>

                <button
                  onClick={() => startFlow("email")}
                  className="flex items-center gap-4 p-4 rounded-xl bg-foreground/[0.04] border border-foreground/[0.08] hover:bg-foreground/[0.08] hover:border-primary/30 transition-all group"
                >
                  <div className="w-11 h-11 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="text-sm font-semibold text-foreground group-hover:text-blue-400 transition-colors">Activate via Email</h3>
                    <p className="text-xs text-foreground/40 mt-0.5">Receive a verification code to your email</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-foreground/20 group-hover:text-blue-400 transition-colors" />
                </button>

                <button
                  onClick={() => startFlow("phone")}
                  className="flex items-center gap-4 p-4 rounded-xl bg-foreground/[0.04] border border-foreground/[0.08] hover:bg-foreground/[0.08] hover:border-primary/30 transition-all group"
                >
                  <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="text-sm font-semibold text-foreground group-hover:text-emerald-400 transition-colors">Activate via Phone</h3>
                    <p className="text-xs text-foreground/40 mt-0.5">Receive a verification code via SMS</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-foreground/20 group-hover:text-emerald-400 transition-colors" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  // Walkthrough mode with spotlight + card
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
          className="fixed inset-0 z-[10000]"
        >
          {/* Spotlight cutout - dims everything except highlighted area */}
          <motion.div
            key={`spotlight-${flow}-${currentStep}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="absolute rounded-2xl"
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
            key={`arrow-${flow}-${currentStep}`}
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
            key={`card-${flow}-${currentStep}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.3 }}
            className="z-30"
            style={getCardStyle()}
          >
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-white/10">
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
                  <span className="text-[11px] text-gray-400 ml-2">{currentStep + 1}/{steps.length}</span>
                </div>
                <button
                  onClick={handleNext}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition-colors"
                >
                  {currentStep === steps.length - 1 ? "Done" : "Next"}
                  {currentStep < steps.length - 1 && <ChevronRight className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </motion.div>

          {/* Bottom controls */}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3">
            <button
              onClick={handlePrev}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/10 text-white/70 text-sm hover:bg-white/20 transition-colors backdrop-blur-sm"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
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
