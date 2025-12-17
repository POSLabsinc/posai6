// Single Order API Endpoint
// URL: /api/orders/:id

interface Env {
  // DB: D1Database;
}

// GET /api/orders/:id - Get a specific order
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const orderId = context.params.id;
  
  // Example: Fetch from D1 database
  // const order = await context.env.DB.prepare(
  //   'SELECT * FROM orders WHERE id = ?'
  // ).bind(orderId).first();
  
  // Mock data
  const order = {
    id: `#${orderId}`,
    customer: 'Sarah Mitchell',
    items: [
      { name: 'Margherita Pizza', price: 18.50, quantity: 1 },
      { name: 'Caesar Salad', price: 12.00, quantity: 1 },
    ],
    total: 67.50,
    status: 'preparing',
    table: 'T-12',
    createdAt: new Date().toISOString(),
  };
  
  return Response.json({
    success: true,
    data: order,
  });
};

// PATCH /api/orders/:id - Update order status
export const onRequestPatch: PagesFunction<Env> = async (context) => {
  const orderId = context.params.id;
  
  try {
    const body = await context.request.json();
    
    // Example: Update in D1 database
    // await context.env.DB.prepare(
    //   'UPDATE orders SET status = ? WHERE id = ?'
    // ).bind(body.status, orderId).run();
    
    return Response.json({
      success: true,
      data: {
        id: `#${orderId}`,
        status: body.status,
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

// DELETE /api/orders/:id - Cancel/delete an order
export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const orderId = context.params.id;
  
  // Example: Delete from D1 database
  // await context.env.DB.prepare('DELETE FROM orders WHERE id = ?').bind(orderId).run();
  
  return Response.json({
    success: true,
    message: `Order #${orderId} deleted`,
  });
};
