import { motion } from "framer-motion";
import MarketingPanel from "@/components/onboarding/MarketingPanel";
import { useNavigate } from "react-router-dom";
import { UserPlus, LogIn } from "lucide-react";
import { useThemeLogo } from "@/components/ThemeLogo";
import { useIsLandscape } from "@/hooks/use-landscape";
import AnimatedAIIcon from "@/components/AnimatedAIIcon";

const OnboardingAppSignupSignin = () => {
  const navigate = useNavigate();
  const isLandscape = useIsLandscape();
  const themeLogo = useThemeLogo();

  const logo = (
    <motion.img
      src={themeLogo}
      alt="POS AI"
      className="w-36 h-auto mb-6"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
    />
  );

  const title = (
    <motion.h1
      className="text-2xl font-bold text-foreground mb-3 text-center"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      Get started
    </motion.h1>
  );

  const subtitle = (
    <motion.p
      className="text-sm text-foreground/60 text-center"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      Set up your restaurant or sign in to an existing account.
    </motion.p>
  );

  const cards = (
    <motion.div
      className="flex flex-col gap-4 w-full max-w-md"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <button
        onClick={() => navigate("/onboarding/app/signup/lookup")}
        className="flex items-center gap-4 px-5 py-5 rounded-2xl border border-foreground/[0.08] bg-foreground/[0.04] hover:bg-foreground/[0.07] transition-all text-left min-h-[44px]"
      >
        <div className="w-12 h-12 rounded-xl bg-foreground/[0.06] flex items-center justify-center flex-shrink-0">
          <UserPlus className="w-5 h-5 text-foreground/50" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">Create account</p>
          <p className="text-xs text-foreground/40 mt-0.5">New to PointofSaleAi? Set up your restaurant.</p>
        </div>
      </button>

      <button
        onClick={() => navigate("/onboarding/app/signin")}
        className="flex items-center gap-4 px-5 py-5 rounded-2xl border border-foreground/[0.08] bg-foreground/[0.04] hover:bg-foreground/[0.07] transition-all text-left min-h-[44px]"
      >
        <div className="w-12 h-12 rounded-xl bg-foreground/[0.06] flex items-center justify-center flex-shrink-0">
          <LogIn className="w-5 h-5 text-foreground/50" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">Sign in</p>
          <p className="text-xs text-foreground/40 mt-0.5">Already have a PointofSaleAi account.</p>
        </div>
      </button>
    </motion.div>
  );

  const legal = (
    <motion.p
      className="text-[11px] text-foreground/40 text-center leading-relaxed"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
    >
      By continuing you agree to PointofSaleAi{" "}
      <span
        className="underline underline-offset-2 cursor-pointer hover:text-foreground/60 transition-colors"
        onClick={() => {}}
      >
        Terms of Service
      </span>{" "}
      and{" "}
      <span
        className="underline underline-offset-2 cursor-pointer hover:text-foreground/60 transition-colors"
        onClick={() => {}}
      >
        Privacy Policy
      </span>
    </motion.p>
  );

  const floatingAIButton = (
    <button
      onClick={() => navigate("/onboarding/app/ai")}
      aria-label="Open Point of Sale Ai"
      className="fixed z-50 rounded-full bg-foreground/[0.06] border border-foreground/[0.08] backdrop-blur-md shadow-2xl flex items-center justify-center hover:bg-foreground/[0.1] active:scale-95 transition-all w-14 h-14"
      style={{
        right: "max(1.25rem, env(safe-area-inset-right))",
        bottom: "max(1.5rem, env(safe-area-inset-bottom))",
      }}
    >
      <AnimatedAIIcon size={28} />
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
              eyebrow="Sign in preview"
              caption="Returning users authenticate by device code, sign-in link, or demo mode."
            />
          </div>
          <div
            className="flex flex-col px-6 py-6 flex-1 min-h-0"
            style={{ width: "55%" }}
          >
            <div className="flex flex-col items-center">
              {logo}
              {title}
              <div className="mb-6">{subtitle}</div>
            </div>
            <div className="flex-1 overflow-y-auto flex flex-col justify-center">
              {cards}
            </div>
            <div
              className="pt-3"
              style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
            >
              {legal}
            </div>
          </div>
        </div>
        {floatingAIButton}
      </div>
    );
  }


  return (
    <div className="fixed inset-0 login-bg flex flex-col overflow-hidden">
      <div className="absolute inset-0 gradient-mesh opacity-30 pointer-events-none" />
      <div className="relative z-10 flex flex-col h-full max-w-md mx-auto w-full px-6 pt-6 pb-8">
        <div className="flex-1 flex flex-col items-center justify-center">
          {logo}
          {title}
          <div className="mb-10">{subtitle}</div>
          {cards}
        </div>
        {legal}
      </div>
      {floatingAIButton}
    </div>
  );
};

export default OnboardingAppSignupSignin;
