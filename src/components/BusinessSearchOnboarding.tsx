import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, Building2, ChevronRight, ArrowLeft, Loader2, Check, UtensilsCrossed, DollarSign, CreditCard, Landmark, Shield, Zap, Star, Lock, Eye, EyeOff, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface BusinessDetails {
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  placeId: string;
  categories?: string[];
  placeType?: string;
  annualRevenue?: string;
}

interface BusinessSearchOnboardingProps {
  onNext: (business: BusinessDetails) => void;
  onManualEntry: () => void;
  onBack?: () => void;
  onDevicePinComplete?: (pin: string, pinLength: number) => void;
}

// Mock Google Places results with place type
const MOCK_BUSINESSES: BusinessDetails[] = [
  { name: "The Capital Grille", address: "1861 International Dr", city: "Tysons Corner", state: "Virginia", country: "United States", placeId: "mock_1", placeType: "restaurant" },
  { name: "The Cheesecake Factory", address: "10300 Little Patuxent Pkwy", city: "Columbia", state: "Maryland", country: "United States", placeId: "mock_2", placeType: "restaurant" },
  { name: "The Coffee Bean & Tea Leaf", address: "350 S Grand Ave", city: "Los Angeles", state: "California", country: "United States", placeId: "mock_3", placeType: "cafe" },
  { name: "The Halal Guys", address: "307 E 14th St", city: "New York", state: "New York", country: "United States", placeId: "mock_4", placeType: "restaurant" },
  { name: "The Original Pancake House", address: "22 E Bellevue Pl", city: "Chicago", state: "Illinois", country: "United States", placeId: "mock_5", placeType: "restaurant" },
  { name: "Bella Italia Ristorante", address: "45 High Street", city: "London", state: "England", country: "United Kingdom", placeId: "mock_6", placeType: "restaurant" },
  { name: "Blue Bottle Coffee", address: "66 Mint St", city: "San Francisco", state: "California", country: "United States", placeId: "mock_7", placeType: "cafe" },
  { name: "Burger & Lobster", address: "36 Dean St", city: "London", state: "England", country: "United Kingdom", placeId: "mock_8", placeType: "restaurant" },
  { name: "Din Tai Fung", address: "1088 Nanjing Rd", city: "Shanghai", state: "Shanghai", country: "China", placeId: "mock_9", placeType: "restaurant" },
  { name: "Five Guys Burgers", address: "1400 Chain Bridge Rd", city: "McLean", state: "Virginia", country: "United States", placeId: "mock_10", placeType: "restaurant" },
  { name: "Nando's Peri-Peri", address: "200 Wisconsin Ave", city: "Washington", state: "DC", country: "United States", placeId: "mock_11", placeType: "restaurant" },
  { name: "Shake Shack", address: "Madison Square Park", city: "New York", state: "New York", country: "United States", placeId: "mock_12", placeType: "restaurant" },
  { name: "Sweetgreen", address: "4075 Wilson Blvd", city: "Arlington", state: "Virginia", country: "United States", placeId: "mock_13", placeType: "restaurant" },
  { name: "Zuma Restaurant", address: "DIFC Gate Village", city: "Dubai", state: "Dubai", country: "United Arab Emirates", placeId: "mock_14", placeType: "restaurant" },
  { name: "Salt Bae Steakhouse", address: "60 Broad St", city: "New York", state: "New York", country: "United States", placeId: "mock_15", placeType: "restaurant" },
];

const RESTAURANT_TYPES = ["restaurant", "cafe", "bakery", "bar", "food"];

const ALL_CATEGORIES = [
  { name: "Coffee/Tea Cafe", group: "Food and Drink" },
  { name: "Counter Service Restaurant", group: "Food and Drink" },
  { name: "Table Service Restaurant", group: "Food and Drink" },
  { name: "Food Truck/Cart", group: "Food and Drink" },
  { name: "Caterer", group: "Food and Drink" },
  { name: "Bakery", group: "Food and Drink" },
  { name: "Bar/Lounge/Nightclub", group: "Food and Drink" },
  { name: "Brewery/Winery/Distillery", group: "Food and Drink" },
  { name: "Specialty Shop", group: "Retail" },
  { name: "Grocery/Market", group: "Retail" },
  { name: "Clothing/Fashion", group: "Retail" },
  { name: "Electronics Store", group: "Retail" },
  { name: "Beauty/Salon/Spa", group: "Services" },
  { name: "Health/Fitness", group: "Services" },
  { name: "Professional Services", group: "Services" },
  { name: "Entertainment/Events", group: "Services" },
];

const RESTAURANT_CATEGORIES = ALL_CATEGORIES.filter((c) => c.group === "Food and Drink");

const REVENUE_OPTIONS = [
  { label: "Less than $100K", value: "less_100k" },
  { label: "$100K - $250K", value: "100k_250k" },
  { label: "$250K - $1M", value: "250k_1m" },
  { label: "$1M - $5M", value: "1m_5m" },
  { label: "$5M - $25M+", value: "5m_25m_plus" },
];

const PLANS = [
  {
    name: "Starter",
    price: "$0",
    period: "/mo",
    description: "For small businesses just getting started",
    features: ["1 Location", "Basic POS", "Email support", "Standard reports"],
    popular: false,
  },
  {
    name: "Plus",
    price: "$60",
    period: "/mo",
    description: "For growing businesses that need more",
    features: ["Up to 5 Locations", "Advanced POS + KDS", "Priority support", "Advanced analytics", "Online ordering"],
    popular: true,
    trialDays: 30,
  },
  {
    name: "Premium",
    price: "$120",
    period: "/mo",
    description: "For established businesses with multiple locations",
    features: ["Unlimited Locations", "Full suite access", "24/7 phone support", "Custom integrations", "Dedicated account manager"],
    popular: false,
  },
];

type Step = "search" | "category" | "revenue" | "planOrSkip" | "plans" | "bank" | "cardOtp" | "verifyIdentity" | "transferMethod" | "devicePin";

const BusinessSearchOnboarding = ({ onNext, onManualEntry, onBack, onDevicePinComplete }: BusinessSearchOnboardingProps) => {
  const [step, setStep] = useState<Step>("search");
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<BusinessDetails[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<BusinessDetails | null>(null);
  const [isManualEntry, setIsManualEntry] = useState(false);
  const [manualAddress, setManualAddress] = useState("");
  const [noPhysicalAddress, setNoPhysicalAddress] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [noResults, setNoResults] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [categorySearch, setCategorySearch] = useState("");
  const [selectedRevenue, setSelectedRevenue] = useState<string | null>(null);
  const [customRevenue, setCustomRevenue] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardOtp, setCardOtp] = useState(["", "", "", "", "", ""]);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [bankOption, setBankOption] = useState<"posai" | "external">("posai");
  const [showSsn, setShowSsn] = useState(false);
  const [transferMethod, setTransferMethod] = useState<"next-day" | "same-day" | null>(null);
  const [showFinishLaterDialog, setShowFinishLaterDialog] = useState(false);
  const [pinLength, setPinLength] = useState<4 | 6>(4);
  const [devicePin, setDevicePin] = useState("");
  const [confirmDevicePin, setConfirmDevicePin] = useState("");
  const [pinStep, setPinStep] = useState<"choose" | "enter" | "confirm">("choose");
  const [verifyForm, setVerifyForm] = useState({
    firstName: "", lastName: "", phone: "", dob: "",
    address1: "", address2: "", city: "", state: "", zip: "", ssn: "",
    agreedTerms: false,
  });
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const isRestaurant = useMemo(() => {
    if (!selectedBusiness?.placeType) return false;
    return RESTAURANT_TYPES.includes(selectedBusiness.placeType.toLowerCase());
  }, [selectedBusiness]);

  const entityLabel = isRestaurant ? "Restaurant" : "Business";
  const entityLabelLower = isRestaurant ? "restaurant" : "business";

  const visibleCategories = useMemo(() => {
    const base = isRestaurant ? RESTAURANT_CATEGORIES : ALL_CATEGORIES;
    if (!categorySearch.trim()) return base;
    const q = categorySearch.toLowerCase();
    return base.filter((c) => c.name.toLowerCase().includes(q) || c.group.toLowerCase().includes(q));
  }, [isRestaurant, categorySearch]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const searchBusinesses = useCallback((q: string) => {
    if (q.length < 2) {
      setSuggestions([]);
      setNoResults(false);
      setShowSuggestions(false);
      return;
    }
    setIsSearching(true);
    setNoResults(false);
    debounceRef.current && clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const lower = q.toLowerCase();
      const results = MOCK_BUSINESSES.filter(
        (b) => b.name.toLowerCase().includes(lower) || b.city.toLowerCase().includes(lower) || b.address.toLowerCase().includes(lower)
      ).slice(0, 5);
      setSuggestions(results);
      setShowSuggestions(true);
      setNoResults(results.length === 0);
      setIsSearching(false);
    }, 300);
  }, []);

  const handleInputChange = (val: string) => {
    setQuery(val);
    setSelectedBusiness(null);
    setIsManualEntry(false);
    searchBusinesses(val);
  };

  const handleSelect = (biz: BusinessDetails) => {
    setSelectedBusiness(biz);
    setQuery(biz.name);
    setShowSuggestions(false);
    setSuggestions([]);
    setIsManualEntry(false);
    // Reset categories when selection changes
    setSelectedCategories([]);
  };

  const handleUseCustomName = () => {
    setIsManualEntry(true);
    setShowSuggestions(false);
    setSuggestions([]);
    setNoResults(false);
    setSelectedBusiness(null);
    setSelectedCategories([]);
  };

  const toggleCategory = (name: string) => {
    setSelectedCategories((prev) =>
      prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name]
    );
  };

  const canProceedFromSearch = selectedBusiness || (isManualEntry && query.trim().length > 0 && (noPhysicalAddress || manualAddress.trim().length > 0));

  const handleSearchNext = () => {
    if (selectedBusiness) {
      setStep("category");
    } else if (isManualEntry && query.trim()) {
      setSelectedBusiness({
        name: query.trim(),
        address: noPhysicalAddress ? "No physical address" : manualAddress.trim(),
        city: "",
        state: "",
        country: "",
        placeId: `manual_${Date.now()}`,
        placeType: "business",
      });
      setStep("category");
    }
  };

  const handleCategoryNext = () => {
    if (selectedBusiness && selectedCategories.length > 0) {
      setStep("revenue");
    }
  };

  const handleRevenueNext = () => {
    if (selectedBusiness && (selectedRevenue || customRevenue.trim())) {
      setStep("planOrSkip");
    }
  };

  const handleSelectPlan = (planName: string) => {
    setSelectedPlan(planName);
  };

  const handleStartTrial = () => {
    if (selectedBusiness && selectedPlan) {
      const revenueValue = selectedRevenue === "custom" ? customRevenue.trim() : selectedRevenue;
      onNext({ ...selectedBusiness, categories: selectedCategories, annualRevenue: revenueValue || undefined });
    }
  };

  const handleBankNext = () => {
    if (selectedBusiness) {
      const revenueValue = selectedRevenue === "custom" ? customRevenue.trim() : selectedRevenue;
      onNext({ ...selectedBusiness, categories: selectedCategories, annualRevenue: revenueValue || undefined });
    }
  };

  const HeaderIcon = isRestaurant ? UtensilsCrossed : Building2;

  const selectedPlanData = PLANS.find(p => p.name === selectedPlan);
  const chargeDate = new Date(Date.now() + (selectedPlanData?.trialDays || 7) * 24 * 60 * 60 * 1000).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const hasCardDetails = cardNumber.replace(/\s/g, '').length >= 13 && cardExpiry.replace(/\D/g, '').length >= 4;

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...cardOtp];
    newOtp[index] = value.slice(-1);
    setCardOtp(newOtp);
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !cardOtp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = () => {
    const code = cardOtp.join("");
    if (code.length === 6) {
      setIsVerifyingOtp(true);
      setTimeout(() => {
        setIsVerifyingOtp(false);
        setCardOtp(["", "", "", "", "", ""]);
        setStep("bank");
      }, 1500);
    }
  };

  // Plan or Skip Step (card entry)
  if (step === "planOrSkip") {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative w-full flex flex-col items-center">
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => selectedPlan ? setStep("plans") : setStep("revenue")}
          className="self-start mb-5 flex items-center gap-2 text-sm text-foreground/50 hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </motion.button>

        <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }} className="text-xl font-semibold text-foreground mb-1.5 text-center">
          Enter a credit card to get started
        </motion.h1>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="w-full space-y-3 mb-4 mt-4">
          <input
            type="text"
            inputMode="numeric"
            value={cardNumber}
            onChange={(e) => {
              const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
              const formatted = raw.replace(/(\d{4})(?=\d)/g, '$1 ');
              setCardNumber(formatted);
            }}
            placeholder="Card number"
            maxLength={19}
            className="w-full h-12 px-4 rounded-2xl border border-foreground/[0.1] bg-foreground/[0.03] text-foreground placeholder:text-foreground/30 text-sm outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ring-offset-background transition-all"
          />
          <input
            type="text"
            inputMode="numeric"
            value={cardExpiry}
            onChange={(e) => {
              const raw = e.target.value.replace(/\D/g, '').slice(0, 4);
              let formatted = raw;
              if (raw.length >= 3) {
                formatted = raw.slice(0, 2) + ' / ' + raw.slice(2);
              }
              setCardExpiry(formatted);
            }}
            placeholder="MM / YY"
            maxLength={7}
            className="w-full h-12 px-4 rounded-2xl border border-foreground/[0.1] bg-foreground/[0.03] text-foreground placeholder:text-foreground/30 text-sm outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ring-offset-background transition-all"
          />
        </motion.div>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="text-xs text-foreground/40 mb-5 text-center leading-relaxed">
          {selectedPlan && selectedPlanData ? (
            <>
              By clicking Start {selectedPlan} trial, you accept that this payment method will be automatically charged {selectedPlanData.price}{selectedPlanData.period} starting {chargeDate} until you cancel your subscription. You may cancel at any time from your <span className="underline cursor-pointer text-foreground/60">account settings</span>.
            </>
          ) : (
            <>
              By choosing a plan, you agree to be charged based on your selected subscription. You can manage or cancel your plan at any time in <span className="underline cursor-pointer text-foreground/60">account settings</span>.
            </>
          )}
        </motion.p>

        <div className="w-full flex items-center gap-3">
          {selectedPlan ? (
            <Button onClick={() => setStep("cardOtp")} disabled={!cardNumber.trim() || !cardExpiry.trim()} className="flex-1 h-14 text-base font-medium rounded-2xl" size="lg">
              Start {selectedPlan} Plan
            </Button>
          ) : (
            <Button onClick={() => setStep("plans")} className="flex-1 h-14 text-base font-medium rounded-2xl" size="lg">
              Choose a Plan
            </Button>
          )}
          <button
            onClick={() => setStep("bank")}
            className="h-14 px-6 text-base font-medium text-foreground/70 hover:text-foreground transition-colors"
          >
            Not now
          </button>
        </div>
      </motion.div>
    );
  }

  // Plans Step
  if (step === "plans") {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative w-full flex flex-col items-center">
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => setStep("planOrSkip")}
          className="self-start mb-5 flex items-center gap-2 text-sm text-foreground/50 hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </motion.button>

        <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }} className="text-xl font-semibold text-foreground mb-1.5 text-center">
          Choose a plan
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="text-sm text-foreground/50 mb-5 text-center">
          Select the plan that best fits your {entityLabelLower}.
        </motion.p>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="w-full space-y-3 mb-4">
          {PLANS.map((plan) => {
            const isSelected = selectedPlan === plan.name;
            return (
              <button
                key={plan.name}
                onClick={() => handleSelectPlan(plan.name)}
                className={`w-full text-left rounded-2xl border p-4 transition-all ${
                  isSelected
                    ? "border-primary bg-primary/[0.08]"
                    : "border-foreground/[0.08] bg-foreground/[0.02] hover:bg-foreground/[0.04]"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-semibold text-foreground">{plan.name}</span>
                    {plan.popular && (
                      <span className="text-[10px] font-medium bg-primary/20 text-primary px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Star className="w-3 h-3" /> Popular
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-lg font-bold text-foreground">{plan.price}</span>
                    <span className="text-xs text-foreground/40">{plan.period}</span>
                  </div>
                </div>
                <p className="text-xs text-foreground/50 mb-3">{plan.description}</p>
                <div className="space-y-1.5">
                  {plan.features.map((f, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-primary/60" />
                      <span className="text-xs text-foreground/60">{f}</span>
                    </div>
                  ))}
                </div>
                {plan.trialDays && (
                  <p className="text-xs text-primary mt-3 font-medium">{plan.trialDays}-day free trial included</p>
                )}
              </button>
            );
          })}
        </motion.div>

        <div className="w-full flex items-center gap-3">
          <Button onClick={() => { if (selectedPlan) { hasCardDetails ? setStep("cardOtp") : setStep("planOrSkip"); } }} disabled={!selectedPlan} className="flex-1 h-14 text-base font-medium rounded-2xl" size="lg">
            {selectedPlan ? `Continue with ${selectedPlan}` : "Select a Plan"}
          </Button>
          <button
            onClick={() => { setSelectedPlan(null); setStep("bank"); }}
            className="h-14 px-6 text-base font-medium text-foreground/70 hover:text-foreground transition-colors"
          >
            Not now
          </button>
        </div>
      </motion.div>
    );
  }


  // Card OTP Verification Step
  if (step === "cardOtp") {
    const maskedCard = cardNumber.replace(/\s/g, '').slice(-4);
    const otpComplete = cardOtp.every(d => d !== "");
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative w-full flex flex-col items-center">
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => { setCardOtp(["", "", "", "", "", ""]); setStep("planOrSkip"); }}
          className="self-start mb-5 flex items-center gap-2 text-sm text-foreground/50 hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </motion.button>

        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-5 border border-primary/20">
          <Shield className="w-7 h-7 text-primary" />
        </motion.div>

        <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }} className="text-xl font-semibold text-foreground mb-1.5 text-center">
          Verify your card
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="text-sm text-foreground/50 mb-6 text-center leading-relaxed">
          We sent a 6-digit code to the phone number linked to your card ending in {maskedCard}
        </motion.p>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="flex gap-3 mb-6">
          {cardOtp.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { otpRefs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleOtpChange(i, e.target.value)}
              onKeyDown={(e) => handleOtpKeyDown(i, e)}
              className="w-12 h-14 text-center text-lg font-semibold rounded-2xl border border-foreground/[0.1] bg-foreground/[0.03] text-foreground outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ring-offset-background transition-all"
            />
          ))}
        </motion.div>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="text-xs text-foreground/40 mb-5 text-center">
          Didn't receive a code? <button className="text-primary underline">Resend</button>
        </motion.p>

        <Button onClick={handleVerifyOtp} disabled={!otpComplete || isVerifyingOtp} className="w-full h-14 text-base font-medium rounded-2xl" size="lg">
          {isVerifyingOtp ? (
            <span className="flex items-center gap-2"><Loader2 className="w-5 h-5 animate-spin" /> Verifying...</span>
          ) : (
            `Confirm and Start ${selectedPlan} Plan`
          )}
        </Button>
      </motion.div>
    );
  }

  // Bank Account Step
  if (step === "bank") {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative w-full flex flex-col items-center">
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => setStep("planOrSkip")}
          className="self-start mb-5 flex items-center gap-2 text-sm text-foreground/50 hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </motion.button>

        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-5 border border-primary/20">
          <Landmark className="w-7 h-7 text-primary" />
        </motion.div>

        <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }} className="text-xl font-semibold text-foreground mb-1.5 text-center">
          Access your sales instantly
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="text-sm text-foreground/50 mb-5 text-center leading-relaxed">
          Link a bank account to manage your payouts and payments all in one place.
        </motion.p>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="w-full space-y-3 mb-4">
          {/* POSAI Checking option */}
          <button
            onClick={() => setBankOption("posai")}
            className={`w-full p-4 rounded-2xl text-left transition-all ${bankOption === "posai" ? "border-2 border-primary bg-primary/[0.06]" : "border border-foreground/[0.08] bg-foreground/[0.02]"}`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-foreground">POSAI Checking</span>
              <span className="text-[10px] font-medium bg-primary/20 text-primary px-2 py-0.5 rounded-full">Instant access to sales</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-primary/60" />
                <span className="text-xs text-foreground/60">No monthly fees or minimums</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-primary/60" />
                <span className="text-xs text-foreground/60">Sign up in 2 minutes, spend right away</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-primary/60" />
                <span className="text-xs text-foreground/60">Pay with a debit card, check, or Bill Pay</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-primary/60" />
                <span className="text-xs text-foreground/60">Accept free ACH payments with Invoices</span>
              </div>
            </div>
          </button>

          {/* External bank option */}
          <button
            onClick={() => setBankOption("external")}
            className={`w-full p-4 rounded-2xl text-left transition-all ${bankOption === "external" ? "border-2 border-primary bg-primary/[0.06]" : "border border-foreground/[0.08] bg-foreground/[0.02]"}`}
          >
            <span className="text-sm font-medium text-foreground block mb-1">Use an external bank account</span>
            <p className="text-xs text-foreground/40">
              Funds will be available in your linked account within 1-2 business days, or same-day for a 1.95% fee.
            </p>
          </button>
        </motion.div>

        <Button onClick={() => setStep("verifyIdentity")} className="w-full h-14 text-base font-medium rounded-2xl" size="lg">
          Continue
        </Button>
      </motion.div>
    );
  }

  // Verify Identity Step (for external bank)
  if (step === "verifyIdentity") {
    const US_STATES = ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"];
    const canSubmitVerify = verifyForm.firstName && verifyForm.lastName && verifyForm.dob && verifyForm.address1 && verifyForm.city && verifyForm.state && verifyForm.zip && verifyForm.ssn.length >= 9 && verifyForm.agreedTerms;

    const inputClass = "w-full h-12 px-4 rounded-xl bg-foreground/[0.04] border border-foreground/[0.08] text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-primary/40 transition-colors";

    return (
      <>
      {showFinishLaterDialog && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-background rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
            <h2 className="text-lg font-bold text-foreground mb-2">Finish verification later?</h2>
            <p className="text-sm text-foreground/50 mb-6 leading-relaxed">
              Your account needs to be verified before processing payments. If you exit now, you may need to re-enter some information when you return. Only cash payments will be available until verification is complete.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowFinishLaterDialog(false)} className="flex-1 h-12 rounded-xl text-sm font-medium text-foreground border border-foreground/[0.08] hover:border-foreground/20 transition-colors">
                Continue verification
              </button>
              <Button onClick={() => { setShowFinishLaterDialog(false); setStep("devicePin"); setPinStep("choose"); setDevicePin(""); setConfirmDevicePin(""); }} className="flex-1 h-12 text-sm font-medium rounded-xl" size="sm">
                Finish later
              </Button>
            </div>
          </motion.div>
        </div>
      )}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative w-full flex flex-col items-center max-h-[80vh] overflow-y-auto scrollbar-hide">
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => setStep("bank")}
          className="self-start mb-5 flex items-center gap-2 text-sm text-foreground/50 hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </motion.button>

        <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xl font-semibold text-foreground mb-2 text-left w-full">
          Verify your identity to activate your account
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }} className="text-sm text-foreground/50 mb-6 text-left w-full leading-relaxed">
          Why do we do this? For your safety and to prevent fraud, we require identity verification. POSAI encrypts and protects your data and shares only as described in our <span className="underline cursor-pointer text-foreground/70">privacy notice</span>.
        </motion.p>

        <div className="w-full space-y-3">
          <input type="text" placeholder="Legal first name" value={verifyForm.firstName} onChange={e => setVerifyForm(p => ({ ...p, firstName: e.target.value }))} className={inputClass} />
          <input type="text" placeholder="Legal last name" value={verifyForm.lastName} onChange={e => setVerifyForm(p => ({ ...p, lastName: e.target.value }))} className={inputClass} />

          <div className="rounded-xl bg-foreground/[0.04] border border-foreground/[0.08] px-4 py-2.5">
            <div className="text-xs text-foreground/50 mb-0.5">Phone number</div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-base">🇺🇸</span>
                <span className="text-sm text-foreground/50">+1</span>
              </div>
              <input type="tel" placeholder="(000) 000-0000" value={(() => {
                const digits = verifyForm.phone.replace(/\D/g, '').slice(0, 10);
                if (digits.length === 0) return '';
                if (digits.length <= 3) return `(${digits}`;
                if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
                return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
              })()} onChange={e => {
                const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                setVerifyForm(p => ({ ...p, phone: digits }));
              }} className="w-full bg-transparent text-sm text-foreground placeholder:text-foreground/30 focus:outline-none" />
            </div>
          </div>

          <p className="text-xs text-foreground/40 leading-relaxed">
            By clicking "Next", I certify that I have read POSAI's privacy policy and consent to calls, texts, and automated messages from POSAI regarding my accounts.
          </p>

          <input type="text" placeholder="Date of birth" value={verifyForm.dob} onChange={e => setVerifyForm(p => ({ ...p, dob: e.target.value }))} onFocus={e => { if (!verifyForm.dob) e.target.type = 'date'; }} className={inputClass} />

          <input type="text" placeholder="Address Line 1" value={verifyForm.address1} onChange={e => setVerifyForm(p => ({ ...p, address1: e.target.value }))} className={inputClass} />
          <input type="text" placeholder="Apt, Suite, etc. (Optional)" value={verifyForm.address2} onChange={e => setVerifyForm(p => ({ ...p, address2: e.target.value }))} className={inputClass} />
          <input type="text" placeholder="City" value={verifyForm.city} onChange={e => setVerifyForm(p => ({ ...p, city: e.target.value }))} className={inputClass} />

          <div className="flex gap-3">
            <div className="relative flex-1">
              <select value={verifyForm.state} onChange={e => setVerifyForm(p => ({ ...p, state: e.target.value }))} className={`${inputClass} appearance-none pr-8`}>
                <option value="">State</option>
                {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40 pointer-events-none" />
            </div>
            <input type="text" placeholder="Zip Code" value={verifyForm.zip} onChange={e => setVerifyForm(p => ({ ...p, zip: e.target.value }))} className={`${inputClass} flex-1`} />
          </div>

          <div className="relative">
            <input type={showSsn ? "text" : "password"} placeholder="Full SSN or ITIN" value={verifyForm.ssn} onChange={e => setVerifyForm(p => ({ ...p, ssn: e.target.value.replace(/\D/g, '').slice(0, 9) }))} className={`${inputClass} pr-10`} />
            <button type="button" onClick={() => setShowSsn(!showSsn)} className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground/60">
              {showSsn ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <div className="rounded-xl bg-primary/[0.06] border border-primary/10 px-4 py-3 flex items-start gap-3">
            <Lock className="w-4 h-4 text-primary/60 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-foreground/60 leading-relaxed">
              POSAI uses this for identity verification and tax-reporting. Your information is stored securely with 256-bit encryption. <span className="underline cursor-pointer text-foreground/70">Learn more</span>
            </p>
          </div>

          <div className="rounded-xl bg-foreground/[0.03] border border-foreground/[0.06] px-4 py-3 space-y-2">
            <p className="text-xs text-foreground/40">By tapping "Next", under penalties of perjury, I certify that all of the information provided is true and accurate.</p>
            <p className="text-xs text-foreground/40">Once this information is verified, your POSAI Checking account will be opened and a digital debit card will be issued.</p>
          </div>

          <label className="flex items-start gap-3 cursor-pointer py-1" onClick={() => setVerifyForm(p => ({ ...p, agreedTerms: !p.agreedTerms }))}>
            <div className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${verifyForm.agreedTerms ? "bg-primary border-primary" : "border-foreground/20 bg-transparent"}`}>
              {verifyForm.agreedTerms && <Check className="w-3 h-3 text-primary-foreground" />}
            </div>
            <span className="text-sm text-foreground/70">I have read and agree to the <span className="underline text-foreground">POSAI Checking Terms of Service</span></span>
          </label>

          <p className="text-[10px] text-foreground/30 leading-relaxed pb-2">
            POSAI, Inc. is a financial services platform and not an FDIC-insured bank. FDIC deposit insurance coverage only protects against the failure of an FDIC-insured deposit institution. If you have a POSAI Checking account, up to $250,000 of your balance may be covered by FDIC insurance on a pass-through basis through our partner bank, Member FDIC, subject to aggregation of the account holder's funds held at our partner bank and if certain conditions have been met.
          </p>
        </div>

        <div className="w-full flex gap-3 mt-4">
          <button onClick={() => setShowFinishLaterDialog(true)} className="flex-1 h-14 rounded-2xl text-base font-medium text-foreground/60 hover:text-foreground border border-foreground/[0.08] hover:border-foreground/20 transition-colors">
            Finish later
          </button>
          <Button onClick={() => { if (canSubmitVerify) setStep("transferMethod"); }} disabled={!canSubmitVerify} className="flex-1 h-14 text-base font-medium rounded-2xl" size="lg">
            Next
          </Button>
        </div>
      </motion.div>
      </>
    );
  }

  if (step === "transferMethod") {
    return (
      <>
      {showFinishLaterDialog && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-background rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
            <h2 className="text-lg font-bold text-foreground mb-2">Finish verification later?</h2>
            <p className="text-sm text-foreground/50 mb-6 leading-relaxed">
              Your account needs to be verified before processing payments. If you exit now, you may need to re-enter some information when you return. Only cash payments will be available until verification is complete.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowFinishLaterDialog(false)} className="flex-1 h-12 rounded-xl text-sm font-medium text-foreground border border-foreground/[0.08] hover:border-foreground/20 transition-colors">
                Continue verification
              </button>
              <Button onClick={() => { setShowFinishLaterDialog(false); setStep("devicePin"); setPinStep("choose"); setDevicePin(""); setConfirmDevicePin(""); }} className="flex-1 h-12 text-sm font-medium rounded-xl" size="sm">
                Finish later
              </Button>
            </div>
          </motion.div>
        </div>
      )}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative w-full flex flex-col items-center">
        <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-2xl font-bold text-foreground mb-6 text-left w-full">
          How do you want to get paid?
        </motion.h1>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }} className="text-base font-medium text-foreground mb-4 text-left w-full">
          Transfer to your own bank account
        </motion.p>

        <div className="w-full space-y-4">
          <button
            onClick={() => setTransferMethod("next-day")}
            className={`w-full text-left rounded-2xl border-2 p-5 transition-all ${transferMethod === "next-day" ? "border-foreground bg-foreground/[0.03]" : "border-foreground/[0.08] hover:border-foreground/20"}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-1.5">
                  <span className="text-base font-semibold text-foreground">Next-business-day transfer</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-foreground/[0.06] text-xs font-medium text-foreground/60">Free</span>
                </div>
                <p className="text-sm text-foreground/50">Your funds will be transferred within 1-2 business days.</p>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${transferMethod === "next-day" ? "border-foreground" : "border-foreground/20"}`}>
                {transferMethod === "next-day" && <div className="w-2.5 h-2.5 rounded-full bg-foreground" />}
              </div>
            </div>
          </button>

          <button
            onClick={() => setTransferMethod("same-day")}
            className={`w-full text-left rounded-2xl border-2 p-5 transition-all ${transferMethod === "same-day" ? "border-foreground bg-foreground/[0.03]" : "border-foreground/[0.08] hover:border-foreground/20"}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-1.5">
                  <span className="text-base font-semibold text-foreground">Same-day transfer</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-foreground/[0.06] text-xs font-medium text-foreground/60">1.95% fee</span>
                </div>
                <p className="text-sm text-foreground/50">Funds are sent to your linked bank account at the end of the day.</p>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${transferMethod === "same-day" ? "border-foreground" : "border-foreground/20"}`}>
                {transferMethod === "same-day" && <div className="w-2.5 h-2.5 rounded-full bg-foreground" />}
              </div>
            </div>
          </button>
        </div>

        <div className="w-full flex gap-3 mt-8">
          <button onClick={() => setShowFinishLaterDialog(true)} className="flex-1 h-14 rounded-2xl text-base font-medium text-foreground/60 hover:text-foreground border border-foreground/[0.08] hover:border-foreground/20 transition-colors">
            Skip
          </button>
          <Button onClick={() => { if (transferMethod) { setStep("devicePin"); setPinStep("choose"); setDevicePin(""); setConfirmDevicePin(""); } }} disabled={!transferMethod} className="flex-1 h-14 text-base font-medium rounded-2xl" size="lg">
            Next
          </Button>
        </div>
      </motion.div>
      </>
    );
  }

  // Device PIN Setup Step
  if (step === "devicePin") {
    const maxLen = pinLength;
    const currentPin = pinStep === "confirm" ? confirmDevicePin : devicePin;

    const handlePinDigit = (digit: string) => {
      if (pinStep === "confirm") {
        if (confirmDevicePin.length < maxLen) setConfirmDevicePin(prev => prev + digit);
      } else {
        if (devicePin.length < maxLen) setDevicePin(prev => prev + digit);
      }
    };

    const handlePinBackspace = () => {
      if (pinStep === "confirm") {
        setConfirmDevicePin(prev => prev.slice(0, -1));
      } else {
        setDevicePin(prev => prev.slice(0, -1));
      }
    };

    const finishPinSetup = () => {
      localStorage.setItem("pos_device_pin", devicePin);
      localStorage.setItem("pos_device_pin_length", String(pinLength));
      if (onDevicePinComplete) {
        onDevicePinComplete(devicePin, pinLength);
      } else {
        handleBankNext();
      }
    };

    const handlePinSubmit = () => {
      if (pinStep === "enter" && devicePin.length === maxLen) {
        setPinStep("confirm");
      } else if (pinStep === "confirm" && confirmDevicePin.length === maxLen) {
        if (confirmDevicePin === devicePin) {
          finishPinSetup();
        } else {
          setConfirmDevicePin("");
        }
      }
    };

    // Auto-submit when PIN reaches target length
    if (pinStep === "enter" && devicePin.length === maxLen) {
      setTimeout(() => setPinStep("confirm"), 300);
    }
    if (pinStep === "confirm" && confirmDevicePin.length === maxLen) {
      setTimeout(() => {
        if (confirmDevicePin === devicePin) {
          finishPinSetup();
        } else {
          setConfirmDevicePin("");
        }
      }, 300);
    }

    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative w-full flex flex-col items-center">
        {pinStep === "choose" ? (
          <>
            <button
              onClick={() => setStep("transferMethod")}
              className="self-start mb-4 flex items-center gap-2 text-sm text-foreground/50 hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
              <Lock className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Set Device PIN</h2>
            <p className="text-foreground/50 text-sm mb-8 text-center">Choose your preferred PIN length for device lock screen</p>

            <div className="w-full space-y-3 mb-8">
              {([4, 6] as const).map(len => (
                <button
                  key={len}
                  onClick={() => setPinLength(len)}
                  className={`w-full p-5 rounded-2xl border-2 transition-all text-left ${
                    pinLength === len
                      ? "border-primary bg-primary/10"
                      : "border-foreground/[0.08] hover:border-foreground/20 bg-foreground/[0.03]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-base font-semibold text-foreground">{len}-Digit PIN</p>
                      <p className="text-sm text-foreground/50 mt-1">{len === 4 ? "Quick and easy access" : "Enhanced security"}</p>
                    </div>
                    <div className="flex gap-1.5">
                      {Array.from({ length: len }).map((_, i) => (
                        <div key={i} className={`w-2.5 h-2.5 rounded-full ${pinLength === len ? "bg-primary" : "bg-foreground/20"}`} />
                      ))}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="w-full flex gap-3">
              <Button onClick={() => { setPinStep("enter"); setDevicePin(""); setConfirmDevicePin(""); }} className="w-full h-14 text-base font-medium rounded-2xl" size="lg">
                Continue
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
              <Lock className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              {pinStep === "enter" ? "Enter your PIN" : "Confirm your PIN"}
            </h2>
            <p className="text-foreground/50 text-sm mb-8 text-center">
              {pinStep === "enter" ? `Enter a ${maxLen}-digit PIN for this device` : "Re-enter your PIN to confirm"}
            </p>

            {/* PIN dots */}
            <div className="flex gap-3 mb-8">
              {Array.from({ length: maxLen }).map((_, i) => (
                <div
                  key={i}
                  className={`w-4 h-4 rounded-full transition-all ${
                    i < currentPin.length ? "bg-primary scale-110" : "bg-foreground/20"
                  }`}
                />
              ))}
            </div>

            {pinStep === "confirm" && confirmDevicePin.length === maxLen && confirmDevicePin !== devicePin && (
              <p className="text-destructive text-sm mb-4">PINs don't match. Try again.</p>
            )}

            {/* Numeric keypad */}
            <div className="grid grid-cols-3 gap-3 w-full max-w-[280px]">
              {[1,2,3,4,5,6,7,8,9].map(n => (
                <button
                  key={n}
                  onClick={() => handlePinDigit(String(n))}
                  className="h-16 rounded-2xl text-2xl font-medium text-foreground bg-foreground/[0.05] hover:bg-foreground/[0.1] active:bg-foreground/[0.15] transition-colors"
                >
                  {n}
                </button>
              ))}
              <button
                onClick={() => { setPinStep("choose"); setDevicePin(""); setConfirmDevicePin(""); }}
                className="h-16 rounded-2xl text-sm font-medium text-foreground/50 hover:text-foreground transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => handlePinDigit("0")}
                className="h-16 rounded-2xl text-2xl font-medium text-foreground bg-foreground/[0.05] hover:bg-foreground/[0.1] active:bg-foreground/[0.15] transition-colors"
              >
                0
              </button>
              <button
                onClick={handlePinBackspace}
                className="h-16 rounded-2xl text-sm font-medium text-foreground/50 hover:text-foreground transition-colors"
              >
                ⌫
              </button>
            </div>
          </>
        )}
      </motion.div>
    );
  }


  if (step === "revenue") {
    const canProceedRevenue = selectedRevenue || customRevenue.trim();
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative w-full flex flex-col items-center">
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => setStep("category")}
          className="self-start mb-5 flex items-center gap-2 text-sm text-foreground/50 hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </motion.button>

        <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }} className="text-xl font-semibold text-foreground mb-1.5 text-center">
          What's your annual revenue?
        </motion.h1>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="text-sm text-foreground/50 mb-5 text-center leading-relaxed">
          This helps us provide the best solutions for your {entityLabelLower}.
        </motion.p>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="w-full rounded-2xl border border-foreground/[0.08] bg-foreground/[0.02] mb-4">
          {REVENUE_OPTIONS.map((opt) => {
            const isSelected = selectedRevenue === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => { setSelectedRevenue(opt.value); setCustomRevenue(""); }}
                className={`w-full flex items-center px-4 py-4 border-b border-foreground/[0.06] last:border-b-0 transition-colors text-left ${isSelected ? "bg-primary/[0.08]" : "hover:bg-foreground/[0.04]"}`}
              >
                <p className="text-sm font-medium text-foreground flex-1">{opt.label}</p>
                {isSelected && (
                  <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0 ml-3">
                    <Check className="w-3 h-3 text-primary-foreground" />
                  </div>
                )}
              </button>
            );
          })}

          {/* Not sure yet / manual entry */}
          <button
            onClick={() => { setSelectedRevenue("not_sure"); setCustomRevenue(""); }}
            className={`w-full flex flex-col px-4 py-4 transition-colors text-left ${selectedRevenue === "not_sure" ? "bg-primary/[0.08]" : "hover:bg-foreground/[0.04]"}`}
          >
            <p className="text-sm font-medium text-foreground">Not sure yet</p>
            <p className="text-xs text-foreground/40 mt-0.5">If you're a new {entityLabelLower}, or don't know right now</p>
          </button>
        </motion.div>

        {/* Custom revenue input */}
        <AnimatePresence>
          {selectedRevenue === "custom" && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="w-full mb-4 overflow-hidden">
              <div className="relative">
                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/30" />
                <input
                  type="text"
                  value={customRevenue}
                  onChange={(e) => setCustomRevenue(e.target.value)}
                  placeholder="Enter estimated annual revenue..."
                  className="w-full h-12 pl-11 pr-4 rounded-2xl border border-foreground/[0.1] bg-foreground/[0.03] text-foreground placeholder:text-foreground/30 text-sm outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ring-offset-background transition-all"
                  autoFocus
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <Button
          onClick={handleRevenueNext}
          disabled={!canProceedRevenue}
          className="w-full h-14 text-base font-medium rounded-2xl"
          size="lg"
        >
          Next
        </Button>
      </motion.div>
    );
  }

  // Category Selection Step
  if (step === "category") {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative w-full flex flex-col items-center">
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => setStep("search")}
          className="self-start mb-5 flex items-center gap-2 text-sm text-foreground/50 hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </motion.button>

        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-5 border border-primary/20">
          <HeaderIcon className="w-7 h-7 text-primary" />
        </motion.div>

        <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="text-xl font-semibold text-foreground mb-1.5 text-center">
          What type of {entityLabelLower} is {selectedBusiness?.name || `your ${entityLabelLower}`}?
        </motion.h1>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="text-sm text-foreground/50 mb-5 text-center leading-relaxed">
          {isRestaurant
            ? "Select the restaurant types that best describe your establishment."
            : "Search or select your business type to help us categorize most of what you sell."}
        </motion.p>

        {/* Category search */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="relative w-full mb-3">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/30" />
          <input
            type="text"
            value={categorySearch}
            onChange={(e) => setCategorySearch(e.target.value)}
            placeholder={isRestaurant ? "Search restaurant categories" : "Search business categories"}
            className="w-full h-12 pl-11 pr-4 rounded-2xl border border-foreground/[0.1] bg-foreground/[0.03] text-foreground placeholder:text-foreground/30 text-sm outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ring-offset-background transition-all"
          />
        </motion.div>

        {/* Category list */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="w-full max-h-[280px] overflow-y-auto rounded-2xl border border-foreground/[0.08] bg-foreground/[0.02] mb-4">
          {visibleCategories.map((cat) => {
            const isSelected = selectedCategories.includes(cat.name);
            return (
              <button
                key={cat.name}
                onClick={() => toggleCategory(cat.name)}
                className={`w-full flex items-center justify-between px-4 py-3.5 border-b border-foreground/[0.06] last:border-b-0 transition-colors text-left ${isSelected ? "bg-primary/[0.08]" : "hover:bg-foreground/[0.04]"}`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{cat.name}</p>
                  <p className="text-xs text-foreground/40">{cat.group}</p>
                </div>
                {isSelected && (
                  <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0 ml-3">
                    <Check className="w-3 h-3 text-primary-foreground" />
                  </div>
                )}
              </button>
            );
          })}
          {visibleCategories.length === 0 && (
            <div className="px-4 py-6 text-center text-sm text-foreground/40">No categories found</div>
          )}
        </motion.div>

        {selectedCategories.length > 0 && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-foreground/40 mb-3">
            {selectedCategories.length} selected
          </motion.p>
        )}

        <Button onClick={handleCategoryNext} disabled={selectedCategories.length === 0} className="w-full h-14 text-base font-medium rounded-2xl" size="lg">
          Next
        </Button>
      </motion.div>
    );
  }

  // Search Step
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative w-full flex flex-col items-center">
      {onBack && (
        <motion.button initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} onClick={onBack} className="self-start mb-5 flex items-center gap-2 text-sm text-foreground/50 hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </motion.button>
      )}

      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-5 border border-primary/20">
        {selectedBusiness && isRestaurant ? (
          <UtensilsCrossed className="w-7 h-7 text-primary" />
        ) : (
          <Building2 className="w-7 h-7 text-primary" />
        )}
      </motion.div>

      <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="text-xl font-semibold text-foreground mb-1.5 text-center">
        {selectedBusiness && isRestaurant ? "Tell us about your restaurant" : "Tell us about your business"}
      </motion.h1>

      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="text-sm text-foreground/50 mb-5 text-center leading-relaxed">
        This is what we will use on your emails, receipts, and messages to customers.
      </motion.p>

      {/* Search Input */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} ref={containerRef} className="relative w-full mb-3">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/30" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
            placeholder={selectedBusiness && isRestaurant ? "Search your restaurant name..." : "Search your business name..."}
            className="w-full h-12 pl-11 pr-4 rounded-2xl border border-foreground/[0.1] bg-foreground/[0.03] text-foreground placeholder:text-foreground/30 text-sm outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ring-offset-background transition-all"
            autoFocus
          />
          {isSearching && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <Loader2 className="w-4 h-4 text-primary animate-spin" />
            </div>
          )}
        </div>

        {/* Suggestions dropdown */}
        <AnimatePresence>
          {showSuggestions && suggestions.length > 0 && (
            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="absolute top-full left-0 right-0 mt-1.5 bg-[#252525] rounded-2xl border border-foreground/[0.08] overflow-hidden z-50 shadow-xl">
              {suggestions.map((biz) => (
                <button key={biz.placeId} onClick={() => handleSelect(biz)} className="w-full flex items-start gap-3 px-4 py-3 hover:bg-foreground/[0.06] transition-colors text-left">
                  <MapPin className="w-4 h-4 text-foreground/30 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{biz.name}</p>
                    <p className="text-xs text-foreground/40 truncate">{biz.address}, {biz.city}, {biz.state}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-foreground/20 mt-0.5 flex-shrink-0" />
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* No results - use as custom name */}
        <AnimatePresence>
          {noResults && showSuggestions && (
            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="absolute top-full left-0 right-0 mt-1.5 bg-[#252525] rounded-2xl border border-foreground/[0.08] overflow-hidden z-50 shadow-xl">
              <button onClick={handleUseCustomName} className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-foreground/[0.06] transition-colors text-left">
                <Building2 className="w-4 h-4 text-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">Use "{query}" as business name</p>
                  <p className="text-xs text-foreground/40">Enter address details manually</p>
                </div>
                <ChevronRight className="w-4 h-4 text-foreground/20 flex-shrink-0" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Selected business details */}
      <AnimatePresence>
        {selectedBusiness && !isManualEntry && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="w-full mb-3">
            <div className="bg-foreground/[0.03] border border-foreground/[0.1] rounded-2xl p-4 space-y-2.5">
              {isRestaurant && (
                <DetailRow label="Type" value="Restaurant" />
              )}
              <DetailRow label="Address" value={selectedBusiness.address} />
              <DetailRow label="City" value={selectedBusiness.city} />
              <DetailRow label="State" value={selectedBusiness.state} />
              <DetailRow label="Country" value={selectedBusiness.country} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Manual address entry */}
      <AnimatePresence>
        {isManualEntry && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="w-full space-y-3 mb-3">
            {!noPhysicalAddress && (
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/30" />
                <input
                  type="text"
                  value={manualAddress}
                  onChange={(e) => setManualAddress(e.target.value)}
                  placeholder="Enter your business address..."
                  className="w-full h-12 pl-11 pr-4 rounded-2xl border border-foreground/[0.1] bg-foreground/[0.03] text-foreground placeholder:text-foreground/30 text-sm outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ring-offset-background transition-all"
                />
              </div>
            )}
            <label className="flex items-center gap-3 cursor-pointer px-1">
              <div
                onClick={() => setNoPhysicalAddress(!noPhysicalAddress)}
                className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-colors ${noPhysicalAddress ? "bg-primary border-primary" : "border-foreground/20 bg-transparent"}`}
              >
                {noPhysicalAddress && <Check className="w-3 h-3 text-primary-foreground" />}
              </div>
              <span className="text-sm text-foreground/60">My business doesn't have a permanent physical address</span>
            </label>
          </motion.div>
        )}
      </AnimatePresence>

      <Button onClick={handleSearchNext} disabled={!canProceedFromSearch} className="w-full h-14 text-base font-medium rounded-2xl mt-1" size="lg">
        Next
      </Button>
    </motion.div>
  );
};

const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between">
    <span className="text-xs text-foreground/40">{label}</span>
    <span className="text-xs text-foreground/70 font-medium">{value}</span>
  </div>
);

export default BusinessSearchOnboarding;
