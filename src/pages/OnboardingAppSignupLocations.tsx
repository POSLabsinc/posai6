import { useState } from "react";
import MarketingPanel from "@/components/onboarding/MarketingPanel";
import { useLocation, useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { useIsLandscape } from "@/hooks/use-landscape";

const LOCATION_OPTIONS = [
  { id: "1", label: "1 location", caption: "Single venue" },
  { id: "2-5", label: "2 to 5", caption: "Small group" },
  { id: "6-20", label: "6 to 20", caption: "Growing chain" },
  { id: "21+", label: "21 plus", caption: "Enterprise" },
];

const OnboardingAppSignupLocations = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isLandscape = useIsLandscape();
  const incoming = (location.state as Record<string, unknown>) ?? {};
  const [selected, setSelected] = useState<string | null>(
    (incoming.locationCount as string) ?? null,
  );

  const handleNext = () => {
    if (!selected) return;
    navigate("/onboarding/app/signup/revenue", {
      state: { ...incoming, locationCount: selected },
    });
  };

  const handleSkip = () => {
    navigate("/onboarding/app/signup/revenue", {
      state: { ...incoming, locationCount: "1" },
    });
  };

  const backBtn = (
    <button
      onClick={() => navigate("/onboarding/app/signup/type", { state: incoming })}
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
      <div className="h-1 flex-1 rounded-full bg-primary/40" />
      <div className="h-1 flex-1 rounded-full bg-primary/40" />
    </div>
  );

  const eyebrow = (
    <p className="text-[11px] font-semibold tracking-[0.14em] uppercase text-primary">
      Step 3
    </p>
  );

  const title = (
    <h1 className="text-2xl font-bold text-foreground mt-2">
      How many locations do you operate?
    </h1>
  );

  const subtitle = (
    <p className="text-sm text-foreground/60 mt-0.5">
      We will scale your setup to fit how many venues you run.
    </p>
  );

  const optionsList = (
    <div className="flex flex-col gap-2">
      {LOCATION_OPTIONS.map((option) => {
        const isSelected = selected === option.id;
        return (
          <button
            key={option.id}
            onClick={() => setSelected(option.id)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl border text-left transition-colors ${
              isSelected
                ? "border-primary bg-primary/[0.08]"
                : "border-foreground/[0.08] bg-foreground/[0.04] active:bg-foreground/[0.06]"
            }`}
          >
            <span className="text-sm font-medium text-foreground">
              {option.label}
            </span>
            <span className="text-xs text-foreground/50">{option.caption}</span>
          </button>
        );
      })}
    </div>
  );

  const ctaButton = (
    <button
      onClick={handleNext}
      disabled={!selected}
      className="w-full min-h-[44px] py-3 rounded-full text-sm font-semibold bg-primary text-primary-foreground active:opacity-80 transition-opacity disabled:opacity-40 disabled:pointer-events-none"
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
            className="flex flex-col border-r border-foreground/[0.08]"
            style={{ width: "45%" }}
          >
            <MarketingPanel
              eyebrow="Locations"
              caption="Used to provision menus, pricing rules and reporting roll-ups across venues."
            />
          </div>
          <div
            className="flex flex-col px-6 py-6 flex-1 min-h-0"
            style={{ width: "55%" }}
          >
            <div className="flex items-center justify-between">
              {backBtn}
              {skipLink}
            </div>
            <div className="mt-4">{progressBar}</div>
            <div className="mt-5">
              {eyebrow}
              {title}
              {subtitle}
            </div>
            <div className="flex-1 overflow-y-auto mt-5 pb-4">{optionsList}</div>
            <div
              className="pt-2"
              style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
            >
              {ctaButton}
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
        <div className="flex-1 overflow-y-auto mt-6 pb-4">{optionsList}</div>
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

export default OnboardingAppSignupLocations;
