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
        <p className="text-xs text-muted-foreground px-1">
          Choose from a variety of layout styles to customize your Point of Sale interface.
        </p>
      </div>
    </div>);

};

export default AppearanceSettingsContent;