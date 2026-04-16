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
          <h1 className="text-xl font-semibold text-foreground absolute left-1/2 -translate-x-1/2">Feedback</h1>
        </div>
      }

      <div className={`${showHeader ? 'pt-0' : 'pt-0'} px-6 pb-28`}>
        <div className="mb-4">
          <p className="text-base text-neutral-400 leading-relaxed">
            Manage feedback and error monitoring tools to improve app quality and user experience.
          </p>
        </div>

        



        <div className="mb-4">
          <h2 className="text-sm font-semibold text-neutral-400 tracking-wider mb-1">
            User Feedback
          </h2>
          <div className="bg-neutral-800/60 rounded-2xl overflow-hidden">
            {/* Sentry */}
            <div className="flex items-center justify-between py-3.5 px-4">
              <div className="flex items-center gap-4">
                <SettingsIcon bgColor="#FFFFFF">
                  <Bug className={`${getIconSizeClass()} text-neutral-800`} />
                </SettingsIcon>
                <span className="text-foreground text-lg font-medium">Sentry</span>
              </div>
              <Switch checked={sentryEnabled} onCheckedChange={(val) => {
                setSentryEnabled(val);
                if (val) setInstabugEnabled(false);
              }} />
            </div>
            <div className="h-px bg-neutral-700/50 mx-4" />
            {/* Instabug */}
            <div className="flex items-center justify-between py-3.5 px-4">
              <div className="flex items-center gap-4">
                <SettingsIcon bgColor="#CF0064">
                  <MessageCircle className={`${getIconSizeClass()} text-white`} />
                </SettingsIcon>
                <span className="text-foreground text-lg font-medium">Instabug</span>
              </div>
              <Switch checked={instabugEnabled} onCheckedChange={(val) => {
                setInstabugEnabled(val);
                if (val) setSentryEnabled(false);
              }} />
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