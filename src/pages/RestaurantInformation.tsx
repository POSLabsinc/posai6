import { ChevronLeft, ChevronRight, Search, LocateFixed } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import aiColorfulIcon from "@/assets/icons/ai-colorful.png";
import revenueCentersIcon from "@/assets/icons/revenue-centers.png";
import businessHoursIcon from "@/assets/icons/business-hours.png";
import languageIcon from "@/assets/icons/language.png";
import currencyIcon from "@/assets/icons/currency.png";
import SettingsIcon from "@/components/settings/SettingsIcon";

interface InfoRowProps {
  label: string;
  value: string;
  onClick?: () => void;
}

const InfoRow = ({ label, value, onClick }: InfoRowProps) => (
  <button
    onClick={onClick}
    className="flex items-center justify-between w-full py-4 px-5 active:opacity-70 transition-opacity"
  >
    <span className="text-foreground text-base font-medium">{label}</span>
    <div className="flex items-center gap-2">
      <span className="text-neutral-500 text-base">{value}</span>
      <ChevronRight className="w-5 h-5 text-neutral-500" />
    </div>
  </button>
);

interface SettingRowProps {
  icon: React.ReactNode;
  label: string;
  value?: string;
  onClick?: () => void;
}

const SettingRow = ({ icon, label, value, onClick }: SettingRowProps) => (
  <button
    onClick={onClick}
    className="flex items-center justify-between w-full py-4 px-5 active:opacity-70 transition-opacity"
  >
    <div className="flex items-center gap-4">
      {icon}
      <span className="text-foreground text-base font-medium">{label}</span>
    </div>
    <div className="flex items-center gap-2">
      {value && <span className="text-neutral-400 text-base">{value}</span>}
      <ChevronRight className="w-5 h-5 text-neutral-500" />
    </div>
  </button>
);

const RestaurantInformation = () => {
  const navigate = useNavigate();

  const getActiveRevenueCenter = () => {
    try {
      const session = localStorage.getItem("pos_session");
      if (session) {
        const parsed = JSON.parse(session);
        return parsed.revenueCenter || "Not Set";
      }
    } catch {}
    return "Not Set";
  };

  const activeRevenueCenter = getActiveRevenueCenter();

  return (
    <div className="h-screen bg-background overflow-y-auto">
      <div className="p-4 pb-32">
        {/* Header with back button and AI icon */}
        <div className="relative flex items-center justify-center mb-8 overflow-visible h-12">
          <button
            onClick={() => navigate(-1)}
            className="absolute left-0 w-12 h-12 rounded-full bg-muted flex items-center justify-center active:opacity-70 transition-opacity"
          >
            <ChevronLeft className="w-6 h-6 text-foreground" />
          </button>
          <h1 className="text-lg font-semibold text-foreground">Restaurant Information</h1>
          <div className="absolute right-0 md:hidden">
              <div className="h-px bg-neutral-700/50 mx-5" />
              <SettingRow
                icon={<SettingsIcon bgColor="#F78E34" iconSrc={businessHoursIcon} iconAlt="Business Hours" />}
                label="Business Hours"
                value="9 AM – 11 PM"
              />
              <div className="h-px bg-neutral-700/50 mx-5" />
              <SettingRow
                icon={<SettingsIcon bgColor="#FF5DB6" iconSrc={languageIcon} iconAlt="Language" />}
                label="Language"
                value="English"
              />
              <div className="h-px bg-neutral-700/50 mx-5" />
              <SettingRow
                icon={<SettingsIcon bgColor="#34A885" iconSrc={currencyIcon} iconAlt="Currency" />}
                label="Currency"
                value="GBP £"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestaurantInformation;
