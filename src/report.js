import './style.css';
import {cleanReading,reportSections} from './report-utils.js';

document.querySelector('#app').innerHTML=`<header><a class="brand" href="./">✳ <span>사주 한 장</span></a><a class="back-link" href="./">다시 사주 보기 ↗</a></header><main class="report-main"><section class="report-hero"><span class="eyebrow">YOUR LITTLE UNIVERSE</span><p class="pill report-badge">AI가 읽어본 너의 이야기</p><h1 id="report-title">너의 사주, 펼쳐봤어<span>.</span></h1><p id="report-subtitle">가볍게 읽고, 마음에 드는 조언만 챙겨가.</p><p id="report-date" class="muted"></p></section><div id="report-sections"></div><section class="paper report-actions"><p>인생은 네가 쓰는 거고, 이건 그냥 작은 참고서야 ㅋㅋ</p><div class="action-row"><a class="primary" href="./">다른 사주도 보기 ↗</a><button class="secondary" id="delete" type="button">이 기기에서 저장한 정보 삭제</button></div><p id="report-status" role="status" aria-live="polite"></p><small>재미로 보는 AI 해석이야. 미래나 상대방 마음을 확정하는 건 아니야.</small></section></main><footer><span>✳ 사주 한 장</span><span>좋은 얘기는 챙기고, 나머지는 흘려보내.</span></footer>`;

let report;
try { report=JSON.parse(sessionStorage.getItem('saju-report') || 'null'); } catch { /* Show the empty state below. */ }
const content=document.querySelector('#report-sections');
if (report && typeof report.reading === 'string' && cleanReading(report.reading)) {
  document.title=`${report.name || '너'}의 사주 리포트 — 사주 한 장`;
  document.querySelector('#report-title').textContent=`${report.name || '너'}의 사주, 펼쳐봤어.`;
  document.querySelector('#report-subtitle').textContent=report.hasPartner ? '너의 성향부터 두 사람의 케미까지. 천천히 읽어봐.' : '너의 성향부터 일상에서 써먹을 조언까지. 천천히 읽어봐.';
  const created = new Date(report.createdAt);
  if (!Number.isNaN(created.valueOf())) document.querySelector('#report-date').textContent=`${created.toLocaleString('ko-KR')} · 이 탭에서 새로고침해도 다시 볼 수 있어`;
  reportSections(report.reading).forEach((section,index)=>{
    const card=document.createElement('section'); card.className='paper report-card';
    const number=document.createElement('span'); number.className='eyebrow'; number.textContent=String(index+1).padStart(2,'0');
    const heading=document.createElement('h2'); heading.textContent=section.title;
    const body=document.createElement('p'); body.className='report-copy'; body.textContent=section.body;
    card.append(number,heading,body); content.append(card);
  });
} else {
  document.querySelector('#report-title').textContent='아직 펼친 사주가 없어.';
  document.querySelector('#report-subtitle').textContent='먼저 생년월일을 입력해줘. 리포트는 만든 브라우저 탭에서 볼 수 있어.';
}
document.querySelector('#delete').addEventListener('click',async event=>{
  const status=document.querySelector('#report-status');
  event.target.disabled=true;
  try {
    const tokens=JSON.parse(localStorage.getItem('saju-receipts') || '[]');
    if (!Array.isArray(tokens)) throw new Error('삭제 권한을 읽지 못했어.');
    for(const token of tokens) {
      const response=await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/reading`,{method:'POST',headers:{'Content-Type':'application/json',apikey:import.meta.env.VITE_SUPABASE_ANON_KEY},body:JSON.stringify({action:'delete',token}),signal:AbortSignal.timeout(30000)});
      if (!response.ok) throw new Error('삭제에 실패했어. 잠깐 뒤에 다시 눌러줘.');
    }
    localStorage.removeItem('saju-receipts'); sessionStorage.removeItem('saju-report');
    content.replaceChildren(); document.querySelector('#report-title').textContent='저장한 정보, 삭제했어.';
    document.querySelector('#report-date').textContent=''; document.querySelector('#report-subtitle').textContent='새로운 이야기가 궁금하면 다시 사주를 봐도 좋아.';
    status.textContent='이 기기의 삭제 권한으로 지울 수 있는 DB 기록과 이 탭의 리포트를 삭제했어.';
  } catch (error) { status.textContent=error.message || '삭제에 실패했어. 다시 시도해줘.'; }
  finally { event.target.disabled=false; }
});
