// Orders API Endpoint
// URL: /api/orders

interface Env {
  // Add your bindings here:
  // DB: D1Database;
  // KV: KVNamespace;
  // ORDERS_DO: DurableObjectNamespace;
}

// GET /api/orders - List all orders
export const onRequestGet: PagesFunction<Env> = async (context) => {
  // Example: Fetch from D1 database
  // const orders = await context.env.DB.prepare('SELECT * FROM orders').all();
  
  // Mock data for now
  const orders = [
    { id: '#4521', customer: 'Sarah Mitchell', total: 67.50, status: 'preparing' },
    { id: '#4520', customer: 'John Davidson', total: 34.20, status: 'ready' },
    { id: '#4519', customer: 'Emily Roberts', total: 89.00, status: 'delivered' },
  ];
  
  return Response.json({
    success: true,
    data: orders,
    count: orders.length,
  });
};

// POST /api/orders - Create a new order
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = await context.request.json();
    
    // Validate the order
    if (!body.items || !body.customer) {
      return Response.json(
        { success: false, error: 'Missing required fields: items, customer' },
        { status: 400 }
      );
    }
    
    // Example: Insert into D1 database
    // const result = await context.env.DB.prepare(
    //   'INSERT INTO orders (customer, items, total, status) VALUES (?, ?, ?, ?)'
    // ).bind(body.customer, JSON.stringify(body.items), body.total, 'new').run();
    
    const newOrder = {
      id: `#${Date.now().toString().slice(-4)}`,
      ...body,
      status: 'new',
      createdAt: new Date().toISOString(),
    };
    
    return Response.json({
      success: true,
      data: newOrder,
    }, { status: 201 });
  } catch (error) {
    return Response.json(
      { success: false, error: 'Invalid JSON body' },
      { status: 400 }
    );
  }
};
