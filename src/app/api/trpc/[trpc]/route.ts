import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@/server/router";

export const maxDuration = 300;

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () => ({ ip: req.headers.get("x-real-ip") || req.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim() || "local" }),
    responseMeta: ({ type, errors, eagerGeneration }) =>
      type === "query" && !errors.length && !eagerGeneration
        ? { headers: { "cache-control": "public, s-maxage=3600, stale-while-revalidate=86400" } }
        : {},
  });

export { handler as GET, handler as POST };
