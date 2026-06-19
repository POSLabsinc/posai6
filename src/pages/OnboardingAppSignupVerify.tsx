import { useEffect, useMemo, useRef, useState } from "react";
import MarketingPanel from "@/components/onboarding/MarketingPanel";
import { useLocation, useNavigate } from "react-router-dom";
import { ChevronLeft, Mail, AlertCircle, Info } from "lucide-react";
import { useIsLandscape } from "@/hooks/use-landscape";

type Intent = "signup_org" | "signup_demo" | "upgrade_email";

type LocationState = {
  place?: { name: string; address: string } | null;
  email?: string;
  country?: string;
  intent?: Intent;
  demo?: boolean;
};

const OTP_LEN = 6;
const TIMER_SECONDS = 10 * 60;

const formatTime = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
};

const STORAGE_KEY = "onboarding_verify_state";

const readPersisted = (): LocationState => {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as LocationState) : {};
  } catch {
    return {};
  }
};

const OnboardingAppSignupVerify = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isLandscape = useIsLandscape();
  const incoming = (location.state as LocationState) ?? {};
  const persisted = readPersisted();
  // Prefer fresh navigation state; fall back to last persisted snapshot
  const hasIncoming = !!(incoming.email || incoming.intent);
  const state: LocationState = hasIncoming ? incoming : persisted;
  const intent: Intent = state.intent ?? "signup_org";
  const email = state.email ?? "";

  useEffect(() => {
    if (hasIncoming) {
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(incoming));
      } catch {
        // ignore
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [digits, setDigits] = useState<string[]>(Array(OTP_LEN).fill(""));
  const [seconds, setSeconds] = useState(TIMER_SECONDS);
  const [expired, setExpired] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resentToast, setResentToast] = useState(false);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (expired) return;
    const id = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          clearInterval(id);
          setExpired(true);
          setError("This code has expired. Request a new one below.");
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [expired]);

  const allFilled = useMemo(() => digits.every((d) => d.length === 1), [digits]);

  const focusBox = (i: number) => {
    const el = inputsRef.current[Math.max(0, Math.min(OTP_LEN - 1, i))];
    el?.focus();
    el?.select?.();
  };

  const handleChange = (i: number, raw: string) => {
    const v = raw.replace(/\D/g, "");
    if (!v) return;
    if (error && !expired) setError(null);
    if (v.length > 1) {
      // paste-like
      const next = [...digits];
      for (let k = 0; k < OTP_LEN; k++) {
        next[k] = v[k] ?? next[k];
      }
      setDigits(next);
      const last = Math.min(v.length, OTP_LEN) - 1;
      focusBox(last + 1 < OTP_LEN ? last + 1 : OTP_LEN - 1);
      return;
    }
    const next = [...digits];
    next[i] = v;
    setDigits(next);
    if (i < OTP_LEN - 1) focusBox(i + 1);
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (digits[i]) {
        const next = [...digits];
        next[i] = "";
        setDigits(next);
      } else if (i > 0) {
        focusBox(i - 1);
        const next = [...digits];
        next[i - 1] = "";
        setDigits(next);
      }
    } else if (e.key === "ArrowLeft" && i > 0) {
      focusBox(i - 1);
    } else if (e.key === "ArrowRight" && i < OTP_LEN - 1) {
      focusBox(i + 1);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LEN);
    if (!text) return;
    e.preventDefault();
    const next = Array(OTP_LEN).fill("");
    for (let i = 0; i < text.length; i++) next[i] = text[i];
    setDigits(next);
    focusBox(Math.min(text.length, OTP_LEN - 1));
    if (error && !expired) setError(null);
  };

  const resetBoxes = () => {
    setDigits(Array(OTP_LEN).fill(""));
    focusBox(0);
  };

  const resendCode = async () => {
    // Placeholder for POST /auth/resend-otp
    setDigits(Array(OTP_LEN).fill(""));
    setSeconds(TIMER_SECONDS);
    setExpired(false);
    setError(null);
    setResentToast(true);
    focusBox(0);
    setTimeout(() => setResentToast(false), 2000);
  };

  const handleVerify = async () => {
    if (expired) {
      resendCode();
      return;
    }
    if (!allFilled || submitting) return;
    setSubmitting(true);
    try {
      // Placeholder for POST /auth/verify-otp
      await new Promise((r) => setTimeout(r, 400));
      const code = digits.join("");
      // Simulate wrong code if all zeros
      if (code === "000000") {
        setError("Incorrect code. Please try again or request a new one.");
        return;
      }
      if (intent === "signup_org") {
        navigate("/onboarding/app/signup/revenue", { state });
      } else if (intent === "signup_demo") {
        navigate("/onboarding/app/signup/demo", { state });
      } else {
        navigate("/", { state });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const ctaLabel = expired
    ? "Resend code"
    : error
    ? "Try again"
    : submitting
    ? "Verifying…"
    : "Verify email";

  const handleCta = () => {
    if (expired) return resendCode();
    if (error) {
      resetBoxes();
      setError(null);
      return;
    }
    return handleVerify();
  };

  const ctaDisabled = !expired && !error && (!allFilled || submitting);

  const backBtn = (
    <button
      onClick={() => navigate(-1)}
      className="w-10 h-10 rounded-full bg-neutral-800/60 flex items-center justify-center active:opacity-70 transition-opacity"
      aria-label="Back"
    >
      <ChevronLeft className="w-5 h-5 text-foreground" />
    </button>
  );

  const progressBar = (
    <div className="flex items-center gap-1.5 w-full">
      <div className="h-1 flex-1 rounded-full bg-primary" />
      <div className="h-1 flex-1 rounded-full bg-primary" />
      <div className="h-1 flex-1 rounded-full bg-primary/40" />
      <div className="h-1 flex-1 rounded-full bg-foreground/[0.08]" />
      <div className="h-1 flex-1 rounded-full bg-foreground/[0.08]" />
    </div>
  );

  const eyebrow = (
    <p className="text-[11px] font-semibold tracking-[0.14em] uppercase text-primary">
      Step 2
    </p>
  );

  const title = <h1 className="text-2xl font-bold text-foreground mt-2">Check your email</h1>;

  const subtitle = (
    <p className="text-sm text-foreground/60 mt-2">We sent a 6-digit code to</p>
  );

  const emailChip = email && (
    <div className="inline-flex items-center gap-2 mt-3 px-3 py-2 rounded-full border border-foreground/[0.08] bg-foreground/[0.04] max-w-full">
      <Mail className="w-3.5 h-3.5 text-foreground/60 flex-shrink-0" />
      <span className="text-xs font-medium text-foreground truncate">{email}</span>
    </div>
  );

  const demoBanner = intent === "signup_demo" && (
    <div className="flex items-start gap-2 px-4 py-3 mt-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 text-amber-400">
      <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
      <p className="text-xs leading-relaxed">
        You'll start in <span className="font-semibold">demo mode</span> after verification. Add a business email anytime to unlock full access.
      </p>
    </div>
  );

  const otpBoxes = (
    <div className="flex items-center justify-center gap-2 sm:gap-3">
      {digits.map((d, i) => {
        const filled = d.length === 1;
        const stateClass = error
          ? "border-destructive bg-destructive/[0.06] text-foreground"
          : filled
          ? "border-primary bg-primary/[0.08] text-foreground"
          : "border-foreground/[0.08] bg-foreground/[0.04] text-foreground focus:border-primary focus:shadow-[0_0_0_3px_hsl(var(--primary)/0.15)]";
        return (
          <input
            key={i}
            ref={(el) => (inputsRef.current[i] = el)}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={1}
            value={d}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={handlePaste}
            onFocus={(e) => e.currentTarget.select()}
            className={`w-11 h-12 sm:w-12 sm:h-14 text-center text-lg font-semibold rounded-xl border outline-none transition-all ${stateClass}`}
            aria-label={`Digit ${i + 1}`}
          />
        );
      })}
    </div>
  );

  const timer = !expired && (
    <p className="text-center text-xs text-foreground/60 mt-4">
      Expires in <span className="font-semibold text-amber-400">{formatTime(seconds)}</span>
    </p>
  );

  const errorBanner = error && (
    <div className="flex items-start gap-2 px-4 py-3 mt-4 rounded-2xl border border-destructive/30 bg-destructive/[0.08] text-destructive">
      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
      <p className="text-xs leading-relaxed">{error}</p>
    </div>
  );

  const resendRow = (
    <div className="mt-3 text-center text-xs text-foreground/60">
      {expired ? (
        <button onClick={resendCode} className="text-primary font-semibold hover:underline underline-offset-2">
          Code expired. Send a new code
        </button>
      ) : (
        <>
          Didn't receive it?{" "}
          <button onClick={resendCode} className="text-primary font-semibold hover:underline underline-offset-2">
            Resend code
          </button>
        </>
      )}
      {resentToast && (
        <p className="text-[11px] text-primary mt-1">Code resent</p>
      )}
    </div>
  );

  const ctaButton = (
    <button
      onClick={handleCta}
      disabled={ctaDisabled}
      className="w-full min-h-[44px] py-3 rounded-2xl text-sm font-semibold bg-primary text-primary-foreground active:opacity-80 transition-opacity disabled:opacity-40 disabled:pointer-events-none"
    >
      {ctaLabel}
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
            className="flex flex-col border-r border-foreground/[0.08]"
            style={{ width: "45%" }}
          >
            <MarketingPanel
              eyebrow="Verification preview"
              caption="A one-time code confirms your email or phone before continuing setup."
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
            {emailChip}
            {demoBanner}
            <div className="flex-1 overflow-y-auto mt-6 flex flex-col">
              {otpBoxes}
              {timer}
              {errorBanner}
              {resendRow}
            </div>
            <div
              className="pt-3"
              style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
            >
              {ctaButton}
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
        {emailChip}
        {demoBanner}
        <div className="flex-1 overflow-y-auto mt-8 flex flex-col">
          {otpBoxes}
          {timer}
          {errorBanner}
          {resendRow}
        </div>
        <div
          className="pt-3"
          style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
        >
          {ctaButton}
        </div>
      </div>
    </div>
  );
};

export default OnboardingAppSignupVerify;
