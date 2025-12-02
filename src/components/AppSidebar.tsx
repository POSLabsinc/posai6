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
  { title: "Globe", url: "/globe", icon: Globe },
];

export function AppSidebar() {
  return (
    <Sidebar collapsible="none" className="w-20 border-r-0">
      <SidebarContent className="flex flex-col h-full py-2">
        {menuItems.map((item, index) => (
          <div key={item.title} className="flex-1 flex items-center justify-center px-2">
            {item.isLogo ? (
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center border border-sidebar-border">
                <span className="text-white font-bold text-xl">🍽</span>
              </div>
            ) : (
              <NavLink
                to={item.url}
                className="w-14 h-14 flex items-center justify-center rounded-xl border border-sidebar-border hover:bg-sidebar-accent transition-colors"
                activeClassName="bg-sidebar-accent text-sidebar-accent-foreground"
              >
                <item.icon className="h-6 w-6" />
              </NavLink>
            )}
          </div>
        ))}
        
        {/* Version info at bottom */}
        <div className="py-2 text-center">
          <div className="text-[10px] text-sidebar-foreground/50 leading-tight">
            <div>Ver 4.9</div>
            <div>FL 3.3.6</div>
          </div>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
