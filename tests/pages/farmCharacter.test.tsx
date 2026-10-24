import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act } from "react";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import type { AppData } from "@/types/app";
import { PlaythroughProvider } from "@/lib/contexts/PlaythroughContext";
import { UIProvider } from "@/lib/contexts/UIContext";
import { forgetMemoryState } from "@/lib/hooks/useMemoryState";
import { STORAGE_KEY } from "@/service/storage";
import { FarmPage } from "@/comps/farm/FarmPage";
import { ToastProvider } from "@/comps/ui/Toast";
import { emptyPlaythrough } from "../storage/fixtures";

const navigation = vi.hoisted(() => ({ search: "", replace: vi.fn() }));

vi.mock("next/navigation", () => ({
	useRouter: () => ({ replace: navigation.replace }),
	usePathname: () => "/farm",
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
						<FarmPage />
					</PlaythroughProvider>
				</ToastProvider>
			</UIProvider>
		);
	});
};

const text = () => container.textContent ?? "";
const data = () => stored().playthroughs[0].data;
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
const control = (label: string) =>
	[...container.querySelectorAll("label")].find((l) => l.textContent === label)?.control as
		HTMLInputElement | HTMLSelectElement | null;
const byLabel = (label: string) =>
	container.querySelector(`[aria-label="${label}"]`) as
		HTMLInputElement | HTMLSelectElement | null;
const section = (title: string) =>
	[...container.querySelectorAll('[role="region"]')].find(
		(el) => el.querySelector("h2")?.textContent === title
	) as HTMLElement;
const buttonIn = (root: ParentNode, label: string) =>
	[...root.querySelectorAll("button")].find((b) => b.textContent?.trim() === label);
const toastUndo = () =>
	[...document.body.querySelectorAll("button")].find((b) => b.textContent === "Undo");
const dialogWith = (needle: string) =>
	[...document.body.querySelectorAll("dialog")].find((d) => d.textContent?.includes(needle))!;
const radioIn = (root: ParentNode, label: string) =>
	[...root.querySelectorAll('input[type="radio"]')].find(
		(input) => input.closest("label")?.textContent?.trim() === label
	) as HTMLInputElement;

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

describe("Farm page", () => {
	it("shows the empty card with no active playthrough", async () => {
		await mount();

		expect(text()).toContain("No active playthrough");
	});

	it("opens on Character, lists four tabs and writes the chosen tab into the address", async () => {
		seed(withData(() => {}));
		await mount();
		const tabs = [...container.querySelectorAll('[role="tab"]')];

		expect(tabs.map((tab) => tab.textContent)).toEqual([
			"Character",
			"Animals",
			"Buildings",
			"Ginger Island",
		]);
		expect(tabs.find((tab) => tab.getAttribute("aria-selected") === "true")?.textContent).toBe(
			"Character"
		);
		await click(tabs[1]);
		expect(navigation.replace).toHaveBeenCalledWith("/farm?tab=animals", { scroll: false });
	});

	it("points a tab that is not rebuilt to its old page", async () => {
		navigation.search = "tab=buildings";
		seed(withData(() => {}));
		await mount();

		expect(text()).toContain("This tab is not rebuilt yet");
		expect(container.querySelector('a[href="/farm/buildings"]')).not.toBeNull();
	});

	it("falls back to Character for an unknown tab", async () => {
		navigation.search = "tab=nothing";
		seed(withData(() => {}));
		await mount();

		expect(text()).toContain("Farmer profile");
	});
});

describe("Farm sections", () => {
	const body = (title: string) => section(title).querySelector("[id$='-body']") as HTMLElement;
	const toggle = (title: string) =>
		section(title).querySelector("h2 button") as HTMLButtonElement;

	it("opens every section and closes one from its heading, keeping its badge", async () => {
		seed(withData(() => {}));
		await mount();
		const titles = [
			"Farmer profile",
			"Money and stats",
			"Children",
			"Tools and backpack",
			"Skills and professions",
			"Mastery",
			"Stardrops",
			"Achievements",
		];

		for (const title of titles) expect(body(title).hidden).toBe(false);
		await click(toggle("Stardrops"));
		expect(body("Stardrops").hidden).toBe(true);
		expect(toggle("Stardrops").getAttribute("aria-expanded")).toBe("false");
		expect(section("Stardrops").textContent).toContain("0 / 7 collected");
		expect(body("Mastery").hidden).toBe(false);
		await click(toggle("Stardrops"));
		expect(body("Stardrops").hidden).toBe(false);
	});

	it("keeps a closed section closed after leaving the page and coming back, and keeps its data", async () => {
		seed(withData(() => {}));
		await mount();
		await click(toggle("Mastery"));
		await click(toggle("Children"));
		act(() => root.unmount());
		root = createRoot(container);
		await mount();

		expect(body("Mastery").hidden).toBe(true);
		expect(body("Children").hidden).toBe(true);
		expect(body("Stardrops").hidden).toBe(false);
		await click(toggle("Mastery"));
		expect(body("Mastery").hidden).toBe(false);
	});

	it("keeps the typed values of a closed section", async () => {
		seed(withData(() => {}));
		await mount();

		await type(control("Farmer name") as HTMLInputElement, "Sam");
		await click(toggle("Farmer profile"));
		await click(toggle("Farmer profile"));

		expect((control("Farmer name") as HTMLInputElement).value).toBe("Sam");
		expect(data().character.name).toBe("Sam");
	});
});

describe("Farm character profile", () => {
	it("saves the text fields as they are typed", async () => {
		seed(withData(() => {}));
		await mount();

		await type(control("Farmer name") as HTMLInputElement, "Sam");
		await type(control("Farm name") as HTMLInputElement, "Rose");
		await type(control("Favorite thing") as HTMLInputElement, "Pizza");
		await type(control("Spouse") as HTMLInputElement, "Abigail");
		await choose(control("Gender") as HTMLSelectElement, "Female");

		expect(data().character).toMatchObject({
			name: "Sam",
			farmName: "Rose",
			favoriteThing: "Pizza",
			spouse: "Abigail",
			gender: "Female",
		});
	});

	it("keeps a saved gender that is not in the list", async () => {
		seed(
			withData((d) => {
				d.character.gender = "Undefined";
			})
		);
		await mount();
		const select = control("Gender") as HTMLSelectElement;

		expect([...select.options].map((o) => o.value)).toEqual(["Undefined", "Male", "Female"]);
		expect(select.value).toBe("Undefined");
	});

	it("offers four seasons in the date and no Ginger Island", async () => {
		seed(withData(() => {}));
		await mount();
		const season = control("Season") as HTMLSelectElement;

		expect([...season.options].map((o) => o.textContent)).toEqual([
			"Spring",
			"Summer",
			"Fall",
			"Winter",
		]);
		await choose(season, "winter");
		await type(control("Day") as HTMLInputElement, "15");
		await type(control("Year") as HTMLInputElement, "3");
		expect(data().character.currentDate).toEqual({ season: "winter", day: 15, year: 3 });
	});

	it("keeps the day between 1 and 28", async () => {
		seed(withData(() => {}));
		await mount();

		await type(control("Day") as HTMLInputElement, "40");
		expect(data().character.currentDate.day).toBe(28);
		await type(control("Day") as HTMLInputElement, "0");
		expect(data().character.currentDate.day).toBe(1);
	});

	it("sets the house level", async () => {
		seed(withData(() => {}));
		await mount();

		await click(radioIn(container, "2: Kids room"));

		expect(data().character.houseUpgradeLevel).toBe(2);
	});

	it("saves money and stats, with a decimal luck level", async () => {
		seed(withData(() => {}));
		await mount();

		await type(control("Money") as HTMLInputElement, "1227614");
		await type(control("Total earned") as HTMLInputElement, "2711595");
		await type(control("Max health") as HTMLInputElement, "150");
		await type(control("Max energy") as HTMLInputElement, "300");
		await type(control("Luck level") as HTMLInputElement, "0.35");

		expect(data().character).toMatchObject({
			money: 1227614,
			totalMoneyEarned: 2711595,
			maxHealth: 150,
			maxEnergy: 300,
			luckLevel: 0.35,
		});
	});

	it("ignores a half typed number and shows the saved value when the field loses focus", async () => {
		seed(
			withData((d) => {
				d.character.money = 500;
			})
		);
		await mount();
		const money = control("Money") as HTMLInputElement;

		await act(async () => money.focus());
		await type(money, "");
		expect(data().character.money).toBe(500);
		await type(money, "12x");
		expect(data().character.money).toBe(500);
		await act(async () => money.blur());
		expect(money.value).toBe("500");
	});

	it("shows the data the game owns as dashed tiles that cannot be edited", async () => {
		seed(
			withData((d) => {
				d.character.gameVersion = "1.6.15";
				d.character.totalDaysPlayed = 120;
				d.character.millisecondsPlayed = 58 * 3600000 + 26 * 60000;
			})
		);
		await mount();
		const stats = section("Money and stats");

		expect(stats.textContent).toContain("1.6.15");
		expect(stats.textContent).toContain("120");
		expect(stats.textContent).toContain("58h 26m");
		expect(stats.textContent).toContain("cannot be edited here");
	});
});

describe("Farm character map", () => {
	it("names the farm type and opens the map", async () => {
		seed(
			withData((d) => {
				d.character.farmType = 1;
			})
		);
		await mount();

		expect(text()).toContain("Riverland farm");
		expect(text()).toContain("cannot be changed here");
		await click(buttonIn(container, "View map"));
		const dialog = dialogWith("Riverland farm map");
		expect(dialog.querySelector("img")).not.toBeNull();
	});
});

describe("Farm character children", () => {
	it("adds up to two children and disables Add at two", async () => {
		seed(withData(() => {}));
		await mount();
		const children = () => section("Children");

		expect(children().textContent).toContain("0 / 2");
		await click(buttonIn(children(), "Add child"));
		await click(buttonIn(children(), "Add child"));
		expect(data().children).toHaveLength(2);
		expect(children().textContent).toContain("2 / 2");
		expect((buttonIn(children(), "Add child") as HTMLButtonElement).disabled).toBe(true);
	});

	it("edits a child in place", async () => {
		seed(
			withData((d) => {
				d.children = [{ name: "Ana", age: 2, gender: "Female" }];
			})
		);
		await mount();

		await type(control("Child 1 name") as HTMLInputElement, "Anna");
		await type(control("Child 1 age") as HTMLInputElement, "5");
		await choose(control("Child 1 gender") as HTMLSelectElement, "Male");

		expect(data().children).toEqual([{ name: "Anna", age: 5, gender: "Male" }]);
	});

	it("removes a child with an Undo toast that brings it back", async () => {
		seed(
			withData((d) => {
				d.children = [{ name: "Ana", age: 2, gender: "Female" }];
			})
		);
		await mount();

		await click(buttonIn(section("Children"), "Remove child 1"));

		expect(data().children).toEqual([]);
		expect(document.body.textContent).toContain("Ana removed");
		await click(toastUndo());
		expect(data().children).toEqual([{ name: "Ana", age: 2, gender: "Female" }]);
	});
});

describe("Farm character tools", () => {
	it("shows eight tools and saves a level chosen in its select", async () => {
		seed(withData(() => {}));
		await mount();
		const tools = section("Tools and backpack");

		expect(tools.textContent).toContain("8 items");
		await choose(byLabel("Pickaxe level") as HTMLSelectElement, "3");
		await choose(byLabel("Watering Can level") as HTMLSelectElement, "2");
		await choose(byLabel("Trash Can level") as HTMLSelectElement, "4");
		await choose(byLabel("Fishing Rod level") as HTMLSelectElement, "3");

		expect(data().toolLevels).toMatchObject({
			pickaxe: 3,
			wateringCan: 2,
			trashCan: 4,
			fishingRod: 3,
		});
	});

	it("starts the pan at None and copper is level 0", async () => {
		seed(withData(() => {}));
		await mount();
		const pan = byLabel("Pan level") as HTMLSelectElement;

		expect([...pan.options].map((o) => o.textContent)).toEqual([
			"None",
			"Copper",
			"Steel",
			"Gold",
			"Iridium",
		]);
		expect(pan.value).toBe("-1");
		await choose(pan, "0");
		expect(data().toolLevels.pan).toBe(0);
		expect(section("Tools and backpack").textContent).toContain("Copper");
	});

	it("saves the backpack size in the character", async () => {
		seed(withData(() => {}));
		await mount();

		await choose(byLabel("Backpack level") as HTMLSelectElement, "36");

		expect(data().character.maxItems).toBe(36);
		expect(data().toolLevels).toEqual(withData(() => {}).playthroughs[0].data.toolLevels);
	});

	it("shows an Upgrading tag on the tool Clint holds, from the game", async () => {
		seed(
			withData((d) => {
				d.toolLevels.currentlyUpgrading = "pickaxe";
			})
		);
		await mount();

		expect(section("Tools and backpack").textContent).toContain("Upgrading");
		expect(section("Tools and backpack").textContent).toContain(
			"Clint is upgrading the Pickaxe."
		);
	});

	it("opens a panel with every level, its cost and which one is current", async () => {
		seed(
			withData((d) => {
				d.toolLevels.hoe = 1;
			})
		);
		await mount();

		await click(buttonIn(section("Tools and backpack"), "Levels and costs Hoe"));
		const dialog = dialogWith("Hoe levels and costs");

		expect(dialog.textContent).toContain("Current");
		expect(dialog.textContent).toContain("2,000g");
		expect(dialog.textContent).toContain("5× Copper Bar");
		expect(dialog.textContent).toContain("Can be enchanted at the Forge.");
		expect(dialog.querySelectorAll("li").length).toBeGreaterThanOrEqual(5);
	});

	it("opens the backpack panel with its tiers and prices", async () => {
		seed(withData(() => {}));
		await mount();

		await click(buttonIn(section("Tools and backpack"), "Levels and costs Backpack"));
		const dialog = dialogWith("Backpack levels and costs");

		expect(dialog.textContent).toContain("Basic Backpack");
		expect(dialog.textContent).toContain("2,000g");
		expect(dialog.textContent).toContain("10,000g");
		expect(dialog.textContent).toContain("36 slots");
	});
});

describe("Farm character skills", () => {
	it("shows five skills and the total out of 50", async () => {
		seed(
			withData((d) => {
				d.skills = { farming: { level: 10, xp: 15000 }, mining: { level: 4, xp: 1300 } };
			})
		);
		await mount();

		expect(section("Skills and professions").textContent).toContain("14 / 50");
		expect(byLabel("Lower Farming level")).not.toBeNull();
		expect(byLabel("Raise Farming level")).toBeNull();
		for (const name of ["Mining", "Foraging", "Fishing", "Combat"]) {
			expect(byLabel(`Raise ${name} level`)).not.toBeNull();
		}
	});

	it("jumps to the first XP of the next level with the stepper", async () => {
		seed(withData(() => {}));
		await mount();

		await click(byLabel("Raise Farming level"));
		await click(byLabel("Raise Farming level"));

		expect(data().skills.farming).toEqual({ level: 2, xp: 380 });
		await click(byLabel("Lower Farming level"));
		expect(data().skills.farming).toEqual({ level: 1, xp: 100 });
	});

	it("places the skill inside a level when an exact XP is typed", async () => {
		seed(withData(() => {}));
		await mount();

		await type(
			section("Skills and professions").querySelector(
				'input[aria-label="Farming XP"]'
			) as HTMLInputElement,
			"800"
		);

		expect(data().skills.farming).toEqual({ level: 3, xp: 800 });
		expect(section("Skills and professions").textContent).toContain("800 / 1,300 XP");
	});

	it("shows the chosen professions and what is still to reach", async () => {
		seed(
			withData((d) => {
				d.skills = { farming: { level: 10, xp: 15000 } };
				d.professions = ["1", "4"];
			})
		);
		await mount();
		const skills = section("Skills and professions").textContent!;

		expect(skills).toContain("Level 5 · Tiller");
		expect(skills).toContain("Level 10 · Artisan");
		expect(skills).toContain("Reach level 5");
	});

	it("drops a profession the lower level cannot hold", async () => {
		seed(
			withData((d) => {
				d.skills = { farming: { level: 10, xp: 15000 } };
				d.professions = ["1", "4"];
			})
		);
		await mount();

		await type(
			section("Skills and professions").querySelector(
				'input[aria-label="Farming XP"]'
			) as HTMLInputElement,
			"2200"
		);

		expect(data().professions).toEqual(["1"]);
		expect(document.body.textContent).toContain(
			"Artisan was removed because the level is too low."
		);
		await click(toastUndo());
		expect(data().professions.sort()).toEqual(["1", "4"]);
		expect(data().skills.farming).toEqual({ level: 10, xp: 15000 });
	});

	it("keeps XP past level 10 and the professions when the stepper is not moved", async () => {
		seed(
			withData((d) => {
				d.skills = { farming: { level: 10, xp: 68150 } };
				d.professions = ["1", "4"];
			})
		);
		await mount();

		expect(section("Skills and professions").textContent).toContain("68,150 XP");
		await click(byLabel("Lower Farming level"));
		expect(data().skills.farming.level).toBe(9);
		expect(document.body.textContent).toContain("Artisan was removed");
	});

	it("opens the skill window with both level rows and the recipes of a level", async () => {
		seed(withData(() => {}));
		await mount();

		await click(buttonIn(section("Skills and professions"), "Levels and professions Farming"));
		const dialog = dialogWith("Levels 1 to 5");

		expect(dialog.textContent).toContain("Levels 6 to 10");
		expect(dialog.textContent).toContain("Level 5 · Choose one");
		expect(dialog.textContent).toContain("Level 10 · Choose one per branch");
		expect(dialog.textContent).toContain("Scarecrow");
		expect(dialog.textContent).toContain("If Rancher");
		expect(dialog.textContent).toContain("If Tiller");
	});

	it("keeps the professions locked until the skill reaches their level", async () => {
		seed(withData(() => {}));
		await mount();
		await click(buttonIn(section("Skills and professions"), "Levels and professions Farming"));
		const dialog = dialogWith("Levels 1 to 5");
		const option = (name: string) =>
			[...dialog.querySelectorAll("button[aria-pressed]")].find((b) =>
				b.textContent?.startsWith(name)
			) as HTMLButtonElement;

		expect(option("Tiller").disabled).toBe(true);
		expect(option("Artisan").disabled).toBe(true);
		await click(
			buttonIn(dialog, "−") ??
				dialog.querySelector('button[aria-label="Raise Farming level"]')
		);
		for (let i = 0; i < 4; i++)
			await click(dialog.querySelector('button[aria-label="Raise Farming level"]'));
		expect(option("Tiller").disabled).toBe(false);
		expect(option("Artisan").disabled).toBe(true);
	});

	it("picks a profession, names what changed in a toast, and Undo puts it back", async () => {
		seed(
			withData((d) => {
				d.skills = { farming: { level: 10, xp: 15000 } };
				d.professions = ["0"];
			})
		);
		await mount();
		await click(buttonIn(section("Skills and professions"), "Levels and professions Farming"));
		const dialog = dialogWith("Levels 1 to 5");
		const option = (name: string) =>
			[...dialog.querySelectorAll("button[aria-pressed]")].find((b) =>
				b.textContent?.startsWith(name)
			) as HTMLButtonElement;

		await click(option("Artisan"));

		expect(data().professions.sort()).toEqual(["1", "4"]);
		expect(document.body.textContent).toContain("Chose Artisan.");
		expect(option("Artisan").textContent).toContain("Chosen");
		expect(option("Rancher").textContent).not.toContain("Chosen");
		expect(document.body.textContent).toContain("Tiller was also chosen.");
		expect(document.body.textContent).toContain("Rancher was removed.");
		await click(toastUndo());
		expect(data().professions).toEqual(["0"]);
	});

	it("clears a chosen profession when it is picked again", async () => {
		seed(
			withData((d) => {
				d.skills = { farming: { level: 10, xp: 15000 } };
				d.professions = ["1", "4"];
			})
		);
		await mount();
		await click(buttonIn(section("Skills and professions"), "Levels and professions Farming"));
		const dialog = dialogWith("Levels 1 to 5");

		await click(
			[...dialog.querySelectorAll("button[aria-pressed]")].find((b) =>
				b.textContent?.startsWith("Tiller")
			)
		);

		expect(data().professions).toEqual([]);
		expect(document.body.textContent).toContain("Cleared Tiller.");
	});
});

describe("Farm character mastery", () => {
	it("saves the mastery XP and shows the level and the next threshold", async () => {
		seed(withData(() => {}));
		await mount();

		await type(control("Mastery XP (0 to 100,000)") as HTMLInputElement, "62000");

		expect(data().mastery.masteryXp).toBe(62000);
		const mastery = section("Mastery").textContent!;
		expect(mastery).toContain("62,000 / 100,000 XP · Level 3");
		expect(mastery).toContain("Level 4 starts at 70,000 XP.");
	});

	it("keeps the XP at 100,000 or less", async () => {
		seed(withData(() => {}));
		await mount();

		await type(control("Mastery XP (0 to 100,000)") as HTMLInputElement, "250000");

		expect(data().mastery.masteryXp).toBe(100000);
		expect(section("Mastery").textContent).toContain("Mastery level 5 is reached.");
	});

	it("marks a skill mastered and shows its three unlocks", async () => {
		seed(withData(() => {}));
		await mount();
		const mastery = () => section("Mastery");

		expect(mastery().textContent).toContain("0 / 5 Mastered");
		await click(byLabel("Farming mastered"));
		expect(data().mastery.unlocked).toEqual(["farming"]);
		expect(mastery().textContent).toContain("1 / 5 Mastered");
		expect(mastery().textContent).toContain("Iridium Scythe");
		expect(mastery().textContent).toContain("Golden Animal Crackers");
		await click(byLabel("Farming mastered"));
		expect(data().mastery.unlocked).toEqual([]);
	});
});

describe("Farm character stardrops", () => {
	it("shows seven and saves the ones collected", async () => {
		seed(withData(() => {}));
		await mount();

		expect(section("Stardrops").textContent).toContain("0 / 7 collected");
		await click(byLabel("Fair Stardrop collected"));
		expect(data().stardrops).toEqual({ CF_Fair: true });
		expect(section("Stardrops").textContent).toContain("1 / 7 collected");
		await click(byLabel("Fair Stardrop collected"));
		expect(data().stardrops).toEqual({});
	});
});

describe("Farm character achievements", () => {
	it("shows twelve of 49 until Show all", async () => {
		seed(withData(() => {}));
		await mount();
		const achievements = () => section("Achievements");

		expect(achievements().textContent).toContain("0 / 49 earned");
		expect(achievements().textContent).toContain("Showing 12 of 49");
		expect(achievements().querySelectorAll('[role="switch"]')).toHaveLength(12);
		await click(buttonIn(achievements(), "Show all 49"));
		expect(achievements().querySelectorAll('[role="switch"]')).toHaveLength(49);
		await click(buttonIn(achievements(), "Show fewer"));
		expect(achievements().querySelectorAll('[role="switch"]')).toHaveLength(12);
	});

	it("saves an achievement when switched", async () => {
		seed(withData(() => {}));
		await mount();

		await click(byLabel("Greenhorn earned"));

		expect(data().achievements).toEqual(["0"]);
		expect(section("Achievements").textContent).toContain("1 / 49 earned");
	});

	it("filters by status and searches the name and the description", async () => {
		seed(
			withData((d) => {
				d.achievements = ["0", "1"];
			})
		);
		await mount();
		const achievements = () => section("Achievements");

		await click(radioIn(achievements(), "Earned"));
		expect(achievements().textContent).toContain("Showing 2 of 2");
		await click(radioIn(achievements(), "Locked"));
		expect(achievements().textContent).toContain("Showing 12 of 47");
		await click(radioIn(achievements(), "All"));
		await type(
			achievements().querySelector('input[type="search"]') as HTMLInputElement,
			"15,000g"
		);
		expect(achievements().textContent).toContain("Showing 1 of 1");
		await type(
			achievements().querySelector('input[type="search"]') as HTMLInputElement,
			"zzzz"
		);
		expect(achievements().textContent).toContain("No achievements match your search.");
	});
});
