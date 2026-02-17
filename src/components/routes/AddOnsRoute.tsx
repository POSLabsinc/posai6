import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";
import Settings from "@/pages/Settings";
import AddOnsContent from "@/components/settings/AddOnsContent";

const AddOnsRoute = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  
  if (isMobile) {
    return (
      <AddOnsContent showHeader={true} onBack={() => navigate('/settings/menu')} />
    );
  }
  
  return <Settings />;
};

export default AddOnsRoute;
