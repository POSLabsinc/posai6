import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  UtensilsCrossed,
  ShoppingBag,
  Store,
  Sparkles,
  HeartPulse,
  Activity,
  Briefcase,
  LayoutGrid,
} from "lucide-react";
import { useIsLandscape } from "@/hooks/use-landscape";

type BusinessOption = {
  id: string;
  label: string;
  icon: React.ReactNode;
  value: string;
};

const OPTIONS: BusinessOption[] = [
  {
    id: "food",
    label: "Food / drink",
    icon: <UtensilsCrossed className="w-5 h-5" />,
    value: "food",
  },
  {
    id: "retail",
    label: "Retail goods",
    icon: <ShoppingBag className="w-5 h-5" />,
    value: "retail",
  },
  {
    id: "grocery",
    label: "Grocery / gourmet / alcohol",
    icon: <Store className="w-5 h-5" />,
    value: "grocery",
  },
  {
    id: "beauty",
    label: "Beauty / wellness",
    icon: <Sparkles className="w-5 h-5" />,
    value: "beauty",
  },
  {
    id: "healthcare",
    label: "Healthcare services",
    icon: <HeartPulse className="w-5 h-5" />,
    value: "healthcare",
  },
  {
    id: "sports",
    label: "Sports / fitness",
    icon: <Activity className="w-5 h-5" />,
    value: "sports",
  },
  {
    id: "services",
    label: "Services",
    icon: <Briefcase className="w-5 h-5" />,
    value: "services",
  },
  {
    id: "other",
    label: "Other",
    icon: <LayoutGrid className="w-5 h-5" />,
    value: "other",
  },
];

type LocationState = {
  place?: { name: string; address: string } | null;
  email?: string;
  country?: string;
  intent?: "signup_org" | "signup_demo" | "upgrade_email";
  demo?: boolean;
};

const OnboardingAppSignupBusinessType = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isLandscape = useIsLandscape();
  const incoming = (location.state as LocationState) ?? {};
  const [selected, setSelected] = useState<string | null>(null);

  const handleBack = () => {
    navigate("/onboarding/app/signup/verify");
  };

  const handleSkip = () => {
    navigate("/onboarding/app/signup/lookup", {
      state: { ...incoming, businessType: "other" },
    });
  };

  const handleNext = () => {
    if (!selected) return;
    navigate("/onboarding/app/signup/lookup", {
      state: { ...incoming, businessType: selected },
    });
  };

  const backBtn = (
    <button
      onClick={handleBack}
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
      <div className="h-1 flex-1 rounded-full bg-primary/40" />
      <div className="h-1 flex-1 rounded-full bg-foreground/[0.08]" />
      <div className="h-1 flex-1 rounded-full bg-foreground/[0.08]" />
    </div>
  );

  const eyebrow = (
    <p className="text-[11px] font-semibold tracking-[0.14em] uppercase text-primary">
      Step 3
    </p>
  );

  const title = (
    <h1 className="text-2xl font-bold text-foreground mt-2">
      What do you sell?
    </h1>
  );

  const subtitle = (
    <p className="text-sm text-foreground/60 mt-2">
      This helps us personalise your setup.
    </p>
  );

  const optionsList = (
    <div className="grid grid-cols-2 gap-3">
      {OPTIONS.map((option) => {
        const isSelected = selected === option.value;
        return (
          <button
            key={option.id}
            onClick={() => setSelected(option.value)}
            className={`flex flex-col items-center justify-center gap-2 px-3 py-5 rounded-2xl border text-center transition-colors min-h-[96px] ${
              isSelected
                ? "border-primary bg-primary/[0.08]"
                : "border-foreground/[0.08] bg-foreground/[0.04] active_skill active:bg-foreground/[0.06]"
            }`}
          >
            <span className={isSelected ? "text-primary" : "text-foreground/60"}>
              {option.icon}
            </span>
            <span className="text-xs font-medium text-foreground leading-tight">
              {option.label}
            </span>
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

export default OnboardingAppSignupBusinessType;
