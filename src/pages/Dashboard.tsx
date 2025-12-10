import { Link } from "react-router-dom";
import newOrderIcon from "@/assets/icons/new-order.png";
import tableOrderIcon from "@/assets/icons/table-order.png";
import ticketsIcon from "@/assets/icons/tickets.png";
import settingsIcon from "@/assets/icons/settings.png";

const Dashboard = () => {
  return (
    <div className="pb-16 md:pb-0">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="text-muted-foreground mt-2">Welcome to your dashboard!</p>

      {/* Bottom Navigation - Mobile Only */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 flex items-center justify-center py-2 px-3 z-50">
        <div className="flex items-center justify-around bg-neutral-900 rounded-2xl py-2 px-3 w-full border border-neutral-700">
          <Link to="/orders" className="flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-lg border border-neutral-500 bg-transparent">
            <img src={newOrderIcon} alt="New Order" className="w-5 h-5" />
            <span className="text-[10px] font-medium text-white">New Order</span>
          </Link>
          <button className="flex flex-col items-center gap-0.5 px-4 py-1.5">
            <img src={tableOrderIcon} alt="Table Order" className="w-5 h-5 opacity-60" />
            <span className="text-[10px] text-neutral-400">Table Order</span>
          </button>
          <button className="flex flex-col items-center gap-0.5 px-4 py-1.5">
            <img src={ticketsIcon} alt="Tickets" className="w-5 h-5 opacity-60" />
            <span className="text-[10px] text-neutral-400">Tickets</span>
          </button>
          <button className="flex flex-col items-center gap-0.5 px-4 py-1.5">
            <img src={settingsIcon} alt="Settings" className="w-5 h-5 opacity-60" />
            <span className="text-[10px] text-neutral-400">Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
