import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate, useParams } from "react-router-dom";
import Settings from "@/pages/Settings";
import EditMenuContent from "@/components/settings/EditMenuContent";

const EditMenuRoute = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  if (isMobile) {
    return (
      <EditMenuContent
        menuId={id ?? ""}
        showHeader={true}
        onBack={() => navigate("/settings/menu/menu")}
        onNavigate={navigate}
      />
    );
  }

  return <Settings />;
};

export default EditMenuRoute;
