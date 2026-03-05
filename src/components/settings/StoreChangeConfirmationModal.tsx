import { AlertTriangle } from "lucide-react";

interface StoreChangeConfirmationModalProps {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  targetStoreName?: string;
}

const StoreChangeConfirmationModal = ({ isOpen, onCancel, onConfirm, targetStoreName }: StoreChangeConfirmationModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-neutral-900 rounded-3xl w-full max-w-sm p-6">
        {/* Warning Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 rounded-full bg-amber-500/20 flex items-center justify-center">
            <AlertTriangle className="w-7 h-7 text-amber-500" />
          </div>
        </div>

        <h3 className="text-foreground font-bold text-xl text-center mb-2">Change Store</h3>

        {targetStoreName && (
          <p className="text-center text-primary text-sm font-medium mb-3">
            Switching to: {targetStoreName}
          </p>
        )}

        <p className="text-muted-foreground text-sm text-center mb-4 leading-relaxed">
          Changing the store will clear all local data from this device including:
        </p>

        <div className="bg-neutral-800/60 rounded-xl p-4 mb-6 space-y-2">
          {[
            "Menu data",
            "Categories",
            "Employees",
            "Departments",
            "Roles",
            "Any store-specific configuration",
          ].map((item) => (
            <div key={item} className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
              <span className="text-foreground text-sm">{item}</span>
            </div>
          ))}
        </div>

        <p className="text-muted-foreground text-xs text-center mb-6 leading-relaxed">
          You will be logged out and the device will reload data for the selected store.
        </p>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3.5 rounded-xl bg-neutral-800 border border-neutral-700 text-foreground font-medium hover:bg-neutral-700 active:bg-neutral-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3.5 rounded-xl bg-amber-600 text-white font-medium hover:bg-amber-500 active:bg-amber-700 transition-colors"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default StoreChangeConfirmationModal;
