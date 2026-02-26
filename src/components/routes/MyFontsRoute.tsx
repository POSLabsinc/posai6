import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";
import Settings from "@/pages/Settings";
import MyFontsContent from "@/components/settings/MyFontsContent";

const MyFontsRoute = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  if (isMobile) {
    return <MyFontsContent showHeader={true} onBack={() => navigate('/settings/system/fonts')} />;
  }
  return <Settings />;
};

export default MyFontsRoute;
