import React from "react";
import OrderTypeIcon from "@/components/OrderTypeIcon";
type OrderType = "Table" | "DINE IN" | "Dine In" | "TAKE OUT" | "Take Out" | "DELIVERY" | "Delivery" | "BANQUET" | "Banquet" | "DRIVE THRU" | "Drive Thru" | "CURB SIDE" | "Curb Side" | "SCHEDULED" | "Scheduled" | "PHONE-IN" | "Phone-In" | "CUSTOM" | "Custom" | "DineIn" | "Takeaway" | "Drive-thru";

interface MobileTicketCardProps {
  orderId: string;
  checkId: string;
  guestName: string;
  tableNumber?: string;
  partySize?: number;
  orderType: OrderType;
  arrivedTime: string;
  timer: string;
  revenueCenter: string;
  serverName: string;
  orderStatus: string;
  totalAmount: number;
  paymentStatus: string;
  gratuity: number;
  isSelected?: boolean;
  onClick?: () => void;
}

const getStatusColor = (status: string) => {
  switch (status.toUpperCase()) {
    case "ORDERING":
      return "text-[#FF6B6B]";
    case "PAID":
      return "text-amber-500";
    case "UNPAID":
    case "UN PAID":
      return "text-neutral-400";
    case "COMPLETED":
      return "text-amber-500";
    case "FULLY REFUNDED":
      return "text-red-400";
    case "PARTIALLY REFUNDED":
      return "text-orange-400";
    default:
      return "text-foreground";
  }
};

const formatPrice = (price: number) => `$${price.toFixed(2)}`;

const MobileTicketCard: React.FC<MobileTicketCardProps> = ({
  orderId,
  checkId,
  guestName,
  tableNumber,
  partySize,
  orderType,
  arrivedTime,
  timer,
  revenueCenter,
  serverName,
  orderStatus,
  totalAmount,
  paymentStatus,
  gratuity,
  isSelected = false,
  onClick,
}) => {
  const isTableOrder = orderType === "Table" && tableNumber;

  return (
    <div
      onClick={onClick}
      className="flex items-stretch w-full rounded-xl border border-neutral-700/50 cursor-pointer transition-all overflow-hidden"
      style={{ backgroundColor: "#1B1C20" }}
    >
      {/* Column 1: Order ID Box */}
      <div className="flex-shrink-0 p-2 flex items-center">
        <div className="w-12 h-14 bg-neutral-700 rounded-lg flex flex-col items-center justify-center">
          <span className="text-xl font-bold text-white leading-none">{orderId}</span>
          <span className="text-xs text-neutral-400 leading-none mt-0.5">{checkId}</span>
        </div>
      </div>

      {/* Column 2: Main Content */}
      <div className="flex-1 min-w-0 py-2 pr-3">
        {/* Row 1: Guest · Table | Server | Status */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-1 min-w-0 flex-1 mr-2">
            <span className="text-white font-medium text-sm truncate">
              {isTableOrder ? `${guestName} - ${tableNumber}` : guestName}
            </span>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <span className="text-neutral-400 text-sm">{serverName}</span>
            <span className={`text-sm font-semibold uppercase ${getStatusColor(orderStatus)}`}>
              {orderStatus}
            </span>
          </div>
        </div>

        {/* Row 2: Party info / Order Type, time, timer | Total Amount */}
        <div className="flex items-center justify-between mt-0.5">
          <div className="flex items-center text-neutral-400 text-xs min-w-0 flex-1 mr-2 gap-1">
            <OrderTypeIcon type={orderType} size="xs" />
            <span className="truncate">
              {isTableOrder ? `Party of ${partySize}` : orderType}
            </span>
            <span className="flex-shrink-0">, {arrivedTime}</span>
            <span className="mx-1 flex-shrink-0">|</span>
            <span className="flex-shrink-0">{timer}</span>
          </div>
          <span className="text-white font-semibold text-sm flex-shrink-0">{formatPrice(totalAmount)}</span>
        </div>

        {/* Row 3: Revenue Center | Payment Status | Gratuity */}
        <div className="flex items-center justify-between mt-1">
          <span className="text-white font-medium text-sm">{revenueCenter}</span>
          <div className="flex items-center gap-4">
            <span className="text-neutral-400 text-sm">{paymentStatus}</span>
            <span className="text-white text-sm">{formatPrice(gratuity)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileTicketCard;
