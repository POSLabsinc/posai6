import { useState, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate, useParams } from "react-router-dom";
import Settings from "@/pages/Settings";
import AddAddOnContent from "@/components/settings/AddAddOnContent";
import { supabase } from "@/integrations/supabase/client";

const EditAddOnRoute = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [editData, setEditData] = useState<{ id: string; name: string; price: number; active: boolean } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAddOn = async () => {
      if (!id) return;
      const { data, error } = await supabase.from("add_ons").select("id, name, price, active").eq("id", id).single();
      if (data) setEditData(data);
      if (error) console.error("Failed to fetch add-on", error);
      setLoading(false);
    };
    fetchAddOn();
  }, [id]);

  const handleSave = async (data: any) => {
    if (!id) return;
    const { error } = await supabase.from("add_ons").update({
      name: data.name,
      price: data.hasOptions && data.options.length > 0 ? parseFloat(data.options[0].price || "0") : 0,
      active: data.canBeServed,
    }).eq("id", id);
    if (error) console.error("Failed to update add-on", error);
  };

  if (isMobile) {
    if (loading) return <div className="h-full flex items-center justify-center text-muted-foreground">Loading...</div>;
    if (!editData) return <div className="h-full flex items-center justify-center text-muted-foreground">Add-on not found</div>;

    return (
      <AddAddOnContent
        onBack={() => navigate("/settings/menu/add-ons")}
        onSave={handleSave}
        editData={editData}
      />
    );
  }

  return <Settings />;
};

export default EditAddOnRoute;
