import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act } from "react";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import type { AppData } from "@/types/app";
import { PlaythroughProvider } from "@/lib/contexts/PlaythroughContext";
import { UIProvider } from "@/lib/contexts/UIContext";
import { forgetMemoryState } from "@/lib/hooks/useMemoryState";
import { STORAGE_KEY } from "@/service/storage";
import { CalendarPage } from "@/comps/calendar/CalendarPage";
import { ToastProvider } from "@/comps/ui/Toast";
import { emptyPlaythrough } from "../storage/fixtures";

const navigation = vi.hoisted(() => ({ search: "", replace: vi.fn() }));

vi.mock("next/navigation", () => ({
	useRouter: () => ({ replace: navigation.replace }),
	usePathname: () => "/calendar",
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
						<CalendarPage />
					</PlaythroughProvider>
				</ToastProvider>
			</UIProvider>
		);
	});
};

const text = () => container.textContent ?? "";
const click = async (element: Element | null | undefined) => {
	expect(element).toBeTruthy();
	await act(async () => {
		element!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
	});
};
const cell = (label: string) =>
	container.querySelector(`[aria-label^="${label}"]`) as HTMLElement | null;
const radio = (label: string) =>
	[...container.querySelectorAll('input[type="radio"]')].find((input) =>
		input.closest("label")?.textContent?.trim().startsWith(label)
	) as HTMLInputElement;
const layer = (label: string) =>
	[...container.querySelectorAll("fieldset button")].find(
		(b) => b.textContent === label
	) as HTMLElement;
const panel = () =>
	container.querySelector(
		'[role="region"][aria-label^="Spring "], [role="region"][aria-label^="Summer "], [role="region"][aria-label^="Fall "], [role="region"][aria-label^="Winter "]'
	) as HTMLElement | null;
const section = (title: string) =>
	[...container.querySelectorAll('[role="region"]')].find(
		(el) => el.querySelector("h2")?.textContent === title
	) as HTMLElement;

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
	document.body.querySelectorAll("dialog").forEach((d) => d.remove());
});

const onSpring13 = (d: AppData["playthroughs"][number]["data"]) => {
	d.character.currentDate = { ...d.character.currentDate, season: "spring", day: 13, year: 2 };
};

describe("Calendar with no playthrough", () => {
	it("opens on Spring with the weekdays, 28 days and no today", async () => {
		await mount();

		expect(text()).toContain("Birthdays, festivals, and seasonal events");
		expect(text()).not.toContain("Year");
		expect(radio("Spring").checked).toBe(true);
		for (const weekday of ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"])
			expect(text()).toContain(weekday);
		expect(
			container.querySelectorAll('[aria-label^="Spring "][aria-label*=", "]')
		).toHaveLength(28);
		expect(container.textContent).not.toContain("Now");
		expect(text()).toContain("Select a day with events to see what happens.");
	});

	it("shows a birthday, a festival and the Bookseller on the days they fall on", async () => {
		await mount();

		expect(cell("Spring 14,")!.textContent).toContain("Haley");
		expect(cell("Spring 13,")!.textContent).toContain("Egg Festival");
		expect(cell("Spring 16,")!.textContent).toContain("Desert Festival 2/3");
		expect(cell("Spring 11,")!.textContent).toContain("Bookseller");
	});

	it("leaves a day with no events inactive", async () => {
		await mount();

		expect(cell("Spring 1,")!.tagName).toBe("DIV");
		expect(cell("Spring 14,")!.tagName).toBe("BUTTON");
	});
});

describe("Calendar with a playthrough", () => {
	it("opens on the current season, says Now, marks today and shows the date in the header", async () => {
		seed(
			withData(
				(d) =>
					(d.character.currentDate = {
						...d.character.currentDate,
						season: "fall",
						day: 20,
						year: 3,
					})
			)
		);
		await mount();

		expect(radio("Fall").checked).toBe(true);
		expect(container.textContent).toContain("Fall · Now");
		expect(text()).toContain("Fall 20, Year 3");
		expect(cell("Fall 20,")!.getAttribute("aria-label")).toContain("Today");
	});

	it("marks today only while the current season is shown", async () => {
		seed(withData(onSpring13));
		await mount();

		expect(cell("Spring 13,")!.getAttribute("aria-label")).toContain("Today");
		await click(radio("Summer"));
		expect(container.querySelector('[aria-label*="Today"]')).toBeNull();
		await click(radio("Spring"));
		expect(cell("Spring 13,")!.getAttribute("aria-label")).toContain("Today");
	});

	it("opens today in the panel when it has events", async () => {
		seed(withData(onSpring13));
		await mount();

		expect(panel()!.textContent).toContain("Spring 13");
		expect(panel()!.textContent).toContain("Today");
		expect(panel()!.textContent).toContain("Egg Festival");
	});
});

describe("Calendar day panel", () => {
	it("opens a day with a birthday, with gift ideas and a link to the villager", async () => {
		await mount();

		await click(cell("Spring 14,"));

		expect(panel()!.textContent).toContain("Spring 14");
		expect(panel()!.textContent).toContain("Haley's Birthday");
		expect(panel()!.textContent).toContain("Gift ideas from their preferences");
		expect(panel()!.textContent).toContain("Loved");
		expect(panel()!.querySelector('a[href="/villagers"]')!.textContent).toBe("Open Haley");
		expect(panel()!.textContent).toContain("No festival on this day.");
		expect(panel()!.textContent).toContain("Not a possible Bookseller day.");
		expect(panel()!.textContent).toContain("He may visit on Spring 11, 12, 21, 22, 25.");
	});

	it("says Tomorrow for the day after today", async () => {
		seed(withData(onSpring13));
		await mount();

		await click(cell("Spring 14,"));

		expect(panel()!.textContent).toContain("Tomorrow");
	});

	it("shows a festival with its day of several", async () => {
		await mount();

		await click(cell("Spring 16,"));

		expect(panel()!.textContent).toContain("Desert Festival");
		expect(panel()!.textContent).toContain("Day 2 of 3");
	});

	it("shows a Bookseller day", async () => {
		await mount();

		await click(cell("Spring 11,"));

		expect(panel()!.textContent).toContain("Possible visit day");
	});

	it("steps to the previous and next day with events", async () => {
		await mount();
		await click(cell("Spring 14,"));
		const buttons = [...panel()!.querySelectorAll("button")];

		expect(buttons.map((b) => b.getAttribute("aria-label"))).toEqual([
			"Previous day with events, Spring 13",
			"Next day with events, Spring 15",
		]);
		await click(buttons[1]);
		expect(panel()!.textContent).toContain("Spring 15");
		await click(panel()!.querySelector('[aria-label^="Previous day with events"]'));
		expect(panel()!.textContent).toContain("Spring 14");
	});
});

describe("Calendar pictures", () => {
	const src = (element: Element | null | undefined) =>
		[...(element?.querySelectorAll("img") ?? [])].map((img) => img.getAttribute("src"));

	it("puts the game picture of each layer on its Show chip", async () => {
		await mount();

		expect(src(layer("Birthdays"))).toEqual(["/images/cooking/Pink Cake.png"]);
		expect(src(layer("Festivals"))).toEqual([
			"/images/seasons/calendar-icons/Festival Flag.gif",
		]);
		expect(src(layer("Bookseller"))).toEqual(["/images/seasons/calendar-icons/Bookseller.png"]);
	});

	it("shows a portrait for a birthday, the festival icon and the Bookseller in the cells and the list", async () => {
		await mount();

		expect(src(cell("Spring 14,")).every((path) => path!.includes("/images/villagers/"))).toBe(
			true
		);
		expect(src(cell("Spring 16,"))).toContain(
			"/images/seasons/calendar-icons/Special Event.png"
		);
		expect(src(cell("Spring 11,"))).toContain("/images/seasons/calendar-icons/Bookseller.png");
		expect(src(section("This season")).length).toBe(
			section("This season").querySelectorAll("li").length
		);
	});

	it("takes a layer's pictures out with the layer", async () => {
		await mount();

		await click(layer("Bookseller"));

		expect(src(cell("Spring 11,") ?? undefined)).not.toContain(
			"/images/seasons/calendar-icons/Bookseller.png"
		);
	});
});

describe("Calendar seasons and layers", () => {
	it("moves to another season and clears the open day", async () => {
		await mount();
		await click(cell("Spring 14,"));

		await click(radio("Fall"));

		expect(container.querySelectorAll('[aria-label^="Fall "][aria-label*=", "]')).toHaveLength(
			28
		);
		expect(text()).toContain("Select a day with events to see what happens.");
		expect(cell("Fall 16,")!.textContent).toContain("Stardew Valley Fair");
	});

	it("hides a layer from the grid, the panel steps and the season list", async () => {
		await mount();

		await click(layer("Bookseller"));

		expect(layer("Bookseller").getAttribute("aria-pressed")).toBe("false");
		expect(cell("Spring 21,")!.tagName).toBe("DIV");
		expect(cell("Spring 11,")!.textContent).not.toContain("Bookseller");
		expect(section("This season").textContent).not.toContain("Bookseller may visit");
		await click(layer("Bookseller"));
		expect(cell("Spring 21,")!.tagName).toBe("BUTTON");
	});

	it("lists the events of the season in date order", async () => {
		await mount();
		const list = section("This season");

		expect(list.textContent).toContain("Haley's Birthday");
		expect(list.textContent).toContain("Egg Festival");
		expect(list.textContent).toContain("Desert Festival");
		expect(list.textContent).toContain("Flower Dance");
		expect(list.textContent).toContain("Spring 14");
		expect(list.textContent).toContain("events");
	});
});

describe("In season", () => {
	it("lists the crops, forageables and fish of the season with counts", async () => {
		await mount();
		const inSeason = section("In season: Spring");

		expect(inSeason.textContent).toContain("From the game data");
		expect(inSeason.textContent).toContain("Crops18");
		expect(inSeason.textContent).toContain("Forageables30");
		expect(inSeason.textContent).toContain("Fish53");
		expect(inSeason.textContent).toContain("Parsnip");
		expect(inSeason.textContent).toContain("+9 more");
		expect(inSeason.textContent).toContain(
			"Quests and Help Wanted boards are not in the game data"
		);
	});

	it("shows the rest on request", async () => {
		await mount();
		const inSeason = section("In season: Spring");

		await click(
			[...inSeason.querySelectorAll("button")].find((b) => b.textContent === "+9 more")
		);

		expect(inSeason.textContent).toContain("Show fewer");
		expect(inSeason.querySelectorAll("ul")[0].querySelectorAll("li")).toHaveLength(19);
		expect(inSeason.querySelectorAll("ul")[1].querySelectorAll("li")).toHaveLength(10);
	});

	it("follows the season", async () => {
		await mount();

		await click(radio("Winter"));

		expect(section("In season: Winter").textContent).toContain("Crops4");
	});
});

describe("Calendar is read only", () => {
	it("has no switch or field", async () => {
		await mount();

		expect(
			container.querySelector('[role="switch"], input[type="text"], textarea, select')
		).toBeNull();
		expect(text()).toContain("The calendar is read only because it is derived from game data.");
	});
});
