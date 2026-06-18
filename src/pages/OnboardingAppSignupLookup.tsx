import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Search, X, MapPin, Navigation, Check, Store, AlertTriangle } from "lucide-react";
import { useIsLandscape } from "@/hooks/use-landscape";
import { toast } from "sonner";

type PlaceResult = {
  place_id: string;
  name: string;
  address: string;
  business_type: string;
  distance_km: number | null;
  lat?: number;
  lng?: number;
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_maps";

const DUMMY_RESTAURANTS: Omit<PlaceResult, "distance_km">[] = [
  {
    place_id: "dummy-1",
    name: "The Rustic Table",
    address: "123 Main Street, Downtown, NY 10001",
    business_type: "Restaurant",
    lat: 40.7128,
    lng: -74.006,
  },
  {
    place_id: "dummy-2",
    name: "Bella Vista Bistro",
    address: "456 Park Avenue, Midtown, NY 10022",
    business_type: "Bistro",
    lat: 40.7614,
    lng: -73.9776,
  },
  {
    place_id: "dummy-3",
    name: "Harbor Grill & Bar",
    address: "789 Waterfront Drive, Brooklyn, NY 11201",
    business_type: "Bar",
    lat: 40.6892,
    lng: -74.0445,
  },
];

const haversineKm = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
};

const prettyType = (types: string[] | undefined) => {
  if (!types || !types.length) return "Restaurant";
  const map: Record<string, string> = {
    cafe: "Café",
    bakery: "Bakery",
    bar: "Bar",
    restaurant: "Restaurant",
    meal_takeaway: "Takeaway",
    food: "Restaurant",
  };
  for (const t of types) if (map[t]) return map[t];
  return "Restaurant";
};

const OnboardingAppSignupLookup = () => {
  const navigate = useNavigate();
  const isLandscape = useIsLandscape();
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFallbackBanner, setShowFallbackBanner] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loc, setLoc] = useState<{ lat: number; lng: number } | null>(null);
  const sessionTokenRef = useRef<string>(
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()}`,
  );
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (p) => setLoc({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => {},
      { enableHighAccuracy: false, timeout: 4000 },
    );
  }, []);

  const buildDummyResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    return DUMMY_RESTAURANTS.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.address.toLowerCase().includes(q) ||
        r.business_type.toLowerCase().includes(q),
    ).map((r) => ({
      ...r,
      distance_km: loc && r.lat && r.lng ? haversineKm(loc, { lat: r.lat, lng: r.lng }) : null,
    }));
  }, [query, loc]);

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      setSelectedId(null);
      return;
    }
    setLoading(true);
    debounceRef.current = window.setTimeout(async () => {
      try {
        const body: Record<string, unknown> = {
          textQuery: query,
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
        if (!res.ok) {
          setResults(buildDummyResults);
          setLoading(false);
          return;
        }
        const data = await res.json();
        const places = (data.places ?? []).slice(0, 3).map((p: any) => {
          const lat = p.location?.latitude;
          const lng = p.location?.longitude;
          return {
            place_id: p.id,
            name: p.displayName?.text ?? "Unknown",
            address: p.formattedAddress ?? "",
            business_type: prettyType(p.primaryType ? [p.primaryType, ...(p.types ?? [])] : p.types),
            distance_km: loc && lat && lng ? haversineKm(loc, { lat, lng }) : null,
            lat,
            lng,
          } as PlaceResult;
        });
        setResults(places.length ? places : buildDummyResults);
      } catch {
        setResults(buildDummyResults);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [query, loc, buildDummyResults]);

  const selected = useMemo(
    () => results.find((r) => r.place_id === selectedId) ?? null,
    [results, selectedId],
  );

  const handleContinue = () => {
    if (!selected) return;
    navigate("/onboarding/app/signup/account", { state: { place: selected } });
  };

  const backBtn = (
    <button
      onClick={() => navigate("/onboarding/app/signup-signin")}
      className="w-10 h-10 rounded-full bg-neutral-800/60 flex items-center justify-center active:opacity-70 transition-opacity"
      aria-label="Back"
    >
      <ChevronLeft className="w-5 h-5 text-foreground" />
    </button>
  );

  const title = <h1 className="text-2xl font-bold text-foreground">Find your restaurant</h1>;
  const subtitle = (
    <p className="text-sm text-foreground/60 mt-2">We'll pre-fill your details automatically.</p>
  );

  const searchInput = (
    <div
      className={`relative flex items-center rounded-2xl border bg-foreground/[0.04] transition-colors ${
        focused ? "border-primary" : "border-foreground/[0.08]"
      }`}
    >
      <Search
        className={`absolute left-4 w-4 h-4 transition-colors ${
          focused ? "text-primary" : "text-foreground/40"
        }`}
      />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="Search restaurant name…"
        className="w-full bg-transparent outline-none text-sm text-foreground placeholder:text-foreground/40 pl-11 pr-11 py-3 min-h-[44px]"
      />
      {query && (
        <button
          onClick={() => {
            setQuery("");
            setResults([]);
            setSelectedId(null);
          }}
          className="absolute right-3 w-7 h-7 rounded-full bg-foreground/10 flex items-center justify-center active:opacity-70"
          aria-label="Clear"
        >
          <X className="w-3.5 h-3.5 text-foreground/70" />
        </button>
      )}
    </div>
  );

  const countLabel = query && results.length > 0 && (
    <p className="text-xs text-foreground/40 mt-3 mb-2">{results.length} results found</p>
  );

  const resultsList = (
    <div className="flex flex-col gap-3">
      <AnimatePresence initial={false}>
        {results.map((r) => {
          const isSel = r.place_id === selectedId;
          return (
            <motion.button
              key={r.place_id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedId(r.place_id)}
              className={`relative flex items-start gap-3 px-4 py-4 rounded-2xl border text-left min-h-[44px] transition-colors ${
                isSel
                  ? "border-primary bg-primary/10"
                  : "border-foreground/[0.08] bg-foreground/[0.04] hover:bg-foreground/[0.07]"
              }`}
            >
              <div className="w-9 h-9 rounded-xl bg-foreground/[0.06] flex items-center justify-center flex-shrink-0">
                <MapPin className={`w-4 h-4 ${isSel ? "text-primary" : "text-foreground/50"}`} />
              </div>
              <div className="flex-1 min-w-0 pr-6">
                <p className="text-sm font-semibold text-foreground truncate">{r.name}</p>
                <p className="text-xs text-foreground/50 mt-0.5 line-clamp-2">{r.address}</p>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-foreground/[0.06] text-foreground/60">
                    {r.business_type}
                  </span>
                  {r.distance_km !== null && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-foreground/50">
                      <Navigation className="w-3 h-3" />
                      {r.distance_km < 1
                        ? `${Math.round(r.distance_km * 1000)} m`
                        : `${r.distance_km.toFixed(1)} km`}
                    </span>
                  )}
                </div>
              </div>
              {isSel && (
                <Check className="absolute right-4 top-4 w-4 h-4 text-primary" />
              )}
            </motion.button>
          );
        })}
      </AnimatePresence>
    </div>
  );

  const emptyState = !query.trim() && results.length === 0 && (
    <div className="flex flex-col items-center justify-center text-center px-6 py-10">
      <div className="w-24 h-24 rounded-3xl bg-foreground/[0.06] border border-foreground/[0.08] flex items-center justify-center">
        <Store className="w-10 h-10 text-foreground/50" strokeWidth={1.5} />
      </div>
      <p className="mt-6 text-base font-semibold text-foreground">
        Start typing to find your restaurant
      </p>
      <p className="mt-2 text-sm text-foreground/50 max-w-[18rem]">
        We'll pull your name, address, and business type automatically.
      </p>
    </div>
  );

  const skeletonItem = (
    <div className="flex items-start gap-3 px-4 py-4 rounded-2xl border border-foreground/[0.08] bg-foreground/[0.04]">
      <div className="w-9 h-9 rounded-xl bg-foreground/[0.08] animate-pulse flex-shrink-0" />
      <div className="flex-1 min-w-0 space-y-2">
        <div className="h-4 w-3/5 rounded bg-foreground/[0.08] animate-pulse" />
        <div className="h-3 w-4/5 rounded bg-foreground/[0.06] animate-pulse" />
        <div className="flex items-center gap-2 pt-0.5">
          <div className="h-4 w-16 rounded-full bg-foreground/[0.06] animate-pulse" />
          <div className="h-4 w-12 rounded bg-foreground/[0.06] animate-pulse" />
        </div>
      </div>
    </div>
  );

  const skeletonList = loading && (
    <div className="flex flex-col gap-3">
      {skeletonItem}
      {skeletonItem}
      {skeletonItem}
    </div>
  );

  const notOnGoogleLink = (
    <button
      onClick={() => navigate("/onboarding/app/signup/manual")}
      className="text-sm text-primary text-center w-full py-2 min-h-[44px] hover:underline underline-offset-2"
    >
      My restaurant isn't on Google yet
    </button>
  );

  const continueBtn = selected && (
    <button
      onClick={handleContinue}
      className="w-full min-h-[44px] py-3 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold active:opacity-80 transition-opacity"
    >
      Continue
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
            <div>{backBtn}</div>
            <div className="flex-1 flex flex-col justify-center">
              {title}
              {subtitle}
            </div>
            <div className="flex flex-col gap-3">
              {notOnGoogleLink}
              {continueBtn}
            </div>
          </div>
          <div className="flex flex-col px-6 py-6 flex-1 min-h-0" style={{ width: "55%" }}>
            {searchInput}
            {countLabel}
            <div className="flex-1 overflow-y-auto flex flex-col">
            {loading ? (
              skeletonList
            ) : emptyState ? (
              <div className="flex-1 flex items-center justify-center">{emptyState}</div>
            ) : (
              resultsList
            )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 login-bg flex flex-col overflow-hidden">
      <div className="absolute inset-0 gradient-mesh opacity-30 pointer-events-none" />
      <div className="relative z-10 flex flex-col h-full w-full max-w-md mx-auto px-6 pt-6">
        <div className="mb-6">{backBtn}</div>
        {title}
        {subtitle}
        <div className="mt-6">{searchInput}</div>
        {countLabel}
        <div className="flex-1 overflow-y-auto mt-2 pb-4 flex flex-col">
          {loading ? (
            skeletonList
          ) : emptyState ? (
            <div className="flex-1 flex items-center justify-center">{emptyState}</div>
          ) : (
            resultsList
          )}
        </div>
        <div className="pt-2 pb-2">{notOnGoogleLink}</div>
        {selected && (
          <div className="pb-6 pt-2" style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}>
            {continueBtn}
          </div>
        )}
      </div>
    </div>
  );
};

export default OnboardingAppSignupLookup;
