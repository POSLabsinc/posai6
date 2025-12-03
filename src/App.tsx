import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import Dashboard from "./pages/Dashboard";
import Orders from "./pages/Orders";
import OrdersDesign1 from "./pages/OrdersDesign1";
import OrdersDesign2 from "./pages/OrdersDesign2";
import OrdersDesign3 from "./pages/OrdersDesign3";
import OrdersDesign4 from "./pages/OrdersDesign4";
import LiquidGlassDashboard from "./pages/LiquidGlassDashboard";
import LiquidGlassOrders from "./pages/LiquidGlassOrders";
import LiquidGlassMenu from "./pages/LiquidGlassMenu";
import LiquidGlassCheckout from "./pages/LiquidGlassCheckout";
import POS from "./pages/POS";
import Settings from "./pages/Settings";
import Reports from "./pages/Reports";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/orders-design-1" element={<OrdersDesign1 />} />
            <Route path="/orders-design-2" element={<OrdersDesign2 />} />
            <Route path="/orders-design-3" element={<OrdersDesign3 />} />
            <Route path="/orders-design-4" element={<OrdersDesign4 />} />
            <Route path="/liquid-dashboard" element={<LiquidGlassDashboard />} />
            <Route path="/liquid-orders" element={<LiquidGlassOrders />} />
            <Route path="/liquid-menu" element={<LiquidGlassMenu />} />
            <Route path="/liquid-checkout" element={<LiquidGlassCheckout />} />
            <Route path="/pos" element={<POS />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
