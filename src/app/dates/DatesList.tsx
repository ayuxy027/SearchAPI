"use client";
import Link from "next/link";
import { useState } from "react";
import type { PersonLite } from "@/server/data";
import { SearchBox, useDebounced } from "../PeopleSearch";
import { Avatar, ScoreBar, idx } from "../ui";

type Row = { a: PersonLite; b: PersonLite; score: number; summary: string };

export default function DatesList({ rows }: { rows: Row[] }) {
  const [q, setQ] = useState("");
  const dq = useDebounced(q.trim().toLowerCase());
  const shown = dq ? rows.filter((r) => `${r.a.name} ${r.b.name}`.toLowerCase().includes(dq)) : rows;
  return (
    <div className="space-y-4">
      <SearchBox q={q} setQ={setQ} placeholder="Filter dates by name… (press / )" />
      {dq && <p className="text-sm text-zinc-500">{shown.length} of {rows.length} dates</p>}
      {shown.length ? (
        <ul className="stagger divide-y divide-zinc-200 rounded-2xl border border-zinc-200 bg-white">
          {shown.map(({ a, b, score, summary }, i) => (
            <li key={`${a.id}-${b.id}`} style={idx(i)}>
              <Link href={`/date/${a.id}/${b.id}`} className="flex items-center gap-4 p-4 transition-colors hover:bg-zinc-50">
                <div className="flex -space-x-3"><Avatar p={a} size={40} /><Avatar p={b} size={40} /></div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold">{a.name} <span className="text-rose-500">♥</span> {b.name}</div>
                  <div className="truncate text-sm text-zinc-500">{summary}</div>
                </div>
                <ScoreBar score={score} />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-xl bg-zinc-100 p-6 text-center text-zinc-500">{dq ? `No dates match “${dq}”.` : "No dates yet."}</p>
      )}
    </div>
  );
}
