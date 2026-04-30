import { CSSProperties } from "react";

export interface ThemeStyle {
  id: string;
  name: string;
  description: string;
  variant: 'aurora' | 'midnight' | 'sunset' | 'forest' | 'royal' | 'crimson' | 'mono' | 'ocean' | 'candy' | 'platinum';
  bg: string;
  surface: string;
  accent: string;
  accent2: string;
  text: string;
  muted: string;
}

interface Props {
  theme: ThemeStyle;
  size?: 'sm' | 'lg';
}

/**
 * Renders a stylized POS preview unique per theme variant.
 * Each variant has a distinct layout feel, contrast and accent system.
 */
export default function ThemePresetCard({ theme, size = 'sm' }: Props) {
  const style: CSSProperties = {
    background: theme.bg,
    color: theme.text,
  };

  const surface: CSSProperties = { background: theme.surface };
  const accentBg: CSSProperties = { background: theme.accent };
  const accent2Bg: CSSProperties = { background: theme.accent2 };
  const mutedBg: CSSProperties = { background: theme.muted };

  const padding = size === 'lg' ? 'p-4' : 'p-2.5';
  const gap = size === 'lg' ? 'gap-3' : 'gap-1.5';

  return (
    <div className={`relative w-full aspect-[16/10] rounded-xl overflow-hidden ${padding}`} style={style}>
      {renderVariant(theme, size, gap, surface, accentBg, accent2Bg, mutedBg)}
    </div>
  );
}

function renderVariant(
  theme: ThemeStyle,
  size: 'sm' | 'lg',
  gap: string,
  surface: CSSProperties,
  accentBg: CSSProperties,
  accent2Bg: CSSProperties,
  mutedBg: CSSProperties,
) {
  const tile = size === 'lg' ? 'h-7' : 'h-3.5';
  const dot = size === 'lg' ? 'w-2 h-2' : 'w-1 h-1';
  const txt = size === 'lg' ? 'text-[10px]' : 'text-[6px]';

  switch (theme.variant) {
    case 'aurora':
      // Floating glass panels, top tabs, gradient halo
      return (
        <div className="h-full w-full flex flex-col gap-2">
          <div className={`flex ${gap}`}>
            <div className={`flex-1 ${tile} rounded-md`} style={accentBg} />
            <div className={`flex-1 ${tile} rounded-md`} style={surface} />
            <div className={`flex-1 ${tile} rounded-md`} style={surface} />
            <div className={`flex-1 ${tile} rounded-md`} style={surface} />
          </div>
          <div className={`grid grid-cols-3 ${gap} flex-1`}>
            <div className="rounded-md" style={surface} />
            <div className="rounded-md" style={surface} />
            <div className="rounded-md" style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})` }} />
          </div>
        </div>
      );

    case 'midnight':
      // Sidebar + content, dark/contrast
      return (
        <div className={`h-full w-full flex ${gap}`}>
          <div className="w-1/5 rounded-md flex flex-col items-center py-1.5 gap-1" style={surface}>
            <div className={`${dot} rounded-full`} style={accentBg} />
            <div className={`${dot} rounded-full`} style={mutedBg} />
            <div className={`${dot} rounded-full`} style={mutedBg} />
          </div>
          <div className="flex-1 flex flex-col gap-1">
            <div className={`${tile} rounded-md`} style={accentBg} />
            <div className="flex-1 rounded-md" style={surface} />
          </div>
        </div>
      );

    case 'sunset':
      // Two-row warm tabs with cards
      return (
        <div className="h-full w-full flex flex-col gap-1.5">
          <div className={`flex ${gap}`}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={`flex-1 ${tile} rounded-full`} style={i === 1 ? accentBg : surface} />
            ))}
          </div>
          <div className={`grid grid-cols-4 ${gap} flex-1`}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-md" style={i % 3 === 0 ? accent2Bg : surface} />
            ))}
          </div>
        </div>
      );

    case 'forest':
      // Vertical accordion list
      return (
        <div className={`h-full w-full flex flex-col ${gap}`}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex-1 rounded-md flex items-center px-2" style={i === 0 ? accentBg : surface}>
              <div className={`${dot} rounded-full mr-1`} style={i === 0 ? { background: theme.text } : accentBg} />
              <div className={`h-1 flex-1 rounded`} style={i === 0 ? { background: theme.text, opacity: 0.4 } : mutedBg} />
            </div>
          ))}
        </div>
      );

    case 'royal':
      // 3D card stack centered
      return (
        <div className="h-full w-full relative flex items-center justify-center">
          <div className="absolute w-3/5 h-3/5 rounded-xl rotate-6" style={{ ...surface, opacity: 0.5 }} />
          <div className="absolute w-3/5 h-3/5 rounded-xl -rotate-3" style={{ ...surface, opacity: 0.7 }} />
          <div className="relative w-3/5 h-3/5 rounded-xl flex flex-col gap-1 p-2" style={accentBg}>
            <div className="h-1 w-1/2 rounded" style={{ background: theme.text, opacity: 0.6 }} />
            <div className="h-1 w-1/3 rounded" style={{ background: theme.text, opacity: 0.4 }} />
          </div>
        </div>
      );

    case 'crimson':
      // Pill drawer bottom + grid
      return (
        <div className="h-full w-full flex flex-col gap-1.5">
          <div className={`grid grid-cols-3 ${gap} flex-1`}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-md" style={surface} />
            ))}
          </div>
          <div className={`flex ${gap} justify-center`}>
            <div className={`${tile} px-3 rounded-full flex-1 max-w-[70%]`} style={accentBg} />
          </div>
        </div>
      );

    case 'mono':
      // Minimal monochrome list
      return (
        <div className={`h-full w-full flex flex-col ${gap}`}>
          <div className={`${tile} rounded-sm w-1/3`} style={accentBg} />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <div className={`${dot} rounded-sm`} style={accentBg} />
              <div className="h-1 flex-1 rounded-sm" style={mutedBg} />
            </div>
          ))}
        </div>
      );

    case 'ocean':
      // Two-tier tabs with category cards
      return (
        <div className="h-full w-full flex flex-col gap-1.5">
          <div className={`flex ${gap}`}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={`flex-1 ${tile} rounded-md`} style={i === 0 ? accentBg : surface} />
            ))}
          </div>
          <div className={`flex ${gap}`}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={`flex-1 ${tile} rounded-md`} style={surface} />
            ))}
          </div>
          <div className={`grid grid-cols-2 ${gap} flex-1`}>
            <div className="rounded-md" style={accent2Bg} />
            <div className="rounded-md" style={surface} />
          </div>
        </div>
      );

    case 'candy':
      // Colorful card grid
      return (
        <div className={`h-full w-full grid grid-cols-3 grid-rows-2 ${gap}`}>
          <div className="rounded-md" style={accentBg} />
          <div className="rounded-md" style={surface} />
          <div className="rounded-md" style={accent2Bg} />
          <div className="rounded-md" style={accent2Bg} />
          <div className="rounded-md" style={accentBg} />
          <div className="rounded-md" style={surface} />
        </div>
      );

    case 'platinum':
      // Light theme, clean horizontal tabs + table
      return (
        <div className="h-full w-full flex flex-col gap-1.5">
          <div className={`flex ${gap} items-center`}>
            <div className={`${tile} w-1/4 rounded-md`} style={accentBg} />
            <div className={`${tile} flex-1 rounded-md`} style={surface} />
          </div>
          <div className={`flex-1 rounded-md ${gap} p-1.5 flex flex-col gap-1`} style={surface}>
            <div className="h-1 w-full rounded" style={mutedBg} />
            <div className="h-1 w-5/6 rounded" style={mutedBg} />
            <div className="h-1 w-2/3 rounded" style={mutedBg} />
            <div className="h-1 w-3/4 rounded" style={mutedBg} />
          </div>
        </div>
      );
  }
}
