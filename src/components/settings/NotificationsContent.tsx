import { useState, useEffect } from "react";
import { ChevronRight, ChevronLeft, Check, Bell, Volume2, BellRing } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";
import AnimatedAIIcon from "@/components/AnimatedAIIcon";
import notificationsIcon from "@/assets/icons/settings-notifications.png";
import { useAppearance } from "@/contexts/AppearanceContext";
import { usePreference } from "@/hooks/usePreference";
import { Switch } from "@/components/ui/switch";
import { requestNotificationPermission, getNotificationPermissionStatus, cacheSoundPreference } from "@/lib/alertService";

type NotificationStyleType = "Count" | "Stack" | "List";

interface NotificationsContentProps {
  showHeader?: boolean;
  onBack?: () => void;
  onNavigate?: (path: string) => void;
  onAIClick?: () => void;
}

// ── Style Preview Components ──────────────────────────────

const CountPreview = () => (
  <div className="flex items-center justify-center py-6">
    <div className="relative">
      <div className="w-14 h-14 rounded-2xl bg-card flex items-center justify-center border border-border">
        <Bell className="w-7 h-7 text-muted-foreground" />
      </div>
      <span className="absolute -top-2 -right-2 min-w-[22px] h-[22px] rounded-full bg-[#ED1C24] text-white text-[11px] font-bold flex items-center justify-center px-1.5">
        3
      </span>
    </div>
  </div>
);

const StackPreview = () => (
  <div className="flex flex-col items-center py-4 px-6">
    <div className="relative w-full max-w-[260px]">
      {/* Bottom card (offset) */}
      <div className="absolute top-3 left-2 right-2 h-16 bg-card/40 rounded-2xl border border-border/30" />
      {/* Middle card (offset) */}
      <div className="absolute top-1.5 left-1 right-1 h-16 bg-card/60 rounded-2xl border border-border/50" />
      {/* Top card */}
      <div className="relative bg-card rounded-2xl border border-border p-3 flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0">
          <Bell className="w-4 h-4 text-emerald-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">New Order Received</p>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">Order #1042 from John D.</p>
        </div>
        <span className="text-[10px] text-muted-foreground shrink-0 mt-0.5">2m ago</span>
      </div>
    </div>
    <p className="text-xs text-muted-foreground mt-5">+2 more notifications</p>
  </div>
);

const ListPreview = () => {
  const items = [
    { title: "New Order Received", preview: "Order #1042 from John D.", time: "2m ago", dotColor: "bg-emerald-500" },
    { title: "Order Cancelled", preview: "Order #1038 has been cancelled", time: "15m ago", dotColor: "bg-red-500" },
    { title: "PIN Updated", preview: "Manager PIN changed successfully", time: "1h ago", dotColor: "bg-blue-500" },
  ];

  return (
    <div className="px-4 py-3">
      <div className="bg-card rounded-2xl overflow-hidden border border-border">
        {items.map((item, idx) => (
          <div key={idx}>
            {idx > 0 && <div className="h-px bg-border mx-4" />}
            <div className="flex items-start gap-3 py-3 px-3.5">
              <span className={`w-2 h-2 rounded-full ${item.dotColor} shrink-0 mt-1.5`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-foreground truncate">{item.title}</span>
                  <span className="text-[10px] text-muted-foreground shrink-0">{item.time}</span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{item.preview}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const StylePreview = ({ style }: { style: NotificationStyleType }) => {
  switch (style) {
    case "Count":
      return <CountPreview />;
    case "Stack":
      return <StackPreview />;
    case "List":
      return <ListPreview />;
  }
};

// ── Main Component ──────────────────────────────

const NotificationsContent = ({ showHeader = true, onBack, onNavigate, onAIClick }: NotificationsContentProps) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { getIconBgColor } = useAppearance();
  const { value: notificationStyle, update: setNotificationStyle, loading: styleLoading } = usePreference("notification_style", "List");
  const { value: soundEnabled, update: setSoundEnabled } = usePreference("notification_sound", "true");
  const [pushPermission, setPushPermission] = useState<NotificationPermission | "unsupported">("default");

  useEffect(() => {
    setPushPermission(getNotificationPermissionStatus());
  }, []);

  const handlePushToggle = async () => {
    if (pushPermission === "granted") return; // Already granted, can't revoke via API
    const granted = await requestNotificationPermission();
    setPushPermission(granted ? "granted" : "denied");
  };

  const handleNavigate = (path: string) => {
    if (onNavigate) {
      onNavigate(path);
    }
  };

  const styleOptions: { value: NotificationStyleType; label: string; description: string }[] = [
    { value: "Count", label: "Count", description: "Badge with unread count" },
    { value: "Stack", label: "Stack", description: "Stacked card preview" },
    { value: "List", label: "List", description: "Full notification list" },
  ];

  return (
    <div className="h-full overflow-y-auto scrollbar-hide overscroll-contain">
      <div className={`${showHeader ? 'p-4' : 'px-4 pb-4 pt-0'} space-y-6`}>
        {/* Back button for desktop */}
        {showHeader && !isMobile && (
          <div className="flex items-center gap-3 mb-2 md:hidden">
            <button
              onClick={onBack}
              className="w-10 h-10 rounded-full bg-neutral-800/60 flex items-center justify-center active:opacity-70 transition-opacity"
            >
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>
          </div>
        )}

        {/* Header Card */}
        <div className="bg-neutral-800/60 rounded-2xl flex flex-col items-start py-6 px-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: getIconBgColor("#ED1C24") }}>
            <img src={notificationsIcon} alt="Notifications" className="w-8 h-8 object-contain" />
          </div>
          <h2 className="text-xl font-semibold text-foreground">Notifications</h2>
          <p className="text-sm text-muted-foreground mt-2 w-full">
            Manage how notifications are displayed and organized across the Point of Sale.
          </p>
        </div>

        {/* AI Assistant Icon - hidden on mobile (shown in page wrapper) */}
        <div className="hidden md:flex justify-end mb-3 overflow-visible">
          <AnimatedAIIcon size={24} onClick={onAIClick || (() => navigate('/settings/ai'))} />
        </div>

        {/* All Notifications Section */}
        <div>
          <p className="text-xs font-medium text-neutral-500 tracking-wider px-1 mb-3">All Notifications</p>
          <div className="bg-neutral-800/60 rounded-full overflow-hidden">
            <button
              onClick={() => handleNavigate('/settings/notifications/all')}
              className="flex items-center justify-between w-full py-3.5 px-4 active:opacity-70 transition-opacity"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: getIconBgColor("#ED1C24") }}>
                  <img src={notificationsIcon} alt="Notifications" className="w-4 h-4 object-contain" />
                </div>
                <span className="text-foreground text-base font-medium">Notifications</span>
              </div>
              <ChevronRight className="w-5 h-5 text-neutral-500" />
            </button>
          </div>
        </div>

        {/* Style Section */}
        <div>
          <p className="text-xs font-medium text-neutral-500 tracking-wider px-1 mb-3">Notification Style</p>
          <div className="grid grid-cols-3 gap-3">
            {styleOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setNotificationStyle(option.value)}
                className={`relative flex flex-col items-center gap-2 py-4 px-3 rounded-2xl border-2 transition-all active:scale-[0.97] ${
                  notificationStyle === option.value
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card/60 hover:bg-card"
                }`}
              >
                {notificationStyle === option.value && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-3 h-3 text-primary-foreground" />
                  </div>
                )}
                <span className="text-sm font-semibold text-foreground">{option.label}</span>
                <span className="text-[10px] text-muted-foreground text-center leading-tight">{option.description}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Style Preview */}
        <div>
          <p className="text-xs font-medium text-neutral-500 tracking-wider px-1 mb-3">Preview</p>
          <div className="bg-neutral-800/60 rounded-2xl overflow-hidden">
            <StylePreview style={notificationStyle as NotificationStyleType} />
          </div>
        </div>

        {/* Alerts Section */}
        <div>
          <p className="text-xs font-medium text-neutral-500 tracking-wider px-1 mb-3">Alerts</p>
          <div className="bg-neutral-800/60 rounded-2xl overflow-hidden">
            {/* Sound Alerts */}
            <div className="flex items-center justify-between py-3.5 px-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center">
                  <Volume2 className="w-4 h-4 text-amber-500" />
                </div>
                <div>
                  <span className="text-foreground text-sm font-medium">Sound Alerts</span>
                  <p className="text-[11px] text-muted-foreground">Play tones for orders & errors</p>
                </div>
              </div>
              <Switch
                checked={soundEnabled === "true"}
                onCheckedChange={(checked) => { setSoundEnabled(checked ? "true" : "false"); cacheSoundPreference(checked); }}
              />
            </div>

            <div className="h-px bg-border mx-4" />

            {/* Push Notifications */}
            <div className="flex items-center justify-between py-3.5 px-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center">
                  <BellRing className="w-4 h-4 text-blue-500" />
                </div>
                <div>
                  <span className="text-foreground text-sm font-medium">Push Notifications</span>
                  <p className="text-[11px] text-muted-foreground">
                    {pushPermission === "granted"
                      ? "Enabled – alerts when tab is in background"
                      : pushPermission === "denied"
                      ? "Blocked – enable in browser settings"
                      : pushPermission === "unsupported"
                      ? "Not supported in this browser"
                      : "Tap to enable browser notifications"}
                  </p>
                </div>
              </div>
              {pushPermission === "unsupported" || pushPermission === "denied" ? (
                <div className="w-9 h-5 rounded-full bg-muted opacity-50" />
              ) : (
                <Switch
                  checked={pushPermission === "granted"}
                  onCheckedChange={handlePushToggle}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationsContent;
