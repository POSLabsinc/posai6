import { useMemo, useState } from "react";
import MarketingPanel from "@/components/onboarding/MarketingPanel";
import { useLocation, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronDown, LayoutGrid, Zap, ChefHat, Check, Minus, Sparkles } from "lucide-react";

import { useIsLandscape } from "@/hooks/use-landscape";

type ModeId = "standard" | "quickservice" | "fullservice";

type Mode = {
  id: ModeId;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
};

const MODES: Mode[] = [
  { id: "standard", title: "Standard", icon: LayoutGrid },
  { id: "quickservice", title: "Quick Service", icon: Zap },
  { id: "fullservice", title: "Full Service", icon: ChefHat },
];

type Row = { label: string; values: Record<ModeId, boolean> };
type Section = { label: string; rows: Row[] };

const SECTIONS: Section[] = [
  {
    label: "Orders",
    rows: [
      { label: "Quick orders", values: { standard: true, quickservice: true, fullservice: true } },
      { label: "Custom products", values: { standard: true, quickservice: true, fullservice: true } },
      { label: "Notes and modifiers", values: { standard: true, quickservice: true, fullservice: true } },
      { label: "Hold and fire", values: { standard: false, quickservice: true, fullservice: true } },
      { label: "Course management", values: { standard: false, quickservice: false, fullservice: true } },
    ],
  },
  {
    label: "Payments",
    rows: [
      { label: "Card / cash", values: { standard: true, quickservice: true, fullservice: true } },
      { label: "Split payments", values: { standard: false, quickservice: true, fullservice: true } },
      { label: "Tips and gratuity", values: { standard: false, quickservice: true, fullservice: true } },
      { label: "Vouchers and gift cards", values: { standard: false, quickservice: true, fullservice: true } },
      { label: "Refunds and voids", values: { standard: true, quickservice: true, fullservice: true } },
    ],
  },
  {
    label: "Kitchen",
    rows: [
      { label: "KDS routing", values: { standard: false, quickservice: true, fullservice: true } },
      { label: "Multi-channel menus", values: { standard: false, quickservice: true, fullservice: true } },
      { label: "Bump and recall", values: { standard: false, quickservice: true, fullservice: true } },
      { label: "Prep stations", values: { standard: false, quickservice: false, fullservice: true } },
    ],
  },
  {
    label: "Table management",
    rows: [
      { label: "Floor plans", values: { standard: false, quickservice: false, fullservice: true } },
      { label: "Open checks", values: { standard: false, quickservice: false, fullservice: true } },
      { label: "Coursing", values: { standard: false, quickservice: false, fullservice: true } },
      { label: "Transfers and merges", values: { standard: false, quickservice: false, fullservice: true } },
      { label: "Split check", values: { standard: false, quickservice: false, fullservice: true } },
    ],
  },
  {
    label: "Guests and reservations",
    rows: [
      { label: "Guest profiles", values: { standard: false, quickservice: true, fullservice: true } },
      { label: "Reservations", values: { standard: false, quickservice: false, fullservice: true } },
      { label: "Waitlist", values: { standard: false, quickservice: false, fullservice: true } },
    ],
  },
  {
    label: "Inventory",
    rows: [
      { label: "Stock deduction on fire", values: { standard: false, quickservice: true, fullservice: true } },
      { label: "Low-stock alerts", values: { standard: false, quickservice: true, fullservice: true } },
      { label: "Write-off tracking", values: { standard: false, quickservice: false, fullservice: true } },
    ],
  },
  {
    label: "Workforce",
    rows: [
      { label: "Clock in and out", values: { standard: true, quickservice: true, fullservice: true } },
      { label: "Roles and permissions", values: { standard: false, quickservice: true, fullservice: true } },
      { label: "Shift summary", values: { standard: false, quickservice: true, fullservice: true } },
      { label: "Cash drawer sessions", values: { standard: false, quickservice: true, fullservice: true } },
    ],
  },
  {
    label: "Reports and AI",
    rows: [
      { label: "End of day", values: { standard: true, quickservice: true, fullservice: true } },
      { label: "Sales analytics", values: { standard: false, quickservice: true, fullservice: true } },
      { label: "AI report generation", values: { standard: false, quickservice: true, fullservice: true } },
    ],
  },
  {
    label: "Security",
    rows: [
      { label: "MPIN gate", values: { standard: true, quickservice: true, fullservice: true } },
      { label: "Device PIN lockout", values: { standard: true, quickservice: true, fullservice: true } },
      { label: "Audit log", values: { standard: false, quickservice: false, fullservice: true } },
    ],
  },
];

type LocationState = {
  selectedMode?: ModeId;
  revenue?: string;
  restaurantType?: string;
};

const RESTAURANT_TYPE_LABEL: Record<string, string> = {
  cafe: "Cafe",
  quick_service: "Quick Service",
  food_truck: "Food Truck",
  bakery: "Bakery",
  cloud_kitchen: "Cloud Kitchen",
  full_service: "Full Service",
  fine_dining: "Fine Dining",
  bar_pub: "Bar & Pub",
  food_court: "Food Court",
  other: "Your business",
};

function recommendFor(type?: string): ModeId {
  switch (type) {
    case "cafe":
    case "quick_service":
    case "food_truck":
    case "bakery":
    case "cloud_kitchen":
      return "quickservice";
    case "full_service":
    case "fine_dining":
    case "bar_pub":
    case "food_court":
      return "fullservice";
    default:
      return "standard";
  }
}

const OnboardingAppSignupMode = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isLandscape = useIsLandscape();
  const incoming = (location.state as LocationState) ?? {};

  const recommended = useMemo(() => recommendFor(incoming.restaurantType), [incoming.restaurantType]);
  const [selected, setSelected] = useState<ModeId>(incoming.selectedMode ?? recommended);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [showDemoPopup, setShowDemoPopup] = useState(false);
  const isDemo = Boolean((incoming as { demo?: boolean }).demo);

  const recoLabel = RESTAURANT_TYPE_LABEL[incoming.restaurantType ?? ""] ?? "your business";

  const handleBack = () => navigate("/onboarding/app/signup/revenue");
  const proceedToTrial = () => {
    navigate("/onboarding/app/signup/trial", { state: { ...incoming, mode: selected } });
  };
  const handleCta = () => {
    if (isDemo) {
      setShowDemoPopup(true);
      return;
    }
    proceedToTrial();
  };

  const selectedMode = MODES.find((m) => m.id === selected)!;

  const backBtn = (
    <button
      onClick={handleBack}
      className="w-10 h-10 rounded-full bg-neutral-800/60 flex items-center justify-center active:opacity-70 transition-opacity"
      aria-label="Back"
    >
      <ChevronLeft className="w-5 h-5 text-foreground" />
    </button>
  );

  const title = <h1 className="text-2xl font-bold text-foreground mt-2">Select a mode</h1>;
  const subtitle = (
    <p className="text-sm text-foreground/60 mt-0.5">
      Compare and pick the best fit for your business.
    </p>
  );

  const aiBadge = (
    <div className="inline-flex items-center gap-1.5 mt-3 px-2.5 py-1 rounded-full bg-primary/[0.08] border border-primary/20">
      <Sparkles className="w-3.5 h-3.5 text-primary" />
      <span className="text-xs font-medium text-primary">
        Recommended for {recoLabel}
      </span>
    </div>
  );

  const modeRoutePath: Record<ModeId, string> = {
    standard: "/onboarding/app/signup/mode/standard",
    quickservice: "/onboarding/app/signup/mode/quickservice",
    fullservice: "/onboarding/app/signup/mode/fullservice",
  };

  const handleLearnMore = () => {
    navigate(modeRoutePath[selected], { state: { ...incoming, selectedMode: selected } });
  };

  const ctaButton = (
    <div className="w-full flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={handleLearnMore}
        className="text-xs font-semibold text-primary active:opacity-70 transition-opacity underline-offset-4 hover:underline"
      >
        Learn more about {selectedMode.title}
      </button>
      <button
        onClick={handleCta}
        className="w-full min-h-[44px] py-3 rounded-2xl text-sm font-semibold bg-primary text-primary-foreground active:opacity-80 transition-opacity"
      >
        Use {selectedMode.title}
      </button>
    </div>
  );


  const ColHeader = ({ mode }: { mode: Mode }) => {
    const isSel = selected === mode.id;
    const Icon = mode.icon;
    return (
      <button
        type="button"
        onClick={() => setSelected(mode.id)}
        className={`relative flex flex-col items-center justify-start gap-1 px-1 pt-3 pb-2 w-full transition-colors ${
          isSel
            ? "bg-primary/[0.07] border-[1.5px] border-primary rounded-xl"
            : "border-[1.5px] border-transparent"
        }`}
      >
        {isSel && (
          <span
            className="absolute -top-2 left-1/2 -translate-x-1/2 px-1.5 py-[2px] rounded-full bg-primary text-primary-foreground font-semibold tracking-wide whitespace-nowrap"
            style={{ fontSize: "8px" }}
          >
            BEST MATCH
          </span>
        )}
        <Icon className={`w-5 h-5 ${isSel ? "text-primary" : "text-foreground/40"}`} />
        <span className={`text-[11px] font-semibold leading-tight text-center min-h-[1.9em] flex items-center justify-center ${isSel ? "text-foreground" : "text-foreground/50"}`}>
          {mode.title}
        </span>

      </button>
    );
  };

  const Cell = ({ on, isSel, isFirst, isLast }: { on: boolean; isSel: boolean; isFirst: boolean; isLast: boolean }) => (
    <div
      className={`flex items-center justify-center py-1.5 ${
        isSel
          ? `bg-primary/[0.07] border-l-[1.5px] border-r-[1.5px] border-primary ${
              isFirst ? "border-t-[1.5px] rounded-t-xl" : ""
            } ${isLast ? "border-b-[1.5px] rounded-b-xl" : ""}`
          : ""
      }`}
    >
      {on ? (
        <Check className="w-4 h-4 text-primary" strokeWidth={2.5} />
      ) : (
        <Minus className="w-4 h-4 text-foreground/25" />
      )}
    </div>
  );

  const toggleSection = (label: string) =>
    setOpenSections((s) => ({ ...s, [label]: !s[label] }));

  const table = (
    <div className="w-full pt-4">
      <div className="grid gap-x-1" style={{ gridTemplateColumns: "1.6fr 1fr 1fr 1fr" }}>
        <div />
        {MODES.map((m) => (
          <ColHeader key={m.id} mode={m} />
        ))}
      </div>

      <div className="mt-3 flex flex-col gap-1.5">
        {SECTIONS.map((section) => {
          const isOpen = !!openSections[section.label];
          const count = section.rows.filter((r) => r.values[selected]).length;
          return (
            <div key={section.label} className="rounded-xl bg-foreground/[0.03]">
              <button
                type="button"
                onClick={() => toggleSection(section.label)}
                className="w-full flex items-center justify-between px-3 py-2.5 active:opacity-70 transition-opacity"
                aria-expanded={isOpen}
              >
                <span
                  className="font-semibold uppercase text-foreground/50"
                  style={{ fontSize: "10px", letterSpacing: "0.6px" }}
                >
                  {section.label}
                </span>
                <span className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-foreground/60 tabular-nums">
                    {count}/{section.rows.length}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-foreground/50 transition-transform duration-200 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </span>
              </button>
              <div
                className="grid transition-[grid-template-rows] duration-200 ease-out"
                style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
              >
                <div className="overflow-hidden">
                  <div className="px-2 pb-2">
                    {section.rows.map((row, rIdx) => {
                      const isFirst = rIdx === 0;
                      const isLast = rIdx === section.rows.length - 1;
                      return (
                        <div
                          key={row.label}
                          className="grid items-stretch"
                          style={{ gridTemplateColumns: "1.6fr 1fr 1fr 1fr" }}
                        >
                          <div className="px-1 py-1.5 text-xs font-medium text-foreground">
                            {row.label}
                          </div>
                          {MODES.map((m) => (
                            <Cell
                              key={m.id}
                              on={row.values[m.id]}
                              isSel={selected === m.id}
                              isFirst={isFirst}
                              isLast={isLast}
                            />
                          ))}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );


  const demoPopup = showDemoPopup && (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm px-4 pb-6 pt-6">
      <div className="w-full max-w-sm rounded-3xl bg-neutral-900 border border-foreground/10 p-6 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          </div>
          <div className="flex-1">
            <p className="text-base font-semibold text-primary">Demo mode, read only</p>
            <p className="text-sm text-foreground/70 mt-1">Add a business email to unlock full access.</p>
          </div>
        </div>
        <div className="mt-5 flex flex-col gap-2">
          <button
            onClick={() => navigate("/onboarding/app/signup/account", { state: incoming })}
            className="w-full min-h-[44px] py-3 rounded-2xl text-sm font-semibold bg-primary text-primary-foreground active:opacity-80 transition-opacity"
          >
            Add business email
          </button>
          <button
            onClick={() => { setShowDemoPopup(false); proceedToTrial(); }}
            className="w-full min-h-[44px] py-3 rounded-2xl text-sm font-semibold border border-foreground/15 text-foreground active:opacity-80 transition-opacity"
          >
            Continue exploring demo
          </button>
        </div>
      </div>
    </div>
  );

  if (isLandscape) {
    return (
      <>
      {demoPopup}
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
              eyebrow="Service mode preview"
              caption="Choose how your venue serves guests: full service, quick service, or standard."
            />
          </div>
          <div className="flex flex-col px-6 py-6 flex-1 min-h-0" style={{ width: "55%" }}>
            <div>{backBtn}</div>
            <div className="mt-4">
              {title}
              {subtitle}
              {aiBadge}
            </div>
            <div className="flex-1 overflow-y-auto mt-4 pb-4">{table}</div>
            <div style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}>
              {ctaButton}
            </div>
          </div>
        </div>
      </div>
      </>
    );
  }

  return (
    <>
    {demoPopup}
    <div className="fixed inset-0 login-bg flex flex-col overflow-hidden">
      <div className="absolute inset-0 gradient-mesh opacity-30 pointer-events-none" />
      <div
        className="relative z-10 flex flex-col h-full w-full max-w-md mx-auto px-6"
        style={{ paddingTop: "max(1.5rem, env(safe-area-inset-top))" }}
      >
        <div className="mb-4">{backBtn}</div>
        <div>
          {title}
          {subtitle}
          {aiBadge}
        </div>
        <div className="flex-1 overflow-y-auto mt-5 pb-4 pt-4">{table}</div>
        <div
          className="pt-2"
          style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
        >
          {ctaButton}
        </div>
      </div>
    </div>
    </>
  );
};

export default OnboardingAppSignupMode;
