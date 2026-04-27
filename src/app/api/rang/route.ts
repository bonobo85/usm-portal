import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const { targetUserId, newRank, raison } = await req.json();

  // Validation
  if (!targetUserId || !newRank || !raison || raison.length < 3) {
    return NextResponse.json({ error: 'Données invalides (raison min 3 car.)' }, { status: 400 });
  }
  if (newRank >= user.rank_level) {
    return NextResponse.json({ error: 'Impossible d\'attribuer un rang supérieur ou égal au vôtre' }, { status: 403 });
  }

  const supabase = createAdminClient();

  // Get target user
  const { data: target } = await supabase
    .from('users')
    .select('id, rank_level')
    .eq('id', targetUserId)
    .single();

  if (!target) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });
  if (target.rank_level >= user.rank_level) {
    return NextResponse.json({ error: 'Rang cible trop élevé' }, { status: 403 });
  }

  // Update rank
  await supabase.from('users').update({ rank_level: newRank }).eq('id', targetUserId);

  // Audit
  await supabase.from('rank_history').insert({
    user_id: targetUserId,
    ancien_rang: target.rank_level,
    nouveau_rang: newRank,
    raison,
    modifie_par: user.id,
  });

  return NextResponse.json({ success: true });
}
