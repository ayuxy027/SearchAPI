import Link from "next/link";
import { loadDates, loadPeople } from "@/server/data";
import { Avatar, ScoreBar } from "../ui";

export const dynamic = "force-dynamic";

export default function DatesPage() {
  const byId = new Map(loadPeople().map((p) => [p.id, p]));
  const dates = loadDates().sort((x, y) => y.verdict.score - x.verdict.score);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">All agent dates</h1>
        <p className="text-zinc-500">{dates.length} dates, best matches first.</p>
      </div>
      <ul className="divide-y divide-zinc-200 rounded-2xl border border-zinc-200 bg-white">
        {dates.map((d) => {
          const a = byId.get(d.a), b = byId.get(d.b);
          if (!a || !b) return null;
          return (
            <li key={`${d.a}-${d.b}`}>
              <Link href={`/date/${d.a}/${d.b}`} className="flex items-center gap-4 p-4 hover:bg-zinc-50">
                <div className="flex -space-x-3"><Avatar p={a} size={40} /><Avatar p={b} size={40} /></div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold">{a.name} <span className="text-rose-500">♥</span> {b.name}</div>
                  <div className="truncate text-sm text-zinc-500">{d.verdict.summary}</div>
                </div>
                <ScoreBar score={d.verdict.score} />
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
