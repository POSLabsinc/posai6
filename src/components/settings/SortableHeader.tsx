import { useState, useMemo, useCallback, useEffect } from "react";
import expandArrowsIcon from "@/assets/icons/expand-arrows.svg";

// Inline SVG fallback (rounded up/down triangles) used if the asset is blank
// or fails to load. Encoded as a data URI so it always renders.
const FALLBACK_SORT_ICON =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12.93 2.55a1.2 1.2 0 0 0-1.86 0L4.36 9.85c-.62.74-.09 1.86.93 1.86h13.42c1.02 0 1.55-1.12.93-1.86l-6.71-7.3ZM11.07 21.45a1.2 1.2 0 0 0 1.86 0l6.71-7.3c.62-.74.09-1.86-.93-1.86H5.29c-1.02 0-1.55 1.12-.93 1.86l6.71 7.3Z"/></svg>',
  );

/**
 * Validate the imported sort icon at runtime. If the asset is missing,
 * empty, or white-on-transparent (no visible paint at default color), we
 * swap in the inline fallback so headers never appear without an icon.
 */
function useResolvedSortIcon(): string {
  const [resolved, setResolved] = useState<string>(
    expandArrowsIcon || FALLBACK_SORT_ICON,
  );

  useEffect(() => {
    let cancelled = false;
    const candidate = expandArrowsIcon as string | undefined;
    if (!candidate) {
      setResolved(FALLBACK_SORT_ICON);
      return;
    }
    fetch(candidate)
      .then((r) => (r.ok ? r.text() : Promise.reject()))
      .then((text) => {
        if (cancelled) return;
        const trimmed = text.trim();
        const hasShape = /<(path|polygon|rect|circle|polyline|line)\b/i.test(
          trimmed,
        );
        // Also guard against pure-transparent assets where every fill/stroke
        // is explicitly "none" or "transparent" (would mask to nothing).
        const onlyInvisible =
          /fill="(none|transparent)"/i.test(trimmed) &&
          !/fill="(currentColor|#|rgb|hsl)/i.test(trimmed);
        if (!trimmed || !hasShape || onlyInvisible) {
          setResolved(FALLBACK_SORT_ICON);
        } else {
          setResolved(candidate);
        }
      })
      .catch(() => {
        if (!cancelled) setResolved(FALLBACK_SORT_ICON);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return resolved;
}

function getSortIconMaskStyle(url: string): React.CSSProperties {
  return {
    WebkitMaskImage: `url(${url})`,
    maskImage: `url(${url})`,
    WebkitMaskRepeat: "no-repeat",
    maskRepeat: "no-repeat",
    WebkitMaskPosition: "center",
    maskPosition: "center",
    WebkitMaskSize: "contain",
    maskSize: "contain",
    backgroundColor: "currentColor",
  };
}

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
      <span
        aria-hidden
        style={sortIconMaskStyle}
        className={`w-3 h-3 shrink-0 inline-block text-foreground transition-opacity ${
          isActive ? "opacity-90" : "opacity-40"
        } ${
          sort.key === sortKey && sort.direction === "desc" ? "rotate-180" : ""
        }`}
      />
    </button>
  );
}

export default SortableHeader;
