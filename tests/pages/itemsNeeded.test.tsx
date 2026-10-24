import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act } from "react";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import type { AppData } from "@/types/app";
import { PlaythroughProvider } from "@/lib/contexts/PlaythroughContext";
import { UIProvider } from "@/lib/contexts/UIContext";
import { forgetMemoryState } from "@/lib/hooks/useMemoryState";
import { STORAGE_KEY } from "@/service/storage";
import { ItemsNeededPage } from "@/comps/items-needed/ItemsNeededPage";
import { ToastProvider } from "@/comps/ui/Toast";
import { emptyPlaythrough } from "../storage/fixtures";

const navigation = vi.hoisted(() => ({ search: "", replace: vi.fn() }));

vi.mock("next/navigation", () => ({
	useRouter: () => ({ replace: navigation.replace }),
	usePathname: () => "/items-needed",
	useSearchParams: () => new URLSearchParams(navigation.search),
}));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root;
let container: HTMLElement;

const seed = (data: AppData) => localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
const stored = () => JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null") as AppData;
const data = () => stored().playthroughs[0].data;

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
						<ItemsNeededPage />
					</PlaythroughProvider>
				</ToastProvider>
			</UIProvider>
		);
	});
};

const text = () => container.textContent ?? "";
const compact = () => text().replace(/\s/g, "");
const click = async (element: Element | null | undefined) => {
	expect(element).toBeTruthy();
	await act(async () => {
		element!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
	});
};
const type = async (input: HTMLInputElement | null | undefined, value: string) => {
	expect(input).toBeTruthy();
	await act(async () => {
		Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(
			input!,
			value
		);
		input!.dispatchEvent(new Event("input", { bubbles: true }));
	});
};
const control = (label: string) =>
	document.body.querySelector(`[aria-label="${label}"]`) as HTMLElement | null;
const names = () =>
	[
		...container.querySelectorAll(
			"div.grid > div span.font-semibold, div.grid > div .min-w-0.flex-1.font-semibold"
		),
	]
		.map((el) => el.textContent!)
		.filter(Boolean);
const tile = (label: string) =>
	[...container.querySelectorAll('[role="group"] button')].find((el) =>
		el.textContent?.toLowerCase().startsWith(label.toLowerCase())
	) as HTMLButtonElement;
const searchBox = () => container.querySelector('input[type="search"]') as HTMLInputElement;
const toastUndo = () =>
	[...document.body.querySelectorAll("button")].find((b) => b.textContent === "Undo");
const dialog = () => document.body.querySelector("dialog[open]") as HTMLElement | null;
const button = (root: ParentNode, label: string) =>
	[...root.querySelectorAll("button")].find((b) => b.textContent?.trim() === label);

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
	document.body.querySelectorAll("dialog").forEach((d) => d.remove());
});

const tracked = (d: AppData["playthroughs"][number]["data"]) => {
	d.trackedGifts = [
		{ itemName: "Pizza", villagerName: "Sam", given: false, preference: "loves" },
		{ itemName: "Maple Syrup", villagerName: "Universal", given: false, preference: "likes" },
		{ itemName: "Salad", villagerName: "Abigail", given: true, preference: "likes" },
	];
};

describe("Items needed with no playthrough", () => {
	it("lists everything from scratch with a note, and cannot filter by Gift", async () => {
		await mount();

		expect(text()).toContain(
			"Create a playthrough to see your personal progress. Showing all items needed from scratch."
		);
		expect(compact()).toContain("Donate95");
		expect(compact()).toContain("Ship154");
		expect(tile("Gift").disabled).toBe(true);
		expect(container.textContent).not.toContain("Track a gift");
		expect(text()).toContain("Needed for: All");
	});

	it("ignores a Gift filter in the address", async () => {
		navigation.search = "tag=Gift";
		await mount();

		expect(tile("Total").getAttribute("aria-pressed")).toBe("true");
	});
});

describe("Items needed with a playthrough", () => {
	it("counts what is left and shows no banner", async () => {
		seed(withData(() => {}));
		await mount();

		expect(text()).not.toContain("Create a playthrough");
		expect(compact()).toContain("Donate95");
		expect(compact()).toContain("Gift0");
		expect(text()).toContain(
			"Gifts you plan to give. Marking one gifted removes it from this list."
		);
		expect(button(container, "Track a gift0")).toBeTruthy();
	});

	it("takes a donated item out of the counts", async () => {
		seed(withData((d) => (d.minerals = { "80": { found: true, donated: true } } as never)));
		await mount();

		expect(compact()).toContain("Donate94");
	});

	it("writes the Needed for choice into the address from a tile", async () => {
		seed(withData(() => {}));
		await mount();

		await click(tile("Ship"));

		expect(navigation.replace).toHaveBeenCalledWith("/items-needed?tag=Ship", {
			scroll: false,
		});
		await click(tile("Total"));
		expect(navigation.replace).toHaveBeenLastCalledWith("/items-needed", { scroll: false });
	});

	it("reads the choice and the search from the address", async () => {
		navigation.search = "tag=Ship&q=copper";
		seed(withData(() => {}));
		await mount();

		expect(tile("Ship").getAttribute("aria-pressed")).toBe("true");
		expect(searchBox().value).toBe("copper");
		expect(text()).toMatch(/Showing \d+ of \d+ items · Needed for: Ship/);
		expect(names().length).toBeGreaterThan(0);
		expect(names().every((name) => name.toLowerCase().includes("copper"))).toBe(true);
	});

	it("writes the search into the address and narrows the list", async () => {
		seed(withData(() => {}));
		await mount();

		await type(searchBox(), "copper");

		expect(navigation.replace).toHaveBeenCalledWith("/items-needed?q=copper", {
			scroll: false,
		});
		expect(names().every((name) => name.toLowerCase().includes("copper"))).toBe(true);
	});

	it("shows what an item is needed for, with a tag and a quantity for each use", async () => {
		navigation.search = "q=Sugar";
		seed(withData(() => {}));
		await mount();
		const card = container.querySelector("div.grid > div") as HTMLElement;

		expect(card.textContent).toContain("Sugar");
		expect(card.textContent).toMatch(/Cook|Craft/);
		expect(card.textContent).toMatch(/×\d/);
		expect(card.querySelectorAll("ul li").length).toBeGreaterThan(1);
	});

	it("shows an empty state for a search with no match, and one for a finished tag", async () => {
		navigation.search = "q=zzzzzz";
		seed(withData(() => {}));
		await mount();

		expect(text()).toContain("No items match your search.");
		expect(button(container, "Clear filters")).toBeTruthy();
	});

	it("says a tag is complete when nothing is left for it", async () => {
		navigation.search = "tag=Build";
		seed(
			withData((d) => {
				d.buildings = ["Earth", "Water", "Desert", "Island"].map((kind, index) => ({
					id: String(index),
					type: `${kind} Obelisk`,
					animalCount: 0,
				}));
				d.buildings.push({ id: "clock", type: "Gold Clock", animalCount: 0 });
			})
		);
		await mount();

		expect(text()).toContain("All Build items complete!");
		expect(text()).toContain("Great work, this category is done.");
	});
});

describe("Tracked gifts on the page", () => {
	it("lists a tracked gift with its villager and preference, and counts it", async () => {
		navigation.search = "tag=Gift";
		seed(withData(tracked));
		await mount();

		expect(compact()).toContain("Gift2");
		expect(text()).toContain("Pizza");
		expect(text()).toContain("Sam (loves)");
		expect(text()).toContain("Maple Syrup");
		expect(text()).toContain("Any villager (likes)");
		expect(text()).not.toContain("Salad");
		expect(button(container, "Track a gift2")).toBeTruthy();
	});

	it("marks a gift gifted with a toast, and Undo puts it back", async () => {
		navigation.search = "tag=Gift";
		seed(withData(tracked));
		await mount();

		await click(control("Mark Pizza gifted to Sam"));

		expect(data().trackedGifts[0].given).toBe(true);
		expect(document.body.textContent).toContain("Pizza marked gifted to Sam.");
		expect(text()).not.toContain("Sam (loves)");
		await click(toastUndo());
		expect(data().trackedGifts[0].given).toBe(false);
	});

	it("stops tracking a gift with Undo", async () => {
		navigation.search = "tag=Gift";
		seed(withData(tracked));
		await mount();

		await click(control("Stop tracking Maple Syrup for Any villager"));

		expect(data().trackedGifts.map((gift) => gift.itemName)).toEqual(["Pizza", "Salad"]);
		expect(document.body.textContent).toContain(
			"Stopped tracking Maple Syrup for Any villager."
		);
		await click(toastUndo());
		expect(data().trackedGifts).toHaveLength(3);
	});
});

describe("Track a gift", () => {
	const open = async () => {
		await click(button(container, "Track a gift2") ?? button(container, "Track a gift0"));
	};

	it("opens with the tracked gifts, the universal tiers and all 34 villagers", async () => {
		seed(withData(tracked));
		await mount();
		await open();

		expect(dialog()!.textContent).toContain("Currently tracking (2)");
		expect(dialog()!.textContent).toContain("Pizza for Sam");
		expect(dialog()!.textContent).toContain("Maple Syrup for Any villager");
		expect(dialog()!.textContent).toContain("Universal gifts");
		expect(dialog()!.textContent).toContain("By villager (34)");
		expect(dialog()!.textContent).toContain("Pick a villager or a universal group");
	});

	it("says when nothing is tracked", async () => {
		seed(withData(() => {}));
		await mount();
		await open();

		expect(dialog()!.textContent).toContain("No gifts tracked yet.");
	});

	it("picks a villager, adds a gift and ignores a duplicate", async () => {
		seed(withData(() => {}));
		await mount();
		await open();

		await click(button(dialog()!, "Abigail"));
		expect(dialog()!.textContent).toContain("Pick an item for Abigail");
		expect(dialog()!.textContent).toContain(
			"Loves, likes and neutral gifts. Duplicates are ignored."
		);
		const add = dialog()!.querySelector(
			'button[aria-label^="Track "][aria-label$=" for Abigail"]'
		) as HTMLElement;
		const label = add.getAttribute("aria-label")!;
		await click(add);

		expect(data().trackedGifts).toHaveLength(1);
		expect(data().trackedGifts[0]).toMatchObject({ villagerName: "Abigail", given: false });
		expect(dialog()!.querySelector(`button[aria-label="${label}"]`)).toBeNull();
		expect(dialog()!.textContent).toContain("Currently tracking (1)");
	});

	it("removes a tracked gift from the picker with its trash button", async () => {
		seed(withData(tracked));
		await mount();
		await open();
		await click(button(dialog()!, "Sam"));

		await click(dialog()!.querySelector('button[aria-label="Stop tracking Pizza for Sam"]'));

		expect(data().trackedGifts.map((gift) => gift.itemName)).not.toContain("Pizza");
	});

	it("picks a universal tier and tracks a gift for any villager", async () => {
		seed(withData(() => {}));
		await mount();
		await open();

		await click(button(dialog()!, "Loves6"));
		expect(dialog()!.textContent).toContain("Pick a universal gift (Loves)");
		await click(
			dialog()!.querySelector('button[aria-label="Track Golden Pumpkin for Any villager"]')
		);

		expect(data().trackedGifts[0]).toMatchObject({
			itemName: "Golden Pumpkin",
			villagerName: "Universal",
			preference: "loves",
		});
		await click(button(dialog()!, "Back to all"));
		expect(dialog()!.textContent).toContain("Pick a villager or a universal group");
	});

	it("marks a gift gifted from the list and undoes the last one", async () => {
		seed(withData(tracked));
		await mount();
		await open();

		await click(dialog()!.querySelector('button[aria-label="Mark Pizza gifted to Sam"]'));

		expect(data().trackedGifts[0].given).toBe(true);
		expect(dialog()!.textContent).toContain("Gifted: Pizza for Sam");
		expect(dialog()!.textContent).toContain("Currently tracking (1)");
		await click(button(dialog()!, "Undo last"));
		expect(data().trackedGifts[0].given).toBe(false);
		expect(dialog()!.textContent).toContain("Currently tracking (2)");
		expect(dialog()!.textContent).not.toContain("Undo last");
	});

	it("closes with Done and the count on the button follows", async () => {
		seed(withData(tracked));
		await mount();
		await open();
		await click(dialog()!.querySelector('button[aria-label="Stop tracking Pizza for Sam"]'));

		await click(button(dialog()!, "Done"));

		expect(dialog()).toBeNull();
		expect(button(container, "Track a gift1")).toBeTruthy();
	});
});
