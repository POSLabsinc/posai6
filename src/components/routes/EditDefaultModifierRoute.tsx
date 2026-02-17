import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";
import Settings from "@/pages/Settings";
import EditDefaultModifierContent from "@/components/settings/EditDefaultModifierContent";

const EditDefaultModifierRoute = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  
  if (isMobile) {
    return (
      <EditDefaultModifierContent showHeader={true} onBack={() => navigate('/settings/menu/default-modifiers')} />
    );
  }
  
  return <Settings />;
};

export default EditDefaultModifierRoute;
