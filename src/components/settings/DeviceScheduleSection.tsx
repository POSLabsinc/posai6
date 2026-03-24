 import { useState, useRef } from "react";
 import { ChevronRight, Copy, AlertCircle } from "lucide-react";
 import { Switch } from "@/components/ui/switch";
 import { AppleWheelDatePicker } from "@/components/ui/apple-wheel-date-picker";
 import { AppleWheelTimePicker } from "@/components/ui/apple-wheel-time-picker";
 import { InlineDatePicker } from "@/components/ui/inline-date-picker";
 import { InlineTimePicker } from "@/components/ui/inline-time-picker";
 import { useIsMobile } from "@/hooks/use-mobile";
 import { format, addMonths } from "date-fns";
 import aiColorfulIcon from "@/assets/icons/ai-colorful.png";
 
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
 
 interface DeviceScheduleSectionProps {
   deviceKey: string;
   schedule: DeviceSchedule;
   onScheduleChange: (schedule: DeviceSchedule) => void;
 }
 
 const QUICK_DATE_PRESETS = [
   { label: "Today", getValue: () => ({ start: new Date(), end: new Date() }) },
   { label: "This Week", getValue: () => ({ start: new Date(), end: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000) }) },
   { label: "This Month", getValue: () => ({ start: new Date(), end: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0) }) },
   { label: "3 Months", getValue: () => ({ start: new Date(), end: addMonths(new Date(), 3) }) },
   { label: "No End Date", getValue: () => ({ start: new Date(), end: null }) },
 ];
 
 const QUICK_TIME_PRESETS = [
   { label: "Business Hours", startTime: "9:00 AM", endTime: "5:00 PM" },
   { label: "Lunch Special", startTime: "11:00 AM", endTime: "2:00 PM" },
   { label: "Happy Hour", startTime: "4:00 PM", endTime: "7:00 PM" },
   { label: "Dinner Hours", startTime: "5:00 PM", endTime: "10:00 PM" },
   { label: "All Day", startTime: "12:00 AM", endTime: "11:59 PM" },
 ];
 
 const parseTimeToMinutes = (time: string): number => {
   const match = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
   if (!match) return 0;
   let hours = parseInt(match[1]);
   const minutes = parseInt(match[2]);
   const period = match[3].toUpperCase();
   if (period === "PM" && hours !== 12) hours += 12;
   if (period === "AM" && hours === 12) hours = 0;
   return hours * 60 + minutes;
 };
 
 const hasTimeConflict = (startTime: string, endTime: string): boolean => {
   const startMinutes = parseTimeToMinutes(startTime);
   const endMinutes = parseTimeToMinutes(endTime);
   if (endTime === "11:59 PM" || endTime === "11:59 AM") return false;
   return endMinutes <= startMinutes && endMinutes !== 0;
 };
 
 const DeviceScheduleSection = ({
   deviceKey,
   schedule,
   onScheduleChange,
 }: DeviceScheduleSectionProps) => {
   const isMobile = useIsMobile();
   const [showStartDatePicker, setShowStartDatePicker] = useState(false);
   const [showEndDatePicker, setShowEndDatePicker] = useState(false);
   const [tempSelectedDate, setTempSelectedDate] = useState<Date>(new Date());
   const [showTimePicker, setShowTimePicker] = useState(false);
   const [editingTimeIndex, setEditingTimeIndex] = useState<number | null>(null);
   const [editingTimeType, setEditingTimeType] = useState<"start" | "end" | null>(null);
    const [showQuickSetMenu, setShowQuickSetMenu] = useState(false);
   const [showCopyMenu, setShowCopyMenu] = useState(false);
   const [copySourceIndex, setCopySourceIndex] = useState<number | null>(null);
 
   const [datePickerPosition, setDatePickerPosition] = useState({ top: 0, right: 0 });
   const [timePickerPosition, setTimePickerPosition] = useState({ top: 0, right: 0 });
 
   const startDateRef = useRef<HTMLButtonElement>(null);
   const endDateRef = useRef<HTMLButtonElement>(null);
   const timeRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
   const copyRefs = useRef<{ [key: number]: HTMLButtonElement | null }>({});
 
   const formatDateDisplay = (date: Date | null, placeholder = "Select") => {
     if (!date) return placeholder;
     return format(date, "MMM d, yyyy");
   };
 
   const openStartDatePicker = () => {
     setTempSelectedDate(schedule.startDate || new Date());
     if (!isMobile && startDateRef.current) {
       const rect = startDateRef.current.getBoundingClientRect();
       setDatePickerPosition({ top: rect.bottom + 4, right: window.innerWidth - rect.right + 16 });
     }
     setShowStartDatePicker(true);
   };
 
   const openEndDatePicker = () => {
     setTempSelectedDate(schedule.endDate || new Date());
     if (!isMobile && endDateRef.current) {
       const rect = endDateRef.current.getBoundingClientRect();
       setDatePickerPosition({ top: rect.bottom + 4, right: window.innerWidth - rect.right + 16 });
     }
     setShowEndDatePicker(true);
   };
 
   const confirmStartDate = () => {
     onScheduleChange({ ...schedule, startDate: tempSelectedDate });
     setShowStartDatePicker(false);
   };
 
   const confirmEndDate = () => {
     onScheduleChange({ ...schedule, endDate: tempSelectedDate });
     setShowEndDatePicker(false);
   };
 
   const openTimePicker = (index: number, type: "start" | "end") => {
     setEditingTimeIndex(index);
     setEditingTimeType(type);
     if (!isMobile) {
       const refKey = `${index}-${type}`;
       const ref = timeRefs.current[refKey];
       if (ref) {
         const rect = ref.getBoundingClientRect();
         setTimePickerPosition({ top: rect.bottom + 4, right: window.innerWidth - rect.right + 16 });
       }
     }
     setShowTimePicker(true);
   };
 
   const confirmTime = (time: string) => {
     if (editingTimeIndex !== null && editingTimeType !== null) {
       onScheduleChange({
         ...schedule,
         daySchedules: schedule.daySchedules.map((s, i) => {
           if (i === editingTimeIndex) {
             return {
               ...s,
               [editingTimeType === "start" ? "startTime" : "endTime"]: time,
             };
           }
           return s;
         }),
       });
     }
     setShowTimePicker(false);
     setEditingTimeIndex(null);
     setEditingTimeType(null);
   };
 
   const getCurrentTimeForPicker = () => {
     if (editingTimeIndex !== null && editingTimeType !== null) {
       const s = schedule.daySchedules[editingTimeIndex];
       return editingTimeType === "start" ? s.startTime : s.endTime;
     }
     return "12:00 AM";
   };
 
   const toggleDayEnabled = (index: number) => {
     onScheduleChange({
       ...schedule,
       daySchedules: schedule.daySchedules.map((s, i) =>
         i === index ? { ...s, enabled: !s.enabled } : s
       ),
     });
   };
 
    const applyQuickDatePreset = (preset: typeof QUICK_DATE_PRESETS[0]) => {
      const { start, end } = preset.getValue();
      onScheduleChange({ ...schedule, startDate: start, endDate: end });
    };

    const applyQuickTimePreset = (preset: typeof QUICK_TIME_PRESETS[0]) => {
      onScheduleChange({
        ...schedule,
        daySchedules: schedule.daySchedules.map(s => ({
          ...s,
          startTime: preset.startTime,
          endTime: preset.endTime,
          enabled: true,
        })),
      });
      setShowQuickSetMenu(false);
    };

    const applyToWeekdays = () => {
      const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
      onScheduleChange({
        ...schedule,
        daySchedules: schedule.daySchedules.map(s => ({
          ...s,
          enabled: weekdays.includes(s.day),
        })),
      });
      setShowQuickSetMenu(false);
    };

    const applyToAllDays = () => {
      onScheduleChange({
        ...schedule,
        daySchedules: schedule.daySchedules.map(s => ({
          ...s,
          enabled: true,
        })),
      });
      setShowQuickSetMenu(false);
    };
 
   const openCopyMenu = (index: number) => {
     setCopySourceIndex(index);
     setShowCopyMenu(true);
   };
 
   const copyToDay = (targetDay: string) => {
     if (copySourceIndex === null) return;
     const sourceSchedule = schedule.daySchedules[copySourceIndex];
     onScheduleChange({
       ...schedule,
       daySchedules: schedule.daySchedules.map(s => {
         if (s.day === targetDay) {
           return {
             ...s,
             startTime: sourceSchedule.startTime,
             endTime: sourceSchedule.endTime,
             enabled: true,
           };
         }
         return s;
       }),
     });
     setShowCopyMenu(false);
     setCopySourceIndex(null);
   };
 
   const copyToAllDays = () => {
     if (copySourceIndex === null) return;
     const sourceSchedule = schedule.daySchedules[copySourceIndex];
     onScheduleChange({
       ...schedule,
       daySchedules: schedule.daySchedules.map(s => ({
         ...s,
         startTime: sourceSchedule.startTime,
         endTime: sourceSchedule.endTime,
         enabled: true,
       })),
     });
     setShowCopyMenu(false);
     setCopySourceIndex(null);
   };
 
   const copyToWeekdays = () => {
     if (copySourceIndex === null) return;
     const sourceSchedule = schedule.daySchedules[copySourceIndex];
     const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
     onScheduleChange({
       ...schedule,
       daySchedules: schedule.daySchedules.map(s => {
         if (weekdays.includes(s.day)) {
           return {
             ...s,
             startTime: sourceSchedule.startTime,
             endTime: sourceSchedule.endTime,
             enabled: true,
           };
         }
         return s;
       }),
     });
     setShowCopyMenu(false);
     setCopySourceIndex(null);
   };
 
   const getOtherDays = () => {
     if (copySourceIndex === null) return [];
     return schedule.daySchedules.filter((_, i) => i !== copySourceIndex);
   };
 
    return (
      <div className="px-4 pb-4">
        {/* Single Quick Set button for both Date & Time */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-neutral-400 text-xs font-medium">Schedule</span>
          <button
            onClick={() => setShowQuickSetMenu(true)}
            className="flex items-center gap-1 text-xs text-primary active:opacity-70 transition-opacity"
          >
            <img src={aiColorfulIcon} alt="" className="w-3 h-3" />
            <span>Quick Set</span>
          </button>
        </div>

        {/* Date Selection */}
        <div className="mb-1">
          <span className="text-neutral-400 text-xs font-medium">Date Range</span>
        </div>
        <div className="bg-neutral-700/30 rounded-xl overflow-hidden">
          <button
            ref={startDateRef}
            onClick={openStartDatePicker}
            className="w-full flex items-center justify-between py-3 px-4 active:opacity-70 transition-opacity"
          >
            <span className="text-foreground text-sm">Start Date</span>
            <div className="flex items-center gap-1">
              <span className="text-neutral-400 text-sm">{formatDateDisplay(schedule.startDate)}</span>
              <ChevronRight className="w-4 h-4 text-neutral-500" />
            </div>
          </button>

          <div className="h-px bg-neutral-600/50 mx-4" />

          <button
            ref={endDateRef}
            onClick={openEndDatePicker}
            className="w-full flex items-center justify-between py-3 px-4 active:opacity-70 transition-opacity"
          >
            <span className="text-foreground text-sm">End Date</span>
            <div className="flex items-center gap-1">
              <span className="text-neutral-400 text-sm">{formatDateDisplay(schedule.endDate, "No End Date")}</span>
              <ChevronRight className="w-4 h-4 text-neutral-500" />
            </div>
          </button>
        </div>

        {/* Time Selection Grid */}
        <div className="mt-3 mb-1">
          <span className="text-neutral-400 text-xs font-medium">Time Schedule</span>
        </div>
       <div className="bg-neutral-700/30 rounded-xl overflow-hidden">
         {/* Header Row */}
         <div className="grid grid-cols-[1fr_80px_80px_28px] py-2 px-4">
           <span className="text-neutral-400 text-xs font-medium">Days</span>
           <span className="text-neutral-400 text-xs font-medium text-center">Start</span>
           <span className="text-neutral-400 text-xs font-medium text-center">End</span>
           <span></span>
         </div>
 
         {/* Day Rows */}
         {schedule.daySchedules.map((daySchedule, index) => {
           const conflict = hasTimeConflict(daySchedule.startTime, daySchedule.endTime);
           return (
             <div key={daySchedule.day}>
               <div className="h-px bg-neutral-600/50 mx-4" />
               <div className={`grid grid-cols-[1fr_80px_80px_28px] py-2.5 px-4 items-center ${!daySchedule.enabled ? "opacity-50" : ""}`}>
                 <div className="flex items-center gap-2">
                   <Switch
                     checked={daySchedule.enabled}
                     onCheckedChange={() => toggleDayEnabled(index)}
                     className="scale-[0.6]"
                   />
                   <span className="text-foreground text-xs">{daySchedule.day.slice(0, 3)}</span>
                 </div>
                 <button
                   ref={(el) => { timeRefs.current[`${index}-start`] = el; }}
                   onClick={() => daySchedule.enabled && openTimePicker(index, "start")}
                   disabled={!daySchedule.enabled}
                   className="text-foreground text-xs text-center active:opacity-70 transition-opacity disabled:cursor-not-allowed"
                 >
                   {daySchedule.startTime}
                 </button>
                 <div className="flex items-center justify-center gap-1">
                   <button
                     ref={(el) => { timeRefs.current[`${index}-end`] = el; }}
                     onClick={() => daySchedule.enabled && openTimePicker(index, "end")}
                     disabled={!daySchedule.enabled}
                     className={`text-xs text-center active:opacity-70 transition-opacity disabled:cursor-not-allowed ${conflict ? "text-red-400" : "text-foreground"}`}
                   >
                     {daySchedule.endTime}
                   </button>
                   {conflict && <AlertCircle className="w-3 h-3 text-red-400 flex-shrink-0" />}
                 </div>
                 <button
                   ref={(el) => { copyRefs.current[index] = el; }}
                   onClick={() => daySchedule.enabled && openCopyMenu(index)}
                   disabled={!daySchedule.enabled}
                   className="flex items-center justify-center active:opacity-70 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
                 >
                   <Copy className="w-3.5 h-3.5 text-neutral-500" />
                 </button>
               </div>
             </div>
           );
         })}
       </div>
 
       {/* Quick Date Menu */}
       {showQuickDateMenu && (
         <div
           className={`fixed inset-0 z-50 flex ${isMobile ? "items-end" : "items-center"} justify-center bg-black/60 animate-in fade-in duration-200`}
           onClick={() => setShowQuickDateMenu(false)}
         >
           <div
             className={`${isMobile ? "w-full max-w-md rounded-t-3xl" : "w-full max-w-sm rounded-2xl"} bg-neutral-900 ${isMobile ? "animate-in slide-in-from-bottom duration-300" : "animate-in zoom-in-95 duration-200"} shadow-2xl`}
             onClick={(e) => e.stopPropagation()}
           >
             <div className="flex justify-center pt-3 pb-2">
               <div className="w-10 h-1 bg-neutral-600 rounded-full" />
             </div>
             <div className="px-4 pb-2">
               <p className="text-neutral-400 text-base text-center">Quick Date Presets</p>
             </div>
             <div className="bg-neutral-800/60 rounded-2xl mx-4 mb-6 overflow-hidden">
               {QUICK_DATE_PRESETS.map((preset, index) => (
                 <div key={preset.label}>
                   {index > 0 && <div className="h-px bg-neutral-700/50 mx-4" />}
                   <button
                     onClick={() => applyQuickDatePreset(preset)}
                     className="w-full text-left px-4 py-4 text-base font-medium text-foreground active:opacity-70 transition-colors"
                   >
                     {preset.label}
                   </button>
                 </div>
               ))}
             </div>
           </div>
         </div>
       )}
 
       {/* Quick Time Menu */}
       {showQuickTimeMenu && (
         <div
           className={`fixed inset-0 z-50 flex ${isMobile ? "items-end" : "items-center"} justify-center bg-black/60 animate-in fade-in duration-200`}
           onClick={() => setShowQuickTimeMenu(false)}
         >
           <div
             className={`${isMobile ? "w-full max-w-md rounded-t-3xl" : "w-full max-w-sm rounded-2xl"} bg-neutral-900 ${isMobile ? "animate-in slide-in-from-bottom duration-300" : "animate-in zoom-in-95 duration-200"} shadow-2xl max-h-[80vh] overflow-y-auto`}
             onClick={(e) => e.stopPropagation()}
           >
             <div className="flex justify-center pt-3 pb-2">
               <div className="w-10 h-1 bg-neutral-600 rounded-full" />
             </div>
             <div className="px-4 pb-2">
               <p className="text-neutral-400 text-base text-center">Time Presets</p>
             </div>
             <div className="bg-neutral-800/60 rounded-2xl mx-4 mb-4 overflow-hidden">
               {QUICK_TIME_PRESETS.map((preset, index) => (
                 <div key={preset.label}>
                   {index > 0 && <div className="h-px bg-neutral-700/50 mx-4" />}
                   <button
                     onClick={() => applyQuickTimePreset(preset)}
                     className="w-full text-left px-4 py-4 text-base font-medium text-foreground active:opacity-70 transition-colors"
                   >
                     <span>{preset.label}</span>
                     <span className="text-neutral-500 text-sm ml-2">{preset.startTime} - {preset.endTime}</span>
                   </button>
                 </div>
               ))}
             </div>
             <div className="px-4 pb-2">
               <p className="text-neutral-400 text-sm text-center">Quick Actions</p>
             </div>
             <div className="bg-neutral-800/60 rounded-2xl mx-4 mb-6 overflow-hidden">
               <button
                 onClick={applyToWeekdays}
                 className="w-full text-left px-4 py-4 text-base font-medium text-primary active:opacity-70 transition-colors"
               >
                 Apply to Weekdays
               </button>
               <div className="h-px bg-neutral-700/50 mx-4" />
               <button
                 onClick={applyToAllDays}
                 className="w-full text-left px-4 py-4 text-base font-medium text-primary active:opacity-70 transition-colors"
               >
                 Apply to All Days
               </button>
             </div>
           </div>
         </div>
       )}
 
       {/* Copy Menu */}
       {showCopyMenu && copySourceIndex !== null && (
         <div
           className={`fixed inset-0 z-50 flex ${isMobile ? "items-end" : "items-center"} justify-center bg-black/60 animate-in fade-in duration-200`}
           onClick={() => { setShowCopyMenu(false); setCopySourceIndex(null); }}
         >
           <div
             className={`${isMobile ? "w-full max-w-md rounded-t-3xl" : "w-full max-w-sm rounded-2xl"} bg-neutral-900 ${isMobile ? "animate-in slide-in-from-bottom duration-300" : "animate-in zoom-in-95 duration-200"} shadow-2xl max-h-[70vh] overflow-y-auto`}
             onClick={(e) => e.stopPropagation()}
           >
             <div className="flex justify-center pt-3 pb-2">
               <div className="w-10 h-1 bg-neutral-600 rounded-full" />
             </div>
             <div className="px-4 pb-2">
               <p className="text-neutral-400 text-base text-center">
                 Copy {schedule.daySchedules[copySourceIndex].day}'s schedule to:
               </p>
             </div>
             <div className="bg-neutral-800/60 rounded-2xl mx-4 mb-4 overflow-hidden">
               <button
                 onClick={copyToAllDays}
                 className="w-full text-left px-4 py-4 text-base font-medium text-primary active:opacity-70 transition-colors"
               >
                 All Days
               </button>
               <div className="h-px bg-neutral-700/50 mx-4" />
               <button
                 onClick={copyToWeekdays}
                 className="w-full text-left px-4 py-4 text-base font-medium text-primary active:opacity-70 transition-colors"
               >
                 Weekdays Only
               </button>
             </div>
             <div className="bg-neutral-800/60 rounded-2xl mx-4 mb-6 overflow-hidden">
               {getOtherDays().map((day, index) => (
                 <div key={day.day}>
                   {index > 0 && <div className="h-px bg-neutral-700/50 mx-4" />}
                   <button
                     onClick={() => copyToDay(day.day)}
                     className="w-full text-left px-4 py-4 text-base font-medium text-foreground active:opacity-70 transition-colors"
                   >
                     {day.day}
                   </button>
                 </div>
               ))}
             </div>
           </div>
         </div>
       )}
 
       {/* Date Pickers */}
       {isMobile ? (
         <>
           <AppleWheelDatePicker
             isOpen={showStartDatePicker}
             onClose={() => setShowStartDatePicker(false)}
             onConfirm={confirmStartDate}
             selectedDate={tempSelectedDate}
             onDateChange={setTempSelectedDate}
           />
           <AppleWheelDatePicker
             isOpen={showEndDatePicker}
             onClose={() => setShowEndDatePicker(false)}
             onConfirm={confirmEndDate}
             selectedDate={tempSelectedDate}
             onDateChange={setTempSelectedDate}
           />
         </>
       ) : (
         <>
           <InlineDatePicker
             isOpen={showStartDatePicker}
             onClose={() => {
               onScheduleChange({ ...schedule, startDate: tempSelectedDate });
               setShowStartDatePicker(false);
             }}
             selectedDate={tempSelectedDate}
             onDateChange={setTempSelectedDate}
             position={datePickerPosition}
           />
           <InlineDatePicker
             isOpen={showEndDatePicker}
             onClose={() => {
               onScheduleChange({ ...schedule, endDate: tempSelectedDate });
               setShowEndDatePicker(false);
             }}
             selectedDate={tempSelectedDate}
             onDateChange={setTempSelectedDate}
             position={datePickerPosition}
           />
         </>
       )}
 
       {/* Time Picker */}
       {isMobile ? (
         <AppleWheelTimePicker
           isOpen={showTimePicker}
           onClose={() => {
             setShowTimePicker(false);
             setEditingTimeIndex(null);
             setEditingTimeType(null);
           }}
           onConfirm={confirmTime}
           selectedTime={getCurrentTimeForPicker()}
         />
       ) : (
         <InlineTimePicker
           isOpen={showTimePicker}
           onClose={() => {
             setShowTimePicker(false);
             setEditingTimeIndex(null);
             setEditingTimeType(null);
           }}
           selectedTime={getCurrentTimeForPicker()}
           onTimeChange={(time) => {
             if (editingTimeIndex !== null && editingTimeType !== null) {
               onScheduleChange({
                 ...schedule,
                 daySchedules: schedule.daySchedules.map((s, i) => {
                   if (i === editingTimeIndex) {
                     return {
                       ...s,
                       [editingTimeType === "start" ? "startTime" : "endTime"]: time,
                     };
                   }
                   return s;
                 }),
               });
             }
           }}
           position={timePickerPosition}
         />
       )}
     </div>
   );
 };
 
 export default DeviceScheduleSection;