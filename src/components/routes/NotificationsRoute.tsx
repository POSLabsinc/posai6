import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import NotificationsContent from "@/components/settings/NotificationsContent";
import AnimatedAIIcon from "@/components/AnimatedAIIcon";
import Settings from "@/pages/Settings";

const NotificationsRoute = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

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
        <NotificationsContent
          showHeader={false}
          onBack={() => navigate('/settings')}
          onNavigate={navigate}
        />
      </div>
    );
  }

  return <Settings />;
};

export default NotificationsRoute;
