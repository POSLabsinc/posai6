import { useIsMobile } from "@/hooks/use-mobile";
import Settings from "@/pages/Settings";
import RestaurantInformation from "@/pages/RestaurantInformation";

// Wrapper that shows full-page RestaurantInformation on mobile, split-view on desktop
const RestaurantInformationRoute = () => {
  const isMobile = useIsMobile();
  
  if (isMobile) {
    return <RestaurantInformation />;
  }
  
  return <Settings />;
};

export default RestaurantInformationRoute;
