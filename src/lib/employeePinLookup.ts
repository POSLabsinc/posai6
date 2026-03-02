import { supabase } from "@/integrations/supabase/client";

const db = supabase as any;

export interface EmployeePinResult {
  id: string;
  full_name: string;
  role: string;
  phone: string | null;
  email: string | null;
  avatar_url: string | null;
  hourly_rate: number;
}

export async function lookupEmployeeByPin(pin: string): Promise<EmployeePinResult | null> {
  const { data, error } = await db
    .from("employees")
    .select("id, full_name, role, phone, email, avatar_url, hourly_rate")
    .eq("pin", pin)
    .eq("is_archived", false)
    .maybeSingle();

  if (error || !data) return null;
  return data as EmployeePinResult;
}

export async function fetchAllActiveEmployees(): Promise<EmployeePinResult[]> {
  const { data, error } = await db
    .from("employees")
    .select("id, full_name, role, phone, email, avatar_url, hourly_rate")
    .eq("is_archived", false)
    .order("full_name");

  if (error || !data) return [];
  return data as EmployeePinResult[];
}
