const formatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const formatterCompact = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 1,
  notation: "compact",
});

export function formatMoney(amount: number): string {
  return formatter.format(Math.round(amount || 0));
}

export function formatMoneyCompact(amount: number): string {
  return formatterCompact.format(amount || 0);
}

export const PLAN_PRICES_INR = {
  starter: 999,
  growth: 2999,
  scale: 0,
} as const;

export type PlanId = keyof typeof PLAN_PRICES_INR;
