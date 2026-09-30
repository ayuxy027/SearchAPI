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

