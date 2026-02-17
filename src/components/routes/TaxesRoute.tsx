import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";
import Settings from "@/pages/Settings";
import TaxesContent from "@/components/settings/TaxesContent";

const TaxesRoute = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  
  if (isMobile) {
    return (
      <TaxesContent showHeader={true} onBack={() => navigate('/settings/payments')} />
    );
  }
  
  return <Settings />;
};

export default TaxesRoute;
