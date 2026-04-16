import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, Clock, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { CompactTimePicker } from "@/components/ui/compact-time-picker";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface AddEventContentProps {
  showHeader?: boolean;
  onBack?: () => void;
}

const AddEventContent = ({ showHeader = true, onBack }: AddEventContentProps) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const editId = searchParams.get("edit");
  const prefillDate = searchParams.get("date");
  const prefillStartTime = searchParams.get("start_time");

  // Convert 24h "HH:mm" to 12h "hh:mm AM/PM"
  const to12h = (t: string | null, fallback: string): string => {
    if (!t) return fallback;
    const [hStr, mStr] = t.split(":");
    let h = parseInt(hStr);
    const m = mStr || "00";
    const ampm = h >= 12 ? "PM" : "AM";
    if (h === 0) h = 12;
    else if (h > 12) h -= 12;
    return `${h.toString().padStart(2, "0")}:${m} ${ampm}`;
  };

  // Add 1 hour to a 12h time string
  const addOneHour = (time: string): string => {
    const m = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!m) return "01:00 PM";
    let h = parseInt(m[1]);
    const min = m[2];
    const p = m[3].toUpperCase();
    let h24 = h;
    if (p === "AM" && h === 12) h24 = 0;
    else if (p === "PM" && h !== 12) h24 = h + 12;
    h24 = (h24 + 1) % 24;
    const newP = h24 >= 12 ? "PM" : "AM";
    let h12 = h24 % 12;
    if (h12 === 0) h12 = 12;
    return `${h12.toString().padStart(2, "0")}:${min} ${newP}`;
  };

  const initialStartTime = to12h(prefillStartTime, "12:00 PM");

  // Fields
  const [eventTitle, setEventTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState<Date | undefined>(
    prefillDate ? new Date(prefillDate + "T00:00:00") : undefined
  );
  const [showCalendar, setShowCalendar] = useState(false);
  const [startTime, setStartTime] = useState(initialStartTime);
  const [endTime, setEndTime] = useState(addOneHour(initialStartTime));
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [multiDay, setMultiDay] = useState(false);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [showEndCalendar, setShowEndCalendar] = useState(false);
  const [endDateTime, setEndDateTime] = useState("05:00 PM");
  const [showEndDateTimePicker, setShowEndDateTimePicker] = useState(false);
  const [repeat, setRepeat] = useState("Never");
  const [showRepeatPicker, setShowRepeatPicker] = useState(false);
  const isEditing = !!editId;

  // Load existing event data when editing
  useEffect(() => {
    if (!editId) return;
    try {
      const events = JSON.parse(localStorage.getItem("pos_events") || "[]");
      const ev = events.find((e: any) => e.id === editId);
      if (ev) {
        setEventTitle(ev.title || "");
        setDescription(ev.description || "");
        setEventDate(ev.date ? new Date(ev.date + "T00:00:00") : undefined);
        setStartTime(ev.startTime || initialStartTime);
        setEndTime(ev.endTime || addOneHour(initialStartTime));
        setMultiDay(ev.multiDay || false);
        setEndDate(ev.endDate ? new Date(ev.endDate + "T00:00:00") : undefined);
        setEndDateTime(ev.endDateTime || "05:00 PM");
        setRepeat(ev.repeat || "Never");
      }
    } catch {}
  }, [editId]);

  const goBack = onBack || (() => navigate("/settings/workforce/shift"));

  const isFormEmpty = !eventTitle.trim() && !description.trim();

  const handleCreate = () => {
    if (!isEditing && isFormEmpty) {
      goBack();
      return;
    }
    if (!eventTitle.trim()) {
      toast.error("Please enter an event title");
      return;
    }

    const events = JSON.parse(localStorage.getItem("pos_events") || "[]");
    const eventData = {
      id: isEditing ? editId : crypto.randomUUID(),
      title: eventTitle.trim(),
      description: description.trim(),
      date: eventDate ? format(eventDate, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
      startTime,
      endTime,
      multiDay,
      endDate: multiDay && endDate ? format(endDate, "yyyy-MM-dd") : null,
      endDateTime: multiDay ? endDateTime : null,
      repeat,
      createdAt: new Date().toISOString(),
    };

    if (isEditing) {
      const idx = events.findIndex((e: any) => e.id === editId);
      if (idx >= 0) events[idx] = eventData;
      else events.push(eventData);
    } else {
      events.push(eventData);
    }
    localStorage.setItem("pos_events", JSON.stringify(events));
    window.dispatchEvent(new Event("events-updated"));
    toast.success(isEditing ? "Event updated successfully" : "Event created successfully");
    goBack();
  };

  /* ── Helper description text ── */
  const FieldHint = ({ text }: { text: string }) => (
    <p className="text-[11px] text-neutral-500 px-4 -mt-1 pb-2">{text}</p>
  );

  /* ── Reusable components matching Add Shift exactly ── */
  const FieldRow = ({
    label,
    value,
    onClick,
    rightIcon,
  }: {
    label: string;
    value: string;
    onClick?: () => void;
    rightIcon?: React.ReactNode;
  }) => (
    <button onClick={onClick} className="flex items-center justify-between w-full px-4 py-3.5">
      <span className="text-sm text-foreground font-medium">{label}</span>
      <div className="flex items-center gap-1">
        <span className="text-sm text-neutral-400">{value}</span>
        {rightIcon || <ChevronRight className="w-4 h-4 text-neutral-600 shrink-0" />}
      </div>
    </button>
  );

  const ToggleRow = ({
    label,
    value,
    onChange,
  }: {
    label: string;
    value: boolean;
    onChange: () => void;
  }) => (
    <div className="flex items-center justify-between px-4 py-3.5">
      <span className="text-sm text-foreground font-medium">{label}</span>
      <button
        onClick={onChange}
        className={`w-12 h-7 rounded-full transition-colors ${value ? "bg-white" : "bg-neutral-700"} relative`}
      >
        <div className={`w-[22px] h-[22px] rounded-full absolute top-[3px] transition-transform ${value ? "translate-x-[22px] bg-neutral-800" : "translate-x-[3px] bg-white"}`} />
      </button>
    </div>
  );

  const Divider = () => <div className="border-b border-neutral-700/30 mx-0" />;

  /* ── Selection Popup ── */
  const SelectionPopup = ({
    title,
    options,
    selected,
    onSelect,
    onClose,
  }: {
    title: string;
    options: string[];
    selected: string;
    onSelect: (val: string) => void;
    onClose: () => void;
  }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60" />
      <div className="relative" onClick={(e) => e.stopPropagation()}>
        <div className="bg-neutral-800 rounded-2xl w-[340px] max-h-[500px] overflow-hidden">
          <div className="px-4 py-3 border-b border-neutral-700/50">
            <h3 className="text-sm font-semibold text-foreground text-center">{title}</h3>
          </div>
          <div className="overflow-y-auto max-h-[440px] scrollbar-hide">
            {options.map((option) => (
              <button
                key={option}
                onClick={() => onSelect(option)}
                className={`flex items-center justify-between w-full px-4 py-3.5 active:opacity-70 transition-opacity ${selected === option ? "bg-neutral-700/40" : ""}`}
              >
                <span className="text-sm font-medium text-foreground">{option}</span>
                {selected === option && (
                  <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-neutral-800" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-full overflow-hidden flex flex-col">
      {/* Header */}
      {showHeader && (
        <div className="flex items-center px-4 py-3 shrink-0 relative">
          <button onClick={handleCreate} className="w-10 h-10 rounded-full bg-neutral-800/60 flex items-center justify-center active:opacity-70 transition-opacity">
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-lg font-semibold text-foreground absolute left-1/2 -translate-x-1/2">{isEditing ? "Edit Event" : "Add Event"}</h1>
        </div>
      )}

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto scrollbar-hide pb-6">
        {/* Main fields card */}
        <div className="mx-4 bg-[#26262699] rounded-2xl overflow-hidden">
          {/* Event Title */}
          <div className="flex items-center justify-between px-4 py-3.5">
            <span className="text-sm text-foreground font-medium">Event Title</span>
            <input
              type="text"
              placeholder="Enter"
              value={eventTitle}
              onChange={(e) => setEventTitle(e.target.value)}
              className="text-right text-sm text-neutral-400 placeholder:text-neutral-500 bg-transparent outline-none w-40"
            />
          </div>
          <Divider />

          {/* Description */}
          <div className="px-4 py-3.5">
            <span className="text-sm text-foreground font-medium mb-2 block">Description</span>
            <textarea
              placeholder="Enter event description (optional)..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full bg-transparent text-sm text-foreground placeholder:text-neutral-600 outline-none resize-none"
            />
          </div>
        </div>
        <p className="text-[11px] text-neutral-500 mx-5 mt-1.5 mb-4">Enter the event name and an optional description with extra details or notes</p>

        {/* Date & Time card */}
        <div className="mx-4 bg-[#26262699] rounded-2xl overflow-hidden">
          {/* Date */}
          <button
            onClick={() => setShowCalendar(!showCalendar)}
            className="flex items-center justify-between w-full px-4 py-3.5"
          >
            <span className="text-sm text-foreground font-medium">Date</span>
            <div className="flex items-center gap-1">
              <span className="text-sm text-neutral-400">
                {eventDate ? format(eventDate, "MM/dd/yyyy") : "Select"}
              </span>
              <CalendarIcon className="w-4 h-4 text-neutral-500 shrink-0" />
            </div>
          </button>
          {showCalendar && (
            <div className="px-2 pb-3 flex justify-center">
              <Calendar
                mode="single"
                selected={eventDate}
                onSelect={(d) => { setEventDate(d); setShowCalendar(false); }}
                className={cn("p-3 pointer-events-auto rounded-xl bg-neutral-800/80")}
                numberOfMonths={1}
              />
            </div>
          )}
          <Divider />

          {/* Start Time */}
          <div className="relative">
            <button
              onClick={() => { setShowStartTimePicker(!showStartTimePicker); setShowEndTimePicker(false); }}
              className="flex items-center justify-between w-full px-4 py-3.5"
            >
              <span className="text-sm text-foreground font-medium">Start Time</span>
              <div className="flex items-center gap-1.5">
                <span className="text-sm text-primary">{startTime}</span>
                <Clock className="w-4 h-4 text-primary shrink-0" />
              </div>
            </button>
            {showStartTimePicker && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowStartTimePicker(false)} />
                <div className="absolute right-4 top-full mt-1 z-50 overflow-hidden" style={{ width: 200 }}>
                  <CompactTimePicker selectedTime={startTime} onTimeChange={setStartTime} />
                </div>
              </>
            )}
          </div>
          <Divider />

          {/* End Time */}
          <div className="relative">
            <button
              onClick={() => { setShowEndTimePicker(!showEndTimePicker); setShowStartTimePicker(false); }}
              className="flex items-center justify-between w-full px-4 py-3.5"
            >
              <span className="text-sm text-foreground font-medium">End Time</span>
              <div className="flex items-center gap-1.5">
                <span className="text-sm text-primary">{endTime}</span>
                <Clock className="w-4 h-4 text-primary shrink-0" />
              </div>
            </button>
            {showEndTimePicker && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowEndTimePicker(false)} />
                <div className="absolute right-4 top-full mt-1 z-50 overflow-hidden" style={{ width: 200 }}>
                  <CompactTimePicker selectedTime={endTime} onTimeChange={setEndTime} />
                </div>
              </>
            )}
          </div>
        </div>
        <p className="text-[11px] text-neutral-500 mx-5 mt-1.5 mb-4">Choose the date and start/end times for this event</p>

        {/* Multi-Day Event */}
        <div className="mx-4 bg-[#26262699] rounded-2xl overflow-hidden">
          <ToggleRow label="Multi-Day Event" value={multiDay} onChange={() => setMultiDay(!multiDay)} />

          {multiDay && (
            <>
              <Divider />
              {/* End Date */}
              <button
                onClick={() => setShowEndCalendar(!showEndCalendar)}
                className="flex items-center justify-between w-full px-4 py-3.5"
              >
                <span className="text-sm text-foreground font-medium">End Date</span>
                <div className="flex items-center gap-1">
                  <span className="text-sm text-neutral-400">
                    {endDate ? format(endDate, "MM/dd/yyyy") : "Select"}
                  </span>
                  <CalendarIcon className="w-4 h-4 text-neutral-500 shrink-0" />
                </div>
              </button>
              {showEndCalendar && (
                <div className="px-2 pb-3 flex justify-center">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(d) => { setEndDate(d); setShowEndCalendar(false); }}
                    disabled={(date) => eventDate ? date < eventDate : false}
                    className={cn("p-3 pointer-events-auto rounded-xl bg-neutral-800/80")}
                    numberOfMonths={1}
                  />
                </div>
              )}
              <Divider />

              {/* End Time (for multi-day) */}
              <div className="relative">
                <button
                  onClick={() => setShowEndDateTimePicker(!showEndDateTimePicker)}
                  className="flex items-center justify-between w-full px-4 py-3.5"
                >
                  <span className="text-sm text-foreground font-medium">End Time</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm text-primary">{endDateTime}</span>
                    <Clock className="w-4 h-4 text-primary shrink-0" />
                  </div>
                </button>
                {showEndDateTimePicker && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowEndDateTimePicker(false)} />
                    <div className="absolute right-4 top-full mt-1 z-50 overflow-hidden" style={{ width: 200 }}>
                      <CompactTimePicker selectedTime={endDateTime} onTimeChange={setEndDateTime} />
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>
        <p className="text-[11px] text-neutral-500 mx-5 mt-1.5 mb-4">Enable for events spanning multiple days, then set the end date and time</p>

        {/* Repeat */}
        <div className="mx-4 bg-[#26262699] rounded-2xl overflow-hidden">
          <FieldRow
            label="Repeat"
            value={repeat}
            onClick={() => setShowRepeatPicker(true)}
          />
        </div>
        <p className="text-[11px] text-neutral-500 mx-5 mt-1.5 mb-4">Set how often this event recurs: Never, Daily, Weekly, or Monthly</p>
      </div>

      {/* Repeat Popup */}
      {showRepeatPicker && (
        <SelectionPopup
          title="Repeat"
          options={["Never", "Daily", "Weekly", "Monthly"]}
          selected={repeat}
          onSelect={(val) => { setRepeat(val); setShowRepeatPicker(false); }}
          onClose={() => setShowRepeatPicker(false)}
        />
      )}
    </div>
  );
};

export default AddEventContent;
