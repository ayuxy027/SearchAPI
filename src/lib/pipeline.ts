import { analyzePerson } from "./analyze";
import { scrapePersonRaw } from "./scrape";
import type { Person } from "./types";

export const slugify = (s: string) =>
  s.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "person";

export async function createPersonWithRaw(linkedinUrl: string, instagramUrl: string, onAnalyze?: () => void) {
  const { sources, raw } = await scrapePersonRaw(linkedinUrl, instagramUrl);
  const { linkedin: li, instagram: ig } = sources;
  if (!li.ok || !ig.ok) {
    throw new Error(
      `Scrape failed upfront: linkedin=${li.ok ? "ok" : li.error ?? "failed"} instagram=${ig.ok ? "ok" : ig.error ?? "failed"}`,
    );
  }
  const name = li.name || ig.fullName || ig.username || linkedinUrl.split("/in/")[1]?.split("/")[0] || "Unknown";
  const person: Person = {
    id: slugify(name),
    name,
    photo: ig.photo || li.photo,
    headline: li.headline,
    linkedinUrl,
    instagramUrl,
    sources,
    analysis: null,
  };
  onAnalyze?.();
  person.analysis = await analyzePerson(sources);
  return { person, raw };
}

export async function createPerson(linkedinUrl: string, instagramUrl: string): Promise<Person> {
  return (await createPersonWithRaw(linkedinUrl, instagramUrl)).person;
}
