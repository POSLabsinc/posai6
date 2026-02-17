import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";
import Settings from "@/pages/Settings";
import AboutContent from "@/components/settings/AboutContent";

const AboutRoute = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  if (isMobile) {
    return (
      <div className="min-h-screen bg-background">
        <AboutContent
          showHeader={true}
          onBack={() => navigate('/settings/support')}
        />
      </div>
    );
  }

  return <Settings />;
};

export default AboutRoute;
