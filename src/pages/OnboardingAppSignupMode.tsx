import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, LayoutGrid, Zap, ChefHat } from "lucide-react";
import { useIsLandscape } from "@/hooks/use-landscape";

type Mode = {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  route: string;
};

const MODES: Mode[] = [
  {
    id: "standard",
    title: "Standard",
    description: "Take payments quickly with a flexible setup.",
    icon: <LayoutGrid className="w-5 h-5" />,
    route: "/onboarding/app/signup/mode/standard",
  },
  {
    id: "quickservice",
    title: "Quick Service",
    description: "Speed up orders with multi-channel menus.",
    icon: <Zap className="w-5 h-5" />,
    route: "/onboarding/app/signup/mode/quickservice",
  },
  {
    id: "fullservice",
    title: "Full Service",
    description: "Open checks, coursing, and floor plans.",
    icon: <ChefHat className="w-5 h-5" />,
    route: "/onboarding/app/signup/mode/fullservice",
  },
];

type LocationState = {
  selectedMode?: string;
  revenue?: string;
};

const OnboardingAppSignupMode = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isLandscape = useIsLandscape();
  const incoming = (location.state as LocationState) ?? {};
  const [selected, setSelected] = useState<string | null>(incoming.selectedMode ?? null);

  const handleBack = () => {
    navigate("/onboarding/app/signup/revenue");
  };

  const handleModeTap = (mode: Mode) => {
    navigate(mode.route, { state: { ...incoming, fromMode: true } });
  };

  const handleCta = () => {
    if (!selected) return;
    navigate("/onboarding/app/signup/trial", {
      state: { ...incoming, mode: selected },
    });
  };

  const selectedMode = MODES.find((m) => m.id === selected);
  const ctaLabel = selectedMode ? `Use ${selectedMode.title}` : "Select a mode";

  const backBtn = (
    <button
      onClick={handleBack}
      className="w-10 h-10 rounded-full bg-neutral-800/60 flex items-center justify-center active:opacity-70 transition-opacity"
      aria-label="Back"
    >
      <ChevronLeft className="w-5 h-5 text-foreground" />
    </button>
  );

  const topLabel = (
    <span className="text-sm font-medium text-primary">Based on what you sell</span>
  );

  const title = (
    <h1 className="text-2xl font-bold text-foreground mt-2">Select a mode</h1>
  );

  const subtitle = (
    <p className="text-sm text-foreground/60 mt-1">
      Choose how this Point of Sale works. You can change this anytime.
    </p>
  );

  const modeList = (
    <div className="flex flex-col gap-2">
      {MODES.map((mode) => {
        const isSelected = selected === mode.id;
        return (
          <button
            key={mode.id}
            onClick={() => handleModeTap(mode)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border text-left transition-colors ${
              isSelected
                ? "border-primary bg-primary/[0.08]"
                : "border-foreground/[0.08] bg-foreground/[0.04] active:bg-foreground/[0.06]"
            }`}
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                isSelected ? "bg-primary/15 text-primary" : "bg-foreground/[0.06] text-foreground/60"
              }`}
            >
              {mode.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold ${isSelected ? "text-foreground" : "text-foreground"}`}>
                {mode.title}
              </p>
              <p className="text-xs text-foreground/60 mt-0.5">{mode.description}</p>
            </div>
            <ChevronRight className={`w-4 h-4 flex-shrink-0 ${isSelected ? "text-primary" : "text-foreground/40"}`} />
          </button>
        );
      })}
    </div>
  );

  const ctaButton = (
    <button
      onClick={handleCta}
      disabled={!selected}
      className="w-full min-h-[44px] py-3 rounded-2xl text-sm font-semibold bg-primary text-primary-foreground active:opacity-80 transition-opacity disabled:opacity-40 disabled:pointer-events-none"
    >
      {ctaLabel}
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
              {topLabel}
            </div>
            <div className="mt-5">
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
              {modeList}
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
          {topLabel}
        </div>
        <div>
          {title}
          {subtitle}
        </div>
        <div className="flex-1 overflow-y-auto mt-6 pb-4">
          {modeList}
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

export default OnboardingAppSignupMode;
