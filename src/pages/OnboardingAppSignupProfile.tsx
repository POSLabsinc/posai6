import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  ChevronDown,
  Check,
  X,
  ChefHat,
  Footprints,
  Truck,
  Coffee,
  Pizza,
  Store,
  Cookie,
  Wine,
  Home,
} from "lucide-react";
import { useIsLandscape } from "@/hooks/use-landscape";

type RestaurantType = {
  id: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
};

const ALL_TYPES: RestaurantType[] = [
  { id: "full_service", label: "Full Service", Icon: ChefHat },
  { id: "quick_service", label: "Quick Service", Icon: Footprints },
  { id: "food_truck", label: "Food Truck", Icon: Truck },
  { id: "cafe", label: "Café", Icon: Coffee },
  { id: "pizza", label: "Pizza", Icon: Pizza },
  { id: "food_court", label: "Food Court", Icon: Store },
  { id: "bakery", label: "Bakery", Icon: Cookie },
  { id: "bar_pub", label: "Bar / Pub", Icon: Wine },
  { id: "cloud_kitchen", label: "Cloud Kitchen", Icon: Home },
];

const DEFAULT_VISIBLE = ["full_service", "quick_service", "food_truck"];

const LOCATION_OPTIONS = [
  { id: "1", label: "1 location" },
  { id: "2-5", label: "2 – 5 locations" },
  { id: "6-10", label: "6 – 10 locations" },
  { id: "10+", label: "10+ locations" },
];

const OnboardingAppSignupProfile = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isLandscape = useIsLandscape();

  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedLocations, setSelectedLocations] = useState<string | null>(null);
  const [typeSheet, setTypeSheet] = useState(false);
  const [locSheet, setLocSheet] = useState(false);

  const fourthChip = useMemo(() => {
    if (selectedType && !DEFAULT_VISIBLE.includes(selectedType)) {
      return ALL_TYPES.find((t) => t.id === selectedType) ?? null;
    }
    return null;
  }, [selectedType]);

  const visibleTypes = useMemo(() => {
    return DEFAULT_VISIBLE.map((id) => ALL_TYPES.find((t) => t.id === id)!);
  }, []);

  const goBack = () =>
    navigate("/onboarding/app/signup/verify", { state: location.state });
  const goNext = () =>
    navigate("/onboarding/app/signup/welcome", {
      state: { ...(location.state as object), restaurantType: selectedType, locations: selectedLocations },
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
      <div className="h-1 flex-1 rounded-full bg-primary/40" />
      <div className="h-1 flex-1 rounded-full bg-foreground/[0.08]" />
    </div>
  );

  const eyebrow = (
    <div className="flex items-center gap-2 mt-5">
      <p className="text-[11px] font-semibold tracking-[0.14em] uppercase text-primary">
        Step 3
      </p>
      <span className="px-2 py-0.5 rounded-md border border-foreground/[0.08] bg-foreground/[0.04] text-[10px] font-medium text-foreground/60 uppercase tracking-wide">
        Optional
      </span>
    </div>
  );

  const title = (
    <h1 className="text-2xl font-bold text-foreground mt-2">Your business</h1>
  );

  const subtitle = (
    <p className="text-sm text-foreground/60 mt-2">
      Helps us configure your menu and kitchen routing.
    </p>
  );

  const sectionLabel = (text: string) => (
    <p className="text-[11px] font-semibold tracking-[0.14em] uppercase text-foreground/50">
      {text}
    </p>
  );

  const renderChip = (
    type: RestaurantType,
    opts?: { onClick?: () => void }
  ) => {
    const active = selectedType === type.id;
    const { Icon } = type;
    return (
      <button
        key={type.id}
        onClick={opts?.onClick ?? (() => setSelectedType(type.id))}
        className={`min-h-[88px] flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border transition-all active:opacity-80 ${
          active
            ? "border-primary bg-primary/[0.08]"
            : "border-foreground/[0.08] bg-foreground/[0.04]"
        }`}
      >
        <Icon className={`w-6 h-6 ${active ? "text-primary" : "text-foreground/80"}`} />
        <span className="text-xs font-medium text-foreground">{type.label}</span>
      </button>
    );
  };

  const moreChip = (
    <button
      onClick={() => setTypeSheet(true)}
      className="min-h-[88px] flex items-center justify-center p-3 rounded-2xl border border-dashed border-foreground/[0.18] bg-foreground/[0.02] active:opacity-80 transition-all"
    >
      <span className="text-xs font-semibold text-primary">+6 more</span>
    </button>
  );

  const typeGrid = (
    <div className="grid grid-cols-2 gap-3 mt-3">
      {visibleTypes.map((t) => renderChip(t))}
      {fourthChip ? renderChip(fourthChip) : moreChip}
    </div>
  );

  const locationsField = (
    <button
      onClick={() => setLocSheet(true)}
      className="w-full min-h-[44px] flex items-center justify-between px-4 py-3 mt-3 rounded-2xl border border-foreground/[0.08] bg-foreground/[0.04] active:opacity-80 transition-all"
    >
      <span
        className={`text-sm ${
          selectedLocations ? "text-foreground font-medium" : "text-foreground/40"
        }`}
      >
        {selectedLocations
          ? LOCATION_OPTIONS.find((l) => l.id === selectedLocations)?.label
          : "Select…"}
      </span>
      <ChevronDown className="w-4 h-4 text-foreground/40" />
    </button>
  );

  const ctaButton = (
    <button
      onClick={goNext}
      disabled={!selectedType}
      className="w-full min-h-[44px] py-3 rounded-2xl text-sm font-semibold bg-primary text-primary-foreground active:opacity-80 transition-opacity disabled:opacity-40 disabled:pointer-events-none"
    >
      Continue
    </button>
  );

  const typeBottomSheet = typeSheet && (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" onClick={() => setTypeSheet(false)}>
      <div className="absolute inset-0 bg-black/60" />
      <div
        className="relative bg-[#1c1c1c] rounded-t-3xl px-5 pt-3 pb-6"
        style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 rounded-full bg-foreground/20 mx-auto" />
        <div className="flex items-center justify-between mt-4">
          <h3 className="text-base font-semibold text-foreground">All restaurant types</h3>
          <button
            onClick={() => setTypeSheet(false)}
            className="w-8 h-8 rounded-full flex items-center justify-center active:opacity-70"
            aria-label="Close"
          >
            <X className="w-4 h-4 text-foreground/60" />
          </button>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-4">
          {ALL_TYPES.map((t) =>
            renderChip(t, {
              onClick: () => {
                setSelectedType(t.id);
                setTypeSheet(false);
              },
            })
          )}
        </div>
      </div>
    </div>
  );

  const locBottomSheet = locSheet && (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" onClick={() => setLocSheet(false)}>
      <div className="absolute inset-0 bg-black/60" />
      <div
        className="relative bg-[#1c1c1c] rounded-t-3xl px-5 pt-3 pb-6"
        style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 rounded-full bg-foreground/20 mx-auto" />
        <div className="flex items-center justify-between mt-4">
          <h3 className="text-base font-semibold text-foreground">Number of locations</h3>
          <button
            onClick={() => setLocSheet(false)}
            className="w-8 h-8 rounded-full flex items-center justify-center active:opacity-70"
            aria-label="Close"
          >
            <X className="w-4 h-4 text-foreground/60" />
          </button>
        </div>
        <div className="flex flex-col gap-2 mt-4">
          {LOCATION_OPTIONS.map((opt) => {
            const active = selectedLocations === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => {
                  setSelectedLocations(opt.id);
                  setLocSheet(false);
                }}
                className={`w-full min-h-[52px] flex items-center justify-between px-4 py-3 rounded-2xl border transition-all active:opacity-80 ${
                  active
                    ? "border-primary bg-primary/[0.08]"
                    : "border-foreground/[0.08] bg-foreground/[0.04]"
                }`}
              >
                <span className="text-sm font-medium text-foreground">{opt.label}</span>
                {active && <Check className="w-4 h-4 text-primary" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
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
            <div className="mt-2">{sectionLabel("Restaurant Type")}</div>
            {typeGrid}
            <div className="mt-6">{sectionLabel("Number of Locations")}</div>
            {locationsField}
          </div>
        </div>
        {typeBottomSheet}
        {locBottomSheet}
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
          {sectionLabel("Restaurant Type")}
          {typeGrid}
          <div className="mt-6">{sectionLabel("Number of Locations")}</div>
          {locationsField}
          <div className="h-4" />
        </div>
        <div
          className="pt-3"
          style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
        >
          {ctaButton}
        </div>
      </div>
      {typeBottomSheet}
      {locBottomSheet}
    </div>
  );
};

export default OnboardingAppSignupProfile;
