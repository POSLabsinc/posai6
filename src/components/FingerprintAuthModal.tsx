import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Fingerprint, AlertCircle, Check, X } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

type FingerprintState = 
  | 'idle'
  | 'scanning'
  | 'success'
  | 'failed'
  | 'all_failed'
  | 'not_detected';

// Employee interface for fingerprint auth
interface FingerprintEmployee {
  id: string;
  name: string;
  jobTypes: string[];
  revenueCenter: string;
  avatar?: string;
}

interface FingerprintAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  authType: 'clock_in' | 'clock_out' | 'break';
  employeeName?: string;
}

interface FingerprintInlineAuthProps {
  onCancel: () => void;
  onSuccess: (employee: FingerprintEmployee) => void;
  authType: 'clock_in' | 'clock_out' | 'break';
}

// Mock employee data for fingerprint authentication
const FINGERPRINT_EMPLOYEES: Record<string, FingerprintEmployee> = {
  "fp_001": {
    id: "emp_001",
    name: "John Smith",
    jobTypes: ["Server", "Host", "Bartender", "Manager", "Barista", "Runner"],
    revenueCenter: "Dine Center",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face"
  },
  "fp_002": {
    id: "emp_002",
    name: "Sarah Kim",
    jobTypes: ["Bartender", "Manager"],
    revenueCenter: "Bar Area",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face"
  }
};

const MAX_ATTEMPTS = 3;
const SCAN_DURATION = 2000; // 2 seconds for scanning simulation
const SUCCESS_DISPLAY_DURATION = 1500;
const FAILURE_DISPLAY_DURATION = 2000;

// ============================================================================
// INLINE FINGERPRINT AUTH COMPONENT
// Renders without Dialog wrapper, to be embedded directly in Clock In/Out overlays
// ============================================================================
export const FingerprintInlineAuth = ({
  onCancel,
  onSuccess,
  authType
}: FingerprintInlineAuthProps) => {
  const [state, setState] = useState<FingerprintState>('scanning');
  const [attemptsRemaining, setAttemptsRemaining] = useState(MAX_ATTEMPTS);
  const [authenticatedEmployee, setAuthenticatedEmployee] = useState<FingerprintEmployee | null>(null);

  // Start scanning immediately on mount
  useEffect(() => {
    setState('scanning');
    setAttemptsRemaining(MAX_ATTEMPTS);
    setAuthenticatedEmployee(null);
  }, []);

  // Simulate fingerprint scanning
  useEffect(() => {
    if (state !== 'scanning') return;

    const scanTimer = setTimeout(() => {
      // 70% success rate for demo
      const isSuccess = Math.random() < 0.7;
      
      if (isSuccess) {
        // Pick a random employee for demo
        const employees = Object.values(FINGERPRINT_EMPLOYEES);
        const employee = employees[Math.floor(Math.random() * employees.length)];
        setAuthenticatedEmployee(employee);
        setState('success');
        
        console.log('Fingerprint Authentication Event:', {
          type: 'fingerprint_auth_success',
          timestamp: new Date().toISOString(),
          employeeId: employee.id,
          employeeName: employee.name,
          authType
        });
        
        // Auto-proceed after success display
        setTimeout(() => {
          onSuccess(employee);
        }, SUCCESS_DISPLAY_DURATION);
      } else {
        const newAttempts = attemptsRemaining - 1;
        setAttemptsRemaining(newAttempts);
        
        console.log('Fingerprint Authentication Event:', {
          type: 'fingerprint_auth_failed',
          timestamp: new Date().toISOString(),
          attemptsRemaining: newAttempts,
          authType
        });
        
        if (newAttempts === 0) {
          setState('all_failed');
          // Auto-dismiss after showing message
          setTimeout(() => {
            onCancel();
          }, FAILURE_DISPLAY_DURATION);
        } else {
          setState('failed');
        }
      }
    }, SCAN_DURATION);

    return () => clearTimeout(scanTimer);
  }, [state, attemptsRemaining, authType, onSuccess, onCancel]);

  const handleRetry = useCallback(() => {
    if (attemptsRemaining > 0) {
      setState('scanning');
    }
  }, [attemptsRemaining]);

  const handleCancel = useCallback(() => {
    console.log('Fingerprint Authentication Event:', {
      type: 'fingerprint_auth_cancelled',
      timestamp: new Date().toISOString(),
      authType
    });
    onCancel();
  }, [authType, onCancel]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && state !== 'success') {
        handleCancel();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state, handleCancel]);

  const getTitle = () => {
    switch (authType) {
      case 'clock_in': return 'Clock In';
      case 'clock_out': return 'Clock Out';
      case 'break': return 'Start Break';
      default: return 'Sign in';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col items-center justify-center h-full w-full py-8"
    >
      <AnimatePresence mode="wait">
        {state === 'scanning' && (
          <motion.div
            key="scanning"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex flex-col items-center text-center"
          >
            {/* Pulsing fingerprint icon */}
            <div className="relative mb-8">
              <div className="fingerprint-pulse-ring absolute inset-0 rounded-full" />
              <div className="fingerprint-pulse-ring fingerprint-pulse-ring-delay absolute inset-0 rounded-full" />
              <div className="w-32 h-32 rounded-full bg-white/10 border border-white/20 flex items-center justify-center relative z-10">
                <Fingerprint className="w-16 h-16 text-white fingerprint-scan-animation" />
              </div>
            </div>
            
            <h2 className="text-2xl font-semibold text-white mb-2">{getTitle()}</h2>
            <p className="text-xl text-white/90 mb-4">Scan fingerprint</p>
            <p className="text-sm text-white/60 max-w-[280px]">
              Place the center of your fingertip over the sensor.
            </p>
            
            <button
              onClick={handleCancel}
              className="mt-8 px-6 py-3 text-white/70 hover:text-white transition-colors text-sm font-medium"
            >
              Cancel
            </button>
          </motion.div>
        )}

        {state === 'failed' && (
          <motion.div
            key="failed"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex flex-col items-center text-center"
          >
            {/* Shaking fingerprint icon with error indicator */}
            <div className="relative mb-8">
              <div className="w-32 h-32 rounded-full bg-red-500/20 border-2 border-red-500/50 flex items-center justify-center fingerprint-shake-animation">
                <Fingerprint className="w-16 h-16 text-red-400" />
              </div>
              <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-red-500 flex items-center justify-center">
                <X className="w-5 h-5 text-white" />
              </div>
            </div>
            
            <h2 className="text-2xl font-semibold text-white mb-2">{getTitle()}</h2>
            <p className="text-xl text-red-400 mb-4">Fingerprint Verification Failed</p>
            <p className="text-sm text-white/60 max-w-[280px]">
              You have {attemptsRemaining} attempt{attemptsRemaining !== 1 ? 's' : ''} remaining.
            </p>
            
            <button
              onClick={handleRetry}
              className="mt-8 px-8 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white font-medium transition-all min-h-[48px]"
            >
              Try Again
            </button>
            
            <button
              onClick={handleCancel}
              className="mt-4 px-6 py-3 text-white/70 hover:text-white transition-colors text-sm font-medium"
            >
              Use PIN Instead
            </button>
          </motion.div>
        )}

        {state === 'all_failed' && (
          <motion.div
            key="all_failed"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex flex-col items-center text-center"
          >
            {/* Faded fingerprint icon */}
            <div className="relative mb-8">
              <div className="w-32 h-32 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center opacity-60">
                <Fingerprint className="w-16 h-16 text-red-400/60" />
              </div>
            </div>
            
            <h2 className="text-2xl font-semibold text-white mb-2">{getTitle()}</h2>
            <p className="text-xl text-red-400 mb-4">Fingerprint Verification Failed</p>
            <p className="text-sm text-white/60 max-w-[280px]">
              All 3 attempts failed. Please use your PIN.
            </p>
            
            <button
              onClick={handleCancel}
              className="mt-8 px-8 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white font-medium transition-all min-h-[48px]"
            >
              Use PIN
            </button>
          </motion.div>
        )}

        {state === 'not_detected' && (
          <motion.div
            key="not_detected"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex flex-col items-center text-center"
          >
            {/* Warning icon */}
            <div className="relative mb-8">
              <div className="w-32 h-32 rounded-full bg-amber-500/20 border-2 border-amber-500/50 flex items-center justify-center">
                <AlertCircle className="w-16 h-16 text-amber-400" />
              </div>
            </div>
            
            <h2 className="text-2xl font-semibold text-white mb-2">Fingerprint Reader Not Detected</h2>
            <p className="text-sm text-white/60 max-w-[280px]">
              Connect the fingerprint reader to the device.
            </p>
            
            <button
              onClick={handleCancel}
              className="mt-8 px-8 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white font-medium transition-all min-h-[48px]"
            >
              Dismiss
            </button>
          </motion.div>
        )}

        {state === 'success' && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex flex-col items-center text-center"
          >
            {/* Success checkmark with employee avatar */}
            <div className="relative mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 15, stiffness: 300, delay: 0.1 }}
                className="w-32 h-32 rounded-full bg-amber-500/20 border-2 border-amber-500 flex items-center justify-center fingerprint-success-glow"
              >
                {authenticatedEmployee?.avatar ? (
                  <img 
                    src={authenticatedEmployee.avatar} 
                    alt={authenticatedEmployee.name}
                    className="w-28 h-28 rounded-full object-cover"
                  />
                ) : (
                  <Check className="w-16 h-16 text-amber-400" />
                )}
              </motion.div>
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 12, stiffness: 400, delay: 0.2 }}
                className="absolute -bottom-1 -right-1 w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center shadow-lg"
              >
                <Check className="w-6 h-6 text-white" />
              </motion.div>
            </div>
            
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h2 className="text-2xl font-semibold text-white mb-2">Fingerprint Verified!</h2>
              <p className="text-xl text-amber-400 mb-4">
                {authenticatedEmployee?.name || 'Employee'}
              </p>
              <p className="text-sm text-white/60">
                {authType === 'clock_in' ? 'Proceeding to job selection...' : 
                 authType === 'clock_out' ? 'Clocking you out...' : 
                 'Starting your break...'}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ============================================================================
// MODAL FINGERPRINT AUTH COMPONENT (Legacy - kept for backwards compatibility)
// ============================================================================
export const FingerprintAuthModal = ({
  isOpen,
  onClose,
  onSuccess,
  authType,
  employeeName
}: FingerprintAuthModalProps) => {
  const [state, setState] = useState<FingerprintState>('idle');
  const [attemptsRemaining, setAttemptsRemaining] = useState(MAX_ATTEMPTS);
  const [authenticatedEmployee, setAuthenticatedEmployee] = useState<FingerprintEmployee | null>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setState('scanning');
      setAttemptsRemaining(MAX_ATTEMPTS);
      setAuthenticatedEmployee(null);
    }
  }, [isOpen]);

  // Simulate fingerprint scanning
  useEffect(() => {
    if (!isOpen || state !== 'scanning') return;

    const scanTimer = setTimeout(() => {
      // 70% success rate for demo
      const isSuccess = Math.random() < 0.7;
      
      if (isSuccess) {
        // Pick a random employee for demo
        const employees = Object.values(FINGERPRINT_EMPLOYEES);
        const employee = employees[Math.floor(Math.random() * employees.length)];
        setAuthenticatedEmployee(employee);
        setState('success');
        
        console.log('Fingerprint Authentication Event:', {
          type: 'fingerprint_auth_success',
          timestamp: new Date().toISOString(),
          employeeId: employee.id,
          employeeName: employee.name,
          authType
        });
        
        // Auto-close after success display
        setTimeout(() => {
          onSuccess();
        }, SUCCESS_DISPLAY_DURATION);
      } else {
        const newAttempts = attemptsRemaining - 1;
        setAttemptsRemaining(newAttempts);
        
        console.log('Fingerprint Authentication Event:', {
          type: 'fingerprint_auth_failed',
          timestamp: new Date().toISOString(),
          attemptsRemaining: newAttempts,
          authType
        });
        
        if (newAttempts === 0) {
          setState('all_failed');
          // Auto-dismiss after showing message
          setTimeout(() => {
            onClose();
          }, FAILURE_DISPLAY_DURATION);
        } else {
          setState('failed');
        }
      }
    }, SCAN_DURATION);

    return () => clearTimeout(scanTimer);
  }, [isOpen, state, attemptsRemaining, authType, onSuccess, onClose]);

  const handleRetry = useCallback(() => {
    if (attemptsRemaining > 0) {
      setState('scanning');
    }
  }, [attemptsRemaining]);

  const handleCancel = useCallback(() => {
    console.log('Fingerprint Authentication Event:', {
      type: 'fingerprint_auth_cancelled',
      timestamp: new Date().toISOString(),
      authType
    });
    onClose();
  }, [authType, onClose]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && state !== 'success') {
        handleCancel();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, state, handleCancel]);

  const getTitle = () => {
    switch (authType) {
      case 'clock_in': return 'Clock In';
      case 'clock_out': return 'Clock Out';
      case 'break': return 'Start Break';
      default: return 'Sign in';
    }
  };

  const renderContent = () => {
    switch (state) {
      case 'scanning':
        return (
          <motion.div
            key="scanning"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex flex-col items-center text-center"
          >
            {/* Pulsing fingerprint icon */}
            <div className="relative mb-8">
              <div className="fingerprint-pulse-ring absolute inset-0 rounded-full" />
              <div className="fingerprint-pulse-ring fingerprint-pulse-ring-delay absolute inset-0 rounded-full" />
              <div className="w-32 h-32 rounded-full bg-white/10 border border-white/20 flex items-center justify-center relative z-10">
                <Fingerprint className="w-16 h-16 text-white fingerprint-scan-animation" />
              </div>
            </div>
            
            <h2 className="text-2xl font-semibold text-white mb-2">{getTitle()}</h2>
            <p className="text-xl text-white/90 mb-4">Scan fingerprint</p>
            <p className="text-sm text-white/60 max-w-[280px]">
              Place the center of your fingertip over the sensor.
            </p>
            
            <button
              onClick={handleCancel}
              className="mt-8 px-6 py-3 text-white/70 hover:text-white transition-colors text-sm font-medium"
            >
              Cancel
            </button>
          </motion.div>
        );

      case 'failed':
        return (
          <motion.div
            key="failed"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex flex-col items-center text-center"
          >
            {/* Shaking fingerprint icon with error indicator */}
            <div className="relative mb-8">
              <div className="w-32 h-32 rounded-full bg-red-500/20 border-2 border-red-500/50 flex items-center justify-center fingerprint-shake-animation">
                <Fingerprint className="w-16 h-16 text-red-400" />
              </div>
              <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-red-500 flex items-center justify-center">
                <X className="w-5 h-5 text-white" />
              </div>
            </div>
            
            <h2 className="text-2xl font-semibold text-white mb-2">{getTitle()}</h2>
            <p className="text-xl text-red-400 mb-4">Fingerprint Verification Failed</p>
            <p className="text-sm text-white/60 max-w-[280px]">
              You have {attemptsRemaining} attempt{attemptsRemaining !== 1 ? 's' : ''} remaining.
            </p>
            
            <button
              onClick={handleRetry}
              className="mt-8 px-8 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white font-medium transition-all"
            >
              Try Again
            </button>
            
            <button
              onClick={handleCancel}
              className="mt-4 px-6 py-3 text-white/70 hover:text-white transition-colors text-sm font-medium"
            >
              Use PIN Instead
            </button>
          </motion.div>
        );

      case 'all_failed':
        return (
          <motion.div
            key="all_failed"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex flex-col items-center text-center"
          >
            {/* Faded fingerprint icon */}
            <div className="relative mb-8">
              <div className="w-32 h-32 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center opacity-60">
                <Fingerprint className="w-16 h-16 text-red-400/60" />
              </div>
            </div>
            
            <h2 className="text-2xl font-semibold text-white mb-2">{getTitle()}</h2>
            <p className="text-xl text-red-400 mb-4">Fingerprint Verification Failed</p>
            <p className="text-sm text-white/60 max-w-[280px]">
              All 3 attempts failed. Please use your PIN.
            </p>
            
            <button
              onClick={handleCancel}
              className="mt-8 px-8 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white font-medium transition-all"
            >
              Use PIN
            </button>
          </motion.div>
        );

      case 'not_detected':
        return (
          <motion.div
            key="not_detected"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex flex-col items-center text-center"
          >
            {/* Warning icon */}
            <div className="relative mb-8">
              <div className="w-32 h-32 rounded-full bg-amber-500/20 border-2 border-amber-500/50 flex items-center justify-center">
                <AlertCircle className="w-16 h-16 text-amber-400" />
              </div>
            </div>
            
            <h2 className="text-2xl font-semibold text-white mb-2">Fingerprint Reader Not Detected</h2>
            <p className="text-sm text-white/60 max-w-[280px]">
              Connect the fingerprint reader to the device.
            </p>
            
            <button
              onClick={handleCancel}
              className="mt-8 px-8 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white font-medium transition-all"
            >
              Dismiss
            </button>
          </motion.div>
        );

      case 'success':
        return (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex flex-col items-center text-center"
          >
            {/* Success checkmark with employee avatar */}
            <div className="relative mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 15, stiffness: 300, delay: 0.1 }}
                className="w-32 h-32 rounded-full bg-amber-500/20 border-2 border-amber-500 flex items-center justify-center fingerprint-success-glow"
              >
                {authenticatedEmployee?.avatar ? (
                  <img 
                    src={authenticatedEmployee.avatar} 
                    alt={authenticatedEmployee.name}
                    className="w-28 h-28 rounded-full object-cover"
                  />
                ) : (
                  <Check className="w-16 h-16 text-amber-400" />
                )}
              </motion.div>
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 12, stiffness: 400, delay: 0.2 }}
                className="absolute -bottom-1 -right-1 w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center shadow-lg"
              >
                <Check className="w-6 h-6 text-white" />
              </motion.div>
            </div>
            
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h2 className="text-2xl font-semibold text-white mb-2">Welcome back!</h2>
              <p className="text-xl text-amber-400 mb-4">
                {authenticatedEmployee?.name || employeeName || 'Employee'}
              </p>
              <p className="text-sm text-white/60">
                {authType === 'clock_in' ? 'Clocking you in...' : 
                 authType === 'clock_out' ? 'Clocking you out...' : 
                 'Starting your break...'}
              </p>
            </motion.div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent 
        hideCloseButton
        className="z-[10000] sm:max-w-[400px] bg-black/80 backdrop-blur-2xl border-white/10 shadow-2xl p-8"
        aria-describedby="fingerprint-auth-description"
      >
        <span id="fingerprint-auth-description" className="sr-only">
          Fingerprint authentication modal for {authType.replace('_', ' ')}
        </span>
        <AnimatePresence mode="wait">
          {renderContent()}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default FingerprintAuthModal;
