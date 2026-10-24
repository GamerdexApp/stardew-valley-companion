import { describe, expect, it } from "vitest";
import { APP_NAME, getPageTitle, navGroups, navGroupsFor } from "@/data/nav";

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

describe("the Community Center link", () => {
  const link = (route: "community-center" | "joja") =>
    navGroupsFor(route)
      .flatMap((group) => group.items)
      .find((item) => item.id === "communityCenter")!;

  it("is named Community Center on the Community Center route", () => {
    expect(link("community-center").label).toBe("Community Center");
    expect(navGroupsFor("community-center")).toBe(navGroups);
  });

  it("is named Joja Development on the Joja route, with the same address and its own icon", () => {
    expect(link("joja").label).toBe("Joja Development");
    expect(link("joja").href).toBe("/community-center");
    expect(link("joja").icon).not.toBe(link("community-center").icon);
  });

  it("changes only that link", () => {
    const names = (route: "community-center" | "joja") =>
      navGroupsFor(route)
        .flatMap((group) => group.items)
        .filter((item) => item.id !== "communityCenter")
        .map((item) => item.label);

    expect(names("joja")).toEqual(names("community-center"));
  });

  it("names the page by the route", () => {
    expect(getPageTitle("/community-center", "joja")).toBe("Joja Development");
    expect(getPageTitle("/community-center", "community-center")).toBe(
      "Community Center",
    );
    expect(getPageTitle("/farm", "joja")).toBe("Farm");
  });
});
