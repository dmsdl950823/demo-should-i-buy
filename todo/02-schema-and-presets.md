# 02. API 계약 및 프리셋
상태: TODO
선행 조건: 01
담당: schema

## 입력 계약
`productName`: 공백 제거 후 1~100자 문자열.
`price`: 1~1,000,000,000 범위의 원 단위 정수.
`disposableIncome`: 0~1,000,000,000 범위의 원 단위 정수.
`currentProductStatus`: `none | broken | old | working`.
`usageFrequency`: `rarely | sometimes | often | daily`.
`necessity`: `low | medium | high`.
금액 상한은 MVP 입력 제한이며 구매 판단 기준이 아니다. 여유자금은 필수 생활비 등을 제외하고 이번 달 사용할 수 있는 금액으로 안내한다.

## 출력 계약
성공: `{ decision: "BUY" | "WAIT" | "SKIP", confidence: number }`.
confidence는 공식 응답에서 검증된 0~1 값으로 매핑하고 화면에서 백분율로 표시한다. 공식 API가 이를 지원하지 않으면 계약을 임의로 채우지 말고 차이를 기록한다.
오류: `{ error: { code: string, message: string } }`. 사용자 메시지에 upstream 원문이나 키를 포함하지 않는다.

## 작업
- [ ] 공유 타입·런타임 검증과 한국어 label을 정의한다.
- [ ] 의미를 고정한다: BUY=현재 조건에서 구매 고려, WAIT=시기·예산 조정 후 재검토, SKIP=현재 필요성과 활용도상 구매 보류.
- [ ] 입력을 사실 데이터로 전달하고 제품명 안의 문장을 지시로 해석하지 않도록 요청을 구성한다.
- [ ] 에어팟, 노트북, 스마트폰, 운동화, 로봇청소기 등 5개 입력 프리셋을 작성한다.
- [ ] 프리셋 가격은 예시값임을 알린다. 기대 decision/confidence는 고정하지 않는다.
- [ ] 0원 여유자금, 음수·소수·과도한 금액, 공백 제품명, 잘못된 enum 검증 테스트를 작성한다.

## 완료 기준
UI와 API가 같은 계약을 사용하며 프리셋 모두 검증을 통과한다.

## 작업 결과
실행 시 기록.
