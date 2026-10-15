import {test} from 'node:test';
import assert from 'node:assert/strict';
import lunar from 'lunar-javascript';
import {validatePerson,calculate,validToken} from '../supabase/functions/_shared/domain.js';
const base={name:'테스트',birth:'1999-06-07',calendar:'solar',time:'09:11',mbti:'INFP'};
test('rejects impossible dates, future dates, invalid MBTI and time',()=>{
  for(const patch of [{birth:'2023-02-29'},{birth:'2999-01-01'},{birth:'1999-13-01'},{mbti:'ABCD'},{time:'25:00'},{name:'x'.repeat(31)}]) assert.throws(()=>validatePerson({...base,...patch}));
  assert.equal(validatePerson({...base,mbti:null,time:null}).mbti,null);
});
test('known library fixture computes four pillars',()=>{
  const chart=calculate(validatePerson(base),lunar);
  assert.deepEqual([chart.year,chart.month,chart.day,chart.hour],['己卯','庚午','庚寅','辛巳']);
});
test('unknown birth time does not manufacture a time pillar; MBTI does not alter chart',()=>{
  assert.equal(calculate({...base,time:null},lunar).hour,null);
  assert.deepEqual(calculate(base,lunar),calculate({...base,mbti:'ESTJ'},lunar));
});
test('solar and lunar equivalents agree and invalid leap month is rejected',()=>{
  const solar=calculate({...base,birth:'1986-05-29'},lunar);
  const moon=calculate({...base,birth:'1986-04-21',calendar:'lunar'},lunar);
  assert.deepEqual(solar,moon);
  assert.throws(()=>calculate({...base,birth:'1986-04-21',calendar:'leap'},lunar));
});
test('deletion capability requires random UUID v4',()=>{
  assert.equal(validToken(crypto.randomUUID()),true);
  assert.equal(validToken('anything'),false);
});
