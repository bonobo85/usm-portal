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

// GET
export async function GET() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('report_templates')
    .select('*')
    .order('code');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST
export async function POST(req: NextRequest) {
  const check = await checkConfigAccess();
  if ('error' in check) return NextResponse.json({ error: check.error }, { status: check.status });

  const { code, nom, description, sections } = await req.json();
  if (!code || !nom) return NextResponse.json({ error: 'code et nom requis' }, { status: 400 });

  const supabase = createAdminClient();
  const { data, error } = await supabase.from('report_templates').insert({
    code: code.toLowerCase().replace(/\s+/g, '_'),
    nom,
    description: description || null,
    sections: sections || [],
    is_active: true,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

// PUT
export async function PUT(req: NextRequest) {
  const check = await checkConfigAccess();
  if ('error' in check) return NextResponse.json({ error: check.error }, { status: check.status });

  const { id, nom, description, sections, is_active } = await req.json();
  if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 });

  const supabase = createAdminClient();
  const updates: any = {};
  if (nom !== undefined) updates.nom = nom;
  if (description !== undefined) updates.description = description;
  if (sections !== undefined) updates.sections = sections;
  if (is_active !== undefined) updates.is_active = is_active;

  const { data, error } = await supabase.from('report_templates').update(updates).eq('id', id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}

// DELETE
export async function DELETE(req: NextRequest) {
  const check = await checkConfigAccess();
  if ('error' in check) return NextResponse.json({ error: check.error }, { status: check.status });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 });

  const supabase = createAdminClient();
  const { error } = await supabase.from('report_templates').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
