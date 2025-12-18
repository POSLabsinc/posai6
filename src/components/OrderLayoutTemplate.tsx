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
      className={`rounded-xl border overflow-hidden ${borderClass} ${onClick ? 'cursor-pointer transition-all' : ''}`}
      style={{ backgroundColor: '#1B1C20' }}
      onClick={onClick}
    >
      <div className="flex items-stretch w-full gap-2">
        {/* Column 1: Order Number - 8% */}
        <div className="w-[8%] flex-shrink-0 px-2 py-1.5 flex items-center">
          <div className="relative w-9 h-12 bg-neutral-800 rounded-md flex flex-col items-center justify-center gap-1 border border-neutral-600">
            <span className="text-sm font-bold text-white">{order.id}</span>
            <img src={tableTargetIcon} alt="Table" className="w-4 h-4 object-cover" />
          </div>
        </div>

        {/* Column 2: Guest Info - flex-1 */}
        <div className="flex-1 min-w-0 py-1.5">
          <div className="flex flex-col">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-white font-medium text-xs">{order.name}</span>
                <span className="text-white/40 text-xs">·</span>
                <span className="text-white font-medium text-xs">{order.table}</span>
              </div>
              <span className="text-white font-semibold text-xs">{order.amount}</span>
            </div>
            <div className="h-px bg-neutral-600 my-1"></div>
            <div className="flex items-center justify-between text-[10px]">
              <div className="flex items-center gap-1 text-gray-400">
                <span>Party Of {order.partySize},</span>
                <span>⚡ {order.time}</span>
              </div>
              <span className={getOrderStatusColor(order.status)}>{order.status}</span>
            </div>
          </div>
        </div>

        {/* Column 3: Timer & Server - 12% */}
        <div className="w-[12%] flex-shrink-0 py-1.5">
          <div className="flex flex-col text-[10px] gap-0.5">
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
        <div className="w-[12%] flex-shrink-0 py-1.5">
          <div className="flex flex-col text-[10px] gap-0.5">
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
        <div className="w-[12%] flex-shrink-0 self-start py-1.5">
          <div className="flex flex-col text-[10px]">
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
