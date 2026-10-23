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
const cardOf = (name: string) =>
	[...container.querySelectorAll("span.font-semibold")]
		.find((el) => el.textContent === name)!
		.closest("div.flex.flex-col.gap-2\\.5") as HTMLElement;
const nameCount = () => container.querySelectorAll("span.font-semibold").length;
const shippedSwitch = (name: string) =>
	container.querySelector(`[role="switch"][aria-label="${name} shipped"]`) as HTMLElement;
const saved = (id: string) => stored().playthroughs[0].data.shipped[id];

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
	navigation.search = "tab=crops";
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

describe("Collections crops tab", () => {
	it("shows the tiles and all 47 crops", async () => {
		seed(withData(() => {}));
		await mount();
		const tiles = text().replace(/\s/g, "");

		for (const expected of [
			"Totalcrops47",
			"Regrowing17",
			"Shipped0/46",
			"Shipped15+0",
			"Shipped300+0",
		]) {
			expect(tiles).toContain(expected);
		}
		expect(nameCount()).toBe(47);
		expect(text()).toContain("Showing 47 of 47 crops");
	});

	it("counts the 46 shippable crops on the pill and in the subline", async () => {
		seed(
			withData((data) => {
				data.shipped["24"] = { shipped: true, count: 20 };
				data.shipped["190"] = { shipped: true, count: 400 };
			})
		);
		await mount();

		const selected = container.querySelector('[role="tab"][aria-selected="true"]');
		expect(selected?.textContent).toBe("Crops2 / 46");
		expect(text()).toContain("2 of 46 shipped");
		const tiles = text().replace(/\s/g, "");
		expect(tiles).toContain("Shipped15+2");
		expect(tiles).toContain("Shipped300+1");
	});

	it("shows seed shops, grow days, regrow days, harvest and chips on a card", async () => {
		seed(withData(() => {}));
		await mount();

		expect(cardOf("Parsnip").textContent).toContain("Parsnip Seeds");
		expect(cardOf("Parsnip").textContent).toContain("Pierre's 20g · JojaMart 25g");
		expect(cardOf("Parsnip").textContent).toContain("Grow");
		expect(cardOf("Parsnip").textContent).toContain("4d");
		expect(cardOf("Parsnip").textContent).not.toContain("Regrow");
		expect(cardOf("Potato").textContent).toContain("×1–4");
		expect(cardOf("Carrot").textContent).toContain("No shop");
		expect(cardOf("Cauliflower").textContent).toContain("Giant");
		expect(cardOf("Green Bean").textContent).toContain("Trellis");
		expect(cardOf("Green Bean").textContent).toContain("Regrow");
		expect(cardOf("Parsnip").textContent).toContain("Juice");
		expect(cardOf("Parsnip").textContent).toContain("Pickles");
	});

	it("has no shipped control for Qi Fruit and says why", async () => {
		seed(withData(() => {}));
		await mount();

		expect(shippedSwitch("Qi Fruit")).toBeNull();
		expect(cardOf("Qi Fruit").textContent).toContain("Not part of the shipping collection");
		expect(shippedSwitch("Parsnip")).not.toBeNull();
	});

	it("ships a crop with a count of one and steps the count", async () => {
		seed(withData(() => {}));
		await mount();

		await click(shippedSwitch("Parsnip"));
		expect(saved("24")).toEqual({ shipped: true, count: 1 });
		const raise = () =>
			cardOf("Parsnip").querySelector('button[aria-label="Raise Parsnip shipped count"]');
		await click(raise());
		await click(raise());
		expect(saved("24")).toEqual({ shipped: true, count: 3 });
		await click(
			cardOf("Parsnip").querySelector('button[aria-label="Lower Parsnip shipped count"]')
		);
		expect(saved("24")).toEqual({ shipped: true, count: 2 });
	});

	it("deletes the count when switched off and Undo brings it back", async () => {
		seed(
			withData((data) => {
				data.shipped["24"] = { shipped: true, count: 120 };
			})
		);
		await mount();

		await click(shippedSwitch("Parsnip"));

		expect(saved("24")).toBeUndefined();
		expect(document.body.textContent).toContain("Parsnip marked not shipped");
		await click(toastButton("Undo"));
		expect(saved("24")).toEqual({ shipped: true, count: 120 });
	});

	it("keeps the details closed and opens them in place with the XP and growth stages", async () => {
		seed(withData(() => {}));
		await mount();
		const card = cardOf("Parsnip");
		const toggle = [...card.querySelectorAll("button")].find(
			(b) => b.textContent === "Show details"
		)!;
		const region = card.querySelector(
			`#${CSS.escape(toggle.getAttribute("aria-controls")!)}`
		) as HTMLElement;

		expect(toggle.getAttribute("aria-expanded")).toBe("false");
		expect(region.hidden).toBe(true);
		await click(toggle);
		expect(toggle.getAttribute("aria-expanded")).toBe("true");
		expect(toggle.textContent).toBe("Hide details");
		expect(region.hidden).toBe(false);
		expect(region.textContent).toContain("Farming XP");
		expect(region.textContent).toContain("8");
		expect(region.querySelectorAll("ol img")).toHaveLength(5);
	});

	it("filters by season, shipped state, regrowth, trellis and giant in the flyout", async () => {
		seed(
			withData((data) => {
				data.shipped["24"] = { shipped: true, count: 1 };
			})
		);
		await mount();
		await openFilters();

		await click(flyoutRadio("Giant"));
		expect(nameCount()).toBe(5);
		await reset();
		await click(flyoutRadio("Trellis"));
		expect(nameCount()).toBe(4);
		await reset();
		await click(flyoutRadio("Regrowing"));
		expect(nameCount()).toBe(17);
		await reset();
		await click(flyoutRadio("Shipped"));
		expect(nameCount()).toBe(1);
		await reset();
		await click(flyoutRadio("Winter"));
		expect(nameCount()).toBeGreaterThan(0);
		expect(nameCount()).toBeLessThan(47);
		expect(flyout()!.textContent).toMatch(/Show \d+ crops/);
	});

	it("searches by name and remembers it while the app stays open", async () => {
		seed(withData(() => {}));
		await mount();

		await type(searchBox(), "bean");
		expect(nameCount()).toBe(2);
		act(() => root.unmount());
		root = createRoot(container);
		await mount();
		expect(nameCount()).toBe(2);
	});

	it("hides the Professions control without Tiller and adds the Tiller price with it", async () => {
		seed(withData(() => {}));
		await mount();
		expect(text()).not.toContain("Profession prices");
		act(() => root.unmount());
		root = createRoot(container);
		forgetMemoryState();
		seed(
			withData((data) => {
				data.professions = ["1"];
			})
		);
		await mount();

		expect(text()).toContain("Shows the Tiller bonus");
		expect(cardOf("Parsnip").textContent).not.toContain("Tiller");
		await click(
			container.querySelector('[role="switch"][aria-labelledby="profession-prices-label"]')
		);
		expect(cardOf("Parsnip").textContent).toContain("Tiller");
	});

	it("shows a no match state with a clear button", async () => {
		seed(withData(() => {}));
		await mount();

		await type(searchBox(), "zzzz");

		expect(text()).toContain("No crops match your filters.");
		await click(
			[...container.querySelectorAll("button")].find((b) => b.textContent === "Clear filters")
		);
		expect(nameCount()).toBe(47);
	});
});
