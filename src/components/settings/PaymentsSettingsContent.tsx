import { useState } from "react";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";
import AnimatedAIIcon from "@/components/AnimatedAIIcon";

// Import custom icons
import paymentsHeaderIcon from "@/assets/icons/payments-header.png";
import paymentMethodsIcon from "@/assets/icons/payment-methods.png";
import gratuityIcon from "@/assets/icons/gratuity.png";
import taxesIcon from "@/assets/icons/taxes.png";
import discountsIcon from "@/assets/icons/discounts.png";
import serviceChargeIcon from "@/assets/icons/service-charge.png";
import cashManagementIcon from "@/assets/icons/cash-management.png";
import checkoutOptionsIcon from "@/assets/icons/checkout-options.png";
interface SettingsOptionProps {
  icon: string;
  iconBgColor: string;
  label: string;
  description?: string;
  onClick?: () => void;
  showDivider?: boolean;
}
const SettingsOption = ({
  icon,
  iconBgColor,
  label,
  description,
  onClick,
  showDivider = true
}: SettingsOptionProps) => <div>
    <button onClick={onClick} className="flex items-center justify-between w-full py-3.5 px-4 active:opacity-70 transition-opacity">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{
        backgroundColor: iconBgColor
      }}>
          <img src={icon} alt={label} className="w-5 h-5" />
        </div>
         <div className="text-left">
           <span className="text-foreground text-lg font-medium">{label}</span>
         </div>
      </div>
      <ChevronRight className="w-5 h-5 text-neutral-500" />
    </button>
    {showDivider && <div className="h-px bg-neutral-700/50 mx-4" />}
  </div>;
interface PaymentsSettingsContentProps {
  showHeader?: boolean;
  onNavigate?: (path: string) => void;
  onBack?: () => void;
  onAIClick?: () => void;
}
const PaymentsSettingsContent = ({
  showHeader = true,
  onNavigate,
  onBack,
  onAIClick
}: PaymentsSettingsContentProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  return <div className="h-full overflow-y-auto scrollbar-hide overscroll-contain">
      {/* Header - only shown in tablet/desktop right panel */}
      {showHeader && <div className="flex items-center justify-center py-4 border-b border-neutral-800/50 relative">
          {onBack && <button onClick={onBack} className="absolute left-4 w-8 h-8 rounded-full bg-neutral-800/60 flex items-center justify-center active:opacity-70 transition-opacity">
              <ChevronLeft className="w-4 h-4 text-foreground" />
            </button>}
          <h1 className="text-base font-medium text-foreground">Payments</h1>
        </div>}

      {/* Content */}
      {/* Extra bottom padding so the last row isn't hidden behind mobile bottom navigation */}
      <div className="pt-6 px-6 pb-28">
        {/* Header Card */}
        <div className={`bg-neutral-800/60 rounded-2xl p-5 mb-4 flex flex-col ${isMobile ? 'items-start' : 'items-center text-center'}`}>
          {/* Payments Icon */}
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{
          backgroundColor: "#4200FF"
        }}>
            <img src={paymentsHeaderIcon} alt="Payments" className="w-8 h-8 object-contain" />
          </div>

          {/* Title */}
          <h1 className="text-xl font-semibold text-foreground mb-2">Payments</h1>

          {/* Description with Learn More / Less toggle */}
          <p className="text-base text-neutral-400 leading-relaxed">
            {isExpanded ? <>
                Manage all payment-related configurations in one place, including payment methods, tips, taxes, discounts, service charges, cash handling, and checkout options to ensure a smooth and controlled payment experience across POS.{" "}
                <button onClick={() => setIsExpanded(false)} className="hover:underline" style={{
              color: "#0088FF"
            }}>
                  Less
                </button>
              </> : <>
                Manage all payment-related configurations in one place, including payment methods, tips, taxes, discounts, service charges,{" "}
                <button onClick={() => setIsExpanded(true)} className="hover:underline" style={{
              color: "#0088FF"
            }}>
                  Learn More...
                </button>
              </>}
          </p>
        </div>

        {/* AI Assistant Icon - hidden on mobile (shown in page wrapper) */}
        <div className="hidden md:flex justify-end mb-3 overflow-visible">
          <AnimatedAIIcon size={24} onClick={onAIClick || (() => navigate('/settings/ai'))} />
        </div>

        {/* Options Card */}
        <div className="bg-neutral-800/60 rounded-2xl overflow-hidden">
          <SettingsOption icon={paymentMethodsIcon} iconBgColor="#5F5F5F" label="Payment Methods" onClick={() => onNavigate?.('/settings/payments/payment-methods')} showDivider={true} />
          <SettingsOption icon={gratuityIcon} iconBgColor="#F80063" label="Gratuity" onClick={() => onNavigate?.('/settings/payments/gratuity')} showDivider={true} />
          <SettingsOption icon={taxesIcon} iconBgColor="#AF1DFF" label="Taxes" onClick={() => onNavigate?.('/settings/payments/taxes')} showDivider={true} />
          <SettingsOption icon={discountsIcon} iconBgColor="#00B6FA" label="Discounts" onClick={() => onNavigate?.('/settings/payments/discounts')} showDivider={true} />
          <SettingsOption icon={serviceChargeIcon} iconBgColor="#FF3F7D" label="Service Charge" onClick={() => onNavigate?.('/settings/payments/service-charge')} showDivider={true} />
          <SettingsOption icon={cashManagementIcon} iconBgColor="#F80063" label="Cash Management" onClick={() => onNavigate?.('/settings/payments/cash-management')} showDivider={true} />
          <SettingsOption icon={checkoutOptionsIcon} iconBgColor="#000000" label="Checkout Options" onClick={() => onNavigate?.('/settings/payments/checkout-options')} showDivider={false} />
        </div>
      </div>
    </div>;
};
export default PaymentsSettingsContent;