import { useState, useEffect, useMemo, useCallback, KeyboardEvent } from "react";
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
const WARN_THRESHOLD = 90;
const DANGER_THRESHOLD = 95;

const SUGGESTION_STORAGE_KEY = "kds_message_suggestions";

const DEFAULT_SUGGESTIONS = [
  "86'd - Out of stock",
  "Rush this order",
  "Hold this order",
  "Fire when ready",
  "Allergy alert",
  "VIP guest",
  "Remake needed",
  "Low stock warning",
];

const EXTENDED_SUGGESTIONS = [
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
  localStorage.setItem(SUGGESTION_STORAGE_KEY, JSON.stringify(history.slice(0, 30)));
};

const SuggestionChips = ({ message, onSelect }: { message: string; onSelect: (text: string) => void }) => {
  const history = useMemo(() => getSuggestionHistory(), []);

  const allPool = useMemo(() => {
    const pool: { text: string; count: number }[] = [];
    const seen = new Set<string>();
    for (const h of history) {
      pool.push(h);
      seen.add(h.text.toLowerCase());
    }
    for (const d of [...DEFAULT_SUGGESTIONS, ...EXTENDED_SUGGESTIONS]) {
      const lower = d.toLowerCase();
      if (!seen.has(lower)) {
        pool.push({ text: d, count: 0 });
        seen.add(lower);
      }
    }
    pool.sort((a, b) => b.count - a.count);
    return pool;
  }, [history]);

  const chips = useMemo(() => {
    const trimmed = message.trim().toLowerCase();
    if (trimmed.length === 0) {
      return allPool.slice(0, 8);
    }
    return allPool
      .filter(s => s.text.toLowerCase().includes(trimmed) && s.text.toLowerCase() !== trimmed)
      .slice(0, 8);
  }, [message, allPool]);

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5 mt-1">
      {chips.map((chip) => (
        <button
          key={chip.text}
          type="button"
          onClick={() => onSelect(chip.text)}
          className="px-2.5 py-1 text-xs rounded-full bg-neutral-700/70 text-neutral-300 hover:bg-orange-500/20 hover:text-orange-400 border border-neutral-600/50 hover:border-orange-500/40 transition-colors truncate max-w-[200px]"
        >
          {chip.text}
        </button>
      ))}
    </div>
  );
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
  const [messageChips, setMessageChips] = useState<string[]>([]);
  const [chipInput, setChipInput] = useState("");
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

  useEffect(() => {
    if (open) {
      setMessageChips([]);
      setChipInput("");
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

  const composedMessage = messageChips.join(", ");
  const trimmedMessage = composedMessage.trim();
  const charCount = composedMessage.length;
  const canSend = messageChips.length > 0 && !sending;

  const counterColorClass = useMemo(() => {
    if (charCount >= DANGER_THRESHOLD) return "text-destructive";
    if (charCount >= WARN_THRESHOLD) return "text-orange-400";
    return "text-neutral-500";
  }, [charCount]);

  const addChip = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (messageChips.some(c => c.toLowerCase() === trimmed.toLowerCase())) return;
    const newChips = [...messageChips, trimmed];
    const newComposed = newChips.join(", ");
    if (newComposed.length > MAX_LENGTH) return; // prevent exceeding limit
    setMessageChips(newChips);
    setChipInput("");
    setFieldError(null);
  };

  const removeChip = (index: number) => {
    setMessageChips(prev => prev.filter((_, i) => i !== index));
  };

  const handleChipInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addChip(chipInput);
    }
    if (e.key === "Backspace" && chipInput === "" && messageChips.length > 0) {
      removeChip(messageChips.length - 1);
    }
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

  // Load all tables from database
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

  // Merge DB tables with active order data
  const tableGroups = useMemo((): TableGroup[] => {
    // Build order data grouped by table
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

    // Merge: start with all DB tables, enrich with order data
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

    // Add any order-only tables not in DB
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
    if (trimmedMessage.length === 0) {
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
      message_text: trimmedMessage,
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

      recordSuggestionUse(trimmedMessage);

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
          {/* Left Column - Message */}
          <div className="flex-1 pr-5 border-r border-neutral-700 space-y-1.5">
            <label className="text-sm text-neutral-300">Message <span className="text-red-400">*</span></label>
            <Textarea
              value={message}
              onChange={(e) => {
                if (e.target.value.length <= MAX_LENGTH) {
                  setMessage(e.target.value);
                  if (e.target.value.trim().length > 0) setFieldError(null);
                }
              }}
              placeholder="Type your message for the kitchen..."
              className="bg-transparent border-neutral-600 text-white placeholder:text-neutral-500 min-h-[100px] resize-none focus-visible:ring-orange-500"
              maxLength={MAX_LENGTH}
              autoFocus
            />
            {fieldError && (
              <p className="text-xs text-destructive">{fieldError}</p>
            )}
            <div className={`text-xs text-right ${counterColorClass}`}>
              {charCount}/{MAX_LENGTH}
            </div>

            <SuggestionChips
              message={message}
              onSelect={(text) => {
                setMessage(text.slice(0, MAX_LENGTH));
                setFieldError(null);
              }}
            />
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
