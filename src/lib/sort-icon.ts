import { useEffect, useState } from "react";
import expandArrowsIcon from "@/assets/icons/expand-arrows.svg";

/**
 * Inline rounded up/down triangle SVG used as the universal fallback when
 * the sort icon asset is missing, empty, or rendered as fully transparent
 * (e.g. white-on-transparent that masks to nothing). Encoded as a data URI
 * so it always paints, even offline or with broken asset pipelines.
 */
export const FALLBACK_SORT_ICON =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12.93 2.55a1.2 1.2 0 0 0-1.86 0L4.36 9.85c-.62.74-.09 1.86.93 1.86h13.42c1.02 0 1.55-1.12.93-1.86l-6.71-7.3ZM11.07 21.45a1.2 1.2 0 0 0 1.86 0l6.71-7.3c.62-.74.09-1.86-.93-1.86H5.29c-1.02 0-1.55 1.12-.93 1.86l6.71 7.3Z"/></svg>',
  );

let cached: string | null = null;
let inflight: Promise<string> | null = null;

function resolveSortIconUrl(): Promise<string> {
  if (cached) return Promise.resolve(cached);
  if (inflight) return inflight;
  const candidate = (expandArrowsIcon as string | undefined) ?? "";
  if (!candidate) {
    cached = FALLBACK_SORT_ICON;
    return Promise.resolve(cached);
  }
  inflight = fetch(candidate)
    .then((r) => (r.ok ? r.text() : Promise.reject(new Error("not ok"))))
    .then((text) => {
      const trimmed = text.trim();
      const hasShape = /<(path|polygon|rect|circle|polyline|line)\b/i.test(
        trimmed,
      );
      // Pure white-on-transparent assets still have shapes but paint nothing
      // visible. The mask technique relies on alpha — if every fill/stroke
      // is "none" / "transparent" the icon will appear missing.
      const onlyInvisible =
        /fill="(none|transparent)"/i.test(trimmed) &&
        !/fill="(currentColor|#|rgb|hsl)/i.test(trimmed);
      cached = !trimmed || !hasShape || onlyInvisible
        ? FALLBACK_SORT_ICON
        : candidate;
      return cached;
    })
    .catch(() => {
      cached = FALLBACK_SORT_ICON;
      return cached;
    });
  return inflight;
}

/** React hook returning a guaranteed-visible sort icon URL. */
export function useSortIconUrl(): string {
  const [url, setUrl] = useState<string>(
    cached ?? (expandArrowsIcon as string) ?? FALLBACK_SORT_ICON,
  );
  useEffect(() => {
    let cancelled = false;
    resolveSortIconUrl().then((resolved) => {
      if (!cancelled) setUrl(resolved);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return url;
}

export function getSortIconMaskStyle(url: string): React.CSSProperties {
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
