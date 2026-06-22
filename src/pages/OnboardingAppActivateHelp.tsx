import { useNavigate } from "react-router-dom";
import { ChevronLeft, Info, Globe, LayoutGrid, Plus, CopyCheck } from "lucide-react";
import { useIsLandscape } from "@/hooks/use-landscape";

interface Step {
  number: number;
  title: string;
  description: string;
  chip?: {
    icon: React.ReactNode;
    label: string;
  };
}

const steps: Step[] = [
  {
    number: 1,
    title: "Open your dashboard",
    description: "Go to eatos.com/dashboard on your phone or computer and sign in.",
    chip: {
      icon: <Globe className="w-3.5 h-3.5" />,
      label: "eatos.com/dashboard",
    },
  },
  {
    number: 2,
    title: "Go to Devices",
    description: "Find the Devices section in your dashboard sidebar or settings.",
    chip: {
      icon: <LayoutGrid className="w-3.5 h-3.5" />,
      label: "Dashboard \u2192 Devices",
    },
  },
  {
    number: 3,
    title: "Tap Generate code",
    description: "Select the device type (Point of Sale) and tap Generate code.",
    chip: {
      icon: <Plus className="w-3.5 h-3.5" />,
      label: "Generate code \u2192 Point of Sale",
    },
  },
  {
    number: 4,
    title: "Enter the code here",
    description: "Copy the code and enter it on this screen. Codes are valid for 24 hours.",
    chip: {
      icon: <CopyCheck className="w-3.5 h-3.5" />,
      label: "Copy and paste code",
    },
  },
];

const OnboardingAppActivateHelp = () => {
  const navigate = useNavigate();
  const isLandscape = useIsLandscape();

  const backBtn = (
    <button
      onClick={() => navigate("/onboarding/app/activate")}
      className="w-10 h-10 rounded-full bg-neutral-800/60 flex items-center justify-center active:opacity-70 transition-opacity"
      aria-label="Back"
    >
      <ChevronLeft className="w-5 h-5 text-foreground" />
    </button>
  );

  const title = (
    <h1 className="text-2xl font-bold text-foreground mt-2">Where do I find my code?</h1>
  );
  const subtitle = (
    <p className="text-sm text-foreground/60 mt-2">
      Follow these steps to generate an activation code from your dashboard.
    </p>
  );

  const stepList = (
    <div className="flex flex-col gap-0">
      {steps.map((step, idx) => (
        <div key={step.number} className="flex gap-4">
          {/* Timeline column */}
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
              <span className="text-sm font-bold text-primary">{step.number}</span>
            </div>
            {idx < steps.length - 1 && (
              <div className="w-px flex-1 bg-foreground/10 my-1" />
            )}
          </div>
          {/* Content */}
          <div className="flex flex-col pb-6">
            <h3 className="text-sm font-semibold text-foreground">{step.title}</h3>
            <p className="text-sm text-foreground/60 mt-1 leading-relaxed">
              {step.description}
            </p>
            {step.chip && (
              <div className="mt-2 inline-flex items-center gap-2 rounded-xl border border-foreground/[0.08] bg-foreground/[0.04] px-3 py-2 w-fit">
                <span className="text-foreground/70">{step.chip.icon}</span>
                <span className="text-xs font-medium text-foreground/80">{step.chip.label}</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  const infoBanner = (
    <div className="flex items-start gap-2.5 rounded-2xl border border-primary/20 bg-primary/10 p-4">
      <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
      <p className="text-xs text-foreground/80 leading-relaxed">
        Each code can only be used once and expires after 24 hours. Generate a new one if yours has expired.
      </p>
    </div>
  );

  const ctaButton = (
    <button
      onClick={() => navigate("/onboarding/app/activate")}
      className="w-full min-h-[44px] py-3 rounded-full text-sm font-semibold bg-primary text-primary-foreground active:opacity-80 transition-opacity"
    >
      Got it, enter my code
    </button>
  );

  if (isLandscape) {
    return (
      <div className="fixed inset-0 login-bg overflow-hidden">
        <div className="absolute inset-0 gradient-mesh opacity-30 pointer-events-none" />
        <div
          className="relative z-10 flex h-full w-full items-center justify-center"
          style={{
            paddingLeft: "env(safe-area-inset-left)",
            paddingRight: "env(safe-area-inset-right)",
          }}
        >
          <div className="flex flex-col w-full max-w-[420px] h-full px-6 py-6">
            <div>{backBtn}</div>
            <div className="mt-6">
              {title}
              {subtitle}
            </div>
            <div className="flex-1 overflow-y-auto mt-6 flex flex-col gap-5">
              {stepList}
              {infoBanner}
            </div>
            <div
              className="pt-4"
              style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
            >
              {ctaButton}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 login-bg flex flex-col overflow-hidden">
      <div className="absolute inset-0 gradient-mesh opacity-30 pointer-events-none" />
      <div className="relative z-10 flex flex-col h-full w-full max-w-md mx-auto px-6 pt-6">
        <div className="mb-5">{backBtn}</div>
        {title}
        {subtitle}
        <div className="flex-1 overflow-y-auto mt-6 flex flex-col gap-5">
          {stepList}
          {infoBanner}
        </div>
        <div
          className="pt-3 pb-4"
          style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
        >
          {ctaButton}
        </div>
      </div>
    </div>
  );
};

export default OnboardingAppActivateHelp;
