/**
 * A miniature Point of Sale layout preview used in the App Theme selector.
 * Renders a tiny dummy Point of Sale screen matching the actual New Order screen layout.
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

  const bg = isDark ? '#1a1a1a' : '#f5f5f5';
  const sidebarBg = isDark ? '#111111' : '#e8e8e8';
  const headerBg = '#212121';
  const cartBg = isDark ? '#1e1e1e' : '#f0f0f0';
  const cardBg = isDark ? '#2a2a2a' : '#ffffff';
  const accent = '#f97316';
  const textMuted = isDark ? '#555' : '#999';
  const divider = isDark ? '#333' : '#ddd';
  const pillBorder = isDark ? '#555' : '#aaa';
  const subPillBg = isDark ? '#2a2a2a' : '#e5e5e5';

  // Category pill border colors
  const catColors = ['#f97316', '#ec4899', '#8b5cf6', '#3b82f6', '#14b8a6', '#eab308'];

  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 active:opacity-70 transition-opacity"
    >
      {/* Preview Card */}
      <div
        className={`w-full aspect-[5/4] rounded-2xl overflow-hidden border-2 ${
          isSelected ? 'border-foreground' : 'border-transparent'
        }`}
        style={{ background: bg }}
      >
        <div className="w-full h-full flex" style={{ fontSize: 0 }}>
          {/* Left sidebar icons */}
          <div
            className="flex flex-col items-center pt-[6px] gap-[6px]"
            style={{ background: sidebarBg, width: '6%' }}
          >
            {[...Array(7)].map((_, i) => (
              <div
                key={i}
                className="rounded-[1px]"
                style={{
                  width: 5,
                  height: 5,
                  background: i === 0 ? accent : (isDark ? '#444' : '#bbb'),
                  borderRadius: '50%',
                }}
              />
            ))}
          </div>

          {/* Main content area */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {/* Top header bar with category pills */}
            <div
              className="flex items-center gap-[2px] px-[3px]"
              style={{ background: headerBg, height: '10%', minHeight: 8 }}
            >
              {/* Active pill (filled) */}
              <div
                className="rounded-full"
                style={{ background: accent, width: 10, height: 4 }}
              />
              {/* Inactive pills (outlined) */}
              {catColors.slice(1, 4).map((_, i) => (
                <div
                  key={i}
                  className="rounded-full"
                  style={{
                    border: `0.5px solid ${pillBorder}`,
                    width: 9,
                    height: 4,
                  }}
                />
              ))}
            </div>

            {/* Subcategory rows - 3 rows like reference */}
            <div className="flex flex-col gap-[1px] px-[3px] py-[2px]" style={{ background: isDark ? '#1a1a1a' : '#f5f5f5' }}>
              {/* Row 1 - colored border pills */}
              <div className="flex gap-[1px]">
                {catColors.map((color, i) => (
                  <div
                    key={i}
                    className="rounded-full"
                    style={{
                      border: `0.5px solid ${color}`,
                      background: i === 0 ? `${color}22` : 'transparent',
                      width: 9,
                      height: 3,
                    }}
                  />
                ))}
              </div>
              {/* Row 2 - plain pills */}
              <div className="flex gap-[1px]">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="rounded-full"
                    style={{
                      background: 'transparent',
                      border: `0.5px solid ${pillBorder}`,
                      width: i === 0 ? 11 : 8,
                      height: 3,
                    }}
                  />
                ))}
              </div>
              {/* Row 3 - more pills */}
              <div className="flex gap-[1px]">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="rounded-full"
                    style={{
                      background: 'transparent',
                      border: `0.5px solid ${pillBorder}`,
                      width: 9,
                      height: 3,
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Product cards grid - 3 columns like reference */}
            <div className="flex-1 px-[3px] py-[1px] overflow-hidden">
              <div className="grid grid-cols-3 gap-[2px]">
                {[...Array(12)].map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between px-[2px]"
                    style={{
                      background: cardBg,
                      height: 7,
                      borderRadius: 1,
                    }}
                  >
                    <div
                      style={{
                        width: '55%',
                        height: 2,
                        background: isDark ? '#777' : '#999',
                        borderRadius: 0.5,
                      }}
                    />
                    <div
                      style={{
                        width: 4,
                        height: 4,
                        background: accent,
                        borderRadius: 0.5,
                        flexShrink: 0,
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right cart panel */}
          <div
            className="flex flex-col"
            style={{ background: cartBg, width: '28%', borderLeft: `0.5px solid ${divider}` }}
          >
            {/* Guest info bar */}
            <div className="px-[2px] pt-[2px]">
              <div style={{ height: 3, background: isDark ? '#333' : '#ddd', borderRadius: 1, width: '90%' }} />
            </div>

            {/* Action buttons row */}
            <div className="flex gap-[1px] px-[2px] mt-[2px]">
              {[...Array(4)].map((_, i) => (
                <div key={i} style={{ width: 7, height: 3, background: isDark ? '#333' : '#d4d4d4', borderRadius: 1 }} />
              ))}
            </div>

            {/* Dine in + table */}
            <div className="px-[2px] mt-[2px]">
              <div style={{ height: 4, background: isDark ? '#333' : '#e0e0e0', borderRadius: 1, width: '100%' }} />
            </div>

            {/* Order notes */}
            <div className="px-[2px] mt-[1px]">
              <div style={{ height: 3, background: isDark ? '#2a2a2a' : '#e8e8e8', borderRadius: 1 }} />
            </div>

            {/* Cart items */}
            <div className="flex-1 flex flex-col gap-[1px] px-[2px] mt-[2px] overflow-hidden">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center justify-between" style={{ height: 4 }}>
                  <div className="flex items-center gap-[1px]">
                    <div style={{ width: 3, height: 3, borderRadius: '50%', background: accent, flexShrink: 0 }} />
                    <div style={{ width: 12, height: 1.5, background: isDark ? '#777' : '#999', borderRadius: 0.5 }} />
                  </div>
                  <div style={{ width: 6, height: 1.5, background: isDark ? '#666' : '#888', borderRadius: 0.5 }} />
                </div>
              ))}
            </div>

            {/* Totals section */}
            <div className="px-[2px] mb-[1px]">
              <div style={{ borderTop: `0.5px solid ${divider}`, paddingTop: 1 }}>
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex justify-between mb-[0.5px]">
                    <div style={{ width: 8, height: 1.5, background: textMuted, borderRadius: 0.5 }} />
                    <div style={{ width: 5, height: 1.5, background: textMuted, borderRadius: 0.5 }} />
                  </div>
                ))}
              </div>
            </div>

            {/* Charge button */}
            <div className="px-[2px] pb-[2px]">
              <div style={{ height: 4, background: accent, borderRadius: 1, width: '100%' }} />
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
        {isSelected && (
          <div className="w-1.5 h-1.5 rounded-full bg-background" />
        )}
      </div>
    </button>
  );
};

export default POSThemePreview;
