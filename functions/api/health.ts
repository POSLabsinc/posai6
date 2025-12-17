// API Health Check Endpoint
// URL: /api/health

export const onRequestGet: PagesFunction = async (context) => {
  return Response.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: context.env.ENVIRONMENT || 'production',
  });
};
