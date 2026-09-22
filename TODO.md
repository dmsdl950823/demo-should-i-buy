# 할 일

현재 상태: 역할별 모델 설정과 00 Gateway 실제 호출 검증은 완료했다. TypeSafe 직접 연결은 일시 보류한다.

- [x] 실행 전 역할별 모델 설정 및 적용 확인: project `.codex/agents` TOML 생성·파싱 및 명시 spawn으로 Plan Astra High / Builder Terra Medium / Reviewer Terra High 확인. 파일 기반 자동 역할 선택은 미검증이지만, 독립 재리뷰는 PASS.
- [x] 00. Gateway 경유 Jev 최소 호출 성공: 실제 응답 2건, 로컬 검사와 독립 리뷰 PASS
- [x] 01. Next.js 앱 기반 설정: 타입 검사·lint·빌드·개발 HTTP 200, 독립 리뷰 PASS
- [x] 02. 입력·출력 규격과 프리셋 5개: 37개 테스트·타입 검사·lint·빌드, 독립 리뷰 PASS
- [x] 03. 서버 API와 Gateway 연결: 55개 테스트·실제 route HTTP 200/400·독립 리뷰 PASS
- [x] 04. 모바일 단일 화면과 loading/error 처리: 실제 화면·55개 테스트·독립 리뷰 PASS
- [x] 05. 통합 테스트·실제 연결·코드 리뷰: 25회 실제 요청, 55개 테스트, 독립 리뷰 PASS
- [x] 06. README와 배포 준비: 실행·서버 키·비용 통제 문서화, 독립 리뷰 PASS
- [ ] 07. 실행 상태 관리 및 최종 보고

순서: 00 → 01 → 02 → 03·04 → 05 → 06. 07은 전 과정에 적용.
구현 계획은 [action/plan.md](action/plan.md), 구현 방식은 [action/builder.md](action/builder.md), 코드 리뷰는 [action/reviewer.md](action/reviewer.md)에서 관리한다.
각 항목 완료 후 검증·리뷰를 통과하면 **항목별 로컬 커밋 1개**를 남기고 SHA를 기록한다.

- [x] 제공된 UI 참고 이미지 기준으로 단일 열 앱 화면 구성
- [x] 실제 선택지 확률과 confidence를 구분해 표시
- [x] 조건 변경 후 재판단 흐름 구현
