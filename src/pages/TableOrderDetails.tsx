import { useState, useRef, useMemo, useEffect } from "react";
import { SettingsManager } from "@/lib/settingsManager";
import { toast } from "sonner";
import { useOrderTimers } from "@/hooks/use-order-timer";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { PaymentDialog } from "@/components/PaymentDialog";
import { useUnifiedOrders } from "@/contexts/UnifiedOrderContext";
import { useTicketOrders } from "@/hooks/use-ticket-orders";
import { supabase } from "@/integrations/supabase/client";
import ReceiptDialog from "@/components/ReceiptDialog";
import TipDialog from "@/components/TipDialog";
import RefundDialog from "@/components/RefundDialog";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ChevronLeft, ChevronDown, ChevronRight, Search, SlidersHorizontal, Phone, Users, Share2, Info, X, Delete, Briefcase, Heart, GraduationCap, Shield, Star, Clock, Cake, MapPin, BadgeDollarSign, Tag, ArrowRightLeft } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import MergedOrderPanel from "@/components/MergedOrderPanel";
import OrderLayoutTemplate from "@/components/OrderLayoutTemplate";
import { ticketToTemplateData, formatTicketPrice } from "@/data/ticketOrders";
import type { TicketOrder } from "@/data/ticketOrders";

// Import shared order utilities (no static data)
import { 
  Order, 
  OrderItem,
  PaymentMethod,
  formatPrice,
  getStatusColor as getSharedStatusColor,
  getMergedOrderDisplay,
  calculateCombinedTotals,
  hasMergedOrTransferredItems,
  MergedOrderSource,
  calculateOrderTotals,
  toOrderTemplateData
} from "@/data/orders";
import { formatTableName } from "@/lib/orderUtils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useSessionOrders, SessionOrder, SplitConfiguration, SplitCheck } from "@/contexts/SessionOrderContext";

// Import icons
import runnerIcon from "@/assets/icons/runner.png";
import clearIcon from "@/assets/icons/clear-c.png";
import fireIcon from "@/assets/icons/fire.png";
import tableTargetIcon from "@/assets/icons/table-target.png";
import arrowRightIcon from "@/assets/icons/arrow-right.png";
import shareOrderIcon from "@/assets/icons/share-order.png";
import shareSeatsIcon from "@/assets/icons/share-seats.png";
import seatIcon from "@/assets/icons/seat-icon.png";
import splitIcon from "@/assets/icons/split-icon.png";
import mergeIcon from "@/assets/icons/merge-icon.png";
import transferIcon from "@/assets/icons/transfer-icon.png";
import transferItemIcon from "@/assets/icons/transfer-item.svg";
import transferEntireOrderIcon from "@/assets/icons/transfer-entire-order.svg";
import transferToTableIcon from "@/assets/icons/transfer-to-table.svg";
import transferToOrderIcon from "@/assets/icons/transfer-to-order.svg";
import searchIcon from "@/assets/icons/search.png";
import dineInIcon from "@/assets/icons/dine-in.png";
import chairWhiteIcon from "@/assets/icons/chair-white.png";
import saveIcon from "@/assets/icons/save.png";
import linkMergeIcon from "@/assets/icons/link-merge.png";
import cashRegisterIcon from "@/assets/icons/cash-register.png";
import receiptIcon from "@/assets/icons/receipt-icon.svg";
import registerIcon from "@/assets/icons/register.svg";
import discountBtnIcon from "@/assets/icons/discount-icon.svg";
import { OrderNotesAutocomplete } from "@/components/OrderNotesAutocomplete";
import SwipeableCartItem from "@/components/SwipeableCartItem";

// Discount types - loaded from DB
interface DiscountType {
  id: string;
  name: string;
  description: string;
  percentage?: number;
  fixedAmount?: number;
  icon: string;
}

const getDiscountIcon = (iconName: string) => {
  const icons: Record<string, React.ComponentType<{ className?: string }>> = {
    briefcase: Briefcase, heart: Heart, graduation: GraduationCap, shield: Shield,
    star: Star, clock: Clock, cake: Cake, mappin: MapPin, dollar: BadgeDollarSign, tag: Tag
  };
  return icons[iconName] || Tag;
};

// Extended guest order interface with calculated totals
interface GuestOrder extends Order {
  subtotal: number;
  discount: number;
  serviceCharge: number;
  tax: number;
  tip: number;
  total: number;
  mergedFrom?: MergedOrderSource[];
  transferredFrom?: MergedOrderSource[];
  paymentMethods?: PaymentMethod[];
  splitConfiguration?: SplitConfiguration;
}

// Helper component for multi-payment display
const MultiPaymentDisplay = ({ paymentMethods, paymentType }: { paymentMethods?: PaymentMethod[], paymentType: string }) => {
  if (!paymentMethods || paymentMethods.length <= 1) {
    return <span className="text-white/60 truncate">{paymentType && paymentType !== '--' ? paymentType : 'Paid'}</span>;
  }

  const primaryMethod = paymentMethods[0];
  const additionalCount = paymentMethods.length - 1;

  const getCardIcon = (type: string) => {
    switch (type) {
      case 'Visa': return <span className="w-5 h-3 rounded-sm bg-white flex items-center justify-center"><span className="text-[8px] font-bold text-blue-600">VISA</span></span>;
      case 'Amex': return <span className="w-5 h-3 rounded-sm bg-blue-500 flex items-center justify-center"><span className="text-[6px] font-bold text-white">AMEX</span></span>;
      case 'Mastercard': return <span className="w-5 h-3 rounded-sm bg-gradient-to-r from-red-500 to-yellow-500 flex items-center justify-center"><span className="text-[6px] font-bold text-white">MC</span></span>;
      case 'Discover': return <span className="w-5 h-3 rounded-sm bg-orange-500 flex items-center justify-center"><span className="text-[6px] font-bold text-white">DISC</span></span>;
      case 'Cash': return <span className="w-5 h-3 rounded-sm bg-green-600 flex items-center justify-center"><span className="text-[6px] font-bold text-white">$</span></span>;
      case 'Gift Card': return <span className="w-5 h-3 rounded-sm bg-purple-500 flex items-center justify-center"><span className="text-[6px] font-bold text-white">GC</span></span>;
      default: return <span className="w-5 h-3 rounded-sm bg-gray-500 flex items-center justify-center"><span className="text-[6px] font-bold text-white">CC</span></span>;
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button 
          className="flex items-center gap-1 text-white/60 hover:text-white transition-colors cursor-pointer"
          onClick={(e) => e.stopPropagation()}
        >
          <span>{getCardIcon(primaryMethod.type)}</span>
          <span>{primaryMethod.type}</span>
          {primaryMethod.lastFour && <span>•••• {primaryMethod.lastFour}</span>}
          <span className="text-[#8AC4FF]">+{additionalCount} more</span>
        </button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-56 p-3 bg-neutral-800 border border-neutral-700 shadow-xl z-[9999]" 
        side="bottom" 
        align="start"
        sideOffset={8}
      >
        <div className="space-y-1">
          <h4 className="text-white/80 text-xs font-medium mb-2">Payment Methods</h4>
          {paymentMethods.map((method, index) => (
            <div key={index} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span>{getCardIcon(method.type)}</span>
                <span className="text-white">{method.type}</span>
                {method.lastFour && <span className="text-white/60">•••• {method.lastFour}</span>}
              </div>
              <span className="text-white font-medium">{formatPrice(method.amount)}</span>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

// Helper function to get order items for display (backwards compatibility)
const getOrderItems = (order: GuestOrder) => order.items.map(item => ({
  ...item,
  price: formatPrice(item.price * item.qty)
}));

// Helper function to filter items by selected seats
const filterItemsBySeats = (items: OrderItem[], selectedSeats: number[], allSeatsSelected: boolean) => {
  // If all seats are selected (or no specific filtering), show all items
  if (allSeatsSelected) return items;
  
  return items.filter(item => {
    // Items with no seat assignment are shared items - show them when any seat is selected
    if (item.seats.length === 0) return true;
    // Show item if any of its assigned seats are in the selected seats
    return item.seats.some(seat => selectedSeats.includes(seat));
  });
};

// Dynamic function to build merged order data from actual orders
const getMergedPanelData = (destOrderId: string | null, mergedOrderId: string | null, mergedFromTable: string | null, allDbOrders: Order[]) => {
  if (!destOrderId || !mergedOrderId) return null;
  
  const destOrder = allDbOrders.find(o => o.id === destOrderId);
  const mergedOrder = allDbOrders.find(o => o.id === mergedOrderId);
  
  if (!destOrder || !mergedOrder) return null;
  
  return {
    guestName: destOrder.name,
    phone: destOrder.phone,
    time: destOrder.time,
    server: destOrder.server,
    orders: [
      {
        id: destOrder.id,
        table: destOrder.table,
        partySize: destOrder.partySize,
        time: destOrder.time,
        notes: destOrder.notes || "",
        items: destOrder.items.map(item => ({
          qty: item.qty,
          name: item.name,
          price: `$${(item.price * item.qty).toFixed(2)}`,
          seats: item.seats,
          modifiers: item.modifiers
        }))
      },
      {
        id: mergedOrder.id,
        table: mergedFromTable || mergedOrder.table,
        partySize: mergedOrder.partySize,
        time: mergedOrder.time,
        notes: mergedOrder.notes || "",
        items: mergedOrder.items.map(item => ({
          qty: item.qty,
          name: item.name,
          price: `$${(item.price * item.qty).toFixed(2)}`,
          seats: item.seats,
          modifiers: item.modifiers
        }))
      }
    ]
  };
};

const filters = ["All", "Open", "Completed", "Paid", "Unpaid"];

const TableOrderDetails = () => {
  const navigate = useNavigate();
  const { orders: unifiedOrders, updateOrders: updateUnifiedOrders, updateOrder, getOrdersByTable: getUnifiedOrdersByTable, getOrderById: getUnifiedOrderById } = useUnifiedOrders();
  const { orders: dbTicketOrders, updateOrder: updateTicketOrder } = useTicketOrders();
  
  // All DB orders as Order-compatible shape for lookups
  const allDbOrders: Order[] = useMemo(() => unifiedOrders.map(o => ({
    ...o,
    orderType: o.orderType as Order['orderType'],
  })), [unifiedOrders]);
  
  // Fetch discounts from DB
  const [discountTypes, setDiscountTypes] = useState<DiscountType[]>([]);
  useEffect(() => {
    const fetchDiscounts = async () => {
      const { data } = await (supabase as any).from('discounts').select('*').eq('archived', false).eq('device_id', 'shared').order('sort_order');
      if (data && data.length > 0) {
        setDiscountTypes(data.map((d: any) => ({
          id: d.id,
          name: d.name,
          description: d.type === 'Percentage' ? `${d.amount}% off` : `$${Number(d.amount).toFixed(2)} off`,
          percentage: d.type === 'Percentage' ? Number(d.amount) : undefined,
          fixedAmount: d.type === 'Fixed' || d.type === 'Dollar' ? Number(d.amount) : undefined,
          icon: d.requires_manager_pin ? 'dollar' : 'tag',
        })));
      } else {
        // Fallback defaults if no DB discounts
        setDiscountTypes([
          { id: 'employee', name: 'Employee Discount', description: '20% off', percentage: 20, icon: 'briefcase' },
          { id: 'senior', name: 'Senior Citizen', description: '15% off', percentage: 15, icon: 'heart' },
          { id: 'student', name: 'Student Discount', description: '10% off', percentage: 10, icon: 'graduation' },
          { id: 'military', name: 'Military Discount', description: '15% off', percentage: 15, icon: 'shield' },
          { id: 'loyalty', name: 'Loyalty Member', description: '5% off', percentage: 5, icon: 'star' },
          { id: 'happy', name: 'Happy Hour', description: '25% off', percentage: 25, icon: 'clock' },
          { id: 'birthday', name: 'Birthday Special', description: '30% off', percentage: 30, icon: 'cake' },
          { id: 'first', name: 'First Visit', description: '10% off', percentage: 10, icon: 'mappin' },
          { id: 'comp5', name: 'Manager Comp $5', description: '$5.00 off', fixedAmount: 5, icon: 'dollar' },
          { id: 'comp10', name: 'Manager Comp $10', description: '$10.00 off', fixedAmount: 10, icon: 'dollar' },
          { id: 'comp15', name: 'Manager Comp $15', description: '$15.00 off', fixedAmount: 15, icon: 'dollar' },
          { id: 'promo', name: 'Promo Code Discount', description: '20% off', percentage: 20, icon: 'tag' },
        ]);
      }
    };
    fetchDiscounts();
  }, []);
  const {
    tableId
  } = useParams();
  const [searchParams] = useSearchParams();
  const mergedOrderId = searchParams.get("merged");
  const mergedFromTable = searchParams.get("from");
  const destOrderId = searchParams.get("dest");
  
  // Transfer params (destination - receiving items)
  const transferredOrderId = searchParams.get("transferred");
  const transferredFromTable = searchParams.get("transferFrom");
  const transferDestOrderId = searchParams.get("transferDest");
  const transferredItemsParam = searchParams.get("items"); // comma-separated item names
  
  // Transfer source params (source - sending items out)
  const transferSourceOrderId = searchParams.get("transferSource");
  const transferType = searchParams.get("transferType"); // 'partial' or 'full'
  const transferredToOrderId = searchParams.get("transferredTo");
  const transferToTable = searchParams.get("transferToTable");
  const transferredItemsFromSource = searchParams.get("items");
  
  // Parse transferred items from URL
  const transferredItemNames = transferredItemsParam ? transferredItemsParam.split(',') : [];
  const transferredOutItemNames = transferredItemsFromSource ? transferredItemsFromSource.split(',') : [];
  
  // Get the revenueCenter (area) of an order by ID
  const getOrderArea = (orderId: string | null): string => {
    if (!orderId) return "";
    const order = allDbOrders.find(o => o.id === orderId);
    return order?.revenueCenter || "";
  };
  const mergedSourceArea = getOrderArea(mergedOrderId);
  const destOrderArea = getOrderArea(destOrderId);
  const transferSourceArea = getOrderArea(transferredOrderId);
  const transferDestArea = getOrderArea(transferredToOrderId);
  
  // Get session orders for this table
  const { getOrdersByTable: getSessionOrdersByTable, saveSplitConfiguration } = useSessionOrders();
  const sessionOrdersForTable = tableId ? getSessionOrdersByTable(tableId) : [];

  // Get session ID for the current order (for persisting split config)
  const getSessionIdForOrder = (orderId: string): string | undefined => {
    const sessionOrder = sessionOrdersForTable.find(so => so.id === orderId);
    return sessionOrder?.sessionId;
  };

  // Static split configs for non-session orders (persisted in localStorage)
  const STATIC_SPLITS_KEY = 'pos-tableorder-static-splits';
  const [staticSplitConfigs, setStaticSplitConfigs] = useState<Record<string, SplitConfiguration>>(() => {
    try {
      const stored = localStorage.getItem(STATIC_SPLITS_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  // Persist static split configs to localStorage
  useEffect(() => {
    localStorage.setItem(STATIC_SPLITS_KEY, JSON.stringify(staticSplitConfigs));
  }, [staticSplitConfigs]);

  // Helper to get static split config key
  const getStaticSplitKey = (orderId: string) => `${tableId}:${orderId}`;
  
  // Convert session orders to GuestOrder format
  const convertSessionToGuestOrder = (sessionOrder: SessionOrder): GuestOrder => {
    const totals = calculateOrderTotals(sessionOrder.items, 0);
    return {
      id: sessionOrder.id,
      name: sessionOrder.name,
      phone: sessionOrder.phone,
      partySize: sessionOrder.partySize,
      time: sessionOrder.time,
      timer: sessionOrder.timer,
      server: sessionOrder.server,
      check: sessionOrder.check,
      paymentType: sessionOrder.paymentType,
      revenueCenter: sessionOrder.revenueCenter,
      status: sessionOrder.status,
      notes: sessionOrder.notes,
      table: sessionOrder.table,
      orderType: sessionOrder.orderType,
      items: sessionOrder.items,
      subtotal: totals.subtotal,
      discount: totals.discount,
      serviceCharge: totals.serviceCharge,
      tax: totals.tax,
      tip: totals.tip,
      total: totals.total,
      splitConfiguration: sessionOrder.splitConfiguration
    };
  };
  
  // Read persisted transfers from localStorage for this table
  const TRANSFER_STORAGE_KEY = 'pos-table-transfers';
  const persistedTransfers = useMemo(() => {
    if (!tableId) return [];
    try {
      const stored = JSON.parse(localStorage.getItem(TRANSFER_STORAGE_KEY) || '{}');
      return (stored[tableId] || []) as {
        sourceOrderId: string;
        sourceTable: string;
        transferType: 'full' | 'partial';
        items: { name: string; qty: number; price: number; modifiers?: string[]; seats: number[] }[];
        sourceOrderName: string;
        sourceServer: string;
        sourcePhone: string;
        sourcePartySize: number;
        sourceRevenueCenter: string;
        sourceOrderType: string;
        sourceNotes: string;
        targetOrderId?: string;
      }[];
    } catch { return []; }
  }, [tableId]);

  // Get orders for this table from DB (unified context)
  const tableOrders = useMemo(() => allDbOrders.filter(o => o.table === (tableId || "T2")), [allDbOrders, tableId]);
  
  // Get persisted transfers that target specific existing orders
  const persistedTransfersForExistingOrders = persistedTransfers.filter(t => t.targetOrderId);
  const persistedTransfersForNewOrders = persistedTransfers.filter(t => !t.targetOrderId);
  
  const staticGuestOrders: GuestOrder[] = tableOrders.map((order, orderIndex) => {
    // DB orders already have calculated totals
    const orderWithTotals: GuestOrder = {
      ...order,
      subtotal: (order as any).subtotal ?? calculateOrderTotals(order.items, 0).subtotal,
      discount: (order as any).discount ?? calculateOrderTotals(order.items, 0).discount,
      serviceCharge: (order as any).serviceCharge ?? calculateOrderTotals(order.items, 0).serviceCharge,
      tax: (order as any).tax ?? calculateOrderTotals(order.items, 0).tax,
      tip: (order as any).tip ?? calculateOrderTotals(order.items, 0).tip,
      total: (order as any).total ?? calculateOrderTotals(order.items, 0).total,
    };
    
    // Attach split configuration from localStorage for static orders
    const splitKey = getStaticSplitKey(order.id);
    if (staticSplitConfigs[splitKey]) {
      orderWithTotals.splitConfiguration = staticSplitConfigs[splitKey];
    }
    
    // If this order is the destination of a merge, add merged order data
    if (destOrderId === order.id && mergedOrderId) {
      const mergedSource = allDbOrders.find(o => o.id === mergedOrderId);
      if (mergedSource) {
        orderWithTotals.mergedFrom = [{
          orderId: mergedSource.id,
          orderName: mergedSource.name,
          table: mergedFromTable || mergedSource.table,
          items: mergedSource.items
        }];
        // Recalculate totals with merged items
        const combinedTotals = calculateCombinedTotals(orderWithTotals);
        orderWithTotals.subtotal = combinedTotals.subtotal;
        orderWithTotals.discount = combinedTotals.discount;
        orderWithTotals.serviceCharge = combinedTotals.serviceCharge;
        orderWithTotals.tax = combinedTotals.tax;
        orderWithTotals.total = combinedTotals.total;
      }
    }
    
    // If this order is the destination of a transfer (exact ID match only) - URL params
    if (transferDestOrderId === order.id && transferredOrderId && transferredItemNames.length > 0) {
      const transferSource = allDbOrders.find(o => o.id === transferredOrderId);
      if (transferSource) {
        const transferredItems = transferSource.items.filter(item => 
          transferredItemNames.includes(item.name)
        );
        orderWithTotals.transferredFrom = [{
          orderId: transferSource.id,
          orderName: transferSource.name,
          table: transferredFromTable || transferSource.table,
          items: transferredItems
        }];
        const combinedTotals = calculateCombinedTotals(orderWithTotals);
        orderWithTotals.subtotal = combinedTotals.subtotal;
        orderWithTotals.discount = combinedTotals.discount;
        orderWithTotals.serviceCharge = combinedTotals.serviceCharge;
        orderWithTotals.tax = combinedTotals.tax;
        orderWithTotals.total = combinedTotals.total;
      }
    }
    
    // Check persisted transfers targeting this specific order
    const matchingPersistedTransfers = persistedTransfersForExistingOrders.filter(t => t.targetOrderId === order.id);
    if (matchingPersistedTransfers.length > 0) {
      const allTransferredItems: OrderItem[] = [];
      const transferSources: MergedOrderSource[] = [];
      
      matchingPersistedTransfers.forEach(transfer => {
        const items: OrderItem[] = transfer.items.map(item => ({
          name: item.name,
          qty: item.qty,
          price: item.price,
          modifiers: item.modifiers || [],
          seats: item.seats || [],
        }));
        allTransferredItems.push(...items);
        transferSources.push({
          orderId: transfer.sourceOrderId,
          orderName: transfer.sourceOrderName,
          table: transfer.sourceTable,
          items: items
        });
      });
      
      orderWithTotals.transferredFrom = [
        ...(orderWithTotals.transferredFrom || []),
        ...transferSources
      ];
      (orderWithTotals as any)._persistedTransferType = matchingPersistedTransfers[0].transferType;
      
      // Recalculate totals with transferred items included
      const combinedTotals = calculateCombinedTotals(orderWithTotals);
      orderWithTotals.subtotal = combinedTotals.subtotal;
      orderWithTotals.discount = combinedTotals.discount;
      orderWithTotals.serviceCharge = combinedTotals.serviceCharge;
      orderWithTotals.tax = combinedTotals.tax;
      orderWithTotals.total = combinedTotals.total;
    }
    
    return orderWithTotals;
  });
  
  
  
  // For table-level partial transfers where no existing order matched, create a virtual new order
  const virtualTransferOrder: GuestOrder[] = (() => {
    // First check URL-param based transfers (original logic for partial)
    if (transferType === 'partial' && transferredOrderId && transferredItemNames.length > 0 && transferredFromTable !== tableId) {
      const alreadyAttached = staticGuestOrders.some(o => o.transferredFrom && o.transferredFrom.length > 0);
      if (!alreadyAttached) {
        const transferSource = allDbOrders.find(o => o.id === transferredOrderId);
        if (transferSource) {
          const transferredItems = transferSource.items.filter(item => 
            transferredItemNames.includes(item.name)
          );
          if (transferredItems.length > 0) {
            const totals = calculateOrderTotals(transferredItems, 0);
            const maxOrderId = Math.max(...allDbOrders.map(o => parseInt(o.id) || 0));
            const newOrderId = String(maxOrderId + 1);
            const maxCheck = Math.max(...allDbOrders.map(o => parseInt(o.check) || 0));
            const newCheck = String(maxCheck + 1);
            
            return [{
              id: newOrderId,
              name: transferSource.name,
              phone: transferSource.phone,
              partySize: transferredItems.length,
              time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
              timer: "0:00",
              server: transferSource.server,
              check: newCheck,
              paymentType: "--",
              revenueCenter: transferSource.revenueCenter,
              status: "ORDERING",
              notes: "",
              table: tableId || "",
              orderType: transferSource.orderType,
              items: transferredItems,
              subtotal: totals.subtotal,
              discount: totals.discount,
              serviceCharge: totals.serviceCharge,
              tax: totals.tax,
              tip: totals.tip,
              total: totals.total,
              transferredFrom: [{
                orderId: transferSource.id,
                orderName: transferSource.name,
                table: transferredFromTable || transferSource.table,
                items: transferredItems
              }]
            }];
          }
        }
      }
    }
    
    // Then check persisted transfers from localStorage (only those without targetOrderId - those with targetOrderId are attached to existing orders above)
    if (persistedTransfersForNewOrders.length > 0) {
      return persistedTransfersForNewOrders.map((transfer, idx) => {
        const transferredItems: OrderItem[] = transfer.items.map(item => ({
          name: item.name,
          qty: item.qty,
          price: item.price,
          modifiers: item.modifiers || [],
          seats: item.seats || [],
        }));
        const totals = calculateOrderTotals(transferredItems, 0);
        // For full transfers, preserve the original order ID; for partial, generate new
        const newOrderId = transfer.transferType === 'full' 
          ? transfer.sourceOrderId 
          : String(Math.max(...allDbOrders.map(o => parseInt(o.id) || 0)) + 1 + idx);
        const newCheck = transfer.transferType === 'full'
          ? transfer.sourceOrderId
          : String(Math.max(...allDbOrders.map(o => parseInt(o.check) || 0)) + 1 + idx);
        
        return {
          id: newOrderId,
          name: transfer.sourceOrderName,
          phone: transfer.sourcePhone,
          partySize: transfer.sourcePartySize,
          time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
          timer: "0:00",
          server: transfer.sourceServer,
          check: newCheck,
          paymentType: "--",
          revenueCenter: transfer.sourceRevenueCenter,
          status: "ORDERING" as const,
          notes: transfer.sourceNotes,
          table: tableId || "",
          orderType: transfer.sourceOrderType,
          items: transferredItems,
          subtotal: totals.subtotal,
          discount: totals.discount,
          serviceCharge: totals.serviceCharge,
          tax: totals.tax,
          tip: totals.tip,
          total: totals.total,
          transferredFrom: [{
            orderId: transfer.sourceOrderId,
            orderName: transfer.sourceOrderName,
            table: transfer.sourceTable,
            items: transferredItems
          }],
          _persistedTransferType: transfer.transferType,
        } as GuestOrder & { _persistedTransferType?: string };
      });
    }
    
    return [];
  })();
  
  // Merge static and session orders - session orders shown first, virtual transfer orders on top
  const sessionGuestOrders: GuestOrder[] = sessionOrdersForTable.map(convertSessionToGuestOrder);
  const sessionOrderIds = new Set(sessionGuestOrders.map(o => o.id));
  const dedupedStaticOrders = staticGuestOrders.filter(o => !sessionOrderIds.has(o.id));
  const guestOrders: GuestOrder[] = virtualTransferOrder.length > 0 
    ? [...virtualTransferOrder, ...sessionGuestOrders, ...dedupedStaticOrders] 
    : [...sessionGuestOrders, ...dedupedStaticOrders];
  

  // Memoize order timer data to avoid recreating array on every render
  const orderTimerData = useMemo(() => 
    guestOrders.map(o => ({ id: o.id, time: o.time, status: o.status, timer: o.timer })), 
    [guestOrders]
  );
  
  // Dynamic timers - running for ongoing orders, static for paid orders
  const orderTimers = useOrderTimers(orderTimerData);
  
  const [activeFilter, setActiveFilter] = useState("All");
  const [selectedGuest, setSelectedGuest] = useState<GuestOrder | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [showMobileOrderPanel, setShowMobileOrderPanel] = useState(false);
  const [orderNotes, setOrderNotes] = useState("");
  const orderNotesTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [activeSwipedItemId, setActiveSwipedItemId] = useState<string | null>(null);
  const [seatFilter, setSeatFilter] = useState<(number | 'all')[]>(['all']);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  const [receiptGuest, setReceiptGuest] = useState<GuestOrder | null>(null);
  const [showTipDialog, setShowTipDialog] = useState(false);
  const [showRefundMode, setShowRefundMode] = useState(false);
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [expandedCartItems, setExpandedCartItems] = useState<Set<string>>(new Set());
  
  // Transfer intent dialog state
  const [showTransferIntentDialog, setShowTransferIntentDialog] = useState(false);
  const [transferIntentOrderId, setTransferIntentOrderId] = useState<string | null>(null);
  
  // Transfer to Order dialog state (inline, no navigation)
  const [showTransferToOrderDialog, setShowTransferToOrderDialog] = useState(false);
  const [selectedTransferOrderId, setSelectedTransferOrderId] = useState<string | null>(null);
  const [transferToOrderSourceId, setTransferToOrderSourceId] = useState<string | null>(null);
  
  // Local transfer result (stays on same page after confirm)
  const [localTransferResult, setLocalTransferResult] = useState<{
    sourceOrderId: string;
    destinationOrderId: string;
    destinationLabel: string;
    transferredItemNames: string[];
    transferType: 'full' | 'partial';
  } | null>(null);
  
  // Discount state
  const [showDiscountDialog, setShowDiscountDialog] = useState(false);
  const [discountDialogView, setDiscountDialogView] = useState<'mpin' | 'discounts'>('mpin');
  const [discountPin, setDiscountPin] = useState("");
  const [selectedDiscountId, setSelectedDiscountId] = useState<string | null>(null);
  
  // Set initial selected guest when guestOrders changes
  const currentSelectedGuest = selectedGuest || guestOrders[0];
  
  // Calculate applied discount (must be after currentSelectedGuest)
  const appliedDiscount = useMemo(() => {
    if (!selectedDiscountId || !currentSelectedGuest) return 0;
    const discountType = discountTypes.find(d => d.id === selectedDiscountId);
    if (!discountType) return 0;
    return discountType.fixedAmount || (currentSelectedGuest.subtotal * ((discountType.percentage || 0) / 100));
  }, [selectedDiscountId, currentSelectedGuest]);

  // Reset refund mode and sync notes/seats when selected guest changes
  useEffect(() => {
    setShowRefundMode(false);
    // Sync order notes from DB
    setOrderNotes(currentSelectedGuest?.notes || "");
    // Sync seats from party size
    const size = currentSelectedGuest?.partySize || 4;
    setSelectedSeats(Array.from({ length: size }, (_, i) => i + 1));
  }, [currentSelectedGuest?.id]);

  // Debounced persist of order notes to DB
  const handleOrderNotesChange = (value: string) => {
    setOrderNotes(value);
    if (orderNotesTimerRef.current) clearTimeout(orderNotesTimerRef.current);
    orderNotesTimerRef.current = setTimeout(() => {
      if (currentSelectedGuest?.id) {
        updateOrder(currentSelectedGuest.id, { notes: value });
      }
    }, 800);
  };

  // Swipe state for mobile cards
  const [swipeStates, setSwipeStates] = useState<Record<string, number>>({});
  const swipeStatesRef = useRef<Record<string, number>>({});
  const isDraggingRef = useRef(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const startOffsetX = useRef(0);
  const currentCardId = useRef<string | null>(null);
  const currentGuestRef = useRef<GuestOrder | null>(null);
  const hasMoved = useRef(false);
  const suppressNextClickRef = useRef(false);
  const swipeWidth = -120; // Reveal width for action buttons
  const MOVE_THRESHOLD = 10;
  const isInteractiveElement = (target: EventTarget | null) => target instanceof Element && !!target.closest("button,a,input,textarea,select,[role='button']");
  const setCardSwipeX = (cardId: string, x: number) => {
    setSwipeStates(prev => {
      const next = {
        ...prev,
        [cardId]: x
      };
      swipeStatesRef.current = next;
      return next;
    });
  };
  const handleSwipeStart = (e: React.TouchEvent | React.MouseEvent, guest: GuestOrder) => {
    // Allow taps on interactive elements (dropdown buttons etc.) to work normally.
    if (isInteractiveElement(e.target)) {
      isDraggingRef.current = false;
      currentCardId.current = null;
      currentGuestRef.current = null;
      hasMoved.current = false;
      return;
    }
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    startX.current = clientX;
    startY.current = clientY;
    currentCardId.current = guest.id;
    currentGuestRef.current = guest;
    hasMoved.current = false;
    isDraggingRef.current = true;
    startOffsetX.current = swipeStatesRef.current[guest.id] ?? swipeStates[guest.id] ?? 0;
  };
  const handleSwipeMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDraggingRef.current || !currentCardId.current) return;
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    const diffX = clientX - startX.current;
    const diffY = clientY - startY.current;
    const absX = Math.abs(diffX);
    const absY = Math.abs(diffY);

    // Only treat it as a "moved" gesture after a reasonable threshold.
    // This prevents tiny finger jitter from breaking taps.
    if (absX > MOVE_THRESHOLD || absY > MOVE_THRESHOLD) hasMoved.current = true;
    const isHorizontalGesture = absX > absY;

    // If it's mostly vertical, let the ScrollArea do its job (no card swipe).
    if (!isHorizontalGesture) return;

    // Prevent vertical scroll stealing a real horizontal swipe (but only after threshold).
    if ("touches" in e && absX > MOVE_THRESHOLD) {
      e.preventDefault();
    }
    const rawX = startOffsetX.current + diffX;
    const newX = Math.max(swipeWidth, Math.min(rawX, 0));
    setCardSwipeX(currentCardId.current, newX);
  };
  const handleSwipeEnd = (triggerTap: boolean, e?: React.TouchEvent | React.MouseEvent, guestOverride?: GuestOrder) => {
    const guest = guestOverride ?? currentGuestRef.current;
    const cardId = currentCardId.current ?? guest?.id ?? null;
    const isInteractive = isInteractiveElement(e?.target ?? null);
    
    // Track if the card was already swiped open before this gesture
    const wasSwipedOpen = cardId ? (swipeStatesRef.current[cardId] ?? 0) < -20 : false;
    
    // Track if this was a swipe gesture (card moved to a new position)
    const didSwipe = hasMoved.current;
    
    if (cardId && !isInteractive) {
      const currentX = swipeStatesRef.current[cardId] ?? 0;
      const snapTo = currentX < swipeWidth / 2 ? swipeWidth : 0;
      setCardSwipeX(cardId, snapTo);
    }
    isDraggingRef.current = false;
    currentCardId.current = null;
    currentGuestRef.current = null;

    // On mobile, open on touch-end when it was really a tap (no movement, card wasn't swiped open).
    if (triggerTap && !didSwipe && guest && !isInteractive && !wasSwipedOpen) {
      // Suppress the subsequent onClick so we don't double-navigate
      suppressNextClickRef.current = true;
      handleMobileOrderClick(guest);
    } else {
      // For any swipe or swiped-open tap, suppress the onClick
      suppressNextClickRef.current = true;
    }
    hasMoved.current = false;
  };
  const handleCardClick = (guest: GuestOrder) => {
    if (suppressNextClickRef.current) {
      suppressNextClickRef.current = false;
      return;
    }
    // This is a fallback for mouse clicks that bypass touch handlers
    handleMobileOrderClick(guest);
  };
  const getStatusColor = (status: string) => {
    const upperStatus = status?.toUpperCase();
    switch (upperStatus) {
      case "ORDERING":
        return "text-[#F87171]";
      case "PAID":
      case "COMPLETED":
        return "text-green-500";
      case "UNPAID":
        return "text-red-400";
      default:
        return "text-white";
    }
  };
  const getFilterCount = (filter: string) => {
    if (filter === "All") return guestOrders.length;
    if (filter === "Open") return guestOrders.filter(g => g.status === "ORDERING").length;
    if (filter === "Completed") return guestOrders.filter(g => g.status === "COMPLETED").length;
    if (filter === "Paid") return guestOrders.filter(g => g.status === "PAID" || g.paymentType !== "--").length;
    if (filter === "Unpaid") return guestOrders.filter(g => g.status === "UNPAID" || g.paymentType === "--").length;
    if (filter === "Ordering") return guestOrders.filter(g => g.status === "ORDERING").length;
    return 0;
  };
  const filteredGuestOrders = activeFilter === "All" ? guestOrders : guestOrders.filter(guest => {
    switch (activeFilter) {
      case "Open":
        return guest.status === "ORDERING";
      case "Completed":
        return guest.status === "COMPLETED";
      case "Paid":
        return guest.status === "PAID" || guest.paymentType !== "--";
      case "Unpaid":
        return guest.status === "UNPAID" || guest.paymentType === "--";
      case "Ordering":
        return guest.status === "ORDERING";
      default:
        return true;
    }
  });
  const toggleSeat = (seat: number) => {
    setSelectedSeats(prev => prev.includes(seat) ? prev.filter(s => s !== seat) : [...prev, seat]);
  };
  const toggleSeatFilter = (seat: number | 'all') => {
    if (seat === 'all') {
      setSeatFilter(prev => prev.includes('all') ? [] : ['all']);
    } else {
      setSeatFilter(prev => {
        const newFilter = prev.filter(s => s !== 'all');
        if (newFilter.includes(seat)) {
          return newFilter.filter(s => s !== seat);
        } else {
          return [...newFilter, seat];
        }
      });
    }
  };
  const toggleOrderExpand = (orderId: string) => {
    setExpandedOrderId(prev => prev === orderId ? null : orderId);
  };
  const handleMobileOrderClick = (guest: GuestOrder) => {
    setSelectedGuest(guest);
    setShowMobileOrderPanel(true);
  };

  // State for selected split check (for payment)
  const [selectedSplitCheck, setSelectedSplitCheck] = useState<{ orderId: string; checkId: string } | null>(null);

  // Handle split check click - select it for payment
  const handleSplitCheckClick = (parentOrder: GuestOrder, checkData: SplitCheck) => {
    if (checkData.status === 'paid') return; // Don't allow clicking on paid checks
    
    // Create a virtual guest order for the split check
    const splitCheckOrder: GuestOrder = {
      ...parentOrder,
      id: `${parentOrder.id}${checkData.checkId}`,
      name: `Check ${checkData.checkId.toUpperCase()}`,
      items: checkData.items,
      subtotal: checkData.total * 0.85, // Approximate breakdown
      discount: 0,
      serviceCharge: checkData.total * 0.05,
      tax: checkData.total * 0.0735,
      tip: 0,
      total: checkData.total,
      splitConfiguration: undefined, // Individual checks don't have further splits
    };
    
    setSelectedGuest(splitCheckOrder);
    setSelectedSplitCheck({ orderId: parentOrder.id, checkId: checkData.checkId });
    
    // On mobile, show the order panel
    if (window.innerWidth < 768) {
      setShowMobileOrderPanel(true);
    }
  };

  // Helper function to render split check cards
  const renderSplitCheckCard = (
    parentOrder: GuestOrder,
    checkIndex: number,
    checkData: SplitCheck,
    layout: 'mobile' | 'tablet' | 'desktop'
  ) => {
    const checkLetter = checkData.checkId.toUpperCase();
    const checkTotal = checkData.total;
    const isPaid = checkData.status === 'paid';
    const isSelected = selectedSplitCheck?.orderId === parentOrder.id && selectedSplitCheck?.checkId === checkData.checkId;
    
    return (
      <div 
        key={`${parentOrder.id}-check-${checkData.checkId}`}
        className="ml-4 mt-1"
      >
        <div 
          onClick={() => handleSplitCheckClick(parentOrder, checkData)}
          className={`rounded-xl border overflow-hidden cursor-pointer transition-all ${
            isSelected 
              ? 'border-white' 
              : isPaid 
                ? 'border-green-500/50 hover:border-green-500' 
                : 'border-neutral-700 hover:border-neutral-600'
          }`}
          style={{ backgroundColor: '#1B1C20' }}
        >
          {layout === 'mobile' ? (
            // Mobile Layout for split check - matching main ticket layout
            <div className="flex items-stretch w-full">
              {/* Order Number - Mobile compact style */}
              <div className="flex-shrink-0 px-2 py-2 flex items-center">
                <div className="relative w-10 h-12 bg-neutral-800 rounded-lg flex flex-col items-center justify-center border border-neutral-600">
                  <span className="text-lg font-bold text-white">{parentOrder.orderNumber || 0}</span>
                  <span className="text-[9px] text-gray-500">{checkLetter}</span>
                </div>
              </div>

              {/* Guest Info - Mobile compact layout matching main ticket */}
              <div className="flex-1 min-w-0 py-2 pr-2">
                <div className="flex flex-col gap-1">
                  {/* Row 1: Customer Name · Check Letter · Table, Server, Status */}
                  <div className="flex items-center justify-between">
                    <span className="text-white font-medium text-sm">{parentOrder.name} · Check {checkLetter} · {tableId}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm" style={{ color: '#B5B6BB' }}>{parentOrder.server}</span>
                      <span className={`text-sm font-medium ${isPaid ? 'text-green-500' : getStatusColor(parentOrder.status)}`}>
                        {isPaid ? 'PAID' : parentOrder.status}
                      </span>
                    </div>
                  </div>
                  
                  {/* Row 2: Party info, Timer, Total */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs" style={{ color: '#B5B6BB' }}>
                      <img src={dineInIcon} alt="Dine In" className="w-3 h-3 object-contain opacity-60" />
                      <span>Party of {parentOrder.partySize}, {parentOrder.time}</span>
                      <span className="text-gray-500">|</span>
                      <span>{orderTimers[parentOrder.id] || parentOrder.timer}</span>
                    </div>
                    <span className="text-white font-semibold text-sm">{formatPrice(checkTotal)}</span>
                  </div>
                  
                  {/* Row 3: Revenue Center, Payment status, Tip */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm" style={{ color: '#B5B6BB' }}>{parentOrder.revenueCenter}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm" style={{ color: isPaid ? '#4ade80' : '#B5B6BB' }}>
                        {isPaid ? 'Paid' : 'Un Paid'}
                      </span>
                      <span className="text-white text-sm">$0.00</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Tablet/Desktop Layout for split check - matching main ticket 45%/35%/20% layout
            <div className="hidden md:flex items-stretch">
              {/* Left Content with padding */}
              <div className="flex-1 flex items-stretch gap-3 p-3">
                {/* Order Number Box */}
                <div className="flex-shrink-0 flex flex-col items-center justify-center w-14 rounded-lg border border-white/20 py-2 gap-1" style={{ background: '#1A1A1A' }}>
                  <span className="text-lg font-bold text-white">{parentOrder.orderNumber || 0}</span>
                  <span className="text-xs text-white/40">{checkLetter}</span>
                </div>

                {/* Main Content - 3 rows with 45%/35%/20% ratio */}
                <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                  {/* Row 1: Customer Name · Check Letter | Server | Status - 45% | 35% | 20% */}
                  <div className="flex items-center text-xs lg:text-sm">
                    <div className="w-[45%] text-left">
                      <span className="text-white font-medium truncate">{parentOrder.name} · Check {checkLetter}</span>
                    </div>
                    <div className="w-[35%] text-left">
                      <span className="text-white/60 truncate">{parentOrder.server}</span>
                    </div>
                    <div className="w-[20%] text-right">
                      <span className={`font-semibold uppercase ${isPaid ? 'text-green-500' : getStatusColor(parentOrder.status)}`}>
                        {isPaid ? 'PAID' : parentOrder.status}
                      </span>
                    </div>
                  </div>
                  
                  {/* Row 2: Party info + Timer | empty | Total - 45% | 35% | 20% */}
                  <div className="flex items-center text-xs lg:text-sm">
                    <div className="w-[45%] text-left flex items-center gap-1 text-white/60 whitespace-nowrap">
                      <img src={dineInIcon} alt="Dine In" className="w-4 h-4 object-contain opacity-60" />
                      <span>Party of {parentOrder.partySize}, {parentOrder.time}</span>
                      <span className="text-white/40">|</span>
                      <span>{orderTimers[parentOrder.id] || parentOrder.timer}</span>
                    </div>
                    <div className="w-[35%]"></div>
                    <div className="w-[20%] text-right">
                      <span className="text-white font-semibold">{formatPrice(checkTotal)}</span>
                    </div>
                  </div>
                  
                  {/* Row 3: Revenue Center | Payment Status | Tip - 45% | 35% | 20% */}
                  <div className="flex items-center text-xs lg:text-sm">
                    <div className="w-[45%] text-left">
                      <span className="text-white/60 truncate">{parentOrder.revenueCenter}</span>
                    </div>
                    <div className="w-[35%] text-left">
                      <span className="text-white/60 truncate">{isPaid ? 'Paid' : 'Un Paid'}</span>
                    </div>
                    <div className="w-[20%] text-right">
                      <span className="text-white">$0.00</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Action Button - Pay/Receipt */}
              <div className="flex-shrink-0 flex flex-col w-10 overflow-hidden rounded-r-xl">
                {isPaid ? (
                  <button 
                    className="flex-1 flex items-center justify-center hover:opacity-80 transition-opacity bg-neutral-700 hover:bg-neutral-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Handle receipt for individual check
                    }}
                  >
                    <img src={receiptIcon} alt="Receipt" className="w-4 h-4 object-contain" />
                  </button>
                ) : (
                  <button 
                    className="flex-1 flex items-center justify-center hover:opacity-80 transition-opacity"
                    style={{ background: 'linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSplitCheckClick(parentOrder, checkData);
                      setShowPaymentDialog(true);
                    }}
                  >
                    <BadgeDollarSign className="w-4 h-4 text-black" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Mobile Order Panel - render function (not component) to prevent scroll reset
  const renderMobileOrderPanel = () => {
    if (!currentSelectedGuest) return null;
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-neutral-700/50">
          <div className="flex items-center gap-2">
            <button onClick={() => setShowMobileOrderPanel(false)} className="p-1.5 rounded-full hover:opacity-80 transition-opacity" style={{
            background: "#7575754D",
            boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)"
          }}>
              <ChevronLeft className="w-4 h-4 text-white" />
            </button>
            <span className="text-white font-medium">{currentSelectedGuest.name}</span>
          </div>
          <div className="flex items-center gap-3 text-white/50 text-sm">
            <div className="flex items-center gap-1">
              <Phone className="w-3 h-3" />
              <span>{currentSelectedGuest.phone || "N/A"}</span>
            </div>
            <div className="flex items-center gap-1">
              <span>⚡</span>
              <span>{currentSelectedGuest.time}</span>
            </div>
          </div>
        </div>

        {/* Table Order Info */}
        <div className="px-3 py-2 border-b border-neutral-700/50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-white/10 text-white text-xs rounded">TABLE ORDER</span>
              <span className="text-white font-bold">{currentSelectedGuest.orderNumber || 0}</span>
            </div>
            <div className="flex items-center gap-2">
              <img src={runnerIcon} alt="Runner" className="w-4 h-4 opacity-60" />
              <span className="text-white/50 text-sm">{currentSelectedGuest.server}</span>
              <Popover>
                <PopoverTrigger asChild>
                  <button className="ml-2 w-6 h-6 flex items-center justify-center text-white/50 hover:text-white">
                    ⋮
                  </button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-44 p-1 bg-neutral-800 border-white/10" sideOffset={4}>
                  <button className="w-full text-left px-3 py-2 text-sm text-white hover:bg-white/10 rounded" onClick={() => {}}>
                    Print Receipt
                  </button>
                  <button className="w-full text-left px-3 py-2 text-sm text-white hover:bg-white/10 rounded" onClick={() => {}}>
                    Add Discount
                  </button>
                  <button className="w-full text-left px-3 py-2 text-sm text-white hover:bg-white/10 rounded" onClick={() => {}}>
                    Transfer Check
                  </button>
                  <button className="w-full text-left px-3 py-2 text-sm text-white hover:bg-white/10 rounded" onClick={() => setShowMobileOrderPanel(false)}>
                    Close Panel
                  </button>
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          {/* Seat Buttons */}
          <div className="flex items-center gap-2">
            <button className="p-1.5 bg-white/10 rounded hover:bg-white/20 transition-colors">
              <img src={seatIcon} alt="Seat" className="w-4 h-4" />
            </button>
            {Array.from({ length: currentSelectedGuest?.partySize || 4 }, (_, i) => i + 1).map(seat => <button key={seat} onClick={() => toggleSeat(seat)} className={`w-7 h-7 rounded text-sm font-medium transition-colors ${selectedSeats.includes(seat) ? "bg-white text-black" : "bg-white/10 text-white hover:bg-white/20"}`}>
                {seat}
              </button>)}
          </div>
        </div>

        {/* Notes */}
        <div className="px-3 py-2 border-b border-neutral-700/50">
          <div className="flex items-center gap-2 text-white/50 text-sm bg-white/10 p-2 rounded-lg">
            <span>📝</span>
            <span>{currentSelectedGuest.notes || "No notes"}</span>
          </div>
        </div>

        {/* Order Items */}
        <ScrollArea className="flex-1 px-3">
          <div className="py-2 space-y-2">
            {(() => {
              const allSeatsSelected = selectedSeats.length === 4;
              const filteredItems = filterItemsBySeats(currentSelectedGuest.items, selectedSeats, allSeatsSelected);
              return filteredItems.map((item, index) => (
                <div key={index} className="p-3 bg-white/5 rounded-xl border border-white/10">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2">
                      <span className="w-6 h-6 bg-white rounded flex items-center justify-center text-black text-sm font-bold">
                        {item.qty}
                      </span>
                      <div className="flex-1 min-w-0">
                        {(() => {
                          const isTransferredOut = localTransferResult?.sourceOrderId === currentSelectedGuest.id && 
                            localTransferResult.transferredItemNames.includes(item.name);
                          return (
                            <>
                              <span className={`text-white font-medium text-sm ${isTransferredOut ? 'line-through opacity-50' : ''}`}>{item.name}</span>
                              {isTransferredOut && (
                                <div className="flex items-center gap-1 mt-0.5">
                                  <ArrowRightLeft className="w-3 h-3 text-[#8AC4FF]" />
                                  <span className="text-[10px] text-[#8AC4FF]">Transferred to {localTransferResult.destinationLabel}</span>
                                </div>
                              )}
                            </>
                          );
                        })()}
                        {/* Modifiers with tree hierarchy */}
                        {item.modifiers.length > 0 && (() => {
                          const itemKey = `mobile-${currentSelectedGuest.id}-${index}`;
                          const displayedModifiers = expandedCartItems.has(itemKey) ? item.modifiers : item.modifiers.slice(0, 2);
                          const hasShowButton = item.modifiers.length > 2;
                          
                          return (
                            <div className="ml-2 mt-1 relative">
                              {displayedModifiers.map((mod, idx) => {
                                const isAddOn = mod.startsWith("W/") || mod.startsWith("Add");
                                const isRemoval = mod.startsWith("No ") || mod.startsWith("-");
                                const displayMod = isAddOn ? mod.replace("Add: ", "") : mod;
                                const isLastItem = !hasShowButton && idx === displayedModifiers.length - 1;
                                
                                return (
                                  <div key={idx} className="relative flex items-center text-xs py-[2px]">
                                    {/* Vertical line - only show if not last item */}
                                    {!isLastItem && (
                                      <div className="absolute left-0 top-1/2 bottom-0 w-px bg-white" style={{ height: '100%' }} />
                                    )}
                                    {/* Vertical line segment to connect to horizontal */}
                                    <div className="absolute left-0 top-0 h-1/2 w-px bg-white" />
                                    {/* Horizontal connector */}
                                    <div className="absolute left-0 top-1/2 w-2.5 h-px bg-white" />
                                    {/* Content */}
                                    <div className="flex items-center gap-1.5 ml-4">
                                      <span className="text-white">
                                        {isAddOn ? '+' : isRemoval ? '-' : '•'}
                                      </span>
                                      <span className={`text-white/70 ${isRemoval ? 'line-through' : ''}`}>
                                        {displayMod}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                              {hasShowButton && (
                                <div className="relative flex items-center py-[2px]">
                                  {/* Vertical line segment to connect to horizontal (this is the last item) */}
                                  <div className="absolute left-0 top-0 h-1/2 w-px bg-white" />
                                  {/* Horizontal connector */}
                                  <div className="absolute left-0 top-1/2 w-2.5 h-px bg-white" />
                                  <button 
                                    className="text-xs text-white/60 hover:text-white ml-4"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setExpandedCartItems(prev => {
                                        const newSet = new Set(prev);
                                        if (newSet.has(itemKey)) {
                                          newSet.delete(itemKey);
                                        } else {
                                          newSet.add(itemKey);
                                        }
                                        return newSet;
                                      });
                                    }}
                                  >
                                    {expandedCartItems.has(itemKey) ? 'Show less' : `Show more (+${item.modifiers.length - 2})`}
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                    {(() => {
                      const isTransferredOut = localTransferResult?.sourceOrderId === currentSelectedGuest.id && 
                        localTransferResult.transferredItemNames.includes(item.name);
                      return <span className={`text-white font-medium text-sm ${isTransferredOut ? 'line-through opacity-50' : ''}`}>{formatPrice(item.price * item.qty)}</span>;
                    })()}
                  </div>
                  {/* Show seat indicator for all items */}
                  <div className="flex items-center gap-1 mt-2">
                    <img src={seatIcon} alt="Seat" className="w-4 h-4 opacity-50" />
                    {item.isShared || item.seats.length === 0 || item.seats.length === currentSelectedGuest?.partySize ? (
                      <span className="w-5 h-5 rounded bg-white/20 text-white flex items-center justify-center">
                        <Share2 className="w-3 h-3" />
                      </span>
                    ) : (
                      item.seats.map(seat => <span key={seat} className={`w-5 h-5 rounded text-white text-xs flex items-center justify-center ${selectedSeats.includes(seat) ? 'bg-white/30' : 'bg-white/10'}`}>
                          {seat}
                        </span>)
                    )}
                  </div>
                </div>
              ));
            })()}
          </div>
          <ScrollBar orientation="vertical" />
        </ScrollArea>

        {/* Bottom Actions */}
        <div className="px-3 py-3 border-t border-neutral-700/50 flex items-center gap-2">
          {(currentSelectedGuest.status === 'Paid' || currentSelectedGuest.status === 'PAID' || currentSelectedGuest.status === 'Completed') ? (
            /* Paid order actions: Add Tip / Close / Refund */
            showRefundMode ? (
              <button 
                onClick={() => setShowRefundDialog(true)}
                className="flex-1 py-2.5 rounded-full text-white text-sm font-bold"
                style={{ background: 'linear-gradient(180deg, #DC2626 0%, #991B1B 100%)' }}
              >
                REFUND
              </button>
            ) : (
              <>
                {!SettingsManager.getCheckoutOptionsSettings().skipTipScreen && (
                  <button 
                    onClick={() => setShowTipDialog(true)}
                    className="flex-1 py-2.5 rounded-full text-white text-sm font-bold border border-white/20"
                    style={{ background: '#1B1C20' }}
                  >
                    ADD TIP
                  </button>
                )}
                <button 
                  onClick={() => setShowRefundMode(true)}
                  className="flex-1 py-2.5 rounded-full text-black text-sm font-bold"
                  style={{ background: 'linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)' }}
                >
                  CLOSE
                </button>
              </>
            )
          ) : (() => {
            const isFullyTransferredOut = (transferSourceOrderId === currentSelectedGuest?.id && transferType === 'full') ||
              (localTransferResult?.sourceOrderId === currentSelectedGuest?.id && localTransferResult?.transferType === 'full');
            return (
            <>
              <button disabled={isFullyTransferredOut} className={`w-10 h-10 rounded-full bg-red-600 flex items-center justify-center ${isFullyTransferredOut ? 'opacity-40 cursor-not-allowed' : 'hover:bg-red-500'} transition-colors`}>
                <img src={clearIcon} alt="Clear" className="w-4 h-4 brightness-0 invert" />
              </button>
              <button disabled={isFullyTransferredOut} className={`px-4 py-2.5 rounded-full flex items-center gap-1 text-white text-sm font-medium ${isFullyTransferredOut ? 'opacity-40 cursor-not-allowed' : ''}`} style={{
                background: "linear-gradient(180deg, #FF9E65 0%, #FF5E00 100%)"
              }}>
                <img src={fireIcon} alt="Fire" className="w-4 h-4 brightness-0 invert" />
                <span>FIRE</span>
              </button>
              <button 
                disabled={isFullyTransferredOut}
                onClick={() => !isFullyTransferredOut && setShowPaymentDialog(true)}
                className={`flex-1 py-2.5 rounded-full text-black text-sm font-bold ${isFullyTransferredOut ? 'opacity-40 cursor-not-allowed' : ''}`}
                style={{ background: "linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)" }}
              >
                CHARGE {formatPrice(currentSelectedGuest.total - appliedDiscount)}
              </button>
            </>
            );
          })()}
        </div>
      </div>
    );
  };

  // Mobile Layout - render function (not component) to prevent scroll reset
  const renderMobileLayout = () => <div className="flex flex-col h-full bg-black">
      {/* Header */}
      <div className="relative flex items-center justify-between p-2 border-b border-neutral-700/50">
        <button onClick={() => navigate("/tableorder")} className="p-2 rounded-full hover:opacity-80 transition-opacity z-10" style={{
        background: "#7575754D",
        boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)"
      }}>
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        
        <span className="absolute left-1/2 -translate-x-1/2 text-white font-semibold text-lg">{formatTableName(tableId || "")}</span>
        
        <div className="flex items-center gap-2 z-10">
          <button className="p-2 rounded-full hover:opacity-80 transition-opacity" style={{
          background: "#7575754D",
          boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)"
        }}>
            <SlidersHorizontal className="w-4 h-4 text-white" />
          </button>
          <button className="p-2 rounded-full hover:opacity-80 transition-opacity" style={{
          background: "#7575754D",
          boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)"
        }}>
            <Search className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 p-3 overflow-x-auto scrollbar-hide">
        {filters.map(filter => {
        const count = getFilterCount(filter);
        return <button key={filter} onClick={() => setActiveFilter(filter)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-all ${activeFilter === filter ? "text-black" : "text-white"}`} style={activeFilter === filter ? {
          background: "linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)"
        } : {
          background: "#1B1C20"
        }}>
              <span>{filter}</span>
              {count > 0 && <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${activeFilter === filter ? "bg-black text-white" : "bg-neutral-800"}`}>
                  {count}
                </span>}
            </button>;
      })}
      </div>

      {/* Guest Orders List */}
      <ScrollArea className="flex-1 px-3">
        <div className="space-y-2 pb-3">
          {filteredGuestOrders.map((guest, guestIndex) => <div key={guest.id} className="space-y-2">
              {/* Merged Order Indicator - Destination */}
              {destOrderId === guest.id && mergedFromTable && mergedOrderId && <div className="px-2 py-0.5 rounded-t-xl bg-[#392514]">
                  <span className="text-xs font-medium">
                    <span style={{ color: '#FFC48A' }}>Merged</span> <span className="text-white">order {mergedOrderId}</span> <span style={{ color: '#FFC48A' }}>from</span> <span className="text-white">{formatTableName(mergedFromTable)}{mergedSourceArea ? ` (${mergedSourceArea})` : ''}</span>
                  </span>
                </div>}
              {/* Merged Order Indicator - Source (disabled look) */}
              {guest.id === mergedOrderId && destOrderId && <div className="px-2 py-0.5 rounded-t-xl bg-neutral-700/80">
                  <span className="text-xs font-medium">
                    <span className="text-neutral-400">Merged</span> <span className="text-neutral-300">to order {destOrderId}</span> <span className="text-neutral-400">on</span> <span className="text-neutral-300">{formatTableName(tableId || "")}{destOrderArea ? ` (${destOrderArea})` : ''}</span>
                  </span>
                </div>}
              
               {/* Transferred Items Indicator (Destination - receiving items) */}
{(((transferType === 'full' && transferredFromTable && guestIndex === 0) || 
                 (transferType === 'partial' && transferredFromTable && transferredOrderId && (transferDestOrderId === guest.id || guestIndex === 0))) && transferredFromTable !== tableId) || 
                 (guest.transferredFrom && guest.transferredFrom.length > 0 && (virtualTransferOrder.some(v => v.id === guest.id) || (guest as any)?._persistedTransferType)) ? (
                <div className="px-2 py-0.5 rounded-t-xl bg-[#1E3A5F]">
                   <span className="text-xs font-medium">
                     {(() => {
                       const effectiveType = transferType || (guest as any)?._persistedTransferType || 'partial';
                       const sourceTable = transferredFromTable || guest.transferredFrom?.[0]?.table || '';
                       const sourceOrderId = transferredOrderId || guest.transferredFrom?.[0]?.orderId || '';
                       if (effectiveType === 'full') {
                         return (
                           <>
                             <span style={{ color: '#8AC4FF' }}>Order fully transferred from</span>{" "}
                             <span className="text-white">{formatTableName(sourceTable)} · Order #{sourceOrderId}</span>
                           </>
                         );
                       } else {
                         const itemCount = transferredItemNames.length || guest.transferredFrom?.[0]?.items?.length || 0;
                         return (
                           <>
                             <span style={{ color: '#8AC4FF' }}>Transferred</span>{" "}
                             <span className="text-white">{itemCount} item(s)</span>{" "}
                             <span style={{ color: '#8AC4FF' }}>from</span>{" "}
                             <span className="text-white">Order {sourceOrderId} · {formatTableName(sourceTable)}</span>
                           </>
                         );
                       }
                     })()}
                   </span>
                 </div>
               ) : null}
               
               {/* Outgoing Transfer Indicator (Source - items sent out) */}
               {localTransferResult && localTransferResult.sourceOrderId === guest.id && (
                 <div className="px-2 py-0.5 rounded-t-xl bg-[#1E3A5F]">
                   <span className="text-xs font-medium">
                     <span style={{ color: '#8AC4FF' }}>Transferred to</span>{" "}
                     <span className="text-white">{localTransferResult.destinationLabel}</span>
                   </span>
                 </div>
               )}
              <div className={`relative ${(destOrderId === guest.id && mergedFromTable) || (guest.id === mergedOrderId && destOrderId) || ((transferType === 'full' && transferredFromTable && guestIndex === 0) || (transferType === 'partial' && transferredFromTable && transferredOrderId && (transferDestOrderId === guest.id || guestIndex === 0))) || (localTransferResult && localTransferResult.sourceOrderId === guest.id) || (guest.transferredFrom && guest.transferredFrom.length > 0 && virtualTransferOrder.some(v => v.id === guest.id)) ? 'rounded-b-xl' : 'rounded-xl'} cursor-pointer transition-all overflow-hidden bg-black`}>
              {/* Swipe Action Buttons (revealed on swipe left) */}
              {(guest.status === 'Paid' || guest.status === 'PAID' || guest.status === 'Completed') ? (
                /* Receipt and Register buttons for paid orders */
                <div className={`absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2 md:hidden transition-opacity duration-200 z-10 ${(swipeStates[guest.id] || 0) < -20 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                  <button 
                    onMouseDown={e => e.stopPropagation()}
                    onTouchStart={e => e.stopPropagation()}
                    onClick={e => {
                      e.stopPropagation();
                      setReceiptGuest(guest);
                      setShowReceiptDialog(true);
                    }} 
                    className="w-10 h-10 flex items-center justify-center rounded-full transition-colors bg-neutral-700 hover:bg-neutral-600"
                  >
                    <img src={receiptIcon} alt="Receipt" className="w-5 h-5 object-contain" />
                  </button>
                  
                  <button 
                    onMouseDown={e => e.stopPropagation()}
                    onTouchStart={e => e.stopPropagation()}
                    onClick={e => {
                      e.stopPropagation();
                      // Handle register action
                    }} 
                    className="w-10 h-10 flex items-center justify-center rounded-full transition-colors bg-neutral-600 hover:bg-neutral-500"
                  >
                    <img src={registerIcon} alt="Register" className="w-5 h-5 object-contain" />
                  </button>
                </div>
              ) : (
                /* Merge and Transfer buttons for unpaid orders */
                <div className={`absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2 md:hidden transition-opacity duration-200 z-10 ${(swipeStates[guest.id] || 0) < -20 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                  {/* Merge button - orange */}
                  <button 
                    onMouseDown={e => e.stopPropagation()}
                    onTouchStart={e => e.stopPropagation()}
                    onClick={e => {
                      e.stopPropagation();
                      navigate(`/tableorder/${tableId}/merge?orderId=${guest.id}`);
                    }} 
                    className="w-10 h-10 flex items-center justify-center rounded-full transition-colors bg-gradient-to-b from-orange-400 to-orange-600 hover:from-orange-300 hover:to-orange-500"
                  >
                    <img src={mergeIcon} alt="Merge" className="w-5 h-5 object-contain" />
                  </button>
                  
                  {/* Transfer button - gray */}
                  <button 
                    onMouseDown={e => e.stopPropagation()}
                    onTouchStart={e => e.stopPropagation()}
                    onClick={e => {
                      e.stopPropagation();
                      setTransferIntentOrderId(guest.id);
                      setShowTransferIntentDialog(true);
                    }} 
                    className="w-10 h-10 flex items-center justify-center rounded-full transition-colors bg-muted-foreground/60 hover:bg-muted-foreground/80"
                  >
                    <img src={shareOrderIcon} alt="Transfer" className="w-5 h-5 object-contain" />
                  </button>
                </div>
              )}

              {/* Swipeable card content - everything inside moves together */}
              <div className="relative transition-transform duration-200 ease-out md:transform-none bg-black rounded-xl select-none" style={{
              transform: `translateX(${swipeStates[guest.id] || 0}px)`,
              transition: isDraggingRef.current && currentCardId.current === guest.id ? "none" : "transform 0.2s ease-out"
            }} onTouchStart={e => handleSwipeStart(e, guest)} onTouchMove={handleSwipeMove} onTouchEnd={e => handleSwipeEnd(true, e, guest)} onTouchCancel={e => handleSwipeEnd(false, e, guest)} onMouseDown={e => handleSwipeStart(e, guest)} onMouseMove={handleSwipeMove} onMouseUp={e => handleSwipeEnd(true, e, guest)} onMouseLeave={e => handleSwipeEnd(false, e, guest)} onClick={() => handleCardClick(guest)}>
              <div className={`flex items-stretch w-full border rounded-xl bg-neutral-900 ${currentSelectedGuest?.id === guest.id ? 'border-white' : 'border-white/10'}`}>
                   {/* Column 1: Order Number - Mobile compact style */}
                   <div className="md:w-[15%] flex-shrink-0 px-2 py-2 flex items-center md:hidden">
                     <div className="relative w-10 h-12 bg-neutral-800 rounded-lg flex flex-col items-center justify-center border border-neutral-600">
                       <span className="text-lg font-bold text-white">{guest.orderNumber || 0}</span>
                       <span className="text-[9px] text-gray-500">000</span>
                     </div>
                   </div>
                   
                   {/* Column 1: Order Number - Tablet/Desktop style */}
                   <div className="hidden md:flex w-[15%] flex-shrink-0 px-2 py-2 items-center">
                     <div className="relative w-10 h-14 bg-neutral-800 rounded-lg flex flex-col items-center justify-center gap-1 border border-neutral-600">
                       <span className="text-base font-bold text-white">{guest.orderNumber || 0}</span>
                       <img src={tableTargetIcon} alt="Table" className="w-4 h-4 object-cover" />
                     </div>
                   </div>

                   {/* Column 2: Guest Info - Mobile compact layout */}
                   <div className="flex-1 min-w-0 py-2 pr-2 md:hidden">
                      <div className="flex flex-col gap-1">
                         {/* Row 1: Name + Table, Server, Status */}
                         <div className="flex items-center justify-between">
                           <span className="text-white font-medium text-sm">{guest.name} · {tableId}</span>
                           <div className="flex items-center gap-2">
                             <span className="text-sm" style={{ color: '#B5B6BB' }}>{guest.server}</span>
                             <span className={`text-sm font-medium ${getStatusColor(guest.status)}`}>{guest.status === 'Completed' || guest.status === 'COMPLETED' ? 'PAID' : guest.status}</span>
                           </div>
                         </div>
                        
                         {/* Row 2: Party info, Timer, Total */}
                         <div className="flex items-center justify-between">
                           <div className="flex items-center gap-1 text-xs" style={{ color: '#B5B6BB' }}>
                             <img src={dineInIcon} alt="Dine In" className="w-3 h-3 object-contain opacity-60" />
                             <span>Party of {guest.partySize}, {guest.time}</span>
                             <span className="text-gray-500">|</span>
                              <span>{orderTimers[guest.id] || guest.timer}</span>
                           </div>
                           <span className="text-white font-semibold text-sm">{formatPrice(guest.total)}</span>
                         </div>
                        
                         {/* Row 3: Revenue Center, Payment status, Tip */}
                         <div className="flex items-center justify-between">
                           <span className="text-sm" style={{ color: '#B5B6BB' }}>{guest.revenueCenter}</span>
                           <div className="flex items-center gap-2">
                             <span className="text-sm" style={{ color: guest.paymentType === '--' ? '#B5B6BB' : '#4ade80' }}>
                               {guest.paymentType === '--' ? 'Un Paid' : 'Paid'}
                             </span>
                             <span className="text-white text-sm">{guest.tip > 0 ? formatPrice(guest.tip) : '$0.00'}</span>
                           </div>
                        </div>
                      </div>
                   </div>
                   
                   {/* Column 2: Guest Info - Tablet/Desktop layout */}
                   <div className="hidden md:flex flex-1 min-w-0 py-2 pr-0">
                     <div className="flex flex-col w-full">
                       <div className="flex items-start justify-between">
                         <span className="text-white font-medium text-sm">{guest.name}</span>
                         <div className="flex flex-col items-end">
                           <span className="text-white font-semibold text-sm">{formatPrice(guest.total)}</span>
                           {guest.tip > 0 && <span className="text-gray-400 text-xs">+ Tip {formatPrice(guest.tip)}</span>}
                         </div>
                       </div>
                       <div className="h-px bg-neutral-600 my-1.5"></div>
                       <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1 text-gray-400">
                            <img src={dineInIcon} alt="Dine In" className="w-3 h-3 object-contain opacity-60" />
                            <span>Party Of {guest.partySize},</span>
                           <span>⚡ {guest.time}</span>
                         </div>
                         <span className={guest.id === mergedOrderId && destOrderId ? 'text-amber-400' : getStatusColor(guest.status)}>{guest.id === mergedOrderId && destOrderId ? 'MERGED' : (guest.status === 'Completed' || guest.status === 'COMPLETED' ? 'PAID' : guest.status)}</span>
                       </div>
                     </div>
                   </div>

                   {/* Column 3: Action Button - Tablet/Desktop only */}
                   <div className="hidden md:flex flex-shrink-0">
                     <div className="flex flex-col bg-neutral-700 rounded-r-xl overflow-hidden">
                       <button className="flex-1 px-3 py-3 flex items-center justify-center hover:bg-neutral-600 transition-colors" onClick={e => {
                       e.stopPropagation();
                       navigate(`/tableorder/${tableId}/merge?orderId=${guest.id}`);
                     }}>
                         <img src={arrowRightIcon} alt="Arrow" className="w-4 h-4 object-contain" />
                       </button>
                     </div>
                   </div>
                 </div>


                {/* Expanded Details - inside swipeable wrapper */}
                {expandedOrderId === guest.id && <div className="mx-2 px-3 pb-3 rounded-b-lg" style={{
                background: "#7575754D"
              }}>
                    {/* Order Details Grid */}
                    <div className="grid grid-cols-3 gap-3 py-3">
                      <div>
                        <div className="text-white text-sm font-medium">{guest.timer}</div>
                        <div className="text-gray-500 text-xs">Timer</div>
                      </div>
                      <div>
                        <div className="text-white text-sm font-medium">{guest.check}</div>
                        <div className="text-gray-500 text-xs">Check</div>
                      </div>
                      <div>
                        <div className="text-white text-sm font-medium">{guest.server}</div>
                        <div className="text-gray-500 text-xs">Server</div>
                      </div>
                      <div>
                        <div className="text-white text-sm">{guest.revenueCenter}</div>
                        <div className="text-gray-500 text-xs">Revenue Center</div>
                      </div>
                      <div>
                        <div className="text-white text-sm font-medium">{guest.paymentType}</div>
                        <div className="text-gray-500 text-xs">Payment Type</div>
                      </div>
                      <div>
                        <div className="text-white text-sm">--</div>
                        <div className="text-gray-500 text-xs">Tip</div>
                      </div>
                    </div>

                    {/* Action Buttons - hidden for Paid/Completed/Merged orders */}
                    {guest.status !== 'Paid' && guest.status !== 'Completed' && guest.id !== mergedOrderId ? (
                    <div className="flex gap-2 mt-2">
                      <button className="flex-1 py-1.5 flex items-center justify-center gap-2 text-white text-sm font-semibold rounded-full hover:opacity-90 transition-opacity" style={{
                    background: 'linear-gradient(180deg, #FF9E65 0%, #FF5E00 100%)'
                  }} onClick={e => {
                    e.stopPropagation();
                    navigate(`/tableorder/${tableId}/merge?orderId=${guest.id}`);
                  }}>
                        <img src={mergeIcon} alt="Merge" className="w-4 h-4 object-contain" />
                        MERGE
                      </button>
                      <button className="flex-1 py-1.5 flex items-center justify-center gap-2 text-black text-sm font-semibold rounded-full hover:opacity-90 transition-opacity" style={{
                    background: 'linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)'
                  }} onClick={e => {
                    e.stopPropagation();
                    setTransferIntentOrderId(guest.id);
                    setShowTransferIntentDialog(true);
                  }}>
                        <img src={transferIcon} alt="Transfer" className="w-4 h-4 object-contain" style={{
                      filter: 'brightness(0)'
                    }} />
                        TRANSFER
                      </button>
                    </div>
                    ) : guest.id === mergedOrderId ? (
                    null
                    ) : null}
                  </div>}
              </div>
            </div>
            
            {/* Split Check Cards - rendered below main order */}
            {guest.splitConfiguration?.checks && guest.splitConfiguration.checks.length > 0 && (
              <div className="space-y-2">
                {guest.splitConfiguration.checks.map((check, checkIndex) => 
                  renderSplitCheckCard(guest, checkIndex, check, 'mobile')
                )}
              </div>
            )}
          </div>)}
        </div>
        <ScrollBar orientation="vertical" />
      </ScrollArea>

      {/* Add Order Button */}
      <div className="px-3 py-2">
        <button 
          onClick={() => navigate(`/orders?tableId=${tableId}&seats=4&guests=1`)}
          className="w-full py-2 text-black text-sm font-medium rounded-full hover:opacity-90 transition-opacity" 
          style={{ background: "linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)" }}
        >
          ADD ORDER TO TABLE
        </button>
      </div>

      {/* Mobile Order Panel */}
      {showMobileOrderPanel && renderMobileOrderPanel()}
    </div>;

  // Desktop Layout - render function (not component) to prevent scroll reset
  const renderDesktopLayout = () => <div className="flex h-full bg-black">
      {/* Left Panel - Order List */}
      <div className="flex flex-col flex-1 mx-2 mb-2 rounded-[20px] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-2 border-b border-neutral-700/50">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/tableorder")} className="p-2 rounded-full hover:opacity-80 transition-opacity" style={{
            background: "#7575754D",
            boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)"
          }}>
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <span className="text-white font-semibold text-lg">{formatTableName(tableId || "")}</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-full hover:opacity-80 transition-opacity" style={{
            background: "#7575754D",
            boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)"
          }}>
              <SlidersHorizontal className="w-4 h-4 text-white" />
            </button>
            <button className="p-2 rounded-full hover:opacity-80 transition-opacity" style={{
            background: "#7575754D",
            boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)"
          }}>
              <Search className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 p-3 overflow-x-auto">
          {filters.map(filter => {
          const count = getFilterCount(filter);
          return <button key={filter} onClick={() => setActiveFilter(filter)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-all ${activeFilter === filter ? "text-black" : "text-white"}`} style={activeFilter === filter ? {
            background: "linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)"
          } : {
            background: "#7575754D",
            boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)"
          }}>
                <span>{filter}</span>
                {count > 0 && <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${activeFilter === filter ? "bg-black text-white" : "bg-neutral-800"}`}>
                    {count}
                  </span>}
              </button>;
        })}
        </div>

        {/* Guest Orders List */}
        <ScrollArea className="flex-1 px-3">
          <div className="space-y-2 pb-3">
            {filteredGuestOrders.map((guest, guestIndex) => <div key={guest.id} className="space-y-2">
                {/* Merged Order Indicator - Destination */}
                {destOrderId === guest.id && mergedFromTable && mergedOrderId && <div className="px-3 py-1 rounded-t-xl bg-[#392514]">
                    <span className="text-sm font-medium">
                      <span style={{ color: '#FFC48A' }}>Merged</span> <span className="text-white">Order {mergedOrderId}</span> <span style={{ color: '#FFC48A' }}>from</span> <span className="text-white">{formatTableName(mergedFromTable)}{mergedSourceArea ? ` (${mergedSourceArea})` : ''}</span>
                    </span>
                  </div>}
                {/* Merged Order Indicator - Source (disabled look) */}
                {guest.id === mergedOrderId && destOrderId && <div className="px-3 py-1 rounded-t-xl bg-neutral-700/80">
                    <span className="text-sm font-medium">
                      <span className="text-neutral-400">Merged</span> <span className="text-neutral-300">to Order {destOrderId}</span> <span className="text-neutral-400">on</span> <span className="text-neutral-300">{formatTableName(tableId || "")}{destOrderArea ? ` (${destOrderArea})` : ''}</span>
                    </span>
                  </div>}
{/* Transferred Items Indicator (Destination - receiving items) */}
                {/* For full order transfer: show on first order when transferType is 'full' */}
                {/* For partial transfer: show when transferDestOrderId matches */}
{(((transferType === 'full' && transferredFromTable && guestIndex === 0) || 
                  (transferType === 'partial' && transferredFromTable && transferredOrderId && (transferDestOrderId === guest.id || guestIndex === 0))) && transferredFromTable !== tableId) ||
                  (guest.transferredFrom && guest.transferredFrom.length > 0 && (virtualTransferOrder.some(v => v.id === guest.id) || (guest as any)?._persistedTransferType)) ? (
                    <div className="px-3 py-1 rounded-t-xl bg-[#1E3A5F]">
                    <span className="text-sm font-medium">
                      {(() => {
                        const effectiveType = transferType || (guest as any)?._persistedTransferType || 'partial';
                        const sourceTable = transferredFromTable || guest.transferredFrom?.[0]?.table || '';
                        const sourceOrderId = transferredOrderId || guest.transferredFrom?.[0]?.orderId || '';
                        if (effectiveType === 'full') {
                          return (
                            <>
                              <span style={{ color: '#8AC4FF' }}>Order fully transferred from</span>{" "}
                              <span className="text-white">{formatTableName(sourceTable)} · Order #{sourceOrderId}</span>
                            </>
                          );
                        } else {
                          const itemCount = transferredItemNames.length || guest.transferredFrom?.[0]?.items?.length || 0;
                          return (
                            <>
                              <span style={{ color: '#8AC4FF' }}>Transferred</span>{" "}
                              <span className="text-white">{itemCount} item(s)</span>{" "}
                              <span style={{ color: '#8AC4FF' }}>from</span>{" "}
                              <span className="text-white">Order {sourceOrderId} · {formatTableName(sourceTable)}</span>
                            </>
                          );
                        }
                      })()}
                    </span>
                  </div>
                ) : null}
                {/* Transferred OUT Indicator (Source - sending items out) */}
                {transferSourceOrderId === guest.id && transferType && <div className="px-3 py-1 rounded-t-xl bg-[#1E3A5F]">
                    <span className="text-sm font-medium">
                      <span style={{ color: '#8AC4FF' }}>{transferType === 'full' ? 'Fully Transferred' : `Transferred (${transferredOutItemNames.length}) item${transferredOutItemNames.length !== 1 ? 's' : ''}`}</span>
                      <span className="text-white"> to {formatTableName(transferToTable || "")}{transferDestArea ? ` (${transferDestArea})` : ''}</span>
                      {transferredToOrderId && transferredToOrderId !== 'new' && transferredToOrderId !== transferSourceOrderId && (
                        <>
                          <span style={{ color: '#8AC4FF' }}> · </span>
                          <span className="text-white">Order #{transferredToOrderId}</span>
                        </>
                      )}
                    </span>
                  </div>}
                {/* Local Transfer Result - Outgoing (stays on same page) */}
                {localTransferResult && localTransferResult.sourceOrderId === guest.id && (
                  <div className="px-3 py-1 rounded-t-xl bg-[#1E3A5F]">
                    <span className="text-sm font-medium">
                      <span style={{ color: '#8AC4FF' }}>Transferred to</span>{" "}
                      <span className="text-white">{localTransferResult.destinationLabel}</span>
                    </span>
                  </div>
                )}
                <div onClick={() => setSelectedGuest(guest)} className={`overflow-hidden ${(destOrderId === guest.id && mergedFromTable) || ((transferType === 'full' && transferredFromTable && guestIndex === 0) || (transferType === 'partial' && transferredFromTable && transferredOrderId && (transferDestOrderId === guest.id || guestIndex === 0))) || (transferSourceOrderId === guest.id && transferType) || (guest.id === mergedOrderId && destOrderId) || (localTransferResult && localTransferResult.sourceOrderId === guest.id) || (guest.transferredFrom && guest.transferredFrom.length > 0 && (virtualTransferOrder.some(v => v.id === guest.id) || (guest as any)?._persistedTransferType)) ? 'rounded-b-xl' : 'rounded-xl'} border cursor-pointer transition-all ${currentSelectedGuest?.id === guest.id ? "border-white" : "border-neutral-700 hover:border-neutral-600"}`} style={{
              backgroundColor: '#1B1C20'
            }}>
                <div className="hidden md:flex items-stretch">
                  {/* Left Content with padding */}
                  <div className="flex-1 flex items-stretch gap-3 p-3">
                    {/* Order Number Box */}
                    <div className="flex-shrink-0 flex flex-col items-center justify-center w-14 rounded-lg border border-white/20 py-2 gap-1" style={{ background: '#1A1A1A' }}>
                      <span className="text-lg font-bold text-white">{guest.orderNumber || 0}</span>
                      <span className="text-xs text-white/40">000</span>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                      {/* Row 1: Name | Server | Status - 45% | 35% | 20% */}
                      <div className="flex items-center text-xs lg:text-sm">
                        <div className="w-[45%] text-left">
                          <span className="text-white font-medium truncate">{guest.name}</span>
                        </div>
                        <div className="w-[35%] text-left">
                          <span className="text-white/60 truncate">{guest.server}</span>
                        </div>
                        <div className="w-[20%] text-right">
                          <span 
                            className={`font-semibold uppercase ${guest.id === mergedOrderId && destOrderId ? 'text-amber-400' : getStatusColor(guest.status)}`}
                          >
                            {guest.id === mergedOrderId && destOrderId ? 'MERGED' : (guest.status === 'Completed' || guest.status === 'COMPLETED' ? 'PAID' : guest.status)}
                          </span>
                        </div>
                      </div>
                      
                      {/* Row 2: Party info + Timer | empty | Total - 45% | 35% | 20% */}
                      <div className="flex items-center text-xs lg:text-sm">
                        <div className="w-[45%] text-left flex items-center gap-1 text-white/60 whitespace-nowrap">
                          <img src={dineInIcon} alt="Dine In" className="w-4 h-4 object-contain opacity-60" />
                          <span>Party of {guest.partySize}, {guest.time}</span>
                          <span className="text-white/40">|</span>
                          <span>{orderTimers[guest.id] || guest.timer}</span>
                        </div>
                        <div className="w-[35%]"></div>
                        <div className="w-[20%] text-right">
                          <span className="text-white font-semibold">{formatPrice(guest.total)}</span>
                        </div>
                      </div>
                      
                      {/* Row 3: Revenue Center | Payment Status | Tip - 45% | 35% | 20% */}
                      <div className="flex items-center text-xs lg:text-sm">
                        <div className="w-[45%] text-left">
                          <span className="text-white/60 truncate">{guest.revenueCenter}</span>
                        </div>
                        <div className="w-[35%] text-left">
                          {guest.status === 'Paid' || guest.status === 'PAID' || guest.status === 'Completed' 
                            ? <MultiPaymentDisplay paymentMethods={guest.paymentMethods} paymentType={guest.paymentType} />
                            : <span className="text-white/60 truncate">Pending Payment</span>}
                        </div>
                        <div className="w-[20%] text-right">
                          <span className="text-white">{guest.tip > 0 ? formatPrice(guest.tip) : '$0.00'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Action Buttons - Edge to edge */}
                  {(() => {
                    const hasAlertAbove = (destOrderId === guest.id && mergedFromTable) || (transferDestOrderId === guest.id && transferredFromTable) || (transferSourceOrderId === guest.id && transferType) || (guest.id === mergedOrderId && destOrderId);
                    
                    if (guest.status === 'Paid' || guest.status === 'PAID' || guest.status === 'Completed') {
                      return (
                        /* Receipt and Register buttons for paid orders */
                        <div className={`flex-shrink-0 flex flex-col w-10 overflow-hidden ${hasAlertAbove ? 'rounded-br-xl' : 'rounded-r-xl'}`}>
                          <button 
                            className="flex-1 flex items-center justify-center hover:opacity-80 transition-opacity bg-neutral-700 hover:bg-neutral-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              setReceiptGuest(guest);
                              setShowReceiptDialog(true);
                            }}
                          >
                            <img src={receiptIcon} alt="Receipt" className="w-4 h-4 object-contain" />
                          </button>
                          <button 
                            className="flex-1 flex items-center justify-center hover:opacity-80 transition-opacity bg-neutral-600 hover:bg-neutral-500"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Handle register action
                            }}
                          >
                            <img src={registerIcon} alt="Register" className="w-4 h-4 object-contain" />
                          </button>
                        </div>
                      );
                    } else if (guest.id === mergedOrderId && destOrderId) {
                      // Receipt and Register buttons for merged source orders
                      return (
                        <div className={`flex-shrink-0 flex flex-col w-10 overflow-hidden ${hasAlertAbove ? 'rounded-br-xl' : 'rounded-r-xl'}`}>
                          <button 
                            className="flex-1 flex items-center justify-center hover:opacity-80 transition-opacity bg-neutral-700 hover:bg-neutral-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Open receipt for the merged destination order (combined receipt)
                              const destGuest = guestOrders.find(g => g.id === destOrderId);
                              if (destGuest) {
                                setReceiptGuest(destGuest);
                                setShowReceiptDialog(true);
                              }
                            }}
                          >
                            <img src={receiptIcon} alt="Receipt" className="w-4 h-4 object-contain" />
                          </button>
                          <button 
                            className="flex-1 flex items-center justify-center hover:opacity-80 transition-opacity bg-neutral-600 hover:bg-neutral-500"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Handle register action for merged order
                            }}
                          >
                            <img src={registerIcon} alt="Register" className="w-4 h-4 object-contain" />
                          </button>
                        </div>
                      );
                    } else if (guest.id !== mergedOrderId && !(guest.id === transferSourceOrderId && transferType === 'full')) {
                      return (
                        /* Merge and Transfer buttons for unpaid orders */
                        <div className={`flex-shrink-0 flex flex-col w-10 overflow-hidden ${hasAlertAbove ? 'rounded-br-xl' : 'rounded-r-xl'}`}>
                          <button 
                            className="flex-1 flex items-center justify-center hover:opacity-80 transition-opacity"
                            style={{ background: 'linear-gradient(180deg, #FF9E65 0%, #FF5E00 100%)' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/tableorder/${tableId}/merge?orderId=${guest.id}`);
                            }}
                          >
                            <img src={arrowRightIcon} alt="Merge" className="w-4 h-4 object-contain" />
                          </button>
                          <button 
                            className="flex-1 flex items-center justify-center hover:opacity-80 transition-opacity"
                            style={{ background: 'linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setTransferIntentOrderId(guest.id);
                              setShowTransferIntentDialog(true);
                            }}
                          >
                            <img src={shareOrderIcon} alt="Transfer" className="w-4 h-4 object-contain brightness-0" />
                          </button>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>

                {/* Mobile Layout - Keep existing */}
                <div className="flex md:hidden items-stretch w-full gap-4">
                  {/* Column 1: Order Number */}
                  <div className="w-[15%] flex-shrink-0 px-3 py-2 flex items-center">
                    <div className="relative w-12 h-16 bg-neutral-800 rounded-lg flex flex-col items-center justify-center gap-2 border border-neutral-600">
                      <span className="text-lg font-bold text-white">{guest.id}</span>
                      <img src={tableTargetIcon} alt="Table" className="w-5 h-5 object-cover" />
                    </div>
                  </div>

                  {/* Column 2: Guest Info */}
                  <div className="flex-1 min-w-0 py-2">
                    <div className="flex flex-col">
                      <div className="flex items-start justify-between">
                        <span className="text-white font-medium text-sm">{guest.name}</span>
                        <div className="flex flex-col items-end">
                          <span className="text-white font-semibold text-sm">{formatPrice(guest.total)}</span>
                          {guest.tip > 0 && <span className="text-gray-400 text-xs">+ Tip {formatPrice(guest.tip)}</span>}
                        </div>
                      </div>
                      <div className="h-px bg-neutral-600 my-1.5"></div>
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1 text-gray-400">
                          <img src={dineInIcon} alt="Dine In" className="w-3 h-3 object-contain opacity-60" />
                          <span>Party Of {guest.partySize},</span>
                          <span>⚡ {guest.time}</span>
                        </div>
                        <span className={getStatusColor(guest.status)}>{guest.status}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Split Check Cards - rendered below main order */}
              {guest.splitConfiguration?.checks && guest.splitConfiguration.checks.length > 0 && (
                <div className="space-y-2">
                  {guest.splitConfiguration.checks.map((check, checkIndex) => 
                    renderSplitCheckCard(guest, checkIndex, check, 'desktop')
                  )}
                </div>
              )}
            </div>)}
          </div>
          <ScrollBar orientation="vertical" />
        </ScrollArea>

        {/* Add Order Button */}
        <div className="p-3 border-t border-neutral-700/50">
          <button 
            onClick={() => navigate(`/orders?tableId=${tableId}&seats=4&guests=1`)}
            className="w-full py-2 text-sm text-black font-medium rounded-full hover:opacity-90 transition-opacity" 
            style={{ background: "linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)" }}
          >
            ADD ORDER TO TABLE
          </button>
        </div>
      </div>

      {/* Right Panel - Order Details */}
      {(() => {
        const mergedPanelData = getMergedPanelData(destOrderId, mergedOrderId, mergedFromTable, allDbOrders);
        // Only show merged panel if the currently selected guest is the merge destination
        const showMergedPanel = mergedPanelData && currentSelectedGuest?.id === destOrderId;
        
        return showMergedPanel ? (
          <MergedOrderPanel 
            guestName={mergedPanelData.guestName} 
            phone={mergedPanelData.phone} 
            time={mergedPanelData.time} 
            server={mergedPanelData.server} 
            tableId={tableId || ""} 
            mergedOrderIds={mergedPanelData.orders.map(o => o.id)} 
            orders={mergedPanelData.orders}
            onReceiptClick={() => {
              const destGuest = guestOrders.find(g => g.id === destOrderId);
              if (destGuest) {
                setReceiptGuest(destGuest);
                setShowReceiptDialog(true);
              }
            }}
            onRegisterClick={() => {
              // Handle register action for merged order
            }}
          />
        ) : (
          <div className="w-[345px] flex flex-col m-2 ml-0">
        {/* Guest Header - Outside the box */}
        <div className="px-2 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white font-medium">{currentSelectedGuest?.name}</span>
            <div className="flex items-center gap-3 text-white/50 text-sm">
              <div className="flex items-center gap-1">
                <Phone className="w-3 h-3" />
                <span>{currentSelectedGuest?.phone || "No phone"}</span>
              </div>
              <div className="flex items-center gap-1">
                <span>⚡</span>
                <span>{currentSelectedGuest?.time}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {currentSelectedGuest?.status?.toUpperCase() !== 'PAID' && currentSelectedGuest?.status?.toUpperCase() !== 'COMPLETED' && (
              <>
                {selectedSplitCheck ? (
                  // Show Merge button for split check tickets
                  <button 
                    className="text-[10px] rounded-[10px] bg-[#666666] hover:bg-[#555555] border border-sidebar-border h-6 px-3 whitespace-nowrap flex items-center gap-1.5 text-white transition-colors"
                    onClick={() => {
                      // Find the parent order and clear its split configuration
                      const parentOrderId = selectedSplitCheck.orderId;
                      const sessionId = getSessionIdForOrder(parentOrderId);
                      
                      if (sessionId) {
                        // Clear split config from session order
                        saveSplitConfiguration(sessionId, undefined as any);
                      } else {
                        // Clear from static splits
                        const splitKey = `${tableId}:${parentOrderId}`;
                        setStaticSplitConfigs(prev => {
                          const newConfigs = { ...prev };
                          delete newConfigs[splitKey];
                          return newConfigs;
                        });
                      }
                      
                      // Find and select the parent order
                      const parentOrder = guestOrders.find(g => g.id === parentOrderId);
                      if (parentOrder) {
                        setSelectedGuest(parentOrder);
                      }
                      setSelectedSplitCheck(null);
                    }}
                  >
                    <img src={linkMergeIcon} alt="" className="w-3 h-3" />
                    Merge
                  </button>
                ) : (
                  // Show Add Item button for regular orders
                  <button 
                    className="text-[10px] rounded-[10px] bg-[#666666] hover:bg-[#555555] border border-sidebar-border h-6 px-3 whitespace-nowrap flex items-center gap-1.5 text-white transition-colors"
                    onClick={() => navigate(`/orders?orderId=${currentSelectedGuest?.id}&tableId=${tableId}&mode=addItem`)}
                  >
                    <img src={receiptIcon} alt="" className="w-3 h-3" />
                    Add Item
                  </button>
                )}
                <button 
                  className={`text-[10px] rounded-[10px] ${selectedDiscountId ? 'bg-orange-500/20 border-orange-500' : 'bg-[#666666] border-sidebar-border'} hover:bg-[#555555] border h-6 px-3 whitespace-nowrap flex items-center gap-1.5 text-white transition-colors`}
                  onClick={() => {
                    setDiscountDialogView('mpin');
                    setDiscountPin("");
                    setShowDiscountDialog(true);
                  }}
                >
                  <img src={discountBtnIcon} alt="" className="w-3 h-3" />
                  Discount
                </button>
              </>
            )}
            <button className="text-[10px] rounded-[10px] bg-[#666666] hover:bg-[#555555] border border-sidebar-border h-6 px-3 whitespace-nowrap flex items-center gap-1.5 text-white transition-colors">
              <img src={receiptIcon} alt="" className="w-3 h-3" />
              Receipt
            </button>
            <button className="text-[10px] rounded-[10px] bg-[#666666] hover:bg-[#555555] border border-sidebar-border h-6 px-3 whitespace-nowrap flex items-center gap-1.5 text-white transition-colors">
              <img src={registerIcon} alt="" className="w-3 h-3" />
              Register
            </button>
          </div>
        </div>

        {/* Main Panel Box */}
        <div className="flex-1 flex flex-col rounded-[10px] overflow-hidden" style={{
        background: "#7575754D",
        boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)"
      }}>

        {/* Table Order Header - Row 1 */}
        <div className="flex items-center justify-between px-2 py-2 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <span className="bg-neutral-700 border border-neutral-600 px-2 py-1 rounded text-xs font-medium text-white">
              TABLE {tableId?.replace("T", "")}
            </span>
            <Users className="w-4 h-4 text-neutral-400" />
            <span className="text-neutral-400 text-xs">{currentSelectedGuest?.items.length || 0}</span>
            <span className="font-bold text-white text-sm">{currentSelectedGuest?.name || "Guest"}</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <img src={runnerIcon} alt="Server" className="w-4 h-4 opacity-80" />
            <span className="text-neutral-400">{currentSelectedGuest?.server || "Unassigned"}</span>
          </div>
        </div>
        
        {/* Table Order Header - Row 2: Seat buttons */}
        <div className="flex items-center gap-1.5 px-2 py-1.5 border-b border-sidebar-border">
          <button className="p-1 bg-neutral-700 rounded hover:bg-neutral-600 transition-colors">
            <img src={chairWhiteIcon} alt="Chair" className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={() => toggleSeatFilter('all')}
            className={`p-1 rounded transition-colors ${
              seatFilter.includes('all') 
                ? 'bg-white' 
                : 'bg-neutral-700 hover:bg-neutral-600'
            }`}
          >
            <Share2 className={`w-3.5 h-3.5 ${seatFilter.includes('all') ? 'text-black' : 'text-white'}`} />
          </button>
          {Array.from({ length: currentSelectedGuest?.partySize || 4 }, (_, i) => i + 1).map((seat) => (
            <button
              key={seat}
              onClick={() => toggleSeatFilter(seat)}
              className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold transition-colors ${
                seatFilter.includes(seat) 
                  ? 'bg-white text-black' 
                  : 'bg-neutral-600 text-white hover:bg-neutral-500'
              }`}
            >
              {seat}
            </button>
          ))}
        </div>

        {/* Order Notes */}
        <div className="px-2 py-1.5 border-b border-sidebar-border flex-shrink-0">
          <OrderNotesAutocomplete
            value={orderNotes}
            onChange={handleOrderNotesChange}
            placeholder="Order notes and Allergies"
          />
        </div>

        {/* Transfer info banner - below order notes (hide on source order for partial transfers) */}
        {currentSelectedGuest?.transferredFrom && currentSelectedGuest.transferredFrom.length > 0 && 
         !(transferSourceOrderId === currentSelectedGuest?.id) && (
          <div className="px-3 py-1.5 border-b border-sidebar-border flex-shrink-0">
            {currentSelectedGuest.transferredFrom.map((source, sourceIdx) => {
              const effectiveTransferType = transferType || (currentSelectedGuest as any)?._persistedTransferType || 'partial';
              return (
                <div key={sourceIdx} className="flex items-center gap-2">
                  <img src={transferIcon} alt="Transferred" className="w-4 h-4" style={{ filter: 'brightness(0) saturate(100%) invert(68%) sepia(53%) saturate(456%) hue-rotate(182deg) brightness(103%) contrast(101%)' }} />
                  <span className="text-xs font-medium" style={{ color: '#8AC4FF' }}>
                    {effectiveTransferType === 'full' ? (
                      <>Order fully transferred from {formatTableName(source.table)} · Order #{source.orderId}</>
                    ) : (
                      <>{source.items?.length || 0} item{(source.items?.length || 0) !== 1 ? 's' : ''} transferred from {formatTableName(source.table)} · Order #{source.orderId}</>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        )}
        
        {/* Local Transfer Result - Outgoing info banner */}
        {localTransferResult && localTransferResult.sourceOrderId === currentSelectedGuest?.id && (
          <div className="px-3 py-1.5 border-b border-sidebar-border flex-shrink-0">
            <div className="flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-[#8AC4FF]" />
              <span className="text-xs font-medium" style={{ color: '#8AC4FF' }}>
                Transferred to {localTransferResult.destinationLabel}
              </span>
            </div>
          </div>
        )}

        {/* URL-based Transfer Outgoing info banner */}
        {transferSourceOrderId && transferSourceOrderId === currentSelectedGuest?.id && transferType && (
          <div className="px-3 py-1.5 border-b border-sidebar-border flex-shrink-0">
            <div className="flex items-center gap-2">
              <img src={transferIcon} alt="Transferred" className="w-4 h-4" style={{ filter: 'brightness(0) saturate(100%) invert(68%) sepia(53%) saturate(456%) hue-rotate(182deg) brightness(103%) contrast(101%)' }} />
              <span className="text-xs font-medium" style={{ color: '#8AC4FF' }}>
                {transferType === 'full' ? 'Fully Transferred' : `Transferred (${transferredOutItemNames.length}) item${transferredOutItemNames.length !== 1 ? 's' : ''}`} to {formatTableName(transferToTable || '')}{transferDestArea ? ` (${transferDestArea})` : ''}{transferredToOrderId && transferredToOrderId !== 'new' && transferredToOrderId !== transferSourceOrderId ? ` · Order #${transferredToOrderId}` : ''}
              </span>
            </div>
          </div>
        )}

        {/* Order Items */}
        <ScrollArea className="flex-1 min-h-0 px-2">
          <div className="py-1 space-y-1">
            {/* Transferred Items at top */}
            {currentSelectedGuest?.transferredFrom && currentSelectedGuest.transferredFrom.length > 0 && 
             !(transferSourceOrderId === currentSelectedGuest?.id && transferType === 'full') && (
              <div className="mb-2 pb-2 border-b border-white/10">
                {currentSelectedGuest.transferredFrom.map((source, sourceIdx) => (
                  <div key={sourceIdx}>
                    <div className="space-y-1">
                      {source.items.map((item, index) => (
                        <SwipeableCartItem
                          key={`transferred-${sourceIdx}-${index}`}
                          onDelete={() => {}}
                          itemOrderType="Dine In"
                          onOrderTypeChange={() => {}}
                          isOpen={activeSwipedItemId === `transferred-${sourceIdx}-${index}`}
                          onSwipeStart={() => setActiveSwipedItemId(`transferred-${sourceIdx}-${index}`)}
                        >
                          <div 
                            className="p-2 border border-[#3B6A9E] rounded-md cursor-pointer" 
                            style={{ background: 'linear-gradient(180deg, #1E3A5F 0%, #2A4A6F 100%)' }}
                          >
                            <div className="flex items-start gap-2">
                              <span className="w-5 h-5 rounded bg-[#3B6A9E] text-white text-xs font-medium flex items-center justify-center flex-shrink-0">
                                {item.qty}
                              </span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium text-white">{item.name}</span>
                                  <span className="text-sm font-medium text-white/80">
                                    {formatPrice(item.price * item.qty)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </SwipeableCartItem>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {currentSelectedGuest && !virtualTransferOrder.some(v => v.id === currentSelectedGuest.id) && (() => {
              const allSeatsSelected = seatFilter.includes('all') || seatFilter.length === 0;
              const numericSeats = seatFilter.filter((s): s is number => typeof s === 'number');
              const filteredItems = filterItemsBySeats(currentSelectedGuest.items, numericSeats, allSeatsSelected);
              return filteredItems.map((item, index) => (
                <SwipeableCartItem 
                  key={`${currentSelectedGuest.id}-${index}`}
                  onDelete={() => {}}
                  itemOrderType="Dine In"
                  onOrderTypeChange={() => {}}
                  isOpen={activeSwipedItemId === `${currentSelectedGuest.id}-${index}`}
                  onSwipeStart={() => setActiveSwipedItemId(`${currentSelectedGuest.id}-${index}`)}
                >
                  <div 
                    className="p-2 border border-sidebar-border rounded-md cursor-pointer" 
                    style={{ background: 'linear-gradient(180deg, #4D4D4D 0%, #616161 100%)' }}
                  >
                    <div className="flex flex-col">
                      {/* Item header row */}
                      <div className="flex items-start gap-2">
                        <span className="w-6 h-6 rounded bg-neutral-700 border border-neutral-600 text-white text-xs font-medium flex items-center justify-center flex-shrink-0">
                          {item.qty}
                        </span>
                        <div className="flex-1 min-w-0">
                          {(() => {
                            // Check if this item was transferred out (via URL params or local state)
                            const isTransferredOut = (transferSourceOrderId === currentSelectedGuest.id && 
                              transferredOutItemNames.includes(item.name)) ||
                              (localTransferResult?.sourceOrderId === currentSelectedGuest.id && 
                              localTransferResult.transferredItemNames.includes(item.name));
                            const transferDestLabel = localTransferResult?.sourceOrderId === currentSelectedGuest.id
                              ? localTransferResult.destinationLabel
                              : (transferredToOrderId ? `Order #${transferredToOrderId} · ${formatTableName(transferToTable || '')}` : '');
                            return (
                              <>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1">
                                    <span className={`text-sm font-medium text-foreground ${isTransferredOut ? 'line-through opacity-50' : ''}`}>
                                      {item.name}
                                    </span>
                                  </div>
                                  <span className={`text-sm font-medium text-foreground ${isTransferredOut ? 'line-through opacity-50' : ''}`}>
                                    {formatPrice(item.price * item.qty)}
                                  </span>
                                </div>
                                {/* Per-item transfer label removed - shown as common banner below order notes */}
                              </>
                            );
                          })()}
                          
                          {/* Modifiers with tree hierarchy */}
                          {item.modifiers.length > 0 && (() => {
                            const itemKey = `desktop-${currentSelectedGuest.id}-${index}`;
                            const displayedModifiers = expandedCartItems.has(itemKey) ? item.modifiers : item.modifiers.slice(0, 2);
                            const hasShowButton = item.modifiers.length > 2;
                            
                            return (
                              <div className="mt-1 ml-3 relative">
                                {displayedModifiers.map((mod, idx) => {
                                  const isAddOn = mod.startsWith("W/") || mod.startsWith("Add");
                                  const isRemoval = mod.startsWith("No ") || mod.startsWith("-");
                                  const displayMod = isAddOn ? mod.replace("Add: ", "") : mod;
                                  const isLastItem = !hasShowButton && idx === displayedModifiers.length - 1;
                                  
                                  return (
                                    <div key={idx} className="relative flex items-center text-xs py-[3px]">
                                      {/* Vertical line - only show if not last item */}
                                      {!isLastItem && (
                                        <div className="absolute left-0 top-1/2 bottom-0 w-px bg-white" style={{ height: '100%' }} />
                                      )}
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
                                    </div>
                                  );
                                })}
                                {hasShowButton && (
                                  <div className="relative flex items-center py-[3px]">
                                    {/* Vertical line segment to connect to horizontal (this is the last item) */}
                                    <div className="absolute left-0 top-0 h-1/2 w-px bg-white" />
                                    {/* Horizontal connector */}
                                    <div className="absolute left-0 top-1/2 w-3 h-px bg-white" />
                                    <button 
                                      className="text-xs text-white/60 hover:text-white ml-5"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setExpandedCartItems(prev => {
                                          const newSet = new Set(prev);
                                          if (newSet.has(itemKey)) {
                                            newSet.delete(itemKey);
                                          } else {
                                            newSet.add(itemKey);
                                          }
                                          return newSet;
                                        });
                                      }}
                                    >
                                      {expandedCartItems.has(itemKey) ? 'Show less' : `Show more (+${item.modifiers.length - 2})`}
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                          
                          {/* Seat Assignment Display */}
                          {/* Show seat indicator for all items */}
                          <div className="mt-1.5 flex items-center gap-1.5">
                            <img src={chairWhiteIcon} alt="Seats" className="w-4 h-4 opacity-70" />
                            {item.isShared || item.seats.length === 0 || item.seats.length === currentSelectedGuest?.partySize ? (
                              <span className="w-5 h-5 rounded bg-neutral-700 text-white flex items-center justify-center">
                                <Share2 className="w-3 h-3" />
                              </span>
                            ) : (
                              item.seats.map(seat => (
                                <span 
                                  key={seat}
                                  className="w-5 h-5 rounded bg-neutral-700 text-white text-[10px] font-medium flex items-center justify-center"
                                >
                                  {seat}
                                </span>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </SwipeableCartItem>
              ));
            })()}
            
            {/* Transferred items moved to bottom - handled at top of scroll area */}
          </div>
          <ScrollBar orientation="vertical" />
        </ScrollArea>

        {/* Order Summary */}
        <div className="p-2 border-t border-sidebar-border flex-shrink-0">
          <div className="text-xs rounded px-2 py-1.5 space-y-0.5" style={{
            background: '#7575754D',
            boxShadow: 'inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)'
          }}>
            <div className="flex justify-between gap-3">
              <span className="text-foreground">Sub Total: <span className="font-medium">{formatPrice(currentSelectedGuest?.subtotal || 0)}</span></span>
              <span className="text-white">Discount: <span className="font-medium">{formatPrice((currentSelectedGuest?.discount || 0) + appliedDiscount)}</span></span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-foreground">Service Charge: <span className="font-medium text-primary">+{formatPrice(currentSelectedGuest?.serviceCharge || 0)}</span></span>
              <span className="text-foreground">Tax: <span className="font-medium">{formatPrice(currentSelectedGuest?.tax || 0)}</span></span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="px-2 py-2 flex items-center gap-3 flex-shrink-0">
            {currentSelectedGuest?.status?.toUpperCase() === 'PAID' || currentSelectedGuest?.status?.toUpperCase() === 'COMPLETED' ? (
              <>
                {showRefundMode ? (
                  /* Refund Button - shown after clicking Close */
                  <button 
                    onClick={() => setShowRefundDialog(true)}
                    className="flex-1 h-10 rounded-full flex items-center justify-center" 
                    style={{ background: 'linear-gradient(180deg, #DC2626 0%, #991B1B 100%)' }}
                  >
                    <span className="text-white font-semibold text-sm">REFUND</span>
                  </button>
                ) : (
                  <>
                    {!SettingsManager.getCheckoutOptionsSettings().skipTipScreen && (
                      <>
                        {/* Add Tip Button */}
                        <button 
                          onClick={() => setShowTipDialog(true)}
                          className="flex-1 h-10 rounded-full flex items-center justify-center border border-white/20"
                          style={{ background: '#1B1C20' }}
                        >
                          <span className="text-white font-semibold text-sm">ADD TIP</span>
                        </button>
                      </>
                    )}
                    {/* Close Button */}
                    <button 
                      onClick={() => setShowRefundMode(true)}
                      className="flex-1 h-10 rounded-full flex items-center justify-center" 
                      style={{ background: 'linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)' }}
                    >
                      <span className="text-black font-semibold text-sm">CLOSE</span>
                    </button>
                  </>
                )}
              </>
            ) : (() => {
              const isFullyTransferredOut = (transferSourceOrderId === currentSelectedGuest?.id && transferType === 'full') ||
                (localTransferResult?.sourceOrderId === currentSelectedGuest?.id && localTransferResult?.transferType === 'full');
              return (
              <>
                <button disabled={isFullyTransferredOut} className={`w-8 h-8 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0 ${isFullyTransferredOut ? 'opacity-40 cursor-not-allowed' : 'hover:bg-red-600'}`}>
                  <img src={clearIcon} alt="Clear" className="w-3 h-3" />
                </button>
                <button disabled={isFullyTransferredOut} className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isFullyTransferredOut ? 'opacity-40 cursor-not-allowed' : ''}`} style={{
                  backgroundColor: '#C9C9C9'
                }}>
                  <img src={saveIcon} alt="Save" className="w-4 h-4" />
                </button>
                <button disabled={isFullyTransferredOut} className={`flex-1 h-8 rounded-full flex items-center justify-center gap-1.5 ${isFullyTransferredOut ? 'opacity-40 cursor-not-allowed' : ''}`} style={{
                  background: 'linear-gradient(180deg, #FF9E65 0%, #FF5E00 100%)'
                }}>
                  <img src={fireIcon} alt="Fire" className="w-4 h-4" />
                  <span className="text-white font-semibold text-sm">FIRE</span>
                </button>
                <button 
                  disabled={isFullyTransferredOut}
                  onClick={() => !isFullyTransferredOut && setShowPaymentDialog(true)}
                  className={`flex-1 h-8 rounded-full flex items-center justify-center ${isFullyTransferredOut ? 'opacity-40 cursor-not-allowed' : ''}`}
                  style={{ background: 'linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)' }}
                >
                  <span className="text-black font-semibold text-xs">
                    CHARGE {formatPrice((currentSelectedGuest?.total || 0) - appliedDiscount)}
                  </span>
                </button>
              </>
              );
            })()}
          </div>
        </div>
        </div>
        </div>
        );
      })()}
    </div>;

  // Tablet Layout - render function (not component) to prevent scroll reset
  const renderTabletLayout = () => <div className="flex h-full bg-black">
      {/* Left Panel - Order List (Mobile-style cards) */}
      <div className="flex flex-col flex-1 m-2 rounded-[20px] overflow-hidden">
        {/* Header */}
        <div className="relative flex items-center justify-between p-2 border-b border-neutral-700/50">
          <button onClick={() => navigate("/tableorder")} className="p-2 rounded-full hover:opacity-80 transition-opacity z-10" style={{
          background: "#7575754D",
          boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)"
        }}>
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          
          <span className="absolute left-1/2 -translate-x-1/2 text-white font-semibold text-lg">{formatTableName(tableId || "")}</span>
          
          <div className="flex items-center gap-2 z-10">
            <button className="p-2 rounded-full hover:opacity-80 transition-opacity" style={{
            background: "#7575754D",
            boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)"
          }}>
              <SlidersHorizontal className="w-4 h-4 text-white" />
            </button>
            <button className="p-2 rounded-full hover:opacity-80 transition-opacity" style={{
            background: "#7575754D",
            boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)"
          }}>
              <Search className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 p-3 overflow-x-auto scrollbar-hide">
          {filters.map(filter => {
          const count = getFilterCount(filter);
          return <button key={filter} onClick={() => setActiveFilter(filter)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-all ${activeFilter === filter ? "text-black" : "text-white"}`} style={activeFilter === filter ? {
            background: "linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)"
          } : {
            background: "#7575754D",
            boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)"
          }}>
                <span>{filter}</span>
                {count > 0 && <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${activeFilter === filter ? "bg-black text-white" : "bg-neutral-800"}`}>
                    {count}
                  </span>}
              </button>;
        })}
        </div>

        {/* Guest Orders List - Mobile-style cards */}
        <ScrollArea className="flex-1 px-3">
          <div className="space-y-2 pb-3">
            {filteredGuestOrders.map((guest, guestIndex) => <div key={guest.id} className="space-y-2">
                {/* Merged Order Indicator */}
                {destOrderId === guest.id && mergedFromTable && mergedOrderId && <div className="px-2 py-0.5 bg-[#392514] rounded-t-xl">
                    <span className="text-xs font-medium">
                      <span style={{ color: '#FFC48A' }}>Merged</span> <span className="text-white">order {mergedOrderId}</span> <span style={{ color: '#FFC48A' }}>from</span> <span className="text-white">{formatTableName(mergedFromTable)}{mergedSourceArea ? ` (${mergedSourceArea})` : ''}</span>
                    </span>
                  </div>}
                {/* Transferred Items Indicator (Destination - receiving items) */}
                {(((transferType === 'full' && transferredFromTable && guestIndex === 0) || 
                  (transferType === 'partial' && transferredFromTable && transferredOrderId && (transferDestOrderId === guest.id || guestIndex === 0)))) ||
                  (guest.transferredFrom && guest.transferredFrom.length > 0 && (virtualTransferOrder.some(v => v.id === guest.id) || (guest as any)?._persistedTransferType)) ? (
                  <div className="px-2 py-0.5 rounded-t-xl bg-[#1E3A5F]">
                    <span className="text-xs font-medium">
                      {(() => {
                        const effectiveType = transferType || (guest as any)?._persistedTransferType || 'partial';
                        const sourceTable = transferredFromTable || guest.transferredFrom?.[0]?.table || '';
                        const sourceOrderId = transferredOrderId || guest.transferredFrom?.[0]?.orderId || '';
                        if (effectiveType === 'full') {
                          return (
                            <>
                              <span style={{ color: '#8AC4FF' }}>Order fully transferred from</span>{" "}
                              <span className="text-white">{formatTableName(sourceTable)} · Order #{sourceOrderId}</span>
                            </>
                          );
                        } else {
                          const itemCount = transferredItemNames.length || guest.transferredFrom?.[0]?.items?.length || 0;
                          return (
                            <>
                              <span style={{ color: '#8AC4FF' }}>Transferred</span>{" "}
                              <span className="text-white">{itemCount} item(s)</span>{" "}
                              <span style={{ color: '#8AC4FF' }}>from</span>{" "}
                              <span className="text-white">Order {sourceOrderId} · {formatTableName(sourceTable)}</span>
                            </>
                          );
                        }
                      })()}
                    </span>
                  </div>
                ) : null}
                <div onClick={() => setSelectedGuest(guest)} className={`${(destOrderId === guest.id && mergedFromTable) || ((transferType === 'full' && transferredFromTable && guestIndex === 0) || (transferType === 'partial' && transferredFromTable && transferredOrderId && (transferDestOrderId === guest.id || guestIndex === 0))) || (guest.transferredFrom && guest.transferredFrom.length > 0 && (virtualTransferOrder.some(v => v.id === guest.id) || (guest as any)?._persistedTransferType)) ? 'rounded-b-xl' : 'rounded-xl'} border cursor-pointer transition-all overflow-hidden ${currentSelectedGuest?.id === guest.id ? "border-white" : "border-white/10"}`}>
                <div className="flex items-stretch w-full bg-neutral-900">
                  {/* Left Content with padding */}
                  <div className="flex-1 flex items-stretch gap-2 p-2">
                    {/* Order Number Box */}
                    <div className="flex-shrink-0 flex flex-col items-center justify-center w-12 rounded-lg border border-white/20 py-1.5 gap-0.5" style={{ background: '#1A1A1A' }}>
                      <span className="text-base font-bold text-white">{guest.id}</span>
                      <span className="text-[10px] text-white/40">000</span>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                      {/* Row 1: Name + Table | Server (center) | Status */}
                      <div className="flex items-center text-xs">
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <span className="text-white font-medium truncate">{guest.name}</span>
                        </div>
                        <span className="text-white/60 flex-1 text-left truncate px-1">{guest.server}</span>
                        <span className={`font-semibold uppercase flex-shrink-0 ${getStatusColor(guest.status)}`}>
                          {guest.status === 'Completed' || guest.status === 'COMPLETED' ? 'PAID' : guest.status}
                        </span>
                      </div>
                      
                      {/* Row 2: Party info | Timer | Total */}
                      <div className="flex items-center text-xs">
                        <div className="flex items-center gap-1 text-white/60 flex-shrink-0">
                          <span className="truncate">Party of {guest.partySize}, {guest.time}</span>
                          <span className="text-white/40">|</span>
                          <span>{orderTimers[guest.id] || guest.timer}</span>
                        </div>
                        <div className="flex-1"></div>
                        <span className="text-white font-semibold flex-shrink-0">{formatPrice(guest.total)}</span>
                      </div>
                      
                      {/* Row 3: Revenue Center | Payment Status (center) | Amount */}
                      <div className="flex items-center text-xs">
                        <span className="text-white font-medium flex-shrink-0 truncate">{guest.revenueCenter}</span>
                        <span className="text-white/60 flex-1 text-left truncate px-1">{guest.status === 'Paid' || guest.status === 'Completed' ? 'Paid' : 'Un Paid'}</span>
                        <span className="text-white flex-shrink-0">{guest.tip > 0 ? formatPrice(guest.tip) : '$0.00'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Action Buttons - Edge to edge (hidden for completed/paid/merged orders) */}
                  {guest.status !== 'Paid' && guest.status !== 'Completed' && guest.id !== mergedOrderId ? (
                    <div className="flex-shrink-0 flex flex-col w-9">
                      <button 
                        className="flex-1 flex items-center justify-center hover:opacity-80 transition-opacity"
                        style={{ background: 'linear-gradient(180deg, #FF9E65 0%, #FF5E00 100%)' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/tableorder/${tableId}/merge?orderId=${guest.id}`);
                        }}
                      >
                        <img src={arrowRightIcon} alt="Merge" className="w-3.5 h-3.5 object-contain" />
                      </button>
                      <button 
                        className="flex-1 flex items-center justify-center hover:opacity-80 transition-opacity"
                        style={{ background: 'linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setTransferIntentOrderId(guest.id);
                          setShowTransferIntentDialog(true);
                        }}
                      >
                        <img src={shareOrderIcon} alt="Transfer" className="w-3.5 h-3.5 object-contain brightness-0" />
                      </button>
                    </div>
                  ) : guest.id === mergedOrderId ? (
                    <div className="flex-shrink-0 flex items-center justify-center w-20 px-2 rounded-r-xl" style={{ background: 'linear-gradient(180deg, #5C3D1E 0%, #392514 100%)' }}>
                      <div className="flex flex-col items-center text-center">
                        <img src={linkMergeIcon} alt="Merged" className="w-3.5 h-3.5 mb-1" />
                        <span className="text-[9px] text-[#FFC48A]">Merged with</span>
                        <span className="text-[10px] text-white font-medium">Order #{destOrderId}</span>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
              
              {/* Split Check Cards - rendered below main order */}
              {guest.splitConfiguration?.checks && guest.splitConfiguration.checks.length > 0 && (
                <div className="space-y-2">
                  {guest.splitConfiguration.checks.map((check, checkIndex) => 
                    renderSplitCheckCard(guest, checkIndex, check, 'tablet')
                  )}
                </div>
              )}
            </div>)}
          </div>
          <ScrollBar orientation="vertical" />
        </ScrollArea>

        {/* Add Order Button */}
        <div className="p-3 border-t border-neutral-700/50">
          <button 
            onClick={() => navigate(`/orders?tableId=${tableId}&seats=4&guests=1`)}
            className="w-full py-3 text-black font-medium rounded-full hover:opacity-90 transition-opacity" 
            style={{ background: "linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)" }}
          >
            ADD ORDER TO TABLE
          </button>
        </div>
      </div>

      {/* Right Panel - Order Details (same as desktop) */}
      {(() => {
        const mergedPanelData = getMergedPanelData(destOrderId, mergedOrderId, mergedFromTable, allDbOrders);
        // Only show merged panel if the currently selected guest is the merge destination
        const showMergedPanel = mergedPanelData && currentSelectedGuest?.id === destOrderId;
        
        return showMergedPanel ? (
          <MergedOrderPanel 
            guestName={mergedPanelData.guestName} 
            phone={mergedPanelData.phone} 
            time={mergedPanelData.time} 
            server={mergedPanelData.server} 
            tableId={tableId || ""} 
            mergedOrderIds={mergedPanelData.orders.map(o => o.id)} 
            orders={mergedPanelData.orders} 
            width="w-[280px]" 
          />
        ) : (
          <div className="w-[280px] flex flex-col m-2 ml-0">
        {/* Guest Header - Outside the box */}
        <div className="px-2 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white font-medium">{currentSelectedGuest?.name}</span>
            <div className="flex items-center gap-3 text-white/50 text-sm">
              <div className="flex items-center gap-1">
                <Phone className="w-3 h-3" />
                <span>{currentSelectedGuest?.phone || "N/A"}</span>
              </div>
              <div className="flex items-center gap-1">
                <span>⚡</span>
                <span>{currentSelectedGuest?.time}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button 
              className="px-3 py-1.5 bg-neutral-700 text-white text-xs rounded-full hover:bg-neutral-600 transition-colors"
              onClick={() => navigate(`/orders?orderId=${currentSelectedGuest?.id}&tableId=${tableId}&mode=addItem`)}
            >
              Add Item
            </button>
            <button className="px-3 py-1.5 bg-neutral-700 text-white text-xs rounded-full hover:bg-neutral-600 transition-colors">
              Discount
            </button>
            <button className="px-3 py-1.5 bg-neutral-700 text-white text-xs rounded-full hover:bg-neutral-600 transition-colors">
              Receipt
            </button>
          </div>
        </div>

        {/* Main Panel Box */}
        <div className="flex-1 flex flex-col rounded-[10px] overflow-hidden" style={{
        background: "#7575754D",
        boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)"
      }}>

        {/* Table Order Info */}
        <div className="px-4 py-3 border-b border-white/10">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-white/10 text-white text-xs rounded">TABLE ORDER</span>
              <span className="text-white font-bold">{currentSelectedGuest?.id}</span>
            </div>
            <div className="flex items-center gap-2">
              <img src={shareSeatsIcon} alt="Seats" className="w-4 h-4 opacity-60" />
              <span className="text-white/50 text-sm">{currentSelectedGuest?.server || "Unassigned"}</span>
            </div>
          </div>
          
          {/* Seat Buttons */}
          <div className="flex items-center gap-2">
            <button className="p-1.5 bg-white/10 rounded hover:bg-white/20 transition-colors">
              <img src={seatIcon} alt="Seat" className="w-4 h-4" />
            </button>
            <button className="p-1.5 bg-white/10 rounded hover:bg-white/20 transition-colors">
              <img src={splitIcon} alt="Split" className="w-4 h-4" />
            </button>
            {Array.from({ length: currentSelectedGuest?.partySize || 4 }, (_, i) => i + 1).map(seat => <button key={seat} onClick={() => toggleSeat(seat)} className={`w-7 h-7 rounded text-sm font-medium transition-colors ${selectedSeats.includes(seat) ? "bg-white text-black" : "bg-white/10 text-white hover:bg-white/20"}`}>
                {seat}
              </button>)}
          </div>
        </div>

        {/* Notes */}
        <div className="px-4 py-3 border-b border-white/10">
          <div className="flex items-center gap-2 text-white/50 text-sm bg-white/10 p-2 rounded-lg">
            <span>📝</span>
            <span>{currentSelectedGuest?.notes || "No notes"}</span>
          </div>
        </div>

        {/* Local Transfer Result - Outgoing info banner (tablet) */}
        {localTransferResult && localTransferResult.sourceOrderId === currentSelectedGuest?.id && (
          <div className="px-4 py-1.5 border-b border-white/10">
            <div className="flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-[#8AC4FF]" />
              <span className="text-xs font-medium" style={{ color: '#8AC4FF' }}>
                Transferred to {localTransferResult.destinationLabel}
              </span>
            </div>
          </div>
        )}

        {/* Order Items */}
        <ScrollArea className="flex-1 px-4">
          <div className="py-2 space-y-2">
            {currentSelectedGuest && (
              <>
                {/* Check if this order has merged items */}
                {hasMergedOrTransferredItems(currentSelectedGuest) ? (
                  // Display items grouped by source
                  getMergedOrderDisplay(currentSelectedGuest).map((section, sectionIndex) => {
                    const allSeatsSelected = selectedSeats.length === 4;
                    const filteredSectionItems = filterItemsBySeats(section.items, selectedSeats, allSeatsSelected);
                    if (filteredSectionItems.length === 0) return null;
                    return (
                      <div key={sectionIndex} className="space-y-2">
                        {/* Section Header */}
                        <div className={`flex items-center gap-2 py-2 ${sectionIndex > 0 ? 'mt-3 pt-3 border-t border-white/20' : ''}`}>
                          {section.isOriginal ? (
                            <span className="text-white/70 text-xs font-medium uppercase tracking-wide">
                              {section.label}
                            </span>
                          ) : (
                            <div className="flex items-center gap-2">
                              <img src={mergeIcon} alt="Merged" className="w-4 h-4 opacity-60" />
                              <span className="text-[#FFC48A] text-xs font-medium uppercase tracking-wide">
                                {section.label}
                              </span>
                            </div>
                          )}
                        </div>
                        {/* Section Items */}
                        {filteredSectionItems.map((item, index) => (
                          <div key={`${sectionIndex}-${index}`} className={`p-3 rounded-xl border ${section.isOriginal ? 'bg-white/5 border-white/10' : 'bg-[#FFC48A]/5 border-[#FFC48A]/20'}`}>
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-2">
                                <span className={`w-6 h-6 rounded flex items-center justify-center text-sm font-bold ${section.isOriginal ? 'bg-white text-black' : 'bg-[#FFC48A] text-black'}`}>
                                  {item.qty}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <span className="text-white font-medium">{item.name}</span>
                                  {/* Modifiers with tree hierarchy */}
                                  {item.modifiers.length > 0 && (() => {
                                    const itemKey = `tablet-merged-${sectionIndex}-${index}`;
                                    const displayedModifiers = expandedCartItems.has(itemKey) ? item.modifiers : item.modifiers.slice(0, 2);
                                    const hasShowButton = item.modifiers.length > 2;
                                    
                                    return (
                                      <div className="ml-2 mt-1 relative">
                                        {displayedModifiers.map((mod, idx) => {
                                          const isAddOn = mod.startsWith("W/") || mod.startsWith("Add");
                                          const isRemoval = mod.startsWith("No ") || mod.startsWith("-");
                                          const displayMod = isAddOn ? mod.replace("Add: ", "") : mod;
                                          const isLastItem = !hasShowButton && idx === displayedModifiers.length - 1;
                                          
                                          return (
                                            <div key={idx} className="relative flex items-center text-xs py-[2px]">
                                              {/* Vertical line - only show if not last item */}
                                              {!isLastItem && (
                                                <div className="absolute left-0 top-1/2 bottom-0 w-px bg-white" style={{ height: '100%' }} />
                                              )}
                                              {/* Vertical line segment to connect to horizontal */}
                                              <div className="absolute left-0 top-0 h-1/2 w-px bg-white" />
                                              {/* Horizontal connector */}
                                              <div className="absolute left-0 top-1/2 w-2.5 h-px bg-white" />
                                              {/* Content */}
                                              <div className="flex items-center gap-1.5 ml-4">
                                                <span className="text-white">
                                                  {isAddOn ? '+' : isRemoval ? '-' : '•'}
                                                </span>
                                                <span className={`text-white/70 ${isRemoval ? 'line-through' : ''}`}>
                                                  {displayMod}
                                                </span>
                                              </div>
                                            </div>
                                          );
                                        })}
                                        {hasShowButton && (
                                          <div className="relative flex items-center py-[2px]">
                                            {/* Vertical line segment to connect to horizontal (this is the last item) */}
                                            <div className="absolute left-0 top-0 h-1/2 w-px bg-white" />
                                            {/* Horizontal connector */}
                                            <div className="absolute left-0 top-1/2 w-2.5 h-px bg-white" />
                                            <button 
                                              className="text-xs text-white/60 hover:text-white ml-4"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setExpandedCartItems(prev => {
                                                  const newSet = new Set(prev);
                                                  if (newSet.has(itemKey)) {
                                                    newSet.delete(itemKey);
                                                  } else {
                                                    newSet.add(itemKey);
                                                  }
                                                  return newSet;
                                                });
                                              }}
                                            >
                                              {expandedCartItems.has(itemKey) ? 'Show less' : `Show more (+${item.modifiers.length - 2})`}
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })()}
                                </div>
                              </div>
                              <span className="text-white font-medium">{formatPrice(item.price * item.qty)}</span>
                            </div>
                            {/* Show seat indicator for all items */}
                            <div className="flex items-center gap-1 mt-2">
                              <img src={seatIcon} alt="Seat" className="w-4 h-4 opacity-50" />
                              {item.isShared || item.seats.length === 0 || item.seats.length === currentSelectedGuest?.partySize ? (
                                <span className="w-5 h-5 rounded bg-white/20 text-white flex items-center justify-center">
                                  <Share2 className="w-3 h-3" />
                                </span>
                              ) : (
                                item.seats.map(seat => (
                                  <span key={seat} className={`w-5 h-5 rounded text-white text-xs flex items-center justify-center ${selectedSeats.includes(seat) ? 'bg-white/30' : 'bg-white/10'}`}>
                                    {seat}
                                  </span>
                                ))
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })
                ) : (
                  // Display regular items (no merge)
                  (() => {
                    const allSeatsSelected = selectedSeats.length === 4;
                    const filteredItems = filterItemsBySeats(currentSelectedGuest.items, selectedSeats, allSeatsSelected);
                    return filteredItems.map((item, index) => (
                      <div key={index} className="p-3 bg-white/5 rounded-xl border border-white/10">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-2">
                            <span className="w-6 h-6 bg-white rounded flex items-center justify-center text-black text-sm font-bold">
                              {item.qty}
                            </span>
                            <div className="flex-1 min-w-0">
                              {(() => {
                                const isTransferredOut = localTransferResult?.sourceOrderId === currentSelectedGuest.id && 
                                  localTransferResult.transferredItemNames.includes(item.name);
                                return (
                                  <>
                                    <span className={`text-white font-medium ${isTransferredOut ? 'line-through opacity-50' : ''}`}>{item.name}</span>
                                    {isTransferredOut && (
                                      <div className="flex items-center gap-1 mt-0.5">
                                       <ArrowRightLeft className="w-3 h-3 text-[#8AC4FF]" />
                                       <span className="text-[10px] text-[#8AC4FF]">Transferred to {localTransferResult.destinationLabel}</span>
                                      </div>
                                    )}
                                  </>
                                );
                              })()}
                              {/* Modifiers with tree hierarchy */}
                              {item.modifiers.length > 0 && (() => {
                                const itemKey = `tablet-${currentSelectedGuest.id}-${index}`;
                                const displayedModifiers = expandedCartItems.has(itemKey) ? item.modifiers : item.modifiers.slice(0, 2);
                                const hasShowButton = item.modifiers.length > 2;
                                
                                return (
                                  <div className="ml-2 mt-1 relative">
                                    {displayedModifiers.map((mod, idx) => {
                                      const isAddOn = mod.startsWith("W/") || mod.startsWith("Add");
                                      const isRemoval = mod.startsWith("No ") || mod.startsWith("-");
                                      const displayMod = isAddOn ? mod.replace("Add: ", "") : mod;
                                      const isLastItem = !hasShowButton && idx === displayedModifiers.length - 1;
                                      
                                      return (
                                        <div key={idx} className="relative flex items-center text-xs py-[2px]">
                                          {/* Vertical line - only show if not last item */}
                                          {!isLastItem && (
                                            <div className="absolute left-0 top-1/2 bottom-0 w-px bg-white" style={{ height: '100%' }} />
                                          )}
                                          {/* Vertical line segment to connect to horizontal */}
                                          <div className="absolute left-0 top-0 h-1/2 w-px bg-white" />
                                          {/* Horizontal connector */}
                                          <div className="absolute left-0 top-1/2 w-2.5 h-px bg-white" />
                                          {/* Content */}
                                          <div className="flex items-center gap-1.5 ml-4">
                                            <span className="text-white">
                                              {isAddOn ? '+' : isRemoval ? '-' : '•'}
                                            </span>
                                            <span className={`text-white/70 ${isRemoval ? 'line-through' : ''}`}>
                                              {displayMod}
                                            </span>
                                          </div>
                                        </div>
                                      );
                                    })}
                                    {hasShowButton && (
                                      <div className="relative flex items-center py-[2px]">
                                        {/* Vertical line segment to connect to horizontal (this is the last item) */}
                                        <div className="absolute left-0 top-0 h-1/2 w-px bg-white" />
                                        {/* Horizontal connector */}
                                        <div className="absolute left-0 top-1/2 w-2.5 h-px bg-white" />
                                        <button 
                                          className="text-xs text-white/60 hover:text-white ml-4"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setExpandedCartItems(prev => {
                                              const newSet = new Set(prev);
                                              if (newSet.has(itemKey)) {
                                                newSet.delete(itemKey);
                                              } else {
                                                newSet.add(itemKey);
                                              }
                                              return newSet;
                                            });
                                          }}
                                        >
                                          {expandedCartItems.has(itemKey) ? 'Show less' : `Show more (+${item.modifiers.length - 2})`}
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                );
                              })()}
                            </div>
                          </div>
                          {(() => {
                            const isTransferredOut = localTransferResult?.sourceOrderId === currentSelectedGuest.id && 
                              localTransferResult.transferredItemNames.includes(item.name);
                            return <span className={`text-white font-medium ${isTransferredOut ? 'line-through opacity-50' : ''}`}>{formatPrice(item.price * item.qty)}</span>;
                          })()}
                        </div>
                        {/* Show seat indicator for all items */}
                        <div className="flex items-center gap-1 mt-2">
                          <img src={seatIcon} alt="Seat" className="w-4 h-4 opacity-50" />
                          {item.isShared || item.seats.length === 0 || item.seats.length === currentSelectedGuest?.partySize ? (
                            <span className="w-5 h-5 rounded bg-white/20 text-white flex items-center justify-center">
                              <Share2 className="w-3 h-3" />
                            </span>
                          ) : (
                            item.seats.map(seat => (
                              <span key={seat} className={`w-5 h-5 rounded text-white text-xs flex items-center justify-center ${selectedSeats.includes(seat) ? 'bg-white/30' : 'bg-white/10'}`}>
                                {seat}
                              </span>
                            ))
                          )}
                        </div>
                      </div>
                    ));
                  })()
                )}
              </>
            )}
          </div>
          <ScrollBar orientation="vertical" />
        </ScrollArea>

        {/* Order Summary */}
        <div className="px-4 py-3 border-t border-white/10 space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-white/60">Sub Total</span>
            <span className="text-white">{formatPrice(currentSelectedGuest?.subtotal || 0)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white">Discount</span>
            <span className="text-white">{formatPrice(currentSelectedGuest?.discount || 0)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/60">Service Charge</span>
            <span className="text-white">{formatPrice(currentSelectedGuest?.serviceCharge || 0)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/60">Tax</span>
            <span className="text-white">{formatPrice(currentSelectedGuest?.tax || 0)}</span>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="px-4 py-3 border-t border-white/10 flex items-center gap-2">
          {currentSelectedGuest?.status?.toUpperCase() === 'PAID' || currentSelectedGuest?.status?.toUpperCase() === 'COMPLETED' ? (
            <>
              {showRefundMode ? (
                /* Refund Button - shown after clicking Close */
                <button 
                  onClick={() => setShowRefundDialog(true)}
                  className="flex-1 h-10 rounded-full flex items-center justify-center" 
                  style={{ background: 'linear-gradient(180deg, #DC2626 0%, #991B1B 100%)' }}
                >
                  <span className="text-white font-semibold text-sm">REFUND</span>
                </button>
              ) : (
                <>
                  {!SettingsManager.getCheckoutOptionsSettings().skipTipScreen && (
                    <>
                      {/* Add Tip Button */}
                      <button 
                        onClick={() => setShowTipDialog(true)}
                        className="flex-1 h-10 rounded-full flex items-center justify-center border border-white/20"
                        style={{ background: '#1B1C20' }}
                      >
                        <span className="text-white font-semibold text-sm">ADD TIP</span>
                      </button>
                    </>
                  )}
                  {/* Close Button */}
                  <button 
                    onClick={() => setShowRefundMode(true)}
                    className="flex-1 h-10 rounded-full flex items-center justify-center" 
                    style={{ background: 'linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)' }}
                  >
                    <span className="text-black font-semibold text-sm">CLOSE</span>
                  </button>
                </>
              )}
            </>
          ) : (
            <>
              <button className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center hover:bg-red-500 transition-colors">
                <img src={clearIcon} alt="Clear" className="w-4 h-4 brightness-0 invert" />
              </button>
              <button disabled className="px-4 py-2 rounded-full flex items-center gap-1 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed" style={{
                background: "linear-gradient(180deg, #FF9E65 0%, #FF5E00 100%)"
              }}>
                <img src={fireIcon} alt="Fire" className="w-4 h-4 brightness-0 invert" />
                <span>FIRE</span>
              </button>
              <button 
                onClick={() => setShowPaymentDialog(true)}
                className="flex-1 py-2 rounded-full text-black text-sm font-bold" 
                style={{ background: "linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)" }}
              >
                CHARGE {formatPrice((currentSelectedGuest?.total || 0) - appliedDiscount)}
              </button>
            </>
          )}
        </div>
        </div>
        </div>
        );
      })()}
    </div>;
  return <>
      {/* Mobile Layout */}
      <div className="md:hidden h-full">
        {renderMobileLayout()}
      </div>

      {/* Tablet Layout */}
      <div className="hidden md:block lg:hidden h-full">
        {renderTabletLayout()}
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:block h-full">
        {renderDesktopLayout()}
      </div>
      {/* Payment Dialog */}
      <PaymentDialog
        open={showPaymentDialog}
        onOpenChange={setShowPaymentDialog}
        orderDetails={{
          guest: currentSelectedGuest?.name || "Guest",
          phone: currentSelectedGuest?.phone,
          table: tableId,
          check: currentSelectedGuest?.id,
          partySize: currentSelectedGuest?.partySize || 4,
          items: currentSelectedGuest?.items.map((item, index) => ({
            id: index + 1,
            qty: item.qty,
            name: item.name,
            price: item.price, // Pass unit price, not line total - PaymentDialog handles qty internally
            assignedSeats: item.seats || [],
            isShared: item.isShared || false
          })) || []
        }}
        subtotal={currentSelectedGuest?.subtotal || 0}
        tax={currentSelectedGuest?.tax || 0}
        total={currentSelectedGuest?.total || 0}
        onPaymentComplete={(history) => {
          console.log("Payment completed:", history);
          
          // Persist payment data to database
          if (currentSelectedGuest?.id) {
            const totalPaid = history.reduce((sum, p) => sum + p.amount, 0);
            const primaryMethod = history.length > 0 ? history[0].methodLabel : "Card";
            const paymentsArray = history.map(p => ({
              method: p.methodLabel,
              amount: p.amount,
            }));
            
            updateOrder(currentSelectedGuest.id, {
              status: "PAID",
              paymentType: primaryMethod,
              payments: paymentsArray,
              paidAmount: totalPaid.toFixed(2),
              paymentStatus: "completed",
              total: currentSelectedGuest.total - appliedDiscount,
              discount: (currentSelectedGuest.discount || 0) + appliedDiscount,
            } as any);
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
          if (checkoutSettings.autoCloseTicket) {
            toast.success("Ticket closed automatically");
          }
        }}
        onSaveSplit={(config) => {
          if (!currentSelectedGuest) return;
          
          const orderId = currentSelectedGuest.id;
          const orderItems = currentSelectedGuest.items;
          const partySize = currentSelectedGuest.partySize;
          const orderTotal = currentSelectedGuest.total;
          
          // Build checks based on split mode
          const checks: SplitCheck[] = Array.from({ length: config.numberOfChecks }, (_, i) => {
            const checkLetter = String.fromCharCode(97 + i);
            let itemsForCheck: typeof orderItems = [];
            let checkTotal = 0;
            
            if (config.mode === 'custom') {
              // Custom mode: use checkAssignments (1-indexed keys and values)
              itemsForCheck = orderItems.filter((_, itemIdx) => 
                config.checkAssignments[itemIdx + 1] === i + 1
              );
              checkTotal = itemsForCheck.reduce((sum, item) => sum + (item.price * item.qty), 0);
            } else if (config.mode === 'evenly') {
              // Evenly mode: split total equally, include all items for display
              itemsForCheck = orderItems;
              checkTotal = orderTotal / config.numberOfChecks;
            } else if (config.mode === 'seat') {
              // Seat mode: assign items based on seat assignments
              const seatNumber = i + 1;
              itemsForCheck = orderItems.filter(item => {
                if (item.isShared || !item.seats || item.seats.length === 0) return true;
                return item.seats.includes(seatNumber);
              });
              // Calculate check total accounting for shared items split across party
              checkTotal = itemsForCheck.reduce((sum, item) => {
                const itemTotal = item.price * item.qty;
                if (item.isShared || !item.seats || item.seats.length === 0) {
                  return sum + (itemTotal / partySize);
                }
                return sum + itemTotal;
              }, 0);
            }
            
            return {
              checkId: checkLetter,
              items: itemsForCheck.map(item => ({
                qty: item.qty,
                name: item.name,
                price: item.price,
                seats: item.seats || [],
                modifiers: item.modifiers || []
              })),
              status: 'unpaid' as const,
              total: checkTotal
            };
          });
          
          const fullConfig: SplitConfiguration = {
            ...config,
            checks
          };
          
          // Try session order first (dynamic orders)
          const sessionId = getSessionIdForOrder(orderId);
          if (sessionId) {
            saveSplitConfiguration(sessionId, fullConfig);
          } else {
            // Static order - save to localStorage
            const splitKey = getStaticSplitKey(orderId);
            setStaticSplitConfigs(prev => ({
              ...prev,
              [splitKey]: fullConfig
            }));
          }
          
          // Update selectedGuest to reflect split state immediately
          if (selectedGuest?.id === orderId) {
            setSelectedGuest(prev => prev ? { ...prev, splitConfiguration: fullConfig } : null);
          }
        }}
      />

      {/* Receipt Dialog */}
      <ReceiptDialog
        open={showReceiptDialog}
        onOpenChange={setShowReceiptDialog}
        orderTotal={receiptGuest?.total || 0}
        orderId={receiptGuest?.id}
        mergedOrderIds={receiptGuest?.mergedFrom ? [receiptGuest.id, ...receiptGuest.mergedFrom.map(m => m.orderId)] : undefined}
        guestName={receiptGuest?.name}
        items={receiptGuest?.items?.map(item => ({
          name: item.name,
          price: item.price * item.qty,
          qty: item.qty
        }))}
      />

      {/* Tip Dialog */}
      <TipDialog
        open={showTipDialog}
        onOpenChange={setShowTipDialog}
        orderTotal={currentSelectedGuest?.total || 0}
        onTipSelected={async (tip) => {
          if (currentSelectedGuest && tip > 0) {
            const existingTip = currentSelectedGuest.tip || 0;
            const newTotalTip = existingTip + tip;
            const newTotal = currentSelectedGuest.total + tip;
            try {
              await updateTicketOrder(currentSelectedGuest.id, { tip: newTotalTip, total: newTotal });
            } catch (err) {
              console.error('Failed to persist tip:', err);
            }
          }
        }}
      />

      {/* Refund Dialog */}
      <RefundDialog
        open={showRefundDialog}
        onOpenChange={setShowRefundDialog}
        orderTotal={currentSelectedGuest?.subtotal || 0}
        tipAmount={currentSelectedGuest?.tip || 0.88}
        orderId={currentSelectedGuest?.id}
        guestName={currentSelectedGuest?.name}
        orderItems={currentSelectedGuest?.items?.map(item => ({
          name: item.name,
          price: item.price,
          qty: item.qty,
          modifiers: item.modifiers?.map((mod, idx) => ({
            name: mod,
            // Assign prices to some modifiers for demo - every 2nd modifier has a charge
            price: idx % 2 === 1 ? (idx + 1) * 1.5 : 0
          }))
        }))}
        onRefundComplete={async (amount, reason) => {
          if (currentSelectedGuest?.id) {
            try {
              const order = dbTicketOrders.find(o => o.id === currentSelectedGuest.id);
              const existingRefundAmount = order?.refundAmount || 0;
              const existingTransactions = order?.refundTransactions || [];
              const newTransaction = {
                id: `refund-${currentSelectedGuest.id}-${Date.now()}`,
                amount,
                reason,
                type: 'refund',
                timestamp: new Date().toISOString(),
              };
              await updateTicketOrder(currentSelectedGuest.id, {
                refundAmount: existingRefundAmount + amount,
                refundReason: reason,
                refundTransactions: [...existingTransactions, newTransaction],
              });
            } catch (err) {
              console.error('Failed to persist refund:', err);
            }
          }
          setShowRefundMode(false);
        }}
      />

      {/* Discount Dialog with integrated MPIN */}
      {showDiscountDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-neutral-900 rounded-xl border border-neutral-700 w-[90%] max-w-md mx-4 overflow-hidden animate-scale-in">
            {discountDialogView === 'mpin' ? (
              /* MPIN View - Manager PIN entry */
              <div className="w-full max-w-[280px] flex flex-col items-center mx-auto py-6 px-4">
                {/* Manager Profile */}
                <div className="flex flex-col items-center mb-4">
                  <div className="w-14 h-14 rounded-full overflow-hidden mb-2 border-2 border-primary/30">
                    <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face" alt="Manager" className="w-full h-full object-cover" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground">Mia Jones</h3>
                  <p className="text-xs text-muted-foreground">Manager</p>
                </div>

                {/* PIN Dots */}
                <div className="flex items-center justify-center gap-2.5 mb-4">
                  {[0, 1, 2, 3].map((index) => (
                    <div key={index} className={`w-2.5 h-2.5 rounded-full transition-all duration-200 ${index < discountPin.length ? "bg-primary" : "bg-neutral-600"}`} />
                  ))}
                </div>

                <p className="text-center text-muted-foreground text-xs mb-4">Enter Manager PIN</p>

                {/* Numpad */}
                <div className="grid grid-cols-3 gap-2 w-full">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                    <button key={num} type="button" onClick={() => {
                      if (discountPin.length < 4) {
                        const newPin = discountPin + num.toString();
                        setDiscountPin(newPin);
                        if (newPin.length === 4) {
                          setTimeout(() => {
                            setDiscountDialogView('discounts');
                            setDiscountPin("");
                          }, 200);
                        }
                      }
                    }} className="h-12 rounded-xl bg-neutral-800 border border-neutral-700 text-foreground text-xl font-medium hover:bg-neutral-700 active:bg-neutral-600 transition-colors">
                      {num}
                    </button>
                  ))}
                  <button type="button" onClick={() => setDiscountPin(discountPin.slice(0, -1))} className="h-12 rounded-xl bg-neutral-800 border border-neutral-700 text-foreground hover:bg-neutral-700 active:bg-neutral-600 transition-colors flex items-center justify-center">
                    <Delete className="w-5 h-5" />
                  </button>
                  <button type="button" onClick={() => {
                    if (discountPin.length < 4) {
                      const newPin = discountPin + "0";
                      setDiscountPin(newPin);
                      if (newPin.length === 4) {
                        setTimeout(() => {
                          setDiscountDialogView('discounts');
                          setDiscountPin("");
                        }, 200);
                      }
                    }
                  }} className="h-12 rounded-xl bg-neutral-800 border border-neutral-700 text-foreground text-xl font-medium hover:bg-neutral-700 active:bg-neutral-600 transition-colors">
                    0
                  </button>
                  <button type="button" onClick={() => setShowDiscountDialog(false)} className="h-12 rounded-xl bg-neutral-700 border border-neutral-600 text-foreground text-sm font-medium hover:bg-neutral-600 active:bg-neutral-500 transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              /* Discount Selection View */
              <>
                <div className="flex items-center justify-between p-4 border-b border-neutral-700">
                  <h2 className="text-white text-lg font-semibold">Select Discount</h2>
                  <button onClick={() => setShowDiscountDialog(false)} className="w-8 h-8 rounded-full hover:bg-neutral-700 flex items-center justify-center transition-colors">
                    <X className="w-5 h-5 text-neutral-400" />
                  </button>
                </div>

                <div className="p-2 max-h-[400px] overflow-y-auto space-y-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                  {discountTypes.map((discountType) => {
                    const subtotal = currentSelectedGuest?.subtotal || 0;
                    const discountAmount = discountType.fixedAmount || (subtotal * ((discountType.percentage || 0) / 100));
                    const isSelected = selectedDiscountId === discountType.id;
                    const IconComponent = getDiscountIcon(discountType.icon);
                    
                    return (
                      <button key={discountType.id} onClick={() => setSelectedDiscountId(isSelected ? null : discountType.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                          isSelected ? 'bg-orange-500/20 border border-orange-500' : 'bg-neutral-800 border border-transparent hover:bg-neutral-700'
                        }`}>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isSelected ? 'bg-orange-500/30' : 'bg-neutral-700'}`}>
                          <IconComponent className="w-4 h-4 text-neutral-400" />
                        </div>
                        <div className="flex-1 text-left">
                          <div className="text-white text-sm font-medium">{discountType.name}</div>
                          <div className="text-neutral-400 text-xs">{discountType.description}</div>
                        </div>
                        <div className="text-white text-sm font-medium">-${discountAmount.toFixed(2)}</div>
                      </button>
                    );
                  })}
                </div>

                <div className="p-3 border-t border-neutral-700">
                  <button onClick={() => {
                    // Persist discount to DB
                    if (currentSelectedGuest?.id && appliedDiscount > 0) {
                      updateOrder(currentSelectedGuest.id, {
                        discount: (currentSelectedGuest.discount || 0) + appliedDiscount,
                        total: (currentSelectedGuest.total || 0) - appliedDiscount,
                      });
                    }
                    setShowDiscountDialog(false);
                  }} className="w-full py-2.5 bg-white hover:bg-neutral-100 text-black font-semibold rounded-lg transition-colors text-sm">
                    Apply
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Transfer Intent Dialog */}
      {showTransferIntentDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/80" onClick={() => setShowTransferIntentDialog(false)} />
          <div className="relative bg-neutral-900 border border-white/10 rounded-2xl w-[380px] max-w-[90vw] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h2 className="text-white text-lg font-semibold">Transfer Order</h2>
              <button 
                onClick={() => setShowTransferIntentDialog(false)}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4">
              <p className="text-white/60 text-sm mb-3">What would you like to transfer?</p>
              
              <div className="space-y-2">
                {/* Transfer Items Option */}
                <button 
                  onClick={() => {
                    setShowTransferIntentDialog(false);
                    navigate(`/tableorder/${tableId}/transfer?orderId=${transferIntentOrderId}`);
                  }}
                  className="w-full p-3.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors text-left"
                >
                  <div className="flex items-center gap-3 mb-0.5">
                    <img src={transferItemIcon} alt="Transfer Items" className="w-5 h-5 object-contain opacity-80" />
                    <span className="text-white font-medium">Transfer Items</span>
                  </div>
                  <p className="text-white/50 text-xs ml-8">Move selected items to another table or order.</p>
                </button>

                {/* Transfer Entire Order Section Title */}
                <div className="pt-0.5 -mb-1">
                  <div className="flex items-center gap-2">
                    <img src={transferEntireOrderIcon} alt="Transfer Entire Order" className="w-4 h-4 object-contain opacity-50" />
                    <p className="text-white/50 text-xs font-semibold uppercase tracking-wider">Transfer Entire Order</p>
                  </div>
                </div>

                {/* Transfer to Table */}
                <button 
                  onClick={() => {
                    setShowTransferIntentDialog(false);
                    navigate(`/tableorder/${tableId}/transfer?orderId=${transferIntentOrderId}&transferType=entire`);
                  }}
                  className="w-full p-3.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors text-left"
                >
                  <div className="flex items-center gap-3 mb-0.5">
                    <img src={transferToTableIcon} alt="Transfer to Table" className="w-5 h-5 object-contain opacity-80" />
                    <span className="text-white font-medium">Transfer to Table</span>
                  </div>
                  <p className="text-white/50 text-xs ml-8">Move this full order to another or new table.</p>
                </button>

                {/* Transfer to Order */}
                <button 
                  onClick={() => {
                    setShowTransferIntentDialog(false);
                    setSelectedTransferOrderId(null);
                    setTransferToOrderSourceId(transferIntentOrderId);
                    setShowTransferToOrderDialog(true);
                  }}
                  className="w-full p-3.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors text-left"
                >
                  <div className="flex items-center gap-3 mb-0.5">
                    <img src={transferToOrderIcon} alt="Transfer to Order" className="w-5 h-5 object-contain opacity-80" />
                    <span className="text-white font-medium">Transfer to Order</span>
                  </div>
                  <p className="text-white/50 text-xs ml-8">Move this full order to another order.</p>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transfer to Order Dialog (inline - no navigation) */}
      {showTransferToOrderDialog && (() => {
        const sourceOrder = allDbOrders.find(o => o.id === transferToOrderSourceId);
        const availableTransferOrders = dbTicketOrders.filter(o => o.id !== transferToOrderSourceId && o.status !== 'PAID' && o.status !== 'Completed');

        const executeTransfer = () => {
          if (!selectedTransferOrderId || !sourceOrder) return;
          setShowTransferToOrderDialog(false);
          const targetOrder = dbTicketOrders.find(o => o.id === selectedTransferOrderId);
          const targetTable = targetOrder?.table || sourceOrder.table;
          const itemNames = sourceOrder.items.map(item => item.name);
          
          const destinationLabel = targetTable && targetTable !== '--' && targetTable !== sourceOrder.table
            ? `${formatTableName(targetTable)} (Order #${selectedTransferOrderId})`
            : `Order #${selectedTransferOrderId}`;
          
          setLocalTransferResult({
            sourceOrderId: sourceOrder.id,
            destinationOrderId: selectedTransferOrderId,
            destinationLabel,
            transferredItemNames: itemNames,
            transferType: 'full',
          });
          
          // Update unified context so Tickets module reflects the transfer
          updateUnifiedOrders(prev => {
            const matchSource = (o: any) => o.name === sourceOrder.name && o.table === sourceOrder.table;
            const matchTarget = (o: any) => o.id === selectedTransferOrderId;
            const targetName = targetOrder ? targetOrder.name : `Order #${selectedTransferOrderId}`;

            return prev.map(o => {
              if (matchSource(o)) {
                return {
                  ...o,
                  items: [],
                  subtotal: 0, discount: 0, serviceCharge: 0, tax: 0, tip: 0, total: 0,
                  transferInfo: {
                    type: 'sent' as const,
                    transferType: 'full' as const,
                    targetOrderId: selectedTransferOrderId!,
                    targetOrderName: targetName,
                    itemCount: sourceOrder.items.length,
                    transferredItems: [...sourceOrder.items],
                  },
                };
              }
              if (matchTarget(o)) {
                const srcInPrev = prev.find(matchSource);
                const srcItems = srcInPrev ? srcInPrev.items : [];
                const newItems = [...o.items, ...srcItems];
                const newSub = newItems.reduce((s: number, item: any) => s + item.price * item.qty, 0);
                return {
                  ...o,
                  items: newItems,
                  subtotal: +newSub.toFixed(2),
                  tax: +(newSub * 0.0735).toFixed(2),
                  serviceCharge: +(newSub * 0.05).toFixed(2),
                  total: +(newSub + newSub * 0.05 + newSub * 0.0735 - o.discount).toFixed(2),
                  transferInfo: {
                    type: 'received' as const,
                    transferType: 'full' as const,
                    sourceOrderId: sourceOrder.id,
                    sourceOrderName: sourceOrder.name,
                    sourceTable: sourceOrder.table,
                    itemCount: sourceOrder.items.length,
                    transferredItems: [...sourceOrder.items],
                  },
                };
              }
              return o;
            });
          });

          // Select the source order to show its details with strikethrough
          const sourceGuest = guestOrders.find(g => g.id === sourceOrder.id);
          if (sourceGuest) {
            setSelectedGuest(sourceGuest);
          }
          
          toast.success(`Order transferred successfully to ${destinationLabel}`);
        };

        return (
          <Dialog open={showTransferToOrderDialog} onOpenChange={setShowTransferToOrderDialog}>
            <DialogContent className="bg-neutral-900 border-white/10 p-0 max-w-lg overflow-hidden" aria-describedby={undefined}>
              <div className="p-4 border-b border-white/10">
                <h2 className="text-white text-lg font-semibold">Transfer to Order</h2>
                <p className="text-white/50 text-sm mt-1">Select an active order to transfer</p>
              </div>

              <ScrollArea className="max-h-[60vh]">
                <div className="p-4 space-y-3">
                  {availableTransferOrders.map((order) => {
                    const isSelected = selectedTransferOrderId === order.id;
                    return (
                      <button
                        key={order.id}
                        onClick={() => setSelectedTransferOrderId(order.id)}
                        className={`w-full rounded-xl border overflow-hidden text-left transition-all ${isSelected ? 'border-white ring-1 ring-white/30' : 'border-white/[0.25] hover:border-white/40'}`}
                        style={{ backgroundColor: '#1B1C20' }}
                      >
                        <div className="p-3">
                          <OrderLayoutTemplate order={ticketToTemplateData(order as any)} showBorder={false} />
                          <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
                            {order.items.map((item, idx) => (
                              <div key={idx} className="flex items-center justify-between py-1">
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                  <span className="w-7 h-7 rounded-md border border-white/20 text-white text-xs font-medium flex items-center justify-center flex-shrink-0">{item.qty}</span>
                                  <span className="text-white text-sm truncate">{item.name}</span>
                                </div>
                                <span className="text-white/70 text-sm font-medium flex-shrink-0 ml-2">{formatPrice(item.price * item.qty)}</span>
                              </div>
                            ))}
                          </div>
                          <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
                            <span className="text-white/50 text-sm">{order.items.length} items</span>
                            <span className="text-white font-semibold text-sm">{formatPrice(order.items.reduce((s, i) => s + i.price * i.qty, 0))}</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>

              <div className="p-4 border-t border-white/10 flex gap-3">
                <button onClick={() => setShowTransferToOrderDialog(false)} className="flex-1 py-2.5 rounded-full font-medium text-sm bg-neutral-800 text-white hover:bg-neutral-700">Cancel</button>
                <button
                  onClick={executeTransfer}
                  disabled={!selectedTransferOrderId}
                  className={`flex-1 py-2.5 rounded-full font-medium text-sm ${selectedTransferOrderId ? 'text-black' : 'text-black/50 opacity-50'}`}
                  style={selectedTransferOrderId ? { background: "linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)" } : { background: '#555' }}
                >
                  Confirm Transfer
                </button>
              </div>
            </DialogContent>
          </Dialog>
        );
      })()}
    </>;
};
export default TableOrderDetails;