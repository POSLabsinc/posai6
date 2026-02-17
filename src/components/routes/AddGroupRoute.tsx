import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";
import Settings from "@/pages/Settings";
import AddGroupContent from "@/components/settings/AddGroupContent";

const AddGroupRoute = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  
  if (isMobile) {
    return (
      <AddGroupContent showHeader={true} onBack={() => navigate('/settings/menu/groups')} />
    );
  }
  
  return <Settings />;
};

export default AddGroupRoute;
