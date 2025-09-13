import sql from "@/app/api/utils/sql";
import { requireRole, addCorsHeaders } from "@/app/api/utils/auth";

export async function POST(request, { params }) {
  try {
    const user = requireRole(request, 'admin');
    const { slug } = params;

    // Verify tenant matches user's tenant
    if (user.tenantSlug !== slug) {
      const response = Response.json({ error: 'Forbidden' }, { status: 403 });
      return addCorsHeaders(response);
    }

    // Upgrade tenant to pro plan
    const tenantRows = await sql`
      UPDATE tenants
      SET plan = 'pro', updated_at = CURRENT_TIMESTAMP
      WHERE slug = ${slug}
      RETURNING *
    `;

    if (tenantRows.length === 0) {
      const response = Response.json({ error: 'Tenant not found' }, { status: 404 });
      return addCorsHeaders(response);
    }

    const response = Response.json({ 
      message: 'Tenant upgraded to Pro plan successfully',
      tenant: tenantRows[0]
    });
    return addCorsHeaders(response);

  } catch (error) {
    console.error('Upgrade tenant error:', error);
    if (error.message === 'Unauthorized') {
      const response = Response.json({ error: 'Unauthorized' }, { status: 401 });
      return addCorsHeaders(response);
    }
    if (error.message === 'Forbidden') {
      const response = Response.json({ error: 'Forbidden' }, { status: 403 });
      return addCorsHeaders(response);
    }
    const response = Response.json({ error: 'Internal server error' }, { status: 500 });
    return addCorsHeaders(response);
  }
}

export async function OPTIONS() {
  return addCorsHeaders(new Response(null, { status: 200 }));
}