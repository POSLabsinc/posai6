import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";
import Settings from "@/pages/Settings";
import AddMenuContent from "@/components/settings/AddMenuContent";

const AddMenuRoute = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  if (isMobile) {
    return (
      <AddMenuContent
        showHeader={true}
        onBack={() => navigate("/settings/menu/menu")}
        onNavigate={navigate}
      />
    );
  }

  return <Settings />;
};

export default AddMenuRoute;
