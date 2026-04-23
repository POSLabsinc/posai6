import { useState, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, AlertTriangle, Save, Search, Mic } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import inventoryIcon from "@/assets/icons/menu-inventory.png";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface InventoryContentProps {
  showHeader?: boolean;
  onBack?: () => void;
  onAIClick?: () => void;
}

interface ProductInventory {
  id: string;
  name: string;
  sku: string | null;
  price: number;
  category_id: string;
  category_name: string;
  stock_count: number | null;
  is_available: boolean;
  variants: VariantInventory[];
  product_code: string;
}

const generateProductCode = (categoryName: string, productName: string, index: number): string => {
  const catPrefix = categoryName.replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase() || 'GEN';
  const prodPrefix = productName.replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase() || 'PRD';
  const numPart = String(index + 1).padStart(4, '0');
  return `${catPrefix}-${prodPrefix}-${numPart}`;
};

interface VariantInventory {
  id: string;
  variant_name: string;
  price: number;
  sku: string | null;
}

const InventoryContent = ({ showHeader = true, onBack, onAIClick }: InventoryContentProps) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [products, setProducts] = useState<ProductInventory[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedStock, setSelectedStock] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [{ data: prods }, { data: cats }, { data: variants }] = await Promise.all([
        supabase.from("products").select("id, name, sku, price, category_id, stock_count, is_available").eq("archived", false).eq("active", true).order("name"),
        supabase.from("categories").select("id, name").eq("active", true).order("name"),
        supabase.from("product_variants").select("id, variant_name, price, sku, product_id").order("sort_order"),
      ]);

      const catMap: Record<string, string> = {};
      (cats || []).forEach((c) => { catMap[c.id] = c.name; });
      setCategories(cats || []);

      const variantMap: Record<string, VariantInventory[]> = {};
      (variants || []).forEach((v) => {
        if (!variantMap[v.product_id]) variantMap[v.product_id] = [];
        variantMap[v.product_id].push({ id: v.id, variant_name: v.variant_name, price: v.price, sku: v.sku });
      });

      const mappedProducts = (prods || []).map((p, idx) => {
        const catName = catMap[p.category_id] || "Uncategorized";
        return {
          ...p,
          category_name: catName,
          variants: variantMap[p.id] || [],
          product_code: generateProductCode(catName, p.name, idx),
        };
      });
      setProducts(mappedProducts);
      setLoading(false);
    };
    fetchData();
  }, []);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (selectedCategory !== "all" && p.category_id !== selectedCategory) return false;
      if (selectedStock === "in-stock" && (p.stock_count === null || p.stock_count <= 0)) return false;
      if (selectedStock === "out-of-stock" && p.stock_count !== 0 && p.is_available) return false;
      return true;
    });
  }, [products, selectedStock, selectedCategory, searchQuery]);

  const stockCount = useMemo(() => products.length, [products]);
  const categoryCount = useMemo(() => categories.length, [categories]);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const headerBlock = showHeader && (
    <div className="flex items-center justify-between pt-0 pb-2 relative overflow-visible px-4">
      {onBack && (
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-neutral-800/60 flex items-center justify-center active:opacity-70 transition-opacity" aria-label="Back">
          <ChevronLeft className="w-5 h-5 text-foreground" />
        </button>
      )}
      {!onBack && <div className="w-8 h-8" />}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1.5">
        <h1 className="text-xl font-semibold text-foreground">Inventory</h1>
      </div>
    </div>
  );

  const content = (
    <div className="flex-1 overflow-y-auto scrollbar-hide px-4 md:px-6 pb-28 pt-0">
      {/* Description */}
      <div className="mt-4 mb-4 px-1">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Enter physical counts to record inventory adjustments. Variances are calculated automatically.
        </p>
      </div>

      {/* Search + Filters row */}
      <section className="mt-6 flex items-center gap-3 mb-6">
        <div className="flex-1 min-w-0 rounded-full bg-neutral-800/60 px-5 py-3 flex items-center gap-3">
          <Search className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 min-w-0 bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-[15px]"
          />
          <Mic className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
        </div>

        <Select value={selectedStock} onValueChange={setSelectedStock}>
          <SelectTrigger className="w-auto min-w-[140px] rounded-full bg-neutral-800/60 border-0 text-foreground text-sm h-11 px-4 focus:ring-0">
            <SelectValue placeholder="All Stock" />
          </SelectTrigger>
          <SelectContent className="bg-neutral-800 border-neutral-700 z-[9999]">
            <SelectItem value="all" className="text-foreground focus:bg-neutral-700 focus:text-foreground">All Stock ({stockCount})</SelectItem>
            <SelectItem value="in-stock" className="text-foreground focus:bg-neutral-700 focus:text-foreground">In Stock</SelectItem>
            <SelectItem value="out-of-stock" className="text-foreground focus:bg-neutral-700 focus:text-foreground">Out of Stock</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-auto min-w-[160px] rounded-full bg-neutral-800/60 border-0 text-foreground text-sm h-11 px-4 focus:ring-0">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent className="bg-neutral-800 border-neutral-700 z-[9999]">
            <SelectItem value="all" className="text-foreground focus:bg-neutral-700 focus:text-foreground">All Categories ({categoryCount})</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id} className="text-foreground focus:bg-neutral-700 focus:text-foreground">{cat.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </section>

      {/* Table */}
      <section className="rounded-2xl bg-neutral-800/60 overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[1.2fr_0.8fr_0.7fr_0.6fr_100px_24px] items-center px-6 py-4 border-b border-neutral-700/50">
          <span className="text-sm font-semibold text-foreground">Product Name</span>
          <span className="text-sm font-semibold text-foreground text-center">Product Code</span>
          <span className="text-sm font-semibold text-foreground text-center">SKU</span>
          <span className="text-sm font-semibold text-foreground text-center">Variant</span>
          <span className="text-sm font-semibold text-foreground text-right">Price</span>
          <span />
        </div>

        {loading ? (
          <div className="px-8 py-10 text-center text-muted-foreground">Loading inventory...</div>
        ) : filtered.length > 0 ? (
          filtered.map((product, index) => (
            <div key={product.id}>
              {index > 0 && <div className="h-px bg-neutral-700/50" />}
              {/* Product Row */}
              <button
                onClick={() => toggleExpand(product.id)}
                className="grid grid-cols-[1.2fr_0.8fr_0.7fr_0.6fr_100px_24px] items-center px-6 py-4 w-full hover:bg-neutral-700/30 transition-colors text-left"
              >
                <span className="text-[15px] text-foreground">{product.name}</span>
                <span className="text-[13px] text-muted-foreground text-center font-mono">{product.product_code}</span>
                <span className="text-[15px] text-muted-foreground text-center">{product.sku || "—"}</span>
                <span className="text-[15px] text-muted-foreground text-center">{product.variants.length}</span>
                <span className="text-[15px] text-foreground text-right">£{product.price.toFixed(2)}</span>
                {expandedId === product.id ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground justify-self-end" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground justify-self-end" />
                )}
              </button>

              {/* Expanded Details */}
              {expandedId === product.id && (
                <div className="bg-amber-500/5 border-t border-neutral-700/30">
                  {/* Sub-header */}
                  <div className="grid grid-cols-[1.2fr_0.8fr_0.8fr_100px] items-center px-6 py-3 pl-12 border-b border-neutral-700/20">
                    <span className="text-xs font-medium text-muted-foreground">Variant</span>
                    <span className="text-xs font-medium text-muted-foreground text-center">PAR</span>
                    <span className="text-xs font-medium text-muted-foreground text-center">Stock on Hand</span>
                    <span className="text-xs font-medium text-muted-foreground text-right">Adjustment</span>
                  </div>

                  {product.variants.length > 0 ? (
                    product.variants.map((variant, vIdx) => (
                      <div key={variant.id}>
                        {vIdx > 0 && <div className="h-px bg-neutral-700/20 ml-12 mr-6" />}
                        <div className="grid grid-cols-[1.2fr_0.8fr_0.8fr_100px] items-center px-6 py-3 pl-12">
                          <div className="flex items-center gap-2">
                            <span className="text-[15px] text-foreground">{variant.variant_name}</span>
                            <AlertTriangle className="h-4 w-4 text-amber-400" />
                          </div>
                          <span className="text-[15px] text-muted-foreground text-center">0</span>
                          <span className="text-[15px] text-muted-foreground text-center">0</span>
                          <span className="text-[15px] text-foreground text-right">0</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="grid grid-cols-[1.2fr_0.8fr_0.8fr_100px] items-center px-6 py-3 pl-12">
                      <div className="flex items-center gap-2">
                        <span className="text-[15px] text-foreground">Default</span>
                        <AlertTriangle className="h-4 w-4 text-amber-400" />
                      </div>
                      <span className="text-[15px] text-muted-foreground text-center">0</span>
                      <span className="text-[15px] text-muted-foreground text-center">{product.stock_count ?? 0}</span>
                      <span className="text-[15px] text-foreground text-right">0</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="px-8 py-10 text-center text-muted-foreground">No products found</div>
        )}
      </section>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      {headerBlock}
      {content}
    </div>
  );
};

export default InventoryContent;
