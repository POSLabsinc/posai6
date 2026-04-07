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
    <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-white flex items-center justify-center shadow-sm">
      <MessageSquare className="w-2 h-2 text-orange-400" />
    </div>
  );
}
