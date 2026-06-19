import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

const OnboardingAppActivateValidating = () => {
  const navigate = useNavigate();
  const location = useLocation() as {
    state?: {
      code?: string;
      restaurant_name?: string;
      device?: string;
      device_name?: string;
    };
  };

  const restaurantName = location.state?.restaurant_name ?? "The Rustic Table";

  useEffect(() => {
    const t = setTimeout(() => {
      navigate("/onboarding/app/activate/success", {
        state: {
          code: location.state?.code,
          restaurant_name: restaurantName,
          device: location.state?.device ?? "Point of Sale",
          device_name: location.state?.device_name ?? "Rustic Table POS 1",
        },
        replace: true,
      });
    }, 1800);
    return () => clearTimeout(t);
  }, [navigate, restaurantName, location.state]);

  return (
    <div className="fixed inset-0 login-bg flex flex-col overflow-hidden">
      <div className="absolute inset-0 gradient-mesh opacity-30 pointer-events-none" />
      <div className="relative z-10 flex flex-col items-center justify-center h-full w-full px-6 text-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <h1 className="text-2xl font-bold text-foreground mt-5">Activating…</h1>
        <p className="text-sm text-foreground/60 mt-2">
          Linking this terminal to {restaurantName}
        </p>
        <div className="mt-6 w-[140px] h-[3px] rounded-full bg-foreground/[0.08] overflow-hidden">
          <div
            className="h-full bg-primary rounded-full"
            style={{
              width: "40%",
              animation: "activateProgress 1.6s ease-in-out infinite",
            }}
          />
        </div>
        <style>{`
          @keyframes activateProgress {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(350%); }
          }
        `}</style>
      </div>
    </div>
  );
};

export default OnboardingAppActivateValidating;
