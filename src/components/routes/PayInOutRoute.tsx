import { useIsMobile } from "@/hooks/use-mobile";
import { useLocation } from "react-router-dom";
import Settings from "@/pages/Settings";
import PayInOutContent from "@/components/settings/PayInOutContent";

const PayInOutRoute = () => {
  const isMobile = useIsMobile();
  const location = useLocation();
  
  if (isMobile) {
    return (
      <div className="h-full flex flex-col overflow-hidden bg-background">
        <div className="flex-1 overflow-hidden">
          <PayInOutContent showHeader={false} />
        </div>
      </div>
    );
  }
  
  return <Settings />;
};

export default PayInOutRoute;
