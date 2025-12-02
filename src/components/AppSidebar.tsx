import { LayoutGrid, FileText, Tablet, Settings, Receipt, Globe } from "lucide-react";
import { NavLink } from "@/components/NavLink";

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";

const menuItems = [
  { title: "Dashboard", url: "/", icon: LayoutGrid },
  { title: "Orders", url: "/orders", icon: FileText },
  { title: "POS", url: "/pos", icon: Tablet },
  { title: "Settings", url: "/settings", icon: Settings },
  { title: "Reports", url: "/reports", icon: Receipt },
];

export function AppSidebar() {
  return (
    <Sidebar collapsible="none" className="w-20 border-r-0">
      <SidebarHeader className="items-center py-4">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
          <span className="text-white font-bold text-lg">🍽</span>
        </div>
      </SidebarHeader>

      <SidebarContent className="items-center">
        <SidebarMenu className="gap-2 px-2">
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild tooltip={item.title} className="h-12 w-12 justify-center rounded-xl">
                <NavLink
                  to={item.url}
                  className="flex items-center justify-center hover:bg-sidebar-accent"
                  activeClassName="bg-sidebar-accent text-sidebar-accent-foreground"
                >
                  <item.icon className="h-5 w-5" />
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="items-center py-4 gap-3">
        <div className="w-10 h-10 rounded-full border border-sidebar-border flex items-center justify-center">
          <Globe className="h-5 w-5 text-sidebar-foreground/70" />
        </div>
        <div className="text-[10px] text-sidebar-foreground/50 text-center leading-tight">
          <div>Ver 4.9</div>
          <div>FL 3.3.6</div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
