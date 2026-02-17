import { useState, useMemo, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { User, Phone, CheckCircle, XCircle, Calendar, Timer, Search, Package, GripVertical } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Switch } from "@/components/ui/switch";
import OrderTypeIcon from "@/components/OrderTypeIcon";
import { EightySixSheet, EightySixedItem } from "@/components/EightySixSheet";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  useDraggable,
  useDroppable,
} from "@dnd-kit/core";

// Platform icons
import uberEatsIcon from "@/assets/icons/platforms/ubereats-full.svg";
import grubhubIcon from "@/assets/icons/platforms/grubhub-full.svg";
import doordashIcon from "@/assets/icons/platforms/doordash-full.svg";
import directIcon from "@/assets/icons/platforms/direct-full.svg";
import orderOsLogo from "@/assets/icons/order-os.svg";

// Configurable time thresholds (in minutes) - can be adjusted without changing UI
const TIME_THRESHOLDS = {
  startingSoon: 30,
  upcoming: 120,
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
  items?: { name: string; qty: number; price: number }[];
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
      scheduledTime: new Date(now.getTime() + 12 * 60 * 1000),
      prepTimeMinutes: 15,
      itemCount: 4,
      total: 42.50,
      items: [
        { name: 'Grilled Salmon', qty: 1, price: 24.00 },
        { name: 'Caesar Salad', qty: 1, price: 12.00 },
        { name: 'Sparkling Water', qty: 2, price: 3.25 },
      ],
    },
    {
      id: 'SCH002',
      orderNumber: 1848,
      customerName: 'Mike Chen',
      phone: '(555) 234-5678',
      platform: 'ubereats',
      orderType: 'PICK UP',
      scheduledTime: new Date(now.getTime() + 25 * 60 * 1000),
      prepTimeMinutes: 20,
      itemCount: 2,
      total: 28.75,
      items: [
        { name: 'Chicken Parmesan', qty: 1, price: 18.00 },
        { name: 'Garlic Bread', qty: 1, price: 6.00 },
      ],
    },
    // Upcoming (30 mins - 2 hours)
    {
      id: 'SCH003',
      orderNumber: 1849,
      customerName: 'Emily Davis',
      phone: '(555) 345-6789',
      platform: 'grubhub',
      orderType: 'DELIVERY',
      scheduledTime: new Date(now.getTime() + 45 * 60 * 1000),
      prepTimeMinutes: 25,
      itemCount: 6,
      total: 67.20,
      items: [
        { name: 'Margherita Pizza', qty: 2, price: 16.00 },
        { name: 'Buffalo Wings', qty: 1, price: 14.00 },
        { name: 'Tiramisu', qty: 2, price: 10.00 },
      ],
    },
    {
      id: 'SCH004',
      orderNumber: 1850,
      customerName: 'James Wilson',
      phone: '(555) 456-7890',
      platform: 'direct',
      orderType: 'PICK UP',
      scheduledTime: new Date(now.getTime() + 75 * 60 * 1000),
      prepTimeMinutes: 15,
      itemCount: 3,
      total: 35.00,
      items: [
        { name: 'Steak Frites', qty: 1, price: 28.00 },
        { name: 'House Salad', qty: 1, price: 7.00 },
      ],
    },
    {
      id: 'SCH005',
      orderNumber: 1851,
      customerName: 'Lisa Thompson',
      phone: '(555) 567-8901',
      platform: 'doordash',
      orderType: 'DELIVERY',
      scheduledTime: new Date(now.getTime() + 100 * 60 * 1000),
      prepTimeMinutes: 20,
      itemCount: 5,
      total: 55.80,
      items: [
        { name: 'Lobster Roll', qty: 1, price: 32.00 },
        { name: 'Clam Chowder', qty: 1, price: 10.00 },
        { name: 'Iced Tea', qty: 2, price: 4.00 },
      ],
    },
    // Later (beyond 2 hours)
    {
      id: 'SCH006',
      orderNumber: 1852,
      customerName: 'Robert Brown',
      phone: '(555) 678-9012',
      platform: 'ubereats',
      orderType: 'DELIVERY',
      scheduledTime: new Date(now.getTime() + 150 * 60 * 1000),
      prepTimeMinutes: 25,
      itemCount: 8,
      total: 89.50,
      items: [
        { name: 'Ribeye Steak', qty: 2, price: 38.00 },
        { name: 'Mashed Potatoes', qty: 2, price: 8.00 },
      ],
    },
    {
      id: 'SCH007',
      orderNumber: 1853,
      customerName: 'Amanda Garcia',
      phone: '(555) 789-0123',
      platform: 'grubhub',
      orderType: 'PICK UP',
      scheduledTime: new Date(now.getTime() + 200 * 60 * 1000),
      prepTimeMinutes: 15,
      itemCount: 2,
      total: 24.00,
      items: [
        { name: 'Fish Tacos', qty: 2, price: 12.00 },
      ],
    },
    {
      id: 'SCH008',
      orderNumber: 1854,
      customerName: 'David Martinez',
      phone: '(555) 890-1234',
      platform: 'direct',
      orderType: 'DINE IN',
      scheduledTime: new Date(now.getTime() + 240 * 60 * 1000),
      prepTimeMinutes: 30,
      itemCount: 4,
      total: 52.00,
      items: [
        { name: 'Eggs Benedict', qty: 2, price: 16.00 },
        { name: 'Fresh Fruit Bowl', qty: 2, price: 8.00 },
      ],
    },
    {
      id: 'SCH009',
      orderNumber: 1855,
      customerName: 'Jennifer Lee',
      phone: '(555) 901-2345',
      platform: 'doordash',
      orderType: 'DELIVERY',
      scheduledTime: new Date(now.getTime() + 300 * 60 * 1000),
      prepTimeMinutes: 20,
      itemCount: 6,
      total: 72.00,
      items: [
        { name: 'Spaghetti Carbonara', qty: 2, price: 16.00 },
        { name: 'Garlic Bread', qty: 2, price: 6.00 },
        { name: 'Tiramisu', qty: 2, price: 10.00 },
      ],
    },
    {
      id: 'SCH010',
      orderNumber: 1856,
      customerName: 'Chris Taylor',
      phone: '(555) 012-3456',
      platform: 'ubereats',
      orderType: 'PICK UP',
      scheduledTime: new Date(now.getTime() + 360 * 60 * 1000),
      prepTimeMinutes: 15,
      itemCount: 3,
      total: 38.50,
      items: [
        { name: 'Pad Thai', qty: 2, price: 15.00 },
        { name: 'Spring Rolls', qty: 1, price: 8.00 },
      ],
    },
    {
      id: 'SCH011',
      orderNumber: 1857,
      customerName: 'Michelle Adams',
      phone: '(555) 123-4560',
      platform: 'grubhub',
      orderType: 'DELIVERY',
      scheduledTime: new Date(now.getTime() + 420 * 60 * 1000),
      prepTimeMinutes: 25,
      itemCount: 7,
      total: 85.25,
      items: [
        { name: 'Lamb Chops', qty: 2, price: 34.00 },
        { name: 'Roasted Vegetables', qty: 2, price: 10.00 },
      ],
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

// Helper to get prep start time indicator
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
  return { text: `Prep starts in ${hours}h ${mins}m`, isUrgent: false };
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
  
  const sortByTime = (a: ScheduledOrder, b: ScheduledOrder) => 
    a.scheduledTime.getTime() - b.scheduledTime.getTime();
  
  return {
    startingSoon: startingSoon.sort(sortByTime),
    upcoming: upcoming.sort(sortByTime),
    later: later.sort(sortByTime),
  };
};

// Column Header Component
const ColumnHeader = ({ 
  title, 
  count, 
  priority 
}: { 
  title: string; 
  count: number; 
  priority: 'high' | 'medium' | 'low';
}) => {
  const priorityStyles = {
    high: 'bg-[#FF6B6B]/20 border-[#FF6B6B]/50 text-[#FF6B6B]',
    medium: 'bg-[#FFB347]/15 border-[#FFB347]/40 text-[#FFB347]',
    low: 'bg-white/5 border-white/15 text-white/50',
  };
  
  const countStyles = {
    high: 'bg-[#FF6B6B] text-white',
    medium: 'bg-[#FFB347] text-black',
    low: 'bg-white/15 text-white/70',
  };
  
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border ${priorityStyles[priority]} mb-3`}>
      <span className="font-semibold text-sm">{title}</span>
      <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${countStyles[priority]}`}>
        {count}
      </span>
    </div>
  );
};

// Helper to format countdown timer (HH:MM:SS or M:SS)
const formatCountdown = (scheduledTime: Date, prepMinutes: number): string => {
  const now = new Date();
  const prepStartTime = new Date(scheduledTime.getTime() - prepMinutes * 60 * 1000);
  const diffMs = prepStartTime.getTime() - now.getTime();
  
  if (diffMs <= 0) return '0:00';
  
  const totalSeconds = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

// Helper to format order time
const formatOrderedAt = (date: Date): string => {
  return `Ordered at ${format(date, 'hh:mm')}`;
};

// Droppable Column Component
const DroppableColumn = ({ 
  id, 
  children 
}: { 
  id: string; 
  children: React.ReactNode;
}) => {
  const { setNodeRef, isOver } = useDroppable({ id });
  
  return (
    <div 
      ref={setNodeRef}
      className={`flex-1 transition-colors duration-200 ${isOver ? 'bg-white/5 rounded-xl' : ''}`}
    >
      {children}
    </div>
  );
};

// Draggable Card Wrapper
const DraggableCard = ({ 
  id, 
  children 
}: { 
  id: string; 
  children: React.ReactNode;
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id });
  
  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: isDragging ? 1000 : undefined,
    opacity: isDragging ? 0.5 : 1,
  } : undefined;
  
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
};

// Base Card Component - Reusable across all priority levels
const ScheduledOrderCard = ({ 
  order, 
  onAccept,
  onCancel,
  onSelect,
  isSelected,
  priority,
  currentTick,
}: { 
  order: ScheduledOrder; 
  onAccept?: (id: string) => void;
  onCancel?: (id: string) => void;
  onSelect?: (order: ScheduledOrder) => void;
  isSelected?: boolean;
  priority: 'high' | 'medium' | 'low';
  currentTick?: number;
}) => {
  // Recalculate countdown on each tick (every second)
  const countdown = useMemo(() => 
    formatCountdown(order.scheduledTime, order.prepTimeMinutes), 
    [order.scheduledTime, order.prepTimeMinutes, currentTick]
  );
  
  const prepInfo = useMemo(() => 
    getPrepStartTime(order.scheduledTime, order.prepTimeMinutes), 
    [order.scheduledTime, order.prepTimeMinutes, currentTick]
  );
  
  // Create a fake ordered at time (just for display)
  const orderedAt = useMemo(() => {
    const orderTime = new Date(order.scheduledTime.getTime() - 4 * 60 * 60 * 1000);
    return formatOrderedAt(orderTime);
  }, [order.scheduledTime]);
  
  const showActions = priority === 'high' && onAccept && onCancel;
  const showCountdown = priority !== 'low';
  
  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger select when clicking buttons
    if ((e.target as HTMLElement).closest('button')) return;
    onSelect?.(order);
  };
  
  return (
    <div 
      onClick={handleCardClick}
      className={`backdrop-blur-sm border rounded-2xl p-4 mb-3 cursor-pointer transition-all
        bg-white/[0.06] border-white/15
        ${isSelected ? 'ring-2 ring-[#FF6B6B]/50 bg-white/[0.1]' : 'hover:bg-white/[0.08]'}
      `}
    >
      {/* Top Row: Drag Handle + Order Type + Item Count + Order Number */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="flex flex-col gap-0.5 opacity-40 cursor-grab active:cursor-grabbing">
            <div className="flex gap-0.5">
              <div className="w-1 h-1 bg-white rounded-full" />
              <div className="w-1 h-1 bg-white rounded-full" />
            </div>
            <div className="flex gap-0.5">
              <div className="w-1 h-1 bg-white rounded-full" />
              <div className="w-1 h-1 bg-white rounded-full" />
            </div>
            <div className="flex gap-0.5">
              <div className="w-1 h-1 bg-white rounded-full" />
              <div className="w-1 h-1 bg-white rounded-full" />
            </div>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className={`text-xs font-semibold ${
                order.orderType === 'PICK UP' ? 'text-[#F97316]' : 
                order.orderType === 'DELIVERY' ? 'text-[#22C55E]' : 
                'text-[#EAB308]'
              }`}>{order.orderType}</span>
              {order.orderType === 'DINE IN' && (
                <span className="text-white/50 text-xs">• T-20</span>
              )}
            </div>
            <span className="text-[10px] text-white/60">{order.itemCount} items</span>
          </div>
        </div>
        <span className="text-2xl font-bold text-white">#{order.orderNumber}</span>
      </div>
      
      {/* Customer + Platform */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-base font-medium text-white">{order.customerName}</span>
        <img 
          src={getPlatformIcon(order.platform)} 
          alt={order.platform} 
          className="h-5 object-contain"
        />
      </div>
      
      {/* Scheduled Time Bar - Vibrant purple/magenta */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl mb-2" style={{ background: 'rgba(147, 112, 219, 0.25)' }}>
        <Calendar className="w-4 h-4 text-[#9370DB]" />
        <span className="text-[#9370DB] text-sm font-medium">Scheduled</span>
        <span className="text-[#9370DB] text-sm font-semibold ml-auto">
          {formatScheduledTime(order.scheduledTime)}
        </span>
      </div>
      
      {/* Ordered At */}
      <div className="text-xs mb-3 text-white/60">
        {orderedAt}
      </div>
      
      {/* Status Bar - Vibrant colors for countdown */}
      {showCountdown && (
        <div className="flex items-center justify-between px-3 py-2 rounded-xl mb-3" style={{ background: 'rgba(255, 107, 107, 0.2)' }}>
          <span className="text-[#FF6B6B] text-xs font-bold uppercase">NEW ORDER</span>
          <div className="flex items-center gap-1.5">
            <Timer className={`w-3.5 h-3.5 ${prepInfo.isUrgent ? 'text-[#FF6B6B] animate-pulse' : 'text-[#FFB347]'}`} />
            <span className={`text-xs font-bold ${prepInfo.isUrgent ? 'text-[#FF6B6B]' : 'text-[#FFB347]'}`}>
              STARTS IN {countdown}
            </span>
          </div>
        </div>
      )}
      
      {/* Actions */}
      {showActions && (
        <div className="flex items-center gap-2">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onCancel?.(order.id);
            }}
            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#FF6B6B]/20 hover:bg-[#FF6B6B]/30 border border-[#FF6B6B]/30 rounded-xl transition-colors"
          >
            <XCircle className="w-4 h-4 text-[#FF6B6B]" />
            <span className="text-[#FF6B6B] text-sm font-semibold">Cancel Order</span>
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onAccept?.(order.id);
            }}
            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#22C55E] hover:bg-[#22C55E]/90 rounded-xl transition-colors"
          >
            <CheckCircle className="w-4 h-4 text-white" />
            <span className="text-white text-sm font-semibold">Accept Order</span>
          </button>
        </div>
      )}
      
      {/* Expand indicator for non-action cards */}
      {!showActions && (
        <div className="flex justify-center">
          <div className="w-6 h-1 bg-white/10 rounded-full" />
        </div>
      )}
    </div>
  );
};

// Order Detail Panel Component
const OrderDetailPanel = ({ 
  order, 
  onClose,
  onAccept,
  onCancel,
}: { 
  order: ScheduledOrder | null; 
  onClose: () => void;
  onAccept: (id: string) => void;
  onCancel: (id: string) => void;
}) => {
  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6">
        <Calendar className="w-16 h-16 text-white/20 mb-4" />
        <h3 className="text-white/60 text-lg font-medium mb-2">Select an Order</h3>
        <p className="text-white/40 text-sm">Click on an order card to view details</p>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <img 
            src={getPlatformIcon(order.platform)} 
            alt={order.platform} 
            className="h-6 object-contain"
          />
          <span className="text-white font-bold text-xl">#{order.orderNumber}</span>
        </div>
        <div className="px-3 py-1 bg-[#9370DB]/20 border border-[#9370DB]/40 rounded-full">
          <span className="text-[#9370DB] text-xs font-semibold">Scheduled</span>
        </div>
      </div>
      
      {/* Customer Info */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center gap-3 mb-2">
          <User className="w-5 h-5 text-white/40" />
          <span className="text-white font-medium">{order.customerName}</span>
        </div>
        <div className="flex items-center gap-3">
          <Phone className="w-5 h-5 text-white/40" />
          <span className="text-white/70">{order.phone}</span>
        </div>
      </div>
      
      {/* Order Type & Time */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center gap-2 mb-3">
          <OrderTypeIcon type={order.orderType} size="small" />
          <span className={`text-sm font-semibold ${
            order.orderType === 'PICK UP' ? 'text-[#F97316]' : 
            order.orderType === 'DELIVERY' ? 'text-[#22C55E]' : 
            'text-[#EAB308]'
          }`}>{order.orderType}</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'rgba(147, 112, 219, 0.25)' }}>
          <Calendar className="w-4 h-4 text-[#9370DB]" />
          <span className="text-[#9370DB] text-sm font-semibold">
            {formatScheduledTime(order.scheduledTime)}
          </span>
        </div>
      </div>
      
      {/* Items */}
      <div className="flex-1 p-4 overflow-auto">
        <h4 className="text-white/50 text-xs uppercase mb-3">Order Items</h4>
        <div className="space-y-3">
          {order.items?.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-white/50 text-sm">{item.qty}x</span>
                <span className="text-white">{item.name}</span>
              </div>
              <span className="text-white/70">${item.price.toFixed(2)}</span>
            </div>
          )) || (
            <p className="text-white/40 text-sm">{order.itemCount} items</p>
          )}
        </div>
      </div>
      
      {/* Total & Actions */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center justify-between mb-4">
          <span className="text-white/50">Total</span>
          <span className="text-white text-2xl font-bold">${order.total.toFixed(2)}</span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => onCancel(order.id)}
            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-3 bg-[#FF6B6B]/20 hover:bg-[#FF6B6B]/30 border border-[#FF6B6B]/30 rounded-xl transition-colors"
          >
            <XCircle className="w-4 h-4 text-[#FF6B6B]" />
            <span className="text-[#FF6B6B] text-sm font-semibold">Cancel</span>
          </button>
          <button 
            onClick={() => onAccept(order.id)}
            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-3 bg-[#22C55E] hover:bg-[#22C55E]/90 rounded-xl transition-colors"
          >
            <CheckCircle className="w-4 h-4 text-white" />
            <span className="text-white text-sm font-semibold">Accept</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const ScheduledOrdersV2 = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<ScheduledOrder[]>(generateMockScheduledOrders());
  const [selectedOrder, setSelectedOrder] = useState<ScheduledOrder | null>(null);
  const [prepTime, setPrepTime] = useState(10);
  const [autoAccept, setAutoAccept] = useState(true);
  const [pauseOrders, setPauseOrders] = useState(false);
  const [eightySixedItems, setEightySixedItems] = useState<EightySixedItem[]>([]);
  const [eightySixSheetOpen, setEightySixSheetOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  
  // Time display
  const [currentTime, setCurrentTime] = useState(() => format(new Date(), 'h:mm'));
  const [currentPeriod, setCurrentPeriod] = useState(() => format(new Date(), 'a').toUpperCase());
  
  // Countdown tick - updates every SECOND for live countdown
  const [countdownTick, setCountdownTick] = useState(0);
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(format(new Date(), 'h:mm'));
      setCurrentPeriod(format(new Date(), 'a').toUpperCase());
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  
  // Update countdown every SECOND for real-time display
  useEffect(() => {
    const countdownTimer = setInterval(() => {
      setCountdownTick(prev => prev + 1);
    }, 1000); // Update every second
    return () => clearInterval(countdownTimer);
  }, []);
  
  const categorized = useMemo(() => categorizeOrders(orders), [orders, countdownTick]);
  
  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );
  
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };
  
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    
    if (!over) return;
    
    const draggedOrderId = active.id as string;
    const targetColumn = over.id as string;
    
    // Find the order
    const draggedOrder = orders.find(o => o.id === draggedOrderId);
    if (!draggedOrder) return;
    
    // Calculate new scheduled time based on target column
    const now = new Date();
    let newScheduledTime: Date;
    
    switch (targetColumn) {
      case 'startingSoon':
        // Move to 15 mins from now
        newScheduledTime = new Date(now.getTime() + 15 * 60 * 1000);
        break;
      case 'upcoming':
        // Move to 60 mins from now
        newScheduledTime = new Date(now.getTime() + 60 * 60 * 1000);
        break;
      case 'later':
        // Move to 3 hours from now
        newScheduledTime = new Date(now.getTime() + 180 * 60 * 1000);
        break;
      default:
        return;
    }
    
    // Update the order
    setOrders(prev => prev.map(o => 
      o.id === draggedOrderId 
        ? { ...o, scheduledTime: newScheduledTime }
        : o
    ));
  };
  
  const handleAccept = (orderId: string) => {
    console.log('Accept order:', orderId);
    // Remove from list (in real app, this would update status)
    setOrders(prev => prev.filter(o => o.id !== orderId));
    if (selectedOrder?.id === orderId) {
      setSelectedOrder(null);
    }
  };
  
  const handleCancel = (orderId: string) => {
    console.log('Cancel order:', orderId);
    // Remove from list (in real app, this would update status)
    setOrders(prev => prev.filter(o => o.id !== orderId));
    if (selectedOrder?.id === orderId) {
      setSelectedOrder(null);
    }
  };
  
  const handleSelectOrder = (order: ScheduledOrder) => {
    setSelectedOrder(order);
  };
  
  const totalCount = orders.length;
  const dineInCount = 0;
  const onlineCount = 0;
  
  // Find dragged order for overlay
  const draggedOrder = activeId ? orders.find(o => o.id === activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="min-h-screen bg-black flex flex-col">
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col m-3 rounded-[20px] overflow-hidden" style={{ background: "linear-gradient(180deg, rgba(78, 78, 78, 0.6) 0%, rgba(62, 62, 62, 0.6) 100%)", boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)" }}>
          {/* Header - Same as OrderOS */}
          <div className="overflow-x-auto scrollbar-hide border-b border-white/10">
            <div className="flex items-center justify-between p-3 min-w-max gap-3">
              {/* Mode Toggle */}
              <div className="flex items-center rounded-full p-1 shrink-0" style={{ background: "#7575754D", boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)" }}>
                <button 
                  onClick={() => navigate('/orderos')}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all text-white"
                >
                  DINE IN
                  <span className="px-1.5 py-0.5 rounded text-xs font-bold bg-neutral-700">
                    {dineInCount}
                  </span>
                </button>
                <button 
                  onClick={() => navigate('/orderos')}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all text-white"
                >
                  ONLINE
                  <span className="px-1.5 py-0.5 rounded text-xs font-bold bg-neutral-700">
                    {onlineCount}
                  </span>
                </button>
                <button 
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all text-black"
                  style={{ background: "linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)" }}
                >
                  SCHEDULED
                  <span className="px-1.5 py-0.5 rounded text-xs font-bold bg-black text-white">
                    {totalCount}
                  </span>
                </button>
              </div>
              
              {/* Right Controls */}
              <div className="flex items-center gap-3 shrink-0">
                {/* Time Display */}
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl shrink-0" style={{ background: "rgba(100, 100, 100, 0.4)" }}>
                  <span className="text-white font-bold text-lg leading-none flex items-center">
                    {currentTime}
                    <span className="flex flex-col text-[0.45em] font-bold leading-[1] ml-0.5">
                      <span>{currentPeriod.charAt(0)}</span>
                      <span>{currentPeriod.charAt(1)}</span>
                    </span>
                  </span>
                </div>
                
                {/* Prep Time */}
                <div className="flex flex-col items-center justify-center px-3 py-1 rounded-xl h-[36px]" style={{ background: "rgba(100, 100, 100, 0.4)" }}>
                  <span className="text-white/50 text-[10px] leading-tight whitespace-nowrap">+ Prep Time</span>
                  <span className="text-white text-xs font-bold">{prepTime}:00 MIN</span>
                </div>
                
                {/* Auto Accept */}
                <div className="flex items-center gap-2 px-3 py-1 rounded-xl h-[36px]" style={{ background: "rgba(100, 100, 100, 0.4)" }}>
                  <div className="flex flex-col items-center leading-tight">
                    <span className="text-white/50 text-[10px]">Auto</span>
                    <span className="text-white/50 text-[10px]">Accept</span>
                  </div>
                  <Switch 
                    checked={autoAccept}
                    onCheckedChange={setAutoAccept}
                    className="data-[state=checked]:bg-white data-[state=unchecked]:bg-neutral-600 scale-75"
                  />
                </div>
                
                {/* Pause Orders */}
                <div className="flex items-center gap-2 px-3 py-1 rounded-xl h-[36px]" style={{ background: "rgba(100, 100, 100, 0.4)" }}>
                  <div className="flex flex-col items-center leading-tight">
                    <span className="text-white/50 text-[10px]">Pause</span>
                    <span className="text-white/50 text-[10px]">Orders</span>
                  </div>
                  <Switch 
                    checked={pauseOrders}
                    onCheckedChange={setPauseOrders}
                    className="data-[state=checked]:bg-[#FF6B6B] data-[state=unchecked]:bg-neutral-600 scale-75"
                  />
                </div>
                
                {/* 86 Items */}
                <button 
                  onClick={() => setEightySixSheetOpen(true)}
                  className="flex items-center gap-2 px-3 py-1 rounded-xl h-[36px]" 
                  style={{ background: "rgba(100, 100, 100, 0.4)" }}
                >
                  <Package className={`w-4 h-4 ${eightySixedItems.length > 0 ? 'text-[#FF6B6B]' : 'text-white/50'}`} />
                  <div className="flex flex-col items-center leading-tight">
                    <span className={`text-[10px] ${eightySixedItems.length > 0 ? 'text-[#FF6B6B]' : 'text-white/50'}`}>86</span>
                    <span className={`text-[10px] ${eightySixedItems.length > 0 ? 'text-[#FF6B6B]' : 'text-white/50'}`}>Items</span>
                  </div>
                </button>
                
                {/* Search */}
                <button className="flex items-center justify-center w-9 h-9 rounded-full" style={{ background: "rgba(100, 100, 100, 0.4)" }}>
                  <Search className="w-4 h-4 text-white/70" />
                </button>
              </div>
            </div>
          </div>
          
          {/* Scheduled Orders Content - 3-Column Layout + Detail Panel */}
          <div className="flex-1 overflow-hidden flex">
            {/* Orders Columns */}
            <div className="flex-1 overflow-hidden">
              {orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <Calendar className="w-16 h-16 text-white/20 mb-4" />
                  <h3 className="text-white/60 text-lg font-medium mb-2">No Scheduled Orders</h3>
                  <p className="text-white/40 text-sm">Scheduled orders will appear here</p>
                </div>
              ) : (
                <div className="flex h-full gap-4 p-4">
                  {/* Starting Soon Column - Most Prominent */}
                  <DroppableColumn id="startingSoon">
                    <div className="flex-[2] flex flex-col min-w-0">
                      <ColumnHeader 
                        title="Starting Soon" 
                        count={categorized.startingSoon.length} 
                        priority="high" 
                      />
                      <ScrollArea className="flex-1">
                        <div className="pr-2">
                          {categorized.startingSoon.length > 0 ? (
                            categorized.startingSoon.map(order => (
                              <DraggableCard key={order.id} id={order.id}>
                                <ScheduledOrderCard 
                                  order={order} 
                                  onAccept={handleAccept}
                                  onCancel={handleCancel}
                                  onSelect={handleSelectOrder}
                                  isSelected={selectedOrder?.id === order.id}
                                  priority="high"
                                  currentTick={countdownTick}
                                />
                              </DraggableCard>
                            ))
                          ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
                                <CheckCircle className="w-6 h-6 text-white/20" />
                              </div>
                              <p className="text-white/30 text-sm">No orders need immediate attention</p>
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                    </div>
                  </DroppableColumn>
                  
                  {/* Upcoming Column - Moderately Prominent */}
                  <DroppableColumn id="upcoming">
                    <div className="flex-[1.5] flex flex-col min-w-0">
                      <ColumnHeader 
                        title="Upcoming" 
                        count={categorized.upcoming.length} 
                        priority="medium" 
                      />
                      <ScrollArea className="flex-1">
                        <div className="pr-2">
                          {categorized.upcoming.length > 0 ? (
                            categorized.upcoming.map(order => (
                              <DraggableCard key={order.id} id={order.id}>
                                <ScheduledOrderCard 
                                  order={order}
                                  onSelect={handleSelectOrder}
                                  isSelected={selectedOrder?.id === order.id}
                                  priority="medium"
                                  currentTick={countdownTick}
                                />
                              </DraggableCard>
                            ))
                          ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mb-3">
                                <Calendar className="w-5 h-5 text-white/15" />
                              </div>
                              <p className="text-white/25 text-xs">No upcoming orders</p>
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                    </div>
                  </DroppableColumn>
                  
                  {/* Later Column - Less Prominent */}
                  <DroppableColumn id="later">
                    <div className="flex-1 flex flex-col min-w-0">
                      <ColumnHeader 
                        title="Later" 
                        count={categorized.later.length} 
                        priority="low" 
                      />
                      <ScrollArea className="flex-1">
                        <div className="pr-2">
                          {categorized.later.length > 0 ? (
                            categorized.later.map(order => (
                              <DraggableCard key={order.id} id={order.id}>
                                <ScheduledOrderCard 
                                  order={order}
                                  onSelect={handleSelectOrder}
                                  isSelected={selectedOrder?.id === order.id}
                                  priority="low"
                                  currentTick={countdownTick}
                                />
                              </DraggableCard>
                            ))
                          ) : (
                            <div className="flex flex-col items-center justify-center py-8 text-center">
                              <p className="text-white/20 text-xs">No later orders</p>
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                    </div>
                  </DroppableColumn>
                </div>
              )}
            </div>
            
            {/* Order Detail Panel */}
            <div className="w-[380px] border-l border-white/10 bg-black/20">
              <OrderDetailPanel 
                order={selectedOrder}
                onClose={() => setSelectedOrder(null)}
                onAccept={handleAccept}
                onCancel={handleCancel}
              />
            </div>
          </div>
        </div>
        
        {/* Drag Overlay */}
        <DragOverlay>
          {draggedOrder && (
            <div className="opacity-90 shadow-2xl">
              <ScheduledOrderCard 
                order={draggedOrder}
                priority="high"
                currentTick={countdownTick}
              />
            </div>
          )}
        </DragOverlay>
        
        {/* 86 Sheet */}
        <EightySixSheet
          open={eightySixSheetOpen}
          onOpenChange={setEightySixSheetOpen}
          eightySixedItems={eightySixedItems}
          onRestoreItem={(itemId) => {
            setEightySixedItems(prev => prev.filter(item => item.id !== itemId));
          }}
          onScheduleRestore={(itemId, restoreTime) => {
            setEightySixedItems(prev => 
              prev.map(item => 
                item.id === itemId 
                  ? { ...item, scheduledRestoreTime: restoreTime } 
                  : item
              )
            );
          }}
          onEightySixItem={(newItem) => {
            const item: EightySixedItem = {
              id: `86-${Date.now()}`,
              name: newItem.name,
              category: newItem.category,
              reason: newItem.snoozeDuration,
              snoozedAt: new Date(),
              snoozeEndTime: null,
            };
            setEightySixedItems(prev => [...prev, item]);
          }}
        />
      </div>
    </DndContext>
  );
};

export default ScheduledOrdersV2;
