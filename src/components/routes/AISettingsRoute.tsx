 import AISettingsContent from "@/components/settings/AISettingsContent";
 import { useNavigate } from "react-router-dom";
 
 const AISettingsRoute = () => {
   const navigate = useNavigate();
   
   return (
     <div className="h-full bg-background">
       <AISettingsContent 
         showHeader={true} 
         onBack={() => navigate('/settings')} 
       />
     </div>
   );
 };
 
 export default AISettingsRoute;