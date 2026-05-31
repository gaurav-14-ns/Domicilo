import { describe, it, expect } from "vitest";
import {
  SUPPORTED_CURRENCIES,
  formatMoney,
  localeForCurrency,
  planPriceIn,
} from "../lib/currency";

describe("currency", () => {
  it("SUPPORTED_CURRENCIES contains INR", () => {
    const inr = SUPPORTED_CURRENCIES.find((c) => c.code === "INR");
    expect(inr).toBeDefined();
    expect(inr?.symbol).toBe("₹");
  });

  it("formatMoney formats INR correctly", () => {
    const result = formatMoney(150000, "INR", "en-IN");
    expect(result).toContain("₹");
    expect(result).toContain("1,50,000");
  });

  it("localeForCurrency returns correct locale", () => {
    expect(localeForCurrency("INR")).toBe("en-IN");
    expect(localeForCurrency("USD")).toBe("en-US");
  });

  it("planPriceIn returns a string for starter", () => {
    const price = planPriceIn("starter", "INR", "en-IN");
    expect(typeof price).toBe("string");
    expect(price.length).toBeGreaterThan(0);
  });
});
