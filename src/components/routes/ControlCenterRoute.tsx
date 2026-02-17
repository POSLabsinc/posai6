import { useIsMobile } from "@/hooks/use-mobile";
import Settings from "@/pages/Settings";
import ControlCenter from "@/pages/ControlCenter";

// Wrapper that shows full-page ControlCenter on mobile, split-view on desktop
const ControlCenterRoute = () => {
  const isMobile = useIsMobile();
  
  // On mobile, show the full-page control center
  if (isMobile) {
    return <ControlCenter />;
  }
  
  // On desktop, show the split-view settings with control center content in right panel
  return <Settings />;
};

export default ControlCenterRoute;
