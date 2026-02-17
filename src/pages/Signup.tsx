import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Building2, Mail, Lock, User, Check } from "lucide-react";
import eatosLogo from "@/assets/icons/eatos-logo.svg";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

type SignupStep = "info" | "business" | "success";

const Signup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [step, setStep] = useState<SignupStep>("info");
  const [isLoading, setIsLoading] = useState(false);
  
  // Form fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("");

  const handleInfoSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setStep("business");
  }, []);

  const handleBusinessSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setStep("success");
      
      // Auto-redirect after success
      setTimeout(() => {
        toast({
          title: "Account created",
          description: "Welcome to eatOS! Let's set up your business.",
        });
        navigate("/login");
      }, 2500);
    }, 1000);
  }, [navigate, toast]);

  const businessTypes = [
    { id: "restaurant", label: "Restaurant" },
    { id: "cafe", label: "Café" },
    { id: "bar", label: "Bar & Lounge" },
    { id: "fastfood", label: "Fast Food" },
    { id: "foodtruck", label: "Food Truck" },
    { id: "other", label: "Other" },
  ];

  return (
    <div className="fixed inset-0 login-bg flex flex-col items-center justify-center overflow-hidden">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 gradient-mesh opacity-30" />
      
      <div className="relative z-10 w-full max-w-md px-6 flex flex-col items-center">
        {/* Logo */}
        <motion.img
          src={eatosLogo}
          alt="eatOS"
          className="w-24 h-auto mb-8"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        />

        {step === "info" && (
          <motion.div
            key="info"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full"
          >
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-2xl font-semibold text-foreground mb-2">
                Create your account
              </h1>
              <p className="text-sm text-foreground/50">
                Start accepting orders in minutes
              </p>
            </div>

            <form onSubmit={handleInfoSubmit} className="space-y-4">
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
                <Input
                  type="text"
                  placeholder="Full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="h-14 pl-12 bg-foreground/5 border-foreground/10 text-foreground placeholder:text-foreground/40 rounded-2xl text-base"
                  required
                />
              </div>

              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
                <Input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-14 pl-12 bg-foreground/5 border-foreground/10 text-foreground placeholder:text-foreground/40 rounded-2xl text-base"
                  required
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-14 pl-12 bg-foreground/5 border-foreground/10 text-foreground placeholder:text-foreground/40 rounded-2xl text-base"
                  required
                  minLength={8}
                />
              </div>

              <Button
                type="submit"
                className="w-full h-14 rounded-2xl bg-gradient-to-b from-foreground/90 to-foreground text-background font-semibold text-base mt-2"
              >
                Continue
              </Button>
            </form>

            {/* Back to login */}
            <button
              onClick={() => navigate("/login")}
              className="w-full flex items-center justify-center gap-2 mt-6 text-sm text-foreground/40 hover:text-foreground/60 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to sign in</span>
            </button>
          </motion.div>
        )}

        {step === "business" && (
          <motion.div
            key="business"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full"
          >
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-2xl font-semibold text-foreground mb-2">
                Tell us about your business
              </h1>
              <p className="text-sm text-foreground/50">
                We'll customize your experience
              </p>
            </div>

            <form onSubmit={handleBusinessSubmit} className="space-y-4">
              <div className="relative">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
                <Input
                  type="text"
                  placeholder="Business name"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="h-14 pl-12 bg-foreground/5 border-foreground/10 text-foreground placeholder:text-foreground/40 rounded-2xl text-base"
                  required
                />
              </div>

              {/* Business Type Selection */}
              <div className="grid grid-cols-2 gap-2">
                {businessTypes.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setBusinessType(type.id)}
                    className={`h-12 rounded-xl text-sm font-medium transition-all ${
                      businessType === type.id
                        ? "bg-foreground text-background"
                        : "bg-foreground/5 text-foreground/70 border border-foreground/10 hover:bg-foreground/10"
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>

              <Button
                type="submit"
                disabled={isLoading || !businessName || !businessType}
                className="w-full h-14 rounded-2xl bg-gradient-to-b from-foreground/90 to-foreground text-background font-semibold text-base mt-2 disabled:opacity-50"
              >
                {isLoading ? "Creating account..." : "Create account"}
              </Button>
            </form>

            {/* Back */}
            <button
              onClick={() => setStep("info")}
              className="w-full flex items-center justify-center gap-2 mt-6 text-sm text-foreground/40 hover:text-foreground/60 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          </motion.div>
        )}

        {step === "success" && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full flex flex-col items-center py-12"
          >
            {/* Success Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
              className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mb-6"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3 }}
                className="w-14 h-14 rounded-full bg-emerald-500 flex items-center justify-center"
              >
                <Check className="w-7 h-7 text-white" strokeWidth={3} />
              </motion.div>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-2xl font-semibold text-foreground mb-2"
            >
              Welcome to eatOS
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-sm text-foreground/50 text-center"
            >
              Your account has been created successfully.<br />
              Redirecting you to sign in...
            </motion.p>

            {/* Loading indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="mt-8"
            >
              <div className="w-8 h-8 relative">
                <div className="absolute inset-0 rounded-full border-2 border-foreground/10" />
                <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-foreground/60 animate-spin" />
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Footer */}
        {step !== "success" && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-xs text-foreground/30 text-center mt-8"
          >
            By creating an account, you agree to our Terms of Service and Privacy Policy.
          </motion.p>
        )}
      </div>
    </div>
  );
};

export default Signup;
