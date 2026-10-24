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
const control = (root: ParentNode, label: string) =>
	[...root.querySelectorAll("label")].find((l) => l.textContent === label)?.control as
		HTMLInputElement | HTMLSelectElement | null;
const section = (title: string) =>
	[...container.querySelectorAll('[role="region"]')].find(
		(el) => el.querySelector("h2")?.textContent === title
	) as HTMLElement;
const buttonIn = (root: ParentNode, label: string) =>
	[...root.querySelectorAll("button")].find((b) => b.textContent?.trim() === label);
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
const names = () =>
	[...section("Farm animals").querySelectorAll("span.font-semibold")].map(
		(el) => el.textContent!
	);
const cardOf = (name: string) =>
	[...section("Farm animals").querySelectorAll("span.font-semibold")]
		.find((el) => el.textContent === name)!
		.closest("div.flex.flex-col.gap-3") as HTMLElement;

const animal = (id: string, over: object = {}) => ({
	name: id,
	id,
	type: "White Chicken",
	buildingType: "Coop",
	buildingId: "coop",
	friendship: 500,
	happiness: 255,
	age: 10,
	hasAnimalCracker: false,
	...over,
});

const farm = (extra: (d: AppData["playthroughs"][number]["data"]) => void = () => {}) =>
	withData((d) => {
		d.buildings = [
			{ id: "coop", type: "Coop", animalCount: 2 },
			{ id: "big", type: "Big Coop", animalCount: 1 },
			{ id: "deluxe", type: "Deluxe Coop", animalCount: 0 },
			{ id: "barn", type: "Barn", animalCount: 1 },
			{ id: "silo", type: "Silo", animalCount: 0 },
		];
		d.animals = [
			animal("Lucas", { friendship: 1000, age: 112, hasAnimalCracker: true }),
			animal("Zed", { friendship: 100, age: 5 }),
			animal("Ana", { type: "Duck", buildingId: "big", friendship: 200, age: 30 }),
			animal("Bo", {
				type: "White Cow",
				buildingType: "Barn",
				buildingId: "barn",
				friendship: 600,
				age: 60,
			}),
		];
		d.pets = [
			{ name: "Yogi", type: "Dog", breed: "2", friendship: 900, starter: true },
			{ name: "Grover", type: "Horse", breed: "", friendship: null, starter: false },
			{ name: "Gimi", type: "Turtle", breed: "0", friendship: -16, starter: false },
		];
		extra(d);
	});

beforeEach(() => {
	forgetMemoryState();
	localStorage.clear();
	navigation.search = "tab=animals";
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

describe("Farm animals tab", () => {
	it("shows the tiles, the animals and the pets", async () => {
		seed(farm());
		await mount();
		const tiles = text().replace(/\s/g, "");

		for (const expected of [
			"Farmanimals4",
			"Buildings5",
			"Pets3",
			"Averagefriendship475/1000",
			"Goldencrackers1",
		]) {
			expect(tiles).toContain(expected);
		}
		expect(section("Farm animals").textContent).toContain("4 animals");
		expect(section("Pets").textContent).toContain("3 pets");
		expect(names()).toEqual(["Ana", "Bo", "Lucas", "Zed"]);
		expect(container.querySelector('a[href="/farm?tab=buildings"]')).not.toBeNull();
	});

	it("puts the Add animal button to the right of the Filters button, with an icon", async () => {
		seed(farm());
		await mount();
		const filters = buttonIn(section("Farm animals"), "Filters")!;
		const add = filters.nextElementSibling as HTMLElement;

		expect(add.textContent).toBe("Add animal");
		expect(add.querySelector("svg")).not.toBeNull();
		expect(add.parentElement).toBe(filters.parentElement);
	});

	it("shows the species, the building, the hearts and a produce line", async () => {
		seed(farm());
		await mount();
		const lucas = cardOf("Lucas");

		expect(lucas.textContent).toContain("White Chicken · Coop");
		expect(lucas.querySelector('[aria-label="5 of 5 hearts"]')).not.toBeNull();
		expect(lucas.textContent).toContain("Produces Egg");
		expect(cardOf("Zed").querySelector('[aria-label="2 of 5 hearts"]')).toBeNull();
		expect(cardOf("Zed").querySelector('[aria-label="0 of 5 hearts"]')).not.toBeNull();
	});

	it("says how long a baby needs before it produces", async () => {
		seed(
			farm((d) => d.animals.push(animal("Baby", { age: 1, type: "Sheep", buildingId: "" })))
		);
		await mount();

		expect(cardOf("Baby").textContent).toMatch(/Grows up in \d+ days?/);
	});

	it("moves friendship in steps of 50 and takes an exact value", async () => {
		seed(farm());
		await mount();

		await click(byLabel("Raise Zed friendship"));
		expect(data().animals.find((a) => a.id === "Zed")?.friendship).toBe(150);
		await click(byLabel("Lower Zed friendship"));
		await click(byLabel("Lower Zed friendship"));
		expect(data().animals.find((a) => a.id === "Zed")?.friendship).toBe(50);
		await type(byLabel("Zed friendship") as HTMLInputElement, "777");
		expect(data().animals.find((a) => a.id === "Zed")?.friendship).toBe(777);
		await type(byLabel("Zed friendship") as HTMLInputElement, "5000");
		expect(data().animals.find((a) => a.id === "Zed")?.friendship).toBe(1000);
		expect(byLabel("Raise Zed friendship")?.hasAttribute("disabled")).toBe(true);
	});

	it("edits age and happiness and the golden cracker", async () => {
		seed(farm());
		await mount();

		await type(byLabel("Zed age in days") as HTMLInputElement, "40");
		await type(byLabel("Zed happiness") as HTMLInputElement, "300");
		await click(byLabel("Zed golden cracker"));

		expect(data().animals.find((a) => a.id === "Zed")).toMatchObject({
			age: 40,
			happiness: 255,
			hasAnimalCracker: true,
		});
		expect(text().replace(/\s/g, "")).toContain("Goldencrackers2");
	});

	it("lists only buildings the species fits in, with their capacity, and moves the animal", async () => {
		seed(farm());
		await mount();
		const select = control(cardOf("Ana"), "Ana housed in") as HTMLSelectElement;

		expect([...select.options].map((o) => o.textContent)).toEqual([
			"Unhoused",
			"Big Coop (1 / 8)",
			"Deluxe Coop (0 / 12)",
		]);
		await choose(select, "deluxe");
		expect(data().animals.find((a) => a.id === "Ana")).toMatchObject({
			buildingId: "deluxe",
			buildingType: "Coop",
		});
		expect(data().buildings.find((b) => b.id === "big")?.animalCount).toBe(0);
		expect(data().buildings.find((b) => b.id === "deluxe")?.animalCount).toBe(1);
	});

	it("unhouses an animal", async () => {
		seed(farm());
		await mount();

		await choose(control(cardOf("Bo"), "Bo housed in") as HTMLSelectElement, "");

		expect(data().animals.find((a) => a.id === "Bo")).toMatchObject({
			buildingId: "",
			buildingType: "",
		});
		expect(data().buildings.find((b) => b.id === "barn")?.animalCount).toBe(0);
		expect(cardOf("Bo").textContent).toContain("White Cow · Unhoused");
	});

	it("removes an animal with a toast, and Undo brings it back with its friendship", async () => {
		seed(farm());
		await mount();

		await click(byLabel("Remove Lucas"));

		expect(data().animals.map((a) => a.id)).not.toContain("Lucas");
		expect(document.body.textContent).toContain(
			"Removed Lucas. Undo restores the animal and its friendship."
		);
		expect(data().buildings.find((b) => b.id === "coop")?.animalCount).toBe(1);
		await click(toastUndo());
		expect(data().animals.find((a) => a.id === "Lucas")).toMatchObject({
			friendship: 1000,
			hasAnimalCracker: true,
		});
		expect(data().buildings.find((b) => b.id === "coop")?.animalCount).toBe(2);
	});

	it("opens the details in place with days to produce, price and the deluxe produce", async () => {
		seed(farm());
		await mount();
		const card = cardOf("Bo");
		const toggle = [...card.querySelectorAll("button")].find(
			(b) => b.textContent === "Show details"
		)!;
		const region = card.querySelector(
			`#${CSS.escape(toggle.getAttribute("aria-controls")!)}`
		) as HTMLElement;

		expect(region.hidden).toBe(true);
		await click(toggle);
		expect(region.textContent).toContain("Days to produce");
		expect(region.textContent).toContain("750g");
		expect(region.textContent).toContain("Large Milk");
	});
});

describe("Farm animals filters", () => {
	it("sorts by friendship and by age", async () => {
		seed(farm());
		await mount();
		await click(
			[...container.querySelectorAll("button")].find((b) =>
				b.textContent?.startsWith("Filters")
			)
		);

		await click(flyoutRadio("Friendship"));
		expect(names()).toEqual(["Lucas", "Bo", "Ana", "Zed"]);
		expect(section("Farm animals").textContent).toContain("Sorted by friendship");
		await click(flyoutRadio("Age"));
		expect(names()).toEqual(["Lucas", "Bo", "Ana", "Zed"]);
	});

	it("filters by species and by building family", async () => {
		seed(farm());
		await mount();
		await click(
			[...container.querySelectorAll("button")].find((b) =>
				b.textContent?.startsWith("Filters")
			)
		);

		await choose(
			flyout()!.querySelector('select[aria-label="Type"]') as HTMLSelectElement,
			"White Cow"
		);
		expect(names()).toEqual(["Bo"]);
		await choose(
			flyout()!.querySelector('select[aria-label="Type"]') as HTMLSelectElement,
			"all"
		);
		await click(flyoutRadio("Coop"));
		expect(names()).toEqual(["Ana", "Lucas", "Zed"]);
		await click(flyoutRadio("Barn"));
		expect(names()).toEqual(["Bo"]);
	});

	it("searches the name and the species, and shows the no match state", async () => {
		seed(farm());
		await mount();
		const search = section("Farm animals").querySelector(
			'input[type="search"]'
		) as HTMLInputElement;

		await type(search, "duck");
		expect(names()).toEqual(["Ana"]);
		await type(search, "zzzz");
		expect(text()).toContain("No animals match your filters.");
		await click(
			[...section("Farm animals").querySelectorAll("button")].find(
				(b) => b.textContent === "Clear filters"
			)
		);
		expect(names()).toHaveLength(4);
	});

	it("says there are no animals yet", async () => {
		seed(farm((d) => (d.animals = [])));
		await mount();

		expect(text()).toContain("No farm animals yet.");
	});
});

describe("Farm animals add form", () => {
	const open = async () => click(buttonIn(section("Farm animals"), "Add animal"));
	const form = () =>
		[...document.body.querySelectorAll("dialog")].find((d) =>
			d.textContent?.includes("Species")
		)!;
	const submit = () =>
		click([...form().querySelectorAll("button")].find((b) => b.textContent === "Add animal"));

	it("needs a name", async () => {
		seed(farm());
		await mount();
		await open();

		await submit();

		expect(text()).toContain("Name is required.");
		expect(data().animals).toHaveLength(4);
	});

	it("lists the buildings that fit the species and have room, then adds the animal", async () => {
		seed(farm());
		await mount();
		await open();
		const building = control(form(), "Building") as HTMLSelectElement;

		await choose(control(form(), "Species") as HTMLSelectElement, "Rabbit");
		expect([...building.options].map((o) => o.value)).toEqual(["", "deluxe"]);
		await choose(control(form(), "Species") as HTMLSelectElement, "Duck");
		expect([...building.options].map((o) => o.value)).toEqual(["", "big", "deluxe"]);
		await type(control(form(), "Name") as HTMLInputElement, "Quack");
		await type(control(form(), "Friendship") as HTMLInputElement, "300");
		await choose(building, "deluxe");
		await submit();

		const added = data().animals.find((a) => a.name === "Quack")!;
		expect(added).toMatchObject({
			type: "Duck",
			friendship: 300,
			happiness: 255,
			age: 0,
			buildingId: "deluxe",
			hasAnimalCracker: false,
		});
		expect(added.id).toMatch(/^manual-animal-\d+$/);
		expect(data().buildings.find((b) => b.id === "deluxe")?.animalCount).toBe(1);
		expect(names()).toContain("Quack");
	});

	it("leaves a full building out of the list", async () => {
		seed(farm((d) => d.animals.push(animal("F1"), animal("F2"))));
		await mount();
		await click(buttonIn(section("Farm animals"), "Add animal"));
		await choose(control(form(), "Species") as HTMLSelectElement, "White Chicken");

		expect(
			[...(control(form(), "Building") as HTMLSelectElement).options].map((o) => o.value)
		).not.toContain("coop");
	});

	it("opens as a modal dialog with a Cancel and an Add button in its footer", async () => {
		seed(farm());
		await mount();
		await open();
		const dialog = form();

		expect(dialog.hasAttribute("open")).toBe(true);
		expect(dialog.querySelector("footer")?.textContent).toContain("Cancel");
		expect(dialog.querySelector("footer")?.textContent).toContain("Add animal");
		expect(dialog.textContent).toContain("Only buildings that fit the species are listed.");
	});

	it("closes with Cancel and adds nothing", async () => {
		seed(farm());
		await mount();
		await open();
		await type(control(form(), "Name") as HTMLInputElement, "Ghost");

		await click(buttonIn(form(), "Cancel"));

		expect(document.body.querySelector("dialog[open]")).toBeNull();
		expect(data().animals).toHaveLength(4);
	});

	it("starts empty each time it opens", async () => {
		seed(farm());
		await mount();
		await open();
		await type(control(form(), "Name") as HTMLInputElement, "Ghost");
		await click(buttonIn(form(), "Cancel"));
		await open();

		expect((control(form(), "Name") as HTMLInputElement).value).toBe("");
	});

	it("closes after adding", async () => {
		seed(farm());
		await mount();
		await open();
		await type(control(form(), "Name") as HTMLInputElement, "Quack");

		await submit();

		expect(document.body.querySelector("dialog[open]")).toBeNull();
		expect(names()).toContain("Quack");
	});
});

describe("Farm pets", () => {
	const petDialog = () =>
		[...document.body.querySelectorAll("dialog")].find(
			(d) => d.textContent?.includes("Variant") || d.textContent?.includes("Starter pet")
		)!;

	const petCard = (name: string) =>
		[...section("Pets").querySelectorAll("span.font-semibold")]
			.find((el) => el.textContent === name)!
			.closest("div.flex.flex-col.gap-3") as HTMLElement;

	it("shows a starter tag, a friendship control, and none for a horse", async () => {
		seed(farm());
		await mount();

		expect(petCard("Yogi").textContent).toContain("Starter");
		expect(byLabel("Yogi friendship")).not.toBeNull();
		expect(byLabel("Grover friendship")).toBeNull();
		expect(petCard("Grover").textContent).toContain("Horses have no friendship value.");
	});

	it("puts the Add pet button at the right end of its row, with an icon", async () => {
		seed(farm());
		await mount();
		const add = buttonIn(section("Pets"), "Add pet")!;

		expect(add.querySelector("svg")).not.toBeNull();
		expect(add.parentElement?.className).toContain("justify-end");
	});

	it("sets a pet's friendship", async () => {
		seed(farm());
		await mount();

		await click(byLabel("Raise Yogi friendship"));
		expect(data().pets[0].friendship).toBe(950);
		await type(byLabel("Yogi friendship") as HTMLInputElement, "50");
		expect(data().pets[0].friendship).toBe(50);
	});

	it("makes one pet the starter and clears the other", async () => {
		seed(
			farm((d) =>
				d.pets.push({
					name: "Mimi",
					type: "Cat",
					breed: "3",
					friendship: 0,
					starter: false,
				})
			)
		);
		await mount();

		await click(byLabel("Mimi starter pet"));

		expect(data().pets.map((p) => p.starter)).toEqual([false, false, false, true]);
		expect(byLabel("Grover starter pet")).toBeNull();
		expect(byLabel("Gimi starter pet")).toBeNull();
	});

	it("removes a pet with a toast, and Undo brings it back", async () => {
		seed(farm());
		await mount();

		await click(byLabel("Remove Yogi"));

		expect(data().pets.map((p) => p.name)).toEqual(["Grover", "Gimi"]);
		expect(document.body.textContent).toContain(
			"Removed Yogi. Undo restores the pet and its friendship."
		);
		await click(toastUndo());
		expect(data().pets.map((p) => p.name)).toEqual(["Yogi", "Grover", "Gimi"]);
	});

	it("adds a cat with a look and as the starter, replacing the old starter", async () => {
		seed(farm());
		await mount();
		await click(buttonIn(section("Pets"), "Add pet"));
		const form = petDialog();

		await type(control(form, "Name") as HTMLInputElement, "Mimi");
		await choose(control(form, "Type") as HTMLSelectElement, "Cat");
		await click(
			[...form.querySelectorAll('input[name="pet-variant"]')].find(
				(i) => i.closest("label")?.textContent?.trim() === "Cat 4"
			)
		);
		await type(control(form, "Friendship") as HTMLInputElement, "400");
		await click(form.querySelector('[role="switch"][aria-label="Starter pet"]'));
		await click(buttonIn(form, "Add pet"));

		expect(data().pets.at(-1)).toEqual({
			name: "Mimi",
			type: "Cat",
			breed: "4",
			friendship: 400,
			starter: true,
		});
		expect(data().pets[0].starter).toBe(false);
	});

	it("hides friendship and the starter switch for a horse, and needs a name", async () => {
		seed(farm());
		await mount();
		await click(buttonIn(section("Pets"), "Add pet"));
		const form = petDialog();

		await choose(control(form, "Type") as HTMLSelectElement, "Horse");
		expect(control(form, "Friendship")).toBeFalsy();
		expect(form.querySelector('[role="switch"][aria-label="Starter pet"]')).toBeNull();
		await click(buttonIn(form, "Add pet"));
		expect(text()).toContain("Name is required.");
		expect(data().pets).toHaveLength(3);
	});

	it("opens as a modal dialog, closes with Cancel and starts empty the next time", async () => {
		seed(farm());
		await mount();
		await click(buttonIn(section("Pets"), "Add pet"));

		expect(petDialog().hasAttribute("open")).toBe(true);
		expect(petDialog().querySelector("footer")?.textContent).toContain("Cancel");
		await type(control(petDialog(), "Name") as HTMLInputElement, "Ghost");
		await click(buttonIn(petDialog(), "Cancel"));
		expect(document.body.querySelector("dialog[open]")).toBeNull();
		expect(data().pets).toHaveLength(3);
		await click(buttonIn(section("Pets"), "Add pet"));
		expect((control(petDialog(), "Name") as HTMLInputElement).value).toBe("");
	});
});
