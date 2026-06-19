import { useEffect, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import MarketingPanel from "@/components/onboarding/MarketingPanel";
import {
  Rocket,
  Clock,
  Eye,
  Check,
  Lock,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useIsLandscape } from "@/hooks/use-landscape";

type Intent = "signup_org" | "signup_demo" | "upgrade_email";

type LocationState = {
  place?: { name: string; address: string } | null;
  email?: string;
  country?: string;
  intent?: Intent;
  revenue?: string;
  mode?: string;
};

const MODE_TITLES: Record<string, string> = {
  standard: "Standard",
  quickservice: "Quick Service",
  fullservice: "Full Service",
};

const ORG_FEATURES = [
  "Full access to all features",
  "Unlimited devices",
  "Real-time kitchen routing",
  "Cancel anytime",
];

const DEMO_AVAILABLE = ["Browse dashboard", "Preview menu builder"];
const DEMO_LOCKED = ["Process payments", "Activate devices"];

const OnboardingAppSignupTrial = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isLandscape = useIsLandscape();
  const incoming = (location.state as LocationState) ?? {};
  const intent: Intent = incoming.intent ?? "signup_org";
  const isOrg = intent === "signup_org";

  const restaurantName = incoming.place?.name || "your restaurant";
  const modeTitle = MODE_TITLES[incoming.mode || "standard"] || "Standard";

  const handleStartTrial = () => {
    navigate("/home");
  };

  const handleLater = () => {
    navigate("/home");
  };

  const handleAddBusinessEmail = () => {
    navigate("/onboarding/app/signup/upgrade", { state: incoming });
  };

  const iconCircle = (
    <div className="w-[52px] h-[52px] rounded-full bg-primary/10 flex items-center justify-center">
      <Rocket className="w-6 h-6 text-primary" />
    </div>
  );

  const title = (
    <h1 className="text-2xl font-bold text-foreground mt-4 text-center">
      You're all set, {restaurantName}
    </h1>
  );

  const subtitle = (
    <p className="text-sm text-foreground/60 mt-0.5 text-center">
      {modeTitle} selected.
    </p>
  );

  const trialBadge = isOrg ? (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/20 bg-primary/10 text-primary text-sm font-medium">
      <Clock className="w-3.5 h-3.5" />
      <span>14-day free trial — no card needed</span>
    </div>
  ) : (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 text-amber-400 text-sm font-medium">
      <Eye className="w-3.5 h-3.5" />
      <span>Demo mode — limited access</span>
    </div>
  );

  const warningBanner = !isOrg && (
    <div className="flex items-start gap-2 px-4 py-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 text-amber-400">
      <p className="text-xs leading-relaxed">
        Add a business email to unlock your 14-day free trial and full access.
      </p>
    </div>
  );

  const featureList = (
    <div className="w-full rounded-2xl border border-foreground/[0.08] bg-foreground/[0.04] overflow-hidden">
      {isOrg ? (
        ORG_FEATURES.map((feature, i) => (
          <div
            key={feature}
            className={`flex items-center gap-3 px-4 py-3 ${
              i < ORG_FEATURES.length - 1 ? "border-b border-foreground/[0.06]" : ""
            }`}
          >
            <Check className="w-4 h-4 text-primary flex-shrink-0" />
            <span className="text-sm text-foreground">{feature}</span>
          </div>
        ))
      ) : (
        <>
          {DEMO_AVAILABLE.map((feature, i) => (
            <div
              key={feature}
              className={`flex items-center gap-3 px-4 py-3 ${
                i < DEMO_AVAILABLE.length - 1 ? "border-b border-foreground/[0.06]" : ""
              }`}
            >
              <Check className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="text-sm text-foreground">{feature}</span>
            </div>
          ))}
          {DEMO_LOCKED.map((feature, i) => (
            <div
              key={feature}
              className={`flex items-center gap-3 px-4 py-3 ${
                i < DEMO_LOCKED.length - 1 ? "border-b border-foreground/[0.06]" : ""
              }`}
            >
              <Lock className="w-4 h-4 text-foreground/40 flex-shrink-0" />
              <span className="text-sm text-foreground/40">{feature}</span>
            </div>
          ))}
        </>
      )}
    </div>
  );

  const primaryCta = isOrg ? (
    <button
      onClick={handleStartTrial}
      className="w-full min-h-[44px] py-3 rounded-2xl text-sm font-semibold bg-primary text-primary-foreground active:opacity-80 transition-opacity"
    >
      Start free trial
    </button>
  ) : (
    <button
      onClick={handleAddBusinessEmail}
      className="w-full min-h-[44px] py-3 rounded-2xl text-sm font-semibold bg-amber-500 text-black active:opacity-80 transition-opacity"
    >
      Add business email
    </button>
  );

  const secondaryCta = (
    <button
      onClick={handleLater}
      className="w-full min-h-[44px] py-3 rounded-2xl text-sm font-semibold border border-foreground/[0.12] text-foreground bg-transparent active:bg-foreground/[0.04] transition-colors"
    >
      {isOrg ? "I'll do this later" : "Continue in demo"}
    </button>
  );

  const portraitContent = (
    <div className="flex flex-col items-center w-full">
      {iconCircle}
      {title}
      {subtitle}
      <div className="mt-5">{trialBadge}</div>
      {warningBanner && <div className="mt-4 w-full">{warningBanner}</div>}
      <div className="mt-5 w-full">{featureList}</div>
    </div>
  );

  const ctaBlock = (
    <div className="flex flex-col gap-2 w-full">
      {primaryCta}
      {secondaryCta}
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
            className="flex flex-col border-r border-foreground/[0.08]"
            style={{ width: "45%" }}
          >
            <MarketingPanel
              eyebrow="Trial preview"
              caption="Activates your free trial with full Point of Sale features unlocked."
            />
          </div>
          <div
            className="flex flex-col px-6 py-6 flex-1 min-h-0"
            style={{ width: "55%" }}
          >
            <div className="flex-1 overflow-y-auto flex flex-col">
              <div className="flex flex-col items-center mt-2">
                {iconCircle}
                {title}
                {subtitle}
                <div className="mt-5">{trialBadge}</div>
              </div>
              <div className="mt-5 flex flex-col gap-4">
                {warningBanner}
                {featureList}
              </div>
            </div>
            <div
              className="pt-4 flex flex-col gap-2"
              style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
            >
              {primaryCta}
              {secondaryCta}
            </div>
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
        style={{
          paddingTop: "max(2rem, env(safe-area-inset-top))",
          paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
        }}
      >
        <div className="flex-1 overflow-y-auto flex flex-col">
          <div className="flex-1 flex flex-col items-center justify-center">
            {portraitContent}
          </div>
        </div>
        <div className="pt-3 flex-shrink-0">{ctaBlock}</div>
      </div>
    </div>
  );
};

export default OnboardingAppSignupTrial;
