import { useState, useRef, useEffect } from "react";
import { ChevronRight, ChevronLeft, Check } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";
import AnimatedAIIcon from "@/components/AnimatedAIIcon";
import notificationsIcon from "@/assets/icons/settings-notifications.png";

interface NotificationsContentProps {
  showHeader?: boolean;
  onBack?: () => void;
  onNavigate?: (path: string) => void;
  onAIClick?: () => void;
}

const NotificationsContent = ({ showHeader = true, onBack, onNavigate, onAIClick }: NotificationsContentProps) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [notificationStyle, setNotificationStyle] = useState("List");
  const [showStyleDropdown, setShowStyleDropdown] = useState(false);
  const styleButtonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const styleOptions = ["Count", "Stack", "List"];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
        styleButtonRef.current && !styleButtonRef.current.contains(event.target as Node)
      ) {
        setShowStyleDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNavigate = (path: string) => {
    if (onNavigate) {
      onNavigate(path);
    }
  };

  return (
    <div className="h-full overflow-y-auto scrollbar-hide overscroll-contain">
      <div className="p-4 space-y-6">
        {/* Back button for desktop */}
        {showHeader && !isMobile && (
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={onBack}
              className="w-10 h-10 rounded-full bg-neutral-800/60 flex items-center justify-center active:opacity-70 transition-opacity"
            >
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>
          </div>
        )}

        {/* Header Card */}
        <div className={`bg-neutral-800/60 rounded-2xl flex flex-col ${isMobile ? 'items-start' : 'items-center text-center'} py-6 px-4`}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: "#ED1C24" }}>
            <img src={notificationsIcon} alt="Notifications" className="w-8 h-8 object-contain" />
          </div>
          <h2 className="text-xl font-semibold text-foreground">Notifications</h2>
          <p className={`text-sm text-muted-foreground mt-2 ${isMobile ? '' : 'whitespace-nowrap'}`}>
            Manage how notifications are displayed and organized across the Point of Sale.
          </p>
        </div>

        {/* AI Assistant Icon - hidden on mobile (shown in page wrapper) */}
        <div className="hidden md:flex justify-end mb-3 overflow-visible">
          <AnimatedAIIcon size={24} onClick={onAIClick || (() => navigate('/settings/ai'))} />
        </div>

        {/* All Notifications Section */}
        <div>
          <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider px-1 mb-3">All Notifications</p>
          <div className="bg-neutral-800/60 rounded-2xl overflow-hidden">
            <button
              onClick={() => handleNavigate('/settings/notifications/all')}
              className="flex items-center justify-between w-full py-3.5 px-4 active:opacity-70 transition-opacity"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#ED1C24" }}>
                  <img src={notificationsIcon} alt="Notifications" className="w-4 h-4 object-contain" />
                </div>
                <span className="text-foreground text-base font-medium">Notifications</span>
              </div>
              <ChevronRight className="w-5 h-5 text-neutral-500" />
            </button>
          </div>
        </div>

        {/* Style Section */}
        <div>
          <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider px-1 mb-3">Style</p>
          <div className="bg-neutral-800/60 rounded-2xl overflow-hidden relative">
            <button
              ref={styleButtonRef}
              onClick={() => setShowStyleDropdown(!showStyleDropdown)}
              className="flex items-center justify-between w-full py-3.5 px-4 active:opacity-70 transition-opacity"
            >
              <span className="text-foreground text-base font-medium">Notification Style</span>
              <div className="flex items-center gap-1">
                <span className="text-sm text-muted-foreground">{notificationStyle}</span>
                <ChevronRight className="w-5 h-5 text-neutral-500" />
              </div>
            </button>
            {showStyleDropdown && (
              <div
                ref={dropdownRef}
                className="absolute right-0 top-full mt-2 z-50 bg-neutral-800 border border-neutral-700 rounded-2xl shadow-xl overflow-hidden min-w-[140px]"
              >
                {styleOptions.map((option, index) => (
                  <button
                    key={option}
                    onClick={() => {
                      setNotificationStyle(option);
                      setShowStyleDropdown(false);
                    }}
                    className={`flex items-center w-full px-4 py-3 text-sm text-foreground active:opacity-70 transition-opacity ${
                      index < styleOptions.length - 1 ? 'border-b border-neutral-700/50' : ''
                    }`}
                  >
                    <span>{option}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationsContent;
