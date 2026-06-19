import { useLocation, useNavigate } from "react-router-dom";
import { Check } from "lucide-react";
import { useIsLandscape } from "@/hooks/use-landscape";

const OnboardingAppActivateSuccess = () => {
  const navigate = useNavigate();
  const isLandscape = useIsLandscape();
  const location = useLocation() as {
    state?: {
      code?: string;
      restaurant_name?: string;
      device?: string;
      device_name?: string;
    };
  };

  const restaurantName = location.state?.restaurant_name ?? "The Rustic Table";
  const device = location.state?.device ?? "Point of Sale";
  const deviceName = location.state?.device_name ?? "Rustic Table Point of Sale 1";
  const code = location.state?.code ?? "POS-XXXX-XX";

  const handleLaunch = () => {
    navigate("/", { replace: true });
  };

  const successRing = (
    <div className="w-14 h-14 rounded-full bg-emerald-500/15 flex items-center justify-center">
      <Check className="w-6 h-6 text-emerald-500" strokeWidth={3} />
    </div>
  );

  const title = (
    <h1 className="text-2xl font-bold text-foreground mt-4 text-center">
      Terminal activated
    </h1>
  );

  const subtitle = (
    <p className="text-sm text-foreground/60 mt-2 text-center">
      This Point of Sale is now linked to {restaurantName}
    </p>
  );

  const deviceCard = (
    <div className="w-full rounded-2xl border border-foreground/[0.08] bg-foreground/[0.04] p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-[0.12em] text-foreground/50 font-semibold">
          Device
        </span>
        <span className="text-sm text-foreground">{device}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-[0.12em] text-foreground/50 font-semibold">
          Name
        </span>
        <span className="text-sm text-foreground">{deviceName}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-[0.12em] text-foreground/50 font-semibold">
          Code
        </span>
        <span
          className="text-sm text-foreground/50"
          style={{ fontFamily: "var(--font-mono)", letterSpacing: "1px" }}
        >
          {code} · Used
        </span>
      </div>
    </div>
  );

  const ctaButton = (
    <button
      onClick={handleLaunch}
      className="w-full min-h-[44px] py-3 rounded-2xl text-sm font-semibold bg-emerald-500 text-white active:opacity-80 transition-opacity"
    >
      Launch Point of Sale
    </button>
  );

  const Content = (
    <>
      {successRing}
      {title}
      {subtitle}
      <div className="w-full mt-6">{deviceCard}</div>
    </>
  );

  if (isLandscape) {
    return (
      <div className="fixed inset-0 login-bg overflow-hidden">
        <div className="absolute inset-0 gradient-mesh opacity-30 pointer-events-none" />
        <div
          className="relative z-10 flex flex-col items-center h-full w-full px-6 mx-auto"
          style={{
            maxWidth: "360px",
            paddingLeft: "max(1.5rem, env(safe-area-inset-left))",
            paddingRight: "max(1.5rem, env(safe-area-inset-right))",
          }}
        >
          <div className="flex-1 w-full flex flex-col items-center justify-center">
            {Content}
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
  }

  return (
    <div className="fixed inset-0 login-bg flex flex-col overflow-hidden">
      <div className="absolute inset-0 gradient-mesh opacity-30 pointer-events-none" />
      <div className="relative z-10 flex flex-col items-center h-full w-full max-w-md mx-auto px-6 pt-8">
        <div className="flex-1 w-full flex flex-col items-center justify-center overflow-y-auto">
          {Content}
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

export default OnboardingAppActivateSuccess;
