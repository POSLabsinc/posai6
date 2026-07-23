import { useState } from "react";
import { ChevronLeft, Check } from "lucide-react";

interface ReceiptsContentProps {
  showHeader?: boolean;
  onBack?: () => void;
  onAIClick?: () => void;
}

type TabId = "kot" | "payment-receipt" | "receipt" | "email-receipt" | "sms-receipt";
type StyleId = "classic-thermal" | "compact-service" | "guest-table" | "modern-bistro";
type FontStyle = "thermal" | "clean";
type FontSize = "s" | "m" | "l";

interface ChannelState {
  style: StyleId;
  showLogo: boolean;
  fontStyle: FontStyle;
  fontSize: FontSize;
}

const TABS: { id: TabId; label: string; helper: string }[] = [
  { id: "kot", label: "KOT", helper: "Shows what prints in the kitchen for each order." },
  { id: "payment-receipt", label: "Payment Receipt", helper: "Shown to guests right after a card or cash payment is completed." },
  { id: "receipt", label: "Receipt", helper: "The full guest bill used for dine in and takeaway." },
  { id: "email-receipt", label: "Email Receipt", helper: "Used when a receipt is emailed to a guest." },
  { id: "sms-receipt", label: "SMS Receipt", helper: "Used when a receipt is sent to a guest by text message." },
];

const STYLES: { id: StyleId; label: string }[] = [
  { id: "classic-thermal", label: "Classic Thermal" },
  { id: "compact-service", label: "Compact Service" },
  { id: "guest-table", label: "Guest Table" },
  { id: "modern-bistro", label: "Modern Bistro" },
];

const DEFAULT_CHANNEL: ChannelState = {
  style: "classic-thermal",
  showLogo: true,
  fontStyle: "thermal",
  fontSize: "m",
};

const fontSizePx: Record<FontSize, number> = { s: 11, m: 13, l: 15 };

const ReceiptsContent = ({ showHeader = true, onBack }: ReceiptsContentProps) => {
  const [activeTab, setActiveTab] = useState<TabId>("kot");
  const [channels, setChannels] = useState<Record<TabId, ChannelState>>({
    "kot": { ...DEFAULT_CHANNEL },
    "payment-receipt": { ...DEFAULT_CHANNEL },
    "receipt": { ...DEFAULT_CHANNEL },
    "email-receipt": { ...DEFAULT_CHANNEL },
    "sms-receipt": { ...DEFAULT_CHANNEL },
  });

  const current = channels[activeTab];
  const activeTabMeta = TABS.find((t) => t.id === activeTab)!;

  const updateChannel = (patch: Partial<ChannelState>) => {
    setChannels((prev) => ({ ...prev, [activeTab]: { ...prev[activeTab], ...patch } }));
  };

  const renderPreview = () => {
    const fontFamily = current.fontStyle === "thermal"
      ? '"SFMono-Regular", ui-monospace, Menlo, Consolas, monospace'
      : '"Inter", system-ui, -apple-system, sans-serif';
    const baseSize = fontSizePx[current.fontSize];

    const items = [
      { name: "Margherita Pizza", qty: 1 },
      { name: "Caesar Salad", qty: 2 },
      { name: "Sparkling Water", qty: 1 },
    ];

    const showDeviceLines = current.style === "classic-thermal";
    const showShortHeader = current.style === "compact-service";
    const isGuestTable = current.style === "guest-table";
    const isModern = current.style === "modern-bistro";
    const showLogo = current.showLogo && !isGuestTable;
    const lineGap = isModern ? 10 : 4;
    const totalScale = isModern ? 1.35 : 1;

    return (
      <div
        className="bg-white text-black rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.35)] p-6 w-full max-w-[320px]"
        style={{ fontFamily, fontSize: baseSize, lineHeight: 1.4 }}
      >
        {isGuestTable ? (
          <div className="text-center mb-3">
            <div style={{ fontSize: baseSize * 1.6, fontWeight: 700 }}>Order #1042 · Table 7</div>
            <div className="text-neutral-500" style={{ fontSize: baseSize * 0.9, marginTop: 2 }}>
              The Rustic Table
            </div>
          </div>
        ) : (
          <div className="text-center mb-3">
            {showLogo && (
              <div
                className="mx-auto mb-2 rounded-md bg-neutral-900 text-white flex items-center justify-center"
                style={{ width: 44, height: 44, fontSize: 10, letterSpacing: 1 }}
              >
                LOGO
              </div>
            )}
            <div style={{ fontWeight: 700 }}>The Rustic Table</div>
            {!showShortHeader && (
              <div className="text-neutral-500" style={{ fontSize: baseSize * 0.9 }}>
                123 Market St · (555) 010-2200
              </div>
            )}
            <div className="mt-2" style={{ fontWeight: 600 }}>Order #1042</div>
            <div style={{ fontSize: baseSize * 0.9 }}>Table 7</div>
            {showDeviceLines && (
              <div className="text-neutral-500 mt-1" style={{ fontSize: baseSize * 0.85 }}>
                <div>Device: Rustic Table POS 1</div>
                <div>Printer: Kitchen Printer 1</div>
              </div>
            )}
          </div>
        )}

        <div className="border-t border-dashed border-neutral-300 my-2" />

        <div style={{ display: "flex", flexDirection: "column", gap: lineGap }}>
          {items.map((it) => (
            <div key={it.name} className="flex justify-between">
              <span>{it.qty} × {it.name}</span>
            </div>
          ))}
        </div>

        <div className="border-t border-dashed border-neutral-300 my-2" />

        <div
          className="text-center"
          style={{
            fontWeight: isModern ? 800 : 600,
            fontSize: baseSize * totalScale,
            marginTop: isModern ? 8 : 4,
          }}
        >
          — FIRE NOW —
        </div>
      </div>
    );
  };

  return (
    <div className="h-full overflow-y-auto scrollbar-hide overscroll-contain">
      {showHeader && (
        <div className="flex items-center justify-between pt-0 pb-2 relative overflow-visible px-4">
          {onBack && (
            <button
              onClick={onBack}
              className="w-10 h-10 rounded-full bg-neutral-800/60 flex items-center justify-center active:opacity-70 transition-opacity"
            >
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>
          )}
          <h1 className="text-xl font-semibold text-foreground absolute left-1/2 -translate-x-1/2">Receipts</h1>
        </div>
      )}

      <div className="pt-0 px-4 md:px-6 pb-28">
        <div className="mb-4 px-1">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Choose a design for each receipt type. Printed receipts remain on Classic Thermal for now; email and SMS preferences are saved and will apply once available.
          </p>
        </div>

        {/* Tabs */}
        <div className="overflow-x-auto scrollbar-hide -mx-1 px-1">
          <div className="flex gap-2 min-w-max py-1">
            {TABS.map((t) => {
              const active = t.id === activeTab;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    active
                      ? "bg-primary text-primary-foreground"
                      : "bg-neutral-800/60 text-foreground/80 hover:bg-neutral-800"
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        <p className="text-xs text-muted-foreground mt-3 mb-5 px-1">{activeTabMeta.helper}</p>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6">
          {/* Controls */}
          <div className="space-y-6">
            {/* Style */}
            <section>
              <h2 className="text-sm font-semibold text-neutral-400 tracking-wider mb-2 px-1">Style</h2>
              <div className="grid grid-cols-2 gap-2">
                {STYLES.map((s) => {
                  const selected = current.style === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => updateChannel({ style: s.id })}
                      className={`flex items-center justify-between px-4 py-3 rounded-2xl border transition-colors ${
                        selected
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-neutral-700/60 bg-neutral-800/60 text-foreground/80 hover:bg-neutral-800"
                      }`}
                    >
                      <span className="text-sm font-medium">{s.label}</span>
                      {selected && <Check className="w-4 h-4 text-primary" />}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Logo toggle */}
            <section className="bg-neutral-800/60 rounded-2xl px-4 py-3.5 flex items-center justify-between">
              <div>
                <div className="text-foreground text-base font-medium">Show store logo</div>
                <div className="text-xs text-muted-foreground">Display your brand logo at the top of the receipt.</div>
              </div>
              <button
                onClick={() => updateChannel({ showLogo: !current.showLogo })}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  current.showLogo ? "bg-primary" : "bg-neutral-600"
                }`}
                aria-pressed={current.showLogo}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                    current.showLogo ? "translate-x-5" : ""
                  }`}
                />
              </button>
            </section>

            {/* Font style + size */}
            <section className="grid grid-cols-2 gap-3">
              <div>
                <h3 className="text-sm font-semibold text-neutral-400 tracking-wider mb-2 px-1">Font style</h3>
                <div className="flex gap-2">
                  {(["thermal", "clean"] as FontStyle[]).map((fs) => {
                    const active = current.fontStyle === fs;
                    return (
                      <button
                        key={fs}
                        onClick={() => updateChannel({ fontStyle: fs })}
                        className={`flex-1 px-4 py-2 rounded-full text-sm font-medium capitalize transition-colors ${
                          active
                            ? "bg-primary text-primary-foreground"
                            : "bg-neutral-800/60 text-foreground/80 hover:bg-neutral-800"
                        }`}
                      >
                        {fs === "thermal" ? "Thermal" : "Clean"}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-neutral-400 tracking-wider mb-2 px-1">Font size</h3>
                <div className="flex gap-2">
                  {(["s", "m", "l"] as FontSize[]).map((sz) => {
                    const active = current.fontSize === sz;
                    return (
                      <button
                        key={sz}
                        onClick={() => updateChannel({ fontSize: sz })}
                        className={`flex-1 px-4 py-2 rounded-full text-sm font-semibold uppercase transition-colors ${
                          active
                            ? "bg-primary text-primary-foreground"
                            : "bg-neutral-800/60 text-foreground/80 hover:bg-neutral-800"
                        }`}
                      >
                        {sz}
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>
          </div>

          {/* Live preview */}
          <div className="flex justify-center lg:justify-end">
            <div className="sticky top-4">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2 text-center">Live preview</div>
              {renderPreview()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiptsContent;
