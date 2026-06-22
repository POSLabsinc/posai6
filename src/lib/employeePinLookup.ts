import { supabase } from "@/integrations/supabase/client";

export interface EmployeePinResult {
  id: string;
  full_name: string;
  role: string;
  /**
   * Deprecated: server no longer returns the plaintext PIN. Kept for callers that
   * still read this field; will be undefined for verified lookups.
   */
  pin?: string;
  phone: string | null;
  email: string | null;
  avatar_url: string | null;
  hourly_rate: number;
  assigned_job_types: string[];
  revenue_center: string;
}

/**
 * Look up an employee by their PIN. The PIN is sent to a Supabase Edge Function
 * that performs the lookup server-side using the service role key so the PIN
 * column is never exposed to anon clients.
 */
export async function lookupEmployeeByPin(pin: string): Promise<EmployeePinResult | null> {
  try {
    const { data, error } = await supabase.functions.invoke("verify-employee-pin", {
      body: { action: "verify", pin },
    });
    if (error) {
      console.error("verify-employee-pin invoke error:", error);
      return null;
    }
    const employee = (data as any)?.employee;
    if (!employee) return null;
    return employee as EmployeePinResult;
  } catch (err) {
    console.error("lookupEmployeeByPin failed:", err);
    return null;
  }
}

/**
 * Update an employee's PIN through the secure Edge Function.
 */
export async function updateEmployeePin(employeeId: string, newPin: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.functions.invoke("verify-employee-pin", {
      body: { action: "update", employeeId, newPin },
    });
    if (error) {
      console.error("verify-employee-pin update error:", error);
      return false;
    }
    return Boolean((data as any)?.success);
  } catch (err) {
    console.error("updateEmployeePin failed:", err);
    return false;
  }
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
 * The PIN column is no longer selected and is excluded by column-level grants.
 */
export async function fetchAllActiveEmployees(): Promise<EmployeePinResult[]> {
  const { data, error } = await (supabase as any)
    .from("employees")
    .select(
      "id, full_name, role, phone, email, avatar_url, hourly_rate, assigned_job_types, revenue_center"
    )
    .eq("is_archived", false)
    .order("full_name");

  if (error || !data) return [];
  return data as EmployeePinResult[];
}
