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
      {/* Header area */}
      <div className="flex-shrink-0">
        {/* Header - Hidden by default on mobile, shown when toggled */}
        <div className={`${isHeaderVisible ? 'block' : 'hidden'} md:block`}>
          <Header />
        </div>
        
        {/* Mobile Header Toggle - Inside header area */}
        <div className="md:hidden flex justify-center bg-header">
          <button 
            onClick={() => setIsHeaderVisible(!isHeaderVisible)}
            className="bg-neutral-600 hover:bg-neutral-500 px-6 py-0.5 rounded-b-lg transition-colors"
          >
            {isHeaderVisible ? (
              <ChevronUp className="w-3 h-3 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-3 h-3 text-muted-foreground" />
            )}
          </button>
        </div>
      </div>

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
