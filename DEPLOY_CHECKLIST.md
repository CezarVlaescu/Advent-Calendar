# Little December — lista de verificare pentru publicare

## 1. Supabase (o singură dată)
- [ ] Alege un proiect Supabase separat pentru Advent (nu modifica magazinul de lumânări).
- [ ] Execută `supabase/schema.sql` în SQL Editor.
- [ ] Execută `supabase/verify.sql`: `anon_is_admin=false`, `future_doors_visible_to_anon=0`.
- [ ] Creează în `Authentication > Users` utilizatorul administrator cu emailul și parola ta.
- [ ] În SQL Editor, atribuie dreptul de admin:
  ```sql
  insert into public.admin_users(user_id)
  select id from auth.users where email='EMAILUL_TAU@EXEMPLU.RO'
  on conflict do nothing;
  ```
- [ ] Copiază **Project URL** și cheia **publishable** / `anon` (NICIODATĂ service_role/secret).

## 2. Pe calculator
- [ ] Copiază `.env.example` în `.env` și completează `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
- [ ] Lasă `VITE_ADVENT_YEAR=2026`; personalizează `VITE_PERSON_NAME`, `VITE_FROM_NAME`.
- [ ] `npm install`, `npm test`, `npm run build`, `npm run dev`.
- [ ] Intră în `/#admin`, loghează-te și salvează o surpriză pentru o zi viitoare.
- [ ] În mod Admin, folosește butonul de preview; asigură-te că vedeți mesaje și poze.

## 3. Netlify
- [ ] Creează un repo GitHub **privat** cu proiectul (fără `.env`).
- [ ] Importă repo-ul în Netlify. Build: `npm run build`, publish: `dist` (`netlify.toml` deja le definește).
- [ ] Setează în Netlify, la Environment variables: aceleași 5 variabile `VITE_...` din `.env`.
- [ ] Re-deploy după setarea variabilelor.
- [ ] În Supabase Authentication -> URL Configuration adaugă adresa Netlify la Site URL / Redirect URLs pentru fluxurile de email.
- [ ] Testează într-o fereastră incognito pe telefon: înainte de 1 decembrie, toate ușile sunt blocate.
- [ ] Testează schimbarea manuală a datei telefonului: ușile viitoare trebuie să rămână blocate.
- [ ] Testează că nu se văd texte și imagini viitoare într-un browser fără autentificare.

## 4. Pe 1 decembrie 2026
- [ ] Pregătește cel puțin surpriza de la ușa 1.
- [ ] Verifică după 00:00 **Europe/Bucharest** că doar ziua 1 este nou disponibilă.
- [ ] Trimite-i linkul. 💜

> Notă: modul demo nu este destinat publicării. Pozele viitoare sunt protejate prin Storage RLS și SQL. `noindex` reduce indexarea, dar nu limitează accesul la link. Contul admin rămâne privat.
