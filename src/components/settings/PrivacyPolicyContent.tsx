import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface PrivacyPolicyContentProps {
  showHeader?: boolean;
  onBack?: () => void;
  onAIClick?: () => void;
}

const PrivacyPolicyContent = ({ showHeader = true, onBack, onAIClick }: PrivacyPolicyContentProps) => {
  const navigate = useNavigate();
  return (
    <div className="h-full flex flex-col overflow-hidden">
      {showHeader && (
        <div className="flex items-center justify-between pt-0 pb-2 relative overflow-visible px-4">
          {onBack && (
            <button
              onClick={onBack}
              className="w-10 h-10 rounded-full bg-neutral-800/60 flex items-center justify-center active:opacity-70 transition-opacity">
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>
          )}
          <h1 className="text-base font-medium text-foreground absolute left-1/2 -translate-x-1/2">Privacy Policy</h1>
          <div className="overflow-visible flex items-center justify-center" style={{ width: 32, height: 32 }}>
          </div>
        </div>
      )}
      <div className="flex-1 overflow-hidden">
        <iframe
          src="https://www.eatos.com/privacy-policy"
          className="w-full h-full border-0"
          title="Privacy Policy"
        />
      </div>
    </div>
  );
};

export default PrivacyPolicyContent;
