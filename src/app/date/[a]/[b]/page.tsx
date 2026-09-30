import Link from "next/link";
import { notFound } from "next/navigation";
import { findDate, loadDates, loadPeople, lite } from "@/server/data";
import { DateView } from "../../../ui";

export const dynamic = "force-dynamic";

export default async function DatePage({ params }: PageProps<"/date/[a]/[b]">) {
  const { a, b } = await params;
  const date = findDate(loadDates(), a, b);
  const people = loadPeople();
  const pa = people.find((p) => p.id === date?.a);
  const pb = people.find((p) => p.id === date?.b);
  if (!date || !pa || !pb) notFound();
  return (
    <div className="space-y-6">
      <Link href={`/p/${a}`} className="text-sm text-zinc-500 hover:text-zinc-900">← Back to profile</Link>
      <DateView date={date} a={lite(pa)} b={lite(pb)} />
    </div>
  );
}
