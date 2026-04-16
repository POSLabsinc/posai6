import AIRulesContent from "@/components/settings/AIRulesContent";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

const AIInstructionsRoute = () => {
  const navigate = useNavigate();

  return (
    <div className="h-full overflow-y-auto scrollbar-hide overscroll-contain">
      <div className="flex items-center justify-between pt-0 pb-2 relative overflow-visible px-4">
        <button
          onClick={() => navigate('/settings/network/ai-integration')}
          className="w-10 h-10 rounded-full bg-neutral-800/60 flex items-center justify-center active:opacity-70 transition-opacity"
        >
          <ChevronLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-xl font-semibold text-foreground absolute left-1/2 -translate-x-1/2">
          AI Instructions
        </h1>
      </div>

      <div className="pt-0 px-6 pb-28">
        <p className="text-sm text-neutral-400 leading-relaxed mb-6">
          Define global rules, custom instructions, and restaurant knowledge to guide AI behavior across all providers.
        </p>
        <AIRulesContent />
      </div>
    </div>
  );
};

export default AIInstructionsRoute;
