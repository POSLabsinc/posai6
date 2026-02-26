import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";
import Settings from "@/pages/Settings";
import LegalTermsContent from "@/components/settings/LegalTermsContent";

const LegalTermsRoute = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  if (isMobile) {
    return (
      <div className="min-h-screen bg-background">
        <LegalTermsContent
          showHeader={true}
          onBack={() => navigate('/settings/support/about')}
        />
      </div>
    );
  }

  return <Settings />;
};

export default LegalTermsRoute;
