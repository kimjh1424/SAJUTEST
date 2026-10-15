# 사주 한 장

GitHub Pages 정적 웹 + Supabase Edge Function/DB + Gemini. 본인 사주, 선택 상대방 궁합, 본인·상대방 선택 MBTI를 지원합니다. MBTI는 해석 개인화에만 사용하며 계산된 사주를 바꾸지 않습니다.

## 로컬 실행

1. `npm install`
2. `.env.example`을 `.env.local`로 복사하고 Supabase **anon 공개 키**를 입력합니다. URL은 이미 프로젝트에 맞춰져 있습니다.
3. `npm run dev`

Gemini API 키와 service role 키는 `VITE_` 변수에 넣지 마세요. 미설정 상태에서는 입력 화면만 작동하고 실제 결과나 저장 성공을 표시하지 않습니다.

## Supabase 설정

프로젝트: https://supabase.com/dashboard/project/fxxrnxlmtsiblfsvrcfq

1. SQL Editor에서 `supabase/migrations/202610150001_initial.sql`을 실행합니다. 브라우저 공개 키로는 테이블을 읽거나 쓸 수 없고 서버 함수만 접근합니다.
2. Edge Functions → Secrets에 다음을 설정합니다.
   - `GEMINI_API_KEY`: Google AI Studio에서 발급한 키
   - `GEMINI_MODEL`: 선택, 기본 `gemini-3.1-flash-lite`. 기존 Secret이 있으면 이 값으로 변경해야 합니다.
   - `ALLOWED_ORIGINS`: 실제 GitHub Pages origin과 로컬 origin을 쉼표로 구분. 예: `https://YOUR_ID.github.io,http://127.0.0.1:5173` (경로와 끝 슬래시 제외)
   - `RATE_LIMIT_SALT`: 무작위로 만든 긴 문자열 (IP를 일 단위 해시로 바꿀 때 사용)
   - `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`는 Edge Functions 기본 환경변수입니다.
3. CLI로 배포:

```sh
npx supabase login
npx supabase link --project-ref fxxrnxlmtsiblfsvrcfq
npx supabase functions deploy reading
```

`config.toml`의 `verify_jwt = false`는 공개 함수 설정입니다. 브라우저 공개 키와 서버의 legacy anon 키를 직접 비교하지 않습니다. 공개 키는 사용자 인증 수단이 아닙니다. CORS 외에 DB에서 원자적 호출 한도(UTC 일별 IP 해시당 10회, 전체 200회)를 적용합니다. 실패한 AI 요청도 한도에 포함합니다. 유료 공개 운영 전 Turnstile 등의 봇 방어 및 실제 게이트웨이 IP 헤더 신뢰 검증을 권장합니다.

## GitHub Pages

1. GitHub 저장소에 코드를 올립니다 (기본 브랜치 `main`).
2. Settings → Pages → Source: **GitHub Actions**.
3. Settings → Secrets and variables → Actions → Variables:
   - `VITE_SUPABASE_URL`: `https://fxxrnxlmtsiblfsvrcfq.supabase.co`
   - `VITE_SUPABASE_ANON_KEY`: 프로젝트 legacy anon 공개 키
4. Actions의 Deploy GitHub Pages를 실행합니다. 상대 경로 빌드라 저장소 하위 경로에서도 작동합니다.
5. 최종 사이트 origin을 Supabase `ALLOWED_ORIGINS`에 추가합니다.

## 데이터 및 한계

- 개발 테스트 버전은 동의 체크박스 없이 본인·상대방 이름/별명, 생일, 시간, 달력, MBTI와 계산값·해석을 저장합니다. 동의 기록은 `consent_version: dev-no-consent`, `partner_consent: false`로 저장하여 실제 동의로 기록하지 않습니다. 이름은 호칭용이며 성명학이 아닙니다.
- 입력 정보는 Google Gemini로 전송됩니다. 선택 항목을 닫으면 상대방 정보를 전송하지 않습니다.
- 삭제 권한의 SHA-256 해시만 DB에 저장하고 원본 권한은 사용자 브라우저에 보관합니다. 삭제는 이 기기에서 요청한 기록에만 가능합니다. 자동 보관 만료는 아직 없으므로 삭제 요청 전까지 보관합니다. 공개 전 실제 개인정보 안내·운영자 연락처·보관 기간 및 공급자 데이터 정책을 정해야 합니다.
- 만세력은 `lunar-javascript`로 계산합니다. 시간 미상은 시주 제외, 진태양시·출생지·한국 역사적 서머타임 보정 없음, 음력은 중국 음력 기준으로 한국 음력과 차이가 날 수 있습니다. 정밀한 한국식 만세력을 보장하지 않습니다.
- 로그인, 지난 결과 조회, 운영자 관리 화면은 포함하지 않았습니다.

## 검증

### 무료 테스트 비용 설정

기본 Flash-Lite, 출력 최대 3,072토큰, 전체 리포트 1,200~1,800자 요청. 친구 같은 반말로 기본 6개 항목, 궁합 입력 시 추가 2개 항목을 설명합니다. 본인 사주와 궁합은 한 번에 생성하고 자동 재시도·유료 모델 대체는 하지 않습니다. 모델에는 계산된 간지·호칭·MBTI만 전달하고 생일과 시간 원문은 DB에만 저장합니다. 로그의 `gemini_usage`로 입력·출력·생각·총 토큰을 확인할 수 있습니다. 출력 상한은 생각 토큰도 고려해야 하며 입력 토큰은 별도입니다.

결과 생성 후 `report.html`로 이동합니다. 별표 등의 마크다운 기호를 제거하고 항목별 카드로 표시합니다. 리포트와 호칭은 같은 탭의 `sessionStorage`에 보관하여 새로고침 시 API 재호출 없이 다시 표시합니다. URL에는 생일·이름·삭제 토큰을 넣지 않으며, URL만 공유하거나 새 탭에서 열면 리포트가 보이지 않습니다. 삭제 시 해당 탭의 리포트도 지웁니다. GitHub Pages에서 두 HTML 페이지가 모두 빌드되도록 Vite 다중 페이지 구성을 사용합니다.

계정의 실제 무료 한도는 AI Studio에서 확인해야 합니다. 하루 10회 후 20% 이상 요청 여유를 남기려면 같은 프로젝트의 다른 호출을 포함하여 RPD가 최소 13이어야 합니다. 토큰 한도는 별도로 확인해야 하며 20% 잔여를 현재 설정만으로 보장하지 않습니다. 현재 DB 호출 제한은 전체 200회이므로 10회로 제한하려면 별도 한도 조정이 필요합니다.

`npm test` (날짜/MBTI 검증, 사주 기준값, 음력 변환, 시주 미상, 삭제 토큰), `npm run build`.

공식 참고: [Gemini generateContent](https://ai.google.dev/api/generate-content), [Supabase Functions](https://supabase.com/docs/guides/functions), [lunar-javascript](https://github.com/6tail/lunar-javascript).
