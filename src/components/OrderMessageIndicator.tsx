import { useOrderMessageStatus } from "@/components/OrderMessageThread";
import messageKdsIcon from "@/assets/icons/message-kds.svg";

interface OrderMessageIndicatorProps {
  orderId: string;
  orderNumber: number;
}

export default function OrderMessageIndicator({ orderId, orderNumber }: OrderMessageIndicatorProps) {
  const { hasUnreadReply } = useOrderMessageStatus(orderId, orderNumber);

  if (!hasUnreadReply) return null;

  return (
    <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-orange-500/20 flex items-center justify-center">
      <img src={messageKdsIcon} alt="KDS message" className="w-2.5 h-2.5" style={{ filter: "brightness(0) saturate(100%) invert(62%) sepia(88%) saturate(1640%) hue-rotate(360deg) brightness(101%) contrast(97%)" }} />
    </div>
  );
}
