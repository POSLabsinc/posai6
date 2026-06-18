import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ChevronLeft, Check } from "lucide-react";
import { useIsLandscape } from "@/hooks/use-landscape";

const REVENUE_OPTIONS = [
  { id: "<100k", label: "Less than $100k" },
  { id: "100k-250k", label: "$100k - $250k" },
  { id: "250k-1m", label: "$250k - $1M" },
  { id: "1m-5m", label: "$1M - $5M" },
  { id: "5m+", label: "$5M+" },
];

const OnboardingAppSignupRevenue = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isLandscape = useIsLandscape();

  const [selected, setSelected] = useState<string | null>(null);

  const goBack = () =>
    navigate("/onboarding/app/signup/profile", { state: location.state });

  const goNext = () =>
    navigate("/onboarding/app/signup/mode", {
      state: { ...(location.state as object), revenue: selected },
    });

  const backBtn = (
    <button
      onClick={goBack}
      className="w-10 h-10 rounded-full bg-neutral-800/60 flex items-center justify-center active:opacity-70 transition-opacity"
      aria-label="Back"
    >
      <ChevronLeft className="w-5 h-5 text-foreground" />
    </button>
  );

  const skipBtn = (
    <button
      onClick={goNext}
      className="text-sm font-medium text-primary active:opacity-70 transition-opacity px-2 py-1"
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
    <div className="flex items-center gap-2 mt-5">
      <p className="text-[11px] font-semibold tracking-[0.14em] uppercase text-primary">
        Step 4
      </p>
      <span className="px-2 py-0.5 rounded-md border border-foreground/[0.08] bg-foreground/[0.04] text-[10px] font-medium text-foreground/60 uppercase tracking-wide">
        Optional
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
    <div className="flex flex-col gap-2.5 mt-6">
      {REVENUE_OPTIONS.map((opt) => {
        const active = selected === opt.id;
        return (
          <button
            key={opt.id}
            onClick={() => setSelected(opt.id)}
            className={`w-full min-h-[52px] flex items-center justify-between px-4 py-3 rounded-2xl border transition-all active:opacity-80 ${
              active
                ? "border-primary bg-primary/[0.08]"
                : "border-foreground/[0.08] bg-foreground/[0.04]"
            }`}
          >
            <span className="text-sm font-medium text-foreground">
              {opt.label}
            </span>
            {active && <Check className="w-4 h-4 text-primary" />}
          </button>
        );
      })}
    </div>
  );

  const ctaButton = (
    <button
      onClick={goNext}
      disabled={!selected}
      className="w-full min-h-[44px] py-3 rounded-2xl text-sm font-semibold bg-primary text-primary-foreground active:opacity-80 transition-opacity disabled:opacity-40 disabled:pointer-events-none"
    >
      Continue
    </button>
  );

  const topRow = (
    <div className="flex items-center justify-between">
      {backBtn}
      {skipBtn}
    </div>
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
            {topRow}
            <div className="mt-6">{progressBar}</div>
            {eyebrow}
            {title}
            {subtitle}
            <div className="flex-1" />
            <div style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}>
              {ctaButton}
            </div>
          </div>
          <div
            className="flex flex-col px-6 py-6 flex-1 min-h-0 overflow-y-auto"
            style={{ width: "55%" }}
          >
            {optionsList}
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
        style={{
          paddingTop: "max(1.5rem, env(safe-area-inset-top))",
        }}
      >
        {topRow}
        <div className="mt-5">{progressBar}</div>
        {eyebrow}
        {title}
        {subtitle}
        <div className="flex-1 overflow-y-auto mt-6 -mx-6 px-6">
          {optionsList}
          <div className="h-4" />
        </div>
        <div
          className="pt-3"
          style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
        >
          {ctaButton}
        </div>
      </div>
    </div>
  );
};

export default OnboardingAppSignupRevenue;
