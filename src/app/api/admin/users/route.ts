import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { verifyAdmin } from '@/lib/admin-auth';

export async function GET(request: NextRequest) {
  const { authorized } = await verifyAdmin(request);
  if (!authorized) {
    return Response.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const search = request.nextUrl.searchParams.get('search') || '';

  const { data: { users }, error: authError } = await getSupabaseAdmin().auth.admin.listUsers();
  if (authError) {
    return Response.json({ error: authError.message }, { status: 500 });
  }

  const { data: profiles, error: profileError } = await getSupabaseAdmin()
    .from('profiles')
    .select('id, name, nickname, phone, gender, address, role, created_at');
  if (profileError) {
    return Response.json({ error: profileError.message }, { status: 500 });
  }

  const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

  let result = users.map((u) => {
    const profile = profileMap.get(u.id);
    return {
      id: u.id,
      email: u.email,
      name: profile?.name || null,
      nickname: profile?.nickname || null,
      phone: profile?.phone || null,
      gender: profile?.gender || null,
      address: profile?.address || null,
      role: profile?.role || 'user',
      created_at: u.created_at,
    };
  });

  if (search) {
    const q = search.toLowerCase();
    result = result.filter(
      (u) =>
        u.email?.toLowerCase().includes(q) ||
        u.name?.toLowerCase().includes(q) ||
        u.nickname?.toLowerCase().includes(q)
    );
  }

  return Response.json({ users: result });
}
