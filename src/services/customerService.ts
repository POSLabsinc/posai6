import { supabase } from "@/integrations/supabase/client";

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  linkedProfiles?: string[];
  lastOrderDate?: string;
  orderCount?: number;
  loyaltyPointsBalance?: number;
  totalPointsEarned?: number;
  loyalty?: string;
}

export interface LoyaltyTransaction {
  id: string;
  guestId: string;
  points: number;
  balanceAfter: number;
  type: string;
  description: string;
  orderId?: string;
  createdAt: string;
}

/**
 * Search customers by name or phone (async, from database)
 */
export const searchCustomers = async (query: string): Promise<Customer[]> => {
  if (!query.trim()) return [];

  const normalizedQuery = query.toLowerCase().trim();
  const cleanDigits = query.replace(/\D/g, "");

  // Search by name (ilike) or phone (contains digits)
  let q = (supabase as any)
    .from("guests")
    .select("id, name, phone, email, loyalty, order_count, last_order_date, loyalty_points_balance, total_points_earned")
    .eq("is_archived", false);

  // Use OR filter: name ilike OR phone contains digits
  if (cleanDigits.length >= 3) {
    q = q.or(`name.ilike.%${normalizedQuery}%,phone.ilike.%${cleanDigits}%`);
  } else {
    q = q.ilike("name", `%${normalizedQuery}%`);
  }

  const { data, error } = await q.limit(20);
  if (error || !data) return [];

  return (data as any[]).map(mapGuestToCustomer);
};

/**
 * Find a customer by exact phone number
 */
export const findCustomerByPhone = async (phone: string): Promise<Customer | null> => {
  const cleanPhone = phone.replace(/\D/g, "");
  if (cleanPhone.length < 10) return null;

  const { data, error } = await (supabase as any)
    .from("guests")
    .select("id, name, phone, email, loyalty, order_count, last_order_date, loyalty_points_balance, total_points_earned")
    .eq("is_archived", false)
    .limit(20);

  if (error || !data) return null;

  // Match by last 10 digits
  const match = (data as any[]).find((g: any) => {
    const gDigits = (g.phone || "").replace(/\D/g, "");
    return gDigits.length >= 10 && gDigits.slice(-10) === cleanPhone.slice(-10);
  });

  return match ? mapGuestToCustomer(match) : null;
};

/**
 * Check if there's a phone conflict - phone exists but with a different name
 */
export const checkPhoneConflict = async (phone: string, name: string): Promise<Customer | null> => {
  const cleanPhone = phone.replace(/\D/g, "");
  if (cleanPhone.length !== 10) return null;
  if (!name.trim()) return null;

  const existing = await findCustomerByPhone(cleanPhone);
  if (!existing) return null;

  const existingNorm = existing.name.toLowerCase().trim();
  const newNorm = name.toLowerCase().trim();

  if (existingNorm !== newNorm) {
    return existing;
  }
  return null;
};

/**
 * Get loyalty points transaction history for a guest
 */
export const getCustomerLoyalty = async (guestId: string): Promise<LoyaltyTransaction[]> => {
  const { data, error } = await (supabase as any)
    .from("loyalty_points")
    .select("*")
    .eq("guest_id", guestId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error || !data) return [];

  return (data as any[]).map((t: any) => ({
    id: t.id,
    guestId: t.guest_id,
    points: t.points,
    balanceAfter: t.balance_after,
    type: t.type,
    description: t.description,
    orderId: t.order_id,
    createdAt: t.created_at,
  }));
};

// Helper to map DB guest row to Customer interface
function mapGuestToCustomer(g: any): Customer {
  return {
    id: g.id,
    name: g.name,
    phone: g.phone || "",
    email: g.email || undefined,
    orderCount: g.order_count || 0,
    lastOrderDate: g.last_order_date || undefined,
    loyaltyPointsBalance: g.loyalty_points_balance || 0,
    totalPointsEarned: g.total_points_earned || 0,
    loyalty: g.loyalty || undefined,
  };
}
