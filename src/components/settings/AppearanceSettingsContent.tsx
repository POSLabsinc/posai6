import { useState, useEffect, useRef } from "react";
import { ChevronRight, ChevronLeft, Sun } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useNavigate } from "react-router-dom";
import { Slider } from "@/components/ui/slider";
import { useTheme } from "next-themes";
import { useAppearance, IconStyle, IconSize, MIN_TEXT_SIZE, MAX_TEXT_SIZE, MIN_BRIGHTNESS, MAX_BRIGHTNESS } from "@/contexts/AppearanceContext";
import SettingsIcon from "@/components/settings/SettingsIcon";
import { useIsMobile } from "@/hooks/use-mobile";
import { useScheduledTheme } from "@/hooks/useScheduledTheme";
import ScheduleTimePicker from "@/components/settings/ScheduleTimePicker";
import ScheduleTypeSelector from "@/components/settings/ScheduleTypeSelector";
import appearanceIcon from "@/assets/icons/appearance.png";
import themePresetsIcon from "@/assets/icons/theme-presets.png";
import POSThemePreview from "@/components/settings/POSThemePreview";
import AdvancedCustomizationContent from "@/components/settings/AdvancedCustomizationContent";

type ThemeOption = 'dark' | 'light';


interface OverlayDropdownProps<T extends string> {
  options: T[];
  value: T;
  onChange: (value: T) => void;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}

function OverlayDropdown<T extends string>({ options, value, onChange, isOpen, onToggle, onClose }: OverlayDropdownProps<T>) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, right: 0 });

  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right
      });
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
      dropdownRef.current &&
      !dropdownRef.current.contains(event.target as Node) &&
      triggerRef.current &&
      !triggerRef.current.contains(event.target as Node))
      {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  return (
    <>
      <button
        ref={triggerRef}
        onClick={onToggle}
        className="flex items-center gap-2">

        <span className="text-lg text-neutral-400">{value}</span>
        <ChevronRight className="w-5 h-5 text-neutral-500" />
      </button>
      
      {isOpen &&
      <>
          <div
          className="fixed inset-0 z-[100] bg-black/40"
          onClick={onClose} />

          <div
          ref={dropdownRef}
          className="fixed z-[101] bg-neutral-800 rounded-xl overflow-hidden shadow-2xl w-[160px] animate-in fade-in-0 zoom-in-95 duration-150"
          style={{
            top: position.top,
            right: position.right
          }}>

            {options.map((option) =>
          <button
            key={option}
            onClick={() => {
              onChange(option);
              onClose();
            }}
            className="w-full text-left px-6 py-3.5 text-[17px] font-medium text-white hover:bg-neutral-700 active:bg-neutral-700 transition-colors border-b border-neutral-700 last:border-b-0">

                {option}
              </button>
          )}
          </div>
        </>
      }
    </>);

}

interface AppearanceSettingsContentProps {
  showHeader?: boolean;
  onBack?: () => void;
  onAIClick?: () => void;
  onNavigate?: (path: string) => void;
}

const AppearanceSettingsContent = ({ showHeader = true, onBack, onAIClick, onNavigate }: AppearanceSettingsContentProps) => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const isMobile = useIsMobile();
  const { iconStyle, setIconStyle, iconSize, setIconSize, textSize, setTextSize, boldText, setBoldText, brightness, setBrightness, getIconBgColor } = useAppearance();

  const [selectedTheme, setSelectedTheme] = useState<ThemeOption>('dark');
  const [automaticTheme, setAutomaticTheme] = useState(false);
  const [iconStyleDropdownOpen, setIconStyleDropdownOpen] = useState(false);
  const [iconSizeDropdownOpen, setIconSizeDropdownOpen] = useState(false);
  const { scheduleEnabled, scheduleType, lightStart, lightEnd, setScheduleEnabled, setScheduleType, setLightStart, setLightEnd } = useScheduledTheme();

  useEffect(() => {
    if (theme === 'light') {
      setSelectedTheme('light');
    } else {
      setSelectedTheme('dark');
    }
  }, [theme]);

  const handleThemeChange = (newTheme: ThemeOption) => {
    setSelectedTheme(newTheme);
    setTheme(newTheme);
    setAutomaticTheme(false);
  };

  const handleAutomaticToggle = (checked: boolean) => {
    setAutomaticTheme(checked);
    setScheduleEnabled(checked);
    // Don't change theme on toggle - keep current theme
  };

  const iconStyleOptions: IconStyle[] = ['Default', 'Dark'];
  const iconSizeOptions: IconSize[] = ['Default', 'Small', 'Medium', 'Large'];

  return (
    <div className="h-full overflow-y-auto scrollbar-hide overscroll-contain">
      {showHeader &&
      <div className="flex items-center justify-between pt-0 pb-2 relative overflow-visible px-4">
          {onBack &&
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-surface flex items-center justify-center active:opacity-70 transition-opacity">
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>
        }
          <h1 className="text-base font-medium text-foreground absolute left-1/2 -translate-x-1/2">Appearance</h1>
        </div>
      }

      <div className={`${showHeader ? 'pt-0' : 'pt-0'} px-6 pb-28`}>
        {/* Header Card */}

        {/* App Theme Section */}
        <div className="mb-6">
          <h2 className="text-base font-medium text-muted-foreground mb-4 px-1">App Theme</h2>
          
          <div className="bg-surface rounded-2xl p-4">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <POSThemePreview
                variant="dark"
                isSelected={selectedTheme === 'dark'}
                onClick={() => handleThemeChange('dark')} />

              <POSThemePreview
                variant="light"
                isSelected={selectedTheme === 'light'}
                onClick={() => handleThemeChange('light')} />
            </div>
            
            <div className="h-px bg-divider mb-4" />
            
            <div className="flex items-center justify-between">
              <span className="text-lg font-medium text-foreground">Automatic</span>
              <Switch
                checked={automaticTheme}
                onCheckedChange={handleAutomaticToggle} />
            </div>

            {/* Schedule Options - shown when automatic is on */}
            {automaticTheme && (
              <>
                <ScheduleTypeSelector
                  scheduleType={scheduleType}
                  onTypeChange={setScheduleType}
                />
                <ScheduleTimePicker
                  lightStart={lightStart}
                  lightEnd={lightEnd}
                  onStartChange={setLightStart}
                  onEndChange={setLightEnd}
                />
              </>
            )}
          </div>
          
          <p className="text-sm text-muted-foreground mt-3 px-1 leading-relaxed">
            {automaticTheme 
              ? "Theme switches automatically at the scheduled times."
              : "Automatically switches between light and dark mode based on your device settings."}
          </p>
        </div>

        {/* Icon Style & Size Section */}
        <div className="bg-surface rounded-2xl overflow-hidden mb-1">
          <div className="flex items-center justify-between w-full py-4 px-5">
            <span className="text-lg font-medium text-foreground">Icon Style</span>
            <OverlayDropdown
              options={iconStyleOptions}
              value={iconStyle}
              onChange={setIconStyle}
              isOpen={iconStyleDropdownOpen}
              onToggle={() => {
                setIconStyleDropdownOpen(!iconStyleDropdownOpen);
                setIconSizeDropdownOpen(false);
              }}
              onClose={() => setIconStyleDropdownOpen(false)} />

          </div>
          
          <div className="h-px bg-divider mx-5" />
          
          <div className="flex items-center justify-between w-full py-4 px-5">
            <span className="text-lg font-medium text-foreground">Icon size</span>
            <OverlayDropdown
              options={iconSizeOptions}
              value={iconSize}
              onChange={setIconSize}
              isOpen={iconSizeDropdownOpen}
              onToggle={() => {
                setIconSizeDropdownOpen(!iconSizeDropdownOpen);
                setIconStyleDropdownOpen(false);
              }}
              onClose={() => setIconSizeDropdownOpen(false)} />

          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-1.5 px-1 mb-6 leading-relaxed">
          Select the visual style of icons used in the Point of Sale.
        </p>

        {/* Text Size & Bold Section */}
        <div className="bg-surface rounded-2xl overflow-hidden mb-1">
          <div className="py-4 px-5">
            <span className="text-lg font-medium text-foreground block mb-4">Text Size</span>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground font-medium flex-shrink-0">A</span>
              <div className="flex-1">
                <Slider
                  value={[textSize]}
                  onValueChange={(value) => setTextSize(value[0])}
                  min={MIN_TEXT_SIZE}
                  max={MAX_TEXT_SIZE}
                  step={1}
                  className="w-full" />

              </div>
              <span className="text-2xl text-foreground font-medium flex-shrink-0">A</span>
            </div>
          </div>
          
          <div className="h-px bg-divider mx-5" />
          
          <div className="flex items-center justify-between py-4 px-5">
            <span className="text-lg font-medium text-foreground">Bold text</span>
            <Switch
              checked={boldText}
              onCheckedChange={setBoldText} />

          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-1.5 px-1 mb-6 leading-relaxed">
          Change the size of text across the Point of Sale. This improves readability for staff and reduces order mistakes.
        </p>

        {/* Brightness Section */}
        <div className="mb-4">
          <h2 className="text-base font-medium text-muted-foreground mb-4 px-1">Brightness</h2>
          
          <div className="bg-surface rounded-2xl p-5">
            <div className="flex items-center gap-4">
              <Sun className="w-5 h-5 text-muted-foreground flex-shrink-0" strokeWidth={1.5} />
              <div className="flex-1">
                <Slider
                  value={[brightness]}
                  onValueChange={(value) => setBrightness(value[0])}
                  min={MIN_BRIGHTNESS}
                  max={MAX_BRIGHTNESS}
                  step={1}
                  className="w-full" />

              </div>
              <Sun className="w-7 h-7 text-foreground flex-shrink-0" strokeWidth={1.5} />
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground mt-3 px-1 leading-relaxed">
            Adjust screen brightness for better visibility in different lighting conditions.
          </p>
        </div>

        {/* Fonts */}
        <div className="bg-surface rounded-full overflow-hidden mb-1.5">
          <button
            onClick={() => onNavigate ? onNavigate('/settings/system/fonts') : navigate('/settings/system/fonts')}
            className="flex items-center justify-between w-full py-3.5 px-4 active:opacity-70 transition-opacity"
          >
            <div className="flex items-center gap-4">
              <SettingsIcon bgColor="#6366F1">
                <span className="text-white text-lg font-bold">Aa</span>
              </SettingsIcon>
              <span className="text-foreground text-lg font-medium">Fonts</span>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
        <p className="text-xs text-muted-foreground mb-6 px-1">
          Select a font family to personalize the look and feel of your display.
        </p>

        {/* Theme Presets */}
        <div className="bg-surface rounded-full overflow-hidden mb-1.5">
          <button
            onClick={() => onNavigate ? onNavigate('/settings/system/theme-presets') : navigate('/settings/system/theme-presets')}
            className="flex items-center justify-between w-full py-3.5 px-4 active:opacity-70 transition-opacity"
          >
            <div className="flex items-center gap-4">
              <SettingsIcon bgColor="#F59E0B" iconSrc={themePresetsIcon} iconAlt="Theme Presets" />
              <span className="text-foreground text-lg font-medium">Theme Presets</span>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
        <p className="text-xs text-muted-foreground px-1 mb-6">
          Choose from a variety of layout styles to customize your Point of Sale interface.
        </p>

        {/* Advanced Customization */}
        <AdvancedCustomizationContent />
      </div>
    </div>);

};

export default AppearanceSettingsContent;