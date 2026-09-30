import { expect, it } from "vitest";
import { rankFor } from "@/lib/rank";
import { date } from "./fixtures";

it("ranks only the person's own dates by score, from either side of the pair", () => {
  const r = rankFor("x", [date("x", "y", 40), date("z", "x", 90), date("y", "z", 99)]);
  expect(r.map((e) => [e.candidate, e.score])).toEqual([["z", 90], ["y", 40]]);
  expect(r[0].summary).toBe("z-x");
});
