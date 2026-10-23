import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act } from "react";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import type { AppData } from "@/types/app";
import { PlaythroughProvider } from "@/lib/contexts/PlaythroughContext";
import { UIProvider } from "@/lib/contexts/UIContext";
import { STORAGE_KEY } from "@/service/storage";
import { OverviewPage } from "@/comps/overview/OverviewPage";
import { ToastProvider } from "@/comps/ui/Toast";
import { emptyPlaythrough, progressedPlaythrough } from "../storage/fixtures";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root;
let container: HTMLElement;

const seed = (data: AppData) => localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

const mount = async () => {
	await act(async () => {
		root.render(
			<UIProvider>
				<ToastProvider>
					<PlaythroughProvider>
						<OverviewPage />
					</PlaythroughProvider>
				</ToastProvider>
			</UIProvider>
		);
	});
};

const text = () => container.textContent ?? "";
const headings = () => [...container.querySelectorAll("h2")].map((h) => h.textContent);

const progressed = progressedPlaythrough();

beforeEach(() => {
	localStorage.clear();
	container = document.createElement("div");
	document.body.appendChild(container);
	root = createRoot(container);
});

afterEach(() => {
	act(() => root.unmount());
	container.remove();
});

describe("Overview page", () => {
	it("shows the empty card with both ways forward when there is no active playthrough", async () => {
		await mount();

		expect(text()).toContain("No active playthrough");
		expect(container.querySelector('a[href="/playthroughs/new"]')).not.toBeNull();
		expect(container.querySelector('a[href="/playthroughs"]')).not.toBeNull();
		expect(headings()).not.toContain("Collections");
	});

	it("shows the empty card when playthroughs exist but none is active", async () => {
		seed({ playthroughs: [emptyPlaythrough()], activePlaythroughId: null });
		await mount();

		expect(text()).toContain("No active playthrough");
	});

	describe("with an active playthrough", () => {
		beforeEach(() => {
			seed({ playthroughs: [progressed], activePlaythroughId: progressed.id });
		});

		it("shows the cards in the order of the board", async () => {
			await mount();

			expect(headings()).toEqual([
				"Skills and tools",
				"Collections",
				"Relationships",
				"Perfection",
				"Key milestones",
				"Mines and monsters",
				"Community Center",
			]);
		});

		it("greets the farm, the date and the spouse", async () => {
			await mount();

			expect(text()).toContain("Riverland Farm · Sam");
			expect(text()).toContain("Fall Day 12, Year 2");
			expect(text()).toContain("Married to Abigail");
		});

		it("leaves out the spouse line and the dot for a blank name", async () => {
			const single = structuredClone(progressed);
			single.data.character.spouse = "";
			single.data.character.name = "";
			seed({ playthroughs: [single], activePlaythroughId: single.id });
			await mount();

			expect(text()).not.toContain("Married to");
			expect(text()).toContain("Riverland Farm");
			expect(text()).not.toContain("Riverland Farm ·");
		});

		it("links each card to its page", async () => {
			await mount();
			const links = [...container.querySelectorAll("h2 + span a, h2 ~ span a")].map((a) =>
				a.getAttribute("href")
			);

			expect(links).toEqual([
				"/farm",
				"/collections",
				"/villagers",
				"/perfection",
				"/mines",
				"/community-center",
			]);
		});

		it("shows the numbers of the stored data", async () => {
			await mount();

			expect(text()).toContain("48,210g");
			expect(text()).toMatch(/\d+% perfection score|perfection score/);
			expect(text()).toContain("/ 72");
			expect(text()).toContain("/ 149");
			expect(text()).toContain("Help Wanted");
		});

		it("names every villager tile and counts the maxed ones", async () => {
			await mount();

			expect(text()).toMatch(/\d+ \/ 34 maxed/);
			expect(text()).toContain("Abigail · spouse");
			expect(text()).toContain("Sebastian");
		});

		it("labels each progress bar for screen readers", async () => {
			await mount();
			const labels = [...container.querySelectorAll('[role="progressbar"]')].map((bar) =>
				bar.getAttribute("aria-label")
			);

			expect(labels.every(Boolean)).toBe(true);
			expect(labels).toContain("Farming");
			expect(labels).toContain("Fish caught");
		});

		it("shows the Joja Development card for a Joja member", async () => {
			const joja = structuredClone(progressed);
			joja.data.joja = {
				isMember: true,
				completed: true,
				developments: { "greenhouse-fix": true, "bus-repair": false },
			};
			seed({ playthroughs: [joja], activePlaythroughId: joja.id });
			await mount();

			expect(headings()).toContain("Joja Development");
			expect(headings()).not.toContain("Community Center");
			expect(text()).toContain("All projects completed");
			expect(text()).toContain("Greenhouse Fix");
			expect(text()).toContain("Not purchased");
		});

		it("says the Skull Cavern has no depth limit and caps its bar", async () => {
			const deep = structuredClone(progressed);
			deep.data.mineProgress.deepestSkullCavernLevel = 130;
			seed({ playthroughs: [deep], activePlaythroughId: deep.id });
			await mount();

			expect(text()).toContain("Level 130 · no depth limit");
			const bar = [...container.querySelectorAll('[role="progressbar"]')].find(
				(el) => el.getAttribute("aria-label") === "Skull Cavern"
			);
			expect(bar?.getAttribute("aria-valuenow")).toBe("100");
		});
	});

	it("renders a brand new playthrough without errors", async () => {
		const brandNew = emptyPlaythrough();
		seed({ playthroughs: [brandNew], activePlaythroughId: brandNew.id });
		await mount();

		expect(headings().length).toBe(7);
		expect(text()).toContain("Basic");
	});
});
