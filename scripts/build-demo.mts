import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createPersonWithRaw } from "../src/lib/pipeline";
import { runDate } from "../src/lib/date";
import type { DateResult, Person } from "../src/lib/types";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");
const force = process.argv.includes("--force");

mkdirSync("data/raw", { recursive: true });
const read = <T,>(f: string, init: T): T => (existsSync(f) ? JSON.parse(readFileSync(f, "utf8")) : init);
const write = (f: string, v: unknown) => writeFileSync(f, JSON.stringify(v, null, 2) + "\n");

const input = read<{ linkedin: string; instagram: string }[]>("data/input.json", []);
let people = read<Person[]>("data/people.json", []);
let dates = read<DateResult[]>("data/dates.json", []);

async function inBatches<T>(items: T[], size: number, fn: (x: T) => Promise<void>, after: () => void) {
  for (let i = 0; i < items.length; i += size) {
    await Promise.all(items.slice(i, i + size).map(fn));
    after();
  }
}

const todo = input.filter(
  (row) => force || !people.some((p) => p.linkedinUrl === row.linkedin && p.analysis),
);
console.log(`People: ${input.length} in input, ${todo.length} to process`);
let n = 0;
await inBatches(
  todo,
  5,
  async (row) => {
    try {
      const { person, raw } = await createPersonWithRaw(row.linkedin, row.instagram);
      const rest = people.filter((p) => p.linkedinUrl !== row.linkedin);
      if (rest.some((p) => p.id === person.id)) person.id += "-" + (rest.length + 1);
      people = [...rest, person];
      write(`data/raw/${person.id}.json`, { linkedinUrl: row.linkedin, instagramUrl: row.instagram, ...raw });
      console.log(`[${++n}/${todo.length}] ${person.name}: analyzed`);
    } catch (e) {
      console.error(`[${++n}/${todo.length}] FAILED ${row.linkedin}: ${e instanceof Error ? e.message : e}`);
    }
  },
  () => write("data/people.json", people),
);
write("data/people.json", people);

const analyzed = people.filter((p) => p.analysis);
const ids = new Set(analyzed.map((p) => p.id));
dates = dates.filter((d) => ids.has(d.a) && ids.has(d.b));
const key = (a: string, b: string) => [a, b].sort().join("|");
const done = new Set(force ? [] : dates.map((d) => key(d.a, d.b)));
if (force) dates = [];
const pairs: [Person, Person][] = [];
for (let i = 0; i < analyzed.length; i++)
  for (let j = i + 1; j < analyzed.length; j++)
    if (!done.has(key(analyzed[i].id, analyzed[j].id))) pairs.push([analyzed[i], analyzed[j]]);
console.log(`Dates: ${dates.length} cached, ${pairs.length} to run`);
n = 0;
await inBatches(
  pairs,
  8,
  async ([a, b]) => {
    try {
      const d = await runDate(a, b);
      dates.push(d);
      console.log(`[${++n}/${pairs.length}] ${a.name} x ${b.name}: ${d.verdict.score}`);
    } catch (e) {
      console.error(`[${++n}/${pairs.length}] FAILED ${a.id} x ${b.id}: ${e instanceof Error ? e.message : e}`);
    }
  },
  () => write("data/dates.json", dates),
);
write("data/dates.json", dates);

const both = people.filter((p) => p.sources.linkedin.ok && p.sources.instagram.ok).length;
console.log(`\nSummary: ${people.length} people, ${both} with both sources ok, ${analyzed.length} analyzed, ${dates.length} dates`);
const missing = people.filter((p) => !p.linkedinUrl || !p.instagramUrl);
if (missing.length) throw new Error(`People missing a source URL: ${missing.map((p) => p.id).join(", ")}`);
