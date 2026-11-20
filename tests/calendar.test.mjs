import test from 'node:test';
import assert from 'node:assert/strict';
import { unlocked, todayDoor, nextUnlockText, serverDateToZoned } from '../src/calendarLogic.ts';
const date = (year,month,day,hour=0)=>({year,month,day,hour,minute:0,second:0});
test('30 noiembrie: toate cele 24 uși sunt închise',()=>{
  for(let i=1;i<=24;i++) assert.equal(unlocked(i,date(2026,11,30,23),2026),false);
});
test('1 decembrie ora 00:00 Europe/Bucharest: doar prima ușă este disponibilă',()=>{
  for(let i=1;i<=24;i++) assert.equal(unlocked(i,date(2026,12,1),2026),i===1);
});
test('12 decembrie: doar zilele 1–12 sunt disponibile',()=>{
  for(let i=1;i<=24;i++) assert.equal(unlocked(i,date(2026,12,12),2026),i<=12);
});
test('24 decembrie și 25 decembrie: toate sunt disponibile',()=>{
  for(let i=1;i<=24;i++) {assert.equal(unlocked(i,date(2026,12,24),2026),true);assert.equal(unlocked(i,date(2026,12,25),2026),true);}
});
test('calendarul unui an viitor rămâne blocat',()=>{
  assert.equal(unlocked(1,date(2026,12,24),2027),false);
});
test('date invalide / uși în afara intervalului sunt refuzate',()=>{
  for(const i of [0,-1,25,1.5,NaN]) assert.equal(unlocked(i,date(2026,12,24),2026),false);
  assert.equal(serverDateToZoned('2026-02-30',date(2026,11,20)),null);
  assert.equal(serverDateToZoned('not-a-date',date(2026,11,20)),null);
  assert.deepEqual(serverDateToZoned('2026-12-01',date(2026,11,20)),date(2026,12,1));
});
test('numărătoarea inversă și ziua curentă',()=>{
  assert.equal(todayDoor(date(2026,11,30),2026),null);
  assert.equal(todayDoor(date(2026,12,1),2026),1);
  assert.equal(todayDoor(date(2026,12,24),2026),24);
  assert.equal(todayDoor(date(2026,12,25),2026),null);
  assert.match(nextUnlockText(date(2026,12,24),2026),/Toate surprizele/);
});

test('data falsă pe telefon nu deblochează uși dacă serverul spune noiembrie',()=>{
  const fakePhone = date(2038,12,25,23);
  const server = serverDateToZoned('2026-11-30',fakePhone);
  assert.notEqual(server,null);
  for (let day=1; day<=24; day++) assert.equal(unlocked(day,server,2026),false);
});
