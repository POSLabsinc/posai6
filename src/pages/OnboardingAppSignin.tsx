import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Eye, EyeOff } from "lucide-react";
import { useIsLandscape } from "@/hooks/use-landscape";
import MarketingPanel from "@/components/onboarding/MarketingPanel";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const OnboardingAppSignin = () => {
  const navigate = useNavigate();
  const isLandscape = useIsLandscape();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const canSubmit = email.trim().length > 0 && password.length > 0 && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setAuthError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, app_type: "POS" }),
      }).catch(() => null);

      const ok = res && res.ok && EMAIL_RE.test(email.trim());
      if (ok) {
        navigate("/onboarding/app/signin/success");
      } else {
        setAuthError("Incorrect email or password. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
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

  const title = <h1 className="text-2xl font-bold text-foreground mt-2">Sign in</h1>;
  const subtitle = (
    <p className="text-sm text-foreground/60 mt-2">Welcome back to PointOfSaleAi.</p>
  );

  const emailField = (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor="signin-email"
        className="text-[11px] font-semibold tracking-[0.14em] uppercase text-foreground/60"
      >
        Email
      </label>
      <div
        className={`relative flex items-center rounded-2xl border bg-foreground/[0.04] transition-colors ${
          authError
            ? "border-destructive"
            : "border-foreground/[0.08] focus-within:border-primary"
        }`}
      >
        <input
          id="signin-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (authError) setAuthError(null);
          }}
          placeholder="you@restaurant.com"
          className="w-full bg-transparent outline-none text-sm text-foreground placeholder:text-foreground/40 px-4 py-3 min-h-[44px]"
        />
      </div>
    </div>
  );

  const passwordField = (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor="signin-password"
        className="text-[11px] font-semibold tracking-[0.14em] uppercase text-foreground/60"
      >
        Password
      </label>
      <div
        className={`relative flex items-center rounded-2xl border bg-foreground/[0.04] transition-colors ${
          authError
            ? "border-destructive"
            : "border-foreground/[0.08] focus-within:border-primary"
        }`}
      >
        <input
          id="signin-password"
          type={showPassword ? "text" : "password"}
          autoComplete="current-password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (authError) setAuthError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSubmit();
          }}
          placeholder="Enter your password"
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
      {authError ? (
        <p className="text-xs text-destructive mt-0.5">{authError}</p>
      ) : null}
      <div className="flex justify-end mt-0.5">
        <button
          type="button"
          onClick={() => navigate("/onboarding/app/signin/forgot")}
          className="text-xs text-primary hover:underline underline-offset-2"
        >
          Forgot password?
        </button>
      </div>
    </div>
  );

  const ctaButton = (
    <button
      onClick={handleSubmit}
      disabled={!canSubmit}
      className="w-full min-h-[44px] py-3 rounded-2xl text-sm font-semibold bg-primary text-primary-foreground active:opacity-80 transition-opacity disabled:opacity-40 disabled:pointer-events-none"
    >
      {submitting ? "Please wait…" : "Sign in"}
    </button>
  );

  const footerText = (
    <p className="text-xs text-foreground/50 text-center">
      Don't have an account?{" "}
      <button
        onClick={() => navigate("/onboarding/app/signup/account")}
        className="text-primary hover:underline underline-offset-2"
      >
        Create one
      </button>
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
              eyebrow="Sign in"
              caption="Returning users sign in with email, phone, or device code."
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
                {passwordField}
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
          {passwordField}
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

export default OnboardingAppSignin;
