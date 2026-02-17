import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";
import Settings from "@/pages/Settings";
import ServerConnectionContent from "@/components/settings/ServerConnectionContent";

const ServerConnectionRoute = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  if (isMobile) {
    return (
      <div className="min-h-screen bg-background">
        <ServerConnectionContent
          showHeader={true}
          onBack={() => navigate('/settings/network')}
        />
      </div>
    );
  }

  return <Settings />;
};

export default ServerConnectionRoute;
