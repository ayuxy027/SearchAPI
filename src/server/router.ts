import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure } from "./trpc";
import { findDate, lite, loadDates, loadPeople, searchPeople, listPeople, type PersonLite } from "./data";
import { createPersonWithRaw } from "@/lib/pipeline";
import { runDate } from "@/lib/date";
import { rankFor } from "@/lib/rank";
import { INSTAGRAM_RE, LINKEDIN_RE } from "./urls";
import type { DateResult, Person, RankingEntry } from "@/lib/types";

const linkedin = z.string().trim().regex(LINKEDIN_RE, "Must be a linkedin.com/in/… profile URL");
const instagram = z.string().trim().regex(INSTAGRAM_RE, "Must be an instagram.com/<username> URL");
type AddInput = { linkedin: string; instagram: string };

export type AddResult = { person: Person; dates: DateResult[]; rankings: RankingEntry[]; candidates: PersonLite[]; existing: boolean; failedDates?: string[] };
export type AddEvent =
  | { type: "step"; step: "scrape" | "analyze" | "date"; message: string; done?: number; total?: number }
  | ({ type: "result" } & AddResult)
  | { type: "error"; message: string; person?: Person };
type Emit = (e: AddEvent) => void;

const norm = (u: string) => u.toLowerCase().replace(/[?#].*$/, "").replace(/\/+$/, "").replace(/^https?:\/\/(www\.|[a-z]{2}\.)?/, "");

async function pipeline(input: AddInput, emit: Emit) {
  const people = loadPeople();
  const existing = people.find((p) => norm(p.linkedinUrl) === norm(input.linkedin));
  if (existing) {
    const dates = loadDates().filter((d) => d.a === existing.id || d.b === existing.id);
    return emit({ type: "result", person: existing, dates, rankings: rankFor(existing.id, dates), candidates: people.map(lite), existing: true });
  }
  emit({ type: "step", step: "scrape", message: "Scraping public LinkedIn + Instagram" });
  const { person } = await createPersonWithRaw(input.linkedin, input.instagram, () =>
    emit({ type: "step", step: "analyze", message: "Agent is analyzing both sources" }),
  );
  const ids = new Set(people.map((p) => p.id));
  for (let n = 2, base = person.id; ids.has(person.id); n++) person.id = `${base}-${n}`;
  const others = people.filter((p) => p.analysis);
  const total = others.length;
  let done = 0;
  emit({ type: "step", step: "date", message: `Dating ${total} agents`, done, total });
  const dates: DateResult[] = [];
  const failedDates: string[] = [];
  let next = 0;
  await Promise.all(
    Array.from({ length: DATE_WORKERS }, async () => {
      while (next < total) {
        const o = others[next++];
        await runDate(person, o).then((d) => dates.push(d), () => failedDates.push(o.name));
        done++;
        emit({ type: "step", step: "date", message: `Dated ${done}/${total}`, done, total });
      }
    }),
  );
  if (!dates.length) throw new Error(`All ${total} dates failed. The LLM provider may be rate-limited; try again in a minute.`);
  emit({ type: "result", person, dates, rankings: rankFor(person.id, dates), candidates: others.map(lite), existing: false, failedDates });
}

type Run = { events: AddEvent[]; done: boolean; tick: PromiseWithResolvers<void> };
const runs = new Map<string, Run>();
const CACHE_MAX = 50;
const MAX_ACTIVE = 3;
const DATE_WORKERS = 8;

function start(key: string, input: AddInput) {
  const run: Run = { events: [], done: false, tick: Promise.withResolvers() };
  const wake = () => {
    const t = run.tick;
    run.tick = Promise.withResolvers();
    t.resolve();
  };
  const emit: Emit = (e) => {
    run.events.push(e);
    wake();
  };
  pipeline(input, emit)
    .catch((e) => emit({ type: "error", message: (e as Error).message }))
    .finally(() => {
      const last = run.events.at(-1);
      if (last?.type !== "result" || !last.person.analysis) runs.delete(key);
      else for (const [k, r] of runs) if (runs.size > CACHE_MAX && r.done) runs.delete(k);
      run.done = true;
      wake();
    });
  runs.set(key, run);
  return run;
}

async function* follow(run: Run) {
  for (let i = 0; ; ) {
    while (i < run.events.length) yield run.events[i++];
    if (run.done) return;
    const ping = await Promise.race([run.tick.promise.then(() => false), new Promise<boolean>((r) => setTimeout(r, 10_000, true))]);
    if (ping) yield { type: "ping" } as const;
  }
}

const WINDOW = 10 * 60_000;
const hits = new Map<string, number[]>();
function rateLimit(ip: string) {
  const now = Date.now();
  for (const [k, ts] of hits) {
    const live = ts.filter((t) => now - t < WINDOW);
    if (live.length) hits.set(k, live);
    else hits.delete(k);
  }
  const recent = hits.get(ip) ?? [];
  if (recent.length >= 5) {
    const mins = Math.ceil((recent[0] + WINDOW - now) / 60_000);
    throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: `Rate limit: max 5 people per 10 minutes. Try again in ${mins} min.` });
  }
  hits.set(ip, [...recent, now]);
}

export const appRouter = router({
  people: router({
    list: publicProcedure.query(() => listPeople()),
    search: publicProcedure.input(z.object({ q: z.string().trim().max(100) })).query(({ input }) => searchPeople(input.q)),
    get: publicProcedure.input(z.string()).query(({ input }) => {
      const person = loadPeople().find((p) => p.id === input);
      if (!person) throw new TRPCError({ code: "NOT_FOUND" });
      return { person, rankings: person.analysis ? rankFor(person.id, loadDates()) : [] };
    }),
    add: publicProcedure.input(z.object({ linkedin, instagram })).mutation(({ input, ctx }) => {
      const key = `${norm(input.linkedin)}|${norm(input.instagram)}`;
      const hit = runs.get(key);
      if (hit?.done) {
        runs.delete(key);
        runs.set(key, hit);
      }
      if (hit) return follow(hit);
      if ([...runs.values()].filter((r) => !r.done).length >= MAX_ACTIVE)
        throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: `Busy: ${MAX_ACTIVE} agents are being created right now. Try again in a minute.` });
      rateLimit(ctx.ip);
      return follow(start(key, input));
    }),
  }),
  dates: router({
    get: publicProcedure.input(z.object({ a: z.string(), b: z.string() })).query(({ input }) => {
      const date = findDate(loadDates(), input.a, input.b);
      if (!date) throw new TRPCError({ code: "NOT_FOUND" });
      return date;
    }),
  }),
});

export type AppRouter = typeof appRouter;
