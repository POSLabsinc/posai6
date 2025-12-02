import { LayoutGrid, FileText, Tablet, Settings, Receipt, Globe, Utensils } from "lucide-react";
import { NavLink } from "@/components/NavLink";

import {
  Sidebar,
  SidebarContent,
} from "@/components/ui/sidebar";

const menuItems = [
  { title: "Home", url: "/home", icon: Utensils, isLogo: true },
  { title: "Dashboard", url: "/", icon: LayoutGrid },
  { title: "Orders", url: "/orders", icon: FileText },
  { title: "POS", url: "/pos", icon: Tablet },
  { title: "Settings", url: "/settings", icon: Settings },
  { title: "Reports", url: "/reports", icon: Receipt },
  { title: "Globe", url: "/globe", icon: Globe, isLast: true },
];

export function AppSidebar() {
  return (
    <Sidebar collapsible="none" className="w-20 border-r-0">
      <SidebarContent className="flex flex-col h-full">
        {menuItems.map((item) => (
          <div key={item.title} className="flex-1 flex items-center justify-center px-2">
            {item.isLogo ? (
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center border border-sidebar-border">
                <span className="text-white font-bold text-xl">🍽</span>
              </div>
            ) : item.isLast ? (
              <NavLink
                to={item.url}
                className="w-14 h-full max-h-24 flex flex-col items-center justify-center rounded-xl border border-sidebar-border hover:bg-sidebar-accent transition-colors"
                activeClassName="bg-sidebar-accent text-sidebar-accent-foreground"
              >
                <item.icon className="h-6 w-6" />
                <div className="text-[8px] text-sidebar-foreground/50 leading-tight mt-1 text-center">
                  <div>Ver 6.0</div>
                  <div>FL 3.3.6</div>
                </div>
              </NavLink>
            ) : (
              <NavLink
                to={item.url}
                className="w-14 h-full max-h-20 flex items-center justify-center rounded-xl border border-sidebar-border hover:bg-sidebar-accent transition-colors"
                activeClassName="bg-sidebar-accent text-sidebar-accent-foreground"
              >
                <item.icon className="h-6 w-6" />
              </NavLink>
            )}
          </div>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
