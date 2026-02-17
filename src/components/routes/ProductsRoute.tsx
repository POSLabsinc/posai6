import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";
import Settings from "@/pages/Settings";
import ProductsContent from "@/components/settings/ProductsContent";

const ProductsRoute = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  
  if (isMobile) {
    return (
      <ProductsContent showHeader={true} onBack={() => navigate('/settings/menu')} />
    );
  }
  
  return <Settings />;
};

export default ProductsRoute;
