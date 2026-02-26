import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Receipt, User, Clock, ArrowRightLeft, CreditCard, AlertTriangle, CheckCircle2 } from "lucide-react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import dineInIcon from "@/assets/icons/order-types/dine-in.svg";
import takeOutIcon from "@/assets/icons/order-types/take-out.svg";
import deliveryIcon from "@/assets/icons/order-types/delivery.svg";
import driveThruIcon from "@/assets/icons/order-types/drive-thru.svg";
import curbSideIcon from "@/assets/icons/order-types/curb-side.svg";

// Mock employee data for transfer
interface Employee {
  id: string;
  name: string;
  jobType: string;
  role: string;
  avatar?: string;
}

const MOCK_EMPLOYEES: Employee[] = [
  { id: 'e1', name: 'Sarah Johnson', jobType: 'Server', role: 'Senior Staff' },
  { id: 'e2', name: 'Mike Chen', jobType: 'Bartender', role: 'Team Lead' },
  { id: 'e3', name: 'Emily Davis', jobType: 'Server', role: 'Staff' },
  { id: 'e4', name: 'James Wilson', jobType: 'Host', role: 'Staff' },
  { id: 'e5', name: 'Lisa Martinez', jobType: 'Manager', role: 'Shift Manager' },
  { id: 'e6', name: 'David Brown', jobType: 'Runner', role: 'Staff' },
];

// Check status types matching existing POS statuses
type CheckStatus = 'Ordering' | 'Waiting' | 'Ready' | 'Served' | 'Unpaid';

interface Check {
  id: string;
  orderType: 'table' | 'dine-in' | 'takeaway' | 'delivery' | 'drive-thru' | 'curb-side';
  tableNumber?: number;
  amount: number;
  guestName: string;
  status: CheckStatus;
  tipAdded?: number; // Tip amount in cents
  transferredTo?: { id: string; name: string }; // Track transferred checks
}

interface ClockOutValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProceedClockOut: () => void;
  employeeName: string;
  employeeAvatar?: string;
  shiftStartTime: Date;
  shiftEndTime: Date;
}

// Status color mapping matching Tickets screen exactly (no green/blue)
const getStatusColor = (status: CheckStatus): string => {
  switch (status) {
    case 'Ordering':
      return 'text-orange-400';
    case 'Waiting':
      return 'text-amber-400';
    case 'Ready':
      return 'text-amber-500'; // Green replaced with amber per project rules
    case 'Served':
      return 'text-white/60'; // Muted neutral
    case 'Unpaid':
      return 'text-red-400';
    default:
      return 'text-white/60';
  }
};

// Mock data for unpaid checks
const MOCK_UNPAID_CHECKS: Check[] = [
  { id: 'u1', orderType: 'table', tableNumber: 12, amount: 42.50, guestName: 'Mike R.', status: 'Unpaid' },
  { id: 'u2', orderType: 'table', tableNumber: 8, amount: 50.00, guestName: 'Emma L.', status: 'Unpaid' },
  { id: 'u3', orderType: 'curb-side', amount: 12.20, guestName: 'Jake P.', status: 'Unpaid' },
  { id: 'u4', orderType: 'drive-thru', amount: 26.36, guestName: 'Lisa K.', status: 'Unpaid' },
  { id: 'u5', orderType: 'dine-in', tableNumber: 5, amount: 42.50, guestName: 'Tom W.', status: 'Unpaid' },
  { id: 'u6', orderType: 'curb-side', amount: 42.50, guestName: 'Anna D.', status: 'Unpaid' },
  { id: 'u7', orderType: 'drive-thru', amount: 12.20, guestName: 'Chris B.', status: 'Unpaid' },
  { id: 'u8', orderType: 'dine-in', tableNumber: 1, amount: 66.58, guestName: 'Sarah M.', status: 'Unpaid' },
  { id: 'u9', orderType: 'drive-thru', amount: 26.36, guestName: 'Mike R.', status: 'Unpaid' },
  { id: 'u10', orderType: 'takeaway', amount: 35.00, guestName: 'David K.', status: 'Unpaid' },
];

// Mock data for open checks
const MOCK_OPEN_CHECKS: Check[] = [
  { id: 'o1', orderType: 'dine-in', tableNumber: 14, amount: 28.50, guestName: 'John D.', status: 'Ordering' },
  { id: 'o2', orderType: 'drive-thru', amount: 15.00, guestName: 'Amy S.', status: 'Waiting' },
  { id: 'o3', orderType: 'delivery', amount: 55.20, guestName: 'Mark T.', status: 'Ready' },
  { id: 'o4', orderType: 'dine-in', tableNumber: 22, amount: 78.90, guestName: 'Rachel G.', status: 'Served' },
  { id: 'o5', orderType: 'takeaway', amount: 22.40, guestName: 'Steve P.', status: 'Ordering' },
  { id: 'o6', orderType: 'curb-side', amount: 45.00, guestName: 'Nina L.', status: 'Waiting' },
  { id: 'o7', orderType: 'drive-thru', amount: 18.75, guestName: 'Kevin M.', status: 'Ready' },
];

const getOrderTypeIcon = (orderType: Check['orderType']) => {
  switch (orderType) {
    case 'table':
      return dineInIcon;
    case 'dine-in':
      return dineInIcon;
    case 'takeaway':
      return takeOutIcon;
    case 'delivery':
      return deliveryIcon;
    case 'drive-thru':
      return driveThruIcon;
    case 'curb-side':
      return curbSideIcon;
    default:
      return dineInIcon;
  }
};

const getOrderTypeLabel = (check: Check): string => {
  switch (check.orderType) {
    case 'table':
      return check.tableNumber ? `Table ${check.tableNumber}` : 'Table';
    case 'dine-in':
      return check.tableNumber ? `Dine In · T${check.tableNumber}` : 'Dine In';
    case 'takeaway':
      return 'Take Out';
    case 'delivery':
      return 'Delivery';
    case 'drive-thru':
      return 'Drive Thru';
    case 'curb-side':
      return 'Curb Side';
    default:
      return 'Order';
  }
};

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
};

const formatTime = (date: Date) => {
  // Safety check for invalid dates
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return '--:--';
  }
  return date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  }).replace(' ', '').toUpperCase();
};

const formatPrice = (price: number) => `$${price.toFixed(2)}`;

export const ClockOutValidationModal = ({
  isOpen,
  onClose,
  onProceedClockOut,
  employeeName,
  employeeAvatar,
  shiftStartTime,
  shiftEndTime,
}: ClockOutValidationModalProps) => {
  const [activeTab, setActiveTab] = useState<'unpaid' | 'open'>('unpaid');
  const [selectedChecks, setSelectedChecks] = useState<string[]>([]);
  const [unpaidChecks, setUnpaidChecks] = useState<Check[]>(MOCK_UNPAID_CHECKS);
  const [openChecks, setOpenChecks] = useState<Check[]>(MOCK_OPEN_CHECKS);
  const [transferPopoverOpen, setTransferPopoverOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [transferSuccess, setTransferSuccess] = useState<{ count: number; employeeName: string } | null>(null);
  const [showCloseCheckConfirm, setShowCloseCheckConfirm] = useState(false);
  const [closeCheckSuccess, setCloseCheckSuccess] = useState<{ count: number } | null>(null);
  const [showTipEntry, setShowTipEntry] = useState(false);
  const [tipAmount, setTipAmount] = useState('0');
  const [tipSuccess, setTipSuccess] = useState<{ amount: string } | null>(null);
  const [showReassignConfirm, setShowReassignConfirm] = useState<{ checkId: string; employeeName: string } | null>(null);
  
  // Bulk reassign state: reassign all checks from an employee
  const [showBulkReassignConfirm, setShowBulkReassignConfirm] = useState<{ employeeId: string; employeeName: string; checkIds: string[] } | null>(null);
  const [showBulkReassignPicker, setShowBulkReassignPicker] = useState(false);
  
  // Session-based helper text (shows once per session)
  const [hasShownGroupHelper, setHasShownGroupHelper] = useState(false);
  const [showGroupHelper, setShowGroupHelper] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedChecks([]);
      setSelectedEmployee(null);
      setTransferSuccess(null);
      setShowCloseCheckConfirm(false);
      setCloseCheckSuccess(null);
      setShowTipEntry(false);
      setTipAmount('0');
      setTipSuccess(null);
      setShowReassignConfirm(null);
      setShowBulkReassignConfirm(null);
      setShowBulkReassignPicker(false);
      setShowGroupHelper(false);
      // Default tab selection based on which currently has items
      setActiveTab(prev => {
        if (prev === 'unpaid' && unpaidChecks.length === 0 && openChecks.length > 0) return 'open';
        if (prev === 'open' && openChecks.length === 0 && unpaidChecks.length > 0) return 'unpaid';
        return prev;
      });
    }
  }, [isOpen]);

  const currentChecks = activeTab === 'unpaid' ? unpaidChecks : openChecks;
  const unpaidCount = unpaidChecks.length;
  const openCount = openChecks.length;
  const allChecksResolved = unpaidChecks.filter(c => !c.transferredTo).length === 0 && openCount === 0;

  // Group transferred checks by employee
  const transferredChecks = currentChecks.filter(c => c.transferredTo);
  const nonTransferredChecks = currentChecks.filter(c => !c.transferredTo);
  
  const groupedByEmployee = transferredChecks.reduce((acc, check) => {
    const empId = check.transferredTo!.id;
    const empName = check.transferredTo!.name;
    if (!acc[empId]) {
      acc[empId] = { name: empName, checks: [] };
    }
    acc[empId].checks.push(check);
    return acc;
  }, {} as Record<string, { name: string; checks: Check[] }>);
  
  const hasTransferredGroups = Object.keys(groupedByEmployee).length > 0;

  // Check if all checks in a group are selected
  const isEmployeeGroupFullySelected = (employeeId: string) => {
    const group = groupedByEmployee[employeeId];
    if (!group) return false;
    return group.checks.every(c => selectedChecks.includes(c.id));
  };

  // Toggle all checks in an employee group
  const handleToggleEmployeeGroup = (employeeId: string) => {
    const group = groupedByEmployee[employeeId];
    if (!group) return;
    
    const groupCheckIds = group.checks.map(c => c.id);
    const allSelected = isEmployeeGroupFullySelected(employeeId);
    
    if (allSelected) {
      // Deselect all from this group
      setSelectedChecks(prev => prev.filter(id => !groupCheckIds.includes(id)));
    } else {
      // Select all from this group
      setSelectedChecks(prev => [...new Set([...prev, ...groupCheckIds])]);
    }
  };

  // Show helper text when first grouped transfer happens
  useEffect(() => {
    if (hasTransferredGroups && !hasShownGroupHelper) {
      setShowGroupHelper(true);
      setHasShownGroupHelper(true);
      const timer = setTimeout(() => {
        setShowGroupHelper(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [hasTransferredGroups, hasShownGroupHelper]);

  // Handle bulk reassign: clear all checks from an employee and allow re-transfer
  const handleBulkReassignClick = (employeeId: string) => {
    const group = groupedByEmployee[employeeId];
    if (!group) return;
    
    setShowBulkReassignConfirm({
      employeeId,
      employeeName: group.name,
      checkIds: group.checks.map(c => c.id)
    });
  };

  const handleConfirmBulkReassign = () => {
    if (!showBulkReassignConfirm) return;
    
    // Clear transferred status for all checks from this employee
    const checkIds = showBulkReassignConfirm.checkIds;
    
    if (activeTab === 'unpaid') {
      setUnpaidChecks(prev => prev.map(c => 
        checkIds.includes(c.id) ? { ...c, transferredTo: undefined } : c
      ));
    } else {
      setOpenChecks(prev => prev.map(c => 
        checkIds.includes(c.id) ? { ...c, transferredTo: undefined } : c
      ));
    }
    
    // Select all these checks for transfer
    setSelectedChecks(checkIds);
    setShowBulkReassignConfirm(null);
    setShowBulkReassignPicker(true);
  };

  const handleCancelBulkReassign = () => {
    setShowBulkReassignConfirm(null);
  };

  // Get the CTA label based on selection context
  const getTransferCTALabel = () => {
    if (selectedChecks.length === 0) return 'Transfer';
    
    // Check how many selected checks have already been transferred (reassign scenario)
    const transferredSelectedChecks = selectedChecks.filter(checkId => {
      const check = currentChecks.find(c => c.id === checkId);
      return !!check?.transferredTo;
    });
    
    const isReassign = transferredSelectedChecks.length > 0;
    
    // If it's a reassign scenario, check if all selected are from a single employee group
    if (isReassign) {
      const employeeIds = new Set<string>();
      transferredSelectedChecks.forEach(checkId => {
        const check = currentChecks.find(c => c.id === checkId);
        if (check?.transferredTo) {
          employeeIds.add(check.transferredTo.id);
        }
      });
      
      if (employeeIds.size === 1) {
        const empId = Array.from(employeeIds)[0];
        const group = groupedByEmployee[empId];
        if (group && group.checks.length === selectedChecks.length) {
          return `Reassign all from ${group.name.split(' ')[0]}`;
        }
      }
      
      return `Reassign (${selectedChecks.length} check${selectedChecks.length > 1 ? 's' : ''})`;
    }
    
    // First-time transfer
    return 'Transfer';
  };


  const handleCheckToggle = (checkId: string) => {
    // Check if this check has been transferred
    const check = currentChecks.find(c => c.id === checkId);
    if (check?.transferredTo) {
      // Show reassign confirmation instead of selecting
      setShowReassignConfirm({ checkId, employeeName: check.transferredTo.name });
      return;
    }
    
    setSelectedChecks(prev => 
      prev.includes(checkId) 
        ? prev.filter(id => id !== checkId)
        : [...prev, checkId]
    );
  };

  const handleConfirmReassign = () => {
    if (!showReassignConfirm) return;
    
    // Clear the transferred status for this check
    if (activeTab === 'unpaid') {
      setUnpaidChecks(prev => prev.map(c => 
        c.id === showReassignConfirm.checkId 
          ? { ...c, transferredTo: undefined }
          : c
      ));
    } else {
      setOpenChecks(prev => prev.map(c => 
        c.id === showReassignConfirm.checkId 
          ? { ...c, transferredTo: undefined }
          : c
      ));
    }
    
    // Select the check for transfer
    setSelectedChecks([showReassignConfirm.checkId]);
    setShowReassignConfirm(null);
  };

  const handleCancelReassign = () => {
    setShowReassignConfirm(null);
  };

  const handleCharge = () => {
    if (selectedChecks.length !== 1) return;
    
    // Simulate charging the check
    const checkId = selectedChecks[0];
    if (activeTab === 'unpaid') {
      setUnpaidChecks(prev => prev.filter(c => c.id !== checkId));
    } else {
      setOpenChecks(prev => prev.filter(c => c.id !== checkId));
    }
    setSelectedChecks([]);
  };

  const handleSelectEmployeeForTransfer = (employee: Employee) => {
    setSelectedEmployee(employee);
    setTransferPopoverOpen(false);
  };

  const handleConfirmTransfer = () => {
    if (selectedChecks.length === 0 || !selectedEmployee) return;
    
    const transferCount = selectedChecks.length;
    const employeeName = selectedEmployee.name;
    const transferredTo = { id: selectedEmployee.id, name: selectedEmployee.name };
    
    // Mark checks as transferred instead of removing them
    if (activeTab === 'unpaid') {
      setUnpaidChecks(prev => prev.map(c => 
        selectedChecks.includes(c.id) 
          ? { ...c, transferredTo }
          : c
      ));
    } else {
      setOpenChecks(prev => prev.map(c => 
        selectedChecks.includes(c.id) 
          ? { ...c, transferredTo }
          : c
      ));
    }
    setSelectedChecks([]);
    setSelectedEmployee(null);
    
    // Show success feedback
    setTransferSuccess({ count: transferCount, employeeName });
    
    // Auto-hide success message after 2.5 seconds
    setTimeout(() => {
      setTransferSuccess(null);
    }, 2500);
  };

  const handleCancelTransfer = () => {
    setSelectedEmployee(null);
  };

  const handleCloseCheckClick = () => {
    setShowCloseCheckConfirm(true);
  };

  const handleConfirmCloseCheck = () => {
    if (selectedChecks.length === 0) return;
    
    const closeCount = selectedChecks.length;
    
    // Remove the closed checks
    setOpenChecks(prev => prev.filter(c => !selectedChecks.includes(c.id)));
    setSelectedChecks([]);
    setShowCloseCheckConfirm(false);
    
    // Show success feedback
    setCloseCheckSuccess({ count: closeCount });
    
    // Auto-hide success message after 2.5 seconds
    setTimeout(() => {
      setCloseCheckSuccess(null);
    }, 2500);
  };

  const handleCancelCloseCheck = () => {
    setShowCloseCheckConfirm(false);
  };

  // Tip Entry Handlers
  const handleAddTipClick = () => {
    setShowTipEntry(true);
    setTipAmount('0');
  };

  const handleTipKeyPress = (key: string) => {
    if (key === 'C') {
      setTipAmount('0');
    } else if (key === '00') {
      if (tipAmount !== '0') {
        setTipAmount(prev => prev + '00');
      }
    } else {
      // Limit to reasonable amount (max 6 digits = $9999.99)
      if (tipAmount.length < 6) {
        setTipAmount(prev => prev === '0' ? key : prev + key);
      }
    }
  };

  const formatTipDisplay = (value: string): string => {
    const cents = parseInt(value, 10) || 0;
    return `$${(cents / 100).toFixed(2)}`;
  };

  const handleConfirmTip = () => {
    if (tipAmount === '0' || selectedChecks.length !== 1) return;
    
    const tipCents = parseInt(tipAmount, 10) || 0;
    const formattedAmount = formatTipDisplay(tipAmount);
    const checkId = selectedChecks[0];
    
    // Update the check with the tip amount
    setOpenChecks(prev => prev.map(check => 
      check.id === checkId 
        ? { ...check, tipAdded: tipCents }
        : check
    ));
    
    // Reset tip entry and selection
    setShowTipEntry(false);
    setTipAmount('0');
    setSelectedChecks([]);
    
    // Show success feedback
    setTipSuccess({ amount: formattedAmount });
    
    // Auto-hide success message after 2.5 seconds
    setTimeout(() => {
      setTipSuccess(null);
    }, 2500);
  };

  const handleCancelTip = () => {
    setShowTipEntry(false);
    setTipAmount('0');
  };

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[10000] bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content 
          className={cn(
            "fixed left-[50%] top-[50%] z-[10001] translate-x-[-50%] translate-y-[-50%]",
            "max-w-2xl w-[95vw] p-0 border border-neutral-700 rounded-2xl overflow-hidden max-h-[90vh] flex flex-col",
            "duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]"
          )}
          style={{ backgroundColor: '#1B1C20' }}
        >
        {/* Header */}
        <div className="p-4 pb-3 border-b border-neutral-700/50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex-1" />
            <h2 className="text-white text-xl font-bold text-center">Clock Out</h2>
            <div className="flex-1 flex justify-end">
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:opacity-80"
                style={{ background: "#7575754D", boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)" }}
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
          
          <p className="text-white/60 text-sm text-center mb-4">
            Complete your shift by transferring unpaid checks and closing open checks.
          </p>

          {/* Employee Info Card - Dark theme matching Tickets */}
          <div 
            className="rounded-xl p-3 flex items-center gap-3 border border-neutral-700"
            style={{ backgroundColor: '#1B1C20' }}
          >
            <div className="w-12 h-12 rounded-full bg-neutral-700 overflow-hidden flex-shrink-0">
              {employeeAvatar ? (
                <img 
                  src={employeeAvatar} 
                  alt={employeeName} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-neutral-600">
                  <User className="w-6 h-6 text-white/60" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-base truncate">
                {getGreeting()}, {employeeName}
              </p>
              <p className="text-gray-400 text-sm flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {formatTime(shiftStartTime)} → {formatTime(shiftEndTime)}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs - Matching Tickets filter style */}
        <div className="px-4 pt-3">
          <div className="flex gap-2">
            <button
              onClick={() => {
                setActiveTab('unpaid');
                setSelectedChecks([]);
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-full font-medium text-sm transition-all ${
                activeTab === 'unpaid'
                  ? 'text-black'
                  : 'text-white'
              }`}
              style={activeTab === 'unpaid' 
                ? { background: "linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)" }
                : { background: "#7575754D", boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)" }
              }
            >
              <Receipt className="w-4 h-4" />
              Unpaid Checks
              {unpaidCount > 0 && (
                <span className={`min-w-[20px] h-5 px-1.5 rounded text-xs font-bold flex items-center justify-center ${
                  activeTab === 'unpaid' 
                    ? 'bg-black text-white' 
                    : 'bg-red-500 text-white'
                }`}>
                  {unpaidCount}
                </span>
              )}
            </button>
            <button
              onClick={() => {
                setActiveTab('open');
                setSelectedChecks([]);
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-full font-medium text-sm transition-all ${
                activeTab === 'open'
                  ? 'text-black'
                  : 'text-white'
              }`}
              style={activeTab === 'open' 
                ? { background: "linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)" }
                : { background: "#7575754D", boxShadow: "inset 4px 4px 24px 0px rgba(255, 255, 255, 0.15)" }
              }
            >
              <Receipt className="w-4 h-4" />
              Open Checks
              {openCount > 0 && (
                <span className={`min-w-[20px] h-5 px-1.5 rounded text-xs font-bold flex items-center justify-center ${
                  activeTab === 'open' 
                    ? 'bg-black text-white' 
                    : 'bg-orange-500 text-white'
                }`}>
                  {openCount}
                </span>
              )}
            </button>
          </div>
          
          {/* Select All toggle & Selection count */}
          {currentChecks.length > 0 && (
            <div className="mt-3 flex items-center justify-between">
              <button
                onClick={() => {
                  // Only include non-transferred checks in bulk selection
                  const selectableIds = currentChecks.filter(c => !c.transferredTo).map(c => c.id);
                  const allSelected = selectableIds.length > 0 && selectableIds.every(id => selectedChecks.includes(id));
                  if (allSelected) {
                    setSelectedChecks([]);
                  } else {
                    setSelectedChecks(selectableIds);
                  }
                }}
                className="text-xs text-white/60 hover:text-white transition-colors flex items-center gap-1.5"
              >
                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                  (() => {
                    const selectableChecks = currentChecks.filter(c => !c.transferredTo);
                    return selectableChecks.length > 0 && selectableChecks.every(c => selectedChecks.includes(c.id));
                  })()
                    ? 'bg-white border-white'
                    : 'border-white/40'
                }`}>
                  {(() => {
                    const selectableChecks = currentChecks.filter(c => !c.transferredTo);
                    return selectableChecks.length > 0 && selectableChecks.every(c => selectedChecks.includes(c.id));
                  })() && (
                    <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                Select All ({currentChecks.filter(c => !c.transferredTo).length})
              </button>
              
              {selectedChecks.length > 0 && (
                <span className="text-xs text-white/60">
                  {selectedChecks.length} check{selectedChecks.length > 1 ? 's' : ''} selected
                </span>
              )}
            </div>
          )}
        </div>

        {/* Check Cards Grid OR Tip Entry Keypad */}
        <div className="flex-1 overflow-y-auto p-4 pt-2 min-h-0">
          <AnimatePresence mode="wait">
            {showTipEntry ? (
              /* Inline Tip Entry Keypad - Replaces check list */
              <motion.div
                key="tip-entry"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col items-center justify-center h-full"
              >
                {/* Amount Display */}
                <div className="text-center mb-6">
                  <p className="text-white/50 text-xs uppercase tracking-wider mb-2">Tip Amount</p>
                  <p className="text-white text-5xl font-bold tracking-tight">
                    {formatTipDisplay(tipAmount)}
                  </p>
                </div>

                {/* Numeric Keypad */}
                <div className="grid grid-cols-3 gap-2 w-full max-w-xs">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '00', 'C'].map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleTipKeyPress(key)}
                      className={`h-14 rounded-xl font-semibold text-xl flex items-center justify-center transition-all active:scale-95 ${
                        key === 'C' 
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30' 
                          : 'text-white hover:bg-neutral-600'
                      }`}
                      style={key !== 'C' ? { 
                        backgroundColor: '#3A3A3A',
                        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1), 0 2px 4px rgba(0,0,0,0.3)'
                      } : undefined}
                    >
                      {key}
                    </button>
                  ))}
                </div>
              </motion.div>
            ) : (
              /* Check Cards Grid - with Employee Grouping for Transferred */
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="space-y-4"
              >
                {/* Non-transferred checks first */}
                {nonTransferredChecks.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {nonTransferredChecks.map((check) => {
                      const isSelected = selectedChecks.includes(check.id);
                      const hasTip = activeTab === 'open' && check.tipAdded && check.tipAdded > 0;
                      
                      return (
                        <button
                          key={check.id}
                          onClick={() => handleCheckToggle(check.id)}
                          className={`rounded-xl p-3 text-left transition-all border ${
                            isSelected 
                              ? 'bg-neutral-800 border-white ring-1 ring-white/30' 
                              : 'bg-neutral-800 border-neutral-700 hover:border-neutral-600'
                          }`}
                        >
                          {/* Order Type & Amount */}
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-1.5">
                              <img 
                                src={getOrderTypeIcon(check.orderType)} 
                                alt={check.orderType}
                                className="w-4 h-4 brightness-0 invert opacity-60"
                              />
                              <span className="font-semibold text-sm text-white">
                                {getOrderTypeLabel(check)}
                              </span>
                            </div>
                            <span className="font-bold text-sm text-white">
                              {formatPrice(check.amount)}
                            </span>
                          </div>

                          {/* Guest Name & Status */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-gray-400" />
                              <span className="text-xs truncate max-w-[80px] text-gray-400">
                                {check.guestName}
                              </span>
                            </div>
                            <div className="flex flex-col items-end gap-0.5">
                              {hasTip ? (
                                <span className="text-xs font-semibold text-amber-400">
                                  Tip: ${(check.tipAdded! / 100).toFixed(2)}
                                </span>
                              ) : (
                                <span className={`text-xs font-semibold uppercase ${getStatusColor(check.status)}`}>
                                  {check.status}
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Transferred checks grouped by employee */}
                {hasTransferredGroups && (
                  <div className="space-y-3">
                    {/* First-time helper text */}
                    <AnimatePresence>
                      {showGroupHelper && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                            <p className="text-xs text-amber-400/80">
                              Select individual checks or reassign all from an employee
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Divider before transferred section */}
                    {nonTransferredChecks.length > 0 && (
                      <div className="flex items-center gap-3 py-1">
                        <div className="flex-1 h-px bg-neutral-700/50" />
                        <span className="text-[10px] text-white/30 uppercase tracking-wider">Transferred</span>
                        <div className="flex-1 h-px bg-neutral-700/50" />
                      </div>
                    )}

                    {Object.entries(groupedByEmployee).map(([employeeId, group]) => {
                      const isGroupFullySelected = isEmployeeGroupFullySelected(employeeId);
                      const isGroupPartiallySelected = group.checks.some(c => selectedChecks.includes(c.id)) && !isGroupFullySelected;
                      
                      return (
                        <div key={employeeId} className="space-y-2">
                          {/* Employee Group Header */}
                          <div className={`flex items-center justify-between py-1.5 px-1 rounded-lg transition-colors ${
                            isGroupFullySelected ? 'bg-white/5' : ''
                          }`}>
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-neutral-700 flex items-center justify-center flex-shrink-0">
                                <span className="text-[10px] font-semibold text-white/60">
                                  {group.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                </span>
                              </div>
                              <div className="flex items-baseline gap-1.5">
                                <span className="text-xs font-medium text-white/70">
                                  {group.name.split(' ')[0]}
                                </span>
                                <span className="text-[10px] text-white/40">
                                  ({group.checks.length} check{group.checks.length > 1 ? 's' : ''})
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={() => handleToggleEmployeeGroup(employeeId)}
                              className={`text-[10px] font-medium px-2 py-1 rounded transition-colors ${
                                isGroupFullySelected
                                  ? 'text-white bg-white/10'
                                  : isGroupPartiallySelected
                                    ? 'text-amber-400 hover:text-amber-300'
                                    : 'text-white/50 hover:text-white/70'
                              }`}
                            >
                              {isGroupFullySelected ? 'Deselect All' : 'Select All'}
                            </button>
                          </div>

                          {/* Grouped Check Cards */}
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {group.checks.map((check) => {
                              const isSelected = selectedChecks.includes(check.id);
                              const hasTip = activeTab === 'open' && check.tipAdded && check.tipAdded > 0;
                              
                              return (
                                <button
                                  key={check.id}
                                  onClick={() => handleCheckToggle(check.id)}
                                  className={`rounded-xl p-3 text-left transition-all border ${
                                    isSelected 
                                      ? 'bg-neutral-800 border-amber-500/50 ring-1 ring-amber-500/30' 
                                      : 'bg-neutral-800/50 border-neutral-700/50 opacity-70 hover:opacity-90'
                                  }`}
                                >
                                  {/* Order Type & Amount */}
                                  <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-1.5">
                                      <img 
                                        src={getOrderTypeIcon(check.orderType)} 
                                        alt={check.orderType}
                                        className={`w-4 h-4 brightness-0 invert ${isSelected ? 'opacity-60' : 'opacity-40'}`}
                                      />
                                      <span className={`font-semibold text-sm ${isSelected ? 'text-white' : 'text-white/60'}`}>
                                        {getOrderTypeLabel(check)}
                                      </span>
                                    </div>
                                    <span className={`font-bold text-sm ${isSelected ? 'text-white' : 'text-white/60'}`}>
                                      {formatPrice(check.amount)}
                                    </span>
                                  </div>

                                  {/* Guest Name & Transfer Info */}
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                      <User className={`w-3.5 h-3.5 ${isSelected ? 'text-gray-400' : 'text-gray-500'}`} />
                                      <span className={`text-xs truncate max-w-[80px] ${isSelected ? 'text-gray-400' : 'text-gray-500'}`}>
                                        {check.guestName}
                                      </span>
                                    </div>
                                    <div className="flex flex-col items-end gap-0.5">
                                      {hasTip ? (
                                        <span className="text-xs font-semibold text-amber-400">
                                          Tip: ${(check.tipAdded! / 100).toFixed(2)}
                                        </span>
                                      ) : (
                                        <>
                                          <span className="text-xs font-medium text-white/40 truncate max-w-[90px]">
                                            → {check.transferredTo!.name.split(' ')[0]}
                                          </span>
                                          {!isSelected && (
                                            <span 
                                              className="text-[9px] text-white/30"
                                              style={{
                                                background: 'linear-gradient(90deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0.2) 100%)',
                                                backgroundSize: '200% 100%',
                                                WebkitBackgroundClip: 'text',
                                                WebkitTextFillColor: 'transparent',
                                                animation: 'shimmer 2s infinite linear',
                                              }}
                                            >
                                              Tap to re-assign
                                            </span>
                                          )}
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty state - only show when not in tip entry mode */}
          {currentChecks.length === 0 && !showTipEntry && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Receipt className="w-12 h-12 text-white/20 mb-3" />
              <p className="text-white/60 text-sm">
                No {activeTab === 'unpaid' ? 'unpaid' : 'open'} checks
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions - Show success, confirmation, or action buttons */}
        <AnimatePresence mode="wait">
          {/* Transfer Success Feedback */}
          {transferSuccess && (
            <motion.div 
              key="success"
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="p-4 pt-3 border-t border-neutral-700/50"
            >
              <div 
                className="rounded-xl p-4 border border-amber-500/30"
                style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)' }}
              >
                <div className="flex items-center gap-3">
                  {/* Success Icon with pulse animation */}
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ 
                      type: "spring", 
                      stiffness: 300, 
                      damping: 15,
                      delay: 0.1 
                    }}
                    className="flex-shrink-0"
                  >
                    <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-amber-400" />
                    </div>
                  </motion.div>
                  
                  {/* Success Message */}
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15, duration: 0.2 }}
                    className="flex-1 min-w-0"
                  >
                    <p className="text-white text-sm font-semibold">
                      Transfer Complete
                    </p>
                    <p className="text-white/60 text-xs mt-0.5">
                      {transferSuccess.count} check{transferSuccess.count > 1 ? 's' : ''} transferred to {transferSuccess.employeeName}
                    </p>
                  </motion.div>
                  
                  {/* Checkmark indicator */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ 
                      type: "spring", 
                      stiffness: 400, 
                      damping: 15,
                      delay: 0.25 
                    }}
                  >
                    <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center">
                      <svg className="w-3.5 h-3.5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Close Check Success Animation */}
          {closeCheckSuccess && (
            <motion.div 
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="p-4 pt-3 border-t border-neutral-700/50"
            >
              <div 
                className="rounded-xl p-4 border border-amber-500/30"
                style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)' }}
              >
                <div className="flex items-center gap-3">
                  {/* Success Icon with pulse animation */}
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ 
                      type: "spring", 
                      stiffness: 300, 
                      damping: 15,
                      delay: 0.1 
                    }}
                    className="flex-shrink-0"
                  >
                    <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-amber-400" />
                    </div>
                  </motion.div>
                  
                  {/* Success Message */}
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15, duration: 0.2 }}
                    className="flex-1 min-w-0"
                  >
                    <p className="text-white text-sm font-semibold">
                      Check{closeCheckSuccess.count > 1 ? 's' : ''} Closed
                    </p>
                    <p className="text-white/60 text-xs mt-0.5">
                      {closeCheckSuccess.count} check{closeCheckSuccess.count > 1 ? 's' : ''} successfully closed
                    </p>
                  </motion.div>
                  
                  {/* Checkmark indicator */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ 
                      type: "spring", 
                      stiffness: 400, 
                      damping: 15,
                      delay: 0.25 
                    }}
                  >
                    <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center">
                      <svg className="w-3.5 h-3.5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Tip Success Animation */}
          {tipSuccess && (
            <motion.div 
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="p-4 pt-3 border-t border-neutral-700/50"
            >
              <div 
                className="rounded-xl p-4 border border-amber-500/30"
                style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)' }}
              >
                <div className="flex items-center gap-3">
                  {/* Success Icon with pulse animation */}
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ 
                      type: "spring", 
                      stiffness: 300, 
                      damping: 15,
                      delay: 0.1 
                    }}
                    className="flex-shrink-0"
                  >
                    <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-amber-400" />
                    </div>
                  </motion.div>
                  
                  {/* Success Message */}
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15, duration: 0.2 }}
                    className="flex-1 min-w-0"
                  >
                    <p className="text-white text-sm font-semibold">
                      Tip Added
                    </p>
                    <p className="text-white/60 text-xs mt-0.5">
                      {tipSuccess.amount} tip added successfully
                    </p>
                  </motion.div>
                  
                  {/* Checkmark indicator */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ 
                      type: "spring", 
                      stiffness: 400, 
                      damping: 15,
                      delay: 0.25 
                    }}
                  >
                    <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center">
                      <svg className="w-3.5 h-3.5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Tip Entry CTAs - Back + Add Tip */}
          {showTipEntry && (
            <motion.div 
              key="tip-entry-actions"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.2 }}
              className="p-4 pt-3 border-t border-neutral-700/50"
            >
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCancelTip}
                  className="flex-1 h-12 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all text-white border border-neutral-600 hover:bg-neutral-700"
                  style={{ backgroundColor: 'transparent' }}
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleConfirmTip}
                  disabled={tipAmount === '0'}
                  className={`flex-1 h-12 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
                    tipAmount === '0' 
                      ? 'opacity-50 cursor-not-allowed text-white/50' 
                      : 'text-white'
                  }`}
                  style={{ 
                    background: tipAmount === '0' 
                      ? '#4A4A4A' 
                      : "linear-gradient(180deg, hsl(27, 96%, 61%) 0%, hsl(21, 90%, 48%) 100%)" 
                  }}
                >
                  <CreditCard className="w-4 h-4" />
                  Add Tip
                </button>
              </div>
            </motion.div>
          )}

          {/* Reassign Confirmation Modal */}
          {showReassignConfirm && (
            <motion.div 
              key="reassign-confirmation"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.2 }}
              className="p-4 pt-3 border-t border-neutral-700/50"
            >
              <div 
                className="rounded-xl p-4 border border-neutral-600"
                style={{ backgroundColor: '#27282C' }}
              >
                <div className="flex items-start gap-3">
                  {/* Warning Icon */}
                  <div className="flex-shrink-0 mt-0.5">
                    <ArrowRightLeft className="w-5 h-5 text-amber-400" />
                  </div>
                  
                  {/* Message Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-semibold">
                      Check Already Transferred
                    </p>
                    <p className="text-white/60 text-xs mt-1">
                      This check was transferred to {showReassignConfirm.employeeName}. Do you want to reassign it?
                    </p>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-2 mt-4">
                  <button
                    type="button"
                    onClick={handleCancelReassign}
                    className="flex-1 h-10 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all text-white border border-neutral-600 hover:bg-neutral-700"
                    style={{ backgroundColor: 'transparent' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmReassign}
                    className="flex-1 h-10 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all text-white"
                    style={{ 
                      background: "linear-gradient(180deg, hsl(27, 96%, 61%) 0%, hsl(21, 90%, 48%) 100%)" 
                    }}
                  >
                    <ArrowRightLeft className="w-4 h-4" />
                    Reassign
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Bulk Reassign Confirmation Modal */}
          {showBulkReassignConfirm && (
            <motion.div 
              key="bulk-reassign-confirmation"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.2 }}
              className="p-4 pt-3 border-t border-neutral-700/50"
            >
              <div 
                className="rounded-xl p-4 border border-amber-500/30"
                style={{ backgroundColor: 'rgba(245, 158, 11, 0.08)' }}
              >
                <div className="flex items-start gap-3">
                  {/* Warning Icon */}
                  <div className="flex-shrink-0 mt-0.5">
                    <ArrowRightLeft className="w-5 h-5 text-amber-400" />
                  </div>
                  
                  {/* Message Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-semibold">
                      Reassign All Checks
                    </p>
                    <p className="text-white/60 text-xs mt-1">
                      Reassign {showBulkReassignConfirm.checkIds.length} check{showBulkReassignConfirm.checkIds.length > 1 ? 's' : ''} from {showBulkReassignConfirm.employeeName} to another employee?
                    </p>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-2 mt-4">
                  <button
                    type="button"
                    onClick={handleCancelBulkReassign}
                    className="flex-1 h-10 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all text-white border border-neutral-600 hover:bg-neutral-700"
                    style={{ backgroundColor: 'transparent' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmBulkReassign}
                    className="flex-1 h-10 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all text-white"
                    style={{ 
                      background: "linear-gradient(180deg, hsl(27, 96%, 61%) 0%, hsl(21, 90%, 48%) 100%)" 
                    }}
                  >
                    <ArrowRightLeft className="w-4 h-4" />
                    Confirm Reassign
                  </button>
                </div>
              </div>
            </motion.div>
          )}
          
          {/* Action Buttons - Only show when checks are selected and no success message or tip entry */}
          {selectedChecks.length > 0 && !transferSuccess && !closeCheckSuccess && !tipSuccess && !showTipEntry && !showReassignConfirm && !showBulkReassignConfirm && (
            <motion.div 
              key={selectedEmployee ? 'transfer-confirmation' : showCloseCheckConfirm ? 'close-confirmation' : 'actions'}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.2 }}
              className="p-4 pt-3 border-t border-neutral-700/50"
            >
              {/* Inline Transfer Confirmation Alert */}
              {selectedEmployee ? (
                <div 
                  className="rounded-xl p-4 border border-neutral-600"
                  style={{ backgroundColor: '#27282C' }}
                >
                  <div className="flex items-start gap-3">
                    {/* Warning Icon */}
                    <div className="flex-shrink-0 mt-0.5">
                      <AlertTriangle className="w-5 h-5 text-amber-400" />
                    </div>
                    
                    {/* Message Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium">
                        You are about to transfer {selectedChecks.length} unpaid check{selectedChecks.length > 1 ? 's' : ''} to {selectedEmployee.name}.
                      </p>
                      <p className="text-white/50 text-xs mt-1">
                        This action cannot be undone.
                      </p>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex gap-2 mt-4">
                    <button
                      type="button"
                      onClick={handleCancelTransfer}
                      className="flex-1 h-10 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all text-white border border-neutral-600 hover:bg-neutral-700"
                      style={{ backgroundColor: 'transparent' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmTransfer}
                      className="flex-1 h-10 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all text-black"
                      style={{ 
                        background: "linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)" 
                      }}
                    >
                      <ArrowRightLeft className="w-4 h-4" />
                      Confirm Transfer
                    </button>
                  </div>
                </div>
              ) : showCloseCheckConfirm ? (
                /* Inline Close Check Confirmation Alert */
                <div 
                  className="rounded-xl p-4 border border-neutral-600"
                  style={{ backgroundColor: '#27282C' }}
                >
                  <div className="flex items-start gap-3">
                    {/* Warning Icon */}
                    <div className="flex-shrink-0 mt-0.5">
                      <AlertTriangle className="w-5 h-5 text-amber-400" />
                    </div>
                    
                    {/* Message Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium">
                        You are about to close {selectedChecks.length} open check{selectedChecks.length > 1 ? 's' : ''}.
                      </p>
                      <p className="text-white/50 text-xs mt-1">
                        This action cannot be undone.
                      </p>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex gap-2 mt-4">
                    <button
                      type="button"
                      onClick={handleCancelCloseCheck}
                      className="flex-1 h-10 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all text-white border border-neutral-600 hover:bg-neutral-700"
                      style={{ backgroundColor: 'transparent' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmCloseCheck}
                      className="flex-1 h-10 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all text-black"
                      style={{ 
                        background: "linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)" 
                      }}
                    >
                      <Receipt className="w-4 h-4" />
                      Confirm Close
                    </button>
                  </div>
                </div>
              ) : (
                /* Default Action Buttons - Different for Unpaid vs Open tabs */
                <div className="flex gap-2">
                  {activeTab === 'unpaid' ? (
                    /* Unpaid Checks: Charge + Transfer */
                    <>
                      {selectedChecks.length === 1 && (
                        <button
                          onClick={handleCharge}
                          className="flex-1 h-12 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all text-white"
                          style={{ 
                            background: "linear-gradient(180deg, hsl(27, 96%, 61%) 0%, hsl(21, 90%, 48%) 100%)" 
                          }}
                        >
                          <CreditCard className="w-4 h-4" />
                          Charge
                        </button>
                      )}
                      <Popover open={transferPopoverOpen} onOpenChange={setTransferPopoverOpen} modal={true}>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className={`${selectedChecks.length === 1 && !nonTransferredChecks.find(c => c.id === selectedChecks[0]) ? 'flex-1' : selectedChecks.length === 1 ? 'flex-1' : 'w-full'} h-12 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all text-black`}
                            style={{ 
                              background: "linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)" 
                            }}
                          >
                            <ArrowRightLeft className="w-4 h-4" />
                            {getTransferCTALabel()}
                          </button>
                        </PopoverTrigger>
                        <PopoverContent 
                          side="top" 
                          align="center"
                          sideOffset={8}
                          className="w-72 p-0 border-neutral-700 rounded-xl overflow-hidden z-[10002]"
                          style={{ backgroundColor: '#1B1C20' }}
                        >
                          <div className="p-3 border-b border-neutral-700/50">
                            <p className="text-white text-sm font-semibold">Transfer to Employee</p>
                            <p className="text-white/50 text-xs mt-0.5">
                              {selectedChecks.length} check{selectedChecks.length > 1 ? 's' : ''} selected
                            </p>
                          </div>
                          <div className="max-h-64 overflow-y-auto">
                            {MOCK_EMPLOYEES.map((employee) => {
                              // Check if this employee is the source of any selected transferred checks
                              const isSourceEmployee = selectedChecks.some(checkId => {
                                const check = currentChecks.find(c => c.id === checkId);
                                return check?.transferredTo?.id === employee.id;
                              });
                              
                              return (
                                <button
                                  key={employee.id}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (!isSourceEmployee) {
                                      handleSelectEmployeeForTransfer(employee);
                                    }
                                  }}
                                  disabled={isSourceEmployee}
                                  className={`w-full p-3 flex items-center gap-3 transition-colors border-b border-neutral-700/30 last:border-b-0 ${
                                    isSourceEmployee 
                                      ? 'opacity-40 cursor-not-allowed' 
                                      : 'hover:bg-neutral-800'
                                  }`}
                                >
                                  <div className="w-9 h-9 rounded-full bg-neutral-700 flex items-center justify-center flex-shrink-0">
                                    <User className="w-4 h-4 text-white/60" />
                                  </div>
                                  <div className="flex-1 text-left min-w-0">
                                    <p className="text-white text-sm font-medium truncate">
                                      {employee.name}
                                      {isSourceEmployee && <span className="text-white/40 text-xs ml-1">(current)</span>}
                                    </p>
                                    <div className="flex items-center gap-2 text-xs">
                                      <span className="text-amber-400 font-medium">{employee.jobType}</span>
                                      <span className="text-white/40">•</span>
                                      <span className="text-white/50">{employee.role}</span>
                                    </div>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </>
                  ) : (
                    /* Open Checks: Add Tip + Close Check */
                    <>
                      {selectedChecks.length === 1 && (() => {
                        const selectedCheck = openChecks.find(c => c.id === selectedChecks[0]);
                        const hasTip = selectedCheck?.tipAdded && selectedCheck.tipAdded > 0;
                        return !hasTip ? (
                          <button
                            onClick={handleAddTipClick}
                            className="flex-1 h-12 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all text-white"
                            style={{ 
                              background: "linear-gradient(180deg, hsl(27, 96%, 61%) 0%, hsl(21, 90%, 48%) 100%)" 
                            }}
                          >
                            <CreditCard className="w-4 h-4" />
                            Add Tip
                          </button>
                        ) : null;
                      })()}
                      <button
                        type="button"
                        onClick={handleCloseCheckClick}
                        className={`${selectedChecks.length === 1 && !openChecks.find(c => c.id === selectedChecks[0])?.tipAdded ? 'flex-1' : 'w-full'} h-12 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all text-black`}
                        style={{ 
                          background: "linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)" 
                        }}
                      >
                        <Receipt className="w-4 h-4" />
                        Close Check
                      </button>
                    </>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};

export default ClockOutValidationModal;
