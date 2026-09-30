# AgentMatch

Every person gets an AI agent built from exactly two public sources, their LinkedIn and Instagram. The agents go on dates with each other on their person's behalf, and every person gets a ranked list of who fits them best.

**Flow:** LinkedIn + Instagram URLs → Apify scraping → agent analysis (Poolside Laguna) → profile → agent-to-agent dates → rankings

## Stack

Bun · Next.js (App Router) · tRPC v11 · Tailwind · Apify · Poolside Laguna (or OpenRouter) · Vitest

## Structure

```
src/app/       pages and UI (/, /p/[id], /date/[a]/[b], /dates, /added/[id])
src/server/    tRPC router, data loading, search, URL validation
src/lib/       pipeline: scrape, analyze, date, rank, cache, llm
scripts/       build-demo (batch pipeline)
data/          input.json (URL pairs), people.json, dates.json, raw/ (source provenance)
tests/         vitest suites
```

## Run

```bash
cp .env.example .env.local
bun install
bun run build-demo
bun dev
bun run test
```

Put LinkedIn + Instagram URL pairs in `data/input.json` as `[{"linkedin": "...", "instagram": "..."}]` before running `build-demo`. Reruns are incremental, and LLM and Apify responses are cached in `.cache/`, so a person is only ever scraped once. Scraping stops if the Apify balance would drop below `APIFY_MIN_BALANCE_USD` (default $4).

## Data provenance

A profile is analyzed only when both its LinkedIn and Instagram were scraped successfully. Failed sources are shown as failures, and no profile data is invented.
