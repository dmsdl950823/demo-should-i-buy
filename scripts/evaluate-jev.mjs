import { readFile } from "node:fs/promises";
import { setTimeout as delay } from "node:timers/promises";

const fixture = JSON.parse(await readFile(new URL("../qa/evaluation-cases.json", import.meta.url), "utf8"));
const endpoint = "http://localhost:3026/api/decision";
const validChoices = ["BUY", "WAIT", "SKIP"];

function validDecision(value) {
  if (!value || typeof value !== "object" || !validChoices.includes(value.decision)) return false;
  if (!Number.isFinite(value.confidence) || value.confidence < 0 || value.confidence > 1) return false;
  if (!value.probabilities || typeof value.probabilities !== "object") return false;
  const probabilities = validChoices.map((choice) => value.probabilities[choice]);
  return probabilities.every((number) => Number.isFinite(number) && number >= 0 && number <= 1)
    && Math.abs(probabilities.reduce((sum, number) => sum + number, 0) - 1) <= 0.02 + Number.EPSILON;
}

const runs = [...fixture.cases, ...fixture.repeatIds.map((id) => {
  const original = fixture.cases.find((item) => item.id === id);
  if (!original) throw new Error(`Unknown repeat ID: ${id}`);
  return { ...original, repeat: true };
})];

const results = [];
for (const item of runs) {
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item.input),
      cache: "no-store",
      signal: AbortSignal.timeout(25_000),
    });
    if (!response.ok) {
      results.push({ id: item.id, repeat: Boolean(item.repeat), ok: false, status: response.status });
    } else {
      const value = await response.json();
      results.push(validDecision(value)
        ? { id: item.id, repeat: Boolean(item.repeat), ok: true, allowed: item.allowed, ...value }
        : { id: item.id, repeat: Boolean(item.repeat), ok: false, status: "invalid_response" });
    }
  } catch {
    results.push({ id: item.id, repeat: Boolean(item.repeat), ok: false, status: "network_or_timeout" });
  }
  await delay(500);
}

process.stdout.write(`${JSON.stringify({ evaluatedAt: new Date().toISOString(), endpoint: "local Next route", results }, null, 2)}\n`);
if (results.some((item) => !item.ok)) process.exitCode = 1;
