import PurchaseForm from "./purchase-form";

export default function Home() {
  return (
    <main className="app-shell">
      <header className="intro">
        <h1>이거 지금 사도 될까?</h1>
        <p className="intro-copy">구매 조건을 입력하면 Jev의 구조화된 판단을 확인할 수 있어요.</p>
      </header>
      <PurchaseForm />
    </main>
  );
}
