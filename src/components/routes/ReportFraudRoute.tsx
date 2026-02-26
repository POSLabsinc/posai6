import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";
import Settings from "@/pages/Settings";
import ReportFraudContent from "@/components/settings/ReportFraudContent";

const ReportFraudRoute = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  if (isMobile) {
    return (
      <div className="min-h-screen bg-background">
        <ReportFraudContent
          showHeader={true}
          onBack={() => navigate('/settings/support/about')}
        />
      </div>
    );
  }

  return <Settings />;
};

export default ReportFraudRoute;
