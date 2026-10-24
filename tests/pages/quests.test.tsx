import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act } from "react";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import type { AppData } from "@/types/app";
import { PlaythroughProvider } from "@/lib/contexts/PlaythroughContext";
import { UIProvider } from "@/lib/contexts/UIContext";
import { forgetMemoryState } from "@/lib/hooks/useMemoryState";
import { STORAGE_KEY } from "@/service/storage";
import { QuestsPage } from "@/comps/quests/QuestsPage";
import { ToastProvider } from "@/comps/ui/Toast";
import { emptyPlaythrough } from "../storage/fixtures";

const navigation = vi.hoisted(() => ({ search: "", replace: vi.fn() }));

vi.mock("next/navigation", () => ({
	useRouter: () => ({ replace: navigation.replace }),
	usePathname: () => "/quests",
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
						<QuestsPage />
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
const data = () => stored().playthroughs[0].data;
const section = (title: string) =>
	[...container.querySelectorAll('[role="region"]')].find(
		(el) => el.querySelector("h2")?.textContent === title
	) as HTMLElement;
const control = (label: string) =>
	container.querySelector(`[aria-label="${label}"]`) as HTMLInputElement | null;
const titles = (sectionTitle: string) =>
	[...section(sectionTitle).querySelectorAll("span.font-semibold")].map((el) => el.textContent!);
const tabButton = (label: string) =>
	[...container.querySelectorAll('[role="tab"]')].find((tab) =>
		tab.textContent?.startsWith(label)
	)!;

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
	document.body.querySelectorAll("dialog").forEach((dialog) => dialog.remove());
});

describe("Quests page", () => {
	it("shows seven tiles and the tab counts for a played save", async () => {
		seed(
			withData((d) => {
				d.questsCompleted = { "9": true, "132-animals": true };
				d.specialOrdersCompleted = { Robin: true, QiChallenge: true };
				d.secretNotes = { "1": true };
				d.journalScraps = { "1001": true, "1002": true };
				d.lostBooksFound = 15;
				d.helpWantedCompleted = 41;
			})
		);
		await mount();

		for (const expected of [
			"Mainquests2/58",
			"Specialorders1/18",
			"HelpWanted41",
			"Secretnotes1/27",
			"Journalscraps2/11",
			"Lostbooks15/21",
		]) {
			expect(compact()).toContain(expected);
		}
		expect(tabButton("Quests").textContent).toContain("2 / 58");
		expect(tabButton("Secret notes").textContent).toContain("3 / 38");
		expect(tabButton("Lost books").textContent).toContain("15 / 21");
	});

	it("lists 58 quests, 18 town orders and 10 Qi orders on the first tab", async () => {
		seed(withData(() => {}));
		await mount();

		expect(titles("Main quests")).toHaveLength(58);
		expect(titles("Special orders (Town)")).toHaveLength(18);
		expect(titles("Qi's special orders")).toHaveLength(10);
		expect(section("Main quests").textContent).toContain("0 / 58 complete");
	});

	it("shows what a quest asks, who gives it and its reward, with a state in words", async () => {
		seed(withData(() => {}));
		await mount();
		const card = section("Main quests").querySelector("div.flex.flex-col.gap-2") as HTMLElement;

		expect(card.textContent).toContain("Introductions");
		expect(card.textContent).toContain("Greet 28 people");
		expect(card.textContent).toContain("Given by: Introductory quest");
		expect(card.textContent).toContain("Reward: 100 Friendship points with every known NPC");
		expect(card.textContent).toContain("Incomplete");
	});

	it("completes a quest with its switch and writes it under its id", async () => {
		seed(withData(() => {}));
		await mount();

		await click(control("Introductions completed"));

		expect(data().questsCompleted).toEqual({ "9": true });
		expect(section("Main quests").textContent).toContain("1 / 58 complete");
		expect(section("Main quests").textContent).toContain("Completed");
		await click(control("Introductions completed"));
		expect(data().questsCompleted).toEqual({ "9": false });
	});

	it("keeps the two quests with the id 132 apart", async () => {
		seed(withData(() => {}));
		await mount();

		await click(control("Getting Started (Animals) completed"));

		expect(data().questsCompleted).toEqual({ "132-animals": true });
		expect(control("Getting Started completed")!.getAttribute("aria-checked")).toBe("false");
		await click(control("Getting Started completed"));
		expect(data().questsCompleted).toEqual({ "132-animals": true, "132": true });
	});

	it("shows the quests of a save that holds only the plain id as the first one", async () => {
		seed(withData((d) => (d.questsCompleted = { "132": true })));
		await mount();

		expect(control("Getting Started completed")!.getAttribute("aria-checked")).toBe("true");
		expect(control("Getting Started (Animals) completed")!.getAttribute("aria-checked")).toBe(
			"false"
		);
	});

	it("completes a town order and a Qi order and counts them in their own badges", async () => {
		seed(withData(() => {}));
		await mount();

		await click(control("Robin's Project complete"));
		expect(data().specialOrdersCompleted).toEqual({ Robin: true });
		expect(section("Special orders (Town)").textContent).toContain("1 / 18 complete");
		expect(section("Special orders (Town)").textContent).toContain("Requester: Robin · 7 days");
		const qi = section("Qi's special orders").querySelector('[role="switch"]')!;
		await click(qi);
		expect(section("Qi's special orders").textContent).toContain("1 / 10 complete");
		expect(compact()).toContain("Specialorders1/18");
		expect(compact()).toContain("Qiorders1/10");
	});

	it("types the Help Wanted count", async () => {
		seed(withData(() => {}));
		await mount();

		await type(control("Help Wanted quests completed"), "41");

		expect(data().helpWantedCompleted).toBe(41);
		expect(compact()).toContain("HelpWanted41");
	});

	it("searches the main quests by name or by what they ask and shows the empty state", async () => {
		seed(withData(() => {}));
		await mount();
		const search = control("Search main quests")!;

		await type(search, "greet 28");
		expect(titles("Main quests")).toEqual(["Introductions"]);
		expect(section("Main quests").textContent).toContain("Showing 1 of 58");
		await type(search, "zzzzzz");
		expect(section("Main quests").textContent).toContain("No matches.");
		await click(
			[...section("Main quests").querySelectorAll("button")].find(
				(b) => b.textContent === "Clear search"
			)
		);
		expect(titles("Main quests")).toHaveLength(58);
	});

	it("searches town orders on their own", async () => {
		seed(withData(() => {}));
		await mount();

		await type(control("Search town orders"), "robin");

		expect(titles("Special orders (Town)").length).toBeGreaterThan(0);
		expect(titles("Special orders (Town)").length).toBeLessThan(18);
		expect(titles("Main quests")).toHaveLength(58);
	});
});

describe("Secret notes tab", () => {
	beforeEach(() => {
		navigation.search = "tab=secret-notes";
	});

	it("lists 27 notes and 11 scraps in two sections", async () => {
		seed(withData(() => {}));
		await mount();

		expect(titles("Secret notes")).toHaveLength(27);
		expect(titles("Journal scraps")).toHaveLength(11);
		expect(section("Secret notes").textContent).toContain("0 / 27 found");
		expect(section("Journal scraps").textContent).toContain(
			"Saved separately from secret notes."
		);
	});

	it("saves a note and a scrap in their own maps", async () => {
		seed(withData(() => {}));
		await mount();

		await click(control("Secret Note #1 found"));
		await click(control("Journal Scrap #1 found"));

		expect(data().secretNotes).toEqual({ "1": true });
		expect(data().journalScraps).toEqual({ "1001": true });
		expect(section("Secret notes").textContent).toContain("1 / 27 found");
		expect(section("Journal scraps").textContent).toContain("1 / 11 found");
		expect(tabButton("Secret notes").textContent).toContain("2 / 38");
	});

	it("shows the state in words and the description", async () => {
		seed(withData((d) => (d.secretNotes = { "1": true })));
		await mount();
		const first = section("Secret notes").querySelector(
			"div.flex.flex-col.gap-2"
		) as HTMLElement;

		expect(first.textContent).toContain("Found");
		expect(first.textContent).toContain("Abigail's Diary");
		expect(section("Secret notes").textContent).toContain("Not found");
	});

	it("searches notes by their text", async () => {
		seed(withData(() => {}));
		await mount();

		await type(control("Search secret notes"), "abigail");

		expect(titles("Secret notes")).toContain("Secret Note #1");
		expect(titles("Secret notes").length).toBeLessThan(27);
	});
});

describe("Lost books tab", () => {
	beforeEach(() => {
		navigation.search = "tab=lost-books";
	});

	it("lists 21 books with the badge from the saved count", async () => {
		seed(withData((d) => (d.lostBooksFound = 15)));
		await mount();

		expect(titles("Lost books")).toHaveLength(21);
		expect(section("Lost books").textContent).toContain("15 / 21 found");
		expect(titles("Lost books")[0]).toBe("Tips on Farming");
	});

	it("ticking a book names one of the counted books and keeps the count", async () => {
		seed(withData((d) => (d.lostBooksFound = 15)));
		await mount();

		await click(control("Tips on Farming found"));
		expect(data().lostBooksFound).toBe(15);
		expect(data().lostBooks).toEqual({ "1": true });
		expect(section("Lost books").textContent).toContain("15 / 21 found");
		await click(control("Tips on Farming found"));
		expect(data().lostBooksFound).toBe(15);
	});

	it("raises the count when a book is ticked that no count covers", async () => {
		seed(withData(() => {}));
		await mount();

		await click(control("Tips on Farming found"));
		expect(data().lostBooksFound).toBe(1);
		await click(control("Tips on Farming found"));
		expect(data().lostBooksFound).toBe(0);
	});

	it("steps and types the count alone without touching the ticked books", async () => {
		seed(withData((d) => (d.lostBooksFound = 15)));
		await mount();

		await click(control("Raise books found"));
		expect(data().lostBooksFound).toBe(16);
		expect(data().lostBooks).toEqual({});
		await type(control("Books found"), "40");
		expect(data().lostBooksFound).toBe(21);
		expect(control("Raise books found")!.hasAttribute("disabled")).toBe(true);
	});

	it("searches the books by their text", async () => {
		seed(withData(() => {}));
		await mount();

		await type(control("Search lost books"), "farming");

		expect(titles("Lost books")).toContain("Tips on Farming");
		expect(titles("Lost books").length).toBeLessThan(21);
	});
});

describe("Tabs", () => {
	it("opens the tab named in the address and moves to another", async () => {
		navigation.search = "tab=lost-books";
		seed(withData(() => {}));
		await mount();

		expect(tabButton("Lost books").getAttribute("aria-selected")).toBe("true");
		await click(tabButton("Quests"));
		expect(navigation.replace).toHaveBeenCalledWith("/quests?tab=quests", { scroll: false });
	});

	it("falls back to the first tab for an unknown name", async () => {
		navigation.search = "tab=nothing";
		seed(withData(() => {}));
		await mount();

		expect(tabButton("Quests").getAttribute("aria-selected")).toBe("true");
	});

	it("closes a section from its heading", async () => {
		seed(withData(() => {}));
		await mount();
		const heading = section("Main quests").querySelector("h2 button") as HTMLElement;

		await click(heading);
		expect(heading.getAttribute("aria-expanded")).toBe("false");
	});
});
