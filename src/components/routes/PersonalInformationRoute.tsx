import { useIsMobile } from "@/hooks/use-mobile";
import Settings from "@/pages/Settings";
import PersonalInformation from "@/pages/PersonalInformation";

// Wrapper that shows full-page PersonalInformation on mobile, split-view on desktop
const PersonalInformationRoute = () => {
  const isMobile = useIsMobile();
  
  if (isMobile) {
    return <PersonalInformation />;
  }
  
  return <Settings />;
};

export default PersonalInformationRoute;
