/**
 * A miniature Point of Sale layout preview used in the App Theme selector.
 * Renders a tiny dummy New Order screen that mirrors the live layout 1:1,
 * including header, sidebar, category pills, product grid, and cart panel.
 */
const POSThemePreview = ({
  variant,
  isSelected,
  onClick,
}: {
  variant: 'dark' | 'light';
  isSelected: boolean;
  onClick: () => void;
}) => {
  const isDark = variant === 'dark';

  // Palette modelled on the actual New Order screen
  const bg = isDark ? '#0f0f10' : '#f4f4f5';
  const headerBg = isDark ? '#1a1a1a' : '#1a1a1a'; // header is dark in both modes
  const sidebarBg = isDark ? '#141416' : '#1c1c1f';
  const mainBg = isDark ? '#131316' : '#ffffff';
  const cartBg = isDark ? '#141416' : '#f7f7f8';
  const cardBg = isDark ? '#1f2937' : '#ffffff';
  const cardBorder = isDark ? 'transparent' : '#e5e7eb';
  const divider = isDark ? '#27272a' : '#e5e7eb';
  const textOnDark = '#ffffff';
  const mutedOnDark = isDark ? '#a1a1aa' : '#6b7280';
  const mutedOnLight = isDark ? '#a1a1aa' : '#6b7280';
  const subPillBorder = isDark ? '#3f3f46' : '#d4d4d8';
  const accent = '#f97316'; // primary (orange)

  // Category pill stroke colors, mirroring the live New Order screen
  const catColors = [
    '#22d3ee', // Starters (active, filled)
    '#f97316', // Mains
    '#22d3ee', // Sides
    '#eab308', // Desserts
    '#22c55e', // Drinks
    '#d946ef', // Specials
    '#e5e7eb', // Platters
    '#3b82f6', // Combos
  ];

  // Reusable tiny pill
  const Pill = ({
    color,
    filled = false,
    w,
    h = 6,
  }: {
    color: string;
    filled?: boolean;
    w: number;
    h?: number;
  }) => (
    <div
      style={{
        width: w,
        height: h,
        borderRadius: 999,
        background: filled ? color : 'transparent',
        border: `0.6px solid ${color}`,
        flexShrink: 0,
      }}
    />
  );

  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 active:opacity-70 transition-opacity w-full"
    >
      {/* Preview Card */}
      <div
        className={`w-full aspect-[16/9] rounded-2xl overflow-hidden border-2 ${
          isSelected ? 'border-foreground' : 'border-transparent'
        }`}
        style={{ background: bg }}
      >
        <div className="w-full h-full flex flex-col" style={{ fontSize: 0 }}>
          {/* ===== Top header bar ===== */}
          <div
            className="flex items-center justify-between px-[3px]"
            style={{ background: headerBg, height: '9%', minHeight: 10 }}
          >
            <div className="flex items-center gap-[2px]">
              {/* back arrow */}
              <div style={{ width: 3, height: 3, background: mutedOnDark, borderRadius: 0.5 }} />
              {/* avatar */}
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#3f3f46' }} />
              {/* name */}
              <div style={{ width: 14, height: 2, background: textOnDark, borderRadius: 0.5 }} />
              {/* role chip */}
              <div
                style={{
                  width: 8,
                  height: 3,
                  background: 'transparent',
                  border: `0.5px solid ${mutedOnDark}`,
                  borderRadius: 1,
                }}
              />
              {/* shift info */}
              <div style={{ width: 18, height: 2, background: mutedOnDark, borderRadius: 0.5, marginLeft: 2 }} />
            </div>
            <div className="flex items-center gap-[2px]">
              {/* right side icons */}
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  style={{ width: 4, height: 4, borderRadius: '50%', background: i === 4 ? accent : '#3f3f46' }}
                />
              ))}
              <div style={{ width: 8, height: 2, background: textOnDark, borderRadius: 0.5, marginLeft: 1 }} />
            </div>
          </div>

          {/* ===== Body ===== */}
          <div className="flex-1 flex min-w-0 min-h-0">
            {/* ----- Left sidebar ----- */}
            <div
              className="flex flex-col items-center justify-between py-[3px]"
              style={{ background: sidebarBg, width: '5%', minWidth: 12 }}
            >
              <div className="flex flex-col items-center gap-[3px]">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: i === 2 ? 1.5 : 1,
                      background: i === 3 ? accent : (isDark ? '#3f3f46' : '#52525b'),
                      border: i === 3 ? `0.5px solid ${accent}` : 'none',
                      opacity: i === 3 ? 1 : 0.7,
                    }}
                  />
                ))}
              </div>
              {/* version label */}
              <div style={{ width: 6, height: 4, borderRadius: '50%', background: '#3f3f46' }} />
            </div>

            {/* ----- Main content ----- */}
            <div className="flex-1 flex flex-col min-w-0" style={{ background: mainBg }}>
              {/* Category pills row */}
              <div className="flex items-center gap-[2px] px-[3px] pt-[3px]">
                {/* hamburger circle */}
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: isDark ? '#27272a' : '#e5e7eb',
                    flexShrink: 0,
                  }}
                />
                {catColors.map((color, i) => (
                  <Pill key={i} color={color} filled={i === 0} w={i === 0 ? 16 : 13} h={6} />
                ))}
                <div style={{ flex: 1 }} />
                {/* search circle */}
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: isDark ? '#27272a' : '#e5e7eb',
                    flexShrink: 0,
                  }}
                />
              </div>

              {/* Sub-category row */}
              <div className="flex items-center gap-[2px] px-[3px] pt-[2px]">
                <div style={{ width: 6, flexShrink: 0 }} />
                <Pill color={accent} w={11} h={5} />
                <Pill color={subPillBorder} w={12} h={5} />
              </div>

              {/* Divider */}
              <div style={{ height: 0.5, background: divider, margin: '3px 4px 0' }} />

              {/* Product grid 4 cols */}
              <div className="flex-1 px-[3px] pt-[2px] overflow-hidden">
                <div
                  className="grid gap-[2px]"
                  style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}
                >
                  {[...Array(13)].map((_, i) => {
                    const hasBadge = i === 1 || i === 5;
                    return (
                      <div
                        key={i}
                        className="flex items-center"
                        style={{
                          background: cardBg,
                          border: `0.5px solid ${cardBorder}`,
                          height: 10,
                          borderRadius: 2,
                          padding: '0 1px 0 2px',
                          gap: 1,
                        }}
                      >
                        {/* product name lines */}
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          <div
                            style={{
                              height: 1.5,
                              background: isDark ? '#d4d4d8' : '#3f3f46',
                              borderRadius: 0.5,
                              width: '80%',
                            }}
                          />
                          {i % 3 === 0 && (
                            <div
                              style={{
                                height: 1.5,
                                background: isDark ? '#d4d4d8' : '#3f3f46',
                                borderRadius: 0.5,
                                width: '45%',
                              }}
                            />
                          )}
                        </div>
                        {/* optional badge */}
                        {hasBadge && (
                          <div
                            style={{
                              width: 4,
                              height: 4,
                              borderRadius: '50%',
                              background: accent,
                              flexShrink: 0,
                            }}
                          />
                        )}
                        {/* price */}
                        <div
                          style={{
                            width: 7,
                            height: 1.5,
                            background: isDark ? '#d4d4d8' : '#3f3f46',
                            borderRadius: 0.5,
                            flexShrink: 0,
                          }}
                        />
                        {/* + button */}
                        <div
                          style={{
                            width: 8,
                            height: 8,
                            background: accent,
                            borderRadius: 1.5,
                            flexShrink: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <div
                            style={{
                              position: 'relative',
                              width: 4,
                              height: 4,
                            }}
                          >
                            <div
                              style={{
                                position: 'absolute',
                                left: 0,
                                top: '45%',
                                width: '100%',
                                height: 0.8,
                                background: '#fff',
                                borderRadius: 0.5,
                              }}
                            />
                            <div
                              style={{
                                position: 'absolute',
                                top: 0,
                                left: '45%',
                                width: 0.8,
                                height: '100%',
                                background: '#fff',
                                borderRadius: 0.5,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ----- Right cart panel ----- */}
            <div
              className="flex flex-col"
              style={{
                background: cartBg,
                width: '26%',
                borderLeft: `0.5px solid ${divider}`,
              }}
            >
              {/* Guest header */}
              <div className="flex items-center justify-between px-[2px] pt-[3px]">
                <div style={{ width: 14, height: 2, background: mutedOnLight, borderRadius: 0.5 }} />
                <div style={{ width: 12, height: 2, background: mutedOnLight, borderRadius: 0.5 }} />
              </div>

              {/* Action buttons row */}
              <div className="flex gap-[1px] px-[2px] mt-[2px]">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      height: 4,
                      background: isDark ? '#1f1f23' : '#e5e7eb',
                      borderRadius: 1,
                    }}
                  />
                ))}
                <div
                  style={{
                    width: 3,
                    height: 4,
                    background: isDark ? '#1f1f23' : '#e5e7eb',
                    borderRadius: 1,
                  }}
                />
              </div>

              {/* DINE IN + name */}
              <div className="flex items-center justify-between px-[2px] mt-[3px]">
                <div
                  style={{
                    width: 14,
                    height: 4,
                    background: isDark ? '#1f1f23' : '#e5e7eb',
                    borderRadius: 1,
                  }}
                />
                <div style={{ width: 12, height: 2, background: mutedOnLight, borderRadius: 0.5 }} />
              </div>

              {/* Divider */}
              <div style={{ height: 0.5, background: divider, margin: '3px 2px 0' }} />

              {/* Empty state */}
              <div className="flex-1 flex flex-col items-center justify-center gap-[3px]">
                <div
                  style={{
                    width: 14,
                    height: 10,
                    background: 'transparent',
                    border: `0.7px solid ${mutedOnDark}`,
                    borderRadius: 1.5,
                  }}
                />
                <div style={{ width: 26, height: 2, background: mutedOnLight, borderRadius: 0.5 }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Theme label */}
      <span className="text-sm font-medium text-foreground capitalize">{variant}</span>

      {/* Radio indicator */}
      <div
        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
          isSelected
            ? 'border-primary bg-primary'
            : 'border-neutral-500 bg-transparent'
        }`}
      >
        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-background" />}
      </div>
    </button>
  );
};

export default POSThemePreview;
