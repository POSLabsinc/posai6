import { useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import { useLayoutCustomization } from "@/contexts/ThemeContext";
import { ChevronDown } from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [isHeaderVisible, setIsHeaderVisible] = useState(false);
  const [headerTouchStart, setHeaderTouchStart] = useState<number | null>(null);
  const { layout } = useLayoutCustomization();
  const { sidebar } = layout;

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

  // Determine sidebar position based on layout settings
  const sidebarPosition = sidebar.sidebarPosition;
  const showHeader = sidebar.headerVisible;
  const showBottomNav = sidebar.bottomNavVisible;

  return (
    <div
      className="h-screen flex flex-col w-full overflow-hidden bg-background"
      onClick={() => isHeaderVisible && setIsHeaderVisible(false)}
    >
      {/* Header - Hidden by default on mobile, shown when toggled */}
      {showHeader && (
        <div
          className={`${isHeaderVisible ? "block" : "hidden"} md:block flex-shrink-0`}
          onClick={(e) => e.stopPropagation()}
          onTouchStart={handleHeaderTouchStart}
          onTouchEnd={handleHeaderTouchEnd}
          style={{ height: sidebar.headerHeight }}
        >
          <Header />
        </div>
      )}

      {/* Mobile Header Toggle - Only shown when header is hidden */}
      {showHeader && !isHeaderVisible && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsHeaderVisible(true);
          }}
          className="md:hidden mx-auto bg-muted hover:bg-accent px-8 py-px rounded-b-md transition-colors"
        >
          <ChevronDown className="w-2.5 h-2.5 text-muted-foreground" />
        </button>
      )}

      <div
        className={`flex flex-1 min-h-0 overflow-hidden ${
          sidebarPosition === "right" ? "flex-row-reverse" : ""
        }`}
      >
        <SidebarProvider defaultOpen={!sidebar.sidebarCollapsed}>
          <div
            className="hidden md:block"
            style={{
              width: sidebar.sidebarCollapsed ? "48px" : sidebar.sidebarWidth,
            }}
          >
            <AppSidebar />
          </div>
          <main
            className={`flex-1 overflow-hidden bg-background ${
              sidebar.compactMode ? "p-1" : "pt-3 px-0"
            }`}
          >
            {children}
          </main>
        </SidebarProvider>
      </div>

      {/* Bottom Navigation - Mobile only */}
      {showBottomNav && <BottomNavigation />}
    </div>
  );
}
