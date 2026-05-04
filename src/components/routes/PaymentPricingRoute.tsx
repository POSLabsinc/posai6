import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import Settings from "@/pages/Settings";
import PaymentPricingContent from "@/components/settings/PaymentPricingContent";

const PaymentPricingRoute = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  if (isMobile) {
    return (
      <div className="h-full flex flex-col overflow-hidden bg-background">
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800/50">
          <button
            onClick={() => navigate("/settings/payments")}
            className="w-10 h-10 rounded-full bg-neutral-800/60 flex items-center justify-center active:opacity-70 transition-opacity"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <span className="text-base font-medium text-foreground">Payment Programs</span>
          <div style={{ width: 40, height: 40 }} />
        </div>
        <div className="flex-1 overflow-hidden">
          <PaymentPricingContent showHeader={false} />
        </div>
      </div>
    );
  }

  return <Settings />;
};

export default PaymentPricingRoute;
