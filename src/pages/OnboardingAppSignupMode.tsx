import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ChevronLeft, LayoutGrid, Zap, ChefHat, Check, Minus, Sparkles } from "lucide-react";
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

  const recoLabel = RESTAURANT_TYPE_LABEL[incoming.restaurantType ?? ""] ?? "your business";

  const handleBack = () => navigate("/onboarding/app/signup/revenue");
  const handleCta = () => {
    navigate("/onboarding/app/signup/trial", { state: { ...incoming, mode: selected } });
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

  const ctaButton = (
    <button
      onClick={handleCta}
      className="w-full min-h-[44px] py-3 rounded-2xl text-sm font-semibold bg-primary text-primary-foreground active:opacity-80 transition-opacity"
    >
      Use {selectedMode.title}
    </button>
  );

  // Comparison table
  const ColHeader = ({ mode }: { mode: Mode }) => {
    const isSel = selected === mode.id;
    const Icon = mode.icon;
    return (
      <button
        type="button"
        onClick={() => setSelected(mode.id)}
        className={`relative flex flex-col items-center justify-start gap-1 px-1 pt-3 pb-2 w-full transition-colors ${
          isSel
            ? "bg-primary/[0.07] border-t-[1.5px] border-l-[1.5px] border-r-[1.5px] border-primary rounded-t-xl"
            : "border-t-[1.5px] border-l-[1.5px] border-r-[1.5px] border-transparent"
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
        <span className={`text-[11px] font-semibold leading-tight text-center ${isSel ? "text-foreground" : "text-foreground/50"}`}>
          {mode.title}
        </span>
      </button>
    );
  };

  const Cell = ({ on, isSel, isLast }: { on: boolean; isSel: boolean; isLast: boolean }) => (
    <div
      className={`flex items-center justify-center py-1 ${
        isSel
          ? `bg-primary/[0.07] border-l-[1.5px] border-r-[1.5px] border-primary ${
              isLast ? "border-b-[1.5px] rounded-b-xl" : ""
            }`
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

  const totalRows = SECTIONS.reduce((n, s) => n + s.rows.length, 0);

  const table = (
    <div className="w-full">
      {/* Headers */}
      <div className="grid" style={{ gridTemplateColumns: "1.6fr 1fr 1fr 1fr" }}>
        <div />
        {MODES.map((m) => (
          <ColHeader key={m.id} mode={m} />
        ))}
      </div>

      {/* Sections */}
      {SECTIONS.map((section, sIdx) => {
        let globalRowOffset = 0;
        for (let i = 0; i < sIdx; i++) globalRowOffset += SECTIONS[i].rows.length;
        return (
          <div key={section.label}>
            <div
              className="grid"
              style={{ gridTemplateColumns: "1.6fr 1fr 1fr 1fr" }}
            >
              <div className="px-1 pt-0.5 pb-0">
                <span
                  className="block font-semibold uppercase text-foreground/50"
                  style={{ fontSize: "8px", letterSpacing: "0.5px", lineHeight: 0.95 }}
                >
                  {section.label}
                </span>
              </div>
              {MODES.map((m) => (
                <div
                  key={m.id}
                  className={`${
                    selected === m.id
                      ? "bg-primary/[0.07] border-l-[1.5px] border-r-[1.5px] border-primary"
                      : ""
                  }`}
                />
              ))}
            </div>
            {section.rows.map((row, rIdx) => {
              const absoluteIndex = globalRowOffset + rIdx;
              const isLastOverall = absoluteIndex === totalRows - 1;
              return (
                <div
                  key={row.label}
                  className="grid items-stretch"
                  style={{ gridTemplateColumns: "1.6fr 1fr 1fr 1fr" }}
                >
                  <div className="px-1 py-1 text-[10px] font-semibold text-foreground">
                    {row.label}
                  </div>
                  {MODES.map((m) => (
                    <Cell
                      key={m.id}
                      on={row.values[m.id]}
                      isSel={selected === m.id}
                      isLast={isLastOverall}
                    />
                  ))}
                </div>
              );
            })}
          </div>
        );
      })}
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
            style={{ width: "40%" }}
          >
            {backBtn}
            <div className="mt-5">
              {title}
              {subtitle}
              {aiBadge}
            </div>
            <div className="flex-1" />
            <div style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}>
              {ctaButton}
            </div>
          </div>
          <div className="flex flex-col px-6 py-6 flex-1 min-h-0" style={{ width: "60%" }}>
            <div className="flex-1 overflow-y-auto pt-4">{table}</div>
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
  );
};

export default OnboardingAppSignupMode;
