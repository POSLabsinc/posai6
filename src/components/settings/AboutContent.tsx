import { ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AnimatedAIIcon from "@/components/AnimatedAIIcon";
import aboutIcon from "@/assets/icons/about.png";

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
        className={`flex items-center justify-between w-full py-3.5 px-4 ${onClick ? 'active:opacity-70 transition-opacity' : ''}`}
      >
        <span className="text-foreground text-base font-medium">{label}</span>
        <div className="flex items-center gap-1">
          {value && <span className="text-neutral-400 text-base">{value}</span>}
          {showChevron && <ChevronRight className="w-5 h-5 text-neutral-500" />}
        </div>
      </Component>
      {showDivider && <div className="h-px bg-neutral-700/50 mx-4" />}
    </div>
  );
};

interface AboutContentProps {
  showHeader?: boolean;
  onBack?: () => void;
  onAIClick?: () => void;
}

const AboutContent = ({ showHeader = true, onBack, onAIClick }: AboutContentProps) => {
  const navigate = useNavigate();
  return (
    <div className="h-full overflow-y-auto scrollbar-hide overscroll-contain">
      {showHeader && onBack && (
        <div className="px-6 pt-5">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-neutral-800/60 flex items-center justify-center active:opacity-70 transition-opacity"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
        </div>
      )}

      <div className="pt-6 px-6 pb-28">
        {/* Header Card */}
        <div className="bg-neutral-800/60 rounded-2xl p-6 mb-6 flex flex-col items-start md:items-center">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: '#4200FF' }}>
            <img src={aboutIcon} alt="About" className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">About</h3>
          <p className="text-sm text-neutral-400 md:text-center">
            View app and device information, including version details, build date, system specifications, and connection status for troubleshooting and support.
          </p>
        </div>


        {/* SOFTWARE Section */}
        <p className="text-xs font-medium text-neutral-500 tracking-wider uppercase mb-3">Software</p>
        <div className="bg-neutral-800/60 rounded-2xl overflow-hidden mb-6">
          <InfoRow label="App Version" value="4.10.2" />
          <InfoRow label="Flutter Version" value="FL.3.7.12" />
          <InfoRow label="Build Date" value="BD.10.10.23" showDivider={false} />
        </div>

        {/* DEVICE Section */}
        <p className="text-xs font-medium text-neutral-500 tracking-wider uppercase mb-3">Device</p>
        <div className="bg-neutral-800/60 rounded-2xl overflow-hidden mb-6">
          <InfoRow label="Device Name" value="Emulator POS 7 Stag" />
          <InfoRow label="OS Name" value="Android" />
          <InfoRow label="OS Version" value="9" />
          <InfoRow label="Model Name" value="Asus_010QD" />
          <InfoRow label="Serial Number" value="0097939B" />
          <InfoRow label="Inbuilt CFD" value="Not Connected" showDivider={false} />
        </div>

        {/* TERMS & POLICY Section */}
        <p className="text-xs font-medium text-neutral-500 tracking-wider uppercase mb-3">Terms & Policy</p>
        <div className="bg-neutral-800/60 rounded-2xl overflow-hidden">
          <InfoRow label="Privacy Policy" showChevron onClick={() => {}} />
          <InfoRow label="Legal Terms" showChevron onClick={() => {}} />
          <InfoRow label="Report Fraud" showChevron onClick={() => {}} showDivider={false} />
        </div>
      </div>
    </div>
  );
};

export default AboutContent;
