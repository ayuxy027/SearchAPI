"use client";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { keepPreviousData } from "@tanstack/react-query";
import type { PersonListItem } from "@/server/data";
import { trpc } from "./trpc";
import { PersonCard } from "./ui";

export function useDebounced<T>(value: T, ms = 250) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export function SearchBox({ q, setQ, placeholder }: { q: string; setQ: (q: string) => void; placeholder: string }) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      e.preventDefault();
      ref.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return (
    <div className="relative">
      <input
        ref={ref}
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => e.key === "Escape" && setQ("")}
        placeholder={placeholder}
        aria-label={placeholder}
        className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 pr-10 outline-none focus:border-zinc-900"
      />
      <kbd className="absolute top-1/2 right-3 -translate-y-1/2 rounded border border-zinc-300 px-1.5 text-xs text-zinc-400">/</kbd>
    </div>
  );
}

const noop = () => () => {};

export default function PeopleSearch({ initial }: { initial: PersonListItem[] }) {
  const urlQ = useSyncExternalStore(noop, () => new URLSearchParams(window.location.search).get("q") ?? "", () => "");
  const [typed, setQ] = useState<string | null>(null);
  const q = typed ?? urlQ;
  const dq = useDebounced(q.trim());
  const search = trpc.people.search.useQuery({ q: dq }, { enabled: dq !== "", placeholderData: keepPreviousData });
  const items = dq ? (search.data ?? initial) : initial;

  const touched = typed !== null;
  useEffect(() => {
    if (touched) history.replaceState(null, "", dq ? `?q=${encodeURIComponent(dq)}` : window.location.pathname);
  }, [dq, touched]);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-2xl font-bold tracking-tight">People</h2>
        <span className="text-sm text-zinc-500">
          {dq ? `${items.length} match${items.length === 1 ? "" : "es"} for “${dq}”` : `${items.length} people`}
          {search.isFetching && " · searching…"}
        </span>
      </div>
      <SearchBox q={q} setQ={setQ} placeholder="Search people, interests, hobbies… (press / )" />
      {search.error && dq && <p className="text-sm text-red-600">Search failed: {search.error.message}</p>}
      {items.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((p) => <PersonCard key={p.id} p={p} />)}
        </div>
      ) : (
        <p className="rounded-xl bg-zinc-100 p-6 text-center text-zinc-500">No matches for “{dq}”.</p>
      )}
    </section>
  );
}
