import { Settings, GripVertical, Lock, Unlock } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useSidebarPosition } from "@/contexts/SidebarPositionContext";
import { toast } from "@/hooks/use-toast";

import logoIcon from "@/assets/icons/logo.png";
import dashboardIcon from "@/assets/icons/dashboard.png";
import orderIcon from "@/assets/icons/order.png";
import tableManagementIcon from "@/assets/icons/table-management.png";
import ticketIcon from "@/assets/icons/ticket.png";
import versionIcon from "@/assets/icons/version.png";

const logoItem = { title: "Home", url: "/home", icon: logoIcon, isLogo: true };

const menuItems = [
  { title: "Dashboard", url: "/", icon: dashboardIcon },
  { title: "Orders", url: "/orders", icon: orderIcon },
  { title: "Table Order", url: "/tableorder", icon: tableManagementIcon },
  { title: "Tickets", url: "/tickets", icon: ticketIcon },
  { title: "Liquid Glass", url: "/liquid-dashboard", icon: null, lucideIcon: Settings, isGlass: true },
  { title: "Version", url: "/globe", icon: versionIcon, isLast: true },
];

export function DraggableSidebar() {
  const { position, setIsDragging, isLocked, setIsLocked, isAnimating } = useSidebarPosition();
  const isHorizontal = position === 'top' || position === 'bottom';

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

  return (
    <div 
      className={`${isHorizontal ? 'h-20 w-full' : 'w-20 h-full'} py-2 px-2 flex-shrink-0 transition-all duration-300 ease-out ${getAnimationClass()}`}
    >
      <div 
        className={`h-full rounded-2xl flex ${isHorizontal ? 'flex-row' : 'flex-col'} gap-1 p-1.5`} 
        style={{ background: '#7575754D', boxShadow: 'inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)' }}
      >
        {/* Drag Handle + Lock Toggle */}
        <div className={`flex ${isHorizontal ? 'flex-row' : 'flex-col'} items-center gap-1 shrink-0`}>
          <div 
            draggable={!isLocked}
            onDragStart={handleDragStart}
            onDrag={handleDrag}
            onDragEnd={handleDragEnd}
            className={`flex items-center justify-center ${isHorizontal ? 'h-full w-8' : 'w-full h-8'} ${isLocked ? 'cursor-not-allowed opacity-50' : 'cursor-grab active:cursor-grabbing'} hover:bg-white/20 rounded-lg transition-all shrink-0 select-none`}
            title={isLocked ? "Sidebar is locked" : "Drag to reposition sidebar"}
          >
            <GripVertical className={`w-4 h-4 text-white/60 ${isHorizontal ? '' : 'rotate-90'}`} />
          </div>
          <button
            onClick={toggleLock}
            className={`flex items-center justify-center ${isHorizontal ? 'h-full w-8' : 'w-full h-8'} hover:bg-white/20 rounded-lg transition-colors shrink-0`}
            title={isLocked ? "Unlock sidebar" : "Lock sidebar"}
          >
            {isLocked ? (
              <Lock className="w-4 h-4 text-orange-400" />
            ) : (
              <Unlock className="w-4 h-4 text-white/60" />
            )}
          </button>
        </div>

        {/* Logo */}
        <div className={`flex items-center justify-center ${isHorizontal ? 'h-full w-14' : 'h-14 w-full'} shrink-0`}>
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
            <img src={logoItem.icon} alt={logoItem.title} className="w-10 h-10" />
          </div>
        </div>

        {/* Menu items */}
        {menuItems.map((item) => (
          <div 
            key={item.title} 
            className={`flex items-center justify-center flex-1 min-h-0 min-w-0`}
          >
            {item.isLast ? (
              <NavLink
                to={item.url}
                className={`${isHorizontal ? 'h-full w-full' : 'w-full h-full'} flex flex-col items-center justify-center rounded-xl hover:bg-sidebar-accent transition-colors`}
                activeClassName="bg-sidebar-accent text-sidebar-accent-foreground border-2 border-white"
              >
                <img src={item.icon} alt={item.title} className="w-10 h-10" />
              </NavLink>
            ) : item.isGlass ? (
              <NavLink
                to={item.url}
                className={`${isHorizontal ? 'h-full w-full' : 'w-full h-full'} flex items-center justify-center rounded-xl hover:bg-gradient-to-br hover:from-orange-500/20 hover:to-amber-400/20 transition-all`}
                activeClassName="bg-gradient-to-br from-orange-500/30 to-amber-400/30 text-orange-400 border-2 border-white"
              >
                <item.lucideIcon className="h-5 w-5" />
              </NavLink>
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
          </div>
        ))}
      </div>
    </div>
  );
}
