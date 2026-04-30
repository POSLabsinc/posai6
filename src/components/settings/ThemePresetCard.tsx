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
 * Renders a stylized POS "New Order" preview unique per theme variant.
 * Every variant shows the real POS anatomy: header, categories, product grid, order panel + total.
 * The arrangement, density and accents differ per variant so each theme feels distinct.
 */
export default function ThemePresetCard({ theme, size = 'sm' }: Props) {
  const style: CSSProperties = { background: theme.bg, color: theme.text };
  return (
    <div className={`relative w-full aspect-[16/10] rounded-xl overflow-hidden`} style={style}>
      {renderVariant(theme, size)}
    </div>
  );
}

function renderVariant(theme: ThemeStyle, size: 'sm' | 'lg') {
  const lg = size === 'lg';
  // Shared style helpers
  const surface: CSSProperties = { background: theme.surface };
  const accentBg: CSSProperties = { background: theme.accent };
  const accent2Bg: CSSProperties = { background: theme.accent2 };
  const muted: CSSProperties = { background: theme.muted };
  const textSoft = { background: theme.text, opacity: 0.55 };
  const textFaint = { background: theme.text, opacity: 0.25 };

  const pad = lg ? 'p-3' : 'p-1.5';
  const gap = lg ? 'gap-2' : 'gap-1';
  const radius = lg ? 'rounded-lg' : 'rounded-md';
  const radiusSm = lg ? 'rounded-md' : 'rounded-[3px]';
  const barH = lg ? 'h-2' : 'h-[5px]';
  const lineH = lg ? 'h-1.5' : 'h-[3px]';
  const tabH = lg ? 'h-5' : 'h-2.5';
  const dot = lg ? 'w-1.5 h-1.5' : 'w-[3px] h-[3px]';

  // Reusable building blocks
  const TopBar = ({ accentTab = 0, tabs = 4 }: { accentTab?: number; tabs?: number }) => (
    <div className={`flex ${gap} items-center`}>
      <div className={`${dot} rounded-full`} style={accentBg} />
      <div className={`${dot} rounded-full`} style={muted} />
      <div className={`${dot} rounded-full`} style={muted} />
      <div className="flex-1" />
      {Array.from({ length: tabs }).map((_, i) => (
        <div key={i} className={`${tabH} ${radiusSm}`} style={{ width: lg ? 22 : 12, ...(i === accentTab ? accentBg : surface) }} />
      ))}
    </div>
  );

  const CategoryStrip = ({ active = 0, count = 5, pill = false }: { active?: number; count?: number; pill?: boolean }) => (
    <div className={`flex ${gap}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`flex-1 ${tabH} ${pill ? 'rounded-full' : radiusSm}`}
          style={i === active ? accentBg : surface}
        />
      ))}
    </div>
  );

  const ProductTile = ({ accent = false, accent2 = false }: { accent?: boolean; accent2?: boolean }) => (
    <div className={`${radius} flex flex-col justify-between ${lg ? 'p-1.5' : 'p-1'}`} style={accent ? accentBg : accent2 ? accent2Bg : surface}>
      <div className={`${lineH} w-2/3 rounded-sm`} style={accent || accent2 ? textFaint : textSoft} />
      <div className={`${lineH} w-1/3 rounded-sm`} style={accent || accent2 ? textFaint : textFaint} />
    </div>
  );

  const OrderLine = ({ accent = false }: { accent?: boolean }) => (
    <div className={`flex items-center ${gap}`}>
      <div className={`${dot} rounded-sm`} style={accent ? accentBg : muted} />
      <div className={`${lineH} flex-1 rounded-sm`} style={textSoft} />
      <div className={`${lineH} rounded-sm`} style={{ width: lg ? 14 : 8, ...textFaint }} />
    </div>
  );

  const TotalBar = ({ rounded = 'md', full = false }: { rounded?: 'md' | 'full'; full?: boolean }) => (
    <div
      className={`${tabH} ${rounded === 'full' ? 'rounded-full' : radiusSm} ${full ? 'w-full' : ''} flex items-center justify-between ${lg ? 'px-2' : 'px-1'}`}
      style={accentBg}
    >
      <div className={`${lineH} rounded-sm`} style={{ width: lg ? 16 : 8, ...textFaint }} />
      <div className={`${lineH} rounded-sm`} style={{ width: lg ? 12 : 6, ...textFaint }} />
    </div>
  );

  switch (theme.variant) {
    case 'aurora':
      // Glassy floating panels: tabs top, product grid left, glass order card right with gradient total
      return (
        <div className={`h-full w-full ${pad} flex flex-col ${gap}`}>
          <TopBar tabs={4} accentTab={0} />
          <div className={`flex ${gap} flex-1`}>
            <div className={`flex-1 flex flex-col ${gap}`}>
              <CategoryStrip count={4} pill />
              <div className={`grid grid-cols-3 ${gap} flex-1`}>
                <ProductTile />
                <ProductTile accent2 />
                <ProductTile />
                <ProductTile />
                <ProductTile />
                <ProductTile accent />
              </div>
            </div>
            <div className={`${lg ? 'w-[34%]' : 'w-[36%]'} ${radius} ${pad} flex flex-col ${gap}`} style={surface}>
              <div className={`${lineH} w-1/2 rounded-sm`} style={textSoft} />
              <OrderLine accent />
              <OrderLine />
              <OrderLine />
              <div className="flex-1" />
              <div
                className={`${tabH} ${radiusSm}`}
                style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})` }}
              />
            </div>
          </div>
        </div>
      );

    case 'midnight':
      // Operator dark layout: vertical icon rail, dense product grid, narrow order column with sticky total
      return (
        <div className={`h-full w-full ${pad} flex ${gap}`}>
          <div className={`${lg ? 'w-6' : 'w-3'} ${radius} flex flex-col items-center ${lg ? 'py-2 gap-1.5' : 'py-1 gap-1'}`} style={surface}>
            <div className={`${dot} rounded`} style={accentBg} />
            <div className={`${dot} rounded`} style={muted} />
            <div className={`${dot} rounded`} style={muted} />
            <div className={`${dot} rounded`} style={muted} />
          </div>
          <div className={`flex-1 flex flex-col ${gap}`}>
            <TopBar tabs={3} />
            <CategoryStrip count={6} active={1} />
            <div className={`grid grid-cols-4 ${gap} flex-1`}>
              {Array.from({ length: 8 }).map((_, i) => (
                <ProductTile key={i} accent={i === 2} />
              ))}
            </div>
          </div>
          <div className={`${lg ? 'w-[30%]' : 'w-[32%]'} flex flex-col ${gap}`}>
            <div className={`${radius} ${pad} flex-1 flex flex-col ${gap}`} style={surface}>
              <div className={`${lineH} w-2/3 rounded-sm`} style={textSoft} />
              <OrderLine />
              <OrderLine accent />
              <OrderLine />
              <OrderLine />
            </div>
            <TotalBar />
          </div>
        </div>
      );

    case 'sunset':
      // Warm bistro: rounded pill categories, two-column product cards, bottom order strip with total
      return (
        <div className={`h-full w-full ${pad} flex flex-col ${gap}`}>
          <TopBar tabs={3} />
          <CategoryStrip count={5} active={2} pill />
          <div className={`flex ${gap} flex-1`}>
            <div className={`flex-1 grid grid-cols-2 ${gap}`}>
              <ProductTile accent />
              <ProductTile />
              <ProductTile />
              <ProductTile accent2 />
            </div>
            <div className={`${lg ? 'w-[34%]' : 'w-[36%]'} ${radius} ${pad} flex flex-col ${gap}`} style={surface}>
              <OrderLine accent />
              <OrderLine />
              <OrderLine />
              <div className="flex-1" />
              <TotalBar rounded="full" />
            </div>
          </div>
        </div>
      );

    case 'forest':
      // Calm accordion order list left, single accent product preview right
      return (
        <div className={`h-full w-full ${pad} flex flex-col ${gap}`}>
          <TopBar tabs={3} />
          <div className={`flex ${gap} flex-1`}>
            <div className={`flex-1 flex flex-col ${gap}`}>
              <CategoryStrip count={4} active={0} />
              <div className={`flex-1 flex flex-col ${gap}`}>
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className={`flex-1 ${radius} flex items-center ${lg ? 'px-2 gap-2' : 'px-1 gap-1'}`}
                    style={i === 0 ? accentBg : surface}
                  >
                    <div className={`${dot} rounded-full`} style={i === 0 ? textFaint : accentBg} />
                    <div className={`${lineH} flex-1 rounded-sm`} style={i === 0 ? textFaint : textSoft} />
                    <div className={`${lineH} rounded-sm`} style={{ width: lg ? 14 : 8, ...(i === 0 ? textFaint : textFaint) }} />
                  </div>
                ))}
              </div>
            </div>
            <div className={`${lg ? 'w-[32%]' : 'w-[34%]'} ${radius} flex flex-col ${gap} ${pad}`} style={surface}>
              <div className={`flex-1 ${radiusSm}`} style={accent2Bg} />
              <TotalBar />
            </div>
          </div>
        </div>
      );

    case 'royal':
      // Premium velvet: large hero product card, side order list with elegant total chip
      return (
        <div className={`h-full w-full ${pad} flex flex-col ${gap}`}>
          <TopBar tabs={4} accentTab={1} />
          <div className={`flex ${gap} flex-1`}>
            <div className={`flex-1 flex flex-col ${gap}`}>
              <div className={`flex-1 ${radius} ${pad} flex flex-col justify-between`} style={accentBg}>
                <div className={`${lineH} w-1/2 rounded-sm`} style={textFaint} />
                <div className="flex justify-between items-end">
                  <div className={`${lineH} w-1/3 rounded-sm`} style={textFaint} />
                  <div className={`${tabH} ${radiusSm}`} style={{ width: lg ? 24 : 14, ...accent2Bg }} />
                </div>
              </div>
              <div className={`grid grid-cols-3 ${gap}`}>
                <ProductTile />
                <ProductTile />
                <ProductTile accent2 />
              </div>
            </div>
            <div className={`${lg ? 'w-[34%]' : 'w-[36%]'} ${radius} ${pad} flex flex-col ${gap}`} style={surface}>
              <OrderLine />
              <OrderLine accent />
              <OrderLine />
              <div className="flex-1" />
              <TotalBar rounded="full" />
            </div>
          </div>
        </div>
      );

    case 'crimson':
      // Express ordering: huge product grid, slim bottom action bar with prominent pay button
      return (
        <div className={`h-full w-full ${pad} flex flex-col ${gap}`}>
          <TopBar tabs={3} />
          <CategoryStrip count={5} active={3} />
          <div className={`grid grid-cols-4 ${gap} flex-1`}>
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductTile key={i} accent={i === 0} accent2={i === 5} />
            ))}
          </div>
          <div className={`flex ${gap}`}>
            <div className={`flex-1 ${tabH} ${radiusSm}`} style={surface} />
            <div className={`${tabH} ${radiusSm} ${lg ? 'px-3' : 'px-1'}`} style={{ ...accentBg, width: lg ? 80 : 44 }} />
          </div>
        </div>
      );

    case 'mono':
      // Minimal monochrome: typographic order ticket left, sparse product list right
      return (
        <div className={`h-full w-full ${pad} flex ${gap}`}>
          <div className={`flex-1 flex flex-col ${gap}`}>
            <div className={`${lineH} w-1/3 rounded-sm`} style={accentBg} />
            <div className={`${lineH} w-1/2 rounded-sm`} style={textFaint} />
            <div className={`flex-1 flex flex-col ${gap} ${lg ? 'mt-1' : ''}`}>
              <OrderLine />
              <OrderLine />
              <OrderLine accent />
              <OrderLine />
            </div>
            <div className={`${barH} w-full rounded-sm`} style={{ background: theme.text }} />
          </div>
          <div className={`${lg ? 'w-[40%]' : 'w-[42%]'} flex flex-col ${gap}`}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={`flex-1 ${radiusSm} flex items-center ${lg ? 'px-2 gap-2' : 'px-1 gap-1'}`} style={surface}>
                <div className={`${lineH} flex-1 rounded-sm`} style={textSoft} />
                <div className={`${dot} rounded-sm`} style={accentBg} />
              </div>
            ))}
          </div>
        </div>
      );

    case 'ocean':
      // Layered tabs: primary tabs + secondary chips, split product/order with cool accent total
      return (
        <div className={`h-full w-full ${pad} flex flex-col ${gap}`}>
          <TopBar tabs={4} />
          <CategoryStrip count={4} active={0} />
          <CategoryStrip count={6} active={2} pill />
          <div className={`flex ${gap} flex-1`}>
            <div className={`flex-1 grid grid-cols-3 ${gap}`}>
              <ProductTile />
              <ProductTile accent2 />
              <ProductTile />
              <ProductTile />
              <ProductTile />
              <ProductTile accent />
            </div>
            <div className={`${lg ? 'w-[30%]' : 'w-[32%]'} ${radius} ${pad} flex flex-col ${gap}`} style={surface}>
              <OrderLine />
              <OrderLine accent />
              <div className="flex-1" />
              <TotalBar />
            </div>
          </div>
        </div>
      );

    case 'candy':
      // Playful: colorful tile mosaic on left, vertical order card right with bold pay button
      return (
        <div className={`h-full w-full ${pad} flex ${gap}`}>
          <div className={`flex-1 flex flex-col ${gap}`}>
            <CategoryStrip count={4} active={1} pill />
            <div className={`grid grid-cols-3 grid-rows-2 ${gap} flex-1`}>
              <ProductTile accent />
              <ProductTile />
              <ProductTile accent2 />
              <ProductTile accent2 />
              <ProductTile accent />
              <ProductTile />
            </div>
          </div>
          <div className={`${lg ? 'w-[34%]' : 'w-[36%]'} ${radius} ${pad} flex flex-col ${gap}`} style={surface}>
            <div className={`${lineH} w-2/3 rounded-sm`} style={textSoft} />
            <OrderLine accent />
            <OrderLine />
            <OrderLine accent />
            <div className="flex-1" />
            <TotalBar rounded="full" />
          </div>
        </div>
      );

    case 'platinum':
      // Light, clean: top toolbar, table-like order list, totals row at bottom
      return (
        <div className={`h-full w-full ${pad} flex flex-col ${gap}`}>
          <div className={`flex ${gap} items-center`}>
            <div className={`${tabH} ${radiusSm}`} style={{ width: lg ? 40 : 22, ...accentBg }} />
            <div className={`flex-1 ${tabH} ${radiusSm}`} style={surface} />
            <div className={`${tabH} ${radiusSm}`} style={{ width: lg ? 24 : 14, ...surface }} />
          </div>
          <CategoryStrip count={5} active={0} />
          <div className={`flex ${gap} flex-1`}>
            <div className={`flex-1 grid grid-cols-3 ${gap}`}>
              {Array.from({ length: 6 }).map((_, i) => (
                <ProductTile key={i} accent2={i === 4} />
              ))}
            </div>
            <div className={`${lg ? 'w-[34%]' : 'w-[36%]'} ${radius} ${pad} flex flex-col ${gap}`} style={surface}>
              <OrderLine />
              <OrderLine />
              <OrderLine accent />
              <OrderLine />
              <div className={`${lineH} w-full rounded-sm`} style={textFaint} />
              <TotalBar />
            </div>
          </div>
        </div>
      );
  }
}
