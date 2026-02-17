import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";
import Settings from "@/pages/Settings";
import DiscountsContent from "@/components/settings/DiscountsContent";

const DiscountsRoute = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  
  if (isMobile) {
    return (
      <div className="h-full flex flex-col overflow-hidden bg-background">
        <DiscountsContent 
          showHeader={true} 
          onBack={() => navigate('/settings/payments')} 
        />
      </div>
    );
  }
  
  return <Settings />;
};

export default DiscountsRoute;
