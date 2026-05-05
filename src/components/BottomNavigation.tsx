import { Link, useLocation } from "react-router-dom";
import dashboardIcon from "@/assets/icons/dashboard.png";
import newOrderIcon from "@/assets/icons/new-order.png";
import tableOrderIcon from "@/assets/icons/table-order.png";
import ticketsIcon from "@/assets/icons/tickets.png";
import settingsIcon from "@/assets/icons/settings.png";

const navItems = [
  { to: "/", icon: dashboardIcon, label: "Dashboard" },
  { to: "/orders", icon: newOrderIcon, label: "New Order" },
  { to: "/tableorder", icon: tableOrderIcon, label: "Table Order" },
  { to: "/tickets", icon: ticketsIcon, label: "Tickets" },
  { to: "/settings", icon: settingsIcon, label: "Settings" },
];

const BottomNavigation = () => {
  const location = useLocation();

  return (
    <div className="md:hidden flex items-center justify-center bg-background">
      <div className="bottom-navigation flex items-center justify-around bg-surface-inset py-1 w-full border-t border-divider">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center gap-0 px-3 py-1 ${
                isActive ? "rounded-md border border-divider bg-transparent" : ""
              }`}
            >
              <img
                src={item.icon}
                alt={item.label}
                className={`w-7 h-7 ${isActive ? "" : "opacity-60"}`}
              />
              <span
                className={`text-[9px] ${
                  isActive ? "font-medium text-foreground" : "text-muted-foreground"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNavigation;