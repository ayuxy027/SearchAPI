import type { Person } from "@/lib/types";

export type SearchDoc = { head: string; signals: { text: string; lc: string }[] };

export const normalize = (q: string) => q.toLowerCase().replace(/\s+/g, " ").trim();

export const tokenize = (q: string) => normalize(q).split(" ").filter(Boolean);

export function toDoc(p: Person): SearchDoc {
  const a = p.analysis;
  const texts = a ? [...new Set([...a.interests, ...a.hobbies, ...a.lifestyle, ...a.personality, ...a.needs].map((s) => s.text))] : [];
  return { head: normalize(`${p.name} ${p.headline ?? ""}`), signals: texts.map((text) => ({ text, lc: normalize(text) })) };
}

export function scoreDoc(doc: SearchDoc, tokens: string[], limit = 3) {
  let rank = 0;
  const matched = new Set<string>();
  for (const t of tokens) {
    const hits = doc.signals.filter((s) => s.lc.includes(t));
    if (doc.head.includes(t)) continue;
    if (!hits.length) return null;
    rank = 1;
    hits.forEach((s) => matched.add(s.text));
  }
  return { rank, matched: [...matched].slice(0, limit) };
}

export function search<T>(items: T[], docs: SearchDoc[], q: string): (T & { matched?: string[] })[] {
  const tokens = tokenize(q);
  if (!tokens.length) return items as (T & { matched?: string[] })[];
  return items
    .flatMap((item, i) => {
      const s = scoreDoc(docs[i], tokens);
      return s ? [{ rank: s.rank, item: { ...item, matched: s.matched } }] : [];
    })
    .sort((x, y) => x.rank - y.rank)
    .map((h) => h.item);
}
