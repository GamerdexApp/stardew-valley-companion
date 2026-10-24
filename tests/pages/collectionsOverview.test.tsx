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
const tile = (label: string) => container.querySelector(`[role="img"][aria-label="${label}"]`);
const sectionOf = (title: string) =>
	[...container.querySelectorAll('[role="region"]')].find(
		(el) => el.querySelector("h2")?.textContent === title
	) as HTMLElement;

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
});

describe("Collections overview tab", () => {
	it("is the tab the page opens on", async () => {
		seed(withData(() => {}));
		await mount();

		const selected = container.querySelector('[role="tab"][aria-selected="true"]');
		expect(selected?.textContent).toBe("Overview");
	});

	it("shows the seven summary tiles and the six sections", async () => {
		seed(withData(() => {}));
		await mount();

		const summary = (
			container.querySelector('section[aria-label="Summary"]')!.textContent ?? ""
		).replace(/\s/g, "");
		expect(summary).toContain("Collections");
		expect(summary).toContain("Collections0/6");
		expect(summary).toContain("Shipped0/154");
		expect(summary).toContain("Fish0/72");
		expect(summary).toContain("Crafting0/149");
		for (const title of [
			"Items Shipped",
			"Fish Caught",
			"Artifacts Found",
			"Minerals Found",
			"Cooking Recipes",
			"Crafting Recipes",
		]) {
			expect(sectionOf(title)).toBeTruthy();
		}
	});

	it("says it in words, not only by color, when an item is complete", async () => {
		seed(
			withData((data) => {
				data.fishCaught.push({ id: "128", timesCaught: 1, largestSize: 0 });
			})
		);
		await mount();

		expect(tile("Pufferfish, complete")).not.toBeNull();
		expect(tile("Anchovy, not complete")).not.toBeNull();
		expect(sectionOf("Fish Caught").textContent).toContain("1 of 72 complete");
	});

	it("counts a finished section in the subline and the first tile", async () => {
		seed(
			withData((data) => {
				for (let id = 0; id < 600; id++) {
					data.artifacts[String(id)] = { found: true, donated: false };
				}
			})
		);
		await mount();

		expect(text()).toContain("Overview · 1 of 6 collections complete");
	});

	it("links each section to its tab", async () => {
		seed(withData(() => {}));
		await mount();

		const link = (title: string) => sectionOf(title).querySelector("a")?.getAttribute("href");
		expect(link("Items Shipped")).toBe("/collections?tab=crops");
		expect(link("Fish Caught")).toBe("/collections?tab=fish");
		expect(link("Crafting Recipes")).toBe("/collections?tab=crafting");
	});

	it("collapses and expands a section from its heading", async () => {
		seed(withData(() => {}));
		await mount();
		const fish = sectionOf("Fish Caught");
		const toggle = fish.querySelector("h2 button") as HTMLButtonElement;
		const tiles = () => fish.querySelector("#fish-tiles") as HTMLElement;

		expect(toggle.getAttribute("aria-expanded")).toBe("true");
		expect(tiles().hidden).toBe(false);

		await act(async () => toggle.click());
		expect(toggle.getAttribute("aria-expanded")).toBe("false");
		expect(tiles().hidden).toBe(true);
		expect(
			(sectionOf("Items Shipped").querySelector("#shipped-tiles") as HTMLElement).hidden
		).toBe(false);
		expect(fish.textContent).toContain("0 of 72 complete");

		await act(async () => toggle.click());
		expect(tiles().hidden).toBe(false);
	});

	it("keeps a collapsed section collapsed after leaving the tab and coming back", async () => {
		seed(withData(() => {}));
		await mount();
		await act(async () =>
			(sectionOf("Minerals Found").querySelector("h2 button") as HTMLButtonElement).click()
		);
		act(() => root.unmount());
		root = createRoot(container);
		await mount();

		const minerals = sectionOf("Minerals Found");
		expect((minerals.querySelector("#minerals-tiles") as HTMLElement).hidden).toBe(true);
	});

	it("has no edit controls because it is derived", async () => {
		seed(withData(() => {}));
		await mount();

		expect(container.querySelector('[role="switch"]')).toBeNull();
		expect(container.querySelector("input")).toBeNull();
	});

	it("lets the keyboard reach both tab groups, and moves from the focused tab", async () => {
		seed(withData(() => {}));
		await mount();
		const lists = [...container.querySelectorAll('[role="tablist"]')];
		const stops = lists.map((list) =>
			[...list.querySelectorAll('[role="tab"]')].filter(
				(tab) => (tab as HTMLElement).tabIndex === 0
			)
		);

		expect(lists).toHaveLength(2);
		expect(stops.map((group) => group.length)).toEqual([1, 1]);
		expect(stops[0][0].textContent).toContain("Overview");
		expect(stops[1][0].textContent).toContain("Crops");

		const crops = stops[1][0] as HTMLElement;
		await act(async () => {
			crops.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
		});
		expect(navigation.replace).toHaveBeenLastCalledWith(
			expect.stringContaining("tab=forageables"),
			expect.anything()
		);

		await act(async () => {
			crops.dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true }));
		});
		expect(navigation.replace).toHaveBeenLastCalledWith(
			expect.stringContaining("tab=special-items"),
			expect.anything()
		);
	});
});
