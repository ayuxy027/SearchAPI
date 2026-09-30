import { notFound } from "next/navigation";
import { loadDates, loadPeople, lite } from "@/server/data";
import { rankFor } from "@/lib/rank";
import { ProfileView } from "../../ui";

export const dynamicParams = false;

export const generateStaticParams = () => loadPeople().map((p) => ({ id: p.id }));

export async function generateMetadata({ params }: PageProps<"/p/[id]">) {
  const { id } = await params;
  return { title: loadPeople().find((p) => p.id === id)?.name ?? "Not found" };
}

export default async function ProfilePage({ params }: PageProps<"/p/[id]">) {
  const { id } = await params;
  const people = loadPeople();
  const person = people.find((p) => p.id === id);
  if (!person) notFound();
  const rankings = person.analysis ? rankFor(id, loadDates()) : [];
  return (
    <ProfileView
      person={person}
      rankings={rankings}
      people={Object.fromEntries(people.map((p) => [p.id, lite(p)]))}
      dateHref={(o) => `/date/${id}/${o}`}
    />
  );
}
