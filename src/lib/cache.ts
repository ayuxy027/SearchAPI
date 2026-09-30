import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const MAX = 200;
const mem = new Map<string, unknown>();
const inflight = new Map<string, Promise<unknown>>();
const dir = () => process.env.CACHE_DIR || (process.env.VERCEL ? "/tmp/agentmatch-cache" : path.join(process.cwd(), ".cache"));

const remember = (k: string, v: unknown) => {
  mem.delete(k);
  mem.set(k, v);
  if (mem.size > MAX) mem.delete(mem.keys().next().value!);
};

export async function cached<T>(ns: string, key: unknown, fn: () => Promise<T>): Promise<T> {
  const k = `${ns}-${createHash("sha1").update(JSON.stringify(key)).digest("hex")}`;
  if (mem.has(k)) {
    const v = mem.get(k) as T;
    remember(k, v);
    return v;
  }
  const pending = inflight.get(k);
  if (pending) return pending as Promise<T>;
  const file = path.join(dir(), `${k}.json`);
  const p = (async () => {
    try {
      const raw = await readFile(file, "utf8");
      const v = JSON.parse(raw) as T;
      remember(k, v);
      return v;
    } catch (e) {
      if ((e as NodeJS.ErrnoException)?.code !== "ENOENT") throw e;
    }
    const v = await fn();
    remember(k, v);
    await mkdir(dir(), { recursive: true }).then(() => writeFile(file, JSON.stringify(v)));
    return v;
  })().finally(() => inflight.delete(k));
  inflight.set(k, p);
  return p;
}
