import { readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { LEGACY_ROUTES, redirectsForRemovedPages } from "@/data/legacyRoutes";
import { navItems, NEW_PLAYTHROUGH_HREF, PLAYTHROUGHS_HREF } from "@/data/nav";

const finalPaths = new Set([
  "/",
  PLAYTHROUGHS_HREF,
  NEW_PLAYTHROUGH_HREF,
  ...navItems.map((item) => item.href),
]);

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

const legacyPages = pagePaths(
  path.resolve(import.meta.dirname, "../../src/app/(legacy)"),
);

describe("legacy routes", () => {
  it("sends every moved page to a final route", () => {
    const targets = LEGACY_ROUTES.map(
      ({ to }) => new URL(to, "https://x.invalid").pathname,
    );

    expect(targets.filter((target) => !finalPaths.has(target))).toEqual([]);
  });

  it("never redirects away from a final route", () => {
    expect(LEGACY_ROUTES.filter(({ from }) => finalPaths.has(from))).toEqual(
      [],
    );
  });

  it("lists each old address once", () => {
    const addresses = LEGACY_ROUTES.map(({ from }) => from);

    expect(new Set(addresses).size).toBe(addresses.length);
  });

  it("covers every page still in the legacy group that has no final address", () => {
    const redirected = new Set(LEGACY_ROUTES.map(({ from }) => from));

    const unhandled = legacyPages.filter(
      (page) => !finalPaths.has(page) && !redirected.has(page),
    );

    expect(unhandled).toEqual([]);
  });

  it("serves no redirect while the old page still exists", () => {
    expect(redirectsForRemovedPages(() => true)).toEqual([]);
  });

  it("redirects an old address permanently once its page is gone", () => {
    const removed = new Set(["/dashboard", "/farm/animals"]);

    expect(redirectsForRemovedPages((route) => !removed.has(route))).toEqual([
      { source: "/dashboard", destination: "/overview", permanent: true },
      {
        source: "/farm/animals",
        destination: "/farm?tab=animals",
        permanent: true,
      },
    ]);
  });
});
