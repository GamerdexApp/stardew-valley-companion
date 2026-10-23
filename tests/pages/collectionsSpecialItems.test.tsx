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
const savedData = () => stored().playthroughs[0].data;
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
	navigation.search = "tab=special-items";
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

const switchOf = (name: string, suffix: string) =>
	container.querySelector(`[role="switch"][aria-label="${name} ${suffix}"]`) as HTMLElement;

describe("Collections special items tab", () => {
	it("shows the four tiles and the 41 items", async () => {
		seed(withData(() => {}));
		await mount();
		const tiles = text().replace(/\s/g, "");

		for (const expected of ["Specialitems0/12", "Books0/19", "Mastery0/5", "Total0/36"]) {
			expect(tiles).toContain(expected);
		}
		expect(namesShown()).toHaveLength(41);
	});

	it("puts the acquired count on the pill and in the subline", async () => {
		seed(
			withData((data) => {
				data.specialItems = ["ForestMagic"];
				data.books = ["PriceCatalogue"];
				data.mastery.unlocked = ["farming"];
			})
		);
		await mount();

		const selected = container.querySelector('[role="tab"][aria-selected="true"]');
		expect(selected?.textContent).toBe("Special items3 / 36");
		expect(text()).toContain("3 of 36 collected");
	});

	it("saves a special item in specialItems and a book in books", async () => {
		seed(withData(() => {}));
		await mount();

		await click(switchOf("Forest Magic", "acquired"));
		await click(switchOf("Price Catalogue", "acquired"));

		expect(savedData().specialItems).toEqual(["ForestMagic"]);
		expect(savedData().books).toEqual(["PriceCatalogue"]);
		await click(switchOf("Forest Magic", "acquired"));
		expect(savedData().specialItems).toEqual([]);
		expect(document.body.textContent).not.toContain("Undo");
	});

	it("has no switch for a mastery or a skill book", async () => {
		seed(
			withData((data) => {
				data.mastery.unlocked = ["farming"];
			})
		);
		await mount();

		expect(switchOf("Farming Mastery", "acquired")).toBeNull();
		expect(switchOf("Bait And Bobber", "acquired")).toBeNull();
		expect(cardOf("Farming Mastery").textContent).toContain("Acquired");
		expect(cardOf("Mining Mastery").textContent).toContain("Not acquired");
		expect(cardOf("Mining Mastery").querySelector('a[href="/farm/character"]')).not.toBeNull();
		expect(cardOf("Bait And Bobber").textContent).toContain("Info");
	});

	it("filters by type, and a status filter keeps the skill books", async () => {
		seed(
			withData((data) => {
				data.specialItems = ["ForestMagic"];
			})
		);
		await mount();
		await openFilters();

		expect(flyout()!.textContent).toContain("Skill books are info only");
		await click(flyoutRadio("Books"));
		expect(namesShown()).toHaveLength(19);
		await reset();
		await click(flyoutRadio("Skill books"));
		await click(flyoutRadio("Acquired"));
		expect(namesShown()).toHaveLength(5);
		await reset();
		await click(flyoutRadio("Special items"));
		await click(flyoutRadio("Acquired"));
		expect(namesShown()).toEqual(["Forest Magic"]);
	});

	it("opens the effect and how to obtain in place", async () => {
		seed(withData(() => {}));
		await mount();
		const card = cardOf("Forest Magic");
		const toggle = [...card.querySelectorAll("button")].find(
			(b) => b.textContent === "Show details"
		)!;
		const region = card.querySelector(
			`#${CSS.escape(toggle.getAttribute("aria-controls")!)}`
		) as HTMLElement;

		expect(region.hidden).toBe(true);
		await click(toggle);
		expect(region.hidden).toBe(false);
		expect(region.textContent).toContain("How to obtain");
		expect(region.textContent).toContain("Meet The Wizard");
	});

	it("searches by name and shows a no match state with a clear button", async () => {
		seed(withData(() => {}));
		await mount();

		await type(searchBox(), "forest");
		expect(namesShown()).toContain("Forest Magic");
		await type(searchBox(), "zzzz");
		expect(text()).toContain("No items match your search.");
		await click(
			[...container.querySelectorAll("button")].find((b) => b.textContent === "Clear filters")
		);
		expect(namesShown()).toHaveLength(41);
	});
});
