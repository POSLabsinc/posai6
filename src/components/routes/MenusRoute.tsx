import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";
import Settings from "@/pages/Settings";
import MenusContent from "@/components/settings/MenusContent";

const MenusRoute = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  if (isMobile) {
    return (
      <MenusContent
        showHeader={true}
        onBack={() => navigate("/settings/menu")}
        onNavigate={navigate}
      />
    );
  }

  return <Settings />;
};

export default MenusRoute;
