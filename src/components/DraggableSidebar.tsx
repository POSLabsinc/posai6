import { useState, useEffect } from "react";
import { Settings, GripVertical, Lock, Unlock, Move, X } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { Link, useLocation } from "react-router-dom";
import { useSidebarPosition } from "@/contexts/SidebarPositionContext";
import { useVoucherMode } from "@/contexts/VoucherModeContext";
import { toast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import homeIcon from "@/assets/icons/home-button.png";
import dashboardIcon from "@/assets/icons/dashboard.png";
import orderIcon from "@/assets/icons/order.png";
import tableManagementIcon from "@/assets/icons/table-management.png";
import ticketIcon from "@/assets/icons/ticket.png";
import versionIcon from "@/assets/icons/version.png";
import restaurantLogo from "@/assets/icons/restaurant-logo.png";

const menuItems = [
  { title: "Dashboard", url: "/", icon: dashboardIcon },
  { title: "Orders", url: "/orders", icon: orderIcon },
  { title: "Table Order", url: "/tableorder", icon: tableManagementIcon },
  { title: "Tickets", url: "/tickets", icon: ticketIcon },
  { title: "orderOS", url: "/orderos", icon: homeIcon },
  
  { title: "Settings", url: "/settings", icon: null, lucideIcon: Settings, isSettings: true },
  { title: "Version", url: "/globe", icon: versionIcon, isLast: true },
];

export function DraggableSidebar() {
  const { position, setIsDragging, isLocked, setIsLocked, isAnimating, hasSeenOnboarding, dismissOnboarding } = useSidebarPosition();
  const isHorizontal = position === 'top' || position === 'bottom';
  const { isVoucherMode } = useVoucherMode();
  const location = useLocation();
  const isOrdersVoucherMode = isVoucherMode && location.pathname === '/orders';
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Show onboarding after a short delay for new users
  useEffect(() => {
    if (!hasSeenOnboarding && !isLocked) {
      const timer = setTimeout(() => setShowOnboarding(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [hasSeenOnboarding, isLocked]);

  // Auto-dismiss after 10 seconds
  useEffect(() => {
    if (showOnboarding) {
      const timer = setTimeout(() => {
        setShowOnboarding(false);
        dismissOnboarding();
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [showOnboarding, dismissOnboarding]);

  const handleDismissOnboarding = () => {
    setShowOnboarding(false);
    dismissOnboarding();
  };

  const handleDragStart = (e: React.DragEvent) => {
    if (isLocked) {
      e.preventDefault();
      toast({
        title: "Sidebar Locked",
        description: "Unlock the sidebar in Settings to reposition it.",
        duration: 2000,
      });
      return;
    }
    
    // Dismiss onboarding when user starts dragging
    if (showOnboarding) {
      setShowOnboarding(false);
      dismissOnboarding();
    }
    
    e.dataTransfer.setData('text/plain', 'sidebar');
    e.dataTransfer.effectAllowed = 'move';
    
    const dragImage = document.createElement('div');
    dragImage.style.opacity = '0';
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 0, 0);
    setTimeout(() => document.body.removeChild(dragImage), 0);
    
    setTimeout(() => setIsDragging(true), 0);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };
  
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const toggleLock = () => {
    setIsLocked(!isLocked);
    toast({
      title: isLocked ? "Sidebar Unlocked" : "Sidebar Locked",
      description: isLocked ? "You can now drag the sidebar to reposition it." : "Sidebar position is now locked.",
      duration: 2000,
    });
  };

  // Animation classes based on position
  const getAnimationClass = () => {
    if (!isAnimating) return '';
    switch (position) {
      case 'left': return 'animate-slide-in-left';
      case 'right': return 'animate-slide-in-right';
      case 'top': return 'animate-slide-in-top';
      case 'bottom': return 'animate-slide-in-bottom';
      default: return '';
    }
  };

  // Tooltip position based on sidebar position
  const getTooltipPosition = () => {
    switch (position) {
      case 'left': return 'left-full ml-3 top-0';
      case 'right': return 'right-full mr-3 top-0';
      case 'top': return 'top-full mt-3 left-0';
      case 'bottom': return 'bottom-full mb-3 left-0';
      default: return 'left-full ml-3 top-0';
    }
  };

  // Arrow position for tooltip
  const getArrowClass = () => {
    switch (position) {
      case 'left': return 'absolute -left-2 top-4 w-0 h-0 border-t-8 border-b-8 border-r-8 border-transparent border-r-orange-500';
      case 'right': return 'absolute -right-2 top-4 w-0 h-0 border-t-8 border-b-8 border-l-8 border-transparent border-l-orange-500';
      case 'top': return 'absolute -top-2 left-4 w-0 h-0 border-l-8 border-r-8 border-b-8 border-transparent border-b-orange-500';
      case 'bottom': return 'absolute -bottom-2 left-4 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-orange-500';
    default: return '';
    }
  };

  // Tooltip side based on sidebar position
  const getTooltipSide = (): "top" | "bottom" | "left" | "right" => {
    switch (position) {
      case 'left': return 'right';
      case 'right': return 'left';
      case 'top': return 'bottom';
      case 'bottom': return 'top';
      default: return 'right';
    }
  };

  const tooltipSide = getTooltipSide();

  return (
    <TooltipProvider delayDuration={100}>
      <div 
        className={`${isHorizontal ? 'h-20 w-full' : 'w-20 h-full'} py-2 px-2 flex-shrink-0 transition-all duration-300 ease-out ${getAnimationClass()}`}
      >
        <div 
          className={`h-full rounded-2xl flex ${isHorizontal ? 'flex-row' : 'flex-col'} gap-1 p-1.5`} 
          style={{ background: '#7575754D', boxShadow: 'inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)' }}
        >
          {/* Drag Handle + Lock Toggle */}
          <div className={`relative flex ${isHorizontal ? 'flex-row' : 'flex-col'} items-center gap-1 shrink-0`}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div 
                  draggable={!isLocked}
                  onDragStart={handleDragStart}
                  onDrag={handleDrag}
                  onDragEnd={handleDragEnd}
                  className={`flex items-center justify-center ${isHorizontal ? 'h-full w-8' : 'w-full h-8'} ${isLocked ? 'cursor-not-allowed opacity-50' : 'cursor-grab active:cursor-grabbing'} hover:bg-white/20 rounded-lg transition-all shrink-0 select-none ${showOnboarding && !isLocked ? 'animate-pulse ring-2 ring-orange-400 ring-offset-2 ring-offset-transparent' : ''}`}
                >
                  <GripVertical className={`w-4 h-4 text-white/60 ${isHorizontal ? '' : 'rotate-90'}`} />
                </div>
              </TooltipTrigger>
              <TooltipContent side={tooltipSide} className="bg-neutral-800 text-white border-neutral-700">
                {isLocked ? "Sidebar is locked" : "Drag to reposition"}
              </TooltipContent>
            </Tooltip>

            {/* Onboarding Tooltip */}
            {showOnboarding && !isLocked && (
              <div className={`absolute ${getTooltipPosition()} z-50 animate-fade-in`}>
                <div className="relative bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl p-4 shadow-2xl min-w-[220px]">
                  <div className={getArrowClass()} />
                  
                  <button 
                    onClick={handleDismissOnboarding}
                    className="absolute top-2 right-2 text-white/80 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <Move className="w-5 h-5 text-white" />
                    <span className="font-semibold text-white text-sm">Drag & Drop Sidebar</span>
                  </div>
                  
                  <p className="text-white/90 text-xs leading-relaxed mb-3">
                    Drag the handle to move the sidebar to any edge of the screen!
                  </p>
                  
                  <button
                    onClick={handleDismissOnboarding}
                    className="w-full bg-white/20 hover:bg-white/30 text-white text-xs font-medium py-1.5 px-3 rounded-lg transition-colors"
                  >
                    Got it!
                  </button>
                </div>
              </div>
            )}

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={toggleLock}
                  className={`flex items-center justify-center ${isHorizontal ? 'h-full w-8' : 'w-full h-8'} hover:bg-white/20 rounded-lg transition-colors shrink-0`}
                >
                  {isLocked ? (
                    <Lock className="w-4 h-4 text-orange-400" />
                  ) : (
                    <Unlock className="w-4 h-4 text-white/60" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side={tooltipSide} className="bg-neutral-800 text-white border-neutral-700">
                {isLocked ? "Unlock sidebar" : "Lock sidebar"}
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Restaurant Logo */}
          <div className={`flex items-center justify-center ${isHorizontal ? 'h-full w-14' : 'w-full h-14'} shrink-0`}>
            <img src={restaurantLogo} alt="Restaurant Logo" className="w-12 h-12 object-contain" />
          </div>

          {/* Menu items */}
          {menuItems.map((item) => (
            <div 
              key={item.title} 
              className={`flex items-center justify-center flex-1 min-h-0 min-w-0`}
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  {item.isLast ? (
                    <NavLink
                      to={item.url}
                      className={`${isHorizontal ? 'h-full w-full' : 'w-full h-full'} flex flex-col items-center justify-center rounded-xl hover:bg-sidebar-accent transition-colors`}
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground border-2 border-white"
                    >
                      <img src={item.icon} alt={item.title} className="w-10 h-10" />
                    </NavLink>
                  ) : item.isSettings ? (
                    <NavLink
                      to={item.url}
                      className={`${isHorizontal ? 'h-full w-full' : 'w-full h-full'} flex items-center justify-center rounded-xl hover:bg-sidebar-accent transition-colors`}
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground border-2 border-white"
                    >
                      <item.lucideIcon className="h-5 w-5" />
                    </NavLink>
                  ) : isOrdersVoucherMode && item.url === '/orders' ? (
                    <Link
                      to={item.url}
                      className={`${isHorizontal ? 'h-full w-full' : 'w-full h-full'} flex items-center justify-center rounded-xl hover:bg-sidebar-accent transition-colors`}
                    >
                      <img src={item.icon as string} alt={item.title} className="w-6 h-6" />
                    </Link>
                  ) : (
                    <NavLink
                      to={item.url}
                      className={`${isHorizontal ? 'h-full w-full' : 'w-full h-full'} flex items-center justify-center rounded-xl hover:bg-sidebar-accent transition-colors`}
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground border-2 border-white"
                    >
                      {item.lucideIcon ? (
                        <item.lucideIcon className="h-5 w-5" />
                      ) : (
                        <img src={item.icon as string} alt={item.title} className="w-6 h-6" />
                      )}
                    </NavLink>
                  )}
                </TooltipTrigger>
                <TooltipContent side={tooltipSide} className="bg-neutral-800 text-white border-neutral-700">
                  {item.title}
                </TooltipContent>
              </Tooltip>
            </div>
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
}
