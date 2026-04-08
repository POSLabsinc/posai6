import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import Settings from "@/pages/Settings";
import ReportsContent from "@/components/settings/ReportsContent";

const ReportsRoute = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  if (isMobile) {
    return (
      <div className="h-screen bg-background overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 overflow-visible shrink-0">
          <button
            onClick={() => navigate('/settings')}
            className="w-10 h-10 rounded-full bg-neutral-800/60 flex items-center justify-center active:opacity-70 transition-opacity"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <div style={{ width: 40, height: 40 }} />
        </div>
        <div className="flex-1 overflow-auto relative">
          <ReportsContent
            showHeader={true}
            onBack={() => navigate('/settings')}
          />
        </div>
      </div>
    );
  }

  return <Settings />;
};

export default ReportsRoute;
