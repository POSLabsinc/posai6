import AISettingsContent from "@/components/settings/AISettingsContent";
import { useNavigate, useLocation } from "react-router-dom";

const AISettingsRoute = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const context = (location.state as any)?.context as string | undefined;
  
  return (
    <div className="h-full bg-background">
      <AISettingsContent 
        showHeader={true} 
        onBack={() => navigate('/settings/system')} 
        context={context}
      />
    </div>
  );
};

export default AISettingsRoute;