import { ChevronDown, ArrowLeft, Clock, MessageSquare, RefreshCw, Bell, Wifi, Headphones } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const Header = () => {
  return (
    <header className="flex items-center justify-between px-4 py-2 bg-sidebar text-sidebar-foreground">
      {/* Left Section */}
      <div className="flex items-center gap-3">
        <button className="p-1 hover:bg-sidebar-accent rounded transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        
        <div className="flex items-center gap-2">
          <Avatar className="w-8 h-8 border-2 border-sidebar-border">
            <AvatarImage src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face" alt="Mia Jone" />
            <AvatarFallback>MJ</AvatarFallback>
          </Avatar>
          
          <span className="font-medium text-sm">Mia Jone</span>
          
          <div className="w-px h-4 bg-sidebar-foreground/30 mx-1" />
          
          <Clock className="w-4 h-4" />
          
          <span className="text-sm">Dinner Service (7:00 PM)</span>
          
          <button className="p-1 hover:bg-sidebar-accent rounded transition-colors">
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* Right Section */}
      <div className="flex items-center gap-4">
        <button className="relative p-1 hover:bg-sidebar-accent rounded transition-colors">
          <MessageSquare className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full border border-sidebar" />
        </button>
        
        <button className="p-1 hover:bg-sidebar-accent rounded transition-colors">
          <RefreshCw className="w-5 h-5" />
        </button>
        
        <button className="p-1 hover:bg-sidebar-accent rounded transition-colors">
          <Bell className="w-5 h-5" />
        </button>
        
        <Wifi className="w-5 h-5" />
        
        <span className="text-sm font-medium">10:20 AM</span>
        
        <button className="p-1.5 bg-sidebar-accent rounded-md hover:bg-sidebar-accent/80 transition-colors">
          <Headphones className="w-5 h-5 text-sidebar-foreground" />
        </button>
      </div>
    </header>
  );
};

export default Header;
