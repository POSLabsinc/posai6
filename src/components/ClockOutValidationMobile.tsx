import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Receipt, User, Clock, ArrowRightLeft, CreditCard, AlertTriangle, CheckCircle2 } from "lucide-react";
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

type CheckStatus = 'Ordering' | 'Waiting' | 'Ready' | 'Served' | 'Unpaid';

interface Check {
  id: string;
  orderType: 'table' | 'dine-in' | 'takeaway' | 'delivery' | 'drive-thru' | 'curb-side';
  tableNumber?: number;
  amount: number;
  guestName: string;
  status: CheckStatus;
  tipAdded?: number;
  transferredTo?: { id: string; name: string };
}

interface ClockOutValidationMobileProps {
  isOpen: boolean;
  onClose: () => void;
  onProceedClockOut: () => void;
  employeeName: string;
  employeeAvatar?: string;
  shiftStartTime: Date;
  shiftEndTime: Date;
}

const getStatusColor = (status: CheckStatus): string => {
  switch (status) {
    case 'Ordering':
      return 'text-orange-400';
    case 'Waiting':
      return 'text-amber-400';
    case 'Ready':
      return 'text-amber-500';
    case 'Served':
      return 'text-white/60';
    case 'Unpaid':
      return 'text-red-400';
    default:
      return 'text-white/60';
  }
};

const MOCK_UNPAID_CHECKS: Check[] = [
  { id: 'u1', orderType: 'table', tableNumber: 12, amount: 42.50, guestName: 'Mike R.', status: 'Unpaid' },
  { id: 'u2', orderType: 'table', tableNumber: 8, amount: 50.00, guestName: 'Emma L.', status: 'Unpaid' },
  { id: 'u3', orderType: 'curb-side', amount: 12.20, guestName: 'Jake P.', status: 'Unpaid' },
  { id: 'u4', orderType: 'drive-thru', amount: 26.36, guestName: 'Lisa K.', status: 'Unpaid' },
  { id: 'u5', orderType: 'dine-in', tableNumber: 5, amount: 42.50, guestName: 'Tom W.', status: 'Unpaid' },
  { id: 'u6', orderType: 'curb-side', amount: 42.50, guestName: 'Anna D.', status: 'Unpaid' },
  { id: 'u7', orderType: 'drive-thru', amount: 12.20, guestName: 'Chris B.', status: 'Unpaid' },
  { id: 'u8', orderType: 'dine-in', tableNumber: 1, amount: 66.58, guestName: 'Sarah M.', status: 'Unpaid' },
];

const MOCK_OPEN_CHECKS: Check[] = [
  { id: 'o1', orderType: 'dine-in', tableNumber: 14, amount: 28.50, guestName: 'John D.', status: 'Ordering' },
  { id: 'o2', orderType: 'drive-thru', amount: 15.00, guestName: 'Amy S.', status: 'Waiting' },
  { id: 'o3', orderType: 'delivery', amount: 55.20, guestName: 'Mark T.', status: 'Ready' },
  { id: 'o4', orderType: 'dine-in', tableNumber: 22, amount: 78.90, guestName: 'Rachel G.', status: 'Served' },
  { id: 'o5', orderType: 'takeaway', amount: 22.40, guestName: 'Steve P.', status: 'Ordering' },
];

const getOrderTypeIcon = (orderType: Check['orderType']) => {
  switch (orderType) {
    case 'table':
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

export const ClockOutValidationMobile = ({
  isOpen,
  onClose,
  onProceedClockOut,
  employeeName,
  employeeAvatar,
  shiftStartTime,
  shiftEndTime,
}: ClockOutValidationMobileProps) => {
  const [activeTab, setActiveTab] = useState<'unpaid' | 'open'>('unpaid');
  const [selectedChecks, setSelectedChecks] = useState<string[]>([]);
  const [unpaidChecks, setUnpaidChecks] = useState<Check[]>(MOCK_UNPAID_CHECKS);
  const [openChecks, setOpenChecks] = useState<Check[]>(MOCK_OPEN_CHECKS);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [transferSuccess, setTransferSuccess] = useState<{ count: number; employeeName: string } | null>(null);
  const [showCloseCheckConfirm, setShowCloseCheckConfirm] = useState(false);
  const [closeCheckSuccess, setCloseCheckSuccess] = useState<{ count: number } | null>(null);
  const [showTipEntry, setShowTipEntry] = useState(false);
  const [tipAmount, setTipAmount] = useState('0');
  const [tipSuccess, setTipSuccess] = useState<{ amount: string } | null>(null);
  const [showReassignConfirm, setShowReassignConfirm] = useState<{ checkId: string; employeeName: string } | null>(null);
  const [showEmployeePicker, setShowEmployeePicker] = useState(false);
  const [showBulkReassignConfirm, setShowBulkReassignConfirm] = useState<{ employeeId: string; employeeName: string; checkIds: string[] } | null>(null);
  const [hasShownGroupHelper, setHasShownGroupHelper] = useState(false);
  const [showGroupHelper, setShowGroupHelper] = useState(false);

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
      setShowEmployeePicker(false);
      setShowBulkReassignConfirm(null);
      setShowGroupHelper(false);
      if (MOCK_UNPAID_CHECKS.length > 0) {
        setActiveTab('unpaid');
      } else {
        setActiveTab('open');
      }
    }
  }, [isOpen]);

  const currentChecks = activeTab === 'unpaid' ? unpaidChecks : openChecks;
  const unpaidCount = unpaidChecks.length;
  const openCount = openChecks.length;
  const allChecksResolved = unpaidCount === 0 && openCount === 0;

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

  const isEmployeeGroupFullySelected = (employeeId: string) => {
    const group = groupedByEmployee[employeeId];
    if (!group) return false;
    return group.checks.every(c => selectedChecks.includes(c.id));
  };

  const handleToggleEmployeeGroup = (employeeId: string) => {
    const group = groupedByEmployee[employeeId];
    if (!group) return;
    
    const groupCheckIds = group.checks.map(c => c.id);
    const allSelected = isEmployeeGroupFullySelected(employeeId);
    
    if (allSelected) {
      setSelectedChecks(prev => prev.filter(id => !groupCheckIds.includes(id)));
    } else {
      setSelectedChecks(prev => [...new Set([...prev, ...groupCheckIds])]);
    }
  };

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

  const handleConfirmBulkReassign = () => {
    if (!showBulkReassignConfirm) return;
    
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
    
    setSelectedChecks(checkIds);
    setShowBulkReassignConfirm(null);
    setShowEmployeePicker(true);
  };

  const handleCancelBulkReassign = () => {
    setShowBulkReassignConfirm(null);
  };

  const getTransferCTALabel = () => {
    if (selectedChecks.length === 0) return 'Transfer';
    
    const transferredSelectedChecks = selectedChecks.filter(checkId => {
      const check = currentChecks.find(c => c.id === checkId);
      return !!check?.transferredTo;
    });
    
    const isReassign = transferredSelectedChecks.length > 0;
    
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
    
    return 'Transfer';
  };

  useEffect(() => {
    if (allChecksResolved && isOpen) {
      onClose();
    }
  }, [allChecksResolved, isOpen, onClose]);

  const handleCheckToggle = (checkId: string) => {
    const check = currentChecks.find(c => c.id === checkId);
    if (check?.transferredTo) {
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
    
    setSelectedChecks([showReassignConfirm.checkId]);
    setShowReassignConfirm(null);
  };

  const handleCancelReassign = () => {
    setShowReassignConfirm(null);
  };

  const handleCharge = () => {
    if (selectedChecks.length !== 1) return;
    
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
    setShowEmployeePicker(false);
  };

  const handleConfirmTransfer = () => {
    if (selectedChecks.length === 0 || !selectedEmployee) return;
    
    const transferCount = selectedChecks.length;
    const employeeName = selectedEmployee.name;
    const transferredTo = { id: selectedEmployee.id, name: selectedEmployee.name };
    
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
    
    setTransferSuccess({ count: transferCount, employeeName });
    
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
    
    setOpenChecks(prev => prev.filter(c => !selectedChecks.includes(c.id)));
    setSelectedChecks([]);
    setShowCloseCheckConfirm(false);
    
    setCloseCheckSuccess({ count: closeCount });
    
    setTimeout(() => {
      setCloseCheckSuccess(null);
    }, 2500);
  };

  const handleCancelCloseCheck = () => {
    setShowCloseCheckConfirm(false);
  };

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
    
    setOpenChecks(prev => prev.map(check => 
      check.id === checkId 
        ? { ...check, tipAdded: tipCents }
        : check
    ));
    
    setShowTipEntry(false);
    setTipAmount('0');
    setSelectedChecks([]);
    
    setTipSuccess({ amount: formattedAmount });
    
    setTimeout(() => {
      setTipSuccess(null);
    }, 2500);
  };

  const handleCancelTip = () => {
    setShowTipEntry(false);
    setTipAmount('0');
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex flex-col"
      style={{ 
        backgroundColor: '#1B1C20',
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
      }}
    >
      {/* Header */}
      <div className="flex-shrink-0 px-4 pt-4 pb-3 border-b border-neutral-700/50">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
            style={{ background: "#7575754D" }}
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h2 className="text-white text-lg font-bold">Clock Out</h2>
          <div className="w-10" />
        </div>
        
        <p className="text-white/60 text-xs text-center mb-3">
          Complete your shift by transferring unpaid checks and closing open checks.
        </p>

        {/* Employee Info Card */}
        <div 
          className="rounded-xl p-3 flex items-center gap-3 border border-neutral-700"
          style={{ backgroundColor: '#1B1C20' }}
        >
          <div className="w-10 h-10 rounded-full bg-neutral-700 overflow-hidden flex-shrink-0">
            {employeeAvatar ? (
              <img 
                src={employeeAvatar} 
                alt={employeeName} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-neutral-600">
                <User className="w-5 h-5 text-white/60" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm truncate">
              {getGreeting()}, {employeeName}
            </p>
            <p className="text-gray-400 text-xs flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatTime(shiftStartTime)} → {formatTime(shiftEndTime)}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-shrink-0 px-4 pt-3">
        <div className="flex gap-2">
          <button
            onClick={() => {
              setActiveTab('unpaid');
              setSelectedChecks([]);
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-full font-medium text-sm transition-all ${
              activeTab === 'unpaid' ? 'text-black' : 'text-white'
            }`}
            style={activeTab === 'unpaid' 
              ? { background: "linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)" }
              : { background: "#7575754D" }
            }
          >
            <Receipt className="w-4 h-4" />
            Unpaid
            {unpaidCount > 0 && (
              <span className={`min-w-[18px] h-[18px] px-1 rounded text-xs font-bold flex items-center justify-center ${
                activeTab === 'unpaid' ? 'bg-black text-white' : 'bg-red-500 text-white'
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
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-full font-medium text-sm transition-all ${
              activeTab === 'open' ? 'text-black' : 'text-white'
            }`}
            style={activeTab === 'open' 
              ? { background: "linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)" }
              : { background: "#7575754D" }
            }
          >
            <Receipt className="w-4 h-4" />
            Open
            {openCount > 0 && (
              <span className={`min-w-[18px] h-[18px] px-1 rounded text-xs font-bold flex items-center justify-center ${
                activeTab === 'open' ? 'bg-black text-white' : 'bg-orange-500 text-white'
              }`}>
                {openCount}
              </span>
            )}
          </button>
        </div>
        
        {/* Select All */}
        {currentChecks.length > 0 && (
          <div className="mt-3 flex items-center justify-between">
            <button
              onClick={() => {
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
                {selectedChecks.length} selected
              </span>
            )}
          </div>
        )}
      </div>

      {/* Check Cards Grid */}
      <div className="flex-1 overflow-y-auto p-4 pt-3">
        <AnimatePresence mode="wait">
          {showTipEntry ? (
            <motion.div
              key="tip-entry"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center justify-center h-full"
            >
              <div className="text-center mb-6">
                <p className="text-white/50 text-xs uppercase tracking-wider mb-2">Tip Amount</p>
                <p className="text-white text-5xl font-bold tracking-tight">
                  {formatTipDisplay(tipAmount)}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 w-full max-w-xs">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '00', 'C'].map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleTipKeyPress(key)}
                    className={`h-14 rounded-xl font-semibold text-xl flex items-center justify-center transition-all active:scale-95 ${
                      key === 'C' 
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                        : 'text-white'
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
          ) : showEmployeePicker ? (
            <motion.div
              key="employee-picker"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-2"
            >
              <div className="mb-4">
                <p className="text-white text-sm font-semibold">Transfer to Employee</p>
                <p className="text-white/50 text-xs mt-0.5">
                  {selectedChecks.length} check{selectedChecks.length > 1 ? 's' : ''} selected
                </p>
              </div>
              {MOCK_EMPLOYEES.map((employee) => {
                const isSourceEmployee = selectedChecks.some(checkId => {
                  const check = currentChecks.find(c => c.id === checkId);
                  return check?.transferredTo?.id === employee.id;
                });
                
                return (
                  <button
                    key={employee.id}
                    type="button"
                    onClick={() => {
                      if (!isSourceEmployee) {
                        handleSelectEmployeeForTransfer(employee);
                      }
                    }}
                    disabled={isSourceEmployee}
                    className={`w-full p-3 flex items-center gap-3 rounded-xl border transition-colors ${
                      isSourceEmployee 
                        ? 'opacity-40 cursor-not-allowed border-neutral-700' 
                        : 'border-neutral-700 active:bg-neutral-700'
                    }`}
                    style={{ backgroundColor: '#27282C' }}
                  >
                    <div className="w-10 h-10 rounded-full bg-neutral-700 flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-white/60" />
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
            </motion.div>
          ) : (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Non-transferred checks */}
              {nonTransferredChecks.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
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
                            : 'bg-neutral-800 border-neutral-700 active:border-neutral-500'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-1.5">
                            <img 
                              src={getOrderTypeIcon(check.orderType)} 
                              alt={check.orderType}
                              className="w-4 h-4 brightness-0 invert opacity-60"
                            />
                            <span className="font-semibold text-xs text-white">
                              {getOrderTypeLabel(check)}
                            </span>
                          </div>
                          <span className="font-bold text-xs text-white">
                            {formatPrice(check.amount)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3 text-gray-400" />
                            <span className="text-[10px] truncate max-w-[60px] text-gray-400">
                              {check.guestName}
                            </span>
                          </div>
                          <div className="flex flex-col items-end gap-0.5">
                            {hasTip ? (
                              <span className="text-[10px] font-semibold text-amber-400">
                                Tip: ${(check.tipAdded! / 100).toFixed(2)}
                              </span>
                            ) : (
                              <span className={`text-[10px] font-semibold uppercase ${getStatusColor(check.status)}`}>
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
                  <AnimatePresence>
                    {showGroupHelper && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
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

                  {nonTransferredChecks.length > 0 && (
                    <div className="flex items-center gap-3 py-1">
                      <div className="flex-1 h-px bg-neutral-700/50" />
                      <span className="text-[10px] text-white/30 uppercase tracking-wider">Transferred</span>
                      <div className="flex-1 h-px bg-neutral-700/50" />
                    </div>
                  )}

                  {Object.entries(groupedByEmployee).map(([employeeId, group]) => {
                    const isGroupFullySelected = isEmployeeGroupFullySelected(employeeId);
                    
                    return (
                      <div key={employeeId} className="space-y-2">
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
                                ({group.checks.length})
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleToggleEmployeeGroup(employeeId)}
                            className={`text-[10px] font-medium px-2 py-1 rounded transition-colors ${
                              isGroupFullySelected 
                                ? 'bg-white/10 text-white' 
                                : 'text-white/50 hover:text-white/70'
                            }`}
                          >
                            {isGroupFullySelected ? 'Deselect All' : 'Select All'}
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                          {group.checks.map((check) => {
                            const isSelected = selectedChecks.includes(check.id);
                            
                            return (
                              <button
                                key={check.id}
                                onClick={() => handleCheckToggle(check.id)}
                                className={`rounded-xl p-3 text-left transition-all border ${
                                  isSelected 
                                    ? 'bg-neutral-800/60 border-white/60 ring-1 ring-white/20' 
                                    : 'bg-neutral-800/40 border-neutral-700/50 opacity-70'
                                }`}
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex items-center gap-1.5">
                                    <img 
                                      src={getOrderTypeIcon(check.orderType)} 
                                      alt={check.orderType}
                                      className="w-4 h-4 brightness-0 invert opacity-40"
                                    />
                                    <span className="font-semibold text-xs text-white/60">
                                      {getOrderTypeLabel(check)}
                                    </span>
                                  </div>
                                  <span className="font-bold text-xs text-white/60">
                                    {formatPrice(check.amount)}
                                  </span>
                                </div>

                                <div className="flex flex-col gap-0.5">
                                  <span className="text-[10px] font-medium text-amber-500/80">
                                    → {check.transferredTo!.name.split(' ')[0]}
                                  </span>
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
      </div>

      {/* Bottom Actions */}
      <div className="flex-shrink-0 border-t border-neutral-700/50">
        <AnimatePresence mode="wait">
          {/* Success Messages */}
          {transferSuccess && (
            <motion.div 
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="p-4"
            >
              <div 
                className="rounded-xl p-4 border border-amber-500/30 flex items-center gap-3"
                style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)' }}
              >
                <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-amber-400" />
                </div>
                <div className="flex-1">
                  <p className="text-white text-sm font-semibold">Transfer Complete</p>
                  <p className="text-white/60 text-xs">
                    {transferSuccess.count} check{transferSuccess.count > 1 ? 's' : ''} transferred to {transferSuccess.employeeName}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {closeCheckSuccess && (
            <motion.div 
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="p-4"
            >
              <div 
                className="rounded-xl p-4 border border-amber-500/30 flex items-center gap-3"
                style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)' }}
              >
                <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-amber-400" />
                </div>
                <div className="flex-1">
                  <p className="text-white text-sm font-semibold">Check{closeCheckSuccess.count > 1 ? 's' : ''} Closed</p>
                  <p className="text-white/60 text-xs">
                    {closeCheckSuccess.count} check{closeCheckSuccess.count > 1 ? 's' : ''} successfully closed
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {tipSuccess && (
            <motion.div 
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="p-4"
            >
              <div 
                className="rounded-xl p-4 border border-amber-500/30 flex items-center gap-3"
                style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)' }}
              >
                <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-amber-400" />
                </div>
                <div className="flex-1">
                  <p className="text-white text-sm font-semibold">Tip Added</p>
                  <p className="text-white/60 text-xs">
                    {tipSuccess.amount} tip added successfully
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Tip Entry Actions */}
          {showTipEntry && (
            <motion.div 
              key="tip-entry-actions"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="p-4"
            >
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCancelTip}
                  className="flex-1 h-12 rounded-xl font-semibold text-sm flex items-center justify-center text-white border border-neutral-600"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleConfirmTip}
                  disabled={tipAmount === '0'}
                  className={`flex-1 h-12 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 ${
                    tipAmount === '0' ? 'opacity-50 cursor-not-allowed text-white/50' : 'text-white'
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

          {/* Employee Picker Back */}
          {showEmployeePicker && (
            <motion.div 
              key="picker-actions"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="p-4"
            >
              <button
                type="button"
                onClick={() => setShowEmployeePicker(false)}
                className="w-full h-12 rounded-xl font-semibold text-sm flex items-center justify-center text-white border border-neutral-600"
              >
                Back
              </button>
            </motion.div>
          )}

          {/* Reassign Confirmation */}
          {showReassignConfirm && (
            <motion.div 
              key="reassign-confirmation"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="p-4"
            >
              <div 
                className="rounded-xl p-4 border border-neutral-600"
                style={{ backgroundColor: '#27282C' }}
              >
                <div className="flex items-start gap-3">
                  <ArrowRightLeft className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-white text-sm font-semibold">Check Already Transferred</p>
                    <p className="text-white/60 text-xs mt-1">
                      This check was transferred to {showReassignConfirm.employeeName}. Do you want to reassign it?
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    type="button"
                    onClick={handleCancelReassign}
                    className="flex-1 h-10 rounded-xl font-semibold text-sm flex items-center justify-center text-white border border-neutral-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmReassign}
                    className="flex-1 h-10 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 text-white"
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

          {/* Bulk Reassign Confirmation */}
          {showBulkReassignConfirm && (
            <motion.div 
              key="bulk-reassign-confirmation"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="p-4"
            >
              <div 
                className="rounded-xl p-4 border border-amber-500/30"
                style={{ backgroundColor: 'rgba(245, 158, 11, 0.08)' }}
              >
                <div className="flex items-start gap-3">
                  <ArrowRightLeft className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-white text-sm font-semibold">Reassign All Checks</p>
                    <p className="text-white/60 text-xs mt-1">
                      Reassign {showBulkReassignConfirm.checkIds.length} check{showBulkReassignConfirm.checkIds.length > 1 ? 's' : ''} from {showBulkReassignConfirm.employeeName} to another employee?
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    type="button"
                    onClick={handleCancelBulkReassign}
                    className="flex-1 h-10 rounded-xl font-semibold text-sm flex items-center justify-center text-white border border-neutral-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmBulkReassign}
                    className="flex-1 h-10 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 text-white"
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

          {/* Transfer Confirmation */}
          {selectedEmployee && !showTipEntry && !showReassignConfirm && !showBulkReassignConfirm && (
            <motion.div 
              key="transfer-confirmation"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="p-4"
            >
              <div 
                className="rounded-xl p-4 border border-neutral-600"
                style={{ backgroundColor: '#27282C' }}
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-white text-sm font-medium">
                      Transfer {selectedChecks.length} check{selectedChecks.length > 1 ? 's' : ''} to {selectedEmployee.name}?
                    </p>
                    <p className="text-white/50 text-xs mt-1">This action cannot be undone.</p>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    type="button"
                    onClick={handleCancelTransfer}
                    className="flex-1 h-10 rounded-xl font-semibold text-sm flex items-center justify-center text-white border border-neutral-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmTransfer}
                    className="flex-1 h-10 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 text-black"
                    style={{ 
                      background: "linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)" 
                    }}
                  >
                    <ArrowRightLeft className="w-4 h-4" />
                    Confirm Transfer
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Close Check Confirmation */}
          {showCloseCheckConfirm && !selectedEmployee && (
            <motion.div 
              key="close-confirmation"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="p-4"
            >
              <div 
                className="rounded-xl p-4 border border-neutral-600"
                style={{ backgroundColor: '#27282C' }}
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-white text-sm font-medium">
                      Close {selectedChecks.length} check{selectedChecks.length > 1 ? 's' : ''}?
                    </p>
                    <p className="text-white/50 text-xs mt-1">This action cannot be undone.</p>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    type="button"
                    onClick={handleCancelCloseCheck}
                    className="flex-1 h-10 rounded-xl font-semibold text-sm flex items-center justify-center text-white border border-neutral-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmCloseCheck}
                    className="flex-1 h-10 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 text-black"
                    style={{ 
                      background: "linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)" 
                    }}
                  >
                    <Receipt className="w-4 h-4" />
                    Confirm Close
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Default Action Buttons */}
          {selectedChecks.length > 0 && !transferSuccess && !closeCheckSuccess && !tipSuccess && !showTipEntry && !showReassignConfirm && !showBulkReassignConfirm && !selectedEmployee && !showCloseCheckConfirm && !showEmployeePicker && (
            <motion.div 
              key="actions"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="p-4"
            >
              <div className="flex gap-2">
                {activeTab === 'unpaid' ? (
                  <>
                    {selectedChecks.length === 1 && (
                      <button
                        onClick={handleCharge}
                        className="flex-1 h-12 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 text-white"
                        style={{ 
                          background: "linear-gradient(180deg, hsl(27, 96%, 61%) 0%, hsl(21, 90%, 48%) 100%)" 
                        }}
                      >
                        <CreditCard className="w-4 h-4" />
                        Charge
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowEmployeePicker(true)}
                      className={`${selectedChecks.length === 1 ? 'flex-1' : 'w-full'} h-12 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 text-black`}
                      style={{ 
                        background: "linear-gradient(180deg, #C2C2C2 0%, #FFFFFF 100%)" 
                      }}
                    >
                      <ArrowRightLeft className="w-4 h-4" />
                      {getTransferCTALabel()}
                    </button>
                  </>
                ) : (
                  <>
                    {selectedChecks.length === 1 && (() => {
                      const selectedCheck = openChecks.find(c => c.id === selectedChecks[0]);
                      const hasTip = selectedCheck?.tipAdded && selectedCheck.tipAdded > 0;
                      return !hasTip ? (
                        <button
                          onClick={handleAddTipClick}
                          className="flex-1 h-12 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 text-white"
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
                      className={`${selectedChecks.length === 1 && !openChecks.find(c => c.id === selectedChecks[0])?.tipAdded ? 'flex-1' : 'w-full'} h-12 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 text-black`}
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
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default ClockOutValidationMobile;
