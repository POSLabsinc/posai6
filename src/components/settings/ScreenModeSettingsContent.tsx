import { useEffect, useState, useCallback } from "react";
import { ChevronLeft, Store, CookingPot, MonitorSmartphone, Tablet } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useIsMobile } from "@/hooks/use-mobile";
import { SettingsManager, ScreenModeSettings, ScreenModeId } from "@/lib/settingsManager";

interface Props {
  showHeader?: boolean;
  onBack?: () => void;
}

const MODES: { id: ScreenModeId; label: string; description: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "pos", label: "Point of Sale", description: "Full order taking, payments, and table management", Icon: Store },
  { id: "kds", label: "Kitchen Display System", description: "Kitchen display for ticket management and fulfillment", Icon: CookingPot },
  { id: "cfd", label: "Customer Facing Display", description: "Customer-facing display showing order and total", Icon: MonitorSmartphone },
  { id: "kiosk", label: "Self Service Kiosk", description: "Self-service ordering for guests at the counter", Icon: Tablet },
];

const ScreenModeSettingsContent = ({ showHeader = true, onBack }: Props) => {
  const isMobile = useIsMobile();
  const [settings, setSettings] = useState<ScreenModeSettings>(() => SettingsManager.getScreenModeSettings());

  useEffect(() => {
    const sync = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.type === "screenMode" && detail.data) setSettings(detail.data);
    };
    window.addEventListener("settings-updated", sync);
    return () => window.removeEventListener("settings-updated", sync);
  }, []);

  const update = useCallback((updates: Partial<ScreenModeSettings>) => {
    const next = SettingsManager.updateScreenModeSettings(updates);
    setSettings(next);
  }, []);

  const toggleVisible = (id: ScreenModeId, value: boolean) => {
    // POS must always remain visible (default mode)
    if (id === "pos") return;
    update({ visibleModes: { ...settings.visibleModes, [id]: value } });
  };

  return (
    <div className="h-full overflow-y-auto scrollbar-hide overscroll-contain">
      {showHeader && onBack && (
        <div className="sticky top-0 z-10 bg-[#131316] flex items-center px-2 py-3">
          <button onClick={onBack} className="p-1.5 -ml-1 rounded-full hover:bg-white/10 transition-colors">
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
        </div>
      )}

      <div className="pt-2 px-4 md:px-6 pb-8">
        {/* Header Card */}
        <div className="bg-neutral-800/60 rounded-2xl p-5 mb-4 flex flex-col items-start">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: "#3B82F6" }}>
            <Store className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-semibold text-foreground mb-2">Screen Mode</h1>
          <p className="text-base text-neutral-400 leading-relaxed w-full">
            Configure how this device can switch between POS, KDS, CFD, and Kiosk modes.
          </p>
        </div>

        {/* Switching controls */}
        <h2 className="text-base font-medium text-neutral-500 mb-2 px-1">Switching</h2>
        <div className="bg-neutral-800/60 rounded-2xl overflow-hidden mb-1.5">
          <div className="flex items-center justify-between py-4 px-4">
            <div className="pr-4">
              <p className="text-lg font-medium text-foreground">Enable Screen Mode Switching</p>
              <p className="text-sm text-neutral-500 mt-0.5">Show the mode switcher in the top bar.</p>
            </div>
            <Switch checked={settings.enableSwitching} onCheckedChange={(v) => update({ enableSwitching: v })} />
          </div>
          <div className="h-px bg-neutral-700/50 mx-4" />
          <div className="flex items-center justify-between py-4 px-4">
            <div className="pr-4">
              <p className="text-lg font-medium text-foreground">Require Manager PIN</p>
              <p className="text-sm text-neutral-500 mt-0.5">Prompt for a manager PIN before switching modes.</p>
            </div>
            <Switch
              checked={settings.requireManagerPin}
              onCheckedChange={(v) => update({ requireManagerPin: v })}
              disabled={!settings.enableSwitching}
            />
          </div>
        </div>
        <p className="text-sm text-neutral-500 mt-1.5 px-1 mb-6 leading-relaxed">
          When switching is disabled, the option is hidden from the top bar.
        </p>

        {/* Visible Modes */}
        <h2 className="text-base font-medium text-neutral-500 mb-2 px-1">Visible Modes</h2>
        <div className="bg-neutral-800/60 rounded-2xl overflow-hidden mb-1.5">
          {MODES.map((m, idx) => {
            const isPos = m.id === "pos";
            return (
              <div key={m.id}>
                <div className="flex items-center justify-between py-4 px-4">
                  <div className="flex items-center gap-3 pr-4">
                    <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                      <m.Icon className="w-4.5 h-4.5 text-white" />
                    </div>
                    <div>
                      <p className="text-lg font-medium text-foreground flex items-center gap-2">
                        {m.label}
                        {isPos && <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold uppercase">Default</span>}
                      </p>
                      <p className="text-sm text-neutral-500 mt-0.5">{m.description}</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.visibleModes[m.id]}
                    onCheckedChange={(v) => toggleVisible(m.id, v)}
                    disabled={isPos || !settings.enableSwitching}
                  />
                </div>
                {idx < MODES.length - 1 && <div className="h-px bg-neutral-700/50 mx-4" />}
              </div>
            );
          })}
        </div>
        <p className="text-sm text-neutral-500 mt-1.5 px-1 mb-4 leading-relaxed">
          Hidden modes will not appear in the top-bar switcher. Point of Sale is always available.
        </p>
      </div>
    </div>
  );
};

export default ScreenModeSettingsContent;
