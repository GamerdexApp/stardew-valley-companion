import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act } from "react";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import type { AppData } from "@/types/app";
import { PlaythroughProvider } from "@/lib/contexts/PlaythroughContext";
import { UIProvider } from "@/lib/contexts/UIContext";
import { forgetMemoryState } from "@/lib/hooks/useMemoryState";
import { chooseRoute } from "@/service/communityCenter";
import { STORAGE_KEY } from "@/service/storage";
import { CommunityCenterPage } from "@/comps/community-center/CommunityCenterPage";
import { ToastProvider } from "@/comps/ui/Toast";
import { emptyPlaythrough } from "../storage/fixtures";

const navigation = vi.hoisted(() => ({ search: "", replace: vi.fn() }));

vi.mock("next/navigation", () => ({
	useRouter: () => ({ replace: navigation.replace }),
	usePathname: () => "/community-center",
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
						<CommunityCenterPage />
					</PlaythroughProvider>
				</ToastProvider>
			</UIProvider>
		);
	});
};

const text = () => container.textContent ?? "";
const compact = () => text().replace(/\s/g, "");
const data = () => stored().playthroughs[0].data;
const click = async (element: Element | null | undefined) => {
	expect(element).toBeTruthy();
	await act(async () => {
		element!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
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
	container.querySelector(`[aria-label="${label}"]`) as HTMLElement | null;
const radio = (label: string) =>
	[...container.querySelectorAll('input[type="radio"]')].find(
		(input) => input.closest("label")?.textContent?.trim() === label
	) as HTMLInputElement;
const tabButton = (label: string) =>
	[...container.querySelectorAll('[role="tab"]')].find((tab) =>
		tab.textContent?.startsWith(label)
	)!;
const toastUndo = () =>
	[...document.body.querySelectorAll("button")].find((b) => b.textContent === "Undo");
const bundleTitles = (room: string) =>
	[...section(room).querySelectorAll("span.font-semibold")].map((el) => el.textContent!);

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

const standardCenter = () =>
	withData((d) => {
		const data = chooseRoute(d, "community-center");
		Object.assign(d, data);
	});

describe("route", () => {
	it("shows the Community Center for a farm on that route, with a link to change the decision", async () => {
		seed(withData(() => {}));
		await mount();
		const link = container.querySelector('a[href="/settings"]') as HTMLAnchorElement;

		expect(text()).toContain("This farm is on the Community Center route.");
		expect(link.textContent).toBe("Change decision");
		expect(container.querySelector('[role="tab"]')).toBeNull();
		expect(text()).not.toContain("Development projects");
		expect(text()).toContain("Rooms complete");
	});

	it("shows only Joja Development for a Joja farm", async () => {
		seed(withData((d) => (d.joja.isMember = true)));
		await mount();

		expect(text()).toContain("This farm is on the Joja route.");
		expect(container.querySelector('a[href="/settings"]')?.textContent).toBe("Change decision");
		expect(text()).toContain("Development projects");
		expect(text()).toContain("Active member. Community development projects are available.");
		expect(text()).not.toContain("Bundle set");
		expect(text()).not.toContain("Crafts Room");
	});

	it("names the page by the route", async () => {
		seed(withData((d) => (d.joja.isMember = true)));
		await mount();

		expect(container.querySelector("h1")?.textContent).toBe("Joja Development");
		expect(text()).toContain("Joja route · 0 of 5 projects");
	});

	it("does not change the route from the page", async () => {
		seed(withData(() => {}));
		await mount();

		expect(container.querySelector('input[type="radio"][value="joja"]')).toBeNull();
	});
});

describe("Community Center tab", () => {
	it("shows seven tiles and six rooms with their slot counts", async () => {
		seed(standardCenter());
		await mount();

		for (const expected of [
			"UnlockedYes",
			"Bundlesactive" + "Yes",
			"Roomscomplete0/6",
			"Bundlescomplete0/30",
			"CompletedNo",
			"CeremonyNotyet",
			"JojaabandonedNo",
		]) {
			expect(compact()).toContain(expected);
		}
		for (const [room, count] of [
			["Crafts Room", 6],
			["Pantry", 6],
			["Fish Tank", 6],
			["Boiler Room", 3],
			["Bulletin Board", 5],
			["Vault", 4],
		] as const) {
			expect(bundleTitles(room)).toHaveLength(count);
			expect(section(room).textContent).toContain(`0 / ${count} complete`);
		}
		expect(bundleTitles("Crafts Room")[0]).toBe("Spring Foraging Bundle");
	});

	it("hands in an item and shows the bundle as complete when all its items are in", async () => {
		seed(standardCenter());
		await mount();

		for (const item of ["Wild Horseradish", "Daffodil", "Leek"]) {
			await click(control(`${item} for Spring Foraging Bundle`));
		}
		expect(section("Crafts Room").textContent).toContain("3 / 4 items");
		expect(section("Crafts Room").textContent).toContain("0 / 6 complete");
		await click(control("Dandelion for Spring Foraging Bundle"));

		expect(section("Crafts Room").textContent).toContain("1 / 6 complete");
		expect(compact()).toContain("Bundlescomplete1/30");
		expect(Object.values(data().bundles["Crafts Room/13"])).toEqual([true, true, true, true]);
	});

	it("sets every item of a bundle and clears them", async () => {
		seed(standardCenter());
		await mount();

		await click(control("Mark every item of Spring Foraging Bundle"));
		expect(section("Crafts Room").textContent).toContain("1 / 6 complete");
		await click(control("Clear every item of Spring Foraging Bundle"));
		expect(section("Crafts Room").textContent).toContain("0 / 6 complete");
	});

	it("pays a gold bundle of the Vault", async () => {
		seed(standardCenter());
		await mount();

		await click(
			[...section("Vault").querySelectorAll("button[aria-pressed]")].find((b) =>
				b.textContent?.startsWith("2,500g required")
			) as HTMLElement
		);

		expect(section("Vault").textContent).toContain("1 / 4 complete");
		expect(section("Vault").textContent).toContain("1 / 1 paid");
		expect(section("Vault").textContent).toContain("Paid");
	});

	it("marks a room complete with Undo, which locks its items and counts every bundle", async () => {
		seed(standardCenter());
		await mount();

		await click(control("Crafts Room complete"));

		expect(data().communityCenter.rooms.craftsRoom).toBe(true);
		expect(section("Crafts Room").textContent).toContain("6 / 6 complete");
		expect(section("Crafts Room").textContent).toContain(
			"This room is marked complete, so its items are locked."
		);
		expect(control("Daffodil for Spring Foraging Bundle")!.hasAttribute("disabled")).toBe(true);
		expect(compact()).toContain("Roomscomplete1/6");
		expect(document.body.textContent).toContain("Crafts Room marked complete.");
		await click(toastUndo());
		expect(data().communityCenter.rooms.craftsRoom).toBe(false);
	});

	it("completes the Community Center after six rooms and shows the note", async () => {
		seed(standardCenter());
		await mount();

		for (const room of [
			"Crafts Room",
			"Pantry",
			"Fish Tank",
			"Boiler Room",
			"Bulletin Board",
			"Vault",
		]) {
			await click(control(`${room} complete`));
		}

		expect(data().communityCenter.completed).toBe(true);
		expect(compact()).toContain("CompletedYes");
		expect(text()).toContain(
			"The save file stops tracking which items sit in each bundle slot"
		);
		expect(compact()).toContain("Bundlescomplete30/30");
	});

	it("sets the ceremony and the abandoned JojaMart, and then shows The Missing Bundle", async () => {
		seed(standardCenter());
		await mount();

		expect(text()).toContain(
			"Turn on Abandoned JojaMart unlocked to track The Missing Bundle."
		);
		await click(control("Ceremony attended"));
		await click(control("Abandoned JojaMart unlocked"));

		expect(data().communityCenter).toMatchObject({
			ceremonyAttended: true,
			jojaAbandoned: true,
		});
		expect(compact()).toContain("CeremonyAttended");
		expect(section("Abandoned JojaMart").textContent).toContain("The Missing Bundle");
		await click(control("Wine for The Missing Bundle"));
		expect(
			Object.values(data().bundles["Abandoned Joja Mart/36"]).filter(Boolean)
		).toHaveLength(1);
	});
});

describe("Remix", () => {
	it("switches to Remix with empty slots and Undo, and back to Standard", async () => {
		seed(standardCenter());
		await mount();

		await click(radio("Remix"));

		expect(Object.keys(data().bundles)).toEqual([]);
		expect(section("Crafts Room").querySelectorAll("select")).toHaveLength(6);
		expect(document.body.textContent).toContain("Switched to Remix.");
		await click(toastUndo());
		expect(Object.keys(data().bundles)).toHaveLength(30);
		await click(radio("Remix"));
		await click(radio("Standard"));
		expect(Object.keys(data().bundles)).toHaveLength(30);
	});

	it("picks a bundle for a slot from the pool of its room and shows it", async () => {
		seed(standardCenter());
		await mount();
		await click(radio("Remix"));
		const slot = control("Crafts Room slot 1 bundle") as HTMLSelectElement;
		const options = [...slot.options].map((option) => option.textContent);

		expect(options.length).toBeGreaterThan(7);
		expect(options.some((option) => option?.includes("(Remix)"))).toBe(true);
		await choose(slot, "Crafts Room/13");

		expect(bundleTitles("Crafts Room")).toContain("Spring Foraging Bundle");
		expect(section("Crafts Room").querySelectorAll("select")).toHaveLength(6);
		expect(data().bundles["Crafts Room/13"]).toEqual({
			"0": false,
			"1": false,
			"2": false,
			"3": false,
		});
	});

	it("does not offer a bundle that another slot of the room already holds", async () => {
		seed(standardCenter());
		await mount();
		await click(radio("Remix"));
		await choose(control("Crafts Room slot 1 bundle") as HTMLSelectElement, "Crafts Room/13");

		const next = control("Crafts Room slot 2 bundle") as HTMLSelectElement;

		expect([...next.options].some((option) => option.value === "Crafts Room/13")).toBe(false);
	});

	it("takes a bundle out of its slot", async () => {
		seed(standardCenter());
		await mount();
		await click(radio("Remix"));
		await choose(control("Crafts Room slot 1 bundle") as HTMLSelectElement, "Crafts Room/13");
		await choose(control("Crafts Room slot 1 bundle") as HTMLSelectElement, "");

		expect(Object.keys(data().bundles)).toEqual([]);
	});

	it("counts a remix bundle complete when enough of its items are handed in", async () => {
		seed(standardCenter());
		await mount();
		await click(radio("Remix"));
		const remixOption = [
			...(control("Artisan slot") ?? document.createElement("select")).children,
		];
		const slot = control("Pantry slot 1 bundle") as HTMLSelectElement;
		const many = [...slot.options].find((option) => option.textContent?.includes("Artisan"));
		expect(remixOption).toBeDefined();
		expect(many).toBeTruthy();
		await choose(slot, many!.value);

		expect(section("Pantry").textContent).toContain("0 / 6 items");
		expect(section("Pantry").textContent).toContain("Select 6 of 12 items.");
	});
});

describe("Joja tab", () => {
	it("shows the membership, three tiles and five projects", async () => {
		seed(withData((d) => (d.joja.isMember = true)));
		await mount();

		expect(text()).toContain("Active member. Community development projects are available.");
		expect(compact()).toContain("Projectscomplete0/5");
		expect(compact()).toContain("Totalinvested0g");
		expect(compact()).toContain("Remainingcost135,000g");
		expect(section("Development projects").textContent).toContain("0 / 5 purchased");
		expect(section("Development projects").querySelectorAll('[role="switch"]')).toHaveLength(6);
		expect(section("Development projects").textContent).toContain("Unlocks: Minecarts");
	});

	it("buys a project with Undo and updates the invested and remaining costs", async () => {
		seed(withData((d) => (d.joja.isMember = true)));
		await mount();

		await click(control("Bridge purchased"));

		expect(data().joja.developments["jojaCraftsRoom"]).toBe(true);
		expect(compact()).toContain("Totalinvested25,000g");
		expect(compact()).toContain("Remainingcost110,000g");
		expect(document.body.textContent).toContain("Bridge marked purchased.");
		await click(toastUndo());
		expect(data().joja.developments["jojaCraftsRoom"]).toBeFalsy();
	});

	it("ticks all five with All developed, and turns it on by itself when the fifth is bought", async () => {
		seed(withData((d) => (d.joja.isMember = true)));
		await mount();

		await click(control("All developed"));
		expect(Object.values(data().joja.developments)).toEqual([true, true, true, true, true]);
		expect(data().joja.completed).toBe(true);
		await click(control("Bus purchased"));
		expect(control("All developed")!.getAttribute("aria-checked")).toBe("false");
		expect(data().joja.completed).toBe(false);
		await click(control("Bus purchased"));
		expect(control("All developed")!.getAttribute("aria-checked")).toBe("true");
	});
});
