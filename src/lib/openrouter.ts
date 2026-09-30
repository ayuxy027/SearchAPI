import { cached } from "./cache";

const RETRYABLE = new Set([408, 409, 429, 500, 502, 503, 504]);

export const chatJSON = <T>(system: string, user: string): Promise<T> =>
  cached("llm", [process.env.OPENROUTER_MODEL, system, user], () => callJSON<T>(system, user));

async function callJSON<T>(system: string, user: string): Promise<T> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("OPENROUTER_API_KEY is not set");
  const model = process.env.OPENROUTER_MODEL || "anthropic/claude-haiku-4.5";
  let lastErr: unknown;
  for (let attempt = 0; attempt < 4; attempt++) {
    if (attempt) await new Promise((r) => setTimeout(r, 2 ** attempt * 500 + Math.random() * 500));
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
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
        const err = new Error(`OpenRouter ${res.status}: ${(await res.text()).slice(0, 500)}`);
        if (!RETRYABLE.has(res.status)) throw Object.assign(err, { fatal: true });
        throw err;
      }
      const data = await res.json();
      const text: string | undefined = data.choices?.[0]?.message?.content;
      if (!text) throw new Error(`OpenRouter returned no content: ${JSON.stringify(data).slice(0, 500)}`);
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
