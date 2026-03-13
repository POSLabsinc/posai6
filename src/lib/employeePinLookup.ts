import { supabase } from "@/integrations/supabase/client";

export interface EmployeePinResult {
  id: string;
  full_name: string;
  role: string;
  pin: string;
  phone: string | null;
  email: string | null;
  avatar_url: string | null;
  hourly_rate: number;
  assigned_job_types: string[];
  revenue_center: string;
}

/**
 * Look up an employee by their PIN from the database.
 * Returns null if no matching employee found.
 */
export async function lookupEmployeeByPin(pin: string): Promise<EmployeePinResult | null> {
  const { data, error } = await (supabase as any)
    .from("employees")
    .select("id, full_name, role, pin, phone, email, avatar_url, hourly_rate, assigned_job_types, revenue_center")
    .eq("pin", pin)
    .eq("is_archived", false)
    .limit(1);

  if (error || !data || data.length === 0) return null;
  return data[0] as EmployeePinResult;
}

/**
 * Update an employee's PIN in the database.
 */
export async function updateEmployeePin(employeeId: string, newPin: string): Promise<boolean> {
  const { error } = await (supabase as any)
    .from("employees")
    .update({ pin: newPin })
    .eq("id", employeeId);

  return !error;
}

/**
 * Validate that a PIN belongs to an active employee.
 */
export async function validateEmployeePin(pin: string): Promise<boolean> {
  const employee = await lookupEmployeeByPin(pin);
  return employee !== null;
}

/**
 * Fetch all non-archived employees for display in employee selection lists.
 */
export async function fetchAllActiveEmployees(): Promise<EmployeePinResult[]> {
  const { data, error } = await (supabase as any)
    .from("employees")
    .select("id, full_name, role, pin, phone, email, avatar_url, hourly_rate, assigned_job_types, revenue_center")
    .eq("is_archived", false)
    .order("full_name");

  if (error || !data) return [];
  return data as EmployeePinResult[];
}
