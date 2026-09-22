export const purchaseDecisions = ["BUY", "WAIT", "SKIP"] as const;
export const currentProductStatuses = ["none", "broken", "old", "working"] as const;
export const usageFrequencies = ["rarely", "sometimes", "often", "daily"] as const;
export const necessityLevels = ["low", "medium", "high"] as const;

export type PurchaseDecisionValue = (typeof purchaseDecisions)[number];
export type CurrentProductStatus = (typeof currentProductStatuses)[number];
export type UsageFrequency = (typeof usageFrequencies)[number];
export type Necessity = (typeof necessityLevels)[number];

export interface PurchaseContext {
  productName: string;
  price: number;
  disposableIncome: number;
  currentProductStatus: CurrentProductStatus;
  usageFrequency: UsageFrequency;
  necessity: Necessity;
}

export type PurchaseProbabilities = Record<PurchaseDecisionValue, number>;

export interface PurchaseDecision {
  decision: PurchaseDecisionValue;
  confidence: number;
  probabilities: PurchaseProbabilities;
}

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; issues: string[] };

export const purchaseLabels = {
  decision: {
    BUY: "구매 고려",
    WAIT: "기다려 보기",
    SKIP: "구매 보류",
  },
  currentProductStatus: {
    none: "없음",
    broken: "고장 남",
    old: "오래됨",
    working: "문제없이 사용 중",
  },
  usageFrequency: {
    rarely: "거의 사용하지 않음",
    sometimes: "가끔 사용",
    often: "자주 사용",
    daily: "매일 사용",
  },
  necessity: {
    low: "낮음",
    medium: "보통",
    high: "높음",
  },
} as const;

export const decisionMeanings = {
  BUY: "현재 조건에서 구매를 고려할 수 있습니다.",
  WAIT: "시기나 예산을 조정한 뒤 다시 검토해 보세요.",
  SKIP: "현재 필요성과 활용도를 고려하면 구매를 보류해 보세요.",
} as const;

const MAX_MONEY = 1_000_000_000;
const PRODUCT_NAME_MAX_LENGTH = 100;
const PROBABILITY_SUM_TOLERANCE = 0.02;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isOneOf<T extends readonly string[]>(value: unknown, values: T): value is T[number] {
  return typeof value === "string" && values.includes(value as T[number]);
}

function isIntegerInRange(value: unknown, minimum: number, maximum: number): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    Number.isInteger(value) &&
    value >= minimum &&
    value <= maximum
  );
}

function isUnitInterval(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1;
}

export function validatePurchaseContext(value: unknown): ValidationResult<PurchaseContext> {
  if (!isRecord(value)) {
    return { success: false, issues: ["입력값은 객체여야 합니다."] };
  }

  const issues: string[] = [];
  const productName = typeof value.productName === "string" ? value.productName.trim() : "";

  if (productName.length < 1 || productName.length > PRODUCT_NAME_MAX_LENGTH) {
    issues.push("productName은 공백 제거 후 1~100자여야 합니다.");
  }
  if (!isIntegerInRange(value.price, 1, MAX_MONEY)) {
    issues.push("price는 1~1,000,000,000 범위의 정수여야 합니다.");
  }
  if (!isIntegerInRange(value.disposableIncome, 0, MAX_MONEY)) {
    issues.push("disposableIncome은 0~1,000,000,000 범위의 정수여야 합니다.");
  }
  if (!isOneOf(value.currentProductStatus, currentProductStatuses)) {
    issues.push("currentProductStatus 값이 올바르지 않습니다.");
  }
  if (!isOneOf(value.usageFrequency, usageFrequencies)) {
    issues.push("usageFrequency 값이 올바르지 않습니다.");
  }
  if (!isOneOf(value.necessity, necessityLevels)) {
    issues.push("necessity 값이 올바르지 않습니다.");
  }

  if (issues.length > 0) {
    return { success: false, issues };
  }

  return {
    success: true,
    data: {
      productName,
      price: value.price as number,
      disposableIncome: value.disposableIncome as number,
      currentProductStatus: value.currentProductStatus as CurrentProductStatus,
      usageFrequency: value.usageFrequency as UsageFrequency,
      necessity: value.necessity as Necessity,
    },
  };
}

export function validatePurchaseDecision(value: unknown): ValidationResult<PurchaseDecision> {
  if (!isRecord(value)) {
    return { success: false, issues: ["응답값은 객체여야 합니다."] };
  }

  const issues: string[] = [];
  if (!isOneOf(value.decision, purchaseDecisions)) {
    issues.push("decision 값이 올바르지 않습니다.");
  }
  if (!isUnitInterval(value.confidence)) {
    issues.push("confidence는 0~1 범위의 유한한 숫자여야 합니다.");
  }

  const probabilities = value.probabilities;
  if (!isRecord(probabilities)) {
    issues.push("probabilities는 BUY, WAIT, SKIP 값을 가진 객체여야 합니다.");
  } else {
    for (const decision of purchaseDecisions) {
      if (!isUnitInterval(probabilities[decision])) {
        issues.push(`probabilities.${decision}은 0~1 범위의 유한한 숫자여야 합니다.`);
      }
    }

    if (issues.length === 0) {
      const total = purchaseDecisions.reduce((sum, decision) => sum + (probabilities[decision] as number), 0);
      if (Math.abs(total - 1) > PROBABILITY_SUM_TOLERANCE + Number.EPSILON) {
        issues.push("probabilities의 합계는 1에서 0.02 이내여야 합니다.");
      }
    }
  }

  if (issues.length > 0) {
    return { success: false, issues };
  }

  const validProbabilities = value.probabilities as PurchaseProbabilities;
  return {
    success: true,
    data: {
      decision: value.decision as PurchaseDecisionValue,
      confidence: value.confidence as number,
      probabilities: {
        BUY: validProbabilities.BUY,
        WAIT: validProbabilities.WAIT,
        SKIP: validProbabilities.SKIP,
      },
    },
  };
}
