import {
  Lock,
  MapPin,
  ShoppingBag,
  TreePine,
  UtensilsCrossed,
  Wine,
  type LucideIcon,
  type LucideProps,
} from "lucide-react";

export const REVENUE_CENTERS = [
  "Dine Center",
  "Main Hall",
  "Outdoor Patio",
  "Private Dining",
  "Bar Area",
  "Takeout Counter",
] as const;

type RevenueCenter = (typeof REVENUE_CENTERS)[number];

type RevenueCenterMeta = {
  color: string;
  icon: LucideIcon;
};

const REVENUE_CENTER_META: Record<RevenueCenter, RevenueCenterMeta> = {
  "Dine Center": {
    color: "hsl(var(--revenue-center-dine))",
    icon: UtensilsCrossed,
  },
  "Main Hall": {
    color: "hsl(var(--revenue-center-main))",
    icon: MapPin,
  },
  "Outdoor Patio": {
    color: "hsl(var(--revenue-center-patio))",
    icon: TreePine,
  },
  "Private Dining": {
    color: "hsl(var(--revenue-center-private))",
    icon: Lock,
  },
  "Bar Area": {
    color: "hsl(var(--revenue-center-bar))",
    icon: Wine,
  },
  "Takeout Counter": {
    color: "hsl(var(--revenue-center-takeout))",
    icon: ShoppingBag,
  },
};

const DEFAULT_REVENUE_CENTER_META: RevenueCenterMeta = {
  color: "hsl(var(--revenue-center-main))",
  icon: MapPin,
};

export const getRevenueCenterMeta = (center: string): RevenueCenterMeta => {
  return REVENUE_CENTER_META[center as RevenueCenter] ?? DEFAULT_REVENUE_CENTER_META;
};

type RevenueCenterIconProps = Omit<LucideProps, "color"> & {
  center: string;
};

export function RevenueCenterIcon({ center, style, ...props }: RevenueCenterIconProps) {
  const { color, icon: Icon } = getRevenueCenterMeta(center);

  return <Icon {...props} style={{ color, ...style }} />;
}