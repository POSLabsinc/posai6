import { Link, useLocation } from "react-router-dom";
import newOrderIcon from "@/assets/icons/new-order.png";
import tableOrderIcon from "@/assets/icons/table-order.png";
import ticketsIcon from "@/assets/icons/tickets.png";
import settingsIcon from "@/assets/icons/settings.png";

const navItems = [
  { to: "/orders", icon: newOrderIcon, label: "New Order" },
  { to: "/pos", icon: tableOrderIcon, label: "Table Order" },
  { to: "/reports", icon: ticketsIcon, label: "Tickets" },
  { to: "/settings", icon: settingsIcon, label: "Settings" },
];

const BottomNavigation = () => {
  const location = useLocation();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 flex items-center justify-center py-2 px-3 z-50">
      <div className="flex items-center justify-around bg-neutral-900 rounded-2xl py-2 px-3 w-full border border-neutral-700">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center gap-0.5 px-4 py-1.5 ${
                isActive ? "rounded-lg border border-neutral-500 bg-transparent" : ""
              }`}
            >
              <img
                src={item.icon}
                alt={item.label}
                className={`w-5 h-5 ${isActive ? "" : "opacity-60"}`}
              />
              <span
                className={`text-[10px] ${
                  isActive ? "font-medium text-white" : "text-neutral-400"
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