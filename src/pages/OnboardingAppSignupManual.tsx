import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Info, Pencil } from "lucide-react";
import { useIsLandscape } from "@/hooks/use-landscape";

type Step = 1 | 2 | 3;

type ManualPlace = {
  name: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  phone: string;
  website: string;
  mapsLink: string;
};

const COUNTRIES = [
  "United States",
  "United Kingdom",
  "Canada",
  "Australia",
  "India",
  "Germany",
  "France",
  "Spain",
  "Italy",
  "Netherlands",
  "United Arab Emirates",
  "Singapore",
  "Japan",
  "Mexico",
  "Brazil",
];

const US_STATES = [
  ["AL", "Alabama"], ["AK", "Alaska"], ["AZ", "Arizona"], ["AR", "Arkansas"],
  ["CA", "California"], ["CO", "Colorado"], ["CT", "Connecticut"], ["DE", "Delaware"],
  ["DC", "District of Columbia"], ["FL", "Florida"], ["GA", "Georgia"], ["HI", "Hawaii"],
  ["ID", "Idaho"], ["IL", "Illinois"], ["IN", "Indiana"], ["IA", "Iowa"],
  ["KS", "Kansas"], ["KY", "Kentucky"], ["LA", "Louisiana"], ["ME", "Maine"],
  ["MD", "Maryland"], ["MA", "Massachusetts"], ["MI", "Michigan"], ["MN", "Minnesota"],
  ["MS", "Mississippi"], ["MO", "Missouri"], ["MT", "Montana"], ["NE", "Nebraska"],
  ["NV", "Nevada"], ["NH", "New Hampshire"], ["NJ", "New Jersey"], ["NM", "New Mexico"],
  ["NY", "New York"], ["NC", "North Carolina"], ["ND", "North Dakota"], ["OH", "Ohio"],
  ["OK", "Oklahoma"], ["OR", "Oregon"], ["PA", "Pennsylvania"], ["RI", "Rhode Island"],
  ["SC", "South Carolina"], ["SD", "South Dakota"], ["TN", "Tennessee"], ["TX", "Texas"],
  ["UT", "Utah"], ["VT", "Vermont"], ["VA", "Virginia"], ["WA", "Washington"],
  ["WV", "West Virginia"], ["WI", "Wisconsin"], ["WY", "Wyoming"],
] as const;

// Map ISO region codes from browser locale to country labels in COUNTRIES list.
const REGION_TO_COUNTRY: Record<string, string> = {
  US: "United States", GB: "United Kingdom", CA: "Canada", AU: "Australia",
  IN: "India", DE: "Germany", FR: "France", ES: "Spain", IT: "Italy",
  NL: "Netherlands", AE: "United Arab Emirates", SG: "Singapore", JP: "Japan",
  MX: "Mexico", BR: "Brazil",
};

const detectCountry = (): string => {
  try {
    const locales = [
      ...(navigator.languages || []),
      navigator.language,
    ].filter(Boolean) as string[];
    for (const loc of locales) {
      const region = loc.split("-")[1]?.toUpperCase();
      if (region && REGION_TO_COUNTRY[region]) return REGION_TO_COUNTRY[region];
    }
  } catch {
    // ignore
  }
  return "United States";
};

const OnboardingAppSignupManual = () => {
  const navigate = useNavigate();
  const isLandscape = useIsLandscape();
  const [step, setStep] = useState<Step>(1);
  const [data, setData] = useState<ManualPlace>(() => ({
    name: "",
    address1: "",
    address2: "",
    city: "",
    state: "",
    postcode: "",
    country: detectCountry(),
    phone: "",
    website: "",
    mapsLink: "",
  }));
  const [countryPickerOpen, setCountryPickerOpen] = useState(false);

  const update = (patch: Partial<ManualPlace>) => setData((d) => ({ ...d, ...patch }));

  const isUS = data.country === "United States";

  const step1Valid = useMemo(
    () =>
      data.name.trim().length > 1 &&
      data.address1.trim().length > 1 &&
      data.city.trim().length > 0 &&
      data.postcode.trim().length > 0 &&
      data.country.trim().length > 0 &&
      (!isUS || data.state.trim().length > 0),
    [data, isUS],
  );

  const step2Valid = useMemo(() => data.phone.trim().length >= 6, [data.phone]);

  const handleBack = () => {
    if (step === 1) navigate("/onboarding/app/signup/lookup");
    else setStep((s) => (s - 1) as Step);
  };

  const handleConfirm = () => {
    const place = {
      place_id: `manual-${Date.now()}`,
      name: data.name,
      address: [data.address1, data.city, data.postcode, data.country]
        .filter(Boolean)
        .join(", "),
      business_type: "Restaurant",
      distance_km: null,
      manual: true,
      phone: data.phone,
      website: data.website,
      mapsLink: data.mapsLink,
    };
    navigate("/onboarding/app/signup/account", { state: { place } });
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

  const stepLabel = (
    <p className="text-[11px] uppercase tracking-[0.16em] font-semibold text-primary">
      {step === 1 ? "Manual · Step 1" : step === 2 ? "Manual · Step 2" : "Manual · Confirm"}
    </p>
  );

  const title = (
    <h1 className="text-2xl font-bold text-foreground mt-2">
      {step === 1 ? "Add your restaurant" : step === 2 ? "Contact details" : "Confirm your restaurant"}
    </h1>
  );

  const subtitle = (
    <p className="text-sm text-foreground/60 mt-0.5">
      {step === 1
        ? "You can always update these details later."
        : step === 2
        ? "How customers and POS AI can reach you."
        : "This is what we'll show on receipts and the kiosk."}
    </p>
  );

  const fieldCls =
    "w-full bg-foreground/[0.04] border border-foreground/[0.08] rounded-2xl px-4 py-3 text-sm text-foreground placeholder:text-foreground/40 outline-none focus:border-primary transition-colors min-h-[44px]";
  const labelCls = "text-xs font-medium text-foreground/60 mb-1.5 block";

  const step1 = (
    <div className="flex flex-col gap-3">
      <div>
        <label className={labelCls}>Restaurant name</label>
        <input
          className={fieldCls}
          value={data.name}
          onChange={(e) => update({ name: e.target.value })}
          placeholder="e.g. Memories Café"
        />
      </div>
      <div>
        <label className={labelCls}>Address line 1</label>
        <input
          className={fieldCls}
          value={data.address1}
          onChange={(e) => update({ address1: e.target.value })}
          placeholder="Street address"
        />
      </div>
      <div>
        <label className={labelCls}>City</label>
        <input
          className={fieldCls}
          value={data.city}
          onChange={(e) => update({ city: e.target.value })}
          placeholder="City"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Postcode</label>
          <input
            className={fieldCls}
            value={data.postcode}
            onChange={(e) => update({ postcode: e.target.value })}
            placeholder="ZIP / Postcode"
          />
        </div>
        <div>
          <label className={labelCls}>Country</label>
          <select
            className={`${fieldCls} appearance-none`}
            value={data.country}
            onChange={(e) => update({ country: e.target.value })}
          >
            <option value="" disabled>
              Select
            </option>
            {COUNTRIES.map((c) => (
              <option key={c} value={c} className="bg-neutral-900">
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );

  const step2El = (
    <div className="flex flex-col gap-3">
      <div>
        <label className={labelCls}>Phone number</label>
        <input
          type="tel"
          className={fieldCls}
          value={data.phone}
          onChange={(e) => update({ phone: e.target.value })}
          placeholder="+1 555 123 4567"
        />
      </div>
      <div>
        <label className={labelCls}>Restaurant website (optional)</label>
        <input
          className={fieldCls}
          value={data.website}
          onChange={(e) => update({ website: e.target.value })}
          placeholder="www.example.com"
        />
      </div>
      <div>
        <label className={labelCls}>Google Maps link (optional)</label>
        <input
          className={fieldCls}
          value={data.mapsLink}
          onChange={(e) => update({ mapsLink: e.target.value })}
          placeholder="maps.google.com/…"
        />
        <p className="text-[11px] text-foreground/40 mt-1.5">
          Helps guests find you on the receipt.
        </p>
      </div>
    </div>
  );

  const step3El = (
    <div className="flex flex-col gap-3">
      <div className="px-4 py-4 rounded-2xl border border-foreground/[0.08] bg-foreground/[0.04]">
        <p className="text-base font-semibold text-foreground">{data.name || "—"}</p>
        <p className="text-sm text-foreground/60 mt-1">{data.address1}</p>
        <p className="text-sm text-foreground/60">
          {[data.city, data.postcode].filter(Boolean).join(" ")}
        </p>
        {data.country && <p className="text-sm text-foreground/60">{data.country}</p>}
        {data.phone && <p className="text-sm text-foreground/60 mt-2">{data.phone}</p>}
        {data.website && (
          <p className="text-sm text-foreground/60">{data.website}</p>
        )}
      </div>
      <div className="flex items-start gap-2 px-4 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
        <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <span>
          Not on Google yet? You can claim or add your listing later, it won't affect your POS AI account.
        </span>
      </div>
    </div>
  );

  const primaryBtn = (
    <button
      onClick={() => {
        if (step === 1 && step1Valid) setStep(2);
        else if (step === 2 && step2Valid) setStep(3);
        else if (step === 3) handleConfirm();
      }}
      disabled={(step === 1 && !step1Valid) || (step === 2 && !step2Valid)}
      className="w-full min-h-[44px] py-3 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold active:opacity-80 transition-opacity disabled:opacity-40"
    >
      {step === 3 ? "Confirm & continue" : "Continue"}
    </button>
  );

  const secondaryBtn =
    step === 2 ? (
      <button
        onClick={() => setStep(3)}
        className="w-full min-h-[44px] py-3 rounded-2xl border border-foreground/[0.08] bg-foreground/[0.04] text-sm font-semibold text-foreground active:opacity-80 transition-opacity"
      >
        Skip contact details
      </button>
    ) : step === 3 ? (
      <button
        onClick={() => setStep(1)}
        className="inline-flex items-center justify-center gap-1.5 w-full py-2 text-sm text-primary hover:underline underline-offset-2"
      >
        <Pencil className="w-3.5 h-3.5" />
        Edit details
      </button>
    ) : null;

  const body = (
    <AnimatePresence mode="wait">
      <motion.div
        key={step}
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -12 }}
        transition={{ duration: 0.18 }}
      >
        {step === 1 ? step1 : step === 2 ? step2El : step3El}
      </motion.div>
    </AnimatePresence>
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
            <div>{backBtn}</div>
            <div className="flex-1 flex flex-col justify-center">
              {stepLabel}
              {title}
              {subtitle}
            </div>
            <div className="flex flex-col gap-3">
              {primaryBtn}
              {secondaryBtn}
            </div>
          </div>
          <div className="flex flex-col px-6 py-6 flex-1 min-h-0 overflow-y-auto" style={{ width: "55%" }}>
            {body}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 login-bg flex flex-col overflow-hidden">
      <div className="absolute inset-0 gradient-mesh opacity-30 pointer-events-none" />
      <div className="relative z-10 flex flex-col h-full w-full max-w-md mx-auto px-6 pt-6">
        <div className="mb-4">{backBtn}</div>
        {stepLabel}
        {title}
        {subtitle}
        <div className="flex-1 overflow-y-auto pt-4 pb-4">{body}</div>
        <div
          className="flex flex-col gap-2 pt-2"
          style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
        >
          {primaryBtn}
          {secondaryBtn}
        </div>
      </div>
    </div>
  );
};

export default OnboardingAppSignupManual;
