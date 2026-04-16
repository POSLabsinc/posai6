import { useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Search, Mic, ChevronRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAppearance, iconContainerSizeMap } from "@/contexts/AppearanceContext";
import { useDeviceAuth } from "@/hooks/useDeviceAuth";
import { format } from "date-fns";

// Import custom icons
import systemIcon from "@/assets/icons/settings-system.png";
 import AnimatedAIIcon from "@/components/AnimatedAIIcon";
import paymentsIcon from "@/assets/icons/settings-payments.png";
import menuIcon from "@/assets/icons/settings-menu.png";

import endOfDayIcon from "@/assets/icons/settings-end-of-day.png";
import guestBookIcon from "@/assets/icons/settings-guest-book.png";
import workforceIcon from "@/assets/icons/settings-workforce.png";
import reportsIcon from "@/assets/icons/settings-reports.png";
import notificationsIcon from "@/assets/icons/settings-notifications.png";
import hardwareIcon from "@/assets/icons/settings-hardware.png";
import networkIcon from "@/assets/icons/settings-network.png";
import supportIcon from "@/assets/icons/settings-support.png";

interface SettingsItemData {
  id: string;
  iconSrc: string;
  label: string;
  iconBgColor: string;
  group: string;
}

interface SettingsItemProps {
  iconSrc: string;
  label: string;
  iconBgColor: string;
  onClick?: () => void;
  showArrow?: boolean;
}

// Desktop/Tablet version of settings item (no arrow, no container)
const SettingsItem = ({ iconSrc, label, iconBgColor, onClick, isActive, tourId }: SettingsItemProps & { isActive?: boolean; tourId?: string }) => {
  const { getIconBgColor } = useAppearance();
  
  return (
    <button
      onClick={onClick}
      data-tour={tourId}
      className={`flex items-center gap-3.5 w-full py-[0.55rem] px-3 active:opacity-70 transition-all rounded-full settings-nav-item ${isActive ? 'settings-nav-active text-foreground' : ''}`}
    >
      <div 
        className="w-[2.15rem] h-[2.15rem] rounded-[0.55rem] flex items-center justify-center flex-shrink-0 transition-all"
        style={{ backgroundColor: getIconBgColor(iconBgColor) }}
      >
        <img src={iconSrc} alt={label} className="w-[1.25rem] h-[1.25rem] object-contain transition-all" />
      </div>
      <span className="text-[0.95rem] font-medium text-foreground leading-tight">{label}</span>
    </button>
  );
};

// Mobile version of settings item (with arrow)
const MobileSettingsItem = ({ iconSrc, label, iconBgColor, onClick, tourId }: SettingsItemProps & { tourId?: string }) => {
  const { getIconBgColor } = useAppearance();
  
  return (
    <button
      onClick={onClick}
      data-tour={tourId}
      className="flex items-center justify-between w-full py-3 px-4 active:opacity-70 transition-opacity"
    >
      <div className="flex items-center gap-3.5">
        <div 
          className="w-[2.25rem] h-[2.25rem] rounded-[0.6rem] flex items-center justify-center flex-shrink-0 transition-all"
          style={{ backgroundColor: getIconBgColor(iconBgColor) }}
        >
          <img src={iconSrc} alt={label} className="w-[1.3rem] h-[1.3rem] object-contain transition-all" />
        </div>
        <span className="text-foreground text-[1.05rem] font-medium">{label}</span>
      </div>
      <ChevronRight className="w-5 h-5 text-neutral-500" />
    </button>
  );
};

// Tablet/Desktop/Mobile settings items (unified)
const allSettingsItems: SettingsItemData[] = [
  { id: "system", iconSrc: systemIcon, label: "System", iconBgColor: "#34A885", group: "main" },
  { id: "payments", iconSrc: paymentsIcon, label: "Payments", iconBgColor: "#4200FF", group: "main" },
  { id: "menu", iconSrc: menuIcon, label: "Menu", iconBgColor: "#F82536", group: "main" },
  
  { id: "end-of-day", iconSrc: endOfDayIcon, label: "End of Day", iconBgColor: "#7300FF", group: "main" },
  { id: "guest-book", iconSrc: guestBookIcon, label: "Guest Book", iconBgColor: "#F9900E", group: "main" },
  { id: "workforce", iconSrc: workforceIcon, label: "Workforce", iconBgColor: "#800080", group: "main" },
  { id: "reports-analytics", iconSrc: reportsIcon, label: "Reports & Analytics", iconBgColor: "#606060", group: "main" },
  { id: "notifications", iconSrc: notificationsIcon, label: "Notifications", iconBgColor: "#ED1C24", group: "system" },
  { id: "hardware", iconSrc: hardwareIcon, label: "Hardware", iconBgColor: "#5E4DD8", group: "system" },
  { id: "network", iconSrc: networkIcon, label: "Network", iconBgColor: "#5AB0EE", group: "system" },
  { id: "support", iconSrc: supportIcon, label: "Support", iconBgColor: "#FF0028", group: "system" },
];

interface SettingsNavigationProps {
  onUserProfileClick?: () => void;
  onSettingsItemClick?: (itemId: string) => void;
  onAIClick?: () => void;
}

const SettingsNavigation = ({ onUserProfileClick, onSettingsItemClick, onAIClick }: SettingsNavigationProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const location = useLocation();
  const { clockInSession } = useDeviceAuth();

  const employeeName = clockInSession?.employeeName || "Employee";
  const employeeRole = clockInSession?.employeeRole || "Server";
  const employeeAvatar = clockInSession?.employeeAvatar || "";
  const employeeInitials = employeeName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  const clockInTimeFormatted = clockInSession?.loginTime
    ? format(new Date(clockInSession.loginTime), "h:mm a")
    : null;

  const activeItemId = useMemo(() => {
    const path = location.pathname;
    if (path.startsWith('/settings/system')) return 'system';
    if (path.startsWith('/settings/payments')) return 'payments';
    if (path.startsWith('/settings/menu')) return 'menu';
    
    if (path.startsWith('/settings/end-of-day')) return 'end-of-day';
    if (path.startsWith('/settings/guest-book')) return 'guest-book';
    if (path.startsWith('/settings/notifications')) return 'notifications';
    if (path.startsWith('/settings/hardware')) return 'hardware';
    if (path.startsWith('/settings/network')) return 'network';
    if (path.startsWith('/settings/support')) return 'support';
    if (path.startsWith('/settings/reports')) return 'reports-analytics';
    if (path.startsWith('/settings/workforce')) return 'workforce';
    return null;
  }, [location.pathname]);

  const handleItemClick = (itemId: string) => {
    if (onSettingsItemClick) {
      onSettingsItemClick(itemId);
    } else if (itemId === "system") {
      navigate('/settings/system');
    } else if (itemId === "payments") {
      navigate('/settings/payments');
    } else if (itemId === "menu") {
      navigate('/settings/menu');
    } else if (itemId === "support") {
      navigate('/settings/support');
    } else if (itemId === "network") {
      navigate('/settings/network');
    } else if (itemId === "hardware") {
      navigate('/settings/hardware');
    } else if (itemId === "end-of-day") {
      navigate('/settings/end-of-day');
    } else if (itemId === "guest-book") {
      navigate('/settings/guest-book');
    } else if (itemId === "reports-analytics") {
      navigate('/settings/reports');
    } else if (itemId === "notifications") {
      navigate('/settings/notifications');
    } else if (itemId === "workforce") {
      navigate('/settings/workforce');
    }
  };

  const handleAIClick = () => {
    if (onAIClick) {
      onAIClick();
    } else {
      navigate('/settings/ai-assistant');
    }
  };

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

  const hasResults = filteredItems.length > 0;

  // Mobile Layout
  const MobileLayout = () => (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-32">
        {/* Header */}
        <h1 className="text-3xl font-bold text-foreground mb-5">Settings</h1>

        {/* User Profile Card */}
        <button 
          onClick={onUserProfileClick}
          data-tour="profile"
          className="w-full active:opacity-70 transition-opacity text-left mb-5"
        >
          <div className="bg-surface rounded-2xl overflow-hidden">
            <div className="flex items-center gap-4 p-4">
              <Avatar className="w-14 h-14">
                {employeeAvatar && <AvatarImage src={employeeAvatar} alt={employeeName} />}
                <AvatarFallback className="bg-muted text-foreground">{employeeInitials}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-foreground">{employeeName}</h2>
                <p className="text-sm text-muted-foreground">{employeeRole}</p>
              </div>
            </div>
            <div className="h-px bg-divider mx-4" />
            <div className="px-4 py-3 flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {clockInTimeFormatted ? `Clocked In At ${clockInTimeFormatted}` : "Not Clocked In"}
              </span>
              {clockInTimeFormatted && <span className="w-2 h-2 rounded-full bg-emerald-500"></span>}
            </div>
          </div>
        </button>

        {!hasResults && searchQuery && (
          <div className="bg-surface rounded-2xl p-6 mb-4 text-center">
            <p className="text-muted-foreground">No settings found for "{searchQuery}"</p>
          </div>
        )}

        {/* Main Settings Group */}
        {mainItems.length > 0 && (
          <div className="bg-surface rounded-2xl overflow-hidden mb-4">
            {mainItems.map((item, index) => (
              <div key={item.id}>
                <MobileSettingsItem
                  iconSrc={item.iconSrc}
                  label={item.label}
                  iconBgColor={item.iconBgColor}
                  onClick={() => handleItemClick(item.id)}
                  tourId={item.id}
                />
                {index < mainItems.length - 1 && (
                  <div className="h-px bg-divider mx-4" />
                )}
              </div>
            ))}
          </div>
        )}

        {/* System Settings Group */}
        {systemItems.length > 0 && (
          <div className="bg-surface rounded-2xl overflow-hidden mb-4">
            {systemItems.map((item, index) => (
              <div key={item.id}>
                <MobileSettingsItem
                  iconSrc={item.iconSrc}
                  label={item.label}
                  iconBgColor={item.iconBgColor}
                  onClick={() => handleItemClick(item.id)}
                  tourId={item.id}
                />
                {index < systemItems.length - 1 && (
                  <div className="h-px bg-divider mx-4" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Search Bar with AI Icon outside */}
      <div className="fixed bottom-20 left-4 right-4 z-50">
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-surface/90 backdrop-blur-sm rounded-full px-4 py-2.5 flex items-center gap-3 shadow-lg border border-divider">
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
      </div>
    </div>
  );

  // Tablet/Desktop Layout
  const TabletLayout = () => (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto scrollbar-hide overscroll-contain p-4 pb-8">
        {/* Header */}
        <h1 className="text-3xl font-bold text-foreground mb-6">Settings</h1>

        {/* Inline Search Bar with AI Icon outside */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex-1 min-w-0 bg-surface rounded-full px-4 py-2 flex items-center gap-3">
            <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 min-w-0 bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-base"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="p-1 active:opacity-70 transition-opacity text-muted-foreground text-sm flex-shrink-0"
              >
                Clear
              </button>
            )}
            <button className="p-1 active:opacity-70 transition-opacity flex-shrink-0">
              <Mic className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* User Profile Card */}
        <button 
          onClick={onUserProfileClick}
          data-tour="profile"
          className="w-full active:opacity-70 transition-opacity text-left mb-6"
        >
          <div className="flex items-center gap-4">
            <Avatar className="w-12 h-12">
              {employeeAvatar && <AvatarImage src={employeeAvatar} alt={employeeName} />}
              <AvatarFallback className="bg-muted text-foreground">{employeeInitials}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-base font-semibold text-foreground">{employeeName}</h2>
              <p className="text-sm text-muted-foreground">{employeeRole}</p>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-2 pl-16">
            <span className="text-sm text-muted-foreground">
              {clockInTimeFormatted ? `Clocked In At ${clockInTimeFormatted}` : "Not Clocked In"}
            </span>
            {clockInTimeFormatted && <span className="w-2 h-2 rounded-full bg-emerald-500"></span>}
          </div>
        </button>


        {!hasResults && searchQuery && (
          <div className="bg-surface rounded-2xl p-6 mb-4 text-center">
            <p className="text-muted-foreground">No settings found for "{searchQuery}"</p>
          </div>
        )}

        {/* Main Settings Group */}
        {mainItems.length > 0 && (
          <div className="mb-6">
            {mainItems.map(item => (
              <SettingsItem
                key={item.id}
                iconSrc={item.iconSrc}
                label={item.label}
                iconBgColor={item.iconBgColor}
                onClick={() => handleItemClick(item.id)}
                isActive={activeItemId === item.id}
                tourId={item.id}
              />
            ))}
          </div>
        )}

        {/* System Settings Group */}
        {systemItems.length > 0 && (
          <div>
            {systemItems.map(item => (
              <SettingsItem
                key={item.id}
                iconSrc={item.iconSrc}
                label={item.label}
                iconBgColor={item.iconBgColor}
                onClick={() => handleItemClick(item.id)}
                isActive={activeItemId === item.id}
                tourId={item.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return isMobile ? <MobileLayout /> : <TabletLayout />;
};

export default SettingsNavigation;
