import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const SRC = path.resolve(import.meta.dirname, "../../src");

const sourceFiles = (directory: string): string[] =>
  readdirSync(directory).flatMap((name) => {
    const entry = path.join(directory, name);
    if (statSync(entry).isDirectory()) return sourceFiles(entry);
    return entry.endsWith(".tsx") ? [entry] : [];
  });

/** Pictures in the page chrome are on screen at once, so they load at once. */
const EAGER = ["components/shell/", "components/landing/LandingHeader.tsx"];

describe("pictures", () => {
  it("load lazily everywhere but in the page chrome", () => {
    const eager: string[] = [];
    for (const file of sourceFiles(SRC)) {
      const relative = path.relative(SRC, file);
      if (EAGER.some((prefix) => relative.startsWith(prefix))) continue;
      const text = readFileSync(file, "utf8");
      for (const match of text.matchAll(/<img\b[^>]*>/g)) {
        if (!/loading=["']lazy["']/.test(match[0])) eager.push(relative);
      }
    }

    expect(eager).toEqual([]);
  });
});
