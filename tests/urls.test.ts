import { expect, it } from "vitest";
import { INSTAGRAM_RE, LINKEDIN_RE } from "@/server/urls";
import { instagramHandle, isLinkedinProfile } from "@/lib/scrape";

it("accepts only LinkedIn /in/ profiles and Instagram profile handles", () => {
  expect(LINKEDIN_RE.test("https://www.linkedin.com/in/jane-doe")).toBe(true);
  expect(LINKEDIN_RE.test("https://in.LinkedIn.com/in/jane")).toBe(true);
  expect(LINKEDIN_RE.test("https://www.linkedin.com/company/acme")).toBe(false);
  expect(isLinkedinProfile("https://linkedin.com/in/jane")).toBe(true);
  expect(isLinkedinProfile("https://evil.com/linkedin.com/in/jane")).toBe(false);

  expect(INSTAGRAM_RE.test("https://www.instagram.com/jane.doe_")).toBe(true);
  expect(INSTAGRAM_RE.test("https://www.instagram.com/p/C0abc/")).toBe(false);
  expect(INSTAGRAM_RE.test("https://www.instagram.com/reel/C0abc")).toBe(false);
  expect(INSTAGRAM_RE.test("https://www.instagram.com/explore")).toBe(false);
  expect(INSTAGRAM_RE.test("https://www.instagram.com/pablo")).toBe(true);
  expect(instagramHandle("https://www.instagram.com/jane.doe_/?hl=en")).toBe("jane.doe_");
  expect(instagramHandle("https://www.instagram.com/p/C0abc/")).toBeNull();
  expect(instagramHandle("https://notinstagram.com/jane")).toBeNull();
});
