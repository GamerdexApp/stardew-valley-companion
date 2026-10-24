import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act } from "react";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import type { AppData } from "@/types/app";
import { PlaythroughProvider } from "@/lib/contexts/PlaythroughContext";
import { UIProvider } from "@/lib/contexts/UIContext";
import { forgetMemoryState } from "@/lib/hooks/useMemoryState";
import { STORAGE_KEY } from "@/service/storage";
import { PerfectionPage } from "@/comps/perfection/PerfectionPage";
import { ToastProvider } from "@/comps/ui/Toast";
import { emptyPlaythrough } from "../storage/fixtures";

vi.mock("next/navigation", () => ({
	useRouter: () => ({ replace: vi.fn() }),
	usePathname: () => "/perfection",
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
						<PerfectionPage />
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
const section = (title: string) =>
	[...container.querySelectorAll('[role="region"]')].find(
		(el) => el.querySelector("h2")?.textContent === title
	) as HTMLElement;
const control = (label: string) =>
	container.querySelector(`[aria-label="${label}"]`) as HTMLInputElement | null;
const rowOf = (name: string) =>
	[...section("Categories").querySelectorAll("li")].find((li) =>
		li.textContent?.includes(name)
	) as HTMLElement;
const opener = (name: string) => control(`Show what is missing for ${name}`);

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
	d.goldenWalnutsFound = 105;
	d.buildings = ["Earth", "Water", "Desert", "Island"].map((kind, index) => ({
		id: String(index),
		type: `${kind} Obelisk`,
		animalCount: 0,
	}));
	d.skills = {
		farming: { level: 9, xp: 0 },
		fishing: { level: 8, xp: 0 },
		foraging: { level: 10, xp: 0 },
		mining: { level: 7, xp: 0 },
		combat: { level: 7, xp: 0 },
	};
	d.perfectionWaiverCount = 2;
};

describe("Perfection page", () => {
	it("shows the score, the categories done and the waivers", async () => {
		seed(withData(played));
		await mount();

		expect(compact()).toContain("Perfectionscore");
		expect(compact()).toContain("Categoriescomplete1/11");
		expect(compact()).toContain("Wai" + "versused2");
		expect(text()).toContain("Progress toward 100% game completion");
	});

	it("explains how the score is built with the real numbers", async () => {
		seed(withData(played));
		await mount();
		const formula = section("How the score is built");

		expect(formula.textContent).toContain("score = min(100, round(");
		expect(formula.textContent).toContain("Weights add up to 100.");
		expect(formula.textContent).toMatch(
			/Weighted sum \d+\.\d of 100 gives \d+\.\d%\. Plus 2 from waivers makes \d+%\./
		);
		expect(formula.textContent).toContain("A category never earns more than its weight.");
	});

	it("lists the eleven categories with count, percent and points of the weight", async () => {
		seed(withData(played));
		await mount();
		const walnuts = rowOf("Golden Walnuts Found");

		expect(section("Categories").querySelectorAll(":scope > div > ul > li")).toHaveLength(11);
		expect(section("Categories").textContent).toContain("1 / 11 complete");
		expect(walnuts.textContent).toContain("105 / 130");
		expect(walnuts.textContent).toContain("81%");
		expect(walnuts.textContent).toContain("4.0 / 5 pts");
		expect(rowOf("Obelisks on Farm").textContent).toContain("4 / 4");
		expect(rowOf("Obelisks on Farm").textContent).toContain("4.0 / 4 pts");
		expect(rowOf("Golden Clock on Farm").textContent).toContain("0.0 / 10 pts");
	});

	it("has no way to open a category that is complete", async () => {
		seed(withData(played));
		await mount();

		expect(opener("Obelisks on Farm")).toBeNull();
		expect(opener("Golden Clock on Farm")).not.toBeNull();
	});

	it("opens what is missing in place and closes it again", async () => {
		seed(withData(played));
		await mount();
		const button = opener("Golden Clock on Farm")!;
		const region = container.querySelector(
			`#${CSS.escape(button.getAttribute("aria-controls")!)}`
		) as HTMLElement;

		expect(button.getAttribute("aria-expanded")).toBe("false");
		expect(region.hidden).toBe(true);
		await click(button);
		expect(button.getAttribute("aria-expanded")).toBe("true");
		expect(region.hidden).toBe(false);
		expect(region.textContent).toContain("Missing (1)");
		expect(region.textContent).toContain("Gold Clock");
		await click(button);
		expect(region.hidden).toBe(true);
	});

	it("shows the skill levels still missing with their levels", async () => {
		seed(withData(played));
		await mount();

		await click(opener("Farmer Level"));

		const farmer = rowOf("Farmer Level").textContent!;
		expect(farmer).toContain("41 / 50");
		expect(farmer).toContain("Skill levels still missing");
		expect(farmer).toContain("Farming 9 of 10");
		expect(farmer).toContain("Fishing 8 of 10");
		expect(farmer).toContain("Mining 7 of 10");
		expect(farmer).not.toContain("Foraging");
	});

	it("shows eight missing items and the rest on request", async () => {
		seed(withData(played));
		await mount();

		await click(opener("Cooking Recipes Made"));
		const region = rowOf("Cooking Recipes Made");

		expect(region.textContent).toContain("Missing (81)");
		expect(region.querySelectorAll("ul li")).toHaveLength(8);
		expect(region.textContent).toContain("and 73 more. Show all");
		await click(
			[...region.querySelectorAll("button")].find((b) => b.textContent?.includes("Show all"))
		);
		expect(region.querySelectorAll("ul li")).toHaveLength(81);
		expect(region.textContent).toContain("Show fewer");
	});

	it("steps and types the waivers and updates the score", async () => {
		seed(withData(played));
		await mount();
		const waivers = section("Perfection waivers");

		expect(waivers.textContent).toContain("2 used");
		expect(waivers.textContent).toContain("Score boost from waivers: +2%");
		await click(control("Raise waivers used"));
		expect(data().perfectionWaiverCount).toBe(3);
		expect(waivers.textContent).toContain("Score boost from waivers: +3%");
		await type(control("Waivers used"), "0");
		expect(data().perfectionWaiverCount).toBe(0);
		expect(control("Lower waivers used")!.hasAttribute("disabled")).toBe(true);
		expect(section("How the score is built").textContent).toContain("Plus 0 from waivers");
	});

	it("explains what a waiver costs and how to get one", async () => {
		seed(withData(() => {}));
		await mount();
		const waivers = section("Perfection waivers").textContent!;

		expect(waivers).toContain("Each waiver adds 1% to your score.");
		expect(waivers).toContain("Cost per waiver: 500,000g.");
		expect(waivers).toContain("Perfection Tracker statue in Qi's Walnut Room");
	});

	it("scores 100% with every category full and shows it in green", async () => {
		seed(
			withData((d) => {
				d.perfectionWaiverCount = 100;
			})
		);
		await mount();

		expect(compact()).toContain("Perfectionscore100%");
	});

	it("collapses a section from its heading", async () => {
		seed(withData(played));
		await mount();
		const heading = section("Perfection waivers").querySelector("h2 button") as HTMLElement;

		await click(heading);
		expect(heading.getAttribute("aria-expanded")).toBe("false");
	});
});
