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
const block = (title: string) =>
	[...container.querySelectorAll("section[aria-labelledby]")].find(
		(el) => el.querySelector("h2")?.textContent === title
	) as HTMLElement;
const cardsIn = (root: ParentNode) =>
	root.querySelectorAll('button[aria-label$=", show details"]').length;
const cardOf = (root: ParentNode, name: string) =>
	root
		.querySelector(`button[aria-label="${name}, show details"]`)!
		.closest("div.flex.flex-col.gap-2\\.5") as HTMLElement;
const statusRadio = (root: ParentNode, name: string, status: string) =>
	[...root.querySelectorAll("fieldset")]
		.find((f) => f.querySelector("legend")?.textContent === `${name} status`)
		?.querySelector(`input[value="${status}"]`) as HTMLInputElement;
const shippedSwitch = (root: ParentNode, name: string) =>
	root.querySelector(`[role="switch"][aria-label="${name} shipped"]`) as HTMLElement;
const saved = (kind: "minerals" | "shipped", id: string) => stored().playthroughs[0].data[kind][id];

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

const searchIn = (root: ParentNode) =>
	root.querySelector('input[type="search"]') as HTMLInputElement;
const buttonWith = (root: ParentNode, label: string) =>
	[...root.querySelectorAll("button")].find((b) => b.textContent === label);
const toastButton = (label: string) => buttonWith(document.body, label);

const flyout = () =>
	[...document.body.querySelectorAll("dialog")].find((el) =>
		el.textContent?.includes("Changes apply as you go")
	);
const openFilters = async (root: ParentNode) =>
	click([...root.querySelectorAll("button")].find((b) => b.textContent?.startsWith("Filters")));
const flyoutRadio = (label: string) =>
	[...flyout()!.querySelectorAll('input[type="radio"]')].find(
		(input) => input.closest("label")?.textContent?.trim() === label
	);
const dialogWith = (needle: string) =>
	[...document.body.querySelectorAll("dialog")].find((d) => d.textContent?.includes(needle))!;

beforeEach(() => {
	forgetMemoryState();
	localStorage.clear();
	navigation.search = "tab=minerals";
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

describe("Collections minerals tab", () => {
	it("shows the eleven tiles and the six blocks with their badges", async () => {
		seed(withData(() => {}));
		await mount();
		const tiles = text().replace(/\s/g, "");

		for (const expected of [
			"Totalminerals53",
			"Mineralsfound0/53",
			"Totalores5",
			"Totalbars6",
			"Totalresources3",
			"Totalgeodes8",
			"Totalnodes26",
		]) {
			expect(tiles).toContain(expected);
		}
		expect(block("Minerals").textContent).toContain("0 / 53 donated");
		expect(block("Geodes").textContent).toContain("8 types");
		expect(block("Ores").textContent).toContain("0 / 5 shipped");
		expect(block("Bars").textContent).toContain("0 / 6 shipped");
		expect(block("Resources").textContent).toContain("0 / 3 shipped");
		expect(block("Mining nodes").textContent).toContain("26 nodes");
	});

	it("offers a jump link to each block", async () => {
		seed(withData(() => {}));
		await mount();
		const links = [...container.querySelectorAll('nav[aria-label="Jump to"] a')].map((a) =>
			a.getAttribute("href")
		);

		expect(links).toEqual([
			"#minerals-minerals",
			"#minerals-geodes",
			"#minerals-ores",
			"#minerals-bars",
			"#minerals-resources",
			"#minerals-nodes",
		]);
		for (const href of links) expect(container.querySelector(href!)).not.toBeNull();
	});

	it("shows the found count on the pill and found and donated in the subline", async () => {
		seed(
			withData((data) => {
				data.minerals["80"] = { found: true, donated: true };
				data.minerals["82"] = { found: true, donated: false };
			})
		);
		await mount();

		const selected = container.querySelector('[role="tab"][aria-selected="true"]');
		expect(selected?.textContent).toBe("Minerals2 / 53");
		expect(text()).toContain("2 of 53 found · 1 donated");
	});

	it("saves a mineral status like the artifacts and shows the toast for two fields", async () => {
		seed(withData(() => {}));
		await mount();

		await click(statusRadio(block("Minerals"), "Quartz", "donated"));

		expect(saved("minerals", "80")).toEqual({ found: true, donated: true });
		expect(document.body.textContent).toContain(
			"Quartz set to Donated. It was also marked Found."
		);
		await click(toastButton("Undo"));
		expect(saved("minerals", "80")).toBeUndefined();
	});

	it("shows the geodes of a mineral by exact name", async () => {
		seed(withData(() => {}));
		await mount();
		const chips = (name: string) =>
			[...cardOf(block("Minerals"), name).querySelectorAll("li")].map((li) => li.textContent);

		expect(chips("Frozen Tear")).toEqual(["Frozen Geode", "Omni Geode"]);
		expect(chips("Earth Crystal")).toEqual(["Geode", "Omni Geode"]);
	});

	it("filters minerals by donation in the flyout", async () => {
		seed(
			withData((data) => {
				data.minerals["80"] = { found: true, donated: true };
			})
		);
		await mount();
		await openFilters(block("Minerals"));

		await click(flyoutRadio("Donated"));

		expect(cardsIn(block("Minerals"))).toBe(1);
		expect(flyout()!.textContent).toContain("Show 1 minerals");
	});

	it("ships an ore with a count of one, then steps the count up and down", async () => {
		seed(withData(() => {}));
		await mount();
		const ores = block("Ores");

		await click(shippedSwitch(ores, "Copper Ore"));
		expect(saved("shipped", "378")).toEqual({ shipped: true, count: 1 });

		await click(ores.querySelector('button[aria-label="Raise Copper Ore shipped count"]'));
		await click(ores.querySelector('button[aria-label="Raise Copper Ore shipped count"]'));
		expect(saved("shipped", "378")).toEqual({ shipped: true, count: 3 });

		await click(ores.querySelector('button[aria-label="Lower Copper Ore shipped count"]'));
		expect(saved("shipped", "378")).toEqual({ shipped: true, count: 2 });
		expect(ores.textContent).toContain("1 / 5 shipped");
	});

	it("has no lower button at one, so the count never goes below one", async () => {
		seed(
			withData((data) => {
				data.shipped["378"] = { shipped: true, count: 1 };
			})
		);
		await mount();

		expect(
			block("Ores").querySelector('button[aria-label="Lower Copper Ore shipped count"]')
		).toBeNull();
	});

	it("deletes the count when switched off and Undo brings the real count back", async () => {
		seed(
			withData((data) => {
				data.shipped["378"] = { shipped: true, count: 120 };
			})
		);
		await mount();

		await click(shippedSwitch(block("Ores"), "Copper Ore"));

		expect(saved("shipped", "378")).toBeUndefined();
		expect(document.body.textContent).toContain("Copper Ore marked not shipped");
		await click(toastButton("Undo"));
		expect(saved("shipped", "378")).toEqual({ shipped: true, count: 120 });
	});

	it("does not show a toast when an item is shipped", async () => {
		seed(withData(() => {}));
		await mount();

		await click(shippedSwitch(block("Ores"), "Copper Ore"));

		expect(document.body.textContent).not.toContain("marked not shipped");
	});

	it("shows the first smelt recipe on a bar and all of them in its dialog", async () => {
		seed(withData(() => {}));
		await mount();

		expect(cardOf(block("Bars"), "Copper Bar").textContent).toContain(
			"5× Copper Ore + 1× Coal · 30 min"
		);
		await click(
			block("Bars").querySelector('button[aria-label="Refined Quartz, show details"]')
		);
		const dialog = dialogWith("Smelt recipe");

		expect(dialog.textContent).toContain("1× Quartz + 1× Coal · 90 min");
		expect(dialog.textContent).toContain("1× Fire Quartz + 1× Coal · 90 min · makes 3");
	});

	it("filters ores by shipped state in their flyout", async () => {
		seed(
			withData((data) => {
				data.shipped["378"] = { shipped: true, count: 4 };
			})
		);
		await mount();
		await openFilters(block("Ores"));

		await click(flyoutRadio("Not shipped"));

		expect(cardsIn(block("Ores"))).toBe(4);
	});

	it("searches the geodes and the nodes with a search box only", async () => {
		seed(withData(() => {}));
		await mount();

		expect(
			[...block("Geodes").querySelectorAll("button")].some((b) =>
				b.textContent?.startsWith("Filters")
			)
		).toBe(false);
		await type(searchIn(block("Geodes")), "omni");
		expect(cardsIn(block("Geodes"))).toBe(1);
		await type(searchIn(block("Mining nodes")), "node");
		expect(cardsIn(block("Mining nodes"))).toBe(24);
	});

	it("says a geode opens for random items, and shows its count and contents otherwise", async () => {
		seed(withData(() => {}));
		await mount();
		const geodes = block("Geodes");

		expect(cardOf(geodes, "Geode").textContent).toContain("16 possible contents");
		expect(cardOf(geodes, "Omni Geode").textContent).toContain("No sell price");
		expect(cardOf(geodes, "Mystery Box").textContent).toContain("Opens for random items");

		await click(geodes.querySelector('button[aria-label="Mystery Box, show details"]'));
		const dialog = dialogWith("Possible contents");
		expect(dialog.textContent).toContain("Possible contents (63)");
		expect(dialog.textContent).toContain("0.2%");
	});

	it("shows the experience, drops and locations of a node", async () => {
		seed(withData(() => {}));
		await mount();
		const nodes = block("Mining nodes");

		expect(cardOf(nodes, "Mystic Stone").textContent).toContain("+150 XP");
		expect(cardOf(nodes, "Mystic Stone").textContent).toContain("Iridium Ore ×1-3");

		await click(nodes.querySelector('button[aria-label="Mystic Stone, show details"]'));
		const dialog = dialogWith("Mining XP");
		expect(dialog.textContent).toContain("Prismatic Shard");
		expect(dialog.textContent).toContain("25%");
		expect(dialog.textContent).toContain("Skull Cavern");
	});

	it("hides the Professions control when the playthrough has none of its professions", async () => {
		seed(withData(() => {}));
		await mount();

		expect(text()).not.toContain("Profession prices");
	});

	it("lists only the professions the playthrough has and adds the Gemologist price", async () => {
		seed(
			withData((data) => {
				data.professions = ["23"];
			})
		);
		await mount();

		expect(text()).toContain("Profession prices");
		expect(text()).toContain("Shows the Gemologist bonus");
		expect(text()).not.toContain("Blacksmith");
		expect(cardOf(block("Minerals"), "Quartz").textContent).not.toContain("32g");

		await click(
			container.querySelector('[role="switch"][aria-labelledby="profession-prices-label"]')
		);

		expect(cardOf(block("Minerals"), "Quartz").textContent).toContain("Gemologist");
		expect(cardOf(block("Minerals"), "Quartz").textContent).toContain("32g");
	});

	it("adds the Blacksmith price to bars only", async () => {
		seed(
			withData((data) => {
				data.professions = ["20"];
			})
		);
		await mount();
		await click(
			container.querySelector('[role="switch"][aria-labelledby="profession-prices-label"]')
		);

		expect(cardOf(block("Bars"), "Copper Bar").textContent).toContain("Blacksmith");
		expect(cardOf(block("Bars"), "Copper Bar").textContent).toContain("90g");
		expect(cardOf(block("Ores"), "Copper Ore").textContent).not.toContain("Blacksmith");
	});

	it("remembers a block search while the app stays open", async () => {
		seed(withData(() => {}));
		await mount();
		await type(searchIn(block("Mining nodes")), "mystic");
		act(() => root.unmount());
		root = createRoot(container);
		await mount();

		expect(cardsIn(block("Mining nodes"))).toBe(1);
	});
});
