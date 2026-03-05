import { useState, useEffect } from "react";
import { Check, Loader2 } from "lucide-react";

interface StoreSwitchProcessingScreenProps {
  isOpen: boolean;
  onComplete: () => void;
}

const steps = [
  "Clearing device data",
  "Syncing store configuration",
  "Preparing device…",
];

const StoreSwitchProcessingScreen = ({ isOpen, onComplete }: StoreSwitchProcessingScreenProps) => {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(0);
      return;
    }

    const timers: ReturnType<typeof setTimeout>[] = [];

    steps.forEach((_, index) => {
      timers.push(
        setTimeout(() => {
          setCurrentStep(index + 1);
        }, (index + 1) * 1000)
      );
    });

    // Final completion
    timers.push(
      setTimeout(() => {
        onComplete();
      }, (steps.length + 1) * 1000)
    );

    return () => timers.forEach(clearTimeout);
  }, [isOpen, onComplete]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4">
      <div className="flex flex-col items-center max-w-xs w-full">
        {/* Spinner */}
        <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-6">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>

        <h3 className="text-foreground font-bold text-xl mb-6">Switching Store</h3>

        {/* Steps */}
        <div className="w-full space-y-3">
          {steps.map((step, index) => {
            const isDone = currentStep > index;
            const isActive = currentStep === index;
            return (
              <div
                key={step}
                className={`flex items-center gap-3 transition-opacity duration-300 ${
                  isDone || isActive ? "opacity-100" : "opacity-30"
                }`}
              >
                {isDone ? (
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                ) : isActive ? (
                  <div className="w-6 h-6 flex items-center justify-center shrink-0">
                    <Loader2 className="w-4 h-4 text-primary animate-spin" />
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full bg-neutral-800 border border-neutral-700 shrink-0" />
                )}
                <span
                  className={`text-sm font-medium ${
                    isDone
                      ? "text-emerald-400"
                      : isActive
                        ? "text-foreground"
                        : "text-neutral-600"
                  }`}
                >
                  {step}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default StoreSwitchProcessingScreen;
