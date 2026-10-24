import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act } from "react";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import type { AppData } from "@/types/app";
import { PlaythroughProvider } from "@/lib/contexts/PlaythroughContext";
import { UIProvider } from "@/lib/contexts/UIContext";
import { forgetMemoryState } from "@/lib/hooks/useMemoryState";
import { STORAGE_KEY } from "@/service/storage";
import { ToastProvider } from "@/comps/ui/Toast";
import { VillagersPage } from "@/comps/villagers/VillagersPage";
import { emptyPlaythrough } from "../storage/fixtures";

vi.mock("next/navigation", () => ({
	useRouter: () => ({ replace: vi.fn() }),
	usePathname: () => "/villagers",
	useSearchParams: () => new URLSearchParams(""),
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
						<VillagersPage />
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
const choose = async (select: HTMLSelectElement | null | undefined, value: string) => {
	expect(select).toBeTruthy();
	await act(async () => {
		select!.value = value;
		select!.dispatchEvent(new Event("change", { bubbles: true }));
	});
};
const section = (title: string) =>
	[...container.querySelectorAll('[role="region"]')].find(
		(el) => el.querySelector("h2")?.textContent === title
	) as HTMLElement;
const control = (label: string) =>
	document.body.querySelector(`[aria-label="${label}"]`) as HTMLElement | null;
const cardNames = () =>
	[...section("Villagers").querySelectorAll("span.font-semibold")].map((el) => el.textContent!);
const cardOf = (name: string) =>
	[...section("Villagers").querySelectorAll("span.font-semibold")]
		.find((el) => el.textContent === name)!
		.closest("div.flex.flex-col.gap-3") as HTMLElement;
const toastUndo = () =>
	[...document.body.querySelectorAll("button")].find((b) => b.textContent === "Undo");
const flyout = () =>
	[...document.body.querySelectorAll("dialog")].find((el) =>
		el.textContent?.includes("Changes apply as you go")
	);
const flyoutRadio = (label: string) =>
	[...flyout()!.querySelectorAll('input[type="radio"]')].find(
		(input) => input.closest("label")?.textContent?.trim() === label
	);
const openFilters = () =>
	click(
		[...section("Villagers").querySelectorAll("button")].find((b) =>
			b.textContent?.startsWith("Filters")
		)
	);
const villagerDialog = () => document.body.querySelector("dialog[open]") as HTMLElement | null;
const openDetails = (name: string) => click(control(`Open details for ${name}`));
const progress = (hearts: number, extra: object = {}) => ({
	hearts,
	heartPoints: hearts * 250,
	eventsSeen: [],
	status: "",
	...extra,
});

beforeEach(() => {
	forgetMemoryState();
	localStorage.clear();
	container = document.createElement("div");
	document.body.appendChild(container);
	root = createRoot(container);
});

afterEach(() => {
	act(() => root.unmount());
	container.remove();
	document.body.querySelectorAll("dialog").forEach((dialog) => dialog.remove());
});

describe("Villagers page tiles", () => {
	it("reads every villager for the six tiles", async () => {
		seed(
			withData((d) => {
				d.character.spouse = "Leah";
				d.villagers = {
					Pierre: progress(10, { eventsSeen: ["1"] }),
					Shane: progress(8),
					Abigail: progress(5),
					Leah: progress(14),
				};
			})
		);
		await mount();

		for (const expected of [
			"Totalvillagers34",
			"Maxhearts3/34",
			"10+hearts2",
			"5+hearts4",
			"SpouseLeah",
		]) {
			expect(compact()).toContain(expected);
		}
		expect(compact()).toContain("/121");
	});

	it("says None when there is no spouse", async () => {
		seed(withData(() => {}));
		await mount();

		expect(compact()).toContain("SpouseNone");
	});
});

describe("Villagers list and filters", () => {
	it("lists 34 villagers in name order with the badge and the showing line", async () => {
		seed(withData((d) => (d.villagers = { Shane: progress(8) })));
		await mount();
		const names = cardNames();

		expect(names).toHaveLength(34);
		expect(names).toEqual([...names].sort());
		expect(section("Villagers").textContent).toContain("1 / 34 max hearts");
		expect(section("Villagers").textContent).toContain(
			"Showing 34 of 34 villagers · 1 / 34 at max hearts"
		);
	});

	it("searches by name and shows the empty state", async () => {
		seed(withData(() => {}));
		await mount();
		const search = section("Villagers").querySelector(
			'input[type="search"]'
		) as HTMLInputElement;

		await type(search, "shan");
		expect(cardNames()).toEqual(["Shane"]);
		await type(search, "zzz");
		expect(text()).toContain("No villagers match your filters.");
		await click(
			[...section("Villagers").querySelectorAll("button")].find(
				(b) => b.textContent === "Clear filters"
			)
		);
		expect(cardNames()).toHaveLength(34);
	});

	it("filters by birthday season and by marriage candidates in the flyout", async () => {
		seed(withData(() => {}));
		await mount();

		await openFilters();
		await click(flyoutRadio("Spring"));
		expect(cardNames()).toHaveLength(8);
		await click(flyoutRadio("All"));
		await click(flyoutRadio("Marriageable"));
		expect(cardNames()).toHaveLength(13);
		await click(flyoutRadio("Not marriageable"));
		expect(cardNames()).toHaveLength(21);
	});

	it("marks a villager at max hearts", async () => {
		seed(withData((d) => (d.villagers = { Shane: progress(8) })));
		await mount();

		expect(cardOf("Shane").textContent).toContain("Max hearts");
		expect(cardOf("Shane").className).toContain("border-kept");
		expect(cardOf("Abigail").className).not.toContain("border-kept");
	});
});

describe("Villager hearts", () => {
	it("moves the hearts and the points together and says so with Undo", async () => {
		seed(withData((d) => (d.villagers = { Shane: progress(7, { heartPoints: 1870 }) })));
		await mount();

		await click(control("Lower Shane hearts"));

		expect(data().villagers.Shane).toMatchObject({ hearts: 6, heartPoints: 1500 });
		expect(document.body.textContent).toContain(
			"Shane set to 6 hearts. Friendship points set to 1,500."
		);
		await click(toastUndo());
		expect(data().villagers.Shane).toMatchObject({ hearts: 7, heartPoints: 1870 });
	});

	it("shows hearts, points and the points to the next heart", async () => {
		seed(withData((d) => (d.villagers = { Shane: progress(7, { heartPoints: 1870 }) })));
		await mount();
		const card = cardOf("Shane").textContent!;

		expect(card).toContain("7 / 8 hearts");
		expect(card).toContain("1,870 / 2,000 pts");
		expect(card).toContain("130 pts to next heart");
	});

	it("does not raise past the cap", async () => {
		seed(withData((d) => (d.villagers = { Shane: progress(8) })));
		await mount();

		expect(control("Raise Shane hearts")).toBeNull();
	});

	it("creates a record for a villager with none", async () => {
		seed(withData(() => {}));
		await mount();

		await click(control("Raise Pierre hearts"));

		expect(data().villagers.Pierre).toMatchObject({ hearts: 1, heartPoints: 250 });
	});
});

describe("Villager status", () => {
	it("sets dating, which raises the cap, and writes the game string", async () => {
		seed(withData(() => {}));
		await mount();

		await choose(control("Shane status") as HTMLSelectElement, "dating");

		expect(data().villagers.Shane.status).toBe("Dating");
		expect(cardOf("Shane").textContent).toContain("0 / 10 hearts");
		expect(document.body.textContent).toContain("Shane status set to Dating.");
	});

	it("lowers the hearts when dating ends, and Undo puts them back", async () => {
		seed(withData((d) => (d.villagers = { Shane: progress(10, { status: "Dating" }) })));
		await mount();

		await choose(control("Shane status") as HTMLSelectElement, "none");

		expect(data().villagers.Shane).toMatchObject({ hearts: 8, status: "Friendly" });
		expect(document.body.textContent).toContain("Hearts lowered to 8");
		await click(toastUndo());
		expect(data().villagers.Shane).toMatchObject({ hearts: 10, status: "Dating" });
	});

	it("offers Roommate to Krobus only, and Dating to the other candidates", async () => {
		seed(withData(() => {}));
		await mount();
		const options = (name: string) =>
			[...(control(`${name} status`) as HTMLSelectElement).options].map((o) => o.textContent);

		expect(options("Krobus")).toEqual(["None", "Roommate"]);
		expect(options("Shane")).toEqual(["None", "Dating"]);
		expect(control("Pierre status")).toBeNull();
		expect(cardOf("Pierre").textContent).toContain("Friend");
	});

	it("shows the spouse as married and read only, with a link to the Character tab", async () => {
		seed(withData((d) => (d.character.spouse = "Abigail")));
		await mount();
		const card = cardOf("Abigail");

		expect(control("Abigail status")).toBeNull();
		expect(card.textContent).toContain("Married. Spouse is set in Farm, Character.");
		expect(card.querySelector('a[href="/farm?tab=character"]')).not.toBeNull();
		expect(card.textContent).toContain("0 / 14 hearts");
	});
});

describe("Villager window", () => {
	it("opens with the facts, the heart events and the gift preferences, and closes", async () => {
		seed(withData((d) => (d.villagers = { Shane: progress(5, { eventsSeen: ["611944"] }) })));
		await mount();

		await openDetails("Shane");
		const dialog = villagerDialog()!;

		expect(dialog.textContent).toContain("Shane");
		expect(dialog.textContent).toContain("JojaMart employee · Marnie's Ranch");
		expect(dialog.textContent).toContain("Spring 20");
		expect(dialog.textContent).toContain("Heart events");
		expect(dialog.textContent).toContain("Gift preferences");
		expect(dialog.textContent).toContain("Uni = universal for everyone");
		await click(dialog.querySelector('button[aria-label="Close"]'));
		expect(villagerDialog()).toBeNull();
	});

	it("marks an event seen and clears it", async () => {
		seed(withData(() => {}));
		await mount();
		await openDetails("Shane");
		const dialog = villagerDialog()!;
		const toggles = [...dialog.querySelectorAll('[role="switch"][aria-label^="Seen:"]')];

		expect(toggles.length).toBeGreaterThan(5);
		await click(toggles[0]);
		expect(data().villagers.Shane.eventsSeen).toHaveLength(1);
		expect(dialog.textContent).toContain("1 / ");
		await click(toggles[0]);
		expect(data().villagers.Shane.eventsSeen).toEqual([]);
	});

	it("shows an event with no id as derived from hearts and does not let it be changed", async () => {
		seed(withData((d) => (d.villagers = { Shane: progress(3) })));
		await mount();
		await openDetails("Shane");
		const dialog = villagerDialog()!;

		expect(dialog.textContent).toContain("Derived from hearts, not editable.");
		expect(dialog.textContent).toContain("Complete");
		expect(dialog.textContent).not.toContain("Not complete");
		await click(dialog.querySelector('button[aria-label="Lower Shane hearts"]'));
		expect(dialog.textContent).toContain("Not complete");
	});

	it("changes the hearts from inside the window", async () => {
		seed(withData(() => {}));
		await mount();
		await openDetails("Pierre");

		await click(villagerDialog()!.querySelector('button[aria-label="Raise Pierre hearts"]'));

		expect(data().villagers.Pierre.hearts).toBe(1);
	});

	it("groups the gifts and tags the universal ones", async () => {
		seed(withData(() => {}));
		await mount();
		await openDetails("Shane");
		const dialog = villagerDialog()!;

		for (const group of ["Loved", "Liked", "Neutral", "Disliked", "Hated"]) {
			expect(dialog.textContent).toContain(`${group} (`);
		}
		expect(dialog.textContent).toContain("Golden Pumpkin");
		expect(dialog.textContent).toContain("Uni");
	});

	it("tracks a loved gift, shows it as tracked, and stops tracking it", async () => {
		seed(withData(() => {}));
		await mount();
		await openDetails("Shane");
		const dialog = villagerDialog()!;

		await click(dialog.querySelector('button[aria-label="Track Pizza for Shane"]'));

		expect(data().trackedGifts).toEqual([
			{ itemName: "Pizza", villagerName: "Shane", given: false, preference: "loves" },
		]);
		const tracking = dialog.querySelector(
			'button[aria-label="Stop tracking Pizza for Shane"]'
		)!;
		expect(tracking.textContent).toBe("Tracking");
		expect(dialog.textContent).toContain("1 tracked");
		await click(tracking);
		expect(data().trackedGifts).toEqual([]);
	});

	it("has no Track button for neutral gifts or for a category", async () => {
		seed(withData(() => {}));
		await mount();
		await openDetails("Shane");
		const labels = [...villagerDialog()!.querySelectorAll('button[aria-label^="Track "]')].map(
			(b) => b.getAttribute("aria-label")!
		);

		expect(labels.length).toBeGreaterThan(3);
		expect(labels.some((label) => label.startsWith("Track All "))).toBe(false);
	});

	it("shows a given gift as given", async () => {
		seed(
			withData((d) => {
				d.trackedGifts = [
					{ itemName: "Pizza", villagerName: "Shane", given: true, preference: "loves" },
				];
			})
		);
		await mount();
		await openDetails("Shane");

		expect(villagerDialog()!.textContent).toContain("Given");
		expect(
			villagerDialog()!.querySelector('button[aria-label="Track Pizza for Shane"]')
		).toBeNull();
	});
});

describe("Birthdays", () => {
	it("lists the four seasons and highlights today", async () => {
		seed(
			withData(
				(d) =>
					(d.character.currentDate = {
						...d.character.currentDate,
						season: "spring",
						day: 20,
					})
			)
		);
		await mount();
		const birthdays = section("Birthdays");

		expect(birthdays.textContent).toContain("Plan ahead for gift giving");
		for (const season of ["Spring", "Summer", "Fall", "Winter"]) {
			expect(birthdays.querySelector(`section[aria-label="${season}"]`)).not.toBeNull();
		}
		expect(birthdays.querySelectorAll("li")).toHaveLength(34);
		const today = [...birthdays.querySelectorAll("li")].filter((li) =>
			li.textContent?.includes("Today")
		);
		expect(today).toHaveLength(1);
		expect(today[0].textContent).toContain("Shane");
		expect(birthdays.textContent).toContain("Today is Spring 20.");
	});
});

describe("Collapsing", () => {
	it("closes a section from its heading", async () => {
		seed(withData(() => {}));
		await mount();
		const heading = section("Birthdays").querySelector("h2 button") as HTMLElement;

		expect(heading.getAttribute("aria-expanded")).toBe("true");
		await click(heading);
		expect(heading.getAttribute("aria-expanded")).toBe("false");
	});
});
