import { ChevronLeft } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useNotifications } from "@/hooks/useNotifications";
import { NotificationDetailView } from "@/components/settings/NotificationsListContent";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

interface NotificationDetailContentProps {
  showHeader?: boolean;
  onBack?: () => void;
  onAIClick?: () => void;
  notificationId?: string;
}

const NotificationDetailContent = ({ showHeader = true, onBack, onAIClick, notificationId }: NotificationDetailContentProps) => {
  const navigate = useNavigate();
  const params = useParams();
  const id = notificationId || params.id;
  const { notifications, loading, markAsRead } = useNotifications();

  const notification = notifications.find((n) => n.id === id);

  // Mark as read when viewed
  useEffect(() => {
    if (notification && !notification.is_read) {
      markAsRead(notification.id);
    }
  }, [notification?.id, notification?.is_read, markAsRead]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!notification) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-muted-foreground">Notification not found</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {showHeader && (
        <div className="flex items-center justify-between pt-0 pb-2 relative overflow-visible px-4 shrink-0">
          {onBack && (
            <button
              onClick={onBack}
              className="w-10 h-10 rounded-full bg-card flex items-center justify-center active:opacity-70 transition-opacity"
            >
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>
          )}
          <h1 className="text-lg font-semibold text-foreground absolute left-1/2 -translate-x-1/2 truncate max-w-[60%]">
            {notification.title}
          </h1>
        </div>
      )}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <NotificationDetailView notification={notification} />
      </div>
    </div>
  );
};

export default NotificationDetailContent;
