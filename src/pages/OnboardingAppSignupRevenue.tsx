import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { useIsLandscape } from "@/hooks/use-landscape";

const REVENUE_OPTIONS = [
  "Less than $100k",
  "$100k - $250k",
  "$250k - $1M",
  "$1M - $5M",
  "$5M+",
];

const OnboardingAppSignupRevenue = () => {
  const navigate = useNavigate();
  const isLandscape = useIsLandscape();
  const [selected, setSelected] = useState<string | null>(null);

  const handleNext = () => {
    if (!selected) return;
    navigate("/onboarding/app/signup/mode", {
      state: { revenue: selected },
    });
  };

  const handleSkip = () => {
    navigate("/onboarding/app/signup/mode");
  };

  const backBtn = (
    <button
      onClick={() => navigate("/onboarding/app/signup/profile")}
      className="w-10 h-10 rounded-full bg-neutral-800/60 flex items-center justify-center active:opacity-70 transition-opacity"
      aria-label="Back"
    >
      <ChevronLeft className="w-5 h-5 text-foreground" />
    </button>
  );

  const skipLink = (
    <button
      onClick={handleSkip}
      className="text-sm font-medium text-primary hover:opacity-80 transition-opacity"
    >
      Skip
    </button>
  );

  const progressBar = (
    <div className="flex items-center gap-1.5 w-full">
      <div className="h-1 flex-1 rounded-full bg-primary" />
      <div className="h-1 flex-1 rounded-full bg-primary" />
      <div className="h-1 flex-1 rounded-full bg-primary" />
      <div className="h-1 flex-1 rounded-full bg-primary" />
      <div className="h-1 flex-1 rounded-full bg-primary/40" />
    </div>
  );

  const eyebrow = (
    <div className="flex items-center gap-2">
      <p className="text-[11px] font-semibold tracking-[0.14em] uppercase text-primary">
        Step 4
      </p>
      <span className="px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-foreground/[0.06] text-foreground/50">
        optional
      </span>
    </div>
  );

  const title = (
    <h1 className="text-2xl font-bold text-foreground mt-2">
      What's your annual revenue?
    </h1>
  );

  const subtitle = (
    <p className="text-sm text-foreground/60 mt-2">
      Helps us recommend the right plan for your business.
    </p>
  );

  const optionsList = (
    <div className="flex flex-col gap-2">
      {REVENUE_OPTIONS.map((option) => {
        const isSelected = selected === option;
        return (
          <button
            key={option}
            onClick={() => setSelected(option)}
            className={`w-full text-left px-4 py-3 rounded-2xl border text-sm font-medium transition-colors ${
              isSelected
                ? "border-primary bg-primary/[0.08] text-foreground"
                : "border-foreground/[0.08] bg-foreground/[0.04] text-foreground active:bg-foreground/[0.06]"
            }`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );

  const ctaButton = (
    <button
      onClick={handleNext}
      disabled={!selected}
      className="w-full min-h-[44px] py-3 rounded-2xl text-sm font-semibold bg-primary text-primary-foreground active:opacity-80 transition-opacity disabled:opacity-40 disabled:pointer-events-none"
    >
      Next
    </button>
  );

  if (isLandscape) {
    return (
      <div className="fixed inset-0 login-bg overflow-hidden">
        <div className="absolute inset-0 gradient-mesh opacity-30 pointer-events-none" />
        <div
          className="relative z-10 flex h-full w-full"
          style={{
            paddingLeft: "env(safe-area-inset-left)",
            paddingRight: "env(safe-area-inset-right)",
          }}
        >
          <div
            className="flex flex-col px-6 py-6 border-r border-foreground/[0.08]"
            style={{ width: "45%" }}
          >
            <div className="flex items-center justify-between">
              {backBtn}
              {skipLink}
            </div>
            <div className="mt-6">{progressBar}</div>
            <div className="mt-5">
              {eyebrow}
              {title}
              {subtitle}
            </div>
            <div className="flex-1" />
            <div
              className="pt-4"
              style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
            >
              {ctaButton}
            </div>
          </div>
          <div
            className="flex flex-col px-6 py-6 flex-1 min-h-0"
            style={{ width: "55%" }}
          >
            <div className="flex-1 overflow-y-auto flex flex-col justify-center">
              {optionsList}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 login-bg flex flex-col overflow-hidden">
      <div className="absolute inset-0 gradient-mesh opacity-30 pointer-events-none" />
      <div
        className="relative z-10 flex flex-col h-full w-full max-w-md mx-auto px-6"
        style={{ paddingTop: "max(1.5rem, env(safe-area-inset-top))" }}
      >
        <div className="flex items-center justify-between mb-5">
          {backBtn}
          {skipLink}
        </div>
        {progressBar}
        <div className="mt-5">
          {eyebrow}
          {title}
          {subtitle}
        </div>
        <div className="flex-1 overflow-y-auto mt-6 pb-4">
          {optionsList}
        </div>
        <div
          className="pt-2"
          style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
        >
          {ctaButton}
        </div>
      </div>
    </div>
  );
};

export default OnboardingAppSignupRevenue;
