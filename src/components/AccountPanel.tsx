import { ChevronRight } from "lucide-react";
import AnimatedAIIcon from "@/components/AnimatedAIIcon";
import SettingsIcon from "@/components/settings/SettingsIcon";
import { Calendar as CalendarIcon } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { useDeviceAuth } from "@/hooks/useDeviceAuth";
import { supabase } from "@/integrations/supabase/client";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

// Import account icons
import personalIcon from "@/assets/icons/account-personal.png";
import restaurantIcon from "@/assets/icons/account-restaurant.png";
import securityIcon from "@/assets/icons/account-security.png";

interface AccountOptionProps {
  icon: string;
  label: string;
  iconBgColor?: string;
  onClick?: () => void;
}

interface EmployeeStats {
  tips: number;
  hoursWorked: number;
  earnings: number;
  totalSales: number;
}

type FilterType = "today" | "total" | "custom";

const StatCard = ({ label, value, prefix = "" }: { label: string; value: string | number; prefix?: string }) => (
  <div className="flex flex-col items-center justify-center p-4 bg-neutral-800/60 rounded-xl min-w-[80px] flex-1">
    <span className="text-xl font-bold text-foreground">
      {prefix}{typeof value === 'number' ? value.toLocaleString() : value}
    </span>
    <span className="text-xs text-neutral-400 mt-1">{label}</span>
  </div>
);

const AccountOption = ({
  icon,
  label,
  iconBgColor = "#525252",
  onClick
}: AccountOptionProps) => <button onClick={onClick} className="flex items-center justify-between w-full py-4 px-5 active:opacity-70 transition-opacity">
    <div className="flex items-center gap-4">
      <SettingsIcon bgColor={iconBgColor} iconSrc={icon} iconAlt={label} />
      <span className="text-foreground text-lg font-medium">{label}</span>
    </div>
    <ChevronRight className="w-5 h-5 text-neutral-500" />
  </button>;
interface AccountPanelProps {
  showHeader?: boolean;
  onAIClick?: () => void;
}
const AccountPanel = ({
  showHeader = true,
  onAIClick
}: AccountPanelProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const { logout } = useDeviceAuth();

  const handleLogout = async () => {
    logout();
    await supabase.auth.signOut();
    navigate("/login", { replace: true });

    // Fallback hard redirect in case router state is stale
    window.location.replace("/login");
  };

  // Performance Summary visibility
  const [hidePerformanceSummary, setHidePerformanceSummary] = useState(() => {
    return localStorage.getItem('hidePerformanceSummary') === 'true';
  });

  // Listen for visibility changes from Control Center
  useEffect(() => {
    const handleVisibilityChange = (event: CustomEvent<{ hidden: boolean }>) => {
      setHidePerformanceSummary(event.detail.hidden);
    };

    window.addEventListener('performanceSummaryVisibilityChanged', handleVisibilityChange as EventListener);
    return () => {
      window.removeEventListener('performanceSummaryVisibilityChanged', handleVisibilityChange as EventListener);
    };
  }, []);

  // Dynamic employee stats - ready for backend integration
  const [stats, setStats] = useState<EmployeeStats>({
    tips: 0,
    hoursWorked: 0,
    earnings: 0,
    totalSales: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterType>("total");
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Mock data for different filters - replace with actual API calls
  const statsData: Record<FilterType, EmployeeStats> = {
    today: {
      tips: 45.50,
      hoursWorked: 8,
      earnings: 142.00,
      totalSales: 1250.75,
    },
    total: {
      tips: 847.50,
      hoursWorked: 156,
      earnings: 4250.00,
      totalSales: 28450.75,
    },
    custom: {
      tips: 312.25,
      hoursWorked: 64,
      earnings: 1680.00,
      totalSales: 12840.50,
    },
  };

  // Fetch employee data based on filter
  useEffect(() => {
    const fetchEmployeeStats = async () => {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 800));
      setStats(statsData[activeFilter]);
      setIsLoading(false);
    };

    fetchEmployeeStats();
  }, [activeFilter, dateRange]);

  const handleFilterChange = (filter: FilterType) => {
    if (filter !== "custom") {
      setDateRange({ from: undefined, to: undefined });
    }
    setActiveFilter(filter);
  };

  const handleDateSelect = (range: { from: Date | undefined; to: Date | undefined } | undefined) => {
    if (range) {
      setDateRange(range);
      if (range.from && range.to) {
        setActiveFilter("custom");
        setIsCalendarOpen(false);
      }
    }
  };

  const getCustomDateLabel = () => {
    if (dateRange.from && dateRange.to) {
      return `${format(dateRange.from, "MMM d")} - ${format(dateRange.to, "MMM d")}`;
    }
    return "Custom";
  };

  // Determine the base path for navigation based on current route
  const getNavigationPath = (subPath: string) => {
    // On desktop, use /settings/account paths
    // On mobile, use /account paths
    if (isMobile || location.pathname.startsWith('/account')) {
      return `/account${subPath}`;
    }
    return `/settings/account${subPath}`;
  };
  return <div className="flex flex-col h-full w-full overflow-y-auto scrollbar-hide overscroll-contain">
      {/* Header - only shown in tablet view */}
      {showHeader && <div className="flex items-center justify-center py-4 relative">
          <h1 className="text-xl font-semibold text-foreground">Account</h1>
        </div>}

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-start pt-8 px-0">
        {/* Profile Section */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-4">
            {/* User Avatar */}
            <Avatar className="w-24 h-24 border-2 border-neutral-700">
              <AvatarImage src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face" alt="John Smith" />
              <AvatarFallback className="bg-muted text-foreground text-2xl">JH</AvatarFallback>
            </Avatar>
            
            {/* Restaurant Logo Badge */}
            <div className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-neutral-700 border-2 border-neutral-900 flex items-center justify-center overflow-hidden">
              <div className="w-full h-full bg-gradient-to-br from-neutral-600 to-neutral-800 flex items-center justify-center">
                <span className="text-[6px] text-white/80 text-center leading-tight font-bold">BOLLYWOOD<br />BITES</span>
              </div>
            </div>
          </div>
          
          {/* User Name */}
          <h2 className="text-xl font-semibold text-foreground mb-0.5">Jim Hopper</h2>
          <p className="text-neutral-400 text-sm">Executive Assistant Manager</p>
        </div>

        {/* Employee Stats Summary - conditionally rendered */}
        {!hidePerformanceSummary && (
          <div className="w-full px-6 mb-6">
            {/* Title and Filter Tabs Row */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-4">
              <h3 className="text-sm font-medium text-neutral-400 mb-0">Performance Summary</h3>
              
              {/* Filter Tabs */}
              <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => handleFilterChange("today")}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-all",
                  activeFilter === "today"
                    ? "bg-primary text-primary-foreground"
                    : "bg-neutral-800/60 text-neutral-400 hover:text-foreground"
                )}
              >
                Today
              </button>
              <button
                onClick={() => handleFilterChange("total")}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-all",
                  activeFilter === "total"
                    ? "bg-primary text-primary-foreground"
                    : "bg-neutral-800/60 text-neutral-400 hover:text-foreground"
                )}
              >
                Total
              </button>
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <button
                    className={cn(
                      "px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2",
                      activeFilter === "custom"
                        ? "bg-primary text-primary-foreground"
                        : "bg-neutral-800/60 text-neutral-400 hover:text-foreground"
                    )}
                  >
                    <CalendarIcon className="w-4 h-4" />
                    {getCustomDateLabel()}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-neutral-900 border-neutral-700" align="end">
                  <Calendar
                    mode="range"
                    selected={dateRange}
                    onSelect={handleDateSelect}
                    numberOfMonths={1}
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
              </div>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-20 bg-neutral-800/40 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <StatCard label="Tips Earned" value={stats.tips.toFixed(2)} prefix="$" />
                <StatCard label="Hours Worked" value={stats.hoursWorked} />
                <StatCard label="Earnings" value={stats.earnings.toFixed(2)} prefix="$" />
                <StatCard label="Total Sales" value={stats.totalSales.toFixed(2)} prefix="$" />
              </div>
            )}
          </div>
        )}

        {/* Options Container - Full width with consistent padding */}
        <div className="w-full px-6">
          <div className="bg-neutral-800/40 rounded-2xl overflow-hidden mb-4">
            <AccountOption icon={personalIcon} label="Personal Information" iconBgColor="#525252" onClick={() => navigate(getNavigationPath('/personal-information'))} />
            <div className="h-px bg-neutral-700/50 mx-5" />
            <AccountOption icon={restaurantIcon} label="Restaurant Information" iconBgColor="#525252" onClick={() => navigate(getNavigationPath('/restaurant-information'))} />
            <div className="h-px bg-neutral-700/50 mx-5" />
            <AccountOption icon={securityIcon} label="Security" iconBgColor="#3B82F6" onClick={() => navigate(getNavigationPath('/security'))} />
          </div>

          {/* Logout Button */}
          <button 
            onClick={handleLogout}
            className="w-full py-4 bg-neutral-800/40 rounded-2xl active:opacity-70 transition-opacity"
          >
            <span className="text-red-400 font-semibold text-sm tracking-wide">LOG OUT</span>
          </button>
        </div>
      </div>
    </div>;
};
export default AccountPanel;