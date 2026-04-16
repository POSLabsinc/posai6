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
          <h1 className="text-xl font-semibold text-foreground absolute left-1/2 -translate-x-1/2">About</h1>
        </div>
      }

      <div className="px-6 pb-28">
        <div className="mb-4">
          


        </div>


        {/* SOFTWARE Section */}
        <p className="text-sm font-semibold text-neutral-400 tracking-wider mb-3">Software</p>
        <div className="bg-neutral-800/60 rounded-2xl overflow-hidden mb-6">
          <InfoRow label="App Version" value="4.10.2" />
          <InfoRow label="Flutter Version" value="FL.3.7.12" />
          <InfoRow label="Build Date" value="BD.10.10.23" showDivider={false} />
        </div>

        {/* DEVICE Section */}
        <p className="text-sm font-semibold text-neutral-400 tracking-wider mb-3">Device</p>
        <div className="bg-neutral-800/60 rounded-2xl overflow-hidden mb-6">
          <InfoRow label="Device Name" value="Emulator POS 7 Stag" />
          <InfoRow label="OS Name" value="Android" />
          <InfoRow label="OS Version" value="9" />
          <InfoRow label="Model Name" value="Asus_010QD" />
          <InfoRow label="Serial Number" value="0097939B" />
          <InfoRow label="Inbuilt Customer Facing Display" value="Not Connected" showDivider={false} />
        </div>

        {/* TERMS & POLICY Section */}
        <p className="text-sm font-semibold text-neutral-400 tracking-wider mb-3">Terms & Policy</p>
        <div className="bg-neutral-800/60 rounded-2xl overflow-hidden">
          <InfoRow label="Privacy Policy" showChevron onClick={() => navigate('/settings/support/about/privacy-policy')} />
          <InfoRow label="Legal Terms" showChevron onClick={() => navigate('/settings/support/about/legal-terms')} />
          <InfoRow label="Report Fraud" showChevron onClick={() => navigate('/settings/support/about/report-fraud')} showDivider={false} />
        </div>
      </div>
    </div>);

};

export default AboutContent;