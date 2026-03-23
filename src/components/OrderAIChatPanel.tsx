import { useState, useRef, useEffect, useCallback } from "react";
import { X, Send, ShoppingCart, Users, FileText, Trash2, UtensilsCrossed, StickyNote, ArrowLeft, Check, Plus, Minus, CreditCard, AlertTriangle, Clock, Pencil } from "lucide-react";
import ReactMarkdown from "react-markdown";
import AnimatedAIIcon from "@/components/AnimatedAIIcon";
import { toast } from "sonner";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface OrderItem {
  id: number;
  qty: number;
  name: string;
  price: number;
  modifiers?: string[];
  notes?: string;
}

interface AvailableProduct {
  id: string;
  name: string;
  price: number;
  category_name?: string;
}

interface OrderContext {
  orderType: string;
  guestName: string;
  orderItems: OrderItem[];
  orderNotes: string;
  availableProducts: AvailableProduct[];
}

interface MenuData {
  menuList: string[];
  menuCategories: Record<string, string[]>;
}

interface OrderActions {
  addProduct: (name: string, price: number, quantity: number) => void;
  removeProduct: (name: string) => void;
  updateQuantity: (name: string, quantity: number) => void;
  setOrderType: (type: string) => void;
  setGuestName: (name: string) => void;
  clearOrder: () => void;
  setOrderNotes: (notes: string) => void;
  openPayment?: () => void;
}

interface OrderAIChatPanelProps {
  onClose: () => void;
  orderContext?: OrderContext;
  orderActions?: OrderActions;
  menuData?: MenuData;
}

// Predefined notes matching OrderNotesAutocomplete
const PREDEFINED_ALLERGY_NOTES = [
  "Allergic to nuts",
  "Allergic to peanuts",
  "Allergic to shellfish",
  "Allergic to dairy",
  "Allergic to gluten",
  "Allergic to eggs",
  "Allergic to soy",
];

const PREDEFINED_GENERAL_NOTES = [
  "No cutlery needed",
  "Extra napkins please",
  "To-go containers needed",
  "Birthday celebration",
  "VIP customer",
];

const NOTE_DELIMITER = " | ";

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/order-ai-chat`;

function processToolCalls(toolCalls: any[], actions: OrderActions | undefined) {
  if (!actions) return;
  for (const tc of toolCalls) {
    try {
      const args = typeof tc.function.arguments === "string"
        ? JSON.parse(tc.function.arguments)
        : tc.function.arguments;
      const fn = tc.function.name;

      if (fn === "add_product") {
        actions.addProduct(args.product_name, args.price, args.quantity || 1);
      } else if (fn === "remove_product") {
        actions.removeProduct(args.product_name);
      } else if (fn === "update_quantity") {
        actions.updateQuantity(args.product_name, args.quantity);
      } else if (fn === "set_order_type") {
        actions.setOrderType(args.order_type);
      } else if (fn === "set_guest_name") {
        actions.setGuestName(args.guest_name);
      } else if (fn === "clear_order") {
        actions.clearOrder();
      } else if (fn === "set_order_notes") {
        actions.setOrderNotes(args.notes);
      }
    } catch (e) {
      console.error("Tool call processing error:", e);
    }
  }
}

const ORDER_TYPES = ["DINE IN", "TAKE OUT", "DELIVERY", "BANQUET", "DRIVE THRU", "CURB SIDE"];

// Browse mode types
type BrowseStep = "menu" | "category" | "products";

interface PendingProduct {
  name: string;
  price: number;
  qty: number;
}

const OrderAIChatPanel = ({ onClose, orderContext, orderActions, menuData }: OrderAIChatPanelProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hi! I can help you manage this order. Try saying things like:\n- \"Add 2 Margherita Pizza\"\n- \"Remove the Caesar Salad\"\n- \"Change order type to Take Out\"\n- \"Set guest name to John\"",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showOrderTypes, setShowOrderTypes] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const conversationRef = useRef<Msg[]>([]);

  // Browse mode state
  const [browseActive, setBrowseActive] = useState(false);
  const [browseStep, setBrowseStep] = useState<BrowseStep>("menu");
  const [selectedMenu, setSelectedMenu] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [pendingProducts, setPendingProducts] = useState<PendingProduct[]>([]);

  // Notes browse state
  const [notesActive, setNotesActive] = useState(false);
  const [selectedNotes, setSelectedNotes] = useState<string[]>([]);
  const [customNoteInput, setCustomNoteInput] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const customNoteRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (showCustomInput) {
      customNoteRef.current?.focus();
    }
  }, [showCustomInput]);

  // Parse existing notes from order context
  const existingNotes = orderContext?.orderNotes
    ? orderContext.orderNotes.split(NOTE_DELIMITER).map(n => n.trim()).filter(Boolean)
    : [];

  const streamChat = useCallback(async (userMessage: string) => {
    const userMsg: Msg = { role: "user", content: userMessage };
    conversationRef.current = [...conversationRef.current, userMsg];

    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({
        messages: conversationRef.current,
        orderContext,
      }),
    });

    if (resp.status === 429) {
      toast.error("Rate limit exceeded. Please try again in a moment.");
      throw new Error("Rate limited");
    }
    if (resp.status === 402) {
      toast.error("AI credits exhausted. Please add funds.");
      throw new Error("Payment required");
    }
    if (!resp.ok || !resp.body) throw new Error("Failed to start stream");

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";
    let assistantContent = "";
    let toolCallMap: Record<number, { id: string; function: { name: string; arguments: string } }> = {};
    let streamDone = false;

    while (!streamDone) {
      const { done, value } = await reader.read();
      if (done) break;
      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") {
          streamDone = true;
          break;
        }

        try {
          const parsed = JSON.parse(jsonStr);
          const delta = parsed.choices?.[0]?.delta;
          if (!delta) continue;

          if (delta.content) {
            assistantContent += delta.content;
            setMessages((prev) => {
              const last = prev[prev.length - 1];
              if (last?.role === "assistant" && last.id !== "welcome") {
                return prev.map((m, i) =>
                  i === prev.length - 1 ? { ...m, content: assistantContent } : m
                );
              }
              return [
                ...prev,
                { id: crypto.randomUUID(), role: "assistant", content: assistantContent, timestamp: new Date() },
              ];
            });
          }

          if (delta.tool_calls) {
            for (const tc of delta.tool_calls) {
              const idx = tc.index ?? 0;
              if (!toolCallMap[idx]) {
                toolCallMap[idx] = { id: tc.id || "", function: { name: tc.function?.name || "", arguments: "" } };
              }
              if (tc.function?.name) toolCallMap[idx].function.name = tc.function.name;
              if (tc.function?.arguments) toolCallMap[idx].function.arguments += tc.function.arguments;
            }
          }
        } catch {
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }

    const toolCalls = Object.values(toolCallMap);
    if (toolCalls.length > 0) {
      processToolCalls(toolCalls, orderActions);
      if (!assistantContent) {
        const actionNames = toolCalls.map((tc) => tc.function.name.replace(/_/g, " ")).join(", ");
        assistantContent = `Done! Executed: ${actionNames}`;
        setMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), role: "assistant", content: assistantContent, timestamp: new Date() },
        ]);
      }
    }

    if (assistantContent) {
      conversationRef.current = [...conversationRef.current, { role: "assistant", content: assistantContent }];
    }
  }, [orderContext, orderActions]);

  const sendDirect = useCallback(async (text: string) => {
    if (isTyping) return;
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "user", content: text, timestamp: new Date() },
    ]);
    setIsTyping(true);
    try {
      await streamChat(text);
    } catch (e) {
      console.error("Chat error:", e);
      if (!(e instanceof Error && (e.message === "Rate limited" || e.message === "Payment required"))) {
        setMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), role: "assistant", content: "Sorry, I encountered an error. Please try again.", timestamp: new Date() },
        ]);
      }
    } finally {
      setIsTyping(false);
    }
  }, [isTyping, streamChat]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isTyping) return;
    setInput("");
    setShowOrderTypes(false);
    await sendDirect(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Browse mode handlers
  const startBrowse = () => {
    setBrowseActive(true);
    setBrowseStep("menu");
    setSelectedMenu("");
    setSelectedCategory("");
    setPendingProducts([]);
    setShowOrderTypes(false);
  };

  const selectMenu = (menu: string) => {
    setSelectedMenu(menu);
    const cats = menuData?.menuCategories[menu] || [];
    if (cats.length === 1) {
      setSelectedCategory(cats[0]);
      setBrowseStep("products");
    } else if (cats.length > 0) {
      setBrowseStep("category");
    } else {
      setSelectedCategory("");
      setBrowseStep("products");
    }
  };

  const selectCategory = (cat: string) => {
    setSelectedCategory(cat);
    setBrowseStep("products");
  };

  const getBrowseProducts = (): AvailableProduct[] => {
    if (!orderContext?.availableProducts) return [];
    if (selectedCategory) {
      return orderContext.availableProducts.filter(
        p => p.category_name?.toLowerCase() === selectedCategory.toLowerCase()
      );
    }
    const cats = menuData?.menuCategories[selectedMenu] || [];
    if (cats.length > 0) {
      return orderContext.availableProducts.filter(
        p => cats.some(c => c.toLowerCase() === (p.category_name || "").toLowerCase())
      );
    }
    return orderContext.availableProducts;
  };

  const togglePendingProduct = (product: AvailableProduct) => {
    setPendingProducts(prev => {
      const exists = prev.find(p => p.name === product.name);
      if (exists) {
        return prev.filter(p => p.name !== product.name);
      }
      return [...prev, { name: product.name, price: product.price, qty: 1 }];
    });
  };

  const updatePendingQty = (name: string, delta: number) => {
    setPendingProducts(prev =>
      prev.map(p => p.name === name ? { ...p, qty: Math.max(1, p.qty + delta) } : p)
    );
  };

  const confirmBrowseSelection = () => {
    if (pendingProducts.length === 0) {
      toast.error("No products selected");
      return;
    }
    for (const p of pendingProducts) {
      orderActions?.addProduct(p.name, p.price, p.qty);
    }
    const summary = pendingProducts.map(p => `${p.qty}x ${p.name}`).join(", ");
    setMessages(prev => [
      ...prev,
      { id: crypto.randomUUID(), role: "user", content: `Add ${summary}`, timestamp: new Date() },
      { id: crypto.randomUUID(), role: "assistant", content: `Added ${summary} to the order.`, timestamp: new Date() },
    ]);
    setBrowseActive(false);
    setPendingProducts([]);
  };

  const browseBack = () => {
    if (browseStep === "products") {
      const cats = menuData?.menuCategories[selectedMenu] || [];
      if (cats.length > 1) {
        setBrowseStep("category");
        setSelectedCategory("");
      } else {
        setBrowseStep("menu");
        setSelectedMenu("");
      }
    } else if (browseStep === "category") {
      setBrowseStep("menu");
      setSelectedMenu("");
    } else {
      setBrowseActive(false);
    }
  };

  // Notes mode handlers
  const startNotes = () => {
    setNotesActive(true);
    setSelectedNotes([]);
    setCustomNoteInput("");
    setShowCustomInput(false);
    setShowOrderTypes(false);
  };

  const toggleNote = (note: string) => {
    setSelectedNotes(prev =>
      prev.includes(note) ? prev.filter(n => n !== note) : [...prev, note]
    );
  };

  const addCustomNote = () => {
    const trimmed = customNoteInput.trim();
    if (!trimmed) return;
    if (!selectedNotes.includes(trimmed)) {
      setSelectedNotes(prev => [...prev, trimmed]);
    }
    setCustomNoteInput("");
    setShowCustomInput(false);
  };

  const confirmNotesSelection = () => {
    if (selectedNotes.length === 0) {
      toast.error("No notes selected");
      return;
    }
    // Merge with existing notes
    const allNotes = [...existingNotes, ...selectedNotes.filter(n => !existingNotes.includes(n))];
    const notesStr = allNotes.join(NOTE_DELIMITER);
    orderActions?.setOrderNotes(notesStr);

    const summary = selectedNotes.join(", ");
    setMessages(prev => [
      ...prev,
      { id: crypto.randomUUID(), role: "user", content: `Add notes: ${summary}`, timestamp: new Date() },
      { id: crypto.randomUUID(), role: "assistant", content: `Added notes: ${summary}`, timestamp: new Date() },
    ]);
    setNotesActive(false);
    setSelectedNotes([]);
  };

  // Payment handler
  const handlePayAction = () => {
    if (!orderContext?.orderItems || orderContext.orderItems.length === 0) {
      toast.error("Add products before proceeding to payment");
      return;
    }
    if (orderActions?.openPayment) {
      orderActions.openPayment();
      setMessages(prev => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", content: "Opening payment screen...", timestamp: new Date() },
      ]);
    } else {
      toast.error("Payment is not available");
    }
  };

  const browseProducts = getBrowseProducts();
  const pendingTotal = pendingProducts.reduce((s, p) => s + p.price * p.qty, 0);

  // Get all predefined notes, filtering out already-existing ones
  const availableAllergyNotes = PREDEFINED_ALLERGY_NOTES.filter(
    n => !existingNotes.some(e => e.toLowerCase() === n.toLowerCase())
  );
  const availableGeneralNotes = PREDEFINED_GENERAL_NOTES.filter(
    n => !existingNotes.some(e => e.toLowerCase() === n.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-[#131316] border-l border-neutral-800">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800 flex-shrink-0">
        <div className="flex items-center gap-2">
          <AnimatedAIIcon size={14} />
          <span className="text-sm font-semibold text-foreground">
            AI Assistant
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-neutral-800 transition-colors"
        >
          <X className="w-4 h-4 text-neutral-400" />
        </button>
      </div>

      {/* Notes Browse Mode */}
      {notesActive ? (
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-neutral-800 flex-shrink-0">
            <button onClick={() => { setNotesActive(false); setSelectedNotes([]); }} className="p-1 rounded-lg hover:bg-neutral-800 transition-colors">
              <ArrowLeft className="w-4 h-4 text-neutral-400" />
            </button>
            <span className="text-xs font-medium text-neutral-300">Add Notes</span>
            <button
              onClick={() => { setNotesActive(false); setSelectedNotes([]); }}
              className="ml-auto p-1 rounded-lg hover:bg-neutral-800 transition-colors"
            >
              <X className="w-3.5 h-3.5 text-neutral-500" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
            {/* Allergy Notes */}
            {availableAllergyNotes.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-xs font-medium text-amber-400">Allergies</span>
                </div>
                <div className="space-y-1">
                  {availableAllergyNotes.map(note => {
                    const isSelected = selectedNotes.includes(note);
                    return (
                      <button
                        key={note}
                        onClick={() => toggleNote(note)}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl transition-colors text-left ${
                          isSelected ? "bg-amber-500/15 border border-amber-500/30" : "bg-[#252525] hover:bg-[#303030]"
                        }`}
                      >
                        <div className={`w-4.5 h-4.5 rounded-md border flex items-center justify-center flex-shrink-0 transition-colors ${
                          isSelected ? "bg-amber-500 border-amber-500" : "border-neutral-600"
                        }`}>
                          {isSelected && <Check className="w-3 h-3 text-black" />}
                        </div>
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                        <span className="text-sm text-neutral-200">{note}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* General Notes */}
            {availableGeneralNotes.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <FileText className="w-3.5 h-3.5 text-neutral-400" />
                  <span className="text-xs font-medium text-neutral-400">General</span>
                </div>
                <div className="space-y-1">
                  {availableGeneralNotes.map(note => {
                    const isSelected = selectedNotes.includes(note);
                    return (
                      <button
                        key={note}
                        onClick={() => toggleNote(note)}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl transition-colors text-left ${
                          isSelected ? "bg-primary/15 border border-primary/30" : "bg-[#252525] hover:bg-[#303030]"
                        }`}
                      >
                        <div className={`w-4.5 h-4.5 rounded-md border flex items-center justify-center flex-shrink-0 transition-colors ${
                          isSelected ? "bg-primary border-primary" : "border-neutral-600"
                        }`}>
                          {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                        </div>
                        <span className="text-sm text-neutral-200">{note}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Custom Note Input */}
            {showCustomInput ? (
              <div className="space-y-1.5">
                <span className="text-xs font-medium text-neutral-400">Custom Note</span>
                <div className="flex items-center gap-2 bg-[#252525] rounded-xl px-3 py-2">
                  <input
                    ref={customNoteRef}
                    type="text"
                    value={customNoteInput}
                    onChange={(e) => setCustomNoteInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addCustomNote();
                      }
                    }}
                    placeholder="Type your custom note..."
                    className="flex-1 bg-transparent text-sm text-foreground placeholder:text-neutral-500 outline-none"
                  />
                  <button
                    onClick={addCustomNote}
                    disabled={!customNoteInput.trim()}
                    className="p-1.5 rounded-lg bg-primary text-primary-foreground disabled:opacity-30 transition-opacity"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowCustomInput(true)}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[#1C1C1C] hover:bg-[#252525] border border-dashed border-neutral-700 text-neutral-400 text-sm transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" />
                Add Custom Note
              </button>
            )}

            {/* Selected custom notes preview */}
            {selectedNotes.filter(n => !PREDEFINED_ALLERGY_NOTES.includes(n) && !PREDEFINED_GENERAL_NOTES.includes(n)).length > 0 && (
              <div>
                <span className="text-xs font-medium text-neutral-400 mb-1.5 block">Custom</span>
                <div className="space-y-1">
                  {selectedNotes.filter(n => !PREDEFINED_ALLERGY_NOTES.includes(n) && !PREDEFINED_GENERAL_NOTES.includes(n)).map(note => (
                    <div
                      key={note}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/15 border border-primary/30"
                    >
                      <div className="w-4.5 h-4.5 rounded-md bg-primary border-primary flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-primary-foreground" />
                      </div>
                      <span className="text-sm text-neutral-200 flex-1">{note}</span>
                      <button onClick={() => toggleNote(note)} className="p-0.5 hover:bg-neutral-700 rounded transition-colors">
                        <X className="w-3 h-3 text-neutral-400" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Notes Footer */}
          {selectedNotes.length > 0 && (
            <div className="px-3 pb-3 pt-2 border-t border-neutral-800 flex-shrink-0">
              <button
                onClick={confirmNotesSelection}
                className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold transition-colors hover:bg-primary/90 flex items-center justify-center gap-2"
              >
                <StickyNote className="w-4 h-4" />
                Add {selectedNotes.length} Note{selectedNotes.length > 1 ? "s" : ""}
              </button>
            </div>
          )}
        </div>
      ) : browseActive ? (
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Browse Header */}
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-neutral-800 flex-shrink-0">
            <button onClick={browseBack} className="p-1 rounded-lg hover:bg-neutral-800 transition-colors">
              <ArrowLeft className="w-4 h-4 text-neutral-400" />
            </button>
            <span className="text-xs font-medium text-neutral-300">
              {browseStep === "menu" && "Select Menu"}
              {browseStep === "category" && selectedMenu}
              {browseStep === "products" && (selectedCategory || selectedMenu)}
            </span>
            <button
              onClick={() => { setBrowseActive(false); setPendingProducts([]); }}
              className="ml-auto p-1 rounded-lg hover:bg-neutral-800 transition-colors"
            >
              <X className="w-3.5 h-3.5 text-neutral-500" />
            </button>
          </div>

          {/* Browse Content */}
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5">
            {browseStep === "menu" && menuData?.menuList.map(menu => (
              <button
                key={menu}
                onClick={() => selectMenu(menu)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-[#252525] hover:bg-[#303030] text-sm text-neutral-200 transition-colors"
              >
                <span>{menu}</span>
                <span className="text-xs text-neutral-500">
                  {menuData.menuCategories[menu]?.length || 0} categories
                </span>
              </button>
            ))}

            {browseStep === "category" && menuData?.menuCategories[selectedMenu]?.map(cat => (
              <button
                key={cat}
                onClick={() => selectCategory(cat)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-[#252525] hover:bg-[#303030] text-sm text-neutral-200 transition-colors"
              >
                <span>{cat}</span>
                <span className="text-xs text-neutral-500">
                  {orderContext?.availableProducts.filter(p => p.category_name?.toLowerCase() === cat.toLowerCase()).length || 0} products
                </span>
              </button>
            ))}

            {browseStep === "products" && (
              browseProducts.length > 0 ? (
                browseProducts.map(product => {
                  const pending = pendingProducts.find(p => p.name === product.name);
                  return (
                    <div
                      key={product.id}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl transition-colors cursor-pointer ${
                        pending ? "bg-primary/15 border border-primary/30" : "bg-[#252525] hover:bg-[#303030]"
                      }`}
                      onClick={() => togglePendingProduct(product)}
                    >
                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-colors ${
                        pending ? "bg-primary border-primary" : "border-neutral-600"
                      }`}>
                        {pending && <Check className="w-3 h-3 text-primary-foreground" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-neutral-200 truncate">{product.name}</p>
                        <p className="text-xs text-neutral-500">${product.price.toFixed(2)}</p>
                      </div>
                      {pending && (
                        <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => updatePendingQty(product.name, -1)}
                            className="w-6 h-6 rounded-md bg-neutral-700 hover:bg-neutral-600 flex items-center justify-center transition-colors"
                          >
                            <Minus className="w-3 h-3 text-neutral-300" />
                          </button>
                          <span className="text-xs font-medium text-neutral-200 w-5 text-center">{pending.qty}</span>
                          <button
                            onClick={() => updatePendingQty(product.name, 1)}
                            className="w-6 h-6 rounded-md bg-neutral-700 hover:bg-neutral-600 flex items-center justify-center transition-colors"
                          >
                            <Plus className="w-3 h-3 text-neutral-300" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-neutral-500 text-center py-4">No products in this category</p>
              )
            )}
          </div>

          {/* Browse Footer */}
          {pendingProducts.length > 0 && (
            <div className="px-3 pb-3 pt-2 border-t border-neutral-800 flex-shrink-0">
              <button
                onClick={confirmBrowseSelection}
                className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold transition-colors hover:bg-primary/90 flex items-center justify-center gap-2"
              >
                <ShoppingCart className="w-4 h-4" />
                Add {pendingProducts.reduce((s, p) => s + p.qty, 0)} Products - ${pendingTotal.toFixed(2)}
              </button>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-[#252525] text-foreground rounded-bl-md"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <div className="prose prose-sm prose-invert max-w-none">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-[#252525] rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 bg-neutral-500 rounded-full animate-bounce [animation-delay:0ms]" />
                    <span className="w-2 h-2 bg-neutral-500 rounded-full animate-bounce [animation-delay:150ms]" />
                    <span className="w-2 h-2 bg-neutral-500 rounded-full animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Order Type Sub-options */}
          {showOrderTypes && (
            <div className="px-3 pt-2 flex-shrink-0">
              <p className="text-xs text-neutral-400 mb-1.5">Select order type:</p>
              <div className="flex flex-wrap gap-1.5 pb-2">
                {ORDER_TYPES.map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      setShowOrderTypes(false);
                      sendDirect(`Change order type to ${type}`);
                    }}
                    disabled={isTyping}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors disabled:opacity-40 ${
                      orderContext?.orderType === type
                        ? "bg-primary text-primary-foreground"
                        : "bg-[#252525] hover:bg-[#303030] text-neutral-300"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="px-3 pt-2 flex-shrink-0 overflow-x-auto scrollbar-hide">
            <div className="flex gap-1.5 pb-2">
              {[
                { icon: ShoppingCart, label: "Add Product", action: "browse" as const },
                { icon: UtensilsCrossed, label: "Order Type", action: "toggle_types" as const },
                { icon: Users, label: "Guest", action: "input" as const, prompt: "Set guest name to " },
                { icon: StickyNote, label: "Note", action: "notes" as const },
                { icon: FileText, label: "Summary", action: "send" as const, prompt: "Show me the current order summary" },
                { icon: CreditCard, label: "Pay", action: "pay" as const },
                { icon: Trash2, label: "Clear", action: "send" as const, prompt: "Clear the entire order" },
              ].map((btn) => (
                <button
                  key={btn.label}
                  onClick={() => {
                    setShowOrderTypes(false);
                    if (btn.action === "send") {
                      sendDirect(btn.prompt!);
                    } else if (btn.action === "toggle_types") {
                      setShowOrderTypes((prev) => !prev);
                    } else if (btn.action === "browse") {
                      startBrowse();
                    } else if (btn.action === "notes") {
                      startNotes();
                    } else if (btn.action === "pay") {
                      handlePayAction();
                    } else {
                      setInput(btn.prompt!);
                      inputRef.current?.focus();
                    }
                  }}
                  disabled={isTyping}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#252525] hover:bg-[#303030] text-neutral-300 text-xs font-medium whitespace-nowrap transition-colors disabled:opacity-40"
                >
                  <btn.icon className="w-3 h-3" />
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          <div className="px-3 pb-3 pt-1 border-t border-neutral-800 flex-shrink-0">
            <div className="flex items-center gap-2 bg-[#252525] rounded-xl px-3 py-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a product name, guest name, or command..."
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-neutral-500 outline-none"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className="p-1.5 rounded-lg bg-primary text-primary-foreground disabled:opacity-30 transition-opacity"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default OrderAIChatPanel;
