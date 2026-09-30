import { cached } from "./cache";
import type { SourceData } from "./types";

const linkedinInput = (url: string) => ({ username: new URL(url).pathname.split("/")[2] });
const instagramInput = (handle: string) => ({ usernames: [handle] });

const DEFAULT_ACTORS: Record<string, string> = { APIFY_LINKEDIN_ACTOR: "apimaestro~linkedin-profile-detail", APIFY_INSTAGRAM_ACTOR: "apify~instagram-profile-scraper" };

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

let balance: { at: number; left: number } | undefined;

async function assertBudget(token: string) {
  const floor = Number(process.env.APIFY_MIN_BALANCE_USD ?? 4);
  if (!balance || Date.now() - balance.at > 60_000) {
    const res = await fetch("https://api.apify.com/v2/users/me/limits", { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(15_000) });
    if (!res.ok) throw new Error(`Apify balance check failed: ${res.status}`);
    const { data } = await res.json();
    balance = { at: Date.now(), left: data.limits.maxMonthlyUsageUsd - data.current.monthlyUsageUsd };
  }
  if (balance.left < floor) throw new Error(`Apify budget guard: $${balance.left.toFixed(2)} left, floor is $${floor}. Scraping paused to protect the balance.`);
}

async function callActor(actorEnv: string, input: object): Promise<Raw> {
  const token = process.env.APIFY_TOKEN;
  const actor = process.env[actorEnv] || DEFAULT_ACTORS[actorEnv];
  if (!token) throw new Error("APIFY_TOKEN is not set");
  await assertBudget(token);
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
  const b: Raw = r.basic_info ?? r;
  const exps: Raw[] = r.experiences ?? r.experience ?? r.positions ?? [];
  const edus: Raw[] = r.educations ?? r.education ?? [];
  const loc = b.addressWithCountry ?? b.location ?? b.geoLocationName;
  return {
    name: str(b.fullname) ?? str(b.fullName) ?? (clean([b.first_name ?? b.firstName, b.last_name ?? b.lastName], " ") || undefined),
    headline: str(b.headline) ?? str(b.occupation),
    location: typeof loc === "string" ? str(loc) : str(loc?.full ?? loc?.default ?? loc?.linkedinText ?? loc?.city),
    about: str(b.about) ?? str(b.summary),
    photo: str(b.profile_picture_url) ?? str(b.profilePicHighQuality) ?? str(b.profilePic) ?? str(b.photo),
    experience: (Array.isArray(exps) ? exps : [])
      .map((e) => {
        const title = str(e.title) ?? str(e.position);
        const company = str(e.companyName) ?? str(e.company?.name ?? e.company) ?? str(e.subtitle);
        const dates = str(e.caption) ?? str(e.dates) ?? str(e.duration) ?? str(e.timePeriod) ?? clean([e.startDate?.text ?? e.startDate, e.endDate?.text ?? e.endDate], " - ");
        return clean([title, company && `@ ${company}`, dates && `(${dates})`], " ");
      })
      .filter(Boolean),
    education: (Array.isArray(edus) ? edus : [])
      .map((e) => clean([e.school ?? e.title ?? e.schoolName, e.degree_name ?? e.degree ?? e.subtitle ?? e.degreeName, e.field_of_study, e.duration ?? e.caption ?? e.dates], ", "))
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
