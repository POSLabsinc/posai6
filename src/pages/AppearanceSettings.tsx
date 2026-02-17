import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Check, Sun } from "lucide-react";
import AnimatedAIIcon from "@/components/AnimatedAIIcon";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { useTheme } from "next-themes";
import { useState, useEffect, useRef } from "react";
import { useAppearance, IconStyle, IconSize, MIN_TEXT_SIZE, MAX_TEXT_SIZE, MIN_BRIGHTNESS, MAX_BRIGHTNESS } from "@/contexts/AppearanceContext";
import themePresetsIcon from "@/assets/icons/theme-presets.png";

// Theme preview images
import darkThemePreview from "@/assets/theme-previews/dark-theme.png";
import lightThemePreview from "@/assets/theme-previews/light-theme.png";
import systemThemePreview from "@/assets/theme-previews/system-theme.png";

type ThemeOption = 'dark' | 'light' | 'system';

const ThemePreview = ({ 
  theme, 
  isSelected, 
  previewImage,
  onClick 
}: { 
  theme: string; 
  isSelected: boolean;
  previewImage: string;
  onClick: () => void;
}) => (
  <button 
    onClick={onClick}
    className="flex flex-col items-center gap-2 active:opacity-70 transition-opacity"
  >
    {/* Preview Card */}
    <div 
      className={`w-full aspect-[3/4] rounded-2xl overflow-hidden border-2 ${
        isSelected ? 'border-white' : 'border-transparent'
      }`}
    >
      <img 
        src={previewImage} 
        alt={`${theme} theme preview`}
        className="w-full h-full object-cover"
      />
    </div>
    
    {/* Theme label */}
    <span className="text-base font-medium text-foreground capitalize">{theme}</span>
    
    {/* Radio indicator */}
    <div 
      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
        isSelected 
          ? 'border-white bg-white' 
          : 'border-neutral-500 bg-transparent'
      }`}
    >
      {isSelected && (
        <svg width="12" height="9" viewBox="0 0 14 10" fill="none">
          <path 
            d="M1 5L5 9L13 1" 
            stroke="black" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>
      )}
    </div>
  </button>
);

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
  const { iconStyle, setIconStyle, iconSize, setIconSize, textSize, setTextSize, boldText, setBoldText, brightness, setBrightness } = useAppearance();
  
  // State for all settings
  const [selectedTheme, setSelectedTheme] = useState<ThemeOption>('dark');
  const [automaticTheme, setAutomaticTheme] = useState(false);
  
  // Dropdown states
  const [iconStyleDropdownOpen, setIconStyleDropdownOpen] = useState(false);
  const [iconSizeDropdownOpen, setIconSizeDropdownOpen] = useState(false);

  // Sync with next-themes on mount
  useEffect(() => {
    if (theme === 'light') {
      setSelectedTheme('light');
    } else if (theme === 'system') {
      setSelectedTheme('system');
      setAutomaticTheme(true);
    } else {
      setSelectedTheme('dark');
    }
  }, [theme]);

  const handleThemeChange = (newTheme: ThemeOption) => {
    setSelectedTheme(newTheme);
    setTheme(newTheme);
    
    // Update automatic toggle based on selection
    if (newTheme === 'system') {
      setAutomaticTheme(true);
    } else {
      setAutomaticTheme(false);
    }
  };

  const handleAutomaticToggle = (checked: boolean) => {
    setAutomaticTheme(checked);
    if (checked) {
      setSelectedTheme('system');
      setTheme('system');
    } else {
      // When turning off automatic, default to dark
      setSelectedTheme('dark');
      setTheme('dark');
    }
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
          <h1 className="text-base font-medium text-foreground absolute left-1/2 -translate-x-1/2">Appearance</h1>
          <div className="md:hidden overflow-visible flex items-center justify-center" style={{ width: 40, height: 40 }}>
            <AnimatedAIIcon size={24} onClick={() => navigate('/settings/ai')} />
          </div>
        </div>

        {/* App Theme Section */}
        <div className="mb-6">
          <h2 className="text-base font-medium text-neutral-500 mb-4 px-1">App Theme</h2>
          
          <div className="bg-neutral-800/60 rounded-2xl p-4">
            {/* Theme Options - reduced gap */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <ThemePreview 
                theme="dark" 
                isSelected={selectedTheme === 'dark'}
                previewImage={darkThemePreview}
                onClick={() => handleThemeChange('dark')}
              />
              <ThemePreview 
                theme="light" 
                isSelected={selectedTheme === 'light'}
                previewImage={lightThemePreview}
                onClick={() => handleThemeChange('light')}
              />
              <ThemePreview 
                theme="system" 
                isSelected={selectedTheme === 'system'}
                previewImage={systemThemePreview}
                onClick={() => handleThemeChange('system')}
              />
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
          </div>
          
          {/* Description */}
          <p className="text-sm text-neutral-500 mt-3 px-1 leading-relaxed">
            Automatically switches between light and dark mode based on your device settings.
          </p>
        </div>

        {/* Icon Style & Size Section */}
        <div className="bg-neutral-800/60 rounded-2xl overflow-hidden mb-4">
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

        {/* Text Size & Bold Section */}
        <div className="bg-neutral-800/60 rounded-2xl overflow-hidden mb-6">
          {/* Text Size with Slider */}
          <div className="py-4 px-5">
            <span className="text-lg font-medium text-foreground block mb-4">Text Size</span>
            <div className="flex items-center gap-4">
              {/* Small A indicator */}
              <span className="text-sm text-neutral-400 font-medium flex-shrink-0">A</span>
              
              {/* Slider */}
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
              
              {/* Large A indicator */}
              <span className="text-2xl text-foreground font-medium flex-shrink-0">A</span>
            </div>
          </div>
          
          {/* Divider */}
          <div className="h-px bg-neutral-700/50 mx-5" />
          
          {/* Bold Text */}
          <div className="flex items-center justify-between py-4 px-5">
            <span className="text-lg font-medium text-foreground">Bold text</span>
            <Switch 
              checked={boldText} 
              onCheckedChange={setBoldText}
            />
          </div>
        </div>

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

        {/* Theme Presets & Fonts */}
        <div className="bg-neutral-800/60 rounded-2xl overflow-hidden mb-6">
          <button
            onClick={() => navigate('/settings/system/theme-presets')}
            className="flex items-center justify-between w-full py-3.5 px-4 active:opacity-70 transition-opacity"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#F59E0B" }}>
                <img src={themePresetsIcon} alt="Theme Presets" className="w-5 h-5" />
              </div>
              <span className="text-foreground text-lg font-medium">Theme Presets</span>
            </div>
            <ChevronRight className="w-5 h-5 text-neutral-500" />
          </button>
          
          <div className="h-px bg-neutral-700/50 mx-4" />
          
          <button
            onClick={() => navigate('/settings/system/fonts')}
            className="flex items-center justify-between w-full py-3.5 px-4 active:opacity-70 transition-opacity"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#6366F1" }}>
                <span className="text-white text-lg font-bold">Aa</span>
              </div>
              <span className="text-foreground text-lg font-medium">Fonts</span>
            </div>
            <ChevronRight className="w-5 h-5 text-neutral-500" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AppearanceSettings;
