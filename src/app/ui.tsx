import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { ReplayThinking } from "./Thinking";
import type { DateResult, Person, RankingEntry, Signal } from "@/lib/types";
import type { PersonListItem, PersonLite } from "@/server/data";

export function Avatar({ p, size = 48 }: { p: { name: string; photo?: string }; size?: number }) {
  const initials = p.name.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div
      className="relative shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-rose-200 to-indigo-200 font-semibold text-zinc-700"
      style={{ width: size, height: size, fontSize: size / 2.8 }}
    >
      <span className="absolute inset-0 flex items-center justify-center">{initials}</span>
      {p.photo && <Image src={p.photo} alt="" fill sizes={`${size}px`} className="object-cover" />}
    </div>
  );
}

export function LinkedInIcon({ className = "h-3 w-3" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={`shrink-0 ${className}`} fill="#0A66C2">
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z" />
    </svg>
  );
}

export function InstagramIcon({ className = "h-3 w-3" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={`shrink-0 ${className}`} fill="none" stroke="#E1306C" strokeWidth="2.4">
      <rect x="2.2" y="2.2" width="19.6" height="19.6" rx="5.5" />
      <circle cx="12" cy="12" r="4.4" />
      <circle cx="17.6" cy="6.4" r="0.6" fill="#E1306C" />
    </svg>
  );
}

export function SourceLink({ kind, url, ok, error }: { kind: "linkedin" | "instagram"; url: string; ok?: boolean; error?: string }) {
  const li = kind === "linkedin";
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      title={error ?? url}
      className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium whitespace-nowrap text-zinc-700 transition-colors hover:border-zinc-400"
    >
      {li ? <LinkedInIcon className="h-3.5 w-3.5" /> : <InstagramIcon className="h-3.5 w-3.5" />}
      {li ? "LinkedIn" : "Instagram"}
      {ok !== undefined && (ok ? <span className="text-emerald-600">✓</span> : <span className="text-red-600">✗ failed</span>)}
    </a>
  );
}

export const idx = (i: number) => ({ "--i": i }) as CSSProperties;

export function PersonCard({ p, i = 0 }: { p: PersonListItem & { matched?: string[] }; i?: number }) {
  return (
    <div style={idx(i)} className="lift flex h-full flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 hover:border-zinc-300">
      <Link href={`/p/${p.id}`} className="flex min-w-0 items-center gap-3">
        <Avatar p={p} size={52} />
        <div className="min-w-0">
          <div className="truncate font-semibold">{p.name}</div>
          <div className="line-clamp-1 text-sm text-zinc-500">{p.headline || "\u00a0"}</div>
        </div>
      </Link>
      <div className="flex gap-1.5">
        <SourceLink kind="linkedin" url={p.linkedinUrl} ok={p.linkedinOk} />
        <SourceLink kind="instagram" url={p.instagramUrl} ok={p.instagramOk} />
      </div>
      {!!p.matched?.length && (
        <div className="flex min-w-0 gap-1.5 overflow-hidden">
          {p.matched.map((m) => (
            <span key={m} title={m} className="min-w-0 shrink truncate rounded-md bg-yellow-100 px-2 py-0.5 text-xs whitespace-nowrap text-yellow-900">{m}</span>
          ))}
        </div>
      )}
      {p.topMatch ? (
        <Link href={`/date/${p.id}/${p.topMatch.id}`} className="mt-auto flex min-w-0 items-center gap-2 rounded-lg bg-rose-50 px-3 py-2 text-sm transition-colors hover:bg-rose-100">
          <span className="shrink-0 text-xs font-medium text-rose-600">Top match</span>
          <Avatar p={p.topMatch} size={22} />
          <span className="min-w-0 truncate font-medium">{p.topMatch.name}</span>
          <span className="ml-auto font-mono font-semibold text-rose-700">{Math.round(p.topMatch.score)}</span>
        </Link>
      ) : (
        <div className="mt-auto rounded-lg bg-zinc-50 px-3 py-2 text-sm text-zinc-400">{p.analyzed ? "No dates yet" : "Not analyzed (source failed)"}</div>
      )}
    </div>
  );
}

export function FlowStrip({ active }: { active?: number }) {
  const steps = ["LinkedIn + Instagram", "Agent analysis", "Profile", "Agents date", "Rankings"];
  return (
    <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-2 text-xs sm:text-sm">
      {steps.map((s, i) => (
        <li key={s} className="flex items-center gap-1.5">
          <span
            className={`rounded-full px-2.5 py-1 font-medium whitespace-nowrap ${
              active === i ? "bg-rose-500 text-white" : active !== undefined && i < active ? "bg-rose-100 text-rose-700" : "bg-white text-zinc-700 ring-1 ring-zinc-200"
            }`}
          >
            <span className="text-zinc-400">{i + 1}</span> {s}
          </span>
          {i < steps.length - 1 && <span className="text-zinc-300">→</span>}
        </li>
      ))}
    </ol>
  );
}

const TONES = {
  interests: ["border-rose-200 bg-rose-50 text-rose-900", "border-rose-200 bg-white text-rose-800"],
  hobbies: ["border-sky-200 bg-sky-50 text-sky-900", "border-sky-200 bg-white text-sky-800"],
  lifestyle: ["border-emerald-200 bg-emerald-50 text-emerald-900", "border-emerald-200 bg-white text-emerald-800"],
  needs: ["border-violet-200 bg-violet-50 text-violet-900", "border-violet-200 bg-white text-violet-800"],
  personality: ["border-amber-200 bg-amber-50 text-amber-900", "border-amber-200 bg-white text-amber-800"],
  constraints: ["border-zinc-200 bg-zinc-100 text-zinc-800", "border-zinc-300 bg-white text-zinc-700"],
} as const;

function Chip({ s, tone }: { s: Signal; tone: keyof typeof TONES }) {
  const observed = s.kind === "observed";
  return (
    <span
      className={`inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1 text-sm whitespace-nowrap ${TONES[tone][observed ? 0 : 1]} ${observed ? "" : "border-dashed"}`}
      title={`${s.text} — ${s.kind} from ${s.source === "linkedin" ? "LinkedIn" : "Instagram"}`}
    >
      <span className="truncate">{s.text}</span>
      {s.source === "linkedin" ? <LinkedInIcon /> : <InstagramIcon />}
    </span>
  );
}

export function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-zinc-500">
      <span className="inline-flex items-center gap-1.5"><span className="rounded-full border border-zinc-200 bg-zinc-100 px-2 py-0.5 text-zinc-800">observed</span> stated in a source</span>
      <span className="inline-flex items-center gap-1.5"><span className="rounded-full border border-dashed border-zinc-300 bg-white px-2 py-0.5 text-zinc-700">inferred</span> agent&apos;s reading</span>
      <span className="inline-flex items-center gap-1.5"><LinkedInIcon /> LinkedIn</span>
      <span className="inline-flex items-center gap-1.5"><InstagramIcon /> Instagram</span>
    </div>
  );
}

function Tags({ label, items, tone }: { label: string; items: string[]; tone: "green" | "blue" | "amber" }) {
  if (!items.length) return null;
  const cls = { green: "bg-emerald-50 text-emerald-800", blue: "bg-indigo-50 text-indigo-800", amber: "bg-amber-50 text-amber-800" }[tone];
  return (
    <div className="flex flex-col gap-1.5 text-sm sm:flex-row sm:items-baseline">
      <span className="shrink-0 text-xs font-semibold tracking-wide text-zinc-500 uppercase sm:w-28">{label}</span>
      <div className="flex min-w-0 flex-wrap gap-1.5">
        {items.map((t) => (
          <span key={t} title={t} className={`max-w-full truncate rounded-md px-2 py-0.5 whitespace-nowrap ${cls}`}>{t}</span>
        ))}
      </div>
    </div>
  );
}

export function ScoreBar({ score }: { score: number }) {
  const color = score >= 75 ? "bg-emerald-500" : score >= 55 ? "bg-amber-400" : "bg-zinc-400";
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-32 overflow-hidden rounded-full bg-zinc-200">
        <div className={`bar-fill h-full rounded-full ${color}`} style={{ width: `${Math.max(0, Math.min(100, score))}%` }} />
      </div>
      <span className="font-mono text-sm font-semibold">{Math.round(score)}</span>
    </div>
  );
}

const band = (score: number) => (score >= 70 ? "strong" : score >= 40 ? "maybe" : "unlikely");
const BANDS = [
  ["all", "All"],
  ["strong", "Strong ≥70"],
  ["maybe", "Maybe 40-69"],
  ["unlikely", "Unlikely <40"],
] as const;

const SECTIONS = [
  ["interests", "Interests"],
  ["hobbies", "Hobbies"],
  ["lifestyle", "Lifestyle"],
  ["needs", "Needs in a partner"],
  ["personality", "Personality"],
  ["constraints", "Constraints"],
] as const;

export function ProfileView({
  person,
  rankings,
  people,
  dateHref,
}: {
  person: Person;
  rankings: RankingEntry[];
  people: Record<string, PersonLite>;
  dateHref: (other: string) => string;
}) {
  const { linkedin: li, instagram: ig } = person.sources;
  const a = person.analysis;
  const same = (r: RankingEntry) => !!person.gender && people[r.candidate]?.gender === person.gender;
  const [top, second] = rankings.filter((r) => !same(r)).concat(rankings.filter(same));
  return (
    <div className="space-y-10">
      <section className="flex flex-col gap-6 sm:flex-row sm:items-center">
        <Avatar p={person} size={112} />
        <div className="min-w-0 space-y-3">
          <h1 className="text-3xl font-bold tracking-tight">{person.name}</h1>
          {person.headline && <p className="text-lg text-zinc-600">{person.headline}</p>}
          <div className="flex flex-wrap gap-2">
            <SourceLink kind="linkedin" url={person.linkedinUrl} ok={li.ok} error={li.error} />
            <SourceLink kind="instagram" url={person.instagramUrl} ok={ig.ok} error={ig.error} />
          </div>
          <p className="text-xs text-zinc-500">Only these two sources are used as evidence for this profile.</p>
        </div>
      </section>

      {(!li.ok || !ig.ok) && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {!li.ok && <p><b>LinkedIn failed:</b> {li.error ?? "unknown error"} — <span className="font-mono">{li.url}</span></p>}
          {!ig.ok && <p><b>Instagram failed:</b> {ig.error ?? "unknown error"} — <span className="font-mono">{ig.url}</span></p>}
        </div>
      )}

      {a ? (
        <section className="space-y-6">
          <div className="rounded-2xl border border-rose-100 bg-white p-4 shadow-sm sm:p-6">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-rose-500">🤖 Agent summary</div>
            <p className="leading-relaxed sm:text-lg">{a.summary}</p>
          </div>
          <Legend />
          <div className="grid gap-4 md:grid-cols-2">
            {SECTIONS.map(([key, label]) => (
              <div key={key} className="min-w-0 rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5">
                <h3 className="mb-3 font-semibold">{label}</h3>
                <div className="flex flex-wrap gap-2">
                  {a[key].length ? a[key].map((s, i) => <Chip key={i} s={s} tone={key} />) : <span className="text-sm text-zinc-400">No supported signals</span>}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <p className="rounded-xl bg-zinc-100 p-4 text-zinc-600">No analysis — the agent could not access enough source data.</p>
      )}

      <details className="rounded-2xl border border-zinc-200 bg-white p-5">
        <summary className="cursor-pointer font-semibold">Raw source evidence (provenance)</summary>
        <div className="mt-4 grid gap-6 text-sm md:grid-cols-2">
          <div className="space-y-2">
            <SourceLink kind="linkedin" url={li.url} ok={li.ok} />
            {li.headline && <p><b>Headline:</b> {li.headline}</p>}
            {li.location && <p><b>Location:</b> {li.location}</p>}
            {li.about && <p className="whitespace-pre-line"><b>About:</b> {li.about}</p>}
            {!!li.experience?.length && (
              <div><b>Experience:</b><ul className="ml-5 list-disc">{li.experience.map((e, i) => <li key={i}>{e}</li>)}</ul></div>
            )}
            {!!li.education?.length && (
              <div><b>Education:</b><ul className="ml-5 list-disc">{li.education.map((e, i) => <li key={i}>{e}</li>)}</ul></div>
            )}
          </div>
          <div className="space-y-2">
            <SourceLink kind="instagram" url={ig.url} ok={ig.ok} />
            {ig.username && <p><b>@{ig.username}</b>{ig.followers !== undefined && <> · {ig.followers.toLocaleString()} followers</>}</p>}
            {ig.bio && <p className="whitespace-pre-line"><b>Bio:</b> {ig.bio}</p>}
            {!!ig.posts?.length && (
              <div><b>Recent captions:</b>
                <ul className="ml-5 list-disc space-y-1">
                  {ig.posts.map((p, i) => (
                    <li key={i}>{p.caption || <i className="text-zinc-400">(no caption)</i>}{p.location && <span className="text-zinc-500"> — 📍 {p.location}</span>}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </details>

      {a && (
        <section>
          <h2 className="mb-1 text-2xl font-bold tracking-tight">Ranked matches</h2>
          <p className="mb-5 text-sm text-zinc-500">
            {person.name.split(" ")[0]}&apos;s agent went on a date with every other agent. Ranked by the dates&apos; verdicts.
          </p>
          {rankings.length === 0 && <p className="text-zinc-500">No dates yet.</p>}
          {top && (
            <div className="mb-5 rounded-2xl border-2 border-rose-200 bg-rose-50 p-5">
              <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-rose-600">
                Why #1: {people[top.candidate]?.name ?? top.candidate}
                {second && <> · +{Math.round(top.score - second.score)} over #2</>}
              </div>
              <p className="text-zinc-800">{top.summary}</p>
              {!!top.sharedInterests.length && (
                <p className="mt-2 text-sm text-zinc-600"><b>Common ground:</b> {top.sharedInterests.slice(0, 4).join(", ")}</p>
              )}
            </div>
          )}
          <div className="ranks">
            {rankings.length > 0 && (
              <div className="mb-4 flex flex-wrap gap-2">
                {BANDS.map(([key, label]) => (
                  <label key={key} className="cursor-pointer rounded-full border border-zinc-300 bg-white px-3 py-1 text-sm font-medium text-zinc-700 has-[:checked]:border-zinc-900 has-[:checked]:bg-zinc-900 has-[:checked]:text-white has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-rose-400">
                    <input type="radio" name="band" value={key} defaultChecked={key === "all"} className="sr-only" />
                    {label} ({key === "all" ? rankings.length : rankings.filter((r) => band(r.score) === key).length})
                  </label>
                ))}
                {rankings.some(same) && (
                  <label className="cursor-pointer rounded-full border border-dashed border-zinc-300 bg-white px-3 py-1 text-sm font-medium text-zinc-500 has-[:checked]:border-solid has-[:checked]:border-rose-500 has-[:checked]:bg-rose-50 has-[:checked]:text-rose-700">
                    <input type="checkbox" name="same" className="sr-only" />
                    Include same gender
                  </label>
                )}
              </div>
            )}
            <ol className="stagger space-y-3">
              {rankings.map((r, i) => {
                const c = people[r.candidate] ?? { id: r.candidate, name: r.candidate };
                return (
                  <li key={r.candidate} data-band={band(r.score)} data-same={same(r) || undefined} style={idx(i)} className="lift space-y-3 rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="rank-no w-7 shrink-0 text-lg font-bold text-zinc-300 sm:w-8 sm:text-2xl" />
                      <Avatar p={c} size={48} />
                      <div className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-x-4 gap-y-1">
                        <div className="min-w-0">
                          <div className="font-semibold">{c.name}</div>
                          {c.headline && <div className="line-clamp-1 text-sm text-zinc-500">{c.headline}</div>}
                        </div>
                        <ScoreBar score={r.score} />
                      </div>
                    </div>
                    <div className="space-y-2 sm:pl-28">
                      <p className="text-zinc-700">{r.summary}</p>
                      <Tags label="Shared" items={r.sharedInterests} tone="green" />
                      <Tags label="Complementary" items={r.complementaryTraits} tone="blue" />
                      <Tags label="Concerns" items={r.concerns} tone="amber" />
                      <Link href={dateHref(r.candidate)} className="inline-block text-sm font-semibold text-rose-600 hover:underline">
                        View date →
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </section>
      )}
    </div>
  );
}

export function DateView({ date, a, b }: { date: DateResult; a: PersonLite; b: PersonLite }) {
  const v = date.verdict;
  const first = (p: PersonLite) => p.name.split(" ")[0];
  return (
    <div className="space-y-10">
      <section className="flex items-start justify-center gap-3 sm:gap-12">
        {[a, b].map((p, i) => (
          <div key={p.id} className="flex min-w-0 flex-1 items-start justify-center gap-3 sm:flex-none sm:gap-12">
            {i === 1 && <div className="beat mt-8 text-3xl text-rose-500 sm:text-4xl">♥</div>}
            <Link href={`/p/${p.id}`} className="flex min-w-0 flex-col items-center gap-2 text-center">
              <Avatar p={p} size={96} />
              <div className="font-semibold">{p.name}</div>
              {p.headline && <div className="line-clamp-2 max-w-56 text-xs text-zinc-500">{p.headline}</div>}
            </Link>
          </div>
        ))}
      </section>

      <section>
        <h2 className="mb-4 text-xl font-bold">Before the date</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-sky-100 bg-sky-50 p-5">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-sky-700">Agent for {first(a)}</div>
            <ReplayThinking active={`Considering ${first(b)}`} done={`Considered ${first(b)}`} text={date.aConsidersB} />
          </div>
          <div className="rounded-2xl border border-rose-100 bg-rose-50 p-5">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-rose-700">Agent for {first(b)}</div>
            <ReplayThinking active={`Considering ${first(a)}`} done={`Considered ${first(a)}`} text={date.bConsidersA} />
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-bold">The date</h2>
        <div className="stagger space-y-4 rounded-2xl border border-zinc-200 bg-white p-4 sm:p-6">
          {date.transcript.map((t, i) => {
            const isA = t.speaker === "a";
            const p = isA ? a : b;
            return (
              <div key={i} style={idx(i)} className={`flex items-end gap-3 ${isA ? "" : "flex-row-reverse"}`}>
                <Avatar p={p} size={36} />
                <div className={`max-w-[75%] ${isA ? "" : "text-right"}`}>
                  <div className="mb-1 text-xs font-medium text-zinc-500">Agent for {p.name}</div>
                  <div className={`rounded-2xl px-4 py-2.5 text-left leading-relaxed ${isA ? "rounded-bl-sm bg-sky-100 text-sky-950" : "rounded-br-sm bg-rose-100 text-rose-950"}`}>
                    {t.text}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border-2 border-zinc-900 bg-white p-4 sm:p-6 motion-safe:animate-[fade-up_500ms_var(--ease-out)_both]">
        <h2 className="mb-4 text-xl font-bold">Verdict</h2>
        <div className="mb-5 grid grid-cols-3 gap-4 text-center">
          <div><div className="text-4xl font-bold text-rose-600">{Math.round(v.score)}</div><div className="text-xs text-zinc-500">Mutual compatibility</div></div>
          <div><div className="text-3xl font-semibold">{Math.round(v.aScore)}</div><div className="text-xs text-zinc-500">{first(a)}&apos;s agent wants a 2nd date</div></div>
          <div><div className="text-3xl font-semibold">{Math.round(v.bScore)}</div><div className="text-xs text-zinc-500">{first(b)}&apos;s agent wants a 2nd date</div></div>
        </div>
        <p className="mb-4 sm:text-lg">{v.summary}</p>
        <div className="space-y-2">
          <Tags label="Shared" items={v.sharedInterests} tone="green" />
          <Tags label="Complementary" items={v.complementaryTraits} tone="blue" />
          <Tags label="Concerns" items={v.concerns} tone="amber" />
        </div>
      </section>
    </div>
  );
}
