import { useIsMobile } from "@/hooks/use-mobile";
import Settings from "@/pages/Settings";
import Security from "@/pages/Security";

// Wrapper that shows full-page Security on mobile, split-view on desktop
const SecurityRoute = () => {
  const isMobile = useIsMobile();
  
  if (isMobile) {
    return <Security />;
  }
  
  return <Settings />;
};

export default SecurityRoute;
