import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import SettingsNavigation from "@/components/SettingsNavigation";

import AccountPanel from "@/components/AccountPanel";
import PersonalInformationContent from "@/components/settings/PersonalInformationContent";
import RestaurantInformationContent from "@/components/settings/RestaurantInformationContent";
import SecurityContent from "@/components/settings/SecurityContent";
import SystemSettingsContent from "@/components/settings/SystemSettingsContent";
import AppearanceSettingsContent from "@/components/settings/AppearanceSettingsContent";
import ControlCenterContent from "@/components/settings/ControlCenterContent";
import ThemePresetsContent from "@/components/settings/ThemePresetsContent";
import FontsContent from "@/components/settings/FontsContent";
import SystemFontsContent from "@/components/settings/SystemFontsContent";
import MyFontsContent from "@/components/settings/MyFontsContent";
import MoreFontsContent from "@/components/settings/MoreFontsContent";
import PaymentsSettingsContent from "@/components/settings/PaymentsSettingsContent";
import PaymentMethodsContent from "@/components/settings/PaymentMethodsContent";
import GratuityContent from "@/components/settings/GratuityContent";
import TaxesContent from "@/components/settings/TaxesContent";
import DiscountsContent from "@/components/settings/DiscountsContent";
import ServiceChargeContent from "@/components/settings/ServiceChargeContent";
import CashManagementContent from "@/components/settings/CashManagementContent";
import CashDrawerDetailsContent from "@/components/settings/CashDrawerDetailsContent";
import PayInOutContent from "@/components/settings/PayInOutContent";
import CheckoutOptionsContent from "@/components/settings/CheckoutOptionsContent";

import MenuSettingsContent from "@/components/settings/MenuSettingsContent";

import AddMenuContent from "@/components/settings/AddMenuContent";
import EditMenuContent from "@/components/settings/EditMenuContent";
import MenuItemsContent from "@/components/settings/MenuItemsContent";
import CategoriesContent from "@/components/settings/CategoriesContent";
import ModifiersContent from "@/components/settings/ModifiersContent";
import AddOnsContent from "@/components/settings/AddOnsContent";
import AddAddOnContent from "@/components/settings/AddAddOnContent";
import ProductsContent from "@/components/settings/ProductsContent";
import AddProductContent from "@/components/settings/AddProductContent";
import DefaultModifiersContent from "@/components/settings/DefaultModifiersContent";
import AddDefaultModifierContent from "@/components/settings/AddDefaultModifierContent";
import EditDefaultModifierContent from "@/components/settings/EditDefaultModifierContent";
import GroupsContent from "@/components/settings/GroupsContent";
import AddGroupContent from "@/components/settings/AddGroupContent";
import EditGroupContent from "@/components/settings/EditGroupContent";
import AISettingsContent from "@/components/settings/AISettingsContent";
import SupportContent from "@/components/settings/SupportContent";
import FeedbackContent from "@/components/settings/FeedbackContent";
import SupportContactContent from "@/components/settings/SupportContactContent";
import AboutContent from "@/components/settings/AboutContent";
import PrivacyPolicyContent from "@/components/settings/PrivacyPolicyContent";
import LegalTermsContent from "@/components/settings/LegalTermsContent";
import ReportFraudContent from "@/components/settings/ReportFraudContent";
import NetworkContent from "@/components/settings/NetworkContent";
import ServerConnectionContent from "@/components/settings/ServerConnectionContent";
import HardwareContent from "@/components/settings/HardwareContent";
import HardwareDetailsContent from "@/components/settings/HardwareDetailsContent";
import PrinterContent from "@/components/settings/PrinterContent";
import PrinterAdvancedContent from "@/components/settings/PrinterAdvancedContent";
import PairPrinterContent from "@/components/settings/PairPrinterContent";
import CardReaderContent from "@/components/settings/CardReaderContent";
import CashRegisterContent from "@/components/settings/CashRegisterContent";
import NotificationsContent from "@/components/settings/NotificationsContent";
import NotificationsListContent from "@/components/settings/NotificationsListContent";
import NotificationDetailContent from "@/components/settings/NotificationDetailContent";
import ReportsContent from "@/components/settings/ReportsContent";
import EndOfDayContent from "@/components/settings/EndOfDayContent";
import GuestBookContent from "@/components/settings/GuestBookContent";
import WorkforceContent from "@/components/settings/WorkforceContent";
import EmployeeContent from "@/components/settings/EmployeeContent";
import AddEmployeeContent from "@/components/settings/AddEmployeeContent";
import ShiftContent from "@/components/settings/ShiftContent";
import AddShiftContent from "@/components/settings/AddShiftContent";
import EditShiftContent from "@/components/settings/EditShiftContent";
import { useIsMobile } from "@/hooks/use-mobile";

// Map routes to content components for the right panel
const getContentForRoute = (
  pathname: string, 
  navigate: (path: string) => void, 
  locationState: any,
  showAIChat: boolean,
  setShowAIChat: (show: boolean) => void
) => {
  // If AI chat is active, show it in the right panel
  if (showAIChat) {
    const aiContext = pathname.startsWith('/settings/menu') ? 'menu'
      : pathname.startsWith('/settings/system') ? 'system'
      : pathname.startsWith('/settings/payments') ? 'payments'
      : pathname === '/settings/end-of-day' ? 'end-of-day'
      : pathname === '/settings/guest-book' ? 'guest-book'
      : pathname.startsWith('/settings/workforce') ? 'workforce'
      : pathname.startsWith('/settings/support') ? 'support'
      : pathname.startsWith('/settings/network') ? 'network'
      : pathname.startsWith('/settings/hardware') ? 'hardware'
      : pathname.startsWith('/settings/notifications') ? 'notifications'
      : pathname.startsWith('/settings/reports') ? 'reports'
      : undefined;
    return <AISettingsContent showHeader={true} onBack={() => setShowAIChat(false)} context={aiContext} />;
  }
  
  if (pathname === '/settings/account' || pathname === '/settings') {
    return <AccountPanel showHeader={true} onAIClick={() => setShowAIChat(true)} />;
  }
  if (pathname === '/settings/account/personal-information') {
    return <PersonalInformationContent showHeader={true} onBack={() => navigate('/settings/account')} onAIClick={() => setShowAIChat(true)} />;
  }
  if (pathname === '/settings/account/restaurant-information') {
    return <RestaurantInformationContent showHeader={true} onBack={() => navigate('/settings/account')} onAIClick={() => setShowAIChat(true)} />;
  }
  if (pathname === '/settings/account/security') {
    return <SecurityContent showHeader={true} onBack={() => navigate('/settings/account')} onAIClick={() => setShowAIChat(true)} />;
  }
  if (pathname === '/settings/system') {
    return <SystemSettingsContent showHeader={false} onNavigate={navigate} onAIClick={() => setShowAIChat(true)} />;
  }
  if (pathname === '/settings/system/appearance') {
    return <AppearanceSettingsContent showHeader={true} onBack={() => navigate('/settings/system')} onAIClick={() => setShowAIChat(true)} onNavigate={navigate} />;
  }
  if (pathname === '/settings/system/theme-presets') {
    return <ThemePresetsContent showHeader={true} onBack={() => navigate('/settings/system/appearance')} onAIClick={() => setShowAIChat(true)} />;
  }
  if (pathname === '/settings/system/fonts') {
    return <FontsContent showHeader={true} onBack={() => navigate('/settings/system/appearance')} onAIClick={() => setShowAIChat(true)} onNavigate={navigate} />;
  }
  if (pathname === '/settings/system/fonts/system') {
    return <SystemFontsContent showHeader={true} onBack={() => navigate('/settings/system/fonts')} onAIClick={() => setShowAIChat(true)} />;
  }
  if (pathname === '/settings/system/fonts/my-fonts') {
    return <MyFontsContent showHeader={true} onBack={() => navigate('/settings/system/fonts')} onAIClick={() => setShowAIChat(true)} />;
  }
  if (pathname === '/settings/system/fonts/more') {
    return <MoreFontsContent showHeader={true} onBack={() => navigate('/settings/system/fonts')} onAIClick={() => setShowAIChat(true)} />;
  }
  if (pathname === '/settings/system/control-center') {
    return <ControlCenterContent showHeader={true} onBack={() => navigate('/settings/system')} onAIClick={() => setShowAIChat(true)} />;
  }
  if (pathname === '/settings/payments') {
    return <PaymentsSettingsContent showHeader={false} onNavigate={navigate} onAIClick={() => setShowAIChat(true)} />;
  }
  if (pathname === '/settings/payments/payment-methods') {
    return <PaymentMethodsContent showHeader={true} onBack={() => navigate('/settings/payments')} onAIClick={() => setShowAIChat(true)} />;
  }
  if (pathname === '/settings/payments/gratuity') {
    return <GratuityContent showHeader={true} onBack={() => navigate('/settings/payments')} onAIClick={() => setShowAIChat(true)} />;
  }
  if (pathname === '/settings/payments/taxes') {
    return <TaxesContent showHeader={true} onBack={() => navigate('/settings/payments')} onAIClick={() => setShowAIChat(true)} />;
  }
  if (pathname === '/settings/payments/discounts') {
    return <DiscountsContent showHeader={true} onBack={() => navigate('/settings/payments')} onAIClick={() => setShowAIChat(true)} />;
  }
  if (pathname === '/settings/payments/service-charge') {
    return <ServiceChargeContent showHeader={true} onBack={() => navigate('/settings/payments')} onAIClick={() => setShowAIChat(true)} />;
  }
  if (pathname === '/settings/payments/cash-management') {
    return <CashManagementContent showHeader={true} onBack={() => navigate('/settings/payments')} onAIClick={() => setShowAIChat(true)} />;
  }
  if (pathname === '/settings/payments/cash-management/details') {
    return <CashDrawerDetailsContent showHeader={true} onBack={() => navigate('/settings/payments')} />;
  }
  if (pathname === '/settings/payments/cash-management/pay-in-out') {
    return <PayInOutContent showHeader={true} onBack={() => navigate('/settings/payments/cash-management/details')} />;
  }
  if (pathname === '/settings/payments/checkout-options') {
    return <CheckoutOptionsContent showHeader={true} onBack={() => navigate('/settings/payments')} onAIClick={() => setShowAIChat(true)} />;
  }
  if (pathname === '/settings/menu') {
    return <MenuSettingsContent showHeader={false} onBack={() => navigate('/settings')} onNavigate={navigate} onAIClick={() => setShowAIChat(true)} />;
  }
  if (pathname === '/settings/menu/menus/add') {
    return <AddMenuContent showHeader={true} onBack={() => navigate('/settings/menu/menu')} onNavigate={navigate} onAIClick={() => setShowAIChat(true)} />;
  }
  if (pathname.startsWith('/settings/menu/menus/') && pathname.endsWith('/edit')) {
    const menuId = pathname.split('/')[4];
    return <EditMenuContent menuId={menuId} showHeader={true} onBack={() => navigate('/settings/menu/menu')} onNavigate={navigate} onAIClick={() => setShowAIChat(true)} />;
  }
  if (pathname === '/settings/menu/menu') {
    return <MenuItemsContent showHeader={true} onBack={() => navigate('/settings/menu')} onAIClick={() => setShowAIChat(true)} />;
  }
  if (pathname === '/settings/menu/categories') {
    return <CategoriesContent showHeader={true} onBack={() => navigate('/settings/menu')} onAIClick={() => setShowAIChat(true)} />;
  }
  if (pathname === '/settings/menu/modifiers') {
    return <ModifiersContent showHeader={true} onBack={() => navigate('/settings/menu')} onAIClick={() => setShowAIChat(true)} />;
  }
  if (pathname === '/settings/menu/add-ons') {
    return <AddOnsContent showHeader={true} onBack={() => navigate('/settings/menu')} onAIClick={() => setShowAIChat(true)} />;
  }
  if (pathname === '/settings/menu/add-ons/add') {
    return <AddAddOnContent onBack={() => navigate('/settings/menu/add-ons')} onSave={() => {}} />;
  }
  if (pathname === '/settings/menu/products') {
    return <ProductsContent showHeader={true} onBack={() => navigate('/settings/menu')} onAIClick={() => setShowAIChat(true)} onAdd={() => navigate('/settings/menu/products/add')} />;
  }
  if (pathname === '/settings/menu/products/add') {
    return <AddProductContent onBack={() => navigate('/settings/menu/products')} />;
  }
  if (pathname === '/settings/menu/default-modifiers') {
    return <DefaultModifiersContent showHeader={true} onBack={() => navigate('/settings/menu')} onAIClick={() => setShowAIChat(true)} />;
  }
  if (pathname === '/settings/menu/default-modifiers/add') {
    return <AddDefaultModifierContent showHeader={true} onBack={() => navigate('/settings/menu/default-modifiers')} />;
  }
  if (pathname.startsWith('/settings/menu/default-modifiers/edit/')) {
    const modifierId = pathname.split('/').pop() || undefined;
    return (
      <EditDefaultModifierContent
        showHeader={true}
        onBack={() => navigate('/settings/menu/default-modifiers')}
        modifierId={modifierId}
      />
    );
  }
  if (pathname === '/settings/menu/groups') {
    return <GroupsContent showHeader={true} onBack={() => navigate('/settings/menu')} onAIClick={() => setShowAIChat(true)} />;
  }
  if (pathname === '/settings/menu/groups/add') {
    return <AddGroupContent showHeader={true} onBack={() => navigate('/settings/menu/groups')} />;
  }
  if (pathname.startsWith('/settings/menu/groups/edit/')) {
    const groupId = pathname.split('/').pop() || undefined;
    return (
      <EditGroupContent
        showHeader={true}
        onBack={() => navigate('/settings/menu/groups')}
        groupId={groupId}
      />
    );
  }
  if (pathname === '/settings/support') {
    return <SupportContent showHeader={false} onNavigate={navigate} onAIClick={() => setShowAIChat(true)} />;
  }
  if (pathname === '/settings/support/feedback') {
    return <FeedbackContent showHeader={true} onBack={() => navigate('/settings/support')} onAIClick={() => setShowAIChat(true)} />;
  }
  if (pathname === '/settings/support/contact') {
    return <SupportContactContent showHeader={true} onBack={() => navigate('/settings/support')} onAIClick={() => setShowAIChat(true)} />;
  }
  if (pathname === '/settings/support/about') {
    return <AboutContent showHeader={true} onBack={() => navigate('/settings/support')} onAIClick={() => setShowAIChat(true)} />;
  }
  if (pathname === '/settings/support/about/privacy-policy') {
    return <PrivacyPolicyContent showHeader={true} onBack={() => navigate('/settings/support/about')} onAIClick={() => setShowAIChat(true)} />;
  }
  if (pathname === '/settings/support/about/legal-terms') {
    return <LegalTermsContent showHeader={true} onBack={() => navigate('/settings/support/about')} onAIClick={() => setShowAIChat(true)} />;
  }
  if (pathname === '/settings/support/about/report-fraud') {
    return <ReportFraudContent showHeader={true} onBack={() => navigate('/settings/support/about')} onAIClick={() => setShowAIChat(true)} />;
  }
  if (pathname === '/settings/network') {
    return <NetworkContent showHeader={false} onNavigate={navigate} onAIClick={() => setShowAIChat(true)} />;
  }
  if (pathname === '/settings/network/servers') {
    return <ServerConnectionContent showHeader={true} onBack={() => navigate('/settings/network')} onAIClick={() => setShowAIChat(true)} />;
  }
  if (pathname === '/settings/hardware') {
    return <HardwareContent showHeader={false} onNavigate={navigate} onAIClick={() => setShowAIChat(true)} />;
  }
  if (pathname === '/settings/hardware/details') {
    return <HardwareDetailsContent showHeader={true} onBack={() => navigate('/settings/hardware')} onNavigate={navigate} onAIClick={() => setShowAIChat(true)} />;
  }
  if (pathname === '/settings/hardware/details/printer') {
    return <PrinterContent showHeader={true} onBack={() => navigate('/settings/hardware/details')} onNavigate={navigate} />;
  }
  if (pathname === '/settings/hardware/details/printer/advanced') {
    return <PrinterAdvancedContent showHeader={true} onBack={() => navigate('/settings/hardware/details/printer')} />;
  }
  if (pathname === '/settings/hardware/details/printer/pair') {
    return <PairPrinterContent showHeader={true} onBack={() => navigate('/settings/hardware/details/printer')} />;
  }
  if (pathname === '/settings/hardware/details/card-reader') {
    return <CardReaderContent showHeader={true} onBack={() => navigate('/settings/hardware/details')} />;
  }
  if (pathname === '/settings/hardware/details/cash-register') {
    return <CashRegisterContent showHeader={true} onBack={() => navigate('/settings/hardware/details')} />;
  }
  if (pathname === '/settings/notifications') {
    return <NotificationsContent showHeader={false} onNavigate={navigate} onAIClick={() => setShowAIChat(true)} />;
  }
  if (pathname === '/settings/notifications/all') {
    return <NotificationsListContent showHeader={false} onBack={() => navigate('/settings/notifications')} onAIClick={() => setShowAIChat(true)} />;
  }
  if (pathname.startsWith('/settings/notifications/detail/')) {
    const id = pathname.split('/').pop();
    return <NotificationDetailContent showHeader={false} onBack={() => navigate('/settings/notifications/all')} onAIClick={() => setShowAIChat(true)} notificationId={id} />;
  }
  if (pathname === '/settings/reports') {
    return <ReportsContent showHeader={false} onBack={() => navigate('/settings')} onAIClick={() => setShowAIChat(true)} />;
  }
  if (pathname === '/settings/end-of-day') {
    return <EndOfDayContent showHeader={false} onBack={() => navigate('/settings')} onAIClick={() => setShowAIChat(true)} />;
  }
  if (pathname === '/settings/guest-book') {
    return <GuestBookContent showHeader={false} onBack={() => navigate('/settings/account')} onAIClick={() => setShowAIChat(true)} />;
  }
  if (pathname === '/settings/workforce') {
    return <WorkforceContent showHeader={false} onNavigate={navigate} onAIClick={() => setShowAIChat(true)} />;
  }
  if (pathname === '/settings/workforce/employee') {
    return <EmployeeContent showHeader={true} onBack={() => navigate('/settings/workforce')} onAIClick={() => setShowAIChat(true)} />;
  }
  if (pathname === '/settings/workforce/employee/add') {
    return <AddEmployeeContent showHeader={true} onBack={() => navigate('/settings/workforce/employee')} />;
  }
  if (pathname === '/settings/workforce/shift') {
    return <ShiftContent showHeader={true} onBack={() => navigate('/settings/workforce')} onAIClick={() => setShowAIChat(true)} />;
  }
  if (pathname === '/settings/workforce/shift/add') {
    return <AddShiftContent showHeader={true} onBack={() => navigate('/settings/workforce/shift')} />;
  }
  if (pathname === '/settings/workforce/shift/edit') {
    return <EditShiftContent showHeader={true} onBack={() => navigate('/settings/workforce/shift')} />;
  }
  // Default to Account panel
  return <AccountPanel showHeader={true} />;
};

const Settings = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [showAIChat, setShowAIChat] = useState(false);

  const handleUserProfileClick = () => {
    setShowAIChat(false); // Close AI chat when navigating
    if (isMobile) {
      navigate('/account');
    } else {
      navigate('/settings/account');
    }
  };

  const handleSettingsItemClick = (itemId: string) => {
    setShowAIChat(false); // Close AI chat when navigating
    if (itemId === "system") {
      navigate('/settings/system');
    }
    if (itemId === "payments") {
      navigate('/settings/payments');
    }
    if (itemId === "menu") {
      navigate('/settings/menu');
    }
    if (itemId === "support") {
      navigate('/settings/support');
    }
    if (itemId === "network") {
      navigate('/settings/network');
    }
    if (itemId === "hardware") {
      navigate('/settings/hardware');
    }
    if (itemId === "end-of-day") {
      navigate('/settings/end-of-day');
    }
    if (itemId === "guest-book") {
      navigate('/settings/guest-book');
    }
    if (itemId === "reports-analytics") {
      navigate('/settings/reports');
    }
    if (itemId === "notifications") {
      navigate('/settings/notifications');
    }
    if (itemId === "workforce") {
      navigate('/settings/workforce');
    }
  };

  const handleAIClick = () => {
    if (isMobile) {
      navigate('/settings/ai-assistant');
    } else {
      setShowAIChat(true);
    }
  };

  const isGuestBook = location.pathname === '/settings/guest-book';
  const isNotifications = location.pathname.startsWith('/settings/notifications/all') || location.pathname.startsWith('/settings/notifications/detail/');

  // Full-screen mode: hide sidebar for Guest Book and Notifications
  if (!isMobile && (isGuestBook || isNotifications)) {
    return (
      <div className="h-full flex gap-0 md:gap-[2px] p-0 md:p-[10px] overflow-hidden">
        <div className="flex flex-1 h-full overflow-hidden">
          <div className="w-full h-full overflow-y-auto scrollbar-hide">
            {getContentForRoute(location.pathname, navigate, location.state, showAIChat, setShowAIChat)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex gap-0 md:gap-[2px] p-0 md:p-[10px] overflow-hidden">

      {/* Left Panel - Settings Navigation with independent scroll */}
      <div className="w-full md:w-[260px] lg:w-[300px] md:flex-shrink-0 md:bg-[#ededed99] md:dark:bg-[#26262699] md:rounded-2xl h-full overflow-hidden">
        <SettingsNavigation 
          onUserProfileClick={handleUserProfileClick}
          onSettingsItemClick={handleSettingsItemClick}
          onAIClick={handleAIClick}
        />
      </div>

      {/* Right Panel - Content area with independent scroll (Tablet/Desktop only) */}
      {!isMobile && (
        <div className="flex flex-1 h-full overflow-hidden">
          <div className="w-full h-full overflow-y-auto scrollbar-hide">
            {getContentForRoute(location.pathname, navigate, location.state, showAIChat, setShowAIChat)}
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
