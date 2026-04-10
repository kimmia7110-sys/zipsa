import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { verifyAdmin } from '@/lib/admin-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { authorized } = await verifyAdmin(request);
  if (!authorized) {
    return Response.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { id } = await params;

  const { data: { user }, error: authError } = await getSupabaseAdmin().auth.admin.getUserById(id);
  if (authError || !user) {
    return Response.json({ error: 'User not found' }, { status: 404 });
  }

  const { data: profile } = await getSupabaseAdmin()
    .from('profiles')
    .select('name, nickname, phone, gender, address, role, created_at')
    .eq('id', id)
    .single();

  return Response.json({
    id: user.id,
    email: user.email,
    ...profile,
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { authorized } = await verifyAdmin(request);
  if (!authorized) {
    return Response.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();

  const allowed = ['name', 'nickname', 'phone', 'gender', 'address', 'role'];
  const updates: Record<string, string> = {};
  for (const key of allowed) {
    if (body[key] !== undefined) {
      updates[key] = body[key];
    }
  }

  const { error } = await getSupabaseAdmin()
    .from('profiles')
    .update(updates)
    .eq('id', id);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ success: true });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { authorized, userId } = await verifyAdmin(request);
  if (!authorized) {
    return Response.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { id } = await params;

  if (id === userId) {
    return Response.json({ error: 'Cannot delete yourself' }, { status: 400 });
  }

  const { error } = await getSupabaseAdmin().auth.admin.deleteUser(id);
  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ success: true });
}
