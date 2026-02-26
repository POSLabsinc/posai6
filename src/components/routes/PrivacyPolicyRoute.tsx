import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";
import Settings from "@/pages/Settings";
import PrivacyPolicyContent from "@/components/settings/PrivacyPolicyContent";

const PrivacyPolicyRoute = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  if (isMobile) {
    return (
      <div className="min-h-screen bg-background">
        <PrivacyPolicyContent
          showHeader={true}
          onBack={() => navigate('/settings/support/about')}
        />
      </div>
    );
  }

  return <Settings />;
};

export default PrivacyPolicyRoute;
