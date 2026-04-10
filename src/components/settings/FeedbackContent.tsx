import { ChevronLeft, Bug, MessageCircle } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAppearance } from "@/contexts/AppearanceContext";
import SettingsIcon from "@/components/settings/SettingsIcon";
import { useSentryEnabled, setSentryEnabled } from "@/components/FloatingBugReport";
import { useInstabugEnabled, setInstabugEnabled } from "@/components/FloatingInstabug";

interface FeedbackContentProps {
  showHeader?: boolean;
  onBack?: () => void;
  onAIClick?: () => void;
}

const FeedbackContent = ({ showHeader = true, onBack, onAIClick }: FeedbackContentProps) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { getIconBgColor, getIconSizeClass } = useAppearance();
  const sentryEnabled = useSentryEnabled();
  const instabugEnabled = useInstabugEnabled();

  return (
    <div className="h-full overflow-y-auto scrollbar-hide overscroll-contain">
      {showHeader &&
      <div className="flex items-center justify-between pt-0 pb-2 relative overflow-visible px-4">
          {onBack &&
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-neutral-800/60 flex items-center justify-center active:opacity-70 transition-opacity">

              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>
        }
          <h1 className="text-base font-medium text-foreground absolute left-1/2 -translate-x-1/2">Feedback</h1>
          <div className="overflow-visible flex items-center justify-center" style={{ width: 32, height: 32 }}>
            </div>
          </div>
          <p className="text-sm text-neutral-400 px-1 mt-2">
            Error monitoring and performance tracking in real-time.
          </p>
        </div>
      </div>
    </div>);

};

export default FeedbackContent;