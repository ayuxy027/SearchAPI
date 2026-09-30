import Link from "next/link";
import { listPeople, loadDates } from "@/server/data";
import AddPerson from "./AddPerson";
import { Avatar, FlowStrip, SourceLink } from "./ui";

export const dynamic = "force-dynamic";

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

      <section>
        <h2 className="mb-4 text-2xl font-bold tracking-tight">People</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {people.map((p) => (
            <div key={p.id} className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-5 transition hover:border-zinc-400 hover:shadow-sm">
              <Link href={`/p/${p.id}`} className="flex items-center gap-4">
                <Avatar p={p} size={64} />
                <div className="min-w-0">
                  <div className="font-semibold">{p.name}</div>
                  <div className="line-clamp-2 text-sm text-zinc-500">{p.headline}</div>
                </div>
              </Link>
              <div className="flex gap-2">
                <SourceLink kind="linkedin" url={p.linkedinUrl} ok={p.linkedinOk} />
                <SourceLink kind="instagram" url={p.instagramUrl} ok={p.instagramOk} />
              </div>
              {p.topMatch ? (
                <Link href={`/date/${p.id}/${p.topMatch.id}`} className="mt-auto flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-2 text-sm hover:bg-rose-100">
                  <span className="text-rose-500">♥</span> Top match:
                  <Avatar p={p.topMatch} size={24} />
                  <span className="font-medium">{p.topMatch.name}</span>
                  <span className="ml-auto font-mono font-semibold">{Math.round(p.topMatch.score)}</span>
                </Link>
              ) : (
                <div className="mt-auto text-sm text-zinc-400">{p.analyzed ? "No dates yet" : "Not analyzed (source failed)"}</div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
