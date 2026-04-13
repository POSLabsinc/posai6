import { useState, useRef } from "react";
import { RotateCcw, Upload, X, Eye, Palette, MousePointer2, Monitor, PanelTop, Settings2, Image, ChevronRight } from "lucide-react";
import { useAppearance, DEFAULT_SELECTION_COLOR, DEFAULT_HOVER_COLOR, DEFAULT_SPLASH_BG_COLOR, DEFAULT_TOP_BAR_COLOR, DEFAULT_SETTINGS_ICON_COLOR } from "@/contexts/AppearanceContext";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface ColorFieldProps {
  label: string;
  description: string;
  icon: React.ReactNode;
  value: string;
  defaultValue: string;
  onChange: (color: string) => void;
}

function ColorField({ label, description, icon, value, defaultValue, onChange }: ColorFieldProps) {
  const [hexInput, setHexInput] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    if (!val.startsWith('#')) val = '#' + val;
    setHexInput(val);
    if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
      onChange(val);
    }
  };

  const handlePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setHexInput(val);
    onChange(val);
  };

  const handleReset = () => {
    onChange(defaultValue);
    setHexInput(defaultValue);
  };

  // Sync hex input when value changes externally
  if (value !== hexInput && /^#[0-9A-Fa-f]{6}$/.test(value)) {
    setHexInput(value);
  }

  return (
    <div className="flex items-center justify-between py-3.5 px-5">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-neutral-700/50 flex-shrink-0">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">{label}</p>
          <p className="text-xs text-neutral-500 truncate">{description}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <div
          className="w-8 h-8 rounded-lg border-2 border-neutral-600 cursor-pointer relative overflow-hidden"
          style={{ backgroundColor: value || '#000000' }}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="color"
            value={value || '#000000'}
            onChange={handlePickerChange}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />
        </div>
        <input
          type="text"
          value={hexInput}
          onChange={handleHexChange}
          maxLength={7}
          className="w-[80px] text-xs bg-neutral-700/50 border border-neutral-600 rounded-lg px-2 py-1.5 text-foreground font-mono text-center uppercase"
          placeholder="#000000"
        />
        {value !== defaultValue && (
          <button
            onClick={handleReset}
            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-neutral-700/50 transition-colors"
            title="Reset to default"
          >
            <RotateCcw className="w-3.5 h-3.5 text-neutral-400" />
          </button>
        )}
      </div>
    </div>
  );
}

const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

export default function AdvancedCustomizationContent() {
  const {
    selectionColor, setSelectionColor,
    hoverColor, setHoverColor,
    splashBgColor, setSplashBgColor,
    topBarColor, setTopBarColor,
    settingsIconColor, setSettingsIconColor,
    partnerLogoUrl, setPartnerLogoUrl,
    resetAdvancedCustomization,
  } = useAppearance();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string>(partnerLogoUrl);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      toast({ title: "Invalid file type", description: "Please upload a PNG, JPG, WebP, or SVG image.", variant: "destructive" });
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast({ title: "File too large", description: "Maximum file size is 2MB.", variant: "destructive" });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setPreviewUrl(dataUrl);
      setPartnerLogoUrl(dataUrl);
      toast({ title: "Logo updated", description: "Partner logo has been updated successfully." });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setPreviewUrl('');
    setPartnerLogoUrl('');
    toast({ title: "Logo removed", description: "Partner logo has been reset to default." });
  };

  const handleResetAll = () => {
    resetAdvancedCustomization();
    setPreviewUrl('');
    toast({ title: "Reset complete", description: "All advanced customization settings have been reset to defaults." });
  };

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between px-1">
        <h2 className="text-base font-medium text-neutral-500">Advanced Customization</h2>
        <button
          onClick={handleResetAll}
          className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-foreground transition-colors px-3 py-1.5 rounded-lg bg-neutral-800/60 hover:bg-neutral-700/60"
        >
          <RotateCcw className="w-3 h-3" />
          Reset All
        </button>
      </div>

      {/* Interactive Colors */}
      <div>
        <p className="text-xs font-medium text-neutral-500 mb-2 px-1 uppercase tracking-wider">Interactive Colors</p>
        <div className="bg-neutral-800/60 rounded-2xl overflow-hidden">
          <ColorField
            label="Selection Color"
            description="Active tabs, selected rows, cards"
            icon={<MousePointer2 className="w-4 h-4 text-neutral-300" />}
            value={selectionColor}
            defaultValue={DEFAULT_SELECTION_COLOR}
            onChange={setSelectionColor}
          />
          <div className="h-px bg-neutral-700/50 mx-5" />
          <ColorField
            label="Hover Color"
            description="Buttons, list rows, menus"
            icon={<Eye className="w-4 h-4 text-neutral-300" />}
            value={hoverColor}
            defaultValue={DEFAULT_HOVER_COLOR}
            onChange={setHoverColor}
          />
        </div>
      </div>

      {/* Top Bar & Splash Screen */}
      <div>
        <p className="text-xs font-medium text-neutral-500 mb-2 px-1 uppercase tracking-wider">Application Chrome</p>
        <div className="bg-neutral-800/60 rounded-2xl overflow-hidden">
          <ColorField
            label="Top Bar Background"
            description="Header bar across all screens"
            icon={<PanelTop className="w-4 h-4 text-neutral-300" />}
            value={topBarColor}
            defaultValue={DEFAULT_TOP_BAR_COLOR}
            onChange={setTopBarColor}
          />
          <div className="h-px bg-neutral-700/50 mx-5" />
          <ColorField
            label="Splash Screen Background"
            description="App launch screen color"
            icon={<Monitor className="w-4 h-4 text-neutral-300" />}
            value={splashBgColor}
            defaultValue={DEFAULT_SPLASH_BG_COLOR}
            onChange={setSplashBgColor}
          />
          <div className="h-px bg-neutral-700/50 mx-5" />
          <ColorField
            label="Settings Icon Color"
            description="Overrides all settings icons"
            icon={<Settings2 className="w-4 h-4 text-neutral-300" />}
            value={settingsIconColor || '#000000'}
            defaultValue={DEFAULT_SETTINGS_ICON_COLOR || '#000000'}
            onChange={(c) => setSettingsIconColor(c)}
          />
        </div>
      </div>

      {/* Live Preview - Top Bar */}
      <div>
        <p className="text-xs font-medium text-neutral-500 mb-2 px-1 uppercase tracking-wider">Preview</p>
        <div className="bg-neutral-800/60 rounded-2xl p-4">
          {/* Mini top bar preview */}
          <p className="text-xs text-neutral-500 mb-2">Top Bar</p>
          <div
            className="h-10 rounded-xl flex items-center px-4 mb-3 transition-colors duration-200"
            style={{ backgroundColor: topBarColor }}
          >
            <div className="w-6 h-6 rounded-full bg-white/20" />
            <div className="flex-1 flex justify-center">
              <div className="w-20 h-3 rounded bg-white/30" />
            </div>
            <div className="w-6 h-6 rounded-full bg-white/20" />
          </div>

          {/* Mini selection/hover preview */}
          <p className="text-xs text-neutral-500 mb-2">Selection and Hover</p>
          <div className="flex gap-2 mb-3">
            <div
              className="flex-1 h-9 rounded-xl flex items-center justify-center text-xs text-white font-medium transition-colors duration-200"
              style={{ backgroundColor: selectionColor }}
            >
              Selected
            </div>
            <div
              className="flex-1 h-9 rounded-xl flex items-center justify-center text-xs text-neutral-300 font-medium border border-neutral-600 transition-colors duration-200"
              style={{ backgroundColor: hoverColor }}
            >
              Hover
            </div>
            <div className="flex-1 h-9 rounded-xl flex items-center justify-center text-xs text-neutral-500 font-medium bg-neutral-700/30">
              Default
            </div>
          </div>

          {/* Splash preview */}
          <p className="text-xs text-neutral-500 mb-2">Splash Screen</p>
          <div
            className="h-20 rounded-xl flex items-center justify-center transition-colors duration-200"
            style={{ backgroundColor: splashBgColor }}
          >
            {previewUrl ? (
              <img src={previewUrl} alt="Logo" className="h-10 object-contain" />
            ) : (
              <div className="w-16 h-8 rounded bg-white/10" />
            )}
          </div>
        </div>
      </div>

      {/* Partner Logo Upload */}
      <div>
        <p className="text-xs font-medium text-neutral-500 mb-2 px-1 uppercase tracking-wider">Branding</p>
        <div className="bg-neutral-800/60 rounded-2xl p-5">
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-neutral-700/50 flex-shrink-0 mt-0.5">
              <Image className="w-4 h-4 text-neutral-300" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground mb-1">Partner Logo</p>
              <p className="text-xs text-neutral-500 mb-3">Shown in sidebar and splash screen. PNG, JPG, WebP, or SVG. Max 2MB.</p>

              {previewUrl ? (
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-xl bg-neutral-700/50 flex items-center justify-center overflow-hidden border border-neutral-600">
                    <img src={previewUrl} alt="Partner Logo" className="w-14 h-14 object-contain" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs text-neutral-300 hover:text-foreground transition-colors px-3 py-1.5 rounded-lg bg-neutral-700/50 hover:bg-neutral-600/50"
                    >
                      Replace
                    </button>
                    <button
                      onClick={handleRemoveLogo}
                      className="text-xs text-red-400 hover:text-red-300 transition-colors px-3 py-1.5 rounded-lg bg-neutral-700/50 hover:bg-neutral-600/50"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 text-sm text-neutral-300 hover:text-foreground transition-colors px-4 py-2.5 rounded-xl bg-neutral-700/50 hover:bg-neutral-600/50 border border-dashed border-neutral-600"
                >
                  <Upload className="w-4 h-4" />
                  Upload Logo
                </button>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept=".png,.jpg,.jpeg,.webp,.svg"
                className="hidden"
                onChange={handleLogoUpload}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}