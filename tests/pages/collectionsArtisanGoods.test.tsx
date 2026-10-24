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
	navigation.search = "tab=artisan-goods";
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

const dialogWith = (needle: string) =>
	[...document.body.querySelectorAll("dialog")].find((d) => d.textContent?.includes(needle))!;
const calculateButton = (name: string) =>
	container.querySelector(`button[aria-label="Calculate price, ${name}"]`) as HTMLElement;
const pick = (dialog: Element, name: string) =>
	[...dialog.querySelectorAll("button[aria-pressed]")].find((b) =>
		b.textContent?.includes(name)
	)!;

describe("Collections artisan goods tab", () => {
	it("shows the tiles and the 30 goods", async () => {
		seed(withData(() => {}));
		await mount();
		const tiles = text().replace(/\s/g, "");

		for (const expected of ["Equipmenttypes10", "Artisangoods30", "Shipped0/27"]) {
			expect(tiles).toContain(expected);
		}
		expect(namesShown()).toHaveLength(30);
		expect(text()).toContain("Showing 30 of 30 artisan goods");
	});

	it("puts the shipped count on the pill and in the subline", async () => {
		seed(
			withData((data) => {
				data.shipped["340"] = { shipped: true, count: 2 };
			})
		);
		await mount();

		const selected = container.querySelector('[role="tab"][aria-selected="true"]');
		expect(selected?.textContent).toBe("Artisan goods1 / 27");
		expect(text()).toContain("1 of 27 shipped");
	});

	it("shows the equipment and the ingredients on a card", async () => {
		seed(withData(() => {}));
		await mount();

		expect(cardOf("Honey").textContent).toContain("Bee House");
		expect(cardOf("Honey").textContent).toContain("Flower (nearby)");
		expect(cardOf("Pale Ale").textContent).toContain("Keg");
	});

	it("shows a fixed price for most goods and a formula with Calculate for nine", async () => {
		seed(withData(() => {}));
		await mount();

		expect(cardOf("Cheese").textContent).toContain("Basic");
		expect(cardOf("Cheese").textContent).not.toContain("Calculate");
		expect(cardOf("Wine").textContent).toContain("3× base fruit price");
		expect(container.querySelectorAll('button[aria-label^="Calculate price, "]')).toHaveLength(
			9
		);
	});

	it("has no shipped control for Coffee, Vinegar and Oil", async () => {
		seed(withData(() => {}));
		await mount();

		for (const name of ["Coffee", "Vinegar", "Oil"]) {
			expect(shippedSwitch(name)).toBeNull();
			expect(cardOf(name).textContent).toContain("Cannot be shipped");
		}
		expect(shippedSwitch("Honey")).not.toBeNull();
	});

	it("shows the poison of Void Mayonnaise and the buffs of Coffee", async () => {
		seed(withData(() => {}));
		await mount();

		expect(cardOf("Void Mayonnaise").textContent).toContain("Poison");
		expect(cardOf("Coffee").textContent).toContain("Speed +1");
		expect(cardOf("Wine").textContent).toContain("Speed -1");
	});

	it("ships a good, steps its count and Undo restores a deleted count", async () => {
		seed(withData(() => {}));
		await mount();

		await click(shippedSwitch("Honey"));
		expect(saved("340")).toEqual({ shipped: true, count: 1 });
		await click(
			cardOf("Honey").querySelector('button[aria-label="Raise Honey shipped count"]')
		);
		expect(saved("340")).toEqual({ shipped: true, count: 2 });
		await click(shippedSwitch("Honey"));
		expect(saved("340")).toBeUndefined();
		await click(toastButton("Undo"));
		expect(saved("340")).toEqual({ shipped: true, count: 2 });
	});

	it("searches the name, the equipment and the ingredients", async () => {
		seed(withData(() => {}));
		await mount();

		await type(searchBox(), "bee house");
		expect(namesShown()).toEqual(["Honey"]);
		await type(searchBox(), "hops");
		expect(namesShown()).toContain("Pale Ale");
	});

	it("filters by shipped state and explains Not shippable", async () => {
		seed(
			withData((data) => {
				data.shipped["340"] = { shipped: true, count: 1 };
			})
		);
		await mount();
		await openFilters();

		expect(flyout()!.textContent).toContain("Coffee, Vinegar and Oil");
		await click(flyoutRadio("Not shippable"));
		expect(namesShown().sort()).toEqual(["Coffee", "Oil", "Vinegar"]);
		await reset();
		await click(flyoutRadio("Shipped"));
		expect(namesShown()).toEqual(["Honey"]);
		await reset();
		await click(flyoutRadio("Not shipped"));
		expect(namesShown()).toHaveLength(26);
	});

	it("opens the price calculator, picks an ingredient and shows the result", async () => {
		seed(withData(() => {}));
		await mount();

		await click(calculateButton("Wine"));
		const dialog = dialogWith("Step 1");

		expect(dialog.textContent).toContain("Wine price calculator");
		expect(dialog.textContent).toContain("Pick an ingredient to see the price.");
		await click(pick(dialog, "Starfruit"));
		expect(pick(dialog, "Starfruit").getAttribute("aria-pressed")).toBe("true");
		expect(dialog.textContent).toContain("Starfruit becomes Wine");
		expect(dialog.textContent).toContain("2,250g");
		expect(dialog.textContent).toContain("+218");
	});

	it("searches the ingredients and says when none match", async () => {
		seed(withData(() => {}));
		await mount();
		await click(calculateButton("Wine"));
		const dialog = dialogWith("Step 1");
		const box = dialog.querySelector('input[type="search"]') as HTMLInputElement;

		await type(box, "star");
		expect(dialog.querySelectorAll("button[aria-pressed]").length).toBeLessThan(27);
		expect(dialog.textContent).toMatch(/\d+ of 27 shown\./);
		await type(box, "zzzz");
		expect(dialog.textContent).toContain("No items match your search.");
	});

	it("starts empty each time the calculator opens", async () => {
		seed(withData(() => {}));
		await mount();
		await click(calculateButton("Wine"));
		await click(pick(dialogWith("Step 1"), "Starfruit"));
		await click(
			[...dialogWith("Step 1").querySelectorAll("button")].find(
				(b) => b.textContent === "Close"
			)
		);
		await click(calculateButton("Wine"));

		expect(dialogWith("Step 1").textContent).toContain("Pick an ingredient to see the price.");
	});

	it("shows the Artisan row on a result only when the professions are on", async () => {
		seed(
			withData((data) => {
				data.professions = ["4"];
			})
		);
		await mount();
		await click(calculateButton("Wine"));
		let dialog = dialogWith("Step 1");
		await click(pick(dialog, "Starfruit"));

		expect(dialog.textContent).toContain("Profession prices are off");
		expect(dialog.textContent).not.toContain("Artisan");
		await click([...dialog.querySelectorAll("button")].find((b) => b.textContent === "Close"));
		await click(
			container.querySelector('[role="switch"][aria-labelledby="profession-prices-label"]')
		);
		await click(calculateButton("Wine"));
		dialog = dialogWith("Step 1");
		await click(pick(dialog, "Starfruit"));

		expect(dialog.textContent).toContain("Your profession prices are on");
		expect(dialog.textContent).toContain("Artisan");
		expect(dialog.textContent).toContain("3,150g");
	});

	it("stacks Fisher and Artisan on Smoked Fish", async () => {
		seed(
			withData((data) => {
				data.professions = ["4", "6"];
			})
		);
		await mount();
		await click(
			container.querySelector('[role="switch"][aria-labelledby="profession-prices-label"]')
		);
		await click(calculateButton("Smoked Fish"));
		const dialog = dialogWith("Step 1");
		await click(pick(dialog, "Albacore"));

		expect(dialog.textContent).toContain("Fisher");
		expect(dialog.textContent).toContain("Fisher + Artisan");
	});

	it("adds the Artisan price to a fixed price good", async () => {
		seed(
			withData((data) => {
				data.professions = ["4"];
			})
		);
		await mount();
		expect(cardOf("Cheese").textContent).not.toContain("Artisan");
		await click(
			container.querySelector('[role="switch"][aria-labelledby="profession-prices-label"]')
		);

		expect(cardOf("Cheese").textContent).toContain("Artisan");
		expect(cardOf("Coffee").textContent).not.toContain("Artisan");
	});

	it("shows a no match state with a clear button", async () => {
		seed(withData(() => {}));
		await mount();

		await type(searchBox(), "zzzz");
		expect(text()).toContain("No artisan goods match your search.");
		await click(
			[...container.querySelectorAll("button")].find((b) => b.textContent === "Clear filters")
		);
		expect(namesShown()).toHaveLength(30);
	});
});
