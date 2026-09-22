# 살까말까 · Should I Buy?

사고 싶은 물건, 지금 사도 될까? 제품명과 가격, 이번 달 여유자금, 현재 제품 상태, 사용 빈도와 필요도를 입력하면 **Jev(TypeSafe AI System One)**가 `BUY / WAIT / SKIP`과 판단 신뢰도(confidence)를 반환하는 웹앱입니다.

Next.js 기반의 작은 MVP로, 예시 프리셋과 모바일 화면을 제공합니다. 로그인이나 상품 검색 없이 구매 판단을 간단히 체험하는 데 집중합니다.

현재는 구현 전 계획 단계입니다. 프로젝트 목표는 [INTENT.md](INTENT.md), 할 일은 [TODO.md](TODO.md), 구현·리뷰 문서는 [action/plan.md](action/plan.md)에서 확인할 수 있습니다.

**보안 주의:** API 키, 비밀번호, 토큰 등 민감한 정보는 코드에 직접 넣거나 Git에 커밋하지 않습니다. Jev API 키는 서버 환경변수로만 관리하고, 브라우저·로그·API 응답에 노출하지 않습니다.
