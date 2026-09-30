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
