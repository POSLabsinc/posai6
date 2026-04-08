import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import MenuSettingsContent from "@/components/settings/MenuSettingsContent";
import Settings from "@/pages/Settings";

const MenuSettingsRoute = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const handleBack = () => {
    navigate('/settings');
  };

  if (isMobile) {
    return (
      <div className="h-full flex flex-col bg-background">
        <div className="flex items-center justify-between px-4 py-3 overflow-visible">
          <button
            onClick={handleBack}
            className="w-10 h-10 rounded-full bg-neutral-800/60 flex items-center justify-center active:opacity-70 transition-opacity"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <div style={{ width: 40, height: 40 }} />
        </div>
        <div className="flex-1 overflow-hidden">
          <MenuSettingsContent 
            showHeader={false} 
            onBack={handleBack}
            onNavigate={navigate}
          />
        </div>
      </div>
    );
  }

  return <Settings />;
};

export default MenuSettingsRoute;
