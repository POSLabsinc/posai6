import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns";

export interface WeeklyShiftData {
  id: string;
  employee_id: string;
  shift_date: string;
  clock_in: string | null;
  clock_out: string | null;
  break_minutes: number;
  start_time: string | null;
  end_time: string | null;
  shift_type: string | null;
  job_type: string | null;
}

export const useWeeklyShifts = (weekStart: Date) => {
  const start = startOfWeek(weekStart, { weekStartsOn: 0 });
  const end = endOfWeek(weekStart, { weekStartsOn: 0 });
  const startStr = format(start, "yyyy-MM-dd");
  const endStr = format(end, "yyyy-MM-dd");

  return useQuery({
    queryKey: ["weekly_shifts", startStr],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employee_shifts")
        .select("*")
        .gte("shift_date", startStr)
        .lte("shift_date", endStr);
      if (error) throw error;
      return (data ?? []) as WeeklyShiftData[];
    },
  });
};

export const getWeekDays = (weekStart: Date) => {
  const start = startOfWeek(weekStart, { weekStartsOn: 0 });
  const end = endOfWeek(weekStart, { weekStartsOn: 0 });
  return eachDayOfInterval({ start, end });
};
