import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act } from "react";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import type { AppData } from "@/types/app";
import { PlaythroughProvider } from "@/lib/contexts/PlaythroughContext";
import { UIProvider } from "@/lib/contexts/UIContext";
import { forgetMemoryState } from "@/lib/hooks/useMemoryState";
import { STORAGE_KEY } from "@/service/storage";
import { GrandpaPage } from "@/comps/grandpa/GrandpaPage";
import { ToastProvider } from "@/comps/ui/Toast";
import { emptyPlaythrough } from "../storage/fixtures";

vi.mock("next/navigation", () => ({
	useRouter: () => ({ replace: vi.fn() }),
	usePathname: () => "/grandpa",
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
						<GrandpaPage />
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
const section = (title: string) =>
	[...container.querySelectorAll('[role="region"]')].find(
		(el) => el.querySelector("h2")?.textContent === title
	) as HTMLElement;
const lit = () =>
	[...container.querySelectorAll('[role="img"][aria-label^="Candle"]')].filter((el) =>
		el.getAttribute("aria-label")!.endsWith(", lit")
	).length;

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

const played = (d: AppData["playthroughs"][number]["data"]) => {
	d.character.totalMoneyEarned = 412_000;
	d.skills = {
		farming: { level: 10, xp: 0 },
		fishing: { level: 10, xp: 0 },
		foraging: { level: 10, xp: 0 },
		mining: { level: 6, xp: 0 },
		combat: { level: 6, xp: 0 },
	};
	d.achievements = ["26"];
	d.character.spouse = "Leah";
	d.character.houseUpgradeLevel = 2;
	for (const name of ["Abigail", "Alex", "Elliott", "Emily", "Haley", "Harvey", "Leah"]) {
		d.villagers[name] = { hearts: 8, heartPoints: 2000, eventsSeen: [], status: "" };
	}
	d.pets = [{ name: "Tom", type: "Cat", breed: "", friendship: 820, starter: true }];
	d.communityCenter.completed = true;
	d.mineProgress.hasSkullKey = true;
	d.mineProgress.hasRustyKey = true;
};

describe("Grandpa's evaluation", () => {
	it("shows the score, the candles and the categories for a played farm", async () => {
		seed(withData(played));
		await mount();

		expect(compact()).toContain("Score11/21");
		expect(compact()).toContain("Candles3/4");
		expect(compact()).toContain("Categoriescomplete1/6");
		expect(lit()).toBe(3);
		expect(text()).toContain("1 more point lights the fourth candle.");
		for (const label of ["0+ pts", "4+ pts", "8+ pts", "12+ pts"])
			expect(text()).toContain(label);
	});

	it("lights all four candles and says so at 12 points", async () => {
		seed(
			withData((d) => {
				played(d);
				d.character.totalMoneyEarned = 1_000_000;
				d.communityCenter.ceremonyAttended = true;
			})
		);
		await mount();

		expect(lit()).toBe(4);
		expect(text()).toContain("All four candles are lit.");
	});

	it("says what the next candle needs", async () => {
		seed(withData((d) => (d.character.totalMoneyEarned = 500_000)));
		await mount();

		expect(lit()).toBe(2);
		expect(text()).toContain("3 more points lights the third candle.");
	});

	it("lists the six categories with their points", async () => {
		seed(withData(played));
		await mount();

		for (const [title, badge] of [
			["Earnings", "4 / 7"],
			["Skills", "1 / 2"],
			["Achievements", "1 / 3"],
			["Friendship", "2 / 4"],
			["Community Center", "1 / 3"],
			["Exploration", "2 / 2"],
		]) {
			expect(section(title).textContent).toContain(badge);
		}
	});

	it("shows the earnings tiers with the total earned, no 750,000g tier, and progress to the next", async () => {
		seed(withData(played));
		await mount();
		const earnings = section("Earnings");

		expect(earnings.textContent).toContain(
			"Score is the highest tier reached. Total earned so far: 412,000g."
		);
		expect(earnings.textContent).toContain("The game has no 750,000g tier.");
		expect(earnings.querySelectorAll("li")).toHaveLength(6);
		expect(earnings.textContent).toContain("Total earnings 500,000g");
		expect(earnings.textContent).not.toContain("Total earnings 750,000g");
		expect(earnings.textContent).toContain("412,000 / 500,000g");
		expect(earnings.textContent).toContain("5 / 7");
		expect(earnings.textContent).toContain("7 / 7");
	});

	it("shows skills, achievements and friendship progress", async () => {
		seed(withData(played));
		await mount();

		expect(section("Skills").textContent).toContain("Sum of the five skill levels: 42.");
		expect(section("Skills").textContent).toContain("42 / 50");
		expect(section("Achievements").textContent).toContain(
			"Counts the achievements with ids 5, 26 and 34"
		);
		expect(section("Achievements").textContent).toContain("0 / 95 donated");
		expect(section("Achievements").textContent).toContain("0 / 154 shipped");
		expect(section("Achievements").textContent).not.toContain("caught");
		expect(
			section("Achievements").querySelector('a[href="/farm?tab=character"]')
		).not.toBeNull();
		expect(section("Friendship").textContent).toContain(
			"Villager counts leave out the spouse."
		);
		expect(section("Friendship").textContent).toContain("6 / 10");
		expect(section("Friendship").textContent).toContain("820 / 1,000");
	});

	it("shows the Community Center rooms and the ceremony as not yet", async () => {
		seed(
			withData((d) => {
				played(d);
				d.communityCenter.rooms = {
					...d.communityCenter.rooms,
					craftsRoom: true,
					pantry: true,
				};
			})
		);
		await mount();
		const center = section("Community Center");

		expect(center.textContent).toContain("Rooms complete: 2 / 6.");
		expect(center.textContent).toContain("Ceremony attended");
		expect(center.textContent).toContain("Not yet");
		expect(center.textContent).toContain("0 / 2");
	});

	it("marks earned and unearned rows for screen readers", async () => {
		seed(withData(played));
		await mount();

		expect(section("Exploration").textContent).toContain("Earned");
		expect(section("Earnings").textContent).toContain("Not earned yet");
	});

	it("shows an empty farm with no candle past the first and nothing complete", async () => {
		seed(withData(() => {}));
		await mount();

		expect(compact()).toContain("Score0/21");
		expect(lit()).toBe(1);
		expect(text()).toContain("4 more points lights the second candle.");
	});

	it("explains that it is derived and read only, and has no controls to change a value", async () => {
		seed(withData(played));
		await mount();

		expect(text()).toContain("Derived from this playthrough, read only.");
		expect(container.querySelector('[role="switch"], input, select')).toBeNull();
	});

	it("collapses a section from its heading", async () => {
		seed(withData(played));
		await mount();
		const heading = section("Skills").querySelector("h2 button") as HTMLElement;

		await click(heading);
		expect(heading.getAttribute("aria-expanded")).toBe("false");
	});
});
