import { describe, expect, it } from "vitest";
import { APP_NAME, getPageTitle } from "@/data/nav";

describe("getPageTitle", () => {
  it("names a page that is in the sidebar", () => {
    expect(getPageTitle("/settings")).toBe("Settings");
    expect(getPageTitle("/community-center")).toBe("Community Center");
  });

  it("names the playthrough pages, which are not in the sidebar", () => {
    expect(getPageTitle("/playthroughs")).toBe("My playthroughs");
    expect(getPageTitle("/playthroughs/new")).toBe("New playthrough");
  });

  it("names a page by its sidebar item when the address goes deeper", () => {
    expect(getPageTitle("/collections/fish")).toBe("Collections");
  });

  it("falls back to the app name", () => {
    expect(getPageTitle("/nowhere")).toBe(APP_NAME);
  });
});
