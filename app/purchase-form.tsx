"use client";

import { FormEvent, useRef, useState } from "react";
import { purchasePresets } from "../lib/presets";
import { currentProductStatuses, decisionMeanings, necessityLevels, purchaseDecisions, purchaseLabels, type PurchaseContext, type PurchaseDecision, usageFrequencies, validatePurchaseContext, validatePurchaseDecision } from "../lib/purchase";

type FormValues = Omit<PurchaseContext, "price" | "disposableIncome"> & { price: string; disposableIncome: string };
type RequestState = "idle" | "loading" | "success" | "error";
type InputMode = "direct" | "example";

const initialValues: FormValues = { productName: "", price: "", disposableIncome: "", currentProductStatus: "none", usageFrequency: "sometimes", necessity: "medium" };
const fieldLabels = { currentProductStatus: "현재 비슷한 제품 상태", usageFrequency: "사용 빈도", necessity: "필요도" } as const;
const formFromContext = (input: PurchaseContext): FormValues => ({ ...input, price: String(input.price), disposableIncome: String(input.disposableIncome) });
const parseMoney = (value: string): number | null => /^\d+$/.test(value) && Number.isSafeInteger(Number(value)) ? Number(value) : null;
const percent = (value: number) => `${Math.round(value * 100)}%`;
const money = (value: number) => `${new Intl.NumberFormat("ko-KR").format(value)}원`;
const incomeSliderMaximum = 3_000_000;

function errorFrom(payload: unknown) {
  if (typeof payload === "object" && payload && "error" in payload && typeof payload.error === "object" && payload.error && "message" in payload.error && typeof payload.error.message === "string") return payload.error.message;
  return "판단을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.";
}

function ChoiceGroup<Value extends string>({ field, label, labels, onChange, options, value }: { field: string; label: string; labels: Record<Value, string>; onChange: (value: Value) => void; options: readonly Value[]; value: Value }) {
  return <fieldset className="choice-field"><legend>{label}</legend><div className="segmented-control">{options.map((option) => <label key={option}><input checked={value === option} name={field} onChange={() => onChange(option)} type="radio" /><span>{labels[option]}</span></label>)}</div></fieldset>;
}

export default function PurchaseForm() {
  const [values, setValues] = useState<FormValues>(initialValues);
  const [state, setState] = useState<RequestState>("idle");
  const [result, setResult] = useState<PurchaseDecision | null>(null);
  const [submitted, setSubmitted] = useState<PurchaseContext | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [inputMode, setInputMode] = useState<InputMode>("direct");
  const requestId = useRef(0);
  const controller = useRef<AbortController | null>(null);

  function resetResult() { requestId.current += 1; controller.current?.abort(); controller.current = null; setResult(null); setErrorMessage(""); setState("idle"); }
  function update<Key extends keyof FormValues>(key: Key, value: FormValues[Key]) { resetResult(); setValues((current) => ({ ...current, [key]: value })); }
  function preset(id: string) { const item = purchasePresets.find((candidate) => candidate.id === id); if (item) { resetResult(); setValues(formFromContext(item.input)); setInputMode("direct"); } }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state === "loading") return;
    const validation = validatePurchaseContext({ ...values, price: parseMoney(values.price), disposableIncome: parseMoney(values.disposableIncome) });
    if (!validation.success) { setResult(null); setState("error"); setErrorMessage("입력한 조건을 다시 확인해 주세요. 금액은 원 단위의 정수로 입력해 주세요."); return; }
    const id = requestId.current + 1;
    const nextController = new AbortController();
    requestId.current = id; setState("loading"); setErrorMessage(""); setResult(null); setSubmitted(validation.data);
    controller.current = nextController;
    try {
      const response = await fetch("/api/decision", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(validation.data), signal: nextController.signal });
      const payload: unknown = await response.json().catch(() => null);
      if (requestId.current !== id) return;
      if (!response.ok) throw new Error(errorFrom(payload));
      const decision = validatePurchaseDecision(payload);
      if (!decision.success) throw new Error("받은 판단 결과를 표시할 수 없어요. 다시 시도해 주세요.");
      setResult(decision.data); setState("success");
    } catch (error) {
      if (requestId.current !== id) return;
      setResult(null); setState("error"); setErrorMessage(error instanceof Error ? error.message : "판단을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      if (requestId.current === id) controller.current = null;
    }
  }

  const enteredIncome = parseMoney(values.disposableIncome) ?? 0;
  const sliderIncome = Math.min(enteredIncome, incomeSliderMaximum);

  return <div className="flow">
    <section className="panel form-panel" aria-labelledby="input-title">
      <div className="section-heading"><h2 id="input-title">구매 조건을 알려주세요</h2></div>
      <div className="input-mode-tabs" aria-label="입력 방식"><button aria-pressed={inputMode === "direct"} className={inputMode === "direct" ? "active" : ""} onClick={() => setInputMode("direct")} type="button">직접 입력하기</button><button aria-pressed={inputMode === "example"} className={inputMode === "example" ? "active" : ""} onClick={() => setInputMode("example")} type="button">예시로 해보기</button></div>
      {inputMode === "example" && <div className="preset-area"><div className="preset-label-row"><p>바로 채워 보기</p><span>가격은 예시입니다</span></div><div className="preset-list" role="group" aria-label="구매 조건 예시">{purchasePresets.map((item) => <button className="preset" key={item.id} onClick={() => preset(item.id)} type="button">{item.label}</button>)}</div></div>}
      <form noValidate onSubmit={submit}>
        <div className="field"><label htmlFor="productName">제품명</label><input id="productName" maxLength={100} onChange={(event) => update("productName", event.target.value)} placeholder="예: 맥북 에어" type="text" value={values.productName} /></div>
        <div className="money-grid">
          <div className="field"><label htmlFor="price">가격</label><div className="input-suffix"><input id="price" inputMode="numeric" onChange={(event) => update("price", event.target.value.replace(/[^0-9]/g, ""))} placeholder="0" type="text" value={values.price} /><span aria-hidden="true">원</span></div></div>
          <div className="field"><label htmlFor="disposableIncome">이번 달 여유자금</label><div className="input-suffix"><input id="disposableIncome" inputMode="numeric" onChange={(event) => update("disposableIncome", event.target.value.replace(/[^0-9]/g, ""))} placeholder="0" type="text" value={values.disposableIncome} /><span aria-hidden="true">원</span></div><div className="income-slider"><label htmlFor="income-range">슬라이더로 금액 조절</label><input aria-describedby="income-slider-hint" id="income-range" max={incomeSliderMaximum} min="0" onChange={(event) => update("disposableIncome", event.target.value)} step="100000" type="range" value={sliderIncome} /><div><span>0원</span><strong>{enteredIncome > incomeSliderMaximum ? `표시 상한 ${money(sliderIncome)}` : money(sliderIncome)}</strong><span>300만원</span></div></div><p className="field-hint" id="income-slider-hint">슬라이더는 300만원까지 보여드려요.{enteredIncome > incomeSliderMaximum ? ` 현재 입력값은 ${money(enteredIncome)}입니다.` : " 더 큰 금액도 위 숫자 입력란에 입력할 수 있어요."}</p></div>
        </div>
        <ChoiceGroup field="currentProductStatus" label={fieldLabels.currentProductStatus} labels={purchaseLabels.currentProductStatus} onChange={(option) => update("currentProductStatus", option)} options={currentProductStatuses} value={values.currentProductStatus} />
        <ChoiceGroup field="usageFrequency" label={fieldLabels.usageFrequency} labels={purchaseLabels.usageFrequency} onChange={(option) => update("usageFrequency", option)} options={usageFrequencies} value={values.usageFrequency} />
        <ChoiceGroup field="necessity" label={fieldLabels.necessity} labels={purchaseLabels.necessity} onChange={(option) => update("necessity", option)} options={necessityLevels} value={values.necessity} />
        <button className="primary-button" disabled={state === "loading"} type="submit">{state === "loading" ? "판단을 확인하는 중…" : "AI에게 물어보기"}</button>
      </form>
    </section>
    <div className="status-region" aria-atomic="true" aria-live="polite">
      {state === "loading" && <section className="panel loading-panel" aria-label="판단을 확인하는 중"><span className="loading-dot" aria-hidden="true" /><div><h2>조건을 살펴보고 있어요</h2><p>잠시만 기다려 주세요.</p></div></section>}
      {state === "error" && <section className="panel error-panel" role="alert"><h2>판단을 가져오지 못했어요</h2><p>{errorMessage}</p><button className="secondary-button" onClick={() => document.querySelector<HTMLFormElement>("form")?.requestSubmit()} type="button">다시 시도하기</button></section>}
      {state === "success" && result && <section className="panel result-panel" aria-labelledby="result-title">
        <div className="section-heading"><h2 id="result-title">판단 결과</h2></div>
        <div className={`decision-card decision-${result.decision.toLowerCase()}`}><p>{purchaseLabels.decision[result.decision]}</p><strong>{result.decision}</strong><span>{decisionMeanings[result.decision]}</span></div>
        <div className="confidence-row"><div><p>모델의 판단 신뢰도</p><strong>{percent(result.confidence)}</strong></div><p>모델의 판단 신뢰도이며 구매 만족 확률은 아닙니다.</p></div>
        <div className="probability-card"><h3>선택지별 확률</h3>{purchaseDecisions.map((decision) => <div className="probability-row" key={decision}><span>{decision}</span><div aria-label={`${decision} ${percent(result.probabilities[decision])}`} className="probability-track" role="img"><span className={`probability-fill probability-${decision.toLowerCase()}`} style={{ width: `${result.probabilities[decision] * 100}%` }} /></div><strong>{percent(result.probabilities[decision])}</strong></div>)}</div>
        {submitted && <div className="summary-card"><h3>입력한 조건 요약</h3><dl><div><dt>제품명</dt><dd>{submitted.productName}</dd></div><div><dt>가격</dt><dd>{money(submitted.price)}</dd></div><div><dt>여유자금</dt><dd>{money(submitted.disposableIncome)}</dd></div><div><dt>현재 제품</dt><dd>{purchaseLabels.currentProductStatus[submitted.currentProductStatus]}</dd></div><div><dt>사용 빈도</dt><dd>{purchaseLabels.usageFrequency[submitted.usageFrequency]}</dd></div><div><dt>필요도</dt><dd>{purchaseLabels.necessity[submitted.necessity]}</dd></div></dl></div>}
        <button className="secondary-button" onClick={() => document.getElementById("productName")?.focus()} type="button">조건을 바꿔 다시 보기</button>
      </section>}
    </div>
  </div>;
}
