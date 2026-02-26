import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfWeek, endOfWeek } from "date-fns";

export interface ShiftCardData {
  id: string;
  name: string;
  badge: string;
  badgeColor: string;
  timeRange: string;
  dateRange: string;
  days: string[];
  employees: { id: string; name: string; avatar_url: string | null }[];
}

const getBadgeForShiftType = (shiftType: string | null): { badge: string; badgeColor: string } => {
  const type = (shiftType || "").toLowerCase();
  if (type.includes("opening") || type.includes("morning") || type.includes("first")) {
    return { badge: "Opening", badgeColor: "text-orange-400 bg-orange-400/15" };
  }
  if (type.includes("afternoon") || type.includes("mid") || type.includes("weekday")) {
    return { badge: "Afternoon", badgeColor: "text-blue-400 bg-blue-400/15" };
  }
  if (type.includes("evening") || type.includes("night") || type.includes("closing")) {
    return { badge: "Evening", badgeColor: "text-purple-400 bg-purple-400/15" };
  }
  return { badge: "Regular", badgeColor: "text-muted-foreground bg-muted/30" };
};

export const useShiftCards = (weekStart: Date, searchQuery: string, selectedShifts: string[], selectedJobTypes: string[]) => {
  const start = startOfWeek(weekStart, { weekStartsOn: 0 });
  const end = endOfWeek(weekStart, { weekStartsOn: 0 });
  const startStr = format(start, "yyyy-MM-dd");
  const endStr = format(end, "yyyy-MM-dd");

  return useQuery({
    queryKey: ["shift_cards", startStr, endStr],
    queryFn: async () => {
      // Fetch shifts in range
      const { data: shifts, error } = await (supabase as any)
        .from("employee_shifts")
        .select("*")
        .gte("shift_date", startStr)
        .lte("shift_date", endStr);
      if (error) throw error;

      // Fetch employees for avatars
      const { data: employees, error: empError } = await (supabase as any)
        .from("employees")
        .select("id, full_name, avatar_url");
      if (empError) throw empError;

      const empMap = new Map<string, { name: string; avatar_url: string | null }>();
      (employees || []).forEach((e: any) => empMap.set(e.id, { name: e.full_name, avatar_url: e.avatar_url }));

      // Group shifts by shift_type + start_time + end_time + start_date + end_date to form cards
      const cardMap = new Map<string, {
        id: string;
        shift_type: string;
        start_time: string;
        end_time: string;
        start_date: string;
        end_date: string;
        recurring: string;
        job_type: string;
        employeeIds: Set<string>;
      }>();

      (shifts || []).forEach((s: any) => {
        const key = `${s.shift_type || "Regular"}|${s.start_time || ""}|${s.end_time || ""}|${s.start_date || s.shift_date}|${s.end_date || s.shift_date}`;
        if (!cardMap.has(key)) {
          cardMap.set(key, {
            id: s.id,
            shift_type: s.shift_type || "Regular",
            start_time: s.start_time || "",
            end_time: s.end_time || "",
            start_date: s.start_date || s.shift_date,
            end_date: s.end_date || s.shift_date,
            recurring: s.recurring || "No",
            job_type: s.job_type || "",
            employeeIds: new Set<string>(),
          });
        }
        if (s.employee_id) {
          cardMap.get(key)!.employeeIds.add(s.employee_id);
        }
      });

      const cards: ShiftCardData[] = [];
      cardMap.forEach((val) => {
        const { badge, badgeColor } = getBadgeForShiftType(val.shift_type);
        const formatDate = (d: string) => {
          try {
            return format(new Date(d + "T00:00:00"), "dd MMM yy");
          } catch {
            return d;
          }
        };

        const empList = Array.from(val.employeeIds).map((eid) => {
          const emp = empMap.get(eid);
          return { id: eid, name: emp?.name || "Unknown", avatar_url: emp?.avatar_url || null };
        });

        // Compute day abbreviations from the date range
        const dayAbbrs: string[] = [];
        try {
          const s = new Date(val.start_date + "T00:00:00");
          const e = new Date(val.end_date + "T00:00:00");
          const abbrs = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
          const cur = new Date(s);
          const seen = new Set<number>();
          while (cur <= e && seen.size < 7) {
            const d = cur.getDay();
            if (!seen.has(d)) { seen.add(d); dayAbbrs.push(abbrs[d]); }
            cur.setDate(cur.getDate() + 1);
          }
        } catch { /* fallback empty */ }

        cards.push({
          id: val.id,
          name: val.shift_type,
          badge,
          badgeColor,
          timeRange: val.start_time && val.end_time ? `${val.start_time} - ${val.end_time}` : "Not set",
          dateRange: `${formatDate(val.start_date)} - ${formatDate(val.end_date)}`,
          days: dayAbbrs,
          employees: empList,
        });
      });

      return cards;
    },
  });
};
