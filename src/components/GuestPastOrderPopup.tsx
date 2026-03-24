import { useState, useCallback, useEffect } from "react";
import { X, Plus, RotateCcw, Check, AlertTriangle, Clock, User, Phone, Mail, ShoppingBag } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export interface PastOrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  originalPrice?: number;
  category?: string;
  isAvailable?: boolean;
  isComped?: boolean;
  modifiers?: string[];
}

interface GuestInfo {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  orderCount?: number;
  lastOrderDate?: string;
  loyaltyTier?: string;
}

interface GuestPastOrderPopupProps {
  open: boolean;
  onClose: () => void;
  guest: GuestInfo;
  pastItems: PastOrderItem[];
  onAddItems: (items: PastOrderItem[]) => void;
  onRepeatFullOrder: (items: PastOrderItem[]) => void;
  isLoading?: boolean;
}

const GuestPastOrderPopup = ({
  open,
  onClose,
  guest,
  pastItems,
  onAddItems,
  onRepeatFullOrder,
  isLoading = false,
}: GuestPastOrderPopupProps) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [repeating, setRepeating] = useState(false);

  useEffect(() => {
    if (!open) {
      setSelectedIds(new Set());
      setRepeating(false);
    }
  }, [open]);

  const toggleItem = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const availableItems = pastItems.filter(i => i.isAvailable !== false);

  const handleRepeatFull = useCallback(async () => {
    setRepeating(true);
    await new Promise(r => setTimeout(r, 600));
    onRepeatFullOrder(availableItems);
    setRepeating(false);
  }, [availableItems, onRepeatFullOrder]);

  const handleAddSelected = useCallback(() => {
    const items = pastItems.filter(i => selectedIds.has(i.id) && i.isAvailable !== false);
    onAddItems(items);
  }, [pastItems, selectedIds, onAddItems]);

  const selectedCount = [...selectedIds].filter(id => {
    const item = pastItems.find(i => i.id === id);
    return item && item.isAvailable !== false;
  }).length;

  if (!open) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div
        className="pointer-events-auto flex flex-col rounded-2xl shadow-2xl border border-[hsl(var(--border))]"
        style={{
          width: 420,
          height: "80%",
          background: "hsl(var(--popover))",
          color: "hsl(var(--popover-foreground))",
        }}
      >
        {/* Sticky Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[hsl(var(--border))]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[hsl(var(--accent))] flex items-center justify-center">
              <User className="w-4 h-4 text-[hsl(var(--accent-foreground))]" />
            </div>
            <div>
              <h2 className="text-base font-semibold leading-tight">{guest.name}</h2>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">Past Orders</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[hsl(var(--accent))] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Guest Info Bar */}
        <div className="flex items-center gap-4 px-5 py-3 border-b border-[hsl(var(--border))] bg-[hsl(var(--accent)/0.5)]">
          {guest.phone && (
            <span className="flex items-center gap-1.5 text-xs text-[hsl(var(--muted-foreground))]">
              <Phone className="w-3 h-3" /> {guest.phone}
            </span>
          )}
          {guest.email && (
            <span className="flex items-center gap-1.5 text-xs text-[hsl(var(--muted-foreground))]">
              <Mail className="w-3 h-3" /> {guest.email}
            </span>
          )}
          {guest.orderCount !== undefined && (
            <span className="flex items-center gap-1.5 text-xs text-[hsl(var(--muted-foreground))]">
              <ShoppingBag className="w-3 h-3" /> {guest.orderCount} orders
            </span>
          )}
          {guest.loyaltyTier && (
            <span className="ml-auto text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[hsl(30,100%,50%/0.15)] text-[hsl(30,100%,45%)]">
              {guest.loyaltyTier}
            </span>
          )}
        </div>

        {/* Repeat Full Order */}
        <div className="px-5 py-3 border-b border-[hsl(var(--border))]">
          <button
            onClick={handleRepeatFull}
            disabled={repeating || availableItems.length === 0}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all
              bg-[hsl(25,95%,53%)] text-white hover:bg-[hsl(25,95%,48%)] disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
          >
            <RotateCcw className="w-4 h-4" />
            Repeat Full Order ({availableItems.length} products)
          </button>
        </div>

        {/* Scrollable Items */}
        <div className="flex-1 overflow-y-auto px-5 py-2">
          {isLoading || repeating ? (
            <div className="space-y-3 py-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="w-8 h-8 rounded-lg" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                  <Skeleton className="w-12 h-5" />
                </div>
              ))}
            </div>
          ) : pastItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-[hsl(var(--muted-foreground))]">
              <ShoppingBag className="w-10 h-10 mb-3 opacity-40" />
              <p className="text-sm font-medium">No past orders found</p>
            </div>
          ) : (
            <div className="space-y-1">
              {pastItems.map(item => {
                const unavailable = item.isAvailable === false;
                const priceChanged = item.originalPrice !== undefined && item.originalPrice !== item.price;
                const comped = item.isComped === true;
                const selected = selectedIds.has(item.id);

                return (
                  <div
                    key={item.id}
                    onClick={() => !unavailable && toggleItem(item.id)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all
                      ${unavailable ? "opacity-40 cursor-not-allowed" : "hover:bg-[hsl(var(--accent))]"}
                      ${selected && !unavailable ? "bg-[hsl(25,95%,53%/0.1)] ring-1 ring-[hsl(25,95%,53%/0.3)]" : ""}
                    `}
                  >
                    {/* Selection indicator */}
                    <div
                      className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 border transition-all
                        ${selected && !unavailable
                          ? "bg-[hsl(25,95%,53%)] border-[hsl(25,95%,53%)] text-white"
                          : unavailable
                            ? "border-[hsl(var(--border))] bg-[hsl(var(--muted))]"
                            : "border-[hsl(var(--border))]"
                        }
                      `}
                    >
                      {selected && !unavailable && <Check className="w-3.5 h-3.5" />}
                      {unavailable && <X className="w-3 h-3 text-[hsl(var(--muted-foreground))]" />}
                    </div>

                    {/* Product info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium truncate ${unavailable ? "line-through" : ""}`}>
                          {item.name}
                        </span>
                        <span className="text-xs text-[hsl(var(--muted-foreground))]">×{item.quantity}</span>
                      </div>
                      {item.modifiers && item.modifiers.length > 0 && (
                        <p className="text-[11px] text-[hsl(var(--muted-foreground))] truncate mt-0.5">
                          {item.modifiers.join(", ")}
                        </p>
                      )}
                      {item.category && (
                        <p className="text-[10px] text-[hsl(var(--muted-foreground))] mt-0.5">{item.category}</p>
                      )}
                      {unavailable && (
                        <span className="flex items-center gap-1 text-[10px] text-[hsl(var(--destructive))] mt-0.5">
                          <AlertTriangle className="w-3 h-3" /> Unavailable
                        </span>
                      )}
                    </div>

                    {/* Price */}
                    <div className="text-right shrink-0">
                      {comped ? (
                        <span className="text-xs font-medium text-[hsl(var(--muted-foreground))]">₹0</span>
                      ) : priceChanged ? (
                        <div className="flex flex-col items-end">
                          <span className="text-[10px] line-through text-[hsl(var(--muted-foreground))]">
                            ₹{item.originalPrice?.toFixed(2)}
                          </span>
                          <span className="text-xs font-semibold text-[hsl(25,95%,53%)]">
                            ₹{item.price.toFixed(2)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs font-semibold">₹{item.price.toFixed(2)}</span>
                      )}
                    </div>

                    {/* Quick add button */}
                    {!unavailable && !selected && (
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          onAddItems([item]);
                        }}
                        className="w-7 h-7 rounded-lg flex items-center justify-center bg-[hsl(25,95%,53%)] text-white hover:bg-[hsl(25,95%,48%)] transition-colors shrink-0 active:scale-90"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Sticky Footer */}
        <div className="flex items-center gap-3 px-5 py-4 border-t border-[hsl(var(--border))]">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-[hsl(var(--border))] hover:bg-[hsl(var(--accent))] transition-colors active:scale-[0.98]"
          >
            Cancel
          </button>
          <button
            onClick={handleAddSelected}
            disabled={selectedCount === 0}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.98]
              bg-[hsl(25,95%,53%)] text-white hover:bg-[hsl(25,95%,48%)] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {selectedCount > 0 ? `Add Selected (${selectedCount})` : "Add Selected"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GuestPastOrderPopup;
