import fs from "node:fs";
import path from "node:path";
import type { DateResult, Person } from "@/lib/types";
import { rankFor } from "@/lib/rank";

function read<T>(file: string): T[] {
  try {
    return JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", file), "utf8"));
  } catch {
    return [];
  }
}

export const loadPeople = () => read<Person>("people.json");
export const loadDates = () => read<DateResult>("dates.json");

export function findDate(dates: DateResult[], x: string, y: string) {
  return dates.find((d) => (d.a === x && d.b === y) || (d.a === y && d.b === x));
}

export type PersonLite = { id: string; name: string; photo?: string; headline?: string };
export const lite = (p: Person): PersonLite => ({ id: p.id, name: p.name, photo: p.photo, headline: p.headline });

export function listPeople() {
  const people = loadPeople();
  const dates = loadDates();
  const byId = new Map(people.map((p) => [p.id, p]));
  return people.map((p) => {
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
}
export type PersonListItem = ReturnType<typeof listPeople>[number];
