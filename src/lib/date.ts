import { chatJSON } from "./llm";
import type { DateResult, Person, Turn } from "./types";

const publicProfile = (p: Person) => ({ firstName: p.name.split(" ")[0], name: p.name, headline: p.headline, analysis: p.analysis });

const CONSIDER_SYSTEM = `You play two independent dating agents, A and B, each representing their own principal.
Each agent knows its own principal's profile and has read the other person's public profile.
Write each agent's honest pre-date consideration. The agent is NOT the person: it is an AI matchmaker speaking about its principal in the third person using the firstName given in the profiles (e.g. "For <A.firstName>, ..."), never "I" as the person. Only the two people in the profiles exist; never introduce anyone else:
what looks promising, what worries them, and what they intend to ask on the date. 3-5 sentences each. Be candid; do not assume a match.
Return JSON: {"aConsidersB": string, "bConsidersA": string}`;

const DATE_SYSTEM = `You simulate a date between two AI dating agents, A and B, each speaking on behalf of their own principal.
Each agent has already written a pre-date consideration (given). Now they talk.

Conversation (8-10 turns, alternating, starting with A):
- Agents are AI matchmakers, NOT the people. Every line refers to principals in the third person using their firstName from the profiles ("<A.firstName> hikes every weekend. Would <B.firstName> be up for early starts?"). Never write as the person ("I love...", "my company"). Only the two people in the profiles exist; never introduce anyone else.
- They ask each other real questions, surface needs, preferences, lifestyle and dealbreakers, and probe for mismatches honestly.
- Agents are loyal to their own principal, not trying to force a match. Only use what is in the profiles; don't invent facts.

Then a verdict:
- aScore: how much A's agent wants a second date for its principal (0-100). bScore: same for B.
- score: overall mutual compatibility (0-100). Be calibrated: most pairs are mediocre. Use the full range roughly 20-95; reserve 80+ for strong mutual fit, and go below 40 when needs/lifestyles clash.
- sharedInterests, complementaryTraits, concerns: short phrases (0-5 each). summary: 2-3 sentences explaining the score.

Return JSON: {"transcript": [{"speaker": "a"|"b", "text": string}],
 "verdict": {"score": number, "aScore": number, "bScore": number, "sharedInterests": string[], "complementaryTraits": string[], "concerns": string[], "summary": string}}`;

const clamp = (n: unknown) => Math.max(0, Math.min(100, Math.round(Number(n) || 0)));
const strs = (x: unknown) => (Array.isArray(x) ? x.map(String) : []);

export async function runDate(a: Person, b: Person): Promise<DateResult> {
  if (!a.analysis || !b.analysis) throw new Error(`Cannot date without analysis: ${!a.analysis ? a.id : b.id}`);
  const profiles = JSON.stringify({ A: publicProfile(a), B: publicProfile(b) });

  const consider = await chatJSON<{ aConsidersB: string; bConsidersA: string }>(CONSIDER_SYSTEM, profiles);

  const date = await chatJSON<{ transcript: Turn[]; verdict: DateResult["verdict"] }>(
    DATE_SYSTEM,
    JSON.stringify({ profiles: JSON.parse(profiles), aConsidersB: consider.aConsidersB, bConsidersA: consider.bConsidersA }),
  );
  const v = date.verdict ?? ({} as DateResult["verdict"]);

  return {
    a: a.id,
    b: b.id,
    aConsidersB: String(consider.aConsidersB ?? ""),
    bConsidersA: String(consider.bConsidersA ?? ""),
    transcript: (Array.isArray(date.transcript) ? date.transcript : [])
      .filter((t) => t && (t.speaker === "a" || t.speaker === "b"))
      .map((t) => ({ speaker: t.speaker, text: String(t.text) })),
    verdict: {
      score: clamp(v.score),
      aScore: clamp(v.aScore),
      bScore: clamp(v.bScore),
      sharedInterests: strs(v.sharedInterests),
      complementaryTraits: strs(v.complementaryTraits),
      concerns: strs(v.concerns),
      summary: String(v.summary ?? ""),
    },
  };
}
