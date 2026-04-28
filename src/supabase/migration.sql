-- ============================================================
-- USM Portal — Full Database Schema
-- Run this in Supabase SQL Editor or as a migration
-- ============================================================

-- ─── EXTENSIONS ───
create extension if not exists "uuid-ossp";

-- ============================================================
-- CORE TABLES
-- ============================================================

-- Ranks (seeded)
create table public.ranks (
  level int primary key,
  nom text not null,
  couleur text not null
);

-- Users
create table public.users (
  id uuid primary key default uuid_generate_v4(),
  discord_id text unique not null,
  username text not null,
  email text,
  avatar_url text,
  rank_level int not null default 1 references public.ranks(level),
  statut text not null default 'hors_ligne' check (statut in ('disponible','occupe','absent','hors_ligne')),
  is_active boolean not null default true,
  surnom text,
  date_naissance date,
  lieu_naissance text,
  telephone text,
  photo_profil_url text,
  carte_identite_url text,
  permis_url text,
  derniere_connexion timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Badges (seeded)
create table public.badges (
  id uuid primary key default uuid_generate_v4(),
  code text unique not null,
  nom text not null,
  couleur text not null,
  description text,
  ordre_affichage int not null default 0,
  icone text
);

-- User Badges (junction)
create table public.user_badges (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  badge_id uuid not null references public.badges(id) on delete cascade,
  attribue_par uuid references public.users(id),
  attribue_le timestamptz default now(),
  is_active boolean default true,
  raison text,
  revoque_par uuid references public.users(id),
  revoque_le timestamptz,
  raison_revocation text,
  unique(user_id, badge_id)
);

-- User Permissions
create table public.user_permissions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  permission text not null check (permission in ('dev','admin_panel','super_admin')),
  granted_by uuid references public.users(id),
  granted_at timestamptz default now(),
  unique(user_id, permission)
);

-- Rank History (audit)
create table public.rank_history (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  ancien_rang int not null,
  nouveau_rang int not null,
  raison text not null check (char_length(raison) >= 3),
  modifie_par uuid references public.users(id),
  created_at timestamptz default now()
);

-- ============================================================
-- TRAINING
-- ============================================================

create table public.training_sessions (
  id uuid primary key default uuid_generate_v4(),
  titre text not null,
  description text,
  plan text,
  date_session timestamptz not null,
  lieu text,
  rank_min int default 1,
  capacite_max int default 10,
  inscriptions_ouvertes boolean default true,
  badge_cible_id uuid references public.badges(id),
  createur_id uuid not null references public.users(id),
  statut text not null default 'planifie' check (statut in ('planifie','en_cours','termine','annule')),
  created_at timestamptz default now()
);

create table public.training_registrations (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid not null references public.training_sessions(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  inscrit_le timestamptz default now(),
  annule boolean default false,
  unique(session_id, user_id)
);

create table public.training_attendance (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid not null references public.training_sessions(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  statut text not null check (statut in ('present','absent','retard','excuse')),
  badge_obtenu boolean default false,
  commentaire text,
  pointe_par uuid references public.users(id),
  pointe_le timestamptz default now(),
  unique(session_id, user_id)
);

-- ============================================================
-- REPORTS
-- ============================================================

create table public.report_templates (
  id uuid primary key default uuid_generate_v4(),
  code text unique not null,
  nom text not null,
  description text,
  sections jsonb not null default '[]',
  is_active boolean default true
);

create table public.reports (
  id uuid primary key default uuid_generate_v4(),
  type text,
  template_code text references public.report_templates(code),
  titre text not null,
  contenu jsonb default '{}',
  sections jsonb default '[]',
  auteur_id uuid not null references public.users(id),
  statut text not null default 'draft' check (statut in ('draft','submitted','validated','rejected','published')),
  publie boolean default false,
  publie_par uuid references public.users(id),
  publie_le timestamptz,
  validateur_id uuid references public.users(id),
  commentaire_validation text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- HELPDESK (Retour & Sanction)
-- ============================================================

create table public.sanctions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  type text not null check (type in ('avertissement','blame','suspension')),
  raison text not null,
  duree_jours int,
  createur_id uuid not null references public.users(id),
  is_active boolean default true,
  created_at timestamptz default now(),
  expire_at timestamptz
);

create table public.helpdesk_tickets (
  id uuid primary key default uuid_generate_v4(),
  type text not null check (type in ('retour','sanction')),
  titre text not null,
  contenu text not null,
  auteur_id uuid not null references public.users(id),
  cible_user_id uuid references public.users(id),
  statut text not null default 'ouvert' check (statut in ('ouvert','en_cours','applique','rejete','resolu','ferme')),
  priorite text not null default 'normale' check (priorite in ('basse','normale','haute','critique')),
  traite_par uuid references public.users(id),
  traite_le timestamptz,
  sanction_appliquee_id uuid references public.sanctions(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.helpdesk_messages (
  id uuid primary key default uuid_generate_v4(),
  ticket_id uuid not null references public.helpdesk_tickets(id) on delete cascade,
  auteur_id uuid not null references public.users(id),
  contenu text not null,
  interne boolean default false,
  created_at timestamptz default now()
);

-- ============================================================
-- FORMATEURS
-- ============================================================

create table public.recrutements (
  id uuid primary key default uuid_generate_v4(),
  candidat_nom text not null,
  candidat_discord text,
  candidat_user_id uuid references public.users(id),
  formateur_id uuid references public.users(id),
  assistants uuid[] default '{}',
  date_rc timestamptz,
  lieu text,
  statut text not null default 'planifie' check (statut in ('planifie','en_cours','termine','annule')),
  notes text,
  createur_id uuid not null references public.users(id),
  created_at timestamptz default now()
);

create table public.rc_resultats (
  id uuid primary key default uuid_generate_v4(),
  recrutement_id uuid not null references public.recrutements(id) on delete cascade,
  candidat_nom text not null,
  date_rc timestamptz,
  formateur_id uuid references public.users(id),
  assistants uuid[] default '{}',
  tir_note int check (tir_note between 0 and 20),
  conduite_note int check (conduite_note between 0 and 20),
  procedure_note int check (procedure_note between 0 and 20),
  comportement_note int check (comportement_note between 0 and 20),
  note_globale numeric(4,2),
  points_forts text,
  points_faibles text,
  observations text,
  resultat text not null check (resultat in ('admis','refuse','a_repasser')),
  redacteur_id uuid references public.users(id),
  created_at timestamptz default now()
);

create table public.attestations (
  id uuid primary key default uuid_generate_v4(),
  numero serial,
  beneficiaire_id uuid not null references public.users(id),
  type text not null check (type in ('formation','competence','autorisation','distinction')),
  objet text not null,
  description text,
  valide_du date,
  valide_jusqu date,
  emetteur_id uuid not null references public.users(id),
  signature text,
  created_at timestamptz default now()
);

-- ============================================================
-- CRASH
-- ============================================================

create table public.investigations (
  id uuid primary key default uuid_generate_v4(),
  titre text not null,
  description text,
  responsable_id uuid not null references public.users(id),
  statut text not null default 'ouverte' check (statut in ('ouverte','en_cours','cloturee')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- ANNOUNCEMENTS
-- ============================================================

create table public.announcements (
  id uuid primary key default uuid_generate_v4(),
  type text not null check (type in ('communique','promotion','info')),
  titre text not null,
  contenu text,
  auteur_id uuid not null references public.users(id),
  cible_user_id uuid references public.users(id),
  rank_from int,
  rank_to int,
  created_at timestamptz default now()
);

-- ============================================================
-- ARCHIVES
-- ============================================================

create table public.archives (
  id uuid primary key default uuid_generate_v4(),
  username_final text not null,
  rank_final int not null,
  date_depart timestamptz default now(),
  raison text not null check (raison in ('demission','exclusion','inactivite','autre')),
  notes text,
  created_at timestamptz default now()
);

create table public.archive_records (
  id uuid primary key default uuid_generate_v4(),
  archive_id uuid not null references public.archives(id) on delete cascade,
  type text not null,
  contenu jsonb default '{}',
  date_evenement timestamptz
);

-- Documents
create table public.documents (
  id uuid primary key default uuid_generate_v4(),
  titre text not null,
  categorie text,
  url text,
  auteur_id uuid not null references public.users(id),
  created_at timestamptz default now()
);

-- ============================================================
-- WORKSPACE (Espace personnel)
-- ============================================================

create table public.workspace_folders (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  type text not null default 'organisation' check (type in ('organisation','entreprise','personne')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.workspace_fiches (
  id uuid primary key default uuid_generate_v4(),
  folder_id uuid not null references public.workspace_folders(id) on delete cascade,
  titre text not null,
  type text not null default 'civil',
  contenu jsonb not null default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================

create table public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  type text not null,
  titre text not null,
  contenu text,
  lien text,
  lu boolean default false,
  created_at timestamptz default now()
);

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Auto-announcement on rank change
create or replace function public.fn_rank_change_announcement()
returns trigger as $$
begin
  if OLD.rank_level <> NEW.rank_level then
    insert into public.announcements (type, titre, contenu, auteur_id, cible_user_id, rank_from, rank_to)
    values ('promotion', 'Promotion', 'a été promu(e)', NEW.id, NEW.id, OLD.rank_level, NEW.rank_level);
  end if;
  return NEW;
end;
$$ language plpgsql security definer;

create trigger trg_rank_change_announcement
  after update of rank_level on public.users
  for each row execute function public.fn_rank_change_announcement();

-- Auto-update updated_at
create or replace function public.fn_updated_at()
returns trigger as $$
begin
  NEW.updated_at = now();
  return NEW;
end;
$$ language plpgsql;

create trigger trg_users_updated_at before update on public.users for each row execute function public.fn_updated_at();
create trigger trg_reports_updated_at before update on public.reports for each row execute function public.fn_updated_at();
create trigger trg_tickets_updated_at before update on public.helpdesk_tickets for each row execute function public.fn_updated_at();
create trigger trg_investigations_updated_at before update on public.investigations for each row execute function public.fn_updated_at();
create trigger trg_folders_updated_at before update on public.workspace_folders for each row execute function public.fn_updated_at();
create trigger trg_fiches_updated_at before update on public.workspace_fiches for each row execute function public.fn_updated_at();

-- Auto-expire suspensions
create or replace function public.fn_set_sanction_expiry()
returns trigger as $$
begin
  if NEW.type = 'suspension' and NEW.duree_jours is not null then
    NEW.expire_at = NEW.created_at + (NEW.duree_jours || ' days')::interval;
  end if;
  return NEW;
end;
$$ language plpgsql;

create trigger trg_sanction_expiry before insert on public.sanctions for each row execute function public.fn_set_sanction_expiry();

-- ============================================================
-- RLS POLICIES
-- ============================================================

alter table public.users enable row level security;
alter table public.badges enable row level security;
alter table public.user_badges enable row level security;
alter table public.ranks enable row level security;
alter table public.rank_history enable row level security;
alter table public.training_sessions enable row level security;
alter table public.training_registrations enable row level security;
alter table public.training_attendance enable row level security;
alter table public.reports enable row level security;
alter table public.helpdesk_tickets enable row level security;
alter table public.helpdesk_messages enable row level security;
alter table public.sanctions enable row level security;
alter table public.recrutements enable row level security;
alter table public.announcements enable row level security;
alter table public.workspace_folders enable row level security;
alter table public.workspace_fiches enable row level security;
alter table public.notifications enable row level security;

-- Public read for ranks & badges
create policy "ranks_read" on public.ranks for select using (true);
create policy "badges_read" on public.badges for select using (true);

-- Users: authenticated can read active, own row full access
create policy "users_read" on public.users for select to authenticated using (true);
create policy "users_update_self" on public.users for update to authenticated using (id = auth.uid());

-- User badges: authenticated read
create policy "user_badges_read" on public.user_badges for select to authenticated using (true);
create policy "user_badges_insert" on public.user_badges for insert to authenticated with check (true);
create policy "user_badges_update" on public.user_badges for update to authenticated using (true);

-- Training: authenticated read, creator manages
create policy "sessions_read" on public.training_sessions for select to authenticated using (true);
create policy "sessions_insert" on public.training_sessions for insert to authenticated with check (true);
create policy "sessions_update" on public.training_sessions for update to authenticated using (true);
create policy "regs_read" on public.training_registrations for select to authenticated using (true);
create policy "regs_insert" on public.training_registrations for insert to authenticated with check (user_id = auth.uid());
create policy "regs_update" on public.training_registrations for update to authenticated using (user_id = auth.uid());
create policy "att_read" on public.training_attendance for select to authenticated using (true);
create policy "att_insert" on public.training_attendance for insert to authenticated with check (true);
create policy "att_update" on public.training_attendance for update to authenticated using (true);

-- Reports: read own + published, insert own
create policy "reports_read" on public.reports for select to authenticated using (auteur_id = auth.uid() or publie = true);
create policy "reports_insert" on public.reports for insert to authenticated with check (auteur_id = auth.uid());
create policy "reports_update" on public.reports for update to authenticated using (true);

-- Helpdesk: authenticated
create policy "tickets_read" on public.helpdesk_tickets for select to authenticated using (true);
create policy "tickets_insert" on public.helpdesk_tickets for insert to authenticated with check (true);
create policy "tickets_update" on public.helpdesk_tickets for update to authenticated using (true);
create policy "messages_read" on public.helpdesk_messages for select to authenticated using (true);
create policy "messages_insert" on public.helpdesk_messages for insert to authenticated with check (true);

-- Sanctions: authenticated read
create policy "sanctions_read" on public.sanctions for select to authenticated using (true);
create policy "sanctions_insert" on public.sanctions for insert to authenticated with check (true);

-- Recrutements
create policy "recrutements_read" on public.recrutements for select to authenticated using (true);
create policy "recrutements_insert" on public.recrutements for insert to authenticated with check (true);
create policy "recrutements_update" on public.recrutements for update to authenticated using (true);

-- Announcements: all read
create policy "announcements_read" on public.announcements for select to authenticated using (true);
create policy "announcements_insert" on public.announcements for insert to authenticated with check (true);

-- Rank history: authenticated read
create policy "rank_history_read" on public.rank_history for select to authenticated using (true);
create policy "rank_history_insert" on public.rank_history for insert to authenticated with check (true);

-- Workspace: owner reads own, co-lead+ reads all
create policy "folders_read" on public.workspace_folders for select to authenticated
  using (owner_id = auth.uid() or (select rank_level from public.users where id = auth.uid()) >= 7);
create policy "folders_insert" on public.workspace_folders for insert to authenticated with check (owner_id = auth.uid());
create policy "folders_update" on public.workspace_folders for update to authenticated using (owner_id = auth.uid());
create policy "folders_delete" on public.workspace_folders for delete to authenticated using (owner_id = auth.uid());

create policy "fiches_read" on public.workspace_fiches for select to authenticated
  using (
    folder_id in (select id from public.workspace_folders where owner_id = auth.uid())
    or (select rank_level from public.users where id = auth.uid()) >= 7
  );
create policy "fiches_insert" on public.workspace_fiches for insert to authenticated with check (
  folder_id in (select id from public.workspace_folders where owner_id = auth.uid())
);
create policy "fiches_update" on public.workspace_fiches for update to authenticated using (
  folder_id in (select id from public.workspace_folders where owner_id = auth.uid())
);
create policy "fiches_delete" on public.workspace_fiches for delete to authenticated using (
  folder_id in (select id from public.workspace_folders where owner_id = auth.uid())
);

-- Notifications: own only
create policy "notifs_read" on public.notifications for select to authenticated using (user_id = auth.uid());
create policy "notifs_update" on public.notifications for update to authenticated using (user_id = auth.uid());
create policy "notifs_insert" on public.notifications for insert to authenticated with check (true);

-- ============================================================
-- SEED DATA
-- ============================================================

insert into public.ranks (level, nom, couleur) values
  (1, 'BCSO', '#4A5670'),
  (2, 'USM', '#6B7B9C'),
  (3, 'USM Confirmé', '#1B3E7C'),
  (4, 'Formateur', '#2E5AA8'),
  (5, 'Opérateur Second', '#8B6A42'),
  (6, 'Opérateur', '#A67C4E'),
  (7, 'Co-Leader', '#D43A4F'),
  (8, 'Leader', '#B32134'),
  (9, 'Shériff', '#C9994F')
on conflict (level) do nothing;

insert into public.badges (code, nom, couleur, description, ordre_affichage, icone) values
  ('CRASH', 'CRASH', '#B32134', 'Unité spéciale CRASH', 0, '💥'),
  ('FORMATEUR', 'Formateur', '#2E5AA8', 'Formateur certifié', 1, '🎓'),
  ('INSTRUCTEUR', 'Instructeur', '#3B82F6', 'Instructeur qualifié', 2, '📘'),
  ('NEGOCIATEUR', 'Négociateur', '#8B5CF6', 'Négociateur de crise', 3, '🤝'),
  ('BMO', 'BMO', '#059669', 'Breveté Maniement Opérationnel', 4, '🎯'),
  ('DRONE', 'Drone', '#0891B2', 'Pilote de drone certifié', 5, '🛸'),
  ('GAV', 'GAV', '#D97706', 'Garde à vue certifié', 6, '🔒'),
  ('BRACELET', 'Bracelet', '#7C3AED', 'Habilité bracelet électronique', 7, '📎'),
  ('FEDERAL', 'Fédéral', '#DC2626', 'Agent fédéral', 8, '🦅')
on conflict (code) do nothing;

insert into public.report_templates (code, nom, description, sections) values
  ('gav', 'GAV', 'Rapport de garde à vue', '[{"titre":"Informations","champs":[{"nom":"suspect","label":"Suspect","type":"text","required":true},{"nom":"motif","label":"Motif","type":"textarea","required":true},{"nom":"date_debut","label":"Date/Heure début","type":"datetime","required":true},{"nom":"duree","label":"Durée","type":"text","required":true},{"nom":"deroulement","label":"Déroulement","type":"textarea","required":true}]}]'),
  ('interrogatoire', 'Interrogatoire', 'Procès-verbal d''interrogatoire', '[{"titre":"Interrogatoire","champs":[{"nom":"suspect","label":"Suspect","type":"text","required":true},{"nom":"contexte","label":"Contexte","type":"textarea","required":true},{"nom":"questions_reponses","label":"Questions / Réponses","type":"textarea","required":true},{"nom":"conclusion","label":"Conclusion","type":"textarea","required":true}]}]'),
  ('bracelet', 'Bracelet', 'Rapport de bracelet électronique', '[{"titre":"Bracelet","champs":[{"nom":"personne","label":"Personne concernée","type":"text","required":true},{"nom":"type_bracelet","label":"Type de bracelet","type":"text","required":true},{"nom":"conditions","label":"Conditions","type":"textarea","required":true}]}]'),
  ('federal', 'Fédéral', 'Rapport d''opération fédérale', '[{"titre":"Opération","champs":[{"nom":"operation","label":"Nom de l''opération","type":"text","required":true},{"nom":"objectifs","label":"Objectifs","type":"textarea","required":true},{"nom":"deroulement","label":"Déroulement","type":"textarea","required":true},{"nom":"resultats","label":"Résultats","type":"textarea","required":true}]}]'),
  ('custom', 'Custom', 'Rapport libre', '[]')
on conflict (code) do nothing;

-- ============================================================
-- STORAGE BUCKETS (run in Supabase dashboard or via API)
-- ============================================================
-- insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true);
-- insert into storage.buckets (id, name, public) values ('documents-prives', 'documents-prives', false);
-- insert into storage.buckets (id, name, public) values ('rapports', 'rapports', false);
