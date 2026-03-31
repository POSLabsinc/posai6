import tableTargetIcon from "@/assets/icons/table-target.png";
import dineInIcon from "@/assets/icons/dine-in.png";
import takeOutIcon from "@/assets/icons/take-out.svg";
import deliveryIcon from "@/assets/icons/delivery.svg";
import driveThruIcon from "@/assets/icons/drive-thru.svg";
import { formatTableName } from "@/lib/orderUtils";

export interface OrderData {
  id: number;
  name: string;
  table: string;
  amount: string;
  partySize: number;
  time: string;
  status: string;
  timer: string;
  server: string;
  check: string;
  revenueCenter: string;
  paymentType: string;
  phone?: string;
  orderType?: string;
}

const getOrderTypeIcon = (orderType?: string) => {
  switch (orderType) {
    case 'Takeout': return takeOutIcon;
    case 'Delivery': return deliveryIcon;
    case 'Drive-Thru': return driveThruIcon;
    case 'Bar': return dineInIcon;
    default: return dineInIcon;
  }
};

const getOrderTypeLabel = (orderType?: string) => {
  switch (orderType) {
    case 'Takeout': return 'Takeout';
    case 'Delivery': return 'Delivery';
    case 'Drive-Thru': return 'Drive-Thru';
    case 'Bar': return 'Bar';
    default: return 'Dine In';
  }
};

export const getOrderStatusColor = (status: string) => {
  switch (status.toUpperCase()) {
    case 'ORDERING':
      return 'text-yellow-400';
    case 'ORDERED':
      return 'text-orange-500';
    case 'PAID':
      return 'text-emerald-400';
    case 'UNPAID':
      return 'text-red-400';
    default:
      return 'text-gray-400';
  }
};

interface OrderLayoutTemplateProps {
  order: OrderData;
  isSelected?: boolean;
  onClick?: () => void;
  showBorder?: boolean;
  variant?: 'default' | 'selectable';
}

const OrderLayoutTemplate = ({ 
  order, 
  isSelected = false, 
  onClick, 
  showBorder = true,
  variant = 'default' 
}: OrderLayoutTemplateProps) => {
  const borderClass = variant === 'selectable' 
    ? isSelected 
      ? "border-orange-500" 
      : "border-neutral-700 hover:border-neutral-600"
    : "border-white";

  return (
    <div 
      className={`rounded-xl ${showBorder ? `border ${borderClass}` : ''} overflow-hidden ${onClick ? 'cursor-pointer transition-all' : ''}`}
      style={{ backgroundColor: '#1B1C20' }}
      onClick={onClick}
    >
      {/* Mobile Layout */}
      <div className="flex items-stretch w-full md:hidden">
        {/* Order Number - Mobile compact style */}
        <div className="flex-shrink-0 px-2 py-2 flex items-center">
           <div className="relative w-10 h-12 bg-neutral-800 rounded-lg flex flex-col items-center justify-center border border-neutral-600 overflow-hidden">
            <div className="w-full overflow-hidden">
              <span className={`block text-center font-bold text-white whitespace-nowrap ${String(order.id).length > 3 ? 'text-[8px] animate-marquee' : 'text-lg'}`}>{String(order.id)}</span>
            </div>
            <span className="text-[9px] text-gray-500">000</span>
          </div>
        </div>

        {/* Guest Info - Mobile compact layout */}
        <div className="flex-1 min-w-0 py-2 pr-2">
          <div className="flex flex-col gap-1">
            {/* Row 1: Name + Table, Server, Status */}
            <div className="flex items-center justify-between">
              <span className="text-white font-medium text-sm">{order.name} · {formatTableName(order.table)}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm" style={{ color: '#B5B6BB' }}>{order.server}</span>
                <span className={`text-sm font-medium ${getOrderStatusColor(order.status)}`}>{order.status}</span>
              </div>
            </div>
            
            {/* Row 2: Party info, Timer, Total */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-xs" style={{ color: '#B5B6BB' }}>
                <img src={getOrderTypeIcon(order.orderType)} alt={getOrderTypeLabel(order.orderType)} className="w-3 h-3 object-contain opacity-60" />
                <span>{getOrderTypeLabel(order.orderType)}, Party of {order.partySize}, {order.time}</span>
                <span className="text-gray-500">|</span>
                <span>{order.timer}</span>
              </div>
              <span className="text-white font-semibold text-sm">{order.amount}</span>
            </div>
            
            {/* Row 3: Revenue Center, Payment status, Tip */}
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: '#B5B6BB' }}>{order.revenueCenter}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm" style={{ color: order.paymentType === '--' ? '#B5B6BB' : '#4ade80' }}>
                  {order.paymentType === '--' ? 'Un Paid' : 'Paid'}
                </span>
                <span className="text-white text-sm">$0.00</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tablet/Desktop Layout - matching 45%/35%/20% column ratio */}
      <div className="hidden md:flex items-stretch w-full">
        {/* Left Content with padding */}
        <div className="flex-1 flex items-stretch gap-3 p-3">
          {/* Order Number Box */}
          <div className="flex-shrink-0 flex flex-col items-center justify-center w-14 rounded-lg border border-white/20 py-2 gap-1 overflow-hidden" style={{ background: '#1A1A1A' }}>
            <div className="w-full overflow-hidden">
              <span className={`block text-center font-bold text-white whitespace-nowrap ${String(order.id).length > 3 ? 'text-[8px] animate-marquee' : 'text-lg'}`}>{String(order.id)}</span>
            </div>
            <span className="text-xs text-white/40">000</span>
          </div>

          {/* Main Content - 3 rows with 45%/35%/20% ratio */}
          <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
            {/* Row 1: Name + Table | Server | Status - 45% | 35% | 20% */}
            <div className="flex items-center text-sm">
              <div className="w-[45%] text-left">
                <span className="text-white font-medium truncate">{order.name} · {formatTableName(order.table)}</span>
              </div>
              <div className="w-[35%] text-left pl-4">
                <span className="text-white/60 truncate">{order.server}</span>
              </div>
              <div className="w-[20%] text-right">
                <span className={`font-semibold uppercase ${getOrderStatusColor(order.status)}`}>
                  {order.status}
                </span>
              </div>
            </div>
            
            {/* Row 2: Party info + Timer | empty | Total - 45% | 35% | 20% */}
            <div className="flex items-center text-sm">
              <div className="w-[45%] text-left flex items-center gap-1 text-white/60 whitespace-nowrap">
                <img src={getOrderTypeIcon(order.orderType)} alt={getOrderTypeLabel(order.orderType)} className="w-4 h-4 object-contain opacity-60" />
                <span className="truncate">{getOrderTypeLabel(order.orderType)}, Party of {order.partySize}, {order.time}</span>
                <span className="text-white/40">|</span>
                <span>{order.timer}</span>
              </div>
              <div className="w-[35%]"></div>
              <div className="w-[20%] text-right">
                <span className="text-white font-semibold">{order.amount}</span>
              </div>
            </div>
            
            {/* Row 3: Revenue Center | Payment Status | Tip - 45% | 35% | 20% */}
            <div className="flex items-center text-sm">
              <div className="w-[45%] text-left">
                <span className="text-white/60 truncate">{order.revenueCenter}</span>
              </div>
              <div className="w-[35%] text-left pl-4">
                <span className="text-white/60 truncate">{order.status === 'Paid' || order.status === 'Completed' ? 'Paid' : 'Un Paid'}</span>
              </div>
              <div className="w-[20%] text-right">
                <span className="text-white">$0.00</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderLayoutTemplate;
