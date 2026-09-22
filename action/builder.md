# 코드 구현 방식

[plan.md](plan.md)의 단계별 요구사항에 따라 구현한다. 대상 경로는 제안이며 기존 구조를 우선한다. 변경 이유와 실제 코드·검증 근거를 아래 구현 기록에 남긴다. 이 문서는 구현 완료 보고가 아니다.

공통 방침: Gateway 경유 Jev, 서버 전용 `AI_GATEWAY_API_KEY`, 직접 TypeSafe 연결 보류. 00의 실제 호출과 독립 리뷰는 통과했으며 이후 앱 구현에서 이 경로를 사용한다. 테스트 fixture를 실제 서비스 결과로 제공하지 않는다. 기존 사용자 변경을 보존하고 불필요한 추상화·의존성을 추가하지 않는다.

## 00-preflight-and-jev

대상: `scripts/smoke-jev.mjs`, `.env.example`, `.gitignore`.
1. 기존 파일을 읽고 직접 호출 코드를 보존할 필요가 있는지 확인한 뒤 현재 스크립트를 Gateway 전용으로 전환한다.
2. Node 내장 fetch로 `https://ai-gateway.vercel.sh/typesafe/v1/systemone`에 POST한다. `AI_GATEWAY_API_KEY`만 서버 환경에서 읽고 모델은 `typesafe-ai/jev`로 지정한다.
3. `state`에는 예시 구매 데이터를, `questions.purchase`에는 choice와 BUY/WAIT/SKIP 기준을 넣는다.
4. 20초 timeout과 HTTP 오류 처리를 적용하고 `answers.purchase`의 type, choice, 유한한 0~1 confidence를 검증한다.
5. 키가 없으면 네트워크 호출 전 종료한다. 성공 시 검증된 decision/confidence만 출력한다. 원문 오류와 헤더를 출력하지 않는다.
6. 문법 검사와 키 누락 동작 확인 후 인증된 실제 호출을 수행한다. 키가 없으면 BLOCKED로 기록한다.
실행 목표: `node --env-file=.env.local scripts/smoke-jev.mjs`. Gateway 전환과 실제 호출 검증은 완료했다.

## 01-app-foundation

대상: `package.json`, lockfile, Next.js/TypeScript/lint 설정, `app/layout.tsx`, `app/page.tsx`, `app/globals.css`.
1. 00 통과 후 기존 문서와 scripts를 보존하며 저장소 루트에 App Router 앱을 구성한다.
2. 구현 시점 공식 문서로 호환되는 Next.js·React·Node 버전을 고정한다. 기존 패키지 매니저가 있으면 유지한다.
3. dev/build/start/typecheck/lint/test/smoke:jev 스크립트를 설정한다. 테스트 도구는 한 가지로 제한한다.
4. layout은 서버 컴포넌트로 유지하고 `lang="ko"`, 제목·설명을 넣는다. 상호작용 영역만 클라이언트 컴포넌트로 만든다.
5. 개발 실행과 기본 프로덕션 빌드를 확인한다. 테스트 러너 설치만으로 기능 테스트 통과를 주장하지 않는다.

## 02-schema-and-presets

대상: `lib/purchase.ts`, `lib/presets.ts`, `tests/purchase.test.ts` (기존 구조에 맞춰 조정 가능).
1. plan.md의 6개 필드와 enum·금액 범위를 하나의 공유 계약으로 정의한다.
2. 런타임 검증으로 문자열 trim, 길이, 정수·유한수·범위와 enum을 확인한다. 빈 문자열이 자동으로 0으로 변환되지 않게 한다.
3. `PurchaseContext`, `PurchaseDecision`, 안전한 오류 형식을 내보낸다. 타입 단언만으로 외부 값을 신뢰하지 않는다.
4. 5개 프리셋은 입력 데이터와 label만 포함한다. 결과나 confidence를 미리 심지 않는다.
5. schema 모듈에 환경변수나 서버 어댑터를 import하지 않는다.
6. 경계값과 enum·누락 필드·공백 이름 실패를 테스트하고 프리셋 전체를 검증한다.

## 03-jev-server-api

대상: `lib/jev.server.ts`, `app/api/decision/route.ts`, API/어댑터 테스트.
1. 서버 모듈에 server-only 경계를 적용한다. 고정 Gateway endpoint/model과 서버 키를 사용한다.
2. `decidePurchase(context): Promise<PurchaseDecision>` 함수 안에서 공식 요청 형식을 만들고 fetch한다. 제품명 등 입력을 JSON state 데이터로 구분한다.
3. 공식 응답을 검증한 후 choice→decision, confidence→confidence로 매핑한다. confidence를 확률 최대값으로 바꾸지 않는다.
4. route는 JSON 파싱 → 공유 검증 → 서버 함수 호출 → 안전한 JSON 응답 순서로 구현한다.
5. 잘못된 입력은 400, 서버 설정 누락은 503, upstream 실패는 안전한 502/503, timeout은 504 등 일관된 상태로 매핑한다. upstream 인증 실패를 사용자 로그인 오류로 노출하지 않는다.
6. 20초 timeout, no-store, 중복/무한 재시도 금지를 적용한다. endpoint·키·모델은 요청 body로 받지 않는다.
7. fetch를 테스트에서 대체할 수 있게 하되 불필요한 provider 프레임워크는 만들지 않는다. 실제 최소 호출과 모의 오류 테스트를 구분한다.

## 04-main-ui

대상: `app/page.tsx`, `app/purchase-form.tsx`, `app/globals.css`, 필요한 UI 테스트.
1. 단일 폼 컴포넌트와 공유 label/프리셋으로 6개 입력을 구성한다. 금액 입력 중에는 문자열로 보관하고 제출 시 명시적으로 변환·검증한다.
2. 화면 상태는 idle/loading/success/error로 명확히 관리하고 실제 서버 API만 결과 공급원으로 사용한다.
3. 제출 중 버튼을 비활성화한다. 입력·프리셋이 바뀌면 기존 요청을 취소하거나 요청 번호로 늦은 응답을 무시하고 결과를 초기화한다.
4. 실패 시 입력은 유지하고 재시도를 제공한다. 오류 문구는 사용자에게 필요한 내용만 표시한다.
5. decision 한국어 label과 confidence 백분율을 표시하며 만족 확률이 아니라는 안내를 함께 둔다.
6. 모바일 우선 CSS, label 연결, focus, aria-live 결과 영역을 적용한다. 새로운 디자인 시스템이나 저장 기능은 추가하지 않는다.

## 05-integration-and-qa

대상: `tests/`의 계약·서버·핵심 UI 테스트, 필요 시 최소 E2E 설정과 평가 fixture.
1. plan.md의 실패 분기를 유료 API 없이 재현하는 테스트를 작성한다. fixture는 테스트 환경에서만 사용한다.
2. 실제 연결 검증은 별도 smoke:jev 및 브라우저 흐름으로 수행하고 결과를 따로 기록한다.
3. 지연 응답과 입력 변경, 중복 제출, timeout 복구를 검증한다.
4. 20~30개 구매 입력과 사전 정의한 허용 결과·비교 기준을 준비한다. 평가 스크립트는 명시 실행 시에만 실제 요청을 보내고 요청 수를 제한한다.
5. 구매 판단 평가를 기준 일치율·반복 일관성으로 기록한다. 정답률이나 경로별 품질 동등성으로 일반화하지 않는다.
6. test/typecheck/lint/build와 프로덕션 서버 핵심 흐름을 확인하고 실패는 담당 builder로 되돌린다.

## 06-docs-and-release

대상: `README.md`, `.env.example`, `.gitignore`, 필요한 최소 배포 설정.
1. 실제 package.json 명령·Node 버전에 맞춰 설치/검증/실행 절차를 작성한다. 소개는 짧게 유지하고 긴 안내가 필요하면 별도 docs로 분리한다.
2. 현재 연결이 Gateway 경유 Jev임을 적고 `AI_GATEWAY_API_KEY`는 placeholder만 제공한다.
3. Next.js 서버가 실행되는 배포 방식을 안내한다. 정적 export나 클라이언트 키 설정으로 우회하지 않는다.
4. 현재 가격·크레딧 및 호출 제한 설정을 확인하고 무료 보장을 쓰지 않는다.
5. 실제 diff와 git 추적 목록으로 비밀/생성 파일 제외를 확인한다. 키 값 자체를 출력하는 검색을 하지 않는다.
6. 실제 공개 배포와 새 유료 서비스 생성은 이 문서 작업으로 시작하지 않는다. 최종 결과에 준비 완료와 미배포를 구분한다.

## 07-autonomous-run

대상: 공통 action/plan.md, action/builder.md, action/reviewer.md의 단계별 기록과 TODO.md 체크리스트. 이 단계 때문에 별도 스케줄러 코드를 만들지 않는다.
1. 시작 시 INTENT.md와 TODO.md를 읽고 종료 기한·현재 git 상태·각 단계 상태를 기록한다.
2. 각 작업은 plan 확인 → builder 구현/검증 → reviewer 코드 리뷰 → 지적 수정/재리뷰 순서로 수행한다.
3. 00의 실제 Gateway 호출 통과 후 앱 구현에 진입한다. 02 계약 고정 후 03/04의 파일 소유권을 나눠 병렬화한다.
4. reviewer는 실제 diff와 관련 코드를 읽고 독립 검증한다. 구현 중에는 같은 파일을 동시에 수정하지 않는다.
5. BLOCKED는 필요한 입력/권한과 재개 조건을 기록한다. 같은 실패의 무한 반복을 피한다.
6. 명시적인 예약 요청이 있을 때 지원되는 자동화 도구로 설정한다. MD 파일만으로 예약이나 24시간 백그라운드 실행이 된다고 보고하지 않는다.
7. 중단·기한 도달·완료 시 현재 상태와 미완료를 기록하고 종료한다.

## 구현 기록
단계별로 실제 작업 시 작성한다. Gateway 연결과 서버 API는 실제 호출까지 검증했다. 화면도 구현·검증했다. 통합 평가와 배포 문서까지 완료했다. 07 최종 기록을 검토 중이다.

| 단계 | 수정 파일·핵심 코드 | 계획과의 차이 | 검증 명령·결과 | 실제 호출 여부 | 막힘·다음 작업 |
|---|---|---|---|---|---|
| 실행 전 역할별 모델 설정 | `.codex/agents/{plan,builder,reviewer}.toml` | project-scoped TOML 역할 설정을 추가했다. Reviewer는 R1에 따라 `sandbox_mode = "read-only"`를 지정했다. | 세 파일의 필수 TOML 필드·모델·추론 수준·action 문서 참조를 확인했고, TOML 파싱 및 명시 spawn으로 Plan `gpt-6-astra`/`high`, Builder `gpt-5.6-terra`/`medium`, Reviewer `gpt-5.6-terra`/`high`를 확인했다. 명시 spawn 또는 런타임 설정이 파일 기반 자동 선택을 덮어쓸 수 있으므로 자동 선택은 미검증이다. | 해당 없음 | R1/R2 수정의 독립 재리뷰 PASS; 00 Gateway 검증과 분리. |
| 00 | `scripts/smoke-jev.mjs`, `.env.example`를 Gateway endpoint·server key·`typesafe-ai/jev`로 전환했다. 403은 결제 수단/customer verification 안내만 출력하고 provider body는 숨긴다. | 직접 TypeSafe 경로는 보류한다. | 문법·키 누락·mocked 403·diff 검사를 통과했다. 실제 호출 2건은 HTTP 200, `SKIP`/confidence `0.69`, `SKIP`/confidence `0.62`; 두 번째 probabilities는 `SKIP 0.74`, `WAIT 0.25`, `BUY 0.01`이었다. | Gateway 실제 호출 성공 | 독립 리뷰 PASS. 역할 설정 선행 커밋: `e378d7f`. |
| 01 | App Router TypeScript foundation: `app/`, package/config files, ESLint flat config, Korean metadata and placeholder. | Plan의 TypeScript `7.0.2`는 eslint-config-next에 포함된 typescript-eslint가 지원하지 않아 `6.0.3`으로 고정했다. | `npm install`, typecheck, lint, build, dev HTTP 200 통과. | 해당 없음 | 독립 리뷰 PASS. 입력 UI·API·프리셋은 다음 단계 범위. |
| 02 | `lib/purchase.ts`에 입력·응답 타입, labels, dependency-free runtime validation을, `lib/presets.ts`에 input-only 프리셋 5개를 추가했다. | 입력 검증은 productName trim과 범위·enum을 확인한다. 응답은 confidence와 필수 BUY/WAIT/SKIP probabilities를 별도로 검증하며 값을 정규화하지 않는다. | Vitest 37개, typecheck, lint, build 통과. | 해당 없음 | 독립 리뷰 PASS. API route와 UI는 다음 단계 범위. |
| 03 | `lib/jev.server.ts` 서버 전용 Gateway 어댑터와 `app/api/decision/route.ts`, 모의 오류 테스트를 추가했다. `server-only` 의존성을 명시했다. | 실제 smoke와 같은 고정 endpoint/model, KRW state, 20초 abort, 입력 선검증, no-store, 안전한 오류 매핑을 적용했다. | 전체 Vitest 55개, lint, typecheck, build 통과. 실제 route에서 유효 입력 HTTP 200 및 무효 입력/JSON HTTP 400 확인. | Gateway 실제 호출: WAIT, confidence 0.76, BUY/WAIT/SKIP 확률 0.08/0.84/0.08 | 커밋 `22b7393`. 독립 Reviewer R03-1 timeout 테스트 요청 후 보강·재리뷰 PASS. |
| 04 | `app/page.tsx`, `app/purchase-form.tsx`, `app/globals.css`에 단일 열 폼/결과 화면, 직접/예시 전환, 슬라이더, 조건 요약과 상태 처리를 구현했다. | 참고 이미지의 세 패널을 모바일 단일 열 순차 흐름으로 구현하고, 차트·고정 확률·SVG는 넣지 않았다. | 55개 테스트, lint, typecheck, build, 프로덕션 브라우저에서 예시 선택→실제 결과→입력 변경 시 초기화 확인. | Gateway 실제 화면 호출: WAIT/confidence 0.74, probabilities BUY/WAIT/SKIP 0.08/0.83/0.09 | 커밋 `eaf9f83`. 독립 리뷰 UI-1~UI-6 수정 후 PASS. |
| 05 | `qa/evaluation-cases.json`, `scripts/evaluate-jev.mjs`, `qa/evaluation-results.json`, `qa/evaluation-report.md`에 사전 기준·실행기·실제 결과를 기록했다. | 20개 고유 조건+5개 동일 반복을 결과 확인 전에 고정하고, 선택지 허용 기준은 모델에 보내지 않았다. 자동 재시도 없음. | 25/25 유효 응답, 19/20 사전 기준 일치, 5/5 반복 choice 일치. `npm test` 55개, typecheck, lint, build 통과. 클라이언트 번들 11개 키 누출 없음. | Gateway 실제 25회 | 커밋 `98385bd`. 독립 리뷰 PASS. S2 한 건 불일치와 정확도 해석 한계를 보고서에 명시. |
| 06 | `README.md`를 실제 앱 안내로 갱신하고 `.gitignore`에 `.vercel/`을 추가했다. | 소개는 짧게 유지하고 서버 환경변수·배포 준비·비용 통제·한계만 담았다. | README 명령·Node/Next/Gateway 설정을 코드와 대조하고 `git check-ignore`, diff 검사를 통과했다. | 해당 없음 | 커밋 `e7b512a`. 독립 리뷰 PASS. 공개 배포·push는 하지 않았다. |
| 07 | TODO와 action 문서에 실행·검증·리뷰·커밋 상태를 최종 기록했다. | 예약은 만들지 않았다. 00~06이 당일 완료돼 추가 백그라운드 실행이 필요하지 않았다. | `git log`에서 역할 설정 및 00~06의 별도 커밋과 origin/main 대비 미전송 상태를 확인했다. 07 커밋 후 clean worktree를 확인한다. | 해당 없음 | 단계 00~06 완료. 공개 배포·push는 추후 사용자 결정. |

리뷰 수정은 지적 ID, 수정 파일, 수정 내용, 재검증 결과를 추가한다. 키와 민감 정보는 기록하지 않는다. 단계별 변경을 커밋할 때 해당 단계의 파일만 staging하고 커밋 SHA와 검사 결과를 구현 기록에 추가한다.


## 최신 UI 방침
references/purchase-app-ui.png를 기준으로 action/plan.md의 단일 열 입력→결과→조건 변경 흐름을 적용한다.
CSS grid의 다열 전환 없이 max-width 약 480px과 width:100%로 구성한다. 실제 probabilities를 응답 schema에 추가하고 검증한 값으로 막대를 그린다. confidence와 별도 표시하며 고정 설명을 쓴다. 조건 변경은 명시적 제출로 재호출하고 차트용 가짜 데이터를 만들지 않는다.
