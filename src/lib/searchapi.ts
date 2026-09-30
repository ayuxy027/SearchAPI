export async function searchWeb(q: string): Promise<string[]> {
  const key = process.env.SEARCHAPI_KEY;
  if (!key) throw new Error("SEARCHAPI_KEY is not set");
  const res = await fetch(
    `https://www.searchapi.io/api/v1/search?engine=google&q=${encodeURIComponent(q)}`,
    { headers: { Authorization: `Bearer ${key}` } },
  );
  if (!res.ok) throw new Error(`SearchAPI ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = await res.json();
  return (data.organic_results ?? []).map((r: { link: string }) => r.link).filter(Boolean);
}
