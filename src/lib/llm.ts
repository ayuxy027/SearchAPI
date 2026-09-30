import { cached } from "./cache";

const RETRYABLE = new Set([408, 409, 429, 500, 502, 503, 504]);

function provider() {
  if (process.env.POOLSIDE_API_KEY)
    return { name: "Poolside", url: "https://inference.poolside.ai/v1/chat/completions", key: process.env.POOLSIDE_API_KEY, model: process.env.LLM_MODEL || "poolside/laguna-s-2.1", extra: { reasoning: { enabled: false } } };
  if (process.env.OPENROUTER_API_KEY)
    return { name: "OpenRouter", url: "https://openrouter.ai/api/v1/chat/completions", key: process.env.OPENROUTER_API_KEY, model: process.env.LLM_MODEL || "openai/gpt-4.1-mini", extra: {} };
  throw new Error("No LLM key set: add POOLSIDE_API_KEY or OPENROUTER_API_KEY");
}

export const chatJSON = <T>(system: string, user: string): Promise<T> => {
  const p = provider();
  return cached("llm", [p.model, system, user], () => callJSON<T>(p, system, user));
};

async function callJSON<T>({ name, url, key, model, extra }: ReturnType<typeof provider>, system: string, user: string): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < 4; attempt++) {
    if (attempt) await new Promise((r) => setTimeout(r, 2 ** attempt * 500 + Math.random() * 500));
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          ...extra,
          temperature: 0.7,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
        }),
        signal: AbortSignal.timeout(90_000),
      });
      if (!res.ok) {
        const err = new Error(`${name} ${res.status}: ${(await res.text()).slice(0, 500)}`);
        if (!RETRYABLE.has(res.status)) throw Object.assign(err, { fatal: true });
        throw err;
      }
      const data = await res.json();
      const text: string | undefined = data.choices?.[0]?.message?.content;
      if (!text) throw new Error(`${name} returned no content: ${JSON.stringify(data).slice(0, 500)}`);
      const start = text.indexOf("{");
      const end = text.lastIndexOf("}");
      return JSON.parse(start >= 0 && end > start ? text.slice(start, end + 1) : text) as T;
    } catch (e) {
      lastErr = e;
      if ((e as { fatal?: boolean }).fatal) break;
    }
  }
  throw new Error(`chatJSON failed: ${lastErr instanceof Error ? lastErr.message : String(lastErr)}`);
}
