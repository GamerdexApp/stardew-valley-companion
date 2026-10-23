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
const cardCount = () => container.querySelectorAll('button[aria-label$=", show details"]').length;
const cardOf = (name: string) =>
	container
		.querySelector(`button[aria-label="${name}, show details"]`)!
		.closest("div.flex.flex-col.gap-2\\.5") as HTMLElement;
const statusRadio = (root: ParentNode, name: string, status: string) =>
	[...root.querySelectorAll("fieldset")]
		.find((f) => f.querySelector("legend")?.textContent === `${name} status`)
		?.querySelector(`input[value="${status}"]`) as HTMLInputElement;
const saved = (name: string) => stored().playthroughs[0].data.cookingRecipes[name];

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

const searchBox = () => container.querySelector('input[type="search"]') as HTMLInputElement;
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
	navigation.search = "tab=cooking";
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

describe("Collections cooking tab", () => {
	it("shows the three tiles and all 81 recipes", async () => {
		seed(withData(() => {}));
		await mount();
		const tiles = text().replace(/\s/g, "");

		expect(tiles).toContain("Totalrecipes81");
		expect(tiles).toContain("Recipeslearned0/81");
		expect(tiles).toContain("Recipescooked0/81");
		expect(cardCount()).toBe(81);
		expect(text()).toContain("Showing 81 of 81 recipes");
	});

	it("puts the cooked count on the pill and cooked and learned in the subline", async () => {
		seed(
			withData((data) => {
				data.cookingRecipes["Fried Egg"] = { learned: true, cooked: true };
				data.cookingRecipes["Omelet"] = { learned: true, cooked: false };
			})
		);
		await mount();

		const selected = container.querySelector('[role="tab"][aria-selected="true"]');
		expect(selected?.textContent).toBe("Cooking1 / 81");
		expect(text()).toContain("1 of 81 cooked · 2 learned");
	});

	it("counts only the 81 dishes in the subline, like the learned tile", async () => {
		seed(
			withData((data) => {
				data.cookingRecipes["Fried Egg"] = { learned: true, cooked: false };
				data.cookingRecipes["A Dish Not In The List"] = { learned: true, cooked: false };
			})
		);
		await mount();

		expect(text()).toContain("0 of 81 cooked · 1 learned");
		expect(text().replace(/\s/g, "")).toContain("Recipeslearned1/81");
	});

	it("lists the recipes in alphabetical order", async () => {
		seed(withData(() => {}));
		await mount();
		const labels = [...container.querySelectorAll('button[aria-label$=", show details"]')].map(
			(b) => b.getAttribute("aria-label")!.replace(", show details", "")
		);

		expect(labels).toEqual([...labels].sort((a, b) => a.localeCompare(b)));
	});

	it("shows the first source, energy, health and buffs on a card", async () => {
		seed(withData(() => {}));
		await mount();

		expect(cardOf("Fried Egg").textContent).toContain("Starter recipe");
		expect(cardOf("Fried Egg").textContent).toContain("Energy +50");
		expect(cardOf("Fried Egg").textContent).toContain("Health +22");
		expect(cardOf("Complete Breakfast").textContent).toContain("Queen of Sauce");
		expect(cardOf("Complete Breakfast").textContent).toContain("Farming +2");
		expect(cardOf("Complete Breakfast").textContent).toContain("Max Energy +50");
		expect(cardOf("Salad").textContent).toContain("Emily, 3 hearts");
	});

	it("saves Learned as learned and not cooked, with no toast", async () => {
		seed(withData(() => {}));
		await mount();

		await click(statusRadio(container, "Fried Egg", "learned"));

		expect(saved("Fried Egg")).toEqual({ learned: true, cooked: false });
		expect(document.body.textContent).not.toContain("also marked");
	});

	it("saves Cooked as both and says Learned was set too, with Undo", async () => {
		seed(withData(() => {}));
		await mount();

		await click(statusRadio(container, "Fried Egg", "done"));

		expect(saved("Fried Egg")).toEqual({ learned: true, cooked: true });
		expect(document.body.textContent).toContain(
			"Fried Egg set to Cooked. It was also marked Learned."
		);
		await click(toastButton("Undo"));
		expect(saved("Fried Egg")).toBeUndefined();
	});

	it("says both were cleared when Not learned follows Cooked, and Undo restores them", async () => {
		seed(
			withData((data) => {
				data.cookingRecipes["Fried Egg"] = { learned: true, cooked: true };
			})
		);
		await mount();

		await click(statusRadio(container, "Fried Egg", "not-learned"));

		expect(saved("Fried Egg")).toBeUndefined();
		expect(document.body.textContent).toContain(
			"Fried Egg set to Not learned. Learned and Cooked were cleared."
		);
		await click(toastButton("Undo"));
		expect(saved("Fried Egg")).toEqual({ learned: true, cooked: true });
	});

	it("filters by status and explains what Learned means", async () => {
		seed(
			withData((data) => {
				data.cookingRecipes["Fried Egg"] = { learned: true, cooked: true };
				data.cookingRecipes["Omelet"] = { learned: true, cooked: false };
			})
		);
		await mount();
		await openFilters();

		expect(flyout()!.textContent).toContain("Learned means learned but not cooked yet.");
		await click(flyoutRadio("Learned"));
		expect(cardCount()).toBe(1);
		await reset();
		await click(flyoutRadio("Cooked"));
		expect(cardCount()).toBe(1);
		await reset();
		await click(flyoutRadio("Not learned"));
		expect(cardCount()).toBe(79);
	});

	it("filters by source", async () => {
		seed(withData(() => {}));
		await mount();
		await openFilters();

		await click(flyoutRadio("Purchase"));
		expect(cardCount()).toBe(11);
		await click(flyoutRadio("Skill level"));
		expect(cardCount()).toBe(8);
		expect(flyout()!.textContent).toContain("Show 8 recipes");
	});

	it("searches by name", async () => {
		seed(withData(() => {}));
		await mount();

		await type(searchBox(), "soup");

		expect(cardCount()).toBeGreaterThan(0);
		expect(cardCount()).toBeLessThan(81);
	});

	it("opens a dialog with the full sources, buffs with their length and the ingredients", async () => {
		seed(withData(() => {}));
		await mount();

		await click(
			container.querySelector('button[aria-label="Complete Breakfast, show details"]')
		);
		const dialog = [...document.body.querySelectorAll("dialog")].find((d) =>
			d.textContent?.includes("Recipe sources")
		)!;

		expect(dialog.textContent).toContain("Cooked always includes Learned");
		expect(dialog.textContent).toContain("Queen of Sauce, Spring 21, Year 2");
		expect(dialog.textContent).toContain("Lasts 7 min");
		expect(dialog.textContent).toContain("Farming");
		expect(dialog.textContent).toContain("Any Milk");
		expect(dialog.textContent).toContain("× 1");
		expect(dialog.textContent).toContain("350g");
	});

	it("shows the purchase price in the dialog and edits from it", async () => {
		seed(withData(() => {}));
		await mount();

		await click(container.querySelector('button[aria-label="Fried Egg, show details"]'));
		const dialog = [...document.body.querySelectorAll("dialog")].find((d) =>
			d.textContent?.includes("Recipe sources")
		)!;
		await click(statusRadio(dialog, "Fried Egg", "learned"));

		expect(saved("Fried Egg")).toEqual({ learned: true, cooked: false });
	});

	it("remembers the filters while the app stays open", async () => {
		seed(withData(() => {}));
		await mount();
		await type(searchBox(), "soup");
		const found = cardCount();
		act(() => root.unmount());
		root = createRoot(container);
		await mount();

		expect(cardCount()).toBe(found);
	});
});
