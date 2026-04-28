import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { QrCode, Link2, Mail, Sparkles, Copy, X } from "lucide-react";

interface SubStep {
  tourTarget: string;
  instructions: string[];
  showCopyIcon?: boolean;
  title?: string;
  subtitle?: string;
  desktopCardPosition?: WalkthroughStep["desktopCardPosition"];
}

interface WalkthroughStep {
  id: string;
  title: string;
  subtitle: string;
  instructions: string[];
  helperNote?: string;
  tourTarget: string;
  tourTargets?: string[];
  subSteps?: SubStep[];
  desktopCardPosition: "right" | "left" | "bottom" | "top";
  icon: React.ReactNode;
  beforeShow?: () => void;
  showCopyIcon?: boolean;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSwitchToEmailPhone?: () => void;
  onSwitchToBrowser?: () => void;
  onSwitchToBrowserTab?: () => void;
  onSwitchToDefaultView?: () => void;
  onSwitchToOtp?: () => void;
  initialStep?: number;
}

const DeviceSetupHelpCard = ({ open, onClose, onSwitchToEmailPhone, onSwitchToBrowser, onSwitchToBrowserTab, onSwitchToDefaultView, onSwitchToOtp, initialStep = 0 }: Props) => {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [subStepIndex, setSubStepIndex] = useState(0);
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const rafRef = useRef<number>(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const stepSequences: Record<number, number[]> = {};

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const baseSteps: WalkthroughStep[] = [
    // 0: Option 1 - Scan QR code
    { id: "option-1-qr", title: "Option 1: Scan QR code", subtitle: "Use your phone to scan", instructions: ["Open the camera app on your phone or tablet and point it at the QR code displayed on this screen."], tourTarget: "qr-code", desktopCardPosition: "right", icon: <QrCode className="w-5 h-5" />, beforeShow: onSwitchToDefaultView || onSwitchToBrowser },
    // 1: Option 2 - Use a browser (two sub-steps: URL, then Code)
    { id: "option-2-browser", title: "Option 2: Use a browser", subtitle: "Open the URL and enter the code", instructions: [], tourTarget: "activation-link", desktopCardPosition: "left", icon: <Link2 className="w-5 h-5" />, beforeShow: onSwitchToBrowserTab || onSwitchToBrowser, subSteps: [
      { tourTarget: "activation-link", instructions: ["Open a browser on your phone or computer and enter the URL shown on this screen (https://www.posai.com/pair) into the address bar.", "You can also tap the copy icon to quickly copy the link."], showCopyIcon: true, title: "Option 2: Use a browser", subtitle: "Step 1 - Open the URL" },
      { tourTarget: "activation-code", instructions: ["Enter this 6-character highlighted code on the paired browser page to activate your device."], title: "Option 2: Use a browser", subtitle: "Step 2 - Enter the highlighted code", desktopCardPosition: "left" },
    ] },
    // 2: Option 3 - Activate with Code
    { id: "option-3-code", title: "Option 3: Activate with Code", subtitle: "Use email or phone number", instructions: ["Enter your registered email address or phone number.", "Tap 'Send Code' to receive a 6-digit verification code."], tourTarget: "email-input-field", desktopCardPosition: "left", icon: <Mail className="w-5 h-5" />, beforeShow: onSwitchToEmailPhone },
    // 3: Activate with AI
    { id: "activate-with-ai", title: "Activate with AI", subtitle: "Let AI guide your activation", instructions: ["Tap 'Activate with AI' to start a guided conversation.", "The AI assistant will walk you through activating this device step by step, no QR code or manual input needed."], tourTarget: "activate-with-ai", desktopCardPosition: "top", icon: <Sparkles className="w-5 h-5" />, beforeShow: onSwitchToDefaultView || onSwitchToBrowser },
  ];

  // Resolve current step with substep overrides applied
  const resolveStep = (s: WalkthroughStep, sub: number): WalkthroughStep => {
    if (!s.subSteps || s.subSteps.length === 0) return s;
    const ss = s.subSteps[Math.min(sub, s.subSteps.length - 1)];
    return { ...s, instructions: ss.instructions, tourTarget: ss.tourTarget, tourTargets: undefined, showCopyIcon: ss.showCopyIcon, title: ss.title ?? s.title, subtitle: ss.subtitle ?? s.subtitle, desktopCardPosition: ss.desktopCardPosition ?? s.desktopCardPosition };
  };

  const steps: WalkthroughStep[] = baseSteps.map((s, i) => i === currentStep ? resolveStep(s, subStepIndex) : s);

  const step = steps[currentStep];

  const findVisibleTourElement = useCallback((tourTarget: string): HTMLElement | null => {
    const els = Array.from(document.querySelectorAll(`[data-tour="${tourTarget}"]`)) as HTMLElement[];
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    // Prefer elements that are visible AND intersect the viewport
    const candidates = els.filter((el) => {
      if (el.offsetParent === null) return false;
      const style = window.getComputedStyle(el);
      if (style.visibility === "hidden" || style.display === "none" || parseFloat(style.opacity) === 0) return false;
      const r = el.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0) return false;
      // Must intersect viewport
      return r.bottom > 0 && r.right > 0 && r.top < vh && r.left < vw;
    });
    if (candidates.length > 0) {
      // Pick the one with the largest visible area in viewport
      candidates.sort((a, b) => {
        const ra = a.getBoundingClientRect();
        const rb = b.getBoundingClientRect();
        const aArea = Math.max(0, Math.min(ra.right, vw) - Math.max(ra.left, 0)) * Math.max(0, Math.min(ra.bottom, vh) - Math.max(ra.top, 0));
        const bArea = Math.max(0, Math.min(rb.right, vw) - Math.max(rb.left, 0)) * Math.max(0, Math.min(rb.bottom, vh) - Math.max(rb.top, 0));
        return bArea - aArea;
      });
      return candidates[0];
    }
    // Fallback: any element with size
    for (const el of els) {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) return el;
    }
    return null;
  }, []);

  const getUnionRect = useCallback((targets: string[]): DOMRect | null => {
    const rects: DOMRect[] = [];
    for (const t of targets) {
      const el = findVisibleTourElement(t);
      if (el) {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) rects.push(r);
      }
    }
    if (rects.length === 0) return null;
    const left = Math.min(...rects.map(r => r.left));
    const top = Math.min(...rects.map(r => r.top));
    const right = Math.max(...rects.map(r => r.right));
    const bottom = Math.max(...rects.map(r => r.bottom));
    return new DOMRect(left, top, right - left, bottom - top);
  }, [findVisibleTourElement]);

  const measureAndScroll = useCallback((tourTarget: string) => {
    const s = steps[currentStep];
    let rect: DOMRect | null = null;
    if (s?.tourTargets && s.tourTargets.length > 0) {
      rect = getUnionRect(s.tourTargets);
    } else {
      const el = findVisibleTourElement(tourTarget);
      if (el) rect = el.getBoundingClientRect();
    }
    if (!rect || rect.width <= 0 || rect.height <= 0) return false;

    if (isMobile) {
      const pad = 20;
      let desiredTop: number;
      if (step?.desktopCardPosition === "top") {
        desiredTop = window.innerHeight * 0.55;
      } else {
        desiredTop = pad + 10;
      }
      const currentTop = rect.top;
      const diff = currentTop - desiredTop;
      if (Math.abs(diff) > 30) {
        const anchorEl = findVisibleTourElement(s?.tourTargets?.[0] || tourTarget);
        const scrollContainer = anchorEl?.closest('.overflow-y-auto, .overflow-auto') || document.scrollingElement || document.documentElement;
        if (scrollContainer) scrollContainer.scrollTop += diff;
        setTimeout(() => {
          const newRect = s?.tourTargets ? getUnionRect(s.tourTargets) : findVisibleTourElement(tourTarget)?.getBoundingClientRect();
          if (newRect && newRect.width > 0 && newRect.height > 0) setHighlightRect(newRect as DOMRect);
        }, 400);
        return true;
      }
    }

    setHighlightRect(rect);
    return true;
  }, [isMobile, findVisibleTourElement, getUnionRect, currentStep, step]);

  const measureTarget = useCallback(() => {
    if (!step || !open) return;
    if (step.tourTargets && step.tourTargets.length > 0) {
      const rect = getUnionRect(step.tourTargets);
      if (rect && rect.width > 0 && rect.height > 0) setHighlightRect(rect);
      return;
    }
    const el = findVisibleTourElement(step.tourTarget);
    if (el) {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) setHighlightRect(rect);
    }
  }, [step, open, findVisibleTourElement, getUnionRect]);

  useEffect(() => {
    if (!open) return;
    const s = steps[currentStep];
    if (s?.beforeShow) s.beforeShow();
    let attempts = 0;
    const tryMeasure = () => {
      const found = measureAndScroll(s?.tourTarget || "");
      if (!found) { attempts++; if (attempts < 25) setTimeout(tryMeasure, 100); }
      else if (s?.id === "email-input") {
        // Auto-focus the input inside the highlighted container
        const el = findVisibleTourElement(s.tourTarget);
        const input = el?.querySelector("input") as HTMLInputElement | null;
        if (input) setTimeout(() => input.focus({ preventScroll: true }), 250);
      }
    };
    const timer = setTimeout(tryMeasure, 150);
    // Re-measure after card renders so centering uses real card height
    const reMeasure = setTimeout(() => measureTarget(), 500);
    return () => { clearTimeout(timer); clearTimeout(reMeasure); };
  }, [currentStep, subStepIndex, open]);

  useEffect(() => {
    if (!open) return;
    const update = () => { measureTarget(); rafRef.current = requestAnimationFrame(update); };
    const handleInteraction = () => { cancelAnimationFrame(rafRef.current); rafRef.current = requestAnimationFrame(update); };
    window.addEventListener("resize", measureTarget);
    window.addEventListener("scroll", handleInteraction, true);
    return () => { window.removeEventListener("resize", measureTarget); window.removeEventListener("scroll", handleInteraction, true); cancelAnimationFrame(rafRef.current); };
  }, [open, measureTarget]);

  const activeSequence = stepSequences[initialStep] ?? null;
  const sequenceIndex = activeSequence ? activeSequence.indexOf(currentStep) : -1;
  const displayStep = activeSequence ? Math.max(sequenceIndex, 0) + 1 : currentStep + 1;
  const totalSteps = activeSequence?.length ?? steps.length;
  const isLastStep = activeSequence ? sequenceIndex === activeSequence.length - 1 : currentStep === steps.length - 1;

  useEffect(() => {
    if (open) {
      setCurrentStep(activeSequence?.[0] ?? initialStep);
      setSubStepIndex(0);
      setHighlightRect(null);
    }
  }, [open, initialStep]);

  // Reset substep when moving between top-level steps
  useEffect(() => { setSubStepIndex(0); }, [currentStep]);

  const currentBaseStep = baseSteps[currentStep];
  const totalSubSteps = currentBaseStep?.subSteps?.length ?? 0;
  const hasMoreSubSteps = totalSubSteps > 0 && subStepIndex < totalSubSteps - 1;

  const handleClose = () => {
    setCurrentStep(activeSequence?.[0] ?? initialStep);
    (onSwitchToDefaultView || onSwitchToBrowser)?.();
    onClose();
  };

  const handleNext = () => {
    if (activeSequence) {
      if (sequenceIndex >= 0 && sequenceIndex < activeSequence.length - 1) {
        setCurrentStep(activeSequence[sequenceIndex + 1]);
        return;
      }
      handleClose();
      return;
    }

    if (currentStep < steps.length - 1) setCurrentStep(currentStep + 1);
    else handleClose();
  };

  const handlePrev = () => {
    if (activeSequence) {
      if (sequenceIndex > 0) {
        setCurrentStep(activeSequence[sequenceIndex - 1]);
      }
      return;
    }

    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  if (!step || !open) return null;

  const tightTargets = new Set(["email-input-field", "otp-code-area", "activation-code", "activation-link"]);
  const padding = tightTargets.has(step.tourTarget) ? (isMobile ? 4 : 6) : (isMobile ? 10 : 12);


  const getDesktopCardStyle = (): React.CSSProperties => {
    if (!highlightRect) return { position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
    const cardW = 380, gap = 56;
    // Use actual card height if available, otherwise estimate
    const cardH = cardRef.current?.offsetHeight || 220;
    const arrowCenterY = highlightRect.top + highlightRect.height / 2;
    const centerY = arrowCenterY - cardH / 2;
    const clampedY = Math.max(20, Math.min(centerY, window.innerHeight - cardH - 20));
    if (step.desktopCardPosition === "right") return { position: "fixed", top: clampedY, left: highlightRect.right + gap, width: cardW, maxWidth: `calc(100vw - ${highlightRect.right + gap + 20}px)` };
    if (step.desktopCardPosition === "left") return { position: "fixed", top: clampedY, right: `calc(100vw - ${highlightRect.left - gap}px)`, width: cardW, maxWidth: `${highlightRect.left - gap - 20}px` };
    if (step.desktopCardPosition === "top") return { position: "fixed", bottom: `calc(100vh - ${highlightRect.top - gap}px)`, left: Math.max(20, highlightRect.left + highlightRect.width / 2 - cardW / 2), width: cardW };
    return { position: "fixed", top: highlightRect.bottom + gap, left: Math.max(20, highlightRect.left + highlightRect.width / 2 - cardW / 2), width: cardW };
  };

  const getArrowInfo = (): { pos: React.CSSProperties; dir: string } | null => {
    if (!highlightRect || isMobile) return null;
    const gap = 12;
    if (step.desktopCardPosition === "right") return { pos: { position: "fixed", top: highlightRect.top + highlightRect.height / 2 - 16, left: highlightRect.right + gap }, dir: "right" };
    if (step.desktopCardPosition === "left") return { pos: { position: "fixed", top: highlightRect.top + highlightRect.height / 2 - 16, left: highlightRect.left - gap - 32 }, dir: "left" };
    if (step.desktopCardPosition === "top") return { pos: { position: "fixed", top: highlightRect.top - gap - 32, left: highlightRect.left + highlightRect.width / 2 - 16 }, dir: "up" };
    return { pos: { position: "fixed", top: highlightRect.bottom + gap, left: highlightRect.left + highlightRect.width / 2 - 16 }, dir: "down" };
  };

  const arrowPaths: Record<string, string> = { right: "M6 16L26 16M26 16L18 8M26 16L18 24", left: "M26 16L6 16M6 16L14 8M6 16L14 24", down: "M16 6L16 26M16 26L8 18M16 26L24 18", up: "M16 26L16 6M16 6L8 14M16 6L24 14" };
  const arrowData = getArrowInfo();

  const spotlightStyle: React.CSSProperties = highlightRect ? {
    top: highlightRect.top - padding, left: highlightRect.left - padding,
    width: highlightRect.width + padding * 2, height: highlightRect.height + padding * 2,
  } : { top: "40%", left: "40%", width: "20%", height: "20%" };

  const getMobileCardStyle = (): React.CSSProperties => {
    if (highlightRect && step.desktopCardPosition === "top") {
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
      {/* Full-screen click blocker */}
      <div style={{ position: "fixed", inset: 0, zIndex: 9999 }} onClick={handleClose} />

      {/* Spotlight with boxShadow overlay */}
      <motion.div
        key={`spotlight-${currentStep}-${subStepIndex}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        style={{
          position: "fixed",
          ...spotlightStyle,
          boxShadow: "0 0 0 9999px rgba(0,0,0,0.82)",
          border: isMobile ? "2px solid #F59E0B" : "3px solid #F59E0B",
          borderRadius: isMobile ? 12 : 16,
          pointerEvents: "none",
          zIndex: 10000,
        }}
      />

      {/* Arrow (desktop) */}
      {arrowData && highlightRect && (
        <motion.div
          key={`arrow-${currentStep}-${subStepIndex}`}
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

      {/* Instruction Card - Dark Theme */}
      {highlightRect && (
        <motion.div
          ref={cardRef}
          key={`card-${currentStep}-${subStepIndex}`}
          initial={{ opacity: 0, y: isMobile ? 20 : 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.3 }}
          style={cardStyle}
        >
          <div className="rounded-2xl shadow-2xl overflow-hidden" style={{ background: "#1E1E22", border: "1px solid rgba(255,255,255,0.08)" }}>
            {/* Header */}
            <div className="px-4 md:px-5 pt-4 md:pt-5 pb-2 md:pb-3 flex items-center gap-3">
              <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(245,158,11,0.12)" }}>
                <span className="text-amber-500">{step.icon}</span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm md:text-[15px] font-bold text-white truncate">{step.title}</h3>
                  {step.showCopyIcon && (
                    <button
                      onClick={() => navigator.clipboard.writeText("https://www.posai.com/pair")}
                      className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 transition-colors hover:bg-white/10 active:bg-white/20"
                    >
                      <Copy className="w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.55)" }} />
                    </button>
                  )}
                </div>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>{step.subtitle}</p>
              </div>
              <button
                onClick={handleClose}
                aria-label="Close"
                className="ml-auto w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors hover:bg-white/10 active:bg-white/20"
              >
                <X className="w-4 h-4" style={{ color: "rgba(255,255,255,0.55)" }} />
              </button>
            </div>

            {/* Instructions */}
            <div className="px-4 md:px-5 pb-4 md:pb-5 flex flex-col gap-1.5 md:gap-2.5">
              {step.instructions.map((inst, i) => (
                <div key={i} className="flex gap-2.5 items-start">
                  <div className="w-[6px] h-[6px] min-w-[6px] rounded-full bg-amber-500 mt-[7px]" />
                  <p className="text-xs md:text-[13px] leading-relaxed" style={{ color: "rgba(255,255,255,0.75)" }}>{inst}</p>
                </div>
              ))}
            </div>

            {/* Sub-step Next button (only when current step has remaining sub-steps) */}
            {totalSubSteps > 1 && (
              <div className="px-4 md:px-5 pb-4 md:pb-5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5">
                  {Array.from({ length: totalSubSteps }).map((_, i) => (
                    <span
                      key={i}
                      className="rounded-full transition-all"
                      style={{
                        width: i === subStepIndex ? 18 : 6,
                        height: 6,
                        background: i === subStepIndex ? "#F59E0B" : "rgba(255,255,255,0.25)",
                      }}
                    />
                  ))}
                </div>
                {hasMoreSubSteps && (
                  <button
                    onClick={() => setSubStepIndex((i) => i + 1)}
                    className="px-4 h-9 rounded-full text-xs font-semibold text-black transition-colors"
                    style={{ background: "#F59E0B" }}
                  >
                    Next
                  </button>
                )}
              </div>
            )}

            {/* Helper note callout */}
            {step.helperNote && (
              <div className="mx-4 md:mx-5 mb-4 md:mb-5 p-2.5 md:p-3 rounded-xl" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.15)" }}>
                <p className="text-[11px] md:text-xs leading-relaxed" style={{ color: "rgba(245,158,11,0.85)" }}>{step.helperNote}</p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </>
  );
};

export default DeviceSetupHelpCard;
