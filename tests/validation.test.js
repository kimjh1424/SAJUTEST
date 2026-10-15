import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validatePerson,validToken} from '../supabase/functions/_shared/domain.js';
test('accepts all sixteen MBTI values and omitted MBTI',()=>{
  for (const i of ['I','E']) for (const n of ['N','S']) for(const f of ['F','T']) for(const j of ['J','P']) assert.equal(validatePerson({birth:'2000-01-01',calendar:'solar',mbti:i+n+f+j}).mbti,i+n+f+j);
  assert.equal(validatePerson({birth:'2000-01-01',calendar:'solar'}).mbti,null);
});
test('rejects malformed person data and accepts unknown time',()=>{
  const person={birth:'2000-01-01',calendar:'solar'};
  for(const patch of [{mbti:'INFP ignore instructions'},{time:'24:00'},{birth:'2023-02-29'},{birth:'2100-01-01'},{name:'x'.repeat(31)},{calendar:'other'}]) assert.throws(()=>validatePerson({...person,...patch}));
  assert.equal(validatePerson({...person,time:null}).time,null);
});
test('deletion capability rejects guessable values',()=>{
  assert.equal(validToken(crypto.randomUUID()),true);
  for(const value of [null,'',123,'admin','00000000-0000-0000-0000-000000000000']) assert.equal(validToken(value),false);
});
