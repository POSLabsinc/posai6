import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Check, Sun, RotateCcw } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { useTheme } from "next-themes";
import { useState, useEffect, useRef } from "react";
import { useAppearance, IconStyle, IconSize, MIN_TEXT_SIZE, MAX_TEXT_SIZE, MIN_BRIGHTNESS, MAX_BRIGHTNESS } from "@/contexts/AppearanceContext";
import SettingsIcon from "@/components/settings/SettingsIcon";
import { useScheduledTheme } from "@/hooks/useScheduledTheme";
import ScheduleTimePicker from "@/components/settings/ScheduleTimePicker";
import ScheduleTypeSelector from "@/components/settings/ScheduleTypeSelector";
import themePresetsIcon from "@/assets/icons/theme-presets.png";
import POSThemePreview from "@/components/settings/POSThemePreview";
import AdvancedCustomizationContent from "@/components/settings/AdvancedCustomizationContent";
import { toast } from "@/hooks/use-toast";

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
        right: window.innerWidth - rect.right,
      });
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
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
        className="flex items-center gap-2"
      >
        <span className="text-lg text-neutral-400">{value}</span>
        <ChevronRight className="w-5 h-5 text-neutral-500" />
      </button>
      
      {isOpen && (
        <>
          {/* Backdrop overlay */}
          <div 
            className="fixed inset-0 z-[100] bg-black/40"
            onClick={onClose}
          />
          
          {/* Dropdown dialog - matches reference exactly */}
          <div 
            ref={dropdownRef}
            className="fixed z-[101] bg-neutral-800 rounded-xl overflow-hidden shadow-2xl w-[160px] animate-in fade-in-0 zoom-in-95 duration-150"
            style={{
              top: position.top,
              right: position.right,
            }}
          >
            {options.map((option) => (
              <button
                key={option}
                onClick={() => {
                  onChange(option);
                  onClose();
                }}
                className="w-full text-left px-6 py-3.5 text-[17px] font-medium text-white hover:bg-neutral-700 active:bg-neutral-700 transition-colors border-b border-neutral-700 last:border-b-0"
              >
                {option}
              </button>
            ))}
          </div>
        </>
      )}
    </>
  );
}

const AppearanceSettings = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { iconStyle, setIconStyle, iconSize, setIconSize, textSize, setTextSize, boldText, setBoldText, brightness, setBrightness, resetAdvancedCustomization } = useAppearance();
  
  // State for all settings
  const [selectedTheme, setSelectedTheme] = useState<ThemeOption>('dark');
  const [automaticTheme, setAutomaticTheme] = useState(false);
  const { scheduleEnabled, scheduleType, lightStart, lightEnd, setScheduleEnabled, setScheduleType, setLightStart, setLightEnd } = useScheduledTheme();
  
  // Dropdown states
  const [iconStyleDropdownOpen, setIconStyleDropdownOpen] = useState(false);
  const [iconSizeDropdownOpen, setIconSizeDropdownOpen] = useState(false);

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
    <div className="min-h-screen bg-background">
      <div className="px-4 pt-4 pb-8 max-w-2xl mx-auto">
        {/* Header with back button, title, and AI icon */}
        <div className="flex items-center justify-between mb-8 overflow-visible relative" style={{ minHeight: 40 }}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              navigate('/settings/system');
            }}
            className="w-10 h-10 rounded-full bg-neutral-800/60 flex items-center justify-center active:opacity-70 transition-opacity z-10"
          >
            <ChevronLeft className="w-4 h-4 text-foreground" />
          </button>
          <h1 className="text-xl font-semibold text-foreground absolute left-1/2 -translate-x-1/2">Appearance</h1>
        </div>

        {/* App Theme Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4 px-1">
            <h2 className="text-base font-medium text-neutral-500">App Theme</h2>
            <button
              type="button"
              onClick={() => {
                resetAdvancedCustomization();
                toast({ title: "Restored to default", description: "Appearance settings have been restored to defaults." });
              }}
              className="flex items-center gap-2 px-3 h-8 rounded-full bg-neutral-800/60 text-foreground text-xs font-medium hover:bg-neutral-700/60 active:opacity-70 transition-opacity"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Restore to default
            </button>
          </div>
          
          <div className="bg-neutral-800/60 rounded-2xl p-4 w-full">
            <div className="flex items-start justify-center gap-12 w-full mb-4 py-2">
              <div className="w-[120px] sm:w-[130px] md:w-[140px]">
                <POSThemePreview 
                  variant="light" 
                  isSelected={selectedTheme === 'light'}
                  onClick={() => handleThemeChange('light')}
                />
              </div>
              <div className="w-[120px] sm:w-[130px] md:w-[140px]">
                <POSThemePreview 
                  variant="dark" 
                  isSelected={selectedTheme === 'dark'}
                  onClick={() => handleThemeChange('dark')}
                />
              </div>
            </div>
            
            {/* Divider */}
            <div className="h-px bg-neutral-700/50 mb-4" />
            
            {/* Automatic Toggle */}
            <div className="flex items-center justify-between">
              <span className="text-lg font-medium text-foreground">Automatic</span>
              <Switch 
                checked={automaticTheme} 
                onCheckedChange={handleAutomaticToggle}
              />
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
          
          {/* Description */}
          <p className="text-sm text-neutral-500 mt-3 px-1 leading-relaxed">
            {automaticTheme 
              ? "Theme switches automatically at the scheduled times."
              : "Automatically switches between light and dark mode based on your device settings."}
          </p>
        </div>

        {/* Icon Style & Size Section */}
        <div className="bg-neutral-800/60 rounded-2xl overflow-hidden mb-1">
          {/* Icon Style */}
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
              onClose={() => setIconStyleDropdownOpen(false)}
            />
          </div>
          
          {/* Divider */}
          <div className="h-px bg-neutral-700/50 mx-5" />
          
          {/* Icon Size */}
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
              onClose={() => setIconSizeDropdownOpen(false)}
            />
          </div>
        </div>
        <p className="text-sm text-neutral-500 mt-1.5 px-1 mb-6 leading-relaxed">
          Select the visual style of icons used in the Point of Sale.
        </p>

        {/* Text Size & Bold Section */}
        <div className="bg-neutral-800/60 rounded-2xl overflow-hidden mb-1">
          {/* Text Size with Slider */}
          <div className="py-4 px-5">
            <span className="text-lg font-medium text-foreground block mb-4">Text Size</span>
            <div className="flex items-center gap-4">
              <span className="text-sm text-neutral-400 font-medium flex-shrink-0">A</span>
              <div className="flex-1">
                <Slider
                  value={[textSize]}
                  onValueChange={(value) => setTextSize(value[0])}
                  min={MIN_TEXT_SIZE}
                  max={MAX_TEXT_SIZE}
                  step={1}
                  className="w-full"
                />
              </div>
              <span className="text-2xl text-foreground font-medium flex-shrink-0">A</span>
            </div>
          </div>
          
          <div className="h-px bg-neutral-700/50 mx-5" />
          
          <div className="flex items-center justify-between py-4 px-5">
            <span className="text-lg font-medium text-foreground">Bold text</span>
            <Switch 
              checked={boldText} 
              onCheckedChange={setBoldText}
            />
          </div>
        </div>
        <p className="text-sm text-neutral-500 mt-1.5 px-1 mb-6 leading-relaxed">
          Change the size of text across the Point of Sale. This improves readability for staff and reduces order mistakes.
        </p>

        {/* Brightness Section */}
        <div className="mb-4">
          <h2 className="text-base font-medium text-neutral-500 mb-4 px-1">Brightness</h2>
          
          <div className="bg-neutral-800/60 rounded-2xl p-5">
            <div className="flex items-center gap-4">
              {/* Small sun icon */}
              <Sun className="w-5 h-5 text-neutral-400 flex-shrink-0" strokeWidth={1.5} />
              
              {/* Slider */}
              <div className="flex-1">
                <Slider
                  value={[brightness]}
                  onValueChange={(value) => setBrightness(value[0])}
                  min={MIN_BRIGHTNESS}
                  max={MAX_BRIGHTNESS}
                  step={1}
                  className="w-full"
                />
              </div>
              
              {/* Large sun icon */}
              <Sun className="w-7 h-7 text-neutral-300 flex-shrink-0" strokeWidth={1.5} />
            </div>
          </div>
          
          {/* Description */}
          <p className="text-sm text-neutral-500 mt-3 px-1 leading-relaxed">
            Adjust screen brightness for better visibility in different lighting conditions.
          </p>
        </div>

        {/* Theme Presets */}
        <div className="bg-neutral-800/60 rounded-full overflow-hidden mb-1.5">
          <button
            onClick={() => navigate('/settings/system/theme-presets')}
            className="flex items-center justify-between w-full py-3.5 px-4 active:opacity-70 transition-opacity"
          >
            <div className="flex items-center gap-4">
              <SettingsIcon bgColor="#F59E0B" iconSrc={themePresetsIcon} iconAlt="Theme Presets" />
              <span className="text-foreground text-lg font-medium">Theme Presets</span>
            </div>
            <ChevronRight className="w-5 h-5 text-neutral-500" />
          </button>
        </div>
        <p className="text-xs text-neutral-500 mb-6 px-1">
          Choose from a variety of layout styles to customize your Point of Sale interface.
        </p>

        {/* Fonts */}
        <div className="bg-neutral-800/60 rounded-full overflow-hidden mb-1.5">
          <button
            onClick={() => navigate('/settings/system/fonts')}
            className="flex items-center justify-between w-full py-3.5 px-4 active:opacity-70 transition-opacity"
          >
            <div className="flex items-center gap-4">
              <SettingsIcon bgColor="#6366F1">
                <span className="text-white text-lg font-bold">Aa</span>
              </SettingsIcon>
              <span className="text-foreground text-lg font-medium">Fonts</span>
            </div>
            <ChevronRight className="w-5 h-5 text-neutral-500" />
          </button>
        </div>
        <p className="text-xs text-neutral-500 px-1 mb-6">
          Select a font family to personalize the look and feel of your display.
        </p>

        {/* Advanced Customization */}
        <AdvancedCustomizationContent />
      </div>
    </div>
  );
};

export default AppearanceSettings;
