import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Search, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface KDSTicketData {
  id: string;
  orderNumber: number;
  orderType: string;
  tableNumber: string | null;
  serverName: string;
  createdAt: string;
  products: { name: string; qty: number }[];
  status: string;
  partySize?: number;
  orderStatus?: string;
}

interface TableGroup {
  tableNumber: string;
  displayName: string;
  serverName: string;
  partySize: number;
  time: string;
  itemCount: number;
  orderStatus: string;
  orderIds: string[];
}

interface MessageKitchenDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tableId?: string | null;
  serverName?: string;
}

const MAX_LENGTH = 100;

const SUGGESTION_STORAGE_KEY = "kds_message_suggestions";
const NOTE_DELIMITER = ' | ';

const ALL_SUGGESTIONS = [
  "86'd - Out of stock",
  "Rush this order",
  "Hold this order",
  "Fire when ready",
  "Allergy alert",
  "VIP guest",
  "Remake needed",
  "Low stock warning",
  "Cooking now",
  "Need more time",
  "Ready in 5 minutes",
  "Ready in 10 minutes",
  "Customer waiting",
  "Special request",
  "Extra sauce on the side",
  "No onions",
  "Make it spicy",
  "Double portion",
  "Gluten free needed",
  "Dairy free needed",
  "Check temperature",
  "Plate presentation important",
  "Send appetizers first",
  "Hold dessert",
  "Table is ready",
  "Guest arriving soon",
  "Comp this order",
  "Manager approval needed",
  "Out of ingredient",
  "Substitute needed",
  "Delay on this order",
  "Priority order",
  "Catering order",
  "Large party incoming",
];

const getSuggestionHistory = (): { text: string; count: number }[] => {
  try {
    return JSON.parse(localStorage.getItem(SUGGESTION_STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
};

const recordSuggestionUse = (text: string) => {
  const history = getSuggestionHistory();
  const existing = history.find(h => h.text.toLowerCase() === text.toLowerCase());
  if (existing) {
    existing.count += 1;
    existing.text = text;
  } else {
    history.push({ text, count: 1 });
  }
  history.sort((a, b) => b.count - a.count);
  localStorage.setItem(SUGGESTION_STORAGE_KEY, JSON.stringify(history.slice(0, 50)));
};

type LinkTab = "orders" | "tables";

const normalizeTableNumber = (raw: string | null | undefined): string => {
  if (!raw) return "";
  return raw.replace(/^Table\s*/i, "").replace(/^T\.?\s*/i, "").trim().toUpperCase();
};

const getOrderItemPreview = (order: KDSTicketData) => {
  const uniqueNames: string[] = [];
  const seen = new Set<string>();
  for (const p of order.products) {
    if (!seen.has(p.name)) {
      seen.add(p.name);
      uniqueNames.push(p.name);
    }
  }
  const first3 = uniqueNames.slice(0, 3).join(", ");
  const remaining = uniqueNames.length - 3;
  if (remaining > 0) return `${first3}... +${remaining} more`;
  return first3;
};

const getStatusColor = (status: string) => {
  const s = status.toUpperCase();
  if (s === "ORDERING") return "text-red-400";
  if (s === "ORDERED") return "text-green-400";
  if (s === "PREPARING") return "text-amber-400";
  return "text-neutral-400";
};

const MessageKitchenDialog = ({ open, onOpenChange, tableId, serverName = "Staff" }: MessageKitchenDialogProps) => {
  const [selectedChips, setSelectedChips] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedTableKey, setSelectedTableKey] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [orderSearch, setOrderSearch] = useState("");
  const [tableSearch, setTableSearch] = useState("");
  const [activeOrders, setActiveOrders] = useState<KDSTicketData[]>([]);
  const [allTables, setAllTables] = useState<TableGroup[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [loadingTables, setLoadingTables] = useState(false);
  const [linkTab, setLinkTab] = useState<LinkTab>("orders");
  const chipInputRef = useRef<HTMLInputElement>(null);
  const chipContainerRef = useRef<HTMLDivElement>(null);

  // Compose full message from chips
  const composedMessage = useMemo(() => {
    const parts = [...selectedChips];
    if (inputValue.trim()) parts.push(inputValue.trim());
    return parts.join(NOTE_DELIMITER);
  }, [selectedChips, inputValue]);

  const canSend = (selectedChips.length > 0 || inputValue.trim().length > 0) && !sending;

  useEffect(() => {
    if (open) {
      setSelectedChips([]);
      setInputValue("");
      setIsDropdownOpen(false);
      setSelectedOrderId(null);
      setSelectedTableKey(null);
      setError(null);
      setFieldError(null);
      setSending(false);
      setOrderSearch("");
      setTableSearch("");
      setLinkTab("orders");
      loadActiveOrders();
      loadAllTables();
    }
  }, [open]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (chipContainerRef.current && !chipContainerRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
        if (inputValue.trim()) {
          addChip(inputValue.trim());
          setInputValue("");
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [inputValue, selectedChips]);

  const addChip = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (selectedChips.some(c => c.toLowerCase() === trimmed.toLowerCase())) return;
    const newComposed = [...selectedChips, trimmed].join(NOTE_DELIMITER);
    if (newComposed.length > MAX_LENGTH) return;
    setSelectedChips(prev => [...prev, trimmed]);
    setFieldError(null);
  };

  const removeChip = (chip: string) => {
    setSelectedChips(prev => prev.filter(c => c !== chip));
  };

  // Build suggestion pool sorted by usage
  const suggestionPool = useMemo(() => {
    const history = getSuggestionHistory();
    const pool: { text: string; count: number }[] = [];
    const seen = new Set<string>();
    for (const h of history) {
      pool.push(h);
      seen.add(h.text.toLowerCase());
    }
    for (const d of ALL_SUGGESTIONS) {
      if (!seen.has(d.toLowerCase())) {
        pool.push({ text: d, count: 0 });
        seen.add(d.toLowerCase());
      }
    }
    pool.sort((a, b) => b.count - a.count);
    return pool;
  }, []);

  const filteredSuggestions = useMemo(() => {
    const search = inputValue.trim().toLowerCase();
    const available = suggestionPool.filter(
      s => !selectedChips.some(c => c.toLowerCase() === s.text.toLowerCase())
    );
    const filtered = search
      ? available.filter(s => s.text.toLowerCase().includes(search))
      : available;
    return filtered.slice(0, 8);
  }, [inputValue, suggestionPool, selectedChips]);

  const handleChipInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setIsDropdownOpen(true);
  };

  const handleChipInputFocus = () => {
    setIsDropdownOpen(true);
  };

  const handleChipKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsDropdownOpen(false);
      chipInputRef.current?.blur();
    } else if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      addChip(inputValue.trim());
      setInputValue("");
    } else if (e.key === 'Backspace' && !inputValue && selectedChips.length > 0) {
      removeChip(selectedChips[selectedChips.length - 1]);
    }
  };

  const handleSelectSuggestion = (text: string) => {
    addChip(text);
    setInputValue("");
    setIsDropdownOpen(false);
    chipInputRef.current?.focus();
  };

  const loadActiveOrders = () => {
    setLoadingOrders(true);
    try {
      const queue = JSON.parse(localStorage.getItem("kds_ticket_queue") || "[]");
      const realOrders: KDSTicketData[] = queue
        .filter((e: any) => e.status === "active")
        .map((e: any) => ({
          id: e.sessionId || `kds-live-${e.orderNumber}`,
          orderNumber: e.orderNumber || 0,
          orderType: e.orderType || "DINE IN",
          tableNumber: e.tableNumber || null,
          serverName: e.serverName || "Staff",
          createdAt: e.createdAt || new Date().toISOString(),
          products: (e.items || []).map((i: any) => ({ name: i.name, qty: i.qty || 1 })),
          status: "active",
          partySize: e.partySize || 1,
          orderStatus: e.orderStatus || "ORDERING",
        }));

      if (realOrders.length === 0) {
        const now = new Date();
        const mockOrders: KDSTicketData[] = [
          { id: "kds-1", orderNumber: 23, orderType: "DINE IN", tableNumber: "T2", serverName: "Mia Jones", createdAt: new Date(now.getTime() - 38 * 60000).toISOString(), products: [{ name: "Fried Calamari", qty: 1 }, { name: "Filet Mignon", qty: 1 }, { name: "Meatballs", qty: 2 }, { name: "Meatballs", qty: 1 }, { name: "Grassfed Sirloin Steak", qty: 1 }, { name: "Tres Leches", qty: 1 }], status: "active", partySize: 4, orderStatus: "ORDERING" },
          { id: "kds-2", orderNumber: 24, orderType: "DINE IN", tableNumber: "T4", serverName: "Dustin H", createdAt: new Date(now.getTime() - 23 * 60000).toISOString(), products: [{ name: "Cheese Selection", qty: 1 }, { name: "Meatballs", qty: 2 }, { name: "Meatballs", qty: 1 }], status: "active", partySize: 2, orderStatus: "ORDERED" },
          { id: "kds-3", orderNumber: 25, orderType: "DINE IN", tableNumber: "T5", serverName: "Mia Jones", createdAt: new Date(now.getTime() - 23 * 60000).toISOString(), products: [{ name: "Meatballs", qty: 2 }, { name: "Meatballs", qty: 2 }], status: "active", partySize: 3, orderStatus: "PREPARING" },
          { id: "kds-4", orderNumber: 26, orderType: "DINE IN", tableNumber: "T6", serverName: "Sarah K", createdAt: new Date(now.getTime() - 38 * 60000).toISOString(), products: [{ name: "Cheese Selection", qty: 1 }, { name: "Meatballs", qty: 2 }, { name: "Meatballs", qty: 1 }], status: "active", partySize: 2, orderStatus: "ORDERING" },
          { id: "kds-5", orderNumber: 27, orderType: "DINE IN", tableNumber: "T8", serverName: "Dustin H", createdAt: new Date(now.getTime() - 23 * 60000).toISOString(), products: [{ name: "Meatballs", qty: 2 }, { name: "Cheese Selection", qty: 1 }], status: "active", partySize: 4, orderStatus: "ORDERED" },
          { id: "kds-6", orderNumber: 28, orderType: "DINE IN", tableNumber: "T3", serverName: "Mia Jones", createdAt: new Date(now.getTime() - 23 * 60000).toISOString(), products: [{ name: "Cheese Selection", qty: 1 }, { name: "Filet Mignon", qty: 1 }, { name: "Meatballs", qty: 4 }, { name: "Grassfed Sirloin Steak", qty: 2 }, { name: "Tres Leches", qty: 3 }, { name: "Meatballs", qty: 1 }, { name: "Grassfed Sirloin Steak", qty: 2 }, { name: "Grassfed Sirloin Steak", qty: 1 }], status: "active", partySize: 6, orderStatus: "PREPARING" },
        ];
        setActiveOrders(mockOrders);
      } else {
        setActiveOrders(realOrders);
      }
    } catch {
      setActiveOrders([]);
    }
    setLoadingOrders(false);
  };

  const filteredOrders = useMemo(() => {
    if (!orderSearch.trim()) return activeOrders;
    const q = orderSearch.trim().toLowerCase();
    return activeOrders.filter(o => {
      const orderNum = `#${o.orderNumber}`.toLowerCase();
      const tableNum = normalizeTableNumber(o.tableNumber).toLowerCase();
      return orderNum.includes(q) || o.orderNumber.toString().includes(q) || tableNum.includes(q) || (o.tableNumber || "").toLowerCase().includes(q);
    });
  }, [activeOrders, orderSearch]);

  const loadAllTables = async () => {
    setLoadingTables(true);
    try {
      const { data, error } = await supabase
        .from('restaurant_tables')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;

      const dbTables: TableGroup[] = (data || []).map((row: any) => {
        const tableNum = normalizeTableNumber(row.table_number);
        return {
          tableNumber: tableNum,
          displayName: `Table ${tableNum}`,
          serverName: "",
          partySize: row.guests || 0,
          time: "",
          itemCount: 0,
          orderStatus: (row.status || "AVAILABLE").toUpperCase(),
          orderIds: [],
        };
      });

      setAllTables(dbTables);
    } catch {
      setAllTables([]);
    }
    setLoadingTables(false);
  };

  const tableGroups = useMemo((): TableGroup[] => {
    const ordersByTable = new Map<string, { serverName: string; partySize: number; time: string; itemCount: number; orderStatus: string; orderIds: string[] }>();
    for (const o of activeOrders) {
      if (!o.tableNumber) continue;
      const key = normalizeTableNumber(o.tableNumber);
      if (!key) continue;
      const existing = ordersByTable.get(key);
      if (existing) {
        existing.orderIds.push(o.id);
        existing.itemCount += o.products.length;
      } else {
        ordersByTable.set(key, {
          serverName: o.serverName,
          partySize: o.partySize || 1,
          time: formatOrderTime(o.createdAt),
          itemCount: o.products.length,
          orderStatus: (o.orderStatus || "ORDERING").toUpperCase(),
          orderIds: [o.id],
        });
      }
    }

    const merged = new Map<string, TableGroup>();
    for (const t of allTables) {
      const orderData = ordersByTable.get(t.tableNumber);
      merged.set(t.tableNumber, {
        ...t,
        serverName: orderData?.serverName || "",
        partySize: orderData?.partySize || t.partySize,
        time: orderData?.time || "",
        itemCount: orderData?.itemCount || 0,
        orderStatus: orderData ? orderData.orderStatus : t.orderStatus,
        orderIds: orderData?.orderIds || [],
      });
    }

    for (const [key, od] of ordersByTable) {
      if (!merged.has(key)) {
        merged.set(key, {
          tableNumber: key,
          displayName: `Table ${key}`,
          ...od,
        });
      }
    }

    return Array.from(merged.values());
  }, [activeOrders, allTables]);

  const filteredTables = useMemo(() => {
    if (!tableSearch.trim()) return tableGroups;
    const q = tableSearch.trim().toLowerCase();
    return tableGroups.filter(t =>
      t.tableNumber.toLowerCase().includes(q) || t.displayName.toLowerCase().includes(q)
    );
  }, [tableGroups, tableSearch]);

  const selectedOrder = useMemo(() => {
    if (!selectedOrderId) return null;
    return activeOrders.find(o => o.id === selectedOrderId) || null;
  }, [selectedOrderId, activeOrders]);

  const selectedTable = useMemo(() => {
    if (!selectedTableKey) return null;
    return tableGroups.find(t => t.tableNumber === selectedTableKey) || null;
  }, [selectedTableKey, tableGroups]);

  const handleTabChange = (tab: LinkTab) => {
    setLinkTab(tab);
    setSelectedOrderId(null);
    setSelectedTableKey(null);
    setOrderSearch("");
    setTableSearch("");
  };

  const handleSend = async () => {
    if (composedMessage.length === 0) {
      setFieldError("Message cannot be empty");
      return;
    }
    if (!canSend) return;
    setSending(true);
    setError(null);
    setFieldError(null);

    const messageId = crypto.randomUUID();

    let linkedTableId: string | null = null;
    let linkedTableNumber: string | null = null;
    let linkedOrderId: string | null = null;
    let linkedOrderNumber: number | null = null;
    let linkedOrderIds: string[] | null = null;

    if (linkTab === "orders" && selectedOrder) {
      linkedOrderId = selectedOrder.id;
      linkedOrderNumber = selectedOrder.orderNumber;
      if (selectedOrder.tableNumber) {
        linkedTableId = normalizeTableNumber(selectedOrder.tableNumber);
        linkedTableNumber = `Table ${normalizeTableNumber(selectedOrder.tableNumber)}`;
      }
    } else if (linkTab === "tables" && selectedTable) {
      linkedTableId = selectedTable.tableNumber;
      linkedTableNumber = selectedTable.displayName;
      linkedOrderIds = selectedTable.orderIds;
    }

    const payload = {
      message_id: messageId,
      message_text: composedMessage,
      store_id: "default",
      terminal_id: "default",
      employee_id: "default",
      employee_name: serverName,
      table_id: linkedTableId,
      table_number: linkedTableNumber,
      linked_order_id: linkedOrderId,
      linked_order_number: linkedOrderNumber,
      linked_order_ids: linkedOrderIds,
      link_type: linkTab === "tables" && selectedTable ? "table" : linkTab === "orders" && selectedOrder ? "order" : "none",
      timestamp: new Date().toISOString(),
      status: "pending" as const,
    };

    try {
      const queue = JSON.parse(localStorage.getItem("kds_message_queue") || "[]");
      queue.push(payload);
      localStorage.setItem("kds_message_queue", JSON.stringify(queue));

      for (const chip of selectedChips) {
        recordSuggestionUse(chip);
      }
      if (inputValue.trim()) {
        recordSuggestionUse(inputValue.trim());
      }

      onOpenChange(false);
      toast.success("Message sent to kitchen ✓", { duration: 3000 });
    } catch (err) {
      setError("Failed to send message. Please try again.");
      toast.error("Failed to send message. Please try again.");
      setSending(false);
    }
  };

  function formatOrderTime(iso: string) {
    return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
  }

  const formatTableDisplay = (tableNumber: string | null) => {
    if (!tableNumber) return "No Table";
    return `Table ${normalizeTableNumber(tableNumber)}`;
  };

  const sectionTitle = linkTab === "orders"
    ? "Choose an order to link this message with (Optional)"
    : "Choose a table to link this message with (Optional)";

  const sendButtonLabel = () => {
    if (sending) return null;
    if (linkTab === "orders" && selectedOrder) return `SEND TO ORDER #${selectedOrder.orderNumber}`;
    if (linkTab === "tables" && selectedTable) return `SEND TO ${selectedTable.displayName.toUpperCase()}`;
    return "SEND";
  };

  return (
    <Dialog open={open} onOpenChange={sending ? undefined : onOpenChange}>
      <DialogContent className="bg-neutral-900 border-neutral-700 text-white max-w-[820px]" hideCloseButton>
        <DialogHeader>
          <DialogTitle className="text-white text-lg">Send Message to Kitchen</DialogTitle>
          <DialogDescription className="sr-only">Send a message to the kitchen display system</DialogDescription>
        </DialogHeader>

        <div className="flex flex-row gap-0">
          {/* Left Column - Message (chip-based) */}
          <div className="flex-1 pr-5 border-r border-neutral-700 space-y-1.5">
            <label className="text-sm text-neutral-300">Message <span className="text-red-400">*</span></label>

            <div className="relative" ref={chipContainerRef}>
              <div
                className="flex items-center gap-1.5 flex-wrap min-h-[44px] rounded-md border border-neutral-600 bg-transparent px-3 py-2 cursor-text"
                onClick={() => chipInputRef.current?.focus()}
              >
                {selectedChips.map((chip, index) => (
                  <span
                    key={`${chip}-${index}`}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-orange-500/20 text-orange-300 border border-orange-500/40"
                  >
                    <span className="truncate max-w-[140px]">{chip}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeChip(chip);
                      }}
                      className="ml-0.5 hover:text-white transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                <input
                  ref={chipInputRef}
                  type="text"
                  placeholder={selectedChips.length === 0 ? "Type or select a message..." : "Add more..."}
                  value={inputValue}
                  onChange={handleChipInputChange}
                  onFocus={handleChipInputFocus}
                  onKeyDown={handleChipKeyDown}
                  className="flex-1 min-w-[80px] bg-transparent text-sm text-white placeholder:text-neutral-500 outline-none"
                  autoFocus
                />
              </div>

              {isDropdownOpen && filteredSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 rounded-lg overflow-hidden z-50 shadow-lg border border-neutral-700 max-h-[200px] overflow-y-auto scrollbar-hide bg-neutral-800">
                  {filteredSuggestions.map((item, index) => (
                    <button
                      key={`${item.text}-${index}`}
                      className="w-full flex items-center gap-3 px-3 py-2 hover:bg-orange-500/10 transition-colors text-left"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => handleSelectSuggestion(item.text)}
                    >
                      <span className="flex-1 text-sm text-white truncate">{item.text}</span>
                      {item.count > 0 && (
                        <span className="text-xs text-neutral-500">used {item.count}x</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {fieldError && (
              <p className="text-xs text-destructive">{fieldError}</p>
            )}
            <div className="text-xs text-right text-neutral-500">
              {composedMessage.length}/{MAX_LENGTH}
            </div>
          </div>

          {/* Right Column - Link Selection */}
          <div className="w-[380px] pl-5 space-y-3">
            <p className="text-xs text-neutral-500">{sectionTitle}</p>

            {/* Tab Bar */}
            <div className="flex rounded-lg border border-neutral-600 overflow-hidden">
              <button
                onClick={() => handleTabChange("orders")}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                  linkTab === "orders"
                    ? "bg-neutral-700 text-white"
                    : "bg-transparent text-neutral-400 hover:text-neutral-300"
                }`}
              >
                Orders
              </button>
              <button
                onClick={() => handleTabChange("tables")}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                  linkTab === "tables"
                    ? "bg-neutral-700 text-white"
                    : "bg-transparent text-neutral-400 hover:text-neutral-300"
                }`}
              >
                Tables
              </button>
            </div>

            {/* Orders Tab */}
            {linkTab === "orders" && (
              <>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500" />
                  <Input
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    placeholder="Search by order number or table..."
                    className="bg-neutral-800 border-neutral-600 text-white placeholder:text-neutral-500 pl-8 h-8 text-xs"
                  />
                </div>

                {loadingOrders ? (
                  <div className="flex items-center gap-2 py-3 justify-center text-neutral-400 text-xs">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Loading orders...
                  </div>
                ) : filteredOrders.length === 0 ? (
                  <p className="text-xs text-neutral-500 text-center py-3">No active orders at the moment</p>
                ) : (
                  <div className="max-h-[220px] overflow-y-auto space-y-0.5 scrollbar-hide">
                    {filteredOrders.map(order => {
                      const tableDisplay = formatTableDisplay(order.tableNumber);
                      const timeStr = formatOrderTime(order.createdAt);
                      const isSelected = selectedOrderId === order.id;
                      return (
                        <button
                          key={order.id}
                          onClick={() => setSelectedOrderId(isSelected ? null : order.id)}
                          className={`w-full text-left px-2.5 py-2 rounded-lg transition-colors bg-neutral-800 hover:bg-neutral-700 border ${isSelected ? "border-orange-500" : "border-transparent"}`}
                        >
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-white font-semibold">#{order.orderNumber}</span>
                            <span className="text-neutral-400">{tableDisplay}</span>
                            <span className="text-neutral-500">·</span>
                            <span className="text-neutral-400">{order.serverName}</span>
                            <span className="text-neutral-500 ml-auto">{timeStr}</span>
                          </div>
                          <p className="text-xs text-neutral-500 mt-0.5">{getOrderItemPreview(order)}</p>
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {/* Tables Tab */}
            {linkTab === "tables" && (
              <>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500" />
                  <Input
                    value={tableSearch}
                    onChange={(e) => setTableSearch(e.target.value)}
                    placeholder="Search by table number or name..."
                    className="bg-neutral-800 border-neutral-600 text-white placeholder:text-neutral-500 pl-8 h-8 text-xs"
                  />
                </div>

                {loadingTables ? (
                  <div className="flex items-center gap-2 py-3 justify-center text-neutral-400 text-xs">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Loading tables...
                  </div>
                ) : filteredTables.length === 0 ? (
                  <p className="text-xs text-neutral-500 text-center py-3">No tables at the moment</p>
                ) : (
                  <div className="max-h-[220px] overflow-y-auto space-y-0.5 scrollbar-hide">
                    {filteredTables.map(table => {
                      const isSelected = selectedTableKey === table.tableNumber;
                      return (
                        <button
                          key={table.tableNumber}
                          onClick={() => setSelectedTableKey(isSelected ? null : table.tableNumber)}
                          className={`w-full text-left px-2.5 py-2 rounded-lg transition-colors bg-neutral-800 hover:bg-neutral-700 border ${isSelected ? "border-orange-500" : "border-transparent"}`}
                        >
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-white font-semibold">{table.displayName}</span>
                            <span className={`text-xs font-semibold ${getStatusColor(table.orderStatus)}`}>
                              {table.orderStatus}
                            </span>
                          </div>
                          <p className="text-xs text-neutral-500 mt-0.5">
                            {table.orderIds.length > 0
                              ? `${table.serverName} · Party of ${table.partySize} · ${table.time} · ${table.itemCount} ${table.itemCount === 1 ? "product" : "products"}`
                              : `${table.orderStatus === "AVAILABLE" ? "Available" : table.orderStatus}`}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="text-sm text-red-400 bg-red-400/10 px-3 py-2 rounded-md">
            {error}
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1 bg-neutral-800 border-neutral-600 text-white hover:bg-neutral-700"
            disabled={sending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={!canSend}
            className="flex-1 bg-orange-600 hover:bg-orange-700 text-white disabled:opacity-50"
          >
            {sending ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending...
              </span>
            ) : sendButtonLabel()}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MessageKitchenDialog;
