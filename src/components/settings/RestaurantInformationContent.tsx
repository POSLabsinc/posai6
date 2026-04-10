import { useState, useCallback } from "react";
import { ChevronLeft, Search, LocateFixed, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import aiColorfulIcon from "@/assets/icons/ai-colorful.png";
import revenueCentersIcon from "@/assets/icons/revenue-centers.png";
import businessHoursIcon from "@/assets/icons/business-hours.png";
import languageIcon from "@/assets/icons/language.png";
import currencyIcon from "@/assets/icons/currency.png";
import { useAppearance } from "@/contexts/AppearanceContext";
import SettingsIcon from "@/components/settings/SettingsIcon";
import { useDeviceStore } from "@/hooks/useDeviceStore";
import CustomerSupportPinModal from "@/components/settings/CustomerSupportPinModal";
import type { Store } from "@/hooks/useDeviceStore";

interface InfoRowProps {
  label: string;
  value: string;
  onClick?: () => void;
}

const InfoRow = ({ label, value }: InfoRowProps) => (
  <div className="flex items-center justify-between w-full py-4 px-5">
    <span className="text-foreground text-base font-medium">{label}</span>
    <span className="text-neutral-500 text-base">{value}</span>
  </div>
);

interface SettingRowProps {
  icon: React.ReactNode;
  label: string;
  value?: string;
  onClick?: () => void;
}

const SettingRow = ({ icon, label, value }: SettingRowProps) => (
  <div className="flex items-center justify-between w-full py-4 px-5">
    <div className="flex items-center gap-4">
      {icon}
      <span className="text-foreground text-base font-medium">{label}</span>
    </div>
    {value && <span className="text-neutral-400 text-base">{value}</span>}
  </div>
);

interface RestaurantInformationContentProps {
  showHeader?: boolean;
  onBack?: () => void;
  onAIClick?: () => void;
}

const RestaurantInformationContent = ({ showHeader = true, onBack, onAIClick }: RestaurantInformationContentProps) => {
  const navigate = useNavigate();
  const { getIconBgColor } = useAppearance();

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

  const { currentStore, allStores, loading: storeLoading, switchStore } = useDeviceStore();
  const [showPinModal, setShowPinModal] = useState(false);

  const activeRevenueCenter = getActiveRevenueCenter();

  const handleSwitchStore = useCallback((store: Store) => {
    switchStore(store.id);
  }, [switchStore]);

  return (
    <div className="h-full overflow-y-auto scrollbar-hide overscroll-contain">
      {showHeader && (
        <div className="flex items-center justify-center py-4 relative overflow-visible">
          {onBack && (
            <button
              onClick={onBack}
              className="absolute left-4 w-10 h-10 rounded-full bg-neutral-800/60 flex items-center justify-center active:opacity-70 transition-opacity"
            >
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>
          )}
          <h1 className="text-base font-medium text-foreground">Restaurant Information</h1>
  );
};

export default RestaurantInformationContent;
