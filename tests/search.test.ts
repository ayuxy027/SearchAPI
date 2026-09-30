import { describe, expect, it } from "vitest";
import { normalize, search, toDoc, tokenize } from "@/server/search";
import { person } from "./fixtures";

const people = [
  person("ana", "Ana Ruiz", "Product Designer at Figma", ["Trail running", "Ceramics"]),
  person("ben", "Ben Cole", "Backend Engineer", ["Product design", "Running"]),
  person("cy", "Cy Park", "Chef", ["Wine"]),
];
const docs = people.map(toDoc);

describe("search helpers", () => {
  it("normalizes and tokenizes queries", () => {
    expect(normalize("  Trail   RUNNING ")).toBe("trail running");
    expect(tokenize("  a  b ")).toEqual(["a", "b"]);
    expect(tokenize("   ")).toEqual([]);
  });

  it("returns everything for an empty query and ranks name/headline hits above signal hits", () => {
    expect(search(people, docs, " ")).toHaveLength(3);
    const r = search(people, docs, "design");
    expect(r.map((p) => p.id)).toEqual(["ana", "ben"]);
    expect(r[1].matched).toEqual(["Product design"]);
  });

  it("requires every token to match and reports matched signals", () => {
    expect(search(people, docs, "running ceramics").map((p) => p.id)).toEqual(["ana"]);
    expect(search(people, docs, "running wine")).toEqual([]);
  });
});
