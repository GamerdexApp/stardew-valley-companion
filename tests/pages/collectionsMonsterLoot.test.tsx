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
	navigation.search = "tab=monster-loot";
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

describe("Collections monster loot tab", () => {
	it("shows the tiles and the 6 loot items", async () => {
		seed(withData(() => {}));
		await mount();
		const tiles = text().replace(/\s/g, "");

		expect(tiles).toContain("Totallootitems6");
		expect(tiles).toContain("Itemsshipped0/5");
		expect(namesShown()).toHaveLength(6);
	});

	it("puts the shipped count on the pill and in the subline", async () => {
		seed(
			withData((data) => {
				data.shipped["684"] = { shipped: true, count: 3 };
			})
		);
		await mount();

		const selected = container.querySelector('[role="tab"][aria-selected="true"]');
		expect(selected?.textContent).toBe("Monster loot1 / 5");
		expect(text()).toContain("1 of 5 shipped");
	});

	it("shows the monsters that drop an item", async () => {
		seed(withData(() => {}));
		await mount();

		expect(cardOf("Bug Meat").textContent).toContain("Dropped by");
		for (const monster of ["Bug", "Grub", "Fly"]) {
			expect(cardOf("Bug Meat").textContent).toContain(monster);
		}
	});

	it("has no shipped control for the Dragon Tooth", async () => {
		seed(withData(() => {}));
		await mount();

		expect(shippedSwitch("Dragon Tooth")).toBeNull();
		expect(cardOf("Dragon Tooth").textContent).toContain("Cannot be shipped");
		expect(shippedSwitch("Bug Meat")).not.toBeNull();
	});

	it("ships an item, steps its count and Undo restores a deleted count", async () => {
		seed(withData(() => {}));
		await mount();

		await click(shippedSwitch("Slime"));
		expect(saved("766")).toEqual({ shipped: true, count: 1 });
		await click(
			cardOf("Slime").querySelector('button[aria-label="Raise Slime shipped count"]')
		);
		expect(saved("766")).toEqual({ shipped: true, count: 2 });
		await click(shippedSwitch("Slime"));
		expect(saved("766")).toBeUndefined();
		await click(toastButton("Undo"));
		expect(saved("766")).toEqual({ shipped: true, count: 2 });
	});

	it("lists only items that can still be shipped under Not shipped", async () => {
		seed(
			withData((data) => {
				data.shipped["684"] = { shipped: true, count: 1 };
			})
		);
		await mount();
		await openFilters();

		expect(flyout()!.textContent).toContain("Items the game does not count (Dragon Tooth)");
		await click(flyoutRadio("Not shipped"));
		expect(namesShown()).toHaveLength(4);
		expect(namesShown()).not.toContain("Dragon Tooth");
		await reset();
		await click(flyoutRadio("Not shippable"));
		expect(namesShown()).toEqual(["Dragon Tooth"]);
		await reset();
		await click(flyoutRadio("Shipped"));
		expect(namesShown()).toEqual(["Bug Meat"]);
	});

	it("searches the name and the monster", async () => {
		seed(withData(() => {}));
		await mount();

		await type(searchBox(), "lava");
		expect(namesShown().sort()).toEqual(["Bat Wing", "Dragon Tooth"]);
	});

	it("shows a no match state with a clear button", async () => {
		seed(withData(() => {}));
		await mount();

		await type(searchBox(), "zzzz");
		expect(text()).toContain("No loot matches your search.");
		await click(
			[...container.querySelectorAll("button")].find((b) => b.textContent === "Clear filters")
		);
		expect(namesShown()).toHaveLength(6);
	});
});
