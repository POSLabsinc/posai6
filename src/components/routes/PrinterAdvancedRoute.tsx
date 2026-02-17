import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";
import Settings from "@/pages/Settings";
import PrinterAdvancedContent from "@/components/settings/PrinterAdvancedContent";

const PrinterAdvancedRoute = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  if (isMobile) {
    return (
      <div className="h-screen bg-background overflow-y-auto scrollbar-hide">
        <PrinterAdvancedContent
          showHeader={true}
          onBack={() => navigate('/settings/hardware/details/printer')}
        />
      </div>
    );
  }

  return <Settings />;
};

export default PrinterAdvancedRoute;
