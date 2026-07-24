import { useState } from "react";
import { ChevronLeft, Check } from "lucide-react";
import restaurantLogo from "@/assets/icons/restaurant-logo.png";

interface ReceiptsContentProps {
  showHeader?: boolean;
  onBack?: () => void;
  onAIClick?: () => void;
}

type TabId = "kot" | "payment-receipt" | "receipt" | "email-receipt" | "sms-receipt";
type StyleId = "classic-thermal" | "compact-service" | "guest-table" | "modern-bistro";
type FontStyle = "thermal" | "clean" | "serif" | "rounded";
type FontSize = "s" | "m" | "l";

interface ChannelState {
  style: StyleId;
  showLogo: boolean;
  blankSpaceTop: boolean;
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
  blankSpaceTop: false,
  fontStyle: "thermal",
  fontSize: "m",
};

const BLANK_SPACE_TOP_PX = 72;

const SUPPORTS_BLANK_SPACE: TabId[] = ["kot", "payment-receipt", "receipt"];


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
    const fontFamily =
      current.fontStyle === "thermal"
        ? '"SFMono-Regular", ui-monospace, Menlo, Consolas, monospace'
        : current.fontStyle === "serif"
        ? '"Georgia", "Times New Roman", serif'
        : current.fontStyle === "rounded"
        ? '"Nunito", "Quicksand", system-ui, sans-serif'
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

    const zigzag =
      "polygon(0 8px, 5% 0, 10% 8px, 15% 0, 20% 8px, 25% 0, 30% 8px, 35% 0, 40% 8px, 45% 0, 50% 8px, 55% 0, 60% 8px, 65% 0, 70% 8px, 75% 0, 80% 8px, 85% 0, 90% 8px, 95% 0, 100% 8px, 100% calc(100% - 8px), 95% 100%, 90% calc(100% - 8px), 85% 100%, 80% calc(100% - 8px), 75% 100%, 70% calc(100% - 8px), 65% 100%, 60% calc(100% - 8px), 55% 100%, 50% calc(100% - 8px), 45% 100%, 40% calc(100% - 8px), 35% 100%, 30% calc(100% - 8px), 25% 100%, 20% calc(100% - 8px), 15% 100%, 10% calc(100% - 8px), 5% 100%, 0 calc(100% - 8px))";

    return (
      <div className="w-full max-w-[300px] mx-auto">
        {/* Drop shadow wrapper (clip-path removes native shadow, so simulate it) */}
        <div
          className="relative"
          style={{
            filter: "drop-shadow(0 14px 24px rgba(0,0,0,0.45)) drop-shadow(0 2px 4px rgba(0,0,0,0.25))",
          }}
        >
          <div
            className="text-black"
            style={{
              fontFamily,
              fontSize: baseSize,
              lineHeight: 1.45,
              background:
                "repeating-linear-gradient(0deg, #fdfdfb 0px, #fdfdfb 2px, #f6f5f1 2px, #f6f5f1 3px), #fdfdfb",
              clipPath: zigzag,
              WebkitClipPath: zigzag,
              padding: "22px 20px 26px",
            }}
          >
            {isGuestTable ? (
              <div className="text-center mb-3 pt-2">
                <div style={{ fontSize: baseSize * 1.6, fontWeight: 700 }}>Order 1042 · Table 7</div>
                <div className="text-neutral-500" style={{ fontSize: baseSize * 0.9, marginTop: 2 }}>
                  The Rustic Table
                </div>
              </div>
            ) : (
              <div className="text-center mb-3 pt-2">
                {showLogo && (
                  <img
                    src={restaurantLogo}
                    alt="The Rustic Table logo"
                    className="mx-auto mb-2 object-contain"
                    style={{ width: 56, height: 56 }}
                  />
                )}
                <div style={{ fontWeight: 700, letterSpacing: 0.5 }}>THE RUSTIC TABLE</div>
                {!showShortHeader && (
                  <div className="text-neutral-500" style={{ fontSize: baseSize * 0.9 }}>
                    123 Market St · (555) 010-2200
                  </div>
                )}
                <div className="text-neutral-500" style={{ fontSize: baseSize * 0.85 }}>
                  Jul 23, 2026 · 7:14 PM
                </div>
                <div className="mt-2" style={{ fontWeight: 600 }}>Order 1042</div>
                <div style={{ fontSize: baseSize * 0.9 }}>Table 7 · Server: Alex</div>
                {showDeviceLines && (
                  <div className="text-neutral-500 mt-1" style={{ fontSize: baseSize * 0.85 }}>
                    <div>Device: Rustic Table POS 1</div>
                    <div>Printer: Kitchen Printer 1</div>
                  </div>
                )}
              </div>
            )}

            <div className="border-t border-dashed border-neutral-400 my-2" />

            <div style={{ display: "flex", flexDirection: "column", gap: lineGap }}>
              {items.map((it) => (
                <div key={it.name} className="flex justify-between">
                  <span style={{ fontWeight: 600 }}>{it.qty} ×</span>
                  <span className="flex-1 ml-2">{it.name}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-dashed border-neutral-400 my-2" />

            <div
              className="text-center"
              style={{
                fontWeight: isModern ? 800 : 700,
                fontSize: baseSize * totalScale,
                marginTop: isModern ? 8 : 4,
                letterSpacing: 1,
              }}
            >
              ★ FIRE NOW ★
            </div>

            <div
              className="text-center text-neutral-500 mt-3 leading-tight"
              style={{ fontSize: baseSize * 0.75 }}
            >
              Thank you
            </div>



            {/* Faux barcode */}
            <div className="flex justify-center gap-[2px] mt-3">
              {[2, 1, 3, 1, 2, 1, 1, 3, 2, 1, 2, 1, 3, 1, 2, 1, 2, 3, 1, 2, 1, 3, 1, 2].map((w, i) => (
                <div
                  key={i}
                  style={{
                    width: w,
                    height: 26,
                    background: "#111",
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderKotPreview = () => {
    const fontFamily =
      current.fontStyle === "thermal"
        ? '"SFMono-Regular", ui-monospace, Menlo, Consolas, monospace'
        : current.fontStyle === "serif"
        ? '"Georgia", "Times New Roman", serif'
        : current.fontStyle === "rounded"
        ? '"Nunito", "Quicksand", system-ui, sans-serif'
        : '"Inter", system-ui, -apple-system, sans-serif';
    const baseSize = fontSizePx[current.fontSize];

    type Mod = { text: string; kind: "add" | "remove" | "mod" };
    type Product = { course: string; name: string; qty: number; modifiers?: Mod[]; note?: string; allergens?: string[] };
    const products: Product[] = [
      { course: "APPETIZER", name: "Cheese Selection", qty: 1, modifiers: [{ text: "Extra crackers", kind: "add" }], allergens: ["DAIRY", "GLUTEN"] },
      { course: "ENTREE", name: "Meatballs", qty: 2, modifiers: [{ text: "Extra parmesan", kind: "add" }, { text: "No basil", kind: "remove" }], note: "One plate split for sharing" },
      { course: "ENTREE", name: "Filet Mignon", qty: 1, modifiers: [{ text: "Medium rare", kind: "mod" }], allergens: ["NUT"] },
      { course: "DESSERT", name: "Tiramisu", qty: 1 },
    ];
    const courseOrder = ["APPETIZER", "ENTREE", "DESSERT", "SIDES"];
    const grouped = products.reduce<Record<string, Product[]>>((acc, p) => {
      (acc[p.course] = acc[p.course] || []).push(p);
      return acc;
    }, {});
    const sortedCourses = courseOrder.filter((c) => grouped[c]);

    return (
      <div className="w-full max-w-[320px] mx-auto" style={{ fontFamily, fontSize: baseSize }}>
        <div
          className="rounded-lg overflow-hidden border bg-white text-[#2C3E50] border-neutral-200"
          style={{ boxShadow: "0 14px 24px rgba(0,0,0,0.35), 0 2px 4px rgba(0,0,0,0.2)" }}
        >
          {/* Header */}
          <div className="px-3 py-2 flex justify-between items-center bg-[#1A1A2E] text-white">
            <span className="inline-flex items-center h-5 px-2 rounded-full font-bold tracking-wide bg-white text-[#1A1A2E]" style={{ fontSize: baseSize * 0.78 }}>
              TABLE 4
            </span>
            <span className="font-semibold tracking-wide" style={{ fontSize: baseSize * 0.85 }}>DINE IN</span>
          </div>

          {/* Sub header */}
          <div className="px-3 py-1.5 flex justify-between border-b border-neutral-200" style={{ fontSize: baseSize * 0.8 }}>
            <span><span className="font-bold">23</span> John Peterson</span>
            <span className="text-neutral-500">Maria S. · 8:00 PM</span>
          </div>

          {/* Allergens summary */}
          <div className="px-3 py-1 font-bold text-[#C0392B] border-b border-neutral-200 tracking-wide" style={{ fontSize: baseSize * 0.72 }}>
            ALLERGENS: PEANUT, GLUTEN, NUT
          </div>

          {/* Order note */}
          <div className="px-3 pt-2">
            <div className="rounded-md bg-[#FFF8E1] border border-[#F5D57A] px-2 py-1 text-[#8A5A00] leading-snug" style={{ fontSize: baseSize * 0.78 }}>
              <span className="font-bold uppercase tracking-wide mr-1">Order Note</span>
              Anniversary, please pace mains after apps.
            </div>
          </div>

          {/* Courses */}
          <div className="px-3 py-2 space-y-1.5">
            {sortedCourses.map((course) => (
              <div key={course}>
                <div className="font-bold text-neutral-500 tracking-wide" style={{ fontSize: baseSize * 0.7 }}>{course}</div>
                <div className="space-y-1.5">
                  {grouped[course].map((p) => (
                    <div key={p.name} className="flex items-baseline gap-2">
                      <span className="text-neutral-500 shrink-0" style={{ fontSize: baseSize * 0.92 }}>{p.qty}x</span>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold leading-tight" style={{ fontSize: baseSize * 0.95 }}>{p.name}</div>
                        {p.modifiers?.map((m, i) => (
                          <div
                            key={i}
                            className={`leading-tight ${
                              m.kind === "add"
                                ? "text-[#2471A3] font-semibold"
                                : m.kind === "remove"
                                ? "text-[#C0392B] font-semibold line-through"
                                : "text-neutral-500"
                            }`}
                            style={{ fontSize: baseSize * 0.78 }}
                          >
                            {m.kind === "add" ? "+ " : m.kind === "remove" ? "- " : ""}
                            {m.text}
                          </div>
                        ))}
                        {p.note && (
                          <div className="italic text-neutral-500 leading-tight" style={{ fontSize: baseSize * 0.78 }}>
                            &ldquo;{p.note}&rdquo;
                          </div>
                        )}
                        {p.allergens && p.allergens.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            {p.allergens.map((a) => (
                              <span key={a} className="inline-block px-1.5 py-[1px] rounded font-bold uppercase tracking-wide bg-[#FBEAEA] text-[#C0392B]" style={{ fontSize: baseSize * 0.66 }}>
                                {a}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
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
                      ? "bg-white text-neutral-900"
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

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,340px)_1fr] gap-6">
          {/* Controls */}
          <div className="space-y-6 max-w-[340px]">
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
                          ? "border-white bg-white text-neutral-900"
                          : "border-neutral-700/60 bg-neutral-800/60 text-foreground/80 hover:bg-neutral-800"
                      }`}
                    >
                      <span className="text-sm font-medium">{s.label}</span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Logo toggle */}
            <section className="bg-neutral-800/60 rounded-2xl px-4 py-3.5 flex items-center justify-between">
              <div>
                <div className="text-foreground text-base font-medium">Merchant Logo</div>
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
            <section className="flex flex-col gap-4">
              <div>
                <h3 className="text-sm font-semibold text-neutral-400 tracking-wider mb-2 px-1">Font Style</h3>
                <div className="flex gap-2">
                  {(["thermal", "clean", "serif", "rounded"] as FontStyle[]).map((fs) => {
                    const active = current.fontStyle === fs;
                    const label = fs.charAt(0).toUpperCase() + fs.slice(1);
                    return (
                      <button
                        key={fs}
                        onClick={() => updateChannel({ fontStyle: fs })}
                        className={`flex-1 px-3 py-2 rounded-full text-sm font-medium capitalize transition-colors ${
                          active
                            ? "bg-white text-neutral-900"
                            : "bg-neutral-800/60 text-foreground/80 hover:bg-neutral-800"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-neutral-400 tracking-wider mb-2 px-1">Font Size</h3>
                <div className="flex gap-2">
                  {(["s", "m", "l"] as FontSize[]).map((sz) => {
                    const active = current.fontSize === sz;
                    const label = sz === "s" ? "Small" : sz === "m" ? "Medium" : "Large";
                    return (
                      <button
                        key={sz}
                        onClick={() => updateChannel({ fontSize: sz })}
                        className={`flex-1 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                          active
                            ? "bg-white text-neutral-900"
                            : "bg-neutral-800/60 text-foreground/80 hover:bg-neutral-800"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>
          </div>

          {/* Live preview */}
          <div className="flex justify-center lg:justify-end items-center self-stretch">
            <div className="w-full flex flex-col items-center lg:items-end">
              <div className="text-sm font-semibold text-neutral-400 tracking-wider mb-2 px-1 self-start">Live Preview</div>
              {activeTab === "kot" ? renderKotPreview() : renderPreview()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiptsContent;
