import { useIsMobile } from "@/hooks/use-mobile";
import Settings from "@/pages/Settings";
import FontsPage from "@/pages/Fonts";

const FontsRoute = () => {
  const isMobile = useIsMobile();
  if (isMobile) {
    return <FontsPage />;
  }
  return <Settings />;
};

export default FontsRoute;
