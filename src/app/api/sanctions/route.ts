import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!user || user.rank_level < 7) {
    return NextResponse.json({ error: 'Non autorisé (Co-Leader+ requis)' }, { status: 403 });
  }

  const { userId, type, raison, dureeJours } = await req.json();

  if (!userId || !type || !raison) {
    return NextResponse.json({ error: 'Données manquantes' }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data, error } = await supabase.from('sanctions').insert({
    user_id: userId,
    type,
    raison,
    duree_jours: type === 'suspension' ? dureeJours : null,
    createur_id: user.id,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, sanction: data });
}
