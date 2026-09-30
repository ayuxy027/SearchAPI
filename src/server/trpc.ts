import { initTRPC } from "@trpc/server";

const t = initTRPC.context<{ ip: string }>().create();
export const router = t.router;
export const publicProcedure = t.procedure;
