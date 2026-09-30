import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { beforeAll, expect, it } from "vitest";
import { cached } from "@/lib/cache";

beforeAll(() => {
  process.env.CACHE_DIR = mkdtempSync(path.join(tmpdir(), "am-cache-"));
});

it("dedupes concurrent calls, memoizes results and never caches failures", async () => {
  let calls = 0;
  const fn = async () => ({ n: ++calls });
  const [a, b] = await Promise.all([cached("t", "k", fn), cached("t", "k", fn)]);
  expect(calls).toBe(1);
  expect(a).toBe(b);
  expect(await cached("t", "k", fn)).toEqual({ n: 1 });

  await expect(cached("t", "bad", async () => { throw new Error("boom"); })).rejects.toThrow("boom");
  expect(await cached("t", "bad", async () => "ok")).toBe("ok");
});
