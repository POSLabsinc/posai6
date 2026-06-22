import { useState } from "react";
import MarketingPanel from "@/components/onboarding/MarketingPanel";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  Coffee,
  Zap,
  Truck,
  Croissant,
  CloudSun,
  ChefHat,
  Utensils,
  Wine,
  Store,
  LayoutGrid,
} from "lucide-react";
import { useIsLandscape } from "@/hooks/use-landscape";

type TypeOption = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const OPTIONS: TypeOption[] = [
  { id: "cafe", label: "Cafe", icon: Coffee },
  { id: "quick_service", label: "Quick Service", icon: Zap },
  { id: "food_truck", label: "Food Truck", icon: Truck },
  { id: "bakery", label: "Bakery", icon: Croissant },
  { id: "cloud_kitchen", label: "Cloud Kitchen", icon: CloudSun },
  { id: "full_service", label: "Full Service", icon: ChefHat },
  { id: "fine_dining", label: "Fine Dining", icon: Utensils },
  { id: "bar_pub", label: "Bar and Pub", icon: Wine },
  { id: "food_court", label: "Food Court", icon: Store },
  { id: "other", label: "Other", icon: LayoutGrid },
];

const OnboardingAppSignupRestaurantType = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isLandscape = useIsLandscape();
  const incoming = (location.state as Record<string, unknown>) ?? {};
  const [selected, setSelected] = useState<string | null>(
    (incoming.restaurantType as string) ?? null,
  );

  const handleNext = () => {
    if (!selected) return;
    navigate("/onboarding/app/signup/locations", {
      state: { ...incoming, restaurantType: selected },
    });
  };

  const handleSkip = () => {
    navigate("/onboarding/app/signup/locations", {
      state: { ...incoming, restaurantType: "other" },
    });
  };

  const backBtn = (
    <button
      onClick={() => navigate("/onboarding/app/signup/verify")}
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
      <div className="h-1 flex-1 rounded-full bg-primary/40" />
      <div className="h-1 flex-1 rounded-full bg-primary/40" />
    </div>
  );

  const eyebrow = (
    <p className="text-[11px] font-semibold tracking-[0.14em] uppercase text-primary">
      Step 2
    </p>
  );

  const title = (
    <h1 className="text-2xl font-bold text-foreground mt-2">
      What type of restaurant?
    </h1>
  );

  const subtitle = (
    <p className="text-sm text-foreground/60 mt-0.5">
      We use this to recommend the right Point of Sale mode for you.
    </p>
  );

  const optionsGrid = (
    <div className="grid grid-cols-2 gap-2">
      {OPTIONS.map((option) => {
        const Icon = option.icon;
        const isSelected = selected === option.id;
        return (
          <button
            key={option.id}
            onClick={() => setSelected(option.id)}
            className={`flex flex-col items-start gap-2 p-3 rounded-2xl border text-left transition-colors ${
              isSelected
                ? "border-primary bg-primary/[0.08]"
                : "border-foreground/[0.08] bg-foreground/[0.04] active:bg-foreground/[0.06]"
            }`}
          >
            <span
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                isSelected
                  ? "bg-primary/15 text-primary"
                  : "bg-foreground/[0.06] text-foreground/70"
              }`}
            >
              <Icon className="w-5 h-5" />
            </span>
            <span className="text-sm font-medium text-foreground">
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
            className="flex flex-col border-r border-foreground/[0.08]"
            style={{ width: "45%" }}
          >
            <MarketingPanel
              eyebrow="Restaurant type"
              caption="Tells the setup which workflows, layouts and defaults to enable."
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
            <div className="flex-1 overflow-y-auto mt-5 pb-4">{optionsGrid}</div>
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
        <div className="flex-1 overflow-y-auto mt-6 pb-4">{optionsGrid}</div>
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

export default OnboardingAppSignupRestaurantType;
