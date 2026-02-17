import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Check, 
  ChevronLeft, 
  ChevronRight,
  Clock,
  Phone,
  ExternalLink,
  AlertTriangle,
  Package,
  Wrench,
  HelpCircle,
  ChefHat,
  Shield,
  User,
  Timer,
  FileText,
  Smartphone,
  AlertCircle,
  ShieldAlert,
  Utensils,
  Copy
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";

// Types
interface OrderItem {
  qty: number;
  name: string;
  price: number;
  modifiers: string[];
  hasAllergy?: boolean;
  hasNotes?: boolean;
}

interface OnlineOrder {
  id: string;
  orderNumber: number;
  customerName: string;
  phone: string;
  platform: 'ubereats' | 'grubhub' | 'doordash' | 'direct';
  orderType: 'DELIVERY' | 'PICK UP' | 'DINE IN';
  isScheduled?: boolean;
  items: OrderItem[];
  total: number;
}

// Aggregator contact info - in real app, this would come from config/API
const aggregatorContacts: Record<string, { name: string; phone: string; supportUrl?: string }> = {
  ubereats: { name: 'Uber Eats Merchant Support', phone: '1-800-253-9377', supportUrl: 'https://help.uber.com' },
  doordash: { name: 'DoorDash Merchant Support', phone: '1-855-973-1040', supportUrl: 'https://help.doordash.com' },
  grubhub: { name: 'Grubhub Merchant Support', phone: '1-877-585-1085', supportUrl: 'https://about.grubhub.com' },
  direct: { name: 'Direct Order', phone: '' },
};

export interface ReportedItem {
  itemName: string;
  itemIndex: number;
  reason: 'out_of_stock' | 'quality_issue' | 'kitchen_error' | 'equipment_issue' | 'other';
  reasonLabel: string;
  otherReasonText?: string;
  snoozeDuration: '15min' | '1hr' | 'end_of_shift' | 'indefinite';
  priceImpact: number;
  originalPrice: number;
  unavailableQty: number;
  originalQty: number;
  reportedAt?: number; // Timestamp when reported (for countdown)
}

interface ReportExceptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: OnlineOrder | null;
  onReportItems: (items: ReportedItem[], auditData: AuditData) => void;
  userRole?: 'server' | 'manager' | 'admin';
  userName?: string;
  existingReports?: ReportedItem[];
}

export interface AuditData {
  reportedBy: string;
  reportedByRole: string;
  approvedBy?: string;
  timestamp: string;
  device: string;
  orderStatus: 'on_hold' | 'modified' | 'cancelled';
  customerNotified: boolean;
  platform: string;
  responseTimeoutMinutes: number;
}

const exceptionReasons = [
  { id: 'out_of_stock', label: 'Out of Stock', icon: Package },
  { id: 'quality_issue', label: 'Quality Exception', icon: AlertTriangle },
  { id: 'kitchen_error', label: 'Kitchen Error', icon: ChefHat },
  { id: 'equipment_issue', label: 'Equipment Exception', icon: Wrench },
  { id: 'other', label: 'Other', icon: HelpCircle, requiresExplanation: true },
] as const;

const snoozeDurations = [
  { id: '15min', label: '15 Minutes', roleLimit: 'server' },
  { id: '1hr', label: '1 Hour', roleLimit: 'server' },
  { id: 'end_of_shift', label: 'End of Shift', roleLimit: 'server' },
  { id: 'indefinite', label: 'Until Restored', roleLimit: 'manager', warning: 'This will hide the item from all future orders.' },
] as const;

const formatPrice = (price: number) => `$${price.toFixed(2)}`;

const CUSTOMER_RESPONSE_TIMEOUT = 10; // minutes

export function ReportExceptionDialog({
  open,
  onOpenChange,
  order,
  onReportItems,
  userRole = 'server',
  userName = 'Staff Member',
  existingReports = [],
}: ReportExceptionDialogProps) {
  const [step, setStep] = useState(0); // 0 = permission check, 1-3 = steps
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [itemReports, setItemReports] = useState<Map<number, Partial<ReportedItem>>>(new Map());
  const [activeItemIndex, setActiveItemIndex] = useState<number | null>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [awaitingApproval, setAwaitingApproval] = useState(false);
  const [managerApproval, setManagerApproval] = useState<{ name: string; confirmed: boolean } | null>(null);
  const isMobile = useIsMobile();

  // Check permission on open
  useEffect(() => {
    if (open) {
      setStep(0);
      setSelectedItems(new Set());
      setItemReports(new Map());
      setActiveItemIndex(null);
      setAwaitingApproval(false);
      setManagerApproval(null);
      
      // Role-based permission check
      if (userRole === 'manager' || userRole === 'admin') {
        setHasPermission(true);
        setStep(1);
      } else {
        setHasPermission(false);
      }
    }
  }, [open, userRole]);

  if (!order) return null;

  const aggregatorContact = aggregatorContacts[order.platform] || aggregatorContacts.direct;
  const isThirdPartyOrder = order.platform !== 'direct';

  // Calculate already reported quantity for each item
  const getAlreadyReportedQty = (itemIndex: number): number => {
    const existingReport = existingReports.find(r => r.itemIndex === itemIndex);
    return existingReport?.unavailableQty || 0;
  };

  // Get remaining available quantity for an item
  const getAvailableQty = (itemIndex: number): number => {
    const item = order.items[itemIndex];
    return item.qty - getAlreadyReportedQty(itemIndex);
  };

  const canUseDuration = (durationId: string) => {
    if (userRole === 'manager' || userRole === 'admin') return true;
    const duration = snoozeDurations.find(d => d.id === durationId);
    return duration?.roleLimit === 'server';
  };

  const toggleItem = (index: number) => {
    const availableQty = getAvailableQty(index);
    if (availableQty <= 0) return; // Can't select fully reported items
    
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
        setItemReports(prev => {
          const next = new Map(prev);
          next.delete(index);
          return next;
        });
      } else {
        next.add(index);
        const item = order.items[index];
        setItemReports(prev => {
          const next = new Map(prev);
          next.set(index, {
            itemName: item.name,
            itemIndex: index,
            reason: 'out_of_stock',
            reasonLabel: 'Out of Stock',
            snoozeDuration: '1hr',
            priceImpact: 0,
            originalPrice: item.price * availableQty,
            unavailableQty: availableQty,
            originalQty: availableQty,
          });
          return next;
        });
      }
      return next;
    });
  };

  const updateItemReport = (index: number, updates: Partial<ReportedItem>) => {
    setItemReports(prev => {
      const next = new Map(prev);
      const current = next.get(index) || {};
      next.set(index, { ...current, ...updates });
      return next;
    });
  };

  const calculateTotalImpact = () => {
    let total = 0;
    itemReports.forEach(report => {
      // Items are put on hold, actual refund handled by aggregator
      total -= report.originalPrice || 0;
    });
    return total;
  };

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
      if (step === 1 && selectedItems.size > 0) {
        setActiveItemIndex([...selectedItems][0]);
      }
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleRequestApproval = () => {
    setAwaitingApproval(true);
    // In real app, this would send notification to managers
  };

  const handleManagerApprove = () => {
    setManagerApproval({ name: 'Manager', confirmed: true });
    setHasPermission(true);
    setAwaitingApproval(false);
    setStep(1);
  };

  const validateStep2 = () => {
    // Check if "Other" reason has explanation
    for (const [index] of itemReports) {
      const report = itemReports.get(index);
      if (report?.reason === 'other' && (!report.otherReasonText || report.otherReasonText.length < 10)) {
        return false;
      }
    }
    return true;
  };

  const handleConfirm = () => {
    const reports: ReportedItem[] = [];
    itemReports.forEach((report, index) => {
      if (selectedItems.has(index)) {
        const item = order.items[index];
        reports.push({
          itemName: report.itemName || item.name,
          itemIndex: index,
          reason: report.reason || 'out_of_stock',
          reasonLabel: report.reasonLabel || 'Out of Stock',
          otherReasonText: report.otherReasonText,
          snoozeDuration: report.snoozeDuration || '1hr',
          priceImpact: -(report.originalPrice || 0),
          originalPrice: report.originalPrice || 0,
          unavailableQty: report.unavailableQty || item.qty,
          originalQty: report.originalQty || item.qty,
          reportedAt: Date.now(),
        });
      }
    });

    const auditData: AuditData = {
      reportedBy: userName,
      reportedByRole: userRole,
      approvedBy: managerApproval?.name,
      timestamp: new Date().toISOString(),
      device: navigator.userAgent.includes('Mobile') ? 'Mobile POS' : 'Desktop POS',
      orderStatus: 'on_hold',
      customerNotified: false, // Customer will be notified by aggregator
      platform: order.platform,
      responseTimeoutMinutes: CUSTOMER_RESPONSE_TIMEOUT,
    };

    onReportItems(reports, auditData);
    onOpenChange(false);
  };

  const copyPhoneNumber = () => {
    if (aggregatorContact.phone) {
      navigator.clipboard.writeText(aggregatorContact.phone);
      toast.success('Phone number copied!');
    }
  };

  const totalImpact = calculateTotalImpact();
  const newTotal = order.total + totalImpact;

  const updateUnavailableQty = (index: number, newQty: number) => {
    const item = order.items[index];
    const availableQty = getAvailableQty(index);
    const clampedQty = Math.max(1, Math.min(newQty, availableQty));
    updateItemReport(index, {
      unavailableQty: clampedQty,
      originalPrice: item.price * clampedQty,
    });
  };

  // Step 0: Permission Check
  const PermissionCheckContent = () => (
    <div className="flex flex-col h-full items-center justify-center p-6">
      <div className="bg-amber-500/20 rounded-full p-4 mb-4">
        <ShieldAlert className="w-12 h-12 text-amber-500" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">Manager Approval Required</h3>
      <p className="text-white/60 text-sm text-center mb-6 max-w-xs">
        Reporting an exception is a customer-impacting action that requires manager authorization.
      </p>
      
      {awaitingApproval ? (
        <div className="text-center">
          <div className="animate-pulse flex items-center gap-2 text-amber-400 mb-4">
            <Timer className="w-5 h-5" />
            <span>Awaiting manager approval...</span>
          </div>
          <Button 
            variant="outline" 
            onClick={() => setAwaitingApproval(false)}
            className="border-white/20 text-white hover:bg-white/10"
          >
            Cancel Request
          </Button>
          {/* Demo: Allow manager to approve */}
          <Button 
            onClick={handleManagerApprove}
            className="ml-2 bg-amber-500 hover:bg-amber-600 text-black font-semibold"
          >
            Approve (Demo)
          </Button>
        </div>
      ) : (
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="border-white/20 text-white hover:bg-white/10"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleRequestApproval}
            className="bg-amber-500 hover:bg-amber-600 text-black font-semibold"
          >
            Request Approval
          </Button>
        </div>
      )}
    </div>
  );

  // Step 1: Select Items
  const Step1Content = () => (
    <div className="flex flex-col h-full">
      {/* Warning Banner */}
      <div className="px-4 py-3 bg-amber-500/10 border-b border-amber-500/30">
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
          <p className="text-amber-400 text-xs">
            {isThirdPartyOrder 
              ? `This is a ${order.platform.toUpperCase()} order. Exception must be reported to the aggregator who will contact the customer.`
              : 'Reporting an exception will notify the customer and may pause this order.'
            }
          </p>
        </div>
      </div>
      
      <div className="px-4 py-3 border-b border-white/10">
        <p className="text-white/60 text-sm">Select items that cannot be fulfilled</p>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {order.items.map((item, idx) => {
            const isSelected = selectedItems.has(idx);
            const report = itemReports.get(idx);
            const availableQty = getAvailableQty(idx);
            const alreadyReported = getAlreadyReportedQty(idx);
            const unavailableQty = report?.unavailableQty || availableQty;
            const isFullyReported = availableQty <= 0;
            
            return (
              <div
                key={idx}
                className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors ${
                  isFullyReported
                    ? "bg-neutral-900 border border-transparent opacity-50"
                    : isSelected
                      ? "bg-amber-500/20 border border-amber-500"
                      : "bg-neutral-800 border border-transparent"
                }`}
              >
                <button
                  onClick={() => toggleItem(idx)}
                  disabled={isFullyReported}
                  className="flex items-center gap-3 flex-1 text-left disabled:cursor-not-allowed"
                >
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isFullyReported
                        ? "bg-[#FF6B6B]"
                        : isSelected 
                          ? "bg-amber-500" 
                          : "bg-neutral-700"
                    }`}
                  >
                    {isFullyReported ? (
                      <span className="text-white text-xs font-bold">✕</span>
                    ) : isSelected ? (
                      <Check className="w-4 h-4 text-black" />
                    ) : (
                      <span className="text-white/50 text-xs">{availableQty}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-medium ${isFullyReported ? 'text-[#FF6B6B] line-through' : 'text-foreground'}`}>
                        {item.name}
                      </p>
                      {/* Indicators */}
                      <div className="flex items-center gap-1">
                        {item.hasAllergy && (
                          <span title="Has allergy info">
                            <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                          </span>
                        )}
                        {item.modifiers && item.modifiers.length > 0 && (
                          <span title="Has modifiers">
                            <Utensils className="w-3.5 h-3.5 text-white/40" />
                          </span>
                        )}
                        {item.hasNotes && (
                          <span title="Has notes">
                            <FileText className="w-3.5 h-3.5 text-white/40" />
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {isFullyReported ? (
                        <span className="text-[#FF6B6B]">Already reported ({alreadyReported} of {item.qty})</span>
                      ) : alreadyReported > 0 ? (
                        <>Available: {availableQty} of {item.qty} <span className="text-[#FF6B6B]">({alreadyReported} reported)</span></>
                      ) : (
                        <>Ordered: {item.qty}</>
                      )}
                      {isSelected && unavailableQty < availableQty && (
                        <span className="text-amber-400 ml-1">
                          • Reporting {unavailableQty} unavailable
                        </span>
                      )}
                    </p>
                  </div>
                </button>
                
                {isSelected && !isFullyReported && (
                  <div className="flex items-center gap-2 ml-2">
                    <Select 
                      value={unavailableQty.toString()} 
                      onValueChange={(val) => updateUnavailableQty(idx, parseInt(val))}
                    >
                      <SelectTrigger className="w-auto bg-neutral-700 border-none text-white font-medium text-sm h-8 px-3 gap-1 rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-neutral-800 border-neutral-600 z-[100]">
                        {Array.from({ length: availableQty }, (_, i) => i + 1).map(num => (
                          <SelectItem 
                            key={num} 
                            value={num.toString()} 
                            className="text-white hover:bg-neutral-700 focus:bg-neutral-700"
                          >
                            {num}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className="text-sm font-semibold text-white min-w-[60px] text-right">
                      {formatPrice(item.price * unavailableQty)}
                    </span>
                  </div>
                )}
                
                {!isSelected && !isFullyReported && (
                  <span className="text-sm font-semibold text-white">
                    {formatPrice(item.price * availableQty)}
                  </span>
                )}
                
                {isFullyReported && (
                  <span className="text-sm font-semibold text-[#FF6B6B] line-through">
                    {formatPrice(item.price * item.qty)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>
      
      <div className="p-4 border-t border-white/10">
        <Button
          onClick={handleNext}
          disabled={selectedItems.size === 0}
          className="w-full bg-white hover:bg-white/90 text-black font-semibold"
        >
          Continue ({selectedItems.size} item{selectedItems.size !== 1 ? 's' : ''})
        </Button>
      </div>
    </div>
  );

  // Step 2: Exception Details (Reason & Duration only)
  const Step2Content = () => {
    const selectedArray = [...selectedItems];
    const currentIndex = selectedArray.indexOf(activeItemIndex || 0);
    const currentItem = activeItemIndex !== null ? order.items[activeItemIndex] : null;
    const currentReport = activeItemIndex !== null ? itemReports.get(activeItemIndex) : null;

    return (
      <div className="flex flex-col h-full min-h-0">
        {/* Item Navigation */}
        {selectedArray.length > 1 && (
          <div className="px-4 py-2 border-b border-white/10 flex items-center justify-between flex-shrink-0">
            <button
              onClick={() => setActiveItemIndex(selectedArray[Math.max(0, currentIndex - 1)])}
              disabled={currentIndex === 0}
              className="p-1 rounded-lg hover:bg-white/10 disabled:opacity-30"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <span className="text-white text-sm">
              Item {currentIndex + 1} of {selectedArray.length}
            </span>
            <button
              onClick={() => setActiveItemIndex(selectedArray[Math.min(selectedArray.length - 1, currentIndex + 1)])}
              disabled={currentIndex === selectedArray.length - 1}
              className="p-1 rounded-lg hover:bg-white/10 disabled:opacity-30"
            >
              <ChevronRight className="w-5 h-5 text-white" />
            </button>
          </div>
        )}

        {currentItem && (
          <ScrollArea className="flex-1 min-h-0">
            <div className="p-4 pb-6">
              {/* Item Info */}
              <div className="bg-neutral-800 rounded-xl p-3 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">{currentItem.name}</p>
                    <p className="text-white/60 text-sm">
                      Reporting {currentReport?.unavailableQty || 1} of {currentItem.qty}
                    </p>
                  </div>
                  <span className="text-white font-semibold">
                    {formatPrice(currentItem.price * (currentReport?.unavailableQty || 1))}
                  </span>
                </div>
              </div>

              {/* Exception Reason */}
              <div className="mb-4">
                <p className="text-white/60 text-sm mb-2">Reason</p>
                <div className="grid grid-cols-2 gap-2">
                  {exceptionReasons.map(reason => {
                    const isSelected = currentReport?.reason === reason.id;
                    const Icon = reason.icon;
                    return (
                      <button
                        key={reason.id}
                        onClick={() => updateItemReport(activeItemIndex!, { 
                          reason: reason.id,
                          reasonLabel: reason.label,
                          otherReasonText: reason.id === 'other' ? '' : undefined
                        })}
                        className={`flex items-center gap-2 p-3 rounded-xl transition-colors ${
                          isSelected
                            ? "bg-amber-500/20 border border-amber-500"
                            : "bg-neutral-800 hover:bg-neutral-700 border border-transparent"
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${isSelected ? 'text-amber-500' : 'text-white/60'}`} />
                        <span className={`text-sm ${isSelected ? 'text-amber-500' : 'text-white'}`}>
                          {reason.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
                
                {/* Other reason text field */}
                {currentReport?.reason === 'other' && (
                  <div className="mt-3">
                    <Textarea
                      value={currentReport.otherReasonText || ''}
                      onChange={(e) => updateItemReport(activeItemIndex!, { otherReasonText: e.target.value })}
                      placeholder="Please explain the exception (min 10 characters)..."
                      className="bg-neutral-800 border-neutral-700 text-white placeholder:text-white/40 min-h-[80px]"
                    />
                    <p className={`text-xs mt-1 ${
                      (currentReport.otherReasonText?.length || 0) >= 10 ? 'text-white/40' : 'text-amber-400'
                    }`}>
                      {currentReport.otherReasonText?.length || 0}/10 characters minimum
                    </p>
                  </div>
                )}
              </div>

              {/* Unavailability Duration */}
              <div className="mb-4">
                <p className="text-white/60 text-sm mb-2">Mark as unavailable for</p>
                <div className="grid grid-cols-2 gap-2">
                  {snoozeDurations.map(duration => {
                    const isSelected = currentReport?.snoozeDuration === duration.id;
                    const canUse = canUseDuration(duration.id);
                    return (
                      <button
                        key={duration.id}
                        onClick={() => canUse && updateItemReport(activeItemIndex!, { snoozeDuration: duration.id })}
                        disabled={!canUse}
                        className={`flex items-center gap-2 p-3 rounded-xl transition-colors ${
                          isSelected
                            ? "bg-white/20 border border-white"
                            : canUse 
                              ? "bg-neutral-800 hover:bg-neutral-700 border border-transparent"
                              : "bg-neutral-800/50 border border-transparent opacity-50 cursor-not-allowed"
                        }`}
                      >
                        <Clock className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-white/60'}`} />
                        <div className="text-left">
                          <span className={`text-sm ${isSelected ? 'text-white' : 'text-white/80'}`}>
                            {duration.label}
                          </span>
                          {!canUse && (
                            <p className="text-xs text-amber-400">Manager only</p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
                {currentReport?.snoozeDuration === 'indefinite' && (
                  <div className="mt-2 p-2 bg-amber-500/10 rounded-lg flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-amber-400">
                      This will hide the item from all future orders.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>
        )}

        <div className="p-4 border-t border-white/10 flex gap-2 flex-shrink-0">
          <Button variant="outline" onClick={handleBack} className="flex-1 border-white/20 text-white hover:bg-white/10">
            Back
          </Button>
          <Button 
            onClick={handleNext} 
            disabled={!validateStep2()}
            className="flex-1 bg-white hover:bg-white/90 text-black font-semibold"
          >
            Continue
          </Button>
        </div>
      </div>
    );
  };

  // Step 3: Confirmation with Aggregator Contact Info
  const Step3Content = () => {
    const platformName = order.platform.charAt(0).toUpperCase() + order.platform.slice(1);
    
    return (
      <div className="flex flex-col h-full">
        <ScrollArea className="flex-1">
          <div className="p-4">
            {/* Aggregator Contact Card - Only for third-party orders */}
            {isThirdPartyOrder && (
              <div className="mb-4 p-4 bg-neutral-800 rounded-xl border border-amber-500/30">
                <div className="flex items-center gap-2 mb-3">
                  <Phone className="w-5 h-5 text-amber-500" />
                  <p className="text-amber-500 font-medium">Contact Aggregator</p>
                </div>
                <p className="text-white/60 text-xs mb-3">
                  Call the aggregator to report this exception. They will contact the customer and inform you of the next steps.
                </p>
                <div className="bg-neutral-900 rounded-lg p-3">
                  <p className="text-white font-medium text-sm">{aggregatorContact.name}</p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-white text-lg font-bold">{aggregatorContact.phone}</p>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={copyPhoneNumber}
                      className="h-8 px-2 text-white/60 hover:text-white hover:bg-white/10"
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      Copy
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Order Hold Banner */}
            <div className="mb-4 p-3 bg-amber-500/10 rounded-xl border border-amber-500/30">
              <div className="flex items-center gap-2 mb-2">
                <Timer className="w-5 h-5 text-amber-500" />
                <p className="text-amber-500 font-medium">Order Will Be On Hold ({CUSTOMER_RESPONSE_TIMEOUT} mins)</p>
              </div>
              <p className="text-xs text-white/60">
                The order will be placed on hold while awaiting a response from {isThirdPartyOrder ? 'the aggregator' : 'the customer'}. 
                You can continue handling other orders during this time.
              </p>
            </div>

            {/* Possible Outcomes */}
            <div className="mb-4 p-3 bg-neutral-800/50 rounded-xl">
              <p className="text-white/60 text-xs font-medium mb-2 uppercase tracking-wide">Possible Outcomes</p>
              <ul className="text-xs text-white/80 space-y-1.5">
                <li className="flex items-start gap-2">
                  <span className="text-amber-400">•</span>
                  Replace item with a similar-priced alternative
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400">•</span>
                  Remove item from the order
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400">•</span>
                  Cancel the entire order
                </li>
              </ul>
              <p className="text-xs text-white/40 mt-2">
                Refunds are processed by {isThirdPartyOrder ? 'the aggregator' : 'the payment provider'}.
              </p>
            </div>

            <p className="text-white/60 text-sm mb-3">Items being reported</p>

            {/* Items Summary */}
            <div className="space-y-2 mb-4">
              {[...selectedItems].map(idx => {
                const item = order.items[idx];
                const report = itemReports.get(idx);
                const unavailableQty = report?.unavailableQty || item.qty;
                const availableQty = item.qty - unavailableQty;
                
                return (
                  <div key={idx} className="p-3 bg-neutral-800 rounded-xl">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-white font-medium">{item.name}</p>
                        <p className="text-xs text-amber-400">{report?.reasonLabel}</p>
                        {report?.otherReasonText && (
                          <p className="text-xs text-white/50 mt-1 italic">"{report.otherReasonText}"</p>
                        )}
                        <div className="flex gap-3 mt-1 text-xs">
                          <span className="text-white/60">
                            Ordered: <span className="text-white">{item.qty}</span>
                          </span>
                          <span className="text-amber-400">
                            Unavailable: {unavailableQty}
                          </span>
                          {availableQty > 0 && (
                            <span className="text-emerald-400">
                              Available: {availableQty}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-amber-400 text-sm">
                          {formatPrice(item.price * unavailableQty)}
                        </span>
                        {availableQty > 0 && (
                          <span className="text-emerald-400 text-xs block">
                            +{formatPrice(item.price * availableQty)} kept
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Status indicator */}
                    <div className="pt-2 border-t border-white/10">
                      <div className="flex items-center gap-2">
                        <Timer className="w-4 h-4 text-amber-500" />
                        <span className="text-amber-400 text-sm">Awaiting {isThirdPartyOrder ? 'aggregator' : 'customer'} decision</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Price Impact */}
            <div className="p-3 bg-neutral-800 rounded-xl mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-white/60">Original Total</span>
                <span className="text-white">{formatPrice(order.total)}</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-white/60">Items on Hold</span>
                <span className="text-amber-400">
                  {formatPrice(Math.abs(totalImpact))}
                </span>
              </div>
              <div className="flex justify-between text-base font-bold pt-2 border-t border-white/10">
                <span className="text-white">Remaining Total</span>
                <span className="text-white">{formatPrice(newTotal)}</span>
              </div>
            </div>

            {/* Audit Trail */}
            <div className="p-3 bg-neutral-800/50 rounded-xl mb-4">
              <p className="text-white/60 text-xs font-medium mb-2 uppercase tracking-wide">Audit Trail</p>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-white/40" />
                  <span className="text-white/60">Reported by:</span>
                  <span className="text-white">{userName} ({userRole})</span>
                </div>
                {managerApproval && (
                  <div className="flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5 text-white/40" />
                    <span className="text-white/60">Approved by:</span>
                    <span className="text-white">{managerApproval.name}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-white/40" />
                  <span className="text-white/60">Time:</span>
                  <span className="text-white">{new Date().toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Smartphone className="w-3.5 h-3.5 text-white/40" />
                  <span className="text-white/60">Device:</span>
                  <span className="text-white">{isMobile ? 'Mobile POS' : 'Desktop POS'}</span>
                </div>
              </div>
            </div>

            {/* Platform Handling Notice */}
            <div className="p-3 bg-neutral-800/50 rounded-xl">
              <div className="flex items-start gap-2">
                <ExternalLink className="w-4 h-4 text-white/40 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-white/60">
                  {isThirdPartyOrder 
                    ? `Refunds and customer communication handled by ${platformName}.`
                    : 'Refunds handled automatically by the payment processor.'
                  }
                </p>
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-white/10 flex gap-2">
          <Button variant="outline" onClick={handleBack} className="flex-1 border-white/20 text-white hover:bg-white/10">
            Back
          </Button>
          <Button onClick={handleConfirm} className="flex-1 bg-amber-500 hover:bg-amber-600 text-black font-semibold whitespace-nowrap">
            <Timer className="w-4 h-4 mr-2" />
            Put on Hold ({CUSTOMER_RESPONSE_TIMEOUT} mins)
          </Button>
        </div>
      </div>
    );
  };

  const getStepContent = () => {
    if (step === 0) return <PermissionCheckContent />;
    switch (step) {
      case 1: return <Step1Content />;
      case 2: return <Step2Content />;
      case 3: return <Step3Content />;
      default: return null;
    }
  };

  const getStepTitle = () => {
    if (step === 0) return 'Permission Required';
    switch (step) {
      case 1: return 'Select Items';
      case 2: return `Exception Details — Order #${order.orderNumber}`;
      case 3: return 'Confirm & Put on Hold';
      default: return 'Report Exception';
    }
  };

  // Step Indicator (now 3 steps instead of 4)
  const StepIndicator = () => {
    if (step === 0) return null;
    return (
      <div className="flex items-center justify-center gap-2 py-2">
        {[1, 2, 3].map(s => (
          <div
            key={s}
            className={`w-2 h-2 rounded-full transition-colors ${
              s === step ? 'bg-amber-500' : s < step ? 'bg-amber-500/60' : 'bg-white/20'
            }`}
          />
        ))}
      </div>
    );
  };

  // Use Drawer for mobile, Dialog for desktop
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="bg-neutral-900 border-sidebar-border max-h-[85vh]">
          <DrawerHeader className="border-b border-sidebar-border pb-2">
            <div className="flex items-center justify-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <DrawerTitle className="text-foreground text-lg font-semibold">
                {getStepTitle()}
              </DrawerTitle>
            </div>
            <StepIndicator />
          </DrawerHeader>
          <div className="flex-1 overflow-hidden">
            {getStepContent()}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] bg-neutral-900 border-sidebar-border p-0 gap-0 h-[80vh] max-h-[80vh] flex flex-col">
        <DialogHeader className="p-4 pb-2 border-b border-sidebar-border flex-shrink-0">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <DialogTitle className="text-foreground text-lg font-semibold">
              {getStepTitle()}
            </DialogTitle>
          </div>
          <StepIndicator />
        </DialogHeader>
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
          {getStepContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Re-export with old name for backward compatibility
export { ReportExceptionDialog as ReportIssueDialog };
