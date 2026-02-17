import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useNavigate } from "react-router-dom";
import AnimatedAIIcon from "@/components/AnimatedAIIcon";
import { useIsMobile } from "@/hooks/use-mobile";
import feedbackIcon from "@/assets/icons/feedback.png";
import sentryIcon from "@/assets/icons/sentry.png";
import instabugIcon from "@/assets/icons/instabug.png";

interface FeedbackContentProps {
  showHeader?: boolean;
  onBack?: () => void;
  onAIClick?: () => void;
}

const FeedbackContent = ({ showHeader = true, onBack, onAIClick }: FeedbackContentProps) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [sentryEnabled, setSentryEnabled] = useState(false);
  const [instabugEnabled, setInstabugEnabled] = useState(false);

  return (
    <div className="h-full overflow-y-auto scrollbar-hide overscroll-contain">
      {showHeader && (
        <div className="flex items-center justify-center py-4 border-b border-neutral-800/50 relative">
          {onBack && (
            <button
              onClick={onBack}
              className="absolute left-4 w-8 h-8 rounded-full bg-neutral-800/60 flex items-center justify-center active:opacity-70 transition-opacity"
            >
              <ChevronLeft className="w-4 h-4 text-foreground" />
            </button>
          )}
        </div>
      )}

      <div className="pt-6 px-6 pb-28">
        {/* Header Card */}
        <div className={`bg-neutral-800/60 rounded-2xl p-5 mb-4 flex flex-col ${isMobile ? 'items-start' : 'items-center text-center'}`}>
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{ backgroundColor: "#606060" }}
          >
            <img src={feedbackIcon} alt="Feedback" className="w-7 h-7 object-contain" />
          </div>
          <h1 className="text-xl font-semibold text-foreground mb-2">Feedback</h1>
          <p className="text-base text-neutral-400 leading-relaxed">
            Manage feedback and error monitoring tools to improve app quality and user experience.
          </p>
        </div>

        {/* AI Assistant Icon */}
        <div className="flex justify-end mb-3 overflow-visible">
          <AnimatedAIIcon size={24} onClick={onAIClick || (() => navigate('/settings/ai'))} />
        </div>

        {/* User Feedback Section */}
        <div className="mb-4">
          <h2 className="text-xs font-medium text-neutral-500 tracking-wider uppercase mb-3">
            User Feedback
          </h2>
          <div className="bg-neutral-800/60 rounded-2xl overflow-hidden">
            {/* Sentry */}
            <div className="flex items-center justify-between py-3.5 px-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#FFFFFF" }}>
                  <img src={sentryIcon} alt="Sentry" className="w-6 h-6 object-contain" />
                </div>
                <span className="text-foreground text-lg font-medium">Sentry</span>
              </div>
              <Switch checked={sentryEnabled} onCheckedChange={setSentryEnabled} />
            </div>
            <div className="h-px bg-neutral-700/50 mx-4" />
            {/* Instabug */}
            <div>
              <div className="flex items-center justify-between py-3.5 px-4">
                <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#CF0064" }}>
                  <img src={instabugIcon} alt="Instabug" className="w-6 h-6 object-contain" />
                </div>
                  <span className="text-foreground text-lg font-medium">Instabug</span>
                </div>
                <Switch checked={instabugEnabled} onCheckedChange={setInstabugEnabled} />
              </div>
              <p className="text-sm text-neutral-400 px-4 pb-3">
                Error monitoring and performance tracking in real-time.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedbackContent;
