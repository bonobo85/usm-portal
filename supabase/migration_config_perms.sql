-- ============================================================
-- USM Portal — Config Management Permissions
-- Run AFTER the main migration.sql
-- Allows Shériff (rank 9) and users with 'dev' permission
-- to create, update, and delete ranks, badges, and templates.
-- ============================================================

-- ─── Helper function: check if user can manage config ───
create or replace function public.can_manage_config(user_uuid uuid)
returns boolean as $$
begin
  return exists (
    select 1 from public.users
    where id = user_uuid and rank_level >= 9
  ) or exists (
    select 1 from public.user_permissions
    where user_id = user_uuid and permission = 'dev'
  );
end;
$$ language plpgsql security definer;

-- ─── Ranks: allow config managers to insert/update/delete ───
create policy "ranks_insert" on public.ranks
  for insert to authenticated
  with check (public.can_manage_config(auth.uid()));

create policy "ranks_update" on public.ranks
  for update to authenticated
  using (public.can_manage_config(auth.uid()));

create policy "ranks_delete" on public.ranks
  for delete to authenticated
  using (public.can_manage_config(auth.uid()));

-- ─── Badges: allow config managers to insert/update/delete ───
create policy "badges_insert" on public.badges
  for insert to authenticated
  with check (public.can_manage_config(auth.uid()));

create policy "badges_update" on public.badges
  for update to authenticated
  using (public.can_manage_config(auth.uid()));

create policy "badges_delete" on public.badges
  for delete to authenticated
  using (public.can_manage_config(auth.uid()));

-- ─── Report Templates: allow config managers full CRUD ───
create policy "templates_read" on public.report_templates
  for select to authenticated using (true);

create policy "templates_insert" on public.report_templates
  for insert to authenticated
  with check (public.can_manage_config(auth.uid()));

create policy "templates_update" on public.report_templates
  for update to authenticated
  using (public.can_manage_config(auth.uid()));

create policy "templates_delete" on public.report_templates
  for delete to authenticated
  using (public.can_manage_config(auth.uid()));
