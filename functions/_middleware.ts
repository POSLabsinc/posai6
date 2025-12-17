// Global Middleware for all API routes
// Runs before every request to /api/*

interface Env {
  ENVIRONMENT?: string;
  API_KEY?: string;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  // Add CORS headers for API routes
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
  
  // Handle preflight requests
  if (context.request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  // Add request timing
  const startTime = Date.now();
  
  // Optional: API Key authentication
  // const apiKey = context.request.headers.get('X-API-Key');
  // if (context.env.API_KEY && apiKey !== context.env.API_KEY) {
  //   return Response.json(
  //     { success: false, error: 'Unauthorized' },
  //     { status: 401, headers: corsHeaders }
  //   );
  // }
  
  // Continue to the next handler
  const response = await context.next();
  
  // Add timing and CORS headers to response
  const newResponse = new Response(response.body, response);
  
  Object.entries(corsHeaders).forEach(([key, value]) => {
    newResponse.headers.set(key, value);
  });
  
  newResponse.headers.set('X-Response-Time', `${Date.now() - startTime}ms`);
  
  return newResponse;
};
