import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";
import Settings from "@/pages/Settings";
import EditShiftContent from "@/components/settings/EditShiftContent";

const EditShiftRoute = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  if (isMobile) {
    return (
      <div className="h-screen bg-background overflow-hidden flex flex-col">
        <EditShiftContent
          showHeader={true}
          onBack={() => navigate("/settings/workforce/shift")}
        />
      </div>
    );
  }

  return <Settings />;
};

export default EditShiftRoute;
