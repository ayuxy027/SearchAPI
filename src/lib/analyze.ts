import { chatJSON } from "./llm";
import type { Analysis, SourceData } from "./types";

const SYSTEM = `You are this person's dating agent. You will represent them on dates with other people's agents.
Build their dating profile using ONLY the LinkedIn and Instagram data provided. Do not use outside knowledge about them.

Rules:
- Every signal has "kind": "observed" (directly stated/shown in the data) or "inferred" (your reasonable reading), and "source": "linkedin" | "instagram" (where the evidence comes from).
- Never present guesses as facts. Inferred signals should be phrased tentatively ("likely", "seems to").
- 3-6 items per category. If evidence is thin, give fewer items and prefer "inferred" over inventing.
- "needs" = what they'd likely need or want in a partner. "constraints" = location, schedule, lifestyle limits, likely dealbreakers.
- "summary": 2-4 sentences, written as their agent introducing them.

Return JSON exactly:
{"summary": string,
 "interests": Signal[], "hobbies": Signal[], "lifestyle": Signal[],
 "needs": Signal[], "personality": Signal[], "constraints": Signal[]}
where Signal = {"text": string, "kind": "observed"|"inferred", "source": "linkedin"|"instagram"}`;

export function compactSources(s: SourceData) {
  const { linkedin: li, instagram: ig } = s;
  return {
    linkedin: {
      name: li.name,
      headline: li.headline,
      location: li.location,
      about: li.about?.slice(0, 1500),
      experience: li.experience?.slice(0, 8),
      education: li.education?.slice(0, 4),
    },
    instagram: {
      username: ig.username,
      fullName: ig.fullName,
      bio: ig.bio,
      followers: ig.followers,
      posts: ig.posts?.slice(0, 12).map((p) => ({
        caption: p.caption.slice(0, 300),
        hashtags: p.hashtags.slice(0, 10),
        location: p.location,
      })),
    },
  };
}

export async function analyzePerson(sources: SourceData): Promise<Analysis> {
  const a = await chatJSON<Analysis>(SYSTEM, JSON.stringify(compactSources(sources)));
  const list = (x: unknown) => (Array.isArray(x) ? x : []);
  return {
    summary: String(a.summary ?? ""),
    interests: list(a.interests),
    hobbies: list(a.hobbies),
    lifestyle: list(a.lifestyle),
    needs: list(a.needs),
    personality: list(a.personality),
    constraints: list(a.constraints),
  };
}
