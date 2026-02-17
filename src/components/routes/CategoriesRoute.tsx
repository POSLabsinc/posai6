import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";
import Settings from "@/pages/Settings";
import CategoriesContent from "@/components/settings/CategoriesContent";

const CategoriesRoute = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  
  if (isMobile) {
    return (
      <CategoriesContent showHeader={true} onBack={() => navigate('/settings/menu')} />
    );
  }
  
  return <Settings />;
};

export default CategoriesRoute;
