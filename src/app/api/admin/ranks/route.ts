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

// GET: list all ranks
export async function GET() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('ranks')
    .select('*')
    .order('level', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST: create a new rank
export async function POST(req: NextRequest) {
  const check = await checkConfigAccess();
  if ('error' in check) return NextResponse.json({ error: check.error }, { status: check.status });

  const { level, nom, couleur } = await req.json();
  if (!level || !nom || !couleur) {
    return NextResponse.json({ error: 'level, nom et couleur requis' }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Check if level already exists
  const { data: existing } = await supabase.from('ranks').select('level').eq('level', level).single();
  if (existing) {
    return NextResponse.json({ error: `Le niveau ${level} existe déjà` }, { status: 409 });
  }

  const { data, error } = await supabase.from('ranks').insert({ level, nom, couleur }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data, { status: 201 });
}

// PUT: update an existing rank
export async function PUT(req: NextRequest) {
  const check = await checkConfigAccess();
  if ('error' in check) return NextResponse.json({ error: check.error }, { status: check.status });

  const { level, nom, couleur } = await req.json();
  if (!level) return NextResponse.json({ error: 'level requis' }, { status: 400 });

  const supabase = createAdminClient();
  const updates: any = {};
  if (nom) updates.nom = nom;
  if (couleur) updates.couleur = couleur;

  const { data, error } = await supabase.from('ranks').update(updates).eq('level', level).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}

// DELETE: remove a rank (only if no users have it)
export async function DELETE(req: NextRequest) {
  const check = await checkConfigAccess();
  if ('error' in check) return NextResponse.json({ error: check.error }, { status: check.status });

  const { level } = await req.json();
  if (!level) return NextResponse.json({ error: 'level requis' }, { status: 400 });

  const supabase = createAdminClient();

  // Safety: check if any user has this rank
  const { count } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('rank_level', level);

  if (count && count > 0) {
    return NextResponse.json(
      { error: `Impossible de supprimer : ${count} membre(s) ont ce rang. Réassignez-les d'abord.` },
      { status: 409 }
    );
  }

  const { error } = await supabase.from('ranks').delete().eq('level', level);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
