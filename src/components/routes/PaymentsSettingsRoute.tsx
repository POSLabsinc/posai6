import { useIsMobile } from "@/hooks/use-mobile";
import Settings from "@/pages/Settings";
import PaymentsSettings from "@/pages/PaymentsSettings";

// Wrapper that shows full-page PaymentsSettings on mobile, split-view on desktop
const PaymentsSettingsRoute = () => {
  const isMobile = useIsMobile();
  
  // On mobile, show the full-page payments settings
  if (isMobile) {
    return <PaymentsSettings />;
  }
  
  // On desktop, show the split-view settings with payments content in right panel
  return <Settings />;
};

export default PaymentsSettingsRoute;
