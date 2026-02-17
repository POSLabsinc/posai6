import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";
import Settings from "@/pages/Settings";
import EditGroupContent from "@/components/settings/EditGroupContent";

const EditGroupRoute = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  
  if (isMobile) {
    return (
      <EditGroupContent showHeader={true} onBack={() => navigate('/settings/menu/groups')} />
    );
  }
  
  return <Settings />;
};

export default EditGroupRoute;
