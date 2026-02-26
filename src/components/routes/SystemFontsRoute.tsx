import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";
import Settings from "@/pages/Settings";
import SystemFontsContent from "@/components/settings/SystemFontsContent";

const SystemFontsRoute = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  if (isMobile) {
    return <SystemFontsContent showHeader={true} onBack={() => navigate('/settings/system/fonts')} />;
  }
  return <Settings />;
};

export default SystemFontsRoute;
