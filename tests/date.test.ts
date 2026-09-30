import { afterEach, expect, it, vi } from "vitest";
import { person } from "./fixtures";

afterEach(() => vi.resetModules());

it("runs a two-sided date and sanitizes the model's verdict", async () => {
  vi.doMock("@/lib/llm", () => ({
    chatJSON: vi
      .fn()
      .mockResolvedValueOnce({ aConsidersB: "A likes B", bConsidersA: "B unsure" })
      .mockResolvedValueOnce({
        transcript: [{ speaker: "a", text: "Hi" }, { speaker: "x", text: "bad" }, { speaker: "b", text: 42 }, { speaker: "a", text: "Ok" }],
        verdict: { score: 140, aScore: "70", bScore: -5, sharedInterests: ["Running"], summary: "ok" },
      }),
  }));
  const { runDate } = await import("@/lib/date");
  const d = await runDate(person("a", "A", "", ["Running"]), person("b", "B", "", ["Running"]));
  expect(d.aConsidersB).toBe("A likes B");
  expect(d.transcript).toEqual([{ speaker: "a", text: "Hi" }, { speaker: "b", text: "42" }, { speaker: "a", text: "Ok" }]);
  expect(d.verdict).toMatchObject({ score: 100, aScore: 70, bScore: 0, sharedInterests: ["Running"], concerns: [] });
  const noAnalysis = { ...person("c", "C", "", []), analysis: null };
  vi.mocked((await import("@/lib/llm")).chatJSON)
    .mockResolvedValueOnce({ aConsidersB: "x", bConsidersA: "y" })
    .mockResolvedValueOnce({ transcript: [], verdict: {} });
  await expect(runDate(person("a", "A", "", []), person("b", "B", "", []))).rejects.toThrow("incomplete");
  await expect(runDate(noAnalysis, person("b", "B", "", []))).rejects.toThrow();
});
