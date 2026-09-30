import fs from "node:fs";
import path from "node:path";
import type { DateResult, Person } from "@/lib/types";
import { rankFor } from "@/lib/rank";

const file = (f: string) => path.join(process.cwd(), "data", f);
const mtime = (f: string) => fs.statSync(file(f), { throwIfNoEntry: false })?.mtimeMs ?? 0;

function read<T>(f: string): T[] {
  try {
    return JSON.parse(fs.readFileSync(file(f), "utf8"));
  } catch {
    return [];
  }
}

export type PersonLite = { id: string; name: string; photo?: string; headline?: string };
export const lite = (p: Person): PersonLite => ({ id: p.id, name: p.name, photo: p.photo, headline: p.headline });

function build() {
  const people = read<Person>("people.json");
  const dates = read<DateResult>("dates.json");
  const byId = new Map(people.map((p) => [p.id, p]));
  const list = people.map((p) => {
    const top = p.analysis ? rankFor(p.id, dates)[0] : undefined;
    const tp = top && byId.get(top.candidate);
    return {
      ...lite(p),
      linkedinUrl: p.linkedinUrl,
      instagramUrl: p.instagramUrl,
      linkedinOk: p.sources.linkedin.ok,
      instagramOk: p.sources.instagram.ok,
      analyzed: !!p.analysis,
      topMatch: tp ? { ...lite(tp), score: top.score } : null,
    };
  });
  const index = people.map((p) => {
    const a = p.analysis;
    const texts = a ? [...new Set([...a.interests, ...a.hobbies, ...a.lifestyle, ...a.personality, ...a.needs].map((s) => s.text))] : [];
    return { head: `${p.name} ${p.headline ?? ""}`.toLowerCase(), signals: texts.map((text) => ({ text, lc: text.toLowerCase() })) };
  });
  return { people, dates, list, index };
}

let cache: { key: string; data: ReturnType<typeof build> } | undefined;
function data() {
  const key = `${mtime("people.json")}:${mtime("dates.json")}`;
  if (cache?.key !== key) cache = { key, data: build() };
  return cache.data;
}

export const loadPeople = () => data().people;
export const loadDates = () => data().dates;
export const listPeople = () => data().list;
export type PersonListItem = ReturnType<typeof listPeople>[number];
export type SearchItem = PersonListItem & { matched?: string[] };

export function searchPeople(q: string): SearchItem[] {
  const { list, index } = data();
  const needle = q.toLowerCase();
  if (!needle) return list;
  const hits = list.flatMap((item, i) => {
    const { head, signals } = index[i];
    const matched = signals.filter((s) => s.lc.includes(needle)).slice(0, 3).map((s) => s.text);
    const rank = head.includes(needle) ? 0 : matched.length ? 1 : -1;
    return rank < 0 ? [] : [{ rank, item: { ...item, matched } }];
  });
  return hits.sort((x, y) => x.rank - y.rank).map((h) => h.item);
}

export function findDate(dates: DateResult[], x: string, y: string) {
  return dates.find((d) => (d.a === x && d.b === y) || (d.a === y && d.b === x));
}
