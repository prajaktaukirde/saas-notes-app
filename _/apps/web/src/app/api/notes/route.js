import sql from "@/app/api/utils/sql";
import { requireAuth, addCorsHeaders } from "@/app/api/utils/auth";

export async function GET(request) {
  try {
    const user = requireAuth(request);

    // Get all notes for the user's tenant
    const notes = await sql`
      SELECT n.*, u.email as author_email
      FROM notes n
      JOIN users u ON n.user_id = u.id
      WHERE n.tenant_id = ${user.tenantId}
      ORDER BY n.created_at DESC
    `;

    const response = Response.json({ notes });
    return addCorsHeaders(response);

  } catch (error) {
    console.error('Get notes error:', error);
    if (error.message === 'Unauthorized') {
      const response = Response.json({ error: 'Unauthorized' }, { status: 401 });
      return addCorsHeaders(response);
    }
    const response = Response.json({ error: 'Internal server error' }, { status: 500 });
    return addCorsHeaders(response);
  }
}

export async function POST(request) {
  try {
    const user = requireAuth(request);
    const { title, content } = await request.json();

    if (!title) {
      const response = Response.json({ error: 'Title is required' }, { status: 400 });
      return addCorsHeaders(response);
    }

    // Check subscription limits for free plan
    if (user.tenantPlan === 'free') {
      const noteCountRows = await sql`
        SELECT COUNT(*) as count
        FROM notes
        WHERE tenant_id = ${user.tenantId}
      `;
      
      const currentNoteCount = parseInt(noteCountRows[0].count);
      if (currentNoteCount >= 3) {
        const response = Response.json({ 
          error: 'Note limit reached. Upgrade to Pro plan for unlimited notes.',
          limitReached: true
        }, { status: 403 });
        return addCorsHeaders(response);
      }
    }

    // Create the note
    const noteRows = await sql`
      INSERT INTO notes (tenant_id, user_id, title, content)
      VALUES (${user.tenantId}, ${user.userId}, ${title}, ${content || ''})
      RETURNING *
    `;

    const note = noteRows[0];
    const response = Response.json({ note }, { status: 201 });
    return addCorsHeaders(response);

  } catch (error) {
    console.error('Create note error:', error);
    if (error.message === 'Unauthorized') {
      const response = Response.json({ error: 'Unauthorized' }, { status: 401 });
      return addCorsHeaders(response);
    }
    const response = Response.json({ error: 'Internal server error' }, { status: 500 });
    return addCorsHeaders(response);
  }
}

export async function OPTIONS() {
  return addCorsHeaders(new Response(null, { status: 200 }));
}