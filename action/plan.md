# 구현 계획

프로젝트 목표와 범위는 [INTENT.md](../INTENT.md), 진행 체크리스트는 [TODO.md](../TODO.md)를 따른다. 단계별 상세 계획은 이 파일에서만 관리한다.

Vercel AI Gateway 경유 Jev 실제 호출과 00 독립 리뷰는 완료했다. TypeSafe 직접 연결은 일시 보류한다.

## 실행 전 준비: 역할별 모델 설정
상태: DONE — project `.codex/agents/{plan,builder,reviewer}.toml` 생성·TOML 파싱 및 명시 spawn으로 각 역할의 모델·추론 수준을 확인했고, 독립 재리뷰가 PASS했다. 파일 기반 자동 역할 선택은 직접 검증하지 않았다.

| 역할 | 모델 ID | 추론 수준 | 작업 지침 |
|---|---|---|---|
| Plan | `gpt-6-astra` | `high` | `action/plan.md` |
| Builder | `gpt-5.6-terra` | `medium` | `action/builder.md` |
| Reviewer | `gpt-5.6-terra` | `high` | `action/reviewer.md` |

- [x] 실행 환경이 지원하는 프로젝트별 에이전트 설정 형식과 모델 가용성을 확인했다. 기존 설정을 보존했으며 사용자 전역 기본 모델은 변경하지 않았다.
- [x] 역할별 설정에 모델·추론 수준과 해당 action 문서 작업 지침을 지정했다. MD 파일만으로 모델 전환을 주장하지 않는다.
- [x] Plan `gpt-6-astra`/`high`, Builder `gpt-5.6-terra`/`medium`, Reviewer `gpt-5.6-terra`/`high`를 명시적으로 spawn해 적용을 확인했다. 지정 모델을 임의로 대체하지 않았다.
- [x] Plan → Builder → Reviewer 순서로 역할을 실행했고, 메인 에이전트가 통합을 맡았다. 메인 모델이 MD 지시만으로 전환된다고 주장하지 않는다.
- [x] Reviewer를 Builder와 별도 역할로 실행해 계획·diff·검증 근거를 검토하게 했다. Builder 자기평가로 리뷰를 대체하지 않았다.
- 파일 기반 자동 역할 선택은 직접 검증하지 않았다. 명시 spawn 값과 실행 환경의 런타임 설정이 TOML 값을 덮어쓸 수 있으므로 이 경로를 완료 근거로 사용하지 않는다.
- [x] TOML 파싱과 명시 spawn의 역할별 모델·추론 설정을 기록했고, R1/R2 수정의 독립 재리뷰가 PASS했다.

완료 기준: 세 역할의 모델과 추론 수준이 지정되고, 실행 환경에서 해당 설정의 적용을 확인한다. 이 작업은 Jev 키 없이 준비할 수 있지만 앱 구현은 기존 00단계 실제 호출 성공 조건을 따른다. 적용은 명시 spawn 경로에서만 확인했다.
참고: https://learn.chatgpt.com/docs/agent-configuration/subagents

## 진행 순서
역할별 모델 설정 → 00 → 01 → 02 → 03·04 병렬 → 05 → 06. 07은 실행 전 과정에 적용한다.
예상 시간은 00: 0~2시간, 01~02: 2~4시간, 03~04: 4~9시간, 05: 9~16시간, 06: 16~20시간이며 나머지는 수정 여유다.

각 단계는 계획 확인 → [builder 구현](builder.md) → [reviewer 코드 리뷰](reviewer.md) → 수정·재리뷰 순서로 진행한다. 필수 검증과 리뷰 PASS 후에만 TODO 체크를 완료한다. 키나 접근 권한이 없으면 막힘과 재개 조건을 기록한다.

## 단계별 커밋 규칙
- [ ] 각 TODO 단계(실행 전 모델 설정, 00~06 및 07의 실제 산출물)는 구현·필수 검사·리뷰 수정이 끝나면 해당 단계의 변경만 별도 로컬 커밋으로 남긴다. 하나의 커밋에 여러 단계를 묶지 않는다.
- [ ] 커밋 전 `git status`와 staged diff를 확인하고, 비밀 파일·키·빌드 산출물·다른 단계의 미완료 변경을 제외한다. 기존 사용자의 미커밋 변경은 임의로 포함하지 않는다.
- [ ] 커밋 메시지는 단계와 결과를 구분할 수 있게 작성한다. 예: `feat(02): 구매 입력 규격과 예시 추가`.
- [ ] 커밋 SHA, 실행한 검사와 리뷰 판정을 builder/reviewer 기록 및 최종 보고에 남긴다. 다음 단계에서 문제가 생기면 해당 커밋부터 비교·재현할 수 있게 한다.
- [ ] BLOCKED 또는 테스트·리뷰 미통과 단계는 완료 커밋으로 표시하지 않는다. 이미 검증된 독립 산출물이 있다면 진행 중 체크포인트 커밋임을 명확히 표시한다.
- [ ] 로컬 커밋은 단계마다 수행하되 원격 push와 배포는 별도 작업으로 취급한다.


## 00. 환경 및 Jev 최소 호출
상태: DONE — Vercel AI Gateway 경유 실제 호출 2건과 스크립트·실행 기록의 독립 리뷰가 PASS했다.
담당: 메인 + Jev/API

### 현재 연결 방침 (2026-09-22)
- **TypeSafe 직접 API 연결은 일시 보류한다. 현재 기본 경로는 Vercel AI Gateway를 통한 Jev 호출이다.** 모델은 계속 Jev이며 다른 AI로 대체하는 것이 아니다.
- 서버 인증에는 `AI_GATEWAY_API_KEY`를 사용한다. 현재 MVP에 `TYPESAFE_API_KEY`나 TypeSafe 직접 가입을 요구하지 않는다.
- TypeSafe 호환 API: `POST https://ai-gateway.vercel.sh/typesafe/v1/systemone`, 모델: `typesafe-ai/jev`.
- Gateway 실제 호출 성공을 00단계의 통과 조건으로 삼는다. 무료 프로모션을 가정하지 않고 계정 접근 권한·크레딧·가격을 확인한다.
- 직접 가입이 열리면 연결 설정 교체와 회귀 검증을 검토한다. 자동 전환하거나 직접 연결 실패 시 몰래 다른 모델로 대체하지 않는다.

### Gateway 전환 작업
- 계정의 $5 무료 크레딧 표시는 사용자가 보고했다. 현재 가격과 계정별 잔액은 이 단계에서 독립 확인하지 않았으며 배포 전에 별도로 확인한다.
- [x] `AI_GATEWAY_API_KEY`를 git에서 제외된 `.env.local`에 설정했다.
- [x] `scripts/smoke-jev.mjs`를 Gateway endpoint·키·모델로 전환하고 `.env.example`도 같은 이름으로 변경했다.
- [x] 인증된 최소 choice 요청으로 BUY/WAIT/SKIP 및 confidence를 검증하고, 모델·응답 근거를 비밀정보 없이 기록했다.

### 실행 기록 (2026-09-22)

- Gateway를 통한 실제 요청 2건이 HTTP 200으로 성공했다. 모델은 `typesafe-ai/jev`였고, 두 응답의 choice는 `SKIP`, confidence는 각각 `0.69`, `0.62`였다.
- 두 번째 응답의 probabilities는 `SKIP 0.74`, `WAIT 0.25`, `BUY 0.01`이었다. confidence는 선택지 확률과 별도 값으로 유지한다.
- 앞선 HTTP 403은 customer verification과 유효한 결제 수단 설정이 필요하다는 안전한 오류 안내로 처리한다. 원문 provider body와 키는 기록하거나 출력하지 않는다.

### 작업
- [x] 저장소 지침, git 상태와 기존 파일을 확인하고 기존 변경을 보존했다.
- [x] Vercel의 TypeSafe 호환 API와 인증 공식 문서를 확인했다. 비공식 유사 도메인을 규격으로 채택하지 않는다.
- [x] Gateway endpoint·Bearer 인증·`typesafe-ai/jev` 모델과 choice 응답 구조를 기록했다.
- [x] confidence가 probabilities와 별도 값임을 실제 응답의 두 값으로 확인했다.
- [x] 공식 Gateway 규격의 최소 스크립트와 `AI_GATEWAY_API_KEY` placeholder를 준비했다. 실제 키는 git에서 제외된 `.env.local`에만 둔다.
- [x] BUY/WAIT/SKIP 중 `SKIP`을 반환한 실제 요청 2건을 실행해 response 수치 범위를 확인했다.
- [x] 확인 날짜와 비밀정보를 제거한 실제 실행 결과를 기록했다.

### 통과 조건
공식 API에 인증된 실제 요청이 성공하고 decision/confidence 매핑을 설명할 수 있다. 연결 스크립트는 이후 `smoke:jev` 명령으로 재사용한다.

### 막힘 처리
키 없음, 이용 권한 없음, 인증 실패, endpoint 불명확 시 BLOCKED로 표시한다. 키를 채팅에 붙여넣도록 요구하지 않는다. 접근 권한 우회나 다른 모델로 대체하지 않는다. 독립적인 문서 정리는 가능하나 앱 구현은 대기한다.

### 공식 Gateway 근거
- https://vercel.com/docs/ai-gateway/sdks-and-apis/typesafe
- https://vercel.com/docs/ai-gateway/authentication-and-byok
- 응답은 TypeSafe 호환 형식으로 `answers.purchase.choice`와 `answers.purchase.confidence`를 읽는다.

### 이전 직접 연결 조사 기록 (보류됨)
아래는 전환 전 기록이다. 직접 호출 명령을 현재 실행 절차로 사용하지 않는다.

2026-09-22: 공식 Quick Start, Choice, Confidence 문서 확인.
- https://docs.typesafe.ai/introduction/quickstart
- https://docs.typesafe.ai/primitives/choice
- https://docs.typesafe.ai/confidence
- Node 내장 fetch로 공식 HTTP API를 직접 호출한다. SDK 의존성 없음.
- endpoint: POST https://api.typesafe.ai/v1/systemone, Bearer 인증, model: jev-latest.
- answers.purchase.choice와 answers.purchase.confidence를 사용한다. confidence는 선택 확률과 별도의 값이다.
- scripts/smoke-jev.mjs, .env.example, .gitignore 준비.
- 환경 및 프로젝트에 키가 없어 실제 호출은 실행하지 못함. 앱 구현은 선행 조건 충족까지 대기.
- 로컬 .env.local에 TYPESAFE_API_KEY 설정 후 저장소에서 실행:
  `node --env-file=.env.local scripts/smoke-jev.mjs`
- 키를 채팅이나 문서에 붙여넣지 않는다.

## 01. Next.js 앱 기반
상태: DONE — App Router·TypeScript 기반과 기본 페이지를 구성하고 설치·타입 검사·lint·production build·개발 서버 HTTP 검사 및 독립 리뷰를 통과했다.
선행 조건: 00 실제 호출 성공
담당: 메인

- [x] 기존 저장소 루트에 Next.js App Router + TypeScript 앱을 구성했다. 중첩 저장소는 만들지 않았다.
- [x] Node `24.4.0`에서 검증한 dependency lockfile을 생성했다. Plan의 TypeScript `7.0.2`는 eslint-config-next의 typescript-eslint 지원 범위와 충돌해 `6.0.3`으로 고정했다.
- [x] `dev`, `build`, `start`, `typecheck`, `lint`, `test`, `smoke:jev` 명령을 정의했다.
- [x] 현재 단계에 필요한 `app/`과 기존 `scripts/` 구조를 구성했다. `lib/`와 `tests/`는 다음 계약·테스트 단계에서 추가한다.
- [x] `.env.local`, `node_modules`, `.next`, `.DS_Store`, TypeScript build info와 Next가 생성하는 `next-env.d.ts`를 git에서 제외했다. `AGENTS.md`와 `CLAUDE.md`는 Next dev가 재생성하는 프로젝트 지침으로 추적 대상에 둔다.
- [x] `lang="ko"`, 한국어 기본 제목·설명과 최소 placeholder 페이지를 설정했다.

### 완료 기준
개발 서버가 열리고 기본 프로덕션 빌드가 성공한다. README 기존 내용은 필요한 만큼 확장한다.

### 작업 결과
- `npm install`, `npm run typecheck`, `npm run lint`, `npm run build`가 성공했다.
- `npm run dev -- --port 3000` 후 `http://localhost:3000`이 HTTP 200을 반환했다.
- 현재 페이지는 foundation placeholder이며 입력 UI·API route·프리셋을 포함하지 않는다.

## 02. API 계약 및 프리셋
상태: DONE — 공유 입력·출력 검증, input-only 프리셋 5개와 경계 테스트가 검사 및 독립 리뷰를 통과했다.
선행 조건: 01
담당: schema

### 입력 계약
`productName`: 공백 제거 후 1~100자 문자열.
`price`: 1~1,000,000,000 범위의 원 단위 정수.
`disposableIncome`: 0~1,000,000,000 범위의 원 단위 정수.
`currentProductStatus`: `none | broken | old | working`.
`usageFrequency`: `rarely | sometimes | often | daily`.
`necessity`: `low | medium | high`.
금액 상한은 MVP 입력 제한이며 구매 판단 기준이 아니다. 여유자금은 필수 생활비 등을 제외하고 이번 달 사용할 수 있는 금액으로 안내한다.

### 출력 계약
성공: `{ decision: "BUY" | "WAIT" | "SKIP", confidence: number, probabilities: Record<"BUY" | "WAIT" | "SKIP", number> }`.
- `decision`은 `answers.purchase.choice`에서 BUY/WAIT/SKIP 중 하나인지 검증한 뒤 매핑한다.
- `confidence`는 공식 응답의 별도 필드를 유한한 0~1 숫자로 검증해 그대로 매핑한다. 화면에서는 백분율로 표시하며 선택지 확률의 최댓값으로 대체하지 않는다.
- `probabilities`는 `answers.purchase.probabilities`에서 가져온다. BUY/WAIT/SKIP 세 키가 모두 존재하고 각 값이 유한한 0~1 숫자여야 한다. 반올림을 고려해 합계와 1의 차이가 0.02 이내인지 검증한다. 이는 앱의 검증 허용 오차이며 값을 재정규화하거나 반올림해 저장하는 규칙이 아니다.
- confidence와 probabilities를 서로 계산해 채우지 않는다. 누락·잘못된 값은 오류로 처리하고 가짜 값이나 기본 분포를 만들지 않는다.
- 실제 Gateway 응답 확인 근거: `probabilities: { SKIP: 0.74, WAIT: 0.25, BUY: 0.01 }`, `confidence: 0.62`. 이 값은 계약 확인 기록이며 앱·프리셋의 고정 결과로 사용하지 않는다.
오류: `{ error: { code: string, message: string } }`. 사용자 메시지에 upstream 원문이나 키를 포함하지 않는다.

### 작업
- [x] 공유 타입·런타임 검증과 한국어 label을 정의했다.
- [x] 의미를 고정했다: BUY=현재 조건에서 구매 고려, WAIT=시기·예산 조정 후 재검토, SKIP=현재 필요성과 활용도상 구매 보류.
- [x] 공유 계약은 입력을 값으로만 표현하며 환경변수·서버 어댑터·요청 생성 코드를 포함하지 않는다. 실제 API 요청 구성은 03에서 구현한다.
- [x] 에어팟, 노트북, 스마트폰, 운동화, 로봇청소기 입력 프리셋 5개를 작성했다.
- [x] 프리셋은 label과 입력값만 포함한다. decision/confidence/probabilities를 고정하지 않는다.
- [x] 0원 여유자금, 음수·소수·과도한 금액, 공백·누락 제품명, 문자열 숫자·null과 잘못된 enum을 검증하는 테스트를 작성했다.
- [x] 출력 검증에서 confidence와 probabilities의 0/1 경계값, NaN·무한대·범위 밖 값, 분포 누락·null·키 누락, 합계 허용 오차 안팎을 확인했다. 성공 시 원래 confidence와 세 확률값이 보존된다.

### 완료 기준
UI와 API가 confidence와 probabilities를 구분한 같은 계약을 사용하며 프리셋 모두 검증을 통과한다. 출력의 필수 필드·숫자 범위·분포 합계 검증을 통과하고 누락값 생성이나 재정규화가 없어야 한다.

### 작업 결과
- `npm test`에서 37개 계약·프리셋 테스트가 통과했다.
- `npm run typecheck`, `npm run lint`, `npm run build`가 통과했다.
- API route와 UI는 다음 단계에서 이 공유 계약을 사용한다. 이 단계의 계약·프리셋은 독립 리뷰 PASS.

## 03. 서버 API와 Jev 연결
상태: DONE — 실제 Jev route 호출과 55개 테스트, 독립 재리뷰 PASS
선행 조건: 02
담당: Jev/API

- [x] `POST /api/decision`에서 JSON과 입력 계약을 검증한다. 잘못된 요청은 Jev 호출 전에 거절한다.
- [x] 00에서 검증한 Vercel의 TypeSafe 호환 API로 서버 전용 어댑터를 구현한다. TypeSafe 직접 연결은 일시 보류한다.
- [x] `AI_GATEWAY_API_KEY`, Gateway endpoint, `typesafe-ai/jev`를 사용한다. 현재 MVP에 TypeSafe 직접 키를 요구하지 않는다.
- [x] 연결 설정을 판단 로직과 분리해 향후 직접 연결로 바꿀 수 있게 한다. 브라우저 입력으로 endpoint나 모델을 바꾸지 않는다.
- [x] 환경변수 이름은 공식 인증 방식에 맞춰 확정하고 `.env.example`에 placeholder만 넣는다. `NEXT_PUBLIC_` 키를 사용하지 않는다.
- [x] 구매 판단 지침과 입력 데이터를 구분해서 전달하며 설명 생성 질문은 추가하지 않는다.
- [x] 응답 decision enum과 confidence 유한수/범위를 검사한다. 알 수 없는 응답을 성공으로 변환하지 않는다.
- [x] 유한한 요청 timeout을 설정하고 무한 재시도하지 않는다.
- [x] 입력 오류, 설정 누락, 인증/한도 오류, timeout, provider 장애를 안전한 상태 코드와 사용자 메시지로 매핑한다.
- [x] 응답 캐시를 비활성화하고 키·구매 입력·provider 원문을 로그로 남기지 않는다.
- [x] 서버 어댑터와 route를 분리해 실제 과금 없이 오류 분기를 테스트할 수 있게 한다.

### 완료 기준
정상 입력으로 실제 Jev 결과를 반환한다. 설정이 없으면 명확한 오류를 반환하며 임의의 BUY/WAIT/SKIP을 반환하지 않는다.

### 작업 결과
실제 `POST /api/decision`은 유효한 노트북 입력에 HTTP 200으로 WAIT/confidence 0.76, probabilities BUY 0.08·WAIT 0.84·SKIP 0.08을 반환했다. 잘못된 입력과 JSON은 각각 HTTP 400으로 거절했다. 20초 abort, 401/403/429/5xx, 잘못된 응답, 키 누락을 mock 테스트로 검증했다. 전체 55개 테스트, lint, typecheck, build 통과. 독립 Reviewer가 timeout 테스트 보강을 요청했고 수정 후 PASS했다.

## 04. 단일 메인 화면
상태: TODO
선행 조건: 02; 03과 병렬 가능
담당: UI

- [ ] 제목 “이거 지금 사도 될까?”와 짧은 입력 안내를 구성한다.
- [ ] 제품명·가격·여유자금·현재 제품 상태·사용 빈도·필요도 입력을 제공한다.
- [ ] 5개 프리셋으로 입력을 채울 수 있게 한다. 실제 API 결과가 아닌 예시 입력임을 표시한다.
- [ ] 초기/입력 오류/loading/성공/API 오류 상태를 구현한다.
- [ ] 요청 중 중복 제출을 막고 오류 후 입력을 유지하며 재시도할 수 있게 한다.
- [ ] 입력 변경 시 이전 결과를 지우거나 오래된 결과임을 명확히 표시한다. 늦게 도착한 응답이 새 입력의 결과처럼 보이지 않게 한다.
- [ ] BUY/WAIT/SKIP의 한국어 label과 confidence 백분율을 보여준다. “모델의 판단 신뢰도이며 구매 만족 확률은 아닙니다”라는 짧은 안내를 제공한다.
- [ ] 360px 모바일부터 데스크톱까지 가로 넘침 없이 구성한다.
- [ ] label, 키보드 탐색, focus, 충분한 대비, loading과 결과 알림을 확인한다. 색상만으로 결과를 구분하지 않는다.

### 완료 기준
실제 API 계약으로 모든 화면 상태가 작동하고 로그인·히스토리·상품 추천 등 제외 기능이 없다.

### 작업 결과
실행 시 기록.

## 05. 통합 및 핵심 QA
상태: TODO
선행 조건: 03, 04
담당: 메인 + QA

- [ ] 입력 → 서버 API → Vercel AI Gateway → Jev → 결과 화면까지 실제 호출로 확인한다.
- [ ] 정상 성공, 잘못된 JSON/입력, 키 누락, upstream 401/429/5xx, timeout, 잘못된 응답을 테스트한다. 외부 오류는 테스트용 fixture로 재현한다.
- [ ] confidence의 NaN/무한대/범위 밖 값과 알 수 없는 decision을 거절하는지 확인한다.
- [ ] 프리셋 적용, 중복 제출 방지, 입력 변경 후 결과 처리, 오류 후 재시도를 확인한다.
- [ ] 모바일 360px/390px 및 데스크톱 화면, 키보드 조작을 점검한다.
- [ ] 브라우저 번들·네트워크 응답에 API 키가 없는지 확인한다. 키 값을 출력하지 않는다.
- [ ] `test`, `typecheck`, `lint`, `build`를 실행하고 프로덕션 서버에서도 핵심 동작을 확인한다.
- [ ] 실제 호출 검증과 모의 테스트를 분리해 기록한다. 주관적 구매 판단의 특정 선택지를 정답으로 고정하지 않는다.

- [ ] 20~30개 구매 상황으로 기준 일치와 반복 호출 일관성을 확인한다. 가격·예산·필요도만 바꾼 비교 사례를 포함한다. 주관적인 사례는 허용 선택지를 정의하고 이를 객관적 구매 정답률로 보고하지 않는다.
- [ ] confidence를 구매 만족 확률이나 정답률로 표현하지 않는지 확인한다. Vercel 경유와 직접 연결의 품질 동등성은 실측 전 보장하지 않는다.

### 완료 기준
핵심 검사 통과와 실제 연결 증거가 있어야 DONE으로 표시한다. 키나 네트워크 때문에 실행하지 못한 검사는 미검증으로 남긴다.

### 작업 결과
명령, 결과, 실제 호출 여부, 남은 결함을 기록.

## 06. README 및 배포 준비
상태: TODO
선행 조건: 05
담당: 메인

- [ ] README에 목적·범위·지원 Node·설치·환경변수·개발/테스트/빌드/실행 방법을 적는다.
- [ ] Vercel 경유 Jev가 현재 기본 경로이며 직접 연결은 보류임을 README에 명시한다. 공식 Gateway/TypeSafe 문서, 확인 버전, 서버 `AI_GATEWAY_API_KEY` 설정, confidence 의미를 설명한다.
- [ ] Gateway 가격·크레딧·계정 제한을 확인하고 무료를 전제로 배포하지 않는다.
- [ ] 프리셋은 예시 가격이며 실제 상품 정보가 아님을 적는다.
- [ ] 키 누락·인증 실패·429·timeout의 해결 방법과 알려진 제한을 기록한다.
- [ ] Next.js 서버 기능을 지원하는 배포 환경 기준으로 서버 환경변수, build/start 명령과 설정 절차를 문서화한다. 정적 export로 처리하지 않는다.
- [ ] 로그인 없는 API의 공개 배포 전 호출 제한/비용 통제가 필요한지 점검하고 호스팅 플랫폼의 간단한 보호 설정을 안내한다. 별도 DB 인프라는 추가하지 않는다.
- [ ] 비밀 파일·생성 파일이 커밋 대상에 없는지 최종 확인한다.
- [ ] 단계별 로컬 커밋 규칙을 준수했는지 확인하고 원격 push 여부는 별도로 결정한다. 실제 공개 배포와 새 유료 서비스 생성은 별도 지시 없이 수행하지 않는다.
- [ ] 완료 항목, 검증 결과, 실행 방법, 남은 제약을 최종 보고한다.

### 완료 기준
처음 보는 사람이 README로 로컬 실행과 배포 설정을 재현할 수 있다. 배포 준비 완료를 실제 배포 완료로 보고하지 않는다.

### 작업 결과
실행 시 기록.

## 07. 24시간 자동 실행 운영 계획
상태: TODO — 실행 및 예약 미설정
담당: 메인

### 시작 조건
사용자가 문서를 검토하고 실행을 지시한 다음 적용한다. 계획 파일 자체는 스케줄러가 아니며, 이 파일을 생성했다고 자동 실행이 시작되지는 않는다. 별도 예약 요청이 있으면 시작 시각·종료 시각·실행 환경을 반영해 실제 예약을 설정한다.

### 운영 규칙
1. 시작 시각과 24시간 종료 시각을 시간대 포함해 기록한다.
2. `INTENT.md`, `TODO.md`, 각 작업 결과와 실제 git 상태를 읽고 미완료 단계에서 재개한다.
3. 00의 Vercel AI Gateway 경유 실제 Jev 호출 성공 전에는 앱 구현에 진입하지 않는다. TypeSafe 직접 가입 재개를 기다릴 필요는 없으며 직접 연결은 일시 보류한다.
4. 계약 확정 후 API/UI를 병렬화하고 QA가 독립 검증한다. 메인 에이전트가 통합을 책임진다. 여러 에이전트가 동일 파일을 동시에 수정하지 않게 담당 경로를 나눈다.
5. 단계마다 상태와 검증 근거를 해당 MD에 남긴다. 재시작 시 이미 끝난 작업을 반복하지 않는다.
6. 키·접근 권한·외부 서비스 문제는 BLOCKED로 기록하고 필요한 사용자 조치를 알린다. 같은 실패를 무한 반복하지 않는다.
7. 테스트 실패는 원인을 수정하고 관련 검사를 다시 수행한다. 범위 밖 기능 추가로 해결하지 않는다.
8. 중단 요청이 오면 진행 중 작업을 안전하게 멈추고 현재 상태를 기록한다.
9. 완료하면 24시간을 채우기 위해 일을 만들지 않고 종료한다. 기한에 도달하면 완료/미완료/막힘과 다음 행동을 보고한다.
10. 자동 알림은 의미 있는 완료·실패·사용자 조치 필요 때 제공한다. 변화 없는 상태를 반복 알리지 않는다.

### 실행 기록
- 시작: 미정
- 종료 기한: 미정
- 현재 단계: 실행 대기
- 막힘: 실행 시 확인
- 다음 행동: 사용자 실행 지시 후 00 시작



## 최신 UI 구현 기준
참고 이미지: [purchase-app-ui.png](../references/purchase-app-ui.png). 이번 변경은 구현 방향 기록이며 앱 구현 완료가 아니다.

- 모바일 우선 단일 열, 데스크톱도 max-width 약 480px의 가운데 한 열. 입력/결과/조건 변경을 가로로 나란히 배치하지 않는다. 가짜 휴대폰 테두리나 OS 상태바는 구현하지 않는다.
- 시각 기준: 흰 배경, 옅은 푸른색 보조 영역, 검정 주요 버튼, 둥근 입력/카드, 파란 선택 상태. BUY 초록, WAIT 주황, SKIP 회색에 텍스트를 병기한다.
- 입력: 직접 입력/예시 탭, 제품명·가격, 여유자금 슬라이더와 숫자 입력, 현재 제품 상태·사용 빈도·필요도 선택, 판단 버튼. 기존 enum을 이미지 때문에 누락하지 않는다. 슬라이더 표시 구간과 서버 허용 범위는 구분하며 큰 금액도 숫자로 입력 가능하게 한다.
- 결과: 실제 decision과 한국어 label, confidence, 선택지 확률 막대, 고정 안내 문구, 입력 조건 요약, 다시하기/조건 변경 버튼. 참고의 74% 등 숫자를 실제 값처럼 하드코딩하지 않는다.
- confidence와 선택지 probabilities는 서로 다른 값이다. 확률 막대에는 실제 probabilities를 쓰고 confidence는 별도 label로 보여준다. Gateway의 선택지 분포를 확인한 뒤 기존 응답 계약에 probabilities를 추가하고 서버·UI·테스트를 함께 수정한다. 누락된 분포를 임의로 생성하지 않는다.
- 설명은 BUY/WAIT/SKIP에 따른 짧은 고정 안내를 사용한다. 모델이 생성한 이유처럼 표현하거나 입력 근거를 지어내지 않는다. GPT 설명 생성은 여전히 제외한다.
- 조건 변경: 기존 입력을 보존한 편집 폼으로 이동하고 명시적 재판단 버튼으로 호출한다. 입력을 움직일 때마다 API를 호출하지 않는다.
- 이미지의 조건 변화 차트는 실제 여러 조건의 평가값이 확보된 경우에만 표시한다. MVP는 조건 변경 후 1회 재판단을 우선한다. 추정 곡선·가짜 확률로 그래프를 채우지 않는다.
- 프리셋은 같은 열 안에서 선택 가능하게 하고 가격은 예시임을 명시한다. 하단 홍보용 4열 특징 영역은 앱 필수 흐름에서 제외한다.
