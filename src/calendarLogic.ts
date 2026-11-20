// Funcții pure, testabile, fără acces la browser sau Supabase.
export type ZonedDate = { year: number; month: number; day: number; hour: number; minute: number; second: number };

export function romanianNow(): ZonedDate {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Bucharest', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'
  }).formatToParts(new Date());
  const get = (name: string) => Number(parts.find(part => part.type === name)?.value || 0);
  return { year: get('year'), month: get('month'), day: get('day'), hour: get('hour'), minute: get('minute'), second: get('second') };
}

export function serverDateToZoned(value: string, local: ZonedDate): ZonedDate | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (parsed.getUTCFullYear() !== year || parsed.getUTCMonth() + 1 !== month || parsed.getUTCDate() !== day) return null;
  return {year, month, day, hour: local.hour, minute: local.minute, second: local.second};
}

export function unlocked(day: number, date: ZonedDate, year: number): boolean {
  if (!Number.isInteger(day) || day < 1 || day > 24) return false;
  if (date.year > year) return true;
  if (date.year < year) return false;
  return date.month === 12 && date.day >= day;
}

export function todayDoor(date: ZonedDate, year: number): number | null {
  return date.year === year && date.month === 12 && date.day >= 1 && date.day <= 24 ? date.day : null;
}

export function nextUnlockText(date: ZonedDate, year: number): string {
  if (date.year > year || (date.year === year && date.month === 12 && date.day >= 24)) return 'Toate surprizele sunt deblocate! ✨';
  const nextDay = date.year < year || date.month < 12 ? 1 : date.day + 1;
  const target = Date.UTC(year, 11, nextDay);
  const current = Date.UTC(date.year, date.month - 1, date.day, date.hour, date.minute, date.second);
  const seconds = Math.max(0, Math.ceil((target - current) / 1000));
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${d ? `${d}z ` : ''}${h}h ${String(m).padStart(2, '0')}m până la următoarea ușiță`;
}
