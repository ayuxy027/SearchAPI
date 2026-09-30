"use client";
import Link from "next/link";
import { use } from "react";
import { useAdded } from "../../AddPerson";
import { DateView, ProfileView } from "../../ui";

export default function AddedPage({ params, searchParams }: PageProps<"/added/[id]">) {
  const { id } = use(params);
  const { date: other } = use(searchParams);
  const r = useAdded().find((x) => x.person.id === id);
  if (!r) return <p className="text-zinc-500">Not found in this browser. <Link href="/" className="underline">Back</Link></p>;
  const people = Object.fromEntries([...r.candidates, r.person].map((p) => [p.id, { id: p.id, name: p.name, photo: p.photo, headline: p.headline }]));
  const date = typeof other === "string" && r.dates.find((d) => d.a === other || d.b === other);
  if (date) {
    return (
      <div className="space-y-6">
        <Link href={`/added/${id}`} className="text-sm text-zinc-500 hover:text-zinc-900">← Back to profile</Link>
        <DateView date={date} a={people[date.a]} b={people[date.b]} />
      </div>
    );
  }
  return <ProfileView person={r.person} rankings={r.rankings} people={people} dateHref={(o) => `/added/${id}?date=${o}`} />;
}
