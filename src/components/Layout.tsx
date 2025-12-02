import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import Header from "@/components/Header";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col w-full">
      <Header />
      <div className="flex flex-1">
        <SidebarProvider defaultOpen={true}>
          <AppSidebar />
          <main className="flex-1 p-6">
            {children}
          </main>
        </SidebarProvider>
      </div>
    </div>
  );
}
