import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Loader2, Eye, EyeOff, MapPin, Search, Pencil, ChevronDown, Check, Minus, LayoutGrid, Zap, ChefHat } from "lucide-react";
import ReactMarkdown from "react-markdown";
import AnimatedAIIcon from "@/components/AnimatedAIIcon";

type Role = "user" | "assistant";
interface Message {
  id: string;
  role: Role;
  content: string;
  step?: Step;
}

type Step =
  | "initial"
  | "intent"
  | "su-restaurant"
  | "su-email"
  | "su-password"
  | "su-country"
  | "su-type"
  | "su-type-other"
  | "su-locations"
  | "su-revenue"
  | "su-mode"
  | "su-creating"
  | "si-email"
  | "si-password"
  | "si-submitting"
  | "si-error";

type PlaceResult = {
  place_id: string;
  name: string;
  address: string;
  business_type: string;
  distance_km: number | null;
  lat?: number;
  lng?: number;
};

const PERSONAL_DOMAINS = new Set([
  "gmail.com", "yahoo.com", "yahoo.co.uk", "yahoo.co.in", "hotmail.com",
  "outlook.com", "live.com", "msn.com", "icloud.com", "me.com", "mac.com",
  "protonmail.com", "proton.me", "aol.com", "gmx.com", "yandex.com",
  "mail.com", "zoho.com",
]);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_maps";

const DUMMY_RESTAURANTS: PlaceResult[] = [
  { place_id: "dummy-1", name: "The Rustic Table", address: "123 Main Street, Downtown, NY 10001", business_type: "Restaurant", distance_km: null, lat: 40.7128, lng: -74.006 },
  { place_id: "dummy-2", name: "Bella Vista Bistro", address: "456 Park Avenue, Midtown, NY 10022", business_type: "Bistro", distance_km: null, lat: 40.7614, lng: -73.9776 },
  { place_id: "dummy-3", name: "Harbor Grill & Bar", address: "789 Waterfront Drive, Brooklyn, NY 11201", business_type: "Bar", distance_km: null, lat: 40.6892, lng: -74.0445 },
];

const COUNTRIES = [
  "United States", "United Kingdom", "Canada", "Australia", "India",
  "Germany", "France", "Spain", "Italy", "Netherlands",
  "United Arab Emirates", "Singapore", "Japan", "Mexico", "Brazil",
];

const COUNTRY_FLAGS: Record<string, string> = {
  "United States": "\ud83c\uddfa\ud83c\uddf8",
  "United Kingdom": "\ud83c\uddec\ud83c\udde7",
  Canada: "\ud83c\udde8\ud83c\udde6",
  Australia: "\ud83c\udde6\ud83c\uddfa",
  India: "\ud83c\uddee\ud83c\uddf3",
  Germany: "\ud83c\udde9\ud83c\uddea",
  France: "\ud83c\uddeb\ud83c\uddf7",
  Spain: "\ud83c\uddea\ud83c\uddf8",
  Italy: "\ud83c\uddee\ud83c\uddf9",
  Netherlands: "\ud83c\uddf3\ud83c\uddf1",
  "United Arab Emirates": "\ud83c\udde6\ud83c\uddea",
  Singapore: "\ud83c\uddf8\ud83c\uddec",
  Japan: "\ud83c\uddef\ud83c\uddf5",
  Mexico: "\ud83c\uddf2\ud83c\uddfd",
  Brazil: "\ud83c\udde7\ud83c\uddf7",
};

const REGION_TO_COUNTRY: Record<string, string> = {
  US: "United States", GB: "United Kingdom", CA: "Canada", AU: "Australia",
  IN: "India", DE: "Germany", FR: "France", ES: "Spain", IT: "Italy",
  NL: "Netherlands", AE: "United Arab Emirates", SG: "Singapore", JP: "Japan",
  MX: "Mexico", BR: "Brazil",
};

const detectCountry = (): string => {
  try {
    const locales = [...(navigator.languages || []), navigator.language].filter(Boolean) as string[];
    for (const loc of locales) {
      const region = loc.split("-")[1]?.toUpperCase();
      if (region && REGION_TO_COUNTRY[region]) return REGION_TO_COUNTRY[region];
    }
  } catch { /* ignore */ }
  return "United States";
};

const RESTAURANT_TYPES = [
  "Cafe", "Quick Service", "Food Truck", "Bakery", "Cloud Kitchen",
  "Full Service", "Fine Dining", "Bar and Pub", "Food Court", "Other",
];
const LOCATION_OPTIONS = ["1", "2-5", "6-10", "11+"];
const REVENUE_OPTIONS = ["< $250K", "$250K - $1M", "$1M - $5M", "$5M+"];
const MODE_OPTIONS = ["Standard", "Quick Service", "Full Service"];
type ModeKey = "standard" | "quickservice" | "fullservice";
const MODE_META: { id: ModeKey; title: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "standard", title: "Standard", icon: LayoutGrid },
  { id: "quickservice", title: "Quick Service", icon: Zap },
  { id: "fullservice", title: "Full Service", icon: ChefHat },
];
const PLAN_SECTIONS: { label: string; rows: { label: string; values: Record<ModeKey, boolean> }[] }[] = [
  { label: "Orders", rows: [
    { label: "Quick orders", values: { standard: true, quickservice: true, fullservice: true } },
    { label: "Custom products", values: { standard: true, quickservice: true, fullservice: true } },
    { label: "Notes and modifiers", values: { standard: true, quickservice: true, fullservice: true } },
    { label: "Hold and fire", values: { standard: false, quickservice: true, fullservice: true } },
    { label: "Course management", values: { standard: false, quickservice: false, fullservice: true } },
  ]},
  { label: "Payments", rows: [
    { label: "Card / cash", values: { standard: true, quickservice: true, fullservice: true } },
    { label: "Split payments", values: { standard: false, quickservice: true, fullservice: true } },
    { label: "Tips and gratuity", values: { standard: false, quickservice: true, fullservice: true } },
    { label: "Vouchers and gift cards", values: { standard: false, quickservice: true, fullservice: true } },
    { label: "Refunds and voids", values: { standard: true, quickservice: true, fullservice: true } },
  ]},
  { label: "Kitchen", rows: [
    { label: "KDS routing", values: { standard: false, quickservice: true, fullservice: true } },
    { label: "Multi-channel menus", values: { standard: false, quickservice: true, fullservice: true } },
    { label: "Bump and recall", values: { standard: false, quickservice: true, fullservice: true } },
    { label: "Prep stations", values: { standard: false, quickservice: false, fullservice: true } },
  ]},
  { label: "Table management", rows: [
    { label: "Floor plans", values: { standard: false, quickservice: false, fullservice: true } },
    { label: "Open checks", values: { standard: false, quickservice: false, fullservice: true } },
    { label: "Coursing", values: { standard: false, quickservice: false, fullservice: true } },
    { label: "Transfers and merges", values: { standard: false, quickservice: false, fullservice: true } },
    { label: "Split check", values: { standard: false, quickservice: false, fullservice: true } },
  ]},
  { label: "Guests and reservations", rows: [
    { label: "Guest profiles", values: { standard: false, quickservice: true, fullservice: true } },
    { label: "Reservations", values: { standard: false, quickservice: false, fullservice: true } },
    { label: "Waitlist", values: { standard: false, quickservice: false, fullservice: true } },
  ]},
  { label: "Inventory", rows: [
    { label: "Stock deduction on fire", values: { standard: false, quickservice: true, fullservice: true } },
    { label: "Low-stock alerts", values: { standard: false, quickservice: true, fullservice: true } },
    { label: "Write-off tracking", values: { standard: false, quickservice: false, fullservice: true } },
  ]},
  { label: "Workforce", rows: [
    { label: "Clock in and out", values: { standard: true, quickservice: true, fullservice: true } },
    { label: "Roles and permissions", values: { standard: false, quickservice: true, fullservice: true } },
    { label: "Shift summary", values: { standard: false, quickservice: true, fullservice: true } },
    { label: "Cash drawer sessions", values: { standard: false, quickservice: true, fullservice: true } },
  ]},
  { label: "Reports and AI", rows: [
    { label: "End of day", values: { standard: true, quickservice: true, fullservice: true } },
    { label: "Sales analytics", values: { standard: false, quickservice: true, fullservice: true } },
    { label: "AI report generation", values: { standard: false, quickservice: true, fullservice: true } },
  ]},
  { label: "Security", rows: [
    { label: "MPIN gate", values: { standard: true, quickservice: true, fullservice: true } },
    { label: "Device PIN lockout", values: { standard: true, quickservice: true, fullservice: true } },
    { label: "Audit log", values: { standard: false, quickservice: false, fullservice: true } },
  ]},
];
const MODE_TITLE_TO_KEY: Record<string, ModeKey> = { "Standard": "standard", "Quick Service": "quickservice", "Full Service": "fullservice" };

const answerPlanQuestion = (q: string, bestTitle: string): string => {
  const t = q.toLowerCase();
  const featureHit = (kw: string[]) => {
    for (const section of PLAN_SECTIONS) {
      for (const row of section.rows) {
        const lbl = row.label.toLowerCase();
        if (kw.some((k) => lbl.includes(k))) {
          const modes = MODE_META.filter((m) => row.values[m.id]).map((m) => m.title);
          return `**${row.label}** is available in ${modes.length ? modes.join(", ") : "no plans"}.`;
        }
      }
    }
    return null;
  };
  if (/differen|compare|vs|between/.test(t)) {
    return `**Standard** covers the basics: quick orders, card or cash, end of day. **Quick Service** adds hold and fire, split payments, tips, KDS, guest profiles, inventory, and shift summaries. **Full Service** adds floor plans, open checks, coursing, reservations, transfers, split checks, and audit logs.`;
  }
  if (/recommend|best|suggest|which/.test(t)) {
    return `Based on your business, **${bestTitle}** is the best match. You can still pick any plan; you can switch later.`;
  }
  if (/price|cost|trial|free|pay/.test(t)) {
    return `All plans start with a 14-day free trial. You can change plans anytime from settings.`;
  }
  const hit =
    featureHit(["kds", "kitchen"]) ||
    featureHit(["table", "floor"]) ||
    featureHit(["reservation", "waitlist"]) ||
    featureHit(["tip", "gratuity"]) ||
    featureHit(["split"]) ||
    featureHit(["inventory", "stock"]) ||
    featureHit(["report", "analytics", "ai"]) ||
    featureHit(["audit"]);
  if (hit) return hit;
  return `Good question. ${bestTitle} is the best match for your business. Open the comparison above to see which features are in each plan, or ask about a specific feature like KDS, tables, tips, or reports.`;
};

const TYPE_TO_BEST_MODE: Record<string, string> = {
  "Cafe": "Quick Service",
  "Quick Service": "Quick Service",
  "Food Truck": "Quick Service",
  "Bakery": "Quick Service",
  "Cloud Kitchen": "Quick Service",
  "Food Court": "Quick Service",
  "Full Service": "Full Service",
  "Fine Dining": "Full Service",
  "Bar and Pub": "Full Service",
};
const bestModeFor = (type?: string) =>
  (type && TYPE_TO_BEST_MODE[type]) || "Standard";

type Collected = {
  place?: PlaceResult | null;
  restaurantName?: string;
  email?: string;
  password?: string;
  country?: string;
  restaurantType?: string;
  locations?: string;
  revenue?: string;
  mode?: string;
  isPersonal?: boolean;
};

const OnboardingAppAI = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [step, setStep] = useState<Step>("initial");
  const [collected, setCollected] = useState<Collected>({});
  const [input, setInput] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countryPickerOpen, setCountryPickerOpen] = useState(false);
  const [comparePlansOpen, setComparePlansOpen] = useState(false);
  const [planQuestion, setPlanQuestion] = useState("");
  const [openPlanSections, setOpenPlanSections] = useState<Record<string, boolean>>({});

  const [placeResults, setPlaceResults] = useState<PlaceResult[]>([]);
  const [placeLoading, setPlaceLoading] = useState(false);
  const [loc, setLoc] = useState<{ lat: number; lng: number } | null>(null);
  const debounceRef = useRef<number | null>(null);
  const sessionTokenRef = useRef<string>(
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()}`,
  );

  useEffect(() => {
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (p) => setLoc({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => {},
      { enableHighAccuracy: false, timeout: 4000 },
    );
  }, []);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [showBranding, setShowBranding] = useState(false);
  const [showFirstQuestion, setShowFirstQuestion] = useState(false);
  const [showFirstButtons, setShowFirstButtons] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setShowBranding(true), 200);
    const t2 = setTimeout(() => setShowFirstQuestion(true), 700);
    const t3 = setTimeout(() => setShowFirstButtons(true), 1000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      const c = scrollRef.current;
      c.scrollTo({ top: c.scrollHeight, behavior: "smooth" });
    }
  }, [messages, step]);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [step]);

  const pushAssistant = (content: string) =>
    setMessages((prev) => [...prev, { id: `${Date.now()}-a-${Math.random()}`, role: "assistant", content }]);
  const pushUser = (content: string, msgStep?: Step) =>
    setMessages((prev) => [...prev, { id: `${Date.now()}-u-${Math.random()}`, role: "user", content, step: msgStep ?? step }]);

  const handleEditLast = (msg: Message) => {
    if (!msg.step) return;
    if (msg.step === "su-password" || msg.step === "si-password") return;
    if (msg.step === "su-country") {
      setCountryPickerOpen(true);
      return;
    }
    setMessages((prev) => {
      const idx = prev.findIndex((m) => m.id === msg.id);
      return idx === -1 ? prev : prev.slice(0, idx);
    });
    setStep(msg.step);
    setInput(msg.content);
    setPassword("");
    setError(null);
    setPlaceResults([]);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const updateCountrySelection = (country: string) => {
    setCollected((c) => ({ ...c, country }));
    setMessages((prev) => {
      // Update the last su-country user message in place
      for (let i = prev.length - 1; i >= 0; i--) {
        if (prev[i].role === "user" && prev[i].step === "su-country") {
          const next = [...prev];
          next[i] = { ...next[i], content: country };
          return next;
        }
      }
      return prev;
    });
    setCountryPickerOpen(false);
  };

  const lastUserIdx = (() => {
    for (let i = messages.length - 1; i >= 0; i--) if (messages[i].role === "user") return i;
    return -1;
  })();

  const handleClose = () => {
    const params = new URLSearchParams();
    if (collected.email) params.set("email", collected.email);
    if (collected.restaurantName) params.set("restaurantName", collected.restaurantName);
    if (collected.country) params.set("country", collected.country);
    const qs = params.toString();
    navigate(`/onboarding/app/signup-signin${qs ? `?${qs}` : ""}`);
  };

  // Intent selection
  const handleIntent = (intent: "signup" | "signin" | "manual") => {
    if (intent === "manual") {
      navigate("/onboarding/app/signup-signin");
      return;
    }
    if (intent === "signup") {
      pushUser("Sign up");
      pushAssistant("Awesome! Let's set up your restaurant. What's your restaurant's name?");
      setStep("su-restaurant");
      return;
    }
    pushUser("Sign in");
    pushAssistant("Welcome back! What's the email on your account?");
    setStep("si-email");
  };

  // Google Places lookup for restaurant
  useEffect(() => {
    if (step !== "su-restaurant") return;
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    if (!input.trim()) {
      setPlaceResults([]);
      setPlaceLoading(false);
      return;
    }
    setPlaceLoading(true);
    const q = input.trim().toLowerCase();
    const dummyFallback = DUMMY_RESTAURANTS.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.address.toLowerCase().includes(q) ||
        r.business_type.toLowerCase().includes(q),
    );
    debounceRef.current = window.setTimeout(async () => {
      try {
        const body: Record<string, unknown> = {
          textQuery: input,
          maxResultCount: 3,
          includedType: "restaurant",
        };
        if (loc) {
          body.locationBias = {
            circle: { center: { latitude: loc.lat, longitude: loc.lng }, radius: 20000 },
          };
        }
        const res = await fetch(`${GATEWAY_URL}/places/v1/places:searchText`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-FieldMask":
              "places.id,places.displayName,places.formattedAddress,places.location,places.types,places.primaryType",
            "X-Session-Token": sessionTokenRef.current,
          },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error("places failed");
        const data = await res.json();
        const places: PlaceResult[] = (data.places ?? []).slice(0, 3).map((p: any) => ({
          place_id: p.id,
          name: p.displayName?.text ?? "Unknown",
          address: p.formattedAddress ?? "",
          business_type: p.primaryType ?? "Restaurant",
          distance_km: null,
          lat: p.location?.latitude,
          lng: p.location?.longitude,
        }));
        setPlaceResults(places.length ? places : (dummyFallback.length ? dummyFallback : DUMMY_RESTAURANTS));
      } catch {
        setPlaceResults(dummyFallback.length ? dummyFallback : DUMMY_RESTAURANTS);
      } finally {
        setPlaceLoading(false);
      }
    }, 300);
  }, [input, step, loc]);

  const pickPlace = (p: PlaceResult) => {
    pushUser(p.name);
    setCollected((c) => ({ ...c, place: p, restaurantName: p.name }));
    setInput("");
    setPlaceResults([]);
    pushAssistant(`Great, ${p.name}! What email should we use for your account?`);
    setStep("su-email");
  };

  const useTypedRestaurantName = () => {
    const name = input.trim();
    if (name.length < 2) return;
    pushUser(name);
    setCollected((c) => ({ ...c, restaurantName: name }));
    setInput("");
    setPlaceResults([]);
    pushAssistant(`Great, ${name}! What email should we use for your account?`);
    setStep("su-email");
  };

  // Email handlers
  const submitSignupEmail = () => {
    const email = input.trim();
    if (!EMAIL_RE.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    setError(null);
    const isPersonal = PERSONAL_DOMAINS.has(email.split("@")[1]?.toLowerCase() ?? "");
    pushUser(email);
    setCollected((c) => ({ ...c, email, isPersonal }));
    setInput("");
    pushAssistant("Got it. Please choose a password (8 characters minimum).");
    setStep("su-password");
  };

  const submitSignupPassword = () => {
    if (password.length < 8) {
      setError("Minimum 8 characters required.");
      return;
    }
    setError(null);
    pushUser("••••••••");
    setCollected((c) => ({ ...c, password }));
    setPassword("");
    const detected = detectCountry();
    pushAssistant(`I detected your country as **${detected}**. You can tap edit to change it.`);
    setMessages((prev) => [
      ...prev,
      { id: `${Date.now()}-u-country-${Math.random()}`, role: "user", content: detected, step: "su-country" },
    ]);
    setCollected((c) => ({ ...c, country: detected }));
    pushAssistant("What type of business do you run?");
    setStep("su-type");
  };

  const pickCountry = (country: string) => {
    pushUser(country);
    setCollected((c) => ({ ...c, country }));
    pushAssistant("What type of business do you run?");
    setStep("su-type");
  };

  const pickType = (type: string) => {
    if (type === "Other") {
      pushUser("Other");
      pushAssistant("No problem. What type of business is it?");
      setInput("");
      setStep("su-type-other");
      return;
    }
    pushUser(type);
    setCollected((c) => ({ ...c, restaurantType: type }));
    pushAssistant("How many locations do you operate?");
    setStep("su-locations");
  };

  const submitTypeOther = () => {
    const t = input.trim();
    if (t.length < 2) return;
    pushUser(t);
    setCollected((c) => ({ ...c, restaurantType: t }));
    setInput("");
    pushAssistant("How many locations do you operate?");
    setStep("su-locations");
  };

  const pickLocations = (loc: string) => {
    pushUser(loc);
    setCollected((c) => ({ ...c, locations: loc }));
    pushAssistant("What's your approximate annual revenue?");
    setStep("su-revenue");
  };

  const pickRevenue = (rev: string) => {
    pushUser(rev);
    setCollected((c) => ({ ...c, revenue: rev }));
    const best = bestModeFor(collected.restaurantType);
    const typeLabel = collected.restaurantType ? `**${collected.restaurantType}**` : "your business";
    pushAssistant(
      `Last step. Pick a Point of Sale mode. Based on ${typeLabel}, **${best}** is the best match.`
    );
    setStep("su-mode");
  };

  const pickMode = (mode: string) => {
    pushUser(mode);
    const next = { ...collected, mode };
    setCollected(next);
    setStep("su-creating");
    pushAssistant("Creating your Point of Sale Ai account...");
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      pushAssistant("You're all set! Your 14-day free trial has started. Welcome to Point of Sale Ai.");
      setTimeout(() => {
        navigate("/onboarding/app/signup/trial", {
          state: {
            email: next.email,
            country: next.country,
            place: next.place,
            mode: next.mode,
            demo: next.isPersonal,
          },
        });
      }, 1200);
    }, 1800);
  };

  // Sign in
  const submitSigninEmail = () => {
    const email = input.trim();
    if (!EMAIL_RE.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    setError(null);
    pushUser(email);
    setCollected((c) => ({ ...c, email }));
    setInput("");
    pushAssistant("And your password?");
    setStep("si-password");
  };

  const submitSigninPassword = async () => {
    if (!password) {
      setError("Please enter your password.");
      return;
    }
    setError(null);
    pushUser("••••••••");
    const pwd = password;
    setPassword("");
    setStep("si-submitting");
    setIsLoading(true);
    try {
      const res = await fetch("/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: collected.email, password: pwd, app_type: "POS" }),
      }).catch(() => null);
      const ok = res && res.ok;
      setIsLoading(false);
      if (ok) {
        pushAssistant("Signed in successfully!");
        setTimeout(() => navigate("/onboarding/app/signin/success"), 700);
      } else {
        pushAssistant("Sorry, that didn't work. The email or password seems incorrect. Want to try again or create a new account?");
        setStep("si-error");
      }
    } catch {
      setIsLoading(false);
      pushAssistant("Something went wrong. Want to try again or create a new account?");
      setStep("si-error");
    }
  };

  // Chip render helper
  const Chip = ({ label, accent, onClick }: { label: string; accent?: boolean; onClick: () => void }) => (
    <button
      onClick={onClick}
      className={
        accent
          ? "px-4 py-2 rounded-full text-sm font-medium border border-primary/30 bg-primary/10 hover:bg-primary/20 text-primary transition-all hover:scale-[1.02] active:scale-[0.98]"
          : "px-4 py-2 rounded-full text-sm font-medium border border-foreground/[0.1] bg-foreground/[0.03] hover:bg-foreground/[0.06] text-foreground/70 hover:text-foreground transition-all hover:scale-[1.02] active:scale-[0.98]"
      }
    >
      {label}
    </button>
  );

  const renderChipsForStep = () => {
    if (isLoading) return null;
    if (step === "su-country") {
      return (
        <div className="flex flex-wrap gap-2 pl-7 pt-3 pb-2">
          {COUNTRIES.slice(0, 6).map((c) => <Chip key={c} label={c} onClick={() => pickCountry(c)} />)}
        </div>
      );
    }
    if (step === "su-type") {
      return (
        <div className="flex flex-wrap gap-2 pl-7 pt-3 pb-2">
          {RESTAURANT_TYPES.map((t) => <Chip key={t} label={t} onClick={() => pickType(t)} />)}
        </div>
      );
    }
    if (step === "su-locations") {
      return (
        <div className="flex flex-wrap gap-2 pl-7 pt-3 pb-2">
          {LOCATION_OPTIONS.map((l) => <Chip key={l} label={l} onClick={() => pickLocations(l)} />)}
        </div>
      );
    }
    if (step === "su-revenue") {
      return (
        <div className="flex flex-wrap gap-2 pl-7 pt-3 pb-2">
          {REVENUE_OPTIONS.map((r) => <Chip key={r} label={r} onClick={() => pickRevenue(r)} />)}
        </div>
      );
    }
    if (step === "su-mode") {
      const best = bestModeFor(collected.restaurantType);
      return (
        <div className="pl-7 pt-3 pb-2">
          <div className="flex flex-wrap gap-2">
            {MODE_OPTIONS.map((m) => <Chip key={m} label={m} accent={m === best} onClick={() => pickMode(m)} />)}
          </div>
          <button
            type="button"
            onClick={() => setComparePlansOpen(true)}
            className="mt-2 text-xs font-semibold text-primary hover:underline underline-offset-4 active:opacity-70 transition-opacity"
          >
            Compare plans
          </button>
        </div>
      );
    }
    if (step === "si-error") {
      return (
        <div className="flex flex-wrap gap-2 pl-7 pt-3 pb-2">
          <Chip
            label="Try again"
            accent
            onClick={() => {
              setStep("si-email");
              pushAssistant("No problem. What email should we try?");
            }}
          />
          <Chip
            label="Create a new account"
            onClick={() => {
              setStep("su-restaurant");
              pushAssistant("Let's set up a new account. What's your restaurant's name?");
            }}
          />
          <Chip label="Set up manually" onClick={() => navigate("/onboarding/app/signup-signin")} />
        </div>
      );
    }
    return null;
  };

  const renderInputBar = () => {
    if (step === "initial" || isLoading) return null;
    if (step === "su-creating" || step === "si-submitting") return null;
    if (["su-country", "su-type", "su-locations", "su-revenue", "su-mode", "si-error"].includes(step)) return null;

    if (step === "su-password" || step === "si-password") {
      return (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => { setPassword(e.target.value); if (error) setError(null); }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    if (step === "su-password") submitSignupPassword();
                    else submitSigninPassword();
                  }
                }}
                placeholder="Enter password..."
                className="w-full bg-foreground/[0.04] border border-foreground/[0.08] rounded-xl pl-3.5 pr-10 py-2.5 text-sm text-foreground placeholder:text-foreground/30 outline-none focus:border-primary/30 transition-colors"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-md flex items-center justify-center hover:bg-foreground/[0.06] text-foreground/50"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <button
              onClick={() => (step === "su-password" ? submitSignupPassword() : submitSigninPassword())}
              disabled={password.length < (step === "su-password" ? 8 : 1)}
              className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center hover:bg-primary/90 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <Send className="w-4 h-4 text-primary-foreground" />
            </button>
          </div>
          {error && <p className="text-xs text-destructive pl-1">{error}</p>}
        </div>
      );
    }

    const onSend = () => {
      if (step === "su-restaurant") useTypedRestaurantName();
      else if (step === "su-email") submitSignupEmail();
      else if (step === "si-email") submitSigninEmail();
      else if (step === "su-type-other") submitTypeOther();
    };

    const placeholder =
      step === "su-restaurant" ? "Search for your restaurant..." :
      step === "su-email" || step === "si-email" ? "name@example.com" :
      step === "su-type-other" ? "e.g. Juice Bar, Ghost Kitchen..." :
      "Type a message...";

    return (
      <div className="flex flex-col gap-2">
        {step === "su-restaurant" && (placeLoading || placeResults.length > 0) && (
          <div className="rounded-xl border border-foreground/[0.08] bg-foreground/[0.03] divide-y divide-foreground/[0.06] overflow-hidden">
            {placeLoading && (
              <div className="flex items-center gap-2 px-3 py-2 text-xs text-foreground/40">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Searching...
              </div>
            )}
            {placeResults.map((p) => (
              <button
                key={p.place_id}
                onClick={() => pickPlace(p)}
                className="w-full flex items-start gap-2 px-3 py-2.5 text-left hover:bg-foreground/[0.04] transition-colors"
              >
                <MapPin className="w-4 h-4 text-foreground/40 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                  <p className="text-[11px] text-foreground/40 truncate">{p.address}</p>
                </div>
              </button>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            {step === "su-restaurant" && (
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/30" />
            )}
            <input
              ref={inputRef}
              type={step === "su-email" || step === "si-email" ? "email" : "text"}
              value={input}
              onChange={(e) => { setInput(e.target.value); if (error) setError(null); }}
              onKeyDown={(e) => e.key === "Enter" && onSend()}
              placeholder={placeholder}
              className={`w-full bg-foreground/[0.04] border border-foreground/[0.08] rounded-xl ${step === "su-restaurant" ? "pl-10" : "pl-3.5"} pr-3.5 py-2.5 text-sm text-foreground placeholder:text-foreground/30 outline-none focus:border-primary/30 transition-colors`}
              autoFocus
            />
          </div>
          <button
            onClick={onSend}
            disabled={!input.trim()}
            className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center hover:bg-primary/90 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <Send className="w-4 h-4 text-primary-foreground" />
          </button>
        </div>
        {error && <p className="text-xs text-destructive pl-1">{error}</p>}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 login-bg flex flex-col overflow-hidden">
      <div className="absolute inset-0 gradient-mesh opacity-30 pointer-events-none" />
      <div className="relative z-10 flex flex-col h-full max-w-md mx-auto w-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.3 }}
          className="flex items-center justify-between px-6 py-4 flex-shrink-0"
        >
          <div className="flex items-center gap-3">
            <AnimatedAIIcon size={28} />
            <div>
              <p className="text-sm font-semibold text-foreground">Point of Sale Ai</p>
              <p className="text-[11px] text-foreground/40">Let me help you get started</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-foreground/[0.06] transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4 text-foreground/50" />
          </button>
        </motion.div>

        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-6 py-6 scrollbar-hide flex flex-col"
          style={{ scrollBehavior: "smooth" }}
        >
          <AnimatePresence mode="wait">
            {step === "initial" ? (
              <motion.div key="initial" className="flex flex-col h-full" exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
                <div className="flex-1 flex flex-col items-center justify-center gap-4">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={showBranding ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className="w-20 h-20 rounded-2xl bg-foreground/[0.06] border border-foreground/[0.08] flex items-center justify-center backdrop-blur-sm"
                  >
                    <AnimatedAIIcon size={40} />
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={showBranding ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    className="text-center space-y-2"
                  >
                    <h2 className="text-xl font-semibold text-foreground tracking-tight">
                      Get Started with Point of Sale Ai
                    </h2>
                    <p className="text-sm text-foreground/40 max-w-[280px] mx-auto leading-relaxed">
                      I'll guide you through setup in just a few minutes.
                    </p>
                  </motion.div>
                </div>

                <div className="space-y-3 pb-2">
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={showFirstQuestion ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="flex justify-start"
                  >
                    <div className="flex-shrink-0 mr-2 mt-1">
                      <AnimatedAIIcon size={18} />
                    </div>
                    <div className="max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm bg-foreground/[0.04] text-foreground">
                      <p>Hi! I'm Point of Sale Ai. I can help you sign up, sign in, or set up your account. What would you like to do?</p>
                    </div>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={showFirstButtons ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="flex flex-wrap gap-2 pl-7"
                  >
                    <Chip label="Sign up" accent onClick={() => handleIntent("signup")} />
                    <Chip label="Sign in" onClick={() => handleIntent("signin")} />
                    <Chip label="Set up manually" onClick={() => handleIntent("manual")} />
                  </motion.div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="chat"
                className="flex flex-col h-full"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.05 }}
              >
                <div className="flex-1 space-y-4">
                  {messages.map((msg, i) => {
                    const isCountryMsg = msg.role === "user" && msg.step === "su-country";
                    const isEditable =
                      msg.role === "user" &&
                      !isLoading &&
                      msg.step &&
                      msg.step !== "su-password" &&
                      msg.step !== "si-password" &&
                      msg.step !== "su-creating" &&
                      msg.step !== "si-submitting" &&
                      (isCountryMsg || i === lastUserIdx);
                    return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: Math.min(i, 4) * 0.05, ease: "easeOut" }}
                      className={`flex items-end gap-1.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      {msg.role === "assistant" && (
                        <div className="flex-shrink-0 mr-2 mt-1">
                          <AnimatedAIIcon size={18} />
                        </div>
                      )}
                      <div
                        className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm ${
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-foreground/[0.04] text-foreground"
                        }`}
                      >
                        {msg.role === "assistant" ? (
                          <div className="prose prose-sm prose-invert max-w-none [&>p]:m-0 [&>p+p]:mt-2">
                            <ReactMarkdown>{msg.content || "..."}</ReactMarkdown>
                          </div>
                        ) : (
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        )}
                      </div>
                      {isEditable && (
                        <button
                          onClick={() => handleEditLast(msg)}
                          className="flex-shrink-0 w-6 h-6 rounded-full bg-foreground/[0.06] hover:bg-foreground/[0.12] flex items-center justify-center transition-colors mb-1"
                          aria-label="Edit"
                        >
                          <Pencil className="w-3 h-3 text-foreground/60" />
                        </button>
                      )}
                    </motion.div>
                    );
                  })}
                  {isLoading && (
                    <div className="flex items-center gap-2 text-foreground/40">
                      <AnimatedAIIcon size={18} />
                      <div className="flex items-center gap-1.5 bg-foreground/[0.04] rounded-2xl px-3.5 py-2.5">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span className="text-sm">Thinking...</span>
                      </div>
                    </div>
                  )}
                </div>
                {renderChipsForStep()}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Input bar */}
        {step !== "initial" && (
          <div
            className="px-6 pt-3 pb-4 flex-shrink-0 border-t border-foreground/[0.04]"
            style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
          >
            {renderInputBar()}
          </div>
        )}
      </div>

      <AnimatePresence>
        {countryPickerOpen && (
          <motion.div
            className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setCountryPickerOpen(false)}
            />
            <motion.div
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 24, opacity: 0 }}
              transition={{ duration: 0.22 }}
              className="relative w-full sm:w-[420px] max-h-[70vh] bg-background border border-foreground/[0.08] rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col"
            >
              <div className="px-5 pt-4 pb-3 border-b border-foreground/[0.06] flex items-center justify-between">
                <span className="text-sm font-semibold">Select country</span>
                <button
                  type="button"
                  onClick={() => setCountryPickerOpen(false)}
                  className="text-xs text-foreground/60 hover:text-foreground"
                >
                  Close
                </button>
              </div>
              <div className="flex-1 overflow-y-auto py-2">
                {COUNTRIES.map((c) => {
                  const selected = c === collected.country;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => updateCountrySelection(c)}
                      className={`w-full flex items-center gap-3 px-5 py-3 text-left text-sm transition-colors ${
                        selected ? "bg-primary/10 text-primary" : "hover:bg-foreground/[0.04]"
                      }`}
                    >
                      <span className="text-base">{COUNTRY_FLAGS[c] || "\ud83c\udf10"}</span>
                      <span className="flex-1">{c}</span>
                      {selected && <span className="text-xs">Selected</span>}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {comparePlansOpen && (() => {
          const bestTitle = bestModeFor(collected.restaurantType);
          const bestKey = MODE_TITLE_TO_KEY[bestTitle];
          const submitPlanQuestion = () => {
            const q = planQuestion.trim();
            if (!q) return;
            setPlanQuestion("");
            setComparePlansOpen(false);
            pushUser(q);
            setIsLoading(true);
            setTimeout(() => {
              setIsLoading(false);
              pushAssistant(answerPlanQuestion(q, bestTitle));
            }, 600);
          };
          return (
            <motion.div
              className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => setComparePlansOpen(false)}
              />
              <motion.div
                initial={{ y: 24, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 24, opacity: 0 }}
                transition={{ duration: 0.22 }}
                className="relative w-full sm:w-[460px] max-h-[88vh] bg-background border border-foreground/[0.08] rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col"
              >
                <div className="px-5 pt-4 pb-3 border-b border-foreground/[0.06] flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold">Compare plans</div>
                    <div className="text-[11px] text-foreground/60">Recommended for you: {bestTitle}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setComparePlansOpen(false)}
                    aria-label="Close"
                    className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-foreground/[0.06] text-foreground/70"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto px-4 py-3">
                  <div className="grid gap-x-1" style={{ gridTemplateColumns: "1.6fr 1fr 1fr 1fr" }}>
                    <div />
                    {MODE_META.map((m) => {
                      const isSel = m.id === bestKey;
                      const Icon = m.icon;
                      return (
                        <div
                          key={m.id}
                          className={`relative flex flex-col items-center justify-start gap-1 px-1 pt-3 pb-2 ${
                            isSel ? "bg-primary/[0.07] border-[1.5px] border-primary rounded-xl" : "border-[1.5px] border-transparent"
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
                          <span className={`text-[11px] font-semibold text-center ${isSel ? "text-foreground" : "text-foreground/50"}`}>
                            {m.title}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-3 flex flex-col gap-1.5">
                    {PLAN_SECTIONS.map((section) => {
                      const isOpen = !!openPlanSections[section.label];
                      const count = section.rows.filter((r) => r.values[bestKey]).length;
                      return (
                        <div key={section.label} className="rounded-xl bg-foreground/[0.03]">
                          <button
                            type="button"
                            onClick={() => setOpenPlanSections((s) => ({ ...s, [section.label]: !s[section.label] }))}
                            className="w-full flex items-center justify-between px-3 py-2.5 active:opacity-70 transition-opacity"
                            aria-expanded={isOpen}
                          >
                            <span className="font-semibold uppercase text-foreground/50" style={{ fontSize: "10px", letterSpacing: "0.6px" }}>
                              {section.label}
                            </span>
                            <span className="flex items-center gap-2">
                              <span className="text-[11px] font-semibold text-foreground/60 tabular-nums">
                                {count}/{section.rows.length}
                              </span>
                              <ChevronDown className={`w-4 h-4 text-foreground/50 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                            </span>
                          </button>
                          <div className="grid transition-[grid-template-rows] duration-200 ease-out" style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}>
                            <div className="overflow-hidden">
                              <div className="px-2 pb-2">
                                {section.rows.map((row, rIdx) => {
                                  const isFirst = rIdx === 0;
                                  const isLast = rIdx === section.rows.length - 1;
                                  return (
                                    <div key={row.label} className="grid items-stretch" style={{ gridTemplateColumns: "1.6fr 1fr 1fr 1fr" }}>
                                      <div className="px-1 py-1.5 text-xs font-medium text-foreground">{row.label}</div>
                                      {MODE_META.map((m) => {
                                        const isSel = m.id === bestKey;
                                        const on = row.values[m.id];
                                        return (
                                          <div
                                            key={m.id}
                                            className={`flex items-center justify-center py-1.5 ${
                                              isSel
                                                ? `bg-primary/[0.07] border-l-[1.5px] border-r-[1.5px] border-primary ${isFirst ? "border-t-[1.5px] rounded-t-xl" : ""} ${isLast ? "border-b-[1.5px] rounded-b-xl" : ""}`
                                                : ""
                                            }`}
                                          >
                                            {on ? <Check className="w-4 h-4 text-primary" strokeWidth={2.5} /> : <Minus className="w-4 h-4 text-foreground/25" />}
                                          </div>
                                        );
                                      })}
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

                <div className="border-t border-foreground/[0.06] px-4 py-3" style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
                  <div className="text-[11px] text-foreground/60 mb-2">Have a question about the plans? Ask the AI.</div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={planQuestion}
                      onChange={(e) => setPlanQuestion(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") submitPlanQuestion(); }}
                      placeholder="e.g. Does Quick Service include KDS?"
                      className="flex-1 h-10 px-3 rounded-full bg-foreground/[0.05] border border-foreground/[0.08] text-sm text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-primary/40"
                    />
                    <button
                      type="button"
                      onClick={submitPlanQuestion}
                      disabled={!planQuestion.trim()}
                      className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 active:opacity-80 transition-opacity"
                      aria-label="Ask"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>

  );
};

export default OnboardingAppAI;
