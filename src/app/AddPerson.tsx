"use client";
import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";
import { TRPCClientError } from "@trpc/client";
import type { AddEvent, AddResult } from "@/server/router";
import type { Person } from "@/lib/types";
import { INSTAGRAM_RE, LINKEDIN_RE } from "@/server/urls";
import { trpc } from "./trpc";
import { Avatar, ScoreBar, SourceLink, idx } from "./ui";
import Thinking from "./Thinking";

export type { AddResult };

const KEY = "wingmate.added";
const subscribe = (cb: () => void) => {
  window.addEventListener("storage", cb);
  return () => window.removeEventListener("storage", cb);
};
export function useAdded(): AddResult[] {
  const raw = useSyncExternalStore(subscribe, () => localStorage.getItem(KEY) ?? "[]", () => "[]");
  return useMemo(() => {
    const v: unknown = JSON.parse(raw);
    if (!Array.isArray(v)) throw new Error(`Corrupt ${KEY} in localStorage — expected array`);
    return v as AddResult[];
  }, [raw]);
}
function saveAdded(r: AddResult) {
  const stored: unknown = JSON.parse(localStorage.getItem(KEY) ?? "[]");
  if (!Array.isArray(stored)) throw new Error(`Corrupt ${KEY} in localStorage — expected array`);
  const all: AddResult[] = stored.filter((x: AddResult) => x.person.id !== r.person.id);
  localStorage.setItem(KEY, JSON.stringify([r, ...all]));
  window.dispatchEvent(new StorageEvent("storage"));
}

export const profileHref = (r: AddResult) => (r.existing ? `/p/${r.person.id}` : `/added/${r.person.id}`);
export const dateHref = (r: AddResult, other: string) =>
  r.existing ? `/date/${r.person.id}/${other}` : `/added/${r.person.id}?date=${other}`;

type StepEvent = Extract<AddEvent, { type: "step" }>;
type ErrorEvent = Extract<AddEvent, { type: "error" }>;
const STEPS = [
  ["scrape", "Scrape public LinkedIn + Instagram"],
  ["analyze", "Agent analyzes both sources"],
  ["date", "Agent dates every other agent"],
] as const;
const sourceLines = (p: Person) =>
  (["linkedin", "instagram"] as const).map((k) => {
    const s = p.sources[k];
    return <p key={k}><b>{k === "linkedin" ? "LinkedIn" : "Instagram"}:</b> {s.ok ? "✓ scraped" : `✗ ${s.error ?? "failed"}`} — <span className="font-mono">{s.url}</span></p>;
  });
const inputCls = "rounded-lg border border-zinc-300 px-3 py-2.5 outline-none focus:border-zinc-900 invalid:[&:not(:placeholder-shown)]:border-red-400";

export default function AddPerson({ candidates }: { candidates: number }) {
  const [li, setLi] = useState("");
  const [ig, setIg] = useState("");
  const [submitted, setSubmitted] = useState({ linkedin: "", instagram: "" });
  const [running, setRunning] = useState(false);
  const [steps, setSteps] = useState<Partial<Record<StepEvent["step"], StepEvent>>>({});
  const [r, setR] = useState<AddResult>();
  const [err, setErr] = useState<ErrorEvent>();
  const client = trpc.useUtils().client;
  const added = useAdded();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const input = { linkedin: li.trim(), instagram: ig.trim() };
    setSubmitted(input);
    setRunning(true);
    setSteps({});
    setR(undefined);
    setErr(undefined);
    try {
      for await (const ev of await client.people.add.mutate(input)) {
        if (ev.type === "step") setSteps((s) => ({ ...s, [ev.step]: ev }));
        else if (ev.type === "error") setErr(ev);
        else {
          setR(ev);
          saveAdded(ev);
        }
      }
    } catch (e) {
      const bad = e instanceof TRPCClientError && e.data?.code === "BAD_REQUEST";
      setErr({ type: "error", message: bad ? "Invalid URL — use linkedin.com/in/<name> and instagram.com/<username>" : (e as Error).message });
    } finally {
      setRunning(false);
    }
  }

  const cur = STEPS.findLastIndex(([k]) => steps[k]);
  const failed = r && !r.person.analysis;
  const ok = !running && !!r?.person.analysis;
  const byId = new Map((r?.candidates ?? []).map((c) => [c.id, c]));

  return (
    <div className="space-y-6">
      <form onSubmit={submit} className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold">Add a person</h2>
        <p className="mb-4 text-sm text-zinc-500">
          Paste their public LinkedIn and Instagram. An agent analyzes both, then dates all {candidates} existing agents.
        </p>
        <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
          <input type="url" required title="https://www.linkedin.com/in/<name>" value={li} onChange={(e) => { setLi(e.target.value); e.target.setCustomValidity(LINKEDIN_RE.test(e.target.value.trim()) ? "" : "Must be a linkedin.com/in/… profile URL"); }} onBlur={() => setLi(li.trim())} placeholder="https://www.linkedin.com/in/…" className={inputCls} />
          <input type="url" required title="https://www.instagram.com/<username>" value={ig} onChange={(e) => { setIg(e.target.value); e.target.setCustomValidity(INSTAGRAM_RE.test(e.target.value.trim()) ? "" : "Must be an instagram.com/<username> URL"); }} onBlur={() => setIg(ig.trim())} placeholder="https://www.instagram.com/…" className={inputCls} />
          <button disabled={running} className="rounded-lg bg-zinc-900 px-5 py-2.5 font-semibold text-white transition active:scale-[0.97] hover:bg-zinc-700 disabled:opacity-50">
            {running ? "Working…" : "Create agent"}
          </button>
        </div>

        {cur >= 0 && (
          <div className="mt-5 rounded-xl border border-zinc-100 bg-zinc-50/60 px-4 py-3">
            <Thinking
              active={STEPS[cur][1]}
              done={ok ? `Agent created and dated ${r.dates.length} agents` : "Stopped — see error below"}
              working={running}
              open
              rows={STEPS.map(([k, label], i) => ({
                text: label,
                meta: steps[k]?.total !== undefined ? `${steps[k].done}/${steps[k].total}` : undefined,
                state: i < cur || ok ? "done" : i > cur ? "pending" : running ? "active" : "error",
              }))}
            />
          </div>
        )}

        {err && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <b>Failed:</b> {err.message}
            {err.person ? (
              sourceLines(err.person)
            ) : (
              <div className="mt-1 font-mono text-xs">{submitted.linkedin}<br />{submitted.instagram}</div>
            )}
          </div>
        )}

        {failed && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <p className="mb-2 font-semibold">Couldn&apos;t analyze — a source failed, so no profile was invented.</p>
            {sourceLines(r.person)}
          </div>
        )}

        {r && r.person.analysis && (
          <div className="mt-6 space-y-4 border-t border-zinc-100 pt-6 motion-safe:animate-[fade-up_500ms_var(--ease-out)_both]">
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
              <ol className="stagger space-y-2">
                {r.rankings.slice(0, 5).map((m, i) => {
                  const c = byId.get(m.candidate) ?? { id: m.candidate, name: m.candidate };
                  return (
                    <li key={m.candidate} style={idx(i)} className="flex items-center gap-3 rounded-xl bg-zinc-50 p-3">
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
