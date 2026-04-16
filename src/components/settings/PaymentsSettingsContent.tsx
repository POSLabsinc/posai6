import { useState } from "react";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";
import { useAppearance } from "@/contexts/AppearanceContext";
import SettingsIcon from "@/components/settings/SettingsIcon";

// Import custom icons
import paymentsHeaderIcon from "@/assets/icons/payments-header.png";
import paymentMethodsIcon from "@/assets/icons/payment-methods.png";
import gratuityIcon from "@/assets/icons/gratuity.png";
import taxesIcon from "@/assets/icons/taxes.png";
import discountsIcon from "@/assets/icons/discounts.png";
import serviceChargeIcon from "@/assets/icons/service-charge.png";
import cashManagementIcon from "@/assets/icons/cash-management.png";
import checkoutOptionsIcon from "@/assets/icons/checkout-options.png";
import voucherIcon from "@/assets/icons/voucher.svg";

interface SettingsOptionProps {
  icon: string;
  iconBgColor: string;
  label: string;
  description?: string;
  onClick?: () => void;
  showDivider?: boolean;
  rightText?: string;
}

const SettingsOption = ({
  icon,
  iconBgColor,
  label,
  description,
  onClick,
  showDivider = true,
  rightText
}: SettingsOptionProps) => {
  return <div>
    <button onClick={onClick} className="flex items-center justify-between w-full py-3.5 px-4 active:opacity-70 transition-opacity bg-neutral-800/60 rounded-2xl">
      <div className="flex items-center gap-4">
        <SettingsIcon bgColor={iconBgColor} iconSrc={icon} iconAlt={label} />
        <span className="text-foreground text-lg font-medium">{label}</span>
      </div>
      {rightText ? (
        <span className="text-sm font-medium text-neutral-500">{rightText}</span>
      ) : (
        <ChevronRight className="w-5 h-5 text-neutral-500" />
      )}
    </button>
    {description && <p className="text-neutral-500 text-xs mt-1.5 px-4 leading-relaxed">{description}</p>}
  </div>;
};

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
  const { getIconBgColor } = useAppearance();
  return <div className="h-full overflow-y-auto scrollbar-hide overscroll-contain">
      {showHeader && <div className="flex items-center pt-0 pb-2 relative overflow-visible px-4 md:hidden">
          {onBack && <button onClick={onBack} className="w-10 h-10 rounded-full bg-neutral-800/60 flex items-center justify-center active:opacity-70 transition-opacity">
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>}
        </div>}

      <div className={`${showHeader ? 'pt-0' : 'pt-0'} px-6 pb-28`}>
        <div className="bg-neutral-800/60 rounded-2xl p-5 mb-4 flex flex-col items-start">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{
          backgroundColor: getIconBgColor("#4200FF")
        }}>
            <img src={paymentsHeaderIcon} alt="Payments" className="w-8 h-8 object-contain" />
          </div>
          <h1 className="text-xl font-semibold text-foreground mb-2">Payments</h1>
          <p className="text-base text-neutral-400 leading-relaxed w-full">
            {isExpanded ? <>
                Manage all payment-related configurations in one place, including payment methods, tips, taxes, discounts, service charges, cash handling, and checkout options to ensure a smooth and controlled payment experience across Point of Sale.{" "}
                <button onClick={() => setIsExpanded(false)} className="hover:underline" style={{ color: "#0088FF" }}>
                  Less
                </button>
              </> : <>
                Manage all payment-related configurations in one place, including payment methods, tips, taxes, discounts, service charges,{" "}
                <button onClick={() => setIsExpanded(true)} className="hover:underline" style={{ color: "#0088FF" }}>
                  Learn More...
                </button>
              </>}
          </p>
        </div>


        <div className="space-y-4">
          <SettingsOption icon={taxesIcon} iconBgColor="#AF1DFF" label="Taxes" description="Manage tax rates for different categories, set up tax exemptions, and configure tax-inclusive or exclusive pricing." onClick={() => onNavigate?.('/settings/payments/taxes')} />
          
          <SettingsOption icon={gratuityIcon} iconBgColor="#F80063" label="Gratuity" description="Set up tip presets, auto-gratuity rules for large parties, and configure tip pooling and distribution among staff." onClick={() => onNavigate?.('/settings/payments/gratuity')} />
          <SettingsOption icon={discountsIcon} iconBgColor="#00B6FA" label="Discounts" description="Create and manage percentage-based or fixed-amount discounts, set eligibility rules, and track discount usage." onClick={() => onNavigate?.('/settings/payments/discounts')} />
          <SettingsOption icon={serviceChargeIcon} iconBgColor="#FF3F7D" label="Service Charge" description="Configure automatic service charges, surcharges, and fees that apply to orders based on party size or order type." onClick={() => onNavigate?.('/settings/payments/service-charge')} />
          <SettingsOption icon={paymentMethodsIcon} iconBgColor="#5F5F5F" label="Payment Methods" description="Configure which payment types are accepted at checkout and control their visibility across your point of sale terminals." onClick={() => onNavigate?.('/settings/payments/payment-methods')} />
          <SettingsOption icon={cashManagementIcon} iconBgColor="#F80063" label="Cash Management" description="Track cash drawers, manage pay-ins and pay-outs, and handle end-of-day cash reconciliation across registers." onClick={() => onNavigate?.('/settings/payments/cash-management')} />
          <SettingsOption icon={checkoutOptionsIcon} iconBgColor="#000000" label="Checkout Options" description="Customize the checkout flow, receipt preferences, signature requirements, and order completion settings." onClick={() => onNavigate?.('/settings/payments/checkout-options')} />
          <SettingsOption icon={cashManagementIcon} iconBgColor="#F5A623" label="Payment Platform" description="The shown payment processor is being used to handle the transactions in your current device." rightText="NA" />
        </div>
      </div>
    </div>;
};
export default PaymentsSettingsContent;
