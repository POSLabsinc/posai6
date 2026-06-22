import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { useIsLandscape } from "@/hooks/use-landscape";
import MarketingPanel from "@/components/onboarding/MarketingPanel";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const OnboardingAppSigninForgot = () => {
  const navigate = useNavigate();
  const isLandscape = useIsLandscape();

  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const canSubmit = EMAIL_RE.test(email.trim()) && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setAuthError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      }).catch(() => null);

      if (res && res.ok) {
        navigate("/onboarding/app/signin/forgot/verify", {
          state: { email: email.trim() },
        });
      } else {
        setAuthError("Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const backBtn = (
    <button
      onClick={() => navigate("/onboarding/app/signin")}
      className="w-10 h-10 rounded-full bg-neutral-800/60 flex items-center justify-center active:opacity-70 transition-opacity"
      aria-label="Back"
    >
      <ChevronLeft className="w-5 h-5 text-foreground" />
    </button>
  );

  const title = (
    <h1 className="text-2xl font-bold text-foreground mt-2">Forgot password?</h1>
  );
  const subtitle = (
    <p className="text-sm text-foreground/60 mt-2">
      Enter your email and we'll send a verification code to reset your password.
    </p>
  );

  const emailField = (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor="forgot-email"
        className="text-[11px] font-semibold tracking-[0.14em] uppercase text-foreground/60"
      >
        Email
      </label>
      <div
        className={`relative flex items-center rounded-full border bg-foreground/[0.04] transition-colors ${
          authError
            ? "border-destructive"
            : "border-foreground/[0.08] focus-within:border-primary"
        }`}
      >
        <input
          id="forgot-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (authError) setAuthError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSubmit();
          }}
          placeholder="you@restaurant.com"
          className="w-full bg-transparent outline-none text-sm text-foreground placeholder:text-foreground/40 px-4 py-3 min-h-[44px]"
        />
      </div>
      {authError ? (
        <p className="text-xs text-destructive mt-0.5">{authError}</p>
      ) : null}
    </div>
  );

  const ctaButton = (
    <button
      onClick={handleSubmit}
      disabled={!canSubmit}
      className="w-full min-h-[44px] py-3 rounded-full text-sm font-semibold bg-primary text-primary-foreground active:opacity-80 transition-opacity disabled:opacity-40 disabled:pointer-events-none"
    >
      {submitting ? "Please wait…" : "Send code"}
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
              eyebrow="Reset password"
              caption="Enter your email or phone to receive a reset code."
            />
          </div>
          <div
            className="flex flex-col px-6 py-6 flex-1 min-h-0"
            style={{ width: "55%" }}
          >
            <div className="flex flex-col h-full w-full max-w-md mx-auto">
              <div>{backBtn}</div>
              {title}
              {subtitle}
              <div className="flex-1 overflow-y-auto mt-6 flex flex-col gap-4 pb-2">
                {emailField}
              </div>
              <div
                className="pt-2"
                style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
              >
                {ctaButton}
              </div>
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
        {title}
        {subtitle}
        <div className="flex-1 overflow-y-auto mt-8 flex flex-col gap-4 pb-4">
          {emailField}
        </div>
        <div
          className="pt-2 pb-4"
          style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
        >
          {ctaButton}
        </div>
      </div>
    </div>
  );
};

export default OnboardingAppSigninForgot;
