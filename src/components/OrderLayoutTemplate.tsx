import tableTargetIcon from "@/assets/icons/table-target.png";

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
}

export const getOrderStatusColor = (status: string) => {
  switch (status.toUpperCase()) {
    case 'ORDERING':
      return 'text-blue-400';
    case 'ORDERED':
      return 'text-green-400';
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
  compact?: boolean;
}

const OrderLayoutTemplate = ({ 
  order, 
  isSelected = false, 
  onClick, 
  showBorder = true,
  variant = 'default',
  compact = false
}: OrderLayoutTemplateProps) => {
  const borderClass = variant === 'selectable' 
    ? isSelected 
      ? "border-orange-500" 
      : "border-neutral-700 hover:border-neutral-600"
    : "border-white";

  if (compact) {
    return (
      <div 
        className={`rounded-xl border overflow-hidden ${borderClass} ${onClick ? 'cursor-pointer transition-all' : ''}`}
        style={{ backgroundColor: '#1B1C20' }}
        onClick={onClick}
      >
        <div className="flex items-stretch w-full gap-3 p-3">
          {/* Order Number Column */}
          <div className="flex-shrink-0 flex items-center">
            <div className="relative w-10 h-14 bg-neutral-800 rounded-lg flex flex-col items-center justify-center gap-1 border border-neutral-600">
              <span className="text-base font-bold text-white">{order.id}</span>
              <img src={tableTargetIcon} alt="Table" className="w-4 h-4 object-contain" />
            </div>
          </div>

          {/* Guest Info Column */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <span className="text-white font-medium text-sm">{order.name}</span>
              <span className="text-white/60 text-sm">· {order.table}</span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-white font-semibold text-sm">{order.amount}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
              <span>Party Of {order.partySize},</span>
              <span>⚡ {order.time}</span>
            </div>
            <span className={`text-xs font-medium ${getOrderStatusColor(order.status)}`}>
              {order.status}
            </span>
          </div>

          {/* Timer/Server Column */}
          <div className="flex-shrink-0 w-[70px]">
            <div className="text-white text-sm">{order.timer}</div>
            <div className="text-white/40 text-[10px]">Timer</div>
            <div className="text-white text-sm mt-2">{order.server}</div>
            <div className="text-white/40 text-[10px]">Server</div>
          </div>

          {/* Check/Revenue Center Column */}
          <div className="flex-shrink-0 w-[80px]">
            <div className="text-white text-sm">{order.check}</div>
            <div className="text-white/40 text-[10px]">Check</div>
            <div className="text-white text-sm mt-2">{order.revenueCenter}</div>
            <div className="text-white/40 text-[10px]">Revenue Center</div>
          </div>

          {/* Payment Type Column */}
          <div className="flex-shrink-0 w-[70px]">
            <div className="text-white text-sm">{order.paymentType}</div>
            <div className="text-white/40 text-[10px]">Payment Type</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`rounded-xl border overflow-hidden ${borderClass} ${onClick ? 'cursor-pointer transition-all' : ''}`}
      style={{ backgroundColor: '#1B1C20' }}
      onClick={onClick}
    >
      <div className="flex items-stretch w-full gap-4">
        {/* Column 1: Order Number - 8% */}
        <div className="w-[8%] flex-shrink-0 px-3 py-2 flex items-center">
          <div className="relative w-12 h-16 bg-neutral-800 rounded-lg flex flex-col items-center justify-center gap-2 border border-neutral-600">
            <span className="text-lg font-bold text-white">{order.id}</span>
            <img src={tableTargetIcon} alt="Table" className="w-5 h-5 object-cover" />
          </div>
        </div>

        {/* Column 2: Guest Info - flex-1 */}
        <div className="flex-1 min-w-0 py-2">
          <div className="flex flex-col">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className="text-white font-medium text-sm">{order.name}</span>
                <span className="text-white/40">·</span>
                <span className="text-white font-medium text-sm">{order.table}</span>
              </div>
              <span className="text-white font-semibold text-sm">{order.amount}</span>
            </div>
            <div className="h-px bg-neutral-600 my-1.5"></div>
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1 text-gray-400">
                <span>Party Of {order.partySize},</span>
                <span>⚡ {order.time}</span>
              </div>
              <span className={getOrderStatusColor(order.status)}>{order.status}</span>
            </div>
          </div>
        </div>

        {/* Column 3: Timer & Server - 12% */}
        <div className="w-[12%] flex-shrink-0 py-2">
          <div className="flex flex-col text-xs gap-1">
            <div className="text-left">
              <div className="text-white font-medium">{order.timer}</div>
              <div className="text-gray-500">Timer</div>
            </div>
            <div className="text-left">
              <div className="text-white">{order.server}</div>
              <div className="text-gray-500">Server</div>
            </div>
          </div>
        </div>

        {/* Column 4: Check & Revenue Center - 12% */}
        <div className="w-[12%] flex-shrink-0 py-2">
          <div className="flex flex-col text-xs gap-1">
            <div className="text-left">
              <div className="text-white font-medium">{order.check}</div>
              <div className="text-gray-500">Check</div>
            </div>
            <div className="text-left">
              <div className="text-white">{order.revenueCenter}</div>
              <div className="text-gray-500">Revenue Center</div>
            </div>
          </div>
        </div>

        {/* Column 5: Payment Type - 12% */}
        <div className="w-[12%] flex-shrink-0 self-start py-2">
          <div className="flex flex-col text-xs">
            <div className="text-left">
              <div className="text-white font-medium">{order.paymentType}</div>
              <div className="text-gray-500">Payment Type</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderLayoutTemplate;
