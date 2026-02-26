import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";
import Settings from "@/pages/Settings";
import EmployeeContent from "@/components/settings/EmployeeContent";

const EmployeeRoute = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  if (isMobile) {
    return (
      <div className="h-screen bg-background overflow-hidden flex flex-col">
        <div className="flex-1 overflow-auto relative">
          <EmployeeContent
            showHeader={true}
            onBack={() => navigate("/settings/workforce")}
          />
        </div>
      </div>
    );
  }

  return <Settings />;
};

export default EmployeeRoute;
