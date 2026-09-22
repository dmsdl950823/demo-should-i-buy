import type { PurchaseContext } from "./purchase";

export interface PurchasePreset {
  id: string;
  label: string;
  input: PurchaseContext;
}

export const purchasePresets: readonly PurchasePreset[] = [
  {
    id: "airpods",
    label: "에어팟",
    input: {
      productName: "무선 이어폰",
      price: 349_000,
      disposableIncome: 500_000,
      currentProductStatus: "working",
      usageFrequency: "daily",
      necessity: "medium",
    },
  },
  {
    id: "laptop",
    label: "노트북",
    input: {
      productName: "노트북",
      price: 1_690_000,
      disposableIncome: 900_000,
      currentProductStatus: "old",
      usageFrequency: "daily",
      necessity: "high",
    },
  },
  {
    id: "smartphone",
    label: "스마트폰",
    input: {
      productName: "스마트폰",
      price: 1_250_000,
      disposableIncome: 700_000,
      currentProductStatus: "working",
      usageFrequency: "daily",
      necessity: "medium",
    },
  },
  {
    id: "sneakers",
    label: "운동화",
    input: {
      productName: "러닝화",
      price: 189_000,
      disposableIncome: 300_000,
      currentProductStatus: "working",
      usageFrequency: "sometimes",
      necessity: "low",
    },
  },
  {
    id: "robot-vacuum",
    label: "로봇청소기",
    input: {
      productName: "로봇청소기",
      price: 649_000,
      disposableIncome: 800_000,
      currentProductStatus: "none",
      usageFrequency: "often",
      necessity: "medium",
    },
  },
];
