import { useState, useCallback, useEffect } from "react";
import { X, Plus, RotateCcw, Check, AlertTriangle, Phone, Mail, ShoppingBag, DollarSign, Heart, FileText, User } from "lucide-react";
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

export interface GuestInfo {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  orderCount?: number;
  lastOrderDate?: string;
  loyaltyTier?: string;
  totalSpent?: number;
  totalTips?: number;
  allergies?: string[];
  notes?: string;
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

  const hasAllergies = guest.allergies && guest.allergies.length > 0;
  const hasNotes = guest.notes && guest.notes.trim().length > 0;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        className="relative flex flex-col rounded-2xl shadow-2xl overflow-hidden"
        style={{
          width: 580,
          maxWidth: "94vw",
          height: "82%",
          maxHeight: "82vh",
          background: "#1a1a1a",
          color: "#ffffff",
          border: "1px solid #2a2a2a",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid #2a2a2a" }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.1)" }}>
              <User className="w-5 h-5" style={{ color: "#fff" }} />
            </div>
            <div>
              <h2 className="text-base font-semibold leading-tight text-white">{guest.name}</h2>
              <p className="text-xs" style={{ color: "#888" }}>Past Order</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
            style={{ color: "#888" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#2a2a2a")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Guest Info Bar */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 px-6 py-2.5" style={{ borderBottom: "1px solid #2a2a2a", background: "#1f1f1f" }}>
          {guest.phone && (
            <span className="flex items-center gap-1.5 text-xs" style={{ color: "#999" }}>
              <Phone className="w-3 h-3" /> {guest.phone}
            </span>
          )}
          {guest.email && (
            <span className="flex items-center gap-1.5 text-xs" style={{ color: "#999" }}>
              <Mail className="w-3 h-3" /> {guest.email}
            </span>
          )}
          {guest.orderCount !== undefined && (
            <span className="flex items-center gap-1.5 text-xs" style={{ color: "#999" }}>
              <ShoppingBag className="w-3 h-3" /> {guest.orderCount} orders
            </span>
          )}
          {guest.totalSpent !== undefined && guest.totalSpent > 0 && (
            <span className="flex items-center gap-1.5 text-xs" style={{ color: "#999" }}>
              <DollarSign className="w-3 h-3" /> ${guest.totalSpent.toFixed(2)}
            </span>
          )}
          {guest.totalTips !== undefined && guest.totalTips > 0 && (
            <span className="flex items-center gap-1.5 text-xs" style={{ color: "#999" }}>
              <Heart className="w-3 h-3" /> ${guest.totalTips.toFixed(2)} tips
            </span>
          )}
        </div>

        {/* Allergies & Notes */}
        {(hasAllergies || hasNotes) && (
          <div className="flex flex-wrap items-start gap-x-6 gap-y-2 px-6 py-2.5" style={{ borderBottom: "1px solid #2a2a2a", background: "#1f1f1f" }}>
            {hasAllergies && (
              <div className="flex items-start gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: "#fff" }} />
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#fff" }}>Allergies</span>
                  <p className="text-xs" style={{ color: "#ccc" }}>{guest.allergies!.join(", ")}</p>
                </div>
              </div>
            )}
            {hasNotes && (
              <div className="flex items-start gap-1.5">
                <FileText className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: "#888" }} />
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#888" }}>Notes</span>
                  <p className="text-xs" style={{ color: "#999" }}>{guest.notes}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Product List Header */}
        <div className="px-6 py-2.5 flex items-center justify-between" style={{ borderBottom: "1px solid #2a2a2a" }}>
          <span className="text-xs font-medium" style={{ color: "#888" }}>
            {pastItems.length} products from last order
          </span>
          {selectedCount > 0 && (
            <span className="text-xs font-medium" style={{ color: "#fff" }}>
              {selectedCount} selected
            </span>
          )}
        </div>

        {/* Scrollable Items */}
        <div className="flex-1 overflow-y-auto px-4 py-2" style={{ scrollbarWidth: "none" }}>
          {isLoading || repeating ? (
            <div className="space-y-2 py-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-2 py-2">
                  <Skeleton className="w-7 h-7 rounded-lg" style={{ background: "#2a2a2a" }} />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-3/4" style={{ background: "#2a2a2a" }} />
                    <Skeleton className="h-3 w-1/2" style={{ background: "#2a2a2a" }} />
                  </div>
                  <Skeleton className="w-12 h-5" style={{ background: "#2a2a2a" }} />
                </div>
              ))}
            </div>
          ) : pastItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12" style={{ color: "#666" }}>
              <ShoppingBag className="w-10 h-10 mb-3 opacity-40" />
              <p className="text-sm font-medium">No past orders found</p>
            </div>
          ) : (
            <div className="space-y-0.5">
              {pastItems.map(item => {
                const unavailable = item.isAvailable === false;
                const priceChanged = item.originalPrice !== undefined && item.originalPrice !== item.price;
                const comped = item.isComped === true;
                const selected = selectedIds.has(item.id);

                return (
                  <div
                    key={item.id}
                    onClick={() => !unavailable && toggleItem(item.id)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all"
                    style={{
                      opacity: unavailable ? 0.4 : 1,
                      cursor: unavailable ? "not-allowed" : "pointer",
                      background: selected && !unavailable ? "rgba(255,255,255,0.06)" : "transparent",
                      boxShadow: selected && !unavailable ? "inset 0 0 0 1px rgba(255,255,255,0.15)" : "none",
                    }}
                    onMouseEnter={e => {
                      if (!unavailable && !selected) e.currentTarget.style.background = "#222";
                    }}
                    onMouseLeave={e => {
                      if (!unavailable && !selected) e.currentTarget.style.background = "transparent";
                      if (selected) e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                    }}
                  >
                    {/* Checkbox */}
                    <div
                      className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 transition-all"
                      style={{
                        border: selected && !unavailable ? "none" : "1px solid #3a3a3a",
                        background: selected && !unavailable ? "#fff" : unavailable ? "#2a2a2a" : "transparent",
                      }}
                    >
                      {selected && !unavailable && <Check className="w-3.5 h-3.5 text-black" />}
                      {unavailable && <X className="w-3 h-3" style={{ color: "#666" }} />}
                    </div>

                    {/* Product info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium truncate ${unavailable ? "line-through" : ""}`} style={{ color: unavailable ? "#666" : "#fff" }}>
                          {item.name}
                        </span>
                        <span className="text-xs" style={{ color: "#666" }}>x{item.quantity}</span>
                      </div>
                      {item.modifiers && item.modifiers.length > 0 && (
                        <p className="text-[11px] truncate mt-0.5" style={{ color: "#666" }}>
                          {item.modifiers.join(", ")}
                        </p>
                      )}
                      {item.category && (
                        <p className="text-[10px] mt-0.5" style={{ color: "#555" }}>{item.category}</p>
                      )}
                      {unavailable && (
                        <span className="flex items-center gap-1 text-[10px] mt-0.5" style={{ color: "#ef4444" }}>
                          <AlertTriangle className="w-3 h-3" /> Unavailable
                        </span>
                      )}
                    </div>

                    {/* Price */}
                    <div className="text-right shrink-0">
                      {comped ? (
                        <span className="text-xs font-medium" style={{ color: "#666" }}>$0.00</span>
                      ) : priceChanged ? (
                        <div className="flex flex-col items-end">
                          <span className="text-[10px] line-through" style={{ color: "#555" }}>
                            ${item.originalPrice?.toFixed(2)}
                          </span>
                          <span className="text-xs font-semibold" style={{ color: "#fff" }}>
                            ${item.price.toFixed(2)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs font-semibold text-white">${item.price.toFixed(2)}</span>
                      )}
                    </div>

                    {/* Quick add */}
                    {!unavailable && (
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          onAddItems([item]);
                        }}
                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all active:scale-90"
                        style={{ background: "#fff", color: "#000" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "#e0e0e0")}
                        onMouseLeave={e => (e.currentTarget.style.background = "#fff")}
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

        {/* Footer - Two primary actions */}
        <div className="flex items-center gap-3 px-6 py-4" style={{ borderTop: "1px solid #2a2a2a", background: "#1a1a1a" }}>
          <button
            onClick={handleRepeatFull}
            disabled={repeating || availableItems.length === 0}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: "#fff", color: "#000" }}
            onMouseEnter={e => { if (!e.currentTarget.disabled) e.currentTarget.style.background = "#e0e0e0"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "#fff"; }}
          >
            <RotateCcw className="w-4 h-4" />
            Repeat Order
          </button>
          <button
            onClick={handleAddSelected}
            disabled={selectedCount === 0}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: selectedCount > 0 ? "#fff" : "transparent",
              color: selectedCount > 0 ? "#000" : "#888",
              border: selectedCount > 0 ? "none" : "1px solid #3a3a3a",
            }}
            onMouseEnter={e => { if (selectedCount > 0) e.currentTarget.style.background = "#e0e0e0"; }}
            onMouseLeave={e => { if (selectedCount > 0) e.currentTarget.style.background = "#fff"; }}
          >
            <Plus className="w-4 h-4" />
            {selectedCount > 0 ? `Add Selected (${selectedCount})` : "Add Selected"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GuestPastOrderPopup;
