import dineInIcon from "@/assets/icons/order-types/dine-in.svg";
import takeOutIcon from "@/assets/icons/order-types/take-out.svg";
import deliveryIcon from "@/assets/icons/order-types/delivery.svg";
import banquetIcon from "@/assets/icons/order-types/banquet.svg";
import driveThruIcon from "@/assets/icons/order-types/drive-thru.svg";
import curbSideIcon from "@/assets/icons/order-types/curb-side.svg";
import scheduledIcon from "@/assets/icons/order-types/scheduled.svg";
import phoneInIcon from "@/assets/icons/order-types/phone-in.svg";
import customIcon from "@/assets/icons/order-types/custom.svg";

// Order type icon mapping
export const ORDER_TYPE_ICONS: Record<string, string> = {
  "DINE IN": dineInIcon,
  "Dine In": dineInIcon,
  "Dine-In": dineInIcon,
  "Table": dineInIcon,
  "TAKE OUT": takeOutIcon,
  "Take Out": takeOutIcon,
  "Takeout": takeOutIcon,
  "Takeaway": takeOutIcon,
  "DELIVERY": deliveryIcon,
  "Delivery": deliveryIcon,
  "BANQUET": banquetIcon,
  "Banquet": banquetIcon,
  "DRIVE THRU": driveThruIcon,
  "Drive Thru": driveThruIcon,
  "Drive-thru": driveThruIcon,
  "CURB SIDE": curbSideIcon,
  "Curb Side": curbSideIcon,
  "SCHEDULED": scheduledIcon,
  "Scheduled": scheduledIcon,
  "PHONE-IN": phoneInIcon,
  "Phone-In": phoneInIcon,
  "Phone In": phoneInIcon,
  "CUSTOM": customIcon,
  "Custom": customIcon,
};

interface OrderTypeIconProps {
  type: string;
  size?: "xs" | "small" | "default" | "large";
  className?: string;
  variant?: "default" | "dark";
}

const OrderTypeIcon = ({ type, size = "default", className = "", variant = "default" }: OrderTypeIconProps) => {
  const sizeClasses = {
    xs: "w-3 h-3",
    small: "w-4 h-4",
    default: "w-5 h-5",
    large: "w-6 h-6",
  };

  // Use brightness filter to make icon dark for light backgrounds
  const variantClasses = variant === "dark" ? "brightness-0" : "";

  const icon = ORDER_TYPE_ICONS[type];
  
  if (!icon) {
    // Fallback to dine-in icon for unknown types
    return <img src={dineInIcon} alt={type} className={`${sizeClasses[size]} object-contain ${variantClasses} ${className}`} />;
  }

  return <img src={icon} alt={type} className={`${sizeClasses[size]} object-contain ${variantClasses} ${className}`} />;
};

export default OrderTypeIcon;
