import { Settings } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAppearance } from "@/contexts/AppearanceContext";
import { useVoucherMode } from "@/contexts/VoucherModeContext";
import { Link, useLocation } from "react-router-dom";

import {
  Sidebar,
  SidebarContent,
} from "@/components/ui/sidebar";

import logoIcon from "@/assets/icons/orderos-logo.png";
import orderosIcon from "@/assets/icons/order-os.svg";
import dashboardIcon from "@/assets/icons/dashboard.png";
import orderIcon from "@/assets/icons/order.png";
import tableManagementIcon from "@/assets/icons/table-management.png";
import ticketIcon from "@/assets/icons/ticket.png";
import versionIcon from "@/assets/icons/version.png";

const navIconSizeMap: Record<string, string> = {
  Default: "w-6 h-6",
  Small: "w-5 h-5",
  Medium: "w-7 h-7",
  Large: "w-8 h-8",
};

const navLucideSizeMap: Record<string, string> = {
  Default: "h-5 w-5",
  Small: "h-4 w-4",
  Medium: "h-6 w-6",
  Large: "h-7 w-7",
};

const logoSizeMap: Record<string, string> = {
  Default: "w-10 h-10",
  Small: "w-9 h-9",
  Medium: "w-11 h-11",
  Large: "w-12 h-12",
};

const logoItem = { title: "Home", url: "/home", icon: logoIcon, isLogo: true };

const menuItems = [
  { title: "Dashboard", url: "/", icon: dashboardIcon, exact: true },
  { title: "Orders", url: "/orders", icon: orderIcon },
  { title: "Table Order", url: "/tableorder", icon: tableManagementIcon },
  { title: "Tickets", url: "/tickets", icon: ticketIcon },
  { title: "orderOS", url: "/orderos", icon: orderosIcon },
  { title: "Settings", url: "/settings", icon: null, lucideIcon: Settings, isSettings: true },
  { title: "Version", url: "/globe", icon: versionIcon, isLast: true },
];

export function AppSidebar() {
  const { iconSize } = useAppearance();
  const { isVoucherMode } = useVoucherMode();
  const location = useLocation();
  const imgSize = navIconSizeMap[iconSize as string] || navIconSizeMap.Default;
  const lucideSize = navLucideSizeMap[iconSize as string] || navLucideSizeMap.Default;
  const logoSize = logoSizeMap[iconSize as string] || logoSizeMap.Default;

  // When in voucher mode on the orders page, suppress active highlight on Orders nav
  const isOrdersVoucherMode = isVoucherMode && location.pathname === '/orders';

  return (
    <Sidebar collapsible="none" className="w-20 border-r-0">
      <SidebarContent className="flex flex-col h-full py-2 px-2">
        <div
          className="flex-1 rounded-2xl flex flex-col gap-1 p-1.5"
          style={{
            background: "hsla(var(--stat-surface))",
            boxShadow: "var(--stat-inset-shadow)",
          }}
        >
          {/* Logo */}
          <div className="flex items-center justify-center h-14 shrink-0">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
              <img src={logoItem.icon} alt={logoItem.title} className={logoSize} />
            </div>
          </div>

          {/* Menu items */}
          {menuItems.map((item) => (
            <div key={item.title} className="flex items-center justify-center flex-1 min-h-0">
              {item.isLast ? (
                <NavLink
                  to={item.url}
                  className="w-full h-full flex flex-col items-center justify-center rounded-xl hover:bg-sidebar-accent transition-colors"
                  activeClassName="bg-sidebar-accent text-sidebar-accent-foreground border-2 border-white"
                >
                  <img src={item.icon} alt={item.title} className={logoSize} />
                </NavLink>
              ) : item.isSettings ? (
                <NavLink
                  to={item.url}
                  className="w-full h-full flex items-center justify-center rounded-xl hover:bg-sidebar-accent transition-colors"
                  activeClassName="bg-sidebar-accent text-sidebar-accent-foreground border-2 border-white"
                >
                  <item.lucideIcon className={lucideSize} />
                </NavLink>
              ) : isOrdersVoucherMode && item.url === '/orders' ? (
                <Link
                  to={item.url}
                  className="w-full h-full flex items-center justify-center rounded-xl hover:bg-sidebar-accent transition-colors"
                >
                  <img src={item.icon as string} alt={item.title} className={imgSize} />
                </Link>
              ) : (
                <NavLink
                  to={item.url}
                  className="w-full h-full flex items-center justify-center rounded-xl hover:bg-sidebar-accent transition-colors"
                  activeClassName="bg-sidebar-accent text-sidebar-accent-foreground border-2 border-white"
                >
                  {item.lucideIcon ? (
                    <item.lucideIcon className={lucideSize} />
                  ) : (
                    <img src={item.icon as string} alt={item.title} className={imgSize} />
                  )}
                </NavLink>
              )}
            </div>
          ))}
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
