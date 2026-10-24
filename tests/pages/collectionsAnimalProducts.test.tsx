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
const namesShown = () =>
	[...container.querySelectorAll("span.font-semibold")].map((el) => el.textContent!);
const cardOf = (name: string) =>
	[...container.querySelectorAll("span.font-semibold")]
		.find((el) => el.textContent === name)!
		.closest("div.flex.flex-col.gap-2\\.5") as HTMLElement;
const shippedSwitch = (name: string) =>
	container.querySelector(`[role="switch"][aria-label="${name} shipped"]`) as HTMLElement;
const saved = (id: string) => stored().playthroughs[0].data.shipped[id];
const searchBox = () => container.querySelector('input[type="search"]') as HTMLInputElement;
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

beforeEach(() => {
	forgetMemoryState();
	localStorage.clear();
	navigation.search = "tab=animal-products";
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

describe("Collections animal products tab", () => {
	it("shows the tiles and the 17 produce items", async () => {
		seed(withData(() => {}));
		await mount();
		const tiles = text().replace(/\s/g, "");

		for (const expected of ["Animals14", "Produceitems17", "Shipped0/15"]) {
			expect(tiles).toContain(expected);
		}
		expect(namesShown()).toHaveLength(17);
		expect(text()).toContain("Showing 17 of 17 produce items");
	});

	it("puts the shipped count on the pill and in the subline", async () => {
		seed(
			withData((data) => {
				data.shipped["176"] = { shipped: true, count: 3 };
			})
		);
		await mount();

		const selected = container.querySelector('[role="tab"][aria-selected="true"]');
		expect(selected?.textContent).toBe("Animal products1 / 15");
		expect(text()).toContain("1 of 15 shipped");
	});

	it("lists a shared item once with its animals and building", async () => {
		seed(withData(() => {}));
		await mount();

		expect(namesShown().filter((n) => n === "Milk")).toHaveLength(1);
		expect(cardOf("Milk").textContent).toContain("White Cow, Brown Cow · Barn");
		expect(cardOf("Wool").textContent).toContain("Rabbit · Deluxe Coop, Sheep · Deluxe Barn");
		expect(cardOf("Large Milk").textContent).toContain("Deluxe");
		expect(cardOf("Milk").textContent).not.toContain("Deluxe");
	});

	it("has no shipped control for the eggs the game does not track", async () => {
		seed(withData(() => {}));
		await mount();

		expect(shippedSwitch("Golden Egg")).toBeNull();
		expect(cardOf("Golden Egg").textContent).toContain("Not tracked by the game");
		expect(shippedSwitch("Dinosaur Egg")).toBeNull();
		expect(shippedSwitch("Egg")).not.toBeNull();
	});

	it("ships an item, steps its count and Undo restores a deleted count", async () => {
		seed(withData(() => {}));
		await mount();

		await click(shippedSwitch("Egg"));
		expect(saved("176")).toEqual({ shipped: true, count: 1 });
		await click(cardOf("Egg").querySelector('button[aria-label="Raise Egg shipped count"]'));
		expect(saved("176")).toEqual({ shipped: true, count: 2 });
		await click(shippedSwitch("Egg"));
		expect(saved("176")).toBeUndefined();
		await click(toastButton("Undo"));
		expect(saved("176")).toEqual({ shipped: true, count: 2 });
	});

	it("searches the item and the animal and filters by status in the flyout", async () => {
		seed(
			withData((data) => {
				data.shipped["176"] = { shipped: true, count: 1 };
			})
		);
		await mount();

		await type(searchBox(), "duck");
		expect(namesShown().sort()).toEqual(["Duck Egg", "Duck Feather"]);
		await type(searchBox(), "");
		await openFilters();
		expect(flyout()!.textContent).toContain("Not tracked means Golden Egg and Dinosaur Egg");
		await click(flyoutRadio("Not tracked"));
		expect(namesShown().sort()).toEqual(["Dinosaur Egg", "Golden Egg"]);
		await reset();
		await click(flyoutRadio("Shipped"));
		expect(namesShown()).toEqual(["Egg"]);
		await reset();
		await click(flyoutRadio("Not shipped"));
		expect(namesShown()).toHaveLength(14);
	});

	it("adds the Rancher price only with the profession", async () => {
		seed(withData(() => {}));
		await mount();
		expect(text()).not.toContain("Profession prices");
		act(() => root.unmount());
		root = createRoot(container);
		forgetMemoryState();
		seed(
			withData((data) => {
				data.professions = ["0"];
			})
		);
		await mount();

		expect(text()).toContain("Shows the Rancher bonus");
		expect(cardOf("Egg").textContent).not.toContain("Rancher");
		await click(
			container.querySelector('[role="switch"][aria-labelledby="profession-prices-label"]')
		);
		expect(cardOf("Egg").textContent).toContain("Rancher");
	});

	it("shows a no match state with a clear button", async () => {
		seed(withData(() => {}));
		await mount();

		await type(searchBox(), "zzzz");
		expect(text()).toContain("No produce matches your search.");
		await click(
			[...container.querySelectorAll("button")].find((b) => b.textContent === "Clear filters")
		);
		expect(namesShown()).toHaveLength(17);
	});
});
