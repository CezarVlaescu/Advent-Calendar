# Little December v1.2 — Checklist înainte de publicare 🎄

- [ ] Node.js 22.13+ instalat; `npm install` și `npm test` funcționează.
- [ ] `npm run dev:demo` afișează designul dorit.
- [ ] Repository-ul GitHub creat, fără parole sau fișiere `.env` comise.
- [ ] Proiect nou Netlify conectat la repository.
- [ ] Două variabile în Netlify: `ADVENT_ADMIN_PASSWORD` (16+ caractere) și `ADVENT_SESSION_SECRET` (32+ caractere), fără prefix `VITE_`.
- [ ] `ADVENT_YEAR`/`VITE_ADVENT_YEAR` setate la `2026` dacă este nevoie.
- [ ] `npm run build` și deploy Netlify fără erori.
- [ ] API-ul `/.netlify/functions/advent?action=calendar` răspunde cu `serverDate` și `items`.
- [ ] Te poți autentifica în Admin cu parola din Netlify și poți salva o surpriză.
- [ ] Fotografiile se pot încărca, afișa în Admin și elimina din surpriză.
- [ ] Mod incognito: surprizele pentru zilele viitoare NU sunt disponibile prin API, nici fotografiile.
- [ ] Verifică la data reală de 1 decembrie că doar ușița 1 este accesibilă (pe baza datei de server).
- [ ] Testează pe telefon real, cu browser neautentificat.
- [ ] Nu trimite parola de Admin partenerei. Folosește Logout când ai terminat editarea.
- [ ] Verifică **Usage & billing** pe Netlify după publicare, pentru a rămâne în limitele planului gratuit.
- [ ] După sărbători: fă backup la Blob JSON și fotografii înainte de arhivarea/ștergerea site-ului.

**Notă:** Un preview Admin cu zile viitoare este permis doar după autentificare și nu schimbă data serverului. Publicul vede exclusiv zilele ajunse în calendar.
