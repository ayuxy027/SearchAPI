import Link from "next/link";
import type { DateResult, Person, RankingEntry, Signal } from "@/lib/types";
import type { PersonLite } from "@/server/data";

export function Avatar({ p, size = 48 }: { p: { name: string; photo?: string }; size?: number }) {
  const initials = p.name.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div
      className="relative shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-rose-200 to-indigo-200 font-semibold text-zinc-700"
      style={{ width: size, height: size, fontSize: size / 2.8 }}
    >
      <span className="absolute inset-0 flex items-center justify-center">{initials}</span>
      {p.photo && (
        <img src={p.photo} alt={p.name} referrerPolicy="no-referrer" className="relative h-full w-full object-cover" />
      )}
    </div>
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
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${
        li ? "border-sky-200 bg-sky-50 text-sky-800" : "border-pink-200 bg-pink-50 text-pink-800"
      }`}
    >
      <span className={`flex h-4 w-4 items-center justify-center rounded text-[9px] font-bold text-white ${li ? "bg-sky-600" : "bg-gradient-to-tr from-amber-400 via-pink-500 to-purple-600"}`}>
        {li ? "in" : "IG"}
      </span>
      {li ? "LinkedIn" : "Instagram"}
      {ok !== undefined && (ok ? <span className="text-emerald-600">✓</span> : <span className="text-red-600">✗ failed</span>)}
    </a>
  );
}

export function FlowStrip({ active }: { active?: number }) {
  const steps = ["LinkedIn + Instagram", "Agent analysis", "Profile", "Agents date", "Rankings"];
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      {steps.map((s, i) => (
        <span key={s} className="flex items-center gap-2">
          <span
            className={`rounded-full px-3 py-1.5 font-medium ${
              active === i ? "bg-rose-500 text-white" : active !== undefined && i < active ? "bg-rose-100 text-rose-700" : "bg-white text-zinc-700 ring-1 ring-zinc-200"
            }`}
          >
            {i + 1}. {s}
          </span>
          {i < steps.length - 1 && <span className="text-zinc-400">→</span>}
        </span>
      ))}
    </div>
  );
}

function Chip({ s }: { s: Signal }) {
  const observed = s.kind === "observed";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm ${
        observed ? "bg-zinc-900 text-white" : "border border-dashed border-zinc-400 bg-white text-zinc-700 italic"
      }`}
      title={`${s.kind} from ${s.source}`}
    >
      {s.text}
      <span className={`rounded px-1 text-[10px] font-bold not-italic ${s.source === "linkedin" ? "bg-sky-500 text-white" : "bg-pink-500 text-white"}`}>
        {s.source === "linkedin" ? "LI" : "IG"}
      </span>
    </span>
  );
}

export function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-500">
      <span className="inline-flex items-center gap-1.5"><span className="rounded-full bg-zinc-900 px-2 py-0.5 text-white">observed</span> stated in a source</span>
      <span className="inline-flex items-center gap-1.5"><span className="rounded-full border border-dashed border-zinc-400 px-2 py-0.5 italic">inferred</span> agent&apos;s reading</span>
      <span className="inline-flex items-center gap-1.5"><span className="rounded bg-sky-500 px-1 font-bold text-white">LI</span> LinkedIn</span>
      <span className="inline-flex items-center gap-1.5"><span className="rounded bg-pink-500 px-1 font-bold text-white">IG</span> Instagram</span>
    </div>
  );
}

function Tags({ label, items, tone }: { label: string; items: string[]; tone: "green" | "blue" | "amber" }) {
  if (!items.length) return null;
  const cls = { green: "bg-emerald-50 text-emerald-800", blue: "bg-indigo-50 text-indigo-800", amber: "bg-amber-50 text-amber-800" }[tone];
  return (
    <div className="flex flex-wrap items-baseline gap-1.5 text-sm">
      <span className="w-28 shrink-0 text-xs font-semibold uppercase tracking-wide text-zinc-500">{label}</span>
      {items.map((t) => (
        <span key={t} className={`rounded-md px-2 py-0.5 ${cls}`}>{t}</span>
      ))}
    </div>
  );
}

export function ScoreBar({ score }: { score: number }) {
  const color = score >= 75 ? "bg-emerald-500" : score >= 55 ? "bg-amber-400" : "bg-zinc-400";
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-32 overflow-hidden rounded-full bg-zinc-200">
        <div className={`h-full ${color}`} style={{ width: `${Math.max(0, Math.min(100, score))}%` }} />
      </div>
      <span className="font-mono text-sm font-semibold">{Math.round(score)}</span>
    </div>
  );
}

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
  return (
    <div className="space-y-10">
      <section className="flex flex-col gap-6 sm:flex-row sm:items-center">
        <Avatar p={person} size={112} />
        <div className="space-y-3">
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
          <div className="rounded-2xl border border-rose-100 bg-white p-6 shadow-sm">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-rose-500">🤖 Agent summary</div>
            <p className="text-lg leading-relaxed">{a.summary}</p>
          </div>
          <Legend />
          <div className="grid gap-4 md:grid-cols-2">
            {SECTIONS.map(([key, label]) => (
              <div key={key} className="rounded-2xl border border-zinc-200 bg-white p-5">
                <h3 className="mb-3 font-semibold">{label}</h3>
                <div className="flex flex-wrap gap-2">
                  {a[key].length ? a[key].map((s, i) => <Chip key={i} s={s} />) : <span className="text-sm text-zinc-400">No supported signals</span>}
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
          <ol className="space-y-3">
            {rankings.map((r, i) => {
              const c = people[r.candidate] ?? { id: r.candidate, name: r.candidate };
              return (
                <li key={r.candidate} className="flex gap-4 rounded-2xl border border-zinc-200 bg-white p-5">
                  <div className="w-8 text-2xl font-bold text-zinc-300">#{i + 1}</div>
                  <Avatar p={c} size={56} />
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="font-semibold">{c.name}</div>
                        {c.headline && <div className="text-sm text-zinc-500">{c.headline}</div>}
                      </div>
                      <ScoreBar score={r.score} />
                    </div>
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
      <section className="flex items-center justify-center gap-6 sm:gap-12">
        {[a, b].map((p, i) => (
          <div key={p.id} className="flex items-center gap-6 sm:gap-12">
            {i === 1 && <div className="text-4xl text-rose-500">♥</div>}
            <Link href={`/p/${p.id}`} className="flex flex-col items-center gap-2 text-center">
              <Avatar p={p} size={96} />
              <div className="font-semibold">{p.name}</div>
              {p.headline && <div className="max-w-56 text-xs text-zinc-500">{p.headline}</div>}
            </Link>
          </div>
        ))}
      </section>

      <section>
        <h2 className="mb-4 text-xl font-bold">Before the date</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-sky-100 bg-sky-50 p-5">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-sky-700">Agent for {first(a)} considers {first(b)}</div>
            <p className="text-zinc-800">{date.aConsidersB}</p>
          </div>
          <div className="rounded-2xl border border-rose-100 bg-rose-50 p-5">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-rose-700">Agent for {first(b)} considers {first(a)}</div>
            <p className="text-zinc-800">{date.bConsidersA}</p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-bold">The date</h2>
        <div className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-6">
          {date.transcript.map((t, i) => {
            const isA = t.speaker === "a";
            const p = isA ? a : b;
            return (
              <div key={i} className={`flex items-end gap-3 ${isA ? "" : "flex-row-reverse"}`}>
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

      <section className="rounded-2xl border-2 border-zinc-900 bg-white p-6">
        <h2 className="mb-4 text-xl font-bold">Verdict</h2>
        <div className="mb-5 grid grid-cols-3 gap-4 text-center">
          <div><div className="text-4xl font-bold text-rose-600">{Math.round(v.score)}</div><div className="text-xs text-zinc-500">Mutual compatibility</div></div>
          <div><div className="text-3xl font-semibold">{Math.round(v.aScore)}</div><div className="text-xs text-zinc-500">{first(a)}&apos;s agent wants a 2nd date</div></div>
          <div><div className="text-3xl font-semibold">{Math.round(v.bScore)}</div><div className="text-xs text-zinc-500">{first(b)}&apos;s agent wants a 2nd date</div></div>
        </div>
        <p className="mb-4 text-lg">{v.summary}</p>
        <div className="space-y-2">
          <Tags label="Shared" items={v.sharedInterests} tone="green" />
          <Tags label="Complementary" items={v.complementaryTraits} tone="blue" />
          <Tags label="Concerns" items={v.concerns} tone="amber" />
        </div>
      </section>
    </div>
  );
}
