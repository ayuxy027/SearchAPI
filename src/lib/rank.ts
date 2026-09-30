import type { DateResult, RankingEntry } from "./types";

export function rankFor(personId: string, dates: DateResult[]): RankingEntry[] {
  return dates
    .filter((d) => d.a === personId || d.b === personId)
    .map((d) => ({
      candidate: d.a === personId ? d.b : d.a,
      score: d.verdict.score,
      summary: d.verdict.summary,
      sharedInterests: d.verdict.sharedInterests,
      complementaryTraits: d.verdict.complementaryTraits,
      concerns: d.verdict.concerns,
    }))
    .sort((x, y) => y.score - x.score);
}

if (process.argv[1]?.endsWith("rank.ts")) {
  const d = (a: string, b: string, score: number) =>
    ({ a, b, aConsidersB: "", bConsidersA: "", transcript: [], verdict: { score, aScore: 0, bScore: 0, sharedInterests: [], complementaryTraits: [], concerns: [], summary: "" } }) as DateResult;
  const r = rankFor("x", [d("x", "y", 40), d("z", "x", 90), d("y", "z", 99)]);
  console.assert(JSON.stringify(r.map((e) => [e.candidate, e.score])) === '[["z",90],["y",40]]', "rankFor failed", r);
  if (r.length !== 2 || r[0].candidate !== "z") process.exit(1);
  console.log("rank self-check ok");
}
