import { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Search, Mic, ChevronRight, X } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAppearance } from "@/contexts/AppearanceContext";
import { useDeviceAuth } from "@/hooks/useDeviceAuth";
import { searchSettings, groupIconColor, SettingsSearchEntry } from "@/lib/settingsSearchIndex";

// Import custom icons
import systemIcon from "@/assets/icons/settings-system.png";
import accountIcon from "@/assets/icons/account-personal.png";
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

// Map a search entry's group → icon image used in result rows
const groupIcon: Record<SettingsSearchEntry["group"], string> = {
  account: accountIcon,
  system: systemIcon,
  payments: paymentsIcon,
  menu: menuIcon,
  "end-of-day": endOfDayIcon,
  "guest-book": guestBookIcon,
  workforce: workforceIcon,
  "reports-analytics": reportsIcon,
  notifications: notificationsIcon,
  hardware: hardwareIcon,
  network: networkIcon,
  support: supportIcon,
};

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

// A single search-result row (used in both layouts)
const SearchResultRow = ({
  entry,
  onClick,
  size = "default",
}: {
  entry: SettingsSearchEntry;
  onClick: () => void;
  size?: "default" | "compact";
}) => {
  const { getIconBgColor } = useAppearance();
  const iconSize = size === "compact" ? "w-[1.9rem] h-[1.9rem]" : "w-[2.15rem] h-[2.15rem]";
  const imgSize = size === "compact" ? "w-[1.1rem] h-[1.1rem]" : "w-[1.25rem] h-[1.25rem]";
  const labelSize = size === "compact" ? "text-[0.9rem]" : "text-[1rem]";
  const parentSize = size === "compact" ? "text-[0.7rem]" : "text-[0.75rem]";
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 w-full py-2 px-3 active:opacity-70 transition-all rounded-xl hover:bg-[hsl(var(--surface-elevated)/0.6)] text-left"
    >
      <div
        className={`${iconSize} rounded-[0.5rem] flex items-center justify-center flex-shrink-0`}
        style={{ backgroundColor: getIconBgColor(groupIconColor[entry.group]) }}
      >
        <img src={groupIcon[entry.group]} alt="" className={`${imgSize} object-contain`} />
      </div>
      <div className="flex flex-col min-w-0 flex-1">
        <span className={`${labelSize} font-medium text-foreground leading-tight truncate`}>{entry.label}</span>
        <span className={`${parentSize} text-muted-foreground leading-tight truncate`}>{entry.parentPath}</span>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
    </button>
  );
};

// Tablet/Desktop/Mobile settings items (unified)
const allSettingsItems: SettingsItemData[] = [
  { id: "account", iconSrc: accountIcon, label: "Account", iconBgColor: "#0A84FF", group: "main" },
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
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isClockScreenOpen, setIsClockScreenOpen] = useState(
    typeof document !== "undefined" && document.body.dataset.clockScreenOpen === "true"
  );
  // Tracks whether the user is actively focused in the search input.
  // We only want the input to "release" focus when they click outside
  // the search bar — clicking on a result counts as outside (and then we navigate).
  const [isSearchActive, setIsSearchActive] = useState(false);

  // Keep input focused while typing — refocus if React re-renders cause blur
  useEffect(() => {
    if (isSearchActive && document.activeElement !== inputRef.current) {
      inputRef.current?.focus();
    }
  }, [searchQuery, isSearchActive]);

  // Detect clicks outside the search bar to release focus
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchActive(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleClockScreenVisibility = (event: Event) => {
      const customEvent = event as CustomEvent<{ isOpen?: boolean }>;
      setIsClockScreenOpen(Boolean(customEvent.detail?.isOpen));
    };

    window.addEventListener("clock-screen-visibility-change", handleClockScreenVisibility as EventListener);
    return () => {
      window.removeEventListener("clock-screen-visibility-change", handleClockScreenVisibility as EventListener);
    };
  }, []);

  const activeItemId = useMemo(() => {
    const path = location.pathname;
    if (path === '/settings' || path.startsWith('/settings/account')) return 'account';
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
    if (itemId === "account") {
      if (onUserProfileClick) {
        onUserProfileClick();
        return;
      }
      navigate('/settings/account');
      return;
    }
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

  // Comprehensive search across all sub-pages and sub-sub options
  const searchResults = useMemo(() => searchSettings(searchQuery), [searchQuery]);
  const isSearching = searchQuery.trim().length > 0;

  const handleResultClick = (entry: SettingsSearchEntry) => {
    setSearchQuery("");
    setIsSearchActive(false);
    navigate(entry.path);
  };

  const mainItems = allSettingsItems.filter((i) => i.group === "main");
  const systemItems = allSettingsItems.filter((i) => i.group === "system");

  // Shared search bar (rendered inline in each layout for positioning)
  const renderSearchBar = (variant: "mobile" | "tablet") => {
    const isMobileVariant = variant === "mobile";
    return (
      <div
        ref={searchContainerRef}
        className={
          isMobileVariant
            ? "flex-1 bg-surface/90 backdrop-blur-sm rounded-full px-4 py-2.5 flex items-center gap-3 shadow-lg border border-divider"
            : "bg-surface/70 backdrop-blur-xl rounded-full px-3.5 py-[0.45rem] flex items-center gap-2.5 shadow-lg border border-divider/60"
        }
      >
        <Search className={isMobileVariant ? "w-5 h-5 text-muted-foreground" : "w-[1.1rem] h-[1.1rem] text-muted-foreground flex-shrink-0"} />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setIsSearchActive(true)}
          className={
            isMobileVariant
              ? "flex-1 bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-base"
              : "flex-1 min-w-0 bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-[0.9rem]"
          }
        />
        {searchQuery && (
          <button
            onClick={() => {
              setSearchQuery("");
              inputRef.current?.focus();
              setIsSearchActive(true);
            }}
            aria-label="Clear search"
            className={
              isMobileVariant
                ? "flex items-center justify-center w-5 h-5 rounded-full bg-muted-foreground/40 hover:bg-muted-foreground/60 active:opacity-70 transition-colors flex-shrink-0"
                : "flex items-center justify-center w-[1.05rem] h-[1.05rem] rounded-full bg-muted-foreground/40 hover:bg-muted-foreground/60 active:opacity-70 transition-colors flex-shrink-0"
            }
          >
            <X className={isMobileVariant ? "w-3 h-3 text-background" : "w-2.5 h-2.5 text-background"} strokeWidth={3} />
          </button>
        )}
        <button className={isMobileVariant ? "p-1 active:opacity-70 transition-opacity" : "p-0.5 active:opacity-70 transition-opacity flex-shrink-0"}>
          <Mic className={isMobileVariant ? "w-5 h-5 text-muted-foreground" : "w-[1.1rem] h-[1.1rem] text-muted-foreground"} />
        </button>
      </div>
    );
  };

  // ===== Mobile Layout =====
  if (isMobile) {
    return (
      <div className="h-full flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto px-4 pt-4 pb-32">
          <h1 className="text-3xl font-bold text-foreground mb-5">Settings</h1>

          {isSearching ? (
            searchResults.length > 0 ? (
              <div className="bg-surface rounded-2xl overflow-hidden mb-4 p-2">
                {searchResults.map((entry) => (
                  <SearchResultRow key={entry.id} entry={entry} onClick={() => handleResultClick(entry)} />
                ))}
              </div>
            ) : (
              <div className="bg-surface rounded-2xl p-6 mb-4 text-center">
                <p className="text-muted-foreground">No settings found for "{searchQuery}"</p>
              </div>
            )
          ) : (
            <>
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
                      {index < mainItems.length - 1 && <div className="h-px bg-divider mx-4" />}
                    </div>
                  ))}
                </div>
              )}

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
                      {index < systemItems.length - 1 && <div className="h-px bg-divider mx-4" />}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Floating Search Bar */}
        {!isClockScreenOpen && (
          <div className="settings-floating-search fixed bottom-20 left-4 right-4 z-50">
            <div className="flex items-center gap-3">{renderSearchBar("mobile")}</div>
          </div>
        )}
      </div>
    );
  }

  // ===== Tablet/Desktop Layout =====
  return (
    <div className="h-full flex flex-col overflow-hidden relative">
      <div className="flex-1 overflow-y-auto scrollbar-hide overscroll-contain px-3.5 pt-3.5 pb-24">
        <h1 className="text-[1.65rem] font-bold text-foreground mb-3">Settings</h1>

        {isSearching ? (
          searchResults.length > 0 ? (
            <div className="flex flex-col gap-0.5">
              {searchResults.map((entry) => (
                <SearchResultRow key={entry.id} entry={entry} onClick={() => handleResultClick(entry)} size="compact" />
              ))}
            </div>
          ) : (
            <div className="bg-surface rounded-2xl p-4 mb-3 text-center">
              <p className="text-muted-foreground text-sm">No settings found for "{searchQuery}"</p>
            </div>
          )
        ) : (
          <>
            {mainItems.length > 0 && (
              <div className="mb-2">
                {mainItems.map((item) => (
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

            {systemItems.length > 0 && (
              <div>
                {systemItems.map((item) => (
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
          </>
        )}
      </div>

      {/* Floating Glass Search Bar */}
      {!isClockScreenOpen && (
        <div className="absolute bottom-3 left-3 right-3 z-50">{renderSearchBar("tablet")}</div>
      )}
    </div>
  );
};

export default SettingsNavigation;
