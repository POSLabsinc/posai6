import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";
import Settings from "@/pages/Settings";
import AddProductContent from "@/components/settings/AddProductContent";

const AddProductRoute = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  if (isMobile) {
    return (
      <AddProductContent onBack={() => navigate('/settings/menu/products')} />
    );
  }

  return <Settings />;
};

export default AddProductRoute;
