import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, Building2, Sparkles, ChevronRight, Keyboard } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BusinessDetails {
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  placeId: string;
}

interface BusinessSearchOnboardingProps {
  onNext: (business: BusinessDetails) => void;
  onManualEntry: () => void;
}

// Mock Google Places results
const MOCK_BUSINESSES: { name: string; address: string; city: string; state: string; country: string; placeId: string }[] = [
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

const BusinessSearchOnboarding = ({ onNext, onManualEntry }: BusinessSearchOnboardingProps) => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<typeof MOCK_BUSINESSES>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<BusinessDetails | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [noResults, setNoResults] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Outside click to close suggestions
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

    // Simulate API delay
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
    searchBusinesses(val);
  };

  const handleSelect = (biz: typeof MOCK_BUSINESSES[0]) => {
    setSelectedBusiness(biz);
    setQuery(biz.name);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  return (
    <div className="w-full flex flex-col h-full">
      {/* AI message bubble */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex gap-3 mb-6"
      >
        <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Sparkles className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-bold text-foreground mb-1">Tell us about your business</h2>
          <p className="text-sm text-foreground/50 leading-relaxed">
            This is what we will use on your emails, receipts, and messages to customers. Start typing your business name to search.
          </p>
        </div>
      </motion.div>

      {/* Search input */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        ref={containerRef}
        className="relative mb-4"
      >
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-foreground/30" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
            placeholder="Search your business name..."
            className="w-full h-12 pl-11 pr-4 rounded-xl bg-foreground/[0.06] border border-foreground/[0.08] text-foreground placeholder:text-foreground/30 text-sm outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all"
            autoFocus
          />
          {isSearching && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* Suggestions dropdown */}
        <AnimatePresence>
          {showSuggestions && suggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="absolute top-full left-0 right-0 mt-1.5 bg-[#252525] rounded-xl border border-foreground/[0.08] overflow-hidden z-50 shadow-xl"
            >
              {suggestions.map((biz) => (
                <button
                  key={biz.placeId}
                  onClick={() => handleSelect(biz)}
                  className="w-full flex items-start gap-3 px-4 py-3 hover:bg-foreground/[0.06] transition-colors text-left"
                >
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

        {/* No results */}
        <AnimatePresence>
          {noResults && showSuggestions && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="absolute top-full left-0 right-0 mt-1.5 bg-[#252525] rounded-xl border border-foreground/[0.08] overflow-hidden z-50 shadow-xl"
            >
              <div className="px-4 py-4 text-center">
                <p className="text-sm text-foreground/50 mb-3">No businesses found for "{query}"</p>
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={onManualEntry}
                    className="text-xs font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-1.5"
                  >
                    <Keyboard className="w-3.5 h-3.5" />
                    Enter manually
                  </button>
                  <span className="text-foreground/20">|</span>
                  <button
                    onClick={() => { setQuery(""); setNoResults(false); setShowSuggestions(false); inputRef.current?.focus(); }}
                    className="text-xs font-medium text-foreground/50 hover:text-foreground/70 transition-colors"
                  >
                    Try again
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Selected business details */}
      <AnimatePresence>
        {selectedBusiness && (
          <motion.div
            initial={{ opacity: 0, y: 10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: 10, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-foreground/[0.04] border border-foreground/[0.08] rounded-xl p-4 space-y-3 mb-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Building2 className="w-4.5 h-4.5 text-primary" />
                </div>
                <p className="text-sm font-semibold text-foreground">{selectedBusiness.name}</p>
              </div>
              <div className="space-y-2 pl-12">
                <DetailRow label="Address" value={selectedBusiness.address} />
                <DetailRow label="City" value={selectedBusiness.city} />
                <DetailRow label="State" value={selectedBusiness.state} />
                <DetailRow label="Country" value={selectedBusiness.country} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Bottom actions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="space-y-3 pt-4"
      >
        {!selectedBusiness && (
          <button
            onClick={onManualEntry}
            className="w-full text-center text-xs text-foreground/40 hover:text-foreground/60 transition-colors py-1"
          >
            My business doesn't have a permanent physical address
          </button>
        )}

        <Button
          onClick={() => selectedBusiness && onNext(selectedBusiness)}
          disabled={!selectedBusiness}
          className="w-full h-12 rounded-xl text-sm font-semibold"
        >
          Next
        </Button>
      </motion.div>
    </div>
  );
};

const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between">
    <span className="text-xs text-foreground/40">{label}</span>
    <span className="text-xs text-foreground/70 font-medium">{value}</span>
  </div>
);

export default BusinessSearchOnboarding;
