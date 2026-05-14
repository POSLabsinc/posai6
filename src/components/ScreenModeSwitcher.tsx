import { useEffect, useRef, useState } from "react";
import { ChevronDown, Lock, Check, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { SettingsManager, type ScreenModeId, type ScreenModeSettings } from "@/lib/settingsManager";
import MPINDialog from "@/components/MPINDialog";
import SettingsIcon from "@/components/settings/SettingsIcon";
import { useToast } from "@/hooks/use-toast";
import pointOfSaleIcon from "@/assets/icons/screen-mode-pos.png";
import kitchenDisplayIcon from "@/assets/icons/screen-mode-kds.png";
import customerFacingIcon from "@/assets/icons/screen-mode-cfd.png";
import selfServiceKioskIcon from "@/assets/icons/screen-mode-kiosk.png";

interface ModeMeta {
  id: ScreenModeId;
  label: string;
  description: string;
  iconSrc: string;
}

const MODES: ModeMeta[] = [
  { id: "pos", label: "Point of Sale", description: "Full order taking, payments, and table management", iconSrc: pointOfSaleIcon },
  { id: "kds", label: "Kitchen Display System", description: "Kitchen display for ticket management and fulfillment", iconSrc: kitchenDisplayIcon },
  { id: "cfd", label: "Customer Facing Display", description: "Customer-facing display showing order and total", iconSrc: customerFacingIcon },
  { id: "kiosk", label: "Self Service Kiosk", description: "Self-service ordering for guests at the counter", iconSrc: selfServiceKioskIcon },
];

const ScreenModeSwitcher = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [settings, setSettings] = useState<ScreenModeSettings>(() => SettingsManager.getScreenModeSettings());
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState<ScreenModeId | null>(null);
  const [showPin, setShowPin] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sync = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.type === "screenMode" && detail.data) setSettings(detail.data);
    };
    window.addEventListener("settings-updated", sync);
    return () => window.removeEventListener("settings-updated", sync);
  }, []);

  useEffect(() => {
    const onOutside = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [open]);

  if (!settings.enableSwitching) return null;

  const visible = MODES.filter((m) => settings.visibleModes[m.id]);
  if (visible.length === 0) return null;

  const current = MODES.find((m) => m.id === settings.currentMode) ?? MODES[0];

  const performSwitch = (mode: ScreenModeId) => {
    SettingsManager.updateScreenModeSettings({ currentMode: mode });
    const meta = MODES.find((m) => m.id === mode)!;
    toast({ title: `Switched to ${meta.label}`, description: meta.description });
    if (mode === "kds") navigate("/kds-new");
    else if (mode === "pos") navigate("/");
    // CFD/Kiosk: no dedicated route yet — stay on current screen
  };

  const handleSelect = (mode: ScreenModeId) => {
    setOpen(false);
    if (mode === settings.currentMode) return;
    setConfirming(mode);
  };

  const confirmSwitch = () => {
    if (!confirming) return;
    if (settings.requireManagerPin) {
      setShowPin(true);
    } else {
      const target = confirming;
      setConfirming(null);
      performSwitch(target);
    }
  };

  const onPinSuccess = () => {
    if (!confirming) return;
    const target = confirming;
    setShowPin(false);
    setConfirming(null);
    performSwitch(target);
  };

  const confirmMode = confirming ? MODES.find((m) => m.id === confirming)! : null;

  return (
    <>
      <div className="relative" ref={wrapRef}>
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1.5 px-2 md:px-2.5 py-1 md:py-1.5 rounded-full bg-white/10 hover:bg-white/15 transition-colors"
          aria-label={`Screen Mode: ${current.label}`}
          title={current.label}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <img src={current.iconSrc} alt="" className="w-4 h-4 object-contain" />
          <ChevronDown className="w-3.5 h-3.5 opacity-70" />
        </button>

        {open && (
          <div className="fixed left-2 right-2 top-[44px] md:absolute md:left-auto md:right-0 md:top-full md:mt-2 md:w-64 bg-[#1C1C1E] border border-white/10 rounded-2xl shadow-2xl z-[999] overflow-hidden">
            <div className="px-4 py-2.5 border-b border-white/10">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Screen Mode</p>
            </div>
            <div className="py-1">
              {visible.map((m) => {
                const active = m.id === settings.currentMode;
                return (
                  <button
                    key={m.id}
                    onClick={() => handleSelect(m.id)}
                    className={`w-full flex items-start gap-3 px-4 py-2.5 text-left hover:bg-white/5 transition-colors ${active ? "bg-white/[0.04]" : ""}`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                      <img src={m.iconSrc} alt="" className="w-4 h-4 object-contain" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white flex items-center gap-2">
                        {m.label}
                        {active && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                      </p>
                      <p className="text-[11px] text-neutral-500 mt-0.5 leading-snug">{m.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
            {settings.requireManagerPin && (
              <div className="px-4 py-2 border-t border-white/10 flex items-center gap-1.5 text-[11px] text-neutral-500">
                <Lock className="w-3 h-3" />
                Manager PIN required to switch
              </div>
            )}
          </div>
        )}
      </div>

      {/* Confirm Switch Modal */}
      {confirming && !showPin && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setConfirming(null)} />
          <div className="relative z-10 w-[420px] max-w-[92vw] bg-[#1C1C1E] rounded-2xl shadow-2xl overflow-hidden p-6">
            <button
              onClick={() => setConfirming(null)}
              aria-label="Close"
              className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex flex-col items-center text-center pt-2">
              <div className="w-14 h-14 rounded-2xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center mb-4">
                {confirmMode && <img src={confirmMode.iconSrc} alt="" className="w-7 h-7 object-contain" />}
              </div>
              <h3 className="text-base font-semibold text-white">
                Switch to {MODES.find((m) => m.id === confirming)!.label}?
              </h3>
              <p className="text-xs text-neutral-400 mt-1.5 leading-relaxed max-w-[320px]">
                {MODES.find((m) => m.id === confirming)!.description}
              </p>
            </div>
            <button
              onClick={confirmSwitch}
              className="w-full mt-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-sm font-semibold text-primary-foreground transition-colors"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      <MPINDialog
        open={showPin}
        onOpenChange={(o) => {
          setShowPin(o);
          if (!o) setConfirming(null);
        }}
        onSuccess={onPinSuccess}
      />
    </>
  );
};

export default ScreenModeSwitcher;
