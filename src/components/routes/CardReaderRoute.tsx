import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";
import Settings from "@/pages/Settings";
import CardReaderContent from "@/components/settings/CardReaderContent";

const CardReaderRoute = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  if (isMobile) {
    return (
      <div className="min-h-screen bg-background">
        <CardReaderContent
          showHeader={true}
          onBack={() => navigate('/settings/hardware/details')}
        />
      </div>
    );
  }

  return <Settings />;
};

export default CardReaderRoute;
