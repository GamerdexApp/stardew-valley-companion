import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act } from "react";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import type { AppData } from "@/types/app";
import { PlaythroughProvider } from "@/lib/contexts/PlaythroughContext";
import { UIProvider } from "@/lib/contexts/UIContext";
import { forgetMemoryState } from "@/lib/hooks/useMemoryState";
import { STORAGE_KEY } from "@/service/storage";
import { TownPage } from "@/comps/town/TownPage";
import { ToastProvider } from "@/comps/ui/Toast";
import { emptyPlaythrough } from "../storage/fixtures";

const navigation = vi.hoisted(() => ({ search: "", replace: vi.fn() }));

vi.mock("next/navigation", () => ({
	useRouter: () => ({ replace: navigation.replace }),
	usePathname: () => "/town",
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
						<TownPage />
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
const cardOf = (name: string) =>
	[...container.querySelectorAll("span.font-semibold")]
		.find((el) => el.textContent === name)!
		.closest("div.flex.flex-col.gap-2") as HTMLElement;
const names = () =>
	[...container.querySelectorAll('[role="region"] span.font-semibold')]
		.map((el) => el.textContent!)
		.filter((name) => name !== "Joja Membership");
const search = () => container.querySelector('input[type="search"]') as HTMLInputElement;
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
		[...container.querySelectorAll("button")].find((b) => b.textContent?.startsWith("Filters"))
	);
const open = async (name: string) =>
	click(
		[...cardOf(name).querySelectorAll("button")].find((b) => b.textContent === "Show details")
	);

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
	document.body.querySelectorAll("dialog").forEach((d) => d.remove());
});

describe("Town page", () => {
	it("works with no playthrough: 38 locations in 11 categories, and no unlock cards", async () => {
		await mount();

		expect(text()).toContain("38 locations, 21 shops");
		expect(names()).toHaveLength(38);
		expect(text()).toContain("Showing 38 of 38 locations · 21 shops");
		expect(section("Pelican Town").textContent).toContain("9 locations");
		expect(section("The Beach").textContent).toContain("1 location");
		expect(container.querySelectorAll('[role="region"]')).toHaveLength(11);
		expect(text()).not.toContain("Valley unlocks");
	});

	it("shows the hours, the closed days and the occupants of a shop", async () => {
		await mount();
		const pierre = cardOf("Pierre's General Store");

		expect(pierre.textContent).toContain("Shop");
		expect(pierre.textContent).toContain("9am - 5pm");
		expect(pierre.textContent).toContain("Closed Wednesday");
		expect(pierre.textContent).toContain("Pierre, Caroline, Abigail");
		expect(cardOf("Pelican Town").textContent).toContain("Always open");
		expect(cardOf("Pelican Town").textContent).toContain("Location");
		expect(cardOf("Pelican Town").textContent).toMatch(/\+\d+/);
	});

	it("shows the small copy of a location picture, and the original when the small one fails", async () => {
		await mount();
		const image = cardOf("Pierre's General Store").querySelector("img")!;

		expect(image.getAttribute("src")).toBe(
			"/images/locations/thumbs/Pierre's General Store.webp"
		);
		await act(async () => {
			image.dispatchEvent(new Event("error"));
		});
		expect(cardOf("Pierre's General Store").querySelector("img")!.getAttribute("src")).toBe(
			"/images/locations/Pierre's General Store.png"
		);
	});

	it("opens the details in place with the facts and the inventory of a shop", async () => {
		await mount();
		await open("Pierre's General Store");
		const pierre = cardOf("Pierre's General Store");

		expect(pierre.textContent).toContain("Hours");
		expect(pierre.textContent).toContain("Closed");
		expect(pierre.textContent).toContain("Occupants");
		expect(pierre.textContent).toContain("Inventory (54)");
		expect(pierre.textContent).toContain("Sugar");
		expect(pierre.textContent).toContain("100g");
		expect(pierre.textContent).toContain("Showing 9 of 54 items");
	});

	it("shows the rest of a long inventory on request", async () => {
		await mount();
		await open("Pierre's General Store");
		const pierre = cardOf("Pierre's General Store");

		await click(
			[...pierre.querySelectorAll("button")].find((b) => b.textContent === "Show all 54")
		);
		expect(pierre.textContent).toContain("Showing 54 of 54 items");
		await click(
			[...pierre.querySelectorAll("button")].find((b) => b.textContent === "Show fewer")
		);
		expect(pierre.textContent).toContain("Showing 9 of 54 items");
	});

	it("adds the tabs a shop has: buildings and farmhouse for Robin, animals and pets for Marnie", async () => {
		await mount();
		await open("Carpenter's Shop");
		const robin = cardOf("Carpenter's Shop");
		const tabs = [...robin.querySelectorAll('[role="tab"]')].map((tab) => tab.textContent);

		expect(tabs.some((tab) => tab?.startsWith("Inventory"))).toBe(true);
		expect(tabs.some((tab) => tab?.startsWith("Buildings"))).toBe(true);
		expect(tabs.some((tab) => tab?.startsWith("Farmhouse (13)"))).toBe(true);
		await click(
			[...robin.querySelectorAll('[role="tab"]')].find((tab) =>
				tab.textContent?.startsWith("Farmhouse")
			)
		);
		expect(robin.textContent).toContain("Upgrades (4)");
		expect(robin.textContent).toContain("Renovations (9)");
		expect(robin.textContent).toContain("Free");

		await open("Marnie's Ranch");
		const marnie = cardOf("Marnie's Ranch");
		await click(
			[...marnie.querySelectorAll('[role="tab"]')].find((tab) =>
				tab.textContent?.startsWith("Pets")
			)
		);
		expect(marnie.textContent).toContain("Cat");
		expect(marnie.textContent).toContain("40,000g");
	});

	it("shows the island collections at the field office", async () => {
		await mount();
		await open("Island Field Office");
		const office = cardOf("Island Field Office");

		expect(office.textContent).toContain("Collections (4)");
		expect(office.textContent).toContain("walnuts");
		expect(office.textContent).not.toContain("Inventory");
	});

	it("shows the Joja membership panel in JojaMart", async () => {
		await mount();
		await open("JojaMart");

		expect(cardOf("JojaMart").textContent).toContain("Joja Membership");
		expect(cardOf("JojaMart").textContent).toContain("5,000g");
	});

	it("shows no tabs for a place that is not a shop", async () => {
		await mount();
		await open("Museum");

		expect(cardOf("Museum").querySelector('[role="tab"]')).toBeNull();
		expect(cardOf("Museum").textContent).toContain("Gunther");
	});
});

describe("Town filters", () => {
	it("search names, occupants and shop items, and show the empty state", async () => {
		await mount();

		await type(search(), "clint");
		expect(names()).toContain("Blacksmith");
		await type(search(), "parsnip seeds");
		expect(names()).toContain("Pierre's General Store");
		expect(text()).toContain(`Showing ${names().length} of 38 locations`);
		await type(search(), "zzzzzz");
		expect(text()).toContain("No locations match your filters.");
		await click(
			[...container.querySelectorAll("button")].find((b) => b.textContent === "Clear filters")
		);
		expect(names()).toHaveLength(38);
	});

	it("filter shops and places in the flyout, and by category", async () => {
		await mount();

		await openFilters();
		await click(flyoutRadio("Shops"));
		expect(names()).toHaveLength(21);
		expect(text()).toContain("Showing 21 of 38 locations · 21 shops");
		await click(flyoutRadio("Locations"));
		expect(names()).toHaveLength(17);
		await click(flyoutRadio("All"));
		await choose(
			flyout()!.querySelector('select[aria-label="Category"]') as HTMLSelectElement,
			"Quarry"
		);
		expect(names()).toHaveLength(1);
		expect(container.querySelectorAll('[role="region"]')).toHaveLength(1);
	});
});

describe("Town unlock cards", () => {
	it("show the valley unlocks from the Community Center rooms and the built island upgrades", async () => {
		seed(
			withData((d) => {
				d.communityCenter.rooms.pantry = true;
				d.communityCenter.rooms.vault = true;
				d.islandUpgrades = { Island_Resort: true, Island_Turtle: true };
			})
		);
		await mount();

		expect(compact()).toContain("Valleyunlocks2/5");
		expect(compact()).toContain("GingerIslandupgrades2/11");
		expect(text()).toContain("Greenhouse");
		expect(text()).toContain("Pantry");
		expect(text()).toContain("Bus to the Calico Desert");
		expect(text()).toContain("Unlocked");
		expect(text()).toContain("Locked");
		expect(text()).toContain("Built");
		expect(text()).toContain("Not built");
		expect(text()).toContain("Read only because it is derived");
	});

	it("follow the Joja projects on the Joja route", async () => {
		seed(
			withData((d) => {
				d.joja.isMember = true;
				d.joja.developments = { jojaCraftsRoom: true };
			})
		);
		await mount();

		expect(compact()).toContain("Valleyunlocks1/5");
		expect(text()).toContain("Joja Bridge");
	});

	it("have no controls", async () => {
		seed(withData(() => {}));
		await mount();

		expect(container.querySelector('[role="switch"]')).toBeNull();
	});
});

describe("Collapsing", () => {
	it("closes a category from its heading", async () => {
		await mount();
		const heading = section("Pelican Town").querySelector("h2 button") as HTMLElement;

		await click(heading);
		expect(heading.getAttribute("aria-expanded")).toBe("false");
	});
});
