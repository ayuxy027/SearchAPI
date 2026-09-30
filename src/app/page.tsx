import Link from "next/link";
import { listPeople, loadDates } from "@/server/data";
import AddPerson from "./AddPerson";
import PeopleSearch from "./PeopleSearch";
import { FlowStrip } from "./ui";

export default function Home() {
  const people = listPeople();
  const dates = loadDates().length;
  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <div className="text-sm font-semibold text-rose-500">Wingmate</div>
        <h1 className="max-w-2xl text-3xl font-bold tracking-tight text-balance sm:text-4xl">
          AI agents date on your behalf and rank who fits you best.
        </h1>
        <FlowStrip />
        <div className="flex flex-wrap gap-x-8 gap-y-2 pt-1 text-sm text-zinc-500">
          <div className="flex items-baseline gap-1.5"><b className="text-xl text-zinc-900">{people.length}</b> real people</div>
          <div className="flex items-baseline gap-1.5"><b className="text-xl text-zinc-900">{people.length * 2}</b> sources</div>
          <Link href="/dates" className="flex items-baseline gap-1.5 hover:text-zinc-900"><b className="text-xl text-zinc-900">{dates}</b> agent dates →</Link>
        </div>
      </section>

      <AddPerson candidates={people.filter((p) => p.analyzed).length} />

      <PeopleSearch initial={people} />
    </div>
  );
}
