import { useState, useRef, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Camera,
  X,
  Plus,
  Trash2,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { MultiSelectSheet } from "@/components/ui/multi-select-sheet";
import { toast } from "@/hooks/use-toast";
import { CustomProduct } from "@/lib/productStore";
import { useAllCategoryNames } from "@/hooks/useMenuDbHooks";
import { createProduct, updateProduct, ProductVariant } from "@/services/productService";

interface AddProductContentProps {
  onBack: () => void;
  initialData?: Partial<CustomProduct>;
  editId?: string;
}

const generateId = () =>
  `cp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

const SectionHeader = ({ title }: { title: string }) => (
  <div className="mb-2 px-1">
    <span className="text-[hsl(var(--text-subtle))] text-sm font-medium tracking-wide">
      {title}
    </span>
  </div>
);

const Divider = () => (
  <div className="h-px bg-neutral-700/50 mx-4" />
);

const AddProductContent = ({ onBack, initialData, editId }: AddProductContentProps) => {
  // ── Basic Info ──────────────────────────────────────────────────────
  const [name, setName] = useState(initialData?.name ?? "");
  const [menuDisplayName, setMenuDisplayName] = useState("");
  const [printerName, setPrinterName] = useState("");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [category, setCategory] = useState(initialData?.category ?? "");
  const [imageUrl, setImageUrl] = useState<string | undefined>(initialData?.imageUrl);
  const [newCategoryInput, setNewCategoryInput] = useState("");
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [showCategorySheet, setShowCategorySheet] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // ── Pricing ─────────────────────────────────────────────────────────
  const [priceType] = useState<"fixed" | "open">(
    initialData?.priceType ?? "fixed"
  );
  const [price, setPrice] = useState(
    initialData?.price ? String(initialData.price) : ""
  );

  // ── Variants ────────────────────────────────────────────────────────
  const [variants, setVariants] = useState<Omit<ProductVariant, 'product_id' | 'created_at' | 'updated_at'>[]>([
    {
      id: crypto.randomUUID(),
      variant_name: '',
      sku: '',
      price: 0,
      adjusted_price: 0,
      timed_price_enabled: false,
      timed_price: 0,
      timed_price_start: null,
      timed_price_end: null,
      sort_order: 0
    }
  ]);

  // ── Modifiers ────────────────────────────────────────────────────────
  const [modifiers, setModifiers] = useState<string[]>(initialData?.modifiers ?? []);
  const [addOns, setAddOns] = useState<string[]>(initialData?.addOns ?? []);
  const [defaultModifiers, setDefaultModifiers] = useState<string[]>([]);
  const [showModifiersSheet, setShowModifiersSheet] = useState(false);
  const [showAddOnsSheet, setShowAddOnsSheet] = useState(false);
  const [showDefaultModifiersSheet, setShowDefaultModifiersSheet] = useState(false);

  // ── Printers ─────────────────────────────────────────────────────────
  const [assignedPrinters, setAssignedPrinters] = useState<string[]>([]);
  const [showPrintersSheet, setShowPrintersSheet] = useState(false);

  // ── Availability ─────────────────────────────────────────────────────
  const [active, setActive] = useState(initialData?.active ?? true);
  const [outOfStock, setOutOfStock] = useState(initialData?.outOfStock ?? false);
  const [dineIn, setDineIn] = useState(initialData?.dineIn ?? true);
  const [takeaway, setTakeaway] = useState(initialData?.takeaway ?? true);
  const [delivery, setDelivery] = useState(initialData?.delivery ?? false);
  const [addToMenu, setAddToMenu] = useState(initialData?.addToMenu ?? true);

  // ── Inventory ────────────────────────────────────────────────────────
  const [sku, setSku] = useState(initialData?.sku ?? "");
  const [inventoryTracking] = useState(
    initialData?.inventoryTracking ?? false
  );
  const [negativeInventory, setNegativeInventory] = useState(
    initialData?.negativeInventory ?? false
  );

  // ── Tax / Discount ───────────────────────────────────────────────────
  const [taxes, setTaxes] = useState<string[]>(initialData?.taxes ?? []);
  const [discounts, setDiscounts] = useState<string[]>(initialData?.discounts ?? []);
  const [showTaxSheet, setShowTaxSheet] = useState(false);
  const [showDiscountSheet, setShowDiscountSheet] = useState(false);

  // ── Errors ────────────────────────────────────────────────────────────
  const [nameError, setNameError] = useState("");
  const [categoryError, setCategoryError] = useState("");

  // ── Derived data ─────────────────────────────────────────────────────
  const existingCategories = useAllCategoryNames();

  // ── Image upload ─────────────────────────────────────────────────────
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setImageUrl(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("") || "NA";

  // ── Validation & Save ─────────────────────────────────────────────────
  const validate = useCallback((): boolean => {
    let valid = true;
    if (!name.trim()) {
      setNameError("Product name is required");
      valid = false;
    } else {
      setNameError("");
    }
    const resolvedCategory = showNewCategory ? newCategoryInput.trim() : category;
    if (!resolvedCategory) {
      setCategoryError("Category is required");
      valid = false;
    } else {
      setCategoryError("");
    }
    return valid;
  }, [name, category, newCategoryInput, showNewCategory]);

  const isValid = name.trim() && (showNewCategory ? newCategoryInput.trim() : category);

  const handleSave = async () => {
    if (!validate()) return false;

    const resolvedCategory = showNewCategory ? newCategoryInput.trim() : category;
    
    // Base product data
    const productData = {
      name: name.trim(),
      description: description.trim(),
      category: resolvedCategory,
      categoryId: "", // Will be resolved by the service layer
      price: parseFloat(price) || 0,
      priceType,
      minPrice: undefined,
      maxPrice: undefined,
      sku: sku.trim() || name.trim().toUpperCase().replace(/\s+/g, "-"),
      imageUrl,
      active,
      dineIn: dineIn,
      takeaway,
      delivery,
      addToMenu,
      outOfStock,
      inventoryTracking,
      negativeInventory,
      modifiers,
      addOns,
      taxes,
      discounts,
      isCustom: true as const,
    };

    try {
      if (editId) {
        // We're passing variants but updateProduct logic for variants handles re-creation
        // We need to cast our local variant type to the one expected by updateProduct (which expects ProductVariant including product_id)
        // Since we are re-creating them, product_id will be set in the service.
        // But for type safety let's map it.
        await updateProduct(editId, productData, variants.map(v => ({
          ...v,
          product_id: editId,
          created_at: new Date().toISOString(), // Mocking for type, not used in insert
          updated_at: new Date().toISOString()
        })) as ProductVariant[]);
        
        toast({
          title: "Product updated",
          description: `"${name}" has been updated successfully.`,
          duration: 3000,
        });
      } else {
        await createProduct(productData, variants);
        
        toast({
          title: "Product added",
          description: `"${name}" has been added successfully.`,
          duration: 3000,
        });
      }
      return true;
    } catch (error) {
      console.error("Error saving product:", error);
      toast({
        title: "Error saving product",
        description: "There was a problem saving your product. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  const hasData = name.trim() || description.trim() || category || price || modifiers.length > 0 || addOns.length > 0 || variants.some(v => v.variant_name || v.sku || v.price > 0);

  const handleBackWithSave = async () => {
    if (!hasData) {
      onBack();
      return;
    }
    if (!name.trim()) {
      toast({ title: "Product name is required", variant: "destructive", duration: 2000 });
      return;
    }
    const resolvedCat = showNewCategory ? newCategoryInput.trim() : category;
    if (!resolvedCat) {
      toast({ title: "Category is required", variant: "destructive", duration: 2000 });
      return;
    }
    if (await handleSave()) {
      onBack();
    }
  };

  const formatList = (items: string[], placeholder: string) => {
    if (items.length === 0) return placeholder;
    if (items.length === 1) return items[0];
    return `${items.length} selected`;
  };

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="h-full flex flex-col overflow-hidden bg-background">
      {/* ── Header ── */}
      <div className="flex items-center py-4 px-4 relative flex-shrink-0">
        <button
          onClick={handleBackWithSave}
          className="w-10 h-10 rounded-full bg-neutral-800/60 flex items-center justify-center active:opacity-70 transition-opacity"
        >
          <ChevronLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="flex-1 text-center text-lg font-semibold text-foreground pr-10">
          {editId ? "Edit Product" : "Add Product"}
        </h1>
      </div>

      {/* ── Scrollable Body ── */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-4 pb-8 pt-4">

        {/* ── Product Image ── */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <button
              onClick={() => imageInputRef.current?.click()}
              className="w-24 h-24 rounded-full overflow-hidden bg-[hsl(var(--surface-2))] flex items-center justify-center active:opacity-80 transition-opacity"
            >
              {imageUrl ? (
                <img src={imageUrl} alt="Product" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-semibold text-[hsl(var(--text-subtle))]">{initials}</span>
              )}
            </button>
            {/* Camera badge */}
            <button
              onClick={() => imageInputRef.current?.click()}
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-neutral-800 border-2 border-background flex items-center justify-center active:opacity-70"
            >
              <Camera className="w-3.5 h-3.5 text-foreground" />
            </button>
            {/* Remove image */}
            {imageUrl && (
              <button
                onClick={() => setImageUrl(undefined)}
                className="absolute top-0 right-0 w-6 h-6 rounded-full bg-neutral-700 flex items-center justify-center active:opacity-70"
              >
                <X className="w-3 h-3 text-foreground" />
              </button>
            )}
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
          </div>
        </div>

        {/* ── Product Information ── */}
        <SectionHeader title="Product Information" />
        <div className="bg-[#26262699] rounded-2xl overflow-hidden mb-5">
          {/* Product Name */}
          <div className="flex items-center justify-between py-4 px-4">
            <span className="text-foreground text-base font-medium flex-shrink-0">Product Name</span>
            <div className="flex items-center gap-1 flex-1 justify-end ml-4">
              <input
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); if (e.target.value) setNameError(""); }}
                placeholder=""
                className="bg-transparent text-right text-foreground placeholder:text-[hsl(var(--text-subtle))] outline-none text-base w-full"
              />
              <ChevronRight className="w-4 h-4 text-[hsl(var(--text-subtle))] flex-shrink-0" />
            </div>
          </div>
          {nameError && <p className="text-red-400 text-xs px-4 pb-2">{nameError}</p>}

          <Divider />

          {/* Menu Display Name */}
          <div className="flex items-center justify-between py-4 px-4">
            <span className="text-foreground text-base font-medium flex-shrink-0">Menu Display Name</span>
            <div className="flex items-center gap-1 flex-1 justify-end ml-4">
              <input
                type="text"
                value={menuDisplayName}
                onChange={(e) => setMenuDisplayName(e.target.value)}
                placeholder=""
                className="bg-transparent text-right text-foreground placeholder:text-[hsl(var(--text-subtle))] outline-none text-base w-full"
              />
              <ChevronRight className="w-4 h-4 text-[hsl(var(--text-subtle))] flex-shrink-0" />
            </div>
          </div>

          <Divider />

          {/* Assigned Printers */}
          <button
            className="w-full flex items-center justify-between py-4 px-4 active:opacity-70 transition-opacity"
            onClick={() => setShowPrintersSheet(true)}
          >
            <span className="text-foreground text-base font-medium">Assigned Printers</span>
            <div className="flex items-center gap-1">
              <span className="text-[hsl(var(--text-subtle))] text-base">
                {formatList(assignedPrinters, "Select Printers")}
              </span>
              <ChevronRight className="w-4 h-4 text-[hsl(var(--text-subtle))]" />
            </div>
          </button>

          <Divider />

          {/* Printer Name */}
          <div className="flex items-center justify-between py-4 px-4">
            <span className="text-foreground text-base font-medium flex-shrink-0">Printer Name</span>
            <div className="flex items-center gap-1 flex-1 justify-end ml-4">
              <input
                type="text"
                value={printerName}
                onChange={(e) => setPrinterName(e.target.value)}
                placeholder=""
                className="bg-transparent text-right text-foreground placeholder:text-[hsl(var(--text-subtle))] outline-none text-base w-full"
              />
              <ChevronRight className="w-4 h-4 text-[hsl(var(--text-subtle))] flex-shrink-0" />
            </div>
          </div>

          <Divider />

          {/* Category */}
          <button
            className="w-full flex items-center justify-between py-4 px-4 active:opacity-70 transition-opacity"
            onClick={() => setShowCategorySheet(true)}
          >
            <span className="text-foreground text-base font-medium">Category</span>
            <div className="flex items-center gap-1">
              <span className="text-[hsl(var(--text-subtle))] text-base">
                {category || "Select Categories"}
              </span>
              <ChevronRight className="w-4 h-4 text-[hsl(var(--text-subtle))]" />
            </div>
          </button>
          {categoryError && <p className="text-red-400 text-xs px-4 pb-2">{categoryError}</p>}
        </div>

        {/* ── Modifier Groups ── */}
        <SectionHeader title="Modifier Groups" />
        <div className="bg-[#26262699] rounded-2xl overflow-hidden mb-5">
          <button
            className="w-full flex items-center justify-between py-4 px-4 active:opacity-70 transition-opacity"
            onClick={() => setShowModifiersSheet(true)}
          >
            <span className="text-foreground text-base font-medium">Modifiers</span>
            <div className="flex items-center gap-1">
              <span className="text-[hsl(var(--text-subtle))] text-base">
                {formatList(modifiers, "Select Modifiers")}
              </span>
              <ChevronRight className="w-4 h-4 text-[hsl(var(--text-subtle))]" />
            </div>
          </button>
          <Divider />
          <button
            className="w-full flex items-center justify-between py-4 px-4 active:opacity-70 transition-opacity"
            onClick={() => setShowAddOnsSheet(true)}
          >
            <span className="text-foreground text-base font-medium">AddOns</span>
            <div className="flex items-center gap-1">
              <span className="text-[hsl(var(--text-subtle))] text-base">
                {formatList(addOns, "Select AddOns")}
              </span>
              <ChevronRight className="w-4 h-4 text-[hsl(var(--text-subtle))]" />
            </div>
          </button>
        </div>

        {/* ── Description ── */}
        <SectionHeader title="Description" />
        <div className="bg-[#26262699] rounded-2xl overflow-hidden mb-1">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter Description"
            maxLength={1000}
            rows={3}
            className="w-full bg-transparent px-4 py-4 text-foreground placeholder:text-[hsl(var(--text-subtle))] outline-none text-base resize-none"
          />
        </div>
        <p className="text-[hsl(var(--text-subtle))] text-sm px-1 mt-1 mb-5">
          Maximum 1000 characters
        </p>

        {/* ── Add to Menu / 86 Product ── */}
        <div className="bg-[#26262699] rounded-2xl overflow-hidden mb-5">
          <div className="flex items-center justify-between py-4 px-4">
            <span className="text-foreground text-base font-medium">Add to Menu?</span>
            <Switch checked={addToMenu} onCheckedChange={setAddToMenu} />
          </div>
          <Divider />
          <div className="flex items-center justify-between py-4 px-4">
            <span className="text-foreground text-base font-medium">86 this Product</span>
            <Switch checked={outOfStock} onCheckedChange={setOutOfStock} />
          </div>
        </div>

        {/* ── Negative Inventory ── */}
        <div className="bg-[#26262699] rounded-2xl overflow-hidden mb-5">
          <div className="flex items-center justify-between py-4 px-4">
            <span className="text-foreground text-base font-medium">Negative Inventory</span>
            <Switch checked={negativeInventory} onCheckedChange={setNegativeInventory} />
          </div>
        </div>

        {/* ── Variant Table ── */}
        <div className="bg-[#26262699] rounded-2xl overflow-hidden mb-1">
          <div className="grid grid-cols-[1.5fr_1fr_1fr_1.2fr_1fr_auto] items-center px-4 py-3 border-b border-neutral-700/30 gap-2">
            <span className="text-foreground text-xs font-semibold">Variant Name</span>
            <span className="text-foreground text-xs font-semibold">SKU</span>
            <span className="text-foreground text-xs font-semibold">Price</span>
            <span className="text-foreground text-xs font-semibold">Adjusted Price</span>
            <span className="text-foreground text-xs font-semibold text-right">Timed Price</span>
            <span className="w-8"></span>
          </div>
          
          {variants.map((variant, index) => (
            <div key={variant.id} className="grid grid-cols-[1.5fr_1fr_1fr_1.2fr_1fr_auto] items-center px-4 py-3 border-b border-neutral-700/30 last:border-0 gap-2">
              <input
                type="text"
                value={variant.variant_name}
                onChange={(e) => {
                  const newVariants = [...variants];
                  newVariants[index].variant_name = e.target.value;
                  setVariants(newVariants);
                }}
                placeholder="Variant Name"
                className="bg-transparent text-[hsl(var(--text-subtle))] text-sm outline-none w-full placeholder:text-neutral-600"
              />
              <input
                type="text"
                value={variant.sku}
                onChange={(e) => {
                  const newVariants = [...variants];
                  newVariants[index].sku = e.target.value;
                  setVariants(newVariants);
                }}
                placeholder="SKU"
                className="bg-transparent text-[hsl(var(--text-subtle))] text-sm outline-none w-full placeholder:text-neutral-600"
              />
              <div className="flex items-center text-[hsl(var(--text-subtle))] text-sm">
                <span>$</span>
                <input
                  type="number"
                  value={variant.price || ''}
                  onChange={(e) => {
                    const newVariants = [...variants];
                    newVariants[index].price = parseFloat(e.target.value) || 0;
                    setVariants(newVariants);
                  }}
                  placeholder="0.00"
                  className="bg-transparent outline-none w-full ml-1 placeholder:text-neutral-600"
                />
              </div>
              <div className="flex items-center text-[hsl(var(--text-subtle))] text-sm">
                <span>$</span>
                <input
                  type="number"
                  value={variant.adjusted_price || ''}
                  onChange={(e) => {
                    const newVariants = [...variants];
                    newVariants[index].adjusted_price = parseFloat(e.target.value) || 0;
                    setVariants(newVariants);
                  }}
                  placeholder="0.00"
                  className="bg-transparent outline-none w-full ml-1 placeholder:text-neutral-600"
                />
              </div>
              <div className="flex items-center justify-end text-[hsl(var(--text-subtle))] text-sm">
                <input
                  type="number"
                  value={variant.timed_price || ''}
                  onChange={(e) => {
                    const newVariants = [...variants];
                    newVariants[index].timed_price = parseFloat(e.target.value) || 0;
                    setVariants(newVariants);
                  }}
                  placeholder="Choose"
                  className="bg-transparent outline-none w-full text-right placeholder:text-neutral-600"
                />
              </div>
              <button
                onClick={() => {
                  if (variants.length > 1) {
                    setVariants(variants.filter((_, i) => i !== index));
                  }
                }}
                className={`w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-700/50 transition-colors ${variants.length <= 1 ? 'opacity-0 pointer-events-none' : ''}`}
              >
                <Trash2 className="w-4 h-4 text-red-400" />
              </button>
            </div>
          ))}
          
          <button
            onClick={() => setVariants([...variants, {
              id: crypto.randomUUID(),
              variant_name: '',
              sku: '',
              price: 0,
              adjusted_price: 0,
              timed_price_enabled: false,
              timed_price: 0,
              timed_price_start: null,
              timed_price_end: null,
              sort_order: variants.length
            }])}
            className="w-full py-3 flex items-center justify-center text-primary gap-2 hover:bg-white/5 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium">Add Variant</span>
          </button>
        </div>
        <div className="mb-5" />

        {/* ── Product Settings ── */}
        <SectionHeader title="Product Settings" />
        <div className="bg-[#26262699] rounded-2xl overflow-hidden mb-5">
          <button
            className="w-full flex items-center justify-between py-4 px-4 active:opacity-70 transition-opacity"
            onClick={() => setShowDefaultModifiersSheet(true)}
          >
            <span className="text-foreground text-base font-medium">Default Modifiers</span>
            <div className="flex items-center gap-1">
              <span className="text-[hsl(var(--text-subtle))] text-base">
                {formatList(defaultModifiers, "Select Default Modifiers")}
              </span>
              <ChevronRight className="w-4 h-4 text-[hsl(var(--text-subtle))]" />
            </div>
          </button>
          <Divider />
          <button
            className="w-full flex items-center justify-between py-4 px-4 active:opacity-70 transition-opacity"
            onClick={() => setShowTaxSheet(true)}
          >
            <span className="text-foreground text-base font-medium">Taxes</span>
            <div className="flex items-center gap-1">
              <span className="text-[hsl(var(--text-subtle))] text-base">
                {formatList(taxes, "Select Taxes")}
              </span>
              <ChevronRight className="w-4 h-4 text-[hsl(var(--text-subtle))]" />
            </div>
          </button>
          <Divider />
          <button
            className="w-full flex items-center justify-between py-4 px-4 active:opacity-70 transition-opacity"
            onClick={() => setShowDiscountSheet(true)}
          >
            <span className="text-foreground text-base font-medium">Discounts</span>
            <div className="flex items-center gap-1">
              <span className="text-[hsl(var(--text-subtle))] text-base">
                {formatList(discounts, "Select Discounts")}
              </span>
              <ChevronRight className="w-4 h-4 text-[hsl(var(--text-subtle))]" />
            </div>
          </button>
        </div>

      </div>

      {/* ── Sheets ── */}
      <MultiSelectSheet
        isOpen={showCategorySheet}
        onClose={(selected) => {
          if (selected[0]) setCategory(selected[0]);
          setShowCategorySheet(false);
        }}
        title="Select Category"
        options={existingCategories}
        initialSelected={category ? [category] : []}
        singleSelect
      />

      <MultiSelectSheet
        isOpen={showPrintersSheet}
        onClose={(selected) => { setAssignedPrinters(selected); setShowPrintersSheet(false); }}
        title="Select Printers"
        options={["Kitchen Printer", "Bar Printer", "Receipt Printer", "Label Printer"]}
        initialSelected={assignedPrinters}
      />

      <MultiSelectSheet
        isOpen={showModifiersSheet}
        onClose={(selected) => { setModifiers(selected); setShowModifiersSheet(false); }}
        title="Select Modifiers"
        options={["Size", "Spice Level", "Cooking Style", "Sauce", "Temperature", "Extra Cheese", "No Onions"]}
        initialSelected={modifiers}
      />

      <MultiSelectSheet
        isOpen={showAddOnsSheet}
        onClose={(selected) => { setAddOns(selected); setShowAddOnsSheet(false); }}
        title="Select AddOns"
        options={["Extra Shot", "Whipped Cream", "Syrup", "Oat Milk", "Almond Milk", "Bacon", "Avocado"]}
        initialSelected={addOns}
      />

      <MultiSelectSheet
        isOpen={showDefaultModifiersSheet}
        onClose={(selected) => { setDefaultModifiers(selected); setShowDefaultModifiersSheet(false); }}
        title="Select Default Modifiers"
        options={["Size", "Spice Level", "Cooking Style", "Sauce", "Temperature", "Extra Cheese", "No Onions"]}
        initialSelected={defaultModifiers}
      />

      <MultiSelectSheet
        isOpen={showTaxSheet}
        onClose={(selected) => { setTaxes(selected); setShowTaxSheet(false); }}
        title="Select Taxes"
        options={["GST (10%)", "VAT (20%)", "Sales Tax (8.25%)", "Service Tax (5%)"]}
        initialSelected={taxes}
      />

      <MultiSelectSheet
        isOpen={showDiscountSheet}
        onClose={(selected) => { setDiscounts(selected); setShowDiscountSheet(false); }}
        title="Select Discounts"
        options={["Happy Hour", "Staff Discount", "Loyalty Member", "Seasonal Promo"]}
        initialSelected={discounts}
      />
    </div>
  );
};

export default AddProductContent;
