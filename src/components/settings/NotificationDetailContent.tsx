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

  // Synthetic in-memory dashboards rendered by NotificationDetailView based on id
  const syntheticIds: Record<string, { title: string; preview: string; headline: string; body: string }> = {
    "live-sales-dashboard": {
      title: "Live Sales Dashboard",
      preview: "Real-time sales, revenue, and AI insights with anomaly detection.",
      headline: "Live Sales & Revenue Dashboard",
      body: "Real-time metrics, trends, and AI analysis.",
    },
    "inventory-dashboard": {
      title: "Live Inventory & Stock Alerts",
      preview: "Real-time stock levels, smart replenishment and depletion forecasts.",
      headline: "AI Inventory Management",
      body: "Stock levels, alerts, replenishment, and predictive forecasting.",
    },
    "profit-dashboard": {
      title: "Real-Time Profit Monitoring",
      preview: "Live gross/net profit, shift & location breakdown with AI-flagged anomalies.",
      headline: "Profit Margin Below Target",
      body: "AI flagged anomalies on dinner shift refunds and labor ratio.",
    },
    "forecasting-dashboard": {
      title: "AI Forecasting & Labor Management",
      preview: "Predictive demand, staffing recommendations, and proactive shift alerts.",
      headline: "Dinner Shift Likely Understaffed",
      body: "AI predicts traffic spike between 7-9 PM. Staffing recommendations available.",
    },
  };

  const synthetic = id && syntheticIds[id]
    ? {
        id,
        ...syntheticIds[id],
        version: "Live",
        version_date: "Today",
        time: "Now",
        bullets: [],
        footer: null,
        has_update: false,
        is_read: true,
        created_at: new Date().toISOString(),
        category: "ai" as const,
      }
    : null;

  const notification = synthetic ?? notifications.find((n) => n.id === id);

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
          <h1 className="text-xl font-semibold text-foreground absolute left-1/2 -translate-x-1/2 truncate max-w-[60%]">
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
