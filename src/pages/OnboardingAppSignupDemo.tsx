import { useLocation, useNavigate } from "react-router-dom";
import { Eye, Check, Lock, ArrowUpRight, ChevronLeft } from "lucide-react";
import { useIsLandscape } from "@/hooks/use-landscape";

type LocationState = {
  place?: { name: string; address: string } | null;
  email?: string;
  country?: string;
  demo?: boolean;
};

const AVAILABLE = ["Browse dashboard", "Preview menu builder"];
const LOCKED = ["Process payments", "Activate devices", "Go live"];

const OnboardingAppSignupDemo = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isLandscape = useIsLandscape();
  const state = (location.state as LocationState) ?? {};

  const goUpgrade = () =>
    navigate("/onboarding/app/signup/upgrade", { state });
  const goDashboard = () => navigate("/");

  const banner = (
    <div className="rounded-2xl border border-primary/20 bg-primary/[0.08] px-4 py-3">
      <div className="flex items-center gap-2">
        <Eye className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold text-primary">
          Demo mode, read only
        </span>
      </div>
      <p className="text-xs text-foreground/60 mt-1">
        Add a business email to unlock full access.
      </p>
      <button
        onClick={goUpgrade}
        className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline underline-offset-2"
      >
        Upgrade now
        <ArrowUpRight className="w-3 h-3" />
      </button>
    </div>
  );

  const sectionTitle = (
    <p className="text-[11px] font-semibold tracking-[0.14em] uppercase text-foreground/60">
      What's available in demo
    </p>
  );

  const checklist = (
    <div className="rounded-2xl border border-foreground/[0.08] bg-foreground/[0.04] overflow-hidden">
      {AVAILABLE.map((label, i) => (
        <div
          key={label}
          className={`flex items-center gap-3 px-4 py-3 ${
            i > 0 ? "border-t border-foreground/[0.06]" : ""
          }`}
        >
          <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center">
            <Check className="w-3.5 h-3.5 text-primary" />
          </div>
          <span className="text-sm text-foreground">{label}</span>
        </div>
      ))}
      {LOCKED.map((label) => (
        <div
          key={label}
          className="flex items-center gap-3 px-4 py-3 border-t border-foreground/[0.06]"
        >
          <div className="w-6 h-6 rounded-full bg-foreground/[0.06] flex items-center justify-center">
            <Lock className="w-3.5 h-3.5 text-foreground/50" />
          </div>
          <span className="text-sm text-foreground/50">{label}</span>
        </div>
      ))}
    </div>
  );

  const primaryCta = (
    <button
      onClick={goUpgrade}
      className="w-full min-h-[44px] py-3 rounded-2xl text-sm font-semibold bg-primary text-primary-foreground active:opacity-80 transition-opacity"
    >
      Add business email
    </button>
  );

  const secondaryCta = (
    <button
      onClick={goDashboard}
      className="w-full min-h-[44px] py-3 rounded-2xl text-sm font-semibold bg-foreground/[0.06] text-foreground border border-foreground/[0.10] active:opacity-80 transition-opacity"
    >
      Continue exploring demo
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
            <div
              className="flex-1 flex flex-col gap-4 overflow-y-auto"
              style={{ paddingTop: "env(safe-area-inset-top)" }}
            >
              {banner}
              {sectionTitle}
            </div>
            <div
              className="pt-3 flex flex-col gap-2"
              style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
            >
              {primaryCta}
              {secondaryCta}
            </div>
          </div>
          <div
            className="flex flex-col px-6 py-6 flex-1 min-h-0"
            style={{ width: "55%" }}
          >
            <div className="flex-1 overflow-y-auto">{checklist}</div>
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
        {banner}
        <div className="mt-6">{sectionTitle}</div>
        <div className="flex-1 overflow-y-auto mt-3 pb-4">{checklist}</div>
        <div
          className="pt-2 flex flex-col gap-2"
          style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
        >
          {primaryCta}
          {secondaryCta}
        </div>
      </div>
    </div>
  );
};

export default OnboardingAppSignupDemo;
