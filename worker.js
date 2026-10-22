export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // 1. CORS Headers (Required for the dashboard to talk to the worker)
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // 2. AUTHENTICATION CHECK
    // If you set ADMIN_TOKEN in your worker settings, this checks it.
    // If you haven't set it yet, this will be skipped if you test locally.
    if (path.startsWith('/api/admin/')) {
      const authHeader = request.headers.get('Authorization');
      const expectedToken = `Bearer ${env.ADMIN_TOKEN}`;
      
      // If you haven't set an ADMIN_TOKEN in Cloudflare yet, this will block you.
      // So for now, we only enforce it if env.ADMIN_TOKEN actually exists.
      if (env.ADMIN_TOKEN && authHeader !== expectedToken) {
        return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // 3. API ROUTES
    // The dashboard needs these routes to work. We are returning mock data.
    
    if (path === '/api/admin/stats' && method === 'GET') {
      return jsonResponse({
        success: true,
        stats: {
          active_licenses: 14,
          total_licenses: 50,
          active_devices: 8,
          total_devices: 22,
          suspended_licenses: 2,
          total_events: 128
        }
      }, corsHeaders);
    }

    if (path === '/api/admin/events' && method === 'GET') {
      return jsonResponse({
        success: true,
        events: [
          { id: 1, event_type: 'LOGIN_SUCCESS', outcome: 'success', detail: 'Admin logged in', created_at: new Date().toISOString() },
          { id: 2, event_type: 'LICENSE_CREATED', outcome: 'success', detail: 'Generated VIP key', created_at: new Date(Date.now() - 3600000).toISOString() }
        ],
        pagination: { page: 1, pages: 1 }
      }, corsHeaders);
    }

    if (path === '/api/admin/licenses' && method === 'GET') {
      return jsonResponse({
        success: true,
        licenses: [
          {
            id: '101',
            customer_name: 'Kanha VIP',
            key_hint: 'LUDO-VIP-9999',
            status: 'active',
            features: 63,
            device_limit: 1,
            trial_days: 30,
            is_floating: true,
            notes: 'Test key',
            active_devices_count: 1,
            devices: [
              { device_id: 'a1b2c3d4e5f6', model: 'Samsung Galaxy S24', status: 'active', last_verified_at: new Date().toISOString() }
            ]
          }
        ],
        pagination: { page: 1, pages: 1 }
      }, corsHeaders);
    }

    if (path === '/api/admin/licenses' && method === 'POST') {
      // When you generate a new key in the dashboard
      const body = await request.json();
      return jsonResponse({
        success: true,
        license: {
          id: Math.random().toString(),
          key_hint: 'LUDO-NEW-' + Math.floor(1000 + Math.random() * 9000),
          customer_name: body.customer_name,
          features: body.features,
          device_limit: body.device_limit,
          trial_days: body.days_valid,
          status: 'active'
        }
      }, corsHeaders);
    }

    if (path === '/api/admin/devices' && method === 'GET') {
      return jsonResponse({
        success: true,
        devices: [
          {
            id: 'dev_1',
            device_id: 'a1b2c3d4e5f6g7h8i9j0',
            model: 'Xiaomi Redmi Note 12',
            status: 'active',
            app_version: 'v10.6.0.416',
            key_hint: 'LUDO-VIP-9999',
            customer_name: 'Kanha VIP',
            last_verified_at: new Date().toISOString(),
            first_activated_at: new Date(Date.now() - 86400000).toISOString()
          }
        ],
        pagination: { page: 1, pages: 1 }
      }, corsHeaders);
    }

    // 4. SERVE THE DASHBOARD HTML
    // Replace the string below with your actual HTML if you are hosting it here.
    // If you are hosting the HTML on Cloudflare Pages, you can delete this block.
    if (path === '/' || path === '/index.html') {
      return new Response("YOUR HTML CODE GOES HERE", {
        headers: { 'Content-Type': 'text/html' }
      });
    }

    // 5. Fallback 404
    return jsonResponse({ success: false, error: 'Route not found' }, corsHeaders, 404);
  }
};

// Helper function for JSON responses
function jsonResponse(data, headers, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json' }
  });
}
