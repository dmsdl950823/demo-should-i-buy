# 코드 리뷰

[plan.md](plan.md)와 [builder.md](builder.md)를 기준으로 실제 코드·diff·검증 결과를 확인한다. 문서 작성만으로 리뷰 통과를 선언하지 않는다. 가능하면 구현자와 다른 에이전트가 검토하고, 자체 리뷰라면 명시한다.

현재 판정: **00 PASS / 앱 단계 NOT_REVIEWED**. Gateway 전환은 독립 리뷰를 통과했고, 앱 구현은 아직 리뷰하지 않았다.

## 00-preflight-and-jev

- 실제 요청 대상이 Gateway이고 TypeSafe 직접 API를 기본 호출하지 않는가?
- 인증키가 서버에서만 읽히며 `.env.local`이 git에서 제외되는가?
- 키 미설정, HTTP 실패, timeout, 응답 규격 오류를 성공으로 처리하지 않는가?
- choice와 confidence를 원래 의미대로 읽으며 가짜 값이나 다른 모델 fallback이 없는가?
- 실제 호출 성공 근거가 있는가? 문법 검사나 fixture만으로 완료 처리하지 않았는가?

## 01-app-foundation

- 기존 README, INTENT, todo, scripts와 사용자 변경이 보존됐는가?
- Next.js·React·Node와 lockfile이 호환되고 명령이 실제로 동작하는가?
- 서버 비밀값이 클라이언트 import 경로로 유입되지 않는가?
- 제외 기능용 라이브러리나 중첩 저장소가 생기지 않았는가?
- 기본 앱 빌드 성공을 전체 MVP 완료와 구분했는가?

## 02-schema-and-presets

- 0원 여유자금은 허용하고 0원 가격·소수·음수·범위 초과는 거절하는가?
- TS 타입과 런타임 검증 조건이 일치하는가?
- 빈 값·문자열 숫자·null의 처리 방식이 명확한가?
- 프리셋이 사실로 오인될 가격이나 고정 AI 결과를 포함하지 않는가?
- UI와 서버가 같은 규격을 사용하고 공유 모듈에 비밀정보가 없는가?

## 03-jev-server-api

- 입력 검증 전에 유료 호출이 발생하지 않는가?
- 클라이언트가 endpoint, 모델, 인증 헤더를 조작할 수 없는가?
- 악성 제품명 문자열을 판단 지시와 분리했는가?
- 키 누락과 timeout, upstream 오류·잘못된 응답을 안전하게 처리하는가?
- 키·구매 입력·upstream 오류 원문이 로그/응답/브라우저에 노출되지 않는가?
- confidence가 0인 정상 응답을 falsy 검사로 거절하지 않는가?
- 직접 TypeSafe 호출과 가짜 성공 fallback이 제거됐는가?

## 04-main-ui

- 모든 입력과 프리셋이 서버 계약과 일치하는가?
- 빠른 중복 클릭이나 입력 변경 후 늦게 도착한 응답이 잘못된 결과를 표시하지 않는가?
- loading 중 실패/취소 후 폼이 다시 사용 가능한가?
- 오류 후 사용자 입력과 재시도 동선이 유지되는가?
- confidence 반올림이 원래 값을 왜곡하거나 구매 성공률처럼 보이게 하지 않는가?
- 360px 화면, 키보드 접근, label/대비/알림이 실제로 작동하는가?

## 05-integration-and-qa

- 테스트가 구현을 그대로 복제하는 대신 계약과 사용자 실패 사례를 검증하는가?
- fixture나 실제 키를 테스트 출력·스냅샷에 섞지 않았는가?
- 실행하지 않은 테스트가 통과로 표시되지 않았는가?
- 실제 호출과 mock 검사 결과가 구별되는가?
- 평가 기대값을 응답을 본 뒤 유리하게 바꾸지 않았는가?
- 통계적 정확도를 주장하기에 부족한 소규모 주관적 평가의 한계를 명시했는가?
- 미해결 결함이 완료 보고에서 누락되지 않았는가?

## 06-docs-and-release

- README 명령과 환경변수가 실제 코드와 일치하는가?
- 현재 기본 경로에 TypeSafe 직접 가입/키를 요구하는 낡은 안내가 없는가?
- 서버 route를 지원하는 배포 방식인가?
- 비밀값·예시 가격·confidence의 의미가 정확한가?
- 커밋 대상에 .env.local, 빌드 산출물, 테스트용 민감 자료가 없는가?
- 배포/가격/정확도/완료 상태를 검증한 범위 이상으로 주장하지 않는가?

## 07-autonomous-run

- 모든 작업에 실제 구현/검증/리뷰 근거가 연결되는가?
- 구현자의 완료 선언만으로 plan이 DONE 처리되지 않았는가?
- BLOCKED와 미검증을 숨기거나 TypeSafe 직접 가입을 계속 선행 조건으로 삼지 않았는가?
- 병렬 작업의 공유 파일 충돌과 사용자 변경 덮어쓰기가 없는가?
- 24시간 기한과 중단 요청을 지키고 예약 상태를 사실대로 보고하는가?
- 미해결 리뷰 지적은 담당 builder에 환류됐는가?

## 리뷰 기록
단계별로 리뷰 대상 commit 또는 diff 범위, 리뷰어, 독립/자체 리뷰 여부, 실행 검사와 미실행 사유를 기록한다.

### 실행 전 역할별 모델 설정 (2026-09-22)

범위: `.codex/agents/{plan,builder,reviewer}.toml`, `TODO.md`, `action/plan.md`, `action/builder.md`.

독립 Reviewer가 R1 (`reviewer.toml`에 `sandbox_mode = "read-only"` 추가)과 R2 (TOML 생성·명시 spawn 검증과 파일 기반 자동 선택 미검증을 정확히 기록)를 요청했다. 수정 후 필수 TOML 필드, action 문서 참조, 모델·추론 수준과 기록을 재검토했다.

판정: **PASS**. Plan `gpt-6-astra`/`high`, Builder `gpt-5.6-terra`/`medium`, Reviewer `gpt-5.6-terra`/`high`의 명시 spawn 적용은 확인됐다. 명시 spawn 또는 런타임 설정이 TOML 기반 자동 선택을 덮어쓸 수 있으므로, 파일 기반 자동 선택은 검증 완료로 주장하지 않는다.

### 00-preflight-and-jev (2026-09-22)

범위: `scripts/smoke-jev.mjs`, `.env.example`, `TODO.md`, `action/plan.md`, `action/builder.md`.

Builder 검증 근거: 문법 검사, 키 누락 시 네트워크 전 종료, mocked HTTP 403의 안전한 customer-verification/결제 수단 안내, 실제 Gateway HTTP 200 두 건, `git diff --check`. 실제 응답은 `typesafe-ai/jev`에서 `SKIP`/confidence `0.69`, `SKIP`/confidence `0.62`였고, 두 번째 probabilities는 `SKIP 0.74`, `WAIT 0.25`, `BUY 0.01`이었다.

판정: **PASS**. 독립 Reviewer는 Gateway endpoint·서버 키 이름·20초 timeout·응답 검증·403 안내가 provider 원문 또는 키를 노출하지 않는지와 실행 기록의 실제 증거 일치를 확인했다. 앱 단계는 계속 **NOT_REVIEWED**다.

### 01-app-foundation (2026-09-22)

범위: `package.json`, `package-lock.json`, `tsconfig.json`, `eslint.config.mjs`, `app/`, `.gitignore`, `AGENTS.md`, `CLAUDE.md`.

Builder 검증 근거: `npm install`, `npm run typecheck`, `npm run lint`, `npm run build`, 개발 서버 HTTP 200. TypeScript는 Plan의 `7.0.2` 대신 eslint-config-next의 typescript-eslint 지원 범위에 맞춘 `6.0.3`이다.

판정: **PASS**. package/lockfile의 고정 버전, scripts, 서버 전용 환경 파일 제외, 한국어 layout·metadata, Next 생성 지침 파일과 TypeScript `6.0.3` 호환 근거를 확인했다. 설치·typecheck·lint·build·개발 HTTP 200은 Builder가 실행했다. 이 단계에는 기능 테스트가 없으며 Reviewer 환경의 Vitest 실행은 사용자별 토큰 경로 쓰기 제한으로 미실행이다.

발견 사항은 `ID / 중요도 / 파일·라인 / 재현 조건 / 영향 / 권장 수정` 형식으로 작성한다. 수정 후에는 해당 ID의 해결 여부와 재검증 근거를 남긴다.

단계별 완료 커밋이 해당 작업만 포함하는지, 비밀 파일과 다른 단계의 미완료 변경이 섞이지 않았는지도 확인한다.

판정은 NOT_REVIEWED → PASS / CHANGES_REQUESTED / BLOCKED 중 하나다. 미해결 중요 결함이나 필수 검사 미실행 상태에서 PASS로 표시하지 않는다. builder로 지적을 돌려보내 수정·재리뷰하며, 불필요한 기능이나 대규모 리팩터링을 요구하지 않는다.


## 최신 UI 방침
references/purchase-app-ui.png를 기준으로 action/plan.md의 단일 열 입력→결과→조건 변경 흐름을 적용한다.
360px/390px/데스크톱 모두 한 열인지, 3개 패널이 가로 배치되지 않는지 확인한다. 실제 API 확률과 confidence의 혼용·예시 숫자 하드코딩·입력 변경마다 자동 호출·가짜 차트를 점검한다.
