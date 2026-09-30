"use client";
import Link from "next/link";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/router";
import { trpc } from "./trpc";
import { Avatar, FlowStrip, ScoreBar, SourceLink } from "./ui";

export type AddResult = inferRouterOutputs<AppRouter>["people"]["add"];

const KEY = "agentmatch.added";
const subscribe = (cb: () => void) => {
  window.addEventListener("storage", cb);
  return () => window.removeEventListener("storage", cb);
};
export function useAdded(): AddResult[] {
  const raw = useSyncExternalStore(subscribe, () => localStorage.getItem(KEY) ?? "[]", () => "[]");
  return useMemo(() => JSON.parse(raw), [raw]);
}
function saveAdded(r: AddResult) {
  const all: AddResult[] = JSON.parse(localStorage.getItem(KEY) ?? "[]").filter((x: AddResult) => x.person.id !== r.person.id);
  localStorage.setItem(KEY, JSON.stringify([r, ...all]));
  window.dispatchEvent(new StorageEvent("storage"));
}

export const profileHref = (r: AddResult) => (r.existing ? `/p/${r.person.id}` : `/added/${r.person.id}`);
export const dateHref = (r: AddResult, other: string) =>
  r.existing ? `/date/${r.person.id}/${other}` : `/added/${r.person.id}?date=${other}`;

const STEPS = [
  [0, 1, "Scraping public LinkedIn + Instagram…"],
  [25, 1, "Agent is analyzing both sources…"],
  [45, 3, "Agent is going on dates with every other agent…"],
] as const;

export default function AddPerson({ candidates }: { candidates: number }) {
  const [li, setLi] = useState("");
  const [ig, setIg] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const add = trpc.people.add.useMutation({ onSuccess: saveAdded });
  const added = useAdded();

  useEffect(() => {
    if (!add.isPending) return;
    const start = Date.now();
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000);
    return () => { clearInterval(t); setElapsed(0); };
  }, [add.isPending]);

  const step = [...STEPS].reverse().find(([s]) => elapsed >= s)!;
  const r = add.data;
  const failed = r && !r.person.analysis;
  const byId = new Map((r?.candidates ?? []).map((c) => [c.id, c]));

  return (
    <div className="space-y-6">
      <form
        onSubmit={(e) => { e.preventDefault(); add.mutate({ linkedin: li, instagram: ig }); }}
        className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
      >
        <h2 className="text-xl font-bold">Add a person</h2>
        <p className="mb-4 text-sm text-zinc-500">
          Paste their public LinkedIn and Instagram. An agent analyzes both, then dates all {candidates} existing agents.
        </p>
        <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
          <input required value={li} onChange={(e) => setLi(e.target.value)} placeholder="https://www.linkedin.com/in/…" className="rounded-lg border border-zinc-300 px-3 py-2.5 outline-none focus:border-zinc-900" />
          <input required value={ig} onChange={(e) => setIg(e.target.value)} placeholder="https://www.instagram.com/…" className="rounded-lg border border-zinc-300 px-3 py-2.5 outline-none focus:border-zinc-900" />
          <button disabled={add.isPending} className="rounded-lg bg-zinc-900 px-5 py-2.5 font-semibold text-white hover:bg-zinc-700 disabled:opacity-50">
            {add.isPending ? "Working…" : "Create agent"}
          </button>
        </div>

        {add.isPending && (
          <div className="mt-5 space-y-3">
            <FlowStrip active={step[1]} />
            <p className="text-sm text-zinc-600"><span className="mr-2 inline-block animate-spin">⟳</span>{step[2]} <span className="font-mono text-zinc-400">{elapsed}s</span></p>
          </div>
        )}

        {add.error && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <b>Failed:</b> {add.error.data?.code === "BAD_REQUEST" ? "Invalid URL — use linkedin.com/in/<name> and instagram.com/<username>" : add.error.message}
            <div className="mt-1 font-mono text-xs">{li}<br />{ig}</div>
          </div>
        )}

        {failed && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <p className="mb-2 font-semibold">Couldn&apos;t analyze — a source failed, so no profile was invented.</p>
            {(["linkedin", "instagram"] as const).map((k) => {
              const s = r.person.sources[k];
              return <p key={k}><b>{k === "linkedin" ? "LinkedIn" : "Instagram"}:</b> {s.ok ? "✓ ok" : `✗ ${s.error ?? "failed"}`} — <span className="font-mono">{s.url}</span></p>;
            })}
          </div>
        )}

        {r && r.person.analysis && (
          <div className="mt-6 space-y-4 border-t border-zinc-100 pt-6">
            {r.existing && <p className="text-sm text-amber-700">This person is already in the dataset — showing their existing results.</p>}
            <div className="flex items-start gap-4">
              <Avatar p={r.person} size={64} />
              <div className="space-y-2">
                <div className="text-lg font-semibold">{r.person.name}</div>
                <div className="flex gap-2">
                  <SourceLink kind="linkedin" url={r.person.linkedinUrl} ok={r.person.sources.linkedin.ok} />
                  <SourceLink kind="instagram" url={r.person.instagramUrl} ok={r.person.sources.instagram.ok} />
                </div>
                <p className="text-zinc-700">{r.person.analysis.summary}</p>
                <Link href={profileHref(r)} className="text-sm font-semibold text-rose-600 hover:underline">Open full profile →</Link>
              </div>
            </div>
            <div>
              <h3 className="mb-2 font-semibold">Top 5 matches after {r.dates.length} dates</h3>
              <ol className="space-y-2">
                {r.rankings.slice(0, 5).map((m, i) => {
                  const c = byId.get(m.candidate) ?? { id: m.candidate, name: m.candidate };
                  return (
                    <li key={m.candidate} className="flex items-center gap-3 rounded-xl bg-zinc-50 p-3">
                      <span className="w-6 font-bold text-zinc-400">#{i + 1}</span>
                      <Avatar p={c} size={36} />
                      <div className="min-w-0 flex-1">
                        <div className="font-medium">{c.name}</div>
                        <div className="truncate text-sm text-zinc-500">{m.summary}</div>
                      </div>
                      <ScoreBar score={m.score} />
                      <Link href={dateHref(r, m.candidate)} className="text-sm font-semibold text-rose-600 hover:underline">View date →</Link>
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>
        )}
      </form>

      {added.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-bold">Added by you</h2>
          <div className="flex flex-wrap gap-3">
            {added.map((a) => (
              <Link key={a.person.id} href={profileHref(a)} className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-2 hover:border-zinc-400">
                <Avatar p={a.person} size={32} />
                <span className="font-medium">{a.person.name}</span>
                {!a.person.analysis && <span className="text-xs text-red-600">failed</span>}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
