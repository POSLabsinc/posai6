import { ChevronLeft, ChevronRight, Search, LocateFixed } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AnimatedAIIcon from "@/components/AnimatedAIIcon";
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
            <AnimatedAIIcon size={24} onClick={() => navigate('/settings/ai')} />
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col items-center">
          {/* Logo Section */}
          <div className="mb-8">
            <Avatar className="w-32 h-32 border-4 border-neutral-600">
              <AvatarImage
                src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200&h=200&fit=crop"
                alt="Restaurant Logo"
                className="object-cover"
              />
              <AvatarFallback className="bg-neutral-800 text-foreground text-sm flex flex-col items-center justify-center">
                <span className="font-bold text-[10px] leading-tight text-center">BOLLYWOOD</span>
                <span className="font-bold text-[10px] leading-tight text-center">BITES</span>
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Form Container */}
          <div className="w-full max-w-2xl space-y-4">
            {/* Name and Type Group */}
            <div className="bg-neutral-800/40 rounded-2xl overflow-hidden">
              <InfoRow label="Name" value="Bollywood Bites" />
              <div className="h-px bg-neutral-700/50 mx-5" />
              <InfoRow label="Type" value="Fine Dining" />
            </div>

            {/* Email and Phone Group */}
            <div className="bg-neutral-800/40 rounded-2xl overflow-hidden">
              <InfoRow label="Email" value="info@bollywoodbites.co.uk" />
              <div className="h-px bg-neutral-700/50 mx-5" />
              <InfoRow label="Phone" value="+44 20 7946 0958" />
            </div>

            {/* Description Section */}
            <div>
              <h3 className="text-neutral-400 text-base mb-2 px-1">Description</h3>
              <div className="relative">
                <Textarea
                  defaultValue="Authentic Indian fine dining experience in the heart of London. Serving traditional and modern Indian cuisine crafted with fresh, locally sourced ingredients."
                  className="bg-neutral-800/40 border-none rounded-2xl min-h-[60px] resize-none pr-16 text-foreground placeholder:text-neutral-500"
                  maxLength={250}
                />
                {/* Colorful AI Icon */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center">
                  <img src={aiColorfulIcon} alt="AI" className="w-10 h-10 object-contain" />
                </div>
              </div>
              <p className="text-neutral-500 text-sm mt-2 px-1">Maximum 250 characters</p>
            </div>

            {/* Address Section */}
            <div>
              <h3 className="text-neutral-400 text-base mb-2 px-1">Address</h3>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                  <Search className="w-5 h-5 text-neutral-500" />
                </div>
                <input
                  type="text"
                  defaultValue="42 Kings Road, Chelsea, London SW3 4ND, UK"
                  className="w-full bg-neutral-800/40 border-none rounded-2xl py-4 pl-12 pr-12 text-foreground placeholder:text-neutral-500 focus:outline-none focus:ring-0"
                />
                <button className="absolute right-4 top-1/2 -translate-y-1/2">
                  <LocateFixed className="w-5 h-5 text-foreground" />
                </button>
              </div>
            </div>

            {/* Settings Options */}
            <div className="bg-neutral-800/40 rounded-2xl overflow-hidden">
              <SettingRow
                icon={<SettingsIcon bgColor="#5FC8D5" iconSrc={revenueCentersIcon} iconAlt="Revenue Centers" />}
                label="Revenue Centers"
                value={activeRevenueCenter}
              />
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
