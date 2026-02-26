// Centralized Order Summary Component
// Provides consistent display of order totals across all screens

import { OrderTotals, formatPrice, formatPriceWithSign } from "@/lib/orderUtils";

interface OrderSummaryProps {
  totals: OrderTotals;
  variant?: 'detailed' | 'compact' | 'minimal';
  showTip?: boolean;
  discountLabel?: string;
  serviceChargeLabel?: string;
  className?: string;
}

const OrderSummary = ({
  totals,
  variant = 'detailed',
  showTip = false,
  discountLabel = 'Discount',
  serviceChargeLabel = 'Service Charge',
  className = ''
}: OrderSummaryProps) => {
  const { subtotal, discount, serviceCharge, tax, tip, total } = totals;

  // Minimal variant - just total
  if (variant === 'minimal') {
    return (
      <div className={`text-white font-bold ${className}`}>
        {formatPrice(total)}
      </div>
    );
  }

  // Compact variant - single row
  if (variant === 'compact') {
    return (
      <div className={`text-xs space-y-1 ${className}`}>
        <div className="flex justify-between">
          <span className="text-white/60">Sub Total</span>
          <span className="text-white">{formatPrice(subtotal)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between">
            <span className="text-white">{discountLabel}</span>
            <span className="text-white">-{formatPrice(discount)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-white/60">{serviceChargeLabel}</span>
          <span className="text-white">{formatPrice(serviceCharge)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/60">Tax</span>
          <span className="text-white">{formatPrice(tax)}</span>
        </div>
        {showTip && tip > 0 && (
          <div className="flex justify-between">
            <span className="text-white/60">Tip</span>
            <span className="text-white">{formatPrice(tip)}</span>
          </div>
        )}
        <div className="flex justify-between pt-1 border-t border-white/10">
          <span className="text-white font-medium">Total</span>
          <span className="text-white font-bold">{formatPrice(total)}</span>
        </div>
      </div>
    );
  }

  // Detailed variant - two row glass styled (default)
  return (
    <div 
      className={`text-xs rounded px-2 py-1.5 space-y-0.5 ${className}`}
      style={{
        background: '#7575754D',
        boxShadow: 'inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)'
      }}
    >
      <div className="flex justify-between gap-3">
        <span className="text-foreground">
          Sub Total: <span className="font-medium">{formatPrice(subtotal)}</span>
        </span>
        {discount > 0 ? (
          <span className="text-white">
            {discountLabel}: <span className="font-medium">-{formatPrice(discount)}</span>
          </span>
        ) : (
          <span className="text-foreground/50">
            {discountLabel}: <span className="font-medium">$0.00</span>
          </span>
        )}
      </div>
      <div className="flex justify-between gap-3">
        <span className="text-foreground">
          {serviceChargeLabel}: <span className="font-medium text-primary">{formatPriceWithSign(serviceCharge, true)}</span>
        </span>
        <span className="text-foreground">
          Tax: <span className="font-medium">{formatPrice(tax)}</span>
        </span>
      </div>
      {showTip && tip > 0 && (
        <div className="flex justify-between gap-3">
          <span className="text-foreground">
            Tip: <span className="font-medium">{formatPrice(tip)}</span>
          </span>
          <span></span>
        </div>
      )}
    </div>
  );
};

export default OrderSummary;
