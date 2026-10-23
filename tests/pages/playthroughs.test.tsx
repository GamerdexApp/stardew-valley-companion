import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act } from "react";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import type { AppData, Playthrough } from "@/types/app";
import { PlaythroughProvider } from "@/lib/contexts/PlaythroughContext";
import { UIProvider } from "@/lib/contexts/UIContext";
import { STORAGE_KEY } from "@/service/storage";
import { PlaythroughsPage } from "@/comps/playthroughs/PlaythroughsPage";
import { ToastProvider } from "@/comps/ui/Toast";
import { emptyPlaythrough, progressedPlaythrough } from "../storage/fixtures";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root;
let container: HTMLElement;

const seed = (data: AppData) => localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
const stored = () => JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null") as AppData;

const mount = async () => {
	await act(async () => {
		root.render(
			<UIProvider>
				<ToastProvider>
					<PlaythroughProvider>
						<PlaythroughsPage />
					</PlaythroughProvider>
				</ToastProvider>
			</UIProvider>
		);
	});
};

const buttons = () => [...document.body.querySelectorAll("button")];
const button = (label: string) =>
	buttons().find((b) => b.textContent?.trim() === label) as HTMLButtonElement | undefined;

const click = async (element: Element | undefined | null) => {
	expect(element).toBeTruthy();
	await act(async () => {
		element!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
	});
};

const type = async (input: HTMLInputElement | HTMLTextAreaElement, value: string) => {
	const proto =
		input instanceof HTMLTextAreaElement
			? HTMLTextAreaElement.prototype
			: HTMLInputElement.prototype;
	await act(async () => {
		Object.getOwnPropertyDescriptor(proto, "value")!.set!.call(input, value);
		input.dispatchEvent(new Event("input", { bubbles: true }));
	});
};

const cards = () => [...container.querySelectorAll('[role="group"]')] as HTMLElement[];
const cardNames = () => cards().map((card) => card.querySelector("h2")?.textContent);
const cardButton = (name: string, label: string) =>
	[
		...cards()
			.find((card) => card.querySelector("h2")?.textContent === name)!
			.querySelectorAll("button"),
	].find((b) => b.textContent === label);
const radio = (label: string) =>
	[...document.body.querySelectorAll('input[type="radio"]')].find(
		(input) => input.closest("label")?.textContent?.trim() === label
	);

const make = (
	id: string,
	name: string,
	createdAt: string,
	lastModified: string,
	platform?: Playthrough["platform"]
): Playthrough => ({
	...emptyPlaythrough(),
	id,
	name,
	createdAt,
	lastModified,
	platform,
});

const riverland = {
	...progressedPlaythrough(),
	createdAt: "2026-03-01T10:00:00.000Z",
	lastModified: "2026-05-01T10:00:00.000Z",
};
const sunrise = make(
	"sun",
	"Sunrise Farm",
	"2026-01-10T10:00:00.000Z",
	"2026-07-01T10:00:00.000Z",
	"Switch"
);
const legacy = {
	...make("leg", "Legacy Farm", "2026-02-10T10:00:00.000Z", "2026-06-01T10:00:00.000Z"),
	description: "Restored from an older backup.",
};
const saved: AppData = {
	playthroughs: [riverland, sunrise, legacy],
	activePlaythroughId: riverland.id,
};

beforeEach(() => {
	localStorage.clear();
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

describe("Playthroughs page", () => {
	describe("cards", () => {
		it("shows each playthrough with its facts, newest modified first", async () => {
			seed(saved);
			await mount();

			expect(cardNames()).toEqual(["Sunrise Farm", "Legacy Farm", "Riverland"]);
			const riverlandCard = cards()[2].textContent!;
			expect(riverlandCard).toContain("Fall 12, Year 2");
			expect(riverlandCard).toContain("Sam");
			expect(riverlandCard).toContain("PC");
			expect(riverlandCard).toContain("Created:");
			expect(riverlandCard).toContain("Last modified:");
			expect(cards()[1].textContent).toContain("Not set");
			expect(cards()[1].textContent).toContain("Restored from an older backup.");
		});

		it("marks the active card and offers Set as active on the others", async () => {
			seed(saved);
			await mount();

			expect(cards()[2].textContent).toContain("Active");
			expect(cards()[2].querySelector('a[href="/overview"]')?.textContent).toBe(
				"Open overview"
			);
			expect(cardButton("Sunrise Farm", "Set as active")).toBeDefined();
			expect(cardButton("Riverland", "Set as active")).toBeUndefined();
		});

		it("sets the active playthrough without touching lastModified", async () => {
			seed(saved);
			await mount();

			await click(cardButton("Sunrise Farm", "Set as active"));

			expect(stored().activePlaythroughId).toBe("sun");
			expect(stored().playthroughs.find((p) => p.id === "sun")!.lastModified).toBe(
				sunrise.lastModified
			);
			expect(cards()[0].textContent).toContain("Open overview");
		});
	});

	describe("search, sort and platform", () => {
		it("sorts by name and by date created", async () => {
			seed(saved);
			await mount();

			await click(radio("Name"));
			expect(cardNames()).toEqual(["Legacy Farm", "Riverland", "Sunrise Farm"]);

			await click(radio("Date created"));
			expect(cardNames()).toEqual(["Riverland", "Legacy Farm", "Sunrise Farm"]);
		});

		it("searches by name and shows how many match", async () => {
			seed(saved);
			await mount();

			await type(container.querySelector('input[type="search"]')!, "farm");

			expect(cardNames()).toEqual(["Sunrise Farm", "Legacy Farm"]);
			expect(container.textContent).toContain("Showing 2 of 3 playthroughs");
		});

		it("filters by platform", async () => {
			seed(saved);
			await mount();
			const select = container.querySelector("select")!;

			await act(async () => {
				select.value = "Switch";
				select.dispatchEvent(new Event("change", { bubbles: true }));
			});

			expect(cardNames()).toEqual(["Sunrise Farm"]);
		});

		it("explains an empty result, quotes the search and clears it", async () => {
			seed(saved);
			await mount();

			await type(container.querySelector('input[type="search"]')!, "zzz");

			expect(container.textContent).toContain("No playthroughs match “zzz”");
			expect(cards()).toHaveLength(0);

			await click(button("Clear filters"));

			expect(cards()).toHaveLength(3);
		});

		it("offers Clear filters only while a filter is on", async () => {
			seed(saved);
			await mount();

			expect(button("Clear filters")).toBeUndefined();

			await type(container.querySelector('input[type="search"]')!, "r");

			expect(button("Clear filters")).toBeDefined();
		});
	});

	describe("edit", () => {
		it("opens with the saved values", async () => {
			seed(saved);
			await mount();

			await click(cardButton("Legacy Farm", "Edit"));

			const dialog = document.body.querySelector("dialog")!;
			expect((dialog.querySelector("input") as HTMLInputElement).value).toBe("Legacy Farm");
			expect((dialog.querySelector("textarea") as HTMLTextAreaElement).value).toBe(
				"Restored from an older backup."
			);
		});

		it("saves the name, description and platform and says so", async () => {
			seed(saved);
			await mount();

			await click(cardButton("Legacy Farm", "Edit"));
			const dialog = document.body.querySelector("dialog")!;
			await type(dialog.querySelector("input")!, "  Old Farm ");
			await type(dialog.querySelector("textarea")!, "Mine now");
			await click(radio("Xbox"));
			await click(button("Save"));

			const result = stored().playthroughs.find((p) => p.id === "leg")!;
			expect(result.name).toBe("Old Farm");
			expect(result.description).toBe("Mine now");
			expect(result.platform).toBe("Xbox");
			expect(result.lastModified).not.toBe(legacy.lastModified);
			expect(document.body.textContent).toContain("Playthrough saved");
		});

		it("keeps the dialog open and the data unchanged when the name is blank", async () => {
			seed(saved);
			await mount();

			await click(cardButton("Legacy Farm", "Edit"));
			await type(document.body.querySelector("dialog input")!, "   ");
			await click(button("Save"));

			expect(document.body.textContent).toContain("Enter a name for this playthrough.");
			expect(stored()).toEqual(saved);
		});

		it("clears the platform when Not set is chosen", async () => {
			seed(saved);
			await mount();

			await click(cardButton("Riverland", "Edit"));
			await click(radio("Not set"));
			await click(button("Save"));

			expect(
				stored().playthroughs.find((p) => p.id === riverland.id)!.platform
			).toBeUndefined();
		});

		it("does not save on Cancel and shows fresh values on the next open", async () => {
			seed(saved);
			await mount();

			await click(cardButton("Legacy Farm", "Edit"));
			await type(document.body.querySelector("dialog input")!, "Typed but cancelled");
			await click(button("Cancel"));
			await click(cardButton("Legacy Farm", "Edit"));

			expect(stored()).toEqual(saved);
			expect((document.body.querySelector("dialog input") as HTMLInputElement).value).toBe(
				"Legacy Farm"
			);
		});
	});

	describe("delete", () => {
		it("names the playthrough and keeps the data on Cancel", async () => {
			seed(saved);
			await mount();

			await click(cardButton("Sunrise Farm", "Delete"));

			expect(document.body.textContent).toContain("Delete Sunrise Farm?");
			expect(document.body.textContent).toContain("Switch · 0% perfection");
			await click(button("Cancel"));
			expect(stored()).toEqual(saved);
		});

		it("warns when the playthrough is active and says which one takes over", async () => {
			seed(saved);
			await mount();

			await click(cardButton("Riverland", "Delete"));

			expect(document.body.textContent).toContain("Sunrise Farm becomes active instead.");
		});

		it("warns when the last playthrough is active", async () => {
			seed({ playthroughs: [riverland], activePlaythroughId: riverland.id });
			await mount();

			await click(cardButton("Riverland", "Delete"));

			expect(document.body.textContent).toContain("the only one");
		});

		it("deletes, activates the most recently modified one and offers Undo", async () => {
			seed(saved);
			await mount();

			await click(cardButton("Riverland", "Delete"));
			await click(button("Delete playthrough"));

			expect(stored().playthroughs.map((p) => p.id)).toEqual(["sun", "leg"]);
			expect(stored().activePlaythroughId).toBe("sun");
			expect(document.body.textContent).toContain("Riverland deleted");

			await click(button("Undo"));

			expect(stored()).toEqual(saved);
		});
	});

	describe("empty", () => {
		it("shows the ways to start and where the save file lives", async () => {
			await mount();

			expect(container.textContent).toContain("No playthroughs yet");
			expect(
				container.querySelector('a[href="/playthroughs/new?path=upload"]')
			).not.toBeNull();
			expect(
				container.querySelector('a[href="/playthroughs/new?path=build"]')
			).not.toBeNull();
			expect(container.textContent).toContain("Where is my save file?");
			expect(container.querySelector('input[type="search"]')).toBeNull();
		});
	});

	it("links the header button to the new playthrough page", async () => {
		seed(saved);
		await mount();

		expect(
			container.querySelector('header a[href="/playthroughs/new"]')?.textContent
		).toContain("New playthrough");
	});
});
