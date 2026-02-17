import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AccountPanel from "@/components/AccountPanel";
import AnimatedAIIcon from "@/components/AnimatedAIIcon";

const Account = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background p-4 pb-28">
      {/* Header with back button and AI icon - Mobile only */}
      <div className="flex items-center justify-between mb-8 md:hidden overflow-visible">
        <button
          onClick={() => navigate(-1)}
          className="w-12 h-12 rounded-full bg-muted flex items-center justify-center active:opacity-70 transition-opacity"
        >
          <ChevronLeft className="w-6 h-6 text-foreground" />
        </button>
        <AnimatedAIIcon size={24} onClick={() => navigate('/settings/ai')} />
      </div>

      {/* Account Panel Content */}
      <AccountPanel showHeader={false} />
    </div>
  );
};

export default Account;
