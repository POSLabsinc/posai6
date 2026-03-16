import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useCallback } from 'react';

// ─── Types ───────────────────────────────────────────────────
export interface TicketOrderItemRow {
  id: string;
  order_id: string;
  qty: number;
  name: string;
  price: number;
  seats: number[];
  modifiers: string[];
  is_shared: boolean;
  is_fired: boolean;
  no_tax: boolean;
  sort_order: number;
  created_at: string;
}

export interface TicketOrderRow {
  id: string;
  order_number: number;
  name: string;
  phone: string;
  party_size: number;
  time: string;
  timer: string;
  server: string;
  check_number: string;
  payment_type: string;
  payments: any[] | null;
  revenue_center: string;
  status: string;
  notes: string;
  table_id: string;
  order_type: string;
  subtotal: number;
  discount: number;
  service_charge: number;
  tax: number;
  tip: number;
  total: number;
  paid_amount: string | null;
  payment_status: string | null;
  transfer_info: any | null;
  merged_from: any | null;
  transferred_from: any | null;
  session_id: string | null;
  split_configuration: any | null;
  refund_amount: number;
  refund_reason: string | null;
  refund_transactions: any[];
  created_at: string;
  updated_at: string;
  items?: TicketOrderItemRow[];
}

// Legacy-compatible shape (matches GuestOrder in Tickets.tsx & TicketOrder in ticketOrders.ts)
export interface UnifiedTicketOrder {
  id: string;
  orderNumber: number;
  name: string;
  phone: string;
  partySize: number;
  time: string;
  timer: string;
  server: string;
  check: string;
  paymentType: string;
  payments?: { method: string; last4?: string; amount: number }[];
  revenueCenter: string;
  status: string;
  notes: string;
  table: string;
  orderType: string;
  items: {
    qty: number;
    name: string;
    price: number;
    seats: number[];
    modifiers: string[];
    isShared?: boolean;
    isFired?: boolean;
    noTax?: boolean;
  }[];
  subtotal: number;
  discount: number;
  serviceCharge: number;
  tax: number;
  tip: number;
  total: number;
  paidAmount?: string;
  paymentStatus?: string;
  transferInfo?: any;
  mergedFrom?: any;
  transferredFrom?: any;
  sessionId?: string;
  splitConfiguration?: any;
  refundAmount?: number;
  refundReason?: string;
  refundTransactions?: any[];
  createdAt?: string;
  updatedAt?: string;
  // extra fields for Tickets.tsx compatibility
  paid?: boolean;
  paidAt?: string;
  paymentMethods?: { id: string; type: string; label: string; amount: number; tipAmount?: number }[];
  createdAtDate?: Date;
}

// ─── Helpers ─────────────────────────────────────────────────

function rowToUnified(row: TicketOrderRow): UnifiedTicketOrder {
  const payments = Array.isArray(row.payments) ? row.payments : [];
  const isPaid = row.status === 'PAID' || row.status === 'Completed';

  return {
    id: row.id,
    orderNumber: row.order_number || 0,
    name: row.name,
    phone: row.phone,
    partySize: row.party_size,
    time: row.time,
    timer: row.timer,
    server: row.server,
    check: row.check_number,
    paymentType: row.payment_type,
    payments: payments.length > 0 ? payments : undefined,
    revenueCenter: row.revenue_center,
    status: row.status,
    notes: row.notes,
    table: row.table_id,
    orderType: row.order_type,
    items: (row.items || []).map(item => ({
      qty: item.qty,
      name: item.name,
      price: item.price,
      seats: item.seats || [],
      modifiers: item.modifiers || [],
      isShared: item.is_shared,
      isFired: item.is_fired,
      noTax: item.no_tax,
    })),
    subtotal: Number(row.subtotal),
    discount: Number(row.discount),
    serviceCharge: Number(row.service_charge),
    tax: Number(row.tax),
    tip: Number(row.tip),
    total: Number(row.total),
    paidAmount: row.paid_amount || undefined,
    paymentStatus: row.payment_status || undefined,
    transferInfo: row.transfer_info,
    mergedFrom: row.merged_from,
    transferredFrom: row.transferred_from,
    sessionId: row.session_id || undefined,
    splitConfiguration: row.split_configuration,
    refundAmount: Number(row.refund_amount || 0),
    refundReason: row.refund_reason || undefined,
    refundTransactions: Array.isArray(row.refund_transactions) ? row.refund_transactions : [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    paid: isPaid,
    paidAt: isPaid ? row.time : undefined,
    paymentMethods: payments.length > 0
      ? payments.map((p: any, i: number) => ({
          id: `pm-${i}`,
          type: p.method === 'Cash' ? 'cash' : 'credit_card',
          label: p.last4 ? `${p.method} •••• ${p.last4}` : p.method,
          amount: p.amount,
          tipAmount: 0,
        }))
      : undefined,
    createdAtDate: new Date(row.created_at),
  };
}

function unifiedToRow(order: Partial<UnifiedTicketOrder>): Record<string, any> {
  const row: Record<string, any> = {};
  if (order.id !== undefined) row.id = order.id;
  if (order.name !== undefined) row.name = order.name;
  if (order.phone !== undefined) row.phone = order.phone;
  if (order.partySize !== undefined) row.party_size = order.partySize;
  if (order.time !== undefined) row.time = order.time;
  if (order.timer !== undefined) row.timer = order.timer;
  if (order.server !== undefined) row.server = order.server;
  if (order.check !== undefined) row.check_number = order.check;
  if (order.paymentType !== undefined) row.payment_type = order.paymentType;
  if (order.payments !== undefined) row.payments = order.payments || [];
  if (order.revenueCenter !== undefined) row.revenue_center = order.revenueCenter;
  if (order.status !== undefined) row.status = order.status;
  if (order.notes !== undefined) row.notes = order.notes;
  if (order.table !== undefined) row.table_id = order.table;
  if (order.orderType !== undefined) row.order_type = order.orderType;
  if (order.subtotal !== undefined) row.subtotal = order.subtotal;
  if (order.discount !== undefined) row.discount = order.discount;
  if (order.serviceCharge !== undefined) row.service_charge = order.serviceCharge;
  if (order.tax !== undefined) row.tax = order.tax;
  if (order.tip !== undefined) row.tip = order.tip;
  if (order.total !== undefined) row.total = order.total;
  if (order.paidAmount !== undefined) row.paid_amount = order.paidAmount;
  if (order.paymentStatus !== undefined) row.payment_status = order.paymentStatus;
  if (order.transferInfo !== undefined) row.transfer_info = order.transferInfo;
  if (order.mergedFrom !== undefined) row.merged_from = order.mergedFrom;
  if (order.transferredFrom !== undefined) row.transferred_from = order.transferredFrom;
  if (order.sessionId !== undefined) row.session_id = order.sessionId;
  if (order.splitConfiguration !== undefined) row.split_configuration = order.splitConfiguration;
  if (order.refundAmount !== undefined) row.refund_amount = order.refundAmount;
  if (order.refundReason !== undefined) row.refund_reason = order.refundReason;
  if (order.refundTransactions !== undefined) row.refund_transactions = order.refundTransactions;
  return row;
}

// ─── Fetch ───────────────────────────────────────────────────

async function fetchTicketOrders(): Promise<UnifiedTicketOrder[]> {
  const { data: orders, error: ordersErr } = await supabase
    .from('ticket_orders')
    .select('*')
    .order('created_at', { ascending: false });

  if (ordersErr) throw ordersErr;
  if (!orders || orders.length === 0) return [];

  const { data: items, error: itemsErr } = await supabase
    .from('ticket_order_items')
    .select('*')
    .in('order_id', orders.map(o => o.id))
    .order('sort_order', { ascending: true });

  if (itemsErr) throw itemsErr;

  const itemsByOrder = new Map<string, TicketOrderItemRow[]>();
  (items || []).forEach(item => {
    const list = itemsByOrder.get(item.order_id) || [];
    list.push(item as TicketOrderItemRow);
    itemsByOrder.set(item.order_id, list);
  });

  return orders.map(order => {
    const row = order as unknown as TicketOrderRow;
    row.items = itemsByOrder.get(row.id) || [];
    return rowToUnified(row);
  });
}

// ─── Hook ────────────────────────────────────────────────────

export function useTicketOrders() {
  const queryClient = useQueryClient();

  const { data: orders = [], isLoading, error } = useQuery({
    queryKey: ['ticket-orders'],
    queryFn: fetchTicketOrders,
    staleTime: 30_000,
  });

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('ticket-orders-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ticket_orders' }, () => {
        queryClient.invalidateQueries({ queryKey: ['ticket-orders'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ticket_order_items' }, () => {
        queryClient.invalidateQueries({ queryKey: ['ticket-orders'] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  // ─── Mutations ──────────────────────────────────────────────

  const addOrderMutation = useMutation({
    mutationFn: async (order: Partial<UnifiedTicketOrder> & { items?: UnifiedTicketOrder['items'] }) => {
      const { items, ...rest } = order;
      const row = unifiedToRow(rest);
      const { data, error } = await supabase.from('ticket_orders').insert(row).select().single();
      if (error) throw error;

      if (items && items.length > 0) {
        const itemRows = items.map((item, i) => ({
          order_id: data.id,
          qty: item.qty,
          name: item.name,
          price: item.price,
          seats: item.seats || [],
          modifiers: item.modifiers || [],
          is_shared: item.isShared || false,
          is_fired: item.isFired || false,
          no_tax: item.noTax || false,
          sort_order: i,
        }));
        const { error: itemsErr } = await supabase.from('ticket_order_items').insert(itemRows);
        if (itemsErr) throw itemsErr;
      }
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ticket-orders'] }),
  });

  const updateOrderMutation = useMutation({
    mutationFn: async ({ id, changes }: { id: string; changes: Partial<UnifiedTicketOrder> }) => {
      const row = unifiedToRow(changes);
      const { error } = await supabase.from('ticket_orders').update(row).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ticket-orders'] }),
  });

  const updateOrderItemsMutation = useMutation({
    mutationFn: async ({ orderId, items }: { orderId: string; items: UnifiedTicketOrder['items'] }) => {
      // Delete existing items and re-insert
      await supabase.from('ticket_order_items').delete().eq('order_id', orderId);
      if (items.length > 0) {
        const itemRows = items.map((item, i) => ({
          order_id: orderId,
          qty: item.qty,
          name: item.name,
          price: item.price,
          seats: item.seats || [],
          modifiers: item.modifiers || [],
          is_shared: item.isShared || false,
          is_fired: item.isFired || false,
          no_tax: item.noTax || false,
          sort_order: i,
        }));
        const { error } = await supabase.from('ticket_order_items').insert(itemRows);
        if (error) throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ticket-orders'] }),
  });

  const removeOrderMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('ticket_orders').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ticket-orders'] }),
  });

  // ─── Helpers ────────────────────────────────────────────────

  const getOrdersByTable = useCallback(
    (tableId: string) => orders.filter(o => o.table === tableId),
    [orders]
  );

  const getOrderById = useCallback(
    (id: string) => orders.find(o => o.id === id),
    [orders]
  );

  const getOrdersByStatus = useCallback(
    (status: string) => orders.filter(o => o.status === status),
    [orders]
  );

  return {
    orders,
    isLoading,
    error,
    addOrder: addOrderMutation.mutateAsync,
    updateOrder: (id: string, changes: Partial<UnifiedTicketOrder>) =>
      updateOrderMutation.mutateAsync({ id, changes }),
    updateOrderItems: (orderId: string, items: UnifiedTicketOrder['items']) =>
      updateOrderItemsMutation.mutateAsync({ orderId, items }),
    removeOrder: removeOrderMutation.mutateAsync,
    getOrdersByTable,
    getOrderById,
    getOrdersByStatus,
    // expose for batch operations
    invalidate: () => queryClient.invalidateQueries({ queryKey: ['ticket-orders'] }),
  };
}
