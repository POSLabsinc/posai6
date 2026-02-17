import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, ChevronLeft } from "lucide-react";

interface TourStep {
  targetSelector: string;
  title: string;
  description: string;
  position: "bottom" | "top" | "right" | "left";
}

const TOUR_STEPS: TourStep[] = [
  {
    targetSelector: '[data-tour="profile"]',
    title: "Your Profile",
    description: "View and manage your account details, personal info, and security settings.",
    position: "bottom",
  },
  {
    targetSelector: '[data-tour="system"]',
    title: "System Settings",
    description: "Customize appearance, themes, and control center preferences.",
    position: "bottom",
  },
  {
    targetSelector: '[data-tour="payments"]',
    title: "Payments",
    description: "Configure payment methods, taxes, discounts, gratuity, and checkout options.",
    position: "bottom",
  },
  {
    targetSelector: '[data-tour="menu"]',
    title: "Menu Management",
    description: "Organize your menu items, categories, modifiers, and product groups.",
    position: "bottom",
  },
  {
    targetSelector: '[data-tour="reports-analytics"]',
    title: "Reports & Analytics",
    description: "Access detailed sales reports and business performance analytics.",
    position: "bottom",
  },
  {
    targetSelector: '[data-tour="hardware"]',
    title: "Hardware",
    description: "Set up and manage printers, card readers, and cash registers.",
    position: "top",
  },
  {
    targetSelector: '[data-tour="support"]',
    title: "Support",
    description: "Get help, send feedback, or contact our support team anytime.",
    position: "top",
  },
];

const STORAGE_KEY = "settings-tour-completed";

interface SettingsGuidedTourProps {
  forceShow?: boolean;
}

const SettingsGuidedTour = ({ forceShow }: SettingsGuidedTourProps) => {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const observerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Always show the tour on mount
    const timer = setTimeout(() => setIsActive(true), 800);
    return () => clearTimeout(timer);
  }, [forceShow]);

  const updateTargetRect = useCallback(() => {
    if (!isActive) return;
    const step = TOUR_STEPS[currentStep];
    const el = document.querySelector(step.targetSelector);
    if (el) {
      setTargetRect(el.getBoundingClientRect());
    } else {
      setTargetRect(null);
    }
  }, [currentStep, isActive]);

  useEffect(() => {
    updateTargetRect();
    // Poll for position changes (scrolling, layout shifts)
    observerRef.current = setInterval(updateTargetRect, 200);
    window.addEventListener("resize", updateTargetRect);
    return () => {
      if (observerRef.current) clearInterval(observerRef.current);
      window.removeEventListener("resize", updateTargetRect);
    };
  }, [updateTargetRect]);

  const completeTour = useCallback(() => {
    setIsActive(false);
    localStorage.setItem(STORAGE_KEY, "true");
  }, []);

  const next = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      completeTour();
    }
  };

  const prev = () => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  };

  if (!isActive) return null;

  const step = TOUR_STEPS[currentStep];
  const isLast = currentStep === TOUR_STEPS.length - 1;
  const isFirst = currentStep === 0;

  // Calculate tooltip position
  const getTooltipStyle = (): React.CSSProperties => {
    if (!targetRect) return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };

    const pad = 14;
    const tooltipW = 300;

    switch (step.position) {
      case "bottom":
        return {
          top: targetRect.bottom + pad,
          left: Math.max(16, Math.min(targetRect.left + targetRect.width / 2 - tooltipW / 2, window.innerWidth - tooltipW - 16)),
        };
      case "top":
        return {
          bottom: window.innerHeight - targetRect.top + pad,
          left: Math.max(16, Math.min(targetRect.left + targetRect.width / 2 - tooltipW / 2, window.innerWidth - tooltipW - 16)),
        };
      case "right":
        return {
          top: targetRect.top + targetRect.height / 2 - 40,
          left: targetRect.right + pad,
        };
      case "left":
        return {
          top: targetRect.top + targetRect.height / 2 - 40,
          right: window.innerWidth - targetRect.left + pad,
        };
    }
  };

  // Arrow pointing to the target
  const getArrowStyle = (): React.CSSProperties & { arrowDir: string } => {
    if (!targetRect) return { arrowDir: "none" } as React.CSSProperties & { arrowDir: string };
    const centerX = targetRect.left + targetRect.width / 2;

    switch (step.position) {
      case "bottom":
        return { position: "absolute" as const, top: -8, left: centerX - (getTooltipStyle().left as number) - 0, arrowDir: "up" };
      case "top":
        return { position: "absolute" as const, bottom: -8, left: centerX - (getTooltipStyle().left as number) - 0, arrowDir: "down" };
      default:
        return { arrowDir: "none" } as React.CSSProperties & { arrowDir: string };
    }
  };

  const arrowInfo = getArrowStyle();
  const arrowDir = arrowInfo.arrowDir;

  return (
    <AnimatePresence>
      {isActive && (
        <div className="fixed inset-0 z-[9999]" style={{ pointerEvents: "auto" }}>
          {/* Overlay with cutout */}
          <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: "none" }}>
            <defs>
              <mask id="tour-mask">
                <rect x="0" y="0" width="100%" height="100%" fill="white" />
                {targetRect && (
                  <rect
                    x={targetRect.left - 8}
                    y={targetRect.top - 6}
                    width={targetRect.width + 16}
                    height={targetRect.height + 12}
                    rx="16"
                    fill="black"
                  />
                )}
              </mask>
            </defs>
            <rect
              x="0"
              y="0"
              width="100%"
              height="100%"
              className="fill-black/25 dark:fill-black/35"
              mask="url(#tour-mask)"
            />
          </svg>

          {/* Highlight ring */}
          {targetRect && (
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="absolute rounded-2xl"
              style={{
                top: targetRect.top - 8,
                left: targetRect.left - 10,
                width: targetRect.width + 20,
                height: targetRect.height + 16,
                pointerEvents: "none",
                border: "1.5px solid rgba(255,255,255,0.15)",
                boxShadow: [
                  "0 0 0 1px rgba(255,255,255,0.06)",
                  "0 12px 40px -8px rgba(0,0,0,0.45)",
                  "0 4px 16px -2px rgba(0,0,0,0.25)",
                  "0 0 30px 2px rgba(255,255,255,0.04)",
                  "inset 0 1px 0 rgba(255,255,255,0.12)",
                  "inset 0 -1px 0 rgba(0,0,0,0.15)",
                ].join(", "),
                background: "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.01) 50%, rgba(0,0,0,0.02) 100%)",
                backdropFilter: "brightness(1.08)",
              }}
            />
          )}

          {/* Click blocker */}
          <div className="absolute inset-0" onClick={completeTour} />

          {/* Tooltip */}
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: step.position === "top" ? 10 : -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="absolute z-10 w-[300px] bg-neutral-900 dark:bg-neutral-800 border border-neutral-700/60 rounded-2xl p-5 shadow-2xl"
            style={{ ...getTooltipStyle(), pointerEvents: "auto" }}
          >
            {/* Arrow */}
            {targetRect && arrowDir === "up" && (
              <div
                className="absolute -top-2 w-4 h-4 bg-neutral-900 dark:bg-neutral-800 border-l border-t border-neutral-700/60 rotate-45"
                style={{
                  left: Math.min(
                    Math.max(20, targetRect.left + targetRect.width / 2 - (getTooltipStyle().left as number)),
                    260
                  ),
                }}
              />
            )}
            {targetRect && arrowDir === "down" && (
              <div
                className="absolute -bottom-2 w-4 h-4 bg-neutral-900 dark:bg-neutral-800 border-r border-b border-neutral-700/60 rotate-45"
                style={{
                  left: Math.min(
                    Math.max(20, targetRect.left + targetRect.width / 2 - (getTooltipStyle().left as number)),
                    260
                  ),
                }}
              />
            )}

            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-semibold text-white">{step.title}</h3>
              <button
                onClick={completeTour}
                className="w-7 h-7 rounded-full bg-neutral-700/60 flex items-center justify-center hover:bg-neutral-600/60 transition-colors"
              >
                <X className="w-3.5 h-3.5 text-neutral-300" />
              </button>
            </div>

            <p className="text-sm text-neutral-400 leading-relaxed mb-4">{step.description}</p>

            {/* Footer */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {TOUR_STEPS.map((_, i) => (
                  <div
                    key={i}
                    className={`rounded-full transition-all duration-300 ${
                      i === currentStep
                        ? "w-5 h-2 bg-primary"
                        : i < currentStep
                        ? "w-2 h-2 bg-neutral-500"
                        : "w-2 h-2 bg-neutral-700"
                    }`}
                  />
                ))}
              </div>

              <div className="flex items-center gap-2">
                {!isFirst && (
                  <button
                    onClick={prev}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-neutral-700/50 text-sm text-neutral-300 hover:bg-neutral-700 transition-colors"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    Back
                  </button>
                )}
                {isFirst && (
                  <button
                    onClick={completeTour}
                    className="px-3 py-1.5 rounded-full text-sm text-neutral-400 hover:text-neutral-200 transition-colors"
                  >
                    Skip
                  </button>
                )}
                <button
                  onClick={next}
                  className="flex items-center gap-1 px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  {isLast ? "Done" : "Next"}
                  {!isLast && <ChevronRight className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default SettingsGuidedTour;
