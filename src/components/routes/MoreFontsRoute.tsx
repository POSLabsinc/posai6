import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";
import Settings from "@/pages/Settings";
import MoreFontsContent from "@/components/settings/MoreFontsContent";

const MoreFontsRoute = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  if (isMobile) {
    return <MoreFontsContent showHeader={true} onBack={() => navigate('/settings/system/fonts')} />;
  }
  return <Settings />;
};

export default MoreFontsRoute;
