import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act } from "react";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import type { AppData } from "@/types/app";
import { PlaythroughProvider } from "@/lib/contexts/PlaythroughContext";
import { UIProvider } from "@/lib/contexts/UIContext";
import { forgetMemoryState } from "@/lib/hooks/useMemoryState";
import { STORAGE_KEY } from "@/service/storage";
import { FarmPage } from "@/comps/farm/FarmPage";
import { ToastProvider } from "@/comps/ui/Toast";
import { emptyPlaythrough } from "../storage/fixtures";

const navigation = vi.hoisted(() => ({ search: "", replace: vi.fn() }));

vi.mock("next/navigation", () => ({
	useRouter: () => ({ replace: navigation.replace }),
	usePathname: () => "/farm",
	useSearchParams: () => new URLSearchParams(navigation.search),
}));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root;
let container: HTMLElement;

const seed = (data: AppData) => localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
const stored = () => JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null") as AppData;

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
						<FarmPage />
					</PlaythroughProvider>
				</ToastProvider>
			</UIProvider>
		);
	});
};

const text = () => container.textContent ?? "";
const data = () => stored().playthroughs[0].data;
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
	container.querySelector(`[aria-label="${label}"]`) as HTMLElement | null;
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
		[...section("Golden walnuts").querySelectorAll("button")].find((b) =>
			b.textContent?.startsWith("Filters")
		)
	);
const spotNames = () =>
	[...section("Golden walnuts").querySelectorAll("span.font-semibold")].map(
		(el) => el.textContent!
	);
const compact = () => text().replace(/\s/g, "");
const toggle = (label: string) => control(label)!;

const RESORT = "Island Resort";

beforeEach(() => {
	forgetMemoryState();
	localStorage.clear();
	navigation.search = "tab=ginger-island";
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

describe("Ginger Island tab", () => {
	it("shows the four tiles for a save with 98 walnuts", async () => {
		seed(withData((d) => (d.goldenWalnutsFound = 98)));
		await mount();

		for (const expected of [
			"Walnutsfound98/130",
			"Upgrades0/11",
			"Availabletospend98",
			"Parrotcost320,000g",
		]) {
			expect(compact()).toContain(expected);
		}
	});

	it("says Complete when all 130 are found", async () => {
		seed(withData((d) => (d.goldenWalnutsFound = 130)));
		await mount();

		expect(compact()).toContain("AvailabletospendComplete");
		expect(compact()).toContain("Parrotcost0g");
	});

	it("lists the 11 upgrades with their cost and location", async () => {
		seed(withData(() => {}));
		await mount();
		const upgrades = section("Island upgrades");

		expect(upgrades.textContent).toContain("0 / 11 unlocked");
		expect(upgrades.querySelectorAll('[role="switch"]')).toHaveLength(11);
		expect(upgrades.textContent).toContain("Island Resort");
		expect(upgrades.textContent).toContain("20 walnuts · Island South");
		expect(upgrades.textContent).toContain("1 walnut ·");
		expect(upgrades.textContent).toContain("Costs add up to 116 walnuts.");
	});

	it("unlocks an upgrade with its switch and updates the tiles and the sentence", async () => {
		seed(withData((d) => (d.goldenWalnutsFound = 98)));
		await mount();

		await click(toggle(`${RESORT} unlocked`));

		expect(data().islandUpgrades.Island_Resort).toBe(true);
		expect(compact()).toContain("Upgrades1/11");
		expect(text()).toContain(
			"98 golden walnuts found. 20 spent on upgrades, 78 left to spend."
		);
		await click(toggle(`${RESORT} unlocked`));
		expect(data().islandUpgrades.Island_Resort).toBe(false);
	});

	it("warns on a locked upgrade that costs more than the walnuts left, and still lets it unlock", async () => {
		seed(withData((d) => (d.goldenWalnutsFound = 5)));
		await mount();
		const upgrades = section("Island upgrades");

		expect(upgrades.textContent).toContain(
			"Costs 20, but only 5 left to spend. You can still unlock it."
		);
		expect(upgrades.textContent).not.toContain("Costs 1, but");
		await click(toggle(`${RESORT} unlocked`));
		expect(data().islandUpgrades.Island_Resort).toBe(true);
		const resortCard = control(`${RESORT} unlocked`)!.closest(
			"div.flex.flex-col.gap-2"
		) as HTMLElement;
		expect(resortCard.textContent).not.toContain("but only");
	});

	it("types the walnut total and keeps it between 0 and 130", async () => {
		seed(withData(() => {}));
		await mount();
		const field = control("Total found (0 to 130)") as HTMLInputElement;

		await type(field, "64");
		expect(data().goldenWalnutsFound).toBe(64);
		expect(compact()).toContain("Walnutsfound64/130");
		await type(field, "500");
		expect(data().goldenWalnutsFound).toBe(130);
	});

	it("ticking a spot adds its walnuts to the total, and clearing it takes them away", async () => {
		seed(withData((d) => (d.goldenWalnutsFound = 10)));
		await mount();
		const spots = section("Golden walnuts");
		const multi = [...spots.querySelectorAll("div.flex.flex-col.gap-2")].find((card) =>
			card.textContent?.includes("×5")
		) as HTMLElement;
		const name = multi.querySelector("span.font-semibold")!.textContent!;

		await click(multi.querySelector('[role="switch"]'));
		expect(data().goldenWalnutsFound).toBe(15);
		expect(Object.keys(data().goldenWalnuts)).toHaveLength(1);
		expect(spots.textContent).toContain("1 of 69 spots found.");
		expect((control(`${name} found`) as HTMLElement).getAttribute("aria-checked")).toBe("true");
		await click(control(`${name} found`));
		expect(data().goldenWalnutsFound).toBe(10);
		expect(data().goldenWalnuts).toEqual({});
	});

	it("shows all 69 spots and the walnut badge", async () => {
		seed(withData((d) => (d.goldenWalnutsFound = 98)));
		await mount();

		expect(spotNames()).toHaveLength(69);
		expect(section("Golden walnuts").textContent).toContain("98 / 130 found");
		expect(section("Golden walnuts").textContent).toContain("Showing 69 of 69 spots");
	});

	it("points the walnut picture at the site image folder", async () => {
		seed(withData(() => {}));
		await mount();
		const src = section("Golden walnuts").querySelector("img")!.getAttribute("src")!;

		expect(src.startsWith("/")).toBe(true);
		expect(src).toBe("/images/misc/Golden Walnut.png");
	});

	it("opens a hint in place", async () => {
		seed(withData(() => {}));
		await mount();
		const spots = section("Golden walnuts");
		const toggleHint = [...spots.querySelectorAll("button")].find(
			(b) => b.textContent === "Show hint"
		)!;
		const region = spots.querySelector(
			`#${CSS.escape(toggleHint.getAttribute("aria-controls")!)}`
		) as HTMLElement;

		expect(region.hidden).toBe(true);
		await click(toggleHint);
		expect(region.hidden).toBe(false);
		expect(region.textContent!.length).toBeGreaterThan(5);
	});

	it("searches by name or hint and shows the empty state", async () => {
		seed(withData(() => {}));
		await mount();
		const search = section("Golden walnuts").querySelector(
			'input[type="search"]'
		) as HTMLInputElement;

		await type(search, "bush");
		expect(spotNames().length).toBeGreaterThan(0);
		expect(spotNames().length).toBeLessThan(69);
		await type(search, "zzzzzz");
		expect(text()).toContain("No walnuts match your filters.");
		await click(
			[...section("Golden walnuts").querySelectorAll("button")].find(
				(b) => b.textContent === "Clear filters"
			)
		);
		expect(spotNames()).toHaveLength(69);
	});

	it("filters by location and by status in the flyout", async () => {
		seed(withData((d) => (d.goldenWalnuts = { Bush_IslandEast_17_37: 1 })));
		await mount();

		await openFilters();
		await choose(
			flyout()!.querySelector('select[aria-label="Location"]') as HTMLSelectElement,
			"Volcano"
		);
		expect(spotNames()).toHaveLength(5);
		await choose(
			flyout()!.querySelector('select[aria-label="Location"]') as HTMLSelectElement,
			"all"
		);
		await click(flyoutRadio("Found"));
		expect(spotNames()).toEqual(["Island Jungle Bush"]);
		await click(flyoutRadio("Not found"));
		expect(spotNames()).toHaveLength(68);
	});

	it("shows the Joja parrot calculator", async () => {
		seed(withData((d) => (d.goldenWalnutsFound = 98)));
		await mount();
		const parrot = section("Joja parrot calculator").textContent!.replace(/\s/g, "");

		expect(section("Joja parrot calculator").textContent).toContain("10,000g per walnut");
		for (const expected of [
			"Walnutsfound98/130",
			"Walnutsremaining32",
			"Costperwalnut10,000g",
			"Totalcost320,000g",
		]) {
			expect(parrot).toContain(expected);
		}
	});

	it("collapses a section from its heading", async () => {
		seed(withData(() => {}));
		await mount();
		const heading = section("Island upgrades").querySelector("h2 button") as HTMLElement;

		expect(heading.getAttribute("aria-expanded")).toBe("true");
		await click(heading);
		expect(heading.getAttribute("aria-expanded")).toBe("false");
	});
});
