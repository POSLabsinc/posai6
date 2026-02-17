import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import Settings from "@/pages/Settings";
import HardwareContent from "@/components/settings/HardwareContent";
import AnimatedAIIcon from "@/components/AnimatedAIIcon";

const HardwareRoute = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  if (isMobile) {
    return (
      <div className="min-h-screen bg-background">
        {/* Mobile Header with back button and AI icon */}
        <div className="flex items-center justify-between px-4 py-3 overflow-visible">
          <button
            onClick={() => navigate('/settings')}
            className="w-10 h-10 rounded-full bg-neutral-800/60 flex items-center justify-center active:opacity-70 transition-opacity"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <AnimatedAIIcon size={24} onClick={() => navigate('/settings/ai')} />
        </div>
        <HardwareContent
          showHeader={false}
          onBack={() => navigate('/settings')}
          onNavigate={navigate}
        />
      </div>
    );
  }

  return <Settings />;
};

export default HardwareRoute;
