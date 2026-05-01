import { lazy, Suspense, useCallback } from "react";
import type { ComponentType } from "react";
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
import ThemeBridge from "@/components/ThemeBridge";
import Dashboard from "./pages/Dashboard";

const lazyWithImportRecovery = <T extends ComponentType<unknown>>(
  loader: () => Promise<{ default: T }>,
) =>
  lazy(() =>
    loader().catch((error) => {
      const message = error instanceof Error ? error.message : String(error);
      const isDynamicImportError = /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module/i.test(message);

      if (isDynamicImportError && typeof window !== "undefined") {
        const retryKey = "posai:dynamic-import-retry";
        const retryCount = Number(window.sessionStorage.getItem(retryKey) ?? "0");

        if (retryCount < 1) {
          window.sessionStorage.setItem(retryKey, String(retryCount + 1));
          window.location.replace(`${window.location.pathname}${window.location.search}${window.location.search ? "&" : "?"}reload=${Date.now()}`);
        }
      }

      throw error;
    }),
  );

// Lazy-loaded route pages for code-splitting
const Orders = lazyWithImportRecovery(() => import("./pages/Orders"));
const OrdersDesign1 = lazyWithImportRecovery(() => import("./pages/OrdersDesign1"));
const OrdersDesign2 = lazyWithImportRecovery(() => import("./pages/OrdersDesign2"));
const OrdersDesign3 = lazyWithImportRecovery(() => import("./pages/OrdersDesign3"));
const OrdersDesign4 = lazyWithImportRecovery(() => import("./pages/OrdersDesign4"));
const OrdersA = lazyWithImportRecovery(() => import("./pages/OrdersA"));
const OrdersD = lazyWithImportRecovery(() => import("./pages/OrdersD"));
const OrdersF = lazyWithImportRecovery(() => import("./pages/OrdersF"));
const LiquidGlassDashboard = lazyWithImportRecovery(() => import("./pages/LiquidGlassDashboard"));
const LiquidGlassOrders = lazyWithImportRecovery(() => import("./pages/LiquidGlassOrders"));
const LiquidGlassMenu = lazyWithImportRecovery(() => import("./pages/LiquidGlassMenu"));
const LiquidGlassCheckout = lazyWithImportRecovery(() => import("./pages/LiquidGlassCheckout"));
const LiquidGlassOrders1A = lazyWithImportRecovery(() => import("./pages/LiquidGlassOrders1A"));
const LiquidGlassOrders1B = lazyWithImportRecovery(() => import("./pages/LiquidGlassOrders1B"));
const LiquidGlassOrders2A = lazyWithImportRecovery(() => import("./pages/LiquidGlassOrders2A"));
const LiquidGlassOrders2B = lazyWithImportRecovery(() => import("./pages/LiquidGlassOrders2B"));
const LiquidGlassOrders3A = lazyWithImportRecovery(() => import("./pages/LiquidGlassOrders3A"));
const LiquidGlassOrders3B = lazyWithImportRecovery(() => import("./pages/LiquidGlassOrders3B"));
const LiquidGlassOrders4A = lazyWithImportRecovery(() => import("./pages/LiquidGlassOrders4A"));
const LiquidGlassOrders4B = lazyWithImportRecovery(() => import("./pages/LiquidGlassOrders4B"));
const LiquidGlassOrders5A = lazyWithImportRecovery(() => import("./pages/LiquidGlassOrders5A"));
const LiquidGlassOrders5B = lazyWithImportRecovery(() => import("./pages/LiquidGlassOrders5B"));
const TableOrder = lazyWithImportRecovery(() => import("./pages/TableOrder"));
const TableOrderA = lazyWithImportRecovery(() => import("./pages/TableOrderA"));
const TableOrderB = lazyWithImportRecovery(() => import("./pages/TableOrderB"));
const TableOrderDetails = lazyWithImportRecovery(() => import("./pages/TableOrderDetails"));
const MergeOrders = lazyWithImportRecovery(() => import("./pages/MergeOrders"));
const TransferOrders = lazyWithImportRecovery(() => import("./pages/TransferOrders"));
const Tickets = lazyWithImportRecovery(() => import("./pages/Tickets"));
const Settings = lazyWithImportRecovery(() => import("./pages/Settings"));
const DiscountsRoute = lazyWithImportRecovery(() => import("./components/routes/DiscountsRoute"));
const PaymentPricingRoute = lazyWithImportRecovery(() => import("./components/routes/PaymentPricingRoute"));
const Account = lazyWithImportRecovery(() => import("./pages/Account"));
const ReportsRoute = lazyWithImportRecovery(() => import("./components/routes/ReportsRoute"));
const LiveSales = lazyWithImportRecovery(() => import("./pages/LiveSales"));
const NotFound = lazyWithImportRecovery(() => import("./pages/NotFound"));
const FullReservationsView = lazyWithImportRecovery(() => import("./pages/FullReservationsView"));
const Voucher = lazyWithImportRecovery(() => import("./pages/Voucher"));
const OrderOS = lazyWithImportRecovery(() => import("./pages/OrderOS"));
const ClosedTickets = lazyWithImportRecovery(() => import("./pages/ClosedTickets"));
const Login = lazyWithImportRecovery(() => import("./pages/Login"));
const KDSMessages = lazyWithImportRecovery(() => import("./pages/KDSMessages"));
const KDS = lazyWithImportRecovery(() => import("./pages/KDS"));
const KdsEmbedded = lazyWithImportRecovery(() => import("./pages/KdsEmbedded"));
const ClosingGracePeriod = lazyWithImportRecovery(() => import("./pages/ClosingGracePeriod"));

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
          <Route path="/settings/payments/payment-pricing" element={<PaymentPricingRoute />} />
          <Route path="/settings/*" element={<Settings />} />
          <Route path="/account" element={<Account />} />
          <Route path="/reports" element={<ReportsRoute />} />
          <Route path="/live-sales" element={<LiveSales />} />
          <Route path="/orderos" element={<OrderOS />} />
          <Route path="/login" element={<Login />} />
          <Route path="/kds" element={<KDS />} />
          <Route path="/kds-new" element={<KdsEmbedded />} />
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
      <ThemeBridge />
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
