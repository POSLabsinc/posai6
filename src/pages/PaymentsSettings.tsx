import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import PaymentsSettingsContent from "@/components/settings/PaymentsSettingsContent";
import AnimatedAIIcon from "@/components/AnimatedAIIcon";

const PaymentsSettings = () => {
  const navigate = useNavigate();

  return (
    <div className="h-full flex flex-col overflow-hidden bg-background">
      {/* Mobile Header with back button and AI icon */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800/50 overflow-visible">
        <button
          onClick={() => navigate('/settings')}
          className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center active:opacity-70 transition-opacity"
        >
          <ChevronLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="md:hidden">
          <AnimatedAIIcon size={24} onClick={() => navigate('/settings/ai')} />
        </div>
      </div>

      {/* Content - no header since we have mobile header */}
      <div className="flex-1 overflow-hidden">
        <PaymentsSettingsContent 
          showHeader={false} 
          onNavigate={(path) => navigate(path)}
        />
      </div>
    </div>
  );
};

export default PaymentsSettings;
