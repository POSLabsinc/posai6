import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import type { LucideProps } from "lucide-react";

export type SortDirection = "asc" | "desc" | null;

/**
 * SortIcon component that displays a clean, flat arrow icon.
 * Uses Lucide's ArrowUpDown for neutral state, ArrowUp/ArrowDown for active sorting.
 * Automatically inherits text color for perfect dark/light mode visibility.
 */
export interface SortIconProps extends Omit<LucideProps, "ref"> {
  direction?: SortDirection;
}

export function SortIcon({ direction, size = 14, ...props }: SortIconProps) {
  if (direction === "asc") {
    return <ArrowUp size={size} {...props} />;
  }
  if (direction === "desc") {
    return <ArrowDown size={size} {...props} />;
  }
  // Neutral state - show ArrowUpDown
  return <ArrowUpDown size={size} {...props} />;
}

/**
 * @deprecated Use SortIcon component directly instead of URL-based icons
 */
export function useSortIconUrl(): string {
  return "";
}

/**
 * @deprecated SortIcon component handles styling internally
 */
export function getSortIconMaskStyle(_url: string): React.CSSProperties {
  return {};
}
