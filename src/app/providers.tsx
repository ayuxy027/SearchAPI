"use client";
import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchStreamLink, httpLink, splitLink } from "@trpc/client";
import { trpc } from "./trpc";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { staleTime: Infinity, gcTime: 10 * 60_000, refetchOnWindowFocus: false, retry: 1 } } }),
  );
  const [client] = useState(() =>
    trpc.createClient({
      links: [
        splitLink({
          condition: (op) => op.type === "mutation",
          true: httpBatchStreamLink({ url: "/api/trpc" }),
          false: httpLink({ url: "/api/trpc" }),
        }),
      ],
    }),
  );
  return (
    <trpc.Provider client={client} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}
