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
      <div className="flex flex-1 overflow-hidden">
        <SidebarProvider defaultOpen={true}>
          <AppSidebar />
          <main className="flex-1 p-4 overflow-hidden">
            {children}
          </main>
        </SidebarProvider>
      </div>
    </div>
  );
}
