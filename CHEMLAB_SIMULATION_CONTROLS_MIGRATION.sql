-- Proposal only. Do not run until CHEMLAB's Supabase schema and role model are approved.
-- This migration does not alter or drop existing tables.

create table if not exists public.simulation_controls (
  id uuid primary key default gen_random_uuid(),
  label text not null check (char_length(trim(label)) between 1 and 120),
  workspace_size numeric(2,1) not null default 4 check (workspace_size between 2 and 6),
  timer_duration integer not null default 15 check (timer_duration between 5 and 60 and timer_duration % 5 = 0),
  collision_detection boolean not null default true,
  quick_combine_default boolean not null default false,
  atom_speed numeric(2,1) not null default 1 check (atom_speed between 0.5 and 2),
  show_hints boolean not null default true,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Guarantees that at most one profile is active without imposing that one must exist.
create unique index if not exists simulation_controls_one_active_profile
  on public.simulation_controls ((is_active))
  where is_active;

-- RLS policy templates: replace the role predicate after the project's profile/role schema is approved.
alter table public.simulation_controls enable row level security;

-- Students need only the active profile; no public write policy is included.
create policy "Students can read the active simulation profile"
  on public.simulation_controls for select
  to authenticated
  using (is_active);

-- Intentionally not executable until a canonical teacher/admin role source exists:
-- create policy "Teachers manage simulation profiles"
--   on public.simulation_controls for all to authenticated
--   using (<approved_teacher_or_admin_predicate>)
--   with check (<approved_teacher_or_admin_predicate>);

-- Add the project's standard updated_at trigger only after its existing trigger function is identified.
