import { Check, MapPin } from "lucide-react";
import type { Store } from "@/hooks/useDeviceStore";

interface StoreSelectionSheetProps {
  isOpen: boolean;
  stores: Store[];
  currentStoreId?: string;
  onSelect: (store: Store) => void;
  onClose: () => void;
}

const StoreSelectionSheet = ({ isOpen, stores, currentStoreId, onSelect, onClose }: StoreSelectionSheetProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end justify-center">
      <div
        className="bg-neutral-900 rounded-t-3xl w-full max-w-lg pb-8 max-h-[70vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-neutral-700" />
        </div>

        <div className="px-6 pb-4">
          <h3 className="text-foreground font-bold text-lg">Select Store</h3>
          <p className="text-muted-foreground text-sm mt-1">Choose the store to bind this device to.</p>
        </div>

        <div className="overflow-y-auto scrollbar-hide px-6 flex-1 space-y-2">
          {stores.map((store) => {
            const isCurrent = store.id === currentStoreId;
            return (
              <button
                key={store.id}
                onClick={() => !isCurrent && onSelect(store)}
                disabled={isCurrent}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-colors text-left ${
                  isCurrent
                    ? "bg-primary/10 border border-primary/30"
                    : "bg-neutral-800/60 hover:bg-neutral-700/60 active:bg-neutral-600/60"
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-neutral-700/60 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-neutral-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-foreground font-medium text-base truncate">
                    {store.name} – {store.location}
                  </p>
                  <p className="text-neutral-500 text-xs truncate mt-0.5">{store.address}</p>
                </div>
                {isCurrent && <Check className="w-5 h-5 text-primary shrink-0" />}
              </button>
            );
          })}
        </div>

        <div className="px-6 pt-4">
          <button
            onClick={onClose}
            className="w-full py-3.5 rounded-xl bg-neutral-800 border border-neutral-700 text-foreground font-medium hover:bg-neutral-700 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default StoreSelectionSheet;
