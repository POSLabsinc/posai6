import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";
import Settings from "@/pages/Settings";
import HardwareContent from "@/components/settings/HardwareContent";

const HardwareRoute = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  if (isMobile) {
    return (
      <div className="min-h-screen bg-background">
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
