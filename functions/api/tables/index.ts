// Tables API Endpoint
// URL: /api/tables

interface Env {
  // DB: D1Database;
  // TABLES_KV: KVNamespace;  // For real-time table status
}

// GET /api/tables - List all tables with status
export const onRequestGet: PagesFunction<Env> = async (context) => {
  // Example: Fetch from KV for real-time status
  // const tables = await context.env.TABLES_KV.get('all-tables', 'json');
  
  // Mock data matching your TableOrder page
  const tables = [
    { id: 'T1', seats: 6, status: 'Available', time: '' },
    { id: 'T2', seats: 5, status: 'Ordering', time: '25M' },
    { id: 'T3', seats: 4, status: 'Ordered', time: '2H 25M' },
    { id: 'T4', seats: 3, status: 'Reserved', time: '2H 25M' },
    { id: 'T5', seats: 4, status: 'Seated', time: '25M' },
    { id: 'T6', seats: 2, status: 'Running Late', time: '45M' },
  ];
  
  return Response.json({
    success: true,
    data: tables,
    count: tables.length,
  });
};

// POST /api/tables - Update table status
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = await context.request.json();
    const { tableId, status, guests } = body;
    
    if (!tableId || !status) {
      return Response.json(
        { success: false, error: 'Missing tableId or status' },
        { status: 400 }
      );
    }
    
    // Example: Update in KV
    // await context.env.TABLES_KV.put(`table:${tableId}`, JSON.stringify({ status, guests }));
    
    return Response.json({
      success: true,
      data: {
        tableId,
        status,
        guests,
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    return Response.json(
      { success: false, error: 'Invalid request' },
      { status: 400 }
    );
  }
};
