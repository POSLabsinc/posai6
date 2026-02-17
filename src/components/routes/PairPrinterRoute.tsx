import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";
import Settings from "@/pages/Settings";
import PairPrinterContent from "@/components/settings/PairPrinterContent";

const PairPrinterRoute = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  if (isMobile) {
    return (
      <div className="min-h-screen bg-background">
        <PairPrinterContent
          showHeader={true}
          onBack={() => navigate('/settings/hardware/details/printer')}
        />
      </div>
    );
  }

  return <Settings />;
};

export default PairPrinterRoute;
