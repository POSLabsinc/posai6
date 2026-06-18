import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Globe, Smartphone } from "lucide-react";
import { useState } from "react";
import eatosLogo from "@/assets/icons/posai-logo.png";
import { SplashScreen } from "@/components/SplashScreen";

const Onboarding = () => {
  const navigate = useNavigate();
  const [showSplash, setShowSplash] = useState(false);

  if (showSplash) {
    return (
      <SplashScreen
        duration={2500}
        variant="brand"
        onComplete={() => navigate("/onboarding/app/carousel")}
      />
    );
  }


  return (
    <div className="fixed inset-0 login-bg flex flex-col items-center justify-center overflow-hidden">
      <div className="absolute inset-0 gradient-mesh opacity-30" />
      <div className="relative z-10 flex flex-col items-center text-center w-full max-w-2xl px-8">
        <motion.img
          src={eatosLogo}
          alt="POS AI"
          className="w-28 h-auto mb-6"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        />
        <motion.h1
          className="text-2xl md:text-3xl font-bold text-foreground mb-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          Welcome to POSAI POS
        </motion.h1>
        <motion.span
          className="inline-flex items-center rounded-full border border-foreground/[0.08] bg-foreground/[0.04] px-3 py-1 text-xs text-foreground/40 mb-10"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          Demo only, not shown in production
        </motion.span>

        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <button
            onClick={() => navigate("/onboarding/web")}
            className="flex items-center gap-4 px-5 py-5 rounded-2xl border border-foreground/[0.08] bg-foreground/[0.04] hover:bg-foreground/[0.07] transition-all text-left"
          >
            <div className="w-12 h-12 rounded-xl bg-foreground/[0.06] flex items-center justify-center flex-shrink-0">
              <Globe className="w-5 h-5 text-foreground/50" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Via website</p>
              <p className="text-xs text-foreground/40 mt-0.5">Already signed up on eatos.com or signing up now</p>
            </div>
          </button>

          <button
            onClick={() => navigate("/onboarding/app/carousel")}
            className="flex items-center gap-4 px-5 py-5 rounded-2xl border border-foreground/[0.08] bg-foreground/[0.04] hover:bg-foreground/[0.07] transition-all text-left"
          >
            <div className="w-12 h-12 rounded-xl bg-foreground/[0.06] flex items-center justify-center flex-shrink-0">
              <Smartphone className="w-5 h-5 text-foreground/50" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Via App Store / Play Store</p>
              <p className="text-xs text-foreground/40 mt-0.5">Downloaded the app and setting up for the first time</p>
            </div>
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default Onboarding;
