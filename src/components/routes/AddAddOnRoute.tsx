import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";
import Settings from "@/pages/Settings";
import AddAddOnContent from "@/components/settings/AddAddOnContent";
import { supabase } from "@/integrations/supabase/client";

const AddAddOnRoute = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  const handleSave = async (data: any) => {
    const { error } = await supabase.from("add_ons").insert({
      name: data.name,
      price: data.hasOptions && data.options.length > 0 ? parseFloat(data.options[0].price || "0") : 0,
      active: true,
    });
    if (error) console.error("Failed to insert add-on", error);
  };

  if (isMobile) {
    return (
      <AddAddOnContent
        onBack={() => navigate("/settings/menu/add-ons")}
        onSave={handleSave}
      />
    );
  }

  return <Settings />;
};

export default AddAddOnRoute;
