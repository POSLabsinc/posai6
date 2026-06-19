import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ChevronLeft, Eye, EyeOff } from "lucide-react";
import { useIsLandscape } from "@/hooks/use-landscape";
import MarketingPanel from "@/components/onboarding/MarketingPanel";

type Strength = { score: 0 | 1 | 2 | 3 | 4; label: "" | "Weak" | "Good" | "Strong" };

const scorePassword = (pw: string): Strength => {
  if (!pw) return { score: 0, label: "" };
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  const score = Math.max(1, Math.min(4, s)) as 1 | 2 | 3 | 4;
  const label: Strength["label"] = score >= 4 ? "Strong" : score === 3 ? "Good" : "Weak";
  return { score, label };
};

const OnboardingAppSigninForgotReset = () => {
  const navigate = useNavigate();
  const isLandscape = useIsLandscape();
  const location = useLocation();
  const email = (location.state as { email?: string } | null)?.email ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmTouched, setConfirmTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const strength = useMemo(() => scorePassword(password), [password]);
  const mismatch = confirmTouched && confirm.length > 0 && confirm !== password;
  const canSubmit = password.length >= 8 && confirm === password && !submitting;

  const strengthColorClass =
    strength.score >= 4
      ? "bg-emerald-500"
      : strength.score === 3
        ? "bg-amber-500"
        : "bg-destructive";
  const strengthTextClass =
    strength.score >= 4
      ? "text-emerald-500"
      : strength.score === 3
        ? "text-amber-500"
        : "text-destructive";

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setAuthError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      }).catch(() => null);

      if (res && res.ok) {
        navigate("/onboarding/app/signin/forgot/success", { state: { email } });
      } else {
        setAuthError("Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const backBtn = (
    <button
      onClick={() => navigate("/onboarding/app/signin/forgot/verify", { state: { email } })}
      className="w-10 h-10 rounded-full bg-neutral-800/60 flex items-center justify-center active:opacity-70 transition-opacity"
      aria-label="Back"
    >
      <ChevronLeft className="w-5 h-5 text-foreground" />
    </button>
  );

  const title = <h1 className="text-2xl font-bold text-foreground mt-2">Create new password</h1>;
  const subtitle = (
    <p className="text-sm text-foreground/60 mt-2">Must be at least 8 characters.</p>
  );

  const newPasswordField = (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor="new-password"
        className="text-[11px] font-semibold tracking-[0.14em] uppercase text-foreground/60"
      >
        New password
      </label>
      <div className="relative flex items-center rounded-2xl border bg-foreground/[0.04] transition-colors border-foreground/[0.08] focus-within:border-primary">
        <input
          id="new-password"
          type={showPw ? "text" : "password"}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-transparent outline-none text-sm text-foreground placeholder:text-foreground/40 px-4 py-3 min-h-[44px] pr-12"
        />
        <button
          type="button"
          onClick={() => setShowPw((s) => !s)}
          className="absolute right-3 w-8 h-8 flex items-center justify-center text-foreground/60 active:opacity-70"
          aria-label={showPw ? "Hide password" : "Show password"}
        >
          {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      <div className="mt-2 flex items-center gap-1.5">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i <= strength.score ? strengthColorClass : "bg-foreground/[0.1]"
            }`}
          />
        ))}
      </div>
      {strength.label ? (
        <p className={`text-xs mt-1 ${strengthTextClass}`}>{strength.label}</p>
      ) : null}
    </div>
  );

  const confirmField = (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor="confirm-password"
        className="text-[11px] font-semibold tracking-[0.14em] uppercase text-foreground/60"
      >
        Confirm password
      </label>
      <div
        className={`relative flex items-center rounded-2xl border bg-foreground/[0.04] transition-colors ${
          mismatch ? "border-destructive" : "border-foreground/[0.08] focus-within:border-primary"
        }`}
      >
        <input
          id="confirm-password"
          type={showConfirm ? "text" : "password"}
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          onBlur={() => setConfirmTouched(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSubmit();
          }}
          className="w-full bg-transparent outline-none text-sm text-foreground placeholder:text-foreground/40 px-4 py-3 min-h-[44px] pr-12"
        />
        <button
          type="button"
          onClick={() => setShowConfirm((s) => !s)}
          className="absolute right-3 w-8 h-8 flex items-center justify-center text-foreground/60 active:opacity-70"
          aria-label={showConfirm ? "Hide password" : "Show password"}
        >
          {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {mismatch ? (
        <p className="text-xs text-destructive mt-0.5">Passwords do not match</p>
      ) : null}
      {authError ? <p className="text-xs text-destructive mt-0.5">{authError}</p> : null}
    </div>
  );

  const ctaButton = (
    <button
      onClick={handleSubmit}
      disabled={!canSubmit}
      className="w-full min-h-[44px] py-3 rounded-2xl text-sm font-semibold bg-primary text-primary-foreground active:opacity-80 transition-opacity disabled:opacity-40 disabled:pointer-events-none"
    >
      {submitting ? "Please wait…" : "Reset password"}
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
              eyebrow="New password"
              caption="Choose a new password to secure your account."
            />
          </div>
          <div
            className="flex flex-col px-6 py-6 flex-1 min-h-0"
            style={{ width: "55%" }}
          >
            <div>{backBtn}</div>
            {title}
            {subtitle}
            <div className="flex-1 overflow-y-auto mt-6 flex flex-col gap-4 pb-2">
              {newPasswordField}
              {confirmField}
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
          {newPasswordField}
          {confirmField}
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

export default OnboardingAppSigninForgotReset;
