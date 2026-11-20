import { unlocked as doorUnlocked, todayDoor as calendarTodayDoor, nextUnlockText as countdownText } from './calendarLogic';
export { romanianNow, serverDateToZoned } from './calendarLogic';
export type { ZonedDate } from './calendarLogic';

export type SurpriseType = 'letter' | 'voucher' | 'photo' | 'quiz' | 'treasure';

export type Surprise = {
  year: number;
  day: number;
  type: SurpriseType;
  title: string;
  message: string;
  image_path: string | null;
  quiz_question: string;
  quiz_options: string[];
  quiz_correct_index: number;
};

export const CALENDAR_YEAR = Number(import.meta.env.VITE_ADVENT_YEAR || 2026);
export const PERSON_NAME = import.meta.env.VITE_PERSON_NAME || 'iubirea mea';
export const FROM_NAME = import.meta.env.VITE_FROM_NAME || 'cu drag, de la mine';
export const IS_DEMO = import.meta.env.VITE_LOCAL_DEMO === 'true';
const DEMO_KEY = `advent-surprises-${CALENDAR_YEAR}`;
const OPENED_KEY = `advent-opened-${CALENDAR_YEAR}`;

export const TYPES: { value: SurpriseType; label: string; icon: string }[] = [
  { value: 'letter', label: 'Scrisoare de dragoste', icon: '💌' },
  { value: 'voucher', label: 'Voucher amuzant', icon: '🎟️' },
  { value: 'photo', label: 'Fotografie / amintire', icon: '📸' },
  { value: 'quiz', label: 'Quiz despre noi', icon: '🧩' },
  { value: 'treasure', label: 'Vânătoare de comori', icon: '🗝️' }
];

export function emptySurprise(day: number): Surprise {
  return {
    year: CALENDAR_YEAR, day, type: 'letter', title: '', message: '',
    image_path: null, quiz_question: '', quiz_options: ['', '', ''], quiz_correct_index: 0
  };
}

const samples: Surprise[] = [
  { ...emptySurprise(1), title: 'Un început dulce 💜', message: 'Prima surpriză: astăzi ai un voucher pentru o îmbrățișare de minimum 2 minute. Se poate folosi de câte ori dorești!'},
  { ...emptySurprise(2), type: 'voucher', title: 'Seară de film 🍿', message: 'Alegi tu filmul, eu pregătesc gustările și promit să nu adorm în primele 30 de minute.'},
  { ...emptySurprise(3), type: 'quiz', title: 'Cât de bine mă cunoști?', message: 'Indiferent de răspuns, premiul este un pupic!', quiz_question: 'Care ar fi seara noastră perfectă?', quiz_options: ['Un film sub pătură', 'O plimbare', 'Toate, dacă suntem împreună'], quiz_correct_index: 2 },
  { ...emptySurprise(24), type: 'treasure', title: 'Surpriza cea mare 🎁', message: 'Mergi până la brad. Acolo te așteaptă ultimul indiciu… și multă iubire.'}
];

export function readDemo(): Surprise[] {
  try {
    const raw = localStorage.getItem(DEMO_KEY);
    return raw ? JSON.parse(raw) as Surprise[] : samples;
  } catch { return samples; }
}
export function writeDemo(items: Surprise[]) {
  localStorage.setItem(DEMO_KEY, JSON.stringify(items));
}
export function readOpened(): number[] {
  try { return JSON.parse(localStorage.getItem(OPENED_KEY) || '[]') as number[]; }
  catch { return []; }
}
export function markOpened(day: number): number[] {
  const next = Array.from(new Set([...readOpened(), day]));
  localStorage.setItem(OPENED_KEY, JSON.stringify(next));
  return next;
}

export { doorUnlocked as unlockedDoor };
export function unlocked(day: number, date: import('./calendarLogic').ZonedDate) {return doorUnlocked(day,date,CALENDAR_YEAR);}
export function todayDoor(date: import('./calendarLogic').ZonedDate) {return calendarTodayDoor(date,CALENDAR_YEAR);}
export function nextUnlockText(date: import('./calendarLogic').ZonedDate) {return countdownText(date,CALENDAR_YEAR);}
