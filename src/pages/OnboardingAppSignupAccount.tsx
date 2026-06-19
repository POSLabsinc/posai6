import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ChevronLeft, MapPin, Eye, EyeOff, ChevronDown, AlertTriangle } from "lucide-react";
import { useIsLandscape } from "@/hooks/use-landscape";

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
  "gmail.com",
  "yahoo.com",
  "yahoo.co.uk",
  "yahoo.co.in",
  "hotmail.com",
  "outlook.com",
  "live.com",
  "msn.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "protonmail.com",
  "proton.me",
  "aol.com",
  "gmx.com",
  "yandex.com",
  "mail.com",
  "zoho.com",
]);

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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const parseLocation = (address: string): { city: string; country: string } => {
  if (!address) return { city: "", country: "" };
  const parts = address.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) return { city: "", country: "" };
  const last = parts[parts.length - 1];
  // try detect country (last word/segment) vs city (second-to-last)
  const hasCountry = COUNTRIES.some((c) => last.toLowerCase().includes(c.toLowerCase()));
  if (hasCountry) {
    const matched = COUNTRIES.find((c) => last.toLowerCase().includes(c.toLowerCase()))!;
    const city = parts.length >= 2 ? parts[parts.length - 2] : "";
    return { city, country: matched };
  }
  // assume US-style "City, ST ZIP" or trailing zip
  const country = "United States";
  const city = parts.length >= 3 ? parts[parts.length - 3] : parts[0];
  return { city, country };
};

const OnboardingAppSignupAccount = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isLandscape = useIsLandscape();

  const place = (location.state as { place?: PlaceResult } | null)?.place ?? null;
  const { city, country: derivedCountry } = useMemo(
    () => parseLocation(place?.address ?? ""),
    [place],
  );

  const [email, setEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isPersonal, setIsPersonal] = useState(false);

  const [password, setPassword] = useState("");
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [selectedCountry, setSelectedCountry] = useState(derivedCountry || "United States");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (derivedCountry) setSelectedCountry(derivedCountry);
  }, [derivedCountry]);

  const validateEmail = (value: string) => {
    if (!value.trim()) return "Please enter a valid email address";
    if (!EMAIL_RE.test(value.trim())) return "Please enter a valid email address";
    return null;
  };

  const detectPersonal = (value: string) => {
    const domain = value.trim().split("@")[1]?.toLowerCase();
    if (!domain) return false;
    return PERSONAL_DOMAINS.has(domain);
  };

  const handleEmailBlur = () => {
    setEmailTouched(true);
    const err = validateEmail(email);
    setEmailError(err);
    setIsPersonal(!err && detectPersonal(email));
  };

  const handlePasswordBlur = () => {
    setPasswordTouched(true);
    if (!password) setPasswordError("Minimum 8 characters required");
    else if (password.length < 8) setPasswordError("Minimum 8 characters required");
    else setPasswordError(null);
  };

  const isFormValid =
    !validateEmail(email) && password.length >= 8 && !!selectedCountry;

  const handleSubmit = async () => {
    if (!isFormValid || submitting) return;
    setSubmitting(true);
    try {
      // Placeholder for POST /auth/signup
      await new Promise((r) => setTimeout(r, 400));
      navigate("/onboarding/app/signup/verify", {
        state: {
          place,
          email,
          country: selectedCountry,
          demo: isPersonal,
          intent: isPersonal ? "signup_demo" : "signup_org",
        },
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleClearEmail = () => {
    setEmail("");
    setIsPersonal(false);
    setEmailError(null);
    setEmailTouched(false);
    const el = document.getElementById("signup-email") as HTMLInputElement | null;
    el?.focus();
  };

  const backBtn = (
    <button
      onClick={() => navigate("/onboarding/app/signup/lookup")}
      className="w-10 h-10 rounded-full bg-neutral-800/60 flex items-center justify-center active:opacity-70 transition-opacity"
      aria-label="Back"
    >
      <ChevronLeft className="w-5 h-5 text-foreground" />
    </button>
  );

  const progressBar = (
    <div className="flex items-center gap-1.5 w-full">
      <div className="h-1 flex-1 rounded-full bg-primary" />
      <div className="h-1 flex-1 rounded-full bg-primary/40" />
      <div className="h-1 flex-1 rounded-full bg-foreground/[0.08]" />
      <div className="h-1 flex-1 rounded-full bg-foreground/[0.08]" />
      <div className="h-1 flex-1 rounded-full bg-foreground/[0.08]" />
    </div>
  );

  const eyebrow = (
    <p className="text-[11px] font-semibold tracking-[0.14em] uppercase text-primary">
      Step 1
    </p>
  );

  const title = <h1 className="text-2xl font-bold text-foreground mt-2">Create account</h1>;

  const subtitle = place && (
    <div className="flex items-center gap-1.5 mt-2 text-sm text-foreground/60">
      <MapPin className="w-3.5 h-3.5 text-foreground/50 flex-shrink-0" />
      <span className="truncate">
        {place.name}
        {(city || selectedCountry) && (
          <>
            {" · "}
            {[city, selectedCountry].filter(Boolean).join(", ")}
          </>
        )}
      </span>
    </div>
  );

  const emailField = (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor="signup-email"
        className="text-[11px] font-semibold tracking-[0.14em] uppercase text-foreground/60"
      >
        Email
      </label>
      <div
        className={`relative flex items-center rounded-2xl border bg-foreground/[0.04] transition-colors ${
          emailError
            ? "border-destructive"
            : "border-foreground/[0.08] focus-within:border-primary"
        }`}
      >
        <input
          id="signup-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (emailError) setEmailError(null);
          }}
          onBlur={handleEmailBlur}
          placeholder="you@restaurant.com"
          className="w-full bg-transparent outline-none text-sm text-foreground placeholder:text-foreground/40 px-4 py-3 min-h-[44px]"
        />
      </div>
      {emailError ? (
        <p className="text-xs text-destructive mt-0.5">{emailError}</p>
      ) : (
        <p className="text-xs text-foreground/50 mt-0.5">
          {isPersonal ? "Personal email detected" : "Business email = full access"}
        </p>
      )}
      {isPersonal && !emailError && (
        <div className="flex items-start gap-2 px-4 py-3 mt-1 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>
            Personal email detected. You'll start in read-only demo mode. Use a business email for full access.
          </span>
        </div>
      )}
    </div>
  );

  const passwordField = (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor="signup-password"
        className="text-[11px] font-semibold tracking-[0.14em] uppercase text-foreground/60"
      >
        Password
      </label>
      <div
        className={`relative flex items-center rounded-2xl border bg-foreground/[0.04] transition-colors ${
          passwordError
            ? "border-destructive"
            : "border-foreground/[0.08] focus-within:border-primary"
        }`}
      >
        <input
          id="signup-password"
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (passwordError) setPasswordError(null);
          }}
          onBlur={handlePasswordBlur}
          placeholder="At least 8 characters"
          className="w-full bg-transparent outline-none text-sm text-foreground placeholder:text-foreground/40 pl-4 pr-12 py-3 min-h-[44px]"
        />
        <button
          type="button"
          onClick={() => setShowPassword((s) => !s)}
          className="absolute right-3 w-8 h-8 rounded-full flex items-center justify-center text-foreground/60 active:opacity-70"
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {passwordError ? (
        <p className="text-xs text-destructive mt-0.5">{passwordError}</p>
      ) : (
        <p className="text-xs text-foreground/50 mt-0.5">Minimum 8 characters</p>
      )}
    </div>
  );

  const countryField = (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor="signup-country"
        className="text-[11px] font-semibold tracking-[0.14em] uppercase text-foreground/60"
      >
        Country
      </label>
      <div className="relative flex items-center rounded-2xl border border-foreground/[0.08] bg-foreground/[0.04] focus-within:border-primary transition-colors">
        <select
          id="signup-country"
          value={selectedCountry}
          onChange={(e) => setSelectedCountry(e.target.value)}
          className="w-full appearance-none bg-transparent outline-none text-sm text-foreground pl-4 pr-10 py-3 min-h-[44px]"
        >
          {COUNTRIES.map((c) => (
            <option key={c} value={c} className="bg-neutral-900 text-foreground">
              {c}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-4 w-4 h-4 text-foreground/50 pointer-events-none" />
      </div>
    </div>
  );

  const ctaLabel = isPersonal ? "Continue in demo mode" : "Create account";

  const ctaButton = (
    <button
      onClick={handleSubmit}
      disabled={!isFormValid || submitting}
      className={`w-full min-h-[44px] py-3 rounded-2xl text-sm font-semibold transition-opacity ${
        isPersonal
          ? "bg-foreground/[0.08] text-foreground border border-foreground/[0.12] active:opacity-80"
          : "bg-primary text-primary-foreground active:opacity-80"
      } disabled:opacity-40 disabled:pointer-events-none`}
    >
      {submitting ? "Please wait…" : ctaLabel}
    </button>
  );

  const footerText = (
    <p className="text-xs text-foreground/50 text-center">
      {isPersonal ? (
        <>
          Have a work email?{" "}
          <button onClick={handleClearEmail} className="text-primary hover:underline underline-offset-2">
            Use it instead
          </button>
        </>
      ) : (
        <>
          Already have an account?{" "}
          <button
            onClick={() => navigate("/onboarding/app/signin")}
            className="text-primary hover:underline underline-offset-2"
          >
            Sign in
          </button>
        </>
      )}
    </p>
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
              eyebrow="Account preview"
              caption="Sets up the owner profile, contact details, and primary login for your venue."
            />
          </div>
          <div
            className="flex flex-col px-6 py-6 flex-1 min-h-0"
            style={{ width: "55%" }}
          >
            <div>{backBtn}</div>
            <div className="mt-4">{progressBar}</div>
            <div className="mt-5">{eyebrow}</div>
            {title}
            {subtitle}
            <div className="flex-1 overflow-y-auto mt-5 flex flex-col gap-4 pb-4">
              {emailField}
              {passwordField}
              {countryField}
            </div>
            <div className="pt-2">{ctaButton}</div>
            <div
              className="pt-3"
              style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
            >
              {footerText}
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
        <div className="mb-5">{backBtn}</div>
        {progressBar}
        <div className="mt-5">{eyebrow}</div>
        {title}
        {subtitle}
        <div className="flex-1 overflow-y-auto mt-6 flex flex-col gap-4 pb-4">
          {emailField}
          {passwordField}
          {countryField}
        </div>
        <div className="pt-2">{ctaButton}</div>
        <div
          className="pt-3 pb-4"
          style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
        >
          {footerText}
        </div>
      </div>
    </div>
  );
};

export default OnboardingAppSignupAccount;
