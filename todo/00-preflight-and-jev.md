# 00. 환경 및 Jev 최소 호출
상태: BLOCKED — Vercel AI Gateway 인증 및 실제 호출 검증 필요
담당: 메인 + Jev/API

## 현재 연결 방침 (2026-09-22)
- **TypeSafe 직접 API 연결은 일시 보류한다. 현재 기본 경로는 Vercel AI Gateway를 통한 Jev 호출이다.** 모델은 계속 Jev이며 다른 AI로 대체하는 것이 아니다.
- 서버 인증에는 `AI_GATEWAY_API_KEY`를 사용한다. 현재 MVP에 `TYPESAFE_API_KEY`나 TypeSafe 직접 가입을 요구하지 않는다.
- TypeSafe 호환 API: `POST https://ai-gateway.vercel.sh/typesafe/v1/systemone`, 모델: `typesafe-ai/jev`.
- Gateway 실제 호출 성공을 00단계의 통과 조건으로 삼는다. 무료 프로모션을 가정하지 않고 계정 접근 권한·크레딧·가격을 확인한다.
- 직접 가입이 열리면 연결 설정 교체와 회귀 검증을 검토한다. 자동 전환하거나 직접 연결 실패 시 몰래 다른 모델로 대체하지 않는다.

## Gateway 전환 작업
- [ ] Vercel 계정에서 AI Gateway 사용 가능 여부와 크레딧·현재 가격을 확인한다.
- [ ] `AI_GATEWAY_API_KEY`를 서버 환경변수 또는 git에서 제외된 `.env.local`에 설정한다.
- [ ] 기존 `scripts/smoke-jev.mjs`의 직접 연결을 Gateway endpoint·키·모델로 전환한다. `.env.example`도 같은 이름으로 변경한다. 이 항목은 아직 계획이며 코드 전환 완료로 간주하지 않는다.
- [ ] 인증된 최소 choice 요청으로 BUY/WAIT/SKIP 및 confidence를 검증한다. 사용한 모델과 확인 가능한 provider 정보를 비밀정보 없이 기록한다.

## 작업
- [ ] 저장소 지침, git 상태와 remote, Node와 패키지 매니저, 기존 파일을 확인한다. 기존 변경은 보존한다.
- [ ] `https://typesafe.ai`에서 연결된 공식 문서와 공식 SDK 저장소를 따라 최신 사용법을 확인한다. 비공식 유사 도메인의 내용을 규격으로 채택하지 않는다.
- [ ] 패키지 이름·버전·지원 런타임·endpoint·인증 방식·모델·choice 요청/응답 구조를 기록한다.
- [ ] confidence가 별도 값인지 선택지 확률에서 얻는 값인지 확인한다. 근거 없이 계산하거나 만들어내지 않는다.
- [ ] 공식 규격에 맞는 최소 실행 스크립트와 `.env.example`, 환경 파일 제외 규칙을 준비한다. 실제 키는 사용자가 로컬 환경변수 또는 git에서 제외된 파일로 설정하도록 한다.
- [ ] BUY/WAIT/SKIP 중 하나를 반환하는 실제 요청 1건을 실행한다. 응답 구조와 숫자 범위를 확인한다.
- [ ] 문서 링크, 확인 날짜, SDK 버전, 비밀정보를 제거한 실행 결과를 기록한다.

## 통과 조건
공식 API에 인증된 실제 요청이 성공하고 decision/confidence 매핑을 설명할 수 있다. 연결 스크립트는 이후 `smoke:jev` 명령으로 재사용한다.

## 막힘 처리
키 없음, 이용 권한 없음, 인증 실패, endpoint 불명확 시 BLOCKED로 표시한다. 키를 채팅에 붙여넣도록 요구하지 않는다. 접근 권한 우회나 다른 모델로 대체하지 않는다. 독립적인 문서 정리는 가능하나 앱 구현은 대기한다.

## 공식 Gateway 근거
- https://vercel.com/docs/ai-gateway/sdks-and-apis/typesafe
- https://vercel.com/docs/ai-gateway/authentication-and-byok
- 응답은 TypeSafe 호환 형식으로 `answers.purchase.choice`와 `answers.purchase.confidence`를 읽는다.

## 이전 직접 연결 조사 기록 (보류됨)
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
