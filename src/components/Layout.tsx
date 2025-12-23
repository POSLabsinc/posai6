import { useState } from "react";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import { ChevronDown } from "lucide-react";
import { SidebarPositionProvider, useSidebarPosition } from "@/contexts/SidebarPositionContext";
import { DraggableSidebar } from "@/components/DraggableSidebar";
import { SidebarDropZones } from "@/components/SidebarDropZone";

interface LayoutProps {
  children: React.ReactNode;
}

function LayoutContent({ children }: LayoutProps) {
  const [isHeaderVisible, setIsHeaderVisible] = useState(false);
  const [headerTouchStart, setHeaderTouchStart] = useState<number | null>(null);
  const { position } = useSidebarPosition();

  const handleHeaderTouchStart = (e: React.TouchEvent) => {
    setHeaderTouchStart(e.touches[0].clientY);
  };

  const handleHeaderTouchEnd = (e: React.TouchEvent) => {
    if (headerTouchStart === null) return;
    const diff = e.changedTouches[0].clientY - headerTouchStart;
    if (diff < -30) {
      setIsHeaderVisible(false);
    }
    setHeaderTouchStart(null);
  };

  const isHorizontal = position === 'top' || position === 'bottom';

  return (
    <div 
      className="h-screen flex flex-col w-full overflow-hidden bg-black" 
      onClick={() => isHeaderVisible && setIsHeaderVisible(false)}
    >
      {/* Drop zones for drag and drop */}
      <SidebarDropZones />

      {/* Header - Hidden by default on mobile, shown when toggled */}
      <div 
        className={`${isHeaderVisible ? 'block' : 'hidden'} md:block flex-shrink-0`} 
        onClick={e => e.stopPropagation()} 
        onTouchStart={handleHeaderTouchStart} 
        onTouchEnd={handleHeaderTouchEnd}
      >
        <Header />
      </div>
      
      {/* Mobile Header Toggle - Only shown when header is hidden */}
      {!isHeaderVisible && (
        <button 
          onClick={e => {
            e.stopPropagation();
            setIsHeaderVisible(true);
          }} 
          className="md:hidden mx-auto bg-neutral-700 hover:bg-neutral-600 px-8 py-px rounded-b-md transition-colors"
        >
          <ChevronDown className="w-2.5 h-2.5 text-muted-foreground" />
        </button>
      )}

      {/* Top sidebar position */}
      {position === 'top' && (
        <div className="hidden md:block flex-shrink-0">
          <DraggableSidebar />
        </div>
      )}

      {/* Main content area */}
      <div className={`flex flex-1 min-h-0 overflow-hidden ${isHorizontal ? 'flex-col' : 'flex-row'}`}>
        {/* Left sidebar position */}
        {position === 'left' && (
          <div className="hidden md:block flex-shrink-0">
            <DraggableSidebar />
          </div>
        )}

        <main className="flex-1 pt-3 overflow-y-auto bg-black px-0">
          {children}
        </main>

        {/* Right sidebar position */}
        {position === 'right' && (
          <div className="hidden md:block flex-shrink-0">
            <DraggableSidebar />
          </div>
        )}
      </div>

      {/* Bottom sidebar position */}
      {position === 'bottom' && (
        <div className="hidden md:block flex-shrink-0">
          <DraggableSidebar />
        </div>
      )}

      {/* Bottom Navigation - Mobile only */}
      <BottomNavigation />
    </div>
  );
}

export function Layout({ children }: LayoutProps) {
  return (
    <SidebarPositionProvider>
      <LayoutContent>{children}</LayoutContent>
    </SidebarPositionProvider>
  );
}