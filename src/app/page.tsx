import Link from "next/link";
import { listPeople, loadDates } from "@/server/data";
import AddPerson from "./AddPerson";
import PeopleSearch from "./PeopleSearch";
import { FlowStrip } from "./ui";

export default function Home() {
  const people = listPeople();
  const dates = loadDates().length;
  return (
    <div className="space-y-12">
      <section className="space-y-5">
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight">
          Every person gets an AI agent. The agents go on dates. You get a ranked list of who fits you best.
        </h1>
        <FlowStrip />
        <div className="flex gap-8 text-sm text-zinc-600">
          <span><b className="text-2xl text-zinc-900">{people.length}</b> real people</span>
          <span><b className="text-2xl text-zinc-900">{people.length * 2}</b> sources (LinkedIn + Instagram each)</span>
          <Link href="/dates" className="hover:text-zinc-900"><b className="text-2xl text-zinc-900">{dates}</b> agent dates →</Link>
        </div>
      </section>

      <AddPerson candidates={people.filter((p) => p.analyzed).length} />

      <PeopleSearch initial={people} />
    </div>
  );
}
