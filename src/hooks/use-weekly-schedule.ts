import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, parseISO } from "date-fns";

export interface ScheduleShift {
  id: string;
  shiftType: string;
  jobType: string;
  startTime: string;
  endTime: string;
  shiftDate: string;
}

export interface ScheduleEmployee {
  id: string;
  name: string;
  role: string;
  avatarUrl: string | null;
  hourlyRate: number;
  totalHours: number;
  totalPay: number;
  /** Map of "yyyy-MM-dd" → shifts on that day */
  shiftsByDay: Record<string, ScheduleShift[]>;
}

export interface RoleGroup {
  role: string;
  employeeCount: number;
  totalHours: number;
  employees: ScheduleEmployee[];
  color: string;
}

const ROLE_COLORS: Record<string, string> = {
  Manager: "bg-green-50 dark:bg-green-950/30",
  Server: "bg-gray-50 dark:bg-neutral-800/30",
  Bartender: "bg-amber-50 dark:bg-amber-950/20",
  Kitchen: "bg-orange-50 dark:bg-orange-950/20",
  Host: "bg-blue-50 dark:bg-blue-950/20",
  Admin: "bg-purple-50 dark:bg-purple-950/20",
};

const SHIFT_CARD_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  Manager: { bg: "bg-green-50 dark:bg-green-900/30", border: "border-green-200 dark:border-green-800/50", text: "text-green-700 dark:text-green-400" },
  Server: { bg: "bg-gray-50 dark:bg-neutral-700/30", border: "border-gray-200 dark:border-neutral-600/50", text: "text-gray-600 dark:text-neutral-300" },
  Bartender: { bg: "bg-amber-50 dark:bg-amber-900/30", border: "border-amber-200 dark:border-amber-800/50", text: "text-amber-700 dark:text-amber-400" },
  Kitchen: { bg: "bg-orange-50 dark:bg-orange-900/30", border: "border-orange-200 dark:border-orange-800/50", text: "text-orange-700 dark:text-orange-400" },
  Host: { bg: "bg-blue-50 dark:bg-blue-900/30", border: "border-blue-200 dark:border-blue-800/50", text: "text-blue-700 dark:text-blue-400" },
  Admin: { bg: "bg-purple-50 dark:bg-purple-900/30", border: "border-purple-200 dark:border-purple-800/50", text: "text-purple-700 dark:text-purple-400" },
};

export const getShiftCardColor = (role: string) =>
  SHIFT_CARD_COLORS[role] || SHIFT_CARD_COLORS.Server;

export const getRoleColor = (role: string) =>
  ROLE_COLORS[role] || ROLE_COLORS.Server;

const parseTimeToMinutes = (time: string | null): number | null => {
  if (!time) return null;
  try {
    // Handle "HH:MM" or "H:MM AM/PM" formats
    const cleaned = time.trim().toUpperCase();
    const ampmMatch = cleaned.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
    if (ampmMatch) {
      let h = parseInt(ampmMatch[1]);
      const m = parseInt(ampmMatch[2]);
      const period = ampmMatch[3];
      if (period === "AM" && h === 12) h = 0;
      if (period === "PM" && h !== 12) h += 12;
      return h * 60 + m;
    }
    // 24h format
    const parts = cleaned.split(":");
    return parseInt(parts[0]) * 60 + parseInt(parts[1]);
  } catch {
    return null;
  }
};

const parseHoursFromTimes = (start: string | null, end: string | null): number => {
  const sm = parseTimeToMinutes(start);
  const em = parseTimeToMinutes(end);
  if (sm === null || em === null) return 0;
  let diff = em - sm;
  if (diff < 0) diff += 24 * 60;
  return diff / 60;
};

export const useWeeklySchedule = (weekStart: Date) => {
  const start = startOfWeek(weekStart, { weekStartsOn: 1 }); // Mon
  const end = endOfWeek(weekStart, { weekStartsOn: 1 }); // Sun
  const startStr = format(start, "yyyy-MM-dd");
  const endStr = format(end, "yyyy-MM-dd");

  return useQuery({
    queryKey: ["weekly_schedule", startStr],
    queryFn: async () => {
      const [{ data: shifts, error: sErr }, { data: employees, error: eErr }] = await Promise.all([
        (supabase as any)
          .from("employee_shifts")
          .select("*")
          .gte("shift_date", startStr)
          .lte("shift_date", endStr),
        (supabase as any)
          .from("employees")
          .select("id, full_name, role, avatar_url, hourly_rate, is_archived")
          .eq("is_archived", false),
      ]);
      if (sErr) throw sErr;
      if (eErr) throw eErr;

      const empMap = new Map<string, any>();
      (employees || []).forEach((e: any) => empMap.set(e.id, e));

      // Group shifts by employee
      const empShifts = new Map<string, any[]>();
      (shifts || []).forEach((s: any) => {
        if (!s.employee_id) return;
        if (!empShifts.has(s.employee_id)) empShifts.set(s.employee_id, []);
        empShifts.get(s.employee_id)!.push(s);
      });

      // Build employee schedule objects
      const scheduleEmployees: ScheduleEmployee[] = [];
      empShifts.forEach((shiftList, empId) => {
        const emp = empMap.get(empId);
        if (!emp) return;

        const shiftsByDay: Record<string, ScheduleShift[]> = {};
        let totalHours = 0;

        shiftList.forEach((s: any) => {
          const dayKey = s.shift_date;
          const hours = parseHoursFromTimes(s.start_time, s.end_time);
          totalHours += hours;

          if (!shiftsByDay[dayKey]) shiftsByDay[dayKey] = [];
          shiftsByDay[dayKey].push({
            id: s.id,
            shiftType: s.shift_type || "Regular",
            jobType: s.job_type || emp.role || "Server",
            startTime: s.start_time || "",
            endTime: s.end_time || "",
            shiftDate: s.shift_date,
          });
        });

        scheduleEmployees.push({
          id: empId,
          name: emp.full_name,
          role: emp.role || "Server",
          avatarUrl: emp.avatar_url,
          hourlyRate: emp.hourly_rate || 0,
          totalHours: Math.round(totalHours * 10) / 10,
          totalPay: Math.round(totalHours * (emp.hourly_rate || 0) * 100) / 100,
          shiftsByDay,
        });
      });

      // Group by role
      const roleMap = new Map<string, ScheduleEmployee[]>();
      scheduleEmployees.forEach((se) => {
        const role = se.role;
        if (!roleMap.has(role)) roleMap.set(role, []);
        roleMap.get(role)!.push(se);
      });

      const roleGroups: RoleGroup[] = [];
      const roleOrder = ["Manager", "Server", "Bartender", "Kitchen", "Host", "Admin"];

      // Add known roles first, then unknown
      const allRoles = new Set([...roleOrder, ...roleMap.keys()]);
      allRoles.forEach((role) => {
        const emps = roleMap.get(role);
        if (!emps || emps.length === 0) return;
        const totalHours = emps.reduce((sum, e) => sum + e.totalHours, 0);
        roleGroups.push({
          role,
          employeeCount: emps.length,
          totalHours: Math.round(totalHours),
          employees: emps,
          color: getRoleColor(role),
        });
      });

      const totalShiftCount = (shifts || []).length;

      return { roleGroups, totalShiftCount, weekDays: eachDayOfInterval({ start, end }) };
    },
  });
};
