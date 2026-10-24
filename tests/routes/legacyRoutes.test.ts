import { readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { LEGACY_ROUTES, legacyRedirects } from "@/data/legacyRoutes";
import { navItems, NEW_PLAYTHROUGH_HREF, PLAYTHROUGHS_HREF } from "@/data/nav";

const ROUTE_GROUP = /^\(.*\)$/;

const pagePaths = (directory: string, segments: string[] = []): string[] =>
  readdirSync(directory).flatMap((name) => {
    const entry = path.join(directory, name);
    if (!statSync(entry).isDirectory()) {
      return name === "page.tsx" ? [`/${segments.join("/")}`] : [];
    }
    return pagePaths(
      entry,
      ROUTE_GROUP.test(name) ? segments : [...segments, name],
    );
  });

const appPages = new Set(
  pagePaths(path.resolve(import.meta.dirname, "../../src/app")),
);

const finalPaths = new Set([
  "/",
  PLAYTHROUGHS_HREF,
  NEW_PLAYTHROUGH_HREF,
  ...navItems.map((item) => item.href),
]);

describe("legacy routes", () => {
  it("sends every moved page to a page that exists", () => {
    const targets = LEGACY_ROUTES.map(
      ({ to }) => new URL(to, "https://x.invalid").pathname,
    );

    expect(targets.filter((target) => !finalPaths.has(target))).toEqual([]);
    expect(targets.filter((target) => !appPages.has(target))).toEqual([]);
  });

  it("never redirects away from a page that exists", () => {
    expect(LEGACY_ROUTES.filter(({ from }) => appPages.has(from))).toEqual([]);
  });

  it("lists each old address once", () => {
    const addresses = LEGACY_ROUTES.map(({ from }) => from);

    expect(new Set(addresses).size).toBe(addresses.length);
  });

  it("has a page for every address in the navigation", () => {
    expect(navItems.filter((item) => !appPages.has(item.href))).toEqual([]);
  });

  it("redirects every old address permanently", () => {
    const redirects = legacyRedirects();

    expect(redirects).toHaveLength(LEGACY_ROUTES.length);
    expect(redirects.every((redirect) => redirect.permanent)).toBe(true);
    expect(redirects).toContainEqual({
      source: "/dashboard",
      destination: "/overview",
      permanent: true,
    });
    expect(redirects).toContainEqual({
      source: "/farm/animals",
      destination: "/farm?tab=animals",
      permanent: true,
    });
    expect(redirects).toContainEqual({
      source: "/joja",
      destination: "/community-center",
      permanent: true,
    });
  });
});
