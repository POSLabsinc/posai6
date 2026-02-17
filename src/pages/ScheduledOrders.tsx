import { useState, useMemo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Clock, User, MapPin, Phone, CheckCircle, XCircle, ChevronRight, Calendar, AlertCircle, Timer } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import OrderTypeIcon from "@/components/OrderTypeIcon";

// Platform icons
import uberEatsIcon from "@/assets/icons/platforms/ubereats-full.svg";
import grubhubIcon from "@/assets/icons/platforms/grubhub-full.svg";
import doordashIcon from "@/assets/icons/platforms/doordash-full.svg";
import directIcon from "@/assets/icons/platforms/direct-full.svg";

// Configurable time thresholds (in minutes) - can be adjusted without changing UI
const TIME_THRESHOLDS = {
  startingSoon: 30, // Orders within 30 mins
  upcoming: 120, // Orders within 2 hours
  // Later = everything beyond upcoming
};

interface ScheduledOrder {
  id: string;
  orderNumber: number;
  customerName: string;
  phone: string;
  platform: 'ubereats' | 'grubhub' | 'doordash' | 'direct';
  orderType: 'DELIVERY' | 'PICK UP' | 'DINE IN';
  scheduledTime: Date;
  prepTimeMinutes: number;
  itemCount: number;
  total: number;
}

// Mock scheduled orders data
const generateMockScheduledOrders = (): ScheduledOrder[] => {
  const now = new Date();
  
  return [
    // Starting Soon (within 30 mins)
    {
      id: 'SCH001',
      orderNumber: 1847,
      customerName: 'Sarah Johnson',
      phone: '(555) 123-4567',
      platform: 'doordash',
      orderType: 'DELIVERY',
      scheduledTime: new Date(now.getTime() + 12 * 60 * 1000), // 12 mins
      prepTimeMinutes: 15,
      itemCount: 4,
      total: 42.50,
    },
    {
      id: 'SCH002',
      orderNumber: 1848,
      customerName: 'Mike Chen',
      phone: '(555) 234-5678',
      platform: 'ubereats',
      orderType: 'PICK UP',
      scheduledTime: new Date(now.getTime() + 25 * 60 * 1000), // 25 mins
      prepTimeMinutes: 20,
      itemCount: 2,
      total: 28.75,
    },
    // Upcoming (30 mins - 2 hours)
    {
      id: 'SCH003',
      orderNumber: 1849,
      customerName: 'Emily Davis',
      phone: '(555) 345-6789',
      platform: 'grubhub',
      orderType: 'DELIVERY',
      scheduledTime: new Date(now.getTime() + 45 * 60 * 1000), // 45 mins
      prepTimeMinutes: 25,
      itemCount: 6,
      total: 67.20,
    },
    {
      id: 'SCH004',
      orderNumber: 1850,
      customerName: 'James Wilson',
      phone: '(555) 456-7890',
      platform: 'direct',
      orderType: 'PICK UP',
      scheduledTime: new Date(now.getTime() + 75 * 60 * 1000), // 1 hr 15 mins
      prepTimeMinutes: 15,
      itemCount: 3,
      total: 35.00,
    },
    {
      id: 'SCH005',
      orderNumber: 1851,
      customerName: 'Lisa Thompson',
      phone: '(555) 567-8901',
      platform: 'doordash',
      orderType: 'DELIVERY',
      scheduledTime: new Date(now.getTime() + 100 * 60 * 1000), // 1 hr 40 mins
      prepTimeMinutes: 20,
      itemCount: 5,
      total: 55.80,
    },
    // Later (beyond 2 hours)
    {
      id: 'SCH006',
      orderNumber: 1852,
      customerName: 'Robert Brown',
      phone: '(555) 678-9012',
      platform: 'ubereats',
      orderType: 'DELIVERY',
      scheduledTime: new Date(now.getTime() + 150 * 60 * 1000), // 2.5 hours
      prepTimeMinutes: 25,
      itemCount: 8,
      total: 89.50,
    },
    {
      id: 'SCH007',
      orderNumber: 1853,
      customerName: 'Amanda Garcia',
      phone: '(555) 789-0123',
      platform: 'grubhub',
      orderType: 'PICK UP',
      scheduledTime: new Date(now.getTime() + 200 * 60 * 1000), // 3+ hours
      prepTimeMinutes: 15,
      itemCount: 2,
      total: 24.00,
    },
    {
      id: 'SCH008',
      orderNumber: 1854,
      customerName: 'David Martinez',
      phone: '(555) 890-1234',
      platform: 'direct',
      orderType: 'DINE IN',
      scheduledTime: new Date(now.getTime() + 240 * 60 * 1000), // 4 hours
      prepTimeMinutes: 30,
      itemCount: 4,
      total: 52.00,
    },
  ];
};

// Helper to get platform icon
const getPlatformIcon = (platform: string) => {
  switch (platform) {
    case 'ubereats': return uberEatsIcon;
    case 'grubhub': return grubhubIcon;
    case 'doordash': return doordashIcon;
    case 'direct': return directIcon;
    default: return directIcon;
  }
};

// Helper to format scheduled time in human-readable format
const formatScheduledTime = (date: Date): string => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  let dayLabel: string;
  if (dateOnly.getTime() === today.getTime()) {
    dayLabel = 'Today';
  } else if (dateOnly.getTime() === tomorrow.getTime()) {
    dayLabel = 'Tomorrow';
  } else {
    dayLabel = format(date, 'MMM d');
  }
  
  return `${dayLabel} · ${format(date, 'h:mm a')}`;
};

// Helper to get time until in human-readable format
const getTimeUntil = (date: Date): string => {
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  
  if (diffMins < 1) return 'Now';
  if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? 's' : ''}`;
  
  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;
  
  if (mins === 0) return `${hours} hr${hours !== 1 ? 's' : ''}`;
  return `${hours} hr ${mins} min`;
};

// Helper to get prep start time
const getPrepStartTime = (scheduledTime: Date, prepMinutes: number): { text: string; isUrgent: boolean } => {
  const now = new Date();
  const prepStartTime = new Date(scheduledTime.getTime() - prepMinutes * 60 * 1000);
  const diffMs = prepStartTime.getTime() - now.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  
  if (diffMins <= 0) {
    return { text: 'Start prep now', isUrgent: true };
  }
  if (diffMins < 60) {
    return { text: `Prep starts in ${diffMins} min${diffMins !== 1 ? 's' : ''}`, isUrgent: diffMins <= 10 };
  }
  
  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;
  
  if (mins === 0) {
    return { text: `Prep starts in ${hours} hr${hours !== 1 ? 's' : ''}`, isUrgent: false };
  }
  return { text: `Prep starts in ${hours} hr ${mins} min`, isUrgent: false };
};

// Categorize orders by priority
const categorizeOrders = (orders: ScheduledOrder[]) => {
  const now = new Date();
  
  const startingSoon: ScheduledOrder[] = [];
  const upcoming: ScheduledOrder[] = [];
  const later: ScheduledOrder[] = [];
  
  orders.forEach(order => {
    const diffMs = order.scheduledTime.getTime() - now.getTime();
    const diffMins = diffMs / (1000 * 60);
    
    if (diffMins <= TIME_THRESHOLDS.startingSoon) {
      startingSoon.push(order);
    } else if (diffMins <= TIME_THRESHOLDS.upcoming) {
      upcoming.push(order);
    } else {
      later.push(order);
    }
  });
  
  // Sort each category by scheduled time
  const sortByTime = (a: ScheduledOrder, b: ScheduledOrder) => 
    a.scheduledTime.getTime() - b.scheduledTime.getTime();
  
  return {
    startingSoon: startingSoon.sort(sortByTime),
    upcoming: upcoming.sort(sortByTime),
    later: later.sort(sortByTime),
  };
};

// Section Header Component
const SectionHeader = ({ 
  title, 
  count, 
  priority 
}: { 
  title: string; 
  count: number; 
  priority: 'high' | 'medium' | 'low';
}) => {
  const priorityStyles = {
    high: 'bg-[#FF6B6B]/20 border-[#FF6B6B]/40 text-[#FF6B6B]',
    medium: 'bg-[#FFB347]/20 border-[#FFB347]/40 text-[#FFB347]',
    low: 'bg-white/10 border-white/20 text-white/60',
  };
  
  const iconColor = {
    high: '#FF6B6B',
    medium: '#FFB347',
    low: 'rgba(255,255,255,0.5)',
  };
  
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${priorityStyles[priority]}`}>
        {priority === 'high' && <AlertCircle className="w-4 h-4" />}
        {priority === 'medium' && <Clock className="w-4 h-4" />}
        {priority === 'low' && <Calendar className="w-4 h-4" />}
        <span className="font-semibold text-sm">{title}</span>
        <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-bold ${
          priority === 'high' ? 'bg-[#FF6B6B] text-white' :
          priority === 'medium' ? 'bg-[#FFB347] text-black' :
          'bg-white/20 text-white'
        }`}>
          {count}
        </span>
      </div>
      <div className="flex-1 h-px bg-white/10" />
    </div>
  );
};

// Order Card Component
const OrderCard = ({ 
  order, 
  showActions,
  onAccept,
  onCancel,
}: { 
  order: ScheduledOrder; 
  showActions: boolean;
  onAccept: (id: string) => void;
  onCancel: (id: string) => void;
}) => {
  const prepInfo = getPrepStartTime(order.scheduledTime, order.prepTimeMinutes);
  
  return (
    <div className={`bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 mb-3 ${
      showActions ? 'ring-1 ring-[#FF6B6B]/30' : ''
    }`}>
      {/* Top Row: Platform + Order ID + Status */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <img 
            src={getPlatformIcon(order.platform)} 
            alt={order.platform} 
            className="h-6 object-contain"
          />
          <div className="flex items-center gap-2">
            <span className="text-white font-bold text-lg">#{order.orderNumber}</span>
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-white/10 rounded-full">
              <OrderTypeIcon type={order.orderType} size="xs" />
              <span className="text-white/70 text-xs">{order.orderType}</span>
            </div>
          </div>
        </div>
        <div className="px-3 py-1 bg-[#9370DB]/20 border border-[#9370DB]/40 rounded-full">
          <span className="text-[#9370DB] text-xs font-semibold">Scheduled</span>
        </div>
      </div>
      
      {/* Customer Info */}
      <div className="flex items-center gap-4 mb-3">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-white/40" />
          <span className="text-white font-medium">{order.customerName}</span>
        </div>
        <div className="flex items-center gap-2">
          <Phone className="w-4 h-4 text-white/40" />
          <span className="text-white/60 text-sm">{order.phone}</span>
        </div>
      </div>
      
      {/* Time Info Row */}
      <div className="flex items-center gap-6 mb-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#9370DB]" />
          <span className="text-white font-medium">{formatScheduledTime(order.scheduledTime)}</span>
        </div>
        <div className={`flex items-center gap-2 px-2 py-1 rounded-lg ${
          prepInfo.isUrgent ? 'bg-[#FF6B6B]/20' : 'bg-white/5'
        }`}>
          <Timer className={`w-4 h-4 ${prepInfo.isUrgent ? 'text-[#FF6B6B]' : 'text-[#FFB347]'}`} />
          <span className={`text-sm font-medium ${prepInfo.isUrgent ? 'text-[#FF6B6B]' : 'text-[#FFB347]'}`}>
            {prepInfo.text}
          </span>
        </div>
      </div>
      
      {/* Order Summary */}
      <div className="flex items-center justify-between pt-3 border-t border-white/10">
        <div className="flex items-center gap-4">
          <span className="text-white/50 text-sm">{order.itemCount} items</span>
          <span className="text-white font-semibold">${order.total.toFixed(2)}</span>
        </div>
        
        {/* Actions (only for Starting Soon) */}
        {showActions && (
          <div className="flex items-center gap-2">
            <button 
              onClick={() => onCancel(order.id)}
              className="flex items-center gap-1.5 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl transition-colors"
            >
              <XCircle className="w-4 h-4 text-white/70" />
              <span className="text-white/70 text-sm font-medium">Cancel</span>
            </button>
            <button 
              onClick={() => onAccept(order.id)}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#FF6B6B] hover:bg-[#FF5252] rounded-xl transition-colors"
            >
              <CheckCircle className="w-4 h-4 text-white" />
              <span className="text-white text-sm font-medium">Accept</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Compact Order Card for "Later" section
const CompactOrderCard = ({ order }: { order: ScheduledOrder }) => {
  return (
    <div className="flex items-center justify-between bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-3 mb-2">
      <div className="flex items-center gap-3">
        <img 
          src={getPlatformIcon(order.platform)} 
          alt={order.platform} 
          className="h-5 object-contain opacity-60"
        />
        <span className="text-white/80 font-medium">#{order.orderNumber}</span>
        <span className="text-white/50">·</span>
        <span className="text-white/60">{order.customerName}</span>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-white/50 text-sm">{order.itemCount} items</span>
        <div className="flex items-center gap-2 text-white/40">
          <Calendar className="w-4 h-4" />
          <span className="text-sm">{formatScheduledTime(order.scheduledTime)}</span>
        </div>
        <ChevronRight className="w-4 h-4 text-white/30" />
      </div>
    </div>
  );
};

const ScheduledOrders = () => {
  const navigate = useNavigate();
  const [orders] = useState<ScheduledOrder[]>(generateMockScheduledOrders());
  
  const categorized = useMemo(() => categorizeOrders(orders), [orders]);
  
  const handleAccept = (orderId: string) => {
    console.log('Accept order:', orderId);
    // TODO: Implement accept logic
  };
  
  const handleCancel = (orderId: string) => {
    console.log('Cancel order:', orderId);
    // TODO: Implement cancel logic
  };
  
  const totalCount = orders.length;
  
  return (
    <div className="min-h-screen bg-[#1a1a2e] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/orderos')}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">Scheduled Orders</h1>
            <p className="text-white/50 text-sm">{totalCount} orders scheduled</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl">
          <Clock className="w-5 h-5 text-white/50" />
          <span className="text-white/70 text-sm">
            {format(new Date(), 'EEEE, MMMM d · h:mm a')}
          </span>
        </div>
      </div>
      
      {/* Main Content */}
      <ScrollArea className="flex-1 px-6 py-6">
        {/* Starting Soon Section */}
        {categorized.startingSoon.length > 0 && (
          <section className="mb-8">
            <SectionHeader 
              title="Starting Soon" 
              count={categorized.startingSoon.length} 
              priority="high" 
            />
            <div>
              {categorized.startingSoon.map(order => (
                <OrderCard 
                  key={order.id} 
                  order={order} 
                  showActions={true}
                  onAccept={handleAccept}
                  onCancel={handleCancel}
                />
              ))}
            </div>
          </section>
        )}
        
        {/* Upcoming Section */}
        {categorized.upcoming.length > 0 && (
          <section className="mb-8">
            <SectionHeader 
              title="Upcoming" 
              count={categorized.upcoming.length} 
              priority="medium" 
            />
            <div>
              {categorized.upcoming.map(order => (
                <OrderCard 
                  key={order.id} 
                  order={order} 
                  showActions={false}
                  onAccept={handleAccept}
                  onCancel={handleCancel}
                />
              ))}
            </div>
          </section>
        )}
        
        {/* Later Section */}
        {categorized.later.length > 0 && (
          <section className="mb-8">
            <SectionHeader 
              title="Later" 
              count={categorized.later.length} 
              priority="low" 
            />
            <div>
              {categorized.later.map(order => (
                <CompactOrderCard key={order.id} order={order} />
              ))}
            </div>
          </section>
        )}
        
        {/* Empty State */}
        {orders.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <Calendar className="w-16 h-16 text-white/20 mb-4" />
            <h3 className="text-white/60 text-lg font-medium mb-2">No Scheduled Orders</h3>
            <p className="text-white/40 text-sm">All scheduled orders will appear here</p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default ScheduledOrders;
