import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { useCallback } from "react";
import { Layout } from "@/components/Layout";
import { AppProvider } from "@/contexts/AppContext";
import { PanelPositionProvider } from "@/contexts/PanelPositionContext";
import { SessionOrderProvider } from "@/contexts/SessionOrderContext";
import { AppearanceProvider } from "@/contexts/AppearanceContext";
import { FontProvider } from "@/contexts/FontContext";
import { ThemePresetsProvider } from "@/contexts/ThemePresetsContext";
import { DemoConfigProvider } from "@/contexts/DemoConfigContext";
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
import Tickets from "./pages/Tickets";
import Settings from "./pages/Settings";
import Reports from "./pages/Reports";
import NotFound from "./pages/NotFound";
import FullReservationsView from "./pages/FullReservationsView";
// Phase-2 pages
import Auth from "./pages/Auth";
import Account from "./pages/Account";
import POSHome from "./pages/POSHome";
import PersonalInformation from "./pages/PersonalInformation";
import RestaurantInformation from "./pages/RestaurantInformation";
import Security from "./pages/Security";
import SystemSettings from "./pages/SystemSettings";
import AppearanceSettings from "./pages/AppearanceSettings";
import ThemePresets from "./pages/ThemePresets";
import Fonts from "./pages/Fonts";
import ControlCenter from "./pages/ControlCenter";
import PaymentsSettings from "./pages/PaymentsSettings";
// Phase-3 pages
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ClosedTickets from "./pages/ClosedTickets";
import OrderOS from "./pages/OrderOS";
import ScheduledOrders from "./pages/ScheduledOrders";
import ScheduledOrdersV2 from "./pages/ScheduledOrdersV2";
import ScheduledOrdersV3 from "./pages/ScheduledOrdersV3";
import ClosingGracePeriod from "./pages/ClosingGracePeriod";
import ClockIn from "./pages/ClockIn";
// Phase-2 route components
import SystemSettingsRoute from "./components/routes/SystemSettingsRoute";
import AppearanceSettingsRoute from "./components/routes/AppearanceSettingsRoute";
import ControlCenterRoute from "./components/routes/ControlCenterRoute";
import ThemePresetsRoute from "./components/routes/ThemePresetsRoute";
import FontsRoute from "./components/routes/FontsRoute";
import PersonalInformationRoute from "./components/routes/PersonalInformationRoute";
import RestaurantInformationRoute from "./components/routes/RestaurantInformationRoute";
import SecurityRoute from "./components/routes/SecurityRoute";
import PaymentsSettingsRoute from "./components/routes/PaymentsSettingsRoute";
import PaymentMethodsRoute from "./components/routes/PaymentMethodsRoute";
import GratuityRoute from "./components/routes/GratuityRoute";
import TaxesRoute from "./components/routes/TaxesRoute";
import DiscountsRoute from "./components/routes/DiscountsRoute";
import ServiceChargeRoute from "./components/routes/ServiceChargeRoute";
import CashManagementRoute from "./components/routes/CashManagementRoute";
import CashDrawerDetailsRoute from "./components/routes/CashDrawerDetailsRoute";
import PayInOutRoute from "./components/routes/PayInOutRoute";
import CheckoutOptionsRoute from "./components/routes/CheckoutOptionsRoute";
import MenuSettingsRoute from "./components/routes/MenuSettingsRoute";
import MenuItemsRoute from "./components/routes/MenuItemsRoute";
import CategoriesRoute from "./components/routes/CategoriesRoute";
import ModifiersRoute from "./components/routes/ModifiersRoute";
import AddOnsRoute from "./components/routes/AddOnsRoute";
import AddAddOnRoute from "./components/routes/AddAddOnRoute";
import ProductsRoute from "./components/routes/ProductsRoute";
import DefaultModifiersRoute from "./components/routes/DefaultModifiersRoute";
import AddDefaultModifierRoute from "./components/routes/AddDefaultModifierRoute";
import EditDefaultModifierRoute from "./components/routes/EditDefaultModifierRoute";
import GroupsRoute from "./components/routes/GroupsRoute";
import AddGroupRoute from "./components/routes/AddGroupRoute";
import EditGroupRoute from "./components/routes/EditGroupRoute";
import AISettingsRoute from "./components/routes/AISettingsRoute";
import SupportRoute from "./components/routes/SupportRoute";
import FeedbackRoute from "./components/routes/FeedbackRoute";
import SupportContactRoute from "./components/routes/SupportContactRoute";
import AboutRoute from "./components/routes/AboutRoute";
import NetworkRoute from "./components/routes/NetworkRoute";
import ServerConnectionRoute from "./components/routes/ServerConnectionRoute";
import HardwareRoute from "./components/routes/HardwareRoute";
import PrinterRoute from "./components/routes/PrinterRoute";
import PrinterAdvancedRoute from "./components/routes/PrinterAdvancedRoute";
import PairPrinterRoute from "./components/routes/PairPrinterRoute";
import HardwareDetailsRoute from "./components/routes/HardwareDetailsRoute";
import CardReaderRoute from "./components/routes/CardReaderRoute";
import CashRegisterRoute from "./components/routes/CashRegisterRoute";
import ReportsRoute from "./components/routes/ReportsRoute";
import EndOfDayRoute from "./components/routes/EndOfDayRoute";
import NotificationsRoute from "./components/routes/NotificationsRoute";
import GuestBookRoute from "./components/routes/GuestBookRoute";

const queryClient = new QueryClient();

function AppRoutes() {
  const navigate = useNavigate();
  const onRestart = useCallback(() => {
    navigate("/login", { replace: true });
  }, [navigate]);
  return (
    <AppProvider onRestart={onRestart}>
      <Layout>
        <Routes>
                          <Route path="/" element={<Dashboard />} />
                          <Route path="/pos-home" element={<POSHome />} />
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
                          <Route path="/settings" element={<Settings />} />
                          <Route path="/reports" element={<Reports />} />
                          <Route path="/orderos" element={<OrderOS />} />
                          {/* Phase-3: auth & scheduled */}
                          <Route path="/login" element={<Login />} />
                          <Route path="/signup" element={<Signup />} />
                          <Route path="/clock-in" element={<ClockIn />} />
                          <Route path="/scheduled-orders" element={<ScheduledOrders />} />
                          <Route path="/scheduled-orders-v2" element={<ScheduledOrdersV2 />} />
                          <Route path="/scheduled-orders-v3" element={<ScheduledOrdersV3 />} />
                          <Route path="/pos/closing-grace-period" element={<ClosingGracePeriod />} />
                          {/* Phase-2: auth & account */}
                          <Route path="/auth" element={<Auth />} />
                          <Route path="/account" element={<Account />} />
                          <Route path="/account/personal-information" element={<PersonalInformation />} />
                          <Route path="/account/restaurant-information" element={<RestaurantInformation />} />
                          <Route path="/account/security" element={<Security />} />
                          {/* Phase-2: settings nested routes */}
                          <Route path="/settings/account" element={<Settings />} />
                          <Route path="/settings/account/personal-information" element={<PersonalInformationRoute />} />
                          <Route path="/settings/account/restaurant-information" element={<RestaurantInformationRoute />} />
                          <Route path="/settings/account/security" element={<SecurityRoute />} />
                          <Route path="/settings/system" element={<SystemSettingsRoute />} />
                          <Route path="/settings/system/appearance" element={<AppearanceSettingsRoute />} />
                          <Route path="/settings/system/theme-presets" element={<ThemePresetsRoute />} />
                          <Route path="/settings/system/fonts" element={<FontsRoute />} />
                          <Route path="/settings/system/control-center" element={<ControlCenterRoute />} />
                          <Route path="/settings/payments" element={<PaymentsSettingsRoute />} />
                          <Route path="/settings/payments/payment-methods" element={<PaymentMethodsRoute />} />
                          <Route path="/settings/payments/gratuity" element={<GratuityRoute />} />
                          <Route path="/settings/payments/taxes" element={<TaxesRoute />} />
                          <Route path="/settings/payments/discounts" element={<DiscountsRoute />} />
                          <Route path="/settings/payments/service-charge" element={<ServiceChargeRoute />} />
                          <Route path="/settings/payments/cash-management" element={<CashManagementRoute />} />
                          <Route path="/settings/payments/cash-management/details" element={<CashDrawerDetailsRoute />} />
                          <Route path="/settings/payments/cash-management/pay-in-out" element={<PayInOutRoute />} />
                          <Route path="/settings/payments/checkout-options" element={<CheckoutOptionsRoute />} />
                          <Route path="/settings/menu" element={<MenuSettingsRoute />} />
                          <Route path="/settings/menu/menu" element={<MenuItemsRoute />} />
                          <Route path="/settings/menu/categories" element={<CategoriesRoute />} />
                          <Route path="/settings/menu/modifiers" element={<ModifiersRoute />} />
                          <Route path="/settings/menu/add-ons" element={<AddOnsRoute />} />
                          <Route path="/settings/menu/add-ons/add" element={<AddAddOnRoute />} />
                          <Route path="/settings/menu/products" element={<ProductsRoute />} />
                          <Route path="/settings/menu/default-modifiers" element={<DefaultModifiersRoute />} />
                          <Route path="/settings/menu/default-modifiers/add" element={<AddDefaultModifierRoute />} />
                          <Route path="/settings/menu/default-modifiers/edit/:id" element={<EditDefaultModifierRoute />} />
                          <Route path="/settings/menu/groups" element={<GroupsRoute />} />
                          <Route path="/settings/menu/groups/add" element={<AddGroupRoute />} />
                          <Route path="/settings/menu/groups/edit/:id" element={<EditGroupRoute />} />
                          <Route path="/settings/ai-assistant" element={<AISettingsRoute />} />
                          <Route path="/settings/ai" element={<AISettingsRoute />} />
                          <Route path="/settings/support" element={<SupportRoute />} />
                          <Route path="/settings/support/feedback" element={<FeedbackRoute />} />
                          <Route path="/settings/support/contact" element={<SupportContactRoute />} />
                          <Route path="/settings/support/about" element={<AboutRoute />} />
                          <Route path="/settings/network" element={<NetworkRoute />} />
                          <Route path="/settings/network/servers" element={<ServerConnectionRoute />} />
                          <Route path="/settings/hardware" element={<HardwareRoute />} />
                          <Route path="/settings/hardware/details" element={<HardwareDetailsRoute />} />
                          <Route path="/settings/hardware/details/printer" element={<PrinterRoute />} />
                          <Route path="/settings/hardware/details/printer/advanced" element={<PrinterAdvancedRoute />} />
                          <Route path="/settings/hardware/details/printer/pair" element={<PairPrinterRoute />} />
                          <Route path="/settings/hardware/details/card-reader" element={<CardReaderRoute />} />
                          <Route path="/settings/hardware/details/cash-register" element={<CashRegisterRoute />} />
                          <Route path="/settings/notifications" element={<NotificationsRoute />} />
                          <Route path="/settings/guest-book" element={<GuestBookRoute />} />
                          <Route path="/settings/reports" element={<ReportsRoute />} />
                          <Route path="/settings/end-of-day" element={<EndOfDayRoute />} />
                          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
    </AppProvider>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <AppearanceProvider>
        <FontProvider>
          <ThemePresetsProvider>
            <DemoConfigProvider>
              <TooltipProvider>
                <PanelPositionProvider>
                  <SessionOrderProvider>
                    <Toaster />
                    <Sonner />
                    <BrowserRouter>
                      <AppRoutes />
                    </BrowserRouter>
                  </SessionOrderProvider>
                </PanelPositionProvider>
              </TooltipProvider>
            </DemoConfigProvider>
          </ThemePresetsProvider>
        </FontProvider>
      </AppearanceProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
