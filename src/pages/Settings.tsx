import { useState, useMemo, useCallback } from "react";
import { ChevronRight, Users, Sliders, UtensilsCrossed, CreditCard, UsersRound, FileText, Wifi, Monitor, Search, Mic, Bell, Headphones, UserCheck, Layout, Lock, ArrowLeft, ArrowRight, ArrowUp, ArrowDown, RotateCcw, Smartphone, ArrowLeftRight, Sun, Moon, Laptop, Sunrise, MoonStar, Palette, Type, Eye, Sparkles, Store } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { useSidebarPosition, SidebarPosition } from "@/contexts/SidebarPositionContext";
import { usePanelPosition } from "@/contexts/PanelPositionContext";
import { useAppTheme, AccentColor, FontSize, RestaurantPreset } from "@/contexts/ThemeContext";
import { toast } from "@/hooks/use-toast";
import { useShake } from "@/hooks/use-shake";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SettingsItemData {
  id: string;
  icon: React.ReactNode;
  label: string;
  iconBgColor: string;
  group: string;
}

interface SettingsItemProps {
  icon: React.ReactNode;
  label: string;
  iconBgColor: string;
  onClick?: () => void;
  rightElement?: React.ReactNode;
}

const SettingsItem = ({ icon, label, iconBgColor, onClick, rightElement, className }: SettingsItemProps & { className?: string }) => (
  <button
    onClick={onClick}
    className={`group flex items-center justify-between w-full py-3 px-1 border-b border-white/10 last:border-b-0 active:opacity-70 transition-opacity ${className || ''}`}
  >
    <div className="flex items-center gap-4">
      <div 
        className="w-10 h-10 rounded-lg flex items-center justify-center"
        style={{ backgroundColor: iconBgColor }}
      >
        {icon}
      </div>
      <span className="text-foreground text-base font-medium">{label}</span>
    </div>
    {rightElement || <ChevronRight className="w-5 h-5 text-muted-foreground" />}
  </button>
);

const allSettingsItems: SettingsItemData[] = [
  { id: "general", icon: <Users className="w-5 h-5 text-white" />, label: "General", iconBgColor: "hsl(165, 60%, 40%)", group: "main" },
  { id: "control-center", icon: <Sliders className="w-5 h-5 text-white" />, label: "Control Center", iconBgColor: "hsl(270, 70%, 55%)", group: "main" },
  { id: "menu", icon: <UtensilsCrossed className="w-5 h-5 text-white" />, label: "Menu", iconBgColor: "hsl(25, 95%, 53%)", group: "main" },
  { id: "payments", icon: <CreditCard className="w-5 h-5 text-white" />, label: "Payments", iconBgColor: "hsl(250, 70%, 55%)", group: "main" },
  { id: "workforce", icon: <UsersRound className="w-5 h-5 text-white" />, label: "Workforce", iconBgColor: "hsl(0, 0%, 45%)", group: "main" },
  { id: "sales-report", icon: <FileText className="w-5 h-5 text-white" />, label: "Sales Summary Report", iconBgColor: "hsl(0, 0%, 35%)", group: "main" },
  { id: "network", icon: <Wifi className="w-5 h-5 text-white" />, label: "Network", iconBgColor: "hsl(190, 80%, 50%)", group: "system" },
  { id: "hardware", icon: <Monitor className="w-5 h-5 text-white" />, label: "Hardware", iconBgColor: "hsl(300, 60%, 45%)", group: "system" },
  { id: "notifications", icon: <Bell className="w-5 h-5 text-white" />, label: "Notifications", iconBgColor: "hsl(0, 0%, 40%)", group: "support" },
  { id: "customer-support", icon: <Headphones className="w-5 h-5 text-white" />, label: "Customer Support", iconBgColor: "hsl(0, 75%, 50%)", group: "support" },
  { id: "switch-user", icon: <UserCheck className="w-5 h-5 text-white" />, label: "Switch User", iconBgColor: "hsl(0, 0%, 30%)", group: "user" },
];

const positionIcons: Record<SidebarPosition, React.ReactNode> = {
  left: <ArrowLeft className="w-4 h-4" />,
  right: <ArrowRight className="w-4 h-4" />,
  top: <ArrowUp className="w-4 h-4" />,
  bottom: <ArrowDown className="w-4 h-4" />,
};

// Color mode options
const colorModes = [
  { id: "light", icon: Sun, label: "Light" },
  { id: "dark", icon: Moon, label: "Dark" },
  { id: "system", icon: Laptop, label: "System" },
];

// Accent color options
const accentColors: { id: AccentColor; color: string; label: string }[] = [
  { id: "orange", color: "hsl(25, 95%, 53%)", label: "Orange" },
  { id: "blue", color: "hsl(217, 91%, 60%)", label: "Blue" },
  { id: "green", color: "hsl(142, 76%, 36%)", label: "Green" },
  { id: "purple", color: "hsl(270, 70%, 55%)", label: "Purple" },
  { id: "red", color: "hsl(0, 84%, 60%)", label: "Red" },
  { id: "teal", color: "hsl(173, 80%, 40%)", label: "Teal" },
];

// Font size options
const fontSizes: { id: FontSize; label: string }[] = [
  { id: "small", label: "S" },
  { id: "medium", label: "M" },
  { id: "large", label: "L" },
];

// Restaurant presets
const restaurantPresets: { id: RestaurantPreset; label: string; description: string }[] = [
  { id: "custom", label: "Custom", description: "Your custom settings" },
  { id: "fine-dining", label: "Fine Dining", description: "Elegant purple theme" },
  { id: "fast-casual", label: "Fast Casual", description: "Energetic red theme" },
  { id: "coffee-shop", label: "Coffee Shop", description: "Calm teal theme" },
  { id: "bar-grill", label: "Bar & Grill", description: "Warm orange theme" },
];

const Settings = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showResetDialog, setShowResetDialog] = useState(false);
  const { position, setPosition, isLocked, setIsLocked, resetToDefaults } = useSidebarPosition();
  const { panelLayout, togglePanelLayout, resetPanelLayout } = usePanelPosition();
  const {
    colorMode,
    setColorMode,
    accentColor,
    setAccentColor,
    fontSize,
    setFontSize,
    highContrast,
    setHighContrast,
    reduceAnimations,
    setReduceAnimations,
    restaurantPreset,
    setRestaurantPreset,
    resetThemeSettings,
  } = useAppTheme();

  // Shake to reset gesture
  const handleShake = useCallback(() => {
    setShowResetDialog(true);
    toast({
      title: "Shake Detected",
      description: "Opening reset dialog...",
      duration: 1500,
    });
  }, []);

  useShake({ onShake: handleShake, threshold: 15, timeout: 1500 });

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return allSettingsItems;
    const query = searchQuery.toLowerCase();
    return allSettingsItems.filter(item => 
      item.label.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const getGroupItems = (group: string) => 
    filteredItems.filter(item => item.group === group);

  const mainItems = getGroupItems("main");
  const systemItems = getGroupItems("system");
  const supportItems = getGroupItems("support");
  const userItems = getGroupItems("user");

  const hasResults = filteredItems.length > 0;

  const handleLockToggle = (checked: boolean) => {
    setIsLocked(checked);
    toast({
      title: checked ? "Sidebar Locked" : "Sidebar Unlocked",
      description: checked ? "Sidebar position is now locked." : "You can now drag the sidebar to reposition it.",
      duration: 2000,
    });
  };

  const handlePositionChange = (newPosition: SidebarPosition) => {
    if (isLocked) {
      toast({
        title: "Sidebar Locked",
        description: "Unlock the sidebar first to change its position.",
        duration: 2000,
      });
      return;
    }
    setPosition(newPosition);
    toast({
      title: "Sidebar Moved",
      description: `Sidebar moved to ${newPosition}.`,
      duration: 2000,
    });
  };

  const handleResetToDefaults = () => {
    setShowResetDialog(true);
  };

  const confirmReset = () => {
    resetToDefaults();
    resetThemeSettings();
    setShowResetDialog(false);
    toast({
      title: "Reset Complete",
      description: "All settings have been reset to defaults.",
      duration: 2000,
    });
  };

  const handleColorModeChange = (mode: string) => {
    setColorMode(mode);
    toast({
      title: "Theme Changed",
      description: `Switched to ${mode} mode.`,
      duration: 1500,
    });
  };

  const handleAccentColorChange = (color: AccentColor) => {
    setAccentColor(color);
    toast({
      title: "Accent Color Changed",
      description: `Accent color set to ${color}.`,
      duration: 1500,
    });
  };

  const handleFontSizeChange = (size: FontSize) => {
    setFontSize(size);
    toast({
      title: "Font Size Changed",
      description: `Font size set to ${size}.`,
      duration: 1500,
    });
  };

  const handlePresetChange = (preset: RestaurantPreset) => {
    setRestaurantPreset(preset);
    if (preset !== "custom") {
      toast({
        title: "Preset Applied",
        description: `${restaurantPresets.find(p => p.id === preset)?.label} theme applied.`,
        duration: 1500,
      });
    }
  };

  return (
    <div className="min-h-screen p-4 pb-28 overflow-y-auto">
      {/* Header */}
      <h1 className="text-3xl font-bold text-foreground mb-6">Settings</h1>

      {/* User Profile Card */}
      <div className="bg-neutral-900 border border-white/10 rounded-2xl p-4 mb-4">
        <div className="flex items-center gap-4 pb-4 border-b border-white/10">
          <Avatar className="w-14 h-14">
            <AvatarImage src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face" alt="Jim Hopper" />
            <AvatarFallback className="bg-muted text-foreground">JH</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Jim Hopper</h2>
            <p className="text-sm text-muted-foreground">Executive Assistant Manager</p>
          </div>
        </div>
        <div className="pt-4 flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Clocked In At 10:00 AM</span>
          <span className="w-2.5 h-2.5 rounded-full bg-theme-accent"></span>
        </div>
      </div>

      {/* Appearance Settings */}
      <div className="bg-neutral-900 border border-white/10 rounded-2xl px-4 mb-4">
        <div className="py-4 border-b border-white/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500">
              <Palette className="w-5 h-5 text-white" />
            </div>
            <span className="text-foreground text-base font-semibold">Appearance</span>
          </div>
          
          {/* Color Mode */}
          <div className="mb-4">
            <label className="text-sm text-muted-foreground mb-2 block">Color Mode</label>
            <div className="flex gap-2">
              {colorModes.map(mode => (
                <button
                  key={mode.id}
                  onClick={() => handleColorModeChange(mode.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                    colorMode === mode.id
                      ? 'bg-theme-accent text-white'
                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                >
                  <mode.icon className="w-4 h-4" />
                  <span className="text-sm">{mode.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Accent Color */}
          <div className="mb-4">
            <label className="text-sm text-muted-foreground mb-2 block">Accent Color</label>
            <div className="flex gap-2">
              {accentColors.map(color => (
                <button
                  key={color.id}
                  onClick={() => handleAccentColorChange(color.id)}
                  title={color.label}
                  className={`w-9 h-9 rounded-full transition-all ${
                    accentColor === color.id
                      ? 'ring-2 ring-white ring-offset-2 ring-offset-neutral-900 scale-110'
                      : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: color.color }}
                />
              ))}
            </div>
          </div>

          {/* Font Size */}
          <div className="mb-4">
            <label className="text-sm text-muted-foreground mb-2 block">Font Size</label>
            <div className="flex gap-2">
              {fontSizes.map(size => (
                <button
                  key={size.id}
                  onClick={() => handleFontSizeChange(size.id)}
                  className={`w-10 h-10 rounded-lg font-semibold transition-all ${
                    fontSize === size.id
                      ? 'bg-theme-accent text-white'
                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                >
                  {size.label}
                </button>
              ))}
            </div>
          </div>

          {/* Restaurant Preset */}
          <div className="mb-4">
            <label className="text-sm text-muted-foreground mb-2 block">Restaurant Preset</label>
            <Select value={restaurantPreset} onValueChange={(val) => handlePresetChange(val as RestaurantPreset)}>
              <SelectTrigger className="w-full bg-white/10 border-white/10">
                <SelectValue placeholder="Select a preset" />
              </SelectTrigger>
              <SelectContent className="bg-neutral-900 border-white/10">
                {restaurantPresets.map(preset => (
                  <SelectItem key={preset.id} value={preset.id} className="hover:bg-white/10">
                    <div className="flex flex-col">
                      <span>{preset.label}</span>
                      <span className="text-xs text-muted-foreground">{preset.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Accessibility Options */}
        <div className="py-4">
          <SettingsItem
            icon={<Eye className="w-5 h-5 text-white" />}
            label="High Contrast"
            iconBgColor="hsl(0, 0%, 30%)"
            rightElement={
              <Switch 
                checked={highContrast} 
                onCheckedChange={(checked) => {
                  setHighContrast(checked);
                  toast({
                    title: checked ? "High Contrast Enabled" : "High Contrast Disabled",
                    duration: 1500,
                  });
                }}
                onClick={(e) => e.stopPropagation()}
              />
            }
          />
          <SettingsItem
            icon={<Sparkles className="w-5 h-5 text-white" />}
            label="Reduce Animations"
            iconBgColor="hsl(45, 90%, 50%)"
            rightElement={
              <Switch 
                checked={reduceAnimations} 
                onCheckedChange={(checked) => {
                  setReduceAnimations(checked);
                  toast({
                    title: checked ? "Animations Reduced" : "Animations Enabled",
                    duration: 1500,
                  });
                }}
                onClick={(e) => e.stopPropagation()}
              />
            }
          />
        </div>
      </div>

      {/* Display Settings Group */}
      <div className="bg-neutral-900 border border-white/10 rounded-2xl px-4 mb-4">
        <SettingsItem
          icon={<Layout className="w-5 h-5 text-white" />}
          label="Lock Sidebar Position"
          iconBgColor="hsl(45, 90%, 50%)"
          rightElement={
            <Switch 
              checked={isLocked} 
              onCheckedChange={handleLockToggle}
              onClick={(e) => e.stopPropagation()}
            />
          }
        />
        <SettingsItem
          icon={<Lock className="w-5 h-5 text-white" />}
          label="Sidebar Position"
          iconBgColor="hsl(200, 70%, 50%)"
          rightElement={
            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              {(['left', 'top', 'right', 'bottom'] as SidebarPosition[]).map((pos) => (
                <button
                  key={pos}
                  onClick={() => handlePositionChange(pos)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                    position === pos 
                      ? 'bg-theme-accent text-white' 
                      : 'bg-white/10 text-white/60 hover:bg-white/20'
                  } ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                  title={`Move to ${pos}`}
                >
                  {positionIcons[pos]}
                </button>
              ))}
            </div>
          }
        />
        <SettingsItem
          icon={<ArrowLeftRight className="w-5 h-5 text-white" />}
          label="Swap Panel Layout"
          iconBgColor="hsl(220, 60%, 50%)"
          onClick={togglePanelLayout}
          rightElement={
            <span className="text-xs text-muted-foreground bg-white/10 px-2 py-1 rounded">
              {panelLayout === 'menu-left' ? 'Menu ← | → Order' : 'Order ← | → Menu'}
            </span>
          }
        />
        <SettingsItem
          icon={<RotateCcw className="w-5 h-5 text-white group-hover:animate-shake" />}
          label="Reset All Settings"
          iconBgColor="hsl(0, 0%, 40%)"
          onClick={handleResetToDefaults}
        />
        <div className="flex items-center gap-3 py-3 px-1 text-muted-foreground text-sm">
          <Smartphone className="w-4 h-4" />
          <span>Tip: Shake your device to reset</span>
        </div>
      </div>

      {!hasResults && searchQuery && (
        <div className="bg-neutral-900 border border-white/10 rounded-2xl p-6 mb-4 text-center">
          <p className="text-muted-foreground">No settings found for "{searchQuery}"</p>
        </div>
      )}

      {/* Main Settings Group */}
      {mainItems.length > 0 && (
        <div className="bg-neutral-900 border border-white/10 rounded-2xl px-4 mb-4">
          {mainItems.map(item => (
            <SettingsItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              iconBgColor={item.iconBgColor}
            />
          ))}
        </div>
      )}

      {/* System Settings Group */}
      {systemItems.length > 0 && (
        <div className="bg-neutral-900 border border-white/10 rounded-2xl px-4 mb-4">
          {systemItems.map(item => (
            <SettingsItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              iconBgColor={item.iconBgColor}
            />
          ))}
        </div>
      )}

      {/* Notifications & Support Group */}
      {supportItems.length > 0 && (
        <div className="bg-neutral-900 border border-white/10 rounded-2xl px-4 mb-4">
          {supportItems.map(item => (
            <SettingsItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              iconBgColor={item.iconBgColor}
            />
          ))}
        </div>
      )}

      {/* Switch User Group */}
      {userItems.length > 0 && (
        <div className="bg-neutral-900 border border-white/10 rounded-2xl px-4 mb-4">
          {userItems.map(item => (
            <SettingsItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              iconBgColor={item.iconBgColor}
            />
          ))}
        </div>
      )}

      {/* Floating Search Bar - Fixed on mobile above bottom nav */}
      <div className="fixed bottom-16 left-4 right-4 md:relative md:bottom-auto md:left-auto md:right-auto md:mt-0 z-50">
        <div className="bg-neutral-900 border border-white/10 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-lg md:shadow-none">
          <Search className="w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-base"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery("")}
              className="p-1 active:opacity-70 transition-opacity text-muted-foreground text-sm"
            >
              Clear
            </button>
          )}
          <button className="p-1 active:opacity-70 transition-opacity">
            <Mic className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </div>
      {/* Reset Confirmation Dialog */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent className="bg-neutral-900 border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle>Reset All Settings?</AlertDialogTitle>
            <AlertDialogDescription>
              This will reset all settings including theme, sidebar position, and layout preferences to defaults. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/10 border-white/10 hover:bg-white/20">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmReset} className="bg-theme-accent hover:opacity-90">
              Reset
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Settings;