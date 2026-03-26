import { useState, useRef, useEffect, useLayoutEffect, useMemo, useCallback } from "react";
import { useWriteOffProcessor } from "@/hooks/useWriteOffProcessor";
import { searchCustomers, Customer } from "@/services/customerService";
import { SettingsManager } from "@/lib/settingsManager";
import { useSupabaseMenus } from "@/hooks/useSupabaseMenus";
import { getDynamicCategorySubcategories, getCategoryProducts } from "@/lib/productStore";
import { supabase } from "@/integrations/supabase/client";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Plus, Receipt, ArrowRightLeft, X, FileText, ChevronDown, MoreVertical, Gift, DollarSign, UserPlus, FolderOpen, AlertCircle, SplitSquareVertical, RotateCcw, Delete, Briefcase, Heart, GraduationCap, Shield, Star, Clock, Cake, MapPin, BadgeDollarSign, Tag, Users, Share2, Fingerprint, ScanFace, CreditCard, User, Link, QrCode, Banknote, Printer, MessageSquare, Mail, CheckCircle, Truck, ShoppingBag, Clipboard, ExternalLink, Utensils, UtensilsCrossed, ArrowLeft, Phone, AlertTriangle, RefreshCw, Send, Zap, Search, Check, Ticket } from "lucide-react";
import PaymentDialog from "@/components/PaymentDialog";
import GuestPastOrderPopup from "@/components/GuestPastOrderPopup";
import type { PastOrderItem as GuestPastItem, GuestInfo as GuestPastInfo } from "@/components/GuestPastOrderPopup";
import { getOrderById, Order as DataOrder, OrderItem as DataOrderItem, formatPrice as formatOrderPrice } from "@/data/orders";
import { getActiveTaxRate } from "@/lib/orderUtils";
import { useSessionOrders } from "@/contexts/SessionOrderContext";
import { useTicketOrders } from "@/hooks/use-ticket-orders";
import { toast } from "sonner";
import searchIcon from "@/assets/icons/search.png";
import ItemCustomizationDialog from "@/components/ItemCustomizationDialog";
import GiftCardDialog from "@/components/GiftCardDialog";
import ServiceChargeDialog from "@/components/ServiceChargeDialog";
import { TransferCheckDialog } from "@/components/TransferCheckDialog";
import InlineItemCustomization from "@/components/InlineItemCustomization";
import OrderNotesAutocomplete from "@/components/OrderNotesAutocomplete";
import clearIcon from "@/assets/icons/clear.png";
import clearCIcon from "@/assets/icons/clear-c.png";
import saveIcon from "@/assets/icons/save.png";
import fireIcon from "@/assets/icons/fire.png";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import burgerCloseIcon from "@/assets/icons/burger-close.png";
import burgerOpenIcon from "@/assets/icons/burger-open.png";
import gridViewIcon from "@/assets/icons/grid-view.png";
import scrollViewIcon from "@/assets/icons/scroll-view.png";
import listViewIcon from "@/assets/icons/list-view.png";
import thumbnailViewIcon from "@/assets/icons/thumbnail-view.png";
import emptyOrderIcon from "@/assets/icons/empty-order.png";
import horizontalScrollIcon from "@/assets/icons/horizontal-scroll.png";
import verticalScrollIcon from "@/assets/icons/vertical-scroll.png";
import SwipeableCartItem from "@/components/SwipeableCartItem";
import tickSuccessIcon from "@/assets/icons/tick-success.svg";
import grabberIcon from "@/assets/icons/grabber.png";
import phoneIcon from "@/assets/icons/phone-icon.png";
import timeIcon from "@/assets/icons/time-icon.png";
import runnerIcon from "@/assets/icons/runner.png";
import discountIcon from "@/assets/icons/discount.png";
import noTaxIcon from "@/assets/icons/no-tax.png";
import cashRegisterIcon from "@/assets/icons/cash-register.png";
import customItemIcon from "@/assets/icons/custom-item.svg";
import discountBtnIcon from "@/assets/icons/discount-icon.svg";
import noTaxBtnIcon from "@/assets/icons/no-tax.svg";
import registerBtnIcon from "@/assets/icons/register.svg";
import giftCardIcon from "@/assets/icons/gift-card.png";
import itemNotesIcon from "@/assets/icons/item-notes.png";
import expandPanelIcon from "@/assets/icons/expand-panel.png";
import collapsePanelIcon from "@/assets/icons/collapse-panel.png";
import giftCardBtnIcon from "@/assets/icons/gift-card-btn.svg";
import serviceChargeIcon from "@/assets/icons/service-charge.svg";
import addGuestIcon from "@/assets/icons/add-guest.svg";
import openOrdersIcon from "@/assets/icons/open-orders.svg";
import allergyIcon from "@/assets/icons/allergy.svg";
import AnimatedAIIcon from "@/components/AnimatedAIIcon";
import splitCheckIcon from "@/assets/icons/split-check.svg";
import reopenCheckIcon from "@/assets/icons/reopen-check.svg";
import messageKdsIcon from "@/assets/icons/message-kds.svg";
import transferCheckIcon from "@/assets/icons/transfer-check.svg";
import transferIconPng from "@/assets/icons/transfer-icon.png";
import newOrderIcon from "@/assets/icons/new-order.png";
import dineInIcon from "@/assets/icons/dine-in-icon.svg";
import takeOutIcon from "@/assets/icons/take-out.svg";
import deliveryIcon from "@/assets/icons/delivery.svg";
import banquetIcon from "@/assets/icons/banquet.svg";
import driveThruIcon from "@/assets/icons/drive-thru.svg";
import curbSideIcon from "@/assets/icons/curb-side.svg";
import scheduledIcon from "@/assets/icons/scheduled.svg";
import phoneInIcon from "@/assets/icons/phone-in.svg";
import customOrderIcon from "@/assets/icons/custom-order.svg";
import menuIcon from "@/assets/icons/menu-icon.svg";
import tableOrderIcon from "@/assets/icons/table-order.png";
import mergeIcon from "@/assets/icons/link-merge.png";
import chairWhiteIcon from "@/assets/icons/chair-white.png";
import ticketsIcon from "@/assets/icons/tickets.png";
import settingsIcon from "@/assets/icons/settings.png";
import { usePanelPosition } from "@/contexts/PanelPositionContext";
import { PanelDropZones } from "@/components/PanelDropZone";
import { DraggablePanelHandle } from "@/components/DraggablePanelHandle";
import AddGuestForm from "@/components/AddGuestForm";
import DineInGuestForm from "@/components/DineInGuestForm";
import TakeOutGuestForm from "@/components/TakeOutGuestForm";
import DeliveryGuestForm from "@/components/DeliveryGuestForm";
import BanquetGuestForm from "@/components/BanquetGuestForm";
import DriveThruGuestForm from "@/components/DriveThruGuestForm";
import CurbSideGuestForm from "@/components/CurbSideGuestForm";
import ScheduledGuestForm from "@/components/ScheduledGuestForm";
import PhoneInGuestForm from "@/components/PhoneInGuestForm";
import CustomOrderGuestForm from "@/components/CustomOrderGuestForm";
import { useOrderTypeGuests } from "@/hooks/useOrderTypeGuests";
import { useMenuNavigation } from "@/hooks/useMenuNavigation";
import MPINDialog from "@/components/MPINDialog";
import PriceOverrideDialog from "@/components/PriceOverrideDialog";
import VoucherDialog from "@/components/VoucherDialog";
import SellVoucherScreen from "@/components/SellVoucherScreen";
import CreateVoucherForm from "@/components/CreateVoucherForm";
import OpenPriceDialog from "@/components/OpenPriceDialog";
import { DiscountDialog, type Discount } from "@/components/DiscountDialog";
import AccessRestrictedModal from "@/components/AccessRestrictedModal";
import MessageKitchenDialog from "@/components/MessageKitchenDialog";
import { useVoucherMode } from "@/contexts/VoucherModeContext";
import OrderAIChatPanel from "@/components/OrderAIChatPanel";


import {
  foodImages, categorySubcategories, menuItemsData,
  MenuItem, SubcategoryItems, CategoryItems, MenuItemsStructure,
  getMenuItems, getAllCategoryItems, getAllMenuItems,
  getCategoryBorderColor, getCategoryBgColor, getCategoryHoverBgColor,
  getCategoryTextColor, getCategoryHoverTextColor
} from "@/data/orderMenuData";

// menuList and menuCategories are now fetched from the database via useSupabaseMenus hook
interface OrderItem {
  id: number;
  qty: number;
  name: string;
  price: number;
  modifiers?: string[];
  notes?: string;
  itemOrderType?: string;
  priceOverrideReason?: string;
  priceOverrideNotes?: string;
  assignedSeats?: number[];
  discountName?: string;
  discountAmount?: number;
  noTax?: boolean;
  isFired?: boolean;
  isTransferred?: boolean;
  isOpenPrice?: boolean;
}
const initialOrderItems: OrderItem[] = [];
const orderTypes = [
{ label: "DINE IN", icon: dineInIcon },
{ label: "TAKE OUT", icon: takeOutIcon },
{ label: "DELIVERY", icon: deliveryIcon },
{ label: "BANQUET", icon: banquetIcon },
{ label: "DRIVE THRU", icon: driveThruIcon },
{ label: "CURB SIDE", icon: curbSideIcon },
{ label: "SCHEDULED", icon: scheduledIcon },
{ label: "PHONE-IN", icon: phoneInIcon },
{ label: "CUSTOM", icon: customOrderIcon }];


// Payment methods constants
const initialPaymentMethods = [
{ id: 'loyalty', name: 'Loyalty', icon: Tag },
{ id: 'account', name: 'Account', icon: User },
{ id: 'card', name: 'Card', icon: CreditCard },
{ id: 'cash', name: 'Cash', icon: Banknote },
{ id: 'gift-card', name: 'Gift Card', icon: Gift },
{ id: 'pay-link', name: 'Pay by Link', icon: Link }];


const initialOtherPaymentMethods = [
{ id: 'qr-code', name: 'QR Code', icon: QrCode },
{ id: 'manual-cc', name: 'Manual CC', icon: CreditCard },
{ id: 'external-cc', name: 'External CC', icon: ExternalLink },
{ id: 'manual-card', name: 'Manual card', icon: Clipboard },
{ id: 'blizzful', name: 'Blizzful', icon: Utensils },
{ id: 'ubereats', name: 'UberEats', icon: ShoppingBag },
{ id: 'doordash', name: 'DoorDash', icon: Truck },
{ id: 'grubhub', name: 'Grubhub', icon: UtensilsCrossed }];

type PaymentMethodType = {
  id: string;
  name: string;
  icon: React.ComponentType<{className?: string;}>;
};

const quickAmounts = [1, 2, 5, 10, 20, 50, 100];

interface GuestUser {
  id: number;
  name: string;
  phone: string;
  avatar?: string;
  initials: string;
}

const normalizeProductKey = (value: string): string => value
  .toLowerCase()
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/&/g, " and ")
  .replace(/[^a-z0-9]+/g, " ")
  .trim();

// Format phone number based on country code
// USA-centric phone format: (XXX) XXX-XXXX
const formatPhoneNumber = (digits: string): string => {
  if (!digits) return '';

  // Limit to 10 digits for USA format
  const d = digits.slice(0, 10);

  if (d.length <= 3) {
    return `(${d}`;
  }
  if (d.length <= 6) {
    return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  }
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6, 10)}`;
};
const mockGuestUsers: GuestUser[] = [{
  id: 1,
  name: "John Doe",
  phone: "+1 (212) 456-7890",
  // USA
  avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face",
  initials: "JD"
}, {
  id: 2,
  name: "Nancy John",
  phone: "+1 (415) 555-7890",
  // USA
  avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=40&h=40&fit=crop&crop=face",
  initials: "NJ"
}, {
  id: 3,
  name: "Jonathan Byers",
  phone: "+44 20 7946 0958",
  // UK
  initials: "JB"
}, {
  id: 4,
  name: "Jane Smith",
  phone: "+971 50 123 4567",
  // UAE
  avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=face",
  initials: "JS"
}, {
  id: 5,
  name: "Michael Brown",
  phone: "+1 (310) 987-6543",
  // USA
  initials: "MB"
}, {
  id: 6,
  name: "Sarah Johnson",
  phone: "+44 7911 123456",
  // UK Mobile
  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=40&h=40&fit=crop&crop=face",
  initials: "SJ"
}, {
  id: 7,
  name: "David Wilson",
  phone: "+971 4 369 2580",
  // UAE Dubai
  initials: "DW"
}, {
  id: 8,
  name: "Emily Davis",
  phone: "+44 121 147 2583",
  // UK Birmingham
  avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=40&h=40&fit=crop&crop=face",
  initials: "ED"
}];

const Orders = () => {
  // Read URL params for add-item mode
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { panelLayout } = usePanelPosition();
  const { getOrderBySessionId, updateOrderItems, fireOrder: fireSessionOrder, updateOrderStatus, saveSplitConfiguration: saveContextSplitConfig } = useSessionOrders();
  const { addOrder: addTicketOrder, updateOrder: updateTicketOrder } = useTicketOrders();
  const { processCancelledItems } = useWriteOffProcessor();
  const [quickOrderDbId, setQuickOrderDbId] = useState<string | null>(null);
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);

  // Dynamic arrived-at time based on when the order screen was opened
  const [arrivedAt] = useState(() => {
    const now = new Date();
    return now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  });

  // Fetch menus from database - only enabled & non-archived menus appear
  const { menuList, menuCategories } = useSupabaseMenus();

  // Fetch products from the database so newly added products show on the Orders screen
  const [dbProducts, setDbProducts] = useState<Array<{ id: string; name: string; price: number; category_name: string; price_type: string; active: boolean; archived: boolean; stock_count: number | null; is_available: boolean }>>([]);
  const dbProductsByNormalizedName = useMemo(
    () => new Map(dbProducts.map((product) => [normalizeProductKey(product.name), product])),
    [dbProducts]
  );
  
  const fetchDbProducts = useCallback(async () => {
    const { data } = await (supabase as any)
      .from('products')
      .select('id, name, price, price_type, active, archived, stock_count, is_available, categories(name)')
      .eq('active', true)
      .eq('archived', false);
    if (data) {
      setDbProducts(data.map((p: any) => ({
        id: p.id,
        name: p.name,
        price: Number(p.price),
        category_name: p.categories?.name ?? '',
        price_type: p.price_type,
        active: p.active,
        archived: p.archived,
        stock_count: p.stock_count,
        is_available: p.is_available ?? true,
      })));
    }
  }, []);

  useEffect(() => {
    fetchDbProducts();
    // Listen for products-updated events (fired after add/edit in Settings)
    window.addEventListener("products-updated", fetchDbProducts);
    return () => window.removeEventListener("products-updated", fetchDbProducts);
  }, [fetchDbProducts]);

  // Helper: adjust stock_count in the DB for a list of items
  const adjustStock = useCallback(async (items: Array<{ name: string; qty: number }>, direction: 'deduct' | 'restore') => {
    if (items.length === 0) return;
    const names = [...new Set(items.map(i => i.name))];
    const { data: products } = await (supabase as any)
      .from('products')
      .select('id, name, stock_count, inventory_tracking')
      .in('name', names);
    if (!products) return;
    const productMap = new Map<string, any>();
    (products as any[]).forEach((p: any) => productMap.set(p.name, p));
    for (const item of items) {
      const product = productMap.get(item.name);
      if (!product || !product.inventory_tracking || product.stock_count === null) continue;
      const current = product.stock_count ?? 0;
      const newCount = direction === 'deduct'
        ? Math.max(0, current - item.qty)
        : current + item.qty;
      await (supabase as any)
        .from('products')
        .update({ stock_count: newCount, is_available: newCount > 0 })
        .eq('id', product.id);
    }
    fetchDbProducts();
    window.dispatchEvent(new CustomEvent('products-updated'));
  }, [fetchDbProducts]);

  // Merge dynamic subcategories from category settings with hardcoded fallback
  const dynamicSubcategories = useMemo(() => getDynamicCategorySubcategories(), []);
  const mergedCategorySubcategories = useMemo(() => {
    // Dynamic takes priority, fall back to hardcoded
    return { ...categorySubcategories, ...dynamicSubcategories };
  }, [dynamicSubcategories]);

  // Augment menuCategories with localStorage-only parent categories + DB product categories
  const augmentedMenuCategories = useMemo(() => {
    const result: Record<string, string[]> = { ...menuCategories };
    // For each menu, check if any dynamic parent categories should be included
    for (const menuName of menuList) {
      const dbCats = result[menuName] || [];
      for (const [parentName, children] of Object.entries(dynamicSubcategories)) {
        if (dbCats.includes(parentName) && !result[menuName]?.includes(parentName)) {
          result[menuName] = [...(result[menuName] || []), parentName];
        }
      }
      // Note: Only show categories explicitly assigned to this menu via menu_categories
    }
    return result;
  }, [menuCategories, menuList, dynamicSubcategories, dbProducts]);

  // Build dynamic menu items from category-assigned products + DB products
  const dynamicMenuItems = useMemo(() => {
    const result: MenuItemsStructure = {};
    // For each menu, build category → subcategory → products
    for (const menuName of menuList) {
      const cats = augmentedMenuCategories[menuName] || [];
      const catItems: CategoryItems = {};
      for (const cat of cats) {
        const subs = dynamicSubcategories[cat] || categorySubcategories[cat] || [];
        const subItems: SubcategoryItems = {};
        const dbCatProducts = dbProducts.filter(
          (p) => p.category_name.toLowerCase() === cat.toLowerCase()
        );
        const dbProductsByName = new Map(
          dbCatProducts.map((product) => [normalizeProductKey(product.name), product])
        );

        for (const sub of subs) {
          // Get products assigned to this subcategory
          const productNames = getCategoryProducts(sub);
          if (productNames.length > 0) {
            subItems[sub] = productNames.map((name, idx) => {
              const normalizedName = normalizeProductKey(name);
              const matchedDbProduct = dbProductsByName.get(normalizedName) ?? dbProductsByNormalizedName.get(normalizedName);
              return {
                id: idx + 10000,
                name,
                price: matchedDbProduct ? matchedDbProduct.price : 0,
                isOpenPrice: matchedDbProduct ? matchedDbProduct.price_type === 'open' : true,
                stock_count: matchedDbProduct?.stock_count ?? null,
                is_available: matchedDbProduct?.is_available ?? true,
              };
            });
          }
        }

        // Also get products directly assigned to the parent category
        const parentProducts = getCategoryProducts(cat);
        if (parentProducts.length > 0 && Object.keys(subItems).length === 0) {
          subItems[cat] = parentProducts.map((name, idx) => {
            const normalizedName = normalizeProductKey(name);
            const matchedDbProduct = dbProductsByName.get(normalizedName) ?? dbProductsByNormalizedName.get(normalizedName);
            return {
              id: idx + 20000,
              name,
              price: matchedDbProduct ? matchedDbProduct.price : 0,
              isOpenPrice: matchedDbProduct ? matchedDbProduct.price_type === 'open' : true,
              stock_count: matchedDbProduct?.stock_count ?? null,
              is_available: matchedDbProduct?.is_available ?? true,
            };
          });
        }

        // Merge DB products that belong to this category
        if (dbCatProducts.length > 0) {
          const existingNames = new Set<string>();
          // Collect names already in subItems
          for (const items of Object.values(subItems)) {
            for (const item of items) existingNames.add(normalizeProductKey(item.name));
          }

          const newDbItems = dbCatProducts
            .filter((p) => !existingNames.has(normalizeProductKey(p.name)))
            .map((p, idx) => ({
              id: idx + 30000 + Math.round(Math.random() * 10000),
              name: p.name,
              price: p.price,
              isOpenPrice: p.price_type === 'open',
              stock_count: p.stock_count,
              is_available: p.is_available,
            }));

          if (newDbItems.length > 0) {
            // Add to the category directly if no subcategories
            const targetKey = Object.keys(subItems).length > 0 ? Object.keys(subItems)[0] : cat;
            subItems[targetKey] = [...(subItems[targetKey] || []), ...newDbItems];
          }
        }

        if (Object.keys(subItems).length > 0) {
          catItems[cat] = subItems;
        }
      }

      // Also add DB products whose category is NOT already in the menu's category list
      // This ensures newly created products with new categories still appear
      const menuCatsLower = new Set(cats.map((c) => c.toLowerCase()));
      const unmatchedCategories = new Map<string, typeof dbProducts>();
      for (const p of dbProducts) {
        if (p.category_name && !menuCatsLower.has(p.category_name.toLowerCase())) {
          if (!unmatchedCategories.has(p.category_name)) {
            unmatchedCategories.set(p.category_name, []);
          }
          unmatchedCategories.get(p.category_name)!.push(p);
        }
      }
      for (const [catName, products] of unmatchedCategories) {
        const subItems: SubcategoryItems = {};
        subItems[catName] = products.map((p, idx) => ({
          id: idx + 40000 + Math.round(Math.random() * 10000),
          name: p.name,
          price: p.price,
          isOpenPrice: p.price_type === 'open',
          stock_count: p.stock_count,
          is_available: p.is_available,
        }));
        catItems[catName] = subItems;
      }

      if (Object.keys(catItems).length > 0) {
        result[menuName] = { ...(result[menuName] || {}), ...catItems };
      }
    }
    return result;
  }, [menuList, augmentedMenuCategories, dynamicSubcategories, dbProducts, dbProductsByNormalizedName]);

  const addItemMode = searchParams.get('mode') === 'addItem';
  const transferNewMode = searchParams.get('mode') === 'transferNew';
  const transferItemsParam = searchParams.get('transferItems');
  const existingOrderId = searchParams.get('orderId');
  const tableIdFromParams = searchParams.get('tableId');
  const sessionIdFromParams = searchParams.get('sessionId');
  const partySizeFromParams = searchParams.get('partySize');
  const seatsFromParams = searchParams.get('seats');
  const guestsFromParams = searchParams.get('guests');

  // Session order mode - coming from TableOrder seat selection
  const isSessionOrderMode = !!sessionIdFromParams && !!tableIdFromParams;
  const sessionOrder = isSessionOrderMode ? getOrderBySessionId(sessionIdFromParams) : null;
  const sessionPartySize = partySizeFromParams ? parseInt(partySizeFromParams) : sessionOrder?.partySize || 0;

  // Table order: require tableId and either (seats + guests) or partySize (from TableOrder seat selection)
  const isTableOrder = !!tableIdFromParams && ((!!seatsFromParams && !!guestsFromParams) || !!partySizeFromParams);
  const totalSeats = seatsFromParams ? parseInt(seatsFromParams) : sessionPartySize || 0;
  const guestCount = guestsFromParams ? parseInt(guestsFromParams) : sessionPartySize || 0;

  // Get existing order data if in add-item mode
  const existingOrder = addItemMode && existingOrderId ? getOrderById(existingOrderId) : null;
  const existingOrderPaymentStatus = existingOrder?.paymentStatus || existingOrder?.status;
  const isExistingOrderPaid = existingOrderPaymentStatus === 'Paid' || existingOrderPaymentStatus === 'PAID';

  // Menu navigation hook - manages active category, subcategory, menu selection, and position
  const {
    activeCategory, setActiveCategory,
    activeSubcategory, setActiveSubcategory,
    selectedMenu, setSelectedMenu,
    isMenuSelectOpen, setIsMenuSelectOpen,
    menuPosition, setMenuPosition,
    handleMenuSelect,
    handleCategoryChange,
    getFirstCategoryAndSubcategory,
  } = useMenuNavigation({
    menuList,
    augmentedMenuCategories,
    mergedCategorySubcategories,
  });
  const [orderItems, setOrderItems] = useState<OrderItem[]>(initialOrderItems);
  const [activeFoodCategory, setActiveFoodCategory] = useState("Appetizer");
  const [existingItems, setExistingItems] = useState<OrderItem[]>([]);
  const [horizontalScrollMode, setHorizontalScrollMode] = useState(false);
  const [thumbnailViewMode, setThumbnailViewMode] = useState(false);
  const checkoutOptionsSettings = useMemo(() => SettingsManager.getCheckoutOptionsSettings(), []);
  const requireOrderType = checkoutOptionsSettings.requireOrderType;
  const requireGuestName = checkoutOptionsSettings.requireGuestName;
  const showSaveButton = checkoutOptionsSettings.showSaveButton;
  const autoCloseTicket = checkoutOptionsSettings.autoCloseTicket;
  const [orderType, setOrderType] = useState(() => requireOrderType ? "" : "DINE IN");
  // Guest form state hook - manages all 9 order type guest forms
  const guestForms = useOrderTypeGuests();
  const {
    showDineInForm, setShowDineInForm, dineInGuestData, setDineInGuestData,
    showTakeOutForm, setShowTakeOutForm, takeOutGuestData, setTakeOutGuestData,
    showDeliveryForm, setShowDeliveryForm, deliveryGuestData, setDeliveryGuestData,
    showBanquetForm, setShowBanquetForm, banquetGuestData, setBanquetGuestData,
    showDriveThruForm, setShowDriveThruForm, driveThruGuestData, setDriveThruGuestData,
    showCurbSideForm, setShowCurbSideForm, curbSideGuestData, setCurbSideGuestData,
    showScheduledForm, setShowScheduledForm, scheduledGuestData, setScheduledGuestData,
    showPhoneInForm, setShowPhoneInForm, phoneInGuestData, setPhoneInGuestData,
    showCustomOrderForm, setShowCustomOrderForm, customOrderGuestData, setCustomOrderGuestData,
    openFormForType, clearAllGuestData,
  } = guestForms;
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [isOrderPanelExpanded, setIsOrderPanelExpanded] = useState(false);
  
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchStartTime, setTouchStartTime] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [showGuestDropdown, setShowGuestDropdown] = useState(false);
  const [showPhoneDropdown, setShowPhoneDropdown] = useState(false);
  const [filteredGuests, setFilteredGuests] = useState<GuestUser[]>([]);
  const [filteredByPhone, setFilteredByPhone] = useState<GuestUser[]>([]);
  const [isGuestSelected, setIsGuestSelected] = useState(false);
  const [showPastOrderPopup, setShowPastOrderPopup] = useState(false);
  const [pastOrderGuest, setPastOrderGuest] = useState<GuestPastInfo | null>(null);
  const [pastOrderItems, setPastOrderItems] = useState<GuestPastItem[]>([]);
  const [pastOrderLoading, setPastOrderLoading] = useState(false);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDesktopSearchOpen, setIsDesktopSearchOpen] = useState(false);
  const [customizationDialogOpen, setCustomizationDialogOpen] = useState(false);
  const [showCustomItemPanel, setShowCustomItemPanel] = useState(false);
  const [customItemName, setCustomItemName] = useState("");
  const [customItemPrice, setCustomItemPrice] = useState("");
  const [activeCustomItemField, setActiveCustomItemField] = useState<'name' | 'price'>('price');
  const [isShiftActive, setIsShiftActive] = useState(false);
  const [showNoTaxDialog, setShowNoTaxDialog] = useState(false);
  const [isTaxExempt, setIsTaxExempt] = useState(false);
  const [showDiscountDialog, setShowDiscountDialog] = useState(false);
  const [showDiscountMpin, setShowDiscountMpin] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [customCancelReason, setCustomCancelReason] = useState('');
  const [cancelWriteOffChoice, setCancelWriteOffChoice] = useState<'write_off' | 'without' | null>(null);
  const [showWriteOffPopup, setShowWriteOffPopup] = useState(false);
  const [writeOffPendingItemId, setWriteOffPendingItemId] = useState<number | null>(null);
  const [selectedDiscounts, setSelectedDiscounts] = useState<Discount[]>([]);
  const [isManager, setIsManager] = useState(false); // TODO: Connect to actual user role system
  const [selectedItemForCustomization, setSelectedItemForCustomization] = useState<{
    id: number;
    name: string;
    price: number;
    isOpenPrice?: boolean;
  } | null>(null);
  const [selectedItemImage, setSelectedItemImage] = useState<string | undefined>(undefined);
  const [showInlineCustomization, setShowInlineCustomization] = useState(false);
  const [isProductInfoFullScreen, setIsProductInfoFullScreen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const guestInputRef = useRef<HTMLInputElement>(null);
  const guestDropdownRef = useRef<HTMLDivElement>(null);
  const mobileGuestInputRef = useRef<HTMLInputElement>(null);
  const mobileGuestDropdownRef = useRef<HTMLDivElement>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const phoneDropdownRef = useRef<HTMLDivElement>(null);
  const mobilePhoneInputRef = useRef<HTMLInputElement>(null);
  const mobilePhoneDropdownRef = useRef<HTMLDivElement>(null);
  const menuPanelRef = useRef<HTMLDivElement>(null);
  const orderContentStartRef = useRef<HTMLDivElement>(null);
  const [aiOverlayTop, setAiOverlayTop] = useState(0);
  const [activeSwipedItemId, setActiveSwipedItemId] = useState<number | null>(null);
  const [expandedCartItems, setExpandedCartItems] = useState<Set<number>>(new Set());
  const [isOrderActionsSidebarOpen, setIsOrderActionsSidebarOpen] = useState(false);
  const [showGiftCardDialog, setShowGiftCardDialog] = useState(false);
  const [appliedGiftCardAmount, setAppliedGiftCardAmount] = useState(0);
  const [showServiceChargeDialog, setShowServiceChargeDialog] = useState(false);
  const [appliedServiceCharge, setAppliedServiceCharge] = useState(0);
  const [appliedServiceChargeName, setAppliedServiceChargeName] = useState('');
  const [showTransferCheckDialog, setShowTransferCheckDialog] = useState(false);
  const [currentServerName, setCurrentServerName] = useState(() => {
    try {
      const session = localStorage.getItem("pos_session");
      if (session) {
        const parsed = JSON.parse(session);
        return parsed.employeeName || "Server";
      }
    } catch {}
    return "Server";
  });
  const [showAddGuestForm, setShowAddGuestForm] = useState(false);
  const [showMessageKitchen, setShowMessageKitchen] = useState(false);
  const [showMPINDialog, setShowMPINDialog] = useState(false);
  const [showPriceOverrideDialog, setShowPriceOverrideDialog] = useState(false);
  const [showVoucherDialog, setShowVoucherDialog] = useState(false);
  const [voucherModeLocal, setVoucherModeLocal] = useState(false);
  const { isVoucherMode: voucherModeCtx, setIsVoucherMode: setVoucherModeCtx } = useVoucherMode();
  const voucherMode = voucherModeLocal;
  const setVoucherMode = (v: boolean) => { setVoucherModeLocal(v); setVoucherModeCtx(v); };

  // Sync context changes (e.g. from sidebar) back to local state
  useEffect(() => {
    if (!voucherModeCtx && voucherModeLocal) {
      setVoucherModeLocal(false);
    }
  }, [voucherModeCtx]);
  const [editingVoucherData, setEditingVoucherData] = useState<import('@/components/VoucherDialog').VoucherInitialData | null>(null);
  const [voucherDialogInitialView, setVoucherDialogInitialView] = useState<'sell' | 'redeem'>('sell');
  const [showOpenPriceDialog, setShowOpenPriceDialog] = useState(false);
  const [openPriceItem, setOpenPriceItem] = useState<MenuItem | null>(null);
  const [openPriceImageIndex, setOpenPriceImageIndex] = useState(0);
  const [openPriceFlow, setOpenPriceFlow] = useState<'quickAdd' | 'viewItem' | 'editCartItem'>('quickAdd');
  const [openPriceEditCartItemId, setOpenPriceEditCartItemId] = useState<number | null>(null);
  const [showVoucherOptionsPopup, setShowVoucherOptionsPopup] = useState(false);
  const [showCreateVoucherForm, setShowCreateVoucherForm] = useState(false);
  const [appliedVoucherAmount, setAppliedVoucherAmount] = useState(0);
  const [voucherCode, setVoucherCode] = useState('');
  const [priceOverrideItem, setPriceOverrideItem] = useState<{id: number;name: string;price: number;image?: string;} | null>(null);
  const [orderNumber, setOrderNumber] = useState(1);
  const [orderCreatedTime] = useState<string>(() => {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  });

  // Payment Dialog State (component manages its own internal states)
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

  // Split order state
  const [isOrderSplit, setIsOrderSplit] = useState(false);
  const [splitConfiguration, setSplitConfiguration] = useState<{
    mode: 'seat' | 'evenly' | 'custom';
    numberOfChecks: number;
    checkAssignments: Record<number, number>;
  } | null>(null);
  const [showSplitOrderAlert, setShowSplitOrderAlert] = useState(false);

  // Table order seat selection state - initialize with all seats selected when coming from table orders
  const [selectedSeats, setSelectedSeats] = useState<number[]>(() => {
    if (isTableOrder && guestCount > 0) {
      return Array.from({ length: guestCount }, (_, i) => i + 1);
    }
    return [];
  });

  // Seat filter for cart display - empty array means show all, 'all' for shared items, numbers for specific seats (multi-select)
  const [seatFilter, setSeatFilter] = useState<(number | 'all')[]>([]);
  const [clearCounter, setClearCounter] = useState(0);

  // Dynamic AI overlay top offset: align with order content area
  useLayoutEffect(() => {
    const recalc = () => {
      if (menuPanelRef.current && orderContentStartRef.current) {
        const menuRect = menuPanelRef.current.getBoundingClientRect();
        const orderContentRect = orderContentStartRef.current.getBoundingClientRect();
        const offset = Math.max(0, Math.round(orderContentRect.top - menuRect.top));
        setAiOverlayTop(offset);
      }
    };
    recalc();
    window.addEventListener('resize', recalc);
    const observer = new ResizeObserver(recalc);
    if (menuPanelRef.current) observer.observe(menuPanelRef.current);
    if (orderContentStartRef.current) observer.observe(orderContentStartRef.current);
    return () => {
      window.removeEventListener('resize', recalc);
      observer.disconnect();
    };
  }, [isAIChatOpen, isOrderActionsSidebarOpen, panelLayout]);


  const toggleSeatSelection = (seatNumber: number) => {
    setSelectedSeats((prev) => {
      if (prev.includes(seatNumber)) {
        return prev.filter((s) => s !== seatNumber);
      }
      return [...prev, seatNumber].sort((a, b) => a - b);
    });
  };

  // Toggle seat filter for cart display
  const toggleSeatFilter = (seatNumber: number | 'all') => {
    setSeatFilter((prev) => {
      if (prev.includes(seatNumber)) {
        return prev.filter((s) => s !== seatNumber);
      }
      return [...prev, seatNumber];
    });
  };

  // Filter order items based on seat filter (multi-select)
  const handleClearOrderAttempt = () => {
    setCancelReason('');
    setCustomCancelReason('');
    setCancelWriteOffChoice(null);
    setShowClearConfirm(true);
  };

  const handleClearOrder = (cancelReason?: string, writeOff: boolean = false) => {
    console.log('[handleClearOrder] clearing all order state, writeOff:', writeOff);
    
    // Process write-off or inventory restoration for cancelled items
    if (orderItems.length > 0) {
      processCancelledItems(
        orderItems.map(item => ({ name: item.name, price: item.price, quantity: 1, isFired: !!item.isFired })),
        undefined,
        cancelReason || 'Order cancelled',
        writeOff
      );
    }
    
    setOrderItems(() => []);
    setSelectedDiscounts([]);
    setAppliedServiceCharge(0);
    setAppliedServiceChargeName('');
    setAppliedGiftCardAmount(0);
    setAppliedVoucherAmount(0);
    setVoucherCode('');
    setOrderNotes('');
    setGuestName('');
    setGuestPhone('');
    setActiveSwipedItemId(null);
    setExpandedCartItems(new Set());
    setVoucherMode(false);
    setEditingVoucherData(null);
    // Clear all guest-specific form data and close all forms
    clearAllGuestData();
    // Reset panel state
    setIsOrderPanelExpanded(false);
    setSeatFilter([]);
    setClearCounter(prev => prev + 1);
  };

  const filteredOrderItems = seatFilter.length === 0 ?
  orderItems :
  orderItems.filter((item) => {
    // Check if item matches any of the selected filters
    return seatFilter.some((filter) => {
      if (filter === 'all') {
        return item.assignedSeats?.length === guestCount;
      }
      return item.assignedSeats?.includes(filter as number);
    });
  });

  // Initialize order with existing items when in add-item mode
  useEffect(() => {
    if (!addItemMode) return;

    // Try to read full ticket context from localStorage (set by Tickets module)
    const ticketContextRaw = localStorage.getItem('pos-add-product-context');
    
    if (ticketContextRaw) {
      try {
        const ticketContext = JSON.parse(ticketContextRaw);
        const guest = ticketContext.guest;
        
        // Pre-populate guest info from ticket data
        setGuestName(guest.name || '');
        setGuestPhone((guest.phone || '').replace(/\D/g, ''));
        setOrderNotes(guest.notes || '');

        // Convert order type
        const orderTypeMap: Record<string, string> = {
          'Dine-In': 'DINE IN',
          'Takeout': 'TAKE OUT',
          'Delivery': 'DELIVERY',
          'Bar': 'DINE IN',
          'DINE IN': 'DINE IN',
          'TAKE OUT': 'TAKE OUT',
          'DELIVERY': 'DELIVERY',
        };
        setOrderType(orderTypeMap[guest.orderType] || 'DINE IN');

        // Convert existing ticket items to local format
        const convertedItems: OrderItem[] = (guest.items || []).map((item: any, index: number) => ({
          id: Date.now() + index,
          qty: item.qty,
          name: item.name,
          price: item.price,
          modifiers: item.modifiers && item.modifiers.length > 0 ? item.modifiers : undefined,
          itemOrderType: orderTypeMap[guest.orderType] || 'Dine In'
        }));

        // Store existing items separately to track what's paid vs new
        setExistingItems(convertedItems);

        // If existing order is unpaid, show all items; if paid, start with empty cart for new items
        if (!isExistingOrderPaid) {
          setOrderItems(convertedItems);
        }

        // Restore discounts
        if (ticketContext.discounts && ticketContext.discounts.length > 0) {
          setSelectedDiscounts(ticketContext.discounts);
        }

        // Restore service charge
        if (ticketContext.serviceCharge && ticketContext.serviceCharge > 0) {
          setAppliedServiceCharge(ticketContext.serviceCharge);
          setAppliedServiceChargeName('Service Charge');
        }

        // Restore tax exemption
        if (ticketContext.taxExempt) {
          setIsTaxExempt(true);
        }
      } catch (e) {
        console.error('Failed to parse ticket context:', e);
      } finally {
        // Clean up localStorage after reading
        localStorage.removeItem('pos-add-product-context');
      }
    } else if (existingOrder) {
      // Fallback: use getOrderById lookup (legacy path)
      setGuestName(existingOrder.name);
      setGuestPhone(existingOrder.phone.replace(/\D/g, ''));
      setOrderNotes(existingOrder.notes);

      const orderTypeMap: Record<string, string> = {
        'Dine-In': 'DINE IN',
        'Takeout': 'TAKE OUT',
        'Delivery': 'DELIVERY',
        'Bar': 'DINE IN'
      };
      setOrderType(orderTypeMap[existingOrder.orderType] || 'DINE IN');

      const convertedItems: OrderItem[] = existingOrder.items.map((item, index) => ({
        id: Date.now() + index,
        qty: item.qty,
        name: item.name,
        price: item.price,
        modifiers: item.modifiers.length > 0 ? item.modifiers : undefined,
        itemOrderType: orderTypeMap[existingOrder.orderType] || 'Dine In'
      }));

      setExistingItems(convertedItems);

      if (!isExistingOrderPaid) {
        setOrderItems(convertedItems);
      }
    }
  }, [addItemMode, existingOrderId]);

  // Handle Transfer to New Order mode - pre-fill cart with transferred items
  useEffect(() => {
    if (transferNewMode && transferItemsParam) {
      try {
        const items = JSON.parse(transferItemsParam) as Array<{
          name: string;
          price: number;
          qty: number;
          modifiers?: string[];
        }>;
        const convertedItems: OrderItem[] = items.map((item, index) => ({
          id: Date.now() + index,
          qty: item.qty,
          name: item.name,
          price: item.price,
          modifiers: item.modifiers && item.modifiers.length > 0 ? item.modifiers : undefined,
          isTransferred: true
        }));
        setOrderItems(convertedItems);
      } catch (e) {
        console.error('Failed to parse transfer items:', e);
      }
    }
  }, [transferNewMode, transferItemsParam]);


  useEffect(() => {
    if (isGuestSelected) {
      setIsGuestSelected(false);
      return;
    }
    if (guestName.trim().length > 0) {
      const timer = setTimeout(async () => {
        const results = await searchCustomers(guestName);
        const mapped = results.map((c, i) => ({ id: i + 1, name: c.name, phone: c.phone || "", initials: c.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() } as GuestUser));
        setFilteredGuests(mapped);
        setShowGuestDropdown(mapped.length > 0);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setFilteredGuests([]);
      setShowGuestDropdown(false);
    }
  }, [guestName]);

  // Filter guests based on phone input
  useEffect(() => {
    if (isGuestSelected) {
      return;
    }
    if (guestPhone.trim().length > 0) {
      const timer = setTimeout(async () => {
        const results = await searchCustomers(guestPhone);
        const mapped = results.map((c, i) => ({ id: i + 1, name: c.name, phone: c.phone || "", initials: c.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() } as GuestUser));
        setFilteredByPhone(mapped);
        setShowPhoneDropdown(mapped.length > 0);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setFilteredByPhone([]);
      setShowPhoneDropdown(false);
    }
  }, [guestPhone]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      // Close guest name dropdown
      if (guestDropdownRef.current && !guestDropdownRef.current.contains(target) && guestInputRef.current && !guestInputRef.current.contains(target) && mobileGuestDropdownRef.current && !mobileGuestDropdownRef.current.contains(target) && mobileGuestInputRef.current && !mobileGuestInputRef.current.contains(target)) {
        setShowGuestDropdown(false);
      }
      // Close phone dropdown
      if (phoneDropdownRef.current && !phoneDropdownRef.current.contains(target) && phoneInputRef.current && !phoneInputRef.current.contains(target) && mobilePhoneDropdownRef.current && !mobilePhoneDropdownRef.current.contains(target) && mobilePhoneInputRef.current && !mobilePhoneInputRef.current.contains(target)) {
        setShowPhoneDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const selectGuest = async (guest: GuestUser) => {
    setIsGuestSelected(true);
    setGuestName(guest.name);
    setGuestPhone(guest.phone.replace(/\D/g, ''));
    setShowGuestDropdown(false);
    setShowPhoneDropdown(false);

    // Fetch past orders for this guest and show popup
    try {
      setPastOrderLoading(true);
      // Look up the guest in DB by name to get their id + extra fields
      const { data: guestRows } = await supabase
        .from('guests')
        .select('id,name,phone,email,order_count,last_order_date,loyalty,allergies,notes_general,notes_allergies')
        .ilike('name', guest.name)
        .limit(1);
      
      const dbGuest = guestRows?.[0];
      if (dbGuest && dbGuest.order_count > 0) {
        // Fetch past orders with totals
        const { data: orders } = await supabase
          .from('orders')
          .select('id,total,tip_amount')
          .eq('guest_id', dbGuest.id)
          .order('created_at', { ascending: false })
          .limit(10);

        const totalSpent = orders?.reduce((s, o) => s + (o.total || 0), 0) || 0;
        const totalTips = orders?.reduce((s, o) => s + (o.tip_amount || 0), 0) || 0;

        // Combine allergy fields
        const allergies: string[] = [];
        if (dbGuest.allergies && Array.isArray(dbGuest.allergies) && dbGuest.allergies.length > 0) {
          allergies.push(...dbGuest.allergies);
        }
        const notesAllergies = dbGuest.notes_allergies?.trim();
        if (notesAllergies && !allergies.includes(notesAllergies)) {
          allergies.push(notesAllergies);
        }

        setPastOrderGuest({
          id: dbGuest.id,
          name: dbGuest.name,
          phone: dbGuest.phone || undefined,
          email: dbGuest.email || undefined,
          orderCount: dbGuest.order_count,
          lastOrderDate: dbGuest.last_order_date || undefined,
          loyaltyTier: dbGuest.loyalty || undefined,
          totalSpent,
          totalTips,
          allergies: allergies.length > 0 ? allergies : undefined,
          notes: dbGuest.notes_general?.trim() || undefined,
        });

        // Fetch past order items from the last 3 orders
        const recentOrderIds = (orders || []).slice(0, 3).map(o => o.id);
        if (recentOrderIds.length > 0) {
          const { data: items } = await supabase
            .from('order_items')
            .select('id,item_name,quantity,unit_price,total_price,category')
            .in('order_id', recentOrderIds);

          if (items && items.length > 0) {
            // Cross-reference with current products for availability
            const pastItems: GuestPastItem[] = items.map(item => {
              const currentProduct = dbProducts.find(
                p => p.name.toLowerCase() === item.item_name.toLowerCase()
              );
              return {
                id: item.id,
                name: item.item_name,
                quantity: item.quantity,
                price: currentProduct ? currentProduct.price : item.unit_price,
                originalPrice: currentProduct && currentProduct.price !== item.unit_price ? item.unit_price : undefined,
                category: item.category || undefined,
                isAvailable: currentProduct ? currentProduct.is_available : false,
                isComped: item.unit_price === 0,
              };
            });
            // Deduplicate by name, keep latest
            const seen = new Map<string, GuestPastItem>();
            for (const pi of pastItems) {
              if (!seen.has(pi.name.toLowerCase())) {
                seen.set(pi.name.toLowerCase(), pi);
              }
            }
            setPastOrderItems(Array.from(seen.values()));
          } else {
            setPastOrderItems([]);
          }
        } else {
          setPastOrderItems([]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch past orders:', err);
    } finally {
      setPastOrderLoading(false);
    }
  };

  // Get base height in pixels for each menu position
  const getMenuHeight = (position: 'minimized' | 'center' | 'full') => {
    if (typeof window === 'undefined') return 48;
    if (position === 'minimized') return 48; // h-12 = 3rem = 48px
    if (position === 'center') return window.innerHeight - 344; // screen minus order panel area (18rem = 288px) + bottom nav (3.5rem = 56px)
    return window.innerHeight - 168; // full minus header area (7rem = 112px) + bottom nav (3.5rem = 56px)
  };
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientY);
    setTouchStartTime(Date.now());
    setIsDragging(true);
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const currentY = e.touches[0].clientY;
    const diff = touchStart - currentY; // positive = swiping up
    setDragOffset(diff);
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null || touchStartTime === null) {
      setIsDragging(false);
      return;
    }
    const touchEnd = e.changedTouches[0].clientY;
    const diff = touchStart - touchEnd;
    const timeDiff = Date.now() - touchStartTime;
    const velocity = Math.abs(diff) / timeDiff; // pixels per millisecond

    // Fast swipe (velocity > 0.5) - snap to next/previous state
    if (velocity > 0.5) {
      if (diff < -20) {
        // Swipe down - hide/minimize
        setMenuPosition((prev) => prev === 'full' ? 'center' : 'minimized');
      } else if (diff > 20) {
        // Swipe up - show/expand
        setMenuPosition((prev) => prev === 'minimized' ? 'center' : 'full');
      }
    } else {
      // Slow drag - snap based on current visual height
      const baseHeight = getMenuHeight(menuPosition);
      const currentHeight = baseHeight + dragOffset;
      const minimizedH = getMenuHeight('minimized');
      const centerH = getMenuHeight('center');
      const fullH = getMenuHeight('full');

      // Find nearest position
      const distances = [{
        pos: 'minimized' as const,
        dist: Math.abs(currentHeight - minimizedH)
      }, {
        pos: 'center' as const,
        dist: Math.abs(currentHeight - centerH)
      }, {
        pos: 'full' as const,
        dist: Math.abs(currentHeight - fullH)
      }];
      const nearest = distances.reduce((a, b) => a.dist < b.dist ? a : b);
      setMenuPosition(nearest.pos);
    }

    // Reset drag states
    setDragOffset(0);
    setIsDragging(false);
    setTouchStart(null);
    setTouchStartTime(null);
  };

  // Mouse/Pointer event handlers for desktop
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const startY = e.clientY;
    const startTime = Date.now();
    setTouchStart(startY);
    setTouchStartTime(startTime);
    setIsDragging(true);

    // Add global listeners for mouse move and up
    const handleGlobalMouseMove = (e: MouseEvent) => {
      const diff = startY - e.clientY;
      setDragOffset(diff);
    };
    const handleGlobalMouseUp = (e: MouseEvent) => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      const diff = startY - e.clientY;
      const timeDiff = Date.now() - startTime;
      const velocity = Math.abs(diff) / timeDiff;
      if (velocity > 0.5) {
        if (diff < -20) {
          // Swipe down - hide/minimize
          setMenuPosition((prev) => prev === 'full' ? 'center' : 'minimized');
        } else if (diff > 20) {
          // Swipe up - show/expand
          setMenuPosition((prev) => prev === 'minimized' ? 'center' : 'full');
        }
      } else {
        // Snap based on final position
        if (diff < -80) {
          // Drag down - hide/minimize
          setMenuPosition((prev) => prev === 'full' ? 'center' : 'minimized');
        } else if (diff > 80) {
          // Drag up - show/expand
          setMenuPosition((prev) => prev === 'minimized' ? 'center' : 'full');
        }
      }
      setDragOffset(0);
      setIsDragging(false);
      setTouchStart(null);
      setTouchStartTime(null);
    };
    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);
  };
  const addToCart = (item: {
    id: number;
    name: string;
    price: number;
    isOpenPrice?: boolean;
  }) => {
    // Block adding items if order is split
    if (isOrderSplit) {
      setShowSplitOrderAlert(true);
      return;
    }

    // Open Price: open price dialog first (quick add flow)
    if (item.isOpenPrice) {
      setOpenPriceItem({ ...item, isOpenPrice: true });
      setOpenPriceFlow('quickAdd');
      setOpenPriceImageIndex(0);
      setShowOpenPriceDialog(true);
      return;
    }

    // When coming from table order, assign all seats by default
    const allSeats = isTableOrder ? Array.from({ length: guestCount }, (_, i) => i + 1) : undefined;

    setOrderItems((prev) => {
      const existing = prev.find((o) => o.name === item.name && (!o.modifiers || o.modifiers.length === 0));
      if (existing) {
        return prev.map((o) => o.name === item.name && (!o.modifiers || o.modifiers.length === 0) ? {
          ...o,
          qty: o.qty + 1
        } : o);
      }
      return [...prev, {
        id: Date.now(),
        qty: 1,
        name: item.name,
        price: item.price,
        assignedSeats: allSeats
      }];
    });
  };
  const addToCartWithModifiers = (item: {
    id: number;
    name: string;
    price: number;
    isOpenPrice?: boolean;
  }, quantity: number, modifiers: string[], notes: string, totalPrice: number, assignedSeats?: number[], discountInfo?: {name: string;amount: number;}) => {
    // When assignedSeats is defined (from table order) but empty, treat as "share on table" (all seats)
    const allSeats = isTableOrder ? Array.from({ length: guestCount }, (_, i) => i + 1) : undefined;
    const seatsToAssign = assignedSeats !== undefined ?
    assignedSeats.length > 0 ? assignedSeats : allSeats :
    undefined;

    setOrderItems((prev) => {
      return [...prev, {
        id: Date.now(),
        qty: quantity,
        name: item.name,
        price: totalPrice / quantity, // Store the unit price including modifiers/add-ons
        modifiers: modifiers.length > 0 ? modifiers : undefined,
        notes: notes.trim() ? notes.trim() : undefined,
        assignedSeats: seatsToAssign,
        discountName: discountInfo?.name,
        discountAmount: discountInfo?.amount,
        isOpenPrice: item.isOpenPrice ?? false
      }];
    });
  };
  const openCustomizationDialog = (item: {
    id: number;
    name: string;
    price: number;
  }, imageIndex: number) => {
    // Block opening customization if order is split
    if (isOrderSplit) {
      setShowSplitOrderAlert(true);
      return;
    }

    // If cart item is a voucher, open Sell Voucher screen in edit mode
    const fullItem = orderItems.find((i) => i.id === item.id) as OrderItem | undefined;
    if (fullItem?.itemOrderType === 'VOUCHER' && (fullItem as any)?.voucherMeta) {
      setEditingVoucherData({
        type: ((fullItem as any).voucherMeta.type as 'fixed' | 'percentage') || 'fixed',
        value: (fullItem as any).voucherMeta.value ?? 0,
        sellingPrice: fullItem.price,
        expiryDate: (fullItem as any).voucherMeta.expiryDate,
        quantity: fullItem.qty ?? 1,
        editingItemId: fullItem.id,
        voucherName: (fullItem as any).voucherMeta.voucherName,
      });
      setVoucherMode(true);
      return;
    }

    // If cart item is open price, open Open Price dialog in edit flow
    if (fullItem?.isOpenPrice) {
      setOpenPriceItem({ id: fullItem.id, name: fullItem.name, price: fullItem.price, isOpenPrice: true });
      setOpenPriceFlow('editCartItem');
      setOpenPriceEditCartItemId(fullItem.id);
      setOpenPriceImageIndex(imageIndex);
      setShowOpenPriceDialog(true);
      return;
    }

    // If menu item is open price with no price yet, open Open Price dialog (viewItem flow)
    const menuItem = item as MenuItem;
    if (menuItem.isOpenPrice && item.price === 0) {
      setOpenPriceItem(menuItem);
      setOpenPriceFlow('viewItem');
      setOpenPriceImageIndex(imageIndex);
      setShowOpenPriceDialog(true);
      return;
    }

    setSelectedItemForCustomization(item);
    setSelectedItemImage(foodImages[imageIndex % foodImages.length]);

    // Check if mobile (window width < 768px)
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      // Show inline customization on mobile - stay in current position
      setShowInlineCustomization(true);
    } else {
      // Show dialog on desktop
      setCustomizationDialogOpen(true);
    }
  };
  const handleInlineAddToCart = (item: {
    id: number;
    name: string;
    price: number;
  }, quantity: number, modifiers: string[], notes: string, totalPrice: number, discountInfo?: {name: string;amount: number;}) => {
    addToCartWithModifiers(item, quantity, modifiers, notes, totalPrice, undefined, discountInfo);
    setShowInlineCustomization(false);
    setSelectedItemForCustomization(null);
    setMenuPosition('center');
  };
  const handleInlineCancel = () => {
    setShowInlineCustomization(false);
    setSelectedItemForCustomization(null);
    setMenuPosition('center');
    setIsProductInfoFullScreen(false);
  };
  const handleInlineViewChange = (view: 'customization' | 'mpin' | 'priceOverride' | 'productInfo') => {
    setIsProductInfoFullScreen(view === 'productInfo');
  };
  const removeFromCart = (itemId: number) => {
    const target = orderItems.find(i => i.id === itemId);
    if (target && target.isFired) {
      // Show write-off choice popup for fired items
      setWriteOffPendingItemId(itemId);
      setShowWriteOffPopup(true);
      return;
    }
    // Not fired: always restore stock
    if (target) {
      adjustStock([{ name: target.name, qty: target.qty }], 'restore');
    }
    setOrderItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const handleWriteOffChoice = (choice: 'write_off' | 'without') => {
    if (writeOffPendingItemId !== null) {
      const target = orderItems.find(i => i.id === writeOffPendingItemId);
      if (target) {
        if (choice === 'write_off') {
          processCancelledItems(
            [{ name: target.name, price: target.price, quantity: target.qty, isFired: true }],
            undefined,
            'Cancelled after fire',
            true
          );
        } else {
          adjustStock([{ name: target.name, qty: target.qty }], 'restore');
        }
      }
      setOrderItems((prev) => prev.filter((item) => item.id !== writeOffPendingItemId));
    }
    setShowWriteOffPopup(false);
    setWriteOffPendingItemId(null);
  };
  const updateItemOrderType = (itemId: number, newOrderType: string) => {
    setOrderItems((prev) => prev.map((item) =>
    item.id === itemId ? { ...item, itemOrderType: newOrderType } : item
    ));
  };

  // Price Override functions
  const handlePriceClick = (item: {id: number;name: string;price: number;}, image?: string) => {
    setPriceOverrideItem({ ...item, image });
    setShowMPINDialog(true);
  };

  const handleMPINSuccess = () => {
    setShowPriceOverrideDialog(true);
  };

  const handlePriceOverrideApply = (newPrice: number, reason: string, notes?: string) => {
    if (priceOverrideItem) {
      setOrderItems((prev) => prev.map((item) =>
      item.id === priceOverrideItem.id ?
      { ...item, price: newPrice, priceOverrideReason: reason, priceOverrideNotes: notes } :
      item
      ));
      setPriceOverrideItem(null);
    }
  };

  // Custom Item Panel functions
  const handleCustomItemNumpadClick = (value: string) => {
    if (activeCustomItemField === 'price') {
      if (value === 'clear') {
        setCustomItemPrice("");
      } else if (value === 'backspace') {
        setCustomItemPrice((prev) => prev.slice(0, -1));
      } else if (value === '.') {
        if (!customItemPrice.includes('.')) {
          setCustomItemPrice((prev) => prev + value);
        }
      } else {
        // Limit decimal places to 2
        const parts = customItemPrice.split('.');
        if (parts.length === 2 && parts[1].length >= 2) return;
        setCustomItemPrice((prev) => prev + value);
      }
    }
  };

  const handleCustomItemKeyboardClick = (key: string) => {
    if (activeCustomItemField === 'name') {
      if (key === 'backspace') {
        setCustomItemName((prev) => prev.slice(0, -1));
      } else if (key === 'clear') {
        setCustomItemName("");
      } else if (key === 'space') {
        setCustomItemName((prev) => prev + ' ');
      } else if (key === 'shift') {
        setIsShiftActive((prev) => !prev);
      } else if (key === '123') {
        // Switch to price field when 123 is pressed
        setActiveCustomItemField('price');
      } else {
        // Auto-capitalize first letter of each word
        setCustomItemName((prev) => {
          const shouldCapitalize = prev.length === 0 || prev.endsWith(' ');
          const char = shouldCapitalize || isShiftActive ? key.toUpperCase() : key.toLowerCase();
          return prev + char;
        });
        // Auto-disable shift after typing a character
        if (isShiftActive) {
          setIsShiftActive(false);
        }
      }
    }
  };

  const addCustomItemToOrder = () => {
    const price = parseFloat(customItemPrice) || 0;
    if (customItemName.trim() && price > 0) {
      setOrderItems((prev) => [...prev, {
        id: Date.now(),
        qty: 1,
        name: customItemName.trim(),
        price: price
      }]);
      setCustomItemName("");
      setCustomItemPrice("");
      setShowCustomItemPanel(false);
    }
  };

  const toggleCustomItemPanel = () => {
    if (showCustomItemPanel) {
      // Going back to menu
      setShowCustomItemPanel(false);
      setCustomItemName("");
      setCustomItemPrice("");
    } else {
      // Opening custom item panel
      setShowCustomItemPanel(true);
      setMenuPosition('full');
      setActiveCustomItemField('name');
    }
  };
  const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.qty, 0);
  const discount = selectedDiscounts.reduce((sum, d) => {
    if (d.type === "percentage") return sum + (subtotal * d.value) / 100;
    return sum + d.value;
  }, 0);
  const serviceCharge = appliedServiceCharge;
  const taxRate = getActiveTaxRate();
  // Calculate tax only on items NOT marked as noTax
  const taxableSubtotal = orderItems.
  filter((item) => !item.noTax).
  reduce((sum, item) => sum + item.price * item.qty, 0);
  const tax = isTaxExempt ? 0 : Math.max(0, taxableSubtotal - discount) * taxRate;

  // Handler to toggle no-tax state for individual items
  const handleToggleItemNoTax = (itemId: number) => {
    setOrderItems((prev) => prev.map((item) =>
    item.id === itemId ?
    { ...item, noTax: !item.noTax } :
    item
    ));
  };

  // Handler to toggle fired state for individual items
  const handleToggleItemFire = (itemId: number) => {
    setOrderItems((prev) => {
      const target = prev.find(i => i.id === itemId);
      if (target) {
        adjustStock(
          [{ name: target.name, qty: target.qty }],
          target.isFired ? 'restore' : 'deduct'
        );
      }
      return prev.map((item) =>
        item.id === itemId ? { ...item, isFired: !item.isFired } : item
      );
    });
  };

  // Handler to fire the entire order (session orders)
  const handleFireOrder = () => {
    if (requireOrderType && !orderType) {
      toast.error("Please select an order type before firing");
      return;
    }
    if (requireGuestName && !guestName.trim()) {
      toast.error("Please enter a guest name before firing");
      return;
    }
    if (!isSessionOrderMode || !sessionIdFromParams) {
      // Not a session order - create DB record and mark items as fired
      setOrderItems((prev) => {
        const unfiredItems = prev.filter(item => !item.isFired);
        if (unfiredItems.length > 0) {
          adjustStock(
            unfiredItems.map(item => ({ name: item.name, qty: item.qty })),
            'deduct'
          );
        }
        return prev.map((item) => ({ ...item, isFired: true }));
      });

      const quickTotal = subtotal - discount + serviceCharge + tax;
      addTicketOrder({
        name: guestName || 'Quick Order',
        phone: guestPhone || '',
        partySize: 1,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timer: '0:00',
        server: '',
        check: '',
        paymentType: '',
        revenueCenter: '',
        status: 'ORDERED',
        notes: orderNotes || '',
        table: '',
        orderType: orderType || 'DINE IN',
        subtotal,
        discount,
        serviceCharge,
        tax,
        tip: 0,
        total: quickTotal,
        items: orderItems.map(item => ({
          qty: item.qty,
          name: item.name,
          price: item.price,
          seats: item.assignedSeats || [],
          modifiers: item.modifiers || [],
          isShared: false,
          isFired: true,
          noTax: item.noTax || false,
        })),
      }).then((data: any) => {
        if (data?.id) {
          setQuickOrderDbId(data.id);
        }
      }).catch(console.error);

      toast.success("Order fired to kitchen!");
      return;
    }

    if (orderItems.length === 0) {
      toast.error("Please add products to the order before firing");
      return;
    }

    // Convert cart items to the format expected by session orders
    const sessionOrderItems = orderItems.map((item) => ({
      qty: item.qty,
      name: item.name,
      price: item.price,
      seats: item.assignedSeats || [],
      modifiers: item.modifiers || [],
      isShared: item.assignedSeats?.length === guestCount
    }));

    // Update session order items
    updateOrderItems(sessionIdFromParams, sessionOrderItems);

    // Fire the order - changes status to ORDERED
    fireSessionOrder(sessionIdFromParams);

    toast.success("Order fired to kitchen!");

    // Navigate to TableOrderDetails
    if (tableIdFromParams) {
      navigate(`/tableorder/${tableIdFromParams}`);
    }
  };

  const total = subtotal - discount + serviceCharge + tax;

  // Calculate new items total for add-item mode when existing order is paid
  const newItemsSubtotal = addItemMode && isExistingOrderPaid ?
  orderItems.reduce((sum, item) => sum + item.price * item.qty, 0) :
  subtotal;
  const newItemsTax = newItemsSubtotal * taxRate;
  const newItemsTotal = newItemsSubtotal + newItemsTax;

  // Determine what to charge based on payment status, gift card, and voucher
  const baseChargeAmount = addItemMode && isExistingOrderPaid ? newItemsTotal : total;
  const chargeAmount = Math.max(0, baseChargeAmount - appliedGiftCardAmount - appliedVoucherAmount);
  const chargeLabel = addItemMode ?
  isExistingOrderPaid ? 'NEW ITEMS' : 'FULL ORDER' :
  '';
  return <div className="relative flex h-full overflow-hidden">
    <div className={`relative flex flex-col md:flex-row gap-[10px] md:gap-1 lg:gap-2 h-full overflow-hidden pt-2 transition-all duration-300 w-full`}>
      {/* Panel Drop Zones for drag and drop repositioning */}
      <PanelDropZones />
      {/* Right Panel - Order (Shows first on mobile) */}
      <div className={`md:hidden flex flex-col overflow-hidden transition-all duration-300 ${isOrderPanelExpanded ? 'flex-1' : 'flex-shrink-0'}`}>
        {/* Order Header - Outside background container */}
        <div className="px-1 pb-2 flex-shrink-0">
          <div className="flex items-center justify-between text-xs mb-2 gap-2">
            <div className="relative">
              <input ref={mobileGuestInputRef} type="text" value={guestName} onChange={(e) => setGuestName(e.target.value)} placeholder="GUEST NAME" className="bg-transparent outline-none placeholder:text-[#808080] w-24 min-w-0 font-medium text-[#808080]" />
              {showGuestDropdown && filteredGuests.length > 0 && <div ref={mobileGuestDropdownRef} className="absolute top-full left-0 mt-1 bg-neutral-700 rounded-xl shadow-xl border border-neutral-600 z-50 min-w-[220px] py-1 overflow-hidden">
                  {filteredGuests.map((guest) => <button key={guest.id} onClick={() => selectGuest(guest)} className="w-full flex items-center gap-3 px-3 py-2 hover:bg-neutral-600 transition-colors text-left">
                      {guest.avatar ? <img src={guest.avatar} alt={guest.name} className="w-10 h-10 rounded-full object-cover" /> : <div className="w-10 h-10 rounded-full bg-neutral-500 flex items-center justify-center text-white font-semibold text-sm">
                          {guest.initials}
                        </div>}
                      <div className="flex flex-col">
                        <span className="text-white font-medium text-sm">{guest.name}</span>
                        <span className="text-neutral-400 text-xs">{guest.phone}</span>
                      </div>
                    </button>)}
                </div>}
            </div>
            <div className="relative flex items-center gap-0.5">
              <img src={phoneIcon} alt="Phone" className="w-4 h-4" />
              <input ref={mobilePhoneInputRef} type="tel" inputMode="tel" value={formatPhoneNumber(guestPhone)} onChange={(e) => setGuestPhone(e.target.value.replace(/\D/g, ''))} placeholder="(XXX) XXX-XXXX" className="bg-transparent outline-none placeholder:text-[#808080] w-36 min-w-0 text-[#808080]" />
              {showPhoneDropdown && filteredByPhone.length > 0 && <div ref={mobilePhoneDropdownRef} className="absolute top-full left-0 mt-1 bg-neutral-700 rounded-xl shadow-xl border border-neutral-600 z-50 min-w-[220px] py-1 overflow-hidden">
                  {filteredByPhone.map((guest) => <button key={guest.id} onClick={() => selectGuest(guest)} className="w-full flex items-center gap-3 px-3 py-2 hover:bg-neutral-600 transition-colors text-left">
                      {guest.avatar ? <img src={guest.avatar} alt={guest.name} className="w-10 h-10 rounded-full object-cover" /> : <div className="w-10 h-10 rounded-full bg-neutral-500 flex items-center justify-center text-white font-semibold text-sm">
                          {guest.initials}
                        </div>}
                      <div className="flex flex-col">
                        <span className="text-white font-medium text-sm">{guest.name}</span>
                        <span className="text-neutral-400 text-xs">{guest.phone}</span>
                      </div>
                    </button>)}
                </div>}
            </div>
            <div className="flex items-center gap-1 whitespace-nowrap flex-shrink-0">
              <img src={timeIcon} alt="Time" className="w-4 h-4" />
              <span className="text-white">{arrivedAt}</span>
            </div>
          </div>
          
          {/* Action buttons - hidden on mobile, shown via three-dot dropdown */}
          <div className="hidden md:block overflow-x-auto scrollbar-hide mb-2">
            <div className="flex items-center gap-2 w-max">
              <Button
              variant="secondary"
              size="sm"
              className="text-xs rounded-[10px] bg-[#666666] hover:bg-[#666666] border border-sidebar-border h-7 px-3 whitespace-nowrap flex items-center gap-1.5"
              onClick={toggleCustomItemPanel}>

                <img src={showCustomItemPanel ? menuIcon : customItemIcon} alt="" className="w-4 h-4" />
                {showCustomItemPanel ? "Menu" : "Custom Item"}
              </Button>
              <Button
               variant="secondary"
               size="sm"
               className={`text-xs rounded-[10px] ${selectedDiscounts.length > 0 ? 'bg-primary/30 border-primary text-primary' : 'bg-[#666666] border-sidebar-border'} hover:bg-[#666666] border h-7 px-3 whitespace-nowrap`}
               onClick={() => setShowDiscountMpin(true)}>

                 Discount {selectedDiscounts.length > 0 && `(${selectedDiscounts.length})`}
               </Button>
              <Button
              variant="secondary"
              size="sm"
              className={`text-xs rounded-[10px] ${isTaxExempt ? 'bg-orange-500/20 border-orange-500' : 'bg-[#666666] border-sidebar-border'} hover:bg-[#666666] border h-7 px-3 whitespace-nowrap`}
              onClick={() => isTaxExempt ? setIsTaxExempt(false) : setShowNoTaxDialog(true)}>

                No Tax
              </Button>
              <Button variant="secondary" size="sm" className="text-xs rounded-[10px] bg-[#666666] hover:bg-[#666666] border border-sidebar-border h-7 px-3 whitespace-nowrap">
                No Sale
              </Button>
              <Button variant="secondary" size="sm" className="text-xs rounded-[10px] bg-[#666666] hover:bg-[#666666] border border-sidebar-border h-7 px-3 whitespace-nowrap">
                Gift
              </Button>
              <Button variant="secondary" size="icon" className="h-7 w-7 rounded-[10px] bg-[#666666] hover:bg-[#666666] border border-sidebar-border">
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>

        {/* Background Container for Order Content */}
        <div className={`flex flex-col bg-[#7575754D] border border-white rounded-lg overflow-hidden mx-1 transition-all duration-300 ${isOrderPanelExpanded ? 'flex-1 min-h-0' : 'min-h-0'}`}>
          {/* Order Type & Guest Info */}
          {isTableOrder ?
        <>
              {/* Table Order Header - Row 1 */}
              <div className="flex items-center justify-between px-2 py-2 border-b border-sidebar-border">
                <div className="flex items-center gap-2">
                  <span className="bg-neutral-700 border border-neutral-600 px-2 py-1 rounded text-xs font-medium text-white">
                    TABLE {tableIdFromParams}
                  </span>
                  <Users className="w-4 h-4 text-neutral-400" />
                  <span className="text-neutral-400 text-xs">Available Seats {totalSeats}</span>
                  <span className="font-bold text-white text-sm">{guestCount}</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <img src={runnerIcon} alt="User" className="w-4 h-4" />
                  <span className="text-neutral-400">{currentServerName}</span>
                  <button onClick={() => {
                const newExpanded = !isOrderPanelExpanded;
                setIsOrderPanelExpanded(newExpanded);
                if (newExpanded) {
                  setMenuPosition('minimized');
                } else {
                  setMenuPosition('center');
                }
              }} className="p-1 rounded hover:bg-neutral-700 transition-colors">
                    <img src={isOrderPanelExpanded ? collapsePanelIcon : expandPanelIcon} alt="Toggle panel" className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {/* Table Order Header - Row 2: Select seats */}
              {!SettingsManager.getControlCenterSettings().hideSeatSelector && (
              <div className="flex items-center gap-1 px-2 py-1.5 border-b border-sidebar-border" role="group" aria-label="Select seats">
                <span className="text-neutral-500 text-[10px] mr-0.5 self-center shrink-0">Select seats</span>
                <button type="button" className="p-1 bg-neutral-700 rounded hover:bg-neutral-600 transition-colors" aria-label="Chair">
                  <img src={chairWhiteIcon} alt="Chair" className="w-3 h-3" />
                </button>
                <button
              onClick={() => toggleSeatFilter('all')}
              className={`p-1 rounded transition-colors ${
              seatFilter.includes('all') ?
              'bg-white' :
              'bg-neutral-700 hover:bg-neutral-600'}`
              }>

                  <Share2 className={`w-3 h-3 ${seatFilter.includes('all') ? 'text-black' : 'text-white'}`} />
                </button>
                {Array.from({ length: guestCount }).map((_, i) =>
            <button
              key={i}
              onClick={() => toggleSeatFilter(i + 1)}
              className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold transition-colors ${
              seatFilter.includes(i + 1) ?
              'bg-white text-black' :
              'bg-neutral-600 text-white hover:bg-neutral-500'}`
              }>

                    {i + 1}
                  </button>
            )}
              </div>
              )}
            </> :

        <div className="flex items-center justify-between px-2 py-2 border-b border-sidebar-border">
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded transition-colors text-black" style={{
                  background: 'linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)'
                }}>
                      {orderType ? (
                        <>
                          <img src={orderTypes.find((t) => t.label === orderType)?.icon} alt="" className="w-4 h-4 invert" />
                          {orderType}
                        </>
                      ) : (
                        <span className="text-neutral-600">Select Type</span>
                      )}
                      <ChevronDown className="w-3 h-3" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="bg-neutral-800 border-neutral-700 min-w-[140px] p-1 z-50">
                    {orderTypes.map((type) => <DropdownMenuItem key={type.label} onClick={() => {
                  setOrderType(type.label);
                  openFormForType(type.label);
                }} className="text-white hover:bg-neutral-700 cursor-pointer text-[10px] py-1 px-2 flex items-center gap-2">
                        <img src={type.icon} alt="" className="w-4 h-4" />
                        {type.label}
                      </DropdownMenuItem>)}
                  </DropdownMenuContent>
                </DropdownMenu>
                {orderItems.length > 0 && <span className="bg-sidebar-accent px-2 py-0.5 rounded text-xs font-bold">20</span>}
              </div>
              <div className="flex items-center gap-2 text-xs">
                <img src={runnerIcon} alt="User" className="w-4 h-4" />
                <span>{currentServerName}</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="w-5 h-5 bg-white rounded-full flex items-center justify-center ml-2">
                      <MoreVertical className="w-3 h-3 text-black" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-neutral-800 border-neutral-700 min-w-[160px] p-1 z-50">
                    <DropdownMenuItem
                  onClick={toggleCustomItemPanel}
                  className="text-white hover:bg-neutral-700 cursor-pointer text-xs py-2 px-3 flex items-center gap-2">

                      <img src={customItemIcon} alt="" className="w-3.5 h-3.5" />
                      Custom Item
                    </DropdownMenuItem>
                    <DropdownMenuItem
                  onClick={() => setShowDiscountMpin(true)}
                  className={`${selectedDiscounts.length > 0 ? 'text-primary' : 'text-white'} hover:bg-neutral-700 cursor-pointer text-xs py-2 px-3 flex items-center gap-2`}>

                      <img src={discountIcon} alt="" className="w-3.5 h-3.5" />
                      Discount {selectedDiscounts.length > 0 && `(${selectedDiscounts.length})`}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                  onClick={() => isTaxExempt ? setIsTaxExempt(false) : setShowNoTaxDialog(true)}
                  className="text-white hover:bg-neutral-700 cursor-pointer text-xs py-2 px-3 flex items-center gap-2">

                      <img src={noTaxBtnIcon} alt="" className="w-3.5 h-3.5" />
                      No Tax
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-white hover:bg-neutral-700 cursor-pointer text-xs py-2 px-3 flex items-center gap-2">
                      <img src={registerBtnIcon} alt="" className="w-3.5 h-3.5" />
                      No Sale
                    </DropdownMenuItem>
                    <DropdownMenuItem
                  onClick={() => setShowTransferCheckDialog(true)}
                  className="text-white hover:bg-neutral-700 cursor-pointer text-xs py-2 px-3 flex items-center gap-2">

                      <img src={transferCheckIcon} alt="" className="w-3.5 h-3.5" />
                      Transfer Check
                    </DropdownMenuItem>
                    <DropdownMenuItem
                  onClick={() => setShowGiftCardDialog(true)}
                  className="text-white hover:bg-neutral-700 cursor-pointer text-xs py-2 px-3 flex items-center gap-2">

                      <img src={giftCardBtnIcon} alt="" className="w-3.5 h-3.5" />
                      Gift Card
                    </DropdownMenuItem>
                    <DropdownMenuItem
                  onClick={() => setShowServiceChargeDialog(true)}
                  className="text-white hover:bg-neutral-700 cursor-pointer text-xs py-2 px-3 flex items-center gap-2">

                      <img src={serviceChargeIcon} alt="" className="w-3.5 h-3.5" />
                      Service Charge
                    </DropdownMenuItem>
                    <DropdownMenuItem
                  onClick={() => setShowAddGuestForm(true)}
                  className="text-white hover:bg-neutral-700 cursor-pointer text-xs py-2 px-3 flex items-center gap-2">

                      <img src={addGuestIcon} alt="" className="w-3.5 h-3.5" />
                      Add Guest
                    </DropdownMenuItem>
                    <DropdownMenuItem
                  onClick={() => { setVoucherMode(true); setEditingVoucherData(null); }}
                  className="text-white hover:bg-neutral-700 cursor-pointer text-xs py-2 px-3 flex items-center gap-2">

                      <Ticket className="w-3.5 h-3.5" />
                      Voucher
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowMessageKitchen(true)} className="text-white hover:bg-neutral-700 cursor-pointer text-xs py-2 px-3 flex items-center gap-2">
                      <img src={messageKdsIcon} alt="" className="w-3.5 h-3.5 brightness-0 invert" />
                      Message Kitchen
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-white hover:bg-neutral-700 cursor-pointer text-xs py-2 px-3 flex items-center gap-2">
                      <img src={reopenCheckIcon} alt="" className="w-3.5 h-3.5" />
                      Reopen Check
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <button onClick={() => {
              const newExpanded = !isOrderPanelExpanded;
              setIsOrderPanelExpanded(newExpanded);
              if (newExpanded) {
                setMenuPosition('minimized');
              } else {
                setMenuPosition('center');
              }
            }} className="p-1 rounded hover:bg-neutral-700 transition-colors">
                  <img src={isOrderPanelExpanded ? collapsePanelIcon : expandPanelIcon} alt="Toggle panel" className="w-4 h-4" />
                </button>
              </div>
            </div>
        }

          {/* Order Notes - only show when cart has products */}
          {orderItems.length > 0 && (
          <div className="px-2 py-1.5 border-b border-sidebar-border">
            <OrderNotesAutocomplete
            value={orderNotes}
            onChange={setOrderNotes}
            placeholder="Order notes and Allergies" />

          </div>
          )}
          {transferNewMode &&
        <div className="px-3 py-1.5 border-b border-sidebar-border flex items-center gap-2">
              <img src={transferIconPng} alt="Transferred" className="w-4 h-4 opacity-70" />
              <span className="text-xs font-medium" style={{ color: '#8AC4FF' }}>
                Transferred from Order {searchParams.get('transferFrom')} · Table {searchParams.get('transferFromTable')?.replace('T', '')}
              </span>
            </div>
        }

          {/* Mobile Guest Forms */}
          {orderType === "DINE IN" && showDineInForm &&
        <div className="px-2 py-2 border-b border-sidebar-border">
              <DineInGuestForm
            onSave={(data) => {
              setDineInGuestData(data);
              setGuestName(data.guestName);
              setGuestPhone(data.phoneNumber || '');
              setShowDineInForm(false);
            }}
            onCancel={() => setShowDineInForm(false)}
            onClose={() => setShowDineInForm(false)}
            initialData={dineInGuestData || undefined} />

            </div>
        }
          {orderType === "TAKE OUT" && showTakeOutForm &&
        <div className="px-2 py-2 border-b border-sidebar-border">
              <TakeOutGuestForm
            onSave={(data) => {
              setTakeOutGuestData(data);
              setGuestName(data.guestName);
              setGuestPhone(data.phoneNumber || '');
              setShowTakeOutForm(false);
            }}
            onCancel={() => setShowTakeOutForm(false)}
            onClose={() => setShowTakeOutForm(false)}
            initialData={takeOutGuestData || undefined} />

            </div>
        }
          {orderType === "DELIVERY" && showDeliveryForm &&
        <div className="px-2 py-2 border-b border-sidebar-border">
              <DeliveryGuestForm
            onSave={(data) => {
              setDeliveryGuestData(data);
              setGuestName(data.guestName);
              setGuestPhone(data.phoneNumber || '');
              setShowDeliveryForm(false);
            }}
            onCancel={() => setShowDeliveryForm(false)}
            onClose={() => setShowDeliveryForm(false)}
            initialData={deliveryGuestData || undefined} />

            </div>
        }
          {orderType === "BANQUET" && showBanquetForm &&
        <div className="px-2 py-2 border-b border-sidebar-border">
              <BanquetGuestForm
            onSave={(data) => {
              setBanquetGuestData(data);
              setGuestName(data.guestName);
              setGuestPhone(data.phoneNumber || '');
              setShowBanquetForm(false);
            }}
            onCancel={() => setShowBanquetForm(false)}
            onClose={() => setShowBanquetForm(false)}
            initialData={banquetGuestData || undefined} />

            </div>
        }
          {orderType === "DRIVE THRU" && showDriveThruForm &&
        <div className="px-2 py-2 border-b border-sidebar-border">
              <DriveThruGuestForm
            onSave={(data) => {
              setDriveThruGuestData(data);
              setGuestName(data.guestName);
              setGuestPhone(data.phoneNumber || '');
              setShowDriveThruForm(false);
            }}
            onCancel={() => setShowDriveThruForm(false)}
            onClose={() => setShowDriveThruForm(false)}
            initialData={driveThruGuestData || undefined} />

            </div>
        }
          {orderType === "CURB SIDE" && showCurbSideForm &&
        <div className="px-2 py-2 border-b border-sidebar-border">
              <CurbSideGuestForm
            onSave={(data) => {
              setCurbSideGuestData(data);
              setGuestName(data.guestName);
              setGuestPhone(data.phoneNumber || '');
              setShowCurbSideForm(false);
            }}
            onCancel={() => setShowCurbSideForm(false)}
            onClose={() => setShowCurbSideForm(false)}
            initialData={curbSideGuestData || undefined} />

            </div>
        }
          {orderType === "SCHEDULED" && showScheduledForm &&
        <div className="px-2 py-2 border-b border-sidebar-border">
              <ScheduledGuestForm
            onSave={(data) => {
              setScheduledGuestData(data);
              setGuestName(data.guestName);
              setGuestPhone(data.phoneNumber || '');
              setShowScheduledForm(false);
            }}
            onCancel={() => setShowScheduledForm(false)}
            onClose={() => setShowScheduledForm(false)}
            initialData={scheduledGuestData || undefined} />

            </div>
        }
          {orderType === "PHONE-IN" && showPhoneInForm &&
        <div className="px-2 py-2 border-b border-sidebar-border">
              <PhoneInGuestForm
            onSave={(data) => {
              setPhoneInGuestData(data);
              setGuestName(data.guestName);
              setGuestPhone(data.phoneNumber || '');
              setShowPhoneInForm(false);
            }}
            onClose={() => setShowPhoneInForm(false)}
            initialData={phoneInGuestData || undefined} />

            </div>
        }
          {orderType === "CUSTOM" && showCustomOrderForm &&
        <div className="px-2 py-2 border-b border-sidebar-border">
              <CustomOrderGuestForm
            onSave={(data) => {
              setCustomOrderGuestData(data);
              setGuestName(data.guestName);
              setGuestPhone(data.phoneNumber || '');
              setShowCustomOrderForm(false);
            }}
            onClose={() => setShowCustomOrderForm(false)}
            initialData={customOrderGuestData || undefined} />

            </div>
        }

          {/* Mobile Add Guest Form Overlay */}
          {showAddGuestForm &&
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
              <div className="w-full max-w-md h-[85vh] rounded-xl overflow-hidden relative bg-card">
                <AddGuestForm
              onClose={() => setShowAddGuestForm(false)}
              onSave={(guestData) => {
                setGuestName(`${guestData.firstName} ${guestData.lastName}`);
                setGuestPhone(guestData.phoneNumber);
                setShowAddGuestForm(false);
              }}
              compact />

              </div>
            </div>
        }

          {/* Mobile Create Voucher Form Overlay */}
          {showCreateVoucherForm &&
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
              <div className="w-full max-w-md h-[85vh] rounded-xl overflow-hidden relative bg-card">
                <CreateVoucherForm
              onClose={() => setShowCreateVoucherForm(false)}
              onCreate={(voucherData) => {
                toast.success("Voucher created successfully!");
                setShowCreateVoucherForm(false);
              }} />
              </div>
            </div>
        }

          {/* Mobile Cart Items */}
          <div className={`min-h-0 overflow-hidden flex flex-col ${isOrderPanelExpanded ? 'flex-1' : ''}`}>
            {orderItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
                <img src={emptyOrderIcon} alt="Empty order" className="w-8 h-8 opacity-50 mb-2" />
                <span className="text-xs">Let's create an order</span>
              </div>
            ) : <ScrollArea key={`mobile-scroll-${clearCounter}`} className={`h-full ${isOrderPanelExpanded ? 'flex-1' : 'max-h-[78px]'}`}>
                <div className="px-1.5 py-0.5 space-y-0.5">
                  {(isTableOrder ? filteredOrderItems : orderItems).map((item, index) => <SwipeableCartItem key={item.id} onDelete={() => removeFromCart(item.id)} onNoTax={() => handleToggleItemNoTax(item.id)} isNoTax={item.noTax || false} onFire={() => handleToggleItemFire(item.id)} isFired={item.isFired || false} itemOrderType={item.itemOrderType || "Dine In"} onOrderTypeChange={(type) => updateItemOrderType(item.id, type)} isOpen={activeSwipedItemId === item.id} onSwipeStart={() => setActiveSwipedItemId(item.id)}>
                      <div
                  className={`rounded px-1.5 py-1 cursor-pointer ${item.isTransferred ? 'border border-[#3B6A9E] bg-accent' : 'bg-muted'}`}
                  onClick={() => openCustomizationDialog({ id: item.id, name: item.name, price: item.price }, index)}>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-4 h-4 rounded text-white text-[10px] font-medium flex items-center justify-center flex-shrink-0 ${item.isTransferred ? 'bg-[#3B6A9E]' : 'border border-white/50'}`}>
                              {item.qty}
                            </span>
                            <span className="text-[11px] font-medium text-foreground flex items-center gap-1">
                              {item.name}
                              {item.isOpenPrice && (
                                <span className="px-1 py-0.5 rounded text-[9px] font-semibold bg-orange-500/20 text-orange-400 border border-orange-500/30">Open Price</span>
                              )}
                            </span>
                          </div>
                          {item.itemOrderType === 'VOUCHER' ?
                    <span
                      className="text-[11px] font-medium text-foreground cursor-pointer transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePriceClick({ id: item.id, name: item.name, price: item.price }, foodImages[index % foodImages.length]);
                      }}>

                              ${item.price.toFixed(2)}
                            </span> :
                    item.noTax ?
                    <span
                      className="text-[11px] font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePriceClick({ id: item.id, name: item.name, price: item.price }, foodImages[index % foodImages.length]);
                      }}>

                              <span className="line-through text-white/40">${(item.price * (1 + taxRate)).toFixed(2)}</span>
                              <span className="text-green-400">${item.price.toFixed(2)}</span>
                            </span> :

                    <span
                      className="text-[11px] font-medium text-foreground hover:text-primary cursor-pointer transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePriceClick({ id: item.id, name: item.name, price: item.price }, foodImages[index % foodImages.length]);
                      }}>

                              ${item.price.toFixed(2)}
                            </span>
                    }
                        </div>
                        
                        {/* Modifiers with tree hierarchy - Mobile */}
                        {item.modifiers && item.modifiers.length > 0 && (() => {
                    const displayedModifiers = expandedCartItems.has(item.id) ? item.modifiers : item.modifiers.slice(0, 2);
                    const hasShowButton = item.modifiers.length > 2;

                    return (
                      <div className="ml-2.5 mt-0.5 relative">
                              {displayedModifiers.map((mod, idx) => {
                          const isAddOn = mod.startsWith("Add:");
                          const isRemoval = mod.startsWith("No ") || mod.startsWith("-");
                          const displayMod = isAddOn ? mod.replace("Add: ", "") : mod;
                          const isLastItem = !hasShowButton && idx === displayedModifiers.length - 1;

                          return (
                            <div key={idx} className="relative flex items-center text-[10px] py-[2px]">
                                    {/* Vertical line - only show if not last item */}
                                    {!isLastItem &&
                              <div className="absolute left-0 top-1/2 bottom-0 w-px bg-white" style={{ height: '100%' }} />
                              }
                                    {/* Vertical line segment to connect to horizontal */}
                                    <div className="absolute left-0 top-0 h-1/2 w-px bg-white" />
                                    {/* Horizontal connector */}
                                    <div className="absolute left-0 top-1/2 w-2.5 h-px bg-white" />
                                    {/* Content */}
                                    <div className="flex items-center gap-1.5 ml-4">
                                      <span className="text-white">
                                        {isAddOn ? '+' : isRemoval ? '-' : '•'}
                                      </span>
                                      <span className={`text-white ${isRemoval ? 'line-through' : ''}`}>
                                        {displayMod}
                                      </span>
                                    </div>
                                  </div>);

                        })}
                              {hasShowButton &&
                        <div className="relative flex items-center py-[2px]">
                                  {/* Vertical line segment to connect to horizontal (this is the last item) */}
                                  <div className="absolute left-0 top-0 h-1/2 w-px bg-white" />
                                  {/* Horizontal connector */}
                                  <div className="absolute left-0 top-1/2 w-2.5 h-px bg-white" />
                                  <button
                            className="text-[10px] text-white/60 hover:text-white ml-4"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedCartItems((prev) => {
                                const newSet = new Set(prev);
                                if (newSet.has(item.id)) {
                                  newSet.delete(item.id);
                                } else {
                                  newSet.add(item.id);
                                }
                                return newSet;
                              });
                            }}>

                                    {expandedCartItems.has(item.id) ? 'Show less' : `Show more (+${item.modifiers.length - 2})`}
                                  </button>
                                </div>
                        }
                            </div>);

                  })()}
                        
                        {/* Item Notes Display - Mobile */}
                        {item.notes &&
                  <div className="ml-2.5 mt-0.5 relative">
                            <div className="relative flex items-center text-[10px] py-[2px]">
                              {/* Vertical line segment to connect to horizontal */}
                              <div className="absolute left-0 top-0 h-1/2 w-px bg-white" />
                              {/* Horizontal connector */}
                              <div className="absolute left-0 top-1/2 w-2.5 h-px bg-white" />
                              {/* Content */}
                              <div className="flex items-center gap-1.5 ml-4">
                                <span className="text-white">📝</span>
                                <span className="text-white italic">{item.notes}</span>
                              </div>
                            </div>
                          </div>
                  }
                        
                        {/* Item Discount Display - Mobile */}
                        {item.discountName && item.discountAmount && item.discountAmount > 0 &&
                  <div className="ml-2.5 mt-0.5 relative">
                            <div className="relative flex items-center text-[10px] py-[2px]">
                              {/* Vertical line segment to connect to horizontal */}
                              <div className="absolute left-0 top-0 h-1/2 w-px bg-white" />
                              {/* Horizontal connector */}
                              <div className="absolute left-0 top-1/2 w-2.5 h-px bg-white" />
                              {/* Content */}
                              <div className="flex items-center gap-1.5 ml-4">
                                <Tag className="w-3 h-3 text-white" />
                                <span className="text-white">{item.discountName} (-${item.discountAmount.toFixed(2)})</span>
                              </div>
                            </div>
                          </div>
                  }
                        
                        {/* Seat Assignment Display - Mobile */}
                        {isTableOrder && item.assignedSeats && item.assignedSeats.length > 0 &&
                  <div className="mt-0.5 flex items-center gap-1 ml-5">
                            <img src={chairWhiteIcon} alt="Seats" className="w-3 h-3 opacity-70" />
                            {item.assignedSeats.length === guestCount ?
                    <span className="w-4 h-4 rounded bg-neutral-700 text-white flex items-center justify-center">
                                <Share2 className="w-2.5 h-2.5" />
                              </span> :

                    item.assignedSeats.map((seat) =>
                    <span
                      key={seat}
                      className="w-4 h-4 rounded bg-neutral-700 text-white text-[9px] font-medium flex items-center justify-center">

                                  {seat}
                                </span>
                    )
                    }
                          </div>
                  }
                      </div>
                    </SwipeableCartItem>)}
                </div>
              </ScrollArea>}
          </div>

          {/* Order Summary - Only show when items exist */}
          {orderItems.length > 0 && <div className="px-2 py-1 border-t border-sidebar-border text-xs flex items-center justify-between gap-2">
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">Sub:</span>
                <span className="text-foreground">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-red-500">{selectedDiscounts.length > 0 ? selectedDiscounts.map(d => d.name).join(', ') : 'Disc'}:</span>
                <span className="text-red-500">${discount.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">{appliedServiceChargeName ? appliedServiceChargeName.split(' ')[0] : 'Svc'}:</span>
                <span className="text-foreground">${serviceCharge.toFixed(2)}</span>
              </div>
            </div>}

          {/* Action Buttons - Only show when cart has items */}
          {orderItems.length > 0 &&
        <div className="px-2 py-2 flex items-center gap-2">
              <button onClick={handleClearOrderAttempt} className="w-8 h-8 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center flex-shrink-0">
                <img src={clearCIcon} alt="Cancel" className="w-3 h-3" />
              </button>
              {showSaveButton && (
              <button className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{
            backgroundColor: '#C9C9C9'
          }}>
                <img src={saveIcon} alt="Save" className="w-4 h-4" />
              </button>
              )}
              <button
            onClick={handleFireOrder}
            disabled={orderItems.length === 0 || orderItems.every(i => i.isFired)}
            className={`flex-1 h-8 rounded-full flex items-center justify-center gap-1.5 ${orderItems.length === 0 || orderItems.every(i => i.isFired) ? 'opacity-50 cursor-not-allowed' : ''}`}
            style={{
              background: 'linear-gradient(180deg, #FF9E65 0%, #FF5E00 100%)'
            }}>

                <img src={fireIcon} alt="Fire" className="w-4 h-4" />
                <span className="text-white font-semibold text-sm">FIRE</span>
              </button>
              <button
            onClick={() => {
              if (requireOrderType && !orderType) {
                toast.error("Please select an order type before charging");
                return;
              }
              if (requireGuestName && !guestName.trim()) {
                toast.error("Please enter a guest name before charging");
                return;
              }
              setShowPaymentDialog(true);
            }}
            className="flex-1 h-8 rounded-full flex items-center justify-center"
            style={{
              background: 'linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)'
            }}>

                <span className="text-black font-semibold text-xs">
                  CHARGE ${chargeAmount.toFixed(2)}{chargeLabel && ` (${chargeLabel})`}
                </span>
              </button>
            </div>
        }
        </div>
      </div>

      {/* Left Panel - Menu */}
      <div ref={menuPanelRef} className={`relative md:flex-1 flex flex-col min-w-0 bg-neutral-900 md:bg-black border-t border-sidebar-border md:border-0 rounded-t-[20px] md:rounded-none overflow-hidden md:pb-2 ${!isDragging ? 'transition-all duration-300 ease-out' : ''} ${menuPosition === 'minimized' && !isDragging ? 'h-12 flex-grow-0 flex-shrink-0 mt-auto' : menuPosition !== 'minimized' && !isDragging ? 'flex-1' : 'flex-grow-0 flex-shrink-0'} md:h-auto ${panelLayout === 'menu-right' ? 'md:order-2 md:pr-2' : 'md:order-1'}`} style={isDragging && dragOffset !== 0 ? {
      height: `${Math.max(48, Math.min(window.innerHeight - 80, getMenuHeight(menuPosition) + dragOffset))}px`,
      flexGrow: 0,
      flexShrink: 0,
      marginTop: 'auto'
    } : isDragging ? {
      height: `${getMenuHeight(menuPosition)}px`,
      flexGrow: 0,
      flexShrink: 0,
      marginTop: 'auto'
    } : undefined}>
        {/* Grabber for minimize/maximize */}
        <div className="flex items-center justify-between px-3 py-1.5 cursor-grab active:cursor-grabbing select-none md:hidden bg-neutral-900 rounded-t-[20px]">
          <div className="w-8" /> {/* Spacer for balance */}
          <div className="touch-none" onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd} onMouseDown={handleMouseDown}>
            <img src={grabberIcon} alt="Drag to resize" className="w-10 h-1.5 opacity-60 hover:opacity-100 transition-opacity cursor-grab" />
          </div>
          {!(showInlineCustomization && selectedItemForCustomization) && !isSearchMode && <div className="flex items-center gap-1">
            <button className="w-6 h-6 p-0 border-0 bg-transparent z-10 touch-auto" onClick={(e) => {
              e.stopPropagation();
              setIsSearchMode(true);
              setMenuPosition('full');
              setTimeout(() => searchInputRef.current?.focus(), 100);
            }}>
              <img src={searchIcon} alt="Search" className="w-full h-full object-contain" />
            </button>
            <AnimatedAIIcon size={16} onClick={() => setIsAIChatOpen(prev => !prev)} />
          </div>}
          {showInlineCustomization && selectedItemForCustomization || isSearchMode ? <div className="w-8" /> : null}
        </div>
        {/* Menu Content - Hidden when minimized */}
      <div className={`flex flex-col gap-2 transition-all duration-300 bg-neutral-900 rounded-[12px] md:rounded-[16px] ${voucherMode ? 'p-0' : showInlineCustomization && selectedItemForCustomization ? 'p-0' : 'p-2 md:p-2 lg:p-3'} ${menuPosition === 'minimized' ? 'h-0 opacity-0 overflow-hidden' : 'flex-1 opacity-100 overflow-hidden scrollbar-hide'}`}>
        {voucherMode ? (
          <SellVoucherScreen
            onBack={() => { setVoucherMode(false); setEditingVoucherData(null); }}
            initialData={editingVoucherData}
            guestData={(guestName || guestPhone) ? { name: guestName, phone: guestPhone } : null}
            onGuestIdentified={(guest) => {
              setGuestName(guest.name);
              setGuestPhone(guest.phone.replace(/\D/g, ''));
            }}
            onAddVoucher={(amount, voucherData) => {
              const price = voucherData.sellingPrice || amount;
              const voucherLabel = voucherData.voucherName?.trim() || 'Voucher';
              const label = `${voucherLabel} - $${voucherData.value.toFixed(2)}`;
              const meta = { type: voucherData.type, value: voucherData.value, expiryDate: voucherData.expiryDate, voucherName: voucherData.voucherName?.trim() };
              if (voucherData.customerName && !guestName) setGuestName(voucherData.customerName);
              if (voucherData.customerPhone && !guestPhone) setGuestPhone(voucherData.customerPhone.replace(/\D/g, ''));
              if (editingVoucherData?.editingItemId) {
                setOrderItems((prev) => prev.map(item =>
                  item.id === editingVoucherData.editingItemId
                    ? { ...item, qty: voucherData.quantity || 1, name: label, price, voucherMeta: meta } as any
                    : item
                ));
              } else {
                setOrderItems((prev) => [...prev, {
                  id: Date.now(),
                  qty: voucherData.quantity || 1,
                  name: label,
                  price: price,
                  itemOrderType: 'VOUCHER',
                  noTax: true,
                  voucherMeta: meta,
                } as any]);
              }
              setVoucherMode(false);
              setEditingVoucherData(null);
            }}
          />
        ) : showCustomItemPanel ? (
        /* Custom Item Panel */
        <div className="flex-1 flex flex-col p-3 md:p-4 overflow-y-auto scrollbar-hide min-h-0">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <h2 className="text-white text-lg font-semibold">Custom Item</h2>
              <button
              onClick={toggleCustomItemPanel}
              className="w-8 h-8 rounded-full bg-neutral-700 hover:bg-neutral-600 flex items-center justify-center transition-colors">

                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Name Input */}
            <div className="mb-3 flex-shrink-0">
              <div
              className={`flex items-center gap-3 bg-neutral-800 rounded-lg px-4 py-3 border ${activeCustomItemField === 'name' ? 'border-orange-500' : 'border-neutral-700'}`}
              onClick={() => setActiveCustomItemField('name')}>

                <span className="text-neutral-500 text-sm uppercase">NAME</span>
                <input
                type="text"
                value={customItemName}
                onChange={(e) => {
                  // Auto-capitalize first letter of each word
                  const value = e.target.value;
                  const capitalizedValue = value.replace(/\b\w/g, (char) => char.toUpperCase());
                  setCustomItemName(capitalizedValue);
                }}
                onFocus={() => setActiveCustomItemField('name')}
                placeholder="Enter item name"
                className="flex-1 bg-transparent outline-none text-white text-sm placeholder:text-neutral-500" />

              </div>
            </div>

            {/* Price Input */}
            <div className="mb-3 flex-shrink-0">
              <div
              className={`flex items-center gap-3 bg-neutral-800 rounded-lg px-4 py-3 border ${activeCustomItemField === 'price' ? 'border-orange-500' : 'border-neutral-700'}`}
              onClick={() => setActiveCustomItemField('price')}>

                <span className="text-neutral-500 text-sm uppercase">PRICE</span>
                <div className="flex-1 flex items-center">
                  <span className="text-white text-sm mr-1">$</span>
                  <input
                  type="text"
                  value={customItemPrice}
                  readOnly
                  onFocus={() => setActiveCustomItemField('price')}
                  placeholder="0.00"
                  className="flex-1 bg-transparent outline-none text-white text-sm placeholder:text-neutral-500" />

                </div>
              </div>
            </div>

            {/* Add to Order Button */}
            <button
            onClick={addCustomItemToOrder}
            disabled={!customItemName.trim() || !customItemPrice}
            className="w-full py-3 rounded-lg font-semibold text-white mb-4 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            style={{
              background: 'linear-gradient(180deg, #FF9E65 0%, #FF5E00 100%)'
            }}>

              <Plus className="w-4 h-4" />
              Add to Order
              {customItemPrice && <span className="ml-2">${parseFloat(customItemPrice).toFixed(2)}</span>}
            </button>

            {/* Keyboard / Numpad */}
            {activeCustomItemField === 'name' ? (
          /* QWERTY Keyboard for Name */
          <div className="flex flex-col gap-1.5 min-h-0">
                {/* Row 1: q-p */}
                <div className="grid grid-cols-10 gap-1">
                  {['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'].map((key) =>
              <button
                key={key}
                onClick={() => handleCustomItemKeyboardClick(key)}
                className="bg-neutral-800 hover:bg-neutral-700 rounded-lg text-white text-base md:text-lg font-medium py-3 transition-colors">

                      {isShiftActive ? key.toUpperCase() : key}
                    </button>
              )}
                </div>
                {/* Row 2: a-l */}
                <div className="grid grid-cols-10 gap-1">
                  {['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'].map((key) =>
              <button
                key={key}
                onClick={() => handleCustomItemKeyboardClick(key)}
                className="bg-neutral-800 hover:bg-neutral-700 rounded-lg text-white text-base md:text-lg font-medium py-3 transition-colors">

                      {isShiftActive ? key.toUpperCase() : key}
                    </button>
              )}
                  <div /> {/* Empty space to align */}
                </div>
                {/* Row 3: shift, z-m, backspace */}
                <div className="grid grid-cols-10 gap-1">
                  <button
                onClick={() => handleCustomItemKeyboardClick('shift')}
                className={`bg-neutral-800 hover:bg-neutral-700 rounded-lg text-white text-sm font-medium py-3 transition-colors ${isShiftActive ? 'bg-blue-600 hover:bg-blue-500' : ''}`}>

                    ⇧
                  </button>
                  {['z', 'x', 'c', 'v', 'b', 'n', 'm'].map((key) =>
              <button
                key={key}
                onClick={() => handleCustomItemKeyboardClick(key)}
                className="bg-neutral-800 hover:bg-neutral-700 rounded-lg text-white text-base md:text-lg font-medium py-3 transition-colors">

                      {isShiftActive ? key.toUpperCase() : key}
                    </button>
              )}
                  <button
                onClick={() => handleCustomItemKeyboardClick('backspace')}
                className="bg-neutral-800 hover:bg-neutral-700 rounded-lg text-white text-sm font-medium py-3 transition-colors col-span-2 flex items-center justify-center">

                    <Delete className="w-5 h-5" />
                  </button>
                </div>
                {/* Row 4: 123, Space, Clear */}
                <div className="grid grid-cols-6 gap-1">
                  <button
                onClick={() => handleCustomItemKeyboardClick('123')}
                className="bg-neutral-800 hover:bg-neutral-700 rounded-lg text-white text-sm font-medium py-3 transition-colors">

                    123
                  </button>
                  <button
                onClick={() => handleCustomItemKeyboardClick('space')}
                className="bg-neutral-800 hover:bg-neutral-700 rounded-lg text-white text-sm font-medium py-3 transition-colors col-span-4">

                    Space
                  </button>
                  <button
                onClick={() => handleCustomItemKeyboardClick('clear')}
                className="bg-red-600/80 hover:bg-red-600 rounded-lg text-white text-sm font-medium py-3 transition-colors">

                    Clear
                  </button>
                </div>
              </div>) : (

          /* Numpad for Price */
          <div className="flex flex-col gap-2 min-h-0">
                <div className="grid grid-cols-3 gap-2">
                  {['7', '8', '9', '4', '5', '6', '1', '2', '3'].map((num) =>
              <button
                key={num}
                onClick={() => handleCustomItemNumpadClick(num)}
                className="bg-neutral-800 hover:bg-neutral-700 rounded-lg text-white text-xl font-medium py-4 transition-colors">

                      {num}
                    </button>
              )}
                  <button
                onClick={() => handleCustomItemNumpadClick('clear')}
                className="bg-red-600/80 hover:bg-red-600 rounded-lg text-white text-lg font-medium py-4 transition-colors">

                    Clear
                  </button>
                  <button
                onClick={() => handleCustomItemNumpadClick('0')}
                className="bg-neutral-800 hover:bg-neutral-700 rounded-lg text-white text-xl font-medium py-4 transition-colors">

                    0
                  </button>
                  <button
                onClick={() => handleCustomItemNumpadClick('.')}
                className="bg-neutral-800 hover:bg-neutral-700 rounded-lg text-white text-xl font-medium py-4 transition-colors">

                    .
                  </button>
                </div>
                
                {/* Backspace Button */}
                <button
              onClick={() => handleCustomItemNumpadClick('backspace')}
              className="w-full bg-neutral-800 hover:bg-neutral-700 rounded-lg py-4 flex items-center justify-center transition-colors">

                  <Delete className="w-5 h-5 text-white" />
                </button>
              </div>)
          }
          </div> ) :
        showInlineCustomization && selectedItemForCustomization ?
        isProductInfoFullScreen ?
        // Full-screen product info overlay on mobile
        <div className="fixed inset-0 z-50 bg-neutral-900 md:hidden flex flex-col" style={{ bottom: '56px' }}>
              <InlineItemCustomization
            item={selectedItemForCustomization}
            itemImage={selectedItemImage}
            onAddToCart={handleInlineAddToCart}
            onCancel={handleInlineCancel}
            onViewChange={handleInlineViewChange}
            className="h-full" />

            </div> :

        <div className="flex-1 flex flex-col md:hidden overflow-y-auto scrollbar-hide">
              <InlineItemCustomization
            item={selectedItemForCustomization}
            itemImage={selectedItemImage}
            onAddToCart={handleInlineAddToCart}
            onCancel={handleInlineCancel}
            onViewChange={handleInlineViewChange}
            className="h-full" />

            </div> :

        <>
        {/* Main Categories - Hidden in search mode on mobile */}
        <div className={`relative flex flex-wrap items-center gap-1 md:gap-1.5 lg:gap-2 pr-10 md:pr-12 lg:pr-14 ${isSearchMode ? 'hidden md:flex' : ''}`}>
          {/* Desktop Search Button - Top Right Corner */}
          <div className="hidden md:flex absolute top-1 right-0 z-10 flex-col items-center gap-1">
            <button
                className="cursor-pointer"
                onClick={() => setIsDesktopSearchOpen(true)}>
              <img src={searchIcon} alt="Search" className="w-8 h-8 lg:w-9 lg:h-9" />
            </button>
            <AnimatedAIIcon size={20} onClick={() => setIsAIChatOpen(prev => !prev)} />
          </div>
          {/* Menu Controls Group */}
          {isMenuSelectOpen ? <div className="flex items-center gap-1 md:gap-1.5 lg:gap-2 bg-sidebar-accent rounded-full pl-1 pr-0.5 md:pl-1.5 md:pr-0.5 lg:pl-2 lg:pr-0.5 h-7 md:h-8 lg:h-9">
              <Button variant="ghost" size="icon" className="h-5 md:h-6 lg:h-7 w-5 md:w-6 lg:w-7 p-0" onClick={() => setIsMenuSelectOpen(!isMenuSelectOpen)}>
                <img src={burgerCloseIcon} alt="Close menu" className="w-4 md:w-5 lg:w-6 h-4 md:h-5 lg:h-6" />
              </Button>
              <Button variant="ghost" size="icon" className="h-5 md:h-6 lg:h-7 w-5 md:w-6 lg:w-7 p-0 bg-white hover:bg-white border border-white rounded-full" onClick={() => setHorizontalScrollMode(!horizontalScrollMode)} title={horizontalScrollMode ? "Show all subcategories" : "Enable horizontal scroll"}>
                {horizontalScrollMode ? <img src={horizontalScrollIcon} alt="Horizontal scroll" className="w-3 md:w-4 lg:w-5 h-3 md:h-4 lg:h-5" /> : <img src={verticalScrollIcon} alt="All view" className="w-3 md:w-4 lg:w-5 h-3 md:h-4 lg:h-5" />}
              </Button>
              <Button variant="ghost" size="icon" className="h-5 md:h-6 lg:h-7 w-5 md:w-6 lg:w-7 p-0 bg-white hover:bg-white border border-white rounded-full" onClick={() => setThumbnailViewMode(!thumbnailViewMode)} title={thumbnailViewMode ? "Show list view" : "Show thumbnail view"}>
                {thumbnailViewMode ? <img src={listViewIcon} alt="List view" className="w-3 md:w-4 lg:w-5 h-3 md:h-4 lg:h-5" /> : <img src={thumbnailViewIcon} alt="Thumbnail view" className="w-3 md:w-4 lg:w-5 h-3 md:h-4 lg:h-5" />}
              </Button>
              <Select value={selectedMenu} onValueChange={handleMenuSelect}>
                <SelectTrigger className="w-[100px] md:w-[110px] lg:w-[160px] rounded-full bg-neutral-700 hover:bg-neutral-600 border-neutral-700 text-white h-6 md:h-7 lg:h-8 text-[11px] md:text-xs lg:text-sm">
                  <SelectValue placeholder="Select Menu" />
                </SelectTrigger>
                <SelectContent className="bg-neutral-800 border-neutral-700">
                  {menuList.map((menu) => <SelectItem key={menu} value={menu} className="text-white hover:bg-neutral-700 focus:bg-neutral-700 focus:text-white">
                      {menu}
                    </SelectItem>)}
                </SelectContent>
              </Select>
            </div> : <Button variant="ghost" size="icon" className="h-7 md:h-8 lg:h-9 w-7 md:w-8 lg:w-9 p-0 hover:bg-transparent" onClick={() => setIsMenuSelectOpen(!isMenuSelectOpen)}>
              <img src={burgerOpenIcon} alt="Open menu" className="w-6 md:w-8 lg:w-9 h-6 md:h-8 lg:h-9" />
            </Button>}
          {/* Categories */}
          {(augmentedMenuCategories[selectedMenu] || []).map((cat) => <Button key={cat} variant={activeCategory === cat ? "default" : "outline"} className={`rounded-full px-2.5 md:px-4 lg:px-6 h-7 md:h-8 lg:h-9 text-[11px] md:text-xs lg:text-sm whitespace-nowrap border-2 ${activeCategory === cat ? `${getCategoryBgColor(cat)} ${getCategoryHoverBgColor(cat)} text-white ${getCategoryBorderColor(cat)}` : `bg-header text-header-foreground ${getCategoryBorderColor(cat)} hover:bg-header/80`}`} onClick={() => handleCategoryChange(cat)}>
              {cat}
            </Button>)}
        </div>

        <div className={`h-px bg-sidebar-border ${isSearchMode ? 'hidden md:block' : ''}`} />

        {/* Subcategories based on selected category - Hidden in search mode on mobile */}
        <div className={`overflow-x-auto scrollbar-hide ${horizontalScrollMode ? '' : 'max-h-[6rem] md:max-h-[7rem] lg:max-h-[8.5rem]'} ${isSearchMode ? 'hidden md:block' : ''}`}>
          <div className={`flex gap-1 md:gap-1.5 lg:gap-2 ${horizontalScrollMode ? 'flex-row flex-nowrap' : 'flex-row flex-wrap'}`}>
            {(mergedCategorySubcategories[activeCategory] || []).map((sub) => <Button key={sub} variant="outline" className={`rounded-md px-3 md:px-4 lg:px-6 h-7 md:h-7 lg:h-8 text-[11px] md:text-[10px] lg:text-xs whitespace-nowrap border ${activeSubcategory === sub ? `bg-black ${getCategoryTextColor(activeCategory)} ${getCategoryHoverTextColor(activeCategory)} ${getCategoryBorderColor(activeCategory)} font-semibold hover:bg-black` : `bg-black text-header-foreground ${getCategoryBorderColor(activeCategory)} hover:bg-black/80`}`} onClick={() => setActiveSubcategory(sub)}>
                {sub}
              </Button>)}
          </div>
        </div>

        <div className={`h-px bg-sidebar-border ${isSearchMode ? 'hidden md:block' : ''}`} />

        {/* Menu Items Grid */}
        <ScrollArea className="flex-1 [&>div>div]:!block [&_[data-radix-scroll-area-scrollbar]]:hidden">
          {(() => {
              // Get items based on selected menu, category, and subcategory
              let currentItems: MenuItem[] = [];

              // When there's a search query, always search across ALL menu items
              if (searchQuery.trim()) {
                currentItems = getAllMenuItems(selectedMenu, dynamicMenuItems);
              } else if (activeSubcategory) {
                currentItems = getMenuItems(selectedMenu, activeCategory, activeSubcategory, dynamicMenuItems);
              } else if (activeCategory) {
                currentItems = getAllCategoryItems(selectedMenu, activeCategory, dynamicMenuItems);
              } else {
                currentItems = getAllMenuItems(selectedMenu, dynamicMenuItems);
              }

              const hydratedItems = currentItems.map((item) => {
                const matchedDbProduct = dbProductsByNormalizedName.get(normalizeProductKey(item.name));
                if (!matchedDbProduct) return item;

                return {
                  ...item,
                  price: matchedDbProduct.price,
                  isOpenPrice: matchedDbProduct.price_type === 'open',
                  stock_count: matchedDbProduct.stock_count,
                  is_available: matchedDbProduct.is_available,
                };
              });

              const dedupedItems = Array.from(
                new Map(hydratedItems.map((item) => [normalizeProductKey(item.name), item])).values()
              );

              // Filter items based on search query
              const filteredItems = searchQuery.trim()
                ? dedupedItems.filter((item) => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
                : dedupedItems;
              return thumbnailViewMode ? <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-1 md:gap-1.5 lg:gap-2 pb-4 md:pb-0">
                {filteredItems.map((item, index) => {
                  const menuItem = item as MenuItem;
                  const hasStockCount = menuItem.stock_count !== null && menuItem.stock_count !== undefined;
                  const isOutOfStock = menuItem.is_available === false || (hasStockCount && menuItem.stock_count <= 0);
                  const showStockBadge = hasStockCount;
                  return <div key={item.id} className={`flex flex-col rounded-md overflow-hidden cursor-pointer group border border-neutral-700 relative ${isOutOfStock ? 'opacity-50 pointer-events-none' : ''}`}>
                    <div className="relative aspect-[2/1] md:aspect-square bg-neutral-800" onClick={() => openCustomizationDialog(item, index)}>
                      <img src={foodImages[index % foodImages.length]} alt={item.name} className="w-full h-full object-cover" />
                      <button onClick={(e) => {
                      e.stopPropagation();
                      addToCart(item);
                    }} className="absolute top-0.5 md:top-1 left-0.5 md:left-1 w-5 md:w-6 h-5 md:h-6 bg-orange-500 hover:bg-orange-600 rounded flex items-center justify-center transition-colors">
                        <Plus className="w-2.5 md:w-3 h-2.5 md:h-3 text-white" strokeWidth={3} />
                      </button>
                      {showStockBadge && <span className="absolute top-0.5 md:top-1 right-0.5 md:right-1 min-w-[20px] h-[20px] rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center px-1 z-20">{menuItem.stock_count}</span>}
                      {isOutOfStock && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <span className="text-[9px] md:text-[10px] font-bold text-destructive uppercase tracking-wider">Out of Stock</span>
                        </div>
                      )}
                    </div>
                    <div className="p-0.5 md:p-1 bg-neutral-900 flex flex-col gap-0.5" onClick={() => openCustomizationDialog(item, index)}>
                      <span className="text-[11px] md:text-xs font-medium text-white uppercase leading-tight line-clamp-1">
                        {item.name}
                      </span>
                      <div className="flex items-center justify-between gap-1">
                        {(item as MenuItem).isOpenPrice ? (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-orange-500/20 text-orange-400 border border-orange-500/30">Open Price</span>
                        ) : (
                          <span className="text-[10px] md:text-[11px] text-orange-400 font-semibold">${item.price.toFixed(2)}</span>
                        )}
                      </div>
                    </div>
                  </div>;
                })}
              </div> : <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1 md:gap-1.5 pb-4 md:pb-0">
                {filteredItems.map((item, index) => {
                  const menuItem = item as MenuItem;
                  const hasStockCount = menuItem.stock_count !== null && menuItem.stock_count !== undefined;
                  const isOutOfStock = menuItem.is_available === false || (hasStockCount && menuItem.stock_count <= 0);
                  const showStockBadge = hasStockCount;
                  return <div key={item.id} onClick={() => !isOutOfStock && openCustomizationDialog(item, index)} className={`flex items-stretch bg-sidebar-accent rounded-md overflow-hidden hover:bg-sidebar-accent/80 transition-colors cursor-pointer border border-sidebar-border h-[48px] md:h-[54px] relative ${isOutOfStock ? 'opacity-50 pointer-events-none' : ''}`}>
                    <div className="flex-1 p-1.5 md:p-2 bg-muted flex flex-col justify-center gap-0.5 min-w-0">
                      <div className="flex items-start justify-between gap-1.5">
                        <span className="text-[10px] md:text-[11px] font-bold leading-tight uppercase text-foreground line-clamp-2 min-w-0">
                          {item.name}
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          {showStockBadge && <span className="min-w-[18px] h-[18px] rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center px-1">{menuItem.stock_count}</span>}
                          <span className="text-[10px] md:text-[11px] text-foreground font-semibold whitespace-nowrap">
                            {(item as MenuItem).isOpenPrice && item.price === 0 ? "" : `$${item.price.toFixed(2)}`}
                          </span>
                        </div>
                      </div>
                      {(item as MenuItem).isOpenPrice && (
                        <span className="self-start px-1.5 py-0 rounded text-[8px] font-semibold bg-orange-500/20 text-orange-400 border border-orange-500/30 leading-relaxed">Open Price</span>
                      )}
                      {isOutOfStock && (
                        <span className="text-[8px] font-bold text-destructive uppercase">Out of Stock</span>
                      )}
                    </div>
                    <button onClick={(e) => {
                    e.stopPropagation();
                    addToCart(item);
                  }} className="w-7 md:w-9 text-white flex-shrink-0 flex items-center justify-center" style={{
                    background: 'linear-gradient(180deg, #FF9E65 0%, #FF5E00 100%)'
                  }}>
                      <Plus className="w-3 md:w-3.5 h-3 md:h-3.5" strokeWidth={3.5} />
                    </button>
                  </div>;
                })}
              </div>;
            })()}
        </ScrollArea>
        </>}
        
        {/* Desktop/Tablet Search Bar - At Bottom */}
        {isDesktopSearchOpen && <div className="hidden md:flex items-center gap-2 px-3 py-2.5 bg-neutral-900 border-t border-neutral-700 flex-shrink-0">
          <div className="flex-1 flex items-center gap-2 bg-neutral-800 rounded-lg px-3 py-2">
            <img src={searchIcon} alt="Search" className="w-4 h-4 flex-shrink-0" />
            <input type="text" placeholder="Search items..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="flex-1 bg-transparent text-white text-sm placeholder:text-neutral-500 outline-none" autoFocus />
            {searchQuery && <button onClick={() => setSearchQuery('')} className="p-0.5">
              <X className="w-4 h-4 text-neutral-400" />
            </button>}
          </div>
          <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full bg-neutral-700 hover:bg-neutral-600 p-0 flex-shrink-0" onClick={() => {
            setIsDesktopSearchOpen(false);
            setSearchQuery('');
          }}>
            <X className="w-4 h-4 text-white" />
          </Button>
        </div>}
        
        {/* Mobile Search Bar - At Bottom */}
        {isSearchMode && <div className="flex items-center gap-2 px-3 py-2.5 md:hidden bg-neutral-900 border-t border-neutral-700 flex-shrink-0">
          <div className="flex-1 flex items-center gap-2 bg-neutral-800 rounded-lg px-3 py-2">
            <img src={searchIcon} alt="Search" className="w-4 h-4 flex-shrink-0" />
            <input ref={searchInputRef} type="text" placeholder="Search items..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="flex-1 bg-transparent text-white text-sm placeholder:text-neutral-500 outline-none" autoFocus />
            {searchQuery && <button onClick={() => setSearchQuery('')} className="p-0.5">
              <X className="w-4 h-4 text-neutral-400" />
            </button>}
          </div>
          <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full bg-neutral-700 hover:bg-neutral-600 p-0 flex-shrink-0" onClick={() => {
            setIsSearchMode(false);
            setSearchQuery('');
            setMenuPosition('center');
          }}>
            <X className="w-4 h-4 text-white" />
          </Button>
        </div>}
      </div>

      {/* AI Chat Panel - Overlay on Menu Panel */}
      {isAIChatOpen && (
        <>
          
          <div className={`hidden md:flex absolute bottom-0 ${panelLayout === 'menu-right' ? 'left-0' : 'right-0'} z-40 ${isOrderActionsSidebarOpen ? 'w-[350px] lg:w-[415px]' : 'w-[280px] lg:w-[345px]'} pb-2 transition-all duration-300`} style={{ top: aiOverlayTop }}>
            <div className="w-full h-full rounded-lg overflow-hidden shadow-2xl border-l border-neutral-700">
              <OrderAIChatPanel
                onClose={() => setIsAIChatOpen(false)}
                orderContext={{
                  orderType,
                  guestName,
                  orderItems,
                  orderNotes,
                  availableProducts: dbProducts.map(p => ({ id: p.id, name: p.name, price: p.price, category_name: p.category_name })),
                }}
                menuData={{ menuList, menuCategories }}
                orderActions={{
                  addProduct: (name, price, quantity) => {
                    setOrderItems(prev => {
                      const existing = prev.find(o => o.name.toLowerCase() === name.toLowerCase() && (!o.modifiers || o.modifiers.length === 0));
                      if (existing) {
                        return prev.map(o => o.name.toLowerCase() === name.toLowerCase() && (!o.modifiers || o.modifiers.length === 0) ? { ...o, qty: o.qty + quantity } : o);
                      }
                      return [...prev, { id: Date.now(), qty: quantity, name, price }];
                    });
                  },
                  addProductWithModifiers: (name, price, quantity, modifiers, notes) => {
                    setOrderItems(prev => [...prev, {
                      id: Date.now(),
                      qty: quantity,
                      name,
                      price,
                      modifiers: modifiers.length > 0 ? modifiers : undefined,
                      notes: notes?.trim() ? notes.trim() : undefined,
                    }]);
                  },
                  removeProduct: (name) => {
                    setOrderItems(prev => prev.filter(o => o.name.toLowerCase() !== name.toLowerCase()));
                  },
                  updateQuantity: (name, quantity) => {
                    setOrderItems(prev => prev.map(o => o.name.toLowerCase() === name.toLowerCase() ? { ...o, qty: quantity } : o));
                  },
                  setOrderType: (type) => setOrderType(type),
                  setGuestName: (name) => {
                    setGuestName(name);
                    // Auto-trigger past order popup when AI sets a guest name
                    (async () => {
                      try {
                        const { data: guestRows } = await supabase
                          .from('guests')
                          .select('id,name,phone,email,order_count,last_order_date,loyalty,allergies,notes_general,notes_allergies')
                          .ilike('name', name)
                          .limit(1);
                        const dbGuest = guestRows?.[0];
                        if (dbGuest) {
                          if (dbGuest.phone) setGuestPhone(dbGuest.phone.replace(/\D/g, ''));
                          setIsGuestSelected(true);
                          if (dbGuest.order_count > 0) {
                            setPastOrderLoading(true);
                            const { data: orders } = await supabase
                              .from('orders')
                              .select('id,total,tip_amount')
                              .eq('guest_id', dbGuest.id)
                              .order('created_at', { ascending: false })
                              .limit(10);
                            const totalSpent = orders?.reduce((s, o) => s + (o.total || 0), 0) || 0;
                            const totalTips = orders?.reduce((s, o) => s + (o.tip_amount || 0), 0) || 0;
                            const allergies: string[] = [];
                            if (dbGuest.allergies && Array.isArray(dbGuest.allergies) && dbGuest.allergies.length > 0) allergies.push(...dbGuest.allergies);
                            const notesAllergies = dbGuest.notes_allergies?.trim();
                            if (notesAllergies && !allergies.includes(notesAllergies)) allergies.push(notesAllergies);
                            setPastOrderGuest({
                              id: dbGuest.id, name: dbGuest.name,
                              phone: dbGuest.phone || undefined, email: dbGuest.email || undefined,
                              orderCount: dbGuest.order_count, lastOrderDate: dbGuest.last_order_date || undefined,
                              loyaltyTier: dbGuest.loyalty || undefined, totalSpent, totalTips,
                              allergies: allergies.length > 0 ? allergies : undefined,
                              notes: dbGuest.notes_general?.trim() || undefined,
                            });
                            const recentOrderIds = (orders || []).slice(0, 3).map(o => o.id);
                            if (recentOrderIds.length > 0) {
                              const { data: items } = await supabase
                                .from('order_items')
                                .select('id,item_name,quantity,unit_price,total_price,category')
                                .in('order_id', recentOrderIds);
                              if (items && items.length > 0) {
                                const pastItems: GuestPastItem[] = items.map(item => {
                                  const currentProduct = dbProducts.find(p => p.name.toLowerCase() === item.item_name.toLowerCase());
                                  return { id: item.id, name: item.item_name, quantity: item.quantity, price: currentProduct ? currentProduct.price : item.unit_price, originalPrice: currentProduct && currentProduct.price !== item.unit_price ? item.unit_price : undefined, category: item.category || undefined, isAvailable: currentProduct ? currentProduct.is_available : false, isComped: item.unit_price === 0 };
                                });
                                const seen = new Map<string, GuestPastItem>();
                                for (const pi of pastItems) { if (!seen.has(pi.name.toLowerCase())) seen.set(pi.name.toLowerCase(), pi); }
                                setPastOrderItems(Array.from(seen.values()));
                              } else { setPastOrderItems([]); }
                            } else { setPastOrderItems([]); }
                            setPastOrderLoading(false);
                          }
                        }
                      } catch (err) { console.error('AI guest past order lookup failed:', err); }
                    })();
                  },
                  setGuestPhone: (phone) => {
                    const clean = phone.replace(/\D/g, '');
                    setGuestPhone(clean);
                  },
                  clearOrder: () => handleClearOrder(),
                  setOrderNotes: (notes) => setOrderNotes(notes),
                  openPayment: () => {
                    if (requireOrderType && !orderType) {
                      toast.error("Please select an order type before charging");
                      return;
                    }
                    if (requireGuestName && !guestName.trim()) {
                      toast.error("Please enter a guest name before charging");
                      return;
                    }
                    setShowPaymentDialog(true);
                  },
                }}
              />
            </div>
          </div>
        </>
      )}
      </div>

      {/* Right Panel - Order (Desktop only) */}
      <div className={`hidden md:flex ${isOrderActionsSidebarOpen ? 'w-[350px] lg:w-[415px]' : 'w-[280px] lg:w-[345px]'} overflow-hidden flex-shrink-0 pb-2 pr-2 gap-0 transition-all duration-300 ${panelLayout === 'menu-right' ? 'md:order-1' : 'md:order-2'}`}>
        {/* Order Panel Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Order Header - Outside background container */}
          <div className="px-1 pb-2 flex-shrink-0">
            <div className="flex items-center text-xs mb-2 gap-2">
              <div className="relative flex-1">
                <input ref={guestInputRef} type="text" value={guestName} onChange={(e) => setGuestName(e.target.value)} placeholder="GUEST NAME" className="bg-transparent outline-none placeholder:text-[#808080] w-full min-w-0 font-medium text-[#808080]" />
                {showGuestDropdown && filteredGuests.length > 0 && <div ref={guestDropdownRef} className="absolute top-full left-0 mt-1 bg-neutral-700 rounded-xl shadow-xl border border-neutral-600 z-50 min-w-[220px] py-1 overflow-hidden">
                    {filteredGuests.map((guest) => <button key={guest.id} onClick={() => selectGuest(guest)} className="w-full flex items-center gap-3 px-3 py-2 hover:bg-neutral-600 transition-colors text-left">
                        {guest.avatar ? <img src={guest.avatar} alt={guest.name} className="w-10 h-10 rounded-full object-cover" /> : <div className="w-10 h-10 rounded-full bg-neutral-500 flex items-center justify-center text-white font-semibold text-sm">
                            {guest.initials}
                          </div>}
                        <div className="flex flex-col">
                          <span className="text-white font-medium text-sm">{guest.name}</span>
                          <span className="text-neutral-400 text-xs">{guest.phone}</span>
                        </div>
                      </button>)}
                  </div>}
              </div>
              <div className="relative flex items-center gap-0.5 flex-shrink-0">
                <img src={phoneIcon} alt="Phone" className="w-3 h-3" />
                <input ref={phoneInputRef} type="tel" inputMode="tel" value={formatPhoneNumber(guestPhone)} onChange={(e) => setGuestPhone(e.target.value.replace(/\D/g, ''))} placeholder="(XXX) XXX-XXXX" className="bg-transparent outline-none placeholder:text-[#808080] w-28 min-w-0 text-[#808080] text-xs" />
                {showPhoneDropdown && filteredByPhone.length > 0 && <div ref={phoneDropdownRef} className="absolute top-full left-0 mt-1 bg-neutral-700 rounded-xl shadow-xl border border-neutral-600 z-50 min-w-[220px] py-1 overflow-hidden">
                    {filteredByPhone.map((guest) => <button key={guest.id} onClick={() => selectGuest(guest)} className="w-full flex items-center gap-3 px-3 py-2 hover:bg-neutral-600 transition-colors text-left">
                        {guest.avatar ? <img src={guest.avatar} alt={guest.name} className="w-10 h-10 rounded-full object-cover" /> : <div className="w-10 h-10 rounded-full bg-neutral-500 flex items-center justify-center text-white font-semibold text-sm">
                            {guest.initials}
                          </div>}
                        <div className="flex flex-col">
                          <span className="text-white font-medium text-sm">{guest.name}</span>
                          <span className="text-neutral-400 text-xs">{guest.phone}</span>
                        </div>
                      </button>)}
                  </div>}
              </div>
              <div className="flex items-center gap-1 whitespace-nowrap flex-shrink-0">
                <img src={timeIcon} alt="Time" className="w-3 h-3" />
                <span className="text-white text-[10px]">{arrivedAt}</span>
                <DraggablePanelHandle panelId="order" className="flex-shrink-0" />
              </div>
            </div>
            
            <div className="flex items-center gap-1.5 mb-2">
              <div className="flex items-center justify-between flex-1 overflow-x-auto scrollbar-hide gap-1.5">
                <Button
                variant="secondary"
                size="sm"
                className="text-[10px] rounded-[10px] bg-[#666666] hover:bg-[#666666] border border-sidebar-border h-6 px-3 whitespace-nowrap flex-1 gap-1.5"
                onClick={toggleCustomItemPanel}>

                  <img src={showCustomItemPanel ? menuIcon : customItemIcon} alt="" className="w-3 h-3" />
                  {showCustomItemPanel ? "Menu" : "Custom Item"}
                </Button>
                <Button
                 variant="secondary"
                 size="sm"
                 className={`text-[10px] rounded-[10px] ${selectedDiscounts.length > 0 ? 'bg-primary/30 border-primary text-primary' : 'bg-[#666666] border-sidebar-border'} hover:bg-[#666666] border h-6 px-3 whitespace-nowrap flex-1 gap-1.5`}
                 onClick={() => setShowDiscountMpin(true)}>

                   <img src={discountBtnIcon} alt="" className="w-3 h-3" />
                   Discount {selectedDiscounts.length > 0 && `(${selectedDiscounts.length})`}
                 </Button>
                <Button
                variant="secondary"
                size="sm"
                className={`text-[10px] rounded-[10px] ${isTaxExempt ? 'bg-orange-500/20 border-orange-500' : 'bg-[#666666] border-sidebar-border'} hover:bg-[#666666] border h-6 px-3 whitespace-nowrap flex-1 gap-1.5`}
                onClick={() => isTaxExempt ? setIsTaxExempt(false) : setShowNoTaxDialog(true)}>

                  <img src={noTaxBtnIcon} alt="" className="w-3 h-3" />
                  No Tax
                </Button>
                <Button variant="secondary" size="sm" className="text-[10px] rounded-[10px] bg-[#666666] hover:bg-[#666666] border border-sidebar-border h-6 px-3 whitespace-nowrap flex-1 gap-1.5">
                   <img src={registerBtnIcon} alt="" className="w-3 h-3" />
                   No Sale
                 </Button>
                {pastOrderItems.length > 0 && isGuestSelected && (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="text-[10px] rounded-[10px] bg-blue-600/30 border-blue-500 hover:bg-blue-600/40 border h-6 px-3 whitespace-nowrap flex-1 gap-1.5"
                    onClick={() => {
                      const availableItems = pastOrderItems.filter(i => i.isAvailable !== false);
                      if (availableItems.length === 0) {
                        toast.error("No available products from past order");
                        return;
                      }
                      setOrderItems(prev => {
                        let updated = [...prev];
                        for (const item of availableItems) {
                          const existing = updated.find(o => o.name.toLowerCase() === item.name.toLowerCase() && (!o.modifiers || o.modifiers.length === 0));
                          if (existing) {
                            updated = updated.map(o => o.id === existing.id ? { ...o, qty: o.qty + item.quantity } : o);
                          } else {
                            updated = [...updated, { id: Date.now() + Math.random(), qty: item.quantity, name: item.name, price: item.price }];
                          }
                        }
                        return updated;
                      });
                      toast.success(`Past order: ${availableItems.length} product${availableItems.length > 1 ? 's' : ''} added`);
                    }}
                  >
                    <RotateCcw className="w-3 h-3" />
                    Past Order
                  </Button>
                )}
              </div>
              <Button
              variant="secondary"
              size="icon"
              className="h-6 w-6 rounded-[10px] bg-[#666666] hover:bg-[#666666] border border-sidebar-border flex-shrink-0"
              onClick={() => setIsOrderActionsSidebarOpen(!isOrderActionsSidebarOpen)}>

                {isOrderActionsSidebarOpen ? <X className="w-3 h-3" /> : <MoreVertical className="w-3 h-3" />}
              </Button>
            </div>
          </div>

          {/* Order Content Area with Sidebar */}
          <div ref={orderContentStartRef} className="flex-1 flex gap-2 min-h-0">
            {/* Background Container for Order Content */}
            <div className="flex-1 flex flex-col rounded-lg overflow-hidden min-h-0 relative" style={{
            background: '#7575754D',
            boxShadow: 'inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)'
          }}>
              {/* Add Guest Form Overlay */}
              {showAddGuestForm &&
            <div className="absolute inset-0 z-10 bg-background">
                  <AddGuestForm
                onClose={() => setShowAddGuestForm(false)}
                onSave={(guestData) => {
                  setGuestName(`${guestData.firstName} ${guestData.lastName}`);
                  setGuestPhone(guestData.phoneNumber);
                  setShowAddGuestForm(false);
                }}
                compact />

                </div>
            }
              {/* Create Voucher Form Overlay */}
              {showCreateVoucherForm &&
            <div className="absolute inset-0 z-10 bg-background">
                  <CreateVoucherForm
                onClose={() => setShowCreateVoucherForm(false)}
                onCreate={(voucherData) => {
                  toast.success("Voucher created successfully!");
                  setShowCreateVoucherForm(false);
                }} />
                </div>
            }
              {/* Order Type & Guest Info */}
              {isTableOrder ?
            <>
                  {/* Table Order Header - Row 1 */}
                  <div className="flex items-center justify-between px-2 py-2 border-b border-sidebar-border">
                    <div className="flex items-center gap-2">
                      <span className="bg-neutral-700 border border-neutral-600 px-2 py-1 rounded text-xs font-medium text-white">
                        TABLE {tableIdFromParams}
                      </span>
                      <Users className="w-4 h-4 text-neutral-400" />
                      <span className="text-neutral-400 text-xs">Available Seats {totalSeats}</span>
                      <span className="font-bold text-white text-sm">{guestCount}</span>
                      <span className="font-bold text-white text-sm">{orderNumber}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <img src={runnerIcon} alt="Server" className="w-4 h-4 opacity-80" />
                      <span className="text-neutral-400">{currentServerName}</span>
                    </div>
                  </div>
                  {/* Table Order Header - Row 2: Select seats */}
                  {!SettingsManager.getControlCenterSettings().hideSeatSelector && (
                  <div className="flex items-center gap-1.5 px-2 py-1.5 border-b border-sidebar-border" role="group" aria-label="Select seats">
                    <span className="text-neutral-500 text-xs mr-0.5 self-center shrink-0">Select seats</span>
                    <button type="button" className="p-1 bg-neutral-700 rounded hover:bg-neutral-600 transition-colors" aria-label="Chair">
                      <img src={chairWhiteIcon} alt="Chair" className="w-3.5 h-3.5" />
                    </button>
                    <button
                  onClick={() => toggleSeatFilter('all')}
                  className={`p-1 rounded transition-colors ${
                  seatFilter.includes('all') ?
                  'bg-white' :
                  'bg-neutral-700 hover:bg-neutral-600'}`
                  }>

                      <Share2 className={`w-3.5 h-3.5 ${seatFilter.includes('all') ? 'text-black' : 'text-white'}`} />
                    </button>
                    {Array.from({ length: guestCount }).map((_, i) =>
                <button
                  key={i}
                  onClick={() => toggleSeatFilter(i + 1)}
                  className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold transition-colors ${
                  seatFilter.includes(i + 1) ?
                  'bg-white text-black' :
                  'bg-neutral-600 text-white hover:bg-neutral-500'}`
                  }>

                        {i + 1}
                      </button>
                )}
                  </div>
                  )}
                </> :

            <div className="flex items-center justify-between px-2 py-2 border-b border-sidebar-border">
                  <div className="flex items-center gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="flex items-center gap-1.5 text-xs font-medium bg-neutral-700 hover:bg-neutral-600 px-3 py-1.5 rounded transition-colors">
                          {orderType ? (
                            <>
                              <img src={orderTypes.find((t) => t.label === orderType)?.icon} alt="" className="w-4 h-4" />
                              {orderType}
                            </>
                          ) : (
                            <span className="text-neutral-400">Select Type</span>
                          )}
                          <ChevronDown className="w-3 h-3" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="bg-neutral-800 border-neutral-700 min-w-[140px]">
                        {orderTypes.map((type) => <DropdownMenuItem key={type.label} onClick={() => {
                      setOrderType(type.label);
                      openFormForType(type.label);
                    }} className="text-white hover:bg-neutral-700 cursor-pointer flex items-center gap-2">
                            <img src={type.icon} alt="" className="w-4 h-4" />
                            {type.label}
                          </DropdownMenuItem>)}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    {orderItems.length > 0 && <span className="bg-sidebar-accent px-2 py-0.5 rounded text-base font-bold">20</span>}
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                  <img src={runnerIcon} alt="Server" className="w-4 h-4 opacity-80" />
                    <span>{currentServerName}</span>
                  </div>
                </div>
            }

              {/* Dine In Guest Form */}
              {orderType === "DINE IN" && showDineInForm ?
            <DineInGuestForm
              onSave={(data) => {
                setDineInGuestData(data);
                setGuestName(data.guestName);
                setGuestPhone(data.phoneNumber);
                setShowDineInForm(false);
              }}
              onClose={() => setShowDineInForm(false)}
              initialData={dineInGuestData} /> :

            orderType === "TAKE OUT" && showTakeOutForm ?
            <TakeOutGuestForm
              onSave={(data) => {
                setTakeOutGuestData(data);
                setGuestName(data.guestName);
                setGuestPhone(data.phoneNumber);
                setShowTakeOutForm(false);
              }}
              onClose={() => setShowTakeOutForm(false)}
              initialData={takeOutGuestData} /> :

            orderType === "DELIVERY" && showDeliveryForm ?
            <DeliveryGuestForm
              onSave={(data) => {
                setDeliveryGuestData(data);
                setGuestName(data.guestName);
                setGuestPhone(data.phoneNumber);
                setShowDeliveryForm(false);
              }}
              onClose={() => setShowDeliveryForm(false)}
              initialData={deliveryGuestData} /> :

            orderType === "BANQUET" && showBanquetForm ?
            <BanquetGuestForm
              onSave={(data) => {
                setBanquetGuestData(data);
                setGuestName(data.guestName);
                setGuestPhone(data.phoneNumber);
                setShowBanquetForm(false);
              }}
              onClose={() => setShowBanquetForm(false)}
              initialData={banquetGuestData} /> :

            orderType === "DRIVE THRU" && showDriveThruForm ?
            <DriveThruGuestForm
              onSave={(data) => {
                setDriveThruGuestData(data);
                setGuestName(data.guestName);
                setGuestPhone(data.phoneNumber);
                setShowDriveThruForm(false);
              }}
              onClose={() => setShowDriveThruForm(false)}
              initialData={driveThruGuestData} /> :

            orderType === "CURB SIDE" && showCurbSideForm ?
            <CurbSideGuestForm
              onSave={(data) => {
                setCurbSideGuestData(data);
                setGuestName(data.guestName);
                setGuestPhone(data.phoneNumber);
                setShowCurbSideForm(false);
              }}
              onClose={() => setShowCurbSideForm(false)}
              initialData={curbSideGuestData} /> :

            orderType === "SCHEDULED" && showScheduledForm ?
            <ScheduledGuestForm
              onSave={(data) => {
                setScheduledGuestData(data);
                setGuestName(data.guestName);
                setGuestPhone(data.phoneNumber);
                setShowScheduledForm(false);
              }}
              onClose={() => setShowScheduledForm(false)}
              initialData={scheduledGuestData} /> :

            orderType === "PHONE-IN" && showPhoneInForm ?
            <PhoneInGuestForm
              onSave={(data) => {
                setPhoneInGuestData(data);
                setGuestName(data.guestName);
                setGuestPhone(data.phoneNumber);
                setShowPhoneInForm(false);
              }}
              onClose={() => setShowPhoneInForm(false)}
              initialData={phoneInGuestData} /> :

            orderType === "CUSTOM" && showCustomOrderForm ?
            <CustomOrderGuestForm
              onSave={(data) => {
                setCustomOrderGuestData(data);
                setGuestName(data.guestName);
                setGuestPhone(data.phoneNumber);
                setShowCustomOrderForm(false);
              }}
              onClose={() => setShowCustomOrderForm(false)}
              initialData={customOrderGuestData} /> :


            <>

                  {/* Order Notes - only show when cart has products */}
                  {orderItems.length > 0 && (
                  <div className="px-2 py-1.5 border-b border-sidebar-border flex-shrink-0">
                    <OrderNotesAutocomplete
                  value={orderNotes}
                  onChange={setOrderNotes}
                  placeholder="Order notes" />

                  </div>
                  )}
                  {transferNewMode &&
              <div className="px-3 py-1.5 border-b border-sidebar-border flex items-center gap-2 flex-shrink-0">
                      <img src={transferIconPng} alt="Transferred" className="w-4 h-4 opacity-70" />
                      <span className="text-xs font-medium" style={{ color: '#8AC4FF' }}>
                        Transferred from Order {searchParams.get('transferFrom')} · Table {searchParams.get('transferFromTable')?.replace('T', '')}
                      </span>
                    </div>
              }

                  {/* Order Items */}
                  <ScrollArea key={`desktop-scroll-${clearCounter}`} className="flex-1 min-h-0 px-2">
                    {orderItems.length === 0 ? <div className="flex flex-col items-center justify-center h-full py-8">
                        <img src={emptyOrderIcon} alt="Empty order" className="w-16 h-16 opacity-50 mb-3" />
                        <span className="text-muted-foreground text-sm">Let's create an order</span>
                      </div> : <div className="py-1 space-y-1 md:space-y-1 lg:space-y-2">
                        {(isTableOrder ? filteredOrderItems : orderItems).map((item, index) => <SwipeableCartItem key={item.id} onDelete={() => removeFromCart(item.id)} onNoTax={() => handleToggleItemNoTax(item.id)} isNoTax={item.noTax || false} onFire={() => handleToggleItemFire(item.id)} isFired={item.isFired || false} itemOrderType={item.itemOrderType || "Dine In"} onOrderTypeChange={(type) => updateItemOrderType(item.id, type)} isOpen={activeSwipedItemId === item.id} onSwipeStart={() => setActiveSwipedItemId(item.id)}>
                            <div
                      className={`p-2 md:p-1.5 lg:p-3 border rounded-md md:rounded lg:rounded-lg cursor-pointer ${item.isTransferred ? 'border-[#3B6A9E] bg-accent' : 'border-sidebar-border bg-muted'}`}
                      onClick={() => openCustomizationDialog({ id: item.id, name: item.name, price: item.price }, index)}>

                              <div className="flex flex-col">
                                {/* Item header row */}
                                <div className="flex items-start gap-2 md:gap-1.5 lg:gap-3">
                                  <span className={`w-6 h-6 md:w-5 md:h-5 lg:w-6 lg:h-6 rounded text-white text-xs md:text-[10px] lg:text-xs font-medium flex items-center justify-center flex-shrink-0 ${item.isTransferred ? 'bg-[#3B6A9E]' : 'bg-neutral-700 border border-neutral-600'}`}>
                                    {item.qty}
                                  </span>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm md:text-xs lg:text-sm font-medium text-foreground flex items-center gap-1.5 flex-wrap">
                                        {item.name}
                                        {item.isOpenPrice && (
                                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-orange-500/20 text-orange-400 border border-orange-500/30">Open Price</span>
                                        )}
                                      </span>
                                      {item.itemOrderType === 'VOUCHER' ?
                              <span
                                className="text-sm md:text-xs lg:text-sm font-medium text-foreground cursor-pointer transition-colors ml-2"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePriceClick({ id: item.id, name: item.name, price: item.price }, foodImages[index % foodImages.length]);
                                }}>

                                          ${item.price.toFixed(2)}
                                        </span> :
                              item.noTax ?
                              <span
                                className="text-sm md:text-xs lg:text-sm font-medium flex items-center gap-1.5 ml-2 cursor-pointer transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePriceClick({ id: item.id, name: item.name, price: item.price }, foodImages[index % foodImages.length]);
                                }}>

                                          <span className="line-through text-white/40">${(item.price * (1 + taxRate)).toFixed(2)}</span>
                                          <span className="text-green-400">${item.price.toFixed(2)}</span>
                                        </span> :

                              <span
                                className="text-sm md:text-xs lg:text-sm font-medium text-foreground hover:text-primary cursor-pointer transition-colors ml-2"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePriceClick({ id: item.id, name: item.name, price: item.price }, foodImages[index % foodImages.length]);
                                }}>

                                          ${item.price.toFixed(2)}
                                        </span>
                              }
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Modifiers with tree hierarchy */}
                                {item.modifiers && item.modifiers.length > 0 && (() => {
                          const displayedModifiers = expandedCartItems.has(item.id) ? item.modifiers : item.modifiers.slice(0, 2);
                          const hasShowButton = item.modifiers.length > 2;

                          return (
                            <div className="ml-3 mt-1 relative">
                                      {displayedModifiers.map((mod, idx) => {
                                const isAddOn = mod.startsWith("Add:");
                                const isRemoval = mod.startsWith("No ") || mod.startsWith("-");
                                const displayMod = isAddOn ? mod.replace("Add: ", "") : mod;
                                const isLastItem = !hasShowButton && idx === displayedModifiers.length - 1;

                                return (
                                  <div key={idx} className="relative flex items-center text-xs md:text-[10px] lg:text-xs py-[3px]">
                                            {/* Vertical line - only show if not last item */}
                                            {!isLastItem &&
                                    <div className="absolute left-0 top-1/2 bottom-0 w-px bg-white" style={{ height: '100%' }} />
                                    }
                                            {/* Vertical line segment to connect to horizontal */}
                                            <div className="absolute left-0 top-0 h-1/2 w-px bg-white" />
                                            {/* Horizontal connector */}
                                            <div className="absolute left-0 top-1/2 w-3 h-px bg-white" />
                                            {/* Content */}
                                            <div className="flex items-center gap-2 ml-5">
                                              <span className="text-white">
                                                {isAddOn ? '+' : isRemoval ? '-' : '•'}
                                              </span>
                                              <span className={`text-white ${isRemoval ? 'line-through' : ''}`}>
                                                {displayMod}
                                              </span>
                                            </div>
                                          </div>);

                              })}
                                      {hasShowButton &&
                              <div className="relative flex items-center py-[3px]">
                                          {/* Vertical line segment to connect to horizontal (this is the last item) */}
                                          <div className="absolute left-0 top-0 h-1/2 w-px bg-white" />
                                          {/* Horizontal connector */}
                                          <div className="absolute left-0 top-1/2 w-3 h-px bg-white" />
                                          <button
                                  className="text-xs text-white/60 hover:text-white ml-5"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setExpandedCartItems((prev) => {
                                      const newSet = new Set(prev);
                                      if (newSet.has(item.id)) {
                                        newSet.delete(item.id);
                                      } else {
                                        newSet.add(item.id);
                                      }
                                      return newSet;
                                    });
                                  }}>

                                            {expandedCartItems.has(item.id) ? 'Show less' : `Show more (+${item.modifiers.length - 2})`}
                                          </button>
                                        </div>
                              }
                                    </div>);

                        })()}
                                
                                {/* Item Notes Display - Desktop/Tablet */}
                                {item.notes &&
                        <div className="ml-3 mt-1 relative">
                                    <div className="relative flex items-center text-xs md:text-[10px] lg:text-xs py-[3px]">
                                      {/* Vertical line segment to connect to horizontal */}
                                      <div className="absolute left-0 top-0 h-1/2 w-px bg-white" />
                                      {/* Horizontal connector */}
                                      <div className="absolute left-0 top-1/2 w-3 h-px bg-white" />
                                      {/* Content */}
                                      <div className="flex items-center gap-2 ml-5">
                                        <span className="text-white">📝</span>
                                        <span className="text-white italic">{item.notes}</span>
                                      </div>
                                    </div>
                                  </div>
                        }
                                
                                {/* Item Discount Display - Desktop/Tablet */}
                                {item.discountName && item.discountAmount && item.discountAmount > 0 &&
                        <div className="ml-3 mt-1 relative">
                                    <div className="relative flex items-center text-xs md:text-[10px] lg:text-xs py-[3px]">
                                      {/* Vertical line segment to connect to horizontal */}
                                      <div className="absolute left-0 top-0 h-1/2 w-px bg-white" />
                                      {/* Horizontal connector */}
                                      <div className="absolute left-0 top-1/2 w-3 h-px bg-white" />
                                      {/* Content */}
                                      <div className="flex items-center gap-2 ml-5">
                                        <Tag className="w-3 h-3 text-white" />
                                        <span className="text-white">{item.discountName} (-${item.discountAmount.toFixed(2)})</span>
                                      </div>
                                    </div>
                                  </div>
                        }
                                
                                {/* No Tax Added Display for Vouchers - Desktop/Tablet */}
                                {item.itemOrderType === 'VOUCHER' &&
                        <div className="ml-3 mt-1 relative">
                                    <div className="relative flex items-center text-xs md:text-[10px] lg:text-xs py-[3px]">
                                      {/* Vertical line segment to connect to horizontal */}
                                      <div className="absolute left-0 top-0 h-1/2 w-px bg-white" />
                                      {/* Horizontal connector */}
                                      <div className="absolute left-0 top-1/2 w-3 h-px bg-white" />
                                      {/* Content */}
                                      <div className="flex items-center gap-2 ml-5">
                                        <span className="text-white/60 italic">No tax added</span>
                                      </div>
                                    </div>
                                  </div>
                        }
                                
                                {/* Seat Assignment Display - Desktop/Tablet */}
                                {isTableOrder && item.assignedSeats && item.assignedSeats.length > 0 &&
                        <div className="mt-1.5 md:mt-1 lg:mt-2 flex items-center gap-1.5 ml-8">
                                    <img src={chairWhiteIcon} alt="Seats" className="w-4 h-4 opacity-70" />
                                    {item.assignedSeats.length === guestCount ?
                          <span className="w-5 h-5 rounded bg-neutral-700 text-white flex items-center justify-center">
                                        <Share2 className="w-3 h-3" />
                                      </span> :

                          item.assignedSeats.map((seat) =>
                          <span
                            key={seat}
                            className="w-5 h-5 rounded bg-neutral-700 text-white text-[10px] font-medium flex items-center justify-center">

                                          {seat}
                                        </span>
                          )
                          }
                                  </div>
                        }
                              </div>
                            </div>
                          </SwipeableCartItem>)}
                      </div>}
                  </ScrollArea>

                  {/* Split Order Warning */}
                  {isOrderSplit && orderItems.length > 0 &&
              <div className="px-2 py-2">
                      <div className="bg-amber-500/20 border border-amber-500/30 rounded-lg px-3 py-2">
                        <p className="text-amber-400 text-xs leading-relaxed">
                          This check has been split. Re-merge this ticket if you want to fire it or add products to it.
                        </p>
                      </div>
                    </div>
              }

                  {/* Order Summary - Only show when cart has items */}
                  {orderItems.length > 0 &&
              <div className="p-2 border-t border-sidebar-border flex-shrink-0">
                <div className="text-xs rounded px-2 py-1.5 space-y-0.5" style={{
                  background: '#7575754D',
                  boxShadow: 'inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)'
                }}>
                  <div className="flex justify-between gap-3">
                    <span className="text-foreground">Sub Total: <span className="font-medium">${subtotal.toFixed(2)}</span></span>
                    <span className="text-foreground">Tax: <span className="font-medium">${tax.toFixed(2)}</span></span>
                  </div>
                  {(discount > 0 || serviceCharge > 0) && (
                  <div className="flex justify-between gap-3">
                    {discount > 0 && (
                    <span className="text-white flex items-center gap-1 group relative">
                      Discount: <span className="font-medium">${discount.toFixed(2)}</span>
                      {selectedDiscounts.length > 0 && (
                        <>
                          <button
                            onClick={() => setSelectedDiscounts([])}
                            className="text-white hover:text-white/80 text-xs font-bold ml-0.5">
                              ×
                          </button>
                          <span className="absolute left-0 -top-7 bg-black/90 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                            {selectedDiscounts.map(d => d.name).join(', ')}
                          </span>
                        </>
                      )}
                    </span>
                    )}
                    {serviceCharge > 0 && (
                    <span className="text-foreground flex items-center gap-1 group relative">
                      Service Charge: <span className="font-medium text-primary">+${serviceCharge.toFixed(2)}</span>
                      <button
                        onClick={() => {
                          setAppliedServiceCharge(0);
                          setAppliedServiceChargeName('');
                        }}
                        className="text-red-500 hover:text-red-400 text-xs font-bold ml-0.5">
                          ×
                      </button>
                      {appliedServiceChargeName && (
                        <span className="absolute left-0 -top-7 bg-black/90 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                          {appliedServiceChargeName}
                        </span>
                      )}
                    </span>
                    )}
                  </div>
                  )}
                  {appliedGiftCardAmount > 0 &&
                  <div className="flex justify-between gap-3 pt-1 border-t border-white/10">
                      <span className="text-green-500">Gift Card: <span className="font-medium">-${appliedGiftCardAmount.toFixed(2)}</span></span>
                    </div>
                  }
                  {appliedVoucherAmount > 0 &&
                  <div className="flex justify-between gap-3">
                      <span className="text-foreground flex items-center gap-1">
                        Voucher ({voucherCode}): <span className="font-medium">-${appliedVoucherAmount.toFixed(2)}</span>
                        <button
                        onClick={() => {
                          setAppliedVoucherAmount(0);
                          setVoucherCode('');
                        }}
                        className="text-red-500 hover:text-red-400 text-xs font-bold ml-0.5">

                          ×
                        </button>
                      </span>
                    </div>
                  }
                </div>

                {/* Action Buttons - Inside background container */}
                <div className="px-2 py-2 flex items-center gap-3 flex-shrink-0">
                  <button onClick={handleClearOrderAttempt} className="w-8 h-8 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center flex-shrink-0">
                    <img src={clearCIcon} alt="Cancel" className="w-3 h-3" />
                  </button>
                  {showSaveButton && (
                  <button className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{
                    backgroundColor: '#C9C9C9'
                  }}>
                    <img src={saveIcon} alt="Save" className="w-4 h-4" />
                  </button>
                  )}
                  <button
                    onClick={handleFireOrder}
                    disabled={isOrderSplit || orderItems.length === 0 || orderItems.every(i => i.isFired)}
                    className={`flex-1 h-8 rounded-full flex items-center justify-center gap-1.5 ${
                    isOrderSplit || orderItems.length === 0 || orderItems.every(i => i.isFired) ? 'opacity-50 cursor-not-allowed' : ''}`
                    }
                    style={{
                      background: 'linear-gradient(180deg, #FF9E65 0%, #FF5E00 100%)'
                    }}>

                    <img src={fireIcon} alt="Fire" className="w-4 h-4" />
                    <span className="text-white font-semibold text-sm">FIRE</span>
                  </button>
                  <button
                    onClick={() => {
                      if (requireOrderType && !orderType) {
                        toast.error("Please select an order type before charging");
                        return;
                      }
                      if (requireGuestName && !guestName.trim()) {
                        toast.error("Please enter a guest name before charging");
                        return;
                      }
                      setShowPaymentDialog(true);
                    }}
                    className="flex-1 h-8 rounded-full flex items-center justify-center"
                    style={{
                      background: 'linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)'
                    }}>

                    <span className="text-black font-semibold text-xs">
                      CHARGE ${chargeAmount.toFixed(2)}{chargeLabel && ` (${chargeLabel})`}
                    </span>
                  </button>
                </div>
              </div>
              }
                </>
            }
            </div>

            {/* Right Side Actions Sidebar */}
            {isOrderActionsSidebarOpen && !showCreateVoucherForm &&
          <div className="w-[70px] flex flex-col flex-shrink-0 animate-slide-in-right">
                <div className="flex-1 flex flex-col rounded-2xl p-1.5 gap-1" style={{
              background: '#7575754D',
              boxShadow: 'inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)'
            }}>
                  {/* Transfer Check - Only show when items in cart */}
                  {orderItems.length > 0 &&
              <button
                onClick={() => setShowTransferCheckDialog(true)}
                className="flex-1 flex flex-col items-center justify-center gap-1 rounded-xl hover:bg-sidebar-accent transition-colors">

                      <img src={transferCheckIcon} alt="" className="w-5 h-5" />
                      <span className="text-[9px] text-white text-center leading-tight">Transfer<br />Check</span>
                    </button>
              }
                  {/* Action Buttons */}
                  <button
                onClick={() => setShowGiftCardDialog(true)}
                className="flex-1 flex flex-col items-center justify-center gap-1 rounded-xl hover:bg-sidebar-accent transition-colors">

                    <img src={giftCardBtnIcon} alt="" className="w-5 h-5" />
                    <span className="text-[9px] text-white text-center leading-tight">Gift<br />Card</span>
                  </button>
                  <button
                onClick={() => setShowServiceChargeDialog(true)}
                className="flex-1 flex flex-col items-center justify-center gap-1 rounded-xl hover:bg-sidebar-accent transition-colors">

                    <img src={serviceChargeIcon} alt="" className="w-5 h-5" />
                    <span className="text-[9px] text-white text-center leading-tight">Service<br />Charge</span>
                  </button>
                  <button
                onClick={() => {
                  setShowAddGuestForm(true);
                  setIsOrderActionsSidebarOpen(false);
                }}
                className="flex-1 flex flex-col items-center justify-center gap-1 rounded-xl hover:bg-sidebar-accent transition-colors">

                    <img src={addGuestIcon} alt="" className="w-5 h-5" />
                    <span className="text-[9px] text-white text-center leading-tight">Add<br />Guest</span>
                  </button>
                  <button
                onClick={() => { setVoucherMode(true); setEditingVoucherData(null); }}
                className={`flex-1 flex flex-col items-center justify-center gap-1 rounded-xl transition-colors ${voucherMode ? 'bg-sidebar-accent text-sidebar-accent-foreground ring-2 ring-white' : 'hover:bg-sidebar-accent'}`}>

                    <Ticket className="w-5 h-5 text-white" />
                    <span className="text-[9px] text-white text-center leading-tight">Sell<br />Voucher</span>
                  </button>
                  {/* Merge - Only show when order is split */}
                  {isOrderSplit &&
              <button
                onClick={() => {
                  setIsOrderSplit(false);
                  setSplitConfiguration(null);
                }}
                className="flex-1 flex flex-col items-center justify-center gap-1 rounded-xl hover:bg-sidebar-accent transition-colors">

                      <img src={mergeIcon} alt="" className="w-5 h-5" />
                      <span className="text-[9px] text-white text-center leading-tight">Merge</span>
                    </button>
              }
                  <button onClick={() => { setShowMessageKitchen(true); setIsOrderActionsSidebarOpen(false); }} className="flex-1 flex flex-col items-center justify-center gap-1 rounded-xl hover:bg-sidebar-accent transition-colors">
                    <img src={messageKdsIcon} alt="" className="w-5 h-5 brightness-0 invert" />
                    <span className="text-[9px] text-white text-center leading-tight">Message<br />Kitchen</span>
                  </button>
                  <button className="flex-1 flex flex-col items-center justify-center gap-1 rounded-xl hover:bg-sidebar-accent transition-colors">
                    <img src={reopenCheckIcon} alt="" className="w-5 h-5" />
                    <span className="text-[9px] text-white text-center leading-tight">Reopen<br />Check</span>
                  </button>
                </div>
              </div>
          }
          </div>
        </div>
      </div>

      {/* Open Price Dialog */}
      <OpenPriceDialog
        open={showOpenPriceDialog}
        onOpenChange={(open) => {
          setShowOpenPriceDialog(open);
          if (!open) setOpenPriceItem(null);
        }}
        productName={openPriceItem?.name ?? ""}
        ctaLabel={openPriceFlow === 'viewItem' ? "Continue" : openPriceFlow === 'editCartItem' ? "Save" : "Add to Order"}
        initialPrice={openPriceFlow === 'editCartItem' ? openPriceItem?.price : undefined}
        onConfirm={(price) => {
          if (openPriceItem) {
            const itemWithPrice = { ...openPriceItem, price };
            if (openPriceFlow === 'quickAdd') {
              const allSeats = isTableOrder ? Array.from({ length: guestCount }, (_, i) => i + 1) : undefined;
              setOrderItems((prev) => [...prev, {
                id: Date.now(),
                qty: 1,
                name: itemWithPrice.name,
                price: itemWithPrice.price,
                assignedSeats: allSeats,
                isOpenPrice: true
              }]);
            } else if (openPriceFlow === 'editCartItem' && openPriceEditCartItemId !== null) {
              setOrderItems((prev) => prev.map((o) =>
                o.id === openPriceEditCartItemId ? { ...o, price: itemWithPrice.price } : o
              ));
              toast.success(`Price updated to $${itemWithPrice.price.toFixed(2)}`, { duration: 2000 });
              setSelectedItemForCustomization({ ...itemWithPrice, id: openPriceEditCartItemId, isOpenPrice: true });
              setSelectedItemImage(foodImages[openPriceImageIndex % foodImages.length]);
              const isMobile = window.innerWidth < 768;
              if (isMobile) {
                setShowInlineCustomization(true);
              } else {
                setCustomizationDialogOpen(true);
              }
              setOpenPriceEditCartItemId(null);
            } else {
              setSelectedItemForCustomization({ ...itemWithPrice, isOpenPrice: true });
              setSelectedItemImage(foodImages[openPriceImageIndex % foodImages.length]);
              const isMobile = window.innerWidth < 768;
              if (isMobile) {
                setShowInlineCustomization(true);
              } else {
                setCustomizationDialogOpen(true);
              }
            }
          }
          setShowOpenPriceDialog(false);
          setOpenPriceItem(null);
        }}
      />

      {/* Item Customization Dialog */}
      <ItemCustomizationDialog
      open={customizationDialogOpen}
      onOpenChange={setCustomizationDialogOpen}
      item={selectedItemForCustomization}
      itemImage={selectedItemImage}
      onAddToCart={addToCartWithModifiers}
      isTableOrder={isTableOrder}
      guestCount={guestCount}
      onOpenPriceEdit={() => {
        if (selectedItemForCustomization?.isOpenPrice) {
          setCustomizationDialogOpen(false);
          setOpenPriceItem({ id: selectedItemForCustomization.id, name: selectedItemForCustomization.name, price: selectedItemForCustomization.price, isOpenPrice: true });
          setOpenPriceFlow('editCartItem');
          setOpenPriceEditCartItemId(selectedItemForCustomization.id);
          setShowOpenPriceDialog(true);
        }
      }} />

      {/* Manager PIN Authorization for Discount */}
      {showDiscountMpin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-neutral-900 rounded-xl border border-neutral-700 w-[90%] max-w-md mx-4 overflow-hidden animate-scale-in">
            <AccessRestrictedModal
              subtitle="Manager approval required to apply discount."
              onBack={() => setShowDiscountMpin(false)}
              onSuccess={() => {
                setShowDiscountMpin(false);
                setShowDiscountDialog(true);
              }}
            />
          </div>
        </div>
      )}

      {/* Cancel Order Confirmation Dialog */}
      {showClearConfirm && (() => {
        const hasFired = orderItems.some(i => i.isFired);
        const commonReasons = [
          'Customer changed mind',
          'Out of stock',
          'Wrong order placed',
          'Customer left',
          'Duplicate order',
          'Kitchen issue',
        ];
        const selectedReason = cancelReason === '__custom__' ? customCancelReason.trim() : cancelReason;
        const canConfirm = selectedReason.length > 0;
        const needsWriteOffChoice = hasFired && canConfirm && cancelWriteOffChoice === null;
        const canFinalConfirm = canConfirm && (!hasFired || cancelWriteOffChoice !== null);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-neutral-900 rounded-xl border border-neutral-700 w-[90%] max-w-sm mx-4 p-5 space-y-4 animate-scale-in">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mx-auto">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/>
                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                </div>
                <h3 className="text-white font-semibold text-lg">Cancel Order?</h3>
                <p className="text-white/60 text-sm">
                  {hasFired
                    ? 'This order has been fired to the kitchen. Please select a reason for cancellation.'
                    : 'Please select a reason for cancellation.'}
                </p>
              </div>

              {/* Common reasons */}
              <div className="flex flex-wrap gap-2">
                {commonReasons.map((reason) => (
                  <button
                    key={reason}
                    onClick={() => { setCancelReason(reason); setCustomCancelReason(''); setCancelWriteOffChoice(null); }}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      cancelReason === reason
                        ? 'bg-red-500 text-white'
                        : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                    }`}
                  >
                    {reason}
                  </button>
                ))}
                <button
                  onClick={() => { setCancelReason('__custom__'); setCancelWriteOffChoice(null); }}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    cancelReason === '__custom__'
                      ? 'bg-red-500 text-white'
                      : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                  }`}
                >
                  Other
                </button>
              </div>

              {/* Custom reason input */}
              {cancelReason === '__custom__' && (
                <textarea
                  value={customCancelReason}
                  onChange={(e) => setCustomCancelReason(e.target.value)}
                  placeholder="Enter cancel reason..."
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-red-500 resize-none"
                  rows={2}
                  autoFocus
                />
              )}

              {/* Write-Off choice for fired items */}
              {hasFired && canConfirm && (
                <div className="space-y-2">
                  <p className="text-neutral-400 text-xs font-medium">Inventory handling for fired products:</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCancelWriteOffChoice('write_off')}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-colors border ${
                        cancelWriteOffChoice === 'write_off'
                          ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                          : 'bg-neutral-800 border-neutral-700 text-neutral-300 hover:bg-neutral-700'
                      }`}
                    >
                      Write-Off
                      <span className="block text-[10px] mt-0.5 opacity-70">Deduct as waste</span>
                    </button>
                    <button
                      onClick={() => setCancelWriteOffChoice('without')}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-colors border ${
                        cancelWriteOffChoice === 'without'
                          ? 'bg-green-500/20 border-green-500 text-green-400'
                          : 'bg-neutral-800 border-neutral-700 text-neutral-300 hover:bg-neutral-700'
                      }`}
                    >
                      Without Write-Off
                      <span className="block text-[10px] mt-0.5 opacity-70">Return to stock</span>
                    </button>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => { setShowClearConfirm(false); setCancelWriteOffChoice(null); }}
                  className="flex-1 h-10 rounded-full border border-neutral-600 text-white text-sm font-medium hover:bg-neutral-800 transition-colors">
                  Go Back
                </button>
                <button
                  disabled={!canFinalConfirm}
                  onClick={() => {
                    console.log('[CancelOrder] reason:', selectedReason, 'writeOff:', cancelWriteOffChoice === 'write_off');
                    setShowClearConfirm(false);
                    handleClearOrder(selectedReason, cancelWriteOffChoice === 'write_off');
                    setCancelWriteOffChoice(null);
                  }}
                  className={`flex-1 h-10 rounded-full text-white text-sm font-medium transition-colors ${
                    canFinalConfirm ? 'bg-red-500 hover:bg-red-600' : 'bg-neutral-700 cursor-not-allowed opacity-50'
                  }`}>
                  Cancel Order
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Write-Off Choice Popup for individual fired item removal */}
      {showWriteOffPopup && (() => {
        const target = orderItems.find(i => i.id === writeOffPendingItemId);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-neutral-900 rounded-xl border border-neutral-700 w-[90%] max-w-xs mx-4 p-5 space-y-4 animate-scale-in">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6"/>
                  </svg>
                </div>
                <h3 className="text-white font-semibold text-base">Remove Fired Product</h3>
                <p className="text-white/60 text-xs">
                  "{target?.name}" has been fired. How should inventory be handled?
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleWriteOffChoice('write_off')}
                  className="flex-1 py-2.5 px-3 rounded-lg text-xs font-medium bg-amber-500/20 border border-amber-500/50 text-amber-400 hover:bg-amber-500/30 transition-colors"
                >
                  Write-Off
                  <span className="block text-[10px] mt-0.5 opacity-70">Deduct as waste</span>
                </button>
                <button
                  onClick={() => handleWriteOffChoice('without')}
                  className="flex-1 py-2.5 px-3 rounded-lg text-xs font-medium bg-green-500/20 border border-green-500/50 text-green-400 hover:bg-green-500/30 transition-colors"
                >
                  Without Write-Off
                  <span className="block text-[10px] mt-0.5 opacity-70">Return to stock</span>
                </button>
              </div>
              <button
                onClick={() => { setShowWriteOffPopup(false); setWriteOffPendingItemId(null); }}
                className="w-full h-9 rounded-full border border-neutral-600 text-neutral-400 text-xs font-medium hover:bg-neutral-800 transition-colors"
              >
                Keep Product
              </button>
            </div>
          </div>
        );
      })()}


      <DiscountDialog
        open={showDiscountDialog}
        onOpenChange={setShowDiscountDialog}
        currentDiscounts={selectedDiscounts}
        onApplyDiscounts={setSelectedDiscounts}
        subtotal={subtotal}
      />

      {/* No Tax Confirmation Dialog */}
      {showNoTaxDialog &&
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-neutral-900 rounded-xl border border-neutral-700 w-[90%] max-w-[300px] mx-4 overflow-hidden animate-scale-in">
            <div className="p-6 text-center">
              <h2 className="text-white text-lg font-semibold mb-2">Disable Tax?</h2>
              <p className="text-neutral-400 text-sm">Are you sure you want to remove tax from this order?</p>
            </div>
            <div className="flex border-t border-neutral-700">
              <button
            onClick={() => setShowNoTaxDialog(false)}
            className="flex-1 py-3 text-white font-medium hover:bg-neutral-800 transition-colors border-r border-neutral-700">

                Cancel
              </button>
              <button
            onClick={() => {
              setIsTaxExempt(true);
              setShowNoTaxDialog(false);
            }}
            className="flex-1 py-3 text-orange-500 font-medium hover:bg-neutral-800 transition-colors">

                Remove
              </button>
            </div>
          </div>
        </div>
    }

      {/* Gift Card Dialog */}
      <GiftCardDialog
      isOpen={showGiftCardDialog}
      onClose={() => setShowGiftCardDialog(false)}
      onApply={(amount) => setAppliedGiftCardAmount(amount)}
      orderTotal={total} />


      {/* Service Charge Dialog */}
      <ServiceChargeDialog
      open={showServiceChargeDialog}
      onOpenChange={setShowServiceChargeDialog}
      subtotal={subtotal}
      onApply={(amount, name) => {
        setAppliedServiceCharge(amount);
        setAppliedServiceChargeName(name);
      }} />


      {/* MPIN Dialog for Price Override */}
      <MPINDialog
      open={showMPINDialog}
      onOpenChange={setShowMPINDialog}
      onSuccess={handleMPINSuccess}
      correctPin="1234" />



      {/* Price Override Dialog */}
      <PriceOverrideDialog
      open={showPriceOverrideDialog}
      onOpenChange={setShowPriceOverrideDialog}
      itemName={priceOverrideItem?.name || ""}
      itemImage={priceOverrideItem?.image}
      originalPrice={priceOverrideItem?.price || 0}
      onApply={handlePriceOverrideApply} />


      {/* Payment Dialog */}
      <PaymentDialog
      open={showPaymentDialog}
      onOpenChange={setShowPaymentDialog}
      orderDetails={{
        guest: guestName || "Guest",
        phone: guestPhone ? formatPhoneNumber(guestPhone) : undefined,
        table: isTableOrder ? `T${orderNumber}` : undefined,
        check: orderNumber,
        orderType: orderType,
        orderNumber: orderNumber,
        serverName: currentServerName,
        orderTime: orderCreatedTime,
        items: orderItems.map((item) => ({
          id: item.id,
          qty: item.qty,
          name: item.name,
          price: item.price
        }))
      }}
      subtotal={subtotal}
      tax={tax}
      total={chargeAmount}
      containsVoucher={orderItems.some(item => item.itemOrderType === 'VOUCHER')}
      voucherCount={orderItems.filter(item => item.itemOrderType === 'VOUCHER').reduce((sum, item) => sum + (item.qty || 1), 0)}
      voucherItems={orderItems.filter(item => item.itemOrderType === 'VOUCHER').flatMap(item => {
        const qty = item.qty || 1;
        return Array.from({ length: qty }, (_, i) => ({
          name: item.name,
          price: item.price,
          index: i,
        }));
      }).map((v, idx) => ({ ...v, index: idx }))}
      onPaymentComplete={(history) => {
        console.log("Payment completed:", history);

        // Persist payment to database
        const dbId = quickOrderDbId || existingOrderId || sessionIdFromParams;
        if (dbId) {
          const totalPaid = history.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
          const paymentsArray = history.map((p: any) => ({
            method: p.methodLabel || p.method || 'Card',
            amount: p.amount || 0,
          }));
          updateTicketOrder(dbId, {
            status: 'PAID',
            paymentType: paymentsArray[0]?.method || 'Card',
            payments: paymentsArray,
            paidAmount: totalPaid.toFixed(2),
            paymentStatus: 'completed',
            tip: history.reduce((sum: number, p: any) => sum + (p.tipAmount || 0), 0),
          }).catch(console.error);
        }

        const checkoutSettings = SettingsManager.getCheckoutOptionsSettings();
        if (checkoutSettings.printReceipt) {
          toast.success("Receipt sent to printer");
        }
        if (checkoutSettings.emailReceipt) {
          toast.success("Receipt sent via email");
        }
        if (checkoutSettings.smsReceipt) {
          toast.success("Receipt sent via SMS");
        }
        // Always reset the order screen after payment
        handleClearOrder();
        setShowPaymentDialog(false);
        if (checkoutSettings.autoCloseTicket) {
          toast.success("Ticket closed automatically");
          navigate('/');
        } else {
          toast.success("Order completed successfully");
        }
      }}
      onSaveSplit={(config) => {
        setIsOrderSplit(true);
        setSplitConfiguration(config);

        // Persist to session context if this is a session order
        if (sessionIdFromParams && isSessionOrderMode) {
          // Build split checks from the configuration
          const checks = Array.from({ length: config.numberOfChecks }, (_, i) => {
            const checkLetter = String.fromCharCode(97 + i); // a, b, c...
            const itemsForCheck = orderItems.filter((_, itemIdx) =>
            config.checkAssignments[itemIdx + 1] === i + 1
            );
            const checkTotal = itemsForCheck.reduce((sum, item) => sum + item.price * item.qty, 0);

            return {
              checkId: checkLetter,
              items: itemsForCheck.map((item) => ({
                qty: item.qty,
                name: item.name,
                price: item.price,
                seats: [],
                modifiers: []
              })),
              status: 'unpaid' as const,
              total: checkTotal
            };
          });

          saveContextSplitConfig(sessionIdFromParams, {
            ...config,
            checks
          });
        }
      }} />


      {/* Split Order Alert Dialog */}
      {showSplitOrderAlert &&
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-neutral-900 rounded-xl border border-neutral-700 w-[90%] max-w-sm mx-4 overflow-hidden animate-scale-in relative">
            {/* Close X button */}
            <button
          onClick={() => setShowSplitOrderAlert(false)}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center transition-colors z-10">

              <X className="w-4 h-4 text-neutral-400" />
            </button>
            <div className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-6 h-6 text-amber-400" />
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">Cannot Add Items</h3>
              <p className="text-neutral-400 text-sm mb-6">
                You cannot add more items to a split order. If you want to add items, please merge the order first.
              </p>
              <button
            onClick={() => {
              setShowSplitOrderAlert(false);
              setIsOrderSplit(false);
              setSplitConfiguration(null);
            }}
            className="w-full py-3 rounded-lg bg-gradient-to-r from-orange-500 to-amber-400 text-white font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2">

                <img src={mergeIcon} alt="Merge" className="w-4 h-4" />
                Merge
              </button>
            </div>
          </div>
        </div>
    }

      {/* Transfer Check Dialog */}
      <TransferCheckDialog
      isOpen={showTransferCheckDialog}
      onClose={() => setShowTransferCheckDialog(false)}
      currentServer={currentServerName}
      onTransfer={(newServerName) => {
        setCurrentServerName(newServerName);
        setShowTransferCheckDialog(false);
      }} />


      {/* Voucher Dialog */}
      <VoucherDialog
      isOpen={showVoucherDialog}
      onClose={() => { setShowVoucherDialog(false); setVoucherDialogInitialView('sell'); }}
      initialView={voucherDialogInitialView}
      initialData={editingVoucherData}
      guestData={(guestName || guestPhone) ? { name: guestName, phone: guestPhone } : undefined}
      onAddVoucher={(amount, voucherData) => {
        const price = voucherData.sellingPrice ?? amount;
        const voucherLabel = voucherData.voucherName?.trim() || 'Voucher';
        const label = `${voucherLabel} - $${(voucherData.value ?? amount).toFixed(2)}`;
        setOrderItems((prev) => [...prev, {
          id: Date.now(),
          qty: 1,
          name: label,
          price: price,
          itemOrderType: 'VOUCHER',
          noTax: true
        }]);
        if (voucherData.customerName && !guestName) setGuestName(voucherData.customerName);
        if (voucherData.customerPhone && !guestPhone) setGuestPhone(voucherData.customerPhone.replace(/\D/g, ''));
        setShowVoucherDialog(false);
      }}
      onRedeemVoucher={(code, balance) => {
        setAppliedVoucherAmount(balance);
        setVoucherCode(code);
        setShowVoucherDialog(false);
      }} />


      {/* Voucher Options Popup - matching Transfer Order popup UI */}
      {showVoucherOptionsPopup &&
    <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/80" onClick={() => setShowVoucherOptionsPopup(false)} />
          <div className="relative bg-neutral-900 border border-white/10 rounded-2xl w-[380px] max-w-[90vw] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h2 className="text-white text-lg font-semibold">Voucher</h2>
              <button
            onClick={() => setShowVoucherOptionsPopup(false)}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">

                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4">
              <p className="text-white/60 text-sm mb-3">What would you like to do?</p>
              
              <div className="space-y-2">
                {/* Create Voucher */}
                <button
              onClick={() => {
                setShowVoucherOptionsPopup(false);
                setShowCreateVoucherForm(true);
              }}
              className="w-full p-3.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors text-left">

                  <div className="flex items-center gap-3 mb-0.5">
                    <Ticket className="w-5 h-5 text-white/80" />
                    <span className="text-white font-medium">Create Voucher</span>
                  </div>
                  <p className="text-white/50 text-xs ml-8">Create and send a new voucher to a customer.</p>
                </button>

                {/* Redeem Voucher */}
                <button
              onClick={() => {
                setShowVoucherOptionsPopup(false);
                setVoucherDialogInitialView('redeem');
                setShowVoucherDialog(true);
              }}
              className="w-full p-3.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors text-left">

                  <div className="flex items-center gap-3 mb-0.5">
                    <Gift className="w-5 h-5 text-white/80" />
                    <span className="text-white font-medium">Redeem Voucher</span>
                  </div>
                  <p className="text-white/50 text-xs ml-8">Apply an existing voucher code to this order.</p>
                </button>
              </div>
            </div>
          </div>
        </div>
    }
    <MessageKitchenDialog
      open={showMessageKitchen}
      onOpenChange={setShowMessageKitchen}
      tableId={tableIdFromParams}
      serverName={currentServerName}
    />
    </div>
    </div>;
};
export default Orders;