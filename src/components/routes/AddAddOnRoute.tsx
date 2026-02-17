import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";
import Settings from "@/pages/Settings";
import AddAddOnContent from "@/components/settings/AddAddOnContent";

const AddAddOnRoute = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  const handleSave = (data: any) => {
    const stored = localStorage.getItem("addons-settings");
    let addOns = [];
    try {
      addOns = stored ? JSON.parse(stored) : [];
    } catch (e) {}

    const newAddOn = {
      id: Date.now().toString(),
      name: data.name,
      type: "Regular",
      selectedOptions: data.hasOptions ? data.options.length : 0,
      price: data.hasOptions && data.options.length > 0 ? parseFloat(data.options[0].price || "0") : 0,
      archived: false,
    };

    addOns.push(newAddOn);
    localStorage.setItem("addons-settings", JSON.stringify(addOns));
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
