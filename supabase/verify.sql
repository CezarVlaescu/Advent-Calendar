-- Test de securitate. Rulează ÎN SQL EDITOR, după schema.sql.
-- Este o tranzacție temporară: nu păstrează uși de test.
-- În orice dată anterioară anului 2099, ușa de mai jos trebuie ascunsă vizitatorilor anonimi.
begin;
insert into public.doors (year, day, title, message)
values (2099, 24, 'Ușa invizibilă', 'Acest secret NU trebuie vizibil pentru anon')
on conflict (year, day) do update set title=excluded.title, message=excluded.message;

set local role anon;
-- Rezultatul trebuie să fie FALSE.
select public.is_advent_admin() as anon_is_admin;
-- Rezultatul trebuie să fie 0, FĂRĂ eroare 42501 / permission denied.
select count(*) as future_doors_visible_to_anon
from public.doors where year=2099 and day=24;
-- Rezultatul trebuie să fie data curentă în fusul orar România (AAAA-LL-ZZ).
select public.advent_server_date() as romania_date;

reset role;
rollback;
