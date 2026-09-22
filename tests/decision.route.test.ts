import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { createDecisionPost } from "../app/api/decision/route";
import { JevError } from "../lib/jev.server";

const validInput = {
  productName: "노트북",
  price: 1_000_000,
  disposableIncome: 500_000,
  currentProductStatus: "old",
  usageFrequency: "daily",
  necessity: "high",
};

function request(body: unknown): Request {
  return new Request("http://localhost/api/decision", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/decision", () => {
  it("rejects malformed JSON before calling the provider", async () => {
    const decide = vi.fn();
    const post = createDecisionPost(decide);
    const response = await post(
      new Request("http://localhost/api/decision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{",
      }),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: { code: "INVALID_JSON", message: "요청 형식이 올바르지 않습니다." } });
    expect(decide).not.toHaveBeenCalled();
  });

  it("validates input before calling the provider", async () => {
    const decide = vi.fn();
    const response = await createDecisionPost(decide)(request({ ...validInput, price: 0 }));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: { code: "INVALID_INPUT", message: "입력값을 확인해 주세요." } });
    expect(decide).not.toHaveBeenCalled();
  });

  it("returns a validated decision without caching", async () => {
    const decide = vi.fn().mockResolvedValue({
      decision: "WAIT",
      confidence: 0.45,
      probabilities: { BUY: 0.2, WAIT: 0.5, SKIP: 0.3 },
    });
    const response = await createDecisionPost(decide)(request(validInput));

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(await response.json()).toEqual(await decide.mock.results[0].value);
  });

  it.each([
    ["configuration", 503, "SERVICE_UNAVAILABLE"],
    ["timeout", 504, "UPSTREAM_TIMEOUT"],
    ["provider_auth", 503, "SERVICE_UNAVAILABLE"],
    ["provider_rate_limit", 503, "SERVICE_BUSY"],
    ["provider_failure", 502, "UPSTREAM_FAILURE"],
    ["invalid_response", 502, "INVALID_UPSTREAM_RESPONSE"],
  ] as const)("maps %s to a safe response", async (code, status, responseCode) => {
    const response = await createDecisionPost(async () => {
      throw new JevError(code);
    })(request(validInput));

    expect(response.status).toBe(status);
    expect((await response.json()).error.code).toBe(responseCode);
  });
});
