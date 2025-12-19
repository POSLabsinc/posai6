import { ChevronRight, Users, Sliders, UtensilsCrossed, CreditCard, UsersRound, FileText, Wifi, Monitor, Search, Mic, Bell, Headphones, UserCheck } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface SettingsItemProps {
  icon: React.ReactNode;
  label: string;
  iconBgColor: string;
  onClick?: () => void;
}

const SettingsItem = ({ icon, label, iconBgColor, onClick }: SettingsItemProps) => (
  <button
    onClick={onClick}
    className="flex items-center justify-between w-full py-3 px-1 border-b border-white/10 last:border-b-0 active:opacity-70 transition-opacity"
  >
    <div className="flex items-center gap-4">
      <div 
        className="w-10 h-10 rounded-lg flex items-center justify-center"
        style={{ backgroundColor: iconBgColor }}
      >
        {icon}
      </div>
      <span className="text-foreground text-base font-medium">{label}</span>
    </div>
    <ChevronRight className="w-5 h-5 text-muted-foreground" />
  </button>
);

const Settings = () => {
  return (
    <div className="min-h-screen p-4 pb-28 overflow-y-auto">
      {/* Header */}
      <h1 className="text-3xl font-bold text-foreground mb-6">Settings</h1>

      {/* User Profile Card */}
      <div className="bg-neutral-900 border border-white/10 rounded-2xl p-4 mb-4">
        <div className="flex items-center gap-4 pb-4 border-b border-white/10">
          <Avatar className="w-14 h-14">
            <AvatarImage src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face" alt="Jim Hopper" />
            <AvatarFallback className="bg-muted text-foreground">JH</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Jim Hopper</h2>
            <p className="text-sm text-muted-foreground">Executive Assistant Manager</p>
          </div>
        </div>
        <div className="pt-4 flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Clocked In At 10:00 AM</span>
          <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
        </div>
      </div>

      {/* Main Settings Group */}
      <div className="bg-neutral-900 border border-white/10 rounded-2xl px-4 mb-4">
        <SettingsItem
          icon={<Users className="w-5 h-5 text-white" />}
          label="General"
          iconBgColor="hsl(165, 60%, 40%)"
        />
        <SettingsItem
          icon={<Sliders className="w-5 h-5 text-white" />}
          label="Control Center"
          iconBgColor="hsl(270, 70%, 55%)"
        />
        <SettingsItem
          icon={<UtensilsCrossed className="w-5 h-5 text-white" />}
          label="Menu"
          iconBgColor="hsl(25, 95%, 53%)"
        />
        <SettingsItem
          icon={<CreditCard className="w-5 h-5 text-white" />}
          label="Payments"
          iconBgColor="hsl(250, 70%, 55%)"
        />
        <SettingsItem
          icon={<UsersRound className="w-5 h-5 text-white" />}
          label="Workforce"
          iconBgColor="hsl(0, 0%, 45%)"
        />
        <SettingsItem
          icon={<FileText className="w-5 h-5 text-white" />}
          label="Sales Summary Report"
          iconBgColor="hsl(0, 0%, 35%)"
        />
      </div>

      {/* System Settings Group */}
      <div className="bg-neutral-900 border border-white/10 rounded-2xl px-4 mb-4">
        <SettingsItem
          icon={<Wifi className="w-5 h-5 text-white" />}
          label="Network"
          iconBgColor="hsl(190, 80%, 50%)"
        />
        <SettingsItem
          icon={<Monitor className="w-5 h-5 text-white" />}
          label="Hardware"
          iconBgColor="hsl(300, 60%, 45%)"
        />
      </div>

      {/* Notifications & Support Group */}
      <div className="bg-neutral-900 border border-white/10 rounded-2xl px-4 mb-4">
        <SettingsItem
          icon={<Bell className="w-5 h-5 text-white" />}
          label="Notifications"
          iconBgColor="hsl(0, 0%, 40%)"
        />
        <SettingsItem
          icon={<Headphones className="w-5 h-5 text-white" />}
          label="Customer Support"
          iconBgColor="hsl(0, 75%, 50%)"
        />
      </div>

      {/* Switch User Group */}
      <div className="bg-neutral-900 border border-white/10 rounded-2xl px-4 mb-4">
        <SettingsItem
          icon={<UserCheck className="w-5 h-5 text-white" />}
          label="Switch User"
          iconBgColor="hsl(0, 0%, 30%)"
        />
      </div>

      {/* Floating Search Bar - Fixed on mobile above bottom nav */}
      <div className="fixed bottom-20 left-4 right-4 md:relative md:bottom-auto md:left-auto md:right-auto md:mt-0 z-50">
        <div className="bg-neutral-900 border border-white/10 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-lg md:shadow-none">
          <Search className="w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search"
            className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-base"
          />
          <button className="p-1 active:opacity-70 transition-opacity">
            <Mic className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
