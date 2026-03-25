import { lazy, Suspense, useCallback } from "react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { AppProvider } from "@/contexts/AppContext";
import { AppearanceProvider } from "@/contexts/AppearanceContext";
import { FontProvider } from "@/contexts/FontContext";
import { PanelPositionProvider } from "@/contexts/PanelPositionContext";
import { SessionOrderProvider } from "@/contexts/SessionOrderContext";
import { UnifiedOrderProvider } from "@/contexts/UnifiedOrderContext";
import { ThemePresetsProvider } from "@/contexts/ThemePresetsContext";
import { useAutoRestart } from "@/hooks/useAutoRestart";
import { useEndOfDayScheduler } from "@/hooks/useEndOfDayScheduler";
import ClosingGracePeriodModal from "@/components/ClosingGracePeriodModal";
import { AutoLockProvider } from "@/contexts/AutoLockContext";
import { VoucherModeProvider } from "@/contexts/VoucherModeContext";
import { SettingsManager } from "@/lib/settingsManager";

// Lazy-loaded route pages for code-splitting
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Orders = lazy(() => import("./pages/Orders"));
const OrdersDesign1 = lazy(() => import("./pages/OrdersDesign1"));
const OrdersDesign2 = lazy(() => import("./pages/OrdersDesign2"));
const OrdersDesign3 = lazy(() => import("./pages/OrdersDesign3"));
const OrdersDesign4 = lazy(() => import("./pages/OrdersDesign4"));
const OrdersA = lazy(() => import("./pages/OrdersA"));
const OrdersD = lazy(() => import("./pages/OrdersD"));
const OrdersF = lazy(() => import("./pages/OrdersF"));
const LiquidGlassDashboard = lazy(() => import("./pages/LiquidGlassDashboard"));
const LiquidGlassOrders = lazy(() => import("./pages/LiquidGlassOrders"));
const LiquidGlassMenu = lazy(() => import("./pages/LiquidGlassMenu"));
const LiquidGlassCheckout = lazy(() => import("./pages/LiquidGlassCheckout"));
const LiquidGlassOrders1A = lazy(() => import("./pages/LiquidGlassOrders1A"));
const LiquidGlassOrders1B = lazy(() => import("./pages/LiquidGlassOrders1B"));
const LiquidGlassOrders2A = lazy(() => import("./pages/LiquidGlassOrders2A"));
const LiquidGlassOrders2B = lazy(() => import("./pages/LiquidGlassOrders2B"));
const LiquidGlassOrders3A = lazy(() => import("./pages/LiquidGlassOrders3A"));
const LiquidGlassOrders3B = lazy(() => import("./pages/LiquidGlassOrders3B"));
const LiquidGlassOrders4A = lazy(() => import("./pages/LiquidGlassOrders4A"));
const LiquidGlassOrders4B = lazy(() => import("./pages/LiquidGlassOrders4B"));
const LiquidGlassOrders5A = lazy(() => import("./pages/LiquidGlassOrders5A"));
const LiquidGlassOrders5B = lazy(() => import("./pages/LiquidGlassOrders5B"));
const TableOrder = lazy(() => import("./pages/TableOrder"));
const TableOrderA = lazy(() => import("./pages/TableOrderA"));
const TableOrderB = lazy(() => import("./pages/TableOrderB"));
const TableOrderDetails = lazy(() => import("./pages/TableOrderDetails"));
const MergeOrders = lazy(() => import("./pages/MergeOrders"));
const TransferOrders = lazy(() => import("./pages/TransferOrders"));
const Tickets = lazy(() => import("./pages/Tickets"));
const Settings = lazy(() => import("./pages/Settings"));
const DiscountsRoute = lazy(() => import("./components/routes/DiscountsRoute"));
const Account = lazy(() => import("./pages/Account"));
const ReportsRoute = lazy(() => import("./components/routes/ReportsRoute"));
const NotFound = lazy(() => import("./pages/NotFound"));
const FullReservationsView = lazy(() => import("./pages/FullReservationsView"));
const Voucher = lazy(() => import("./pages/Voucher"));
const OrderOS = lazy(() => import("./pages/OrderOS"));
const ClosedTickets = lazy(() => import("./pages/ClosedTickets"));
const Login = lazy(() => import("./pages/Login"));
const KDSMessages = lazy(() => import("./pages/KDSMessages"));
const KDS = lazy(() => import("./pages/KDS"));
const ClosingGracePeriod = lazy(() => import("./pages/ClosingGracePeriod"));

const queryClient = new QueryClient();

// Initialize settings from database on app load
SettingsManager.initFromDatabase();

// Minimal loading fallback
const PageLoader = () => (
  <div className="flex items-center justify-center h-full w-full bg-background">
    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

// Inner component that can use hooks
const AppInner = () => {
  useAutoRestart();
  const { showGracePeriodModal, setShowGracePeriodModal } = useEndOfDayScheduler();

  const handleGraceExtension = useCallback(async (minutes: number) => {
    const { supabase: sb } = await import("@/integrations/supabase/client");
    const today = new Date().toISOString().slice(0, 10);
    const totalMin = 22 * 60 + minutes;
    const h = Math.floor(totalMin / 60) % 24;
    const m = totalMin % 60;
    const period = h >= 12 ? "PM" : "AM";
    const dh = h === 0 ? 12 : h > 12 ? h - 12 : h;
    const newClosing = `${dh}:${m.toString().padStart(2, "0")} ${period}`;

    await (sb as any).from("closing_time_extensions").upsert(
      {
        device_id: "shared",
        extension_date: today,
        original_closing_time: "10:00 PM",
        extension_minutes: minutes,
        new_closing_time: newClosing,
        status: "active",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "device_id,extension_date" }
    );
    setShowGracePeriodModal(false);
  }, [setShowGracePeriodModal]);

  const handleGraceNoExtension = useCallback(async () => {
    const { supabase: sb } = await import("@/integrations/supabase/client");
    const today = new Date().toISOString().slice(0, 10);
    await (sb as any).from("closing_time_extensions").upsert(
      {
        device_id: "shared",
        extension_date: today,
        original_closing_time: "10:00 PM",
        extension_minutes: 0,
        new_closing_time: "10:00 PM",
        status: "declined",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "device_id,extension_date" }
    );
    setShowGracePeriodModal(false);
  }, [setShowGracePeriodModal]);

  return (
    <BrowserRouter>
      <AutoLockProvider>
      <Layout>
        <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/home" element={<Dashboard />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/orders-a" element={<OrdersA />} />
          <Route path="/orders-d" element={<OrdersD />} />
          <Route path="/orders-f" element={<OrdersF />} />
          <Route path="/orders-design-1" element={<OrdersDesign1 />} />
          <Route path="/orders-design-2" element={<OrdersDesign2 />} />
          <Route path="/orders-design-3" element={<OrdersDesign3 />} />
          <Route path="/orders-design-4" element={<OrdersDesign4 />} />
          <Route path="/liquid-dashboard" element={<LiquidGlassDashboard />} />
          <Route path="/liquid-orders" element={<LiquidGlassOrders />} />
          <Route path="/liquid-menu" element={<LiquidGlassMenu />} />
          <Route path="/liquid-checkout" element={<LiquidGlassCheckout />} />
          <Route path="/liquid-orders-1a" element={<LiquidGlassOrders1A />} />
          <Route path="/liquid-orders-1b" element={<LiquidGlassOrders1B />} />
          <Route path="/liquid-orders-2a" element={<LiquidGlassOrders2A />} />
          <Route path="/liquid-orders-2b" element={<LiquidGlassOrders2B />} />
          <Route path="/liquid-orders-3a" element={<LiquidGlassOrders3A />} />
          <Route path="/liquid-orders-3b" element={<LiquidGlassOrders3B />} />
          <Route path="/liquid-orders-4a" element={<LiquidGlassOrders4A />} />
          <Route path="/liquid-orders-4b" element={<LiquidGlassOrders4B />} />
          <Route path="/liquid-orders-5a" element={<LiquidGlassOrders5A />} />
          <Route path="/liquid-orders-5b" element={<LiquidGlassOrders5B />} />
          <Route path="/tableorder" element={<TableOrder />} />
          <Route path="/tableorder-a" element={<TableOrderA />} />
          <Route path="/tableorder-b" element={<TableOrderB />} />
          <Route path="/tableorder/:tableId" element={<TableOrderDetails />} />
          <Route path="/tableorder/:tableId/merge" element={<MergeOrders />} />
          <Route path="/tableorder/:tableId/transfer" element={<TransferOrders />} />
          <Route path="/reservations" element={<FullReservationsView />} />
          <Route path="/tickets" element={<Tickets />} />
          <Route path="/closed-tickets" element={<ClosedTickets />} />
          <Route path="/voucher" element={<Voucher />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/settings/payments/discounts" element={<DiscountsRoute />} />
          <Route path="/settings/*" element={<Settings />} />
          <Route path="/account" element={<Account />} />
          <Route path="/reports" element={<ReportsRoute />} />
          <Route path="/orderos" element={<OrderOS />} />
          <Route path="/login" element={<Login />} />
          <Route path="/kds" element={<KDS />} />
          <Route path="/closing-grace-period" element={<ClosingGracePeriod />} />
          <Route path="/kds/messages" element={<KDSMessages />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        </Suspense>
      </Layout>
      <ClosingGracePeriodModal
        isOpen={showGracePeriodModal}
        onClose={() => setShowGracePeriodModal(false)}
        onConfirmExtension={handleGraceExtension}
        onConfirmNoExtension={handleGraceNoExtension}
      />
      </AutoLockProvider>
    </BrowserRouter>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} storageKey="pos-app-theme">
      <TooltipProvider>
        <AppProvider onRestart={() => window.location.reload()}>
          <AppearanceProvider>
          <FontProvider>
          <PanelPositionProvider>
            <SessionOrderProvider>
            <UnifiedOrderProvider>
            <ThemePresetsProvider>
            <VoucherModeProvider>
              <Toaster />
              <Sonner />
              <AppInner />
            </VoucherModeProvider>
            </ThemePresetsProvider>
            </UnifiedOrderProvider>
          </SessionOrderProvider>
          </PanelPositionProvider>
          </FontProvider>
          </AppearanceProvider>
        </AppProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
