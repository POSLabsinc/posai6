import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";
import Settings from "@/pages/Settings";
import AddShiftContent from "@/components/settings/AddShiftContent";

const AddShiftRoute = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  if (isMobile) {
    return (
      <div className="h-screen bg-background overflow-hidden flex flex-col">
        <AddShiftContent
          showHeader={true}
          onBack={() => navigate("/settings/workforce/shift")}
        />
      </div>
    );
  }

  return <Settings />;
};

export default AddShiftRoute;
