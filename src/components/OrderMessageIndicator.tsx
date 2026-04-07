import { MessageSquare } from "lucide-react";
import { useOrderMessageStatus } from "@/components/OrderMessageThread";

interface OrderMessageIndicatorProps {
  orderId: string;
  orderNumber: number;
}

export default function OrderMessageIndicator({ orderId, orderNumber }: OrderMessageIndicatorProps) {
  const { hasUnreadReply } = useOrderMessageStatus(orderId, orderNumber);

  if (!hasUnreadReply) return null;

  return (
    <div className="absolute -top-1.5 -right-1.5">
      <div className="relative">
        <MessageSquare className="w-3.5 h-3.5 text-orange-400" />
        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
      </div>
    </div>
  );
}
