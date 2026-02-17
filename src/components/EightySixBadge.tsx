import { X, Ban, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type BadgeSize = "sm" | "default" | "lg";
type BadgeVariant = "default" | "subtle" | "outline";

interface EightySixBadgeProps {
  size?: BadgeSize;
  variant?: BadgeVariant;
  showIcon?: boolean;
  label?: string;
  pulse?: boolean;
  className?: string;
}

/**
 * EightySixBadge - A highly visible indicator for 86'd (unavailable) items
 * 
 * Features:
 * - High-contrast red colors optimized for dark mode
 * - Multiple sizes for different contexts
 * - Optional pulsing animation for emphasis
 * - Combines color + shape + icon for accessibility
 */
export function EightySixBadge({
  size = "default",
  variant = "default",
  showIcon = true,
  label = "86'd",
  pulse = false,
  className,
}: EightySixBadgeProps) {
  const sizeClasses: Record<BadgeSize, string> = {
    sm: "eighty-six-badge-sm",
    default: "",
    lg: "eighty-six-badge-lg",
  };

  const variantClasses: Record<BadgeVariant, string> = {
    default: "eighty-six-badge",
    subtle: "px-2 py-0.5 bg-[hsl(0,84%,60%)]/20 border border-[hsl(0,84%,60%)]/40 rounded-full text-[hsl(0,84%,60%)] text-[10px] font-bold uppercase",
    outline: "px-2 py-0.5 border-2 border-[hsl(0,84%,60%)] rounded-full text-[hsl(0,84%,60%)] text-[10px] font-bold uppercase bg-transparent",
  };

  const iconSizes: Record<BadgeSize, number> = {
    sm: 8,
    default: 10,
    lg: 12,
  };

  return (
    <span
      className={cn(
        variantClasses[variant],
        variant === "default" && sizeClasses[size],
        pulse && "eighty-six-pulse",
        "inline-flex items-center gap-1 whitespace-nowrap",
        className
      )}
    >
      {showIcon && (
        <X 
          size={iconSizes[size]} 
          strokeWidth={3} 
          className="flex-shrink-0"
        />
      )}
      <span>{label}</span>
    </span>
  );
}

interface EightySixTextProps {
  children: React.ReactNode;
  className?: string;
  showStrikethrough?: boolean;
}

/**
 * EightySixText - Text styling for 86'd items with thick strikethrough
 */
export function EightySixText({
  children,
  className,
  showStrikethrough = true,
}: EightySixTextProps) {
  return (
    <span
      className={cn(
        showStrikethrough ? "eighty-six-text" : "text-[hsl(0,84%,60%)] font-semibold",
        className
      )}
    >
      {children}
    </span>
  );
}

interface EightySixIconProps {
  size?: "sm" | "default" | "lg";
  className?: string;
}

/**
 * EightySixIcon - Circular icon indicator for 86'd items
 */
export function EightySixIcon({ size = "default", className }: EightySixIconProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    default: "w-5 h-5",
    lg: "w-6 h-6",
  };

  const iconSizes = {
    sm: 10,
    default: 12,
    lg: 14,
  };

  return (
    <div
      className={cn(
        "eighty-six-icon",
        sizeClasses[size],
        className
      )}
    >
      <X size={iconSizes[size]} strokeWidth={3} />
    </div>
  );
}

interface EightySixRowProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * EightySixRow - Row wrapper with subtle background highlight for 86'd items
 */
export function EightySixRow({ children, className }: EightySixRowProps) {
  return (
    <div className={cn("eighty-six-row px-2 py-1.5", className)}>
      {children}
    </div>
  );
}

interface EightySixQuantityProps {
  quantity: number;
  className?: string;
}

/**
 * EightySixQuantity - Quantity indicator for partially 86'd items
 */
export function EightySixQuantity({ quantity, className }: EightySixQuantityProps) {
  return (
    <span className={cn("eighty-six-qty", className)}>
      ✕{quantity}
    </span>
  );
}

export default EightySixBadge;
