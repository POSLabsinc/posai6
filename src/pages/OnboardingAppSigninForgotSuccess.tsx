import { useNavigate } from "react-router-dom";
import { Check } from "lucide-react";
import { useIsLandscape } from "@/hooks/use-landscape";
import MarketingPanel from "@/components/onboarding/MarketingPanel";

const OnboardingAppSigninForgotSuccess = () => {
  const navigate = useNavigate();
  const isLandscape = useIsLandscape();

  const handleBackToSignIn = () => {
    navigate("/onboarding/app/signin", { replace: true });
  };

  const successIcon = (
    <div className="w-[52px] h-[52px] rounded-full bg-emerald-500/15 flex items-center justify-center">
      <Check className="w-6 h-6 text-emerald-500" strokeWidth={3} />
    </div>
  );

  const title = (
    <h1 className="text-2xl font-bold text-foreground mt-6">Password reset</h1>
  );

  const subtitle = (
    <p className="text-sm text-foreground/60 mt-2 text-center">
      Your password has been updated successfully.
      <br />
      Sign in with your new password.
    </p>
  );

  const ctaButton = (
    <button
      onClick={handleBackToSignIn}
      className="w-full min-h-[44px] py-3 rounded-2xl text-sm font-semibold bg-primary text-primary-foreground active:opacity-80 transition-opacity"
    >
      Back to sign in
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
              eyebrow="All set"
              caption="Password updated. You can now sign in again."
            />
          </div>
          <div
            className="flex flex-col items-center px-6 py-6 flex-1 min-h-0"
            style={{ width: "55%" }}
          >
            <div className="flex flex-col items-center h-full w-full max-w-md mx-auto">
              <div className="flex-1 flex flex-col items-center justify-center">
                {successIcon}
                {title}
                {subtitle}
              </div>
              <div
                className="w-full pt-4"
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
      <div className="relative z-10 flex flex-col items-center h-full w-full max-w-md mx-auto px-6 pt-6">
        <div className="flex-1 flex flex-col items-center justify-center">
          {successIcon}
          {title}
          {subtitle}
        </div>
        <div
          className="w-full pt-2 pb-4"
          style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
        >
          {ctaButton}
        </div>
      </div>
    </div>
  );
};

export default OnboardingAppSigninForgotSuccess;
