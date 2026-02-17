import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";
import Settings from "@/pages/Settings";
import ModifiersContent from "@/components/settings/ModifiersContent";

const ModifiersRoute = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  
  if (isMobile) {
    return (
      <ModifiersContent showHeader={true} onBack={() => navigate('/settings/menu')} />
    );
  }
  
  return <Settings />;
};

export default ModifiersRoute;
