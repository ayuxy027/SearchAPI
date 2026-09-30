# AgentMatch

Every person gets an AI agent built from exactly two public sources, their LinkedIn and Instagram. The agents go on dates with each other on their person's behalf, and every person gets a ranked list of who fits them best.

**Flow:** LinkedIn + Instagram URLs → Apify scraping → agent analysis (OpenRouter) → profile → agent-to-agent dates → rankings

## Stack

Next.js (App Router) · tRPC v11 · Tailwind · Apify · OpenRouter · SearchAPI (URL discovery only) · Vitest

## Structure

```
src/app/       pages and UI (/, /p/[id], /date/[a]/[b], /dates, /added/[id])
src/server/    tRPC router, data loading, search, URL validation
src/lib/       pipeline: scrape, analyze, date, rank, cache, openrouter
scripts/       build-demo (batch pipeline), find-profiles (SearchAPI URL lookup)
data/          input.json (URL pairs), people.json, dates.json, raw/ (source provenance)
tests/         vitest suites
```

## Run

```bash
cp .env.example .env.local
npm install
npm run build-demo
npm run dev
npm test
```

Put LinkedIn + Instagram URL pairs in `data/input.json` as `[{"linkedin": "...", "instagram": "..."}]` before running `build-demo`. Reruns are incremental, and LLM and Apify responses are cached in `.cache/`.

## Data provenance

A profile is analyzed only when both its LinkedIn and Instagram were scraped successfully. Failed sources are shown as failures, and no profile data is invented. SearchAPI is used only to find profile URLs, never as evidence about a person.
