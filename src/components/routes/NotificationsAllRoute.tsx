import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import NotificationsListContent from "@/components/settings/NotificationsListContent";

import Settings from "@/pages/Settings";
import BottomNavigation from "@/components/BottomNavigation";

const NotificationsAllRoute = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 overflow-visible shrink-0">
          <button
            onClick={() => navigate('/settings/notifications')}
            className="w-10 h-10 rounded-full bg-card flex items-center justify-center active:opacity-70 transition-opacity"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <div style={{ width: 40, height: 40 }} />
        </div>
        <div className="flex-1 overflow-hidden">
          <NotificationsListContent
            showHeader={false}
            onBack={() => navigate('/settings/notifications')}
          />
        </div>
        <BottomNavigation />
      </div>
    );
  }

  return <Settings />;
};

export default NotificationsAllRoute;
