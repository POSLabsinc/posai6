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
    <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-orange-500/20 flex items-center justify-center">
      <MessageSquare className="w-2.5 h-2.5 text-orange-400" />
    </div>
  );
}
