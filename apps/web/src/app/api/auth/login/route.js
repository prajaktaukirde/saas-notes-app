import sql from "@/app/api/utils/sql";

// Simple password verification - in production use proper bcrypt
function verifyPassword(password, hash) {
  // For demo purposes, we're using a simple comparison
  // In production, use bcrypt.compare(password, hash)
  return hash === '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi' && password === 'password';
}

// Simple JWT creation - in production use proper JWT library
function createJWT(payload) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const headerEncoded = btoa(JSON.stringify(header));
  const payloadEncoded = btoa(JSON.stringify(payload));
  
  // In production, use proper HMAC signing
  const signature = btoa(`${headerEncoded}.${payloadEncoded}.${process.env.JWT_SECRET || 'demo-secret'}`);
  
  return `${headerEncoded}.${payloadEncoded}.${signature}`;
}

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return Response.json({ error: 'Email and password required' }, { status: 400 });
    }

    // Get user with tenant info
    const userRows = await sql`
      SELECT u.*, t.slug as tenant_slug, t.name as tenant_name, t.plan as tenant_plan
      FROM users u
      JOIN tenants t ON u.tenant_id = t.id
      WHERE u.email = ${email}
    `;

    if (userRows.length === 0) {
      return Response.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const user = userRows[0];

    if (!verifyPassword(password, user.password_hash)) {
      return Response.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Create JWT token
    const token = createJWT({
      userId: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenant_id,
      tenantSlug: user.tenant_slug,
      tenantPlan: user.tenant_plan,
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    });

    // Set CORS headers
    const response = Response.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        tenant: {
          id: user.tenant_id,
          slug: user.tenant_slug,
          name: user.tenant_name,
          plan: user.tenant_plan
        }
      }
    });

    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    return response;

  } catch (error) {
    console.error('Login error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}