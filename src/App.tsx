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
import { AutoLockProvider } from "@/contexts/AutoLockContext";
import { VoucherModeProvider } from "@/contexts/VoucherModeContext";
import Dashboard from "./pages/Dashboard";
import Orders from "./pages/Orders";
import OrdersDesign1 from "./pages/OrdersDesign1";
import OrdersDesign2 from "./pages/OrdersDesign2";
import OrdersDesign3 from "./pages/OrdersDesign3";
import OrdersDesign4 from "./pages/OrdersDesign4";
import OrdersA from "./pages/OrdersA";
import OrdersD from "./pages/OrdersD";
import OrdersF from "./pages/OrdersF";
import LiquidGlassDashboard from "./pages/LiquidGlassDashboard";
import LiquidGlassOrders from "./pages/LiquidGlassOrders";
import LiquidGlassMenu from "./pages/LiquidGlassMenu";
import LiquidGlassCheckout from "./pages/LiquidGlassCheckout";
import LiquidGlassOrders1A from "./pages/LiquidGlassOrders1A";
import LiquidGlassOrders1B from "./pages/LiquidGlassOrders1B";
import LiquidGlassOrders2A from "./pages/LiquidGlassOrders2A";
import LiquidGlassOrders2B from "./pages/LiquidGlassOrders2B";
import LiquidGlassOrders3A from "./pages/LiquidGlassOrders3A";
import LiquidGlassOrders3B from "./pages/LiquidGlassOrders3B";
import LiquidGlassOrders4A from "./pages/LiquidGlassOrders4A";
import LiquidGlassOrders4B from "./pages/LiquidGlassOrders4B";
import LiquidGlassOrders5A from "./pages/LiquidGlassOrders5A";
import LiquidGlassOrders5B from "./pages/LiquidGlassOrders5B";
import TableOrder from "./pages/TableOrder";
import TableOrderA from "./pages/TableOrderA";
import TableOrderB from "./pages/TableOrderB";
import TableOrderDetails from "./pages/TableOrderDetails";
import MergeOrders from "./pages/MergeOrders";
import TransferOrders from "./pages/TransferOrders";
import MessageKitchen from "./pages/MessageKitchen";
import Tickets from "./pages/Tickets";
import Settings from "./pages/Settings";
import DiscountsRoute from "./components/routes/DiscountsRoute";
import Account from "./pages/Account";
import Reports from "./pages/Reports";
import NotFound from "./pages/NotFound";
import FullReservationsView from "./pages/FullReservationsView";
import Voucher from "./pages/Voucher";
import OrderOS from "./pages/OrderOS";
import ClosedTickets from "./pages/ClosedTickets";
import Login from "./pages/Login";
import KDSMessages from "./pages/KDSMessages";
import KDS from "./pages/KDS";
import { SettingsManager } from "@/lib/settingsManager";

const queryClient = new QueryClient();

// Initialize settings from database on app load
SettingsManager.initFromDatabase();

// Inner component that can use hooks
const AppInner = () => {
  useAutoRestart();
  useEndOfDayScheduler();
  return (
    <BrowserRouter>
      <AutoLockProvider>
      <Layout>
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
          <Route path="/message-kitchen" element={<MessageKitchen />} />
          <Route path="/reservations" element={<FullReservationsView />} />
          <Route path="/tickets" element={<Tickets />} />
          <Route path="/closed-tickets" element={<ClosedTickets />} />
          <Route path="/voucher" element={<Voucher />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/settings/payments/discounts" element={<DiscountsRoute />} />
          <Route path="/settings/*" element={<Settings />} />
          <Route path="/account" element={<Account />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/orderos" element={<OrderOS />} />
          <Route path="/login" element={<Login />} />
          <Route path="/kds" element={<KDS />} />
          <Route path="/kds/messages" element={<KDSMessages />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
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
