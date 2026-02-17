import { useIsMobile } from "@/hooks/use-mobile";
import Settings from "@/pages/Settings";
import AppearanceSettings from "@/pages/AppearanceSettings";

// Wrapper that shows full-page AppearanceSettings on mobile, split-view on desktop
const AppearanceSettingsRoute = () => {
  const isMobile = useIsMobile();
  
  // On mobile, show the full-page appearance settings
  if (isMobile) {
    return <AppearanceSettings />;
  }
  
  // On desktop, show the split-view settings with appearance content in right panel
  return <Settings />;
};

export default AppearanceSettingsRoute;
