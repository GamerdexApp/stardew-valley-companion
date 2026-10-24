import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act } from "react";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import type { AppData } from "@/types/app";
import { PlaythroughProvider } from "@/lib/contexts/PlaythroughContext";
import { UIProvider } from "@/lib/contexts/UIContext";
import { forgetMemoryState } from "@/lib/hooks/useMemoryState";
import { STORAGE_KEY } from "@/service/storage";
import { MinesPage } from "@/comps/mines/MinesPage";
import { ToastProvider } from "@/comps/ui/Toast";
import { emptyPlaythrough } from "../storage/fixtures";

vi.mock("next/navigation", () => ({
	useRouter: () => ({ replace: vi.fn() }),
	usePathname: () => "/mines",
	useSearchParams: () => new URLSearchParams(""),
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
						<MinesPage />
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
const choose = async (select: HTMLSelectElement | null | undefined, value: string) => {
	expect(select).toBeTruthy();
	await act(async () => {
		select!.value = value;
		select!.dispatchEvent(new Event("change", { bubbles: true }));
	});
};
const section = (title: string) =>
	[...container.querySelectorAll('[role="region"]')].find(
		(el) => el.querySelector("h2")?.textContent === title
	) as HTMLElement;
const control = (label: string) =>
	container.querySelector(`[aria-label="${label}"]`) as HTMLInputElement | null;
const flyout = () =>
	[...document.body.querySelectorAll("dialog")].find((el) =>
		el.textContent?.includes("Changes apply as you go")
	);
const flyoutRadio = (label: string) =>
	[...flyout()!.querySelectorAll('input[type="radio"]')].find(
		(input) => input.closest("label")?.textContent?.trim() === label
	);
const openFilters = () =>
	click(
		[...section("Monsters").querySelectorAll("button")].find((b) =>
			b.textContent?.startsWith("Filters")
		)
	);
const monsterNames = () =>
	[...section("Monsters").querySelectorAll("span.font-semibold")].map((el) => el.textContent!);
const monsterCard = (name: string) =>
	[...section("Monsters").querySelectorAll("span.font-semibold")]
		.find((el) => el.textContent === name)!
		.closest("div.flex.flex-col.gap-3") as HTMLElement;

beforeEach(() => {
	forgetMemoryState();
	localStorage.clear();
	container = document.createElement("div");
	document.body.appendChild(container);
	root = createRoot(container);
});

afterEach(() => {
	act(() => root.unmount());
	container.remove();
	document.body.querySelectorAll("dialog").forEach((dialog) => dialog.remove());
});

const deep = (d: AppData["playthroughs"][number]["data"]) => {
	d.mineProgress = {
		deepestMineLevel: 85,
		deepestSkullCavernLevel: 112,
		hasRustyKey: true,
		hasSkullKey: false,
	};
	d.monsters = { Duggy: 30, "Magma Duggy": 4, Bat: 8, "Green Slime": 312 };
};

describe("Mines page tiles and subline", () => {
	it("shows the six tiles", async () => {
		seed(withData(deep));
		await mount();

		for (const expected of [
			"Minedepth85",
			"SkullCavern112",
			"RustyKeyYes",
			"SkullKeyNo",
			"Slayergoals1/12",
			"Totalslain354",
		]) {
			expect(compact()).toContain(expected);
		}
		expect(text()).toContain("Floor 85 of 120 · Skull Cavern 112 · 1 of 12 slayer goals");
	});
});

describe("Mine progress", () => {
	it("steps the Mines floor and shows the elevator level", async () => {
		seed(withData(deep));
		await mount();
		const progress = section("Mine progress");

		expect(progress.textContent).toContain("85 / 120");
		expect(progress.textContent).toContain("Floor 85");
		await click(control("Raise The Mines floor"));
		expect(data().mineProgress.deepestMineLevel).toBe(86);
		expect(progress.textContent).toContain("Floor 85");
		await click(control("Lower The Mines floor"));
		await click(control("Lower The Mines floor"));
		expect(progress.textContent).toContain("Floor 80");
	});

	it("says None yet before the first elevator stop", async () => {
		seed(withData(() => {}));
		await mount();

		expect(section("Mine progress").textContent).toContain("None yet");
	});

	it("stops the Mines floor at 120", async () => {
		seed(withData((d) => (d.mineProgress.deepestMineLevel = 120)));
		await mount();

		expect(control("Raise The Mines floor")).toBeNull();
	});

	it("types the Skull Cavern floor with no upper limit and shows the depth beyond the Mines", async () => {
		seed(withData(deep));
		await mount();
		const progress = section("Mine progress");

		await type(control("Skull Cavern floor"), "400");
		expect(data().mineProgress.deepestSkullCavernLevel).toBe(400);
		expect(progress.textContent).toContain("Beyond the 120 floor Mines depth: +400 floors");
		await click(control("Lower Skull Cavern floor"));
		expect(data().mineProgress.deepestSkullCavernLevel).toBe(399);
	});

	it("hides the depth beyond the Mines when the Skull Cavern is not reached", async () => {
		seed(withData(() => {}));
		await mount();

		expect(section("Mine progress").textContent).not.toContain("Beyond the 120 floor");
	});

	it("switches the two keys", async () => {
		seed(withData(() => {}));
		await mount();

		await click(control("Rusty Key obtained"));
		expect(data().mineProgress.hasRustyKey).toBe(true);
		expect(section("Mine progress").textContent).toContain("Obtained");
		await click(control("Skull Key obtained"));
		expect(data().mineProgress.hasSkullKey).toBe(true);
		await click(control("Rusty Key obtained"));
		expect(data().mineProgress.hasRustyKey).toBe(false);
	});
});

describe("Slayer goals", () => {
	it("lists 12 goals in order with a complete tag and a reward", async () => {
		seed(withData(deep));
		await mount();
		const goals = section("Slayer goals");

		expect(goals.textContent).toContain("1 / 12 complete");
		expect(goals.querySelectorAll("div.flex.flex-col.gap-2")).toHaveLength(12);
		expect(goals.textContent).toContain("Reward: Hard Hat");
		expect(goals.textContent).toContain("Complete");
		expect(goals.textContent).toContain("8 / 200");
		expect(goals.querySelectorAll('[role="progressbar"]')).toHaveLength(12);
	});

	it("shows a phone icon where a reward has no picture", async () => {
		seed(withData(() => {}));
		await mount();
		const goal = [...section("Slayer goals").querySelectorAll("div.flex.flex-col.gap-2")].find(
			(el) => el.textContent?.includes("Magma Sprites")
		)!;

		expect(goal.textContent).toContain("Reward: Marlon's Phone Number");
		expect(goal.querySelector("img")).toBeNull();
		expect(goal.querySelector("svg")).not.toBeNull();
	});

	it("follows the kills typed in the monster list", async () => {
		seed(withData(() => {}));
		await mount();

		await type(control("Kills for Duggy"), "50");

		expect(section("Slayer goals").textContent).toContain("1 / 12 complete");
		expect(compact()).toContain("Slayergoals1/12");
	});
});

describe("Monsters", () => {
	it("lists 46 monsters with their kills and the total slain in the badge", async () => {
		seed(withData(deep));
		await mount();

		expect(monsterNames()).toHaveLength(46);
		expect(section("Monsters").textContent).toContain("354 slain");
		expect(section("Monsters").textContent).toContain("46 monsters, 7 dangerous, alphabetical");
		expect(monsterCard("Green Slime").textContent).toContain("312x slain");
		expect(monsterCard("Putrid Ghost").textContent).toContain("Dangerous");
		expect(monsterCard("Duggy").textContent).toContain("HP 40 · DMG 6 · XP 10");
	});

	it("steps and types the kills and removes the entry at zero", async () => {
		seed(withData(() => {}));
		await mount();

		await click(control("Raise kills for Bat"));
		expect(data().monsters).toEqual({ Bat: 1 });
		await type(control("Kills for Bat"), "250");
		expect(data().monsters.Bat).toBe(250);
		await type(control("Kills for Bat"), "0");
		expect(data().monsters).toEqual({});
		expect(control("Lower kills for Bat")?.hasAttribute("disabled")).toBe(true);
	});

	it("opens the details with the stats and the loot in place", async () => {
		seed(withData(() => {}));
		await mount();
		const card = monsterCard("Green Slime");
		const toggle = [...card.querySelectorAll("button")].find(
			(b) => b.textContent === "Show details"
		)!;
		const region = card.querySelector(
			`#${CSS.escape(toggle.getAttribute("aria-controls")!)}`
		) as HTMLElement;

		expect(region.hidden).toBe(true);
		await click(toggle);
		expect(region.textContent).toContain("Standard stats");
		expect(region.textContent).toContain("Loot drops");
		expect(region.textContent).toContain("Slime");
	});

	it("searches by name and shows the empty state", async () => {
		seed(withData(() => {}));
		await mount();
		const search = section("Monsters").querySelector(
			'input[type="search"]'
		) as HTMLInputElement;

		await type(search, "green");
		expect(monsterNames()).toEqual(["Green Slime"]);
		await type(search, "zzz");
		expect(text()).toContain("No monsters match your filters.");
		await click(
			[...section("Monsters").querySelectorAll("button")].find(
				(b) => b.textContent === "Clear filters"
			)
		);
		expect(monsterNames()).toHaveLength(46);
	});

	it("filters by location and by type in the flyout", async () => {
		seed(withData(() => {}));
		await mount();

		await openFilters();
		await click(flyoutRadio("Dangerous"));
		expect(monsterNames()).toHaveLength(7);
		expect(section("Monsters").textContent).toContain("Showing 7 of 46 monsters · 7 dangerous");
		await click(flyoutRadio("Standard"));
		expect(monsterNames()).toHaveLength(39);
		await click(flyoutRadio("All"));
		await choose(
			flyout()!.querySelector('select[aria-label="Location"]') as HTMLSelectElement,
			"Quarry Mine"
		);
		expect(monsterNames().length).toBeGreaterThan(0);
		expect(monsterNames().length).toBeLessThan(46);
	});
});

describe("Collapsing", () => {
	it("closes a section from its heading", async () => {
		seed(withData(() => {}));
		await mount();
		const heading = section("Slayer goals").querySelector("h2 button") as HTMLElement;

		await click(heading);
		expect(heading.getAttribute("aria-expanded")).toBe("false");
	});
});
