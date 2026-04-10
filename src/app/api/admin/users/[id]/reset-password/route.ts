import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { verifyAdmin } from '@/lib/admin-auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { authorized } = await verifyAdmin(request);
  if (!authorized) {
    return Response.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { id } = await params;
  const { password } = await request.json();

  if (!password || password.length < 6) {
    return Response.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
  }

  const { error } = await getSupabaseAdmin().auth.admin.updateUserById(id, { password });
  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ success: true });
}
