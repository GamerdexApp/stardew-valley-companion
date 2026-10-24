import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act } from "react";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import type { AppData } from "@/types/app";
import { PlaythroughProvider } from "@/lib/contexts/PlaythroughContext";
import { UIProvider } from "@/lib/contexts/UIContext";
import { forgetMemoryState } from "@/lib/hooks/useMemoryState";
import { STORAGE_KEY } from "@/service/storage";
import { CollectionsPage } from "@/comps/collections/CollectionsPage";
import { ToastProvider } from "@/comps/ui/Toast";
import { emptyPlaythrough } from "../storage/fixtures";

const navigation = vi.hoisted(() => ({ search: "", replace: vi.fn() }));

vi.mock("next/navigation", () => ({
	useRouter: () => ({ replace: navigation.replace }),
	usePathname: () => "/collections",
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
						<CollectionsPage />
					</PlaythroughProvider>
				</ToastProvider>
			</UIProvider>
		);
	});
};

const text = () => container.textContent ?? "";
const namesShown = () =>
	[...container.querySelectorAll("span.font-semibold")].map((el) => el.textContent!);
const cardOf = (name: string) =>
	[...container.querySelectorAll("span.font-semibold")]
		.find((el) => el.textContent === name)!
		.closest("div.flex.flex-col.gap-2\\.5") as HTMLElement;
const shippedSwitch = (name: string) =>
	container.querySelector(`[role="switch"][aria-label="${name} shipped"]`) as HTMLElement;
const savedData = () => stored().playthroughs[0].data;
const searchBox = () => container.querySelector('input[type="search"]') as HTMLInputElement;
const click = async (element: Element | null | undefined) => {
	expect(element).toBeTruthy();
	await act(async () => {
		element!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
	});
};

const type = async (input: HTMLInputElement, value: string) => {
	await act(async () => {
		Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(
			input,
			value
		);
		input.dispatchEvent(new Event("input", { bubbles: true }));
	});
};

const toastButton = (label: string) =>
	[...document.body.querySelectorAll("button")].find((b) => b.textContent === label);
const flyout = () =>
	[...document.body.querySelectorAll("dialog")].find((el) =>
		el.textContent?.includes("Changes apply as you go")
	);
const openFilters = async () =>
	click(
		[...container.querySelectorAll("button")].find((b) => b.textContent?.startsWith("Filters"))
	);
const flyoutRadio = (label: string) =>
	[...flyout()!.querySelectorAll('input[type="radio"]')].find(
		(input) => input.closest("label")?.textContent?.trim() === label
	);
const reset = () =>
	click([...flyout()!.querySelectorAll("button")].find((b) => b.textContent === "Reset"));

beforeEach(() => {
	forgetMemoryState();
	localStorage.clear();
	navigation.search = "tab=rarecrows";
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

const switchOf = (name: string, suffix: string) =>
	container.querySelector(`[role="switch"][aria-label="${name} ${suffix}"]`) as HTMLElement;

describe("Collections rarecrows tab", () => {
	it("shows the tiles and the 8 rarecrows", async () => {
		seed(withData(() => {}));
		await mount();
		const tiles = text().replace(/\s/g, "");

		expect(tiles).toContain("Obtained0/8");
		expect(tiles).toContain("Remaining8");
		expect(namesShown()).toHaveLength(8);
	});

	it("puts the obtained count on the pill and in the subline", async () => {
		seed(
			withData((data) => {
				data.rarecrows = ["110", "113"];
			})
		);
		await mount();

		const selected = container.querySelector('[role="tab"][aria-selected="true"]');
		expect(selected?.textContent).toBe("Rarecrows2 / 8");
		expect(text()).toContain("2 of 8 obtained");
		expect(text().replace(/\s/g, "")).toContain("Remaining6");
	});

	it("shows how to obtain each one", async () => {
		seed(withData(() => {}));
		await mount();

		expect(cardOf("Rarecrow 1").textContent).toContain("Stardew Valley Fair");
		expect(cardOf("Rarecrow 1").textContent).toContain("Missing");
	});

	it("puts the switch and its state in the top right corner of the card", async () => {
		seed(withData(() => {}));
		await mount();
		const header = cardOf("Rarecrow 3").firstElementChild as HTMLElement;
		const corner = switchOf("Rarecrow 3", "obtained").parentElement as HTMLElement;

		expect(header.lastElementChild).toBe(corner);
		expect(corner.textContent).toContain("Missing");
	});

	it("saves the id when switched on and takes it out when switched off, with no toast", async () => {
		seed(withData(() => {}));
		await mount();

		await click(switchOf("Rarecrow 3", "obtained"));
		expect(savedData().rarecrows).toEqual(["126"]);
		expect(cardOf("Rarecrow 3").textContent).toContain("Obtained");
		await click(switchOf("Rarecrow 3", "obtained"));
		expect(savedData().rarecrows).toEqual([]);
		expect(document.body.textContent).not.toContain("Undo");
	});

	it("filters by status and searches", async () => {
		seed(
			withData((data) => {
				data.rarecrows = ["110"];
			})
		);
		await mount();
		await openFilters();

		await click(flyoutRadio("Obtained"));
		expect(namesShown()).toEqual(["Rarecrow 1"]);
		await reset();
		await click(flyoutRadio("Missing"));
		expect(namesShown()).toHaveLength(7);
		await reset();
		await type(searchBox(), "rarecrow 4");
		expect(namesShown()).toEqual(["Rarecrow 4"]);
	});

	it("shows a no match state with a clear button", async () => {
		seed(withData(() => {}));
		await mount();

		await type(searchBox(), "zzzz");
		expect(text()).toContain("No rarecrows match your search.");
		await click(
			[...container.querySelectorAll("button")].find((b) => b.textContent === "Clear filters")
		);
		expect(namesShown()).toHaveLength(8);
	});
});
