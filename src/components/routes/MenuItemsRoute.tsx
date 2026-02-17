import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";
import Settings from "@/pages/Settings";
import MenuItemsContent from "@/components/settings/MenuItemsContent";

const MenuItemsRoute = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  
  if (isMobile) {
    return (
      <MenuItemsContent showHeader={true} onBack={() => navigate('/settings/menu')} />
    );
  }
  
  return <Settings />;
};

export default MenuItemsRoute;
