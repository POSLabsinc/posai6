import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Banknote,
  Check,
  ChevronRight,
  CreditCard,
  Gift,
  Minus,
  MoreHorizontal,
  Plus,
  Printer,
  ReceiptText,
  Search,
  ShoppingBag,
  Trash2,
  UserPlus,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTicketOrders } from "@/hooks/use-ticket-orders";
import { fetchProductCustomization, type ProductCustomization } from "@/services/productCustomizationService";
import { getEditorialCatalog } from "@/features/editorial-orders/catalogApi";
import type {
  EditorialCartLine,
  EditorialPaymentMethod,
  EditorialProduct,
} from "@/features/editorial-orders/types";
import restaurantLogo from "@/assets/icons/restaurant-logo.png";
import "./OrdersEditorial.css";

type WorkspaceView = "catalog" | "payment" | "receipt";

const money = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);

const readSessionName = () => {
  try {
    const session = JSON.parse(localStorage.getItem("pos_session") ?? "{}");
    return session.employeeName || session.name || "Team Member";
  } catch {
    return "Team Member";
  }
};

const OrdersEditorial = () => {
  const { orders, addOrder } = useTicketOrders();
  const [products, setProducts] = useState<EditorialProduct[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [catalogError, setCatalogError] = useState("");
  const [activeCategory, setActiveCategory] = useState("All Products");
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<EditorialCartLine[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<EditorialProduct | null>(null);
  const [editingLineId, setEditingLineId] = useState<string | null>(null);
  const [customization, setCustomization] = useState<ProductCustomization | null>(null);
  const [customizationLoading, setCustomizationLoading] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selectedModifiers, setSelectedModifiers] = useState<Record<string, string[]>>({});
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [view, setView] = useState<WorkspaceView>("catalog");
  const [orderType, setOrderType] = useState("Dine In");
  const [paymentMethod, setPaymentMethod] = useState<EditorialPaymentMethod>("card");
  const [tendered, setTendered] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedOrderId, setCompletedOrderId] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [cartOpen, setCartOpen] = useState(false);
  const employeeName = useMemo(readSessionName, []);

  const orderNumber = useMemo(
    () => Math.max(1000, ...orders.map((order) => Number(order.orderNumber) || 0)) + 1,
    [orders],
  );

  const loadCatalog = async () => {
    setLoading(true);
    setCatalogError("");
    try {
      const response = await getEditorialCatalog();
      setProducts(response.products);
      setCategories(response.categories);
    } catch (error) {
      setCatalogError(error instanceof Error ? error.message : "The product catalog could not be loaded.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCatalog();
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setElapsedSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return products.filter((product) => {
      const matchesCategory = activeCategory === "All Products" || product.category === activeCategory;
      const matchesQuery = !normalizedQuery || `${product.name} ${product.description}`.toLowerCase().includes(normalizedQuery);
      return matchesCategory && matchesQuery;
    });
  }, [activeCategory, products, query]);

  const subtotal = useMemo(
    () => cart.reduce((sum, line) => sum + (line.product.price.amount + line.modifierTotal) * line.quantity, 0),
    [cart],
  );
  const tax = subtotal * 0.0825;
  const total = subtotal + tax;
  const productCount = cart.reduce((sum, line) => sum + line.quantity, 0);
  const elapsed = `${Math.floor(elapsedSeconds / 60).toString().padStart(2, "0")}:${(elapsedSeconds % 60).toString().padStart(2, "0")}`;

  const openProduct = async (product: EditorialProduct, line?: EditorialCartLine) => {
    if (!product.isAvailable) return;
    setSelectedProduct(product);
    setEditingLineId(line?.lineId ?? null);
    setQuantity(line?.quantity ?? 1);
    setNotes(line?.notes ?? "");
    setSelectedAddOns([]);
    setCustomization(null);
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(product.id)) {
      setCustomizationLoading(false);
      return;
    }
    setCustomizationLoading(true);
    const data = await fetchProductCustomization(product.id);
    setCustomization(data);
    const selections: Record<string, string[]> = {};
    data?.modifierGroups.forEach((group) => {
      const fromLine = line?.modifiers.filter((name) => group.options.some((option) => option.name === name)) ?? [];
      const defaults = group.options.filter((option) => option.is_default).map((option) => option.name);
      selections[group.id] = fromLine.length ? fromLine : defaults;
    });
    const addOnNames = new Set(data?.addOns.map((addOn) => addOn.name) ?? []);
    setSelectedAddOns(line?.modifiers.filter((name) => addOnNames.has(name)) ?? []);
    setSelectedModifiers(selections);
    setCustomizationLoading(false);
  };

  const closeProduct = () => {
    setSelectedProduct(null);
    setEditingLineId(null);
  };

  const modifierNames = Object.values(selectedModifiers).flat();
  const modifierTotal = useMemo(() => {
    if (!customization) return 0;
    const modifierPrices = customization.modifierGroups.flatMap((group) => group.options);
    const modifiersPrice = modifierNames.reduce(
      (sum, name) => sum + (modifierPrices.find((option) => option.name === name)?.price ?? 0),
      0,
    );
    const addOnsPrice = selectedAddOns.reduce(
      (sum, name) => sum + (customization.addOns.find((addOn) => addOn.name === name)?.price ?? 0),
      0,
    );
    return modifiersPrice + addOnsPrice;
  }, [customization, modifierNames, selectedAddOns]);

  const requiredComplete = customization?.modifierGroups.every(
    (group) => !group.required || (selectedModifiers[group.id]?.length ?? 0) > 0,
  ) ?? true;

  const toggleModifier = (groupId: string, option: string, multiSelect: boolean) => {
    setSelectedModifiers((current) => {
      const selected = current[groupId] ?? [];
      const next = multiSelect
        ? selected.includes(option) ? selected.filter((name) => name !== option) : [...selected, option]
        : [option];
      return { ...current, [groupId]: next };
    });
  };

  const saveProduct = () => {
    if (!selectedProduct || !requiredComplete) return;
    const line: EditorialCartLine = {
      lineId: editingLineId ?? crypto.randomUUID(),
      product: selectedProduct,
      quantity,
      modifiers: [...modifierNames, ...selectedAddOns],
      modifierTotal,
      notes: notes.trim(),
    };
    setCart((current) => editingLineId ? current.map((existing) => existing.lineId === editingLineId ? line : existing) : [...current, line]);
    closeProduct();
    setCartOpen(true);
  };

  const changeLineQuantity = (lineId: string, change: number) => {
    setCart((current) => current
      .map((line) => line.lineId === lineId ? { ...line, quantity: line.quantity + change } : line)
      .filter((line) => line.quantity > 0));
  };

  const completePayment = async () => {
    setPaymentError("");
    if (paymentMethod === "cash" && Number(tendered) < total) {
      setPaymentError(`Enter at least ${money(total)} to accept cash.`);
      return;
    }
    setIsProcessing(true);
    try {
      const now = new Date();
      const data = await addOrder({
        orderNumber,
        name: "Walk-in Guest",
        phone: "",
        partySize: 1,
        time: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        timer: elapsed,
        server: employeeName,
        check: String(orderNumber),
        paymentType: paymentMethod === "cash" ? "Cash" : paymentMethod === "card" ? "Card" : "Gift Card",
        payments: [{ method: paymentMethod, amount: total }],
        revenueCenter: "Main Dining",
        status: "PAID",
        notes: "",
        table: "",
        orderType,
        items: cart.map((line) => ({
          qty: line.quantity,
          name: line.product.name,
          price: line.product.price.amount + line.modifierTotal,
          seats: [],
          modifiers: line.modifiers,
          isFired: true,
        })),
        subtotal,
        discount: 0,
        serviceCharge: 0,
        tax,
        tip: 0,
        total,
        paidAmount: total.toFixed(2),
        paymentStatus: "completed",
      });
      setCompletedOrderId(data?.id ?? null);
      setView("receipt");
    } catch (error) {
      setPaymentError(error instanceof Error ? error.message : "Payment could not be completed. Try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const resetOrder = () => {
    setCart([]);
    setView("catalog");
    setTendered("");
    setCompletedOrderId(null);
    setElapsedSeconds(0);
    setCartOpen(false);
  };

  return (
    <div className="editorial-orders" data-view={view}>
      <header className="editorial-orders__header">
        <div className="editorial-orders__identity">
          <img src={restaurantLogo} alt="The Rustic Table" />
          <div>
            <span className="editorial-eyebrow">POINT OF SALE</span>
            <strong>The Rustic Table</strong>
          </div>
        </div>
        <div className="editorial-orders__order-meta">
          <div><span>ORDER</span><strong>{orderNumber}</strong></div>
          <div><span>ELAPSED</span><strong>{elapsed}</strong></div>
          <div><span>STAFF</span><strong>{employeeName}</strong></div>
          <Button variant="outline" className="editorial-icon-button" aria-label="More order actions" title="More order actions"><MoreHorizontal /></Button>
        </div>
      </header>

      {view === "catalog" && (
        <div className="editorial-orders__workspace">
          <section className="editorial-orders__catalog" aria-label="Product catalog">
            <div className="editorial-orders__title-row">
              <div>
                <span className="editorial-eyebrow">NEW ORDER</span>
                <h1>Choose products</h1>
                <p>Build the order, review the details, then collect payment.</p>
              </div>
              <Button className="editorial-mobile-cart" onClick={() => setCartOpen(true)}>
                <ShoppingBag /> {productCount} Products
              </Button>
            </div>

            <div className="editorial-orders__tools">
              <label className="editorial-search">
                <Search aria-hidden="true" />
                <span className="sr-only">Search products</span>
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search products" />
                {query && <Button variant="ghost" size="icon" onClick={() => setQuery("")} aria-label="Clear search"><X /></Button>}
              </label>
              <div className="editorial-order-types" aria-label="Order type">
                {["Dine In", "Takeout"].map((type) => (
                  <Button key={type} variant="ghost" aria-pressed={orderType === type} onClick={() => setOrderType(type)}>{type}</Button>
                ))}
              </div>
            </div>

            <nav className="editorial-categories" aria-label="Product categories">
              {["All Products", ...categories].map((category) => (
                <Button key={category} variant="ghost" aria-current={activeCategory === category ? "page" : undefined} onClick={() => setActiveCategory(category)}>{category}</Button>
              ))}
            </nav>

            {loading ? (
              <div className="editorial-product-grid" aria-label="Loading products">
                {Array.from({ length: 8 }, (_, index) => <div className="editorial-product-skeleton" key={index} />)}
              </div>
            ) : catalogError ? (
              <div className="editorial-state">
                <div><span className="editorial-eyebrow">CATALOG UNAVAILABLE</span><h2>Products could not be loaded.</h2><p>{catalogError}</p></div>
                <Button onClick={() => void loadCatalog()}>Retry catalog</Button>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="editorial-state">
                <div><span className="editorial-eyebrow">NO PRODUCTS FOUND</span><h2>Try a different search.</h2><p>Clear the search or choose another category to view available products.</p></div>
                <Button variant="outline" onClick={() => { setQuery(""); setActiveCategory("All Products"); }}>Show all products</Button>
              </div>
            ) : (
              <div className="editorial-product-grid">
                {filteredProducts.map((product) => (
                  <article className="editorial-product" key={product.id} data-unavailable={!product.isAvailable || undefined}>
                    <button type="button" onClick={() => void openProduct(product)} disabled={!product.isAvailable} aria-label={`View ${product.name}`}>
                      <div className="editorial-product__image">
                        {product.imageUrl ? <img src={product.imageUrl} alt={product.name} loading="lazy" /> : <ReceiptText aria-hidden="true" />}
                        {!product.isAvailable && <span>Unavailable</span>}
                      </div>
                      <div className="editorial-product__copy">
                        <span className="editorial-eyebrow">{product.category}</span>
                        <h2>{product.name}</h2>
                        <p>{product.description || "View details and available modifiers."}</p>
                        <strong>{product.isOpenPrice ? "Open price" : money(product.price.amount)}</strong>
                      </div>
                    </button>
                  </article>
                ))}
              </div>
            )}
          </section>

          <aside className={`editorial-cart ${cartOpen ? "is-open" : ""}`} aria-label="Current order">
            <div className="editorial-cart__mobile-head">
              <div><span className="editorial-eyebrow">CURRENT ORDER</span><strong>{productCount} Products</strong></div>
              <Button variant="ghost" size="icon" onClick={() => setCartOpen(false)} aria-label="Close current order"><X /></Button>
            </div>
            <div className="editorial-cart__head">
              <div><span className="editorial-eyebrow">CURRENT ORDER</span><h2>{orderType}</h2></div>
              <Button variant="outline" className="editorial-icon-button" aria-label="Add guest" title="Add guest"><UserPlus /></Button>
            </div>
            {cart.length === 0 ? (
              <div className="editorial-cart__empty">
                <ShoppingBag aria-hidden="true" />
                <h3>No products added</h3>
                <p>Select a product to begin order {orderNumber}.</p>
              </div>
            ) : (
              <div className="editorial-cart__lines">
                {cart.map((line) => (
                  <div className="editorial-cart-line" key={line.lineId}>
                    <button type="button" className="editorial-cart-line__details" onClick={() => void openProduct(line.product, line)}>
                      <span className="editorial-eyebrow">{line.product.category}</span>
                      <strong>{line.product.name}</strong>
                      {line.modifiers.length > 0 && <small>{line.modifiers.join(", ")}</small>}
                      {line.notes && <small>Note: {line.notes}</small>}
                    </button>
                    <div className="editorial-cart-line__actions">
                      <div className="editorial-stepper">
                        <Button variant="ghost" size="icon" onClick={() => changeLineQuantity(line.lineId, -1)} aria-label={`Remove one ${line.product.name}`}><Minus /></Button>
                        <span>{line.quantity}</span>
                        <Button variant="ghost" size="icon" onClick={() => changeLineQuantity(line.lineId, 1)} aria-label={`Add one ${line.product.name}`}><Plus /></Button>
                      </div>
                      <strong>{money((line.product.price.amount + line.modifierTotal) * line.quantity)}</strong>
                      <Button variant="ghost" size="icon" onClick={() => setCart((current) => current.filter((item) => item.lineId !== line.lineId))} aria-label={`Remove ${line.product.name}`}><Trash2 /></Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="editorial-cart__summary">
              <div><span>Subtotal</span><strong>{money(subtotal)}</strong></div>
              <div><span>Tax</span><strong>{money(tax)}</strong></div>
              <div className="editorial-cart__total"><span>Total</span><strong>{money(total)}</strong></div>
              <Button className="editorial-primary" disabled={!cart.length} onClick={() => { setView("payment"); setCartOpen(false); }}>
                Collect {money(total)} <ChevronRight />
              </Button>
              {!cart.length && <p className="editorial-helper">Add at least one Product to collect payment.</p>}
            </div>
          </aside>
          {cartOpen && <button className="editorial-backdrop" onClick={() => setCartOpen(false)} aria-label="Close current order" />}
        </div>
      )}

      {view === "payment" && (
        <main className="editorial-focus">
          <Button variant="ghost" className="editorial-back" onClick={() => setView("catalog")}><ArrowLeft /> Back to order</Button>
          <div className="editorial-focus__heading">
            <span className="editorial-eyebrow">PAYMENT · ORDER {orderNumber}</span>
            <h1>Collect {money(total)}</h1>
            <p>Choose how the guest wants to pay.</p>
          </div>
          <div className="editorial-payment-layout">
            <section className="editorial-payment-methods">
              {([
                ["card", CreditCard, "Card", "Process a credit or debit card"],
                ["cash", Banknote, "Cash", "Enter the amount received"],
                ["gift_card", Gift, "Gift Card", "Apply an available gift card"],
              ] as const).map(([method, Icon, label, description]) => (
                <Button key={method} variant="outline" className="editorial-payment-method" aria-pressed={paymentMethod === method} onClick={() => setPaymentMethod(method)}>
                  <Icon /><span><strong>{label}</strong><small>{description}</small></span>{paymentMethod === method && <Check />}
                </Button>
              ))}
              {paymentMethod === "cash" && (
                <div className="editorial-tender">
                  <label htmlFor="tendered">Cash received</label>
                  <div><span>$</span><input id="tendered" inputMode="decimal" value={tendered} onChange={(event) => setTendered(event.target.value.replace(/[^0-9.]/g, ""))} placeholder="0.00" /></div>
                  <div className="editorial-quick-cash">
                    {[Math.ceil(total), Math.ceil(total / 5) * 5, Math.ceil(total / 10) * 10].filter((value, index, values) => values.indexOf(value) === index).map((value) => (
                      <Button key={value} variant="outline" onClick={() => setTendered(value.toFixed(2))}>{money(value)}</Button>
                    ))}
                  </div>
                  {Number(tendered) >= total && <p className="editorial-change">Change due <strong>{money(Number(tendered) - total)}</strong></p>}
                </div>
              )}
            </section>
            <aside className="editorial-payment-summary">
              <span className="editorial-eyebrow">ORDER SUMMARY</span>
              <h2>{productCount} Products</h2>
              <div className="editorial-payment-summary__lines">
                {cart.map((line) => <div key={line.lineId}><span>{line.quantity} × {line.product.name}</span><strong>{money((line.product.price.amount + line.modifierTotal) * line.quantity)}</strong></div>)}
              </div>
              <div className="editorial-payment-summary__totals">
                <div><span>Subtotal</span><strong>{money(subtotal)}</strong></div>
                <div><span>Tax</span><strong>{money(tax)}</strong></div>
                <div><span>Total due</span><strong>{money(total)}</strong></div>
              </div>
              {paymentError && <p className="editorial-error" role="alert">{paymentError}</p>}
              <Button className="editorial-primary" onClick={() => void completePayment()} disabled={isProcessing}>
                {isProcessing ? "Processing payment" : `Pay ${money(total)}`}
              </Button>
              <p className="editorial-helper">The order is marked PAID only after payment completes.</p>
            </aside>
          </div>
        </main>
      )}

      {view === "receipt" && (
        <main className="editorial-complete">
          <div className="editorial-complete__mark"><Check /></div>
          <span className="editorial-eyebrow">PAYMENT COMPLETE</span>
          <h1>Order {orderNumber} is PAID</h1>
          <p>{money(total)} was collected successfully. Choose a receipt option or begin the next order.</p>
          <div className="editorial-receipt">
            <img src={restaurantLogo} alt="The Rustic Table" />
            <h2>The Rustic Table</h2>
            <span>Order {orderNumber}</span>
            {cart.map((line) => <div key={line.lineId}><span>{line.quantity} × {line.product.name}</span><strong>{money((line.product.price.amount + line.modifierTotal) * line.quantity)}</strong></div>)}
            <div><span>Tax</span><strong>{money(tax)}</strong></div>
            <div className="editorial-receipt__total"><span>Total</span><strong>{money(total)}</strong></div>
            <small>Reference {completedOrderId?.slice(0, 8) || orderNumber}</small>
          </div>
          <div className="editorial-complete__actions">
            <Button variant="outline"><Printer /> Print receipt</Button>
            <Button variant="outline"><ReceiptText /> Email receipt</Button>
            <Button className="editorial-primary" onClick={resetOrder}><Plus /> Start new order</Button>
          </div>
        </main>
      )}

      {selectedProduct && (
        <div className="editorial-drawer-layer" role="presentation">
          <button className="editorial-drawer-backdrop" onClick={closeProduct} aria-label="Close Product details" />
          <section className="editorial-drawer" role="dialog" aria-modal="true" aria-labelledby="editorial-product-title">
            <div className="editorial-drawer__head">
              <div><span className="editorial-eyebrow">VIEW PRODUCT</span><h2 id="editorial-product-title">{selectedProduct.name}</h2></div>
              <Button variant="ghost" size="icon" onClick={closeProduct} aria-label="Close Product details"><X /></Button>
            </div>
            <div className="editorial-drawer__media">
              {customization?.productInfo.image_url || selectedProduct.imageUrl
                ? <img src={customization?.productInfo.image_url || selectedProduct.imageUrl || ""} alt={selectedProduct.name} />
                : <ReceiptText aria-hidden="true" />}
            </div>
            <div className="editorial-drawer__intro">
              <p>{customization?.productInfo.description || selectedProduct.description || "Choose the Product options for this order."}</p>
              <strong>{money(selectedProduct.price.amount)}</strong>
            </div>
            {customizationLoading ? (
              <div className="editorial-drawer__loading"><span /><span /><span /></div>
            ) : (
              <div className="editorial-drawer__options">
                {customization?.modifierGroups.map((group) => (
                  <fieldset key={group.id}>
                    <legend>{group.name} {group.required && <span>Required</span>}</legend>
                    <div>
                      {group.options.map((option) => {
                        const selected = selectedModifiers[group.id]?.includes(option.name) ?? false;
                        return (
                          <Button key={option.name} variant="outline" aria-pressed={selected} onClick={() => toggleModifier(group.id, option.name, group.multi_select)}>
                            <span>{option.name}</span>{option.price > 0 && <small>+{money(option.price)}</small>}{selected && <Check />}
                          </Button>
                        );
                      })}
                    </div>
                  </fieldset>
                ))}
                {(customization?.addOns.length ?? 0) > 0 && (
                  <fieldset>
                    <legend>Add-ons <span>Optional</span></legend>
                    <div>
                      {customization?.addOns.map((addOn) => {
                        const selected = selectedAddOns.includes(addOn.name);
                        return (
                          <Button key={addOn.id} variant="outline" aria-pressed={selected} onClick={() => setSelectedAddOns((current) => selected ? current.filter((name) => name !== addOn.name) : [...current, addOn.name])}>
                            <span>{addOn.name}</span><small>+{money(addOn.price)}</small>{selected && <Check />}
                          </Button>
                        );
                      })}
                    </div>
                  </fieldset>
                )}
                <label className="editorial-notes">Product Notes<textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Add preparation notes" /></label>
              </div>
            )}
            <div className="editorial-drawer__footer">
              <div className="editorial-stepper editorial-stepper--large">
                <Button variant="ghost" size="icon" onClick={() => setQuantity((value) => Math.max(1, value - 1))} aria-label="Decrease quantity"><Minus /></Button>
                <span>{quantity}</span>
                <Button variant="ghost" size="icon" onClick={() => setQuantity((value) => value + 1)} aria-label="Increase quantity"><Plus /></Button>
              </div>
              <Button className="editorial-primary" disabled={!requiredComplete || customizationLoading} onClick={saveProduct}>
                {editingLineId ? "Update Product" : "Add Product"} · {money((selectedProduct.price.amount + modifierTotal) * quantity)}
              </Button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default OrdersEditorial;