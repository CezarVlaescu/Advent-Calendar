import test from 'node:test';
import assert from 'node:assert/strict';
import { currentRomanianDate, visibleSurprises, validateSurprise } from '../netlify/functions/logic.ts';
const item = (day) => ({year:2026,day,type:'letter',title:`Ziua ${day}`,message:'Te iubesc',image_path:null,quiz_question:'',quiz_options:['','',''],quiz_correct_index:0});
test('Ceasul serverului interpretează miezul nopții în România, nu UTC',()=>{
  assert.equal(currentRomanianDate(new Date('2026-11-30T21:59:00Z')).iso,'2026-11-30');
  assert.equal(currentRomanianDate(new Date('2026-11-30T22:00:00Z')).iso,'2026-12-01');
  assert.equal(currentRomanianDate(new Date('2026-12-23T22:00:00Z')).iso,'2026-12-24');
});
test('API public nu poate dezvălui nicio surpriză înainte de 1 decembrie',()=>{
  assert.deepEqual(visibleSurprises([item(1),item(2),item(24)],currentRomanianDate(new Date('2026-11-20T12:00:00Z')),2026),[]);
});
test('API public filtrează surprizele de mâine și Crăciun, inclusiv fotografiile',()=>{
  const tomorrow = item(2);tomorrow.message='SECRET';tomorrow.image_path='2026/day-2/bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb.jpg';
  const included = visibleSurprises([item(1),tomorrow,item(24)],currentRomanianDate(new Date('2026-11-30T22:00:00Z')),2026);
  assert.deepEqual(included,[item(1)]);
});
test('validare admin respinge zile invalide sau fotografii de pe alte zile',()=>{
  assert.equal(validateSurprise({...item(25)},2026),null);
  assert.equal(validateSurprise({...item(3),image_path:'2026/day-4/bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb.jpg'},2026),null);
  assert.deepEqual(validateSurprise(item(3),2026),item(3));
});
test('quiz incomplet nu poate fi salvat',()=>{
  assert.equal(validateSurprise({...item(5),type:'quiz',quiz_question:'Alege',quiz_options:['A','','C']},2026),null);
});
