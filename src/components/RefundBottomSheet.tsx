import React from 'react';
import { Drawer, DrawerContent, DrawerPortal, DrawerOverlay } from "@/components/ui/drawer";
import { X, ChevronLeft } from 'lucide-react';

interface RefundBottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  onBack?: () => void;
  onClose: () => void;
  footer?: React.ReactNode;
  children: React.ReactNode;
  /** Prevent accidental dismiss mid-flow */
  preventDismiss?: boolean;
}

/**
 * Mobile Bottom Sheet container for the refund flow.
 * Features:
 * - Fixed header with back/close buttons
 * - Scrollable content area with proper constraints
 * - Sticky footer for action buttons
 * - Safe area padding for notched devices
 * - Drag handle for intuitive interaction
 */
const RefundBottomSheet: React.FC<RefundBottomSheetProps> = ({
  open,
  onOpenChange,
  title,
  onBack,
  onClose,
  footer,
  children,
  preventDismiss = false,
}) => {
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && preventDismiss) {
      // Could show confirmation dialog here
      // For now, just call the close handler which resets state
      onClose();
      return;
    }
    onOpenChange(newOpen);
  };

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      <DrawerPortal>
        <DrawerOverlay className="fixed inset-0 z-50 bg-black/80" />
        <DrawerContent 
          className="fixed inset-x-0 bottom-0 z-50 flex flex-col bg-neutral-900 border-t border-neutral-700 rounded-t-2xl"
          style={{ maxHeight: '94vh' }}
        >

          {/* Header - Fixed (no X icon, use drag handle to dismiss) */}
          <div className="flex items-center justify-center px-4 py-3 border-b border-neutral-700 flex-shrink-0 relative">
            {onBack && (
              <button 
                onClick={onBack}
                className="absolute left-2 p-2 rounded-full hover:bg-white/10 transition-colors active:scale-95"
              >
                <ChevronLeft className="w-5 h-5 text-white/70" />
              </button>
            )}
            <h2 className="text-white text-lg font-semibold">{title}</h2>
          </div>
          
          {/* Scrollable Content Area */}
          <div 
            className="flex-1 min-h-0 overflow-y-auto overscroll-contain"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {children}
          </div>
          
          {/* Footer - Sticky with safe area padding */}
          {footer && (
            <div 
              className="flex-shrink-0 border-t border-neutral-800 bg-neutral-900"
              style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            >
              {footer}
            </div>
          )}
        </DrawerContent>
      </DrawerPortal>
    </Drawer>
  );
};

export default RefundBottomSheet;
