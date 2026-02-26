 import { useState, useRef } from "react";
 import { ChevronLeft, ChevronRight } from "lucide-react";
 import { Switch } from "@/components/ui/switch";
 import ScheduleSection from "@/components/settings/ScheduleSection";
 
 interface Discount {
   id: string;
   name: string;
   amount: number;
   type: "Percentage" | "Fixed";
   archived: boolean;
   applicableTo?: string;
   applicableProducts?: string[];
   requiresManagerPin?: boolean;
   scheduleEnabled?: boolean;
 }
 
 interface EditDiscountContentProps {
   discount: Discount;
   onBack: () => void;
   onSave: (discount: Discount) => void;
 }
 
 interface DropdownPosition {
   top: number;
   right: number;
 }
 
const EditDiscountContent = ({ discount, onBack, onSave }: EditDiscountContentProps) => {
  const [name, setName] = useState(discount?.name ?? "");
  const [amount, setAmount] = useState(discount?.amount?.toString() ?? "0");
  const [type, setType] = useState<"Percentage" | "Fixed">(discount?.type ?? "Percentage");
  const [applicableTo, setApplicableTo] = useState(discount?.applicableTo ?? "");
  const [requiresManagerPin, setRequiresManagerPin] = useState(discount?.requiresManagerPin ?? false);
  const [scheduleEnabled, setScheduleEnabled] = useState(discount?.scheduleEnabled ?? false);
  const [automaticSchedule, setAutomaticSchedule] = useState(false);
   const [startDate, setStartDate] = useState<Date | null>(null);
   const [endDate, setEndDate] = useState<Date | null>(null);
   const [daySchedules, setDaySchedules] = useState([
     { day: "Monday", startTime: "9:00 AM", endTime: "9:00 PM", enabled: true },
     { day: "Tuesday", startTime: "9:00 AM", endTime: "9:00 PM", enabled: true },
     { day: "Wednesday", startTime: "9:00 AM", endTime: "9:00 PM", enabled: true },
     { day: "Thursday", startTime: "9:00 AM", endTime: "9:00 PM", enabled: true },
     { day: "Friday", startTime: "9:00 AM", endTime: "9:00 PM", enabled: true },
     { day: "Saturday", startTime: "9:00 AM", endTime: "9:00 PM", enabled: false },
     { day: "Sunday", startTime: "9:00 AM", endTime: "9:00 PM", enabled: false },
   ]);
 
   const [showTypeDropdown, setShowTypeDropdown] = useState(false);
   const [showProductDropdown, setShowProductDropdown] = useState(false);
 
   const [typePosition, setTypePosition] = useState<DropdownPosition>({ top: 0, right: 0 });
   const [productPosition, setProductPosition] = useState<DropdownPosition>({ top: 0, right: 0 });
 
   const typeRef = useRef<HTMLButtonElement>(null);
   const productRef = useRef<HTMLButtonElement>(null);
 
   const typeOptions = ["Amount", "Percentage"];
   const productOptions = ["All Items", "Food Only", "Beverages Only", "Alcohol Only"];
 
   const handleBack = () => {
     if (name && amount && type) {
       onSave({
         ...discount,
         name,
         amount: parseFloat(amount),
         type,
         applicableTo,
         requiresManagerPin,
         scheduleEnabled,
       });
     }
     onBack();
   };
 
   const getTypeDisplayValue = () => {
     return type === "Fixed" ? "Amount" : "Percentage";
   };
 
   return (
     <div className="h-full flex flex-col overflow-hidden bg-background">
       {/* Header */}
       <div className="flex items-center justify-center py-4 px-4 relative">
         <button
           onClick={handleBack}
           className="absolute left-4 w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center active:opacity-70 transition-opacity"
         >
           <ChevronLeft className="w-5 h-5 text-foreground" />
         </button>
         <h1 className="text-lg font-semibold text-foreground">Edit Discount</h1>
       </div>
 
       <div className="flex-1 overflow-y-auto scrollbar-hide px-4 pb-4">
         {/* Main Fields Card */}
         <div className="bg-neutral-800/60 rounded-2xl overflow-hidden mt-2">
           {/* Name Field */}
           <div className="flex items-center justify-between py-4 px-4">
             <span className="text-foreground text-base font-medium">Name</span>
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
           
           <div className="h-px bg-neutral-700/50 mx-4" />
 
           {/* Amount Field */}
           <div className="flex items-center justify-between py-4 px-4">
             <span className="text-foreground text-base font-medium">Amount</span>
             <div className="flex items-center gap-1">
               <input
                 type="text"
                 value={amount}
                 onChange={(e) => setAmount(e.target.value)}
                 placeholder="Required"
                 className="bg-transparent text-right text-foreground placeholder:text-neutral-500 outline-none text-base w-24"
               />
               <ChevronRight className="w-4 h-4 text-neutral-500" />
             </div>
           </div>
 
           <div className="h-px bg-neutral-700/50 mx-4" />
 
           {/* Discount Type Field */}
           <button 
             ref={typeRef}
             className="w-full flex items-center justify-between py-4 px-4 active:opacity-70 transition-opacity"
             onClick={() => {
               if (typeRef.current) {
                 const rect = typeRef.current.getBoundingClientRect();
                 setTypePosition({ top: rect.bottom + 4, right: window.innerWidth - rect.right + 16 });
               }
               setShowTypeDropdown(true);
             }}
           >
             <span className="text-foreground text-base font-medium">Discount Type</span>
             <div className="flex items-center gap-1">
               <span className="text-neutral-500 text-base">{getTypeDisplayValue()}</span>
               <ChevronRight className="w-4 h-4 text-neutral-500" />
             </div>
           </button>
 
           <div className="h-px bg-neutral-700/50 mx-4" />
 
           {/* Applicable Product Field */}
           <button 
             ref={productRef}
             className="w-full flex items-center justify-between py-4 px-4 active:opacity-70 transition-opacity"
             onClick={() => {
               if (productRef.current) {
                 const rect = productRef.current.getBoundingClientRect();
                 setProductPosition({ top: rect.bottom + 4, right: window.innerWidth - rect.right + 16 });
               }
               setShowProductDropdown(true);
             }}
           >
             <span className="text-foreground text-base font-medium">Applicable Product</span>
             <div className="flex items-center gap-1">
               <span className="text-neutral-500 text-base">{applicableTo || "Choose"}</span>
               <ChevronRight className="w-4 h-4 text-neutral-500" />
             </div>
           </button>
         </div>
 
         {/* Manager Approval Toggle */}
         <div className="bg-neutral-800/60 rounded-full overflow-hidden mt-6">
           <div className="flex items-center justify-between py-4 px-4">
             <span className="text-foreground text-base font-medium">Require Manager Approval</span>
             <Switch
               checked={requiresManagerPin}
               onCheckedChange={setRequiresManagerPin}
             />
           </div>
         </div>
         <p className="text-neutral-500 text-sm mt-2 px-1">
           manager pin required to apply this discount
         </p>
 
         {/* Schedule Section */}
         <ScheduleSection
           scheduleEnabled={scheduleEnabled}
           onScheduleEnabledChange={setScheduleEnabled}
           automaticSchedule={automaticSchedule}
           onAutomaticScheduleChange={setAutomaticSchedule}
           startDate={startDate}
           onStartDateChange={setStartDate}
           endDate={endDate}
           onEndDateChange={setEndDate}
           daySchedules={daySchedules}
           onDaySchedulesChange={setDaySchedules}
         />
       </div>
 
       {/* Type Dropdown Overlay */}
       {showTypeDropdown && (
         <div 
           className="fixed inset-0 z-50 animate-in fade-in duration-200"
           onClick={() => setShowTypeDropdown(false)}
         >
           <div 
             className="fixed bg-neutral-800 rounded-xl overflow-hidden shadow-2xl min-w-[160px] animate-in zoom-in-95 duration-200"
             style={{ top: typePosition.top, right: typePosition.right }}
             onClick={(e) => e.stopPropagation()}
           >
             {typeOptions.map((option) => (
               <button
                 key={option}
                 className={`w-full text-left px-4 py-3 text-base transition-colors ${
                   getTypeDisplayValue() === option 
                     ? "text-foreground bg-neutral-700/50" 
                     : "text-neutral-400 hover:bg-neutral-700/30"
                 }`}
                 onClick={() => {
                   setType(option === "Amount" ? "Fixed" : "Percentage");
                   setShowTypeDropdown(false);
                 }}
               >
                 {option}
               </button>
             ))}
           </div>
         </div>
       )}
 
       {/* Product Dropdown Overlay */}
       {showProductDropdown && (
         <div 
           className="fixed inset-0 z-50 animate-in fade-in duration-200"
           onClick={() => setShowProductDropdown(false)}
         >
           <div 
             className="fixed bg-neutral-800 rounded-xl overflow-hidden shadow-2xl min-w-[160px] animate-in zoom-in-95 duration-200"
             style={{ top: productPosition.top, right: productPosition.right }}
             onClick={(e) => e.stopPropagation()}
           >
             {productOptions.map((option) => (
               <button
                 key={option}
                 className={`w-full text-left px-4 py-3 text-base transition-colors ${
                   applicableTo === option 
                     ? "text-foreground bg-neutral-700/50" 
                     : "text-neutral-400 hover:bg-neutral-700/30"
                 }`}
                 onClick={() => {
                   setApplicableTo(option);
                   setShowProductDropdown(false);
                 }}
               >
                 {option}
               </button>
             ))}
           </div>
         </div>
       )}
     </div>
   );
 };
 
 export default EditDiscountContent;