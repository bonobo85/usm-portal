import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!user || user.rank_level < 7) {
    return NextResponse.json({ error: 'Co-Leader+ requis' }, { status: 403 });
  }

  const { userId, raison, notes } = await req.json();
  const supabase = createAdminClient();

  // Get target user
  const { data: target } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (!target) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });

  // Create archive
  const { data: archive } = await supabase.from('archives').insert({
    username_final: target.surnom || target.username,
    rank_final: target.rank_level,
    raison,
    notes,
  }).select().single();

  // Copy rank history as archive records
  const { data: rankHistory } = await supabase
    .from('rank_history')
    .select('*')
    .eq('user_id', userId);

  if (archive && rankHistory) {
    for (const rh of rankHistory) {
      await supabase.from('archive_records').insert({
        archive_id: archive.id,
        type: 'rank_change',
        contenu: rh,
        date_evenement: rh.created_at,
      });
    }
  }

  // Deactivate user
  await supabase.from('users').update({
    is_active: false,
    statut: 'hors_ligne',
  }).eq('id', userId);

  return NextResponse.json({ success: true });
}
