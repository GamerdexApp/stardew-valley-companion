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
const saved = (name: string) => stored().playthroughs[0].data.craftingRecipes[name];

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
	navigation.search = "tab=crafting";
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

const buttonByText = (label: string) =>
	[...container.querySelectorAll("button")].find((b) => b.textContent === label);
const groupOf = (title: string) =>
	[...container.querySelectorAll("section[aria-labelledby]")].find(
		(el) => el.querySelector("h2")?.textContent === title
	) as HTMLElement;
const groupToggle = (title: string) =>
	groupOf(title).querySelector("h2 button") as HTMLButtonElement;
const groupBody = (title: string) =>
	groupOf(title).querySelector("[id$='-recipes']") as HTMLElement;

describe("Collections crafting tab", () => {
	it("shows the three tiles, with 150 listed and 149 counted", async () => {
		seed(withData(() => {}));
		await mount();
		const tiles = text().replace(/\s/g, "");

		expect(tiles).toContain("Totalrecipes150");
		expect(tiles).toContain("1notinthecollection");
		expect(tiles).toContain("Recipeslearned0/149");
		expect(tiles).toContain("Recipescrafted0/149");
		expect(text()).toContain("Showing 150 of 150 recipes");
	});

	it("puts the crafted count on the pill and crafted and learned in the subline", async () => {
		seed(
			withData((data) => {
				data.craftingRecipes["Bomb"] = { learned: true, crafted: true };
				data.craftingRecipes["Cherry Bomb"] = { learned: true, crafted: false };
				data.craftingRecipes["Wedding Ring"] = { learned: true, crafted: true };
			})
		);
		await mount();

		const selected = container.querySelector('[role="tab"][aria-selected="true"]');
		expect(selected?.textContent).toBe("Crafting1 / 149");
		expect(text()).toContain("1 of 149 crafted · 2 learned");
	});

	it("groups the recipes by category with a crafted badge, the first two open", async () => {
		seed(
			withData((data) => {
				data.craftingRecipes["Bomb"] = { learned: true, crafted: true };
			})
		);
		await mount();
		const headings = [...container.querySelectorAll("section[aria-labelledby] h2")].map(
			(h) => h.textContent
		);

		expect(headings).toHaveLength(20);
		expect(headings.slice(0, 3)).toEqual(["Artisan Equipment", "Bombs", "Combat"]);
		expect(groupOf("Bombs").textContent).toContain("1 / 3 crafted");
		expect(groupBody("Artisan Equipment").hidden).toBe(false);
		expect(groupBody("Bombs").hidden).toBe(false);
		expect(groupBody("Combat").hidden).toBe(true);
	});

	it("opens and closes a group from its heading and remembers it", async () => {
		seed(withData(() => {}));
		await mount();

		await click(groupToggle("Combat"));
		expect(groupBody("Combat").hidden).toBe(false);
		expect(groupToggle("Combat").getAttribute("aria-expanded")).toBe("true");
		await click(groupToggle("Bombs"));
		expect(groupBody("Bombs").hidden).toBe(true);

		act(() => root.unmount());
		root = createRoot(container);
		await mount();
		expect(groupBody("Combat").hidden).toBe(false);
		expect(groupBody("Bombs").hidden).toBe(true);
	});

	it("expands and collapses every group", async () => {
		seed(withData(() => {}));
		await mount();

		await click(buttonByText("Expand all"));
		expect(container.querySelectorAll("[id$='-recipes'][hidden]")).toHaveLength(0);
		await click(buttonByText("Collapse all"));
		expect(container.querySelectorAll("[id$='-recipes']:not([hidden])")).toHaveLength(0);
	});

	it("opens every group with a match while a filter is on", async () => {
		seed(withData(() => {}));
		await mount();

		await type(searchBox(), "totem");

		expect(groupBody("Totems").hidden).toBe(false);
		expect(cardCount()).toBeGreaterThan(0);
	});

	it("shows source, ingredients and Makes N on a card", async () => {
		seed(withData(() => {}));
		await mount();

		expect(cardOf("Bomb").textContent).toContain("Mining Level 6");
		expect(cardOf("Bomb").textContent).toContain("4× Iron Ore");
		expect(cardOf("Bomb").textContent).toContain("1× Coal");
		expect(cardOf("Bomb").textContent).not.toContain("Makes");
		await click(groupToggle("Fences"));
		expect(cardOf("Iron Fence").textContent).toContain("Makes 10");
	});

	it("notes the Wedding Ring as outside the in-game collection", async () => {
		seed(withData(() => {}));
		await mount();
		await click(groupToggle("Rings"));

		expect(cardOf("Wedding Ring").textContent).toContain("Not in the in-game collection");
		expect(cardOf("Wedding Ring").textContent).toContain("Special");
	});

	it("saves Learned with no toast and Crafted as both with the Learned toast and Undo", async () => {
		seed(withData(() => {}));
		await mount();

		await click(statusRadio(container, "Bomb", "learned"));
		expect(saved("Bomb")).toEqual({ learned: true, crafted: false });
		expect(document.body.textContent).not.toContain("also marked");

		await click(statusRadio(container, "Cherry Bomb", "done"));
		expect(saved("Cherry Bomb")).toEqual({ learned: true, crafted: true });
		expect(document.body.textContent).toContain(
			"Cherry Bomb set to Crafted. It was also marked Learned."
		);
		await click(toastButton("Undo"));
		expect(saved("Cherry Bomb")).toBeUndefined();
	});

	it("says both were cleared when Not learned follows Crafted, and Undo restores them", async () => {
		seed(
			withData((data) => {
				data.craftingRecipes["Bomb"] = { learned: true, crafted: true };
			})
		);
		await mount();

		await click(statusRadio(container, "Bomb", "not-learned"));

		expect(saved("Bomb")).toBeUndefined();
		expect(document.body.textContent).toContain(
			"Bomb set to Not learned. Learned and Crafted were cleared."
		);
		await click(toastButton("Undo"));
		expect(saved("Bomb")).toEqual({ learned: true, crafted: true });
	});

	it("filters by status and by category in the flyout", async () => {
		seed(
			withData((data) => {
				data.craftingRecipes["Bomb"] = { learned: true, crafted: true };
				data.craftingRecipes["Cherry Bomb"] = { learned: true, crafted: false };
			})
		);
		await mount();
		await openFilters();

		expect(flyout()!.textContent).toContain("Learned means learned but not crafted yet.");
		await click(flyoutRadio("Learned"));
		expect(cardCount()).toBe(1);
		await reset();
		await click(flyoutRadio("Crafted"));
		expect(cardCount()).toBe(1);
		await reset();
		const select = flyout()!.querySelector(
			'select[aria-label="Category"]'
		) as HTMLSelectElement;
		await act(async () => {
			select.value = "Bombs";
			select.dispatchEvent(new Event("change", { bubbles: true }));
		});
		expect(cardCount()).toBe(3);
		expect(flyout()!.textContent).toContain("Show 3 recipes");
		expect(select.textContent).toContain("All categories (20)");
	});

	it("opens a dialog with source, output, a Big Craftable note and the ingredients", async () => {
		seed(withData(() => {}));
		await mount();

		await click(container.querySelector('button[aria-label="Bomb, show details"]'));
		const dialog = [...document.body.querySelectorAll("dialog")].find((d) =>
			d.textContent?.includes("Output")
		)!;

		expect(dialog.textContent).toContain("Crafted always includes Learned");
		expect(dialog.textContent).toContain("Mining Level 6");
		expect(dialog.textContent).toContain("Bomb × 1");
		expect(dialog.textContent).toContain("Iron Ore");
		expect(dialog.textContent).not.toContain("Big Craftable");
		await click(statusRadio(dialog, "Bomb", "learned"));
		expect(saved("Bomb")).toEqual({ learned: true, crafted: false });
	});

	it("shows the Big Craftable note for a big craftable output", async () => {
		seed(withData(() => {}));
		await mount();
		await click(container.querySelector('button[aria-label="Bee House, show details"]'));
		const dialog = [...document.body.querySelectorAll("dialog")].find((d) =>
			d.textContent?.includes("Output")
		)!;

		expect(dialog.textContent).toContain("Big Craftable");
	});

	it("shows a no match state with a clear button", async () => {
		seed(withData(() => {}));
		await mount();

		await type(searchBox(), "zzzz");

		expect(text()).toContain("No recipes match your filters.");
		await click(buttonByText("Clear filters"));
		expect(cardCount()).toBeGreaterThan(0);
	});
});
