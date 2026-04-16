import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronLeft, QrCode, KeyRound, Link2, Mail, Phone, HelpCircle } from "lucide-react";

interface HelpTopic {
  id: string;
  icon: React.ReactNode;
  label: string;
  title: string;
  subtitle: string;
  steps: { text: string }[];
  helperNote?: string;
  tourTarget: string;
  desktopCardPosition: "right" | "left" | "bottom" | "top";
  beforeShow?: () => void;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSwitchToEmailPhone?: () => void;
  onSwitchToBrowser?: () => void;
  onSwitchToBrowserTab?: () => void;
  onSwitchToDefaultView?: () => void;
  onSwitchToOtp?: () => void;
}

const DeviceSetupHelpCard = ({ open, onClose, onSwitchToEmailPhone, onSwitchToBrowser, onSwitchToBrowserTab, onSwitchToDefaultView, onSwitchToOtp }: Props) => {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const topics: HelpTopic[] = [
    {
      id: "qr-code",
      icon: <QrCode className="w-5 h-5" />,
      label: "Scan QR Code",
      title: "Scan QR Code",
      subtitle: "Use your phone camera to activate",
      steps: [
        { text: "Open the camera app on your phone or tablet" },
        { text: "Point it at the QR code displayed on this screen" },
        { text: "A link will appear on your device, tap it to proceed" },
        { text: "Follow the on-screen instructions to complete activation" },
      ],
      helperNote: "Most modern phones support QR scanning natively through the camera app.",
      tourTarget: "qr-code",
      desktopCardPosition: "right",
      beforeShow: onSwitchToDefaultView || onSwitchToBrowser,
    },
    {
      id: "activation-code",
      icon: <KeyRound className="w-5 h-5" />,
      label: "Activation Code",
      title: "Use Activation Code",
      subtitle: "Enter this code on your other device",
      steps: [
        { text: "Note down the activation code shown on this screen" },
        { text: "Open the activation link in any browser on another device" },
        { text: "Enter the code when prompted" },
        { text: "Your device will activate automatically once verified" },
      ],
      helperNote: "The code refreshes periodically for security. Use the latest code displayed.",
      tourTarget: "activation-code",
      desktopCardPosition: "left",
      beforeShow: onSwitchToBrowserTab || onSwitchToBrowser,
    },
    {
      id: "activation-link",
      icon: <Link2 className="w-5 h-5" />,
      label: "Activation Link",
      title: "Open Activation Link",
      subtitle: "Type this URL in any browser",
      steps: [
        { text: "Open any browser on your phone or computer" },
        { text: "Type the URL shown on screen into the address bar" },
        { text: "You will be prompted to enter the activation code" },
        { text: "Enter the code displayed on this device to complete setup" },
      ],
      helperNote: "Use this method if QR scanning is not available on your device.",
      tourTarget: "activation-link",
      desktopCardPosition: "left",
      beforeShow: onSwitchToBrowserTab || onSwitchToBrowser,
    },
    {
      id: "email-phone",
      icon: <Mail className="w-5 h-5" />,
      label: "Email or Phone",
      title: "Activate via Email or Phone",
      subtitle: "Receive a verification code",
      steps: [
        { text: "Tap the 'Activate via email / phone' button below" },
        { text: "Enter your registered email address or phone number" },
        { text: "Tap 'Send Code' to receive a 6-digit verification code" },
        { text: "Enter the code to activate your device" },
      ],
      helperNote: "If you don't receive the code, you can resend it after a few seconds.",
      tourTarget: "email-phone-button",
      desktopCardPosition: "top",
      beforeShow: onSwitchToDefaultView || onSwitchToBrowser,
    },
  ];

  const activeTopic = topics.find(t => t.id === selectedTopic);

  const findVisibleTourElement = useCallback((tourTarget: string): HTMLElement | null => {
    const els = document.querySelectorAll(`[data-tour="${tourTarget}"]`);
    for (const el of Array.from(els)) {
      const htmlEl = el as HTMLElement;
      const rect = htmlEl.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0 && htmlEl.offsetParent !== null) return htmlEl;
    }
    for (const el of Array.from(els)) {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) return el as HTMLElement;
    }
    return null;
  }, []);

  const measureAndScroll = useCallback((tourTarget: string) => {
    const el = findVisibleTourElement(tourTarget);
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return false;
    setHighlightRect(rect);
    return true;
  }, [findVisibleTourElement]);

  const measureTarget = useCallback(() => {
    if (!activeTopic || !open) return;
    const el = findVisibleTourElement(activeTopic.tourTarget);
    if (el) {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) setHighlightRect(rect);
    }
  }, [activeTopic, open, findVisibleTourElement]);

  // When topic changes, trigger beforeShow and measure
  useEffect(() => {
    if (!open || !activeTopic) { setHighlightRect(null); return; }
    if (activeTopic.beforeShow) activeTopic.beforeShow();
    let attempts = 0;
    const tryMeasure = () => {
      const found = measureAndScroll(activeTopic.tourTarget);
      if (!found) { attempts++; if (attempts < 25) setTimeout(tryMeasure, 100); }
    };
    const timer = setTimeout(tryMeasure, 150);
    return () => clearTimeout(timer);
  }, [selectedTopic, open]);

  useEffect(() => {
    if (!open || !activeTopic) return;
    const update = () => { measureTarget(); rafRef.current = requestAnimationFrame(update); };
    const handleInteraction = () => { cancelAnimationFrame(rafRef.current); rafRef.current = requestAnimationFrame(update); };
    window.addEventListener("resize", measureTarget);
    window.addEventListener("scroll", handleInteraction, true);
    return () => { window.removeEventListener("resize", measureTarget); window.removeEventListener("scroll", handleInteraction, true); cancelAnimationFrame(rafRef.current); };
  }, [open, measureTarget, activeTopic]);

  useEffect(() => { if (open) { setSelectedTopic(null); setCurrentStepIndex(0); setHighlightRect(null); } }, [open]);

  const handleClose = () => { setSelectedTopic(null); setCurrentStepIndex(0); (onSwitchToDefaultView || onSwitchToBrowser)?.(); onClose(); };
  const handleBack = () => { setSelectedTopic(null); setCurrentStepIndex(0); (onSwitchToDefaultView || onSwitchToBrowser)?.(); };

  if (!open) return null;

  const padding = isMobile ? 10 : 12;

  // ---- MENU VIEW (no topic selected) ----
  if (!selectedTopic) {
    return (
      <>
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.6)" }} onClick={handleClose} />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.25 }}
          style={{
            position: "fixed",
            top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 10002,
            width: isMobile ? "calc(100% - 24px)" : 400,
            maxWidth: 420,
          }}
        >
          <div className="rounded-2xl shadow-2xl overflow-hidden" style={{ background: "#1E1E22", border: "1px solid rgba(255,255,255,0.08)" }}>
            {/* Header */}
            <div className="px-5 pt-5 pb-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(245,158,11,0.12)" }}>
                <HelpCircle className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h3 className="text-[15px] font-bold text-white">Need Help?</h3>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>Choose a topic to learn more</p>
              </div>
            </div>

            {/* Topic Options */}
            <div className="px-4 pb-4 flex flex-col gap-2">
              {topics.map((topic) => (
                <button
                  key={topic.id}
                  onClick={() => { setSelectedTopic(topic.id); setCurrentStepIndex(0); }}
                  className="flex items-center gap-3 p-3.5 rounded-xl transition-all hover:scale-[1.01] active:scale-[0.99]"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(245,158,11,0.12)" }}>
                    <span className="text-amber-500">{topic.icon}</span>
                  </div>
                  <div className="text-left min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white">{topic.label}</p>
                    <p className="text-[11px] truncate" style={{ color: "rgba(255,255,255,0.4)" }}>{topic.subtitle}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 shrink-0" style={{ color: "rgba(255,255,255,0.25)" }} />
                </button>
              ))}
            </div>

            {/* Footer */}
            <div className="px-5 pb-4">
              <button onClick={handleClose} className="text-xs font-medium transition-colors" style={{ color: "rgba(255,255,255,0.35)" }}>
                Close
              </button>
            </div>
          </div>
        </motion.div>
      </>
    );
  }

  // ---- SINGLE TOPIC VIEW (step-by-step for one topic) ----
  if (!activeTopic) return null;

  const currentInstruction = activeTopic.steps[currentStepIndex];
  const totalSteps = activeTopic.steps.length;
  const isLastStep = currentStepIndex === totalSteps - 1;

  const getDesktopCardStyle = (): React.CSSProperties => {
    if (!highlightRect) return { position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
    const cardW = 360, cardEstH = 260, gap = 32;
    const centerY = highlightRect.top + highlightRect.height / 2 - cardEstH / 2;
    const clampedY = Math.max(20, Math.min(centerY, window.innerHeight - cardEstH - 60));
    if (activeTopic.desktopCardPosition === "right") return { position: "fixed", top: clampedY, left: highlightRect.right + gap, width: cardW, maxWidth: `calc(100vw - ${highlightRect.right + gap + 20}px)` };
    if (activeTopic.desktopCardPosition === "left") return { position: "fixed", top: clampedY, right: `calc(100vw - ${highlightRect.left - gap}px)`, width: cardW, maxWidth: `${highlightRect.left - gap - 20}px` };
    if (activeTopic.desktopCardPosition === "top") return { position: "fixed", bottom: `calc(100vh - ${highlightRect.top - gap}px)`, left: Math.max(20, highlightRect.left + highlightRect.width / 2 - cardW / 2), width: cardW };
    return { position: "fixed", top: highlightRect.bottom + gap, left: Math.max(20, highlightRect.left + highlightRect.width / 2 - cardW / 2), width: cardW };
  };

  const getArrowInfo = (): { pos: React.CSSProperties; dir: string } | null => {
    if (!highlightRect || isMobile) return null;
    const gap = 4;
    if (activeTopic.desktopCardPosition === "right") return { pos: { position: "fixed", top: highlightRect.top + highlightRect.height / 2 - 16, left: highlightRect.right + gap }, dir: "right" };
    if (activeTopic.desktopCardPosition === "left") return { pos: { position: "fixed", top: highlightRect.top + highlightRect.height / 2 - 16, left: highlightRect.left - gap - 32 }, dir: "left" };
    if (activeTopic.desktopCardPosition === "top") return { pos: { position: "fixed", top: highlightRect.top - gap - 32, left: highlightRect.left + highlightRect.width / 2 - 16 }, dir: "up" };
    return { pos: { position: "fixed", top: highlightRect.bottom + gap, left: highlightRect.left + highlightRect.width / 2 - 16 }, dir: "down" };
  };

  const arrowPaths: Record<string, string> = { right: "M6 16L26 16M26 16L18 8M26 16L18 24", left: "M26 16L6 16M6 16L14 8M6 16L14 24", down: "M16 6L16 26M16 26L8 18M16 26L24 18", up: "M16 26L16 6M16 6L8 14M16 6L24 14" };
  const arrowData = getArrowInfo();

  const spotlightStyle: React.CSSProperties = highlightRect ? {
    top: highlightRect.top - padding, left: highlightRect.left - padding,
    width: highlightRect.width + padding * 2, height: highlightRect.height + padding * 2,
  } : { top: "40%", left: "40%", width: "20%", height: "20%" };

  const getMobileCardStyle = (): React.CSSProperties => {
    if (highlightRect && activeTopic.desktopCardPosition === "top") {
      const cardBottom = highlightRect.top - padding - 16;
      return { position: "fixed", bottom: `calc(100vh - ${cardBottom}px)`, left: 12, right: 12, zIndex: 10002 };
    }
    return { position: "fixed", bottom: 12, left: 12, right: 12, zIndex: 10002 };
  };

  const cardStyle: React.CSSProperties = isMobile
    ? getMobileCardStyle()
    : { ...getDesktopCardStyle(), zIndex: 10002 };

  return (
    <>
      <div style={{ position: "fixed", inset: 0, zIndex: 9999 }} onClick={handleClose} />

      {/* Spotlight */}
      <motion.div
        key={`spotlight-${selectedTopic}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        style={{
          position: "fixed", ...spotlightStyle,
          boxShadow: "0 0 0 9999px rgba(0,0,0,0.82)",
          border: isMobile ? "2px solid #F59E0B" : "3px solid #F59E0B",
          borderRadius: isMobile ? 12 : 16,
          pointerEvents: "none", zIndex: 10000,
        }}
      />

      {/* Arrow (desktop) */}
      {arrowData && highlightRect && (
        <motion.div
          key={`arrow-${selectedTopic}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.25 }}
          style={{ ...arrowData.pos, zIndex: 10001 }}
        >
          <motion.div
            animate={arrowData.dir === "left" ? { x: [0, -6, 0] } : arrowData.dir === "right" ? { x: [0, 6, 0] } : arrowData.dir === "up" ? { y: [0, -6, 0] } : { y: [0, 6, 0] }}
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
          key={`card-${selectedTopic}-${currentStepIndex}`}
          initial={{ opacity: 0, y: isMobile ? 20 : 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.25 }}
          style={cardStyle}
        >
          <div className="rounded-2xl shadow-2xl overflow-hidden" style={{ background: "#1E1E22", border: "1px solid rgba(255,255,255,0.08)" }}>
            {/* Header */}
            <div className="px-4 md:px-5 pt-4 md:pt-5 pb-2 md:pb-3 flex items-center gap-3">
              <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(245,158,11,0.12)" }}>
                <span className="text-amber-500">{activeTopic.icon}</span>
              </div>
              <div className="min-w-0">
                <h3 className="text-sm md:text-[15px] font-bold text-white truncate">{activeTopic.title}</h3>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>{activeTopic.subtitle}</p>
              </div>
              <span className="ml-auto text-xs shrink-0" style={{ color: "rgba(255,255,255,0.35)" }}>{currentStepIndex + 1}/{totalSteps}</span>
            </div>

            {/* Single Step Content */}
            <div className="px-4 md:px-5 py-4 md:py-5">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStepIndex}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="flex gap-3 items-start"
                >
                  <span
                    className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-sm font-bold"
                    style={{ background: "rgba(245,158,11,0.15)", color: "#F59E0B" }}
                  >
                    {currentStepIndex + 1}
                  </span>
                  <p className="text-sm leading-relaxed pt-0.5" style={{ color: "rgba(255,255,255,0.8)" }}>
                    {currentInstruction.text}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Helper note on last step */}
            {isLastStep && activeTopic.helperNote && (
              <div className="mx-4 md:mx-5 mb-3 md:mb-4 p-2.5 md:p-3 rounded-xl" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.15)" }}>
                <p className="text-[11px] md:text-xs leading-relaxed" style={{ color: "rgba(245,158,11,0.85)" }}>{activeTopic.helperNote}</p>
              </div>
            )}

            {/* Step dots */}
            <div className="flex justify-center gap-1.5 pb-3">
              {activeTopic.steps.map((_, i) => (
                <div
                  key={i}
                  className="h-1.5 rounded-full transition-all duration-300"
                  style={{
                    width: i === currentStepIndex ? 20 : 6,
                    background: i === currentStepIndex ? "#F59E0B" : "rgba(255,255,255,0.15)",
                  }}
                />
              ))}
            </div>

            {/* Footer */}
            <div className="px-4 md:px-5 pb-3 md:pb-5 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={currentStepIndex > 0 ? () => setCurrentStepIndex(i => i - 1) : handleBack}
                  className="w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center transition-colors"
                  style={{ background: "rgba(255,255,255,0.08)" }}
                >
                  <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" style={{ color: "rgba(255,255,255,0.6)" }} />
                </button>
                <button onClick={handleClose} className="text-xs md:text-sm font-medium transition-colors px-2" style={{ color: "rgba(255,255,255,0.45)" }}>
                  Skip
                </button>
              </div>
              <button
                onClick={isLastStep ? handleBack : () => setCurrentStepIndex(i => i + 1)}
                className="flex items-center gap-1 px-4 md:px-5 py-2 md:py-2.5 rounded-full text-xs md:text-sm font-semibold transition-colors"
                style={{ background: "#F59E0B", color: "#fff" }}
              >
                {isLastStep ? "Done" : "Next"}
                {!isLastStep && <ChevronRight className="w-3.5 h-3.5 md:w-4 md:h-4" />}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </>
  );
};

export default DeviceSetupHelpCard;
