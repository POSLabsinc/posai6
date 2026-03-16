import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useCallback } from 'react';

// ─── Types ───────────────────────────────────────────────────

export interface RestaurantTable {
  id: string;
  tableNumber: string;
  seats: number;
  shape: 'circle' | 'square';
  status: string;
  x: number;
  y: number;
  guests: number;
  occupiedSeats: number[];
  time: string;
  mergedWith?: string | null;
  isMergeSource?: boolean;
  mergeGroupId?: string;
  floorArea: string;
  sortOrder: number;
  merchantId?: string | null;
}

export interface FloorArea {
  id: string;
  name: string;
  color: string;
  bgColor: string;
  x: number;
  y: number;
  anchor: string;
  sortOrder: number;
}

export interface FloorDivider {
  id: string;
  orientation: 'horizontal' | 'vertical';
  position: number;
}

// ─── Row converters ──────────────────────────────────────────

function tableRowToModel(row: any): RestaurantTable {
  return {
    id: row.table_number,
    tableNumber: row.table_number,
    seats: row.seats,
    shape: row.shape as 'circle' | 'square',
    status: row.status,
    x: Number(row.x),
    y: Number(row.y),
    guests: row.guests,
    occupiedSeats: Array.isArray(row.occupied_seats) ? row.occupied_seats : [],
    time: row.time || '',
    mergedWith: row.merged_with,
    isMergeSource: row.is_merge_source,
    mergeGroupId: row.merge_group_id || undefined,
    floorArea: row.floor_area,
    sortOrder: row.sort_order,
    merchantId: row.merchant_id,
  };
}

function areaRowToModel(row: any): FloorArea {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    bgColor: row.bg_color,
    x: Number(row.x),
    y: Number(row.y),
    anchor: row.anchor,
    sortOrder: row.sort_order,
  };
}

function dividerRowToModel(row: any): FloorDivider {
  return {
    id: row.id,
    orientation: row.orientation as 'horizontal' | 'vertical',
    position: Number(row.position),
  };
}

// ─── Fetchers ────────────────────────────────────────────────

async function fetchTables(): Promise<RestaurantTable[]> {
  const { data, error } = await supabase
    .from('restaurant_tables')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return (data || []).map(tableRowToModel);
}

async function fetchFloorAreas(): Promise<FloorArea[]> {
  const { data, error } = await supabase
    .from('floor_areas')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return (data || []).map(areaRowToModel);
}

async function fetchDividers(): Promise<FloorDivider[]> {
  const { data, error } = await supabase
    .from('floor_dividers')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data || []).map(dividerRowToModel);
}

// ─── Hook ────────────────────────────────────────────────────

export function useRestaurantTables() {
  const queryClient = useQueryClient();

  const { data: tables = [], isLoading: tablesLoading } = useQuery({
    queryKey: ['restaurant-tables'],
    queryFn: fetchTables,
    staleTime: 30_000,
  });

  const { data: floorAreas = [], isLoading: areasLoading } = useQuery({
    queryKey: ['floor-areas'],
    queryFn: fetchFloorAreas,
    staleTime: 60_000,
  });

  const { data: floorDividers = [], isLoading: dividersLoading } = useQuery({
    queryKey: ['floor-dividers'],
    queryFn: fetchDividers,
    staleTime: 60_000,
  });

  // Realtime on restaurant_tables
  useEffect(() => {
    const channel = supabase
      .channel('restaurant-tables-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'restaurant_tables' }, () => {
        queryClient.invalidateQueries({ queryKey: ['restaurant-tables'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'floor_areas' }, () => {
        queryClient.invalidateQueries({ queryKey: ['floor-areas'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'floor_dividers' }, () => {
        queryClient.invalidateQueries({ queryKey: ['floor-dividers'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  // ─── Table mutations ───────────────────────────────────────

  const updateTableMutation = useMutation({
    mutationFn: async ({ tableNumber, changes }: { tableNumber: string; changes: Partial<RestaurantTable> }) => {
      const row: Record<string, any> = {};
      if (changes.seats !== undefined) row.seats = changes.seats;
      if (changes.shape !== undefined) row.shape = changes.shape;
      if (changes.status !== undefined) row.status = changes.status;
      if (changes.x !== undefined) row.x = changes.x;
      if (changes.y !== undefined) row.y = changes.y;
      if (changes.guests !== undefined) row.guests = changes.guests;
      if (changes.occupiedSeats !== undefined) row.occupied_seats = changes.occupiedSeats;
      if (changes.time !== undefined) row.time = changes.time;
      if (changes.mergedWith !== undefined) row.merged_with = changes.mergedWith;
      if (changes.isMergeSource !== undefined) row.is_merge_source = changes.isMergeSource;
      if (changes.mergeGroupId !== undefined) row.merge_group_id = changes.mergeGroupId;
      if (changes.floorArea !== undefined) row.floor_area = changes.floorArea;
      const { error } = await supabase
        .from('restaurant_tables')
        .update(row)
        .eq('table_number', tableNumber);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['restaurant-tables'] }),
  });

  const addTableMutation = useMutation({
    mutationFn: async (table: Partial<RestaurantTable> & { tableNumber: string }) => {
      const { data, error } = await supabase.from('restaurant_tables').insert({
        table_number: table.tableNumber,
        seats: table.seats ?? 4,
        shape: table.shape ?? 'circle',
        status: table.status ?? 'Available',
        x: table.x ?? 400,
        y: table.y ?? 300,
        guests: 0,
        occupied_seats: [],
        time: '',
        floor_area: table.floorArea ?? 'Main Dining Room',
        sort_order: table.sortOrder ?? 99,
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['restaurant-tables'] }),
  });

  const removeTableMutation = useMutation({
    mutationFn: async (tableNumber: string) => {
      const { error } = await supabase
        .from('restaurant_tables')
        .delete()
        .eq('table_number', tableNumber);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['restaurant-tables'] }),
  });

  const bulkUpdatePositionsMutation = useMutation({
    mutationFn: async (updates: { tableNumber: string; x: number; y: number }[]) => {
      for (const u of updates) {
        const { error } = await supabase
          .from('restaurant_tables')
          .update({ x: u.x, y: u.y })
          .eq('table_number', u.tableNumber);
        if (error) throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['restaurant-tables'] }),
  });

  // ─── Floor area mutations ──────────────────────────────────

  const addFloorAreaMutation = useMutation({
    mutationFn: async (area: Omit<FloorArea, 'id'>) => {
      const { data, error } = await supabase.from('floor_areas').insert({
        name: area.name,
        color: area.color,
        bg_color: area.bgColor,
        x: area.x,
        y: area.y,
        anchor: area.anchor,
        sort_order: area.sortOrder,
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['floor-areas'] }),
  });

  const updateFloorAreaMutation = useMutation({
    mutationFn: async ({ id, changes }: { id: string; changes: Partial<FloorArea> }) => {
      const row: Record<string, any> = {};
      if (changes.name !== undefined) row.name = changes.name;
      if (changes.color !== undefined) row.color = changes.color;
      if (changes.bgColor !== undefined) row.bg_color = changes.bgColor;
      if (changes.x !== undefined) row.x = changes.x;
      if (changes.y !== undefined) row.y = changes.y;
      if (changes.anchor !== undefined) row.anchor = changes.anchor;
      if (changes.sortOrder !== undefined) row.sort_order = changes.sortOrder;
      const { error } = await supabase.from('floor_areas').update(row).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['floor-areas'] }),
  });

  const removeFloorAreaMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('floor_areas').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['floor-areas'] }),
  });

  const replaceAllFloorAreasMutation = useMutation({
    mutationFn: async (areas: Omit<FloorArea, 'id'>[]) => {
      await supabase.from('floor_areas').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (areas.length > 0) {
        const rows = areas.map(a => ({
          name: a.name,
          color: a.color,
          bg_color: a.bgColor,
          x: a.x,
          y: a.y,
          anchor: a.anchor,
          sort_order: a.sortOrder,
        }));
        const { error } = await supabase.from('floor_areas').insert(rows);
        if (error) throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['floor-areas'] }),
  });

  // ─── Divider mutations ─────────────────────────────────────

  const addDividerMutation = useMutation({
    mutationFn: async (divider: Omit<FloorDivider, 'id'>) => {
      const { data, error } = await supabase.from('floor_dividers').insert({
        orientation: divider.orientation,
        position: divider.position,
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['floor-dividers'] }),
  });

  const updateDividerMutation = useMutation({
    mutationFn: async ({ id, changes }: { id: string; changes: Partial<FloorDivider> }) => {
      const row: Record<string, any> = {};
      if (changes.orientation !== undefined) row.orientation = changes.orientation;
      if (changes.position !== undefined) row.position = changes.position;
      const { error } = await supabase.from('floor_dividers').update(row).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['floor-dividers'] }),
  });

  const removeDividerMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('floor_dividers').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['floor-dividers'] }),
  });

  const replaceAllDividersMutation = useMutation({
    mutationFn: async (dividers: Omit<FloorDivider, 'id'>[]) => {
      await supabase.from('floor_dividers').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (dividers.length > 0) {
        const rows = dividers.map(d => ({
          orientation: d.orientation,
          position: d.position,
        }));
        const { error } = await supabase.from('floor_dividers').insert(rows);
        if (error) throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['floor-dividers'] }),
  });

  // ─── Helpers ───────────────────────────────────────────────

  const getTableByNumber = useCallback(
    (tableNumber: string) => tables.find(t => t.id === tableNumber),
    [tables]
  );

  const getTablesByStatus = useCallback(
    (status: string) => tables.filter(t => t.status === status),
    [tables]
  );

  const getAvailableTables = useCallback(
    () => tables.filter(t => t.status === 'Available'),
    [tables]
  );

  return {
    tables,
    floorAreas,
    floorDividers,
    isLoading: tablesLoading || areasLoading || dividersLoading,
    // Table ops
    updateTable: (tableNumber: string, changes: Partial<RestaurantTable>) =>
      updateTableMutation.mutateAsync({ tableNumber, changes }),
    addTable: addTableMutation.mutateAsync,
    removeTable: removeTableMutation.mutateAsync,
    bulkUpdatePositions: bulkUpdatePositionsMutation.mutateAsync,
    // Floor area ops
    addFloorArea: addFloorAreaMutation.mutateAsync,
    updateFloorArea: (id: string, changes: Partial<FloorArea>) =>
      updateFloorAreaMutation.mutateAsync({ id, changes }),
    removeFloorArea: removeFloorAreaMutation.mutateAsync,
    replaceAllFloorAreas: replaceAllFloorAreasMutation.mutateAsync,
    // Divider ops
    addDivider: addDividerMutation.mutateAsync,
    updateDivider: (id: string, changes: Partial<FloorDivider>) =>
      updateDividerMutation.mutateAsync({ id, changes }),
    removeDivider: removeDividerMutation.mutateAsync,
    replaceAllDividers: replaceAllDividersMutation.mutateAsync,
    // Helpers
    getTableByNumber,
    getTablesByStatus,
    getAvailableTables,
    invalidate: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurant-tables'] });
      queryClient.invalidateQueries({ queryKey: ['floor-areas'] });
      queryClient.invalidateQueries({ queryKey: ['floor-dividers'] });
    },
  };
}
