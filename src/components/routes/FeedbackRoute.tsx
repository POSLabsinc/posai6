import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";
import Settings from "@/pages/Settings";
import FeedbackContent from "@/components/settings/FeedbackContent";

const FeedbackRoute = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  if (isMobile) {
    return (
      <div className="min-h-screen bg-background">
        <FeedbackContent
          showHeader={true}
          onBack={() => navigate('/settings/support')}
        />
      </div>
    );
  }

  return <Settings />;
};

export default FeedbackRoute;
