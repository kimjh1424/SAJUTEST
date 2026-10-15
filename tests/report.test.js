import {test} from 'node:test';
import assert from 'node:assert/strict';
import {cleanReading,reportSections} from '../src/report-utils.js';

test('removes emphasis and heading syntax from legacy and new reports',()=>{
  assert.equal(cleanReading('**기본 성향**\n***강점***\n### 조언\n***'),'기본 성향\n강점\n조언');
});
test('splits a report into titled sections while retaining paragraphs',()=>{
  assert.deepEqual(reportSections('[너는 이런 스타일]\n첫 문단\n\n둘째 문단\n\n[오늘부터 해볼 것]\n작은 실천'),[
    {title:'너는 이런 스타일',body:'첫 문단\n\n둘째 문단'},
    {title:'오늘부터 해볼 것',body:'작은 실천'},
  ]);
});
test('accepts older reports without section markers',()=>{
  const sections=reportSections('정환아\n\n**조언**\n천천히 해봐');
  assert.equal(sections.length,1); assert.ok(sections[0].body.includes('천천히 해봐')); assert.ok(!sections[0].body.includes('*'));
});
