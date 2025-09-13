import sql from "@/app/api/utils/sql";
import { requireAuth, addCorsHeaders } from "@/app/api/utils/auth";

export async function GET(request, { params }) {
  try {
    const user = requireAuth(request);
    const { id } = params;

    // Get note ensuring tenant isolation
    const noteRows = await sql`
      SELECT n.*, u.email as author_email
      FROM notes n
      JOIN users u ON n.user_id = u.id
      WHERE n.id = ${id} AND n.tenant_id = ${user.tenantId}
    `;

    if (noteRows.length === 0) {
      const response = Response.json({ error: 'Note not found' }, { status: 404 });
      return addCorsHeaders(response);
    }

    const response = Response.json({ note: noteRows[0] });
    return addCorsHeaders(response);

  } catch (error) {
    console.error('Get note error:', error);
    if (error.message === 'Unauthorized') {
      const response = Response.json({ error: 'Unauthorized' }, { status: 401 });
      return addCorsHeaders(response);
    }
    const response = Response.json({ error: 'Internal server error' }, { status: 500 });
    return addCorsHeaders(response);
  }
}

export async function PUT(request, { params }) {
  try {
    const user = requireAuth(request);
    const { id } = params;
    const { title, content } = await request.json();

    // Verify note exists and belongs to user's tenant
    const existingNoteRows = await sql`
      SELECT * FROM notes
      WHERE id = ${id} AND tenant_id = ${user.tenantId}
    `;

    if (existingNoteRows.length === 0) {
      const response = Response.json({ error: 'Note not found' }, { status: 404 });
      return addCorsHeaders(response);
    }

    // Update note
    const noteRows = await sql`
      UPDATE notes
      SET 
        title = COALESCE(${title}, title),
        content = COALESCE(${content}, content),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id} AND tenant_id = ${user.tenantId}
      RETURNING *
    `;

    const response = Response.json({ note: noteRows[0] });
    return addCorsHeaders(response);

  } catch (error) {
    console.error('Update note error:', error);
    if (error.message === 'Unauthorized') {
      const response = Response.json({ error: 'Unauthorized' }, { status: 401 });
      return addCorsHeaders(response);
    }
    const response = Response.json({ error: 'Internal server error' }, { status: 500 });
    return addCorsHeaders(response);
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = requireAuth(request);
    const { id } = params;

    // Verify note exists and belongs to user's tenant
    const existingNoteRows = await sql`
      SELECT * FROM notes
      WHERE id = ${id} AND tenant_id = ${user.tenantId}
    `;

    if (existingNoteRows.length === 0) {
      const response = Response.json({ error: 'Note not found' }, { status: 404 });
      return addCorsHeaders(response);
    }

    // Delete note
    await sql`
      DELETE FROM notes
      WHERE id = ${id} AND tenant_id = ${user.tenantId}
    `;

    const response = Response.json({ message: 'Note deleted successfully' });
    return addCorsHeaders(response);

  } catch (error) {
    console.error('Delete note error:', error);
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