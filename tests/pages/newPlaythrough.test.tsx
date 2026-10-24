import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act } from "react";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import type { AppData } from "@/types/app";
import { PlaythroughProvider } from "@/lib/contexts/PlaythroughContext";
import { UIProvider } from "@/lib/contexts/UIContext";
import { STORAGE_KEY } from "@/service/storage";
import { DEFAULT_GAME_DATA } from "@/data/constants";
import { NewPlaythroughPage } from "@/comps/new-playthrough/NewPlaythroughPage";
import { ToastProvider } from "@/comps/ui/Toast";
import { emptyPlaythrough } from "../storage/fixtures";

const mocks = vi.hoisted(() => ({
	search: "",
	push: vi.fn(),
	parseSaveFile: vi.fn(),
}));

vi.mock("next/navigation", () => ({
	useRouter: () => ({ push: mocks.push }),
	useSearchParams: () => new URLSearchParams(mocks.search),
}));

vi.mock("stardew-valley-data", async (importOriginal) => ({
	...(await importOriginal<typeof import("stardew-valley-data")>()),
	parseSaveFile: mocks.parseSaveFile,
}));

vi.mock("@/lib/utils/saveFileMapper", () => ({
	mapSaveDataToGameData: () => ({
		...DEFAULT_GAME_DATA,
		character: { ...DEFAULT_GAME_DATA.character, name: "Sam", farmName: "Riverland" },
	}),
}));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const fakeSave = {
	player: {
		name: "Sam",
		farmName: "Riverland",
		gender: "male",
		money: 1000,
		totalMoneyEarned: 5000,
		skills: {
			farming: { level: 1 },
			fishing: { level: 2 },
			foraging: { level: 3 },
			mining: { level: 4 },
			combat: { level: 5 },
		},
	},
	farm: { type: 1 },
	date: { season: "fall", day: 12, year: 2 },
	fishCaught: [],
	itemsShipped: [],
	cookingRecipes: [],
	craftingRecipes: [],
	museum: { donations: [] },
	bundles: { isJojaRoute: false, isCCComplete: false, rooms: [] },
};

let root: Root;
let container: HTMLElement;

const stored = () => JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null") as AppData | null;

const mount = async () => {
	await act(async () => {
		root.render(
			<UIProvider>
				<ToastProvider>
					<PlaythroughProvider>
						<NewPlaythroughPage />
					</PlaythroughProvider>
				</ToastProvider>
			</UIProvider>
		);
	});
};

const text = () => document.body.textContent ?? "";
const button = (label: string) =>
	[...document.body.querySelectorAll("button")].find((b) => b.textContent?.trim() === label) as
		HTMLButtonElement | undefined;
const tile = (title: string) =>
	[...document.body.querySelectorAll("button")].find((b) => b.textContent?.includes(title)) as
		HTMLButtonElement | undefined;

const click = async (element: Element | undefined | null) => {
	expect(element).toBeTruthy();
	await act(async () => {
		element!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
	});
};

const type = async (input: Element | null, value: string) => {
	const element = input as HTMLInputElement | HTMLTextAreaElement;
	const proto =
		element instanceof HTMLTextAreaElement
			? HTMLTextAreaElement.prototype
			: HTMLInputElement.prototype;
	await act(async () => {
		Object.getOwnPropertyDescriptor(proto, "value")!.set!.call(element, value);
		element.dispatchEvent(new Event("input", { bubbles: true }));
		element.dispatchEvent(new Event("change", { bubbles: true }));
	});
};

const field = (label: string) =>
	[...document.body.querySelectorAll("label")].find((l) => l.textContent?.startsWith(label))
		?.control ?? null;

const choose = async (select: Element | null, value: string) => {
	await act(async () => {
		(select as HTMLSelectElement).value = value;
		select!.dispatchEvent(new Event("change", { bubbles: true }));
		select!.dispatchEvent(new FocusEvent("focusout", { bubbles: true }));
	});
};

const chooseSaveFile = async () => {
	const input = container.querySelector('input[type="file"]') as HTMLInputElement;
	const file = new File(["<xml/>"], "Riverland_123", { type: "text/xml" });
	Object.defineProperty(input, "files", { value: [file], configurable: true });
	await act(async () => {
		input.dispatchEvent(new Event("change", { bubbles: true }));
	});
};

const fillCharacter = async () => {
	await type(field("Playthrough name"), "My First Run");
	await type(field("Farm name"), "Sunrise Farm");
	await choose(field("Platform"), "Switch");
};

beforeEach(() => {
	localStorage.clear();
	mocks.search = "";
	mocks.push.mockReset();
	mocks.parseSaveFile.mockReset();
	container = document.createElement("div");
	document.body.appendChild(container);
	root = createRoot(container);
});

afterEach(() => {
	act(() => root.unmount());
	container.remove();
	document.body.querySelectorAll("dialog").forEach((dialog) => dialog.remove());
	vi.restoreAllMocks();
});

describe("New playthrough page", () => {
	it("starts with the two paths and no footer", async () => {
		await mount();

		expect(text()).toContain("Upload save file");
		expect(text()).toContain("Build starter");
		expect(button("Next")).toBeUndefined();
		expect(button("Back")).toBeUndefined();
	});

	it("opens the path named in the address", async () => {
		mocks.search = "path=build";
		await mount();

		expect(text()).toContain("Farm name");
		expect(text()).toContain("Step 2 of 4");
	});

	it("ignores an unknown path in the address", async () => {
		mocks.search = "path=other";
		await mount();

		expect(text()).toContain("How do you want to start?");
	});

	it("goes back to the two paths from step 2", async () => {
		await mount();

		await click(tile("Build starter"));
		await click(button("Back"));

		expect(text()).toContain("How do you want to start?");
	});

	describe("upload path", () => {
		beforeEach(() => {
			mocks.parseSaveFile.mockReturnValue(fakeSave);
		});

		it("keeps Next off until a save file is read", async () => {
			await mount();

			await click(tile("Upload save file"));

			expect(text()).toContain("full save file");
			expect(text()).toContain("Only XML files are supported.");
			expect(button("Next")!.disabled).toBe(true);
		});

		it("does not filter the file picker by extension, because save files have none", async () => {
			await mount();
			await click(tile("Upload save file"));

			const input = container.querySelector('input[type="file"]')!;

			expect(input.getAttribute("accept")).toBeNull();
		});

		it("reads the file, says so, fills the name and enables Next", async () => {
			await mount();
			await click(tile("Upload save file"));

			await chooseSaveFile();

			expect(text()).toContain("Selected: Riverland_123");
			expect(text()).toContain("Save file parsed successfully - Sam from Riverland Farm");
			expect((field("Playthrough name") as HTMLInputElement).value).toBe("Riverland Farm");
			expect(button("Next")!.disabled).toBe(false);
		});

		it("shows the failure and clears an earlier good result", async () => {
			await mount();
			await click(tile("Upload save file"));
			await chooseSaveFile();
			expect(button("Next")!.disabled).toBe(false);

			mocks.parseSaveFile.mockImplementation(() => {
				throw new Error("bad");
			});
			await chooseSaveFile();

			expect(container.querySelector('[role="alert"]')!.textContent).toContain(
				"Failed to parse save file."
			);
			expect(text()).not.toContain("parsed successfully");
			expect(button("Next")!.disabled).toBe(true);
		});

		it("turns Next off when the name is cleared", async () => {
			await mount();
			await click(tile("Upload save file"));
			await chooseSaveFile();

			await type(field("Playthrough name"), "   ");

			expect(button("Next")!.disabled).toBe(true);
		});

		it("reviews the save and the name, platform and description it will be saved as", async () => {
			await mount();
			await click(tile("Upload save file"));
			await chooseSaveFile();
			await type(field("Description"), "Main file");
			await click(button("Next"));

			expect(text()).toContain("Review your playthrough");
			expect(text()).toContain("Will be saved as");
			expect(text()).toContain("Riverland Farm");
			expect(text()).toContain("PC");
			expect(text()).toContain("Main file");
			expect(text()).toContain("Level 5");
		});

		it("saves, makes the first playthrough active, says so and returns to the list", async () => {
			await mount();
			await click(tile("Upload save file"));
			await chooseSaveFile();
			await type(field("Playthrough name"), " Co-op ");
			await click(button("Next"));
			await click(button("Save playthrough"));

			const result = stored()!;
			expect(result.playthroughs).toHaveLength(1);
			expect(result.playthroughs[0]).toMatchObject({ name: "Co-op", platform: "PC" });
			expect(result.activePlaythroughId).toBe(result.playthroughs[0].id);
			expect(text()).toContain("Co-op saved and set active");
			expect(mocks.push).toHaveBeenCalledWith("/playthroughs");
		});

		it("does not make a later playthrough active, and Open overview activates it", async () => {
			const existing = emptyPlaythrough();
			localStorage.setItem(
				STORAGE_KEY,
				JSON.stringify({ playthroughs: [existing], activePlaythroughId: existing.id })
			);
			await mount();
			await click(tile("Upload save file"));
			await chooseSaveFile();
			await click(button("Next"));
			await click(button("Save playthrough"));

			expect(stored()!.activePlaythroughId).toBe(existing.id);
			expect(text()).toContain("Riverland Farm saved");
			expect(text()).not.toContain("set active");

			await click(button("Open overview"));

			const created = stored()!.playthroughs.find((p) => p.name === "Riverland Farm")!;
			expect(stored()!.activePlaythroughId).toBe(created.id);
			expect(mocks.push).toHaveBeenCalledWith("/overview");
		});
	});

	describe("build path", () => {
		beforeEach(() => {
			mocks.search = "path=build";
		});

		it("has no default platform and keeps Next off until the required fields are filled", async () => {
			await mount();

			expect((field("Platform") as HTMLSelectElement).value).toBe("");
			expect(button("Next")!.disabled).toBe(true);

			await type(field("Playthrough name"), "My First Run");
			await type(field("Farm name"), "Sunrise Farm");
			expect(button("Next")!.disabled).toBe(true);

			await choose(field("Platform"), "Switch");
			expect(button("Next")!.disabled).toBe(false);
		});

		it("explains a missing required field once it has been visited", async () => {
			await mount();
			expect(text()).not.toContain("Enter a farm name to continue.");

			await act(async () => {
				field("Farm name")!.dispatchEvent(new FocusEvent("focusout", { bubbles: true }));
			});

			expect(text()).toContain("Enter a farm name to continue.");
		});

		it("shows what the chosen farm type is", async () => {
			await mount();

			await choose(field("Farm type"), "1");

			expect(text()).toContain("Water significantly decreases");
		});

		it("keeps Next off on the bundle step until a path is chosen", async () => {
			await mount();
			await fillCharacter();
			await click(button("Next"));

			expect(text()).toContain("Choose your Community Center path:");
			expect(button("Next")!.disabled).toBe(true);
		});

		it("lets Joja continue at once and saves the membership", async () => {
			await mount();
			await fillCharacter();
			await type(field("Character name"), " Sam ");
			await click(button("Next"));
			await click(tile("Joja Warehouse"));

			expect(text()).toContain("No bundle configuration needed");
			expect(button("Next")!.disabled).toBe(false);

			await click(button("Next"));
			expect(text()).toContain("Joja Warehouse");
			expect(text()).toContain("Sam");
			expect(text()).toContain("Switch");
			await click(button("Save playthrough"));

			const saved = stored()!.playthroughs[0];
			expect(saved).toMatchObject({ name: "My First Run", platform: "Switch" });
			expect(saved.data.joja.isMember).toBe(true);
			expect(saved.data.communityCenter.unlocked).toBe(false);
			expect(saved.data.character).toMatchObject({ name: "Sam", farmName: "Sunrise Farm" });
			expect(saved.data.bundles).toEqual({});
		});

		it("saves the standard Community Center with its bundles active", async () => {
			await mount();
			await fillCharacter();
			await click(button("Next"));
			await click(tile("Community Center"));

			expect(button("Next")!.disabled).toBe(false);
			await click(button("Next"));
			await click(button("Save playthrough"));

			const saved = stored()!.playthroughs[0];
			expect(saved.data.communityCenter).toMatchObject({
				unlocked: true,
				bundlesActive: true,
			});
			expect(saved.data.joja.isMember).toBe(false);
			expect(Object.keys(saved.data.bundles).length).toBeGreaterThan(20);
		});

		it("keeps Next off in remix until a bundle is chosen and counts the room slots", async () => {
			await mount();
			await fillCharacter();
			await click(button("Next"));
			await click(tile("Community Center"));

			const remix = [...document.body.querySelectorAll('input[type="radio"]')].find(
				(input) => input.closest("label")?.textContent?.trim() === "Remix"
			);
			await click(remix);

			expect(text()).toContain("Each room has a limited number of bundle slots.");
			expect(text()).toContain("(0/6 selected)");
			expect(button("Next")!.disabled).toBe(true);
		});

		it("can switch from Joja back to the Community Center and keep the picks", async () => {
			await mount();
			await fillCharacter();
			await click(button("Next"));
			await click(tile("Community Center"));
			await click(tile("Joja Warehouse"));
			await click(tile("Community Center"));

			expect(button("Next")!.disabled).toBe(false);
			expect(document.body.querySelectorAll("details").length).toBeGreaterThan(0);
		});

		it("tells the player when the browser refuses the save", async () => {
			await mount();
			await fillCharacter();
			await click(button("Next"));
			await click(tile("Joja Warehouse"));
			await click(button("Next"));
			vi.stubGlobal("localStorage", {
				getItem: () => null,
				setItem: () => {
					throw new DOMException("full", "QuotaExceededError");
				},
			});
			vi.spyOn(console, "error").mockImplementation(() => {});

			await click(button("Save playthrough"));
			vi.unstubAllGlobals();

			expect(container.querySelector('[role="alert"]')!.textContent).toContain(
				"could not save this playthrough"
			);
			expect(mocks.push).not.toHaveBeenCalledWith("/playthroughs");
		});
	});
});
