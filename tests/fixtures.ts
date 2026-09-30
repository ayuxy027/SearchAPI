import type { DateResult, Person, Signal } from "@/lib/types";

const sig = (text: string): Signal => ({ text, kind: "observed", source: "instagram" });

export const person = (id: string, name: string, headline: string, interests: string[]): Person => ({
  id,
  name,
  headline,
  linkedinUrl: `https://www.linkedin.com/in/${id}`,
  instagramUrl: `https://www.instagram.com/${id}`,
  sources: { linkedin: { url: "", ok: true }, instagram: { url: "", ok: true } },
  analysis: { summary: "", interests: interests.map(sig), hobbies: [], lifestyle: [], needs: [], personality: [], constraints: [] },
});

export const date = (a: string, b: string, score: number): DateResult => ({
  a,
  b,
  aConsidersB: "",
  bConsidersA: "",
  transcript: [],
  verdict: { score, aScore: score, bScore: score, sharedInterests: [], complementaryTraits: [], concerns: [], summary: `${a}-${b}` },
});
