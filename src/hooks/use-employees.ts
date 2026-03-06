import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

export interface Employee {
  id: string;
  full_name: string;
  role: string;
  phone: string | null;
  email: string | null;
  avatar_url: string | null;
  hourly_rate: number;
  is_archived: boolean;
  is_on_leave: boolean;
  pin: string | null;
  created_at: string;
}

export interface EmployeeShift {
  id: string;
  employee_id: string;
  shift_date: string;
  clock_in: string | null;
  clock_out: string | null;
  break_minutes: number;
  total_orders: number;
  total_tips: number;
}

export const useEmployees = (showArchived: boolean = false) => {
  return useQuery({
    queryKey: ["employees", showArchived],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("employees")
        .select("*")
        .eq("is_archived", showArchived)
        .order("full_name");
      if (error) throw error;
      return data as Employee[];
    },
  });
};

export const useAllEmployeeShiftsForDate = (date: Date) => {
  const dateStr = format(date, "yyyy-MM-dd");
  return useQuery({
    queryKey: ["all_employee_shifts", dateStr],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("employee_shifts")
        .select("*")
        .eq("shift_date", dateStr);
      if (error) throw error;
      return (data as EmployeeShift[]) || [];
    },
  });
};

export const useEmployeeShifts = (employeeId: string | null, date: Date) => {
  const dateStr = format(date, "yyyy-MM-dd");
  return useQuery({
    queryKey: ["employee_shifts", employeeId, dateStr],
    queryFn: async () => {
      if (!employeeId) return null;
      const { data, error } = await (supabase as any)
        .from("employee_shifts")
        .select("*")
        .eq("employee_id", employeeId)
        .eq("shift_date", dateStr)
        .maybeSingle();
      if (error) throw error;
      return data as EmployeeShift | null;
    },
    enabled: !!employeeId,
  });
};

export const useClockIn = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ employeeId, date }: { employeeId: string; date: Date }) => {
      const dateStr = format(date, "yyyy-MM-dd");
      // Check if shift exists
      const { data: existing } = await (supabase as any)
        .from("employee_shifts")
        .select("id")
        .eq("employee_id", employeeId)
        .eq("shift_date", dateStr)
        .maybeSingle();

      if (existing) {
        const { error } = await (supabase as any)
          .from("employee_shifts")
          .update({ clock_in: new Date().toISOString() })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any)
          .from("employee_shifts")
          .insert({ employee_id: employeeId, shift_date: dateStr, clock_in: new Date().toISOString() });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee_shifts"] });
      queryClient.invalidateQueries({ queryKey: ["all_employee_shifts"] });
    },
  });
};

export const useClockOut = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ employeeId, date }: { employeeId: string; date: Date }) => {
      const dateStr = format(date, "yyyy-MM-dd");
      const { error } = await (supabase as any)
        .from("employee_shifts")
        .update({ clock_out: new Date().toISOString() })
        .eq("employee_id", employeeId)
        .eq("shift_date", dateStr);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee_shifts"] });
      queryClient.invalidateQueries({ queryKey: ["all_employee_shifts"] });
    },
  });
};

export const useAddEmployee = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (employee: { full_name: string; role: string; phone?: string; email?: string; hourly_rate?: number; pin?: string }) => {
      const { error } = await (supabase as any).from("employees").insert(employee);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["employees"] }),
  });
};

export const useUpdateEmployee = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; full_name?: string; role?: string; phone?: string | null; email?: string | null; hourly_rate?: number; pin?: string; revenue_center?: string; assigned_job_types?: string[] }) => {
      const { error } = await (supabase as any).from("employees").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["employees"] }),
  });
};

export const useEmployeeByPin = () => {
  return useMutation({
    mutationFn: async (pin: string) => {
      const { data, error } = await (supabase as any)
        .from("employees")
        .select("*")
        .eq("pin", pin)
        .eq("is_archived", false)
        .maybeSingle();
      if (error) throw error;
      return data as Employee | null;
    },
  });
};

export const useArchiveEmployee = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ employeeId, archive }: { employeeId: string; archive: boolean }) => {
      const { error } = await (supabase as any)
        .from("employees")
        .update({ is_archived: archive })
        .eq("id", employeeId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["employees"] }),
  });
};

// Store Access hooks
export interface EmployeeStore {
  id: string;
  employee_id: string;
  store_id: string;
  is_primary: boolean;
}

export const useStores = () => {
  return useQuery({
    queryKey: ["stores"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("stores")
        .select("*")
        .eq("active", true)
        .order("name");
      if (error) throw error;
      return data as { id: string; name: string; location: string; address: string }[];
    },
  });
};

export const useEmployeeStores = (employeeId: string | null) => {
  return useQuery({
    queryKey: ["employee_stores", employeeId],
    queryFn: async () => {
      if (!employeeId) return [];
      const { data, error } = await (supabase as any)
        .from("employee_stores")
        .select("*")
        .eq("employee_id", employeeId);
      if (error) throw error;
      return data as EmployeeStore[];
    },
    enabled: !!employeeId,
  });
};

export const useSaveEmployeeStores = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ employeeId, storeIds, primaryStoreId }: { employeeId: string; storeIds: string[]; primaryStoreId: string | null }) => {
      // Delete existing assignments
      const { error: delError } = await (supabase as any)
        .from("employee_stores")
        .delete()
        .eq("employee_id", employeeId);
      if (delError) throw delError;

      // Insert new assignments
      if (storeIds.length > 0) {
        const rows = storeIds.map(sid => ({
          employee_id: employeeId,
          store_id: sid,
          is_primary: sid === primaryStoreId,
        }));
        const { error: insError } = await (supabase as any)
          .from("employee_stores")
          .insert(rows);
        if (insError) throw insError;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["employee_stores"] }),
  });
};
