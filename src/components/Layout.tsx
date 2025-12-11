import { useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import Header from "@/components/Header";
import { ChevronDown, ChevronUp } from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [isHeaderVisible, setIsHeaderVisible] = useState(false);
  const [headerTouchStart, setHeaderTouchStart] = useState<number | null>(null);

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

  return (
    <div 
      className="h-screen flex flex-col w-full overflow-hidden bg-black"
      onClick={() => isHeaderVisible && setIsHeaderVisible(false)}
    >
      {/* Header - Hidden by default on mobile, shown when toggled */}
      <div 
        className={`${isHeaderVisible ? 'block' : 'hidden'} md:block flex-shrink-0`}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleHeaderTouchStart}
        onTouchEnd={handleHeaderTouchEnd}
      >
        <Header />
      </div>
      
      {/* Mobile Header Toggle - Only shown when header is hidden */}
      {!isHeaderVisible && (
        <button 
          onClick={(e) => {
            e.stopPropagation();
            setIsHeaderVisible(true);
          }}
          className="md:hidden mx-auto bg-neutral-700 hover:bg-neutral-600 px-8 py-px rounded-b-md transition-colors"
        >
          <ChevronDown className="w-2.5 h-2.5 text-muted-foreground" />
        </button>
      )}

      <div className="flex flex-1 min-h-0 overflow-hidden">
        <SidebarProvider defaultOpen={true}>
          <div className="hidden md:block">
            <AppSidebar />
          </div>
          <main className="flex-1 p-3 overflow-hidden bg-black">
            {children}
          </main>
        </SidebarProvider>
      </div>
    </div>
  );
}
