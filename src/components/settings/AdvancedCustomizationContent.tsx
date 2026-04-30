import { useState, useRef } from "react";
import { Upload, Image, Palette, ChevronRight } from "lucide-react";
import { useAppearance } from "@/contexts/AppearanceContext";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

export default function AdvancedCustomizationContent() {
  const navigate = useNavigate();
  const {
    themeColor,
    themeColor,
    partnerLogoUrl, setPartnerLogoUrl,
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
      toast({ title: "Logo updated", description: "Brand logo has been updated successfully." });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setPreviewUrl('');
    setPartnerLogoUrl('');
    toast({ title: "Logo removed", description: "Brand logo has been reset to default." });
  };

  const handleResetAll = () => {
    resetAdvancedCustomization();
    setPreviewUrl('');
    toast({ title: "Reset complete", description: "All advanced customization settings have been reset to defaults." });
  };

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="px-1">
        <h2 className="text-base font-medium text-neutral-500">Advanced Customization</h2>
      </div>

      {/* Theme Color - Top Level Option */}
      <div>
        <p className="text-xs font-medium text-neutral-500 mb-1 px-1 uppercase tracking-wider">Theme</p>
        <div className="bg-neutral-800/60 rounded-2xl overflow-hidden">
          <button
            onClick={() => navigate('/settings/system/appearance/theme-color')}
            className="flex items-center justify-between w-full py-3.5 px-5 active:opacity-70 transition-opacity"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-neutral-700/50 flex-shrink-0">
                <Palette className="w-4 h-4 text-neutral-300" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-foreground">Theme Color</p>
                <p className="text-xs text-neutral-500">Set the primary color for the entire app</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {themeColor && (
                <div
                  className="w-6 h-6 rounded-md border border-neutral-600"
                  style={{ backgroundColor: themeColor }}
                />
              )}
              <ChevronRight className="w-5 h-5 text-neutral-500" />
            </div>
          </button>
        </div>
      </div>

      {/* Brand Logo Upload */}
      <div>
        <p className="text-xs font-medium text-neutral-500 mb-1 px-1 uppercase tracking-wider">Branding</p>
        <div className="bg-neutral-800/60 rounded-2xl p-5">
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-neutral-700/50 flex-shrink-0 mt-0.5">
              <Image className="w-4 h-4 text-neutral-300" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground mb-1">Brand Logo</p>
              <p className="text-xs text-neutral-500 mb-1">Shown in sidebar and splash screen. PNG, JPG, WebP, or SVG. Max 2MB.</p>

              {previewUrl ? (
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-xl bg-neutral-700/50 flex items-center justify-center overflow-hidden border border-neutral-600">
                    <img src={previewUrl} alt="Brand Logo" className="w-14 h-14 object-contain" />
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
