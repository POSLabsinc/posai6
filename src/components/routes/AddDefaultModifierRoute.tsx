import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";
import Settings from "@/pages/Settings";
import AddDefaultModifierContent from "@/components/settings/AddDefaultModifierContent";

const AddDefaultModifierRoute = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  
  if (isMobile) {
    return (
      <AddDefaultModifierContent showHeader={true} onBack={() => navigate('/settings/menu/default-modifiers')} />
    );
  }
  
  return <Settings />;
};

export default AddDefaultModifierRoute;
