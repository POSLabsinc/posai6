import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";
import Settings from "@/pages/Settings";
import ServiceChargeContent from "@/components/settings/ServiceChargeContent";

const ServiceChargeRoute = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  
  if (isMobile) {
    return (
      <div className="h-full flex flex-col overflow-hidden bg-background">
        <ServiceChargeContent 
          showHeader={true} 
          onBack={() => navigate('/settings/payments')} 
        />
      </div>
    );
  }
  
  return <Settings />;
};

export default ServiceChargeRoute;
