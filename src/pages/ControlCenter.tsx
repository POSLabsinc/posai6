import { useNavigate } from "react-router-dom";
import ControlCenterContent from "@/components/settings/ControlCenterContent";
import { ChevronLeft } from "lucide-react";

const ControlCenter = () => {
  const navigate = useNavigate();

  return (
    <div className="h-screen bg-background flex flex-col">
      <div className="flex items-center justify-between px-4 py-4 border-b border-neutral-800/50 md:hidden overflow-visible relative" style={{ minHeight: 56 }}>
        <button
          onClick={() => navigate('/settings/system')}
          className="w-10 h-10 rounded-full bg-neutral-800/60 flex items-center justify-center active:opacity-70 transition-opacity"
        >
          <ChevronLeft className="w-4 h-4 text-foreground" />
        </button>
        <h1 className="text-lg font-semibold text-foreground absolute left-1/2 -translate-x-1/2">Control center</h1>
      </div>
      <div className="flex-1 overflow-y-auto">
        <ControlCenterContent
          showHeader={false}
          onBack={() => navigate('/settings/system')}
        />
      </div>
    </div>
  );
};

export default ControlCenter;
