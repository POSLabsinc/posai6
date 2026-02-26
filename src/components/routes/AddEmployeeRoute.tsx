import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import Settings from "@/pages/Settings";
import AddEmployeeContent from "@/components/settings/AddEmployeeContent";

const AddEmployeeRoute = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  if (isMobile) {
    return (
      <div className="h-screen bg-background overflow-hidden flex flex-col">
        <AddEmployeeContent
          showHeader={true}
          onBack={() => navigate("/settings/workforce/employee")}
        />
      </div>
    );
  }

  return <Settings />;
};

export default AddEmployeeRoute;
