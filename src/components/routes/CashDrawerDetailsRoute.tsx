import { useIsMobile } from "@/hooks/use-mobile";
import Settings from "@/pages/Settings";
import CashDrawerDetailsContent from "@/components/settings/CashDrawerDetailsContent";

const CashDrawerDetailsRoute = () => {
  const isMobile = useIsMobile();
  
  if (isMobile) {
    return (
      <div className="h-full flex flex-col overflow-hidden bg-background">
        {/* No header with back button - drawer must be closed first */}
        <div className="flex-1 overflow-hidden">
          <CashDrawerDetailsContent showHeader={false} />
        </div>
      </div>
    );
  }
  
  return <Settings />;
};

export default CashDrawerDetailsRoute;
