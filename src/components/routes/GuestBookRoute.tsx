import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import Settings from "@/pages/Settings";
import GuestBookContent from "@/components/settings/GuestBookContent";

const GuestBookRoute = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  if (isMobile) {
    return (
      <div className="min-h-screen bg-background">
        <GuestBookContent
          showHeader={true}
          onBack={() => navigate('/settings')}
        />
      </div>
    );
  }

  return <Settings />;
};

export default GuestBookRoute;
