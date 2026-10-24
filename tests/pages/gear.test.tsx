import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act } from "react";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import type { AppData } from "@/types/app";
import { PlaythroughProvider } from "@/lib/contexts/PlaythroughContext";
import { UIProvider } from "@/lib/contexts/UIContext";
import { forgetMemoryState } from "@/lib/hooks/useMemoryState";
import { STORAGE_KEY } from "@/service/storage";
import { GearPage } from "@/comps/gear/GearPage";
import { ToastProvider } from "@/comps/ui/Toast";
import { emptyPlaythrough } from "../storage/fixtures";

const navigation = vi.hoisted(() => ({ search: "", replace: vi.fn() }));

vi.mock("next/navigation", () => ({
	useRouter: () => ({ replace: navigation.replace }),
	usePathname: () => "/gear",
	useSearchParams: () => new URLSearchParams(navigation.search),
}));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root;
let container: HTMLElement;

const seed = (data: AppData) => localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
const stored = () => JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null") as AppData;
const data = () => stored().playthroughs[0].data;

const withData = (change: (data: AppData["playthroughs"][number]["data"]) => void): AppData => {
	const playthrough = emptyPlaythrough();
	change(playthrough.data);
	return { playthroughs: [playthrough], activePlaythroughId: playthrough.id };
};

const mount = async () => {
	await act(async () => {
		root.render(
			<UIProvider>
				<ToastProvider>
					<PlaythroughProvider>
						<GearPage />
					</PlaythroughProvider>
				</ToastProvider>
			</UIProvider>
		);
	});
};

const text = () => container.textContent ?? "";
const compact = () => text().replace(/\s/g, "");
const click = async (element: Element | null | undefined) => {
	expect(element).toBeTruthy();
	await act(async () => {
		element!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
	});
};
const type = async (input: HTMLInputElement | null | undefined, value: string) => {
	expect(input).toBeTruthy();
	await act(async () => {
		Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(
			input!,
			value
		);
		input!.dispatchEvent(new Event("input", { bubbles: true }));
	});
};
const section = (title: string) =>
	[...container.querySelectorAll('[role="region"]')].find(
		(el) => el.querySelector("h2")?.textContent === title
	) as HTMLElement;
const search = (title: string) =>
	section(title).querySelector('input[type="search"]') as HTMLInputElement;
const names = (title: string) =>
	[...section(title).querySelectorAll("span.font-semibold")].map((el) => el.textContent!);
const tab = (label: string) =>
	[...container.querySelectorAll('[role="tab"]')].find((el) =>
		el.textContent?.startsWith(label)
	)!;
const flyout = () =>
	[...document.body.querySelectorAll("dialog")].find((el) =>
		el.textContent?.includes("Changes apply as you go")
	);
const flyoutRadio = (label: string) =>
	[...flyout()!.querySelectorAll('input[type="radio"]')].find((input) =>
		input.closest("label")?.textContent?.trim().startsWith(label)
	);

beforeEach(() => {
	forgetMemoryState();
	localStorage.clear();
	navigation.search = "";
	navigation.replace.mockReset();
	container = document.createElement("div");
	document.body.appendChild(container);
	root = createRoot(container);
});

afterEach(() => {
	act(() => root.unmount());
	container.remove();
	document.body.querySelectorAll("dialog").forEach((dialog) => dialog.remove());
});

describe("Gear page", () => {
	it("works with no playthrough and shows the counts of every tab and the total", async () => {
		await mount();

		expect(text()).toContain("257 items");
		for (const expected of [
			"Weapons62",
			"Footwear18",
			"Rings30",
			"Hats122",
			"Trinkets8",
			"Bait7",
			"Tackle10",
			"Total257",
		]) {
			expect(compact()).toContain(expected);
		}
		expect(tab("Weapons").getAttribute("aria-selected")).toBe("true");
		expect(tab("Hats").textContent).toContain("122");
	});

	it("lists the 62 weapons with their stats, a tag and the sell price", async () => {
		await mount();
		const weapons = section("Weapons");

		expect(names("Weapons")).toHaveLength(62);
		expect(weapons.textContent).toContain("62 shown");
		expect(weapons.textContent).toContain("Showing 62 of 62 weapons");
		const rusty = [...weapons.querySelectorAll("div.flex.flex-col.gap-2")].find((card) =>
			card.textContent?.includes("Rusty Sword")
		)!;
		expect(rusty.textContent).toContain("2-5 DMG");
		expect(rusty.textContent).toContain("SPD 0");
		expect(rusty.textContent).toContain("Lvl 1");
		expect(rusty.textContent).toContain("Sword");
		expect(rusty.textContent).toContain("Given at The Mines entrance.");
		expect(rusty.textContent).toContain("50g");
	});

	it("shows a slingshot with no damage, speed or level", async () => {
		await mount();
		await type(search("Weapons"), "Master Slingshot");
		const card = section("Weapons").querySelector("div.flex.flex-col.gap-2") as HTMLElement;

		expect(card.textContent).toContain("Slingshot");
		expect(card.textContent).not.toContain("DMG");
		expect(card.textContent).not.toContain("Lvl");
	});

	it("filters weapons by name and by type, and clears the filters", async () => {
		await mount();

		await type(search("Weapons"), "sword");
		expect(names("Weapons").length).toBeGreaterThan(5);
		expect(names("Weapons").length).toBeLessThan(62);
		await type(search("Weapons"), "");
		await click(
			[...section("Weapons").querySelectorAll("button")].find((b) =>
				b.textContent?.startsWith("Filters")
			)
		);
		await click(flyoutRadio("Dagger"));
		expect(names("Weapons")).toHaveLength(16);
		expect(section("Weapons").textContent).toContain("Showing 16 of 62 weapons");
		expect(flyout()!.textContent).toContain("Show 16 daggers");
		await type(search("Weapons"), "zzzzzz");
		expect(section("Weapons").textContent).toContain("Nothing matches your search.");
		await click(
			[...section("Weapons").querySelectorAll("button")].find(
				(b) => b.textContent === "Clear filters"
			)
		);
		expect(names("Weapons")).toHaveLength(62);
	});

	it("opens a tab named in the address and writes the tab into the address", async () => {
		navigation.search = "tab=rings";
		await mount();

		expect(tab("Rings").getAttribute("aria-selected")).toBe("true");
		expect(names("Rings")).toHaveLength(30);
		await click(tab("Hats"));
		expect(navigation.replace).toHaveBeenCalledWith("/gear?tab=hats", { scroll: false });
	});

	it("falls back to Weapons for an unknown tab", async () => {
		navigation.search = "tab=nothing";
		await mount();

		expect(tab("Weapons").getAttribute("aria-selected")).toBe("true");
	});

	it("shows footwear with defense and immunity", async () => {
		navigation.search = "tab=footwear";
		await mount();
		const card = [...section("Footwear").querySelectorAll("div.flex.flex-col.gap-2")].find(
			(el) => el.textContent?.includes("Sneakers")
		)!;

		expect(names("Footwear")).toHaveLength(18);
		expect(card.textContent).toContain("DEF 1");
		expect(card.textContent).toContain("IMM 0");
		expect(card.textContent).toContain("Adventurer's Guild");
	});

	it("shows rings with their sources as chips", async () => {
		navigation.search = "tab=rings";
		await mount();
		const card = [...section("Rings").querySelectorAll("div.flex.flex-col.gap-2")].find((el) =>
			el.textContent?.includes("Small Glow Ring")
		)!;

		expect(card.textContent).toContain("Emits 5 radius circle of light.");
		expect(card.querySelectorAll("li").length).toBeGreaterThanOrEqual(2);
		expect(card.textContent).toContain("Fishing treasure chests");
	});

	it("searches the hats by name", async () => {
		navigation.search = "tab=hats";
		await mount();

		await type(search("Hats"), "abigail");
		expect(names("Hats")).toContain("Abigail's Bow");
		expect(section("Hats").textContent).toContain(
			`Showing ${names("Hats").length} of 122 hats`
		);
	});

	it("shows trinkets with their source in plain words, and searches them", async () => {
		navigation.search = "tab=trinkets";
		await mount();

		expect(names("Trinkets")).toHaveLength(8);
		expect(section("Trinkets").textContent).toContain("Combat Drop");
		await type(search("Trinkets"), "immune to debuffs");
		expect(names("Trinkets")).toEqual(["Basilisk Paw"]);
	});

	it("shows bait and tackle with a search each", async () => {
		navigation.search = "tab=bait";
		await mount();
		expect(names("Bait")).toHaveLength(7);
		expect(search("Bait")).not.toBeNull();
		act(() => root.unmount());
		root = createRoot(container);

		navigation.search = "tab=tackle";
		await mount();
		expect(names("Tackle")).toHaveLength(10);
		await type(search("Tackle"), "barbed");
		expect(names("Tackle")).toEqual(["Barbed Hook"]);
	});

	it("collapses a section from its heading", async () => {
		await mount();
		const heading = section("Weapons").querySelector("h2 button") as HTMLElement;

		await click(heading);
		expect(heading.getAttribute("aria-expanded")).toBe("false");
	});
});
