import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Plus, Search, Archive, Mic } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import AnimatedAIIcon from "@/components/AnimatedAIIcon";

interface Schedule {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  days: string[];
}

interface ScheduleInformationContentProps {
  showHeader?: boolean;
  onBack?: () => void;
  onAIClick?: () => void;
}

const ScheduleInformationContent = ({
  showHeader = true,
  onBack,
  onAIClick,
}: ScheduleInformationContentProps) => {
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showArchived, setShowArchived] = useState(false);

  const goBack = onBack || (() => navigate("/settings/workforce"));

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("employee_shifts")
      .select("id, shift_date, start_date, end_date, shift_type, job_type, employee_id, start_time, end_time")
      .order("shift_date", { ascending: true });

    if (!error && data) {
      const grouped = new Map<string, Schedule>();
      for (const shift of data) {
        const name = shift.job_type || shift.shift_type || "Unnamed Schedule";
        const key = `${name}-${shift.start_date || shift.shift_date}-${shift.end_date || shift.shift_date}`;
        if (!grouped.has(key)) {
          const dayOfWeek = format(new Date(shift.shift_date + "T00:00:00"), "EEE");
          grouped.set(key, {
            id: shift.id,
            name,
            start_date: shift.start_date || shift.shift_date,
            end_date: shift.end_date || shift.shift_date,
            days: [dayOfWeek],
          });
        } else {
          const existing = grouped.get(key)!;
          const dayOfWeek = format(new Date(shift.shift_date + "T00:00:00"), "EEE");
          if (!existing.days.includes(dayOfWeek)) {
            existing.days.push(dayOfWeek);
          }
        }
      }
      setSchedules(Array.from(grouped.values()));
    }
    setLoading(false);
  };

  const filteredSchedules = schedules.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr + "T00:00:00"), "MM/dd/yyyy");
    } catch {
      return dateStr;
    }
  };

  const dayOrder = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const sortDays = (days: string[]) =>
    [...days].sort((a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b));

  return (
    <div className="h-full overflow-y-auto scrollbar-hide overscroll-contain">
      <div className="pt-0 px-6 pb-28">
        {showHeader && (
          <div className="flex items-center justify-between pt-4 pb-2 relative overflow-visible px-0">
            {onBack && (
              <button
                onClick={goBack}
                className="w-10 h-10 rounded-full bg-neutral-800/60 flex items-center justify-center active:opacity-70 transition-opacity"
                aria-label="Back"
              >
                <ChevronLeft className="w-5 h-5 text-foreground" />
              </button>
            )}
            <h1 className="text-base font-medium text-foreground absolute left-1/2 -translate-x-1/2">
              Schedule Information
            </h1>
            <div className="overflow-visible flex items-center justify-center" style={{ width: 32, height: 32 }}>
              <AnimatedAIIcon size={24} onClick={onAIClick || (() => navigate('/settings/ai'))} />
            </div>
          </div>
        )}

        {showSearch && (
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search schedules..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#252525] rounded-full px-4 py-3 text-sm text-foreground placeholder:text-neutral-500 outline-none"
              autoFocus
            />
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-neutral-500">
            Manage and create the different operating schedules of your restaurant
          </p>
          <div className="flex items-center gap-2 flex-shrink-0 ml-4">
            <button className="w-10 h-10 rounded-full bg-[#252525] flex items-center justify-center active:opacity-70 transition-opacity">
              <Save className="w-5 h-5 text-neutral-400" />
            </button>
            <button className="w-10 h-10 rounded-full bg-foreground flex items-center justify-center active:opacity-70 transition-opacity">
              <Plus className="w-5 h-5 text-background" />
            </button>
          </div>
        </div>

        {/* Table Header */}
        <div className="bg-[#252525] rounded-t-2xl overflow-hidden">
          <div className="grid grid-cols-4 px-5 py-3 border-b border-neutral-700/50">
            <span className="text-sm font-medium text-foreground">Name</span>
            <span className="text-sm font-medium text-foreground">Start Date</span>
            <span className="text-sm font-medium text-foreground">End Date</span>
            <span className="text-sm font-medium text-foreground text-right">Days</span>
          </div>

          {loading ? (
            <div className="px-5 py-8 text-center text-neutral-500 text-sm">
              Loading schedules...
            </div>
          ) : filteredSchedules.length === 0 ? (
            <div className="px-5 py-8 text-center text-neutral-500 text-sm">
              No schedules found
            </div>
          ) : (
            filteredSchedules.map((schedule, index) => (
              <button
                key={schedule.id + "-" + index}
                className="grid grid-cols-4 px-5 py-4 w-full text-left items-center active:bg-neutral-700/30 transition-colors border-b border-neutral-700/20 last:border-b-0"
              >
                <span className="text-sm text-foreground">{schedule.name}</span>
                <span className="text-sm text-neutral-400">{formatDate(schedule.start_date)}</span>
                <span className="text-sm text-neutral-400">{formatDate(schedule.end_date)}</span>
                <div className="flex items-center justify-end gap-1">
                  <span className="text-sm text-neutral-400">
                    {sortDays(schedule.days).join(", ")}
                  </span>
                  <ChevronRight className="w-4 h-4 text-neutral-500 flex-shrink-0" />
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ScheduleInformationContent;
