import { useState, useMemo, useCallback } from "react";
import expandArrowsIcon from "@/assets/icons/expand-arrows.svg";

export type SortDirection = "asc" | "desc" | null;

export interface SortState<K extends string = string> {
  key: K | null;
  direction: SortDirection;
}

/**
 * Hook that manages sort state and returns a sorted copy of the list.
 *
 * Click cycle: none -> asc -> desc -> none.
 * `accessor` lets each column expose the right comparable value.
 */
export function useSortableData<T, K extends string = string>(
  items: T[],
  accessor: (item: T, key: K) => string | number | null | undefined,
  initial?: SortState<K>,
) {
  const [sort, setSort] = useState<SortState<K>>(
    initial ?? { key: null, direction: null },
  );

  const requestSort = useCallback((key: K) => {
    setSort((prev) => {
      if (prev.key !== key) return { key, direction: "asc" };
      if (prev.direction === "asc") return { key, direction: "desc" };
      if (prev.direction === "desc") return { key: null, direction: null };
      return { key, direction: "asc" };
    });
  }, []);

  const sortedItems = useMemo(() => {
    if (!sort.key || !sort.direction) return items;
    const dir = sort.direction === "asc" ? 1 : -1;
    const copy = [...items];
    copy.sort((a, b) => {
      const av = accessor(a, sort.key as K);
      const bv = accessor(b, sort.key as K);
      // null/undefined values sink to the bottom regardless of direction
      const aMissing = av === null || av === undefined || av === "";
      const bMissing = bv === null || bv === undefined || bv === "";
      if (aMissing && bMissing) return 0;
      if (aMissing) return 1;
      if (bMissing) return -1;
      if (typeof av === "number" && typeof bv === "number") {
        return (av - bv) * dir;
      }
      return String(av).localeCompare(String(bv), undefined, {
        numeric: true,
        sensitivity: "base",
      }) * dir;
    });
    return copy;
  }, [items, sort, accessor]);

  return { sortedItems, sort, requestSort };
}

interface SortableHeaderProps<K extends string> {
  label: string;
  sortKey: K;
  sort: SortState<K>;
  onSort: (key: K) => void;
  align?: "left" | "center" | "right";
  className?: string;
  /** Render the label in semibold (matches table-header treatment). Default true. */
  bold?: boolean;
}

/**
 * Header cell that renders the column label + expand-arrows icon.
 * Click toggles sort. Visually highlights the icon when this column is active.
 */
export function SortableHeader<K extends string>({
  label,
  sortKey,
  sort,
  onSort,
  align = "left",
  className = "",
  bold = true,
}: SortableHeaderProps<K>) {
  const isActive = sort.key === sortKey && sort.direction !== null;
  const justify =
    align === "right"
      ? "justify-end"
      : align === "center"
      ? "justify-center"
      : "justify-start";

  return (
    <button
      type="button"
      onClick={() => onSort(sortKey)}
      className={`inline-flex items-center gap-1.5 select-none cursor-pointer w-full ${justify} ${className}`}
      aria-label={`Sort by ${label}`}
    >
      <span
        className={`${bold ? "font-semibold" : "font-medium"} ${
          align === "right"
            ? "text-right"
            : align === "center"
            ? "text-center"
            : "text-left"
        }`}
      >
        {label}
      </span>
      <img
        src={expandArrowsIcon}
        alt=""
        aria-hidden
        className={`w-3 h-3 shrink-0 transition-opacity ${
          isActive ? "opacity-90" : "opacity-40"
        } ${
          sort.key === sortKey && sort.direction === "desc" ? "rotate-180" : ""
        }`}
      />
    </button>
  );
}

export default SortableHeader;
