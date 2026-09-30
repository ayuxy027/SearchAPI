import { cached } from "./cache";
import type { SourceData } from "./types";

const linkedinInput = (url: string) => ({ profileUrls: [url], urls: [url], queries: [url] });
const instagramInput = (handle: string) => ({ usernames: [handle] });

const DEFAULT_ACTORS: Record<string, string> = { APIFY_LINKEDIN_ACTOR: "dev_fusion~linkedin-profile-scraper", APIFY_INSTAGRAM_ACTOR: "apify~instagram-profile-scraper" };

type Raw = any;

export type ScrapeResult = { sources: SourceData; raw: { linkedin: Raw; instagram: Raw } };

export function instagramHandle(url: string): string | null {
  try {
    const u = new URL(url);
    if (!/(^|\.)instagram\.com$/.test(u.hostname)) return null;
    const handle = u.pathname.split("/").filter(Boolean)[0];
    return handle && !["p", "reel", "stories", "explore"].includes(handle) ? handle : null;
  } catch {
    return null;
  }
}

export function isLinkedinProfile(url: string): boolean {
  try {
    const u = new URL(url);
    return /(^|\.)linkedin\.com$/.test(u.hostname) && /^\/in\/[^/]+/.test(u.pathname);
  } catch {
    return false;
  }
}

const runActor = (actorEnv: string, input: object): Promise<Raw> =>
  cached("apify", [process.env[actorEnv] || DEFAULT_ACTORS[actorEnv], input], () => callActor(actorEnv, input));

async function callActor(actorEnv: string, input: object): Promise<Raw> {
  const token = process.env.APIFY_TOKEN;
  const actor = process.env[actorEnv] || DEFAULT_ACTORS[actorEnv];
  if (!token) throw new Error("APIFY_TOKEN is not set");
  const res = await fetch(
    `https://api.apify.com/v2/acts/${actor}/run-sync-get-dataset-items?timeout=120&memory=1024`,
    { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(input), signal: AbortSignal.timeout(150_000) },
  );
  if (!res.ok) throw new Error(`Apify ${actor} ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const items = await res.json();
  const item = Array.isArray(items) ? items[0] : items;
  if (!item) throw new Error(`Apify ${actor} returned no items`);
  if (item.error || item.errorDescription) throw new Error(`Apify ${actor}: ${item.errorDescription || item.error}`);
  return item;
}

const str = (v: unknown): string | undefined => (typeof v === "string" && v.trim() ? v.trim() : undefined);
const clean = (parts: unknown[], sep: string) => parts.map(str).filter(Boolean).join(sep);

function mapLinkedin(r: Raw): Omit<SourceData["linkedin"], "url" | "ok"> {
  const exps: Raw[] = r.experiences ?? r.experience ?? r.positions ?? [];
  const edus: Raw[] = r.educations ?? r.education ?? [];
  const loc = r.addressWithCountry ?? r.location ?? r.geoLocationName ?? r.addressWithoutCountry;
  return {
    name: str(r.fullName) ?? (clean([r.firstName, r.lastName], " ") || undefined),
    headline: str(r.headline) ?? str(r.occupation),
    location: typeof loc === "string" ? str(loc) : str(loc?.default ?? loc?.linkedinText ?? loc?.city),
    about: str(r.about) ?? str(r.summary),
    photo: str(r.profilePicHighQuality) ?? str(r.profilePic) ?? str(r.profilePicture) ?? str(r.photo) ?? str(r.profilePictureUrl),
    experience: (Array.isArray(exps) ? exps : [])
      .map((e) => {
        const title = str(e.title) ?? str(e.position);
        const company = str(e.companyName) ?? str(e.company?.name ?? e.company) ?? str(e.subtitle);
        const dates = str(e.caption) ?? str(e.dates) ?? str(e.duration) ?? str(e.timePeriod) ?? clean([e.startDate?.text ?? e.startDate, e.endDate?.text ?? e.endDate], " - ");
        return clean([title, company && `@ ${company}`, dates && `(${dates})`], " ");
      })
      .filter(Boolean),
    education: (Array.isArray(edus) ? edus : [])
      .map((e) => clean([e.title ?? e.schoolName ?? e.school, e.subtitle ?? e.degreeName ?? e.degree, e.caption ?? e.dates], ", "))
      .filter(Boolean),
  };
}

function mapInstagram(r: Raw): Omit<SourceData["instagram"], "url" | "ok"> {
  const posts: Raw[] = r.latestPosts ?? r.posts ?? [];
  return {
    username: str(r.username),
    fullName: str(r.fullName),
    bio: str(r.biography) ?? str(r.bio),
    photo: str(r.profilePicUrlHD) ?? str(r.profilePicUrl),
    followers: typeof r.followersCount === "number" ? r.followersCount : undefined,
    posts: (Array.isArray(posts) ? posts : []).map((p) => ({
      caption: str(p.caption) ?? "",
      hashtags: Array.isArray(p.hashtags) ? p.hashtags : [],
      location: str(p.locationName),
    })),
  };
}

const errMsg = (e: unknown) => (e instanceof Error ? e.message : String(e));

export async function scrapePersonRaw(linkedinUrl: string, instagramUrl: string): Promise<ScrapeResult> {
  const handle = instagramHandle(instagramUrl);
  const [li, ig] = await Promise.allSettled([
    isLinkedinProfile(linkedinUrl)
      ? runActor("APIFY_LINKEDIN_ACTOR", linkedinInput(linkedinUrl))
      : Promise.reject(new Error("Not a LinkedIn profile URL (expected linkedin.com/in/...)")),
    handle
      ? runActor("APIFY_INSTAGRAM_ACTOR", instagramInput(handle))
      : Promise.reject(new Error("Not an Instagram profile URL (expected instagram.com/<handle>)")),
  ]);

  let igData: SourceData["instagram"] =
    ig.status === "fulfilled"
      ? { url: instagramUrl, ok: true, ...mapInstagram(ig.value) }
      : { url: instagramUrl, ok: false, error: errMsg(ig.reason) };
  if (igData.ok && ig.status === "fulfilled" && ig.value.private) {
    igData = { url: instagramUrl, ok: false, error: "Instagram profile is private" };
  }

  return {
    sources: {
      linkedin:
        li.status === "fulfilled"
          ? { url: linkedinUrl, ok: true, ...mapLinkedin(li.value) }
          : { url: linkedinUrl, ok: false, error: errMsg(li.reason) },
      instagram: igData,
    },
    raw: {
      linkedin: li.status === "fulfilled" ? li.value : null,
      instagram: ig.status === "fulfilled" ? ig.value : null,
    },
  };
}

export async function scrapePerson(linkedinUrl: string, instagramUrl: string): Promise<SourceData> {
  return (await scrapePersonRaw(linkedinUrl, instagramUrl)).sources;
}
