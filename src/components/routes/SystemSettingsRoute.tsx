import { useIsMobile } from "@/hooks/use-mobile";
import Settings from "@/pages/Settings";
import SystemSettings from "@/pages/SystemSettings";

// Wrapper that shows full-page SystemSettings on mobile, split-view on desktop
const SystemSettingsRoute = () => {
  const isMobile = useIsMobile();
  
  // On mobile, show the full-page system settings
  if (isMobile) {
    return <SystemSettings />;
  }
  
  // On desktop, show the split-view settings with system content in right panel
  return <Settings />;
};

export default SystemSettingsRoute;
