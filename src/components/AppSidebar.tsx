import { Settings, Sparkles } from "lucide-react";
import { NavLink } from "@/components/NavLink";

import {
  Sidebar,
  SidebarContent,
} from "@/components/ui/sidebar";

import logoIcon from "@/assets/icons/logo.png";
import dashboardIcon from "@/assets/icons/dashboard.png";
import orderIcon from "@/assets/icons/order.png";
import tableManagementIcon from "@/assets/icons/table-management.png";
import ticketIcon from "@/assets/icons/ticket.png";
import versionIcon from "@/assets/icons/version.png";

const menuItems = [
  { title: "Home", url: "/home", icon: logoIcon, isLogo: true },
  { title: "Dashboard", url: "/", icon: dashboardIcon },
  { title: "Orders", url: "/orders", icon: orderIcon },
  { title: "POS", url: "/pos", icon: tableManagementIcon },
  { title: "Settings", url: "/settings", icon: null, lucideIcon: Settings },
  { title: "Reports", url: "/reports", icon: ticketIcon },
  { title: "Liquid Glass", url: "/liquid-dashboard", icon: null, lucideIcon: Sparkles, isGlass: true },
  { title: "Version", url: "/globe", icon: versionIcon, isLast: true },
];

export function AppSidebar() {
  return (
    <Sidebar collapsible="none" className="w-20 border-r-0">
      <SidebarContent className="flex flex-col h-full py-2 gap-2">
        {menuItems.map((item) => (
          <div key={item.title} className={`flex items-center justify-center px-2 ${item.isLogo ? 'h-14 shrink-0' : 'flex-1 min-h-0'}`}>
            {item.isLogo ? (
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center border border-sidebar-border">
                <img src={item.icon} alt={item.title} className="w-10 h-10" />
              </div>
            ) : item.isLast ? (
              <NavLink
                to={item.url}
                className="w-14 h-full flex flex-col items-center justify-center rounded-xl border border-sidebar-border hover:bg-sidebar-accent transition-colors"
                activeClassName="bg-sidebar-accent text-sidebar-accent-foreground"
              >
                <img src={item.icon} alt={item.title} className="w-10 h-10" />
              </NavLink>
            ) : item.isGlass ? (
              <NavLink
                to={item.url}
                className="w-14 h-full flex items-center justify-center rounded-xl border border-sidebar-border hover:bg-gradient-to-br hover:from-orange-500/20 hover:to-amber-400/20 transition-all"
                activeClassName="bg-gradient-to-br from-orange-500/30 to-amber-400/30 text-orange-400"
              >
                <item.lucideIcon className="h-5 w-5" />
              </NavLink>
            ) : (
              <NavLink
                to={item.url}
                className="w-14 h-full flex items-center justify-center rounded-xl border border-sidebar-border hover:bg-sidebar-accent transition-colors"
                activeClassName="bg-sidebar-accent text-sidebar-accent-foreground"
              >
                {item.lucideIcon ? (
                  <item.lucideIcon className="h-5 w-5" />
                ) : (
                  <img src={item.icon as string} alt={item.title} className="w-6 h-6" />
                )}
              </NavLink>
            )}
          </div>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
