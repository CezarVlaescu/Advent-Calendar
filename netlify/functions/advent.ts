import { getStore } from '@netlify/blobs';
import { createHmac, createHash, randomUUID, timingSafeEqual } from 'node:crypto';
import { unlocked } from '../../src/calendarLogic.ts';
import { currentRomanianDate, visibleSurprises, validateSurprise, type SavedSurprise } from './logic.ts';

// One Netlify Function + Netlify Blobs. No external database or Supabase needed.
const secrets = () => ({
  password: process.env.ADVENT_ADMIN_PASSWORD ?? '',
  signingKey: process.env.ADVENT_SESSION_SECRET ?? ''
});
const year = Number(process.env.ADVENT_YEAR || process.env.VITE_ADVENT_YEAR || '2026');
const sessionName = 'little_december_admin';
const week = 7 * 24 * 60 * 60;
const doorStore = () => getStore({ name: 'little-december-doors', consistency: 'strong' });
const photoStore = () => getStore({ name: 'little-december-photos', consistency: 'strong' });
const headers = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer' };
const json = (payload: unknown, status = 200, additional?: HeadersInit) =>
  new Response(JSON.stringify(payload), { status, headers: { ...headers, 'Content-Type': 'application/json; charset=utf-8', ...additional } });
const error = (message: string, status = 400) => json({ error: message }, status);
const equal = (a: string, b: string): boolean => timingSafeEqual(createHash('sha256').update(a).digest(), createHash('sha256').update(b).digest());
const signature = (expires: string, secret: string, password: string) => createHmac('sha256', secret).update(`little-december|${expires}|${password}`).digest('hex');
const sessionCookie = (expires: string, request: Request) => {
  const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : '';
  return `${sessionName}=${expires}.${signature(expires, secrets().signingKey, secrets().password)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${week}${secure}`;
};
const isAdmin = (request: Request): boolean => {
  const { password, signingKey } = secrets();
  if (password.length < 16 || signingKey.length < 32) return false;
  const cookie = request.headers.get('cookie')?.split(';').map(s => s.trim()).find(v => v.startsWith(`${sessionName}=`));
  const token = cookie?.slice(sessionName.length + 1) || '';
  const match = /^(\d{10,13})\.([a-f0-9]{64})$/.exec(token);
  if (!match || Number(match[1]) <= Date.now() || Number(match[1]) > Date.now() + week * 1000) return false;
  return equal(match[2], signature(match[1], signingKey, password));
};
const safeOrigin = (request: Request): boolean => request.headers.get('origin') === new URL(request.url).origin;
// O singură citire pentru tot calendarul: evită 24 cereri la fiecare refresh.
const loaded = async (): Promise<SavedSurprise[]> => {
  const entries = await doorStore().get(`year-${year}`, { type: 'json' }) as unknown;
  if (!Array.isArray(entries)) return [];
  return entries.filter((item): item is SavedSurprise => item !== null && typeof item === 'object')
    .filter(item => item.year === year && Number.isInteger(item.day) && item.day >= 1 && item.day <= 24)
    .sort((a,b) => a.day - b.day);
};
const imagePathValid = (key: string): boolean => /^\d{4}\/day-(?:[1-9]|1\d|2[0-4])\/[0-9a-f-]{36}\.(?:jpg|jpeg|png|webp)$/.test(key);

export default async function advent(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const action = url.searchParams.get('action') || 'calendar';
  const date = currentRomanianDate();
  if (!Number.isInteger(year) || year < 2026 || year > 2100) return error('Anul calendarului nu este configurat corect.', 503);
  try {
    if (request.method === 'GET' && action === 'calendar') {
      const items = visibleSurprises(await loaded(), date, year);
      return json({ serverDate: date.iso, items });
    }
    if (request.method === 'GET' && action === 'admin') {
      return isAdmin(request) ? json({ isAdmin: true, items: await loaded() }) : json({ isAdmin: false, items: [] });
    }
    if (request.method === 'GET' && action === 'image') {
      const key = url.searchParams.get('key') || '';
      if (!imagePathValid(key)) return error('Fotografie negăsită.', 404);
      const [, rawDay] = /^\d{4}\/day-(\d+)\//.exec(key) || [];
      const doorDay = Number(rawDay);
      if (!isAdmin(request)) {
        if (!unlocked(doorDay, date.zoned, year)) return error('Fotografia nu este încă disponibilă.', 403);
        const door = (await loaded()).find(item => item.day === doorDay);
        if (door?.image_path !== key) return error('Fotografie negăsită.', 404);
      }
      const item = await photoStore().getWithMetadata(key, { type: 'blob' });
      if (!item) return error('Fotografie negăsită.', 404);
      const contentType = String(item.metadata?.contentType || 'image/jpeg');
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(contentType)) return error('Format invalid.', 415);
      return new Response(item.data, { headers: { ...headers, 'Content-Type': contentType } });
    }
    if (request.method === 'POST') {
      if (!safeOrigin(request)) return error('Cerere respinsă: origine invalidă.', 403);
      if (action === 'login') {
        const { password, signingKey } = secrets();
        if (password.length < 16 || signingKey.length < 32) return error('Configurează ADVENT_ADMIN_PASSWORD (minim 16 caractere) și ADVENT_SESSION_SECRET (minim 32 caractere) în Netlify.', 503);
        if (Number(request.headers.get('content-length') || 0) > 1024) return error('Cererea este prea mare.', 413);
        const data = await request.json().catch(() => null) as { password?: unknown } | null;
        if (typeof data?.password !== 'string' || data.password.length > 256 || !equal(data.password, password)) return error('Parolă incorectă.', 401);
        const expires = String(Date.now() + week * 1000);
        return json({ ok: true }, 200, { 'Set-Cookie': sessionCookie(expires, request) });
      }
      if (action === 'logout') {
        return json({ ok: true }, 200, { 'Set-Cookie': `${sessionName}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${url.protocol==='https:'?'; Secure':''}` });
      }
      if (!isAdmin(request)) return error('Autentifică-te în panoul Admin.', 401);
      if (action === 'save') {
        if (Number(request.headers.get('content-length') || 0) > 16000) return error('Mesajul este prea lung.', 413);
        const raw = await request.json().catch(() => null);
        const item = validateSurprise(raw, year);
        if (!item) return error('Surpriză invalidă. Verifică titlul, mesajul, ziua și variantele quiz-ului.');
        const existing = await loaded();
        const updated = [...existing.filter(s => s.day !== item.day), item].sort((a,b) => a.day - b.day);
        await doorStore().setJSON(`year-${year}`, updated);
        return json({ ok: true });
      }
      if (action === 'upload') {
        // Uploads are private. The key is not returned to visitors until its day unlocks.
        const form = await request.formData();
        const file = form.get('file');
        const day = Number(form.get('day'));
        if (!(file instanceof File) || !Number.isInteger(day) || day < 1 || day > 24) return error('Selectează un fișier și o zi validă.');
        if (file.size > 5 * 1024 * 1024 || file.size < 12) return error('Fotografia trebuie să fie între 12 octeți și 5 MB.', 413);
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return error('Sunt acceptate doar JPG, PNG și WEBP.');
        const head = new Uint8Array(await file.slice(0, 12).arrayBuffer());
        const isJpeg = head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff;
        const isPng = head.slice(0, 8).join(',') === '137,80,78,71,13,10,26,10';
        const isWebp = String.fromCharCode(...head.slice(0,4)) === 'RIFF' && String.fromCharCode(...head.slice(8,12)) === 'WEBP';
        if (!(file.type === 'image/jpeg' && isJpeg || file.type === 'image/png' && isPng || file.type === 'image/webp' && isWebp)) return error('Conținutul fotografiei nu corespunde formatului declarat.');
        const ext = file.type === 'image/jpeg' ? 'jpg' : file.type === 'image/png' ? 'png' : 'webp';
        const key = `${year}/day-${day}/${randomUUID()}.${ext}`;
        await photoStore().set(key, file, { metadata: { contentType: file.type } });
        return json({ image_path: key });
      }
    }
    return error('Rută inexistentă.', 404);
  } catch (failure) {
    console.error('Little December API error:', failure);
    return error('Serverul nu a putut procesa solicitarea. Încearcă din nou.', 500);
  }
}
