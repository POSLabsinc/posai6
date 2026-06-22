import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import MarketingPanel from "@/components/onboarding/MarketingPanel";
import {
  ChevronLeft,
  CreditCard,
  Receipt,
  BarChart3,
  Menu as MenuIcon,
  ChefHat,
  Utensils,
  ListOrdered,
  LayoutGrid,
} from "lucide-react";
import { useIsLandscape } from "@/hooks/use-landscape";
import standardVideo from "@/assets/onboarding/mode-standard.mp4.asset.json";
import quickserviceVideo from "@/assets/onboarding/mode-quickservice.mp4.asset.json";
import fullserviceVideo from "@/assets/onboarding/mode-fullservice.mp4.asset.json";

const MODE_VIDEO: Record<string, string> = {
  standard: standardVideo.url,
  quickservice: quickserviceVideo.url,
  fullservice: fullserviceVideo.url,
};


type Feature = {
  icon: React.ReactNode;
  title: string;
  description: string;
};

type ModeContent = {
  id: string;
  title: string;
  subtitle: string;
  features: Feature[];
};

const CONTENT: Record<string, ModeContent> = {
  standard: {
    id: "standard",
    title: "Standard mode",
    subtitle: "Take payments quickly with a flexible setup.",
    features: [
      {
        icon: <CreditCard className="w-5 h-5" />,
        title: "Fast payments",
        description: "Accept cash, card, and digital payments instantly.",
      },
      {
        icon: <Receipt className="w-5 h-5" />,
        title: "Simple checkout",
        description: "Customisable layout to match how you work.",
      },
      {
        icon: <BarChart3 className="w-5 h-5" />,
        title: "Sales reports",
        description: "Real-time sales and transaction history.",
      },
    ],
  },
  quickservice: {
    id: "quickservice",
    title: "Quick Service mode",
    subtitle: "Speed up ordering with smart menus and kitchen routing.",
    features: [
      {
        icon: <MenuIcon className="w-5 h-5" />,
        title: "Multi-channel menus",
        description: "Dine-in, takeaway, and delivery from one screen.",
      },
      {
        icon: <ChefHat className="w-5 h-5" />,
        title: "Kitchen routing",
        description: "Orders sent to kitchen display in real time.",
      },
      {
        icon: <Receipt className="w-5 h-5" />,
        title: "Fast checkout",
        description: "Split payments, discounts, and tips in seconds.",
      },
    ],
  },
  fullservice: {
    id: "fullservice",
    title: "Full Service mode",
    subtitle: "Optimise restaurant service with open checks, coursing, and floor plans.",
    features: [
      {
        icon: <Utensils className="w-5 h-5" />,
        title: "Table management",
        description: "Seat guests, manage covers, and track wait times.",
      },
      {
        icon: <ListOrdered className="w-5 h-5" />,
        title: "Course management",
        description: "Organise checks and kitchen tickets by course.",
      },
      {
        icon: <LayoutGrid className="w-5 h-5" />,
        title: "Floor plan",
        description: "Drag-and-drop layout with colour-coded table status.",
      },
    ],
  },
};

type LocationState = Record<string, unknown> | null;

type Props = { modeId: "standard" | "quickservice" | "fullservice" };

const OnboardingAppSignupModeDetail = ({ modeId }: Props) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isLandscape = useIsLandscape();
  const incoming = (location.state as LocationState) ?? {};
  const content = CONTENT[modeId];

  const isDemo = Boolean((incoming as { demo?: boolean }).demo);
  const [showDemoPopup, setShowDemoPopup] = useState(false);

  const handleBack = () => {
    navigate("/onboarding/app/signup/mode", {
      state: { ...incoming, selectedMode: modeId },
    });
  };

  const proceedToTrial = () => {
    navigate("/onboarding/app/signup/trial", {
      state: { ...incoming, mode: modeId },
    });
  };

  const handleUse = () => {
    if (isDemo) {
      setShowDemoPopup(true);
      return;
    }
    proceedToTrial();
  };

  const backBtn = (
    <button
      onClick={handleBack}
      className="w-10 h-10 rounded-full bg-neutral-800/60 flex items-center justify-center active:opacity-70 transition-opacity"
      aria-label="Back"
    >
      <ChevronLeft className="w-5 h-5 text-foreground" />
    </button>
  );

  const useBtn = (
    <button
      onClick={handleUse}
      className="w-full min-h-[44px] py-3 rounded-2xl text-sm font-semibold bg-primary text-primary-foreground active:opacity-80 transition-opacity"
    >
      Use this mode
    </button>
  );


  const title = (
    <h1 className="text-2xl font-bold text-foreground mt-2">{content.title}</h1>
  );

  const subtitle = (
    <p className="text-sm text-foreground/60 mt-0.5">{content.subtitle}</p>
  );

  const illustration = (
    <div className="w-full h-full rounded-2xl overflow-hidden bg-foreground/[0.04] border border-foreground/[0.08]">
      <video
        key={modeId}
        src={MODE_VIDEO[modeId]}
        autoPlay
        loop
        muted
        playsInline
        className="w-full h-full object-cover"
      />
    </div>
  );


  const featureList = (
    <div className="flex flex-col gap-2">
      {content.features.map((f) => (
        <div
          key={f.title}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl border border-foreground/[0.08] bg-foreground/[0.04]"
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-primary/15 text-primary">
            {f.icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">{f.title}</p>
            <p className="text-xs text-foreground/60 mt-0.5">{f.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
  const demoPopup = showDemoPopup && (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm px-4 pb-6 pt-6">
      <div className="w-full max-w-sm rounded-3xl bg-neutral-900 border border-foreground/10 p-6 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          </div>
          <div className="flex-1">
            <p className="text-base font-semibold text-primary">Demo mode, read only</p>
            <p className="text-sm text-foreground/70 mt-1">Add a business email to unlock full access.</p>
          </div>
        </div>
        <div className="mt-5 flex flex-col gap-2">
          <button
            onClick={() => navigate("/onboarding/app/signup/account", { state: incoming })}
            className="w-full min-h-[44px] py-3 rounded-2xl text-sm font-semibold bg-primary text-primary-foreground active:opacity-80 transition-opacity"
          >
            Add business email
          </button>
          <button
            onClick={() => { setShowDemoPopup(false); proceedToTrial(); }}
            className="w-full min-h-[44px] py-3 rounded-2xl text-sm font-semibold border border-foreground/15 text-foreground active:opacity-80 transition-opacity"
          >
            Continue exploring demo
          </button>
        </div>
      </div>
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
              eyebrow="Mode details preview"
              caption="Refines table count, service flow, and staff structure for the selected mode."
            />
          </div>
          <div
            className="flex flex-col px-6 py-6 flex-1 min-h-0"
            style={{ width: "55%" }}
          >
            <div>{backBtn}</div>
            <div className="mt-4">
              {title}
              {subtitle}
            </div>
            <div className="mt-4" style={{ height: "30vh" }}>
              {illustration}
            </div>
            <div className="flex-1 overflow-y-auto mt-4 pb-4">{featureList}</div>
            <div className="pt-2">{useBtn}</div>
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
          paddingTop: "max(1.5rem, env(safe-area-inset-top))",
          paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
        }}
      >
        <div className="mb-5">{backBtn}</div>
        <div>
          {title}
          {subtitle}
        </div>
        <div className="mt-5" style={{ height: "35vh" }}>
          {illustration}
        </div>
        <div className="flex-1 overflow-y-auto mt-5">{featureList}</div>
        <div className="pt-3">{useBtn}</div>

      </div>
    </div>
  );
};

export default OnboardingAppSignupModeDetail;
