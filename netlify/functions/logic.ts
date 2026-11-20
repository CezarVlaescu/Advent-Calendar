import { unlocked, type ZonedDate } from '../../src/calendarLogic.ts';

export type SavedSurprise = {
  year: number; day: number; type: 'letter' | 'voucher' | 'photo' | 'quiz' | 'treasure';
  title: string; message: string; image_path: string | null;
  quiz_question: string; quiz_options: string[]; quiz_correct_index: number;
};
export function currentRomanianDate(at = new Date()): {iso: string; zoned: ZonedDate} {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Bucharest', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'
  }).formatToParts(at);
  const n = (name: string) => Number(parts.find(p => p.type === name)?.value || 0);
  const zoned = { year:n('year'), month:n('month'), day:n('day'), hour:n('hour'), minute:n('minute'), second:n('second') };
  const iso = `${zoned.year}-${String(zoned.month).padStart(2,'0')}-${String(zoned.day).padStart(2,'0')}`;
  return { iso, zoned };
}
export function visibleSurprises(items: SavedSurprise[], today: {zoned: ZonedDate}, year: number): SavedSurprise[] {
  return items.filter(item => item.year === year && unlocked(item.day, today.zoned, year));
}
export function validateSurprise(raw: unknown, year: number): SavedSurprise | null {
  if (!raw || typeof raw !== 'object') return null;
  const item = raw as Partial<SavedSurprise>;
  const types = ['letter','voucher','photo','quiz','treasure'];
  if (item.year !== year || !Number.isInteger(item.day) || item.day! < 1 || item.day! > 24 || !item.type || !types.includes(item.type)) return null;
  const good = (value: unknown, limit: number) => typeof value === 'string' && value.trim().length > 0 && value.length <= limit;
  if (!good(item.title, 90) || !good(item.message, 6000)) return null;
  if (item.image_path !== null && (typeof item.image_path !== 'string' || !/^\d{4}\/day-(?:[1-9]|1\d|2[0-4])\/[0-9a-f-]{36}\.(?:jpg|png|webp)$/.test(item.image_path) || !item.image_path.startsWith(`${year}/day-${item.day}/`))) return null;
  if (typeof item.quiz_question !== 'string' || item.quiz_question.length > 500 || !Array.isArray(item.quiz_options) || item.quiz_options.length !== 3 || item.quiz_options.some(v => typeof v !== 'string' || v.length > 300) || !Number.isInteger(item.quiz_correct_index) || item.quiz_correct_index! < 0 || item.quiz_correct_index! > 2) return null;
  if (item.type === 'quiz' && (!good(item.quiz_question, 500) || item.quiz_options.some(v => !good(v,300)))) return null;
  return {
    year, day: item.day!, type: item.type, title: item.title!.trim(), message: item.message!.trim(),
    image_path: item.image_path, quiz_question: item.quiz_question, quiz_options: item.quiz_options,
    quiz_correct_index: item.quiz_correct_index!
  };
}
