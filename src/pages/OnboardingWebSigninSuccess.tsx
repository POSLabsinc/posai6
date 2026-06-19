import { useLocation, useNavigate } from "react-router-dom";
import { Check, Monitor, MapPin, Smartphone, Landmark, Globe } from "lucide-react";
import { useIsLandscape } from "@/hooks/use-landscape";
import MarketingPanel from "@/components/onboarding/MarketingPanel";

const OnboardingWebSigninSuccess = () => {
  const navigate = useNavigate();
  const isLandscape = useIsLandscape();
  const location = useLocation() as {
    state?: {
      restaurant_name?: string;
      locations_active?: number;
      devices_paired?: number;
    };
  };

  const restaurantName = location.state?.restaurant_name ?? "The Rustic Table";
  const locationsActive = location.state?.locations_active ?? 1;
  const devicesPaired = location.state?.devices_paired ?? 0;

  const handleCta = () => {
    navigate("/dashboard", { replace: true });
  };

  const appChip = (
    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/15 text-primary text-xs font-semibold">
      <Monitor className="w-3.5 h-3.5" />
      POSAI POS
    </div>
  );

  const signedInLabel = (
    <p className="mt-3 text-[11px] font-semibold tracking-[0.16em] uppercase text-foreground/50">
      Signed in
    </p>
  );

  const successRing = (
    <div className="mt-3 w-14 h-14 rounded-full flex items-center justify-center bg-emerald-500/15">
      <Check className="w-6 h-6 text-emerald-500" strokeWidth={3} />
    </div>
  );

  const title = (
    <h1 className="text-2xl font-bold text-foreground mt-4 text-center">
      Welcome back
    </h1>
  );

  const restaurant = (
    <p className="text-sm text-foreground/60 mt-1 text-center">{restaurantName}</p>
  );

  const badge = (
    <div className="mt-4 inline-flex items-center gap-2 px-3 py-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10">
      <Globe className="w-4 h-4 text-emerald-500" />
      <span className="text-xs font-medium text-emerald-500">Via website</span>
    </div>
  );

  const statusCard = (
    <div className="w-full rounded-2xl border border-foreground/[0.08] bg-foreground/[0.04] p-4 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <MapPin className="w-4 h-4 text-primary" />
        <span className="text-sm text-foreground">
          {locationsActive} {locationsActive === 1 ? "location" : "locations"} active
        </span>
      </div>
      <div className="flex items-center gap-3">
        <Smartphone className="w-4 h-4 text-primary" />
        <span className="text-sm text-foreground">
          {devicesPaired} {devicesPaired === 1 ? "device" : "devices"} paired
        </span>
      </div>
      <div className="flex items-center gap-3">
        <Landmark className="w-4 h-4 text-foreground/40" />
        <span className="text-sm text-foreground/50">Bank account not linked</span>
      </div>
    </div>
  );

  const ctaButton = (
    <button
      onClick={handleCta}
      className="w-full min-h-[44px] py-3 rounded-2xl text-sm font-semibold bg-emerald-500 text-white active:opacity-80 transition-opacity"
    >
      Go to dashboard
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
              eyebrow="Welcome back"
              caption="You are signed in. Continuing to your workspace."
            />
          </div>
          <div
            className="flex flex-col items-center px-6 py-6 flex-1 min-h-0"
            style={{ width: "55%" }}
          >
            <div className="flex flex-col items-center h-full w-full max-w-md mx-auto">
              <div className="flex-1 w-full flex flex-col items-center overflow-y-auto">
                {appChip}
                {signedInLabel}
                {successRing}
                {title}
                {restaurant}
                {badge}
                <div className="w-full mt-6">{statusCard}</div>
              </div>
              <div
                className="w-full pt-3"
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
      <div className="relative z-10 flex flex-col items-center h-full w-full max-w-md mx-auto px-6 pt-8">
        <div className="flex-1 w-full flex flex-col items-center overflow-y-auto">
          {appChip}
          {signedInLabel}
          {successRing}
          {title}
          {restaurant}
          {badge}
          <div className="w-full mt-6">{statusCard}</div>
        </div>
        <div
          className="w-full pt-3 pb-4"
          style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
        >
          {ctaButton}
        </div>
      </div>
    </div>
  );
};

export default OnboardingWebSigninSuccess;
