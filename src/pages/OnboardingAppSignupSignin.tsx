import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { UserPlus, LogIn } from "lucide-react";
import eatosLogo from "@/assets/icons/posai-logo.png";

const OnboardingAppSignupSignin = () => {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 login-bg flex flex-col overflow-hidden">
      <div className="absolute inset-0 gradient-mesh opacity-30 pointer-events-none" />

      <div className="relative z-10 flex flex-col h-full max-w-md mx-auto w-full px-6 pt-6 pb-8">
        {/* Top section: logo + text */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <motion.img
            src={eatosLogo}
            alt="POS AI"
            className="w-28 h-auto mb-6"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          />

          <motion.h1
            className="text-2xl font-bold text-foreground mb-3 text-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            Get started
          </motion.h1>

          <motion.p
            className="text-sm text-foreground/60 text-center mb-10"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Set up your restaurant or sign in to an existing account.
          </motion.p>

          {/* Cards */}
          <motion.div
            className="flex flex-col gap-4 w-full"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <button
              onClick={() => navigate("/onboarding/app/signup")}
              className="flex items-center gap-4 px-5 py-5 rounded-2xl border border-foreground/[0.08] bg-foreground/[0.04] hover:bg-foreground/[0.07] transition-all text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-foreground/[0.06] flex items-center justify-center flex-shrink-0">
                <UserPlus className="w-5 h-5 text-foreground/50" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Create account</p>
                <p className="text-xs text-foreground/40 mt-0.5">New to POSAI? Set up your restaurant.</p>
              </div>
            </button>

            <button
              onClick={() => navigate("/onboarding/app/signin")}
              className="flex items-center gap-4 px-5 py-5 rounded-2xl border border-foreground/[0.08] bg-foreground/[0.04] hover:bg-foreground/[0.07] transition-all text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-foreground/[0.06] flex items-center justify-center flex-shrink-0">
                <LogIn className="w-5 h-5 text-foreground/50" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Sign in</p>
                <p className="text-xs text-foreground/40 mt-0.5">Already have a POSAI account.</p>
              </div>
            </button>
          </motion.div>
        </div>

        {/* Legal footer */}
        <motion.p
          className="text-[11px] text-foreground/40 text-center leading-relaxed"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          By continuing you agree to POSAI{" "}
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
      </div>
    </div>
  );
};

export default OnboardingAppSignupSignin;
