import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import Settings from "@/pages/Settings";
import OrdersSettingsContent from "@/components/settings/OrdersSettingsContent";

const OrdersSettingsRoute = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  
  if (isMobile) {
    return (
      <div className="h-full flex flex-col overflow-hidden bg-background">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-neutral-800/50">
          <button
            onClick={() => navigate('/settings')}
            className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center active:opacity-70 transition-opacity"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
        </div>
        <div className="flex-1 overflow-hidden">
          <OrdersSettingsContent showHeader={false} />
        </div>
      </div>
    );
  }
  
  return <Settings />;
};

export default OrdersSettingsRoute;
