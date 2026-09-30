import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure } from "./trpc";
import { findDate, lite, listPeople, loadDates, loadPeople } from "./data";
import { createPerson } from "@/lib/pipeline";
import { runDate } from "@/lib/date";
import { rankFor } from "@/lib/rank";
import type { DateResult } from "@/lib/types";

const linkedin = z
  .string()
  .trim()
  .regex(/^https?:\/\/([a-z]{2,3}\.)?linkedin\.com\/in\/[^/?#\s]+/i, "Must be a linkedin.com/in/… profile URL");
const instagram = z
  .string()
  .trim()
  .regex(/^https?:\/\/(www\.)?instagram\.com\/[A-Za-z0-9._]+/i, "Must be an instagram.com/<username> URL");

export const appRouter = router({
  people: router({
    list: publicProcedure.query(() => listPeople()),
    get: publicProcedure.input(z.string()).query(({ input }) => {
      const person = loadPeople().find((p) => p.id === input);
      if (!person) throw new TRPCError({ code: "NOT_FOUND" });
      return { person, rankings: person.analysis ? rankFor(person.id, loadDates()) : [] };
    }),
    add: publicProcedure.input(z.object({ linkedin, instagram })).mutation(async ({ input }) => {
      const people = loadPeople();
      const allDates = loadDates();
      const norm = (u: string) => u.toLowerCase().replace(/[?#].*$/, "").replace(/\/+$/, "").replace(/^https?:\/\/(www\.|[a-z]{2}\.)?/, "");
      const existing = people.find((p) => norm(p.linkedinUrl) === norm(input.linkedin));
      if (existing) {
        const dates = allDates.filter((d) => d.a === existing.id || d.b === existing.id);
        return { person: existing, dates, rankings: rankFor(existing.id, dates), candidates: people.map(lite), existing: true };
      }
      let person;
      try {
        person = await createPerson(input.linkedin, input.instagram);
      } catch (e) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `Agent analysis failed: ${(e as Error).message}` });
      }
      const ids = new Set(people.map((p) => p.id));
      for (let n = 2, base = person.id; ids.has(person.id); n++) person.id = `${base}-${n}`;
      if (!person.analysis) return { person, dates: [] as DateResult[], rankings: [], candidates: [], existing: false };
      const others = people.filter((p) => p.analysis);
      const dates = (await Promise.allSettled(others.map((o) => runDate(person, o))))
        .flatMap((r) => (r.status === "fulfilled" ? [r.value] : []));
      return { person, dates, rankings: rankFor(person.id, dates), candidates: others.map(lite), existing: false };
    }),
  }),
  dates: router({
    get: publicProcedure.input(z.object({ a: z.string(), b: z.string() })).query(({ input }) => {
      const date = findDate(loadDates(), input.a, input.b);
      if (!date) throw new TRPCError({ code: "NOT_FOUND" });
      return date;
    }),
  }),
});

export type AppRouter = typeof appRouter;
