import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";

interface OrderSummary {
  numberOfOrders: number;
  numberOfRefunds: number;
  refundAmount: number;
  netSales: number;
  discounts: number;
  tips: number;
  tax: number;
  total: number;
}

interface PaymentTypeSummary {
  type: string;
  transactions: number;
  amount: number;
}

interface CategorySummary {
  name: string;
  products: number;
  sales: number;
}

export interface KPIs {
  totalSales: number;
  orderCount: number;
  averageOrderValue: number;
  unitsSold: number;
}

export interface HourlyPoint { hour: string; sales: number; orders: number }
export interface DailyPoint { date: string; sales: number; orders: number }
export interface TopItem { name: string; units: number; revenue: number }

export interface ReportsData {
  orderSummary: OrderSummary;
  paymentTypes: PaymentTypeSummary[];
  categories: CategorySummary[];
  kpis: KPIs;
  salesByHour: HourlyPoint[];
  salesByDay: DailyPoint[];
  topItems: TopItem[];
  rawOrderCount: number;
  loading: boolean;
  error: string | null;
}

export function useReportsData(
  startDate: Date,
  endDate: Date,
  startTime: string,
  endTime: string
): ReportsData {
  const [orders, setOrders] = useState<any[]>([]);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Build ISO date range from date + time
  const startISO = useMemo(() => {
    const d = new Date(startDate);
    const [h, m] = startTime.split(":").map(Number);
    d.setHours(h, m, 0, 0);
    return d.toISOString();
  }, [startDate, startTime]);

  const endISO = useMemo(() => {
    const d = new Date(endDate);
    const [h, m] = endTime.split(":").map(Number);
    d.setHours(h, m, 59, 999);
    return d.toISOString();
  }, [endDate, endTime]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [ordersRes, itemsRes] = await Promise.all([
          (supabase as any)
            .from("orders")
            .select("*")
            .gte("created_at", startISO)
            .lte("created_at", endISO)
            .order("created_at", { ascending: false }),
          (supabase as any)
            .from("order_items")
            .select("*, orders!inner(created_at)")
            .gte("orders.created_at", startISO)
            .lte("orders.created_at", endISO),
        ]);

        if (ordersRes.error) throw ordersRes.error;
        if (itemsRes.error) throw itemsRes.error;

        setOrders(ordersRes.data || []);
        setOrderItems(itemsRes.data || []);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [startISO, endISO]);

  const orderSummary = useMemo<OrderSummary>(() => {
    const completed = orders.filter((o) => o.status === "completed");
    const refunded = orders.filter((o) => o.status === "refunded");
    return {
      numberOfOrders: completed.length,
      numberOfRefunds: refunded.length,
      refundAmount: refunded.reduce((s: number, o: any) => s + Number(o.refund_amount), 0),
      netSales: completed.reduce((s: number, o: any) => s + Number(o.subtotal) - Number(o.discount_amount), 0),
      discounts: orders.reduce((s: number, o: any) => s + Number(o.discount_amount), 0),
      tips: orders.reduce((s: number, o: any) => s + Number(o.tip_amount), 0),
      tax: completed.reduce((s: number, o: any) => s + Number(o.tax_amount), 0),
      total: completed.reduce((s: number, o: any) => s + Number(o.total), 0),
    };
  }, [orders]);

  const paymentTypes = useMemo<PaymentTypeSummary[]>(() => {
    const map = new Map<string, { transactions: number; amount: number }>();
    orders
      .filter((o) => o.status === "completed")
      .forEach((o) => {
        const existing = map.get(o.payment_type) || { transactions: 0, amount: 0 };
        map.set(o.payment_type, {
          transactions: existing.transactions + 1,
          amount: existing.amount + Number(o.total),
        });
      });
    return Array.from(map.entries()).map(([type, data]) => ({
      type,
      transactions: data.transactions,
      amount: data.amount,
    }));
  }, [orders]);

  const categories = useMemo<CategorySummary[]>(() => {
    const map = new Map<string, { products: number; sales: number }>();
    // Only include items from completed orders
    const completedOrderIds = new Set(
      orders.filter((o) => o.status === "completed").map((o) => o.id)
    );
    orderItems
      .filter((item) => completedOrderIds.has(item.order_id))
      .forEach((item) => {
        const existing = map.get(item.category) || { products: 0, sales: 0 };
        map.set(item.category, {
          products: existing.products + Number(item.quantity),
          sales: existing.sales + Number(item.total_price),
        });
      });
    return Array.from(map.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.sales - a.sales);
  }, [orders, orderItems]);

  const kpis = useMemo<KPIs>(() => {
    const completed = orders.filter((o) => o.status === "completed");
    const totalSales = completed.reduce((s, o) => s + Number(o.total || 0), 0);
    const orderCount = completed.length;
    const completedIds = new Set(completed.map((o) => o.id));
    const unitsSold = orderItems
      .filter((i) => completedIds.has(i.order_id))
      .reduce((s, i) => s + Number(i.quantity || 0), 0);
    return {
      totalSales,
      orderCount,
      averageOrderValue: orderCount ? totalSales / orderCount : 0,
      unitsSold,
    };
  }, [orders, orderItems]);

  const salesByHour = useMemo<HourlyPoint[]>(() => {
    const buckets = Array.from({ length: 24 }, (_, h) => ({
      hour: `${String(h).padStart(2, "0")}:00`,
      sales: 0,
      orders: 0,
    }));
    orders
      .filter((o) => o.status === "completed")
      .forEach((o) => {
        const h = new Date(o.created_at).getHours();
        buckets[h].sales += Number(o.total || 0);
        buckets[h].orders += 1;
      });
    return buckets;
  }, [orders]);

  const salesByDay = useMemo<DailyPoint[]>(() => {
    const map = new Map<string, { sales: number; orders: number }>();
    orders
      .filter((o) => o.status === "completed")
      .forEach((o) => {
        const d = new Date(o.created_at);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        const cur = map.get(key) || { sales: 0, orders: 0 };
        cur.sales += Number(o.total || 0);
        cur.orders += 1;
        map.set(key, cur);
      });
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({ date, ...v }));
  }, [orders]);

  const topItems = useMemo<TopItem[]>(() => {
    const completedIds = new Set(orders.filter((o) => o.status === "completed").map((o) => o.id));
    const map = new Map<string, { units: number; revenue: number }>();
    orderItems
      .filter((i) => completedIds.has(i.order_id))
      .forEach((i) => {
        const cur = map.get(i.item_name) || { units: 0, revenue: 0 };
        cur.units += Number(i.quantity || 0);
        cur.revenue += Number(i.total_price || 0);
        map.set(i.item_name, cur);
      });
    return Array.from(map.entries())
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8);
  }, [orders, orderItems]);

  return {
    orderSummary,
    paymentTypes,
    categories,
    kpis,
    salesByHour,
    salesByDay,
    topItems,
    rawOrderCount: orders.length,
    loading,
    error,
  };
}
