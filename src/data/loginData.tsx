// Static login data extracted from Login.tsx
import { Briefcase, Users, Truck, ShieldCheck, UtensilsCrossed, Zap, Wine, ChefHat, Sparkles, Sunrise, Sun, Sunset, Moon } from "lucide-react";

// Revenue centers assigned to employees - in production this would come from API
export const revenueCenters: Record<string, string> = {
  "1": "Main Dining",
  "2": "Patio",
  "3": "Bar Area",
  "4": "Bar Area",
  "5": "Host Stand",
  "6": "Main Dining",
  "7": "Kitchen",
  "8": "Patio"
};

// PIN to employee mapping for company device flow
// In production, PINs would be validated server-side without exposing mappings
export const employeePinMapping: Record<string, string> = {
  "1111": "1", // Mia Jones (Manager)
  "2222": "2", // Dustin Henderson (Server)
  "3333": "3", // Lucas Miller (Server)
  "4444": "4", // Sarah Kim (Bartender)
  "5555": "5", // James Wilson (Host)
  "6666": "6", // Emily Rodriguez (Server)
  "7777": "7", // Michael Chen (Line Cook)
  "8888": "8", // Olivia Brown (Server)
};

// Mock employees assigned to this location - in production this would come from API
export const locationEmployees = [{
  id: "1",
  name: "Mia Jones",
  role: "Manager",
  roleIcon: "manager",
  avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face"
}, {
  id: "2",
  name: "Dustin Henderson",
  role: "Server",
  roleIcon: "server",
  avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face"
}, {
  id: "3",
  name: "Lucas Miller",
  role: "Server",
  roleIcon: "server",
  avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face"
}, {
  id: "4",
  name: "Sarah Kim",
  role: "Bartender",
  roleIcon: "bartender",
  avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face"
}, {
  id: "5",
  name: "James Wilson",
  role: "Host",
  roleIcon: "host",
  avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face"
}, {
  id: "6",
  name: "Emily Rodriguez",
  role: "Server",
  roleIcon: "server",
  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face"
}, {
  id: "7",
  name: "Michael Chen",
  role: "Line Cook",
  roleIcon: "kitchen",
  avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop&crop=face"
}, {
  id: "8",
  name: "Olivia Brown",
  role: "Server",
  roleIcon: "server",
  avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop&crop=face"
}];

export const getRoleIcon = (roleIcon: string) => {
  switch (roleIcon) {
    case "manager":
      return <ShieldCheck className="w-4 h-4" />;
    case "bartender":
      return <Wine className="w-4 h-4" />;
    case "host":
      return <Users className="w-4 h-4" />;
    case "kitchen":
      return <ChefHat className="w-4 h-4" />;
    default:
      return <Sparkles className="w-4 h-4" />;
  }
};

export const getRoleBadgeStyle = (roleIcon: string) => {
  switch (roleIcon) {
    case "manager":
      return "bg-amber-500/15 text-amber-600 dark:text-amber-400";
    case "bartender":
      return "bg-purple-500/15 text-purple-600 dark:text-purple-400";
    case "host":
      return "bg-blue-500/15 text-blue-600 dark:text-blue-400";
    case "kitchen":
      return "bg-orange-500/15 text-orange-600 dark:text-orange-400";
    default:
      return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400";
  }
};

// Helper to get time of day info (icon and label)
export const getTimeOfDayInfo = (date: Date) => {
  const hour = date.getHours();
  
  if (hour >= 5 && hour < 12) {
    return { 
      icon: Sunrise, 
      label: "Morning",
      iconClass: "text-amber-400"
    };
  } else if (hour >= 12 && hour < 17) {
    return { 
      icon: Sun, 
      label: "Afternoon",
      iconClass: "text-yellow-400"
    };
  } else if (hour >= 17 && hour < 20) {
    return { 
      icon: Sunset, 
      label: "Evening",
      iconClass: "text-orange-400"
    };
  } else {
    return { 
      icon: Moon, 
      label: "Night",
      iconClass: "text-slate-300"
    };
  }
};

export const PIN_LENGTH = 4;

export type DeviceType = "company" | "personal" | null;


