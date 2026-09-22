import { describe, expect, it } from "vitest";
import { purchasePresets } from "../lib/presets";
import { validatePurchaseContext, validatePurchaseDecision } from "../lib/purchase";

const validContext = {
  productName: "  노트북  ",
  price: 1,
  disposableIncome: 0,
  currentProductStatus: "none",
  usageFrequency: "rarely",
  necessity: "low",
};

const validDecision = {
  decision: "SKIP",
  confidence: 0.62,
  probabilities: { BUY: 0.01, WAIT: 0.25, SKIP: 0.74 },
};

describe("validatePurchaseContext", () => {
  it("trims product names and accepts the documented numeric boundaries", () => {
    const result = validatePurchaseContext({
      ...validContext,
      productName: "  가 ",
      price: 1_000_000_000,
      disposableIncome: 1_000_000_000,
      currentProductStatus: "working",
      usageFrequency: "daily",
      necessity: "high",
    });

    expect(result).toEqual({
      success: true,
      data: {
        productName: "가",
        price: 1_000_000_000,
        disposableIncome: 1_000_000_000,
        currentProductStatus: "working",
        usageFrequency: "daily",
        necessity: "high",
      },
    });
  });

  const invalidContexts: unknown[] = [
    null,
    {},
    { ...validContext, productName: 123 },
    { ...validContext, productName: "   " },
    { ...validContext, productName: "가".repeat(101) },
    { ...validContext, price: 0 },
    { ...validContext, price: -1 },
    { ...validContext, price: 1.5 },
    { ...validContext, price: 1_000_000_001 },
    { ...validContext, disposableIncome: -1 },
    { ...validContext, disposableIncome: 1.5 },
    { ...validContext, disposableIncome: 1_000_000_001 },
    { ...validContext, currentProductStatus: "new" },
    { ...validContext, usageFrequency: "hourly" },
    { ...validContext, necessity: "urgent" },
    { ...validContext, price: "1" },
    { ...validContext, disposableIncome: null },
  ];

  it.each(invalidContexts)("rejects invalid input: %#", (input) => {
    expect(validatePurchaseContext(input).success).toBe(false);
  });

  it("validates every input-only preset", () => {
    expect(purchasePresets).toHaveLength(5);
    for (const preset of purchasePresets) {
      expect(validatePurchaseContext(preset.input).success).toBe(true);
      expect(preset).not.toHaveProperty("decision");
      expect(preset).not.toHaveProperty("confidence");
      expect(preset).not.toHaveProperty("probabilities");
    }
  });
});

describe("validatePurchaseDecision", () => {
  it("preserves separate confidence and probabilities without normalization", () => {
    const result = validatePurchaseDecision(validDecision);

    expect(result).toEqual({ success: true, data: validDecision });
  });

  const acceptedOutputs: unknown[] = [
    { ...validDecision, confidence: 0 },
    { ...validDecision, confidence: 1 },
    { ...validDecision, probabilities: { BUY: 1, WAIT: 0, SKIP: 0 } },
    { ...validDecision, probabilities: { BUY: 0.51, WAIT: 0.51, SKIP: 0 } },
  ];

  it.each(acceptedOutputs)("accepts valid output boundaries: %#", (output) => {
    expect(validatePurchaseDecision(output).success).toBe(true);
  });

  const invalidOutputs: unknown[] = [
    { ...validDecision, decision: "MAYBE" },
    { ...validDecision, confidence: Number.NaN },
    { ...validDecision, confidence: Number.POSITIVE_INFINITY },
    { ...validDecision, confidence: -0.01 },
    { ...validDecision, confidence: 1.01 },
    { ...validDecision, probabilities: undefined },
    { ...validDecision, probabilities: null },
    { ...validDecision, probabilities: { BUY: 0.5, WAIT: 0.5 } },
    { ...validDecision, probabilities: { BUY: Number.NaN, WAIT: 0.5, SKIP: 0.5 } },
    { ...validDecision, probabilities: { BUY: Number.POSITIVE_INFINITY, WAIT: 0.5, SKIP: 0.5 } },
    { ...validDecision, probabilities: { BUY: -0.01, WAIT: 0.5, SKIP: 0.51 } },
    { ...validDecision, probabilities: { BUY: 1.01, WAIT: 0, SKIP: 0 } },
    { ...validDecision, probabilities: { BUY: 0.5, WAIT: 0.5, SKIP: 0.03 } },
  ];

  it.each(invalidOutputs)("rejects invalid output: %#", (output) => {
    expect(validatePurchaseDecision(output).success).toBe(false);
  });
});
