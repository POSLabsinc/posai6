 import { useState, useRef, useEffect } from "react";
 import { ChevronRight, Copy, AlertCircle } from "lucide-react";
 import { Switch } from "@/components/ui/switch";
 import { AppleWheelDatePicker } from "@/components/ui/apple-wheel-date-picker";
 import { AppleWheelTimePicker } from "@/components/ui/apple-wheel-time-picker";
 import { InlineDatePicker } from "@/components/ui/inline-date-picker";
 import { InlineTimePicker } from "@/components/ui/inline-time-picker";
 import { useIsMobile } from "@/hooks/use-mobile";
 import { format, addDays, addMonths, endOfMonth } from "date-fns";
 import aiColorfulIcon from "@/assets/icons/ai-colorful.png";
 
 interface DaySchedule {
   day: string;
   startTime: string;
   endTime: string;
   enabled: boolean;
 }
 
 interface ScheduleSectionProps {
   scheduleEnabled: boolean;
   onScheduleEnabledChange: (enabled: boolean) => void;
   automaticSchedule: boolean;
   onAutomaticScheduleChange: (enabled: boolean) => void;
   startDate: Date | null;
   onStartDateChange: (date: Date | null) => void;
   endDate: Date | null;
   onEndDateChange: (date: Date | null) => void;
   daySchedules: DaySchedule[];
   onDaySchedulesChange: (schedules: DaySchedule[]) => void;
 }
 
 interface DropdownPosition {
   top: number;
   right: number;
 }
 
 const QUICK_DATE_PRESETS = [
   { label: "Today", getValue: () => ({ start: new Date(), end: new Date() }) },
   { label: "This Week", getValue: () => ({ start: new Date(), end: addDays(new Date(), 6) }) },
   { label: "This Month", getValue: () => ({ start: new Date(), end: endOfMonth(new Date()) }) },
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
 
 const ScheduleSection = ({
   scheduleEnabled,
   onScheduleEnabledChange,
   automaticSchedule,
   onAutomaticScheduleChange,
   startDate,
   onStartDateChange,
   endDate,
   onEndDateChange,
   daySchedules,
   onDaySchedulesChange,
 }: ScheduleSectionProps) => {
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
 
   const [datePickerPosition, setDatePickerPosition] = useState<DropdownPosition>({ top: 0, right: 0 });
   const [timePickerPosition, setTimePickerPosition] = useState<DropdownPosition>({ top: 0, right: 0 });
 
   const startDateRef = useRef<HTMLButtonElement>(null);
   const endDateRef = useRef<HTMLButtonElement>(null);
   const timeRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
 
   useEffect(() => {
     if (automaticSchedule && !startDate && !endDate) {
       const today = new Date();
       onStartDateChange(today);
       onEndDateChange(addMonths(today, 1));
     }
   }, [automaticSchedule, startDate, endDate, onStartDateChange, onEndDateChange]);
 
   const formatDateDisplay = (date: Date | null, placeholder = "Select") => {
     if (!date) return placeholder;
     return format(date, "MMM d, yyyy");
   };
 
   const openStartDatePicker = () => {
     setTempSelectedDate(startDate || new Date());
     if (!isMobile && startDateRef.current) {
       const rect = startDateRef.current.getBoundingClientRect();
       setDatePickerPosition({ top: rect.bottom + 4, right: window.innerWidth - rect.right + 16 });
     }
     setShowStartDatePicker(true);
   };
 
   const openEndDatePicker = () => {
     setTempSelectedDate(endDate || new Date());
     if (!isMobile && endDateRef.current) {
       const rect = endDateRef.current.getBoundingClientRect();
       setDatePickerPosition({ top: rect.bottom + 4, right: window.innerWidth - rect.right + 16 });
     }
     setShowEndDatePicker(true);
   };
 
   const confirmStartDate = () => {
     onStartDateChange(tempSelectedDate);
     setShowStartDatePicker(false);
   };
 
   const confirmEndDate = () => {
     onEndDateChange(tempSelectedDate);
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
       onDaySchedulesChange(daySchedules.map((schedule, i) => {
         if (i === editingTimeIndex) {
           return {
             ...schedule,
             [editingTimeType === "start" ? "startTime" : "endTime"]: time,
           };
         }
         return schedule;
       }));
     }
     setShowTimePicker(false);
     setEditingTimeIndex(null);
     setEditingTimeType(null);
   };
 
   const getCurrentTimeForPicker = () => {
     if (editingTimeIndex !== null && editingTimeType !== null) {
       const schedule = daySchedules[editingTimeIndex];
       return editingTimeType === "start" ? schedule.startTime : schedule.endTime;
     }
     return "12:00 AM";
   };
 
   const toggleDayEnabled = (index: number) => {
     onDaySchedulesChange(daySchedules.map((schedule, i) =>
       i === index ? { ...schedule, enabled: !schedule.enabled } : schedule
     ));
   };
 
   const applyQuickDatePreset = (preset: typeof QUICK_DATE_PRESETS[0]) => {
     const { start, end } = preset.getValue();
      onStartDateChange(start);
      onEndDateChange(end);
    };

    const applyQuickTimePreset = (preset: typeof QUICK_TIME_PRESETS[0]) => {
      onDaySchedulesChange(daySchedules.map(schedule => ({
        ...schedule,
        startTime: preset.startTime,
        endTime: preset.endTime,
        enabled: true,
      })));
      setShowQuickSetMenu(false);
    };

    const applyToWeekdays = () => {
      const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
      onDaySchedulesChange(daySchedules.map(schedule => ({
        ...schedule,
        enabled: weekdays.includes(schedule.day),
      })));
      setShowQuickSetMenu(false);
    };

    const applyToAllDays = () => {
      onDaySchedulesChange(daySchedules.map(schedule => ({
        ...schedule,
        enabled: true,
      })));
      setShowQuickSetMenu(false);
    };
 
   const openCopyMenu = (index: number) => {
     setCopySourceIndex(index);
     setShowCopyMenu(true);
   };
 
   const copyToDay = (targetDay: string) => {
     if (copySourceIndex === null) return;
     const sourceSchedule = daySchedules[copySourceIndex];
     onDaySchedulesChange(daySchedules.map(schedule => {
       if (schedule.day === targetDay) {
         return {
           ...schedule,
           startTime: sourceSchedule.startTime,
           endTime: sourceSchedule.endTime,
           enabled: true,
         };
       }
       return schedule;
     }));
     setShowCopyMenu(false);
     setCopySourceIndex(null);
   };
 
   const copyToAllDays = () => {
     if (copySourceIndex === null) return;
     const sourceSchedule = daySchedules[copySourceIndex];
     onDaySchedulesChange(daySchedules.map(schedule => ({
       ...schedule,
       startTime: sourceSchedule.startTime,
       endTime: sourceSchedule.endTime,
       enabled: true,
     })));
     setShowCopyMenu(false);
     setCopySourceIndex(null);
   };
 
   const copyToWeekdays = () => {
     if (copySourceIndex === null) return;
     const sourceSchedule = daySchedules[copySourceIndex];
     const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
     onDaySchedulesChange(daySchedules.map(schedule => {
       if (weekdays.includes(schedule.day)) {
         return {
           ...schedule,
           startTime: sourceSchedule.startTime,
           endTime: sourceSchedule.endTime,
           enabled: true,
         };
       }
       return schedule;
     }));
     setShowCopyMenu(false);
     setCopySourceIndex(null);
   };
 
   const getOtherDays = () => {
     if (copySourceIndex === null) return [];
     return daySchedules.filter((_, i) => i !== copySourceIndex);
   };
 
   return (
     <>
       {/* Availability Section */}
       <h3 className="text-neutral-500 text-base font-medium mt-6 mb-0.5 px-1">Availability</h3>
 
       {/* Schedule Discount Toggle */}
       <div className="bg-neutral-800/60 rounded-full overflow-hidden">
         <div className="flex items-center justify-between py-4 px-4">
           <span className="text-foreground text-base font-medium">Schedule Discount</span>
           <Switch
             checked={scheduleEnabled}
             onCheckedChange={onScheduleEnabledChange}
           />
         </div>
       </div>
       <p className="text-neutral-500 text-sm mt-2 px-1">
         set dates and times when this discount is active
       </p>
 
       {/* Automatic Schedule Section */}
       {scheduleEnabled && (
         <>
           <div className="bg-neutral-800/60 rounded-2xl overflow-hidden mt-4">
             <div className="flex items-center justify-between py-4 px-4">
               <span className="text-foreground text-base font-medium">Automatic Schedule Discount</span>
               <Switch
                 checked={automaticSchedule}
                 onCheckedChange={onAutomaticScheduleChange}
               />
             </div>
           </div>
           <p className="text-neutral-500 text-sm mt-2 px-1">
             turn on to run this discount automatically.
           </p>
 
            {/* Single Quick Set button */}
            <div className="flex items-center justify-between mt-6 mb-2 px-1">
              <h3 className="text-neutral-500 text-base font-medium">Schedule</h3>
              <button
                onClick={() => setShowQuickSetMenu(true)}
                className="flex items-center gap-1.5 text-sm text-primary active:opacity-70 transition-opacity"
              >
                <img src={aiColorfulIcon} alt="" className="w-4 h-4" />
                <span>Quick Set</span>
              </button>
            </div>

            {/* Select Date Section */}
            <div className="mb-1 px-1">
              <span className="text-neutral-500 text-sm font-medium">Select Date</span>
            </div>
            <div className="bg-neutral-800/60 rounded-2xl overflow-hidden">
              <button
                ref={startDateRef}
                onClick={openStartDatePicker}
                className="w-full flex items-center justify-between py-4 px-4 active:opacity-70 transition-opacity"
              >
                <span className="text-foreground text-base font-medium">Start Date</span>
                <div className="flex items-center gap-1">
                  <span className="text-neutral-400 text-base">{formatDateDisplay(startDate)}</span>
                  <ChevronRight className="w-4 h-4 text-neutral-500" />
                </div>
              </button>
              <div className="h-px bg-neutral-700/50 mx-4" />
              <button
                ref={endDateRef}
                onClick={openEndDatePicker}
                className="w-full flex items-center justify-between py-4 px-4 active:opacity-70 transition-opacity"
              >
                <span className="text-foreground text-base font-medium">End Date</span>
                <div className="flex items-center gap-1">
                  <span className="text-neutral-400 text-base">{formatDateDisplay(endDate, "No End Date")}</span>
                  <ChevronRight className="w-4 h-4 text-neutral-500" />
                </div>
              </button>
            </div>

            {/* Select Time Section */}
            <div className="mt-4 mb-1 px-1">
              <span className="text-neutral-500 text-sm font-medium">Select Time</span>
            </div>
           <div className="bg-neutral-800/60 rounded-2xl overflow-hidden">
             <div className="grid grid-cols-[1fr_90px_90px_28px] py-3 px-4">
               <span className="text-foreground text-sm font-medium">Days</span>
               <span className="text-foreground text-sm font-medium text-center">Start</span>
               <span className="text-foreground text-sm font-medium text-center">End</span>
               <span></span>
             </div>
             {daySchedules.map((schedule, index) => {
               const conflict = hasTimeConflict(schedule.startTime, schedule.endTime);
               return (
                 <div key={schedule.day}>
                   <div className="h-px bg-neutral-700/50 mx-4" />
                   <div className={`grid grid-cols-[1fr_90px_90px_28px] py-3 px-4 items-center ${!schedule.enabled ? "opacity-50" : ""}`}>
                     <div className="flex items-center gap-3">
                       <Switch
                         checked={schedule.enabled}
                         onCheckedChange={() => toggleDayEnabled(index)}
                         className="scale-75"
                       />
                       <span className="text-foreground text-sm">{schedule.day.slice(0, 3)}</span>
                     </div>
                     <button
                       ref={(el) => { timeRefs.current[`${index}-start`] = el; }}
                       onClick={() => schedule.enabled && openTimePicker(index, "start")}
                       disabled={!schedule.enabled}
                       className="text-foreground text-sm text-center active:opacity-70 transition-opacity disabled:cursor-not-allowed"
                     >
                       {schedule.startTime}
                     </button>
                     <div className="flex items-center justify-center gap-1">
                       <button
                         ref={(el) => { timeRefs.current[`${index}-end`] = el; }}
                         onClick={() => schedule.enabled && openTimePicker(index, "end")}
                         disabled={!schedule.enabled}
                         className={`text-sm text-center active:opacity-70 transition-opacity disabled:cursor-not-allowed ${conflict ? "text-red-400" : "text-foreground"}`}
                       >
                         {schedule.endTime}
                       </button>
                       {conflict && (
                         <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                       )}
                     </div>
                     <button
                       onClick={() => schedule.enabled && openCopyMenu(index)}
                       disabled={!schedule.enabled}
                       className="flex items-center justify-center active:opacity-70 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
                     >
                       <Copy className="w-4 h-4 text-neutral-500" />
                     </button>
                   </div>
                 </div>
               );
             })}
           </div>
         </>
       )}
 
        {/* Combined Quick Set Menu */}
        {showQuickSetMenu && (
          <div
            className={`fixed inset-0 z-50 flex ${isMobile ? "items-end" : "items-center"} justify-center bg-black/60 animate-in fade-in duration-200`}
            onClick={() => setShowQuickSetMenu(false)}
          >
            <div
              className={`${isMobile ? "w-full max-w-md rounded-t-3xl" : "w-full max-w-sm rounded-2xl"} bg-neutral-900 ${isMobile ? "animate-in slide-in-from-bottom duration-300" : "animate-in zoom-in-95 duration-200"} shadow-2xl max-h-[80vh] overflow-y-auto`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 bg-neutral-600 rounded-full" />
              </div>
              <div className="px-4 pb-2">
                <p className="text-foreground text-base font-medium text-center">Quick Set</p>
              </div>

              {/* Date Presets */}
              <div className="px-4 pb-1">
                <p className="text-neutral-400 text-xs font-medium">Date Range</p>
              </div>
              <div className="bg-neutral-800/60 rounded-2xl mx-4 mb-4 overflow-hidden">
                {QUICK_DATE_PRESETS.map((preset, index) => (
                  <div key={preset.label}>
                    {index > 0 && <div className="h-px bg-neutral-700/50 mx-4" />}
                    <button
                      onClick={() => applyQuickDatePreset(preset)}
                      className="w-full text-left px-4 py-3.5 text-sm font-medium text-foreground active:opacity-70 transition-colors"
                    >
                      {preset.label}
                    </button>
                  </div>
                ))}
              </div>

              {/* Time Presets */}
              <div className="px-4 pb-1">
                <p className="text-neutral-400 text-xs font-medium">Time Schedule</p>
              </div>
              <div className="bg-neutral-800/60 rounded-2xl mx-4 mb-4 overflow-hidden">
                {QUICK_TIME_PRESETS.map((preset, index) => (
                  <div key={preset.label}>
                    {index > 0 && <div className="h-px bg-neutral-700/50 mx-4" />}
                    <button
                      onClick={() => applyQuickTimePreset(preset)}
                      className="w-full text-left px-4 py-3.5 text-sm font-medium text-foreground active:opacity-70 transition-colors"
                    >
                      <span>{preset.label}</span>
                      <span className="text-neutral-500 text-xs ml-2">{preset.startTime} - {preset.endTime}</span>
                    </button>
                  </div>
                ))}
              </div>

              {/* Quick Actions */}
              <div className="px-4 pb-1">
                <p className="text-neutral-400 text-xs font-medium">Quick Actions</p>
              </div>
              <div className="bg-neutral-800/60 rounded-2xl mx-4 mb-6 overflow-hidden">
                <button
                  onClick={applyToWeekdays}
                  className="w-full text-left px-4 py-3.5 text-sm font-medium text-primary active:opacity-70 transition-colors"
                >
                  Apply to Weekdays
                </button>
                <div className="h-px bg-neutral-700/50 mx-4" />
                <button
                  onClick={applyToAllDays}
                  className="w-full text-left px-4 py-3.5 text-sm font-medium text-primary active:opacity-70 transition-colors"
                >
                  Apply to All Days
                </button>
              </div>
            </div>
          </div>
        )}
 
       {/* Copy Menu - Bottom sheet on mobile, centered popup on desktop */}
       {showCopyMenu && copySourceIndex !== null && (
         isMobile ? (
           <div
             className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 animate-in fade-in duration-200"
             onClick={() => { setShowCopyMenu(false); setCopySourceIndex(null); }}
           >
             <div
               className="w-full max-w-md bg-neutral-900 rounded-t-3xl animate-in slide-in-from-bottom duration-300 max-h-[80vh] overflow-y-auto"
               onClick={(e) => e.stopPropagation()}
             >
               <div className="flex justify-center pt-3 pb-2">
                 <div className="w-10 h-1 bg-neutral-600 rounded-full" />
               </div>
               <div className="px-4 pb-2">
                 <p className="text-neutral-400 text-base text-center">
                   Copy {daySchedules[copySourceIndex].day}'s schedule to:
                 </p>
               </div>
               <div className="bg-neutral-800/60 rounded-2xl mx-4 mb-4 overflow-hidden">
                 <button
                   className="w-full text-left px-4 py-4 text-base text-primary font-medium active:opacity-70 transition-opacity"
                   onClick={copyToAllDays}
                 >
                   All Days
                 </button>
                 <div className="h-px bg-neutral-700/50 mx-4" />
                 <button
                   className="w-full text-left px-4 py-4 text-base text-primary font-medium active:opacity-70 transition-opacity"
                   onClick={copyToWeekdays}
                 >
                   Weekdays Only
                 </button>
               </div>
               <div className="bg-neutral-800/60 rounded-2xl mx-4 mb-8 overflow-hidden">
                 {getOtherDays().map((schedule, index) => (
                   <div key={schedule.day}>
                     {index > 0 && <div className="h-px bg-neutral-700/50 mx-4" />}
                     <button
                       className="w-full text-left px-4 py-4 text-base text-foreground font-medium active:opacity-70 transition-opacity"
                       onClick={() => copyToDay(schedule.day)}
                     >
                       {schedule.day}
                     </button>
                   </div>
                 ))}
               </div>
             </div>
           </div>
         ) : (
           <div
             className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 animate-in fade-in duration-200"
             onClick={() => { setShowCopyMenu(false); setCopySourceIndex(null); }}
           >
             <div
               className="w-full max-w-sm bg-neutral-900 rounded-2xl animate-in zoom-in-95 duration-200 shadow-2xl max-h-[80vh] overflow-y-auto"
               onClick={(e) => e.stopPropagation()}
             >
               <div className="flex justify-center pt-3 pb-2">
                 <div className="w-10 h-1 bg-neutral-600 rounded-full" />
               </div>
               <div className="px-4 pb-2">
                 <p className="text-neutral-400 text-base text-center">
                   Copy {daySchedules[copySourceIndex].day}'s schedule to:
                 </p>
               </div>
               <div className="bg-neutral-800/60 rounded-2xl mx-4 mb-4 overflow-hidden">
                 <button
                   className="w-full text-left px-4 py-4 text-base text-primary font-medium hover:bg-neutral-700/30 active:opacity-70 transition-colors"
                   onClick={copyToAllDays}
                 >
                   All Days
                 </button>
                 <div className="h-px bg-neutral-700/50 mx-4" />
                 <button
                   className="w-full text-left px-4 py-4 text-base text-primary font-medium hover:bg-neutral-700/30 active:opacity-70 transition-colors"
                   onClick={copyToWeekdays}
                 >
                   Weekdays Only
                 </button>
               </div>
               <div className="bg-neutral-800/60 rounded-2xl mx-4 mb-6 overflow-hidden">
                 {getOtherDays().map((schedule, index) => (
                   <div key={schedule.day}>
                     {index > 0 && <div className="h-px bg-neutral-700/50 mx-4" />}
                     <button
                       className="w-full text-left px-4 py-4 text-base text-foreground font-medium hover:bg-neutral-700/30 active:opacity-70 transition-colors"
                       onClick={() => copyToDay(schedule.day)}
                     >
                       {schedule.day}
                     </button>
                   </div>
                 ))}
               </div>
             </div>
           </div>
         )
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
               onStartDateChange(tempSelectedDate);
               setShowStartDatePicker(false);
             }}
             selectedDate={tempSelectedDate}
             onDateChange={setTempSelectedDate}
             position={datePickerPosition}
           />
           <InlineDatePicker
             isOpen={showEndDatePicker}
             onClose={() => {
               onEndDateChange(tempSelectedDate);
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
               onDaySchedulesChange(daySchedules.map((schedule, i) => {
                 if (i === editingTimeIndex) {
                   return {
                     ...schedule,
                     [editingTimeType === "start" ? "startTime" : "endTime"]: time,
                   };
                 }
                 return schedule;
               }));
             }
           }}
           position={timePickerPosition}
         />
       )}
     </>
   );
 };
 
 export default ScheduleSection;