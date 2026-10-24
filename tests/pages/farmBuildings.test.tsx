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
const byLabel = (label: string) =>
	container.querySelector(`[aria-label="${label}"]`) as
		HTMLInputElement | HTMLSelectElement | null;
const section = () =>
	[...container.querySelectorAll('[role="region"]')].find(
		(el) => el.querySelector("h2")?.textContent === "Buildings"
	) as HTMLElement;
const buttonIn = (root: ParentNode, label: string) =>
	[...root.querySelectorAll("button")].find((b) => b.textContent?.trim() === label);
const toastUndo = () =>
	[...document.body.querySelectorAll("button")].find((b) => b.textContent === "Undo");
const radioIn = (root: ParentNode, label: string) =>
	[...root.querySelectorAll('input[type="radio"]')].find(
		(input) => input.closest("label")?.textContent?.trim() === label
	) as HTMLInputElement;
const names = () =>
	[...section().querySelectorAll("span.font-semibold")].map((el) => el.textContent!);
const cardOf = (name: string) =>
	[...section().querySelectorAll("span.font-semibold")]
		.find((el) => el.textContent === name)!
		.closest("div.flex.flex-col.gap-3") as HTMLElement;
const searchBox = () => section().querySelector('input[type="search"]') as HTMLInputElement;

const animal = (id: string, buildingId: string, buildingType: string) => ({
	name: id,
	id,
	type: "White Chicken",
	buildingType,
	buildingId,
	friendship: 100,
	happiness: 255,
	age: 5,
	hasAnimalCracker: false,
});

const farm = (extra: (d: AppData["playthroughs"][number]["data"]) => void = () => {}) =>
	withData((d) => {
		d.character.houseUpgradeLevel = 2;
		d.buildings = [
			{ id: "house", type: "Farmhouse", animalCount: 0 },
			{ id: "green", type: "Greenhouse", animalCount: 0 },
			{ id: "coop", type: "Coop", animalCount: 2 },
			{ id: "barn", type: "Barn", animalCount: 1 },
			{ id: "pond", type: "Fish Pond", animalCount: 3 },
			{ id: "hutch", type: "Slime Hutch", animalCount: 4 },
			{ id: "hut", type: "Junimo Hut", animalCount: 0 },
		];
		d.fishPonds = [{ buildingId: "pond", fishType: 698, currentOccupants: 3, maxOccupants: 5 }];
		d.animals = [
			animal("Ana", "coop", "Coop"),
			animal("Bo", "coop", "Coop"),
			animal("Cy", "barn", "Barn"),
		];
		extra(d);
	});

beforeEach(() => {
	forgetMemoryState();
	localStorage.clear();
	navigation.search = "tab=buildings";
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

describe("Farm buildings tab", () => {
	it("shows the six tiles and all the buildings", async () => {
		seed(farm());
		await mount();
		const tiles = text().replace(/\s/g, "");

		for (const expected of [
			"Totalbuildings7",
			"Robinbuilt4",
			"Wizardbuilt1",
			"Animalshoused7",
			"Fishponds1",
			"Fishinponds3",
		]) {
			expect(tiles).toContain(expected);
		}
		expect(section().textContent).toContain("7 buildings");
		expect(names()).toEqual([
			"Farmhouse Upgrade 2",
			"Greenhouse",
			"Coop",
			"Barn",
			"Fish Pond",
			"Slime Hutch",
			"Junimo Hut",
		]);
	});

	it("names two buildings of one type Coop 1 and Coop 2", async () => {
		seed(farm((d) => d.buildings.push({ id: "coop2", type: "Coop", animalCount: 0 })));
		await mount();

		expect(names()).toContain("Coop 1");
		expect(names()).toContain("Coop 2");
	});

	it("shows the builder and the cost, and the farmhouse note with a link to the Character tab", async () => {
		seed(farm());
		await mount();

		expect(cardOf("Coop").textContent).toContain("Robin · 4,000g");
		expect(cardOf("Junimo Hut").textContent).toContain("Wizard");
		const house = cardOf("Farmhouse Upgrade 2");
		expect(house.textContent).toContain("The farmhouse name follows your house level.");
		expect(house.querySelector('a[href="/farm?tab=character"]')).not.toBeNull();
	});

	it("lists the animals that live in a coop and links to the Animals tab", async () => {
		seed(farm());
		await mount();
		const coop = cardOf("Coop");

		expect(coop.textContent).toContain("2 / 4 animals");
		expect(coop.textContent).toContain("Ana");
		expect(coop.textContent).toContain("Bo");
		expect(coop.querySelector('a[href="/farm?tab=animals"]')).not.toBeNull();
		expect(cardOf("Barn").textContent).toContain("1 / 4 animals");
	});

	it("says when no animals live in a building", async () => {
		seed(farm((d) => (d.animals = [])));
		await mount();

		expect(cardOf("Coop").textContent).toContain("No animals live here.");
	});

	it("changes the slimes in a slime hutch with a stepper", async () => {
		seed(farm());
		await mount();

		await click(byLabel("Raise Slime Hutch slimes housed"));
		expect(data().buildings.find((b) => b.id === "hutch")?.animalCount).toBe(5);
		await click(byLabel("Lower Slime Hutch slimes housed"));
		await click(byLabel("Lower Slime Hutch slimes housed"));
		expect(data().buildings.find((b) => b.id === "hutch")?.animalCount).toBe(3);
	});

	it("has no stepper for a coop, which follows its animals", async () => {
		seed(farm());
		await mount();

		expect(byLabel("Raise Coop slimes housed")).toBeNull();
		expect(cardOf("Coop").querySelector('[aria-label^="Raise"]')).toBeNull();
	});

	it("shows a pond's fish and changes the fish and how many are in it", async () => {
		seed(farm());
		await mount();
		const pond = cardOf("Fish Pond");
		const select = pond.querySelector("select") as HTMLSelectElement;

		expect(select.selectedOptions[0].textContent).toBe("Sturgeon");
		expect(pond.textContent).toContain("3 / 5 fish");
		await click(byLabel("Raise Fish in Fish Pond"));
		expect(data().fishPonds[0].currentOccupants).toBe(4);
		expect(data().buildings.find((b) => b.id === "pond")?.animalCount).toBe(4);
		await choose(select, "128");
		expect(data().fishPonds[0].fishType).toBe(128);
	});

	it("does not take a pond past its maximum", async () => {
		seed(farm((d) => (d.fishPonds[0].currentOccupants = 5)));
		await mount();

		expect(byLabel("Raise Fish in Fish Pond")).toBeNull();
	});

	it("opens the details in place with the build info and the materials", async () => {
		seed(farm());
		await mount();
		const card = cardOf("Coop");
		const toggle = [...card.querySelectorAll("button")].find(
			(b) => b.textContent === "Show details"
		)!;
		const region = card.querySelector(
			`#${CSS.escape(toggle.getAttribute("aria-controls")!)}`
		) as HTMLElement;

		expect(region.hidden).toBe(true);
		await click(toggle);
		expect(region.textContent).toContain("Build info");
		expect(region.textContent).toContain("Robin");
		expect(region.textContent).toContain("Materials");
		expect(region.textContent).toContain("Wood");
		expect(region.textContent).toContain("Max occupants");
	});
});

describe("Farm buildings filters", () => {
	it("filters by builder and lists the farmhouse and greenhouse under All only", async () => {
		seed(farm());
		await mount();

		await click(radioIn(section(), "Robin"));
		expect(names()).toEqual(["Coop", "Barn", "Fish Pond", "Slime Hutch"]);
		expect(section().textContent).toContain("The farmhouse is listed under All only.");
		await click(radioIn(section(), "Wizard"));
		expect(names()).toEqual(["Junimo Hut"]);
		await click(radioIn(section(), "All"));
		expect(names()).toHaveLength(7);
	});

	it("searches the building and the fish of a pond, and shows the no match state", async () => {
		seed(farm());
		await mount();

		await type(searchBox(), "sturgeon");
		expect(names()).toEqual(["Fish Pond"]);
		await type(searchBox(), "zzzz");
		expect(text()).toContain("No buildings match your filters.");
		await click(buttonIn(section(), "Clear filters"));
		expect(names()).toHaveLength(7);
	});

	it("says there are no buildings yet", async () => {
		seed(farm((d) => (d.buildings = [])));
		await mount();

		expect(text()).toContain("No buildings yet.");
	});
});

describe("Farm buildings add and remove", () => {
	const dialog = () =>
		[...document.body.querySelectorAll("dialog")].find((d) =>
			d.textContent?.includes("Add a building")
		)!;

	it("puts the Add building button with an icon to the right of the Builder filter", async () => {
		seed(farm());
		await mount();
		const add = buttonIn(section(), "Add building")!;

		expect(add.querySelector("svg")).not.toBeNull();
		expect(add.parentElement?.querySelector('input[type="radio"]')).not.toBeNull();
	});

	it("opens a dialog of Robin and Wizard buildings, shows how many are owned, and adds several", async () => {
		seed(farm());
		await mount();
		await click(buttonIn(section(), "Add building"));

		expect(dialog().textContent).toContain("Robin");
		expect(dialog().textContent).toContain("Wizard");
		expect(dialog().textContent).toContain("Houses up to 12");
		expect(dialog().textContent).not.toContain("Greenhouse");
		await click(dialog().querySelector('button[aria-label="Add Big Coop"]'));
		await click(dialog().querySelector('button[aria-label="Add Big Coop"]'));
		expect(data().buildings.filter((b) => b.type === "Big Coop")).toHaveLength(2);
		expect(dialog().textContent).toContain("×2");
		const added = data().buildings.find((b) => b.type === "Big Coop")!;
		expect(added.animalCount).toBe(0);
		expect(added.id).toMatch(/^manual-big-coop-\d+$/);
		await click(buttonIn(dialog(), "Done"));
		expect(document.body.querySelector("dialog[open]")).toBeNull();
		expect(names()).toContain("Big Coop 1");
	});

	it("adds a fish pond with a pond entry and no fish", async () => {
		seed(farm());
		await mount();
		await click(buttonIn(section(), "Add building"));

		await click(dialog().querySelector('button[aria-label="Add Fish Pond"]'));

		expect(data().fishPonds).toHaveLength(2);
		expect(data().fishPonds[1]).toMatchObject({
			fishType: 0,
			currentOccupants: 0,
			maxOccupants: 10,
		});
		expect(text().replace(/\s/g, "")).toContain("Fishponds2");
	});

	it("removes a barn and tells how many animals are now unhoused, and Undo puts everything back", async () => {
		seed(farm());
		await mount();

		await click(byLabel("Remove Barn"));

		expect(data().buildings.map((b) => b.id)).not.toContain("barn");
		expect(data().animals.find((a) => a.id === "Cy")).toMatchObject({
			buildingId: "",
			buildingType: "",
		});
		expect(document.body.textContent).toContain(
			"Removed Barn. 1 animal is now Unhoused on the Animals tab."
		);
		await click(toastUndo());
		expect(data().buildings.map((b) => b.id)).toContain("barn");
		expect(data().animals.find((a) => a.id === "Cy")).toMatchObject({
			buildingId: "barn",
			buildingType: "Barn",
		});
	});

	it("removes a coop and says two animals are unhoused", async () => {
		seed(farm());
		await mount();

		await click(byLabel("Remove Coop"));

		expect(document.body.textContent).toContain("2 animals are now Unhoused");
	});

	it("removes a pond building together with its pond", async () => {
		seed(farm());
		await mount();

		await click(byLabel("Remove Fish Pond"));

		expect(data().fishPonds).toEqual([]);
		expect(document.body.textContent).toContain("Removed Fish Pond.");
		await click(toastUndo());
		expect(data().fishPonds).toHaveLength(1);
	});

	it("cannot remove the farmhouse or the greenhouse", async () => {
		seed(farm());
		await mount();

		expect(byLabel("Remove Farmhouse Upgrade 2")).toBeNull();
		expect(byLabel("Remove Greenhouse")).toBeNull();
		expect(byLabel("Remove Coop")).not.toBeNull();
	});
});
