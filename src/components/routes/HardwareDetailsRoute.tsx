import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";
import Settings from "@/pages/Settings";
import HardwareDetailsContent from "@/components/settings/HardwareDetailsContent";

const HardwareDetailsRoute = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  if (isMobile) {
    return (
      <div className="min-h-screen bg-background">
        <HardwareDetailsContent
          showHeader={true}
          onBack={() => navigate('/settings/hardware')}
          onNavigate={navigate}
        />
      </div>
    );
  }

  return <Settings />;
};

export default HardwareDetailsRoute;
