import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { decidePurchase } from "../lib/jev.server";

const context = {
  productName: "노트북",
  price: 1_000_000,
  disposableIncome: 500_000,
  currentProductStatus: "old" as const,
  usageFrequency: "daily" as const,
  necessity: "high" as const,
};

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("decidePurchase", () => {
  it("does not call the provider when the server key is missing", async () => {
    vi.stubEnv("AI_GATEWAY_API_KEY", "");
    const request = vi.fn();

    await expect(decidePurchase(context, request)).rejects.toMatchObject({ code: "configuration" });
    expect(request).not.toHaveBeenCalled();
  });

  it("uses the fixed Gateway configuration and preserves the validated provider result", async () => {
    vi.stubEnv("AI_GATEWAY_API_KEY", "test-key");
    const request = vi.fn().mockResolvedValue(
      Response.json({
        answers: {
          purchase: {
            type: "choice",
            choice: "SKIP",
            confidence: 0.62,
            probabilities: { BUY: 0.01, WAIT: 0.25, SKIP: 0.74 },
          },
        },
      }),
    );

    await expect(decidePurchase(context, request)).resolves.toEqual({
      decision: "SKIP",
      confidence: 0.62,
      probabilities: { BUY: 0.01, WAIT: 0.25, SKIP: 0.74 },
    });
    expect(request).toHaveBeenCalledWith(
      "https://ai-gateway.vercel.sh/typesafe/v1/systemone",
      expect.objectContaining({ method: "POST", cache: "no-store" }),
    );
    expect(JSON.parse(request.mock.calls[0][1].body)).toMatchObject({
      model: "typesafe-ai/jev",
      state: JSON.stringify({ ...context, currency: "KRW" }),
    });
    expect(request.mock.calls[0][1].body).not.toContain("test-key");
  });

  it.each([
    [401, "provider_auth"],
    [403, "provider_auth"],
    [429, "provider_rate_limit"],
    [500, "provider_failure"],
  ])("maps provider status %s safely", async (status, code) => {
    vi.stubEnv("AI_GATEWAY_API_KEY", "test-key");

    await expect(decidePurchase(context, vi.fn().mockResolvedValue(new Response(null, { status })))).rejects.toMatchObject({
      code,
    });
  });

  it("aborts the provider request after 20 seconds and reports a timeout", async () => {
    vi.stubEnv("AI_GATEWAY_API_KEY", "test-key");
    vi.useFakeTimers();

    try {
      const request = vi.fn((_input: RequestInfo | URL, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
        }),
      );
      const result = decidePurchase(context, request as unknown as typeof fetch);
      const timeoutExpectation = expect(result).rejects.toMatchObject({ code: "timeout" });

      await vi.advanceTimersByTimeAsync(20_000);

      await timeoutExpectation;
      expect(request.mock.calls[0]?.[1]?.signal?.aborted).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it("rejects an invalid provider distribution", async () => {
    vi.stubEnv("AI_GATEWAY_API_KEY", "test-key");
    const response = () =>
      Response.json({
        answers: {
          purchase: { type: "choice", choice: "BUY", confidence: 0.5, probabilities: { BUY: 0.8, WAIT: 0.8, SKIP: 0 } },
        },
      });

    await expect(decidePurchase(context, vi.fn().mockResolvedValue(response()))).rejects.toMatchObject({
      code: "invalid_response",
    });
  });

  it("rejects a response whose purchase answer is not a choice", async () => {
    vi.stubEnv("AI_GATEWAY_API_KEY", "test-key");
    const response = Response.json({
      answers: { purchase: { type: "text", choice: "BUY", confidence: 0.5, probabilities: { BUY: 1, WAIT: 0, SKIP: 0 } } },
    });

    await expect(decidePurchase(context, vi.fn().mockResolvedValue(response))).rejects.toMatchObject({
      code: "invalid_response",
    });
  });
});
