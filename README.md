# 🎄 Little December v1.2 — Advent Calendar fără Supabase

Aplicația păstrează **exact același design React** din versiunea inițială. Acum folosește exclusiv **Netlify Functions + Netlify Blobs** pentru stocarea sigură a celor 24 de surprize și a fotografiilor. Nu trebuie creată nicio bază de date sau niciun proiect Supabase.

## 🎁 Ce face aplicația

- Vizitatoarea vede calendarul și poate deschide doar zilele ajunse în calendar, **după ora Europe/Bucharest, verificată în Netlify Function**.
- API-ul public livrează **doar conținutul zilelor deblocate**; nu trimite anticipat mesaje ori URL-uri pentru fotografiile viitoare.
- Fotografiile sunt stocate privat în Netlify Blobs și servite prin API după verificarea datei (sau către administratorul autentificat).
- Tu intri în **Admin** cu o singură parolă secretă, editezi titluri, texte, vouchere, quiz-uri, indicii și fotografii.
- **Modul de previzualizare** este disponibil doar când ești autentificat ca administrator.
- Persoana care deschide calendarul nu are nevoie de cont. Progresul (uși deja văzute) se păstrează în browserul ei.

## 1. Deschide demo-ul fără configurare

Instalează Node.js **22.13+** (recomandat **22.16+** sau un LTS mai nou), apoi în folderul proiectului:

```bash
npm install
npm run dev:demo
```

Deschide linkul local afișat de Vite. Demo-ul salvează doar în localStorage, deci **nu folosi modul demo în producție**.

Ai și `preview.html`, o previzualizare statică ce se deschide direct în browser.

## 2. Configurează Netlify pentru site-ul real

1. Creează un repository privat GitHub pentru acest proiect și încarcă fișierele (fără `.env` și `node_modules`).
2. În Netlify → **Add new project → Import an existing project**, conectează repository-ul.
3. `netlify.toml` conține deja:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
   - **Functions directory:** `netlify/functions`
4. În Netlify → **Project configuration → Environment variables**, setează:

| Nume | Exemplu / scop |
|------|---------------|
| `ADVENT_ADMIN_PASSWORD` | **Parolă unică de cel puțin 16 caractere**, folosită doar pentru Admin. NU o trimite nimănui. |
| `ADVENT_SESSION_SECRET` | Valoare aleatoare de **cel puțin 32 caractere** pentru semnarea cookie-ului de autentificare. |
| `ADVENT_YEAR` | `2026` (opțional; implicit 2026) |
| `VITE_ADVENT_YEAR` | `2026` (opțional; implicit 2026) |
| `VITE_PERSON_NAME` | Numele / alintul ei, în pagina principală |
| `VITE_FROM_NAME` | Semnătura ta din subsol |

Generează o cheie aleatoare direct pe **calculatorul tău**, fără s-o partajezi:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

**Foarte important:** parola și cheia NU trebuie să înceapă cu `VITE_`: acele variabile ar fi incluse în codul public al browserului. Configurează-le numai în Netlify, nu în `netlify.toml`, și publică un deploy nou după orice modificare de variabile.

5. Publică proiectul. Accesează URL-ul Netlify primit (de forma `https://nume-site.netlify.app`).
6. Deschide **Admin**, introdu parola, salvează o surpriză pentru o zi de test.
7. Verifică dintr-un browser separat (incognito, fără cookie-ul tău) că **nu poți citi conținutul zilelor viitoare**.
8. Pentru a-l trimite iubitei pe 1 decembrie, trimite-i doar URL-ul principal, **nu parola**.

### Testare locală cu backend real (opțional)

După instalare, poți rula:

```bash
npm run dev
```

Aceasta pornește `netlify dev`, incluzând funcțiile și un magazin Blobs local. Pentru autentificarea locală, pune valorile secrete numai într-un fișier `.env` local ignorat de Git și folosește aceleași denumiri. Netlify Dev poate necesita autentificare și asocierea cu un proiect Netlify, în funcție de configurare.

## 3. Cum funcționează protecția

- `GET /.netlify/functions/advent?action=calendar` trimite data curentă a serverului (zona România) și surprizele deja permise. `Cache-Control: no-store` previne cache-ul conținutului accidental.
- `POST ?action=login` verifică parola pe server; la succes emite un **cookie semnat HttpOnly, SameSite=Strict** valabil șapte zile. Logout invalidează cookie-ul local.
- `GET ?action=admin` returnează toate surprizele **doar** pentru un cookie valid.
- `POST ?action=save` și `POST ?action=upload` necesită cookie valid și origine identică cu site-ul.
- `GET ?action=image&key=...` verifică autorizarea sau că fotografia aparține unei uși deja deblocate.
- Schimbarea ceasului telefonului **nu deblochează conținutul**, deoarece API-ul decide ce trimite în funcție de ceasul serverului.

Nu există cont de utilizator, e-mail obligatoriu sau integrare cu Supabase. Folosește o parolă lungă și unică; nu partaja telefonul/browserul pe care ești autentificat în Admin. Acesta este un proiect mic, nu un sistem de autentificare pentru o aplicație cu mulți utilizatori.

## 4. Ce se salvează și unde

- Un singur obiect JSON `year-2026`, în magazinul privat `little-december-doors`, cu maximum 24 de surprize.
- Fotografiile în magazinul `little-december-photos`.
- Netlify Blobs sunt asociate **site-ului Netlify** și persistă între deployuri. Nu sunt incluse automat în repo-ul GitHub sau în ZIP: fă un backup manual înainte să ștergi site-ul.
- Din panoul Netlify, mergi la **Data & Storage → Blobs** pentru a vizualiza obiectele salvate. Pentru backup poți descărca JSON-ul și fotografiile.

Planul Netlify Free are limite de utilizare. Calendarul este un site mic, cu trafic redus, dar **nu există garanția unui cost zero indiferent de trafic**; urmărește creditele din Netlify → Usage & billing.

## 5. Testare și constrângeri

```bash
npm test
npm run build
```

Testele includ deblocarea la miezul nopții (ora României), filtrarea server-side, schimbarea falsă a datei telefonului și validarea surprizelor. `npm run build` necesită instalarea pachetelor cu npm și nu a putut fi verificat automat în mediul de generare (registrul npm a răspuns cu eroare DNS `EAI_AGAIN`).

**Nu publicăm un link activ din acest ZIP:** trebuie să conectezi personal un repository la site-ul tău Netlify, să setezi cele două secrete și să rulezi deploy-ul.

## Fișiere importante

- `src/App.tsx` — interfața React existentă, neschimbată vizual.
- `src/styles.css` — designul original (neschimbat).
- `src/data.ts` — tipuri, demo, personalizare.
- `netlify/functions/advent.ts` — API-ul serverului și controlul accesului.
- `netlify/functions/logic.ts` — data românească, filtrare și validări.
- `tests/*.test.mjs` — teste automate.
- `netlify.toml` — configurarea Netlify.
- `DEPLOY_CHECKLIST.md` — verificare rapidă înainte de 1 decembrie.

Sursă oficială: https://docs.netlify.com/build/data-and-storage/netlify-blobs/
