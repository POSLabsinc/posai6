import { useState, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate, useParams } from "react-router-dom";
import Settings from "@/pages/Settings";
import AddProductContent from "@/components/settings/AddProductContent";
import { supabase } from "@/integrations/supabase/client";

const EditProductRoute = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [initialData, setInitialData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      const { data, error } = await (supabase as any)
        .from('products')
        .select('*, categories(name), product_variants(*)')
        .eq('id', id)
        .single();
      if (data) {
        setInitialData({
          name: data.name ?? '',
          description: data.description ?? '',
          category: data.categories?.name ?? '',
          price: Number(data.price),
          priceType: data.price_type as 'fixed' | 'open',
          sku: data.sku ?? '',
          imageUrl: data.image_url ?? undefined,
          active: data.active,
          dineIn: data.dine_in,
          takeaway: data.takeaway,
          delivery: data.delivery,
          addToMenu: true,
          outOfStock: data.out_of_stock,
          inventoryTracking: data.inventory_tracking,
          negativeInventory: data.negative_inventory,
          modifiers: [],
          addOns: [],
          taxes: [],
          discounts: [],
        });
      }
      if (error) console.error("Failed to fetch product", error);
      setLoading(false);
    };
    fetchProduct();
  }, [id]);

  if (isMobile) {
    if (loading) return <div className="h-full flex items-center justify-center text-muted-foreground">Loading...</div>;
    if (!initialData) return <div className="h-full flex items-center justify-center text-muted-foreground">Product not found</div>;

    return (
      <AddProductContent
        onBack={() => navigate("/settings/menu/products")}
        initialData={initialData}
        editId={id}
      />
    );
  }

  return <Settings />;
};

export default EditProductRoute;
