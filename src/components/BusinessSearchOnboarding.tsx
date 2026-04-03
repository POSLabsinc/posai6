import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, Building2, ChevronRight, ArrowLeft, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface BusinessDetails {
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  placeId: string;
  categories?: string[];
}

interface BusinessSearchOnboardingProps {
  onNext: (business: BusinessDetails) => void;
  onManualEntry: () => void;
  onBack?: () => void;
}

// Mock Google Places results
const MOCK_BUSINESSES: BusinessDetails[] = [
  { name: "The Capital Grille", address: "1861 International Dr", city: "Tysons Corner", state: "Virginia", country: "United States", placeId: "mock_1" },
  { name: "The Cheesecake Factory", address: "10300 Little Patuxent Pkwy", city: "Columbia", state: "Maryland", country: "United States", placeId: "mock_2" },
  { name: "The Coffee Bean & Tea Leaf", address: "350 S Grand Ave", city: "Los Angeles", state: "California", country: "United States", placeId: "mock_3" },
  { name: "The Halal Guys", address: "307 E 14th St", city: "New York", state: "New York", country: "United States", placeId: "mock_4" },
  { name: "The Original Pancake House", address: "22 E Bellevue Pl", city: "Chicago", state: "Illinois", country: "United States", placeId: "mock_5" },
  { name: "Bella Italia Ristorante", address: "45 High Street", city: "London", state: "England", country: "United Kingdom", placeId: "mock_6" },
  { name: "Blue Bottle Coffee", address: "66 Mint St", city: "San Francisco", state: "California", country: "United States", placeId: "mock_7" },
  { name: "Burger & Lobster", address: "36 Dean St", city: "London", state: "England", country: "United Kingdom", placeId: "mock_8" },
  { name: "Din Tai Fung", address: "1088 Nanjing Rd", city: "Shanghai", state: "Shanghai", country: "China", placeId: "mock_9" },
  { name: "Five Guys Burgers", address: "1400 Chain Bridge Rd", city: "McLean", state: "Virginia", country: "United States", placeId: "mock_10" },
  { name: "Nando's Peri-Peri", address: "200 Wisconsin Ave", city: "Washington", state: "DC", country: "United States", placeId: "mock_11" },
  { name: "Shake Shack", address: "Madison Square Park", city: "New York", state: "New York", country: "United States", placeId: "mock_12" },
  { name: "Sweetgreen", address: "4075 Wilson Blvd", city: "Arlington", state: "Virginia", country: "United States", placeId: "mock_13" },
  { name: "Zuma Restaurant", address: "DIFC Gate Village", city: "Dubai", state: "Dubai", country: "United Arab Emirates", placeId: "mock_14" },
  { name: "Salt Bae Steakhouse", address: "60 Broad St", city: "New York", state: "New York", country: "United States", placeId: "mock_15" },
];

const BUSINESS_CATEGORIES = [
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

type Step = "search" | "category";

const BusinessSearchOnboarding = ({ onNext, onManualEntry, onBack }: BusinessSearchOnboardingProps) => {
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
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

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
  };

  const handleUseCustomName = () => {
    setIsManualEntry(true);
    setShowSuggestions(false);
    setSuggestions([]);
    setNoResults(false);
    setSelectedBusiness(null);
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
      });
      setStep("category");
    }
  };

  const handleCategoryNext = () => {
    if (selectedBusiness && selectedCategories.length > 0) {
      onNext({ ...selectedBusiness, categories: selectedCategories });
    }
  };

  const filteredCategories = categorySearch.trim()
    ? BUSINESS_CATEGORIES.filter((c) => c.name.toLowerCase().includes(categorySearch.toLowerCase()) || c.group.toLowerCase().includes(categorySearch.toLowerCase()))
    : BUSINESS_CATEGORIES;

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
          <Building2 className="w-7 h-7 text-primary" />
        </motion.div>

        <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="text-xl font-semibold text-foreground mb-1.5 text-center">
          What kind of business best describes {selectedBusiness?.name || "your business"}?
        </motion.h1>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="text-sm text-foreground/50 mb-5 text-center leading-relaxed">
          Search or select your business type to help us categorize most of what you sell.
        </motion.p>

        {/* Category search */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="relative w-full mb-3">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/30" />
          <input
            type="text"
            value={categorySearch}
            onChange={(e) => setCategorySearch(e.target.value)}
            placeholder="Search business categories"
            className="w-full h-12 pl-11 pr-4 rounded-2xl border border-foreground/[0.1] bg-foreground/[0.03] text-foreground placeholder:text-foreground/30 text-sm outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ring-offset-background transition-all"
          />
        </motion.div>

        {/* Category list */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="w-full max-h-[280px] overflow-y-auto rounded-2xl border border-foreground/[0.08] bg-foreground/[0.02] mb-4">
          {filteredCategories.map((cat) => {
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
          {filteredCategories.length === 0 && (
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
        <Building2 className="w-7 h-7 text-primary" />
      </motion.div>

      <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="text-xl font-semibold text-foreground mb-1.5 text-center">
        Tell us about your business
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
            placeholder="Search your business name..."
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
