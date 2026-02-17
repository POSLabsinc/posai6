import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";
import Settings from "@/pages/Settings";
import PrinterContent from "@/components/settings/PrinterContent";

const PrinterRoute = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  if (isMobile) {
    return (
      <div className="min-h-screen bg-background">
        <PrinterContent
          showHeader={true}
          onBack={() => navigate('/settings/hardware/details')}
          onNavigate={navigate}
        />
      </div>
    );
  }

  return <Settings />;
};

export default PrinterRoute;
