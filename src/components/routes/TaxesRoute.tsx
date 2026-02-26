import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";
import Settings from "@/pages/Settings";
import TaxesContent from "@/components/settings/TaxesContent";

const TaxesRoute = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  
  if (isMobile) {
    return (
      <div className="h-full flex flex-col overflow-hidden bg-background">
        <div className="flex-1 overflow-hidden">
          <TaxesContent showHeader={true} onBack={() => navigate('/settings/payments')} />
        </div>
      </div>
    );
  }
  
  return <Settings />;
};

export default TaxesRoute;
