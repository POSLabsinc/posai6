import { useState, useRef, useEffect, useCallback } from "react";
import { X, Send, ShoppingCart, Users, FileText, Trash2, UtensilsCrossed, StickyNote, ArrowLeft, Check, Plus, Minus, CreditCard, AlertTriangle, Clock, Pencil, Settings2, ChevronDown, ChevronUp } from "lucide-react";
import ReactMarkdown from "react-markdown";
import AnimatedAIIcon from "@/components/AnimatedAIIcon";
import { toast } from "sonner";
import { fetchProductCustomization, DbModifierGroup, DbAddOn } from "@/services/productCustomizationService";

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
  addProductWithModifiers: (name: string, price: number, quantity: number, modifiers: string[], notes: string) => void;
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

const PREDEFINED_ALLERGY_NOTES = [
  "Allergic to nuts", "Allergic to peanuts", "Allergic to shellfish",
  "Allergic to dairy", "Allergic to gluten", "Allergic to eggs", "Allergic to soy",
];
const PREDEFINED_GENERAL_NOTES = [
  "No cutlery needed", "Extra napkins please", "To-go containers needed",
  "Birthday celebration", "VIP customer",
];
const NOTE_DELIMITER = " | ";

type Msg = { role: "user" | "assistant"; content: string };
const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/order-ai-chat`;

function processToolCalls(toolCalls: any[], actions: OrderActions | undefined) {
  if (!actions) return;
  for (const tc of toolCalls) {
    try {
      const args = typeof tc.function.arguments === "string"
        ? JSON.parse(tc.function.arguments) : tc.function.arguments;
      const fn = tc.function.name;
      if (fn === "add_product") {
        actions.addProduct(args.product_name, args.price, args.quantity || 1);
      } else if (fn === "add_product_with_modifiers") {
        const modifiers: string[] = args.modifiers || [];
        const basePrice = args.price || 0;
        const modifierPriceTotal = args.modifier_price_total || 0;
        actions.addProductWithModifiers(args.product_name, basePrice + modifierPriceTotal, args.quantity || 1, modifiers, args.notes || "");
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
type BrowseStep = "menu" | "category" | "products";

interface PendingProduct {
  name: string;
  price: number;
  qty: number;
  productId: string;
}

// Inline customization data per expanded product
interface InlineCustomization {
  productId: string;
  loading: boolean;
  modifierGroups: DbModifierGroup[];
  addOns: DbAddOn[];
  selectedModifiers: Record<string, string[]>;
  selectedAddOns: string[];
  activeTab: "modifiers" | "addons";
  productNotes: string;
}

const OrderAIChatPanel = ({ onClose, orderContext, orderActions, menuData }: OrderAIChatPanelProps) => {
  const [messages, setMessages] = useState<Message[]>([{
    id: "welcome", role: "assistant",
    content: "Hi! I can help you manage this order. Try saying things like:\n- \"Add 2 Margherita Pizza\"\n- \"Add burger with no onions\"\n- \"Remove the Caesar Salad\"\n- \"Change order type to Take Out\"",
    timestamp: new Date(),
  }]);
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

  // Inline customization: which product is expanded
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null);
  const [inlineCustomizations, setInlineCustomizations] = useState<Record<string, InlineCustomization>>({});

  // Notes browse state
  const [notesActive, setNotesActive] = useState(false);
  const [selectedNotes, setSelectedNotes] = useState<string[]>([]);
  const [customNoteInput, setCustomNoteInput] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const customNoteRef = useRef<HTMLInputElement>(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isTyping]);
  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => { if (showCustomInput) customNoteRef.current?.focus(); }, [showCustomInput]);

  const existingNotes = orderContext?.orderNotes
    ? orderContext.orderNotes.split(NOTE_DELIMITER).map(n => n.trim()).filter(Boolean) : [];

  // ── Stream chat ──
  const streamChat = useCallback(async (userMessage: string) => {
    const userMsg: Msg = { role: "user", content: userMessage };
    conversationRef.current = [...conversationRef.current, userMsg];
    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
      body: JSON.stringify({ messages: conversationRef.current, orderContext }),
    });
    if (resp.status === 429) { toast.error("Rate limit exceeded. Please try again in a moment."); throw new Error("Rate limited"); }
    if (resp.status === 402) { toast.error("AI credits exhausted. Please add funds."); throw new Error("Payment required"); }
    if (!resp.ok || !resp.body) throw new Error("Failed to start stream");

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "", assistantContent = "";
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
        if (jsonStr === "[DONE]") { streamDone = true; break; }
        try {
          const parsed = JSON.parse(jsonStr);
          const delta = parsed.choices?.[0]?.delta;
          if (!delta) continue;
          if (delta.content) {
            assistantContent += delta.content;
            setMessages((prev) => {
              const last = prev[prev.length - 1];
              if (last?.role === "assistant" && last.id !== "welcome")
                return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantContent } : m);
              return [...prev, { id: crypto.randomUUID(), role: "assistant", content: assistantContent, timestamp: new Date() }];
            });
          }
          if (delta.tool_calls) {
            for (const tc of delta.tool_calls) {
              const idx = tc.index ?? 0;
              if (!toolCallMap[idx]) toolCallMap[idx] = { id: tc.id || "", function: { name: tc.function?.name || "", arguments: "" } };
              if (tc.function?.name) toolCallMap[idx].function.name = tc.function.name;
              if (tc.function?.arguments) toolCallMap[idx].function.arguments += tc.function.arguments;
            }
          }
        } catch { textBuffer = line + "\n" + textBuffer; break; }
      }
    }

    const toolCalls = Object.values(toolCallMap);
    if (toolCalls.length > 0) {
      processToolCalls(toolCalls, orderActions);
      if (!assistantContent) {
        const actionNames = toolCalls.map((tc) => tc.function.name.replace(/_/g, " ")).join(", ");
        assistantContent = `Done! Executed: ${actionNames}`;
        setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "assistant", content: assistantContent, timestamp: new Date() }]);
      }
    }
    if (assistantContent) conversationRef.current = [...conversationRef.current, { role: "assistant", content: assistantContent }];
  }, [orderContext, orderActions]);

  const sendDirect = useCallback(async (text: string) => {
    if (isTyping) return;
    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "user", content: text, timestamp: new Date() }]);
    setIsTyping(true);
    try { await streamChat(text); } catch (e: any) {
      console.error("Chat error:", e);
      if (!(e instanceof Error && (e.message === "Rate limited" || e.message === "Payment required")))
        setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "assistant", content: "Sorry, I encountered an error. Please try again.", timestamp: new Date() }]);
    } finally { setIsTyping(false); }
  }, [isTyping, streamChat]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isTyping) return;
    setInput("");
    setShowOrderTypes(false);
    await sendDirect(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  // ── Browse mode handlers ──
  const startBrowse = () => {
    setBrowseActive(true); setBrowseStep("menu"); setSelectedMenu(""); setSelectedCategory("");
    setPendingProducts([]); setExpandedProductId(null); setInlineCustomizations({});
    setShowOrderTypes(false);
  };

  const selectMenu = (menu: string) => {
    setSelectedMenu(menu);
    const cats = menuData?.menuCategories[menu] || [];
    if (cats.length === 1) { setSelectedCategory(cats[0]); setBrowseStep("products"); }
    else if (cats.length > 0) setBrowseStep("category");
    else { setSelectedCategory(""); setBrowseStep("products"); }
  };

  const selectCategory = (cat: string) => { setSelectedCategory(cat); setBrowseStep("products"); };

  const getBrowseProducts = (): AvailableProduct[] => {
    if (!orderContext?.availableProducts) return [];
    if (selectedCategory) return orderContext.availableProducts.filter(p => p.category_name?.toLowerCase() === selectedCategory.toLowerCase());
    const cats = menuData?.menuCategories[selectedMenu] || [];
    if (cats.length > 0) return orderContext.availableProducts.filter(p => cats.some(c => c.toLowerCase() === (p.category_name || "").toLowerCase()));
    return orderContext.availableProducts;
  };

  // Quick add: directly add product to cart without customization
  const handleQuickAdd = (product: AvailableProduct) => {
    orderActions?.addProduct(product.name, product.price, 1);
    toast.success(`Added ${product.name} to order`);
    setMessages(prev => [
      ...prev,
      { id: crypto.randomUUID(), role: "user", content: `Add ${product.name}`, timestamp: new Date() },
      { id: crypto.randomUUID(), role: "assistant", content: `Added 1x ${product.name} ($${product.price.toFixed(2)}) to the order.`, timestamp: new Date() },
    ]);
  };

  // Toggle inline expand to show modifiers/add-ons
  const handleProductExpand = async (product: AvailableProduct) => {
    // Toggle collapse if already expanded
    if (expandedProductId === product.id) {
      setExpandedProductId(null);
      return;
    }

    setExpandedProductId(product.id);

    // Ensure product is in pending list for customization tracking
    if (!pendingProducts.some(p => p.productId === product.id)) {
      setPendingProducts(prev => [...prev, { name: product.name, price: product.price, qty: 1, productId: product.id }]);
    }

    // Fetch customization if not cached
    if (!inlineCustomizations[product.id]) {
      setInlineCustomizations(prev => ({
        ...prev,
        [product.id]: {
          productId: product.id, loading: true, modifierGroups: [], addOns: [],
          selectedModifiers: {}, selectedAddOns: [], activeTab: "modifiers", productNotes: "",
        },
      }));

      const result = await fetchProductCustomization(product.id);
      setInlineCustomizations(prev => {
        const existing = prev[product.id];
        if (!existing) return prev;
        if (!result) return { ...prev, [product.id]: { ...existing, loading: false } };

        const selectedModifiers: Record<string, string[]> = {};
        for (const group of result.modifierGroups) {
          const defaults = group.options.filter(o => o.is_default).map(o => o.name);
          if (defaults.length > 0) selectedModifiers[group.id] = defaults;
        }

        return {
          ...prev,
          [product.id]: {
            ...existing, loading: false,
            modifierGroups: result.modifierGroups, addOns: result.addOns,
            selectedModifiers,
          },
        };
      });
    }
  };

  const updatePendingQty = (name: string, delta: number) => {
    setPendingProducts(prev => prev.map(p => p.name === name ? { ...p, qty: Math.max(1, p.qty + delta) } : p));
  };

  const toggleInlineModifier = (productId: string, groupId: string, modName: string, multiSelect: boolean) => {
    setInlineCustomizations(prev => {
      const cust = prev[productId];
      if (!cust) return prev;
      const current = cust.selectedModifiers[groupId] || [];
      let updated: string[];
      if (multiSelect) {
        updated = current.includes(modName) ? current.filter(m => m !== modName) : [...current, modName];
      } else {
        updated = current.includes(modName) ? [] : [modName];
      }
      return { ...prev, [productId]: { ...cust, selectedModifiers: { ...cust.selectedModifiers, [groupId]: updated } } };
    });
  };

  const toggleInlineAddOn = (productId: string, addOnName: string) => {
    setInlineCustomizations(prev => {
      const cust = prev[productId];
      if (!cust) return prev;
      const updated = cust.selectedAddOns.includes(addOnName)
        ? cust.selectedAddOns.filter(a => a !== addOnName) : [...cust.selectedAddOns, addOnName];
      return { ...prev, [productId]: { ...cust, selectedAddOns: updated } };
    });
  };

  const setInlineTab = (productId: string, tab: "modifiers" | "addons") => {
    setInlineCustomizations(prev => {
      const cust = prev[productId];
      if (!cust) return prev;
      return { ...prev, [productId]: { ...cust, activeTab: tab } };
    });
  };

  const setInlineNotes = (productId: string, notes: string) => {
    setInlineCustomizations(prev => {
      const cust = prev[productId];
      if (!cust) return prev;
      return { ...prev, [productId]: { ...cust, productNotes: notes } };
    });
  };

  const getModStringsForProduct = (productId: string): string[] => {
    const cust = inlineCustomizations[productId];
    if (!cust) return [];
    const mods: string[] = [];
    for (const group of cust.modifierGroups) {
      const selected = cust.selectedModifiers[group.id] || [];
      for (const modName of selected) {
        const opt = group.options.find(o => o.name === modName);
        if (opt && opt.price > 0) mods.push(`${modName} (+$${opt.price.toFixed(2)})`);
        else mods.push(modName);
      }
    }
    for (const addOnName of cust.selectedAddOns) {
      const addOn = cust.addOns.find(a => a.name === addOnName);
      if (addOn && addOn.price > 0) mods.push(`Add: ${addOnName} (+$${addOn.price.toFixed(2)})`);
      else mods.push(`Add: ${addOnName}`);
    }
    return mods;
  };

  const getExtraPriceForProduct = (productId: string): number => {
    const cust = inlineCustomizations[productId];
    if (!cust) return 0;
    let extra = 0;
    for (const group of cust.modifierGroups) {
      const selected = cust.selectedModifiers[group.id] || [];
      for (const modName of selected) {
        const opt = group.options.find(o => o.name === modName);
        if (opt) extra += opt.price;
      }
    }
    for (const addOnName of cust.selectedAddOns) {
      const addOn = cust.addOns.find(a => a.name === addOnName);
      if (addOn) extra += addOn.price;
    }
    return extra;
  };

  // Confirm a single expanded product with its customizations
  const confirmSingleProduct = (product: AvailableProduct) => {
    const p = pendingProducts.find(pp => pp.productId === product.id);
    if (!p) return;

    const cust = inlineCustomizations[p.productId];
    if (cust) {
      for (const group of cust.modifierGroups) {
        if (group.required && !(cust.selectedModifiers[group.id]?.length > 0)) {
          toast.error(`Please select a ${group.name}`);
          return;
        }
      }
    }

    const modStrings = getModStringsForProduct(p.productId);
    const extraPrice = getExtraPriceForProduct(p.productId);
    const notes = inlineCustomizations[p.productId]?.productNotes || "";

    if (modStrings.length > 0 || notes.trim()) {
      orderActions?.addProductWithModifiers(p.name, p.price + extraPrice, p.qty, modStrings, notes);
    } else {
      orderActions?.addProduct(p.name, p.price, p.qty);
    }

    const modStr = modStrings.length > 0 ? ` (${modStrings.join(", ")})` : "";
    const summary = `${p.qty}x ${p.name}${modStr}`;

    setMessages(prev => [
      ...prev,
      { id: crypto.randomUUID(), role: "user", content: `Add ${summary}`, timestamp: new Date() },
      { id: crypto.randomUUID(), role: "assistant", content: `Added ${summary} to the order.`, timestamp: new Date() },
    ]);

    // Clean up this product
    setPendingProducts(prev => prev.filter(pp => pp.productId !== product.id));
    setExpandedProductId(null);
    const newCustomizations = { ...inlineCustomizations };
    delete newCustomizations[product.id];
    setInlineCustomizations(newCustomizations);
  };

  // Confirm all selected products with their customizations
  const confirmAllProducts = () => {
    if (pendingProducts.length === 0) { toast.error("No products selected"); return; }

    // Check required modifiers
    for (const p of pendingProducts) {
      const cust = inlineCustomizations[p.productId];
      if (cust) {
        for (const group of cust.modifierGroups) {
          if (group.required && !(cust.selectedModifiers[group.id]?.length > 0)) {
            toast.error(`${p.name}: Please select a ${group.name}`);
            setExpandedProductId(p.productId);
            return;
          }
        }
      }
    }

    for (const p of pendingProducts) {
      const modStrings = getModStringsForProduct(p.productId);
      const extraPrice = getExtraPriceForProduct(p.productId);
      const notes = inlineCustomizations[p.productId]?.productNotes || "";

      if (modStrings.length > 0 || notes.trim()) {
        orderActions?.addProductWithModifiers(p.name, p.price + extraPrice, p.qty, modStrings, notes);
      } else {
        orderActions?.addProduct(p.name, p.price, p.qty);
      }
    }

    const summary = pendingProducts.map(p => {
      const mods = getModStringsForProduct(p.productId);
      const modStr = mods.length > 0 ? ` (${mods.join(", ")})` : "";
      return `${p.qty}x ${p.name}${modStr}`;
    }).join(", ");

    setMessages(prev => [
      ...prev,
      { id: crypto.randomUUID(), role: "user", content: `Add ${summary}`, timestamp: new Date() },
      { id: crypto.randomUUID(), role: "assistant", content: `Added ${summary} to the order.`, timestamp: new Date() },
    ]);

    setBrowseActive(false);
    setPendingProducts([]);
    setExpandedProductId(null);
    setInlineCustomizations({});
  };

  const browseBack = () => {
    if (browseStep === "products") {
      const cats = menuData?.menuCategories[selectedMenu] || [];
      if (cats.length > 1) { setBrowseStep("category"); setSelectedCategory(""); }
      else { setBrowseStep("menu"); setSelectedMenu(""); }
      setExpandedProductId(null);
    } else if (browseStep === "category") { setBrowseStep("menu"); setSelectedMenu(""); }
    else { setBrowseActive(false); }
  };

  // ── Notes ──
  const startNotes = () => { setNotesActive(true); setSelectedNotes([]); setCustomNoteInput(""); setShowCustomInput(false); setShowOrderTypes(false); };
  const toggleNote = (note: string) => { setSelectedNotes(prev => prev.includes(note) ? prev.filter(n => n !== note) : [...prev, note]); };
  const addCustomNote = () => {
    const trimmed = customNoteInput.trim();
    if (!trimmed) return;
    if (!selectedNotes.includes(trimmed)) setSelectedNotes(prev => [...prev, trimmed]);
    setCustomNoteInput(""); setShowCustomInput(false);
  };
  const confirmNotesSelection = () => {
    if (selectedNotes.length === 0) { toast.error("No notes selected"); return; }
    const allNotes = [...existingNotes, ...selectedNotes.filter(n => !existingNotes.includes(n))];
    orderActions?.setOrderNotes(allNotes.join(NOTE_DELIMITER));
    const summary = selectedNotes.join(", ");
    setMessages(prev => [
      ...prev,
      { id: crypto.randomUUID(), role: "user", content: `Add notes: ${summary}`, timestamp: new Date() },
      { id: crypto.randomUUID(), role: "assistant", content: `Added notes: ${summary}`, timestamp: new Date() },
    ]);
    setNotesActive(false); setSelectedNotes([]);
  };

  const handlePayAction = () => {
    if (!orderContext?.orderItems || orderContext.orderItems.length === 0) { toast.error("Add products before proceeding to payment"); return; }
    if (orderActions?.openPayment) {
      orderActions.openPayment();
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: "assistant", content: "Opening payment screen...", timestamp: new Date() }]);
    } else { toast.error("Payment is not available"); }
  };

  const browseProducts = getBrowseProducts();
  const pendingTotal = pendingProducts.reduce((s, p) => s + p.price * p.qty + getExtraPriceForProduct(p.productId) * p.qty, 0);

  const availableAllergyNotes = PREDEFINED_ALLERGY_NOTES.filter(n => !existingNotes.some(e => e.toLowerCase() === n.toLowerCase()));
  const availableGeneralNotes = PREDEFINED_GENERAL_NOTES.filter(n => !existingNotes.some(e => e.toLowerCase() === n.toLowerCase()));

  // ── Inline customization renderer ──
  const renderInlineCustomization = (product: AvailableProduct) => {
    const cust = inlineCustomizations[product.id];
    if (!cust) return null;

    if (cust.loading) {
      return (
        <div className="flex items-center justify-center py-4">
          <div className="flex gap-1.5">
            <span className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-bounce [animation-delay:0ms]" />
            <span className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-bounce [animation-delay:150ms]" />
            <span className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-bounce [animation-delay:300ms]" />
          </div>
        </div>
      );
    }

    const hasModifiers = cust.modifierGroups.length > 0;
    const hasAddOns = cust.addOns.length > 0;
    if (!hasModifiers && !hasAddOns) return (
      <div className="py-2 px-2">
        <p className="text-[11px] text-neutral-500 text-center">No modifiers or add-ons available</p>
      </div>
    );

    return (
      <div className="space-y-2 pt-1">
        {/* Product notes input */}
        <div className="flex items-center gap-2 bg-[#1C1C1C] rounded-lg px-2.5 py-1.5">
          <StickyNote className="w-3 h-3 text-neutral-500 flex-shrink-0" />
          <input
            type="text"
            value={cust.productNotes}
            onChange={(e) => setInlineNotes(product.id, e.target.value)}
            placeholder="Product notes"
            className="flex-1 bg-transparent text-xs text-foreground placeholder:text-neutral-500 outline-none"
            onClick={(e) => e.stopPropagation()}
          />
        </div>

        {/* Tabs: Product / Add-Ons */}
        {(hasModifiers && hasAddOns) && (
          <div className="flex rounded-lg overflow-hidden bg-[#1C1C1C]">
            <button
              onClick={(e) => { e.stopPropagation(); setInlineTab(product.id, "modifiers"); }}
              className={`flex-1 py-1.5 text-xs font-medium transition-colors ${
                cust.activeTab === "modifiers" ? "bg-neutral-600 text-foreground" : "text-neutral-400 hover:text-neutral-300"
              }`}
            >Product</button>
            <button
              onClick={(e) => { e.stopPropagation(); setInlineTab(product.id, "addons"); }}
              className={`flex-1 py-1.5 text-xs font-medium transition-colors ${
                cust.activeTab === "addons" ? "bg-neutral-600 text-foreground" : "text-neutral-400 hover:text-neutral-300"
              }`}
            >Add-Ons</button>
          </div>
        )}

        {/* Modifiers tab */}
        {(cust.activeTab === "modifiers" || !hasAddOns) && hasModifiers && (
          <div className="space-y-2">
            {cust.modifierGroups.map(group => (
              <div key={group.id}>
                <div className="flex items-center gap-1 mb-1">
                  <span className="text-[11px] font-semibold text-neutral-300">{group.name}</span>
                  {group.required && <span className="text-[10px] text-red-400">*</span>}
                </div>
                <div className="flex flex-wrap gap-1">
                  {group.options.map(opt => {
                    const isSelected = (cust.selectedModifiers[group.id] || []).includes(opt.name);
                    return (
                      <button
                        key={opt.name}
                        onClick={(e) => { e.stopPropagation(); toggleInlineModifier(product.id, group.id, opt.name, group.multi_select); }}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors ${
                          isSelected
                            ? "bg-foreground text-background border-foreground"
                            : "bg-transparent text-neutral-300 border-neutral-600 hover:border-neutral-400"
                        }`}
                      >
                        {opt.name}{opt.price > 0 ? ` $${opt.price.toFixed(2)}` : ""}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Default Modifiers section - show when on modifiers tab */}
        {(cust.activeTab === "modifiers" || !hasAddOns) && hasModifiers && (
          <div>
            <span className="text-[11px] font-semibold text-neutral-300 mb-1 block">Default Modifiers</span>
            <div className="flex flex-wrap gap-1">
              {cust.modifierGroups.flatMap(g => g.options.filter(o => o.is_default)).map(opt => (
                <span key={opt.name} className="px-2.5 py-1 rounded-full text-[11px] font-medium border border-neutral-600 text-neutral-400">
                  {opt.name}
                </span>
              ))}
              {cust.modifierGroups.flatMap(g => g.options.filter(o => o.is_default)).length === 0 && (
                <span className="text-[10px] text-neutral-500">None</span>
              )}
            </div>
          </div>
        )}

        {/* Add-Ons tab */}
        {(cust.activeTab === "addons" || !hasModifiers) && hasAddOns && (
          <div className="space-y-1">
            {cust.addOns.map(addOn => {
              const isSelected = cust.selectedAddOns.includes(addOn.name);
              return (
                <button
                  key={addOn.id}
                  onClick={(e) => { e.stopPropagation(); toggleInlineAddOn(product.id, addOn.name); }}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-colors text-left ${
                    isSelected ? "bg-primary/15 border border-primary/30" : "bg-[#1C1C1C] hover:bg-[#252525]"
                  }`}
                >
                  <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                    isSelected ? "bg-primary border-primary" : "border-neutral-600"
                  }`}>
                    {isSelected && <Check className="w-2 h-2 text-primary-foreground" />}
                  </div>
                  <span className="text-[11px] text-neutral-200 flex-1">{addOn.name}</span>
                  {addOn.price > 0 && <span className="text-[10px] text-neutral-500">+${addOn.price.toFixed(2)}</span>}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#131316] border-l border-neutral-800">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800 flex-shrink-0">
        <div className="flex items-center gap-2">
          <AnimatedAIIcon size={14} />
          <span className="text-sm font-semibold text-foreground">AI Assistant</span>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-neutral-800 transition-colors">
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
            <button onClick={() => { setNotesActive(false); setSelectedNotes([]); }} className="ml-auto p-1 rounded-lg hover:bg-neutral-800 transition-colors">
              <X className="w-3.5 h-3.5 text-neutral-500" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
            {availableAllergyNotes.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-xs font-medium text-amber-400">Allergies</span>
                </div>
                <div className="space-y-1">
                  {availableAllergyNotes.map(note => {
                    const isSel = selectedNotes.includes(note);
                    return (
                      <button key={note} onClick={() => toggleNote(note)}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl transition-colors text-left ${isSel ? "bg-amber-500/15 border border-amber-500/30" : "bg-[#252525] hover:bg-[#303030]"}`}>
                        <div className={`w-4.5 h-4.5 rounded-md border flex items-center justify-center flex-shrink-0 transition-colors ${isSel ? "bg-amber-500 border-amber-500" : "border-neutral-600"}`}>
                          {isSel && <Check className="w-3 h-3 text-black" />}
                        </div>
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                        <span className="text-sm text-neutral-200">{note}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            {availableGeneralNotes.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <FileText className="w-3.5 h-3.5 text-neutral-400" />
                  <span className="text-xs font-medium text-neutral-400">General</span>
                </div>
                <div className="space-y-1">
                  {availableGeneralNotes.map(note => {
                    const isSel = selectedNotes.includes(note);
                    return (
                      <button key={note} onClick={() => toggleNote(note)}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl transition-colors text-left ${isSel ? "bg-primary/15 border border-primary/30" : "bg-[#252525] hover:bg-[#303030]"}`}>
                        <div className={`w-4.5 h-4.5 rounded-md border flex items-center justify-center flex-shrink-0 transition-colors ${isSel ? "bg-primary border-primary" : "border-neutral-600"}`}>
                          {isSel && <Check className="w-3 h-3 text-primary-foreground" />}
                        </div>
                        <span className="text-sm text-neutral-200">{note}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            {showCustomInput ? (
              <div className="space-y-1.5">
                <span className="text-xs font-medium text-neutral-400">Custom Note</span>
                <div className="flex items-center gap-2 bg-[#252525] rounded-xl px-3 py-2">
                  <input ref={customNoteRef} type="text" value={customNoteInput}
                    onChange={(e) => setCustomNoteInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomNote(); } }}
                    placeholder="Type your custom note..."
                    className="flex-1 bg-transparent text-sm text-foreground placeholder:text-neutral-500 outline-none" />
                  <button onClick={addCustomNote} disabled={!customNoteInput.trim()}
                    className="p-1.5 rounded-lg bg-primary text-primary-foreground disabled:opacity-30 transition-opacity">
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowCustomInput(true)}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[#1C1C1C] hover:bg-[#252525] border border-dashed border-neutral-700 text-neutral-400 text-sm transition-colors">
                <Pencil className="w-3.5 h-3.5" /> Add Custom Note
              </button>
            )}
            {selectedNotes.filter(n => !PREDEFINED_ALLERGY_NOTES.includes(n) && !PREDEFINED_GENERAL_NOTES.includes(n)).length > 0 && (
              <div>
                <span className="text-xs font-medium text-neutral-400 mb-1.5 block">Custom</span>
                <div className="space-y-1">
                  {selectedNotes.filter(n => !PREDEFINED_ALLERGY_NOTES.includes(n) && !PREDEFINED_GENERAL_NOTES.includes(n)).map(note => (
                    <div key={note} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/15 border border-primary/30">
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
          {selectedNotes.length > 0 && (
            <div className="px-3 pb-3 pt-2 border-t border-neutral-800 flex-shrink-0">
              <button onClick={confirmNotesSelection}
                className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold transition-colors hover:bg-primary/90 flex items-center justify-center gap-2">
                <StickyNote className="w-4 h-4" /> Add {selectedNotes.length} Note{selectedNotes.length > 1 ? "s" : ""}
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
            <button onClick={() => { setBrowseActive(false); setPendingProducts([]); setInlineCustomizations({}); }}
              className="ml-auto p-1 rounded-lg hover:bg-neutral-800 transition-colors">
              <X className="w-3.5 h-3.5 text-neutral-500" />
            </button>
          </div>

          {/* Browse Content */}
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5">
            {browseStep === "menu" && menuData?.menuList.map(menu => (
              <button key={menu} onClick={() => selectMenu(menu)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-[#252525] hover:bg-[#303030] text-sm text-neutral-200 transition-colors">
                <span>{menu}</span>
                <span className="text-xs text-neutral-500">{menuData.menuCategories[menu]?.length || 0} categories</span>
              </button>
            ))}

            {browseStep === "category" && menuData?.menuCategories[selectedMenu]?.map(cat => (
              <button key={cat} onClick={() => selectCategory(cat)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-[#252525] hover:bg-[#303030] text-sm text-neutral-200 transition-colors">
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
                  const isExpanded = expandedProductId === product.id && !!pending;
                  const extraPrice = getExtraPriceForProduct(product.id);

                  return (
                    <div key={product.id} className="space-y-0">
                      <div
                        className={`rounded-xl transition-colors ${
                          isExpanded
                            ? "bg-[#1C1C1C] border border-neutral-700 rounded-b-none"
                            : "bg-[#252525] hover:bg-[#303030]"
                        }`}
                      >
                        <div className="flex items-center gap-2 px-3 py-2.5">
                          {/* Product info - click to expand modifiers/add-ons */}
                          <div className="flex-1 min-w-0 cursor-pointer" onClick={() => handleProductExpand(product)}>
                            <p className="text-sm text-neutral-200 truncate">{product.name}</p>
                            <p className="text-xs text-neutral-500">
                              ${product.price.toFixed(2)}
                              {extraPrice > 0 && <span className="text-primary"> +${extraPrice.toFixed(2)}</span>}
                            </p>
                          </div>
                          {/* Quantity controls when expanded */}
                          {pending && isExpanded && (
                            <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                              <button onClick={() => updatePendingQty(product.name, -1)}
                                className="w-6 h-6 rounded-md bg-neutral-700 hover:bg-neutral-600 flex items-center justify-center transition-colors">
                                <Minus className="w-3 h-3 text-neutral-300" />
                              </button>
                              <span className="text-xs font-medium text-neutral-200 w-5 text-center">{pending.qty}</span>
                              <button onClick={() => updatePendingQty(product.name, 1)}
                                className="w-6 h-6 rounded-md bg-neutral-700 hover:bg-neutral-600 flex items-center justify-center transition-colors">
                                <Plus className="w-3 h-3 text-neutral-300" />
                              </button>
                            </div>
                          )}
                          {/* Plus icon - quick add to cart */}
                          {!isExpanded && (
                            <button onClick={(e) => { e.stopPropagation(); handleQuickAdd(product); }}
                              className="w-7 h-7 rounded-lg bg-neutral-700 hover:bg-primary/20 hover:border-primary/40 border border-neutral-600 flex items-center justify-center transition-colors flex-shrink-0">
                              <Plus className="w-3.5 h-3.5 text-neutral-300" />
                            </button>
                          )}
                          {/* Chevron toggle when expanded */}
                          {isExpanded && (
                            <button onClick={(e) => { e.stopPropagation(); setExpandedProductId(null); }}
                              className="p-1 rounded hover:bg-neutral-700 transition-colors">
                              <ChevronUp className="w-3.5 h-3.5 text-neutral-400" />
                            </button>
                          )}
                        </div>

                        {/* Inline customization panel */}
                        {isExpanded && (
                          <div className="px-3 pb-3 border-t border-neutral-700/50">
                            {renderInlineCustomization(product)}
                            {/* Add to cart button inside expanded panel */}
                            <button
                              onClick={(e) => { e.stopPropagation(); confirmSingleProduct(product); }}
                              className="w-full mt-2 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold transition-colors hover:bg-primary/90 flex items-center justify-center gap-1.5"
                            >
                              <ShoppingCart className="w-3.5 h-3.5" />
                              Add to Order - ${((pending?.qty || 1) * (product.price + extraPrice)).toFixed(2)}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-neutral-500 text-center py-4">No products in this category</p>
              )
            )}
          </div>



        </div>
      ) : (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                  msg.role === "user" ? "bg-primary text-primary-foreground rounded-br-md" : "bg-[#252525] text-foreground rounded-bl-md"
                }`}>
                  {msg.role === "assistant" ? (
                    <div className="prose prose-sm prose-invert max-w-none"><ReactMarkdown>{msg.content}</ReactMarkdown></div>
                  ) : msg.content}
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
                  <button key={type} onClick={() => { setShowOrderTypes(false); sendDirect(`Change order type to ${type}`); }}
                    disabled={isTyping}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors disabled:opacity-40 ${
                      orderContext?.orderType === type ? "bg-primary text-primary-foreground" : "bg-[#252525] hover:bg-[#303030] text-neutral-300"
                    }`}>{type}</button>
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
                <button key={btn.label} onClick={() => {
                  setShowOrderTypes(false);
                  if (btn.action === "send") sendDirect(btn.prompt!);
                  else if (btn.action === "toggle_types") setShowOrderTypes(prev => !prev);
                  else if (btn.action === "browse") startBrowse();
                  else if (btn.action === "notes") startNotes();
                  else if (btn.action === "pay") handlePayAction();
                  else { setInput(btn.prompt!); inputRef.current?.focus(); }
                }} disabled={isTyping}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#252525] hover:bg-[#303030] text-neutral-300 text-xs font-medium whitespace-nowrap transition-colors disabled:opacity-40">
                  <btn.icon className="w-3 h-3" /> {btn.label}
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          <div className="px-3 pb-3 pt-1 border-t border-neutral-800 flex-shrink-0">
            <div className="flex items-center gap-2 bg-[#252525] rounded-xl px-3 py-2">
              <input ref={inputRef} type="text" value={input} onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown} placeholder="Type a command or 'add burger with no onions'..."
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-neutral-500 outline-none" />
              <button onClick={handleSend} disabled={!input.trim() || isTyping}
                className="p-1.5 rounded-lg bg-primary text-primary-foreground disabled:opacity-30 transition-opacity">
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
