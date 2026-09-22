# 살까말까 · Should I Buy?

제품명과 가격, 이번 달 여유자금, 현재 비슷한 제품 상태, 사용 빈도와 필요도를 입력하면 Jev가 **BUY / WAIT / SKIP**을 판단하는 작은 웹앱입니다. 예시 5개를 바로 써 볼 수 있고, 결과에는 선택지별 확률과 판단 신뢰도를 따로 표시합니다. 구매 정답이나 재무 상담을 제공하지 않습니다.

현재는 **Vercel AI Gateway 경유 Jev**(`typesafe-ai/jev`)를 사용합니다. TypeSafe 직접 연결은 가입이 다시 열릴 때까지 보류했습니다.

## 로컬 실행

Node.js 24.4 이상이 필요합니다.

```bash
npm ci
cp .env.example .env.local
# .env.local의 AI_GATEWAY_API_KEY를 본인의 Vercel AI Gateway 키로 설정
npm run dev
```

`http://localhost:3000`에서 사용합니다. 실제 연결만 별도로 확인하려면 `npm run smoke:jev`를 실행합니다. 검증 명령은 `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`입니다. 빌드 후 `npm run start`로 서버 실행을 확인할 수 있습니다.

## 배포 준비

Next.js 서버 route가 필요하므로 정적 사이트로 내보내지 않습니다. Vercel에 저장소를 Next.js 프로젝트로 연결하고 Node.js 24.x를 사용하세요. 프로젝트 **Settings → Environment Variables**에 `AI_GATEWAY_API_KEY`를 서버 환경변수로 추가한 뒤 새 배포를 만듭니다. `NEXT_PUBLIC_` 접두사는 붙이지 않습니다. 공개 전에는 로그인 없는 `/api/decision` 호출에 대한 접근·호출 제한과 [AI Gateway 예산](https://vercel.com/docs/ai-gateway/observability-and-spend/budgets)을 설정하고, [현재 모델 요금](https://vercel.com/ai-gateway/models/jev)과 [크레딧 잔액](https://vercel.com/docs/ai-gateway/pricing)을 확인하세요. 이 저장소는 아직 공개 배포하지 않았습니다.

키가 없으면 API는 503을 반환합니다. 인증·크레딧 문제나 호출 한도(429)는 [Vercel AI Gateway 대시보드](https://vercel.com/docs/ai-gateway/pricing)에서 확인하세요. Jev 응답이 지연되면 20초 후 오류가 표시되며 다시 시도할 수 있습니다. 판단 신뢰도는 구매 만족 확률이나 정답률이 아닙니다. 프리셋 가격도 예시 값입니다. [소규모 평가 결과](qa/evaluation-report.md)는 구매 판단의 객관적 정확도를 뜻하지 않습니다.

**보안:** API 키·비밀번호·토큰을 코드, Git, 브라우저 번들, API 응답이나 로그에 넣지 않습니다. `.env.local`은 Git에서 제외합니다. [Gateway 공식 API 문서](https://vercel.com/docs/ai-gateway/sdks-and-apis/typesafe)와 [프로젝트 의도](INTENT.md), [작업 상태](TODO.md)를 참고하세요.
