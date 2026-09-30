import { existsSync } from "node:fs";
import { searchWeb } from "../src/lib/searchapi";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");

for (const name of process.argv.slice(2)) {
  const [li, ig] = await Promise.all([
    searchWeb(`${name} site:linkedin.com/in`),
    searchWeb(`${name} site:instagram.com`),
  ]);
  console.log(`\n${name}`);
  li.filter((u) => /linkedin\.com\/in\//.test(u)).slice(0, 3).forEach((u) => console.log(`  linkedin:  ${u}`));
  ig.filter((u) => /instagram\.com\/[^/]+\/?$/.test(u)).slice(0, 3).forEach((u) => console.log(`  instagram: ${u}`));
}
