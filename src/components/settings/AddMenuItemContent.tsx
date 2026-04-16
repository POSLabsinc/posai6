 import { useState } from "react";
 import { ChevronLeft, ChevronRight } from "lucide-react";
 import { Switch } from "@/components/ui/switch";
 import { MultiSelectSheet } from "@/components/ui/multi-select-sheet";
 import DeviceScheduleSection from "./DeviceScheduleSection";
 import OrganizeCategoriesContent from "./OrganizeCategoriesContent";
 
 interface AddMenuItemContentProps {
   onBack: () => void;
   onSave: (menu: {
     name: string;
     pointOfSale: boolean;
     pointOfPurchase: boolean;
     selfServiceKiosk: boolean;
     onlineOrders: boolean;
     categories: boolean;
     reorderCategories: boolean;
     operationCategories: string;
     organize: string;
     revenueCenters: string;
   }) => void;
 }
 
 interface DaySchedule {
   day: string;
   startTime: string;
   endTime: string;
   enabled: boolean;
 }
 
 interface DeviceSchedule {
   startDate: Date | null;
   endDate: Date | null;
   daySchedules: DaySchedule[];
 }
 
 const createDefaultDaySchedules = (): DaySchedule[] => [
   { day: "Monday", startTime: "9:00 AM", endTime: "9:00 PM", enabled: true },
   { day: "Tuesday", startTime: "9:00 AM", endTime: "9:00 PM", enabled: true },
   { day: "Wednesday", startTime: "9:00 AM", endTime: "9:00 PM", enabled: true },
   { day: "Thursday", startTime: "9:00 AM", endTime: "9:00 PM", enabled: true },
   { day: "Friday", startTime: "9:00 AM", endTime: "9:00 PM", enabled: true },
   { day: "Saturday", startTime: "9:00 AM", endTime: "9:00 PM", enabled: false },
   { day: "Sunday", startTime: "9:00 AM", endTime: "9:00 PM", enabled: false },
 ];
 
 const createDefaultSchedule = (): DeviceSchedule => ({
   startDate: new Date(),
   endDate: null,
   daySchedules: createDefaultDaySchedules(),
 });
 
 type DeviceKey = "pointOfSale" | "pointOfPurchase" | "selfServiceKiosk" | "onlineOrders";
 
 const AddMenuItemContent = ({ onBack, onSave }: AddMenuItemContentProps) => {
   const [name, setName] = useState("");
   const [pointOfSale, setPointOfSale] = useState(true);
   const [pointOfPurchase, setPointOfPurchase] = useState(false);
   const [selfServiceKiosk, setSelfServiceKiosk] = useState(false);
   const [onlineOrders, setOnlineOrders] = useState(false);
   const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
   const [selectedRevenueCenters, setSelectedRevenueCenters] = useState<string[]>([]);
 
   const [deviceSchedules, setDeviceSchedules] = useState<Record<DeviceKey, DeviceSchedule>>({
     pointOfSale: createDefaultSchedule(),
     pointOfPurchase: createDefaultSchedule(),
     selfServiceKiosk: createDefaultSchedule(),
     onlineOrders: createDefaultSchedule(),
   });
 
   const [showCategoriesSheet, setShowCategoriesSheet] = useState(false);
   const [showOrganizeScreen, setShowOrganizeScreen] = useState(false);
   const [showRevenueCentersSheet, setShowRevenueCentersSheet] = useState(false);
 
   const categoryOptions = ["All Categories", "Appetizers", "Main Course", "Desserts", "Beverages", "Soups", "Salads", "Sides", "Specials"];
   const revenueCenterOptions = ["Main Dining", "Bar", "Patio", "Takeout", "Delivery", "Catering", "Private Events"];
 
   const handleBack = () => {
     if (name) {
       onSave({
         name,
         pointOfSale,
         pointOfPurchase,
         selfServiceKiosk,
         onlineOrders,
         categories: selectedCategories.length > 0,
         reorderCategories: false,
         operationCategories: selectedCategories.join(", "),
         organize: "",
         revenueCenters: selectedRevenueCenters.join(", "),
       });
     }
     onBack();
   };
 
   const formatSelection = (items: string[]) => {
     if (items.length === 0) return "Choose";
     if (items.length === 1) return items[0];
     return `${items.length} selected`;
   };
 
   const updateDeviceSchedule = (device: DeviceKey, schedule: DeviceSchedule) => {
     setDeviceSchedules(prev => ({ ...prev, [device]: schedule }));
   };
 
   if (showOrganizeScreen) {
     return (
       <OrganizeCategoriesContent
         categories={selectedCategories}
         onBack={(reorderedCategories) => {
           setSelectedCategories(reorderedCategories);
           setShowOrganizeScreen(false);
         }}
       />
     );
   }
 
   return (
     <div className="h-full flex flex-col overflow-hidden bg-background">
       {/* Header */}
       <div className="flex items-center justify-center py-4 px-4 relative">
         <button
           onClick={handleBack}
           className="absolute left-4 w-10 h-10 rounded-full bg-neutral-800/60 flex items-center justify-center active:opacity-70 transition-opacity"
         >
           <ChevronLeft className="w-5 h-5 text-foreground" />
         </button>
         <h1 className="text-xl font-semibold text-foreground">Add New Menu</h1>
       </div>
 
       <div className="flex-1 overflow-y-auto scrollbar-hide px-4 pb-4">
         {/* Menu Name Card */}
         <div className="bg-neutral-800/60 rounded-2xl overflow-hidden mb-4">
           <div className="py-4 px-4">
             <div className="flex items-center justify-between">
               <span className="text-foreground text-base font-medium">Menu Name</span>
               <div className="flex items-center gap-1">
                 <input
                   type="text"
                   value={name}
                   onChange={(e) => setName(e.target.value)}
                   placeholder="Required"
                   className="bg-transparent text-right text-foreground placeholder:text-neutral-500 outline-none text-base w-32"
                 />
                 <ChevronRight className="w-4 h-4 text-neutral-500" />
               </div>
             </div>
           </div>
         </div>
 
         {/* Availability Section */}
         <div className="mb-2 px-1">
           <span className="text-neutral-500 text-sm font-medium tracking-wide">Availability</span>
         </div>
          <div className="bg-neutral-800/60 rounded-2xl overflow-hidden mb-1">
           {/* Point of Sale */}
           <div className="py-4 px-4">
             <div className="flex items-center justify-between">
               <span className="text-foreground text-base font-medium">Point of Sale</span>
               <Switch checked={pointOfSale} onCheckedChange={setPointOfSale} />
             </div>
           </div>
           {pointOfSale && (
             <DeviceScheduleSection
               deviceKey="pointOfSale"
               schedule={deviceSchedules.pointOfSale}
               onScheduleChange={(schedule) => updateDeviceSchedule("pointOfSale", schedule)}
             />
           )}
 
           <div className="h-px bg-neutral-700/50 mx-4" />
 
           {/* Point of Purchase */}
           <div className="py-4 px-4">
             <div className="flex items-center justify-between">
               <span className="text-foreground text-base font-medium">Point of Purchase</span>
               <Switch checked={pointOfPurchase} onCheckedChange={setPointOfPurchase} />
             </div>
           </div>
           {pointOfPurchase && (
             <DeviceScheduleSection
               deviceKey="pointOfPurchase"
               schedule={deviceSchedules.pointOfPurchase}
               onScheduleChange={(schedule) => updateDeviceSchedule("pointOfPurchase", schedule)}
             />
           )}
 
           <div className="h-px bg-neutral-700/50 mx-4" />
 
           {/* Self-Service Kiosk */}
           <div className="py-4 px-4">
             <div className="flex items-center justify-between">
               <span className="text-foreground text-base font-medium">Self-Service Kiosk</span>
               <Switch checked={selfServiceKiosk} onCheckedChange={setSelfServiceKiosk} />
             </div>
           </div>
           {selfServiceKiosk && (
             <DeviceScheduleSection
               deviceKey="selfServiceKiosk"
               schedule={deviceSchedules.selfServiceKiosk}
               onScheduleChange={(schedule) => updateDeviceSchedule("selfServiceKiosk", schedule)}
             />
           )}
 
           <div className="h-px bg-neutral-700/50 mx-4" />
 
           {/* Online Orders */}
           <div className="py-4 px-4">
             <div className="flex items-center justify-between">
               <span className="text-foreground text-base font-medium">Online Orders</span>
               <Switch checked={onlineOrders} onCheckedChange={setOnlineOrders} />
             </div>
           </div>
           {onlineOrders && (
             <DeviceScheduleSection
               deviceKey="onlineOrders"
               schedule={deviceSchedules.onlineOrders}
               onScheduleChange={(schedule) => updateDeviceSchedule("onlineOrders", schedule)}
             />
           )}
          </div>
          <p className="text-neutral-500 text-sm px-1 mt-1.5 mb-6">
            Choose where this menu will be available.
          </p>

          {/* Operation Section */}
         <div className="mb-2 px-1">
           <span className="text-neutral-500 text-sm font-medium tracking-wide">Operation</span>
         </div>
          <div className="bg-neutral-800/60 rounded-2xl overflow-hidden mb-1">
           {/* Categories */}
           <button
             className="w-full flex items-center justify-between py-4 px-4 active:opacity-70 transition-opacity"
             onClick={() => setShowCategoriesSheet(true)}
           >
             <span className="text-foreground text-base font-medium">Categories</span>
             <div className="flex items-center gap-1">
               <span className="text-neutral-500 text-base">{formatSelection(selectedCategories)}</span>
               <ChevronRight className="w-4 h-4 text-neutral-500" />
             </div>
           </button>
 
           <div className="h-px bg-neutral-700/50 mx-4" />
 
           {/* Organize */}
           <button
             className="w-full flex items-center justify-between py-4 px-4 active:opacity-70 transition-opacity"
             onClick={() => selectedCategories.length > 0 && setShowOrganizeScreen(true)}
             disabled={selectedCategories.length === 0}
           >
             <span className={`text-base font-medium ${selectedCategories.length === 0 ? "text-neutral-500" : "text-foreground"}`}>
               Organize Categories
             </span>
             <ChevronRight className="w-4 h-4 text-neutral-500" />
           </button>
 
           <div className="h-px bg-neutral-700/50 mx-4" />
 
           {/* Revenue Centers */}
           <button
             className="w-full flex items-center justify-between py-4 px-4 active:opacity-70 transition-opacity"
             onClick={() => setShowRevenueCentersSheet(true)}
           >
             <span className="text-foreground text-base font-medium">Revenue Centers</span>
             <div className="flex items-center gap-1">
               <span className="text-neutral-500 text-base">{formatSelection(selectedRevenueCenters)}</span>
               <ChevronRight className="w-4 h-4 text-neutral-500" />
             </div>
            </button>
          </div>
          <p className="text-neutral-500 text-sm px-1 mt-1.5 mb-6">
            Assign the menu to specific revenue centres, such as Dine-In, Bar, Takeaway, or Delivery. Revenue centres help track and report sales accurately based on where the income is generated.
          </p>
        </div>
 
       {/* Categories Sheet */}
       <MultiSelectSheet
         isOpen={showCategoriesSheet}
         onClose={(selected) => {
           setSelectedCategories(selected);
           setShowCategoriesSheet(false);
         }}
         title="Select Categories"
         options={categoryOptions}
         initialSelected={selectedCategories}
       />
 
       {/* Revenue Centers Sheet */}
       <MultiSelectSheet
         isOpen={showRevenueCentersSheet}
         onClose={(selected) => {
           setSelectedRevenueCenters(selected);
           setShowRevenueCentersSheet(false);
         }}
         title="Select Revenue Centers"
         options={revenueCenterOptions}
         initialSelected={selectedRevenueCenters}
       />
     </div>
   );
 };
 
 export default AddMenuItemContent;