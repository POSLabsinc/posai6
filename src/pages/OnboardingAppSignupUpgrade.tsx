import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ChevronLeft, RefreshCw, CheckCircle2 } from "lucide-react";
import { useIsLandscape } from "@/hooks/use-landscape";

type LocationState = {
  place?: { name: string; address: string } | null;
  email?: string;
  country?: string;
  demo?: boolean;
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
]);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const OnboardingAppSignupUpgrade = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isLandscape = useIsLandscape();
  const state = (location.state as LocationState) ?? {};
  const currentEmail = state.email ?? "";

  const [workEmail, setWorkEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const validate = (value: string): string | null => {
    const v = value.trim().toLowerCase();
    if (!EMAIL_RE.test(v)) return "Please enter a valid email address";
    const domain = v.split("@")[1];
    if (domain && PERSONAL_DOMAINS.has(domain))
      return "Please use a business email address";
    return null;
  };

  const isValid = useMemo(() => !validate(workEmail), [workEmail]);

  const handleSubmit = async () => {
    if (!isValid || submitting) return;
    const err = validate(workEmail);
    if (err) {
      setError(err);
      return;
    }
    setSubmitting(true);
    try {
      // Placeholder for POST /auth/update-email
      await new Promise((r) => setTimeout(r, 400));
      setSent(true);
    } finally {
      setSubmitting(false);
    }
  };

  const backBtn = (
    <button
      onClick={() => navigate("/onboarding/app/signup/demo", { state })}
      className="w-10 h-10 rounded-full bg-neutral-800/60 flex items-center justify-center active:opacity-70 transition-opacity"
      aria-label="Back"
    >
      <ChevronLeft className="w-5 h-5 text-foreground" />
    </button>
  );

  const title = (
    <h1 className="text-2xl font-bold text-foreground mt-4">Add a work email</h1>
  );

  const subtitle = (
    <p className="text-sm text-foreground/60 mt-2">
      Unlocks full access, payments, devices, and going live.
    </p>
  );

  const currentField = (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-semibold tracking-[0.14em] uppercase text-foreground/60">
        Current email
      </label>
      <div className="rounded-2xl border border-foreground/[0.06] bg-foreground/[0.02]">
        <input
          type="email"
          value={currentEmail}
          disabled
          readOnly
          className="w-full bg-transparent outline-none text-sm text-foreground/50 px-4 py-3 min-h-[44px] cursor-not-allowed"
        />
      </div>
    </div>
  );

  const workField = (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor="upgrade-work-email"
        className="text-[11px] font-semibold tracking-[0.14em] uppercase text-foreground/60"
      >
        Work email
      </label>
      <div
        className={`relative flex items-center rounded-2xl border bg-foreground/[0.04] transition-colors ${
          error
            ? "border-destructive"
            : "border-foreground/[0.08] focus-within:border-primary"
        }`}
      >
        <input
          id="upgrade-work-email"
          type="email"
          autoComplete="email"
          value={workEmail}
          onChange={(e) => {
            setWorkEmail(e.target.value);
            if (error) setError(null);
          }}
          onBlur={() => {
            if (workEmail.trim()) setError(validate(workEmail));
          }}
          placeholder="you@restaurant.com"
          className="w-full bg-transparent outline-none text-sm text-foreground placeholder:text-foreground/40 px-4 py-3 min-h-[44px]"
        />
      </div>
      {error ? (
        <p className="text-xs text-destructive mt-0.5">{error}</p>
      ) : (
        <p className="text-xs text-foreground/50 mt-0.5">
          We'll send a verification link to confirm
        </p>
      )}
    </div>
  );

  const infoBanner = (
    <div className="flex items-start gap-2 px-4 py-3 rounded-2xl border border-primary/20 bg-primary/[0.08]">
      <RefreshCw className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <p className="text-xs text-foreground/70 leading-relaxed">
        Your current email stays as a recovery email. Your work email becomes
        your primary login.
      </p>
    </div>
  );

  const ctaButton = (
    <button
      onClick={handleSubmit}
      disabled={!isValid || submitting}
      className="w-full min-h-[44px] py-3 rounded-2xl text-sm font-semibold bg-primary text-primary-foreground active:opacity-80 transition-opacity disabled:opacity-40 disabled:pointer-events-none"
    >
      {submitting ? "Sending…" : "Send verification"}
    </button>
  );

  const successView = (
    <div className="flex flex-col items-center text-center px-2 py-6">
      <div className="w-14 h-14 rounded-full bg-primary/15 flex items-center justify-center">
        <CheckCircle2 className="w-7 h-7 text-primary" />
      </div>
      <h2 className="text-lg font-semibold text-foreground mt-4">
        Verification link sent
      </h2>
      <p className="text-sm text-foreground/60 mt-2 max-w-sm">
        Verification link sent to {workEmail}. Check your inbox.
      </p>
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
            <div>{backBtn}</div>
            <div className="mt-2">
              {title}
              {subtitle}
            </div>
            <div className="flex-1" />
            {!sent && <div className="pb-3">{infoBanner}</div>}
            <div
              style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
            >
              {!sent && ctaButton}
            </div>
          </div>
          <div
            className="flex flex-col px-6 py-6 flex-1 min-h-0"
            style={{ width: "55%" }}
          >
            {sent ? (
              <div className="flex-1 flex items-center justify-center">
                {successView}
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto flex flex-col gap-4">
                {currentField}
                {workField}
              </div>
            )}
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
        <div className="mb-2">{backBtn}</div>
        {sent ? (
          <div className="flex-1 flex items-center justify-center">
            {successView}
          </div>
        ) : (
          <>
            {title}
            {subtitle}
            <div className="flex-1 overflow-y-auto mt-6 flex flex-col gap-4 pb-4">
              {currentField}
              {workField}
              {infoBanner}
            </div>
            <div
              className="pt-2"
              style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
            >
              {ctaButton}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default OnboardingAppSignupUpgrade;
