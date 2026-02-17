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

  return (
    <div className="min-h-screen bg-background p-4 pb-28">
      {/* Header with back button and AI icon */}
      <div className="flex items-center justify-between mb-8 overflow-visible">
        <button
          onClick={() => navigate(-1)}
          className="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center active:opacity-70 transition-opacity"
        >
          <ChevronLeft className="w-6 h-6 text-foreground" />
        </button>
        <div className="md:hidden">
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
            <InfoRow label="Name" value="Enter" />
            <div className="h-px bg-neutral-700/50 mx-5" />
            <InfoRow label="Type" value="Select" />
          </div>

          {/* Email and Phone Group */}
          <div className="bg-neutral-800/40 rounded-2xl overflow-hidden">
            <InfoRow label="Email" value="Enter Email Address" />
            <div className="h-px bg-neutral-700/50 mx-5" />
            <InfoRow label="Phone" value="(000) 000 - 0000" />
          </div>

          {/* Description Section */}
          <div>
            <h3 className="text-neutral-400 text-base mb-2 px-1">Description</h3>
            <div className="relative">
              <Textarea
                placeholder="Brief Restaurant Description"
                className="bg-neutral-800/40 border-none rounded-2xl min-h-[60px] resize-none pr-16 text-neutral-500 placeholder:text-neutral-500"
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
                placeholder="Search Address"
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
              icon={
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#5FC8D5' }}>
                  <img src={revenueCentersIcon} alt="Revenue Centers" className="w-5 h-5 object-contain" />
                </div>
              }
              label="Revenue Centers"
            />
            <div className="h-px bg-neutral-700/50 mx-5" />
            <SettingRow
              icon={
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#F78E34' }}>
                  <img src={businessHoursIcon} alt="Business Hours" className="w-5 h-5 object-contain" />
                </div>
              }
              label="Business Hours"
            />
            <div className="h-px bg-neutral-700/50 mx-5" />
            <SettingRow
              icon={
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#FF5DB6' }}>
                  <img src={languageIcon} alt="Language" className="w-5 h-5 object-contain" />
                </div>
              }
              label="Language"
              value="English"
            />
            <div className="h-px bg-neutral-700/50 mx-5" />
            <SettingRow
              icon={
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#34A885' }}>
                  <img src={currencyIcon} alt="Currency" className="w-5 h-5 object-contain" />
                </div>
              }
              label="Currency"
              value="GBP £"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestaurantInformation;
