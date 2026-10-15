import './style.css';
import {cleanReading} from './report-utils.js';

const mbtis = ['ISTJ','ISFJ','INFJ','INTJ','ISTP','ISFP','INFP','INTP','ESTP','ESFP','ENFP','ENTP','ESTJ','ESFJ','ENFJ','ENTJ'];
const fields = (prefix, partner = false) => `<div class="fields"><label>${partner ? '상대방 이름 또는 별명' : '이름 또는 별명'} <span>선택</span><input name="${prefix}Name" maxlength="30" placeholder="${partner ? '마음에 떠오르는 그 사람' : '어떻게 불러드릴까요?'}" autocomplete="off"></label><label>생년월일<input name="${prefix}Birth" type="date" min="1900-01-01" max="${new Date().toLocaleDateString('en-CA')}" ${partner ? '' : 'required'}></label><div class="row"><label>달력<select name="${prefix}Calendar"><option value="solar">양력</option><option value="lunar">음력 · 평달</option><option value="leap">음력 · 윤달</option></select></label><label>태어난 시간 <span>선택</span><input name="${prefix}Time" type="time"><small>모르면 비워두세요</small></label></div><label>MBTI <span>선택</span><select name="${prefix}Mbti"><option value="">모름 / 선택 안 함</option>${mbtis.map(type=>`<option value="${type}">${type}</option>`).join('')}</select><small>싫음말고</small></label></div>`;
document.querySelector('#app').innerHTML = `<header><a class="brand" href="./">✳ <span>사주 한 장</span></a><span class="header-note">작은 호기심에서 시작하는 나의 이야기</span></header><main><section class="intro"><span class="eyebrow">A LITTLE NOTE ABOUT YOU</span><h1>시험기간때문에 미친 컴공생이 만든,<br>AI사주딸깍<span>.</span></h1><p>시험공부하기싫다.<br>교수를업신여기는중</p><div class="seal" aria-hidden="true">緣</div><div class="intro-foot"><span>01 나를 알아보기</span><span>02 우리를 알아보기</span><span>03 한 장의 이야기</span></div></section><section class="paper"><div class="card-heading"><span class="eyebrow">YOUR STORY</span><span class="pill">사주 · 궁합</span></div><h2>니 신상 내놔</h2><p class="muted">생년월일 입력 ㄱㄱ</p><form id="reading-form">${fields('self')}<details id="partner"><summary><span><b>♡ 좋아하는 사람이 있나요?</b><small>선택 · 두 사람의 궁합도 함께 볼 수 있어요</small></span><span class="plus">+</span></summary><div class="partner-fields">${fields('partner',true)}<small>실명 대신 별명을 사용해도 좋아요. 이름으로 성명학을 계산하지는 않아요.</small></div></details><button class="primary" type="submit">나의 사주 한 장 펼치기 <span>↗</span></button><p id="status" role="status" aria-live="polite"></p><p class="fine">한국 출생·한국 표준시 기준 · 재미로 읽는 AI 해석</p></form></section><section id="result" class="paper result" hidden tabindex="-1"><span class="eyebrow">A NOTE FOR YOU</span><h2>당신에게 도착한 한 장</h2><div id="result-body"></div><button id="delete" class="secondary" type="button">이 기기에서 저장한 정보 삭제</button><p id="delete-status" role="status"></p></section><section id="privacy" class="privacy"><h3>소중한 정보는 이렇게 다뤄요</h3><p>입력한 이름·생년월일·시간과 해석 결과는 Supabase DB에 저장되고, 해석을 위해 Google Gemini로 전송됩니다. 상대방 정보는 동의를 받은 경우에만 입력해 주세요. 이 기기의 삭제 버튼으로 저장한 기록을 삭제할 수 있어요. 브라우저 데이터를 지우면 삭제 권한을 복구할 수 없어요.</p><p>해석은 오락용이며 미래나 상대방의 마음을 확정하지 않습니다. 음력은 라이브러리의 중국 음력 기준이며 한국 음력과 차이가 생길 수 있어요. 진태양시·출생지 보정은 적용하지 않습니다.</p></section></main><footer><span>✳ 사주 한 장</span><span>인연을 단정하지 않고, 가능성을 읽어요.</span></footer>`;
const form = document.querySelector('form');
document.querySelector('#privacy p').textContent = '입력한 이름·생년월일·시간·MBTI와 해석 결과는 삭제 요청 전까지 Supabase DB에 저장되고, 해석을 위해 Google Gemini로 전송됩니다. 상대방 정보는 동의를 받은 경우에만 입력해 주세요. 이 기기의 삭제 버튼으로 저장한 기록을 삭제할 수 있어요. 브라우저 데이터를 지우면 삭제 권한을 복구할 수 없어요.';
const status = document.querySelector('#status');
const button = form.querySelector('button');
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
const configured = url && key && !url.includes('YOUR_PROJECT');
if (!configured) status.textContent = '화면 준비 완료 · Supabase 연결 설정 후 실제 해석을 받을 수 있어요.';
function person(data, prefix) { return {name: data.get(`${prefix}Name`).trim(), birth: data.get(`${prefix}Birth`), calendar: data.get(`${prefix}Calendar`), time: data.get(`${prefix}Time`) || null, mbti: data.get(`${prefix}Mbti`) || null}; }
function receipts() { try { return JSON.parse(localStorage.getItem('saju-receipts') || '[]'); } catch { return []; } }
async function request(body) {
  const response = await fetch(`${url}/functions/v1/reading`, {method:'POST', headers:{'Content-Type':'application/json',apikey:key}, body:JSON.stringify(body), signal:AbortSignal.timeout(90000)});
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || '요청을 처리하지 못했어요. 잠시 후 다시 시도해 주세요.');
  return data;
}
form.addEventListener('submit', async event => {
  event.preventDefault();
  if (!configured) { status.textContent = '아직 서버가 연결되지 않았어요. README의 Supabase 설정을 완료해 주세요.'; return; }
  const data = new FormData(form);
  const wantsPartner = document.querySelector('#partner').open;
  if (wantsPartner && !data.get('partnerBirth')) { status.textContent = '궁합을 보려면 상대방 생년월일을 입력해 주세요. 원하지 않으면 선택 항목을 닫아주세요.'; return; }
  const token = crypto.randomUUID();
  const saved = receipts();
  try { sessionStorage.setItem('saju-report-check','1'); sessionStorage.removeItem('saju-report-check'); } catch { status.textContent = '리포트 페이지로 이동하려면 브라우저 저장 공간을 허용해줘.'; return; }
  try { localStorage.setItem('saju-receipts', JSON.stringify([...saved, token])); } catch { status.textContent = '삭제 권한을 보관하려면 브라우저 저장 공간을 허용해 주세요.'; return; }
  button.disabled = true; status.textContent = '태어난 날의 이야기를 읽고 있어요. 잠시만 기다려 주세요…';
  try {
    const result = await request({action:'create',token,self:person(data,'self'),partner:wantsPartner ? person(data,'partner') : null});
    const reading=cleanReading(result.reading);
    sessionStorage.setItem('saju-report',JSON.stringify({reading,name:person(data,'self').name,hasPartner:wantsPartner,createdAt:new Date().toISOString()}));
    status.textContent = '다 읽었어! 리포트 페이지로 넘어갈게.';
    window.location.assign(new URL('report.html',window.location.href));
  } catch (error) { status.textContent = error.name === 'TimeoutError' ? '응답이 늦어지고 있어요. 잠시 후 다시 시도해 주세요.' : error.message; }
  finally { button.disabled = false; }
});
document.querySelector('#delete').addEventListener('click',async event => {
  const message = document.querySelector('#delete-status');
  event.target.disabled = true;
  try { for (const token of receipts()) await request({action:'delete',token}); localStorage.removeItem('saju-receipts'); sessionStorage.removeItem('saju-report'); document.querySelector('#result-body').textContent='저장한 정보를 삭제했어요.'; message.textContent='이 기기의 삭제 권한으로 접근할 수 있는 모든 기록이 삭제되었어요.'; }
  catch { message.textContent='삭제에 실패했어요. 잠시 후 다시 시도해 주세요.'; }
  finally { event.target.disabled=false; }
});
// Failed or interrupted requests may still have saved a record; keep deletion available.
if (receipts().length) { document.querySelector('#result').hidden=false; document.querySelector('#result-body').textContent='이 기기에서 요청한 기록을 삭제할 수 있어. 방금 만든 리포트는 같은 탭의 리포트 페이지에서 다시 볼 수 있어.'; const link=document.createElement('a'); link.href='./report.html'; link.className='back-link'; link.textContent='리포트 다시 보기 ↗'; document.querySelector('#result-body').append(document.createElement('br'),link); }
