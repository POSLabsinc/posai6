import { useState } from "react";
import { ChevronLeft, Search, LocateFixed, MapPin, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AnimatedAIIcon from "@/components/AnimatedAIIcon";
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
import StoreChangeConfirmationModal from "@/components/settings/StoreChangeConfirmationModal";
import StoreSelectionSheet from "@/components/settings/StoreSelectionSheet";
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
  const [showStoreSelection, setShowStoreSelection] = useState(false);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const activeRevenueCenter = getActiveRevenueCenter();

  const handlePinSuccess = () => {
    setShowPinModal(false);
    setShowStoreSelection(true);
  };

  const handleStoreSelected = (store: Store) => {
    setSelectedStore(store);
    setShowStoreSelection(false);
    setShowConfirmation(true);
  };

  const handleConfirmSwitch = () => {
    if (selectedStore) {
      switchStore(selectedStore.id);
    }
  };

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
          <div className="absolute right-4 hidden md:flex overflow-visible">
            <AnimatedAIIcon size={24} onClick={onAIClick || (() => navigate('/settings/ai'))} />
          </div>
        </div>
      )}

      <div className={`flex flex-col items-center ${showHeader ? 'pt-8' : 'pt-0'} px-6 pb-8`}>
        <div className="mb-8">
          <Avatar className="w-24 h-24 border-4 border-neutral-600">
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

        <div className="w-full space-y-4">
          <div className="bg-neutral-800/40 rounded-2xl overflow-hidden">
            <InfoRow label="Name" value="Bollywood Bites" />
            <div className="h-px bg-neutral-700/50 mx-5" />
            <InfoRow label="Type" value="Fine Dining" />
          </div>

          <div className="bg-neutral-800/40 rounded-2xl overflow-hidden">
            <InfoRow label="Email" value="info@bollywoodbites.co.uk" />
            <div className="h-px bg-neutral-700/50 mx-5" />
            <InfoRow label="Phone" value="+44 20 7946 0958" />
          </div>

          <div>
            <h3 className="text-neutral-400 text-base mb-2 px-1">Description</h3>
            <div className="relative">
              <Textarea
                defaultValue="Authentic Indian fine dining experience in the heart of London. Serving traditional and modern Indian cuisine crafted with fresh, locally sourced ingredients."
                className="bg-neutral-800/40 border-none rounded-2xl min-h-[60px] resize-none pr-16 text-foreground placeholder:text-neutral-500"
                maxLength={250}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center">
                <img src={aiColorfulIcon} alt="AI" className="w-10 h-10 object-contain" />
              </div>
            </div>
            <p className="text-neutral-500 text-sm mt-2 px-1">Maximum 250 characters</p>
          </div>

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

          {/* Device Configuration */}
          <div className="mt-6">
            <h3 className="text-neutral-400 text-xs font-medium tracking-wider mb-3 px-1">DEVICE CONFIGURATION</h3>
            <div className="bg-neutral-800/40 rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between w-full py-4 px-5">
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600/80 flex items-center justify-center">
                    <MapPin className="w-4.5 h-4.5 text-white" />
                  </div>
                  <div>
                    <span className="text-foreground text-base font-medium">Current Store</span>
                    <p className="text-neutral-500 text-sm mt-0.5">
                      {storeLoading
                        ? "Loading..."
                        : currentStore
                          ? `${currentStore.name} – ${currentStore.location}`
                          : "No store assigned"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPinModal(true)}
                  className="px-4 py-2 rounded-xl bg-neutral-700/60 text-foreground text-sm font-medium hover:bg-neutral-600/60 active:bg-neutral-600 transition-colors"
                >
                  Change Store
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CS PIN Modal */}
      <CustomerSupportPinModal
        isOpen={showPinModal}
        onClose={() => setShowPinModal(false)}
        onSuccess={handlePinSuccess}
      />

      {/* Store Selection Sheet */}
      <StoreSelectionSheet
        isOpen={showStoreSelection}
        stores={allStores}
        currentStoreId={currentStore?.id}
        onSelect={handleStoreSelected}
        onClose={() => setShowStoreSelection(false)}
      />

      {/* Confirmation Modal */}
      <StoreChangeConfirmationModal
        isOpen={showConfirmation}
        targetStoreName={selectedStore ? `${selectedStore.name} – ${selectedStore.location}` : undefined}
        onCancel={() => setShowConfirmation(false)}
        onConfirm={handleConfirmSwitch}
      />
    </div>
  );
};

export default RestaurantInformationContent;
