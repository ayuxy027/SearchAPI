import { expect, it } from "vitest";
import { samePerson } from "@/lib/pipeline";

it("accepts matching LinkedIn and Instagram identities and rejects mismatches", () => {
  expect(samePerson("Bill Gates", "Bill Gates", "thisisbillgates")).toBe(true);
  expect(samePerson("Gary Vaynerchuk", undefined, "garyvee")).toBe(true);
  expect(samePerson("Daymond John", "", "thesharkdaymond")).toBe(true);
  expect(samePerson("José Álvarez", "Jose Alvarez", "jalv")).toBe(true);
  expect(samePerson("Bill Gates", "Gary Vaynerchuk", "garyvee")).toBe(false);
  expect(samePerson(undefined, "Anyone", "anyone")).toBe(true);
});

it("cleans decorated LinkedIn names", async () => {
  const { cleanName } = await import("@/lib/pipeline");
  expect(cleanName("Marie Forleo • Entrepreneur")).toBe("Marie Forleo");
  expect(cleanName("Sundar  Pichai")).toBe("Sundar Pichai");
  expect(cleanName("Alexis Ohanian Sr.")).toBe("Alexis Ohanian");
  expect(cleanName("Bozoma Saint John-Watson")).toBe("Bozoma Saint John-Watson");
});
