import dinnerIcon from "@/assets/icons/dinner.png";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import localHostIcon from "@/assets/icons/local-host.png";
import refreshIcon from "@/assets/icons/refresh.png";
import notificationIcon from "@/assets/icons/notification.png";
import wifiIcon from "@/assets/icons/wifi.png";
import supportIcon from "@/assets/icons/support.png";
import switchUserIcon from "@/assets/icons/switch-user.png";
import { Sun, Moon, Laptop, Check } from "lucide-react";
import { useAppTheme, AccentColor } from "@/contexts/ThemeContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const colorModes = [
  { id: "light", icon: Sun, label: "Light" },
  { id: "dark", icon: Moon, label: "Dark" },
  { id: "system", icon: Laptop, label: "System" },
];

const accentColors: { id: AccentColor; color: string; label: string }[] = [
  { id: "orange", color: "hsl(25, 95%, 53%)", label: "Orange" },
  { id: "blue", color: "hsl(217, 91%, 60%)", label: "Blue" },
  { id: "green", color: "hsl(142, 76%, 36%)", label: "Green" },
  { id: "purple", color: "hsl(270, 70%, 55%)", label: "Purple" },
  { id: "red", color: "hsl(0, 84%, 60%)", label: "Red" },
  { id: "teal", color: "hsl(173, 80%, 40%)", label: "Teal" },
];

const Header = () => {
  const { colorMode, setColorMode, resolvedColorMode, accentColor, setAccentColor } = useAppTheme();
  const currentMode = resolvedColorMode || "dark";

  return (
    <header className="flex items-center justify-between px-2 md:px-4 py-1.5 md:py-2 bg-header text-header-foreground h-10 md:h-12 flex-shrink-0">
      {/* Left Section */}
      <div className="flex items-center gap-1.5 md:gap-3">
        <button className="p-0.5 md:p-1 hover:bg-sidebar-accent rounded transition-colors">
          <img src={switchUserIcon} alt="Switch User" className="w-4 md:w-5 h-4 md:h-5" />
        </button>
        
        <div className="flex items-center gap-1 md:gap-2 bg-white/10 pl-0 pr-2 md:pr-3 rounded-full">
          <Avatar className="w-6 md:w-8 h-6 md:h-8 border-0">
            <AvatarImage src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face" alt="Mia Jone" />
            <AvatarFallback className="text-xs">MJ</AvatarFallback>
          </Avatar>
          
          <span className="font-medium text-xs md:text-sm">Mia Jone</span>
          
          <div className="hidden md:block w-px h-4 bg-sidebar-foreground/30 mx-1" />
          
          <img src={dinnerIcon} alt="Dinner" className="hidden md:block w-4 h-4" />
          
          <span className="hidden md:inline text-sm">Dinner Service (7:00 PM)</span>
        </div>
      </div>
      
      {/* Right Section */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* Theme Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button 
              className="p-1 md:p-1.5 hover:bg-sidebar-accent rounded-md transition-all duration-300"
              title="Theme settings"
            >
              <div className="relative w-4 md:w-5 h-4 md:h-5">
                <Sun 
                  className={`absolute inset-0 w-4 md:w-5 h-4 md:h-5 transition-all duration-300 ${
                    currentMode === "light" 
                      ? "opacity-100 rotate-0 scale-100" 
                      : "opacity-0 rotate-90 scale-0"
                  }`} 
                />
                <Moon 
                  className={`absolute inset-0 w-4 md:w-5 h-4 md:h-5 transition-all duration-300 ${
                    currentMode === "dark" 
                      ? "opacity-100 rotate-0 scale-100" 
                      : "opacity-0 -rotate-90 scale-0"
                  }`} 
                />
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="end" 
            className="w-48 bg-neutral-900 border-white/10 z-50"
          >
            <DropdownMenuLabel className="text-muted-foreground text-xs">Color Mode</DropdownMenuLabel>
            {colorModes.map((mode) => (
              <DropdownMenuItem
                key={mode.id}
                onSelect={(e) => {
                  e.preventDefault();
                  setColorMode(mode.id);
                }}
                className="flex items-center justify-between cursor-pointer hover:bg-white/10 focus:bg-white/10"
              >
                <div className="flex items-center gap-2">
                  <mode.icon className="w-4 h-4" />
                  <span>{mode.label}</span>
                </div>
                {colorMode === mode.id && <Check className="w-4 h-4 text-theme-accent" />}
              </DropdownMenuItem>
            ))}
            
            <DropdownMenuSeparator className="bg-white/10" />
            
            <DropdownMenuLabel className="text-muted-foreground text-xs">Accent Color</DropdownMenuLabel>
            <div className="flex gap-1.5 px-2 py-2">
              {accentColors.map((color) => (
                <button
                  key={color.id}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setAccentColor(color.id);
                  }}
                  title={color.label}
                  className={`w-6 h-6 rounded-full transition-all ${
                    accentColor === color.id
                      ? 'ring-2 ring-white ring-offset-1 ring-offset-neutral-900 scale-110'
                      : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: color.color }}
                />
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <button className="relative p-0.5 md:p-1 hover:bg-sidebar-accent rounded transition-colors">
          <img src={localHostIcon} alt="Local Host" className="w-4 md:w-5 h-4 md:h-5" />
          <span className="absolute -top-0.5 md:-top-1 -right-0.5 md:-right-1 w-2 md:w-2.5 h-2 md:h-2.5 bg-green-500 rounded-full border border-sidebar" />
        </button>
        
        <button className="hidden md:block p-1 hover:bg-sidebar-accent rounded transition-colors">
          <img src={refreshIcon} alt="Refresh" className="w-5 h-5" />
        </button>
        
        <button className="hidden md:block p-1.5 bg-sidebar-accent rounded-md hover:bg-sidebar-accent/80 transition-colors">
          <img src={supportIcon} alt="Support" className="w-5 h-5" />
        </button>
        
        <button className="p-0.5 md:p-1 hover:bg-sidebar-accent rounded transition-colors">
          <img src={notificationIcon} alt="Notifications" className="w-4 md:w-5 h-4 md:h-5" />
        </button>
        
        <img src={wifiIcon} alt="Wifi" className="w-4 md:w-5 h-4 md:h-5" />
        
        <span className="text-xs md:text-sm font-medium">10:20 AM</span>
      </div>
    </header>
  );
};

export default Header;
