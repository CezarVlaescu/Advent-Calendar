-- Little December · calendar Advent 2026
-- Execută acest fișier în Supabase > SQL Editor, cu un cont proprietar al proiectului.
-- Nu pune niciodată service_role key în aplicația frontend.

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.admin_users enable row level security;
revoke all on public.admin_users from anon, authenticated;
grant select on public.admin_users to authenticated;

-- IMPORTANT: politicile de mai jos sunt evaluate și pentru vizitatori anonimi.
-- Ei NU pot citi tabela admin_users; un subquery direct aici ar cauza
-- `permission denied for table admin_users` în loc de a ascunde ușile viitoare.
-- Acest helper verifică DOAR dacă utilizatorul curent este administrator.
-- Creați-l din SQL Editor, sub rolul postgres (proprietar cu BYPASSRLS).
create or replace function public.is_advent_admin()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admin_users a
    where a.user_id = (select auth.uid())
  );
$$;
revoke all on function public.is_advent_admin() from public;
grant execute on function public.is_advent_admin() to anon, authenticated;

drop policy if exists "An admin can read their own role" on public.admin_users;
create policy "An admin can read their own role"
on public.admin_users for select to authenticated
using (user_id = (select auth.uid()));

create table if not exists public.doors (
  id bigint generated always as identity primary key,
  year integer not null check (year between 2025 and 2100),
  day integer not null check (day between 1 and 24),
  type text not null default 'letter' check (type in ('letter','voucher','photo','quiz','treasure')),
  title text not null default '',
  message text not null default '',
  image_path text,
  quiz_question text not null default '',
  quiz_options jsonb not null default '["", "", ""]'::jsonb,
  quiz_correct_index integer not null default 0 check (quiz_correct_index between 0 and 2),
  updated_at timestamptz not null default now(),
  unique (year, day)
);
alter table public.doors enable row level security;
revoke all on public.doors from anon, authenticated;
grant select on public.doors to anon, authenticated;
grant insert, update, delete on public.doors to authenticated;

-- Ceas public, doar pentru citire. Acesta folosește data reală din serverul PostgreSQL,
-- fără a avea încredere în setările telefonului sau în JavaScript-ul din browser.
create or replace function public.advent_server_date()
returns text
language sql stable security invoker
set search_path = ''
as $$
  select to_char((now() at time zone 'Europe/Bucharest')::date, 'YYYY-MM-DD');
$$;
revoke all on function public.advent_server_date() from public;
grant execute on function public.advent_server_date() to anon, authenticated;

-- IMPORTANT: data reală este verificată de server, nu de data telefonului.
-- Un vizitator poate citi DOAR ușițele deja deblocate la 00:00 ora Bucureștiului.
-- Administratorul poate citi și viitoarele surprize pentru a le edita.
drop policy if exists "Read only unlocked doors or be admin" on public.doors;
create policy "Read only unlocked doors or be admin"
on public.doors for select to anon, authenticated
using (
  make_date(year, 12, day) <= ((now() at time zone 'Europe/Bucharest')::date)
  or (select public.is_advent_admin())
);

drop policy if exists "Only admins insert surprises" on public.doors;
create policy "Only admins insert surprises"
on public.doors for insert to authenticated
with check ((select public.is_advent_admin()));

drop policy if exists "Only admins update surprises" on public.doors;
create policy "Only admins update surprises"
on public.doors for update to authenticated
using ((select public.is_advent_admin()))
with check ((select public.is_advent_admin()));

drop policy if exists "Only admins delete surprises" on public.doors;
create policy "Only admins delete surprises"
on public.doors for delete to authenticated
using ((select public.is_advent_admin()));

-- Imaginile sunt PRIVATE. O fotografie poate fi vizualizată doar după
-- deblocarea ușiței, sau de administrator.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('advent-private', 'advent-private', false, 5242880,
        array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public=false, file_size_limit=5242880,
        allowed_mime_types=array['image/jpeg','image/png','image/webp'];

drop policy if exists "Advent private photos read on unlock" on storage.objects;
create policy "Advent private photos read on unlock"
on storage.objects for select to anon, authenticated
using (
  bucket_id = 'advent-private'
  and (
    (select public.is_advent_admin())
    or exists (
      select 1 from public.doors d
      where d.image_path = storage.objects.name
      and make_date(d.year, 12, d.day) <= ((now() at time zone 'Europe/Bucharest')::date)
    )
  )
);

drop policy if exists "Only admins upload advent photos" on storage.objects;
create policy "Only admins upload advent photos"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'advent-private'
  and (select public.is_advent_admin())
);

drop policy if exists "Only admins update advent photos" on storage.objects;
create policy "Only admins update advent photos"
on storage.objects for update to authenticated
using (bucket_id = 'advent-private' and (select public.is_advent_admin()))
with check (bucket_id = 'advent-private' and (select public.is_advent_admin()));

drop policy if exists "Only admins remove advent photos" on storage.objects;
create policy "Only admins remove advent photos"
on storage.objects for delete to authenticated
using (bucket_id = 'advent-private' and (select public.is_advent_admin()));

-- 1. Creează un user cu email + parolă în Authentication > Users.
-- 2. Înlocuiește emailul de mai jos cu emailul acelui cont.
-- 3. Rulează SEPARAT această comandă (după ce userul există):
-- insert into public.admin_users (user_id)
-- select id from auth.users where email = 'EMAILUL_TAU@EXEMPLU.RO'
-- on conflict do nothing;
