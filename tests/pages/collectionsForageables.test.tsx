import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act } from "react";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import type { AppData } from "@/types/app";
import { PlaythroughProvider } from "@/lib/contexts/PlaythroughContext";
import { UIProvider } from "@/lib/contexts/UIContext";
import { forgetMemoryState } from "@/lib/hooks/useMemoryState";
import { STORAGE_KEY } from "@/service/storage";
import { CollectionsPage } from "@/comps/collections/CollectionsPage";
import { ToastProvider } from "@/comps/ui/Toast";
import { emptyPlaythrough } from "../storage/fixtures";

const navigation = vi.hoisted(() => ({ search: "", replace: vi.fn() }));

vi.mock("next/navigation", () => ({
	useRouter: () => ({ replace: navigation.replace }),
	usePathname: () => "/collections",
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
						<CollectionsPage />
					</PlaythroughProvider>
				</ToastProvider>
			</UIProvider>
		);
	});
};

const text = () => container.textContent ?? "";
const block = (title: string) =>
	[...container.querySelectorAll("section[aria-labelledby]")].find(
		(el) => el.querySelector("h2")?.textContent === title
	) as HTMLElement;
const namesIn = (root: ParentNode) =>
	[...root.querySelectorAll("span.font-semibold")].map((el) => el.textContent!);
const cardOf = (root: ParentNode, name: string) =>
	[...root.querySelectorAll("span.font-semibold")]
		.find((el) => el.textContent === name)!
		.closest("div.flex.flex-col.gap-2\\.5") as HTMLElement;
const shippedSwitch = (name: string) =>
	container.querySelector(`[role="switch"][aria-label="${name} shipped"]`) as HTMLElement;
const saved = (id: string) => stored().playthroughs[0].data.shipped[id];
const searchIn = (root: ParentNode) =>
	root.querySelector('input[type="search"]') as HTMLInputElement;
const click = async (element: Element | null | undefined) => {
	expect(element).toBeTruthy();
	await act(async () => {
		element!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
	});
};

const type = async (input: HTMLInputElement, value: string) => {
	await act(async () => {
		Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(
			input,
			value
		);
		input.dispatchEvent(new Event("input", { bubbles: true }));
	});
};

const toastButton = (label: string) =>
	[...document.body.querySelectorAll("button")].find((b) => b.textContent === label);
const flyout = () =>
	[...document.body.querySelectorAll("dialog")].find((el) =>
		el.textContent?.includes("Changes apply as you go")
	);
const openFilters = async () =>
	click(
		[...container.querySelectorAll("button")].find((b) => b.textContent?.startsWith("Filters"))
	);
const flyoutRadio = (label: string) =>
	[...flyout()!.querySelectorAll('input[type="radio"]')].find(
		(input) => input.closest("label")?.textContent?.trim() === label
	);
const reset = () =>
	click([...flyout()!.querySelectorAll("button")].find((b) => b.textContent === "Reset"));

const openFiltersIn = async (root: ParentNode) =>
	click([...root.querySelectorAll("button")].find((b) => b.textContent?.startsWith("Filters")));

beforeEach(() => {
	forgetMemoryState();
	localStorage.clear();
	navigation.search = "tab=forageables";
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

describe("Collections forageables tab", () => {
	it("shows the tiles, 61 items and 16 trees", async () => {
		seed(withData(() => {}));
		await mount();
		const tiles = text().replace(/\s/g, "");

		for (const expected of [
			"Forageableitems61",
			"Shipped0/53",
			"Totaltrees16",
			"Fruittrees8",
			"Wildtrees8",
		]) {
			expect(tiles).toContain(expected);
		}
		expect(namesIn(block("Forageables"))).toHaveLength(61);
		expect(text()).toContain("Showing 61 of 61 items");
		expect(block("Trees").textContent).toContain("16 trees");
	});

	it("puts the shipped count on the pill and in the subline", async () => {
		seed(
			withData((data) => {
				data.shipped["410"] = { shipped: true, count: 2 };
			})
		);
		await mount();

		const selected = container.querySelector('[role="tab"][aria-selected="true"]');
		expect(selected?.textContent).toBe("Forageables1 / 53");
		expect(text()).toContain("1 of 53 shipped");
	});

	it("lists a tapper good that is also a forageable once", async () => {
		seed(withData(() => {}));
		await mount();
		const items = namesIn(block("Forageables"));

		for (const name of ["Oak Resin", "Maple Syrup", "Apricot", "Blackberry"]) {
			expect(items.filter((n) => n === name)).toHaveLength(1);
		}
	});

	it("shows the place of a forageable, the tree of a fruit and the tapper of a syrup", async () => {
		seed(withData(() => {}));
		await mount();
		const items = block("Forageables");

		expect(cardOf(items, "Blackberry").textContent).toContain("Cindersap Forest");
		expect(cardOf(items, "Apricot").textContent).toContain("Apricot Tree");
		expect(cardOf(items, "Apricot").textContent).toContain("Fruit tree produce");
		expect(cardOf(items, "Maple Syrup").textContent).toContain("Maple Tree tapper");
		expect(cardOf(items, "Maple Syrup").textContent).toContain("Tapper good");
	});

	it("has no shipped control for an item that cannot be shipped", async () => {
		seed(withData(() => {}));
		await mount();

		expect(shippedSwitch("Clam")).toBeNull();
		expect(cardOf(block("Forageables"), "Clam").textContent).toContain("Cannot be shipped");
		expect(shippedSwitch("Blackberry")).not.toBeNull();
	});

	it("ships an item with a count of one, steps it, and Undo restores a deleted count", async () => {
		seed(withData(() => {}));
		await mount();

		await click(shippedSwitch("Blackberry"));
		expect(saved("410")).toEqual({ shipped: true, count: 1 });
		await click(
			cardOf(block("Forageables"), "Blackberry").querySelector(
				'button[aria-label="Raise Blackberry shipped count"]'
			)
		);
		expect(saved("410")).toEqual({ shipped: true, count: 2 });
		await click(shippedSwitch("Blackberry"));
		expect(saved("410")).toBeUndefined();
		expect(document.body.textContent).toContain("Blackberry marked not shipped");
		await click(toastButton("Undo"));
		expect(saved("410")).toEqual({ shipped: true, count: 2 });
	});

	it("searches the name and the place", async () => {
		seed(withData(() => {}));
		await mount();

		await type(searchIn(block("Forageables")), "secret woods");

		const found = namesIn(block("Forageables"));
		expect(found.length).toBeGreaterThanOrEqual(7);
		expect(found.length).toBeLessThan(61);
	});

	it("filters by season, keeping tapper goods, and by shipped state including Other", async () => {
		seed(
			withData((data) => {
				data.shipped["410"] = { shipped: true, count: 1 };
			})
		);
		await mount();
		await openFiltersIn(block("Forageables"));

		expect(flyout()!.textContent).toContain("Other means items that cannot be shipped");
		await click(flyoutRadio("Winter"));
		const winter = namesIn(block("Forageables"));
		expect(winter).toContain("Maple Syrup");
		expect(winter).not.toContain("Blackberry");
		await reset();
		await click(flyoutRadio("Other"));
		expect(namesIn(block("Forageables"))).toHaveLength(8);
		await reset();
		await click(flyoutRadio("Shipped"));
		expect(namesIn(block("Forageables"))).toEqual(["Blackberry"]);
		await reset();
		await click(flyoutRadio("Not shipped"));
		expect(namesIn(block("Forageables"))).toHaveLength(52);
	});

	it("shows fruit trees and wild trees in two groups with their produce and shipped state", async () => {
		seed(
			withData((data) => {
				data.shipped["634"] = { shipped: true, count: 4 };
			})
		);
		await mount();
		const trees = block("Trees");

		expect(trees.textContent).toContain("Fruit trees · 8 trees");
		expect(trees.textContent).toContain("Wild trees · 8 trees");
		expect(cardOf(trees, "Apricot Tree").textContent).toContain("Mature in 28d");
		expect(cardOf(trees, "Apricot Tree").textContent).toContain("Apricot Sapling");
		expect(cardOf(trees, "Apricot Tree").textContent).toContain("Shipped ×4");
		expect(cardOf(trees, "Cherry Tree").textContent).toContain("Not shipped");
		expect(cardOf(trees, "Oak Tree").textContent).toContain("Wild tree · Year-round");
		expect(cardOf(trees, "Oak Tree").textContent).toContain("Oak Resin");
		expect(cardOf(trees, "Oak Tree").textContent).toContain("Wood");
	});

	it("says a palm tree has no tapper produce and no seed", async () => {
		seed(withData(() => {}));
		await mount();
		const palm = cardOf(block("Trees"), "Palm Tree");

		expect(palm.textContent).toContain("No tapper produce");
		expect(palm.textContent).not.toContain("No shop");
	});

	it("opens the tree details in place", async () => {
		seed(withData(() => {}));
		await mount();
		const card = cardOf(block("Trees"), "Apricot Tree");
		const toggle = [...card.querySelectorAll("button")].find(
			(b) => b.textContent === "Show details"
		)!;
		const region = card.querySelector(
			`#${CSS.escape(toggle.getAttribute("aria-controls")!)}`
		) as HTMLElement;

		expect(region.hidden).toBe(true);
		await click(toggle);
		expect(region.hidden).toBe(false);
		expect(region.textContent).toContain("Growth stages");
		expect(region.textContent).toContain("Sell price");
		expect(region.querySelectorAll("ol img")).toHaveLength(5);
	});

	it("filters the trees by type and search without touching the items", async () => {
		seed(withData(() => {}));
		await mount();

		await openFiltersIn(block("Trees"));
		await click(flyoutRadio("Wild trees"));
		expect(namesIn(block("Trees"))).toHaveLength(8);
		expect(block("Trees").textContent).not.toContain("Fruit trees · ");
		await reset();
		await type(searchIn(block("Trees")), "syrup");
		expect(namesIn(block("Trees")).sort()).toEqual(["Maple Tree", "Mystic Tree"]);
		expect(namesIn(block("Forageables"))).toHaveLength(61);
	});

	it("lists only the bonuses the playthrough has and adds the Bear's Knowledge price", async () => {
		seed(withData(() => {}));
		await mount();
		expect(text()).not.toContain("Profession prices");
		act(() => root.unmount());
		root = createRoot(container);
		forgetMemoryState();
		seed(
			withData((data) => {
				data.specialItems = ["bears-knowledge"];
			})
		);
		await mount();

		expect(text()).toContain("Shows the Bear's Knowledge bonus");
		expect(text()).not.toContain("Tapper bonus");
		const card = () => cardOf(block("Forageables"), "Blackberry").textContent;
		expect(card()).not.toContain("60g");
		await click(
			container.querySelector('[role="switch"][aria-labelledby="profession-prices-label"]')
		);
		expect(card()).toContain("Bear's Knowledge");
		expect(card()).toContain("60g");
	});

	it("adds the Tapper price to a tapper good", async () => {
		seed(
			withData((data) => {
				data.professions = ["15"];
			})
		);
		await mount();
		await click(
			container.querySelector('[role="switch"][aria-labelledby="profession-prices-label"]')
		);

		expect(cardOf(block("Forageables"), "Maple Syrup").textContent).toContain("Tapper");
		expect(cardOf(block("Forageables"), "Blackberry").textContent).not.toContain("Tapper");
	});

	it("shows a no match state with a clear button", async () => {
		seed(withData(() => {}));
		await mount();

		await type(searchIn(block("Forageables")), "zzzz");

		expect(text()).toContain("No forageables match your search.");
		await click(
			[...block("Forageables").querySelectorAll("button")].find(
				(b) => b.textContent === "Clear filters"
			)
		);
		expect(namesIn(block("Forageables"))).toHaveLength(61);
	});
});
