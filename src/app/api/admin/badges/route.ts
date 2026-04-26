import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase-server';
import { peutGererConfig } from '@/lib/constants';

async function checkConfigAccess() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!user) return { error: 'Non autorisé', status: 401 };
  if (!peutGererConfig(user.rank_level, user.permissions || [])) {
    return { error: 'Shériff ou permission dev requise', status: 403 };
  }
  return { user };
}

// GET: list all badges
export async function GET() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('badges')
    .select('*')
    .order('ordre_affichage', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST: create a new badge
export async function POST(req: NextRequest) {
  const check = await checkConfigAccess();
  if ('error' in check) return NextResponse.json({ error: check.error }, { status: check.status });

  const { code, nom, couleur, description, icone, ordre_affichage } = await req.json();
  if (!code || !nom || !couleur) {
    return NextResponse.json({ error: 'code, nom et couleur requis' }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Check code uniqueness
  const { data: existing } = await supabase.from('badges').select('id').eq('code', code.toUpperCase()).single();
  if (existing) {
    return NextResponse.json({ error: `Le code "${code}" existe déjà` }, { status: 409 });
  }

  // Auto-assign order if not provided
  let order = ordre_affichage;
  if (order == null) {
    const { data: last } = await supabase.from('badges').select('ordre_affichage').order('ordre_affichage', { ascending: false }).limit(1).single();
    order = (last?.ordre_affichage ?? -1) + 1;
  }

  const { data, error } = await supabase.from('badges').insert({
    code: code.toUpperCase(),
    nom,
    couleur,
    description: description || null,
    icone: icone || '🏷',
    ordre_affichage: order,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

// PUT: update an existing badge
export async function PUT(req: NextRequest) {
  const check = await checkConfigAccess();
  if ('error' in check) return NextResponse.json({ error: check.error }, { status: check.status });

  const { id, nom, couleur, description, icone, ordre_affichage } = await req.json();
  if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 });

  const supabase = createAdminClient();
  const updates: any = {};
  if (nom !== undefined) updates.nom = nom;
  if (couleur !== undefined) updates.couleur = couleur;
  if (description !== undefined) updates.description = description;
  if (icone !== undefined) updates.icone = icone;
  if (ordre_affichage !== undefined) updates.ordre_affichage = ordre_affichage;

  const { data, error } = await supabase.from('badges').update(updates).eq('id', id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}

// DELETE: remove a badge (revokes from all users first)
export async function DELETE(req: NextRequest) {
  const check = await checkConfigAccess();
  if ('error' in check) return NextResponse.json({ error: check.error }, { status: check.status });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 });

  const supabase = createAdminClient();

  // Count holders
  const { count } = await supabase
    .from('user_badges')
    .select('*', { count: 'exact', head: true })
    .eq('badge_id', id)
    .eq('is_active', true);

  // Remove all user_badges references first
  await supabase.from('user_badges').delete().eq('badge_id', id);

  // Delete the badge
  const { error } = await supabase.from('badges').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, revoked_from: count || 0 });
}
