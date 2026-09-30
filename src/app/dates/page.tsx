import { loadDates, loadPeople, lite } from "@/server/data";
import DatesList from "./DatesList";

export const metadata = { title: "All dates" };

export default function DatesPage() {
  const byId = new Map(loadPeople().map((p) => [p.id, lite(p)]));
  const rows = [...loadDates()]
    .sort((x, y) => y.verdict.score - x.verdict.score)
    .flatMap((d) => {
      const a = byId.get(d.a), b = byId.get(d.b);
      return a && b ? [{ a, b, score: d.verdict.score, summary: d.verdict.summary }] : [];
    });
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">All agent dates</h1>
        <p className="text-zinc-500">{rows.length} dates, best matches first.</p>
      </div>
      <DatesList rows={rows} />
    </div>
  );
}
