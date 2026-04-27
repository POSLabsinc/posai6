import { createElement } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import type { ComponentType, CSSProperties, ReactElement } from "react";
import type { LucideProps } from "lucide-react";

export type SortDirection = "asc" | "desc" | null;

export interface SortIconProps extends Omit<LucideProps, "ref"> {
  direction?: SortDirection;
}

const renderIcon = (
  Icon: ComponentType<LucideProps>,
  props: LucideProps,
): ReactElement => createElement(Icon, props);

export function SortIcon({ direction, size = 14, ...props }: SortIconProps) {
  if (direction === "asc") {
    return renderIcon(ArrowUp, { size, ...props });
  }

  if (direction === "desc") {
    return renderIcon(ArrowDown, { size, ...props });
  }

  return renderIcon(ArrowUpDown, { size, ...props });
}

export function useSortIconUrl(): string {
  return "";
}

export function getSortIconMaskStyle(_url: string): CSSProperties {
  return {};
}