import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";
import Settings from "@/pages/Settings";
import CashRegisterContent from "@/components/settings/CashRegisterContent";

const CashRegisterRoute = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  if (isMobile) {
    return (
      <div className="min-h-screen bg-background">
        <CashRegisterContent
          showHeader={true}
          onBack={() => navigate('/settings/hardware/details')}
        />
      </div>
    );
  }

  return <Settings />;
};

export default CashRegisterRoute;
