import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";
import Settings from "@/pages/Settings";
import SupportContactContent from "@/components/settings/SupportContactContent";

const SupportContactRoute = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  if (isMobile) {
    return (
      <div className="min-h-screen bg-background">
        <SupportContactContent
          showHeader={true}
          onBack={() => navigate('/settings/support')}
        />
      </div>
    );
  }

  return <Settings />;
};

export default SupportContactRoute;
