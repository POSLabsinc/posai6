import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AccountPanel from "@/components/AccountPanel";
import AnimatedAIIcon from "@/components/AnimatedAIIcon";

const Account = () => {
  const navigate = useNavigate();

  return (
    <div className="h-screen bg-background p-4 pb-32 overflow-y-auto">
      {/* Header with back button, title, and AI icon - Mobile only */}
      <div className="relative flex items-center justify-center mb-8 md:hidden overflow-visible h-12">
        <button
          onClick={() => navigate(-1)}
          className="absolute left-0 w-12 h-12 rounded-full bg-muted flex items-center justify-center active:opacity-70 transition-opacity"
        >
          <ChevronLeft className="w-6 h-6 text-foreground" />
        </button>
        <h1 className="text-lg font-semibold text-foreground">Account</h1>
        <div className="absolute right-0">
          <AnimatedAIIcon size={24} onClick={() => navigate('/settings/ai')} />
        </div>
      </div>

      {/* Account Panel Content */}
      <AccountPanel showHeader={false} />
    </div>
  );
};

export default Account;
