import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import Header from "@/components/Header";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="h-screen flex flex-col w-full overflow-hidden">
      <Header />
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
