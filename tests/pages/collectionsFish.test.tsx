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
	[...container.querySelectorAll("button")]
		.find((b) => b.getAttribute("aria-label") === `${name}, show details`)!
		.closest("div.flex.flex-col.gap-2\\.5") as HTMLElement;
const cardCount = () => container.querySelectorAll('button[aria-label$=", show details"]').length;
const caughtSwitch = (name: string) =>
	container.querySelector(`[role="switch"][aria-label="${name} caught"]`) as HTMLElement;

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

const choose = async (select: HTMLSelectElement, value: string) => {
	await act(async () => {
		select.value = value;
		select.dispatchEvent(new Event("change", { bubbles: true }));
	});
};

const selectLabelled = (label: string) =>
	[...container.querySelectorAll("label")].find((l) => l.textContent?.trim() === label)
		?.control as HTMLSelectElement;

const radio = (label: string) =>
	[...container.querySelectorAll('input[type="radio"]')].find(
		(input) => input.closest("label")?.textContent?.trim() === label
	);

const flyout = () =>
	[...document.body.querySelectorAll("dialog")].find((el) =>
		el.textContent?.includes("Changes apply as you go")
	);

const openFilters = async () => {
	const button = [...container.querySelectorAll("button")].find((b) =>
		b.textContent?.startsWith("Filters")
	);
	await click(button);
};

const searchBox = () => container.querySelector('input[type="search"]') as HTMLInputElement;

beforeEach(() => {
	forgetMemoryState();
	localStorage.clear();
	navigation.search = "tab=fish";
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

describe("Collections page", () => {
	it("shows the empty card with no active playthrough", async () => {
		await mount();

		expect(text()).toContain("No active playthrough");
	});

	it("lists the thirteen tabs in two labeled groups and opens on Fish", async () => {
		seed(withData(() => {}));
		await mount();
		const tabs = [...container.querySelectorAll('[role="tab"]')];
		const groups = [...container.querySelectorAll('[role="tablist"]')].map((el) =>
			el.getAttribute("aria-label")
		);

		expect(tabs).toHaveLength(13);
		expect(groups).toEqual(["In-game collections", "Farm and goods"]);
		expect(
			tabs.filter((t) => t.getAttribute("aria-selected") === "true").map((t) => t.textContent)
		).toEqual(["Fish0 / 72"]);
	});

	it("shows no count on a tab that is not rebuilt, and writes the chosen tab into the address", async () => {
		seed(withData(() => {}));
		await mount();
		const minerals = [...container.querySelectorAll('[role="tab"]')].find(
			(t) => t.textContent === "Minerals"
		)!;

		await click(minerals);

		expect(navigation.replace).toHaveBeenCalledWith("/collections?tab=minerals", {
			scroll: false,
		});
	});

	it("points a tab that is not rebuilt to its old page", async () => {
		navigation.search = "tab=minerals";
		seed(withData(() => {}));
		await mount();

		expect(text()).toContain("This tab is not rebuilt yet");
		expect(container.querySelector('a[href="/collections/minerals"]')).not.toBeNull();
	});

	it("falls back to Overview for an unknown tab", async () => {
		navigation.search = "tab=nothing";
		seed(withData(() => {}));
		await mount();

		expect(text()).toContain("Items Shipped");
	});
});

describe("Fish tab", () => {
	beforeEach(() => {
		seed(withData(() => {}));
	});

	it("shows the summary tiles with the collection total of 72", async () => {
		await mount();

		expect(text()).toContain("Total fish");
		expect(text()).toContain("5 not in the collection");
		expect(text()).toContain("0/ 72");
		expect(text()).toContain("Rod fish");
		expect(text()).toContain("Crab-Pot");
		expect(text()).toContain("Fish 0 of 72 caught");
	});

	it("lists all 77 fish, each with a caught switch that is off", async () => {
		await mount();

		expect(cardCount()).toBe(77);
		expect(caughtSwitch("Anchovy").getAttribute("aria-checked")).toBe("false");
		expect(text()).toContain("Showing 77 of 77 fish");
	});

	it("writes the old entry when a fish is switched on, updates the counts and removes it when switched off", async () => {
		await mount();

		await click(caughtSwitch("Anchovy"));

		expect(stored().playthroughs[0].data.fishCaught).toEqual([
			{ id: "129", timesCaught: 1, largestSize: 0 },
		]);
		expect(caughtSwitch("Anchovy").getAttribute("aria-checked")).toBe("true");
		expect(text()).toContain("Fish 1 of 72 caught");
		expect(text()).toContain("1 / 72");

		await click(caughtSwitch("Anchovy"));

		expect(stored().playthroughs[0].data.fishCaught).toEqual([]);
	});

	it("offers Undo when a fish is switched off and brings back its real numbers", async () => {
		seed(
			withData((data) => {
				data.fishCaught = [{ id: "129", timesCaught: 8, largestSize: 31 }];
			})
		);
		await mount();

		await click(caughtSwitch("Anchovy"));

		expect(stored().playthroughs[0].data.fishCaught).toEqual([]);
		expect(document.body.textContent).toContain("Anchovy marked not caught");

		const undo = [...document.body.querySelectorAll("button")].find(
			(b) => b.textContent === "Undo"
		);
		await click(undo);

		expect(stored().playthroughs[0].data.fishCaught).toEqual([
			{ id: "129", timesCaught: 8, largestSize: 31 },
		]);
	});

	it("does not show a toast when a fish is switched on", async () => {
		await mount();

		await click(caughtSwitch("Anchovy"));

		expect(document.body.textContent).not.toContain("marked not caught");
	});

	it("states the caught state in words", async () => {
		await mount();

		expect(cardOf("Anchovy").textContent).toContain("Not caught");
		await click(caughtSwitch("Anchovy"));
		expect(cardOf("Anchovy").textContent).toContain("Caught");
	});

	it("notes a fish that the in-game collection leaves out", async () => {
		await mount();

		expect(cardOf("Ms. Angler").textContent).toContain("Not in the in-game collection");
		expect(cardOf("Anchovy").textContent).not.toContain("Not in the in-game collection");
	});

	it("filters by name and says how many are shown", async () => {
		await mount();

		await type(searchBox(), "carp");

		expect(cardCount()).toBeGreaterThan(0);
		expect(cardCount()).toBeLessThan(10);
		expect(text()).toMatch(/Showing \d+ of 77 fish/);
	});

	it("keeps the filters in a flyout that is closed until Filters is pressed", async () => {
		await mount();

		expect(container.querySelector('input[type="radio"]')).toBeNull();

		await openFilters();

		expect(flyout()?.textContent).toContain("Catch type");
		expect(flyout()?.textContent).toContain("Changes apply as you go");
	});

	it("filters by caught", async () => {
		await mount();
		await click(caughtSwitch("Anchovy"));
		await openFilters();

		await click(radio("Caught"));

		expect(cardCount()).toBe(1);
	});

	it("filters crab pot fish", async () => {
		await mount();
		await openFilters();

		await click(radio("Crab-Pot"));

		expect(cardCount()).toBe(10);
	});

	it("includes fish that bite in any weather when Sunny is chosen", async () => {
		await mount();
		const all = cardCount();
		await openFilters();

		await click(radio("Sunny"));
		const sunny = cardCount();
		await click(radio("Any"));

		expect(sunny).toBeGreaterThan(cardCount());
		expect(sunny).toBeLessThan(all);
	});

	it("keeps the fish with no difficulty reachable", async () => {
		await mount();
		await openFilters();

		await click(radio("No difficulty"));

		expect(cardCount()).toBe(13);
	});

	it("filters by an exact location from a select", async () => {
		await mount();
		await openFilters();

		await choose(
			container.querySelector('select[aria-label="Location"]') as HTMLSelectElement,
			"Mountain Lake"
		);

		expect(cardCount()).toBeGreaterThan(0);
		expect(cardCount()).toBeLessThan(10);
	});

	it("matches any chosen category", async () => {
		await mount();
		await openFilters();
		const chip = (label: string) =>
			[...container.querySelectorAll('input[type="checkbox"]')].find(
				(input) => input.closest("label")?.textContent?.trim() === label
			);

		await click(chip("Legendary"));
		const one = cardCount();
		await click(chip("Legendary II"));

		expect(one).toBeGreaterThan(0);
		expect(cardCount()).toBeGreaterThan(one);
	});

	it("counts the active filters on the button and the shown fish on the footer button", async () => {
		await mount();
		await openFilters();

		await click(radio("Crab-Pot"));
		await click(radio("No difficulty"));

		const filtersButton = [...container.querySelectorAll("button")].find((b) =>
			b.textContent?.startsWith("Filters")
		)!;
		expect(filtersButton.textContent).toContain("2");
		expect(
			[...container.querySelectorAll("button")].some(
				(b) => b.textContent === `Show ${cardCount()} fish`
			)
		).toBe(true);
	});

	it("resets every filter from the flyout", async () => {
		await mount();
		await openFilters();
		await click(radio("Crab-Pot"));
		expect(cardCount()).toBe(10);

		const reset = [...(flyout()?.querySelectorAll("button") ?? [])].find(
			(b) => b.textContent === "Reset"
		);
		await click(reset);

		expect(cardCount()).toBe(77);
	});

	it("explains an empty result and clears the filters", async () => {
		await mount();

		await type(searchBox(), "zzzz");

		expect(text()).toContain("No fish match your filters.");
		expect(cardCount()).toBe(0);

		const clear = [...container.querySelectorAll("button")].find(
			(b) => b.textContent === "Clear filters"
		);
		await click(clear);

		expect(cardCount()).toBe(77);
		expect(searchBox().value).toBe("");
	});

	it("remembers the filters when the page is left and opened again", async () => {
		await mount();
		await type(searchBox(), "carp");

		act(() => root.unmount());
		root = createRoot(container);
		await mount();

		expect(searchBox().value).toBe("carp");
	});

	it("opens the details of a fish and switches caught from inside", async () => {
		await mount();

		await click(container.querySelector('button[aria-label="Anchovy, show details"]'));

		const dialog = [...document.body.querySelectorAll("dialog")].find((el) =>
			el.textContent?.includes("Sell price")
		)!;
		expect(dialog.textContent).toContain("Anchovy");
		expect(dialog.textContent).toContain("Sell price");
		expect(dialog.textContent).toContain("Energy and health");
		expect(dialog.textContent).toContain("Produces Roe");
		expect(dialog.textContent).toContain("Fish pond");

		await click(dialog.querySelector('[role="switch"]'));

		expect(stored().playthroughs[0].data.fishCaught).toHaveLength(1);
	});

	describe("profession prices", () => {
		it("hides the control without a fishing profession", async () => {
			await mount();

			expect(text()).not.toContain("Profession prices");
		});

		it("shows the control with a profession, off by default", async () => {
			seed(
				withData((data) => {
					data.professions = ["8"];
				})
			);
			await mount();

			expect(text()).toContain("Profession prices");
			expect(text()).toContain("This playthrough has Angler");
			expect(text()).not.toContain("Angler Silver");
		});

		it("adds the bonus row under each price when switched on", async () => {
			seed(
				withData((data) => {
					data.professions = ["8"];
				})
			);
			await mount();
			const before = cardOf("Anchovy").textContent!;

			await click(
				container.querySelector(
					'[role="switch"][aria-labelledby="profession-prices-label"]'
				)
			);

			expect(before).not.toContain("Angler");
			expect(cardOf("Anchovy").textContent).toContain("Angler");
			expect(cardOf("Anchovy").textContent).toContain("45g");
		});

		it("lets the player choose between Fisher and Angler when both apply", async () => {
			seed(
				withData((data) => {
					data.professions = ["6", "8"];
				})
			);
			await mount();
			await click(
				container.querySelector(
					'[role="switch"][aria-labelledby="profession-prices-label"]'
				)
			);

			const professionsFieldset = [...container.querySelectorAll("fieldset")].find((el) =>
				el.textContent?.includes("Professions to show")
			)!;
			const checkboxes = [...professionsFieldset.querySelectorAll("input[type='checkbox']")];

			expect(checkboxes).toHaveLength(2);
			expect(cardOf("Anchovy").textContent).toContain("Angler");
			await click(checkboxes[1]);
			expect(cardOf("Anchovy").textContent).toContain("Fisher");
		});
	});
});
