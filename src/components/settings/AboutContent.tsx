import { ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import aboutIcon from "@/assets/icons/about.png";
import { useAppearance } from "@/contexts/AppearanceContext";

interface InfoRowProps {
  label: string;
  value?: string;
  showChevron?: boolean;
  onClick?: () => void;
  showDivider?: boolean;
}

const InfoRow = ({ label, value, showChevron = false, onClick, showDivider = true }: InfoRowProps) => {
  const Component = onClick ? 'button' : 'div';
  return (
    <div>
      <Component
        onClick={onClick}
        className={`flex items-center justify-between w-full py-3.5 px-4 ${onClick ? 'active:opacity-70 transition-opacity' : ''}`}>

        <span className="text-foreground text-base font-medium">{label}</span>
        <div className="flex items-center gap-1">
          {value && <span className="text-neutral-400 text-base">{value}</span>}
          {showChevron && <ChevronRight className="w-5 h-5 text-neutral-500" />}
        </div>
      </Component>
      {showDivider && <div className="h-px bg-neutral-700/50 mx-4" />}
    </div>);

};

interface AboutContentProps {
  showHeader?: boolean;
  onBack?: () => void;
  onAIClick?: () => void;
}

const AboutContent = ({ showHeader = true, onBack, onAIClick }: AboutContentProps) => {
  const navigate = useNavigate();
  const { getIconBgColor } = useAppearance();
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
          <h1 className="text-base font-medium text-foreground absolute left-1/2 -translate-x-1/2">About</h1>
          <div className="overflow-visible flex items-center justify-center" style={{ width: 32, height: 32 }}>
        </div>
      </div>
    </div>);

};

export default AboutContent;