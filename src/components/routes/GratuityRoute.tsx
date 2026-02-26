import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";
import Settings from "@/pages/Settings";
import GratuityContent from "@/components/settings/GratuityContent";

const GratuityRoute = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  
  if (isMobile) {
    return (
      <div className="h-full flex flex-col overflow-hidden bg-background">
        <div className="flex-1 overflow-hidden">
          <GratuityContent
            showHeader={true}
            onBack={() => navigate('/settings/payments')}
          />
        </div>
      </div>
    );
  }
  
  return <Settings />;
};

export default GratuityRoute;
