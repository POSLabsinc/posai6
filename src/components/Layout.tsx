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

  return (
    <div className="h-screen flex flex-col w-full overflow-hidden">
      {/* Header - Hidden by default on mobile, shown when toggled */}
      <div className={`${isHeaderVisible ? 'block' : 'hidden'} md:block flex-shrink-0`}>
        <Header />
      </div>
      
      {/* Mobile Header Toggle */}
      <button 
        onClick={() => setIsHeaderVisible(!isHeaderVisible)}
        className="md:hidden mx-auto bg-neutral-700 hover:bg-neutral-600 px-8 py-px rounded-b-md transition-colors"
      >
        {isHeaderVisible ? (
          <ChevronUp className="w-2.5 h-2.5 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-2.5 h-2.5 text-muted-foreground" />
        )}
      </button>

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
