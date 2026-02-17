import React from 'react';
import { X, ChevronLeft } from 'lucide-react';

interface RefundModalLayoutProps {
  title: string;
  onBack?: () => void;
  onClose: () => void;
  footer?: React.ReactNode;
  children: React.ReactNode;
  /** When true, hides header (used inside bottom sheet which has its own header) */
  hideHeader?: boolean;
}

/**
 * Consistent modal layout for all refund flow steps.
 * - Fixed header (title + back/close buttons) - can be hidden when used inside bottom sheet
 * - Scrollable content area
 * - Fixed footer (action buttons)
 */
const RefundModalLayout: React.FC<RefundModalLayoutProps> = ({
  title,
  onBack,
  onClose,
  footer,
  children,
  hideHeader = false,
}) => {
  return (
    <div className="flex flex-col max-h-[90vh] h-full">
      {/* Header - Fixed (hidden when inside bottom sheet) */}
      {!hideHeader && (
        <div className="flex items-center justify-between p-4 border-b border-neutral-700 flex-shrink-0">
          {onBack ? (
            <button 
              onClick={onBack}
              className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-white/70" />
            </button>
          ) : (
            <div className="w-8" /> 
          )}
          <h2 className="text-white text-lg font-semibold">{title}</h2>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-white/70" />
          </button>
        </div>
      )}
      
      {/* Scrollable Content Area */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
        {children}
      </div>
      
      {/* Footer - Fixed */}
      {footer && (
        <div className="flex-shrink-0 border-t border-neutral-800">
          {footer}
        </div>
      )}
    </div>
  );
};

export default RefundModalLayout;
